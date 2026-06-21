import React from 'react';

const UI = {
  en: {
    practice: 'PRACTICE MODE',
    practiceNote: 'No points — learn the rules here',
    coached: 'Guided practice',
    freeHints: 'Free hints and guidance available',
    skipTrial: 'Skip practice',
    next: 'Next',
  },
  ar: {
    practice: 'وضع التمرين',
    practiceNote: 'بدون نقاط — تعلّم القواعد هنا',
    coached: 'تمرين موجّه',
    freeHints: 'تلميحات وإرشاد مجاني',
    skipTrial: 'تخطّي التمرين',
    next: 'التالي',
  },
};

/** Top practice banner — clearly separates trial from real play. */
export default function TrialPracticePanel({
  step,
  stepIndex,
  totalSteps,
  isAr,
  reinforcement,
  freeHints,
  onNext,
  onSkipTrial,
  playSfx,
}) {
  const t = UI[isAr ? 'ar' : 'en'];
  const phaseLabel = t.coached;
  const showNext = step?.gate === 'next';
  const mainText = reinforcement || step?.text;

  return (
    <div className="mm-tut-practice-bar" dir={isAr ? 'rtl' : 'ltr'} role="status">
      <div className="mm-tut-practice-bar-inner mm-tut-practice-bar-inner--prominent">
        <div className="mm-tut-practice-bar-top">
          <span className="mm-tut-practice-badge">{t.practice}</span>
          <span className="mm-tut-practice-phase">{phaseLabel}</span>
          {totalSteps > 1 ? (
            <span className="mm-tut-practice-count">{stepIndex + 1}/{totalSteps}</span>
          ) : null}
        </div>
        <p className="mm-tut-practice-note">{t.practiceNote}</p>
        <div className="mm-tut-practice-progress">
          <div
            className="mm-tut-practice-progress-fill"
            style={totalSteps > 1 ? { width: `${((stepIndex + 1) / totalSteps) * 100}%` } : undefined}
          />
        </div>
        {freeHints ? (
          <p className="mm-tut-practice-free-hint">{t.freeHints}</p>
        ) : null}
        <p className={`mm-tut-practice-text${reinforcement ? ' mm-tut-practice-text--cheer' : ''}`}>{mainText}</p>
        <div className="mm-tut-practice-actions">
          <button
            type="button"
            className="mm-tut-btn mm-tut-btn--ghost mm-tut-btn--sm"
            onClick={() => { playSfx?.('click'); onSkipTrial?.(); }}
          >
            {t.skipTrial}
          </button>
          {showNext ? (
            <button
              type="button"
              className="mm-tut-btn mm-tut-btn--pri mm-tut-btn--sm"
              onClick={() => { playSfx?.('click'); onNext?.(); }}
            >
              {t.next}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
