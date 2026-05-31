/* =============================================================================
 * SPEED MATCH — Digit-Symbol substitution (processing speed)
 *
 * Based on the Digit Symbol Substitution Test (Wechsler "Coding" / DSST), the
 * most widely used clinical measure of PROCESSING SPEED (Salthouse 1996; Jaeger
 * 2018). A legend maps symbols → digits; a symbol is shown and the player taps
 * the matching digit as fast as possible. The key stays visible, so this is a
 * speeded perceptual-matching task, not a memory task.
 *
 * Primary metric: correct matches per minute (the DSST score). We also track
 * accuracy, mean response time, and RT variability — all feed the assessment.
 * ========================================================================== */

import { SH } from '../../../../shared/focusQuestData';

export { SH };

export const SM_DIFF_KEYS = ['easy', 'medium', 'hard'];
export const SM_PROGRESS_ORDER = SM_DIFF_KEYS;
export const SM_LEVELS_PER_TIER = 100;
export const SM_FREE_LIVES = 3;

export const SM_DM = {
  easy: { label: 'Easy', pop: '4–6 symbols · relaxed pace', lvc: 'fq-lve' },
  medium: { label: 'Medium', pop: '5–7 symbols · brisk', lvc: 'fq-lvm' },
  hard: { label: 'Hard', pop: '6–9 symbols · rapid · key remaps', lvc: 'fq-lvh' },
};

/** Curated distinct glyphs (rendered via the shared SH SVG set). */
export const SM_SYMBOLS = [
  'circle', 'square', 'triangle', 'diamond', 'star',
  'cross', 'hexagon', 'heart', 'pentagon', 'lightning',
];

/** Pass-n-Play uses a representative level per difficulty. */
export const SM_PASS_PLAY_LV = { easy: 12, medium: 12, hard: 12 };
const PASS_PLAY_DURATION = 45;

const BOUNDS = {
  easy: { pairs: [4, 6], target: [12, 22], minAcc: 0.8, remapEvery: 0, itemMs: [2600, 1900] },
  medium: { pairs: [5, 7], target: [16, 30], minAcc: 0.82, remapEvery: 0, itemMs: [2200, 1500] },
  hard: { pairs: [6, 9], target: [20, 38], minAcc: 0.85, remapEvery: 14, itemMs: [1800, 1050] },
};

const LEVEL_DURATION = 60;

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

/** Block parameters for a tier level (1–100). */
export function specForLevel(diff, levelIndex) {
  const key = SM_DIFF_KEYS.includes(diff) ? diff : 'easy';
  const lv = clamp(Math.floor(levelIndex) || 1, 1, SM_LEVELS_PER_TIER);
  const t = (lv - 1) / (SM_LEVELS_PER_TIER - 1);
  const b = BOUNDS[key];
  return {
    diff: key,
    lv,
    pairCount: Math.round(lerp(b.pairs[0], b.pairs[1], t)),
    durationSec: LEVEL_DURATION,
    targetCorrect: Math.round(lerp(b.target[0], b.target[1], t)),
    minAcc: b.minAcc,
    remapEvery: b.remapEvery,
    itemMs: Math.round(lerp(b.itemMs[0], b.itemMs[1], t)),
  };
}

/** A legend: pairCount distinct symbols mapped to digits 1..pairCount. */
export function buildLegend(pairCount, rnd = Math.random) {
  const n = clamp(pairCount, 2, SM_SYMBOLS.length);
  const picked = shuffle(SM_SYMBOLS, rnd).slice(0, n);
  return picked.map((symbol, i) => ({ digit: i + 1, symbol }));
}

/** Pick the next prompt symbol; avoids repeating the immediately previous one. */
export function pickItem(legend, rnd = Math.random, lastDigit = 0) {
  if (legend.length === 0) return null;
  let entry = legend[Math.floor(rnd() * legend.length)];
  if (legend.length > 1 && entry.digit === lastDigit) {
    entry = legend[Math.floor(rnd() * legend.length)];
  }
  return entry;
}

