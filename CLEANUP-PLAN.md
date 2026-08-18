# CLEANUP PLAN

Written 2026-08-18, after a full survey of the repo. This is the plan for making
the codebase clean and organised.

**How to start this work in a new session — say any of these:**

> "Run the cleanup plan, phase 1."
> "Do phase 2 of CLEANUP-PLAN.md."
> "What's left in the cleanup plan?"

Each phase below is self-contained and independently shippable. **Do them in
order** — the ordering is by benefit-per-risk, not by size. Tick the boxes as
they land so a later session can see where it stopped.

---

## The finding that shapes this plan

The codebase does not feel messy because of dead code. It feels messy because
**33 MB of scratch files across 616 untracked paths sit in the working tree**,
and because a handful of files are far too large.

Deleting every genuinely-dead game would remove **2,950 of 120,141 source
lines — 2.4%** — and would destroy the written reasoning for why two games were
benched. That is a bad trade and it is not in this plan.

⚠ **Deleting is the riskiest part of any cleanup here, not the safest.** While
surveying, a `git grep "games/odd-one-out"` returned **zero** references and the
folder looked deletable. It is not: `synonyms/index.jsx` and
`synonyms/procedural.js` both import `CATEGORIES` from it via a **relative** path
(`../odd-one-out/data`), which that grep cannot see. Deleting it would have
broken Word Links with no build error. Before removing anything, grep for the
**bare folder name** across `src`, not the path.

---

## Phase 1 — Get the scratch out of the working tree  ✅ SAFEST, BIGGEST VISIBLE WIN

Nothing tracked changes. This is what actually made the repo look bad.

- [ ] Move `tmp/`, `.character-preview/`, `artifacts/`, `_orig_idle.png`,
      `design-qa.md` into one ignored directory (suggest `.scratch/`), or delete
      them if the art pipeline is finished with them.
- [ ] **`public/_tmp_preview/` (211 files) — delete or move out of `public/`.**
      ⚠ This is not tidiness. Anything in `public/` is copied into `dist/` by a
      local `npm run build`, so a **manual** gh-pages deploy publishes it to the
      live site and into the service-worker precache. This exact folder put 211
      files / 2.6 MB on the live site on 2026-08-06.
- [ ] Add the scratch paths to `.gitignore` **and** to the `ignores` block in
      `eslint.config.js`.
- [ ] Re-run `npm run lint`. Many of the ~102 reported errors are in `tmp/*.mjs`
      scratch, not in real source. ⚠ Same class of false signal as the incident
      where eslint linted the built bundle and reported 117 fake errors — find
      out how many errors are *real* before trying to fix any of them.
- [ ] Confirm `git status --short public/` is clean afterwards.

**Risk: none.** No tracked file changes. Fully reversible.
**Payoff: large.** The repo becomes navigable and the lint number becomes true.

---

## Phase 2 — Break up the giant stylesheets

`src/styles/` holds **18,857 lines across 15 files**, and CSS is split between
there and 20 co-located files in `features/` (8,523 lines) with no rule for
which goes where.

- [ ] **`src/styles/training.css` is 9,158 lines** — the worst file in the repo.
      Split it by concern, keeping each new file's name matched to what imports
      it. It is imported by `main.jsx`, `RadialMazeHub.jsx`,
      `TrainingHubMascot.jsx`, `TrainingPlanetField3D.jsx` and
      `shared/playHud.css`, so start by finding which blocks serve which.
- [ ] Fold the one-screen hub experiments into whatever survives:
      `trainingHubPremium.css` (660), `trainingHubBone.css` (272),
      `trainingHubReal3D.css` (106), `trainingHubAssetPlanets.css` (95),
      `attentionHeaderProtos.css` (280). Several are prototypes that won or lost
      long ago — check which selectors are still reachable before deleting.
- [ ] Write the rule down in `CLAUDE.md`: **tokens and app-wide chrome live in
      `src/styles/`; anything owned by one feature lives beside it.**

⚠ **Do not "tidy" colours while doing this.** `npm run audit:design` is a
CI-blocking ratchet on hard-coded colours; moving a rule is fine, retyping one is
how the count goes up and blocks a deploy.

