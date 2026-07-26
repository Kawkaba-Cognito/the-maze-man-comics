import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const WEB_BASE = '/the-maze-man-comics/';
const CAPACITOR_BASE = './';

/** Dev-only: `/` → web base so the root URL is not an empty shell. */
function redirectDevRootToBase(basePath) {
  return {
    name: 'redirect-dev-root-to-base',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathOnly = req.url?.split('?')[0] ?? '';
        if (pathOnly === '/' || pathOnly === '') {
          res.statusCode = 302;
          res.setHeader('Location', basePath);
          res.end();
          return;
        }
        next();
      });
    },
  };
}

/** PWA only affects `vite build` / preview of dist — never `vite dev` (avoids SW caching stale UI). */
function pwaPlugin() {
  return VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'The Maze Man Comics',
      short_name: 'Maze Man',
      description: 'Interactive bilingual psychology comics — solve problems with The Maze Man',
      // Served from GitHub Pages under the project base — the installed PWA must
      // launch into the app, not the domain root.
      start_url: WEB_BASE,
      scope: WEB_BASE,
      display: 'fullscreen',
      display_override: ['fullscreen', 'standalone', 'minimal-ui'],
      orientation: 'portrait',
      background_color: '#05050f',
      theme_color: '#00f5ff',
      lang: 'en',
      categories: ['education', 'entertainment', 'games'],
      icons: [
        { src: 'icons/icon-72.png', sizes: '72x72', type: 'image/png', purpose: 'maskable any' },
        { src: 'icons/icon-96.png', sizes: '96x96', type: 'image/png', purpose: 'maskable any' },
        { src: 'icons/icon-128.png', sizes: '128x128', type: 'image/png', purpose: 'maskable any' },
        { src: 'icons/icon-144.png', sizes: '144x144', type: 'image/png', purpose: 'maskable any' },
        { src: 'icons/icon-152.png', sizes: '152x152', type: 'image/png', purpose: 'maskable any' },
        { src: 'icons/icon-180.png', sizes: '180x180', type: 'image/png', purpose: 'maskable any' },
        { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable any' },
        { src: 'icons/icon-384.png', sizes: '384x384', type: 'image/png', purpose: 'maskable any' },
        { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable any' },
      ],
    },
    workbox: {
      skipWaiting: true,
      clientsClaim: true,
      cleanupOutdatedCaches: true,
      // Precache only the lightweight app shell. The app is heavily code-split
      // (one lazy chunk per training game, plus a ~1 MB word-game bundle), so
      // precaching ALL of it — vite-plugin-pwa's default — meant the service
      // worker's install fired ~63 fetches / 2.4 MB at once. On localhost that
      // finishes instantly, but on GitHub Pages the precache storm stalled the
      // install indefinitely; while it was stuck, the page's on-demand
      // import() for a game chunk was starved and never resolved, leaving every
      // training game frozen on the "Loading…" Suspense fallback. JS/worker
      // chunks are now fetched on demand and cached at runtime instead, so the
      // install stays tiny and can't wedge first interaction.
      // No 'manifest.webmanifest' here on purpose — vite-plugin-pwa injects the
      // manifest into the precache itself, so listing it again precached it twice.
      globPatterns: ['**/*.{css,html,svg,ico,woff2}', 'icons/**/*.png'],
      // index.html is the ONE file that must never be served from a cache the
      // deploy can outlive — see the navigation rule below. Every other HTML
      // (the standalone episode page) still precaches normally.
      globIgnores: ['index.html'],
      // vite-plugin-pwa defaults this to 'index.html', which registers a
      // NavigationRoute serving the PRECACHED shell for every navigation. That
      // shell keeps naming hashed entry chunks after a deploy has replaced them,
      // and a 404 on the entry chunk kills the page before React — and therefore
      // before the ErrorBoundary and lazyWithRetry — exists to recover. Dropping
      // it hands navigations to the NetworkFirst rule below instead.
      navigateFallback: undefined,
      runtimeCaching: [
        {
          // The app shell, network-first: online you always boot from the HTML
          // that matches what is actually on the server, so a stale shell can
          // never ask for a deleted chunk. Offline falls back to the last shell
          // that loaded successfully. Deliberately NO networkTimeoutSeconds — a
          // timeout would reintroduce the stale-shell boot on a slow connection,
          // and the document is ~2 KB, so waiting for it costs nothing.
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'app-shell',
            expiration: { maxEntries: 10 },
            cacheableResponse: { statuses: [200] },
          },
        },
        {
          // App + game JS and the maze worker — load from network on demand,
          // serve cached on repeat visits (offline-capable after first load).
          //
          // maxEntries must comfortably exceed ONE build's chunk count, and then
          // some: chunk URLs are content-hashed, so a deploy's worth of new hashes
          // lands on top of the old ones and the cap is enforced across ALL of
          // them. At 100 (== exactly this build's chunk count) the cache was
          // permanently at its ceiling, and Workbox's ExpirationPlugin refuses to
          // SERVE anything past the limit — measured 2026-07-26 with the network
          // down: entry 528/529 loaded, entry 0/529 (the app's own entry chunk)
          // did not. That is offline being quietly broken, not just re-downloads.
          // 400 ≈ four builds of headroom (this build: 100 chunks / 4.8 MB).
          urlPattern: ({ request }) => request.destination === 'script' || request.destination === 'worker',
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'app-scripts',
            expiration: { maxEntries: 400, purgeOnQuotaError: true },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'google-fonts', expiration: { maxEntries: 20 } },
        },
        {
          // Art and 3D models. Unlike scripts these have stable, unhashed names,
          // so they do not pile up across deploys — 459 files / 39.7 MB is the
          // whole build, and only what a player actually opens is ever fetched.
          // The old cap of 60 could not even hold the character GLBs plus one
          // screen's backgrounds, so every session re-downloaded multi-MB models.
          urlPattern: /\.(png|jpg|jpeg|webp|ico|svg|glb)$/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'assets',
            expiration: { maxEntries: 600, purgeOnQuotaError: true },
          },
        },
      ],
    },
  });
}

export default defineConfig(({ command, mode }) => {
  const isCapacitor = mode === 'capacitor';
  const base = isCapacitor ? CAPACITOR_BASE : WEB_BASE;

  return {
    plugins: [
      ...(!isCapacitor ? [redirectDevRootToBase(WEB_BASE)] : []),
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),
      ...(command === 'build' && !isCapacitor ? [pwaPlugin()] : []),
    ],
    base,
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      open: WEB_BASE,
      watch: { usePolling: true, interval: 150 },
      // Avoid browser disk cache serving an old module graph while iterating on UI.
      headers: { 'Cache-Control': 'no-store' },
    },
    preview: {
      host: true,
      port: 4173,
      strictPort: true,
      open: WEB_BASE,
    },
    build: { outDir: 'dist', assetsDir: 'Assets' },
  };
});
