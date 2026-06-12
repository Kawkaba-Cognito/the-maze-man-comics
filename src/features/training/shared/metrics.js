/*
 * METRICS — psychometric hygiene for per-trial training data.
 *
 * Pure JS, no React (per ARCHITECTURE.md "engine code is React-free").
 * Conventions follow standard chronometric practice:
 *  - RTs under 150 ms are anticipations (faster than stimulus-driven action)
 *    and are excluded, not counted as performance.
 *  - RTs beyond ±3 robust-SD (median ± 3·MAD·1.4826, Leys et al. 2013) are
 *    outliers (lapses, distractions) and are trimmed before stats. MAD is
 *    used instead of SD because one extreme RT inflates the SD enough to
 *    mask itself on the small samples a game block produces.
 *  - RT statistics are computed on CORRECT responses only — error RTs come
 *    from a different process and contaminate the estimate.
 *  - Inverse Efficiency Score (IES = meanRT / accuracy) exposes
 *    speed–accuracy trading: going faster by guessing makes IES worse.
 *  - Post-error slowing (RT after errors minus RT after corrects) indexes
 *    adaptive control — a "free" metric any trial sequence provides.
 */

export const RT_MIN_MS = 150;

export function mean(xs) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

export function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function sd(xs) {
  if (xs.length < 2) return null;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) * (x - m), 0) / (xs.length - 1));
}

/**
 * Filter raw RTs: drop anticipations (< minMs), then trim outliers beyond
 * ±sdCut robust-SD (MAD scaled by 1.4826 ≈ SD under normality).
 * Returns { kept, anticipations, outliers } so reports can disclose exclusions.
 */
export function cleanRTs(rts, { minMs = RT_MIN_MS, sdCut = 3 } = {}) {
  const valid = rts.filter((rt) => Number.isFinite(rt) && rt >= minMs);
  const anticipations = rts.filter((rt) => Number.isFinite(rt) && rt < minMs).length;
  if (valid.length < 3) return { kept: valid, anticipations, outliers: 0 };
  const m = median(valid);
  const mad = median(valid.map((x) => Math.abs(x - m))) * 1.4826;
  if (!mad) return { kept: valid, anticipations, outliers: 0 };
  const kept = valid.filter((rt) => Math.abs(rt - m) <= sdCut * mad);
  return { kept, anticipations, outliers: valid.length - kept.length };
}

/** Proportion correct over trials that carry an `ok` boolean. */
export function accuracy(trials) {
  const scored = trials.filter((tr) => typeof tr.ok === 'boolean');
  if (!scored.length) return null;
  return scored.filter((tr) => tr.ok).length / scored.length;
}

/** Inverse Efficiency Score — mean correct RT divided by accuracy. */
export function ies(meanRt, acc) {
  if (meanRt == null || !acc) return null;
  return Math.round(meanRt / acc);
}

/**
 * Post-error slowing over an ORDERED trial sequence: mean RT of trials that
 * follow an error minus mean RT of trials that follow a correct response.
 * Positive = the player slows down to regain control after mistakes.
 */
export function postErrorSlowing(trials) {
  const afterErr = [];
  const afterOk = [];
  for (let i = 1; i < trials.length; i++) {
    const prev = trials[i - 1];
    const cur = trials[i];
    if (typeof prev.ok !== 'boolean' || !Number.isFinite(cur.rt) || cur.rt < RT_MIN_MS) continue;
    (prev.ok ? afterOk : afterErr).push(cur.rt);
  }
  if (afterErr.length < 2 || afterOk.length < 2) return null;
  return Math.round(mean(afterErr) - mean(afterOk));
}

/**
 * One-call summary of a trial sequence. RT stats use correct trials only,
 * after anticipation + outlier cleaning; exclusion counts are reported.
 */
export function summarize(trials) {
  const n = trials.length;
  const acc = accuracy(trials);
  const correctRts = trials
    .filter((tr) => tr.ok === true && Number.isFinite(tr.rt))
    .map((tr) => tr.rt);
  const { kept, anticipations, outliers } = cleanRTs(correctRts);
  const meanRt = kept.length ? Math.round(mean(kept)) : null;
  const medianRt = kept.length ? Math.round(median(kept)) : null;
  const sdRt = kept.length >= 2 ? Math.round(sd(kept)) : null;
  return {
    n,
    acc: acc == null ? null : Math.round(acc * 1000) / 1000,
    meanRt,
    medianRt,
    sdRt,
    ies: ies(meanRt, acc),
    pes: postErrorSlowing(trials),
    anticipations,
    outliers,
  };
}
