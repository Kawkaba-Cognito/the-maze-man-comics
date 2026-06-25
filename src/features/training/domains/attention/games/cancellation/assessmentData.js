/* =============================================================================
 * STANDARDIZED ATTENTION ASSESSMENT  (Cancellation / Focus task)
 *
 * Goal: turn the cancellation game into a *measurement instrument*, not just a
 * score. A standardized protocol with fixed parameters lets a single user track
 * their own attention reliably over time (self-referenced assessment).
 *
 * Why a cancellation task: it is one of the most validated paper-and-pencil /
 * computerized attention paradigms in neuropsychology (Mesulam symbol
 * cancellation; used for selective/sustained attention, processing speed,
 * inhibitory control, and spatial neglect).
 *
 * What we measure (and the construct each maps to):
 *   - Detection rate  = hits / targets        → SELECTIVE & SUSTAINED ATTENTION
 *                                                (omissions = attentional lapses)
 *   - Commission rate = false taps / responses → RESPONSE INHIBITION / impulsivity
 *   - Speed           = hits / second          → PROCESSING SPEED
 *   - Mean RT         = mean inter-tap interval → search + decision + motor time
 *   - RT variability  = SD(RT) / mean(RT) (CV) → ATTENTIONAL STABILITY. Elevated
 *                       intra-individual RT variability is a robust marker of
 *                       attentional lapses (Castellanos 2005; Bellgrove 2004).
 *   - IES             = mean RT / accuracy     → combined efficiency
 *                       (Townsend & Ashby 1983)
 *
 * IMPORTANT HONESTY NOTE: the interpretation bands below are *guideline bands*
 * for self-comparison and motivation. They are anchored to published values
 * where possible (e.g. Mesulam cancellation ~1.06 targets/s, Uttl &
 * Pilkenton-Taylor 2001) but they are NOT validated clinical norms. Absolute
 * scores on a phone are not standardized across devices/conditions — the
 * scientifically valid use is WITHIN a single person OVER TIME.
 * ========================================================================== */

import {
  SP,
  PAL,
  buildCellsFromParams,
  assignFillColors,
} from '../../../../shared/focusQuestData';
import { ageSpeedFactor } from '../../../../assessment/assessmentProfile';

/**
 * Fixed protocol. Every assessment uses identical parameters so sessions are
 * comparable; only the layout (target positions) is re-randomized each time so
 * positions can't be memorized — exactly how clinical cancellation forms work.
 *
 * Medium tier = controlled (serial) search with similar shapes + colour
 * interference, which loads selective attention and inhibition more than a
 * pop-out feature search would.
 */
export const ASSESSMENT_PROTOCOL = {
  trials: 3,
  grid: 7, // 49 cells
  targetCount: 14,
  timeLimitSec: 45,
  diff: 'medium',
  interference: 0.3,
  poolIndex: 9,
};

/** Reference anchors for guideline bands (see honesty note above). */
export const ASSESS_REF = {
  // targets/sec that earns full "speed" credit. Healthy-adult cancellation
  // baseline ≈ 1.06/s (Mesulam); controlled search on a touch screen is a touch
  // slower, so 1.4/s is set as a strong-performance ceiling for the index.
  speedRef: 1.4,
};

export function prepareAssessmentTrial(trialIndex) {
  const P = ASSESSMENT_PROTOCOL;
  const diff = P.diff;
  const poolList = SP[diff] || SP.medium;
  const pool = poolList[Math.min(P.poolIndex, poolList.length - 1)];
  const pal = PAL[diff] || PAL.medium;
  const lockedTarget = pool[Math.floor(Math.random() * pool.length)];
  const lockedCol = pal[Math.floor(Math.random() * pal.length)];
  const built = buildCellsFromParams(
    P.grid,
    pool,
    P.targetCount,
    diff,
    { tgt: lockedTarget, tgtCol: lockedCol },
    P.interference,
  );
  const withFill = assignFillColors(built.cells, diff, P.interference, built.tgtCol);
  const cells = withFill.map((c, i) => ({ ...c, id: i, tapped: false, feedback: null }));
  const targetCount = cells.filter((c) => c.isT).length;
  return {
    mode: 'assess',
    diff,
    lv: trialIndex + 1,
    grid: P.grid,
    pool,
    tc: targetCount,
    tlim: P.timeLimitSec,
    target: built.tgt,
    targetCol: built.tgtCol,
    searchMode: 'categorical',
    interference: P.interference,
    cells,
    assessTrial: trialIndex,
    assessTrialsTotal: P.trials,
  };
}

