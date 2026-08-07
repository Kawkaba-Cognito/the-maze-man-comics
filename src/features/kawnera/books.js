import { assetUrl } from '../../lib/assetUrl';

/*
 * The Kawnera shelf — nine volumes, metadata only.
 *
 * ── Why there are no titles here ──
 *
 * This shelf used to carry nine real textbooks: title, author, page count,
 * publisher blurb and the full list of their chapter headings, with the body
 * text extracted into `chapter-content.json` and `authored/`. None of that was
 * ours to publish, so all of it is gone (2026-08-07). What remains is the part
 * we DID make: the nine cover paintings.
 *
 * Each volume is therefore a number and a picture. When real, authored lessons
 * exist they will bring their own titles with them; until then a numeral is
 * both honest and — since the shelf renders as a constellation — enough to tell
 * one world from another.
 *
 * ── Why the shape did not change ──
 *
 * Split out of KawneraExperience so Home can read the shelf WITHOUT pulling in
 * the Kawnera chunk. Home draws a body per learned chapter and reads `title`
 * and `chapters[i]` off these objects (see LearningUniverse.useLearnedBodies),
 * so both fields still exist — they are just generated now. Removing them would
 * have broken Your Universe rather than the library.
 */

/*
 * Volume ids are `v1`…`v9`, not the old book-derived slugs ('enigma',
 * 'social', 'mindreading', …) — those were titles by another name, and they
 * were also visible in localStorage.
 *
 * NOTE: progress is keyed `<bookId>-<chapterIndex>` in `atlas-book-progress`
 * and in the learned-bodies store, so anything recorded under an old slug is
 * now orphaned. It is inert rather than harmful (nothing matches the prefix, so
 * it simply never renders), and the chapters it referred to no longer exist to
 * be re-opened.
 */
const SHELF = [
  { id: 'v1', color: '#ffcf55', chapterCount: 18 },
  { id: 'v2', color: '#6fd3c7', chapterCount: 15 },
  { id: 'v3', color: '#9994ef', chapterCount: 7 },
  { id: 'v4', color: '#f08f82', chapterCount: 40 },
  { id: 'v5', color: '#a8d663', chapterCount: 11 },
  { id: 'v6', color: '#e6a15c', chapterCount: 11 },
  { id: 'v7', color: '#e7c855', chapterCount: 10 },
  { id: 'v8', color: '#71b9d0', chapterCount: 10 },
  { id: 'v9', color: '#d49ac6', chapterCount: 39 },
];

/** Arabic-Indic numerals, matching the convention used across the app's AR copy. */
const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
export const toArabicDigits = (n) =>
  String(n).replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

const pad = (n) => String(n).padStart(2, '0');

export const KAWNERA_BOOKS = SHELF.map((b, i) => {
  const no = i + 1;
  return {
    ...b,
    no,
    code: `V${no}`,
    title: `Volume ${no}`,
    titleAr: `المجلد ${toArabicDigits(no)}`,
    image: assetUrl(`Assets/kawnera/covers/volume-${pad(no)}.webp`),
    chapters: Array.from({ length: b.chapterCount }, (_, j) => `Chapter ${pad(j + 1)}`),
    chaptersAr: Array.from(
      { length: b.chapterCount },
      (_, j) => `الفصل ${toArabicDigits(j + 1)}`,
    ),
  };
});

/** Title in the reader's language — the shelf is numbered, so this is cheap. */
export const bookTitle = (book, isAr) => (isAr ? book.titleAr : book.title);

/** Chapter label in the reader's language. */
export const chapterTitle = (book, index, isAr) =>
  (isAr ? book.chaptersAr : book.chapters)[index]
    ?? `${isAr ? 'الفصل' : 'Chapter'} ${isAr ? toArabicDigits(index + 1) : pad(index + 1)}`;
