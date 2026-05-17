/**
 * Web Worker for Rush Hour board lookup.
 *
 * The actual reasoning math is done offline: curated-levels.js contains boards
 * selected from a fully enumerated Rush Hour state graph and graded by exact BFS
 * distance. The worker remains so older UI code keeps the same async boundary,
 * but it now returns verified boards instantly instead of generating random ones.
 */
import { clonePieces } from './engine.js';
import { RH_DIFF_KEYS, RH_LEVELS_PER_TIER } from './data-spec.js';
import {
  getCuratedRushHourChallenge,
  getCuratedRushHourFreeRound,
  getCuratedRushHourLevel,
} from './curated-levels.js';

const FREE_PROGRESS_ORDER = RH_DIFF_KEYS;

function freeStageToDiffLv(stageIndex) {
  const s = Math.max(0, stageIndex | 0);
  const maxLinear = FREE_PROGRESS_ORDER.length * RH_LEVELS_PER_TIER - 1;
  const capped = Math.min(s, maxLinear);
  const diffIx = Math.floor(capped / RH_LEVELS_PER_TIER);
  const lv = (capped % RH_LEVELS_PER_TIER) + 1;
  return { diff: FREE_PROGRESS_ORDER[diffIx], lv };
}

function fallbackBoard(labelKey, extra = {}) {
  const base = getCuratedRushHourLevel('easy', 1);
  return {
    labelKey,
    grid: base.grid,
    exitRow: base.exitRow,
    pieces: clonePieces(base.pieces),
    par: base.par,
    ...extra,
  };
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
  return getCuratedRushHourLevel(diffKey, levelIndex) ||
    fallbackBoard('level', { level: levelIndex, diff: diffKey });
}

function generateFreeRound(stageIndex) {
  const { diff, lv } = freeStageToDiffLv(stageIndex);
  return getCuratedRushHourFreeRound(stageIndex) ||
    fallbackBoard('free', { freeStage: stageIndex, diff, lv });
}

function generateChallenge(seed, cycleIndex, totalRounds) {
  const s = (seed >>> 0) || 1;
  const c = Math.max(0, cycleIndex | 0);
  return getCuratedRushHourChallenge(s, c, totalRounds) ||
    fallbackBoard('challenge', { seed: s });
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
