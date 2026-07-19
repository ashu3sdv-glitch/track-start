import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeSyllables, countSyllables, finalizeLyrics, finalizeStyle, getGenreArchitecture, getVocalPlan, validateLyrics } from '../generator-engine.js';

const song = `[Verse 1 — intimate]\nОкно дрожит от позднего трамвая\n${'строка\n'.repeat(20)}[Chorus — powerful]\nДержи мой свет\n[Verse 2 — conversational]\nДругой поворот\n[Bridge — stripped]\nЯ выбираю путь\n[Final Chorus — full]\nДержи мой свет`;

test('male selection always receives the locked male header', () => {
  const brief = { vocal: 'Male vocal' };
  const result = finalizeLyrics(`[Female Vocal] [Soprano]\n${song}`, brief);
  assert.ok(result.startsWith(getVocalPlan(brief).header));
  assert.equal(validateLyrics(result, brief).ok, true);
});

test('genre changes section delivery and meter architecture', () => {
  const pop = getVocalPlan({ vocal: 'Male vocal', genres: ['Pop'] });
  const hiphop = getVocalPlan({ vocal: 'Male vocal', genres: ['Hip-Hop'] });
  assert.match(pop.header, /open and powerful/);
  assert.match(hiphop.header, /melodic or chanted hook/);
  assert.notDeepEqual(getGenreArchitecture({ genres: ['Pop'] }).syllables, getGenreArchitecture({ genres: ['Hip-Hop'] }).syllables);
});

test('counts Russian syllables by vowels', () => {
  assert.equal(countSyllables('Мама мыла раму', 'ru'), 6);
});

test('syllable analyzer applies the selected genre ranges', () => {
  const lyrics = '[Verse 1 — intimate]\n' + 'Это невероятно переполненная и намеренно чрезмерно длинная строка для короткой песни\n'.repeat(10);
  const meter = analyzeSyllables(lyrics, { genres: ['Pop'], lang: 'ru' });
  assert.equal(meter.total, 10);
  assert.ok(meter.ratio > 0.45);
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
