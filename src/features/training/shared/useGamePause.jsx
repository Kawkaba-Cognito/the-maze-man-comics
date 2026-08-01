import React, { useCallback, useState } from 'react';
import { TrainingPauseModal } from './TrainingChrome';
import { STR_COMMON } from './trainingStrings';
import { setTrainingPaused } from './pauseStore';
import { setScenePaused } from './c3dBoot';

/*
 * useGamePause — one pause, wired the same way in every game.
 *
 * ── Why a hook and not "just add a modal" ─────────────────────────────────
 * A correct pause is four things, and hand-writing them per game is how they
 * drift apart:
 *
 *   1. the modal (Cancellation's, so they look identical)
 *   2. the global paused flag, which is what makes useSurvivalCountdown and
 *      nowMs() actually stop — without it the run drains behind the menu,
 *      measured at 34s -> 30s across four paused seconds before this existed
 *   3. freezing the 3D scene clock, for games that have one
 *   4. clearing the flag on quit, or the NEXT game mounts already paused
 *
 * Step 4 is the one that bites: the flag is global, so a game that leaves
 * without unsetting it poisons the whole session. Every exit path here goes
 * through the same function so that cannot happen.
 *
 * ── Use ───────────────────────────────────────────────────────────────────
 *   const pause = useGamePause({ isAr, playSfx, onQuit: onExit, sceneRef });
 *
 *   <PlayHud … pauseOpen={pause.open} onPause={pause.open ? undefined : pause.start} />
 *   {pause.modal}
 *
 * `sceneRef` is optional — pass the element a c3d scene is mounted into and its
 * render clock freezes too. DOM-only games leave it out.
 */
export function useGamePause({ isAr, playSfx, onQuit, sceneRef, onResume, onPause } = {}) {
  const [open, setOpen] = useState(false);
  const L = isAr ? STR_COMMON.ar : STR_COMMON.en;

  const apply = useCallback((paused) => {
    setTrainingPaused(paused);
    if (sceneRef?.current) setScenePaused(sceneRef.current, paused);
  }, [sceneRef]);

  const start = useCallback(() => {
    playSfx?.('click');
    apply(true);
    setOpen(true);
    onPause?.();
  }, [apply, playSfx, onPause]);

  const stop = useCallback(() => {
    playSfx?.('click');
    apply(false);
    setOpen(false);
    onResume?.();
  }, [apply, playSfx, onResume]);

  const quit = useCallback(() => {
    playSfx?.('click');
    // Always clear the global flag before leaving — see note 4 above.
    apply(false);
    setOpen(false);
    onQuit?.();
  }, [apply, playSfx, onQuit]);

  const modal = (
    <TrainingPauseModal
      open={open}
      labels={L}
      showRestart={false}
      onResume={stop}
      onQuitMenu={quit}
    />
  );

  return {
    open, start, stop, quit, modal, labels: L,
  };
}

export default useGamePause;
