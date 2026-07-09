/*

 * DAILY WORKOUT — plan generator.

 *

 * Deterministic per (date, goal, size) so the plan is stable through the day

 * but fresh tomorrow. Picks `count` exercises by weighted domain sampling

 * (goal-driven), discouraging repeats so the session feels varied.

 */

import { exercisePool, GOALS_BY_ID, SIZES_BY_ID, difficultyFor, pickGameForDomain } from './workoutData';

import { ASSESS_DOMAINS } from '../training/assessment/assessmentProfile';

import { mulberry32 } from '../../lib/rng';



/** Local calendar date key (avoids UTC midnight shifting streaks). */

export function todayKey(d = new Date()) {

  const y = d.getFullYear();

  const m = String(d.getMonth() + 1).padStart(2, '0');

  const day = String(d.getDate()).padStart(2, '0');

  return `${y}-${m}-${day}`;

}



function hashSeed(str) {

  let h = 2166136261;

  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }

  return h >>> 0;

}




/** Domain weights for a goal. 'weak' → strongly inverse of assessment scores. */

export function weightsFor(goalId, scores) {

  const goal = GOALS_BY_ID[goalId] || GOALS_BY_ID.overall;

  if (goal.weights) return { ...goal.weights };

  const w = {};

  ASSESS_DOMAINS.forEach((d) => {

    const s = scores?.[d];

    // Squared inverse so lowest domains dominate (evidence: deficit-based training).

    w[d] = typeof s === 'number' ? Math.pow((100 - s) / 20, 1.35) + 0.8 : 1.1;

  });

  return w;

}



/** Light warm-up domains (processing speed + attention priming). */

const WARM_DOMAINS = new Set(['speed', 'attention']);



/** Seconds reserved for the weekly reaction check-in at session start. */

export const TEST_RESERVE_SECS = 60;



export function generatePlan({ date, goal, size, age, scores, domainCompleted, reactionReserve = true }) {

  const sizeDef = SIZES_BY_ID[size] || SIZES_BY_ID.standard;

  const count = sizeDef.count;

  const pool = exercisePool();

  const domains = [...new Set(pool.map((p) => p.domainId))];

  const weights = weightsFor(goal, scores);

  const rng = mulberry32(hashSeed(`${date}|${goal}|${size}`));



  const picks = [];

  const used = {};

  const usedGames = {};

  for (let i = 0; i < count; i++) {

    const wlist = domains.map((d) => (weights[d] || 0.1) / (1 + (used[d] || 0) * 5));

    const total = wlist.reduce((a, b) => a + b, 0);

    let r = rng() * total;

    let di = 0;

    while (di < domains.length - 1 && (r -= wlist[di]) > 0) di += 1;

    let dom = domains[di];

    // First block: prefer a warm-up domain when goal allows (session periodization).

    if (i === 0 && goal !== 'speed' && goal !== 'focus') {

      const warm = domains.filter((d) => WARM_DOMAINS.has(d) && (weights[d] || 0) > 0.5);

      if (warm.length && rng() < 0.72) dom = warm[Math.floor(rng() * warm.length)];

    }

    used[dom] = (used[dom] || 0) + 1;



    const games = pool.filter((p) => p.domainId === dom);

    if (!games.length) {

      i -= 1;

      continue;

    }

    const g = pickGameForDomain(dom, goal, games, rng, scores, usedGames) || games[0];

    usedGames[g.gameKey] = (usedGames[g.gameKey] || 0) + 1;

    const diff = difficultyFor(dom, age, scores, domainCompleted);

    picks.push({ ...g, level: diff.level, levelEn: diff.en, levelAr: diff.ar, domainWeight: weights[dom] || 0.1 });

  }



  if (!picks.length) return picks;



  // ── Timed blocks: split session minutes across picks (goal domain gets longest).

  const reserve = reactionReserve ? TEST_RESERVE_SECS : 0;

  const playSecs = Math.max(sizeDef.minutes * 60 - reserve, picks.length * 90);

  const wsum = picks.reduce((a, p) => a + (p.domainWeight || 0.1), 0);

  picks.forEach((p, i) => {

    const baseW = goal === 'weak' ? Math.sqrt(p.domainWeight || 0.1) : (p.domainWeight || 0.1);

    let share = (baseW / (goal === 'weak'

      ? picks.reduce((a, x) => a + Math.sqrt(x.domainWeight || 0.1), 0)

      : wsum)) * playSecs;

    if (i === 0 && WARM_DOMAINS.has(p.domainId)) share *= 0.82;

    p.seconds = Math.max(90, Math.min(360, Math.round(share / 15) * 15));

  });

  // Periodized order: warm-up stays first; remaining blocks ramp short → long.

  if (picks.length > 1) {

    const [warm, ...rest] = picks;

    rest.sort((a, b) => a.seconds - b.seconds);

    picks.length = 0;

    picks.push(warm, ...rest);

  }

  return picks;

}

