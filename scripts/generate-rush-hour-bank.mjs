/**
 * Generate the Rush Hour puzzle bank — CORRECT method.
 *
 *   node scripts/generate-rush-hour-bank.mjs
 *
 * Method: BFS-from-solved.
 *   1. Build a procedural topology (random pack of cars) with the hero
 *      already at the exit (so the START state IS solved).
 *   2. BFS that solved state forward, labelling every reachable state by
 *      its distance from solved. By Rush Hour's reversibility, that
 *      distance == the par (shortest solution length) of using that state
 *      as a puzzle.
 *   3. For each (tier × level) target par, pick a state at that exact depth.
 *      Par is exact by construction — no guessing.
 *   4. Re-BFS every shipped puzzle as a final independent check.
 *
 * Output: src/features/training/domains/reasoning/games/rush-hour/puzzleBank.json
 */

import {
  bfsSolve,
  rngFactory,
  isWon,
  clonePieces,
  neighborStatesFixed,
  stateToKey,
} from '../src/features/training/domains/reasoning/games/rush-hour/engine.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.join(
  __dirname,
  '../src/features/training/domains/reasoning/games/rush-hour/puzzleBank.json',
);

/* ─── Curriculum ─── */

const TIERS = ['easy', 'inter', 'hard', 'xhard', 'deadly'];
const LEVELS_PER_TIER = 20;

const PAR_CURVE = {
  easy:   { startPar: 3,  endPar: 10, grid: 6, carMin: 6,  carMax: 9  },
  inter:  { startPar: 10, endPar: 18, grid: 6, carMin: 9,  carMax: 11 },
  hard:   { startPar: 18, endPar: 26, grid: 7, carMin: 10, carMax: 13 },
  xhard:  { startPar: 26, endPar: 36, grid: 7, carMin: 13, carMax: 15 },
  deadly: { startPar: 36, endPar: 46, grid: 7, carMin: 14, carMax: 16 },
};

function targetParFor(tier, level) {
  const c = PAR_CURVE[tier];
  return Math.round(
    c.startPar + ((c.endPar - c.startPar) * (level - 1)) / (LEVELS_PER_TIER - 1),
  );
}

/* ─── Build a SOLVED-state topology ─── */

/**
 * Random pack with the hero already at the rightmost valid position on
 * exitRow (so the state IS solved). Other cars placed randomly avoiding
 * overlaps. No horizontal cars on exitRow other than the hero.
 */
function buildSolvedTopology(grid, exitRow, seed, carTarget) {
  const rng = rngFactory(seed);
  const heroLen = 2;
  const heroCol = grid - heroLen;
  const occ = Array.from({ length: grid }, () => Array(grid).fill(false));
  const pieces = [
    { id: 'hero', row: exitRow, col: heroCol, len: heroLen, dir: 'h', isHero: true },
  ];
  for (let i = 0; i < heroLen; i++) occ[exitRow][heroCol + i] = true;

  const maxAttempts = Math.max(300, carTarget * 40);
  for (let k = 0; k < maxAttempts && pieces.length - 1 < carTarget; k++) {
    const vertical = rng() < 0.55;
    const len = rng() < 0.6 ? 2 : 3;
    if (vertical) {
      const c = Math.floor(rng() * grid);
      const r = Math.floor(rng() * (grid - len + 1));
      let ok = true;
      for (let i = 0; i < len; i++) if (occ[r + i][c]) ok = false;
      if (!ok) continue;
      for (let i = 0; i < len; i++) occ[r + i][c] = true;
      pieces.push({ id: `C${pieces.length}`, row: r, col: c, len, dir: 'v' });
    } else {
      const c = Math.floor(rng() * (grid - len + 1));
      const r = Math.floor(rng() * grid);
      // No horizontal cars on exitRow (would clash with hero / cleanly block exit).
      if (r === exitRow) continue;
      let ok = true;
      for (let i = 0; i < len; i++) if (occ[r][c + i]) ok = false;
      if (!ok) continue;
      for (let i = 0; i < len; i++) occ[r][c + i] = true;
      pieces.push({ id: `C${pieces.length}`, row: r, col: c, len, dir: 'h' });
    }
  }
  return pieces.length >= 4 ? pieces : null;
}

/* ─── BFS from solved, collect states by depth ─── */

const PER_DEPTH_CAP = 60;
const BFS_VISIT_CAP = 1_500_000;
/** Per-topology BFS time budget. Some random packings give huge shallow state
 *  spaces that waste minutes without ever reaching useful depth — bail fast.
 *  Was 12s; bumped to 20s so dense 7×7 deadly-tier topologies can actually
 *  reach depth ≥ 30 within budget. */