/**
 * Inverse standard-normal CDF (probit / z-score for a probability), via Acklam's
 * rational approximation (abs error < 1.2e-9). Pure JS — there is no stats lib in
 * this project. Used to convert hit/false-alarm rates into z-scores for d′ and c.
 */
function invNormCDF(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q;
  let r;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

/**
 * Signal Detection Theory for the cancellation task.
 *   Signal trials = target cells; noise trials = distractor cells.
 *   Hit = tapped target; Miss = missed target; False Alarm = tapped distractor.
 * Log-linear correction (Hautus 1995): add 0.5 to hit & FA counts and 1 to the
 * signal/noise totals — applied always (not only at 0/1 rates) so z-scores are
 * defined even when the player makes no false alarms (common here, since there
 * are far more distractors than targets → low FA rate, high d′).
 *   d′ = z(H) − z(F)  (sensitivity; higher = cleaner target/distractor separation)
 *   c  = −½·(z(H) + z(F))  (bias; >0 cautious/conservative, <0 impulsive/liberal)
 */
function signalDetection(hits, targets, falseAlarms, distractors) {
  if (targets <= 0 || distractors <= 0) return { dPrime: null, criterion: null };
  const hAdj = (hits + 0.5) / (targets + 1);
  const fAdj = (falseAlarms + 0.5) / (distractors + 1);
  const zH = invNormCDF(hAdj);
  const zF = invNormCDF(fAdj);
  return {
    dPrime: +(zH - zF).toFixed(2),
    criterion: +(-0.5 * (zH + zF)).toFixed(2),
  };
}

function mean(a) {
  return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
}
function std(a) {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(mean(a.map((x) => (x - m) ** 2)));
}

/**
 * Spatial-bias analysis (Rorden & Karnath 2010 Center of Cancellation).
 * Per trial, each target's position is normalized to [-1, +1] across the target
 * extent (leftmost target = -1, rightmost = +1; top = -1, bottom = +1).
 *   cocH/cocV = mean normalized position of the CANCELLED (found) targets.
 *     0 = balanced; >0 = rightward / downward bias; <0 = leftward / upward.
 *     Deviates when omissions cluster on one side (the neglect-style signal).
 *   scanLat   = mean normalized x of the first quartile of found taps = which
 *     side the search STARTED on (informative even on a full clear, where CoC
 *     just reflects the layout centroid ≈ 0).
 * Values are averaged across the session's trials.
 */
function spatialBias(trials) {
  const hVals = [];
  const vVals = [];
  const latVals = [];
  for (const t of trials) {
    const found = Array.isArray(t.foundSeq) ? t.foundSeq : [];
    const all = [...found, ...(Array.isArray(t.omitPos) ? t.omitPos : [])];
    if (!all.length || !found.length) continue;
    const cols = all.map((p) => p.col);
    const rows = all.map((p) => p.row);
    const spanC = Math.max(...cols) - Math.min(...cols);
    const spanR = Math.max(...rows) - Math.min(...rows);
    const minC = Math.min(...cols);
    const minR = Math.min(...rows);
    if (spanC > 0) hVals.push(mean(found.map((p) => ((p.col - minC) / spanC) * 2 - 1)));
    if (spanR > 0) vVals.push(mean(found.map((p) => ((p.row - minR) / spanR) * 2 - 1)));
    if (found.length >= 4 && spanC > 0) {
      const q = Math.max(1, Math.round(found.length * 0.25));
      latVals.push(mean(found.slice(0, q).map((p) => ((p.col - minC) / spanC) * 2 - 1)));
    }
  }
  return {
    cocH: hVals.length ? +mean(hVals).toFixed(3) : null,
    cocV: vVals.length ? +mean(vVals).toFixed(3) : null,
    scanLat: latVals.length ? +mean(latVals).toFixed(3) : null,
  };
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

/** Do segments p1-p2 and p3-p4 properly cross? (orientation test, grid coords). */
function segmentsCross(p1, p2, p3, p4) {
  const o = (a, b, c) => Math.sign((b.col - a.col) * (c.row - a.row) - (b.row - a.row) * (c.col - a.col));
  return o(p1, p2, p3) !== o(p1, p2, p4) && o(p3, p4, p1) !== o(p3, p4, p2);
}

/**
 * Search-organization metrics (Dalmaijer et al. 2015, CancellationTools), from
 * the tap-ordered found positions. A distinct executive construct — HOW you
 * scan, separate from speed/accuracy.
 *   bestR        — max |Pearson r| between cancellation rank and column/row.
 *                  →1 = systematic row/column sweep; →0 = chaotic order.
 *   intersectRate— path self-crossings ÷ cancellations (revisits are impossible
 *                  here — cells lock once tapped). Lower = more organized.
 *   orgAngle     — mean |2·θ/90 − 1| of each move's angle (θ∈[0,90]°). →1 for
 *                  axis-aligned (horizontal/vertical) moves, →0 for diagonals.
 *   orgScore     — 0..1 blend (bestR, orgAngle, and 1−intersectRate), higher =
 *                  more organized. Each trial is scored, then averaged.
 */
function searchOrganization(trials) {
  const rVals = [];
  const interVals = [];
  const angleVals = [];
  for (const t of trials) {
    const seq = Array.isArray(t.foundSeq) ? t.foundSeq : [];
    const n = seq.length;
    if (n < 5) continue;
    const ranks = seq.map((_, i) => i + 1);
    const rCol = pearson(ranks, seq.map((p) => p.col));
    const rRow = pearson(ranks, seq.map((p) => p.row));
    rVals.push(Math.max(Math.abs(rCol ?? 0), Math.abs(rRow ?? 0)));

    let crossings = 0;
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n - 1; j++) {
        if (segmentsCross(seq[i], seq[i + 1], seq[j], seq[j + 1])) crossings++;
      }
    }
    interVals.push(crossings / n);

    let aSum = 0;
    let aCount = 0;
    for (let i = 0; i < n - 1; i++) {
      const dx = Math.abs(seq[i + 1].col - seq[i].col);
      const dy = Math.abs(seq[i + 1].row - seq[i].row);
      if (dx === 0 && dy === 0) continue;
      const theta = (Math.atan2(dy, dx) * 180) / Math.PI; // [0,90]
      aSum += Math.abs((2 * theta) / 90 - 1);
      aCount++;
    }
    if (aCount > 0) angleVals.push(aSum / aCount);
  }
  const br = rVals.length ? mean(rVals) : null;
  const inter = interVals.length ? mean(interVals) : null;
  const ang = angleVals.length ? mean(angleVals) : null;
  let orgScore = null;
  if (br != null && inter != null && ang != null) {
    orgScore = +((br + ang + Math.max(0, 1 - inter)) / 3).toFixed(3);
  }
  return {
    bestR: br != null ? +br.toFixed(3) : null,
    intersectRate: inter != null ? +inter.toFixed(3) : null,
    orgAngle: ang != null ? +ang.toFixed(3) : null,
    orgScore,
  };
}

