import React from 'react';
import { useTrainingTutorial } from './useTrainingTutorial';
import { getTrainingMeta } from './trainingMeta';
import TrainingOnboardingLayer from './TrainingOnboardingLayer';
import { TUTORIAL_UI } from './tutorialContent';

/** Hook + overlay layer for legacy training games (custom hub screens). */
export function useTrainingTutorialHost(gameId, isAr, playSfx) {
  const tutorial = useTrainingTutorial(gameId, isAr);
  const meta = getTrainingMeta(gameId);
  const labels = TUTORIAL_UI[isAr ? 'ar' : 'en'];
  const layer = tutorial.onboarding.phase ? (
    <TrainingOnboardingLayer
      onboarding={tutorial.onboarding}
      config={meta}
      steps={tutorial.steps}
      isAr={isAr}
      playSfx={playSfx}
    />
  ) : null;
  return {
    openTutorial: tutorial.openTutorial,
    replayHint: labels.replayTutorial,
    layer,
  };
}
