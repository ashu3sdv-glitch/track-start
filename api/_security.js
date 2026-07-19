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
    const isProjectPreview = process.env.VERCEL_ENV === 'preview' &&
      /^track-start-[a-z0-9-]+-aleksandrs-projects-a3365b25\.vercel\.app$/.test(url.hostname);
    if (url.protocol === 'https:' && PUBLIC_HOSTS.has(url.hostname)) return true;
    if (url.protocol === 'https:' && isProjectPreview) return true;
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

function ownerSignature() {
  const secret = process.env.OWNER_ACCESS_PASSWORD || '';
  return secret ? crypto.createHmac('sha256', secret).update('track-start-owner').digest('hex') : '';
}

export function hasOwnerAccess(req) {
  const cookies = String(req.headers.cookie || '').split(';').map((part) => part.trim());
  const signature = cookies.find((part) => part.startsWith('ts_owner='))?.slice('ts_owner='.length) || '';
  const expected = ownerSignature();
  if (!expected || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
}

export function verifyOwnerPassword(password) {
  const expected = process.env.OWNER_ACCESS_PASSWORD || '';
  if (!expected || typeof password !== 'string' || password.length > 200) return false;
  const actualHash = crypto.createHash('sha256').update(password).digest();
  const expectedHash = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(actualHash, expectedHash);
}

export function setOwnerAccess(res) {
  const signature = ownerSignature();
  if (!signature) return false;
  res.setHeader('Set-Cookie', `ts_owner=${signature}; Max-Age=2592000; Path=/; HttpOnly; Secure; SameSite=Strict`);
  return true;
}

export function clearOwnerAccess(res) {
  res.setHeader('Set-Cookie', 'ts_owner=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict');
}

function trialSecret() {
  return process.env.TRIAL_COOKIE_SECRET || process.env.YOOKASSA_SECRET_KEY || '';
}

function signTrial(value) {
  const secret = trialSecret();
  return secret ? crypto.createHmac('sha256', secret).update(value).digest('hex') : '';
}

function hasUsedTrial(req, cookieName) {
  const cookies = String(req.headers.cookie || '').split(';').map((part) => part.trim());
  const raw = cookies.find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1) || '';
  const [value, signature] = raw.split('.');
  if (value !== 'used' || !/^[a-f0-9]{64}$/i.test(signature || '')) return false;
  const expected = signTrial(value);
  if (!expected) return false;
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
}

function markTrialUsed(res, cookieName) {
  const signature = signTrial('used');
  if (!signature) return false;
  res.setHeader('Set-Cookie', `${cookieName}=used.${signature}; Max-Age=31536000; Path=/; HttpOnly; Secure; SameSite=Lax`);
  return true;
}

export function hasUsedPromotionTrial(req) {
  return hasUsedTrial(req, 'ts_promo_trial');
}

export function markPromotionTrialUsed(res) {
  return markTrialUsed(res, 'ts_promo_trial');
}

export function hasUsedVocalTrial(req) {
  return hasUsedTrial(req, 'ts_vocal_trial');
}

export function markVocalTrialUsed(res) {
  return markTrialUsed(res, 'ts_vocal_trial');
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
