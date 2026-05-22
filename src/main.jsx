import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/tokens.css';
import './styles/global.css';
import './styles/splash.css';
import './styles/settings.css';
import './styles/training.css';
import './styles/puzzles.css';
import App from './App';

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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
