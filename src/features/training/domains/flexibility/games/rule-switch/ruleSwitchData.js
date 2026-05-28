/**
 * Wisconsin Card Sorting Test (WCST) — neuroscience-aligned engine.
 *
 * References: Berg (1948); Heaton et al. (1993); Konigs et al. WCST-64;
 * perseverative error framework (Milner, 1963; Nelson, 1976).
 *
 * Sorting dimensions: color (C), form/shape (F), number/count (N).
 * Category shift after R consecutive correct (R = 10 clinical; scaled per level).
 */

export const WCST_RULES = ['color', 'shape', 'count'];
export const WCST_LEVELS_PER_TIER = 20;
export const WCST_DIFF_KEYS = ['easy', 'medium', 'hard'];
export const WCST_PROGRESS_ORDER = ['easy', 'medium', 'hard'];

export const WCST_DM = {
  easy: { label: 'Easy', pop: '4–8 match shifts · 2–3 categories', lvc: 'fq-lve' },
  medium: { label: 'Medium', pop: '8–10 shifts · 3 dimensions', lvc: 'fq-lvm' },
  hard: { label: 'Hard', pop: 'Clinical 10 · full C→F→N', lvc: 'fq-lvh' },
};

export const WCST_FREE_SESSION_START_SEC = 300;
export const WCST_FREE_SESSION_CAP_SEC = 480;
export const WCST_FREE_MAX_ERRORS = 8;

export const WCST_REFERENCE_CARDS = [
  { id: 0, color: 'red', shape: 'triangle', count: 1 },
  { id: 1, color: 'blue', shape: 'circle', count: 2 },
  { id: 2, color: 'green', shape: 'square', count: 3 },
  { id: 3, color: 'amber', shape: 'hexagon', count: 4 },
];

const CHALLENGE_LEVEL = { diff: 'hard', lv: 12 };

const PASS = {
  easy: { minEfficiency: 0.72, minCC: 2, maxPersevRate: 0.45 },
  medium: { minEfficiency: 0.76, minCC: 2, maxPersevRate: 0.38 },
  hard: { minEfficiency: 0.8, minCC: 3, maxPersevRate: 0.32 },
};

const FREE_PASS = { minEfficiency: 0.68, minCC: 1, maxPersevRate: 0.5 };

const PARAM = {
  easy: {
    streak: [4, 8],
    maxTrials: [32, 56],
    categories: [2, 3],
    responseMs: [6500, 5500],
    rules: 2,
  },
  medium: {
    streak: [8, 10],
    maxTrials: [48, 68],
    categories: [2, 3],
    responseMs: [6000, 4800],
    rules: 3,
  },
  hard: {
    streak: [10, 10],
    maxTrials: [56, 84],
    categories: [3, 3],
    responseMs: [5500, 4200],
    rules: 3,
  },
};

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

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

export function correctPileIndex(probe, rule, refs = WCST_REFERENCE_CARDS) {
  return refs.findIndex((r) => r[rule] === probe[rule]);
}

export function makeProbeCard(rng, refs = WCST_REFERENCE_CARDS) {
  const colors = [...new Set(refs.map((r) => r.color))];
  const shapes = [...new Set(refs.map((r) => r.shape))];
  const counts = [...new Set(refs.map((r) => r.count))];
  for (let i = 0; i < 48; i++) {
    const probe = {
      color: pick(rng, colors),
      shape: pick(rng, shapes),
      count: pick(rng, counts),
    };
    const dup = refs.some(
      (r) =>
        r.color === probe.color &&
        r.shape === probe.shape &&
        r.count === probe.count,
    );
    if (!dup) return probe;
  }
  return { color: 'red', shape: 'circle', count: 2 };
}

