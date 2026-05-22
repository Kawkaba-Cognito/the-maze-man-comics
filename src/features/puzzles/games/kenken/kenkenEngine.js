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
    const [a, b] = vals;
    const ops = [
      { op: '+', target: a + b },
      { op: '-', target: Math.abs(a - b) },
      { op: '×', target: a * b },
    ];
    if (Math.max(a, b) % Math.min(a, b) === 0) ops.push({ op: '÷', target: Math.max(a, b) / Math.min(a, b) });
    return ops[Math.floor(rng() * ops.length)];
  }
  if (rng() < 0.55) return { op: '+', target: vals.reduce((a, b) => a + b, 0) };
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
    const targetLen = Math.min(3, 1 + Math.floor(rng() * (size >= 5 ? 3 : 2)));

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

export function generateKenKen(size, seed) {
  const rng = createRng(seed);
  const solution = latinSquare(size, rng);
  const { cages, cageMap } = buildCages(size, solution, rng);
  return {
    size,
    solution,
    cages,
    cageMap,
    player: Array.from({ length: size }, () => Array(size).fill(0)),
    seed,
  };
}

export function cycleKenKenCell(state, r, c) {
  const player = state.player.map((row) => row.slice());
  player[r][c] = player[r][c] === state.size ? 0 : player[r][c] + 1;
  return { ...state, player };
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
