import { createRng, shuffle } from '../../shared/rng';

const DELTAS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

/**
 * UI tier (3–6) → internal maze complexity.
 * Larger mazes + quality filters = real thinking required.
 */
export const MAZE_TIER = {
  3: { cells: 10, pathMult: 1.75, deadMult: 0.38 },
  4: { cells: 14, pathMult: 1.95, deadMult: 0.42 },
  5: { cells: 18, pathMult: 2.1, deadMult: 0.45 },
  6: { cells: 22, pathMult: 2.3, deadMult: 0.48 },
};

export const MAZE_TIER_HINTS = {
  en: {
    3: 'Warm-up · dead ends & twists',
    4: 'Tricky · plan ahead',
    5: 'Hard · long false trails',
    6: 'Expert · dense labyrinth',
  },
  ar: {
    3: 'تمهيدي · ممرات مسدودة',
    4: 'صعب · خطّط مسبقاً',
    5: 'شاق · مسارات خادعة',
    6: 'خبير · متاهة كثيفة',
  },
};

function isAdjacent(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
}

function carvePorteusGrid(size, rng, startCell = [0, 0]) {
  const dim = size * 2 + 1;
  const grid = Array.from({ length: dim }, () => Array(dim).fill(true));

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      grid[r * 2 + 1][c * 2 + 1] = false;
    }
  }

  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  const [sr, sc] = startCell;

  function carve(lr, lc) {
    visited[lr][lc] = true;
    const neighbors = shuffle(
      DELTAS.map(([dr, dc]) => [lr + dr, lc + dc]).filter(
        ([nr, nc]) => nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc]
      ),
      rng
    );
    for (const [nr, nc] of neighbors) {
      if (visited[nr][nc]) continue;
      grid[lr + nr + 1][lc + nc + 1] = false;
      carve(nr, nc);
    }
  }

  carve(sr, sc);

  grid[0][1] = false;
  grid[dim - 1][size * 2 - 1] = false;

  return { wallGrid: grid, dim };
}

export function logicalToGrid(r, c) {
  return [r * 2 + 1, c * 2 + 1];
}

export function passageOpen(wallGrid, r1, c1, r2, c2) {
  if (!isAdjacent([r1, c1], [r2, c2])) return false;
  const [gr1, gc1] = logicalToGrid(r1, c1);
  const [gr2, gc2] = logicalToGrid(r2, c2);
  return !wallGrid[(gr1 + gr2) / 2][(gc1 + gc2) / 2];
}

export function cellNeighbors(wallGrid, size, r, c) {
  const out = [];
  for (const [dr, dc] of DELTAS) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size && passageOpen(wallGrid, r, c, nr, nc)) {
      out.push([nr, nc]);
    }
  }
  return out;
}

function bfsPathLength(wallGrid, size, start, end) {
  const key = (r, c) => `${r},${c}`;
  const queue = [[start[0], start[1], 0]];
  const seen = new Set([key(start[0], start[1])]);

  while (queue.length) {
    const [r, c, d] = queue.shift();
    if (r === end[0] && c === end[1]) return d;

    for (const [nr, nc] of cellNeighbors(wallGrid, size, r, c)) {
      const k = key(nr, nc);
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push([nr, nc, d + 1]);
    }
  }
  return 0;
}

function countDeadEnds(wallGrid, size) {
  let n = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (cellNeighbors(wallGrid, size, r, c).length === 1) n++;
    }
  }
  return n;
}

/** Prefer mazes with winding solution paths and plenty of misleading branches. */
function mazeQuality(wallGrid, size, spec) {
  const start = [0, 0];
  const end = [size - 1, size - 1];
  const pathLen = bfsPathLength(wallGrid, size, start, end);
  const deadEnds = countDeadEnds(wallGrid, size);
  const manhattan = 2 * (size - 1);
  const minPath = Math.floor(manhattan * spec.pathMult * 0.52);
  const minDead = Math.max(4, Math.floor(size * spec.deadMult));
  const score =
    pathLen >= minPath && deadEnds >= minDead
      ? pathLen + deadEnds * 2
      : 0;
  return { pathLen, deadEnds, minPath, minDead, score };
}

