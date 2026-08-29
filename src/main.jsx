import React from 'react';
import ReactDOM from 'react-dom/client';
import { applyAssetCssVars } from './lib/assetUrl';
import './styles/tokens.css';
import './styles/global.css';
import './styles/universe-stage.css';
import './styles/settings.css';
import './styles/training.css';
// Loaded eagerly because game chunks use `.c3d-root` as their inner Suspense
// fallback. If this stylesheet arrives with the lazy 3D chunk, the fallback can
// paint one unthemed frame before the component and its CSS finish loading.
import './features/training/shared/c3dProto.css';
import './styles/puzzles.css';
import './styles/puzzleStudioTheme.css';
// After the theme on purpose: it re-skins the studio HUB onto the app's dusk
// universe, and needs to win over the editorial rules the theme still carries
// for the category and game screens behind it.
import './styles/puzzleStudioHub.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { guardAgainstFraming } from './lib/frameGuard';

/* ⚠ BEFORE ANYTHING ELSE. GitHub Pages cannot send X-Frame-Options, and
   `frame-ancestors` is ignored in a meta CSP, so this module is the only thing
   preventing the app being embedded in a hostile page and clickjacked. See
   lib/frameGuard.js for what the risk is and — as importantly — what it is not. */
const framed = guardAgainstFraming();

applyAssetCssVars();

/* Dev: drop SW + Cache Storage so no stale precached JS/CSS can mask the current source. */
if (import.meta.env.DEV && typeof window !== 'undefined') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const r of registrations) void r.unregister();
    });
  }
  if ('caches' in window) {
    caches.keys().then((keys) => {
      for (const k of keys) void caches.delete(k);
    });
  }
}

/* Dev: TEMPORARY (2026-08-21) — instrument the "screen freezes, then back and
 * pause do nothing" report. Prints [LONGTASK] for any main-thread block >=200ms
 * and [TAP] for every pointerdown, so we can tell a covered button apart from a
 * stalled thread instead of guessing. DEV-only, so it cannot reach users.
 * Delete this block and src/lib/longTaskWatch.js once the cause is fixed. */
if (import.meta.env.DEV && typeof window !== 'undefined') {
  import('./lib/longTaskWatch')
    .then(({ startLongTaskWatch }) => startLongTaskWatch({ thresholdMs: 200 }))
    .catch(() => { /* diagnostics are best-effort */ });
}

/* Prod: when a freshly-deployed service worker takes control of a page that was
 * already controlled by an older one, reload once so users never sit on a stale
 * (or half-updated) build — the cause of "it still shows the old version / two
 * screens overlap on my phone". Guarded so the very first install (which claims
 * a previously-uncontrolled page) does NOT trigger a reload. */
if (import.meta.env.PROD && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });
}

if (!framed) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

/* Prod: once the app is up, quietly pre-fetch every game chunk in the background
 * so games still open when the user goes offline. Deferred to idle / after load
 * so it never competes with first paint or the service-worker install. */
if (import.meta.env.PROD && typeof window !== 'undefined' && !framed) {
  import('./lib/warmGameChunks')
    .then(({ warmGameChunks }) => {
      if (document.readyState === 'complete') warmGameChunks();
      else window.addEventListener('load', () => warmGameChunks(), { once: true });
    })
    .catch(() => { /* warm-up is best-effort */ });
}
