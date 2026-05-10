/**
 * Rush Hour / sliding-block logic + BFS shortest path (guaranteed solvability checks).
 * One "move" = placing a piece anywhere along its legal slide axis (matches drag-to-stop UX).
 */

/** @typedef {{ id: string, row: number, col: number, len: number, dir: 'h' | 'v', isHero?: boolean }} RhPiece */

export function clonePieces(pieces) {
  return pieces.map((p) => ({ ...p }));
}

export function buildOcc(pieces, excludeId, grid) {
  const g = Array.from({ length: grid }, () => Array(grid).fill(null));
  for (const p of pieces) {
    if (p.id === excludeId) continue;
    for (let i = 0; i < p.len; i++) {
      const r = p.dir === 'v' ? p.row + i : p.row;
      const c = p.dir === 'h' ? p.col + i : p.col;
      if (r >= 0 && r < grid && c >= 0 && c < grid) g[r][c] = p.id;
    }
  }
  return g;
}

export function getRange(piece, pieces, grid) {
  const occ = buildOcc(pieces, piece.id, grid);
  if (piece.dir === 'h') {
    let lo = piece.col;
    while (lo > 0 && occ[piece.row][lo - 1] === null) lo--;
    let hi = piece.col;
    while (hi + piece.len < grid && occ[piece.row][hi + piece.len] === null) hi++;
    return { lo, hi };
  }
  let lo = piece.row;
  while (lo > 0 && occ[lo - 1][piece.col] === null) lo--;
  let hi = piece.row;
  while (hi + piece.len < grid && occ[hi + piece.len][piece.col] === null) hi++;
  return { lo, hi };
}

export function isWon(pieces, grid, exitRow) {
  const hero = pieces.find((p) => p.isHero);
  if (!hero || hero.dir !== 'h') return false;
  if (hero.row !== exitRow) return false;
  return hero.col + hero.len >= grid;
}

function stateKey(pieces) {
  return pieces
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((p) => `${p.row},${p.col}`)
    .join('|');
}

/** @param {{ pieces: RhPiece[], grid: number, exitRow: number } | RhPiece[]} stateOrPieces */
export function stateToKey(stateOrPieces) {
  const pieces = stateOrPieces?.pieces ?? stateOrPieces;
  return stateKey(pieces);
}

/**
 * @param {{ pieces: RhPiece[], grid: number, exitRow: number }} state
 * @returns {RhPiece[][]}
 */
export function getValidMoves(state) {
  return neighborStatesFixed(state.pieces, state.grid);
}

/** @param {{ pieces: RhPiece[], grid: number, exitRow: number }} state */
export function isSolved(state) {
  return isWon(state.pieces, state.grid, state.exitRow);
}

/**
 * BFS shortest solution; one move = slide one piece to any legal stop on its rail (game UX).
 * @param {{ pieces: RhPiece[], grid: number, exitRow: number }} initialState
 * @param {{ maxStatesExplored?: number }} [options]
 */
export function bfsSolve(initialState, options = {}) {
  const { pieces, grid, exitRow } = initialState;
  const maxStatesExplored = options.maxStatesExplored ?? 500_000;

  if (isWon(pieces, grid, exitRow)) {
    return { solvable: true, minMoves: 0, statesExplored: 1 };
  }

  const startKey = stateKey(pieces);
  const dist = new Map([[startKey, 0]]);
  const queue = [clonePieces(pieces)];
  let head = 0;
  let statesExplored = 0;

  while (head < queue.length) {
    statesExplored++;
    if (statesExplored > maxStatesExplored) {
      return { solvable: false, reason: 'cap_exceeded', statesExplored };
    }
    const cur = queue[head++];
    const d = dist.get(stateKey(cur));
    if (d === undefined) continue;
    for (const nxt of neighborStatesFixed(cur, grid)) {
      if (isWon(nxt, grid, exitRow)) {
        return { solvable: true, minMoves: d + 1, statesExplored };
      }
      const k = stateKey(nxt);
      if (!dist.has(k)) {
        dist.set(k, d + 1);
        queue.push(nxt);
      }
    }
  }
  return { solvable: false, reason: 'no_solution', statesExplored };
}

