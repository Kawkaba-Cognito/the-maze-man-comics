# Cancellation (`cancel-task`) — Premium Pass, Round 2
**Scope:** `src/features/training/domains/attention/games/cancellation/` + strictly additive/backward-compatible touches to `src/lib/sfx.js`, `src/styles/training.css`, `shared/PlayHud.jsx`.
**Written:** 2026-09-11 · Senior-QA review of the Round-1 build + build plan. No code changed by this pass.
**Round 1 plan:** `review/cancellation-premium-plan.md` — read it first; this file does not repeat its research.

---

## 0. What Round 1 actually shipped (from the working-tree diff, not the summary)

| Item | Shipped? | Where |
|---|---|---|
| E1 streak ladder (`collect2/3/4`) + `juice.miss()` + `juice.reset()` at 3 round-start sites | ✅ | `sfx.js:117-124`, `index.jsx:1535-1545,1612` |
| E2 real 10s warning cue (`warn`) | ✅ | `sfx.js:126-132`, `index.jsx:1303` |
| E3 "I'm ready" → `correct` | ✅ | `index.jsx:803` |
| C1 clear-celebration hold + `clearingRef` + the §1.10 `coachOpen` auto-win fix | ✅ | `index.jsx:603,980,1271-1278,1573-1590` |
| C4 dead juice wiring removed | ✅ | `index.jsx:1907,1932-1936` |
| B2 time-bar transition | ✅ | `cancelBoard2d.css:252-259` |
| B4 goal chip de-stickered | ✅ | `training.css:2157-2172` |
| B5 Survival cue card de-stickered | ✅ | `training.css:2511-2578` |
| B6 countdown numeral 0.85s → 0.34s | ✅ | `training.css:2485,2600-2603` |
| F2 `#5aa15a` → `var(--game-ok)` | ✅ | `training.css:6102` |
| C2 clear-animation easing retune | ❌ not built | `cancelBoard2d.css:66-75` |
| C3 wrong-tap local settle | ❌ not built | — |
| E4 countdown phrasing | ❌ not built | `index.jsx:1411,1415` |
| B1 board plate | ❌ deferred | — |
| B3 −3s penalty chip | ❌ not built | — |
| A1–A6, D1–D3 | ❌ not built | — |

Round 1's work is good and the C1 hold is the right shape, but it shipped six defects, two of which a player hears on the first round they play (Group R below).

---

## 1. QA pass — findings (condensed; see build plan for the full spec of each)

**Game feel:** R7 the solve-pulse plays silent and `win` lands 420ms later on the results screen, inverted. R6 the pulse is ~38px off-centre from the lattice. R8 pieces stay interactive/focusable during the hold. C2/C3 still outstanding (clear-animation easing, wrong-tap settle). Clear-path parity across Level/Survival/Pass-n-Play verified fine by reading the code.

**Audio:** R1 the 10s warning fires on frame one of 9 ladder levels + 3 Survival stages (boards ≤10s), and re-arms on every pause/coach-resume. R2 `warn`'s falling interval already means "wrong" in this palette; retune to a stationary pitch. E4 countdown is still `click×3`+`collect` — `collect` is the hit sound, playing it on GO teaches the wrong association. Assessment plays `win`/`click` between trials while the staircase plays flat `click` — inconsistent, **owner question**, not built without approval.

**Visual/design-system:** `cancelPlanetPath.css` carries the game's only remaining raw-colour debt (3, per baseline) — A1 removes it. `.ct-fq-bar-chip`/`.ct-fq-cue-*` reconfirmed cancellation-exclusive by grep.

**Accessibility:** R5 Round 1's cue-ready-label change regressed contrast to 2.16:1 (was 16.2:1) — real WCAG fail, fixed by going flat instead of gradient. R3 no `prefers-reduced-motion` guard exists anywhere for the new solve-pulse/countdown/cue-pop animations. X2 `role="grid"` on the board is malformed ARIA (no row/gridcell descendants) — should be `role="group"`. X3 the goal chip (the single most important on-screen fact) is `aria-hidden` with no text alternative anywhere — needs an optional `targetAriaLabel` prop on the shared `PlayHud`. X4 the Survival ready button claims `aria-modal` with no focus management.

**Bilingual:** X1 eleven dead `UI` keys (both EN+AR) state stale "100 levels per tier" claims from before the ladder migration — delete them. Everything else checked (coach script, hub strings, survival cues) is correct.

