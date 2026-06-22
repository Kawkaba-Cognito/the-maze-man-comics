import { useCallback } from 'react';
import { getTrainingDiagramSteps } from './trainingTutorialSteps';
import { useTrainingOnboarding } from './useTrainingOnboarding';

/** Rules carousel + onboarding flow for a training game. */
export function useTrainingTutorial(gameId, isAr) {
  const steps = getTrainingDiagramSteps(gameId, isAr) ?? [];
  const onboarding = useTrainingOnboarding(gameId, isAr);

  const openTutorial = useCallback(() => {
    onboarding.openRules();
  }, [onboarding]);

  return {
    steps,
    onboarding,
    openTutorial,
    tutorialOpen: onboarding.phase === 'carousel' || onboarding.rulesOnly,
  };
}
