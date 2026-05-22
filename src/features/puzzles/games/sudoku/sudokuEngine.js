import { createRng, shuffle } from '../../shared/rng';

export const SUDOKU_SIZES = {
  4: { boxRows: 2, boxCols: 2, clues: 7 },
  6: { boxRows: 2, boxCols: 3, clues: 14 },
  9: { boxRows: 3, boxCols: 3, clues: 32 },
};

function pattern(r, c, size, boxRows, boxCols) {
  return (boxCols * (r % boxRows) + Math.floor(r / boxRows) + c) % size;
}

function shuffledBands(size, groupSize, rng) {
  const groups = shuffle(Array.from({ length: size / groupSize }, (_, i) => i), rng);
  return groups.flatMap((g) => shuffle(Array.from({ length: groupSize }, (_, i) => g * groupSize + i), rng));
}

function solvedGrid(size, rng) {
  const { boxRows, boxCols } = SUDOKU_SIZES[size];
  const rows = shuffledBands(size, boxRows, rng);
  const cols = shuffledBands(size, boxCols, rng);
  const nums = shuffle(Array.from({ length: size }, (_, i) => i + 1), rng);
  return rows.map((r) => cols.map((c) => nums[pattern(r, c, size, boxRows, boxCols)]));
}

function canPlace(grid, size, r, c, val) {
  const { boxRows, boxCols } = SUDOKU_SIZES[size];
  for (let i = 0; i < size; i++) {
    if (grid[r][i] === val || grid[i][c] === val) return false;
  }
  const br = Math.floor(r / boxRows) * boxRows;
  const bc = Math.floor(c / boxCols) * boxCols;
  for (let rr = br; rr < br + boxRows; rr++) {
    for (let cc = bc; cc < bc + boxCols; cc++) {
      if (grid[rr][cc] === val) return false;
    }
  }
  return true;
}

function countSolutions(grid, size, cap = 2) {
  let count = 0;
  const work = grid.map((row) => row.slice());
  const solve = () => {
    if (count >= cap) return;
    let best = null;
    let bestOptions = null;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (work[r][c] !== 0) continue;
        const opts = [];
        for (let v = 1; v <= size; v++) if (canPlace(work, size, r, c, v)) opts.push(v);
        if (opts.length === 0) return;
        if (!best || opts.length < bestOptions.length) {
          best = [r, c];
          bestOptions = opts;
          if (opts.length === 1) break;
        }
      }
      if (bestOptions?.length === 1) break;
    }
    if (!best) {
      count++;
      return;
    }
    const [r, c] = best;
    for (const v of bestOptions) {
      work[r][c] = v;
      solve();
      work[r][c] = 0;
      if (count >= cap) return;
    }
  };
  solve();
  return count;
}

export function generateSudoku(size, seed) {
  const rng = createRng(seed);
  const solution = solvedGrid(size, rng);
  const puzzle = solution.map((row) => row.slice());
  const targetClues = SUDOKU_SIZES[size].clues;
  let clues = size * size;
  const cells = shuffle(Array.from({ length: size * size }, (_, i) => i), rng);

  for (const idx of cells) {
    if (clues <= targetClues) break;
    const r = Math.floor(idx / size);
    const c = idx % size;
    const old = puzzle[r][c];
    puzzle[r][c] = 0;
    if (countSolutions(puzzle, size, 2) !== 1) {
      puzzle[r][c] = old;
    } else {
      clues--;
    }
  }

  return {
    size,
    solution,
    puzzle,
    player: puzzle.map((row) => row.slice()),
    fixed: puzzle.map((row) => row.map((v) => v !== 0)),
    seed,
  };
}

export function cycleSudokuCell(state, r, c) {
  if (state.fixed[r][c]) return state;
  const player = state.player.map((row) => row.slice());
  player[r][c] = player[r][c] === state.size ? 0 : player[r][c] + 1;
  return { ...state, player };
}

export function setSudokuCell(state, r, c, value) {
  if (state.fixed[r][c]) return state;
  const player = state.player.map((row) => row.slice());
  player[r][c] = value >= 1 && value <= state.size ? value : 0;
  return { ...state, player };
}

export function isSudokuSolved(state) {
  for (let r = 0; r < state.size; r++) {
    for (let c = 0; c < state.size; c++) {
      if (state.player[r][c] !== state.solution[r][c]) return false;
    }
  }
  return true;
}

export function sudokuHasConflict(state) {
  const { size, player } = state;
  for (let r = 0; r < size; r++) {
    const seen = new Set();
    for (let c = 0; c < size; c++) {
      const v = player[r][c];
      if (!v) continue;
      if (seen.has(v)) return true;
      seen.add(v);
    }
  }
  for (let c = 0; c < size; c++) {
    const seen = new Set();
    for (let r = 0; r < size; r++) {
      const v = player[r][c];
      if (!v) continue;
      if (seen.has(v)) return true;
      seen.add(v);
    }
  }
  return false;
}
