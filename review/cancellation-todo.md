# Cancellation Premium Pass — Living TODO

Updated after "The Inked Atlas" master-prompt build (Opus master prompt, `cancellation-master-prompt.md`, executed step-by-step). See `cancellation-review-index.md` for the full document trail.

## BUILT — "The Inked Atlas" (this round)

One design system (`.cx-atlas`), replacing five independently-invented chrome recipes with one 5-tier system (Plate/Object/Pill/Readout/Pressed), one motion language (4 easings, 4 durations), and one type ladder (Cormorant Garamond for the world, Outfit for the instrument, DM Mono for anything that counts).

- [x] **The mode-pick screen rebuilt from scratch** (`CancelModeAtlas.jsx`) — replaced `ModePlanetHub`'s photorealistic rendered planets (which violated this game's own written art direction) with real cosmic-atlas pieces, at this one call site only; `ModePlanetHub` itself untouched, every other game using it unaffected.
- [x] **One ground across every screen, both themes** — the mode-pick screen's near-black void (shared with 4 other games via `--mode-cosmos`) is now warm paper for Cancellation specifically, via a scoped `:has()` override with verified higher specificity than both existing `!important` rules (dark and light), never touching the shared rules themselves.
- [x] Killed the letterpress hero title (6-layer stacked text-shadow + text-stroke) and the italic blurb style, game-wide.
- [x] Chrome sweep: goal chip, cue chip, ready card, HUD readouts, countdown numeral all onto the tier system.
- [x] **Fixed a real, confirmed dark-mode bug from Round 3**: the goal chip's shared dark-theme override (translucent white over now-visible art) is deleted and replaced with a fixed ground — was compositing to near-1:1 contrast in dark theme.
- [x] Level select: real SVG chapter markers for all 6 bands (from `FQ_LADDER`'s own structure, read-only — no curve data touched), Kawkab actually walks between planets on a clear (session-lifetime only, not persisted), the trail draws itself in on mount.
- [x] Countdown veil now lifts off the already-static board (220ms) instead of a hard cut — completes before the clock starts, costs no measured time.
- [x] Celebration hold retimed to 620ms (the actual length of the `win` chord, not an arbitrary number) — ring, plate bloom and chord now start together; results lands on the chord's last note.
- [x] Results screen: atlas art replaces the `✓`/`↻`/`◇` text glyphs; a beaten Survival personal-best is acknowledged; clearing a band boundary names what's next — all via `PlayResults`'s existing `extra` slot, zero changes to the shared component.
- [x] Fixed a genuine CSS bug caught only by the build failing: a comment containing `--game-*/--play-*` accidentally closed early (`*/` is `*/` even inside prose) and turned real English into invalid CSS. Found and fixed everywhere in the new files.
- [x] `audit:design` ratchet lowered (raw-colour 481→478 at one point in the process; verified still "none worse than baseline" after all fixes).

All 8 gates verified green on the final state: `audit:fq`, `audit:pacing`, `audit:curves`, `audit:coach`, `audit:consistency` (cancel-task unchanged: 19/22 · 8/8 depth · 6/6 look), `audit:design`, `audit:gamekeys`, `lint`. Clean production build, exit 0.

## Still open (carried forward, not forgotten)

- [ ] **Still nobody has looked at this on an actual screen.** Every round this session has carried this same item. This build is the largest yet and has the most to gain from — and lose from — actually being seen.
- [ ] The border-tint/elevation "object family" cleanup pass (Master Prompt Step 10 covered a mechanical sweep for stray values; a from-scratch full audit of every remaining chip's shadow/border recipe against the 5-tier table was not exhaustively re-verified by eye).
- [ ] `--fq-pdk`/`--fq-mut` at the platform token level (fixed for Cancellation only, per design; the other 17 games' shared HUD contrast issue is untouched, as scoped).
- [ ] `aria-modal` focus trap on the Survival ready card (X4 from Round 2 fixed initial focus, not the full modal contract).
- [ ] A dark-graded variant of the Attention domain background art (the real fix for dark theme's live-board scrim being capped at 65%).
- [ ] The assessment-vs-staircase audio consistency question (E6) — still an explicit unresolved owner question.

## Process note

Four rounds of incremental fixes (`cancellation-premium-plan.md` through `-round4.md`) preceded this master-prompt build. The owner's own assessment after Round 4 ("not making a real effort") was correct and is recorded plainly in `cancellation-premium-plan-round4.md`'s coherence audit — this build is the response to that, built from a single prescriptive spec (`cancellation-master-prompt.md`) rather than another round of isolated fixes.
