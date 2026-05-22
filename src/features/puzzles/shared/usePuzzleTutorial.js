import { useState, useCallback } from 'react';
import {
  hasSeenPuzzleTutorial,
  markPuzzleTutorialSeen,
  getTutorialSteps,
} from './tutorialContent';

/** Manages tutorial open state + first-visit auto-show for a puzzle game. */
export function usePuzzleTutorial(puzzleId, isAr) {
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const steps = getTutorialSteps(puzzleId, isAr);

  const openTutorial = useCallback(() => setTutorialOpen(true), []);

  const closeTutorial = useCallback(() => {
    markPuzzleTutorialSeen(puzzleId);
    setTutorialOpen(false);
  }, [puzzleId]);

  const maybeShowTutorial = useCallback(() => {
    if (!hasSeenPuzzleTutorial(puzzleId)) setTutorialOpen(true);
  }, [puzzleId]);

  return { tutorialOpen, steps, openTutorial, closeTutorial, maybeShowTutorial };
}
