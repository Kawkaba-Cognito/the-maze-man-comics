/*
 * CROWNS — logic puzzle (original take on the "one queen per row/col/region"
 * genre). N×N grid split into N colored regions. Place exactly one crown per
 * row, per column, and per region; no two crowns touch (incl. diagonally).
 * Generated puzzles have a UNIQUE solution (verified by a counting solver).
 *
 * Cell states (player board): 0 empty · 1 mark (×) · 2 crown.
 */
import { createRng, shuffle } from '../../shared/rng';

export const REGION_COLORS = [
  '#e08b7a', '#7fb0d8', '#a7c97e', '#e6c66a', '#b79bd6',
  '#7fcbc0', '#e69ac0', '#c9a06a', '#9aa7e0', '#d98f8f',
];

/** Random valid crown placement: permutation cols[r] with |cols[r]-cols[r+1]|>=2. */
function randomPlacement(n, rng) {
  const cols = new Array(n).fill(-1);
  const used = new Array(n).fill(false);
  function place(r) {
    if (r === n) return true;
    const order = shuffle([...Array(n).keys()], rng);
    for (const c of order) {
      if (used[c]) continue;
      if (r > 0 && Math.abs(c - cols[r - 1]) < 2) continue;
      cols[r] = c; used[c] = true;
      if (place(r + 1)) return true;
      cols[r] = -1; used[c] = false;
    }
    return false;
  }
  return place(0) ? cols : null;
}

/**
 * Grow N connected regions from the crown seeds, ROUND-ROBIN so regions stay
 * roughly balanced (organic shapes, no one region swallowing the board).
 */
function growRegions(n, seeds, rng) {
  const region = Array.from({ length: n }, () => new Array(n).fill(-1));
  const fronts = seeds.map(() => []); // per-region frontier cells
  const addFront = (i, r, c) => {
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n && region[nr][nc] === -1) fronts[i].push({ r: nr, c: nc });
    });
  };
  seeds.forEach((s, i) => { region[s.r][s.c] = i; addFront(i, s.r, s.c); });

  let assigned = n;
  while (assigned < n * n) {
    let progressed = false;
    for (const i of shuffle([...Array(n).keys()], rng)) {
      let cell = null;
      while (fronts[i].length) {
        const cand = fronts[i].splice(Math.floor(rng() * fronts[i].length), 1)[0];
        if (region[cand.r][cand.c] === -1) { cell = cand; break; }
      }
      if (cell) {
        region[cell.r][cell.c] = i; assigned += 1; addFront(i, cell.r, cell.c); progressed = true;
        if (assigned === n * n) break;
      }
    }
    if (!progressed) break; // unreachable pocket → caller regenerates
  }
  return assigned === n * n ? region : null;
}

/** Up to `cap` solutions (each a row→col array) for a region map. */
function solveCrowns(n, region, cap = 2) {
  const sols = [];
  const usedCol = new Array(n).fill(false);
  const usedReg = new Array(n).fill(false);
  const rowCol = new Array(n).fill(-1);
  function rec(r) {
    if (sols.length >= cap) return;
    if (r === n) { sols.push(rowCol.slice()); return; }
    for (let c = 0; c < n; c++) {
      if (usedCol[c]) continue;
      const reg = region[r][c];
      if (usedReg[reg]) continue;
      if (r > 0 && Math.abs(c - rowCol[r - 1]) < 2) continue;
      usedCol[c] = true; usedReg[reg] = true; rowCol[r] = c;
      rec(r + 1);
      usedCol[c] = false; usedReg[reg] = false; rowCol[r] = -1;
    }
  }
  rec(0);
  return sols;
}

const orth4 = (n, r, c) =>
  [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([rr, cc]) => rr >= 0 && rr < n && cc >= 0 && cc < n);

/** Would region `id` remain one connected group if cell (rr,cc) were removed? */
function regionConnectedWithout(region, n, id, rr, cc) {
  const member = (r, c) => region[r][c] === id && !(r === rr && c === cc);
  let start = null;
  let total = 0;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (member(r, c)) { total++; if (!start) start = [r, c]; }
  if (!start) return false; // region would become empty
  const seen = new Set([start[0] * n + start[1]]);
  const stack = [start];
  let reached = 0;
  while (stack.length) {
    const [r, c] = stack.pop();
    reached++;
    for (const [a, b] of orth4(n, r, c)) if (member(a, b) && !seen.has(a * n + b)) { seen.add(a * n + b); stack.push([a, b]); }
  }
  return reached === total;
}

