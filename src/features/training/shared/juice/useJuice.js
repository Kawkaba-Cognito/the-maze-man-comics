import { useCallback, useRef, useState } from 'react';
import { rtRating } from './juiceUtils';

/**
 * useJuice — shared feedback state for the training games, calm-professional:
 * combo/best-combo tracking (for scoring), an informational toast, and a
 * one-shot quiet solve pulse. Flashy effects (shake, particles, RT floats)
 * were removed deliberately — attention-capturing motion is a distractor
 * confound in cognitive training, and it read as unprofessional.
 */
export function useJuice() {
  const [combo, setCombo] = useState(0);
  const [toast, setToast] = useState(null);
  const [burst, setBurst] = useState(null);

  const comboRef = useRef(0);
  const bestComboRef = useRef(0);
  const toastTimer = useRef(null);

  const flashToast = useCallback((text) => {
    setToast({ text, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1100);
  }, []);

  /** Correct action. Returns { combo, rating } so callers can score. */
  const hit = useCallback(({ rtMs = null, limitMs = null } = {}) => {
    comboRef.current += 1;
    if (comboRef.current > bestComboRef.current) bestComboRef.current = comboRef.current;
    setCombo(comboRef.current);
    const rating = rtRating(rtMs, limitMs);
    return { combo: comboRef.current, rating };
  }, []);

  /** Wrong / timeout. Resets the combo. */
  const miss = useCallback(() => {
    comboRef.current = 0;
    setCombo(0);
  }, []);

  /** One-shot quiet acknowledgement for puzzle / word solves. */
  const celebrate = useCallback(() => {
    setBurst(performance.now());
  }, []);

  const reset = useCallback(() => {
    comboRef.current = 0;
    bestComboRef.current = 0;
    clearTimeout(toastTimer.current);
    setCombo(0);
    setToast(null);
    setBurst(null);
  }, []);

  return {
    combo,
    toast,
    burst,
    comboRef,
    bestComboRef,
    hit,
    miss,
    celebrate,
    reset,
    flashToast,
  };
}
