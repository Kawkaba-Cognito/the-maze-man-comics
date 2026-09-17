// Auto-extracted from FocusQuest — shapes, pools, level config, scoring
import { GAME_STIMULUS } from './gamePalette.js';

export const SH={
  // DISTINCT (easy)
  circle:    `<circle cx="50" cy="50" r="38" fill="currentColor"/>`,
  square:    `<rect x="12" y="12" width="76" height="76" rx="3" fill="currentColor"/>`,
  triangle:  `<polygon points="50,8 92,90 8,90" fill="currentColor"/>`,
  diamond:   `<polygon points="50,6 94,50 50,94 6,50" fill="currentColor"/>`,
  pentagon:  `<polygon points="50,8 92,36 76,82 24,82 8,36" fill="currentColor"/>`,
  hexagon:   `<polygon points="50,5 90,27 90,73 50,95 10,73 10,27" fill="currentColor"/>`,
  star:      `<polygon points="50,5 61,35 94,35 68,57 79,91 50,70 21,91 32,57 6,35 39,35" fill="currentColor"/>`,
  cross:     `<path d="M35,10 H65 V35 H90 V65 H65 V90 H35 V65 H10 V35 H35 Z" fill="currentColor"/>`,
  heart:     `<path d="M50,80 C20,58 5,38 5,26 A22,22 0 0,1 50,20 A22,22 0 0,1 95,26 C95,38 80,58 50,80Z" fill="currentColor"/>`,
  lightning: `<polygon points="58,5 28,52 52,52 42,95 72,48 48,48" fill="currentColor"/>`,
  // SIMILAR (inter/hard)
  roundsq:   `<rect x="12" y="12" width="76" height="76" rx="22" fill="currentColor"/>`,
  ovalH:     `<ellipse cx="50" cy="50" rx="44" ry="26" fill="currentColor"/>`,
  ovalV:     `<ellipse cx="50" cy="50" rx="26" ry="44" fill="currentColor"/>`,
  triR:      `<polygon points="8,8 92,50 8,92" fill="currentColor"/>`,
  triFlat:   `<polygon points="8,22 92,22 50,78" fill="currentColor"/>`,
  hexTall:   `<polygon points="50,5 76,20 76,80 50,95 24,80 24,20" fill="currentColor"/>`,
  arrowR:    `<polygon points="10,32 60,32 60,12 90,50 60,88 60,68 10,68" fill="currentColor"/>`,
  arrowL:    `<polygon points="90,32 40,32 40,12 10,50 40,88 40,68 90,68" fill="currentColor"/>`,
  /* Inner radius 28 -> 46. The old value drew NOTHING, in every renderer.
   *
   * The chord from (62,12) to (62,88) is 76 units. The outer arc's r=38 makes it
   * exactly a semicircle, and the inner arc asked for r=28 — but 2r=56 < 76, so
   * the SVG spec (F.6.6, correction of out-of-range radii) requires scaling it up
   * until it fits, i.e. to 38. Both arcs then become the same semicircle on the
   * same chord with opposite sweep flags, so the path traces out and back along
   * one curve: zero enclosed area. `moon` was an invisible tile in 19 level pools
   * and any level targeting it was unsolvable.
   *
   * The inner radius must therefore exceed 38; 46 restores the intended crescent.
   * Guarded now by the ink-area check in scripts/audit-focus-quest-levels.mjs. */
  moon:      `<path d="M62,12 A38,38 0 1,0 62,88 A46,46 0 1,1 62,12Z" fill="currentColor"/>`,
  // NEAR-IDENTICAL (xhard/deadly)
  semicircle:`<path d="M10,55 A40,40 0 0,1 90,55 Z" fill="currentColor"/>`,
  rhombus:   `<polygon points="50,8 85,50 50,92 15,50" fill="currentColor"/>`,
  parallelR: `<polygon points="20,80 95,80 80,20 5,20" fill="currentColor"/>`,
  trapezoid: `<polygon points="20,75 80,75 95,25 5,25" fill="currentColor"/>`,
  shield:    `<path d="M50,8 L88,28 L88,55 C88,72 70,85 50,92 C30,85 12,72 12,55 L12,28 Z" fill="currentColor"/>`,
  ovalSq:    `<rect x="8" y="20" width="84" height="60" rx="30" fill="currentColor"/>`,
  // DEADLY-ONLY: shapes that look almost identical at small size
  fatOval:   `<ellipse cx="50" cy="50" rx="42" ry="32" fill="currentColor"/>`,
  thinOval:  `<ellipse cx="50" cy="50" rx="24" ry="42" fill="currentColor"/>`,
  almostCircle:`<ellipse cx="50" cy="50" rx="38" ry="35" fill="currentColor"/>`,
  wideRect:  `<rect x="6" y="24" width="88" height="52" rx="4" fill="currentColor"/>`,
  tallRect:  `<rect x="24" y="6" width="52" height="88" rx="4" fill="currentColor"/>`,
  bigSemi:   `<path d="M8,52 A42,42 0 0,1 92,52 Z" fill="currentColor"/>`,
  /* Same defect as `moon` (chord 72, inner r=26 scaled up to 36, zero area) and
   * the same fix. 44 rather than 46 keeps the ORIGINAL relationship between the
   * two: this shape lives in the deadly-only band, where it is supposed to look
   * almost identical to `moon` at small size. Measured, they now fill 28.5% and
   * 30.2% — still a near-twin, which is the point. Making it obviously thinner
   * would have quietly made the deadly tier easier. */
  tinyMoon:  `<path d="M60,14 A36,36 0 1,0 60,86 A44,44 0 1,1 60,14Z" fill="currentColor"/>`,
  fatDiamond:`<polygon points="50,14 88,50 50,86 12,50" fill="currentColor"/>`,
};

// ══════════════════════════════════════════
// LEVEL SYSTEM
// ══════════════════════════════════════════
export const DM={
  easy:  {label:'Easy',        lvc:'lve', col:'#7ab87a', grid:5,  bt:90,  ts:1.4, pop:'~90% of people'},
  medium:{label:'Medium',      lvc:'lvi', col:'#7ab8c4', grid:7,  bt:75,  ts:1.25, pop:'Top 50%'},
  hard:  {label:'Hard',        lvc:'lvh', col:'#e8c47a', grid:9,  bt:60,  ts:1.0, pop:'Top 20%'},
};

export const FQ_LEVELS_PER_TIER = 100;
export const FQ_DIFF_KEYS = ['easy', 'medium', 'hard'];

// These engine silhouettes remain available to shared renderers, but they are
// deliberately excluded from every Cancellation board. `lightning` maps to the
// multicolour nebula-bolt / solar-flare illustrations the product has retired.
export const RETIRED_CANCELLATION_SHAPES = Object.freeze(['lightning', 'bigSemi']);

// Shape pools — increasingly similar within each mode
export const SP={
  easy:[
    ['triangle','circle','diamond','square'],
    ['ovalH','rhombus','square','star','tinyMoon'],
    ['fatDiamond','square','star','moon','heart'],
    ['square','star','tinyMoon','heart','cross'],
    ['star','moon','heart','cross','pentagon'],
    ['tinyMoon','heart','cross','pentagon','ovalSq','hexTall'],
    ['heart','cross','pentagon','roundsq','hexagon','arrowR'],
    ['cross','pentagon','ovalSq','hexTall','arrowL','circle'],
    ['pentagon','roundsq','hexagon','arrowR','circle','parallelR','tallRect'],
    ['ovalSq','hexTall','arrowL','circle','wideRect','tallRect','shield'],
    ['hexagon','arrowR','circle','parallelR','tallRect','shield','trapezoid'],
    ['arrowL','star','wideRect','tallRect','shield','trapezoid','triFlat','semicircle'],
    ['star','parallelR','tallRect','shield','trapezoid','triangle','fatOval'],
    ['wideRect','tallRect','shield','trapezoid','triR','thinOval','rhombus','square'],
    ['tallRect','shield','trapezoid','triFlat','almostCircle','fatDiamond','square','star'],
    ['shield','trapezoid','triangle','hexagon','diamond','square','star','tinyMoon','heart'],
    ['trapezoid','triR','circle','rhombus','square','star','moon','heart','cross'],
    ['triFlat','ovalH','fatDiamond','square','star','tinyMoon','heart','cross','pentagon','ovalSq'],
    ['ovalV','diamond','square','star','moon','heart','cross','pentagon','roundsq','hexagon'],
    ['rhombus','square','star','tinyMoon','heart','cross','pentagon','ovalSq','hexTall','arrowL','trapezoid'],
  ],
  medium:[
    ['square','star','moon','heart','cross'],
    ['star','tinyMoon','heart','cross','pentagon'],
    ['moon','heart','cross','pentagon','roundsq'],
    ['heart','cross','pentagon','ovalSq','hexTall'],
    ['cross','pentagon','roundsq','hexagon','arrowR'],
    ['pentagon','ovalSq','hexTall','arrowL','circle'],
    ['roundsq','hexagon','arrowR','circle','parallelR'],
    ['hexTall','arrowL','circle','wideRect','tallRect'],
    ['arrowR','circle','parallelR','tallRect','shield'],
    ['circle','wideRect','tallRect','shield','trapezoid'],
    ['parallelR','tallRect','shield','trapezoid','triangle'],
    ['tallRect','shield','trapezoid','triR','hexagon'],
    ['shield','trapezoid','triFlat','circle','fatDiamond','square'],
    ['trapezoid','triangle','ovalH','diamond','square','star'],
    ['triR','ovalV','rhombus','square','star','moon'],
    ['semicircle','fatDiamond','square','star','tinyMoon','heart'],
    ['diamond','square','star','moon','heart','cross','pentagon'],
    ['square','star','tinyMoon','heart','cross','pentagon','ovalSq'],
    ['star','moon','heart','cross','pentagon','roundsq','hexagon'],
    ['tinyMoon','heart','cross','pentagon','ovalSq','hexTall','arrowL'],
  ],
  hard:[
    ['heart','cross','pentagon','roundsq'],
    ['cross','pentagon','ovalSq','hexTall'],
    ['pentagon','roundsq','hexagon','arrowR'],
    ['ovalSq','hexTall','arrowL','circle'],
    ['hexagon','arrowR','circle','parallelR'],
    ['arrowL','circle','wideRect','tallRect'],
    ['circle','parallelR','tallRect','shield'],
    ['wideRect','tallRect','shield','trapezoid'],
    ['tallRect','shield','trapezoid','triangle','circle'],
    ['shield','trapezoid','triR','ovalH','rhombus'],
    ['trapezoid','triFlat','ovalV','fatDiamond','square'],
    ['triangle','semicircle','diamond','square','star','tinyMoon'],
    ['fatOval','rhombus','square','star','moon','heart'],
    ['fatDiamond','square','star','tinyMoon','heart'],
    ['square','star','moon','heart','cross','pentagon','roundsq'],
    ['star','tinyMoon','heart','cross','pentagon','ovalSq','hexTall'],
    ['moon','heart','cross','pentagon','roundsq','hexagon'],
    ['heart','cross','pentagon','ovalSq','hexTall','arrowL','circle','wideRect'],
    ['cross','pentagon','roundsq','hexagon','arrowR','circle','parallelR','tallRect'],
    ['pentagon','ovalSq','hexTall','arrowL','circle','wideRect','tallRect'],
  ],
  xhard:[
    ['roundsq','hexagon','arrowR','circle'],
    ['hexTall','arrowL','circle','wideRect'],
    ['arrowR','circle','parallelR','tallRect'],
    ['circle','wideRect','tallRect','shield'],
    ['parallelR','tallRect','shield','trapezoid'],
    ['tallRect','shield','trapezoid','triFlat'],
    ['shield','trapezoid','triangle','ovalV','diamond'],
    ['trapezoid','triR','semicircle','rhombus','square'],
    ['triFlat','fatOval','fatDiamond','square','star'],
    ['thinOval','diamond','square','star','tinyMoon'],
    ['rhombus','square','star','moon','heart','cross'],
    ['square','star','tinyMoon','heart','cross','pentagon'],
    ['star','moon','heart','cross','pentagon','roundsq','hexagon'],
    ['tinyMoon','heart','cross','pentagon','ovalSq','hexTall','arrowL'],
    ['heart','cross','pentagon','roundsq','hexagon','arrowR','circle'],
    ['cross','pentagon','ovalSq','hexTall','arrowL'],
    ['pentagon','roundsq','hexagon','arrowR','circle'],
    ['ovalSq','hexTall','arrowL','circle','wideRect'],
    ['hexagon','arrowR','circle','parallelR','tallRect','shield'],
    ['arrowL','circle','wideRect','tallRect','shield'],
  ],
  deadly:[
    ['circle','parallelR','tallRect','shield'],
    ['wideRect','tallRect','shield','trapezoid'],
    ['tallRect','shield','trapezoid','triR'],
    ['shield','trapezoid','triFlat','semicircle'],
    ['trapezoid','triangle','fatOval','diamond'],
    ['triR','thinOval','rhombus','square','star'],
    ['almostCircle','fatDiamond','square','star','moon'],
    ['diamond','square','star','tinyMoon','heart'],
    ['square','star','moon','heart','cross'],
    ['star','tinyMoon','heart','cross','pentagon'],
    ['moon','heart','cross','pentagon','roundsq'],
    ['heart','cross','pentagon','ovalSq','hexTall','arrowL'],
    ['cross','pentagon','roundsq','hexagon','arrowR','circle'],
    ['pentagon','ovalSq','hexTall','arrowL','circle','wideRect'],
    ['roundsq','hexagon','arrowR','circle','parallelR'],
    ['hexTall','arrowL','circle','wideRect','tallRect','shield'],
    ['arrowR','circle','parallelR','tallRect','shield','trapezoid','triangle'],
    ['star','wideRect','tallRect','shield','trapezoid','triR','ovalH'],
    ['parallelR','tallRect','shield','trapezoid','triFlat','ovalV','fatDiamond'],
    ['tallRect','shield','trapezoid','triangle','semicircle','diamond','square','star'],
  ],
};

