# Cancellation — Scientific Audit

**Date:** 2026-09-19 · **Scope:** `cancel-task` — measurement, scoring, difficulty grading, and the gates that certify it.
**Method:** two literature agents (WebSearch/WebFetch, primary sources) + two read-only code auditors. Every number in the ladder section was produced by *importing the shipping module and printing it*, not by reading the source.

> **Ground rule carried from the premium-pass rounds:** a passing gate is not proof. Two of the three gates named in `CLAUDE.md` as protecting this game are weaker than their description; one does not cover this game at all.

---

## 0. The one-paragraph verdict

The **difficulty model** is better than most of this genre — its levers map onto real search parameters (set size, target–distractor similarity, eccentricity, VWM load), and set size deliberately does not rescale with viewport. The **measurement model** was built to a different, much lower standard, and it is the one the player reads. The game's own good science — d′ with the correct extreme-rate correction, Center of Cancellation, three published search-organisation indices — is implemented, correct, and **unreachable**, because its only caller is the parked assessment. Meanwhile every live screen reports precision as "Accuracy", a mixed onset/inter-response average as "Avg RT", and an arcade rate as "Efficiency".

Two numbers carry most of the risk:

- **700 ms** — the expert-model baseline, whose own comment cites a rate that works out to **943 ms**. The entire feasibility margin at the top of the ladder is this 26% gap.
- **`found / (found + errors)`** — labelled "Accuracy" in both languages. Omissions, the dependent variable cancellation tasks exist to measure, enter no number the player sees.

---

## 1. Findings, ranked

### S1 — "Accuracy" is precision. A half-cleared board reports 100%.

`shared/focusQuestData.js:2085`

```js
const total = found + errors;
const acc = total > 0 ? Math.round((found / total) * 100) : 100;
const accRaw = total > 0 ? found / total : 1;
```

`total` is *responses made*, not *targets presented*. `tc` is passed into the function and used only for a tap-spam clamp — never as a denominator.

**Reproduce:** clear 4 of 8 targets, no wrong taps, let the clock expire → `Time ran out · 4/8 Targets found · Accuracy 100%`. Tap nothing at all → `0/6 · Accuracy 100% · Efficiency 48 · Avg RT 999ms`, because `total === 0` takes the `: 100` branch, `accRaw` takes `: 1`, and `avgRt` falls through to a literal `999`.

It propagates: `accRaw` is the numerator of the displayed "Efficiency" and the denominator of the real IES, so **both** published-measure citations are computed on the wrong proportion. Townsend & Ashby's IES divides by proportion correct *over trials*, not by precision.

The correct measure exists 300 lines away in the parked path — `assessmentData.js:343`, `detection = hits/targets` — and is right.

**Size:** one line + two string pairs (EN/AR share the word الدقة for both concepts).

---

### S1 — The expert model is 26% faster than the paper it cites.

`focusQuestData.js:283-297`

```js
/** 700 ms baseline (Mesulam: healthy adults cancel ≈1.06 targets/s) */
const SEARCH_SLOPE_MS = { easy: 0, medium: 12, hard: 12 };
export function expertTargetSecForSetSize(diff, setSize) {
  return (700 + (SEARCH_SLOPE_MS[diff] ?? 0) * (Math.max(1, setSize) / 2)) / 1000;
}
```

**1 / 1.06 = 943 ms, not 700 ms.** Since the whole ladder is expressed as multiples of this number, the gap *is* the safety margin. Measured, substituting the cited rate:

| level | last wave | as shipped | with the cited 943 ms |
|---|---|---|---|
| L30 | 9 targets / 13 s | 1.587× | 1.252× |
| L40 | 11 / 15 s | 1.499× | 1.182× |
| **L50** | 13 / 16 s | 1.246× | **0.999×** |
| L60 | 16 / 20 s | 1.265× | 1.015× |

Three further defects in the same six lines:

- **The `/2` is never named.** It is the self-terminating-search assumption (you find a target after inspecting half the array). It means the stated 12 ms/item slope is **6 ms/item** of marginal cost. A reader takes away double the number the function uses.
- **The `/2` is also the wrong shape for multi-target cancellation.** Self-termination applies to *one* target. A systematic sweep that clears `tc` targets inspects ≈ N items total, not N·tc/2. Conservative in direction, wrong in form.
- **It is keyed to the tier name, not to interference.** `interference` — the share of distractors wearing the target hue, which the file itself calls "what turns a lazy pop-out scan into a real selective-attention task" — is not an argument. So L3–L20 are priced at slope 0 (pop-out) on boards measured at **25–53% same-hue**, and L45–L60 cost the same whether same-hue share is 55% or 94%.

