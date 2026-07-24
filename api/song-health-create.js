import { applySecurityHeaders, enforceRateLimit, requireTrustedOrigin } from './_security.js';
import { adminRequest } from './_supabase.js';
import { countMonthlyJobs, MONTHLY_LIMIT, newJobId, requireProUser, safeFileName, validateFiles } from './_song-health.js';

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireTrustedOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, { scope: 'song-health-create' })) return;
  const access = await requireProUser(req);
  if (access.error) return res.status(access.status).json({ error: access.error });
  const files = req.body?.files;
  const validationError = validateFiles(files);
  if (validationError) return res.status(400).json({ error: validationError });
  if (await countMonthlyJobs(access.user.id) >= MONTHLY_LIMIT) {
    return res.status(429).json({ error: `Лимит: ${MONTHLY_LIMIT} песни в месяц` });
  }
  const id = newJobId();
  const prefix = `${access.user.id}/${id}`;
  const stems = files.map((file, index) => ({
    name: safeFileName(file.name), size: Number(file.size), type: String(file.type || ''),
    path: `${prefix}/${String(index).padStart(2, '0')}-${safeFileName(file.name)}`,
  }));
  await adminRequest('/rest/v1/song_health_jobs', {
    method: 'POST', headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ id, user_id: access.user.id, status: 'uploading', stem_count: stems.length,
      input_prefix: prefix, input_manifest: stems }),
  });
  res.status(201).json({ id, bucket: 'song-health-inputs', stems, monthlyLimit: MONTHLY_LIMIT });
}
