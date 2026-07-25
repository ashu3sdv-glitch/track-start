import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeSyllables, applyPerformanceSettings, buildDiagnosisPrompt, buildRewritePrompt, buildRewriteRepairPrompt, buildRewriteVerificationPrompt, countSyllables, finalizeLyrics, finalizeStyle, getDeliveryPlan, getGenreArchitecture, getSignatureTail, getVocalPlan, measureRewriteDifference, normalizeNumberedList, parseDiagnosisResponse, parseRewriteResponse, parseRewriteVerification, resolveTimbre, validateLyrics, validateRewritePreservation } from '../generator-engine.js';

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

test('rewrite prompt preserves author intent and requires four short result notes', () => {
  const prompt = buildRewritePrompt(
    '[Куплет]\nЯ оставил ключи на столе\n[Припев]\nНе выключай свет',
    { genres: ['Pop'], mood: 'Melancholic', lang: 'ru' },
    { intent: 'song', diagnosis: { raw: '1. Нет хука\n2. Строки разной длины' } },
  );
  assert.match(prompt, /Preserve the author's story, point of view, emotional intent/);
  assert.match(prompt, /Correct all five diagnosed problems/);
  assert.match(prompt, /4\. completed improvement/);
  assert.match(prompt, /Я оставил ключи на столе/);
});

test('rewrite response parser separates revised lyrics and editor notes', () => {
  const parsed = parseRewriteResponse(`<<<REVISED
[Verse 1]
Ключи остывают на краешке стола
REVISED
<<<NOTES
- Конкретизирован образ
- Выровнен ритм
NOTES`);
  assert.match(parsed.lyrics, /^\[Verse 1\]/);
  assert.match(parsed.notes, /Выровнен ритм/);
  assert.doesNotMatch(parsed.lyrics, /Конкретизирован/);
});

test('rewrite response parser accepts plain lyrics as a safe fallback', () => {
  const parsed = parseRewriteResponse('[Verse 1]\nКлючи остывают на столе');
  assert.equal(parsed.lyrics, '[Verse 1]\nКлючи остывают на столе');
  assert.equal(parsed.notes, '');
});

test('poem diagnosis does not force song structure', () => {
  const prompt = buildDiagnosisPrompt('Снег лежит на старой крыше', { lang: 'ru' }, 'poem');
  assert.match(prompt, /standalone poem/i);
  assert.match(prompt, /do not demand a chorus/i);
  assert.match(prompt, /Do not rewrite a single line/i);
});

test('song diagnosis uses a selected genre only as context', () => {
  const prompt = buildDiagnosisPrompt('Черновик песни', { lang: 'ru', genres: ['Hip-Hop'] }, 'song');
  assert.match(prompt, /use Hip-Hop as context/i);
  assert.match(prompt, /exactly five/i);
  assert.match(prompt, /exactly four/i);
});

test('diagnosis parser returns exactly five problems and four improvements', () => {
  const diagnosis = parseDiagnosisResponse(`<<<TYPE
song
TYPE
<<<SUMMARY
Припев пока повторяет куплет.
SUMMARY
<<<ISSUES
1. Нет хука
2. Строки разной длины
3. Рифма непоследовательна
4. Образы абстрактны
5. Нет развития
ISSUES
<<<PLAN
1. Выровнять строки
2. Создать припев
3. Усилить рифмы
4. Добавить развитие
PLAN`);
  assert.equal(diagnosis.type, 'song');
  assert.equal(diagnosis.issueCount, 5);
  assert.equal(diagnosis.planCount, 4);
  assert.match(diagnosis.issues, /^1\. Нет хука/);
  assert.match(diagnosis.plan, /Создать припев/);
});

test('rewrite prompt follows the approved result and diagnosis', () => {
  const prompt = buildRewritePrompt('Старый текст', { genres: ['Pop'], lang: 'ru' }, {
    intent: 'song',
    diagnosis: { raw: 'Припев не отличается от куплета.' },
  });
  assert.match(prompt, /Intended result: song/);
  assert.match(prompt, /Convert it into a complete singable song/);
  assert.match(prompt, /Припев не отличается/);
});

test('numbered list normalizer keeps four concise result items', () => {
  const result = normalizeNumberedList('1. Первое изменение\n2. Второе\n3. Третье\n4. Четвёртое\n5. Лишнее', 4);
  assert.equal(result.count, 4);
  assert.equal(result.text.split('\n').length, 4);
  assert.doesNotMatch(result.text, /Лишнее/);
});

test('rewrite verifier checks every diagnosed problem after editing', () => {
  const prompt = buildRewriteVerificationPrompt('Исходник', 'Новая версия', { raw: '1. Нет рифмы' }, 'poem');
  assert.match(prompt, /all five diagnosed problems/i);
  assert.match(prompt, /For a poem, do not require song sections/i);
  assert.equal(parseRewriteVerification('<<<STATUS\nPASS\nSTATUS\n<<<REMAINING\n\nREMAINING').ok, true);
  const failed = parseRewriteVerification('<<<STATUS\nFAIL\nSTATUS\n<<<REMAINING\n1. Осталась сбитая строка\nREMAINING');
  assert.equal(failed.ok, false);
  assert.equal(failed.remainingCount, 1);
});

test('rewrite difference ignores section labels and detects cosmetic edits', () => {
  const original = 'Первая строка\nВторая строка\nТретья строка\nЧетвёртая строка';
  const cosmetic = '[Verse 1]\nПервая строка\nВторая строка\nТретья строка\nЧетвёртая новая строка';
  const stronger = '[Verse 1]\nНовая первая\nНовая вторая\nНовая третья\nНовая четвёртая';
  assert.ok(measureRewriteDifference(original, cosmetic).changedRatio < 0.3);
  assert.equal(measureRewriteDifference(original, stronger).changedRatio, 1);
});

test('repair prompt explicitly rejects a cosmetic rewrite', () => {
  const prompt = buildRewriteRepairPrompt('Исходник', 'Почти исходник', {}, { summary: 'Слабый припев' }, 0.18);
  assert.match(prompt, /failed quality control/i);
  assert.match(prompt, /18%/);
  assert.match(prompt, /Слабый припев/);
});

test('rewrite preservation detects a narrator gender change', () => {
  const original = '[Verse 1]\nЯ иду по городу один';
  const changed = '[Verse 1]\nЯ иду по городу одна';
  const inconsistent = '[Verse 1]\nЯ иду по городу один\n[Verse 2]\nЯ осталась здесь одна';
  assert.deepEqual(validateRewritePreservation(original, changed).issues, ['narrator-gender-changed']);
  assert.ok(validateRewritePreservation(original, inconsistent).issues.includes('narrator-gender-inconsistent'));
  assert.equal(validateRewritePreservation(original, '[Verse 1]\nЯ иду по городу один').ok, true);
});

test('repair prompt locks narrator identity after a preservation failure', () => {
  const prompt = buildRewriteRepairPrompt('Я иду один', 'Я иду одна', {}, {}, 0.18, ['narrator-gender-changed']);
  assert.match(prompt, /narrator-gender-changed/);
  assert.match(prompt, /Never switch between masculine and feminine/i);
});
