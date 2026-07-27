import React, { useMemo, useState } from 'react';
import {
  daysUntilCool, loadLearned, warmthColor, warmthOf,
} from './learningStore';

/*
 * The bodies in Your Universe: one per chapter you have worked through.
 *
 * Layout follows the same hybrid model UniversePlanets used — DOM hit areas
 * carry position and interaction, ZenUniverse mirrors them as particle spheres.
 * Keeping the touch target in the DOM is what made the original reliable on a
 * phone, and re-deriving it in 3D would trade that for nothing.
 *
 * A book is a system: its chapters sit on one ring, at an angle set by the
 * book so a book always lands in the same part of the sky. You come to
 * recognise where Mindreading lives, which is most of what makes a sky feel
 * like YOUR sky rather than a chart.
 */

// Rings are kept clear of the centre planet and the screen edge.
const R_MIN = 22;
const R_MAX = 41;

/** Stable angle per book id, so a book keeps its place between sessions. */
function bookAngle(bookId) {
  let h = 0;
  for (let i = 0; i < bookId.length; i += 1) h = (h * 31 + bookId.charCodeAt(i)) >>> 0;
  return (h % 360) * (Math.PI / 180);
}

/**
 * @param books  [{ id, title, code, chapters: [title] }] — the Kawnera shelf
 * @param onOpen (bookId, chapterIndex) => void
 */
export function useLearnedBodies(books, tick = 0) {
  return useMemo(() => {
    const learned = loadLearned();
    const now = Date.now();
    const out = [];

    for (const book of books) {
      const mine = Object.entries(learned)
        .map(([id, entry]) => ({ id, entry }))
        .filter((x) => x.id.startsWith(`${book.id}-`));
      if (!mine.length) continue;

      const base = bookAngle(book.id);
      mine.forEach(({ id, entry }, i) => {
        const ci = Number(id.slice(book.id.length + 1));
        // Spread a book's chapters along a short arc rather than a full circle,
        // so the book reads as one cluster instead of a scattering.
        const a = base + (i - (mine.length - 1) / 2) * 0.42;
        const r = R_MIN + ((ci * 7) % (R_MAX - R_MIN));
        const w = warmthOf(entry, now);
        out.push({
          id,
          bookId: book.id,
          chapterIndex: ci,
          title: book.chapters[ci] || `Chapter ${ci + 1}`,
          bookTitle: book.title,
          warmth: w,
          color: warmthColor(w),
          coolIn: daysUntilCool(entry, 0.4, now),
          reviews: entry.reviews || 0,
          x: 50 + Math.cos(a) * r,
          y: 50 + Math.sin(a) * r * 0.72, // squashed: the sky is wider than tall
        });
      });
    }
    return out;
    // `tick` is intentionally a dependency with no use in the body: it is the
    // caller's handle for forcing a recompute after a chapter is finished,
    // because the source of truth is localStorage and nothing else would tell
    // React that it changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books, tick]);
}

export default function LearningUniverse({ bodies, onOpen }) {
  const [picked, setPicked] = useState(null);
  const body = bodies.find((b) => b.id === picked) || null;

  if (!bodies.length) {
    return (
      <div className="lu-empty">
        <p>Your sky is empty.</p>
        <small>Finish a chapter below and it becomes a star here.</small>
      </div>
    );
  }

  return (
    <>
      {/* Hit areas only — the visible body is drawn by ZenUniverse at the same
          percentage position. */}
      {bodies.map((b) => (
        <button
          key={b.id}
          type="button"
          className="lu-hit"
          style={{ left: `${b.x}%`, top: `${b.y}%` }}
          onClick={() => setPicked(b.id)}
          aria-label={`${b.title} — ${Math.round(b.warmth * 100)}% warm`}
        />
      ))}

      {body && (
        <div className="lu-card" role="dialog" aria-label={body.title}>
          <button type="button" className="lu-close" onClick={() => setPicked(null)}>
            ✕
          </button>
          <small>{body.bookTitle}</small>
          <h3>{body.title}</h3>

          <div className="lu-warm">
            <span className="lu-warmTrack">
              <i style={{ width: `${body.warmth * 100}%`, background: body.color }} />
            </span>
            <b>{Math.round(body.warmth * 100)}%</b>
          </div>

          <p className="lu-state">
            {body.warmth > 0.7
              ? 'Fresh. Nothing to do here yet.'
              : body.coolIn > 0
                ? `Still warm — cooling in about ${body.coolIn} ${body.coolIn === 1 ? 'day' : 'days'}.`
                : 'This one has gone cold. Going back now is worth more than reading something new.'}
            {body.reviews > 0 && ` You have been back ${body.reviews}×, so it fades slower each time.`}
          </p>

          <button
            type="button"
            className="lu-go"
            onClick={() => { setPicked(null); onOpen?.(body.bookId, body.chapterIndex); }}
          >
            {body.warmth > 0.7 ? 'Open it again' : 'Relight it →'}
          </button>
        </div>
      )}
    </>
  );
}