**Performance:** nothing WebGL-adjacent; the planet path's 60 always-painted nodes are the one real cost on a low-end device — `content-visibility: auto` (A7) fixes it in 3 lines.

**Edge cases:** R4 the 420ms celebration `setTimeout` is never cleared — an unmount mid-hold still fires `persistLevel`/`awardLadderWin` against a dead component. Quit-during-hold and pause-during-hold traced safe-by-luck / survivable-but-ugly respectively. Pass-n-Play's cold start (no countdown/cue) flagged as an **owner question**, not a bug.

**Coach integrity:** the `data-coach="goal"` anchor's outer box is provably unchanged (border-box sizing absorbed the 2px→1px change internally) — verified by reading, not assumed. Coach script's 8 steps re-read and remain true after both rounds.

**Level-select / results:** full opinionated recommendation given — **build A1–A7** (colour bands from tokens, a trail that touches the planets, land-on-your-node, real glyphs, band captions, perf). **Build D1/D2** (personal best, mechanic-unlock note). **Do NOT build D3** (medal-emoji replacement) — it's a pattern shared byte-for-byte across 7 games; fixing one makes the platform less consistent, reversing Round 1's plan on this point.

**The B1 board plate — recommendation: BUILD IT**, with an owner-readable paragraph on the tradeoff (see the full review text) and an exact token-only spec. Ship behind a screenshot regardless.

---

## 2. Round 2 build plan (order: R → C → B → E → A → D → X)

