// Auto-extracted from FocusQuest — shapes, pools, level config, scoring
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
  moon:      `<path d="M62,12 A38,38 0 1,0 62,88 A28,28 0 1,1 62,12Z" fill="currentColor"/>`,
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
  tinyMoon:  `<path d="M60,14 A36,36 0 1,0 60,86 A26,26 0 1,1 60,14Z" fill="currentColor"/>`,
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

// Shape pools — increasingly similar within each mode
export const SP={
  easy:[
    ['circle','square','triangle','diamond'],
    ['circle','square','triangle','diamond','pentagon'],
    ['circle','square','triangle','pentagon','hexagon'],
    ['circle','square','triangle','star','diamond'],
    ['circle','square','triangle','star','cross'],
    ['circle','square','triangle','star','cross','diamond'],
    ['circle','square','triangle','star','heart','diamond'],
    ['circle','square','triangle','star','cross','lightning'],
    ['circle','square','triangle','star','cross','pentagon','heart'],
    ['circle','square','triangle','star','cross','pentagon','hexagon'],
    ['circle','square','pentagon','star','cross','hexagon','heart'],
    ['circle','square','triangle','star','cross','pentagon','hexagon','diamond'],
    ['circle','triangle','star','cross','heart','diamond','lightning'],
    ['circle','square','triangle','star','cross','pentagon','hexagon','diamond'],
    ['circle','square','triangle','star','cross','pentagon','hexagon','lightning'],
    ['circle','square','triangle','star','cross','pentagon','hexagon','diamond','lightning'],
    ['circle','square','triangle','star','cross','pentagon','hexagon','diamond','heart'],
    ['circle','square','triangle','star','cross','pentagon','hexagon','diamond','heart','lightning'],
    ['circle','square','triangle','star','cross','pentagon','hexagon','diamond','heart','moon'],
    ['circle','square','triangle','star','cross','pentagon','hexagon','diamond','heart','moon','lightning'],
  ],
  medium:[
    ['circle','roundsq','triangle','diamond','star'],
    ['circle','roundsq','ovalH','star','diamond'],
    ['circle','roundsq','ovalH','ovalV','star'],
    ['circle','ovalH','ovalV','triangle','triFlat'],
    ['circle','ovalH','ovalV','roundsq','square'],
    ['triangle','triR','triFlat','diamond','star'],
    ['triangle','triR','triFlat','arrowR','star'],
    ['hexagon','hexTall','pentagon','diamond','star'],
    ['circle','ovalH','ovalV','roundsq','semicircle'],
    ['circle','ovalH','roundsq','semicircle','heart'],
    ['triangle','triR','triFlat','arrowR','arrowL'],
    ['hexagon','hexTall','pentagon','diamond','rhombus'],
    ['circle','ovalH','ovalV','roundsq','semicircle','moon'],
    ['circle','ovalH','ovalV','roundsq','heart','moon'],
    ['triangle','triR','triFlat','arrowR','arrowL','lightning'],
    ['hexagon','hexTall','pentagon','diamond','rhombus','parallelR'],
    ['circle','ovalH','ovalV','semicircle','moon','heart','roundsq'],
    ['triangle','triR','triFlat','arrowR','arrowL','lightning','cross'],
    ['circle','ovalH','ovalV','moon','heart','semicircle','shield'],
    ['hexagon','hexTall','pentagon','diamond','rhombus','parallelR','trapezoid'],
  ],
  hard:[
    ['circle','ovalH','ovalV','semicircle'],
    ['circle','ovalH','ovalV','moon'],
    ['circle','ovalH','ovalV','roundsq'],
    ['triangle','triR','triFlat','arrowR'],
    ['triangle','triFlat','arrowR','arrowL'],
    ['hexagon','hexTall','pentagon','rhombus'],
    ['square','roundsq','diamond','hexagon'],
    ['circle','ovalH','semicircle','moon'],
    ['circle','ovalH','ovalV','semicircle','moon'],
    ['triangle','triR','triFlat','arrowR','arrowL'],
    ['hexagon','hexTall','pentagon','rhombus','parallelR'],
    ['circle','ovalH','ovalV','semicircle','moon','heart'],
    ['triangle','triR','triFlat','arrowR','arrowL','lightning'],
    ['square','roundsq','diamond','hexagon','hexTall'],
    ['circle','ovalH','ovalV','semicircle','moon','heart','shield'],
    ['triangle','triR','triFlat','arrowR','arrowL','lightning','cross'],
    ['hexagon','hexTall','pentagon','rhombus','parallelR','trapezoid'],
    ['circle','ovalH','ovalV','semicircle','moon','heart','shield','roundsq'],
    ['triangle','triR','triFlat','arrowR','arrowL','lightning','cross','star'],
    ['hexagon','hexTall','pentagon','rhombus','parallelR','trapezoid','diamond'],
  ],
  xhard:[
    ['circle','ovalH','ovalV','semicircle'],
    ['circle','ovalH','semicircle','moon'],
    ['triangle','triR','triFlat','arrowR'],
    ['triangle','triR','arrowR','arrowL'],
    ['hexagon','hexTall','rhombus','parallelR'],
    ['circle','ovalH','ovalV','moon'],
    ['circle','ovalH','ovalV','semicircle','moon'],
    ['triangle','triR','triFlat','arrowR','arrowL'],
    ['hexagon','hexTall','rhombus','parallelR','trapezoid'],
    ['square','roundsq','hexagon','hexTall','rhombus'],
    ['circle','ovalH','ovalV','semicircle','moon','heart'],
    ['triangle','triR','triFlat','arrowR','arrowL','lightning'],
    ['hexagon','hexTall','rhombus','parallelR','trapezoid','diamond'],
    ['circle','ovalH','ovalV','semicircle','moon','heart','shield'],
    ['triangle','triR','triFlat','arrowR','arrowL','lightning','cross'],
    ['circle','ovalH','ovalV','semicircle','ovalSq'],
    ['triangle','triR','triFlat','arrowR','moon'],
    ['hexagon','hexTall','rhombus','parallelR','ovalSq'],
    ['circle','ovalH','ovalV','moon','semicircle','heart'],
    ['triangle','triR','triFlat','arrowR','arrowL'],
  ],
  // DEADLY: near-identical shapes — ovals, semicircles, subtle curve variants.
  // Identity search requires shape + colour: palette must use clearly separable hues
  // (similar purple-only fills made "wrong tint" almost indistinguishable in tiny cells).
  deadly:[
    ['circle','almostCircle','fatOval','bigSemi'],
    ['ovalH','fatOval','ovalSq','almostCircle'],
    ['ovalV','thinOval','tallRect','circle'],
    ['circle','almostCircle','bigSemi','semicircle'],
    ['fatOval','ovalH','wideRect','ovalSq'],
    ['circle','almostCircle','fatOval','bigSemi','thinOval'],
    ['ovalV','thinOval','tallRect','circle','almostCircle'],
    ['ovalH','fatOval','ovalSq','wideRect','bigSemi'],
    ['circle','almostCircle','bigSemi','semicircle','fatOval'],
    ['circle','almostCircle','triangle','triR','triFlat'], // transition: rounds + early angles
    ['circle','almostCircle','fatOval','bigSemi','semicircle'],
    ['ovalV','thinOval','tallRect','circle','almostCircle','fatOval'],
    ['ovalH','fatOval','ovalSq','wideRect','bigSemi','almostCircle'],
    ['circle','almostCircle','bigSemi','semicircle','fatOval','tinyMoon'],
    ['circle','triR','triFlat','arrowR','arrowL'],
    ['circle','almostCircle','fatOval','bigSemi','semicircle','ovalH'],
    ['ovalV','thinOval','tallRect','circle','almostCircle','fatOval','wideRect'],
    ['ovalH','fatOval','ovalSq','wideRect','bigSemi','almostCircle','thinOval'],
    ['circle','almostCircle','bigSemi','semicircle','fatOval','tinyMoon','ovalH'],
    ['circle','almostCircle','fatOval','bigSemi','semicircle','ovalH','thinOval','wideRect'],
  ],
};

