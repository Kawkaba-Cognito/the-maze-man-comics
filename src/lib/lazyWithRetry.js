import { lazy } from 'react';

/*
 * Self-healing lazy loader for code-split game bundles.
 *
 * Symptom this fixes: a game (puzzle OR training) opens to "Loading…" and then
 * the app reloads / shows the error screen ("it disconnects me"). Cause: after a
 * new build is deployed to GitHub Pages, an already-open page — or the installed
 * PWA, whose service worker precached the OLD index.html — still holds the OLD
 * asset manifest. Opening a game then requests a chunk hash that no longer
 * exists on the server, so the dynamic import() rejects, <Suspense> surfaces the
 * error, and we crash to the ErrorBoundary.
 *
 * Fix: retry the import once (covers a transient network blip); if it STILL
 * fails, DROP the cached scripts/precache and force a single full reload so the
 * browser pulls the fresh manifest + chunks from the network. A sessionStorage
 * flag guarantees we can never reload-loop, and every flag is cleared on any
 * successful load so a future deploy can self-heal again.
 */

const RELOAD_FLAG_PREFIX = 'mm_chunk_reload';

/** True for the various "failed to fetch a code-split chunk" errors browsers throw. */
export function isChunkLoadError(err) {
  if (!err) return false;
  const msg = `${err.message || err}`;
  const name = err.name || '';
  return (
    name === 'ChunkLoadError' ||
    /Loading chunk [\w-]+ failed/i.test(msg) ||
    /Loading CSS chunk/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /'text\/html' is not a valid JavaScript MIME type/i.test(msg)
  );
}

/** Clear every Cache Storage bucket we own so a reload re-fetches a fresh build. */
async function dropCaches() {
  try {
    if (typeof caches === 'undefined') return;
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch { /* ignore */ }
}

/** Remove all chunk-reload guard flags once something has loaded successfully. */
function clearAllReloadFlags() {
  try {
    if (typeof sessionStorage === 'undefined') return;
    const toRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(RELOAD_FLAG_PREFIX)) toRemove.push(k);
    }
    toRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch { /* ignore */ }
}

/**
 * Force ONE clean reload (caches dropped first), guarded by a per-scope flag so
 * we can never loop. Returns true if it triggered a reload, false if a previous
 * attempt already used up this scope's single allowed reload.
 *
 * Exported so the ErrorBoundary can use the exact same self-heal as a last-ditch
 * safety net for chunk errors that escape the lazy wrapper.
 */
export async function selfHealChunkReload(scope = 'global') {
  // Offline: a missing chunk simply isn't downloaded yet, not stale. Dropping
  // caches and reloading would destroy the offline cache and strand the user on
  // a blank page. Bail so the caller can show an "offline / not downloaded" UI.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  const flag = `${RELOAD_FLAG_PREFIX}_${scope}`;
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(flag)) return false;
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(flag, '1');
  } catch { /* ignore */ }
  await dropCaches();
  try { window.location.reload(); } catch { /* ignore */ }
  return true;
}

/** React.lazy wrapper that self-heals chunk-load failures after a deploy. */
export function lazyWithRetry(loader, key) {
  return lazy(async () => {
    try {
      const mod = await loader();
      clearAllReloadFlags();
      return mod;
    } catch (err) {
      try {
        await new Promise((r) => setTimeout(r, 350));
        const mod = await loader();
        clearAllReloadFlags();
        return mod;
      } catch (err2) {
        const reloaded = await selfHealChunkReload(key);
        // If we triggered a reload, stall so nothing renders before navigation.
        if (reloaded) return new Promise(() => {});
        throw err2 || err;
      }
    }
  });
}
