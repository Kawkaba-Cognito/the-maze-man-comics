import React, { useEffect } from 'react';
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
  en: { skip: 'Skip', next: 'Next', play: "Got it — let's play!", coachLabel: 'Tutorial — Dr Kawkab' },
  ar: {
    skip: 'تخطّي', next: 'التالي', play: 'فهمت — لنلعب!', coachLabel: 'الشرح — د. كوكب',
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
  /*
   * Optional. Attaches to this overlay's own root, so a caller can measure a DOM
   * anchor against THE EXACT BOX THE HAND IS DRAWN IN rather than against a
   * stage element it hopes is the same. They usually are — the games all set
   * `position: relative` on their stage deliberately — but "usually" is how the
   * hand ends up a header's height out, and cancellation genuinely needs it: the
   * HUD chip it points at lives outside the board wrap the cells are measured
   * against.
   */
  hostRef,
  onNext,
  onSkip,
}) {
  const t = UI[isAr ? 'ar' : 'en'];

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
   *
   * ⚠ IT HAS TO FLIP BELOW THE HAND NEAR THE TOP OF THE BOARD, AND FOR THE WHOLE
   * TOP HALF — not just the top third. On the above-hand branch `top` is the
   * bubble's BOTTOM edge (anchored with `translateY(-100%)`), so the box grows
   * UPWARD from there and a clamp on `top` cannot keep its head out of the HUD
   * band. At y = 0.5 the bottom edge sits at 34%: on a 500px-tall wrap that is
   * 170px, comfortably clear of the ~96px HUD reserve whatever the bubble's
   * height turns out to be.
   *
   * Found by looking at it. A target in the top row put the first instruction a
   * new player ever reads half off-screen, with the Skip/Next row hanging above
   * the viewport — and it rendered perfectly the whole time.
   */
  const nearTop = anchor && anchor.y < 0.5;

  /*
   * Kawkab's default corner is bottom / inline-end. Flip him to the other side
   * when the hand is standing in it, so the teacher never covers the thing the
   * lesson is pointing at.
   *
   * `inlineEndFrac` converts the anchor's physical x into a logical one, which
   * is the whole reason this is not a bare `anchor.x > 0.62`.
   */
  const inlineEndFrac = anchor ? (isAr ? 1 - anchor.x : anchor.x) : 0;
  /*
   * ⚠ NO `y` TEST — HE HAS TO DODGE THE BUBBLE, NOT ONLY THE HAND, and the
   * bubble is the bigger object. The first version of this flipped only when
   * the HAND was low on his side (`inlineEndFrac > 0.6 && anchor.y > 0.52`),
   * which measured clean on the hand and immediately collided with the bubble:
   * on cancellation step 2 the anchor sits HIGH (y 0.37), so the bubble takes
   * the below-hand branch and lands low at y 413–504 — squarely in the corner
   * he had just been pulled into.
   *
   * The bubble's centre tracks the hand's x whichever branch it takes, so one
   * test on x covers both objects. With no anchor at all the bubble parks
   * centred and narrow (≤300px), which clears the corner on its own.
   */
  const kawkabFlipped = Boolean(anchor) && inlineEndFrac > 0.55;
  const bubbleStyle = anchor
    ? {
      /*
       * ⚠ CLAMPED IN THE BUBBLE'S OWN WIDTH, NOT THE CONTAINER'S. A percentage
       * clamp cannot know how wide the bubble is: at `width: min(300px, 74vw)`
       * on a 390px phone the bubble is 289px, so with `translateX(-50%)` its
       * centre has to stay between 37% and 63% to stay on screen — and the old
       * 12%–88% clamp let it sit at 12%, putting a third of the first
       * instruction outside `.ct-fq-play { overflow: hidden }`.
       *
       * `clamp()` does the arithmetic in CSS, where the real width is known.
       * The vertical half of this bug was found by looking; the horizontal half
       * was not checked at the time.
       */
      left: `clamp(calc(var(--ctc-bw) / 2 + 6px), ${anchor.x * 100}%, calc(100% - var(--ctc-bw) / 2 - 6px))`,
      /*
       * The below-hand branch additionally floors at the HUD reserve, so a
       * `pointer-events: auto` panel can never sit on the back and pause
       * buttons — this app has shipped unpressable chrome three times (see
       * CLAUDE.md), and only real hit-testing catches it.
       */
      /*
       * ⚠ THE BELOW-HAND GAP IS IN THE HAND'S OWN PIXELS, NOT A PERCENTAGE OF
       * THE STAGE. It was `anchor.y*100 + 14`, and 14% of Target Tracking's
       * 449px-tall board is 63px — against a hand that hangs 87px below its
       * fingertip. Measured result: the bubble sat ON the hand in both mot and
       * speed-match on desktop. A percentage of a container can never reliably
       * clear a fixed-size sprite; ask the sprite how tall it is.
       */
      top: nearTop
        ? `max(calc(var(--fq-hud-reserve, 96px) + 8px), calc(${anchor.y * 100}% + ${handHeightFor(anchor) + 14}px))`
        : `${anchor.y * 100 - 16}%`,
      transform: nearTop ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
    }
    : { left: '50%', bottom: '13%', transform: 'translateX(-50%)' };

  return (
    <div
      className="ct-coach"
      ref={hostRef}
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none' }}
    >
      <TutorialHand target={anchor} tapSignal={tapSignal} variant={variant} />

      {/*
        * ⚠ ARIA, because none of this is visible to assistive tech otherwise.
        * The hand is decorative (`aria-hidden`) and so is Kawkab, which means
        * the bubble carries the ENTIRE lesson — and without a live region a
        * screen-reader user gets the instructions in total silence, including
        * any await step, which renders no Next button at all. `aria-live`
        * announces each step as it changes; `role="dialog"` says what it is.
        */}
      <div
        className="ct-coach-bubble"
        role="dialog"
        aria-live="polite"
        aria-label={t.coachLabel}
        style={{ position: 'absolute', ...bubbleStyle }}
      >
        <p>{speech}</p>
        <div className="ct-coach-btns">
          <button type="button" className="ct-coach-skip" onClick={() => { playSfx?.('click'); onSkip?.(); }}>
            {t.skip}
          </button>
          {showNext && (
            <button type="button" className="ct-coach-next" onClick={onNext}>
              {isLast ? t.play : t.next}
            </button>
          )}
        </div>
      </div>

      {/*
        * ⚠ KAWKAB MOVES OUT OF THE HAND'S WAY. He used to be pinned to the
        * inline-end bottom corner unconditionally, on the reasoning that the
        * hand "favours the board's left/top where scanning tends to start".
        * That is true of where scanning starts and not true of where the hand
        * ends up: it goes wherever the step's anchor is, and on any step whose
        * target sits low on the inline-end side he was standing on it.
        *
        * So the corner is chosen per step. `nearKawkab` is the bottom
        * inline-end quadrant in LOGICAL terms — mirrored under RTL, because
        * `inset-inline-end` is the right edge in English and the LEFT edge in
        * Arabic, and a check written in physical x would send him TOWARD the
        * hand in one of the two languages. Same family as the string trap in
        * CLAUDE.md: the second half is the one that gets missed.
        */}
      <div
        className={`ct-coach-kawkab${kawkabFlipped ? ' is-flipped' : ''}`}
        aria-hidden="true"
      >
        {/* width:100% so the responsive box in training.css keeps controlling
            him, rather than an inline size fighting it. */}
        <KawkabSprite size={78} style={{ width: '100%' }} />
      </div>
    </div>
  );
}
