/*
 * speedStaircase.js — adaptive SPEED-threshold staircase for MOT.
 *
 * The gold-standard MOT ability measure (e.g. NeuroTracker / Faubert): hold the
 * target count fixed (track 4 of 8) and adapt the OBJECT SPEED to the point where
 * tracking just breaks down. A 2-down/1-up transformed staircase (Levitt 1971)
 * converges on the ~70.7% perfect-tracking speed: two perfect trials → faster
 * (harder), one miss → slower (easier). Threshold = mean of the reversal speeds.
 *
 * Speed is continuous, so steps are MULTIPLICATIVE (×/÷ factor) and the factor
 * shrinks after early reversals to bracket the threshold finely. Pure JS.
 */
export function createSpeedStaircase({
  start = 0.26,
  min = 0.05,
  max = 1.0,
  stepFactor = 1.18,
  targetReversals = 8,
  finalReversals = 6,
  maxTrials = 18,
} = {}) {
  const clamp = (v) => Math.max(min, Math.min(max, v));
  let speed = clamp(start);
  let factor = stepFactor;
  let consec = 0;
  let lastDir = 0; // +1 faster, -1 slower
  const reversals = [];
  const trials = [];

  return {
    get speed() {
      return speed;
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

    record(pass) {
      trials.push({ speed, pass });
      let dir = 0;
      if (pass) {
        consec += 1;
        if (consec >= 2) { dir = +1; consec = 0; } // 2 perfect → speed up
      } else {
        dir = -1; consec = 0; // 1 miss → slow down
      }
      if (dir !== 0) {
        if (lastDir !== 0 && dir !== lastDir) {
          reversals.push(speed);
          if (reversals.length === 2 || reversals.length === 4) {
            factor = 1 + (factor - 1) * 0.6; // coarse → fine
          }
        }
        speed = clamp(dir > 0 ? speed * factor : speed / factor);
        lastDir = dir;
      }
    },

    /** Threshold = mean of the last `finalReversals` reversal speeds. */
    threshold() {
      const rev = reversals.slice(-finalReversals);
      if (!rev.length) return speed;
      return rev.reduce((a, b) => a + b, 0) / rev.length;
    },

    /** Threshold + its within-session spread (SD of the averaged reversals),
     *  used to derive a standard error for reliable-change detection. */
    thresholdStats() {
      const rev = reversals.slice(-finalReversals);
      if (!rev.length) return { mean: speed, sd: 0, n: 0 };
      const mean = rev.reduce((a, b) => a + b, 0) / rev.length;
      const sd = rev.length > 1
        ? Math.sqrt(rev.reduce((a, b) => a + (b - mean) ** 2, 0) / (rev.length - 1))
        : 0;
      return { mean, sd, n: rev.length };
    },
  };
}
