/* =============================================================================
 * POINTS ECONOMY — one source of truth for how many points a win is worth.
 *
 * Ladder (by difficulty):   easy 5 · 10 · 15 · hardest 20.
 *
 * "Mathematically solid": every win maps to a normalized difficulty d ∈ [0,1],
 * which is quantized into 4 equal bands → the 5/10/15/20 ladder. Monotonic
 * (harder ⇒ never fewer points) and consistent across every game and puzzle.
 * ========================================================================== */

export const POINTS_LADDER = [5, 10, 15, 20];

/** Normalized difficulty 0..1 → ladder value (4 equal bands of 0.25). */
export function pointsForDifficulty01(d) {
  const x = Math.max(0, Math.min(1, Number(d) || 0));
  const band = Math.min(3, Math.floor(x * 4)); // [0,.25)->0 … [.75,1]->3
  return POINTS_LADDER[band];
}

const TIER_INDEX = { easy: 0, medium: 1, hard: 2 };

/**
 * Training level win. Three difficulty tiers (easy/medium/hard) × `levelsPerTier`
 * levels are laid on ONE 0..1 difficulty scale, so the whole journey spans the
 * ladder: easy L1 → 5, and the deepest hard level → 20. Level depth nudges you
 * up within the span, so later levels of a tier are worth more than early ones.
 *
 *   d = (tierIndex + (level-1)/(levelsPerTier-1)) / 3
 */
export function trainingWinPoints(diff, level = 1, levelsPerTier = 100) {
  const tier = TIER_INDEX[String(diff).toLowerCase()] ?? 0;
  const within = levelsPerTier > 1 ? (Math.max(1, level) - 1) / (levelsPerTier - 1) : 0;
  return pointsForDifficulty01((tier + Math.min(1, within)) / 3);
}

/** A win at a NAMED difficulty (no levels): easy/medium/hard/expert → 5/10/15/20. */
export function difficultyNamePoints(name) {
  const map = { easy: 0, medium: 1, hard: 2, expert: 3, evil: 3, master: 3, insane: 3, extreme: 3 };
  return POINTS_LADDER[map[String(name).toLowerCase()] ?? 0];
}

/**
 * Puzzle solve. A puzzle's difficulty ≈ its grid size, so bigger grids pay more.
 * Normalised within THAT puzzle's own size range (`sizes`) so each puzzle uses
 * the full ladder; falls back to an absolute heuristic if no range is given.
 */
export function puzzleWinPoints(size, sizes) {
  if (Array.isArray(sizes) && sizes.length > 1 && typeof size === 'number') {
    const lo = Math.min(...sizes);
    const hi = Math.max(...sizes);
    return pointsForDifficulty01(hi > lo ? (size - lo) / (hi - lo) : 0.5);
  }
  if (typeof size === 'number' && Number.isFinite(size)) {
    return pointsForDifficulty01((size - 4) / (12 - 4));
  }
  return POINTS_LADDER[0];
}