/* --- Free-mode ramp (continuous, lives-based) ----------------------------- */
/** Legend grows as the run progresses: 4 → 9 symbols. */
export function freeLegendSize(correctCount) {
  return clamp(4 + Math.floor(correctCount / 8), 4, SM_SYMBOLS.length);
}
/** Per-item time budget shrinks with progress (ms). */
export function freeItemMs(correctCount) {
  return Math.max(850, Math.round(2600 - correctCount * 32));
}
/** Points for a correct match, scaled by combo. */
export function freeItemPoints(combo) {
  return Math.round(10 * (1 + Math.min(combo, 12) * 0.1));
}

/* --- Scoring & grading ---------------------------------------------------- */
export function summarize(events, durationSec) {
  let correct = 0;
  let wrong = 0;
  const rts = [];
  for (const e of events) {
    if (e.correct) {
      correct++;
      if (e.rtMs != null && e.rtMs >= 120 && e.rtMs <= 8000) rts.push(e.rtMs);
    } else {
      wrong++;
    }
  }
  const total = correct + wrong;
  const accuracy = total ? correct / total : 1;
  const dur = Math.max(1, durationSec || 1);
  const itemsPerMin = +(correct / (dur / 60)).toFixed(1);
  const meanRt = rts.length
    ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length)
    : null;
  const rtSd =
    rts.length > 1 && meanRt != null
      ? Math.round(
          Math.sqrt(rts.reduce((s, x) => s + (x - meanRt) ** 2, 0) / (rts.length - 1)),
        )
      : null;
  return {
    correct,
    wrong,
    total,
    accuracy,
    accuracyPct: Math.round(accuracy * 100),
    itemsPerMin,
    meanRt,
    rtSd,
  };
}

/** Speed Score 0–100: items/min normalised against a tier ceiling, gated by accuracy. */
export function computeSpeedScore(summary, diff) {
  const ceiling = { easy: 38, medium: 46, hard: 54 }[diff] ?? 40;
  const speed = clamp(summary.itemsPerMin / ceiling, 0, 1);
  const acc = clamp(summary.accuracy, 0, 1);
  return Math.round(100 * (0.7 * speed + 0.3 * acc));
}

export function gradeBlock(summary, spec, { freeMode = false } = {}) {
  const score = computeSpeedScore(summary, spec.diff);
  if (freeMode) {
    return { won: true, stars: 0, score };
  }
  const won = summary.correct >= spec.targetCorrect && summary.accuracy >= spec.minAcc;
  let stars = 0;
  if (won) {
    stars = 1;
    if (summary.accuracy >= 0.9) stars = 2;
    if (summary.accuracy >= 0.95 && summary.correct >= spec.targetCorrect * 1.25) stars = 3;
  }
  return { won, stars, score };
}

export function isLevelUnlocked(diff, lv, doneMap) {
  if (lv <= 1) return true;
  const key = (d, L) => `${d}-${L}`;
  return !!(doneMap[key(diff, lv - 1)] || doneMap[key(diff, lv)]);
}

export function freeStageToDiffLv(stageIndex) {
  const s = Math.max(0, stageIndex | 0);
  const maxLinear = SM_PROGRESS_ORDER.length * SM_LEVELS_PER_TIER - 1;
  const capped = Math.min(s, maxLinear);
  const diffIx = Math.floor(capped / SM_LEVELS_PER_TIER);
  const lv = (capped % SM_LEVELS_PER_TIER) + 1;
  return { diff: SM_PROGRESS_ORDER[diffIx], lv };
}

/* --- Block / seed preparation -------------------------------------------- */
export function prepareLevelBlock(diff, lv) {
  const spec = specForLevel(diff, lv);
  const legend = buildLegend(spec.pairCount);
  return { mode: 'level', diff, lv, spec, legend };
}

export function prepareChallengeSeed(diff = 'hard') {
  const d = SM_DIFF_KEYS.includes(diff) ? diff : 'hard';
  const lv = SM_PASS_PLAY_LV[d] ?? 12;
  const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  const base = specForLevel(d, lv);
  const spec = { ...base, durationSec: PASS_PLAY_DURATION };
  return { seed, diff: d, lv, spec };
}

export function prepareChallengeBlock(cSeed) {
  const spec = cSeed.spec;
  // Deterministic legend so every player faces the same key + symbol stream.
  const legend = buildLegend(spec.pairCount, mulberry32(cSeed.seed));
  return { mode: 'challenge', diff: spec.diff, lv: spec.lv, spec, legend, seed: cSeed.seed };
}
