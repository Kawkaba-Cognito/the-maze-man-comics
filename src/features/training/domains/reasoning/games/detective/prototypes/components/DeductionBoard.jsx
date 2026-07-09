import React from 'react';
import { L } from '../../caseUtils';

export default function DeductionBoard({
  suspects, clearedIds, onToggleClear, clues, clueById, isAr, labels,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#6a5a42', lineHeight: 1.45 }}>{labels.boardIntro}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {suspects.map((s) => {
          const cleared = clearedIds.has(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onToggleClear(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                borderRadius: 12, border: `2px solid ${cleared ? '#9ecfb2' : '#d9c294'}`,
                background: cleared ? '#eef8f0' : '#fffdf8', cursor: 'pointer', textAlign: 'start',
                opacity: cleared ? 0.75 : 1, color: '#2d2210', font: 'inherit',
              }}
            >
              <span style={{ fontSize: 24 }}>{s.e}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  display: 'block', fontWeight: 900, fontSize: 14,
                  textDecoration: cleared ? 'line-through' : 'none',
                }}>{L(s.name, isAr)}</span>
                <span style={{ fontWeight: 700, fontSize: 11, color: '#7a6a52' }}>
                  {cleared ? labels.cleared : labels.stillPossible}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {clues.length > 0 && (
        <>
          <div style={{ fontWeight: 900, fontSize: 11, color: '#a35a48', textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {labels.evidenceOnBoard}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {clues.map((id) => {
              const cl = clueById[id];
              if (!cl) return null;
              return (
                <span key={id} style={{
                  padding: '6px 10px', borderRadius: 999, border: '1.5px solid #e3c489',
                  background: '#fff1d8', fontWeight: 800, fontSize: 12, color: '#5a4a32',
                }}>
                  {cl.e} {L(cl.name, isAr)}
                </span>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
