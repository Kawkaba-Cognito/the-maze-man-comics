/* =============================================================================
 * MEMO SPAN — visuospatial WORKING-MEMORY span (Corsi / Digit-Span-Backward)
 *
 * Objects sit in a fixed grid. A sequence of cells lights up one-by-one; the
 * player reproduces it by tapping the cells back — in the SAME order (forward
 * span = short-term storage) on the gentle on-ramp, then in REVERSE order
 * (backward span = working-memory MANIPULATION) for most of the game.
 *
 * This is the Corsi block-tapping test (Corsi 1972) plus the backward variant
 * used clinically (WAIS Digit Span Backward / Spatial Span Backward) — the
 * canonical measures of visuospatial working memory. Primary metric: span
 * (longest sequence reproduced), which feeds the assessment.
 * ========================================================================== */

import { objectIds } from './memoObjects';

export const MS_LEVELS_PER_TIER = 100;
export const MS_DIFF_KEYS = ['easy', 'medium', 'hard'];
export const MS_PROGRESS_ORDER = MS_DIFF_KEYS;
export const MS_FREE_LIVES = 3;

export const MS_DM = {
  easy: { label: 'Easy', pop: '6 cells · forward → reverse', lvc: 'lve' },
  medium: { label: 'Medium', pop: '9 cells · reverse · faster', lvc: 'lvm' },
  hard: { label: 'Hard', pop: '12 cells · reverse · long', lvc: 'lvh' },
};

/** Pass-n-Play presets per difficulty (fixed span + direction). */
export const MS_PASS_PLAY = {
  easy: { span: 5, backward: false, gridCells: 6 },
  medium: { span: 5, backward: true, gridCells: 9 },
  hard: { span: 6, backward: true, gridCells: 12 },
};

const TIER = {
  easy: { span: [2, 5], grid: 6, flash: [900, 650], gap: [350, 230] },
  medium: { span: [3, 6], grid: 9, flash: [820, 580], gap: [320, 200] },
  hard: { span: [4, 8], grid: 12, flash: [720, 480], gap: [280, 160] },
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rnd) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Columns for a given cell count (keeps the grid roughly square). */
export function colsFor(gridCells) {
  if (gridCells <= 6) return 3;
  if (gridCells <= 9) return 3;
  return 4;
}

/**
 * Whether a level uses REVERSE recall (working memory).
 * Forward only on the first 10 easy levels (on-ramp); reverse from then on, so
 * the overwhelming majority of the game trains working-memory manipulation.
 */
export function isBackward(diff, lv) {
  if (diff === 'easy') return lv > 10;
  if (diff === 'medium') return lv > 4;
  return true;
}

export function specForLevel(diff, levelIndex) {
  const key = MS_DIFF_KEYS.includes(diff) ? diff : 'easy';
  const lv = clamp(Math.floor(levelIndex) || 1, 1, MS_LEVELS_PER_TIER);
  const t = (lv - 1) / (MS_LEVELS_PER_TIER - 1);
  const b = TIER[key];
  const span = Math.round(lerp(b.span[0], b.span[1], t));
  const gridCells = b.grid;
  return {
    diff: key,
    lv,
    span: clamp(span, 2, gridCells),
    gridCells,
    cols: colsFor(gridCells),
    flashMs: Math.round(lerp(b.flash[0], b.flash[1], t)),
    gapMs: Math.round(lerp(b.gap[0], b.gap[1], t)),
    backward: isBackward(key, lv),
  };
}

export function specForFree(span) {
  const s = clamp(span, 2, 9);
  const gridCells = clamp(s + 3, 6, 16);
  return {
    diff: 'free',
    lv: 0,
    span: s,
    gridCells,
    cols: colsFor(gridCells),
    flashMs: clamp(Math.round(900 - s * 35), 480, 900),
    gapMs: clamp(Math.round(340 - s * 14), 170, 340),
    backward: s >= 4, // forward warm-up at very short spans, then reverse
  };
}

/**
 * Build a round: assign objects to grid cells, pick a sequence of DISTINCT cells.
 *   gridObjects: objectId per cell (index 0..gridCells-1)
 *   sequence:    cell indices in the order they light up
 *   expected:    the order the player must tap (reversed when backward)
 */
export function buildRound(spec, seed = Date.now()) {
  const rnd = mulberry32(seed >>> 0);
  const gridObjects = objectIds(spec.gridCells, rnd);
  const cellIdx = shuffle(
    Array.from({ length: spec.gridCells }, (_, i) => i),
    rnd,
  );
  const sequence = cellIdx.slice(0, spec.span);
  const expected = spec.backward ? [...sequence].reverse() : sequence;
  return { gridObjects, sequence, expected };
}

