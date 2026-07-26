import React from 'react';
import { L } from '../schema';

/*
 * Retrieval, part one: put the episode back in sequence.
 *
 * Tap-to-append rather than drag-and-drop — dragging is miserable on a phone
 * and turns a memory test into a motor test. Tapping a card in the pool sends
 * it to the next open slot; tapping a placed card returns it to the pool.
 *
 * Cards show the beat's short `label`, never its narration: the task is order,
 * and a wall of prose would let the player re-read the story instead of
 * remembering it.
 */
export default function OrderBoard({
  story, isAr, t, placed, onPlace, onUnplace, onConfirm, playSfx,
}) {
  const pool = story.beats.filter((b) => !placed.includes(b.id));
  const complete = placed.length === story.beats.length;
  const beatOf = (id) => story.beats.find((b) => b.id === id);

  return (
    <div className="sgs-order">
      <h2>{t.orderTitle}</h2>
      <p className="sgs-sub">{t.orderSub}</p>

      <ol className="sgs-slots">
        {story.beats.map((_, i) => {
          const id = placed[i];
          const beat = id ? beatOf(id) : null;
          return (
            <li key={i} className={`sgs-slot${beat ? ' filled' : ''}`}>
              <span className="sgs-slot-n">{i + 1}</span>
              {beat ? (
                <button
                  type="button"
                  className="sgs-card sgs-card--placed"
                  onClick={() => { playSfx?.('click'); onUnplace(beat.id); }}
                >
                  {L(beat.label, isAr)}
                </button>
              ) : (
                <span className="sgs-slot-empty">{t.slotEmpty}</span>
              )}
            </li>
          );
        })}
      </ol>

      {pool.length > 0 && (
        <div className="sgs-pool">
          {pool.map((b) => (
            <button
              type="button"
              key={b.id}
              className="sgs-card"
              onClick={() => { playSfx?.('click'); onPlace(b.id); }}
            >
              {L(b.label, isAr)}
            </button>
          ))}
        </div>
      )}

      <div className="sgs-bar">
        <button
          type="button"
          className="sgs-btn sgs-btn--go"
          disabled={!complete}
          onClick={() => { playSfx?.('click'); onConfirm(); }}
        >
          {t.orderConfirm}
        </button>
      </div>
    </div>
  );
}
