#!/usr/bin/env node
/**
 * Verify every puzzle in the Rush Hour bank is solvable with correct par.
 * Runs BFS on ALL 300 puzzles and reports mismatches.
 */

import { getCuratedRushHourLevel } from '../src/features/training/domains/reasoning/games/rush-hour/curated-levels.js';

const GRID_G = [6]; // track per puzzle

function clone(p) { return p.map(x => ({ ...x })); }
function occ(pieces, skip, grid) {
  const g = Array.from({ length: grid }, () => Array(grid).fill(null));
  for (const p of pieces) { if (p.id === skip) continue; for (let i = 0; i < p.len; i++) { const r = p.dir === 'v' ? p.row + i : p.row, c = p.dir === 'h' ? p.col + i : p.col; if (r >= 0 && r < grid && c >= 0 && c < grid) g[r][c] = p.id; } }
  return g;
}
function range(piece, pieces, grid) {
  const o = occ(pieces, piece.id, grid);
  if (piece.dir === 'h') { let lo = piece.col, hi = piece.col; while (lo > 0 && o[piece.row][lo - 1] === null) lo--; while (hi + piece.len < grid && o[piece.row][hi + piece.len] === null) hi++; return { lo, hi }; }
  let lo = piece.row, hi = piece.row; while (lo > 0 && o[lo - 1][piece.col] === null) lo--; while (hi + piece.len < grid && o[hi + piece.len][piece.col] === null) hi++; return { lo, hi };
}
function won(pieces, grid, er) { const h = pieces.find(p => p.isHero); return h && h.dir === 'h' && h.row === er && h.col + h.len >= grid; }
function skey(pieces) { return pieces.slice().sort((a, b) => a.id.localeCompare(b.id)).map(p => `${p.row},${p.col}`).join('|'); }
function nbrs(pieces, grid) {
  const out = [];
  for (const p of pieces) { const { lo, hi } = range(p, pieces, grid); if (p.dir === 'h') for (let c = lo; c <= hi; c++) { if (c !== p.col) out.push(pieces.map(x => x.id === p.id ? { ...x, col: c } : x)); } else for (let r = lo; r <= hi; r++) { if (r !== p.row) out.push(pieces.map(x => x.id === p.id ? { ...x, row: r } : x)); } }
  return out;
}
function bfs(pieces, grid, er, cap = 1_500_000) {
  if (won(pieces, grid, er)) return { ok: true, par: 0 };
  const dist = new Map([[skey(pieces), 0]]);
  const q = [clone(pieces)]; let head = 0, ex = 0;
  while (head < q.length) {
    if (++ex > cap) return { ok: false, reason: 'cap', ex };
    const cur = q[head++]; const d = dist.get(skey(cur));
    if (d === undefined) continue;
    for (const n of nbrs(cur, grid)) {
      if (won(n, grid, er)) return { ok: true, par: d + 1, ex };
      const k = skey(n); if (!dist.has(k)) { dist.set(k, d + 1); q.push(n); }
    }
  }
  return { ok: false, reason: 'exhausted', ex };
}

function checkOverlap(pieces, grid) {
  const g = Array.from({ length: grid }, () => Array(grid).fill(null));
  for (const p of pieces) {
    for (let i = 0; i < p.len; i++) {
      const r = p.dir === 'v' ? p.row + i : p.row;
      const c = p.dir === 'h' ? p.col + i : p.col;
      if (r < 0 || r >= grid || c < 0 || c >= grid) return `${p.id} out of bounds at (${r},${c})`;
      if (g[r][c]) return `${p.id} overlaps ${g[r][c]} at (${r},${c})`;
      g[r][c] = p.id;
    }
  }
  return null;
}

const diffs = ['easy', 'medium', 'hard'];
let total = 0, pass = 0, fail = 0, mismatch = 0;

for (const diff of diffs) {
  console.log(`\n─── ${diff.toUpperCase()} ───`);
  for (let lv = 1; lv <= 100; lv++) {
    total++;
    const level = getCuratedRushHourLevel(diff, lv);
    if (!level) { console.log(`  Lv${lv}: MISSING`); fail++; continue; }

    const { pieces, par, grid, exitRow } = level;

    // Check overlaps
    const overlap = checkOverlap(pieces, grid);
    if (overlap) { console.log(`  Lv${lv}: OVERLAP — ${overlap}`); fail++; continue; }

    // Check hero exists
    const hero = pieces.find(p => p.isHero);
    if (!hero) { console.log(`  Lv${lv}: NO HERO`); fail++; continue; }

    // BFS verify
    const result = bfs(pieces, grid, exitRow);
    if (!result.ok) {
      console.log(`  Lv${lv}: UNSOLVABLE (par=${par}, ${pieces.length}pc, ${grid}×${grid}) — ${result.reason} after ${result.ex} states`);
      fail++;
    } else if (result.par !== par) {
      console.log(`  Lv${lv}: PAR MISMATCH — claimed ${par}, BFS says ${result.par} (${pieces.length}pc)`);
      mismatch++;
      pass++;
    } else {
      pass++;
    }

    if (lv % 25 === 0) process.stdout.write(`  ...${lv}/100 verified\n`);
  }
}

console.log(`\n═══ SUMMARY ═══`);
console.log(`Total: ${total}  Pass: ${pass}  Fail: ${fail}  Par mismatch: ${mismatch}`);
if (fail === 0 && mismatch === 0) console.log('✓ ALL PUZZLES VERIFIED — solvable with correct par');
else if (fail === 0) console.log('⚠ All solvable but some par values differ (Fogleman uses different move counting?)');
else console.log('✗ FAILURES DETECTED — some puzzles are broken');
