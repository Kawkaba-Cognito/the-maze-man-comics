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

**Deploying is automatic (2026-07-16)**: every push to `main` on `origin` (Kawkaba-Cognito) triggers `.github/workflows/deploy.yml`, which installs, runs **`audit:fq` → `validate:rh` → `audit:mot` → `audit:design`** (all four block the deploy), builds, and publishes `dist/` to the `gh-pages` branch — the branch GitHub Pages serves. It can also be run by hand from the repo's Actions tab (workflow_dispatch). The `cognitive` mirror does **not** auto-deploy; push `gh-pages` there manually if the mirror should stay current.

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

⚠️ **The `gh` CLI here is authenticated as `thecognitivedolphin-commits`, not Kawkaba-Cognito** (scopes `gist, read:org, repo`). It can read and push to origin but has **no admin**, so both escape hatches are closed: `gh workflow run deploy.yml` returns `403 Must have admin rights`, and `POST /pages/builds` returns `404`. Only the user can dispatch a deploy by hand (Actions tab → Deploy to GitHub Pages → Run workflow → main). Agents: don't burn time retrying these.

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
git -C "$TEMP/gh-pages-deploy" push cognitive HEAD:gh-pages # mirror; retry on "Repository not found"
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
- **Multi-account Git Credential Manager** — two GitHub accounts are configured here; `cognitive` remote reads/writes intermittently fail with "Repository not found" or auth as the wrong account. Retry — it usually resolves in 1–2 tries.
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

- **`registry.js`** — the spine: imports every `domains/<domain>/domain.config.js`. `lazyGames.js` auto-builds the lazy component map from it.

  ⚠️ **Adding a game is SEVEN wiring spots, not one** (corrected 2026-08-10 — the old "one wiring spot" claim here was wrong, and believing it leaves games half-registered). Wiring Keep Track touched: `domain.config.js` · `rating.js` · `shared/gameScience.js` · `shared/tutorials/trainingMeta.js` · `shared/GamePlanetTile.jsx` (**two** places: `COVER_KEYS` and `COVER_FILE_OVERRIDES`) · `package.json` (if it has a content bank needing a `validate:*` gate) · `lazyGames.js` (**only** if the assessment battery runs it).

  `lazyGames.js` is the trap. It builds from the registry, so removing a game's sub also removes it from `getLazyGame` — and if the assessment uses that game, its pillar renders **nothing**, with no error. `memo-span` and `nback` both carry explicit fallback registrations there for exactly this reason. Check with `git grep -n "gameKey: '<key>'" -- src/features/training/assessment` before unregistering anything.

  📐 **The full standard lives in the `consistency` skill** (`.claude/skills/consistency/SKILL.md`) — ⚠️ which is **gitignored** (`.gitignore:24`), so it is machine-local and does NOT travel with a clone. Enforced by `npm run audit:consistency`, which does ship. Read it before adding a game or fixing one that "feels like a different app". It carries the ten structural rules, the depth checklist, and **two** reference games: copy **structure** from `keep-track` (22/22), take the bar for what a finished game **contains** from `cancel-task` (8/8 depth — but never copy its 2381-line code).
- **Domains & live games** (per domain.config.js): attention `cancel-task, mot, train-switch` · speed `speed-match, math-gates, trail-making` · memory `story-grid, keep-track, paired-associates` · language `wordle, synonyms, trivia` · reasoning `rush-hour, raven-matrices, detective` · flexibility `mirror-world, task-switch, sort-shift`.

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

`language/games/odd-one-out` — its game component is unreachable, but **its `data.js` is a live dependency** of Word Links (`synonyms` imports `CATEGORIES` from it), so don't delete the folder. `memory/games/memo-span` is also unregistered but deliberately kept for possible re-enable. Flip, Piano Tap, and Colour Sort (tower-hanoi) were retired and deleted 2026-07-16 (recoverable from git history).

## Bilingual (EN/AR)

No i18n framework. Each component/game carries `const UI = { en: {…}, ar: {…} }` and receives `isAr`; shared labels come from `trainingStrings.js` via spread (see above). RTL is per-component `dir={isAr ? 'rtl' : 'ltr'}`. Some AR strings use Arabic-Indic numerals (`٩٠ث`) — match the surrounding file's convention. Language toggles live in the shell and per-screen headers.

## Persistence

Everything is localStorage, keys prefixed `mm_*` and versioned (`mm_wordle_profile_v1`, `mm_trials_<game>_v1`, `mm_assess_sessions_v1`, …). Go through `src/lib/storage.js` (`createProfileStore(key, defaults)` for per-game profiles; `loadJson`/`saveJson` elsewhere) — it owns the try/catch and quota handling. trialLog caps its own storage (sessions + bytes) so history can't blow the ~5 MB quota. There is no sync/backup — clearing browser data wipes the user (Supabase below will fix this).

## Comics / episodes (the original product)

- `public/episode-1-problem-solving.html` — a complete standalone Canvas game (3-floor Monument-Valley-style book layout, gate guardians, mini-games). It bypasses React and the build entirely — it is served as-is and has its own inline JS/CSS conventions. (The old React episode player, `VideoPlayer.jsx`/`VideosScreen`, has been deleted.)
- Audio app-wide is synthesized via Web Audio API — there are no audio files.

