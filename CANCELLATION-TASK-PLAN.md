# CANCELLATION TASK PLAN

**The scientific rebuild of the Cancellation game (`cancel-task`).**
Opened 2026-09-19. Multi-session: work through the phases in order, tick the boxes, leave the notes.

> **If you are picking this up cold, read §1 and §2 (10 minutes), then find the first unticked box in §5.**
> Everything you need is in this file. The long-form evidence is in `review/cancellation-science-2026-09-19/` — `01-AUDIT.md` (what is wrong, with file:line), `02-SCIENCE.md` (the literature, with URLs), `03-SPEC.md` (the first draft of this plan). You do not need to read them to continue, but cite them rather than re-deriving.

---

## 0. Progress

| Phase | What | Status |
|---|---|---|
| **1** | Measurement truth | ✅ **DONE 2026-09-19** — all 8 items, gates green, verified in a browser |
| **2** | Surface the second factor (search organisation) | ✅ **DONE 2026-09-19** — all 4 items, gates green, verified in a browser |
| **3** | The difficulty model + its gates | ✅ **DONE 2026-09-19** — 3.1 · 3.2 · 3.3 · 3.4 · 3.8 built and shipped. ⚠ **3.5 / 3.6 / 3.7 are deliberately NOT built** — each changes what a player meets, which the "hold the current feel" instruction ruled out, so they are parked as decisions in **§9**. Phase 3 is closed for building; it is not closed for deciding. |
| **4** | Elo rating | ⬜ not started — **start here** |
| **5** | Practice-corrected reliability | ⬜ not started |

**Shipped:** phases 1–3 deployed to production on 2026-09-19.

**Owner decisions already made — do not relitigate:**
- All five phases are in scope (owner, 2026-09-19).
- **Phase 3 recalibrates to hold the current feel** (owner, 2026-09-19): fit the split model so it reproduces ≈700 ms at the current reference board. Today's levels must play the same. The model becomes honest; the difficulty a player *meets* does not move until someone deliberately moves it.

**Session log** — append one line per session so the next reader knows what happened.

| Date | Session did | Left open |
|---|---|---|
| 2026-09-19 | Audit (4 agents), research, this plan | Phase 1 starting |
| 2026-09-19 | **Phase 3 part done.** Honest split Fitts+search model built, calibrated and documented; slope now driven by interference; `cancel-task` added to `audit:pacing`; the 3 s penalty named and reported. `audit:fq` gained a non-blocking honest-model report. All gates green, clean build. | **§9 — four decisions.** The honest model says 13 of 330 waves sit under 1.0× expert at L46–L60. 3.5/3.6/3.7 all change the board and stopped at the "hold the feel" line. |
| 2026-09-19 | **Phase 2 complete.** New `shared/searchMetrics.js`; metrics computed on the live path in Levels and Survival; `CxSearchBlock` on both results screens. All gates green, clean build. 20/20 in `verify-phase2.mjs`; block confirmed on screen (`review/cancellation-science-2026-09-19/shots/09-survival-results.png`). | Phase 3. **Noticed and NOT chased: the app background rendered flat beige in the headless dev run** (both level and survival screenshots). Could be the headless/dev environment rather than a regression — unverified either way, worth one check before blaming anything. |
| 2026-09-19 | **Phase 1 complete.** All 8 items. `lint` 0 errors, `audit:fq`/`curves`/`pacing`/`coach`/`gamekeys`/`design` pass, `audit:consistency` cancel-task 19/22 · 8/8 depth · 6/6 look · strings 18/18, clean production build. Maths verified by importing the shipping module (`scratchpad/verify-phase1.mjs`, 13/13); science panel verified **on screen** via headless CDP. | Phase 2. **New finding: the science panel's own title is "Why this trains your brain" — see §8.** Not yet verified on screen: the level-results tiles and the world-completion review (both need a played round). |

---

## 1. Why this exists — the three-paragraph version

The Cancellation game's **difficulty model** is better than most of its genre: its levers map onto real visual-search parameters (set size, target–distractor similarity, distractor heterogeneity, eccentricity/crowding, VWM load), and set size deliberately does not rescale with viewport. The **measurement model** was built to a much lower standard, and it is the one the player reads.

