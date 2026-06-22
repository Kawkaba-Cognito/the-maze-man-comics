import { useState, useCallback, useMemo } from 'react';
import {
  markOnboardingComplete,
  markOnboardingSkipped,
  shouldRunOnboarding,
} from '../../../shared/tutorials/tutorialStorage';
import { getTrainingTrial } from './trainingTrials';

/**
 * Training onboarding: carousel → ready → hub (mode pick).
 * phase: null | 'carousel' | 'ready'
 */
export function useTrainingOnboarding(gameId, isAr) {
  const trial = useMemo(() => getTrainingTrial(gameId), [gameId]);
  const [phase, setPhase] = useState(() => (shouldRunOnboarding(gameId) ? 'carousel' : null));
  const [rulesOnly, setRulesOnly] = useState(false);

  const returnToHub = useCallback(() => {
    setPhase(null);
    setRulesOnly(false);
  }, []);

  const openRules = useCallback(() => {
    setRulesOnly(true);
    setPhase('carousel');
  }, []);

  const skipAll = useCallback(() => {
    if (!rulesOnly) markOnboardingSkipped(gameId);
    returnToHub();
  }, [returnToHub, gameId, rulesOnly]);

  const finishReady = useCallback(() => {
    markOnboardingComplete(gameId);
    returnToHub();
  }, [returnToHub, gameId]);

  const finishCarousel = useCallback(
    ({ dontShowAgain }) => {
      if (rulesOnly) {
        if (dontShowAgain) markOnboardingSkipped(gameId);
        setPhase(null);
        setRulesOnly(false);
        return;
      }
      if (dontShowAgain) {
        markOnboardingSkipped(gameId);
        returnToHub();
        return;
      }
      if (!trial || trial.skipTrials) {
        setPhase('ready');
        return;
      }
      setPhase('ready');
    },
    [gameId, returnToHub, rulesOnly, trial],
  );

  const closeRules = useCallback(
    ({ dontShowAgain }) => {
      if (dontShowAgain) markOnboardingSkipped(gameId);
      setPhase(null);
      setRulesOnly(false);
    },
    [gameId],
  );

  return {
    phase,
    rulesOnly,
    shouldRun: shouldRunOnboarding(gameId),
    onboardingOpen: phase != null,
    trialActive: false,
    freeHints: false,
    reinforcement: null,
    coachIndex: 0,
    coachSteps: [],
    currentCoachStep: null,
    openRules,
    skipAll,
    finishCarousel,
    closeRules,
    skipTrials: finishReady,
    advanceCoach: () => {},
    finishReady,
  };
}
