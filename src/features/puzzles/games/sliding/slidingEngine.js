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

  let lastEmpty = -1;
  const scrambleSteps = Math.max(80, size * size * 40);
  for (let i = 0; i < scrambleSteps; i++) {
    const empty = indexOfEmpty();
    let opts = neighborsOf(empty).filter((n) => n !== lastEmpty);
    if (opts.length === 0) opts = neighborsOf(empty);
    const pick = opts[Math.floor(rng() * opts.length)];
    swap(empty, pick);
    lastEmpty = empty;
  }

  return { size, tiles: tiles.slice(), moves: 0, seed };
}

export function trySlide(state, tileIndex) {
  const { size, tiles, moves } = state;
  const empty = tiles.indexOf(0);
  const r1 = Math.floor(tileIndex / size);
  const c1 = tileIndex % size;
  const r0 = Math.floor(empty / size);
  const c0 = empty % size;
  const adjacent = Math.abs(r1 - r0) + Math.abs(c1 - c0) === 1;
  if (!adjacent || tiles[tileIndex] === 0) return state;
  const next = tiles.slice();
  [next[tileIndex], next[empty]] = [next[empty], next[tileIndex]];
  return { ...state, tiles: next, moves: moves + 1 };
}

export function isSlidingSolved({ size, tiles }) {
  const total = size * size;
  for (let i = 0; i < total - 1; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[total - 1] === 0;
}
