/*
 * Shared Survival-mode kit — the one place that defines how Survival feels across
 * every training game (Phase 4 of the consistency overhaul):
 *   • a HARD COUNTDOWN that ends the run,
 *   • a difficulty RAMP that rises the longer you last,
 *   • speed-based GRADING (PERFECT / FAST / GOOD) with bonus points.
 */

export const SURVIVAL_MS = 60000; // a Survival run lasts 60s, then ends

/** Elapsed time → ramp in [0,1]; games scale speed / spawn rate by this. */
export function survivalRamp(elapsedMs, ms = SURVIVAL_MS) {
  return Math.max(0, Math.min(1, elapsedMs / ms));
}

/** Classify a reaction time (ms) into a grade. */
export function gradeRT(rt, perfect = 400, fast = 750) {
  return rt <= perfect ? 'perfect' : rt <= fast ? 'fast' : 'good';
}

export const GRADE = {
  perfect: { en: 'PERFECT', ar: 'ممتاز', bonus: 3, color: '#3be086' },
  fast: { en: 'FAST', ar: 'سريع', bonus: 2, color: '#4f9fe0' },
  good: { en: 'GOOD', ar: 'جيد', bonus: 1, color: '#e8ac4e' },
};

/** Thin countdown bar drawn across the top of a canvas play area. */
export function drawSurvivalBar(ctx, W, pct, color) {
  const p = Math.max(0, Math.min(1, pct));
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.fillRect(0, 0, W, 6);
  ctx.fillStyle = p < 0.2 ? '#ff5a5a' : color;
  ctx.fillRect(0, 0, W * p, 6);
}
