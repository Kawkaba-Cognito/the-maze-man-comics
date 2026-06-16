import { createServer } from 'vite';
const server = await createServer({ appType: 'custom', server: { middlewareMode: true }, logLevel: 'error' });
let fail = 0;
const ck = (c, m) => { if (!c) { fail++; console.error('FAIL:', m); } };

try {
  const L = (p) => server.ssrLoadModule(p);
  const kenken = await L('/src/features/puzzles/games/kenken/kenkenEngine.js');
  const kakuro = await L('/src/features/puzzles/games/kakuro/kakuroEngine.js');
  const sliding = await L('/src/features/puzzles/games/sliding/slidingEngine.js');
  const sudoku = await L('/src/features/puzzles/games/sudoku/sudokuEngine.js');

  // ---- Sudoku: clue-count varies within a size, stays unique ----
  console.log('\n== Sudoku (difficulty variance) ==');
  for (const size of [4, 6, 9]) {
    const counts = new Set();
    let n = 12;
    for (let s = 0; s < n; s++) {
      const p = sudoku.generateSudoku(size, 500 + size * 11 + s);
      ck(sudoku.isSudokuSolved({ ...p, player: p.solution.map(r => r.slice()) }), `Sudoku ${size}#${s} solution rejected`);
      counts.add(p.puzzle.flat().filter(Boolean).length);
    }
    const arr = [...counts].sort((a, b) => a - b);
    console.log(`size ${size}: distinct given-counts across ${n} boards = [${arr.join(', ')}]`);
    ck(counts.size >= 2, `Sudoku ${size}: clue count did not vary (${arr.join(',')})`);
  }

  // ---- KenKen: difficulty consistency (freebie count capped) ----
  console.log('\n== KenKen ==');
  for (const size of [4, 5, 6, 7]) {
    let maxF = 0, sum = 0, n = 10; let t0 = Date.now();
    for (let s = 0; s < n; s++) {
      const p = kenken.generateKenKen(size, 700 + size * 13 + s);
      ck(kenken.isKenKenSolved({ ...p, player: p.solution.map(r => r.slice()) }), `KenKen ${size}#${s} solution rejected`);
      const free = p.cages.filter(c => c.cells.length === 1).length;
      maxF = Math.max(maxF, free); sum += free;
    }
    const dt = Date.now() - t0;
    const cap = Math.max(1, Math.round(size * 0.6));
    console.log(`size ${size}: avg freebies ${(sum / n).toFixed(1)}, max ${maxF} (cap ${cap}); ${(dt / n).toFixed(0)}ms/board`);
    ck(maxF <= cap + 1, `KenKen ${size}: freebies ${maxF} exceed cap ${cap}`);
  }

  // ---- Kakuro: density + solvable + given count ----
  console.log('\n== Kakuro ==');
  for (const size of [6, 7]) {
    let whiteSum = 0, givenMax = 0, n = 10; let t0 = Date.now();
    for (let s = 0; s < n; s++) {
      const p = kakuro.generateKakuro(size, 800 + size * 7 + s);
      let white = 0;
      for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!p.board[r][c].block) white++;
      whiteSum += white;
      const givens = p.fixed.flat().filter(Boolean).length;
      givenMax = Math.max(givenMax, givens);
      // solution check: fill all white cells with engine solution? reconstruct from board.value
      const solPlayer = p.board.map(row => row.map(cell => cell.block ? null : cell.value));
      ck(kakuro.isKakuroSolved({ ...p, player: solPlayer }), `Kakuro ${size}#${s} solution rejected`);
    }
    const dt = Date.now() - t0;
    console.log(`size ${size}: avg white ${(whiteSum / n).toFixed(1)}/${size * size}, max givens ${givenMax}; ${(dt / n).toFixed(0)}ms/board`);
    ck(whiteSum / n >= (size === 6 ? 13 : 16), `Kakuro ${size}: too sparse (avg white ${(whiteSum / n).toFixed(1)})`);
  }

  // ---- Sliding: hint must drive to solved (no cycling) ----
  console.log('\n== Sliding (solve-by-hint) ==');
  for (const size of [3, 4]) {
    let solvedCount = 0, movesSum = 0, n = 12; let t0 = Date.now();
    for (let s = 0; s < n; s++) {
      let st = sliding.createSlidingPuzzle(size, 900 + size * 17 + s);
      let moves = 0;
      const cap = size * size * 60;
      while (!sliding.isSlidingSolved(st) && moves < cap) {
        const { next, revealed } = sliding.hintReveal(st);
        if (!revealed || next === st) break;
        st = next; moves++;
      }
      if (sliding.isSlidingSolved(st)) { solvedCount++; movesSum += moves; }
    }
    const dt = Date.now() - t0;
    console.log(`size ${size}: solved-by-hint ${solvedCount}/${n}, avg ${solvedCount ? (movesSum / solvedCount).toFixed(0) : '-'} moves; ${(dt / n).toFixed(0)}ms/run`);
    if (size <= 4) ck(solvedCount === n, `Sliding ${size}: only ${solvedCount}/${n} solved by hint (cycling?)`);
  }

  console.log(fail === 0 ? '\nAll fix checks passed.' : `\n${fail} check(s) FAILED.`);
} finally {
  await server.close();
}
process.exit(fail === 0 ? 0 : 1);
