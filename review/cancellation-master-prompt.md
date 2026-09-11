# Cancellation (`cancel-task`) — MASTER PROMPT: "The Inked Atlas"

**Written:** 2026-09-11 · Opus, after `ui-ux-pro-max` (design-system + gsap-motion + ux-animation domains), a full read of Rounds 1–4, and a read of the current code in `src/features/training/domains/attention/games/cancellation/`.
**Audience:** the builder (Sonnet), executing start to finish, no further back-and-forth.
**Status of prior docs:** `cancellation-premium-plan.md` (R1), `-round2.md`, `-round3.md`, `-round4.md`, `cancellation-todo.md` are **history, not instructions**. Everything they shipped stays. This file supersedes their open TODO lists.

---

## 0. The finding that justifies this round

Four rounds of premium work never opened the **first screen of the game**.

`src/features/training/shared/ModePlanetHub.jsx` renders three mode buttons from `public/Assets/mode-planets/{survival,levels,passplay}.webp`. I opened them. They are **photorealistic rendered planets** — volumetric cloud bands, specular limb glow, a starfield plate, cast shadow. That is precisely the art language Round 4 stripped out of the level-select screen and out of the Survival cue card, on the grounds that this game's own written, tracked art direction (`public/Assets/training/cancel-cosmic-atlas-2026/README.md`) *"explicitly prohibited … photorealism, gradients, and cast shadows."*

So the game today reads, in flow order:

| Screen | Art language |
|---|---|
| Mode pick | **photorealistic rendered spheres** ← never examined |
| Level select | hand-inked flat vector (Round 4) ✅ |
| Countdown / cue | hand-inked flat vector (Round 4) ✅ |
| Live board | hand-inked flat vector stimuli, on a cream watercolour domain背景 ✅ |
| Results | no art at all — a `✓` in a `<span>` |

One tap into the game and the player has already crossed two art directions. That is the whole "it doesn't feel like one thing" complaint, and it is fixable in one component, with **zero new assets**, using the 43 pieces already tracked.

Everything else in this brief follows from the same idea.

---

## 1. The creative direction — one paragraph

**Cancellation is a hand-inked star atlas that you play inside.** Every screen is a page of the same printed atlas: warm paper, crisp navy contours, coral and turquoise and gold, drawn flat with a confident hand and no fake light. The menu is the atlas's cover plate. The level map is its fold-out chart, with six named chapters and a small astronaut walking the route you have actually cleared. The countdown is the page turning. The board is the plate you work on, laid flat and lit evenly, because that is what a measuring instrument looks like. And when you clear a board, the paper itself acknowledges it — a green ring spreads out of the plate, a chord rings for exactly as long as the ring takes, and the results page arrives on the last note of it rather than after a cut. Nothing in the game is dark in one place and light in another, nothing is drawn in two styles, and nothing moves while the clock is running. It is one object, made by one hand.

---

## 2. Hard constraints — read before writing a line

1. **The live board's stimulus tiles do not change.** No change to difficulty, curve, timing, tile geometry, tile size, tile spacing, or the contrast of the pieces against their plate. Do not touch `assessmentData.js`, `staircase.js`, `focusQuestData.js`'s curves, `FQ_LADDER`, `TC[]`, time limits, error caps. `audit:fq` certifies this exact geometry.
2. **No motion behind a live, timed search trial.** While `playStep === 'running'` with targets on screen, nothing new may move, flash or shift attention. §5.9 gives the complete motion inventory with its gate condition — obey that table literally.
3. **No WebGL, no 3D, no particle engine, no new npm dependency.** There is no GSAP in this repo; the motion values below are CSS `cubic-bezier` translations of the GSAP presets the design DB returned. CSS/SVG/DOM only.
4. **Assessment and Adaptive stay visually neutral and feedback-free.** Every new visual or audio beat must be gated off `(round.mode === 'assess' || round.mode === 'adaptive')`. Ground/typography changes are neutral and allowed; hero art, celebration, band captions and results callouts are **not** allowed on those screens.
5. **Bilingual EN/AR in the same edit.** Every new string gets both halves in one edit, in the same object literal where possible, and `dir`-safe CSS (`inset-inline-*`, `margin-inline`, `padding-inline` — never `left`/`right` on chrome). After the edit, `grep` the Arabic half. This repo's single most repeated bug is an English fix forty lines from its unedited Arabic twin.
6. **Zero new binary assets.** Everything visual here comes from the 43 tracked pieces in `cancel-cosmic-atlas-2026/`. If you believe a new asset is needed, stop and say why the 43 cannot cover it — do not generate one.
7. **The coach must keep working.** `CancelTaskCoach.jsx` anchors to `[data-coach="goal"]` (the HUD target chip) and to real board cells via `boardApiRef`. §5.7 names exactly what you may and may not change on that chip. After building, **open the game and run all eight coach steps by hand.** `audit:coach` cannot see reachability.
8. **No new colour literals.** `--fx-*` is exempt; nothing else is. `audit:design`'s rule (scripts/audit-design.mjs:143-150) flags any `#hex`/`rgb()`/`hsl()` on a line **that does not also mention** `--game-`, `--play-`, `--surface`, `--ink`, `--line`, `--accent`, `--fx-`. Every value in this brief satisfies that. `color-mix(in srgb, var(--token) N%, …)` is the approved construction.
9. **`.cancellation-task-game` is NOT a cancellation-only scope.** `TrainingScreens.jsx:39` hardcodes that class onto *every* game's `TrainingScreenShell`. Scoping new CSS to it leaks into other games. §5.1 creates the real scope.

---

## 3. What is already right — do not rebuild it

Round 1–4 shipped these and they are correct. Leave them alone except where a step below names them:

- The audio cue ladder (`collect`/`collect2/3/4`, `warn`, `count1/2/3`) and all its gating.
- The celebration hold + `clearingRef` + `coachOpenRef` guards + the Pause/Quit lockout during the hold.
- `.cb2d-grid::before` — **the board plate. This is the reference object for the whole chrome system below.** Its interior fill stays flat. Never move the plate onto `.cb2d-wrap` or `.ct-fq-g-wrap--scene2d` (both forced transparent, hard-won 2026-09-08).
- The live-board scrim values (light 55% / dark 65%).
- `.ct-fq-cue-ready-label`'s flat `--game-accent` + `--game-ink` pill (7.01:1 — a fixed WCAG regression, do not "improve" it).
- `CancelPlanetPath`'s atlas nodes, SVG trail, land-on-your-marker, SVG glyphs, `content-visibility`, `aria-current`.
- Every `prefers-reduced-motion` block that already exists.

---

## 4. Design-system decisions — firm, not advisory

### 4.1 Hero art placement — where the atlas is actually seen

Currently the atlas appears at **56 px** (level-select nodes), **52/132 px** (cue chips) and as a 340 px background wash. Nowhere else. The DB's product guidance for this category (Two Dots: *"uses the levels like a sightline to follow"*; Peak: *per-game thematic identity, not app chrome*) says the art belongs on the **navigation and reward** surfaces. Fixed assignment:

| Surface | Piece | Size | Role |
|---|---|---|---|
| Menu hero mark | `galaxy` | 148 px (120 px < 420 px) | the game's emblem |
| Mode card — Survival | `astronaut-suit` | 132 px (84 px on phone rows) | one figure, one life |
| Mode card — Levels | `launch-tower` | 132 px / 84 px | a structure you climb |
| Mode card — Pass n Play | `docking-hub` | 132 px / 84 px | arms meeting at a centre |
| Level-select band 1–6 marks | `star`, `comet`, `meteor-cluster`, `nebula-bolt`, `warp-gate`, `supernova` | 34 px | chapter sigils |
| Results — win mark | `supernova` | 64 px | replaces the `✓` glyph |
| Results — retry mark | `comet` | 64 px | replaces the `↻` glyph |
| Results — next-band callout | that band's sigil | 44 px | what you just unlocked |
| Survival cue backdrop | `galaxy` (already wired) | `clamp(280px, 72vw, 460px)` | unchanged wiring, bigger |

