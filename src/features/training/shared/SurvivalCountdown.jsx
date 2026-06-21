import React, { useEffect, useRef, useState } from 'react';
import { SURVIVAL_MS } from './survival';

/*
 * Survival countdown for the React-state (non-canvas) games. When `active`
 * (a Survival run is in progress), it counts down from SURVIVAL_MS and fires
 * `onTimeout` once to end the run. Resets whenever `active` goes false.
 */
export function useSurvivalCountdown(active, onTimeout) {
  const [remaining, setRemaining] = useState(SURVIVAL_MS);
  const cbRef = useRef(onTimeout);
  cbRef.current = onTimeout;
  useEffect(() => {
    if (!active) { setRemaining(SURVIVAL_MS); return undefined; }
    const start = Date.now();
    const id = setInterval(() => {
      const left = Math.max(0, SURVIVAL_MS - (Date.now() - start));
      setRemaining(left);
      if (left <= 0) { clearInterval(id); if (cbRef.current) cbRef.current(); }
    }, 100);
    return () => clearInterval(id);
  }, [active]);
  return remaining;
}

/** Thin countdown bar — drop into a game's play header during Survival. */
export function SurvivalCountdownBar({ remaining, color = '#e8ac4e' }) {
  const pct = Math.max(0, Math.min(1, remaining / SURVIVAL_MS));
  return (
    <div className="ct-survival-bar" aria-hidden="true">
      <div className="ct-survival-bar-fill" style={{ width: `${pct * 100}%`, background: pct < 0.2 ? '#ff5a5a' : color }} />
    </div>
  );
}
