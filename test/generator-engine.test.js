import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeSyllables, applyPerformanceSettings, countSyllables, finalizeLyrics, finalizeStyle, getDeliveryPlan, getGenreArchitecture, getSignatureTail, getVocalPlan, resolveTimbre, validateLyrics } from '../generator-engine.js';

const song = `[Verse 1 — intimate]\nОкно дрожит от позднего трамвая\n${'строка\n'.repeat(20)}[Chorus — powerful]\nДержи мой свет\n[Verse 2 — conversational]\nДругой поворот\n[Bridge — stripped]\nЯ выбираю путь\n[Final Chorus — full]\nДержи мой свет`;

test('first stage returns clean lyrics without vocal settings', () => {
  const brief = { vocal: 'Male vocal' };
  const result = finalizeLyrics(`[Female Vocal] [Soprano]\n${song}`, brief);
  assert.ok(result.startsWith('[Verse 1]'));
  assert.doesNotMatch(result, /Vocal Style/);
  assert.deepEqual(validateLyrics(result, brief).issues, ['too-short']);
});

test('second stage adds voice and genre-specific section delivery', () => {
  const brief = { vocal: 'Male vocal', genres: ['Pop'], mood: 'Romantic', idea: 'встреча на пустой платформе' };
  const delivery = getDeliveryPlan(brief);
  const result = applyPerformanceSettings('[Verse 1]\nТихо горит окно\n[Chorus]\nОстанься со мной\n[Final Chorus]\nОстанься со мной', brief);
  assert.ok(result.startsWith(getVocalPlan(brief).header));
  assert.ok(result.includes(`[Verse 1 — ${delivery[0]}]`));
  assert.ok(result.includes(`[Chorus — ${delivery[2]}]`));
  assert.ok(result.includes(`[Final Chorus — ${delivery[2]}, full vocal stack, choir backing]`));
});

test('genre changes section delivery and meter architecture', () => {
  const pop = getVocalPlan({ vocal: 'Male vocal', genres: ['Pop'] });
  const hiphop = getVocalPlan({ vocal: 'Male vocal', genres: ['Hip-Hop'] });
  assert.doesNotMatch(hiphop.header, /melisma|vocal runs/i);
  assert.notEqual(pop.sections, hiphop.sections);
  assert.notDeepEqual(getGenreArchitecture({ genres: ['Pop'] }).syllables, getGenreArchitecture({ genres: ['Hip-Hop'] }).syllables);
});

test('delivery varies between songs while remaining stable for the same brief', () => {
  const briefs = ['ночной поезд', 'утро у моря', 'последний телефонный звонок', 'танец на крыше'].map(idea => ({ idea, vocal: 'Female vocal', genres: ['Pop'], mood: 'Romantic' }));
  const plans = briefs.map(getDeliveryPlan);
  assert.deepEqual(getDeliveryPlan(briefs[0]), plans[0]);
  assert.ok(new Set(plans.map(plan => plan.join('|'))).size > 1);
});

test('R&B can use melisma while Hip-Hop keeps precise rhythmic techniques', () => {
  const soulPlans = ['a', 'b', 'c', 'd', 'e', 'f'].map(idea => getDeliveryPlan({ idea, genres: ['R&B'], mood: 'Romantic' }).join(' '));
  assert.ok(soulPlans.some(plan => /melisma|vocal runs/i.test(plan)));
  const rap = getDeliveryPlan({ idea: 'городской манифест', genres: ['Hip-Hop'], mood: 'Energetic' }).join(' ');
  assert.doesNotMatch(rap, /melisma|vocal runs|falsetto/i);
  assert.match(rap, /syllabic|rhythmic|staccato|chant|spoken|declamatory/i);
});

test('uses an explicitly selected English vocal timbre', () => {
  const plan = getVocalPlan({ vocal: 'Male vocal', timbre: 'Tenor', genres: ['Pop'] });
  assert.match(plan.header, /\[Tenor C3–B4\]/);
  assert.match(plan.style, /bright tenor/);
});

test('auto timbre stays compatible with vocal type and genre', () => {
  assert.equal(resolveTimbre({ vocal: 'Male vocal', timbre: 'Auto', genres: ['Dark Phonk'], mood: 'Dark' }), 'Bass');
  assert.equal(resolveTimbre({ vocal: 'Female vocal', timbre: 'Auto', genres: ['Pop'], mood: 'Euphoric' }), 'Soprano');
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