// Colour-vision-deficiency-safe categorical palette (Okabe-Ito subset: blue,
// orange, bluish-green, reddish-purple). These four stay distinguishable under
// protanopia/deuteranopia/tritanopia and are widely separated in CIELAB, so the
// conjunction (hard/identity) tier can bind shape × colour reliably. The old
// "medium" palette was four near-identical blues — colour was almost useless as
// a feature there. Same set across tiers; difficulty comes from shape similarity
// + interference, not from how confusable the base colours are.
//
// Now re-exported from gamePalette (as GAME_STIMULUS) so the platform has one
// colour source of truth. It lives there with the measurements showing why this
// set is NOT toned into the game palette's key like everything else.
export const CVD_SAFE_PALETTE = GAME_STIMULUS;
export const PAL = {
  easy: CVD_SAFE_PALETTE,
  medium: CVD_SAFE_PALETTE,
  hard: CVD_SAFE_PALETTE,
};

// =============================================================================
// Level mathematics — empirically grounded against the visual-search literature.
// -----------------------------------------------------------------------------
// References:
//   Treisman & Gelade (1980) — Feature Integration Theory: feature/pop-out search
//     is parallel (slope ≈ 0 ms/item); conjunction search is serial.
//   Wolfe (1989) Guided Search; Palmer et al. (2011) — conjunction search slope
//     ≈ 20–30 ms/item for target-present; baseline (decision+motor) ≈ 400–600 ms.
//   Mesulam Symbol Cancellation (Uttl & Pilkenton-Taylor 2001) — healthy young
//     adults cross out ~1.06 targets/s on a feature cancellation task.
//   Duncan & Humphreys (1989) — search efficiency falls with target–distractor
//     similarity; the colour-interference ramp models this for hard+ tiers.
//
// Per-level time T(diff, L) = expertTargetSec(diff) × TC[diff][L] × headroom(L),
// with headroom falling logistically from 2.8–4.5× at L1 to 1.35× at L100. See
// the block above sigmoidTime for why it is budgeted per TARGET and not per
// level, and what the total-seconds curve it replaced got wrong.
//
// Target counts and colour interference are unchanged in shape — both are
// already principled — but capped against the grid for safety.
// =============================================================================

/*
 * ⚠ THE CLOCK IS BUDGETED PER TARGET, NOT PER LEVEL. (rewritten 2026-08-09)
 *
 * It used to be a total-seconds curve — `TIER_TIME_ENDPOINTS` interpolated by a
 * logistic in L, then multiplied AGAIN by a per-tier `TIER_TIME_MULT` of
 * 0.8/0.72/0.62. Both were described as tightenings of an already-expert floor,
 * and stacking them produced levels that could not be finished by anyone:
 *
 *     hard L100 · 26 targets · 11 s granted · 44.5 s at expert pace  (0.25×)
 *     medium L75 · 14 targets ·  8 s granted · 13.9 s at expert pace (0.58×)
 *
 * Medium went impossible at L52, Hard at L33, and Survival — which walks the
 * same curriculum on ONE life — hit the wall at round 8 for every player alive.
 * The player's report was "I cancel all the shapes and still I don't win",
 * which was literally true.
 *
 * The structural fault, and the reason a total-seconds curve cannot be patched:
 * target count RISES with level while total time FALLS, so seconds-per-target
 * collapses from both ends at once. And the audit enforced exactly that shape
 * ("time must not increase"), so it certified the curve while it was
 * unwinnable. Difficulty has to be expressed as time PER TARGET; total time is
 * then whatever that budget times the target count comes to, and it is allowed
 * to rise when a level adds targets.
 */

/**
 * Expert search time per target, in seconds:
 *   700 ms baseline (Mesulam: healthy adults cancel ≈1.06 targets/s)
 *   + slope × (set size / 2)
 * Slope is 0 ms/item for a pure feature search and 12 ms/item once distractors
 * share the target's hue, so the target no longer pops out (Wolfe, Guided
 * Search; Duncan & Humphreys 1989 on distractor heterogeneity). Conjunction's
 * 25 ms/item is gone along with the conjunction itself — see
 * buildCellsFromParams.
 */
const SEARCH_SLOPE_MS = { easy: 0, medium: 12, hard: 12 };

export function expertTargetSecForSetSize(diff, setSize) {
  return (700 + (SEARCH_SLOPE_MS[diff] ?? 0) * (Math.max(1, setSize) / 2)) / 1000;
}

export function expertTargetSec(diff) {
  const grid = (DM[diff] ?? DM.easy).grid;
  return expertTargetSecForSetSize(diff, grid * grid);
}

/**
 * Clock headroom over expert pace: generous while the player is learning the
 * tier, tight at the top of it — but never below 1, because below 1 the level
 * is not hard, it is broken. L1 differs per tier because a beginner on a 5×5 is
 * further from expert pace than a practised player arriving at a 9×9.
 */
const TIME_HEADROOM = {
  easy:   { L1: 4.5, L100: 1.35 },
  medium: { L1: 3.2, L100: 1.35 },
  hard:   { L1: 2.8, L100: 1.35 },
};

/** Logistic steepness across the curriculum. */
const LEVEL_LOGISTIC_K = 0.35;
/** 1-based level where the logistic crosses its mid-point. */
const LEVEL_LOGISTIC_MID = 50.5;
/** Hard floor — no round is ever shorter than this, however few targets it has. */
export const ABSOLUTE_TIME_FLOOR_SEC = 8;

/** Sigmoid weight at 1-based level (1.0 at L≪Lmid, 0 at L≫Lmid). */
function levelSigmoid(level1Based) {
  return 1 / (1 + Math.exp(LEVEL_LOGISTIC_K * (level1Based - LEVEL_LOGISTIC_MID)));
}

/** Granted-over-expert multiplier for this level. Strictly decreasing in L. */
export function timeHeadroom(diff, li) {
  const h = TIME_HEADROOM[diff] ?? TIME_HEADROOM.easy;
  return h.L100 + (h.L1 - h.L100) * levelSigmoid(li + 1);
}

/**
 * Target-count curve per tier: endpoints (n0,n1) and gamma>0 (gamma>1 → easier early).
 *
 * Targets must stay a sparse MINORITY of the array — a cancellation / visual-search
 * task is "find the rare target among many distractors". Classic norms keep the
 * target:item ratio low (Mesulam ≈ 17%); when targets approach half the board it
 * stops being a search (you'd tap almost everything) and the set-size/density
 * confound dominates. So counts are bounded to ≈14%→≈32% of the grid; real
 * difficulty comes from set size, conjunction strength, colour interference and
 * the time limit — NOT from flooding the board with targets.
 *   easy   (5×5=25): 4→8     medium (7×7=49): 7→16     hard (9×9=81): 11→26
 */
export const TARGET_CURVE = {
  easy:  { n0: 4,  n1: 8,  gamma: 1.0 },
  medium:{ n0: 7,  n1: 16, gamma: 1.0 },
  hard:  { n0: 11, n1: 26, gamma: 1.04 },
};

/** Minimum non-target cells to keep (visual variety + generator stability). */
const MIN_NON_TARGET_CELLS = 3;

function buildMonotonicTargetSeries(diff) {
  const p = TARGET_CURVE[diff];
  const grid = DM[diff].grid;
  // Keep targets a clear minority: never exceed ~1/3 of the array (search, not
  // "tap everything"), and always leave a few distractors for visual variety.
  const propCap = Math.floor(grid * grid * 0.34);
  const cap = Math.min(p.n1, propCap, grid * grid - MIN_NON_TARGET_CELLS);
  const arr = [];
  for (let li = 0; li < FQ_LEVELS_PER_TIER; li++) {
    const u = li / (FQ_LEVELS_PER_TIER - 1);
    const raw = p.n0 + (p.n1 - p.n0) * Math.pow(u, p.gamma);
    let tc = Math.round(raw);
    tc = Math.max(p.n0, Math.min(p.n1, tc));
    tc = Math.min(cap, Math.max(3, tc));
    arr.push(tc);
  }
  for (let i = 1; i < FQ_LEVELS_PER_TIER; i++) {
    if (arr[i] < arr[i - 1]) arr[i] = arr[i - 1];
  }
  for (let i = 0; i < FQ_LEVELS_PER_TIER; i++) {
    arr[i] = Math.min(arr[i], cap);
  }
  return arr;
}

/** Integer target counts per level index 0..19; monotone within each difficulty. */
export const TC = Object.fromEntries(
  Object.keys(DM).map((d) => [d, buildMonotonicTargetSeries(d)]),
);

/**
 * Per-level time limit (seconds) = expert time for this board's target count,
 * times the level's headroom. The AUDIT INVARIANT is that time-per-target is
 * non-increasing and never drops below expert pace — not that total time falls,
 * which is what made the tiers unwinnable.
 */
export function sigmoidTime(diff, li) {
  const tc = (TC[diff] ?? TC.easy)[li] ?? 3;
  const t = expertTargetSec(diff) * tc * timeHeadroom(diff, li);
  return +Math.max(ABSOLUTE_TIME_FLOOR_SEC, t).toFixed(1);
}

/**
 * Colour-noise on distractors [0,1]. Deadly uses a slower ramp so early deadly stays scannable.
 * Standard: I = min(1, max(0, (li - 4) / 10))
 * Deadly:   I = min(1, max(0, (li - 5) / 11))
 */
export function computeFeatureInterference(li, diff) {
  // Interference (distractors sharing the target's hue) is what turns a lazy
  // pop-out scan into a real selective-attention task. It used to switch on only
  // past level ~26–31, so most of the curriculum was pure feature search. Start
  // it early and ramp it harder so Medium/Hard demand discrimination throughout.
  if (diff === 'hard') {
    return +Math.min(1.0, Math.max(0, (li - 5) / 45)).toFixed(2);
  }
  if (diff === 'medium') {
    return +Math.min(0.6, Math.max(0, (li - 7) / 75)).toFixed(2);
  }
  return 0;
}

/**
 * Conjunction strength — now always 0. Retired 2026-08-09; see the note on
 * buildCellsFromParams for why. Kept as an export so the difficulty models and
 * the audit keep one honest name for "no board duplicates the target object",
 * rather than each re-deriving a zero.
 */
export function computeConjunctionStrength() {
  return 0;
}

/** One row for tooling / UI: reproducible description of level parameters. */
export function getLevelDifficultyModel(diff, li) {
  const m = DM[diff];
  const level = li + 1;
  const { pool } = getLvCfg(diff, li);
  const area = m.grid * m.grid;
  const tc = TC[diff][li];
  const interference = computeFeatureInterference(li, diff);
  const search = 'featureSingleton';
  return {
    difficulty: diff,
    levelIndex0Based: li,
    levelIndex1Based: level,
    gridSide: m.grid,
    displaySetSize: area,
    targetCount: tc,
    timeLimitSec: sigmoidTime(diff, li),
    featureInterference: interference,
    distractorPoolSize: pool.length,
    searchMode: search,
    /** Ordinal load index (not RT in ms): larger ⇒ nominally harder within app. */
    nominalLoadIndex: area * pool.length * tc * (1 + interference),
  };
}

