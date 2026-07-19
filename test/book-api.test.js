import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../api/book.js';

function responseMock() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
    send(value) { this.body = value; return this; },
  };
}

test('does not return the book without a valid Pro token', async () => {
  const req = {
    method: 'POST',
    headers: { origin: 'https://www.trackstart.art' },
    body: { bookId: 'voice-in-suno', planToken: '' },
    socket: { remoteAddress: '127.0.0.1' },
  };
  const res = responseMock();
  await handler(req, res);
  assert.equal(res.statusCode, 402);
  assert.equal(res.body.code, 'PRO_REQUIRED');
  assert.equal(Buffer.isBuffer(res.body), false);
});
