import React, { useState } from 'react';
import { assetUrl } from '../../../lib/assetUrl';

/*
 * Game picker for all 6 training domains — the three exercises are painted
 * PLANETS (one top-centre, two below = a triangle), not cards, so the domain
 * pages speak the same "planet" language as the Training hub and the mode
 * constellation (Survival / Levels / Pass n Play). Each game's existing cosmos
 * illustration is mapped onto the orb, then a glossy-sphere overlay + a slow
 * shine sweep make the flat art read as a lit, shining planet — and, crucially,
 * the strong limb-darkening fades the circular crop into shadow so illustrations
 * whose edges get cut never look harshly chopped.
 *
 * We reuse the `.ct-mph-*` planet classes (defined in training.css for
 * ModePlanetHub) so a game planet and a mode planet share glow, orbit ring,
 * float, hover lift, focus ring and reduced-motion. All three orbs are `--md`
 * (equal size). The sphere/shine overlays are this component's own (`.gpt-*`).
 */

/** Full-bleed painted cover art for every live training game. */
const COVER_KEYS = new Set([
  'cancel-task', 'mot', 'train-switch',
  'speed-match', 'math-gates', 'trail-making',
  'story-grid', 'nback', 'paired-associates',
  'wordle', 'synonyms', 'trivia',
  'rush-hour', 'raven-matrices', 'detective',
  'spatial-stroop', 'wisconsin', 'brixton',
]);

const ILLUSTRATION = Object.fromEntries(
  [...COVER_KEYS].map((key) => [key, assetUrl(`Assets/game-illustrations/${key}.webp`)]),
);

/** Glossy-sphere + shine overlays injected once. Kept here (not training.css)
 *  so the game-planet treatment lives with the component that owns it. */
let injected = false;
function ensureCss() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const s = document.createElement('style');
  s.textContent = `
/* Specular highlight (top-left) + strong limb darkening: turns the cropped
   illustration into a lit sphere and fades hard edge-crops into the dark limb. */
.gpt-sphere {
  position: absolute; inset: 0; z-index: 2; border-radius: 50%; pointer-events: none;
  background:
    radial-gradient(circle at 33% 27%, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0.07) 20%, transparent 45%),
    radial-gradient(circle at 50% 50%, transparent 46%, rgba(0,0,0,0.32) 80%, rgba(4,3,10,0.70) 100%);
}
/* A slow diagonal glint that sweeps across the orb — the "shine". Clipped to the
   circle by this layer's own overflow, so it never touches the glow/ring. */
.gpt-shine { position: absolute; inset: 0; z-index: 3; border-radius: 50%; overflow: hidden; pointer-events: none; }
.gpt-shine::before {
  content: ''; position: absolute; top: -30%; left: -12%; width: 46%; height: 160%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.34), transparent);
  transform: translateX(-140%) rotate(20deg);
  animation: gpt-shine 5.2s ease-in-out infinite;
  animation-delay: var(--gpt-shine-delay, 0s);
}
@keyframes gpt-shine {
  0%, 10% { transform: translateX(-140%) rotate(20deg); opacity: 0; }
  22% { opacity: 1; }
  50% { transform: translateX(320%) rotate(20deg); opacity: 0.9; }
  60%, 100% { transform: translateX(320%) rotate(20deg); opacity: 0; }
}
`;
  document.head.appendChild(s);
}

/** One game rendered as a lit, shining planet (mirrors ModePlanetHub). */
function GamePlanet({ sub, onOpen, name, blurb, hovered, setHovered, floatDelay }) {
  const illo = ILLUSTRATION[sub.game];
  const isH = hovered === sub.id;
  return (
    <button
      type="button"
      className={`ct-mph-planet ct-mph-planet--md${isH ? ' is-hot' : ''}`}
      style={{
        '--mph-accent': 'var(--domain-accent)',
        '--mph-float-delay': `${floatDelay}s`,
        '--gpt-shine-delay': `${floatDelay}s`,
      }}
      onClick={() => onOpen(sub)}
      onMouseEnter={() => setHovered(sub.id)}
      onMouseLeave={() => setHovered(null)}
      onFocus={() => setHovered(sub.id)}
      onBlur={() => setHovered(null)}
      aria-label={blurb ? `${name} — ${blurb}` : name}
    >
      <span className="ct-mph-planet-orb" aria-hidden="true">
        <span className="ct-mph-planet-glow" />
        <span className="ct-mph-planet-ring" />
        {illo && <img src={illo} alt="" className="ct-mph-planet-img" draggable={false} />}
        <span className="gpt-sphere" />
        <span className="gpt-shine" />
      </span>
      <span className="ct-mph-planet-copy ct-mph-planet-copy--name-only">
        <span className="ct-mph-planet-name">{name}</span>
      </span>
    </button>
  );
}

/** Renders a domain's exercises as a triangle of three equal shining planets. */
export default function GamePlanetScene({ subs, onOpen }) {
  ensureCss();
  const [hovered, setHovered] = useState(null);
  const [top, left, right] = subs;

  const planet = (sub, delay) =>
    sub ? (
      <GamePlanet
        sub={sub}
        onOpen={onOpen}
        name={sub.name}
        blurb={sub.blurb}
        hovered={hovered}
        setHovered={setHovered}
        floatDelay={delay}
      />
    ) : null;

  return (
    <div className="ct-mph-constellation gpt-constellation" role="group" aria-label="Choose an exercise">
      {top && (
        <div className="ct-mph-slot ct-mph-slot--survival">{planet(top, 0)}</div>
      )}
      <div className="ct-mph-row">
        {left && <div className="ct-mph-slot ct-mph-slot--levels">{planet(left, 1.3)}</div>}
        {right && <div className="ct-mph-slot ct-mph-slot--pass">{planet(right, 2.6)}</div>}
      </div>
    </div>
  );
}
