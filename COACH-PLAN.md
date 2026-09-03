# COACH-PLAN.md — Dr Kawkab teaches all 18 training games

**Goal (2026-09-03, from the project owner):** every live training game gets a
live-board coach tutorial, the kind `cancel-task` has. Not a slide deck. Phased.

**Status: ALL PHASES DONE (2026-09-03). 18/18 live games have a live-board
coach; `COACH_WAITING` is empty and `audit:coach` guards it.**

**Confirmed working by the project owner on 2026-09-03**, after deploy. That
closes the one thing no gate could check — bubble placement, whether the hand
points at the right thing, and whether a sentence is true at level 1.

Every coach is **Survival-only**, matching cancellation. To see one again: clear
`mm_tutorial_prefs_v2` in localStorage, or press "How to play" on the game's hub,
which arms the lesson and drops into Survival.

### The claims pass (2026-09-03)

65 English and 65 Arabic steps are a large amount of user-facing *scientific*
copy, in a product whose Assessment is parked behind "Coming Soon" precisely
because unfinished instruments must not hand people cognitive conclusions. So the
scripts were swept for benefit language in both languages.

**One line needed changing**, in `task-switch`: "that pause … gets shorter."
Switch cost genuinely does shrink with practice **on the task**, which is what
was meant — but unscoped, the sentence reads as a promise that your flexibility
improves in life. That is the transfer claim `SCI-01` exists to keep out and the
FTC's actual complaint against Lumosity. It now says "with practice at this
task", in both languages.

⚠️ **The review board's claims detector DOES cover coach scripts** — verified, not
assumed, by planting an FTC-style outcome claim in `scripts/mot.js` and watching
`SCI-01` flip to NEEDS WORK. The scripts sit outside `DATA_PATHS`, so `grepUi`
reads them as the product copy they are. Do not move them into a data path.

---

## 0. THE DEPTH PASS (2026-09-03, second sitting) — 65 steps → 144

**Asked for by the project owner:** *"make them longer, more instruction … make
sure that the tutorial is well structured and strong and will teach the user
well."* Every lesson was rewritten onto one spine, and the pointing kit was
rebuilt underneath them.

### 0a. The spine — eight steps, ONE IDEA EACH

The old lessons were not wrong, they were **compressed**. Their weakness was a
single shape repeated eighteen times: the construct — the genuinely valuable,
counter-intuitive thing — arrived as the *third clause of a five-sentence
paragraph*, next to the controls and the sign-off. Detective packed the entire
assume-and-check method into one step; Mirror World's washout, its reassurance
and its explanation shared a step; Speed Match's last step carried the time
bank, the refill rule, the rhythm advice and the goodbye.

That is the failure mode instructional design is loudest about: **stagger the
concepts, one at a time, and give the learner somewhere to put each one.** So:

| # | Step | Gagné's event |
|---|---|---|
| 1 | Orient — who I am, what this board is | gain attention |
| 2 | The goal — what winning looks like | inform the objective |
| 3 | The object / the control — point at the thing, name the gesture | present the content |
| 4 | **Do it now** — on the live board, scored | elicit performance |
| 5 | The construct — the counter-intuitive rule | learning guidance |
| 6 | The named error — the specific wrong move | feedback |
| 7 | What it costs — hearts, clock, errors; and that reaching your ceiling IS the measurement | assess |
| 8 | How it grows, and one habit to take with you | retention |

Not every game fills all eight identically — a game with no `satisfiedFor`
predicate cannot have step 4 at all (see below) — but every game now names its
goal, its control, its error and its progression, which most of them did not.

⚠️ **STEPS 7 AND 8 ARE THE ONES THAT WERE MISSING EVERYWHERE.** Almost no lesson
said what a wrong answer costs, and almost none said what changes as you climb.
Both were left to trial and error, in an app whose whole posture is that
reaching your limit is the *point* rather than a failure. Trivia now says
outright "the run is MEANT to end somewhere you cannot reach"; mot says "it is
built to keep going until it finds the number where you start dropping them".

### 0b. Guided practice is limited by `satisfiedFor`, not by the script

