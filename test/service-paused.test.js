import test from 'node:test';
import assert from 'node:assert/strict';

import { SERVICE_PAUSED, rejectIfServicePaused } from '../api/_service-state.js';
import accountHandler from '../api/account.js';
import authConfigHandler from '../api/auth-config.js';
import bookHandler from '../api/book.js';
import checkPaymentHandler from '../api/check-payment.js';
import payHandler from '../api/pay.js';
import generateHandler from '../api/generate.js';
import promotionHandler from '../api/promotion.js';
import vocalHandler from '../api/vocal.js';

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('maintenance mode is enabled', () => {
  assert.equal(SERVICE_PAUSED, true);
  const res = responseRecorder();
  assert.equal(rejectIfServicePaused(res), true);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.code, 'SERVICE_PAUSED');
});

for (const [name, handler] of [
  ['payments', payHandler],
  ['payment verification', checkPaymentHandler],
  ['generation', generateHandler],
  ['promotion generation', promotionHandler],
  ['vocal generation', vocalHandler],
  ['paid book access', bookHandler],
  ['account access', accountHandler],
  ['auth configuration', authConfigHandler],
]) {
  test(`${name} stop before external services are called`, async () => {
    const res = responseRecorder();
    await handler({ method: 'POST', headers: {} }, res);
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.code, 'SERVICE_PAUSED');
  });
}
