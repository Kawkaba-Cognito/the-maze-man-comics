import { createRng } from '../../shared/rng';

export function createSlidingPuzzle(size, seed) {
  const rng = createRng(seed);
  const total = size * size;
  const tiles = Array.from({ length: total - 1 }, (_, i) => i + 1);
  tiles.push(0);

  const indexOfEmpty = () => tiles.indexOf(0);

  const neighborsOf = (idx) => {
    const r = Math.floor(idx / size);
    const c = idx % size;
    const out = [];
    if (r > 0) out.push(idx - size);
    if (r < size - 1) out.push(idx + size);
    if (c > 0) out.push(idx - 1);
    if (c < size - 1) out.push(idx + 1);
    return out;
  };

  const swap = (a, b) => {
    [tiles[a], tiles[b]] = [tiles[b], tiles[a]];
  };

  const solved = () => {
    for (let i = 0; i < total - 1; i++) if (tiles[i] !== i + 1) return false;
    return tiles[total - 1] === 0;
  };

  const scramble = (steps) => {
    let lastEmpty = -1;
    for (let i = 0; i < steps; i++) {
      const empty = indexOfEmpty();
      let opts = neighborsOf(empty).filter((n) => n !== lastEmpty);
      if (opts.length === 0) opts = neighborsOf(empty);
      const pick = opts[Math.floor(rng() * opts.length)];
      swap(empty, pick);
      lastEmpty = empty;
    }
  };

  const scrambleSteps = Math.max(80, size * size * 40);
  scramble(scrambleSteps);
  // Guard: a random walk can (rarely) land back on the solved state — keep going.
  let guard = 0;
  while (solved() && guard++ < 20) scramble(size * size * 4);

  return { size, tiles: tiles.slice(), moves: 0, seed };
}

/**
 * Slide the tapped tile toward the blank. If the tile shares the blank's row or
 * column, the whole line of tiles between them slides at once (modern style).
 * Move count increases by the number of tiles that moved.
 */
export function trySlide(state, tileIndex) {
  const { size, tiles, moves } = state;
  if (tiles[tileIndex] === 0) return state;
  const empty = tiles.indexOf(0);
  const er = Math.floor(empty / size);
  const ec = empty % size;
  const tr = Math.floor(tileIndex / size);
  const tc = tileIndex % size;

  const next = tiles.slice();
  let moved = 0;

  if (tr === er) {
    if (tc < ec) for (let c = ec; c > tc; c--) next[tr * size + c] = next[tr * size + c - 1];
    else for (let c = ec; c < tc; c++) next[tr * size + c] = next[tr * size + c + 1];
    moved = Math.abs(tc - ec);
  } else if (tc === ec) {
    if (tr < er) for (let r = er; r > tr; r--) next[r * size + tc] = next[(r - 1) * size + tc];
    else for (let r = er; r < tr; r++) next[r * size + tc] = next[(r + 1) * size + tc];
    moved = Math.abs(tr - er);
  } else {
    return state; // not in line with the blank
  }

  next[tileIndex] = 0;
  return { ...state, tiles: next, moves: moves + moved };
}

