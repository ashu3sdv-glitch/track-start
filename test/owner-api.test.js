import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../api/owner.js';

function responseStub(){return{headers:{},statusCode:200,payload:null,setHeader(name,value){this.headers[name]=value},status(code){this.statusCode=code;return this},json(payload){this.payload=payload;return this}}}

test('owner login rejects a wrong password and sets cookie for the correct one',()=>{
  process.env.OWNER_ACCESS_PASSWORD='owner-test-password';
  const wrong=responseStub();handler({method:'POST',headers:{origin:'https://www.trackstart.art'},body:{password:'wrong'}},wrong);assert.equal(wrong.statusCode,401);
  const correct=responseStub();handler({method:'POST',headers:{origin:'https://www.trackstart.art'},body:{password:'owner-test-password'}},correct);assert.equal(correct.statusCode,200);assert.match(correct.headers['Set-Cookie'],/^ts_owner=/);
  delete process.env.OWNER_ACCESS_PASSWORD;
});
