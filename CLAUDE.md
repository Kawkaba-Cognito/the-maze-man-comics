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

After any update, build and deploy with:

```bash
npm run build && npx gh-pages -d dist
```

GitHub Pages is configured to serve from the `gh-pages` branch (root folder).
Live URL: https://kawkaba-cognito.github.io/the-maze-man-comics/

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
