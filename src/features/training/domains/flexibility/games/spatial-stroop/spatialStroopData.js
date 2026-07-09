/**
 * Spatial Stroop / Simon task — wordless interference + set-shifting engine.
 *
 * References: Simon & Rudell (1967); Lu & Proctor (1995) spatial Stroop;
 * Eriksen flanker (1974); task-switching cost (Rogers & Monsell, 1995);
 * perseveration framework (Milner, 1963). No words: the stimulus is an ARROW
 * that POINTS one way, SITS on one side, and is COLOURED. Three rules cycle:
 *
 *   • point — answer the direction the arrow POINTS
 *   • side  — answer the side the arrow SITS on
 *   • color — answer by COLOUR (red → left, green → right)
 *
 * Twists that scale with difficulty: incongruent trials (irrelevant attribute
 * pulls the wrong way), flanker arrows (Eriksen distractors), and REVERSE
 * trials (a marker means give the OPPOSITE answer — response inhibition). After
 * a streak the rule SWITCHES (set-shifting). Free mode adds power-ups & Blitz
 * bursts on top.
 */

import { mulberry32 } from '../../../../../../lib/rng';
import { clamp, lerp } from '../../../../../../lib/math';

export const STROOP_RULES = ['point', 'side', 'color'];
export const STROOP_LEVELS_PER_TIER = 100;
export const STROOP_DIFF_KEYS = ['easy', 'medium', 'hard'];
export const STROOP_FREE_LIVES = 3;

export const STROOP_COLORS = ['red', 'green'];
export const COLOR_SIDE = { red: 'left', green: 'right' };

export const STROOP_POWERUP_KEYS = ['shield', 'slowmo', 'x2', 'freeze'];
export const BLITZ_TRIALS = 10;
export const BLITZ_EVERY_SWITCHES = 5;

export const STROOP_DM = {
  easy: { label: 'Easy', pop: 'Point/Sit · slower · few switches', lvc: 'fq-lve' },
  medium: { label: 'Medium', pop: '+ Colour rule · flankers · faster', lvc: 'fq-lvm' },
  hard: { label: 'Hard', pop: '+ Reverse trials · rapid · heavy', lvc: 'fq-lvh' },
};

const CHALLENGE_LEVEL = { diff: 'hard', lv: 12 };
export const STROOP_PASS_PLAY_LV = { easy: 12, medium: 12, hard: 12 };

const PASS = {
  easy: { minEfficiency: 0.75, minCC: 2, maxPersevRate: 0.5 },
  medium: { minEfficiency: 0.78, minCC: 3, maxPersevRate: 0.4 },
  hard: { minEfficiency: 0.8, minCC: 4, maxPersevRate: 0.34 },
};
const FREE_PASS = { minEfficiency: 0.68, minCC: 1, maxPersevRate: 0.55 };

const PARAM = {
  easy: {
    streak: [6, 9],
    maxTrials: [28, 44],
    categories: [2, 3],
    responseMs: [3200, 2400],
    incong: [0.4, 0.55],
    reverse: [0, 0],
    flanker: [0, 0],
    color: false,
  },
  medium: {
    streak: [5, 8],
    maxTrials: [36, 56],
    categories: [3, 4],
    responseMs: [2600, 1900],
    incong: [0.5, 0.68],
    reverse: [0, 0.05],
    flanker: [0.12, 0.45],
    color: true,
  },
  hard: {
    streak: [4, 6],
    maxTrials: [44, 66],
    categories: [4, 5],
    responseMs: [2100, 1450],
    incong: [0.6, 0.8],
    reverse: [0.05, 0.14],
    flanker: [0.35, 0.65],
    color: true,
  },
};

function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
}


const opposite = (d) => (d === 'left' ? 'right' : 'left');

/** Per-session probe-generation options, derived from the spec. */
function probeOpts(session, forceIncong = false) {
  return {
    incongruentRate: forceIncong ? 1 : session.incongruentRate ?? 0.5,
    useColor: !!session.useColor,
    reverseRate: forceIncong ? 0 : session.reverseRate ?? 0,
    flankerRate: forceIncong ? Math.max(0.6, session.flankerRate ?? 0) : session.flankerRate ?? 0,
  };
}

/**
 * A trial: an arrow that POINTS `dir`, SITS on side `pos`, has a `color`,
 * may carry `flankerDir` distractors, and may be a `reverse` trial.
 */
