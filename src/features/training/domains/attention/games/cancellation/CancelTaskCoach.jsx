import React, { useEffect, useMemo, useRef, useState } from 'react';
import TutorialHand from '../../../../shared/tutorials/TutorialHand';
import KawkabSprite from '../../../../shared/KawkabSprite';

/*
 * CancelTaskCoach — Dr Kawkab teaches Survival ON THE REAL BOARD.
 *
 * The previous walkthrough taught over a fake 3x2 grid in a fullscreen modal:
 * predictable to position, but it meant the player learned a mini-game and then
 * met the actual one cold. This coach runs inside the live round instead —
 * Kawkab stands in the corner, the 3D hand points at a REAL target shape, and
 * the player clears it themselves. Clash-Royale style: the bubble rides above
 * the hand, so the instruction and the thing to tap are in the same glance.
 *
 * Two things make that safe:
 *   - The parent holds the round clock the whole time it is open (`coachOpen`),
 *     so nobody loses a Survival run to reading.
 *   - The board stays fully interactive, so the tap the player makes is a real
 *     scored tap, not a simulation.
 *
 * Positioning: this overlay is a sibling of the board canvas and both are
 * `inset: 0` in the same wrap, so the {x, y} fractions that `cellScreenPos`
 * returns address the exact same box the hand is drawn into.
 *
 * ── 2026-08-28: what changed ──
 * 1. BOTH 3D assets are gone. Dr Kawkab is `KawkabSprite` (86 KB WebP, the same
 *    character the hub centre shows) and the pointer is `TutorialHand` (30 KB).
 *    They were `AssessmentMascot3D` (3.4 MB GLB) and `TutorialHand3D` (1.36 MB
 *    GLB), so opening this lesson used to cost ~5 MB and TWO WebGL contexts.
 * 2. It now teaches the DECOY, which is the thing this game actually measures.
 *    The old three steps taught "find the shape, tap it, clear them all" — none
 *    of which is the construct. Cancellation is a test of SELECTIVE attention:
 *    the difficulty comes from look-alikes that share the target's colour or
 *    silhouette (see `computeFeatureInterference` / `computeConjunctionStrength`
 *    in focusQuestData). A player who was never told that decoys exist learns it
 *    by being punished for tapping one.
 *
 * ⚠ Pointing at a thing the player must NOT tap is a trap unless two things are
 * true, and both are: the hand switches to its `avoid` variant (pulled back,
 * faded, crossed out) so the gesture no longer reads as "here"; and a wrong tap
 * while the coach is open costs NO time (see `coachOpenRef` in index.jsx).
 * Trying the wrong thing is the point of a tutorial.
 */

const UI = {
  en: { skip: 'Skip', next: 'Next', play: "Got it — let's play!", coachLabel: 'Tutorial — Dr Kawkab' },
  ar: {
    skip: 'تخطّي', next: 'التالي', play: 'فهمت — لنلعب!', coachLabel: 'الشرح — د. كوكب',
  },
};

/**
 * `point`    — 'target' puts the hand on a live target, 'decoy' on a non-target.
 * `awaitTap` — advance when the player actually clears that shape (no Next button).
 */
function stepsFor(isAr) {
  const L = (en, ar) => (isAr ? ar : en);
  return [
    {
      speech: L(
        "I'm Dr Kawkab. The shape you are hunting is up in the bar — take it in first.",
        'أنا د. كوكب. الشكل الذي تبحث عنه في الشريط بالأعلى — تأمّله أوّلًا.',
      ),
      point: null,
      awaitTap: false,
    },
    {
      speech: L(
        'There it is on the board. Tap it.',
        'ها هو على اللوح. اضغط عليه.',
      ),
      point: 'target',
      awaitTap: true,
    },
    /*
     * The lesson the old tutorial never taught. Everything before this is
     * "find the thing"; the game is actually "find the thing AMONG things that
     * look like it".
     */
    /*
     * ⚠ THE COPY MUST BE TRUE AT LEVEL ONE. The first draft said "close, but
     * not it" — and on an early board it was pointing at a crystal while the
     * target was a planet, which is not close at all. Feature interference and
     * conjunction only climb later (see focusQuestData), so the line has to be
     * accurate now AND warn about what is coming.
     */
    {
      speech: L(
        'Now the hard part. This is not your shape — and anything that is not your shape is a decoy. Later they start looking almost right.',
        'الآن الجزء الصعب. هذا ليس شكلك — وكل ما ليس شكلك فهو خدعة. لاحقًا تبدأ تشبهه كثيرًا.',
      ),
      point: 'decoy',
      awaitTap: false,
    },
    {
      speech: L(
        'That is the whole game: every match, none of the look-alikes, before the clock runs out. Your turn.',
        'هذه هي اللعبة كلّها: كل المطابقات، ولا شيء من المشابهات، قبل انتهاء الوقت. دورك.',
      ),
      point: null,
      awaitTap: false,
    },
  ];
}

