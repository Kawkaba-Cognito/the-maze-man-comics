import React, { useEffect, useRef, useState } from 'react';
import TutorialHand, { handHeightFor } from '../TutorialHand';
import KawkabSprite from '../../KawkabSprite';

/*
 * CoachLayer — the shared body of every live-board tutorial.
 *
 * Dr Kawkab watches from the corner, the hand sits on a real thing on the real
 * board, and the bubble rides beside the hand so the instruction and the thing
 * it names land in one glance. The player performs the actual, scored action;
 * nothing here simulates a board.
 *
 * Lifted from `CancelTaskCoach` on 2026-09-03 (COACH-PLAN.md Phase 0) with no
 * behaviour change, so cancellation stays the proof that it still works.
 *
 * ── What this owns, and what the game still owns ──
 * HERE:  the hand, Kawkab, the bubble and every line of its placement maths,
 *        the Skip/Next row, ARIA, Escape-to-leave, the stranded fallback.
 * GAME:  which step it is on, what the step points at, whether an await step is
 *        satisfied, and — the expensive part — guarding its own consequences
 *        while the lesson is open (see useCoachRun's note on `openRef`).
 *
 * ⚠ EVERY CLAUSE IN THE PLACEMENT MATHS BELOW IS A BUG THAT WAS ALREADY PAID
 * FOR, and none of them is visible from reading the markup. Do not re-derive
 * them per game, and do not simplify one without putting a phone in front of it.
 *
 * ⚠ THE CLASS NAMES ARE FIXED. `.ct-coach-bubble` is declared TWICE at top level
 * in training.css — this block and an older one (~line 6089) left behind by the
 * retired spotlight coach, whose markup was deleted but whose CSS was not. The
 * later block's four resets (`display`, `margin`, `inset-inline`, `max-width`)
 * are load-bearing precisely because the dead one still cascades in. Renaming
 * anything here silently re-inherits `display: flex`, which turns the paragraph
 * and the button row into siblings in a row.
 */

const UI = {
  en: {
    skip: 'Skip',
    next: 'Next',
    play: "Got it — let's play!",
    coachLabel: 'Tutorial — Dr Kawkab',
    teacher: 'Dr. Kawkab',
    guide: 'Coach Guide',
    interactive: 'Interactive Step',
    awaitHint: 'Tap the highlighted target on the board',
    stepOf: (i, n) => `Step ${i} of ${n}`,
  },
  ar: {
    skip: 'تخطّي',
    next: 'التالي',
    play: 'فهمت — لنلعب!',
    coachLabel: 'الشرح — د. كوكب',
    teacher: 'د. كوكب',
    guide: 'إرشاد المدرب',
    interactive: 'خطوة تفاعلية',
    awaitHint: 'المس الهدف المميّز على اللوحة للمتابعة',
    stepOf: (i, n) => `الخطوة ${i} من ${n}`,
  },
};

/**
 * `speech`    what Kawkab says on this step (already resolved to one language).
 * `anchor`    {x, y} fractions of this overlay's box, or null to park the hand.
 * `awaiting`  this step advances when the player DOES the thing, not on Next.
 * `variant`   'point' | 'avoid' — 'avoid' pulls the hand back, fades and crosses
 *             it out, so pointing at a thing the player must NOT touch stops
 *             reading as "here".
 */
