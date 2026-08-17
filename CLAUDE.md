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

**Deploying is automatic (2026-07-16)**: every push to `main` on `origin` (Kawkaba-Cognito) triggers `.github/workflows/deploy.yml`, which installs, runs **`audit:sec` → `validate:wordmaze` → `audit:pacing` → `validate:storyq` → `validate:liars` → `audit:fq` → `validate:rh` → `audit:mot` → `audit:design`** (all nine block the deploy), builds, and publishes `dist/` to the `gh-pages` branch — the branch GitHub Pages serves. It can also be run by hand from the repo's Actions tab (workflow_dispatch). The `cognitive` mirror does **not** auto-deploy; push `gh-pages` there manually if the mirror should stay current.

⚠️ **A deploy must NEVER delete the previous build's files (2026-07-26).** It used to wipe `gh-pages` and copy `dist/` in, which deleted every old content-hashed chunk. Any client still holding the previous `index.html` — an open tab, or an installed PWA — then 404'd on chunks; when the missing one was the **entry** chunk the page could not boot at all, because React and the ErrorBoundary live inside it. That is the "app errored and crashed, fine the next day" report: no in-app recovery, just a dead screen until the service worker happened to update. Caught live: the precached shell named `Assets/index-BHkJm4nN.js`, already 404 on the server.

