/*
 * staircase.js — adaptive 2-down/1-up transformed staircase (Levitt 1971).
 *
 * Two consecutive PASSES make the task harder (level up); a single FAIL makes it
 * easier (level down). This rule converges on the difficulty at which the player
 * succeeds ~70.7% of the time — a principled "attention threshold" instead of an
 * ad-hoc score. Threshold = mean of the reversal points (where the staircase
 * changes direction), the standard estimator. Step size shrinks after the first
 * reversals to bracket the threshold more precisely.
 *
 * Pure JS, no React. `level` is an abstract difficulty index the caller maps to
 * an actual board (here: the 0..299 easy→medium→hard curriculum).
 */
export function createStaircase({
  start = 90,
  step = 22,
  minLevel = 0,
  maxLevel = 299,
  targetReversals = 6,
  finalReversals = 4,
  maxTrials = 14,
} = {}) {
  let level = start;
  let consecCorrect = 0;
  let lastMoveDir = 0; // -1 easier, +1 harder, 0 = no move yet
  let stepSize = step;
  const reversals = [];
  const trials = [];

  const clamp = (v) => Math.min(maxLevel, Math.max(minLevel, v));

  return {
    get level() {
      return Math.round(level);
    },
    get trialCount() {
      return trials.length;
    },
    get reversalCount() {
      return reversals.length;
    },
    get done() {
      return reversals.length >= targetReversals || trials.length >= maxTrials;
    },

    /** Feed one trial outcome; advances the staircase. */
    record(pass) {
      trials.push({ level: Math.round(level), pass });
      let moveDir = 0;
      if (pass) {
        consecCorrect += 1;
        if (consecCorrect >= 2) {
          moveDir = +1; // harder
          consecCorrect = 0;
        }
      } else {
        moveDir = -1; // easier
        consecCorrect = 0;
      }
      if (moveDir !== 0) {
        if (lastMoveDir !== 0 && moveDir !== lastMoveDir) {
          reversals.push(Math.round(level));
          // Tighten the step after the first couple of reversals (coarse→fine).
          if (reversals.length === 2 || reversals.length === 4) {
            stepSize = Math.max(2, Math.round(stepSize / 2));
          }
        }
        level = clamp(level + moveDir * stepSize);
        lastMoveDir = moveDir;
      }
    },

    /** Threshold estimate = mean of the last `finalReversals` reversal levels. */
    threshold() {
      const rev = reversals.slice(-finalReversals);
      if (!rev.length) return Math.round(level);
      return Math.round(rev.reduce((a, b) => a + b, 0) / rev.length);
    },

    snapshot() {
      return {
        level: Math.round(level),
        reversals: [...reversals],
        trials: trials.length,
        threshold: this.threshold(),
      };
    },
  };
}
