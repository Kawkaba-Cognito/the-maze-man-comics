/**
 * Pure computation helpers for Rush Hour level specs.
 * Separated from data.js so the Web Worker can import without localStorage deps.
 */

export const RH_LEVELS_PER_TIER = 100;
export const RH_DIFF_KEYS = ['easy', 'medium', 'hard'];

/**
 * Legacy pure spec helper kept for tooling compatibility. Runtime levels now
 * come from curated-levels.js, where every board is BFS-verified.
 */
export function specificationForLevel(diffKey, levelIndex) {
  const T = Math.max(0, RH_DIFF_KEYS.indexOf(diffKey));
  const L = Math.max(1, Math.min(RH_LEVELS_PER_TIER, levelIndex));

  const G = 6;
  const exitRow = Math.floor((G - 1) / 2);

  const scrambleBase = 14 + 5.2 * L + (0.55 * L * L) / 20;
  const tierScramble = 1 + 0.26 * T + 0.014 * T * L;
  const gridBoost = (G - 6) * (11 + L * 0.35);
  const deadlyLift = T >= 4 ? 1.15 + 0.004 * L : 1;
  const steps = Math.min(
    200,
    Math.floor(
      (scrambleBase * tierScramble + gridBoost + 0.52 * T * G * G) * deadlyLift,
    ),
  );

  const seed =
    (0x51ed * L) ^
    (0xfcf1 * T) ^
    diffKey.split('').reduce((a, c) => Math.imul(a, 31) + c.charCodeAt(0), 7);

  const densityBump = Math.floor(0.45 * T * T + 0.12 * T * (G - 6));

  return {
    grid: G,
    exitRow,
    steps,
    seed: (seed >>> 0) || 1,
    densityBump,
  };
}
