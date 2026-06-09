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

/** Daily size by time → number of exercises (≈3–4 min each). */
export const SIZES = [
  { id: 'quick', en: 'Quick', ar: 'سريع', minutes: 5, count: 2 },
  { id: 'standard', en: 'Standard', ar: 'قياسي', minutes: 10, count: 3 },
  { id: 'intense', en: 'Intense', ar: 'مكثّف', minutes: 20, count: 5 },
];

export const SIZES_BY_ID = Object.fromEntries(SIZES.map((s) => [s.id, s]));

/** Every wired exercise, flattened from the training registry. */
export function exercisePool() {
  const pool = [];
  DOMAIN_CONFIGS.forEach((d) => {
    getPlayableSubs(d.id).forEach((sub) => {
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
 * Adaptive difficulty for a domain: age band → adjusted by latest assessment
 * score → nudged up as the user banks sessions in that domain.
 */
export function difficultyFor(domainId, age, scores, domainCompleted) {
  let lvl = ageBaseLevel(age);
  const s = scores?.[domainId];
  if (typeof s === 'number') {
    if (s >= 75) lvl += 1;
    else if (s < 50) lvl -= 1;
  }
  lvl += Math.floor((domainCompleted?.[domainId] || 0) / 5); // every 5 sessions, +1
  lvl = Math.max(1, Math.min(5, lvl));
  return { level: lvl, en: LEVELS_EN[lvl - 1], ar: LEVELS_AR[lvl - 1] };
}
