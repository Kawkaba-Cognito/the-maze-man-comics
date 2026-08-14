import { loadJson, saveJson } from '../../lib/storage.js';

/*
 * A deliberately small, on-device neural personalization engine.
 *
 * This is not a diagnostic model. It learns only from choices and completed
 * training runs already made inside the app. The complete model and its short,
 * capped interaction history stay in localStorage and can be erased at once.
 *
 * The network is a real one-hidden-layer MLP trained with back-propagation and
 * softmax cross-entropy. Keeping it dependency-free avoids adding a large ML
 * runtime to a PWA whose interactions need to remain instant on older phones.
 */

export const PERSONALIZATION_KEY = 'mm_personalization_v1';
export const PERSONALIZATION_EVENT = 'mm:personalization-changed';
export const TRAINING_DOMAIN_IDS = [
  'attention', 'speed', 'memory', 'language', 'reasoning', 'flexibility',
];
export const WELLBEING_PRACTICE_IDS = [
  'mbsr', 'breathe', 'grounding', 'pmr', 'ikigai',
  'personality-quiz', 'relationship-quiz', 'sleep-sounds',
];
export const WELLBEING_NEEDS = ['calm', 'sleep', 'meaning', 'connection', 'self'];
export const WELLBEING_TIMES = ['quick', 'medium', 'deep'];

const MODEL_VERSION = 1;
const HISTORY_LIMIT = 40;
const TRAINING_INPUTS = TRAINING_DOMAIN_IDS.length * 3;
const WELLBEING_INPUTS = WELLBEING_NEEDS.length + WELLBEING_TIMES.length;

const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, Number(n) || 0));

