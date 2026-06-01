/**
 * Shared juice utilities for the training games.
 * Reaction-time rating thresholds, relative to each trial's deadline.
 */
export function rtRating(rtMs, limitMs) {
  if (rtMs == null || !limitMs) return { key: 'good', bonus: 0 };
  const r = rtMs / limitMs;
  if (r <= 0.33) return { key: 'perfect', bonus: 8 };
  if (r <= 0.6) return { key: 'fast', bonus: 4 };
  return { key: 'good', bonus: 0 };
}

export const RATING_LABELS = {
  en: { perfect: 'PERFECT!', fast: 'FAST!', good: '' },
  ar: { perfect: 'ممتاز!', fast: 'سريع!', good: '' },
};

export function ratingLabels(isAr) {
  return isAr ? RATING_LABELS.ar : RATING_LABELS.en;
}
