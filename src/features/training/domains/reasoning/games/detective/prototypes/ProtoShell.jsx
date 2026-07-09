import React, { useState } from 'react';
import { PILOT_CASES } from './pilotCases';
import ProtoEngine from './ProtoEngine';
import { CASE_FILE_CONFIG } from './caseFileConfig';
import { PT } from './protoUtils';

export default function ProtoShell({ variant, isAr, playSfx, onBack }) {
  const [caseIdx, setCaseIdx] = useState(0);
  const [phase, setPhase] = useState('play');
  const cfg = CASE_FILE_CONFIG[variant];
  const t = isAr ? PT.ar : PT.en;
  const caseData = PILOT_CASES[caseIdx];

  const handleCaseDone = () => {
    if (caseIdx + 1 >= PILOT_CASES.length) {
      setPhase('alldone');
    } else {
      setPhase('feedback');
    }
  };

  const advanceCase = () => {
    setCaseIdx((i) => i + 1);
    setPhase('play');
  };

  if (phase === 'alldone') {
    return (
      <div style={shellRoot} dir={isAr ? 'rtl' : 'ltr'}>
        <div style={bannerStyle}>{t.protoBanner}</div>
        <div style={centerWrap}>
          <div style={{ fontSize: 48 }}>🕵️</div>
          <h2 style={{ margin: '8px 0', fontWeight: 900, fontSize: 22, color: '#2d2210' }}>{t.allDone}</h2>
          <p style={{ margin: 0, fontWeight: 700, color: '#5a4a32', textAlign: 'center', lineHeight: 1.5 }}>{t.allDoneSub}</p>
          <p style={{ margin: '12px 0 0', fontWeight: 800, fontSize: 14, color: '#7a5a1e' }}>{cfg.label[isAr ? 'ar' : 'en']}</p>
          <button type="button" style={btnPri} onClick={() => { playSfx?.('click'); onBack?.(); }}>{t.backToProtos}</button>
        </div>
      </div>
    );
  }

  if (phase === 'feedback') {
    return (
      <div style={shellRoot} dir={isAr ? 'rtl' : 'ltr'}>
        <div style={bannerStyle}>{t.protoBanner}</div>
        <div style={centerWrap}>
          <h2 style={{ margin: '0 0 8px', fontWeight: 900, fontSize: 20, color: '#2d2210' }}>{t.feedbackTitle}</h2>
          <p style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 14, color: '#6a5a42' }}>{L(caseData.title, isAr)}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
            {t.feedbackTags.map((tag) => (
              <span key={tag} style={tagChip}>{tag}</span>
            ))}
          </div>
          <button type="button" style={btnPri} onClick={() => { playSfx?.('click'); advanceCase(); }}>{t.nextCase}</button>
          <button type="button" style={btnGhost} onClick={() => { playSfx?.('click'); advanceCase(); }}>{t.feedbackSkip}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={bannerStyle}>{t.protoBanner} · {cfg.label[isAr ? 'ar' : 'en']}</div>
      <ProtoEngine
        key={`${variant}-${caseIdx}`}
        variant={variant}
        caseData={caseData}
        caseIndex={caseIdx}
        caseTotal={PILOT_CASES.length}
        isAr={isAr}
        playSfx={playSfx}
        onCaseDone={handleCaseDone}
        onExit={onBack}
      />
    </div>
  );
}

function L(o, isAr) { return o ? (isAr ? o.ar : o.en) : ''; }

const shellRoot = {
  position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column',
  background: 'var(--color-training-palette-surface, #fff7f2)', fontFamily: "'Outfit', system-ui, sans-serif",
};
const bannerStyle = {
  flexShrink: 0, padding: '6px 12px', background: '#fdeecb', borderBottom: '2px solid #b9842f',
  fontWeight: 900, fontSize: 11, color: '#7a5a1e', textAlign: 'center', letterSpacing: 0.3,
};
const centerWrap = {
  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  padding: 24, gap: 8, textAlign: 'center',
};
const btnPri = {
  marginTop: 12, padding: '12px 24px', borderRadius: 14, border: '2px solid #1a1208',
  background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer',
};
const btnGhost = {
  padding: '10px 18px', borderRadius: 12, border: '2px solid #cdbfa6', background: '#fff',
  fontWeight: 800, fontSize: 14, cursor: 'pointer', color: '#4a3c28',
};
const tagChip = {
  padding: '6px 12px', borderRadius: 999, border: '1.5px solid #e3c489', background: '#fff1d8',
  fontWeight: 800, fontSize: 12, color: '#7a5a1e',
};
