import React, { useState } from 'react';
import { GAME_SCIENCE } from './gameScience';

/**
 * Shared "the science" link shown under the three modes on every game hub.
 * Press it to open a panel explaining what the game trains, why it matters for
 * the brain, and which classic paradigm it comes from. Content lives in
 * gameScience.js keyed by the game's gameKey.
 *
 * Renders nothing if there is no content for the given gameId, so it is always
 * safe to drop into a hub.
 */
export default function HubScienceLink({ gameId, isAr, playSfx }) {
  const [open, setOpen] = useState(false);
  const entry = GAME_SCIENCE[gameId];
  if (!entry) return null;
  const c = isAr ? entry.ar : entry.en;
  const linkLabel = isAr ? 'العلم وراء اللعبة' : 'The science';
  const closeLabel = isAr ? 'فهمت' : 'Got it';

  return (
    <>
      <button
        type="button"
        className="ct-fq-sci-link ct-fq-sci-link--chip"
        onClick={() => { playSfx?.('click'); setOpen(true); }}
      >
        {`ⓘ ${linkLabel}`}
      </button>
      {open && (
        <div
          className="ct-ms-sci-ov"
          role="dialog"
          aria-modal="true"
          dir={isAr ? 'rtl' : 'ltr'}
          onClick={() => { playSfx?.('click'); setOpen(false); }}
        >
          <div className="ct-ms-sci" onClick={(e) => e.stopPropagation()}>
            <h2 className="ct-ms-sci-title">{c.title}</h2>
            <p className="ct-ms-sci-intro">{c.intro}</p>
            <div className="ct-ms-sci-list">
              {c.sections.map((s) => (
                <div key={s.h} className="ct-ms-sci-item">
                  <div className="ct-ms-sci-h">{s.h}</div>
                  <div className="ct-ms-sci-b">{s.b}</div>
                </div>
              ))}
            </div>
            {c.foot ? <p className="ct-ms-sci-foot">{c.foot}</p> : null}
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-pri"
              onClick={() => { playSfx?.('click'); setOpen(false); }}
            >
              {closeLabel}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