### Group R — Round-1 regressions (all S)
- **R1** proportional warn threshold (`30%` of the round's own time limit, clamped 3–10s); move `warned10Ref` reset out of the timer effect into the 5 round-start sites.
- **R2** retune `warn` to two stationary A3 pulses (no glide) — a falling interval already means "wrong" in this palette.
- **R3** add a `prefers-reduced-motion` block covering the solve-pulse, countdown pop and cue pop (none existed).
- **R4** store the celebration `setTimeout` in a ref; clear it on unmount and in `clearPlayRoundState`.
- **R5** `.ct-fq-cue-ready-label` → flat `--game-accent` bg + `--game-ink` text (2.16:1 → 7.01:1).
- **R6** re-centre the solve-pulse on the lattice (it renders ~38px high today).
- **R7** play `win` at the *start* of the hold, not after it; suppress the redundant `click` when Survival's next cue card follows a win.
- **R8** mirror `clearingRef` into render state so pieces visibly/actually disable during the hold.

### Group C — feel (both S)
- **C2** retune the clear animation to `cubic-bezier(0.05,0.7,0.1,1)`, smaller overshoot.
- **C3** a local 160ms lateral settle on a wrongly-tapped tile only (not a board shake); on during the coach, off in assessment/reduced-motion.

### Group B — board & HUD
- **B1 (M)** the board plate — `.cb2d-grid::before`, token-only, layout-neutral, scoped away from the transparent `.cb2d-wrap`.
- **B3 (S/M)** a `−3s`/`−٣ث` chip on a penalty, bilingual, suppressed during the coach, never logged to trialLog.

### Group E — audio (both S)
- **E4** countdown phrasing (`count1/2/3` rising, GO plays `correct` not `collect`).
- **E6 — owner question, not built without approval**: make the assessment's between-trial sound match the staircase's flat neutral `click`.

### Group A — the planet path (the visible jump)
- **A1 (M)** band colours from `color-mix(var(--game-accent), var(--game-item))` — removes the game's last raw-colour debt.
- **A2 (M)** an SVG trail built from the real node coordinates, `vector-effect: non-scaling-stroke`.
- **A3 (S)** land on the player's current node on mount, instantly (never smooth-scrolled).
- **A4 (M)** Kawkab walks between planets after a clear — session-lifetime only, deferred to a later iteration (highest complexity/risk item in group A).
- **A5 (S)** real SVG glyphs instead of emoji/text; `t·s` sublabel only on the current node; bilingual `aria-label`s; `aria-current` on the current node.
- **A6 (M)** band-chapter captions from `FQ_MECHANIC_LABELS` — deferred to a later iteration (needs prop plumbing from `FQ_LADDER`).
- **A7 (S)** `content-visibility: auto` on off-screen nodes.

### Group D — results (both S)
- **D1** acknowledge a beaten Survival personal best.
- **D2** name the mechanic that just unlocked at a band boundary.
- **D3 — NOT BUILT.** Shared 7-game emoji pattern; a platform ticket, not a single-game fix.

### Group X — hygiene / accessibility (all S)
- **X1** delete 11 dead `UI` keys (EN+AR) carrying stale pre-ladder claims.
- **X2** `role="grid"` → `role="group"` on the board (malformed ARIA today).
- **X3** optional `targetAriaLabel` prop on shared `PlayHud` (backward-compatible), wired from cancellation.
- **X4** focus the Survival ready button on mount (it claims `aria-modal` with no focus management).

## Explicit non-goals (unchanged from Round 1, plus)
Curve/content data · assessment & adaptive presentation (except the flagged owner question) · `CancelTaskCoach.jsx` content · `PlayResults.jsx` internals · `.cb2d-wrap` transparency · `.ct-domain-game-stage` scroll/overscroll · board entrance/exit motion during live play · any new binary asset · re-adding `particle`/`rtFx`/`shake` to the juice kit · **D3** (platform ticket) · `PlayHud`'s inline hex time-bar gradients (shared ticket) · `.ct-fq-btn-pri`'s inherited contrast issue (shared, 18 games) · `TrainingScreens.jsx`'s hardcoded class (platform ticket).

---

## 3. Verification checklist (Rounds 1 and 2 combined)

Gates: `audit:fq`, `audit:pacing`, `audit:curves`, `audit:coach`, `audit:consistency`, `audit:design` (expect `cancelPlanetPath.css` 3→0), `audit:gamekeys`, `lint`.

On-screen (screenshot, not computed style): tutorial mid-lesson clear must not end the round; no warning sound on an 8s board; warning fires once per round even across pauses; ring+win+tile-settle all start together and the ring is centred; wrong tap settles the tile and drops a `−3s` chip in the right language; board plate frames correctly at 390×844 on the densest board in both themes; planet path opens on the current node with a connected coloured trail; results show a beaten-PB callout and a mechanic-unlock note where applicable; `prefers-reduced-motion` turns off every new animation while keeping the hold and all sound; screen reader announces the goal chip's target and the board as a labelled group.

Strings: grep the Arabic half after any text edit.

---

## 4. If only four things ship
**R1** (alarm stops firing at round start), **R7** (the clear finally has a sound), **B1** (the board becomes an instrument), **A1–A3** (the map says where you are, in colours that mean something).

**Two things for the owner:** the B1 plate tradeoff (see full review), and the assessment audio tell at `index.jsx:1178`. One open question: should Pass-n-Play get a countdown like the other two modes?

---

## 5. What Round 2 actually shipped (this loop iteration, 2026-09-11)

Built: **R1–R8** (all 8 regressions), **C2, C3**, **B1** (the board plate — owner should look and veto if wrong), **B3** (the `−3s` chip), **E4** (countdown phrasing), **X1–X4** (all four hygiene/a11y items), plus a bonus item the owner asked for mid-build: a coded (not raster) premium background for the planet-path screen — an AI-generated image was tried first via the free Pollinations endpoint and rejected on sight (visible third-party watermark, too photographic/high-contrast to sit under 60 nodes); shipped instead as a flat token-driven ground + star-glint dots in `cancelPlanetPath.css`, deliberately NOT reusing the app's old `--universe-*` dusk gradient (that palette is explicitly retired in `global.css` for breaking caption contrast).

**Not built this round** (left for the next iteration): **A1–A2, A4, A6** (band colours, connected trail, Kawkab walking, chapter captions — the level-select screen's remaining visual work; A3/A5/A7 shipped as a side effect of nothing — actually not started either, correction: none of Group A's node/trail logic shipped, only the container background), **D1–D2** (results callouts), **E6** (assessment audio consistency — owner question, not approved).

All 8 gates re-verified green after this build: `audit:fq`, `audit:pacing`, `audit:curves`, `audit:coach`, `audit:consistency` (cancel-task still 19/22 · 8/8 depth · 6/6 look), `audit:design` (484 findings, none worse than baseline), `audit:gamekeys`, `lint` (0 errors). `npm run build` run as a final syntax/bundle check.

**Still needs a human eye, not a gate:** every item in §3's "on the screen" checklist — nothing here has been visually screenshotted yet (browser automation unavailable this session).
