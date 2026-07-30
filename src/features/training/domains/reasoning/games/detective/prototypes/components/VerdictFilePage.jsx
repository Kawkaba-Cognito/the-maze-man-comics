import React from 'react';
import { L } from '../../caseUtils';

export default function VerdictFilePage({
  verdict, caseData, culpritOpt, isAr, labels, onContinue, styles: S,
}) {
  const proofHighlight = verdict.proofIds || [];
  const clueById = {};
  (caseData.clues || []).forEach((cl) => { clueById[cl.id] = cl; });

  return (
    <div style={{ ...S.body, background: 'var(--surface)' }}>
      <div style={{
        width: '100%', maxWidth: 420, background: 'var(--surface-raised)', border: '2px solid var(--ink-outline)',
        boxShadow: '6px 6px 0 rgba(26,18,8,0.25)', padding: '18px 16px 20px',
        animation: verdict.win ? 'dt-slide 0.35s ease-out' : 'dt-shake 0.4s ease-out',
      }}>
        <div style={{
          borderBottom: '3px double var(--line)', paddingBottom: 10, marginBottom: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 900, fontSize: 11, color: 'var(--ink-dim)', letterSpacing: 1 }}>{labels.fileClosing}</span>
          {verdict.win && (
            <span style={{
              transform: 'rotate(-8deg)', border: '3px solid var(--success)', color: 'var(--success)',
              fontFamily: "'Outfit','Cairo',cursive", fontSize: 14, padding: '2px 10px',
            }}>{labels.caseClosed}</span>
          )}
        </div>
        <div style={{ ...S.verdictTitle, color: verdict.win ? 'var(--success)' : 'var(--danger)', marginBottom: 8 }}>
          {verdict.win ? labels.fullWin : verdict.partial ? labels.partial : labels.lost}
        </div>
        {verdict.partial && <p style={S.partialSub}>{labels.partialSub}</p>}
        <div style={S.truth}>
          <span style={S.portraitSm}>{culpritOpt.e}</span>
          <span>{verdict.win ? labels.culpritWas(L(culpritOpt.name, isAr)) : labels.itWas(L(culpritOpt.name, isAr))}</span>
        </div>
        {proofHighlight.length > 0 && (
          <div style={{ marginTop: 10, padding: '8px 10px', background: '#eef8f0', borderRadius: 10, border: '1.5px solid #9ecfb2' }}>
            <div style={{ fontWeight: 900, fontSize: 11, color: 'var(--success)', marginBottom: 4 }}>{labels.yourProof}</div>
            {proofHighlight.map((id) => {
              const cl = clueById[id];
              if (!cl) return null;
              return <div key={id} style={{ fontWeight: 700, fontSize: 13 }}>{cl.e} {L(cl.name, isAr)}</div>;
            })}
          </div>
        )}
        <div style={{ ...S.explain, marginTop: 12 }}>
          <div style={S.explainHead}>{labels.chain}</div>
          {caseData.solution.explanation.map((s, i) => (
            <div key={i} style={S.solStep}>
              <span style={S.solNum}>{i + 1}</span>
              <span style={S.solTxt}>{L(s, isAr)}</span>
            </div>
          ))}
        </div>
        {verdict.win && (
          <div style={{ ...S.epilogueCard, marginTop: 10 }}>
            <div style={S.explainHead}>{labels.epilogueHead}</div>
            <p style={S.epilogueText}>{L(caseData.solution.epilogue, isAr)}</p>
          </div>
        )}
        <button type="button" style={{ ...S.primary, marginTop: 14, alignSelf: 'center' }} onClick={onContinue}>
          {labels.nextCase}
        </button>
      </div>
    </div>
  );
}
