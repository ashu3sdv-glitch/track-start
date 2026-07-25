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

export function buildDiagnosisPrompt(draft, brief = {}, intent = 'song') {
  const a = getGenreArchitecture(brief);
  const meter = analyzeSyllables(draft, brief);
  const sectionFacts = String(draft || '').split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => /^\[[^\]]+\]$/.test(line))
    .map(tag => `${tag} → ${SECTION_KEYS[sectionIndex(tag)]}`)
    .join(', ') || 'section labels are absent';
  const meterFacts = meter.lines.slice(0, 80)
    .map((item, index) => `${index + 1}. [${item.section}] ${item.count} слогов; цель ${item.range[0]}–${item.range[1]}; допустимо ${Math.max(1, item.range[0] - 2)}–${item.range[1] + 2}; ${item.outside ? 'вне допустимого диапазона' : 'допустимо'} — ${item.line}`)
    .join('\n') || 'Нет строк, пригодных для автоматического подсчёта.';
  const language = { ru: 'Russian', en: 'English', mix: 'mostly Russian with some English phrases' }[brief.lang] || 'the draft language';
  const intentRules = {
    poem: 'Improve it as a standalone poem. Do not demand a chorus or song sections. Check line-length consistency, rhythm, rhyme scheme, natural language and imagery.',
    song: `Convert it into a song. Check line-length consistency, singability, rhyme scheme, section structure and chorus/hook. If a genre is selected, use ${a.genre} as context: ${a.craft}; target syllable ranges: ${rangeText(a)}.`,
  };
  return `You are the Track Start senior lyric diagnostician. Analyze the author's text before any rewriting. Do not rewrite a single line.

AUTHOR'S TEXT
<<<DRAFT
${String(draft || '').trim()}
DRAFT

TASK
- Intended result: ${intent}
- Language: ${language}
- Selected genre: ${brief.genres?.join(' + ') || 'not selected'}
- Mood: ${brief.mood || 'not selected'}
- ${intentRules[intent] || intentRules.song}

MEASURED METER FACTS — these numbers were calculated by the program and are authoritative:
${meterFacts}
TOTAL: ${meter.total}; OUTSIDE TARGET: ${meter.outside}.
RECOGNIZED SOURCE SECTIONS: ${sectionFacts}.

DIAGNOSTIC METHOD
- Find exactly five most important, concrete problems.
- Always check line lengths/syllable spread, rhythm/stress, rhyme pattern, clarity/imagery and form appropriate to the chosen result.
- Any claim about syllable counts or ranges must match MEASURED METER FACTS exactly. Never call an allowed line outside the allowed range.
- If few or no lines are outside the target, do not invent a meter violation; describe a real stress or phrasing problem instead.
- Trust RECOGNIZED SOURCE SECTIONS. Do not claim that correctly recognized verse, pre-chorus or chorus labels are swapped.
- Genre controls cadence, rhyme density, section energy and delivery—not the story's emotional meaning or image palette.
- Never call bright, tender or humorous imagery incompatible with a dark genre. Change emotional tone only when Mood explicitly requests it.
- When converting to a song, also check whether a memorable chorus/hook and section development are missing.
- Describe each problem in one short sentence, maximum 18 words. No essays, scores, compliments or repeated explanations.
- Propose exactly four concrete editing actions, maximum 14 words each.
- Put covered problem numbers at the START of every action, for example: "[1,2] Выровнять длину строк и ударения."
- Describe the editing outcome, not a ready-made replacement word. Never prescribe an isolated synonym without checking the whole stanza.
- Across the four actions, reference every problem number from 1 through 5 at least once.

OUTPUT FORMAT — use these delimiters exactly and write values in the author's language:
<<<TYPE
poem | song
TYPE
<<<SUMMARY
one short sentence, maximum 20 words
SUMMARY
<<<ISSUES
1. problem
2. problem
3. problem
4. problem
5. problem
ISSUES
<<<PLAN
1. [1,2] improvement
2. [3] improvement
3. [4] improvement
4. [5] improvement
PLAN

Do not output any other text.`;
}

