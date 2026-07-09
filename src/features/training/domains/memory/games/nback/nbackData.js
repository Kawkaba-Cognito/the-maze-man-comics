/* =============================================================================
 * N-BACK — the canonical working-memory training task (Kirchner 1958; Jaeggi
 * et al. 2008). A stream of objects appears one at a time; respond MATCH when
 * the current object equals the one N steps back. Three modes share this data:
 *   Free  — adaptive N (accuracy ≥85% → N+1, <60% → N−1)
 *   Level — 100 levels per tier, fixed N + speed, pass on accuracy
 *   Pass n Play — same stream for every player, compare accuracy
 * ========================================================================== */

import { MEMO_OBJECTS } from '../memo-span/memoObjects';
import { mulberry32 } from '../memo-span/memoSpanData';
import { clamp, lerp } from '../../../../../../lib/math';

export const NB_LEVELS_PER_TIER = 100;
export const NB_DIFF_KEYS = ['easy', 'medium', 'hard'];
export const NB_TARGET_RATE = 0.32;
export const NB_PASS_ACC = 75;

/* Variants (Jaeggi 2008 dual n-back is the gold standard):
 *   object   — one item shown centre-stage; MATCH when the item repeats N back
 *   position — one marker lands in a 3×3 grid; MATCH when the location repeats
 *   dual     — track BOTH streams at once, one button each                    */
export const NB_VARIANTS = ['object', 'position', 'dual'];
export const NB_GRID = 9; // 3×3 spatial grid
/** Streams that are actively scored for a given variant. */
export function nbStreams(variant) {
  if (variant === 'position') return ['pos'];
  if (variant === 'dual') return ['obj', 'pos'];
  return ['obj'];
}

// N climbs in bands across the 100 levels; speed ramps within each band.
export const NB_BANDS = 3;

export const NB_DM = {
  easy: { label: 'Easy', pop: '1–3 back · slower', lvc: 'lve', baseN: 1, stim: [2200, 1800], isi: [1000, 800] },
  medium: { label: 'Medium', pop: '2–4 back', lvc: 'lvm', baseN: 2, stim: [2000, 1500], isi: [900, 650] },
  hard: { label: 'Hard', pop: '3–5 back · fast', lvc: 'lvh', baseN: 3, stim: [1800, 1300], isi: [800, 550] },
};

const POOL = MEMO_OBJECTS.map((o) => o.id);