**⚠ Resolution ceiling: 148 px.** The source files are 256×256. At 148 CSS px on a 3× screen you are upscaling 444/256 — acceptable for flat inked vector, visibly soft beyond that. **Never render an atlas piece above 148 px.** Where a screen needs more presence, compose *several* pieces rather than enlarging one.

**⚠ Never pre-cue a search.** Level-select nodes already cycle by position, never by the round's target shape. Hold that rule for band sigils: they are fixed per band index, never derived from `round.target`.

### 4.2 Motion language — "Orbit"

Four easings, four durations, one stagger. Nothing in this game may use a duration or easing not in this table.

```css
/* easings — CSS equivalents of the GSAP presets the design DB returned */
--cx-ease-enter:  cubic-bezier(0.16, 1, 0.30, 1);     /* expo.out   — something arriving */
--cx-ease-exit:   cubic-bezier(0.55, 0, 1, 0.45);     /* expo.in    — something leaving  */
--cx-ease-move:   cubic-bezier(0.65, 0, 0.35, 1);     /* power2.inOut — travelling A→B   */
--cx-ease-settle: cubic-bezier(0.34, 1.28, 0.64, 1);  /* back.out(1.28) — ONE object landing */

/* durations — four rungs, nothing between them */
--cx-t-tap:    120ms;   /* a state change under a finger */
--cx-t-item:   240ms;   /* one element arriving */
--cx-t-screen: 380ms;   /* a whole screen arriving */
--cx-t-hold:   620ms;   /* the celebration hold — see §4.6, this number is derived, not chosen */

--cx-stagger:   45ms;   /* cap the run at 6 items; beyond that the tail reads laggy */
```

Governing rules:
- **`--cx-ease-settle` is for objects, never for text.** Overshoot on a word reads as sloppy (design DB, Stagger List "Don't").
- **Exits are 0.58× their enter** (`380 → 220ms`). Asymmetric on purpose — back/forward must feel snappier than forward (design DB, Page Transition Subtle "Performance Notes").
- **No exit animation on a React screen swap.** That means holding the outgoing screen alive and delaying the incoming one — latency dressed as polish. `training.css:59` already says this. The only two things that carry across a screen boundary are §4.6's two carries, and both animate something that is *already* on its way out.
- **Nothing infinite except two decorations**, both already shipped and both off-screen from any trial: `cpp-pulse` (current node) and `cpp-bob` (Kawkab). Do not add a third.
- **Transform and opacity only.** Never animate `width`, `height`, `top`, `left`, `margin`, or a `background-image`.
- **Every animation added gets a `prefers-reduced-motion: reduce` branch in the same block.**

### 4.3 Chrome system — ONE recipe, five tiers

Round 4 found five to six independently-invented border/elevation formulas. Here is the single system. **Every chrome object in this game is exactly one of these tiers. There is no sixth thing.**

| Tier | What it is | Radius | Border | Shadow | Ground |
|---|---|---|---|---|---|
| **1 Plate** | the surface you perform on, or a full card | `--cx-r-plate` 26px | `--cx-edge-plate` | `--elev-raise` | `--play-surface-flat` (+ `--play-surface` image where it is the board) |
| **2 Object** | something holding one piece of information you look at | `--cx-r-object` 20px | `--cx-edge-object` | `--elev-raise` + `--cx-ring-hot` | `--play-surface-flat` |
| **3 Pill** | a label or an action | `--cx-r-pill` 999px | `1px solid var(--game-accent-edge)` | `--elev-rest` | `--game-accent` |
| **4 Readout** | a number you glance at mid-task | `--cx-r-readout` 12px | `--cx-edge-readout` | none | `--cx-ground-quiet` |
| **5 Pressed** | the `:active` of 1–3 | — | — | `--elev-press` | — |

**The radius ladder is 26 / 20 / 12 / 999 and nothing else.** Today this game uses 28, 30, 26, 20, 16, 12, 11, 10, 8, 7, 50% and 999 — that spread is most of why it reads as assembled rather than designed. The one permitted exception is `border-radius: 50%` on `.cpp-orb`, because a planet is round; it still takes Tier 2's border and shadow.

**Press sinks, never slides or scales away.** `box-shadow: var(--elev-press)` plus at most `transform: scale(0.985)`. `translate(2px,2px)` is banned platform-wide (CLAUDE.md).

**No bevels.** `.cpp-orb-rim` currently paints `inset 0 2px 4px var(--fx-glint), inset 0 -6px 10px var(--fx-shadow-drop)` — a bevel, which the atlas README explicitly prohibits. It is deleted in §5.5.

### 4.4 Type — two voices and a clock

`index.html` loads **Outfit** 300–900, **DM Mono** 400/500, **Cormorant Garamond**, **Cinzel**, and **Cairo** 400–900 (Arabic). Use them with more confidence than the game currently does:

- **Cormorant Garamond — the voice of the world.** Screen titles, the hero title, mode names. Never a number, never a label, never a button.
- **Outfit — the voice of the instrument.** Every caption, label, blurb, sentence and button.
- **DM Mono 500 — the voice of the clock.** All live HUD readouts, the countdown numeral, the results headline number, the level-select node sublabel. This is the confident move: a monospace figure does not jitter as it counts (the HUD re-renders at 10 Hz), and it instantly reads as instrumentation rather than arcade. It is already loaded; cost is zero. `audit:consistency`'s look rule only requires a rendered font be one `index.html` loads — DM Mono qualifies.
- **Cairo replaces both Latin families under `[dir='rtl']`**, at one weight step heavier (Cairo runs light against Outfit). Arabic numerals in the HUD stay DM Mono — Arabic-Indic digits are already handled by `toLocaleString('ar-EG')` at the call sites and render fine in Cairo; where a string mixes them, use `'Cairo','DM Mono',monospace`.

The scale — one ladder, seven rungs:

```css
--cx-fs-hero:   clamp(2.4rem, 9vw, 3.4rem);   /* Cormorant 700, ls -0.01em, lh 1.02 */
--cx-fs-title:  clamp(1.3rem, 5vw, 1.75rem);  /* Cormorant 600, ls 0.06em, lh 1.2  */
--cx-fs-lead:   1rem;                          /* Outfit 500, lh 1.5   */
--cx-fs-body:   0.875rem;                      /* Outfit 450, lh 1.55  */
--cx-fs-label:  0.62rem;                       /* Outfit 700, ls 0.14em, uppercase */
--cx-fs-num-lg: 2.6rem;                        /* DM Mono 500 */
--cx-fs-num:    clamp(0.8rem, 3.2vw, 1.05rem); /* DM Mono 500 */
```

**Kill the letterpress.** `.ct-fq-hub-attn-big` (training.css:839-855) carries a six-layer stacked `text-shadow` (`0 1px 0 #e0b04a, 0 2px 0 #c99430, 0 3px 0 #b07e22, 0 4px 0 #956a1c, 0 5px 0 #7a5816, …`) plus a `-webkit-text-stroke`. That is the single loudest remaining "children's toy" signal in this game. Scoped override in §5.3.

**Never italic.** `.ct-fq-training-blurb` sets `font-style: italic` on every blurb in the game. Italic Outfit at 0.82rem is a legibility loss with no expressive gain. Scoped override to normal.

### 4.5 Colour — no new tokens, two firm role changes

Nothing new enters the palette. Two role reassignments, both inside this game only:

