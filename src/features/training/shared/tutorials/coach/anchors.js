import { useEffect, useState } from 'react';

/*
 * anchors — "where on screen is the thing this step is about?"
 *
 * Every coach answers that question once per frame and hands the result to
 * CoachLayer as {x, y} FRACTIONS of the overlay's own box (0,0 = top-left,
 * matching CSS %). The overlay is `position: absolute; inset: 0` inside the same
 * wrap as the board, so those fractions address the exact same rectangle the
 * hand is drawn into.
 *
 * It is re-read every frame rather than sampled once because boards move: pieces
 * bob, grids reflow on resize, and a position taken at step start slides off the
 * thing it was pointing at.
 *
 * ── Two families, because the platform has two kinds of board ──
 *
 *   useCanvasAnchor  6 games draw to a <canvas> (cancel-task, mot, train-switch,
 *                    mirror-world, math-gates, intercept). Nothing in the DOM to
 *                    measure, so the game publishes its own draw geometry —
 *                    cancellation exposes `boardApiRef.current.cellScreenPos(i)`.
 *
 *   useDomAnchor     the other 12 games. The pointable thing IS a DOM node, so
 *                    tag it and measure it. No per-game geometry code at all —
 *                    this is the reason COACH-PLAN.md's phases are tractable
 *                    rather than seventeen bespoke rewrites.
 */

/* Re-render only on a visible move (~0.2% of the board). Without this the rAF
   loop calls setState 60×/s with numbers that differ in the 15th decimal. */
const EPSILON = 0.002;

function sameSpot(a, b) {
  return a && b && Math.abs(a.x - b.x) < EPSILON && Math.abs(a.y - b.y) < EPSILON;
}

/** Track a point published by a canvas game's own draw geometry. */
export function useCanvasAnchor(apiRef, index, method = 'cellScreenPos') {
  const [anchor, setAnchor] = useState(null);

  useEffect(() => {
    if (index == null) { setAnchor(null); return undefined; }
    let raf = 0;
    const follow = () => {
      raf = requestAnimationFrame(follow);
      const pos = apiRef?.current?.[method]?.(index) ?? null;
      setAnchor((prev) => {
        if (!pos) return prev ? null : prev;
        if (sameSpot(prev, pos)) return prev;
        return pos;
      });
    };
    raf = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(raf);
  }, [apiRef, index, method]);

  return anchor;
}

/**
 * Track the centre of a DOM node inside `containerRef`, by selector.
 *
 * `selector` is normally a data attribute the game puts on the element the
 * lesson is about — `[data-coach="target"]`. Passing null parks the hand.
 *
 * ⚠ MEASURED AGAINST THE CONTAINER, NOT THE VIEWPORT. CoachLayer's fractions are
 * of its own box; using page coordinates would put the hand a header's height
 * out, and worse on a scrolled or transformed ancestor. `#ui-shell` is a
 * transformed ancestor app-wide, which is also why the universe modals portal to
 * body and why the Detective drag moves the card rather than a fixed clone.
 *
 * ⚠ UNEXERCISED UNTIL PHASE 1. Nothing calls this yet; `keep-track` and
 * `task-switch` are the first two games that will, and COACH-PLAN.md §7 says to
 * re-plan there if this does not carry both without per-game geometry.
 */
export function useDomAnchor(containerRef, selector) {
  const [anchor, setAnchor] = useState(null);

  useEffect(() => {
    if (!selector) { setAnchor(null); return undefined; }
    let raf = 0;
    const follow = () => {
      raf = requestAnimationFrame(follow);
      const box = containerRef?.current;
      const node = box?.querySelector?.(selector);
      if (!box || !node) {
        setAnchor((prev) => (prev ? null : prev));
        return;
      }
      const b = box.getBoundingClientRect();
      const n = node.getBoundingClientRect();
      if (!b.width || !b.height) {
        setAnchor((prev) => (prev ? null : prev));
        return;
      }
      const pos = {
        x: (n.left + n.width / 2 - b.left) / b.width,
        y: (n.top + n.height / 2 - b.top) / b.height,
      };
      setAnchor((prev) => (sameSpot(prev, pos) ? prev : pos));
    };
    raf = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(raf);
  }, [containerRef, selector]);

  return anchor;
}

/**
 * The "no Next button — advance when they actually do it" step.
 *
 * Returns a `tapSignal` that bumps when the condition lands, which CoachLayer
 * passes to TutorialHand to replay its dip. The short delay lets the player see
 * their own action resolve before the bubble changes under them.
 *
 * ⚠ The caller must still handle the STRANDED case: an await step with nothing
 * left to point at can never be satisfied, and with no Next button the player
 * cannot finish the lesson. CoachLayer restores a Next button when `anchor` is
 * null on an await step — that is what `stranded` means there.
 */
export function useAwaitAdvance({ awaiting, satisfied, onAdvance, delayMs = 620 }) {
  const [tapSignal, setTapSignal] = useState(0);

  useEffect(() => {
    if (!awaiting || !satisfied) return undefined;
    setTapSignal((n) => n + 1);
    const id = window.setTimeout(() => onAdvance?.(), delayMs);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awaiting, satisfied]);

  return tapSignal;
}
