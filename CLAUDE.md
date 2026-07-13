# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app actually is

Despite the repo name, **this is primarily a bilingual (EN/AR) cognitive-training platform** ("Brain Games") — 6 cognitive domains with ~19 training games, a clinical-style assessment battery, a guided daily workout, a puzzles arcade, a habits/wellbeing tracker, and a 3D Babylon.js maze world with a campaign. The psychology comics (Maze Man) are the origin of the project and still exist (home-screen showcase, canvas episode player, a standalone episode game in `public/`), but most of the code and all recent work is the training platform.

React 19 + Vite 8 PWA with Capacitor for native builds. No backend: **zero network calls in `src/`** — all state lives in localStorage, Babylon.js comes from CDN (lazy, SRI-pinned), fonts from Google Fonts.

## Running & deploying

```bash
npm install --legacy-peer-deps   # required — plain npm install fails on peer deps
npm run dev                      # localhost:5173/the-maze-man-comics/
npm run build                    # production build + PWA service worker
```

**Deploy after every update — no exceptions.**

⚠️ **`npx gh-pages -d dist` is unreliable on this machine** — it has repeatedly hung 5+ minutes or corrupted its internal clone cache (`node_modules/.cache/gh-pages`) mid-deploy across many sessions. Don't reach for it. Use the manual method below.

This checkout's git HEAD lives on the `gh-pages` branch itself — the built site's tracked files (`Assets/`, `index.html`, `sw.js`, …) sit in the same working directory as the React source, which is untracked on top of it. That's normal for this repo, not a broken checkout.

**Reliable manual deploy:**

```bash
npm run build
# Replace only the tracked dist-mirror paths. NEVER `git add -A` here — it
# would also sweep in the untracked src/, node_modules/, .vite/, package.json
# etc. sitting in the same working directory.
rm -rf Assets episode-1-problem-solving.html favicon.ico icons index.html manifest.webmanifest registerSW.js sw.js workbox-*.js
cp -r dist/. .
git add Assets episode-1-problem-solving.html favicon.ico icons index.html manifest.webmanifest registerSW.js sw.js workbox-*.js
git commit -m "Deploy: <summary>"
git push origin gh-pages       # Kawkaba-Cognito — the live site, this is the one that matters
git push cognitive gh-pages    # second remote/mirror; retry once if "Repository not found"
```

