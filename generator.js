// Track Start — Generator v7 (по образцу Suno Assistant)

(function () {

  const FREE_TOTAL = 5; // всего на пробу, без ежедневного сброса
  function getUsed() {
    // миграция со старого суточного счётчика
    const legacy = parseInt(localStorage.getItem('ts_used') || '0', 10);
    const total = parseInt(localStorage.getItem('ts_free_used') || '0', 10);
    return Math.max(total, legacy);
  }
  function incUsed() { localStorage.setItem('ts_free_used', getUsed() + 1); }
  function getFreeLeft() { return Math.max(0, FREE_TOTAL - getUsed()); }
  function getKey() { return localStorage.getItem('ts_key') || ''; }
  function saveKey(k) { localStorage.setItem('ts_key', k.trim()); }

  // Оплаченный тариф: токен выдаёт сервер после платежа (success.html),
  // подпись проверяется на сервере — здесь только читаем срок и название
  function getPlan() {
    try {
      const t = localStorage.getItem('ts_plan_token') || '';
      if (!t) return '';
      const p = JSON.parse(atob(t.split('.')[0]));
      if (p && p.exp > Date.now() && (p.plan === 'pro' || p.plan === 'lite')) return p.plan;
    } catch (e) {}
    return '';
  }
  function hasUnlimited() { return getPlan() === 'pro' || !!getKey(); }

  // ── BADGE ──────────────────────────────────────────────────────────────────
  function updateBadge() {
    const badge = document.getElementById('free-badge');
    const text  = document.getElementById('free-text');
    const dots  = document.getElementById('free-dots');
    const btn   = document.getElementById('generate');
    if (!badge) return;
    const plan = getPlan();
    if (plan === 'pro') {
      badge.className = 'free-badge pro-active';
      text.textContent = '✓ Pro — безлимитная генерация';
      dots.innerHTML = '';
      btn.className = 'gen-btn pro';
    } else if (getKey()) {
      badge.className = 'free-badge pro-active';
      text.textContent = plan === 'lite' ? '✓ Lite — безлимит со своим ключом' : '✓ Свой ключ — безлимитная генерация';
      dots.innerHTML = '';
      btn.className = 'gen-btn pro';
    } else if (plan === 'lite') {
      badge.className = 'free-badge';
      text.textContent = 'Lite активен — нажми ⚙ и добавь свой API-ключ Claude';
      dots.innerHTML = '';
      btn.className = 'gen-btn';
    } else {
      const left = getFreeLeft();
      badge.className = left > 0 ? 'free-badge' : 'free-badge limit';
      text.textContent = left > 0
        ? `Бесплатных генераций: ${left} из ${FREE_TOTAL}`
        : 'Бесплатные генерации закончились — подключи тариф или добавь свой ключ ⚙';
      dots.innerHTML = Array.from({ length: FREE_TOTAL }, (_, i) =>
        `<div class="free-dot${i >= left ? ' used' : ''}"></div>`).join('');
      btn.className = 'gen-btn';
    }
  }

  // ── SETTINGS ───────────────────────────────────────────────────────────────
  function initSettings() {
    const modal = document.getElementById('settings-modal');
    const input = document.getElementById('api-key-input');
    const status = document.getElementById('key-status');
    input.value = getKey();
    document.getElementById('open-settings').addEventListener('click', () => { modal.classList.add('open'); input.focus(); });
    document.getElementById('close-settings').addEventListener('click', () => modal.classList.remove('open'));
    document.getElementById('settings-backdrop').addEventListener('click', () => modal.classList.remove('open'));
    document.getElementById('api-key-save').addEventListener('click', () => {
      saveKey(input.value);
      status.style.display = 'block';
      status.style.color = input.value.trim() ? '#15803d' : 'var(--muted)';
      status.textContent = input.value.trim() ? '✓ Ключ сохранён' : 'Ключ удалён';
      updateBadge();
      setTimeout(() => modal.classList.remove('open'), 1000);
    });
  }

  // ── GENRE COMPAT ───────────────────────────────────────────────────────────
  const COMPAT = {
    "Pop":        { good: ["R&B","Indie Rock","Folk","Synth-pop","Lo-fi","Soul","Cinematic"], conflict: ["Dark Phonk","Hip-Hop"] },
    "Synth-pop":  { good: ["Electronic","Indie Rock","Pop","Lo-fi"],                         conflict: ["Folk","Chanson","Cinematic"] },
    "Lo-fi":      { good: ["Jazz","Folk","Indie Rock","Electronic","Pop","R&B","Soul"],       conflict: ["Dark Phonk","Hip-Hop","Chanson"] },
    "Indie Rock": { good: ["Folk","Pop","Lo-fi","Soul","Cinematic"],                         conflict: ["Dark Phonk","Chanson","Hip-Hop"] },
    "R&B":        { good: ["Pop","Soul","Electronic","Lo-fi"],                               conflict: ["Dark Phonk","Folk","Chanson"] },
    "Folk":       { good: ["Indie Rock","Pop","Lo-fi","Cinematic","Soul"],                   conflict: ["Dark Phonk","Electronic","Hip-Hop"] },
    "Soul":       { good: ["R&B","Lo-fi","Pop","Folk","Cinematic"],                          conflict: ["Dark Phonk","Hip-Hop","Electronic"] },
    "Dark Phonk": { good: ["Electronic","Hip-Hop"],                                          conflict: ["Folk","Chanson","Lo-fi","Cinematic","Soul","R&B","Pop","Synth-pop"] },
    "Electronic": { good: ["Pop","Synth-pop","Hip-Hop","R&B","Lo-fi"],                       conflict: ["Folk","Chanson","Cinematic","Soul"] },
    "Hip-Hop":    { good: ["R&B","Electronic","Lo-fi","Dark Phonk"],                         conflict: ["Folk","Chanson","Cinematic","Soul","Indie Rock"] },
    "Chanson":    { good: ["Folk","Pop"],                                                     conflict: ["Dark Phonk","Electronic","R&B","Hip-Hop","Synth-pop"] },
    "Cinematic":  { good: ["Folk","Indie Rock","Lo-fi","Soul","Pop"],                         conflict: ["Dark Phonk","Hip-Hop","Electronic","Synth-pop"] },
  };

  let selectedGenres = [];
  let selectedMood   = '';
  let selectedVocal  = '';
  let selectedEra    = '';
  let selectedLang   = 'ru';

  function getGenreStatus(g, selected) {
    if (selected.length === 0) return 'neutral';
    if (selected.includes(g)) return 'selected';
    if (selected.some(s => COMPAT[s]?.conflict?.includes(g))) return 'conflict';
    if (selected.every(s => COMPAT[s]?.good?.includes(g))) return 'good';
    return 'neutral';
  }

  function updateGenreChips() {
    document.querySelectorAll('[data-field="genre"] .chip-btn').forEach(btn => {
      const v = btn.getAttribute('data-v');
      const status = getGenreStatus(v, selectedGenres);
      btn.className = 'chip-btn';
      if (status === 'selected') btn.classList.add('active');
      else if (status === 'good') btn.classList.add('good');
      else if (status === 'conflict') btn.classList.add('conflict');
    });
  }

  function initChips() {
    // Genre — multiple (max 2)
    document.querySelector('[data-field="genre"]')?.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.getAttribute('data-v');
        if (selectedGenres.includes(v)) {
          selectedGenres = selectedGenres.filter(g => g !== v);
        } else if (selectedGenres.length < 2) {
          selectedGenres.push(v);
        }
        updateGenreChips();
      });
    });
    // Mood — single toggle
    document.querySelector('[data-field="mood"]')?.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.getAttribute('data-v');
        selectedMood = selectedMood === v ? '' : v;
        document.querySelectorAll('[data-field="mood"] .chip-btn').forEach(b =>
          b.classList.toggle('active', b.getAttribute('data-v') === selectedMood));
      });
    });
    // Vocal — single toggle
    document.querySelector('[data-field="vocal"]')?.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.getAttribute('data-v');
        selectedVocal = selectedVocal === v ? '' : v;
        document.querySelectorAll('[data-field="vocal"] .chip-btn').forEach(b =>
          b.classList.toggle('active', b.getAttribute('data-v') === selectedVocal));
      });
    });
    // Era — single toggle
    document.querySelector('[data-field="era"]')?.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.getAttribute('data-v');
        selectedEra = selectedEra === v ? '' : v;
        document.querySelectorAll('[data-field="era"] .chip-btn').forEach(b =>
          b.classList.toggle('active', b.getAttribute('data-v') === selectedEra));
      });
    });
    // Lang
    document.querySelectorAll('[data-lang-pick]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-lang-pick]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedLang = btn.getAttribute('data-lang-pick');
      });
    });
  }

  // ── VOCAL SETTINGS ─────────────────────────────────────────────────────────
  function buildVocalSettings() {
    const v = selectedVocal;
    if (!v) return 'AUTO — choose the best vocal type for this song idea and write the full vocal settings line';
    if (v === 'No vocals') return '[Instrumental] [No Vocals]';
    if (v === 'Choir') return '[Choir] [SATB] [cathedral swell, layered blend] [Vocal Style: soft unison verse, building layers pre-chorus, full choral swell chorus, a cappella bridge, fading hum outro]';
    if (v === "Children's choir") return "[Children's Choir] [unison C4–C5] [pure bright timbre, innocent clarity] [Vocal Style: gentle unison verse, lifting swell chorus, hushed bridge, fading outro]";
    if (v === 'Harmony vocals') return '[Harmony Vocals] [lead + stacked thirds] [tight layered blend around lead voice] [Vocal Style: solo intimate verse, doubled pre-chorus, full harmony stack chorus, call-response bridge, layered fade outro]';
    if (v === 'Duet M+F') return '[Duet] [Male Baritone G2–G4 | Female Mezzo A3–F5] [warm dark baritone | rich mezzo chest] [Vocal Style: solo intimate verse, unison pre-chorus tension, harmony chorus swell, call-response bridge, fading duet outro]';
    if (v === 'Male vocal') return '[Male Vocal] [Baritone G2–G4] [rich velvet tone in chest, slightly thinning above G3, warm dark centre] [Vocal Style: breathy intimate verse, rising intensity pre-chorus, crescendo belting chorus, falsetto bridge, fading subtone outro]';
    if (v === 'Female vocal') return '[Female Vocal] [Mezzo A3–F5] [rich chest voice in lower octave, soft and thin above E4, warm mid-range power] [Vocal Style: breathy intimate verse, vocal cry pre-chorus, crescendo belting chorus, falsetto bridge, fading subtone outro]';
    return '[Male Vocal] [Baritone G2–G4] [Vocal Style: breathy intimate verse, crescendo chorus, falsetto bridge]';
  }

  // ── PROMPTS ────────────────────────────────────────────────────────────────
  function buildLyricsPrompt(brief) {
    const langMap = { ru: 'Russian', en: 'English', mix: 'Russian with some English phrases' };
    const genreStr = brief.genres.length > 0 ? brief.genres.join(' + ') : 'choose best genre for this idea';
    const moodStr  = brief.mood  || 'choose best mood for this idea';
    const vocalSettings = buildVocalSettings();
    const instrLine = brief.instruments ? `Key instruments: ${brief.instruments}` : '';
    const eraLine = brief.era ? `Era: ${brief.era} — vocabulary, imagery and phrasing must match this era (see ERA RULES)` : '';

    return `You are a professional hitmaker lyricist with deep knowledge of song craft. Your lyrics must be publication-ready, emotionally powerful, rhythmically precise.

SONG BRIEF:
- Idea: ${brief.idea}
- Genre: ${genreStr}
- Mood: ${moodStr}
- Language: ${langMap[brief.lang] || 'Russian'} — write ALL lyrics STRICTLY in this language only
${eraLine}
${instrLine}

ABSOLUTE RULES:
1. Do NOT mention musical instruments in lyrics text (unless provided in Key instruments)
2. Section tags ALWAYS in English only — Suno will SING non-English tags as lyrics
3. VOCAL SETTINGS block must be the very FIRST line before any section tag
4. ${vocalSettings.startsWith('AUTO')
    ? 'Choose the best voice type for this song and write a complete vocal settings line as line 1. Format: [Voice Type] [Range e.g. G2–G4] [range description] [Vocal Style: per-section delivery]'
    : 'Copy this vocal settings line VERBATIM as line 1: ' + vocalSettings}

VOCAL SETTINGS FORMAT (if choosing automatically):
[Voice Type] [Range] [range character description] [Vocal Style: technique per section]
RANGE DESCRIPTION — always add after the note range, describing how the voice behaves:
- Bass E2–E4: resonant chest depth, loses body above D3, powerful low-mid
- Baritone G2–G4: rich velvet tone in chest, slightly thinning above G3, warm dark centre
- Tenor C3–B4: bright chest below A3, ringing passaggio, soaring head above
- Contralto E3–E5: deep smoky chest, full-bodied middle, silky upper register
- Mezzo A3–F5: rich chest voice in lower octave, soft and thin above E4, warm mid-range power
- Soprano C4–A5: light crystalline tone, full bloom above A4, effortless top register
Range ALWAYS with notes (G2–G4), never "low" or "high".

VOCAL STYLE — FORBIDDEN formats (adjectives only, no sections):
FORBIDDEN: [Vocal Style: crystalline, dreamy] / [Vocal Style: warm, emotional] / [Vocal Style: powerful, belting]
REQUIRED — name delivery technique FOR EACH SECTION (minimum 3 sections):
CORRECT: [Vocal Style: breathy intimate verse, vocal cry pre-chorus, crescendo belting chorus, falsetto bridge, fading subtone outro]
Per-section delivery menu:
- Verse: breathy intimate / close-mic whisper / parlando storytelling / intimate chest
- Pre-Chorus: vocal cry / rising intensity / speech-to-song / chest push
- Chorus: crescendo belting / full chest power / arena projection / soaring head voice
- Bridge: falsetto / subtone ghost / spoken word / raw exposed vocal
- Outro: fading subtone / dying fall / whispered echo / hummed close
PRE-OUTPUT CHECK: does my Vocal Style contain the words "verse", "chorus", "bridge"? If NO — rewrite it.
For duets tag each section: [Verse — Male], [Chorus — Duet], [Bridge — Male + Female]

SECTION TAGS — every tag must include delivery:
[Intro — description] / [Verse 1 — delivery] / [Pre-Chorus — delivery]
[Chorus — delivery] / [Verse 2 — delivery] / [Bridge — delivery]
[Final Chorus — delivery] / [Outro — delivery]
Optional: [Spoken Word — character] / [Instrumental Break — description]

RHYME DICTIONARIES:
RUSSIAN — FORBIDDEN: любовь–кровь | ночь–дочь | друг–вдруг | огонь–горизонт | волна–волна
RUSSIAN QUALITY RHYMES:
- огонь: миллион, сезон, закон, патрон, телефон, туман, обман, план, титан
- звезда: всегда, вода, сюда, тогда, навсегда, страна, война, тишина, цена
- мечта: красота, суета, темнота, пустота, чистота, высота
- сон: закон, телефон, поклон, район, сезон, вагон, балкон
- тень: день, лень, сирень, олень, ступень
- свет: ответ, портрет, привет, билет, поэт, расцвет, предмет
- мир: эфир, командир, кумир, сувенир, ампир
- жизнь: держись, борись, явись, откройся
- вера: сфера, атмосфера, карьера, вечера
- свобода: природа, погода, народа, похода, года
- волна: весна, луна, стена, она, страна, тишина
- земля: семья, моя, друзья, края, судья
- сердце: солнце, конец, отец, наконец, певец, венец
- дом: кругом, хором, объёмом, знакомо
- глаз: сейчас, враз, приказ, показ, рассказ
ENGLISH — FORBIDDEN: love–above | heart–start | home–alone
ENGLISH QUALITY RHYMES:
- night: light, right, bright, fight, flight, height, sight, midnight
- fire: higher, wire, admire, desire, inspire, require, entire
- dream: seem, team, scream, stream, gleam, beam, esteem, redeem
- time: rhyme, climb, prime, chime, sublime, lifetime
- sky: high, fly, try, cry, deny, reply, goodbye
- pain: rain, gain, chain, brain, train, insane, explain, remain
- song: long, wrong, strong, belong, prolong, lifelong
- star: are, far, scar, guitar, avatar, superstar
- moon: soon, tune, balloon, monsoon, afternoon
Max 1 verb-verb rhyme per verse. Rhyme density ≥ 0.42. All rhymes from dictionaries or same quality level — none lazy.

WRITING TECHNIQUES:
1. Open vowels А О Э on strong beats (not Ы Й Щ)
2. Alliteration in chorus — repeated consonants create momentum
3. Internal rhymes within lines for density
4. Dynamic phrase pattern: long–short–long OR short–long–short
5. Bounce words with stress on beat 1: кайф, рай, бой, старт

IMAGE RULES (apply to every verse):
- Each line = ONE clear image — not two half-ideas joined by "но/и/а"
- BAD: "Я кричу, но ты не помнишь" | GOOD: "Я кричу — волна уносит"
- Images must be CONCRETE: не "грусть" а "мёртвый омут" / не "боль" а "соль на губах"
- Every verse must have ONE anchor image that carries the whole section
- Avoid abstract nouns as subject: не "любовь ушла", а "ты закрыла дверь"
- FORBIDDEN clichés: звёзды светят / сердце бьётся / слёзы льются / ночь темна / душа поёт / мечта зовёт / любовь как сон
- Replace clichés with SPECIFIC physical detail: запах, звук, движение, температура

RHYTHM RULES (check every line):
- Word stress must land on strong beats — no weak endings stressed
- Lines in same section must match syllable count ±1
- Never end a line on a gerund (-я, -ясь) or weak particle (же, бы, ли) or weak syllable (-ишь, -ешь)
- First Chorus line ≤8 syllables

SYLLABLES BY GENRE:
ROCK: 6-8 max, strong accent beat 1, AABB, short punchy phrases
FOLK/CHANSON: 8-10, narrative storytelling, ABAB
HIP-HOP/DARK PHONK: dense 12-16, internal rhymes, multi-syllabic
R&B/SOUL: smooth 8-10, repetition, intimate sensory
POP/SYNTH-POP: exactly 8-10, AABB, maximum catchiness
ELECTRONIC/LO-FI: minimalist 5-8, hypnotic repetition
CINEMATIC: long 10-13, rich imagery
INDIE ROCK: 8-10, ABAB or free, introspective quirky
BPM GUIDE (Max Martin): 60-76 BPM → 6-7 syllables | 80-100 → 7-9 | 105-120 → 8-10 | 126-150 → 9-12

HIT FORMULA:
- Song length: ~3:24 optimal, Intro max 10 seconds
- Chorus must appear before the 0:50 mark
- Hook: 3-note earworm — simple + singable + familiar-but-new, repeated ≥3 times
- Max 3-4 unique melodies
- Verse 2 carries NEW meaning — not a repeat of Verse 1
- Bridge contrasts in rhythm or perspective

VOCAL TECHNIQUES (use max 2-3 per song, where they serve the emotion):
- (whispered: текст) — intimate moments
- [Screamed] TEXT — aggressive rock only
- WORD+ — vowel stretch for peaks
- [Ad-lib] ах-ах x2 — rhythmic decoration
- [Backing vocals: female] — harmony layer

ERA RULES (apply only if Era is set):
- 20s-40s: swing/cabaret vocabulary, short punchy lines, simple rhymes
- 50s-60s: clean romance, simple emotions
- 70s: storytelling, longer lines, дорога/надежда/рассвет
- 80s: theatrical, character-mask, night city, neon
- 90s: raw conversational, grunge/r&b energy
- 2000s: hook-first, early streaming era
SOVIET/RETRO MODE (Russian language + era 60s-80s):
- Concrete detail → universal feeling
- 60s: hero in situation (танцплощадка, поезд, парк) | 70s: philosophical, дорога/надежда/рассвет/звёзды | 80s: theatrical, маэстро/художник, ночной город
- FORBIDDEN words: стресс, депрессия, хайп, лайк, контент, токсичность — use грусть/тоска, работа/труд, душа/сердце
- NEVER end hopeless — at least one line of hope
- Anchor words: надежда, родина, молодость, судьба, дорога, верность, память, огонь

STRUCTURE (3:00–3:30):
[Intro — ...] 1-2 lines
[Verse 1 — ...] 4 lines
[Pre-Chorus — ...] 2 lines
[Chorus — ...] 4 lines — HOOK, first line ≤8 syllables
[Verse 2 — ...] 4 lines — NEW angle
[Pre-Chorus — ...] 2 lines
[Chorus — ...] 4 lines
[Bridge — ...] 3 lines — contrast
[Final Chorus — ...] 4 lines
[Outro — ...] 1-2 lines
If INSTRUMENTAL (No vocals): replace lyric lines with scene tags like [haunting melody rises] [tension builds] [theme returns softly]

PRE-OUTPUT CHECKLIST — verify silently before answering:
✓ Vocal settings is line 1, contains range description AND per-section Vocal Style
✓ All section tags in English with delivery hint
✓ No forbidden rhymes, max 1 verb-verb rhyme per verse
✓ No cliché images, every verse has one concrete anchor image
✓ No line ends on weak syllable/gerund/particle
✓ Syllable counts match genre rules, sections ±1
✓ Hook repeated ≥3 times, Verse 2 has new angle
✓ Era vocabulary respected (if era set)

OUTPUT — return ONLY the lyrics, no JSON, no explanation, no title:
[Vocal Settings line here]

[Intro — ...]
...

[Verse 1 — ...]
...

[Pre-Chorus — ...]
...

[Chorus — ...]
...

[Verse 2 — ...]
...

[Pre-Chorus — ...]
...

[Chorus — ...]
...

[Bridge — ...]
...

[Final Chorus — ...]
...

[Outro — ...]
...`;
  }

  function buildStylePrompt(lyrics, brief) {
    const genreStr = brief.genres.length > 0 ? brief.genres.join(' x ') : 'pop';
    const hookLine = lyrics.split('\n').find(l => l && !l.startsWith('[')) || '';
    const eraLine = brief.era ? `Era: ${brief.era} — use the matching era anchor and retro finish` : '';
    const instrLine = brief.instruments ? `Key instruments: ${brief.instruments} — weave 1-2 into the string` : '';
    return `You are a professional Suno AI music producer. Generate a precise Suno style string.

Genre mix: ${genreStr}
Mood: ${brief.mood || 'emotional'}
Vocal: ${brief.vocal || 'choose fitting vocal'}
${eraLine}
${instrLine}
Hook reference: ${hookLine}

FORMAT: <genre-mix> <BPM> BPM <timbral preset> <vocal style descriptor> <2-3 sound descriptors> <2-3 hook words> <finish tags>
Target: 180-220 characters

GENRE MIX — always hybrid:
sad pop → cinematic indie-folk x lo-fi x dream-pop
rock ballad → post-grunge x cinematic strings x alt-rock
pop ballad → neo-soul x 70s orchestral pop x bedroom pop
dance pop → disco-funk x synth-pop x future bass
chill → organic house x lo-fi jazz x ambient pop
russian pop → 70s soft rock x modern indie-folk x chamber pop warmth
dark phonk → Memphis phonk x cold wave x dark industrial

BPM GRID — use ONLY: 60 64 68 72 76 80 84 88 92 96 100 105 110 115 120 126 132 138 144 150 156 162 168 174 180
Ballad/Lo-fi 60-80 | Folk/Chanson 80-100 | Pop/R&B/Soul 96-115 | Rock/Synth-pop 110-132 | Electronic 120-138 | Phonk/Hip-Hop 138-150

TIMBRAL PRESETS:
Male deep: worn velvet baritone / smoky tenement tenor / gravelled storyteller voice
Male young: raw street tenor / close-mic bedroom voice / cracked-edge earnest vocal
Female gentle: crystalline mezzo / breath-first folk soprano / intimate whisper alto
Female powerful: arena-stage alto belt / emotional floodgate mezzo / gospel-tinged contralto
Duet: worn velvet baritone x crystalline mezzo / smoky tenor x breath-first alto
Choir: SATB cathedral swell / layered gospel choir / cinematic mass choir

VOCAL STYLE DESCRIPTORS — pick one matching the genre:
Rhythmic/Hip-hop: syllabic vocals, rhythmic delivery, percussive phrasing
Intimate/Folk: breathy intimate, close-mic warmth, whisper-to-belt dynamic
Powerful/Rock: belting, full chest voice, arena-stage delivery
Jazz/Soul: melismatic, soulful runs, blue note bends, gospel-tinged
Electronic/Pop: syllabic locked to beat, punchy consonants, precise timing

ERA ANCHORS (use if Era is set):
70s: Late 1970s LA session musician warmth
80s: 1983 New York downtown club night
90s: 1990s Seattle basement recording
2000s: Early 2000s indie bedroom tape

FINISH TAGS — pick one set:
EMOTIONAL: | deep emotional warmth | close-mic intimacy | analog texture | no generic AI polish | human breath imperfection
ENERGETIC: | raw energy no overproduce | organic punch | wide stereo depth | no safe AI sound | unexpected texture
ATMOSPHERIC: | cinematic space | subtle tape noise | unhurried tempo feel | no clean digital polish | air and silence matter
RETRO (if era 20s-90s): | analog tape saturation | vinyl crackle | era-authentic mix | warm tube mastering
INSTRUMENTAL (if No vocals): | no-vocals | instrumental | plus one finish set above

NEGATIVE TAGS: Ballad/acoustic/retro → no-808 | Folk/Cinematic → no-drums | Clean Pop/Indie/Lo-fi → no-808 no-clap | Electronic/Hip-Hop/Phonk → do NOT add no-808
FORBIDDEN WORDS: catchy | viral | radio 2025 | tiktok | sidechain kick | radio-ready master
NEVER include "Russian" or "English"

Return ONLY the style string, nothing else.`;
  }

  function buildFixPrompt(lyrics, request) {
    return `You are a lyric editor. Fix the lyrics based on the user's request.

CURRENT LYRICS:
${lyrics}

FIX REQUEST: ${request}

RULES:
- Fix ONLY what was requested — keep everything else identical
- Preserve rhyme scheme and syllable count
- Keep all section tags exactly as they are (in English)
- Keep the Vocal Settings line (first line) unchanged
- Return the COMPLETE corrected lyrics, nothing else, no explanation`;
  }

  // ── CLAUDE CALL ────────────────────────────────────────────────────────────
  const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';

  async function callClaude(prompt, key, maxTokens = 2000) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e?.error?.message || `Ошибка API: ${res.status}`);
    }
    return (await res.json()).content?.[0]?.text || '';
  }

  // Серверная генерация — ключ хранится только на сервере
  async function callServer(prompt, maxTokens = 2000) {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        maxTokens,
        planToken: localStorage.getItem('ts_plan_token') || ''
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Ошибка сервера: ${res.status}`);
    return data.text || '';
  }

  // Единая точка: свой ключ → напрямую в API, иначе — через сервер
  function ask(prompt, maxTokens) {
    const personalKey = getKey();
    return personalKey
      ? callClaude(prompt, personalKey, maxTokens)
      : callServer(prompt, maxTokens);
  }

  // ── SHOW ERROR ─────────────────────────────────────────────────────────────
  function showError(msg) {
    document.getElementById('gen-status').style.display = 'none';
    document.getElementById('empty-lyrics').style.display = '';
    document.getElementById('empty-lyrics').innerHTML = `
      <div style="padding:20px;color:#c2410c;font-family:var(--font-mono);font-size:13px;background:#fff7ed;border-radius:var(--radius);border:1px solid #fed7aa;text-align:left;">
        ⚠ ${msg}
      </div>`;
  }

  // ── GENERATE ───────────────────────────────────────────────────────────────
  async function runGenerate() {
    const idea = document.getElementById('idea').value.trim();
    const instruments = document.getElementById('instruments').value.trim();
    if (!idea) { alert('Опиши идею песни — хотя бы пару слов'); return; }

    const unlimited = hasUnlimited();
    if (!unlimited && getFreeLeft() <= 0) {
      showError('Бесплатные генерации закончились. Подключи тариф на главной странице или нажми ⚙ и добавь свой API ключ.');
      return;
    }

    const brief = { idea, genres: selectedGenres, mood: selectedMood, vocal: selectedVocal, era: selectedEra, lang: selectedLang, instruments };

    // UI — loading
    document.getElementById('empty-lyrics').style.display = 'none';
    document.getElementById('lyrics-ready').style.display = 'none';
    document.getElementById('gen-status').style.display = 'flex';
    document.getElementById('suno-panel').style.opacity = '0.4';
    document.getElementById('suno-ready').style.display = 'none';
    document.getElementById('suno-empty').style.display = '';
    document.getElementById('suno-status').style.display = 'none';
    document.getElementById('step1-num').className = 'step-num';
    document.getElementById('step2-num').className = 'step-num dim';
    document.getElementById('generate').disabled = true;

    try {
      // Шаг 1 — текст
      const lyrics = await ask(buildLyricsPrompt(brief), 2000);
      if (!lyrics.trim()) throw new Error('Пустой ответ от API. Попробуй ещё раз.');

      if (!unlimited) incUsed();

      // Показываем текст
      document.getElementById('gen-status').style.display = 'none';
      document.getElementById('lyrics-text').value = lyrics;
      document.getElementById('lyrics-ready').style.display = '';
      document.getElementById('step1-num').className = 'step-num done';
      document.getElementById('lyric-meta').textContent =
        [selectedGenres.join('+') || 'auto', selectedMood || 'auto', selectedEra, selectedLang.toUpperCase()].filter(Boolean).join(' · ');
      updateBadge();

      // Шаг 2 — стиль
      document.getElementById('suno-panel').style.opacity = '1';
      document.getElementById('suno-empty').style.display = 'none';
      document.getElementById('suno-status').style.display = 'flex';

      try {
        const style = await ask(buildStylePrompt(lyrics, brief), 400);
        const styleClean = style.trim().replace(/^["']|["']$/g, '');
        const html = styleClean
          .replace(/&/g,'&amp;').replace(/</g,'&lt;')
          .replace(/\|/g,'<span style="color:var(--muted)">|</span>')
          .replace(/(\d{2,3})( BPM)/g,'<span style="color:#f59e0b">$1</span>$2');
        document.getElementById('suno-prompt').innerHTML = html;
        document.getElementById('suno-status').style.display = 'none';
        document.getElementById('suno-ready').style.display = '';
        document.getElementById('step2-num').className = 'step-num done';
        localStorage.setItem('ts_promotion_draft', JSON.stringify({
          title: idea.slice(0, 120),
          lyrics,
          genre: selectedGenres.join(' + '),
          mood: selectedMood,
          vocalType: selectedVocal,
          language: selectedLang,
          instruments,
          sunoPrompt: styleClean,
          createdAt: new Date().toISOString()
        }));
        localStorage.setItem('ts_vocal_draft', JSON.stringify({
          title: idea.slice(0, 120), lyrics, genre: selectedGenres.join(' + '),
          mood: selectedMood, vocalType: selectedVocal, language: selectedLang,
          createdAt: new Date().toISOString()
        }));
        document.getElementById('vocal-cta').style.display = 'flex';
        document.getElementById('promotion-cta').style.display = 'flex';
      } catch {
        document.getElementById('suno-status').style.display = 'none';
        document.getElementById('suno-empty').style.display = '';
        document.getElementById('suno-empty').textContent = 'Не удалось сгенерировать стиль. Попробуй ещё раз.';
      }

    } catch (err) {
      showError(err.message || 'Что-то пошло не так. Попробуй ещё раз.');
    } finally {
      document.getElementById('generate').disabled = false;
    }
  }

  // ── FIX ────────────────────────────────────────────────────────────────────
  async function runFix() {
    const request = document.getElementById('fix-request').value.trim();
    const lyrics  = document.getElementById('lyrics-text').value.trim();
    if (!request) { alert('Опиши что нужно исправить'); return; }
    if (!lyrics)  { alert('Сначала сгенерируй текст'); return; }

    const btn = document.getElementById('fix-btn');
    btn.disabled = true;
    btn.textContent = '…';

    try {
      const fixed = await ask(buildFixPrompt(lyrics, request), 1500);
      if (fixed.trim()) {
        document.getElementById('lyrics-text').value = fixed.trim();
        document.getElementById('fix-request').value = '';
      }
    } catch (err) {
      alert('Ошибка: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '✦ Исправить';
    }
  }

  // ── COPY ───────────────────────────────────────────────────────────────────
  function copyText(text, btn) {
    navigator.clipboard?.writeText(text).then(() => {
      const orig = btn.textContent;
      btn.textContent = '✓ Скопировано';
      setTimeout(() => { btn.textContent = orig; }, 1400);
    });
  }

  document.getElementById('copy-lyrics').addEventListener('click', e => {
    copyText(document.getElementById('lyrics-text').value, e.currentTarget);
  });

  document.getElementById('copy-suno').addEventListener('click', e => {
    copyText(document.getElementById('suno-prompt').innerText, e.currentTarget);
  });

  document.getElementById('promotion-cta').addEventListener('click', () => {
    window.location.href = 'promotion.html?source=generator';
  });
  document.getElementById('vocal-cta').addEventListener('click', () => {
    window.location.href = 'vocal.html?source=generator';
  });

  // ── INIT ───────────────────────────────────────────────────────────────────
  document.getElementById('generate').addEventListener('click', runGenerate);
  document.getElementById('regen-btn').addEventListener('click', runGenerate);
  document.getElementById('fix-btn').addEventListener('click', runFix);

  initChips();
  initSettings();
  updateBadge();

})();