export function makeProbe(rng, opts = {}) {
  const { incongruentRate = 0.5, useColor = false, reverseRate = 0, flankerRate = 0 } = opts;
  const dir = rng() < 0.5 ? 'left' : 'right';
  // forceIncongruent (boolean) lets the assessment draw from an exactly
  // balanced congruent/incongruent bag instead of a per-trial coin flip.
  const incong = opts.forceIncongruent != null ? !!opts.forceIncongruent : rng() < incongruentRate;
  const pos = incong ? opposite(dir) : dir;
  const probe = { dir, pos };
  if (useColor) {
    // bias colour to be congruent on congruent trials, conflicting on incongruent
    probe.color = incong
      ? COLOR_SIDE.red === dir ? 'green' : 'red'
      : COLOR_SIDE.red === dir ? 'red' : 'green';
    // small extra randomisation so colour isn't perfectly predictable
    if (rng() < 0.25) probe.color = rng() < 0.5 ? 'red' : 'green';
  }
  probe.reverse = reverseRate > 0 && rng() < reverseRate;
  probe.flankerDir = flankerRate > 0 && rng() < flankerRate ? (rng() < 0.5 ? dir : opposite(dir)) : null;
  return probe;
}

const baseAnswer = (probe, rule) =>
  rule === 'point' ? probe.dir : rule === 'side' ? probe.pos : COLOR_SIDE[probe.color] ?? probe.dir;

/** The correct answer side for a probe under a rule (respecting reverse trials). */
export function answerFor(probe, rule) {
  const base = baseAnswer(probe, rule);
  return probe.reverse ? opposite(base) : base;
}

/** Congruent = every irrelevant attribute implies the same side as the relevant one. */
export function isCongruent(probe, rule) {
  const relevant = baseAnswer(probe, rule);
  const others = [];
  if (rule !== 'point') others.push(probe.dir);
  if (rule !== 'side') others.push(probe.pos);
  if (rule !== 'color' && probe.color) others.push(COLOR_SIDE[probe.color]);
  if (probe.flankerDir) others.push(probe.flankerDir);
  return others.every((s) => s === relevant);
}

export function activeRule(session) {
  return session.ruleSequence[session.ruleIndex] ?? 'point';
}

/** Level curve: switch cadence, trial cap, RT deadline, conflict/flanker/reverse rates, rule set. */
export function specificationForLevel(diff, levelIndex) {
  const key = STROOP_DIFF_KEYS.includes(diff) ? diff : 'easy';
  const li = clamp(Math.floor(levelIndex) || 1, 1, STROOP_LEVELS_PER_TIER) - 1;
  const t = li / (STROOP_LEVELS_PER_TIER - 1);
  const p = PARAM[key];
  return {
    diff: key,
    lv: li + 1,
    streakToSwitch: Math.round(lerp(p.streak[0], p.streak[1], t)),
    maxTrials: Math.round(lerp(p.maxTrials[0], p.maxTrials[1], t)),
    categoriesToComplete: Math.round(lerp(p.categories[0], p.categories[1], t)),
    ruleSequence: p.color ? STROOP_RULES.slice() : ['point', 'side'],
    useColor: p.color,
    responseLimitMs: Math.round(lerp(p.responseMs[0], p.responseMs[1], t)),
    incongruentRate: lerp(p.incong[0], p.incong[1], t),
    reverseRate: lerp(p.reverse[0], p.reverse[1], t),
    flankerRate: lerp(p.flanker[0], p.flanker[1], t),
    feedbackMs: 480,
  };
}

export function createStroopSession(seed, spec) {
  return {
    ...spec,
    seed: seed >>> 0,
    rng: mulberry32(seed >>> 0),
    script: Array.isArray(spec.script) ? spec.script.slice() : null,
    scriptIdx: 0,
    ruleIndex: 0,
    streak: 0,
    categoriesCompleted: 0,
    trialNumber: 0,
    lastCompletedRule: null,
    failureToMaintainSet: 0,
    switchPending: false,
    blitzActive: false,
    blitzRemaining: 0,
    probe: null,
    finished: false,
  };
}