/** Level curve: R, trial cap, category count, RT deadline. */
export function specificationForLevel(diff, levelIndex) {
  const key = WCST_DIFF_KEYS.includes(diff) ? diff : 'easy';
  const li = clamp(Math.floor(levelIndex) || 1, 1, WCST_LEVELS_PER_TIER) - 1;
  const t = li / (WCST_LEVELS_PER_TIER - 1);
  const p = PARAM[key];
  const ruleCount = p.rules;
  const ruleSequence = WCST_RULES.slice(0, ruleCount);
  return {
    diff: key,
    lv: li + 1,
    streakToSwitch: Math.round(lerp(p.streak[0], p.streak[1], t)),
    maxTrials: Math.round(lerp(p.maxTrials[0], p.maxTrials[1], t)),
    categoriesToComplete: Math.round(lerp(p.categories[0], p.categories[1], t)),
    ruleSequence,
    responseLimitMs: Math.round(lerp(p.responseMs[0], p.responseMs[1], t)),
    feedbackMs: 650,
  };
}

export function createWcstSession(seed, spec) {
  return {
    ...spec,
    seed: seed >>> 0,
    rng: mulberry32(seed >>> 0),
    ruleIndex: 0,
    streak: 0,
    categoriesCompleted: 0,
    trialNumber: 0,
    lastCompletedRule: null,
    perseveratedToRule: null,
    failureToMaintainSet: 0,
    probe: null,
    finished: false,
  };
}

export function activeRule(session) {
  return session.ruleSequence[session.ruleIndex] ?? 'color';
}

/**
 * Perseverative error (clinical simplification):
 * incorrect sort that would have been correct under the last completed category rule.
 */
function isPerseverative(session, probe, chosenPileIndex, rule) {
  const prev = session.lastCompletedRule;
  if (!prev || prev === rule) return false;
  return chosenPileIndex === correctPileIndex(probe, prev);
}

export function applyWcstAnswer(session, chosenPileIndex) {
  const rule = activeRule(session);
  const probe = session.probe;
  const correctIdx = correctPileIndex(probe, rule);
  const correct = chosenPileIndex === correctIdx;
  const perseverative =
    !correct && isPerseverative(session, probe, chosenPileIndex, rule);

  if (!correct && !session.perseveratedToRule) {
    session.perseveratedToRule = rule;
  }

  const hadMaintained = session.streak >= 5;
  session.trialNumber += 1;

  let categoryShift = false;

  if (correct) {
    session.streak += 1;
    if (session.streak >= session.streakToSwitch) {
      categoryShift = true;
      session.lastCompletedRule = rule;
      session.categoriesCompleted += 1;
      session.streak = 0;
      if (session.ruleIndex < session.ruleSequence.length - 1) {
        session.ruleIndex += 1;
      } else if (session.categoriesCompleted < session.categoriesToComplete) {
        session.ruleIndex = 0;
      }
      if (session.categoriesCompleted >= session.categoriesToComplete) {
        session.finished = true;
      }
    }
  } else {
    if (hadMaintained && session.streak >= 5) {
      session.failureToMaintainSet += 1;
    }
    session.streak = 0;
  }

  if (!session.finished && session.trialNumber >= session.maxTrials) {
    session.finished = true;
  }

  if (!session.finished) {
    session.probe = makeProbeCard(session.rng);
  }

  return {
    correct,
    correctIdx,
    chosenPileIndex,
    rule,
    ruleAfter: activeRule(session),
    perseverative,
    categoryShift,
    streak: session.streak,
    categoriesCompleted: session.categoriesCompleted,
    finished: session.finished,
  };
}

export function startWcstProbe(session) {
  session.probe = makeProbeCard(session.rng);
  return session.probe;
}

export function applyWcstTimeout(session) {
  session.trialNumber += 1;
  if (session.streak >= 5) session.failureToMaintainSet += 1;
  session.streak = 0;
  if (!session.finished && session.trialNumber >= session.maxTrials) {
    session.finished = true;
  } else if (!session.finished) {
    session.probe = makeProbeCard(session.rng);
  }
  return {
    finished: session.finished,
    categoryShift: false,
    streak: 0,
    categoriesCompleted: session.categoriesCompleted,
  };
}

