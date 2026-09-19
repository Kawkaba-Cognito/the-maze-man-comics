# Cancellation — the build spec

Companion to `01-AUDIT.md` (what is wrong) and `02-SCIENCE.md` (what the literature supports).
This is what to build, in order, with the equations and the constraints.

---

## 0. The two decisions everything else follows from

### Decision 1 — the game reports **two** factors, not one

Mark et al.: omissions and search organisation are **statistically independent** (rₛ = −0.14, n.s.). The N=523 healthy-adult dataset: age predicts ~10% of duration variance at 0.59 s/year and has **minimal effect on organisation**.

So a single score destroys real signal — and the half we currently discard is the half that barely ages, which for a long-lived training product is the more interesting half. The results screen reports:

- **Performance** — how completely and quickly the board was cleared (CP, detection, Q)
- **Search** — how systematically it was searched (best-r, intersections, standardised angle, revisits)

We already store everything needed for the second. It costs no new capture.

### Decision 2 — Elo rates the **player**, authored levels stay frozen

Klinkenberg's Math Garden rates both sides because its items are interchangeable arithmetic problems with no authored order. **Ours are not.** The 60 levels carry a product promise: monotone difficulty, a nameable mechanic per band, `audit:curves` enforcing no band is inert. If play data re-rates a level, that promise becomes a statistical outcome — level 37 can end up rated easier than 36 because a cohort had a good week.

**Monotonicity is content's job. Item calibration is a feature we do not want here.**

θ advises (start level, coach trigger, wave-ramp span) and **never gates**. A player who beat level 40 beat level 40.

---

## 1. The equations

### 1.1 Scoring — replaces the current `acc` / `ies`

```js
// detection — THIS is accuracy. The omission measure.
const detection = hits / nTargets;

// precision — what is currently mislabelled "Accuracy"
const precision = (hits + falseAlarms) > 0 ? hits / (hits + falseAlarms) : null;

// d2 Concentration Performance — the headline. α = .97, immune to racing.
const CP = hits - falseAlarms;

// Q-score (Hills & Geldmacher 1998, Eq. 2 of CancellationTools) — normalise before display
const Q = (hits * hits) / (nTargets * totalSeconds);
```

⚠ `precision` returns `null`, not 1, when no response was made. The current `: 100` / `: 1` fallbacks are what make a do-nothing round report 100%.

### 1.2 Signal detection — keep, but fix the label

```js
const H = (hits + 0.5) / (nTargets + 1);          // log-linear (Hautus 1995), always
const F = (falseAlarms + 0.5) / (nInspected + 1); // ← NOT nDistractors
const dPrime = probit(H) - probit(F);
const c = -0.5 * (probit(H) + probit(F));
```

`nDistractors` assumes every non-target was foveated and rejected. It is unobservable — there is no dwell event. **Either** define `nInspected` as distractors within the convex hull of the cancellation path (derivable from `foundPos`), **or** stop calling it d′ and label it a bounded estimate with the assumption stated. Report `H` and `F` beside it always; on our boards d′ is dominated by the hit rate anyway.

### 1.3 Search organisation — all computable from `foundPos[]` today

```js
bestR = max(|pearson(rank, x)|, |pearson(rank, y)|)        // 0–1, high = organised
intersectRate = nIntersections / (nCancellations - nImmediateRevisits)  // low = organised
SA = mean(|2γᵢ/90 - 1|),  γᵢ = asin(|Δy|/d) in degrees     // 0 = diagonal, 1 = cardinal
SD = mean(consecutiveDistance) / mean(nearestNeighbourDistance)  // scale-free
revisitRate = (immediate + delayed) / totalMarkings * 100
```

`bestR` **and** `SA` both, because a boustrophedon sweep is perfectly organised and scores a low horizontal r. `SD` normalised, because our boards run 20→48 cells.

`assessmentData.js:268-314` already implements the first three. Move them to a shared module and call them from the live path.

### 1.4 The replacement expert model — split motor from search

This is the fix for the 700 ms constant.

