import React from 'react';
import { assetUrl } from '../../lib/assetUrl';

/*
 * Real photographic planet spheres for the user's Universe planets — same
 * fake-3D rotating-texture technique as the training prototypes (equirect
 * photo panned via background-position, radial-gradient shading overlay for
 * volume), tinted toward each planet type's brand color so it still reads
 * as "note / goal / journal" rather than a literal astronomy lesson.
 * Textures: Moon / Saturn / Jupiter, NASA-derived via Solar System Scope
 * (CC BY 4.0 — attribution needed if shipped), already resized to a few KB.
 */
const TEX = {
  note: assetUrl('Assets/proto-planets/moon.jpg'),
  goal: assetUrl('Assets/proto-planets/saturn.jpg'),
  journal: assetUrl('Assets/proto-planets/jupiter.jpg'),
};
function ringGradient(color) {
  return `radial-gradient(ellipse at center, transparent 0%, transparent 50%, color-mix(in srgb, ${color} 40%, transparent) 53%, color-mix(in srgb, ${color} 95%, #fff) 58%, color-mix(in srgb, ${color} 55%, transparent) 66%, color-mix(in srgb, ${color} 85%, #fff) 70%, color-mix(in srgb, ${color} 30%, transparent) 76%, transparent 80%)`;
}

let injected = false;
function ensureCss() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const style = document.createElement('style');
  style.textContent = `
@keyframes usph-spin { from { background-position: 0 0; } to { background-position: calc(-1 * var(--usph-pan)) 0; } }
`;
  document.head.appendChild(style);
}

function RingHalf({ size, color, front }) {
  const w = size * 2.3;
  const h = w * 0.34;
  return (
    <span aria-hidden="true" style={{
      position: 'absolute', left: '50%', top: '50%', width: w, height: h, zIndex: front ? 3 : 0,
      transform: 'translate(-50%,-50%) rotate(-15deg)',
      background: ringGradient(color),
      clipPath: front ? 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)' : 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
      filter: front ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' : 'brightness(0.55)',
    }} />
  );
}

/** A real rotating planet sphere, tinted toward `color`, sized for the small Universe badges. */
export default function RealPlanetSphere({ type, size, color, spinDur = 26 }) {
  ensureCss();
  const tex = TEX[type];
  const ringed = type === 'goal';
  const panPx = Math.max(110, Math.round(size * 3));
  if (!tex) return null;
  return (
    <span style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
      {ringed && <RingHalf size={size} color={color} front={false} />}
      <span style={{
        position: 'relative', zIndex: 2, display: 'block', width: size, height: size, borderRadius: '50%',
        overflow: 'hidden',
        backgroundImage: `url(${tex})`,
        backgroundRepeat: 'repeat-x',
        backgroundSize: `${panPx}px 100%`,
        '--usph-pan': `${panPx}px`,
        animation: `usph-spin ${spinDur}s linear infinite`,
      }}>
        {/* Colour identity: a translucent tint layer (multiply keeps the photo's shading, just shifts hue toward the planet type's brand colour) */}
        <span aria-hidden="true" style={{
          position: 'absolute', inset: 0, background: color, mixBlendMode: 'color', opacity: 0.65,
        }} />
        <span aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.1) 26%, transparent 45%), radial-gradient(circle at 68% 74%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 45%, transparent 68%)',
        }} />
      </span>
      {ringed && <RingHalf size={size} color={color} front />}
    </span>
  );
}