/** Grade tapped cell indices against the expected order (stops at first error). */
export function gradeRecall(expected, taps) {
  const total = expected.length;
  const t = Array.isArray(taps) ? taps : [];
  let correctCount = 0;
  for (let i = 0; i < total; i++) {
    if (i >= t.length) break;
    if (t[i] === expected[i]) correctCount++;
    else break;
  }
  const correctSequence = correctCount === total && t.length === total;
  const pct = total ? Math.round((correctCount / total) * 100) : 0;
  return { correctCount, total, correctSequence, pct };
}

/** Stars: pass = full sequence; 2–3 stars reward fluent (fast) recall. */
export function starsForRecall(grade, recallMs, span) {
  if (!grade.correctSequence) return 0;
  const perItem = recallMs / Math.max(1, span);
  if (perItem <= 750) return 3;
  if (perItem <= 1200) return 2;
  return 1;
}

export function isMemoSpanLevelUnlocked(diff, lv, doneMap) {
  if (lv <= 1) return true;
  return !!(doneMap[`${diff}-${lv - 1}`] || doneMap[`${diff}-${lv}`]);
}

export function describeBriefing(spec, isAr) {
  const dir = spec.backward
    ? (isAr ? 'بترتيب معكوس' : 'in REVERSE order')
    : (isAr ? 'بنفس الترتيب' : 'in the SAME order');
  if (isAr) {
    return {
      headline: 'مهمة هذه الجولة',
      watchLine: 'ستضيء الخلايا واحدة تلو الأخرى — احفظ ترتيبها',
      tapLine: `ثم اضغط الخلايا ${dir}`,
      detailLine: `${spec.span} في التسلسل · ${spec.gridCells} خلية`,
      startLabel: 'ابدأ الجولة',
      backward: spec.backward,
    };
  }
  return {
    headline: 'Your task this round',
    watchLine: 'Cells light up one by one — remember the order',
    tapLine: `Then tap the cells back ${dir}`,
    detailLine: `${spec.span} in sequence · ${spec.gridCells} cells`,
    startLabel: 'Start round',
    backward: spec.backward,
  };
}

/* --- Round preparation ---------------------------------------------------- */
export function prepareLevelRound(diff, lv, seed) {
  const spec = specForLevel(diff, lv);
  const built = buildRound(spec, seed);
  return { mode: 'level', diff, lv, spec, ...built, seed };
}

export function prepareFreeRound(span, seed) {
  const spec = specForFree(span);
  const built = buildRound(spec, seed);
  return { mode: 'free', diff: 'free', lv: 0, spec, ...built, seed };
}

/**
 * Standardized assessment round — explicit span + direction on a FIXED
 * 9-cell board with FIXED timing, so every trial of every session is
 * comparable (the free-mode spec varies grid size with span; an assessment
 * must not).
 */
export function prepareAssessRound(span, backward, seed) {
  const s = clamp(span, 2, 9);
  const spec = {
    diff: 'assess',
    lv: 0,
    span: s,
    gridCells: 9,
    cols: colsFor(9),
    flashMs: 800,
    gapMs: 250,
    backward: !!backward,
  };
  const built = buildRound(spec, seed);
  return { mode: 'assess', diff: 'assess', lv: 0, spec, ...built, seed };
}

export function prepareChallengeSeed(diff = 'medium') {
  const d = MS_DIFF_KEYS.includes(diff) ? diff : 'medium';
  const preset = MS_PASS_PLAY[d];
  const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  const spec = {
    diff: d,
    lv: 0,
    span: preset.span,
    gridCells: preset.gridCells,
    cols: colsFor(preset.gridCells),
    flashMs: 700,
    gapMs: 250,
    backward: preset.backward,
  };
  return { seed, diff: d, spec };
}

export function prepareChallengeRound(cSeed) {
  const spec = cSeed.spec;
  const built = buildRound(spec, cSeed.seed >>> 0);
  return { mode: 'challenge', diff: spec.diff, lv: 0, spec, ...built, seed: cSeed.seed };
}

/* --- Challenge aggregation ------------------------------------------------ */
export function mergeMemoChallengeRow(prev, grade, playerName) {
  const snap = { pct: grade.pct, correct: grade.correctCount, total: grade.total, full: !!grade.correctSequence };
  const rounds = [...(prev?.rounds || []), snap];
  const n = rounds.length;
  const avgPct = Math.round(rounds.reduce((s, r) => s + r.pct, 0) / n);
  const fullCount = rounds.reduce((s, r) => s + (r.full ? 1 : 0), 0);
  return { nm: playerName, rounds, avgPct, last: snap, fullCount };
}

export function compareMemoChallengeRows(a, b) {
  if (b.avgPct !== a.avgPct) return b.avgPct - a.avgPct;
  const aFull = a.fullCount ?? 0;
  const bFull = b.fullCount ?? 0;
  if (bFull !== aFull) return bFull - aFull;
  return (b.last?.pct ?? 0) - (a.last?.pct ?? 0);
}