/** Inverse normal CDF (Acklam) — for d′ sensitivity. */
export function ppf(p) {
  const pp = Math.min(0.999, Math.max(0.001, p));
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const plow = 0.02425, phigh = 1 - plow;
  let q, r;
  if (pp < plow) { q = Math.sqrt(-2 * Math.log(pp)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (pp <= phigh) { q = pp - 0.5; r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
  q = Math.sqrt(-2 * Math.log(1 - pp)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

/**
 * Sequence of steps { obj, pos }. Each active stream (per variant) gets ~targetRate
 * of trials matching N steps back; inactive streams are held constant so they never
 * distract (object variant → centre cell; position variant → one fixed marker).
 */
export function buildSteps(n, trials, seed, variant = 'object', targetRate = NB_TARGET_RATE) {
  const rnd = mulberry32(seed >>> 0);
  const len = n + trials;
  const streams = nbStreams(variant);
  const objLive = streams.includes('obj');
  const posLive = streams.includes('pos');
  const marker = POOL[Math.floor(rnd() * POOL.length)]; // fixed item for position variant
  const objSeq = [];
  const posSeq = [];
  for (let i = 0; i < len; i++) {
    if (objLive) {
      if (i >= n && rnd() < targetRate) objSeq.push(objSeq[i - n]);
      else { let o; do { o = POOL[Math.floor(rnd() * POOL.length)]; } while (i >= n && o === objSeq[i - n]); objSeq.push(o); }
    } else {
      objSeq.push(marker);
    }
    if (posLive) {
      if (i >= n && rnd() < targetRate) posSeq.push(posSeq[i - n]);
      else { let p; do { p = Math.floor(rnd() * NB_GRID); } while (i >= n && p === posSeq[i - n]); posSeq.push(p); }
    } else {
      posSeq.push(4); // centre
    }
  }
  return objSeq.map((o, i) => ({ obj: o, pos: posSeq[i] }));
}

/** N for a level: base for band 0, +1 per band across the tier's 100 levels. */
export function levelN(diff, lv) {
  const base = NB_DM[diff]?.baseN ?? 2;
  const li = clamp(Math.floor(lv) || 1, 1, NB_LEVELS_PER_TIER);
  const band = Math.min(NB_BANDS - 1, Math.floor((li - 1) / (NB_LEVELS_PER_TIER / NB_BANDS)));
  return base + band;
}

/** Local 0→1 progress within the current N-band (drives speed ramp per band). */
function bandLocalT(lv) {
  const size = NB_LEVELS_PER_TIER / NB_BANDS;
  const li = clamp(Math.floor(lv) || 1, 1, NB_LEVELS_PER_TIER);
  const band = Math.min(NB_BANDS - 1, Math.floor((li - 1) / size));
  const start = band * size + 1;
  const span = (band === NB_BANDS - 1 ? NB_LEVELS_PER_TIER : start + size - 1) - start;
  return span > 0 ? clamp((li - start) / span, 0, 1) : 0;
}

export function specForLevel(diff, lv, variant = 'dual') {
  const key = NB_DIFF_KEYS.includes(diff) ? diff : 'easy';
  const li = clamp(Math.floor(lv) || 1, 1, NB_LEVELS_PER_TIER);
  const t = bandLocalT(li);
  const dm = NB_DM[key];
  return {
    diff: key, lv: li, n: levelN(key, li), variant,
    stimMs: Math.round(lerp(dm.stim[0], dm.stim[1], t)),
    isiMs: Math.round(lerp(dm.isi[0], dm.isi[1], t)),
    trials: 18,
    targetRate: NB_TARGET_RATE,
  };
}

export function specForFree(n, variant = 'dual') {
  const nn = clamp(n, 1, 6);
  return { diff: 'free', lv: 0, n: nn, variant, stimMs: 2000, isiMs: 900, trials: 20, targetRate: NB_TARGET_RATE };
}

export function specForChallenge(diff, variant = 'dual') {
  const key = NB_DIFF_KEYS.includes(diff) ? diff : 'medium';
  return { diff: key, lv: 0, n: NB_DM[key].baseN + 1, variant, stimMs: 1900, isiMs: 800, trials: 18, targetRate: NB_TARGET_RATE };
}

function buildBlock(spec, mode, seed) {
  return { mode, spec, seq: buildSteps(spec.n, spec.trials, seed, spec.variant), seed: seed >>> 0 };
}

export function prepareLevelBlock(diff, lv, seed, variant = 'object') { return buildBlock(specForLevel(diff, lv, variant), 'level', seed); }
export function prepareFreeBlock(n, seed, variant = 'object') { return buildBlock(specForFree(n, variant), 'free', seed); }
export function prepareChallengeSeed(diff, variant = 'object') {
  const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  return { seed, diff, spec: specForChallenge(diff, variant) };
}
export function prepareChallengeBlock(cSeed) { return { mode: 'challenge', spec: cSeed.spec, seq: buildSteps(cSeed.spec.n, cSeed.spec.trials, cSeed.seed, cSeed.spec.variant), seed: cSeed.seed >>> 0 }; }

/** Fresh per-stream tally container. */
export function emptyStreamStats() { return { hit: 0, miss: 0, fa: 0, cr: 0 }; }
export function emptyNbStats() { return { obj: emptyStreamStats(), pos: emptyStreamStats() }; }

function gradeStream(s) {
  const targets = s.hit + s.miss;
  const nonTargets = s.fa + s.cr;
  const scorable = targets + nonTargets;
  const hitRate = targets ? s.hit / targets : 0;
  const faRate = nonTargets ? s.fa / nonTargets : 0;
  const dPrime = +(ppf(hitRate) - ppf(faRate)).toFixed(2);
  return { dPrime, scorable, correct: s.hit + s.cr, ...s };
}

/** Grade the active streams; combines into one accuracy, exposes per-stream d′. */
export function gradeBlock(stats, variant = 'object') {
  const streams = nbStreams(variant);
  const graded = {};
  let correct = 0, scorable = 0, hit = 0, miss = 0, fa = 0, cr = 0;
  streams.forEach((k) => {
    const g = gradeStream(stats[k] || emptyStreamStats());
    graded[k] = g;
    correct += g.correct; scorable += g.scorable;
    hit += g.hit; miss += g.miss; fa += g.fa; cr += g.cr;
  });
  const acc = scorable ? Math.round((correct / scorable) * 100) : 0;
  const primary = graded[streams[0]];
  const dPrime = streams.length === 1
    ? primary.dPrime
    : +(((graded.obj.dPrime + graded.pos.dPrime) / 2)).toFixed(2);
  return {
    acc, dPrime, hit, miss, fa, cr,
    dPrimeObj: graded.obj ? graded.obj.dPrime : null,
    dPrimePos: graded.pos ? graded.pos.dPrime : null,
    variant,
  };
}

export function starsForNBack(acc) {
  if (acc >= 92) return 3;
  if (acc >= 83) return 2;
  if (acc >= NB_PASS_ACC) return 1;
  return 0;
}

export function adaptiveNextN(n, acc) {
  if (acc >= 85 && n < 6) return n + 1;
  if (acc < 60 && n > 1) return n - 1;
  return n;
}

/** Progress keys are namespaced by variant so each track unlocks independently. */
export function nbLevelKey(variant, diff, lv) { return `${variant}:${diff}-${lv}`; }
export function isNbackLevelUnlocked(variant, diff, lv, doneMap) {
  if (lv <= 1) return true;
  return !!(doneMap[nbLevelKey(variant, diff, lv - 1)] || doneMap[nbLevelKey(variant, diff, lv)]);
}

/** Best sustained N per variant (bestN stored as a per-variant map; legacy number tolerated). */
export function nbBestN(profile, variant) {
  const b = profile?.bestN;
  if (b && typeof b === 'object') return b[variant] ?? 2;
  return typeof b === 'number' ? b : 2;
}
export function nbSetBestN(profile, variant, n) {
  const b = (profile?.bestN && typeof profile.bestN === 'object') ? profile.bestN : {};
  return { ...b, [variant]: n };
}

/* progress */
const KEY = 'mm_nback_v1';
export function loadNbackProfile() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; }
}
export function saveNbackProfile(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data || {})); } catch { /* ignore */ }
}

/* Pass-n-Play aggregation */
export function mergeNbackChallengeRow(prev, grade, name) {
  const snap = { acc: grade.acc, dPrime: grade.dPrime };
  const rounds = [...(prev?.rounds || []), snap];
  const n = rounds.length;
  const avgAcc = Math.round(rounds.reduce((s, r) => s + r.acc, 0) / n);
  return { nm: name, rounds, avgAcc, last: snap };
}
export function compareNbackChallengeRows(a, b) {
  if (b.avgAcc !== a.avgAcc) return b.avgAcc - a.avgAcc;
  return (b.last?.dPrime ?? 0) - (a.last?.dPrime ?? 0);
}
