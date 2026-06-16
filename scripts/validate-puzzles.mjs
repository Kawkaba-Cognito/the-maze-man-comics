import { createServer } from 'vite';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

/** Independent Bridges solution counter (stops at 2) — verifies uniqueness. */
function countBridgesSolutions(st) {
  const { islands, edges, crossings } = st;
  const nIsl = islands.length;
  const needs = islands.map((i) => i.need);
  const E = edges.length;
  const incident = Array.from({ length: nIsl }, () => []);
  edges.forEach((e, i) => { incident[e.a].push(i); incident[e.b].push(i); });
  const val = new Int8Array(E).fill(-1);
  const sum = new Int16Array(nIsl);
  const rem = new Int16Array(nIsl);
  for (let k = 0; k < nIsl; k++) rem[k] = 2 * incident[k].length;
  const ok = (k) => sum[k] <= needs[k] && sum[k] + rem[k] >= needs[k];
  let count = 0;
  function connected() {
    const parent = [...Array(nIsl).keys()];
    const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    for (let i = 0; i < E; i++) if (val[i] > 0) parent[find(edges[i].a)] = find(edges[i].b);
    const root = find(0);
    for (let k = 1; k < nIsl; k++) if (find(k) !== root) return false;
    return true;
  }
  function rec(pos) {
    if (count >= 2) return;
    if (pos === E) { if (connected()) count++; return; }
    const { a, b } = edges[pos];
    for (let v = 0; v <= 2; v++) {
      if (v > 0) { let bad = false; for (const j of crossings[pos]) if (val[j] > 0) { bad = true; break; } if (bad) continue; }
      val[pos] = v; sum[a] += v; sum[b] += v; rem[a] -= 2; rem[b] -= 2;
      if (ok(a) && ok(b)) rec(pos + 1);
      sum[a] -= v; sum[b] -= v; rem[a] += 2; rem[b] += 2; val[pos] = -1;
    }
  }
  rec(0);
  return count;
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
  const bridges = await server.ssrLoadModule('/src/features/puzzles/games/bridges/bridgesEngine.js');
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
    assert(!hitori.isHitoriSolved({ ...p, player: Array.from({ length: size }, () => Array(size).fill(false)) }), `Hitori ${size}: empty board marked solved`);
  }

  for (const tier of [7, 9, 11, 13]) {
    const p = bridges.generateBridges(tier, 400 + tier);
    assert(p.islands.length >= bridges.TIERS[tier].minIslands, `Bridges ${tier}: too few islands`);
    // Clue numbers must equal the solution's incident bridge sums.
    const sums = p.islands.map(() => 0);
    p.edges.forEach((e, i) => { sums[e.a] += p.solution[i]; sums[e.b] += p.solution[i]; });
    assert(sums.every((v, k) => v === p.islands[k].need), `Bridges ${tier}: clue/solution mismatch`);
    // Applying the solution must register as solved; an empty board must not.
    assert(bridges.isBridgesSolved({ ...p, player: p.solution.slice() }), `Bridges ${tier}: solution rejected`);
    assert(!bridges.isBridgesSolved(p), `Bridges ${tier}: empty board marked solved`);
    // Solution must be unique (independent backtracking count, stop at 2).
    assert(countBridgesSolutions(p) === 1, `Bridges ${tier}: solution not unique`);
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
