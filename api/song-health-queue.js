import { applySecurityHeaders, enforceRateLimit, requireTrustedOrigin } from './_security.js';
import { adminRequest } from './_supabase.js';
import { requireProUser } from './_song-health.js';

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireTrustedOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, { scope: 'song-health-queue' })) return;
  const access = await requireProUser(req);
  if (access.error) return res.status(access.status).json({ error: access.error });
  const id = String(req.body?.id || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'Неверный идентификатор' });
  const query = new URLSearchParams({ id: `eq.${id}`, user_id: `eq.${access.user.id}`, status: 'eq.uploading' });
  const rows = await adminRequest(`/rest/v1/song_health_jobs?${query}`, {
    method: 'PATCH', headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ status: 'queued', updated_at: new Date().toISOString() }),
  });
  if (!rows?.length) return res.status(409).json({ error: 'Задача уже запущена или не найдена' });
  res.json({ id, status: 'queued' });
}
