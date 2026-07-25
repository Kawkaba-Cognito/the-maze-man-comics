import React from 'react';
import { L } from '../schema';

/*
 * "Present evidence" — everything the player currently holds, clues and
 * unlocked testimony alike, offered as one flat choice. Testimony being
 * presentable is the whole point of the chained cases.
 */
export default function EvidencePicker({
  caseData, isAr, t, found, testimony, onPick, onCancel,
}) {
  const items = [
    ...found.map((id) => ({ id, kind: 'clue', d: caseData.clues[id] })),
    ...testimony.map((id) => ({ id, kind: 'testimony', d: caseData.testimony[id] })),
  ];

  return (
    <div className="nr-modal" role="dialog" aria-modal="true">
      <div className="nr-modal-inner">
        <div className="nr-pick">
          <h3>{t.presentEv}</h3>
          <p className="nr-mono" style={{ color: 'var(--nr-dim)', marginTop: 6 }}>{t.chooseBreak}</p>
          <div className="nr-pick-grid">
            {items.map((it) => (
              <button
                type="button"
                key={it.id}
                className="nr-pick-card"
                onClick={() => onPick(it.id)}
              >
                <span className="nr-pick-e" aria-hidden="true">{it.kind === 'clue' ? it.d.e : '🗣'}</span>
                <b>{L(it.d.name, isAr)}</b>
                <span>{L(it.d.desc, isAr)}</span>
              </button>
            ))}
          </div>
          <button type="button" className="nr-btn" onClick={onCancel}>{t.neverMind}</button>
        </div>
      </div>
    </div>
  );
}
