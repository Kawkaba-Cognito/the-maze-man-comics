import React, { useState, useEffect } from 'react';
import MazeManAvatar from './MazeManAvatar';
import { IconBack } from './TrainingIcons';
import { PALETTE, DOMAIN_COLOR, DOMAINS } from './trainingData';
import { useApp } from '../../context/AppContext';

const c = PALETTE;

function chromeBtn() {
  return {
    width: 34, height: 34, borderRadius: 11,
    border: `1px solid ${c.accent}33`,
    background: `linear-gradient(180deg, ${c.card} 0%, ${c.cardDeep} 100%)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: c.text, cursor: 'pointer',
    boxShadow: `0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px ${c.accent}11 inset`,
  };
}

function ArchShape({ col, hovered }) {
  return (
    <g>
      <path d="M 0 28 Q 0 0 32 0 Q 64 0 64 28 L 64 66 L 0 66 Z"
        fill={c.card}
        stroke={col}
        strokeWidth={hovered ? '2' : '1.3'}
        opacity="0.92"
        filter={hovered ? 'url(#strongGlow)' : 'none'}
      />
      <path d="M 8 28 Q 8 8 32 8 Q 56 8 56 28 L 56 60 L 8 60 Z"
        fill={c.bg}
        opacity="0.85"
      />
      <rect x="30" y="-2" width="4" height="6" fill={col} opacity="0.8"/>
    </g>
  );
}

function AtmosphericBg() {
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 420px 520px at 50% 42%, ${c.accent}24 0%, transparent 70%)`,
        zIndex: 1, pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
        width: 300, height: 180,
        background: `radial-gradient(ellipse, ${c.accent}40 0%, transparent 65%)`,
        zIndex: 1, pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 600px 800px at 50% 50%, transparent 40%, ${c.bg} 100%)`,
        zIndex: 2, pointerEvents: 'none',
      }}/>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none', zIndex: 0 }}>
        <defs>
          <pattern id="atmoRunes" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M20 20v20M20 20l10 10-10 10" stroke={c.accent} strokeWidth="1" fill="none"/>
            <path d="M60 24l6 10-6 10M60 24v20" stroke={c.accent} strokeWidth="1" fill="none"/>
            <path d="M40 70h10M45 65v10" stroke={c.accent} strokeWidth="1" fill="none"/>
            <circle cx="78" cy="78" r="5" stroke={c.accent} strokeWidth="1" fill="none"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#atmoRunes)"/>
      </svg>
    </>
  );
}

function StatCell({ glyph, val, label, accent }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{
        fontFamily: 'Cinzel, serif', fontSize: 14, fontWeight: 700,
        color: accent ? c.accent : c.text,
        lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>{glyph}</span>
        <span>{val}</span>
      </div>
      <div style={{
        fontSize: 8.5, color: c.muted, letterSpacing: 1.5, marginTop: 4,
        textTransform: 'uppercase', fontWeight: 700,
      }}>{label}</div>
    </div>
  );
}

function Sep() {
  return <div style={{ width: 1, background: `${c.accent}22` }}/>;
}

function StatsScroll() {
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: 8,
      padding: '12px 14px', borderRadius: 14,
      background: `linear-gradient(180deg, ${c.card} 0%, ${c.cardDeep} 100%)`,
      border: `1px solid ${c.accent}33`,
      boxShadow: `0 -2px 0 ${c.accent}11 inset, 0 8px 24px rgba(0,0,0,0.4)`,
    }}>
      <StatCell glyph="🔥" val="7" label="streak" accent/>
      <Sep/>
      <StatCell glyph="ᚱ" val="12" label="runes"/>
      <Sep/>
      <StatCell glyph="★" val="4" label="level" accent/>
      <Sep/>
      <StatCell glyph="⧗" val="18m" label="today"/>
    </div>
  );
}

const CX = 180, CY = 320;

const SHRINE_POSITIONS = [
  { ...DOMAINS[0], x: 60,  y: 140, pathSeed: 'a' },
  { ...DOMAINS[1], x: 180, y: 78,  pathSeed: 's' },
  { ...DOMAINS[2], x: 300, y: 140, pathSeed: 'm' },
  { ...DOMAINS[3], x: 60,  y: 490, pathSeed: 'l' },
  { ...DOMAINS[4], x: 180, y: 555, pathSeed: 'r' },
  { ...DOMAINS[5], x: 300, y: 490, pathSeed: 'f' },
];

function mazePath(x2, y2, seed) {
  const dx = x2 - CX, dy = y2 - CY;
  const midX = CX + dx * 0.5 + (seed.charCodeAt(0) % 2 === 0 ? 20 : -20);
  const midY = CY + dy * 0.5 + (seed.charCodeAt(0) % 3 === 0 ? 18 : -18);
  return `M ${CX} ${CY} L ${CX} ${midY} L ${midX} ${midY} L ${midX} ${y2} L ${x2} ${y2}`;
}

export default function RadialMazeHub({ onBack, onOpenDomain }) {
  const { currentLang, toggleLang } = useApp();
  const isAr = currentLang === 'ar';
  const [hovered, setHovered] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 120);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      minHeight: '100%', background: c.bg, color: c.text,
      fontFamily: 'Inter, system-ui, sans-serif', position: 'relative',
      paddingBottom: 28, overflow: 'hidden',
    }}>
      <AtmosphericBg/>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '64px 18px 6px', position: 'relative', zIndex: 5,
      }}>
        <button style={chromeBtn()} onClick={onBack}><IconBack size={18} c={c.text}/></button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9.5, letterSpacing: 4, color: c.accent, fontWeight: 700, opacity: 0.9 }}>
            ⟡ THE CHAMBER ⟡
          </div>
          <div style={{
            fontFamily: '"Cinzel", serif', fontSize: 19, fontWeight: 600,
            letterSpacing: 2.5, color: c.text,
            textShadow: `0 0 20px ${c.accent}66`,
          }}>TRAINING</div>
        </div>
        <button
          style={{
            ...chromeBtn(), width: 'auto', padding: '0 12px',
            fontFamily: isAr ? "'Cairo', sans-serif" : "'Bangers', cursive",
            fontWeight: 700, fontSize: isAr ? 13 : 14,
            letterSpacing: isAr ? 0 : 2,
            color: c.accent,
          }}
          onClick={toggleLang}
        >
          {isAr ? 'EN' : 'عر'}
        </button>
      </div>

      {/* Subtitle */}
      <div style={{ textAlign: 'center', padding: '2px 24px 0', position: 'relative', zIndex: 5 }}>
        <div style={{ fontSize: 11, color: c.muted, letterSpacing: 0.8, lineHeight: 1.5, fontStyle: 'italic' }}>
          Every path leads inward. Choose which part of the mind<br/>you will walk today.
        </div>
      </div>

      {/* Radial maze canvas */}
      <div style={{ position: 'relative', width: '100%', height: 660, marginTop: 10, zIndex: 4 }}>
        <svg width="360" height="660" viewBox="0 0 360 660" style={{
          position: 'absolute', inset: 0, margin: 'auto', left: 0, right: 0, overflow: 'visible',
        }}>
          <defs>
            <filter id="pathGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <radialGradient id="plinthGrad" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor={c.accent} stopOpacity="0.55"/>
              <stop offset="40%" stopColor={c.accent} stopOpacity="0.18"/>
              <stop offset="100%" stopColor={c.accent} stopOpacity="0"/>
            </radialGradient>
            {SHRINE_POSITIONS.map(s => (
              <radialGradient key={s.id} id={`sh-${s.id}`} cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor={DOMAIN_COLOR[s.id]} stopOpacity="0.7"/>
                <stop offset="60%" stopColor={DOMAIN_COLOR[s.id]} stopOpacity="0.15"/>
                <stop offset="100%" stopColor={DOMAIN_COLOR[s.id]} stopOpacity="0"/>
              </radialGradient>
            ))}
          </defs>

          {/* Faint grid */}
          <g opacity="0.08">
            {Array.from({ length: 13 }).map((_, i) => (
              <line key={`h${i}`} x1="0" x2="360" y1={i * 52} y2={i * 52} stroke={c.accent} strokeWidth="0.3"/>
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 52} x2={i * 52} y1="0" y2="660" stroke={c.accent} strokeWidth="0.3"/>
            ))}
          </g>

          {/* Central plinth glow */}
          <circle cx={CX} cy={CY} r="100" fill="url(#plinthGrad)"/>

          {/* Rune rings */}
          <circle cx={CX} cy={CY} r="70" fill="none" stroke={c.accent} strokeWidth="0.8" opacity="0.5" strokeDasharray="2 4"/>
          <circle cx={CX} cy={CY} r="54" fill="none" stroke={c.accent} strokeWidth="0.8" opacity="0.7"/>
          <circle cx={CX} cy={CY} r="42" fill="none" stroke={c.rune} strokeWidth="0.6" opacity="0.4"/>

          {/* Rune ticks */}
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const r1 = 70, r2 = i % 4 === 0 ? 76 : 73;
            return <line key={i}
              x1={CX + Math.cos(a) * r1} y1={CY + Math.sin(a) * r1}
              x2={CX + Math.cos(a) * r2} y2={CY + Math.sin(a) * r2}
              stroke={c.accent} strokeWidth="1" opacity={i % 4 === 0 ? 0.9 : 0.4}/>;
          })}

          {/* Maze paths */}
          {SHRINE_POSITIONS.map(s => {
            const col = DOMAIN_COLOR[s.id];
            const isHovered = hovered === s.id;
            const d = mazePath(s.x, s.y, s.pathSeed);
            return (
              <g key={`path-${s.id}`}>
                <path d={d} fill="none" stroke={col} strokeWidth={isHovered ? '2.8' : '1.8'}
                  strokeLinecap="square" strokeLinejoin="miter"
                  opacity={isHovered ? 0.95 : 0.55} filter="url(#pathGlow)"/>
                <path d={d} fill="none" stroke={col} strokeWidth="0.6" strokeDasharray="1 3"
                  opacity={isHovered ? 0.6 : 0.3} transform="translate(4, 0)"/>
                <path d={d} fill="none" stroke={col} strokeWidth="0.6" strokeDasharray="1 3"
                  opacity={isHovered ? 0.6 : 0.3} transform="translate(-4, 0)"/>
                <circle r="2.5" fill={col} opacity={isHovered ? 1 : 0.85} filter="url(#strongGlow)">
                  <animateMotion dur={isHovered ? '1.5s' : '3.5s'} repeatCount="indefinite" path={d}/>
                </circle>
              </g>
            );
          })}

          {/* Shrine portals */}
          {SHRINE_POSITIONS.map(s => {
            const col = DOMAIN_COLOR[s.id];
            const isHovered = hovered === s.id;
            const total = s.subs.reduce((sum, x) => sum + x.games, 0);
            const prog = s.subs.reduce((sum, x) => sum + x.progress * x.games, 0) / total;
            return (
              <g key={s.id} style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(s.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onOpenDomain(s.id)}>
                <circle cx={s.x} cy={s.y} r={isHovered ? 58 : 48} fill={`url(#sh-${s.id})`}/>
                <g transform={`translate(${s.x - 32}, ${s.y - 38})`}>
                  <ArchShape col={col} hovered={isHovered}/>
                </g>
                <text x={s.x} y={s.y - 2} textAnchor="middle" dominantBaseline="middle"
                  fill={col} style={{
                    fontFamily: 'Cinzel, serif',
                    fontSize: isHovered ? 26 : 24, fontWeight: 700,
                    filter: `drop-shadow(0 0 8px ${col}cc)`,
                    transition: 'font-size 0.2s',
                  }}>
                  {s.glyph}
                </text>
                <text x={s.x} y={s.y + 30} textAnchor="middle" fill={c.text} style={{
                  fontFamily: 'Cinzel, serif', fontSize: 11, fontWeight: 600, letterSpacing: 1.2,
                }}>
                  {s.name.toUpperCase()}
                </text>
                <circle cx={s.x + 22} cy={s.y - 32} r="8" fill={c.card} stroke={col} strokeWidth="1.2"/>
                <text x={s.x + 22} y={s.y - 30} textAnchor="middle" fill={col}
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: 8, fontWeight: 700 }}>
                  {Math.round(prog * 100)}
                </text>
              </g>
            );
          })}

          {/* Central plinth */}
          <circle cx={CX} cy={CY + 16} r="42" fill="none" stroke={c.accent} strokeWidth="1" opacity="0.7"/>
          <circle cx={CX} cy={CY + 16} r="30" fill={c.accent} opacity="0.08"/>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <circle key={i}
              cx={CX + Math.cos(a) * 42} cy={CY + 16 + Math.sin(a) * 42}
              r="1.8" fill={c.accent} opacity={0.85}/>;
          })}

          <foreignObject x={CX - 70} y={CY - 58} width="140" height="150">
            <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: 140, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MazeManAvatar size={130} mood="ready" glow/>
            </div>
          </foreignObject>

          {/* Embers */}
          {Array.from({ length: 14 }).map((_, i) => {
            const seed = i * 137;
            const x = (seed % 300) + 30;
            const y = 600 - ((tick * (3 + (i % 4)) + seed) % 560);
            const op = Math.max(0, 0.6 - ((tick * (3 + (i % 4)) + seed) % 560) / 560);
            return <circle key={i}
              cx={x + Math.sin(tick / 20 + i) * 6} cy={y}
              r={0.8 + (i % 3) * 0.4} fill={c.accent} opacity={op * 0.7}/>;
          })}
        </svg>
      </div>

      {/* Stats scroll */}
      <div style={{ position: 'relative', zIndex: 5, padding: '6px 18px 0', marginTop: -14 }}>
        <StatsScroll/>
      </div>

      {/* Domain hover callout */}
      {hovered && (
        <div style={{
          position: 'absolute', bottom: 88, left: 0, right: 0, textAlign: 'center', zIndex: 6,
          pointerEvents: 'none',
        }}>
          <div style={{
            display: 'inline-block', padding: '6px 14px', borderRadius: 100,
            background: c.card, border: `1px solid ${DOMAIN_COLOR[hovered]}66`,
            boxShadow: `0 4px 16px ${DOMAIN_COLOR[hovered]}44`,
            fontSize: 11, color: c.text, letterSpacing: 0.5,
          }}>
            <span style={{ color: DOMAIN_COLOR[hovered], fontWeight: 700, letterSpacing: 1 }}>
              {DOMAINS.find(d => d.id === hovered).name.toUpperCase()}
            </span>
            <span style={{ color: c.muted, margin: '0 6px' }}>·</span>
            <span>{DOMAINS.find(d => d.id === hovered).desc}</span>
          </div>
        </div>
      )}
    </div>
  );
}
