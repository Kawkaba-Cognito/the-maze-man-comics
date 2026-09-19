# Cancellation — the science that applies

Companion to `01-AUDIT.md`. This is the subset of the literature that is **directly implementable** and that this game's data can actually support. Every formula carries its source. Formulas we should *not* adopt are listed too, with the reason.

---

## 1. The canonical instruments, and what this game is

| Test | Targets | Distractors | Time | Headline score |
|---|---|---|---|---|
| **Bells** (Gauthier 1989) | 35 bells | 280 | ~5 min | omissions; asymmetry (±15); time |
| **Star Cancellation** (BIT 1987) | 54 scored | 75 | <5 min | /54, cut-off <44; star ratio |
| **Mesulam** | 60 (15/quadrant) | many | ~10–20 min | hits, false positives, time, **structured vs random** |
| **d2** (Brickenkamp) | within 658 items | — | **20 s/line × 14** | **CP = hits − commissions** |
| **Ruff 2&7** (1996) | 300/block | 1200/block | **15 s × 20 trials** | speed, accuracy, **automatic vs controlled** |
| **TEA Map Search** | 80 | map | 2 min, colour switch at 1 min | found in 1 min / 2 min |

**Our game is closest to Ruff 2&7**: short timed trials in sequence, repeated. That matters, because Ruff's design carries the single most transferable idea in this literature —

> **Block A "Automatic Detection":** targets `2` and `7` among **letter** distractors → cross-category, pop-out.
> **Block B "Controlled Search":** targets `2` and `7` among **other digits** → same-category, serial.

That is a direct operationalisation of Schneider & Shiffrin, and it is exactly what our `interference` lever already does by hue. We have the mechanism; we have never named it or measured the contrast.

