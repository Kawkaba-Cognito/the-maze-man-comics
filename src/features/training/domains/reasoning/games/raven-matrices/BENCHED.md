# Matrix Reasoning — benched 2026-08-20

Replaced in the reasoning hub by **The Gate** (`../gatekeeper/`).

## Why

Not because it was badly built. It was benched because of what it *measures*,
and because the domain had a hole next to it.

Raven's matrices measure whether you **spot** a rule that is already fully laid
out in front of you. The grid is complete, the pattern is there, and nothing the
player does changes what they are shown. That is one half of fluid reasoning and
a perfectly real one.

The other half — **generating a hypothesis, designing a test for it, and
revising** — was measured nowhere in this app. Block Escape is planning, and
Detective is deduction from statements you are handed. Nothing asked the player
to go and *find out*.

The Gate is that: a secret law, a tray of travellers, a small budget of probes,
and Haris stamping each one IN or OUT. Which travellers you choose to spend a
probe on is the task. It is the Wason 2-4-6 / Zendo family, and because the
engine holds the whole hypothesis space it can report how much each probe
actually narrowed it — a direct measure of confirmation bias, reported beside
accuracy and never folded into it.

## What was deliberately left in place

Following the precedent of `speed/games/trail-making`:

- `gameScience.js` still has its `raven-matrices` entry
- `tutorials/trainingMeta.js` and `trainingTutorialSteps.jsx` still have theirs
- `rating.js` still maps `raven: { gameKey: 'raven-matrices' }`, so **old player
  records stay readable**. It is out of `ACTIVE_RATED_GAME_KEYS`, so it no longer
  shapes a domain score.
- **`reasoning-matrix-iq-v2.webp` is still referenced** — The Gate's hub tile
  borrows it via `COVER_FILE_OVERRIDES.gatekeeper` until bespoke art exists. Do
  not delete that file.

## What was moved off it

⚠ The Daily Workout used to schedule `raven-matrices` by weight in **three**
places in `workoutData.js`. All three now name `gatekeeper`.

That mattered: `lazyGames.js` builds from the registry, so unregistering a game
also removes it from `getLazyGame`, which returns `null` — and every caller then
does `if (!X) return null`, rendering **nothing**, with no throw and no warning.
Leaving the workout pointing at a game with no hub slot is exactly the silent
failure `npm run audit:gamekeys` exists to catch. Nothing now references
`raven-matrices` as a live game key, so no fallback registration is needed.

The assessment battery never used it (checked before unregistering:
`git grep -n "gameKey: 'raven-matrices'" -- src/features/training/assessment`).

## Re-enabling it

Add the sub back to `reasoning/domain.config.js` and put its key back into
`ACTIVE_RATED_GAME_KEYS`, `COVER_KEYS` and `COVER_FILE_OVERRIDES`. The game code
itself is untouched and still builds.