/**
 * Retired 2026-08-09, kept at 1 so nothing silently re-tightens the clock.
 *
 * This was a second, independent tightening applied on top of endpoints that
 * were already documented as an expert floor — 0.62 on hard turned a 17 s
 * budget into 11 s for a 44.5 s job. Tier tightness now lives in ONE place, the
 * headroom curve above, where it can be read against the expert model it is a
 * multiple of.
 */
export const TIER_TIME_MULT = { easy: 1, medium: 1, hard: 1 };

/**
 * Shape pool for a level. The HARD tier ramps target–distractor SHAPE similarity
 * (Duncan & Humphreys 1989 — the dominant driver of search difficulty).
 *
 * It used to walk SP.hard → SP.xhard → SP.deadly as three similarity tiers,
 * from distinguishable curves to near-identical ones. That grading is gone:
 * every pool is motif-distinct now (an illustration's difference lives in
 * interior detail, which peripheral vision cannot resolve — see shapeArt), so
 * what those lists actually differ in is how MANY object types they hold. They
 * are therefore walked as one sequence ordered by that; see POOL_SEQUENCE.
 */
/*
 * The pool sequence a tier walks, ordered by OBJECT VARIETY.
 *
 * Sorted by size, and that is the fix, not a tidy-up. These lists were authored
 * in order of silhouette similarity, which stopped meaning anything when the
 * pools were rebuilt motif-distinct — so their sizes ended up bouncing (hard
 * ran 7 object types at L60, 5 at L73, 7 again at L87). Distractor
 * heterogeneity is a real difficulty lever (Duncan & Humphreys 1989), so a
 * board with fewer object types than the one before it is a difficulty DROP
 * mid-tier. Survival walks these levels on one life and hit that dip at round
 * 12; audit:fq now fails on it.
 *
 * Hard draws from all three of its lists as ONE sequence: sorting each list
 * separately would just move the bounce to the list boundaries (…8 objects,
 * then back to 4). Every pool is unchanged — only their order is.
 */
const bySize = (lists) => lists.flat().slice().sort((a, b) => a.length - b.length);
const POOL_SEQUENCE = {
  easy: bySize([SP.easy]),
  medium: bySize([SP.medium]),
  hard: bySize([SP.hard, SP.xhard, SP.deadly]),
};

function poolForLevel(diff, li) {
  const list = POOL_SEQUENCE[diff] || POOL_SEQUENCE.easy;
  const idx = Math.floor((li * list.length) / FQ_LEVELS_PER_TIER);
  return list[Math.max(0, Math.min(list.length - 1, idx))];
}

/*
 * ── THE LADDER ──
 *
 * ONE climb of 60 levels, in six bands of ten. Replaced easy/med/hard on
 * 2026-08-28 — see LADDER-PLAN.md.
 *
 * ⚠ THIS LADDER IS A PATH THROUGH THE AUTHORED CURRICULUM, NOT A REWRITE OF IT.
 *
 * Cancellation's difficulty is not a handful of knobs — it is `TC[diff]`, a
 * hand-built monotonic target series per tier, plus a pool, a sigmoid time
 * curve, feature interference and conjunction strength, all keyed by tier. Every
 * one of those 300 authored points is validated by `audit:fq`, which asserts the
 * time granted actually covers the expert search model. Re-authoring them as one
 * span would have thrown that away and re-opened the exact bug audit:fq exists
 * for: a curve whose shape looked right granting 11 seconds for 44.5 seconds of
 * work.
 *
 * So the ladder WALKS the existing curriculum instead: each ladder level maps to
 * an authored (tier, level) that is already gated. Two bands per tier, each
 * sweeping half of that tier's hundred levels. Nothing about the content moved,
 * and audit:fq still covers every point the ladder can reach.
 */
export const FQ_LADDER = [
  /* L1–10  */ { diff: 'easy', half: 0, adds: ['scan'] },
  /* L11–20 */ { diff: 'easy', half: 1, adds: ['switch'] },
  /* ⚠ 'medium', not 'med' — this game's tier keys are easy/medium/hard while
     most others use easy/med/hard. Getting it wrong makes TC[diff] undefined
     and every level of these two bands throws. audit:curves caught exactly
     that on the first run. */
  /* L21-30 */ { diff: 'medium', half: 0, adds: ['dual'] },
  /* L31–40 */ { diff: 'medium', half: 1, adds: ['forbidden'] },
  /* L41–50 */ { diff: 'hard', half: 0, adds: ['lookalikes'] },
  /* L51–60 */ { diff: 'hard', half: 1, adds: ['drift'] },
];

/*
 * ── THE SIX WORLDS ──────────────────────────────────────────────────────────
 *
 * Each band of ten is a place, and each place brings ONE new rule (owner,
 * 2026-09-13: "each section is a planet, and it has its own colours, and every
 * new section has a new feature, and when a new feature appears the tutorial
 * will happen").
 *
 * ⚠ THE THREE NEW RULES WERE CHOSEN AGAINST `audit:fq`, NOT AGAINST TASTE.
 * That gate asserts the time a level grants actually covers the expert search
 * model — it exists because this game once shipped a hard tier granting 11
 * seconds for 44.5 seconds of work. So a new rule may not make the SEARCH
 * slower unless it also buys time back:
 *
 *   switch     the target changes between sets. Costs nothing per item — it is
 *              a set-level task switch, which is the construct (set shifting),
 *              and the search inside a set is exactly as modelled.
 *   forbidden  one object must be LEFT ALONE. Adds no search time; it converts
 *              some of the field into no-go items, which is response
 *              inhibition — the same measure Intercept takes, so the platform
 *              already has the vocabulary for it.
 *   drift      the field moves. This one DOES slow search, so it is the only
 *              rule that carries a time multiplier (`timeMult`), applied where
 *              the round is built so the gate sees the granted time.
 *
 * `stars` is not in here on purpose: a star is earned from what the run
 * measured, not from which world it happened in.
 */
export const FQ_SECTIONS = [
  {
    id: 'ember', mech: 'scan', sigil: 'star',
    en: 'Ember Reach', ar: 'مرتفعات الجمر',
    enSub: 'Where the hunt begins', arSub: 'حيث يبدأ البحث',
  },
  {
    id: 'dust', mech: 'switch', sigil: 'comet',
    en: 'The Dust Sea', ar: 'بحر الغبار',
    enSub: 'The quarry changes', arSub: 'الهدف يتغيّر',
  },
  {
    id: 'frost', mech: 'dual', sigil: 'meteor-cluster',
    en: 'Frost Hollow', ar: 'جوف الصقيع',
    enSub: 'A fuller field', arSub: 'حقل أكثف',
  },
  {
    id: 'tempest', mech: 'forbidden', sigil: 'nebula-bolt',
    en: 'The Tempest', ar: 'العاصفة',
    enSub: 'Something to leave alone', arSub: 'شيء لا يُلمس',
  },
  {
    id: 'verdant', mech: 'lookalikes', sigil: 'warp-gate',
    en: 'Verdant Drift', ar: 'الانجراف الأخضر',
    enSub: 'Near-twins everywhere', arSub: 'أشباه في كل مكان',
  },
  {
    id: 'void', mech: 'drift', sigil: 'supernova',
    en: 'The Long Void', ar: 'الفراغ الطويل',
    enSub: 'Nothing holds still', arSub: 'لا شيء يثبت',
  },
];

/** Ladder level (1-based) → its section. Every level belongs to exactly one. */
export function fqSectionOf(lv) {
  const n = Math.min(FQ_LADDER_LEVELS, Math.max(1, Math.round(Number(lv) || 1)));
  return FQ_SECTIONS[Math.min(FQ_SECTIONS.length - 1, Math.floor((n - 1) / 10))];
}
/** 0-based index of a level inside its own section. */
export const fqIndexInSection = (lv) =>
  (Math.min(FQ_LADDER_LEVELS, Math.max(1, Math.round(Number(lv) || 1))) - 1) % 10;

/**
 * Sets per level — the level gets longer as the ladder climbs (owner: "each
 * level will be longer and has multiple sets"). It was a flat three.
 *
 * ⚠ EACH SET IS A WHOLE BOARD WITH ITS OWN TIME BUDGET, which is what keeps
 * audit:fq true: feasibility is a per-board property, so lengthening a LEVEL
 * by adding boards never makes any single board unclearable. Raising the time
 * per board would have been the unsafe way to do the same thing.
 */
/*
 * ⚠ DOUBLED, BAND BY BAND (2026-09-17, owner: "make each level way longer").
 * It ran 2 / 3 / 3 / 4 / 4 / 4, so a level in the last world was four boards
 * and the whole ladder only ever varied by two — "longer" was barely a lever
 * at all. Now 3 / 4 / 5 / 6 / 7 / 8, which also makes the length itself part
 * of the climb: the last world asks you to hold the rule together across
 * nearly three times as many boards as the first.
 *
 * ⚠ THIS IS THE SAFE AXIS AND THAT IS WHY IT IS THE ONE PUSHED HARDEST.
 * Feasibility is a PER-BOARD property — each set is a whole board with its own
 * clock — so adding boards can never make any single board unclearable, and
 * `audit:fq` stays true by construction. Buying difficulty by shortening the
 * per-board clock instead is the move that once shipped 11 seconds for 44.5
 * seconds of work.
 */
export function fqSetsForLevel(lv) {
  const s = Math.floor((Math.min(FQ_LADDER_LEVELS, Math.max(1, Math.round(Number(lv) || 1))) - 1) / 10);
  return Math.min(8, 3 + Math.max(0, s));
}

/** Every rule live at a given ladder level — a world keeps what it was taught. */
export function fqMechanicsAt(lv) {
  const upto = Math.floor((Math.min(FQ_LADDER_LEVELS, Math.max(1, Math.round(Number(lv) || 1))) - 1) / 10);
  const set = new Set();
  for (let i = 0; i <= upto; i += 1) (FQ_LADDER[i]?.adds || []).forEach((m) => set.add(m));
  return set;
}

/** Drift is the one rule that slows the search, so it is the one that pays. */
export const FQ_DRIFT_TIME_MULT = 1.12;

/**
 * Dual target: two shapes to hold instead of one. Every item on the board has
 * to be rejected against two templates rather than one, so the search is slower
 * per item even though the board is no fuller and the target count is unchanged.
 * 1.15 is the same order as drift's compensation and is applied the same way —
 * at build time, so the gate reads the clock the player is actually given.
 */
export const FQ_DUAL_TIME_MULT = 1.15;

export const FQ_LADDER_LEVELS = FQ_LADDER.length * 10; // 60

export const FQ_MECHANIC_LABELS = {
  scan: { en: 'Find every target', ar: 'جد كل الأهداف' },
  switch: { en: 'The target changes each set', ar: 'الهدف يتغيّر كل جولة' },
  denser: { en: 'A denser board', ar: 'لوحة أكثف' },
  dual: { en: 'Two shapes to find', ar: 'شكلان تبحث عنهما' },
  forbidden: { en: 'One object is off limits', ar: 'شيء واحد ممنوع لمسه' },
  lookalikes: { en: 'Look-alike distractors', ar: 'مشتّتات متشابهة' },
  drift: { en: 'The field drifts', ar: 'الحقل ينجرف' },
};

/*
 * What each rule teaches, in the player's words and then in the honest one.
 * ⚠ `why` states the construct WITHOUT promising a life outcome — this text is
 * read by the review board's scientific-claims standard, which greps user
 * facing strings. "Practice at holding a rule" is a claim about this task;
 * "improves your focus at work" would not be.
 */