/** Next probe — scripted entry (tutorial) if a script is present, else random. */
function nextProbe(session, forceIncong = false) {
  if (session.script) {
    const entry = session.script[Math.min(session.scriptIdx, session.script.length - 1)] || {};
    session.scriptIdx += 1;
    if (entry.rule) {
      const ri = session.ruleSequence.indexOf(entry.rule);
      if (ri >= 0) session.ruleIndex = ri;
    }
    return {
      dir: entry.dir ?? 'left',
      pos: entry.pos ?? entry.dir ?? 'left',
      color: entry.color,
      reverse: !!entry.reverse,
      flankerDir: entry.flankerDir ?? null,
      congruent: (entry.pos ?? entry.dir) === entry.dir,
    };
  }
  const opts = probeOpts(session, forceIncong);
  // Balanced mode (assessment): exact 50/50 congruency over every 4 trials,
  // shuffled, instead of a probabilistic rate — equal cell counts are what
  // make the congruency-effect (incong − cong RT) estimate stable.
  if (session.balancedCongruency && !forceIncong) {
    if (!session.congBag || session.congBag.length === 0) {
      const bag = [true, true, false, false];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(session.rng() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      session.congBag = bag;
    }
    opts.forceIncongruent = session.congBag.pop();
  }
  return makeProbe(session.rng, opts);
}

export function startStroopProbe(session) {
  session.probe = nextProbe(session, false);
  session.switchPending = false;
  return session.probe;
}

/** Advance to the next scripted tutorial probe (no scoring side-effects). */
export function advanceTutorialProbe(session) {
  session.probe = nextProbe(session, false);
  return session.probe;
}

/** Kick off a Blitz burst: forced-incongruent rapid trials (free mode). */
export function startBlitz(session, count = BLITZ_TRIALS) {
  session.blitzActive = true;
  session.blitzRemaining = count;
  session.streak = 0;
  session.switchPending = false;
  session.probe = makeProbe(session.rng, probeOpts(session, true));
  return session.probe;
}

function isPerseverative(session, probe, choice, rule) {
  const prev = session.lastCompletedRule;
  if (!prev || prev === rule) return false;
  return choice === answerFor(probe, prev);
}

export function applyStroopAnswer(session, choice) {
  const rule = activeRule(session);
  const probe = session.probe;
  const isSwitchTrial = !!session.switchPending;
  const correctAns = answerFor(probe, rule);
  const correct = choice === correctAns;
  const congruent = isCongruent(probe, rule);
  const perseverative = !correct && isPerseverative(session, probe, choice, rule);
  const wasReverse = !!probe.reverse;

  const hadMaintained = session.streak >= 5;
  session.trialNumber += 1;
  let categoryShift = false;

  if (session.blitzActive) {
    // Blitz: no rule switching, just burn down the burst.
    if (correct) session.streak += 1;
    else session.streak = 0;
    session.blitzRemaining -= 1;
    if (session.blitzRemaining <= 0) {
      session.blitzActive = false;
      session.streak = 0;
    }
  } else if (correct) {
    session.streak += 1;
    if (session.streak >= session.streakToSwitch) {
      categoryShift = true;
      session.lastCompletedRule = rule;
      session.categoriesCompleted += 1;
      session.streak = 0;
      session.ruleIndex = (session.ruleIndex + 1) % session.ruleSequence.length;
      if (session.categoriesCompleted >= session.categoriesToComplete) {
        session.finished = true;
      }
    }
  } else {
    if (hadMaintained && session.streak >= 5) session.failureToMaintainSet += 1;
    session.streak = 0;
  }

  if (!session.finished && session.trialNumber >= session.maxTrials) {
    session.finished = true;
  }

  if (!session.finished) {
    session.probe = nextProbe(session, session.blitzActive);
    session.switchPending = categoryShift;
  }

  return {
    correct,
    correctAns,
    choice,
    rule,
    ruleAfter: activeRule(session),
    perseverative,
    congruent,
    isSwitchTrial,
    wasReverse,
    categoryShift,
    blitzActive: session.blitzActive,
    blitzRemaining: session.blitzRemaining,
    streak: session.streak,
    categoriesCompleted: session.categoriesCompleted,
    finished: session.finished,
  };
}

export function applyStroopTimeout(session) {
  session.trialNumber += 1;
  if (session.streak >= 5) session.failureToMaintainSet += 1;
  session.streak = 0;
  if (session.blitzActive) {
    session.blitzRemaining -= 1;
    if (session.blitzRemaining <= 0) session.blitzActive = false;
  }
  if (!session.finished && session.trialNumber >= session.maxTrials) {
    session.finished = true;
  } else if (!session.finished) {
    session.probe = nextProbe(session, session.blitzActive);
    session.switchPending = false;
  }
  return {
    finished: session.finished,
    categoryShift: false,
    blitzActive: session.blitzActive,
    streak: 0,
    categoriesCompleted: session.categoriesCompleted,
  };
}

/** RT rating relative to the deadline → arcade label + bonus points. */
export function rtRating(rtMs, limitMs) {
  if (rtMs == null || !limitMs) return { key: 'good', bonus: 0 };
  const r = rtMs / limitMs;
  if (r <= 0.33) return { key: 'perfect', bonus: 8 };
  if (r <= 0.6) return { key: 'fast', bonus: 4 };
  return { key: 'good', bonus: 0 };
}

/** Aggregate trial log → spatial-Stroop metrics. */
export function summarizeStroop(results, session) {
  const answers = results.filter((r) => r.kind === 'answer');
  const total = answers.length;
  const correctN = answers.filter((r) => r.correct).length;
  const errors = answers.filter((r) => !r.correct);
  const persev = errors.filter((r) => r.perseverative).length;
  const nonPersev = errors.length - persev;

  const goodRts = answers.filter((r) => r.correct && r.rtMs != null && r.rtMs >= 100);
  const rts = goodRts.map((r) => r.rtMs);
  const meanRt = mean(rts) != null ? Math.round(mean(rts)) : null;

  const congRt = mean(goodRts.filter((r) => r.congruent).map((r) => r.rtMs));
  const incongRt = mean(goodRts.filter((r) => !r.congruent).map((r) => r.rtMs));
  const congruencyEffect =
    congRt != null && incongRt != null ? Math.round(incongRt - congRt) : null;

  const switchRt = mean(goodRts.filter((r) => r.isSwitchTrial).map((r) => r.rtMs));
  const repeatRt = mean(goodRts.filter((r) => !r.isSwitchTrial).map((r) => r.rtMs));
  const switchCost =
    switchRt != null && repeatRt != null ? Math.round(switchRt - repeatRt) : null;

  const efficiency = total ? correctN / total : 0;
  const persevRate = errors.length ? persev / errors.length : 0;

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
    persevPct: Math.round(persevRate * 100),
    efficiency,
    efficiencyPct: Math.round(efficiency * 100),
    meanRt,
    congruencyEffect,
    switchCost,
    categoriesCompleted: session.categoriesCompleted,
    categoriesTarget: session.categoriesToComplete,
    trialsToFirstCategory: tfc,
    failureToMaintainSet: session.failureToMaintainSet,
  };
}

