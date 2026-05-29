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
