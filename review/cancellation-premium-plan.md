# Cancellation ("Car Park"… no — `cancel-task`) — Premium Pass Plan
**Scope:** `src/features/training/domains/attention/games/cancellation/` only · presentation/feel layer only · no gameplay, curve, timing or construct changes.
**Written:** 2026-09-11 · Research + review pass (no code changed). Build pass follows.

---

## 0. The one-line brief

Cancellation is the platform's **depth reference (8/8)** and its **content** is finished. What is not finished is the *performance* of that content: the round has no moment of arrival, the one clock the player watches steps at 10 Hz, a three-second penalty is charged silently, seventeen identical sounds carry a whole board, and the level map is a rainbow of procedural hues on a dashed line that does not touch the planets it runs behind. Every one of those is fixable without touching a single number `audit:fq` certifies.

**The governing rule for this pass, derived from CLAUDE.md's own premium section and stated here so it can be enforced:**

> **Nothing may sit between the clock starting and the board being fully legible.**
> All motion belongs *before* `playStep === 'running'`, *after* the last target falls, or *local to one tile*. The lattice itself never animates in, never shakes, and never moves as a whole.

---

## 1. Current-state review — what actually reads as cheap

### 1.1 The round has no ending
`index.jsx:1543-1546` clears the last target and calls `endRoundRef.current(true)` on the same tick, with the comment *"No green solve-pulse here on purpose — the win screen is enough."* It isn't. The player completes a timed visual search and the board is gone before the tap's own 320 ms settle animation (`cancelBoard2d.css:66-75`) has finished playing. `juice.celebrate()` exists in the kit (`useJuice.js:42-44`) and this game never calls it. This is the single largest premium gap in the game.

### 1.2 The juice wiring is decorative and inert
- `index.jsx:1861` reads `juice.shake` — `useJuice` has never returned a `shake` (`useJuice.js:55-66`). `.ct-juice-shake` can never apply.
- `index.jsx:1889-1890` passes `particle` and `rtFx`; `JuiceLayer` accepts and ignores them (`JuiceLayer.jsx:20`).
- `index.jsx:1515` calls `juice.hit({})` with no `rtMs`/`limitMs`, so `rtRating` always returns `good` (`juiceUtils.js:6`) and the return value is discarded. The combo it increments is then explicitly hidden (`showCombo={false}`, `index.jsx:1894`).
- `juice.miss()` is never called anywhere in the game, so the combo does not reset on a false alarm.

Net: the game imports the juice kit, satisfies the depth gate's `juice` rule, and produces **zero** feedback through it. That is worse than not having it — it means the next reader assumes feedback is handled.

### 1.3 A wrong tap costs three seconds and says nothing
`index.jsx:1578` banks `+3` into `pendingPenaltyRef`, spent on the next timer frame (`index.jsx:1281`). The only on-screen consequence is that the time bar jumps. And the bar cannot even express a jump gracefully: `.ct-fq-cb` has **no transition** (`training.css:2207` — only its sibling `.ct-fq-pb` has one), while `PlayHud` re-renders on a 100 ms interval (`PlayHud.jsx:122-128`). The clock the whole task is played against visibly **steps** ten times a second.

### 1.4 One sound is doing five jobs
`click` fires for: every button, each of the three countdown ticks (`index.jsx:1394`), the pre-round cue (`index.jsx:749`, `785`) **and the ten-seconds-left warning** (`index.jsx:1286`). The most urgent event in a round is acoustically identical to pressing Back. Meanwhile `collect` fires for "GO" (`index.jsx:1398`), for "I'm ready" (`index.jsx:795`) and for **every single target hit** (`index.jsx:1514`) — up to 26 identical events on a hard board, with no phrasing, no escalation, nothing that says *you are on a run*.

### 1.5 The board is a lattice floating on a photograph
`training.css:9434-9438` forces `.cb2d-wrap` and `.ct-fq-g-wrap--scene2d` transparent (`!important`) inside `.ct-domain-game-stage` — correct and hard-won, it is what made the gameplay art visible. The side effect nobody has looked at since: the stimulus pieces no longer sit on `--play-surface`, and `tokens.css:221-236` states the six `--game-*` roles are measured **at 3.3:1 against that surface**. The pieces are now on whatever the minimal gameplay art happens to be under them. Visually the board reads as loose tiles on wallpaper rather than as an instrument.

