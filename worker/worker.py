import json, os, shutil, tempfile, time, urllib.parse, zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
import requests
from processor import process

BASE=os.environ['SUPABASE_URL'].rstrip('/'); KEY=os.environ['SUPABASE_SERVICE_ROLE_KEY']; NAME=os.getenv('WORKER_NAME','song-health-1')
HEAD={'apikey':KEY,'Authorization':f'Bearer {KEY}'}

def request(method,path,**kwargs):
    headers={**HEAD,**kwargs.pop('headers',{})}; response=requests.request(method,BASE+path,headers=headers,timeout=120,**kwargs)
    response.raise_for_status(); return response.json() if response.content else None

def update(job_id,data):
    request('PATCH',f'/rest/v1/song_health_jobs?id=eq.{job_id}',headers={'Content-Type':'application/json','Prefer':'return=minimal'},json=data)

def cleanup_expired():
    now=datetime.now(timezone.utc).isoformat(); query=urllib.parse.urlencode({'status':'eq.ready','expires_at':f'lt.{now}','select':'id,output_path'})
    for job in request('GET',f'/rest/v1/song_health_jobs?{query}') or []:
        if job.get('output_path'):
            requests.delete(f'{BASE}/storage/v1/object/song-health-results',headers={**HEAD,'Content-Type':'application/json'},
                json={'prefixes':[job['output_path']]},timeout=120).raise_for_status()
        update(job['id'],{'status':'expired','output_path':None,'updated_at':now})

def one():
    jobs=request('POST','/rest/v1/rpc/claim_song_health_job',headers={'Content-Type':'application/json'},json={'worker_name':NAME}) or []
    if not jobs: return False
    job=jobs[0]; root=Path(tempfile.mkdtemp(prefix='song-health-'))
    manifest=job.get('input_manifest') or []
    try:
        inputs=root/'inputs'; result=root/'result'; inputs.mkdir(); result.mkdir()
        for item in manifest:
            encoded=urllib.parse.quote(item['path'],safe='/'); data=requests.get(f'{BASE}/storage/v1/object/song-health-inputs/{encoded}',headers=HEAD,timeout=300)
            data.raise_for_status(); (inputs/item['name']).write_bytes(data.content)
        plan=process(inputs,result); archive=root/f"{job['id']}.zip"
        with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,allowZip64=True) as bundle:
            for path in result.rglob('*'):
                if path.is_file(): bundle.write(path,path.relative_to(result))
        output_path=f"{job['user_id']}/{job['id']}.zip"; encoded=urllib.parse.quote(output_path,safe='/')
        with archive.open('rb') as body:
            response=requests.post(f'{BASE}/storage/v1/object/song-health-results/{encoded}',headers={**HEAD,'Content-Type':'application/zip','x-upsert':'true'},data=body,timeout=600)
        response.raise_for_status()
        update(job['id'],{'status':'ready','output_path':output_path,'plan':plan,'completed_at':datetime.now(timezone.utc).isoformat(),
            'expires_at':(datetime.now(timezone.utc)+timedelta(hours=24)).isoformat(),'updated_at':datetime.now(timezone.utc).isoformat()})
    except Exception as exc:
        update(job['id'],{'status':'failed','error':str(exc)[:1000],'updated_at':datetime.now(timezone.utc).isoformat()})
    finally:
        paths=[x.get('path') for x in manifest if x.get('path')]
        if paths:
            try: requests.delete(f'{BASE}/storage/v1/object/song-health-inputs',headers={**HEAD,'Content-Type':'application/json'},json={'prefixes':paths},timeout=120).raise_for_status()
            except Exception as exc: print(f'input cleanup error: {exc}',flush=True)
        shutil.rmtree(root,ignore_errors=True)
    return True

while True:
    try:
        cleanup_expired()
        if not one(): time.sleep(5)
    except Exception as exc:
        print(f'worker loop error: {exc}',flush=True); time.sleep(10)
