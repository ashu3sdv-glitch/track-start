import { applySecurityHeaders, enforceRateLimit } from './_security.js';
import { adminRequest } from './_supabase.js';
import { getAuthUser } from './_supabase.js';

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!enforceRateLimit(req, res, { scope: 'song-health-status', paid: true })) return;
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Требуется вход' });
  const id = String(req.query?.id || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'Неверный идентификатор' });
  const query = new URLSearchParams({ id: `eq.${id}`, user_id: `eq.${user.id}`,
    select: 'id,status,stem_count,error,output_path,created_at,completed_at,expires_at', limit: '1' });
  const rows = await adminRequest(`/rest/v1/song_health_jobs?${query}`);
  if (!rows?.[0]) return res.status(404).json({ error: 'Задача не найдена' });
  const job = rows[0];
  let downloadUrl = '';
  if (job.status === 'ready' && job.output_path) {
    const signed = await adminRequest('/storage/v1/object/sign/song-health-results/' + encodeURIComponent(job.output_path).replace(/%2F/g, '/'), {
      method: 'POST', body: JSON.stringify({ expiresIn: 3600 }),
    });
    downloadUrl = signed?.signedURL || signed?.signedUrl || '';
  }
  res.json({ ...job, downloadUrl });
}
