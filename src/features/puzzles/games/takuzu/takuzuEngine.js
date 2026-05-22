import { createRng } from '../../shared/rng';

function countInLine(line, val) {
  return line.filter((x) => x === val).length;
}

function hasTripleRun(line) {
  for (let i = 0; i < line.length - 2; i++) {
    if (line[i] != null && line[i] === line[i + 1] && line[i] === line[i + 2]) return true;
  }
  return false;
}

function isPartialRowValid(row, size) {
  if (hasTripleRun(row)) return false;
  const zeros = countInLine(row, 0);
  const ones = countInLine(row, 1);
  const half = size / 2;
  if (zeros > half || ones > half) return false;
  return true;
}

function isCompleteGridValid(grid, size) {
  for (let r = 0; r < size; r++) {
    const row = grid[r];
    if (countInLine(row, 0) !== size / 2 || countInLine(row, 1) !== size / 2) return false;
    if (hasTripleRun(row)) return false;
  }
  for (let c = 0; c < size; c++) {
    const col = grid.map((row) => row[c]);
    if (countInLine(col, 0) !== size / 2 || countInLine(col, 1) !== size / 2) return false;
    if (hasTripleRun(col)) return false;
  }
  return true;
}

function solve(grid, size, rng, r = 0, c = 0) {
  if (r === size) return isCompleteGridValid(grid, size);
  const nr = c === size - 1 ? r + 1 : r;
  const nc = c === size - 1 ? 0 : c + 1;
  const order = rng() > 0.5 ? [0, 1] : [1, 0];
  for (const val of order) {
    grid[r][c] = val;
    if (isPartialRowValid(grid[r], size)) {
      const col = grid.map((row) => row[c]);
      if (isPartialRowValid(col, size) && solve(grid, size, rng, nr, nc)) return true;
    }
  }
  grid[r][c] = null;
  return false;
}

export function generateTakuzu(size, seed) {
  const rng = createRng(seed);
  const solution = Array.from({ length: size }, () => Array(size).fill(null));
  if (!solve(solution, size, rng)) {
    return generateTakuzu(size, seed + 1);
  }
  const player = Array.from({ length: size }, () => Array(size).fill(null));
  return { size, solution, player, seed };
}

export function cycleTakuzuCell(state, r, c) {
  const player = state.player.map((row) => row.slice());
  const cur = player[r][c];
  player[r][c] = cur == null ? 0 : cur === 0 ? 1 : null;
  return { ...state, player };
}

export function isTakuzuSolved(state) {
  const { size, player } = state;
  return isTakuzuComplete(player, size);
}

export function isTakuzuComplete(player, size) {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (player[r][c] == null) return false;
    }
  }
  return isCompleteGridValid(player, size);
}
