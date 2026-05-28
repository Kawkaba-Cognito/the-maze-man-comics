/** Memo Span — object study + serial-recall (Corsi-style) test.
 *
 * Player watches a sequence of objects flash one at a time, then must tap
 * them back IN THE EXACT ORDER from a grid that also contains distractor
 * "foil" objects that were never shown. First wrong tap ends the round.
 */

import { objectIds } from './memoObjects';

export const MS_LEVELS_PER_TIER = 20;
export const MS_DIFF_KEYS = ['easy', 'medium', 'hard'];

export const MS_DM = {
  easy: { label: 'Easy', pop: 'Short sequence · clear timing', lvc: 'lve' },
  medium: { label: 'Medium', pop: 'Longer sequence · faster', lvc: 'lvm' },
  hard: { label: 'Hard', pop: 'Long sequence · quick flashes', lvc: 'lvh' },
};

const CHALLENGE_LEVEL = { diff: 'medium', lv: 8 };

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

/**
 * Difficulty curve tuned for serial recall (harder than recognition).
 *   - easy:   3 → 5 objects, flash 1100 → 850ms, foils = studyCount,     passPct 70 → 80
 *   - medium: 4 → 6 objects, flash 1000 → 700ms, foils = studyCount + 1, passPct 75 → 85
 *   - hard:   5 → 8 objects, flash  850 → 500ms, foils = studyCount + 2, passPct 80 → 90
 */
export function specificationForLevel(diff, levelIndex) {
  const key = MS_DIFF_KEYS.includes(diff) ? diff : 'easy';
  const li = clamp(Math.floor(levelIndex) || 1, 1, MS_LEVELS_PER_TIER) - 1;
  const t = li / (MS_LEVELS_PER_TIER - 1);

  let studyMin;
  let studyMax;
  let flashStart;
  let flashEnd;
  let foilBonus;
  let passStart;
  let passEnd;
  if (key === 'easy') {
    studyMin = 3; studyMax = 5;
    flashStart = 1100; flashEnd = 850;
    foilBonus = 0;
    passStart = 70; passEnd = 80;
  } else if (key === 'medium') {
    studyMin = 4; studyMax = 6;
    flashStart = 1000; flashEnd = 700;
    foilBonus = 1;
    passStart = 75; passEnd = 85;
  } else {
    studyMin = 5; studyMax = 8;
    flashStart = 850; flashEnd = 500;
    foilBonus = 2;
    passStart = 80; passEnd = 90;
  }

  const studyCount = Math.round(lerp(studyMin, studyMax, t));
  const foilCount = studyCount + foilBonus;
  const flashMs = Math.round(lerp(flashStart, flashEnd, t));
  const gapStart = key === 'hard' ? 350 : 400;
  const gapEnd = key === 'hard' ? 200 : 280;
  const gapMs = Math.round(lerp(gapStart, gapEnd, t));
  const passPct = Math.round(lerp(passStart, passEnd, t));

  return {
    diff: key,
    lv: li + 1,
    studyCount,
    foilCount,
    poolCount: studyCount + foilCount,
    flashMs,
    gapMs,
    passPct,
  };
}

/**
 * Build a single serial-recall round.
 *   studyItems:  ordered list of objects the player must reproduce
 *   recallPool:  shuffled grid containing every studied object + foils
 */
export function buildSerialRecallRound(spec, seed = Date.now()) {
  const rnd = mulberry32(seed >>> 0);
  const studyObjectIds = objectIds(spec.studyCount, rnd);
  const studySet = new Set(studyObjectIds);
  const foilIds = objectIds(spec.foilCount ?? spec.studyCount, rnd, studySet);

  const studyItems = studyObjectIds.map((objectId, i) => ({ id: `s${i}`, objectId }));
  const recallPool = shuffle([...studyObjectIds, ...foilIds], rnd);

  return { studyItems, recallPool };
}

/**
 * Grade a serial-recall attempt.
 *   playerTaps: ordered array of objectIds the player tapped (stops at first wrong)
 *   Returns:
 *     correctSequence — true only if every studied position was tapped correctly
 *     correctCount    — positions matched in order before the first error
 *     total           — total study positions
 *     pct             — correctCount / total as a percentage
 */
