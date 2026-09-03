import React, { useMemo, useState } from 'react';
import CoachLayer from './CoachLayer';
import { useDomAnchor, useAwaitAdvance } from './anchors';

/*
 * DomCoach — the whole coach for a game whose board is DOM.
 *
 * Twelve of the eighteen training games are in that family (COACH-PLAN.md §3),
 * and after writing the first three by hand they were the same sixty lines with
 * a different import at the top: resolve the step's selector, advance on Next,
 * advance on the player doing the thing, render CoachLayer. CLAUDE.md's rule for
 * the shared kit applies to tutorials too — use this, never paste a local copy.
 *
 * A game supplies:
 *   `pack`         its script from `coach/scripts/<game>.js`
 *   `stageRef`     the positioned box every `data-coach` anchor is measured in;
 *                  the overlay is `inset: 0` inside it, so both address the same
 *                  rectangle
 *   `satisfiedFor` (only if the script has an `awaitTap` step) — called during
 *                  render with the current step, returns whether the player has
 *                  now done the thing
 *
 * ⚠ `satisfiedFor` MUST DESCRIBE THE OUTCOME, NOT THE INPUT. Word Links asks it
 * for "an answer was accepted", not "the button was pressed", because a submit
 * the game rejects must not advance the lesson either — otherwise the coach
 * congratulates the player for something that did not happen.
 *
 * ⚠ AN AWAIT STEP MUST BE REACHABLE. It renders no Next button, so if its
 * condition cannot occur the player is stuck in a first-run tutorial with only
 * Skip and Escape. CoachLayer restores a Next when the anchor is missing, which
 * covers "the thing is gone"; it cannot cover "the thing is there but the
 * condition never fires". Check that yourself per game.
 *
 * A canvas game cannot use this — it has nothing in the DOM to measure and
 * publishes its own geometry instead. `CancelTaskCoach` is that pattern.
 */
export default function DomCoach({
  isAr, playSfx, stageRef, pack, satisfiedFor, onFinish, onSkip,
}) {
  const steps = useMemo(
    () => pack.steps.map((s) => ({ ...s, speech: isAr ? s.ar : s.en })),
    [pack, isAr],
  );
  const [stepIdx, setStepIdx] = useState(0);
  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  const anchor = useDomAnchor(stageRef, step.point);

  const satisfied = step.awaitTap ? Boolean(satisfiedFor?.(step, stepIdx)) : false;
  const tapSignal = useAwaitAdvance({
    awaiting: step.awaitTap,
    satisfied,
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
      variant={step.point && step.avoid ? 'avoid' : 'point'}
      awaiting={step.awaitTap}
      isLast={isLast}
      onNext={advance}
      onSkip={onSkip}
    />
  );
}
