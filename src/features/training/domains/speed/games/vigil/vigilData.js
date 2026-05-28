/** Vigil Test — trial data, grading, and generation. */

import { assignTrialShapes, ruleForLevel } from './vigilRules';

export const VIGIL_LEVELS_PER_TIER = 20;
export const VIGIL_DIFF_KEYS = ['easy', 'medium', 'hard'];
export const VIGIL_PROGRESS_ORDER = ['easy', 'medium', 'hard'];

export const VIGIL_DM = {
  easy: {
    label: 'Easy',
    pop: 'Slower pace · more targets',
    lvc: 'fq-lve',
  },
  medium: {
    label: 'Medium',
    pop: 'Balanced vigilance',
    lvc: 'fq-lvm',
  },
  hard: {
    label: 'Hard',
    pop: 'Fast · rare targets',
    lvc: 'fq-lvh',
  },
};

export const VIGIL_FREE_SESSION_START_SEC = 90;
export const VIGIL_FREE_SESSION_CAP_SEC = 180;
export const VIGIL_FREE_MAX_COMMISSIONS = 3;

const PASS_THRESHOLDS = {
  easy: { minHit: 75, maxCommission: 20, maxOmission: 25 },
  medium: { minHit: 78, maxCommission: 15, maxOmission: 20 },
  hard: { minHit: 80, maxCommission: 12, maxOmission: 18 },
};

const FREE_PASS_THRESHOLDS = { minHit: 70, maxCommission: 25, maxOmission: 30 };

const RT_GOOD_MS = { easy: 450, medium: 400, hard: 350 };
const VE_EXCELLENT_MS = { easy: 520, medium: 460, hard: 400 };

const PARAM_BOUNDS = {
  easy: {
    trials: [44, 64],
    targetRate: [0.22, 0.15],
    stimulusMs: [250, 120],
    isiMin: [1300, 950],
    isiMax: [1900, 1400],
  },
  medium: {
    trials: [52, 72],
    targetRate: [0.2, 0.13],
    stimulusMs: [200, 100],
    isiMin: [1100, 780],
    isiMax: [1700, 1200],
  },
  hard: {
    trials: [60, 80],
    targetRate: [0.18, 0.1],
    stimulusMs: [160, 80],
    isiMin: [900, 650],
    isiMax: [1500, 1000],
  },
};

const FIXATION_MS = 400;
const CHALLENGE_LEVEL = { diff: 'hard', lv: 12 };

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rnd) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Block parameters for a tier level (level 1–20). */
export function specificationForLevel(diff, levelIndex) {
  const key = VIGIL_DIFF_KEYS.includes(diff) ? diff : 'easy';
  const li = clamp(Math.floor(levelIndex) || 1, 1, VIGIL_LEVELS_PER_TIER) - 1;
  const t = li / (VIGIL_LEVELS_PER_TIER - 1);
  const b = PARAM_BOUNDS[key];

  const trialCount = Math.round(lerp(b.trials[0], b.trials[1], t));
  const targetRate = lerp(b.targetRate[0], b.targetRate[1], t);
  let targetCount = Math.max(1, Math.round(trialCount * targetRate));
  targetCount = Math.min(targetCount, trialCount - 1);

  const stimulusMs = Math.round(lerp(b.stimulusMs[0], b.stimulusMs[1], t));
  const isiMinMs = Math.round(lerp(b.isiMin[0], b.isiMin[1], t));
  const isiMaxMs = Math.round(lerp(b.isiMax[0], b.isiMax[1], t));
  const responseWindowMs = isiMaxMs;

  return {
    diff: key,
    lv: li + 1,
    trialCount,
    targetCount,
    targetRate: targetCount / trialCount,
    stimulusMs,
    isiMinMs,
    isiMaxMs,
    responseWindowMs,
    fixationMs: FIXATION_MS,
  };
}

export function buildTrials(spec, seed = Date.now()) {
  const rnd = mulberry32(seed >>> 0);
  const { trialCount, targetCount, isiMinMs, isiMaxMs } = spec;

  const flags = [
    ...Array(targetCount).fill(true),
    ...Array(trialCount - targetCount).fill(false),
  ];

  let order = shuffle(flags, rnd);
  let guard = 0;
  while (guard < 80) {
    let bad = false;
    for (let i = 2; i < order.length; i++) {
      if (order[i] && order[i - 1] && order[i - 2]) {
        bad = true;
        break;
      }
    }
    if (!bad) break;
    order = shuffle(flags, rnd);
    guard++;
  }

  return order.map((isTarget, idx) => {
    const isi = isiMinMs + Math.floor(rnd() * (isiMaxMs - isiMinMs + 1));
    return { index: idx + 1, isTarget, isiMs: isi };
  });
}

