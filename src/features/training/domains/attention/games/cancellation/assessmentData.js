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

function mean(a) {
  return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
}
function std(a) {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(mean(a.map((x) => (x - m) ** 2)));
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
  };

  return {
    age,
    speedFactor,
    totalTargets,
    totalHits,
    totalOmissions,
    totalCommissions,
    detection: +detection.toFixed(3),
    precision: +precision.toFixed(3),
    commissionRate: +commissionRate.toFixed(3),
    speed: +speed.toFixed(2),
    meanRT,
    rtCV,
    meanIES,
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
    omissions: summary.totalOmissions,
    commissions: summary.totalCommissions,
  };
  const next = [...history, entry].slice(-HISTORY_CAP);
  try {
    localStorage.setItem(ASSESS_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  return next;
}
