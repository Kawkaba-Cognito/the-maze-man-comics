/* =============================================================================
 * NORMATIVE MODEL  (age-fitted percentiles + standard scores)
 *
 * Turns each domain's 0–100 score into an AGE-GROUP comparison, the way Lumosity
 * (LPI + age percentiles) and BrainHQ (age/sex percentiles) present results.
 *
 * HONESTY: these are RESEARCH-INFORMED reference values, NOT validated clinical
 * or population norms — we have no normative sample. They encode the well-
 * replicated finding that different abilities peak at different ages:
 *   • FLUID abilities (processing speed, working memory, reasoning, attention,
 *     cognitive flexibility) rise through childhood, peak in the late teens–20s,
 *     then gradually decline.        (Salthouse 1996; Park & Reuter-Lorenz 2009;
 *                                      Verhaeghen 2003; Hartshorne & Germine 2015)
 *   • CRYSTALLIZED ability (vocabulary/language) keeps rising into midlife.
 *                                     (Horn & Cattell 1967; Hartshorne & Germine 2015)
 * The scientifically valid use is WITHIN a single person OVER TIME (see baseline
 * + progress). The age comparison is a guideline, clearly labelled as such.
 * ========================================================================== */

import { ASSESS_DOMAINS, ageBand } from './assessmentProfile';

/** Age-trajectory multipliers on the reference mean, by age-band id. */
const CURVES = {
  fluid: { child: 0.8, teen: 0.92, ya: 1.0, adult: 0.96, midlife: 0.88, senior: 0.78 },
  speed: { child: 0.78, teen: 0.92, ya: 1.0, adult: 0.94, midlife: 0.84, senior: 0.72 },
  crystallized: { child: 0.7, teen: 0.85, ya: 0.95, adult: 1.0, midlife: 1.02, senior: 0.98 },
};

/** Per-domain young-adult reference mean + SD (on the 0–100 score scale) + curve. */
export const DOMAIN_NORMS = {
  attention: { refMean: 60, sd: 16, curve: 'fluid' },
  speed: { refMean: 58, sd: 16, curve: 'speed' },
  memory: { refMean: 58, sd: 16, curve: 'fluid' },
  language: { refMean: 60, sd: 15, curve: 'crystallized' },
  reasoning: { refMean: 56, sd: 16, curve: 'fluid' },
  flexibility: { refMean: 58, sd: 16, curve: 'fluid' },
};

export const BAND_KEYS = ['low', 'below', 'average', 'above', 'high'];

export const NORM_DISCLAIMER =
  'Comparisons use research-informed reference values, not validated clinical or population norms. ' +
  'Treat the age-group standing as a guideline; the most reliable signal is your own change over time.';

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
function mean(a) {
  return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
}

