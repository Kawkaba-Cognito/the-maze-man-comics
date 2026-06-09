/**
 * Build the paid-hint config consumed by PuzzleToolbar / NumberPuzzleFrame.
 * A hint costs `cost` points and reveals one correct cell via the engine's
 * `hintReveal(state) → { next, revealed }`. Spending happens in the toolbar,
 * and only when a cell is actually revealed.
 */
export const HINT_COST = 20;

export function makeHint({ points, spendPoints, solved, state, setState, hintReveal, cost = HINT_COST }) {
  return {
    points,
    cost,
    spendPoints,
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
