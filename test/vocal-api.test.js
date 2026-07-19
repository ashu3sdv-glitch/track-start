import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import handler from '../api/vocal.js';

function responseStub() {
  return { headers:{}, statusCode:200, payload:null, setHeader(name,value){this.headers[name]=value;}, status(code){this.statusCode=code;return this;}, json(payload){this.payload=payload;return this;} };
}

test('requires Pro after the free vocal map was used', async () => {
  process.env.TRIAL_COOKIE_SECRET = 'vocal-trial-test';
  const signature = crypto.createHmac('sha256', 'vocal-trial-test').update('used').digest('hex');
  const req = { method:'POST', headers:{ origin:'https://www.trackstart.art', cookie:`ts_vocal_trial=used.${signature}` }, body:{} };
  const res = responseStub();
  await handler(req, res);
  assert.equal(res.statusCode, 402);
  assert.equal(res.payload.code, 'PRO_REQUIRED');
  delete process.env.TRIAL_COOKIE_SECRET;
});