```js
const FITTS_A = 110;    // ms, intercept, 2D finger touch (Yamanaka & Usuba, Shannon form)
const FITTS_B = 100;    // ms/bit, slope

const motorMs = (D, W) => FITTS_A + FITTS_B * Math.log2(D / W + 1);
const searchMs = (N, slope) => slope * N;   // N = SET SIZE, not target count

const perTargetMs = (D, W, N, slope) => searchMs(N, slope) + motorMs(D, W);
```

**Why this matters, measured.** At our 57 px tile:

| inter-target distance | ID | motor time |
|---|---|---|
| 150 px | 1.93 bits | **302 ms** |
| 300 px | 2.72 bits | **381 ms** |
| 450 px | 3.13 bits | **422 ms** |
| 700 px | 3.71 bits | **480 ms** |

**The motor act alone consumes 300–480 ms of the 700 ms budget**, leaving 220–400 ms for the search. That is plausible for a pop-out board and far too little for a demanding one, where a 20-item conjunction search costs 400–800 ms *per target*.

And the two scale differently — motor cost is **logarithmic in distance**, search cost is **linear in set size**. A single constant is therefore correct at exactly one board configuration and wrong at every other. That is the whole bug.

Three further corrections it carries:
- **`searchMs` takes N = T + D, not T.** The current model prices only targets, so adding distractors raises difficulty in a way it cannot see.
- **`slope` must be a function of `interference`, not of the tier name.** Interference is the guidance factor: `N_eff = N/g`. It is the strongest lever in the game and the model ignores it entirely.
- **`D` shrinks as targets are cleared.** Use mean nearest-untapped-target distance. The flat constant hides a real within-board effect.

⚠ **`slope` must be FITTED on our telemetry, not imported.** Kristjánsson: the identical task gives 23/48 ms/item under present-absent responding and 17/27 under go/no-go. *"Slopes are an ambiguous measure of visual attention."* We have `tOn` and inter-response intervals across hundreds of thousands of boards — fit it, don't guess it.

⚠ Recalibrate so the split model **reproduces ~700 ms at the current reference board**, then let it diverge. This changes what `audit:fq` certifies; re-run it and expect margins to move. That is the gate working, not a regression.

### 1.5 The per-item time floor — a new gate

From eye-movement data: distractor dwell **188 ms** (easy search) → **249 ms** (difficult); target dwell **301 → 393 ms**.

```
floor: effective ms per board item ≥ 190 (easy) … 250 (difficult)
```

Below that the task stops measuring selective attention. This is the same conclusion `audit:pacing` reached for four other games, reached here independently from the eye-tracking literature — and **`audit:pacing` does not cover this game.** Add it.

### 1.6 Elo — Rasch-scaled, player only

```js
const LOGIT_PER_ELO = 400 / Math.LN10;   // 173.7178 — only if an Elo-style number is surfaced
const TARGET_P = 0.84;                   // = 0.5^(1/4)
const OFFSET = Math.log(TARGET_P / (1 - TARGET_P));   // 1.658 logits

// Survival: place the next board
const bNext = theta - OFFSET;            // then invert §1.4 to realise it as (targets, clock)

// Update, after every board
const sRaw = (2 * (cleared ? 1 : 0) - 1) * (1 - Math.min(timeUsed / timeLimit, 1));
const S = (clamp(sRaw, -1, 1) + 1) / 2;                  // HSHS-style, time-weighted, 0..1
const E = 1 / (1 + Math.exp(-(theta - b)));              // Rasch 1PL
const K = Math.max(0.10, A / (1 + B * n));               // A ≈ 1.0, B ≈ 0.05 — OUR tuning
theta += K * (S - E);
n += 1;
```

**Why 0.84.** It is simultaneously (a) the Wilson et al. (2019) optimum for the Gaussian case, (b) `0.5^(1/4)` — the convergence point of a 1-up/4-down staircase, so it is defensible from the learning literature *and* the psychophysics one at once, and (c) below a realistic touchscreen lapse ceiling, unlike 0.85–0.87. Math Garden's live choice is **0.75**; if playtesting says 0.84 is punishing on one life, move to 0.75 (offset 1.099) rather than inventing a number.

