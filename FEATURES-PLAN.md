# FEATURES-PLAN.md — a new thing every ten levels, and a moment that says so

**Status: PLANNED, NOT STARTED.** Parked on 2026-09-05 to rebuild Intercept and
Detective first. This file is the whole design; nothing here has been built.

Asked for by the owner, in their words: *"we will work on features of the 18
games — adding feature after some levels, like you play some levels and then you
will have new features, something new."* Followed up with: all eighteen games, in
one pass, and the reveal and the mechanics land together per game rather than the
UI shipping alone.

---

## 0. The diagnosis — two problems, and fixing one without the other is useless

**The data exists and is one hundred percent invisible.**

Every one of the 18 live games already declares a `LADDER` of bands (ten levels
each), each band carries `adds: ['nogo']`, and every game exports
`MECHANIC_LABELS = { key: { en, ar } }` — 69 player-facing bilingual names, all
authored, all correct. `mechanicsAt()` in `shared/difficulty.js` already computes
what is in play at any level.

**Nothing renders any of it.** Grepping `mechanics` across every `.jsx` returns
zero render sites. The level grid is a flat `Array.from({length: count})` wall of
numbered buttons with a `🔒` on the locked ones. There is no band header, no
"new here" marker, no unlock moment, nothing in the results screen. A player
climbing Keep Track from L20 to L21 gets a third word to hold and is told
nothing. This is `LADDER-PLAN.md` Phase 5, never started.

The one precedent is Gatekeeper, which names its bands on the play screen
(`gatekeeper/strings.js` → `FAMILY`, five bilingual `{name, sub}` pairs, rendered
as `<p className="gk-family">`). One game out of eighteen, and it is a standing
label of where you are rather than an announcement that something arrived.

**But for most games there is nothing worth revealing.**

Counting `adds` entries that name a genuinely new thing rather than a count going
up:

| Game | Levels | Bands | Named | Reality |
|---|---|---|---|---|
| intercept | 100 | 10 | 10/10 | the reference — nine real mechanics, thresholds derived from `bandStartF` |
| speed-match | 60 | 6 | 6/6 | but all six are `pairCount` 4→9 |
| detective | 50 | 5 | 5/5 | real statement-kit expansions |
| gatekeeper | 50 | 5 | 5/5 | real logical-form expansions |
| train-switch | 50 | 5 | 5/5 | all five are `maxC` 1→5 renamed |
| mot | 40 | 4 | 4/4 | all four are the target count |
| mirror-world | 50 | 5 | 4/5 | two are the target count; `coldStart` is real |
| synonyms | 50 | 5 | 4/5 | three real format changes, then tier reweighting |
| sort-shift | 50 | 5 | 4/5 | `rules` caps at 3 by band 2 |
| trivia | 50 | 5 | 4/5 | the names are the question bank's star rating |
| keep-track | 50 | 5 | 3/5 | the three names are the `targets` count |
| math-gates | 50 | 5 | 3/5 | three genuine operator unlocks |
| wordle | 50 | 5 | 3/5 | grid size + word length |
| cancel-task | 60 | 6 | 3/6 | path ladder — even bands add nothing by construction |
| rush-hour | 60 | 6 | 3/6 | path ladder — same |
| **story-grid** | 60 | 6 | **1/6** | five bands are `len`/`questions`/`opts` |
| **paired-associates** | 70 | 7 | **1/7** | longest ladder in the app, one mechanic |
| **task-switch** | 50 | 5 | **1/5** | all five bands move `pSwitch` and nothing else |

So: **revealing alone** would announce "hold four words instead of three" and
read as a nag. **Building alone** would stay invisible. Both, per game.

`audit-curves.mjs:290` already calls task-switch out by name — *"THE THINNEST
LADDER … first in line for the deferred feature work"* — and
`keep-track/data.js:117` says the empty `adds` slots **are** the deferred work:
*"the ladder grows when they are filled."* This file is that work.

---

## 1. The shared reveal kit

Build once, worn by all eighteen. Land it with the first game's mechanics so no
UI-only commit ships.

### 1.1 `src/features/training/shared/ladderReveal.js` (new)

Plain `.js`, importing `./difficulty.js` **with the extension** — the gates run
in plain Node, which does not do Vite's extensionless resolution, and dropping it
is the failure that only shows up in CI.

