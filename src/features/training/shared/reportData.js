/*
 * REPORT DATA — deep psychometric report per game, computed from the
 * per-trial logs (trialLog.js). Pure JS, no React.
 *
 * The trial log already banks, per session: the hygiene summary (accuracy,
 * median/SD RT on cleaned correct trials, IES, post-error slowing, exclusion
 * counts) plus every raw trial. This module turns that into the per-paradigm
 * "clinical card" numbers the stats screen renders:
 *   – Arrow Rush: congruency (interference) cost & switch cost from trial tags
 *   – Cancellation: omissions/commissions totals + within-run fatigue (hit-rate
 *     change first→last round of the latest run)
 *   – Memo Span: best forward/backward span reached
 *   – Rush Hour: mean planning latency (first-move) & moves over par
 *   – Word Maze: word rate + mean inter-word gap (fluency pacing)
 *   – Speed Match: largest key mastered
 */
import { loadTrialSessions } from './trialLog';
import { mean, median, RT_MIN_MS } from './metrics';

const finite = (v) => Number.isFinite(v);
const r0 = (v) => (v == null ? null : Math.round(v));

/** Mean cleaned correct-RT of the subset matching `pred` (null if < 3). */
function condMean(trials, pred) {
  const rts = trials
    .filter((tr) => tr.ok === true && finite(tr.rt) && tr.rt >= RT_MIN_MS && pred(tr))
    .map((tr) => tr.rt);
  return rts.length >= 3 ? mean(rts) : null;
}

function stroopExtras(trials) {
  const cong = condMean(trials, (tr) => tr.cong === true);
  const incong = condMean(trials, (tr) => tr.cong === false);
  const rep = condMean(trials, (tr) => tr.sw === false);
  const sw = condMean(trials, (tr) => tr.sw === true);
  return {
    interferenceMs: cong != null && incong != null ? r0(incong - cong) : null,
    switchCostMs: rep != null && sw != null ? r0(sw - rep) : null,
  };
}

function cancelExtras(trials) {
  const rounds = trials.filter((tr) => tr.kind === 'round');
  if (!rounds.length) return {};
  const omissions = rounds.reduce((s, x) => s + (x.omissions || 0), 0);
  const commissions = rounds.reduce((s, x) => s + (x.errors || 0), 0);
  const rates = rounds
    .filter((x) => x.timeUsed > 0)
    .map((x) => x.found / x.timeUsed);
  const fatiguePct =
    rates.length >= 2 && rates[0] > 0
      ? r0(((rates[rates.length - 1] - rates[0]) / rates[0]) * 100)
      : null;
  return { omissions, commissions, fatiguePct, fatigueCurve: rates.map((x) => +x.toFixed(2)) };
}

function memoExtras(trials) {
  const best = (dir) =>
    trials
      .filter((tr) => tr.ok === true && tr.dir === dir && finite(tr.span))
      .reduce((m, tr) => Math.max(m, tr.span), 0) || null;
  return { fwdSpan: best('fwd'), bwdSpan: best('bwd') };
}

function rushExtras(trials) {
  const solved = trials.filter((tr) => tr.ok === true);
  const plans = solved.filter((tr) => finite(tr.plan)).map((tr) => tr.plan);
  const overs = solved
    .filter((tr) => finite(tr.moves) && finite(tr.par))
    .map((tr) => tr.moves - tr.par);
  return {
    planMs: plans.length ? r0(mean(plans)) : null,
    movesOverPar: overs.length ? +mean(overs).toFixed(1) : null,
  };
}

function wordleExtras(trials) {
  const words = trials.filter((tr) => tr.ok === true && tr.w);
  const gaps = [];
  for (let i = 1; i < words.length; i++) gaps.push(words[i].t - words[i - 1].t);
  return {
    words: words.length || null,
    wordGapMs: gaps.length >= 2 ? r0(median(gaps)) : null,
    bestWordLen: words.length ? Math.max(...words.map((w) => w.len || 0)) : null,
  };
}

function speedExtras(trials) {
  const keys = trials.filter((tr) => finite(tr.key)).map((tr) => tr.key);
  return { maxKey: keys.length ? Math.max(...keys) : null };
}

const EXTRAS = {
  'spatial-stroop': stroopExtras,
  'cancel-task': cancelExtras,
  'memo-span': memoExtras,
  'rush-hour': rushExtras,
  wordle: wordleExtras,
  'speed-match': speedExtras,
};

/**
 * Deep report for one game, or null when no sessions are banked yet.
 * `series` is the cross-session trend (median RT where the paradigm has one,
 * accuracy otherwise) oldest → newest, for sparklines.
 */
export function gameDeepReport(gameKey) {
  const sessions = loadTrialSessions(gameKey);
  if (!sessions.length) return null;
  const latest = sessions[sessions.length - 1];
  const rtSeries = sessions.map((s) => s.summary?.medianRt).filter(finite);
  const accSeries = sessions.map((s) =>
    s.summary?.acc != null ? Math.round(s.summary.acc * 100) : null,
  ).filter(finite);
  const seriesKind = rtSeries.length >= 2 ? 'medianRt' : 'acc';
  return {
    gameKey,
    sessions: sessions.length,
    when: latest.when,
    mode: latest.mode,
    summary: latest.summary || {},
    extras: EXTRAS[gameKey] ? EXTRAS[gameKey](latest.trials || []) : {},
    series: seriesKind === 'medianRt' ? rtSeries : accSeries,
    seriesKind,
  };
}
