/*
 * shapeNorm.js — equalize filled-INK area across the cancellation shapes.
 *
 * Why: in a cancellation / visual-search task a shape that simply has more ink
 * (a solid square vs a thin star) is more salient and is found faster — a
 * low-level confound that makes difficulty depend on which shape happened to be
 * the target rather than on attention. We measure each shape's filled pixels
 * once (offscreen canvas) and derive a DOWN-scale toward a low-percentile target
 * so the heaviest shapes shrink to match the lighter ones. We never ENLARGE
 * (the cell clips overflow, and the shapes already fill their box), so this is
 * clip-safe and keeps every shape recognisable.
 *
 * Pure runtime, no build step. If there is no DOM (tests), getShapeScale → 1.
 * Leaf components read getShapeScale() and subscribe via useSyncExternalStore so
 * they re-render once measurement finishes (a few ms after load).
 */
import { SH } from './focusQuestData';

const scaleCache = Object.create(null);
let version = 0;
let started = false;
const listeners = new Set();

/** Multiplicative scale (≤1) to apply around the shape centre; 1 until measured. */
export function getShapeScale(shape) {
  return scaleCache[shape] ?? 1;
}

export function subscribeShapeNorm(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getShapeNormVersion() {
  return version;
}

function finalize(areas) {
  const vals = Object.values(areas)
    .filter((a) => a > 0)
    .sort((a, b) => a - b);
  if (!vals.length) return;
  // Target ≈ 33rd-percentile filled area: heavier shapes shrink toward it,
  // lighter shapes stay at 1.0 (clamp). Scale floor keeps shapes legible.
  const target = vals[Math.floor(vals.length * 0.33)];
  for (const name of Object.keys(areas)) {
    const a = areas[name];
    scaleCache[name] = a > 0 ? Math.min(1, Math.max(0.72, Math.sqrt(target / a))) : 1;
  }
  version += 1;
  listeners.forEach((cb) => cb());
}

export function measureShapes() {
  if (started || typeof document === 'undefined' || typeof Image === 'undefined') return;
  started = true;
  const names = Object.keys(SH);
  if (!names.length) return;
  const areas = Object.create(null);
  let pending = names.length;
  const done = () => {
    pending -= 1;
    if (pending === 0) finalize(areas);
  };
  for (const name of names) {
    // color='black' so fill="currentColor" resolves to opaque black for counting.
    const markup = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='64' height='64' color='black'>${SH[name]}</svg>`;
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = 64;
        c.height = 64;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, 64, 64);
        const { data } = ctx.getImageData(0, 0, 64, 64);
        let a = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 12) a += 1;
        areas[name] = a;
      } catch {
        areas[name] = 0;
      }
      done();
    };
    img.onerror = () => {
      areas[name] = 0;
      done();
    };
    img.src = `data:image/svg+xml,${encodeURIComponent(markup)}`;
  }
}

// Kick off measurement at import (browser only; no-op under SSR/tests).
measureShapes();