export function summarizeVigil(results, spec) {
  let hits = 0;
  let misses = 0;
  let commissions = 0;
  let correctRejections = 0;
  let earlyTaps = 0;
  const rts = [];

  for (const r of results) {
    if (r.earlyTap) {
      earlyTaps++;
      continue;
    }
    if (r.isTarget) {
      if (r.responded) {
        hits++;
        const win = spec?.responseWindowMs ?? 1500;
        if (r.rtMs != null && r.rtMs >= 100 && r.rtMs <= win) {
          rts.push(r.rtMs);
        }
      } else {
        misses++;
      }
    } else if (r.responded) {
      commissions++;
    } else {
      correctRejections++;
    }
  }

  const nTarget = hits + misses;
  const nNonTarget = commissions + correctRejections;
  const hitRatePct = nTarget ? Math.round((hits / nTarget) * 100) : 100;
  const omissionPct = nTarget ? Math.round((misses / nTarget) * 100) : 0;
  const commissionPct = nNonTarget ? Math.round((commissions / nNonTarget) * 100) : 0;

  const meanRt =
    rts.length > 0
      ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length)
      : null;
  const rtSd =
    rts.length > 1 && meanRt != null
      ? Math.round(
          Math.sqrt(
            rts.reduce((s, x) => s + (x - meanRt) ** 2, 0) / (rts.length - 1),
          ),
        )
      : null;

  const hitRate = nTarget ? hits / nTarget : 1;
  const commissionRate = nNonTarget ? commissions / nNonTarget : 0;

  return {
    hits,
    misses,
    commissions,
    correctRejections,
    earlyTaps,
    hitRatePct,
    omissionPct,
    commissionPct,
    meanRt,
    rtSd,
    hitRate,
    commissionRate,
    rts,
  };
}

export function computeVigilScore(summary, diff) {
  const hitRate = summary.hitRate ?? (summary.hitRatePct / 100);
  const commissionRate = summary.commissionRate ?? summary.commissionPct / 100;
  const goodRt = RT_GOOD_MS[diff] ?? RT_GOOD_MS.easy;
  let speedFactor = 0.75;
  if (summary.meanRt != null && summary.meanRt > 0) {
    speedFactor = clamp(1.1 - (summary.meanRt - goodRt) / (goodRt * 2), 0.5, 1);
  }
  let vs = Math.round(
    100 * (0.45 * hitRate + 0.35 * (1 - commissionRate) + 0.2 * speedFactor),
  );
  vs -= (summary.earlyTaps ?? 0) * 5;
  return Math.max(0, Math.min(100, vs));
}

export function computeVigilEfficiency(summary) {
  const hitRate = summary.hitRate ?? summary.hitRatePct / 100;
  const commissionRate = summary.commissionRate ?? summary.commissionPct / 100;
  if (
    hitRate < 0.7 ||
    commissionRate > 0.25 ||
    summary.meanRt == null ||
    summary.meanRt < 100
  ) {
    return { ve: null, veValid: false };
  }
  const ve = Math.round(summary.meanRt / hitRate);
  return { ve, veValid: true };
}

export function gradeBlock(summary, diff, { freeMode = false } = {}) {
  const th = freeMode ? FREE_PASS_THRESHOLDS : PASS_THRESHOLDS[diff] ?? PASS_THRESHOLDS.easy;
  const won =
    summary.hitRatePct >= th.minHit &&
    summary.commissionPct <= th.maxCommission &&
    summary.omissionPct <= th.maxOmission;

  const vigilScore = computeVigilScore(summary, diff);
  const { ve, veValid } = computeVigilEfficiency(summary);
  const veExcellent = VE_EXCELLENT_MS[diff] ?? VE_EXCELLENT_MS.easy;

  let stars = 0;
  if (won) {
    stars = 1;
    if (summary.commissionPct <= th.maxCommission / 2) stars = 2;
    if (
      summary.hitRatePct >= 90 &&
      veValid &&
      ve != null &&
      ve <= veExcellent
    ) {
      stars = 3;
    }
  }

  return { won, stars, vigilScore, ve, veValid, thresholds: th };
}

export function isVigilLevelUnlocked(diff, lv, doneMap) {
  if (lv <= 1) return true;
  const key = (d, L) => `${d}-${L}`;
  return !!(doneMap[key(diff, lv - 1)] || doneMap[key(diff, lv)]);
}

