import { applySecurityHeaders } from './_security.js';
import { rejectIfServicePaused } from './_service-state.js';

export default function handler(req, res) {
  applySecurityHeaders(res);
  if (rejectIfServicePaused(res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const url = process.env.SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  if (!url || !anonKey) return res.status(503).json({ configured: false });
  res.json({ configured: true, url, anonKey });
}
