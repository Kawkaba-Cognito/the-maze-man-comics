import { createRng, shuffle } from '../../shared/rng';
import { toArabicDigits } from '../../shared/puzzleStrings';

/*
 * Bridges (Hashiwokakero) engine.
 *
 * Rules: connect numbered islands with horizontal/vertical bridges. Between any
 * pair of islands there are 0, 1 or 2 bridges; bridges never cross and never
 * pass over an island; every island's bridge count equals its number; and all
 * islands form a single connected network.
 *
 * Generation builds a valid connected solution first (by growing bridges over
 * empty lattice cells so crossings are impossible by construction), derives the
 * clue numbers from it, then PROVES the puzzle has a unique solution with a
 * backtracking solver before accepting it. Non-unique or too-hard boards are
 * rejected and regenerated, so a returned puzzle is always uniquely solvable.
 */

/** UI tier (grid size) → generation spec. */
export const TIERS = {
  7: { gridN: 7, targetIslands: 6, minIslands: 5 },
  9: { gridN: 9, targetIslands: 9, minIslands: 7 },
  11: { gridN: 11, targetIslands: 13, minIslands: 10 },
  13: { gridN: 13, targetIslands: 17, minIslands: 13 },
};

export const BRIDGES_TIER_HINTS = {
  en: {
    7: 'Warm-up · few islands',
    9: 'Tricky · plan the network',
    11: 'Hard · watch the crossings',
    13: 'Expert · dense archipelago',
  },
  ar: {
    7: 'تمهيدي · جزر قليلة',
    9: 'صعب · خطّط الشبكة',
    11: 'شاق · انتبه للتقاطعات',
    13: 'خبير · أرخبيل كثيف',
  },
};

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function inBounds(n, r, c) {
  return r >= 0 && r < n && c >= 0 && c < n;
}

function rangeArray(a, b) {
  const out = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

/* ── 1. Build a random valid connected solution graph ───────────────────── */
function tryBuildSolution(gridN, spec, rng) {
  // occ: 0 empty, 1 island, 2 horizontal bridge, 3 vertical bridge
  const occ = Array.from({ length: gridN }, () => Array(gridN).fill(0));
  const idAt = Array.from({ length: gridN }, () => Array(gridN).fill(-1));
  const islands = []; // {r,c}
  const deg = [];
  const solEdges = new Map(); // "a,b" (a<b island ids) -> bridge count

  function addIsland(r, c) {
    const id = islands.length;
    islands.push({ r, c });
    deg.push(0);
    occ[r][c] = 1;
    idAt[r][c] = id;
    return id;
  }

  // First island somewhere off the very edge.
  addIsland(1 + Math.floor(rng() * (gridN - 2)), 1 + Math.floor(rng() * (gridN - 2)));

  const maxTries = spec.targetIslands * 80;
  let tries = 0;
  while (islands.length < spec.targetIslands && tries < maxTries) {
    tries++;
    const A = Math.floor(rng() * islands.length);
    const { r: ar, c: ac } = islands[A];
    const [dr, dc] = DIRS[Math.floor(rng() * 4)];
    const horiz = dr === 0;

    // Walk outward collecting empty cells until we hit a wall, an island or a bridge.
    const empties = [];
    let rr = ar + dr;
    let cc = ac + dc;
    let hitIsland = -1;
    while (inBounds(gridN, rr, cc)) {
      if (occ[rr][cc] === 1) { hitIsland = idAt[rr][cc]; break; }
      if (occ[rr][cc] !== 0) break; // bridge in the way → blocked
      empties.push([rr, cc]);
      rr += dr;
      cc += dc;
    }

    // Occasionally add an extra bridge to an existing island (creates cycles).
    if (hitIsland >= 0 && empties.length >= 1 && rng() < 0.34) {
      const a = Math.min(A, hitIsland);
      const b = Math.max(A, hitIsland);
      const key = `${a},${b}`;
      if (!solEdges.has(key)) {
        const cnt = rng() < 0.5 ? 2 : 1;
        if (deg[A] + cnt <= 8 && deg[hitIsland] + cnt <= 8) {
          for (const [er, ec] of empties) occ[er][ec] = horiz ? 2 : 3;
          solEdges.set(key, cnt);
          deg[A] += cnt;
          deg[hitIsland] += cnt;
        }
      }
      continue;
    }

    // Otherwise place a NEW island (needs ≥1 gap cell, so target index ≥1).
    if (empties.length >= 2) {
      const order = shuffle(rangeArray(1, empties.length - 1), rng);
      for (const ti of order) {
        const [tr, tc] = empties[ti];
        // Keep islands apart: no orthogonal neighbour may already be an island.
        let okNeighbours = true;
        for (const [nr, nc] of DIRS.map(([x, y]) => [tr + x, tc + y])) {
          if (inBounds(gridN, nr, nc) && occ[nr][nc] === 1) { okNeighbours = false; break; }
        }
        if (!okNeighbours) continue;
        const cnt = rng() < 0.45 ? 2 : 1;
        if (deg[A] + cnt > 8) continue;
        const between = empties.slice(0, ti);
        const B = addIsland(tr, tc);
        for (const [er, ec] of between) occ[er][ec] = horiz ? 2 : 3;
        const a = Math.min(A, B);
        const b = Math.max(A, B);
        solEdges.set(`${a},${b}`, cnt);
        deg[A] += cnt;
        deg[B] += cnt;
        break;
      }
    }
  }

  if (islands.length < 2) return null;
  return { islands, solEdges };
}

/* ── 2. Potential edges (visible orthogonal neighbours) + crossings ─────── */
function buildEdges(islands, gridN) {
  const idAt = Array.from({ length: gridN }, () => Array(gridN).fill(-1));
  islands.forEach((p, i) => { idAt[p.r][p.c] = i; });

  const edges = [];
  const seen = new Set();
  function add(i, j, orient) {
    const a = Math.min(i, j);
    const b = Math.max(i, j);
    const key = `${a},${b}`;
    if (seen.has(key)) return;
    seen.add(key);
    const A = islands[a];
    const B = islands[b];
    edges.push({
      a, b, orient, key,
      r1: Math.min(A.r, B.r), r2: Math.max(A.r, B.r),
      c1: Math.min(A.c, B.c), c2: Math.max(A.c, B.c),
    });
  }

  islands.forEach((p, i) => {
    for (let cc = p.c + 1; cc < gridN; cc++) { if (idAt[p.r][cc] >= 0) { add(i, idAt[p.r][cc], 'h'); break; } }
    for (let rr = p.r + 1; rr < gridN; rr++) { if (idAt[rr][p.c] >= 0) { add(i, idAt[rr][p.c], 'v'); break; } }
  });

  const crossings = edges.map(() => []);
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const e = edges[i];
      const f = edges[j];
      if (e.orient === f.orient) continue;
      const h = e.orient === 'h' ? e : f;
      const v = e.orient === 'h' ? f : e;
      const R = h.r1; // h.r1 === h.r2
      const C = v.c1; // v.c1 === v.c2
      if (R > v.r1 && R < v.r2 && C > h.c1 && C < h.c2) {
        crossings[i].push(j);
        crossings[j].push(i);
      }
    }
  }

  return { edges, crossings };
}

