// Track Start — Generator v7 (по образцу Suno Assistant)

(function () {

  const FREE_DAILY = 3;
  function todayStr() { return new Date().toISOString().slice(0, 10); }
  function getUsedToday() {
    if (localStorage.getItem('ts_date') !== todayStr()) {
      localStorage.setItem('ts_date', todayStr());
      localStorage.setItem('ts_used', '0');
    }
    return parseInt(localStorage.getItem('ts_used') || '0', 10);
  }
  function incUsed() { localStorage.setItem('ts_used', getUsedToday() + 1); }
  function getFreeLeft() { return Math.max(0, FREE_DAILY - getUsedToday()); }
  function getKey() { return localStorage.getItem('ts_key') || ''; }
  function saveKey(k) { localStorage.setItem('ts_key', k.trim()); }
  function isPro() { return !!getKey(); }

  async function fetchServerKey() {
    try { const r = await fetch('/api/key'); const d = await r.json(); return d.key || ''; }
    catch { return ''; }
  }

  // ── BADGE ──────────────────────────────────────────────────────────────────
  function updateBadge() {
    const badge = document.getElementById('free-badge');
    const text  = document.getElementById('free-text');
    const dots  = document.getElementById('free-dots');
    const btn   = document.getElementById('generate');
    if (!badge) return;
    if (isPro()) {
      badge.className = 'free-badge pro-active';
      text.textContent = '✓ Pro — безлимитная генерация';
      dots.innerHTML = '';
      btn.className = 'gen-btn pro';
    } else {
      const left = getFreeLeft();
      badge.className = left > 0 ? 'free-badge' : 'free-badge limit';
      text.textContent = left > 0
        ? `Бесплатных генераций сегодня: ${left} из ${FREE_DAILY}`
        : 'Лимит исчерпан — возвращайся завтра или подключи ключ ⚙';
      dots.innerHTML = [0,1,2].map(i =>
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
    if (!v || v === 'No vocals') return '[Instrumental] [No Vocals]';
    if (v === 'Choir') return '[Choir] [SATB] [Vocal Style: full choral arrangement, epic, layered harmonies]';
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

    return `You are a professional hitmaker lyricist. Your lyrics must be publication-ready, emotionally powerful, rhythmically precise.

SONG BRIEF:
- Idea: ${brief.idea}
- Genre: ${genreStr}
- Mood: ${moodStr}
- Language: ${langMap[brief.lang] || 'Russian'} — write ALL lyrics STRICTLY in this language only
${instrLine}

ABSOLUTE RULES:
1. Do NOT mention musical instruments in lyrics text (unless provided in Key instruments)
2. Section tags ALWAYS in English only — Suno will SING non-English tags
3. VOCAL SETTINGS must be the very first line before any section tag
4. Copy this vocal settings line verbatim as line 1: ${vocalSettings}

RHYME RULES:
- FORBIDDEN Russian: любовь–кровь | ночь–дочь | друг–вдруг | огонь–горизонт
- FORBIDDEN English: love–above | heart–start | home–alone
- Use quality rhymes: ночь/дочь → замени на: сезон/телефон/поклон | свет/ответ/портрет

IMAGE RULES:
- Each line = ONE clear image, not two half-ideas joined by "но/и/а"
- BAD: "Я кричу, но ты не помнишь" | GOOD: "Я кричу — волна уносит"
- CONCRETE: не "грусть" а "мёртвый омут" / не "боль" а "соль на губах"
- FORBIDDEN clichés: звёзды светят / сердце бьётся / слёзы льются / душа поёт

RHYTHM: Lines in same section match syllable count ±1. Never end on weak syllable (-ишь,-ешь,-же,-бы,-ли)

STRUCTURE (3:00–3:30):
[Intro] 1-2 lines
[Verse 1] 4 lines
[Pre-Chorus] 2 lines
[Chorus] 4 lines — HOOK, must be singable, ≤8 syllables first line
[Verse 2] 4 lines — NEW angle
[Pre-Chorus] 2 lines
[Chorus] 4 lines
[Bridge] 3 lines — contrast in rhythm or perspective
[Final Chorus] 4 lines
[Outro] 1-2 lines

OUTPUT — return ONLY the lyrics, no JSON, no explanation:
${vocalSettings}

[Intro]
...

[Verse 1]
...

[Pre-Chorus]
...

[Chorus]
...

[Verse 2]
...

[Pre-Chorus]
...

[Chorus]
...

[Bridge]
...

[Final Chorus]
...

[Outro]
...`;
  }

  function buildStylePrompt(lyrics, brief) {
    const genreStr = brief.genres.length > 0 ? brief.genres.join(' + ') : 'pop';
    return `You are a professional Suno AI music producer.

Generate a Suno v5 style string for this song.

Genre: ${genreStr}
Mood: ${brief.mood || 'emotional'}
Vocal: ${brief.vocal || 'male vocal'}
Lyrics (for reference):
${lyrics.slice(0, 300)}

Style string format:
<genre> <BPM> BPM <vocal-descriptor> <2-3 sound descriptors> | <finish tags>
Target: 180-220 characters

BPM: Pop/R&B/Indie 96-115 | Rock/Synth-pop 110-132 | Electronic 120-138 | Folk/Lo-fi 72-96 | Dark Phonk 138-150

Finish tags — pick one:
EMOTIONAL: | deep emotional warmth | close-mic intimacy | analog texture | no generic AI polish | human breath imperfection
ENERGETIC: | raw energy | organic punch | wide stereo depth | no safe AI sound
ATMOSPHERIC: | cinematic space | subtle tape noise | no clean digital polish | air and silence matter

Negative tags: Folk/acoustic → no-808 | Clean Pop/Indie/Lo-fi → no-808 no-clap

NEVER include language names like "Russian" or "English".
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
        model: 'claude-sonnet-4-20250514',
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

    const personalKey = getKey();
    const freeLeft = getFreeLeft();
    if (!personalKey && freeLeft <= 0) {
      showError('Лимит на сегодня исчерпан. Возвращайся завтра или нажми ⚙ и добавь свой API ключ.');
      return;
    }

    const brief = { idea, genres: selectedGenres, mood: selectedMood, vocal: selectedVocal, lang: selectedLang, instruments };

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
      const key = personalKey || await fetchServerKey();
      if (!key) throw new Error('Нет API ключа. Нажми ⚙ вверху и добавь свой ключ.');

      // Шаг 1 — текст
      const lyrics = await callClaude(buildLyricsPrompt(brief), key, 2000);
      if (!lyrics.trim()) throw new Error('Пустой ответ от API. Попробуй ещё раз.');

      if (!personalKey) incUsed();

      // Показываем текст
      document.getElementById('gen-status').style.display = 'none';
      document.getElementById('lyrics-text').value = lyrics;
      document.getElementById('lyrics-ready').style.display = '';
      document.getElementById('step1-num').className = 'step-num done';
      document.getElementById('lyric-meta').textContent =
        `${selectedGenres.join('+') || 'auto'} · ${selectedMood || 'auto'} · ${selectedLang.toUpperCase()}`;
      updateBadge();

      // Шаг 2 — стиль
      document.getElementById('suno-panel').style.opacity = '1';
      document.getElementById('suno-empty').style.display = 'none';
      document.getElementById('suno-status').style.display = 'flex';

      try {
        const style = await callClaude(buildStylePrompt(lyrics, brief), key, 400);
        const styleClean = style.trim().replace(/^["']|["']$/g, '');
        const html = styleClean
          .replace(/&/g,'&amp;').replace(/</g,'&lt;')
          .replace(/\|/g,'<span style="color:var(--muted)">|</span>')
          .replace(/(\d{2,3})( BPM)/g,'<span style="color:#f59e0b">$1</span>$2');
        document.getElementById('suno-prompt').innerHTML = html;
        document.getElementById('suno-status').style.display = 'none';
        document.getElementById('suno-ready').style.display = '';
        document.getElementById('step2-num').className = 'step-num done';
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

    const key = getKey() || await fetchServerKey();
    if (!key) { alert('Нет API ключа'); return; }

    const btn = document.getElementById('fix-btn');
    btn.disabled = true;
    btn.textContent = '…';

    try {
      const fixed = await callClaude(buildFixPrompt(lyrics, request), key, 1500);
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

  // ── INIT ───────────────────────────────────────────────────────────────────
  document.getElementById('generate').addEventListener('click', runGenerate);
  document.getElementById('regen-btn').addEventListener('click', runGenerate);
  document.getElementById('fix-btn').addEventListener('click', runFix);

  initChips();
  initSettings();
  updateBadge();

})();
