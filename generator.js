// Track Start — Generator page interactions
// Mocked lyric generator (deterministic from the brief) so the prototype is
// snappy and works offline. Real claude.complete wiring sits behind one flag.

(function () {
  // collect chip-row selections
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

  // BPM slider
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

  // --- mocked lyric "generator" ---
  // Picks templates based on language + structure. Substitutes a couple of words
  // from the idea string. Good enough to feel real in the prototype.

  const RU_VERSES = [
    [
      "{place} ложится в окна",
      "Город спит, {object} едет",
      "Я держу твой номер в кармане",
      "Но звонить уже не буду"
    ],
    [
      "Свет от {place} на стенах",
      "Чай остыл, музыка тише",
      "Я писал тебе двадцать строчек",
      "Все стёр — только воздух слышен"
    ],
    [
      "{Place} в три ночи — это шёпот",
      "Лестница спит, дверь открыта",
      "Я придумал тебя слишком долго",
      "И теперь не уйти от ритма"
    ]
  ];
  const RU_CHORUS = [
    [
      "Полночный {motion}, конечная — рассвет",
      "Я доеду до тебя или нет",
      "{place} — это просто свет",
      "Что-то начнётся, чего-то — нет"
    ],
    [
      "Скажи мне, что мы не во сне",
      "Скажи, что осталось во мне",
      "{place} тихо горит вдалеке",
      "Мы держимся за пустоту в руке"
    ]
  ];
  const RU_BRIDGE = [
    [
      "Если завтра — пусть будет завтра",
      "Я не верю в большие слова",
      "Только в {object} на повороте",
      "И в твою на плече голову"
    ]
  ];

  const EN_VERSES = [
    [
      "{Place} folds into the window",
      "City sleeps, the {object} keeps moving",
      "I'm holding your number in my pocket",
      "But I'm not going to call tonight"
    ],
    [
      "Glow from a {place} on the wall",
      "Tea got cold, the room got quieter",
      "Wrote you twenty different lines",
      "Then I deleted every word"
    ]
  ];
  const EN_CHORUS = [
    [
      "Midnight {motion}, last stop — sunrise",
      "Will I make it to you or not",
      "{Place} is just a strip of light",
      "Something begins, something does not"
    ]
  ];
  const EN_BRIDGE = [
    [
      "If tomorrow comes, let it come slow",
      "I don't trust the big words anymore",
      "Just the {object} taking the turn",
      "And your head resting on my shoulder"
    ]
  ];

  function pickWords(idea, lang) {
    const i = (idea || '').toLowerCase();
    let place = lang === 'en' ? 'street' : 'улица';
    let object = lang === 'en' ? 'car' : 'машина';
    let motion = lang === 'en' ? 'route' : 'маршрут';
    if (/троллейбус|tram|трамвай/.test(i)) { object = lang === 'en' ? 'tram' : 'троллейбус'; motion = lang === 'en' ? 'tram' : 'маршрут'; }
    if (/такси|taxi/.test(i)) { object = 'такси'; motion = lang === 'en' ? 'ride' : 'рейс'; }
    if (/метро|subway/.test(i)) { object = lang === 'en' ? 'subway' : 'метро'; motion = lang === 'en' ? 'line' : 'ветка'; }
    if (/мост|bridge/.test(i)) { place = lang === 'en' ? 'bridge' : 'мост'; }
    if (/окн|window/.test(i)) { place = lang === 'en' ? 'window' : 'окно'; }
    if (/море|sea|ocean/.test(i)) { place = lang === 'en' ? 'sea' : 'море'; }
    if (/фонар|street.?light|lamp/.test(i)) { place = lang === 'en' ? 'streetlight' : 'фонарь'; }
    return { place, object, motion, Place: place[0].toUpperCase() + place.slice(1) };
  }

  function fill(lines, w) {
    return lines.map(l => l.replace(/\{(\w+)\}/g, (_, k) => w[k] || '')).join('\n');
  }

  function pick(arr, seed) { return arr[seed % arr.length]; }

  const STRUCTURES = {
    vcvcbc: ['V', 'C', 'V', 'C', 'B', 'C'],
    vcbc:   ['V', 'C', 'B', 'C'],
    vcvcvbc:['V', 'C', 'V', 'C', 'V', 'B', 'C']
  };

  function generateLyrics(brief) {
    const lang = brief.lang === 'en' ? 'en' : 'ru'; // mix treated as ru base for prototype
    const w = pickWords(brief.idea, lang);
    const V = lang === 'en' ? EN_VERSES : RU_VERSES;
    const C = lang === 'en' ? EN_CHORUS : RU_CHORUS;
    const B = lang === 'en' ? EN_BRIDGE : RU_BRIDGE;
    const order = STRUCTURES[brief.structure] || STRUCTURES.vcvcbc;
    const seed = (brief.idea || '').length + (brief.bpm || 96);
    let vi = 0;
    const blocks = order.map((tok, idx) => {
      if (tok === 'V') {
        const verse = fill(pick(V, seed + vi), w);
        vi += 1;
        return { kind: 'verse', label: lang === 'en' ? `[verse ${vi}]` : `[куплет ${vi}]`, text: verse };
      }
      if (tok === 'C') {
        return { kind: 'chorus', label: lang === 'en' ? '[chorus]' : '[припев]', text: fill(pick(C, seed), w) };
      }
      if (tok === 'B') {
        return { kind: 'bridge', label: lang === 'en' ? '[bridge]' : '[бридж]', text: fill(pick(B, seed), w) };
      }
      return null;
    }).filter(Boolean);
    return blocks;
  }

  function generateSunoPrompt(brief) {
    const tags = [brief.genre, brief.mood, `${brief.bpm} BPM`, brief.lang === 'en' ? 'english vocals' : 'russian vocals'];
    const instruments = {
      'synth-pop': 'analog synths, drum machine, reverbed vocals, gated snare',
      'lo-fi': 'tape-saturated drums, mellow keys, vinyl crackle, soft sub-bass',
      'indie rock': 'jangly guitars, driving bass, live drums, room ambience',
      'r&b': 'rhodes piano, smooth bass, finger snaps, layered harmonies',
      'folk': 'acoustic guitar, brushed drums, intimate vocals, soft strings',
      'hyperpop': 'pitched vocals, distorted 808s, glitchy hats, bright synths'
    }[brief.genre] || 'modern production';
    const structureLabel = {
      vcvcbc: 'verse–chorus–verse–chorus–bridge–chorus',
      vcbc: 'verse–chorus–bridge–chorus',
      vcvcvbc: 'verse–chorus–verse–chorus–verse–bridge–chorus'
    }[brief.structure];
    return [
      `[Style] ${brief.genre}, ${brief.mood}, ${brief.bpm} BPM, Am`,
      `[Instruments] ${instruments}`,
      `[Vocals] ${brief.lang === 'en' ? 'english' : (brief.lang === 'mix' ? 'russian + english phrases' : 'russian')}, melodic, slightly intimate`,
      `[Structure] ${structureLabel}`,
      `[Mix] warm, wide stereo, gentle tape compression`,
      `[Tags] ${tags.join(', ')}`
    ].join('\n');
  }

  function renderLyrics(blocks) {
    const doc = document.getElementById('lyric-doc');
    doc.innerHTML = '';
    blocks.forEach((b, i) => {
      const card = document.createElement('div');
      card.className = 'lyric-block-card';
      card.innerHTML = `
        <div class="lb-label">${b.label}</div>
        <div class="lb-text" contenteditable="true" spellcheck="false">${b.text.replace(/</g, '&lt;')}</div>
        <div class="lb-tools">
          <button class="lb-regen" title="Regenerate this block">↻</button>
        </div>`;
      doc.appendChild(card);
      card.querySelector('.lb-regen').addEventListener('click', () => regenerateBlock(card, i));
    });
  }

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

  let currentBlocks = [];
  let currentBrief = null;

  function regenerateBlock(card, idx) {
    if (!currentBrief) return;
    // re-roll with a perturbed seed
    const tweaked = { ...currentBrief, idea: currentBrief.idea + ' ' + Math.random().toString(36).slice(2, 6) };
    const fresh = generateLyrics(tweaked);
    if (fresh[idx]) {
      currentBlocks[idx] = fresh[idx];
      const txt = card.querySelector('.lb-text');
      txt.textContent = fresh[idx].text;
      txt.style.transition = 'background .35s ease';
      txt.style.background = 'var(--accent-soft)';
      setTimeout(() => { txt.style.background = ''; }, 700);
    }
  }

  function runGenerate() {
    const brief = readBrief();
    currentBrief = brief;
    document.getElementById('empty-lyrics').style.display = 'none';
    document.getElementById('lyric-doc').innerHTML = '';
    document.getElementById('gen-status').style.display = 'flex';
    document.getElementById('suno-panel').style.display = 'none';
    document.getElementById('regen-lyrics').style.display = 'none';

    // simulate "thinking"
    setTimeout(() => {
      currentBlocks = generateLyrics(brief);
      renderLyrics(currentBlocks);
      document.getElementById('gen-status').style.display = 'none';

      // suno prompt
      document.getElementById('suno-panel').style.display = '';
      const prompt = generateSunoPrompt(brief);
      const html = prompt
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/(\[[^\]]+\])/g, '<span class="tag">$1</span>')
        .replace(/(\d{2,3})( BPM)/g, '<span class="num">$1</span>$2');
      document.getElementById('suno-prompt').innerHTML = html;

      document.getElementById('regen-lyrics').style.display = '';

      // meta chip
      document.getElementById('lyric-meta').textContent = `${brief.genre} · ${brief.bpm} BPM · ${brief.mood}`;
    }, 900);
  }

  document.getElementById('generate').addEventListener('click', runGenerate);
  document.getElementById('regen-lyrics').addEventListener('click', runGenerate);

  function copyText(text, btn) {
    const orig = btn.textContent;
    navigator.clipboard?.writeText(text).then(() => {
      btn.textContent = '✓ copied';
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
})();
