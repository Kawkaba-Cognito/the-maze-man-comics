import React from 'react';
import { assetUrl } from '../../../lib/assetUrl';

/*
 * Game picker cards for all 6 training domains — a staggered frosted-glass
 * card (matches the app's existing --domain-mid/--domain-deep tokens, no
 * invented colours) with a real scene illustration that depicts what the
 * game actually asks you to do, instead of an abstract icon.
 *
 * Illustrations: unDraw (free, no-attribution licence — https://undraw.co/license),
 * recoloured per domain to that domain's own accent (tokens.domainPalette mid).
 * This replaced two earlier directions: a real-photographic-planet-sphere
 * card (too generic — "a nice planet" isn't "this specific game"), and the
 * app's native comic-panel card shell (matched the rest of the app better
 * structurally, but the glass card language + big illustration read as more
 * obviously "this game" and was the one that stuck after user review).
 */
const ILLUSTRATION = {
  // Attention
  'cancel-task': assetUrl('Assets/game-illustrations/cancel-task.svg'),
  mot: assetUrl('Assets/game-illustrations/mot.svg'),
  'train-switch': assetUrl('Assets/game-illustrations/train-switch.svg'),
  // Speed
  'speed-match': assetUrl('Assets/game-illustrations/speed-match.svg'),
  'math-gates': assetUrl('Assets/game-illustrations/math-gates.svg'),
  'trail-making': assetUrl('Assets/game-illustrations/trail-making.svg'),
  // Memory
  'story-grid': assetUrl('Assets/game-illustrations/story-grid.svg'),
  nback: assetUrl('Assets/game-illustrations/nback.svg'),
  'paired-associates': assetUrl('Assets/game-illustrations/paired-associates.svg'),
  // Language
  wordle: assetUrl('Assets/game-illustrations/wordle.svg'),
  synonyms: assetUrl('Assets/game-illustrations/synonyms.svg'),
  trivia: assetUrl('Assets/game-illustrations/trivia.svg'),
  // Reasoning
  'rush-hour': assetUrl('Assets/game-illustrations/rush-hour.svg'),
  'raven-matrices': assetUrl('Assets/game-illustrations/raven-matrices.svg'),
  detective: assetUrl('Assets/game-illustrations/detective.svg'),
  // Flexibility
  'spatial-stroop': assetUrl('Assets/game-illustrations/spatial-stroop.svg'),
  wisconsin: assetUrl('Assets/game-illustrations/wisconsin.svg'),
  brixton: assetUrl('Assets/game-illustrations/brixton.svg'),
};

let injected = false;
function ensureCss() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const style = document.createElement('style');
  style.textContent = `
@keyframes gpt-in { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
@keyframes gpt-borderspin { to { --a: 360deg; } }
@property --a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
`;
  document.head.appendChild(style);
}

const GLASS_LAYOUT = [
  { align: 'flex-start', rotate: -1.5 },
  { align: 'flex-end', rotate: 1.2 },
  { align: 'flex-start', rotate: -0.8, marginLeft: '10%' },
];

/** Every card shares the app's own per-domain colour tokens (already scoped
 *  via .ct-domain-pick--<domain> on an ancestor) — no per-game hex maps. */
function glassShell(L) {
  return {
    alignSelf: L.align, marginLeft: L.marginLeft, marginTop: 4,
    width: 236, textAlign: 'left', cursor: 'pointer', font: 'inherit',
    border: 'none', padding: 2.5, borderRadius: 22,
    background: 'conic-gradient(from var(--a,0deg), var(--domain-mid), transparent 25%, var(--domain-deep) 55%, transparent 80%, var(--domain-mid) 100%)',
    animation: 'gpt-borderspin 5s linear infinite',
    transform: `rotate(${L.rotate}deg)`,
    boxShadow: '0 0 22px 2px color-mix(in srgb, var(--domain-mid) 45%, transparent)',
  };
}

function IllustrationCard({ sub, idx, onOpen, name, blurb }) {
  const L = GLASS_LAYOUT[idx] || GLASS_LAYOUT[0];
  const illo = ILLUSTRATION[sub.game];
  const shell = glassShell(L);
  return (
    <button type="button" onClick={() => onOpen(sub)} style={{ ...shell, animation: `gpt-in 0.55s ease ${idx * 0.12}s both, ${shell.animation}` }}>
      <span style={{
        display: 'flex', flexDirection: 'column', borderRadius: 20, overflow: 'hidden',
        background: 'rgba(14,10,26,0.72)', backdropFilter: 'blur(14px) saturate(160%)',
        boxShadow: '0 14px 34px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}>
        <span style={{
          position: 'relative', height: 108, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--domain-mid) 38%, transparent), transparent 70%)',
        }}>
          {illo && <img src={illo} alt="" style={{ width: '90%', height: '90%', objectFit: 'contain' }} />}
        </span>
        <span style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: 16, color: '#fff' }}>{name}</span>
          {blurb && <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.35 }}>{blurb}</span>}
        </span>
      </span>
    </button>
  );
}

/** Renders the whole picker-list for a domain as illustrated glass cards. */
export default function GamePlanetScene({ subs, onOpen }) {
  ensureCss();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, padding: '14px 6px 30px' }}>
      {subs.map((sub, idx) => (
        <IllustrationCard key={sub.id} sub={sub} idx={idx} onOpen={onOpen} name={sub.name} blurb={sub.blurb} />
      ))}
    </div>
  );
}
