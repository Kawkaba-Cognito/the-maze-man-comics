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

/*
 * Self-healing dynamic import.
 *
 * Symptom we are fixing: a game opens to "Loading…" and then the app reloads /
 * shows the error screen ("it reconnects me"). Cause: after a new build is
 * deployed, an already-open page still holds the OLD asset manifest. Opening a
 * game then requests a chunk hash that no longer exists on the server, so the
 * dynamic import rejects, <Suspense> surfaces the error, and we crash to the
 * ErrorBoundary (which reloads).
 *
 * Fix: retry the import once after a short delay (covers a transient network
 * blip), and if it STILL fails, force a single full reload to pull the fresh
 * manifest. A sessionStorage flag guarantees we can never reload-loop, and it is
 * cleared on any successful load so a future deploy can self-heal again.
 */
function lazyWithRetry(loader, key) {
  const flag = `mm_chunk_reload_${key}`;
  const clear = () => { try { sessionStorage.removeItem(flag); } catch { /* ignore */ } };
  return lazy(async () => {
    try {
      const mod = await loader();
      clear();
      return mod;
    } catch (err) {
      try {
        await new Promise((r) => setTimeout(r, 350));
        const mod = await loader();
        clear();
        return mod;
      } catch (err2) {
        let reloaded = false;
        try {
          if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(flag)) {
            sessionStorage.setItem(flag, '1');
            reloaded = true;
            window.location.reload();
          }
        } catch { /* ignore */ }
        // If we triggered a reload, stall so nothing renders before the navigation.
        if (reloaded) return new Promise(() => {});
        throw err2 || err;
      }
    }
  });
}

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

export function getLazyGame(gameKey) {
  return cache[gameKey] ?? null;
}

export function hasGame(gameKey) {
  return Boolean(cache[gameKey]);
}
