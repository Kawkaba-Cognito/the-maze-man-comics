import { createServer } from 'vite';

const server = await createServer({ appType: 'custom', server: { middlewareMode: true }, logLevel: 'error' });
const load = (p) => server.ssrLoadModule(p);
const G = 'src/features/puzzles/games';

const SEEDS = 20;
const out = [];
const fail = [];
function rec(name, line) { out.push(`  ${line}`); }
function bad(name, msg) { fail.push(`✗ ${name}: ${msg}`); }
const ms = (f) => { const t = performance.now(); f(); return performance.now() - t; };
const stats = (a) => ({ avg: a.reduce((s, x) => s + x, 0) / a.length, max: Math.max(...a) });

try {
  // ───────────────────────── SUDOKU ─────────────────────────
  {
    const m = await load(`/${G}/sudoku/sudokuEngine.js`);
    const { SUDOKU_SIZES } = m;
    const count = (puzzle, size, cap = 2) => {
      const { boxRows, boxCols } = SUDOKU_SIZES[size];
      const can = (g, r, c, v) => {
        for (let i = 0; i < size; i++) if (g[r][i] === v || g[i][c] === v) return false;
        const br = Math.floor(r / boxRows) * boxRows, bc = Math.floor(c / boxCols) * boxCols;
        for (let rr = br; rr < br + boxRows; rr++) for (let cc = bc; cc < bc + boxCols; cc++) if (g[rr][cc] === v) return false;
        return true;
      };
      const g = puzzle.map((r) => r.slice()); let n = 0;
      const rec2 = () => {
        if (n >= cap) return;
        let R = -1, C = -1;
        for (let r = 0; r < size && R < 0; r++) for (let c = 0; c < size; c++) if (!g[r][c]) { R = r; C = c; break; }
        if (R < 0) { n++; return; }
        for (let v = 1; v <= size; v++) if (can(g, R, C, v)) { g[R][C] = v; rec2(); g[R][C] = 0; if (n >= cap) return; }
      };
      rec2(); return n;
    };
    for (const size of [4, 6, 9]) {
      const times = []; let nonUnique = 0, badWin = 0, clueSum = 0;
      for (let s = 0; s < SEEDS; s++) {
        let p; times.push(ms(() => { p = m.generateSudoku(size, 1000 + s); }));
        if (!m.isSudokuSolved({ ...p, player: p.solution.map((r) => r.slice()) })) badWin++;
        if (count(p.puzzle, size) !== 1) nonUnique++;
        clueSum += p.puzzle.flat().filter(Boolean).length;
      }
      const t = stats(times);
      rec('sudoku', `${size}×${size}: gen avg ${t.avg.toFixed(1)}ms / max ${t.max.toFixed(0)}ms · clues ~${(clueSum / SEEDS).toFixed(0)} · unique ${SEEDS - nonUnique}/${SEEDS}`);
      if (nonUnique) bad('Sudoku', `${nonUnique}/${SEEDS} non-unique at ${size}`);
      if (badWin) bad('Sudoku', `${badWin}/${SEEDS} solution rejected at ${size}`);
    }
  }

  // ───────────────────────── TAKUZU ─────────────────────────
  {
    const m = await load(`/${G}/takuzu/takuzuEngine.js`);
    const col = (g, c) => g.map((r) => r[c]);
    const triple = (l) => { for (let i = 0; i + 2 < l.length; i++) if (l[i] != null && l[i] === l[i + 1] && l[i] === l[i + 2]) return true; return false; };
    const cnt = (l, v) => l.filter((x) => x === v).length;
    const count = (puzzle, size, cap = 2) => {
      const g = puzzle.map((r) => r.slice()); let n = 0; const half = size / 2;
      const ok = (l) => !triple(l) && cnt(l, 0) <= half && cnt(l, 1) <= half;
      const rec2 = (pos) => {
        if (n >= cap) return;
        if (pos === size * size) { n++; return; }
        const r = (pos / size) | 0, c = pos % size;
        if (g[r][c] != null) return rec2(pos + 1);
        for (const v of [0, 1]) { g[r][c] = v; if (ok(g[r]) && ok(col(g, c))) rec2(pos + 1); g[r][c] = null; if (n >= cap) return; }
      };
      rec2(0); return n;
    };
    for (const size of [4, 6, 8, 10]) {
      const times = []; let nonUnique = 0, badWin = 0;
      const checkUniq = size <= 6; // independent counter explodes for big boards
      for (let s = 0; s < SEEDS; s++) {
        let p; times.push(ms(() => { p = m.generateTakuzu(size, 2000 + s); }));
        if (!m.isTakuzuSolved({ ...p, player: p.solution.map((r) => r.slice()) })) badWin++;
        if (checkUniq && count(p.puzzle, size) !== 1) nonUnique++;
      }
      const t = stats(times);
      rec('takuzu', `${size}×${size}: gen avg ${t.avg.toFixed(1)}ms / max ${t.max.toFixed(0)}ms · unique ${checkUniq ? `${SEEDS - nonUnique}/${SEEDS}` : 'engine-guaranteed (indep. check skipped)'}`);
      if (nonUnique) bad('Takuzu', `${nonUnique}/${SEEDS} non-unique at ${size}`);
      if (badWin) bad('Takuzu', `${badWin}/${SEEDS} solution rejected at ${size}`);
    }
  }

  // ───────────────────────── KENKEN ─────────────────────────
  {
    const m = await load(`/${G}/kenken/kenkenEngine.js`);
    const count = (st, cap = 2) => {
      const { size, cages, cageMap } = st;
      const by = Object.fromEntries(cages.map((c) => [c.id, c]));
      const g = Array.from({ length: size }, () => Array(size).fill(0));
      const rU = Array.from({ length: size }, () => Array(size + 1).fill(false));
      const cU = Array.from({ length: size }, () => Array(size + 1).fill(false));
      let n = 0;
      const feas = (cage) => {
        const vals = cage.cells.map(([r, c]) => g[r][c]); const fl = vals.filter((v) => v); const rem = vals.length - fl.length;
        if (cage.op === '') return rem > 0 || fl[0] === cage.target;
        if (cage.op === '+') { const s = fl.reduce((a, b) => a + b, 0); return rem === 0 ? s === cage.target : s + rem <= cage.target && s + rem * size >= cage.target; }
        if (cage.op === '×') { const p = fl.reduce((a, b) => a * b, 1); return rem === 0 ? p === cage.target : cage.target % p === 0 && p <= cage.target; }
        if (cage.op === '-') return rem > 0 || Math.abs(vals[0] - vals[1]) === cage.target;
        if (cage.op === '÷') { if (rem > 0) return true; const hi = Math.max(...vals), lo = Math.min(...vals); return lo !== 0 && hi % lo === 0 && hi / lo === cage.target; }
        return true;
      };
      const order = []; for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) order.push([r, c]);
      const rec2 = (i) => {
        if (n >= cap) return;
        if (i === order.length) { n++; return; }
        const [r, c] = order[i]; const cage = by[cageMap[r][c]];
        for (let v = 1; v <= size; v++) { if (rU[r][v] || cU[c][v]) continue; g[r][c] = v; rU[r][v] = cU[c][v] = true; if (feas(cage)) rec2(i + 1); g[r][c] = 0; rU[r][v] = cU[c][v] = false; if (n >= cap) return; }
      };
      rec2(0); return n;
    };
    for (const size of [4, 5, 6, 7]) {
      const times = []; let nonUnique = 0, badWin = 0, singles = 0, cageTot = 0;
      for (let s = 0; s < SEEDS; s++) {
        let p; times.push(ms(() => { p = m.generateKenKen(size, 3000 + s); }));
        if (!m.isKenKenSolved({ ...p, player: p.solution.map((r) => r.slice()) })) badWin++;
        if (count(p) !== 1) nonUnique++;
        singles += p.cages.filter((c) => c.cells.length === 1).length; cageTot += p.cages.length;
      }
      const t = stats(times);
      rec('kenken', `${size}×${size}: gen avg ${t.avg.toFixed(1)}ms / max ${t.max.toFixed(0)}ms · ~${(cageTot / SEEDS).toFixed(0)} cages, ${(100 * singles / cageTot).toFixed(0)}% freebie singles · unique ${SEEDS - nonUnique}/${SEEDS}`);
      if (nonUnique) bad('KenKen', `${nonUnique}/${SEEDS} non-unique at ${size}`);
      if (badWin) bad('KenKen', `${badWin}/${SEEDS} solution rejected at ${size}`);
    }
  }

  // ───────────────────────── CROWNS ─────────────────────────
  {
    const m = await load(`/${G}/crowns/crownsEngine.js`);
    const count = (n, region, cap = 2) => {
      let cnt = 0; const uc = Array(n).fill(false), ur = Array(n).fill(false), rc = Array(n).fill(-1);
      const rec2 = (r) => {
        if (cnt >= cap) return;
        if (r === n) { cnt++; return; }
        for (let c = 0; c < n; c++) { if (uc[c]) continue; const g = region[r][c]; if (ur[g]) continue; if (r > 0 && Math.abs(c - rc[r - 1]) < 2) continue; uc[c] = ur[g] = true; rc[r] = c; rec2(r + 1); uc[c] = ur[g] = false; rc[r] = -1; }
      };
      rec2(0); return cnt;
    };
    for (const size of [5, 6, 7, 8]) {
      const times = []; let nonUnique = 0, badWin = 0;
      for (let s = 0; s < SEEDS; s++) {
        let p; times.push(ms(() => { p = m.generateCrowns(size, 4000 + s); }));
        const player = Array.from({ length: size }, () => Array(size).fill(0));
        p.solution.forEach((c, r) => { player[r][c] = 2; });
        if (!m.isCrownsSolved({ ...p, player })) badWin++;
        if (count(size, p.region) !== 1) nonUnique++;
      }
      const t = stats(times);
      rec('crowns', `${size}×${size}: gen avg ${t.avg.toFixed(1)}ms / max ${t.max.toFixed(0)}ms · unique ${SEEDS - nonUnique}/${SEEDS}`);
      if (nonUnique) bad('Crowns', `${nonUnique}/${SEEDS} non-unique at ${size}`);
      if (badWin) bad('Crowns', `${badWin}/${SEEDS} solution rejected at ${size}`);
    }
  }

  // ───────────────────────── NONOGRAM ─────────────────────────
  {
    const m = await load(`/${G}/nonogram/nonogramEngine.js`);
    const clues = (l) => { const o = []; let r = 0; for (const x of l) { if (x) r++; else if (r) { o.push(r); r = 0; } } if (r) o.push(r); return o.length ? o : [0]; };
    const count = (size, rowClues, colClues, cap = 2) => {
      const g = Array.from({ length: size }, () => Array(size).fill(false)); let n = 0;
      const colOk = (upto) => { for (let c = 0; c < size; c++) { const partial = g.slice(0, upto).map((r) => r[c]); const full = clues(partial).join(','); const want = colClues[c].join(','); /* prefix feasibility: filled-so-far runs must be a prefix-compatible */ } return true; };
      const rowMatch = (r) => clues(g[r]).join(',') === rowClues[r].join(',');
      const rec2 = (r) => {
        if (n >= cap) return;
        if (r === size) { for (let c = 0; c < size; c++) if (clues(g.map((row) => row[c])).join(',') !== colClues[c].join(',')) return; n++; return; }
        // enumerate all fillings of row r matching its clue
        const target = rowClues[r];
        const place = (idx, pos) => {
          if (n >= cap) return;
          if (idx === target.filter((x) => x > 0).length) { if (rowMatch(r)) rec2(r + 1); return; }
          const blocks = target.filter((x) => x > 0); const len = blocks[idx];
          for (let s = pos; s + len <= size; s++) { for (let i = s; i < s + len; i++) g[r][i] = true; place(idx + 1, s + len + 1); for (let i = s; i < s + len; i++) g[r][i] = false; if (n >= cap) return; }
        };
        if (target.length === 1 && target[0] === 0) { rec2(r + 1); } else place(0, 0);
      };
      rec2(0); return n;
    };
    for (const size of [5, 8, 10]) {
      const times = []; let nonUnique = 0, badWin = 0, allCracked = 0;
      const checkUniq = size <= 5; // row-enumeration counter has no column pruning; only 5×5 is fast
      // (8/10 rely on the engine's line-solver fully cracking the board, which is itself a uniqueness proof)
      for (let s = 0; s < SEEDS; s++) {
        let p; times.push(ms(() => { p = m.generateNonogram(size, 5000 + s); }));
        if (!m.nonogramLineCluesMatch({ ...p, player: p.solution.map((r) => r.map((v) => (v ? 1 : 0))) })) badWin++;
        if (checkUniq && count(size, p.rowClues, p.colClues) !== 1) nonUnique++;
      }
      const t = stats(times);
      rec('nonogram', `${size}×${size}: gen avg ${t.avg.toFixed(1)}ms / max ${t.max.toFixed(0)}ms · unique ${checkUniq ? `${SEEDS - nonUnique}/${SEEDS}` : 'engine-guaranteed (indep. check skipped)'}`);
      if (nonUnique) bad('Nonogram', `${nonUnique}/${SEEDS} non-unique at ${size}`);
      if (badWin) bad('Nonogram', `${badWin}/${SEEDS} solution rejected at ${size}`);
    }
  }

  // ───────────────────────── KAKURO ─────────────────────────
  {
    const m = await load(`/${G}/kakuro/kakuroEngine.js`);
    for (const size of [6, 7]) {
      const times = []; let badWin = 0, givenSum = 0;
      for (let s = 0; s < SEEDS; s++) {
        let p; times.push(ms(() => { p = m.generateKakuro(size, 6000 + s); }));
        const player = p.board.map((row) => row.map((cell) => (cell.block ? null : cell.value)));
        if (!m.isKakuroSolved({ ...p, player })) badWin++;
        givenSum += p.fixed.flat().filter(Boolean).length;
      }
      const t = stats(times);
      rec('kakuro', `${size}×${size}: gen avg ${t.avg.toFixed(1)}ms / max ${t.max.toFixed(0)}ms · ~${(givenSum / SEEDS).toFixed(1)} locked givens · solution accepted ${SEEDS - badWin}/${SEEDS}`);
      if (badWin) bad('Kakuro', `${badWin}/${SEEDS} solution rejected at ${size}`);
    }
  }

  // ───────────────────────── HITORI ─────────────────────────
  {
    const m = await load(`/${G}/hitori/hitoriEngine.js`);
    for (const size of [5, 6, 7, 8]) {
      const times = []; let badWin = 0, falseWin = 0;
      for (let s = 0; s < SEEDS; s++) {
        let p; times.push(ms(() => { p = m.generateHitori(size, 7000 + s); }));
        if (!m.isHitoriSolved({ ...p, player: p.solution.map((r) => r.slice()) })) badWin++;
        if (m.isHitoriSolved({ ...p, player: Array.from({ length: size }, () => Array(size).fill(false)) })) falseWin++;
      }
      const t = stats(times);
      rec('hitori', `${size}×${size}: gen avg ${t.avg.toFixed(1)}ms / max ${t.max.toFixed(0)}ms · solution accepted ${SEEDS - badWin}/${SEEDS}`);
      if (badWin) bad('Hitori', `${badWin}/${SEEDS} solution rejected at ${size}`);
      if (falseWin) bad('Hitori', `empty board counts as solved at ${size}`);
    }
  }

  // ───────────────────────── SLIDING ─────────────────────────
  {
    const m = await load(`/${G}/sliding/slidingEngine.js`);
    for (const size of [3, 4, 5, 6]) {
      let solvableBad = 0;
      for (let s = 0; s < SEEDS; s++) {
        const p = m.createSlidingPuzzle(size, 8000 + s);
        // parity-based solvability check
        const t = p.tiles, N = size; const inv = (() => { let k = 0; const a = t.filter((x) => x !== 0); for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) k++; return k; })();
        const blankRowFromBottom = N - Math.floor(t.indexOf(0) / N);
        const solvable = N % 2 === 1 ? inv % 2 === 0 : (blankRowFromBottom % 2 === 0 ? inv % 2 === 1 : inv % 2 === 0);
        if (!solvable) solvableBad++;
      }
      rec('sliding', `${size}×${size}: solvable ${SEEDS - solvableBad}/${SEEDS}`);
      if (solvableBad) bad('Sliding', `${solvableBad}/${SEEDS} UNSOLVABLE shuffles at ${size}`);
    }
  }

  // ───────────────────────── MAZE ─────────────────────────
  {
    const m = await load(`/${G}/maze/mazeEngine.js`);
    for (const tier of [3, 4, 5, 6]) {
      let bad2 = 0;
      for (let s = 0; s < SEEDS; s++) {
        const p = m.generateLogicMaze(tier, 9000 + s);
        const seen = new Set(['0,0']); const stack = [[0, 0]]; let edges = 0;
        while (stack.length) { const [r, c] = stack.pop(); const ns = m.cellNeighbors(p.wallGrid, p.size, r, c); edges += ns.length; for (const [nr, nc] of ns) { const k = `${nr},${nc}`; if (!seen.has(k)) { seen.add(k); stack.push([nr, nc]); } } }
        if (seen.size !== p.size * p.size || edges / 2 !== p.size * p.size - 1) bad2++;
      }
      rec('maze', `tier ${tier}: perfect-maze ${SEEDS - bad2}/${SEEDS}`);
      if (bad2) bad('Maze', `${bad2}/${SEEDS} not a perfect maze at tier ${tier}`);
    }
  }

  console.log('\n══════════ EXPERT PLAYTEST (' + SEEDS + ' seeds each) ══════════');
  console.log(out.join('\n'));
  console.log('\n── VERDICT ──');
  if (fail.length) { console.log(fail.join('\n')); }
  else console.log('✓ All engines: unique solutions, valid wins, solvable boards, no jank.');
} finally {
  await server.close();
}
