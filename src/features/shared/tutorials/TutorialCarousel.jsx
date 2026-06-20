import React, { useCallback, useRef, useState } from 'react';

const UI = {
  en: {
    skipPlay: 'Skip Tutorial & Play!',
    skipClose: 'Close',
    dontShow: "Don't show again",
    next: 'Next',
    startPractice: 'Start Practice',
    swipe: 'Swipe for more',
    stepOf: (n, t) => `${n} / ${t}`,
  },
  ar: {
    skipPlay: 'تخطّي الشرح والعب!',
    skipClose: 'إغلاق',
    dontShow: 'لا تُظهر مرة أخرى',
    next: 'التالي',
    startPractice: 'ابدأ التمرين',
    swipe: 'اسحب للمزيد',
    stepOf: (n, t) => `${n} / ${t}`,
  },
};

export default function TutorialCarousel({
  title,
  steps,
  isAr,
  mode = 'onboarding',
  onSkipAll,
  onFinish,
  onClose,
  playSfx,
}) {
  const t = UI[isAr ? 'ar' : 'en'];
  const [idx, setIdx] = useState(0);
  const [dontShow, setDontShow] = useState(false);
  const touchRef = useRef({ x: 0, y: 0 });

  const total = steps.length;
  const step = steps[idx];
  if (!step || total === 0) return null;

  const isLast = idx === total - 1;
  const rtl = isAr;

  const go = useCallback(
    (next) => {
      playSfx?.('click');
      setIdx(Math.max(0, Math.min(next, total - 1)));
    },
    [playSfx, total],
  );

  const handleSkip = () => {
    playSfx?.('click');
    if (mode === 'rules-only') onClose?.({ dontShowAgain: dontShow });
    else onSkipAll?.();
  };

  const handlePrimary = () => {
    playSfx?.('click');
    if (isLast) onFinish?.({ dontShowAgain: dontShow });
    else go(idx + 1);
  };

  const onTouchStart = (e) => {
    const p = e.changedTouches?.[0] || e.touches?.[0];
    if (p) touchRef.current = { x: p.clientX, y: p.clientY };
  };

  const onTouchEnd = (e) => {
    const p = e.changedTouches?.[0];
    if (!p) return;
    const dx = p.clientX - touchRef.current.x;
    const dy = p.clientY - touchRef.current.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) go(rtl ? idx - 1 : idx + 1);
    else go(rtl ? idx + 1 : idx - 1);
  };

  const primaryLabel = isLast
    ? (mode === 'rules-only' ? t.next : t.startPractice)
    : t.next;

  return (
    <div
      className="mm-tut-root"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      dir={rtl ? 'rtl' : 'ltr'}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="mm-tut-card">
        <header className="mm-tut-header">
          <div className="mm-tut-title-pill">{title}</div>
          {step.title ? <h2 className="mm-tut-step-title">{step.title}</h2> : null}
        </header>

        <div className="mm-tut-content">
          <p className="mm-tut-body">{step.body}</p>

          {step.diagram ? (
            <div className="mm-tut-diagram">{step.diagram}</div>
          ) : step.icon ? (
            <div className="mm-tut-icon" aria-hidden="true">{step.icon}</div>
          ) : null}

          {step.pills?.length ? (
            <ul className="mm-tut-pills">
              {step.pills.map((pill) => (
                <li key={pill}>{pill}</li>
              ))}
            </ul>
          ) : null}

          {step.note ? <p className="mm-tut-note">{step.note}</p> : null}
        </div>

        <footer className="mm-tut-footer">
          <div className="mm-tut-footer-meta">
            <span className="mm-tut-swipe-hint">{t.swipe}</span>
            <span className="mm-tut-page">{t.stepOf(idx + 1, total)}</span>
          </div>

          <div className="mm-tut-dots" role="tablist" aria-label={title}>
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === idx}
                className={`mm-tut-dot${i === idx ? ' mm-tut-dot--on' : ''}`}
                onClick={() => go(i)}
              />
            ))}
          </div>

          <label className="mm-tut-check">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
            />
            <span>{t.dontShow}</span>
          </label>

          <div className="mm-tut-actions">
            <button type="button" className="mm-tut-btn mm-tut-btn--ghost" onClick={handleSkip}>
              {mode === 'rules-only' ? t.skipClose : t.skipPlay}
            </button>
            <button type="button" className="mm-tut-btn mm-tut-btn--pri" onClick={handlePrimary}>
              {primaryLabel}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