```js
bandTable(bands, { bandSize, levels })   // → [{ i, from, to, adds, introduces }]
newAtLevel(bands, level)                 // → keys this level's band introduces
unlockedByClearing(bands, level)         // → keys clearing THIS level buys; [] unless level % 10 === 0
nextUnlock(bands, level)                 // → { keys, band, atLevel, inLevels } | null
mechanicName(labels, key, isAr)          // → '' when missing; never leaks a raw key
mechanicNames(labels, keys, isAr)
mechanicHint(labels, key, isAr)
revealForClear({ bands, labels, level, isAr })  // → { keys, names, hints, atLevel } | null
```

`bandTable(null)` and `bandTable([])` return `[]` — that is the flat-grid
contract, and it is what keeps the four non-ladder games (`nback`, `memo-span`,
`raven-matrices`, `spatial-stroop`) on exactly today's code path with no edits.

### 1.2 The prop

Today fourteen games pass `ladder={{ levels: LADDER_LEVELS }}` to `ModeShell`.
It grows, additively:

```jsx
ladder={{ levels: LADDER_LEVELS, bands: LADDER, labels: MECHANIC_LABELS }}
```

All eighteen ladder games render the shared `TrainingLevelGrid` — including the
four monoliths (`cancellation:1781`, `wordle:733`, `speed-match:931`,
`rush-hour:1543`), which pass `bands` / `mechanicLabels` to it directly rather
than through `ladder`. Cancellation's tables are `FQ_LADDER` /
`FQ_MECHANIC_LABELS` in `shared/focusQuestData.js`; rush-hour's are `RH_*`.

⚠ **Never derive `bands` from `levels`.** A shell that guessed would silently
band a non-ladder game's hundred levels into ten unnamed rows.

### 1.3 The level grid — `shared/TrainingScreens.jsx`, `TrainingLevelGrid`

New optional props `bands`, `mechanicLabels`. When `bandTable()` comes back
empty, render today's markup byte-identically.

Banded: one `<section>` per band, with a header carrying the mechanic name and
the range. Three states, keyed off the first band the player has not reached:

- **reached** — mechanic name, or the range alone when `adds` is empty
- **the next one** — name shown, badged "Coming up"
- **beyond** — name masked, 🔒

Preview exactly one band. Showing the whole roadmap at L1 spends the reveal
before it happens; showing none leaves the wall of numbers it is meant to fix.

⚠ Bands with `adds: []` are the majority in several games. Render the range
alone. **Never invent a title** — a header saying "Band 4" is noise, and one
repeating the previous mechanic is a lie.

RTL comes from `TrainingScreenShell`'s existing `dir`; use logical properties
only, and the `L11–20` range string comes from `STR_COMMON` so the AR half is
authored beside the EN half instead of being a template literal in a component.

### 1.4 The unlock moment — `ModeShell.jsx` + `PlayResults.jsx`

Computed in `onLevelResult` (L240), rendered in the `phase === 'result'` block
(L400).

```js
// ⚠ read BEFORE setProg — this is what makes a replay silent
const already = isLadder && (prog.lad || []).includes(level);
const unlocked = (res.won && !already && ladderBands)
  ? unlockedByClearing(ladderBands, level) : [];
```

⚠ **`prog` must join the dependency array.** Without it the callback reads a
stale `lad` and the banner fires on every replay of a band-final level. Nothing
catches this; verify by hand — clear L20, return to the grid, replay L20, expect
no banner.

⚠ Do **not** compute it inside the `setProg` updater. Updaters are
double-invoked under StrictMode.

It fires on clearing the **last level of a band**, so the reward lands on the L20
results screen and the new thing appears at L21 — before it appears, which is the
point.

A new typed `reveal` prop on `PlayResults`, not `extra`. `extra` is the
documented per-game escape hatch and cancellation and mot already use it; a typed
prop is greppable, so the gate can assert 18/18 pass it.

⚠ Do **not** put "next unlock in N levels" on every results screen. It turns a
reward into a nag. `nextUnlock` earns its keep in the grid's preview header.

### 1.5 Copy — `shared/trainingStrings.js`

Four new keys, EN **and** AR in the same edit: `bandRange(a,b)`, `bandNext`,
`bandLocked`, `unlockKicker`. Nothing bilingual typed inline in `ModeShell` or
`TrainingScreens` — twelve games inherit their chrome from there, so a literal in
that file is a wording fork across most of the platform.

### 1.6 Teaching the new mechanic — one sentence, not a coach run

**Do not wire per-band coach lessons in the first pass.** Three hard blockers,
all real:

1. Every coach's `begin()` guard is `mode !== 'free'` — coaches have never run in
   Levels mode. Relaxing that means re-auditing every scored consequence against
   a *persisted* outcome: a guarded tap costs a life in Survival, but an
   unguarded coach tap in Levels can clear or fail a level that gets written to
   localStorage. That is the "the lesson must not be losable" bug with a
   permanent record attached.
