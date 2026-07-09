/*
 * MATRIX REASONING — mode tuning (levels + pass-n-play + grading).
 *
 * Generator level ramps every ~8–12 levels per tier (no 33-level plateaus).
 */

export const RV_DIFF_KEYS = ['easy', 'medium', 'hard'];
export const RV_LEVELS_PER_TIER = 100;
export const RV_TRIALS_PER_LEVEL = 8;

// [base genLevel, max offset, levels per step]
const TIER = {
  easy: { base: 0, span: 5, div: 8 },     // genLevel 0..5
  medium: { base: 4, span: 6, div: 10 },  // genLevel 4..10
  hard: { base: 8, span: 9, div: 8 },     // genLevel 8..17
};

export function ravenGenLevel(diff, lv) {
  const tier = TIER[diff] ?? TIER.easy;
  const step = Math.floor((lv - 1) / tier.div);
  return tier.base + Math.min(tier.span, step);
}

export function ravenLevelSpec(diff, lv) {
  const trials = RV_TRIALS_PER_LEVEL;
  return { trials, genLevel: ravenGenLevel(diff, lv), targetCorrect: Math.ceil(trials * 0.8) };
}

export function ravenChallengeSpec(diff) {
  return { trials: 8, genLevel: ravenGenLevel(diff, 12) };
}

export function isRavenLevelUnlocked(diff, lv, done = {}) {
  return lv === 1 || !!done[`${diff}-${lv - 1}`];
}

export function gradeRaven(correct, trials, meanRtMs = null) {
  const target = Math.ceil(trials * 0.8);
  const won = correct >= target;
  const accuracy = correct / trials;
  const stars = correct === trials ? 3 : won ? 2 : correct >= Math.ceil(trials * 0.5) ? 1 : 0;
  let score = Math.round(100 * accuracy);
  if (meanRtMs != null && correct > 0) {
    const speed = Math.max(0, Math.min(1, (8000 - meanRtMs) / 5500));
    score = Math.round(100 * accuracy * (0.85 + 0.15 * speed));
  }
  return { won, stars, score, correct, trials, target, meanRtMs };
}

/** Human-readable rule count band for UI. */
export function ravenRuleBand(genLevel) {
  const d = Math.max(1, Math.min(5, 1 + Math.floor(genLevel / 2.5)));
  return d;
}