export default function CoachLayer({
  isAr,
  playSfx,
  speech,
  anchor = null,
  tapSignal = 0,
  variant = 'point',
  awaiting = false,
  stranded: strandedProp,
  isLast = false,
  stepIdx = 0,
  totalSteps = 1,
  hostRef,
  onNext,
  onSkip,
}) {
  const t = UI[isAr ? 'ar' : 'en'];

  // Success celebration when await condition is met
  const [burstActive, setBurstActive] = useState(false);
  const prevTapRef = useRef(tapSignal);

  useEffect(() => {
    if (tapSignal > prevTapRef.current) {
      setBurstActive(true);
      playSfx?.('correct');
      const timer = window.setTimeout(() => setBurstActive(false), 850);
      return () => window.clearTimeout(timer);
    }
    prevTapRef.current = tapSignal;
  }, [tapSignal, playSfx]);

  /*
   * ⚠ Escape leaves the lesson. On an await step there is no Next button
   * (advancing is the action itself), so without this the only way out is a
   * small Skip link — and a keyboard user has to tab past every control on the
   * board to reach it, because the coach renders after the board in the DOM.
   */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      onSkip?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSkip]);

  /*
   * An await step with nothing left to point at would strand the player: no Next
   * button, and nothing whose completion could advance it. That happens whenever
   * they clear the board faster than they read. Fall back to a normal Next so
   * the lesson can always be finished.
   *
   * ⚠ PASS `stranded` EXPLICITLY WHEN THE ANCHOR ARRIVES A FRAME LATE. The
   * fallback below infers it from `anchor`, but a rAF-tracked anchor is null on
   * the first frame of every step — which would flash a Next button onto an
   * await step before the hand appears. Cancellation therefore derives it from
   * whether a cell was CHOSEN, which is known during render.
   */
  const stranded = strandedProp ?? (awaiting && !anchor);
  const showNext = !awaiting || stranded;

  /*
   * Bubble rides beside the hand while pointing; otherwise it sits low and
   * centred, clear of the board so the player can still see all of it.
   */
  const nearTop = anchor && anchor.y < 0.5;

  /*
   * Kawkab's default corner is bottom / inline-end. Flip him to the other side
   * when the hand is standing in it, so the teacher never covers the thing the
   * lesson is pointing at.
   */
  const inlineEndFrac = anchor ? (isAr ? 1 - anchor.x : anchor.x) : 0;
  const kawkabFlipped = Boolean(anchor) && inlineEndFrac > 0.55;

  const bubbleStyle = anchor
    ? {
      left: `clamp(calc(var(--ctc-bw) / 2 + 6px), ${anchor.x * 100}%, calc(100% - var(--ctc-bw) / 2 - 6px))`,
      top: nearTop
        ? `max(calc(var(--fq-hud-reserve, 96px) + 8px), calc(${anchor.y * 100}% + ${handHeightFor(anchor) + 14}px))`
        : `${anchor.y * 100 - 16}%`,
      transform: nearTop ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
    }
    : { left: '50%', bottom: '13%', transform: 'translateX(-50%)' };

  // Calculated geometry for the interactive spotlight ring
  const targetW = anchor ? Math.max(38, (anchor.tw || 48) + 12) : 48;
  const targetH = anchor ? Math.max(38, (anchor.th || 48) + 12) : 48;

  return (
    <div
      className="ct-coach"
      ref={hostRef}
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none' }}
    >
      {/* ── Interactive Target Spotlight & Beacon Halo ────────────────── */}
      {anchor && (
        <div
          className={`ct-coach-target-ring ${awaiting ? 'is-awaiting' : ''} ${variant === 'avoid' ? 'is-avoid' : ''} ${burstActive ? 'is-bursting' : ''}`}
          style={{
            position: 'absolute',
            left: `${anchor.x * 100}%`,
            top: `${anchor.y * 100}%`,
            width: `${targetW}px`,
            height: `${targetH}px`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 6,
          }}
          aria-hidden="true"
        >
          <div className="ct-coach-target-pulse" />
          {awaiting && (
            <>
              <div className="ct-coach-target-ripple" />
              <div className="ct-coach-target-ripple ct-coach-target-ripple--delay" />
              <div className="ct-coach-target-badge">
                <span className="ct-coach-target-badge-dot" />
                <span>{isAr ? 'جرّب الآن' : 'Your Turn'}</span>
              </div>
            </>
          )}
          {variant === 'avoid' && (
            <div className="ct-coach-target-avoid-badge">
              <span>✕</span> {isAr ? 'تجنب هذا' : 'Avoid'}
            </div>
          )}
          {burstActive && (
            <div className="ct-coach-target-success">
              <span className="ct-coach-success-icon">✓</span>
            </div>
          )}
        </div>
      )}

      <TutorialHand target={anchor} tapSignal={tapSignal} variant={variant} isAwaiting={awaiting} />

      {/*
        * ⚠ ARIA, because none of this is visible to assistive tech otherwise.
        * The hand is decorative (`aria-hidden`) and so is Kawkab, which means
        * the bubble carries the ENTIRE lesson — and without a live region a
        * screen-reader user gets the instructions in total silence, including
        * any await step, which renders no Next button at all. `aria-live`
        * announces each step as it changes; `role="dialog"` says what it is.
        */}
      <div
        className={`ct-coach-bubble ${awaiting ? 'ct-coach-bubble--awaiting' : ''}`}
        role="dialog"
        aria-live="polite"
        aria-label={t.coachLabel}
        style={{ position: 'absolute', ...bubbleStyle }}
      >
        <div className="ct-coach-bubble-header">
          <div className="ct-coach-avatar-chip">
            <span className="ct-coach-avatar-dot" />
            <span className="ct-coach-avatar-name">{t.teacher}</span>
          </div>
          <div className="ct-coach-header-right">
            <span className={`ct-coach-mode-pill ${awaiting ? 'ct-coach-mode-pill--active' : ''}`}>
              {awaiting ? t.interactive : t.guide}
            </span>
            {totalSteps > 1 && (
              <span className="ct-coach-step-pill">{t.stepOf(stepIdx + 1, totalSteps)}</span>
            )}
          </div>
        </div>

        {totalSteps > 1 && (
          <div className="ct-coach-progress-bar" aria-hidden="true">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={`ct-coach-progress-seg ${i < stepIdx ? 'is-done' : ''} ${i === stepIdx ? 'is-active' : ''}`}
              />
            ))}
          </div>
        )}

        <div className="ct-coach-bubble-body">
          <p>{speech}</p>
          {awaiting && !stranded && (
            <div className="ct-coach-await-hint" aria-hidden="true">
              <span>👆</span> {t.awaitHint}
            </div>
          )}
        </div>

        <div className="ct-coach-btns">
          <button type="button" className="ct-coach-skip" onClick={() => { playSfx?.('click'); onSkip?.(); }}>
            {t.skip}
          </button>
          {showNext && (
            <button
              type="button"
              className={`ct-coach-next ${isLast ? 'ct-coach-next--play' : ''}`}
              onClick={() => { playSfx?.('click'); onNext?.(); }}
            >
              <span>{isLast ? t.play : t.next}</span>
              {!isLast && <span className="ct-coach-next-arr" aria-hidden="true">{isAr ? '←' : '→'}</span>}
            </button>
          )}
        </div>
      </div>

      <div
        className={`ct-coach-kawkab${kawkabFlipped ? ' is-flipped' : ''}`}
        aria-hidden="true"
      >
        <KawkabSprite size={78} style={{ width: '100%' }} />
      </div>
    </div>
  );
}
