import React from 'react';

const UI = {
  en: {
    heading: 'Practice before you play',
    sub: 'Two guided rounds on the smallest grid — no points awarded.',
    step1: 'Practice 1 — guided lesson',
    step1detail: 'We walk you through every rule, step by step.',
    step2: 'Practice 2 — try it yourself',
    step2detail: 'Same size grid, but hints are free if you need help.',
    then: 'Then you pick your grid size and play for real.',
    start: 'Start Practice 1',
    skip: 'Skip practice',
  },
  ar: {
    heading: 'تمرين قبل اللعب',
    sub: 'جولتان على أصغر شبكة — بدون نقاط.',
    step1: 'التمرين ١ — درس موجّه',
    step1detail: 'نشرح كل قاعدة خطوة بخطوة.',
    step2: 'التمرين ٢ — جرّب بنفسك',
    step2detail: 'نفس الحجم، والتلميحات مجانية إذا احتجت.',
    then: 'ثم تختار حجم الشبكة وتلعب فعلياً.',
    start: 'ابدأ التمرين ١',
    skip: 'تخطّي التمرين',
  },
};

/** Full-screen bridge between rules carousel and coached trial. */
export default function TrialIntroPanel({ isAr, onStart, onSkip, playSfx }) {
  const t = UI[isAr ? 'ar' : 'en'];

  return (
    <div className="mm-tut-root mm-tut-root--intro" role="dialog" aria-modal="true" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mm-tut-card mm-tut-card--intro">
        <h2 className="mm-tut-intro-heading">{t.heading}</h2>
        <p className="mm-tut-intro-sub">{t.sub}</p>

        <ol className="mm-tut-intro-steps">
          <li>
            <span className="mm-tut-intro-num">1</span>
            <div>
              <strong>{t.step1}</strong>
              <p>{t.step1detail}</p>
            </div>
          </li>
          <li>
            <span className="mm-tut-intro-num">2</span>
            <div>
              <strong>{t.step2}</strong>
              <p>{t.step2detail}</p>
            </div>
          </li>
        </ol>

        <p className="mm-tut-intro-then">{t.then}</p>

        <div className="mm-tut-actions mm-tut-actions--stack">
          <button
            type="button"
            className="mm-tut-btn mm-tut-btn--pri"
            onClick={() => { playSfx?.('click'); onStart?.(); }}
          >
            {t.start}
          </button>
          <button
            type="button"
            className="mm-tut-btn mm-tut-btn--ghost"
            onClick={() => { playSfx?.('click'); onSkip?.(); }}
          >
            {t.skip}
          </button>
        </div>
      </div>
    </div>
  );
}
