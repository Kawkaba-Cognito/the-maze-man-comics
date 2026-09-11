# Cancellation (`cancel-task`) — Premium Pass, Round 4: wider competitor research + coherence audit

**Written:** 2026-09-11 · Opus. Research + top-down review only; no code changed by this pass.
**Prior rounds:** `review/cancellation-premium-plan.md` (R1), `-round2.md` (R2), `-round3.md` (R3), index in `cancellation-review-index.md`.
**Brief:** go wider than R3's Lumosity/BrainHQ research; then judge, as a design lead before ship, whether three rounds of individually-justified changes add up to one deliberately-designed object. Two codebase-reviewer agents ran correctness and design/a11y lenses in parallel; this document deliberately does **not** re-audit the diff line by line.

---

## 0. The finding that reframes this whole round

Before any competitor research mattered, one file answered the central question.

`public/Assets/training/cancel-cosmic-atlas-2026/README.md` — tracked in git since 2026-08-09, 43 WebP pieces, all normalised to a 256×256 transparent canvas, **already wired as this game's live stimuli** via `src/features/training/shared/shapeArt.js:140`:

> Art direction: premium hand-inked cosmic atlas, crisp navy contours, coral/turquoise/gold/violet/cream palette, restrained flat print texture, no 3D. The source prompts explicitly prohibited text, logos, trademarks, watermarks, bevels, extrusion, **photorealism, gradients, and cast shadows.**

**This game has a written, enforced, genuinely premium art direction. It has had one for a month.** The pieces are excellent: flat, inked, confident, unmistakably one family.

Rounds 1–3 did not extend that direction once. They added a photorealistic astrophotography galaxy to the level-select screen, unveiled a cream watercolour illustration behind the live board, and left the level-select's 60 planets as `hue = (lv * 47) % 360` procedural rainbow spheres with an emoji padlock.

**The premium object this game is trying to become already exists in `cancel-cosmic-atlas-2026/`, and three rounds of premium work decorated around it instead of building out from it.**

---

## 1. Competitor research

### 1.1 Peak (peak.net / Brainbow)
Reviewers describe it as bright, colourful, "the most compelling game design of any brain training app" — with per-game themed art. No legibility complaints found. **Technique: per-game thematic identity, not app chrome.**

### 1.2 Elevate (elevateapp.com — Apple App of the Year 2014)
Contested descriptions reconcile as: the game field is flat and quiet; illustrated objects (a tangram assembling as you succeed, a rocket launching) live on the progress/result layer, not behind the task. **The most directly applicable finding: decoration earned by performance, adjacent to the task, never behind it.**

### 1.3 CogniFit
Described as clinical, sometimes "like homework." The floor of the category — proof that plainness alone isn't the failure; unconsidered plainness is.

### 1.4 Two Dots
"Rich in detail... uses the levels like a sightline to follow" — the level MAP carries the art direction; the boards stay flat. The sharpest indictment of where this game's three rounds spent their effort (opposite allocation).

### 1.5 Two empirical findings
(a) JMIR Serious Games 2022 (n=20, VR working-memory task): visually busy backgrounds didn't measurably hurt simple-task performance. Limited scope, not a visual-search finding.
(b) *Cognitive Research* 2025: background clutter slows **visual search** by up to 74% (η²=0.80–0.89), via target–background feature similarity. Cancellation's domain art (planets, stars, orbits) is made of the same objects as its own stimuli — this is the one game on the platform where that similarity is a construct-validity risk, not just a look, since its own metrics are peripheral-spatial measures. **This vindicates the board plate on evidence, and argues Round 3's scrim-lowering ran the wrong direction.**

---

## 2. Coherence audit

**Verdict: does not yet read as one deliberately-designed object.** Five seams, most serious first:

1. **Three unrelated art languages in one game** — hand-inked flat vector (stimuli), cream watercolour (live-board background), photorealistic astrophotography (level-select) — and the game's own is the one that was never extended.
2. **The live board had become the most art-forward surface in the whole app** (30% scrim, more visible than this app's own menus have ever been measured at), inverting both the platform's standing "gameplay stays quiet" rule and Round 3's own research conclusion.
3. **Six chrome objects, six independently-invented border/elevation formulas**, and one — the goal chip — carried a genuine dark-theme contrast failure through three rounds of otherwise-careful contrast work, because each round scoped to its own diff.
4. **The audio palette is fine; it's the visuals that are out of step with it.** Synthesized abstract tones pair naturally with flat inked art, not with astrophotography. Don't retune the audio — align the visuals to it.
5. **The wall is finished and the furniture isn't** — the level-select screen received a generated photo, a cropping pipeline, and 40 lines of justification, while its actual node content stayed the original prototype, twice re-specified and never built.

---

## 3. The single highest-leverage thing

**Rebuild the level-select map out of the game's own cosmic atlas.** Nearly free (the art exists, is tracked, is already loaded), makes three surfaces become one object at once, matches what the category's best-regarded designs actually do (Peak's per-game worlds, Two Dots' map-as-art-direction), and clears the game's last raw-colour debt and last emoji in the same edit.

---

## 4. Explicit reverts/replacements called

- **REVERT (partial)** — live-board scrim: light 30%→55%, dark unchanged at 65%. Keep the HUD chip surfaces and plate rim from Round 3; both are right independent of the scrim value.
- **REPLACE** — level-select photographic background → the atlas-piece map (item above) + the flat token ground/star-glints Round 2 originally shipped.
- **KEEP AND DEFEND** — the board plate (Round 2). Upgraded from taste to evidence by the visual-search research.
- **KEEP** — all of Round 1's audio group, Round 2's regression/hygiene fixes, the celebration hold, the penalty chip, the de-stickering.

---

## 5. Prioritized TODO (as delivered; see `cancellation-todo.md` for build status)

0. Screenshot everything before building anything else — **still not done, standing risk**.
1. Fix the goal chip's dark-mode contrast (fixed ground, not theme-flipping) — **built**.
2. Raise the live-board light scrim 30%→55% — **built**.
3. Rebuild level-select nodes from `cancel-cosmic-atlas-2026` — **built**.
4. Replace the level-select photo with flat ground + stars — **built**.
5. Real trail + land on the player's marker — **built**.
6. Kill the emoji glyphs and engineering shorthand — **built**.
7. Write down the object family (border/elevation rules), then apply it — **deferred**.
8. Results callouts (personal best, mechanic-unlock) — **deferred**.
9. `--fq-pdk` platform-wide contrast — **explicitly out of scope for this game's changes**.
10. Kawkab walking, band captions, the assessment audio question, dark-graded art — **deliberately deferred**.

---

**Sources:** see the full agent transcript for citations (Neurosity, Moadly, screensdesign, Common Sense Media, Nibble, The Gadget Flow, IXD@Pratt, Fast Company, hellomattstevens.com, and two PMC-indexed empirical papers on visual-game-feature cognitive load and background-clutter visual search). In-repo: `cancel-cosmic-atlas-2026/README.md`.
