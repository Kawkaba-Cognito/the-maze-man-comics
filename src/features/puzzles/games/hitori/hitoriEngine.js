import { createRng, shuffle } from '../../shared/rng';

/*
 * HITORI engine (authentic rules).
 *
 * Play: shade cells so that
 *   (A) no number repeats among the UNSHADED cells of any row or column,
 *   (B) no two shaded cells are orthogonally adjacent,
 *   (C) all unshaded cells form one orthogonally-connected region.
 *
 * Generation = construct a target solution, then guarantee it's the ONLY one:
 *   1. Shade an independent set whose unshaded complement stays connected, made
 *      as large as possible (so the board is meaty and well-constrained).
 *   2. Number the grid as a Latin square (each value once per row/column), then
 *      give every shaded cell the value of a white neighbour — a real duplicate
 *      that justifies shading it.
 *   3. Verify uniqueness with a backtracking solver. While a second solution S'
 *      exists, kill it: take a cell shaded in our solution but white in S', and
 *      set its number equal to another cell that is white in BOTH. That makes S'
 *      break rule (A) while leaving our solution untouched (it's shaded there).
 *      Repeat until the solver finds exactly one solution.
 */

const UNK = 0, WHITE = 1, BLACK = 2;

function neighbors4(size, r, c) {
  const out = [];
  if (r > 0) out.push([r - 1, c]);
  if (r < size - 1) out.push([r + 1, c]);
  if (c > 0) out.push([r, c - 1]);
  if (c < size - 1) out.push([r, c + 1]);
  return out;
}

function hasShadedNeighbor(shaded, size, r, c) {
  return neighbors4(size, r, c).some(([nr, nc]) => shaded[nr][nc]);
}

/** Are all unshaded cells one orthogonally-connected region? (rule C) */
export function unshadedConnected(shaded) {
  const size = shaded.length;
  let start = null;
  let total = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) if (!shaded[r][c]) { total++; if (!start) start = [r, c]; }
  }
  if (!start) return false;
  const seen = Array.from({ length: size }, () => Array(size).fill(false));
  const stack = [start];
  seen[start[0]][start[1]] = true;
  let reached = 0;
  while (stack.length) {
    const [r, c] = stack.pop();
    reached++;
    for (const [nr, nc] of neighbors4(size, r, c)) {
      if (!shaded[nr][nc] && !seen[nr][nc]) { seen[nr][nc] = true; stack.push([nr, nc]); }
    }
  }
  return reached === total;
}

/** Independent set, complement kept connected, grown as far as possible. */
function buildSolutionShading(size, rng) {
  const shaded = Array.from({ length: size }, () => Array(size).fill(false));
  const cells = shuffle(
    Array.from({ length: size * size }, (_, i) => [Math.floor(i / size), i % size]),
    rng
  );
  for (const [r, c] of cells) {
    if (hasShadedNeighbor(shaded, size, r, c)) continue;
    shaded[r][c] = true;
    if (!unshadedConnected(shaded)) shaded[r][c] = false; // keep whites connected
  }
  return shaded;
}

/** Latin square of values 1..size. */
function latinBase(size, rng) {
  const offset = Math.floor(rng() * size);
  const symbols = shuffle(Array.from({ length: size }, (_, i) => i + 1), rng);
  const nums = Array.from({ length: size }, () => Array(size).fill(0));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) nums[r][c] = symbols[(r + c + offset) % size];
  }
  return nums;
}

/** Give every shaded cell the number of one of its white neighbours. */
function plantDuplicates(numbers, shaded, rng) {
  const size = numbers.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!shaded[r][c]) continue;
      const white = neighbors4(size, r, c).filter(([nr, nc]) => !shaded[nr][nc]);
      if (white.length === 0) continue;
      const [pr, pc] = white[Math.floor(rng() * white.length)];
      numbers[r][c] = numbers[pr][pc];
    }
  }
}

/** Same-value peers of (r,c) within its row and column. */
function linePeers(numbers, size, r, c) {
  const v = numbers[r][c];
  const out = [];
  for (let cc = 0; cc < size; cc++) if (cc !== c && numbers[r][cc] === v) out.push([r, cc]);
  for (let rr = 0; rr < size; rr++) if (rr !== r && numbers[rr][c] === v) out.push([rr, c]);
  return out;
}

/**
 * Backtracking solver. Returns up to `cap` solutions (each a boolean shaded
 * grid). Returns null if the node budget is blown (treat as "reject").
 */
