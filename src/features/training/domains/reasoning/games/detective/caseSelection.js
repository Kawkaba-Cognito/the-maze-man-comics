import { makeRng } from '../../../../shared/rng';
import { FULL_BY_TIER, QUICK_BY_TIER } from './investigations';
import { survivalTier } from './caseUtils';

export const LIVES = 3;

export const tierForDiff = { easy: 0, med: 1, hard: 2 };

const FULL_POOLS = FULL_BY_TIER.map((l) => (l.length ? l : FULL_BY_TIER[0]));
const QUICK_POOLS = QUICK_BY_TIER.map((l, i) => (l.length ? l : FULL_POOLS[i]));

export function shuffleR(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makePools(rng) {
  return [0, 1, 2].map((tierI) => ({ list: shuffleR(QUICK_POOLS[tierI], rng), idx: 0, lastId: null }));
}

function pickFromPool(tierI, pools, rng) {
  const pool = pools[tierI];
  if (pool.idx >= pool.list.length) {
    pool.list = shuffleR(QUICK_POOLS[tierI], rng);
    if (pool.list.length > 1 && pool.list[0].id === pool.lastId) {
      const last = pool.list.length - 1;
      [pool.list[0], pool.list[last]] = [pool.list[last], pool.list[0]];
    }
    pool.idx = 0;
  }
  const c = pool.list[pool.idx++];
  pool.lastId = c.id;
  return c;
}

function pickAdaptive(solved, pools) {
  const tierI = survivalTier(solved);
  return pickFromPool(tierI, pools);
}

/** Mutable refs for survival / pass-play case sequencing. */
export function createCaseSession(rng) {
  return {
    lives: LIVES,
    solved: 0,
    caseNo: 0,
    ppDone: 0,
    ppSolved: 0,
    seq: null,
    pools: null,
  };
}

export function pickCase(mode, { diff, level, session, rng, ppDone }) {
  if (mode === 'levels') {
    const list = FULL_POOLS[tierForDiff[diff] ?? 1];
    return list[((level || 1) - 1) % list.length];
  }
  if (mode === 'passplay') {
    const tierI = Math.min(2, Math.floor(ppDone / 2));
    if (!session.seq?.[tierI]) {
      if (!session.seq) session.seq = {};
      session.seq[tierI] = shuffleR(QUICK_POOLS[tierI], rng);
    }
    const list = session.seq[tierI];
    return list[ppDone % list.length];
  }
  if (!session.pools) session.pools = makePools(rng);
  return pickAdaptive(session.solved, session.pools);
}

export function resetSession(session) {
  session.lives = LIVES;
  session.solved = 0;
  session.caseNo = 0;
  session.ppDone = 0;
  session.ppSolved = 0;
  session.seq = null;
  session.pools = null;
}

export { FULL_POOLS, QUICK_POOLS };