### 1.6 The one element the player re-checks mid-search is a sticker
`.ct-fq-bar-chip` (`training.css:2157-2168`): `border: 2px solid var(--game-ink)` plus a hand-mixed `rgba(19, 30, 40, 0.18)` shadow. That is precisely the pattern CLAUDE.md's *"PREMIUM IS ELEVATION AND RESTRAINT"* pass removed from `.ct-fq-btn`, still worn by the goal chip. Its partner on the cue screen is worse: `.ct-fq-cue-card--ready` (`training.css:2504-2528`) is `2px solid rgba(20,37,57,.2)` over `rgba(255,250,240,.78)` with `0 12px 32px rgba(19,30,40,.16)` and a `4px solid rgba(255,255,255,.96)` focus ring, and `.ct-fq-cue-ready-label` is a hard black pill. **All of these selectors are cancellation-exclusive** despite living in shared `training.css` — verified by grep: `ct-fq-cue-*`, `ct-fq-cd`, `ct-fq-cd-num`, `ct-fq-fix-cross` appear in exactly one `.jsx` file, this game's.

### 1.7 The countdown animates longer than its own step
`.ct-fq-cd-num` runs `ct-fq-cdpop 0.85s` (`training.css:2474-2479`) while `runCountdownThen` advances every **380 ms** (`index.jsx:1395`). Each numeral is still mid-pop when the next replaces it.

### 1.8 The planet path is a prototype wearing arcade colours
Built 2026-09-11, and the header is honest about it — but four things read as unfinished:
- `CancelPlanetPath.jsx:41`: `hue = (lv * 47) % 360` — sixty planets at 60 % saturation across the entire colour wheel, on a screen whose app palette is warm parchment and amber. These are also the file's only `audit:design` debt (`design-baseline.json` records `cancelPlanetPath.css: raw-colour 3`).
- `cancelPlanetPath.css:18-33` + the component's own admission at `CancelPlanetPath.jsx:86-91`: the spine is a **straight dashed centre line** that does not connect the nodes swinging ±30 % around it. The one element whose job is to say *journey* is visibly not attached to the journey.
- `CancelPlanetPath.jsx:55`: `'✓'` and `'🔒'` as text. An emoji lock renders in a system font with its own colour on a screen where everything else is token-driven.
- `CancelPlanetPath.jsx:78`: `pathHeight = 60 × 108 + 130 = 6,610 px`, and the screen always opens at the top. A player at level 45 lands ~4,700 px above their own position and must hunt for it. **Every premium level map in existence lands you on your marker.**
- `index.jsx:1798` renders `` `${cfg.tc}t·${cfg.time}s` `` under every unlocked planet — engineering shorthand, in both languages.
- The screen also throws away structure it already owns: `focusQuestData.js:498-516` defines six bands of ten with three named mechanics, **and `FQ_MECHANIC_LABELS` already ships EN + AR**. The path shows none of it.

### 1.9 Smaller things
- Pass-n-Play results use `'🥇' '🥈' '🥉'` (`index.jsx:2132`).
- Survival results already load `profile.freeBest` / `freeBestScore` (`index.jsx:2038`) and show them as a flat note — beating them is never acknowledged.
- A wrong tap produces **no motion at all** — only a fill/glyph change through `visualFor`.

### 1.10 ⚠ One non-premium finding I have to report
`index.jsx:1255-1261` — the "safety net" auto-win effect — has **no `coachOpenRef` guard**:

```js
if (targets.length > 0 && targets.every((cell) => cell.tapped)) {
  endRoundRef.current(true);
}
```

The tap handler's equivalent path *is* guarded (`index.jsx:1543`, with a long comment explaining why), and CLAUDE.md records this exact failure as fixed: *"Clearing the remaining targets did the same via the auto-win."* The effect path reinstates it — clear the three-target tutorial board during the lesson and the round ends, which force-closes the coach (`index.jsx:1319-1322` → `endCoach` → `markOnboardingSkipped`) at step 3 of 8, permanently. **Verify by hand before or during this pass.** The C1 clear-ending item has to guard both paths regardless, so the fix rides along.

---

## 2. Research notes

**What was consulted**