The game's own good science — d′ with the correct Hautus (1995) log-linear correction, Center of Cancellation, three published search-organisation indices citing Dalmaijer et al. (2015) — is implemented, correct, and **unreachable**, because its only caller is the assessment that `ComicsScreen.jsx:134` replaces with `AssessmentComingSoon`. Every live screen instead reports precision as "Accuracy", a mixed onset/inter-response average as "Avg RT", and a Rate-Correct-shaped arcade number as "Efficiency".

Two numbers carry most of the risk. **`found / (found + errors)`**, labelled "Accuracy" in both languages — so omissions, the dependent variable cancellation tasks exist to measure, enter no number the player sees, and a do-nothing round reports 100%. And **700 ms**, the expert-model baseline, whose own comment cites a rate that works out to **943 ms** — the entire feasibility margin at the top of the ladder is that 26% gap.

---

## 2. The five things that must stay true

Read these before changing anything. Each one is a rule the evidence forces, not a preference.

### 2.1 The game reports TWO factors, not one

Mark et al. (2004): omissions and search organisation are **statistically independent** (rₛ = −0.14, n.s.). Dalmaijer et al. (N = 523 healthy adults): age predicts ~10% of variance in task *duration* at 0.59 s/year and has **minimal effect on the organisation measures**.

A single score destroys real signal, and the half currently discarded is the half that barely ages. Report **Performance** (how completely/quickly cleared) and **Search** (how systematically searched) separately.

### 2.2 Error counts may NEVER be shown as an individual change

- d2 manual: *"the commission error is entirely unreliable."*
- Ruff 2&7, N = 101: minimal detectable change in error counts is **MDC% = 218.9 (ADE)** and **135.5 (CSE)** — more than twice the mean error count.

A screen saying "your errors went from 4 to 2, well done" is showing noise. Errors are the theoretically interesting inhibition variable **and** individually uninterpretable. They go into CP (aggregated, α = .97) and the session record. Never a headline, never a trend, never celebrated.

Same rule for **spatial bias**: CoC false-positives run 10–90% depending on total cancellations. Gate any spatial readout on a minimum cancellation count.

### 2.3 Only `S` feeds `θ`. Everything else is the instrument.

d′, ICV, CP and the organisation indices are what the game exists to measure. The moment any of them drives the difficulty controller, difficulty becomes a function of the measurement and the measurement becomes a function of difficulty — and neither is interpretable afterwards.

Same rule `practiceLog.js` already enforces in Wellbeing (gamify the skill, never the mood score), and the same reason coach taps are kept out of `trialLog`. **This is the single easiest thing to get wrong here.**

### 2.4 The claim boundary (SCI-01, critical)

**Say:** "This is a cancellation task, a standard measure of visual selective attention and scanning speed." · "Your score on this task will improve with practice **on this task**." · "Here is how your search was organised."

**Never say:** "trains you to lock onto what matters" · "keeps your focus on task over time" · anything of the form *improves concentration* / *transfers to everyday focus*.

Evidence: Simons et al. (2016); Melby-Lervåg, Redick & Hulme (2016); and closest of all **Longley et al. (2021), Cochrane, 65 RCTs, 1,951 participants** on scanning training for neglect — i.e. literally training on a cancellation task. Visual interventions: *17 trials, 398 participants, "no evidence of effect on ADL."*

Practice effects guarantee the player's numbers rise (Ruff 4-week retest: ADS +7.0, CSS **+11.4**). That is what makes the unsupported claim tempting.

### 2.5 Authored level difficulty is CONTENT's job, never the data's

Elo rates the **player only**. The 60 authored levels keep frozen difficulties. Klinkenberg's Math Garden rates both sides because its items are interchangeable arithmetic problems with no authored order; ours are not. If play data re-rates a level, monotonicity stops being a guarantee and becomes a statistical outcome — level 37 can end up rated easier than 36 because a cohort had a good week, and `audit:curves` is enforcing a promise the data can break.

θ **advises** (start level, coach trigger, wave-ramp span) and **never gates**. A player who beat level 40 beat level 40.

---

## 3. The equations

Everything below is implementable as written. Sources in `02-SCIENCE.md`.

### 3.1 Scoring

```js
// detection — THIS is accuracy. The omission measure. (currently missing entirely)
detection = hits / nTargets;

// precision — what is currently mislabelled "Accuracy"
precision = (hits + falseAlarms) > 0 ? hits / (hits + falseAlarms) : null;

// d2 Concentration Performance — the headline. α = .97, test-retest r = .90-.97.
// Immune to racing, which our clock actively rewards.
CP = hits - falseAlarms;

// Q-score (Hills & Geldmacher 1998; Eq. 2 of CancellationTools). Normalise before display.
Q = (hits * hits) / (nTargets * totalSeconds);
```

