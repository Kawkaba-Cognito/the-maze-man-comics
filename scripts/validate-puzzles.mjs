import { createServer } from 'vite';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

const server = await createServer({
  appType: 'custom',
  server: { middlewareMode: true },
  logLevel: 'error',
});

try {
  const sliding = await server.ssrLoadModule('/src/features/puzzles/games/sliding/slidingEngine.js');
  const takuzu = await server.ssrLoadModule('/src/features/puzzles/games/takuzu/takuzuEngine.js');
  const hitori = await server.ssrLoadModule('/src/features/puzzles/games/hitori/hitoriEngine.js');
  const maze = await server.ssrLoadModule('/src/features/puzzles/games/maze/mazeEngine.js');
  const sudoku = await server.ssrLoadModule('/src/features/puzzles/games/sudoku/sudokuEngine.js');
  const kenken = await server.ssrLoadModule('/src/features/puzzles/games/kenken/kenkenEngine.js');
  const nonogram = await server.ssrLoadModule('/src/features/puzzles/games/nonogram/nonogramEngine.js');
  const kakuro = await server.ssrLoadModule('/src/features/puzzles/games/kakuro/kakuroEngine.js');

  for (const size of [3, 4, 5, 6]) {
    const s = sliding.createSlidingPuzzle(size, 100 + size);
    assert(new Set(s.tiles).size === size * size, `Sliding ${size}: duplicate tiles`);
    assert(s.tiles.every((v) => v >= 0 && v < size * size), `Sliding ${size}: invalid tile`);
  }

  for (const size of [4, 6]) {
    const p = takuzu.generateTakuzu(size, 200 + size);
    assert(takuzu.isTakuzuComplete(p.solution, size), `Takuzu ${size}: generated solution invalid`);
    assert(takuzu.isTakuzuSolved({ ...p, player: cloneGrid(p.solution) }), `Takuzu ${size}: solved solution rejected`);
  }

  for (const size of [3, 4, 5, 6]) {
    const p = hitori.generateHitori(size, 300 + size);
    assert(hitori.isHitoriSolved({ ...p, player: cloneGrid(p.solution) }), `Hitori ${size}: solution rejected`);
    assert(!hitori.hitoriHasError({ ...p, player: Array.from({ length: size }, () => Array(size).fill(false)) }), `Hitori ${size}: empty board marked error`);
  }

  for (const tier of [3, 4, 5, 6]) {
    const p = maze.generateLogicMaze(tier, 400 + tier);
    const seen = new Set(['0,0']);
    const stack = [[0, 0]];
    let edgeCount = 0;
    while (stack.length) {
      const [r, c] = stack.pop();
      const ns = maze.cellNeighbors(p.wallGrid, p.size, r, c);
      edgeCount += ns.length;
      for (const [nr, nc] of ns) {
        const k = `${nr},${nc}`;
        if (!seen.has(k)) {
          seen.add(k);
          stack.push([nr, nc]);
        }
      }
    }
    assert(seen.size === p.size * p.size, `Maze ${tier}: not fully connected`);
    assert(edgeCount / 2 === p.size * p.size - 1, `Maze ${tier}: not a perfect maze`);
  }

  for (const size of [4, 6, 9]) {
    const p = sudoku.generateSudoku(size, 500 + size);
    assert(sudoku.isSudokuSolved({ ...p, player: cloneGrid(p.solution) }), `Sudoku ${size}: solution rejected`);
    assert(!sudoku.sudokuHasConflict({ ...p, player: cloneGrid(p.puzzle) }), `Sudoku ${size}: puzzle givens conflict`);
  }

  for (const size of [4, 5, 6]) {
    const p = kenken.generateKenKen(size, 600 + size);
    assert(kenken.isKenKenSolved({ ...p, player: cloneGrid(p.solution) }), `KenKen ${size}: solution rejected`);
    assert(!kenken.kenKenHasConflict({ ...p, player: Array.from({ length: size }, () => Array(size).fill(0)) }), `KenKen ${size}: empty board marked conflict`);
  }

  for (const size of [5, 10, 15]) {
    const p = nonogram.generateNonogram(size, 700 + size);
    assert(nonogram.nonogramLineCluesMatch({ ...p, player: cloneGrid(p.solution) }), `Nonogram ${size}: solution rejected`);
  }

  for (const size of [7, 9]) {
    const p = kakuro.generateKakuro(size, 800 + size);
    const solutionPlayer = p.board.map((row) => row.map((cell) => (cell.block ? null : cell.value)));
    assert(kakuro.isKakuroSolved({ ...p, player: solutionPlayer }), `Kakuro ${size}: solution rejected`);
    assert(!kakuro.kakuroHasConflict(p), `Kakuro ${size}: empty board marked conflict`);
  }

  console.log('All puzzle engine validations passed.');
} finally {
  await server.close();
}
