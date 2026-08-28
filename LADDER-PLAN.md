# LADDER-PLAN.md

Replacing **easy / medium / hard** with **one ladder per game**, in bands of ten
levels, where each band introduces something the player can name.

Started 2026-08-28. **DONE — all 18 live games migrated.**

| Game | Levels | Bands | Was |
|---|---|---|---|
| keep-track | 50 | 5 | 300 |
| paired-associates | 70 | 7 | 300 |
| story-grid | 60 | 6 | 300 |
| math-gates | 50 | 5 | 300 |
| intercept | 60 | 6 | 300 |
| detective | 50 | 5 | 300 |
| gatekeeper | 50 | 5 | 300 |
| mirror-world | 50 | 5 | 300 |
| task-switch | 50 | 5 | 300 |
| mot | 40 | 4 | 300 |
| train-switch | 50 | 5 | 300 |
| sort-shift | 50 | 5 | 300 |
| synonyms | 50 | 5 | 300 |
| trivia | 50 | 5 | 300 |
| speed-match | 60 | 6 | 300 |
| wordle (Word Maze) | 50 | 5 | 300 |
| cancel-task | 60 | 6 | 300 |
| rush-hour | 60 | 6 | 300 |

**4,900 levels became 850.** Every one of them spans exactly what the three
tiers spanned — L1 is the old easy L1 and the top is the old hard L100 in every
case — so nothing got easier or harder at either end. What went away is the
repetition in the middle, and what arrived is a named thing every ten levels.

**`audit:curves` gates all 18**, and its "cannot be gated where it sits" list is
empty for the first time.

Tiers survive in three narrow places, all deliberate: **Survival** still ramps
through them (`tierStage`, `survivalTier`); the **benched** games still use them;
and **Pass n Play** in `cancel-task` / `rush-hour` still shows a 3-way picker,
which is a fairness knob for a shared board rather than a difficulty gate.

> Say **"run the ladder plan, phase N"** to continue.

---

## Why

The three tiers were never three difficulties. Measured across the seven games
whose curves are gateable, **the lever that decides what the game IS never moved
inside a tier**:

| Game | lever | easy | med | hard |
|---|---|---|---|---|
| keep-track | `targets` | 2→**2** | 3→**3** | 4→**4** |
| math-gates | `opCount` | 2→**2** | 3→**3** | 4→**4** |
| story-grid | `len` | 4→**4** | 5→**5** | 6→**6** |
| gatekeeper | `poolSize` | 2→**2** | 4→**4** | 6→7 |

Within a tier only timing and count nudged. So "Easy" was not an easier version
of the game — it was a **different game hidden behind a menu word**, reachable
only by knowing to back out and pick another label.

Two more measured facts:

- **7 of 23 levers overlapped**: finishing Easy already exceeded starting Hard.
  Math Gates left Easy at `target 18` and started Hard at `12`. The intended
  journey stepped backwards as often as forwards.
- **Survival already ran the single ladder** (`difficulty.js:tierStage`,
  `survival.js:survivalTier`). The model was proven in the codebase; Levels mode
  was the odd one out.

## Decisions (locked)

| Decision | Choice |
|---|---|
| Unlocking | **Strict, in order.** Survival remains the instant-challenge route — it reaches `hard` in ~35s. |
| Old progress | **Map to best tier reached.** Deepest level in each old tier → matching third of the new ladder, take the max. Non-destructive: the old record is kept. |
| Ladder length | **Features × 10. Never padded to a target.** Ladders may GROW as features land; they must never shrink. |
| Band size | 10 (`BAND_SIZE` in `shared/difficulty.js`). |

⚠ **A band must earn its ten levels.** It introduces a mechanic or moves a
structural lever. "The same game slightly faster" is exactly what a 100-level
tier was, and `audit:curves` now rejects it.

## Sequencing against the design pass

The design/graphics work and the ladder work touch **disjoint files**, with one
contested area — so they run in parallel:

- **Ladder** → `domains/*/games/*/data.js`, `shared/difficulty.js`, `scripts/*.mjs`
- **Design** → CSS, tokens, art in `public/Assets/`, `GamePlanetTile`, render layers
- **Contested** → `ModeShell.jsx` + `TrainingScreens.jsx` (the two screens)

