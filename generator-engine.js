const GENRE_ARCHITECTURES = {
  Pop: { craft: 'immediate hook, concise images, clean escalation', delivery: ['intimate conversational', 'rising', 'open and powerful', 'stripped and vulnerable', 'soft fading'], syllables: [[7, 10], [6, 9], [5, 9], [6, 10], [4, 8]] },
  'Synth-pop': { craft: 'precise hook, luminous repetition, sleek contrast', delivery: ['cool intimate', 'synth-driven build', 'wide layered', 'filtered vulnerable', 'echoing fade'], syllables: [[7, 10], [6, 9], [5, 9], [6, 10], [4, 8]] },
  'Lo-fi': { craft: 'small details, understatement, hypnotic repetition', delivery: ['close-mic restrained', 'subtle lift', 'hushed layered', 'minimal exposed', 'tape-like fade'], syllables: [[5, 8], [5, 8], [4, 8], [5, 9], [3, 7]] },
  'Indie Rock': { craft: 'specific scene, tension, raw memorable refrain', delivery: ['restrained raw', 'tense build', 'full chest anthemic', 'bare exposed', 'rough fading'], syllables: [[7, 11], [6, 10], [6, 10], [6, 11], [4, 9]] },
  'R&B': { craft: 'conversational intimacy, melodic space, sensual internal rhyme', delivery: ['smooth close-mic', 'melodic rise', 'soulful layered', 'falsetto or stripped', 'soft runs'], syllables: [[7, 11], [6, 10], [5, 10], [6, 11], [4, 9]] },
  Folk: { craft: 'concrete storytelling, natural language, communal refrain', delivery: ['warm storytelling', 'natural lift', 'open communal', 'bare confessional', 'gentle fading'], syllables: [[8, 12], [7, 11], [7, 11], [7, 12], [5, 10]] },
  Soul: { craft: 'emotional testimony, call and response, vocal release', delivery: ['warm restrained', 'gospel-like rise', 'soulful full release', 'exposed testimony', 'ad-lib fade'], syllables: [[7, 11], [6, 10], [5, 10], [6, 11], [4, 9]] },
  'Dark Phonk': { craft: 'compressed menace, rhythmic cells, hard repeated chant', delivery: ['low rhythmic', 'pressure build', 'hard chant layered', 'half-time raw', 'filtered fade'], syllables: [[9, 16], [8, 14], [5, 12], [8, 16], [4, 10]], rhythmic: true },
  Electronic: { craft: 'minimal phrases, sonic repetition, gradual transformation', delivery: ['restrained hypnotic', 'processed build', 'wide repetitive layered', 'minimal filtered', 'spacious fade'], syllables: [[5, 9], [5, 9], [4, 8], [5, 10], [3, 7]] },
  'Hip-Hop': { craft: 'strong cadence, internal rhyme, fresh detail, quotable hook', delivery: ['rhythmic direct', 'pressure rising', 'melodic or chanted hook', 'half-time revealing', 'spoken fade'], syllables: [[10, 18], [8, 15], [6, 13], [9, 18], [5, 12]], rhythmic: true },
  Chanson: { craft: 'adult narrative, lived detail, clear turn and memorable refrain', delivery: ['natural storytelling', 'warm lift', 'open heartfelt', 'bare confessional', 'gentle resolved'], syllables: [[8, 12], [7, 11], [6, 11], [7, 12], [5, 10]] },
  Cinematic: { craft: 'visual narrative, mounting stakes, wide emotional payoff', delivery: ['restrained narrative', 'tension rising', 'wide soaring', 'stripped revelation', 'spacious resolved'], syllables: [[9, 14], [8, 13], [7, 12], [8, 14], [5, 11]] },
};

const DEFAULT_ARCHITECTURE = { craft: 'clear scene, emotional turn, memorable hook', delivery: ['intimate', 'building', 'full memorable', 'contrasting stripped', 'soft fading'], syllables: [[7, 11], [6, 10], [5, 10], [6, 11], [4, 9]] };
const SECTION_KEYS = ['verse', 'pre-chorus', 'chorus', 'bridge', 'outro'];

