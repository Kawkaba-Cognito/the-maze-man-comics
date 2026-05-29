import { createRng, shuffle } from '../../shared/rng';

/* A pool of block layouts per size — one is chosen at random each game so the
 * board differs structurally, not just in its numbers. '#' = block, '.' = white. */
const PATTERNS = {
  6: [
    ['######', '#..#.#', '#..#.#', '#.#..#', '#.#..#', '######'],
    ['######', '#.##.#', '#....#', '#....#', '#.##.#', '######'],
    ['######', '#..#.#', '#...##', '##...#', '#.#..#', '######'],
    ['######', '#.#.##', '#.#..#', '##..#.', '#..#.#', '######'],
  ],
  7: [
    ['#######', '#..#..#', '#..#..#', '###.###', '#..#..#', '#..#..#', '#######'],
    ['#######', '#..#..#', '#..#..#', '#.#.#.#', '#..#..#', '#..#..#', '#######'],
    ['#######', '#..#..#', '#...#.#', '##...##', '#.#...#', '#..#..#', '#######'],
  ],
};

function emptyBoard(size, rng) {
  const pool = PATTERNS[size];
  const pattern = pool[Math.floor(rng() * pool.length)];
  return pattern.map((row) =>
    row.split('').map((ch) => ({ block: ch === '#', value: 0, across: null, down: null }))
  );
}

function collectRuns(board, size, dr, dc) {
  const runs = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!board[r][c].block) continue;
      const cells = [];
      let rr = r + dr;
      let cc = c + dc;
      while (rr >= 0 && rr < size && cc >= 0 && cc < size && !board[rr][cc].block) {
        cells.push([rr, cc]);
        rr += dr;
        cc += dc;
      }
      if (cells.length >= 2) runs.push({ clueCell: [r, c], cells, sum: 0 });
    }
  }
  return runs;
}

function removeUncluedCells(board, size) {
  let changed = true;
  while (changed) {
    changed = false;
    const runs = [...collectRuns(board, size, 0, 1), ...collectRuns(board, size, 1, 0)];
    const covered = new Set(runs.flatMap((run) => run.cells.map(([r, c]) => `${r},${c}`)));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!board[r][c].block && !covered.has(`${r},${c}`)) {
          board[r][c].block = true;
          changed = true;
        }
      }
    }
  }
}

function fillValues(board, size, rng) {
  removeUncluedCells(board, size);
  const across = collectRuns(board, size, 0, 1);
  const down = collectRuns(board, size, 1, 0);
  const runsByCell = new Map();
  [...across, ...down].forEach((run) => {
    run.cells.forEach(([r, c]) => {
      const k = `${r},${c}`;
      if (!runsByCell.has(k)) runsByCell.set(k, []);
      runsByCell.get(k).push(run);
    });
  });

  const cells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) if (!board[r][c].block) cells.push([r, c]);
  }
  const ordered = shuffle(cells, rng).sort((a, b) => (runsByCell.get(`${b[0]},${b[1]}`)?.length ?? 0) - (runsByCell.get(`${a[0]},${a[1]}`)?.length ?? 0));

  function validInRuns(r, c, value) {
    for (const run of runsByCell.get(`${r},${c}`) ?? []) {
      const vals = run.cells.map(([rr, cc]) => (rr === r && cc === c ? value : board[rr][cc].value));
      const nonzero = vals.filter(Boolean);
      if (new Set(nonzero).size !== nonzero.length) return false;
    }
    return true;
  }

  function solve(i = 0) {
    if (i === ordered.length) return true;
    const [r, c] = ordered[i];
    for (const value of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng)) {
      if (!validInRuns(r, c, value)) continue;
      board[r][c].value = value;
      if (solve(i + 1)) return true;
      board[r][c].value = 0;
    }
    return false;
  }

  if (!solve()) return null;
  across.forEach((run) => {
    run.sum = run.cells.reduce((s, [r, c]) => s + board[r][c].value, 0);
    const [r, c] = run.clueCell;
    board[r][c].across = run.sum;
  });
  down.forEach((run) => {
    run.sum = run.cells.reduce((s, [r, c]) => s + board[r][c].value, 0);
    const [r, c] = run.clueCell;
    board[r][c].down = run.sum;
  });
  return { across, down };
}

/**
 * Count fillings consistent with the clue sums (each run: distinct digits that
 * total its sum), capped at `cap`. Returns -1 if the node budget is exceeded.
 */
/**
 * Find up to `cap` fillings consistent with the clue sums AND the locked
 * `givens` ({ "r,c": value }). Returns the solution grids, or null on budget.
 */