The ladder **deletes** `TrainingDifficultySelect` and **changes the meaning of**
`TrainingLevelGrid`. Designing either before the data work is designing the
wrong thing — which is why the data comes first and the screens come last.

**What the design pass owes Phase 5:** a level grid that can show a band header,
a "new mechanic introduced here" marker, and a **variable total** (not always 100).

---

## Inventory — the 18 live games are not one problem

| Kind | Games | What "difficulty" is | Work |
|---|---|---|---|
| **A — parametric curve** (10) | keep-track ✅ math-gates ✅ paired-associates ✅ story-grid ✅ detective ✅ intercept ✅ gatekeeper ✅ mirror-world ✅ task-switch ✅ mot ✅ | `levelCfg(diff, lv)` → numeric levers | **DONE.** Rewrite the span into bands |
| **B — curve trapped in `.jsx`** (1) | train-switch ✅ | same, but no gate could reach it | **DONE.** Extracted to `carParkData.js`, then Kind A |
| **C — content-bank tiered** (3) | synonyms ✅ trivia ✅ sort-shift ✅ | *which content you are served*, not a number | **DONE.** Weighted accumulating pool |
| **D — monolith with its own screens** (4) | speed-match ✅ wordle ✅ cancel-task ✅ rush-hour ✅ | curves are fine; the UI is bespoke | **DONE.** Surgery on each game's own flow |

⚠ **KIND D WAS A UI PROBLEM, NOT A CURVE PROBLEM — and it did NOT need a
ModeShell rewrite.** That was the original plan and it was needlessly big. The
same surgery ModeShell got works on each game's own flow: delete its `diff`
phase, point its own level grid at the ladder, flatten its progress keys.
~12 edits apiece.

| Game | Lines | How its ladder works |
|---|---|---|
| cancel-task | 2,460 | **Path** through the authored curriculum |
| rush-hour | 2,135 | **Path** through the curated puzzle bank |
| wordle | 1,161 | Band table in `wordleData.js` |
| speed-match | 1,160 | Band table in `speedMatchData.js` |

⚠ **TWO OF THEM ARE "PATH" LADDERS, AND THAT IS THE INTERESTING PART.**
Cancellation's difficulty is not a few knobs — it is `TC[diff]`, a hand-built
monotonic target series per tier, plus a pool, a sigmoid time curve, feature
interference and conjunction strength. All 300 authored points are validated by
`audit:fq`. Rush Hour's is a curated bank verified by `validate:rh`. Re-authoring
either would have thrown that away and re-opened the exact bug `audit:fq` exists
for.

So their ladders **walk the existing content** instead: each rung maps to an
authored (tier, level) that is already gated. Two bands per tier, each sweeping
half of that tier's hundred. **No content moved at all** — which also dissolved
the "Rush Hour is irreversible" worry that had it scheduled last.

⚠ **The authored tiers do NOT chain, and the gate proved it.** Walking
easy→medium→hard, Cancellation's target count DROPS at L21 (8 → 7) because the
board jumps 5×5 → 7×7 and the count resets lower — a genuine difficulty trade,
not a regression. So a path ladder is checked **band start-to-end**, with every
band edge required to grow the board, and every rung required to play a distinct
authored level. Level-to-level monotonicity is deliberately NOT asserted: the
authored series has integer rounding jitter (3.125 → 3.222 seconds per target)
that `audit:fq` already owns and tolerates, and a second opinion here would only
pressure someone into re-tuning verified curriculum.

⚠ **Tier key names are not consistent across games.** `cancel-task` and
`rush-hour` use `easy/medium/hard`; most others use `easy/med/hard`. Writing
`'med'` made `TC[diff]` undefined and every level of two bands threw — caught by
`audit:curves` on its first run.

(`mot` was the fifth monolith risk and turned out fine — it uses ModeShell, so
only its curve needed extracting.)

---

## Phases

### Phase 0 — foundation ✅ done 2026-08-28
- `shared/difficulty.js`: `BAND_SIZE`, `bandIndex`, `ladderFraction`,
  `mechanicsAt`, `ladderStage`. **`levelFraction` and `tierStage` are untouched**
  — Mirror World and every unmigrated game still use them.
- `shared/ModeShell.jsx`: optional `ladder={{ levels }}` prop. Present → one
  ladder, no difficulty screen, flat progress. Absent → **exactly today's
  behaviour**. The two models coexist deliberately so games migrate one at a
  time; a big-bang switch would strand every game not yet rewritten.
