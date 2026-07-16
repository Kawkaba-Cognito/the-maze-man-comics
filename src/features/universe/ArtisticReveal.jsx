import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { PLANET_TYPES } from './universeStore';

/*
 * ArtisticReveal — shown after a small planet dissolves: the written content
 * materializes out of the dark, word by word (per-word, not per-character,
 * so Arabic cursive joining survives), with a drift of stardust in the
 * planet's color. Replaces the old plain InfoCard sheet.
 *
 * Portalled to <body> — #ui-shell traps position:fixed descendants below the
 * tab bar (see project_universe_planets memory).
 */

function StaggeredWords({ text, baseDelay, step, maxDelay, style }) {
  const tokens = useMemo(() => (text || '').split(/(\s+)/), [text]);
  let wordIndex = 0;
  return tokens.map((tok, i) => {
    if (/^\s+$/.test(tok)) return tok.includes('\n') ? <br key={`b${i}`} /> : ' ';
    const delay = Math.min(baseDelay + wordIndex * step, maxDelay);
    wordIndex += 1;
    return (
      <span
        key={i}
        className="u-reveal-word"
        style={{ ...style, animationDelay: `${delay}ms` }}
      >
        {tok}
      </span>
    );
  });
}

export default function ArtisticReveal({ isAr, planet, onEdit, onClose }) {
  const meta = PLANET_TYPES[planet.type] || PLANET_TYPES.note;
  const label = planet.title || (isAr ? meta.ar : meta.en);
  const date = new Date(planet.createdAt || Date.now()).toLocaleDateString(isAr ? 'ar' : 'en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
  const dust = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    id: i,
    x: 6 + Math.random() * 88,
    y: 20 + Math.random() * 70,
    size: 1.5 + Math.random() * 2.5,
    delay: Math.random() * 4,
    dur: 5 + Math.random() * 6,
  })), []);

  return createPortal(
    <div
      role="presentation"
      onClick={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
      className="u-reveal-backdrop"
      style={{
        // Nearly transparent: the "card" behind this overlay is the planet's
        // own particles, assembled into a paper by the 3D layer (which also
        // dims the rest of the universe). No blur — it would smear the paper.
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.28)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {dust.map((d) => (
        <span
          key={d.id}
          aria-hidden="true"
          className="u-reveal-dust"
          style={{
            position: 'absolute', left: `${d.x}%`, top: `${d.y}%`,
            width: d.size, height: d.size, borderRadius: '50%',
            background: meta.color, boxShadow: `0 0 ${d.size * 3}px 1px ${meta.color}`,
            animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s`,
          }}
        />
      ))}

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          // Sized to sit inside the particle paper (90vw/560 x 68vh/620 in the
          // 3D layer), so the words land on the sheet the particles formed.
          width: '86%', maxWidth: 500, maxHeight: '62vh', overflowY: 'auto',
          padding: '24px 20px',
          boxSizing: 'border-box', textAlign: 'center', position: 'relative',
        }}
      >
        <div className="u-reveal-kicker" style={{
          fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700,
          color: meta.color, marginBottom: 14, opacity: 0,
        }}>
          {planet.type === 'journal' && planet.mood ? `${planet.mood}  ` : ''}
          {isAr ? meta.ar : meta.en} · {date}
        </div>

        <h2 style={{
          margin: '0 0 8px', color: '#f6efdd', fontSize: 27, lineHeight: 1.3,
          fontFamily: "'Fredoka One', 'Nunito', sans-serif", fontWeight: 600,
          textShadow: `0 0 34px ${meta.color}66`,
          textDecoration: planet.type === 'goal' && planet.done ? 'line-through' : 'none',
          opacity: planet.type === 'goal' && planet.done ? 0.75 : 1,
        }}>
          <StaggeredWords text={label} baseDelay={450} step={110} maxDelay={1200} />
        </h2>

        {planet.type === 'goal' && (
          <div className="u-reveal-word" style={{
            animationDelay: '650ms', display: 'inline-block',
            fontSize: 12.5, fontWeight: 700, marginBottom: 4,
            color: planet.done ? '#8fe0a0' : '#cbb98e',
          }}>
            {planet.done ? (isAr ? '✓ تم تحقيقه' : '✓ Achieved') : (isAr ? '○ قيد التقدّم' : '○ In progress')}
          </div>
        )}

        <div className="u-reveal-line" aria-hidden="true" style={{
          height: 1, margin: '16px auto 20px', maxWidth: 200,
          background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)`,
        }} />

        <div style={{
          color: '#e6dcc4', fontSize: 16.5, lineHeight: 1.75, fontWeight: 500,
          whiteSpace: 'normal', textAlign: 'center', minHeight: 30,
        }}>
          {planet.body
            ? <StaggeredWords text={planet.body} baseDelay={1050} step={38} maxDelay={2700} />
            : <span className="u-reveal-word" style={{ animationDelay: '1050ms', color: '#8a7f6f', fontStyle: 'italic' }}>
                {isAr ? 'لا يوجد نص بعد.' : 'Nothing written yet.'}
              </span>}
        </div>

        <div className="u-reveal-actions" style={{
          display: 'flex', gap: 10, justifyContent: 'center', marginTop: 30, opacity: 0,
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '11px 26px', borderRadius: 999, border: '1px solid rgba(246,239,221,0.25)',
              background: 'rgba(255,255,255,0.05)', color: '#e6dcc4', fontWeight: 700,
              cursor: 'pointer', fontSize: 13.5,
            }}
          >
            {isAr ? 'عودة إلى الكون' : 'Back to the universe'}
          </button>
          <button
            type="button"
            onClick={onEdit}
            style={{
              padding: '11px 26px', borderRadius: 999, border: `1px solid ${meta.color}`,
              background: `${meta.color}22`, color: meta.color, fontWeight: 800,
              cursor: 'pointer', fontSize: 13.5,
            }}
          >
            {isAr ? 'تعديل' : 'Edit'}
          </button>
        </div>
      </div>

      <style>{`
        .u-reveal-backdrop { animation: uRevealFade 0.5s ease-out both; }
        @keyframes uRevealFade { from { opacity: 0; } to { opacity: 1; } }
        .u-reveal-word {
          display: inline-block;
          animation: uRevealWord 0.9s cubic-bezier(0.2, 0.7, 0.3, 1) both;
        }
        @keyframes uRevealWord {
          from { opacity: 0; filter: blur(7px); transform: translateY(10px); }
          to { opacity: 1; filter: blur(0); transform: translateY(0); }
        }
        .u-reveal-kicker { animation: uRevealWord 0.9s ease-out 0.05s both; }
        .u-reveal-line { transform: scaleX(0); animation: uRevealLine 0.9s cubic-bezier(0.2, 0.7, 0.3, 1) 0.55s both; }
        @keyframes uRevealLine { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .u-reveal-actions { animation: uRevealWord 0.8s ease-out 1.5s both; }
        .u-reveal-dust { opacity: 0; animation-name: uRevealDust; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        @keyframes uRevealDust {
          0% { opacity: 0; transform: translateY(14px); }
          30% { opacity: 0.8; }
          70% { opacity: 0.35; }
          100% { opacity: 0; transform: translateY(-46px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .u-reveal-backdrop, .u-reveal-word, .u-reveal-kicker, .u-reveal-line, .u-reveal-actions { animation: none !important; opacity: 1 !important; transform: none !important; filter: none !important; }
          .u-reveal-dust { animation: none !important; opacity: 0.3; }
        }
      `}</style>
    </div>,
    document.body,
  );
}
