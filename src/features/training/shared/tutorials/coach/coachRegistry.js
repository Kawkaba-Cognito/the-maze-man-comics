/*
 * Which live training games have a live-board coach, and which are still owed
 * one. The single list `audit:coach` and `ModeShell` both read.
 *
 * COACH-PLAN.md is the reasoning; this file is the ledger. A game moves from
 * COACH_WAITING to COACH_IDS in the same commit that lands its coach, and the
 * gate fails if a game appears in both or in neither.
 *
 * ⚠ THE `@coachN` SUFFIX IS NOT DECORATION — IT IS THE WHOLE THING.
 *
 * `shouldRunOnboarding` keys off this id in `mm_tutorial_prefs_v2`, and the
 * retired rules carousel already wrote `{skipped:true}` / `{completed:true}`
 * under every game's PLAIN id. Register a coach as `'keep-track'` and it will
 * never auto-run for anyone who has already opened that game — it reaches fresh
 * installs only, silently, with nothing on screen and no error to notice. That
 * is how you ship eighteen tutorials and have nobody see seventeen of them.
 *
 * Bump the suffix again whenever a lesson materially changes, for the same
 * reason: `cancel-task@coach1` exists because the 2026-08-28 rewrite would
 * otherwise have been invisible to every existing player.
 *
 * ⚠ Plain `.js`, no imports — `audit:coach` loads this file directly in Node.
 */

/** gameKey → the versioned onboarding id its coach persists under. */
export const COACH_IDS = {
  'cancel-task': 'cancel-task@coach1',
  'keep-track': 'keep-track@coach1',
  'task-switch': 'task-switch@coach1',
  'sort-shift': 'sort-shift@coach1',
  synonyms: 'synonyms@coach1',
  trivia: 'trivia@coach1',
  'paired-associates': 'paired-associates@coach1',
  'speed-match': 'speed-match@coach1',
  gatekeeper: 'gatekeeper@coach1',
  detective: 'detective@coach1',
  'story-grid': 'story-grid@coach1',
  wordle: 'wordle@coach1',
  'rush-hour': 'rush-hour@coach1',
  mot: 'mot@coach1',
  'train-switch': 'train-switch@coach1',
  'math-gates': 'math-gates@coach1',
  intercept: 'intercept@coach1',
  'mirror-world': 'mirror-world@coach1',
};

/**
 * gameKey → the COACH-PLAN.md phase that owes it a coach.
 *
 * Phase 1 — DOM board, one stable surface
 * Phase 2 — DOM board, stateful / multi-phase
 * Phase 3 — canvas board, needs its own pointing API
 *
 * ⚠ THIS MUST REACH EMPTY. A game sitting here has no tutorial of any kind:
 * six of them additionally had a "How to play" button that opened nothing until
 * Phase 0 hid it.
 */
export const COACH_WAITING = {


};

/** The coach id for a game, or null when it has none yet. */
export function coachIdFor(gameKey) {
  return COACH_IDS[gameKey] || null;
}