// Colour-vision-deficiency-safe categorical palette (Okabe-Ito subset: blue,
// orange, bluish-green, reddish-purple). These four stay distinguishable under
// protanopia/deuteranopia/tritanopia and are widely separated in CIELAB, so the
// conjunction (hard/identity) tier can bind shape × colour reliably. The old
// "medium" palette was four near-identical blues — colour was almost useless as
// a feature there. Same set across tiers; difficulty comes from shape similarity
// + interference, not from how confusable the base colours are.
export const CVD_SAFE_PALETTE = ['#0072B2', '#E69F00', '#009E73', '#CC79A7'];
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
// Per-level time T(diff, L) interpolates between two empirically-anchored
// endpoints with a logistic in L (1..20):
//   T_raw(L) = T20 + (T1 - T20) / (1 + exp(k (L - L_mid)))
// where T1 (beginner ceiling, ~3–4× expert search time) and T20 (expert
// performance floor, ~1.0–1.2× the search-slope ceiling for that tier+target
// count) come from TIER_TIME_ENDPOINTS below.
//
// Target counts and colour interference are unchanged in shape — both are
// already principled — but capped against the grid for safety.
// =============================================================================

/**
 * Per-tier time endpoints in seconds.
 *   L1  = beginner-friendly ceiling (generous; ~3× expert search time).
 *   L20 = expert performance floor, derived from
 *         per-target = 700 ms (Mesulam ~1.06 targets/s baseline)
 *                    + slope_ms × (set_size / 2)
 *         × target_count_at_L20 (TC[diff][19]).
 *   slope: 0 ms/item for feature, 12 ms/item for feature+colour binding,
 *   25 ms/item for conjunction search (mid of Wolfe 20–30 range).
 */
