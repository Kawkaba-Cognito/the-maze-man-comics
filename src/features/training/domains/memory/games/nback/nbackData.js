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

export const NB_LEVELS_PER_TIER = 100;
export const NB_DIFF_KEYS = ['easy', 'medium', 'hard'];
export const NB_TARGET_RATE = 0.32;
export const NB_PASS_ACC = 75;

export const NB_DM = {
  easy: { label: 'Easy', pop: '1–2 back · slower', lvc: 'lve', baseN: 1, stim: [2200, 1800], isi: [1000, 800] },
  medium: { label: 'Medium', pop: '2–3 back', lvc: 'lvm', baseN: 2, stim: [2000, 1500], isi: [900, 650] },
  hard: { label: 'Hard', pop: '3–4 back · fast', lvc: 'lvh', baseN: 3, stim: [1800, 1300], isi: [800, 550] },
};

const POOL = MEMO_OBJECTS.map((o) => o.id);

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

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

/** Sequence of object ids with ~targetRate of trials matching N steps back. */
export function buildSequence(n, trials, seed, targetRate = NB_TARGET_RATE) {
  const rnd = mulberry32(seed >>> 0);
  const len = n + trials;
  const seq = [];
  for (let i = 0; i < len; i++) {
    if (i >= n && rnd() < targetRate) {
      seq.push(seq[i - n]);
    } else {
      let o;
      do { o = POOL[Math.floor(rnd() * POOL.length)]; } while (i >= n && o === seq[i - n]);
      seq.push(o);
    }
  }
  return seq;
}

export function levelN(diff, lv) {
  const base = NB_DM[diff]?.baseN ?? 2;
  return base + (lv > 50 ? 1 : 0);
}

export function specForLevel(diff, lv) {
  const key = NB_DIFF_KEYS.includes(diff) ? diff : 'easy';
  const li = clamp(Math.floor(lv) || 1, 1, NB_LEVELS_PER_TIER);
  const t = (li - 1) / (NB_LEVELS_PER_TIER - 1);
  const dm = NB_DM[key];
  return {
    diff: key, lv: li, n: levelN(key, li),
    stimMs: Math.round(lerp(dm.stim[0], dm.stim[1], t)),
    isiMs: Math.round(lerp(dm.isi[0], dm.isi[1], t)),
    trials: 18,
    targetRate: NB_TARGET_RATE,
  };
}

export function specForFree(n) {
  const nn = clamp(n, 1, 6);
  return { diff: 'free', lv: 0, n: nn, stimMs: 2000, isiMs: 900, trials: 20, targetRate: NB_TARGET_RATE };
}

export function specForChallenge(diff) {
  const key = NB_DIFF_KEYS.includes(diff) ? diff : 'medium';
  return { diff: key, lv: 0, n: NB_DM[key].baseN + 1, stimMs: 1900, isiMs: 800, trials: 18, targetRate: NB_TARGET_RATE };
}

function buildBlock(spec, mode, seed) {
  return { mode, spec, seq: buildSequence(spec.n, spec.trials, seed), seed: seed >>> 0 };
}

export function prepareLevelBlock(diff, lv, seed) { return buildBlock(specForLevel(diff, lv), 'level', seed); }
export function prepareFreeBlock(n, seed) { return buildBlock(specForFree(n), 'free', seed); }
export function prepareChallengeSeed(diff) {
  const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  return { seed, diff, spec: specForChallenge(diff) };
}
export function prepareChallengeBlock(cSeed) { return { mode: 'challenge', spec: cSeed.spec, seq: buildSequence(cSeed.spec.n, cSeed.spec.trials, cSeed.seed), seed: cSeed.seed >>> 0 }; }

/** Tally hits/misses/false-alarms/correct-rejections into accuracy + d′. */
export function gradeBlock(stats) {
  const targets = stats.hit + stats.miss;
  const nonTargets = stats.fa + stats.cr;
  const scorable = targets + nonTargets;
  const acc = scorable ? Math.round(((stats.hit + stats.cr) / scorable) * 100) : 0;
  const hitRate = targets ? stats.hit / targets : 0;
  const faRate = nonTargets ? stats.fa / nonTargets : 0;
  const dPrime = +(ppf(hitRate) - ppf(faRate)).toFixed(2);
  return { acc, dPrime, ...stats };
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

export function isNbackLevelUnlocked(diff, lv, doneMap) {
  if (lv <= 1) return true;
  return !!(doneMap[`${diff}-${lv - 1}`] || doneMap[`${diff}-${lv}`]);
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
