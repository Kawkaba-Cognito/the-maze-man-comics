import { createRng, shuffle } from '../../shared/rng';

const PATTERNS = {
  7: [
    '#######',
    '#..#..#',
    '#..#..#',
    '###.###',
    '#..#..#',
    '#..#..#',
    '#######',
  ],
  9: [
    '#########',
    '#...#...#',
    '#...#...#',
    '###...###',
    '#.......#',
    '###...###',
    '#...#...#',
    '#...#...#',
    '#########',
  ],
};

function emptyBoard(size) {
  return PATTERNS[size].map((row) =>
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

export function generateKakuro(size, seed) {
  for (let attempt = 0; attempt < 25; attempt++) {
    const rng = createRng((seed + attempt * 104729) >>> 0);
    const board = emptyBoard(size);
    const filled = fillValues(board, size, rng);
    if (!filled) continue;
    const { across, down } = filled;
    return {
      size,
      board,
      across,
      down,
      player: board.map((row) => row.map((cell) => (cell.block ? null : 0))),
      seed: seed + attempt,
    };
  }
  const rng = createRng(seed);
  const board = emptyBoard(size);
  const { across, down } = fillValues(board, size, rng) ?? { across: [], down: [] };
  return {
    size,
    board,
    across,
    down,
    player: board.map((row) => row.map((cell) => (cell.block ? null : 0))),
    seed,
  };
}

export function cycleKakuroCell(state, r, c) {
  if (state.board[r][c].block) return state;
  const player = state.player.map((row) => row.slice());
  player[r][c] = player[r][c] === 9 ? 0 : player[r][c] + 1;
  return { ...state, player };
}

export function setKakuroCell(state, r, c, value) {
  if (state.board[r][c].block) return state;
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

export function kakuroHasConflict(state) {
  return [...state.across, ...state.down].some((run) => {
    const vals = run.cells.map(([r, c]) => state.player[r][c]).filter(Boolean);
    if (new Set(vals).size !== vals.length) return true;
    return false;
  });
}

export function isKakuroSolved(state) {
  for (let r = 0; r < state.size; r++) {
    for (let c = 0; c < state.size; c++) {
      if (!state.board[r][c].block && !state.player[r][c]) return false;
    }
  }
  return [...state.across, ...state.down].every((run) => runValid(run, state.player, true));
}
