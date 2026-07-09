import React, { useState } from 'react';
import { PanelStage, ANIM_CSS } from '../../domains/memory/games/story-grid/index.jsx';
import { L } from '../../domains/reasoning/games/detective/caseUtils';

export default function OpeningSequence({ panels, isAr, onDone, onSkip, labels }) {
  const [idx, setIdx] = useState(0);
  const panel = panels[idx];
  const isLast = idx >= panels.length - 1;
  const say = panel?.say ? L(panel.say, isAr) : null;
  const narr = panel?.narr ? L(panel.narr, isAr) : null;

  const advance = () => {
    if (isLast) onDone?.();
    else setIdx((i) => i + 1);
  };

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '12px 16px calc(16px + env(safe-area-inset-bottom))', gap: 12, overflowY: 'auto',
    }}>
      <style>{ANIM_CSS}</style>
      <div style={{ fontWeight: 800, fontSize: 12, color: '#a35a48', textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {labels.panelOf(idx + 1, panels.length)}
      </div>
      {panel && (
        <PanelStage panel={panel} size={280} say={say} />
      )}
      {narr && (
        <p style={{ margin: 0, maxWidth: 360, fontWeight: 700, fontSize: 15, lineHeight: 1.55, color: '#3a2c18', textAlign: 'center' }}>
          {narr}
        </p>
      )}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
        <button type="button" onClick={advance} style={btnPri}>{isLast ? labels.start : labels.next}</button>
        <button type="button" onClick={onSkip} style={btnGhost}>{labels.skip}</button>
      </div>
    </div>
  );
}

const btnPri = {
  padding: '12px 24px', borderRadius: 14, border: '2px solid #1a1208',
  background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer',
};
const btnGhost = {
  padding: '12px 18px', borderRadius: 14, border: '2px solid #cdbfa6',
  background: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', color: '#4a3c28',
};
