const PROFILES = {
  'Male vocal': {
    header: '[Male Vocal] [Baritone G2–G4] [warm dark centre, rich chest tone] [Vocal Style: intimate verse, rising pre-chorus, powerful chorus, vulnerable bridge, soft outro]',
    style: 'male vocals, warm baritone, intimate-to-powerful delivery',
    sections: 'Verse: intimate and conversational; Pre-Chorus: building; Chorus: powerful and full; Bridge: vulnerable and stripped; Outro: soft and fading',
    forbidden: /female|mezzo|soprano|contralto/i,
  },
  'Female vocal': {
    header: '[Female Vocal] [Mezzo A3–F5] [warm mid-range, clear upper tone] [Vocal Style: intimate verse, rising pre-chorus, powerful chorus, vulnerable bridge, soft outro]',
    style: 'female vocals, warm mezzo, intimate-to-powerful delivery',
    sections: 'Verse: intimate and controlled; Pre-Chorus: building; Chorus: powerful and full; Bridge: vulnerable and stripped; Outro: soft and fading',
    forbidden: /male|baritone|tenor|bass range/i,
  },
  'Duet M+F': {
    header: '[Duet] [Male Baritone G2–G4 | Female Mezzo A3–F5] [Vocal Style: alternating intimate verses, shared rising pre-chorus, full harmony chorus, call-and-response bridge, soft duet outro]',
    style: 'male baritone and female mezzo duet, alternating leads, full chorus harmonies',
    sections: 'Verse 1 — Male: intimate; Verse 2 — Female: intimate; Pre-Chorus — Duet: building; Chorus — Duet: full harmony; Bridge — Male + Female: call and response',
    forbidden: null,
  },
  'Choir': {
    header: '[Choir] [SATB] [Vocal Style: soft unison verse, building layers, full choral chorus, a cappella bridge, fading hum outro]',
    style: 'SATB choir, layered blend, full choral swell',
    sections: 'Verse: soft unison; Pre-Chorus: building layers; Chorus: full choral swell; Bridge: a cappella; Outro: fading hum',
    forbidden: null,
  },
  "Children's choir": {
    header: "[Children's Choir] [pure bright unison] [Vocal Style: gentle verse, lifting chorus, hushed bridge, fading outro]",
    style: "children's choir, pure bright unison, gentle uplifting delivery",
    sections: 'Verse: gentle unison; Chorus: lifting swell; Bridge: hushed; Outro: fading',
    forbidden: null,
  },
  'Harmony vocals': {
    header: '[Harmony Vocals] [lead + stacked harmonies] [Vocal Style: intimate solo verse, doubled pre-chorus, full harmony chorus, call-and-response bridge, layered outro]',
    style: 'lead vocal with tight stacked harmonies, intimate verse, layered chorus',
    sections: 'Verse: intimate solo; Pre-Chorus: doubled; Chorus: stacked harmonies; Bridge: call and response; Outro: layered fade',
    forbidden: null,
  },
  'No vocals': {
    header: '[Instrumental] [No Vocals]',
    style: 'instrumental, no vocals',
    sections: 'Use instrumental scene tags only. Do not write sung lyric lines.',
    forbidden: null,
    instrumental: true,
  },
};

const AUTO = {
  header: '[Lead Vocal] [Vocal Style: intimate verse, rising pre-chorus, full chorus, contrasting bridge, soft outro]',
  style: 'expressive lead vocals, intimate-to-full dynamic arc',
  sections: 'Verse: intimate; Pre-Chorus: building; Chorus: full and memorable; Bridge: contrasting; Outro: soft',
  forbidden: null,
};

export function getVocalProfile(vocal) { return PROFILES[vocal] || AUTO; }

