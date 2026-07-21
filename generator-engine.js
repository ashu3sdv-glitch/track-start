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
const SIGNATURE_TAILS = {
  emotional: 'deep emotional warmth | close-mic intimacy | analog texture | no generic AI polish | human breath imperfection',
  energetic: 'raw energy no overproduce | organic punch | wide stereo depth | no safe AI sound | unexpected texture',
  atmospheric: 'cinematic space | subtle tape noise | unhurried tempo feel | no clean digital polish | air and silence matter',
};

// Compatible technique libraries restored from the Hitmaker vocal materials.
// Each family follows: verse, pre-chorus, chorus, bridge, outro.
const DELIVERY_FAMILIES = {
  pop: [
    ['breathy close-mic', 'conversational chest voice', 'rhythmic syllabic delivery'],
    ['rising vocal cry', 'speech-to-song build', 'controlled chest push'],
    ['crescendo belting', 'open layered harmonies', 'full chest anthemic delivery'],
    ['soft falsetto contrast', 'raw exposed vocal', 'intimate spoken-word turn'],
    ['fading subtone', 'whispered echo', 'hummed close'],
  ],
  rock: [
    ['restrained rasp', 'gritty chest voice', 'raw conversational delivery'],
    ['tense chest push', 'rising vocal cry', 'building rasp'],
    ['full-power belting', 'arena projection', 'gritty layered harmonies'],
    ['bare exposed vocal', 'half-time spoken tension', 'fragile head-voice break'],
    ['rough fading vocal', 'breathless close', 'distant group response'],
  ],
  soul: [
    ['breathy intimate phrasing', 'smooth chest-led vocal', 'laid-back melismatic touches'],
    ['gospel-tinged rise', 'vocal cry build', 'soulful speech-to-song lift'],
    ['soulful belting with vocal runs', 'call-and-response with choir', 'rich layered harmonies'],
    ['falsetto revelation', 'raw gospel testimony', 'rubato melismatic break'],
    ['soft vocal runs', 'hummed gospel fade', 'breathy ad-lib close'],
  ],
  narrative: [
    ['parlando storytelling', 'natural close-mic phrasing', 'warm intimate chest voice'],
    ['gentle speech-to-song lift', 'restrained vocal cry', 'communal build'],
    ['open heartfelt delivery', 'warm layered refrain', 'lead-and-group response'],
    ['bare confessional vocal', 'spoken-word revelation', 'rubato exposed turn'],
    ['gentle resolved fade', 'hummed close', 'quiet communal echo'],
  ],
  rhythmic: [
    ['precise syllabic delivery', 'percussive phrasing', 'low rhythmic flow'],
    ['staccato pressure build', 'tight speech-to-song rise', 'compressed rhythmic lift'],
    ['hard layered chant', 'melodic hook without runs', 'call-and-response hook'],
    ['half-time spoken-word turn', 'raw declamatory break', 'stripped rhythmic confession'],
    ['filtered spoken fade', 'short echoed chant', 'low ad-lib close'],
  ],
  electronic: [
    ['cool close-mic restraint', 'precise syllabic pulse', 'breathy processed vocal'],
    ['filtered rising layers', 'tight rhythmic build', 'speech-to-song automation lift'],
    ['wide stacked harmonies', 'punchy beat-locked chorus', 'processed call-and-response'],
    ['minimal vocoder contrast', 'filtered exposed vocal', 'spoken breakdown'],
    ['echoing vocal fragments', 'tape-like fade', 'wordless processed hum'],
  ],
  cinematic: [
    ['restrained narrative vocal', 'close-mic dramatic phrasing', 'low intimate register'],
    ['tension-rising vocal cry', 'orchestral speech-to-song lift', 'controlled crescendo'],
    ['wide soaring delivery', 'cinematic layered harmonies', 'lead with choir response'],
    ['stripped revelation', 'rubato exposed vocal', 'near-whisper dramatic turn'],
    ['spacious resolved fade', 'distant choir echo', 'breathy final line'],
  ],
  lofi: [
    ['hushed close-mic vocal', 'understated conversational phrasing', 'soft breath-first delivery'],
    ['subtle melodic lift', 'restrained layered build', 'gentle speech-to-song rise'],
    ['hushed stacked harmonies', 'soft repetitive hook', 'warm doubled vocal'],
    ['minimal spoken confession', 'fragile falsetto touch', 'bare bedroom vocal'],
    ['tape-worn whisper', 'fading hum', 'distant breathy echo'],
  ],
};

