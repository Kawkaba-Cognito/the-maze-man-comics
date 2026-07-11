import React from 'react';
import { EXPERIMENTS } from './experiments';

/** Splits "text with **bold** and *italic* spans" into text + <strong>/<em> runs — no markdown lib needed for this one use case. */
function Inline({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (/^\*[^*]+\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
        return part;
      })}
    </>
  );
}

function Block({ block, chrome, isAr, playSfx }) {
  switch (block.type) {
    case 'experiment': {
      const Experiment = EXPERIMENTS[block.kind];
      return Experiment ? <Experiment isAr={isAr} chrome={chrome} playSfx={playSfx} /> : null;
    }
    case 'h2':
      return (
        <h2 style={{ fontFamily: "'Fredoka One', 'Nunito', sans-serif", fontSize: 19, margin: '26px 0 10px', color: chrome.text }}>
          {block.text}
        </h2>
      );
    case 'p':
      return (
        <p style={{ fontSize: 15, lineHeight: 1.65, color: chrome.text, margin: '0 0 12px' }}>
          <Inline text={block.text} />
        </p>
      );
    case 'ul':
      return (
        <ul style={{ margin: '0 0 14px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {block.items.map((item, i) => (
            <li key={i} style={{ display: 'flex', gap: 8, fontSize: 14.5, lineHeight: 1.6, color: chrome.text }}>
              <span aria-hidden="true" style={{ color: chrome.accent, flexShrink: 0 }}>•</span>
              <span><Inline text={item} /></span>
            </li>
          ))}
        </ul>
      );
    case 'tldr':
      return (
        <div style={{
          margin: '0 0 22px', padding: '16px 18px', borderRadius: 18,
          background: chrome.dark ? 'rgba(232,172,78,0.12)' : 'rgba(232,172,78,0.14)',
          border: `1.5px solid ${chrome.accent}66`,
        }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: 800, textTransform: 'uppercase', color: chrome.accent, marginBottom: 8 }}>
            ⚡ {block.label}
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {block.items.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, fontSize: 14.5, lineHeight: 1.55, color: chrome.text, fontWeight: 600 }}>
                <span aria-hidden="true" style={{ color: chrome.accent, flexShrink: 0 }}>{i + 1}.</span>
                <span><Inline text={item} /></span>
              </li>
            ))}
          </ul>
        </div>
      );
    case 'stat':
      return (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, margin: '20px 0', padding: '16px 4px',
          borderTop: chrome.dark ? '1px solid rgba(212,168,80,0.25)' : '1px solid rgba(170,140,80,0.22)',
          borderBottom: chrome.dark ? '1px solid rgba(212,168,80,0.25)' : '1px solid rgba(170,140,80,0.22)',
        }}>
          <div style={{
            fontFamily: "'Fredoka One', 'Nunito', sans-serif", fontSize: 30, fontWeight: 800,
            color: chrome.accent, flexShrink: 0, lineHeight: 1, whiteSpace: 'nowrap',
          }}>
            {block.value}
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.5, color: chrome.text }}>
            <Inline text={block.label} />
          </div>
        </div>
      );
    case 'callout': {
      const isFact = block.tone === 'fact';
      const col = isFact ? '#4a9d6f' : '#c96b4e';
      return (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-start', margin: '0 0 10px', padding: '12px 14px',
          borderRadius: 12, borderInlineStart: `4px solid ${col}`,
          background: chrome.dark ? `${col}1f` : `${col}14`,
        }}>
          <span aria-hidden="true" style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{isFact ? '✅' : '❌'}</span>
          <span style={{ fontSize: 14, lineHeight: 1.55, color: chrome.text }}>
            <strong style={{ color: col }}>{block.label}</strong> <Inline text={block.text} />
          </span>
        </div>
      );
    }
    case 'image':
      return (
        <figure style={{ margin: '4px 0 22px' }}>
          <img
            src={block.src}
            alt={block.alt || ''}
            loading="lazy"
            style={{ width: '100%', borderRadius: 18, display: 'block', border: chrome.dark ? '1px solid rgba(212,168,80,0.25)' : '1px solid rgba(170,140,80,0.2)' }}
          />
          {block.caption ? (
            <figcaption style={{ fontSize: 12, color: chrome.muted, marginTop: 8, textAlign: 'center' }}>{block.caption}</figcaption>
          ) : null}
        </figure>
      );
    case 'table':
      return (
        <div style={{ overflowX: 'auto', margin: '0 0 16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} style={{
                    textAlign: 'left', padding: '8px 10px', color: chrome.muted, fontWeight: 700,
                    borderBottom: chrome.dark ? '1px solid rgba(212,168,80,0.3)' : '1px solid rgba(170,140,80,0.28)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{
                      padding: '8px 10px', color: chrome.text, verticalAlign: 'top',
                      borderBottom: chrome.dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(170,140,80,0.12)',
                    }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

export default function LearnArticle({ topic, isAr, chrome, playSfx }) {
  return (
    <article style={{ textAlign: isAr ? 'right' : 'left' }}>
      <div style={{ fontSize: 12, letterSpacing: 1.5, color: chrome.muted, textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
        {isAr ? 'تعلّم' : 'Learn'}
      </div>
      <h1 style={{ fontFamily: "'Fredoka One', 'Nunito', sans-serif", fontSize: 24, lineHeight: 1.25, margin: '0 0 18px', color: chrome.text }}>
        {topic.subtitle || topic.title}
      </h1>
      {topic.blocks.map((block, i) => <Block key={i} block={block} chrome={chrome} isAr={isAr} playSfx={playSfx} />)}
    </article>
  );
}
