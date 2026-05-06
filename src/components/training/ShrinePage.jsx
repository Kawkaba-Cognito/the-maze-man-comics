import React, { useState, useEffect } from 'react';
import { IconBack, IconLock } from './TrainingIcons';
import { PALETTE, DOMAIN_COLOR, DOMAINS, DOMAIN_ABOUT } from './trainingData';

const c = PALETTE;

function AtmosphericRunes({ col }) {
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none', zIndex: 0 }}>
      <defs>
        <pattern id="shrineRunes" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M20 20v20M20 20l10 10-10 10" stroke={col} strokeWidth="1" fill="none"/>
          <path d="M60 24l6 10-6 10M60 24v20" stroke={col} strokeWidth="1" fill="none"/>
          <path d="M40 70h10M45 65v10" stroke={col} strokeWidth="1" fill="none"/>
          <circle cx="78" cy="78" r="5" stroke={col} strokeWidth="1" fill="none"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#shrineRunes)"/>
    </svg>
  );
}

function PlaqueMaze({ col, seed }) {
  const paths = [
    'M4 4h10v4h-6v4h12v4h-8M4 16v4',
    'M4 6h8v4h4v-8h4v16M16 14h4',
    'M4 10h6v-6h10v16h-8v-6',
    'M6 4v8h8v-4h6v12h-8v-4',
  ];
  return (
    <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
      <path d={paths[seed % paths.length]} stroke={col} strokeWidth="1.6" strokeLinecap="square"/>
    </svg>
  );
}

