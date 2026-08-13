# Trail Making — benched 2026-08-14

Replaced in the speed domain by **Intercept**. The code is complete and works;
it is unregistered, not broken. `domain.config.js` no longer lists it and
`workoutData.js` no longer schedules it.

## Why

Not because it was badly built — at 19/22 on `audit:consistency` it scored above
most of the app. The problem was the **domain**, not the game.

The speed domain's other two games are Speed Match (match each symbol to its
digit code) and Math Gates (arithmetic under time pressure). Both are **foveal,
symbolic and sequential**: look at one thing in the middle of the screen, decode
a symbol, respond. Trail Making — connect numbered nodes in order — is a third
one of those. Three games, one shape of task, and the domain read as a single
game played three ways.

The player's words were that they did not like it, and the measurable version of
that is: nothing in the domain touched peripheral vision, parallel processing,
spatial prediction or timing. Intercept is none of the three things the others
are, which is why it took the slot rather than being added alongside.

## What replaced it, and what that keeps

Intercept is coincidence anticipation timing: a shape crosses toward a line,
disappears behind cover, and you tap the instant it would arrive. It keeps the
domain's construct — speed — while measuring it as a **signed error in
milliseconds** rather than a count of correct responses, which also gives the
domain its first directional measure (players learn whether they run early or
late, which is more useful than knowing they were 80ms off).

## Before restoring it

Nothing depends on this folder. If it is ever brought back:

1. Re-add the sub to `domains/speed/domain.config.js` with its `loader`.
2. Restore its `rating.js` entry (the old key was `trailMaking`).
3. Restore `trainingMeta.js` and `GamePlanetTile`'s `COVER_KEYS` /
   `COVER_FILE_OVERRIDES` entries — Intercept currently borrows this game's
   cover art (`speed-trail-making-v2.webp`), so it needs its own first.
4. `gameScience.js` still holds the Trail Making entry; it was left in place.
5. Decide what it displaces. A fourth speed game is fine; a fourth *foveal
   symbolic sequential* speed game is what got it benched.
