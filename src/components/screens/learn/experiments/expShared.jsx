import React, { useEffect, useRef, useState } from 'react';

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

export function ExpButton({ onClick, variant = 'primary', children, style, disabled }) {
  const base = {
    padding: '12px 22px', borderRadius: 12, cursor: disabled ? 'default' : 'pointer',
    fontFamily: "'Outfit', system-ui, sans-serif", fontWeight: 800, fontSize: 14.5,
    opacity: disabled ? 0.55 : 1,
  };
  const variants = {
    primary: { border: 'none', background: 'linear-gradient(180deg, #f5c44a, #e8a830)', color: '#1a1208' },
    ghost: { border: '2px solid rgba(232,172,78,0.4)', background: 'rgba(255,255,255,0.05)', color: 'inherit' },
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
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

export function ExpSteps({ chrome, steps }) {
  if (!steps?.length) return null;
  return (
    <ol style={{
      margin: '0 0 14px', padding: 0, listStyle: 'none',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {steps.map((step, i) => (
        <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, lineHeight: 1.5, color: chrome.text }}>
          <span style={{
            flexShrink: 0, width: 22, height: 22, borderRadius: 8,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#1a1208',
            background: 'linear-gradient(180deg, #f5c44a, #e8a830)',
          }}>
            {i + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

/** 3–2–1 ready beat; calls onDone once when finished. */
export function ExpCountdown({ chrome, seconds = 3, onDone, label }) {
  const [n, setN] = useState(seconds);
  const doneRef = useRef(false);
  useEffect(() => {
    if (n > 0) {
      const id = setTimeout(() => setN((x) => x - 1), 700);
      return () => clearTimeout(id);
    }
    if (!doneRef.current) {
      doneRef.current = true;
      onDone?.();
    }
    return undefined;
  }, [n, onDone]);

  return (
    <div style={{
      width: '100%', minHeight: 110, borderRadius: 14, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 6,
      background: chrome.dark ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.55)',
      border: chrome.dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(170,140,80,0.18)',
    }}>
      {label ? <div style={{ fontSize: 12, fontWeight: 700, color: chrome.muted }}>{label}</div> : null}
      <div style={{
        fontFamily: "'Fredoka One','Outfit',sans-serif", fontSize: 48, fontWeight: 800, color: chrome.accent,
      }}>
        {n > 0 ? n : '·'}
      </div>
    </div>
  );
}

export function expStimStyle(chrome) {
  return {
    width: '100%', minHeight: 96, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: chrome.dark ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.55)',
    border: chrome.dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(170,140,80,0.18)',
    fontFamily: "'Fredoka One', 'Outfit', sans-serif", fontWeight: 800, margin: '10px 0 14px',
  };
}

export function avgRT(list) {
  const correctOnes = list.filter((r) => r.correct);
  const src = correctOnes.length ? correctOnes : list;
  if (!src.length) return 0;
  return src.reduce((s, r) => s + r.rt, 0) / src.length;
}

export function pct(n, d) {
  if (!d) return 0;
  return Math.round((100 * n) / d);
}
