import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import { requireTrustedOrigin, verifyPlanToken } from '../api/_security.js';

function responseStub() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

test('accepts the real production origin', () => {
  const res = responseStub();
  assert.equal(requireTrustedOrigin({ headers: { origin: 'https://www.trackstart.art' } }, res), true);
  assert.equal(res.statusCode, 200);
});

test('rejects a hostname that only contains the allowed domain', () => {
  const res = responseStub();
  assert.equal(requireTrustedOrigin({ headers: { origin: 'https://www.trackstart.art.attacker.example' } }, res), false);
  assert.equal(res.statusCode, 403);
});

test('accepts only this project Vercel preview while in preview mode', () => {
  process.env.VERCEL_ENV = 'preview';
  const accepted = responseStub();
  assert.equal(requireTrustedOrigin({ headers: { origin: 'https://track-start-git-codex-promo-290e5f-aleksandrs-projects-a3365b25.vercel.app' } }, accepted), true);

  const rejected = responseStub();
  assert.equal(requireTrustedOrigin({ headers: { origin: 'https://track-start-attacker-projects.vercel.app' } }, rejected), false);
  delete process.env.VERCEL_ENV;
});

test('verifies signed, unexpired plan tokens', () => {
  process.env.YOOKASSA_SECRET_KEY = 'test-secret';
  const payload = Buffer.from(JSON.stringify({ plan: 'pro', exp: Date.now() + 60000 })).toString('base64');
  const signature = crypto.createHmac('sha256', 'test-secret').update(payload).digest('hex');
  assert.equal(verifyPlanToken(`${payload}.${signature}`).plan, 'pro');
  assert.equal(verifyPlanToken(`${payload}.${'0'.repeat(64)}`), null);
});
