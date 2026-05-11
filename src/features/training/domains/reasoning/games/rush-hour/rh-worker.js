/**
 * Web Worker for Rush Hour puzzle generation.
 * Runs BFS solving off the main thread to avoid UI lag.
 */
import {
  clonePieces,
  forwardScramble,
  isWon,
  RUSH_HOUR_BASE_LAYOUTS,
} from './engine.js';
import { specificationForLevel, RH_DIFF_KEYS, RH_LEVELS_PER_TIER } from './data-spec.js';

const FREE_PROGRESS_ORDER = ['easy', 'inter', 'hard', 'xhard', 'deadly'];

function freeStageToDiffLv(stageIndex) {
  const s = Math.max(0, stageIndex | 0);
  const maxLinear = FREE_PROGRESS_ORDER.length * 20 - 1;
  const capped = Math.min(s, maxLinear);
  const diffIx = Math.floor(capped / 20);
  const lv = (capped % 20) + 1;
  return { diff: FREE_PROGRESS_ORDER[diffIx], lv };
}

const BASE = RUSH_HOUR_BASE_LAYOUTS[0];

const LEVEL_1_EASY = {
  level: 1,
  diff: 'easy',
  grid: BASE.grid,
  exitRow: BASE.exitRow,
  pieces: clonePieces(BASE.pieces),
  par: 4,
};

function rngFactory(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = Math.imul(1664525, s) + 1013904223;
    return ((s >>> 0) / 4294967296);
  };
}

function fallbackBoard(labelKey, extra = {}) {
  return {
    labelKey,
    grid: BASE.grid,
    exitRow: BASE.exitRow,
    pieces: clonePieces(BASE.pieces),
    par: LEVEL_1_EASY.par,
    ...extra,
  };
}

function quickPuzzleFromSpec(spec, seed, maxTries = 4) {
  for (let t = 0; t < maxTries; t++) {
    const steps = Math.min(90, Math.max(8, spec.steps || 24));
    const pieces = forwardScramble(
      BASE.pieces,
      BASE.grid,
      steps,
      rngFactory((seed + t * 17) >>> 0),
    );
    if (!isWon(pieces, BASE.grid, BASE.exitRow)) {
      return {
        grid: BASE.grid,
        exitRow: BASE.exitRow,
        pieces,
        par: Math.max(4, Math.min(28, Math.round(steps / 7))),
      };
    }
  }
  return null;
}

function generateLevel(diffKey, levelIndex) {
  if (!RH_DIFF_KEYS.includes(diffKey)) {
    return fallbackBoard('level', { level: 1, diff: 'easy' });
  }
  if (levelIndex < 1 || levelIndex > RH_LEVELS_PER_TIER) {
    return fallbackBoard('level', {
      level: Math.max(1, Math.min(RH_LEVELS_PER_TIER, levelIndex || 1)),
      diff: diffKey,
    });
  }
  if (diffKey === 'easy' && levelIndex === 1) {
    return {
      ...LEVEL_1_EASY,
      pieces: clonePieces(LEVEL_1_EASY.pieces),
      labelKey: 'level',
    };
  }

  const spec = specificationForLevel(diffKey, levelIndex);
  const gen = quickPuzzleFromSpec(spec, spec.seed, 4) ||
    fallbackBoard('level', { level: levelIndex, diff: diffKey });

  return {
    labelKey: 'level',
    level: levelIndex,
    diff: diffKey,
    grid: gen.grid,
    exitRow: gen.exitRow,
    pieces: gen.pieces,
    par: gen.par,
  };
}

function generateFreeRound(stageIndex, sessionNonce) {
  const { diff, lv } = freeStageToDiffLv(stageIndex);
  const spec = specificationForLevel(diff, lv);
  const salt = (typeof sessionNonce === 'number' ? sessionNonce : 0x51c301) >>> 0;
  const mixedSeed = (spec.seed ^ salt ^ Math.imul(stageIndex + 1, 0x9e3779b1)) >>> 0;
  const gen = quickPuzzleFromSpec(spec, mixedSeed, 4);
  return gen ? {
    labelKey: 'free',
    freeStage: stageIndex,
    diff,
    lv,
    grid: gen.grid,
    exitRow: gen.exitRow,
    pieces: gen.pieces,
    par: gen.par,
  } : fallbackBoard('free', { freeStage: stageIndex, diff, lv });
}

function generateChallenge(seed, cycleIndex, totalRounds) {
  const s = (seed >>> 0) || 1;
  const c = Math.max(0, cycleIndex | 0);
  const grid = Math.min(7, 6 + (c >= 2 ? 1 : 0));
  const exitRow = Math.floor((grid - 1) / 2);
  const steps = 50 + 20 * c + 10 * (grid - 6) + (s % 20);
  const densityBump = 1 + (s % 2) + Math.min(1, c);

  const gen = quickPuzzleFromSpec({ grid, exitRow, steps, densityBump }, s, 4);
  return gen ? {
    labelKey: 'challenge',
    grid: gen.grid,
    exitRow: gen.exitRow,
    pieces: gen.pieces,
    par: gen.par,
    seed: s,
  } : fallbackBoard('challenge', { seed: s });
}

self.onmessage = (e) => {
  const { type, id, payload } = e.data;

  try {
    if (type === 'generateLevel') {
      const result = generateLevel(payload.diffKey, payload.levelIndex);
      self.postMessage({ id, result });
    } else if (type === 'generateFree') {
      const result = generateFreeRound(payload.stageIndex, payload.sessionNonce);
      self.postMessage({ id, result });
    } else if (type === 'generateChallenge') {
      const result = generateChallenge(payload.seed, payload.cycleIndex, payload.totalRounds);
      self.postMessage({ id, result });
    }
  } catch (err) {
    self.postMessage({ id, error: err?.message || 'Worker error' });
  }
};
