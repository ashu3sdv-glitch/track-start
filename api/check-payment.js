// Track Start — проверка статуса платежа и выдача подписанного токена тарифа.
// Токен: base64(payload).hmac — подделать без серверного секрета нельзя.

import crypto from 'node:crypto';
import { applySecurityHeaders, enforceRateLimit, parseRequestBody, requireTrustedOrigin } from './_security.js';
import { activateSubscription, getAuthUser, supabaseConfigured } from './_supabase.js';

const ACCESS_DAYS = 31;

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!requireTrustedOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, { scope: 'check-payment' })) return;

  const { paymentId } = parseRequestBody(req);
  if (typeof paymentId !== 'string' || !paymentId.trim()) {
    res.status(400).json({ error: 'Нет идентификатора платежа' });
    return;
  }
  if (!supabaseConfigured()) return res.status(503).json({ error: 'Авторизация ещё не настроена' });
  const user = await getAuthUser(req);
  if (!user?.email) return res.status(401).json({ error: 'Сначала войдите по email' });

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secret = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secret) {
    res.status(500).json({ error: 'Оплата не настроена на сервере' });
    return;
  }

  try {
    const r = await fetch(`https://api.yookassa.ru/v3/payments/${encodeURIComponent(paymentId)}`, {
      headers: { 'Authorization': 'Basic ' + Buffer.from(`${shopId}:${secret}`).toString('base64') },
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      res.status(502).json({ error: data?.description || 'Платёж не найден' });
      return;
    }

    if (data.status !== 'succeeded') {
      res.json({ status: data.status });
      return;
    }

    const plan = data.metadata?.plan === 'lite' ? 'lite' : 'pro';
    if (data.metadata?.user_id !== user.id) return res.status(403).json({ error: 'Этот платёж принадлежит другому аккаунту' });
    const accessUntil = Date.now() + ACCESS_DAYS * 24 * 60 * 60 * 1000;
    await activateSubscription({ userId: user.id, email: user.email, plan, paymentId: data.id, accessUntil });
    const payload = Buffer.from(JSON.stringify({
      plan,
      uid: user.id,
      pid: data.id,
      exp: accessUntil,
    })).toString('base64');
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    res.json({ status: 'succeeded', plan, token: `${payload}.${sig}` });
  } catch (e) {
    res.status(502).json({ error: 'Не удалось проверить платёж. Обнови страницу.' });
  }
}
