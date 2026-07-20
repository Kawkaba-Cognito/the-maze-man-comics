import React from 'react';
import { assetUrl } from '../../../lib/assetUrl';

/*
 * Game picker cards for all 6 training domains — staggered frosted-glass
 * cards using the app's --domain-mid/--domain-deep tokens, with cosmos
 * game-art illustrations that depict each exercise.
 */
/** Full-bleed painted cards (cover) for every live training game. */
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
  const cover = COVER_KEYS.has(sub.game);
  const shell = glassShell(L);
  return (
    <button type="button" onClick={() => onOpen(sub)} style={{ ...shell, animation: `gpt-in 0.55s ease ${idx * 0.12}s both, ${shell.animation}` }}>
      <span style={{
        display: 'flex', flexDirection: 'column', borderRadius: 20, overflow: 'hidden',
        background: 'rgba(14,10,26,0.72)', backdropFilter: 'blur(14px) saturate(160%)',
        boxShadow: '0 14px 34px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}>
        <span style={{
          position: 'relative', height: 118, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--domain-mid) 38%, transparent), transparent 70%)',
          overflow: 'hidden',
        }}>
          {illo && (
            <img
              src={illo}
              alt=""
              style={{
                width: cover ? '100%' : '90%',
                height: cover ? '100%' : '90%',
                objectFit: cover ? 'cover' : 'contain',
                objectPosition: 'center',
              }}
            />
          )}
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
