/*
 * @palette-exempt: hand-drawn SVG scene art — these colours ARE the
 * illustration (dome, brickwork, lamp filament), not chrome. Tokenising them
 * would flatten a drawing into six semantic roles. Chrome in this game still
 * follows the palette; see scripts/audit-design.mjs.
 */
import React from 'react';

/*
 * Shared pieces for the crime-scene rooms.
 *
 * Each room is one SVG drawn on a 1200x600 canvas and stretched to fill its
 * container (preserveAspectRatio="none"), so a hotspot at 50%/30% always lands
 * on the same prop regardless of the viewport. That is why the rooms are built
 * almost entirely from verticals, horizontals and ellipses: those survive a
 * non-uniform stretch, where circles and diagonals would visibly skew.
 *
 * The visual language is the same in every room — near-black silhouettes, one
 * cold light source from outside, one warm pool inside, and dust in the beam.
 */

export const SCENE_W = 1200;
export const SCENE_H = 600;

/** Gradients and filters every room draws from. */
export function SceneDefs({ id, cold = '#2e3d5e', warm = '#ffd98a' }) {
  return (
    <defs>
      <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1b1c26" />
        <stop offset="0.62" stopColor="#101019" />
        <stop offset="1" stopColor="#0a0a10" />
      </linearGradient>
      <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#191309" />
        <stop offset="1" stopColor="#080606" />
      </linearGradient>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={cold} />
        <stop offset="1" stopColor="#0d1420" />
      </linearGradient>
      <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={cold} stopOpacity="0.30" />
        <stop offset="1" stopColor={cold} stopOpacity="0" />
      </linearGradient>
      <radialGradient id={`${id}-pool`}>
        <stop offset="0" stopColor={warm} stopOpacity="0.20" />
        <stop offset="1" stopColor={warm} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-lamp`}>
        <stop offset="0" stopColor={warm} stopOpacity="0.85" />
        <stop offset="1" stopColor={warm} stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

/** Rain falling past an opening, clipped to it. */
export function RainThrough({ x, y, w, h, seed = 1 }) {
  const drops = [];
  for (let i = 0; i < 26; i++) {
    const dx = x + ((i * 97 + seed * 41) % w);
    const dy = y + ((i * 53 + seed * 29) % h);
    drops.push(
      <line
        key={i}
        x1={dx}
        y1={dy}
        x2={dx - 4}
        y2={dy + 26}
        stroke="#9fb4d8"
        strokeWidth="1.4"
        opacity={0.18 + ((i % 4) * 0.07)}
      />,
    );
  }
  return <g>{drops}</g>;
}

/** A scatter of dust motes, to give a light beam something to catch. */
export function Motes({ x, y, w, h, n = 18, seed = 3 }) {
  const dots = [];
  for (let i = 0; i < n; i++) {
    dots.push(
      <ellipse
        key={i}
        cx={x + ((i * 131 + seed * 37) % w)}
        cy={y + ((i * 71 + seed * 53) % h)}
        rx="1.6"
        ry="1.6"
        fill="#ffe9c0"
        opacity={0.10 + ((i % 5) * 0.045)}
      />,
    );
  }
  return <g>{dots}</g>;
}

/** Floorboards / tiling receding into the dark. */
export function FloorLines({ y, count = 5, gap = 26, opacity = 0.3 }) {
  const lines = [];
  for (let i = 0; i < count; i++) {
    lines.push(
      <line
        key={i}
        x1="0"
        y1={y + i * gap}
        x2={SCENE_W}
        y2={y + i * gap}
        stroke="#000"
        strokeWidth="2"
        opacity={opacity}
      />,
    );
  }
  return <g>{lines}</g>;
}