**Why no staircase.** Three independent reasons: it has **no memory across sessions** (run ten is calibrated no better than run one); it **cannot rate an authored level**, so Levels would need a separate mechanism entirely; and it needs **30–60 trials** to converge against a survival run that is a fraction of that. Elo is the same feedback loop with a persistent scale. *It is a staircase that remembers.*

⚠ **The K floor at 0.10 is not decoration.** Pelánek's decay handles initial uncertainty; the floor handles **non-stationarity** — a player genuinely improves over months, and an un-floored K eventually refuses to notice.

⚠ **Seed at the population mean for this game**, not zero. Gate any θ-derived *display* behind n ≥ 20 (settled at 35–45); let θ drive board selection silently before that. Same cold-start posture as `personalization/`.

### 1.7 Reliability — practice-corrected

```js
SEM    = SD * Math.sqrt(1 - r);                 // r = 0.80, already in DOMAIN_RELIABILITY
Sdiff  = SEM * Math.SQRT2;
RCI_c  = (post - pre - practiceGain) / Sdiff;   // Chelune et al. 1993
MDC    = 1.96 * Math.SQRT2 * SEM;
```

`assessmentNorms.js` already has `semScore` and `reliableChange`, correctly, cited. **What is missing is the practice-corrected variant** — and for a game played hundreds of times that is the only honest form. Ruff's measured 4-week gains: ADS +7.0, CSS **+11.4**. The numbers go up from repetition alone.

---

## 2. The constraint that overrides everything

**Error counts may never be shown as an individual change.**

- d2: *"the commission error is entirely unreliable."*
- Ruff, N=101: **MDC% = 218.9 (ADE) and 135.5 (CSE)** — the minimal detectable change in errors is *more than twice the mean error count*.

A screen saying "your errors went from 4 to 2, well done" is showing noise. Errors are the theoretically interesting inhibition variable **and** individually uninterpretable. They go into CP (aggregated, reliable) and into the per-session record; they are never celebrated, never trended, never the headline.

Same rule for **spatial bias**: CoC false-positives at 10–90% depending on total cancellations. Gate any spatial readout on a minimum cancellation count.

Same rule for **first-marking location**: literate LTR readers start top-left; **Arabic readers should start top-right and no normative data exists.** Do not ship a "where you started" readout with an English-reader baseline. Either collect our own or leave it out.

---

## 3. Build order

### Phase 1 — Measurement truth *(no difficulty change; all of it independently shippable)*

| # | Change | Size |
|---|---|---|
| 1.1 | `acc` → `detection` (denominator `tc`), keep `precision` separately, relabel EN **and** AR | 1 line + 2 string pairs |
| 1.2 | Add `CP = hits − falseAlarms` as the headline; retire the RCS-shaped "Efficiency" | one function |
| 1.3 | Kill the `: 100` / `: 1` / `999` fallbacks — a no-response round returns `null`, not a perfect score | 3 lines |
| 1.4 | Split `rt` into `onsetMs` (first response) and `iriMs` (subsequent) in trialLog | one function |
| 1.5 | Add `noGoTotal`, `target`, `poolSize`, `interference` to the round marker | one function |
| 1.6 | Wire `sciParas` into `gameScience.js` as a fourth section; delete the conjunction claims in `menuHint` EN+AR | 4 strings, in pairs |
| 1.7 | `meanIES` → `iesMs` under a **new** storage key (old history is unreadable either way) | 2 lines |
| 1.8 | World accuracy filtered by world; `cxBands[2]` retired in favour of `FQ_SECTIONS` | one function |

### Phase 2 — Surface the second factor

| # | Change | Size |
|---|---|---|
| 2.1 | Move `searchOrganization` + `spatialBias` out of `assessmentData.js` into a shared module | move |
| 2.2 | Compute them on the **live** path from `foundPos[]`, every mode | one function |
| 2.3 | Results screen: Performance block + Search block | UI |
| 2.4 | Gate spatial readouts on minimum cancellations; no start-location readout until Arabic norms exist | guard |

### Phase 3 — The difficulty model

