import assert from 'node:assert/strict';
import {
  TRAINING_DOMAIN_IDS,
  WELLBEING_PRACTICE_IDS,
  createNetwork,
  getWellbeingContext,
  loadPersonalization,
  personalizationStatus,
  predictNetwork,
  recordTrainingChoice,
  recordTrainingOutcome,
  recordWellbeingChoice,
  resetPersonalization,
  setPersonalizationEnabled,
  trainNetwork,
  wellbeingContextVector,
} from '../src/features/personalization/neuralPersonalization.js';
import {
  trainingFeatureVector,
} from '../src/features/personalization/trainingRecommendations.js';
import { getWellbeingRecommendation } from '../src/features/personalization/wellbeingRecommendations.js';

class MemoryStorage {
  #values = new Map();

  getItem(key) { return this.#values.has(key) ? this.#values.get(key) : null; }
  setItem(key, value) { this.#values.set(key, String(value)); }
  removeItem(key) { this.#values.delete(key); }
  clear() { this.#values.clear(); }
}

globalThis.localStorage = new MemoryStorage();

const network = createNetwork(3, 5, 3, 'validation');
const input = [0.2, 0.8, 0.4];
const before = predictNetwork(network, input).probabilities;
for (let i = 0; i < 45; i += 1) trainNetwork(network, input, [0, 0, 1], { epochs: 2 });
const after = predictNetwork(network, input).probabilities;
assert.equal(before.length, 3);
assert.ok(Math.abs(after.reduce((sum, value) => sum + value, 0) - 1) < 1e-9);
assert.ok(after[2] > before[2], 'back-propagation must increase the trained class probability');
assert.ok(after[2] > after[0] && after[2] > after[1]);

const contextVector = wellbeingContextVector({ need: 'sleep', time: 'medium' });
assert.equal(contextVector.length, 8);
assert.equal(contextVector.reduce((sum, value) => sum + value, 0), 2);
assert.equal(getWellbeingRecommendation({ need: 'calm', time: 'quick' }).id, 'breathe');
assert.equal(getWellbeingRecommendation({ need: 'sleep', time: 'quick' }).id, 'sleep-sounds');

const snapshot = TRAINING_DOMAIN_IDS.map((domainId, index) => ({
  domainId,
  rating: 300 + index * 80,
  runs: index,
  lastPlayed: index % 2 ? '2026-08-01' : null,
}));
const trainingVector = trainingFeatureVector(snapshot);
assert.equal(trainingVector.length, 18);
assert.ok(trainingVector.every((value) => value >= 0 && value <= 1));

setPersonalizationEnabled(true);
assert.equal(loadPersonalization().enabled, true);
for (let i = 0; i < 3; i += 1) {
  recordTrainingChoice('memory', trainingVector);
  recordWellbeingChoice('breathe', { need: 'calm', time: 'quick' });
}
for (let i = 0; i < 4; i += 1) {
  recordTrainingOutcome({
    domainId: 'memory', level: 4 + i, priorLevel: 3 + i,
    ratingBefore: 420 + i * 10, ratingAfter: 455 + i * 10, runCount: i + 2,
  });
}
const learned = loadPersonalization();
assert.equal(learned.stats.trainingChoices, 3);
assert.equal(learned.stats.trainingOutcomes, 4);
assert.equal(learned.stats.wellbeingChoices, 3);
assert.ok(['learning', 'personalized'].includes(personalizationStatus(learned)));
assert.ok(learned.models.training.steps > 0 && learned.models.wellbeing.steps > 0);
assert.ok(WELLBEING_PRACTICE_IDS.includes(getWellbeingRecommendation(getWellbeingContext()).id));

resetPersonalization({ enabled: false });
assert.equal(loadPersonalization().enabled, false);
assert.equal(loadPersonalization().stats.trainingChoices, 0);

console.log('Personalization validation passed: network math, cold start, persistence, and learning gates.');
