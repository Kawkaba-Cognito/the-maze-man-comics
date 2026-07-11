import React from 'react';

/*
 * Shared chrome for the Learn "try it yourself" experiments — kept visually
 * in the same family as LearnArticle's `tldr`/`callout` blocks (rounded,
 * accent-bordered) so an experiment reads as part of the article, not a
 * bolted-on widget.
 */

export function ExpCard({ isAr, chrome, eyebrow, children }) {
  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        margin: '4px 0 22px', padding: '18px 18px 20px', borderRadius: 18,
        background: chrome.dark ? 'rgba(232,172,78,0.08)' : 'rgba(232,172,78,0.09)',
        border: `1.5px solid ${chrome.accent}55`,
      }}
    >
      <div style={{
        fontSize: 11, letterSpacing: 1.5, fontWeight: 800, textTransform: 'uppercase',
        color: chrome.accent, marginBottom: 12,
      }}>
        🧪 {eyebrow || (isAr ? 'جرّبها بنفسك' : 'Try it yourself')}
      </div>
      {children}
    </div>
  );
}

export function ExpButton({ onClick, variant = 'primary', children, style }) {
  const base = {
    padding: '12px 22px', borderRadius: 12, cursor: 'pointer',
    fontFamily: "'Outfit', system-ui, sans-serif", fontWeight: 800, fontSize: 14.5,
  };
  const variants = {
    primary: { border: 'none', background: 'linear-gradient(180deg, #f5c44a, #e8a830)', color: '#1a1208' },
    ghost: { border: '2px solid rgba(232,172,78,0.4)', background: 'rgba(255,255,255,0.05)', color: 'inherit' },
  };
  return (
    <button type="button" onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

export function ExpResult({ chrome, children }) {
  return (
    <div style={{
      marginTop: 14, padding: '13px 15px', borderRadius: 12,
      borderInlineStart: `4px solid ${chrome.accent}`,
      background: chrome.dark ? 'rgba(232,172,78,0.14)' : 'rgba(232,172,78,0.16)',
      fontSize: 14, lineHeight: 1.6, color: chrome.text,
    }}>
      {children}
    </div>
  );
}

export function expStimStyle(chrome) {
  return {
    width: '100%', minHeight: 96, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: chrome.dark ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.55)',
    border: chrome.dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(170,140,80,0.18)',
    fontFamily: "'Fredoka One', 'Nunito', sans-serif", fontWeight: 800, margin: '10px 0 14px',
  };
}