/**
 * Aggregate the per-trial tallies + all inter-tap intervals into a session
 * summary with a 0–100 composite Attention Index.
 *
 * @param trials  array of { tc, found, errors, timeUsed, ies }
 * @param allTaps array of inter-tap intervals (ms) across every trial
 */
export function computeAssessmentSummary(trials, allTaps, opts = {}) {
  const { age = null } = opts;
  const speedFactor = ageSpeedFactor(age); // 1.0 when age unknown → no adjustment
  const totalTargets = trials.reduce((s, t) => s + t.tc, 0);
  const totalHits = trials.reduce((s, t) => s + t.found, 0);
  const totalCommissions = trials.reduce((s, t) => s + t.errors, 0);
  const totalOmissions = Math.max(0, totalTargets - totalHits);
  const totalTime = trials.reduce((s, t) => s + t.timeUsed, 0);
  // SDT noise count: prefer logged distractor counts; fall back to 0 for old
  // sessions that didn't record them (d′ then reports null rather than wrong).
  const totalDistractors = trials.reduce((s, t) => s + (t.distractors ?? 0), 0);
  const { dPrime, criterion } = signalDetection(
    totalHits,
    totalTargets,
    totalCommissions,
    totalDistractors,
  );
  const { cocH, cocV, scanLat } = spatialBias(trials);
  const { bestR, intersectRate, orgAngle, orgScore } = searchOrganization(trials);

  const detection = totalTargets > 0 ? totalHits / totalTargets : 0;
  const responses = totalHits + totalCommissions;
  const precision = responses > 0 ? totalHits / responses : 1;
  const commissionRate = responses > 0 ? totalCommissions / responses : 0;
  const speed = totalTime > 0 ? totalHits / totalTime : 0;

  const valid = (allTaps || []).filter((t) => t > 50 && t < 30000);
  const meanRT = valid.length ? Math.round(mean(valid)) : null;
  const sdRT = valid.length > 1 ? std(valid) : 0;
  const rtCV = meanRT ? +(sdRT / meanRT).toFixed(2) : null;

  const meanIES = +mean(trials.map((t) => t.ies)).toFixed(1);

  // Fatigue slope: % change in hit rate (hits/sec) from the first to the last
  // trial — the clinical signature of sustained-attention decline across a
  // cancellation session (negative = slowing down).
  const perTrialSpeed = trials.map((t) => (t.timeUsed > 0 ? t.found / t.timeUsed : 0));
  const fatigueDelta =
    perTrialSpeed.length >= 2 && perTrialSpeed[0] > 0
      ? +(((perTrialSpeed[perTrialSpeed.length - 1] - perTrialSpeed[0]) / perTrialSpeed[0]) * 100).toFixed(1)
      : null;

  // Component scores 0..1. Speed is judged against an age-adjusted expectation.
  const speedRefAdj = ASSESS_REF.speedRef * speedFactor;
  const detectionScore = Math.max(0, Math.min(1, detection));
  const precisionScore = Math.max(0, Math.min(1, precision));
  const speedScore = Math.max(0, Math.min(1, speed / speedRefAdj));
  const stabilityScore = rtCV != null ? Math.max(0, Math.min(1, 1 - rtCV)) : 0.5;

  // Composite Attention Index (transparent weighting).
  const composite = Math.round(
    100 *
      (0.3 * detectionScore +
        0.2 * precisionScore +
        0.25 * speedScore +
        0.25 * stabilityScore),
  );

  // Interpretation bands bundled so the UI doesn't re-derive them (speed band is
  // age-adjusted; the others are accuracy/stability thresholds, age-independent).
  const bands = {
    composite: compositeBand(composite),
    detection: detectionBand(detection),
    precision: precisionBand(precision),
    speed: speedBand(speed, speedFactor),
    rtcv: rtcvBand(rtCV),
    dprime: dprimeBand(dPrime),
    criterion: criterionBand(criterion),
    spatial: spatialBand(cocH),
    organization: orgBand(orgScore),
  };

  return {
    age,
    speedFactor,
    totalTargets,
    totalHits,
    totalOmissions,
    totalCommissions,
    totalDistractors,
    detection: +detection.toFixed(3),
    precision: +precision.toFixed(3),
    commissionRate: +commissionRate.toFixed(3),
    speed: +speed.toFixed(2),
    meanRT,
    rtCV,
    meanIES,
    fatigueDelta,
    dPrime,
    criterion,
    cocH,
    cocV,
    scanLat,
    bestR,
    intersectRate,
    orgAngle,
    orgScore,
    composite,
    detectionScore: +detectionScore.toFixed(2),
    precisionScore: +precisionScore.toFixed(2),
    speedScore: +speedScore.toFixed(2),
    stabilityScore: +stabilityScore.toFixed(2),
    bands,
  };
}

