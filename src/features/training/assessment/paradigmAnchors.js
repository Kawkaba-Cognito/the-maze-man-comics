/* =============================================================================
 * PARADIGM ANCHORS — published reference values for the RAW clinical metrics.
 *
 * The 0–100 score layer (assessmentNorms) answers "how did I do overall?".
 * This layer answers the more clinical question: "is a forward span of 6, an
 * interference cost of 45 ms, a substitution rate of 31/min… typical?" by
 * anchoring each paradigm's primary raw metric to published healthy-adult
 * values:
 *   • DSST/Coding rate: ≈ 35 ± 9 correct/min, age-curved (Wechsler WAIS-IV;
 *     Jaeger 2018)
 *   • Spatial interference (Simon/Stroop) cost: ≈ 20–80 ms
 *     (Lu & Proctor 1995)
 *   • Task-switch cost: ≈ 100–300 ms unpracticed (Monsell 2003)
 *   • PVT median RT: ≈ 285 ± 50 ms in alert adults (Basner & Dinges 2011)
 *
 * HONESTY: paper/lab values, not touch-screen norms — a phone adds motor and
 * display latency, so these are GUIDELINE ranges (±1 SD shown as "typical"),
 * and within-person change remains the valid signal. Memory (Dual N-Back),
 * Language and Reasoning raw metrics have no clean published analog for our
 * grid/jam/N-back variants and are reported self-referenced.
 *
 * Raw metrics are read from each game's latest banked assessment session in
 * the Phase-1 trial log, so lines appear once a (post-upgrade) assessment ran.
 * ========================================================================== */

import { latestTrialSession } from '../shared/trialLog';
import { ageSpeedFactor } from './assessmentProfile';

export const ANCHORS = {
  dsstIpm: { mean: 35, sd: 9, unit: '/min', cite: 'Wechsler; Jaeger 2018', ageCurved: true },
  interferenceMs: { mean: 50, sd: 30, unit: 'ms', cite: 'Lu & Proctor 1995', lowerBetter: true },
  switchCostMs: { mean: 200, sd: 100, unit: 'ms', cite: 'Monsell 2003', lowerBetter: true },
  pvtMedianMs: { mean: 285, sd: 50, unit: 'ms', cite: 'Basner & Dinges 2011', lowerBetter: true },
};

/** "Typical" = mean ± 1 SD, age-curved where the literature is (speed). */
export function typicalRange(key, age) {
  const a = ANCHORS[key];
  if (!a) return null;
  const f = a.ageCurved ? ageSpeedFactor(age) : 1;
  return [Math.round((a.mean - a.sd) * f), Math.round((a.mean + a.sd) * f)];
}

/** 'above' | 'typical' | 'below' vs the ±1 SD band ("above" = better side). */
export function anchorBand(key, value, age) {
  const a = ANCHORS[key];
  if (!a || typeof value !== 'number') return null;
  const [lo, hi] = typicalRange(key, age);
  if (value < lo) return a.lowerBetter ? 'above' : 'below';
  if (value > hi) return a.lowerBetter ? 'below' : 'above';
  return 'typical';
}

const fmtRange = (key, age, isAr) => {
  const r = typicalRange(key, age);
  const a = ANCHORS[key];
  if (!r) return '';
  return isAr ? `(المعتاد ${r[0]}–${r[1]}${a.unit})` : `(typical ${r[0]}–${r[1]}${a.unit})`;
};

/**
 * One localized interpretation line per domain, built from the latest banked
 * assessment session's raw metrics. Returns null when no (post-upgrade)
 * assessment data exists for that domain — callers simply omit the line.
 */
export function assessAnchorLine(domainId, isAr, age) {
  try {
    if (domainId === 'memory') {
      const r = latestTrialSession('nback', 'assess')?.result;
      if (r?.bestN == null) return null;
      // No clean published "typical N reached" norm for this variant/pacing —
      // reported self-referenced, same honesty rule as Language/Reasoning below.
      return isAr ? `أعلى مستوى موثوق: ${r.bestN}-عودة` : `sustained ${r.bestN}-back reliably`;
    }
    if (domainId === 'speed') {
      const r = latestTrialSession('speed-match', 'assess')?.result;
      if (r?.ipm == null) return null;
      const ratio = r.motorIpm ? (r.ipm / r.motorIpm).toFixed(2) : null;
      const base = isAr
        ? `${r.ipm}/د ${fmtRange('dsstIpm', age, isAr)}`
        : `${r.ipm}/min ${fmtRange('dsstIpm', age, isAr)}`;
      return ratio
        ? `${base} · ${isAr ? 'نسبة حركية' : 'motor ratio'} ${ratio}`
        : base;
    }
    if (domainId === 'flexibility') {
      const r = latestTrialSession('spatial-stroop', 'assess')?.result;
      if (r?.congruencyEffect == null && r?.switchCost == null) return null;
      const parts = [];
      if (r.congruencyEffect != null) {
        parts.push(
          isAr
            ? `تداخل ${r.congruencyEffect}مث ${fmtRange('interferenceMs', age, isAr)}`
            : `interference ${r.congruencyEffect}ms ${fmtRange('interferenceMs', age, isAr)}`,
        );
      }
      if (r.switchCost != null) {
        parts.push(
          isAr
            ? `كلفة تبديل ${r.switchCost}مث ${fmtRange('switchCostMs', age, isAr)}`
            : `switch cost ${r.switchCost}ms ${fmtRange('switchCostMs', age, isAr)}`,
        );
      }
      return parts.join(' · ') || null;
    }
    if (domainId === 'attention') {
      const r = latestTrialSession('cancel-task', 'assess')?.result;
      if (r?.meanRT == null && r?.composite == null) return null;
      const det = r.detection != null ? `${Math.round(r.detection * 100)}%` : '—';
      return isAr
        ? `كشف ${det} · متوسط ${r.meanRT ?? '—'}مث · CV ${r.rtCV ?? '—'} (مرجعك الذاتي)`
        : `detection ${det} · mean ${r.meanRT ?? '—'}ms · CV ${r.rtCV ?? '—'} (self-referenced)`;
    }
    if (domainId === 'reasoning') {
      const s = latestTrialSession('rush-hour', 'assess');
      const tr = s?.trials?.find((x) => typeof x.plan === 'number');
      if (!tr) return null;
      const over = tr.moves != null && tr.par != null ? tr.moves - tr.par : null;
      const planS = (tr.plan / 1000).toFixed(1);
      return isAr
        ? `زمن التخطيط ${planS}ث${over != null ? ` · ${over} فوق الأمثل` : ''} (مرجعك الذاتي)`
        : `planning ${planS}s${over != null ? ` · ${over} over par` : ''} (self-referenced)`;
    }
    if (domainId === 'language') {
      const r = latestTrialSession('wordle', 'assess')?.result;
      if (r?.words == null) return null;
      return isAr
        ? `${r.words} كلمة/١٢٠ث (مرجعك الذاتي)`
        : `${r.words} words/120s (self-referenced)`;
    }
  } catch {
    /* interpretation must never break the report */
  }
  return null;
}
