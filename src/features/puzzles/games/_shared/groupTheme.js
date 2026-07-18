/*
 * Shared kit for the Group Challenge party games (Imposter, Charades, Describe It,
 * On a Scale). One warm palette + one bilingual word-pack set so every game reuses
 * the same content and look.
 */

export const INK = '#2d2210';
export const SUB = '#8a7f6f';
export const FAINT = '#b3a288';
export const LINE = '#e3d6c4';
export const CARD = '#fffdf8';
export const GOLD = '#b9842f';
export const SERIF = "'Cormorant Garamond', Georgia, serif";
export const SANS = "'Outfit', system-ui, sans-serif";

export const rnd = (n) => Math.floor(Math.random() * n);
export const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export { PACKS, packById, randomPack } from './groupPacks.js';
