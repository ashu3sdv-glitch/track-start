import crypto from 'node:crypto';

const MAGIC = Buffer.from('TSBK1');

function keyBuffer(secret) {
  if (typeof secret !== 'string' || !/^[a-f0-9]{64}$/i.test(secret.trim())) {
    throw new Error('BOOK_ENCRYPTION_KEY must be a 64-character hexadecimal key');
  }
  return Buffer.from(secret.trim(), 'hex');
}

export function encryptBook(pdf, secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer(secret), iv);
  const encrypted = Buffer.concat([cipher.update(pdf), cipher.final()]);
  return Buffer.concat([MAGIC, iv, cipher.getAuthTag(), encrypted]);
}

export function decryptBook(payload, secret) {
  if (!Buffer.isBuffer(payload) || payload.length < 34 || !payload.subarray(0, 5).equals(MAGIC)) {
    throw new Error('Invalid encrypted book');
  }
  const iv = payload.subarray(5, 17);
  const tag = payload.subarray(17, 33);
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer(secret), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(payload.subarray(33)), decipher.final()]);
}
