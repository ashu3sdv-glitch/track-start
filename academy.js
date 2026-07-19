document.querySelectorAll('[data-copy-prompt]').forEach((button) => {
  button.addEventListener('click', async () => {
    const prompt = button.closest('.prompt-box')?.querySelector('pre')?.innerText || '';
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    const original = button.textContent;
    button.textContent = button.dataset.copied || 'Скопировано';
    setTimeout(() => { button.textContent = original; }, 1500);
  });
});