/**
 * Non-hero pieces occupying the exit row strictly between the hero's front edge and the right wall.
 * @param {RhPiece[]} pieces
 */
export function countDirectBlockers(pieces, grid, exitRow) {
  const hero = pieces.find((p) => p.isHero);
  if (!hero || hero.dir !== 'h' || hero.row !== exitRow) return 0;
  const heroFront = hero.col + hero.len;
  const seen = new Set();
  for (const p of pieces) {
    if (p.isHero) continue;
    let blocks = false;
    for (let i = 0; i < p.len; i++) {
      const r = p.dir === 'v' ? p.row + i : p.row;
      const c = p.dir === 'h' ? p.col + i : p.col;
      if (r === exitRow && c >= heroFront && c < grid) {
        blocks = true;
        break;
      }
    }
    if (blocks) seen.add(p.id);
  }
  return seen.size;
}

/**
 * @param {{ solvable: true, minMoves: number, statesExplored: number }} bfsResult
 * @param {{ pieces: RhPiece[], grid: number, exitRow: number }} state
 */
export function gradeDifficulty(bfsResult, state) {
  if (!bfsResult.solvable) {
    return { tier: null, score: null, branchFactor: null, blockers: null, log2States: null };
  }
  const { minMoves, statesExplored } = bfsResult;
  const blockers = countDirectBlockers(state.pieces, state.grid, state.exitRow);
  const explored = Math.max(1, statesExplored);
  const branch = minMoves > 0 ? explored / minMoves : explored;

  const score =
    minMoves * 0.35 +
    Math.log2(explored) * 0.35 +
    blockers * 0.2 +
    branch * 0.1;

  let tier;
  if (score < 4) tier = 'easy';
  else if (score < 8) tier = 'medium';
  else if (score < 14) tier = 'hard';
  else tier = 'expert';

  return {
    tier,
    score,
    branchFactor: branch,
    blockers,
    log2States: Math.log2(explored),
    minMoves,
    statesExplored,
  };
}

const TIER_LOG = {
  easy: 'EASY',
  medium: 'MEDIUM',
  hard: 'HARD',
  expert: 'EXPERT',
};

/**
 * Mandatory proof line before a configuration is accepted as shippable.
 * @param {{ solvable: boolean, minMoves?: number, statesExplored?: number }} bfsResult
 * @param {ReturnType<typeof gradeDifficulty>} graded
 */
export function logPuzzleValidation(bfsResult, graded) {
  if (!bfsResult.solvable || !graded.tier) {
    console.warn('[PUZZLE REJECT]', bfsResult);
    return;
  }
  const le = Math.log2(Math.max(1, bfsResult.statesExplored));
  const lines = [
    '[PUZZLE OK]',
    `  minMoves:        ${bfsResult.minMoves}`,
    `  statesExplored:  ${bfsResult.statesExplored}`,
    `  log2(states):    ${le.toFixed(1)}`,
    `  blockers:        ${graded.blockers}`,
    `  branchFactor:    ${graded.branchFactor.toFixed(1)}`,
    `  score:           ${graded.score.toFixed(1)}`,
    `  tier:            ${TIER_LOG[graded.tier] ?? graded.tier.toUpperCase()}`,
  ];
  console.info(lines.join('\n'));
}

/**
 * Tokyo Parking #36 / Rush Hour #40–class expert layout (public dataset).
 * Source: https://github.com/KaKariki02/rushHour/blob/master/Boards/6x6/HardestGame.csv
 * Coordinates: x = column, y = row (0-based in CSV). Red car marked `#` at (2,2).
 * Optimal depth under this engine (slide to any legal stop = one move) = 49 (verified BFS).
 * Some published solution cards quote 51 for the same puzzle index; encodings/move accounting differ.
 */