| # | Change | Size |
|---|---|---|
| 3.1 | Split `expertTargetSecForSetSize` into Fitts motor + search terms; price on N, not T | structural |
| 3.2 | Make `slope` a function of `interference` (guidance `g`), fitted on telemetry | structural |
| 3.3 | Fix `audit:fq`'s mechanic-multiplier double count — the 6 sub-1.0× waves at L55–60 | gate |
| 3.4 | Add the per-item dwell floor; register `cancel-task` in `audit:pacing` | gate |
| 3.5 | Either implement `lookalikes` (T–D similarity, per Duncan & Humphreys) or rename the band to what it does | content |
| 3.6 | Give `forbidden` a consequence or drop the claim | content |
| 3.7 | Stop pool size and eccentricity resetting at tier seams; gate both on the ladder path | data + gate |
| 3.8 | Export the 3 s penalty as a named constant and put it in the feasibility model | 2 lines + gate |

### Phase 4 — Elo

| # | Change | Size |
|---|---|---|
| 4.1 | `theta` store, Rasch update, K decay with floor, population-mean seed | new module |
| 4.2 | Authored `b_k` per level, frozen, monotone — derived once from §1.4 | data |
| 4.3 | Survival generates from `θ − 1.658` instead of the open-loop stage ramp | structural |
| 4.4 | Fix `FREE_LIVES` dead branch — delete the comment claiming a staircase, or make it true | 1 line |
| 4.5 | θ advises start level, coach trigger, wave-ramp span. **Never gates.** | integration |
| 4.6 | `rating.js`: bank a measured quantity instead of rounds-survived | ⚠ touches the 18-game contract |

### Phase 5 — Reliability

| # | Change | Size |
|---|---|---|
| 5.1 | `reliableChangeCorrected(delta, sd, r, practiceGain)` in `assessmentNorms.js` | one function |
| 5.2 | Any progress surface uses it; nothing trends raw errors | integration |

---

## 4. What not to build

- **No item calibration on authored levels.** §0 Decision 2.
- **No staircase.** §1.6.
- **No vigilance compensation.** Our boards run 5–25 s in sets of 3–8 — worst case ~3.3 minutes. The shortest duration at which a decrement has been *reliably* reported is **8–10 minutes**, and at 10 minutes it is a 6.9% A′ change that some short tasks fail to show at all. An order of magnitude of margin. A within-level performance drop is the wave ramp working, not fatigue.
  - ⚠ Where it *could* matter is a long survival run or a full Daily Workout. If we look, **measure ICV, not hit rate** — in the 10-min SART, RT variability moved **6.4× more** than accuracy (+44.6% vs −6.9%). `metrics.js` already computes ICV.
  - ⚠ And the underload account (Pattyn et al. 2008) argues *against* easing off: for a sustained task, an easy board is the risk.
- **No FFitts correction.** Our 57 px tiles are above the touch-ambiguity regime, and the correction frequently produces a negative value inside its own square root.

---

## 5. The separation that must hold

**Only `S` feeds `θ`. d′, ICV, CP, and the organisation indices are the instrument.**

The moment any of them drives the difficulty controller, difficulty becomes a function of the measurement and the measurement becomes a function of difficulty — and neither is interpretable afterwards.

This is the same rule `practiceLog.js` already enforces in Wellbeing (gamify the skill, never the mood score), and the same reason coach taps are kept out of `trialLog`. It is the single easiest thing to get wrong here.

---

## 6. Claim boundary — non-negotiable, SCI-01

**Say:**
- "This is a cancellation task, a standard measure of visual selective attention and scanning speed."
- "Your score on this task will improve with practice **on this task**."
- "Here is how your search was organised."

**Never say:** "trains you to lock onto what matters", "keeps your focus on task over time", or anything of the form *improves concentration* / *transfers to everyday focus*.

The evidence: Simons et al. (2016); Melby-Lervåg, Redick & Hulme (2016); and — closest of all — **Longley et al. (2021), Cochrane, 65 RCTs, 1,951 participants**, on scanning training for neglect, i.e. literally training on a cancellation task. Visual interventions: *17 trials, 398 participants, no evidence of effect on ADL.*

The practice effects guarantee the player's numbers rise. That is what makes the unsupported claim tempting, and it is why the boundary has to be written down rather than left to judgement.
