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
// Level mathematics (visual search / selective attention)
// -----------------------------------------------------------------------------
// Scientific basis (simplified): pop-out vs conjunction search: as distractors
// resemble the target on more feature dimensions, search becomes serial and
// RT grows with display set size; interference ramps feature overlap on colour.
//
// 1) Time limit T(li): logistic in game level L = li+1
//    T_raw(L) = A + R / (1 + exp(k(L - L0)))
//    Then scale by difficulty tier (easy … deadly) for global pacing.
//
// 2) Target count T_n(li): convex target span [n0, n1] over normalized progress
//    u = li/19,  T* = n0 + (n1 - n0) * u^gamma; rounded, capped to grid, then
//    forced monotone non-decreasing in li so difficulty never “relaxes”
//    within a tier.
//
// 3) Feature interference I(li): ramps from 0 after early levels so colour
//    noise on distractors increases gradually: I = clamp((li - 4) / 10, 0, 1).
// =============================================================================

/** Logistic time curve parameters (seconds). Inflection at L0 ≈ mid curriculum. */
export const TIME_LOGISTIC = {
  /** Baseline floor of logistic (before tier scale). */
  asymptoteLow: 15,
  /** Height of logistic curve. */
  amplitude: 75,
  /** Steepness; larger → sharper transition around inflection. */
  k: 0.4,
  /** Game level (1-based) where slope is steepest. */
  inflectionLevel: 10,
};

/** Per-tier scale on raw logistic (smaller → stricter time on same shape of curve). */
export const DIFFICULTY_TIME_SCALE = {
  easy: 1.0,
  inter: 0.88,
  hard: 0.72,
  xhard: 0.58,
  deadly: 0.52,
};

export const TIME_FLOOR_SEC = 10;

/**
 * Raw logistic time at game level L (1..20): higher L → less time (asymptotic low A).
 * T(L) = A_low + R / (1 + exp(k(L - L0)))
 */
export function rawLogisticTimeSeconds(level1Based) {
  const { asymptoteLow, amplitude, k, inflectionLevel } = TIME_LOGISTIC;
  return asymptoteLow + amplitude / (1 + Math.exp(k * (level1Based - inflectionLevel)));
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

export function sigmoidTime(diff, li) {
  const level = li + 1;
  const base = rawLogisticTimeSeconds(level);
  const scale = DIFFICULTY_TIME_SCALE[diff] ?? 1;
  const t = base * scale;
  const floor = diff === 'deadly' ? 12 : TIME_FLOOR_SEC;
  return +Math.max(floor, t).toFixed(1);
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
  cells.sort(() => Math.random() - 0.5);
  return { cells, tgt, tgtCol, tc: guaranteedTc };
}

export function assignFillColors(cells, diff, interference, tgtCol) {
  const pal = PAL[diff] || PAL.easy;
  const tgtColIdx = pal.indexOf(tgtCol) >= 0 ? pal.indexOf(tgtCol) : 0;
  return cells.map((cell) => {
    let fill;
    if (cell.col) {
      fill = cell.col;
    } else if (cell.isT) {
      fill = tgtCol;
    } else if (interference > 0) {
      if (Math.random() < interference * 0.7) {
        const adj = (tgtColIdx + Math.floor(Math.random() * 2) + 1) % pal.length;
        fill = pal[adj];
      } else fill = pal[Math.floor(Math.random() * pal.length)];
    } else {
      fill = pal[Math.floor(Math.random() * pal.length)];
    }
    return { ...cell, fill };
  });
}

/** Linear curriculum for Free mode: easy 1–20 → … → deadly 20, then stays at deadly 20. */
export const FREE_PROGRESS_ORDER = ['easy', 'inter', 'hard', 'xhard', 'deadly'];

/** Starting session bank (seconds); clock runs continuously across rounds until 0. */
export const FREE_SESSION_START_SEC = 52;

/** Hard cap on bank so bonuses cannot pile up without bound. */
export const FREE_SESSION_CAP_SEC = 210;

/**
 * How fast the session clock drains at this stage (1 = real-time).
 * Mild rational ramp: mult = 1 + min(cap, k * s) so late survival feels tighter but stays fair.
 */
export function freeTimeDrainMultiplier(stageIndex) {
  const s = Math.max(0, stageIndex | 0);
  const k = 0.0048;
  const cap = 0.2;
  return 1 + Math.min(cap, k * s);
}

/**
 * Bonus seconds after clearing free round at `stageCompleted` (0 = first round finished).
 * Scales with nominal par time for that round and decays with depth so skilled runs can go deep.
 *
 *   bonus = clamp( B_min, B_max,  b0 + u(s) * (b1 + k * par) )
 *   u(s) = 1 / (1 + s / τ)   (harmonic-style decay, τ controls mid-game)
 */
export function freeClearBonusSec(stageCompleted, nominalParSec) {
  const s = Math.max(0, stageCompleted | 0);
  const par = Math.max(6, Number(nominalParSec) || 20);
  const tau = 22;
  const u = 1 / (1 + s / tau);
  const raw = 4.2 + u * (6.4 + 0.36 * par);
  const bonus = Math.min(40, Math.max(3.2, raw));
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

export function prepareChallengeSeed() {
  const pool = SP.xhard[8];
  const pal = PAL.xhard;
  const tgt = pool[Math.floor(Math.random() * pool.length)];
  const tgtCol = pal[Math.floor(Math.random() * pal.length)];
  const dist = pool.filter((s) => s !== tgt);
  const grid = 9;
  const tc = 15;
  const total = grid * grid;
  let cells = [];
  for (let i = 0; i < tc; i++) cells.push({ shape: tgt, isT: true });
  while (cells.length < total) cells.push({ shape: dist[Math.floor(Math.random() * dist.length)], isT: false });
  let s = Date.now();
  function rnd() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  }
  const a = [...cells];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return { pool, tgt, tgtCol, cells: a, grid, tc };
}

export function prepareChallengePlayState(cSeed, tlim = 50) {
  const diff = 'xhard';
  const cellsRaw = cSeed.cells.map((c) => ({ shape: c.shape, isT: c.isT }));
  const withFill = assignFillColors(cellsRaw, diff, 0, cSeed.tgtCol);
  const cells = withFill.map((c, i) => ({ ...c, id: i, tapped: false, feedback: null }));
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

export function computeRoundStats({ tlim, tl, found, errors, tc, taps, diff, won }) {
  const timeUsed = +(tlim - tl).toFixed(1);
  const total = found + errors;
  const acc = total > 0 ? Math.round((found / total) * 100) : 100;
  const accRaw = total > 0 ? found / total : 1;
  const avgRt = taps.length ? Math.round(taps.reduce((s, x) => s + x, 0) / taps.length) : 999;
  const tps = timeUsed > 0 ? +(found / timeUsed).toFixed(3) : 0;
  const meanRtSec = found > 0 ? timeUsed / found : timeUsed + 1;
  let ies = +(1000 * (accRaw / meanRtSec)).toFixed(1);
  if (total > tc * 2.5) ies = +(ies * 0.5).toFixed(1);
  const score = Math.max(0, ies);
  return { timeUsed, acc, avgRt, tps, ies, score, accRaw, won };
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