/* ── 3. Count solutions (stop at `limit`); honours crossings + connectivity ─ */
function countSolutions(nIsl, edges, crossings, needs, limit, budget) {
  const E = edges.length;
  const incident = Array.from({ length: nIsl }, () => []);
  edges.forEach((e, i) => { incident[e.a].push(i); incident[e.b].push(i); });

  // Assign most-constrained edges first for stronger pruning.
  const order = [...Array(E).keys()].sort((x, y) => {
    const sx = incident[edges[x].a].length + incident[edges[x].b].length;
    const sy = incident[edges[y].a].length + incident[edges[y].b].length;
    return sx - sy;
  });

  const val = new Int8Array(E).fill(-1);
  const sum = new Int16Array(nIsl);
  const rem = new Int16Array(nIsl);
  for (let k = 0; k < nIsl; k++) rem[k] = 2 * incident[k].length;

  let count = 0;
  let nodes = 0;
  let overBudget = false;

  const ok = (k) => sum[k] <= needs[k] && sum[k] + rem[k] >= needs[k];

  function connected() {
    const parent = [...Array(nIsl).keys()];
    const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    for (let i = 0; i < E; i++) if (val[i] > 0) parent[find(edges[i].a)] = find(edges[i].b);
    const root = find(0);
    for (let k = 1; k < nIsl; k++) if (find(k) !== root) return false;
    return true;
  }

  function rec(pos) {
    if (count >= limit || overBudget) return;
    if (++nodes > budget) { overBudget = true; return; }
    if (pos === E) { if (connected()) count++; return; }
    const idx = order[pos];
    const { a, b } = edges[idx];
    for (let v = 2; v >= 0; v--) {
      if (v > 0) {
        let bad = false;
        for (const j of crossings[idx]) if (val[j] > 0) { bad = true; break; }
        if (bad) continue;
      }
      val[idx] = v;
      sum[a] += v; sum[b] += v; rem[a] -= 2; rem[b] -= 2;
      if (ok(a) && ok(b)) rec(pos + 1);
      sum[a] -= v; sum[b] -= v; rem[a] += 2; rem[b] += 2; val[idx] = -1;
      if (count >= limit || overBudget) return;
    }
  }

  rec(0);
  return overBudget ? -1 : count;
}

