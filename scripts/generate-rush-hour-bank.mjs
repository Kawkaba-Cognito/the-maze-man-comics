#!/usr/bin/env node
/**
 * Rush Hour puzzle bank — Fogleman dataset + original ThinkFun bank
 *
 * Uses Michael Fogleman's complete enumeration (MIT license):
 *   - 476,118 interesting puzzles from exhaustive BFS of all possible boards
 *   - Every piece is essential to the solution
 *   - Puzzles are mathematically proven to be the hardest for their configuration
 *
 * Source: https://github.com/fogleman/rush (MIT)
 * Article: https://www.michaelfogleman.com/rush/
 */

import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../src/features/training/domains/reasoning/games/rush-hour/curated-levels.js');

/* ── Parse Fogleman 36-char board format ───────────────────────────── */
function parseFoglemanBoard(desc) {
  const grid = 6;
  const pieceMap = new Map();
  for (let i = 0; i < desc.length; i++) {
    const ch = desc[i];
    if (ch === 'o' || ch === '.' || ch === 'x') continue;
    if (!pieceMap.has(ch)) pieceMap.set(ch, []);
    pieceMap.get(ch).push({ row: Math.floor(i / grid), col: i % grid });
  }
  const pieces = [];
  const idMap = { A: 'hero' };
  let nextId = 0;
  for (const [letter, positions] of pieceMap) {
    positions.sort((a, b) => a.row - b.row || a.col - b.col);
    const first = positions[0], last = positions[positions.length - 1];
    const dir = first.row === last.row ? 'h' : 'v';
    const id = letter === 'A' ? 'hero' : String.fromCharCode(65 + (++nextId));
    const piece = { id, row: first.row, col: first.col, len: positions.length, dir };
    if (letter === 'A') piece.isHero = true;
    pieces.push(piece);
  }
  // Hero first
  const hero = pieces.find(p => p.isHero);
  const rest = pieces.filter(p => !p.isHero);
  return [hero, ...rest];
}