export function parseDiagnosisResponse(raw) {
  const text = cleanModelText(raw);
  const section = name => (text.match(new RegExp(`<<<${name}\\s*([\\s\\S]*?)\\s*${name}(?:\\s|$)`, 'i'))?.[1] || '').trim();
  const issues = normalizeNumberedList(section('ISSUES'), 5, 200);
  const plan = normalizeNumberedList(section('PLAN'), 4, 180);
  const semanticText = `${issues.text}\n${plan.text}`.toLowerCase();
  const genreRecolorsMeaning = /(образ|весн|светл|нежн|юмор)[^\n]{0,100}(?:не адапт|противореч|несовмест)[^\n]{0,80}(?:жанр|phonk|фонк|dark)/i.test(semanticText)
    || /(?:жанр|phonk|фонк|dark)[^\n]{0,80}(?:требует|нужн)[^\n]{0,80}(?:мрач|тёмн|агрессивн)[^\n]{0,80}(?:образ|метафор|текст)/i.test(semanticText);
  const swapsRecognizedSections = /(?:pre-?chorus|пре-?хорус|предприпев)[^\n]{0,100}(?:перепут|неверн|ошибочн)[^\n]{0,80}(?:chorus|хорус|припев|размет)/i.test(semanticText);
  const fallbackProblems = ['1,2', '3', '4', '5'];
  const coveredPlan = plan.text.split(/\r?\n/).map((line, index) => {
    const item = line.replace(/^\d+\.\s*/, '');
    return `${index + 1}. ${/^\[[1-5,\s]+\]/.test(item) ? item : `[${fallbackProblems[index]}] ${item}`}`;
  });
  const canonical = `Кратко: ${section('SUMMARY')}\nПроблемы:\n${issues.text}\nПлан:\n${coveredPlan.join('\n')}`;
  return {
    type: section('TYPE') || 'song',
    summary: section('SUMMARY') || text,
    issues: issues.text,
    issueCount: issues.count,
    plan: coveredPlan.join('\n'),
    planCount: plan.count,
    planCoversAllProblems: plan.count === 4,
    semanticConstraintsOk: !genreRecolorsMeaning && !swapsRecognizedSections,
    raw: canonical,
  };
}

export function buildRewritePrompt(draft, brief = {}, options = {}) {
  const a = getGenreArchitecture(brief);
  const language = { ru: 'Russian', en: 'English', mix: 'mostly Russian with a few natural English phrases' }[brief.lang] || 'the draft language';
  const intent = options.intent || 'song';
  const diagnosis = options.diagnosis?.raw || options.diagnosis?.summary || 'No separate diagnosis supplied.';
  const intentRule = intent === 'poem'
    ? 'Keep it a poem. Do not add song sections, a chorus or repeated hook unless explicitly present in the draft.'
    : `Convert it into a complete singable song. Add useful sections and a memorable chorus. Use ${a.genre} architecture when a genre was selected.`;
  const editorRole = intent === 'poem'
    ? `You are the Track Start poetry editor. Rewrite the author's draft into a stronger poem while preserving its identity.`
    : `You are the Track Start song lyric editor. Rewrite the author's draft into a stronger, singable song while preserving its identity.`;
  const songContext = intent === 'poem'
    ? '- Do not apply genre, vocal, era, arrangement or Suno requirements.'
    : `- Genre: ${brief.genres?.join(' + ') || 'infer from the draft'}
- Mood: ${brief.mood || 'preserve the draft emotion'}
- Era: ${brief.era || 'modern unless the draft clearly requires another era'}
- Target architecture: ${a.genre}; ${a.craft}`;
  return `${editorRole}

AUTHOR'S DRAFT
<<<DRAFT
${String(draft || '').trim()}
DRAFT

CONTEXT
- Intended result: ${intent}. ${intentRule}
- Language: ${language}
${songContext}

NON-NEGOTIABLE EDITORIAL RULES
- Preserve the author's story, point of view, emotional intent and strongest distinctive lines.
- Do not invent a different plot, narrator, relationship or ending.
- Never imitate or quote an existing song or named artist.
- Use natural modern language and speakable syntax. For Russian, avoid stress collisions, dense consonant clusters and literary inversions made for rhyme.
- For Russian, verify grammatical case, verb government and agreement in every line; never sacrifice them for meter or rhyme.
- Genre changes cadence, rhyme density, section energy and delivery—not the author's emotional meaning or image palette.
- Keep bright spring imagery bright even in Dark Phonk unless the user explicitly selected a dark mood.
- Rebuild weak material by complete stanzas, not by replacing isolated lines independently.
- Infer the intended rhyme scheme stanza by stanza (such as ABAB, AABB or intentional free verse) and make line endings work together.
- Silently consider several natural endings for each rhyming pair. Never use filler, broken grammar or a meaningless image for rhyme.
- Read every new line literally: subject, verb and image must form a plausible statement, not merely a rhyme.
- Do not introduce a new addressee, relationship, object or event unless it clearly develops the original story.
- If a weak image spans two lines, repair the complete image and its logic; never replace one verb mechanically.
- Keep neighboring lines rhythmically compatible; natural stress and meaning are more important than exact syllable equality.
- Give each verse a clear job, make the chorus simpler and more memorable, and ensure the second verse develops the story.
- For Russian output, use Cyrillic only inside lyric lines. English is allowed only in section labels such as [Verse 1] and [Chorus].
- Keep existing section labels and section order when they work. If labels are missing, add only the minimum useful English labels such as [Verse 1], [Chorus], [Verse 2], [Bridge].
- Do not add vocal settings, performance notes, a title, markdown fences or a Suno style prompt.
- Return the complete revised lyric, not fragments.

APPROVED DIAGNOSIS AND EDIT PLAN
${diagnosis}

EXECUTION REQUIREMENT
- Correct all five diagnosed problems.
- Complete all four approved improvements.
- Do not leave a diagnosed error unchanged.
- Preserve the author's story, narrator and strongest distinctive material.

OUTPUT FORMAT — use these delimiters exactly:
<<<REVISED
complete revised lyrics
REVISED

Silently verify that the revision still feels like the author's song rather than a replacement.`;
}

