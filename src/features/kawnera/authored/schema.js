/*
 * Kawnera · authored chapter content.
 *
 * WHY THIS EXISTS
 * ---------------
 * The original chapter pages were built from `chapter-content.json`, which is
 * raw text sliced out of the source PDFs and filtered by length. That produced
 * pages that looked like teaching but were not: `intro[0]` and `core[0]` were
 * frequently the SAME sentence, OCR damage survived ("The fol- lowing"), and a
 * mid-paragraph fragment about some edited collection's preface would be
 * presented to the reader under the heading "Central claims".
 *
 * Extracted prose cannot explain a chapter, because explaining requires
 * deciding what matters and saying it in words the reader already has. So the
 * fix is not a better extractor. It is authored content: written from the book,
 * citing the book, but not lifted from it.
 *
 * THE BAR
 * -------
 * Reading the chapter in the app should leave you understanding the REAL
 * chapter — not the gist of it. A first pass at this shipped ~450 words per
 * chapter covering the spine, which is a decent lesson *about* a chapter and
 * an inadequate substitute *for* it: for Lavelle's chapter 3 it covered five of
 * roughly fifteen subsections and silently dropped teleofunctional goals,
 * Maibom's argument and behaviour-reading entirely.
 *
 * So `sections` is the load-bearing field. It walks the chapter's OWN structure,
 * in the book's order, using the book's own numbering, and explains each part.
 * Everything else orients you around it.
 *
 * SHAPE
 * -----
 *   question      the one thing this chapter answers — the reason to read it
 *   summary       2–4 sentences of plain language; no jargon that is not unpacked
 *   sections      [{ n, title, body, points? }] THE CHAPTER ITSELF, in order.
 *                 `n` and `title` mirror the book so a reader can navigate
 *                 between app and page. `body` explains; `points` carries the
 *                 specifics worth pulling out (steps, findings, distinctions).
 *   terms         [{ term, meaning }] every piece of jargon the chapter uses,
 *                 defined — so no sentence depends on a word you were not given
 *   evidence      [{ study, did, found }] the studies, so claims have feet
 *   misconception { believed, actually } what most people get wrong here
 *   takeaway      the single sentence to remember
 *   recall        chapter-SPECIFIC retrieval prompts (the old ones were five
 *                 generic prompts repeated across all 161 chapters)
 *   pages         source page range, kept as an anchor back to the book
 *
 * Chapters that have not been authored yet fall back to the extracted text, and
 * the UI says so plainly rather than passing it off as a lesson.
 */

/*
 * LEARNABLE, NOT JUST READABLE
 * ----------------------------
 * A complete walkthrough still leaves the reader reading. Two further fields,
 * authored in a sibling `*.quiz.js` file and merged in index.js, are what turn
 * a chapter into something you can actually learn from without the book:
 *
 *   predict  { setup, question, options, answer, reveal }
 *            A guess committed BEFORE the chapter, then the real result. The
 *            pretesting effect: guessing first beats studying alone, most of
 *            all when the guess is wrong. Every item is a real finding from the
 *            chapter, so the reveal is a fact rather than a gotcha.
 *
 *   checks   [{ q, options: [{ t, ok?, why }] }]
 *            Comprehension questions in which every wrong answer is a genuine
 *            misconception and carries a `why`. Contrast the generated quiz
 *            this replaces, which asked "which sentence came from this
 *            chapter?" with distractors from other chapters — a recognition
 *            test that could be passed without understanding anything.
 */

/** Every field an authored chapter must carry to count as authored. */
export const AUTHORED_FIELDS = [
  'question', 'summary', 'sections', 'terms', 'evidence', 'misconception', 'takeaway', 'recall',
  'predict', 'checks',
];

/** A chapter is authored only if it is complete — half a lesson is not a lesson. */
export function isAuthored(chapter) {
  if (!chapter) return false;
  return AUTHORED_FIELDS.every((f) => {
    const v = chapter[f];
    if (Array.isArray(v)) return v.length > 0;
    if (v && typeof v === 'object') return Object.keys(v).length > 0;
    return typeof v === 'string' && v.trim().length > 0;
  });
}