**Verify it actually landed** (a successful `git push` message isn't proof — see the 2026-07-11 incident where a broken deploy tool still produced a real, pushed, no-op commit):

```bash
grep -oE 'Assets/index-[A-Za-z0-9_-]+\.js' index.html                                                          # local entry hash
curl -s "https://kawkaba-cognito.github.io/the-maze-man-comics/" | grep -oE 'Assets/index-[A-Za-z0-9_-]+\.js'  # live entry hash — must match
```

Live: https://kawkaba-cognito.github.io/the-maze-man-comics/

**Known flakiness on this machine** (environment-level, not code bugs — workaround, don't try to "fix"):
- **Multi-account Git Credential Manager** — two GitHub accounts are configured here; `cognitive` remote reads/writes intermittently fail with "Repository not found" or auth as the wrong account. Retry — it usually resolves in 1–2 tries.
- **IPv4 routing black holes** — github.com DNS round-robins across several IPs; on this network, some `.4`-ending IPs have timed out for minutes while `.3`-ending ones return instantly. Symptom: git/curl to github.com hangs ~21s despite the rest of the internet being fine. This is routing, not auth — don't re-authenticate, route around it (a local CONNECT proxy pinned to a working IP has fixed this before).
- **Large-pack connection resets** — pushing the ~20MB+ built asset pack has hit `HTTP 408` / mid-upload disconnects on this network. Fix: `git config http.postBuffer 157286400` and `git config http.version HTTP/1.1` in this repo before pushing, `--unset` after.

## Things that look wrong but are load-bearing

- **`assetsDir: 'Assets'` (capital A)** in vite.config.js — Windows is case-insensitive, GitHub Pages (Linux) is not; must match `public/Assets/`.
- **Service worker precaches only the shell** (css/html/svg/icons — no JS chunks). Deliberate: precaching all chunks stalled SW install on GitHub Pages and froze every training game in production. Do not "fix" this by widening `globPatterns`.
- **Babylon.js is pinned** to v9.11.0 with an SRI hash in `src/context/AppContext.jsx` (`beginMazeEntry`). Bumping the version without recomputing the `integrity` hash silently breaks the entire 3D maze.
- **`npm install` needs `--legacy-peer-deps`.**
- **Lazy chunks self-heal**: `src/lib/lazyWithRetry.js` retries a failed dynamic import once, then drops caches and reloads — covers stale-manifest 404s right after a deploy.
- Base path is `/the-maze-man-comics/` — deep asset URLs go through `src/lib/assetUrl.js`.

## Names that lie (read this before searching)

| You see in the UI | Where it lives | Why |
|---|---|---|
| The whole training platform | tab id `'comics'` → `components/screens/ComicsScreen.jsx` | training took over the old comics tab |
| Car Park (cars → parking) | `domains/attention/games/train-switch/` | re-themed from trains, folder kept |
| Letter-link word game | `domains/language/games/wordle/` | evolved away from Wordle |
| Word Links | `domains/language/games/synonyms/` | merged/renamed |
| Story Time | `domains/memory/games/story-grid/` | product name differs |
| Cancellation game (`cancel-task`) | `domains/attention/games/cancellation/` | key vs folder |
| Detective Kawkab's production engine | `games/detective/prototypes/ProtoEngine.jsx` | the "prototype" won and became production |
| Kawkab (the planet mascot) | code calls it Cosmos (`CosmosCharacter`, `drawCosmosRunner`) | Arabic product name vs code name |

Vocabulary layers: UI **"Survival"** = code `mode === 'free'` / `free*` keys · UI **"Pass n Play"** = code mode `'passplay'` with string keys named `chal*`/`challenge*` · "Levels" = `'levels'`.

## Architecture

```
src/
├── main.jsx → App.jsx → SplashScreen (menu) → components/AppShell.jsx (tab router)
├── context/AppContext.jsx      global state: XP/points, lang, tabs, maze entry, audio, speech
├── components/
│   ├── screens/                tab screens (HomeScreen, ComicsScreen=TRAINING, PuzzlesScreen,
│   │                           WorkoutScreen, ProfileScreen, Shop/RewardsShop, CharacterScreen)
│   ├── maze/                   Babylon 3D world: RoomHost (dispose-on-switch room host) + rooms/
│   └── training/RadialMazeHub.jsx   the radial training hub UI (used by ComicsScreen)
├── features/
│   ├── training/               THE core feature — see below
│   ├── puzzles/                separate puzzle arcade (sudoku, kakuro, nonogram, …) with its
│   │                           own shared/ frame + engines; validated by scripts/validate-puzzles.mjs
│   ├── workout/                one-press guided daily session (plan generator, reaction tests)
│   ├── relax/                  wellbeing: habits system, MBSR, breathing, soundscapes
│   ├── army/ campaign/         3D-maze campaign state (recruits, floors, boss power)
│   ├── character/              mascot customization
│   └── shared/                 cross-feature tutorial primitives
├── lib/                        framework-free utilities: rng.js (the ONE mulberry32),
│                               math.js (clamp/lerp), storage.js (loadJson/saveJson/
│                               createProfileStore), assetUrl, lazyWithRetry, points
└── styles/
```

`ARCHITECTURE.md` at the repo root is the **target** layout — it is partially aspirational (no `src/app/`, no `i18n/`, screens still under `components/`). Read it before structural changes, but trust the tree above for what exists today.

### Training feature (`src/features/training/`)

- **`registry.js`** — the spine: imports every `domains/<domain>/domain.config.js`. **Adding a game = one wiring spot**: add a sub with `gameKey` + `loader: () => import('./games/foo')` to the domain config; `lazyGames.js` auto-builds the lazy component map from the registry. (Optionally wire `rating.js`/trialLog for stats — newer games aren't all instrumented yet.)
- **Domains & live games** (per domain.config.js): attention `cancel-task, mot, train-switch` · speed `speed-match, math-gates, trail-making` · memory `memo-span, story-grid, nback, paired-associates` · language `wordle, synonyms, trivia` · reasoning `rush-hour, raven-matrices, detective` · flexibility `spatial-stroop, wisconsin, brixton`.
- **`shared/`** — use these, never paste local copies:
  - `ModeShell.jsx` — the standard game flow (menu → Survival / Levels / Pass n Play), tutorial + progress persistence. All newer games are built on it.
  - `trainingStrings.js` — `STR_COMMON.en/.ar`, 43 platform-standard labels (pause/quit, mode names, Pass n Play). Games spread it **first** in their `UI` dict; a local key after the spread is a deliberate override. Wording fixes go here, once.
  - `staircase.js` — the one Levitt 2-down/1-up implementation: `createAdaptiveStaircase` (assessments; additive or multiplicative steps) + simple `createStaircase` ladder. The staircase files inside cancellation/ and mot/ are config shims over it.
  - `canvasLoop.js` — `startCanvasLoop({wrap, rafRef, resize, frame})`: ResizeObserver + DPR sizing + rAF glue for canvas games. **`frame(dt, now)` must `return false` to stop the loop** — a bare `return` keeps running.
  - `trialLog.js` / `metrics.js` — per-trial capture + RT psychometrics (IES, ICV, d′), capped localStorage.
- **Two game generations coexist**: pre-ModeShell monoliths that run their own mode state machines (cancellation ~1.9k lines, rush-hour, speed-match — they also embed assessment batteries), and ModeShell games (3–8× smaller). **Copy a ModeShell game** (e.g. `math-gates`, `detective`) for new work, not a monolith.

### Benched games (complete but unreachable — see BENCHED.md in each)

`flexibility/games/flip`, `flexibility/games/piano-tap`, `language/games/odd-one-out` (its data feeds the pending Word Links merge), `reasoning/games/tower-hanoi` (Colour Sort). Not registered in any domain config; no code path reaches them. Revive via domain config, or delete the folder to retire.

## Bilingual (EN/AR)

No i18n framework. Each component/game carries `const UI = { en: {…}, ar: {…} }` and receives `isAr`; shared labels come from `trainingStrings.js` via spread (see above). RTL is per-component `dir={isAr ? 'rtl' : 'ltr'}`. Some AR strings use Arabic-Indic numerals (`٩٠ث`) — match the surrounding file's convention. Language toggles live in the shell and per-screen headers.

## Persistence

Everything is localStorage, keys prefixed `mm_*` and versioned (`mm_wordle_profile_v1`, `mm_trials_<game>_v1`, `mm_assess_sessions_v1`, …). Go through `src/lib/storage.js` (`createProfileStore(key, defaults)` for per-game profiles; `loadJson`/`saveJson` elsewhere) — it owns the try/catch and quota handling. trialLog caps its own storage (sessions + bytes) so history can't blow the ~5 MB quota. There is no sync/backup — clearing browser data wipes the user (Supabase below will fix this).

## Comics / episodes (the original product)

- `components/video/VideoPlayer.jsx` — Canvas 2D episode player + Web Speech API narration. **Currently orphaned**: its only importer (`VideosScreen`) is not routed from anywhere.
- `public/episode-1-problem-solving.html` — a complete standalone Canvas game (3-floor Monument-Valley-style book layout, gate guardians, mini-games). It bypasses React and the build entirely — it is served as-is and has its own inline JS/CSS conventions.
- Audio app-wide is synthesized via Web Audio API — there are no audio files.

## Validation scripts

`npm run validate:puzzles` · `npm run audit:fq` (cancellation level curriculum) · `npm run lint`. Run the relevant one after touching generators or level data. ⚠️ `npm run validate:rh` is currently **broken** — it imports `src/components/training/rushHourEngine.js`, which no longer exists (the engine lives at `src/features/training/domains/reasoning/games/rush-hour/engine.js`).

---

## PENDING WORK: Security & Database

Status: Supabase project exists but is **not integrated**; must be done before public launch.

### Database (Supabase)
- [ ] Wire `@supabase/supabase-js`; URL + anon key in `.env` (never hardcode; `.env` in `.gitignore`)
- [ ] Tables: `users`, `progress`, `comics_read`, `profiles` — RLS on every table (own rows only)
- [ ] Supabase Auth (email/password + Google OAuth); never expose the service-role key to the frontend
- [ ] Configure custom SMTP before launch — built-in Supabase SMTP allows only ~2–4 auth emails/hour (signups will silently stall)
- [ ] Migrate the `mm_*` localStorage state through `src/lib/storage.js` (single choke point, already in place)

### Security checklist (partially done)
- [x] CSP meta tag in `index.html` (trusted CDNs only) — keep in sync when adding origins
- [x] SRI on the Babylon CDN script (in AppContext, not index.html)
- [x] HTTPS (GitHub Pages enforced)
- [ ] Input sanitization for any future user-submitted text (before Supabase writes)
- [ ] Supabase auth rate limiting
- [ ] `npm audit` clean before each release
- [ ] Capacitor native: HTTPS-only, no cleartext, separate dev/prod Supabase projects

Priority: Auth + RLS → `.env` secrets → sanitization → audit clean.
