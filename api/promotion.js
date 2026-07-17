import {
  applySecurityHeaders,
  enforceRateLimit,
  hasUsedPromotionTrial,
  markPromotionTrialUsed,
  parseRequestBody,
  requireTrustedOrigin,
  verifyPlanToken,
} from './_security.js';

const OFFSETS = [-21, -14, -10, -7, -3, -1, 0, 1, 3, 5, 7, 10, 14, 21, 30];

function clean(value, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function extractJson(text) {
  const cleaned = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI вернул результат в неверном формате');
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function callClaude(key, { messages, maxTokens, system }) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `Ошибка AI: ${response.status}`);
  return { text: data.content?.[0]?.text || '', stopReason: data.stop_reason || '' };
}

async function parseOrRepairJson(key, text) {
  try {
    return extractJson(text);
  } catch (firstError) {
    const repair = await callClaude(key, {
      maxTokens: 10000,
      system: 'Ты исправляешь JSON. Верни только один валидный JSON-объект без markdown. Не сокращай, не переписывай и не добавляй содержание: исправь только синтаксис, кавычки, запятые и скобки.',
      messages: [{ role: 'user', content: `Исправь синтаксис этого JSON:\n\n${String(text).slice(0, 45000)}` }],
    });
    try {
      return extractJson(repair.text);
    } catch {
      throw new Error('AI не смог правильно оформить большой план. Пожалуйста, нажмите «Создать план» ещё раз.');
    }
  }
}

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!requireTrustedOrigin(req, res)) return;

  const body = parseRequestBody(req);
  const plan = verifyPlanToken(body.planToken);
  const isPro = plan?.plan === 'pro';
  if (!isPro && hasUsedPromotionTrial(req)) {
    res.status(402).json({
      code: 'PRO_REQUIRED',
      error: 'Пробный план уже использован. Новые планы доступны на тарифе Pro.',
    });
    return;
  }
  if (!enforceRateLimit(req, res, { paid: isPro, scope: 'promotion' })) return;

  const song = {
    title: clean(body.title, 120),
    artist: clean(body.artist, 120),
    lyrics: clean(body.lyrics, 16000),
    genre: clean(body.genre, 120),
    mood: clean(body.mood, 120),
    vocalType: clean(body.vocalType, 80),
    language: clean(body.language, 40),
    description: clean(body.description, 1000),
    budget: clean(body.budget, 80),
    platforms: Array.isArray(body.platforms) ? body.platforms.map((v) => clean(v, 40)).filter(Boolean).slice(0, 8) : [],
    releaseDate: clean(body.releaseDate, 10),
  };

  if (!song.title || !song.artist || !song.lyrics || !/^\d{4}-\d{2}-\d{2}$/.test(song.releaseDate)) {
    res.status(400).json({ error: 'Заполните название, имя артиста, текст и дату релиза' });
    return;
  }

  const key = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'На сервере не настроен ANTHROPIC_API_KEY' });
    return;
  }

  const prompt = `Ты — спокойный и практичный музыкальный маркетолог. Создай персональный план продвижения одного релиза на русском языке.

ДАННЫЕ ПОЛЬЗОВАТЕЛЯ:
${JSON.stringify(song, null, 2)}

ПРАВИЛА:
- Используй только данные пользователя. Не придумывай достижения, статистику, награды и факты об артисте.
- Не обещай успех, вирусность или гарантированные прослушивания.
- Не имитируй известных артистов и не предлагай накрутки.
- Если данных недостаточно, формулируй нейтрально.
- Сильные строки бери дословно только из переданного текста песни.
- Идеи должны быть реально выполнимы одним человеком с телефоном.
- Учитывай бюджет и выбранные площадки.
- Верни ТОЛЬКО валидный JSON без markdown и комментариев.

JSON СТРОГО ТАКОЙ СТРУКТУРЫ:
{
  "summary": {"theme":"", "emotion":"", "listeningSituation":[""], "audience":"", "positioning":["","",""], "strongLines":["","",""]},
  "pitch": {"short":"до 300 символов", "medium":"до 700 символов", "playlist":"", "blogger":""},
  "posts": {"announcement":"", "weekBefore":"", "dayBefore":"", "releaseDay":"", "afterRelease":"", "pinnedComment":""},
  "hooks": ["10 коротких рекламных хуков"],
  "contentIdeas": [{"title":"", "category":"", "goal":"", "platform":"", "duration":"", "hook":"", "screenText":"", "cta":""}],
  "scripts": [{"title":"", "duration":"15–30 сек", "hook":"", "voiceover":"", "screenText":[""], "shots":[""], "caption":"", "cta":""}],
  "calendar": [{"offset":-21, "focus":"", "tasks":[{"title":"", "details":"", "contentIdea":""}]}],
  "risks":[""],
  "nextStep":""
}

Требования к количеству: ровно 10 hooks, 12 contentIdeas, 5 scripts. В calendar создай ровно 15 элементов и используй offsets строго в этом порядке: ${OFFSETS.join(', ')}. На каждую дату дай 2–4 конкретные задачи. В contentIdea календаря указывай тему ролика, когда ролик нужен; иначе пустую строку.`;

  try {
    const generated = await callClaude(key, {
      maxTokens: 12000,
      messages: [{ role: 'user', content: prompt }],
    });
    if (generated.stopReason === 'max_tokens') {
      res.status(502).json({ error: 'План получился слишком длинным. Пожалуйста, нажмите «Создать план» ещё раз.' });
      return;
    }
    const result = await parseOrRepairJson(key, generated.text);
    if (!isPro && !markPromotionTrialUsed(res)) {
      res.status(500).json({ error: 'Не настроена защита пробной генерации' });
      return;
    }
    res.status(200).json({ result, generatedAt: new Date().toISOString() });
  } catch (error) {
    res.status(502).json({ error: error.message || 'Не удалось создать план. Попробуйте ещё раз.' });
  }
}