/* ── Fetch puzzles from Fogleman API ──────────────────────────────── */
async function fetchFogleman(target) {
  const puzzles = new Map();
  let attempts = 0;
  const max = target * 4;
  console.log(`  Fetching ~${target} puzzles from Fogleman API...`);

  while (puzzles.size < target && attempts < max) {
    try {
      const res = await fetch('https://www.michaelfogleman.com/rushserver/random.json');
      if (!res.ok) { attempts++; await sleep(300); continue; }
      const data = await res.json();

      // Skip puzzles with walls (our UI doesn't support them)
      if (data.desc.includes('x')) { attempts++; continue; }
      // Skip duplicates
      if (puzzles.has(data.desc)) { attempts++; continue; }

      const pieces = parseFoglemanBoard(data.desc);
      if (!pieces[0]?.isHero) { attempts++; continue; }

      const exitRow = pieces[0].row;
      puzzles.set(data.desc, {
        pieces,
        par: data.moves,
        pc: data.pieces,
        grid: 6,
        exitRow,
        states: data.states,
        desc: data.desc,
      });

      attempts++;
      if (puzzles.size % 25 === 0) {
        const pars = [...puzzles.values()].map(p => p.par).sort((a, b) => a - b);
        console.log(`    ${puzzles.size}/${target}  par range: ${pars[0]}–${pars[pars.length - 1]}`);
      }
      await sleep(40);
    } catch (e) {
      attempts++;
      await sleep(200);
    }
  }
  console.log(`  Got ${puzzles.size} unique wall-free puzzles in ${attempts} requests`);
  return [...puzzles.values()];
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ── Encoding ──────────────────────────────────────────────────────── */
function encode(puz) {
  const hero = puz.pieces.find(p => p.isHero);
  const rest = puz.pieces.filter(p => !p.isHero);
  const packed = [hero, ...rest].map(p => `${p.dir === 'h' ? 0 : 1}${p.len}${p.row}${p.col}`).join('');
  const grid = puz.grid || 6, exit = puz.exitRow ?? 2;
  return (grid !== 6 || exit !== 2) ? `${puz.par}.${grid}.${exit}|${packed}` : `${puz.par}|${packed}`;
}

/* ── Old-format converter (original ThinkFun bank) ─────────────────── */
const OLD_BP = [
  { dir:'h',len:2 },{ dir:'h',len:3 },{ dir:'v',len:2 },{ dir:'v',len:3 },
  { dir:'v',len:3 },{ dir:'v',len:2 },{ dir:'h',len:2 },{ dir:'h',len:2 },
  { dir:'v',len:2 },{ dir:'v',len:2 },{ dir:'h',len:2 },{ dir:'h',len:2 },
  { dir:'h',len:2 },
];
function convertOld(raw) {
  const [pr, pk] = raw.split('|');
  const pieces = OLD_BP.map((bp, i) => ({
    id: i === 0 ? 'hero' : String.fromCharCode(64 + i),
    dir: bp.dir, len: bp.len, row: Number(pk[i * 2]), col: Number(pk[i * 2 + 1]),
    ...(i === 0 ? { isHero: true } : {}),
  }));
  return { pieces, par: Number(pr), pc: 13, grid: 6, exitRow: 2 };
}

/* ── Main ──────────────────────────────────────────────────────────── */
async function main() {
  const t0 = Date.now();
  console.log('Rush Hour bank — Fogleman dataset edition\n');

  // 1. Import original ThinkFun bank from git
  console.log('─── Original ThinkFun bank ───');
  const origAll = [];
  try {
    const git = execSync('git show af0c442:src/features/training/domains/reasoning/games/rush-hour/curated-levels.js',
      { encoding: 'utf-8', cwd: resolve(__dirname, '..'), maxBuffer: 2 * 1024 * 1024 });
    let m; const re = /"(\d+\|[0-9]+)"/g;
    while ((m = re.exec(git)) !== null) { try { origAll.push(convertOld(m[1])); } catch {} }
  } catch (e) { console.error('  Git failed:', e.message); }
  origAll.sort((a, b) => a.par - b.par);
  console.log(`  ${origAll.length} entries (par ${origAll[0]?.par}–${origAll[origAll.length - 1]?.par})`);

  // 2. Fetch Fogleman puzzles
  console.log('\n─── Fogleman API ───');
  const fogleman = await fetchFogleman(350);
  fogleman.sort((a, b) => a.par - b.par);
  console.log(`  Par range: ${fogleman[0]?.par}–${fogleman[fogleman.length - 1]?.par}`);
  console.log(`  Piece counts: ${Math.min(...fogleman.map(p => p.pc))}–${Math.max(...fogleman.map(p => p.pc))}`);

  // 3. Build tiers
  console.log('\n─── Building tiers ───');

  // EASY: original bank entries par 3–16 (these are from proper enumeration, proven reasoning)
  const origEasy = origAll.filter(p => p.par >= 3 && p.par <= 16);
  const easy = [];
  if (origEasy.length >= 100) {
    const step = origEasy.length / 100;
    for (let i = 0; i < 100; i++) easy.push(origEasy[Math.floor(i * step)]);
  } else easy.push(...origEasy.slice(0, 100));

  // MEDIUM: Fogleman puzzles par 15–28 (varied piece configs, genuine reasoning)
  const fogMed = fogleman.filter(p => p.par >= 15 && p.par <= 28).sort((a, b) => a.par - b.par);
  const medium = [];
  if (fogMed.length >= 100) {
    const step = fogMed.length / 100;
    for (let i = 0; i < 100; i++) medium.push(fogMed[Math.floor(i * step)]);
  } else {
    medium.push(...fogMed);
    // Fill remaining from original bank par 17–30
    const origFill = origAll.filter(p => p.par >= 17 && p.par <= 30 && !medium.some(m => encode(m) === encode(p)));
    const need = 100 - medium.length;
    if (origFill.length >= need) {
      const step = origFill.length / need;
      for (let i = 0; i < need; i++) medium.push(origFill[Math.floor(i * step)]);
    } else medium.push(...origFill.slice(0, need));
  }
  medium.sort((a, b) => a.par - b.par);

  // HARD: Fogleman puzzles par 28+ AND original bank par 37–49
  const fogHard = fogleman.filter(p => p.par >= 28).sort((a, b) => a.par - b.par);
  const origHard = origAll.filter(p => p.par >= 37).sort((a, b) => a.par - b.par);
  const hard = [];

  // Merge: Fogleman hard + original expert, sorted by par
  const hardPool = [...fogHard, ...origHard];
  const hardSeen = new Set();
  const hardUniq = [];
  for (const p of hardPool) {
    const enc = encode(p);
    if (!hardSeen.has(enc)) { hardSeen.add(enc); hardUniq.push(p); }
  }
  hardUniq.sort((a, b) => a.par - b.par);

  if (hardUniq.length >= 100) {
    const step = hardUniq.length / 100;
    for (let i = 0; i < 100; i++) hard.push(hardUniq[Math.floor(i * step)]);
  } else {
    hard.push(...hardUniq);
    // Fill remaining from original bank par 30+
    const fill = origAll.filter(p => p.par >= 30 && !hard.some(h => encode(h) === encode(p)));
    hard.push(...fill.slice(0, 100 - hard.length));
  }
  hard.sort((a, b) => a.par - b.par);

  // 4. Stats
  for (const [name, tier] of [['Easy', easy], ['Medium', medium], ['Hard', hard]]) {
    if (!tier.length) { console.log(`  ${name}: 0 levels!`); continue; }
    const pars = tier.map(p => p.par), pcs = tier.map(p => p.pc);
    const fogCount = tier.filter(p => p.desc).length;
    console.log(`\n${name} (${tier.length} levels):`);
    console.log(`  Par: ${Math.min(...pars)}→${Math.max(...pars)}  avg ${(pars.reduce((a, b) => a + b) / pars.length).toFixed(1)}`);
    console.log(`  Pieces: ${Math.min(...pcs)}→${Math.max(...pcs)}`);
    console.log(`  Fogleman: ${fogCount}, Original bank: ${tier.length - fogCount}`);
    console.log(`  Lv1: par ${pars[0]}  Lv50: par ${pars[49] || '?'}  Lv100: par ${pars[99] || '?'}`);
  }

  // 5. Write output
  const fmt = arr => JSON.stringify(arr.map(p => encode(p)), null, 4).replace(/\n/g, '\n  ');

  const output = `import { RH_DIFF_KEYS, RH_LEVELS_PER_TIER } from './data-spec.js';

/**
 * Curated Rush Hour bank — sourced from:
 *   1. Michael Fogleman's complete enumeration (MIT, github.com/fogleman/rush)
 *      476,118 puzzles from exhaustive BFS of all possible 6×6 configurations.
 *      Every piece is essential. Every puzzle requires genuine reasoning.
 *   2. Original ThinkFun Puzzle #40 bank (public dataset)
 *
 * Format: "par[.grid.exitRow]|DLRCDLRC..."
 *   D=0(h)/1(v), L=length, R=row, C=col. Hero first.
 */
const BANK = {
  easy: ${fmt(easy)},
  medium: ${fmt(medium)},
  hard: ${fmt(hard)},
};

function decodeEntry(entry) {
  const pipe = entry.indexOf('|');
  const header = entry.slice(0, pipe);
  const packed = entry.slice(pipe + 1);
  let par, grid = 6, exitRow = 2;
  if (header.includes('.')) { const p = header.split('.'); par = Number(p[0]); grid = Number(p[1]); exitRow = Number(p[2]); }
  else par = Number(header);
  const pieces = [];
  for (let i = 0; i < packed.length; i += 4) {
    const dir = packed[i] === '0' ? 'h' : 'v';
    const len = Number(packed[i + 1]);
    const row = Number(packed[i + 2]);
    const col = Number(packed[i + 3]);
    const idx = Math.floor(i / 4);
    const id = idx === 0 ? 'hero' : String.fromCharCode(64 + idx);
    const piece = { id, row, col, len, dir };
    if (idx === 0) piece.isHero = true;
    pieces.push(piece);
  }
  return { grid, exitRow, pieces, par };
}

export function getCuratedRushHourLevel(diffKey, levelIndex) {
  if (!RH_DIFF_KEYS.includes(diffKey)) return null;
  const ix = Math.max(1, Math.min(RH_LEVELS_PER_TIER, levelIndex | 0)) - 1;
  const entry = BANK[diffKey]?.[ix];
  if (!entry) return null;
  return { labelKey: 'level', level: ix + 1, diff: diffKey, ...decodeEntry(entry) };
}

export function getCuratedRushHourFreeRound(stageIndex) {
  const s = Math.max(0, stageIndex | 0);
  const tierIx = Math.min(RH_DIFF_KEYS.length - 1, Math.floor(s / RH_LEVELS_PER_TIER));
  const diff = RH_DIFF_KEYS[tierIx];
  const lv = (s % RH_LEVELS_PER_TIER) + 1;
  const level = getCuratedRushHourLevel(diff, lv);
  return level ? { ...level, labelKey: 'free', freeStage: s, lv } : getCuratedRushHourLevel('easy', 1);
}

export function getCuratedRushHourChallenge(seed, cycleIndex = 0) {
  const s = (seed >>> 0) || 1;
  const c = Math.max(0, cycleIndex | 0);
  const tier = c <= 0 ? 'medium' : 'hard';
  const bank = BANK[tier];
  const ix = (s + c * 17) % bank.length;
  return { labelKey: 'challenge', seed: s, ...decodeEntry(bank[ix]) };
}

export function getAllCuratedRushHourLevels() {
  return RH_DIFF_KEYS.flatMap((diff) => BANK[diff].map((_, ix) => getCuratedRushHourLevel(diff, ix + 1)));
}
`;

  writeFileSync(OUT, output, 'utf-8');
  console.log(`\n✓ Written (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}

main();
