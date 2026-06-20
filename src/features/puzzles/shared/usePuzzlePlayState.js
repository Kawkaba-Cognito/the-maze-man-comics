import { useCallback } from 'react';
import { usePuzzleFrame } from './PuzzleFrameContext';

/**
 * During practice, reads/writes onboarding.trialState instead of local state
 * so the puzzle board is visible and interactive.
 */
export function usePuzzlePlayState(state, setState) {
  const frame = usePuzzleFrame();
  const onboarding = frame?.onboarding;
  const trialMode = !!frame?.trialMode;
  const activeState = trialMode ? onboarding?.trialState : state;

  const setActiveState = useCallback(
    (updater) => {
      if (trialMode && onboarding) {
        const prev = onboarding.trialState;
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (next) onboarding.setTrialState(next);
      } else {
        setState(updater);
      }
    },
    [trialMode, onboarding, setState],
  );

  const notifyAction = useCallback(
    (action) => {
      if (trialMode && onboarding) onboarding.applyTrialAction(action);
    },
    [trialMode, onboarding],
  );

  return { activeState, setActiveState, trialMode, notifyAction, onboarding };
}