| Source | What it contributed |
|---|---|
| *What Features Influence Impact Feel?* — arXiv 2208.06155 (19-feature framework, NLP over Steam reviews of top vs poorly-rated action games) | The three features whose absence most reliably ruins perceived impact: **hit-stop, sound coherence, camera control.** |
| Wayline, *The Seductive Squeeze: When "Juice" Becomes a Crutch* | **Responsiveness outranks reactiveness.** Keep only context-sensitive feedback tied to a player action; cut indiscriminate particles and screen shake. |
| Material Design 3 — easing & duration tokens | `emphasized-decelerate` `cubic-bezier(0.05, 0.7, 0.1, 1.0)` for something arriving; `standard` for micro-state changes. Durations: 100 ms icon state, 250–300 ms card/morph, 450–500 ms full-screen. |
| Earcon design literature (Brewster-lineage guidelines; BeepBank-500 synthetic earcon corpus, arXiv 2509.17277) | UI cues live at 100–500 ms; lower-to-mid fundamentals rated more pleasant than high ones; pitch stepped in musical-scale increments is the canonical way to encode a rising sequence. Independently validates `sfx.js`'s existing 165–525 Hz / sine-triangle / low-pass choices. |
| Duolingo design writing | The premium read comes from every action having a matched audio-visual acknowledgement, not from any one effect being large. |
| Alto's Odyssey / Monument Valley art-direction interviews | "Premium" there is atmosphere and restraint — no HUD clutter. Confirms the direction CLAUDE.md already set. |

**Five governing principles**

1. **Responsiveness before reactiveness.** Nothing added may delay, obscure or displace a stimulus.
2. **Two of the three impact-feel levers are forbidden here** (hit-stop distorts measured RT; camera shake is the distractor confound `useJuice.js` deliberately removed) — **so sound coherence gets the whole budget**, which is why audio is the largest, cheapest, first chunk.
3. **Escalation over repetition.** A pitch ladder turns identical hits into a phrase, invisibly — zero visual-attention cost.
4. **Depth from light, not ink.** Hairline + `--elev-*`, never a 2px outline and a hard offset shadow.
5. **A map must tell you where you are.** Show the band/mechanic structure the data already has; open on the player's own marker.

---

## 3. The plan

Ratings: **S** ≤ ~1h · **M** ~2–4h · **L** ~a day. Build order: **E → C → B → A → D → F** (audio first: invisible risk, largest felt change, smallest diff).

### E. Audio cues (`src/lib/sfx.js` additive + `index.jsx` call sites)
- **E1 (S, highest value/cost):** streak ladder on hits — `collect2/3/4` cues (triangle, D4→A4 / E4→B4 / F4→C5, ceiling C5=523.25Hz, `cut≤1800`, `gain≤0.07`), picked by `juice.comboRef.current` capped at 3. Add missing `juice.miss()` on false alarm; `juice.reset()` wherever tallies reset. Off for `isAssess` and while `coachOpenRef.current`.
- **E2 (S):** real 10s warning cue (`warn`: two falling low notes G3→E3, `gain 0.05`) replacing the reused `click`.
- **E3 (S):** "I'm ready" (`confirmSurvivalTarget`) swaps `collect`→`correct` so it stops sounding like a hit.
- **E4 (S, optional):** countdown phrasing `count1/2/3` rising C4→E4→G4 resolving into existing `collect` on GO. No timing change.

### C. Hit / clear feedback (juice)
- **C1 (M, biggest single win):** give the round an ending — freeze the timer the instant the last target falls (`stopTimer()` first, so `timeUsed`/IES/accuracy are frozen identically to today), `juice.celebrate()` + a 300ms settle, hold ~420ms, then end. Guard taps and the §1.10 auto-win effect with a `clearingRef`, and fix the missing `coachOpenRef` guard on that same effect. Off for assessment/adaptive. Reduced-motion keeps the hold + sound, drops the ring.
- **C2 (S):** retune the clear animation to `cubic-bezier(0.05,0.7,0.1,1)`, smaller overshoot, keep `forwards`/`pointer-events:none` (load-bearing).
- **C3 (S/M):** a wrong tap gets a local 160ms lateral settle on the tapped tile only — not a board shake. On during the coach ("seeing the mistake is the lesson"), off in assessment/reduced-motion. First thing to cut if it reads as noise.
- **C4 (S):** delete dead wiring (`juice.shake`, unused `particle`/`rtFx` props) — keep the `useJuice`/`JuiceLayer` imports themselves, since `audit:consistency`'s depth rule greps for them.

