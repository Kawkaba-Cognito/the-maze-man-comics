/*
 * STAIRCASE — the transformed up/down staircase from psychophysics (Levitt
 * 1971), shared by every training game. With nDown = 2 ("2-down/1-up"),
 * difficulty rises only after 2 consecutive successes and falls after every
 * failure, converging on ~70.7% success — the zone the adaptive-training
 * literature identifies as optimal for engagement and training effect.
 *
 * Two entry points, one algorithm:
 *
 *  • createStaircase({ start, min, max, nDown })
 *      The simple free-mode ladder (±1 integer level). Used by Spatial
 *      Stroop, Raven Matrices, Colour Sort. API: success() / failure() /
 *      .level / .reversals.
 *
 *  • createAdaptiveStaircase(opts)
 *      The assessment-grade engine behind the Cancellation and MOT threshold
 *      tests. Supports additive steps (level curricula) or MULTIPLICATIVE
 *      steps (continuous values such as MOT object speed), step shrinking
 *      after early reversals (coarse → fine bracketing), a stop rule
 *      (targetReversals / maxTrials), and threshold estimation = mean of the
 *      last `finalReversals` reversal values (the standard estimator), with
 *      thresholdStats() providing the spread for reliable-change reporting.
 *
 * Pure JS, no React. The value is abstract; each game maps it onto its own
 * parameters (board index, legend size, object speed, …).
 */

export function createAdaptiveStaircase({
  start,
  min,
  max,
  nDown = 2,
  stepMode = 'add', // 'add' (levels) | 'multiply' (continuous, e.g. speed)
  step = 1, // additive step size
  minStep = 2, // additive floor once shrinking starts
  stepFactor = 1.18, // multiplicative step
  shrink = true, // tighten the step after reversals 2 and 4 (coarse → fine)
  targetReversals = Infinity,
  finalReversals = 4,
  maxTrials = Infinity,
  round = false, // expose Math.round-ed values (integer level curricula)
} = {}) {
  const clamp = (v) => Math.max(min, Math.min(max, v));
  let value = clamp(start);
  let stepSize = step;
  let factor = stepFactor;
  let consec = 0;
  let lastDir = 0; // +1 harder, -1 easier, 0 = no move yet
  const reversals = [];
  const trials = [];

  const exposed = () => (round ? Math.round(value) : value);

  const api = {
    get value() {
      return exposed();
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
      trials.push({ value: exposed(), pass });
      let dir = 0;
      if (pass) {
        consec += 1;
        if (consec >= nDown) {
          dir = +1; // harder
          consec = 0;
        }
      } else {
        dir = -1; // easier
        consec = 0;
      }
      if (dir !== 0) {
        if (lastDir !== 0 && dir !== lastDir) {
          reversals.push(exposed());
          if (shrink && (reversals.length === 2 || reversals.length === 4)) {
            if (stepMode === 'multiply') factor = 1 + (factor - 1) * 0.6;
            else stepSize = Math.max(minStep, Math.round(stepSize / 2));
          }
        }
        value = clamp(
          stepMode === 'multiply'
            ? dir > 0
              ? value * factor
              : value / factor
            : value + dir * stepSize,
        );
        lastDir = dir;
      }
      return exposed();
    },

    /** Threshold estimate = mean of the last `finalReversals` reversal values. */
    threshold() {
      const rev = reversals.slice(-finalReversals);
      if (!rev.length) return exposed();
      const mean = rev.reduce((a, b) => a + b, 0) / rev.length;
      return round ? Math.round(mean) : mean;
    },

    /** Threshold + its within-session spread (SD of the averaged reversals),
     *  used to derive a standard error for reliable-change detection. */
    thresholdStats() {
      const rev = reversals.slice(-finalReversals);
      if (!rev.length) return { mean: exposed(), sd: 0, n: 0 };
      const mean = rev.reduce((a, b) => a + b, 0) / rev.length;
      const sd =
        rev.length > 1
          ? Math.sqrt(rev.reduce((a, b) => a + (b - mean) ** 2, 0) / (rev.length - 1))
          : 0;
      return { mean, sd, n: rev.length };
    },

    snapshot() {
      return {
        level: exposed(),
        reversals: [...reversals],
        trials: trials.length,
        threshold: api.threshold(),
      };
    },
  };
  return api;
}

/** Simple free-mode ladder: ±1 integer level, no stop rule, no step shrink. */
export function createStaircase({ start = 0, min = 0, max = 60, nDown = 2 } = {}) {
  const core = createAdaptiveStaircase({
    start,
    min,
    max,
    nDown,
    stepMode: 'add',
    step: 1,
    shrink: false,
    round: true,
  });
  return {
    get level() {
      return core.value;
    },
    get reversals() {
      return core.reversalCount;
    },
    /** Returns the (possibly raised) level after a successful trial. */
    success() {
      return core.record(true);
    },
    /** Returns the (possibly lowered) level after a failed trial. */
    failure() {
      return core.record(false);
    },
  };
}
