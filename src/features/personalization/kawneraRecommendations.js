import { AUTHORED } from '../kawnera/authored/index.js';
import { KAWNERA_BOOKS } from '../kawnera/books.js';
import {
  KAWNERA_BOOK_IDS,
  KAWNERA_TIMES,
  loadPersonalization,
  personalizationEnabled,
  predictNetwork,
} from './neuralPersonalization.js';

/*
 * Kawnera (Learn) recommendations — BUILT BUT DORMANT.
 *
 * The library has no content. `authored/index.js` exports `AUTHORED = {}`
 * because every chapter was removed on 2026-08-07 (the source material was not
 * ours to publish), leaving nine placeholder volumes titled "Volume 1"…
 * "Volume 9" with chapters named "Chapter 01".
 *
 * So this module deliberately recommends NOTHING until chapters exist. The
 * alternative — letting the model train on placeholder titles — would learn
 * preferences over books with no text behind them, and those weights would
 * persist into the real library once it is authored. A recommender that is
 * confidently wrong about content that does not exist is worse than one that
 * politely says "not yet".
 *
 * ⚠️ The gate reads the REAL state (`AUTHORED`), not a hand-set boolean. When
 * the first book is authored and added to that map, this activates on its own —
 * nobody has to remember to flip a flag, which is exactly the kind of thing
 * everybody forgets. `npm run validate:personalization` asserts both the
 * dormancy and the id agreement below.
 */

/** True once at least one Kawnera book has authored chapters. The trigger. */
export function kawneraReady() {
  return Object.values(AUTHORED).some((chapters) => Array.isArray(chapters) && chapters.length > 0);
}

/** Volume ids that actually have text, in books.js order. */
export function authoredBookIds() {
  return KAWNERA_BOOKS
    .filter((book) => Array.isArray(AUTHORED[book.id]) && AUTHORED[book.id].length > 0)
    .map((book) => book.id);
}

/**
 * The model's spec is keyed by position in KAWNERA_BOOK_IDS, so that list and
 * books.js must not drift apart. Exported so the validator can assert it rather
 * than trusting a comment — this repo has been bitten repeatedly by a comment
 * that was right and code that had moved on.
 */
export function bookIdsAgree() {
  const fromBooks = KAWNERA_BOOKS.map((b) => b.id);
  return fromBooks.length === KAWNERA_BOOK_IDS.length
    && fromBooks.every((id, i) => id === KAWNERA_BOOK_IDS[i]);
}

function kawneraFeatureVector(store, sessionTime = 'medium') {
  const opens = new Array(KAWNERA_BOOK_IDS.length).fill(0);
  const done = new Array(KAWNERA_BOOK_IDS.length).fill(0);
  for (const entry of store.history.kawnera || []) {
    const i = KAWNERA_BOOK_IDS.indexOf(entry.bookId);
    if (i < 0) continue;
    opens[i] = Math.min(1, opens[i] + 0.2);
    if (entry.completed) done[i] = Math.min(1, done[i] + 0.25);
  }
  const time = KAWNERA_TIMES.map((t) => (t === sessionTime ? 1 : 0));
  return [...opens, ...done, ...time];
}

/**
 * A suggested volume, or null.
 *
 * Returns null — never a guess — when personalization is off, when the library
 * has no authored content, or before enough examples exist to be worth showing.
 */
export function getKawneraRecommendation({ sessionTime = 'medium' } = {}) {
  if (!personalizationEnabled() || !kawneraReady()) return null;

  const store = loadPersonalization();
  // Cold start, matching the other two streams: no confident claim from nothing.
  if ((store.stats.kawneraChoices || 0) < 3) return null;

  const available = new Set(authoredBookIds());
  const { probabilities } = predictNetwork(
    store.models.kawnera,
    kawneraFeatureVector(store, sessionTime),
  );

  let best = null;
  probabilities.forEach((p, i) => {
    const id = KAWNERA_BOOK_IDS[i];
    if (!available.has(id)) return; // never suggest a volume with no text
    if (!best || p > best.confidence) best = { bookId: id, confidence: p };
  });
  if (!best) return null;

  const book = KAWNERA_BOOKS.find((b) => b.id === best.bookId) || null;
  return { ...best, title: book?.title || best.bookId };
}
