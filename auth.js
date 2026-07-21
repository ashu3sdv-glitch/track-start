import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const state = { client: null, session: null, configured: false };
let readyResolve;
const ready = new Promise((resolve) => { readyResolve = resolve; });

function styles() {
  const style = document.createElement('style');
  style.textContent = `
    .ts-auth-button{border:1px solid var(--line,#ddd);border-radius:10px;background:#fff;padding:9px 13px;font:500 13px Geist,system-ui;cursor:pointer;color:var(--ink,#111)}
    .ts-auth-button[data-active="true"]{background:var(--ink,#111);color:#fff}
    .ts-auth-modal{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px;background:rgba(15,15,20,.55)}
    .ts-auth-modal[hidden]{display:none}.ts-auth-card{width:min(420px,100%);padding:28px;border-radius:18px;background:#fff;box-shadow:0 24px 70px rgba(0,0,0,.25)}
    .ts-auth-card h2{margin:0 0 8px}.ts-auth-card p{color:#666;line-height:1.55}.ts-auth-card input{box-sizing:border-box;width:100%;margin:12px 0;padding:13px;border:1px solid #ddd;border-radius:10px;font:inherit}
    .ts-auth-actions{display:flex;gap:10px}.ts-auth-actions button{flex:1;padding:12px;border:0;border-radius:10px;cursor:pointer}.ts-auth-submit{background:#17171b;color:#fff}.ts-auth-close{background:#f1f1f3}.ts-auth-status{min-height:22px;font-size:13px}
  `;
  document.head.appendChild(style);
}

function mount() {
  styles();
  const actions = document.querySelector('.nav-actions');
  const nav = actions || document.querySelector('.nav');
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'ts-auth-button'; button.textContent = 'Войти';
  if (actions) actions.prepend(button); else if (nav) nav.append(button);
  const modal = document.createElement('div'); modal.className = 'ts-auth-modal'; modal.hidden = true;
  modal.innerHTML = `<div class="ts-auth-card" role="dialog" aria-modal="true" aria-labelledby="ts-auth-title"><h2 id="ts-auth-title">Вход в Track Start</h2><p>Введи email — мы отправим одноразовую ссылку. Пароль не нужен.</p><form><input type="email" autocomplete="email" placeholder="you@example.com" required maxlength="254"><div class="ts-auth-status"></div><div class="ts-auth-actions"><button type="button" class="ts-auth-close">Отмена</button><button class="ts-auth-submit">Получить ссылку</button></div></form></div>`;
  document.body.appendChild(modal);
  const form = modal.querySelector('form'), input = modal.querySelector('input'), status = modal.querySelector('.ts-auth-status');
  function open() { modal.hidden = false; status.textContent = ''; setTimeout(() => input.focus(), 0); }
  function close() { modal.hidden = true; }
  button.addEventListener('click', async () => {
    await ready;
    if (state.session) {
      if (confirm(`Выполнен вход: ${state.session.user.email}\n\nВыйти из аккаунта?`)) await state.client.auth.signOut();
    } else open();
  });
  modal.querySelector('.ts-auth-close').addEventListener('click', close);
  modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); status.textContent = 'Отправляем…';
    const { error } = await state.client.auth.signInWithOtp({ email: input.value.trim(), options: { emailRedirectTo: `${location.origin}${location.pathname}` } });
    status.textContent = error ? `Ошибка: ${error.message}` : 'Ссылка отправлена. Проверь почту.';
  });
  state.updateButton = () => {
    button.textContent = state.session?.user?.email || 'Войти';
    button.dataset.active = state.session ? 'true' : 'false';
  };
  state.open = open;
}

async function syncAccount() {
  if (!state.session) { localStorage.removeItem('ts_plan_token'); return; }
  const response = await fetch('/api/account', { headers: { Authorization: `Bearer ${state.session.access_token}` }, cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (data.planToken) localStorage.setItem('ts_plan_token', data.planToken);
  else localStorage.removeItem('ts_plan_token');
  window.dispatchEvent(new CustomEvent('trackstart:account', { detail: data }));
}

mount();
(async () => {
  try {
    const config = await fetch('/api/auth-config', { cache: 'no-store' }).then((r) => r.json());
    if (!config.configured) throw new Error('not configured');
    state.client = createClient(config.url, config.anonKey, { auth: { persistSession: true, detectSessionInUrl: true } });
    state.configured = true;
    state.session = (await state.client.auth.getSession()).data.session;
    state.updateButton(); await syncAccount();
    state.client.auth.onAuthStateChange((_event, session) => {
      state.session = session; state.updateButton(); setTimeout(syncAccount, 0);
    });
  } catch { document.querySelector('.ts-auth-button')?.remove(); }
  readyResolve();
})();

window.TrackStartAuth = {
  ready,
  async requireUser() { await ready; if (!state.configured) throw new Error('Авторизация ещё не настроена'); if (!state.session) { state.open(); return null; } return state.session.user; },
  async headers() { await ready; return state.session ? { Authorization: `Bearer ${state.session.access_token}` } : {}; },
};