export function parseRewriteResponse(raw) {
  const text = cleanModelText(raw);
  const revisedMatch = text.match(/<<<REVISED\s*([\s\S]*?)\s*REVISED(?:\s|$)/i);
  const notesMatch = text.match(/<<<NOTES\s*([\s\S]*?)\s*NOTES(?:\s|$)/i);
  if (revisedMatch) {
    return {
      lyrics: revisedMatch[1].trim(),
      notes: (notesMatch?.[1] || '').trim(),
    };
  }
  return { lyrics: text.replace(/<<<NOTES[\s\S]*$/i, '').trim(), notes: '' };
}

export function buildRewriteAuditPrompt(original, revision, diagnosis = {}, brief = {}) {
  const language = brief.lang === 'en' ? 'English' : 'Russian';
  const originalMeter = analyzeSyllables(original, brief);
  const revisedMeter = analyzeSyllables(revision, brief);
  const meterSummary = meter => `lines ${meter.total}; outside target ${meter.outside}; counts ${meter.lines.map(item => item.count).join(', ')}`;
  return `You are an independent Track Start lyric auditor. You did not write the revision. Compare facts only; do not praise it automatically and do not rewrite it.

ORIGINAL
${String(original || '').trim()}

REVISION
${String(revision || '').trim()}

APPROVED FIVE PROBLEMS AND FOUR-STEP PLAN
${diagnosis.raw || diagnosis.summary || ''}

PROGRAM-MEASURED METER
- Original: ${meterSummary(originalMeter)}
- Revision: ${meterSummary(revisedMeter)}

AUDIT RULES
- Return exactly five checks, one for each diagnosed problem in the same order.
- Start each check with ИСПРАВЛЕНО or ОСТАЛОСЬ when writing Russian; use FIXED or REMAINS only for English.
- Use ${language} only.
- Maximum 16 words per check.
- Never mention a word, line or image that is absent from ORIGINAL or REVISION.
- Put any exact wording you reference in «quotes»; every quoted fragment must occur verbatim in ORIGINAL or REVISION.
- Never invent a previous version. Base meter claims only on PROGRAM-MEASURED METER.
- Mark a problem FIXED only when the revision itself proves it. Otherwise mark it REMAINS.
- If any revised line has broken grammar, wrong case or verb government, attach it to the closest check and mark REMAINS.
- If a phrase is technically grammatical but unnatural or meaningless in context, mark the closest check REMAINS.

OUTPUT FORMAT
<<<STATUS
PASS if all five are fixed, otherwise FAIL
STATUS
<<<CHECKS
1. status — factual result for problem 1
2. status — factual result for problem 2
3. status — factual result for problem 3
4. status — factual result for problem 4
5. status — factual result for problem 5
CHECKS

Do not output any other text.`;
}

