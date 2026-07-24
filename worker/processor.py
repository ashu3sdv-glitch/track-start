"""Compact production renderer for TrackStart Gentle Clean v0.3."""
import json, math, subprocess
from pathlib import Path
import numpy as np

MAX_DURATION=300; MAX_STEMS=12

def call(args, capture=False):
    result=subprocess.run(args,check=True,stdout=subprocess.PIPE if capture else None,text=capture)
    return result.stdout if capture else None

def probe(path):
    data=json.loads(call(['ffprobe','-v','error','-show_entries','stream=sample_rate,channels,duration','-of','json',str(path)],True))['streams'][0]
    return {'sample_rate':int(data['sample_rate']),'channels':int(data['channels']),'duration':float(data.get('duration') or 0)}

def mono(path,rate=24000):
    out=subprocess.run(['ffmpeg','-v','error','-i',str(path),'-ac','1','-ar',str(rate),'-f','f32le','pipe:1'],check=True,stdout=subprocess.PIPE).stdout
    return np.frombuffer(out,dtype='<f4')

def rank(values):
    order=np.argsort(values,kind='stable'); result=np.empty_like(order,dtype=float); result[order]=np.arange(len(values))
    return result/max(1,len(values)-1)

def analyze(path,sensitivity=1.0):
    info=probe(path)
    if info['duration']<=0 or info['duration']>MAX_DURATION+.01: raise ValueError(f'{path.name}: duration must be 1..300 seconds')
    audio=mono(path); size=4096; hop=1024; window=np.hanning(size); freq=np.fft.rfftfreq(size,1/24000)
    bands={'presence':(2000,5000),'sibilance':(5000,9000),'air':(9000,12000),'sub':(20,60),'audible':(20,12000)}
    masks={k:(freq>=lo)&(freq<hi) for k,(lo,hi) in bands.items()}; rows=[]
    for pos in range(0,len(audio)-size+1,hop):
        chunk=audio[pos:pos+size]; power=np.abs(np.fft.rfft(chunk*window))**2; total=float(power[masks['audible']].sum())+1e-20
        rows.append({'start':pos/24000,'end':(pos+size)/24000,'rms':20*math.log10(max(float(np.sqrt(np.mean(chunk.astype(float)**2))),1e-12)),
            **{k:float(power[masks[k]].sum()/total) for k in ('presence','sibilance','air','sub')}})
    name=path.stem.lower(); vocal=any(x in name for x in ('vocal','voice','lead','backing','вокал','голос')); drums=any(x in name for x in ('drum','percussion','cymbal','hat','удар','перкус'))
    if not rows: return {'file':path.name,**info,'role':'other','intervals':[]}
    rms=np.array([x['rms'] for x in rows]); active=rms>max(-48,float(np.percentile(rms,25))); found=[]
    specs=[]
    if vocal: specs += [('sibilance',{'type':'eq','frequency_hz':6900,'width_hz':3600,'gain_db':-2.0}),('presence',{'type':'eq','frequency_hz':3400,'width_hz':2400,'gain_db':-1.4})]
    if drums: specs += [('air',{'type':'eq','frequency_hz':10200,'width_hz':5000,'gain_db':-1.5})]
    if not any(x in name for x in ('bass','kick','drum','бас','бочк')): specs += [('sub',{'type':'highpass','frequency_hz':28})]
    for metric,filt in specs:
        values=np.array([x[metric] for x in rows]); ranks=rank(values); cutoff=.99975-.00125*sensitivity; floor=float(np.percentile(values[active],90))*1.25 if np.any(active) else float('inf')
        for row,value,score,on in zip(rows,values,ranks,active):
            if on and score>=cutoff and value>=floor: found.append({'start':row['start'],'end':row['end'],'score':float(score),'metric':metric,'filter':filt})
    found.sort(key=lambda x:(json.dumps(x['filter'],sort_keys=True),x['start'])); merged=[]
    for item in found:
        if merged and item['filter']==merged[-1]['filter'] and item['start']<=merged[-1]['end']+.18:
            merged[-1]['end']=max(merged[-1]['end'],item['end']); merged[-1]['score']=max(merged[-1]['score'],item['score'])
        else: merged.append(dict(item))
    for x in merged: x['start']=round(max(0,x['start']-.1),3); x['end']=round(x['end']+.1,3); x['score']=round(x['score'],3)
    merged=[x for x in merged if x['end']-x['start']<=2.5]; selected=[]
    for item in sorted(merged,key=lambda x:-x['score'])[:8]:
        if not any(item['start']<old['end'] and item['end']>old['start'] for old in selected): selected.append(item)
    return {'file':path.name,**info,'role':'vocal' if vocal else 'percussive' if drums else 'other','intervals':sorted(selected,key=lambda x:x['start'])}

def chain(intervals):
    out=[]
    for item in intervals:
        start=float(item['start']); end=max(start+.05,float(item['end'])-.1); enable=f"between(t,{start:.3f},{end:.3f})"; spec=item['filter']
        if spec['type']=='eq': out.append(f"equalizer=f={spec['frequency_hz']}:t=h:w={spec['width_hz']}:g={spec['gain_db']}:enable='{enable}'")
        else: out.append(f"highpass=f={spec['frequency_hz']}:p=2:enable='{enable}'")
    return ','.join(out) or 'anull'

def mix(files,out):
    cmd=['ffmpeg','-y','-v','error']; [cmd.extend(['-i',str(x)]) for x in files]; labels=''.join(f'[{i}:a]' for i in range(len(files)))
    call(cmd+['-filter_complex',f'{labels}amix=inputs={len(files)}:normalize=0:dropout_transition=0[m]','-map','[m]','-c:a','pcm_s24le',str(out)])

def process(input_dir,output_dir):
    files=sorted(x for x in Path(input_dir).iterdir() if x.suffix.lower() in ('.wav','.flac'))
    if not 1<=len(files)<=MAX_STEMS: raise ValueError('invalid stem count')
    output_dir=Path(output_dir); stems_dir=output_dir/'stems'; stems_dir.mkdir(parents=True,exist_ok=True)
    plan={'schema_version':3,'generator':'TrackStart Song Health Gentle Clean v0.3','source_dir':str(input_dir),'stems':[]}; processed=[]
    for src in files:
        stem=analyze(src); plan['stems'].append(stem); dst=stems_dir/f'{src.stem} selective.wav'
        call(['ffmpeg','-y','-v','error','-i',str(src),'-af',chain(stem['intervals']),'-c:a','pcm_s24le',str(dst)]); processed.append(dst)
    mix(files,output_dir/'A_raw_sum.wav'); mix(processed,output_dir/'B_selective_sum.wav')
    (output_dir/'plan.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n',encoding='utf-8'); return plan
