import fs from 'node:fs';
import { encryptBook } from '../api/_book-crypto.js';

const [input, output] = process.argv.slice(2);
const secret = process.env.BOOK_ENCRYPTION_KEY;
if (!input || !output || !secret) {
  throw new Error('Usage: BOOK_ENCRYPTION_KEY=<hex> node scripts/encrypt-book.mjs input.pdf output.enc');
}
fs.writeFileSync(output, encryptBook(fs.readFileSync(input), secret));