Only **6 of 18** games pass a `satisfiedFor` predicate to `DomCoach`
(`sort-shift`, `synonyms`, `trivia`, `keep-track`, `gatekeeper`, `speed-match`),
plus cancellation's bespoke coach. Those seven have a real step 4. The other
eleven deliberately do **not** — an await step with no reachable condition
strands the player in a first-run tutorial with only Skip and Escape, which
`DomCoach`'s own header warns about. Wiring the remaining eleven is the obvious
next increment and was explicitly deferred by the owner.

### 0c. What the measurement pass found — and why a constant could never work

Measured on a real page (headless Chrome over CDP, `getBoundingClientRect` on
the hand plus `elementFromPoint` under the fingertip), at 1366×577 and 390×780:

| game / anchor | target | hand | ratio |
|---|---|---|---|
| `story-grid` → `nav` | **11×11 px** | 54 px | **4.91** |
| `cancel-task` → a tile | 57×57 px | 54 px | **0.95** |
| `speed-match` → `pad` | 520×84 px | 54 px | **0.10** |
| `mot` → `board` | 698×449 px | 54 px | **0.08** |

`TutorialHand` was a flat **54 px** (44 px under a 420 px viewport). Both numbers
were measured once against a cancellation tile and then worn by all eighteen
games across a **49× spread** of target sizes. A viewport breakpoint cannot
address any of it — story-grid's 11 px chevron and cancellation's 57 px tile were
on the *same* 1366 px desktop.

Three distinct failure modes fell out of that one constant:

1. **Target much smaller than the hand** → the pointer swamps what it points at.
2. **Target the same size** → the hand covers it *and* its neighbour, on a board
   whose whole point is comparing a shape against its neighbours.
3. **Target is a whole container** → the hand is parked in the middle of a big
   thing, indicating nothing in particular.

(1) and (2) are a **kit** problem: the anchor now carries `tw`/`th` and the hand
sizes itself at `0.62 ×` the target, clamped 30–52 px. Cancellation went
0.95 → **0.61**, and its drawn height 87 → 57 px, so it stopped covering the tile
below. (3) is a **script** problem: `math-gates` pointed all three of its steps
at `[data-coach="board"]`, so the hand never moved for the entire lesson. Steps
about pace, cost or progression now carry `point: null`, which parks the hand
honestly instead of pretending to point.

### 0d. Four kit bugs the measurement exposed

- ⚠️ **Every transform pivoted on the image centre, so the fingertip drifted.**
  The float was `translateY(-5px) rotate(-2deg)`, walking the tip ~6 px — a tenth
  of a cancellation tile, half of story-grid's chevron. `transform-origin` is now
  the measured fingertip (`40.8% 1.2%`), so rotation contributes **zero** drift
  and the float/tap animations became rotational rather than translational.
- ⚠️ **The bubble cleared the hand with a percentage of the stage.**
  `anchor.y + 14%` is 63 px on mot's 449 px board, against a hand hanging 87 px
  below its fingertip — measured result: the bubble sat *on* the hand in both
  `mot` and `speed-match`. It now clears it in the hand's own pixels via
  `handHeightFor()`.
- ⚠️ **Kawkab was pinned to one corner regardless of where the hand went.** The
  original note reasoned that inline-end is safe because the hand "favours the
  board's left/top where scanning tends to start" — true of where scanning
  starts, false of where the hand ends up. He now flips corners when the action
  is on his side. ⚠️ The test is on the **logical** inline-end fraction, mirrored
  under RTL: written in physical `x` it would send him *toward* the hand in one
  of the two languages. ⚠️ And it must test the **bubble**, not only the hand —
  the first version flipped on the hand's `y` and immediately collided with the
  bubble, because a high anchor puts the bubble on the *below-hand* branch.
- ⚠️ **`useDomAnchor` only ever searched inside the box it measures against**, so
  a step pointing at chrome resolved to null: no hand, no error, no warning. It
  now takes an explicit `scope: 'document'`. Opt-in rather than a fallback,
  because this app keeps every tab mounted under `display: none` and a silently
  widening selector would find another screen's copy of the same element.

### 0e. A wrong instruction, found only by looking at both widths