## Validation scripts

`npm run validate:puzzles` · `npm run validate:rh` (rush-hour reference solutions; `--full` for the hard ref puzzle) · `npm run audit:fq` (cancellation level curriculum **and** a zero-ink guard on every `SH` silhouette) · `npm run audit:mot` (Target Tracking difficulty curve) · `npm run validate:noir` (Detective case wiring) · `npm run validate:wheel` (The Wheel's three content banks) · `npm run validate:sort` (Sort It Another Way's card sets) · `npm run validate:keeptrack` (Keep Track's category bank — cross-category exclusivity in EN **and** AR) · `npm run validate:mirror` (Mirror World schedules — asserts every run ENDS with a washout block, because one missing plays fine and silently never shows the aftereffect, **plus control parity: every input method must be able to pass every level**) · `npm run audit:curves` (level curves — monotonic per tier, and a harder tier is actually harder **at the same level number**; also names the 6 games whose curve lives in `index.jsx` and therefore cannot be gated) · `npm run audit:consistency` (every game against the platform standard; see the `consistency` skill) · `npm run lint`. Run the relevant one after touching generators, level data or content banks.

**A gate that checks the SHAPE of a curve can certify a game nobody can play** (2026-08-09). `audit:fq` asserted "targets non-decreasing, time non-increasing" for months. Those two together *force* seconds-per-target to collapse, and it did: Cancellation's hard tier granted 11s for 26 targets that take 44.5s at the game's own documented search model. Medium went impossible from L52, Hard from L33, and Survival — one life — walled every player at round 8. The audit passed the whole time, because it validated the curve's shape and never asked whether a human could finish the board. It now asserts feasibility (time >= the expert model) and that TIME PER TARGET falls, which is what difficulty actually is. Same family as the audit:mot lesson: **assert the outcome, not the parameters**.

**An accessible alternative can be present, correct-looking, and still lock people out** (2026-08-11). Mirror World's no-drag direction pad was routed through the same scoring path as the drag — the right design — but offered the *target* angles (4 on Easy, 90° apart) against rotations of 20–35°, so its best achievable error exceeded the pass threshold: **156 of 300 levels were unpassable through the accessible route**, with buttons rendering, taps registering and reaches scoring the whole time. If a game has more than one way to play it, gate that **every** control can reach the win condition, not just that the control exists.

**Content banks need their own gate, because "no repeats" and "the facts are right" are not human-checkable at scale.** `validate:wheel` caught three ranked puzzles that were duplicates in disguise (two prompts over the same five mountains, the same five heart rates, the same five frequencies) — a prompt-keyed no-repeat draw cannot see those, so it compares ITEM SETS — plus ~20 higher/lower pairs too close to call. `validate:sort` enumerates all ten possible 3-3 splits of six cards for every set, which makes "a player finds a correct grouping the author never listed" impossible by construction rather than by care.

**`npm run audit:mot` checks the RENDER, not just the config, and that distinction is the whole point** (2026-08-08). Target Tracking's tiers were authored independently, so starting Hard was easier than finishing Medium on three of four levers. Worse, `startRound()` rescales the object count to preserve density across devices, and on a wide screen that multiplied it by 3.1× straight into the clamp — so nearly every level rendered an identical swarm and density, the model's primary lever, had stopped grading at all. The first version of this audit **passed while the game was broken**, because it validated the authored numbers. It now simulates the density rescale on four device shapes. If you add a gate to any game, make it assert what reaches the screen.

**`npm run audit:design` is a CI-blocking ratchet** — not a style suggestion. It compares hard-coded colours (and similar drift) against the ceiling in `scripts/design-baseline.json` and fails only when a number goes **up**. When it fails, the fix is either to tokenise the new values or to raise the ceiling deliberately with `npm run audit:design -- --update`, committing the changed baseline so the decision is visible in history. It never rewrites the baseline under `CI`.

⚠️ **A manual gh-pages deploy skips every one of these gates**, because they live in the workflow rather than in a pre-push hook. Code shipped that way reaches users unchecked and the gate fires later, against whoever pushes next — which is exactly what happened after the 2026-08-06 outage deploy: `1105d3a` went live unchecked and its +37 raw colours blocked the following day's push. After any manual deploy, run the gates locally against `main` and fix what they find, rather than leaving it for the next person.

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
- [ ] **Known limitation, accepted for now**: personal reflection/assessment data (habit tracker, personality/relationship quizzes, Ikigai, cognitive assessment scores) is stored unencrypted in `localStorage` via `src/lib/storage.js`, with no PIN/app-lock gate. Anyone with device access (or a future XSS) can read it in plaintext. Deliberately not fixing with client-side encryption or an app-lock now — revisit only once Supabase Auth (above) actually changes the trust model; don't build throwaway local crypto in the meantime.
- [ ] Capacitor native: HTTPS-only, no cleartext, separate dev/prod Supabase projects

Priority: Auth + RLS → `.env` secrets → sanitization → audit clean.