// Tightened 2026-06-25: the old endpoints gave ~3–4× expert search time even on
// the hardest levels, so every tier (Hard included) was trivially winnable with
// seconds to spare. These are anchored closer to real cancellation-task pace
// (~1 target/s feature search, slower for conjunction) so the clock is a genuine
// constraint: Easy stays approachable, Medium bites, Hard is meant to be hard.
export const TIER_TIME_ENDPOINTS = {
  easy:   { L1: 16, L100: 8 },
  medium: { L1: 24, L100: 11 },
  hard:   { L1: 42, L100: 17 },
};

/** Logistic steepness across the 20-level curriculum. */
const LEVEL_LOGISTIC_K = 0.35;
/** 1-based level where the logistic crosses its mid-point. */
const LEVEL_LOGISTIC_MID = 50.5;
/** Hard floor — no level ever drops below this even if endpoints are misconfigured. */
export const ABSOLUTE_TIME_FLOOR_SEC = 8;

/** Sigmoid weight at 1-based level (1.0 at L≪Lmid, 0 at L≫Lmid). */
function levelSigmoid(level1Based) {
  return 1 / (1 + Math.exp(LEVEL_LOGISTIC_K * (level1Based - LEVEL_LOGISTIC_MID)));
}

/**
 * Backwards-compatible shim. Returns the easy-tier curve when called without a
 * tier argument; new callers should use `sigmoidTime(diff, li)`.
 */