⚠ `precision` returns **`null`**, not 1, when no response was made. The current `: 100` / `: 1` / literal `999` fallbacks are why a do-nothing round reports a perfect score.

### 3.2 Signal detection

```js
H = (hits + 0.5) / (nTargets + 1);           // log-linear (Hautus 1995), applied ALWAYS
F = (falseAlarms + 0.5) / (nInspected + 1);  // NOT nDistractors — see warning
dPrime = probit(H) - probit(F);
c      = -0.5 * (probit(H) + probit(F));
```

⚠ `nDistractors` assumes every non-target was foveated and rejected. Unobservable — there is no dwell event. Either define `nInspected` from the convex hull of the cancellation path, or stop calling it d′ and label it a bounded estimate with the assumption stated. **Always report H and F beside it**; on our boards d′ is dominated by the hit rate.

⚠ `invNormCDF` already exists at `cancellation/assessmentData.js:131`. `normCdf` exists at `assessment/assessmentNorms.js:60`.

### 3.3 Search organisation — all computable from `foundPos[]` TODAY

```js
bestR         = max(|pearson(rank, x)|, |pearson(rank, y)|)              // 0-1, HIGH = organised
intersectRate = nIntersections / (nCancellations - nImmediateRevisits)   // LOW = organised
SA            = mean(|2*gamma_i/90 - 1|), gamma_i = asin(|dy|/d) in deg  // 0 diagonal, 1 cardinal
SD            = mean(consecutiveDistance) / mean(nearestNeighbourDistance)  // scale-free
revisitRate   = (immediate + delayed) / totalMarkings * 100
```

⚠ **`bestR` and `SA` are both required.** A boustrophedon sweep (left→right, then right→left) is perfectly organised and scores a *low* horizontal r. SA rescues exactly that case.

⚠ **`SD` must be the normalised version.** Our boards run 20→48 cells; the raw distance is not comparable across them.

⚠ Distinguish **immediate** revisits (motor perseveration) from **delayed** ones (a spatial-working-memory failure — you re-searched space you had cleared). Different constructs.

`assessmentData.js:268-314` already implements the first three correctly. Move, don't rewrite.

### 3.4 The expert model — split motor from search

**This is the fix for the 700 ms constant.**

```js
const FITTS_A = 110;    // ms intercept  — 2D finger touch, Shannon form (Yamanaka & Usuba)
const FITTS_B = 100;    // ms/bit slope

motorMs  = (D, W) => FITTS_A + FITTS_B * Math.log2(D / W + 1);
searchMs = (N, slope) => slope * N;        // N = SET SIZE (targets + distractors), not target count
perTargetMs = (D, W, N, slope) => searchMs(N, slope) + motorMs(D, W);
```

Measured at our 57 px tile: motor time is **302 ms** at 150 px, **381 ms** at 300 px, **422 ms** at 450 px, **480 ms** at 700 px.

> **300–480 ms of the 700 ms budget is the thumb**, leaving 220–400 ms for search — plausible for a pop-out board, far too little for a demanding one (a 20-item conjunction search costs 400–800 ms *per target*). And motor cost is **logarithmic in distance** while search cost is **linear in set size**, so a single constant is correct at exactly one board configuration and wrong at every other.

Three corrections this carries:
- **`searchMs` takes N = T + D.** The current model prices only targets (`per × tc`), so adding distractors raises difficulty invisibly.
- **`slope` is a function of `interference`, not of the tier name.** Interference is the guidance factor (`N_eff = N/g`) and is the strongest lever in the game; the current model ignores it entirely.
- **`D` shrinks as targets are cleared.** Use mean nearest-untapped-target distance — a real within-board effect the flat constant hides.

⚠ **FIT `slope` ON OUR TELEMETRY. Do not import it.** Kristjánsson: the identical task gives 23/48 ms/item under present-absent responding and 17/27 under go/no-go. *"Slopes are an ambiguous measure of visual attention."* We have `tOn` and inter-response intervals across hundreds of thousands of boards.

