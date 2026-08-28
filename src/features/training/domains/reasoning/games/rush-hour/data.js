import {
  freeStageToDiffLv,
  isLevelUnlocked,
} from '../../../../shared/focusQuestData.js';
import {
  clonePieces,
  RUSH_HOUR_BASE_LAYOUTS,
} from './engine.js';
import {
  RH_LEVELS_PER_TIER,
  RH_DIFF_KEYS,
  specificationForLevel,
} from './data-spec.js';
import {
  getCuratedRushHourChallenge,
  getCuratedRushHourFreeRound,
  getCuratedRushHourLevel,
} from './curated-levels.js';

export { RH_LEVELS_PER_TIER, RH_DIFF_KEYS, specificationForLevel };

export { isLevelUnlocked };

const LS_KEY_V2 = 'mm_rh_progress_v2';
const LS_KEY_V1 = 'mm_rh_progress_v1';

const BASE = getCuratedRushHourLevel('easy', 1) || RUSH_HOUR_BASE_LAYOUTS[0];

/* ─── Rush Hour–specific free-mode scoring ─── */

/**
 * Efficiency-based scoring for free Rush Hour puzzles.
 * Awards points based on how close the player is to par:
 *   basePoints * (parMoves / actualMoves)
 * Streak multiplier rewards consecutive solves.
 *
 * @param {number} parMoves  — optimal move count for this puzzle
 * @param {number} actualMoves — how many moves the player actually used
 * @param {number} streak — consecutive clears (1 = first clear)
 * @returns {number} points earned (minimum 5)
 */
export function rhFreeParPoints(parMoves, actualMoves, streak) {
  const par = Math.max(3, Number(parMoves) || 6);
  const actual = Math.max(1, Number(actualMoves) || par);
  const st = Math.max(1, Number(streak) || 1);
  const basePoints = 20 + par * 0.8;
  const efficiency = Math.min(1, par / actual);
  const streakMult = 1 + Math.min(st - 1, 30) * 0.05;
  return Math.max(5, Math.round(basePoints * efficiency * streakMult));
}

/**
 * Points for clearing a free Rush Hour puzzle (streak = consecutive clears).
 * @deprecated Use rhFreeParPoints instead — kept for backward compatibility.
 */
export function rhFreeRoundClearPoints(parMoves, clearStreak) {
  return rhFreeParPoints(parMoves, parMoves, clearStreak);
}



/*
 * ── THE LADDER ──
 *
 * ONE climb of 60 levels, in six bands of ten. Replaced easy/med/hard on
 * 2026-08-28 — see LADDER-PLAN.md.
 *
 * ⚠ THE CURATED BANK IS NOT RE-SEQUENCED. Block Escape serves hand-built
 * puzzles with authored difficulty, verified by `validate:rh` (which re-solves
 * every reference board). Re-banding that content was flagged as the one
 * irreversible step in this whole migration — so the ladder does not touch it.
 * It is a PATH through the existing bank: each ladder level maps to an authored
 * (tier, level) that is already in the bank and already verified. Two bands per
 * tier, each sweeping half of that tier's hundred puzzles.
 *
 * The same approach the Cancellation ladder uses, for the same reason.
 */
export const RH_LADDER = [
  /* L1–10  */ { diff: 'easy', half: 0, adds: ['escape'] },
  /* L11–20 */ { diff: 'easy', half: 1, adds: [] },
  /* L21–30 */ { diff: 'medium', half: 0, adds: ['tighter'] },
  /* L31–40 */ { diff: 'medium', half: 1, adds: [] },
  /* L41–50 */ { diff: 'hard', half: 0, adds: ['gridlock'] },
  /* L51–60 */ { diff: 'hard', half: 1, adds: [] },
];

export const RH_LADDER_LEVELS = RH_LADDER.length * 10; // 60

export const RH_MECHANIC_LABELS = {
  escape: { en: 'Clear a path out', ar: 'افتح طريق الخروج' },
  tighter: { en: 'Tighter boards', ar: 'لوحات أضيق' },
  gridlock: { en: 'Gridlock', ar: 'ازدحام تام' },
};

/** Ladder level → the authored (tier, level) it plays. */
export function rhLadderToTier(lv) {
  const n = Math.min(RH_LADDER_LEVELS, Math.max(1, Math.round(Number(lv) || 1)));
  const b = RH_LADDER[Math.min(RH_LADDER.length - 1, Math.floor((n - 1) / 10))];
  const within = (n - 1) % 10;
  return { diff: b.diff, li: b.half * 50 + Math.round((within / 9) * 49) + 1 };
}

