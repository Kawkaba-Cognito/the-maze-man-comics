import React, { useMemo } from 'react';

/*
 * A spaced-review nudge for Kawnera reading, on Home.
 *
 * Replaces LearningUniverse's full-bleed "sky" — that component lays chapters
 * out on rings sized for a full-screen canvas (R_MIN/R_MAX as % of a large
 * container) and was built for the universe hero, not a dashboard card;
 * squeezing it down would fight its own layout math for no reason. The
 * underlying data is unchanged: `bodies` (from useLearnedBodies, computed by
 * HomeScreen and passed in) already carries warmth per chapter via
 * learningStore's spaced-repetition half-life model. This just surfaces the
 * single most useful fact from it — the coldest chapter, i.e. what you are
 * closest to forgetting — instead of an illustration of all of them.
 *
 * Renders nothing when there is nothing learned yet, or nothing due for
 * review (every chapter still warm) — same "no empty-state filler" rule as
 * ProgressCard and DomainSnapshot.
 */

const UI = {
  en: {
    title: 'Worth revisiting',
    sub: (book) => `From ${book}`,
    cta: 'Review',
  },
  ar: {
    title: 'يستحق المراجعة',
    sub: (book) => `من ${book}`,
    cta: 'راجع',
  },
};

export default function ReadingCard({ bodies, isAr, playSfx, onOpen }) {
  const t = isAr ? UI.ar : UI.en;

  const coldest = useMemo(() => {
    if (!bodies?.length) return null;
    const due = bodies.filter((b) => b.warmth < 0.5);
    if (!due.length) return null;
    return due.reduce((a, b) => (b.warmth < a.warmth ? b : a));
  }, [bodies]);

  if (!coldest) return null;

  return (
    <button
      type="button"
      className="rc"
      onClick={() => { playSfx?.('click'); onOpen?.(coldest.bookId, coldest.chapterIndex); }}
    >
      <span className="rc-glyph" aria-hidden="true" style={{ color: coldest.color }}>◐</span>
      <span className="rc-text">
        <span className="rc-title">{t.title}</span>
        <span className="rc-sub">{coldest.title} · {t.sub(coldest.bookTitle)}</span>
      </span>
      <span className="rc-cta">{t.cta}</span>
    </button>
  );
}