Cancellation's opening line was *"the shape you are hunting is **up in the
bar**"* — with **no hand pointing at anything**. On a phone the HUD is a bar
across the top; on a 1366 px desktop it is a panel down the **left** side. The
one spatial instruction in the lesson was wrong on half the devices, and nothing
pointed anywhere to correct it. `PlayHud` now tags the goal chip
`data-coach="goal"`, cancellation's coach can point at chrome, and the copy says
nothing about where the chip lives.

### 0f. ⚠ THREE GAMES HAD NO TUTORIAL AT ALL, AND `audit:coach` PASSED THEM

Found by driving the real app rather than reading it: enter each game's Survival
and ask whether `.ct-coach-bubble` ever appears. Three never did.

| game | why it could never run |
|---|---|
| **Word Maze** | `<DomCoach>` was mounted inside the `round.mode === 'level'` branch, while the effect that opens it requires `round.mode === 'free'`. **Mutually exclusive.** All three `data-coach` anchors were in that branch too. |
| **Spaceship** | `TrainSwitchEngine` — a complete, correctly-wired coach host — is referenced **nowhere** (eslint reports it unused). ModeShell renders `CarPark3DProto`, whose call site listed props explicitly and dropped `p.coach`. |
| **Math Gates** | `MathGatesEngine` is imported only by `puzzles/games/groupwar/catalog.js`. The hub renders `MathGatesBoard2D`, which already *received* `coach` via `{...p}` and never read it. |

⚠️ **THE GATE'S BLIND SPOT IS REACHABILITY.** Rule 4 asserts a registered coach is
*rendered* by grepping the game's source for a `<DomCoach>` mount. It finds one —
in a function nothing calls, or in a JSX branch that never runs during the only
mode the coach opens in. **A grep can see that the mount exists; it cannot see
that the mount is reached.** That is one level deeper than static text, and it is
the same shape as the bug rule 4 was written to catch in the first place.

⚠️ **A WEAK STATIC DETECTOR WOULD BE WORSE THAN NONE HERE**, so none was added: a
"is this function referenced?" check passes Math Gates (the party game imports
it), and a same-component check passes Word Maze (both halves are in one file).
The honest tool is the live smoke test — enter Survival, assert the bubble
appears — which needs a browser and therefore cannot block CI. Run it by hand
after touching any coach wiring.

⚠️ **AND THE COACH MUST NOT GO IN `canvasChildren`.** `.c3d-canvas` carries
`aria-hidden="true"`, and aria-hidden cannot be undone by a descendant — the
bubble carries the ENTIRE lesson (hand and Kawkab are deliberately decorative),
so mounting there hands a screen-reader user eight steps of silence. Use
`coachSlot` + `rootRef`, which render last inside `.c3d-root`: the same
`inset: 0` rectangle, outside the hidden subtree. `paired-associates` was already
doing this correctly and is the pattern to copy.

Fixed in all three; verified live, **18/18 coaches open at 1366×577 and 390×780**,
with lives and score untouched afterwards in both games that freeze a simulation.

⚠️ **The two dead engines are now marked, not deleted.** Both still contain a
correct-looking coach mount, which is exactly what misled the gate — each carries
a header saying nothing renders it and pointing at the real host.

### 0g. Ids bumped to `@coach2`

All eighteen. A rewritten lesson under the old id reaches fresh installs **only**
— see the standing warning in `coachRegistry.js`. `audit:coach`: 18/18,
**144 steps** (was 65). `review:since`: no change, so no new benefit claim.

---

## 1. Where we actually start

Not "cancellation only". Three tiers, and one of them is broken.

| Tier | Games | What a player gets today |
|---|---|---|
| **Live-board coach** | `cancel-task` | Dr Kawkab on the real Survival board, hand on a real tile, clock held, player clears it themselves |
| **3-slide carousel** | `mot` `train-switch` `speed-match` `math-gates` `intercept` `story-grid` `paired-associates` `wordle` `synonyms` `rush-hour` `detective` (11) | A pre-play slide deck, EN+AR, then "You're ready!" |
| **Nothing** | `keep-track` `trivia` `gatekeeper` `mirror-world` `task-switch` `sort-shift` (6) | No onboarding **and a dead "How to play" button** |

### 1a. The live bug this plan inherits

Those six have no pack in `trainingTutorialSteps.jsx:109`. So:

