import * as tus from 'https://esm.sh/tus-js-client@4.3.1';

const input = document.querySelector('#stem-files');
const drop = document.querySelector('#drop-zone');
const list = document.querySelector('#file-list');
const start = document.querySelector('#start-health');
const status = document.querySelector('#health-status');
const progress = document.querySelector('#health-progress');
const bar = progress.querySelector('i');
const download = document.querySelector('#health-download');
let files = [];

const format = (bytes) => bytes > 1024 ** 2 ? `${(bytes / 1024 ** 2).toFixed(1)} МБ` : `${Math.ceil(bytes / 1024)} КБ`;

function select(next) {
  files = [...next].filter((file) => /\.(wav|flac)$/i.test(file.name)).slice(0, 12);
  list.innerHTML = files.map((file) => `<div class="sh-file"><span>${file.name.replace(/[<>&]/g, '')}</span><span>${format(file.size)}</span></div>`).join('');
  start.disabled = files.length === 0;
  status.textContent = files.length ? `Выбрано файлов: ${files.length}` : '';
}

input.addEventListener('change', () => select(input.files));
for (const event of ['dragenter', 'dragover']) drop.addEventListener(event, (e) => { e.preventDefault(); drop.dataset.drag = 'true'; });
for (const event of ['dragleave', 'drop']) drop.addEventListener(event, (e) => { e.preventDefault(); drop.dataset.drag = 'false'; });
drop.addEventListener('drop', (event) => select(event.dataTransfer.files));

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(await window.TrackStartAuth.headers()), ...(options.headers || {}) };
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

function uploadStem(file, stem, context, index, total) {
  const project = new URL(context.supabaseUrl).hostname.split('.')[0];
  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `https://${project}.storage.supabase.co/storage/v1/upload/resumable`,
      headers: { authorization: `Bearer ${context.accessToken}`, 'x-upsert': 'false' },
      chunkSize: 6 * 1024 * 1024,
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      metadata: { bucketName: 'song-health-inputs', objectName: stem.path, contentType: file.type || 'audio/wav' },
      onError: reject,
      onProgress(done, size) {
        const value = ((index + done / size) / total) * 70;
        bar.style.width = `${value}%`;
        status.textContent = `Загрузка ${index + 1} из ${total}: ${Math.round(done / size * 100)}%`;
      },
      onSuccess: resolve,
    });
    upload.findPreviousUploads().then((previous) => { if (previous[0]) upload.resumeFromPreviousUpload(previous[0]); upload.start(); }).catch(reject);
  });
}

async function poll(id) {
  for (;;) {
    const job = await api(`/api/song-health-status?id=${encodeURIComponent(id)}`);
    if (job.status === 'ready') {
      bar.style.width = '100%'; status.textContent = 'Готово. Результат доступен для скачивания.';
      download.href = job.downloadUrl; download.hidden = false; return;
    }
    if (job.status === 'failed') throw new Error(job.error || 'Обработка не завершена');
    status.textContent = job.status === 'processing' ? 'Анализируем и очищаем проблемные интервалы…' : 'Задача ожидает обработки…';
    bar.style.width = job.status === 'processing' ? '88%' : '76%';
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
}

start.addEventListener('click', async () => {
  start.disabled = true; download.hidden = true; progress.hidden = false; bar.style.width = '2%';
  try {
    const user = await window.TrackStartAuth.requireUser();
    if (!user) { status.textContent = 'Сначала войдите по email.'; return; }
    const context = await window.TrackStartAuth.storageContext();
    const job = await api('/api/song-health-create', { method: 'POST', body: JSON.stringify({ files: files.map(({ name, size, type }) => ({ name, size, type })) }) });
    for (let index = 0; index < files.length; index++) await uploadStem(files[index], job.stems[index], context, index, files.length);
    await api('/api/song-health-queue', { method: 'POST', body: JSON.stringify({ id: job.id }) });
    bar.style.width = '75%'; await poll(job.id);
  } catch (error) {
    status.textContent = `Ошибка: ${error.message}`; progress.hidden = true;
  } finally { start.disabled = files.length === 0; }
});
