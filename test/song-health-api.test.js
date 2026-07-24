import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_FILE_BYTES, MAX_STEMS, safeFileName, validateFiles } from '../api/_song-health.js';

test('accepts a normal group of WAV stems', () => {
  assert.equal(validateFiles([
    { name: '0 Lead Vocals.wav', size: 1024, type: 'audio/wav' },
    { name: '2 Drums.wav', size: 2048, type: 'audio/x-wav' },
  ]), '');
});

test('rejects too many stems and oversized files', () => {
  const stems = Array.from({ length: MAX_STEMS + 1 }, (_, i) => ({ name: `${i}.wav`, size: 1024, type: 'audio/wav' }));
  assert.match(validateFiles(stems), /от 1 до/);
  assert.match(validateFiles([{ name: 'huge.wav', size: MAX_FILE_BYTES + 1, type: 'audio/wav' }]), /размер/);
});

test('rejects traversal, duplicate names and non-audio extensions', () => {
  assert.equal(safeFileName('../secret.wav'), '');
  assert.match(validateFiles([{ name: 'notes.txt', size: 100, type: 'text/plain' }]), /WAV и FLAC/);
  assert.match(validateFiles([
    { name: 'Lead.wav', size: 100, type: 'audio/wav' },
    { name: 'lead.wav', size: 100, type: 'audio/wav' },
  ]), /Повторяется/);
});