**Size:** structural. This function is the definition of "hard vs broken" for the game and is imported by both gates.

---

### S1 — Nothing measured reaches the rating.

`index.jsx:1446` → `AppContext.jsx:283` → `rating.js:89`

```js
awardFreeRun('cancel', rw);          // rw = rounds survived in Survival
// rating.js
const toRating = (l, lHalf) => Math.round(1000 * (l / (l + lHalf)));
g.ewma = g.n === 0 ? L : g.ewma + K * (L - g.ewma);
```

`L` is an integer round count. Not accuracy, not RT, not d′, not organisation. **Level mode never touches `updateRating` at all** — it feeds points only, so the mode most players spend their time in contributes nothing.

Consequences: the hub renders a band from *Developing* to **Elite** off this number, and `ratingToLevel` uses it to set Daily Workout difficulty. A fast, sloppy player outranks an accurate, deliberate one. At L=8 a single lucky final round moves the rating ~8 points, which is within reach of a band boundary by chance.

**Size:** structural — `updateRating(key, level)` takes a scalar level by contract across 18 games.

---

### S1 — One band's mechanic does not exist. Another is a tag. A third is a 5.7 px wobble.

`FQ_LADDER` (`focusQuestData.js:524`) declares six bands with six `adds`.

| band | levels | declares | reality |
|---|---|---|---|
| 3 Frost | 21–30 | `dual` | **real** — `seed.tgt2`, split guaranteed non-degenerate |
| 2 Dust | 11–20 | `switch` | **real** — `avoidTarget` guarantees a new target each wave |
| 4 Tempest | 31–40 | `forbidden` | **tag only** — writes a trialLog field and a HUD chip; tapping a no-go scores identically to any other distractor |
| 5 Verdant | 41–50 | `lookalikes` | **does not exist.** No reader in `fqLadderRoundOpts`, `prepareLevelRound` or `buildCellsFromParams` |
| 6 Void | 51–60 | `drift` | **4 px** offsets over 6.4 s on a ≥52 px piece — max displacement 5.7 px, the cell never leaves its own box |

`lookalikes` is worse than absent: `audit:fq:584` *actively asserts* that no pool may contain two shapes of the same motif family, and the file records that similarity grading was deleted ("every pool is motif-distinct now"). The player is told **"the distractors now share features with the target"** at exactly the level where the pool shrinks from 7 object types to **4** — its smallest since L1.

And `drift` buys a **12% time multiplier** for that 5.7 px. `dual` buys 15%. Both are hand-set; nothing measures the slowdown they compensate.

---

### S1 — The gate divides out the thing it should be testing.

`audit:fq:480`

```js
const lastRealised = (want.time / mult) / (per * want.tc);
```

`want.time` already contains ×1.12 (drift) and ×1.15 (dual). `per` contains neither. So the same compensation is **banked as headroom and spent as headroom simultaneously**. Treat the multipliers as compensation and:

```
waves whose mechanic-adjusted pace is under 1.0× expert: 6 of 330
L55 w8: raw 1.282× → 0.995×   (15 targets, 19 s)
L56–L60 w8: raw 1.265× → 0.982×  (16 targets, 20 s)
```

The final board of the last six levels is at or under the line the file itself calls the difference between hard and broken.

Two related gate boundaries:

- **`audit:pacing` does not cover Cancellation at all.** The file contains blocks for `keep-track`, `paired-associates`, `task-switch`, `story-grid`. `CLAUDE.md`'s description — "the ms-per-stimulus FLOOR a human actually meets, at every level of every tier and across survival" — reads as though it does.
- **`audit:curves`' inert-band rule is structurally incapable of firing on this game.** `secPerTarget` derives from `fqLadderHeadroom`, a strictly decreasing geometric function, so the "something climbed" test is true at every band edge by construction. It also measures a board nobody plays: at L60 it reports 0.885 s/target; the player meets **1.77**.

---

### S2 — Survival's staircase is dead code.

`index.jsx:1412`

```js
// Lives left — step DOWN one stage (adaptive staircase: clear → +1,
// fail → −1, so the stage converges on the player's threshold).
if (freeLivesRef.current > 0) { … }
```

`FREE_LIVES = 1`, and the counter is only ever set or decremented — never increased. The first failure takes it 1→0 and the branch never runs. It is an **open-loop ramp keyed to round count**, and it **saturates at stage 14**: every round from 14 onward is the identical board (hard L100, 48 cells, 15 targets, 20 s). The only thing still moving after that is a session-clock drain that caps around stage 45.