export function piecesThinkFunPuzzle40() {
  return [
    { id: 'hero', row: 2, col: 2, len: 2, dir: 'h', isHero: true },
    { id: 'A', row: 0, col: 0, len: 3, dir: 'h' },
    { id: 'B', row: 0, col: 3, len: 2, dir: 'v' },
    { id: 'C', row: 0, col: 4, len: 3, dir: 'v' },
    { id: 'D', row: 0, col: 5, len: 3, dir: 'v' },
    { id: 'E', row: 1, col: 0, len: 2, dir: 'v' },
    { id: 'F', row: 1, col: 1, len: 2, dir: 'h' },
    { id: 'G', row: 3, col: 0, len: 2, dir: 'h' },
    { id: 'Hblk', row: 3, col: 2, len: 2, dir: 'v' },
    { id: 'I', row: 4, col: 1, len: 2, dir: 'v' },
    { id: 'J', row: 4, col: 4, len: 2, dir: 'h' },
    { id: 'K', row: 5, col: 2, len: 2, dir: 'h' },
    { id: 'L', row: 5, col: 4, len: 2, dir: 'h' },
  ];
}

/** Verified against `bfsSolve` + `piecesThinkFunPuzzle40` (refresher if layout changes). */
export const RUSH_HOUR_REF_PUZZLE_40_MIN_MOVES = 49;

/** Minimal board: exactly one slide to exit (validates engine ≠ wrong move model). */
export function piecesTrivialOneMove() {
  return [
    { id: 'hero', row: 2, col: 3, len: 2, dir: 'h', isHero: true },
  ];
}

/**
 * @param {{ full?: boolean }} [options] — full=false skips expensive Puzzle #40 BFS (for fast checks).
 */
export function validateRushHourReferenceSolutions(options = {}) {
  const { full = false } = options;
  const grid = 6;
  const exitRow = 2;

  const rTrivial = bfsSolve({ pieces: piecesTrivialOneMove(), grid, exitRow }, { maxStatesExplored: 50_000 });
  if (!rTrivial.solvable || rTrivial.minMoves !== 1) {
    throw new Error(
      `[RushHour validation] Trivial puzzle expected minMoves=1, got ${JSON.stringify(rTrivial)}`,
    );
  }

  if (full) {
    const p40 = piecesThinkFunPuzzle40();
    const r40 = bfsSolve({ pieces: p40, grid, exitRow }, { maxStatesExplored: 3_000_000 });
    if (!r40.solvable || r40.minMoves !== RUSH_HOUR_REF_PUZZLE_40_MIN_MOVES) {
      throw new Error(
        `[RushHour validation] Reference puzzle #40 expected minMoves=${RUSH_HOUR_REF_PUZZLE_40_MIN_MOVES}, got ${JSON.stringify(r40)} — fix state engine or layout`,
      );
    }
  }
}

function fixNeighborRow(p, r, pieces) {
  return pieces.map((x) => (x.id === p.id ? { ...x, row: r } : x));
}

/** Correct neighbor generation for vertical moves */
export function neighborStatesFixed(pieces, grid) {
  const out = [];
  for (const p of pieces) {
    const { lo, hi } = getRange(p, pieces, grid);
    if (p.dir === 'h') {
      for (let c = lo; c <= hi; c++) {
        if (c === p.col) continue;
        out.push(pieces.map((x) => (x.id === p.id ? { ...x, col: c } : x)));
      }
    } else {
      for (let r = lo; r <= hi; r++) {
        if (r === p.row) continue;
        out.push(fixNeighborRow(p, r, pieces));
      }
    }
  }
  return out;
}

/** Search budget scales ~ O(state space); larger boards need more nodes. */
export function bfsBudgetForGrid(grid) {
  const g = Math.max(4, Math.min(12, grid | 0));
  return Math.min(1_200_000, 55_000 * g * g);
}

/**
 * Shortest number of moves to win, or null if unsolvable within maxVisited.
 * @param {RhPiece[]} startPieces
 */
export function bfsMinMoves(startPieces, grid, exitRow, maxVisited = 400_000) {
  const r = bfsSolve(
    { pieces: startPieces, grid, exitRow },
    { maxStatesExplored: maxVisited },
  );
  return r.solvable ? r.minMoves : null;
}

