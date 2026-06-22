/*
 * COLOUR SORT — a tube/token sorting puzzle (Ball-Sort genre, with sizes).
 *
 * Tokens have a COLOUR and a SIZE (number). They sit in tubes (pegs), capacity
 * M each. A token may be moved onto a tube only if the tube isn't full AND it is
 * empty OR its top token is the SAME colour and a LARGER size. You win when each
 * colour is gathered on its own tube (which is then automatically size-sorted).
 *
 * Unlike a Hanoi stack, a tube may START with mixed colours / mixed order — that
 * is the scramble. Such states are NOT reachable from solved by legal moves
 * (moves never place unlike colours together), so the move graph is DIRECTED and
 * a random deal might be unsolvable. We therefore GENERATE by random deal then
 * BFS-verify: BFS to solved gives true minimum moves (par) and proves solvable.
 *
 * Pure JS, no React. token = { c: colourIndex, s: size }  (s: 1 small … M large)
 */

export const SORT_COLORS = ['#e0584f', '#5fa9d8', '#8fbf6a', '#e6b13a', '#b07fd0', '#48b6a8', '#e07ab0'];

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export const topDisk = (peg) => (peg.length ? peg[peg.length - 1] : null);

/** Solved board: each colour on its own tube, sizes M..1 bottom→top; spares empty. */
export function makeSolved(C, M, P) {
  const pegs = Array.from({ length: P }, () => []);
  for (let c = 0; c < C; c++) for (let s = M; s >= 1; s--) pegs[c].push({ c, s });
  return pegs;
}

export function canMove(pegs, from, to, cap) {
  if (from === to) return false;
  const d = topDisk(pegs[from]);
  if (!d) return false;
  if (pegs[to].length >= cap) return false;       // tube full
  const e = topDisk(pegs[to]);
  if (!e) return true;                              // empty tube
  return e.c === d.c && e.s > d.s;                 // same colour, smaller on larger
}

/** Why a move was rejected — for player-facing hints. */
export function moveRejectReason(pegs, from, to, cap) {
  if (from === to) return 'same';
  if (!topDisk(pegs[from])) return 'empty';
  if (pegs[to].length >= cap) return 'full';
  const d = topDisk(pegs[from]);
  const e = topDisk(pegs[to]);
  if (e && e.c !== d.c) return 'colour';
  if (e && e.s <= d.s) return 'size';
  return 'unknown';
}

export function applyMove(state, from, to) {
  if (!canMove(state.pegs, from, to, state.cap)) return { state, ok: false };
  const pegs = state.pegs.map((p) => p.slice());
  pegs[to].push(pegs[from].pop());
  return { state: { ...state, pegs, moves: state.moves + 1 }, ok: true };
}

export function legalMoves(pegs, cap) {
  const out = [];
  for (let from = 0; from < pegs.length; from++) {
    if (!pegs[from].length) continue;
    for (let to = 0; to < pegs.length; to++) if (canMove(pegs, from, to, cap)) out.push([from, to]);
  }
  return out;
}

/**
 * Solved when every non-empty tube is ONE colour, SIZE-ORDERED (largest at the
 * bottom → smallest on top), and no colour is split across tubes.
 *
 * The size-order check matters: the scramble can deal a colour's tokens onto a
 * single tube already grouped but in jumbled size order. Without this check the
 * game would call that "solved" once the other colours are separated, even
 * though that tube's numbers are still out of order.
 */
export function isSolved(pegs) {
  const seen = new Set();
  for (const peg of pegs) {
    if (!peg.length) continue;
    const c = peg[0].c;
    for (let i = 0; i < peg.length; i++) {
      if (peg[i].c !== c) return false;                   // mixed colour
      if (i > 0 && peg[i].s >= peg[i - 1].s) return false; // not strictly smaller going up
    }
    if (seen.has(c)) return false;                        // colour split across tubes
    seen.add(c);
  }
  return true;
}