/** Deepest level under the old tiers → a level on the ladder. */
export function rhMigrateLadderReached(doneMap) {
  const order = ['easy', 'medium', 'hard'];
  let reached = 0;
  order.forEach((k, i) => {
    let deepest = 0;
    for (const key of Object.keys(doneMap || {})) {
      const m = key.match(/^([a-z]+)-(\d+)$/);
      if (m && m[1] === k) deepest = Math.max(deepest, Number(m[2]) || 0);
    }
    if (deepest > 0) reached = Math.max(reached, i * 20 + Math.round((deepest / 100) * 20));
  });
  return Math.max(0, Math.min(RH_LADDER_LEVELS, reached));
}

export function getRushHourLevel(diffKey, levelIndex) {
  if (!RH_DIFF_KEYS.includes(diffKey)) return null;
  if (levelIndex < 1 || levelIndex > RH_LEVELS_PER_TIER) return null;
  const level = getCuratedRushHourLevel(diffKey, levelIndex);
  return level ? { ...level, pieces: clonePieces(level.pieces) } : null;
}

export function getRushHourFreeRound(stageIndex, sessionNonce) {
  const { diff, lv } = freeStageToDiffLv(stageIndex);
  const level = getCuratedRushHourFreeRound(stageIndex, sessionNonce);
  return level
    ? { ...level, pieces: clonePieces(level.pieces) }
    : { ...BASE, labelKey: 'free', freeStage: stageIndex, diff, lv, pieces: clonePieces(BASE.pieces) };
}

export function rushHourUtcDateKey() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Fair shared board for pass-and-play challenge.
 * @param {number} seed
 * @param {number} [cycleIndex] — 0-based round index; grid and par targets ramp up.
 * @param {number} [totalRounds] — session size; slightly lifts late-game targets.
 */
export function buildChallengeRhPuzzle(seed, cycleIndex = 0, totalRounds = 1) {
  const s = (seed >>> 0) || 1;
  const level = getCuratedRushHourChallenge(s, cycleIndex, totalRounds);
  return level
    ? { ...level, pieces: clonePieces(level.pieces) }
    : { ...BASE, labelKey: 'challenge', seed: s, pieces: clonePieces(BASE.pieces) };
}

function defaultProgress() {
  return {
    done: {},
    best: {},
    freeBest: 0,
    freeBestScore: 0,
    chalDay: null,
    chalBest: null,
    lastFreeSeed: Date.now(),
  };
}

function migrateV1ToV2(rawV1) {
  const p = typeof rawV1 === 'object' && rawV1 ? rawV1 : {};
  const unlocked = Math.max(1, Math.min(RH_LEVELS_PER_TIER, Number(p.unlocked) || 1));
  const next = defaultProgress();
  next.lastFreeSeed = Number(p.lastFreeSeed) || next.lastFreeSeed;
  for (let i = 1; i < unlocked; i++) {
    next.done[`easy-${i}`] = true;
  }
  if (p.best && typeof p.best === 'object') {
    for (const [k, v] of Object.entries(p.best)) {
      const mv = Number(v);
      if (Number.isFinite(mv)) next.best[`easy-${k}`] = mv;
    }
  }
  return next;
}

export function loadRhProgress() {
  try {
    const raw2 = localStorage.getItem(LS_KEY_V2);
    if (raw2) {
      const p = JSON.parse(raw2);
      return {
        ...defaultProgress(),
        ...p,
        done: typeof p.done === 'object' && p.done ? p.done : {},
        best: typeof p.best === 'object' && p.best ? p.best : {},
        freeBest: Math.max(0, Number(p.freeBest) || 0),
        freeBestScore: Math.max(0, Number(p.freeBestScore) || 0),
        chalDay: p.chalDay ?? null,
        chalBest:
          p.chalBest != null && Number.isFinite(Number(p.chalBest))
            ? Number(p.chalBest)
            : null,
        lastFreeSeed: Number(p.lastFreeSeed) || Date.now(),
      };
    }
    const raw1 = localStorage.getItem(LS_KEY_V1);
    if (raw1) {
      const migrated = migrateV1ToV2(JSON.parse(raw1));
      localStorage.setItem(LS_KEY_V2, JSON.stringify(migrated));
      return migrated;
    }
  } catch {
    /* ignore */
  }
  return defaultProgress();
}

export function saveRhProgress(data) {
  try {
    localStorage.setItem(LS_KEY_V2, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

/** Merge one challenge round into per-player Rush Hour stats (lower rankScore wins). */
export function mergeRhChallengeRow(prev, snap, nm) {
  const rounds = [...(prev?.rounds || []), snap];
  let moveSum = 0;
  let secSum = 0;
  for (const r of rounds) {
    moveSum += r.won ? r.moves : r.moves + 80;
    secSum += r.sec || 0;
  }
  const n = rounds.length;
  const avgMoves = moveSum / n;
  const avgSec = secSum / n;
  const rankScore = avgMoves * 10 + avgSec;
  return { nm, rounds, avgMoves, avgSec, rankScore };
}
