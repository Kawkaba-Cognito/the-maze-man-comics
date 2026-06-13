/*
 * COLOUR SORT — mode tuning (free / levels / pass-n-play) + grading.
 *
 * Puzzles are well-mixed random deals (every colour disturbed) verified solvable
 * by BFS, whose depth gives the TRUE optimal `par`. Difficulty = minPar (required
 * optimal length) scaling across levels, plus more colours/sizes/pegs per tier.
 * Configs chosen from a solvability+timing probe (all 100% solvable, gen <20ms).
 *   easy C3 M3 P5   medium C4 M3 P6   hard C4 M4 P6   (2 spare tubes each)
 */
export const CS_DIFF_KEYS = ['easy', 'medium', 'hard'];
export const CS_LEVELS_PER_TIER = 20;

const TIER = {
  easy: { colours: 3, sizes: 3, lo: 6, hi: 12, nodeCap: 80000 },
  medium: { colours: 4, sizes: 3, lo: 9, hi: 15, nodeCap: 120000 },
  hard: { colours: 4, sizes: 4, lo: 14, hi: 26, nodeCap: 220000 },
};
const SPARE = 2;

function minParFor(diff, lv) {
  const tier = TIER[diff] ?? TIER.easy;
  return tier.lo + Math.round((tier.hi - tier.lo) * (lv - 1) / (CS_LEVELS_PER_TIER - 1));
}

export function colourSortLevelSpec(diff, lv) {
  const tier = TIER[diff] ?? TIER.easy;
  return { colours: tier.colours, sizes: tier.sizes, pegs: tier.colours + SPARE, minPar: minParFor(diff, lv), minDisturbed: tier.colours, nodeCap: tier.nodeCap };
}

export function colourSortChallengeSpec(diff) {
  const tier = TIER[diff] ?? TIER.medium;
  const minPar = Math.round((tier.lo + tier.hi) / 2);
  return { colours: tier.colours, sizes: tier.sizes, pegs: tier.colours + SPARE, minPar, minDisturbed: tier.colours, nodeCap: tier.nodeCap };
}

/** Free-mode params from the staircase level (endless ramp through the tiers). */
export function colourSortFreeSpec(level) {
  if (level < 6) return { colours: 3, sizes: 3, pegs: 5, minPar: 6 + level, minDisturbed: 3, nodeCap: 80000 };
  if (level < 12) return { colours: 4, sizes: 3, pegs: 6, minPar: 9 + (level - 6), minDisturbed: 4, nodeCap: 120000 };
  return { colours: 4, sizes: 4, pegs: 6, minPar: 14 + (level - 12) * 2, minDisturbed: 4, nodeCap: 220000 };
}

export function isColourSortLevelUnlocked(diff, lv, done = {}) {
  return lv === 1 || !!done[`${diff}-${lv - 1}`];
}

/** Grade a solved puzzle against its TRUE optimal (par). moves ≥ par always. */
export function gradeColourSort(moves, par, solved) {
  const won = !!solved;
  const stars = won && moves <= par ? 3 : won && moves <= Math.ceil(par * 1.4) ? 2 : won ? 1 : 0;
  const score = won ? Math.max(1, Math.min(100, Math.round((100 * par) / Math.max(1, moves)))) : 0;
  return { won, stars, score, moves, par };
}

/** Pass-n-play score: efficiency vs optimal (100 = optimal solve). */
export function colourSortChallengeScore(moves, par, solved) {
  return solved ? Math.max(1, Math.min(100, Math.round((100 * par) / Math.max(1, moves)))) : 0;
}
