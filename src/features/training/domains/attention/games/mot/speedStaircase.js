/*
 * speedStaircase.js — MOT's adaptive SPEED-threshold test (NeuroTracker /
 * Faubert style): target count fixed, object speed adapts 2-down/1-up to the
 * point where tracking just breaks down. Speed is continuous, so steps are
 * MULTIPLICATIVE. The algorithm lives in shared/staircase.js; this file is
 * only the game's configuration.
 */
import { createAdaptiveStaircase } from '../../../../shared/staircase';

export function createSpeedStaircase({
  start = 0.26,
  min = 0.05,
  max = 1.0,
  stepFactor = 1.18,
  targetReversals = 8,
  finalReversals = 6,
  maxTrials = 18,
} = {}) {
  const core = createAdaptiveStaircase({
    start,
    min,
    max,
    stepMode: 'multiply',
    stepFactor,
    shrink: true,
    targetReversals,
    finalReversals,
    maxTrials,
  });
  return {
    get speed() {
      return core.value;
    },
    get trialCount() {
      return core.trialCount;
    },
    get reversalCount() {
      return core.reversalCount;
    },
    get done() {
      return core.done;
    },
    record: (pass) => core.record(pass),
    threshold: () => core.threshold(),
    thresholdStats: () => core.thresholdStats(),
  };
}
