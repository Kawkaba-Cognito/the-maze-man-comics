import { createRng, shuffle } from '../../shared/rng';

function latinSquare(size, rng) {
  const offset = Math.floor(rng() * size);
  const nums = shuffle(Array.from({ length: size }, (_, i) => i + 1), rng);
  const rows = shuffle(Array.from({ length: size }, (_, i) => i), rng);
  const cols = shuffle(Array.from({ length: size }, (_, i) => i), rng);
  return rows.map((r) => cols.map((c) => nums[(r + c + offset) % size]));
}

function neighbors(size, r, c) {
  return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(
    ([rr, cc]) => rr >= 0 && rr < size && cc >= 0 && cc < size
  );
}

function cageOp(cells, solution, rng) {
  const vals = cells.map(([r, c]) => solution[r][c]);
  if (vals.length === 1) return { op: '', target: vals[0] };
  if (vals.length === 2) {
    // Weight the tightly-constraining operations (− and ÷) higher so puzzles
    // need far fewer freebie splits to become unique.
    const [a, b] = vals;
    const hi = Math.max(a, b);
    const lo = Math.min(a, b);
    const choices = [
      { op: '-', target: hi - lo, w: 3 },
      { op: '+', target: a + b, w: 1 },
      { op: '×', target: a * b, w: 1 },
    ];
    if (hi % lo === 0) choices.push({ op: '÷', target: hi / lo, w: 3 });
    const total = choices.reduce((s, ch) => s + ch.w, 0);
    let x = rng() * total;
    for (const ch of choices) { if ((x -= ch.w) < 0) return { op: ch.op, target: ch.target }; }
    return choices[0];
  }
  if (rng() < 0.5) return { op: '+', target: vals.reduce((a, b) => a + b, 0) };
  return { op: '×', target: vals.reduce((a, b) => a * b, 1) };
}

function buildCages(size, solution, rng) {
  const unused = new Set(Array.from({ length: size * size }, (_, i) => i));
  const cages = [];
  const key = (r, c) => r * size + c;

  while (unused.size) {
    const start = Array.from(unused)[Math.floor(rng() * unused.size)];
    const cells = [[Math.floor(start / size), start % size]];
    unused.delete(start);
    // Aim for mostly 2-cell cages with some triples; avoid intentional singles
    // (lone cells only appear when a region can't grow). Tighter cages → unique
    // with very few freebies.
    const targetLen = rng() < 0.7 ? 2 : 3;

    while (cells.length < targetLen) {
      const frontier = cells.flatMap(([r, c]) => neighbors(size, r, c)).filter(([r, c]) => unused.has(key(r, c)));
      if (!frontier.length) break;
      const [r, c] = frontier[Math.floor(rng() * frontier.length)];
      cells.push([r, c]);
      unused.delete(key(r, c));
    }

    const { op, target } = cageOp(cells, solution, rng);
    cages.push({ id: cages.length, cells, op, target });
  }

  const cageMap = Array.from({ length: size }, () => Array(size).fill(null));
  cages.forEach((cage) => cage.cells.forEach(([r, c]) => { cageMap[r][c] = cage.id; }));
  return { cages, cageMap };
}

function rebuildCageMap(size, cages) {
  const cageMap = Array.from({ length: size }, () => Array(size).fill(null));
  cages.forEach((cage) => cage.cells.forEach(([r, c]) => { cageMap[r][c] = cage.id; }));
  return cageMap;
}

function recomputeCage(cage, solution, rng) {
  if (cage.cells.length === 1) {
    const [r, c] = cage.cells[0];
    cage.op = '';
    cage.target = solution[r][c];
  } else {
    const { op, target } = cageOp(cage.cells, solution, rng);
    cage.op = op;
    cage.target = target;
  }
}

/**
 * Count fillings of the grid that obey the Latin-square rule AND every cage,
 * capped at `cap`. Returns -1 if the search budget is exceeded.
 */
