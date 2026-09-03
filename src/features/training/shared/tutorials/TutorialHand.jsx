import React, { useEffect, useRef, useState } from 'react';
import { assetUrl } from '../../../../lib/assetUrl';
import './tutorialHand.css';

/*
 * TutorialHand — Dr Kawkab's pointing hand, as a picture.
 *
 * Fills its parent, click-through, and puts the fingertip on a `target` given
 * as {x, y} fractions of that parent (0,0 = top-left, matching CSS %). Same
 * contract the 3D version had, so callers did not change.
 *
 * ── Why this replaced TutorialHand3D ──
 * The old pointer was a 1.36 MB GLB rendered through three.js in its own WebGL
 * canvas. Opening a tutorial therefore cost a renderer, a context and well over
 * a megabyte — and it sat next to `AssessmentMascot3D`, another WebGL canvas
 * pulling a 3.4 MB GLB, so a first-time player met roughly 5 MB and two GL
 * contexts before they had tapped anything. On a PWA that must stay instant on
 * old phones, for a hand that only ever moves and dips.
 *
 * `KawkabSprite` had already made exactly this argument for the mascot ("the
 * GLB made sense while the hub was 3D; it stopped making sense the moment the
 * hub became a 2D planet, and nothing went back to check"). The tutorials were
 * the place nothing went back to check.
 *
 * The artwork is the keyed pointing hand — 30 KB of WebP, alpha-solved off its
 * white plate by `scripts/key-kawkab-planet.py` so the star points inside the
 * body survive instead of punching pinholes through it.
 *
 * ── Motion ──
 * All CSS. The wrapper is translated to the target and transitions there, so
 * the browser animates it on the compositor and this component re-renders only
 * when the target actually moves. A `tapSignal` bump replays a short dip.
 *
 * ⚠ THE FINGERTIP IS THE ANCHOR, NOT THE CENTRE. The image is a whole hand with
 * the finger at the top; centring it on the target points the KNUCKLES at the
 * thing and leaves the fingertip a whole hand-length above it. `--tip-*` place
 * the fingertip on the point instead — measured from the art, not guessed.
 */

/*
 * Fingertip position within the image, as a fraction of its box — MEASURED off
 * kawkab-hand.webp (mean x of the topmost rows carrying ink), not eyeballed.
 * The first pair was guessed and put the tip ~4px below where it actually is,
 * which on a 55px board tile is a visible miss.
 */
const TIP_X = 0.408;
const TIP_Y = 0.012;

/* The art's aspect (260x420), used to convert the width into a height offset. */
const ASPECT = 420 / 260;

/*
 * ⚠ SIZE IS RELATIVE TO THE TARGET, NOT TO THE SCREEN — AND A SCREEN-WIDTH
 * BREAKPOINT IS NOT A SUBSTITUTE FOR THAT.
 *
 * This was `54px`, dropping to `44px` under a 420px viewport. Both numbers were
 * measured against ONE thing, a ~55px cancellation tile, and then worn by all
 * eighteen games. Measured across the platform on 2026-09-03 (headless Chrome,
 * `getBoundingClientRect` on the hand and on whatever `elementFromPoint` found
 * under the fingertip), the hand/target width ratio ran **0.08 → 4.91**:
 *
 *   story-grid 'nav'      11×11 px  → 4.91  the pointer FIVE TIMES the width of
 *                                           the thing it points at
 *   cancel-task tile      57×57 px  → 0.95  same width as its target, and its
 *                                           87px body covering the tile below
 *   speed-match 'pad'    520×84 px  → 0.10  lost on a whole keypad
 *
 * A viewport breakpoint cannot fix any of that, because none of it is about the
 * viewport: story-grid's 11px chevron and cancellation's 57px tile were on the
 * SAME 1366px desktop. The size has to come from the target.
 *
 * ⚠ THE RATIO IS BELOW 1 ON PURPOSE. A pointer the size of its target reads as
 * covering it rather than indicating it, and on a dense grid it hides the
 * neighbours the player is being asked to compare against — which is exactly
 * what cancellation, a test of SELECTIVE attention, must not do.
 */
const HAND_RATIO = 0.62;