- `migrateToLadder()` + `reached`. Migrated levels are **unlocked, not ticked** —
  marking a level ✓ the player never played is a lie the grid would repeat forever.
- `trainingStrings.js`: `ladderBlurb`, `ladderPickLevel` (both languages).

### Phase 1 — pilot: Keep Track ✅ done 2026-08-28
**50 levels, 5 bands.** Span unchanged at both ends: L1 is the old easy L1, L50
is the old hard L100. 250 levels of middle repetition removed.

| Band | Levels | targets | pool | adds |
|---|---|---|---|---|
| 1 | 1–10 | 2 | 4 | `track` |
| 2 | 11–20 | 2 | 5 | — |
| 3 | 21–30 | 3 | 5 | `hold3` |
| 4 | 31–40 | 3 | 6 | — |
| 5 | 41–50 | 4 | 6 | `hold4` |

⚠ **The number was found, not chosen.** The first draft had six bands; the new
gate rejected band 6 as inert. The band was deleted rather than the gate relaxed.

⚠ `levelCfg(level)` now takes **one argument**. The old two-arg form was removed
rather than shimmed — a shim would let a caller keep passing `'easy'` and
silently get band 0 forever.

### Phase 2 — Kind A ✅ done 2026-08-28
All ten, in domain batches. Gates re-run after each batch; all 17 CI gates green.

**Things worth keeping from doing it:**

- **`mot`'s curve was extracted to `motData.js`, killing a regex parser.**
  `audit:mot` used to scrape `const BASE = {…}` out of the JSX with a regex. It
  worked, but a scraped curve is one refactor from being silently ungated: a
  changed shape throws, a *subtly* changed shape matches the wrong numbers. The
  gate now imports what the game runs. (The runtime clamp and arena aspect are
  still scraped — they live in the render path, not the data.)
- **`task-switch` is now gated by `audit:curves` for the first time**, since it
  finally has a band table to assert.
- **Group War launches these engines directly** (`puzzles/games/groupwar/
  catalog.js`) with `{mode, diff, level}`. Only `math-gates` and `trivia` use
  `hardMode: 'levels'`; math-gates' `hardLevel` moved 40 → 45 to stay equivalent
  on the shorter ladder. **Check this file whenever a Group War game migrates.**
- **Pass n Play now takes a ladder LEVEL**, so ModeShell's three depth choices
  actually reach each engine. They used to hit a hard-coded config in several
  games, which meant the picker did nothing.