2. `useCoachRun` is single-lesson — one id, one pack, `end()` marks that id done
   forever. Per-band means ~66 ids across the platform and a `coachRegistry`
   rewrite, for a feature that has never been on screen once.
3. `shouldRunOnboarding` flags are permanent per id, so a band lesson interrupted
   by the round ending marks itself done having shown two steps.

**Instead**, extend `MECHANIC_LABELS` with an optional third field:

```js
hold3: { en: 'A third category', ar: 'فئة ثالثة',
         hint: { en: 'You now hold three last-words at once.', ar: '…' } },
```

Rendered under the name on the reveal and under the preview band header.
Optional, so pass one is not blocked on authoring 69 sentences — but gated as
"if `hint` exists, both halves must be non-empty" so a half-written one cannot
ship.

If a real lesson is wanted later, the minimum-risk shape is a *separate* hook,
`useBandCoachRun.js`, ids `<game>@band<N>@coach1`, fired only on the first level
of a band and only for the six games that pass `satisfiedFor` to `DomCoach` — an
await step the other twelve cannot satisfy strands the player with Skip and
Escape.

---

## 2. The gate — `npm run audit:reveal`

New script `scripts/audit-reveal.mjs`, not an extension of `audit-curves.mjs`:
that file is about monotonicity and inert bands, this is about labels and render
paths, it must text-parse `.jsx` (which audit-curves never does), and it must
cover `mot`, which audit-curves delegates away.

**Registry** naming all eighteen: `{ key, mod, ladderExport, labelsExport, index,
shape: 'modeshell' | 'owngrid' }`.

**Auto-discovery**, modelled on `audit:coach`'s ledger rule: walk
`domains/*/domain.config.js` for live games, scan each folder for
`export const (\w+_)?LADDER\b`, and fail on any game with a LADDER that is not in
the registry. A new ladder game cannot skip this gate.

**Rules** (1–4 import the real `.js` modules; every one loads in plain Node):

1. **labels-complete** — every `adds` key has a label with non-empty `en` and `ar`
2. **no-orphans** — every label key appears in some band's `adds`. An orphan is
   either a typo'd `adds` (blank grid header) or a removed mechanic whose label
   still promises something the player will never meet
3. **key hygiene** — `adds` holds non-empty strings, no key introduced twice (a
   second "NEW" badge would be a lie), band 0 is non-empty,
   `LADDER_LEVELS === bands.length * BAND_SIZE`
4. **AR is actually Arabic** — `labels[k].ar` matches `/[؀-ۿ]/`. Catches
   the copy-pasted English half, the commonest bilingual failure in this repo
5. **pass-through** (text, because plain Node cannot parse `.jsx`) — every
   `modeshell` game's `ladder={{…}}` carries both `bands:` and `labels:`; every
   `owngrid` game's `<TrainingLevelGrid>` carries both `bands=` and
   `mechanicLabels=` and the file references `revealForClear`; and on the shared
   side, `TrainingLevelGrid`'s parameter list contains both props and
   `PlayResults`' contains `reveal`. A rename on the shared side would otherwise
   turn all eighteen grids flat with no error anywhere.
   ⚠ State in the header what `audit:coach` learned the hard way: **text cannot
   prove the prop is reached.** Open the grid and look.
6. **shared copy resolves** — every `{t.key}` in `ModeShell.jsx`,
   `TrainingScreens.jsx` and `PlayResults.jsx` exists in both `STR_COMMON.en` and
   `.ar`, and the two key sets are identical. `audit:consistency`'s `strings`
   rule reads only `domains/*/games/<key>/**`, so **the shared shell is covered
   by no gate today** — and that is exactly where the new copy lives.

**Self-test — plant against DATA, never by mutating files.** `audit:gamekeys`
produced a false PASS because its plant regex ended `\n}\n` and this tree is
CRLF, so the deletion silently never happened. The fix is not a better regex: do
not touch the working tree at all. Every plant is an in-memory literal, each with
a matching good fixture that must produce zero. Include **one pass-through
fixture written with explicit `\r\n`**, so a parser written against `\n}` fails
its own self-test rather than silently passing on this working tree — the CRLF
trap turned into a permanent assertion instead of a comment.

Wire into `.github/workflows/deploy.yml` and the CLAUDE.md validation paragraph
in the same commit. A gate not in the workflow is decoration.

---

## 3. Per-game mechanic work