export function rawLogisticTimeSeconds(level1Based) {
  const ep = TIER_TIME_ENDPOINTS.easy;
  return ep.L100 + (ep.L1 - ep.L100) * levelSigmoid(level1Based);
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
 * Per-level time limit (seconds). Logistic interpolation between the
 * empirically-derived T1 and T20 endpoints for the tier. Strictly
 * non-increasing in L within a tier (audit invariant).
 */
export function sigmoidTime(diff, li) {
  const ep = TIER_TIME_ENDPOINTS[diff] ?? TIER_TIME_ENDPOINTS.easy;
  const level = li + 1;
  const t = ep.L100 + (ep.L1 - ep.L100) * levelSigmoid(level);
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
 * Conjunction strength for the HARD tier [0..1] — the fraction of distractors
 * that share a target feature (its colour OR its shape) rather than neither.
 *
 * This is the real difficulty lever for hard. In a true conjunction search the
 * target is defined by a COMBINATION of features, and it is only hard if NEITHER
 * feature isolates it: many distractors must share the target's colour (so you
 * can't just filter by colour) AND many must share its shape (so you can't filter
 * by shape). With few feature-sharing distractors, colour "guides" the search to
 * a small subset and the target pops out — which is why hard felt easy.
 *
 * Treisman & Gelade 1980 (conjunction = serial search); Duncan & Humphreys 1989
 * (search slows as target–distractor similarity and distractor heterogeneity
 * rise); Wolfe Guided Search (a unique feature guides search and must be denied).
 * Ramps 0.66 → 0.95 across the tier so even early hard demands real conjunction.
 */
export function computeConjunctionStrength(li, diff) {
  if (diff !== 'hard') return 0;
  const u = Math.max(0, Math.min(1, li / (FQ_LEVELS_PER_TIER - 1)));
  return +Math.min(0.95, 0.66 + 0.29 * u).toFixed(2);
}

/** One row for tooling / UI: reproducible description of level parameters. */
export function getLevelDifficultyModel(diff, li) {
  const m = DM[diff];
  const level = li + 1;
  const { pool } = getLvCfg(diff, li);
  const area = m.grid * m.grid;
  const tc = TC[diff][li];
  const interference = computeFeatureInterference(li, diff);
  const search =
    diff === 'hard' ? 'conjunction' : 'featureSingleton';
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

// Per-tier clock tightness (× the empirical sigmoid time). Hard is tightest so
// that, combined with a true conjunction search AND near-identical shapes,
// finding EVERY target before time runs out is genuinely hard, not a formality.
export const TIER_TIME_MULT = { easy: 0.8, medium: 0.72, hard: 0.62 };

/**
 * Shape pool for a level. The HARD tier ramps target–distractor SHAPE similarity
 * (Duncan & Humphreys 1989 — the dominant driver of search difficulty): it walks
 * from distinguishable curves (SP.hard) → similar (SP.xhard) → near-identical
 * (SP.deadly: almostCircle vs circle, fatOval vs ovalH). With the colour-or-shape
 * conjunction on top, a colour-sharing distractor is then same-colour AND nearly
 * the same shape as the target — so you must attend to each item to tell them
 * apart, instead of scanning by shape. This is the real "challenge attention"
 * lever; those harder pools existed but were never used.
 */
function poolForLevel(diff, li) {
  if (diff === 'hard') {
    const u = li / (FQ_LEVELS_PER_TIER - 1); // 0..1 across the tier
    const list = u < 0.3 ? SP.hard : u < 0.65 ? SP.xhard : SP.deadly;
    const idx = Math.max(0, Math.min(list.length - 1, Math.floor(u * list.length)));
    return list[idx];
  }
  const list = SP[diff] || SP.easy;
  return list[Math.max(0, Math.min(list.length - 1, Math.floor((li * list.length) / FQ_LEVELS_PER_TIER)))];
}

export function getLvCfg(diff, li) {
  const m = DM[diff];
  const pool = poolForLevel(diff, li);
  const time = Math.round(sigmoidTime(diff, li) * (TIER_TIME_MULT[diff] ?? 0.78));
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

/**
 * Choose grid indices (row-major, 0..N*N-1) for the targets. Returns a Set of
 * exactly `min(tc, N*N)` indices placed with quadrant balance, anti-clustering,
 * and eccentricity weighting (see header).
 */
export function chooseTargetPositions(grid, tc, rng = Math.random, opts = {}) {
  const N = grid;
  const total = N * N;
  const want = Math.max(0, Math.min(tc | 0, total));
  if (want === 0) return new Set();
  if (want >= total) return new Set(Array.from({ length: total }, (_, i) => i));

  const eccBias = Math.max(0, Math.min(1, opts.eccentricityBias ?? 0.3));
  const center = (N - 1) / 2;
  const maxEcc = Math.hypot(center, center) || 1;
  const rc = (idx) => [Math.floor(idx / N), idx % N];
  const ecc = (idx) => {
    const [r, c] = rc(idx);
    return Math.hypot(r - center, c - center) / maxEcc; // 0 centre … 1 corner
  };
  // Quadrant by sign of offset from centre. Cells on the centre cross (odd grids)
  // are dealt round-robin so the middle row/col isn't biased to one quadrant.
  let centreTie = 0;
  const quad = (idx) => {
    const [r, c] = rc(idx);
    const dr = r - center;
    const dc = c - center;
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

export function buildCellsFromParams(grid, pool, tc, diff, seed, interference, rng = Math.random) {
  const searchMode = diff === 'hard' ? 'identity' : 'categorical';
  const pal = PAL[diff] || PAL.easy;
  const tgt = seed?.tgt ?? pool[Math.floor(rng() * pool.length)];
  const tgtCol = seed?.tgtCol ?? pal[Math.floor(rng() * pal.length)];
  const dist = pool.filter((s) => s !== tgt);
  if (dist.length === 0) {
    throw new Error(
      `focusQuestData: distractor pool empty (need ≥2 distinct shapes). pool=${JSON.stringify(pool)} tgt=${tgt}`,
    );
  }
  const total = grid * grid;
  // Never ask for more targets than cells; keeps UI count and grid in sync.
  const guaranteedTc = Math.min(Math.max(tc, 3), total);
  const useFeatureBinding = diff === 'medium' || diff === 'hard';

  // Build target + distractor tokens separately, then place targets with the
  // smart spatial sampler and drop distractors into whatever cells are left.
  const targets = [];
  for (let k = 0; k < guaranteedTc; k++) {
    targets.push(
      searchMode === 'identity'
        ? { shape: tgt, col: tgtCol, isT: true }
        : { shape: tgt, col: null, isT: true },
    );
  }
  const distractors = [];
  const need = total - guaranteedTc;
  const othCols = pal.filter((c) => c !== tgtCol);
  const pickOthCol = () => othCols[Math.floor(rng() * othCols.length)] || pal[0];
  // Conjunction strength (hard only): share = fraction of distractors that share
  // a target feature; split evenly between colour-sharing and shape-sharing so
  // neither feature isolates the target. The rest share neither (easy rejects).
  const conj = Math.max(0, Math.min(0.98, seed?.conjunction ?? 0.8));
  for (let k = 0; k < need; k++) {
    if (searchMode === 'identity') {
      const r = rng();
      if (r < conj / 2) {
        // Shares the target COLOUR, different shape (defeats colour filtering).
        const dshp = dist[Math.floor(rng() * dist.length)];
        distractors.push({ shape: dshp, col: tgtCol, isT: false });
      } else if (r < conj) {
        // Shares the target SHAPE, different colour (defeats shape filtering).
        distractors.push({ shape: tgt, col: pickOthCol(), isT: false });
      } else {
        // Shares neither (a fast reject); keeps the board from being all-similar.
        distractors.push({ shape: dist[Math.floor(rng() * dist.length)], col: pickOthCol(), isT: false });
      }
    } else {
      const dshp = dist[Math.floor(rng() * dist.length)];
      const dcol = useFeatureBinding && rng() < 0.5 ? tgtCol : pal[Math.floor(rng() * pal.length)];
      distractors.push({ shape: dshp, col: dcol, isT: false });
    }
  }
  fisherYatesInPlace(distractors, rng);

  const targetPos = chooseTargetPositions(grid, guaranteedTc, rng, {
    eccentricityBias: seed?.eccentricityBias ?? 0.3,
  });
  const cells = new Array(total);
  let ti = 0;
  let di = 0;
  for (let i = 0; i < total; i++) {
    cells[i] = targetPos.has(i) ? targets[ti++] : distractors[di++];
  }
  return { cells, tgt, tgtCol, tc: guaranteedTc };
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
 *   hard  9×9 — rounds 9+    (conjunction search, climbs to max density, then holds)
 * Within a tier the position is mapped onto the curriculum level index
 * (`liStart..liEnd`) so it reuses the tuned time/target/interference curves.
 */
export const SURVIVAL_TIER_PLAN = [
  { diff: 'easy',   rounds: 4, liStart: 2,  liEnd: 78 },
  { diff: 'medium', rounds: 5, liStart: 6,  liEnd: 82 },
  { diff: 'hard',   rounds: 6, liStart: 8,  liEnd: 99 },
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

export function prepareFreeRound(stageIndex) {
  const { diff, lv } = survivalStageToDiffLv(stageIndex);
  const base = prepareLevelRound(diff, lv);
  return { ...base, mode: 'free', freeStage: stageIndex };
}

export function prepareLevelRound(diff, lv) {
  const cfg = getLvCfg(diff, lv - 1);
  const pal = PAL[diff] || PAL.easy;
  const lockedTarget = cfg.pool[Math.floor(Math.random() * cfg.pool.length)];
  const lockedCol = pal[Math.floor(Math.random() * pal.length)];
  const searchMode = diff === 'hard' ? 'identity' : 'categorical';
  const eccentricityBias = computeEccentricityBias(lv - 1, diff);
  const built = buildCellsFromParams(
    cfg.grid,
    cfg.pool,
    cfg.tc,
    diff,
    { tgt: lockedTarget, tgtCol: lockedCol, eccentricityBias, conjunction: cfg.conjunction },
    cfg.interference,
  );
  const withFill = assignFillColors(built.cells, diff, cfg.interference, built.tgtCol);
  const cells = withFill.map((c, i) => ({ ...c, id: i, tapped: false, feedback: null }));
  const targetCount = cells.filter((c) => c.isT).length;
  return {
    mode: 'level',
    diff,
    lv,
    grid: cfg.grid,
    pool: cfg.pool,
    tc: targetCount,
    tlim: cfg.time,
    target: built.tgt,
    targetCol: built.tgtCol,
    searchMode,
    interference: cfg.interference,
    cells,
  };
}

/**
 * Pass-n-Play difficulty presets. The pass-and-play challenge is a single fair
 * grid every player faces; difficulty picks the grid size, target count, time
 * limit, and which curriculum level supplies the distractor pool.
 *   easy   — 5×5 feature search (shape only)
 *   medium — 7×7 feature search with colour interference
 *   hard   — 9×9 conjunction (identity) search, the original challenge
 */
export const PASS_PLAY_CONFIG = {
  easy:   { grid: 5, tc: 8,  tlim: 30, poolLevel: 49 },
  medium: { grid: 7, tc: 13, tlim: 30, poolLevel: 59 },
  hard:   { grid: 9, tc: 17, tlim: 30, poolLevel: 79 },
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
  const grid = cfg.grid;
  const tc = cfg.tc;
  const total = grid * grid;
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
  const targetPos = chooseTargetPositions(grid, tc, rng, { eccentricityBias });
  // Bake fill colours so every player sees the exact same coloured grid. For the
  // HARD tier, use the same balanced conjunction as level mode (≈80% of
  // distractors share the target's colour or shape) so colour can't guide the
  // search — otherwise hard Pass-n-Play was a trivial pop-out. Easy/medium keep
  // shape-only search with random fills.
  const othCols = pal.filter((c) => c !== tgtCol);
  const pickOth = () => othCols[Math.floor(rng() * othCols.length)] || pal[0];
  const conj = diff === 'hard' ? 0.82 : 0;
  const cellsWithFill = new Array(total);
  for (let i = 0; i < total; i++) {
    if (targetPos.has(i)) {
      cellsWithFill[i] = { shape: tgt, isT: true, fill: tgtCol };
    } else if (conj > 0) {
      const r = rng();
      if (r < conj / 2) {
        cellsWithFill[i] = { shape: dist[Math.floor(rng() * dist.length)], isT: false, fill: tgtCol };
      } else if (r < conj) {
        cellsWithFill[i] = { shape: tgt, isT: false, fill: pickOth() };
      } else {
        cellsWithFill[i] = { shape: dist[Math.floor(rng() * dist.length)], isT: false, fill: pickOth() };
      }
    } else {
      cellsWithFill[i] = {
        shape: dist[Math.floor(rng() * dist.length)],
        isT: false,
        fill: pal[Math.floor(rng() * pal.length)],
      };
    }
  }
  return {
    pool, tgt, tgtCol, cells: cellsWithFill, grid, tc, seed: seedNum,
    diff, tlim: cfg.tlim,
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
    pool: cSeed.pool,
    tc: targetCount,
    tlim: tlimOverride ?? cSeed.tlim ?? 50,
    target: cSeed.tgt,
    targetCol: cSeed.tgtCol,
    searchMode: diff === 'hard' ? 'identity' : 'categorical',
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