export default function CancelTaskCoach({
  isAr, playSfx, cells, boardApiRef, onFinish, onSkip,
}) {
  const t = UI[isAr ? 'ar' : 'en'];
  const steps = useMemo(() => stepsFor(isAr), [isAr]);
  const [stepIdx, setStepIdx] = useState(0);
  const [handTarget, setHandTarget] = useState(null);
  const [tapSignal, setTapSignal] = useState(0);
  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  // The board cell this step is pointing at. Chosen once per step so the hand
  // commits to one shape instead of hopping as the player clears others.
  const [cellIdx, setCellIdx] = useState(null);
  const cellsRef = useRef(cells);
  cellsRef.current = cells;

  useEffect(() => {
    if (!step.point) { setCellIdx(null); return; }
    const list = cellsRef.current || [];
    /*
     * A decoy is any untapped NON-target. Picking the one nearest the middle of
     * the board keeps the hand off the edges, where the bubble that rides above
     * it would be clipped by the play surface.
     */
    const wantTarget = step.point === 'target';
    const candidates = list
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c && !c.tapped && (wantTarget ? c.isT : !c.isT));
    if (!candidates.length) { setCellIdx(null); return; }
    /*
     * ⚠ BOTH branches take the centre-most cell. The first version only sorted
     * the decoy branch and gave the target branch `candidates[0]` — the LOWEST
     * index, i.e. the top row, leading column: precisely the edge case the
     * comment above warns about, on the very first instruction a new player
     * reads. The comment was right and the code was stale.
     */
    const mid = list.length / 2;
    candidates.sort((a, b) => Math.abs(a.i - mid) - Math.abs(b.i - mid));
    setCellIdx(candidates[0].i);
  }, [stepIdx, step.point]);

  // Track the shape live: the pieces bob and the board reflows on resize, so a
  // position sampled once would slide off the target.
  useEffect(() => {
    if (cellIdx == null) { setHandTarget(null); return undefined; }
    let raf = 0;
    const follow = () => {
      raf = requestAnimationFrame(follow);
      const pos = boardApiRef?.current?.cellScreenPos?.(cellIdx) ?? null;
      setHandTarget((prev) => {
        if (!pos) return prev ? null : prev;
        // Only re-render on a visible move (~0.2% of the canvas).
        if (prev && Math.abs(prev.x - pos.x) < 0.002 && Math.abs(prev.y - pos.y) < 0.002) return prev;
        return pos;
      });
    };
    raf = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(raf);
  }, [cellIdx, boardApiRef]);

  // The player cleared the shape we pointed at → that is the lesson landed.
  const cleared = cellIdx != null && !!cells?.[cellIdx]?.tapped;
  useEffect(() => {
    if (!step.awaitTap || !cleared) return undefined;
    setTapSignal((n) => n + 1);
    const id = window.setTimeout(() => setStepIdx((i) => i + 1), 620);
    return () => window.clearTimeout(id);
  }, [cleared, step.awaitTap]);

  const advance = () => {
    playSfx?.('click');
    if (isLast) onFinish?.();
    else setStepIdx((i) => i + 1);
  };

  /*
   * ⚠ Escape leaves the lesson. On the "tap it" step there is no Next button
   * (advancing is the tap itself), so without this the only way out is a small
   * Skip link — and a keyboard user has to tab past every cell on the board to
   * reach it, because the coach renders after the board in the DOM.
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

  // A "tap this one" step with nothing left to tap would strand the player:
  // no Next button, and no shape whose clearing could advance it. That happens
  // whenever they clear the board faster than they read. Fall back to a normal
  // Next so the lesson can always be finished.
  const stranded = step.awaitTap && cellIdx == null;
  const showNext = !step.awaitTap || stranded;

  /*
   * Bubble rides beside the hand while pointing; otherwise it sits low and
   * centred, clear of the grid so the player can still see the whole board.
   *
   * ⚠ IT HAS TO FLIP BELOW THE HAND NEAR THE TOP OF THE BOARD. Anchored above
   * with `translateY(-100%)`, a target in the top row put the bubble's bottom
   * edge at 4% of the container and the rest of it off-screen — so the very
   * first instruction a new player is given ("There it is. Tap it.") was cut in
   * half, with the Skip/Next row hanging off the top. Found by looking at it;
   * no gate can see a bubble that renders correctly and lands outside the
   * viewport.
   */
  /*
   * ⚠ FLIP BELOW THE HAND FOR THE WHOLE TOP HALF, not just the top third.
   *
   * On the above-hand branch `top` is the bubble's BOTTOM edge (it is anchored
   * with `translateY(-100%)`), so the box grows UPWARD from there and a clamp
   * on `top` cannot keep its head out of the HUD band. The only reliable fix is
   * to not use that branch anywhere near the top: at y = 0.5 the bottom edge
   * sits at 34% — on a 500px-tall wrap that is 170px, comfortably clear of the
   * ~96px HUD reserve, whatever the bubble's height turns out to be.
   */
  const nearTop = handTarget && handTarget.y < 0.5;
  const bubbleStyle = handTarget
    ? {
      /*
       * ⚠ CLAMPED IN THE BUBBLE'S OWN WIDTH, NOT THE CONTAINER'S. A percentage
       * clamp cannot know how wide the bubble is: at `width: min(300px, 74vw)`
       * on a 390px phone the bubble is 289px, so with `translateX(-50%)` its
       * centre has to stay between 37% and 63% to remain on screen — and the
       * old 12%–88% clamp let it sit at 12%, putting a third of the first
       * instruction outside `.ct-fq-play { overflow: hidden }`.
       *
       * `clamp()` does the arithmetic in CSS, where the real width is known.
       * The vertical half of this bug was found and fixed by looking; the
       * horizontal half was not checked at the time.
       */
      left: `clamp(calc(var(--ctc-bw) / 2 + 6px), ${handTarget.x * 100}%, calc(100% - var(--ctc-bw) / 2 - 6px))`,
      /*
       * Below the hand in the top half, above it in the bottom half. The
       * below-hand branch additionally floors at the HUD reserve, so a
       * `pointer-events: auto` panel can never sit on the back and pause
       * buttons — this app has shipped unpressable chrome three times already
       * (see CLAUDE.md), and only real hit-testing catches it.
       */
      top: nearTop
        ? `max(calc(var(--fq-hud-reserve, 96px) + 8px), ${handTarget.y * 100 + 14}%)`
        : `${handTarget.y * 100 - 16}%`,
      transform: nearTop ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
    }
    : { left: '50%', bottom: '13%', transform: 'translateX(-50%)' };

  return (
    <div
      className="ct-coach"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none' }}
    >
      <TutorialHand
        target={handTarget}
        tapSignal={tapSignal}
        variant={step.point === 'decoy' ? 'avoid' : 'point'}
      />

      {/*
        * ⚠ ARIA, because none of this is visible to assistive tech otherwise.
        * The hand is decorative (`aria-hidden`) and so is Kawkab, which means
        * the bubble carries the ENTIRE lesson — and without a live region a
        * screen-reader user got four instructions in total silence, including
        * step 2 which renders no Next button at all. `aria-live="polite"`
        * announces each step as it changes; `role="dialog"` says what it is.
        */}
      <div
        className="ct-coach-bubble"
        role="dialog"
        aria-live="polite"
        aria-label={t.coachLabel}
        style={{ position: 'absolute', ...bubbleStyle }}
      >
        <p>{step.speech}</p>
        <div className="ct-coach-btns">
          <button type="button" className="ct-coach-skip" onClick={() => { playSfx?.('click'); onSkip?.(); }}>
            {t.skip}
          </button>
          {showNext && (
            <button type="button" className="ct-coach-next" onClick={advance}>
              {isLast ? t.play : t.next}
            </button>
          )}
        </div>
      </div>

      <div className="ct-coach-kawkab" aria-hidden="true">
        {/* width:100% so the existing responsive box (78px → 62px on a phone)
            keeps controlling him, rather than an inline size fighting it. */}
        <KawkabSprite size={78} style={{ width: '100%' }} />
      </div>
    </div>
  );
}