It also sawtooths at tier seams — 1.90× at stage 3, **3.14×** at stage 4, 1.34× at stage 8, **2.30×** at stage 9 — the same reset the Levels envelope was rewritten in 2026-09-17 to remove. `audit:fq` cannot see it because it checks an ordinal load index, not the feasibility ratio.

The *real* Levitt staircase (`shared/staircase.js`) is correct — 2-down/1-up, threshold = mean of the last 4 reversals, and the "~70% success" copy is the right convergence figure in both languages. But it belongs to the **adaptive** mode, and that mode runs it over a **non-monotone axis**: the stage index walks easy 1–100 then medium 1–100, so difficulty *resets at each tier boundary*. Measured, its first "make it harder" step goes 1.33 s/target → **3.00 s/target**, 74% more generous. It starts inside a 38-level plateau where easy L63–100 deal an identical board.

---

### S2 — The search-organisation data is captured correctly and thrown away.

This is the most recoverable finding in the audit. `index.jsx:2148` writes, per response: `idx, row, col, isT, ord, lead, tOn, noGo, ok, rt`. The round marker writes `foundPos[]` **in tap order** plus `omitPos[]`.

So **best-r, intersections rate and standardised angle are all computable from data the live game already stores**. `assessmentData.js:268-314` implements exactly those three, citing Dalmaijer et al. (2015). Nothing reads them outside the parked mode.

Two capture defects that must be fixed first:

- **`rt` is not a reaction time.** `lastTapRef` is re-stamped at grid onset, so `rt` on the first response is search-onset latency and on every later response is an **inter-response interval** — two different quantities in one column, under a name `trialLog.js:64` declares contractual. `metrics.js` then consumes it as an RT for `meanRt`, `sdRt`, `ies` and `postErrorSlowing`.
- **`noGo` has no denominator.** The flag is written per response; the round marker records neither the no-go count nor the target shape, so the commission *rate* on no-go items — the whole inhibition measure — is unreconstructable.

---

### S2 — d′ assumes every distractor was inspected.

`assessmentData.js:169`

```js
const hAdj = (hits + 0.5) / (targets + 1);
const fAdj = (falseAlarms + 0.5) / (distractors + 1);
```

The correction is right and is the right one — Hautus (1995) log-linear, applied unconditionally rather than only at 0/1, which is the better choice and is documented as deliberate. **The denominator is the problem.** `distractors` = every non-target cell on the board, i.e. it assumes the participant fixated and rejected all 35. In visual search a large share of distractors are never foveated; an unvisited item is neither a correct rejection nor anything else, and this game has no dwell event, so N(noise) is unobservable by construction.

Measured distortion: a perfect clear with zero false alarms gives `d′ = 5.06`, and `dprimeBand` calls ≥3.0 "Strong". Halve the distractor count and the same behaviour yields ≈4.8. The "Sensitivity" tile is largely a function of board size, and `criterion` inherits the same inflated `zF`.

---

### S2 — "Stability" is 25% of the Attention Index and measures scanning strategy as a defect.

`assessmentData.js:349`, `index.jsx:2140`

`rtCV = sdRT / meanRT` over `allTaps` — hits **and** false alarms, with the search-onset latency mixed in, filtered at `> 50 ms` rather than the `RT_MIN_MS = 150` anticipation cut `metrics.js` defines. `metrics.js:13` states this project's own rule — "RT statistics are computed on CORRECT responses only" — and this violates it.

The failure is the interesting part: a well-organised searcher sweeping row by row produces long jumps at row wraps and short ones within a row — **high inter-response CV by good strategy**. They are scored "Developing" on Stability and lose up to a quarter of the composite for it.

---

### S2 — The live science copy makes unscoped training claims; the honest paragraph is unrendered.

Rendered (`gameScience.js:98`, EN and AR both):

> "Tapping only the targets among look-alike distractors **trains you to lock onto what matters and filter out the rest**."
> "Sweeping the whole field **keeps your focus on task over time**."

Dead (`index.jsx:463` EN / `:643` AR) — `sciParas` is referenced nowhere in the file:

> "Honest limits: practice reliably improves performance on this task and on visual search; broad 'far transfer' to everyday attention is debated in the literature (Simons et al., 2016). Use this to train and track these specific skills — not as a medical test."

The best-written text in the game is unreachable. `mot`, in the *same file*, carries exactly such a section. Two live strings also still claim conjunction search — `menuHint` EN "bind features" / AR "ربط السمات" — for a mechanic retired 2026-08-09.