/** Abramowitz & Stegun 7.1.26 erf approximation → standard-normal CDF. */
function erf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return x >= 0 ? y : -y;
}
export function normCdf(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/** Age-fitted expected mean for a domain (falls back to the reference mean if age unknown). */
export function ageMean(domain, age) {
  const n = DOMAIN_NORMS[domain];
  if (!n) return 50;
  const band = ageBand(age);
  const factor = band ? CURVES[n.curve]?.[band.id] ?? 1 : 1;
  return n.refMean * factor;
}

/** percentile → band key. */
export function normBand(pct) {
  if (pct == null) return 'average';
  if (pct <= 9) return 'low';
  if (pct <= 24) return 'below';
  if (pct <= 74) return 'average';
  if (pct <= 90) return 'above';
  return 'high';
}

/** Full normative stats for one domain score. */
export function domainStats(domain, score, age) {
  const n = DOMAIN_NORMS[domain];
  if (!n || typeof score !== 'number') return null;
  const m = ageMean(domain, age);
  const z = (score - m) / n.sd;
  const percentile = clamp(Math.round(100 * normCdf(z)), 1, 99);
  const standardScore = clamp(Math.round(100 + 15 * z), 40, 160);
  return { z, percentile, standardScore, band: normBand(percentile), expectedMean: Math.round(m), sd: n.sd };
}

/* =============================================================================
 * RELIABILITY (measurement precision)
 *
 * Test–retest reliability coefficients (r) are literature-informed typical
 * values for each paradigm — NOT measured on this app. They drive:
 *  • SEM (standard error of measurement) = SD·√(1−r) → confidence intervals,
 *    so a single score is shown with its real uncertainty (Wechsler/clinical style).
 *  • RCI (Reliable Change Index; Jacobson & Truax 1991) = (post−pre)/(SEM·√2):
 *    a change is "reliable" (not noise) only when |RCI| ≥ 1.96.
 * ========================================================================== */
export const DOMAIN_RELIABILITY = {
  attention: 0.8,   // cancellation / CPT-type (Uttl & Pilkenton-Taylor 2001)
  speed: 0.85,      // Digit-Symbol Substitution — high test-retest (Wechsler)
  memory: 0.7,      // Corsi block span (Kessels et al. 2000)
  language: 0.75,   // verbal fluency (Shao et al. 2014)
  reasoning: 0.65,  // planning/problem-solving (Tower-type; lower r)
  flexibility: 0.7, // Stroop/switching interference scores
};

const Z90 = 1.645; // 90% confidence

export function reliabilityFor(domain) {
  return DOMAIN_RELIABILITY[domain] ?? 0.7;
}
/** SEM on the 0–100 score scale. */
export function semScore(domain) {
  const n = DOMAIN_NORMS[domain];
  return (n?.sd ?? 16) * Math.sqrt(1 - reliabilityFor(domain));
}
/** SEM on the standard-score scale (SD 15). */
export function semSS(domain) {
  return 15 * Math.sqrt(1 - reliabilityFor(domain));
}
/** 90% confidence interval [lo, hi] around a standard score. */
export function ssConfInterval(ss, domain) {
  const e = Z90 * semSS(domain);
  return [clamp(Math.round(ss - e), 40, 160), clamp(Math.round(ss + e), 40, 160)];
}
/**
 * Reliable Change Index on a RAW metric scale (ms, span, items/min…), for
 * measures that live outside the 0–100 score system (e.g. the weekly PVT
 * check). Same Jacobson & Truax logic: |RCI| ≥ 1.96 = beyond noise.
 */
export function reliableChangeRaw(delta, sd, r) {
  if (delta == null || !sd) return null;
  const sdiff = sd * Math.sqrt(1 - (r ?? 0.7)) * Math.SQRT2;
  if (!sdiff) return null;
  const rci = delta / sdiff;
  return {
    rci: +rci.toFixed(2),
    reliable: Math.abs(rci) >= 1.96,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
  };
}

/** Reliable Change Index for a baseline→latest delta (0–100 points). */
export function reliableChange(delta, domain) {
  if (delta == null) return null;
  const sdiff = semScore(domain) * Math.SQRT2;
  if (!sdiff) return null;
  const rci = delta / sdiff;
  return {
    rci: +rci.toFixed(2),
    reliable: Math.abs(rci) >= 1.96,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
  };
}

/** Overall Cognitive Index = mean standard score across tested domains (+ percentile/band/CI). */
export function cognitiveIndex(scores, age) {
  const zs = [];
  const semSq = [];
  for (const d of ASSESS_DOMAINS) {
    const s = scores?.[d];
    if (typeof s === 'number') {
      const st = domainStats(d, s, age);
      if (st) {
        zs.push(st.z);
        semSq.push(semSS(d) ** 2);
      }
    }
  }
  if (!zs.length) return null;
  const mz = mean(zs);
  const index = clamp(Math.round(100 + 15 * mz), 40, 160);
  const pct = clamp(Math.round(100 * normCdf(mz)), 1, 99);
  // SEM of the mean of standard scores → tighter CI for the composite (more reliable).
  const semIdx = Math.sqrt(mean(semSq) / semSq.length);
  const e = Z90 * semIdx;
  return {
    index,
    percentile: pct,
    band: normBand(pct),
    domains: zs.length,
    ciLo: clamp(Math.round(index - e), 40, 160),
    ciHi: clamp(Math.round(index + e), 40, 160),
  };
}

/** Ordinal suffix for a percentile, e.g. 1→"1st", 22→"22nd". */
export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
