/*
 * WORKOUT STATS — aggregates two evidence streams:
 *
 *  1) ADHERENCE (the workout calendar). Regular, *distributed* practice is one
 *     of the most robust findings in the learning sciences — spacing sessions
 *     across days improves consolidation (Cepeda et al. 2006; Bell et al. 2022,
 *     PNAS; Feng et al. 2019, J Neurosci). The calendar/streak make dose visible.
 *
 *  2) OUTCOME (assessment-derived scores over time). The scientifically valid
 *     signal for an individual is WITHIN-PERSON CHANGE vs their own baseline,
 *     judged with a Reliable Change Index, not far-transfer claims (Simons et al.
 *     2016; Sala & Gobet 2019). All of this reuses the assessment engine.
 */
import { loadWorkout } from './workoutState';
import {
  loadAssessSessions, loadAssessProfile, ASSESS_DOMAINS,
  baselineFor, domainSeries, overallSeries,
} from '../training/assessment/assessmentProfile';
import { domainStats, cognitiveIndex, reliableChange } from '../training/assessment/assessmentNorms';

function ymd(d) { return d.toISOString().slice(0, 10); }
function parseYmd(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }

/** Adherence stats from the per-day history map. */
export function adherenceStats() {
  const st = loadWorkout();
  const hist = st.history || {};
  const days = Object.keys(hist).filter((d) => (hist[d]?.done || 0) > 0).sort();
  const set = new Set(days);

  // longest run of consecutive calendar days with any training
  let longest = 0, run = 0, prev = null;
  for (const d of days) {
    if (prev && (parseYmd(d) - parseYmd(prev)) === 86400000) run += 1; else run = 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  const now = new Date();
  const thisMonth = days.filter((d) => {
    const dt = parseYmd(d);
    return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
  }).length;

  // last-28-day consistency %
  let trained28 = 0;
  for (let i = 0; i < 28; i++) {
    const dt = new Date(now); dt.setDate(now.getDate() - i);
    if (set.has(ymd(dt))) trained28 += 1;
  }

  return {
    history: hist,
    totalDays: days.length,
    thisMonth,
    longestStreak: longest,
    currentStreak: st.streak || 0,
    consistency28: Math.round((trained28 / 28) * 100),
  };
}

/** Calendar cells for a given month (year, monthIndex). */
export function monthCalendar(year, monthIndex, history = loadWorkout().history || {}) {
  const first = new Date(year, monthIndex, 1);
  const startDow = first.getDay(); // 0=Sun
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = ymd(new Date(year, monthIndex, d));
    const h = history[key];
    cells.push({ day: d, key, done: h?.done || 0, total: h?.total || 0, full: h && h.done >= h.total && h.total > 0 });
  }
  return cells;
}

/** Most recent assessment session's per-domain scores (or null). */
export function latestScores(sessions = loadAssessSessions()) {
  for (let i = sessions.length - 1; i >= 0; i--) if (sessions[i]?.scores) return sessions[i];
  return null;
}

/**
 * Full progress snapshot used by the stats screen:
 *   cognitive index (now + baseline + reliable change), per-domain normative
 *   stats + change vs baseline, and time series for sparklines.
 */
export function progressSnapshot() {
  const sessions = loadAssessSessions();
  const { age } = loadAssessProfile();
  const latest = latestScores(sessions);
  const hasData = !!latest;

  const overall = overallSeries(sessions);
  const idxNow = latest ? cognitiveIndex(latest.scores, age) : null;

  // baseline cognitive index (first session's scores)
  let idxBaseline = null;
  if (sessions.length) {
    const firstScores = sessions.find((s) => s?.scores)?.scores;
    if (firstScores) idxBaseline = cognitiveIndex(firstScores, age);
  }
  const idxDelta = idxNow && idxBaseline ? idxNow.index - idxBaseline.index : null;

  const domains = ASSESS_DOMAINS.map((d) => {
    const score = latest?.scores?.[d];
    const base = baselineFor(d, sessions);
    const series = domainSeries(d, sessions).map((p) => p.score);
    const stats = typeof score === 'number' ? domainStats(d, score, age) : null;
    const delta = typeof score === 'number' && base ? Math.round(score - base.score) : null;
    return {
      domain: d,
      score: typeof score === 'number' ? Math.round(score) : null,
      baseline: base ? Math.round(base.score) : null,
      delta,
      change: reliableChange(delta, d),
      stats,
      series,
      sessions: series.length,
    };
  });

  return { hasData, age, sessionCount: sessions.length, idxNow, idxBaseline, idxDelta, overall: overall.map((o) => o.overall), domains };
}
