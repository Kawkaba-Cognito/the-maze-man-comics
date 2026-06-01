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

  const triggerShake = useCallback(() => {
    setShake(true);
    clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setShake(false), 380);
  }, []);

  const flashToast = useCallback((text) => {
    setToast({ text, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1100);
  }, []);

  /** Correct action. Returns { combo, rating } so callers can score. */
  const hit = useCallback(({ rtMs = null, limitMs = null, particles = true } = {}) => {
    comboRef.current += 1;
    if (comboRef.current > bestComboRef.current) bestComboRef.current = comboRef.current;
    setCombo(comboRef.current);
    if (particles) setParticle({ id: performance.now(), type: 'ok' });
    const rating = rtRating(rtMs, limitMs);
    if (rating.key !== 'good') setRtFx({ id: performance.now(), key: rating.key });
    return { combo: comboRef.current, rating };
  }, []);

  /** Wrong / timeout. Resets combo, shakes, red particles. */
  const miss = useCallback(() => {
    comboRef.current = 0;
    setCombo(0);
    setParticle({ id: performance.now(), type: 'bad' });
    triggerShake();
  }, [triggerShake]);

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
