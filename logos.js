// Track Start — logo variants registry.
// Each entry returns an inline <svg> string sized to the requested px.
// Variants are deliberately different in metaphor so the user can pick a direction.
window.TS_LOGOS = {
  // 01 — Monogram: stacked T / S in a rounded square (current default)
  monogram(size = 28, color = 'var(--ink)', accent = 'var(--accent-2)') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="26" height="26" rx="8" fill="${color}"/>
      <path d="M8 18 L8 10 L14 10 M14 10 L14 18 M14 14 L20 14 M20 14 L20 18 M20 14 L20 10"
            stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`;
  },
  // 02 — Play+Start arrow: triangle morphing into an arrow → "start"
  play_start(size = 28, color = 'var(--ink)', accent = 'var(--accent)') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="13" fill="${color}"/>
      <path d="M11 9 L19 14 L11 19 Z" fill="${accent}"/>
      <path d="M19 14 L24 14" stroke="${accent}" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  },
  // 03 — Vinyl: concentric circles with a needle/path slash
  vinyl(size = 28, color = 'var(--ink)', accent = 'var(--accent)') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="13" fill="${color}"/>
      <circle cx="14" cy="14" r="9" stroke="rgba(255,255,255,0.18)" stroke-width="1" fill="none"/>
      <circle cx="14" cy="14" r="6" stroke="rgba(255,255,255,0.28)" stroke-width="1" fill="none"/>
      <circle cx="14" cy="14" r="2.5" fill="${accent}"/>
      <line x1="14" y1="14" x2="22" y2="6" stroke="${accent}" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
  },
  // 04 — Waveform: 4 bars rising → step path
  waveform(size = 28, color = 'var(--ink)', accent = 'var(--accent)') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 28 28" fill="none">
      <rect x="1" y="1" width="26" height="26" rx="8" fill="${color}"/>
      <rect x="6"  y="14" width="3" height="6"  rx="1.5" fill="${accent}"/>
      <rect x="11" y="10" width="3" height="10" rx="1.5" fill="${accent}"/>
      <rect x="16" y="6"  width="3" height="14" rx="1.5" fill="${accent}"/>
      <rect x="21" y="11" width="3" height="9"  rx="1.5" fill="${accent}"/>
    </svg>`;
  },
  // 05 — Path: 5 dots connected by a curving line → the "5 steps" metaphor
  path(size = 28, color = 'var(--ink)', accent = 'var(--accent)') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 28 28" fill="none">
      <rect x="1" y="1" width="26" height="26" rx="8" fill="${color}"/>
      <path d="M5 20 Q 9 8, 14 14 T 23 8" stroke="${accent}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <circle cx="5"  cy="20" r="1.6" fill="${accent}"/>
      <circle cx="10" cy="11" r="1.6" fill="${accent}"/>
      <circle cx="14" cy="14" r="1.6" fill="${accent}"/>
      <circle cx="19" cy="11" r="1.6" fill="${accent}"/>
      <circle cx="23" cy="8"  r="1.6" fill="${accent}"/>
    </svg>`;
  },
  // 06 — Asterisk / spark: T* — minimal type-based mark
  spark(size = 28, color = 'var(--ink)', accent = 'var(--accent)') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 28 28" fill="none">
      <rect x="1" y="1" width="26" height="26" rx="8" fill="${color}"/>
      <path d="M7 9 H15 M11 9 V20" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
      <g stroke="${accent}" stroke-width="1.6" stroke-linecap="round">
        <line x1="20" y1="9"  x2="20" y2="15"/>
        <line x1="17" y1="12" x2="23" y2="12"/>
        <line x1="17.8" y1="9.8" x2="22.2" y2="14.2"/>
        <line x1="22.2" y1="9.8" x2="17.8" y2="14.2"/>
      </g>
    </svg>`;
  }
};

window.TS_LOGO_LIST = [
  { id: 'monogram', name: 'Monogram', desc: 'Сложенные T/S — текущий по умолчанию' },
  { id: 'play_start', name: 'Play · Start', desc: 'Треугольник плеера, переходящий в стрелку' },
  { id: 'vinyl', name: 'Vinyl', desc: 'Концентрические окружности, иглы пластинки' },
  { id: 'waveform', name: 'Waveform', desc: 'Четыре столбика растущего эквалайзера' },
  { id: 'path', name: 'Path', desc: 'Пять точек маршрута — метафора 5 шагов' },
  { id: 'spark', name: 'Type spark', desc: 'Минимальная литера T с искрой-астериском' }
];

// Replace every brand mark on the page with the chosen variant.
window.TS_setLogo = function (id) {
  const fn = window.TS_LOGOS[id] || window.TS_LOGOS.monogram;
  document.querySelectorAll('.brand > svg').forEach((svg) => {
    const size = parseInt(svg.getAttribute('width'), 10) || 28;
    const wrap = document.createElement('span');
    wrap.innerHTML = fn(size);
    const fresh = wrap.firstElementChild;
    svg.replaceWith(fresh);
  });
  try { localStorage.setItem('ts_logo', id); } catch (e) {}
};