```
getTrainingDiagramSteps(id) → null        (no pack for the id)
  → useTrainingTutorial: steps = []       (useTrainingTutorial.js:7)
  → TutorialCarousel: return null         (TutorialCarousel.jsx:51, total === 0)
```

…but `ModeShell.jsx:294` passes `onReplayTutorial` **unconditionally** — it is
always a truthy `useCallback` — and `TrainingChrome.jsx:141` renders the button
whenever that prop exists. Press it: nothing happens. No error, no warning, no
boundary. Same silent-failure family as the blank `{t.cont}` button and the
`getLazyGame` → `return null` blocks.

The Gate and Mirror World are among the newest games in the app and neither has
ever explained itself to anybody.

### 1b. Dead tutorial content already in the tree

- `STEPS['cancel-task']` is **unreachable**: cancellation calls
  `useTrainingTutorial('cancel-task@coach1')` (index.jsx:638) and the pack is
  keyed `'cancel-task'`. Already noted in the code comment; harmless, but it is
  not a tutorial anyone can reach.
- 8 packs belong to benched/unslotted games: `wisconsin` `brixton`
  `trail-making` `memo-span` `nback` `odd-one-out` `raven-matrices`
  `spatial-stroop`. ⚠️ **Do not delete `memo-span`, `nback` or `spatial-stroop`** —
  those three are still run by the Assessment and the Daily Workout (see
  `audit:gamekeys`). Leave all 8 alone; they cost nothing.

---

## 2. What the reference actually is

`CancelTaskCoach.jsx` (304 lines) + ~8 integration points in a 2381-line host.
Read it before building anything. It decomposes cleanly into three parts:

**(a) Generic — 100% reusable, ~200 of its 304 lines.** Hand + Kawkab sprite,
the bubble, step advance, the Skip/Next row, `aria-live` + `role="dialog"`,
Escape-to-leave, the stranded-step fallback, and the bubble placement maths
(flip below the hand in the top half; clamp horizontally in the bubble's *own*
width via `clamp()`; floor at `--fq-hud-reserve` so it can never cover the
back/pause buttons). **Every one of those clauses is a bug that was already
paid for.** Do not re-derive them per game.

**(b) The pointing contract — one function.** The coach asks "where on screen is
the thing this step is about?" and gets back `{x, y}` as fractions of the
overlay's own box:

```js
boardApiRef.current.cellScreenPos(cellIdx)   // → { x: 0.42, y: 0.63 }
```

It re-reads that every frame in a rAF, because pieces bob and the board reflows.
This is the only part that differs per game — see §3.

**(c) The host's job — the expensive part.** `coachOpen` state, a
`coachOpenRef` read by stable callbacks, and a guard on **every** consequence.

---

## 3. The architecture that makes this tractable

The board survey splits 18 games two ways, and the split is the plan:

| Family | Games | How the hand finds its target |
|---|---|---|
| **DOM board** (12) | speed-match, keep-track, task-switch, sort-shift, trivia, synonyms, paired-associates, gatekeeper, detective, story-grid, wordle, rush-hour | The pointable thing **is a DOM node**. Tag it `data-coach="target"`, resolve with `getBoundingClientRect()` against the overlay container. **No per-game geometry code at all.** |
| **Canvas board** (6) | cancel-task ✅, mot, train-switch, mirror-world, math-gates, intercept | Nothing in the DOM to measure. Each needs a `cellScreenPos`-style API exposed from its own draw geometry, as cancellation already does. |

That is why this is phases and not weeks of identical work: for two-thirds of the
platform, "expose a pointing API" collapses into "add an attribute to a button".

### 3a. New shared modules

```
shared/tutorials/coach/
├── CoachLayer.jsx      part (a), lifted from CancelTaskCoach with zero behaviour change
├── useCoachRun.js      arm / open / replay / persist; owns coachOpen + coachOpenRef
├── domAnchor.js        useDomAnchor(containerRef, selector) → {x,y} fractions, rAF-tracked
└── scripts/<game>.js   per-game step data, EN + AR
```

`CoachLayer` takes `steps`, a `resolve(step) → {x,y}|null`, and `onFinish`/`onSkip`.
`domAnchor` supplies `resolve` for the 12 DOM games; a canvas game supplies its
own, exactly like today.

