/* =============================================================================
 * ASSESSMENT PROFILE  (shared across all domain assessments)
 *
 * Stores the user's age and gender once (editable) so assessments can be
 * AGE-FITTED. Processing speed and reaction time change substantially across
 * the lifespan (rise through childhood, peak in the late teens/twenties, then
 * gradually slow) — Salthouse (1996), Fjell et al. (2017). We therefore scale
 * the *expected* speed by age band, so a score "fits the age": an older or
 * younger user is judged against an age-appropriate expectation, not a single
 * young-adult benchmark.
 *
 * Gender is recorded for the report but does NOT adjust scores — evidence for
 * gender differences on cancellation/visual-search speed is small and
 * inconsistent, so applying a correction would be unjustified.
 * ========================================================================== */

import { loadJson, saveJson } from '../../../lib/storage';

const PROFILE_KEY = 'mm_assess_profile_v1';

export const GENDER_OPTIONS = ['female', 'male', 'other', 'na'];

/** Age bands with a relative speed factor (1.0 = young-adult reference). */
export const AGE_BANDS = [
  { id: 'child', min: 6, max: 12, factor: 0.68 },
  { id: 'teen', min: 13, max: 17, factor: 0.9 },
  { id: 'ya', min: 18, max: 29, factor: 1.0 },
  { id: 'adult', min: 30, max: 49, factor: 0.95 },
  { id: 'midlife', min: 50, max: 64, factor: 0.85 },
  { id: 'senior', min: 65, max: 120, factor: 0.72 },
];

export function ageBand(age) {
  const a = Number(age);
  if (!Number.isFinite(a)) return null;
  return AGE_BANDS.find((b) => a >= b.min && a <= b.max) || null;
}

/** Relative expected-speed factor for an age (1.0 if unknown → no adjustment). */
export function ageSpeedFactor(age) {
  return ageBand(age)?.factor ?? 1.0;
}

export function loadAssessProfile() {
  const p = loadJson(PROFILE_KEY);
  if (p) {
    return {
      age: typeof p.age === 'number' ? p.age : null,
      gender: GENDER_OPTIONS.includes(p.gender) ? p.gender : null,
    };
  }
  return { age: null, gender: null };
}

export function saveAssessProfile({ age, gender }) {
  const clean = {
    age: Number.isFinite(Number(age)) ? Math.max(6, Math.min(120, Math.round(Number(age)))) : null,
    gender: GENDER_OPTIONS.includes(gender) ? gender : null,
  };
  saveJson(PROFILE_KEY, clean);
  return clean;
}

export function hasAssessProfile() {
  const p = loadAssessProfile();
  return p.age != null;
}

/* =============================================================================
 * Combined multi-domain assessment: session history + scoring helpers.
 * Each domain reports a 0–100 score; the overall Cognitive Index is their mean.
 * ========================================================================== */
export const ASSESS_DOMAINS = ['attention', 'speed', 'memory', 'language', 'reasoning', 'flexibility'];

const SESSIONS_KEY = 'mm_assess_sessions_v1';
const SESSIONS_CAP = 60;

export function loadAssessSessions() {
  const arr = loadJson(SESSIONS_KEY, []);
  return Array.isArray(arr) ? arr : [];
}

/** Save a completed session: { scores: {domain: 0-100}, full: bool }. Returns updated list. */
export function saveAssessSession({ scores, full }) {
  const vals = ASSESS_DOMAINS.map((d) => scores[d]).filter((v) => typeof v === 'number');
  const overall = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  const prof = loadAssessProfile();
  const entry = {
    ts: new Date().toISOString(),
    age: prof.age ?? null,
    gender: prof.gender ?? null,
    scores: { ...scores },
    overall,
    full: !!full,
  };
  const next = [...loadAssessSessions(), entry].slice(-SESSIONS_CAP);
  saveJson(SESSIONS_KEY, next);
  return next;
}

/** 0–100 → 'high' | 'mid' | 'low' band. */
export function scoreBand(v) {
  if (v == null) return 'mid';
  if (v >= 75) return 'high';
  if (v >= 50) return 'mid';
  return 'low';
}

/* =============================================================================
 * Baseline + progress (self-referenced) — derived from session history.
 * ========================================================================== */

/** Chronological raw-score series for a domain across all sessions that tested it. */
export function domainSeries(domain, sessions = loadAssessSessions()) {
  return sessions
    .filter((s) => typeof s?.scores?.[domain] === 'number')
    .map((s) => ({ ts: s.ts, age: s.age ?? null, score: s.scores[domain] }));
}

/** The first ("baseline") recorded score for a domain, or null. */
export function baselineFor(domain, sessions = loadAssessSessions()) {
  const series = domainSeries(domain, sessions);
  return series.length ? series[0] : null;
}

/** latest − baseline for a domain (null if fewer than 2 points). */
export function deltaVsBaseline(domain, sessions = loadAssessSessions()) {
  const series = domainSeries(domain, sessions);
  if (series.length < 2) return null;
  return series[series.length - 1].score - series[0].score;
}

/** Chronological overall Cognitive-Index-style series (mean of each session's scores). */
export function overallSeries(sessions = loadAssessSessions()) {
  return sessions
    .map((s) => ({ ts: s.ts, overall: typeof s.overall === 'number' ? s.overall : null }))
    .filter((s) => s.overall != null);
}
