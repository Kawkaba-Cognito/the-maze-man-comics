/*
 * Offline cache warm-up for code-split game bundles.
 *
 * Problem this fixes: to keep the service-worker install tiny (precaching every
 * game chunk once stalled the SW on GitHub Pages and froze the app), game code
 * is split into one lazy chunk per game and fetched ON DEMAND, then cached at
 * runtime. The side effect: a game you have never opened has no cached code, so
 * opening it while OFFLINE fails ("Loading…" then crash).
 *
 * Fix: once the app is loaded and online, quietly pre-fetch every game's chunk
 * in the background during idle time. Each import() populates the runtime
 * "app-scripts" cache, so afterwards every game opens offline. This runs AFTER
 * first paint and is throttled, so it never competes with the SW install or the
 * user's first interaction — the exact failure mode the on-demand split avoided.
 */

import { DOMAIN_CONFIGS } from '../features/training/registry';
import { PUZZLE_CONFIGS } from '../features/puzzles/registry';

let started = false;

function collectLoaders() {
  const loaders = [];
  DOMAIN_CONFIGS.forEach((domain) => {
    domain.subs.forEach((sub) => {
      if (typeof sub.loader === 'function') loaders.push(sub.loader);
    });
  });
  PUZZLE_CONFIGS.forEach((puzzle) => {
    if (typeof puzzle.loader === 'function') loaders.push(puzzle.loader);
  });
  return loaders;
}

function idle(fn, timeout = 2000) {
  if (typeof requestIdleCallback === 'function') requestIdleCallback(() => fn(), { timeout });
  else setTimeout(fn, 400);
}

/**
 * Kick off background pre-fetching of all game chunks. Safe to call repeatedly —
 * it only runs once per page load, and only while online. Pass it after the app
 * has rendered (e.g. from main.jsx).
 */
export function warmGameChunks() {
  if (started) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    // Defer until we regain connectivity, then warm the cache for next time.
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => warmGameChunks(), { once: true });
    }
    return;
  }
  started = true;

  const loaders = collectLoaders();
  let i = 0;
  const BATCH = 2; // a couple at a time so we never saturate the network

  const pump = () => {
    if (i >= loaders.length) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return; // pause if we drop offline
    const batch = loaders.slice(i, i + BATCH);
    i += BATCH;
    Promise.allSettled(batch.map((fn) => fn())).finally(() => idle(pump));
  };

  idle(pump, 4000);
}
