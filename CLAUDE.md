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

**Deploying is automatic (2026-07-16)**: every push to `main` on `origin` (Kawkaba-Cognito) triggers `.github/workflows/deploy.yml`, which installs, runs **`audit:sec` → `validate:wordmaze` → `audit:pacing` → `validate:storyq` → `validate:liars` → `validate:gatekeeper` → `audit:fq` → `validate:rh` → `audit:mot` → `audit:gamekeys` → `audit:coach` → `audit:design`** (all twelve block the deploy), builds, and publishes `dist/` to the `gh-pages` branch — the branch GitHub Pages serves. It can also be run by hand from the repo's Actions tab (workflow_dispatch). The `cognitive` mirror does **not** auto-deploy; push `gh-pages` there manually if the mirror should stay current.

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
- **The `app-styles` runtime cache is NOT redundant with the precached CSS** (2026-08-29). It looks it — `globPatterns` already precaches every `.css` — and deleting it re-creates the bug it was added for. Reported as "I opened the app with no connection and got **only HTML**, then it was normal once the internet came back", which is precisely what it was: the app rendered, completely unstyled.

  The cause is an asymmetry between the two caches. **CSS is the only content-hashed thing in the precache** (16 files; the other 157 entries have stable names), and the precache is version-locked — `cleanupOutdatedCaches: true` deletes the previous build's copy on every SW update. **Scripts are never precached at all** (0 `.js` entries) and live in `app-scripts` at 400 entries ≈ four builds. So a client offline on the *previous* shell — which the `app-shell` NetworkFirst rule will happily serve, that being its entire job — resolved its old entry chunk from cache and its old stylesheet from **nowhere**, because no runtime rule matched a stylesheet: `assets` is `png|jpg|jpeg|webp|ico|svg|glb`. React booted, the app rendered, every rule was missing. It healed on reconnect because the navigation is NetworkFirst, which is why it reads as "worked fine the next day" rather than as a bug.

  Verified without a browser, from the shipped SW plus the server: `index-CnVrewds.css` (previous build) returns 200 on Pages, and appears in **no** precache entry. Precache routes register first, so the current build's CSS still comes from the precache and this rule only catches superseded hashes.

  ⚠️ **It is scoped to same-origin on purpose.** A Google Fonts stylesheet is also `destination: 'style'` and the first matching route wins, so an unscoped rule silently swallows the `google-fonts` rule below it and leaves that one catching nothing but gstatic `.woff2`. ⚠️ And the fix is **not retroactive**: a device is protected only from the deploy *after* the one shipping the rule, since its SW must install the rule before it can cache anything.
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

⚠️ **THERE IS NO EASY/MEDIUM/HARD ANY MORE (2026-08-28).** All 18 live games run **ONE LADDER** in Levels mode — bands of ten levels, each introducing something nameable — and tapping *Level mode* goes straight to the grid. `TrainingDifficultySelect` is no longer rendered by any live game. **4,900 levels became 850.** The model, the per-game band tables and the reasoning live in `LADDER-PLAN.md`; the shared kit is `shared/difficulty.js` (`BAND_SIZE`, `ladderFraction`, `mechanicsAt`, `ladderStage`, `pickWeighted`, `tierMass`).

Tiers still exist in three narrow places, all deliberate: **Survival** ramps through them (`tierStage`, `survivalTier`); the **benched** games still use them; and **Pass n Play** in `cancel-task` / `rush-hour` still shows a 3-way picker, which is a fairness knob for a shared board, not a difficulty gate.

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

  ⚠️ **Adding a game is NINE wiring spots, not one** (was "seven" 2026-08-10; "eight" 2026-08-20 when The Gate needed one the list did not name; **nine 2026-09-03**, when every game gained a live-board coach). Wiring Keep Track and then The Gate touched: `domain.config.js` · `rating.js` (`RATED_GAMES` **and** `ACTIVE_RATED_GAME_KEYS`) · `shared/gameScience.js` · `shared/tutorials/trainingMeta.js` · `shared/GamePlanetTile.jsx` (**two** places: `COVER_KEYS` and `COVER_FILE_OVERRIDES`) · **`personalization/trainingRecommendations.js` (`ACTIVE_GAME_KEYS`)** · **`shared/tutorials/coach/coachRegistry.js` + a `coach/scripts/<key>.js` + mounting the coach in the game** · `package.json` (if it has a content bank needing a `validate:*` gate) · `lazyGames.js` (**only** if the assessment battery runs it).

  The eighth was missed because it post-dates the list: personalization landed 2026-08-14 and quietly added a second registry of live game keys. **When you add a module that keeps its own set of active game keys, add it here in the same commit** — nothing detects a game missing from it, it just never gets recommended.

  ⚠️ **The ninth is the one spot on this list that FAILS THE BUILD rather than failing silently**, and that is deliberate. `audit:coach` requires every live game (a `domain.config.js` sub with both a `gameKey` and a `loader`) to appear in `coachRegistry.js` — in `COACH_IDS` with a shipped lesson, or in `COACH_WAITING` with a dated phase. A new game with neither cannot be deployed. Given that the other eight all fail quietly, the loud one is the feature: see COACH-PLAN.md, and note the gate also checks the coach is actually *rendered*, because it once passed a game whose mount had silently failed to land.

  `lazyGames.js` is the trap. It builds from the registry, so removing a game's sub also removes it from `getLazyGame` — and if the assessment uses that game, its pillar renders **nothing**, with no error. `memo-span` and `nback` both carry explicit fallback registrations there for exactly this reason. Check with `git grep -n "gameKey: '<key>'" -- src/features/training/assessment` before unregistering anything.

  📐 **The full standard lives in the `consistency` skill** (`.claude/skills/consistency/SKILL.md`) — ⚠️ which is **gitignored** (`.gitignore:24`), so it is machine-local and does NOT travel with a clone. Enforced by `npm run audit:consistency`, which does ship. Read it before adding a game or fixing one that "feels like a different app". It carries the ten structural rules, the depth checklist, and **two** reference games: copy **structure** from `keep-track` (22/22), take the bar for what a finished game **contains** from `cancel-task` (8/8 depth — but never copy its 2381-line code).
- **Domains & live games** (per domain.config.js): attention `cancel-task, mot, train-switch` · speed `speed-match, math-gates, intercept` (Intercept is **Rift Defense**, a lane-free TOWER DEFENCE since 2026-08-18: a trail, waves of an army, a gate with 10 HP. It layers **three** measures — reaction time, **response inhibition** via a no-go colour, and prediction via forest canopy over part of the tower reach. See the note below) · memory `story-grid, keep-track, paired-associates` (Story Time's retrieval half is **Kawkab Asks** since 2026-08-17 — see below) · language `wordle, synonyms, trivia` · reasoning `rush-hour, gatekeeper, detective` (**The Gate** replaced Matrix Reasoning on 2026-08-20 — a secret law, a tray of travellers, a budget of probes, Haris stamping each IN or OUT. Wason 2-4-6 / Zendo: it measures how you FIND a rule, where Raven measured whether you spot one already laid out. Detective's holding cell is a **drag**, and on a person question it is the ANSWER BOX — see the note below) · flexibility `mirror-world, task-switch, sort-shift`.

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

