import React from 'react';
import { L } from '../../caseUtils';

export default function ProofChainPreview({ suspect, proofIds, clueById, isAr, labels }) {
  if (!suspect) return null;
  return (
    <div style={{
      width: '100%', background: '#fbf3e4', border: '2px dashed #b9842f', borderRadius: 14,
      padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ fontWeight: 900, fontSize: 12, color: '#7a5a1e', textTransform: 'uppercase' }}>{labels.proofChain}</div>
      <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: '#2d2210' }}>
        {labels.accuseChain(L(suspect.name, isAr))}
      </p>
      <ul style={{ margin: 0, paddingInlineStart: 20, fontWeight: 700, fontSize: 13, color: '#3a2c18', lineHeight: 1.5 }}>
        {proofIds.map((id) => {
          const cl = clueById[id];
          if (!cl) return null;
          return <li key={id}>{cl.e} {L(cl.name, isAr)}</li>;
        })}
      </ul>
    </div>
  );
}