export function parseRewriteAudit(raw, lang = 'ru', original = '', revision = '') {
  const text = cleanModelText(raw);
  const section = name => (text.match(new RegExp(`<<<${name}\\s*([\\s\\S]*?)\\s*${name}(?:\\s|$)`, 'i'))?.[1] || '').trim();
  const checks = normalizeNumberedList(section('CHECKS'), 5, 180);
  const status = section('STATUS').toUpperCase();
  const wrongLanguage = lang === 'ru'
    ? checks.text.split(/\r?\n/).some(line => /^\d+\.\s*(?:FIXED|REMAINS)\b/i.test(line))
    : /[А-Яа-яЁё]/.test(checks.text);
  const comparable = value => String(value || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
  const sourceText = comparable(`${original}\n${revision}`);
  let grounded = true;
  const safeChecks = checks.text.split(/\r?\n/).map((line, index) => {
    const quoted = [...line.matchAll(/[«"]([^»"]+)[»"]/g)].map(match => comparable(match[1]));
    if (quoted.every(fragment => fragment && sourceText.includes(fragment))) return line;
    grounded = false;
    const status = lang === 'en' ? 'REMAINS — quoted evidence was not found in either text' : 'ОСТАЛОСЬ — цитата аудитора не найдена ни в исходнике, ни в результате';
    return `${index + 1}. ${status}`;
  }).join('\n');
  return {
    ok: status === 'PASS',
    status: status || 'FAIL',
    checks: safeChecks,
    checkCount: checks.count,
    languageOk: !wrongLanguage,
    grounded,
  };
}

export function normalizeNumberedList(value, expectedCount, maxChars = 140) {
  const lines = String(value || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const items = [];
  for (const line of lines) {
    const numbered = line.match(/^(\d+)[.)]\s*(.*)$/);
    if (numbered && Number(numbered[1]) === items.length + 1 && items.length < expectedCount) {
      items.push(numbered[2].trim());
    } else if (items.length && items.length < expectedCount) {
      items[items.length - 1] = `${items[items.length - 1]} ${line}`.trim();
    } else if (!numbered && items.length < expectedCount) {
      items.push(line.replace(/^[-*•]\s*/, '').trim());
    }
  }
  return {
    count: items.length,
    text: items.map((item, index) => {
      if (item.length <= maxChars) return `${index + 1}. ${item}`;
      const clipped = item.slice(0, maxChars - 1).replace(/\s+\S*$/, '').replace(/[\s,:;—-]+$/, '');
      return `${index + 1}. ${clipped}…`;
    }).join('\n'),
  };
}

function meaningfulLines(text) {
  return String(text || '').split(/\r?\n/)
    .map(line => line.trim().toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' '))
    .filter(line => line && !/^(verse|chorus|bridge|куплет|припев|бридж|outro|intro)(\s+\d+)?$/i.test(line));
}

export function measureRewriteDifference(original, revised) {
  const before = meaningfulLines(original);
  const after = meaningfulLines(revised);
  const beforeSet = new Set(before);
  const unchanged = after.filter(line => beforeSet.has(line)).length;
  const changedRatio = after.length ? 1 - unchanged / after.length : 0;
  return { beforeLines: before.length, afterLines: after.length, unchanged, changedRatio };
}

function narratorGenderMarkers(text) {
  const firstPerson = new Set(['я', 'мне', 'меня', 'мой', 'моя']);
  const lines = String(text || '').toLowerCase().split(/\r?\n/).filter(line => {
    const words = line.match(/\p{L}+/gu) || [];
    return words.some(word => firstPerson.has(word));
  });
  const words = lines.join(' ').match(/\p{L}+/gu) || [];
  const masculineWords = new Set(['один', 'сам', 'был', 'ушёл', 'пришёл', 'нашёл', 'устал', 'готов', 'виноват']);
  const feminineWords = new Set(['одна', 'сама', 'была', 'ушла', 'пришла', 'нашла', 'устала', 'готова', 'виновата']);
  const masculine = words.filter(word => masculineWords.has(word)).length;
  const feminine = words.filter(word => feminineWords.has(word)).length;
  return { masculine, feminine };
}

export function validateRewritePreservation(original, revised) {
  const source = narratorGenderMarkers(original);
  const result = narratorGenderMarkers(revised);
  const issues = [];
  if (source.masculine > 0 && source.feminine === 0 && result.feminine > 0) issues.push('narrator-gender-changed');
  if (source.feminine > 0 && source.masculine === 0 && result.masculine > 0) issues.push('narrator-gender-changed');
  if ((source.masculine > 0 || source.feminine > 0) && result.masculine > 0 && result.feminine > 0) issues.push('narrator-gender-inconsistent');
  return { ok: issues.length === 0, issues };
}

export function validateRewriteCraft(revised, brief = {}) {
  const issues = [];
  const lyricText = String(revised || '').split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !/^\[[^\]]+\]$/.test(line))
    .join(' ');
  if (brief.lang === 'ru' && /[A-Za-z]/.test(lyricText)) issues.push('foreign-script-in-russian-lyrics');
  if (brief.lang === 'en' && /[А-Яа-яЁё]/.test(lyricText)) issues.push('foreign-script-in-english-lyrics');
  return { ok: issues.length === 0, issues };
}

