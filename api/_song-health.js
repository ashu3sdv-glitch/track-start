import crypto from 'node:crypto';
import { adminRequest, getAuthUser, getSubscription } from './_supabase.js';

export const MAX_STEMS = 12;
export const MAX_FILE_BYTES = 200 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 1500 * 1024 * 1024;
export const MONTHLY_LIMIT = 3;
const AUDIO_TYPES = new Set(['audio/wav', 'audio/x-wav', 'audio/wave', 'audio/flac', 'audio/x-flac']);

export function safeFileName(value) {
  const name = String(value || '').normalize('NFKC').replace(/[\\/\0]/g, '_').replace(/\s+/g, ' ').trim();
  if (!name || name.length > 180 || name.startsWith('.')) return '';
  return name;
}

export function validateFiles(files) {
  if (!Array.isArray(files) || files.length < 1 || files.length > MAX_STEMS) {
    return `Нужно загрузить от 1 до ${MAX_STEMS} стемов`;
  }
  let total = 0;
  const names = new Set();
  for (const file of files) {
    const name = safeFileName(file?.name);
    const size = Number(file?.size);
    const type = String(file?.type || '').toLowerCase();
    if (!name || !/\.(wav|flac)$/i.test(name)) return 'Разрешены только WAV и FLAC';
    if (type && !AUDIO_TYPES.has(type)) return `Неверный тип файла: ${name}`;
    if (!Number.isSafeInteger(size) || size < 44 || size > MAX_FILE_BYTES) return `Недопустимый размер: ${name}`;
    const key = name.toLowerCase();
    if (names.has(key)) return `Повторяется имя файла: ${name}`;
    names.add(key); total += size;
  }
  if (total > MAX_TOTAL_BYTES) return 'Общий размер стемов превышает 1,5 ГБ';
  return '';
}

export async function requireProUser(req) {
  const user = await getAuthUser(req);
  if (!user) return { error: 'Требуется вход', status: 401 };
  const subscription = await getSubscription(user.id);
  if (!subscription || subscription.plan !== 'pro') return { error: 'Обработка стемов доступна в тарифе Pro', status: 403 };
  return { user, subscription };
}

export async function countMonthlyJobs(userId) {
  const month = new Date();
  month.setUTCDate(1); month.setUTCHours(0, 0, 0, 0);
  const query = new URLSearchParams({
    user_id: `eq.${userId}`, created_at: `gte.${month.toISOString()}`,
    status: 'not.in.(cancelled,uploading)', select: 'id',
  });
  const rows = await adminRequest(`/rest/v1/song_health_jobs?${query}`);
  return Array.isArray(rows) ? rows.length : 0;
}

export function newJobId() {
  return crypto.randomUUID();
}
