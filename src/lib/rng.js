/**
 * Seeded PRNG for the whole app — the single mulberry32 implementation.
 * Every feature that needs reproducible randomness (puzzle generation,
 * Pass n Play shared boards, workout plans, maze layouts) imports from here.
 */

/** mulberry32(seed) → () => float in [0,1). Uses the seed as-is (>>> 0). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Like mulberry32 but never seeds with 0 (0 → 1), the puzzles/training convention. */
export function createRng(seed) {
  return mulberry32((seed >>> 0) || 1);
}

/** Alias kept for the training games (Pass n Play shared-board seeding). */
export const makeRng = createRng;

export function randomSeed() {
  return ((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0) || 1;
}

/** Fisher–Yates on a copy. */
export function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