This is an **SCI-01** exposure (critical, cited to the FTC's Lumosity settlement).

---

### S3 — Smaller, confirmed

- **18 of 59 adjacent level pairs deal byte-identical wave rows** (L1/L2, L2/L3, L5/L6, …). Only `interference` distinguishes them, and it steps by 0.02 — on a 20-cell board that is an expected 0.34 extra same-hue tile against a binomial SD of ~1.65.
- **240 of the 300 authored levels are unreachable** from Levels mode; the ladder touches `li ∈ {1,6,12,17,23,28,34,39,45,50}` per half.
- **Interference saturates at L45** and is flat for the last 16 levels. Set size is flat at 48 from L41. 56 of 330 waves sit on the 34% density cap.
- **Pool size and eccentricity *drop* at tier seams** — pool 11→5 at L21 and 7→4 at L41; eccentricity 0.37→0.30 and 0.55→0.50. Neither is gated on the ladder path.
- **The 3-second wrong-tap penalty** (`index.jsx:2279`) is an inline literal in no model and no gate. Levels has no error cap, so three slips on L60 wave 8 remove 45% of the budget — and `timeUsed`/`tps` are not time measures because the penalty is folded into them.
- **`meanIES` in stored history is the Rate-Correct Score**, inverted in direction from its name. Anyone reading `mm_cancel_assess_v1` longitudinally reads improvement as decline.
- **World-completion "Accuracy across the world"** is the last 30 won levels *anywhere*, unfiltered by world or mode.
- **`cxBands[2]`** tells the player band 3 is "a denser board"; it is the two-shape dual hunt.
- **`scripts/build-focus-quest-data.mjs`** still reads a file that exists on the user's OneDrive and regenerates the difficulty model from a source predating every fix above — including the retired colour conjunction. In no npm script, so it cannot fire by accident today.

---

## 2. Credit where due

These were checked and are correct. Several are better than the genre standard.

- **Set size does not rescale with viewport.** `PLAY_BOARD` is one fixed spec per tier, and the file names the `audit:mot` density-rescale trap as the reason. The best measurement decision in the game.
- **`PLAY_BOARD` itself is measured** — 4×5 / 5×7 / 6×8, fitted on a real 375×667 device through the live formula. `audit:fq` replicates `CancelBoard2D`'s `fit()` line for line.
- **Tutorial contamination is fully guarded** — all five write paths (trial log, error tally, clock penalty, score, round end) check `coachOpenRef`.
- **The assessment is genuinely feedback-free** — streak ladder, differential sound, error visual, 3 s penalty and urgency alarm all suppressed under `isAssess`.
- **A 680 ms central fixation cross** precedes assessment trials, so CoC and scan laterality have a defined origin. Rarely bothered with.
- **The Levitt implementation** is textbook and its user-facing convergence claim is correct in both languages.
- **The log-linear SDT correction** is the right one, applied the right way, for a documented reason.
- **EN/AR pairing held.** Every dict entry named in this audit was diffed across both halves. The stale claims are stale in *both* — this repo's most frequent defect did not occur here.
- **The lever set is theoretically sound.** Set size, target–distractor similarity, distractor heterogeneity, eccentricity/crowding, VWM load (dual), set shifting (switch) all map onto real search parameters. The problem is not the design of difficulty; it is that difficulty and measurement were built to different standards.

---

## 3. Provenance of the difficulty constants

Classified by the ladder auditor across the whole difficulty path.

| class | count | examples |
|---|---|---|
| **Cited** | 4 | `SEARCH_SLOPE_MS.easy = 0` (Treisman pop-out), `MIN_TOUCH_PX = 44` (WCAG 2.2), Okabe-Ito palette, IES validity gate `errRate < 0.15` (Bruyer & Brysbaert 2011) |
| **Measured** | 6 | `PLAY_BOARD`, `CELL_MIN/MAX`, `GAP_MIN`, `MAX_COLS/ROWS`, the 5% ink floor, `SURVIVAL_TIER_PLAN` hard `liStart` |
| **Hand-tuned** | ~50 | every headroom endpoint, every wave scale factor, both mechanic multipliers, the interference curve, the eccentricity bases, the anti-clustering radii, the entire Survival scoring economy, the 3 s penalty |

Three constants are **dead**: `DM.bt`, `DM.ts` (no reader anywhere in `src/`), and `FQ_WAVE_HR_FLOOR = 1.03` (never binds — the lowest uncapped wave headroom on the ladder is 1.0492).

And the realised curve is not the authored one: **the cross-level cap binds the last wave on 41 of 60 levels** (every level from L21 to L60). For two thirds of the ladder the clock is set by the ratchet, not by `fqLadderHeadroom`.

---

*Continued in `02-SCIENCE.md` (what the literature supports) and `03-SPEC.md` (the build).*
