import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    VitePWA({
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
          { src: 'icons/icon-72.png',  sizes: '72x72',   type: 'image/png', purpose: 'maskable any' },
          { src: 'icons/icon-96.png',  sizes: '96x96',   type: 'image/png', purpose: 'maskable any' },
          { src: 'icons/icon-128.png', sizes: '128x128', type: 'image/png', purpose: 'maskable any' },
          { src: 'icons/icon-144.png', sizes: '144x144', type: 'image/png', purpose: 'maskable any' },
          { src: 'icons/icon-152.png', sizes: '152x152', type: 'image/png', purpose: 'maskable any' },
          { src: 'icons/icon-180.png', sizes: '180x180', type: 'image/png', purpose: 'maskable any' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable any' },
          { src: 'icons/icon-384.png', sizes: '384x384', type: 'image/png', purpose: 'maskable any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable any' }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20 } }
          },
          {
            urlPattern: /\.(png|jpg|jpeg|webp|ico|svg|glb)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'assets', expiration: { maxEntries: 60 } }
          }
        ]
      }
    })
  ],
  base: '/the-maze-man-comics/',
  build: { outDir: 'dist', assetsDir: 'Assets' }
});
