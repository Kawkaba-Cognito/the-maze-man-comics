import { createRng } from '../../shared/rng';

function cluesForLine(line) {
  const clues = [];
  let run = 0;
  for (const cell of line) {
    if (cell) run++;
    else if (run) {
      clues.push(run);
      run = 0;
    }
  }
  if (run) clues.push(run);
  return clues.length ? clues : [0];
}

function hasFilled(grid) {
  return grid.some((row) => row.some(Boolean));
}

export function generateNonogram(size, seed) {
  const rng = createRng(seed);
  let solution;
  do {
    solution = Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c) => {
        const center = Math.abs(r - (size - 1) / 2) + Math.abs(c - (size - 1) / 2);
        const bias = center < size * 0.42 ? 0.58 : 0.36;
        return rng() < bias;
      })
    );
  } while (!hasFilled(solution));

  const rowClues = solution.map(cluesForLine);
  const colClues = Array.from({ length: size }, (_, c) => cluesForLine(solution.map((row) => row[c])));
  return {
    size,
    solution,
    rowClues,
    colClues,
    player: Array.from({ length: size }, () => Array(size).fill(false)),
    seed,
  };
}

export function toggleNonogramCell(state, r, c) {
  const player = state.player.map((row) => row.slice());
  player[r][c] = !player[r][c];
  return { ...state, player };
}

export function isNonogramSolved(state) {
  for (let r = 0; r < state.size; r++) {
    for (let c = 0; c < state.size; c++) {
      if (state.player[r][c] !== state.solution[r][c]) return false;
    }
  }
  return true;
}

export function nonogramLineCluesMatch(state) {
  for (let r = 0; r < state.size; r++) {
    if (cluesForLine(state.player[r]).join(',') !== state.rowClues[r].join(',')) return false;
  }
  for (let c = 0; c < state.size; c++) {
    const col = state.player.map((row) => row[c]);
    if (cluesForLine(col).join(',') !== state.colClues[c].join(',')) return false;
  }
  return true;
}
