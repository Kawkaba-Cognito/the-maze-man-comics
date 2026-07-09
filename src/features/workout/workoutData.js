/*
 * DAILY WORKOUT — catalog & tuning.
 *
 * A "workout" is a personalised daily brain-training session assembled from the
 * real training games (registry). The user picks a GOAL preset and a daily SIZE
 * (by time); difficulty per exercise is ADAPTIVE (age band + assessment + how
 * many sessions they've done in that domain).
 */
import { DOMAIN_CONFIGS, getPlayableSubs } from '../training/registry';
import { ageBand } from '../training/assessment/assessmentProfile';
import { ASSESSMENT_GAME_BY_DOMAIN } from '../training/assessment/assessmentConfig';
import { domainRating, ratingToLevel } from '../training/rating';

/** Goal presets → per-domain weighting. `weights: null` = dynamic (target weak areas). */
export const GOALS = [
  {
    id: 'weak', en: 'Sharpen Weak Spots', ar: 'عالج نقاط الضعف', icon: '🎯',
    descEn: 'Targets your lowest assessment scores', descAr: 'يركّز على أضعف نتائجك في التقييم',
    weights: null,
  },
  {
    id: 'overall', en: 'Total Brain', ar: 'الدماغ الكامل', icon: '🧠',
    descEn: 'Balanced across all 6 areas', descAr: 'متوازن عبر المجالات الستة',
    weights: { attention: 1, speed: 1, memory: 1, language: 1, reasoning: 1, flexibility: 1 },
  },
  {
    id: 'focus', en: 'Laser Focus', ar: 'تركيز حاد', icon: '👁️',
    descEn: 'Attention & sustained focus', descAr: 'الانتباه والتركيز المستمر',
    weights: { attention: 3, speed: 1.5, flexibility: 1, memory: 0.5, reasoning: 0.5, language: 0.5 },
  },
  {
    id: 'memory', en: 'Memory Master', ar: 'سيّد الذاكرة', icon: '🧩',
    descEn: 'Working & short-term memory', descAr: 'الذاكرة العاملة وقصيرة المدى',
    weights: { memory: 3, attention: 1.2, reasoning: 1, language: 0.6, speed: 0.6, flexibility: 0.6 },
  },
  {
    id: 'speed', en: 'Quick Thinker', ar: 'تفكير سريع', icon: '⚡',
    descEn: 'Processing speed & flexibility', descAr: 'سرعة المعالجة والمرونة',
    weights: { speed: 3, flexibility: 1.6, attention: 1, memory: 0.6, reasoning: 0.6, language: 0.6 },
  },
  {
    id: 'solver', en: 'Problem Solver', ar: 'حلّال المشكلات', icon: '💡',
    descEn: 'Reasoning & language', descAr: 'الاستدلال واللغة',
    weights: { reasoning: 3, language: 1.8, memory: 1, attention: 0.6, speed: 0.6, flexibility: 0.6 },
  },
];

export const GOALS_BY_ID = Object.fromEntries(GOALS.map((g) => [g.id, g]));

/**
 * Per-goal game preferences within each domain (paradigm-aligned training).
 * Weights are relative; assessment battery games get a boost when targeting weak spots.
 */
export const GOAL_GAME_WEIGHTS = {
  overall: {
    attention: { 'cancel-task': 2, mot: 1.5, 'train-switch': 1.5 },
    speed: { 'speed-match': 2, 'trail-making': 1.5, 'math-gates': 1.5 },
    memory: { 'memo-span': 2, 'story-grid': 1.5, nback: 1.5, 'paired-associates': 1.5 },
    language: { wordle: 2, synonyms: 1.8, trivia: 1.8 },
    reasoning: { 'rush-hour': 2, 'raven-matrices': 1.8, detective: 1.5 },
    flexibility: { 'spatial-stroop': 2, wisconsin: 1.8, brixton: 1.8 },
  },
  focus: {
    attention: { 'cancel-task': 3, mot: 2.5, 'train-switch': 2 },
    speed: { 'speed-match': 1.5, 'trail-making': 1.2 },
    memory: { nback: 1.2, 'memo-span': 1 },
    flexibility: { 'spatial-stroop': 1.5, wisconsin: 1.2 },
  },
  memory: {
    memory: { 'memo-span': 3, 'story-grid': 2.5, 'paired-associates': 2, nback: 2 },
    attention: { mot: 1.5, 'cancel-task': 1.2 },
    reasoning: { 'raven-matrices': 1.2 },
  },
  speed: {
    speed: { 'speed-match': 3, 'trail-making': 2.5, 'math-gates': 2 },
    flexibility: { 'spatial-stroop': 2, wisconsin: 1.5 },
    attention: { 'cancel-task': 1.5, mot: 1.2 },
  },
  solver: {
    reasoning: { 'rush-hour': 3, 'raven-matrices': 2.5, detective: 2 },
    language: { synonyms: 2.5, trivia: 2, wordle: 1.8 },
    memory: { 'story-grid': 1.5, 'memo-span': 1.2 },
  },
  weak: null, // dynamic — see pickGameForDomain
};

