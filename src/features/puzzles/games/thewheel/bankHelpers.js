/*
 * Shared shape for THE WHEEL's content banks.
 *
 * Its own module so `data.js` and `dataMore.js` can both use it without an
 * import cycle: the banks got large enough to split, and a cycle between two
 * data files that also define the helpers would leave `P` in the temporal dead
 * zone at module-evaluation time — which fails at import, not at play, and is
 * exactly the kind of break nobody notices until the game will not open.
 */

/** Percentage question: the slider is always 0–100, in whole percent. */
export const P = (id, q, truth, low, high, tol, fact) =>
  ({ id, q, unit: '%', min: 0, max: 100, dec: false, truth, low, high, tol, fact });

/** Free-unit question: explicit range, and `dec` allows one decimal place. */
export const N = (id, q, unit, min, max, dec, truth, low, high, tol, fact) =>
  ({ id, q, unit, min, max, dec, truth, low, high, tol, fact });

/**
 * The twelve wheel segments. Every question's `low`/`high` anchor must be one
 * of these — the wheel physically cannot stop anywhere else.
 */
export const WHEEL_VALUES = [2, 5, 12, 25, 42, 65, 90, 150, 230, 365, 600, 1000];

/** Turn the compact `[name, value]` authoring form into objects. */
export const pool = (p) => ({ ...p, items: p.items.map(([n, v]) => ({ n, v })) });