export function isSlidingSolved({ size, tiles }) {
  const total = size * size;
  for (let i = 0; i < total - 1; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[total - 1] === 0;
}

function manhattanDist(tiles, size) {
  let d = 0;
  for (let i = 0; i < tiles.length; i++) {
    const v = tiles[i];
    if (v === 0) continue;
    const gr = Math.floor((v - 1) / size), gc = (v - 1) % size;
    d += Math.abs(Math.floor(i / size) - gr) + Math.abs((i % size) - gc);
  }
  return d;
}

/** Tiny binary min-heap keyed on `.f` (for the A* hint solver). */
function makeHeap() {
  const a = [];
  const up = (i) => { while (i > 0) { const p = (i - 1) >> 1; if (a[p].f <= a[i].f) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } };
  const down = (i) => { const n = a.length; for (;;) { const l = 2 * i + 1, r = 2 * i + 2; let s = i; if (l < n && a[l].f < a[s].f) s = l; if (r < n && a[r].f < a[s].f) s = r; if (s === i) break; [a[s], a[i]] = [a[i], a[s]]; i = s; } };
  return { push(x) { a.push(x); up(a.length - 1); }, pop() { const t = a[0], e = a.pop(); if (a.length) { a[0] = e; down(0); } return t; }, get size() { return a.length; } };
}

/**
 * Weighted A* (f = g + 2·Manhattan) that returns the FIRST tile-slide on a real
 * solution path from the current board. Because it follows an actual path to the
 * goal, repeated hints make guaranteed monotonic progress and never cycle.
 * Bounded by a node budget; returns null if the search is too large (big boards),
 * in which case the caller falls back to the greedy heuristic.
 */
function solveNextMove(state) {
  const { size, tiles } = state;
  if (isSlidingSolved(state)) return null;
  const total = size * size;
  const goalKey = Array.from({ length: total }, (_, i) => (i === total - 1 ? 0 : i + 1)).join(',');
  const startKey = tiles.join(',');
  const W = 2;
  const BUDGET = 120000;
  const heap = makeHeap();
  const g = new Map([[startKey, 0]]);
  const parent = new Map(); // key -> { pk, move }
  heap.push({ key: startKey, tiles, blank: tiles.indexOf(0), f: W * manhattanDist(tiles, size) });
  let nodes = 0;
  let found = false;
  while (heap.size && nodes < BUDGET) {
    const cur = heap.pop();
    nodes++;
    if (cur.key === goalKey) { found = true; break; }
    const cg = g.get(cur.key);
    if (cg === undefined) continue;
    const br = Math.floor(cur.blank / size), bc = cur.blank % size;
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = br + dr, nc = bc + dc;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
      const ni = nr * size + nc;
      const nt = cur.tiles.slice();
      nt[cur.blank] = nt[ni]; nt[ni] = 0;
      const nk = nt.join(',');
      const ng = cg + 1;
      if (g.has(nk) && g.get(nk) <= ng) continue;
      g.set(nk, ng);
      parent.set(nk, { pk: cur.key, move: ni });
      heap.push({ key: nk, tiles: nt, blank: ni, f: ng + W * manhattanDist(nt, size) });
    }
  }
  if (!found) return null;
  let k = goalKey;
  let firstMove = null;
  while (k !== startKey) {
    const p = parent.get(k);
    if (!p) return null;
    firstMove = p.move;
    k = p.pk;
  }
  return firstMove;
}

/**
 * Hint: prefer an exact next move from a weighted-A* solution path (guaranteed
 * progress, no cycling). If the board is too large for the search budget, fall
 * back to a bounded greedy lookahead toward the closest-to-solved board.
 */
export function hintReveal(state) {
  if (isSlidingSolved(state)) return { next: state, revealed: false };
  // Exact A* path is fast + cycle-free on small boards; larger boards would risk
  // a slow per-tap search, so they use the bounded greedy heuristic below.
  if (state.size <= 4) {
    const exact = solveNextMove(state);
    if (exact != null) return { next: trySlide(state, exact), revealed: true };
  }
  const { size, tiles } = state;
  let frontier = [{ tiles, blank: tiles.indexOf(0), first: null }];
  const seen = new Set([tiles.join(',')]);
  let bestD = manhattanDist(tiles, size);
  let bestFirst = null;
  const DEPTH = 14, CAP = 30000;
  for (let depth = 0; depth < DEPTH && frontier.length && seen.size < CAP; depth++) {
    const nf = [];
    for (const node of frontier) {
      const br = Math.floor(node.blank / size), bc = node.blank % size;
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nr = br + dr, nc = bc + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        const ni = nr * size + nc;
        const nt = node.tiles.slice();
        nt[node.blank] = nt[ni]; nt[ni] = 0;
        const k = nt.join(',');
        if (seen.has(k)) continue;
        seen.add(k);
        const first = node.first == null ? ni : node.first; // first move = neighbor that slid in
        const d = manhattanDist(nt, size);
        if (d < bestD) { bestD = d; bestFirst = first; }
        nf.push({ tiles: nt, blank: ni, first });
      }
    }
    frontier = nf;
  }
  if (bestFirst == null) {
    // Nothing improved within the horizon — take the least-worsening single move.
    const empty = tiles.indexOf(0);
    const er = Math.floor(empty / size), ec = empty % size;
    const nbrs = [];
    if (er > 0) nbrs.push(empty - size);
    if (er < size - 1) nbrs.push(empty + size);
    if (ec > 0) nbrs.push(empty - 1);
    if (ec < size - 1) nbrs.push(empty + 1);
    let bD = Infinity;
    for (const idx of nbrs) { const d = manhattanDist(trySlide(state, idx).tiles, size); if (d < bD) { bD = d; bestFirst = idx; } }
  }
  return bestFirst == null ? { next: state, revealed: false } : { next: trySlide(state, bestFirst), revealed: true };
}