Sources: [Ruff psychometrics, PMC8471144](https://pmc.ncbi.nlm.nih.gov/articles/PMC8471144/) · [Bells Italian norms, Frontiers 2018](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2018.02745/full) · [Star Cancellation, Strokengine](https://strokengine.ca/en/assessments/star-cancellation-test/)

---

## 2. Scoring — adopt these

### 2.1 d2 Concentration Performance — the one score that cannot be gamed

```
CP = hits − commissions
```

The published rationale, verbatim: *"Concentration Performance is not inflated by excessive skipping as it is based on the number of target and non-target characters cancelled, as opposed to processing speed, which can be influenced by test strategies."*

Reliability from the Hogrefe d2-R manual: **CP α = .97**, TN α = .96, E% α = .93. Independent validation (N=445): **test–retest r = .90–.97**.

This is the correct replacement for the current "Efficiency" score. It is one subtraction, it is the most reliable index in the entire cancellation literature, and it is immune to the racing strategy our clock actively encourages.

[Steinborn 2017](https://www.psychologie.uni-wuerzburg.de/fileadmin/06020330/Methoden/Publikationen/Steinborn__2017__Psy_Assess_-_Methodology_of_Performance_Scoring_in_the_d2_Sustained_Attention_Test.pdf) · [Hogrefe d2-R](https://www.hogrefe.com/us/shop/d2-test-of-attention-revised.html)

### 2.2 Detection and precision, kept separate

```
detection = hits / nTargets          ← the omission measure. THIS is "accuracy".
precision = hits / (hits + falseAlarms)
```

Ruff's own accuracy definition is the second one — *"the number of correct targets divided by the number of correct targets and errors"* — but Ruff reports it **alongside** a speed score that is a raw hit count, so omissions are never invisible. Ours displays only the second and calls it accuracy. Both, labelled honestly.

### 2.3 Q-score — the task-native speed/accuracy composite

```
Q = nCor² / (nTar × tTot)
  ≡ (proportion of targets found) × (targets found per second)
```
Hills & Geldmacher (1998), Eq. 2 of CancellationTools. Dimensionally targets·s⁻¹, so it must be normalised before display.

**Why this rather than IES:** cancellation has no per-trial RT, only a board duration. Q is built for that. IES divides a mean RT by a proportion and assumes discrete trials.

### 2.4 LISAS, if a single headline number is required

```
LISAS = RTc + PE × (S_RT / S_PE)
```
`RTc` mean correct RT, `PE` error proportion, `S_RT`/`S_PE` the participant's SDs across conditions. The ratio is the exchange rate making one SD of RT weigh exactly one SD of error.

### 2.5 Signal detection — with the correction we already have

```
H = (hits + 0.5) / (nTargets + 1)
F = (falseAlarms + 0.5) / (nDistractors + 1)      ← log-linear, applied ALWAYS
d′ = probit(H) − probit(F)
c  = −0.5 × (probit(H) + probit(F))
```

Hautus's Monte Carlo comparison: the log-linear rule *"resulted in less biased estimates of d′ that always underestimated population d′, while the 1/(2N) rule, apart from being more biased, could either over- or underestimate."* A consistently conservative bias beats a bias of unknown sign. **Our implementation already does this correctly.**

⚠ **But `nDistractors` is not observable.** See `01-AUDIT.md` §"d′ assumes every distractor was inspected". On a board with far more distractors than targets, `F` has fine resolution and `H` is coarse, so d′ is dominated by the hit rate anyway. **Report H and F beside d′, never d′ alone** — and state the assumption in the label.

[Hautus 1995](https://link.springer.com/article/10.3758/BF03203619) · [Stanislaw & Todorov 1999](https://link.springer.com/article/10.3758/BF03207704)

---

## 3. Scoring — reject these

- **Rate Correct Score** (`PC / RT`) — *"better avoided"*: strong positive skew, high false-alarm rate, produces "rather strong effects without any support" in the underlying RT and PE. **This is what our "Efficiency" currently is.**
- **IES above ~10% errors** — induces positive skew; Bruyer & Brysbaert: *"mostly the variance of the measure is increased to such an extent that it becomes less interesting."*
- **Commission errors as a headline.** Two independent findings, and they are the most important psychometric facts in this document:
  - d2: *"the reliability of the overall score of error-rate is solely driven by the omission error, while the commission error is entirely unreliable."*
  - Ruff, N=101: **minimal detectable change in error counts is 135–219% of the mean error count.** ADE `MDC% = 218.9`, CSE `MDC% = 135.5`.

  > **A UI that says "your errors went from 4 to 2, well done" is showing noise.** Errors are the theoretically interesting inhibition variable and are individually uninterpretable. Aggregate them; never celebrate a change in them.

- **The laterality index `(L−R)/(L+R)`** — Rorden & Karnath show it *"cannot distinguish severe from less severe neglect and can even misclassify the relative severity."* Use CoC if we use anything.

[Vandierendonck, PMC6646946](https://pmc.ncbi.nlm.nih.gov/articles/PMC6646946/) · [Bruyer & Brysbaert 2011](https://psychologicabelgica.com/articles/10.5334/pb-51-1-5) · [Ruff MDC, PMC8471144](https://pmc.ncbi.nlm.nih.gov/articles/PMC8471144/)

---

## 4. Search organisation — the strongest section, and we already store the data

Reference implementation: **CancellationTools** (Dalmaijer, Van der Stigchel, Nijboer, Cornelissen & Husain, 2015), [PMC4636511](https://pmc.ncbi.nlm.nih.gov/articles/PMC4636511/). Equation numbers are that paper's.

```
── Best R (Mark et al. 2004), Eq. 9 ────────────────────────────────
bestR = max( |pearson(rank, x)| , |pearson(rank, y)| )
        range 0–1, HIGH = organised

── Intersections rate, Eqs. 3–8 ────────────────────────────────────
rate = nIntersections / (nCancellations − nImmediateRevisits)
       LOW = organised.  Neglect ≈ 0.2, non-neglect ≈ 0.1
       segment crossing via the standard orientation test

── Standardised angle (NEW in Dalmaijer 2015), Eqs. 10–11 ──────────
γᵢ = asin(|Δy| / d) in degrees, 0…90
SA = mean( |2γᵢ/90 − 1| )
     range 0 (all-diagonal, disorganised) → 1 (all-cardinal, organised)

── Standardised distance ───────────────────────────────────────────
SD = mean(consecutive euclidean distance)
   / mean(nearest-neighbour distance among all targets)
     scale- and density-free → comparable across our variable board sizes

── Revisits ────────────────────────────────────────────────────────
immediate : same target twice in a row        → motor perseveration
delayed   : return to a cleared target later  → SPATIAL WORKING MEMORY failure
revisitRate = revisits / totalMarkings × 100
```

**Why `bestR` and `SA` must both be computed:** a boustrophedon sweep (left→right, then right→left) is perfectly organised and scores a *low* horizontal r. The standardised angle rescues exactly that case.

**Why `standardised distance` and not raw:** our boards vary from 20 to 48 cells. The raw version is not comparable across them; the normalised one is.

### The result that makes this worth building

Mark et al., 18 stroke patients: **omissions and search organisation are statistically independent** (rₛ = −0.14, p = .57). *"Spatial inattention on cancellation is not closely related to the organization of visual search."*

And from the one large healthy-adult dataset (N = 523, Landolt-C, percentile tables at 10-point intervals): **age predicts ~10% of variance in task duration at 0.59 s/year, and has minimal effect on the organisation measures.**

> **A cancellation task yields at least two orthogonal factors — how completely/fast you clear it, and how systematically you searched. Reporting one number destroys the distinction, and the half we currently throw away is the half that barely ages.**

[Mark et al., PMC4441794](https://pmc.ncbi.nlm.nih.gov/articles/PMC4441794) · [Dalmaijer norms, bioRxiv 307520](https://www.biorxiv.org/content/10.1101/307520v1.full)

### Two cautions

- **First-marking location is script-dependent.** Literate readers of left-to-right scripts start top-left. **For an Arabic-language audience the expected start is top-right**, and no published Arabic-script normative data exists. If we show a "where you started" readout it must not carry an English-reader baseline. This is an open question, not a settled norm.
- **CoC is fragile with low cancellation counts.** In 651 stroke patients, fixed cut-offs gave false-positive rates *"from 10% to 30% for R−L and from 10% to 90% for CoC"* depending on total cancellations. Obvious once stated: the mean of 6 positions is a noisy estimate of a centre. Any spatial-bias readout must be gated on a minimum number of cancellations.

---

## 5. Difficulty — what the search literature actually supports

### 5.1 Slopes, and why we must not import them

| search type | present slope | absent slope |
|---|---|---|
| feature / pop-out | ≈ 0 | ≈ 0 |
| easy conjunction | 2 ms/item | 11 |
| hard conjunction | 23 | 48 |
| spatial configuration (T among L) | 25–40 | ~2× |

The 2:1 absent:present ratio is the basis of the `/2` in our expert model.

⚠ **Kristjánsson's central finding: the identical task gives 23/48 ms/item under present-absent responding and 17/27 under go/no-go.** *"Slopes are an ambiguous measure of visual attention."* The serial/parallel dichotomy is also dead — across Wolfe's million-trial dataset slopes *"form a continuum with no meaningful break."*

> **Calibrate the slope on our own task and response mode. Do not import 12 ms/item, or 25, or any other number, as a constant.** We have the telemetry to fit it.

[Kristjánsson, PMC4975113](https://pmc.ncbi.nlm.nih.gov/articles/PMC4975113/) · [Wolfe 1998](https://www.cns.nyu.edu/~david/courses/perceptionGrad/Readings/Wolfe-PsychSci1998.pdf)

### 5.2 Guided Search — guidance changes set size, not per-item cost

```
A_i = Σ_f w_f^BU · BU_{f,i}  +  Σ_f w_f^TD · TD_{f,i}  +  noise
```
Attention goes to the peak of this priority map, ~20 times/second; object recognition is a diffusion process >150 ms per item.

The usable reparameterisation:
```
N_eff = N / g            g ≥ 1, guidance strength
RT    = a + (b/g) · N
```
Perfect guidance → flat slope. `g = 1` → full serial slope. **Confidence: medium** — the activation form is citable, `N_eff = N/g` is the standard informal application and should be treated as a fitted parameter, not a literature constant.

[Wolfe 1994](https://link.springer.com/content/pdf/10.3758/BF03200774.pdf) · [Guided Search 6.0](https://link.springer.com/article/10.3758/s13423-020-01859-9)

### 5.3 Duncan & Humphreys — the two monotonicities, and no equation

```
difficulty ↑ as target–distractor similarity ↑
difficulty ↓ as distractor–distractor similarity ↑
```

**There is no closed-form model.** The paper gives a qualitative "search surface", not an equation, and no consensus similarity metric has emerged since. **Confidence: high that none exists.**

This is directly relevant to our `lookalikes` band, which declares a T–D similarity manipulation and implements nothing — while `poolForLevel` simultaneously *reduces* distractor heterogeneity (D–D similarity ↑), which by this theory makes the board **easier**. The band moves the wrong lever in the wrong direction.

[Duncan & Humphreys 1989](https://www2.psychology.uiowa.edu/faculty/hollingworth/prosem/Duncan_Humphreys_89_PR_VisualSearchStimulus.pdf)

### 5.4 Search asymmetry — a difficulty lever invisible to every gate

Q among Os is easy; O among Qs is hard. Detecting the *presence* of a feature is preattentive; detecting its *absence* is not.

> **A board where the target has an extra feature relative to distractors is systematically easier than its mirror image, at identical set size, density and nominal feature difference.** If our levels ever swap target/distractor roles, difficulty changes and no gate can see it.

### 5.5 Bouma's law — crowding

Bouma's own wording: *"no other letters should be present within (roughly) 0.5 φ distance"* at eccentricity φ.

```
s_crit = b · φ + φ₀
```
Measured across 50 observers: **b ≈ 0.23–0.28** (range 0.19–0.39 by meridian), tangential:radial anisotropy **0.63**. Bouma's own constant was 0.5, later revised to 0.4.

Our `computeEccentricityBias` is a real crowding lever. It is also the one that *drops* at both tier seams, ungated.

[Pelli & Tillman 2008](https://pubmed.ncbi.nlm.nih.gov/18828191/) · [Bouma law in 50 observers](https://www.biorxiv.org/content/10.1101/2021.04.12.439570v2.full)

### 5.6 The per-item time floor — measured, and it is the key number

| quantity | easy search | difficult search |
|---|---|---|
| dwell on a **distractor** | **188 ms** | **249 ms** |
| dwell on a **target** | **301 ms** | **393 ms** |
| distractor skipping rate | 0.122 | 0.034 |
| distractor revisiting rate | 0.16 | 0.26 |
| ordinary fixation | ~170 ms | |

> **Any ramp that drives effective per-item time below ~190–250 ms stops measuring selective attention and starts measuring nothing.** This is the same conclusion `audit:pacing` reached for four other games — arrived at here independently from the eye-movement literature.

Our game has no such floor, and `audit:pacing` does not cover it.

[Distractor dwelling/skipping/revisiting, Frontiers](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2016.01152/full)

### 5.7 The replacement expert model

Synthesised from the above — **not a published equation**, and flagged as such wherever it appears:

```
T   targets
D   distractors           N = T + D
g   guidance factor ≥ 1   (fit per stimulus condition; ~1 same-hue, →N pop-out)
t_i per-item inspection   (0.19 s easy … 0.25 s hard, from dwell data)
t_m per-target motor cost (locate + tap; to be measured on OUR boards)
R   revisit multiplier    (1 + revisitRate; ≈1.16 easy, 1.26 hard)

T_expert = (N / g) · t_i · R  +  T · t_m

feasible  ⟺  tLimit ≥ T_expert · safety,    safety ≥ 1.0
```

Three properties, each of which names a current defect:

1. **`T_expert` is dominated by `N`, not `T`.** Our model prices only targets — `per × tc` — so adding distractors makes a board harder in a way the model cannot see.
2. **`g` is the lever FIT and Guided Search actually hand us.** Similarity *multiplies* the slope; count only *adds* to it. Similarity is the stronger and cheaper knob, and it is the one our model ignores entirely (slope is keyed to tier name).
3. **`t_i` has a floor and `t_m` is separate.** Our single 700 ms constant covers search *and* the tap with no way to tell them apart.

---

## 6. Psychometrics — reliability, practice, and reliable change

### 6.1 Reliability, by index

| index | internal | test–retest |
|---|---|---|
| d2 CP | α = .97 | r = .90–.97 |
| Ruff ADS (automatic speed) | — | **ICC = .91** |
| Ruff CSS (controlled speed) | — | ICC = .83 |
| Ruff CSA (controlled accuracy) | — | ICC = .79 |
| Ruff ADA | — | ICC = .69 |
| Star Cancellation total | — | ICC = .89 |
| **d2 commission errors alone** | — | **≈ 0** |

**Speed indices are reliable; error indices are not.** Every headline we build must lean on the former.

Our `DOMAIN_RELIABILITY.attention = 0.80` (citing Uttl & Pilkenton-Taylor 2001) sits sensibly inside this range.

### 6.2 Practice effects — large, one-directional, and the reason RCI is mandatory

Ruff 2&7, 4-week retest, N=101: ADS **+7.0**, CSS **+11.4**, ADA +1.2, CSA +2.1.
UCancellation, 1-week retest: *"CP for all rows showed significant practice effects"*, t(49) = −7.11 and t(52) = −10.32.

> **Any uncorrected pre/post comparison will show improvement from repetition alone.** For a training product this is the single most important psychometric fact in this document — the numbers *will* go up, which makes an unsupported transfer claim both tempting and false.

### 6.3 The machinery — and we already have it

```
SEM    = SD × √(1 − r_xx)
S_diff = SEM × √2
RCI    = (post − pre) / S_diff                    reliable if |RCI| ≥ 1.96
RCI_c  = (post − pre − practiceGain) / S_diff     Chelune et al. 1993
MDC    = 1.96 × √2 × SEM = 2.77 × SEM
MDC%   = MDC / meanScore × 100                    <30% acceptable, <10% excellent
```

`assessmentNorms.js` already implements `semScore`, `reliableChange` and `reliableChangeRaw` correctly, cited to Jacobson & Truax (1991), and `review:since` reports **SCI-03 as passing**. What is missing is the **practice-corrected variant** — which for a game played hundreds of times is the only honest form.

[Jacobson & Truax, Springer Encyclopedia](https://link.springer.com/rwe/10.1007/978-3-319-56782-2_1242-3) · [Ruff MDC, PMC8471144](https://pmc.ncbi.nlm.nih.gov/articles/PMC8471144/)

---

## 7. What the task measures, and what we may claim

### 7.1 The construct

Four candidate readings, and the honest answer is that two are separable and both real:

- **(a) Visual scanning speed and accuracy.** Bates & Lemay's construct-validity study (N=364) concluded the d2 is *"an internally consistent and valid measure of visual scanning accuracy and speed"* — notably **not** "a measure of attention", despite the name.
- **(b) Selective attention.** The manual's claim, well supported by the target–distractor manipulation, but heavily confounded with (a).
- **(c) Visuospatial neglect.** A special case requiring spatial scoring; CoC reaches AUC 1.0 as a screen but false-positives badly on non-spatial impairment.
- **(d) Executive search strategy.** Statistically independent of (a), per Mark et al.

Motor contamination is small: five fine-motor subtests explained only **5.6% of variance in d2-R hits, n.s.** (though that was a pen paradigm, not a touchscreen — our Fitts exposure is untested).

### 7.2 Transfer — the blunt answer is no

**Simons, Boot, Charness, Gathercole, Chabris, Hambrick & Stine-Morrow (2016)**, *Psychological Science in the Public Interest*:

> *"We find extensive evidence that brain-training interventions improve performance on the trained tasks, less evidence that such interventions improve performance on closely related tasks, and little evidence that training enhances performance on distantly related tasks or that training improves everyday cognitive performance."*

**Melby-Lervåg, Redick & Hulme (2016)**, 87 publications, 145 comparisons: reliable intermediate transfer; for far transfer *"no convincing evidence of any reliable improvements when compared with a treated control condition."*

**And the closest possible test — Longley et al. (2021), Cochrane, 65 RCTs, 1,951 participants.** Scanning training *is* the standard rehabilitation for neglect, i.e. literally training on a cancellation task:

> Visual interventions (eye-movement/scanning training): **17 trials, 398 participants, "no evidence of effect on ADL."** All evidence very low certainty. *"The potential benefits on specialized impairment tests were not confirmed by improvements in activities of daily living."*

### 7.3 Therefore — the claim boundary

**Defensible:**
- "This is a cancellation task, a standard measure of visual selective attention and scanning speed."
- "Your score on this task will improve with practice **on this task**."
- "Here is how your search was organised."

**Not defensible, and all three are currently on screen or one wiring-up away:**
- "trains you to lock onto what matters and filter out the rest"
- "keeps your focus on task over time"
- anything of the form *improves concentration* / *transfers to everyday focus*

These are precisely the claims the three reviews above were written to refute, and precisely what **SCI-01** exists to catch. The practice effects in §6.2 guarantee the player's numbers go up regardless — which is what makes the unsupported claim tempting.

[Simons et al. 2016](https://vivo.weill.cornell.edu/display/pubid27697851) · [Melby-Lervåg et al. 2016](https://journals.sagepub.com/doi/10.1177/1745691616635612) · [Longley et al. 2021, Cochrane](https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD003586.pub4/full)

---

## 8. Research limitations, stated

Roughly a third of targeted primary sources are PDFs whose text layer could not be extracted, and this machine has no working `python` or `pdftotext`. Affected: Wolfe 1998 (million trials), Guided Search 2.0 and the formal GS2 model, Stanislaw & Todorov 1999, Gauthier 1989 original, Steinborn 2017. Several SAGE / Wiley / ScienceDirect / ARVO / Cochrane pages returned HTTP 403. Where this bit, the confidence note says so rather than paraphrasing from memory.

Specific low-confidence items **not** to build on:
- **"PROC"** as an acronym — the quantity (percentage of repeated cancellations) is standard; the label is not sourceable. Name it `revisitRate`.
- **A canonical horizontal-vs-vertical scanning index** — none exists; `|r_hor| − |r_ver|` is a construction from Best R's components, not a citable measure.
- **Q-score bounded 0–1** — the formula is solid, the range claim comes from secondary sources and is dimensionally doubtful. Normalise it ourselves.
- **`N_eff = N/g`** — standard informal application of Guided Search, not a sourced equation.
- **Exact target count in the classic paper d2** — the 658-item / 47-per-line / 20-s structure is well attested; the commonly quoted ≈299 target count was not verifiable and is deliberately not asserted.
