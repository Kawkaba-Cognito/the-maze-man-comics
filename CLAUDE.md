# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Maze Man** is a React 19 + Vite 8 PWA with Capacitor support. It's an interactive bilingual (EN/AR) psychology comics app with a Canvas 2D episode game and a 3D Babylon.js maze.

## Running the Project

```bash
npm install --legacy-peer-deps   # first time only
npm run dev                      # local dev server at localhost:5173
```

## Deploying to GitHub Pages

**ALWAYS run this after every update — no exceptions:**

```bash
npm run build && npx gh-pages -d dist
```

GitHub Pages serves from the `gh-pages` branch (root folder).
Live URL: https://kawkaba-cognito.github.io/the-maze-man-comics/

> NOTE: Windows filesystem is case-insensitive but GitHub Pages (Linux) is case-sensitive.
> `assetsDir` in vite.config.js is set to `Assets` (uppercase) to match `public/Assets/`.

## Architecture

- `src/` — React components, context, data, styles
- `public/` — Static files served as-is (episode HTML files, assets, icons)
- `index.html` — Thin Vite shell (loads Babylon.js from CDN)
- `vite.config.js` — Vite + React Compiler + PWA config, base: '/the-maze-man-comics/'
- `capacitor.config.json` — Native app config, webDir: 'dist'

### Key Source Files
- `src/context/AppContext.jsx` — Global state (XP, lang, tabs, maze, profile)
- `src/components/screens/HomeScreen.jsx` — CSS Maze Man character, comics showcase
- `src/components/maze/MazeOverlay.jsx` — Full Babylon.js 3D maze
- `src/components/video/VideoPlayer.jsx` — Canvas 2D player + Web Speech API
- `src/styles/global.css` — All CSS including mobile responsive fixes
- `public/episode-1-problem-solving.html` — Standalone Canvas 2D episode game

### Episode-1 Game (3-Panel Book Layout)
- All 3 floors visible simultaneously (Monument Valley style)
- 1 gate guardian per floor: Pixel Pete (robot), Dr. Spark (scientist), Maze King (king)
- Guardian blocks a locked door arch on the right; solve their mini-game to unlock
- Locked door is a physical wall; player can't walk through until NPC is helped
- Back button: closes open overlays first (minigame → insight → NPC), then navigates home
- 3 mini-game types: grid, sequence, maze

### External Dependencies (CDN only)
- **Babylon.js** — 3D engine for the maze game
- **Google Fonts** — Bangers, Comic Neue, Outfit, Cairo, DM Mono

### Audio
Synthesized via Web Audio API (no audio files). Narration uses Web Speech API text-to-speech.

---

## PENDING WORK: Security & Database

### Status
- Supabase was set up in a previous session but is NOT yet integrated into the React app.
- Security hardening has NOT been done yet.
- These must be completed before any public/production launch.

### Database (Supabase)
- [ ] Connect Supabase client to the React app (`@supabase/supabase-js`)
- [ ] Store Supabase URL and anon key in `.env` file (NEVER hardcode in source)
- [ ] Add `.env` to `.gitignore` so secrets never reach GitHub
- [ ] Tables needed: `users`, `progress` (XP, floors unlocked), `comics_read`, `profiles`
- [ ] Use Supabase Auth for login (email/password + Google OAuth)
- [ ] Row Level Security (RLS): every table must have RLS enabled — users can only read/write their own rows
- [ ] Never expose service role key to the frontend — server-side only

### Security Checklist (PWA Hardening)
- [ ] **Content Security Policy (CSP)**: Add strict CSP headers — allow only trusted CDNs (BabylonJS, Google Fonts), block inline scripts except where needed
- [ ] **HTTPS only**: GitHub Pages already enforces HTTPS — maintain this on any future hosting
- [ ] **No secrets in source**: All API keys, Supabase URL/keys in `.env`, never committed to Git
- [ ] **Input sanitization**: Sanitize any user-submitted text (username, profile data) before storing in Supabase
- [ ] **Rate limiting**: Enable Supabase rate limiting on auth endpoints to prevent brute force
- [ ] **Auth token storage**: Store Supabase session in `localStorage` (Supabase default) — never in URL params
- [ ] **XSS prevention**: React already escapes JSX output — avoid `dangerouslySetInnerHTML` everywhere
- [ ] **CSRF protection**: Not needed for pure SPA + Supabase (token-based auth, no cookies)
- [ ] **Dependency audit**: Run `npm audit` before every release and fix critical/high vulnerabilities
- [ ] **Subresource Integrity (SRI)**: Add `integrity` hash attributes to CDN script tags in `index.html` (Babylon.js CDN)
- [ ] **Service Worker scope**: Ensure SW only caches intended routes — never cache auth tokens
- [ ] **Capacitor native**: When building for iOS/Android, enable Capacitor's HTTPS-only mode and disable `cleartext` traffic
- [ ] **Environment separation**: Use separate Supabase projects for dev vs. production

### Priority Order
1. Supabase Auth + user table + RLS
2. `.env` setup and secret management
3. CSP headers
4. Input sanitization
5. `npm audit` clean
6. SRI for CDN scripts
