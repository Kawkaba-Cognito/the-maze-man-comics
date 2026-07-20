import { createRng, shuffle } from '../../shared/rng';

/*
 * TAKUZU (a.k.a. Binairo) engine.
 *
 * Rules enforced:
 *   1. Each row and column holds equal counts of 0 and 1.
 *   2. No three identical values in a row (horizontally or vertically).
 *   3. No two rows are identical, and no two columns are identical.
 *
 * A puzzle is a fully-valid solution with cells removed down to a UNIQUE
 * solvable position; the cells that remain are fixed clues.
 */

function lineCount(line, val) {
  let n = 0;
  for (const x of line) if (x === val) n++;
  return n;
}

function hasTriple(line) {
  for (let i = 0; i + 2 < line.length; i++) {
    if (line[i] != null && line[i] === line[i + 1] && line[i] === line[i + 2]) return true;
  }
  return false;
}

function lineFull(line) {
  return line.every((x) => x != null);
}

function linesEqual(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

const column = (grid, c) => grid.map((row) => row[c]);

/** Partial check used to prune the solver: no triple yet, counts within half. */
function partialLineOk(line, size) {
  if (hasTriple(line)) return false;
  const half = size / 2;
  return lineCount(line, 0) <= half && lineCount(line, 1) <= half;
}

/** Full check: all three rules on a completely filled grid. */
export function isCompleteGridValid(grid, size) {
  const half = size / 2;
  const rows = [];
  const cols = [];
  for (let r = 0; r < size; r++) {
    const row = grid[r];
    if (lineCount(row, 0) !== half || lineCount(row, 1) !== half) return false;
    if (hasTriple(row)) return false;
    rows.push(row);
  }
  for (let c = 0; c < size; c++) {
    const col = column(grid, c);
    if (lineCount(col, 0) !== half || lineCount(col, 1) !== half) return false;
    if (hasTriple(col)) return false;
    cols.push(col);
  }
  for (let i = 0; i < size; i++) {
    for (let j = i + 1; j < size; j++) {
      if (linesEqual(rows[i], rows[j])) return false;
      if (linesEqual(cols[i], cols[j])) return false;
    }
  }
  return true;
}

/**
 * Recursive fill over a (possibly clued) grid. Calls `onSolution` for each
 * complete valid grid and stops once it returns false. Shared by the solver
 * (count solutions) and the generator (build a random solution).
 */
function search(grid, size, rng, onSolution) {
  const rec = (pos) => {
    if (pos === size * size) return onSolution();
    const r = (pos / size) | 0;
    const c = pos % size;
    if (grid[r][c] != null) return rec(pos + 1);

    const order = rng ? (rng() > 0.5 ? [0, 1] : [1, 0]) : [0, 1];
    for (const val of order) {
      grid[r][c] = val;
      let ok = partialLineOk(grid[r], size) && partialLineOk(column(grid, c), size);
      if (ok && c === size - 1) {
        for (let rr = 0; rr < r; rr++) {
          if (lineFull(grid[rr]) && linesEqual(grid[rr], grid[r])) { ok = false; break; }
        }
      }
      if (ok && r === size - 1) {
        const col = column(grid, c);
        for (let cc = 0; cc < c; cc++) {
          const other = column(grid, cc);
          if (lineFull(other) && linesEqual(other, col)) { ok = false; break; }
        }
      }
      if (ok && !rec(pos + 1)) {
        grid[r][c] = null;
        return false; // propagate stop
      }
      grid[r][c] = null;
    }
    return true; // keep searching
  };
  rec(0);
}

/** Number of valid completions of `grid`, capped at `cap`. */
function countSolutions(grid, size, cap = 2) {
  const work = grid.map((row) => row.slice());
  let count = 0;
  search(work, size, null, () => {
    if (isCompleteGridValid(work, size)) count++;
    return count < cap; // stop once we hit the cap
  });
  return count;
}

/** A random, fully-valid solution grid. */
function buildSolution(size, rng) {
  const grid = Array.from({ length: size }, () => Array(size).fill(null));
  let solution = null;
  search(grid, size, rng, () => {
    if (isCompleteGridValid(grid, size)) {
      solution = grid.map((row) => row.slice());
      return false; // stop at the first valid solution
    }
    return true;
  });
  return solution;
}

/** Clues kept after carving — tuned for an approachable but non-trivial board. */
export const TAKUZU_CLUES = { 4: 6, 6: 14, 8: 26, 10: 42 };

export function generateTakuzu(size, seed) {
  const rng = createRng(seed);
  const solution = buildSolution(size, rng);
  if (!solution) return generateTakuzu(size, seed + 1);

  // Carve clues away while a single solution survives, stopping at the target
  // so the board stays inviting rather than minimal/sparse.
  const puzzle = solution.map((row) => row.slice());
  const target = TAKUZU_CLUES[size] ?? Math.round(size * size * 0.4);
  const order = shuffle(Array.from({ length: size * size }, (_, i) => i), rng);
  let clues = size * size;
  for (const idx of order) {
    if (clues <= target) break;
    const r = (idx / size) | 0;
    const c = idx % size;
    const saved = puzzle[r][c];
    puzzle[r][c] = null;
    if (countSolutions(puzzle, size, 2) !== 1) {
      puzzle[r][c] = saved; // removal broke uniqueness — keep it as a clue
    } else {
      clues--;
    }
  }

  return {
    size,
    solution,
    puzzle,
    player: puzzle.map((row) => row.slice()),
    fixed: puzzle.map((row) => row.map((v) => v != null)),
    seed,
  };
}

export function cycleTakuzuCell(state, r, c) {
  if (state.fixed[r][c]) return state;
  const player = state.player.map((row) => row.slice());
  const cur = player[r][c];
  player[r][c] = cur == null ? 0 : cur === 0 ? 1 : null;
  return { ...state, player };
}

export function resetTakuzu(state) {
  return { ...state, player: state.puzzle.map((row) => row.slice()) };
}

export function isTakuzuComplete(player, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (player[r][c] == null) return false;
    }
  }
  return isCompleteGridValid(player, size);
}

export function isTakuzuSolved(state) {
  return isTakuzuComplete(state.player, state.size);
}

/** Reveal one correct cell (paid hint). Returns { next, revealed }. */
export function hintReveal(state) {
  const { size, solution, player, fixed } = state;
  const pool = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (!fixed[r][c] && player[r][c] !== solution[r][c]) pool.push([r, c]);
  }
  if (!pool.length) return { next: state, revealed: false };
  const rng = createRng(((state.seed || 1) ^ (pool.length * 2654435761)) >>> 0);
  const [r, c] = pool[Math.floor(rng() * pool.length)];
  const np = player.map((row) => row.slice());
  const nf = fixed.map((row) => row.slice());
  np[r][c] = solution[r][c]; nf[r][c] = true;
  return { next: { ...state, player: np, fixed: nf }, revealed: true };
}