export function gradeSerialRecall(studyItems, playerTaps) {
  const total = studyItems.length;
  const taps = Array.isArray(playerTaps) ? playerTaps : [];
  let correctCount = 0;
  for (let i = 0; i < total; i++) {
    if (i >= taps.length) break;
    if (taps[i] === studyItems[i].objectId) {
      correctCount++;
    } else {
      break;
    }
  }
  const pct = total ? Math.round((correctCount / total) * 100) : 0;
  const correctSequence = correctCount === total && taps.length === total;
  return { correctSequence, correctCount, total, pct };
}

/**
 * Stars for a serial-recall grade.
 *   3 stars — full sequence correct
 *   2 stars — ≥ 80% positions correct
 *   1 star  — ≥ passPct positions correct
 *   0 stars — below passPct
 */
export function starsForSerialRecall(grade, spec) {
  if (grade.correctSequence) return 3;
  if (grade.pct >= 80) return 2;
  if (grade.pct >= spec.passPct) return 1;
  return 0;
}

export function isMemoSpanLevelUnlocked(diff, lv, doneMap) {
  if (lv <= 1) return true;
  return !!(doneMap[`${diff}-${lv - 1}`] || doneMap[`${diff}-${lv}`]);
}

export function describeBriefing(spec, isAr) {
  if (isAr) {
    return {
      headline: 'مهمة هذه الجولة',
      watchLine: 'سنريك أشياء واحداً تلو الآخر — احفظ ترتيبها',
      tapLine: 'بعدها اضغط الأشياء بنفس الترتيب الذي ظهرت به',
      detailLine: `${spec.studyCount} في التسلسل · ${spec.poolCount} في الشبكة · ${spec.passPct}% للنجاح`,
      startLabel: 'ابدأ الجولة',
    };
  }
  return {
    headline: 'Your task this round',
    watchLine: 'Watch objects appear one by one — remember their order',
    tapLine: 'Then tap them back in the EXACT same order',
    detailLine: `${spec.studyCount} in sequence · ${spec.poolCount} in grid · ${spec.passPct}% to pass`,
    startLabel: 'Start round',
  };
}

export function prepareLevelRound(diff, lv, seed) {
  const spec = specificationForLevel(diff, lv);
  const { studyItems, recallPool } = buildSerialRecallRound(spec, seed);
  return { mode: 'level', diff, lv, spec, studyItems, recallPool, seed };
}

export function prepareFreeRound(studyCount, seed) {
  const sc = clamp(studyCount, 3, 8);
  const spec = {
    diff: 'easy',
    lv: 0,
    studyCount: sc,
    foilCount: sc,
    poolCount: sc * 2,
    flashMs: 950,
    gapMs: 350,
    passPct: 75,
  };
  const { studyItems, recallPool } = buildSerialRecallRound(spec, seed);
  return {
    mode: 'free',
    diff: 'easy',
    lv: 0,
    spec,
    studyItems,
    recallPool,
    seed,
    freeStudy: sc,
  };
}

export function prepareChallengeSeed() {
  const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  const { diff, lv } = CHALLENGE_LEVEL;
  const spec = specificationForLevel(diff, lv);
  return { seed, spec, diff, lv };
}

export function prepareChallengeRound(cSeed) {
  const spec = cSeed.spec ?? specificationForLevel(CHALLENGE_LEVEL.diff, CHALLENGE_LEVEL.lv);
  const seed = cSeed.seed >>> 0;
  const { studyItems, recallPool } = buildSerialRecallRound(spec, seed);
  return {
    mode: 'challenge',
    diff: spec.diff,
    lv: spec.lv,
    spec,
    studyItems,
    recallPool,
    seed,
  };
}

export function mergeMemoChallengeRow(prev, grade, playerName) {
  const snap = {
    pct: grade.pct,
    correct: grade.correctCount,
    total: grade.total,
    full: !!grade.correctSequence,
  };
  const rounds = [...(prev?.rounds || []), snap];
  const n = rounds.length;
  const avgPct = Math.round(rounds.reduce((s, r) => s + r.pct, 0) / n);
  const fullCount = rounds.reduce((s, r) => s + (r.full ? 1 : 0), 0);
  return { nm: playerName, rounds, avgPct, last: snap, fullCount };
}

export function compareMemoChallengeRows(a, b) {
  if (b.avgPct !== a.avgPct) return b.avgPct - a.avgPct;
  const aFull = a.fullCount ?? 0;
  const bFull = b.fullCount ?? 0;
  if (bFull !== aFull) return bFull - aFull;
  const aLast = a.last?.pct ?? 0;
  const bLast = b.last?.pct ?? 0;
  return bLast - aLast;
}