function hashSeed(value) {
  let h = 2166136261;
  for (const ch of String(value)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed) {
  let x = hashSeed(seed) || 0x9e3779b9;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

export function createNetwork(inputSize, hiddenSize, outputSize, seed = 'maze-man') {
  const random = seededRandom(seed);
  const w1Scale = Math.sqrt(6 / (inputSize + hiddenSize));
  const w2Scale = Math.sqrt(6 / (hiddenSize + outputSize));
  return {
    inputSize,
    hiddenSize,
    outputSize,
    w1: Array.from({ length: inputSize * hiddenSize }, () => (random() * 2 - 1) * w1Scale),
    b1: Array(hiddenSize).fill(0),
    w2: Array.from({ length: hiddenSize * outputSize }, () => (random() * 2 - 1) * w2Scale),
    b2: Array(outputSize).fill(0),
    steps: 0,
  };
}

function validNetwork(candidate, spec) {
  return candidate
    && candidate.inputSize === spec.inputSize
    && candidate.hiddenSize === spec.hiddenSize
    && candidate.outputSize === spec.outputSize
    && candidate.w1?.length === spec.inputSize * spec.hiddenSize
    && candidate.w2?.length === spec.hiddenSize * spec.outputSize;
}

function softmax(logits) {
  const max = Math.max(...logits);
  const exp = logits.map((v) => Math.exp(v - max));
  const total = exp.reduce((sum, v) => sum + v, 0) || 1;
  return exp.map((v) => v / total);
}

export function predictNetwork(network, rawInput) {
  const input = Array.from({ length: network.inputSize }, (_, i) => clamp(rawInput[i], -1, 1));
  const hidden = Array(network.hiddenSize).fill(0);
  for (let h = 0; h < network.hiddenSize; h += 1) {
    let sum = network.b1[h];
    for (let i = 0; i < network.inputSize; i += 1) {
      sum += network.w1[h * network.inputSize + i] * input[i];
    }
    hidden[h] = Math.tanh(sum);
  }
  const logits = Array(network.outputSize).fill(0);
  for (let o = 0; o < network.outputSize; o += 1) {
    let sum = network.b2[o];
    for (let h = 0; h < network.hiddenSize; h += 1) {
      sum += network.w2[o * network.hiddenSize + h] * hidden[h];
    }
    logits[o] = sum;
  }
  return { input, hidden, probabilities: softmax(logits) };
}

export function trainNetwork(network, input, target, { epochs = 4, rate = 0.045 } = {}) {
  const targetTotal = target.reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0) || 1;
  const wanted = target.map((value) => Math.max(0, Number(value) || 0) / targetTotal);

  for (let epoch = 0; epoch < epochs; epoch += 1) {
    const pass = predictNetwork(network, input);
    const outputDelta = pass.probabilities.map((value, i) => value - wanted[i]);
    const hiddenDelta = Array(network.hiddenSize).fill(0);

    for (let h = 0; h < network.hiddenSize; h += 1) {
      let sum = 0;
      for (let o = 0; o < network.outputSize; o += 1) {
        sum += outputDelta[o] * network.w2[o * network.hiddenSize + h];
      }
      hiddenDelta[h] = sum * (1 - pass.hidden[h] * pass.hidden[h]);
    }

    for (let o = 0; o < network.outputSize; o += 1) {
      for (let h = 0; h < network.hiddenSize; h += 1) {
        const idx = o * network.hiddenSize + h;
        const gradient = clamp(outputDelta[o] * pass.hidden[h], -1, 1);
        network.w2[idx] -= rate * gradient;
      }
      network.b2[o] -= rate * clamp(outputDelta[o], -1, 1);
    }

    for (let h = 0; h < network.hiddenSize; h += 1) {
      for (let i = 0; i < network.inputSize; i += 1) {
        const idx = h * network.inputSize + i;
        const gradient = clamp(hiddenDelta[h] * pass.input[i], -1, 1);
        network.w1[idx] -= rate * gradient;
      }
      network.b1[h] -= rate * clamp(hiddenDelta[h], -1, 1);
    }
    network.steps += 1;
  }
  return network;
}

function networkSpecs() {
  return {
    training: { inputSize: TRAINING_INPUTS, hiddenSize: 12, outputSize: TRAINING_DOMAIN_IDS.length, seed: 'training-v1' },
    difficulty: { inputSize: 6, hiddenSize: 7, outputSize: 3, seed: 'difficulty-v1' },
    wellbeing: { inputSize: WELLBEING_INPUTS, hiddenSize: 9, outputSize: WELLBEING_PRACTICE_IDS.length, seed: 'wellbeing-v1' },
  };
}

function freshStore(enabled = false) {
  const specs = networkSpecs();
  return {
    version: MODEL_VERSION,
    enabled,
    models: Object.fromEntries(Object.entries(specs).map(([key, spec]) => [
      key,
      createNetwork(spec.inputSize, spec.hiddenSize, spec.outputSize, spec.seed),
    ])),
    stats: { trainingChoices: 0, trainingOutcomes: 0, wellbeingChoices: 0, wellbeingFeedback: 0 },
    history: { training: [], wellbeing: [] },
    wellbeingContext: { need: 'calm', time: 'quick' },
  };
}

export function loadPersonalization() {
  const stored = loadJson(PERSONALIZATION_KEY);
  if (!stored || stored.version !== MODEL_VERSION) return freshStore(false);
  const specs = networkSpecs();
  const fallback = freshStore(Boolean(stored.enabled));
  for (const [key, spec] of Object.entries(specs)) {
    if (validNetwork(stored.models?.[key], spec)) fallback.models[key] = stored.models[key];
  }
  fallback.stats = { ...fallback.stats, ...(stored.stats || {}) };
  fallback.history = {
    training: Array.isArray(stored.history?.training) ? stored.history.training.slice(-HISTORY_LIMIT) : [],
    wellbeing: Array.isArray(stored.history?.wellbeing) ? stored.history.wellbeing.slice(-HISTORY_LIMIT) : [],
  };
  fallback.wellbeingContext = sanitizeWellbeingContext(stored.wellbeingContext);
  return fallback;
}

function persist(store) {
  saveJson(PERSONALIZATION_KEY, store);
  return store;
}

function announcePersonalization(store, reset = false) {
  try {
    window.dispatchEvent(new CustomEvent(PERSONALIZATION_EVENT, {
      detail: { enabled: Boolean(store.enabled), reset },
    }));
  } catch {
    /* Node validation, SSR, or a restricted browser context. */
  }
}

export function personalizationEnabled() {
  return loadPersonalization().enabled;
}

export function setPersonalizationEnabled(enabled) {
  const store = loadPersonalization();
  store.enabled = Boolean(enabled);
  persist(store);
  announcePersonalization(store, false);
  return store.enabled;
}

export function resetPersonalization({ enabled = false } = {}) {
  const store = persist(freshStore(Boolean(enabled)));
  announcePersonalization(store, true);
  return store;
}

export function personalizationStatus(store = loadPersonalization()) {
  if (!store.enabled) return 'disabled';
  const examples = store.stats.trainingChoices + store.stats.trainingOutcomes
    + store.stats.wellbeingChoices + store.stats.wellbeingFeedback;
  if (examples < 4) return 'starting';
  if (examples < 20) return 'learning';
  return 'personalized';
}

export function sanitizeWellbeingContext(context) {
  return {
    need: WELLBEING_NEEDS.includes(context?.need) ? context.need : 'calm',
    time: WELLBEING_TIMES.includes(context?.time) ? context.time : 'quick',
  };
}

export function wellbeingContextVector(context) {
  const clean = sanitizeWellbeingContext(context);
  return [
    ...WELLBEING_NEEDS.map((value) => value === clean.need ? 1 : 0),
    ...WELLBEING_TIMES.map((value) => value === clean.time ? 1 : 0),
  ];
}

export function getWellbeingContext() {
  return loadPersonalization().wellbeingContext;
}

export function saveWellbeingContext(context) {
  const store = loadPersonalization();
  store.wellbeingContext = sanitizeWellbeingContext(context);
  persist(store);
  return store.wellbeingContext;
}

export function predictTrainingPreferences(features) {
  const store = loadPersonalization();
  if (!store.enabled || store.stats.trainingChoices < 3) return null;
  return predictNetwork(store.models.training, features).probabilities;
}

export function recordTrainingChoice(domainId, features) {
  const store = loadPersonalization();
  const index = TRAINING_DOMAIN_IDS.indexOf(domainId);
  if (!store.enabled || index < 0) return false;
  const target = TRAINING_DOMAIN_IDS.map((_, i) => i === index ? 1 : 0.025);
  trainNetwork(store.models.training, features, target, { epochs: 3, rate: 0.04 });
  store.stats.trainingChoices += 1;
  store.history.training.push({ type: 'choice', id: domainId, day: new Date().toISOString().slice(0, 10) });
  store.history.training = store.history.training.slice(-HISTORY_LIMIT);
  persist(store);
  return true;
}

function difficultyVector({ ratingBefore, ratingAfter, level, runCount, priorLevel = 0 }) {
  const before = clamp((ratingBefore ?? ratingAfter ?? 500) / 1000);
  const after = clamp((ratingAfter ?? ratingBefore ?? 500) / 1000);
  const delta = clamp(((ratingAfter ?? 0) - (ratingBefore ?? ratingAfter ?? 0)) / 160, -1, 1);
  return [before, after, delta, clamp(level / 20), clamp(runCount / 12), clamp(priorLevel / 20)];
}

export function recordTrainingOutcome(outcome) {
  const store = loadPersonalization();
  if (!store.enabled || !TRAINING_DOMAIN_IDS.includes(outcome?.domainId)) return false;
  const delta = (outcome.ratingAfter ?? 0) - (outcome.ratingBefore ?? outcome.ratingAfter ?? 0);
  const targetIndex = delta < -20 ? 0 : (delta > 20 && outcome.runCount >= 2 ? 2 : 1);
  const target = [0.03, 0.03, 0.03];
  target[targetIndex] = 1;
  trainNetwork(store.models.difficulty, difficultyVector(outcome), target, { epochs: 4, rate: 0.04 });
  store.stats.trainingOutcomes += 1;
  store.history.training.push({
    type: 'result', id: outcome.domainId, level: Math.round(outcome.level || 0),
    direction: ['easier', 'steady', 'harder'][targetIndex], day: new Date().toISOString().slice(0, 10),
  });
  store.history.training = store.history.training.slice(-HISTORY_LIMIT);
  persist(store);
  return true;
}

export function predictDifficulty(outcome) {
  const store = loadPersonalization();
  if (!store.enabled || store.stats.trainingOutcomes < 4) return null;
  return predictNetwork(store.models.difficulty, difficultyVector(outcome)).probabilities;
}

export function predictWellbeingPreferences(context) {
  const store = loadPersonalization();
  if (!store.enabled || store.stats.wellbeingChoices < 3) return null;
  return predictNetwork(store.models.wellbeing, wellbeingContextVector(context)).probabilities;
}

export function recordWellbeingChoice(practiceId, context) {
  const store = loadPersonalization();
  const index = WELLBEING_PRACTICE_IDS.indexOf(practiceId);
  if (!store.enabled || index < 0) return false;
  const clean = sanitizeWellbeingContext(context);
  const target = WELLBEING_PRACTICE_IDS.map((_, i) => i === index ? 1 : 0.02);
  trainNetwork(store.models.wellbeing, wellbeingContextVector(clean), target, { epochs: 3, rate: 0.04 });
  store.stats.wellbeingChoices += 1;
  store.wellbeingContext = clean;
  store.history.wellbeing.push({ type: 'choice', id: practiceId, need: clean.need, time: clean.time, day: new Date().toISOString().slice(0, 10) });
  store.history.wellbeing = store.history.wellbeing.slice(-HISTORY_LIMIT);
  persist(store);
  return true;
}

export function recordWellbeingFeedback(practiceId, context, helpful) {
  const store = loadPersonalization();
  const index = WELLBEING_PRACTICE_IDS.indexOf(practiceId);
  if (!store.enabled || index < 0) return false;
  const vector = wellbeingContextVector(context);
  const current = predictNetwork(store.models.wellbeing, vector).probabilities;
  const target = helpful ? WELLBEING_PRACTICE_IDS.map((_, i) => i === index ? 1 : 0.015) : [...current];
  if (!helpful) {
    const removed = target[index];
    target[index] = 0.002;
    const share = removed / Math.max(1, target.length - 1);
    for (let i = 0; i < target.length; i += 1) if (i !== index) target[i] += share;
  }
  trainNetwork(store.models.wellbeing, vector, target, { epochs: 5, rate: 0.045 });
  store.stats.wellbeingFeedback += 1;
  store.history.wellbeing.push({ type: 'feedback', id: practiceId, helpful: Boolean(helpful), day: new Date().toISOString().slice(0, 10) });
  store.history.wellbeing = store.history.wellbeing.slice(-HISTORY_LIMIT);
  persist(store);
  return true;
}
