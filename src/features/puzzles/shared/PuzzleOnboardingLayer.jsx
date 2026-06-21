import React from 'react';
import TutorialCarousel from '../../shared/tutorials/TutorialCarousel';
import TrialPracticePanel from '../../shared/tutorials/TrialPracticePanel';
import ReadyPanel from '../../shared/tutorials/ReadyPanel';

export function rulesTitle(config, isAr) {
  const name = isAr ? config.nameAr : config.name;
  return isAr ? `قواعد ${name}` : `Rules for ${name}`;
}

/** Carousel + practice panels + ready screen. */
export default function PuzzleOnboardingLayer({
  onboarding,
  config,
  steps,
  isAr,
  playSfx,
}) {
  const { phase, rulesOnly } = onboarding;
  if (!phase) return null;

  if (phase === 'carousel') {
    return (
      <TutorialCarousel
        title={rulesTitle(config, isAr)}
        steps={steps}
        isAr={isAr}
        mode={rulesOnly ? 'rules-only' : 'onboarding'}
        playSfx={playSfx}
        onSkipAll={onboarding.skipAll}
        onFinish={onboarding.finishCarousel}
        onClose={onboarding.closeRules}
      />
    );
  }

  if (phase === 'coached') {
    return (
      <TrialPracticePanel
        step={onboarding.currentCoachStep}
        stepIndex={onboarding.coachIndex}
        totalSteps={onboarding.coachSteps.length}
        isAr={isAr}
        playSfx={playSfx}
        reinforcement={onboarding.reinforcement}
        freeHints={onboarding.freeHints}
        onNext={onboarding.advanceCoach}
        onSkipTrial={onboarding.skipTrials}
      />
    );
  }

  if (phase === 'ready') {
    return (
      <ReadyPanel
        isAr={isAr}
        playSfx={playSfx}
        onContinue={onboarding.finishReady}
      />
    );
  }

  return null;
}