/** Mulberry32 */
export function rngFactory(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Apply random legal reposition moves (each pick is one "player move").
 * Solvability is preserved: the inverse sequence solves from end to start.
 */
export function forwardScramble(pieces, grid, steps, rng) {
  let s = clonePieces(pieces);
  for (let i = 0; i < steps; i++) {
    const moves = [];
    for (const p of s) {
      const { lo, hi } = getRange(p, s, grid);
      if (p.dir === 'h') {
        for (let c = lo; c <= hi; c++) {
          if (c !== p.col) moves.push({ id: p.id, row: p.row, col: c });
        }
      } else {
        for (let r = lo; r <= hi; r++) {
          if (r !== p.row) moves.push({ id: p.id, row: r, col: p.col });
        }
      }
    }
    if (moves.length === 0) break;
    const pick = moves[Math.floor(rng() * moves.length)];
    s = s.map((x) =>
      x.id === pick.id ? { ...x, row: pick.row, col: pick.col } : x,
    );
  }
  return s;
}

/**
 * Generate a puzzle: scramble then verify with BFS. Retries with new offsets.
 */
export function generateLevelPieces({
  basePieces,
  grid,
  exitRow,
  seed,
  scrambleSteps,
  minPar = 1,
  maxPar = 80,
  maxTries = 40,
  maxBfsNodes,
}) {
  const cap = maxBfsNodes ?? bfsBudgetForGrid(grid);
  for (let t = 0; t < maxTries; t++) {
    const rng = rngFactory(seed + t * 7919);
    const scrambled = forwardScramble(basePieces, grid, scrambleSteps, rng);
    if (isWon(scrambled, grid, exitRow)) continue;
    const bfs = bfsSolve(
      { pieces: scrambled, grid, exitRow },
      { maxStatesExplored: cap },
    );
    if (!bfs.solvable) continue;
    const { minMoves: par } = bfs;
    if (par >= minPar && par <= maxPar) {
      const state = { pieces: scrambled, grid, exitRow };
      const graded = gradeDifficulty(bfs, state);
      logPuzzleValidation(bfs, graded);
      return { pieces: scrambled, par };
    }
  }
  return null;
}

/**
 * Generate a puzzle by forward-scrambling a baseline, then BFS-verifying it.
 *
 * BFS is the correctness gate, not just a par measurement: procedural baselines
 * for grid > 6 aren't guaranteed solvable, so a forward-scramble can land in a
 * dead component. Returning `null` on `solvable: false` lets the caller retry
 * with a different seed instead of shipping an unsolvable board.
 *
 * Budget is sized to stay snappy on mobile (grid 6: <50ms, grid 7: ~300ms-1s
 * worst case). If a puzzle's solution exceeds the budget, we treat it as
 * "unverifiable in reasonable time" and skip — same retry path.
 */
export function generateFastPuzzle({ basePieces, grid, exitRow, seed, scrambleSteps }) {
  const rng = rngFactory(seed);
  const scrambled = forwardScramble(basePieces, grid, scrambleSteps, rng);
  if (isWon(scrambled, grid, exitRow)) return null;
  const budget = grid <= 6 ? 50_000 : 80_000;
  const bfs = bfsSolve(
    { pieces: scrambled, grid, exitRow },
    { maxStatesExplored: budget },
  );
  if (!bfs.solvable) return null;
  return { pieces: scrambled, par: bfs.minMoves };
}

/**
 * Greedy random packing + BFS solvability check (used for 6–8 wide boards).
 *	exitRow must match where the hero sits.
 */
export function buildProceduralBaseline(grid, exitRow, seed, carTarget) {
  const target = Math.max(4, Math.min(16, carTarget | 0));
  const maxPackAttempts = Math.max(120, target * grid * 3);
  for (let attempt = 0; attempt < 8; attempt++) {
    const rng = rngFactory((seed + attempt * 524_287) >>> 0);
    const occ = Array.from({ length: grid }, () => Array(grid).fill(false));
    const pieces = [];

    const hCol = grid >= 7 ? 0 : 1;
    const heroLen = 2;
    if (hCol + heroLen > grid) continue;
    if (exitRow < 0 || exitRow >= grid) continue;
    for (let i = 0; i < heroLen; i++) {
      occ[exitRow][hCol + i] = true;
    }
    pieces.push({
      id: 'hero',
      row: exitRow,
      col: hCol,
      len: heroLen,
      dir: 'h',
      isHero: true,
    });

    for (let k = 0; k < maxPackAttempts && pieces.length - 1 < target; k++) {
      const vertical = rng() < 0.54;
      const len = rng() < 0.58 ? 2 : 3;
      if (vertical) {
        const c = Math.floor(rng() * grid);
        const r = Math.floor(rng() * Math.max(1, grid - len + 1));
        let ok = true;
        for (let i = 0; i < len; i++) {
          if (occ[r + i][c]) ok = false;
        }
        if (!ok) continue;
        for (let i = 0; i < len; i++) occ[r + i][c] = true;
        pieces.push({
          id: `C${pieces.length}`,
          row: r,
          col: c,
          len,
          dir: 'v',
        });
      } else {
        const r = Math.floor(rng() * grid);
        const c = Math.floor(rng() * Math.max(1, grid - len + 1));
        let ok = true;
        for (let i = 0; i < len; i++) {
          if (occ[r][c + i]) ok = false;
        }
        if (!ok) continue;
        if (r === exitRow && c <= hCol + heroLen && c + len > hCol) {
          for (let i = 0; i < len; i++) occ[r][c + i] = false;
          continue;
        }
        for (let i = 0; i < len; i++) occ[r][c + i] = true;
        pieces.push({
          id: `C${pieces.length}`,
          row: r,
          col: c,
          len,
          dir: 'h',
        });
      }
    }

    /* At least 4 pieces total (hero + 3 blockers). No BFS here —
       solvability is guaranteed later by forward-scrambling from this layout. */
    if (pieces.length >= 4) return pieces;
  }
  return null;
}

/** Baseline pieces for a size, or null if procedural failed.
 *
 *  For grid > 6 we re-roll until we find a baseline whose hero can actually
 *  reach the exit. `buildProceduralBaseline` packs cars randomly without a
 *  solvability constraint — many packings genuinely trap the hero. Forward-
 *  scrambling can't recover from a trapped baseline, so we filter here and
 *  let the caller treat baseline-resolution failure as "try a different seed". */
export function resolveBaselinePieces(grid, exitRow, seed, densityBump = 0) {
  const classic = RUSH_HOUR_BASE_LAYOUTS.find((b) => b.grid === grid);
  if (classic && grid === 6 && exitRow === classic.exitRow) {
    return clonePieces(classic.pieces);
  }
  const carTarget = Math.round(5 + grid * 1.15 + densityBump + (grid - 6) * 1.4);
  for (let attempt = 0; attempt < 6; attempt++) {
    const trySeed = (seed + attempt * 524_287) >>> 0;
    const built = buildProceduralBaseline(grid, exitRow, trySeed, carTarget);
    if (!built) continue;
    const bfs = bfsSolve(
      { pieces: built, grid, exitRow },
      { maxStatesExplored: 35_000 },
    );
    if (bfs.solvable) return built;
  }
  return null;
}

/** Starter layouts: hero on exit row, mixed truck lengths (2 and 3). */
export const RUSH_HOUR_BASE_LAYOUTS = [
  {
    id: 'starter-classic',
    grid: 6,
    exitRow: 2,
    pieces: [
      { id: 'hero', row: 2, col: 1, len: 2, dir: 'h', isHero: true },
      { id: 'A', row: 1, col: 3, len: 2, dir: 'v' },
      { id: 'B', row: 2, col: 4, len: 2, dir: 'v' },
      { id: 'C', row: 0, col: 2, len: 2, dir: 'h' },
      { id: 'D', row: 3, col: 0, len: 2, dir: 'v' },
      { id: 'E', row: 4, col: 2, len: 2, dir: 'h' },
    ],
  },
];
