import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeSyllables, applyPerformanceSettings, countSyllables, finalizeLyrics, finalizeStyle, getGenreArchitecture, getSignatureTail, getVocalPlan, validateLyrics } from '../generator-engine.js';

const song = `[Verse 1 — intimate]\nОкно дрожит от позднего трамвая\n${'строка\n'.repeat(20)}[Chorus — powerful]\nДержи мой свет\n[Verse 2 — conversational]\nДругой поворот\n[Bridge — stripped]\nЯ выбираю путь\n[Final Chorus — full]\nДержи мой свет`;

test('first stage returns clean lyrics without vocal settings', () => {
  const brief = { vocal: 'Male vocal' };
  const result = finalizeLyrics(`[Female Vocal] [Soprano]\n${song}`, brief);
  assert.ok(result.startsWith('[Verse 1]'));
  assert.doesNotMatch(result, /Vocal Style/);
  assert.deepEqual(validateLyrics(result, brief).issues, ['too-short']);
});

test('second stage adds voice and genre-specific section delivery', () => {
  const brief = { vocal: 'Male vocal', genres: ['Pop'] };
  const result = applyPerformanceSettings('[Verse 1]\nТихо горит окно\n[Chorus]\nОстанься со мной\n[Final Chorus]\nОстанься со мной', brief);
  assert.ok(result.startsWith(getVocalPlan(brief).header));
  assert.match(result, /\[Verse 1 — intimate conversational\]/);
  assert.match(result, /\[Chorus — open and powerful\]/);
  assert.match(result, /\[Final Chorus — open and powerful, full vocal stack, choir backing\]/);
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
  assert.match(style, /no generic AI polish \| human breath imperfection$/);
});

test('selects energetic and atmospheric anti-AI tails from the brief', () => {
  assert.match(getSignatureTail({ mood: 'Energetic', genres: ['Pop'] }), /no safe AI sound/);
  assert.match(getSignatureTail({ mood: 'Dreamy', genres: ['Cinematic'] }), /no clean digital polish/);
});

test('style finalizer replaces a model tail with exactly one selected signature', () => {
  const style = finalizeStyle('pop, 100 BPM | raw energy no overproduce | unwanted duplicate words', { vocal: 'Female vocal', mood: 'Dreamy', genres: ['Cinematic'] });
  assert.equal((style.match(/no clean digital polish/g) || []).length, 1);
  assert.doesNotMatch(style, /raw energy no overproduce/);
});
