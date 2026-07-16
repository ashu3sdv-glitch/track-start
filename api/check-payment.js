// Track Start — проверка статуса платежа и выдача подписанного токена тарифа.
// Токен: base64(payload).hmac — подделать без серверного секрета нельзя.

import crypto from 'node:crypto';

const ALLOWED_HOSTS = [
  'trackstart.art',
  'www.trackstart.art',
  'track-start-sooty.vercel.app',
  'localhost',
];

const ACCESS_DAYS = 31;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const source = req.headers.origin || req.headers.referer || '';
  if (!ALLOWED_HOSTS.some((h) => source.includes(h))) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const { paymentId } = req.body || {};
  if (typeof paymentId !== 'string' || !paymentId.trim()) {
    res.status(400).json({ error: 'Нет идентификатора платежа' });
    return;
  }

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
    const payload = Buffer.from(JSON.stringify({
      plan,
      pid: data.id,
      exp: Date.now() + ACCESS_DAYS * 24 * 60 * 60 * 1000,
    })).toString('base64');
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    res.json({ status: 'succeeded', plan, token: `${payload}.${sig}` });
  } catch (e) {
    res.status(502).json({ error: 'Не удалось проверить платёж. Обнови страницу.' });
  }
}
