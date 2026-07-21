import assert from 'node:assert/strict';
import test from 'node:test';
import { getAuthUser, getSubscription } from '../api/_supabase.js';

function configure() {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon-test';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-test';
}

test('validates a bearer session through Supabase Auth', async (t) => {
  configure();
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://example.supabase.co/auth/v1/user');
    assert.equal(options.headers.Authorization, 'Bearer session-token');
    return { ok: true, json: async () => ({ id: 'user-1', email: 'artist@example.com' }) };
  };
  const user = await getAuthUser({ headers: { authorization: 'Bearer session-token' } });
  assert.equal(user.id, 'user-1');
  assert.equal(await getAuthUser({ headers: {} }), null);
});

test('returns only an active paid subscription', async (t) => {
  configure();
  const originalFetch = global.fetch;
  t.after(() => { global.fetch = originalFetch; });
  global.fetch = async () => ({ ok: true, json: async () => [{
    user_id: 'user-1', plan: 'pro', access_until: new Date(Date.now() + 60000).toISOString(),
  }] });
  assert.equal((await getSubscription('user-1')).plan, 'pro');

  global.fetch = async () => ({ ok: true, json: async () => [{
    user_id: 'user-1', plan: 'pro', access_until: new Date(Date.now() - 60000).toISOString(),
  }] });
  assert.equal(await getSubscription('user-1'), null);
});
