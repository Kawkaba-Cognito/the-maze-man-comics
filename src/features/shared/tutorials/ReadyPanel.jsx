import React from 'react';

const UI = {
  en: {
    badge: 'PRACTICE COMPLETE',
    heading: 'You\'re ready!',
    sub: 'You learned the rules in practice mode — no points were awarded. Now pick a grid size and play for real.',
    cta: 'Choose grid size',
  },
  ar: {
    badge: 'انتهى التمرين',
    heading: 'أنت جاهز!',
    sub: 'تعلّمت القواعد في وضع التمرين — بدون نقاط. الآن اختر حجم الشبكة والعب فعلياً.',
    cta: 'اختر حجم الشبكة',
  },
};

/** Shown after both practice rounds — leads back to size picker. */
export default function ReadyPanel({ isAr, playSfx, onContinue }) {
  const t = UI[isAr ? 'ar' : 'en'];

  return (
    <div className="mm-tut-root mm-tut-root--ready" role="dialog" aria-modal="true" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mm-tut-card mm-tut-card--ready">
        <span className="mm-tut-ready-badge">{t.badge}</span>
        <h2 className="mm-tut-ready-heading">{t.heading}</h2>
        <p className="mm-tut-ready-sub">{t.sub}</p>
        <button
          type="button"
          className="mm-tut-btn mm-tut-btn--pri"
          onClick={() => { playSfx?.('win'); onContinue?.(); }}
        >
          {t.cta}
        </button>
      </div>
    </div>
  );
}