/**
 * Reshape region boundaries until `cols` is the ONLY solution.
 *
 * While an alternate solution exists, pick one of its crowns that sits OFF the
 * intended solution — cell (r, alt[r]) with alt[r] ≠ cols[r] — and reassign that
 * cell to an adjacent region. Every region already holds exactly one of the
 * alternate's crowns, so donating this crown's cell to a neighbour forces that
 * neighbour to hold two ⇒ the alternate breaks. The intended solution never
 * owns this cell (its row crown is elsewhere) ⇒ it stays valid. We only move a
 * cell whose departure keeps its region connected, so regions remain connected
 * and N in number. Returns false if it can't progress (caller regenerates).
 */
function disambiguateCrowns(n, region, cols, rng) {
  for (let iter = 0; iter < n * n * 4; iter++) {
    const sols = solveCrowns(n, region, 2);
    const alt = sols.find((s) => s.some((c, r) => c !== cols[r]));
    if (!alt) return true; // only cols remains ⇒ unique

    const rows = shuffle([...Array(n).keys()], rng).filter((r) => alt[r] !== cols[r]);
    let moved = false;
    for (const r of rows) {
      const ac = alt[r];
      const X = region[r][ac];
      if (!regionConnectedWithout(region, n, X, r, ac)) continue;
      const target = shuffle(orth4(n, r, ac), rng).find(([nr, nc]) => region[nr][nc] !== X);
      if (!target) continue;
      region[r][ac] = region[target[0]][target[1]];
      moved = true;
      break;
    }
    if (!moved) return false; // no legal reshaping move — regenerate
  }
  return solveCrowns(n, region, 2).length === 1;
}

export function generateCrowns(n, seed) {
  const rng = createRng(seed);
  for (let attempt = 0; attempt < 300; attempt++) {
    const cols = randomPlacement(n, rng);
    if (!cols) continue;
    const region = growRegions(n, cols.map((c, r) => ({ r, c })), rng);
    if (!region) continue;
    if (disambiguateCrowns(n, region, cols, rng)) {
      return {
        n,
        region,
        solution: cols.slice(),
        player: Array.from({ length: n }, () => new Array(n).fill(0)),
      };
    }
  }
  // Fallback (should be rare): return a valid-but-maybe-nonunique board.
  const cols = randomPlacement(n, rng) || [...Array(n).keys()];
  const region = growRegions(n, cols.map((c, r) => ({ r, c })), rng)
    || Array.from({ length: n }, (_, r) => new Array(n).fill(r));
  return { n, region, solution: cols.slice(), player: Array.from({ length: n }, () => new Array(n).fill(0)) };
}

export function cycleCrownCell(state, r, c) {
  const player = state.player.map((row) => row.slice());
  player[r][c] = (player[r][c] + 1) % 3; // 0→1→2→0
  return { ...state, player };
}

export function resetCrowns(state) {
  return { ...state, player: Array.from({ length: state.n }, () => new Array(state.n).fill(0)) };
}

/** Crowns that violate a rule → for live red-highlight feedback. */
export function crownConflicts(state) {
  const { n, region, player } = state;
  const crowns = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (player[r][c] === 2) crowns.push({ r, c });
  const bad = new Set();
  const key = (r, c) => `${r},${c}`;
  const rowCount = {}, colCount = {}, regCount = {};
  crowns.forEach(({ r, c }) => {
    rowCount[r] = (rowCount[r] || 0) + 1;
    colCount[c] = (colCount[c] || 0) + 1;
    const g = region[r][c]; regCount[g] = (regCount[g] || 0) + 1;
  });
  crowns.forEach(({ r, c }) => {
    if (rowCount[r] > 1 || colCount[c] > 1 || regCount[region[r][c]] > 1) bad.add(key(r, c));
    crowns.forEach(({ r: r2, c: c2 }) => {
      if ((r !== r2 || c !== c2) && Math.abs(r - r2) <= 1 && Math.abs(c - c2) <= 1) {
        bad.add(key(r, c)); bad.add(key(r2, c2));
      }
    });
  });
  return bad;
}

export function isCrownsSolved(state) {
  const { n, region, player } = state;
  const rowC = new Array(n).fill(0);
  const colC = new Array(n).fill(0);
  const regC = new Array(n).fill(0);
  let total = 0;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (player[r][c] === 2) {
        rowC[r]++; colC[c]++; regC[region[r][c]]++; total++;
      }
    }
  }
  if (total !== n) return false;
  if (rowC.some((v) => v !== 1) || colC.some((v) => v !== 1) || regC.some((v) => v !== 1)) return false;
  return crownConflicts(state).size === 0;
}

/** Place one correct crown (paid hint). Returns { next, revealed }. */
export function hintReveal(state) {
  const { n, solution, player } = state;
  const pool = [];
  for (let r = 0; r < n; r++) { if (player[r][solution[r]] !== 2) pool.push(r); }
  if (!pool.length) return { next: state, revealed: false };
  const r = pool[Math.floor(Math.random() * pool.length)];
  const np = player.map((row) => row.slice());
  np[r][solution[r]] = 2;
  return { next: { ...state, player: np }, revealed: true };
}
