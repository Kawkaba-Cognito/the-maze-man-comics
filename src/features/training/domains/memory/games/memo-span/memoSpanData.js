/** Memo Span — object study + "Did you see this?" recognition. */

import { objectIds } from './memoObjects';

export const MS_LEVELS_PER_TIER = 20;
export const MS_DIFF_KEYS = ['easy', 'medium', 'hard'];

export const MS_DM = {
  easy: { label: 'Easy', pop: 'Few objects · clear timing', lvc: 'lve' },
  medium: { label: 'Medium', pop: 'More objects · faster', lvc: 'lvm' },
  hard: { label: 'Hard', pop: 'Long lists · quick flashes', lvc: 'lvh' },
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

export function specificationForLevel(diff, levelIndex) {
  const key = MS_DIFF_KEYS.includes(diff) ? diff : 'easy';
  const li = clamp(Math.floor(levelIndex) || 1, 1, MS_LEVELS_PER_TIER) - 1;
  const t = li / (MS_LEVELS_PER_TIER - 1);

  const studyCount = Math.round(lerp(key === 'easy' ? 3 : 4, key === 'easy' ? 5 : key === 'medium' ? 6 : 8, t));
  const foilCount = studyCount;
  const flashMs = Math.round(lerp(key === 'hard' ? 900 : 1100, key === 'hard' ? 650 : 800, t));
  const gapMs = Math.round(lerp(500, 320, t));
  const passPct = Math.round(lerp(70, 82, t));

  return {
    diff: key,
    lv: li + 1,
    studyCount,
    questionCount: studyCount + foilCount,
    flashMs,
    gapMs,
    passPct,
  };
}

export function buildRecognitionRound(spec, seed = Date.now()) {
  const rnd = mulberry32(seed >>> 0);
  const studyObjectIds = objectIds(spec.studyCount, rnd);
  const studySet = new Set(studyObjectIds);
  const foilIds = objectIds(spec.foilCount ?? spec.studyCount, rnd, studySet);

  const studyItems = studyObjectIds.map((objectId, i) => ({ id: `s${i}`, objectId }));
  const questions = shuffle(
    [
      ...studyObjectIds.map((objectId) => ({ objectId, wasShown: true })),
      ...foilIds.map((objectId) => ({ objectId, wasShown: false })),
    ],
    rnd,
  );

  return { studyItems, questions };
}

export function gradeRecognition(questions, answers) {
  let correct = 0;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const saidYes = !!answers[i];
    if (saidYes === q.wasShown) correct++;
  }
  const total = questions.length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  return { correct, total, pct };
}

export function starsForRecognition(pct, spec) {
  if (pct < spec.passPct) return 0;
  if (pct >= 95) return 3;
  if (pct >= 85) return 2;
  return 1;
}

export function isMemoSpanLevelUnlocked(diff, lv, doneMap) {
  if (lv <= 1) return true;
  return !!(doneMap[`${diff}-${lv - 1}`] || doneMap[`${diff}-${lv}`]);
}

export function describeBriefing(spec, isAr) {
  if (isAr) {
    return {
      headline: 'مهمة هذه الجولة',
      watchLine: 'سنريك أشياء واحداً تلو الآخر — حاول تذكّرها',
      tapLine: 'بعدها نسأل: «هل رأيت هذا؟» — اضغط نعم أو لا',
      detailLine: `${spec.studyCount} أشياء · ${spec.questionCount} أسئلة · ${spec.passPct}% للنجاح`,
      startLabel: 'ابدأ الجولة',
    };
  }
  return {
    headline: 'Your task this round',
    watchLine: 'We show everyday objects one by one — try to remember them',
    tapLine: 'Then we ask: “Did you see this?” — tap Yes or No',
    detailLine: `${spec.studyCount} objects · ${spec.questionCount} questions · ${spec.passPct}% to pass`,
    startLabel: 'Start round',
  };
}

export function prepareLevelRound(diff, lv, seed) {
  const spec = specificationForLevel(diff, lv);
  const { studyItems, questions } = buildRecognitionRound(spec, seed);
  return { mode: 'level', diff, lv, spec, studyItems, questions, seed };
}

export function prepareFreeRound(studyCount, seed) {
  const spec = {
    diff: 'easy',
    lv: 0,
    studyCount: clamp(studyCount, 3, 7),
    foilCount: clamp(studyCount, 3, 7),
    questionCount: clamp(studyCount, 3, 7) * 2,
    flashMs: 1000,
    gapMs: 400,
    passPct: 72,
  };
  const { studyItems, questions } = buildRecognitionRound(spec, seed);
  return { mode: 'free', diff: 'easy', lv: 0, spec, studyItems, questions, seed, freeStudy: studyCount };
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
  const { studyItems, questions } = buildRecognitionRound(spec, seed);
  return {
    mode: 'challenge',
    diff: spec.diff,
    lv: spec.lv,
    spec,
    studyItems,
    questions,
    seed,
  };
}

export function mergeMemoChallengeRow(prev, grade, playerName) {
  const snap = { pct: grade.pct, correct: grade.correct, total: grade.total };
  const rounds = [...(prev?.rounds || []), snap];
  const n = rounds.length;
  const avgPct = Math.round(rounds.reduce((s, r) => s + r.pct, 0) / n);
  return { nm: playerName, rounds, avgPct, last: snap };
}

export function compareMemoChallengeRows(a, b) {
  if (b.avgPct !== a.avgPct) return b.avgPct - a.avgPct;
  const aLast = a.last?.pct ?? 0;
  const bLast = b.last?.pct ?? 0;
  return bLast - aLast;
}