/* --- Interpretation bands (guideline, self-referenced) -------------------- */
/** Returns 'high' | 'mid' | 'low' for a metric where higher is better. */
function bandHigh(v, good, ok) {
  if (v >= good) return 'high';
  if (v >= ok) return 'mid';
  return 'low';
}
/** Returns 'high' | 'mid' | 'low' for a metric where lower is better. */
function bandLow(v, good, ok) {
  if (v <= good) return 'high';
  if (v <= ok) return 'mid';
  return 'low';
}

export function detectionBand(d) {
  return bandHigh(d, 0.95, 0.85);
}
export function precisionBand(p) {
  return bandHigh(p, 0.95, 0.85);
}
export function speedBand(s, factor = 1) {
  return bandHigh(s, 1.1 * factor, 0.7 * factor);
}
export function rtcvBand(cv) {
  if (cv == null) return 'mid';
  return bandLow(cv, 0.5, 0.8);
}
export function compositeBand(c) {
  return bandHigh(c, 75, 50);
}
/** d′ sensitivity band. Given many distractors → low FA rate, healthy d′ runs
 *  high; guideline thresholds reflect that (≥3 strong, ≥2 typical). */
export function dprimeBand(d) {
  if (d == null) return 'mid';
  return bandHigh(d, 3.0, 2.0);
}
/** Criterion descriptor (not a quality band): c>0 = cautious (holds back),
 *  c<0 = impulsive (over-taps), near 0 = balanced. */
