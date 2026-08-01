import React, { useEffect, useRef, useState } from 'react';
import { SURVIVAL_MS } from './survival';
import { useTrainingPaused } from './pauseStore';

/*
 * Survival countdown for the React-state (non-canvas) games. When `active`
 * (a Survival run is in progress), it counts down from SURVIVAL_MS and fires
 * `onTimeout` once to end the run. Resets whenever `active` goes false.
 */
export function useSurvivalCountdown(active, onTimeout) {
  const [remaining, setRemaining] = useState(SURVIVAL_MS);
  const cbRef = useRef(onTimeout);
  cbRef.current = onTimeout;

  /*
   * The countdown pauses itself whenever the platform is paused.
   *
   * It used to read wall-clock time straight (`SURVIVAL_MS - (now - start)`),
   * so opening the pause menu did nothing to it: the run kept draining behind
   * the menu and a player could come back to a finished game. Caught by
   * measuring it — the timer went 34s → 30s across four paused seconds.
   *
   * Reading the shared flag HERE rather than taking a prop means every game
   * that uses this hook gets correct pause with no change of its own.
   */
  const paused = useTrainingPaused();
  const pausedRef = useRef(false);
  const pausedAtRef = useRef(0);
  const pausedTotalRef = useRef(0);

  useEffect(() => {
    if (paused && !pausedRef.current) {
      pausedRef.current = true;
      pausedAtRef.current = Date.now();
    } else if (!paused && pausedRef.current) {
      pausedRef.current = false;
      pausedTotalRef.current += Date.now() - pausedAtRef.current;
    }
  }, [paused]);

  useEffect(() => {
    if (!active) {
      setRemaining(SURVIVAL_MS);
      pausedTotalRef.current = 0;
      pausedRef.current = false;
      return undefined;
    }
    const start = Date.now();
    pausedTotalRef.current = 0;
    const id = setInterval(() => {
      // Hold the reading steady while paused; the elapsed-time subtraction
      // below is what actually gives the time back on resume.
      if (pausedRef.current) return;
      const left = Math.max(0, SURVIVAL_MS - (Date.now() - start - pausedTotalRef.current));
      setRemaining(left);
      if (left <= 0) { clearInterval(id); if (cbRef.current) cbRef.current(); }
    }, 100);
    return () => clearInterval(id);
  }, [active]);
  return remaining;
}

/** Thin countdown bar — drop into a game's play header during Survival. */
export function SurvivalCountdownBar({ remaining, color = 'var(--color-amber)' }) {
  const pct = Math.max(0, Math.min(1, remaining / SURVIVAL_MS));
  return (
    <div className="ct-survival-bar" aria-hidden="true">
      <div className="ct-survival-bar-fill" style={{ width: `${pct * 100}%`, background: pct < 0.2 ? '#ff5a5a' : color }} />
    </div>
  );
}
