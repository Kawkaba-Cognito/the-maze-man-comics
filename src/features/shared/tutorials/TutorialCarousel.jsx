import React, { useCallback, useEffect, useRef, useState } from 'react';

const UI = {
  en: {
    skipPlay: 'Skip Tutorial & Play!',
    skipClose: 'Close',
    dontShow: "Don't show again",
    next: 'Next',
    startPractice: 'Start Practice',
    swipe: 'Swipe or use arrow keys',
    stepOf: (n, t) => `Step ${n} of ${t}`,
    interactive: 'Interactive Preview',
  },
  ar: {
    skipPlay: 'تخطّي الشرح والعب!',
    skipClose: 'إغلاق',
    dontShow: 'لا تُظهر مرة أخرى',
    next: 'التالي',
    startPractice: 'ابدأ التمرين',
    swipe: 'اسحب أو استخدم الأسهم',
    stepOf: (n, t) => `الخطوة ${n} من ${t}`,
    interactive: 'معاينة تفاعلية',
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
  const [diagramPing, setDiagramPing] = useState(false);
  const touchRef = useRef({ x: 0, y: 0 });

  const total = steps.length;
  const go = useCallback(
    (next) => {
      playSfx?.('click');
      setIdx(Math.max(0, Math.min(next, total - 1)));
    },
    [playSfx, total],
  );

  const step = steps[idx];
  const isLast = idx === total - 1;
  const rtl = isAr;

  const handleSkip = useCallback(() => {
    playSfx?.('click');
    if (mode === 'rules-only') onClose?.({ dontShowAgain: dontShow });
    else onSkipAll?.();
  }, [mode, onClose, onSkipAll, playSfx, dontShow]);

  const handlePrimary = useCallback(() => {
    playSfx?.('click');
    if (isLast) onFinish?.({ dontShowAgain: dontShow });
    else go(idx + 1);
  }, [isLast, onFinish, dontShow, go, idx, playSfx]);

  // Keyboard navigation: Left/Right arrows and Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(rtl ? idx - 1 : idx + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(rtl ? idx + 1 : idx - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, handleSkip, idx, rtl]);

  if (!step || total === 0) return null;

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

  const handleDiagramClick = () => {
    playSfx?.('tap');
    setDiagramPing(true);
    setTimeout(() => setDiagramPing(false), 450);
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
          <div className="mm-tut-header-top">
            <div className="mm-tut-title-pill">{title}</div>
            <span className="mm-tut-step-badge">{t.stepOf(idx + 1, total)}</span>
          </div>

          <div className="mm-tut-progress-bar" aria-hidden="true">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`mm-tut-progress-seg ${i < idx ? 'is-done' : ''} ${i === idx ? 'is-active' : ''}`}
                onClick={() => go(i)}
              />
            ))}
          </div>

          {step.title ? <h2 className="mm-tut-step-title">{step.title}</h2> : null}
        </header>

        <div className="mm-tut-content">
          <p className="mm-tut-body">{step.body}</p>

          {step.diagram ? (
            <div
              className={`mm-tut-diagram mm-tut-diagram--interactive ${diagramPing ? 'is-pinging' : ''}`}
              onClick={handleDiagramClick}
              role="button"
              tabIndex={0}
              aria-label={t.interactive}
            >
              {step.diagram}
            </div>
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
            <span className="mm-tut-page">{idx + 1} / {total}</span>
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
              <span>{primaryLabel}</span>
              {!isLast && <span className="mm-tut-btn-arr">{rtl ? '←' : '→'}</span>}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