function StonePlaque({ col, sub, idx }) {
  return (
    <div style={{
      position: 'relative', padding: '13px 14px', borderRadius: 14,
      background: `linear-gradient(180deg, ${c.card} 0%, ${c.cardDeep} 100%)`,
      border: `1px solid ${c.cardBorder}`,
      opacity: 0.55, cursor: 'default', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: c.cardBorder, border: `1px solid ${c.cardBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <PlaqueMaze col={c.muted} seed={idx}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: '"Cinzel", serif', fontSize: 14, fontWeight: 600,
            color: c.text, letterSpacing: 0.3,
          }}>{sub.name}</div>
          <div style={{ fontSize: 10, color: c.muted, marginTop: 2, letterSpacing: 0.3 }}>
            Coming soon
          </div>
        </div>
        <IconLock size={14} c={c.muted}/>
      </div>
    </div>
  );
}

export default function ShrinePage({ domainId, onBack }) {
  const d = DOMAINS.find(x => x.id === domainId);
  if (!d) return null;
  const col = DOMAIN_COLOR[d.id];
  const total = d.subs.reduce((s, x) => s + x.games, 0);
  const progress = d.subs.reduce((s, x) => s + x.progress * x.games, 0) / total;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 160);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      minHeight: '100%', background: c.bg, color: c.text,
      fontFamily: 'Inter, system-ui, sans-serif', position: 'relative', overflow: 'hidden',
      paddingBottom: 28,
    }}>
      {/* Domain color wash */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 340,
        background: `linear-gradient(180deg, ${col}30 0%, ${col}10 50%, transparent 100%)`,
        zIndex: 1,
      }}/>
      <div style={{
        position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
        width: 320, height: 200,
        background: `radial-gradient(ellipse, ${col}55 0%, transparent 65%)`, zIndex: 2,
      }}/>
      <AtmosphericRunes col={col}/>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '64px 18px 8px', position: 'relative', zIndex: 10,
      }}>
        <button onClick={onBack} style={{
          width: 34, height: 34, borderRadius: 11,
          border: `1px solid ${col}55`,
          background: `linear-gradient(180deg, ${c.card} 0%, ${c.cardDeep} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}>
          <IconBack size={18} c={c.text}/>
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9.5, letterSpacing: 4, color: col, fontWeight: 700 }}>
            ⟡ {d.short} ⟡
          </div>
        </div>
        <div style={{ width: 34 }}/>
      </div>

      {/* Hero glyph */}
      <div style={{ textAlign: 'center', padding: '10px 20px 0', position: 'relative', zIndex: 10 }}>
        <div style={{ position: 'relative', width: 130, height: 130, margin: '0 auto' }}>
          <div style={{
            position: 'absolute', inset: -20,
            background: `radial-gradient(circle, ${col}55 0%, transparent 60%)`,
          }}/>
          <svg width="130" height="130" viewBox="0 0 130 130" style={{ position: 'absolute', inset: 0 }}>
            <circle cx="65" cy="65" r="58" fill="none" stroke={col} strokeWidth="1" opacity="0.4"
              strokeDasharray="3 4" style={{
                transform: `rotate(${tick * 2}deg)`, transformOrigin: '65px 65px',
              }}/>
            <circle cx="65" cy="65" r="48" fill={`${col}14`} stroke={col} strokeWidth="1.2" opacity="0.85"/>
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i / 12) * Math.PI * 2;
              const r1 = 48, r2 = i % 3 === 0 ? 54 : 51;
              return <line key={i}
                x1={65 + Math.cos(a) * r1} y1={65 + Math.sin(a) * r1}
                x2={65 + Math.cos(a) * r2} y2={65 + Math.sin(a) * r2}
                stroke={col} strokeWidth="1" opacity={i % 3 === 0 ? 1 : 0.45}/>;
            })}
            <text x="65" y="78" textAnchor="middle" fill={col} style={{
              fontFamily: 'Cinzel, serif', fontSize: 54, fontWeight: 700,
              filter: `drop-shadow(0 0 12px ${col})`,
            }}>
              {d.glyph}
            </text>
          </svg>
        </div>

        <div style={{
          fontFamily: '"Cinzel", serif', fontSize: 28, fontWeight: 600,
          color: c.text, letterSpacing: 1, marginTop: 10,
          textShadow: `0 0 24px ${col}77`,
        }}>
          {d.name}
        </div>
        <div style={{
          fontSize: 11.5, color: c.muted, marginTop: 4, maxWidth: 280, margin: '4px auto 0',
          lineHeight: 1.5, fontStyle: 'italic',
        }}>
          {d.desc}
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 16, maxWidth: 260, margin: '16px auto 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            flex: 1, height: 4, borderRadius: 3, background: c.cardDeep, overflow: 'hidden',
            boxShadow: `0 0 0 1px ${col}33 inset`,
          }}>
            <div style={{
              width: `${progress * 100}%`, height: '100%',
              background: `linear-gradient(90deg, ${col} 0%, ${c.accent} 100%)`,
              boxShadow: `0 0 10px ${col}aa`,
            }}/>
          </div>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: 13, color: col, fontWeight: 700 }}>
            {Math.round(progress * 100)}%
          </span>
        </div>
      </div>

      {/* Subdomains */}
      <div style={{ padding: '26px 14px 0', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 6px 10px' }}>
          <div style={{ flex: 1, height: 1, background: `${col}33` }}/>
          <div style={{ fontSize: 9.5, letterSpacing: 3, color: col, fontWeight: 700 }}>SUBDOMAINS</div>
          <div style={{ flex: 1, height: 1, background: `${col}33` }}/>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {d.subs.map((sub, i) => (
            <StonePlaque key={sub.id} col={col} sub={sub} idx={i}/>
          ))}
        </div>
      </div>

      {/* Domain lore */}
      <div style={{ padding: '22px 18px 0', position: 'relative', zIndex: 10 }}>
        <div style={{
          padding: '14px 16px', borderRadius: 14, position: 'relative',
          background: `linear-gradient(180deg, ${c.card} 0%, ${c.cardDeep} 100%)`,
          border: `1px solid ${col}22`,
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
        }}>
          <div style={{ position: 'absolute', top: 10, left: 16, fontSize: 20, color: col, opacity: 0.6 }}>❝</div>
          <div style={{ fontSize: 11.5, color: c.muted, lineHeight: 1.65, fontStyle: 'italic', padding: '4px 14px' }}>
            {DOMAIN_ABOUT[d.id]}
          </div>
          <div style={{ position: 'absolute', bottom: 10, right: 16, fontSize: 20, color: col, opacity: 0.6 }}>❞</div>
        </div>
      </div>
    </div>
  );
}
