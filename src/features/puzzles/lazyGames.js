import { lazyWithRetry } from '../../lib/lazyWithRetry';
import { PUZZLE_CONFIGS } from './registry';

/*
 * Each puzzle's lazy component is wrapped in lazyWithRetry so a chunk that 404s
 * after a deploy (stale manifest) self-heals via one clean reload instead of
 * crashing to the "Something went wrong" screen. See ../../lib/lazyWithRetry.
 */
const cache = {};

PUZZLE_CONFIGS.forEach((puzzle) => {
  if (puzzle.gameKey && typeof puzzle.loader === 'function') {
    cache[puzzle.gameKey] = lazyWithRetry(puzzle.loader, puzzle.gameKey);
  }
});

export function getLazyPuzzle(gameKey) {
  return cache[gameKey] ?? null;
}

export function hasPuzzle(gameKey) {
  return Boolean(cache[gameKey]);
}
