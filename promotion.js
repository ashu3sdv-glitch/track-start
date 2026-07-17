(function () {
  const form = document.getElementById('promotion-form');
  const wrap = document.getElementById('promotion-form-wrap');
  const loading = document.getElementById('loading');
  const loadingText = document.getElementById('loading-text');
  const errorBox = document.getElementById('error');
  const resultEl = document.getElementById('result');
  const restoreBtn = document.getElementById('restore-plan');
  const LAST_PLAN_KEY = 'ts_last_promotion_plan';

  const e = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
  const arr = (value) => Array.isArray(value) ? value : [];
  const list = (items) => `<ul>${arr(items).map((item) => `<li>${e(item)}</li>`).join('')}</ul>`;

  function readDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem('ts_promotion_draft') || '{}');
      ['title', 'lyrics', 'genre', 'mood', 'vocalType'].forEach((key) => {
        if (draft[key] && document.getElementById(key)) document.getElementById(key).value = draft[key];
      });
    } catch {}
  }

  function collect() {
    return {
      title: document.getElementById('title').value.trim(),
      artist: document.getElementById('artist').value.trim(),
      lyrics: document.getElementById('lyrics').value.trim(),
      genre: document.getElementById('genre').value.trim(),
      mood: document.getElementById('mood').value.trim(),
      vocalType: document.getElementById('vocalType').value.trim(),
      description: document.getElementById('description').value.trim(),
      budget: document.getElementById('budget').value,
      releaseDate: document.getElementById('releaseDate').value,
      platforms: Array.from(document.querySelectorAll('.platforms input:checked')).map((input) => input.value),
      planToken: localStorage.getItem('ts_plan_token') || '',
    };
  }

  function offsetLabel(offset) {
    if (offset === 0) return 'День релиза';
    return offset < 0 ? `За ${Math.abs(offset)} дн.` : `День +${offset}`;
  }

  function dateFor(releaseDate, offset) {
    const date = new Date(`${releaseDate}T12:00:00`);
    date.setDate(date.getDate() + Number(offset || 0));
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }

  function render(saved) {
    const data = saved.result || {};
    const input = saved.input || {};
    const summary = data.summary || {};
    const pitch = data.pitch || {};
    const posts = data.posts || {};
    const cards = arr(data.contentIdeas).map((idea, index) => `
      <div class="result-card"><div class="meta">${e(idea.category || 'идея')} · ${e(idea.platform || '')} · ${e(idea.duration || '')}</div>
      <h3>${index + 1}. ${e(idea.title)}</h3><p><strong>Хук:</strong> ${e(idea.hook)}</p><p><strong>Текст:</strong> ${e(idea.screenText)}</p><p><strong>Действие:</strong> ${e(idea.cta)}</p></div>`).join('');
    const scripts = arr(data.scripts).map((script, index) => `
      <div class="result-card"><div class="meta">сценарий ${index + 1} · ${e(script.duration)}</div><h3>${e(script.title)}</h3>
      <p><strong>Первые секунды:</strong> ${e(script.hook)}</p><p><strong>Текст:</strong> ${e(script.voiceover)}</p>
      <h3>Кадры</h3>${list(script.shots)}<h3>Текст на экране</h3>${list(script.screenText)}<p><strong>Описание:</strong> ${e(script.caption)}</p><p><strong>Призыв:</strong> ${e(script.cta)}</p></div>`).join('');
    const calendar = arr(data.calendar).map((day) => `
      <div class="calendar-item"><div class="calendar-date"><strong>${e(dateFor(input.releaseDate, day.offset))}</strong>${e(offsetLabel(day.offset))}</div>
      <div><h3>${e(day.focus)}</h3><ul>${arr(day.tasks).map((task) => `<li><strong>${e(task.title)}</strong>${task.details ? ` — ${e(task.details)}` : ''}${task.contentIdea ? `<br><span class="small-muted">Тема ролика: ${e(task.contentIdea)}</span>` : ''}</li>`).join('')}</ul></div></div>`).join('');

    resultEl.innerHTML = `
      <header class="result-header"><div class="eyebrow"><span class="dot"></span>персональный план TrackStart</div><h1>${e(input.title)}</h1><p>${e(input.artist)} · релиз ${e(dateFor(input.releaseDate, 0))}</p></header>
      <div class="result-actions no-print"><button class="btn btn-primary" id="copy-plan">Скопировать всё</button><button class="btn btn-secondary" id="print-plan">Сохранить PDF</button><button class="btn btn-secondary" id="edit-plan">Изменить данные</button></div>
      <section class="result-section"><h2>1. Основа продвижения</h2><h3>Тема</h3><p>${e(summary.theme)}</p><h3>Главная эмоция</h3><p>${e(summary.emotion)}</p><h3>Когда слушать</h3>${list(summary.listeningSituation)}<h3>Аудитория</h3><p>${e(summary.audience)}</p><h3>Позиционирование</h3>${list(summary.positioning)}<h3>Сильные строки</h3>${list(summary.strongLines)}</section>
      <section class="result-section"><h2>2. Питчинг</h2><h3>Короткий</h3><p>${e(pitch.short)}</p><h3>Средний</h3><p>${e(pitch.medium)}</p><h3>Для плейлиста</h3><p>${e(pitch.playlist)}</p><h3>Сообщение блогеру</h3><p>${e(pitch.blogger)}</p></section>
      <section class="result-section"><h2>3. Готовые публикации</h2><h3>Анонс</h3><p>${e(posts.announcement)}</p><h3>За неделю</h3><p>${e(posts.weekBefore)}</p><h3>За день</h3><p>${e(posts.dayBefore)}</p><h3>В день релиза</h3><p>${e(posts.releaseDay)}</p><h3>После релиза</h3><p>${e(posts.afterRelease)}</p><h3>Закреплённый комментарий</h3><p>${e(posts.pinnedComment)}</p></section>
      <section class="result-section"><h2>4. Хуки</h2>${list(data.hooks)}</section>
      <section class="result-section"><h2>5. Идеи роликов</h2><div class="result-grid">${cards}</div></section>
      <section class="result-section"><h2>6. Готовые сценарии</h2><div class="result-grid">${scripts}</div></section>
      <section class="result-section"><h2>7. Календарь действий</h2>${calendar}</section>
      <section class="result-section"><h2>На что обратить внимание</h2>${list(data.risks)}</section>
      <section class="next-step"><h2>Следующее действие</h2><p>${e(data.nextStep)}</p></section>`;

    wrap.hidden = true;
    loading.hidden = true;
    errorBox.hidden = true;
    resultEl.hidden = false;
    document.getElementById('copy-plan').addEventListener('click', copyPlan);
    document.getElementById('print-plan').addEventListener('click', () => window.print());
    document.getElementById('edit-plan').addEventListener('click', () => {
      resultEl.hidden = true;
      wrap.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function copyPlan(event) {
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(resultEl.innerText.replace(/Скопировать всё\s+Сохранить PDF\s+Изменить данные/, '').trim());
      const old = button.textContent;
      button.textContent = '✓ Скопировано';
      setTimeout(() => { button.textContent = old; }, 1500);
    } catch { alert('Не удалось скопировать. Выделите текст вручную.'); }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const input = collect();
    if (!input.platforms.length) { alert('Выберите хотя бы одну площадку'); return; }

    wrap.hidden = true;
    errorBox.hidden = true;
    loading.hidden = false;
    const stages = ['Анализируем текст песни', 'Определяем аудиторию и позиционирование', 'Готовим публикации и питчинг', 'Создаём сценарии роликов', 'Собираем календарь по датам'];
    let index = 0;
    loadingText.textContent = stages[0];
    const timer = setInterval(() => { index = Math.min(index + 1, stages.length - 1); loadingText.textContent = stages[index]; }, 4500);
    try {
      const response = await fetch('/api/promotion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.result) throw new Error(body.error || 'Не удалось создать план');
      const saved = { input: { ...input, planToken: undefined }, result: body.result, generatedAt: body.generatedAt };
      localStorage.setItem(LAST_PLAN_KEY, JSON.stringify(saved));
      render(saved);
    } catch (error) {
      loading.hidden = true;
      wrap.hidden = false;
      errorBox.hidden = false;
      errorBox.textContent = error.message || 'Не удалось создать план. Попробуйте ещё раз.';
    } finally { clearInterval(timer); }
  });

  restoreBtn.addEventListener('click', () => {
    try { render(JSON.parse(localStorage.getItem(LAST_PLAN_KEY))); } catch { localStorage.removeItem(LAST_PLAN_KEY); }
  });

  readDraft();
  if (localStorage.getItem(LAST_PLAN_KEY)) restoreBtn.hidden = false;
})();
