import assert from 'node:assert/strict';
import test from 'node:test';
import { decryptBook, encryptBook } from '../api/_book-crypto.js';

test('encrypts and decrypts a PDF without changing bytes', () => {
  const secret = 'ab'.repeat(32);
  const pdf = Buffer.from('%PDF-1.4\nprotected book test\n%%EOF');
  const encrypted = encryptBook(pdf, secret);
  assert.notDeepEqual(encrypted, pdf);
  assert.deepEqual(decryptBook(encrypted, secret), pdf);
});

test('rejects an incorrect book key', () => {
  const encrypted = encryptBook(Buffer.from('%PDF test'), 'ab'.repeat(32));
  assert.throws(() => decryptBook(encrypted, 'cd'.repeat(32)));
});