const PROFILES = {
  'Male vocal': { identity: '[Male Vocal] [Baritone G2–G4] [warm dark centre, rich chest tone]', style: 'male vocals, warm baritone', forbidden: /female|mezzo|soprano|contralto/i },
  'Female vocal': { identity: '[Female Vocal] [Mezzo A3–F5] [warm mid-range, clear upper tone]', style: 'female vocals, warm mezzo', forbidden: /male|baritone|tenor|bass range/i },
  'Duet M+F': { identity: '[Duet] [Male Baritone G2–G4 | Female Mezzo A3–F5]', style: 'male baritone and female mezzo duet, alternating leads', forbidden: null },
  Choir: { identity: '[Choir] [SATB]', style: 'SATB choir, layered blend', forbidden: null },
  "Children's choir": { identity: "[Children's Choir] [pure bright unison]", style: "children's choir, pure bright unison", forbidden: null },
  'Harmony vocals': { identity: '[Harmony Vocals] [lead + stacked harmonies]', style: 'lead vocal with tight stacked harmonies', forbidden: null },
  'No vocals': { identity: '[Instrumental] [No Vocals]', style: 'instrumental, no vocals', forbidden: null, instrumental: true },
};
const AUTO = { identity: '[Lead Vocal]', style: 'expressive lead vocals', forbidden: null };

export function getGenreArchitecture(brief = {}) {
  const genre = brief.genres?.[0];
  return { genre: genre || 'Default', ...(GENRE_ARCHITECTURES[genre] || DEFAULT_ARCHITECTURE) };
}

export function getVocalProfile(vocal) { return PROFILES[vocal] || AUTO; }

export function getVocalPlan(brief = {}) {
  const profile = getVocalProfile(brief.vocal);
  if (profile.instrumental) return { ...profile, header: profile.identity, sections: 'instrumental scene directions only' };
  const a = getGenreArchitecture(brief);
  const sections = SECTION_KEYS.map((key, i) => `${key}: ${a.delivery[i]}`).join('; ');
  return { ...profile, header: `${profile.identity} [Vocal Style: ${sections}]`, sections };
}

function rangeText(a) { return SECTION_KEYS.map((key, i) => `${key} ${a.syllables[i][0]}–${a.syllables[i][1]}`).join(', '); }

export function buildLyricsPrompt(brief) {
  const profile = getVocalPlan(brief);
  const a = getGenreArchitecture(brief);
  const language = { ru: 'Russian', en: 'English', mix: 'mostly Russian with a few natural English phrases' }[brief.lang] || 'Russian';
  const genres = brief.genres?.length ? brief.genres.join(' + ') : 'choose a fitting genre';
  return `You are the Track Start songwriting engine. Write one complete, original, publication-ready song.

INPUT
Idea: ${brief.idea}
Genre: ${genres}; primary architecture: ${a.genre}
Mood: ${brief.mood || 'choose a fitting emotional direction'}
Language: ${language}
Era: ${brief.era || 'modern'}
Instruments: ${brief.instruments || 'not specified'}

LOCKED VOCAL IDENTITY
The first line MUST be copied exactly:
${profile.header}
Section delivery plan: ${profile.sections}.

GENRE ARCHITECTURE
- Craft: ${a.craft}.
- Target syllable ranges: ${rangeText(a)}.
- These are musical targets, not rigid law. Natural grammar and word stress win. Keep neighbouring lines compatible; allow a deliberate short hook or expressive break.
${a.rhythmic ? '- For this genre, cadence, rhythmic cells and internal rhyme matter more than equal syllable totals.' : '- Let the chorus use cleaner, easier-to-sing phrasing than the verses.'}

SONGCRAFT
- Build one clear dramatic situation, a dominant emotion and a counter-emotion.
- Make a short title-worthy hook the first chorus line and repeat it naturally at least three times.
- Verse 1 establishes a concrete scene; Verse 2 adds an event or angle; Bridge reveals a turn or decision.
- Prefer physical details, gestures, places and active verbs over abstract labels and clichés.
- Use natural rhyme, slant rhyme, assonance and internal rhyme. Never distort grammar for rhyme.
- Do not copy existing songs or imitate a named living artist.

FORMAT
- Output only lyrics; no title, explanations or markdown fences.
- Line 1 is the locked vocal settings line.
- English tags with delivery guidance: [Verse 1 — ${a.delivery[0]}], [Pre-Chorus — ${a.delivery[1]}], [Chorus — ${a.delivery[2]}], [Verse 2 — ${a.delivery[0]}], [Pre-Chorus — ${a.delivery[1]}], [Chorus — ${a.delivery[2]}], [Bridge — ${a.delivery[3]}], [Final Chorus — ${a.delivery[2]}], [Outro — ${a.delivery[4]}].
- Repeat chorus text consistently; final chorus may add a small intensification.
${profile.instrumental ? '- Replace lyric lines with concise musical scene directions.' : '- Lyrics must remain strictly in the requested language.'}

Silently verify vocal identity, sections, hook, development, natural stress and ending.`;
}

export function buildStylePrompt(lyrics, brief) {
  const profile = getVocalPlan(brief); const a = getGenreArchitecture(brief);
  return `Create one compact AI music style string. Genre: ${brief.genres?.join(' x ') || a.genre}. Mood: ${brief.mood || 'coherent'}. Era: ${brief.era || 'modern'}. Instruments: ${brief.instruments || 'choose 2-4'}. Genre craft: ${a.craft}. Lyrics:\n${lyrics.slice(0, 5000)}\nLocked voice: ${profile.style}. Do not add another vocal identity. Return only genre blend, BPM, arrangement, production and dynamic arc, under 220 characters. No artists or model versions.`;
}