### 3b. The one seam that reaches all 17 ModeShell games

`ModeShell.jsx:248` funnels every game's play view through a single call:

```js
renderEngine({ mode, diff, level, seed, attempt, onResult, onExit })
```

Add `coach` to that props bag. ModeShell then owns arming, replay ("How to play"
→ arm + drop into Survival), and the persistence flag for all 17 games at once,
and each game is left with only two jobs: **mount the overlay** and **guard its
own consequences**. `cancel-task` is not a ModeShell game and keeps its own
wiring — it is already done and stays the reference.

---

## 4. Per-game work

Size is the *host integration*, not the script. **S** = mount + tag nodes + 2–3
guards. **M** = as S plus a real decision about what a "step" points at on a
board with phases. **L** = the host is a monolith or the board has no stable
pointable element.

### Phase 0 — the seam and the floor ✅ DONE 2026-09-03

| Task | Landed as |
|---|---|
| Lift the generic half out of `CancelTaskCoach` | `coach/CoachLayer.jsx` (hand, Kawkab, bubble maths, ARIA, Escape, stranded fallback) + `coach/anchors.js` (`useCanvasAnchor`, `useDomAnchor`, `useAwaitAdvance`) |
| Arm / replay / persist, shared | `coach/useCoachRun.js` — cancellation now uses it too, so it is exercised, not just written |
| The step script, where a gate can read it | `coach/scripts/cancel-task.js` — EN and AR **on the same step**, so a length mismatch is inexpressible |
| The ledger | `coach/coachRegistry.js` — `COACH_IDS` + `COACH_WAITING`, one place both ModeShell and the gate read |
| Add `coach` to the `renderEngine` props bag | `ModeShell.jsx` — reaches all 17 ModeShell games; not passed to Pass n Play (a tutorial in a multiplayer round teaches one player while the others wait) |
| **Stop the six dead buttons** | `ModeShell.jsx` — `onReplayTutorial` is now `undefined` unless the game has a coach or a non-empty carousel pack |
| Suppress the carousel where a coach exists | `ModeShell.jsx` — otherwise a converted game opens a slide deck *and* a live lesson on the same first visit |
| `audit:coach` gate (§6) | `scripts/audit-coach.mjs`, wired into `deploy.yml` before `audit:design` |

**Verified**: all 12 CI gates + `audit:consistency` pass, build clean, lint clean
(3 pre-existing warnings in cancellation, none new). Each of the gate's three
rules was checked by planting the real bug in the real file and confirming the
plant landed before trusting the failure — `@coachN` stripped, an Arabic line
emptied, a live game removed from the ledger. All three fired; all three files
were then diffed back to identical.

⚠️ On the dead button: the honest interim is to **hide it**, not to write six
throwaway carousel packs. A button that does nothing is worse than an absent one,
and every pack written now is deleted in Phase 1–3 anyway. If you would rather
the six games say *something* while they wait their turn, write the packs — but
that is a deliberate ~1 session of disposable work, not a prerequisite.

### What Phases 1–3 actually taught the codebase

Three things came out of building all seventeen that were not in the original plan:

1. **`DomCoach` replaced the per-game coach component.** After writing three by
   hand they were the same sixty lines with a different import, so the whole
   thing is now `shared/tutorials/coach/DomCoach.jsx` — a game supplies its
   script, a `stageRef`, and (only if it has an await step) a `satisfiedFor`
   predicate. Twelve of the eighteen use it unchanged. Only cancellation keeps a
   bespoke component, because pointing into a canvas needs its own geometry.

2. **"Hold the round" and "run before the round" are both valid, and the choice
   is about how many consequences are live.** Cancellation can teach mid-round
   because holding one clock suspends everything it scores. Task Switch has five
   live consequences driven by a self-rescheduling chain — guarding five and
   hoping is how cancellation once shipped a losable tutorial — so its lesson
   runs on the real board *before* the first trial and nothing is running at all.
   `mot`, `paired-associates` and `task-switch` take that route; the rest hold.

3. **`audit:coach` gained a fourth rule after it missed a real bug.** Every check
   passed for `mot` while its `<DomCoach>` mount had silently failed to land: the
   script was perfect, the id versioned, the ledger agreed, and the lesson could
   never appear. The gate now asserts a registered coach is actually *rendered*,
   and that rule carries its own planted-bug self-test. Same family as
   `audit:gamekeys`, one level up.

