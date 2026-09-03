import React, { useEffect, useMemo, useRef, useState } from 'react';
import CoachLayer from '../../../../shared/tutorials/coach/CoachLayer';
import { useCanvasAnchor, useAwaitAdvance } from '../../../../shared/tutorials/coach/anchors';
import { CANCEL_TASK_COACH } from '../../../../shared/tutorials/coach/scripts/cancel-task';

/*
 * CancelTaskCoach — Dr Kawkab teaches Survival ON THE REAL BOARD.
 *
 * The previous walkthrough taught over a fake 3x2 grid in a fullscreen modal:
 * predictable to position, but it meant the player learned a mini-game and then
 * met the actual one cold. This coach runs inside the live round instead —
 * Kawkab stands in the corner, the hand points at a REAL target shape, and the
 * player clears it themselves.
 *
 * Two things make that safe:
 *   - The parent holds the round clock the whole time it is open (`coachOpen`),
 *     so nobody loses a Survival run to reading.
 *   - The board stays fully interactive, so the tap the player makes is a real
 *     scored tap, not a simulation.
 *
 * Positioning: CoachLayer is a sibling of the board canvas and both are
 * `inset: 0` in the same wrap, so the {x, y} fractions that `cellScreenPos`
 * returns address the exact same box the hand is drawn into.
 *
 * ── 2026-09-03: what changed (COACH-PLAN.md Phase 0) ──
 * Everything generic moved out, and this file kept only what is about THIS
 * game. The hand, Kawkab, the bubble and all of its placement maths, ARIA,
 * Escape and the stranded fallback are now `shared/tutorials/coach/CoachLayer`;
 * the rAF anchor tracking and the await-advance timer are `anchors.js`; the four
 * lines Kawkab says are `scripts/cancel-task.js`, where a gate can read them.
 * Behaviour is unchanged — this game is the proof the shared layer works before
 * seventeen others are built on it.
 *
 * What remains here is irreducibly cancellation's: which cell to point at.
 *
 * ── 2026-08-28: the two decisions that matter ──
 * 1. BOTH 3D assets are gone. Dr Kawkab is `KawkabSprite` (86 KB WebP) and the
 *    pointer is `TutorialHand` (30 KB). They were `AssessmentMascot3D` (3.4 MB
 *    GLB) and `TutorialHand3D` (1.36 MB GLB), so opening this lesson used to
 *    cost ~5 MB and TWO WebGL contexts.
 * 2. It teaches the DECOY, which is the thing this game actually measures. The
 *    old three steps taught "find the shape, tap it, clear them all" — none of
 *    which is the construct. Cancellation is a test of SELECTIVE attention: the
 *    difficulty comes from look-alikes sharing the target's colour or silhouette
 *    (see `computeFeatureInterference` / `computeConjunctionStrength` in
 *    focusQuestData). A player never told that decoys exist learns it by being
 *    punished for tapping one.
 *
 * ⚠ Pointing at a thing the player must NOT tap is a trap unless two things are
 * true, and both are: the hand switches to its `avoid` variant (pulled back,
 * faded, crossed out) so the gesture no longer reads as "here"; and a wrong tap
 * while the coach is open costs NO time (see `coachOpenRef` in index.jsx).
 * Trying the wrong thing is the point of a tutorial.
 */

export default function CancelTaskCoach({
  isAr, playSfx, cells, boardApiRef, onFinish, onSkip,
}) {
  const steps = useMemo(
    () => CANCEL_TASK_COACH.steps.map((s) => ({ ...s, speech: isAr ? s.ar : s.en })),
    [isAr],
  );
  const [stepIdx, setStepIdx] = useState(0);
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
  const anchor = useCanvasAnchor(boardApiRef, cellIdx);

  // The player cleared the shape we pointed at → that is the lesson landed.
  const cleared = cellIdx != null && !!cells?.[cellIdx]?.tapped;
  const tapSignal = useAwaitAdvance({
    awaiting: step.awaitTap,
    satisfied: cleared,
    onAdvance: () => setStepIdx((i) => i + 1),
  });

  const advance = () => {
    playSfx?.('click');
    if (isLast) onFinish?.();
    else setStepIdx((i) => i + 1);
  };

  return (
    <CoachLayer
      isAr={isAr}
      playSfx={playSfx}
      speech={step.speech}
      anchor={anchor}
      tapSignal={tapSignal}
      variant={step.point === 'decoy' ? 'avoid' : 'point'}
      awaiting={step.awaitTap}
      /* Derived from the CHOSEN cell, not the anchor: the rAF anchor is null on
         the first frame of every step, which would flash a Next button onto the
         "tap it" step. */
      stranded={step.awaitTap && cellIdx == null}
      isLast={isLast}
      onNext={advance}
      onSkip={onSkip}
    />
  );
}