function kenkenSolutionCount(size, cages, cageMap, cap = 2, budget = 3_000_000) {
  const cageById = Object.fromEntries(cages.map((c) => [c.id, c]));
  const grid = Array.from({ length: size }, () => Array(size).fill(0));
  const rowUsed = Array.from({ length: size }, () => new Array(size + 1).fill(false));
  const colUsed = Array.from({ length: size }, () => new Array(size + 1).fill(false));
  let count = 0;
  let nodes = 0;
  let blown = false;

  const feasible = (cage) => {
    const vals = cage.cells.map(([r, c]) => grid[r][c]);
    const filled = vals.filter((v) => v !== 0);
    const remaining = vals.length - filled.length;
    if (cage.op === '') return remaining > 0 || filled[0] === cage.target;
    if (cage.op === '+') {
      const s = filled.reduce((a, b) => a + b, 0);
      if (remaining === 0) return s === cage.target;
      return s + remaining <= cage.target && s + remaining * size >= cage.target;
    }
    if (cage.op === '×') {
      const p = filled.reduce((a, b) => a * b, 1);
      if (remaining === 0) return p === cage.target;
      return cage.target % p === 0 && p <= cage.target;
    }
    if (cage.op === '-') return remaining > 0 || Math.abs(vals[0] - vals[1]) === cage.target;
    if (cage.op === '÷') {
      if (remaining > 0) return true;
      const hi = Math.max(...vals);
      const lo = Math.min(...vals);
      return lo !== 0 && hi % lo === 0 && hi / lo === cage.target;
    }
    return true;
  };

  const order = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) order.push([r, c]);

  const rec = (idx) => {
    if (count >= cap || blown) return;
    if (++nodes > budget) { blown = true; return; }
    if (idx === order.length) { count++; return; }
    const [r, c] = order[idx];
    const cage = cageById[cageMap[r][c]];
    for (let v = 1; v <= size; v++) {
      if (rowUsed[r][v] || colUsed[c][v]) continue;
      grid[r][c] = v; rowUsed[r][v] = true; colUsed[c][v] = true;
      if (feasible(cage)) rec(idx + 1);
      grid[r][c] = 0; rowUsed[r][v] = false; colUsed[c][v] = false;
      if (count >= cap || blown) return;
    }
  };
  rec(0);
  return blown ? -1 : count;
}

/** Split one cell off a multi-cell cage into a single-cell "freebie" clue. */
function splitOneCell(cages, solution, rng) {
  const multi = cages.filter((c) => c.cells.length > 1);
  if (multi.length === 0) return false;
  const cage = multi[Math.floor(rng() * multi.length)];
  const [cell] = cage.cells.splice(Math.floor(rng() * cage.cells.length), 1);
  recomputeCage(cage, solution, rng);
  cages.push({ id: cages.length, cells: [cell], op: '', target: solution[cell[0]][cell[1]] });
  return true;
}

export function generateKenKen(size, seed) {
  const rng = createRng(seed);
  const solution = latinSquare(size, rng);
  const { cages } = buildCages(size, solution, rng);

  // Force a unique solution: while ambiguous, peel a cell off a cage as a
  // freebie. Strictly tightens constraints, so it always converges.
  let guard = 0;
  while (guard++ < size * size + 4) {
    const count = kenkenSolutionCount(size, cages, rebuildCageMap(size, cages), 2);
    if (count === 1) break;
    if (!splitOneCell(cages, solution, rng)) break; // all singles → already unique
  }

  return {
    size,
    solution,
    cages,
    cageMap: rebuildCageMap(size, cages),
    player: Array.from({ length: size }, () => Array(size).fill(0)),
    seed,
  };
}

export function setKenKenCell(state, r, c, value) {
  const player = state.player.map((row) => row.slice());
  player[r][c] = value >= 1 && value <= state.size ? value : 0;
  return { ...state, player };
}

function cageValid(cage, player, completeOnly = false) {
  const vals = cage.cells.map(([r, c]) => player[r][c]);
  if (vals.some((v) => v === 0)) return !completeOnly;
  if (cage.op === '') return vals[0] === cage.target;
  if (cage.op === '+') return vals.reduce((a, b) => a + b, 0) === cage.target;
  if (cage.op === '×') return vals.reduce((a, b) => a * b, 1) === cage.target;
  if (cage.op === '-') return Math.abs(vals[0] - vals[1]) === cage.target;
  if (cage.op === '÷') return Math.max(...vals) / Math.min(...vals) === cage.target;
  return false;
}

export function kenKenHasConflict(state) {
  const { size, player, cages } = state;
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
  return cages.some((cage) => !cageValid(cage, player, false));
}

export function isKenKenSolved(state) {
  const { size, player, cages } = state;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!player[r][c]) return false;
    }
  }
  if (kenKenHasConflict(state)) return false;
  return cages.every((cage) => cageValid(cage, player, true));
}

/** Reveal one correct cell (paid hint). Returns { next, revealed }. */
export function hintReveal(state) {
  const { size, solution, player } = state;
  const empties = [], wrongs = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (!player[r][c]) empties.push([r, c]);
    else if (player[r][c] !== solution[r][c]) wrongs.push([r, c]);
  }
  const pool = empties.length ? empties : wrongs;
  if (!pool.length) return { next: state, revealed: false };
  const [r, c] = pool[Math.floor(Math.random() * pool.length)];
  const np = player.map((row) => row.slice());
  np[r][c] = solution[r][c];
  return { next: { ...state, player: np }, revealed: true };
}
