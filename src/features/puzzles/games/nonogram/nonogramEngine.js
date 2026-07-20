import { createRng } from '../../shared/rng';

/* Player cell states */
export const EMPTY = 0;
export const FILLED = 1;
export const MARK = 2; // "definitely empty" note — not scored

function cluesForLine(line) {
  const clues = [];
  let run = 0;
  for (const cell of line) {
    if (cell) run++;
    else if (run) { clues.push(run); run = 0; }
  }
  if (run) clues.push(run);
  return clues.length ? clues : [0];
}

function hasFilled(grid) {
  return grid.some((row) => row.some(Boolean));
}

/**
 * Line solver: given a clue and the currently-known cells (-1 unknown, 0 empty,
 * 1 filled) for one line, return a new known array with every cell that is the
 * same across ALL valid placements forced. Returns null on contradiction.
 */
function lineForce(clue, n, known) {
  const blocks = clue.filter((x) => x > 0);
  const cur = new Array(n).fill(false);
  let count = 0;
  const filledCount = new Array(n).fill(0);

  const consistent = () => {
    for (let i = 0; i < n; i++) {
      if (known[i] === 1 && !cur[i]) return false;
      if (known[i] === 0 && cur[i]) return false;
    }
    return true;
  };

  const place = (bi, pos) => {
    if (bi === blocks.length) {
      if (consistent()) { count++; for (let i = 0; i < n; i++) if (cur[i]) filledCount[i]++; }
      return;
    }
    const len = blocks[bi];
    for (let s = pos; s + len <= n; s++) {
      // Leaving a known-filled cell before s uncovered is impossible for any larger s too.
      let stop = false;
      for (let i = pos; i < s; i++) if (known[i] === 1) { stop = true; break; }
      if (stop) break;
      let ok = true;
      for (let i = s; i < s + len; i++) if (known[i] === 0) { ok = false; break; }
      if (!ok) continue;
      for (let i = s; i < s + len; i++) cur[i] = true;
      place(bi + 1, s + len + 1);
      for (let i = s; i < s + len; i++) cur[i] = false;
    }
  };
  place(0, 0);

  if (count === 0) return null;
  const out = known.slice();
  for (let i = 0; i < n; i++) {
    if (filledCount[i] === count) out[i] = 1;
    else if (filledCount[i] === 0) out[i] = 0;
  }
  return out;
}

/**
 * Solve purely by iterated line deduction. Returns the fully-known grid if it
 * cracks completely (⇒ a unique, no-guess solution), or null otherwise.
 */
function lineSolve(size, rowClues, colClues) {
  const known = Array.from({ length: size }, () => Array(size).fill(-1));
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < size; r++) {
      const res = lineForce(rowClues[r], size, known[r]);
      if (!res) return null;
      for (let c = 0; c < size; c++) if (res[c] !== known[r][c]) { known[r][c] = res[c]; changed = true; }
    }
    for (let c = 0; c < size; c++) {
      const col = known.map((row) => row[c]);
      const res = lineForce(colClues[c], size, col);
      if (!res) return null;
      for (let r = 0; r < size; r++) if (res[r] !== known[r][c]) { known[r][c] = res[r]; changed = true; }
    }
  }
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (known[r][c] === -1) return null; // needs guessing
  return known;
}

export function generateNonogram(size, seed) {
  for (let attempt = 0; attempt < 400; attempt++) {
    const rng = createRng((seed + attempt * 2654435761) >>> 0);
    const solution = Array.from({ length: size }, (_, r) =>
      Array.from({ length: size }, (_, c) => {
        const center = Math.abs(r - (size - 1) / 2) + Math.abs(c - (size - 1) / 2);
        const bias = center < size * 0.42 ? 0.62 : 0.4;
        return rng() < bias;
      })
    );
    if (!hasFilled(solution)) continue;

    const rowClues = solution.map(cluesForLine);
    const colClues = Array.from({ length: size }, (_, c) => cluesForLine(solution.map((row) => row[c])));

    // Keep only puzzles a line-solver fully cracks ⇒ unique and no-guess.
    if (!lineSolve(size, rowClues, colClues)) continue;

    return {
      size,
      solution,
      rowClues,
      colClues,
      player: Array.from({ length: size }, () => Array(size).fill(EMPTY)),
      seed: seed + attempt,
    };
  }

  // Fallback (rare): a valid board even if not strictly no-guess.
  const rng = createRng(seed);
  let solution;
  do {
    solution = Array.from({ length: size }, () => Array.from({ length: size }, () => rng() < 0.55));
  } while (!hasFilled(solution));
  return {
    size,
    solution,
    rowClues: solution.map(cluesForLine),
    colClues: Array.from({ length: size }, (_, c) => cluesForLine(solution.map((row) => row[c]))),
    player: Array.from({ length: size }, () => Array(size).fill(EMPTY)),
    seed,
  };
}

/** Apply the active tool to a cell. mode 'fill' toggles filled; 'mark' toggles X. */
export function setNonogramCell(state, r, c, mode) {
  const player = state.player.map((row) => row.slice());
  const cur = player[r][c];
  if (mode === 'mark') player[r][c] = cur === MARK ? EMPTY : MARK;
  else player[r][c] = cur === FILLED ? EMPTY : FILLED;
  return { ...state, player };
}

/** Win when the FILLED cells reproduce every row and column clue. */
export function nonogramLineCluesMatch(state) {
  const { size, player, rowClues, colClues } = state;
  const filled = (v) => v === FILLED || v === true;
  for (let r = 0; r < size; r++) {
    const line = player[r].map(filled);
    if (cluesForLine(line).join(',') !== rowClues[r].join(',')) return false;
  }
  for (let c = 0; c < size; c++) {
    const line = player.map((row) => filled(row[c]));
    if (cluesForLine(line).join(',') !== colClues[c].join(',')) return false;
  }
  return true;
}

/** Reveal one correct cell (paid hint). Returns { next, revealed }. */
export function hintReveal(state) {
  const { size, solution, player, seed = 1 } = state;
  const pool = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    const wantFilled = !!solution[r][c];
    const isFilled = player[r][c] === FILLED;
    if (wantFilled !== isFilled) pool.push([r, c]);
  }
  if (!pool.length) return { next: state, revealed: false };
  const rng = createRng((seed ^ (pool.length * 2654435761)) >>> 0);
  const [r, c] = pool[Math.floor(rng() * pool.length)];
  const np = player.map((row) => row.slice());
  np[r][c] = solution[r][c] ? FILLED : EMPTY;
  return { next: { ...state, player: np }, revealed: true };
}
