import { loadJson, saveJson } from '../../lib/storage';

const KEY = 'rx_wellbeing_journey_v1';
const empty = () => ({ v: 1, practices: {} });

export function loadWellbeingJourney() {
  const stored = loadJson(KEY, null);
  if (!stored || typeof stored.practices !== 'object' || Array.isArray(stored.practices)) return empty();
  return { v: 1, practices: stored.practices };
}

/**
 * A pressure-free progression record: it counts showing up, never mood scores,
 * streaks or outcomes. Missing days cannot reduce it.
 */
export function recordWellbeingCompletion(practiceId) {
  if (!practiceId) return loadWellbeingJourney();
  const state = loadWellbeingJourney();
  const previous = state.practices[practiceId] || {};
  state.practices[practiceId] = {
    count: Math.max(0, Number(previous.count) || 0) + 1,
    lastAt: Date.now(),
  };
  saveJson(KEY, state);
  return state;
}