⚠ **Check `getComputedStyle` on the live element after each split**, not the
stylesheet. This repo has four recorded cases of a correct-looking CSS change
doing nothing (`!important` wars, shorthand resets, invalid `var()`, and
`overflow:hidden` zeroing a flex item's minimum size).

**Risk: medium.** Nothing breaks the build; things break *visually*, silently.
**Payoff: large.** This is the single worst file in the project.

---

## Phase 3 — Resolve `src/components/` vs `src/features/`

Today: `features/` has 361 files, `components/` has 47, and the same *kind* of
thing lives in both. All the tab screens are in `components/screens/`, and
`components/training/RadialMazeHub.jsx` (1,147 lines) is the training hub UI
while the whole training feature lives in `features/training/`.

- [ ] Move `components/training/*` into `features/training/` — they belong to
      that feature and nothing else uses them.
- [ ] Move `components/screens/*` to a single home. `ARCHITECTURE.md` wants
      `features/<name>/`; the smaller step is `src/screens/`. **Pick one and
      write it down** — the current split is the actual problem, not which side
      wins.
- [ ] Leave `components/maze/` alone for now; the Babylon room host is
      self-contained and high-risk to move.
- [ ] Do it in **one move per commit**, running `npm run build` between each.

⚠ **`src/features/training/registry.js` and `lazyGames.js` are the spine.**
`lazyGames.js` builds from the registry, so breaking an import path there can
make an Assessment pillar render **nothing, with no error**. Run the app and open
the Assessment after any move that touches training.

**Risk: high.** Import paths are load-bearing and some failures are silent.
**Payoff: medium-large.** This is the thing that makes the project *feel*
architected.

---

## Phase 4 — Fix the docs so they stop lying

- [ ] `ARCHITECTURE.md` (178 lines, untouched since **2026-05-10**) describes
      `src/app/` and `src/i18n/`, **neither of which exists**. Either build
      toward it or rewrite it to describe reality. A plan nobody follows is worse
      than no plan, because newcomers trust it.
- [ ] `AGENTS.md` (14 lines, untouched since **2026-05-06**) — check whether it
      is still true; delete if not.
- [ ] `3D-MIGRATION.md` (73 lines) and `MAZE-DEAD-CODE.md` (85 lines) describe
      **finished** work. Move to `docs/history/` or delete — git has them.
- [ ] Root also holds `bake-portrait.html`, `setup.bat`, `start-dev.cmd`,
      `start-server.bat`. Confirm each is still used; move the survivors to
      `scripts/`.
- [ ] Once phases 1–3 land, update the architecture section of `CLAUDE.md` so it
      matches the new tree.

**Risk: none.** Documentation only.
**Payoff: medium.** Stops the next session (human or AI) acting on stale maps.

---

## Explicitly NOT in this plan, and why

| Thing | Why it stays |
|---|---|
| `nback` (1,072 lines) | **Load-bearing.** Runs the Assessment's *memory* pillar. Unregister it and that pillar renders nothing, silently. |
| `spatial-stroop` (2,598 lines) | **Load-bearing.** Runs the Assessment's *flexibility* pillar **and** is scheduled by weight in `workoutData.js`. |
| `odd-one-out` (608 lines) | Its `data.js` is a **live import** of Word Links. See the warning at the top. |
| `memo-span` (1,226 lines) | Deliberately parked for possible re-enable; carries an explicit loader in `lazyGames.js`. |
| `trail-making` art | Intercept's hub tile borrows `speed-trail-making-v2.webp`. Its `gameScience`/tutorial entries are deliberately kept. |
| `wisconsin`, `brixton` | Genuinely dead components, but their `BENCHED.md` files carry the measured reasoning (Brixton: 8% of top-tier rounds unsolvable at any length). ⚠ `groupwar/index.jsx:66` still lists `brixton` in its default selection — fix that first if these ever go. |
| The 2,950 deletable lines | 2.4% of the codebase, all recoverable from git history, in exchange for losing why. Not worth it. |
| Merging the two game generations | Cancellation (2,536), Rush Hour (2,135) and Speed Match (1,160) are pre-ModeShell monoliths. Rewriting them is a *feature* project, not cleanup, and each one is a working, gated game. |

---

## Ground rules for whoever does this

1. **Run the gates after every phase.** All of them, checking real exit codes:
   `audit:sec`, `validate:wordmaze`, `audit:pacing`, `validate:storyq`,
   `validate:liars`, `audit:fq`, `validate:rh`, `audit:mot`, `audit:design`.
   ⚠ Do not check `$?` after a pipe into `grep` — that reads grep's exit code and
   reports everything as passing. That mistake happened on 2026-08-18 and CI
   caught what was claimed to be green.
2. **One phase per commit**, so any of it can be reverted alone.
3. **Never `git stash -u` in this repo.** OneDrive file locks make it fail
   *partway*: untracked work is deleted and `pop` refuses. Recover via
   `stash@{0}^3`.
4. **Look at the screen** after any visual change. Green builds and grep counts
   predict nothing about what renders.
5. `main` is **source-only**. Never commit built files here.
