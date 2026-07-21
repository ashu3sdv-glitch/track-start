const REQUIRED = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];

export function supabaseConfigured() {
  return REQUIRED.every((name) => Boolean(process.env[name]));
}

function baseUrl() {
  return String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
}

export async function getAuthUser(req) {
  if (!supabaseConfigured()) return null;
  const authorization = String(req.headers.authorization || '');
  if (!authorization.startsWith('Bearer ') || authorization.length > 10000) return null;
  const response = await fetch(`${baseUrl()}/auth/v1/user`, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      Authorization: authorization,
    },
  });
  if (!response.ok) return null;
  const user = await response.json().catch(() => null);
  return user?.id ? user : null;
}

function adminHeaders(extra = {}) {
  return {
    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

export async function getSubscription(userId) {
  if (!supabaseConfigured() || !userId) return null;
  const query = new URLSearchParams({ user_id: `eq.${userId}`, select: 'user_id,plan,access_until', limit: '1' });
  const response = await fetch(`${baseUrl()}/rest/v1/subscriptions?${query}`, { headers: adminHeaders() });
  if (!response.ok) return null;
  const rows = await response.json().catch(() => []);
  const row = rows[0];
  if (!row || !['lite', 'pro'].includes(row.plan) || Date.parse(row.access_until) <= Date.now()) return null;
  return row;
}

export async function activateSubscription({ userId, email, plan, paymentId, accessUntil }) {
  if (!supabaseConfigured()) throw new Error('Supabase is not configured');
  const response = await fetch(`${baseUrl()}/rest/v1/subscriptions?on_conflict=user_id`, {
    method: 'POST',
    headers: adminHeaders({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify({
      user_id: userId,
      email,
      plan,
      payment_id: paymentId,
      access_until: new Date(accessUntil).toISOString(),
      updated_at: new Date().toISOString(),
    }),
  });
  if (!response.ok) throw new Error(`Subscription write failed: ${response.status}`);
  return (await response.json().catch(() => []))[0] || null;
}
