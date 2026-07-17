import crypto from 'node:crypto';

const PUBLIC_HOSTS = new Set([
  'trackstart.art',
  'www.trackstart.art',
  'track-start-sooty.vercel.app',
]);

const buckets = globalThis.__trackStartRateBuckets || new Map();
globalThis.__trackStartRateBuckets = buckets;

export function applySecurityHeaders(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

export function requireTrustedOrigin(req, res) {
  const raw = req.headers.origin || req.headers.referer || '';
  try {
    const url = new URL(raw);
    const isLocal = process.env.VERCEL_ENV !== 'production' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
    if (url.protocol === 'https:' && PUBLIC_HOSTS.has(url.hostname)) return true;
    if (isLocal && (url.protocol === 'http:' || url.protocol === 'https:')) return true;
  } catch {}

  res.status(403).json({ error: 'Запрос разрешён только с сайта TrackStart' });
  return false;
}

export function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket?.remoteAddress || 'unknown';
}

export function verifyPlanToken(token) {
  if (typeof token !== 'string' || token.length > 2048) return null;
  const splitAt = token.lastIndexOf('.');
  if (splitAt < 1) return null;
  const payload = token.slice(0, splitAt);
  const signature = token.slice(splitAt + 1);
  const secret = process.env.YOOKASSA_SECRET_KEY;
  if (!secret || !/^[a-f0-9]{64}$/i.test(signature)) return null;

  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const a = Buffer.from(signature, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    if (!['lite', 'pro'].includes(data.plan) || !Number.isFinite(data.exp) || data.exp <= Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

export function enforceRateLimit(req, res, { paid = false, scope = 'api' } = {}) {
  const windowMs = 60 * 60 * 1000;
  const limit = paid ? 120 : 20;
  const now = Date.now();
  const key = `${scope}:${getClientIp(req)}`;
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) bucket = { count: 0, resetAt: now + windowMs };
  bucket.count += 1;
  buckets.set(key, bucket);

  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
  if (bucket.count <= limit) return true;

  res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
  res.status(429).json({ error: 'Слишком много запросов. Попробуйте позднее.' });
  return false;
}

export function parseRequestBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.length <= 50000) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}
