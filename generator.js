// Track Start — Generator v2 (Claude API + BYOK + daily free limit + pro settings)

(function () {

  // ── CONSTANTS ──────────────────────────────────────────────────────────────
  const FREE_DAILY = 3;
  const LS_KEY_DATE = 'ts_free_date';
  const LS_KEY_USED = 'ts_free_used';
  const LS_KEY_API  = 'ts_api_key';

  // ── DAILY COUNTER ──────────────────────────────────────────────────────────
  function todayStr() { return new Date().toISOString().slice(0, 10); }

  function getUsedToday() {
    const saved = localStorage.getItem(LS_KEY_DATE);
    if (saved !== todayStr()) {
      localStorage.setItem(LS_KEY_DATE, todayStr());
      localStorage.setItem(LS_KEY_USED, '0');
      return 0;
    }
    return parseInt(localStorage.getItem(LS_KEY_USED) || '0', 10);
  }

  function incUsed() { localStorage.setItem(LS_KEY_USED, getUsedToday() + 1); }
  function getFreeLeft() { return Math.max(0, FREE_DAILY - getUsedToday()); }

  // ── API KEY ────────────────────────────────────────────────────────────────
  function getSavedKey() { return localStorage.getItem(LS_KEY_API) || ''; }
  function saveKey(k) { localStorage.setItem(LS_KEY_API, k.trim()); }

  async function fetchServerKey() {
    try {
      const res = await fetch('/api/key');
      const data = await res.json();
      return data.key || '';
    } catch (e) { return ''; }
  }

  // ── PRO MODE CHECK ─────────────────────────────────────────────────────────
  function isProMode() { return !!getSavedKey(); }

  // ── INJECT UI ──────────────────────────────────────────────────────────────
  function injectUI() {
    const sidebar = document.querySelector('.form-stack');
    if (!sidebar) return;

    // ---- API KEY BLOCK (вверху формы) ----
    const keyBlock = document.createElement('div');
    keyBlock.style.cssText = 'background:var(--bg-2,#f5f0e8); border:1px solid var(--line); border-radius:var(--radius,8px); padding:14px; margin-bottom:4px;';
    keyBlock.innerHTML = `
      <div id="free-counter" style="font-size:12px; font-family:var(--font-mono); color:var(--muted); margin-bottom:10px;"></div>
      <label class="field-label" style="margin-bottom:6px; display:block;">Claude API Key <span style="color:var(--muted); font-weight:400;">(для безлимитного доступа)</span></label>
      <div style="display:flex; gap:8px;">
        <input type="password" id="api-key-input" class="select" placeholder="sk-ant-..." 
          style="flex:1; font-family:var(--font-mono); font-size:12px;" value="${getSavedKey()}">
        <button id="api-key-save" class="btn btn-secondary btn-sm" style="flex-shrink:0;">Сохранить</button>
      </div>
      <p style="font-size:11px; color:var(--muted); font-family:var(--font-mono); margin-top:6px;">
        Ключ хранится только в твоём браузере. 
        <a href="https://console.anthropic.com" target="_blank" style="color:var(--accent-ink);">Получить ключ →</a>
      </p>`;
    sidebar.insertBefore(keyBlock, sidebar.firstChild);

    document.getElementById('api-key-save').addEventListener('click', () => {
      const input = document.getElementById('api-key-input');
      saveKey(input.value);
      const btn = document.getElementById('api-key-save');
      btn.textContent = '✓';
      setTimeout(() => { btn.textContent = 'Сохранить'; }, 1200);
      updateCounter();
      updateProFields();
    });

    // ---- PRO FIELDS (скрыты по умолчанию) ----
    injectProFields(sidebar);

    updateCounter();
    updateProFields();
  }

  function injectProFields(sidebar) {
    // Вокальный стиль
    const vocalBlock = document.createElement('div');
    vocalBlock.id = 'pro-vocal';
    vocalBlock.style.display = 'none';
    vocalBlock.innerHTML = `
      <label class="field-label">Вокал</label>
      <div class="chip-row" data-field="vocal">
        <button class="chip-pick active" data-v="male tenor">Мужской</button>
        <button class="chip-pick" data-v="female soprano">Женский</button>
        <button class="chip-pick" data-v="duet male female">Дуэт</button>
        <button class="chip-pick" data-v="no vocals instrumental">Инструментал</button>
      </div>`;

    // Тема
    const themeBlock = document.createElement('div');
    themeBlock.id = 'pro-theme';
    themeBlock.style.display = 'none';
    themeBlock.innerHTML = `
      <label class="field-label">Тема</label>
      <div class="chip-row" data-field="theme">
        <button class="chip-pick active" data-v="love and longing">Любовь</button>
        <button class="chip-pick" data-v="city and night">Город</button>
        <button class="chip-pick" data-v="freedom and road">Свобода</button>
        <button class="chip-pick" data-v="solitude and reflection">Одиночество</button>
        <button class="chip-pick" data-v="nature and seasons">Природа</button>
        <button class="chip-pick" data-v="dreams and fantasy">Мечта</button>
      </div>`;

    // Вокальная подача
    const deliveryBlock = document.createElement('div');
    deliveryBlock.id = 'pro-delivery';
    deliveryBlock.style.display = 'none';
    deliveryBlock.innerHTML = `
      <label class="field-label">Подача голоса</label>
      <div class="chip-row" data-field="delivery">
        <button class="chip-pick active" data-v="melodic, intimate">Интимная</button>
        <button class="chip-pick" data-v="belting, powerful, emotional">Мощная</button>
        <button class="chip-pick" data-v="breathy, soft, whisper-like">Шёпот</button>
        <button class="chip-pick" data-v="syllabic, rhythmic, punchy">Ритмичная</button>
        <button class="chip-pick" data-v="spoken word, narrative">Разговорная</button>
      </div>`;

    // Тональность
    const keyBlock2 = document.createElement('div');
    keyBlock2.id = 'pro-key';
    keyBlock2.style.display = 'none';
    keyBlock2.innerHTML = `
      <label class="field-label">Тональность</label>
      <div class="chip-row" data-field="musicalkey">
        <button class="chip-pick active" data-v="Am">Am</button>
        <button class="chip-pick" data-v="Cm">Cm</button>
        <button class="chip-pick" data-v="Em">Em</button>
        <button class="chip-pick" data-v="Dm">Dm</button>
        <button class="chip-pick" data-v="C">C</button>
        <button class="chip-pick" data-v="G">G</button>
        <button class="chip-pick" data-v="F">F</button>
      </div>`;

    // Расширенные жанры (заменят базовые)
    const genreExtBlock = document.createElement('div');
    genreExtBlock.id = 'pro-genres-extra';
    genreExtBlock.style.display = 'none';
    genreExtBlock.innerHTML = `
      <div class="chip-row" data-field="genre-extra" style="margin-top:6px;">
        <button class="chip-pick" data-v="dark phonk">dark phonk</button>
        <button class="chip-pick" data-v="soul">soul</button>
        <button class="chip-pick" data-v="chanson russe">шансон</button>
        <button class="chip-pick" data-v="russian pop">рус. поп</button>
        <button class="chip-pick" data-v="indie folk">indie folk</button>
        <button class="chip-pick" data-v="house">house</button>
        <button class="chip-pick" data-v="neo-soul cinematic">neo-soul</button>
        <button class="chip-pick" data-v="trap">trap</button>
      </div>`;

    // Вставляем после блока жанра
    const genreSection = document.querySelector('[data-field="genre"]')?.parentElement;
    if (genreSection) {
      genreSection.after(genreExtBlock);
      genreExtBlock.after(vocalBlock);
      vocalBlock.after(themeBlock);
      themeBlock.after(deliveryBlock);
      deliveryBlock.after(keyBlock2);
    }

    // chip-pick для новых полей
    document.querySelectorAll('[data-field="vocal"],[data-field="theme"],[data-field="delivery"],[data-field="musicalkey"],[data-field="genre-extra"]').forEach((row) => {
      row.querySelectorAll('.chip-pick').forEach((c) => {
        c.addEventListener('click', () => {
          row.querySelectorAll('.chip-pick').forEach((x) => x.classList.remove('active'));
          c.classList.add('active');
        });
      });
    });
  }

  function updateCounter() {
    const el = document.getElementById('free-counter');
    if (!el) return;
    const key = getSavedKey();
    if (key) {
      el.innerHTML = '✓ API ключ подключён — <strong>Pro режим активен</strong>';
      el.style.color = '#10b981';
    } else {
      const left = getFreeLeft();
      el.style.color = left > 0 ? 'var(--muted)' : '#ef4444';
      el.textContent = left > 0
        ? `Бесплатных генераций сегодня: ${left} из ${FREE_DAILY}`
        : '⚠ Лимит на сегодня исчерпан — добавь API ключ или возвращайся завтра';
    }
  }

  function updateProFields() {
    const pro = isProMode();
    const ids = ['pro-vocal', 'pro-theme', 'pro-delivery', 'pro-key', 'pro-genres-extra'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = pro ? '' : 'none';
    });

    // Метка на кнопке генерации
    const genBtn = document.getElementById('generate');
    if (genBtn) {
      genBtn.textContent = pro ? '⚡ Сгенерировать (Pro)' : 'Сгенерировать';
    }
  }

  // ── CHIP HELPERS ───────────────────────────────────────────────────────────
  function getField(name) {
    const row = document.querySelector(`[data-field="${name}"]`);
    if (!row) return '';
    const active = row.querySelector('.chip-pick.active');
    return active ? active.getAttribute('data-v') : '';
  }

  document.querySelectorAll('[data-field]').forEach((row) => {
    row.querySelectorAll('.chip-pick').forEach((c) => {
      c.addEventListener('click', () => {
        row.querySelectorAll('.chip-pick').forEach((x) => x.classList.remove('active'));
        c.classList.add('active');
      });
    });
  });

  // ── BPM ────────────────────────────────────────────────────────────────────
  const bpm = document.getElementById('bpm');
  const bpmVal = document.getElementById('bpm-val');
  const bpmMood = document.getElementById('bpm-mood');
  function bpmLabel(v) {
    if (v < 80) return 'slow'; if (v < 110) return 'mid';
    if (v < 140) return 'driving'; return 'fast';
  }
  bpm.addEventListener('input', () => {
    bpmVal.textContent = bpm.value;
    bpmMood.textContent = bpmLabel(+bpm.value);
  });

  // ── READ BRIEF ─────────────────────────────────────────────────────────────
  function readBrief() {
    const genre = getField('genre') || getField('genre-extra') || 'pop';
    return {
      idea:       document.getElementById('idea').value.trim(),
      genre,
      mood:       getField('mood'),
      lang:       document.getElementById('lang').value,
      length:     document.getElementById('length').value,
      structure:  getField('structure'),
      bpm:        +document.getElementById('bpm').value,
      // pro fields
      vocal:      getField('vocal'),
      theme:      getField('theme'),
      delivery:   getField('delivery'),
      musicalkey: getField('musicalkey'),
      pro:        isProMode()
    };
  }

  // ── PROMPT BUILDER ─────────────────────────────────────────────────────────
  function buildPrompt(b) {
    const langMap = { ru: 'Russian', en: 'English', mix: 'Russian with English phrases' };
    const structMap = {
      vcvcbc:  'Verse 1 – Chorus – Verse 2 – Chorus – Bridge – Chorus',
      vcbc:    'Verse 1 – Chorus – Bridge – Chorus',
      vcvcvbc: 'Verse 1 – Chorus – Verse 2 – Chorus – Verse 3 – Bridge – Chorus'
    };
    const lengthMap = { short: '2:30', med: '3:00', long: '3:30+' };

    const vocalLine = b.pro && b.vocal
      ? `- Vocal: ${b.vocal}${b.delivery ? ', ' + b.delivery : ''}`
      : `- Vocal: melodic, intimate`;

    const proExtras = b.pro ? `
- Theme / imagery: ${b.theme || 'open'}
- Musical key: ${b.musicalkey || 'Am'}
- Vocal delivery style: ${b.delivery || 'melodic'}` : '';

    return `You are a professional songwriter and Suno AI expert.
Write song lyrics and a Suno v5 style prompt based on this brief.

BRIEF:
- Idea / concept: ${b.idea}
- Genre: ${b.genre}
- Mood: ${b.mood}
- BPM: ${b.bpm}
- Language: ${langMap[b.lang] || 'Russian'}
- Duration: ~${lengthMap[b.length] || '3:00'}
- Structure: ${structMap[b.structure] || structMap.vcvcbc}
${vocalLine}${proExtras}

LYRICS RULES:
- 4 lines per verse, 4 lines per chorus, 2-3 lines bridge
- Concrete vivid images — no clichés, no abstract words
- Natural speech rhythm — lines should feel singable
- Section tags in English only: [Verse 1], [Chorus], [Bridge], [Pre-Chorus]
- First line: vocal settings tag like [Male Tenor C3-A4] [Vocal Style: ${b.delivery || 'melodic, intimate'}]
- DO NOT include rhyme scheme labels (A-B-A-B etc)
- Language of lyrics: ${langMap[b.lang] || 'Russian'}

RESPOND IN THIS EXACT FORMAT — nothing else:

===LYRICS===
[Male Tenor C3-A4] [Vocal Style: melodic, intimate]

[Verse 1]
line 1
line 2
line 3
line 4

[Chorus]
line 1
line 2
line 3
line 4

[Verse 2]
line 1
line 2
line 3
line 4

[Chorus]
line 1
line 2
line 3
line 4

[Bridge]
line 1
line 2
line 3

[Chorus]
line 1
line 2
line 3
line 4
===END_LYRICS===

===SUNO===
[Style] genre, mood, BPM, key
[Instruments] specific instruments for this genre
[Vocals] language, voice type, delivery style
[Structure] song structure
[Mix] sound character
===END_SUNO===`;
  }

  // ── CLAUDE API ─────────────────────────────────────────────────────────────
  async function callClaude(prompt, apiKey) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1800,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API error: ${res.status}`);
    }
    const data = await res.json();
    return data.content?.[0]?.text || '';
  }

  // ── PARSE ──────────────────────────────────────────────────────────────────
  function parseResponse(text) {
    const lyricsMatch = text.match(/===LYRICS===([\s\S]*?)===END_LYRICS===/);
    const sunoMatch   = text.match(/===SUNO===([\s\S]*?)===END_SUNO===/);
    const lyricsRaw   = lyricsMatch ? lyricsMatch[1].trim() : text;
    const sunoRaw     = sunoMatch   ? sunoMatch[1].trim()   : '';
    const blocks = [];
    const blockRegex = /(\[[^\]]+\])\n([\s\S]*?)(?=\n\[|\n===|$)/g;
    let m;
    while ((m = blockRegex.exec(lyricsRaw)) !== null) {
      const label = m[1].trim();
      const content = m[2].trim();
      if (content) blocks.push({ label, text: content });
    }
    return { blocks, suno: sunoRaw };
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  function renderLyrics(blocks) {
    const doc = document.getElementById('lyric-doc');
    doc.innerHTML = '';
    blocks.forEach((b) => {
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
    const html = suno
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/(\[[^\]]+\])/g,'<span class="tag">$1</span>')
      .replace(/(\d{2,3})( BPM)/g,'<span class="num">$1</span>$2');
    document.getElementById('suno-prompt').innerHTML = html;
    document.getElementById('suno-panel').style.display = '';
    // Обновить заголовок панели
    const panelHead = document.querySelector('#suno-panel h3');
    if (panelHead) panelHead.textContent = 'Промпт для Suno v5';
  }

  function showError(msg) {
    document.getElementById('gen-status').style.display = 'none';
    document.getElementById('empty-lyrics').style.display = 'none';
    document.getElementById('lyric-doc').innerHTML = `
      <div style="padding:20px; color:#ef4444; font-family:var(--font-mono); font-size:13px; background:var(--bg-2); border-radius:var(--radius); border:1px solid var(--line);">⚠ ${msg}</div>`;
  }

  // ── MAIN GENERATE ──────────────────────────────────────────────────────────
  async function runGenerate() {
    const brief = readBrief();
    if (!brief.idea) { alert('Опиши идею песни — хотя бы пару слов'); return; }

    const personalKey = getSavedKey();
    const freeLeft = getFreeLeft();

    if (!personalKey && freeLeft <= 0) {
      showError('Лимит на сегодня исчерпан. Добавь свой Claude API ключ — или возвращайся завтра.');
      updateCounter();
      return;
    }

    document.getElementById('empty-lyrics').style.display = 'none';
    document.getElementById('lyric-doc').innerHTML = '';
    document.getElementById('gen-status').style.display = 'flex';
    document.getElementById('suno-panel').style.display = 'none';
    document.getElementById('regen-lyrics').style.display = 'none';
    document.getElementById('generate').disabled = true;

    try {
      let keyToUse = personalKey || await fetchServerKey();
      if (!keyToUse) throw new Error('Нет API ключа. Добавь свой ключ в поле выше.');

      const raw = await callClaude(buildPrompt(brief), keyToUse);
      const { blocks, suno } = parseResponse(raw);
      if (blocks.length === 0) throw new Error('Не удалось разобрать ответ. Попробуй ещё раз.');

      if (!personalKey) incUsed();

      renderLyrics(blocks);
      document.getElementById('gen-status').style.display = 'none';
      renderSuno(suno);
      document.getElementById('regen-lyrics').style.display = '';
      document.getElementById('lyric-meta').textContent = `${brief.genre} · ${brief.bpm} BPM · ${brief.mood}`;
      updateCounter();

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
      setTimeout(() => { btn.textContent = orig; }, 1200);
    });
  }

  document.getElementById('copy-lyrics').addEventListener('click', (e) => {
    const text = [...document.querySelectorAll('.lyric-block-card')]
      .map(b => `${b.querySelector('.lb-label').textContent}\n${b.querySelector('.lb-text').innerText}`)
      .join('\n\n');
    if (text) copyText(text, e.currentTarget.querySelector('span') || e.currentTarget);
  });

  document.getElementById('copy-suno').addEventListener('click', (e) => {
    copyText(document.getElementById('suno-prompt').innerText, e.currentTarget.querySelector('span') || e.currentTarget);
  });

  // ── INIT ───────────────────────────────────────────────────────────────────
  document.getElementById('generate').addEventListener('click', runGenerate);
  document.getElementById('regen-lyrics')?.addEventListener('click', runGenerate);

  injectUI();

})();
