import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useCoach — drives a scripted, interactive tutorial sequence.
 *
 * `steps` is an array of:
 *   { id, text, anchorRef?, hint?, gate: 'event'|'next'|'auto', event?, delay?,
 *     validate?(payload), last? }
 *
 * The game calls `coach.notify(eventName, payload)` from its real handlers. When
 * the active step's gate is 'event' and its `event` matches (and `validate`
 * passes), the step advances. 'next' shows a button; 'auto' advances on a timer.
 */
export function useCoach(steps, { active = false, onDone } = {}) {
  const [idx, setIdx] = useState(0);
  const idxRef = useRef(0);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  useEffect(() => {
    idxRef.current = idx;
  }, [idx]);

  useEffect(() => {
    if (active) {
      setIdx(0);
      idxRef.current = 0;
    }
  }, [active]);

  const advance = useCallback(() => {
    const cur = idxRef.current;
    const next = cur + 1;
    if (next >= stepsRef.current.length) {
      onDone?.();
      return;
    }
    idxRef.current = next;
    setIdx(next);
  }, [onDone]);

  const notify = useCallback(
    (event, payload) => {
      if (!active) return;
      const cur = stepsRef.current[idxRef.current];
      if (!cur || cur.gate !== 'event' || cur.event !== event) return;
      if (cur.validate && !cur.validate(payload)) return;
      advance();
    },
    [active, advance],
  );

  // auto-advancing steps
  const step = active ? steps[idx] : null;
  useEffect(() => {
    if (!active || !step || step.gate !== 'auto') return undefined;
    const id = setTimeout(() => advance(), step.delay ?? 1400);
    return () => clearTimeout(id);
  }, [active, step, advance]);

  const skip = useCallback(() => onDone?.(), [onDone]);

  return { step, index: idx, total: steps.length, notify, next: advance, skip };
}