export function freeStageToDiffLv(stageIndex) {
  const s = Math.max(0, stageIndex | 0);
  const maxLinear = VIGIL_PROGRESS_ORDER.length * VIGIL_LEVELS_PER_TIER - 1;
  const capped = Math.min(s, maxLinear);
  const diffIx = Math.floor(capped / VIGIL_LEVELS_PER_TIER);
  const lv = (capped % VIGIL_LEVELS_PER_TIER) + 1;
  return { diff: VIGIL_PROGRESS_ORDER[diffIx], lv };
}

function blockWithRule(diff, lv, spec, seed, extra) {
  const rule = ruleForLevel(diff, lv);
  const base = buildTrials(spec, seed);
  const trials = assignTrialShapes(base, rule, seed);
  return { spec, rule, trials, seed, ...extra };
}

export function prepareFreeBlock(stageIndex, seed) {
  const { diff, lv } = freeStageToDiffLv(stageIndex);
  const spec = specificationForLevel(diff, lv);
  return {
    mode: 'free',
    diff,
    lv,
    freeStage: stageIndex,
    ...blockWithRule(diff, lv, spec, seed),
  };
}

export function prepareLevelBlock(diff, lv, seed) {
  const spec = specificationForLevel(diff, lv);
  return {
    mode: 'level',
    diff,
    lv,
    ...blockWithRule(diff, lv, spec, seed),
  };
}

export function prepareChallengeSeed() {
  const seed =
    (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  const { diff, lv } = CHALLENGE_LEVEL;
  const spec = specificationForLevel(diff, lv);
  return { seed, spec, diff, lv };
}

export function prepareChallengeBlock(cSeed) {
  const spec = cSeed.spec ?? specificationForLevel(CHALLENGE_LEVEL.diff, CHALLENGE_LEVEL.lv);
  const seed = cSeed.seed >>> 0;
  const { diff, lv } = CHALLENGE_LEVEL;
  return {
    mode: 'challenge',
    diff: spec.diff,
    lv: spec.lv,
    ...blockWithRule(diff, lv, spec, seed),
  };
}

export function freeClearBonusSec(stageCompleted, trialCount) {
  const s = Math.max(0, stageCompleted | 0);
  const par = Math.max(20, Number(trialCount) || 40);
  const u = 1 / (1 + s / 18);
  return +Math.min(12, Math.max(0.75, 0.6 + u * (1.4 + par * 0.04))).toFixed(1);
}

const FREE_SCORE_WEIGHT = { easy: 1, medium: 1.25, hard: 1.7 };

export function freeHitPoints(diff, stage) {
  const w = FREE_SCORE_WEIGHT[diff] ?? 1;
  return Math.max(1, Math.round((4 + stage * 0.12) * w));
}

export function freeBlockClearPoints(spec, clearStreak) {
  const n = spec?.trialCount ?? 48;
  const streak = Math.max(1, clearStreak);
  const mult = 1 + Math.min(streak - 1, 20) * 0.04;
  return Math.max(8, Math.round((12 + n * 0.15) * mult));
}

export function mergeVigilChallengeRow(prev, grade, summary, playerName) {
  const snap = {
    vigilScore: grade.vigilScore,
    ve: grade.ve,
    veValid: grade.veValid,
    hitRatePct: summary.hitRatePct,
    commissionPct: summary.commissionPct,
    omissionPct: summary.omissionPct,
    meanRt: summary.meanRt,
    commissions: summary.commissions,
  };
  const rounds = [...(prev?.rounds || []), snap];
  const n = rounds.length;
  let vsSum = 0;
  let commSum = 0;
  for (const r of rounds) {
    vsSum += r.vigilScore;
    commSum += r.commissions;
  }
  return {
    nm: playerName,
    rounds,
    vigilScore: Math.round(vsSum / n),
    commissions: commSum,
    last: snap,
  };
}

export function compareChallengeRows(a, b) {
  if (b.vigilScore !== a.vigilScore) return b.vigilScore - a.vigilScore;
  const veA = a.last?.veValid ? a.last.ve : 99999;
  const veB = b.last?.veValid ? b.last.ve : 99999;
  if (veA !== veB) return veA - veB;
  return a.commissions - b.commissions;
}

/** @deprecated Preview alias */
export const LEVEL1 = specificationForLevel('easy', 4);

export function buildLevel1Trials(seed) {
  const spec = specificationForLevel('easy', 4);
  return buildTrials(spec, seed);
}