1. **Numbers go ink; amber is reserved for state.** `.cx-atlas { --fq-pdk: var(--game-ink); --fq-mut: color-mix(in srgb, var(--game-ink) 72%, var(--play-surface-flat)); }`
   This fixes a real WCAG failure the last two rounds flagged and correctly refused to fix at the platform token: `--fq-pdk` (#c98a2e) on the HUD chip ground measures **1.75:1**; `--game-ink` measures **10.1:1** and the derived `--fq-mut` measures **5.0:1**. It does **not** fix the other 17 games — their platform ticket stands, unchanged and still open.
2. **This game is theme-invariant end to end.** The play surface and the whole `--game-*` family are already fixed light in both themes by deliberate design (tokens.css:139-174 — background luminance is a measurement parameter, not a preference). Everything *else* in the game flips with `--universe-*`, which is exactly why three rounds produced dark-theme contrast bugs (the goal chip, the cue-ready label). Under `.cx-atlas`, every ground becomes `--play-surface-flat` and every ink becomes `--game-ink`. That closes the whole bug class permanently and makes the game read as one printed object rather than two.
   **⚠ Flag to the owner:** this makes the mode-pick screen light where it is currently near-black. One-line revert is named in §5.3.

### 4.6 The two carries — the only things that cross a screen boundary

**Carry A — the veil lift (countdown → play).** Today the countdown overlay is unmounted and the board simply exists. Instead: the overlay gets `.is-leaving` for 220 ms (`opacity 1→0`, `scale(1)→scale(1.04)`, `--cx-ease-exit`) **before** `playStep` becomes `'running'`. The board underneath is already laid out and completely static; the veil lifts off it. Motion is on the departing overlay only, it completes before the clock starts, and it costs no measured time. Level / Survival / Pass n Play only — never assessment's fixation cross.

**Carry B — celebration → results.** This is the highest-emotion moment in the game and it is currently a hard cut. It becomes one event in three layers with a *derived* duration:

> `CUES.win` is a four-note arpeggio whose last voice starts at `at: 0.21s`, runs `dur: 0.38s`, and is stopped at `t + dur + 0.04` — **630 ms total**. So the hold is **620 ms**, not 420, because that is the length of the sound. The results screen arrives on the chord's last ring instead of half a second after it ended.

- `t=0` — last target falls. `stopTimer()`, `clearingRef`, `playSfx('win')`, `juice.celebrate()` (all already there). The **board plate blooms**: `.cb2d-grid::before` transitions its border toward `--game-ok` and gains an outer `--cx-ring-done`-style ring over 300 ms `--cx-ease-enter`. Colour and shadow only — **no transform, no geometry change, nothing under a tile moves.**
- `t=0–620` — the solve pulse ring spreads. Retime it from 500 ms to `var(--cx-t-hold)` so ring and chord end together.
- `t=620` — results mounts. The existing `.ct-play-results-card` rise (340 ms) runs as-is, but the **mark blooms with zero delay** so the atlas `supernova` lands on the chord's tail rather than after it.

That is the sound-visual sync check in §7: **one event, three layers, one duration, derived from the audio.**

---

## 5. The build sequence

Execute in order. Each step names the file, the selector, the value and the copy. Do not reorder — later steps depend on tokens declared in earlier ones.

### Step 0 — Screenshot the game as it is, first

This is the standing #1 risk carried by all four prior rounds: *nothing in this entire effort has ever been seen on a screen.* Before you change one character:

- Invoke the `claude-in-chrome` skill. **One** Chrome instance, not six (CLAUDE.md: a six-profile session BSOD'd this machine with `INTERNAL_POWER_ERROR`). Launch with `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`.
- **Wait on an element, never on a clock** — swiftshader is slower and fixed waits have produced false "broken" reports here before.
- Capture, at **390×844** and **1366×633**, in **both themes**: hub · mode pick · level select (top and scrolled to a mid-band node) · Survival cue card · countdown · live board at the densest level · a cleared board mid-hold · level results · Survival results · Pass n Play results.
- Keep them. You will diff against them in §7.

### Step 1 — The scope class and the token block

**1a.** `index.jsx:1837` — add `cx-atlas` to the root:
```jsx
className="cancellation-task-game ct-fq-root cx-atlas"
```
`.cancellation-task-game` is worn by every game via `TrainingScreens.jsx:39`, and `.ct-fq-root` is also worn by Word Maze. `.cx-atlas` is this game's only true scope, and every phase — hub, mode pick, level select, play, all four results screens — renders inside it.

**1b.** Create `src/features/training/domains/attention/games/cancellation/cancelAtlas.css` and import it from `index.jsx` beside the existing CSS imports. Head of file:

```css
/* ── THE INKED ATLAS — Cancellation's design system ────────────────────────
 * ONE scope (.cx-atlas), ONE motion language, ONE chrome recipe, ONE type
 * ladder. Everything premium about this game is declared here or derives
 * from here. If you are about to invent a sixth border recipe or a fifth
 * duration, the answer is already in this file.
 *
 * ⚠ --cx-* is NOT --fx-*, so audit:design's raw-colour rule DOES apply.
 * Every value below either contains no colour at all or references a token
 * (--game-*/--play-*/--line/--accent), which is what satisfies the rule
 * (scripts/audit-design.mjs:143-150). Never write a literal here.
 */
.cx-atlas {
  /* motion — §4.2 */
  --cx-ease-enter:  cubic-bezier(0.16, 1, 0.30, 1);
  --cx-ease-exit:   cubic-bezier(0.55, 0, 1, 0.45);
  --cx-ease-move:   cubic-bezier(0.65, 0, 0.35, 1);
  --cx-ease-settle: cubic-bezier(0.34, 1.28, 0.64, 1);
  --cx-t-tap:    120ms;
  --cx-t-item:   240ms;
  --cx-t-screen: 380ms;
  /* 620ms is CUES.win's own length (last voice at 0.21 + dur 0.38 + 0.04
     tail = 630ms). The results screen lands on the chord's last ring. */
  --cx-t-hold:   620ms;
  --cx-stagger:   45ms;

  /* chrome — §4.3 */
  --cx-r-plate:   26px;
  --cx-r-object:  20px;
  --cx-r-readout: 12px;
  --cx-r-pill:   999px;
  --cx-edge-plate:   1px solid color-mix(in srgb, var(--game-ink) 22%, var(--line));
  --cx-edge-object:  1px solid color-mix(in srgb, var(--game-ink) 55%, transparent);
  --cx-edge-readout: 1px solid var(--line);
  --cx-ring-hot:  inset 0 0 0 2px color-mix(in srgb, var(--game-accent) 28%, transparent);
  --cx-ring-done: inset 0 0 0 2px color-mix(in srgb, var(--game-ok) 62%, transparent);
  --cx-ground:       var(--play-surface-flat);
  --cx-ground-quiet: color-mix(in srgb, var(--play-surface-flat) 88%, transparent);

  /* type — §4.4 */
  --cx-fs-hero:   clamp(2.4rem, 9vw, 3.4rem);
  --cx-fs-title:  clamp(1.3rem, 5vw, 1.75rem);
  --cx-fs-lead:   1rem;
  --cx-fs-body:   0.875rem;
  --cx-fs-label:  0.62rem;
  --cx-fs-num-lg: 2.6rem;
  --cx-fs-num:    clamp(0.8rem, 3.2vw, 1.05rem);

  /* colour roles — §4.5. Numbers go ink; amber is reserved for state.
     --fq-pdk was #c98a2e at 1.75:1 on this ground; --game-ink is 10.1:1. */
  --fq-pdk: var(--game-ink);
  --fq-mut: color-mix(in srgb, var(--game-ink) 72%, var(--play-surface-flat));
}
```

**1c.** In the same file, the one reusable ground (promoted out of `cancelPlanetPath.css`, which will now use this class instead of duplicating it):

```css
/* The atlas page: warm paper with a light dusting of star-glints.
   Fixed light in BOTH app themes — the whole gameplay palette already is
   (tokens.css:139-174), and this is what stops the game changing key
   between its menus and its board. */
.cx-page {
  background-color: var(--play-surface-flat);
  background-image:
    radial-gradient(1.6px 1.6px at 18% 6%,  var(--fx-glint) 0%, transparent 60%),
    radial-gradient(1.2px 1.2px at 62% 14%, var(--fx-glint) 0%, transparent 60%),
    radial-gradient(1.8px 1.8px at 82% 44%, var(--fx-glint) 0%, transparent 60%),
    radial-gradient(1.2px 1.2px at 34% 66%, var(--fx-glint) 0%, transparent 60%),
    radial-gradient(1.5px 1.5px at 8%  86%, var(--fx-glint) 0%, transparent 60%),
    radial-gradient(1.3px 1.3px at 92% 92%, var(--fx-glint) 0%, transparent 60%);
  background-size: 240px 240px;
  background-repeat: repeat;
}
```

**1d.** Re-key the screen entry to the game's own rhythm (shared default untouched):
```css
.cx-atlas .ct-fq-screen { animation: cx-screen-in var(--cx-t-screen) var(--cx-ease-enter) both; }
@keyframes cx-screen-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .cx-atlas .ct-fq-screen { animation: none; } }
```
**⚠ Opt the level-select out of it:** `.cx-atlas .ct-lv-grid-wrap { animation: none; }` at a later point in the file. `CancelPlanetPath` runs `scrollIntoView` in `useLayoutEffect`, and a live `translateY(12px)` on an ancestor shifts the measured rect. The level select gets its own entry beat in Step 5 instead.

### Step 2 — Make the game one ground

**2a.** In `cancelAtlas.css`:
```css
/* The mode hub was near-black (#12090a via .ct-fq-training-shell--mode-cosmos
   + global.css's :has() rules). The atlas is drawn with NAVY CONTOURS: on a
   dark ground the contour merges into the ground and the pieces lose the
   inking that IS the art direction. One paper ground, six screens. */
.cx-atlas .ct-fq-training-shell--mode-cosmos,
.cx-atlas .ct-fq-training-shell--hub-light {
  background: none !important;
  color: var(--game-ink) !important;
}
.cx-atlas .ct-fq-training-shell--mode-cosmos,
.cx-atlas .ct-fq-training-shell--hub-light { /* second block so .cx-page can layer */ }
```
Then apply `.cx-page` to the shells by adding the class in JSX (preferred over another `!important` fight): `index.jsx:1842`, `1927`, `2119`, `2162`, `2189`, `2244`, `2318`, `2375`, `2516` — append `cx-page` to each `ct-fq-training-shell …` className. And in `CancelPlanetPath.jsx`, pass `shellClassName="cx-page"` to `TrainingScreenShell`.

**2b.** Beat the full-bleed `!important` in `global.css:282-290`, which paints `html`/`body`/`#screen-comics`/`#ui-shell` `#07060b` whenever a `--mode-cosmos` shell exists. Add to `cancelAtlas.css` — higher specificity via the `:has()` argument, so it wins without editing global.css:
```css
html:has(.cx-atlas .ct-fq-training-shell--mode-cosmos),
body:has(.cx-atlas .ct-fq-training-shell--mode-cosmos),
#screen-comics:has(.cx-atlas .ct-fq-training-shell--mode-cosmos),
#ui-shell:has(#screen-comics.active .cx-atlas .ct-fq-training-shell--mode-cosmos),
#screen-comics:has(.cx-atlas .ct-fq-training-shell--mode-cosmos) > div {
  background: var(--play-surface-flat) !important;
  background-color: var(--play-surface-flat) !important;
}
```
**⚠ Verify this in the browser, not by reading.** `:has()` specificity takes the most specific argument, so `html:has(.cx-atlas .ct-fq-…)` (0,2,1) beats `html:has(.ct-fq-…)` (0,1,1) — but Round 3's own `:has()` scrim rule is the one item in that round flagged as most likely to behave differently from the reading. Screenshot the hub with the browser window wider than the shell and confirm there is no dark band at the edges.

**ONE-LINE OWNER REVERT** (put this exact comment above 2a): *"To put the mode hub back on the black void, delete this block and `cx-page` from index.jsx:1842. Nothing else depends on it."*

### Step 3 — The menu / mode-pick screen: `CancelModeAtlas.jsx`

**3a.** Create `src/features/training/domains/attention/games/cancellation/CancelModeAtlas.jsx`.

**⚠ Do not edit `ModePlanetHub.jsx`.** It is shared via `TrainingScreens.jsx`'s `TrainingModeList`. This is a drop-in swap at **one call site** — the exact precedent `CancelPlanetPath` set for `TrainingLevelGrid`. Keep `ModePlanetHub`'s import in `TrainingScreens.jsx` untouched. Only `FqAttentionLightModes` (index.jsx:193-201) stops importing it.

Same prop contract: `{ items: [{k, lb, hint, on}], isAr, playSfx }`, keys `free | levels | chal`. Plus a header block.

Structure:
```jsx
<div className="cxm" dir={isAr ? 'rtl' : 'ltr'}>
  <div className="cxm-hero">
    <img className="cxm-hero-mark" src={atlasUrl('galaxy')} alt="" />
  </div>
  <div className="cxm-cards" role="group" aria-label={isAr ? 'اختر الوضع' : 'Choose a mode'}>
    {['free','levels','chal'].map((k, i) => (
      <button key={k} className="cxm-card" style={{ '--cx-i': i }}
              onClick={() => { playSfx?.('click'); byKey[k].on(); }}>
        <span className="cxm-card-art" aria-hidden="true">
          <img src={atlasUrl(ART[k])} alt="" loading="eager" />
        </span>
        <span className="cxm-card-copy">
          <span className="cxm-card-name">{byKey[k].lb}</span>
          <span className="cxm-card-hint">{byKey[k].hint}</span>
        </span>
      </button>
    ))}
  </div>
</div>
```
with `const ART = { free: 'astronaut-suit', levels: 'launch-tower', chal: 'docking-hub' };` and the same `atlasUrl` helper `CancelPlanetPath.jsx:47` already defines (export it from there, or duplicate the one-liner — do not add a third asset-path convention).

**3b.** CSS in `cancelAtlas.css`:
```css
.cxm { display: flex; flex-direction: column; align-items: center;
       gap: 22px; width: 100%; padding: 6px 16px 22px; box-sizing: border-box; }

.cxm-hero-mark { width: 148px; height: 148px; object-fit: contain; display: block;
                 filter: drop-shadow(0 10px 22px var(--fx-shadow-soft)); }
@media (max-width: 419px) { .cxm-hero-mark { width: 120px; height: 120px; } }

.cxm-cards { display: grid; gap: 12px; width: min(100%, 34rem); }
@media (min-width: 560px) { .cxm-cards { grid-template-columns: repeat(3, 1fr); gap: 14px; } }

/* Tier 1 Plate */
.cxm-card {
  display: flex; align-items: center; gap: 16px;
  min-height: 96px; padding: 14px 18px; width: 100%;
  border: var(--cx-edge-plate); border-radius: var(--cx-r-plate);
  background: var(--cx-ground); box-shadow: var(--elev-raise);
  cursor: pointer; font: inherit; text-align: start; box-sizing: border-box;
  transition: box-shadow var(--cx-t-tap) var(--cx-ease-enter),
              transform   var(--cx-t-tap) var(--cx-ease-enter);
  animation: cx-item-in var(--cx-t-item) var(--cx-ease-enter) both;
  animation-delay: calc(120ms + var(--cx-i) * var(--cx-stagger));
}
@media (min-width: 560px) { .cxm-card { flex-direction: column; min-height: 232px; justify-content: center; text-align: center; gap: 10px; } }

.cxm-card-art { display: grid; place-items: center; flex-shrink: 0;
                width: 84px; height: 84px; }
.cxm-card-art img { width: 100%; height: 100%; object-fit: contain; }
@media (min-width: 560px) { .cxm-card-art { width: 132px; height: 132px; } }

.cxm-card-name { display: block; font-family: 'Cormorant Garamond','Cinzel',serif;
                 font-weight: 600; font-size: var(--cx-fs-title);
                 letter-spacing: 0.04em; color: var(--game-ink); line-height: 1.15; }
.cxm-card-hint { display: block; margin-top: 4px;
                 font-family: 'Outfit', system-ui, sans-serif;
                 font-size: var(--cx-fs-body); font-weight: 450; line-height: 1.45;
                 color: var(--fq-mut); }

.cxm-card:active { box-shadow: var(--elev-press); transform: scale(0.985); }
.cxm-card:focus-visible { outline: 3px solid var(--game-ink); outline-offset: 3px; }
@media (hover: hover) {
  .cxm-card:hover { box-shadow: var(--elev-raise), var(--cx-ring-hot); }
  .cxm-card:hover .cxm-card-art { transform: translateY(-3px); transition: transform var(--cx-t-item) var(--cx-ease-enter); }
}

@keyframes cx-item-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .cxm-card { animation: none; } .cxm-card:hover .cxm-card-art { transform: none; } }

[dir='rtl'] .cxm-card-name { font-family: 'Cairo','Cormorant Garamond',serif; font-weight: 700; letter-spacing: 0; }
[dir='rtl'] .cxm-card-hint { font-family: 'Cairo','Outfit',sans-serif; font-weight: 500; }
```
Touch target: 96 px tall, full width — comfortably past the 44×44 minimum with 12 px spacing (design DB priority 2, CRITICAL).

**3c.** The hero title — kill the letterpress:
```css
.cx-atlas .ct-fq-hub-attn-big {
  font-family: 'Cormorant Garamond','Cinzel',serif;
  font-size: var(--cx-fs-hero); font-weight: 700;
  letter-spacing: -0.01em; line-height: 1.02;
  color: var(--game-ink);
  -webkit-text-stroke: 0;
  text-shadow: 0 2px 18px var(--fx-shadow-soft);
}
.cx-atlas .ct-fq-training-screen--hub .ct-fq-hub-attn-sub {
  font-family: 'Outfit', system-ui, sans-serif;
  font-size: var(--cx-fs-label); font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--fq-mut);
  background: none; border: 0; box-shadow: none; text-shadow: none; padding: 0; margin-top: 8px;
}
[dir='rtl'] .cx-atlas .ct-fq-hub-attn-big { font-family: 'Cairo','Cormorant Garamond',serif; font-weight: 800; letter-spacing: 0; }
[dir='rtl'] .cx-atlas .ct-fq-training-screen--hub .ct-fq-hub-attn-sub { font-family: 'Cairo','Outfit',sans-serif; letter-spacing: 0.04em; text-transform: none; }
```
No new strings — `hubAttentionWord` and `hubTrainingTag` already exist in both languages.

**3d.** Kill the italic and re-key the blurbs, game-wide:
```css
.cx-atlas .ct-fq-training-blurb,
.cx-atlas .ct-fq-training-screen .ct-fq-sub {
  font-family: 'Outfit', system-ui, sans-serif;
  font-style: normal; font-weight: 450;
  font-size: var(--cx-fs-body); line-height: 1.55;
  color: var(--fq-mut) !important;
}
.cx-atlas .ct-fq-training-title {
  font-family: 'Cormorant Garamond','Cinzel',serif;
  font-size: var(--cx-fs-title); font-weight: 600;
  letter-spacing: 0.06em; color: var(--game-ink); text-shadow: none;
}
```

### Step 4 — Chrome sweep: apply the tier table everywhere

All in `cancelAtlas.css`, all scoped to `.cx-atlas`. Do not edit `training.css` for any of these.

```css
/* Tier 2 Object — the goal chip.
   ⚠ COACH ANCHOR. data-coach="goal" is on this element and useDomAnchor
   measures its rect. You may change radius, border tint and shadow. You may
   NOT change width, height, padding, display or the attribute. 52x52 stays. */
.cx-atlas .ct-fq-bar-chip { border-radius: var(--cx-r-object);
  border: var(--cx-edge-object); box-shadow: var(--elev-raise), var(--cx-ring-hot); }

/* Tier 2 Object — the pre-round target chip */
.cx-atlas .ct-fq-cue-chip { border-radius: var(--cx-r-object);
  border: var(--cx-edge-object); box-shadow: var(--elev-raise), var(--cx-ring-hot); }

/* Tier 1 Plate — the Survival ready card, and its big chip becomes part of it */
.cx-atlas .ct-fq-cue-card--ready { border-radius: var(--cx-r-plate); border: var(--cx-edge-plate); }
.cx-atlas .ct-fq-cue-card--ready .ct-fq-cue-chip { border-radius: var(--cx-r-plate); box-shadow: none; }

/* Tier 4 Readout — the five HUD numbers */
@media (max-width: 899px), (max-aspect-ratio: 1/1) {
  .cx-atlas .ct-fq-gs { border-radius: var(--cx-r-readout); border: var(--cx-edge-readout);
    background: var(--cx-ground-quiet); box-shadow: none; }
}
.cx-atlas .ct-fq-gv { font-family: 'DM Mono', ui-monospace, monospace; font-weight: 500;
  font-size: var(--cx-fs-num); font-variant-numeric: tabular-nums; color: var(--fq-pdk); }
.cx-atlas .ct-fq-gl { font-family: 'Outfit', system-ui, sans-serif;
  font-size: var(--cx-fs-label); font-weight: 700; letter-spacing: 0.14em; color: var(--fq-mut); }

/* The countdown numeral joins the clock voice, keeps its 340ms (the step is 380ms) */
.cx-atlas .ct-fq-cd-num { font-family: 'DM Mono', ui-monospace, monospace; font-weight: 500;
  animation: ct-fq-cdpop 0.34s var(--cx-ease-settle); }

/* Tier 3 Pill — do NOT retouch .ct-fq-cue-ready-label's colours (7.01:1, a fixed
   WCAG regression). Only confirm radius 999 and --elev-rest, which it already has. */
```

### Step 5 — The level select becomes a chart with chapters

`CancelPlanetPath.jsx` + `cancelPlanetPath.css`.

**5a. Delete the bevel.** Remove `<span className="cpp-orb-rim" />` from the JSX and the `.cpp-orb-rim` rule from the CSS. The atlas README prohibits bevels; that rule is an inset bevel. Replace with Tier 2:
```css
.cpp-orb { border: var(--cx-edge-object); box-shadow: var(--elev-raise); }
.cpp-node--done .cpp-orb { box-shadow: var(--elev-raise), var(--cx-ring-done); }
.cpp-path { border-radius: var(--cx-r-plate); box-shadow: var(--elev-raise); }
```
Replace `.cpp-path`'s inline background block with `class="cpp-path cx-page"` in the JSX and delete the duplicated star-glint declarations from `cancelPlanetPath.css`.

**5b. Band chapters (Round 2's deferred A6).** `FQ_LADDER` is six bands of ten (`focusQuestData.js:499-510`). **Do not add a field to `FQ_LADDER`** — `audit:curves` reads it. Pass a `bands` prop from `index.jsx` instead.

New geometry in `CancelPlanetPath.jsx`:
```js
const ROW_H = 108;
const BAND_GAP = 56;       // breathing room where a chapter rule sits
const BAND_SIZE = 10;
const yOf = (i) => 56 + i * ROW_H + Math.floor(i / BAND_SIZE) * BAND_GAP;
const pathHeight = yOf(count - 1) + 74;   // 6782 at count=60
```
`viewBox={`0 0 100 ${pathHeight}`}` stays 1:1 — the trail maths is unchanged.

Render, before each band's first node, at `top: yOf(b * BAND_SIZE) - 34`:
```jsx
<div className="cpp-band" style={{ top: yOf(b * BAND_SIZE) - 34 }} key={`b${b}`}>
  <span className="cpp-band-rule" aria-hidden="true" />
  <span className="cpp-band-pill">
    <img className="cpp-band-sigil" src={atlasUrl(BAND_SIGIL[b])} alt="" aria-hidden="true" />
    <span className="cpp-band-name">{bands[b].title}</span>
    <span className="cpp-band-sub">{bands[b].sub}</span>
  </span>
</div>
```
with `const BAND_SIGIL = ['star','comet','meteor-cluster','nebula-bolt','warp-gate','supernova'];`

```css
.cpp-band { position: absolute; inset-inline: 0; display: flex; flex-direction: column;
            align-items: center; gap: 6px; z-index: 1; pointer-events: none;
            content-visibility: auto; contain-intrinsic-size: 100% 52px; }
.cpp-band-rule { display: block; width: min(88%, 320px); height: 1px; background: var(--line); }
.cpp-band-pill { display: inline-flex; align-items: center; gap: 8px;
  padding: 5px 12px; border-radius: var(--cx-r-pill);
  border: var(--cx-edge-readout); background: var(--cx-ground-quiet); }
.cpp-band-sigil { width: 20px; height: 20px; object-fit: contain; }
.cpp-band-name { font-family: 'Cormorant Garamond','Cinzel',serif; font-weight: 600;
  font-size: 0.95rem; letter-spacing: 0.05em; color: var(--game-ink); }
.cpp-band-sub  { font-family: 'Outfit', system-ui, sans-serif;
  font-size: var(--cx-fs-label); font-weight: 700; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--fq-mut); }
[dir='rtl'] .cpp-band-name { font-family: 'Cairo','Cormorant Garamond',serif; font-weight: 700; letter-spacing: 0; }
[dir='rtl'] .cpp-band-sub  { font-family: 'Cairo','Outfit',sans-serif; letter-spacing: 0.02em; text-transform: none; }
```
**⚠ `contain-intrinsic-size` on `.cpp-node` is `74px 90px` and must stay correct.** Nodes are absolutely positioned so band pills do not disturb them, but confirm no node's box grows.

**5c. Kawkab walks (Round 2's deferred A4).** Split the transforms so the walk and the bob do not fight:
```jsx
<div className="cpp-kawkab" style={{ left: `${current.x}%`, top: current.y, ...walkVars }}>
  <div className="cpp-kawkab-bob"><KawkabSprite size={48} /></div>
</div>
```
Module scope, **not persisted** — a session-lifetime flourish:
```js
let lastFrontier = null;   // module scope, deliberately not in localStorage
```
On mount, if `lastFrontier != null && lastFrontier !== current.lv`, compute the previous node's `{x, y}` from the same `nodes` array and set
`walkVars = { '--cx-walk-dx': `${prev.x - current.x}%`, '--cx-walk-dy': `${prev.y - current.y}px` }`,
add `cpp-kawkab--walking`, and set `lastFrontier = current.lv` in an effect.
```css
.cpp-kawkab { position: absolute; transform: translate(-50%, -108%); pointer-events: none; z-index: 2; }
.cpp-kawkab--walking { animation: cpp-walk 900ms var(--cx-ease-move) both; }
@keyframes cpp-walk {
  from { transform: translate(calc(-50% + var(--cx-walk-dx)), calc(-108% + var(--cx-walk-dy))); }
  to   { transform: translate(-50%, -108%); }
}
.cpp-kawkab-bob { animation: cpp-bob 2.4s ease-in-out infinite; }
@keyframes cpp-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@media (prefers-reduced-motion: reduce) { .cpp-kawkab--walking { animation: none; } .cpp-kawkab-bob { animation: none; } }
```
**⚠ The old `cpp-bob` keyframes wrote the full `translate(-50%, -108%)`.** Replace it with the `translateY`-only version above, or the bob will reset the walk's transform and Kawkab will teleport.

**5d. The trail draws itself in.** Add `pathLength="1"` to `.cpp-trail-done` in the JSX, and:
```css
.cpp-trail-done { stroke-dasharray: 1; stroke-dashoffset: 0;
  animation: cpp-trail-draw 520ms var(--cx-ease-move) both; }
@keyframes cpp-trail-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) { .cpp-trail-done { animation: none; } }
```
`pathLength="1"` normalises, so no JS measurement is needed on a 6,782 px path.

**5e. Kill the engineering shorthand.** `index.jsx:1918-1921` still returns `` `${cfg.tc}t·${cfg.time}s` ``. Replace with a real sentence from the UI dict (§5.10): `t.cxNodeSub(cfg.tc, cfg.time)`.

**5f.** `index.jsx:1907-1923` — pass `bands={t.cxBands}` to `CancelPlanetPath`.

### Step 6 — The countdown veil lift (Carry A)

In `index.jsx`'s `runCountdownThen` (≈1446-1473), after the last countdown step and **before** `setPlayStep('running')`:
1. `setCdShow(false); setCdLeaving(true);`
2. `await sleep(220)` (`sleep` already exists at :138)
3. `setCdLeaving(false)` then start the round exactly as today.

Render the overlay while `cdShow || cueShow || cdLeaving` (index.jsx:2624), adding `is-leaving` when `cdLeaving`.

**⚠ Gate it:** only for `round.mode === 'level' | 'free' | 'challenge'`. Assessment and Adaptive skip the 220 ms entirely — no extra delay in a clinical instrument, and their fixation cross has no veil.

```css
.cx-atlas .ct-fq-cd.is-leaving {
  animation: cx-veil-lift 220ms var(--cx-ease-exit) both;
  pointer-events: none;
}
@keyframes cx-veil-lift { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(1.04); } }
@media (prefers-reduced-motion: reduce) { .cx-atlas .ct-fq-cd.is-leaving { animation: none; opacity: 0; } }
```
This is the one place the board is "revealed." The board itself is fully laid out, static, and untouched — only the departing veil moves, and it is gone before the clock starts.

**Also:** grow the Survival cue backdrop (`training.css:2517-2518` → scoped override in `cancelAtlas.css`):
```css
.cx-atlas .ct-fq-cd--ready { background-size: cover, clamp(280px, 72vw, 460px) auto; background-position: center, center 34%; }
```

### Step 7 — Celebration → results (Carry B)

**7a.** `index.jsx:1646` — `420` becomes `620`. Add the comment: *"620ms is CUES.win's own length (last voice at 0.21 + dur 0.38 + 0.04 tail = 630ms). The results screen arrives on the chord's last ring, not half a second after it ended."*

**⚠ The hold window grows by 200 ms.** Round 4 closed two severe bugs by blocking Pause/Quit during the hold and clearing `clearHoldTimeoutRef` on unmount. Re-verify both by hand at 620 ms: press Pause during the hold; press Restart during the hold; back out during the hold.

**7b.** Retime the ring:
```css
.cx-atlas .ct-juice-solvepulse { animation-duration: var(--cx-t-hold); }
```

**7c.** The plate bloom (colour and shadow only — nothing under a tile moves):
```jsx
/* index.jsx: the board wrapper already knows `clearing` */
<div className={`ct-fq-g-wrap ct-fq-g-wrap--scene2d ct-juice-host${clearing ? ' is-clearing' : ''}`} …>
```
```css
.cx-atlas .is-clearing .cb2d-grid::before {
  border-color: color-mix(in srgb, var(--game-ok) 55%, var(--line));
  box-shadow: var(--elev-raise), 0 0 0 3px color-mix(in srgb, var(--game-ok) 30%, transparent);
  transition: border-color 300ms var(--cx-ease-enter), box-shadow 300ms var(--cx-ease-enter);
}
@media (prefers-reduced-motion: reduce) { .cx-atlas .is-clearing .cb2d-grid::before { transition: none; } }
```
**⚠ This is allowed motion.** The last target has already fallen, `stopTimer()` has run, `clearingRef` is set, the board is non-interactive. This is the "after the last target falls" window Round 1 §0 explicitly opened. **Do not add a transform here** — `::before` sits under the tiles and moving it shifts the visual field the tiles are read against.

**7d.** The results mark becomes the atlas. `PlayResults.jsx` is untouched — this is CSS over the element it already renders:
```css
.cx-atlas .ct-play-results-mark {
  width: 64px; height: 64px; margin-bottom: 14px;
  border: 0; font-size: 0;                    /* hides the ✓ / ↻ / ◇ glyph */
  background-repeat: no-repeat; background-position: center; background-size: contain;
  animation: cx-mark-bloom 420ms var(--cx-ease-settle) both;
}
.cx-atlas .ct-play-results-card--success .ct-play-results-mark { background-image: var(--asset-attn-cancel-atlas-supernova); }
.cx-atlas .ct-play-results-card--retry   .ct-play-results-mark { background-image: var(--asset-attn-cancel-atlas-comet); }
@keyframes cx-mark-bloom { from { opacity: 0; transform: scale(0.4); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .cx-atlas .ct-play-results-mark { animation: none; } }
```
Register the two new asset vars in `src/lib/assetUrl.js`'s `applyAssetCssVars()`, beside the existing `--asset-attn-cancel-atlas-galaxy` (line 34), same comment style:
```js
set('--asset-attn-cancel-atlas-supernova', 'Assets/training/cancel-cosmic-atlas-2026/supernova.webp');
set('--asset-attn-cancel-atlas-comet',     'Assets/training/cancel-cosmic-atlas-2026/comet.webp');
```
**⚠ `.ct-play-results-mark` is `aria-hidden="true"` in `PlayResults.jsx:67` and the title carries the meaning.** Hiding the glyph with `font-size: 0` loses nothing for a screen reader. Confirm the title still announces.

**7e.** Results card → Tier 1, fixed ground, clock-voice headline:
```css
.cx-atlas .ct-play-results-card {
  border-radius: var(--cx-r-plate);
  background:
    radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--game-accent) 13%, transparent), transparent 46%),
    var(--play-surface-flat);
  box-shadow: var(--elev-raise);
}
.cx-atlas .ct-play-results-card--neutral { border: var(--cx-edge-plate); }
.cx-atlas .ct-play-results-title { font-family: 'Cormorant Garamond','Cinzel',serif; font-weight: 600; color: var(--game-ink); }
.cx-atlas .ct-fq-sbig { font-family: 'DM Mono', ui-monospace, monospace; font-weight: 500;
  font-size: var(--cx-fs-num-lg); font-variant-numeric: tabular-nums; color: var(--game-ink); }
.cx-atlas .ct-fq-ies-lbl,
.cx-atlas .ct-play-results-stat-l { font-family: 'Outfit', system-ui, sans-serif;
  font-size: var(--cx-fs-label); font-weight: 700; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--fq-mut); }
.cx-atlas .ct-play-results-stat-v { font-family: 'DM Mono', ui-monospace, monospace;
  font-weight: 500; font-variant-numeric: tabular-nums; color: var(--game-ink); }
[dir='rtl'] .cx-atlas .ct-play-results-title { font-family: 'Cairo','Cormorant Garamond',serif; font-weight: 700; }
```
Keep `--success` / `--retry` border tints exactly as they are.

### Step 8 — The results screen earns its emotion (`extra`, not a fork)

`PlayResults` already has an `extra` node slot (`PlayResults.jsx:41, 96` → `.ct-play-results-extra`). **No fork is needed and none may be created.** Build one small local component in `index.jsx`:

```jsx
function CxResultsExtra({ kind, isAr, t, band, nextBand, prevBest, prevBestScore, score, roundsWon }) { … }
```

Two cases only:

**8a. Level results, band boundary.** When `lastResult.stats.won && (lastResult.r.ladderLv % 10 === 0) && lastResult.r.ladderLv < 60`:
render the next band's sigil at 44 px, `t.cxBandCleared(bands[b].title)` on one line and `t.cxNextBand(bands[b+1].title, bands[b+1].sub)` beneath. This is the *only* place in the game that names what just unlocked, and it is the payoff for building the bands in Step 5.

**8b. Survival results, personal best.** `index.jsx` updates `profile.freeBest` / `freeBestScore` **inside `endRound`, before results render** (≈1121-1135).
**⚠ Comparing against `profile.*` on the results screen will always read "not a best."** Capture the pre-update values into `lastResult` at the moment you set it: `prevBest`, `prevBestScore`. Then:
- if `roundsWon > prevBest || score > prevBestScore` → `t.cxNewBest` in a Tier 3 pill + `t.cxPrevBest(prevBest)` beneath;
- otherwise leave `extra` null and keep today's quiet `notes` line.

```css
.cx-atlas .ct-play-results-extra { display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding-top: 14px; border-top: 1px solid var(--line); }
.cx-atlas .cx-res-sigil { width: 44px; height: 44px; object-fit: contain; }
.cx-atlas .cx-res-head { font-family: 'Cormorant Garamond','Cinzel',serif; font-weight: 600;
  font-size: 1.05rem; color: var(--game-ink); }
.cx-atlas .cx-res-sub  { font-family: 'Outfit', system-ui, sans-serif;
  font-size: var(--cx-fs-body); color: var(--fq-mut); }
.cx-atlas .cx-res-best { display: inline-flex; align-items: center; padding: 5px 14px;
  border-radius: var(--cx-r-pill); border: 1px solid var(--game-accent-edge);
  background: var(--game-accent); color: var(--game-ink);
  font-family: 'Outfit', system-ui, sans-serif; font-size: var(--cx-fs-label);
  font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
  box-shadow: var(--elev-rest); }
[dir='rtl'] .cx-atlas .cx-res-best { text-transform: none; letter-spacing: 0.02em; font-family: 'Cairo','Outfit',sans-serif; }
```

**⚠ `extra` must be `null` for `assess` and `adaptive` results.** Those screens stay feedback-free.

**⚠ Do NOT touch the Pass n Play medal emoji** (`'🥇' '🥈' '🥉'`, index.jsx:2132). Round 2 reversed Round 1 on this with a good argument — the pattern is shared byte-for-byte across seven games and fixing one makes the platform *less* consistent. It remains a platform ticket, still out of scope.

### Step 9 — Strings: EN and AR, in the same edit

Add to **both** halves of `UI` in `index.jsx` (EN block ≈line 224, AR block ≈line 356). Write both in one edit, then grep the Arabic.

```js
// EN
cxBands: [
  { title: 'First Light',   sub: 'Find every target' },
  { title: 'Open Field',    sub: 'More targets, less time for each' },
  { title: 'Crowded Sky',   sub: 'A denser board' },
  { title: 'Deep Field',    sub: 'More targets, less time for each' },
  { title: 'Twin Signals',  sub: 'Look-alike distractors' },
  { title: 'Far Orbit',     sub: 'More targets, less time for each' },
],
cxNodeSub: (tc, sec) => `${tc} targets · ${sec}s`,
cxBandAria: (n, title) => `Band ${n} — ${title}`,
cxBandCleared: (title) => `Band cleared — ${title}`,
cxNextBand: (title, sub) => `Next: ${title} · ${sub}`,
cxNewBest: 'New personal best',
cxPrevBest: (n) => `Previous best: ${n}`,

// AR
cxBands: [
  { title: 'الضوء الأول',   sub: 'جد كل الأهداف' },
  { title: 'الحقل المفتوح', sub: 'أهداف أكثر، ووقت أقل لكل هدف' },
  { title: 'سماء مزدحمة',   sub: 'لوحة أكثف' },
  { title: 'الحقل العميق',  sub: 'أهداف أكثر، ووقت أقل لكل هدف' },
  { title: 'إشارات متشابهة', sub: 'مشتّتات متشابهة' },
  { title: 'المدار البعيد',  sub: 'أهداف أكثر، ووقت أقل لكل هدف' },
],
cxNodeSub: (tc, sec) => `${tc.toLocaleString('ar-EG')} هدفًا · ${sec.toLocaleString('ar-EG')}ث`,
cxBandAria: (n, title) => `النطاق ${n.toLocaleString('ar-EG')} — ${title}`,
cxBandCleared: (title) => `اكتمل النطاق — ${title}`,
cxNextBand: (title, sub) => `التالي: ${title} · ${sub}`,
cxNewBest: 'أفضل نتيجة جديدة',
cxPrevBest: (n) => `الأفضل سابقًا: ${n.toLocaleString('ar-EG')}`,
```

**⚠ Why bands 2, 4 and 6 share a subtitle.** Those are the second halves of the easy / medium / hard tiers: they add no *named* mechanic, they add load. `audit:fq` asserts that time-per-target falls across the whole climb, so "more targets, less time for each" is true of them by construction. `FQ_MECHANIC_LABELS` (`focusQuestData.js:514-518`) already ships bands 1/3/5's subtitles in both languages — the strings above intentionally match them word for word. **If you ever change one, change the other.** A subtitle that states something the curve does not do is exactly the stale-claim bug CLAUDE.md records for "100 levels per tier."

### Step 10 — Sweep for what the new system replaces

Search `index.jsx`, `cancelBoard2d.css`, `cancelPlanetPath.css` and `cancelAtlas.css` for:
- any `border-radius` that is not `26px` / `20px` / `12px` / `999px` / `50%` → move it onto the ladder or justify it in a comment;
- any `box-shadow` that is not `--elev-rest` / `--elev-raise` / `--elev-press` / a composed `--cx-ring-*` → replace;
- any `transition`/`animation` duration not in the four-rung table → replace;
- any `font-family` not Cormorant / Outfit / DM Mono / Cairo → replace;
- any `text-shadow` with more than one layer → delete.

This is the deferred Round-4 item 7, finally closed. It is a *consistency* sweep, not an invention licence: if a sweep tempts you to add a new visual idea, stop.

### Step 11 — Gates, then a browser

```bash
npm run audit:fq          # MUST be byte-identical. If it moves at all, you touched
                          # something non-presentational. Stop and find it.
npm run audit:pacing
npm run audit:curves
npm run audit:coach
npm run audit:consistency # cancel-task must hold 19/22 · 8/8 depth · 6/6 look
npm run audit:design      # expect the count to FALL (letterpress hexes + the bevel
                          # are gone). Commit the ratcheted baseline.
npm run audit:gamekeys
npm run lint
npm run build
```
Then re-run the Step 0 screenshot set and diff it. **A passing gate is not proof a human sees anything** — this file's own four-round history is a list of correct declarations over blank pixels.

---

## 6. The motion inventory — the discipline proof

Every animated thing in this game after this build, and the condition under which it may run. If a beat is not on this list, it does not exist.

| Beat | Where | Duration | Gate |
|---|---|---|---|
| Screen rise | `.ct-fq-screen` (not level select) | 380 ms | any menu screen |
| Mode-card stagger | `.cxm-card` ×3 | 240 ms @ 45 ms | mode pick, on mount |
| Trail draw-in | `.cpp-trail-done` | 520 ms | level select, on mount |
| Kawkab walk | `.cpp-kawkab--walking` | 900 ms | level select, once per session per new frontier |
| Current-node pulse | `.cpp-node--current` | 2.2 s ∞ | level select only |
| Kawkab bob | `.cpp-kawkab-bob` | 2.4 s ∞ | level select only |
| Countdown numeral | `.ct-fq-cd-num` | 340 ms | before the clock starts |
| Cue-card pop | `.ct-fq-cue-card` | 280 ms | before the clock starts |
| **Veil lift** | `.ct-fq-cd.is-leaving` | 220 ms | **before** `playStep === 'running'`; not assess/adaptive |
| Tile clear settle | `.cb2d-cell--cleared` | 300 ms | local to one tapped tile |
| Wrong-tap settle | `.cb2d-cell--wrong` | 160 ms | local to one tapped tile |
| Penalty chip | `.cb2d-penalty-flash` | 650 ms | not coach, not assess |
| **Plate bloom** | `.is-clearing .cb2d-grid::before` | 300 ms | **after** the last target falls, timer stopped |
| Solve pulse | `.ct-juice-solvepulse` | 620 ms | same window |
| Results card rise + stagger | `.ct-play-results-card` | 340 / 300 ms | results only |
| Results mark bloom | `.ct-play-results-mark` | 420 ms | results only |

**Nothing on this list runs while `playStep === 'running'` with targets on screen, except the three tile-local beats, all of which were already shipped, all of which are the direct consequence of the player's own tap, and none of which move anything the player is not already looking at.**

---

## 7. Definition of done

Success is obvious on sight. Each of these is a single observable fact — check them in a browser, in both languages, at 390×844 and 1366×633, in both app themes.

**The one-object test**
1. Screenshot the mode pick, the level select, the cue card, the live board and the results screen. Lay them side by side. **Every one is warm paper with navy-contoured flat art.** There is no photorealistic sphere anywhere in the game.
2. Toggle the app theme on every one of those five screens. **Nothing changes key.** No ground flips, no text loses contrast, no chip goes dark-on-dark.
3. Measure every rounded corner in those five screenshots. **Every one is 26, 20, 12, 999 px or a circle.**
4. The word "CANCELLATION TASK" has **one** soft shadow, not six stacked ones, and no text stroke.
5. Every number on screen (HUD, countdown, results headline, results stats, node sublabel) is **monospace and ink-dark**; the only amber on screen is a ring, a pill or an accent — never a figure.

**The motion test**
6. Menu → mode pick → level select → countdown → play → results → back. **Every transition uses one of four durations and four easings.** Nothing snaps in, nothing lingers, and the back path is visibly faster than the forward one.
7. Start a Level round: the countdown veil **lifts off** a board that is already there and completely still. The board itself never fades, slides or scales.
8. Record a round. Between the first legible frame and the last target falling, **the only things that move are the tile you just tapped and the time bar.** Frame-step it.
9. Open the level select at level 45: it **lands on your own planet**, the walked trail draws itself in green, and if you just cleared a level Kawkab **walks** from the old planet to the new one. Scroll up: six chapter rules, each naming a band and what it introduces, in the right language.

**The emotion test**
10. Clear a board with sound on. The green ring, the plate's green rim and the `win` chord start together, and **the results screen appears on the chord's last ring** — you cannot identify a cut between the celebration and the results. One event.
11. Clear level 30. The results screen names the band you just finished and shows the sigil and the name of the band you are about to enter. Beat your Survival record: the screen says so.

**The integrity test**
12. `audit:fq` output is **byte-identical** to before the build.
13. The live-board coach runs all eight steps: the hand lands on the goal chip, then on real tiles, the decoy step still crosses out, and clearing the whole board mid-lesson does **not** end the round.
14. `prefers-reduced-motion: reduce`: every new animation is off, the celebration hold and every sound remain, and nothing is stranded mid-transform.
15. Screen reader on the results screen: the title announces; the hidden mark glyph announces nothing. On the level select: `aria-current="step"` is on your node and every node's label reads in the right language.
16. All eight gates green, `npm run build` exit 0, `audit:design` count **lower** than the Round-4 baseline, baseline committed.

---

## 8. Explicit non-goals and the two overrides

**Still out, unchanged from every prior round:** all curve/content data · assessment & adaptive *presentation* beyond the neutral ground · `CancelTaskCoach.jsx` content · `PlayResults.jsx` / `PlayHud.jsx` **internals** · `.cb2d-wrap`'s forced transparency · `.ct-domain-game-stage`'s scroll/overscroll fix · the board plate's interior fill · board entrance/exit motion during live play · re-adding `particle`/`rtFx`/`shake` to the juice kit · **D3** the shared 7-game medal emoji · `--fq-pdk`/`--fq-mut` **at the platform token** · a dark-graded variant of the Attention domain art (asset task) · **any new binary asset of any kind**.

**Override 1 — Round 1 §4 / Round 2: "`ModePlanetHub` … shared across many games; out of a single-game-scoped pass."**
Overridden, but not in the way that non-goal was protecting against. `ModePlanetHub.jsx` is **not edited**. Cancellation stops *calling* it, exactly as `CancelPlanetPath` already replaced `TrainingLevelGrid` at one call site with the same prop contract. Every other game's mode hub is byte-identical after this build. The justification is Round 4's own headline finding, applied one screen earlier than Round 4 looked: the photographic planets violate this game's own written art direction, and that direction is the thing four rounds agreed to build out from.

**Override 2 — Round 4 item 10: "Kawkab walking, band captions — deliberately deferred."**
Overridden. They were deferred as "not needed for coherence," which was correct at the time. They are needed for *feeling like a journey*, which is what was actually asked for. Both are specified in full above and both are pure presentation — no data file, no curve, no persisted state.

---

### Critical Files for Implementation

- `C:\Users\user\OneDrive\Documents\maze man comics\src\features\training\domains\attention\games\cancellation\index.jsx`
- `C:\Users\user\OneDrive\Documents\maze man comics\src\features\training\domains\attention\games\cancellation\CancelPlanetPath.jsx` (+ `cancelPlanetPath.css`)
- `C:\Users\user\OneDrive\Documents\maze man comics\src\features\training\domains\attention\games\cancellation\cancelAtlas.css` *(new)* and `CancelModeAtlas.jsx` *(new)*
- `C:\Users\user\OneDrive\Documents\maze man comics\src\features\training\domains\attention\games\cancellation\cancelBoard2d.css`
- `C:\Users\user\OneDrive\Documents\maze man comics\src\lib\assetUrl.js`

**Read-only references the builder must consult, not edit:** `src\styles\tokens.css` (the token contract), `src\features\training\shared\PlayResults.jsx` (the `extra` slot), `src\features\training\shared\ModePlanetHub.jsx` (the prop contract to mirror — never edit), `public\Assets\training\cancel-cosmic-atlas-2026\README.md` (the art direction), `scripts\audit-design.mjs:143-150` (the raw-colour rule).