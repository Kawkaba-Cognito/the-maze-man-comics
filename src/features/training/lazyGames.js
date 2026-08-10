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

import { lazyWithRetry } from '../../lib/lazyWithRetry';
import { DOMAIN_CONFIGS } from './registry';

/*
 * Self-healing dynamic import — shared with the puzzles hub. See
 * ../../lib/lazyWithRetry for the full rationale (stale manifest after a deploy
 * makes a game's chunk 404; we retry once, then drop caches and reload once).
 */
const cache = {};

DOMAIN_CONFIGS.forEach((domain) => {
  domain.subs.forEach((sub) => {
    if (sub.gameKey && typeof sub.loader === 'function') {
      cache[sub.gameKey] = lazyWithRetry(sub.loader, sub.gameKey);
    }
  });
});

// Memo Span (Corsi span) is no longer a training-hub slot — Story Grid took its
// place — but the clinical assessment battery still runs it as the standard
// visuospatial memory measure, so keep its loader registered here.
if (!cache['memo-span']) {
  cache['memo-span'] = lazyWithRetry(() => import('./domains/memory/games/memo-span'), 'memo-span');
}

/*
 * Same deal for N-Back (2026-08-10). Keep Track took its training-hub slot, but
 * the assessment battery still runs N-Back as the memory paradigm — AssessmentFlow
 * resolves it through getLazyGame, so dropping it from domain.config alone would
 * render the memory pillar as nothing at all. It stays registered here until Keep
 * Track has an assess mode and norms of its own.
 */
if (!cache.nback) {
  cache.nback = lazyWithRetry(() => import('./domains/memory/games/nback'), 'nback');
}

/*
 * And Arrow Rush (2026-08-10). Mirror World took its training-hub slot, but
 * spatial-stroop is still the ASSESSMENT's flexibility paradigm and the Daily
 * Workout still schedules it by weight in workoutData.js. Both resolve it
 * through getLazyGame, so without this the flexibility pillar and part of the
 * workout render nothing — silently.
 */
if (!cache['spatial-stroop']) {
  cache['spatial-stroop'] = lazyWithRetry(() => import('./domains/flexibility/games/spatial-stroop'), 'spatial-stroop');
}

export function getLazyGame(gameKey) {
  return cache[gameKey] ?? null;
}

export function hasGame(gameKey) {
  return Boolean(cache[gameKey]);
}