export function computeCFS(summary, spec) {
  const ccStar = Math.max(1, spec.categoriesToComplete);
  const E = summary.efficiency;
  const ccTerm = Math.min(1, summary.categoriesCompleted / ccStar);
  const peTerm = 1 - (summary.errors ? summary.perseverative / summary.errors : 0);
  const interfPen =
    summary.congruencyEffect != null && summary.congruencyEffect > 120
      ? Math.min(0.18, (summary.congruencyEffect - 120) / 1600)
      : 0;
  const raw = 0.4 * E + 0.3 * ccTerm + 0.3 * peTerm - interfPen;
  return Math.max(0, Math.min(100, Math.round(raw * 100)));
}

export function gradeBlock(summary, diff, { freeMode = false } = {}) {
  const th = freeMode ? FREE_PASS : PASS[diff] ?? PASS.easy;
  const won =
    summary.categoriesCompleted >= th.minCC &&
    summary.efficiency >= th.minEfficiency &&
    (summary.errors === 0 || summary.perseverative / summary.errors <= th.maxPersevRate);

  const cfs = computeCFS(summary, { categoriesToComplete: summary.categoriesTarget });

  let stars = 0;
  if (won) {
    stars = 1;
    if (
      summary.efficiency >= th.minEfficiency + 0.08 &&
      summary.persevPct <= 25 &&
      (summary.congruencyEffect == null || summary.congruencyEffect <= 250)
    ) {
      stars = 2;
    }
    if (
      summary.categoriesCompleted >= summary.categoriesTarget &&
      summary.efficiency >= 0.92 &&
      summary.persevPct <= 12 &&
      (summary.congruencyEffect == null || summary.congruencyEffect <= 160)
    ) {
      stars = 3;
    }
  }
  return { won, stars, cfs, thresholds: th };
}

