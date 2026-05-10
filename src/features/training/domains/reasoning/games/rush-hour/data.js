import {
  freeStageToDiffLv,
  isLevelUnlocked,
} from '../../../../shared/focusQuestData';
import {
  clonePieces,
  generateFastPuzzle,
  resolveBaselinePieces,
  RUSH_HOUR_BASE_LAYOUTS,
} from './engine';

export const RH_LEVELS_PER_TIER = 20;

/** Same tier order as Attention / Focus Quest (`DM` keys). */
export const RH_DIFF_KEYS = ['easy', 'inter', 'hard', 'xhard', 'deadly'];

/** Bump when generation math / baselines change (invalidates cached boards). */
const RH_GEN_VERSION = 6;

export { isLevelUnlocked };

const LS_KEY_V2 = 'mm_rh_progress_v2';
const LS_KEY_V1 = 'mm_rh_progress_v1';

const BASE = RUSH_HOUR_BASE_LAYOUTS[0];

/** Level 1 — curated tutorial on easy tier only (6×6 classic). */
const LEVEL_1_EASY = {
  level: 1,
  diff: 'easy',
  grid: BASE.grid,
  exitRow: BASE.exitRow,
  pieces: clonePieces(BASE.pieces),
  par: 4,
};

let generatedCache = Object.create(null);

function cacheKey(diffKey, levelIndex) {
  return `v${RH_GEN_VERSION}-${diffKey}-${levelIndex}`;
}


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

/**
 * Curriculum parameters from tier index T∈[0,4] and stage L∈[1,20].
 * Grid width G∈[6,9], scramble depth, and BFS par window all grow smoothly.
 */
export function specificationForLevel(diffKey, levelIndex) {
  const T = Math.max(0, RH_DIFF_KEYS.indexOf(diffKey));
  const L = Math.max(1, Math.min(RH_LEVELS_PER_TIER, levelIndex));

  const G = Math.min(
    7,
    Math.max(
      6,
      6 + Math.floor(0.4 * T + 0.05 * L + 0.024 * T * L),
    ),
  );
  const exitRow = Math.floor((G - 1) / 2);

  const scrambleBase = 14 + 5.2 * L + (0.55 * L * L) / 20;
  const tierScramble = 1 + 0.26 * T + 0.014 * T * L;
  const gridBoost = (G - 6) * (11 + L * 0.35);
  const deadlyLift = T >= 4 ? 1.15 + 0.004 * L : 1;
  const steps = Math.min(
    200,
    Math.floor(
      (scrambleBase * tierScramble + gridBoost + 0.52 * T * G * G) * deadlyLift,
    ),
  );

  const seed =
    (0x51ed * L) ^
    (0xfcf1 * T) ^
    diffKey.split('').reduce((a, c) => Math.imul(a, 31) + c.charCodeAt(0), 7);

  const densityBump = Math.floor(0.45 * T * T + 0.12 * T * (G - 6));

  return {
    grid: G,
    exitRow,
    steps,
    seed: (seed >>> 0) || 1,
    densityBump,
  };
}


