// ═══════════════════════════════════════════════════
//  The Maze Man Comics — Service Worker
//  Strategy: Cache-first for assets, Network-first for HTML
// ═══════════════════════════════════════════════════

const CACHE_NAME  = 'mazeman-v1';
const CACHE_PAGES = 'mazeman-pages-v1';

// Files cached immediately on install (app shell)
const PRECACHE = [
  './',
  './index.html',
  './episode-1-problem-solving.html',
  './manifest.json',
  './Assets/mazeman-sprites.png',
  './Assets/mazeman-portrait.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // Google Fonts — cached on first fetch
];

// ── Install: pre-cache shell ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: delete old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== CACHE_PAGES)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache strategy ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin (except Google Fonts)
  if (request.method !== 'GET') return;

  const isFont       = url.hostname.includes('fonts.googleapis.com') ||
                       url.hostname.includes('fonts.gstatic.com');
  const isAsset      = url.pathname.match(/\.(png|jpg|jpeg|webp|ico|svg|woff2?)$/i);
  const isHTMLPage   = url.pathname.match(/\.html$/) || url.pathname === '/';

  if (isFont || isAsset) {
    // Cache-first: serve from cache, fall back to network and cache result
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);
      })
    );
  } else if (isHTMLPage) {
    // Network-first for HTML: always try latest, fall back to cache
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_PAGES).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
  // All other requests: browser handles normally
});

// ── Background sync: notify clients of new version ──
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
