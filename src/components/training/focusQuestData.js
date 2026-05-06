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
  inter: {label:'Intermediate',lvc:'lvi', col:'#7ab8c4', grid:7,  bt:75,  ts:1.3, pop:'Top 50%'},
  hard:  {label:'Hard',        lvc:'lvh', col:'#e8c47a', grid:8,  bt:60,  ts:1.2, pop:'Top 20%'},
  xhard: {label:'Extra Hard',  lvc:'lvx', col:'#e8a07a', grid:9,  bt:50,  ts:1.1, pop:'Top 5%'},
  deadly:{label:'Deadly',      lvc:'lvd', col:'#c97a7a', grid:10, bt:22,  ts:0.35, pop:'Top 1% of humanity'},
};

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
  inter:[
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

export const PAL={
  easy:  ['#6b9e7a','#7ab8c4','#9a7ab8','#c4a87a'],
  inter: ['#5a8eb8','#7a9ab8','#6a8aaa','#8ab0cc'],
  hard:  ['#c4a87a','#b87a7a','#7a9ab8','#8ab87a'],
  xhard: ['#b87a7a','#9a7ab8','#7a8ab8','#b8a07a'],
  deadly: ['#2e6f95', '#c45d35', '#4a7c59', '#7a3e6e'], // high-Δ hue: conjunction stays legible at small size
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
export const TIER_TIME_ENDPOINTS = {
  easy:   { L1: 30,  L20: 10 },  // 5×5 feature search, ≤13 targets
  inter:  { L1: 40,  L20: 12 },  // 7×7 feature search, ≤15 targets
  hard:   { L1: 60,  L20: 18 },  // 8×8 feature+binding, ≤18 targets
  xhard:  { L1: 90,  L20: 30 },  // 9×9 conjunction, ≤20 targets
  deadly: { L1: 120, L20: 55 },  // 10×10 conjunction, ≤32 targets
};

/** Logistic steepness across the 20-level curriculum. */
const LEVEL_LOGISTIC_K = 0.35;
/** 1-based level where the logistic crosses its mid-point. */
const LEVEL_LOGISTIC_MID = 10.5;
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
  return ep.L20 + (ep.L1 - ep.L20) * levelSigmoid(level1Based);
}

/** Target-count curve per tier: endpoints (n0,n1) and gamma>0 (gamma>1 → easier early). */
export const TARGET_CURVE = {
  easy:  { n0: 3, n1: 13, gamma: 1.0 },
  inter: { n0: 7, n1: 15, gamma: 1.0 },
  hard:  { n0: 9, n1: 18, gamma: 1.0 },
  xhard: { n0: 12, n1: 20, gamma: 1.0 },
  /** Deadly: slightly lower caps + gentler exponent so late levels stay hard but fair. */
  deadly: { n0: 20, n1: 32, gamma: 1.04 },
};

/** Minimum non-target cells to keep (visual variety + generator stability). */
const MIN_NON_TARGET_CELLS = 3;

function buildMonotonicTargetSeries(diff) {
  const p = TARGET_CURVE[diff];
  const grid = DM[diff].grid;
  const cap = Math.min(p.n1, grid * grid - MIN_NON_TARGET_CELLS);
  const arr = [];
  for (let li = 0; li < 20; li++) {
    const u = li / 19;
    const raw = p.n0 + (p.n1 - p.n0) * Math.pow(u, p.gamma);
    let tc = Math.round(raw);
    tc = Math.max(p.n0, Math.min(p.n1, tc));
    tc = Math.min(cap, Math.max(3, tc));
    arr.push(tc);
  }
  for (let i = 1; i < 20; i++) {
    if (arr[i] < arr[i - 1]) arr[i] = arr[i - 1];
  }
  for (let i = 0; i < 20; i++) {
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
  const t = ep.L20 + (ep.L1 - ep.L20) * levelSigmoid(level);
  return +Math.max(ABSOLUTE_TIME_FLOOR_SEC, t).toFixed(1);
}

/**
 * Colour-noise on distractors [0,1]. Deadly uses a slower ramp so early deadly stays scannable.
 * Standard: I = min(1, max(0, (li - 4) / 10))
 * Deadly:   I = min(1, max(0, (li - 5) / 11))
 */
export function computeFeatureInterference(li, diff) {
  if (diff === 'deadly') {
    return +Math.min(1.0, Math.max(0, (li - 5) / 11)).toFixed(2);
  }
  return +Math.min(1.0, Math.max(0, (li - 4) / 10)).toFixed(2);
}

/** One row for tooling / UI: reproducible description of level parameters. */
export function getLevelDifficultyModel(diff, li) {
  const m = DM[diff];
  const level = li + 1;
  const pool = SP[diff][li];
  const area = m.grid * m.grid;
  const tc = TC[diff][li];
  const interference = computeFeatureInterference(li, diff);
  const search =
    diff === 'xhard' || diff === 'deadly' ? 'conjunction' : 'featureSingleton';
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

export function getLvCfg(diff, li) {
  const m = DM[diff];
  const time = sigmoidTime(diff, li);
  const interference = computeFeatureInterference(li, diff);
  return {
    pool: SP[diff][li],
    tc: TC[diff][li],
    time,
    grid: m.grid,
    interference,
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

export function buildCellsFromParams(grid, pool, tc, diff, seed, interference) {
  const searchMode = (diff === 'xhard' || diff === 'deadly') ? 'identity' : 'categorical';
  const pal = PAL[diff] || PAL.easy;
  const tgt = seed?.tgt ?? pool[Math.floor(Math.random() * pool.length)];
  const tgtCol = seed?.tgtCol ?? pal[Math.floor(Math.random() * pal.length)];
  const dist = pool.filter((s) => s !== tgt);
  if (dist.length === 0) {
    throw new Error(
      `focusQuestData: distractor pool empty (need ≥2 distinct shapes). pool=${JSON.stringify(pool)} tgt=${tgt}`,
    );
  }
  const total = grid * grid;
  let cells = [];
  // Never ask for more targets than cells; keeps UI count and grid in sync.
  const guaranteedTc = Math.min(Math.max(tc, 3), total);
  const useFeatureBinding = diff === 'hard' || diff === 'xhard' || diff === 'deadly';
  if (searchMode === 'identity') {
    for (let k = 0; k < guaranteedTc; k++) cells.push({ shape: tgt, col: tgtCol, isT: true });
    while (cells.length < total) {
      const r = Math.random();
      if (useFeatureBinding && r < 0.5) {
        if (r < 0.25) {
          const othCols = pal.filter((c) => c !== tgtCol);
          const dcol = othCols[Math.floor(Math.random() * othCols.length)] || pal[0];
          cells.push({ shape: tgt, col: dcol, isT: false });
        } else {
          const dshp = dist[Math.floor(Math.random() * dist.length)];
          cells.push({ shape: dshp, col: tgtCol, isT: false });
        }
      } else {
        const dshp = dist[Math.floor(Math.random() * dist.length)];
        const dcol = pal[Math.floor(Math.random() * pal.length)];
        cells.push({ shape: dshp, col: dcol, isT: false });
      }
    }
  } else {
    for (let k = 0; k < guaranteedTc; k++) cells.push({ shape: tgt, col: null, isT: true });
    while (cells.length < total) {
      const dshp = dist[Math.floor(Math.random() * dist.length)];
      const dcol = useFeatureBinding && Math.random() < 0.5 ? tgtCol : pal[Math.floor(Math.random() * pal.length)];
      cells.push({ shape: dshp, col: dcol, isT: false });
    }
  }
  fisherYatesInPlace(cells);
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

/** Linear curriculum for Free mode: easy 1–20 → … → deadly 20, then stays at deadly 20. */
export const FREE_PROGRESS_ORDER = ['easy', 'inter', 'hard', 'xhard', 'deadly'];

/** Starting session bank (seconds); clock runs continuously across rounds until 0.
 *  Sized so the first easy round (par ≈ 30 s under new endpoints) is comfortable. */
export const FREE_SESSION_START_SEC = 60;

/** Hard cap on bank so bonuses cannot pile up without bound. Sized to accommodate
 *  a single attempt at deadly L1 (par ≈ 120 s) from a healthy mid-game bank. */
export const FREE_SESSION_CAP_SEC = 240;

/**
 * Session-clock drain multiplier (1.0 = real-time). Ramps slowly across the
 * curriculum so late-tier rounds feel tighter — but late-game pressure should
 * come mainly from larger set sizes and harder search, not from a faster bleed.
 *   mult = 1 + min(cap, k · stageIndex)
 */
export function freeTimeDrainMultiplier(stageIndex) {
  const s = Math.max(0, stageIndex | 0);
  const k = 0.0035;
  const cap = 0.18;
  return 1 + Math.min(cap, k * s);
}

/**
 * Bonus seconds awarded after clearing the free round at `stageCompleted`
 * (0 = first round). Scales with the round's nominal par so deep, long rounds
 * refund proportionally; decays harmonically with stage depth so skilled runs
 * can still go deep without becoming infinite.
 *
 *   bonus = clamp( B_min, B_max,  b0 + u(s) · (b1 + k · par) )
 *   u(s)  = 1 / (1 + s / τ)
 *
 * Coefficients tuned so deadly-tier rounds (par 55–120 s) refund 12–22 s,
 * keeping bank dynamics non-trivially positive for skilled players in mid-game
 * and approximately neutral at the upper tail.
 */
export function freeClearBonusSec(stageCompleted, nominalParSec) {
  const s = Math.max(0, stageCompleted | 0);
  const par = Math.max(6, Number(nominalParSec) || 20);
  const tau = 28;
  const u = 1 / (1 + s / tau);
  const raw = 4.2 + u * (8 + 0.5 * par);
  const bonus = Math.min(60, Math.max(3.2, raw));
  return +bonus.toFixed(1);
}

export function freeStageToDiffLv(stageIndex) {
  const s = Math.max(0, stageIndex | 0);
  const maxLinear = FREE_PROGRESS_ORDER.length * 20 - 1;
  const capped = Math.min(s, maxLinear);
  const diffIx = Math.floor(capped / 20);
  const lv = (capped % 20) + 1;
  return { diff: FREE_PROGRESS_ORDER[diffIx], lv };
}

export function prepareFreeRound(stageIndex) {
  const { diff, lv } = freeStageToDiffLv(stageIndex);
  const base = prepareLevelRound(diff, lv);
  return { ...base, mode: 'free', freeStage: stageIndex };
}

export function prepareLevelRound(diff, lv) {
  const cfg = getLvCfg(diff, lv - 1);
  const pal = PAL[diff] || PAL.easy;
  const lockedTarget = cfg.pool[Math.floor(Math.random() * cfg.pool.length)];
  const lockedCol = pal[Math.floor(Math.random() * pal.length)];
  const searchMode = diff === 'xhard' || diff === 'deadly' ? 'identity' : 'categorical';
  const built = buildCellsFromParams(cfg.grid, cfg.pool, cfg.tc, diff, { tgt: lockedTarget, tgtCol: lockedCol }, cfg.interference);
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
 * Build a deterministic challenge seed. Every choice (target identity, target
 * colour, distractor shapes, cell ordering, distractor fill colours) is drawn
 * from a single seeded LCG, so the resulting `seed.cells` array is the
 * authoritative layout — every player who plays this challenge sees a
 * bit-identical grid. Fairness is preserved across player turns and rounds.
 */
export function prepareChallengeSeed() {
  const pool = SP.xhard[8];
  const pal = PAL.xhard;
  const grid = 9;
  const tc = 15;
  const total = grid * grid;
  // Mix epoch ms with one Math.random() draw so two seeds requested in the
  // same millisecond still diverge.
  const seedNum = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  const rng = makeLcgRng(seedNum);
  const tgt = pool[Math.floor(rng() * pool.length)];
  const tgtCol = pal[Math.floor(rng() * pal.length)];
  const dist = pool.filter((s) => s !== tgt);
  const cells = [];
  for (let i = 0; i < tc; i++) cells.push({ shape: tgt, isT: true });
  while (cells.length < total) {
    cells.push({ shape: dist[Math.floor(rng() * dist.length)], isT: false });
  }
  fisherYatesInPlace(cells, rng);
  // Bake fill colours so every player sees the exact same coloured grid.
  // Challenge mode runs interference=0; non-target fills draw uniformly from the
  // tier palette using the same seeded rng.
  const cellsWithFill = cells.map((c) => ({
    shape: c.shape,
    isT: c.isT,
    fill: c.isT ? tgtCol : pal[Math.floor(rng() * pal.length)],
  }));
  return { pool, tgt, tgtCol, cells: cellsWithFill, grid, tc, seed: seedNum };
}

export function prepareChallengePlayState(cSeed, tlim = 50) {
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
  return {
    mode: 'challenge',
    diff: 'xhard',
    lv: 'CH',
    grid: cSeed.grid,
    pool: cSeed.pool,
    tc: targetCount,
    tlim,
    target: cSeed.tgt,
    targetCol: cSeed.tgtCol,
    searchMode: 'identity',
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
