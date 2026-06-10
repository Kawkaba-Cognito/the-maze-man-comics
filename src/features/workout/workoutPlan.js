/*
 * DAILY WORKOUT — plan generator.
 *
 * Deterministic per (date, goal, size) so the plan is stable through the day
 * but fresh tomorrow. Picks `count` exercises by weighted domain sampling
 * (goal-driven), discouraging repeats so the session feels varied.
 */
import { exercisePool, GOALS_BY_ID, SIZES_BY_ID, difficultyFor } from './workoutData';
import { ASSESS_DOMAINS } from '../training/assessment/assessmentProfile';

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Domain weights for a goal. 'weak' (null weights) → inverse of assessment scores. */
export function weightsFor(goalId, scores) {
  const goal = GOALS_BY_ID[goalId] || GOALS_BY_ID.overall;
  if (goal.weights) return { ...goal.weights };
  const w = {};
  ASSESS_DOMAINS.forEach((d) => {
    const s = scores?.[d];
    w[d] = typeof s === 'number' ? (100 - s) + 15 : 55; // untested domains still appear
  });
  return w;
}

/** Seconds reserved for the weekly reaction check-in at session start. */
export const TEST_RESERVE_SECS = 60;

export function generatePlan({ date, goal, size, age, scores, domainCompleted }) {
  const sizeDef = SIZES_BY_ID[size] || SIZES_BY_ID.standard;
  const count = sizeDef.count;
  const pool = exercisePool();
  const domains = [...new Set(pool.map((p) => p.domainId))];
  const weights = weightsFor(goal, scores);
  const rng = mulberry32(hashSeed(`${date}|${goal}|${size}`));

  const picks = [];
  const used = {};
  for (let i = 0; i < count; i++) {
    // Strongly discourage repeats so a day's exercises stay varied (distinct
    // domains until we run out), while the first picks still honour the goal.
    const wlist = domains.map((d) => (weights[d] || 0.1) / (1 + (used[d] || 0) * 5));
    const total = wlist.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    let di = 0;
    while (di < domains.length - 1 && (r -= wlist[di]) > 0) di += 1;
    const dom = domains[di];
    used[dom] = (used[dom] || 0) + 1;

    const games = pool.filter((p) => p.domainId === dom);
    const g = games[Math.floor(rng() * games.length)] || games[0];
    const diff = difficultyFor(dom, age, scores, domainCompleted);
    picks.push({ ...g, level: diff.level, levelEn: diff.en, levelAr: diff.ar });
  }

  // ── Timed blocks: split the session minutes across the picks in proportion
  //    to how much the goal weights each pick's domain (the target domain gets
  //    the longest block). Clamped so no block is a blink or a marathon.
  const playSecs = Math.max(sizeDef.minutes * 60 - TEST_RESERVE_SECS, count * 90);
  const wsum = picks.reduce((a, p) => a + (weights[p.domainId] || 0.1), 0);
  picks.forEach((p) => {
    const share = ((weights[p.domainId] || 0.1) / wsum) * playSecs;
    p.seconds = Math.max(90, Math.min(360, Math.round(share / 15) * 15));
  });
  // Periodized order: shortest block first (warm-up) ramping to the longest
  // (the goal's peak block) — standard session structure in training design.
  picks.sort((a, b) => a.seconds - b.seconds);
  return picks;
}
