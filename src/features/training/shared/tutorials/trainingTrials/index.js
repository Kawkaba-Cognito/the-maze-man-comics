/** Training games use carousel → ready (no board trial state). */
const DEFAULT_TRIAL = { skipTrials: true };

export function getTrainingTrial(gameId) {
  return DEFAULT_TRIAL;
}
