import React from 'react';

/**
 * Pass-the-phone interstitial — “Pass to {name}”.
 */
export default function GroupHandoff({
  isAr,
  name,
  kicker,
  emoji,
  body,
  sub,
  cta,
  onReady,
  playSfx,
}) {
  return (
    <>
      <div className="gc-handoff-kicker">
        {kicker || (isAr ? 'مرّر الهاتف إلى' : 'Pass the phone to')}
      </div>
      <div className="gc-handoff-name">{name}</div>
      <div className="gc-handoff-card">
        {emoji ? <div style={{ fontSize: '2.6rem', lineHeight: 1 }}>{emoji}</div> : null}
        {body ? <div style={{ fontSize: '1rem', fontWeight: 700, color: '#6a5a40', lineHeight: 1.5 }}>{body}</div> : null}
        {sub ? <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--gc-accent)' }}>{sub}</div> : null}
      </div>
      <button
        type="button"
        className="gc-btn"
        onClick={() => { playSfx?.('click'); onReady?.(); }}
      >
        {cta || (isAr ? 'جاهز ›' : 'Ready ›')}
      </button>
    </>
  );
}