`reasoning/games/raven-matrices` was benched 2026-08-20 and replaced by `gatekeeper` (**The Gate**). Not because it was badly built: Raven measures whether you **spot** a rule already fully laid out in front of you, and the domain had no measure of the other half — generating a hypothesis, designing a test for it, and revising. Block Escape is planning and Detective is deduction from statements you are handed; nothing asked the player to go and *find out*. ⚠️ Its `gameScience.js`, `trainingMeta.js` and `trainingTutorialSteps.jsx` entries are deliberately left in place, `rating.js` still maps `raven: { gameKey: 'raven-matrices' }` so **old player records stay readable** (it is out of `ACTIVE_RATED_GAME_KEYS`, so it no longer shapes a domain score), and **The Gate's hub tile still borrows its art** (`COVER_FILE_OVERRIDES.gatekeeper = 'reasoning-matrix-iq-v2.webp'`) — do not delete that `.webp`. The Daily Workout scheduled it by weight in **three** places in `workoutData.js`; all three now name `gatekeeper`. The assessment battery never used it (checked before unregistering). See its BENCHED.md.

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

⚠️ **A STRING CHANGE IS TWO EDITS, AND THE SECOND IS THE ONE THAT GETS MISSED** (2026-08-28). The EN and AR halves of a `UI` dict sit ~40 lines apart, so a find-and-fix on the English line leaves the Arabic one stating the opposite. The ladder migration did exactly that: **Mirror World, Intercept and Block Escape** kept telling Arabic players `'٣ صعوبات · ١٠٠ مستوى لكل'` — three difficulties, a hundred levels each — for a game that had one ladder of fifty, and Cancellation's hub still read "100 levels per tier" in both. Nothing catches this: `audit:consistency`'s `strings` rule only proves a key RESOLVES, not that it is true, and a stale sentence resolves perfectly. **After editing any user-facing string, grep the Arabic-Indic numeral or the AR phrase too**, e.g. `grep -rn "٣ صعوبات\|levels per tier" src/features/training/domains/*/games/*/index.jsx`.

## Tutorials — Dr Kawkab teaches on the LIVE board

**ALL 18 LIVE GAMES HAVE ONE (2026-09-03).** `COACH-PLAN.md` is the plan and the
reasoning; `shared/tutorials/coach/` is the kit — `DomCoach.jsx` (the whole coach
for a DOM board: twelve games use it unchanged), `CoachLayer.jsx` (hand, Kawkab,
bubble placement, ARIA, Escape), `anchors.js` (`useDomAnchor` / `useCanvasAnchor`
/ `useAwaitAdvance`), `useCoachRun.js` (arm / open / persist), `coachRegistry.js`
(the ledger), and `scripts/<game>.js` (the step data, EN and AR on the SAME step
so a mismatch is inexpressible). `npm run audit:coach` blocks the deploy.

**THE DEPTH PASS (2026-09-03): 65 STEPS → 144, ON ONE SPINE.** Asked for by the
owner ("longer, more instruction … well structured and strong"). The old lessons
were not wrong, they were **compressed**: the construct — the counter-intuitive
thing worth knowing — kept arriving as the third clause of a five-sentence
paragraph, beside the controls and the sign-off. Every lesson is now eight steps
carrying **one idea each**: orient · the goal · the object/control · *do it now* ·
the construct · the named error · what it costs · how it grows. COACH-PLAN.md §0
has the table and the reasoning.

⚠️ **STEPS 7 AND 8 WERE MISSING FROM ALMOST EVERY GAME.** Nearly none said what a
wrong answer costs, and nearly none said what changes as you climb — both left to
trial and error, in an app whose posture is that reaching your limit is the
*point*. Trivia now says outright that the run is meant to end where you cannot
reach; mot says it keeps going until it finds where you start dropping them.

⚠️ **GUIDED PRACTICE IS CAPPED BY `satisfiedFor`, NOT BY THE SCRIPT.** Only 6 of 18
games pass that predicate to `DomCoach`, so only they (plus cancellation) can have
a "do it now" step. The other eleven deliberately have none — an await step whose
condition cannot fire strands the player with only Skip and Escape. Wiring those
eleven is the obvious next increment.

⚠️ **THE HAND'S SIZE COMES FROM ITS TARGET, AND A SCREEN BREAKPOINT CANNOT
SUBSTITUTE.** `TutorialHand` was a flat 54px (44px under 420px) — measured once
against a cancellation tile, then worn by all eighteen games. Measured across the
platform, the hand/target width ratio ran **0.08 → 4.91**: story-grid's `nav` is
an **11×11px** chevron under a 54px pointer, cancellation's tile is 57px (ratio
0.95, with the hand's 87px body covering the tile *below*), mot's `board` is
698×449. None of that is about the viewport — story-grid's chevron and
cancellation's tile were on the *same* 1366px desktop. The anchor now carries
`tw`/`th` and the hand takes `0.62 ×` the target, clamped 30–52px.

⚠️ **A HAND ON A WHOLE-CONTAINER ANCHOR IS NOT POINTING AT ANYTHING.** `math-gates`
aimed all three of its steps at `[data-coach="board"]`, so the hand never moved
for the entire lesson. Steps about pace, cost or progression now use
`point: null`, which parks the hand honestly instead of pretending.

⚠️ **EVERY TRANSFORM PIVOTS ON THE FINGERTIP** (`transform-origin: 40.8% 1.2%`, the
measured TIP_X/TIP_Y). The float was `translateY(-5px) rotate(-2deg)` about the
image centre, walking the tip ~6px — a tenth of a cancellation tile, half of
story-grid's chevron. Rotation about the tip contributes zero drift, so the float
and tap became rotational rather than translational.

⚠️ **THE BUBBLE MUST CLEAR THE HAND IN THE HAND'S OWN PIXELS.** It used
`anchor.y + 14%`; 14% of mot's 449px board is 63px against a hand hanging 87px
below its fingertip, and the bubble was measured sitting *on* the hand in mot and
speed-match. A percentage of a container cannot clear a fixed-size sprite.

⚠️ **KAWKAB DODGES, AND THE TEST IS LOGICAL, NOT PHYSICAL.** He was pinned to the
inline-end corner on the reasoning that the hand favours the board's left/top —
true of where scanning *starts*, false of where the hand *ends up*. He now flips
corners when the action is on his side. The check is on the inline-end fraction
mirrored under RTL: written in physical `x` it would send him **toward** the hand
in one of the two languages. And it must consider the **bubble**, not just the
hand — the first version tested the hand's `y`, measured clean, and collided with
the bubble immediately, because a high anchor puts the bubble on the *below-hand*
branch.

⚠️ **`useDomAnchor` SEARCHES INSIDE THE BOX IT MEASURES AGAINST.** A step pointing
at chrome resolved to null — no hand, no error, no warning. Pass
`scope: 'document'` to search the page while still measuring against the
container. Opt-in rather than a fallback: this app keeps every tab mounted under
`display: none`, so a silently widening selector finds another screen's copy.

