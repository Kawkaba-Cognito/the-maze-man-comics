import {
  WELLBEING_PRACTICE_IDS,
  loadPersonalization,
  personalizationStatus,
  predictWellbeingPreferences,
  recordWellbeingChoice,
  sanitizeWellbeingContext,
} from './neuralPersonalization.js';

const NEED_SCORE = {
  calm: { breathe: 1, grounding: 0.95, mbsr: 0.72, pmr: 0.68 },
  sleep: { 'sleep-sounds': 1, pmr: 0.92, breathe: 0.76, mbsr: 0.48 },
  meaning: { ikigai: 1, mbsr: 0.62, 'personality-quiz': 0.5 },
  connection: { 'relationship-quiz': 1, grounding: 0.48, mbsr: 0.42 },
  self: { 'personality-quiz': 1, ikigai: 0.88, 'relationship-quiz': 0.56 },
};

const TIME_SCORE = {
  quick: { breathe: 1, grounding: 0.96, 'sleep-sounds': 0.9, 'personality-quiz': 0.45, 'relationship-quiz': 0.4 },
  medium: { pmr: 1, breathe: 0.85, grounding: 0.78, 'personality-quiz': 0.7, 'relationship-quiz': 0.68, 'sleep-sounds': 0.62 },
  deep: { mbsr: 1, ikigai: 0.9, pmr: 0.78, 'personality-quiz': 0.7, 'relationship-quiz': 0.68 },
};

const REASONS = {
  calm: 'A gentle option for settling in the moment',
  sleep: 'Fits a slower wind-down',
  meaning: 'Supports reflection and purpose',
  connection: 'Supports relationship reflection',
  self: 'Supports guided self-understanding',
};

export function getWellbeingRecommendation(rawContext) {
  const context = sanitizeWellbeingContext(rawContext);
  const neural = predictWellbeingPreferences(context);
  const ranked = WELLBEING_PRACTICE_IDS.map((id, index) => {
    const need = NEED_SCORE[context.need]?.[id] ?? 0.12;
    const time = TIME_SCORE[context.time]?.[id] ?? 0.18;
    const guide = need * 0.72 + time * 0.28;
    return { id, score: guide * 0.8 + (neural?.[index] ?? (1 / WELLBEING_PRACTICE_IDS.length)) * 0.2 };
  }).sort((a, b) => b.score - a.score);
  const store = loadPersonalization();
  return {
    id: ranked[0].id,
    reason: neural ? `${REASONS[context.need]} and your recent choices` : REASONS[context.need],
    status: personalizationStatus(store),
    examples: store.stats.wellbeingChoices + store.stats.wellbeingFeedback,
  };
}

export function recordWellbeingSelection(practiceId, context) {
  return recordWellbeingChoice(practiceId, sanitizeWellbeingContext(context));
}

