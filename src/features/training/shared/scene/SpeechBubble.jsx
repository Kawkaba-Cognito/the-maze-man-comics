import React from 'react';

/** Comic-style speech bubble (shared by Story Time + Detective prototypes). */
export default function SpeechBubble({ children, tail = 'bottom', style = {} }) {
  const tailStyle = tail === 'bottom'
    ? { bottom: -7, insetInlineStart: '50%', transform: 'translateX(-50%)', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid #1a1208' }
    : { top: -7, insetInlineStart: 24, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '8px solid #1a1208' };
  return (
    <div style={{ position: 'relative', ...style }}>
      <div style={{
        background: '#fffdf8', border: '2px solid #1a1208', borderRadius: 13,
        padding: '8px 14px', fontWeight: 700, fontSize: 14, color: '#3a2c18',
        lineHeight: 1.5, boxShadow: '2px 2px 0 rgba(26,18,8,0.18)', whiteSpace: 'pre-wrap',
      }}>
        {children}
      </div>
      <span style={{ position: 'absolute', width: 0, height: 0, ...tailStyle }} />
    </div>
  );
}
