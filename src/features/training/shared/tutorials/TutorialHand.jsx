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
 * ⚠ SIZE IS RELATIVE TO A BOARD TILE, NOT TO THE SCREEN. A cancellation tile is
 * ~55px, and at the first size (84px) the hand was wider than the thing it was
 * pointing at — it read as covering the tile rather than indicating it, and on
 * a dense grid it hid the neighbours the player is supposed to be comparing
 * against. A pointer should be smaller than its target.
 */
const HAND_W = 54;
const HAND_W_SMALL = 44;

export default function TutorialHand({ target, tapSignal = 0, variant = 'point' }) {
  const [tapping, setTapping] = useState(false);
  const lastSignal = useRef(tapSignal);
  const [w, setW] = useState(HAND_W);

  useEffect(() => {
    const fit = () => setW(window.innerWidth < 420 ? HAND_W_SMALL : HAND_W);
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

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
        // Shift so the FINGERTIP lands on (x, y), not the image centre.
        marginLeft: -(w * TIP_X),
        marginTop: -(w * ASPECT * TIP_Y),
      }}
    >
      <img src={assetUrl('Assets/characters/kawkab/kawkab-hand.webp')} alt="" draggable="false" />
    </div>
  );
}
