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
      globPatterns: ['**/*.{css,html,svg,ico,woff2}', 'manifest.webmanifest', 'icons/**/*.png'],
      runtimeCaching: [
        {
          // App + game JS and the maze worker — load from network on demand,
          // serve cached on repeat visits (offline-capable after first load).
          urlPattern: ({ request }) => request.destination === 'script' || request.destination === 'worker',
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'app-scripts', expiration: { maxEntries: 100 } },
        },
        {
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'google-fonts', expiration: { maxEntries: 20 } },
        },
        {
          urlPattern: /\.(png|jpg|jpeg|webp|ico|svg|glb)$/,
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'assets', expiration: { maxEntries: 60 } },
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
