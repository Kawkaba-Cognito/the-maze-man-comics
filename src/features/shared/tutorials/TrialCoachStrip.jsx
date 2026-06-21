import React from 'react';

const UI = {
  en: {
    coached: 'Guided practice',
    skipTrial: 'Skip practice',
    next: 'Next',
  },
  ar: {
    coached: 'تمرين موجّه',
    skipTrial: 'تخطّي التمرين',
    next: 'التالي',
  },
};

/** Minimal coach bar — text only, no characters. */
export default function TrialCoachStrip({
  step,
  stepIndex,
  totalSteps,
  isAr,
  onNext,
  onSkipTrial,
  playSfx,
}) {
  const t = UI[isAr ? 'ar' : 'en'];
  const label = t.coached;
  const showNext = step?.gate === 'next';

  return (
    <div className="mm-tut-coach" dir={isAr ? 'rtl' : 'ltr'} role="status">
      <div className="mm-tut-coach-inner">
        <div className="mm-tut-coach-meta">
          <span className="mm-tut-coach-label">{label}</span>
          {totalSteps > 1 ? (
            <span className="mm-tut-coach-step">{stepIndex + 1}/{totalSteps}</span>
          ) : null}
        </div>
        <p className="mm-tut-coach-text">{step?.text}</p>
        <div className="mm-tut-coach-actions">
          <button
            type="button"
            className="mm-tut-btn mm-tut-btn--ghost mm-tut-btn--sm"
            onClick={() => {
              playSfx?.('click');
              onSkipTrial?.();
            }}
          >
            {t.skipTrial}
          </button>
          {showNext ? (
            <button
              type="button"
              className="mm-tut-btn mm-tut-btn--pri mm-tut-btn--sm"
              onClick={() => {
                playSfx?.('click');
                onNext?.();
              }}
            >
              {t.next}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
