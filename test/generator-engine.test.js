import assert from 'node:assert/strict';
import test from 'node:test';
import { finalizeLyrics, finalizeStyle, getVocalProfile, validateLyrics } from '../generator-engine.js';

const song = `[Verse 1 — intimate]\nОкно дрожит от позднего трамвая\n${'строка\n'.repeat(20)}[Chorus — powerful]\nДержи мой свет\n[Verse 2 — conversational]\nДругой поворот\n[Bridge — stripped]\nЯ выбираю путь\n[Final Chorus — full]\nДержи мой свет`;

test('male selection always receives the locked male header', () => {
  const brief = { vocal: 'Male vocal' };
  const result = finalizeLyrics(`[Female Vocal] [Soprano]\n${song}`, brief);
  assert.ok(result.startsWith(getVocalProfile('Male vocal').header));
  assert.equal(validateLyrics(result, brief).ok, true);
});

test('opposite vocal identity fails validation', () => {
  const brief = { vocal: 'Male vocal' };
  const result = finalizeLyrics(`${song}\n[Backing vocals: female]`, brief);
  assert.ok(validateLyrics(result, brief).issues.includes('conflicting-vocal'));
});

test('style finalizer locks selected voice and removes the opposite one', () => {
  const style = finalizeStyle('dream pop, 105 BPM, female vocals, soprano, warm synths', { vocal: 'Male vocal' });
  assert.match(style, /^male vocals/);
  assert.doesNotMatch(style, /female|soprano/i);
});
