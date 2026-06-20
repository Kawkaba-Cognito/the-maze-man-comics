import { useState, useCallback } from 'react';
import {
  markOnboardingSkipped,
} from '../../shared/tutorials/tutorialStorage';
import { getDiagramSteps } from './tutorialSteps';
import { getTutorialSteps } from './tutorialContent';
import { usePuzzleOnboarding } from './usePuzzleOnboarding';

/** Rules steps + onboarding flow for a puzzle game. */
export function usePuzzleTutorial(puzzleId, isAr, { onStartGame, onOnboardingComplete } = {}) {
  const steps = getDiagramSteps(puzzleId, isAr) ?? getTutorialSteps(puzzleId, isAr);
  const onboarding = usePuzzleOnboarding(puzzleId, isAr, { onOnboardingComplete });

  const openTutorial = useCallback(() => {
    onboarding.openRules();
  }, [onboarding]);

  const closeTutorial = useCallback(() => {
    /* rules-only carousel closes via closeRules */
  }, []);

  const beginOnboarding = useCallback(() => {
    onboarding.begin();
  }, [onboarding]);

  const startGame = useCallback(
    (size) => {
      onStartGame?.(size);
    },
    [onStartGame],
  );

  return {
    steps,
    onboarding,
    beginOnboarding,
    startGame,
    openTutorial,
    closeTutorial,
    tutorialOpen: onboarding.phase === 'carousel' || onboarding.rulesOnly,
  };
}

export function skipPuzzleOnboardingForever(puzzleId) {
  markOnboardingSkipped(puzzleId);
}
