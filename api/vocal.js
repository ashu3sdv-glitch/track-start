import { applySecurityHeaders, enforceRateLimit, parseRequestBody, requireTrustedOrigin, verifyPlanToken } from './_security.js';

const clean = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
function jsonFrom(text) {
  const value = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = value.indexOf('{'); const end = value.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI вернул результат в неверном формате');
  return JSON.parse(value.slice(start, end + 1));
}

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireTrustedOrigin(req, res)) return;
  const body = parseRequestBody(req); const plan = verifyPlanToken(body.planToken);
  if (!enforceRateLimit(req, res, { paid: plan?.plan === 'pro', scope: 'vocal' })) return;
  const song = { title: clean(body.title,120), lyrics: clean(body.lyrics,16000), genre: clean(body.genre,120), mood: clean(body.mood,120), vocalType: clean(body.vocalType,80), experience: clean(body.experience,40) };
  if (!song.title || !song.lyrics) return res.status(400).json({ error: 'Заполните название и текст песни' });
  const key = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!key) return res.status(500).json({ error: 'На сервере не настроен API-ключ' });
  const prompt = `Ты — бережный вокальный продюсер. Создай на русском практическую карту исполнения по тексту песни. Данные: ${JSON.stringify(song)}.
Ты не слышишь мелодию и голос: не выдавай диапазон, ноты, места вдоха или расстояние до микрофона за факты. Не имитируй известных артистов. Сохраняй строки дословно. Верни только JSON:
{"concept":"2-3 предложения","tone":["3-5 характеристик"],"rules":["4-6 правил"],"dna":{"energy":0,"emotion":0,"intimacy":0,"softness":0,"drama":0},"sections":[{"name":"Verse 1","energy":35,"emotion":"","delivery":"","focus":""}],"markedLyrics":[{"section":"Verse 1","direction":"","lines":[{"text":"строка дословно","note":"совет или пусто","accentWords":["слово из строки"]}]}],"beforeRecording":["4-6 действий"],"avoid":["4-6 ошибок"],"coach":"короткий итог продюсера"}. Все dna и energy — целые 0-100. Охвати все секции и строки.`;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'}, body:JSON.stringify({model:'claude-sonnet-4-5-20250929',max_tokens:7000,messages:[{role:'user',content:prompt}]}) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || `Ошибка AI: ${response.status}`);
    if (data.stop_reason === 'max_tokens') throw new Error('Карта получилась слишком длинной. Попробуйте ещё раз.');
    return res.status(200).json({ result: jsonFrom(data.content?.[0]?.text), generatedAt:new Date().toISOString() });
  } catch (error) { return res.status(502).json({ error:error.message || 'Не удалось создать карту' }); }
}