⚠ **Recalibrate so the split model reproduces ≈700 ms at the current reference board** (owner decision, §0), then let it diverge. This changes what `audit:fq` certifies — re-run it and expect margins to move. That is the gate working.

### 3.5 The per-item time floor — a new gate

From eye-movement data: distractor dwell **188 ms** (easy search) → **249 ms** (difficult); target dwell **301 → 393 ms**.

```
effective ms per board item >= 190 (easy) ... 250 (difficult)
```

Below that, the task stops measuring selective attention. Same conclusion `audit:pacing` reached for four other games, reached independently from the eye-tracking literature.

⚠ **`audit:pacing` does not currently cover `cancel-task` at all.** It contains blocks for `keep-track`, `paired-associates`, `task-switch`, `story-grid` only. CLAUDE.md's description reads as though it does.

### 3.6 Elo — Rasch-scaled, player only

```js
const LOGIT_PER_ELO = 400 / Math.LN10;                 // 173.7178 (only if surfacing an Elo number)
const TARGET_P = 0.84;                                 // = 0.5^(1/4)
const OFFSET   = Math.log(TARGET_P / (1 - TARGET_P));  // 1.658 logits

// Survival: place the next board, then invert 3.4 to realise it as (targets, clock)
bNext = theta - OFFSET;

// Update, after every board
sRaw  = (2 * (cleared ? 1 : 0) - 1) * (1 - Math.min(timeUsed / timeLimit, 1));  // HSHS-style
S     = (clamp(sRaw, -1, 1) + 1) / 2;                                           // 0..1
E     = 1 / (1 + Math.exp(-(theta - b)));                                       // Rasch 1PL
K     = Math.max(0.10, A / (1 + B * n));                                        // A ~ 1.0, B ~ 0.05
theta += K * (S - E);
n     += 1;
```

**Why 0.84:** it is simultaneously the Wilson et al. (2019) Gaussian optimum, `0.5^(1/4)` (the convergence point of a 1-up/4-down staircase — defensible from psychophysics too), and below a realistic touchscreen lapse ceiling. Math Garden's live choice is **0.75**; if playtesting says 0.84 is punishing on one life, move to 0.75 (offset 1.099) rather than inventing a number.

⚠ **The 85% rule is derived for gradient-descent-trained binary classifiers**, and the paper is explicit that the number is a property of the Gaussian noise assumption — Laplacian noise gives 18.4% error, Cauchy 25%. A well-motivated default, not a theorem about people.

⚠ **The K floor at 0.10 is not decoration.** Pelánek's decay handles initial uncertainty; the floor handles **non-stationarity** — a player genuinely improves over months and an un-floored K eventually refuses to notice. Math Garden's live learner floor is 0.2.

⚠ **`A` and `B` are OUR tuning parameters.** No canonical published pair exists — every open source that cites Pelánek's decaying-K function says "determined by grid search" and gives no numbers. Do not present them as cited.

⚠ **Seed at the population mean for this game**, not zero. Convergence: earliest possible trial 21, settled **35–45**. Gate any θ-derived *display* behind n ≥ 20; let θ drive board selection silently before that. Same cold-start posture as `personalization/`.

### 3.7 Reliability — practice-corrected

```js
SEM   = SD * Math.sqrt(1 - r);                  // r = 0.80 already in DOMAIN_RELIABILITY.attention
Sdiff = SEM * Math.SQRT2;
RCI_c = (post - pre - practiceGain) / Sdiff;    // Chelune et al. 1993
MDC   = 1.96 * Math.SQRT2 * SEM;
```

`assessmentNorms.js` already has `semScore`, `reliableChange`, `reliableChangeRaw` — correct and cited to Jacobson & Truax (1991); the review board reports **SCI-03 as passing**. What is missing is the **practice-corrected** variant, which for a game played hundreds of times is the only honest form.

---

## 4. What NOT to build

- **No item calibration on authored levels.** §2.5.
- **No staircase.** It has no memory across sessions (run ten is calibrated no better than run one), it cannot rate an authored level, and it needs 30–60 trials against a survival run that is a fraction of that. Elo is the same feedback loop with a persistent scale — *a staircase that remembers*.
- **No vigilance compensation.** Our boards run 5–25 s in sets of 3–8 — worst case ~3.3 minutes. The shortest duration at which a decrement is *reliably* reported is **8–10 minutes**, and at 10 minutes it is a 6.9% A′ change that some short tasks fail to show at all. An order of magnitude of margin. A within-level drop is the wave ramp working, not fatigue.
  - If we ever examine long survival runs: **measure ICV, not hit rate.** In the 10-min SART, RT variability moved **6.4× more** than accuracy (+44.6% vs −6.9%). `metrics.js` already computes ICV.
  - The underload account (Pattyn et al. 2008) argues *against* easing off — for a sustained task, an easy board is the risk.
