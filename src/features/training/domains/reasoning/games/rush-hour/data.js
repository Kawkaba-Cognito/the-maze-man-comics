import {
  freeStageToDiffLv,
  isLevelUnlocked,
} from '../../../../shared/focusQuestData';
import {
  clonePieces,
  RUSH_HOUR_BASE_LAYOUTS,
} from './engine';
import {
  RH_LEVELS_PER_TIER,
  RH_DIFF_KEYS,
  specificationForLevel,
} from './data-spec';
import {
  getCuratedRushHourChallenge,
  getCuratedRushHourFreeRound,
  getCuratedRushHourLevel,
} from './curated-levels';

export { RH_LEVELS_PER_TIER, RH_DIFF_KEYS, specificationForLevel };

export { isLevelUnlocked };

const LS_KEY_V2 = 'mm_rh_progress_v2';
const LS_KEY_V1 = 'mm_rh_progress_v1';

const BASE = getCuratedRushHourLevel('easy', 1) || RUSH_HOUR_BASE_LAYOUTS[0];

/* ─── Rush Hour–specific free-mode scoring ─── */

/**
 * Bonus seconds after clearing a free Rush Hour puzzle.
 * Unlike the attention task (which keys off parSec), Rush Hour keys off parMoves.
 */
export function rhFreeClearBonusSec(stageCompleted, parMoves) {
  const s = Math.max(0, stageCompleted | 0);
  const par = Math.max(3, Number(parMoves) || 6);
  const tau = 20;
  const u = 1 / (1 + s / tau);
  const raw = 1.2 + u * (1.8 + 0.08 * par);
  return +Math.min(14, Math.max(1, raw)).toFixed(1);
}

/**
 * Points for clearing a free Rush Hour puzzle (streak = consecutive clears).
 */
export function rhFreeRoundClearPoints(parMoves, clearStreak) {
  const par = Math.max(3, Number(parMoves) || 6);
  const streak = Math.max(1, clearStreak);
  const streakMult = 1 + Math.min(streak - 1, 25) * 0.04;
  const base = 18 + par * 0.6;
  return Math.max(10, Math.round(base * streakMult));
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
