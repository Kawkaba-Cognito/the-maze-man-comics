#!/usr/bin/env node
import { getCuratedRushHourLevel } from '../src/features/training/domains/reasoning/games/rush-hour/curated-levels.js';

const level = getCuratedRushHourLevel('hard', 1);
console.log('Hard Level 1:');
console.log(`  Grid: ${level.grid}×${level.grid}, Exit row: ${level.exitRow}, Par: ${level.par}`);
console.log(`  Pieces (${level.pieces.length}):`);
for (const p of level.pieces) {
  const cells = [];
  for (let i = 0; i < p.len; i++) {
    const r = p.dir === 'v' ? p.row + i : p.row;
    const c = p.dir === 'h' ? p.col + i : p.col;
    cells.push(`(${r},${c})`);
  }
  console.log(`    ${p.id.padEnd(5)} ${p.dir} len=${p.len} at ${cells.join(' ')}${p.isHero ? ' ← HERO' : ''}`);
}

// Draw the board
const grid = Array.from({ length: level.grid }, () => Array(level.grid).fill('.'));
for (const p of level.pieces) {
  for (let i = 0; i < p.len; i++) {
    const r = p.dir === 'v' ? p.row + i : p.row;
    const c = p.dir === 'h' ? p.col + i : p.col;
    grid[r][c] = p.isHero ? '★' : p.id[0];
  }
}
console.log('\n  Board:');
for (let r = 0; r < level.grid; r++) {
  const row = grid[r].join(' ');
  const exit = r === level.exitRow ? ' → EXIT' : '';
  console.log(`    ${row}${exit}`);
}

// BFS with solution path
function clone(p) { return p.map(x => ({ ...x })); }
function occ(pieces, skip) {
  const g = Array.from({ length: level.grid }, () => Array(level.grid).fill(null));
  for (const p of pieces) { if (p.id === skip) continue; for (let i = 0; i < p.len; i++) { const r = p.dir === 'v' ? p.row + i : p.row, c = p.dir === 'h' ? p.col + i : p.col; if (r >= 0 && r < level.grid && c >= 0 && c < level.grid) g[r][c] = p.id; } }
  return g;
}
function getRange(piece, pieces) {
  const o = occ(pieces, piece.id);
  if (piece.dir === 'h') { let lo = piece.col, hi = piece.col; while (lo > 0 && o[piece.row][lo - 1] === null) lo--; while (hi + piece.len < level.grid && o[piece.row][hi + piece.len] === null) hi++; return { lo, hi }; }
  let lo = piece.row, hi = piece.row; while (lo > 0 && o[lo - 1][piece.col] === null) lo--; while (hi + piece.len < level.grid && o[hi + piece.len][piece.col] === null) hi++; return { lo, hi };
}
function isWon(pieces) { const h = pieces.find(p => p.isHero); return h && h.dir === 'h' && h.row === level.exitRow && h.col + h.len >= level.grid; }
function skey(pieces) { return pieces.slice().sort((a, b) => a.id.localeCompare(b.id)).map(p => `${p.row},${p.col}`).join('|'); }

const dist = new Map();
const parent = new Map();
const startKey = skey(level.pieces);
dist.set(startKey, 0);
parent.set(startKey, null);
const q = [clone(level.pieces)];
let head = 0, solution = null;

while (head < q.length && !solution) {
  const cur = q[head++];
  const curKey = skey(cur);
  const d = dist.get(curKey);
  for (const p of cur) {
    const { lo, hi } = getRange(p, cur);
    const positions = p.dir === 'h'
      ? Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter(c => c !== p.col)
      : Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter(r => r !== p.row);
    for (const pos of positions) {
      const nxt = cur.map(x => x.id === p.id ? { ...x, [p.dir === 'h' ? 'col' : 'row']: pos } : x);
      if (isWon(nxt)) {
        console.log(`\n  ✓ SOLVABLE in ${d + 1} moves (BFS explored ${dist.size} states)`);
        // Trace back
        const moveDesc = `Move ${p.id} ${p.dir === 'h' ? (pos > p.col ? 'right' : 'left') : (pos > p.row ? 'down' : 'up')}`;
        console.log(`  Final move: ${moveDesc}`);
        solution = true;
        break;
      }
      const k = skey(nxt);
      if (!dist.has(k)) { dist.set(k, d + 1); q.push(nxt); }
    }
    if (solution) break;
  }
}
if (!solution) console.log('\n  ✗ NOT SOLVABLE within search budget');

// Also check: how many pieces block the hero's direct path?
const hero = level.pieces.find(p => p.isHero);
const heroFront = hero.col + hero.len;
const directBlockers = [];
for (const p of level.pieces) {
  if (p.isHero) continue;
  for (let i = 0; i < p.len; i++) {
    const r = p.dir === 'v' ? p.row + i : p.row;
    const c = p.dir === 'h' ? p.col + i : p.col;
    if (r === level.exitRow && c >= heroFront && c < level.grid) {
      directBlockers.push(p.id);
      break;
    }
  }
}
console.log(`  Direct blockers in hero's path: ${directBlockers.length} (${directBlockers.join(', ')})`);