- **No FFitts correction.** Our 57 px tiles are above the touch-ambiguity regime, and the correction frequently produces a negative value inside its own square root.
- **No "where you started" readout** until Arabic-script norms exist. Literate LTR readers start top-left; Arabic readers should start top-**right**, and there is no published normative data. An English-reader baseline would systematically misread half our users.

---

## 5. The build

Tick a box only when the change is **made and verified**. Note what you verified with.

### Phase 1 — Measurement truth
*No difficulty change. Every item independently shippable.*

- [x] **1.1** `acc` now means **detection** (`found / tc`); `precision` is a separate returned field. Results tiles show *Focus score · Time · Precision · Errors · Avg RT* — the headline already carries detection, so an "Accuracy %" tile beside it was redundant when honest and a lie when not. New strings `focusScore`/`focusScoreHint`/`precision` in EN **and** AR.
- [x] **1.2** `cp = found − errors` (d2 Concentration Performance) added and made the first results tile. `t.efficiency`/`efficiencyHint` are no longer rendered anywhere and the keys are deleted.
- [x] **1.3** All three fabricated fallbacks removed. A no-response round now returns `acc: 0`, `precision: null`, `avgRt: null`, `ies: 0`. Nulls render `'—'`. `mergeChallengePlayerStats` averages only the rounds that have a value (summing a null silently yields `NaN`).
- [x] **1.4** `onsetMs` (first response) and `iriMs` (later responses) are separate fields, never both on one record. `rt` is kept as an alias **only** on the first response, which is the one that genuinely is a reaction time.
- [x] **1.5** Round marker gained `tc`, `tlim`, `nCells`, `nDistractors`, `noGoTotal`, `interference`, `poolSize`, `target`, `target2`, `mode`, `ladderLv`.
- [x] **1.6** Honest-limits is now the fourth section of `gameScience.js` under `cancel-task`, EN + AR, and **renders** (verified on screen). The first two sections are scoped to the task. `intro` no longer claims "sustained attention" — a 5–25 s board cannot measure a decrement that needs 8–10 minutes. `menuHint` no longer claims feature binding in either language. `sciTitle`/`sciParas` deleted from both dicts.
- [x] **1.7** `meanIesMs` (the real IES, filtered for the validity gate) and `meanRate` (the old quantity, honestly named) replace `meanIES`. Storage key bumped to `mm_cancel_assess_v2`; v1 is **deliberately not migrated** — no transform recovers an IES from an RCS, so migrating would relabel a number as its own opposite.
- [x] **1.8** World review filtered to that world's ten rungs, `mode === 'level'`, `sv >= 2`, one row per rung (most recent). `cxBands` deleted from both dicts; the band callout reads `FQ_SECTIONS` + `FQ_MECHANIC_LABELS`, the same source the map already used.

**Phase 1 verification:** `scratchpad/verify-phase1.mjs` imports the shipping module and reproduces the audit's exact failure cases — half-cleared board now 50% (was 100%), do-nothing round now 0%/null/null (was 100%/1/999), CP ranks a careful 7-of-8 above a sloppy 8-of-8-with-6-errors, IES correctly withheld above the 15% error gate. 13/13. Science panel confirmed rendering in a real browser.

### Phase 2 — Surface the second factor

- [x] **2.1** New `shared/searchMetrics.js` owns `pearson`, `segmentsCross`, `spatialBias`, `searchOrganization`, `organisationBand` and a new **`standardisedDistance`**. `assessmentData.js` imports it; its local copies are gone.
- [x] **2.2** Computed on the live path. Level mode carries `foundSeq`/`omitPos` per **wave**; Survival pools every round of the run, **including the failed one** — how you searched a board you ran out of time on is as real as how you searched one you cleared. Waves/rounds are averaged, never concatenated: joining two boards' paths invents a giant jump between them and reports a tidy player as chaotic.
- [x] **2.3** `CxSearchBlock` on both the level and Survival results, above the band/personal-best callout. Shows the band word, then the three published components, then a hint that **discloses the one-word summary as this app's own blend** — the three numbers are Dalmaijer et al., the word is ours.
- [x] **2.4** `MIN_CANCELLATIONS_SPATIAL = 8` / `MIN_CANCELLATIONS_ORG = 5`; below either, the functions return `null` and the block renders **nothing**. No start-location readout — `scanLat` is computed and deliberately not shown (§4).

