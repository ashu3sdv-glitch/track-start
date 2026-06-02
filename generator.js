// Track Start — Generator (Claude API + BYOK + 3 free requests)

(function () {

  // ── CONSTANTS ──────────────────────────────────────────────────────────────
  const FREE_LIMIT = 3;
  const LS_KEY = 'ts_free_used';

  // ── FREE REQUEST COUNTER ───────────────────────────────────────────────────
  function getUsed() { return parseInt(localStorage.getItem(LS_KEY) || '0', 10); }
  function incUsed() { localStorage.setItem(LS_KEY, getUsed() + 1); }
  function getFreeLeft() { return Math.max(0, FREE_LIMIT - getUsed()); }

  // ── API KEY STORAGE ────────────────────────────────────────────────────────
  function getSavedKey() { return localStorage.getItem('ts_api_key') || ''; }
  function saveKey(k) { localStorage.setItem('ts_api_key', k.trim()); }

  // ── INJECT API KEY UI ──────────────────────────────────────────────────────
  function injectKeyUI() {
    const sidebar = document.querySelector('.form-stack');
    if (!sidebar) return;

    const wrap = document.createElement('div');
    wrap.id = 'api-key-section';
    wrap.style.cssText = 'border-top: 1px solid var(--line); padding-top: 16px; margin-top: 4px;';

    const counterEl = document.createElement('p');
    counterEl.id = 'free-counter';
    counterEl.style.cssText = 'font-size:12.5px; font-family:var(--font-mono); color:var(--muted); margin-bottom:10px;';

    const label = document.createElement('label');
    label.className = 'field-label';
    label.textContent = 'Claude API Key (необязательно)';

    const row = document.createElement('div');
    row.style.cssText = 'display:flex; gap:8px;';

    const input = document.createElement('input');
    input.type = 'password';
    input.id = 'api-key-input';
    input.className = 'select';
    input.placeholder = 'sk-ant-...';
    input.style.cssText = 'flex:1; font-family:var(--font-mono); font-size:12px;';
    input.value = getSavedKey();

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-secondary btn-sm';
    saveBtn.textContent = 'Сохранить';
    saveBtn.style.cssText = 'flex-shrink:0;';
    saveBtn.addEventListener('click', () => {
      saveKey(input.value);
      saveBtn.textContent = '✓';
      setTimeout(() => { saveBtn.textContent = 'Сохранить'; }, 1200);
      updateCounter();
    });

    const hint = document.createElement('p');
    hint.style.cssText = 'font-size:11.5px; color:var(--muted); font-family:var(--font-mono); margin-top:6px;';
    hint.innerHTML = 'Ключ хранится только в браузере. <a href="https://console.anthropic.com" target="_blank" style="color:var(--accent-ink)">Получить ключ →</a>';

    row.appendChild(input);
    row.appendChild(saveBtn);
    wrap.appendChild(counterEl);
    wrap.appendChild(label);
    wrap.appendChild(row);
    wrap.appendChild(hint);
    sidebar.appendChild(wrap);

    updateCounter();
  }

  function updateCounter() {
    const el = document.getElementById('free-counter');
    if (!el) return;
    const key = getSavedKey();
    if (key) {
      el.innerHTML = '✓ API ключ подключён — без лимитов';
      el.style.color = 'var(--ok, #10b981)';
    } else {
      const left = getFreeLeft();
      el.style.color = left > 0 ? 'var(--muted)' : 'var(--err, #ef4444)';
      el.textContent = left > 0
        ? `Бесплатных запросов: ${left} из ${FREE_LIMIT}`
        : 'Бесплатные запросы закончились — добавь API ключ';
    }
  }

  // ── CHIP ROWS ──────────────────────────────────────────────────────────────
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

  // ── BPM SLIDER ─────────────────────────────────────────────────────────────
  const bpm = document.getElementById('bpm');
  const bpmVal = document.getElementById('bpm-val');
  const bpmMood = document.getElementById('bpm-mood');
  function bpmLabel(v) {
    if (v < 80) return 'slow';
    if (v < 110) return 'mid';
    if (v < 140) return 'driving';
    return 'fast';
  }
  bpm.addEventListener('input', () => {
    bpmVal.textContent = bpm.value;
    bpmMood.textContent = bpmLabel(+bpm.value);
  });

  // ── READ BRIEF ─────────────────────────────────────────────────────────────
  function readBrief() {
    return {
      idea: document.getElementById('idea').value.trim(),
      genre: getField('genre'),
      mood: getField('mood'),
      lang: document.getElementById('lang').value,
      length: document.getElementById('length').value,
      structure: getField('structure'),
      bpm: +document.getElementById('bpm').value
    };
  }

  // ── CLAUDE API CALL ────────────────────────────────────────────────────────
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
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Ошибка API: ${res.status}`);
    }
    const data = await res.json();
    return data.content?.[0]?.text || '';
  }

  // ── BUILD PROMPT ───────────────────────────────────────────────────────────
  function buildPrompt(brief) {
    const langMap = { ru: 'русском', en: 'английском', mix: 'русском с английскими вставками' };
    const structMap = {
      vcvcbc: 'куплет–припев–куплет–припев–бридж–припев',
      vcbc: 'куплет–припев–бридж–припев',
      vcvcvbc: 'куплет–припев–куплет–припев–куплет–бридж–припев'
    };
    const lengthMap = { short: '2:30', med: '3:00', long: '3:30+' };

    return `Ты профессиональный автор песен. Напиши текст песни и стайл-промпт для Suno v5.

ПАРАМЕТРЫ:
- Идея: ${brief.idea}
- Жанр: ${brief.genre}
- Настроение: ${brief.mood}
- Темп: ${brief.bpm} BPM
- Язык текста: ${langMap[brief.lang] || 'русском'}
- Длина: ~${lengthMap[brief.length] || '3:00'}
- Структура: ${structMap[brief.structure] || structMap.vcvcbc}

ФОРМАТ ОТВЕТА — строго такой, без лишних слов:

===LYRICS===
[куплет 1]
(4 строки)

[припев]
(4 строки)

[куплет 2]
(4 строки)

[припев]
(4 строки)

[бридж]
(2-3 строки)

[припев]
(4 строки)
===END_LYRICS===

===SUNO===
[Style] ${brief.genre}, ${brief.mood}, ${brief.bpm} BPM
[Instruments] (конкретные инструменты для жанра)
[Vocals] (язык, стиль, характер голоса)
[Structure] ${structMap[brief.structure] || structMap.vcvcbc}
[Mix] (характер звука)
===END_SUNO===

Текст должен быть живым, образным, с конкретными деталями. Не используй клише.`;
  }

  // ── PARSE RESPONSE ─────────────────────────────────────────────────────────
  function parseResponse(text) {
    const lyricsMatch = text.match(/===LYRICS===([\s\S]*?)===END_LYRICS===/);
    const sunoMatch = text.match(/===SUNO===([\s\S]*?)===END_SUNO===/);

    const lyricsRaw = lyricsMatch ? lyricsMatch[1].trim() : text;
    const sunoRaw = sunoMatch ? sunoMatch[1].trim() : '';

    // parse blocks
    const blocks = [];
    const blockRegex = /(\[[^\]]+\])\n([\s\S]*?)(?=\n\[|\n===|$)/g;
    let m;
    while ((m = blockRegex.exec(lyricsRaw)) !== null) {
      const label = m[1].trim();
      const textContent = m[2].trim();
      if (textContent) {
        blocks.push({ label, text: textContent });
      }
    }

    return { blocks, suno: sunoRaw };
  }

  // ── RENDER LYRICS ──────────────────────────────────────────────────────────
  function renderLyrics(blocks) {
    const doc = document.getElementById('lyric-doc');
    doc.innerHTML = '';
    blocks.forEach((b) => {
      const card = document.createElement('div');
      card.className = 'lyric-block-card';
      card.innerHTML = `
        <div class="lb-label">${b.label}</div>
        <div class="lb-text" contenteditable="true" spellcheck="false">${b.text.replace(/</g, '&lt;').replace(/\n/g, '<br>')}</div>`;
      doc.appendChild(card);
    });
  }

  // ── RENDER SUNO PROMPT ─────────────────────────────────────────────────────
  function renderSuno(suno) {
    if (!suno) return;
    const html = suno
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/(\[[^\]]+\])/g, '<span class="tag">$1</span>')
      .replace(/(\d{2,3})( BPM)/g, '<span class="num">$1</span>$2');
    document.getElementById('suno-prompt').innerHTML = html;
    document.getElementById('suno-panel').style.display = '';
  }

  // ── SHOW ERROR ─────────────────────────────────────────────────────────────
  function showError(msg) {
    document.getElementById('gen-status').style.display = 'none';
    const doc = document.getElementById('lyric-doc');
    doc.innerHTML = `<div style="padding:20px; color:var(--err,#ef4444); font-family:var(--font-mono); font-size:13px; background:var(--bg-2); border-radius:var(--radius); border:1px solid var(--line);">
      ⚠ ${msg}
    </div>`;
    document.getElementById('empty-lyrics').style.display = 'none';
  }

  // ── MAIN GENERATE ──────────────────────────────────────────────────────────
  async function runGenerate() {
    const brief = readBrief();
    if (!brief.idea) {
      alert('Опиши идею песни — хотя бы пару слов');
      return;
    }

    const apiKey = getSavedKey();
    const freeLeft = getFreeLeft();

    if (!apiKey && freeLeft <= 0) {
      showError('Бесплатные запросы закончились. Добавь свой Claude API ключ — поле ниже.');
      updateCounter();
      return;
    }

    // UI: loading state
    document.getElementById('empty-lyrics').style.display = 'none';
    document.getElementById('lyric-doc').innerHTML = '';
    document.getElementById('gen-status').style.display = 'flex';
    document.getElementById('suno-panel').style.display = 'none';
    document.getElementById('regen-lyrics').style.display = 'none';
    document.getElementById('generate').disabled = true;

    try {
      // use env key for free tier (falls back to demo mode if not set)
      const keyToUse = apiKey || (window.__TS_KEY__ || '');

      if (!keyToUse) {
        throw new Error('Нет API ключа. Добавь свой ключ в поле ниже.');
      }

      const prompt = buildPrompt(brief);
      const raw = await callClaude(prompt, keyToUse);

      const { blocks, suno } = parseResponse(raw);

      if (blocks.length === 0) {
        throw new Error('Не удалось разобрать ответ. Попробуй ещё раз.');
      }

      // count free request only if no personal key
      if (!apiKey) incUsed();

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

  // ── COPY BUTTONS ───────────────────────────────────────────────────────────
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

  injectKeyUI();

})();
