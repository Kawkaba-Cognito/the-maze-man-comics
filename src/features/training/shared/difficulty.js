/*
 * DIFFICULTY — the one place that turns "level 37 of 100" into a number, and
 * the one place that turns "survival stage 19" into a tier and a level.
 *
 * ── Why this exists ──
 * Fourteen files independently reinvented `(level - 1) / 99`. Seven wrapped it
 * in `Math.pow(f, 0.85)` and seven did not, with no stated rule for which — and
 * `trail-making/index.jsx` does BOTH, twenty-five lines apart (`levelCfg` uses
 * the curve, `boardSpecLevel` does not). That is not a style problem: it means
 * two halves of one game disagree about how fast difficulty should climb, and
 * nobody chose it.
 *
 * ── The rule ──
 * FRONT (0.85) is the default and what a training game should normally use: the
 * climb is felt earlier, so early levels feel distinct instead of interchangeable.
 * LINEAR is legitimate when the underlying lever is already perceptually
 * non-linear (an exponential timer, a log-spaced set size) and the curve would
 * double-count the ramp. Pass it EXPLICITLY and say why at the call site.
 *
 * ⚠ IMPORT THIS WITH AN EXPLICIT .js EXTENSION.
 * Data modules are imported directly by the gate scripts, which run in plain
 * Node — and Node does not do Vite's extensionless resolution. Dropping the
 * extension does not break the app (Vite resolves it) but it breaks every gate
 * that imports that data module, which is exactly the kind of failure that only
 * shows up in CI. Caught immediately here: adding this helper without the
 * extension took validate:keeptrack and validate:mirror down with it.
 *
 * ── Scaling contract ──
 * `levelFraction` returns 0 at level 1 and 1 at the last level, whatever the
 * curve. Games map that fraction onto their own levers, so adding a lever later
 * is a change in the game's data file and never a change here.
 */

/** Named curves. Anything else is a raw exponent and needs a comment. */
export const CURVE = {
  FRONT: 0.85,
  LINEAR: 1,
};

/**
 * Normalised difficulty for a level within its tier.
 *
 * @param {number} level          1-based level number.
 * @param {number} levelsPerTier  how many levels the tier has (usually 100).
 * @param {number} curve          exponent; CURVE.FRONT by default.
 * @returns {number} 0 at the first level, 1 at the last.
 */
export function levelFraction(level, levelsPerTier = 100, curve = CURVE.FRONT) {
  const span = Math.max(1, levelsPerTier - 1);
  const t = Math.min(1, Math.max(0, ((Number(level) || 1) - 1) / span));
  return curve === 1 ? t : Math.pow(t, curve);
}

/**
 * Survival stage → { diff, lv, f }.
 *
 * Survival is one continuous climb across the three tiers: `perTier` stages in
 * each, and within a tier the stage index sweeps level 1 → levelsPerTier so the
 * game can reuse its own level config instead of inventing a second curve.
 *
 * Keep Track and Mirror World had this byte-for-byte identical in two files.
 * Anything else that ramps across tiers should call this rather than copy it.
 */
export function tierStage(stage, {
  tiers = ['easy', 'med', 'hard'],
  perTier = 12,
  levelsPerTier = 100,
  curve = CURVE.FRONT,
} = {}) {
  const s = Math.max(0, Math.floor(Number(stage) || 0));
  const ti = Math.min(tiers.length - 1, Math.floor(s / perTier));
  const within = Math.min(1, Math.max(0, (s - ti * perTier) / perTier));
  const lv = 1 + Math.round(within * (levelsPerTier - 1));
  return { diff: tiers[ti], lv, f: levelFraction(lv, levelsPerTier, curve) };
}

/** Linear interpolation, for mapping a fraction onto a game's own lever. */
export function lerp(a, b, f) {
  return a + (b - a) * f;
}