export function generateLogicMaze(tier, seed) {
  const spec = MAZE_TIER[tier] ?? MAZE_TIER[4];
  const cells = spec.cells;
  let best = null;
  let bestScore = 0;

  for (let attempt = 0; attempt < 80; attempt++) {
    const rng = createRng((seed + attempt * 7919) >>> 0);
    const { wallGrid, dim } = carvePorteusGrid(cells, rng);
    const q = mazeQuality(wallGrid, cells, spec);

    if (q.score > bestScore) {
      bestScore = q.score;
      best = {
        tier,
        size: cells,
        dim,
        wallGrid,
        start: [0, 0],
        end: [cells - 1, cells - 1],
        path: [[0, 0]],
        seed: seed + attempt,
        pathLen: q.pathLen,
        deadEnds: q.deadEnds,
      };
    }
    if (q.score > 0 && q.pathLen >= q.minPath * 1.15 && q.deadEnds >= q.minDead * 1.1) {
      break;
    }
  }

  if (best) return best;

  const rng = createRng(seed);
  const { wallGrid, dim } = carvePorteusGrid(cells, rng);
  return {
    tier,
    size: cells,
    dim,
    wallGrid,
    start: [0, 0],
    end: [cells - 1, cells - 1],
    path: [[0, 0]],
    seed,
    pathLen: bfsPathLength(wallGrid, cells, [0, 0], [cells - 1, cells - 1]),
    deadEnds: countDeadEnds(wallGrid, cells),
  };
}

/** Direction name → [dr, dc] step. Used by the joystick to move the avatar. */
export const MAZE_DIRS = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
};

/**
 * Move the avatar one cell in `dir` ('up'|'down'|'left'|'right').
 *
 * The wall check comes FIRST: pushing into a wall is always a no-op, even if
 * the cell beyond the wall is already part of the trail. (The old version
 * delegated to extendDrawPath, whose on-path truncation ran before the wall
 * check — so shoving against a wall could chop the trail back to a grid-
 * adjacent cell it touches through that wall.)
 *
 * Stepping back onto the previous cell retraces (shortens) the trail.
 */
export function moveMaze(state, dir) {
  const delta = MAZE_DIRS[dir];
  if (!delta) return state;

  const { wallGrid, path } = state;
  const [lr, lc] = path[path.length - 1];
  const r = lr + delta[0];
  const c = lc + delta[1];

  if (!passageOpen(wallGrid, lr, lc, r, c)) return state; // blocked → stay put

  // Reversing onto the previous cell shortens the trail.
  if (path.length >= 2) {
    const [pr, pc] = path[path.length - 2];
    if (pr === r && pc === c) return { ...state, path: path.slice(0, -1) };
  }

  // Re-entering an earlier (open) cell truncates back to it; otherwise advance.
  const onPathIdx = path.findIndex(([qr, qc]) => qr === r && qc === c);
  if (onPathIdx >= 0) return { ...state, path: path.slice(0, onPathIdx + 1) };
  return { ...state, path: [...path, [r, c]] };
}

export function resetMazePath(state) {
  return { ...state, path: [state.start.slice()] };
}

export function isMazeSolved(state) {
  const { end, path } = state;
  const last = path[path.length - 1];
  return last[0] === end[0] && last[1] === end[1];
}

export function mazeLayout(displaySize) {
  const pad = Math.max(12, displaySize * 0.04);
  const inner = displaySize - pad * 2;
  return { pad, inner, displaySize };
}

export function cellCenter(r, c, pad, unit, dim) {
  const [gr, gc] = logicalToGrid(r, c);
  return {
    x: pad + gc * unit + unit / 2,
    y: pad + gr * unit + unit / 2,
  };
}

export function cellFromPixel(x, y, pad, unit, size, dim) {
  const lx = x - pad;
  const ly = y - pad;
  const inner = unit * dim;
  if (lx < 0 || ly < 0 || lx >= inner || ly >= inner) return null;

  const gc = Math.floor(lx / unit);
  const gr = Math.floor(ly / unit);
  if (gr % 2 !== 1 || gc % 2 !== 1) return null;

  const r = (gr - 1) / 2;
  const c = (gc - 1) / 2;
  if (r < 0 || r >= size || c < 0 || c >= size) return null;
  return [r, c];
}

export function mazePortals(size, pad, unit, dim) {
  return {
    entrance: { x: pad + unit + unit / 2, y: pad - unit * 0.15 },
    exit: { x: pad + (size * 2 - 1) * unit + unit / 2, y: pad + (dim - 1) * unit + unit * 0.2 },
  };
}

export function tierLabel(tier, isAr) {
  return `${tier}×${tier}`;
}

export function tierSubtitle(state, isAr) {
  const t = isAr ? 'ممرات مسدودة' : 'dead ends';
  return `${tierLabel(state.tier, isAr)} · ${state.deadEnds ?? '?'} ${t}`;
}