### B. In-round board & HUD
- **B1 (M, needs owner sign-off):** a plate under the lattice (`.cb2d-grid::before`, `--play-surface-flat`-derived, `var(--elev-rest)`) so the stimulus palette sits back on the surface it was contrast-measured against. Scoped to `.cb2d-grid`, never `.cb2d-wrap` (that stays transparent — hard-won 2026-09-08 fix). Layout-neutral (pseudo-element, doesn't affect fit maths). **Ship behind a screenshot — partially re-covers gameplay art the owner chose to leave open.**
- **B2 (S):** `.ct-fq-cb { transition: width 140ms linear }`, scoped under `.cancellation-task-game`, so the clock sweeps instead of stepping at 10Hz.
- **B3 (S/M):** a small `−3s` / `−٣ث` chip near the time bar when a penalty is charged (never during coach/assessment), fading over 500ms. Bilingual, Arabic-Indic numerals, never logged to trialLog.
- **B4 (S):** goal/cue chip — replace the hand-mixed `rgba(19,30,40,.18)` sticker border with hairline + `var(--elev-raise)` + an inner accent ring (keeps prominence, drops the sticker read). Move both `.ct-fq-bar-chip` and `.ct-fq-cue-chip` together. Do not touch `data-coach="goal"`'s box size — coach anchor risk.
- **B5 (S, biggest visual payoff per line):** the Survival cue card (`ct-fq-cue-card*`, cancellation-exclusive) — swap every hand-mixed `rgba(...)` border/background/shadow for `--line`/`--surface-raised`/`--elev-raise`/`--elev-press`/`--game-ink`, press sinks (no scale-on-active).
- **B6 (S):** countdown numeral pop retuned to 340ms so it resolves inside its own 380ms step.
- **B7:** explicit non-change list — no board entrance animation, no whole-board transform, no opacity ramp before the first legible frame.

### A. Menu & level-select (`CancelPlanetPath.jsx` / `.css`)
- **A1 (M):** replace the `hue = (lv*47)%360` rainbow with six band colours derived from `color-mix(in srgb, var(--game-accent) …%, var(--game-item))` — ramps cool→hot with difficulty and drops `cancelPlanetPath.css`'s raw-colour count 3→0 (commit the lowered `audit:design` baseline).
- **A2 (S):** an SVG trail through the real node coordinates (`vector-effect="non-scaling-stroke"`) instead of a dashed centre line the nodes don't touch.
- **A3 (S):** land the screen on the player's current node via `scrollIntoView` on mount (reduced-motion → `behavior:'auto'`). Don't touch `.ct-domain-game-stage`'s `overflow-y`/`overscroll-behavior`.
- **A4 (M):** Kawkab walks from the previous frontier planet to the new one after a clear (module-scope `lastFrontier`, not persisted — a session-lifetime flourish).
- **A5 (S):** replace `'✓'`/`'🔒'` text glyphs with token-coloured inline SVG; show the `t·s` sublabel only on the current node (full detail stays in `aria-label`); bilingual in the same edit.
- **A6 (M):** quiet band-chapter captions between decades of levels, sourced from `FQ_MECHANIC_LABELS` (already EN+AR) — no new derived difficulty value.

### D. Results (cancellation-only props/CSS; `PlayResults.jsx` itself untouched)
- **D1 (S):** acknowledge a beaten personal best in Survival results (`profile.freeBest`/`freeBestScore` already loaded).
- **D2 (S/M):** name the mechanic that just unlocked when a level closes a band.
- **D3 (S):** replace `'🥇''🥈''🥉'` medal emoji in Pass-n-Play results with token-coloured rank pips.

### F. Shared-kit extensions (additive only, flagged separately)
- **F1 (S):** four new `CUES` keys in `sfx.js` — purely additive, no existing cue changes.
- **F2 (S, optional):** `.ct-juice-solvepulse`'s literal `#5aa15a` → `var(--game-ok)` (shared kit, benefits 5 other games).
- **F3 — explicitly not proposed:** re-adding `particle`/`rtFx`/`shake` to `useJuice`/`JuiceLayer`. They were removed on a stated distractor-confound rationale that this plan agrees with; C1/C3 deliver the feel gain within that constraint.

---

## 4. Explicit non-goals

- All curve/content data (`assessmentData.js`, `staircase.js`, `focusQuestData.js`'s curves, `FQ_LADDER`, time limits, error caps) — gated by four separate audits, read-only in this plan.
- Assessment/Adaptive presentation — feedback-free by clinical design; every feel item is gated off `isAssess`.
- `CancelTaskCoach.jsx` / `scripts/cancel-task.js` — platform reference; only B4 comes near it (≤1px anchor shift, named verification step).
- `PlayResults.jsx`, `PlayHud.jsx` internals, `playHud.css`, `.ct-fq-btn*`, `ModePlanetHub`, `TrainingChrome` — shared across many games; out of a single-game-scoped pass.
- `.cb2d-wrap`'s forced transparency, `.ct-domain-game-stage`'s scroll/overscroll fix, `--game-bg`/`--app-bg` — all documented hard-won 2026-09-08 fixes.
- The `♥` hearts / inline hex gradients in `PlayHud.jsx` — real debt, shared, a separate ticket.
- Any new binary image or audio asset — not needed; everything above is CSS/SVG/canvas/token-driven or synthesized in `sfx.js`'s existing style.
- Board entrance/exit motion during live play — the one rule of this whole pass (§0).

---

## 5. Verification checklist

**Gates** (run all; first six block a deploy): `audit:fq`, `audit:pacing`, `audit:curves`, `audit:coach`, `audit:consistency`, `audit:design` (expect `cancelPlanetPath.css` raw-colour 3→0 if A1 ships — commit the lowered baseline), `audit:gamekeys`, `lint`.

⚠ New CSS in the cancellation folder must contain no `rgba(0,0,0,…)` / `rgba(255,255,255,…)` literals — use `--fx-shadow-*` / `--fx-glint` / `--elev-*` tokens instead, or `audit:consistency`'s `fx` rule will flag it.

**On the screen** (a passing gate is not proof a human sees anything — screenshot, don't read computed style):
1. Tutorial by hand: all 8 steps run, hand lands on the goal chip / real tiles, decoy step still crosses out. Clear the whole board mid-lesson — round must NOT end (§1.10 regression check).
2. Wrong tap: `−3s` chip in the right language/numerals, time bar drops smoothly. No chip during the tutorial.
3. Clear a board: ring plays, ~420ms hold, then results. `timeUsed`/IES/accuracy identical to a pre-change run.
4. A stray tap inside the 420ms hold must not increment errors.
5. Streak ladder audible, tops out at step 4, resets after a false alarm; assessment stays flat/neutral throughout.
6. Board plate (if shipped): gameplay art still reads around it, HUD reserve respected, no overflow on 390×844 at the densest board.
7. Wide-screen rail layout (`min-aspect-ratio:1/1`) unaffected.
8. Planet path: opens on the current node without scrolling, trail touches planets, Kawkab walks after a clear, no rainbow, AR/RTL composes correctly.
9. `prefers-reduced-motion: reduce`: new animations off, hold + sound retained, nothing stuck mid-transform.
10. Both themes: plate/cue-card/chips legible in dark (`--play-surface` doesn't flip — check deliberately).

**Strings:** grep the Arabic half after any text edit (this repo's most-repeated bug is an EN fix ~40 lines from its unedited AR twin).

---

## 6. If only three things ship

**E1** (streak ladder), **C1** (the round gets an ending), **B5** (the Survival cue card). Between them: the sound of every hit, the feel of every clear, and the first/last screen of every Survival round — no measurement surface touched, no new asset added.

---

**Sources consulted:**
- [What Features Influence Impact Feel? A Study of Impact Feedback in Action Games (arXiv 2208.06155)](https://arxiv.org/abs/2208.06155)
- [The Seductive Squeeze: When 'Juice' in Game Development Becomes a Crutch — Wayline](https://www.wayline.io/blog/the-seductive-squeeze-when-juice-in-game-development-becomes-a-crutch)
- [Easing and duration — Material Design 3](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs)
- [BeepBank-500: A Synthetic Earcon Mini-Corpus (arXiv 2509.17277)](https://arxiv.org/pdf/2509.17277)
- [Experimentally derived guidelines for the creation of earcons](https://www.researchgate.net/publication/228607856_Experimentally_derived_guidelines_for_the_creation_of_earcons)
- [Guidelines For Designing With Audio — Smashing Magazine](https://www.smashingmagazine.com/2012/09/guidelines-for-designing-with-audio/)
- [Duologues: the conversations shaping Duolingo Design](https://blog.duolingo.com/duologues-design-conversations/)
- [For Alto's Odyssey's devs, a healthy mind is as important for players as it is for themselves — Game Developer](https://www.gamedeveloper.com/production/for-alto-s-odyssey-s-devs-a-healthy-mind-is-as-important-for-players-as-it-is-themselves)
- [GDC Vault — The Art of Monument Valley](https://www.gdcvault.com/play/1022476/The-Art-of-Monument)

**Two things flagged for the owner before build:** the possible live-coach regression at `index.jsx:1255-1261` (§1.10), and item B1's board plate, which partially re-covers gameplay background art the owner chose to leave open on 2026-09-08 — wants a screenshot and a yes/no.
