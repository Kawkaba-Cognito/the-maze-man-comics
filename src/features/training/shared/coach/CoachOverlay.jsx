import React, { useCallback, useEffect, useState } from 'react';
import MazeManAvatar from '../MazeManAvatar';

const COACH_LABELS = {
  en: { skip: 'Skip', next: 'Next', done: "Let's play!", stepOf: (n, t) => `Step ${n} of ${t}` },
  ar: { skip: 'تخطّي', next: 'التالي', done: 'لنلعب!', stepOf: (n, t) => `الخطوة ${n} من ${t}` },
};

/**
 * CoachOverlay — dims the live game board and spotlights one element, with a
 * coach speech bubble. The dim is drawn by a huge box-shadow on the spotlight
 * box, and the whole overlay is pointer-events:none EXCEPT the bubble, so the
 * spotlighted real element underneath stays tappable.
 */
export default function CoachOverlay({ step, index, total, onNext, onSkip, isAr }) {
  const labels = isAr ? COACH_LABELS.ar : COACH_LABELS.en;
  const [rect, setRect] = useState(null);

  const measure = useCallback(() => {
    const el = step?.anchorRef?.current;
    if (el && typeof el.getBoundingClientRect === 'function') {
      const r = el.getBoundingClientRect();
      if (r.width || r.height) {
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        return;
      }
    }
    setRect(null);
  }, [step]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    const id = setInterval(measure, 250); // keep aligned while the board animates
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      clearInterval(id);
    };
  }, [measure]);

  if (!step) return null;

  const pad = 10;
  const hole = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  // place the bubble opposite the spotlight (below if the anchor is high, else above)
  // Pin the bubble to the screen edge FURTHEST from the spotlight so it never
  // covers the element the player is being asked to tap. (Only the bubble
  // captures pointer events; the dim/spotlight are click-through.)
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  let bubblePos = { bottom: 20 };
  if (hole) {
    const anchorMid = hole.top + hole.height / 2;
    bubblePos = anchorMid < vh * 0.5 ? { bottom: 20 } : { top: 20 };
  }

  const showNext = step.gate === 'next' || step.gate === 'auto';

  return (
    <div className="ct-coach" dir={isAr ? 'rtl' : 'ltr'}>
      {hole ? (
        <div
          className="ct-coach-spot"
          style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }}
        />
      ) : (
        <div className="ct-coach-dim" />
      )}
      <div className="ct-coach-bubble" style={bubblePos}>
        <div className="ct-coach-bubble-mm">
          <MazeManAvatar size={64} mood={step.last ? 'proud' : 'focused'} glow />
        </div>
        <div className="ct-coach-bubble-body">
          <div className="ct-coach-step">{labels.stepOf(index + 1, total)}</div>
          <p className="ct-coach-text">{step.text}</p>
          <div className="ct-coach-actions">
            <button type="button" className="ct-coach-skip" onClick={onSkip}>
              {labels.skip}
            </button>
            {step.gate === 'event' && step.hint ? (
              <span className="ct-coach-do">{step.hint}</span>
            ) : null}
            {showNext ? (
              <button type="button" className="ct-coach-next" onClick={onNext}>
                {step.last ? labels.done : labels.next}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