/** Daily size by time → number of exercises (≈3–4 min each). */
export const SIZES = [
  { id: 'quick', en: 'Quick', ar: 'سريع', minutes: 5, count: 2 },
  { id: 'standard', en: 'Standard', ar: 'قياسي', minutes: 10, count: 3 },
  { id: 'intense', en: 'Intense', ar: 'مكثّف', minutes: 20, count: 5 },
  { id: 'big', en: 'Big', ar: 'كبير', minutes: 30, count: 8 },
  { id: 'pro', en: 'Pro', ar: 'احترافي', minutes: 45, count: 12 },
  { id: 'elite', en: 'Elite', ar: 'النخبة', minutes: 60, count: 16 },
];

export const SIZES_BY_ID = Object.fromEntries(SIZES.map((s) => [s.id, s]));

/** Every wired exercise, flattened from the training registry. Only games with
 *  a real lazy `loader` are included — a sub with a gameKey but no loader can't
 *  actually be rendered, and would auto-skip (ending the session instantly). */
export function exercisePool() {
  const pool = [];
  DOMAIN_CONFIGS.forEach((d) => {
    getPlayableSubs(d.id).filter((sub) => typeof sub.loader === 'function').forEach((sub) => {
      pool.push({
        domainId: d.id,
        domainName: d.name,
        domainNameAr: d.nameAr,
        color: d.color,
        glyph: d.glyph,
        gameKey: sub.gameKey,
        gameName: sub.name,
      });
    });
  });
  return pool;
}

const LEVELS_EN = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Expert'];
const LEVELS_AR = ['سهل جداً', 'سهل', 'متوسط', 'صعب', 'خبير'];

function ageBaseLevel(age) {
  switch (ageBand(age)?.id) {
    case 'child': return 1;
    case 'teen': return 3;
    case 'ya': return 4;
    case 'adult': return 3;
    case 'midlife': return 2;
    case 'senior': return 2;
    default: return 3;
  }
}

/**
 * Adaptive difficulty for a domain.
 * Primary signal: the TRAINING RATING for the domain (measured from free-run
 * performance, seeded by the assessment) — as the rating climbs, the workout
 * climbs with it. Fallback (unrated, unassessed): age band + session count.
 */
export function difficultyFor(domainId, age, scores, domainCompleted) {
  let lvl;
  const r = domainRating(domainId);
  if (r != null) {
    lvl = ratingToLevel(r);
  } else {
    lvl = ageBaseLevel(age);
    const s = scores?.[domainId];
    if (typeof s === 'number') {
      if (s >= 75) lvl += 1;
      else if (s < 50) lvl -= 1;
    }
    lvl += Math.floor((domainCompleted?.[domainId] || 0) / 5); // every 5 sessions, +1
  }
  lvl = Math.max(1, Math.min(5, lvl));
  return { level: lvl, en: LEVELS_EN[lvl - 1], ar: LEVELS_AR[lvl - 1] };
}

/** Pick a game within a domain using goal prefs + assessment weak-spot signal. */
export function pickGameForDomain(domainId, goalId, games, rng, scores, usedGameKeys = {}) {
  if (!games?.length) return games?.[0];
  const assessKey = ASSESSMENT_GAME_BY_DOMAIN[domainId];
  const goalMap = GOAL_GAME_WEIGHTS[goalId];
  const domainScores = scores?.[domainId];
  const isWeakDomain = typeof domainScores === 'number' && domainScores < 55;

  const weighted = games.map((g) => {
    let w = 1;
    if (goalId === 'weak') {
      w = 1.1;
      if (g.gameKey === assessKey) w *= 2.2;
    } else if (goalMap?.[domainId]?.[g.gameKey]) {
      w = goalMap[domainId][g.gameKey];
    } else if (goalMap?.[domainId]) {
      w = 0.6;
    }
    if (isWeakDomain && g.gameKey === assessKey) w *= 1.6;
    w /= 1 + (usedGameKeys[g.gameKey] || 0) * 3;
    return { g, w: Math.max(0.05, w) };
  });

  const total = weighted.reduce((a, x) => a + x.w, 0);
  let r = rng() * total;
  for (const { g, w } of weighted) {
    r -= w;
    if (r <= 0) return g;
  }
  return games[Math.floor(rng() * games.length)];
}