⚠️ **AND ONE INSTRUCTION WAS SIMPLY WRONG ON DESKTOP.** Cancellation opened with
"the shape you are hunting is **up in the bar**" and pointed at nothing. On a
phone the HUD is a top bar; on a 1366px desktop it is a **left rail**. `PlayHud`
now tags the goal chip `data-coach="goal"` and the copy no longer claims to know
where it is. Same family as the string trap above: *the layout has two halves and
the copy only checked one.*

⚠️ **THE `@coachN` SUFFIX IS THE WHOLE DEFENCE.** `shouldRunOnboarding` keys off
the id in `mm_tutorial_prefs_v2`, and the retired rules carousel already wrote a
flag under every game's PLAIN id. Register a coach as `'keep-track'` and it never
auto-runs for anyone who has opened that game — fresh installs only, silently.
The gate enforces it.

⚠️ **COACH COPY IS PRODUCT COPY, AND THE REVIEW BOARD READS IT.** The scripts sit outside the board's DATA_PATHS, so SCI-01 (unsupported cognitive-benefit claims) greps them — verified by planting an FTC-style outcome claim in a script and watching the standard flip. One real line needed scoping: task-switch's "it gets shorter" now reads "with practice at this task", because unscoped it promises transfer to life rather than practice on the task. Keep the scripts out of any data path.

⚠️ **A REGISTERED COACH MUST ALSO BE RENDERED**, and the gate learned that the
hard way: every other check passed for `mot` while its `<DomCoach>` mount had
silently failed to land. Script perfect, id versioned, ledger agreed, lesson
unreachable. Rule 4 of `audit:coach` now catches it.

⚠️ **AND RULE 4 STILL CANNOT SEE REACHABILITY — THREE GAMES SHIPPED WITH NO
TUTORIAL WHILE THE GATE SAID 18/18** (2026-09-04). It greps the game's source for
a `<DomCoach>` mount and finds one; it cannot tell whether that mount is ever
reached. **Word Maze** mounted the coach inside `round.mode === 'level'` while the
effect that opens it requires `'free'` — mutually exclusive. **Spaceship**'s
`TrainSwitchEngine` is referenced nowhere at all (eslint says unused) while
ModeShell renders `CarPark3DProto`, whose call site listed props explicitly and
dropped `p.coach`. **Math Gates**' `MathGatesEngine` is imported only by the
Group War party game; the hub renders `MathGatesBoard2D`, which *received*
`coach` via `{...p}` and never read it. All three fixed and verified live.

No static detector was added, deliberately: "is the function referenced?" passes
Math Gates, and "same component?" passes Word Maze. The honest check is to open
the game and look for `.ct-coach-bubble` — do that by hand after touching any
coach wiring. **Both dead engines are marked with a header rather than deleted**,
because each still contains a correct-looking coach mount, which is precisely
what misled the gate.

⚠️ **NEVER MOUNT A COACH IN `canvasChildren`.** `.c3d-canvas` is
`aria-hidden="true"`, and aria-hidden cannot be undone by a descendant. The
bubble carries the WHOLE lesson (`role="dialog"` + `aria-live`; the hand and
Kawkab are deliberately decorative), so mounting there gives a screen-reader user
total silence for every step. Use `coachSlot` + `rootRef` — they render last
inside `.c3d-root`, the same `inset: 0` rectangle, outside the hidden subtree.
`paired-associates` is the reference.

⚠️ **SIZE THE HAND FROM THE TARGET'S SMALLER DIMENSION**, not its width. The drawn
hand is 1.6× as tall as it is wide, so width alone over-sizes it on anything wide
and short — Spaceship's junction button is a stretched `1fr` grid cell (430×44
with one junction), which put a 52px hand standing 84px over a 44px control.

⚠️ **ModeShell hides "How to play" when a game has no lesson.** It used to pass
`onReplayTutorial` unconditionally — always a truthy `useCallback` — while
`TutorialCarousel` returned null on zero steps, so six live games shipped a
button that took the tap and did nothing.

Cancellation is the reference (`CancelTaskCoach.jsx`). The lesson runs INSIDE a
real Survival round: Dr Kawkab stands in a corner, his pointing hand sits on a
real tile, and the player clears it themselves. The round clock is held while the
coach is open, so reading costs no time.

Both figures are 2D images, deliberately: **`KawkabSprite`** (86 KB) and
**`TutorialHand`** (`Assets/characters/kawkab/kawkab-hand.webp`, 30 KB). They
replaced `AssessmentMascot3D` (3.4 MB GLB) and `TutorialHand3D` (1.36 MB GLB), so
opening a tutorial cost ~5 MB and TWO WebGL contexts. ⚠️ `AssessmentMascot3D` is
STILL used by trivia, rush-hour and Kawnera — the same swap is available there.

Keying new character art: `py scripts/key-kawkab-planet.py <src.png> --out <path>
--width N`. It alpha-solves the edge and flood-fills from the border, so white
star points INSIDE the body survive instead of punching pinholes through it.

⚠️ **A TUTORIAL MUST TEACH THE CONSTRUCT, NOT THE CONTROLS.** The old lesson
taught "find the shape, tap it, clear them all" — none of which is what this game
measures. Cancellation is a test of SELECTIVE attention, so the lesson now points
at a DECOY and says leave it.

⚠️ **AND THE LESSON MUST NOT BE LOSABLE.** Guarding only the wrong-tap TIME
penalty left the error tally and the round-error cap live; Survival has one life
and a 3-target board caps at 2 errors, so the coach's own crossed-out hand
invited error 1 of 2 — and any round end fires `endCoach` →
`markOnboardingSkipped`, marking the lesson permanently done having never shown
its last two steps. Clearing the remaining targets did the same via the auto-win.
Guard **every** consequence with `coachOpenRef`, not one. Tutorial taps are also
kept out of `trialLog`: a guided tap with unlimited reading time is not a
measurement.

⚠️ **VERSION THE ONBOARDING FLAG WHEN A LESSON CHANGES.** `shouldRunOnboarding`
keys off the game id in `mm_tutorial_prefs_v2`, so a rewritten tutorial that
reuses the old id never runs for anyone who already played — it reaches fresh
installs only, silently. Cancellation now uses `'cancel-task@coach1'`; bump the
suffix next time.

## Persistence

Everything is localStorage, keys prefixed `mm_*` and versioned (`mm_wordle_profile_v1`, `mm_trials_<game>_v1`, `mm_assess_sessions_v1`, …). Go through `src/lib/storage.js` (`createProfileStore(key, defaults)` for per-game profiles; `loadJson`/`saveJson` elsewhere) — it owns the try/catch and quota handling.

