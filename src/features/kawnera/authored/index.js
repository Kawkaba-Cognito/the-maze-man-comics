/*
 * Authored chapter content, by book id.
 *
 * A book appears here only once its chapters have actually been written from
 * the source (see schema.js for why extracted text could not do this job).
 * Books not listed still render from `chapter-content.json`, and the UI labels
 * them honestly as source extracts rather than dressing them up as a lesson.
 *
 * Status — 2026-07-27
 *   mindreading  7/7   authored from the Cambridge Element, read end to end
 *   the other 8 books  154 chapters still on extracted text
 *
 * Adding a book is one import and one line in AUTHORED below. `npm run
 * validate:kawnera` checks that every authored chapter is complete and that its
 * chapter count matches the book's chapter list in KawneraExperience.
 */
import mindreading from './mindreading';
import mindreadingQuiz from './mindreading.quiz';
import mindreadingMentor from './mindreading.mentor';
import mindreadingFigures from './mindreading.figures';

/*
 * Explaining a chapter and testing it are separate jobs, so they live in
 * separate files and are stitched together here by chapter index. `*.quiz.js`
 * carries the `predict` hook and the `checks` — the parts that make a chapter
 * learnable rather than merely readable.
 */
const merge = (chapters, quiz, mentor, figures) =>
  chapters.map((c, i) => ({
    ...c,
    ...(quiz[i] || {}),
    mentor: mentor?.[i] || null,
    figures: figures?.[i] || {},
  }));

export const AUTHORED = {
  mindreading: merge(mindreading, mindreadingQuiz, mindreadingMentor, mindreadingFigures),
};

/** Authored chapters for a book, or null when it has not been written yet. */
export const authoredFor = (bookId) => AUTHORED[bookId] || null;

/** One authored chapter, or null. */
export function authoredChapter(bookId, index) {
  const book = AUTHORED[bookId];
  return book ? (book[index] || null) : null;
}
