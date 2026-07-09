/*
 * DAILY WORKOUT — persisted state (localStorage).
 *
 * Holds the user's prefs (goal + size), today's generated plan with per-exercise
 * completion, the streak, and per-domain session counts that feed adaptive
 * difficulty. All pure functions returning the updated state.
 */
import { todayKey, generatePlan } from './workoutPlan';
import { loadAssessProfile, loadAssessSessions } from '../training/assessment/assessmentProfile';

const KEY = 'mm_workout_v1';

export function loadWorkout() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function save(st) {
  try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* ignore */ }
  return st;
}

/** Most recent assessment's per-domain scores (or {}). */
function latestAssessment() {
  const ss = loadAssessSessions();
  for (let i = ss.length - 1; i >= 0; i--) {
    if (ss[i]?.scores) return { scores: ss[i].scores, ts: ss[i].ts || 0 };
  }
  return { scores: {}, ts: 0 };
}

/** age + scores used by the planner / difficulty. */
export function getDerived() {
  const { scores, ts } = latestAssessment();
  return { age: loadAssessProfile().age, scores, assessTs: ts };
}

export function savePrefs(goal, size) {
  const st = loadWorkout();
  st.prefs = { goal, size };
  st.today = null; // regenerate for the new prefs
  return ensureToday(save(st));
}

/** Generate today's plan if missing / stale (new day or changed prefs). */
export function ensureToday(st = loadWorkout()) {
  if (!st.prefs) return st;
  const date = todayKey();
  const t = st.today;
  const { age, scores, assessTs } = getDerived();
  const reactionDue = checkDue(st).due;
  if (t && t.date === date && t.goal === st.prefs.goal && t.size === st.prefs.size && t.assessTs === assessTs) return st;
  // Mid-day re-assessment: keep in-progress plan; only refresh scores for tomorrow.
  if (t && t.date === date && t.goal === st.prefs.goal && t.size === st.prefs.size && t.done?.some(Boolean)) {
    st.today = { ...t, assessTs };
    return save(st);
  }
  const exercises = generatePlan({
    date, goal: st.prefs.goal, size: st.prefs.size, age, scores,
    domainCompleted: st.domainCompleted || {},
    reactionReserve: reactionDue,
  });
  st.today = { date, goal: st.prefs.goal, size: st.prefs.size, assessTs, exercises, done: exercises.map(() => false) };
  return save(st);
}

/** Mark exercise `idx` done; bumps domain count and (if the day is complete) the streak. */
export function markDone(idx) {
  const st = loadWorkout();
  if (!st.today || st.today.done[idx]) return st;
  st.today.done[idx] = true;
  const ex = st.today.exercises[idx];
  st.domainCompleted = st.domainCompleted || {};
  st.domainCompleted[ex.domainId] = (st.domainCompleted[ex.domainId] || 0) + 1;

  // Per-day history for the calendar (date → { done, total, preRT?, postRT? }).
  // Merge — recordSessionTest may already have stored test results here.
  st.history = st.history || {};
  st.history[st.today.date] = {
    ...st.history[st.today.date],
    done: st.today.done.filter(Boolean).length,
    total: st.today.exercises.length,
  };

  if (st.today.done.every(Boolean) && st.lastCompleteDate !== st.today.date) {
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yk = todayKey(y);
    st.streak = st.lastCompleteDate === yk ? (st.streak || 0) + 1 : 1;
    st.lastCompleteDate = st.today.date;
    st.justCompleted = true; // one-shot flag for the UI celebration + bonus
  }
  return save(st);
}

/**
 * WEEKLY CHECK-IN — a reaction test (median ms) taken roughly once a week at
 * the start of a workout. The series is the longitudinal outcome measure:
 * comparing checks across weeks shows the training response, which is the
 * clinically meaningful comparison (single-session pre/post mostly measures
 * fatigue).
 */
export function checkDue(st = loadWorkout()) {
  const cs = st.checks || [];
  if (!cs.length) return { due: true, prev: null, last: null };
  const last = cs[cs.length - 1];
  const days = (Date.now() - new Date(last.date).getTime()) / 86400000;
  return { due: days >= 7, prev: cs.length > 1 ? cs[cs.length - 2] : null, last };
}

export function recordCheck(ms) {
  const st = loadWorkout();
  st.checks = [...(st.checks || []), { date: todayKey(), ms: Math.round(ms) }].slice(-104);
  return save(st);
}

export function allChecks(st = loadWorkout()) {
  return st.checks || [];
}

export function consumeJustCompleted() {
  const st = loadWorkout();
  if (!st.justCompleted) return false;
  st.justCompleted = false;
  save(st);
  return true;
}

export function resetPrefs() {
  const st = loadWorkout();
  st.prefs = null; st.today = null;
  return save(st);
}

/* ── Daily reminder ─────────────────────────────────────────────────────── */

// `days` = weekday indices to remind on (0=Sun … 6=Sat). Default: every day.
const DEFAULT_REMINDER = { enabled: false, time: '08:00', days: [0, 1, 2, 3, 4, 5, 6] };

export function getReminder(st = loadWorkout()) {
  const r = { ...DEFAULT_REMINDER, ...(st.reminder || {}) };
  if (!Array.isArray(r.days) || !r.days.length) r.days = [...DEFAULT_REMINDER.days];
  return r;
}

export function saveReminder({ enabled, time, days }) {
  const st = loadWorkout();
  const safeDays = Array.isArray(days) && days.length ? [...new Set(days)].sort() : [...DEFAULT_REMINDER.days];
  st.reminder = { enabled: !!enabled, time: time || DEFAULT_REMINDER.time, days: safeDays };
  return save(st);
}

/** Is today's workout fully complete? */
export function isDoneToday(st = loadWorkout()) {
  const t = st.today;
  return !!(t && t.date === todayKey() && t.exercises?.length && t.done?.every(Boolean));
}

/**
 * Should the in-app reminder banner show right now? True when a reminder is set,
 * the chosen time has passed today, the workout isn't done, and the user hasn't
 * already dismissed today's banner.
 */
export function reminderDue(st = loadWorkout(), now = new Date()) {
  const r = getReminder(st);
  if (!r.enabled) return false;
  if (!r.days.includes(now.getDay())) return false; // not a scheduled weekday
  if (isDoneToday(st)) return false;
  if (st.reminderDismissed === todayKey()) return false;
  const [h, m] = r.time.split(':').map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= h * 60 + m;
}

/** Suppress the banner for the rest of today. */
export function dismissReminder() {
  const st = loadWorkout();
  st.reminderDismissed = todayKey();
  return save(st);
}