/*
 * ⚠ AND THE CLAMP IS WHAT MAKES THE RATIO SAFE AT BOTH ENDS. Ratio alone gives
 * a 7px hand on story-grid's chevron (invisible) and a 320px hand on mot's
 * board (absurd). The floor is the smallest hand still readable as a hand at
 * this art's detail; the ceiling is just under a cancellation tile, which is
 * the densest board the platform has.
 */
const HAND_MIN = 30;
const HAND_MAX = 52;

/* Phones get a slightly tighter ceiling — the boards are the same size in CSS
   px but the finger covering them is not. Kept as a ceiling only, never as the
   size itself: the target still decides, this only caps it. */
const HAND_MAX_SMALL = 44;

/**
 * The width this pointer will take for a given anchor — exported because
 * CoachLayer has to clear the hand when it puts the bubble BELOW it, and the
 * only honest way to do that is in the hand's real pixels.
 *
 * ⚠ It used to guess with a percentage of the stage (`anchor.y*100 + 14`), and
 * on a 449px-tall board that is 63px against an 87px hand — which is why the
 * bubble was measured sitting on top of the hand in Target Tracking and Speed
 * Match. A percentage of a container cannot clear a fixed-size sprite.
 */
export function handWidthFor(target, small = false) {
  return sizeFor(target, small);
}

/** The drawn height of the hand below the fingertip, in px. */
export function handHeightFor(target, small = false) {
  return Math.round(sizeFor(target, small) * ASPECT * (1 - TIP_Y));
}

function sizeFor(target, small) {
  const cap = small ? HAND_MAX_SMALL : HAND_MAX;
  /*
   * No size reported (a canvas game that has not been updated to publish one,
   * or an anchor from before this change) → fall back to the old constant, so
   * an un-migrated caller keeps exactly the behaviour it had.
   */
  /*
   * ⚠ THE SMALLER DIMENSION, NOT THE WIDTH. Sizing off `tw` alone over-sizes the
   * hand on anything wide and short, because the drawn hand is 1.6× as TALL as
   * it is wide. Spaceship's junction button is a stretched 1fr grid cell —
   * 430×44 with a single junction on wave 1 — so width alone gave a 52px hand
   * standing 84px over a 44px control. Taking `min(tw, th)` makes the pointer
   * fit the direction that actually constrains it. Square targets (a
   * cancellation tile, story-grid's chevron) are unaffected.
   */
  const w = Number(target?.tw);
  const h = Number(target?.th);
  const t = Math.min(
    Number.isFinite(w) && w > 0 ? w : Infinity,
    Number.isFinite(h) && h > 0 ? h : Infinity,
  );
  if (!Number.isFinite(t) || t <= 0) return small ? HAND_MAX_SMALL : cap;
  return Math.round(Math.max(HAND_MIN, Math.min(cap, t * HAND_RATIO)));
}

export default function TutorialHand({ target, tapSignal = 0, variant = 'point' }) {
  const [tapping, setTapping] = useState(false);
  const lastSignal = useRef(tapSignal);
  const [small, setSmall] = useState(false);

  useEffect(() => {
    const fit = () => setSmall(window.innerWidth < 420);
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const w = sizeFor(target, small);

  useEffect(() => {
    if (tapSignal === lastSignal.current) return undefined;
    lastSignal.current = tapSignal;
    setTapping(true);
    const id = window.setTimeout(() => setTapping(false), 420);
    return () => window.clearTimeout(id);
  }, [tapSignal]);

  if (!target) return null;

  return (
    <div
      className={`ct-tut-hand ct-tut-hand--${variant}${tapping ? ' is-tapping' : ''}`}
      aria-hidden="true"
      style={{
        left: `${target.x * 100}%`,
        top: `${target.y * 100}%`,
        width: w,
        /*
         * Published so the CSS can scale WITH the hand. The crossed-out badge
         * on the "do not touch this" variant was a fixed 19px, sized for the old
         * fixed 54px hand — on a 30px hand that is two thirds of the pointer.
         */
        '--ct-hand-w': `${w}px`,
        // Shift so the FINGERTIP lands on (x, y), not the image centre.
        marginLeft: -(w * TIP_X),
        marginTop: -(w * ASPECT * TIP_Y),
      }}
    >
      <img src={assetUrl('Assets/characters/kawkab/kawkab-hand.webp')} alt="" draggable="false" />
    </div>
  );
}
