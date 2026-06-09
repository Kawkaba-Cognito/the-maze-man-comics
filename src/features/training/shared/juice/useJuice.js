import { useCallback, useRef, useState } from 'react';
import { rtRating } from './juiceUtils';

/**
 * useJuice — shared "game feel" state for the training games.
 *
 * Manages combo counter, best-combo, particle bursts, RT-rating floats,
 * screen shake, transient toasts and a one-shot solve celebration. Games call
 * `hit()` on a correct action and `miss()` on a wrong/timeout, then render the
 * matching pieces from <JuiceLayer/>.
 */
export function useJuice() {
  const [combo, setCombo] = useState(0);
  const [particle, setParticle] = useState(null);
  const [rtFx, setRtFx] = useState(null);
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState(null);
  const [burst, setBurst] = useState(null);

  const comboRef = useRef(0);
  const bestComboRef = useRef(0);
  const shakeTimer = useRef(null);
  const toastTimer = useRef(null);

  // Screen shake disabled — it was distracting. Kept as a no-op for callers.
  const triggerShake = useCallback(() => {}, []);

  const flashToast = useCallback((text) => {
    setToast({ text, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1100);
  }, []);

  /** Correct action. Returns { combo, rating } so callers can score.
   *  Visuals (particles, RT floats) are intentionally OFF — they were too
   *  distracting; only combo/rating tracking remains for scoring. */
  const hit = useCallback(({ rtMs = null, limitMs = null } = {}) => {
    comboRef.current += 1;
    if (comboRef.current > bestComboRef.current) bestComboRef.current = comboRef.current;
    setCombo(comboRef.current);
    const rating = rtRating(rtMs, limitMs);
    return { combo: comboRef.current, rating };
  }, []);

  /** Wrong / timeout. Resets combo (no particles / screen shake). */
  const miss = useCallback(() => {
    comboRef.current = 0;
    setCombo(0);
  }, []);

  /** One-shot celebration burst (puzzle / word solves). */
  const celebrate = useCallback(() => {
    setBurst(performance.now());
  }, []);

  const reset = useCallback(() => {
    comboRef.current = 0;
    bestComboRef.current = 0;
    clearTimeout(shakeTimer.current);
    clearTimeout(toastTimer.current);
    setCombo(0);
    setParticle(null);
    setRtFx(null);
    setShake(false);
    setToast(null);
    setBurst(null);
  }, []);

  return {
    // state
    combo,
    particle,
    rtFx,
    shake,
    toast,
    burst,
    // refs
    comboRef,
    bestComboRef,
    // actions
    hit,
    miss,
    celebrate,
    reset,
    flashToast,
    triggerShake,
  };
}
