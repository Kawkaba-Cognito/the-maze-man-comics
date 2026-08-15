/*
 * Math Gates level curve — a .js data module so `audit:curves` can gate it.
 *
 * It used to live in index.jsx, which put it on audit-curves' list of six
 * curves that "CANNOT be gated where it sits, because the config lives in a
 * React file". So nothing checked that Hard is genuinely harder than Easy at
 * the same level number, or that each tier climbs monotonically — the exact
 * question raised on 2026-08-15 ("make sure in levels the difficulty is
 * correct, when entering difficult it will get difficult").
 *
 * THE LEVERS, and which direction each moves:
 *   ops     — how many operations can appear (+,- → +,-,× → +,-,×,÷). The
 *             biggest single jump between tiers, and division is the hardest.
 *   gap     — ms between gates. Falls with level, floored so the game never
 *             becomes a pure reaction wall (see audit:pacing for the same
 *             lesson applied to three other games).
 *   lives   — fewer on harder tiers.
 *   target  — gates to clear; rises with level.
 */
export const LEVELS_PER_TIER = 100;

/** Floor for the gate interval, asserted by audit:pacing. */
export const MG_MIN_GAP = 450;

export const BASE = {
  easy: { ops: ['+', '-'], gap: 700, lives: 5, target: 8 },
  med: { ops: ['+', '-', '×'], gap: 650, lives: 4, target: 10 },
  hard: { ops: ['+', '-', '×', '÷'], gap: 600, lives: 3, target: 12 },
};

/*
 * SURVIVAL pace. Reported 2026-08-15 as "make sure in survival the game will
 * get harder" — and it did not.
 *
 * Survival ramped the equation TIER and magnitude by skill (gatesPlayed/36 →
 * survivalTier), but the spawn interval came from a `cfg` computed once, at
 * `dkey = 'easy'`. So `gap` sat at 700ms and `lives` at 5 for the entire run,
 * however far you got: the sums grew, the pressure never did, and the run
 * plateaued into an endless easy rhythm.
 *
 * Pace now ramps on the same skill fraction, floored at MG_MIN_GAP so it never
 * becomes the pure reaction wall audit:pacing exists to prevent.
 */
export const MG_SURVIVAL_GAP_START = 720;

export function survivalGap(f) {
  return Math.max(MG_MIN_GAP, Math.round(MG_SURVIVAL_GAP_START - (f || 0) * 260));
}

export function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  // Front-loaded curve (^0.85): the climb is felt earlier so levels feel more
  // distinct; level 1 and 100 unchanged.
  const f = Math.pow(((level || 1) - 1) / 99, 0.85);
  return {
    ...b,
    gap: Math.max(MG_MIN_GAP, b.gap - f * 180),
    target: b.target + Math.round(f * 10),
    opCount: b.ops.length,
    f,
  };
}
