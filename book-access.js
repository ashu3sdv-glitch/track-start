(function () {
  const status = document.querySelector('[data-book-status]');
  const buttons = document.querySelectorAll('[data-book-action]');
  const isEnglish = document.documentElement.lang === 'en';

  function show(message, error = false) {
    if (!status) return;
    status.textContent = message;
    status.style.color = error ? '#b91c1c' : 'var(--muted)';
  }

  async function getBook(action) {
    const viewer = action === 'view' ? window.open('about:blank', '_blank') : null;
    show(isEnglish ? 'Checking Pro access…' : 'Проверяем доступ Pro…');
    buttons.forEach((button) => { button.disabled = true; });
    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: 'voice-in-suno',
          mode: action,
          planToken: localStorage.getItem('ts_plan_token') || '',
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || (isEnglish ? 'Unable to open the book.' : 'Не удалось открыть книгу.'));
      }
      const blobUrl = URL.createObjectURL(await response.blob());
      if (action === 'view') {
        if (viewer) viewer.location.href = blobUrl;
      } else {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'voice-in-suno.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      show(isEnglish ? 'Pro access confirmed.' : 'Доступ Pro подтверждён.');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      if (viewer) viewer.close();
      show(error.message, true);
    } finally {
      buttons.forEach((button) => { button.disabled = false; });
    }
  }

  buttons.forEach((button) => button.addEventListener('click', () => getBook(button.dataset.bookAction)));
})();