const GENRE_DELIVERY_FAMILY = {
  Pop: 'pop', 'Synth-pop': 'electronic', 'Lo-fi': 'lofi', 'Indie Rock': 'rock',
  'R&B': 'soul', Folk: 'narrative', Soul: 'soul', 'Dark Phonk': 'rhythmic',
  Electronic: 'electronic', 'Hip-Hop': 'rhythmic', Chanson: 'narrative', Cinematic: 'cinematic',
};

const MOOD_ARCS = {
  Nostalgic: ['warm reflective', 'gently lifting', 'yearning', 'memory-like', 'distant'],
  Melancholic: ['restrained aching', 'fragile rising', 'wide sorrowful', 'exposed', 'fading'],
  Romantic: ['tender intimate', 'yearning', 'warm open', 'vulnerable', 'soft'],
  Energetic: ['bright driven', 'fast-rising', 'high-energy', 'tense contrasting', 'breathless'],
  Hopeful: ['clear intimate', 'steadily lifting', 'radiant open', 'honest', 'uplifting'],
  Dark: ['low restrained', 'ominous building', 'intense shadowed', 'haunted', 'cold fading'],
  Dreamy: ['airy intimate', 'floating rise', 'wide ethereal', 'weightless', 'distant'],
  Angry: ['clipped tense', 'pressure-rising', 'forceful', 'raw confrontational', 'unresolved'],
  Peaceful: ['gentle close-mic', 'unhurried lift', 'warm spacious', 'quiet exposed', 'calm fading'],
  Euphoric: ['bright expectant', 'surging', 'soaring celebratory', 'suspended', 'triumphant'],
};

const TIMBRE_ACCENTS = {
  Bass: ['chest-led', '', 'low-register power', '', ''], Baritone: ['warm-centred', '', 'rich chest resonance', '', ''],
  Tenor: ['ringing', '', 'bright upper projection', '', ''], Contralto: ['smoky low-register', '', 'full-bodied middle', '', ''],
  'Mezzo-soprano': ['warm mid-range', '', 'clear upper lift', '', ''], Soprano: ['light crystalline', '', 'open top register', '', ''],
};

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
const VOICE_TIMBRES = {
  Bass: { identity: '[Male Vocal] [Bass E2–E4] [resonant chest depth, powerful low-mid]', style: 'male vocals, resonant deep bass' },
  Baritone: { identity: '[Male Vocal] [Baritone G2–G4] [warm dark centre, rich chest tone]', style: 'male vocals, warm baritone' },
  Tenor: { identity: '[Male Vocal] [Tenor C3–B4] [bright chest tone, ringing upper register]', style: 'male vocals, bright tenor' },
  Contralto: { identity: '[Female Vocal] [Contralto E3–E5] [deep smoky chest, silky upper register]', style: 'female vocals, smoky contralto' },
  'Mezzo-soprano': { identity: '[Female Vocal] [Mezzo-soprano A3–F5] [warm mid-range, clear upper tone]', style: 'female vocals, warm mezzo-soprano' },
  Soprano: { identity: '[Female Vocal] [Soprano C4–A5] [light crystalline tone, effortless top register]', style: 'female vocals, crystalline soprano' },
};

export function getGenreArchitecture(brief = {}) {
  const genre = brief.genres?.[0];
  return { genre: genre || 'Default', ...(GENRE_ARCHITECTURES[genre] || DEFAULT_ARCHITECTURE) };
}

export function getVocalProfile(vocal) { return PROFILES[vocal] || AUTO; }

export function resolveTimbre(brief = {}) {
  if (brief.timbre && brief.timbre !== 'Auto' && VOICE_TIMBRES[brief.timbre]) return brief.timbre;
  const primary = brief.genres?.[0];
  if (brief.vocal === 'Male vocal') {
    if (primary === 'Dark Phonk' || (primary === 'Cinematic' && brief.mood === 'Dark')) return 'Bass';
    if (['Pop', 'Synth-pop', 'Indie Rock', 'Electronic'].includes(primary) && ['Energetic', 'Hopeful', 'Euphoric'].includes(brief.mood)) return 'Tenor';
    return 'Baritone';
  }
  if (brief.vocal === 'Female vocal') {
    if (['Dark', 'Melancholic'].includes(brief.mood) && ['Soul', 'Chanson', 'Cinematic'].includes(primary)) return 'Contralto';
    if (['Pop', 'Synth-pop', 'Cinematic'].includes(primary) && ['Hopeful', 'Euphoric'].includes(brief.mood)) return 'Soprano';
    return 'Mezzo-soprano';
  }
  return '';
}

