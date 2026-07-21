import crypto from 'node:crypto';
import { applySecurityHeaders, enforceRateLimit } from './_security.js';
import { getAuthUser, getSubscription, supabaseConfigured } from './_supabase.js';

function planToken(subscription) {
  const secret = process.env.YOOKASSA_SECRET_KEY;
  if (!secret || !subscription) return '';
  const payload = Buffer.from(JSON.stringify({
    plan: subscription.plan,
    uid: subscription.user_id,
    exp: Date.parse(subscription.access_until),
  })).toString('base64');
  return `${payload}.${crypto.createHmac('sha256', secret).update(payload).digest('hex')}`;
}

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!enforceRateLimit(req, res, { scope: 'account' })) return;
  if (!supabaseConfigured()) return res.status(503).json({ error: 'Авторизация ещё не настроена' });
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Требуется вход' });
  const subscription = await getSubscription(user.id);
  res.json({
    user: { id: user.id, email: user.email || '' },
    subscription: subscription ? { plan: subscription.plan, accessUntil: subscription.access_until } : null,
    planToken: planToken(subscription),
  });
}
