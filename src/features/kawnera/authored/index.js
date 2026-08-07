/*
 * Authored chapter content, by book id — currently EMPTY.
 *
 * One book (mindreading, 7 chapters) used to be authored here, rewritten from a
 * Cambridge Element, and the other eight rendered from `chapter-content.json`,
 * which held text extracted from the source PDFs. All of it was removed on
 * 2026-08-07: none of that material was ours to publish. The registry itself
 * stays, because the SHAPE is ours — see schema.js, and ChapterQuest /
 * ChapterGames / KawkabLab, which are the engine that reads it.
 *
 * To bring a book back, author its chapters against schema.js, import the file
 * and add one line to AUTHORED below. Everything downstream already works:
 * `npm run validate:kawnera` checks that each authored chapter is complete and
 * that its count matches the volume's `chapterCount` in books.js.
 */

/** bookId → array of authored chapters. Empty until real lessons are written. */
export const AUTHORED = {};

/** Authored chapters for a book, or null when it has not been written yet. */
export const authoredFor = (bookId) => AUTHORED[bookId] || null;

/** One authored chapter, or null. */
export function authoredChapter(bookId, index) {
  const book = AUTHORED[bookId];
  return book ? (book[index] || null) : null;
}