export function getRushHourLevel(diffKey, levelIndex) {
  if (!RH_DIFF_KEYS.includes(diffKey)) return null;
  if (levelIndex < 1 || levelIndex > RH_LEVELS_PER_TIER) return null;
  if (diffKey === 'easy' && levelIndex === 1) {
    return {
      ...LEVEL_1_EASY,
      pieces: clonePieces(LEVEL_1_EASY.pieces),
      labelKey: 'level',
    };
  }

  const ck = cacheKey(diffKey, levelIndex);
  if (generatedCache[ck]) return generatedCache[ck];

  const spec = specificationForLevel(diffKey, levelIndex);
  const { grid: G, exitRow: eR } = spec;
  let gen = null;

  for (let t = 0; t < 8; t++) {
    const trySeed = (spec.seed + t * 131_071) >>> 0;
    const base =
      resolveBaselinePieces(G, eR, trySeed, (spec.densityBump || 0) + (t % 2)) ||
      (G === 6 && eR === BASE.exitRow
        ? clonePieces(BASE.pieces)
        : null);
    if (!base) continue;
    gen = generateFastPuzzle({
      basePieces: base,
      grid: G,
      exitRow: eR,
      seed: (spec.seed + t * 17) >>> 0,
      scrambleSteps: Math.min(250, spec.steps),
    });
    if (gen) break;
  }

  if (!gen) {
    console.warn(`[RH fallback] ${diffKey}-${levelIndex} fell back to easy-1 layout`);
    gen = {
      pieces: clonePieces(BASE.pieces),
      par: LEVEL_1_EASY.par,
      grid: BASE.grid,
      exitRow: BASE.exitRow,
    };
  }

  const def = {
    labelKey: 'level',
    level: levelIndex,
    diff: diffKey,
    grid: gen.grid ?? G,
    exitRow: gen.exitRow ?? eR,
    pieces: gen.pieces,
    par: gen.par,
  };
  generatedCache[ck] = def;
  return def;
}

export function getRushHourFreeRound(stageIndex, sessionNonce) {
  const { diff, lv } = freeStageToDiffLv(stageIndex);
  const spec = specificationForLevel(diff, lv);
  const salt =
    (typeof sessionNonce === 'number' ? sessionNonce : 0x51c301) >>> 0;
  const mixedSeed = (spec.seed ^ salt ^ Math.imul(stageIndex + 1, 0x9e3779b1)) >>> 0;
  const { grid, exitRow } = spec;

  for (let t = 0; t < 6; t++) {
    const trySeed = (mixedSeed + t * 131_071) >>> 0;
    const base =
      resolveBaselinePieces(grid, exitRow, trySeed, (spec.densityBump || 0) + (t % 2)) ||
      (grid === 6 && exitRow === BASE.exitRow
        ? clonePieces(BASE.pieces)
        : null);
    if (!base) continue;
    const gen = generateFastPuzzle({
      basePieces: base,
      grid,
      exitRow,
      seed: (mixedSeed + t * 17) >>> 0,
      scrambleSteps: Math.min(200, spec.steps),
    });
    if (gen) {
      return {
        labelKey: 'free',
        freeStage: stageIndex,
        diff,
        lv,
        grid,
        exitRow,
        pieces: gen.pieces,
        par: gen.par,
      };
    }
  }

  return {
    labelKey: 'free',
    freeStage: stageIndex,
    diff,
    lv,
    grid: BASE.grid,
    exitRow: BASE.exitRow,
    pieces: clonePieces(BASE.pieces),
    par: LEVEL_1_EASY.par,
  };
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
  const c = Math.max(0, cycleIndex | 0);
  const R = Math.max(1, totalRounds | 0);
  const grid = Math.min(7, 6 + (c >= 2 ? 1 : 0));
  const exitRow = Math.floor((grid - 1) / 2);
  const steps = 50 + 20 * c + 10 * (grid - 6) + (s % 20);
  const densityBump = 1 + (s % 2) + Math.min(1, c);

  for (let t = 0; t < 6; t++) {
    const trySeed = (s + t * 131_071) >>> 0;
    const base =
      resolveBaselinePieces(grid, exitRow, trySeed, densityBump + (t % 2)) ||
      (grid === 6 && exitRow === BASE.exitRow
        ? clonePieces(BASE.pieces)
        : null);
    if (!base) continue;
    const gen = generateFastPuzzle({
      basePieces: base,
      grid,
      exitRow,
      seed: (s + t * 17) >>> 0,
      scrambleSteps: steps,
    });
    if (gen) {
      return {
        labelKey: 'challenge',
        grid,
        exitRow,
        pieces: gen.pieces,
        par: gen.par,
        seed: s,
      };
    }
  }

  return {
    labelKey: 'challenge',
    grid: BASE.grid,
    exitRow: BASE.exitRow,
    pieces: clonePieces(BASE.pieces),
    par: LEVEL_1_EASY.par,
    seed: s,
  };
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
