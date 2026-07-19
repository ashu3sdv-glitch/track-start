import { applySecurityHeaders, clearOwnerAccess, enforceRateLimit, hasOwnerAccess, parseRequestBody, requireTrustedOrigin, setOwnerAccess, verifyOwnerPassword } from './_security.js';

export default function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method === 'GET') return res.status(200).json({ owner: hasOwnerAccess(req) });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireTrustedOrigin(req, res)) return;
  const body = parseRequestBody(req);
  if (body.action === 'logout') { clearOwnerAccess(res); return res.status(200).json({ owner: false }); }
  if (!enforceRateLimit(req, res, { paid: false, scope: 'owner-login' })) return;
  if (!verifyOwnerPassword(body.password)) return res.status(401).json({ error: 'Неверный пароль' });
  if (!setOwnerAccess(res)) return res.status(500).json({ error: 'Доступ владельца не настроен' });
  return res.status(200).json({ owner: true });
}
