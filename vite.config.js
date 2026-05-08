import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/** Dev-only: `/` → `/the-maze-man-comics/` so the root URL is not an empty shell. */
function redirectDevRootToBase() {
  const basePath = '/the-maze-man-comics/';
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
      start_url: '/',
      scope: '/',
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
      runtimeCaching: [
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

export default defineConfig(({ command }) => ({
  plugins: [
    redirectDevRootToBase(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    ...(command === 'build' ? [pwaPlugin()] : []),
  ],
  base: '/the-maze-man-comics/',
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    open: '/the-maze-man-comics/',
    watch: { usePolling: true, interval: 150 },
    // Avoid browser disk cache serving an old module graph while iterating on UI.
    headers: { 'Cache-Control': 'no-store' },
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
    open: '/the-maze-man-comics/',
  },
  build: { outDir: 'dist', assetsDir: 'Assets' },
}));