/** Aggregate trial log → WCST metrics. */
export function summarizeWcst(results, session) {
  const answers = results.filter((r) => r.kind === 'answer');
  const total = answers.length;
  const correctN = answers.filter((r) => r.correct).length;
  const errors = answers.filter((r) => !r.correct);
  const persev = errors.filter((r) => r.perseverative).length;
  const nonPersev = errors.length - persev;
  const rts = answers
    .filter((r) => r.correct && r.rtMs != null && r.rtMs >= 100)
    .map((r) => r.rtMs);
  const meanRt =
    rts.length > 0 ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null;
  const rtSd =
    rts.length > 1 && meanRt != null
      ? Math.round(
          Math.sqrt(rts.reduce((s, x) => s + (x - meanRt) ** 2, 0) / (rts.length - 1)),
        )
      : null;

  const efficiency = total ? correctN / total : 0;
  const persevRate = errors.length ? persev / errors.length : 0;
  const persevPct = Math.round(persevRate * 100);
  const efficiencyPct = Math.round(efficiency * 100);
  const cc = session.categoriesCompleted;
  const ccTarget = session.categoriesToComplete;

  const tfc = (() => {
    let streak = 0;
    for (let i = 0; i < answers.length; i++) {
      if (answers[i].correct) {
        streak++;
        if (streak >= session.streakToSwitch) return i + 1;
      } else streak = 0;
    }
    return null;
  })();

  return {
    total,
    correctN,
    errors: errors.length,
    perseverative: persev,
    nonPerseverative: nonPersev,
    persevPct,
    efficiency,
    efficiencyPct,
    meanRt,
    rtSd,
    categoriesCompleted: cc,
    categoriesTarget: ccTarget,
    trialsToFirstCategory: tfc,
    failureToMaintainSet: session.failureToMaintainSet,
  };
}

/**
 * Cognitive Flexibility Score (CFS):
 * CFS = 100 × w_e·E + w_c·(CC/CC*) + w_p·(1-PE_r) - w_t·max(0, RT-RT0)/RT0
 * E = efficiency, PE_r = perseverative/error rate, CC* = target categories.
 */
export function computeCFS(summary, spec) {
  const ccStar = Math.max(1, spec.categoriesToComplete);
  const E = summary.efficiency;
  const ccTerm = summary.categoriesCompleted / ccStar;
  const peTerm = 1 - (summary.errors ? summary.perseverative / summary.errors : 0);
  const rtPen =
    summary.meanRt != null && summary.meanRt > 800
      ? Math.min(0.25, (summary.meanRt - 800) / 3200)
      : 0;
  const raw = 0.42 * E + 0.33 * ccTerm + 0.25 * peTerm - rtPen;
  return Math.max(0, Math.min(100, Math.round(raw * 100)));
}

export function gradeBlock(summary, diff, { freeMode = false } = {}) {
  const th = freeMode ? FREE_PASS : PASS[diff] ?? PASS.easy;
  const won =
    summary.categoriesCompleted >= th.minCC &&
    summary.efficiency >= th.minEfficiency &&
    (summary.errors === 0 || summary.perseverative / summary.errors <= th.maxPersevRate);

  const cfs = computeCFS(summary, {
    categoriesToComplete: summary.categoriesTarget,
  });

  let stars = 0;
  if (won) {
    stars = 1;
    if (summary.efficiency >= th.minEfficiency + 0.08 && summary.persevPct <= 25) {
      stars = 2;
    }
    if (
      summary.categoriesCompleted >= summary.categoriesTarget &&
      summary.efficiency >= 0.9 &&
      summary.persevPct <= 15
    ) {
      stars = 3;
    }
  }

  return { won, stars, cfs, thresholds: th };
}

export function isWcstLevelUnlocked(diff, lv, doneMap) {
  if (lv <= 1) return true;
  return !!(doneMap[`${diff}-${lv - 1}`] || doneMap[`${diff}-${lv}`]);
}

export function freeStageToDiffLv(stage) {
  const s = Math.max(0, stage | 0);
  if (s < 5) return { diff: 'easy', lv: Math.floor(s * 4) + 1 };
  if (s < 10) return { diff: 'medium', lv: Math.floor((s - 5) * 4) + 1 };
  return { diff: 'hard', lv: Math.min(WCST_LEVELS_PER_TIER, s - 9) };
}

