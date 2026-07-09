import React from 'react';
import { L } from '../../caseUtils';

export default function LocationPolaroid({ loc, examined, isAr, onTap, labels }) {
  const done = examined.has(loc.id);
  return (
    <button
      type="button"
      onClick={() => onTap(loc)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%',
        padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', font: 'inherit',
      }}
    >
      <div style={{
        width: '100%', background: '#fffdf8', border: '2px solid #1a1208', padding: '10px 10px 16px',
        boxShadow: '3px 3px 0 rgba(26,18,8,0.2)', transform: done ? 'rotate(-1deg)' : 'rotate(1deg)',
        position: 'relative',
      }}>
        <div style={{
          height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#f4ecdd', marginBottom: 8, fontSize: 32,
        }}>{loc.icon}</div>
        <span style={{ fontWeight: 900, fontSize: 13, color: '#2d2210', textAlign: 'center', display: 'block' }}>
          {L(loc.name, isAr)}
        </span>
        {done && (
          <span style={{
            position: 'absolute', top: 8, insetInlineEnd: 8, transform: 'rotate(12deg)',
            border: '2px solid #2e8b57', color: '#2e8b57', fontWeight: 900, fontSize: 9,
            padding: '2px 6px', borderRadius: 4, background: 'rgba(255,253,248,0.9)',
          }}>{labels.examinedStamp}</span>
        )}
      </div>
      <span style={{ marginTop: 6, fontWeight: 800, fontSize: 11, color: '#b9842f' }}>
        {done ? labels.review : labels.examine}
      </span>
    </button>
  );
}