⚠️ **The taught action is a REAL scored action wherever the game can afford it** —
sort-shift's submit, trivia's answer, Word Links' choice, speed-match's key, The
Gate's probe. That follows cancellation, whose taught tap has always been real.
The one exception is **The Gate, where the taught probe is free**: probes are a
budget and `validate:gatekeeper` only guarantees decidability *within* it, so
charging for a probe the tutorial demanded could push that gate below solvable —
the exact failure the lesson exists to prevent.

### Phase 1 — DOM boards, single stable surface (7 games)

The board is one grid or one row of buttons that stays put for the whole trial.
`domAnchor` does all the pointing. This is the phase that proves the layer.

| Game | Size | What the lesson must teach (the construct, **not** the controls) |
|---|---|---|
| `keep-track` | S | Only the **latest** item per category counts — earlier ones are meant to be dropped. Updating, not hoarding. |
| `task-switch` | S | The cue changes the question. The cost is on the trial **after** a switch — that is the thing being measured. |
| `sort-shift` | S | The same six cards are correct under **more than one** rule. Point at a valid grouping the player did not pick. |
| `speed-match` | M | Consistency beats bursts. It is a monolith (1140 lines) but the board is two cards. |
| `synonyms` | S | The link is semantic, not spelling. |
| `trivia` | S | Retrieval, and it is fine not to know. |
| `paired-associates` | M | The pair is a **story**, not two pictures — teach the elaboration, since that is the strategy the test rewards. |

### Phase 2 — DOM boards, stateful or multi-phase (5 games)

The board changes shape mid-round (a study phase then a test phase, a drag, a
grid that fills in), so a step has to name *when* as well as *where*.

| Game | Size | What the lesson must teach |
|---|---|---|
| `gatekeeper` (The Gate) | M | **The highest-value coach in this plan.** Wason's whole finding is that people test cases they expect to PASS. The lesson must walk the player into spending a probe on a traveller they believe will be rejected, and show that it taught more. Nothing else in the app teaches disconfirmation. |
| `detective` | M | The rule is always true; the suspects may not be. And the jail **is the answer box** — the drag is the answer, the tap is only a note. |
| `story-grid` (Story Time) | M | Watch for **what happens**, not the pictures — Kawkab asks about beats, order and company. Two phases, so two anchors. |
| `wordle` (Word Maze) | L | 1122 lines / 13 files; the board is a path traced across tiles. Pointing at a *path* is not pointing at a cell. |
| `rush-hour` (Block Escape) | L | 2141 lines, monolith, its own worker. Teach look-ahead: the first move is usually the piece that is **not** blocking you. |

### Phase 3 — canvas boards (5 games)

Each needs a `cellScreenPos` equivalent published from its own draw loop, on the
model cancellation already sets. Do these last: the pointing API is real work and
the layer should be settled first.

| Game | Size | What the lesson must teach |
|---|---|---|
| `mot` | M | Do not fixate one dot — spread attention. Capacity is the measure. |
| `train-switch` (Car Park) | M | Divided attention: two things need you at once, on purpose. |
| `math-gates` | M | Pick the gate, do not solve both sides. |
| `intercept` | L | **Three constructs in one game**, and the coach must keep them apart: strike inside the reach (RT), **leave the no-go colour** (inhibition), strike where you believe it *will* be under the canopy (prediction). ⚠️ The status swatch on this screen was once inverted — verify the lesson against the live board, not the source. |
| `mirror-world` | L | The aftereffect is the point: it feels wrong *after* the mirror goes away, and the washout block is measuring exactly that. Hardest thing on this list to say in one bubble. |

---

## 5. The traps — every one of these has already cost this repo real time

Read before writing a single coach.

1. **⚠️ VERSION THE ONBOARDING FLAG.** `shouldRunOnboarding` keys off the game id
   in `mm_tutorial_prefs_v2`. Every one of the 11 carousel games has already
   written `{skipped:true}` or `{completed:true}` under its plain id — so a coach
   registered under that same id **will never run for any existing player**, only
   fresh installs, silently. Each game moves to `'<id>@coach1'`, exactly as
   `cancel-task@coach1` did. **This is the single most likely way to ship all 18
   coaches and have nobody see 17 of them.**