⚠️ **`mm_*` is not the only namespace, and that matters for anything that iterates keys** (2026-08-21). Wellbeing writes `rx_*` — `rx_habits_v2`, `rx_personality_v1`, `rx_relationship_v1`, `rx_ikigai_v1`, `rx_favorites`, `rx_order`, … — and Void Runner writes `vrName`/`vrScores`/`vrBest`. **The four most sensitive stores in the app are all `rx_*`**: the personality quiz, the relationship quiz, Ikigai reflections and habit history. Settings already ships stubbed **Export My Data** and **Delete Account** buttons; written against the documented `mm_*` prefix alone, "erase everything" would leave every one of those on the device and tell the user it worked. Same shape as the eight-wiring-spots trap — a documented list and a real list that disagree. trialLog caps its own storage (sessions + bytes) so history can't blow the ~5 MB quota. There is no sync/backup — clearing browser data wipes the user (Supabase below will fix this).

## Sound — synthesized, and there is no music (2026-09-02)

**There is no background soundtrack.** A CC0 loop (`heavenly-loop.ogg`, 1.2 MB) used to start on the first pointer gesture and run all session, with a Music row in Settings. Both are gone, by product decision: this is a training and wellbeing app, and a bed of music under a timed attention task is a competing stimulus. `mazeman_music_enabled` is left unread rather than migrated. ⚠️ Void Runner still has its OWN synthesized score, governed solely by its in-game MUSIC button — its app-level gate is now a constant.

**Every UI cue is synthesized in `src/lib/sfx.js`.** No audio files, no download, no cache entry, no licence. `CUES` is a table of oscillator voices; `playSfx(name)` in AppContext is a thin wrapper.

⚠️ **TWO ATTEMPTS AT THIS WERE REJECTED AS SHRILL, FOR THE SAME REASON — PITCH AND HARMONICS.** The original cues ran at 600–1200 Hz on **square and sawtooth**; those waveforms are all steep harmonics, so a 600 Hz square puts real energy at 1.8k/3k/5k, straight through the ear's most sensitive band. Replacing them with Kenney's CC0 *Interface Sounds* samples swapped one bright source for another — it is a GAME UI pack, voiced glassy on purpose to cut through music and effects this app does not have. What works: fundamentals **165–525 Hz**, `sine`/`triangle` only, a **low-pass on every voice** (the biggest lever on harsh-vs-warm), a **4–6 ms attack ramp** (starting a gain at full value puts an audible edge on the first sample — much of what "clicky" means), exponential decay, and low gain (`click` fires from 183 call sites). Failure is a gentle falling fourth, not a buzz — a punishing error tone is off-brand for a wellbeing app.

⚠️ **Synthesis is also the only honestly VERIFIABLE option here**, because there is no audio playback in the authoring environment: a sample can only be chosen blind, by filename, and frequency/brightness/decay — the exact things complained about — are what a synthesized cue states in numbers and a `.ogg` hides. The tuning guide sits next to `CUES`.

⚠️ **Every name `playSfx` is called with must exist in `CUES`.** `wrong` and `correct` were missing from the old chain of `if`s while Word Maze called both: they matched no branch, made no sound, and produced no error — the same silent-failure shape as the results button that rendered `{t.cont}` with `cont` declared nowhere. `CUES` is a lookup rather than a chain precisely so this is one place to check.

`rain.mp3` (Sleep Sounds) is the only audio FILE left. ⚠️ Its provenance is unverified — see `CREDITS.md`.

## Licensing — `CREDITS.md` (2026-09-02)

The repo is **public** and ships to Play, so anything in `public/` is downloadable by anyone. `LICENSE` reserves all rights in *this project's* work; `CREDITS.md` records the third-party material that arrives under its own terms, and must be updated **in the same commit** as any asset it covers. "Free to use" is not one thing: CC0 permits redistributing the file itself, while several common free-stock licences permit use *inside* a product but prohibit shipping the asset as a standalone downloadable file — which is exactly what a public repo does.

## Comics / episodes (the original product)

- `public/episode-1-problem-solving.html` — a complete standalone Canvas game (3-floor Monument-Valley-style book layout, gate guardians, mini-games). It bypasses React and the build entirely — it is served as-is and has its own inline JS/CSS conventions. (The old React episode player, `VideoPlayer.jsx`/`VideosScreen`, has been deleted.)
- Audio app-wide is synthesized via Web Audio API — there are no audio files (see the Sound section above).

## Validation scripts

