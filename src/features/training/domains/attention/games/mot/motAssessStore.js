/*
 * motAssessStore.js — persistence + self-referenced reporting for the MOT
 * speed-threshold assessment. Pure JS, localStorage.
 *
 * We deliberately do NOT report population percentiles (there is no validated
 * normative database for this on-device task). Instead we report SELF-referenced
 * change over time with a proper Reliable Change Index (Jacobson & Truax 1991):
 * a change counts as "reliable" only when it exceeds the measurement noise, which
 * we estimate from each session's own staircase variability (SEM of the reversal
 * speeds). This is the honest, defensible way to track an individual.
 */

const KEY = 'mm_mot_assess_v1';
const CAP = 60;

/** Speed threshold (fraction of screen/sec) → 0–100 index (0.8 frac ≈ 100). */
export function speedIndex(thr) {
  return Math.round(Math.max(0, Math.min(1, thr / 0.8)) * 100);
}
/** d(index)/d(threshold): index = threshold/0.8·100 = threshold·125. */
const INDEX_PER_FRAC = 125;

export function loadMotAssess() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * Persist one assessment. `stats` = { mean, sd, n } from the staircase.
 * Stores the index and a standard error of measurement in index units
 * (SEM = SD/√n · 125), with a sensible floor so a single-reversal session still
 * has a non-zero noise estimate.
 */
export function saveMotAssess({ stats, trials, reversals }) {
  const index = speedIndex(stats.mean);
  const semIndex = Math.max(4, stats.n > 1 ? (stats.sd / Math.sqrt(stats.n)) * INDEX_PER_FRAC : 10);
  const entry = {
    ts: new Date().toISOString(),
    threshold: +stats.mean.toFixed(3),
    index,
    semIndex: +semIndex.toFixed(1),
    trials: trials ?? null,
    reversals: reversals ?? null,
  };
  const next = [...loadMotAssess(), entry].slice(-CAP);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  return next;
}

/**
 * Self-referenced report from the stored sessions.
 *   index        — most recent speed index
 *   best         — best index so far
 *   delta        — index − baseline (first session)
 *   reliable     — true if |delta| exceeds the Reliable Change cutoff
 *                  (1.96 · √(SEM_now² + SEM_baseline²); Jacobson & Truax)
 *   series       — index history for a trend line
 */
export function motAssessReport(sessions) {
  const n = sessions.length;
  if (!n) return null;
  const last = sessions[n - 1];
  const base = sessions[0];
  const best = Math.max(...sessions.map((s) => s.index));
  const delta = n > 1 ? last.index - base.index : 0;
  const sdiff = Math.sqrt((last.semIndex || 8) ** 2 + (base.semIndex || 8) ** 2);
  const reliable = n > 1 && Math.abs(delta) > 1.96 * sdiff;
  return {
    n,
    index: last.index,
    best,
    delta,
    reliable,
    series: sessions.map((s) => s.index),
  };
}