export const FQ_MECHANIC_TEACH = {
  scan: {
    en: { what: 'Clear every tile showing the target object.', why: 'This is visual search: one object among many, found by sweeping the field.' },
    ar: { what: 'امسح كل مربع يحمل الشكل المطلوب.', why: 'هذا بحث بصري: شكل واحد بين كثير، يُوجد بمسح الحقل.' },
  },
  switch: {
    en: { what: 'Each set hunts a different object. Check the cue before you start.', why: 'Dropping the old rule and taking up a new one is set shifting — the cost shows up on the first few taps after a change.' },
    ar: { what: 'كل جولة لها شكل مختلف. انظر إلى البطاقة قبل البدء.', why: 'ترك قاعدة وأخذ أخرى هو تحويل المجموعة — وتظهر كلفته في أول نقرات بعد التغيير.' },
  },
  denser: {
    en: { what: 'More objects on the board, same job.', why: 'Crowding is the lever: search slows with the number of things that must be rejected.' },
    ar: { what: 'أشياء أكثر على اللوحة، والمهمة نفسها.', why: 'الازدحام هو العامل: يبطؤ البحث بعدد ما يجب رفضه.' },
  },
  /*
   * ⚠ `denser` ABOVE IS NO LONGER A BAND'S NAMED RULE, and is deliberately
   * kept. The board still grows from this world on — that comes from the tier
   * the ladder walks, not from the rule — so the text stays true and stays
   * reachable if a future band wants to name it. What changed is that "a bigger
   * board" was the only thing this world introduced, and a bigger board is a
   * knob, not something new to DO. `dual` is.
   */
  dual: {
    en: { what: 'Two shapes count now. Find both, and clear every one of each.', why: 'Holding two templates at once is harder than holding one: every object on the board has to be checked against both before it can be rejected.' },
    ar: { what: 'شكلان يُحتسبان الآن. جدهما معاً، وامسح كل واحد منهما.', why: 'حمل قالبين معاً أصعب من حمل واحد: كل شيء على اللوحة صار يُقارن بهما معاً قبل أن يُرفض.' },
  },
  forbidden: {
    en: { what: 'One object is off limits. Find the targets and leave it alone.', why: 'Not acting is its own skill — holding back a tap you have already started is response inhibition.' },
    ar: { what: 'شيء واحد ممنوع. جد الأهداف واتركه.', why: 'الامتناع مهارة بذاته — كبح نقرة بدأت بالفعل هو كبح الاستجابة.' },
  },
  lookalikes: {
    en: { what: 'The distractors now share features with the target.', why: 'The more a distractor resembles the target, the closer you must look at each one.' },
    ar: { what: 'صارت المشتّتات تشبه الهدف في بعض ملامحه.', why: 'كلما أشبه المشتّت الهدف، لزمك نظر أدق في كل واحد.' },
  },
  drift: {
    en: { what: 'The field drifts while you work. You get a little more time for it.', why: 'A moving field stops you relying on where things were — search has to keep updating.' },
    ar: { what: 'ينجرف الحقل أثناء عملك، ولك وقت أطول قليلاً.', why: 'الحقل المتحرك يمنعك من الاعتماد على مواضع الأشياء — فيبقى البحث يتحدّث.' },
  },
};

/** Ladder level → the authored (tier, level) it plays. */
export function ladderToTier(lv) {
  const n = Math.min(FQ_LADDER_LEVELS, Math.max(1, Math.round(Number(lv) || 1)));
  const b = FQ_LADDER[Math.min(FQ_LADDER.length - 1, Math.floor((n - 1) / 10))];
  const within = (n - 1) % 10;
  return { diff: b.diff, li: b.half * 50 + Math.round((within / 9) * 49) + 1 };
}

/*
 * ══ THE LADDER'S OWN DIFFICULTY ENVELOPE (2026-09-17) ══════════════════════
 *
 * Owner: "this game is not really challenging attention … fix the difficulty
 * system." Measured across all 60 ladder levels before changing anything, and
 * the report was exactly right for two reasons neither of which is taste.
 *
 * ⚠ 1. THE CLOCK'S GENEROSITY RESET TWICE, SO THE CLIMB SAWTOOTHED.
 * `TIME_HEADROOM` is authored PER TIER — 4.5× expert pace at that tier's L1
 * falling to 1.35× at its L100 — and this ladder WALKS three tiers end to end
 * (easy 1-100, medium 1-100, hard 1-100). Nobody re-derived the headroom for
 * the concatenated path when the ladder replaced the tiers on 2026-08-28, so
 * the multiple over expert pace actually ran:
 *
 *     L1  4.64×  →  L20 1.43×   then RESET
 *     L21 3.16×  →  L40 1.38×   then RESET
 *     L41 2.84×  →  L60 1.36×
 *
 * So level 21 handed back more than twice the slack level 20 had, and the
 * tightest level on the entire sixty-level ladder was **level 12**. Level 60
 * demanded 0.519 s per item on the board; level 1 demanded 0.52. The ladder
 * was not a climb — it was the same difficulty three times, with the board
 * getting bigger and the clock growing to match. **22 of the 59 steps were
 * more generous than the step before.**
 *
 * ⚠ 2. THE FIRST THIRD ASKED FOR NO SELECTIVE ATTENTION AT ALL.
 * `computeFeatureInterference` returns a flat 0 for the whole `easy` tier, and
 * bands 1-2 ARE the easy tier — so for twenty levels no distractor ever shared
 * the target's colour. That is pop-out search, where the target announces
 * itself pre-attentively; it is the *least* attention-demanding search there
 * is. Interference then reset to 0 again at L41 (hard's own L1).
 *
 * THE FIX IS ONE CONTINUOUS ENVELOPE OVER THE LADDER, not a rewrite of the
 * curriculum. Targets, pools, grids and the authored TC series are untouched,
 * so `audit:fq` still certifies every tier exactly as before and Pass n Play,
 * Survival and the assessment — which read the TIERS, not the ladder — are
 * bit-for-bit unchanged. Only the path the player actually climbs is re-shaped.
 *
 * ⚠ THE END POINT IS TIGHTER THAN THE OLD FLOOR ON PURPOSE (1.12× vs 1.35×),
 * because the ask was for more challenge at the top. It stays above 1.0, which
 * is the line `audit:fq` calls the difference between hard and broken — below
 * expert pace a level is not difficult, it is unwinnable, and this game has
 * shipped that bug before (11 s granted for 44.5 s of work).
 *
 * ⚠ AND THE START IS TIGHTER TOO (3.4× vs 4.64×). A smooth ramp between two
 * unchanged endpoints would have made the early game *easier*, since today's
 * tight spots at L12-L20 are an artefact of the first reset rather than design.
 *
 * ⚠ TIGHTENED AGAIN, AT BOTH ENDS (2026-09-17, owner: "all the levels look so
 * easy"). 3.4× at level 1 means a board a perfect searcher clears in 2.1s
 * granted 7 — which is not a first level, it is a demonstration. 2.35 → 1.06 is
 * the same shape held closer to the model all the way up.
 *
 * ⚠ 1.06 IS DELIBERATELY NEAR THE FLOOR AND IS ONLY SAFE BECAUSE OF WHAT
 * "EXPERT" MEANS HERE. `expertTargetSecForSetSize` is 700ms of decision plus
 * 12ms per item scanned — a fast but ordinary rate, not a ceiling — so 1.06× is
 * a level you have to play well rather than one nobody can finish. It is still
 * above the 1.0 line `audit:fq` calls the difference between hard and broken.
 * If this ever needs to go lower, lower the MODEL and re-derive, do not push
 * this under 1.0.
 */
/** No ladder round is shorter than this, whatever the envelope asks for. */
const FQ_LADDER_TIME_FLOOR_SEC = 6;
const FQ_LADDER_HEADROOM_START = 2.35;
const FQ_LADDER_HEADROOM_END = 1.06;

/** Multiple of expert search pace granted at a ladder level. Strictly falling. */
export function fqLadderHeadroom(lv) {
  const n = Math.min(FQ_LADDER_LEVELS, Math.max(1, Math.round(Number(lv) || 1)));
  const t = (n - 1) / (FQ_LADDER_LEVELS - 1);
  return FQ_LADDER_HEADROOM_START
    * ((FQ_LADDER_HEADROOM_END / FQ_LADDER_HEADROOM_START) ** t);
}

/**
 * How many distractors share the target's colour, as one ramp across the whole
 * ladder instead of three restarting ones.
 *
 * ⚠ IT STARTS AT ZERO AND STAYS THERE FOR TWO LEVELS, deliberately. Level 1 is
 * where the coach teaches the task and the rule card names it; a first board
 * that already hides its target among same-coloured distractors teaches the
 * wrong thing about what the game is. It is at full strength by the last band.
 */
export function fqLadderInterference(lv) {
  const n = Math.min(FQ_LADDER_LEVELS, Math.max(1, Math.round(Number(lv) || 1)));
  return +Math.min(0.92, Math.max(0, (n - 2) / 46)).toFixed(2);
}

/**
 * Ladder level → the level config, via the authored curriculum.
 *
 * ⚠ `ladderToTier` returns a 1-BASED authored level (what `prepareLevelRound`
 * takes), while `getLvCfg` indexes the TC arrays 0-BASED. Hence the `- 1`.
 * Getting this wrong shifts every level by one and is invisible in play.
 */
/*
 * The clock for all 60 ladder levels, built ONCE.
 *
 * ⚠ IT IS A TABLE RATHER THAN A FORMULA BECAUSE THE FORMULA ALONE IS NOT
 * MONOTONE. The clock is a whole number of seconds, so `round(need × headroom)`
 * lands slightly above the intended curve whenever the target count ticks up —
 * measured at five of the fifty-nine steps, by up to 0.05× (e.g. L17→L18 went
 * 2.449→2.500 because 7 targets became 8 and 12s became 14s). That is rounding
 * noise and nothing like the 0.13–1.7 resets it replaced, but "the next level
 * is never more generous" is a property worth having exactly rather than
 * approximately — it is the whole claim this envelope makes. So each level's
 * clock is additionally capped at the previous level's realised headroom.
 *
 * ⚠ `expertTargetSecForSetSize` is the game's own search model and the one
 * `audit:fq` measures against, so "1.12× expert" means the same thing here as
 * it does in the gate. The two cannot drift into different definitions of hard.
 */
/**
 * The round a ladder level actually DEALS — not what the curriculum authored.
 *
 * ⚠ THIS DISTINCTION IS THE WHOLE REASON THE FIRST VERSION OF THIS FIX DID
 * NOTHING. `getLvCfg` describes a square curriculum board (5×5 / 7×7 / 9×9),
 * but every mode a human plays reflows onto the thumb-safe `PLAY_BOARD`
 * (4×5 / 5×7 / 6×8 = 20 / 35 / 48 cells) and `reflowTargetCount` rescales the
 * targets to keep the authored DENSITY. So the board the player searches is
 * less than two-thirds the size the curriculum names, and `prepareLevelRound`
 * takes its clock from `survivalRoundTime` on that reflowed board — `cfg.time`
 * is only consulted when the board is NOT reflowed, which in Levels never
 * happens. An envelope computed from grid² would have been arithmetic about a
 * board nobody plays. Measure the dealt round.
 */
export function fqLadderRoundShape(lv) {
  const n = Math.min(FQ_LADDER_LEVELS, Math.max(1, Math.round(Number(lv) || 1)));
  const { diff, li } = ladderToTier(n);
  const squareArea = (DM[diff] ?? DM.easy).grid ** 2;
  const board = normalizeBoard(PLAY_BOARD[diff] ?? (DM[diff] ?? DM.easy).grid);
  const tc = board.total !== squareArea
    ? reflowTargetCount(TC[diff][li - 1], squareArea, board.total)
    : TC[diff][li - 1];
  return { diff, li, cells: board.total, tc };
}

/*
 * ⚠ BUILT LAZILY, NOT AT MODULE LOAD. `PLAY_BOARD` and `reflowTargetCount` are
 * declared further down this file, so an eager IIFE here throws
 * `ReferenceError: Cannot access 'PLAY_BOARD' before initialization` — a
 * temporal dead zone that takes the whole module, and therefore the whole
 * game, down on import. Caught the first time the table was read; do not
 * "tidy" this back into a top-level constant.
 */
let fqLadderClock = null;
function fqLadderClockTable() {
  if (fqLadderClock) return fqLadderClock;
  const out = [];
  let prevRealised = Infinity;
  for (let n = 1; n <= FQ_LADDER_LEVELS; n += 1) {
    const { diff, cells, tc } = fqLadderRoundShape(n);
    const need = expertTargetSecForSetSize(diff, cells) * tc;
    const wanted = Math.round(need * fqLadderHeadroom(n));
    // Never more slack than the level before it, in multiples of expert pace.
    const capped = Math.min(wanted, Math.floor(need * prevRealised));
    /*
     * ⚠ THE LADDER HAS ITS OWN FLOOR, LOWER THAN `ABSOLUTE_TIME_FLOOR_SEC`.
     * The shared 8s floor was BINDING on the first band and holding it at 3.8x
     * expert pace no matter what the envelope asked for — a 3-target board a
     * perfect searcher clears in 2.1s was being handed 8 seconds because of a
     * constant, which is most of why the early levels read as easy. 6s is still
     * a real round (audit:pacing gates what actually reaches the player) and it
     * lets the envelope govern band one instead of a floor written for a
     * different mode. The 8s constant is untouched, so Survival, Pass n Play
     * and the assessment keep it.
     */
    const time = Math.max(FQ_LADDER_TIME_FLOOR_SEC, capped);
    out.push(time);
    prevRealised = time / need;
  }
  fqLadderClock = out;
  return out;
}

