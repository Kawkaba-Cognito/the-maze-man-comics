/*
 * staircase.js — Cancellation's adaptive threshold test: a 2-down/1-up
 * transformed staircase over the 0..299 easy→medium→hard board curriculum.
 * Threshold = mean of the reversal levels. The algorithm lives in
 * shared/staircase.js; this file is only the game's configuration.
 */
import { createAdaptiveStaircase } from '../../../../shared/staircase';

export function createStaircase({
  start = 90,
  step = 22,
  minLevel = 0,
  maxLevel = 299,
  targetReversals = 6,
  finalReversals = 4,
  maxTrials = 14,
} = {}) {
  const core = createAdaptiveStaircase({
    start,
    min: minLevel,
    max: maxLevel,
    stepMode: 'add',
    step,
    minStep: 2,
    shrink: true,
    targetReversals,
    finalReversals,
    maxTrials,
    round: true,
  });
  return {
    get level() {
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
    snapshot: () => core.snapshot(),
  };
}
