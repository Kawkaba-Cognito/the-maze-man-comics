/*
 * MATRIX REASONING — mode tuning (levels + pass-n-play + grading).
 * Pure data/logic so it can be unit-tested without React.
 *
 * Difficulty = the generator "level" fed to generateMatrix, which sets how many
 * rules vary at once (d, up to 5 = expert) and how many options (4/6/8). Each
 * tier spans a band of that level and ramps across its 20 levels.
 */
export const RV_DIFF_KEYS = ['easy', 'medium', 'hard'];
export const RV_LEVELS_PER_TIER = 20;

// Generator-level band per tier: [start, perLevelDivisor].
const TIER = {
  easy: { base: 0, div: 6 },     // genLevel 0..3  → 1–2 rules, 4 options
  medium: { base: 5, div: 4 },   // genLevel 5..9  → 3–4 rules, 6 options
  hard: { base: 9, div: 3 },     // genLevel 9..15 → 4–5 rules, 8 options
};

export function ravenGenLevel(diff, lv) {
  const tier = TIER[diff] ?? TIER.easy;
  return tier.base + Math.floor((lv - 1) / tier.div);
}

export function ravenLevelSpec(diff, lv) {
  const trials = 6;
  return { trials, genLevel: ravenGenLevel(diff, lv), targetCorrect: Math.ceil(trials * 0.8) };
}

export function ravenChallengeSpec(diff) {
  return { trials: 8, genLevel: ravenGenLevel(diff, 10) }; // mid-tier difficulty
}

export function isRavenLevelUnlocked(diff, lv, done = {}) {
  return lv === 1 || !!done[`${diff}-${lv - 1}`];
}

/**
 * Professional grading: accuracy is primary (it's a reasoning test), with a
 * modest speed weighting so a fast, accurate solve scores above a slow one.
 * Stars reflect accuracy only.
 */
export function gradeRaven(correct, trials, meanRtMs = null) {
  const target = Math.ceil(trials * 0.8);
  const won = correct >= target;
  const accuracy = correct / trials;
  const stars = correct === trials ? 3 : won ? 2 : correct >= Math.ceil(trials * 0.5) ? 1 : 0;
  let score = Math.round(100 * accuracy);
  if (meanRtMs != null && correct > 0) {
    // full speed credit ≤2.5s, none ≥8s; speed contributes ≤15% of the score.
    const speed = Math.max(0, Math.min(1, (8000 - meanRtMs) / 5500));
    score = Math.round(100 * accuracy * (0.85 + 0.15 * speed));
  }
  return { won, stars, score, correct, trials, target, meanRtMs };
}