**Phase 2 notes, both found by running rather than reading:**
- **The block must render nothing, not an apology.** Playing level 1 showed it: the early ladder deals **3 targets a wave** = two moves, below what best-r or a crossing count can mean anything on. The first build printed "Not enough taps to read a search path" there, so the block would have spent the first several levels explaining its own absence. It now simply appears once there is a path to describe (~level 8+, and any Survival run past the opening stages).
- **`standardisedDistance` is density-free but NOT width-free, and that is correct.** Measured: 1.446 on a 3×5 row-major sweep, 1.646 on a 6×8, 1.000 on a 3×5 boustrophedon. The difference is the row wrap — a wider board means a longer trip back. So it ranks a boustrophedon as more *efficient* than a row-major sweep, which is true. **That is why it is deliberately excluded from `orgScore`:** efficiency of travel and tidiness of order are different claims, and blending them would mark down a long-but-perfectly-systematic sweep. (A test asserting width-invariance failed; the assumption was wrong, not the code.)

**Phase 2 verification:** `scratchpad/verify-phase2.mjs`, 20/20 against the shipping module — including the **boustrophedon** case (a left-right-then-right-left sweep is perfectly tidy and scores a *low* horizontal r; the angle measure is what rescues it, and the test proves both). Then driven in a real browser: a row-by-row automated sweep of nine Survival boards produced **Systematic · Sweep 0.97 · Crossings 0.00 · Along the grid 0.78**, which is the measure agreeing with a path whose organisation was known by construction.

### Phase 3 — The difficulty model and its gates

- [x] **3.1** `expertTargetSecForBoard({cols, rows, cells, tc, interference})` added — Fitts motor + search, priced on **N**, with `referenceGeometry` / `motorMsForMove` / `motorMsForBoard`. ⚠ The motor term is computed on a **fixed reference device** (the 375×667 phone `PLAY_BOARD` was fitted on), because Fitts needs pixels and pixels are a property of the screen — making difficulty viewport-dependent is the one bug this game already avoids.
- [x] **3.2** `searchSlopeMsPerItem(interference)` + `effectiveSameHue(interference)`. Slope now rises with the same-hue share instead of being keyed to the tier name. ⚠ The four-colour palette means interference 0 is still **25%** same-hue by chance; `effectiveSameHue` states that rather than hiding it.
- [x] **3.3** Measured and **reported, not gated** — see the note below. Worst mechanic-adjusted wave **0.982×** at L56 w8; 6 of 330 waves under 1.0×.
- [x] **3.4** `cancel-task` registered in `audit:pacing` with a **ms-per-board-item** floor (60 ms; worst dealt value **229 ms** at L41 w7, so comfortable). ⚠ The unit is per ITEM, not per target — a board is cleared by inspecting items, most of them distractors, and `audit:fq` already gates per-target pace. This gates what that one cannot see: whether there is time to look at the board at all. The gate also now prints what three wrong taps cost (L60 last wave: **20s → 11s**).
- [ ] **3.5** ⏸ **BLOCKED ON AN OWNER DECISION — §9.** `lookalikes` (band 5, L41–50) **does not exist** — no reader anywhere, and `audit:fq:584` actively forbids same-motif pools. Meanwhile `poolForLevel` *shrinks* heterogeneity 7→4 there, which by Duncan & Humphreys makes the board **easier**. Implement a real T–D similarity manipulation or rename the band to what it does.
- [ ] **3.6** ⏸ **BLOCKED ON AN OWNER DECISION — §9.** `forbidden` (band 4) is a trialLog field and a HUD chip; tapping a no-go scores identically to any other distractor. Give it a consequence or drop the claim.
- [ ] **3.7** ⏸ **BLOCKED ON AN OWNER DECISION — §9.** Stop pool size and eccentricity **resetting at tier seams** (pool 11→5 at L21, 7→4 at L41; eccentricity 0.37→0.30 and 0.55→0.50). Gate both on the ladder path — neither is currently checked there.
- [x] **3.8** `FQ_WRONG_TAP_PENALTY_SEC` + `effectiveClockSec(tlim, wrongTaps)` exported from `focusQuestData.js`; the tap handler reads the constant; `audit:pacing` prints what it costs. **Superseded text:** Export the 3 s wrong-tap penalty as a named constant and put it in the feasibility model. Currently an inline literal (`index.jsx:2279`) in no model and no gate; Levels has no error cap, so three slips on L60 wave 8 remove **45%** of the budget.

