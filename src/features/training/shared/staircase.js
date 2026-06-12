/*
 * STAIRCASE — adaptive difficulty for the training games' free mode.
 *
 * Implements the transformed up/down staircase from psychophysics
 * (Levitt 1971): with nDown = 2 ("1-up-2-down"), difficulty rises only
 * after 2 consecutive successes and falls after every failure, so play
 * converges on ~70.7% success — the zone the adaptive-training literature
 * identifies as optimal for both engagement and training effect (hard
 * enough to drive adaptation, easy enough to avoid frustration).
 *
 * Pure JS, no React. The level is an abstract integer 0..max; each game
 * maps it onto its own parameters (legend size, response deadline, …).
 *
 * Reversal count is tracked because the mean of reversal levels is the
 * standard threshold estimate — Phase 4 reporting can use it as "the
 * difficulty you can sustain".
 */

export function createStaircase({ start = 0, min = 0, max = 60, nDown = 2 } = {}) {
  let level = Math.max(min, Math.min(max, start));
  let streak = 0;
  let reversals = 0;
  let lastDir = 0; // +1 climbing, -1 descending

  const turn = (dir) => {
    if (lastDir && dir !== lastDir) reversals += 1;
    lastDir = dir;
  };

  return {
    get level() {
      return level;
    },
    get reversals() {
      return reversals;
    },

    /** Returns the (possibly raised) level after a successful trial. */
    success() {
      streak += 1;
      if (streak >= nDown) {
        streak = 0;
        if (level < max) {
          level += 1;
          turn(1);
        }
      }
      return level;
    },

    /** Returns the (possibly lowered) level after a failed trial. */
    failure() {
      streak = 0;
      if (level > min) {
        level -= 1;
        turn(-1);
      }
      return level;
    },
  };
}
