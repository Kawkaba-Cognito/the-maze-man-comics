/**
 * Pure computation helpers for Rush Hour level specs.
 * Separated from data.js so the Web Worker can import without localStorage deps.
 */

export const RH_LEVELS_PER_TIER = 20;
export const RH_DIFF_KEYS = ['easy', 'inter', 'hard', 'xhard', 'deadly'];

/**
 * Curriculum parameters from tier index T∈[0,4] and stage L∈[1,20].
 * Grid width G∈[6,9], scramble depth, and BFS par window all grow smoothly.
 */
export function specificationForLevel(diffKey, levelIndex) {
  const T = Math.max(0, RH_DIFF_KEYS.indexOf(diffKey));
  const L = Math.max(1, Math.min(RH_LEVELS_PER_TIER, levelIndex));

  const G = Math.min(
    7,
    Math.max(
      6,
      6 + Math.floor(0.4 * T + 0.05 * L + 0.024 * T * L),
    ),
  );
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