### Phase 4 — Elo

- [ ] **4.1** `theta` store, Rasch update, K decay with floor, population-mean seed (§3.6) — new module
- [ ] **4.2** Authored `b_k` per level, frozen, monotone — derived once from §3.4
- [ ] **4.3** Survival generates from `θ − 1.658` instead of the open-loop stage ramp
- [ ] **4.4** Fix the `FREE_LIVES` dead branch — `index.jsx:1412` comments "adaptive staircase: clear → +1, fail → −1", but `FREE_LIVES = 1` and the counter is never incremented, so the branch is unreachable. Delete the comment or make it true.
- [ ] **4.5** θ advises start level, coach trigger, wave-ramp *span* (not endpoints — endpoints stay authored so the cross-level cap and the feasibility proof are untouched). **Never gates.**
- [ ] **4.6** `rating.js`: bank a measured quantity instead of rounds-survived. ⚠ `updateRating(key, level)` takes a scalar level **by contract across all 18 games** — this needs its own verification pass. Level mode currently never calls it at all.

### Phase 5 — Practice-corrected reliability

- [ ] **5.1** `reliableChangeCorrected(delta, sd, r, practiceGain)` in `assessmentNorms.js`
- [ ] **5.2** Any progress surface uses it. Nothing trends raw errors (§2.2).

---

## 6. Verification

**The gates that must stay green:** `audit:fq` · `audit:curves` · `audit:pacing` · `audit:coach` · `audit:consistency` · `audit:design` · `audit:gamekeys` · `lint`, plus a clean production build. All twelve CI gates block the deploy.

**What the gates do NOT prove** — established by running them, not by reading them:
- `audit:fq` proves a **zero-error** player can clear a board. The 3 s penalty is nowhere in it.
- `audit:curves`' inert-band rule is **structurally incapable of firing on this game** — `secPerTarget` derives from a strictly decreasing geometric function, so "something climbed" is true at every band edge by construction. It also measures a board nobody plays (L60: reports 0.885 s/target; the player meets 1.77).
- `audit:pacing` **does not cover this game.**

**Beyond the gates** — this repo's own rule, and it has been earned repeatedly: *a passing gate is not proof*. For any change that reaches the screen, open the game and look. A computed style proves a declaration; a green gate proves an assertion. Neither proves a human sees the right thing.

**Running things on this machine:** `npm run <gate>`. If Bash fails with exit 127, use PowerShell, or call node by absolute path — `"C:/Program Files/nodejs/node.exe"` works. Broad `Glob` patterns time out (OneDrive); use explicit paths.

⚠ **This working tree is CRLF.** A regex plant that silently fails to land produces a false PASS — this repo has been bitten twice. When you plant a bug to test a detector, **verify the plant actually landed in the file** before trusting the result.

---

## 7. Credit — things that are already right, do not "fix" them

- **Set size does not rescale with viewport.** `PLAY_BOARD` is one fixed spec per tier, and the file names the `audit:mot` density-rescale trap as the reason. The best measurement decision in the game.
- **`PLAY_BOARD` is measured** — 4×5 / 5×7 / 6×8, fitted on a real 375×667 device through the live formula; `audit:fq` replicates `CancelBoard2D`'s `fit()` line for line.
- **Tutorial contamination is fully guarded** — all five write paths check `coachOpenRef`.
- **The assessment is genuinely feedback-free**, and a 680 ms central fixation cross precedes its trials so CoC has a defined origin.
- **The Levitt implementation** (`shared/staircase.js`) is textbook and its "~70% success" copy is the correct convergence figure in both languages. It is the *axis under it* that is broken, not the algorithm.
- **The log-linear SDT correction** is the right one, applied the right way, for a documented reason.
- **EN/AR pairing held** across every string named in the audit. This repo's most frequent defect did not occur here — the stale claims are stale in *both* halves.