function cleanModelText(value) { return String(value || '').trim().replace(/^```(?:text)?\s*/i, '').replace(/\s*```$/i, '').trim(); }

export function countSyllables(line, lang = '') {
  const text = String(line).toLowerCase();
  if (lang === 'ru' || /[а-яё]/i.test(text)) return (text.match(/[аеёиоуыэюя]/gi) || []).length;
  return text.split(/[^a-z']+/).filter(Boolean).reduce((sum, word) => {
    let clean = word.replace(/(?:[^le]e|ed|es)$/i, m => m.slice(0, -1));
    return sum + Math.max(1, (clean.match(/[aeiouy]+/gi) || []).length);
  }, 0);
}

function sectionIndex(tag) {
  if (/pre-chorus/i.test(tag)) return 1; if (/final chorus|chorus/i.test(tag)) return 2;
  if (/bridge/i.test(tag)) return 3; if (/outro/i.test(tag)) return 4; return 0;
}

export function analyzeSyllables(lyrics, brief = {}) {
  const a = getGenreArchitecture(brief); let section = 0; const lines = [];
  for (const raw of String(lyrics).split(/\r?\n/)) {
    const line = raw.trim(); if (!line) continue;
    if (/^\[.*\]$/.test(line)) { if (!/Vocal|Instrumental|Choir|Duet/i.test(line)) section = sectionIndex(line); continue; }
    if ((line.match(/[\p{L}\p{N}']+/gu) || []).length < 2) continue;
    const count = countSyllables(line, brief.lang); const range = a.syllables[section];
    lines.push({ line, section: SECTION_KEYS[section], count, range, outside: count < range[0] - 2 || count > range[1] + 2 });
  }
  const outside = lines.filter(x => x.outside).length;
  return { total: lines.length, outside, ratio: lines.length ? outside / lines.length : 0, lines };
}

export function finalizeLyrics(raw, brief) {
  const profile = getVocalPlan(brief); let text = cleanModelText(raw); const lines = text.split(/\r?\n/);
  if (/^\[(?:Male Vocal|Female Vocal|Duet|Choir|Children's Choir|Harmony Vocals|Lead Vocal|Instrumental)/i.test(lines[0] || '')) lines.shift();
  return `${profile.header}\n${lines.join('\n').trim()}`.trim();
}

export function validateLyrics(lyrics, brief) {
  const profile = getVocalPlan(brief); const issues = [];
  if (!lyrics.startsWith(profile.header)) issues.push('vocal-header');
  if (!profile.instrumental) {
    for (const section of ['Verse 1', 'Chorus', 'Verse 2', 'Bridge', 'Final Chorus']) if (!new RegExp(`\\[${section}(?:\\s|—|\\])`, 'i').test(lyrics)) issues.push(`missing-${section.toLowerCase().replaceAll(' ', '-')}`);
    if (profile.forbidden?.test(lyrics.slice(profile.header.length))) issues.push('conflicting-vocal');
    const meter = analyzeSyllables(lyrics, brief); if (meter.total >= 8 && meter.ratio > 0.45) issues.push('syllable-balance');
  }
  if (lyrics.length < 500) issues.push('too-short');
  return { ok: issues.length === 0, issues };
}

export function buildRepairPrompt(lyrics, brief, issues) {
  const profile = getVocalPlan(brief); const a = getGenreArchitecture(brief); const meter = analyzeSyllables(lyrics, brief);
  return `Repair this song because it failed: ${issues.join(', ')}. Return only corrected lyrics. First line exactly: ${profile.header}\nKeep the idea, language and ${a.genre} architecture. Target ranges: ${rangeText(a)}; natural grammar wins. Current meter has ${meter.outside}/${meter.total} strongly outlying lines. Remove conflicting voice, restore required English tags, and preserve good lines.\n\n${lyrics}`;
}

export function finalizeStyle(raw, brief) {
  const profile = getVocalPlan(brief); let style = cleanModelText(raw).replace(/^['"]|['"]$/g, '');
  if (brief.vocal === 'Male vocal') style = style.replace(/female vocals?|mezzo|soprano|contralto/gi, '');
  if (brief.vocal === 'Female vocal') style = style.replace(/male vocals?|baritone|tenor|bass vocals?/gi, '');
  style = style.replace(/\s{2,}/g, ' ').replace(/\s+,/g, ',').trim(); return `${profile.style}, ${style}`.slice(0, 320);
}
