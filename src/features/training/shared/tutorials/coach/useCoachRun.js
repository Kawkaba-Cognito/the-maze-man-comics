import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  markOnboardingSkipped,
  shouldRunOnboarding,
} from '../../../../shared/tutorials/tutorialStorage';

/*
 * useCoachRun — the game-level half of a live-board coach.
 *
 * Owns the three things every coach needs and no game should re-implement:
 * whether a lesson is owed, whether one is on screen right now, and the flag
 * that stops it being owed again. Lifted from cancellation's inline wiring
 * (COACH-PLAN.md Phase 0) so the other seventeen games get it from ModeShell
 * for free — see the `coach` entry in the `renderEngine` props bag.
 *
 * ── The two-stage life a coach has ──
 * `armed`  a lesson is OWED: first ever visit, or the player pressed "How to
 *          play". Arming does not put anything on screen.
 * `open`   a lesson is ON SCREEN. The game flips this itself, because only the
 *          game knows when a real round is actually running and pointable —
 *          cancellation opens on `phase === 'play' && playStep === 'running'`.
 *
 * ⚠ `openRef` EXISTS BECAUSE OF A REAL BUG CLASS, NOT FOR TIDINESS. Every
 * consequence in the host game — the clock, the wrong-answer penalty, the error
 * tally, the error cap, the auto-win, lives, `trialLog`, the rating award — has
 * to be guarded while the lesson is up, and those guards usually live inside
 * stable callbacks that would close over a stale `open`. Cancellation guarded
 * only the time penalty at first and shipped a LOSABLE tutorial: Survival has
 * one life, a 3-target board caps at 2 errors, and the coach's own crossed-out
 * hand invited error 1 of 2 — then any round end fired `endCoach`, marking the
 * lesson permanently done having never shown its last two steps.
 *
 * Guard EVERY consequence with `openRef.current`, not one.
 *
 * ⚠ AND KEEP TUTORIAL ACTIONS OUT OF THE MEASURE. A guided tap with unlimited
 * reading time is not a measurement: it must not reach `trialLog`, and it must
 * not feed `awardFreeRun`. Intercept proved the adjacent version of this — its
 * upgrade shop altered difficulty while the stage still fed the domain rating,
 * so two players with identical timing scored differently.
 */

const INERT = Object.freeze({});

export function useCoachRun(coachId, { onReplay } = {}) {
  const enabled = typeof coachId === 'string' && coachId.length > 0;

  /*
   * ⚠ A coach id with no `@coachN` suffix is the silent failure this whole
   * system is most likely to ship (see coachRegistry.js). The gate catches it in
   * CI; this catches it the first time anyone opens the game in dev, because a
   * lesson that simply never appears looks exactly like a lesson that is off.
   */
  useEffect(() => {
    if (!enabled || !import.meta.env?.DEV) return;
    if (!/@coach\d+$/.test(coachId)) {
      console.warn(
        `[coach] '${coachId}' has no @coachN suffix. Existing players already have a`
        + ' tutorial flag stored under the plain game id, so this lesson will never'
        + ' auto-run for them. See shared/tutorials/coach/coachRegistry.js.',
      );
    }
  }, [coachId, enabled]);

  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  useEffect(() => { openRef.current = open; }, [open]);

  /*
   * ⚠ `onReplay` IS HELD IN A REF ON PURPOSE. Callers write it inline —
   * `onReplay: () => startFreeRef.current?.()` — so it is a new function every
   * render. Listing it in `replay`'s deps would rebuild `replay`, which rebuilds
   * the returned object, which makes `coach` a new identity on every render of
   * every game using it. Anything a game puts `coach` in a dependency array for
   * would then re-run constantly.
   */
  const onReplayRef = useRef(onReplay);
  onReplayRef.current = onReplay;

  /* Read once on mount: `shouldRunOnboarding` hits localStorage, and the answer
     must not change under the game mid-session. */
  const [armed, setArmed] = useState(() => (enabled ? shouldRunOnboarding(coachId) : false));

  /** The lesson is on screen — the game decides when a round is pointable. */
  const begin = useCallback(() => {
    if (!enabled) return;
    setOpen(true);
  }, [enabled]);

  /**
   * Done with the lesson, however it ended (finished, skipped, Escape, or the
   * round resolving underneath it). Persists, so it is not owed again.
   *
   * ⚠ The host usually has one more thing to do here — cancellation resolves a
   * board the player cleared during the lesson, because the auto-win was
   * suppressed while the coach was open and would otherwise leave them on an
   * empty board with a running clock. Pass that as `after`.
   */
  const end = useCallback((after) => {
    setOpen(false);
    setArmed(false);
    if (enabled) markOnboardingSkipped(coachId);
    after?.();
  }, [coachId, enabled]);

  /** The hub's "How to play" — arm the lesson and drop into a live round. */
  const replay = useCallback(() => {
    if (!enabled) return;
    setArmed(true);
    onReplayRef.current?.();
  }, [enabled]);

  return useMemo(() => (enabled
    ? { enabled: true, id: coachId, armed, open, openRef, begin, end, replay, setArmed }
    : { enabled: false, id: null, armed: false, open: false, openRef, begin, end, replay, setArmed, ...INERT }
  ), [enabled, coachId, armed, open, begin, end, replay]);
}

export default useCoachRun;