The reveal kit makes what exists visible. This is the part that gives it
something worth showing. Ladders **may grow** as features land and must **never
shrink** — strict in-order unlock means shrinking takes earned levels away.

Every new band must pass `audit:curves` (non-empty `adds`, or a registered
`structural` lever that moves), `audit:pacing` (the ms-per-stimulus floor a human
actually meets — **time is not a difficulty lever**), and its own game's gate.

### Tier A — one named mechanic across the whole ladder

- **task-switch** (50 lv, `pSwitch` only). Candidates: a third task rule ·
  congruency (a stimulus that affords both answers) · a cue that must itself be
  read · bivalent vs univalent response sets · no cue, infer from position.
- **story-grid** (60 lv, `watch` only). Candidates: a distractor scene that never
  happened · source memory (which of two storytellers) · two interleaved stories
  · a scene shown twice · order questions spanning scenes.
- **paired-associates** (70 lv, `bind` only). Candidates: interference pairs (A–B
  then A–C) · reverse cued recall (given B, find A) · a decoy box · a filler task
  before the test.

### Tier B — a count knob wearing a different name each band

- **mot** — occlusion (targets pass behind a cloud) · identity swap · a
  distractor that briefly flashes the target colour · "which one did you lose"
- **train-switch** — a car that changes colour mid-route · a blocked lane · a
  priority car · a car that must be held
- **speed-match** — a rule inversion band ("match = different") · a lure card · a
  timed no-go
- **keep-track** — a category that must be ignored · a mid-stream rule change ·
  "second-to-last" instead of last · the category named only at the end
- **mirror-world** — one-axis mirror · rotation rather than mirror · a cue
  naming which mapping is live

### Tier C — real mechanics already, needs one or two more

- **math-gates** — negatives · order of operations · a "wrong gate" no-go
- **wordle** — blocked tiles · a forbidden letter · a required letter
- **synonyms** — antonym as a fourth kind · a distractor sharing a root
- **trivia** — a confidence wager scored on calibration (this is the app's own
  stated unit — see `project_education_identity`) · a two-step question
- **sort-shift** — a rule that changes mid-round · a card fitting two rules

### Tier D — path ladders, need authored content

- **cancel-task** — moving targets · a target that changes shape · a shrinking
  board. ⚠ **Do not reintroduce colour conjunction** — retired deliberately
  2026-08-09.
- **rush-hour** — new piece types (wall, one-way, three-long vertical). Needs new
  content **and** a `validate:rh` re-solve of every reference puzzle.

### Tier E — done

- **intercept** (rebuilt 2026-09-05: turret · missile · mortar), **gatekeeper**,
  **detective**.

⚠ **Every new mechanic is nine wiring spots, not one** — see CLAUDE.md. And a
mechanic named in `adds` that the engine never switches on at that band is
undetectable by any gate except intercept's band-edge drift rule. Have
`audit:reveal` **print** which games have such a check and which do not, the way
`audit-curves` prints its ungated list. Track the gap; do not pretend it is
closed.

---

## 4. Order

1. `ladderReveal.js` + `audit:reveal` rules 1–4 and 6 + the full self-test.
   Verified green against the tree as it stands, so it lands with no product
   change and cannot rot.
2. The grid, the CSS, the four `STR_COMMON` keys — shipped with `bands` passed by
   **one** game first. Use `keep-track`: five bands, three mechanics, two empty
   `adds`, so it exercises every header state. Look at it in EN and AR.
3. Roll the prop through the other thirteen ModeShell call sites.
4. `PlayResults.reveal` + `ModeShell.onLevelResult`.
5. The four own-grid games.
6. Enable rule 5 **in the same commit as step 5**. A gate that fails on `main`
   for a day gets muted.
7. Then the per-game mechanics, Tier A first.

## 5. Known silent failures

- A game passing `labels` but not `bands` → the grid quietly goes flat. Rule 5
  requires both.
- `mechanicLabels` renamed on the shared side → all eighteen grids flat, no
  error. The shared-side parameter assertion catches it.
- `prog` missing from `onLevelResult` deps → the banner fires on every replay.
  **Nothing catches this.** Verify by hand.
- **Migrated players skip reveals.** `isUnlocked` honours `reached` from
  `migrateToLadder`, so a converted player is unlocked to L21 without ever
  *clearing* L20 and never sees that band's banner. Correct — marking a level ✓
  they never played is the lie the migration deliberately avoids — and the grid's
  preview header is what covers them.
- A stale sentence in a `hint` resolves perfectly and states something false. No
  gate can see it; same family as the `٣ صعوبات` trap in CLAUDE.md.