/** The clock a ladder level grants, on the board it actually deals. */
export function fqLadderTime(lv) {
  return fqLadderClockTable()[
    Math.min(FQ_LADDER_LEVELS, Math.max(1, Math.round(Number(lv) || 1))) - 1
  ];
}

/**
 * Ladder level → the level config, via the authored curriculum.
 *
 * ⚠ `ladderToTier` returns a 1-BASED authored level (what `prepareLevelRound`
 * takes), while `getLvCfg` indexes the TC arrays 0-BASED. Hence the `- 1`.
 * Getting this wrong shifts every level by one and is invisible in play.
 */
export function ladderLvCfg(lv) {
  const n = Math.min(FQ_LADDER_LEVELS, Math.max(1, Math.round(Number(lv) || 1)));
  const { diff, li } = ladderToTier(n);
  const cfg = getLvCfg(diff, li - 1);
  return {
    ...cfg,
    time: fqLadderTime(n),
    interference: fqLadderInterference(n),
    diff,
    li,
    lv: n,
  };
}

/** Deepest level under the old tiers → a level on the ladder. */
export function fqMigrateLadderReached(doneMap) {
  const order = ['easy', 'medium', 'hard'];
  let reached = 0;
  order.forEach((k, i) => {
    let deepest = 0;
    for (const key of Object.keys(doneMap || {})) {
      const m = key.match(/^([a-z]+)-(\d+)$/);
      if (m && m[1] === k) deepest = Math.max(deepest, Number(m[2]) || 0);
    }
    if (deepest > 0) reached = Math.max(reached, i * 20 + Math.round((deepest / 100) * 20));
  });
  return Math.max(0, Math.min(FQ_LADDER_LEVELS, reached));
}

export function getLvCfg(diff, li) {
  const m = DM[diff];
  const pool = poolForLevel(diff, li);
  const time = Math.round(sigmoidTime(diff, li) * (TIER_TIME_MULT[diff] ?? 1));
  const interference = computeFeatureInterference(li, diff);
  return {
    pool,
    tc: TC[diff][li],
    time,
    grid: m.grid,
    interference,
    conjunction: computeConjunctionStrength(li, diff),
  };
}


export const SHAPE_NAMES = {
  circle: 'Circle', square: 'Square', triangle: 'Triangle', diamond: 'Diamond',
  pentagon: 'Pentagon', hexagon: 'Hexagon', star: 'Star', cross: 'Cross',
  heart: 'Heart', lightning: 'Lightning Bolt', roundsq: 'Rounded Square',
  ovalH: 'Horizontal Oval', ovalV: 'Vertical Oval', triR: 'Right Triangle',
  triFlat: 'Flat Triangle', hexTall: 'Tall Hexagon', arrowR: 'Right Arrow',
  arrowL: 'Left Arrow', moon: 'Moon', semicircle: 'Semicircle', rhombus: 'Rhombus',
  parallelR: 'Parallelogram', trapezoid: 'Trapezoid', shield: 'Shield',
  ovalSq: 'Oval Rectangle', fatOval: 'Wide Oval', thinOval: 'Thin Oval',
  almostCircle: 'Near-Circle', wideRect: 'Wide Rectangle', tallRect: 'Tall Rectangle',
  bigSemi: 'Large Semicircle', tinyMoon: 'Crescent Moon', fatDiamond: 'Fat Diamond',
};


/**
 * Fisher-Yates in-place shuffle. Uniform distribution over permutations,
 * unlike `Array.prototype.sort(() => Math.random() - 0.5)` which is biased.
 * Accepts an optional rng so callers (e.g. challenge mode) can seed it.
 */
