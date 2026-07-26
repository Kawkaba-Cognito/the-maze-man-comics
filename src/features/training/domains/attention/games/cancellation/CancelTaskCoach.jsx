import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import TutorialHand3D from '../../../../shared/tutorials/TutorialHand3D';

// Lazy for the same reason as every other Dr Kawkab spot: three.js only loads
// once a guided tutorial actually opens.
const AssessmentMascot3D = lazy(() => import('../../../../../../components/training/AssessmentMascot3D'));

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
 */

const UI = {
  en: { skip: 'Skip', next: 'Next', play: "Got it — let's play!" },
  ar: { skip: 'تخطّي', next: 'التالي', play: 'فهمت — لنلعب!' },
};

/**
 * `point` — put the hand on a live target shape.
 * `awaitTap` — advance when the player actually clears that shape (no Next button).
 */
function stepsFor(isAr) {
  const L = (en, ar) => (isAr ? ar : en);
  return [
    {
      speech: L(
        "I'm Dr Kawkab. The shape to hunt is up in the bar — take it in first.",
        'أنا د. كوكب. الشكل المطلوب في الشريط بالأعلى — تأمّله أوّلًا.',
      ),
      point: false,
      awaitTap: false,
    },
    {
      speech: L(
        'There it is on the board. Tap it.',
        'ها هو على اللوح. اضغط عليه.',
      ),
      point: true,
      awaitTap: true,
    },
    {
      speech: L(
        'That is the whole game. Clear every match before the clock runs out — your turn.',
        'هذه هي اللعبة كلّها. امسح كل المطابقات قبل انتهاء الوقت — دورك.',
      ),
      point: false,
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
    const idx = list.findIndex((c) => c && c.isT && !c.tapped);
    setCellIdx(idx >= 0 ? idx : null);
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

  // A "tap this one" step with nothing left to tap would strand the player:
  // no Next button, and no shape whose clearing could advance it. That happens
  // whenever they clear the board faster than they read. Fall back to a normal
  // Next so the lesson can always be finished.
  const stranded = step.awaitTap && cellIdx == null;
  const showNext = !step.awaitTap || stranded;

  // Bubble rides just above the hand while pointing; otherwise it sits low and
  // centred, clear of the grid so the player can still see the whole board.
  const bubbleStyle = handTarget
    ? {
      left: `${Math.min(88, Math.max(12, handTarget.x * 100))}%`,
      top: `${Math.max(4, handTarget.y * 100 - 16)}%`,
      transform: 'translate(-50%, -100%)',
    }
    : { left: '50%', bottom: '13%', transform: 'translateX(-50%)' };

  return (
    <div
      className="ct-coach"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none' }}
    >
      <TutorialHand3D target={handTarget} tapSignal={tapSignal} />

      <div className="ct-coach-bubble" style={{ position: 'absolute', ...bubbleStyle }}>
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
        <Suspense fallback={null}>
          <AssessmentMascot3D size={78} isAr={isAr} label="" onActivate={() => {}} />
        </Suspense>
      </div>
    </div>
  );
}
