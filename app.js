// Track Start — shared client behaviour
// Header scroll, FAQ accordion, reveal-on-scroll, hero variant + demo,
// distributor table filtering. Plain JS so the static HTML stays editable.

(function () {
  // --- header scroll shadow ---
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // --- reveal on scroll ---
  const io = ('IntersectionObserver' in window)
    ? new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 })
    : null;
  document.querySelectorAll('.reveal').forEach((el) => io ? io.observe(el) : el.classList.add('in'));

  // --- FAQ accordion ---
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', () => {
      const open = item.classList.contains('open');
      // single-open behaviour
      document.querySelectorAll('.faq-item.open').forEach((o) => o.classList.remove('open'));
      if (!open) item.classList.add('open');
    });
  });

  // --- hero variant switcher (driven by Tweaks panel via body[data-hero]) ---
  function applyHeroVariant(v) {
    document.body.setAttribute('data-hero', v || 'path');
  }
  // initial value from localStorage if no tweaks yet
  try {
    const stored = localStorage.getItem('ts_hero');
    if (stored) applyHeroVariant(stored);
  } catch (e) {}
  window.TS_applyHero = (v) => {
    applyHeroVariant(v);
    try { localStorage.setItem('ts_hero', v); } catch (e) {}
  };

  // --- hero path: animate active step ---
  function animatePath() {
    const steps = document.querySelectorAll('.path-step');
    const total = steps.length;
    if (!total) return;
    let i = 0;
    const tick = () => {
      steps.forEach((s, idx) => {
        s.classList.toggle('active', idx === i);
        s.classList.toggle('done', idx < i);
      });
      const progressBar = document.querySelector('.path-list');
      if (progressBar) progressBar.style.setProperty('--progress', `${(i / (total - 1)) * 100}%`);
      i = (i + 1) % (total + 1);
      if (i === total) {
        setTimeout(() => { i = 0; tick(); }, 1600);
        return;
      }
      setTimeout(tick, 1400);
    };
    tick();
  }
  if (document.querySelector('.path-step')) animatePath();

  // --- waveform random init + playhead animation ---
  document.querySelectorAll('.waveform').forEach((wf) => {
    const bars = 56;
    wf.innerHTML = '';
    for (let i = 0; i < bars; i++) {
      const b = document.createElement('span');
      b.className = 'bar';
      const h = 20 + Math.abs(Math.sin(i * 0.4) * 60) + Math.random() * 20;
      b.style.height = `${h}%`;
      wf.appendChild(b);
    }
    let head = 18;
    const step = () => {
      [...wf.children].forEach((b, idx) => {
        b.classList.remove('played', 'playhead');
        if (idx < head) b.classList.add('played');
        else if (idx === head) b.classList.add('playhead');
      });
      head = head < bars - 4 ? head + 1 : 18;
      setTimeout(step, 220);
    };
    step();
  });

  // --- mega-type animated waveform bars (hero-bigtype variant) ---
  document.querySelectorAll('.hero-bigtype .megawave').forEach((mw) => {
    mw.innerHTML = '';
    for (let i = 0; i < 32; i++) {
      const el = document.createElement('i');
      const h = 30 + Math.random() * 70;
      el.style.height = `${h}%`;
      el.style.animationDelay = `${(i % 8) * 0.06}s`;
      mw.appendChild(el);
    }
  });

  // --- hero mini-demo: chip selection + typewriter ---
  document.querySelectorAll('.demo-chip-row').forEach((row) => {
    const chips = row.querySelectorAll('.demo-chip');
    chips.forEach((c) => c.addEventListener('click', () => {
      chips.forEach((x) => x.classList.remove('active'));
      c.classList.add('active');
    }));
  });

  function typewriter(el) {
    if (!el) return;
    const text = el.getAttribute('data-text') || el.textContent.trim();
    el.setAttribute('data-text', text);
    el.textContent = '';
    let i = 0;
    const tick = () => {
      if (i >= text.length) {
        setTimeout(() => { el.textContent = ''; i = 0; tick(); }, 2400);
        return;
      }
      el.textContent += text[i++];
      setTimeout(tick, 50 + Math.random() * 40);
    };
    setTimeout(tick, 600);
  }
  document.querySelectorAll('.typed-text').forEach(typewriter);

  // --- distributor table filter (on /guide.html) ---
  const filterBar = document.querySelector('.dist-filters');
  if (filterBar) {
    const rows = document.querySelectorAll('.dist-row');
    const applyFilter = () => {
      const active = filterBar.querySelector('.demo-chip.active');
      const filter = active ? active.getAttribute('data-filter') : 'all';
      rows.forEach((r) => {
        const ok = filter === 'all' || r.getAttribute('data-tags').includes(filter);
        r.style.display = ok ? '' : 'none';
      });
    };
    filterBar.querySelectorAll('.demo-chip').forEach((c) => {
      c.addEventListener('click', () => {
        filterBar.querySelectorAll('.demo-chip').forEach((x) => x.classList.remove('active'));
        c.classList.add('active');
        applyFilter();
      });
    });
    applyFilter();
  }

  // --- init i18n once DOM is ready ---
  if (window.TS_initLang) window.TS_initLang();

  // --- logo: apply persisted choice across all pages ---
  if (window.TS_setLogo) {
    let stored = 'monogram';
    try { stored = localStorage.getItem('ts_logo') || 'monogram'; } catch (e) {}
    if (stored !== 'monogram') window.TS_setLogo(stored);
  }

  // --- logo gallery (homepage) ---
  const grid = document.getElementById('logo-grid');
  if (grid && window.TS_LOGO_LIST) {
    const current = (() => { try { return localStorage.getItem('ts_logo') || 'monogram'; } catch (e) { return 'monogram'; } })();
    grid.innerHTML = window.TS_LOGO_LIST.map((v, i) => `
      <div class="logo-card ${v.id === current ? 'selected' : ''}" data-id="${v.id}">
        <div class="logo-stage">
          ${window.TS_LOGOS[v.id](28)}
          <span class="wordmark">Track <em>Start</em></span>
        </div>
        <div class="logo-meta">
          <strong>${v.name}</strong>
          <span class="idx">0${i + 1} / 06</span>
        </div>
        <p class="logo-desc">${v.desc}</p>
      </div>
    `).join('');
    grid.querySelectorAll('.logo-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        grid.querySelectorAll('.logo-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        window.TS_setLogo(id);
      });
    });
  }
})();
