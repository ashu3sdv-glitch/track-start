import fs from 'node:fs';
import { decryptBook } from './_book-crypto.js';
import {
  applySecurityHeaders,
  enforceRateLimit,
  hasOwnerAccess,
  parseRequestBody,
  requireTrustedOrigin,
  verifyPlanToken,
} from './_security.js';

const encryptedVoiceBook = new URL('../private-books/voice-in-suno.pdf.enc', import.meta.url);

export default async function handler(req, res) {
  applySecurityHeaders(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireTrustedOrigin(req, res)) return;

  const body = parseRequestBody(req);
  const plan = verifyPlanToken(body.planToken);
  if (plan?.plan !== 'pro' && !hasOwnerAccess(req)) {
    return res.status(402).json({ code: 'PRO_REQUIRED', error: 'Полная книга доступна на тарифе Pro.' });
  }
  if (!enforceRateLimit(req, res, { paid: true, scope: 'book' })) return;
  if (body.bookId !== 'voice-in-suno') return res.status(404).json({ error: 'Книга не найдена' });

  try {
    const encrypted = fs.readFileSync(encryptedVoiceBook);
    const pdf = decryptBook(encrypted, process.env.BOOK_ENCRYPTION_KEY || '');
    const disposition = body.mode === 'download' ? 'attachment' : 'inline';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(pdf.length));
    res.setHeader('Content-Disposition', `${disposition}; filename="voice-in-suno.pdf"`);
    return res.status(200).send(pdf);
  } catch {
    return res.status(500).json({ error: 'Книга временно недоступна. Попробуйте позднее.' });
  }
}
