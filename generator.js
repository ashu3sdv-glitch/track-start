// Track Start — Generator v3

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
      if (val) {
        status.style.display = 'block';
        status.style.color = '#15803d';
        status.textContent = '✓ Ключ сохранён — Pro режим активен';
      } else {
        status.style.display = 'block';
        status.style.color = 'var(--muted)';
        status.textContent = 'Ключ удалён';
      }
      updateBadge();
      setTimeout(() => modal.classList.remove('open'), 1200);
    });
  }

  // ── CHIP GROUPS ────────────────────────────────────────────────────────────
  function initChips() {
    document.querySelectorAll('[data-field]').forEach(row => {
      row.querySelectorAll('.chip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          row.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
    });

    document.querySelectorAll('[data-lang-pick]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-lang-pick]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  function getField(name) {
    const row = document.querySelector(`[data-field="${name}"]`);
    if (!row) return '';
    return row.querySelector('.chip-btn.active')?.getAttribute('data-v') || '';
  }

  function getLang() {
    return document.querySelector('[data-lang-pick].active')?.getAttribute('data-lang-pick') || 'ru';
  }

  // ── READ BRIEF ─────────────────────────────────────────────────────────────
  function readBrief() {
    return {
      idea:  document.getElementById('idea').value.trim(),
      genre: getField('genre'),
      mood:  getField('mood'),
      vocal: getField('vocal'),
      lang:  getLang()
    };
  }

  // ── PROMPT ─────────────────────────────────────────────────────────────────
  function buildPrompt(b) {
    const langMap = { ru: 'Russian', en: 'English', mix: 'Russian with some English phrases' };
    return `You are a professional Russian-language songwriter and Suno AI expert.

Write song lyrics and a Suno v5 style-string based on this brief:

- Idea / concept: ${b.idea}
- Genre: ${b.genre}
- Mood: ${b.mood}
- Vocal: ${b.vocal}
- Lyrics language: ${langMap[b.lang] || 'Russian'}
- Target duration: ~3:00
- Structure: Verse 1 – Chorus – Verse 2 – Chorus – Bridge – Chorus

LYRICS RULES:
- 4 lines per verse and chorus, 2–3 lines for bridge
- Concrete vivid images and details — no abstract clichés
- Natural speech rhythm — lines must feel singable out loud
- First line of output: vocal settings tag, e.g. [Male Tenor C3–A4] [Vocal Style: melodic, intimate]
- Section tags in English: [Verse 1], [Chorus], [Verse 2], [Bridge]
- NO rhyme scheme labels like A-B-A-B
- Lyrics language: ${langMap[b.lang] || 'Russian'}

OUTPUT FORMAT — exactly this, nothing else:

===LYRICS===
[Male Tenor C3-A4] [Vocal Style: melodic, intimate]

[Verse 1]
(4 lines)

[Chorus]
(4 lines)

[Verse 2]
(4 lines)

[Chorus]
(4 lines)

[Bridge]
(2-3 lines)

[Chorus]
(4 lines)
===END_LYRICS===

===SUNO===
[Style] ${b.genre}, ${b.mood}, ~96 BPM
[Instruments] (specific instruments for this genre and mood)
[Vocals] (language, voice type, delivery)
[Mix] (sound character, atmosphere)
===END_SUNO===`;
  }

  // ── CLAUDE CALL ────────────────────────────────────────────────────────────
  async function callClaude(prompt, key) {
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
        max_tokens: 1800,
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
      .replace(/(\d{2,3})( BPM)/g,'<span class="num">$1</span>$2');
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
    document.getElementById('suno-panel').style.display = 'none';
    document.getElementById('regen-lyrics').style.display = 'none';
    document.getElementById('generate').disabled = true;

    try {
      const key = personalKey || await fetchServerKey();
      if (!key) throw new Error('Нет API ключа. Нажми ⚙ «API ключ» вверху и добавь свой ключ.');

      const raw = await callClaude(buildPrompt(brief), key);
      const { blocks, suno } = parse(raw);
      if (!blocks.length) throw new Error('Не удалось разобрать ответ. Попробуй ещё раз.');

      if (!personalKey) incUsed();

      renderLyrics(blocks);
      document.getElementById('gen-status').style.display = 'none';
      renderSuno(suno);
      document.getElementById('regen-lyrics').style.display = '';
      document.getElementById('lyric-meta').textContent =
        `${brief.genre} · ${brief.mood} · ${brief.lang.toUpperCase()}`;
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