const BFS_TIME_LIMIT_MS = 20_000;

function bfsFromSolved(state) {
  const { pieces, grid, exitRow } = state;
  if (!isWon(pieces, grid, exitRow)) {
    throw new Error('start state must be solved');
  }
  const tStart = Date.now();
  const byDepth = [[clonePieces(pieces)]];
  const seen = new Set([stateToKey(pieces)]);
  let frontier = [clonePieces(pieces)];
  let depth = 0;
  let visits = 1;
  let timedOut = false;

  while (frontier.length && visits < BFS_VISIT_CAP) {
    if (Date.now() - tStart > BFS_TIME_LIMIT_MS) {
      timedOut = true;
      break;
    }
    const next = [];
    for (const cur of frontier) {
      for (const nxt of neighborStatesFixed(cur, grid)) {
        const k = stateToKey(nxt);
        if (seen.has(k)) continue;
        seen.add(k);
        next.push(nxt);
        visits++;
        if (visits >= BFS_VISIT_CAP) break;
      }
      if (visits >= BFS_VISIT_CAP) break;
    }
    if (!next.length) break;
    depth++;
    // Trim per-depth list to keep memory under control. Random sample.
    if (next.length > PER_DEPTH_CAP) {
      const sampled = [];
      const step = Math.floor(next.length / PER_DEPTH_CAP);
      for (let i = 0; sampled.length < PER_DEPTH_CAP && i < next.length; i += step) {
        sampled.push(next[i]);
      }
      byDepth[depth] = sampled;
    } else {
      byDepth[depth] = next;
    }
    frontier = next;
  }

  return { byDepth, visits, maxDepth: depth, timedOut };
}

/* ─── Pick a level puzzle from any topology that has a state at target depth ─── */

function pickAtDepth(topologies, target, level, tier) {
  // Exact match first
  for (const topo of topologies) {
    const at = topo.byDepth[target];
    if (at && at.length) {
      const idx = (level * 7919 + tier.charCodeAt(0) * 31) % at.length;
      return { pieces: at[idx], par: target };
    }
  }
  // Closest fallback — search outward up to ±10
  for (let delta = 1; delta <= 10; delta++) {
    for (const topo of topologies) {
      for (const d of [target - delta, target + delta]) {
        if (d < 1) continue;
        if (topo.byDepth[d]?.length) {
          const idx = (level * 7919 + tier.charCodeAt(0) * 31) % topo.byDepth[d].length;
          return { pieces: topo.byDepth[d][idx], par: d };
        }
      }
    }
  }
  return null;
}

/* ─── Build topologies for a tier until we cover the par range ─── */

function buildTopologiesForTier(tier) {
  const cfg = PAR_CURVE[tier];
  const grid = cfg.grid;
  const exitRow = Math.floor((grid - 1) / 2);
  const topologies = [];
  let topologySeed = (tier.charCodeAt(0) * 0x9e3779b1) >>> 0;
  let attempts = 0;
  /* Bounded so deadly tier doesn't grind forever when no topology reaches
   * sufficient depth. We prefer to ship a smaller bank than block the build. */
  const MAX_ATTEMPTS = (tier === 'deadly') ? 30 : 50;
  /* Hard tiers: 2 partial topologies are enough — once we have one full and
   * one partial, the picker has plenty of variety. Easy tiers: 5. */
  const TARGET_TOPOLOGIES = (tier === 'hard' || tier === 'xhard' || tier === 'deadly') ? 2 : 5;
  /* Stop early if we already have at least one topology that fully covers
   * the par range — no point grinding for more. */
  let haveFullCoverage = false;
  // A topology is "useful" if it gives us reasonable depth coverage.
  const usefulMinDepth = Math.max(8, Math.round(cfg.startPar + (cfg.endPar - cfg.startPar) * 0.45));

  while (topologies.length < TARGET_TOPOLOGIES && attempts < MAX_ATTEMPTS) {
    attempts++;
    const carTarget = cfg.carMin + (attempts % (cfg.carMax - cfg.carMin + 1));
    const solved = buildSolvedTopology(grid, exitRow, topologySeed, carTarget);
    topologySeed = (topologySeed + 1_000_003) >>> 0;
    if (!solved) continue;
    const t0 = Date.now();
    const result = bfsFromSolved({ pieces: solved, grid, exitRow });
    const dt = Date.now() - t0;
    const timeoutTag = result.timedOut ? ' [timeout]' : '';
    const tag = result.maxDepth >= cfg.endPar ? '✓ (full)' :
                result.maxDepth >= usefulMinDepth ? '✓ (partial)' :
                '✗ (too shallow)';
    process.stdout.write(
      `  [${tier}] topology cars=${solved.length} ` +
      `visits=${result.visits} maxDepth=${result.maxDepth} (${dt}ms${timeoutTag}) ${tag}\n`,
    );
    if (result.maxDepth >= usefulMinDepth) {
      topologies.push({ ...result, grid, exitRow });
      if (result.maxDepth >= cfg.endPar) haveFullCoverage = true;
    }
    /* Early exit: once we have full coverage AND at least 2 topologies, stop. */
    if (haveFullCoverage && topologies.length >= 2) break;
  }
  // Sort by maxDepth descending so deeper topologies come first when picking.
  topologies.sort((a, b) => b.maxDepth - a.maxDepth);
  return { topologies, grid, exitRow };
}