export function prepareFreeBlock(stage, seed) {
  const { diff, lv } = freeStageToDiffLv(stage);
  const spec = specificationForLevel(diff, lv);
  return {
    mode: 'free',
    diff,
    lv,
    freeStage: stage,
    spec,
    seed: seed >>> 0,
    session: createWcstSession(seed, spec),
  };
}

export function prepareLevelBlock(diff, lv, seed) {
  const spec = specificationForLevel(diff, lv);
  return {
    mode: 'level',
    diff,
    lv,
    spec,
    seed: seed >>> 0,
    session: createWcstSession(seed, spec),
  };
}

export function prepareChallengeSeed() {
  const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  const { diff, lv } = CHALLENGE_LEVEL;
  const spec = specificationForLevel(diff, lv);
  return { seed, spec, diff, lv };
}

export function prepareChallengeBlock(cSeed) {
  const spec = cSeed.spec ?? specificationForLevel(CHALLENGE_LEVEL.diff, CHALLENGE_LEVEL.lv);
  const seed = cSeed.seed >>> 0;
  return {
    mode: 'challenge',
    diff: spec.diff,
    lv: spec.lv,
    spec,
    seed,
    session: createWcstSession(seed, spec),
  };
}

export function freeClearBonusSec(_stage, _maxTrials) {
  return 45;
}

export function freeBlockPoints(spec, streak) {
  const n = spec.maxTrials ?? 48;
  return Math.max(10, Math.round((14 + n * 0.12) * (1 + Math.min(streak, 12) * 0.05)));
}

export function mergeWcstChallengeRow(prev, grade, summary, name) {
  const snap = {
    cfs: grade.cfs,
    efficiencyPct: summary.efficiencyPct,
    persevPct: summary.persevPct,
    categoriesCompleted: summary.categoriesCompleted,
    meanRt: summary.meanRt,
  };
  const rounds = [...(prev?.rounds || []), snap];
  const n = rounds.length;
  let cfsSum = 0;
  let persevSum = 0;
  for (const r of rounds) {
    cfsSum += r.cfs;
    persevSum += r.persevPct;
  }
  return {
    nm: name,
    rounds,
    cfs: Math.round(cfsSum / n),
    persevPct: Math.round(persevSum / n),
    last: snap,
  };
}

export function compareChallengeRows(a, b) {
  if (b.cfs !== a.cfs) return b.cfs - a.cfs;
  if (a.persevPct !== b.persevPct) return a.persevPct - b.persevPct;
  const rtA = a.last?.meanRt ?? 99999;
  const rtB = b.last?.meanRt ?? 99999;
  return rtA - rtB;
}

export function feedbackLabel(correct, isAr, timeout = false) {
  if (timeout) return isAr ? 'بطيء جدًا!' : 'Too slow!';
  return correct ? (isAr ? 'صحيح' : 'Correct') : isAr ? 'غير صحيح' : 'Not correct';
}

export function playHint(isAr) {
  return isAr
    ? 'لكل بطاقة 3 خصائص: اللون، الشكل، والعدد. قاعدة الفرز تستخدم واحدة منها — اكتشف أيها! بعد عدة إجابات صحيحة، ستتغيّر القاعدة. تكيّف بسرعة!'
    : 'Each card has 3 properties: Color, Shape, and Count. The sorting rule uses ONE of these — discover which! After several correct matches, the rule will CHANGE. Adapt quickly!';
}

/**
 * Returns which dimensions match between a probe card and a reference card.
 * Used for educational feedback after each answer.
 */
export function matchingDimensions(probe, refCard) {
  const dims = [];
  if (probe.color === refCard.color) dims.push('color');
  if (probe.shape === refCard.shape) dims.push('shape');
  if (probe.count === refCard.count) dims.push('count');
  return dims;
}

export function prepareLevel1(seed) {
  return prepareLevelBlock('easy', 1, seed);
}
