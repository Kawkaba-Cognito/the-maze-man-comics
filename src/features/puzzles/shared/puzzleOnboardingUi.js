/**
 * Shared onboarding wiring for board-style puzzle screens.
 * Replaces the old PuzzleTutorial + maybeShowTutorial pattern.
 */
import PuzzleOnboardingLayer from './PuzzleOnboardingLayer';
import { usePuzzleTutorial } from './usePuzzleTutorial';

export function useBoardPuzzleOnboarding(puzzleId, isAr, { onStartGame }) {
  const tutorial = usePuzzleTutorial(puzzleId, isAr, { onStartGame });
  const { onboarding, beginOnboarding, steps } = tutorial;

  const pickWithOnboarding = (size, startFn) => {
    startFn(size);
  };

  return {
    ...tutorial,
    pickWithOnboarding,
    OnboardingLayer: ({ config, playSfx }) => (
      <PuzzleOnboardingLayer
        onboarding={onboarding}
        config={config}
        steps={steps}
        isAr={isAr}
        playSfx={playSfx}
      />
    ),
  };
}

export { usePuzzleFrame } from './PuzzleFrameContext';
