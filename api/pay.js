// Track Start — создание платежа в ЮКассе.
// Секретный ключ живёт только в env Vercel и в браузер не попадает.

import crypto from 'node:crypto';
import { applySecurityHeaders, enforceRateLimit, parseRequestBody, requireTrustedOrigin } from './_security.js';

const PLANS = {
  lite: { amount: '450.00', title: 'Track Start Lite — доступ на 1 месяц' },
  pro:  { amount: '900.00', title: 'Track Start Pro — доступ на 1 месяц' },
};

async function createPayment(auth, plan, email, withReceipt) {
  const body = {
    amount: { value: PLANS[plan].amount, currency: 'RUB' },
    capture: true,
    confirmation: { type: 'redirect', return_url: 'https://www.trackstart.art/success.html' },
    description: PLANS[plan].title,
    metadata: { plan },
  };
  if (withReceipt && email) {
    body.receipt = {
      customer: { email },
      items: [{
        description: PLANS[plan].title,
        quantity: '1.00',
        amount: { value: PLANS[plan].amount, currency: 'RUB' },
        vat_code: 1,
        payment_subject: 'service',
        payment_mode: 'full_payment',
      }],
    };
  }
  const r = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotence-Key': crypto.randomUUID(),
      'Authorization': auth,
    },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, data };
}

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!requireTrustedOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, { scope: 'pay' })) return;

  const { plan, email } = parseRequestBody(req);
  if (!PLANS[plan]) {
    res.status(400).json({ error: 'Неизвестный тариф' });
    return;
  }
  if (email && (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    res.status(400).json({ error: 'Некорректный email' });
    return;
  }

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secret = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secret) {
    res.status(500).json({ error: 'Оплата не настроена на сервере' });
    return;
  }
  const auth = 'Basic ' + Buffer.from(`${shopId}:${secret}`).toString('base64');

  try {
    let result = await createPayment(auth, plan, email, true);
    // если магазин не использует чеки ЮКассы — пробуем без receipt
    if (!result.ok && JSON.stringify(result.data).toLowerCase().includes('receipt')) {
      result = await createPayment(auth, plan, email, false);
    }
    if (!result.ok) {
      res.status(502).json({ error: result.data?.description || 'ЮКасса отклонила запрос' });
      return;
    }
    res.json({
      paymentId: result.data.id,
      url: result.data.confirmation?.confirmation_url || '',
    });
  } catch (e) {
    res.status(502).json({ error: 'Не удалось связаться с ЮКассой. Попробуй ещё раз.' });
  }
}
