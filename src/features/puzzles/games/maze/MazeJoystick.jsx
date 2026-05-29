import React, { useCallback, useRef, useState } from 'react';

/**
 * Analog thumbstick. The knob follows the finger (clamped to the base radius);
 * the push is resolved to one of 4 grid directions and reported via
 * `onDirection(dir | null)`. The parent decides how often to step while a
 * direction is held — this component only reports the current intent.
 *
 * Stability (so a held thumb never accidentally erases the trail):
 *  - DEAD_ZONE: ignore small pushes near the centre.
 *  - SECTOR: only commit to a cardinal direction when the push is clearly
 *    aligned with it (±SECTOR). Pushes in the diagonal gaps between cardinals
 *    keep the CURRENT direction instead of flickering — this is the key fix
 *    for the "moving back deletes my path" bug on touch.
 */
const DEAD_ZONE = 0.4; // fraction of radius before a push counts
const SECTOR = (42 * Math.PI) / 180; // half-width of each cardinal acceptance arc

const CARDINALS = [
  ['right', 0],
  ['down', Math.PI / 2],
  ['left', Math.PI],
  ['up', -Math.PI / 2],
];

/** Smallest signed angle between two angles, in [-π, π]. */
function angleDelta(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return Math.abs(d);
}

/**
 * Resolve a knob offset to a direction. Returns `prev` (unchanged) when the
 * push sits in a diagonal gap, so jitter near 45° can't flip the direction.
 */
export function resolveDir(dx, dy, radius, prev) {
  const dist = Math.hypot(dx, dy);
  if (dist < radius * DEAD_ZONE) return null;
  const angle = Math.atan2(dy, dx);
  let best = null;
  let bestDelta = Infinity;
  for (const [name, target] of CARDINALS) {
    const delta = angleDelta(angle, target);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = name;
    }
  }
  return bestDelta <= SECTOR ? best : prev;
}

export default function MazeJoystick({ onDirection, disabled, ariaLabel }) {
  const baseRef = useRef(null);
  const activeId = useRef(null);
  const lastDir = useRef(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const reset = useCallback(() => {
    setKnob({ x: 0, y: 0 });
    if (lastDir.current !== null) {
      lastDir.current = null;
      onDirection(null);
    }
  }, [onDirection]);

  const update = useCallback(
    (clientX, clientY) => {
      const base = baseRef.current;
      if (!base) return;
      const rect = base.getBoundingClientRect();
      const radius = rect.width / 2;
      const dx = clientX - (rect.left + radius);
      const dy = clientY - (rect.top + radius);
      const dist = Math.hypot(dx, dy);

      // Clamp the visible knob to the base edge.
      const clamp = dist > radius ? radius / dist : 1;
      setKnob({ x: dx * clamp, y: dy * clamp });

      const dir = resolveDir(dx, dy, radius, lastDir.current);
      if (dir !== lastDir.current) {
        lastDir.current = dir;
        onDirection(dir);
      }
    },
    [onDirection]
  );

  const handleDown = useCallback(
    (e) => {
      if (disabled) return;
      e.preventDefault();
      activeId.current = e.pointerId;
      e.currentTarget.setPointerCapture(e.pointerId);
      update(e.clientX, e.clientY);
    },
    [disabled, update]
  );

  const handleMove = useCallback(
    (e) => {
      if (activeId.current !== e.pointerId) return;
      e.preventDefault();
      update(e.clientX, e.clientY);
    },
    [update]
  );

  const handleUp = useCallback(
    (e) => {
      if (activeId.current !== e.pointerId) return;
      activeId.current = null;
      reset();
    },
    [reset]
  );

  return (
    <div className="ct-maze-joystick-wrap">
      <div
        ref={baseRef}
        className={`ct-maze-joystick${disabled ? ' is-disabled' : ''}`}
        role="application"
        aria-label={ariaLabel}
        style={{ touchAction: 'none' }}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
      >
        <span
          className="ct-maze-joystick-knob"
          style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
        />
      </div>
    </div>
  );
}