export function isStroopLevelUnlocked(diff, lv, doneMap) {
  if (lv <= 1) return true;
  return !!(doneMap[`${diff}-${lv - 1}`] || doneMap[`${diff}-${lv}`]);
}

/** Endless free run: every rule, fast flips, plus power-ups & Blitz on top. */
export function prepareFreeRunBlock(seed) {
  const base = specificationForLevel('medium', 8);
  const spec = {
    ...base,
    streakToSwitch: 5,
    maxTrials: 1e9,
    categoriesToComplete: 1e9,
    ruleSequence: STROOP_RULES.slice(),
    useColor: true,
    incongruentRate: 0.6,
    reverseRate: 0.08,
    flankerRate: 0.45,
    responseLimitMs: 2400,
  };
  return { mode: 'free', diff: 'free', lv: 0, spec, seed: seed >>> 0, session: createStroopSession(seed, spec) };
}

/** Base points for a correct response (streak/combo combo). */
export function freePoints(combo) {
  return Math.max(5, Math.round(10 * (1 + Math.min(combo, 15) * 0.08)));
}

/** One fixed, standardized block for the global assessment (clean: point/side only).
 *  Measurement hygiene: 4 unscored practice trials, exactly balanced
 *  congruent/incongruent counts, and a jittered inter-trial interval so
 *  responses can't ride a rhythm. */
export function prepareAssessBlock(seed) {
  const base = specificationForLevel('medium', 10);
  const spec = {
    ...base,
    streakToSwitch: 4,
    maxTrials: 48, // 4 practice + 44 measured
    practiceTrials: 4,
    balancedCongruency: true,
    itiJitterMs: 350,
    categoriesToComplete: 1e9,
    ruleSequence: ['point', 'side'],
    useColor: false,
    incongruentRate: 0.5,
    reverseRate: 0,
    flankerRate: 0,
    responseLimitMs: 2400,
  };
  return { mode: 'assess', diff: 'medium', lv: 0, spec, seed: seed >>> 0, session: createStroopSession(seed, spec) };
}

export function prepareLevelBlock(diff, lv, seed) {
  const spec = specificationForLevel(diff, lv);
  return { mode: 'level', diff, lv, spec, seed: seed >>> 0, session: createStroopSession(seed, spec) };
}

/** Interactive coached tutorial: fixed scripted probes, no deadline/scoring. */
export const STROOP_TUTORIAL_SCRIPT = [
  { rule: 'point', dir: 'left', pos: 'left' }, // congruent → tap LEFT
  { rule: 'point', dir: 'right', pos: 'left' }, // incongruent → tap RIGHT (follow POINTS)
  { rule: 'side', dir: 'left', pos: 'right' }, // rule flipped to SITS → tap RIGHT
];
export function prepareTutorialBlock() {
  const base = specificationForLevel('easy', 1);
  const spec = {
    ...base,
    ruleSequence: ['point', 'side'],
    useColor: false,
    streakToSwitch: 999,
    maxTrials: 999,
    categoriesToComplete: 999,
    responseLimitMs: 1e9,
    reverseRate: 0,
    flankerRate: 0,
    incongruentRate: 0,
    script: STROOP_TUTORIAL_SCRIPT,
  };
  return { mode: 'tutorial', diff: 'tutorial', lv: 0, spec, seed: 1, session: createStroopSession(1, spec) };
}

export function prepareChallengeSeed(diff = 'hard') {
  const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  const d = STROOP_DIFF_KEYS.includes(diff) ? diff : 'hard';
  const lv = STROOP_PASS_PLAY_LV[d] ?? CHALLENGE_LEVEL.lv;
  const spec = specificationForLevel(d, lv);
  return { seed, spec, diff: d, lv };
}

export function prepareChallengeBlock(cSeed) {
  const spec = cSeed.spec ?? specificationForLevel(CHALLENGE_LEVEL.diff, CHALLENGE_LEVEL.lv);
  const seed = cSeed.seed >>> 0;
  return { mode: 'challenge', diff: spec.diff, lv: spec.lv, spec, seed, session: createStroopSession(seed, spec) };
}

export function mergeStroopChallengeRow(prev, grade, summary, name) {
  const snap = {
    cfs: grade.cfs,
    efficiencyPct: summary.efficiencyPct,
    persevPct: summary.persevPct,
    categoriesCompleted: summary.categoriesCompleted,
    congruencyEffect: summary.congruencyEffect,
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
