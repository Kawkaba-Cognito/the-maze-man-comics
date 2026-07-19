# 3D Migration Plan — making the 3D versions the full game

**Goal:** every training game's 3D version becomes the main (and eventually only)
play surface, without losing any of the 2D work — the engines, the science
layer, the mode system, the content, and player history all carry over.

**Guiding principle — engine–view split.** Each game is two layers:

- **Engine (headless, the science):** generators, session state machines,
  difficulty models, staircases, scoring, content banks. Already shared —
  every 3D surface imports and runs the real 2D engine functions. This layer
  is never rewritten, only re-exported where needed.
- **View:** what draws the engine's state. 2D and 3D are two views of the same
  engine. The migration swaps the default view; it does not touch rules.

## Phases (per game)

1. **Keep the ModeShell chrome, swap only the play surface.**
   Menus, Survival/Levels/Pass-n-Play structure, level grids, unlock
   persistence, results screens, Pass-n-Play handoffs, tutorials, settings —
   all DOM, all kept. 2D game components share a standard props contract
   (`mode, diff, level, seed, onResult, awardPoints, awardFreeRun, …`);
   the 3D surface implements the same contract so ModeShell launches it
   exactly as it launched the 2D surface.

2. **Wire the science layer into 3D play.**
   The 3D surface calls the same `createTrialLog` with the same per-trial
   fields (`rt`, `ok`, …) and the same storage keys → metrics, history and
   player continuity carry over. Same XP hooks (`awardPoints`,
   `awardFreeRun`, `awardTrainingWin`).

3. **Grow the 3D surfaces from Survival-only to full games.**
   Levels and Pass n Play reuse the same engines with different configs
   (`levelCfg`, seeds, trial counts) — a config branch, not new gameplay.

4. **Assessments stay on 2D presentation until validated.**
   RTs are presentation-sensitive (bloom, materials, raycast targets shift RT
   distributions). Training modes don't care; assessment baselines do.
   Keep the assessment battery 2D for now AND tag any 3D-collected sessions
   with a `presentation: '3d'` marker in trialLog so old/new data are never
   silently mixed. Revisit once enough 3D data exists to compare.

5. **Retire 2D the repo way: bench, don't delete.**
   Once a game's 3D surface is validated on-device: swap the ModeShell
   default to 3D, move the 2D play component to benched status with a
   `BENCHED.md` note (existing convention), keep it in git. Engines and data
   files stay live (shared). Hard-delete only after a long stable period.

## Rollout

- **Pilots:** one simple (Wisconsin) + one heavily instrumented
  (Speed Match or Cancellation) through phases 1–3, validated on-device,
  then the remaining games follow the locked pattern mechanically.
- **Detective last** — its 2D Survival is the free-form investigation
  (scene hotspots, interrogation, confront, accuse-with-evidence); the 3D
  treatment is a product/design decision, still pending.

## What survives, explicitly

All engines and content · the full science layer with existing player history
(same `mm_*` keys) · mode/progression system · tutorials · bilingual strings ·
the 2D code itself (git + bench). Only the play-surface rendering is replaced.

## Current state (see memory / git log for details)

- All 17 playable 3D protos run their 2D Survival rules exactly (verified
  line-by-line against each 2D free loop, 2026-07-19).
- Attention games have upgraded rendering (SVG-faithful cancellation shapes,
  substepped MOT physics, top-down spaceport Car Park).
- Protos do not yet call trialLog/award hooks — that is Phase 2.
- Meshy AI assets planned for hero props: optimize via
  `npx gltf-transform optimize in.glb out.glb --texture-compress webp
  --texture-size 1024`, budget ≤1–2MB per game, slot-based swap-in.