export function buildLyricsPrompt(brief) {
  const profile = getVocalProfile(brief.vocal);
  const language = { ru: 'Russian', en: 'English', mix: 'mostly Russian with a few natural English phrases' }[brief.lang] || 'Russian';
  const genres = brief.genres?.length ? brief.genres.join(' + ') : 'choose a fitting genre';
  return `You are the Track Start songwriting engine. Write one complete, original, publication-ready song.

INPUT
Idea or dramatic situation: ${brief.idea}
Genre: ${genres}
Mood: ${brief.mood || 'choose a fitting emotional direction'}
Language: ${language}
Era: ${brief.era || 'modern'}
Optional instruments for arrangement context only: ${brief.instruments || 'not specified'}

LOCKED VOCAL IDENTITY
The first line MUST be copied exactly:
${profile.header}
Never change the selected vocal identity. Section delivery plan: ${profile.sections}.

SONGCRAFT
- Build one clear dramatic situation, a dominant emotion and a counter-emotion.
- Create a short title-worthy hook before drafting; make it the first line of the chorus and repeat it naturally at least three times across choruses.
- Verse 1 establishes a concrete scene. Verse 2 adds a new event or angle. Bridge reveals a turn, decision or contradiction.
- Prefer physical details, gestures, places and active verbs over abstract emotion labels and clichés.
- Keep lines singable. Similar lines inside a section should have compatible length, but do not force every genre into one syllable count.
- Use natural rhyme, slant rhyme, assonance and internal rhyme where they serve meaning. Never distort grammar for rhyme.
- Do not copy existing songs or imitate a named living artist.

FORMAT
- Output only the complete lyrics. No title, explanations, markdown fences or closing message.
- Line 1 is the locked vocal settings line above.
- All section tags are English and include concise delivery guidance.
- Required structure: [Verse 1 — ...], [Pre-Chorus — ...], [Chorus — ...], [Verse 2 — ...], [Pre-Chorus — ...], [Chorus — ...], [Bridge — ...], [Final Chorus — ...], [Outro — ...].
- Repeat the chorus text consistently. The final chorus may add only a small intensification.
${profile.instrumental ? '- This is instrumental: replace lyric lines with concise musical scene directions.' : '- Lyrics must remain strictly in the requested language.'}

Before returning, silently verify the locked vocal identity, required sections, hook, new Verse 2 meaning, bridge contrast and complete ending.`;
}

export function buildStylePrompt(lyrics, brief) {
  const profile = getVocalProfile(brief.vocal);
  return `Create one compact style string for an AI music generator.
Genre: ${brief.genres?.length ? brief.genres.join(' x ') : 'choose a fitting hybrid'}
Mood: ${brief.mood || 'emotionally coherent'}
Era: ${brief.era || 'modern'}
Instruments: ${brief.instruments || 'choose 2-4 fitting instruments'}
Lyrics context:\n${lyrics.slice(0, 5000)}

The application will insert this locked vocal identity itself: ${profile.style}.
Do not add any male/female/duet identity of your own.
Return only: genre blend, BPM, arrangement, production character, dynamic arc, and optional concise negative guidance.
Keep it under 220 characters. Do not mention artists, model versions, viral, TikTok, radio-ready or explanations.`;
}

function cleanModelText(value) {
  return String(value || '').trim().replace(/^```(?:text)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

export function finalizeLyrics(raw, brief) {
  const profile = getVocalProfile(brief.vocal);
  let text = cleanModelText(raw);
  const lines = text.split(/\r?\n/);
  if (/^\[(?:Male Vocal|Female Vocal|Duet|Choir|Children's Choir|Harmony Vocals|Lead Vocal|Instrumental)/i.test(lines[0] || '')) lines.shift();
  text = `${profile.header}\n${lines.join('\n').trim()}`;
  return text.trim();
}

export function validateLyrics(lyrics, brief) {
  const profile = getVocalProfile(brief.vocal);
  const issues = [];
  if (!lyrics.startsWith(profile.header)) issues.push('vocal-header');
  if (!profile.instrumental) {
    for (const section of ['Verse 1', 'Chorus', 'Verse 2', 'Bridge', 'Final Chorus']) {
      if (!new RegExp(`\\[${section}(?:\\s|—|\\])`, 'i').test(lyrics)) issues.push(`missing-${section.toLowerCase().replaceAll(' ', '-')}`);
    }
    if (profile.forbidden?.test(lyrics.slice(profile.header.length))) issues.push('conflicting-vocal');
  }
  if (lyrics.length < 500) issues.push('too-short');
  return { ok: issues.length === 0, issues };
}

export function buildRepairPrompt(lyrics, brief, issues) {
  const profile = getVocalProfile(brief.vocal);
  return `Repair this song because it failed checks: ${issues.join(', ')}.
Return only the complete corrected lyrics.
First line must be copied exactly: ${profile.header}
Keep the requested language and idea. Remove any conflicting vocal identity. Restore all required English section tags and a complete song. Preserve good lines where possible.\n\n${lyrics}`;
}

export function finalizeStyle(raw, brief) {
  const profile = getVocalProfile(brief.vocal);
  let style = cleanModelText(raw).replace(/^['"]|['"]$/g, '');
  if (brief.vocal === 'Male vocal') style = style.replace(/female vocals?|mezzo|soprano|contralto/gi, '');
  if (brief.vocal === 'Female vocal') style = style.replace(/male vocals?|baritone|tenor|bass vocals?/gi, '');
  style = style.replace(/\s{2,}/g, ' ').replace(/\s+,/g, ',').trim();
  return `${profile.style}, ${style}`.slice(0, 320);
}
