// Track Start — Tweaks panel (loaded after React + Babel + tweaks-panel.jsx)
// Exposes 4 tweaks:
//   - hero variant (path / bigtype / player)
//   - accent color (curated swatches)
//   - density (regular / cozy)
//   - typography pair (geist / serif-hybrid / mono-headlines)
// Values are persisted by the host via __edit_mode_set_keys.

const TS_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "hero": "path",
  "accent": "#8b5cf6",
  "density": "regular",
  "typePair": "geist"
}/*EDITMODE-END*/;

function applyTweaks(t) {
  const r = document.documentElement;
  // accent
  r.style.setProperty('--accent', t.accent);
  // derive ink + soft from accent — simple shifts
  const accentMap = {
    '#8b5cf6': { ink: '#5b21b6', soft: '#ede9ff', a2: '#c4b5fd' },
    '#10b981': { ink: '#047857', soft: '#d1fae5', a2: '#6ee7b7' },
    '#f43f5e': { ink: '#9f1239', soft: '#ffe4e6', a2: '#fda4af' },
    '#0ea5e9': { ink: '#0369a1', soft: '#e0f2fe', a2: '#7dd3fc' }
  };
  const m = accentMap[t.accent] || accentMap['#8b5cf6'];
  r.style.setProperty('--accent-ink', m.ink);
  r.style.setProperty('--accent-soft', m.soft);
  r.style.setProperty('--accent-2', m.a2);

  // density
  if (t.density === 'cozy') {
    r.style.setProperty('--gutter', '24px');
    document.body.classList.add('density-cozy');
  } else {
    r.style.setProperty('--gutter', '28px');
    document.body.classList.remove('density-cozy');
  }

  // typography pair
  document.body.setAttribute('data-typepair', t.typePair);

  // hero variant
  if (window.TS_applyHero) window.TS_applyHero(t.hero);
}

function App() {
  const [t, setTweak] = useTweaks(TS_TWEAK_DEFAULTS);
  React.useEffect(() => { applyTweaks(t); }, [t.accent, t.density, t.typePair, t.hero]);
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Hero" />
      <TweakRadio
        label="Variant"
        value={t.hero}
        options={[
          { value: 'path', label: 'Path' },
          { value: 'bigtype', label: 'Type' },
          { value: 'player', label: 'Player' }
        ]}
        onChange={(v) => setTweak('hero', v)}
      />
      <TweakSection label="Visual system" />
      <TweakColor
        label="Accent"
        value={t.accent}
        options={['#8b5cf6', '#10b981', '#f43f5e', '#0ea5e9']}
        onChange={(v) => setTweak('accent', v)}
      />
      <TweakRadio
        label="Density"
        value={t.density}
        options={['regular', 'cozy']}
        onChange={(v) => setTweak('density', v)}
      />
      <TweakSelect
        label="Type pair"
        value={t.typePair}
        options={[
          { value: 'geist', label: 'Geist + Geist Mono' },
          { value: 'serif', label: 'Instrument Serif + Geist' },
          { value: 'mono', label: 'Mono headlines' }
        ]}
        onChange={(v) => setTweak('typePair', v)}
      />
    </TweaksPanel>
  );
}

// Apply defaults immediately (before React mounts) so first paint is correct
applyTweaks(TS_TWEAK_DEFAULTS);

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<App />);
