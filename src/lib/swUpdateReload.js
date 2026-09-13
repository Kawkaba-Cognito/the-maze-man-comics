/*
 * TAKE THE UPDATE, BUT NOT MID-ROUND.
 *
 * ── The bug this exists for (2026-09-13, owner) ───────────────────────────
 * "There is a bug in cancellation task that sometimes the game exits to the
 * home screen, or training screen."
 *
 * It was not the game. The service worker is registered `autoUpdate` with
 * `skipWaiting: true` and `clientsClaim: true` (vite.config.js), so a freshly
 * deployed worker activates and claims the OPEN page immediately rather than
 * waiting for it to close. `main.jsx` listened for `controllerchange` and
 * called `window.location.reload()` there and then — with no regard for what
 * the user was doing. Reload during a timed Survival round and the round is
 * gone; `activeTab` initialises to `'habits'` and is not persisted, so the app
 * comes back up on HOME. That is the whole report, and it fires on every
 * deploy — which is why it reads as "sometimes".
 *
 * ⚠ THE RELOAD CANNOT SIMPLY BE DELETED. It is load-bearing: it is what fixed
 * "it still shows the old version / two screens overlap on my phone". A page
 * whose controller has changed is running old JS against a new worker, which
 * is exactly the half-updated state that produced those reports. The reload is
 * right; its TIMING was wrong.
 *
 * ── What this does instead ────────────────────────────────────────────────
 * Reload at the first safe moment: immediately if the user is on a menu, and
 * otherwise as soon as they leave the game they are in. A player mid-round
 * finishes their round; the update lands when they are back on a hub, which on
 * this app is never more than a round away.
 *
 * ⚠ VISIBILITY IS PART OF "BUSY", because AppShell keeps every tab mounted
 * under `display: none`. A player who opened a game and then switched tabs
 * still has `.ct-domain-game-stage` in the DOM, and a naive `querySelector`
 * would call that busy forever — the app would never take an update again.
 * Each candidate is therefore tested for actual visibility.
 */

/*
 * The roots that mean "the user is inside something they would lose".
 * ⚠ `.ct-domain-game-stage` covers all 18 training games (it is what
 * DomainGameStage renders) including their menus, which is deliberate: a
 * reload while someone reads a mode screen is still an unexplained jump.
 * Extend this list when a new full-screen play surface is added.
 */
const BUSY_SELECTORS = [
  '.ct-domain-game-stage',
  '.vr-root',
  '.ct-puzzle-screen:not(.ct-puzzle-screen--hub)',
];

const POLL_MS = 4000;

let pending = false;
let reloaded = false;

function isVisible(el) {
  // checkVisibility covers display:none anywhere up the tree, content-visibility
  // and visibility:hidden in one call; offsetParent is the fallback and is
  // adequate here because every selector above is static or absolute, never
  // position: fixed (for which offsetParent is null even when on screen).
  if (typeof el.checkVisibility === 'function') return el.checkVisibility();
  return el.offsetParent !== null;
}

export function isAppBusy() {
  if (typeof document === 'undefined') return false;
  return BUSY_SELECTORS.some((sel) => {
    let nodes;
    try { nodes = document.querySelectorAll(sel); } catch { return false; }
    return Array.from(nodes).some(isVisible);
  });
}

function doReload() {
  if (reloaded) return;
  reloaded = true;
  try { window.location.reload(); } catch { /* ignore */ }
}

/**
 * Call once, when a new service worker has taken control. Reloads now if the
 * user is not inside a game, otherwise watches until they are not.
 */
export function scheduleUpdateReload() {
  if (pending || reloaded) return;
  pending = true;

  if (!isAppBusy()) {
    doReload();
    return;
  }

  const timer = setInterval(() => {
    if (isAppBusy()) return;
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
    doReload();
  }, POLL_MS);

  // Backgrounding the app is the least disruptive moment there is — but only
  // when nothing is in progress, so a player who puts the phone down mid-round
  // still comes back to their round rather than to Home.
  function onVisibility() {
    if (document.visibilityState !== 'hidden') return;
    if (isAppBusy()) return;
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
    doReload();
  }
  document.addEventListener('visibilitychange', onVisibility);
}