/* ─── Main ─── */

console.log('Generating Rush Hour puzzle bank…\n');
const tStart = Date.now();
const bank = {
  version: 1,
  generatedAt: new Date().toISOString(),
  levels: {},
};

for (const tier of TIERS) {
  console.log(`\n─── Tier: ${tier} (par ${PAR_CURVE[tier].startPar}–${PAR_CURVE[tier].endPar}, grid ${PAR_CURVE[tier].grid}) ───`);
  const { topologies, grid, exitRow } = buildTopologiesForTier(tier);
  if (topologies.length === 0) {
    console.warn(`  ⚠ No usable topologies for tier "${tier}". Skipping — runtime fallback will cover it.`);
    continue;
  }

  bank.levels[tier] = [];
  for (let level = 1; level <= LEVELS_PER_TIER; level++) {
    const target = targetParFor(tier, level);
    const picked = pickAtDepth(topologies, target, level, tier);
    if (!picked) {
      console.warn(`  ⚠ ${tier} L${level}: no puzzle at depth ≈ ${target} — runtime fallback will cover it.`);
      continue;
    }
    const tag = picked.par === target ? '=' : (picked.par > target ? '+' : '-');
    console.log(
      `  ${tier.padEnd(7)} L${String(level).padStart(2)}  target=${String(target).padStart(2)} par=${String(picked.par).padStart(2)} ${tag}`,
    );
    bank.levels[tier].push({
      level, grid, exitRow, par: picked.par, pieces: picked.pieces,
    });
  }
}

/* ─── Final independent verification ─── */

console.log('\nVerifying every shipped puzzle with a fresh BFS…');
let okCount = 0;
const failures = [];
for (const tier of TIERS) {
  if (!bank.levels[tier]) continue;
  for (const p of bank.levels[tier]) {
    const r = bfsSolve(
      { pieces: p.pieces, grid: p.grid, exitRow: p.exitRow },
      { maxStatesExplored: 2_500_000 },
    );
    if (!r.solvable) {
      failures.push(`${tier}-${p.level}: NOT SOLVABLE`);
    } else if (r.minMoves !== p.par) {
      failures.push(`${tier}-${p.level}: par mismatch (declared ${p.par}, BFS ${r.minMoves})`);
    } else {
      okCount++;
    }
  }
}
if (failures.length) {
  console.error(`\n✗ Verification failed for ${failures.length} puzzles:`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`✓ All ${okCount} puzzles verified solvable with declared par.\n`);

/* ─── Challenge pool: hardest 30 puzzles (xhard L11–20 + all deadly). ─── */

/* Challenge pool: hardest available puzzles. Falls through tiers in order of
 * difficulty so we still ship a meaningful pool even if the deepest tier(s)
 * couldn't be generated. */
const challengeSources = [
  ...((bank.levels.deadly) || []),
  ...((bank.levels.xhard) || []).slice(10),
  ...((bank.levels.xhard) || []).slice(0, 10),
  ...((bank.levels.hard) || []).slice(10),
];
bank.challenge = challengeSources
  .slice(0, 30)
  .map((p) => ({ grid: p.grid, exitRow: p.exitRow, par: p.par, pieces: p.pieces }));

if (bank.challenge.length) {
  const cMin = Math.min(...bank.challenge.map((p) => p.par));
  const cMax = Math.max(...bank.challenge.map((p) => p.par));
  console.log(`Challenge pool: ${bank.challenge.length} puzzles, par ${cMin}–${cMax}\n`);
} else {
  console.warn('Challenge pool: empty — no usable hard-tier puzzles.\n');
}

/* ─── Write ─── */

fs.writeFileSync(OUT_PATH, JSON.stringify(bank));
const size = fs.statSync(OUT_PATH).size;
console.log(`Wrote ${OUT_PATH}`);
console.log(`Size: ${(size / 1024).toFixed(1)} KB`);
console.log(`Total time: ${((Date.now() - tStart) / 1000).toFixed(1)}s`);