export function buildRewriteRepairPrompt(original, revision, brief = {}, diagnosis = {}, minimumRatio = 0.2, qualityIssues = []) {
  const issueText = qualityIssues.length
    ? qualityIssues.join(', ')
    : `fewer than ${Math.round(minimumRatio * 100)}% of meaningful lines changed`;
  return `The revision failed quality control: ${issueText}. Perform a corrective editorial pass.

ORIGINAL
${String(original || '').trim()}

CURRENT REVISION
${String(revision || '').trim()}

APPROVED DIAGNOSIS
${diagnosis.raw || diagnosis.summary || ''}

REQUIREMENTS
- Preserve the original story, point of view and strongest distinctive images.
- Preserve the narrator's person and gender consistently. Never switch between masculine and feminine forms unless the original explicitly contains multiple narrators.
- Substantially rewrite the weak lines identified in the diagnosis.
- Do not count section labels as meaningful changes.
- Improve hook, rhythm, natural stress, rhyme and concrete imagery where the diagnosis requests it.
- Repair whole stanzas so rhyme, rhythm and meaning work together; do not patch isolated line endings.
- Read every revised line literally and reject implausible subject-verb pairs or images created only for rhyme.
- For Russian, correct grammatical case, verb government and agreement before checking rhyme.
- Do not introduce a new addressee, relationship, object or event unless the original story supports it.
- Genre may change cadence and delivery, but must not darken or reverse the original emotion unless Mood explicitly requests it.
- Keep good lines from CURRENT REVISION; change only what failed the independent audit.
- Never invent a word or mix alphabets. For Russian lyrics, Latin letters are allowed only in English section labels.
- Correct every problem listed in the approved diagnosis.
- Return the complete revised text only. Do not evaluate your own work.

OUTPUT FORMAT
<<<REVISED
complete revised text
REVISED
`;
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
  if (/pre[\s-]?chorus/i.test(tag)) return 1; if (/final[\s-]?chorus|chorus/i.test(tag)) return 2;
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
  return lines.join('\n').trim()
    .replace(/^\[Pre[\s-]?Chorus\]$/gim, '[Pre-Chorus]')
    .replace(/^\[Verse\]$/gim, '[Verse 1]')
    .replace(/^\[(Verse 1|Verse 2|Pre-Chorus|Chorus|Bridge|Final Chorus|Outro)\s*[—-][^\]]*\]/gim, '[$1]');
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