2. **⚠️ GUARD EVERY CONSEQUENCE, NOT ONE.** Cancellation guarded the time penalty
   and still shipped a losable lesson: the error tally and the round-error cap
   were live, Survival has one life, and the coach's own crossed-out hand invited
   error 1 of 2. Any round end fires `endCoach` → `markOnboardingSkipped`, marking
   the lesson done having never shown its last two steps. Per game, enumerate:
   the clock, the wrong-answer penalty, the error tally, the error cap, the
   auto-win, lives, `trialLog`, and the rating award.

3. **⚠️ TUTORIAL TAPS STAY OUT OF `trialLog` AND OUT OF THE RATING.** A guided tap
   with unlimited reading time is not a measurement. Intercept already proved the
   adjacent version of this: anything that alters difficulty while feeding
   `awardFreeRun` makes two players with identical timing score differently.

4. **⚠️ THE STRING CHANGE IS TWO EDITS.** Every step is EN **and** AR, ~40 lines
   apart. `audit:consistency`'s `strings` rule proves a key *resolves*, never that
   it is true. After writing a script, grep the Arabic half.

5. **⚠️ POINTER-EVENTS.** The overlay is `pointer-events: none` with the bubble
   opting back in. On the seven 3D proto games, `c3dProto.css` hands input back
   through a hand-written **class allowlist** that has broken three times. List
   the buttons, never a chrome root. And only real hit-testing catches it —
   `dispatchEvent()` calls the handler directly and passes while a human cannot
   press the button. Use `document.elementFromPoint()`.

6. **⚠️ LOOK AT THE BUBBLE ON A PHONE AND AT THE TOP OF THE BOARD.** Both bubble
   clipping bugs (vertical and horizontal) rendered perfectly and landed
   off-screen. No gate can see that.

7. **⚠️ KEEP A NON-DRAG, NON-POINTER ROUTE.** Detective's cell is a tap-through
   picker as well as a drop target, deliberately — a keyboard has no pointer that
   can press, move and hold. Mirror World already shipped 156 unpassable levels
   through its accessible control. A coach step that can only be advanced by a
   drag locks the same people out.

8. **⚠️ THE LESSON MUST TEACH THE CONSTRUCT.** "Find the shape, tap it, clear them
   all" is what the *old* cancellation tutorial said, and none of it is what the
   game measures. Every script in §4 names a construct; if a step does not serve
   it, cut the step.

---

## 6. The gate — `npm run audit:coach`

Written **before** the coaches, on the `validate:intercept` precedent (that gate
killed four model bugs before a pixel was drawn). Node-only, so scripts live in
`.js`, not `.jsx`. Asserts:

- Every game in `ACTIVE_RATED_GAME_KEYS` has a coach script, or is on an explicit
  dated waiting list naming its phase. **The list must shrink to empty.**
- Every script has EN and AR, equal step counts, no empty `speech`.
- Every onboarding id is `@coachN`-suffixed — catches trap 1 mechanically.
- No script's last step is `awaitTap` with no fallback (the stranded-player bug).
- A **planted-bug self-test on every run**: strip one AR step, drop one `@coachN`
  suffix; the gate must fail on both. ⚠️ This tree is **CRLF** — `audit:gamekeys`
  once produced a false PASS because its plant silently never landed. Verify the
  plant landed before trusting the detector.

What no gate can check, and must be done by looking: bubble placement, whether
the hand points at the right thing, and whether the sentence is true at level 1.

---

## 7. Order of work

```
Phase 0  seam + shared layer + hide the dead buttons + audit:coach
Phase 1  7 DOM games, single-surface        ← proves the layer; stop and review after the first two
Phase 2  5 DOM games, stateful              ← The Gate first, it is worth the most
Phase 3  5 canvas games                     ← mirror-world last, it is the hardest lesson to write
```

Phase 1's first two games (`keep-track`, `task-switch`) are the real test of §3.
If `domAnchor` does not carry both without per-game geometry, the architecture is
wrong and the remaining ten estimates are wrong with it — **re-plan there, not at
the end.**
