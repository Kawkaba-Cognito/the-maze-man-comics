/*
 * Auto-built map of gameKey → React.lazy(component).
 *
 * Walks every domain's `subs` once at module init and wraps each `loader` in
 * React.lazy. The hub / ComicsScreen looks up by `gameKey` and renders the
 * lazy component inside a <Suspense> boundary, so a game's bundle is fetched
 * only when the user opens it.
 *
 * Adding a new game = give its sub a `loader: () => import('./games/foo')`
 * in its domain.config.js. No edits needed here or in ComicsScreen.
 */

import { lazy } from 'react';
import { DOMAIN_CONFIGS } from './registry';

const cache = {};

DOMAIN_CONFIGS.forEach((domain) => {
  domain.subs.forEach((sub) => {
    if (sub.gameKey && typeof sub.loader === 'function') {
      cache[sub.gameKey] = lazy(sub.loader);
    }
  });
});

export function getLazyGame(gameKey) {
  return cache[gameKey] ?? null;
}

export function hasGame(gameKey) {
  return Boolean(cache[gameKey]);
}