export function fisherYatesInPlace(arr, rng = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/** Linear-congruential PRNG. Deterministic given the same seed; used so a
 *  challenge layout is bit-identical for every player who plays it. */
export function makeLcgRng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// =============================================================================
// SMART TARGET PLACEMENT — neuroscience-informed, not a flat Fisher-Yates shuffle.
// -----------------------------------------------------------------------------
// Pure-random placement has two confounds that make a cancellation round
// accidentally easy or unevenly hard:
//   • Lucky clumps. Targets that fall adjacent form a proximity (Gestalt) group
//     that pops out as one textured blob and is "found" in a single fixation,
//     bypassing the serial search the task is supposed to measure.
//   • Hemifield imbalance. A random draw can stack most targets on one side,
//     which both changes difficulty round-to-round and muddies any left/right
//     (neglect-style) reading of performance.
//
// We replace the shuffle with a placement that encodes three findings:
//   1. Quadrant / hemifield balance — cancellation tasks are the canonical probe
//      for hemispatial neglect (Mesulam). Spreading targets evenly across the
//      four quadrants trains the whole visual field and keeps left/right load
//      equal every round.
//   2. Anti-clustering (Poisson-disk min spacing) — enforce a minimum
//      target-to-target distance so targets don't group; each must be found by
//      serial search. Distractors still surround every target, giving the desired
//      flanker crowding (Bouma's law) without letting targets self-group.
//   3. Eccentricity weighting — acuity and attentional resolution fall with
//      distance from fixation (centre). Biasing a growing share of targets toward
//      the periphery as difficulty rises loads the useful field of view and
//      peripheral/sustained attention instead of parking targets in the easy
//      centre.
//
// Deterministic given the rng, so challenge mode (seeded LCG) stays bit-identical
// for every player.
// =============================================================================

/** Eccentricity bias [0..1] for a level: how strongly targets are pushed to the
 *  periphery. Rises with tier and within-tier level. */
export function computeEccentricityBias(li, diff) {
  const baseByDiff = { easy: 0.12, medium: 0.3, hard: 0.5 };
  const base = baseByDiff[diff] ?? 0.25;
  const ramp = (Math.max(0, li) / (FQ_LEVELS_PER_TIER - 1)) * 0.25;
  return +Math.min(0.75, base + ramp).toFixed(2);
}

/*
 * A BOARD IS cols×rows, NOT N×N. (2026-08-13)
 *
 * The lattice was square everywhere, and on a phone that is what made the hard
 * tier untappable: the board fits the SHORTER axis (CancelBoard2D), so on a
 * 375px-wide phone a 9×9 renders 33px pieces on a 41px pitch — under the 44px
 * touch minimum and smaller than a finger's contact patch. A mis-tap there is
 * scored as a false alarm, so on hard the error count and d′ were partly
 * measuring thumb width instead of attention.
 *
 * Nothing in the task requires a square: real cancellation sheets (Mesulam,
 * Bells) are landscape rectangles. Square was costing us the ~280px of vertical
 * space a portrait phone leaves under a square board. Accepting cols≠rows lets
 * set size stay a difficulty lever while the piece stays thumb-sized.
 *
 * Accepts a plain number (square, the legacy call) or {cols, rows}.
 */
export function normalizeBoard(board) {
  if (typeof board === 'number') {
    const n = Math.max(1, board | 0);
    return { cols: n, rows: n, total: n * n };
  }
  const cols = Math.max(1, (board?.cols ?? board?.grid ?? 5) | 0);
  const rows = Math.max(1, (board?.rows ?? cols) | 0);
  return { cols, rows, total: cols * rows };
}

/**
 * Choose board indices (row-major, 0..cols*rows-1) for the targets. Returns a
 * Set of exactly `min(tc, cols*rows)` indices placed with quadrant balance,
 * anti-clustering, and eccentricity weighting (see header).
 */
export function chooseTargetPositions(board, tc, rng = Math.random, opts = {}) {
  const { cols, rows, total } = normalizeBoard(board);
  const want = Math.max(0, Math.min(tc | 0, total));
  if (want === 0) return new Set();
  if (want >= total) return new Set(Array.from({ length: total }, (_, i) => i));

  const eccBias = Math.max(0, Math.min(1, opts.eccentricityBias ?? 0.3));
  // Two centres now — one per axis. On a rectangle they differ, and using a
  // single one would push the "periphery" bias off-centre along the long axis.
  const centerR = (rows - 1) / 2;
  const centerC = (cols - 1) / 2;
  const maxEcc = Math.hypot(centerR, centerC) || 1;
  const rc = (idx) => [Math.floor(idx / cols), idx % cols];
  const ecc = (idx) => {
    const [r, c] = rc(idx);
    return Math.hypot(r - centerR, c - centerC) / maxEcc; // 0 centre … 1 corner
  };
  // Quadrant by sign of offset from centre. Cells on the centre cross (odd side
  // lengths) are dealt round-robin so the middle row/col isn't biased to one
  // quadrant.
  let centreTie = 0;
  const quad = (idx) => {
    const [r, c] = rc(idx);
    const dr = r - centerR;
    const dc = c - centerC;
    if (dr === 0 || dc === 0) return centreTie++ % 4;
    return (dr < 0 ? 0 : 2) + (dc < 0 ? 0 : 1);
  };

  const buckets = [[], [], [], []];
  for (let i = 0; i < total; i++) buckets[quad(i)].push(i);

  // Even split across quadrants; leftover (rounding + capacity caps) sprinkled.
  const perQuad = [0, 0, 0, 0];
  let remaining = want;
  const base = Math.floor(want / 4);
  for (let q = 0; q < 4; q++) {
    perQuad[q] = Math.min(base, buckets[q].length);
    remaining -= perQuad[q];
  }
  const order = fisherYatesInPlace([0, 1, 2, 3], rng);
  let guard = 0;
  while (remaining > 0 && guard++ < 64) {
    let placedAny = false;
    for (const q of order) {
      if (remaining <= 0) break;
      if (perQuad[q] < buckets[q].length) {
        perQuad[q]++;
        remaining--;
        placedAny = true;
      }
    }
    if (!placedAny) break;
  }

  const chosen = new Set();
  const chosenRC = [];
  const fill = want / total;
  const baseRadius =
    fill < 0.12 ? 2.2 : fill < 0.22 ? 1.7 : fill < 0.34 ? 1.3 : 1.0;
  const tooClose = (r, c, radius) => {
    if (radius <= 0) return false;
    for (const [rr, cc] of chosenRC) {
      if (Math.max(Math.abs(rr - r), Math.abs(cc - c)) < radius) return true; // Chebyshev
    }
    return false;
  };

  const pickFromBucket = (cells, n) => {
    let placed = 0;
    let radius = baseRadius;
    let attempts = 0;
    const maxAttempts = cells.length * 12 + 40;
    while (placed < n && attempts < maxAttempts) {
      attempts++;
      // Eccentricity-weighted draw: take a few samples, keep the best-scoring
      // free cell (weight = (1-bias) + bias·ecc, with jitter so ties randomise).
      let idx = -1;
      let bestW = -1;
      for (let p = 0; p < 5; p++) {
        const cand = cells[Math.floor(rng() * cells.length)];
        if (chosen.has(cand)) continue;
        const w = (1 - eccBias) + eccBias * ecc(cand);
        const score = w * (0.6 + 0.4 * rng());
        if (score > bestW) {
          bestW = score;
          idx = cand;
        }
      }
      if (idx < 0) {
        for (const cand of cells) {
          if (!chosen.has(cand)) {
            idx = cand;
            break;
          }
        }
        if (idx < 0) break;
      }
      const [r, c] = rc(idx);
      if (tooClose(r, c, radius)) {
        if (attempts % (cells.length + 8) === 0 && radius > 0) {
          radius = Math.max(0, radius - 0.4); // relax under pressure so it terminates
        }
        continue;
      }
      chosen.add(idx);
      chosenRC.push([r, c]);
      placed++;
    }
    // Spacing made the quota impossible — fill the rest ignoring spacing.
    for (let i = 0; i < cells.length && placed < n; i++) {
      const cand = cells[i];
      if (!chosen.has(cand)) {
        chosen.add(cand);
        chosenRC.push(rc(cand));
        placed++;
      }
    }
  };

  for (let q = 0; q < 4; q++) pickFromBucket(buckets[q], perQuad[q]);

  // Reconcile to exactly `want` if rounding under-filled.
  for (let i = 0; i < total && chosen.size < want; i++) {
    if (!chosen.has(i)) chosen.add(i);
  }
  return chosen;
}

/*
 * ⚠ EVERY board is a CATEGORICAL search: the target is an OBJECT, and no
 * distractor is ever that object in another colour. (2026-08-09)
 *
 * Hard used to be an `identity` conjunction — target = object AND colour, with
 * 66–95% of distractors sharing one of the two. Measured on real boards, hard
 * L1 put 11 targets on screen beside 26 tiles showing the SAME object in the
 * wrong colour. It is a legitimate lab paradigm and it was legitimately
 * implemented; it is simply not the game we want. Once the illustrations
 * landed, colour survived as a ~2px frame and a 16% tint around a full-colour
 * picture, so "same rocket, different frame" was the whole task, and clearing
 * every rocket on the board scored 11 hits and 26 false alarms — the player's
 * report was "I cancelled everything and still didn't win".
 *
 * Difficulty now rides the levers getLvCfg already composes and that do not
 * require duplicating an object: set size (5x5 → 9x9), target density, pool
 * variety, hue interference, and the clock. `useFeatureBinding` below still
 * gives half the distractors the target's hue, which keeps colour from GUIDING
 * the search — it just never makes colour the answer.
 */
export function buildCellsFromParams(board, pool, tc, diff, seed, interference, rng = Math.random) {
  const pal = PAL[diff] || PAL.easy;
  const tgt = seed?.tgt ?? pool[Math.floor(rng() * pool.length)];
  const tgtCol = seed?.tgtCol ?? pal[Math.floor(rng() * pal.length)];
  /* ⚠ EXCLUDES BOTH TARGET SHAPES WHEN THE ROUND IS DUAL. Filtering only
     `tgt` would leave the SECOND target shape in the distractor pool, so the
     board would carry cells of that shape marked `isT: false` — identical on
     screen to the ones marked true. The player would tap a shape they were
     told to find and be scored wrong for it, which is unanswerable. */
  const dist = pool.filter((s) => s !== tgt && s !== (seed?.tgt2 ?? null));
  if (dist.length === 0) {
    throw new Error(
      `focusQuestData: distractor pool empty (need ≥2 distinct shapes). pool=${JSON.stringify(pool)} tgt=${tgt}`,
    );
  }
  const { total } = normalizeBoard(board);
  // Never ask for more targets than cells; keeps UI count and board in sync.
  const guaranteedTc = Math.min(Math.max(tc, 3), total);
  /*
   * ⚠ COLOUR INTERFERENCE WAS DEAD CODE, AND THIS IS WHERE IT DIED (found
   * 2026-09-17 by A/B-ing the lever: `interference: 0` and `interference: 1`
   * produced statistically identical boards at every level of the ladder).
   *
   * Every distractor below is given a `col`, and `assignFillColors` opens with
   * `if (cell.col) fill = cell.col` — so its `else if (interference > 0)`
   * branch is unreachable for distractors, which are the only cells it could
   * ever apply to. `computeFeatureInterference`, its per-tier ramps and the
   * comment promising it "turns a lazy pop-out scan into a real
   * selective-attention task" were all describing something that never
   * happened.
   *
   * What actually governed colour was this one boolean: on medium/hard HALF
   * the distractors took the target's hue, and on easy none did. So for the
   * ladder's first twenty levels COLOUR PERFECTLY PREDICTED THE TARGET — the
   * definition of pop-out, and the least attention-demanding search there is —
   * and from level 21 it stepped to a flat 50% and never moved again. That is
   * the measured reason the game "is not really challenging attention".
   *
   * Now the share of distractors wearing the target's hue IS `interference`,
   * so the parameter finally means what its name and its model always claimed.
   *
   * ⚠ THE FALLBACK KEEPS EVERY OTHER MODE BIT-FOR-BIT. A caller that passes no
   * interference (Survival, Pass n Play, the assessment, the adaptive
   * staircase) gets exactly the old boolean. Only callers that opt in — today
   * just the Levels ladder — get the ramp.
   */
  const useFeatureBinding = diff === 'medium' || diff === 'hard';
  const sameHueShare = Number.isFinite(interference) && interference > 0
    ? Math.min(1, interference)
    : (useFeatureBinding ? 0.5 : 0);

  /*
   * ── DUAL TARGET (2026-09-17) ─────────────────────────────────────────────
   * `seed.tgt2` makes the hunt a TWO-shape hunt: both count, both must be
   * cleared, and neither is worth more than the other.
   *
   * ⚠ THE TARGET COUNT DOES NOT CHANGE — the same `guaranteedTc` cells are
   * targets, split between the two shapes. That is what keeps every
   * feasibility number `audit:fq` checks true: the board still holds exactly
   * as many things to find. What changes is that finding them needs two
   * templates held at once instead of one, which is the construct.
   *
   * ⚠ BOTH SHAPES ARE GUARANTEED PRESENT. A "find A and B" board that happens
   * to contain no B teaches the player that the second shape was decorative —
   * and with a low target count and a fair coin that is not rare (2 targets
   * would deal an all-A board a quarter of the time). The split is computed,
   * not rolled: at least one of each, the remainder shared at random.
   */
  const tgt2 = seed?.tgt2 && seed.tgt2 !== tgt ? seed.tgt2 : null;

  // Build target + distractor tokens separately, then place targets with the
  // smart spatial sampler and drop distractors into whatever cells are left.
  const targets = [];
  if (tgt2 && guaranteedTc >= 2) {
    const secondCount = 1 + Math.floor(rng() * Math.max(1, guaranteedTc - 1));
    for (let k = 0; k < guaranteedTc; k++) {
      targets.push({ shape: k < secondCount ? tgt2 : tgt, col: null, isT: true });
    }
    fisherYatesInPlace(targets, rng);
  } else {
    for (let k = 0; k < guaranteedTc; k++) {
      // col null → assignFillColors paints every target the one target colour.
      targets.push({ shape: tgt, col: null, isT: true });
    }
  }
  const distractors = [];
  const need = total - guaranteedTc;
  for (let k = 0; k < need; k++) {
    // `dist` excludes the target object, so no distractor can ever be mistaken
    // for a target by anything but a careless glance — which is the task.
    const dshp = dist[Math.floor(rng() * dist.length)];
    const dcol = rng() < sameHueShare ? tgtCol : pal[Math.floor(rng() * pal.length)];
    distractors.push({ shape: dshp, col: dcol, isT: false });
  }
  fisherYatesInPlace(distractors, rng);

  const targetPos = chooseTargetPositions(board, guaranteedTc, rng, {
    eccentricityBias: seed?.eccentricityBias ?? 0.3,
  });
  const cells = new Array(total);
  let ti = 0;
  let di = 0;
  for (let i = 0; i < total; i++) {
    cells[i] = targetPos.has(i) ? targets[ti++] : distractors[di++];
  }
  return { cells, tgt, tgt2, tgtCol, tc: guaranteedTc };
}

export function assignFillColors(cells, diff, interference, tgtCol, rng = Math.random) {
  const pal = PAL[diff] || PAL.easy;
  const tgtColIdx = pal.indexOf(tgtCol) >= 0 ? pal.indexOf(tgtCol) : 0;
  return cells.map((cell) => {
    let fill;
    if (cell.col) {
      fill = cell.col;
    } else if (cell.isT) {
      fill = tgtCol;
    } else if (interference > 0) {
      if (rng() < interference * 0.7) {
        const adj = (tgtColIdx + Math.floor(rng() * 2) + 1) % pal.length;
        fill = pal[adj];
      } else fill = pal[Math.floor(rng() * pal.length)];
    } else {
      fill = pal[Math.floor(rng() * pal.length)];
    }
    return { ...cell, fill };
  });
}

/** Linear curriculum for Free mode: easy 1–100 → medium 1–100 → hard 1–100. */
export const FREE_PROGRESS_ORDER = FQ_DIFF_KEYS;

/**
 * Free mode is endless: the run only ends when the player runs out of lives.
 * Each round carries its own (shrinking-with-stage) time limit. A round is
 * FAILED — costing one life — when its timer expires before all targets are
 * cleared, OR when wrong taps in that round exceed the per-round error cap.
 * Clearing a round advances the curriculum (harder next round); failing repeats
 * the same stage so the ramp never spikes past the player.
 */
export const FREE_LIVES = 1;

/** Starting session bank (seconds); clock runs continuously across rounds until 0. */
export const FREE_SESSION_START_SEC = 48;

/** Hard cap on bank so bonuses cannot pile up without bound (keeps pressure up). */
export const FREE_SESSION_CAP_SEC = 168;

/**
 * Per-round wrong-tap budget in free mode. Exceeding it fails the round (−1 life).
 * Scales with the round's target count so denser boards tolerate a few more
 * slips, but never becomes generous: ⌈targetCount × 0.4⌉, clamped to [2, 6].
 */
export function freeRoundErrorCap(targetCount) {
  const tc = Math.max(1, targetCount | 0);
  return Math.min(6, Math.max(2, Math.ceil(tc * 0.4)));
}

/**
 * Session-clock drain multiplier (1.0 = real-time). Ramps slowly across the
 * curriculum so late-tier rounds feel tighter — but late-game pressure should
 * come mainly from larger set sizes and harder search, not from a faster bleed.
 *   mult = 1 + min(cap, k · stageIndex)
 */
export function freeTimeDrainMultiplier(stageIndex) {
  const s = Math.max(0, stageIndex | 0);
  const k = 0.0085;
  const cap = 0.38;
  return 1 + Math.min(cap, k * s);
}

/**
 * Bonus seconds after clearing a free round. Kept small so the session clock
 * stays tense — clears should feel like a sip of air, not a full refill.
 */
export function freeClearBonusSec(stageCompleted, nominalParSec) {
  const s = Math.max(0, stageCompleted | 0);
  const par = Math.max(6, Number(nominalParSec) || 20);
  const tau = 20;
  const u = 1 / (1 + s / tau);
  const raw = 0.55 + u * (1.2 + 0.065 * par);
  const bonus = Math.min(12, Math.max(0.75, raw));
  return +bonus.toFixed(1);
}

const FREE_SCORE_WEIGHT = { easy: 1, medium: 1.25, hard: 1.7 };

/** Points per correct target tap in free mode. */
export function freeTapPoints(diff, freeStage) {
  const w = FREE_SCORE_WEIGHT[diff] ?? 1;
  const depth = Math.min(freeStage, 99);
  return Math.max(1, Math.round((5 + depth * 0.14) * w));
}

/** Bonus points when a full free round is cleared (streak = consecutive clears this run). */
export function freeRoundClearPoints(parSec, clearStreak) {
  const par = Math.max(6, Number(parSec) || 20);
  const streak = Math.max(1, clearStreak);
  const streakMult = 1 + Math.min(streak - 1, 25) * 0.035;
  const base = 14 + par * 0.2;
  return Math.max(8, Math.round(base * streakMult));
}

/** Score removed on a wrong tap in free mode (scaled by tier). */
export function freeWrongTapPenalty(diff) {
  const w = FREE_SCORE_WEIGHT[diff] ?? 1;
  return Math.max(6, Math.round(11 * w));
}

export function freeStageToDiffLv(stageIndex) {
  const s = Math.max(0, stageIndex | 0);
  const maxLinear = FREE_PROGRESS_ORDER.length * FQ_LEVELS_PER_TIER - 1;
  const capped = Math.min(s, maxLinear);
  const diffIx = Math.floor(capped / FQ_LEVELS_PER_TIER);
  const lv = (capped % FQ_LEVELS_PER_TIER) + 1;
  return { diff: FREE_PROGRESS_ORDER[diffIx], lv };
}

/**
 * SURVIVAL ramp — deliberately steep, unlike the 300-level curriculum that the
 * level mode walks one level at a time. Survival should *feel* like it escalates:
 * the grid grows (tier change) every few clears, and target density climbs hard
 * within each tier. With the ±1-stage adaptive staircase this converges on the
 * player's ceiling fast instead of leaving them on a 5×5 board for 100 rounds.
 *
 * Plan (each entry = a tier the player passes through, in order):
 *   easy  5×5 — rounds 0–3   (warm-up, density rising)
 *   medium 7×7 — rounds 4–8  (bigger board, mild interference)
 *   hard  9×9 — rounds 9+    (conjunction search, enters above the medium
 *                              ceiling and climbs to max density, then holds)
 * Within a tier the position is mapped onto the curriculum level index
 * (`liStart..liEnd`) so it reuses the tuned time/target/interference curves.
 */
/*
 * SURVIVAL BOARDS — thumb-first, one spec for every device. (2026-08-13)
 *
 * Survival is where this bites hardest: it walks all three tiers on ONE life, so
 * the 9×9 arrives whatever your screen is. The boards below are the largest that
 * still render a ≥44px piece on the SMALLEST supported phone (375×667, i.e. an
 * iPhone SE, whose playable box is ~375×531 once the HUD and home indicator are
 * taken off). Measured through CancelBoard2D's own fit formula:
 *
 *      easy  5×5 = 25 cells → 66px      (unchanged; it was never cramped)
 *      medium 6×8 = 48 cells → 54px     (was 7×7=49 at 45px — same set size)
 *      hard  7×9 = 63 cells → 45px      (was 9×9=81 at 33px)
 *
 * Medium keeps its set size almost exactly and simply stops being square, which
 * is free. Hard genuinely loses 22% of its items, and that is not avoidable:
 * 81 cells at a thumb-safe 52px pitch needs ~223k px² and an SE has ~199k. The
 * lost load is paid back by entering the tier higher up the curriculum — see
 * SURVIVAL_TIER_PLAN's hard liStart, recomputed for exactly this reason.
 *
 * ONE spec for every device, deliberately: sizing the board per-device would
 * make difficulty depend on the phone, which is the trap audit:mot documents
 * (rescaling to fit the screen silently stopped grading difficulty at all). Big
 * screens get bigger pieces, not more of them.
 */
/*
 * ⚠ CELLS AND PIECE SIZE TRADE DIRECTLY AGAINST EACH OTHER. There is no board
 * that is both big and comfortable, so these three numbers are a decision, not
 * a default. Measured on the smallest supported phone (375x667, ~375x531
 * playable) through CancelBoard2D's own fit formula:
 *
 *      3x4 = 12 -> 115px      6x8 = 48 -> 53px
 *      4x5 = 20 ->  84px      7x9 = 63 -> 45px
 *      5x7 = 35 ->  66px      9x12 = 108 -> 33px
 *
 * The ladder sits one notch kinder than it did, because 45px on the hard tier
 * was still a thumb-width target. It deliberately stops short of the smallest
 * boards: set size IS the difficulty in visual search, and at ~12 items the
 * whole board falls inside one fixation — no serial search happens at all and
 * the tier stops measuring attention. ~20 is where search starts behaving like
 * search, so easy sits there and hard keeps 48 for a real sustained scan.
 */
export const SURVIVAL_BOARD = Object.freeze({
  easy:   Object.freeze({ cols: 4, rows: 5 }),
  medium: Object.freeze({ cols: 5, rows: 7 }),
  hard:   Object.freeze({ cols: 6, rows: 8 }),
});

/*
 * EVERY MODE A HUMAN PLAYS ON A PHONE GETS THE SAME THUMB-SAFE BOARDS.
 *
 * The first pass at this reflowed Survival only, and that was the wrong call
 * for two reasons the player found immediately:
 *
 *   1. Survival's first four rounds are the EASY tier, which was already 5x5
 *      and did not change. Survival runs on one life, so unless you clear four
 *      rounds you see nothing different at all — the fix was invisible to
 *      exactly the players who needed it.
 *   2. Levels and Pass n Play — the modes people actually spend time in — were
 *      untouched, so hard still dealt 9x9 at 33px on a small phone.
 *
 * One spec now covers Survival, Levels, adaptive and Pass n Play. The
 * ASSESSMENT is deliberately excluded: it builds its boards in assessmentData
 * and its percentiles are tied to the 7x7 geometry, so reflowing it would
 * invalidate every stored session.
 */
export const PLAY_BOARD = SURVIVAL_BOARD;

/**
 * Re-express an authored target count on a board of a different size, keeping
 * the DENSITY the curriculum authored (targets/cell) rather than the raw count.
 * Still bounded by the same "targets stay a sparse minority" cap as TARGET_CURVE.
 */
export function reflowTargetCount(tc, fromArea, toArea) {
  const scaled = Math.round(tc * (toArea / Math.max(1, fromArea)));
  const cap = Math.min(Math.floor(toArea * 0.34), toArea - MIN_NON_TARGET_CELLS);
  return Math.max(3, Math.min(scaled, cap));
}

export const SURVIVAL_TIER_PLAN = [
  { diff: 'easy',   rounds: 4, liStart: 2,  liEnd: 78 },
  // Enter medium at L34 and leave at L65. The former L7 entry was objectively
  // lighter than the final easy round after its larger time allowance was
  // considered, so Survival briefly became easier when the board grew.
  { diff: 'medium', rounds: 5, liStart: 33, liEnd: 64 },
  /*
   * Start hard at L33 (was L20, and L9 before that).
   *
   * This entry point is not a taste call — it is the first hard level whose
   * ordinal load clears the load of the medium round before it, and it has to
   * be recomputed whenever the difficulty model changes. It moved to L33
   * because two things changed at once: hard lost its conjunction (so its
   * search weight fell 2.5 → 1.7) and the clock is budgeted per target (so hard
   * L20 now grants 2.83× headroom against medium L65's 1.39×). Entering there
   * would have made the bigger, denser board the EASIEST round in the run —
   * precisely the dip the two earlier entry points were moved to avoid.
   *
   * audit:fq asserts the monotonicity; if it fails here, recompute rather than
   * nudge.
   *
   * Recomputed to L49 on 2026-08-13, when hard's survival board went 9×9 → 7×9
   * to keep the pieces thumb-sized (SURVIVAL_BOARD above). 63 cells at the
   * curriculum's own density is 12 targets where 81 gave 16, so hard L33 entered
   * BELOW the medium round before it — the exact dip the previous two entry
   * points were moved to avoid. L49 is the first hard level whose ordinal load
   * clears medium's exit; searched over the whole plan, not nudged.
   */
  { diff: 'hard',   rounds: 6, liStart: 48, liEnd: 99 },
];

export function survivalStageToDiffLv(stageIndex) {
  let s = Math.max(0, stageIndex | 0);
  for (let i = 0; i < SURVIVAL_TIER_PLAN.length; i++) {
    const tier = SURVIVAL_TIER_PLAN[i];
    const last = i === SURVIVAL_TIER_PLAN.length - 1;
    if (s < tier.rounds || last) {
      const span = Math.max(1, tier.rounds - 1);
      const u = Math.min(1, s / span);
      const li = Math.round(tier.liStart + (tier.liEnd - tier.liStart) * u);
      return { diff: tier.diff, lv: Math.min(FQ_LEVELS_PER_TIER, li + 1) };
    }
    s -= tier.rounds;
  }
  return { diff: 'hard', lv: FQ_LEVELS_PER_TIER };
}

/* QA-only ordinal weights for search type. These are not norms or user scores;
 * they let the finite audit catch a tier transition that accidentally becomes
 * easier after accounting for set size, time, similarity and interference.
 *
 * Hard was 2.5 when it ran a feature conjunction, which carries a genuine extra
 * serial cost. It is a categorical search like the others now (see
 * buildCellsFromParams), so the weight tracks set size and distractor
 * heterogeneity only. */
const SURVIVAL_SEARCH_LOAD_WEIGHT = Object.freeze({
  easy: 1,
  medium: 1.35,
  hard: 1.7,
});

export function getSurvivalDifficultyModel(stageIndex) {
  const { diff, lv } = survivalStageToDiffLv(stageIndex);
  const cfg = getLvCfg(diff, lv - 1);
  /*
   * The area/tc/clock here are the REFLOWED ones — what prepareFreeRound
   * actually deals — not the square curriculum's. Reading the model off the
   * authored numbers while the player gets a different board is how audit:mot's
   * bug happened: the audit certified a curve nobody was playing.
   */
  const board = normalizeBoard(SURVIVAL_BOARD[diff] ?? cfg.grid);
  const area = board.total;
  const tc = reflowTargetCount(cfg.tc, cfg.grid * cfg.grid, area);
  const time = survivalRoundTime(diff, lv - 1, tc, area);
  const searchWeight = SURVIVAL_SEARCH_LOAD_WEIGHT[diff] ?? 1;
  const featureLoad = 1 + cfg.interference + cfg.conjunction * 1.5;
  /*
   * Clock pressure is HEADROOM, not seconds.
   *
   * This used to divide by cfg.time. That was fine while time was a per-level
   * curve, but the clock is budgeted per target now (time ≈ expert × tc ×
   * headroom), so dividing by seconds cancels `tc` straight out of the formula
   * — the load stopped counting targets at all and read the easy→medium
   * boundary as a difficulty DROP. Dividing by headroom keeps target count as a
   * real term and measures the thing a player actually feels: how much of the
   * clock the board leaves you.
   */
  const pressure = Math.max(
    1,
    time / Math.max(0.001, expertTargetSecForSetSize(diff, area) * tc),
  );
  const ordinalLoad =
    (area * tc * cfg.pool.length * featureLoad * searchWeight) / pressure;
  return {
    stageIndex: Math.max(0, stageIndex | 0),
    diff,
    lv,
    grid: board.cols,
    cols: board.cols,
    rows: board.rows,
    setSize: area,
    targetCount: tc,
    timeLimitSec: time,
    poolSize: cfg.pool.length,
    interference: cfg.interference,
    conjunction: cfg.conjunction,
    ordinalLoad: +ordinalLoad.toFixed(2),
  };
}

/**
 * Clock for a reflowed board: the same per-target budget the curriculum uses,
 * recomputed against the board the player is actually given. Set size feeds the
 * expert model (search cost per target rises with the number of distractors), so
 * a smaller board must not keep the bigger board's clock.
 */
export function survivalRoundTime(diff, li, tc, setSize) {
  const t = expertTargetSecForSetSize(diff, setSize) * tc * timeHeadroom(diff, li);
  return Math.round(Math.max(ABSOLUTE_TIME_FLOOR_SEC, t));
}

export function prepareFreeRound(stageIndex) {
  const { diff, lv } = survivalStageToDiffLv(stageIndex);
  // Reuse the exact curated curriculum pool for this stage. The full 33-asset
  // atlas now covers every key, so Survival can preserve the intended ramp from
  // distinct objects to within-family variants instead of flattening every
  // stage into the same first-ten object pool.
  //
  // The BOARD, though, is Survival's own (SURVIVAL_BOARD): a portrait rectangle
  // sized so the piece stays thumb-tappable on the smallest phone. Levels and
  // Pass n Play still deal the square curriculum board.
  const base = prepareLevelRound(diff, lv, { board: SURVIVAL_BOARD[diff] });
  return { ...base, mode: 'free', freeStage: stageIndex };
}

export function prepareLevelRound(diff, lv, opts = {}) {
  const cfg = getLvCfg(diff, lv - 1);
  const pal = PAL[diff] || PAL.easy;
  /*
   * ⚠ `avoidTarget` is what makes the SWITCH rule true rather than likely.
   * Every set already re-rolled the target at random, so it changed most of
   * the time by accident — and a rule that holds "most of the time" is not a
   * rule, it is a coincidence the player cannot learn from. Excluding the
   * previous set's target makes the change guaranteed, which is the only
   * version worth announcing or measuring.
   */
  const choices = opts.avoidTarget && cfg.pool.length > 1
    ? cfg.pool.filter((s) => s !== opts.avoidTarget)
    : cfg.pool;
  const lockedTarget = choices[Math.floor(Math.random() * choices.length)];
  const lockedCol = pal[Math.floor(Math.random() * pal.length)];
  const searchMode = 'categorical';
  const eccentricityBias = computeEccentricityBias(lv - 1, diff);
  /*
   * The thumb-safe board is the DEFAULT now, not something a caller opts into.
   * Levels is where most of the play happens, and leaving it square meant the
   * hard tier still rendered 33px pieces on a small phone. A caller can still
   * force the square curriculum board by passing one explicitly — the
   * assessment does not come through here at all (see PLAY_BOARD).
   */
  const board = normalizeBoard(opts.board ?? PLAY_BOARD[diff] ?? cfg.grid);
  const squareArea = cfg.grid * cfg.grid;
  const reflowed = board.total !== squareArea;
  const tc = reflowed ? reflowTargetCount(cfg.tc, squareArea, board.total) : cfg.tc;
  /*
   * ⚠ `opts.tlimSec` IS HOW THE LADDER'S ENVELOPE REACHES THE PLAYER, and
   * without it the envelope is dead code. Levels always reflows onto
   * PLAY_BOARD, so `reflowed` is always true here and the clock came from
   * `survivalRoundTime` — a curve keyed to the TIER's level index, which is
   * why the ladder's difficulty reset at every tier boundary (see the envelope
   * comment above `fqLadderHeadroom`). Survival still calls this without the
   * option and still gets `survivalRoundTime`, unchanged.
   */
  /* ⚠ NO SECOND FLOOR HERE. An earlier version clamped `opts.tlimSec` with
     `ABSOLUTE_TIME_FLOOR_SEC` as a belt-and-braces guard, and that quietly
     overrode the caller: the ladder's own 6s floor was re-raised to 8s, which
     held band one at 3.8x expert pace no matter what the envelope computed —
     the exact "levels look easy" symptom, reintroduced one line downstream of
     the fix for it. A caller that passes an explicit clock has already decided;
     re-floor it and the number it passed is a suggestion. */
  const baseTlim = opts.tlimSec
    ? Math.round(opts.tlimSec)
    : (reflowed ? survivalRoundTime(diff, lv - 1, tc, board.total) : cfg.time);
  // Same story for interference: one continuous ramp along the ladder, rather
  // than three restarting per-tier ones (0 for the whole easy tier).
  const interference = opts.interference != null ? opts.interference : cfg.interference;
  /*
   * ── THE SECOND TARGET ────────────────────────────────────────────────────
   * ⚠ REQUIRES A POOL OF AT LEAST THREE SHAPES. Two target shapes out of a
   * two-shape pool leaves `dist` empty, and `buildCellsFromParams` throws on
   * exactly that ("distractor pool empty") — a crash rather than a bad board,
   * which is the right failure but not one to reach at runtime.
   */
  const tgt2 = opts.dual && cfg.pool.length >= 3
    ? (() => {
      const others = cfg.pool.filter((s) => s !== lockedTarget);
      return others[Math.floor(Math.random() * others.length)] ?? null;
    })()
    : null;

  /* Drift is the only rule that makes the search itself slower, so it is the
     only one that buys time back — and it is bought HERE, where the round is
     built, so the granted time audit:fq reads is the time the player gets.
     ⚠ DUAL BUYS TIME BACK FOR THE SAME REASON, and the two stack because a
     late world has both. Holding two templates instead of one slows the
     rejection of every item on the board — the board is no fuller, but each
     thing on it now has to be checked against two things. Compensating here,
     where the round is built, is what keeps the granted time audit:fq reads
     equal to the time the player actually gets. */
  const tlim = Math.round(
    baseTlim
    * (opts.drift ? FQ_DRIFT_TIME_MULT : 1)
    * (tgt2 ? FQ_DUAL_TIME_MULT : 1),
  );
  const built = buildCellsFromParams(
    board,
    cfg.pool,
    tc,
    diff,
    { tgt: lockedTarget, tgt2, tgtCol: lockedCol, eccentricityBias, conjunction: cfg.conjunction },
    interference,
  );
  const withFill = assignFillColors(built.cells, diff, interference, built.tgtCol);
  const cells = withFill.map((c, i) => ({ ...c, id: i, tapped: false, feedback: null }));

  /*
   * ── FORBIDDEN ───────────────────────────────────────────────────────────
   * One distractor SHAPE becomes off limits: find the targets, leave that one
   * alone. Marked on the cells rather than drawn differently, because the
   * whole point is that it looks like any other distractor until you have
   * learned it — a no-go you can spot by its styling is not inhibition, it is
   * a second search.
   *
   * ⚠ It never touches `isT`, so the clear condition, the target count and
   * every feasibility number audit:fq checks are untouched. The rule adds a
   * way to be WRONG, not more to find.
   */
  let noGoShape = null;
  if (opts.forbidden) {
    const counts = new Map();
    cells.forEach((c) => { if (!c.isT) counts.set(c.shape, (counts.get(c.shape) || 0) + 1); });
    // The commonest distractor, so the rule is actually met often enough to be
    // learned — a no-go that appears twice on a board teaches nothing.
    let best = null; let bestN = 0;
    counts.forEach((n, shape) => { if (n > bestN) { bestN = n; best = shape; } });
    if (best && bestN >= 2) {
      noGoShape = best;
      cells.forEach((c) => { if (!c.isT && c.shape === best) c.isNoGo = true; });
    }
  }

  const targetCount = cells.filter((c) => c.isT).length;
  return {
    mode: 'level',
    diff,
    lv,
    /* Rules in force on THIS board, so every consumer — the cue card, the HUD,
       the tap handler, the results — reads one source rather than each
       re-deriving the section from the level number. */
    noGo: noGoShape,
    drift: !!opts.drift,
    /*
     * `grid` is the COLUMN count, and equals `rows` on a square board. It stays
     * because every consumer that reads it wants columns: index.jsx derives
     * row/col for the Center-of-Cancellation from `idx / grid`, and the art-set
     * hash just needs a stable field. `cols`/`rows` are the honest names — new
     * code should read those.
     */
    grid: board.cols,
    cols: board.cols,
    rows: board.rows,
    pool: cfg.pool,
    tc: targetCount,
    tlim,
    target: built.tgt,
    /* null on every non-dual round, and every caller must treat it that way —
       the HUD, the cue card and the coach all read it. */
    target2: built.tgt2 ?? null,
    targetCol: built.tgtCol,
    searchMode,
    interference: cfg.interference,
    cells,
  };
}

/**
 * Pass-n-Play difficulty presets. The pass-and-play challenge is a single fair
 * board every player faces; difficulty picks its shape, target count, time
 * limit, and which curriculum level supplies the distractor pool.
 *
 * Boards match PLAY_BOARD, so a phone gets thumb-sized pieces here too — this
 * is the mode most likely to be played by passing one handset around, which
 * makes a 33px target the worst possible thing to hand someone.
 *   easy   — 5×5, few object types
 *   medium — 6×8 with colour interference
 *   hard   — 7×9, most objects and the densest board
 */
export const PASS_PLAY_CONFIG = {
  easy:   { cols: 4, rows: 5, grid: 4, tc: 6,  tlim: 30, poolLevel: 49 },
  medium: { cols: 5, rows: 7, grid: 5, tc: 10, tlim: 32, poolLevel: 59 },
  hard:   { cols: 6, rows: 8, grid: 6, tc: 14, tlim: 38, poolLevel: 79 },
};

/**
 * Build a deterministic challenge seed for the chosen difficulty. Every choice
 * (target identity, target colour, distractor shapes, cell ordering, distractor
 * fill colours) is drawn from a single seeded LCG, so the resulting
 * `seed.cells` array is the authoritative layout — every player who plays this
 * challenge sees a bit-identical grid. Fairness is preserved across turns/rounds.
 */
export function prepareChallengeSeed(diff = 'hard') {
  const cfg = PASS_PLAY_CONFIG[diff] ?? PASS_PLAY_CONFIG.hard;
  // Use the same pool mapping as level mode (shape pools are 20 entries, so map
  // the curriculum level through getLvCfg rather than indexing SP directly).
  const { pool } = getLvCfg(diff, Math.min(cfg.poolLevel, FQ_LEVELS_PER_TIER - 1));
  const pal = PAL[diff] || PAL.hard;
  const board = normalizeBoard({ cols: cfg.cols, rows: cfg.rows });
  const grid = board.cols;   // `grid` is the COLUMN count; see prepareLevelRound
  const tc = cfg.tc;
  const total = board.total;
  // Mix epoch ms with one Math.random() draw so two seeds requested in the
  // same millisecond still diverge.
  const seedNum = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  const rng = makeLcgRng(seedNum);
  const tgt = pool[Math.floor(rng() * pool.length)];
  const tgtCol = pal[Math.floor(rng() * pal.length)];
  const dist = pool.filter((s) => s !== tgt);
  // Same smart spatial placement as level mode, but seeded so every player who
  // plays this challenge sees a bit-identical grid (quadrant-balanced, spaced).
  const eccentricityBias = computeEccentricityBias(
    Math.min(cfg.poolLevel, FQ_LEVELS_PER_TIER - 1),
    diff,
  );
  const targetPos = chooseTargetPositions(board, tc, rng, { eccentricityBias });
  // Bake fill colours so every player sees the exact same coloured grid.
  // Categorical on every tier — hard used to bake an ≈82% conjunction here, the
  // same mechanic buildCellsFromParams dropped; see the note there. Half the
  // distractors still take the target's hue so colour cannot guide the search,
  // but the target OBJECT never appears in a second colour.
  const cellsWithFill = new Array(total);
  for (let i = 0; i < total; i++) {
    if (targetPos.has(i)) {
      cellsWithFill[i] = { shape: tgt, isT: true, fill: tgtCol };
    } else {
      cellsWithFill[i] = {
        shape: dist[Math.floor(rng() * dist.length)],
        isT: false,
        fill: rng() < 0.5 ? tgtCol : pal[Math.floor(rng() * pal.length)],
      };
    }
  }
  return {
    pool, tgt, tgtCol, cells: cellsWithFill, grid, cols: board.cols, rows: board.rows,
    tc, seed: seedNum, diff, tlim: cfg.tlim,
  };
}

export function prepareChallengePlayState(cSeed, tlimOverride) {
  // Use baked fills directly — no re-randomisation. Two players invoking this
  // with the same cSeed get identical `cells` arrays (modulo per-cell react ids).
  const cells = cSeed.cells.map((c, i) => ({
    shape: c.shape,
    isT: c.isT,
    fill: c.fill,
    col: null,
    id: i,
    tapped: false,
    feedback: null,
  }));
  const targetCount = cells.filter((c) => c.isT).length;
  const diff = cSeed.diff || 'hard';
  return {
    mode: 'challenge',
    diff,
    lv: 'CH',
    grid: cSeed.grid,
    // Carried through, or the board renders as a square of the column count.
    cols: cSeed.cols ?? cSeed.grid,
    rows: cSeed.rows ?? cSeed.grid,
    pool: cSeed.pool,
    tc: targetCount,
    tlim: tlimOverride ?? cSeed.tlim ?? 50,
    target: cSeed.tgt,
    targetCol: cSeed.tgtCol,
    searchMode: 'categorical',
    interference: 0,
    cells,
  };
}

/**
 * Compute end-of-round metrics.
 *
 * `taps` is an array of inter-tap milliseconds plus the search-onset latency for
 * the first tap (collected by the game loop). We filter out implausibly fast
 * taps (<50 ms — double-touch noise) and idle gaps (>30 s — likely user paused
 * or got distracted) before averaging, matching standard practice in cancellation
 * task analysis.
 *
 * Returns:
 *   ies / score — Rate-Correct Score (Woltz & Was 2006): items per second
 *     weighted by accuracy, scaled ×1000. Higher is better. The UI surfaces this.
 *   iesMs       — true Inverse Efficiency Score (Townsend & Ashby 1983): mean
 *     RT divided by accuracy, in ms. Lower is better. Reported only when the
 *     error rate is < 15 % (Bruyer & Brysbaert 2011 validity gate); else null.
 *   iesValid    — boolean flag for the IES validity gate.
 *   avgRt       — robust mean of inter-tap RT, in ms.
 */
export function computeRoundStats({ tlim, tl, found, errors, tc, taps, diff, won }) {
  const timeUsed = +(tlim - tl).toFixed(1);
  const total = found + errors;
  const acc = total > 0 ? Math.round((found / total) * 100) : 100;
  const accRaw = total > 0 ? found / total : 1;
  const tapList = Array.isArray(taps) ? taps : [];
  // Trim implausible RTs before averaging (Whelan 2008, robust RT analysis).
  const validTaps = tapList.filter((t) => t > 50 && t < 30000);
  const meanRtMs = validTaps.length
    ? validTaps.reduce((s, x) => s + x, 0) / validTaps.length
    : null;
  const avgRt = meanRtMs != null ? Math.round(meanRtMs) : 999;
  const tps = timeUsed > 0 ? +(found / timeUsed).toFixed(3) : 0;
  // RCS denominator: prefer real per-tap RT, fall back to time-per-found.
  const rtSecForScore =
    meanRtMs != null && meanRtMs >= 100
      ? meanRtMs / 1000
      : found > 0
        ? timeUsed / found
        : timeUsed + 1;
  let ies = +(1000 * (accRaw / rtSecForScore)).toFixed(1);
  // Tap-spam clamp: if the player tapped wildly more than 2.5× the target
  // count, halve the score so brute-forcing can't beat focused search.
  if (total > tc * 2.5) ies = +(ies * 0.5).toFixed(1);
  const score = Math.max(0, ies);
  // True IES — published, lower-is-better, ms — gated on Bruyer & Brysbaert
  // validity (error rate must be < 15 %).
  const errRate = total > 0 ? errors / total : 0;
  const iesValid = accRaw > 0 && errRate < 0.15 && meanRtMs != null;
  const iesMs = iesValid ? Math.round(meanRtMs / accRaw) : null;
  return { timeUsed, acc, avgRt, tps, ies, score, accRaw, won, iesMs, iesValid };
}

export function isLevelUnlocked(diff, lv, doneMap) {
  if (lv === 1) return true;
  const key = (d, L) => d + '-' + L;
  return !!(doneMap[key(diff, lv - 1)] || doneMap[key(diff, lv)]);
}

export function settingsKey() {
  return 'mm_fq_settings_v1';
}

export function loadGameSettings() {
  try {
    const d = JSON.parse(localStorage.getItem(settingsKey()) || '{}');
    // Default off for fast start; set countdown: true in storage to enable 3-2-1.
    return { countdown: d.countdown === true, sound: d.sound !== false };
  } catch {
    return { countdown: false, sound: true };
  }
}