function solveHitori(numbers, size, cap = 2, budget = 1_500_000) {
  const peers = Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => linePeers(numbers, size, r, c))
  );
  const solutions = [];
  let nodes = 0;
  let blown = false;

  const connected = (st) => {
    let start = null, total = 0;
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (st[r][c] === WHITE) { total++; if (!start) start = [r, c]; }
    if (!start) return false;
    const seen = new Set([start[0] * size + start[1]]);
    const stack = [start];
    let reached = 0;
    while (stack.length) {
      const [r, c] = stack.pop();
      reached++;
      for (const [nr, nc] of neighbors4(size, r, c)) if (st[nr][nc] === WHITE && !seen.has(nr * size + nc)) { seen.add(nr * size + nc); stack.push([nr, nc]); }
    }
    return reached === total;
  };

  const propagate = (st, queue) => {
    while (queue.length) {
      const [r, c] = queue.pop();
      if (st[r][c] === WHITE) {
        for (const [pr, pc] of peers[r][c]) {
          if (st[pr][pc] === WHITE) return false;
          if (st[pr][pc] === UNK) { st[pr][pc] = BLACK; queue.push([pr, pc]); }
        }
      } else if (st[r][c] === BLACK) {
        for (const [nr, nc] of neighbors4(size, r, c)) {
          if (st[nr][nc] === BLACK) return false;
          if (st[nr][nc] === UNK) { st[nr][nc] = WHITE; queue.push([nr, nc]); }
        }
      }
    }
    return true;
  };

  const search = (st) => {
    if (solutions.length >= cap || blown) return;
    if (++nodes > budget) { blown = true; return; }
    let fr = -1, fc = -1;
    for (let r = 0; r < size && fr < 0; r++) for (let c = 0; c < size; c++) if (st[r][c] === UNK) { fr = r; fc = c; break; }
    if (fr < 0) {
      if (connected(st)) solutions.push(st.map((row) => row.map((v) => v === BLACK)));
      return;
    }
    for (const val of [WHITE, BLACK]) {
      const ns = st.map((row) => row.slice());
      ns[fr][fc] = val;
      if (propagate(ns, [[fr, fc]])) search(ns);
      if (solutions.length >= cap || blown) return;
    }
  };

  search(Array.from({ length: size }, () => Array(size).fill(UNK)));
  return blown ? null : solutions;
}

const differs = (a, b, size) => {
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (a[r][c] !== b[r][c]) return true;
  return false;
};

/** Plant extra duplicates (on shaded cells only) until the solution is unique. */
function disambiguate(numbers, solution, size, rng) {
  for (let iter = 0; iter < size * size * 2; iter++) {
    const sols = solveHitori(numbers, size, 2);
    if (sols === null) return false; // solver blew budget — reject this board
    if (sols.length <= 1) return true; // unique
    const alt = sols.find((s) => differs(s, solution, size));
    if (!alt) return true; // both found equal our solution (shouldn't happen)

    // Cells shaded in our solution but white in the alternate — break the alternate there.
    const targets = [];
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (solution[r][c] && !alt[r][c]) targets.push([r, c]);
    if (targets.length === 0) return false; // alternate shades a superset — can't fix; regenerate

    let fixed = false;
    for (const [r, c] of shuffle(targets, rng)) {
      // A peer in this row/col that is white in BOTH solutions: duplicating it
      // makes the alternate (where r,c is white) break rule A, but not ours.
      const peers = [];
      for (let cc = 0; cc < size; cc++) if (cc !== c && !solution[r][cc] && !alt[r][cc]) peers.push([r, cc]);
      for (let rr = 0; rr < size; rr++) if (rr !== r && !solution[rr][c] && !alt[rr][c]) peers.push([rr, c]);
      if (peers.length === 0) continue;
      const [pr, pc] = peers[Math.floor(rng() * peers.length)];
      numbers[r][c] = numbers[pr][pc];
      fixed = true;
      break;
    }
    if (!fixed) return false; // no usable peer — regenerate
  }
  return false;
}

export function generateHitori(size, seed) {
  for (let attempt = 0; attempt < 120; attempt++) {
    const rng = createRng((seed + attempt * 2654435761) >>> 0);
    const solution = buildSolutionShading(size, rng);
    // Need a real puzzle: at least a couple of shaded cells.
    let shadedCount = 0;
    for (const row of solution) for (const v of row) if (v) shadedCount++;
    if (shadedCount < 2) continue;

    const numbers = latinBase(size, rng);
    plantDuplicates(numbers, solution, rng);
    if (!disambiguate(numbers, solution, size, rng)) continue;

    return {
      size,
      numbers,
      solution,
      player: Array.from({ length: size }, () => Array(size).fill(false)),
      seed,
    };
  }
  // Unreachable in practice; retry from a shifted seed.
  return generateHitori(size, (seed + 1013904223) >>> 0);
}

export function toggleHitoriCell(state, r, c) {
  const player = state.player.map((row) => row.slice());
  player[r][c] = !player[r][c];
  return { ...state, player };
}

export function resetHitori(state) {
  return { ...state, player: state.player.map((row) => row.map(() => false)) };
}

function hasAdjacentShaded(player) {
  const size = player.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!player[r][c]) continue;
      for (const [nr, nc] of neighbors4(size, r, c)) if (player[nr][nc]) return true;
    }
  }
  return false;
}

function noDupesUnshaded(player, numbers) {
  const size = player.length;
  for (let r = 0; r < size; r++) {
    const seen = new Set();
    for (let c = 0; c < size; c++) {
      if (player[r][c]) continue;
      if (seen.has(numbers[r][c])) return false;
      seen.add(numbers[r][c]);
    }
  }
  for (let c = 0; c < size; c++) {
    const seen = new Set();
    for (let r = 0; r < size; r++) {
      if (player[r][c]) continue;
      if (seen.has(numbers[r][c])) return false;
      seen.add(numbers[r][c]);
    }
  }
  return true;
}

export function isHitoriSolved(state) {
  const { player, numbers } = state;
  return (
    !hasAdjacentShaded(player) &&
    noDupesUnshaded(player, numbers) &&
    unshadedConnected(player)
  );
}

/** Reveal one correct cell's shade state (paid hint). Returns { next, revealed }. */
export function hintReveal(state) {
  const { size, solution, player } = state;
  const pool = [];
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
    if (player[r][c] !== solution[r][c]) pool.push([r, c]);
  }
  if (!pool.length) return { next: state, revealed: false };
  const [r, c] = pool[Math.floor(Math.random() * pool.length)];
  const np = player.map((row) => row.slice());
  np[r][c] = solution[r][c];
  return { next: { ...state, player: np }, revealed: true };
}
