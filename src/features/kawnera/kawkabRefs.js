/*
 * "We built that earlier — want me to show you?"
 *
 * Lavelle cross-references constantly ("see Section 3.2.2"), and following
 * those references is most of what makes a book cohere rather than sit as
 * seven separate chapters. A reader who meets REGISTRATION again in chapter 4
 * and cannot remember chapter 3 has lost the argument, and will usually push on
 * anyway rather than go back.
 *
 * So Dr. Kawkab goes back for them. This finds, for a stretch of chapter text,
 * any term that was DEFINED IN AN EARLIER CHAPTER — which is exactly the set of
 * things a reader is expected to already hold and might not.
 *
 * Derived, not authored: it reads the glossaries that already exist, so it
 * costs nothing per chapter and cannot drift out of sync with the content.
 */

/** Terms are matched on the word, not the gloss — case-insensitive, whole-word. */
function mentions(text, term) {
  // Some glossary keys are compound ("Automatic vs spontaneous", "Propositional
  // / Radical challenge"). Match on the longest single word of 5+ letters,
  // which is the part that actually appears in prose.
  const key = term
    .split(/[^A-Za-z]+/)
    .filter((w) => w.length >= 5)
    .sort((a, b) => b.length - a.length)[0];
  if (!key) return false;
  return new RegExp(`\\b${key}\\b`, 'i').test(text);
}

/**
 * Cross-references for one stretch of text.
 *
 * @param sections  the sections being shown right now
 * @param chapters  the whole authored book
 * @param at        index of the chapter being read
 * @returns [{ term, meaning, from }] — `from` is the 1-based chapter it was defined in
 */
/*
 * Terms too common to be worth a detour.
 *
 * First run of this flagged "Mindreading" on 19 of 19 legs — it is the book's
 * title concept, so it appears everywhere, and Dr. Kawkab offering to explain
 * it every single time is nagging rather than helping. A term is only worth
 * going back for if it is SPECIFIC: something introduced once and used
 * occasionally, not the ambient vocabulary the reader is swimming in.
 *
 * Computed from the book rather than hand-listed, so it stays correct as
 * chapters are added.
 */
const AMBIENT_SHARE = 0.5;

function ambientTerms(chapters) {
  const bodies = chapters.map((c) =>
    c.sections.map((s) => [s.body, ...(s.points || [])].join(' ')).join(' '),
  );
  const out = new Set();
  for (const c of chapters) {
    for (const t of c.terms || []) {
      const hits = bodies.filter((b) => mentions(b, t.term)).length;
      if (hits / chapters.length > AMBIENT_SHARE) out.add(t.term);
    }
  }
  return out;
}

let ambientCache = null;
let ambientFor = null;

export function refsFor(sections, chapters, at) {
  if (!chapters || at <= 0) return [];
  if (ambientFor !== chapters) {
    ambientCache = ambientTerms(chapters);
    ambientFor = chapters;
  }
  const text = sections
    .map((s) => [s.body, ...(s.points || [])].join(' '))
    .join(' ');

  const seen = new Set();
  const out = [];
  // Earlier chapters only. A term defined later is not something the reader
  // has been given yet, so pointing at it would be a spoiler, not a reminder.
  for (let c = 0; c < at; c += 1) {
    for (const t of chapters[c].terms || []) {
      if (seen.has(t.term) || ambientCache.has(t.term)) continue;
      if (!mentions(text, t.term)) continue;
      seen.add(t.term);
      out.push({ term: t.term, meaning: t.meaning, from: c + 1, fromIndex: c });
    }
  }
  // Two at a time at most. Kawkab offering six detours is nagging, not helping.
  return out.slice(0, 2);
}

/** The section in an earlier chapter where a term was actually explained. */
export function sourceSection(chapters, fromIndex, term) {
  const ch = chapters?.[fromIndex];
  if (!ch) return null;
  return (
    ch.sections.find((s) => mentions([s.body, ...(s.points || [])].join(' '), term)) || null
  );
}
