import { lazy } from 'react';
import { PUZZLE_CONFIGS } from './registry';

const cache = {};

PUZZLE_CONFIGS.forEach((puzzle) => {
  if (puzzle.gameKey && typeof puzzle.loader === 'function') {
    cache[puzzle.gameKey] = lazy(puzzle.loader);
  }
});

export function getLazyPuzzle(gameKey) {
  return cache[gameKey] ?? null;
}

export function hasPuzzle(gameKey) {
  return Boolean(cache[gameKey]);
}