function stableHash(value) {
  let hash = 2166136261;
  for (const char of String(value || '')) { hash ^= char.codePointAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

export function getDeliveryPlan(brief = {}) {
  const architecture = getGenreArchitecture(brief);
  if (brief.vocal === 'Choir') return ['soft choral unison', 'building SATB layers', 'full choral swell', 'a cappella contrast', 'fading hum'];
  if (brief.vocal === "Children's choir") return ['gentle bright unison', 'lifting child-choir layers', 'pure open choral swell', 'hushed unison', 'fading hum'];
  const familyName = GENRE_DELIVERY_FAMILY[architecture.genre] || 'pop';
  const family = DELIVERY_FAMILIES[familyName];
  const mood = MOOD_ARCS[brief.mood] || ['', '', '', '', ''];
  const timbre = TIMBRE_ACCENTS[resolveTimbre(brief)] || ['', '', '', '', ''];
  const seed = stableHash([brief.idea, brief.mood, brief.genres?.join('|'), brief.timbre, brief.vocal].join('|'));
  return family.map((options, index) => {
    const technique = options[(seed + index * 17) % options.length];
    return [mood[index], timbre[index], technique].filter(Boolean).join(', ');
  });
}

export function getVocalPlan(brief = {}) {
  const baseProfile = getVocalProfile(brief.vocal);
  const timbre = resolveTimbre(brief);
  const profile = timbre ? { ...baseProfile, ...VOICE_TIMBRES[timbre] } : baseProfile;
  if (profile.instrumental) return { ...profile, header: profile.identity, sections: 'instrumental scene directions only' };
  const delivery = getDeliveryPlan(brief);
  const sections = SECTION_KEYS.map((key, i) => `${key}: ${delivery[i]}`).join('; ');
  return { ...profile, header: `${profile.identity} [Vocal Style: ${sections}]`, sections };
}

function rangeText(a) { return SECTION_KEYS.map((key, i) => `${key} ${a.syllables[i][0]}–${a.syllables[i][1]}`).join(', '); }

export function getSignatureTail(brief = {}) {
  if (['Energetic', 'Angry', 'Euphoric'].includes(brief.mood) || ['Indie Rock', 'Dark Phonk', 'Hip-Hop'].includes(brief.genres?.[0])) return SIGNATURE_TAILS.energetic;
  if (['Dreamy', 'Peaceful', 'Dark'].includes(brief.mood) || ['Lo-fi', 'Electronic', 'Cinematic'].includes(brief.genres?.[0])) return SIGNATURE_TAILS.atmospheric;
  return SIGNATURE_TAILS.emotional;
}

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
The selected voice is arrangement context only: ${profile.style}. Do not print vocal or performance settings yet.

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
- At no more than one emotional peak, you may write a short singable vowel extension with hyphens, such as О-о-о or А-а-а. For R&B or Soul, one natural word melisma such as Лю-ю-ю-блю is allowed. Never stretch consonants.
${a.rhythmic ? '- Do not use vowel extensions or melisma in rhythmic verses; keep every syllable precise.' : '- Vocal extensions are optional: omit them unless they strengthen a real emotional peak.'}
- Do not copy existing songs or imitate a named living artist.

FORMAT
- Output only clean lyrics; no title, explanations, vocal settings, performance notes or markdown fences.
- Use simple English tags only: [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Pre-Chorus], [Chorus], [Bridge], [Final Chorus], [Outro].
- Repeat chorus text consistently; final chorus may add a small intensification.
${profile.instrumental ? '- Replace lyric lines with concise musical scene directions.' : '- Lyrics must remain strictly in the requested language.'}

Silently verify vocal identity, sections, hook, development, natural stress and ending.`;
}

export function buildStylePrompt(lyrics, brief) {
  const profile = getVocalPlan(brief); const a = getGenreArchitecture(brief); const tail = getSignatureTail(brief);
  return `Create one compact AI music style string. Genre: ${brief.genres?.join(' x ') || a.genre}. Mood: ${brief.mood || 'coherent'}. Era: ${brief.era || 'modern'}. Instruments: ${brief.instruments || 'choose 2-4'}. Genre craft: ${a.craft}. Lyrics:\n${lyrics.slice(0, 5000)}\nLocked voice: ${profile.style}. Final chorus uses full vocal stack and choir backing. Do not add another vocal identity. Return only genre blend, BPM, arrangement, production and dynamic arc. Keep the part before the signature tail under 190 characters. End with exactly: | ${tail}. No artists, model versions, catchy, viral, TikTok or radio-ready.`;
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
  let text = cleanModelText(raw); const lines = text.split(/\r?\n/);
  if (/^\[(?:Male Vocal|Female Vocal|Duet|Choir|Children's Choir|Harmony Vocals|Lead Vocal|Instrumental)/i.test(lines[0] || '')) lines.shift();
  return lines.join('\n').trim().replace(/^\[(Verse 1|Verse 2|Pre-Chorus|Chorus|Bridge|Final Chorus|Outro)\s*[—-][^\]]*\]/gim, '[$1]');
}

export function validateLyrics(lyrics, brief) {
  const profile = getVocalPlan(brief); const issues = [];
  if (!profile.instrumental) {
    for (const section of ['Verse 1', 'Chorus', 'Verse 2', 'Bridge', 'Final Chorus']) if (!new RegExp(`\\[${section}(?:\\s|—|\\])`, 'i').test(lyrics)) issues.push(`missing-${section.toLowerCase().replaceAll(' ', '-')}`);
    if (profile.forbidden?.test(lyrics)) issues.push('conflicting-vocal');
    const meter = analyzeSyllables(lyrics, brief); if (meter.total >= 8 && meter.ratio > 0.45) issues.push('syllable-balance');
  }
  if (lyrics.length < 500) issues.push('too-short');
  return { ok: issues.length === 0, issues };
}

export function buildRepairPrompt(lyrics, brief, issues) {
  const profile = getVocalPlan(brief); const a = getGenreArchitecture(brief); const meter = analyzeSyllables(lyrics, brief);
  return `Repair this song because it failed: ${issues.join(', ')}. Return only clean corrected lyrics, without vocal settings or performance notes. Keep the idea, language and ${a.genre} architecture. Target ranges: ${rangeText(a)}; natural grammar wins. Current meter has ${meter.outside}/${meter.total} strongly outlying lines. Use simple English tags [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Bridge], [Final Chorus], [Outro]. Preserve good lines.\n\n${lyrics}`;
}

export function applyPerformanceSettings(lyrics, brief = {}) {
  const profile = getVocalPlan(brief); const deliveryPlan = getDeliveryPlan(brief);
  let clean = finalizeLyrics(lyrics, brief);
  const delivery = { 'Verse 1': deliveryPlan[0], 'Verse 2': deliveryPlan[0], 'Pre-Chorus': deliveryPlan[1], Chorus: deliveryPlan[2], Bridge: deliveryPlan[3], 'Final Chorus': `${deliveryPlan[2]}, full vocal stack, choir backing`, Outro: deliveryPlan[4] };
  if (brief.vocal === 'Duet M+F') {
    delivery['Verse 1'] += ', male lead'; delivery['Verse 2'] += ', female lead';
    delivery.Chorus += ', duet harmony'; delivery['Final Chorus'] += ', duet harmony'; delivery.Bridge += ', male-female call and response';
  }
  clean = clean.replace(/^\[(Verse 1|Verse 2|Pre-Chorus|Chorus|Bridge|Final Chorus|Outro)\]$/gim, (_, section) => `[${section} — ${delivery[section]}]`);
  return `${profile.header}\n${clean}`.trim();
}

export function finalizeStyle(raw, brief) {
  const profile = getVocalPlan(brief); let style = cleanModelText(raw).replace(/^['"]|['"]$/g, '');
  if (brief.vocal === 'Male vocal') style = style.replace(/female vocals?|mezzo|soprano|contralto/gi, '');
  if (brief.vocal === 'Female vocal') style = style.replace(/male vocals?|baritone|tenor|bass vocals?/gi, '');
  style = style
    .replace(/\|?\s*(?:deep emotional warmth|raw energy no overproduce|cinematic space)\b[\s\S]*$/i, '')
    .replace(/\b(?:catchy|viral|tiktok|radio-ready(?: master)?)\b/gi, '')
    .replace(/\s{2,}/g, ' ').replace(/\s+,/g, ',').replace(/[|,\s]+$/g, '').trim();
  const base = `${profile.style}, ${style}`.slice(0, 190).replace(/[|,\s]+$/g, '');
  return `${base} | ${getSignatureTail(brief)}`;
}