function canonKey(pegs) {
  return pegs.map((p) => p.map((d) => d.c * 100 + d.s).join('.')).sort().join('|');
}
const clonePegs = (pegs) => pegs.map((p) => p.slice());

/** Random mixed deal: all C·M tokens shuffled into the first C tubes (M each). */
function dealMixed(C, M, P, rng) {
  const all = [];
  for (let c = 0; c < C; c++) for (let s = 1; s <= M; s++) all.push({ c, s });
  const bag = shuffle(all, rng);
  const pegs = Array.from({ length: P }, () => []);
  for (let i = 0; i < bag.length; i++) pegs[Math.floor(i / M)].push(bag[i]);
  return pegs;
}

/**
 * BFS from `pegs` to a solved state. Returns minimum moves (true par) or null if
 * unsolvable within the node budget. Forward (directed) search.
 */
export function bfsMinMoves(pegs, cap, nodeCap = 250000) {
  if (isSolved(pegs)) return 0;
  const seen = new Set([canonKey(pegs)]);
  let frontier = [pegs];
  let depth = 0;
  let nodes = 0;
  while (frontier.length) {
    const next = [];
    for (const cur of frontier) {
      if (++nodes > nodeCap) return null;
      for (const [f, t] of legalMoves(cur, cap)) {
        const r = applyMove({ pegs: cur, cap, moves: 0 }, f, t);
        if (isSolved(r.state.pegs)) return depth + 1;
        const k = canonKey(r.state.pegs);
        if (!seen.has(k)) { seen.add(k); next.push(r.state.pegs); }
      }
    }
    frontier = next;
    depth += 1;
  }
  return null;
}

/** Count colours not already fully gathered on one tube (a mixedness measure). */
export function disturbedColours(pegs, C) {
  const home = new Array(C).fill(0); // tubes holding each colour
  const mixed = new Set();
  for (const peg of pegs) {
    const cs = new Set(peg.map((d) => d.c));
    if (cs.size > 1) { for (const c of cs) mixed.add(c); }
    if (cs.size === 1 && peg.length) home[[...cs][0]] += 1;
  }
  let disturbed = 0;
  for (let c = 0; c < C; c++) if (mixed.has(c) || home[c] !== 1) disturbed++;
  return disturbed;
}

/**
 * Generate a well-mixed, solvable puzzle whose true optimal ≥ minPar and that
 * disturbs at least `minDisturbed` colours. Random deal + BFS-verify + retry.
 */
export function generateColourSort({ colours: C, sizes: M, pegs: P, minPar = 6, minDisturbed = 2, seed = (Math.random() * 1e9) | 0, nodeCap = 200000, maxTries = 200 }) {
  const rng = mulberry32(seed);
  let best = null;
  for (let t = 0; t < maxTries; t++) {
    const pegs = dealMixed(C, M, P, rng);
    if (isSolved(pegs)) continue;
    const dist = disturbedColours(pegs, C);
    if (dist < minDisturbed) continue;
    const par = bfsMinMoves(pegs, M, nodeCap);
    if (par == null) continue;                 // unsolvable or too deep — skip
    if (par >= minPar) return { pegs, moves: 0, cap: M, C, M, P, par, disturbed: dist, seed, initial: clonePegs(pegs) };
    if (!best || par > best.par) best = { pegs, moves: 0, cap: M, C, M, P, par, disturbed: dist, seed, initial: clonePegs(pegs) };
  }
  if (best) return best;
  // Fallback: a guaranteed-solvable deal (one move off solved) — should be rare.
  const solved = makeSolved(C, M, P);
  const r = applyMove({ pegs: solved, cap: M, moves: 0 }, 0, C); // move a token to a spare
  const pegs = r.ok ? r.state.pegs : solved;
  return { pegs, moves: 0, cap: M, C, M, P, par: 1, disturbed: 1, seed, initial: clonePegs(pegs) };
}
