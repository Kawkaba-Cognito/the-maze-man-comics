import React from 'react';
import TutorialCarousel from '../../../shared/tutorials/TutorialCarousel';
import ReadyPanel from '../../../shared/tutorials/ReadyPanel';
import { TUTORIAL_UI } from './tutorialContent';

export function rulesTitle(config, isAr) {
  const name = isAr ? config.nameAr : config.name;
  return isAr ? `قواعد ${name}` : `Rules for ${name}`;
}

/** Carousel + ready screen for training games. */
export default function TrainingOnboardingLayer({
  onboarding,
  config,
  steps,
  isAr,
  playSfx,
}) {
  const { phase, rulesOnly } = onboarding;
  const labels = TUTORIAL_UI[isAr ? 'ar' : 'en'];
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

  if (phase === 'ready') {
    return (
      <ReadyPanel
        isAr={isAr}
        playSfx={playSfx}
        onContinue={onboarding.finishReady}
        heading={labels.readyHeading}
        sub={labels.readySub}
        cta={labels.readyCta}
      />
    );
  }

  return null;
}
