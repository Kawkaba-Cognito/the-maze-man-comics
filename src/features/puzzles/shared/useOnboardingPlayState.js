import { useCallback } from 'react';

/** Trial-aware state for puzzles that manage their own screen (not PuzzleScreenFrame). */
export function useOnboardingPlayState(state, setState, onboarding) {
  const trialMode = onboarding.trialActive;
  const displayState = trialMode ? onboarding.trialState : state;

  const runTrialOrSet = useCallback(
    (action, updater) => {
      if (trialMode) onboarding.applyTrialAction(action);
      else setState(updater);
    },
    [trialMode, onboarding, setState],
  );

  return { trialMode, displayState, runTrialOrSet };
}
