// Track Start — Generator v4 (промпт из Suno Assistant)

(function () {

  // ── DAILY FREE LIMIT ───────────────────────────────────────────────────────
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

  // ── API KEY ────────────────────────────────────────────────────────────────
  function getKey() { return localStorage.getItem('ts_key') || ''; }
  function saveKey(k) { localStorage.setItem('ts_key', k.trim()); }
  function isPro() { return !!getKey(); }

  async function fetchServerKey() {
    try {
      const r = await fetch('/api/key');
      const d = await r.json();
      return d.key || '';
    } catch { return ''; }
  }

  // ── COUNTER UI ─────────────────────────────────────────────────────────────
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
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Создать песню`;
    } else {
      const left = getFreeLeft();
      badge.className = left > 0 ? 'free-badge' : 'free-badge limit';
      text.textContent = left > 0
        ? `Бесплатных генераций сегодня: ${left} из ${FREE_DAILY}`
        : 'Лимит исчерпан — возвращайся завтра или подключи ключ';
      dots.innerHTML = [0,1,2].map(i =>
        `<div class="free-dot${i >= left ? ' used' : ''}"></div>`
      ).join('');
      btn.className = 'gen-btn';
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> Создать песню`;
    }
  }

  // ── SETTINGS MODAL ─────────────────────────────────────────────────────────
  function initSettings() {
    const modal   = document.getElementById('settings-modal');
    const input   = document.getElementById('api-key-input');
    const saveBtn = document.getElementById('api-key-save');
    const status  = document.getElementById('key-status');

    input.value = getKey();

    document.getElementById('open-settings').addEventListener('click', () => {
      modal.classList.add('open');
      input.focus();
    });
    document.getElementById('close-settings').addEventListener('click', () => modal.classList.remove('open'));
    document.getElementById('settings-backdrop').addEventListener('click', () => modal.classList.remove('open'));

    saveBtn.addEventListener('click', () => {
      const val = input.value.trim();
      saveKey(val);
      status.style.display = 'block';
      if (val) {
        status.style.color = '#15803d';
        status.textContent = '✓ Ключ сохранён — Pro режим активен';
      } else {
        status.style.color = 'var(--muted)';
        status.textContent = 'Ключ удалён';
      }
      updateBadge();
      setTimeout(() => modal.classList.remove('open'), 1200);
    });
  }

  // ── GENRE COMPATIBILITY ────────────────────────────────────────────────────
  const COMPAT = {
    "Synth-pop":  { good: ["Electronic","Indie","Pop","Lo-fi","Rock"],       conflict: ["Folk","Jazz","Classical","Шансон"] },
    "Lo-fi":      { good: ["Jazz","Folk","Indie","Electronic","Pop","R&B"],  conflict: ["Rock","Dark phonk","Шансон"] },
    "Инди-рок":   { good: ["Folk","Pop","Lo-fi","Rock","Jazz"],              conflict: ["Dark phonk","Шансон","Latin"] },
    "R&B":        { good: ["Pop","Jazz","Electronic","Lo-fi"],               conflict: ["Rock","Classical","Folk","Шансон"] },
    "Фолк":       { good: ["Инди-рок","Pop","Jazz","Lo-fi","Cinematic"],     conflict: ["Dark phonk","Electronic","Шансон"] },
    "Pop":        { good: ["R&B","Инди-рок","Фолк","Electronic","Synth-pop","Lo-fi"], conflict: ["Dark phonk","Шансон"] },
    "Dark phonk": { good: ["Electronic","Hip-hop","Trap"],                   conflict: ["Folk","Jazz","Classical","Шансон","Lo-fi"] },
    "Soul":       { good: ["R&B","Jazz","Pop","Lo-fi"],                      conflict: ["Dark phonk","Rock","Шансон"] },
    "Шансон":     { good: ["Фолк","Pop"],                                    conflict: ["Dark phonk","Electronic","R&B","Lo-fi","Synth-pop"] },
    "Hyperpop":   { good: ["Electronic","Pop","Synth-pop"],                  conflict: ["Фолк","Jazz","Classical","Шансон","Lo-fi"] },
  };

  function getGenreStatus(g, selected) {
    if (selected.length === 0) return 'neutral';
    if (selected.includes(g)) return 'selected';
    const conflict = selected.some(s => COMPAT[s]?.conflict?.includes(g));
    if (conflict) return 'conflict';
    const good = selected.every(s => COMPAT[s]?.good?.includes(g));
    if (good) return 'good';
    return 'neutral';
  }

  // ── CHIP GROUPS ────────────────────────────────────────────────────────────
  let selectedGenres = [];
  let selectedMood   = '';
  let selectedVocal  = '';
  let selectedLang   = 'ru';

  function initChips() {
    // Genres — multiple select с совместимостью
    const genreRow = document.querySelector('[data-field="genre"]');
    if (genreRow) {
      genreRow.querySelectorAll('.chip-btn').forEach(btn => {
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
    }

    // Mood — single
    document.querySelector('[data-field="mood"]')?.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-field="mood"] .chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedMood = btn.getAttribute('data-v');
      });
    });

    // Vocal — single
    document.querySelector('[data-field="vocal"]')?.querySelectorAll('.chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-field="vocal"] .chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedVocal = btn.getAttribute('data-v');
        updateVocalRange();
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

  function updateGenreChips() {
    document.querySelectorAll('[data-field="genre"] .chip-btn').forEach(btn => {
      const v = btn.getAttribute('data-v');
      const status = getGenreStatus(v, selectedGenres);
      btn.className = 'chip-btn';
      if (status === 'selected') btn.classList.add('active');
      else if (status === 'good')     btn.classList.add('good');
      else if (status === 'conflict') btn.classList.add('conflict');
    });
  }

  // Диапазоны вокала
  const VOICE_RANGES = {
    'male-bass':     { label: 'Бас',      range: 'E2–E4', desc: 'resonant chest depth, loses body above D3, powerful low-mid' },
    'male-baritone': { label: 'Баритон',  range: 'G2–G4', desc: 'rich velvet tone in chest, slightly thinning above G3, warm dark centre' },
    'male-tenor':    { label: 'Тенор',    range: 'C3–B4', desc: 'bright chest below A3, ringing passaggio C3–E3, soaring head above' },
    'female-alto':   { label: 'Альт',     range: 'G3–E5', desc: 'deep smoky chest, full-bodied through F3, silky upper register' },
    'female-mezzo':  { label: 'Меццо',    range: 'A3–F5', desc: 'rich chest voice in lower octave, soft and thin above E4, warm mid-range power' },
    'female-soprano':{ label: 'Сопрано',  range: 'C4–A5', desc: 'light crystalline tone, full bloom above A4, effortless top register' },
  };

  function updateVocalRange() {
    const wrap = document.getElementById('vocal-range-wrap');
    if (!wrap) return;
    const v = selectedVocal;
    if (!v || v === 'duet' || v === 'no-vocals') {
      wrap.style.display = 'none';
      return;
    }
    const isMale   = v === 'male';
    const isFemale = v === 'female';
    if (!isMale && !isFemale) { wrap.style.display = 'none'; return; }

    const keys = isMale
      ? ['male-bass','male-baritone','male-tenor']
      : ['female-alto','female-mezzo','female-soprano'];

    wrap.style.display = '';
    wrap.innerHTML = `
      <div class="gen-section-title">Диапазон голоса</div>
      <div class="chip-group" data-field="range">
        ${keys.map(k => `<button class="chip-btn" data-v="${k}">${VOICE_RANGES[k].label}<span style="font-size:10px;opacity:0.6;margin-left:4px;">${VOICE_RANGES[k].range}</span></button>`).join('')}
        <button class="chip-btn active" data-v="auto">Авто</button>
      </div>`;

    wrap.querySelectorAll('[data-field="range"] .chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        wrap.querySelectorAll('[data-field="range"] .chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  function getSelectedRange() {
    const active = document.querySelector('[data-field="range"] .chip-btn.active');
    if (!active) return null;
    const v = active.getAttribute('data-v');
    return v === 'auto' ? null : VOICE_RANGES[v] || null;
  }

  // ── READ BRIEF ─────────────────────────────────────────────────────────────
  function readBrief() {
    return {
      idea:   document.getElementById('idea').value.trim(),
      genres: selectedGenres,
      mood:   selectedMood,
      vocal:  selectedVocal,
      range:  getSelectedRange(),
      lang:   selectedLang
    };
  }

  // ── BUILD VOCAL SETTINGS LINE ──────────────────────────────────────────────
  function buildVocalSettings(b) {
    if (!b.vocal || b.vocal === 'no-vocals') return '[Instrumental] [No Vocals]';

    if (b.vocal === 'duet') {
      return `[Duet] [Male Baritone G2–G4 | Female Mezzo A3–F5] [warm dark baritone | rich mezzo chest] [Vocal Style: solo intimate verse, unison pre-chorus tension, harmony chorus swell, call-response bridge, fading duet outro]`;
    }

    const isMale = b.vocal === 'male';
    const type   = isMale ? 'Male Vocal' : 'Female Vocal';

    let rangeStr, descStr;
    if (b.range) {
      rangeStr = b.range.range;
      descStr  = b.range.desc;
    } else {
      if (isMale) { rangeStr = 'G2–G4'; descStr = 'rich velvet tone in chest, slightly thinning above G3, warm dark centre'; }
      else        { rangeStr = 'A3–F5'; descStr = 'rich chest voice in lower octave, soft and thin above E4, warm mid-range power'; }
    }

    return `[${type}] [${rangeStr}] [${descStr}] [Vocal Style: breathy intimate verse, rising intensity pre-chorus, crescendo belting chorus, falsetto bridge, fading subtone outro]`;
  }

  // ── MAIN PROMPT ────────────────────────────────────────────────────────────
  function buildPrompt(b) {
    const langMap = { ru: 'Russian', en: 'English', mix: 'Russian with some English phrases' };
    const genreStr = b.genres.length > 0 ? b.genres.join(' + ') : 'choose best genre for this idea';
    const moodStr  = b.mood  || 'choose best mood for this idea';
    const vocalSettings = buildVocalSettings(b);

    return `You are a professional hitmaker lyricist with deep knowledge of song craft. Your lyrics must be publication-ready, emotionally powerful, and rhythmically precise.

SONG BRIEF:
- Idea: ${b.idea}
- Genre: ${genreStr}
- Mood: ${moodStr}
- Language: ${langMap[b.lang] || 'Russian'}
- Duration: 3:00–3:30
- Structure: [Intro] [Verse 1] [Pre-Chorus] [Chorus] [Verse 2] [Pre-Chorus] [Chorus] [Bridge] [Final Chorus] [Outro]

ABSOLUTE RULES:
1. Do NOT mention musical instruments in lyrics text
2. Section tags ALWAYS in English only — Suno will SING non-English tags as lyrics
3. VOCAL SETTINGS block must be the very first line before any section tag
4. The vocal settings line for this song: ${vocalSettings}

VOCAL SETTINGS — copy this line verbatim as the first line:
${vocalSettings}

RHYME RULES:
FORBIDDEN Russian rhymes: любовь–кровь | ночь–дочь | друг–вдруг | огонь–горизонт
FORBIDDEN English rhymes: love–above | heart–start | home–alone
Use quality rhymes — night/light/sight | fire/higher/desire | dream/stream/gleam

IMAGE RULES:
- Each line must carry ONE clear image — not two half-ideas joined by "но/и/а"
- BAD: "Я кричу, но ты не помнишь" — two weak ideas
- GOOD: "Я кричу — волна уносит" — one action, one consequence
- Images must be CONCRETE: not "грусть" but "мёртвый омут" / not "боль" but "соль на губах"
- FORBIDDEN clichés: звёзды светят / сердце бьётся / слёзы льются / душа поёт / мечта зовёт

RHYTHM RULES:
- Lines in same section must match syllable count ±1
- Never end a line on a weak syllable (-ишь, -ешь, -же, -бы, -ли)
- Stress must fall on strong beats

PRE-OUTPUT CHECKLIST:
- Vocal settings block is the very first line ✓
- All section tags in English ✓  
- No forbidden rhymes ✓
- No clichéd images ✓
- Verse 2 has NEW angle/meaning ✓
- Bridge contrasts in rhythm or perspective ✓

OUTPUT FORMAT — exactly this structure:

===LYRICS===
${vocalSettings}

[Intro]
(1-2 lines)

[Verse 1]
(4 lines)

[Pre-Chorus]
(2 lines)

[Chorus]
(4 lines — HOOK)

[Verse 2]
(4 lines — NEW angle)

[Pre-Chorus]
(2 lines)

[Chorus]
(4 lines)

[Bridge]
(3 lines — contrast)

[Final Chorus]
(4 lines)

[Outro]
(1-2 lines)
===END_LYRICS===

===SUNO===
(style string: genre BPM vocal-descriptor sound-descriptors | finish-tags)
===END_SUNO===`;
  }

  // ── STYLE PROMPT ───────────────────────────────────────────────────────────
  function buildStylePrompt(b, lyrics) {
    const genreStr = b.genres.length > 0 ? b.genres.join(' + ') : 'pop';
    return `You are a professional Suno AI music producer.

Generate a Suno v5 style string for this song.

Genre: ${genreStr}
Mood: ${b.mood || 'emotional'}
Vocal: ${b.vocal || 'male vocal'}

Style string format:
<genre> <BPM> BPM <vocal-descriptor> <2-3 sound descriptors> <hook words from chorus> <finish tags>
Target length: 180-220 characters

BPM by genre: Pop/R&B/Indie 96-115 | Rock/Synthwave 110-132 | Electronic 120-138 | Folk/Lo-fi 72-96

Finish tags — pick one:
EMOTIONAL: | deep emotional warmth | close-mic intimacy | analog texture | no generic AI polish
ENERGETIC: | raw energy | organic punch | wide stereo depth | no safe AI sound
ATMOSPHERIC: | cinematic space | subtle tape noise | no clean digital polish
RETRO: | analog tape saturation | vinyl crackle | warm tube mastering

Negative tags:
- Folk/acoustic → no-808
- Clean Pop/Indie/Lo-fi → no-808 no-clap

NEVER include language names like "Russian" or "English".

Return ONLY the style string, nothing else, no JSON, no explanation.`;
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

  // ── PARSE ──────────────────────────────────────────────────────────────────
  function parse(text) {
    const lm = text.match(/===LYRICS===([\s\S]*?)===END_LYRICS===/);
    const sm = text.match(/===SUNO===([\s\S]*?)===END_SUNO===/);
    const raw = lm ? lm[1].trim() : text;
    const blocks = [];
    const re = /(\[[^\]]+\])\n([\s\S]*?)(?=\n\[|\n===|$)/g;
    let m;
    while ((m = re.exec(raw)) !== null) {
      const t = m[2].trim();
      if (t) blocks.push({ label: m[1].trim(), text: t });
    }
    return { blocks, suno: sm ? sm[1].trim() : '' };
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  function renderLyrics(blocks) {
    const doc = document.getElementById('lyric-doc');
    doc.innerHTML = '';
    blocks.forEach(b => {
      const card = document.createElement('div');
      card.className = 'lyric-block-card';
      card.innerHTML = `
        <div class="lb-label">${b.label}</div>
        <div class="lb-text" contenteditable="true" spellcheck="false">${b.text.replace(/</g,'&lt;').replace(/\n/g,'<br>')}</div>`;
      doc.appendChild(card);
    });
  }

  function renderSuno(suno) {
    if (!suno) return;
    document.getElementById('suno-prompt').innerHTML = suno
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/(\[[^\]]+\])/g,'<span class="tag">$1</span>')
      .replace(/(\d{2,3})( BPM)/g,'<span class="num">$1</span>$2')
      .replace(/\|/g,'<span style="color:#6b6862">|</span>');
    document.getElementById('suno-panel').style.display = '';
  }

  function showError(msg) {
    document.getElementById('gen-status').style.display = 'none';
    document.getElementById('empty-lyrics').style.display = 'none';
    document.getElementById('lyric-doc').innerHTML = `
      <div style="padding:20px;color:#c2410c;font-family:var(--font-mono);font-size:13px;background:#fff7ed;border-radius:var(--radius);border:1px solid #fed7aa;">
        ⚠ ${msg}
      </div>`;
  }

  // ── GENERATE ───────────────────────────────────────────────────────────────
  async function runGenerate() {
    const brief = readBrief();
    if (!brief.idea) { alert('Опиши идею песни — хотя бы пару слов'); return; }

    const personalKey = getKey();
    const freeLeft = getFreeLeft();

    if (!personalKey && freeLeft <= 0) {
      showError('Лимит на сегодня исчерпан. Возвращайся завтра или подключи свой API ключ (⚙ вверху).');
      return;
    }

    // loading
    document.getElementById('empty-lyrics').style.display = 'none';
    document.getElementById('lyric-doc').innerHTML = '';
    document.getElementById('gen-status').style.display = 'flex';
    document.getElementById('gen-status').innerHTML = '<span class="gen-dot"></span>Генерируем текст песни…';
    document.getElementById('suno-panel').style.display = 'none';
    document.getElementById('regen-lyrics').style.display = 'none';
    document.getElementById('generate').disabled = true;

    try {
      const key = personalKey || await fetchServerKey();
      if (!key) throw new Error('Нет API ключа. Нажми ⚙ «API ключ» вверху и добавь свой ключ.');

      // Шаг 1 — текст
      const raw = await callClaude(buildPrompt(brief), key, 2000);
      const { blocks, suno } = parse(raw);
      if (!blocks.length) throw new Error('Не удалось разобрать ответ. Попробуй ещё раз.');

      if (!personalKey) incUsed();

      renderLyrics(blocks);
      document.getElementById('gen-status').style.display = 'none';
      document.getElementById('regen-lyrics').style.display = '';
      document.getElementById('lyric-meta').textContent =
        `${brief.genres.join('+') || 'auto'} · ${brief.mood || 'auto'} · ${brief.lang.toUpperCase()}`;

      // Шаг 2 — стайл стринг
      if (suno) {
        renderSuno(suno);
      } else {
        document.getElementById('suno-panel').style.display = '';
        document.getElementById('suno-prompt').innerHTML = '<span style="color:var(--muted);font-family:var(--font-mono);font-size:12px;">Генерируем стиль…</span>';
        try {
          const styleRaw = await callClaude(buildStylePrompt(brief, raw), key, 400);
          renderSuno(styleRaw.trim());
        } catch { /* молча игнорируем если стиль не сгенерировался */ }
      }

      updateBadge();

    } catch (err) {
      showError(err.message || 'Что-то пошло не так. Попробуй ещё раз.');
    } finally {
      document.getElementById('generate').disabled = false;
    }
  }

  // ── COPY ───────────────────────────────────────────────────────────────────
  function copyText(text, btn) {
    const orig = btn.textContent;
    navigator.clipboard?.writeText(text).then(() => {
      btn.textContent = '✓ скопировано';
      setTimeout(() => { btn.textContent = orig; }, 1400);
    });
  }

  document.getElementById('copy-lyrics').addEventListener('click', e => {
    const text = [...document.querySelectorAll('.lyric-block-card')]
      .map(b => `${b.querySelector('.lb-label').textContent}\n${b.querySelector('.lb-text').innerText}`)
      .join('\n\n');
    if (text) copyText(text, e.currentTarget);
  });

  document.getElementById('copy-suno').addEventListener('click', e => {
    copyText(document.getElementById('suno-prompt').innerText, e.currentTarget);
  });

  // ── INIT ───────────────────────────────────────────────────────────────────
  document.getElementById('generate').addEventListener('click', runGenerate);
  document.getElementById('regen-lyrics')?.addEventListener('click', runGenerate);

  initChips();
  initSettings();
  updateBadge();

})();