The publish step now keeps the **last two builds** alive and prunes only what has been absent that long. `.deploy-manifest` (this build's file list) and `.deploy-manifest.prev` are the ledger — dot-prefixed, so Pages never serves them; deleting them silently disables the grace period. Paired with the network-first shell in `vite.config.js` (below) — **both halves are needed**, since the retention only helps clients whose service worker is still serving a stale shell.

⚠️ **This checkout's HEAD is on `main`, which is source-only — NEVER commit built files here.** (A 2026-07-15 deploy accidentally committed the dist mirror to `main` and had to be reverted.) `main` still *tracks* a stale snapshot of some built files at the repo root (old `index.html`, `Assets/*.glb`, `icons/`, …) left over from when this checkout lived on `gh-pages` — leave them alone; don't "refresh" or delete them as part of a deploy.

**Before assuming the repo is at fault, check whether GitHub is** (2026-08-06). "CI normally deploys instantly, why not now?" had nothing to do with this codebase: a critical Actions+Pages incident was **dropping push events outright** — no workflow run was ever created for two pushes, and an `--allow-empty` re-trigger was swallowed too. Diagnose before debugging:

```bash
curl -s https://www.githubstatus.com/api/v2/components.json      # filter Actions / Pages
curl -s https://www.githubstatus.com/api/v2/incidents/unresolved.json
```

A green local `build` + `audit:fq` + `validate:rh` with **no run appearing in `gh run list`** is an outage signature, not a repo problem.

⚠️ **A stuck legacy Pages build blocks the queue, and it is invisible from `gh run list`.** Pages here is `build_type: legacy` (serves the `gh-pages` branch, source `/`), so after our workflow publishes, *GitHub's own* `pages build and deployment` must run. On 2026-08-06 that build sat at `status: building` for ~19 hours; nothing behind it could publish, so even a correct push went nowhere. Check it directly — this is the single most useful deploy diagnostic:

```bash
gh api repos/Kawkaba-Cognito/the-maze-man-comics/pages                # build_type, source, status
gh api repos/Kawkaba-Cognito/the-maze-man-comics/pages/builds/latest  # status / error / commit
```

`status: built` + a matching `commit` is the real proof a deploy landed. Pushing a fresh commit to `gh-pages` superseded the stuck build and it completed.

⚠️ **`git push origin main` fails by default, and the fix is deterministic — do not retry it and do not hand it to the user.**

The `gh` CLI here is authenticated as `thecognitivedolphin-commits`, and that account is **read-only on origin** (`gh api repos/Kawkaba-Cognito/the-maze-man-comics --jq '.permissions'` → `"push": false`). GCM holds that account as its default for `github.com`, so a plain push hands over the wrong credential and gets `403 Permission ... denied to thecognitivedolphin-commits`.

**Naming the account in the URL makes GCM look up the other one instead** (verified again 2026-08-14):

```bash
git push cognitive main                     # dolphin account owns this one; works normally
git push https://Kawkaba-Cognito@github.com/Kawkaba-Cognito/the-maze-man-comics.git main:main
```

⚠️ Both print a spurious `fatal: Cannot prompt because user interactivity has been disabled` **while still succeeding**. Trust the `718d604..2581bf8  main -> main` line, not the fatal. And note the read-only `gh` token means the *escape hatches* really are closed — `gh workflow run deploy.yml` returns `403 Must have admin rights` and `POST /pages/builds` returns `404` — but the push itself is fine, so `npm run push:both` only fails on its origin half.

⚠️ `git fetch origin` / `git ls-remote origin` can hang for minutes on this network (see IPv4 routing below). To confirm a push landed, ask the API instead: `gh api repos/Kawkaba-Cognito/the-maze-man-comics/commits/main --jq '.sha'`.

**Manual fallback** (only if Actions is unavailable) — deploy through a `gh-pages` worktree, never on `main`:

⚠️ **The manual fallback ships things CI never would.** CI builds from a clean checkout of *tracked* files; a local `npm run build` copies **all of `public/`** into `dist/`, including untracked scratch. On 2026-08-06 this put 211 files / 2.6 MB of `public/_tmp_preview/` on the live site (and into the SW precache) in the space of one push. As of that date **~13.9 MB of untracked files sit in `public/`**. Check before building, and remove from the worktree anything that was in no previous deploy (safe to delete outright — no client can hold a shell referencing it):

```bash
git status --short public/          # anything here ships on a MANUAL deploy
```

```bash
npm run build
# A full fetch of gh-pages dies with "fetch-pack: invalid index-pack output"
# (the branch's history is large). Shallow-fetch and build the worktree detached:
git fetch --depth=1 origin gh-pages
git worktree add --detach "$TEMP/gh-pages-deploy" FETCH_HEAD
# Copy dist/. in ON TOP of what is there — do NOT delete the existing files first.
# The old "wipe everything except .git" step is what caused the 2026-07-26 crash
# (see above); wiping by hand here reintroduces it and strands live clients.
# Leave .deploy-manifest{,.prev} alone — CI owns the pruning.
git -C "$TEMP/gh-pages-deploy" add -A        # safe THERE — gh-pages holds only the site
git -C "$TEMP/gh-pages-deploy" commit -m "Deploy: <summary>"
git -C "$TEMP/gh-pages-deploy" push origin HEAD:gh-pages   # the live site (detached worktree)
git -C "$TEMP/gh-pages-deploy" push https://thecognitivedolphin-commits@github.com/thecognitivedolphin-commits/the-maze-man-comics.git HEAD:gh-pages  # see the credential note below
git worktree remove "$TEMP/gh-pages-deploy" --force
```

(A manual deploy does **not** update `main`'s CI state — the next healthy push simply rebuilds from source and produces the same output. Nothing needs undoing.)

(⚠️ `npx gh-pages -d dist` is unreliable on this machine — repeated hangs and corrupted clone cache. Don't reach for it.)

**Verify it actually landed** (a successful push isn't proof — see the 2026-07-11 incident where a broken deploy tool still produced a real, pushed, no-op commit):

```bash
grep -oE 'Assets/index-[A-Za-z0-9_-]+\.js' dist/index.html                                                     # local entry hash
curl -s "https://kawkaba-cognito.github.io/the-maze-man-comics/" | grep -oE 'Assets/index-[A-Za-z0-9_-]+\.js'  # live entry hash — must match
```

Also spot-check any **new asset paths** the release introduced — a matching entry hash only proves the JS shipped, not the art:

```bash
B=https://kawkaba-cognito.github.io/the-maze-man-comics
for p in Assets/characters/kawkab/kawkab-planet.webp Assets/domain-art/category-drawings-2026/attention.webp; do
  printf '%-58s ' "$p"; curl -s -o /dev/null -w '%{http_code}\n' "$B/$p"
done
```

⚠️ **Art referenced from `src/` but never `git add`ed builds green locally and 404s in production** — `public/` is served from the repo, and dev reads the working tree so untracked files resolve fine. Nothing in build/lint/CI catches it. Caught on 2026-08-06: `shared/cast2d.js` and all six hub planets were referenced by committed code while their `.webp` files were untracked (Detective and Story Time would have shipped with broken characters). Before committing an art-carrying change, cross-check referenced paths against tracked ones:

```bash
git grep -h -oE "Assets/[A-Za-z0-9._/-]+" -- src   # referenced (normalise '//', skip ${…} templates)
git ls-files public                                # tracked
git diff --cached --name-only                      # staged
```

Live: https://kawkaba-cognito.github.io/the-maze-man-comics/

**Known flakiness on this machine** (environment-level, not code bugs — affects manual pushes only, CI runners are unaffected; workaround, don't try to "fix"):
- **Multi-account Git Credential Manager** — two GitHub accounts are configured here, and each remote needs its own account named in the URL. ⚠️ **`git push cognitive main` failing with `remote: Repository not found` is NOT flakiness to retry through** (2026-08-14, corrected after two wasted retries). GCM hands over the *Kawkaba-Cognito* credential, which cannot see the private dolphin repo — and GitHub answers *not found* rather than *forbidden* for a repo you lack access to, so the message actively misleads. Confirm in one call that the token is fine (`gh api repos/thecognitivedolphin-commits/the-maze-man-comics --jq '.permissions'` → `admin:true, push:true`), then name the account:

  ```bash
  git push https://thecognitivedolphin-commits@github.com/thecognitivedolphin-commits/the-maze-man-comics.git main:main
  ```

  So **both** remotes take an account-qualified URL, each naming its own owner. That is the whole recipe; neither should be retried blindly.
- **IPv4 routing black holes** — github.com DNS round-robins across several IPs; on this network, some `.4`-ending IPs have timed out for minutes while `.3`-ending ones return instantly. Symptom: git/curl to github.com hangs ~21s despite the rest of the internet being fine. This is routing, not auth — don't re-authenticate, route around it (a local CONNECT proxy pinned to a working IP has fixed this before).
- **Large-pack connection resets** — pushing the ~20MB+ built asset pack has hit `HTTP 408` / mid-upload disconnects on this network. Fix: `git config http.postBuffer 157286400` and `git config http.version HTTP/1.1` in this repo before pushing, `--unset` after.

## Things that look wrong but are load-bearing

- **`assetsDir: 'Assets'` (capital A)** in vite.config.js — Windows is case-insensitive, GitHub Pages (Linux) is not; must match `public/Assets/`.
- **Service worker precaches only the shell** (css/html/svg/icons — no JS chunks). Deliberate: precaching all chunks stalled SW install on GitHub Pages and froze every training game in production. Do not "fix" this by widening `globPatterns`.
- **`index.html` is deliberately NOT precached, and `navigateFallback` is deliberately `undefined`** (2026-07-26). vite-plugin-pwa defaults `navigateFallback` to `'index.html'`, which registers a NavigationRoute serving the *cached* shell for every navigation — a shell that outlives the deploy and keeps naming entry chunks that no longer exist. Navigations go through the `app-shell` NetworkFirst rule instead: online you always boot from HTML that matches the server, offline you fall back to the last shell that loaded. It has **no `networkTimeoutSeconds` on purpose** — a timeout would serve the stale shell again on a slow connection, and the document is ~2 KB. Restoring either default re-breaks the app after a deploy.
- **Runtime cache `maxEntries` must stay well above one build's file count.** Workbox's ExpirationPlugin refuses to *serve* entries past the cap, not just evict them, so a too-small cap silently breaks offline. At `app-scripts: 100` (== this build's 100 chunks) the app's own entry chunk was unreachable with the network down. Now 400 (scripts) and 600 (`assets`; 459 art/GLB files). Re-check these when the build grows.
- **Babylon.js is pinned** to v9.11.0 with an SRI hash in `src/context/AppContext.jsx` (`beginMazeEntry`). Bumping the version without recomputing the `integrity` hash silently breaks the entire 3D maze.
- **`npm install` needs `--legacy-peer-deps`.**
- **Lazy chunks self-heal**: `src/lib/lazyWithRetry.js` retries a failed dynamic import once, then drops caches and reloads — covers stale-manifest 404s right after a deploy. It cannot cover a missing **entry** chunk: it lives inside that chunk, so if the entry 404s nothing runs at all. That case is prevented upstream, by the two fixes above.
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
| Detective (a logic game, no scene to search) | `domains/reasoning/games/detective/` | it was an investigation adventure until 2026-08-17 |
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

- **`registry.js`** — the spine: imports every `domains/<domain>/domain.config.js`. `lazyGames.js` auto-builds the lazy component map from it.

  ⚠️ **Adding a game is SEVEN wiring spots, not one** (corrected 2026-08-10 — the old "one wiring spot" claim here was wrong, and believing it leaves games half-registered). Wiring Keep Track touched: `domain.config.js` · `rating.js` · `shared/gameScience.js` · `shared/tutorials/trainingMeta.js` · `shared/GamePlanetTile.jsx` (**two** places: `COVER_KEYS` and `COVER_FILE_OVERRIDES`) · `package.json` (if it has a content bank needing a `validate:*` gate) · `lazyGames.js` (**only** if the assessment battery runs it).

  `lazyGames.js` is the trap. It builds from the registry, so removing a game's sub also removes it from `getLazyGame` — and if the assessment uses that game, its pillar renders **nothing**, with no error. `memo-span` and `nback` both carry explicit fallback registrations there for exactly this reason. Check with `git grep -n "gameKey: '<key>'" -- src/features/training/assessment` before unregistering anything.

  📐 **The full standard lives in the `consistency` skill** (`.claude/skills/consistency/SKILL.md`) — ⚠️ which is **gitignored** (`.gitignore:24`), so it is machine-local and does NOT travel with a clone. Enforced by `npm run audit:consistency`, which does ship. Read it before adding a game or fixing one that "feels like a different app". It carries the ten structural rules, the depth checklist, and **two** reference games: copy **structure** from `keep-track` (22/22), take the bar for what a finished game **contains** from `cancel-task` (8/8 depth — but never copy its 2381-line code).
- **Domains & live games** (per domain.config.js): attention `cancel-task, mot, train-switch` · speed `speed-match, math-gates, intercept` (Intercept is **Rift Defense** in ALL THREE modes since 2026-08-18 — lanes, waves, hearts. The 2026-08-14 version was survival-only and sold **upgrades between sectors**; that shop is deleted, see below) · memory `story-grid, keep-track, paired-associates` (Story Time's retrieval half is **Kawkab Asks** since 2026-08-17 — see below) · language `wordle, synonyms, trivia` · reasoning `rush-hour, raven-matrices, detective` · flexibility `mirror-world, task-switch, sort-shift`.

  ⚠️ **Two games lost their hub slot on 2026-08-10 and are still load-bearing.** `nback` (replaced by Keep Track) still runs the **Assessment**'s memory pillar; `spatial-stroop` (replaced by Mirror World) still runs the Assessment's **flexibility** pillar **and** is scheduled by weight in `workoutData.js`. Both keep explicit loaders in `lazyGames.js`. Delete either registration and that part of the battery/workout renders **nothing**, with no error.
- **`shared/`** — use these, never paste local copies:
  - `ModeShell.jsx` — the standard game flow (menu → Survival / Levels / Pass n Play), tutorial + progress persistence. All newer games are built on it.
  - `trainingStrings.js` — `STR_COMMON.en/.ar`, 43 platform-standard labels (pause/quit, mode names, Pass n Play). Games spread it **first** in their `UI` dict; a local key after the spread is a deliberate override. Wording fixes go here, once.
  - `staircase.js` — the one Levitt 2-down/1-up implementation: `createAdaptiveStaircase` (assessments; additive or multiplicative steps) + simple `createStaircase` ladder. The staircase files inside cancellation/ and mot/ are config shims over it.
  - `difficulty.js` — the ONE place a level becomes a difficulty fraction: `levelFraction(level, levelsPerTier, curve)` (`CURVE.FRONT` 0.85 default / `CURVE.LINEAR`), `tierStage(stage)` for survival ramps, `lerp`. ~14 files had independently reinvented `(level-1)/99`, split 7-and-7 between `^0.85` and linear with no rule — `trail-making` uses **both**, 25 lines apart. New games call this; migrate an old one whenever you touch its curve.

    ⚠️ **A data module imported by a gate must use explicit `.js` in its own imports.** Vite resolves extensionless paths, plain Node does not, and the gates run in Node — so dropping the extension breaks *the gates*, not the app, which is the kind of failure that only shows up in CI. Adding `difficulty.js` without it silently took `validate:keeptrack` and `validate:mirror` down.
  - `canvasLoop.js` — `startCanvasLoop({wrap, rafRef, resize, frame})`: ResizeObserver + DPR sizing + rAF glue for canvas games. **`frame(dt, now)` must `return false` to stop the loop** — a bare `return` keeps running.
  - `trialLog.js` / `metrics.js` — per-trial capture + RT psychometrics (IES, ICV, d′), capped localStorage.
- **Two game generations coexist**: pre-ModeShell monoliths that run their own mode state machines (cancellation ~1.9k lines, rush-hour, speed-match — they also embed assessment batteries), and ModeShell games (3–8× smaller). **Copy a ModeShell game** (e.g. `math-gates`, `detective`) for new work, not a monolith.

### Benched games (complete but unreachable — see BENCHED.md in each)

`flexibility/games/wisconsin` (Card Sort, WCST) and `flexibility/games/brixton` (Kawkab Hops, Brixton) were benched 2026-08-09 and replaced by `task-switch` + `sort-shift`. Neither was badly built; the domain was running the SAME LOOP twice — infer a hidden rule from sparse feedback, then notice it silently changed — and that loop punishes the player for the trial after a switch that is unguessable by design. Their BENCHED.md files carry the reasoning and, for Brixton, the measured 8% of top-tier rounds unsolvable at any demo length.

`speed/games/trail-making` was benched 2026-08-14 and replaced by `intercept`. It was not broken — it was the speed domain's THIRD foveal, symbolic, sequential task, alongside Speed Match and Math Gates, so the domain measured one thing three ways. Intercept is none of those: no symbol to decode, no answer to choose, and the measure is a signed error in milliseconds. ⚠️ The assessment battery never used trail-making (checked before unregistering), but its `gameScience.js` and `trainingTutorialSteps.jsx` entries are deliberately left in place, and **Intercept's hub tile still borrows its art** (`COVER_FILE_OVERRIDES.intercept = 'speed-trail-making-v2.webp'`) — so do not delete that `.webp`.

`language/games/odd-one-out` — its game component is unreachable, but **its `data.js` is a live dependency** of Word Links (`synonyms` imports `CATEGORIES` from it), so don't delete the folder. `memory/games/memo-span` is also unregistered but deliberately kept for possible re-enable. Flip, Piano Tap, and Colour Sort (tower-hanoi) were retired and deleted 2026-07-16 (recoverable from git history).

### On-device personalization (`src/features/personalization/`) — added 2026-08-14

A small MLP (one hidden layer, tanh, softmax + cross-entropy, back-prop) that
learns which **training domain**, **difficulty direction** and **wellbeing
practice** to suggest. Dependency-free on purpose — a PWA that must stay instant
on old phones is not adding an ML runtime.

- **Three models**, all in one localStorage key `mm_personalization_v1` via
  `lib/storage.js`: `training` (18→12→6), `difficulty` (6→7→3), `wellbeing`
  (8→9→8).
- **Opt-in and off by default.** `recordTrainingOutcome` is wired into
  `rating.js` and every record/predict call returns immediately unless the user
  turned it on. Toggles live in `RadialMazeHub` (Training) and `RelaxScreen`
  (Wellbeing), each with a reset.
- **Cold-start gated**: no prediction until 3–4 examples exist, so it cannot
  confidently recommend from nothing.
- **`validNetwork()` shape-checks a stored model against the current spec** and
  falls back to a fresh one. Changing a layer size therefore retires old models
  safely instead of reading garbage — do not remove that check.
- History is capped at 40 entries per stream. `npm run validate:personalization`
  asserts the network maths, cold start, persistence and the learning gates.

⚠️ It learns **only** from choices and completed runs already made in the app; no
raw trial data is copied in. Keep it that way — see the security note below.

## Bilingual (EN/AR)

No i18n framework. Each component/game carries `const UI = { en: {…}, ar: {…} }` and receives `isAr`; shared labels come from `trainingStrings.js` via spread (see above). RTL is per-component `dir={isAr ? 'rtl' : 'ltr'}`. Some AR strings use Arabic-Indic numerals (`٩٠ث`) — match the surrounding file's convention. Language toggles live in the shell and per-screen headers.

## Persistence

Everything is localStorage, keys prefixed `mm_*` and versioned (`mm_wordle_profile_v1`, `mm_trials_<game>_v1`, `mm_assess_sessions_v1`, …). Go through `src/lib/storage.js` (`createProfileStore(key, defaults)` for per-game profiles; `loadJson`/`saveJson` elsewhere) — it owns the try/catch and quota handling. trialLog caps its own storage (sessions + bytes) so history can't blow the ~5 MB quota. There is no sync/backup — clearing browser data wipes the user (Supabase below will fix this).

## Comics / episodes (the original product)

- `public/episode-1-problem-solving.html` — a complete standalone Canvas game (3-floor Monument-Valley-style book layout, gate guardians, mini-games). It bypasses React and the build entirely — it is served as-is and has its own inline JS/CSS conventions. (The old React episode player, `VideoPlayer.jsx`/`VideosScreen`, has been deleted.)
- Audio app-wide is synthesized via Web Audio API — there are no audio files.

## Validation scripts

`npm run validate:personalization` (the neural personalization engine — network maths, cold start, persistence, learning gates) · `npm run validate:puzzles` · `npm run validate:rh` (rush-hour reference solutions; `--full` for the hard ref puzzle) · `npm run audit:fq` (cancellation level curriculum **and** a zero-ink guard on every `SH` silhouette) · `npm run audit:mot` (Target Tracking difficulty curve) · `npm run validate:wheel` (The Wheel's three content banks) · `npm run validate:sort` (Sort It Another Way's card sets) · `npm run validate:keeptrack` (Keep Track's category bank — cross-category exclusivity in EN **and** AR) · `npm run validate:intercept` (Intercept — asserts the player's questions, not the curve's shape: enough of the run VISIBLE to judge speed, a hit window wider than human timing noise, every route inside the play box, every bounce corner hidden at every level so the direction change is never seen, and all 8 routes actually dealt across simulated trials) · `npm run validate:mirror` (Mirror World schedules — asserts every run ENDS with a washout block, because one missing plays fine and silently never shows the aftereffect, **plus control parity: every input method must be able to pass every level**) · `npm run validate:liars` (Detective's GENERATED cases — re-solves every one with an independent enumerator: no case without a consistent world, no question whose answer differs between worlds, no "how many are lying" under a rule that already states the count, no "tap the innocent" where nobody or everybody can be cleared. Also asserts the QUESTION MIX stays varied, which is the anti-boredom check and the one that caught the real bug) · `npm run validate:storyq` (Story Time's GENERATED questions — every answer re-derived from the story's beats, on all 45 stories across many seeds: exactly one option correct, no duplicate options, the prompt naming the scene the answer belongs to, the "did you see this scene?" lure flagged real/fake correctly, and the count question never degenerate. Also asserts the curve, the pass rule, and that a wrong answer index still fails) · `npm run audit:curves` (level curves — monotonic per tier, and a harder tier is actually harder **at the same level number**; also names the games whose curve lives in `index.jsx` and therefore cannot be gated — **2 left**: train-switch, speed-match) · `npm run audit:pacing` (the ms-per-stimulus FLOOR a human actually meets, at every level of every tier and across survival, **plus** that each game still grows harder through load — see the note above) · `npm run validate:wordmaze` (Word Maze's curated short-word dictionary: junk rejected, real words accepted, every entry cross-checked against the corpus, seeded board words playable, and 180 boards simulated for winnability) · `npm run audit:consistency` (every game against the platform standard on **three** axes — structure /22, **look /6** (ground from a play-surface token · every rendered font is one `index.html` loads · shadows from `--fx-*` not hand-mixed · audio through `playSfx` · the back/pause glyph is the shared icon · **every rendered `{t.key}` resolves**), and depth /8 reported-only; each look rule self-tests against a known-bad fixture on every run, so a detector that stops firing fails the gate instead of silently passing everything. See the `consistency` skill) · `npm run lint`. Run the relevant one after touching generators, level data or content banks.

## The review board (`npm run review`) — reports, never blocks

`review/standards.mjs` holds 18 standards this app is actually held to, across **scientific validity** (cognitive claims, norms, reliable change), **privacy** (GDPR Art. 9 special-category data, Play Store), **application security**, and the **backend that does not exist yet**. Added 2026-08-15 because an assistant is compliant by default: it builds what is asked and does not volunteer "this ships an XSS" or "this scoring model is psychometrically invalid".

```bash
npm run review            # full board, with why / found / do / source
npm run review:since      # ONLY what changed since the last ack — the alarm
npm run review:ack        # accept the current state as the new normal
npm run review:html       # regenerate the visual report (review/report.html)
```

⚠️ **The board REPORTS. The gate that BLOCKS is `audit:sec`.** Do not merge them. The board raises questions of judgement — is "trains your brain" a claim you want to defend, is the consent flow adequate — and a deploy must never hang on those. `review:since` runs non-blocking in both workflows and rides along with the Monday sweep.

⚠️ **Every finding must be MECHANICAL (a check that runs against this repo) or CITED (a URL outside it).** Nothing else may be added. A board that emits confident generic advice is worse than none, because it gets believed — the same failure as `audit:fq` certifying an unplayable game, one level up.

⚠️ **`ctx.grep` excludes content banks; use `ctx.grepUi` for anything about user-facing text.** Three detectors were wrong in the first hour: `icc\b` matched a word inside `link-words-en.js` (a ~200k-word dictionary) and reported the psychometrics standard as PASS — satisfied by a Scrabble list — and the claims detector fired on `BENCHED.md` and a code comment that were *criticising* the claim in question. A grep cannot tell an assertion from a rebuttal.

**`not-yet` is a real status, not a failure.** RLS, rate limiting and auth are genuine requirements that do not apply until Supabase exists; each carries a `trigger` naming when it activates. Rendering them red would make the board cry wolf and get muted.

**TIME IS NOT A DIFFICULTY LEVER, and three games proved it at once** (2026-08-15). Keep Track ran at 650ms/word, Pair Match 520ms/pair, Task Switch 150ms cue-stimulus interval — each below the time needed to *perceive* the stimulus, so the hardest levels stopped measuring the construct and measured reading speed. `npm run audit:pacing` now asserts the floor a player actually meets at every level of every tier and across survival (keep-track 1200ms · paired-associates 900ms · task-switch 450ms CSI / 2100ms deadline · story-grid **8.4s per watched scene**) **and** that each game still grows harder through LOAD — stream length, pair count, switch rate, story length. Same family as `audit:fq`: assert what reaches the human.

⚠ Story Time joined that gate on 2026-08-17 and **failed it immediately**, which is the point: its survival ramp scaled the whole memorize countdown (52 − stage×1.1, floor 30s) while the story grew to six scenes, so by stage 20 a player got **5s per scene** — less than it takes to read one panel's narration. The floor is now enforced structurally inside `levelCfg`/`survivalCfg` (`MIN_SEC_PER_PANEL`), and `memo` is `ceil`ed because rounding the total down pushed the per-scene budget back under the floor by 70ms. Gate SECONDS PER SCENE, never the raw countdown — a six-scene story is *given* more total time, so raw `memo` reports the hard tier as the easiest.

**A WEIGHTED MIX IS A FEATURE; "whatever fits" is a bug** (2026-08-17). Detective was rebuilt from a five-minute noir investigation (~40 files, authored cases, no way to generate or verify one) into **Liars' Ring**: N suspects, one statement each, a rule about who lies, solved in under a minute. Seven question shapes, twelve statement types, six rules. The first generator dealt a case and then picked whichever question the case happened to support — and because `verdict`/`clearAll` accept almost anything while `who` needs a single consistent world, the top tier came out **47% verdict, 34% clearAll, 8% `who`, 0.7% `key`**. Every case was individually valid; the LADDER was the bug. Fixed by choosing the question FIRST (weighted) and dealing until a case supports it, and `validate:liars` now asserts no shape exceeds 45% and none allowed by a tier falls below 3%. ⚠ Two question types deliberately want AMBIGUOUS cases — `verdict` ("is X guilty?" → yes/no/**not enough evidence**) and `clearAll` ("tap everyone you can PROVE innocent") — so the accept test is per question kind, never global.

**A GAME THAT SELLS DIFFICULTY CANNOT ALSO MEASURE IT** (2026-08-18). Intercept was reported as boring, not obviously scaling, and carrying a between-sector **upgrade shop** that "doesn't feel like it belongs". All three were true and all three were measurable. The shop sold `scan` (+80ms of visibility) and `pulse` (+12ms of hit window) while the stage reached fed `awardFreeRun('intercept', …)` → the speed domain rating, so two players with identical timing got different ratings depending on what they bought. Counting NAMEABLE mechanics rather than continuous knobs, the **easy tier had exactly ONE across all 100 levels** — every genuinely new lever lived in med/hard, which is where new players are not. And the boredom was structural rather than tuning: one countdown, one mover, ONE TAP, then dead air. It is now a lane wave game in all three modes — several ships in flight at once, hearts, no shop — which is the same construct under load rather than a different construct. `validate:intercept` gates what a wave asks of a player: one-thumb spacing (`MIN_ARRIVAL_GAP_MS`), concurrency actually honoured, visibility, hiddenness, and per-tier variety. Its curve now lives in `data.js` and is registered in `audit:curves` (ungated games: 3 → 2).

⚠ **Three wave-builder bugs were caught by that gate before any of it reached a screen**, and every one of them would have played fine: ships spaced on their *unwarped* arrival time (22ms apart against a 300ms floor), concurrency declared but never enforced (6 in flight on a 3 field), and — after an incremental fix — 3 on a 2-ship field, because a slow warp makes launch order non-monotonic, so spacing launches is not the same as spacing arrivals. Compute the warped `due` FIRST and treat it as the single source of truth.

**A BUTTON WITH NO LABEL SURVIVES EVERY GATE THERE IS** (2026-08-18). Intercept's results screen shipped a full-width primary button with nothing written on it. It rendered `{t.cont}`, and `cont` existed in no dictionary — not `STR_COMMON`, not the game's own `UI`. React renders `undefined` as empty, so there is no error and no warning: it passed a build, a lint and a nine-gate CI run, and was found only by looking at the screen. `audit:consistency` now carries a **`strings` rule** — every rendered `{t.key}` must resolve. ⚠ Its first two versions were both wrong, and only the planted-bug self-test caught them: collecting keys with `/(\w+)\s*:/` anywhere matches **the middle branch of every ternary** (`x ? a : b` makes `a` look declared) so it passed the real bug and reported the codebase clean, and restricting keys to line-starts then flagged nine healthy games because Raven declares three keys on one line. What works is narrow on both sides — a key counts only after `{`, `,` or a line start; a reference counts only in the JSX form `{t.key}`, which is exactly where an undefined string becomes a blank label.

**`overflow: hidden` ZEROES A FLEX ITEM'S MINIMUM SIZE, and that deletes a section silently** (2026-08-18). The Home model panel gained `max-height` + `overflow-y: auto` so it would stop running off the bottom of the screen. Its three suggestion rows immediately collapsed to **2px** — the gaps, nothing else. A flex item's automatic minimum size is normally `auto`, which stops it shrinking below its content, but `overflow: hidden` changes that to 0; `.np-streams` sets `overflow: hidden` only to clip its own rounded corners. The rows were still in the DOM, still styled, still had text, and measured zero. Neither rule is wrong on its own, and reading either one shows nothing. Fix: `.np-body > * { flex: 0 0 auto; }`. Whenever you add a height cap to a flex column, check what its children measure afterwards — `getComputedStyle` will not tell you, only `getBoundingClientRect` will.

**A GENERATED question bank needs its answers re-derived, not spot-checked** (2026-08-17). Story Time's retrieval half stopped being "rebuild every panel from a tray" (~18 taps of craft work, scored all-or-nothing per panel, so 13 of 15 features remembered read out as 2/5) and became **Kawkab Asks**: the hub-centre mascot asks where the story began, who was in a scene, what came next, which came first, how many scenes had company, and shows one scene that may never have happened. The questions are generated from the beats in `story-grid/data.js`, because 45 stories × 6 questions × 2 languages is not a bank a human keeps correct — and `npm run validate:storyq` re-derives every answer from the beats across many seeds. It caught two generator bugs on its first run: `winning-goal` plays the identical park scene twice, so "what happened next" offered that panel as two separate options, and its four beats are only three distinct panels. Neither is visible from playing a round.

⚠️ **Gates run in plain Node, which cannot parse `.jsx` at all.** Any config a gate must check has to live in a `.js` module. `audit:curves` still reports **4 games whose curve cannot be gated where it sits** — `train-switch`, `story-grid`, `speed-match`, `intercept`. Extracting one is mechanical (pure config out of `index.jsx` into a data `.js`, re-export from `index.jsx`) — `math-gates/mathGatesData.js`, `paired-associates/palData.js` and `task-switch/taskSwitchData.js` were done this way. Watch for orphaned helpers: `mean` moved with the block and broke `index.jsx`.

**A LANGUAGE GAME IS ITS DICTIONARY** (2026-08-15). Word Maze accepting `sart` as a word was never a scoring bug — validation ran against `words_alpha.txt`, an unabridged dump whose 3–4 letter tiers are mostly abbreviations (`aal aam abb abt abv aeq abbr acct acpt`). Short words now validate against `link-words-en-curated.js` (444 three-letter + 1,527 four-letter, authored); **5+ letters keep the permissive corpus**, since nobody traces a five-letter path by accident. ⚠️ The filter runs when the ROUND IS BUILT, not at submit — `gridWords` feeds the pass-target clamp, so a submit-only filter would leave the clamp counting junk and make levels unwinnable. `npm run validate:wordmaze` checks both directions, cross-checks every entry against the corpus, and simulates 180 boards for winnability.

**A gate that checks the SHAPE of a curve can certify a game nobody can play** (2026-08-09). `audit:fq` asserted "targets non-decreasing, time non-increasing" for months. Those two together *force* seconds-per-target to collapse, and it did: Cancellation's hard tier granted 11s for 26 targets that take 44.5s at the game's own documented search model. Medium went impossible from L52, Hard from L33, and Survival — one life — walled every player at round 8. The audit passed the whole time, because it validated the curve's shape and never asked whether a human could finish the board. It now asserts feasibility (time >= the expert model) and that TIME PER TARGET falls, which is what difficulty actually is. Same family as the audit:mot lesson: **assert the outcome, not the parameters**.

**An accessible alternative can be present, correct-looking, and still lock people out** (2026-08-11). Mirror World's no-drag direction pad was routed through the same scoring path as the drag — the right design — but offered the *target* angles (4 on Easy, 90° apart) against rotations of 20–35°, so its best achievable error exceeded the pass threshold: **156 of 300 levels were unpassable through the accessible route**, with buttons rendering, taps registering and reaches scoring the whole time. If a game has more than one way to play it, gate that **every** control can reach the win condition, not just that the control exists.

**Content banks need their own gate, because "no repeats" and "the facts are right" are not human-checkable at scale.** `validate:wheel` caught three ranked puzzles that were duplicates in disguise (two prompts over the same five mountains, the same five heart rates, the same five frequencies) — a prompt-keyed no-repeat draw cannot see those, so it compares ITEM SETS — plus ~20 higher/lower pairs too close to call. `validate:sort` enumerates all ten possible 3-3 splits of six cards for every set, which makes "a player finds a correct grouping the author never listed" impossible by construction rather than by care.

**`npm run audit:mot` checks the RENDER, not just the config, and that distinction is the whole point** (2026-08-08). Target Tracking's tiers were authored independently, so starting Hard was easier than finishing Medium on three of four levers. Worse, `startRound()` rescales the object count to preserve density across devices, and on a wide screen that multiplied it by 3.1× straight into the clamp — so nearly every level rendered an identical swarm and density, the model's primary lever, had stopped grading at all. The first version of this audit **passed while the game was broken**, because it validated the authored numbers. It now simulates the density rescale on four device shapes. If you add a gate to any game, make it assert what reaches the screen.

**`npm run audit:design` is a CI-blocking ratchet** — not a style suggestion. It compares hard-coded colours (and similar drift) against the ceiling in `scripts/design-baseline.json` and fails only when a number goes **up**. When it fails, the fix is either to tokenise the new values or to raise the ceiling deliberately with `npm run audit:design -- --update`, committing the changed baseline so the decision is visible in history. It never rewrites the baseline under `CI`.

**A HALF-MIGRATED TOKEN PAIR is how a whole area ends up looking like a different app** (2026-08-14). Puzzle Studio was reported as "wrong palette, looks so different". The cause was not taste and not one screen: five places where a token was aliased to the warm app palette while **its partner was left as a frozen Cool Silver literal** — `--pz-surface: var(--surface)` next to `--pz-surface-strong: #adb5c4` (every given cell in every puzzle), `--pz-card-soft: #cfd4de`, and two gradients ramping `#d6dae3`/`#f8fafc` → warm. A comment in the same file already claimed the surfaces "come from the app's field tokens now". **When you retarget a token, grep for the ones defined beside it** — a pair that must move together will not announce that it didn't.

The same shape appeared three more times the same day: `body` was pinned to `#e8eef5` (a pale blue-grey from the retired paper-and-sunset era) by a rule *below* the correct `var(--universe-dusk)` one; the Habits screen's dark ground used `--color-training-palette-surface`, the one token `tokens.css` says outright is deliberately never flipped; and Wellbeing's orb contour was described in a detailed comment that the constant underneath it did not implement. **In all four the comment was right and the code was stale** — trust `getComputedStyle` on the live element, never the note.

⚠️ **Chrome that is `max-width: 420px; margin: 0 auto` must not have a background.** `.ct-training-play-header` is phone-width and centred; training games leave it transparent so the play surface runs behind it. Puzzle Studio gave it a fill, which on any viewport wider than 420px rendered as a beige rectangle floating at the top of the screen. It looked fine on a phone, which is why it shipped.

⚠️ **A manual gh-pages deploy skips every one of these gates** *except* the security one (2026-08-15). `.githooks/pre-push` now runs `audit:sec:fast` on every push including a manual one — but it is **inert until `npm run hooks:install` sets `core.hooksPath`**, which git does not do for you on a fresh clone. The gameplay/design gates still live only in the workflow. Code shipped that way reaches users unchecked and the gate fires later, against whoever pushes next — which is exactly what happened after the 2026-08-06 outage deploy: `1105d3a` went live unchecked and its +37 raw colours blocked the following day's push. After any manual deploy, run the gates locally against `main` and fix what they find, rather than leaving it for the next person.

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
- [ ] **Known limitation, accepted for now**: personal reflection/assessment data (habit tracker, personality/relationship quizzes, Ikigai, cognitive assessment scores, **and the personalization model + its 40-entry interaction history**) is stored unencrypted in `localStorage` via `src/lib/storage.js`, with no PIN/app-lock gate. Anyone with device access (or a future XSS) can read it in plaintext. Deliberately not fixing with client-side encryption or an app-lock now — revisit only once Supabase Auth (above) actually changes the trust model; don't build throwaway local crypto in the meantime.
- [ ] Capacitor native: HTTPS-only, no cleartext, separate dev/prod Supabase projects

Priority: Auth + RLS → `.env` secrets → sanitization → audit clean.