---

## 9. DECISIONS WAITING ON THE OWNER (opened 2026-09-19)

All four change what a player meets, which is why they stopped at the boundary the "hold the current feel" instruction drew. None is a bug to fix quietly.

### 9.1 — The top of the ladder is tighter than the old model claimed

`npm run audit:fq` now prints this every run, and it does **not** fail on it:

```
split Fitts+search model: worst wave 0.954x expert at L50 w7 (13 targets, 16s);
  13 of 330 waves under 1.0x — levels affected L46-L60 (13 of 60)
mechanic multipliers treated as compensation: worst 0.982x at L56 w8;
  6 of 330 waves under 1.0x
```

The legacy model hid this two ways: a 700 ms baseline where its own citation says 943 ms, and a slope keyed to the tier name rather than to `interference`, which under-prices a 94%-same-hue field. Under the honest model the last waves of L46–L60 sit at **0.95–0.99× expert pace**.

⚠ **0.954× is inside the model's own uncertainty** — the Fitts coefficients vary ±30% across devices and the slope is fitted, not imported. This is a flag, not a proof that anyone is stuck.

**The options:** (a) leave it, and keep the honest model as a reporting instrument only; (b) loosen the last waves of L46–L60 until every wave clears 1.0×, which makes the endgame easier; (c) move the whole headroom envelope onto the honest model, which changes the clock everywhere — early levels get *tighter* (the old model over-priced pop-out boards by up to 33.8%) and late ones get looser.

### 9.2 — `lookalikes` (band 5) does not exist, and the honest name is already taken

Nothing reads the flag, and `audit:fq:584` **forbids** the same-motif pools that would implement it as a shape manipulation. Meanwhile the thing band 5 *actually* does — push `interference` to 0.85→0.92, i.e. 89–94% of distractors in the target's hue — is a real Duncan & Humphreys target–distractor similarity manipulation, just in colour rather than shape, and it has been climbing continuously since L3 rather than starting at L41.

**The options:** (a) rename the band for what it does (cheapest, honest, no feel change); (b) build a real shape-similarity pool and change the gate that currently forbids it (a content project); (c) leave the name and accept that the rule card is describing something the board does not do.

### 9.3 — `forbidden` (band 4) has no consequence

Tapping a no-go scores exactly like tapping any other distractor. The *measure* now exists — Phase 1 added `noGoTotal` to the round marker, so the commission rate on forbidden objects is reconstructable — but the mechanic is still a HUD chip over unchanged behaviour.

**The options:** (a) give a no-go tap a heavier penalty than an ordinary miss, which makes withholding matter and changes the feel; (b) leave the behaviour and let the band be "the level where we start measuring inhibition", which is now true; (c) drop the claim from the rule card.

### 9.4 — Three levers reset downward at the tier seams

Pool size drops **11→5** at L21 and **7→4** at L41; eccentricity bias drops 0.37→0.30 and 0.55→0.50 at the same two places. Both are genuine difficulty levers (distractor heterogeneity; crowding) going backwards, and neither is gated on the ladder path. Fixing them makes L21–30 and L41–50 harder than they are today.

---

## 8. Open questions

- **⚠ THE SCIENCE PANEL'S OWN TITLE IS "Why this trains your brain"** (found 2026-09-19 by reading the live screen, not the code). The honest-limits paragraph now renders correctly — underneath a headline making exactly the claim it refutes. The string is `HubScienceLink.jsx:14` (`brainLabel`) and `ScienceBrainPanel.jsx`, **shared by all 18 games**, plus local copies in `memo-span` and `nback`. Changing it is a platform-voice decision, not a Cancellation one, so it was flagged rather than changed. Suggested: "The science" / "What this measures" — «العلم وراء اللعبة», which `gameScience.js` already uses as its per-game title.

- **`nInspected` for d′.** Convex hull of the cancellation path, or drop the d′ label? (§3.2)
- **Arabic first-marking norms.** No published data exists. Collect our own, or permanently omit the readout? (§4)
- **Phase 4.6 and the 18-game rating contract.** Change the contract, or give `cancel-task` a parallel channel?
- **`scripts/build-focus-quest-data.mjs`** still reads a file on the owner's OneDrive and would regenerate the difficulty model from a source predating every fix in this plan — including the retired colour conjunction. In no npm script, so it cannot fire by accident. Delete it, or update it?