- ⚠ **The Bash heredoc collapses `\\` to `\`.** Two patch scripts wrote broken
  regexes and a mangled `console.log` this way, and one silently matched nothing.
  Use the Edit tool for anything containing backslashes.

### Phase 3 — Kind B ✅ done 2026-08-28
**`audit:curves` no longer prints an ungateable list at all.** Every one of the
13 live games with a parametric curve is now gated: 11 in `audit:curves`,
plus cancel-task (`audit:fq`) and mot (`audit:mot`).

- **`train-switch` (Car Park / Spaceship)** — curve extracted to
  `carParkData.js` and migrated: **50 levels, 5 bands**, `maxC` (ships in play
  at once) stepping 1 → 5, so the ~4-object divided-attention limit is crossed
  at band 4 and overloaded at band 5. The old tiers used `maxC` as the TIER
  marker, which meant a player on Easy never once met the thing the game is for.
- **`speed-match` — registered but NOT migrated, deliberately.** Its curve was
  already in `speedMatchData.js` (it never needed extracting; it just was never
  registered). But the game is a **1,160-line pre-ModeShell monolith that renders
  its own `TrainingDifficultySelect`** — Kind D, like cancel-task. So it is gated
  on its tier spec today and flips to `ladder: true` when the UI half is done.

⚠ **Registering it immediately caught the extensionless-import trap**, live:
`speedMatchData.js` imported `shared/focusQuestData` with no `.js`. Vite
resolves that, plain Node does not, so the gate could not load the module at
all. All three of its imports now carry explicit extensions. This is the failure
mode CLAUDE.md warns about — it breaks the GATE, not the app, so it only ever
shows up in CI.

### Phase 3b — Kind D · speed-match ✅ done 2026-08-28 (1 of 4)

**A Kind D game does NOT need rewriting onto ModeShell.** That was the plan and
it was wrong — needlessly big. The same surgery ModeShell got works on the
game's own flow: delete its `diff` phase, point its own level grid at the
ladder, flatten its progress keys. Speed Match took ~12 edits, not a rewrite.

**Speed Match: 60 levels, 6 bands** — `pairCount` (symbols in the key) has
exactly six useful values, 4..9. Span unchanged: L1 is the old easy L1, L60 the
old hard L100.

**New shared machinery** — a Kind D game awards points itself rather than
through ModeShell:

- `lib/points.js` → **`ladderWinPoints(level, levels)`**. Same 0..1 scale and
  therefore the same 5/10/15/20 ladder as `trainingWinPoints`; the position just
  comes from the whole climb rather than a tier index plus an offset.
  ⚠ `trainingWinPoints` is NOT deprecated — the three remaining monoliths and
  every benched game still call it. Deleting it would silently zero their awards.
- `AppContext` → **`awardLadderWin(gameKey, level, levels)`**.
  ⚠ Its claim key keeps a `lad` segment where the tier name sat
  (`speed-match:lad:40`). Reusing the old key shape would have made every
  migrated level look already-farmed and pay nothing.

⚠ **Checked before assuming: none of the 14 ModeShell games call
`awardTrainingWin`.** Only the monoliths and benched games do, so passing
`diff: null` through ModeShell never affected anyone's points.

⚠ `migrateLadderReached()` lives in `speedMatchData.js` and applies the same
best-tier-reached rule ModeShell uses. The old `easy-12` keys are left on disk.

**The remaining three** (cancel-task, wordle, rush-hour) follow the same recipe.
Rush Hour still goes last — its curated bank is the only irreversible content.

### Phase 4 — Kind C ✅ done 2026-08-28 (three of the five; two were Kind D)

**Wordle and Rush Hour turned out to be Kind D**, not Kind C — 1,161 and 2,135
lines, no ModeShell, both rendering their own `TrainingDifficultySelect`. So
Phase 4 was three games, and **Kind D is now the whole remaining blocker.**

**Decision taken: the content pool ACCUMULATES, weighted.** A band's pool grows
as you climb and the newest tier is weighted up. The alternative — a sliding
window, one tier per band — was rejected on a measured ground: Sort It Another
Way has only **three sets per tier**, so a sliding band would cycle the same
three boards for ten levels, which is the repetition the ladder exists to
remove. Its top band now draws from all nine sets, mostly hard.

| Game | Levels | The lever that had been hidden behind a menu word |
|---|---|---|
| synonyms (Word Links) | 50 | **Analogies and pair matching.** `allowedKinds` returned `['similarity','odd']` on easy — the two formats that make this reasoning rather than vocabulary were unreachable if you picked Easy. Now bands 2 and 3 |
| trivia | 50 | ★★★★ expert questions, previously only if you chose Hard, which *opened* on them |
| sort-shift | 50 | All three rules (easy asked for two), plus the meaning-based sets |

**New shared machinery** in `shared/difficulty.js`: `pickWeighted()` and
`tierMass()` — the weighted mean rank of the tiers in play, 0..1.

⚠ **`tierMass` is what makes a weighted pool gateable at all.** `poolSize` alone
would pass a band that widened its pool without shifting any weight toward the
hard end — wider, but no harder, and invisible from the config. Registered as a
structural field, plant-tested, and it fired:
`sort-shift L41: tierMass moved the wrong way (0.625 → 0.3, expected up)`.

⚠ **Trivia's ladder lives in `triviaLadder.js`, not `triviaData.js`.** The data
file imports the whole authored bank from `./data/*` with extensionless paths,
so a gate importing it dies before reading a number. The ladder module imports
nothing but `difficulty.js`.

⚠ **Group War's trivia `hardLevel` was `1`** — level 1 of the HARD TIER, which
opened straight onto the expert pool. On the ladder L1 is the gentlest level in
the game, so leaving it would have silently made Group War's hard setting its
easiest. Now 45.

### Phase 5 — the banded grid — NOT STARTED, waiting on the design pass
Rebuild `TrainingLevelGrid` to show band headers and a "new mechanic here"
marker. **The end state below is already reached for the hub: no live hub game
renders a difficulty screen.** What is left is purely the grid's design.

⚠ **`TrainingDifficultySelect` CANNOT simply be deleted**, and the migration
surface is **25 files, not 18**. Seven ModeShell/tier users sit outside the 18
live games:

| Files | Status | What happens to them |
|---|---|---|
| `brixton`, `wisconsin`, `trail-making`, `odd-one-out` | benched, use ModeShell | Nothing. `ladder` is optional, so they keep compiling on the tier path |
| **`spatial-stroop`, `memo-span`, `nback`** | **live and load-bearing** | ⚠ They import `TrainingDifficultySelect` **directly**, not through ModeShell, and run their own mode state machines |

Those three have **no training-hub slot**, so they read as dead code to anyone
tidying up — but `spatial-stroop` and `memo-span` are scheduled by weight in
`workoutData.js` and `nback` is the Assessment's memory paradigm. This is the
same trap `audit:gamekeys` exists to catch (see CLAUDE.md).

**So the tier path stays alive on purpose.** The end state was never "tiers
deleted", it is **"no LIVE HUB game uses tiers" — and that is now true.**
Retiring `TrainingDifficultySelect` entirely is a separate decision that requires
migrating those three first, and migrating them means touching the Assessment
and the Daily Workout.

---

## Gates

`audit:curves` grew a `ladder: true` spec kind asserting three things:
levers monotonic across the **whole** ladder · the mechanic set never shrinks ·
**no band is inert** (`structural` names the levers that count).

`validate:intercept` gained a **band-edge drift** rule: each band must introduce
exactly the mechanic its `LADDER` entry claims, and that mechanic must be absent
on the last level of the band before. Intercept's mechanic onsets are derived
from `bandStartF(b)`, never typed — `f` is `ladderFraction` (^0.85), so the
fraction at L11 is 0.221, not 0.167, and a hand-typed threshold drifts the
mechanic off its band edge invisibly.

`validate:gatekeeper`'s "every half-tier must be harder" became **every band**,
measured on the HYPOTHESIS SPACE rather than `poolSize` — `audit:curves` proves a
band moves a declared lever, this proves the lever changes the puzzle. A pool
that grows by a clause saying nothing new passes there and fails here, which is
exactly the bug that shipped once.

`validate:liars` gained a **superset** check on the statement kit and question
pool: a band that swapped one statement type for another would keep the count
identical and quietly remove something the player had learned to read.

⚠ **Two rules were plant-tested and fired**, each naming the right thing: the
inert-band rule (planted a sixth Keep Track band) and the band-edge drift rule
(planted the naive `0.1667` threshold in Intercept).
A gate that only ever passes has not been shown to work — see the `audit:gamekeys`
false PASS in CLAUDE.md, where a CRLF mismatch meant the plant never landed.
**Verify the plant landed before trusting the result.**

Also updated for the one-arg `levelCfg`: `audit:pacing`, `validate:keeptrack`.

---

### Migration, measured

Not just proportional — it lands players at genuinely equivalent difficulty.
Old config at the level they reached vs new config at the migrated level:

| old record | → | old (targets/stream/rate) | new |
|---|---|---|---|
| easy L100 | L17 | 2 / 18 / 1780 | 2 / 16 / 1814 |
| med L100 | L33 | 3 / 22 / 1480 | 3 / 21 / 1504 |
| hard L100 | L50 | 4 / 26 / 1200 | 4 / 26 / 1200 (exact) |
| hard L25 | L38 | 4 / 20 / 1474 | **3** / 23 / 1412 |

⚠ **Known artifact, accepted.** A player who reached *early* Hard is handed 3
categories where they had 4, because the old "hard third" (L34–50) straddles
bands 4 and 5. It is bounded (one band, self-corrects by L41) and never blocks
anyone. Fixing it would need game-specific knowledge of what `targets` means
inside a generic shell function, which is a worse trade. **Re-measure this table
for each game as it migrates** — the straddle depends on that game's band table.

## Open questions

- **Pass n Play depth labels** are `L13`-style (language-neutral). Fine, but a
  band NAME would read better once bands are visible in the UI (Phase 5).
- **The Daily Workout** schedules by weight and calls games in `free` mode, so it
  is unaffected — **re-check when a scheduled game migrates**.
- **Kind C banding** is undecided per game. Do not start these without a decision.