function solveKakuro(size, board, across, down, givens, cap = 2, budget = 1_500_000) {
  const runs = [...across, ...down];
  const cellRuns = new Map();
  const white = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c].block) continue;
      white.push([r, c]);
      cellRuns.set(`${r},${c}`, []);
    }
  }
  runs.forEach((run) => run.cells.forEach(([r, c]) => cellRuns.get(`${r},${c}`).push(run)));
  white.sort((a, b) => cellRuns.get(`${b[0]},${b[1]}`).length - cellRuns.get(`${a[0]},${a[1]}`).length);

  const val = Array.from({ length: size }, () => Array(size).fill(0));
  const solutions = [];
  let nodes = 0;
  let blown = false;

  const runFeasible = (run) => {
    let sum = 0;
    let filled = 0;
    const used = [];
    for (const [r, c] of run.cells) {
      const v = val[r][c];
      if (v) { sum += v; filled++; if (used.includes(v)) return false; used.push(v); }
    }
    const remaining = run.cells.length - filled;
    if (remaining === 0) return sum === run.sum;
    const avail = [];
    for (let d = 1; d <= 9; d++) if (!used.includes(d)) avail.push(d);
    let lo = 0;
    let hi = 0;
    for (let i = 0; i < remaining; i++) { lo += avail[i]; hi += avail[avail.length - 1 - i]; }
    return sum + lo <= run.sum && sum + hi >= run.sum;
  };

  const rec = (i) => {
    if (solutions.length >= cap || blown) return;
    if (++nodes > budget) { blown = true; return; }
    if (i === white.length) { solutions.push(val.map((row) => row.slice())); return; }
    const [r, c] = white[i];
    const myRuns = cellRuns.get(`${r},${c}`);
    const given = givens[`${r},${c}`];
    for (const v of given ? [given] : [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      val[r][c] = v;
      if (myRuns.every(runFeasible)) rec(i + 1);
      val[r][c] = 0;
      if (solutions.length >= cap || blown) return;
    }
  };
  rec(0);
  return blown ? null : solutions;
}

/**
 * Reveal the fewest locked digits (from `solution`) needed to force a unique
 * answer. Each round, find a cell where a second solution disagrees and lock
 * the true value there. Returns the givens map, or null if it can't converge.
 */
function minimalGivens(size, board, across, down, solution) {
  const givens = {};
  for (let round = 0; round < size * size; round++) {
    const sols = solveKakuro(size, board, across, down, givens, 2);
    if (sols === null) return null;
    if (sols.length <= 1) return givens;
    const alt = sols.find((s) => {
      for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!board[r][c].block && s[r][c] !== solution[r][c]) return true;
      return false;
    });
    if (!alt) return givens;
    let placed = false;
    for (let r = 0; r < size && !placed; r++) {
      for (let c = 0; c < size && !placed; c++) {
        if (board[r][c].block) continue;
        const k = `${r},${c}`;
        if (!givens[k] && alt[r][c] !== solution[r][c]) { givens[k] = solution[r][c]; placed = true; }
      }
    }
    if (!placed) return null;
  }
  return null;
}

function buildState(size, board, across, down, givens, seed) {
  return {
    size,
    board,
    across,
    down,
    // Locked givens are pre-filled and immovable; other white cells start empty.
    player: board.map((row, r) => row.map((cell, c) => (cell.block ? null : givens[`${r},${c}`] ?? 0))),
    fixed: board.map((row, r) => row.map((cell, c) => (!cell.block && givens[`${r},${c}`] != null))),
    seed,
  };
}

export function generateKakuro(size, seed) {
  let best = null;
  for (let attempt = 0; attempt < 60; attempt++) {
    const rng = createRng((seed + attempt * 104729) >>> 0);
    const board = emptyBoard(size, rng);
    const filled = fillValues(board, size, rng);
    if (!filled) continue;
    const { across, down } = filled;
    const solution = board.map((row) => row.map((cell) => cell.value));
    const givens = minimalGivens(size, board, across, down, solution);
    if (givens === null) continue;
    const count = Object.keys(givens).length;
    if (!best || count < best.count) best = { board, across, down, givens, count, seed: seed + attempt };
    if (count <= 3) break; // few enough clues — good puzzle
  }
  if (best) return buildState(size, best.board, best.across, best.down, best.givens, best.seed);

  // Fallback (rare): a valid board, fully revealed so it's still well-formed.
  const rng = createRng(seed);
  const board = emptyBoard(size, rng);
  const filled = fillValues(board, size, rng) ?? { across: [], down: [] };
  const solution = board.map((row) => row.map((cell) => cell.value));
  const givens = {};
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!board[r][c].block) givens[`${r},${c}`] = solution[r][c];
  return buildState(size, board, filled.across, filled.down, givens, seed);
}

export function resetKakuro(state) {
  return {
    ...state,
    player: state.player.map((row, r) => row.map((v, c) => (v === null ? null : state.fixed[r][c] ? v : 0))),
  };
}

export function setKakuroCell(state, r, c, value) {
  if (state.board[r][c].block || state.fixed[r][c]) return state;
  const player = state.player.map((row) => row.slice());
  player[r][c] = value >= 1 && value <= 9 ? value : 0;
  return { ...state, player };
}

function runValid(run, player, completeOnly = false) {
  const vals = run.cells.map(([r, c]) => player[r][c]);
  if (vals.some((v) => !v)) return !completeOnly;
  if (new Set(vals).size !== vals.length) return false;
  return vals.reduce((s, v) => s + v, 0) === run.sum;
}

export function isKakuroSolved(state) {
  for (let r = 0; r < state.size; r++) {
    for (let c = 0; c < state.size; c++) {
      if (!state.board[r][c].block && !state.player[r][c]) return false;
    }
  }
  return [...state.across, ...state.down].every((run) => runValid(run, state.player, true));
}
