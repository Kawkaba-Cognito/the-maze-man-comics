import { RATED_GAMES, gameRating, ratingToLevel } from '../training/rating.js';
import {
  TRAINING_DOMAIN_IDS,
  personalizationStatus,
  loadPersonalization,
  predictDifficulty,
  predictTrainingPreferences,
  recordTrainingChoice,
} from './neuralPersonalization.js';

const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, Number(n) || 0));
const ACTIVE_GAME_KEYS = new Set([
  'cancel-task', 'mot', 'train-switch', 'speed-match', 'math-gates', 'intercept',
  'story-grid', 'keep-track', 'paired-associates', 'wordle', 'synonyms', 'trivia',
  'rush-hour', 'raven-matrices', 'detective', 'mirror-world', 'task-switch', 'sort-shift',
]);

function daysSince(day) {
  if (!day) return 30;
  const time = Date.parse(day);
  if (!Number.isFinite(time)) return 30;
  return Math.max(0, (Date.now() - time) / 86400000);
}

export function trainingSnapshot() {
  return TRAINING_DOMAIN_IDS.map((domainId) => {
    const keys = Object.keys(RATED_GAMES).filter((key) => (
      RATED_GAMES[key].domainId === domainId && ACTIVE_GAME_KEYS.has(RATED_GAMES[key].gameKey)
    ));
    const ratings = keys.map((key) => gameRating(key)).filter(Boolean);
    const measured = ratings.filter((rating) => rating.status !== 'provisional');
    const use = measured.length ? measured : ratings;
    const rating = use.length
      ? Math.round(use.reduce((sum, item) => sum + item.rating, 0) / use.length)
      : null;
    const runs = ratings.reduce((sum, item) => sum + (item.n || 0), 0);
    const lastPlayed = ratings.flatMap((item) => item.hist || [])
      .map((entry) => entry.d)
      .filter(Boolean)
      .sort()
      .at(-1) || null;
    return { domainId, rating, runs, lastPlayed };
  });
}

export function trainingFeatureVector(snapshot = trainingSnapshot()) {
  return snapshot.flatMap((domain) => [
    clamp((domain.rating ?? 500) / 1000),
    clamp(domain.runs / 12),
    clamp(daysSince(domain.lastPlayed) / 30),
  ]);
}

export function recordTrainingSelection(domainId) {
  return recordTrainingChoice(domainId, trainingFeatureVector());
}

export function getTrainingRecommendation() {
  const snapshot = trainingSnapshot();
  const features = trainingFeatureVector(snapshot);
  const totalRuns = snapshot.reduce((sum, domain) => sum + domain.runs, 0);
  const neural = predictTrainingPreferences(features);
  const rotation = Math.floor(Date.now() / 86400000) % TRAINING_DOMAIN_IDS.length;

  const ranked = snapshot.map((domain, index) => {
    const growthNeed = 1 - clamp((domain.rating ?? 500) / 1000);
    const staleness = clamp(daysSince(domain.lastPlayed) / 30);
    const lowExposure = 1 - clamp(domain.runs / 12);
    const balanceScore = totalRuns
      ? growthNeed * 0.44 + staleness * 0.34 + lowExposure * 0.22
      : (index === rotation ? 1 : 0.2);
    return {
      ...domain,
      score: balanceScore * 0.76 + (neural?.[index] ?? (1 / TRAINING_DOMAIN_IDS.length)) * 0.24,
      staleness,
    };
  }).sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const baseLevel = ratingToLevel(best.rating ?? 360);
  const difficulty = predictDifficulty({
    ratingBefore: best.rating,
    ratingAfter: best.rating,
    level: baseLevel,
    runCount: best.runs,
  });
  const direction = difficulty ? difficulty.indexOf(Math.max(...difficulty)) - 1 : 0;
  const suggestedLevel = Math.max(1, Math.min(5, baseLevel + direction));
  let reason = 'Balanced daily rotation';
  if (totalRuns) {
    const average = snapshot.reduce((sum, item) => sum + (item.rating ?? 500), 0) / snapshot.length;
    if (best.staleness >= 0.75) reason = 'Ready for a return visit';
    else if ((best.rating ?? 500) < average - 40) reason = 'Supports a developing skill';
    else reason = neural ? 'Balances progress with your choices' : 'Balances recent training';
  }

  return {
    domainId: best.domainId,
    suggestedLevel,
    reason,
    status: personalizationStatus(loadPersonalization()),
    examples: loadPersonalization().stats.trainingChoices + loadPersonalization().stats.trainingOutcomes,
  };
}

