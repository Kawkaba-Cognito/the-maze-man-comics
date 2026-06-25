/*
 * motMetrics.js — derived measures for Multiple Object Tracking, from the
 * per-trial logs (trialLog game 'mot'). Pure JS, no React.
 *
 * Each trial carries: k (targets), dots (total), hits, fa, acc, enc
 * (target↔distractor close encounters), leftT/rightT/leftHit/rightHit.
 */

export function mean(xs) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

function pearson(xs, ys) {
  const n = xs.length;
  if (n < 3) return null;
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return null;
  return sxy / Math.sqrt(sxx * syy);
}

/**
 * Guessing-corrected tracking capacity for ONE trial (high-threshold model).
 * Selecting k of N objects, base-rate chance that a random pick is a target is
 * k/N. Corrected K = T·(acc − chance)/(1 − chance): K=T at perfect accuracy,
 * K=0 at chance. Signed (can be < 0 below chance); the summary clamps the mean.
 */
export function trialCapacity(t) {
  const T = t.k;
  const N = t.dots;
  if (!T || !N || N <= T || t.hits == null) return null;
  const acc = t.hits / T;
  const chance = T / N;
  if (chance >= 1) return null;
  return T * ((acc - chance) / (1 - chance));
}

/** Mean accuracy (hits/k) grouped by target count k. */
export function accuracyByLoad(trials) {
  const byK = {};
  for (const t of trials) {
    if (t.k == null || t.hits == null) continue;
    (byK[t.k] ??= []).push(t.hits / t.k);
  }
  return Object.fromEntries(
    Object.entries(byK).map(([k, arr]) => [k, +mean(arr).toFixed(3)]),
  );
}

/** Left/right tracking accuracy and an asymmetry index (>0 = right-better). */
export function hemifieldBalance(trials) {
  let lT = 0;
  let lH = 0;
  let rT = 0;
  let rH = 0;
  for (const t of trials) {
    lT += t.leftT || 0;
    lH += t.leftHit || 0;
    rT += t.rightT || 0;
    rH += t.rightHit || 0;
  }
  const leftAcc = lT ? lH / lT : null;
  const rightAcc = rT ? rH / rT : null;
  const asymmetry =
    leftAcc != null && rightAcc != null && leftAcc + rightAcc > 0
      ? +((rightAcc - leftAcc) / (rightAcc + leftAcc)).toFixed(3)
      : null;
  return {
    leftAcc: leftAcc != null ? +leftAcc.toFixed(3) : null,
    rightAcc: rightAcc != null ? +rightAcc.toFixed(3) : null,
    asymmetry,
  };
}

/**
 * One-call summary over a trial array.
 *   capacity      — mean guessing-corrected K (clamped ≥0): "objects you can
 *                   actually hold", the headline MOT number.
 *   overallAcc    — mean hits/k.
 *   perfectRate   — fraction of fully-correct rounds.
 *   accuracyByLoad— accuracy per target count.
 *   hemifield     — L/R balance.
 *   meanEnc       — avg close encounters per trial.
 *   encErrCorr    — Pearson r between encounters and error rate (1−acc):
 *                   positive = close passes predict your errors (confounded with
 *                   overall difficulty, so descriptive only).
 */
export function summarizeMot(trials) {
  const valid = (trials || []).filter((t) => t && t.k != null && t.hits != null);
  const n = valid.length;
  if (!n) return { n: 0, capacity: null, overallAcc: null, perfectRate: null, accuracyByLoad: {}, hemifield: hemifieldBalance([]), meanEnc: null, encErrCorr: null };
  const caps = valid.map(trialCapacity).filter((v) => v != null);
  const capacity = caps.length ? Math.max(0, mean(caps)) : null;
  const overallAcc = mean(valid.map((t) => t.hits / t.k));
  const perfectRate = mean(valid.map((t) => (t.ok ? 1 : 0)));
  const encTrials = valid.filter((t) => t.enc != null);
  const meanEnc = encTrials.length ? mean(encTrials.map((t) => t.enc)) : null;
  const encErrCorr = pearson(encTrials.map((t) => t.enc), encTrials.map((t) => 1 - t.hits / t.k));
  return {
    n,
    capacity: capacity != null ? +capacity.toFixed(2) : null,
    overallAcc: overallAcc != null ? +overallAcc.toFixed(3) : null,
    perfectRate: perfectRate != null ? +perfectRate.toFixed(3) : null,
    accuracyByLoad: accuracyByLoad(valid),
    hemifield: hemifieldBalance(valid),
    meanEnc: meanEnc != null ? +meanEnc.toFixed(1) : null,
    encErrCorr: encErrCorr != null ? +encErrCorr.toFixed(2) : null,
  };
}