/* ── Public: generate a uniquely-solvable puzzle ────────────────────────── */
export function generateBridges(tier, seedInput) {
  const spec = TIERS[tier] ?? TIERS[9];
  const gridN = spec.gridN;

  for (let attempt = 0; attempt < 220; attempt++) {
    const rng = createRng((seedInput + attempt * 7919) >>> 0);
    const built = tryBuildSolution(gridN, spec, rng);
    if (!built || built.islands.length < spec.minIslands) continue;

    const { islands, solEdges } = built;
    const { edges, crossings } = buildEdges(islands, gridN);

    const solution = new Array(edges.length).fill(0);
    let mapped = true;
    for (const [key, cnt] of solEdges) {
      const idx = edges.findIndex((e) => e.key === key);
      if (idx < 0) { mapped = false; break; }
      solution[idx] = cnt;
    }
    if (!mapped) continue;

    const needs = islands.map(() => 0);
    edges.forEach((e, i) => { needs[e.a] += solution[i]; needs[e.b] += solution[i]; });
    if (needs.some((n) => n < 1 || n > 8)) continue;

    const solutions = countSolutions(islands.length, edges, crossings, needs, 2, 200000);
    if (solutions !== 1) continue;

    islands.forEach((isl, i) => { isl.need = needs[i]; });
    return {
      tier, gridN, islands, edges, crossings,
      solution,
      player: new Array(edges.length).fill(0),
      seed: (seedInput + attempt) >>> 0,
    };
  }

  return fallbackPuzzle(tier, gridN, seedInput);
}

/** Trivially-unique 4-island ring — only used if generation somehow fails. */
function fallbackPuzzle(tier, gridN, seed) {
  const a = 1;
  const b = gridN - 2;
  const mid = Math.floor(gridN / 2);
  const islands = [
    { r: a, c: a }, { r: a, c: mid }, { r: b, c: a }, { r: b, c: mid },
  ];
  const { edges, crossings } = buildEdges(islands, gridN);
  const solution = edges.map(() => 1);
  const needs = islands.map(() => 0);
  edges.forEach((e, i) => { needs[e.a] += solution[i]; needs[e.b] += solution[i]; });
  islands.forEach((isl, i) => { isl.need = needs[i]; });
  return {
    tier, gridN, islands, edges, crossings,
    solution,
    player: new Array(edges.length).fill(0),
    seed: seed >>> 0,
  };
}

/* ── Gameplay helpers ───────────────────────────────────────────────────── */
export function findEdgeIndex(state, a, b) {
  const key = `${Math.min(a, b)},${Math.max(a, b)}`;
  return state.edges.findIndex((e) => e.key === key);
}

export function islandSums(state) {
  const sums = state.islands.map(() => 0);
  state.edges.forEach((e, i) => { sums[e.a] += state.player[i]; sums[e.b] += state.player[i]; });
  return sums;
}

/** Cycle the bridge count between two islands 0→1→2→0. Increases are blocked
 *  when a crossing bridge is already in place (returns the same state object). */
export function cycleBridgeByIslands(state, a, b) {
  const i = findEdgeIndex(state, a, b);
  if (i < 0) return state;
  const cur = state.player[i];
  const next = (cur + 1) % 3;
  if (next > cur) {
    for (const j of state.crossings[i]) if (state.player[j] > 0) return state; // would cross
  }
  const player = state.player.slice();
  player[i] = next;
  return { ...state, player };
}

export function resetBridges(state) {
  return { ...state, player: new Array(state.edges.length).fill(0) };
}

export function isBridgesSolved(state) {
  const sums = islandSums(state);
  for (let k = 0; k < state.islands.length; k++) {
    if (sums[k] !== state.islands[k].need) return false;
  }
  const n = state.islands.length;
  const parent = [...Array(n).keys()];
  const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
  state.edges.forEach((e, i) => { if (state.player[i] > 0) parent[find(e.a)] = find(e.b); });
  const root = find(0);
  for (let k = 1; k < n; k++) if (find(k) !== root) return false;
  return true;
}

/** Hint: undo a wrong extra bridge, else add a correct missing one. */
export function hintReveal(state) {
  const { edges, crossings, player, solution } = state;
  for (let i = 0; i < edges.length; i++) {
    if (player[i] > solution[i]) {
      const np = player.slice();
      np[i] = player[i] - 1;
      return { next: { ...state, player: np }, revealed: true };
    }
  }
  for (let i = 0; i < edges.length; i++) {
    if (player[i] < solution[i]) {
      let blocked = false;
      for (const j of crossings[i]) if (player[j] > 0) { blocked = true; break; }
      if (blocked) continue;
      const np = player.slice();
      np[i] = player[i] + 1;
      return { next: { ...state, player: np }, revealed: true };
    }
  }
  return { next: state, revealed: false };
}

export function tierSubtitle(state, isAr) {
  const n = state.islands.length;
  if (isAr) {
    const g = toArabicDigits(state.gridN);
    return `${g}×${g} · ${toArabicDigits(n)} جزيرة`;
  }
  return `${state.gridN}×${state.gridN} · ${n} islands`;
}
