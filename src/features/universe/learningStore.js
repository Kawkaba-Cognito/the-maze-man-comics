import { loadJson, saveJson } from '../../lib/storage';

/*
 * Your Universe — what you have actually learned.
 *
 * Home used to be a beautiful empty void: `HomeScreen` passed `planets={[]}`
 * and the 673-line note/goal/journal feature behind it had been unreachable
 * since the Kawnera gateway landed. This replaces that content with the thing
 * the app is now about — every chapter you finish becomes a body in the sky.
 *
 * WHY THIS IS NOT DECORATION
 * --------------------------
 * The biggest hole in the chapter design is that nothing brings you back.
 * Everything happens in one sitting, and distributed practice — coming back
 * days later — is the finding that separates a good session from durable
 * learning. A review queue would fix it and nobody opens review queues.
 *
 * A sky does not need opening. A body that has cooled is visible at a glance,
 * so the schedule becomes something you SEE rather than something you are
 * nagged about. The visual IS the data, which is the difference between
 * gamification and paint.
 *
 * THE DECAY CURVE
 * ---------------
 * Warmth halves over an interval that EXPANDS with each review — 3 days, then
 * 7, 16, 35, 75. That is an expanding-interval schedule of the kind the spacing
 * literature supports, and it means a chapter you have revisited three times
 * stays lit for months while one you met once yesterday starts fading this
 * week. Nothing ever disappears: a cold planet is still your planet, it just
 * stops glowing.
 */

const KEY = 'mm_universe_learned_v1';

/** Half-life in days, by how many times you have come back to it. */
const HALF_LIVES = [3, 7, 16, 35, 75];
const DAY = 86400000;

export const halfLifeFor = (reviews) =>
  HALF_LIVES[Math.min(reviews, HALF_LIVES.length - 1)];

/** A chapter's id in the sky. */
export const bodyId = (bookId, chapterIndex) => `${bookId}-${chapterIndex}`;

export function loadLearned() {
  const v = loadJson(KEY, {});
  return v && typeof v === 'object' ? v : {};
}

export const saveLearned = (v) => saveJson(KEY, v);

/**
 * Record that a chapter was worked through. The first time creates the body;
 * later times count as reviews, which is what lengthens its half-life.
 */
export function recordLearned(bookId, chapterIndex, score = null) {
  const all = loadLearned();
  const id = bodyId(bookId, chapterIndex);
  const now = Date.now();
  const prev = all[id];
  all[id] = prev
    ? { ...prev, last: now, reviews: (prev.reviews || 0) + 1, score: score ?? prev.score }
    : { first: now, last: now, reviews: 0, score };
  saveLearned(all);
  return all[id];
}

/**
 * 1 = just learned, decaying by half every half-life. Never reaches 0 — a
 * chapter you met once is dimmer than one you know, not erased.
 */
export function warmthOf(entry, now = Date.now()) {
  if (!entry?.last) return 0;
  const days = (now - entry.last) / DAY;
  const hl = halfLifeFor(entry.reviews || 0);
  return Math.max(0.06, 2 ** (-days / hl));
}

/** Days until warmth falls under `floor` — negative once it already has. */
export function daysUntilCool(entry, floor = 0.4, now = Date.now()) {
  const hl = halfLifeFor(entry?.reviews || 0);
  const elapsed = (now - (entry?.last || now)) / DAY;
  return Math.round(hl * Math.log2(1 / floor) - elapsed);
}

/** Coldest first — what the sky is quietly asking you to come back to. */
export function dueForReview(all = loadLearned(), now = Date.now()) {
  return Object.entries(all)
    .map(([id, entry]) => ({ id, entry, warmth: warmthOf(entry, now) }))
    .filter((x) => x.warmth < 0.5)
    .sort((a, b) => a.warmth - b.warmth);
}

/*
 * Warm palette only, matching the zen-universe redesign: gold when fresh,
 * through copper, to a deep ember when cold. One hue family, light → dark —
 * a sequential ramp, because warmth is a magnitude, not an identity.
 */
const RAMP = [
  [0.00, [0x6b, 0x3a, 0x24]], // cold ember
  [0.35, [0xb0, 0x81, 0x50]], // copper
  [0.70, [0xd9, 0x6a, 0x4f]], // ember red
  [1.00, [0xff, 0xd9, 0x7a]], // fresh gold
];

export function warmthColor(w) {
  const t = Math.min(1, Math.max(0, w));
  let lo = RAMP[0];
  let hi = RAMP[RAMP.length - 1];
  for (let i = 0; i < RAMP.length - 1; i += 1) {
    if (t >= RAMP[i][0] && t <= RAMP[i + 1][0]) { lo = RAMP[i]; hi = RAMP[i + 1]; break; }
  }
  const span = hi[0] - lo[0] || 1;
  const k = (t - lo[0]) / span;
  const ch = (i) => Math.round(lo[1][i] + (hi[1][i] - lo[1][i]) * k);
  return `#${[0, 1, 2].map((i) => ch(i).toString(16).padStart(2, '0')).join('')}`;
}
