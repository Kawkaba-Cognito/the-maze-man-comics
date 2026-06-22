import React from 'react';
import ReactDOM from 'react-dom/client';
import { applyAssetCssVars } from './lib/assetUrl';
import './styles/tokens.css';
import './styles/global.css';
import './styles/splash.css';
import './styles/settings.css';
import './styles/training.css';
import './styles/puzzles.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