`npm run validate:personalization` (the neural personalization engine — network maths, cold start, persistence, learning gates) · `npm run validate:puzzles` · `npm run validate:rh` (rush-hour reference solutions; `--full` for the hard ref puzzle) · `npm run audit:fq` (cancellation level curriculum **and** a zero-ink guard on every `SH` silhouette) · `npm run audit:mot` (Target Tracking difficulty curve) · `npm run validate:wheel` (The Wheel's three content banks) · `npm run validate:sort` (Sort It Another Way's card sets) · `npm run validate:keeptrack` (Keep Track's category bank — cross-category exclusivity in EN **and** AR) · `npm run validate:intercept` (Intercept — rewritten 2026-08-18 for the tower-defence build. Asserts what a PLAYER meets, on built waves: one-thumb feasibility as a scheduling proof, with a planted unclearable wave it must reject on every run · a marcher strikeable long enough to see and hit · visible-before-canopy, so a hidden strike is a prediction and not a guess · the 15–35% Go/No-Go share band · a wave never opening on a no-go marcher · barrels inside the tower reach · per-tier mechanic variety · and all three measures reaching the results) · `npm run validate:mirror` (Mirror World schedules — asserts every run ENDS with a washout block, because one missing plays fine and silently never shows the aftereffect, **plus control parity: every input method must be able to pass every level**) · `npm run validate:liars` (Detective's GENERATED cases — re-solves every one with an independent enumerator: no case without a consistent world, no question whose answer differs between worlds, no "how many are lying" under a rule that already states the count, no "tap the innocent" where nobody or everybody can be cleared. Also asserts the QUESTION MIX stays varied, which is the anti-boredom check and the one that caught the real bug) · `npm run validate:gatekeeper` (The Gate's GENERATED gates — re-derives every one with an independent enumerator and asserts each is DECIDABLE within the probes it grants. A tray that never separates the trio turns the final choice into a 1-in-3 guess wearing a puzzle's clothes, and the player who cannot work it out simply assumes they reasoned badly. Also asserts no half-tier is inert) · `npm run validate:storyq` (Story Time's GENERATED questions — every answer re-derived from the story's beats, on all 45 stories across many seeds: exactly one option correct, no duplicate options, the prompt naming the scene the answer belongs to, the "did you see this scene?" lure flagged real/fake correctly, and the count question never degenerate. Also asserts the curve, the pass rule, and that a wrong answer index still fails) · `npm run audit:curves` (**THE LADDER'S GATE** — levers monotonic across the whole climb, the mechanic set never shrinks, and **no band is inert**: a band must introduce a mechanic or move a `structural` lever, because "the same game slightly faster" is exactly what a 100-level tier was. Weighted-pool games are gated on `tierMass`, since `poolSize` alone passes a band that got wider but no harder. `cancel-task` and `rush-hour` are **path ladders** — they walk their authored curriculum rather than replacing it, so their bands are checked start-to-end and every rung must play a distinct authored level. **Nothing is ungated any more**: the "cannot be gated where it sits" list is empty) · `npm run audit:pacing` (the ms-per-stimulus FLOOR a human actually meets, at every level of every tier and across survival, **plus** that each game still grows harder through load — see the note above) · `npm run validate:wordmaze` (Word Maze's curated short-word dictionary: junk rejected, real words accepted, every entry cross-checked against the corpus, seeded board words playable, and 180 boards simulated for winnability) · `npm run audit:consistency` (every game against the platform standard on **three** axes — structure /22, **look /6** (ground from a play-surface token · every rendered font is one `index.html` loads · shadows from `--fx-*` not hand-mixed · audio through `playSfx` · the back/pause glyph is the shared icon · **every rendered `{t.key}` resolves**), and depth /8 reported-only; each look rule self-tests against a known-bad fixture on every run, so a detector that stops firing fails the gate instead of silently passing everything. See the `consistency` skill) · `npm run audit:coach` (every live game has a live-board coach: the ledger covers each game exactly once, every coach id is `@coachN`-versioned so an existing player's stored flag cannot silently suppress a new lesson, every step carries EN and AR, no lesson ENDS on an await step it renders no Next button for, and a registered coach is actually RENDERED — the rule added after the gate passed a coach whose mount had silently failed to land) · `npm run lint`. Run the relevant one after touching generators, level data or content banks.

**THE ASSESSMENT IS PARKED BEHIND "COMING SOON" (2026-08-18), and that is deliberate.** The battery and its content are both a DEMO — told directly by the project owner. The danger was that it did not *look* like one: it rendered percentiles, standard scores, a "Cognitive Index" and academic citations, with nothing on screen marking any of it provisional. Handing a real person a cognitive percentile from an unfinished instrument is a scientific-claims problem, not a polish one. `ComicsScreen.jsx` now renders `AssessmentComingSoon.jsx`. ⚠ **Nothing was deleted and no saved data was cleared** — `AssessmentFlow.jsx` and every data file beside it are untouched, so restoring the real battery is ONE import swap. Do that only once the content is finished and the scoring has been checked against the norms it claims.

⚠ **Parking it did NOT free up `nback` or `spatial-stroop`.** The Daily Workout still schedules `spatial-stroop` and `memo-span` by weight in `workoutData.js`, and the Assessment will want its paradigms back. See the gate below.

**`npm run audit:gamekeys` — a silent failure turned into a build failure** (2026-08-18). Features ask for games by STRING KEY through `getLazyGame(key)`, which returns `null` for anything unregistered — and every caller then does `if (!X) { …; return null; }`, so the block **renders nothing: no throw, no console warning, no error boundary.** Nobody finds out until a user reaches that screen.

That matters because three load-bearing games have **no training-hub slot**, so they read as dead code to anyone tidying up: `spatial-stroop` and `memo-span` (both scheduled by the Daily Workout) and `nback` (the Assessment's memory paradigm). Until now they survived only because `lazyGames.js` carries three hand-written `if (!cache[x])` blocks with comments explaining why — **a defence made of comments, which works exactly as long as the next person reads them.**

The gate parses source TEXT rather than importing, deliberately: `workoutData.js` imports `../training/registry` extensionlessly and `lazyGames.js` pulls in a chain of `.jsx`, so plain Node can load neither — and a module that fails to load cannot accidentally report success. It carries a planted-key self-test, and names the three hub-invisible games explicitly.

⚠ **Its first plant test was broken and produced a false PASS.** The test removed the `spatial-stroop` fallback with a regex ending `\n}\n`, but this working tree is **CRLF** — so the deletion silently never happened, the gate was run against an intact file, and its "OK" was mistaken for proof that it detects nothing. Re-planted correctly it fires on both callers, naming each and the fix. **When a plant test passes, verify the plant actually landed before trusting the detector.** Same family as the `audit:consistency` string rule, whose first two versions also passed a bug they were written to catch.

## Party games — a mechanical expansion is only as good as its worst combination

The seven Group Challenge games (`features/puzzles/games/`: imposter, charades, describeit, wavelength, gettoknow, groupwar, thewheel) generate content by crossing a small authored list with a set of modifiers. **Nobody ever reads all N combinations, so the bad ones ship** — this cost three separate fixes on 2026-08-29:

- `_shared/groupPacks.js` crossed every term with `Tiny/Giant/Broken`, so **Imposter's secret word could be "Broken Lion"**. Packs now expose **`base`** (clean term) and **`words`** (with variants). ⚠️ **Imposter MUST use `base`** — a modifier is not a thing you can give a one-word clue about, and it *leaks*, because the table starts describing the modifier. Charades/Describe It genuinely want `words`.
- The same file applied one `abstract` mode to three different parts of speech: **"Sudden Happy"**, **"Sudden The mentor"**, **"Quiet Entropy"**. A mode now states what KIND of term a pack holds (`thing`/`action`/`adjective`/`none`). ⚠️ `culture` is `none` deliberately — "Giant Ramadan" is not funny.
- `wavelength/spectra.js` crossed five contexts onto every pair unconditionally: **"Villain as a gift ↔ Hero as a gift"**. A context only applies where the pair judges a THING. 200 → 156 spectra, nonsense 44 → 0.

⚠️ **`Random` must never draw the Hard pack.** Entropy / Cognitive bias / Opportunity cost are fine for a table that *chose* them and the fastest way to kill a round for one that asked for random. `CASUAL_PACKS` excludes it; the chip still offers it.

⚠️ **THE WHEEL SCORES 0–5 PER ROUND, AND NOTHING MAY PAY MORE.** It used to pay in the hundreds on three scales that disagreed (a Game 1 round could return ~270). Each formula was defensible alone and the whole was unreadable — nobody at a table can tell whether 247 was good. Anchoring is a **penalty**, never a bonus, because a bonus would breach the cap that is the point.

⚠️ **A ranking/higher-lower set must be answerable by a normal person.** Ten sets were replaced for failing this (atomic numbers, melting/boiling points, pitch in Hz, planet day lengths, elite race times in decimal minutes, programming languages by release year). In higher/lower it is worse than boring — a blind call loses the whole run, so it punishes the table for content they could not have known. **Replace, never delete**: `sets.js` splits 48 streak and 64 ranked exactly four ways and `validate:wheel` asserts it.

⚠️ **A push-your-luck round must show BOTH things being compared.** The higher/lower round rendered only the current card while `call()` compared against `items[at+1]` — an item whose name was never on screen. It was a coin flip wearing a quiz's clothes, and it was reported simply as "confusing".

⚠️ **"Random" is not the same as uniform.** Imposter re-sampled every round: measured over 12 rounds with 5 players that gave counts `[2,0,6,4,0]` — one player six times, two never — and could repeat back-to-back. It now draws without replacement, least-recent first, excluding last round's imposters: `[2,2,3,2,3]`.

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

**A GAME CAN BE MADE MORE FUN AND MORE VALID AT THE SAME TIME — THE USER FOUND THE MOVE** (2026-08-18). Intercept was rebuilt again, this time as a real tower defence: a trail, waves of an army, a gate with 10 HP. Five playable prototypes went into an artifact and the pick was **Volley** — tap the marchers as they cross the tower's reach — which on its own is *simple reaction time*, the third such task in a domain that benched Trail Making for exactly that. The fix was not to argue but to take the user's own scaling ideas seriously: "now it is hidden, now don't press this colour". Those are two different constructs, and together they make the game measure things the domain lacks:

| Layer | The act | Construct |
|---|---|---|
| Tap them inside the tower's reach | the core loop | reaction time |
| Some marchers are the wrong colour — leave them | withholding | **response inhibition** (Go/No-Go commission errors) |
| Forest canopy hides part of the reach | strike where you believe they are | prediction (signed ms error) |

`summarise()` keeps the three **separate** and the results screen shows each only when the level contained it, so a level with no no-go marchers never reads as perfect inhibition. ⚠ Do not merge them into one score — that would hide which of the three the player is actually good at, and it is the only thing stopping this being a fourth reaction test.

⚠ **The no-go share is gated to 15–35%, and that band is load-bearing.** Go/No-Go measures inhibition only while the go response is *prepotent*. Too many forbidden marchers and the player is sorting rather than withholding; too few and commission errors are too rare to score. `validate:intercept` also asserts a wave **never opens on a no-go** — striking has to have become automatic before not-striking means anything.

**FOUR MODEL BUGS DIED BEFORE A PIXEL WAS DRAWN, because the gate was written first** (2026-08-18). `validate:intercept` was rewritten before the UI and caught, in order: the no-go share rounding **below** its own band on small waves (1-in-7 = 14%); hard L64 leaving **334 ms** of visibility against a 340 ms floor; the hard tier having **one mechanic set across all 100 levels** — the identical failure the old easy tier shipped, just with bigger numbers; and, most instructive, **a floor honoured by the config and broken by the built wave**. Each marcher walks at ±6% of the wave's pace, so a marcher on the fast end reached the canopy sooner and lost 3–20 ms of run-up at 21 levels of the hard tier. **A GUARANTEE MADE ON THE AVERAGE IS NOT A GUARANTEE** — re-apply perceptual floors per unit, at build time, not per level. (The previous rebuild died the same way, spacing ships on their *unwarped* arrival times.)

The feasibility check is a scheduling proof rather than a heuristic: every go/armour marcher needs its taps inside its own window, no two closer than `MIN_TAP_GAP_MS`, and greedy earliest-deadline scheduling is optimal for unit jobs with release times and deadlines — so if the greedy pass fits, a perfect player can clear the wave, and if it does not, nobody can. It carries a **planted unclearable wave** it must reject on every run.

⚠ **`audit:curves` deliberately does NOT gate two of Intercept's levers, and both were measured before being left out.** `hiddenShare` is **non-monotonic on hard** because the visibility floor clamps it unevenly — the lever is real, the clamp is correct, and gating it would fail working code. `barrels` rises with level but a barrel *helps* the player, so registering it 'up' would assert the wrong direction of difficulty and force the curve to remove help to stay green. **Measure a lever's monotonicity before registering it; do not assume it from the authored numbers.**

**THREE UI BUGS ONLY THE SCREEN COULD SHOW** (2026-08-18), all in the new Intercept and none reachable by any gate: the status swatch showed the **go** colour under the label "safe colour" — precisely inverted, telling the player the thing to strike was the thing to leave alone; barrels were `--game-bad` discs while the rust marcher colour is *also* `--game-bad`, so on any rust wave the thing you must tap and the thing you must not were identical (shape carries it now, which also survives colour-blindness); and the between-wave panel said "Wave held" over a wave where six marchers walked through. Look at the thing.

**A GAME THAT SELLS DIFFICULTY CANNOT ALSO MEASURE IT** (2026-08-18). Intercept was reported as boring, not obviously scaling, and carrying a between-sector **upgrade shop** that "doesn't feel like it belongs". All three were true and all three were measurable. The shop sold `scan` (+80ms of visibility) and `pulse` (+12ms of hit window) while the stage reached fed `awardFreeRun('intercept', …)` → the speed domain rating, so two players with identical timing got different ratings depending on what they bought. Counting NAMEABLE mechanics rather than continuous knobs, the **easy tier had exactly ONE across all 100 levels** — every genuinely new lever lived in med/hard, which is where new players are not. And the boredom was structural rather than tuning: one countdown, one mover, ONE TAP, then dead air. It is now a lane wave game in all three modes — several ships in flight at once, hearts, no shop — which is the same construct under load rather than a different construct. `validate:intercept` gates what a wave asks of a player: one-thumb spacing (`MIN_ARRIVAL_GAP_MS`), concurrency actually honoured, visibility, hiddenness, and per-tier variety. Its curve now lives in `data.js` and is registered in `audit:curves` (ungated games: 3 → 2).

⚠ **Three wave-builder bugs were caught by that gate before any of it reached a screen**, and every one of them would have played fine: ships spaced on their *unwarped* arrival time (22ms apart against a 300ms floor), concurrency declared but never enforced (6 in flight on a 3 field), and — after an incremental fix — 3 on a 2-ship field, because a slow warp makes launch order non-monotonic, so spacing launches is not the same as spacing arrivals. Compute the warped `due` FIRST and treat it as the single source of truth.

**A POINTER-EVENTS ALLOWLIST KEYED BY CLASS BREAKS EVERY TIME THE CHROME MOVES — THIS WAS THE THIRD TIME** (2026-08-21). Reported as "the screen freezes and back doesn't work". It was neither a freeze nor the back button: in all seven 3D proto games (`paired-associates`, `math-gates`, `train-switch`, `nback`, `raven-matrices`, `wisconsin`, `brixton`) **back and pause could not be tapped at all**.

`c3dProto.css` makes `.c3d-ui--overlay` `pointer-events: none` so taps reach the canvas, then hands input back to a hand-written list of CLASSES. `PlayHud` now renders its stats *inside* `TrainingPlayHeader`, so the buttons became `.ct-training-chrome-btn` — not on the list — while `.ct-fq-bar`, still listed, had been demoted to a stats block containing no buttons. The buttons rendered, had handlers, and could never be hit. The file's own comment already recorded the same failure from 2026-08-01 and warned it would recur; it recurred.

⚠ **Only real hit-testing can catch this.** Synthetic `dispatchEvent()` calls the handler directly and bypasses hit-testing, so tests and any automation that dispatches events pass while a human cannot press the button. Diagnosed by instrumenting `pointerdown` in the capture phase and logging `document.elementFromPoint()`: every tap reported `topmost=canvas`. **List the BUTTONS, never a chrome ROOT** — `.ct-training-play-header` spans the top strip and would eat canvas taps across that band.

⚠ **A "freeze" report is usually not a frozen thread.** Three wrong theories died here first — compositor stall, WebGL context exhaustion, an unbounded loop — because an app with no reachable controls is indistinguishable from a hung one when you are the person pressing the buttons. Before theorising: `document.hidden` (a background tab throttles rAF to nothing and looks identical), then whether taps are logging at all, then whether they land on the button.

**A HEIGHT BREAKPOINT MEASURED AGAINST THE SCREEN LOCKS THE DESKTOP LAYOUT OUT OF THE DESKTOP** (2026-08-21). The desktop layouts for Pair Match and Target Tracking were gated `@media (min-width: 900px) and (min-height: 600px)`. A 1366×768 laptop — the commonest desktop screen there is — has a **~577px viewport** once browser chrome is removed, so the block never matched and both games rendered their phone layout stretched across a wide window. That is what "the games are not aligned well for desktop" was. Gates are now `560px`. **Measure `innerHeight`, not the screen.**

⚠ And check the compact block's condition at the same time: Pair Match's read `@media (max-width: 480px), (max-height: 720px)` — the comma is **OR**, so every laptop matched it too. Sitting after the desktop block, it won on `width`, giving the question pill `position`/`right` from the desktop rail and `width: 520px` from the phone rule — a 520px pill pinned to a 210px rail, on top of the card grid. The two blocks must be **mutually exclusive**: compact stops at 559px, desktop starts at 560px. A short viewport is not the same thing as a phone.

**A `max-width` INSIDE A GRID TRACK GOES RAGGED, AND IT READS AS "THE BUTTONS ARE MISALIGNED"** (2026-09-03). Reported as desktop alignment problems when a game ends. `.ct-play-results-actions` is a **23rem (368px)** grid column, and the two buttons it stacks cap themselves: `.ct-fq-btn` at **340px**, `.ct-fq-btn-ghost` at **200px**. A block box with a `max-width` does **not** centre itself in a stretched grid item — it goes flush to the inline start. So a results screen with two actions rendered a 340px button above a 200px one, both hard left in a 368px track. Fixed by `max-width: none` for buttons in that stack. ⚠️ It looked intermittent because only results screens with TWO actions show it, and worst on desktop where the column reaches full width. ⚠️ Cancellation stacks the identical two variants in six places and is FINE — those are children of `.ct-fq-screen`, a flex column with `align-items: center`. **Grid `stretch` + a child `max-width` is the bug; flex `center` is not.**

**PREMIUM IS ELEVATION AND RESTRAINT, NOT MORE ART** (2026-09-02). The shared training button was drawn as a STICKER — `border: 2px solid` ink, `font-weight: 900`, and a hard unblurred offset shadow (`box-shadow: 4px 5px 0`) that slid the whole button diagonally on hover. One rule in `training.css`, worn by all eighteen games, and the single loudest reason the platform read as a children's toy. Now: hairline edge, weight 750, and depth from `--elev-rest` / `--elev-raise` / `--elev-press` in `tokens.css`. ⚠️ **Press SINKS (inset), it does not slide** — `translate(2px, 2px)` moved the label diagonally out from under the finger already on it. ⚠️ The `--elev-*` tokens are composed **only** from existing `--fx-*` tokens so `audit:design`'s ratchet cannot rise from them; `--fx-`-prefixed definitions are exempt from the raw-colour rule, which is what makes shared scrims (`--fx-training-scrim`) tunable in one place. ⚠️ Move a token's PARTNER with it: `.ct-fq-attn-mode` shares the mode screen with `.ct-fq-btn`, and leaving one on a hard ink shadow is how an area ends up looking like two apps.

**A BUTTON WITH NO LABEL SURVIVES EVERY GATE THERE IS** (2026-08-18). Intercept's results screen shipped a full-width primary button with nothing written on it. It rendered `{t.cont}`, and `cont` existed in no dictionary — not `STR_COMMON`, not the game's own `UI`. React renders `undefined` as empty, so there is no error and no warning: it passed a build, a lint and a nine-gate CI run, and was found only by looking at the screen. `audit:consistency` now carries a **`strings` rule** — every rendered `{t.key}` must resolve. ⚠ Its first two versions were both wrong, and only the planted-bug self-test caught them: collecting keys with `/(\w+)\s*:/` anywhere matches **the middle branch of every ternary** (`x ? a : b` makes `a` look declared) so it passed the real bug and reported the codebase clean, and restricting keys to line-starts then flagged nine healthy games because Raven declares three keys on one line. What works is narrow on both sides — a key counts only after `{`, `,` or a line start; a reference counts only in the JSX form `{t.key}`, which is exactly where an undefined string becomes a blank label.

**ONE NAME, ONE PLACE — A SECOND LIST OF THE SAME PEOPLE READS AS A SECOND QUESTION** (2026-08-20). Detective showed the suspects in the line-up and then again, directly below, as answer buttons. Three faces, twice, for one question. It is now modelled on **Hotel Oddity** in the user's `Grand Parlor` prototype (`Desktop/coding reasoning.txt`, the same file The Gate came from), whose whole trick is one line: `pz.creatures.map((cr,i) => inRoom(i)>=0 ? '' : …)` — **a guest standing in a room is removed from the tray.**

So on the three questions whose answer is a person (`who`/`liar`/`honest`, over half of all cases — see `PERSON_Q`), **the jail IS the answer box**: drag a suspect in, they LEAVE the line-up, submit. The old answer row is not rendered at all. The other kinds answer with a number, a yes/no/unsure or a statement, so they never duplicated a name; they keep their controls and the jail stays a separate arrest there.

⚠ **The gesture must be symmetrical.** Reported immediately after the first build: "when i dragged in i should be able to drag out also". Drag the occupant out (or tap them, which is what tapping a filled room does in the prototype) and they walk back into the line-up. A door that only opens one way is the first thing a player finds. Note the submit button un-arms when the jail empties, so a stale answer cannot be sent.

⚠ **The bay clips, and that deletes the thing you are dragging.** `overflow: hidden` is what gives the cell its recessed mouth — and it made the occupant VANISH at the edge when carried out. The walls come off (`overflow: visible`) for the duration of that one gesture.

⚠ **Bars are mostly spacing.** 3px-on-15px rendered as a barcode, not a cell; 2px-on-27px reads as bars because you can see the face between them. And the first build drew them over the EMPTY cell's "drag your answer in" label, making the only instruction on screen unreadable — the door now closes only once somebody is inside, which is also more truthful.

⚠ **The drag moves the CARD, not a floating clone.** `#ui-shell` is a transformed ancestor, so `position: fixed` is trapped inside it (the same trap the universe modals hit — they are portalled to body for this reason). A `transform` is relative to the element's own layout box and cannot be trapped. ⚠ **And the cell is ALSO a tap-through picker** (nobody → each suspect → nobody), which is not a convenience: a drag needs a pointer that can press, move and hold, and a keyboard has none. Removing it to make dragging the only way in re-creates the Mirror World lockout recorded below — an accessible control that renders, registers taps, and cannot reach the state.

**GIVE THE SCORED DECISION THE HEAVIER GESTURE** (2026-08-20). The cell used to sit at the end of the private notebook cycle (unmarked → cleared → held → **in the cell**), so the one committing act in the game was also the easiest thing on the board to trigger by accident while taking notes. **Tap** now cycles the private marks only; the cell is reached by dragging. A mark is a thought and costs a tap; an arrest is a commitment and costs a deliberate gesture across the screen.

**A LAZY SCENE CAN MISS THE ORDER TO STOP, AND THEN DRAW FOREVER** (2026-08-20). Home's `ZenUniverse` is behind `Suspense`, and the effect that idles it (`zenRef.current?.setRunning(false)`) only re-runs when `activeTab`/`mazeOpen` change. Leave Home before the chunk resolves and `zenRef.current` is still `null`: the `?.` swallows the call, the scene mounts already running, is never told to idle, and then renders **22k particles and a WebGL context behind every other screen for the rest of the session**. It is invisible, so it reads as the whole app being slow — not as a bug on Home. Two more copies of the same shape sat underneath it: `useImperativeHandle` attaches during layout while the real `setRunning` is installed by the effect *after*, so a stop arriving in that window hit a no-op placeholder; and `wantAwake` was a plain `let`, re-initialised to `true` on every effect run, so a WebGL context restore woke a scene the app had deliberately idled. **Store the caller's last wish in a ref and replay it from the attach callback** — an imperative handle on a lazy child is not there yet when you first talk to it.

**`overflow: hidden` ZEROES A FLEX ITEM'S MINIMUM SIZE, and that deletes a section silently** (2026-08-18). The Home model panel gained `max-height` + `overflow-y: auto` so it would stop running off the bottom of the screen. Its three suggestion rows immediately collapsed to **2px** — the gaps, nothing else. A flex item's automatic minimum size is normally `auto`, which stops it shrinking below its content, but `overflow: hidden` changes that to 0; `.np-streams` sets `overflow: hidden` only to clip its own rounded corners. The rows were still in the DOM, still styled, still had text, and measured zero. Neither rule is wrong on its own, and reading either one shows nothing. Fix: `.np-body > * { flex: 0 0 auto; }`. Whenever you add a height cap to a flex column, check what its children measure afterwards — `getComputedStyle` will not tell you, only `getBoundingClientRect` will.

**A GENERATED question bank needs its answers re-derived, not spot-checked** (2026-08-17). Story Time's retrieval half stopped being "rebuild every panel from a tray" (~18 taps of craft work, scored all-or-nothing per panel, so 13 of 15 features remembered read out as 2/5) and became **Kawkab Asks**: the hub-centre mascot asks where the story began, who was in a scene, what came next, which came first, how many scenes had company, and shows one scene that may never have happened. The questions are generated from the beats in `story-grid/data.js`, because 45 stories × 6 questions × 2 languages is not a bank a human keeps correct — and `npm run validate:storyq` re-derives every answer from the beats across many seeds. It caught two generator bugs on its first run: `winning-goal` plays the identical park scene twice, so "what happened next" offered that panel as two separate options, and its four beats are only three distinct panels. Neither is visible from playing a round.

⚠️ **Gates run in plain Node, which cannot parse `.jsx` at all.** Any config a gate must check has to live in a `.js` module. **As of 2026-08-28 the ungated list is EMPTY** — `train-switch` went to `carParkData.js` and `mot` to `motData.js` (which also retired a regex that scraped `const BASE` out of the JSX), and every other curve was already importable. ⚠️ The same trap bit twice more that day in its other form: `speedMatchData.js` and `rush-hour/data.js` imported their neighbours **extensionlessly**, so the gate could not load them at all — Vite resolves that, plain Node does not. Add the `.js`. Extracting one is mechanical (pure config out of `index.jsx` into a data `.js`, re-export from `index.jsx`) — `math-gates/mathGatesData.js`, `paired-associates/palData.js` and `task-switch/taskSwitchData.js` were done this way. Watch for orphaned helpers: `mean` moved with the block and broke `index.jsx`.

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
- [ ] Migrate the `mm_*` **and `rx_*`** localStorage state through `src/lib/storage.js`. ⚠️ It is **not** the single choke point this line used to claim: **33 files reach `localStorage` directly**, including `training/rating.js`, `training/shared/trialLog.js`, `workout/workoutState.js`, `context/AppContext.jsx`, `lib/appTheme.js` and all four `relax/` special-category stores. Plan the migration against ~34 call sites, not one — and consider exporting one `ALL_KEY_PREFIXES` from `storage.js` first, so erase/export can never miss a namespace.

### Security checklist (partially done)
- [x] **Clickjacking: the app refuses to run in an iframe** (2026-08-29) — `src/lib/frameGuard.js`, called from `main.jsx` before React mounts, gated by `audit:sec`'s zero-tolerance `frame-guard` rule.

  ⚠️ **`frame-ancestors` DOES NOT WORK HERE AND MUST NOT BE ADDED TO THE META CSP.** It is header-only by spec and is *ignored* in `<meta>`; GitHub Pages cannot send headers (`curl -sI` the live site: no `X-Frame-Options`, no CSP header at all). Adding it would sit in `index.html` looking like protection while doing nothing — worse than none, because the next reader stops looking.

  ⚠️ **And the guard cannot be an inline `<script>`** — `script-src` has no `'unsafe-inline'`, so an inline frame-buster is blocked by our own CSP and silently does nothing. It has to be a module.

  Confirmed vulnerable before the fix by framing the live site and reading the frame: the app mounted normally inside it (`#root` had 3 children, no refusal). Re-tested after deploy. The risk was **never data theft** — a cross-origin frame cannot read this app's DOM or `localStorage`, and there is no session to steal — it is UI redressing: steering a user into clicking Settings → Delete Account, or into the `rx_*` wellbeing stores, in their own session.
- [x] No iframes and no `window` message listener — the app renders zero `<iframe>`s, `default-src 'self'` already blocks embedding third-party frames, and the only `postMessage` is rush-hour's Web Worker (`w.addEventListener`, not `window.addEventListener('message')`), so there is no origin-check hole. Re-check both if either ever changes.
- [x] CSP meta tag in `index.html` (trusted CDNs only) — keep in sync when adding origins
- [x] SRI on the Babylon CDN script (in AppContext, not index.html)
- [x] HTTPS (GitHub Pages enforced)
- [ ] Input sanitization for any future user-submitted text (before Supabase writes)
- [ ] Supabase auth rate limiting
- [ ] `npm audit` clean before each release
- [ ] **Known limitation, accepted for now**: personal reflection/assessment data (habit tracker, personality/relationship quizzes, Ikigai, cognitive assessment scores, **and the personalization model + its 40-entry interaction history**) is stored unencrypted in `localStorage` via `src/lib/storage.js`, with no PIN/app-lock gate. Anyone with device access (or a future XSS) can read it in plaintext. Deliberately not fixing with client-side encryption or an app-lock now — revisit only once Supabase Auth (above) actually changes the trust model; don't build throwaway local crypto in the meantime.
- [ ] Capacitor native: HTTPS-only, no cleartext, separate dev/prod Supabase projects

Priority: Auth + RLS → `.env` secrets → sanitization → audit clean.
