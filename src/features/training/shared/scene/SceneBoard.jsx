import React from 'react';
import { BACKGROUNDS } from '../../domains/memory/games/story-grid/index.jsx';
import { L } from '../../domains/reasoning/games/detective/caseUtils';

/**
 * Visual crime-scene board: Story Time background + tappable hotspot pins.
 */
export default function SceneBoard({ caseData, isAr, examined, onPinTap, width = '100%' }) {
  const bgId = caseData.sceneBg || 'kitchen';
  const cfg = BACKGROUNDS[bgId] || BACKGROUNDS.kitchen;
  const floorPct = cfg.floor || 26;
  const hotspots = caseData.hotspots || [];

  return (
    <div style={{
      position: 'relative', width, aspectRatio: '1.22', borderRadius: 16, overflow: 'hidden',
      background: cfg.bg, border: '2.5px solid #cdbfa6', boxShadow: '3px 3px 0 rgba(26,18,8,0.15)',
    }}>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: `${floorPct}%`,
        background: cfg.ground, boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.15)',
      }} />
      {(cfg.amb || []).map((a, i) => (
        <span key={`amb-${i}`} style={{
          position: 'absolute', lineHeight: 1, pointerEvents: 'none', fontSize: a.s.fontSize || 20,
          top: typeof a.s.top === 'number' ? a.s.top : a.s.top,
          insetInlineStart: a.s.insetInlineStart,
          insetInlineEnd: a.s.insetInlineEnd,
          bottom: a.s.bottom,
          opacity: a.s.opacity ?? 1,
        }}>{a.e}</span>
      ))}
      {hotspots.map((h) => {
        const done = examined.has(h.id);
        const x = h.pos?.x ?? 50;
        const y = h.pos?.y ?? 50;
        return (
          <button
            key={h.id}
            type="button"
            onClick={() => onPinTap(h)}
            aria-label={L(h.name, isAr)}
            style={{
              position: 'absolute', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)',
              width: 48, height: 48, borderRadius: 14, border: `2.5px solid ${done ? '#2e8b57' : '#b9842f'}`,
              background: done ? 'rgba(255,253,248,0.92)' : 'rgba(255,253,248,0.96)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 0, boxShadow: done ? '0 0 0 2px rgba(46,139,87,0.35)' : '2px 2px 0 rgba(26,18,8,0.2)',
              animation: done ? 'none' : 'dt-pin-pulse 2s ease-in-out infinite', zIndex: 2,
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{h.e}</span>
          </button>
        );
      })}
      <div style={{
        position: 'absolute', top: 8, insetInlineStart: 10, insetInlineEnd: 10,
        fontWeight: 900, fontSize: 11, color: cfg.dark ? '#eaf3ff' : '#5a4a32',
        textAlign: 'center', textShadow: cfg.dark ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
        pointerEvents: 'none',
      }}>
        📍 {L(caseData.setting, isAr)}
      </div>
    </div>
  );
}
