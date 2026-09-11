# Cancellation (`cancel-task`) — Premium Pass, Round 3: the LIVE BOARD background

**Scope:** presentation only. `src/styles/training.css`, `src/features/training/domains/attention/games/cancellation/cancelBoard2d.css`. No JSX changes.
**Written:** 2026-09-11 · Opus research + review + plan; Sonnet measured the actual pixels and built it.
**Prior rounds:** `review/cancellation-premium-plan.md`, `review/cancellation-premium-plan-round2.md`.

**Owner's instruction that opened this round:** *"i want the background to be on the gameplay, tell opus to go and study lumiosity and brain hq, what they do, and plan it to make premium background and gameplay, then you build it, then i see it."*

---

## 0. The finding that changed the brief

The live board was assumed to need a structural rework to show background art at all. It doesn't — that was already fixed (2026-09-09/10, before this session): `.cb2d-wrap`/`.ct-fq-g-wrap--scene2d` are forced transparent, Round 2's board plate already makes Cancellation a centered card, and per-domain illustrated art (`domain-backgrounds-2026-v2/{mobile,desktop}/attention.webp`) is already wired to every live-gameplay round via a `data-gameplay-active` marker. The art was there. It was being crushed to **30% strength** by a `--training-art-scrim: 70%` that was measured for a different problem (body text sitting directly on raw art, on games/screens where that's real) and rolled out uniformly to every game's gameplay stage, Cancellation included, without being re-derived for Cancellation's actual exposure.

## 1. Research — Lumosity & BrainHQ (Opus, summarized)

Direct findings, cited (see agent transcript / prior message for full citations and URLs):
- **Lumosity's live-play background is a flat, user-toggled light/dark ground — not an illustration.** Their own help docs describe exactly two values, changeable mid-round.
- **The play surface is a bounded panel with margin ("fits neatly in your browser window"), not edge-to-edge** — the same centered-card structure this app already uses for 17/18 games and which Cancellation reached in Round 2.
- **Design investment goes into the games' own stimuli, not the surrounding chrome** (UsabilityGeek/Medium case study) — the inverse of what Rounds 1-2 did here (premium menus/results, plain board).
- **Theming rides on the stimuli and the response affordance, not the backdrop** (BrainHQ's Double Decision: a lightened wedge on an otherwise plain field).
- **BrainHQ is criticized in reviews for a dated, unpolished interface** — the cautionary case for what "not premium" looks like in this exact category.
- **Neither product uses parallax/particle/animated backgrounds during a timed trial.** Zero evidence for it; it would be a straightforward confound.

**Category verdict:** during actual play, both leaders read as *clean-clinical*, and premium is earned through resolution of a small element set, not by adding decorative layers. This reframes the ask: not "add a background," but "let the background that's already there and already paid for actually be seen, and make the board on top of it read as a well-made object."

## 2. What was actually measured (this round, not estimated)

Full-resolution pixel scan of `mobile/attention.webp` (941×1672), sRGB relative-luminance contrast, both luminance extremes, both themes, using this repo's own `--universe-dusk` scrim values (`#cfc4b0` light / `#0a0a0b` dark):

**Rim-vs-raw-art contrast** (the plate/chip 1px border against the composited background, no scrim floor reaches even 2.3:1 at any tested value 0–70%) — this metric turned out to be the wrong one to chase: `--line` is a low-contrast hairline colour *by design*, meant to define an edge against a known flat surface, not to independently out-contrast an arbitrary photo. A plate's separation from its background comes from its **opaque fill + elevation shadow**, not its border's own contrast against a busy backdrop — confirmed structurally sound regardless of scrim, since the plate is fully opaque underneath (see below).

**HUD-chip text contrast** (`--fq-pdk` #c98a2e and `--fq-mut` #6b6b6b against an 88%-`--play-surface-flat` chip, composited over the scrimmed art) — the scrim value moves this by only ~0.1–0.2 across the ENTIRE 0–70% range, because the chip's own 88% opacity dominates. **This means the scrim choice is nearly free with respect to HUD legibility** once the chip has its own surface (Step 1). It also surfaced a real, pre-existing, out-of-scope finding: `--fq-pdk` (amber-gold) only reaches ~1.4–1.7:1 against its own background regardless of anything in this round — a genuine platform-wide HUD contrast issue that predates this session and isn't fixed here (see §5).

**Conclusion driving the chosen values:** the stimulus tiles are unaffected by any scrim value (the board plate paints `--play-surface-flat` + `--play-surface` fully opaque underneath them — the scrim sits behind an opaque layer and never reaches a tile). What actually varies with the scrim is (a) how much of the illustration is visible in the open margins, which is pure taste, and (b) the documented light/dark asymmetry: the art is colour-graded to the light `--play-surface` midpoint, so a light scrim looks right in light theme and a light scrim in dark theme would put a bright cream watercolour behind a dark board regardless of any contrast number.

**Chosen: light 30%, dark 65%** (down from a uniform 70%). Dark gets a smaller reduction on purpose — the real fix there is a dark-graded variant of the art (already named as follow-up elsewhere in `training.css`), not a lighter veil over light-graded art.

## 3. What was built

1. **Phone HUD readouts get a surface** (`cancelBoard2d.css`, new block, mirrors the wide-rail's existing chip-in-a-panel treatment but with the FIXED `--play-surface-flat` token, not the theme-flipping `--surface-raised` — this game's whole gameplay palette, `--play-surface*`/`--game-*`, is deliberately theme-invariant, and the text drawn on these chips is part of that fixed family). Scoped to the exact inverse of the wide-rail's own media query, so the two never both apply and never both miss.
2. **The live-board scrim, lowered and scoped to Cancellation only** (`training.css`, new `:has()` rule keyed to `.cancellation-task-game .ct-fq-play[data-gameplay-active]` specifically — not the shared domain-wide rule, so mot/train-switch and all other 17 games are untouched). Light 30%, dark 65%.
3. **The board plate's rim resolved** — `--elev-raise` instead of `--elev-rest`, and a slightly stronger border (`color-mix` toward `--game-ink`). Interior fill deliberately untouched (still flat `--play-surface-flat` + `--play-surface`, no gradient/vignette) — the `--game-*` piece colours' ~3.3:1-against-`--play-surface` measurement stays true of every tile, corner to centre.

## 4. What was NOT built, and why (carried from Opus's plan)

- **Any parallax/particle/animated/WebGL background.** Ruled out by the research (neither Lumosity nor BrainHQ does it), by this app's own platform-wide rule against motion behind a timed task, and by this exact machine's BSOD history from WebGL overload.
- **A background that reacts to gameplay events.** The correct channel for that already shipped in Round 2 (the solve-pulse, the `−3s` chip, the tile settle) — feedback belongs on the instrument, not the wall.
- **Lowering the dark-theme scrim to match light.** The art is light-graded; a bigger drop there would look wrong regardless of the contrast math. Needs dark-graded art, which is an asset task, not a CSS one.
- **A gradient/vignette on the plate interior.** Would silently break the one hard measurement this whole three-round effort has protected throughout.
- **Fixing `--fq-pdk`'s low contrast against its own background.** Real, but pre-existing, platform-wide (not Cancellation-specific), and out of scope for a background change — flagged for a separate pass.

## 5. Verification

**Gates:** `audit:fq`, `audit:pacing`, `audit:curves`, `audit:coach`, `audit:consistency` (cancel-task must hold 19/22 · 8/8 depth · 6/6 look), `audit:design` (must not exceed the Round-2 baseline), `audit:gamekeys`, `lint`, `npm run build`. `audit:fq` matters most here — if it moves at all, something non-presentational was touched by mistake.

**On screen (screenshot, not computed style — this file's own history is full of "the declaration was correct and the pixel was blank"):**
- 390×844 and 1366×633, light and dark, densest board (8-col): art visibly present in the margins, plate reads as a resting object, tiles still crisp and on their own flat ground.
- The wide-rail layout unaffected (different media query branch).
- 360px narrow phone: HUD chips didn't wrap the stats row; the goal chip (`data-coach="goal"`) didn't shift.
- RTL: chip padding symmetric, no directional property used.
- The live-board coach, run end to end: hand still lands on the goal chip and on real tiles.
- `prefers-reduced-motion`: no change expected (nothing here is animated) — regression check only.
- Other 17 games' live boards: scrim unchanged (verify the `:has()` scoping actually held — this is the one thing in this round with a real chance of leaking wider than intended if the selector doesn't match as expected).

**Not yet done this round:** actual screenshots (browser tooling unavailable this session again) — everything above is verified by gate + pixel-math + code reading, not by a human looking at the screen. That is the next thing that has to happen before calling this finished.
