/**
 * Build the paid-hint config consumed by PuzzleToolbar / NumberPuzzleFrame.
 * Pass cost: 0 for free practice hints.
 */
export const HINT_COST = 20;

export function makeHint({ points, spendPoints, solved, state, setState, hintReveal, cost = HINT_COST }) {
  const free = cost === 0;
  return {
    points,
    cost,
    free,
    spendPoints: free ? () => {} : spendPoints,
    disabled: solved || !state,
    onReveal: () => {
      if (!state) return false;
      const { next, revealed } = hintReveal(state);
      if (!revealed) return false;
      setState(next);
      return true;
    },
  };
}

/** Free hint during practice — works on onboarding trialState. */
export function makeTrialHint({ trialState, setTrialState, hintReveal, solved, isAr }) {
  return {
    ...makeHint({
      points: 999,
      spendPoints: () => {},
      solved,
      state: trialState,
    setState: (updater) => {
      setTrialState((prev) => (typeof updater === 'function' ? updater(prev) : updater));
    },
      hintReveal,
      cost: 0,
    }),
    label: isAr ? '💡 تلميح مجاني' : '💡 Free hint',
  };
}