export function criterionBand(c) {
  if (c == null) return 'balanced';
  if (c > 0.35) return 'cautious';
  if (c < -0.35) return 'impulsive';
  return 'balanced';
}
/** Spatial-balance quality from |Center of Cancellation|: near 0 = even
 *  coverage of both sides (good); large = lopsided search/omissions. */
export function spatialBand(coc) {
  if (coc == null) return 'mid';
  const a = Math.abs(coc);
  if (a <= 0.1) return 'high';
  if (a <= 0.25) return 'mid';
  return 'low';
}
/** Search-organization quality from the 0..1 blended score. */
export function orgBand(score) {
  if (score == null) return 'mid';
  return bandHigh(score, 0.75, 0.55);
}

/* --- Persistence ---------------------------------------------------------- */
const ASSESS_KEY = 'mm_cancel_assess_v1';
const HISTORY_CAP = 60;

export function loadAssessHistory() {
  try {
    const j = localStorage.getItem(ASSESS_KEY);
    const arr = j ? JSON.parse(j) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveAssessSession(summary) {
  const history = loadAssessHistory();
  const entry = {
    ts: new Date().toISOString(),
    age: summary.age ?? null,
    composite: summary.composite,
    detection: summary.detection,
    precision: summary.precision,
    commissionRate: summary.commissionRate,
    speed: summary.speed,
    meanRT: summary.meanRT,
    rtCV: summary.rtCV,
    meanIES: summary.meanIES,
    fatigueDelta: summary.fatigueDelta ?? null,
    omissions: summary.totalOmissions,
    commissions: summary.totalCommissions,
    dPrime: summary.dPrime ?? null,
    criterion: summary.criterion ?? null,
    cocH: summary.cocH ?? null,
    cocV: summary.cocV ?? null,
    scanLat: summary.scanLat ?? null,
    bestR: summary.bestR ?? null,
    intersectRate: summary.intersectRate ?? null,
    orgScore: summary.orgScore ?? null,
  };
  const next = [...history, entry].slice(-HISTORY_CAP);
  try {
    localStorage.setItem(ASSESS_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  return next;
}
