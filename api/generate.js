// Track Start — серверная генерация.
// Ключ Claude живёт только здесь (переменная окружения Vercel) и никогда не отдаётся в браузер.

import {
  applySecurityHeaders,
  enforceRateLimit,
  parseRequestBody,
  requireTrustedOrigin,
  verifyPlanToken,
} from './_security.js';

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!requireTrustedOrigin(req, res)) return;

  const { prompt, maxTokens, planToken } = parseRequestBody(req);
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 20000) {
    res.status(400).json({ error: 'Bad request' });
    return;
  }
  const plan = verifyPlanToken(planToken);
  if (!enforceRateLimit(req, res, { paid: plan?.plan === 'pro', scope: 'generate' })) return;

  const key = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'Сервер не настроен: нет API ключа' });
    return;
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: Math.min(parseInt(maxTokens, 10) || 2000, 3000),
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      res.status(502).json({ error: data?.error?.message || `Ошибка API: ${r.status}` });
      return;
    }

    res.json({ text: data.content?.[0]?.text || '' });
  } catch (e) {
    res.status(502).json({ error: 'Не удалось связаться с API. Попробуй ещё раз.' });
  }
}
