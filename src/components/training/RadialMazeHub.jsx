import React, { useState, useEffect } from 'react';
import MazeManAvatar from '../../features/training/shared/MazeManAvatar';
import { IconBack } from '../../features/training/shared/TrainingIcons';
import { DOMAIN_COLOR, DOMAINS } from './trainingData';
import { useApp } from '../../context/AppContext';
import { tokens } from '../../styles/tokens';

/** Local alias kept for in-file readability — values come from the central token set. */
const L = {
  bg: tokens.bg,
  text: tokens.text,
  textMuted: tokens.textMuted,
  paper: tokens.stone,
  paperEdge: tokens.stoneEdge,
  shadow: 'rgba(0, 0, 0, 0.55)',
  grid: 'rgba(232, 172, 78, 0.06)',
};

const DOMAIN_LABEL_AR = {
  attention: 'انتباه',
  speed: 'سرعة',
  memory: 'ذاكرة',
  language: 'لغة',
  reasoning: 'تفكير',
  flexibility: 'مرونة',
};

/** Short, friendly door captions (EN). */
const DOMAIN_DOOR_LABEL_EN = {
  attention: 'Attention',
  speed: 'Speed',
  memory: 'Memory',
  language: 'Language',
  reasoning: 'Reasoning',
  flexibility: 'Flexibility',
};

function domainDoorLabel(id, isAr) {
  if (isAr) return DOMAIN_LABEL_AR[id] ?? DOMAINS.find(d => d.id === id)?.name ?? id;
  return DOMAIN_DOOR_LABEL_EN[id] ?? DOMAINS.find(d => d.id === id)?.name ?? id;
}

function chromeBtnLight() {
  return {
    width: 34,
    height: 34,
    borderRadius: 6,
    border: '1.5px solid #9a6828',
    background: 'linear-gradient(170deg, #3e1a06 0%, #5e2a0c 50%, #3e1a06 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: L.text,
    cursor: 'pointer',
    boxShadow: 'inset 0 1px 0 rgba(220,170,70,0.35), inset 0 -1px 0 rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.6)',
  };
}

/** SVG clip for inner “stone opening” (local door coords 0–64). */
const DOOR_INNER_D =
  'M 10 28 Q 10 11 32 9 Q 54 11 54 28 L 54 57 L 10 57 Z';

/** Domain-specific iconography inside each portal (centered at 0,0). */
function DomainDoorArt({ domainId, col, hovered }) {
  const dur = hovered ? 1.35 : 2.75;
  const fillSoft = `${col}22`;
  const fillMid = `${col}3a`;
  const sw = 1.65;
  const art = (() => {
    switch (domainId) {
      case 'attention':
        return (
          <>
            <circle r="14" fill="none" stroke={col} strokeWidth={sw} opacity="0.45" />
            <circle r="8.5" fill="none" stroke={col} strokeWidth={sw} opacity="0.7" />
            <circle r="3.2" fill={col} opacity="0.9" />
            <line x1="-16" y1="0" x2="16" y2="0" stroke={col} strokeWidth={0.9} opacity="0.35" />
            <line x1="0" y1="-16" x2="0" y2="16" stroke={col} strokeWidth={0.9} opacity="0.35" />
          </>
        );
      case 'speed':
        return (
          <>
            <path d="M -10 -14 L -2 -4 L -6 -2 L 4 10 L 1 8 L 10 16 L 2 2 L 6 0 Z" fill={fillMid} stroke={col} strokeWidth={sw} strokeLinejoin="round" />
            <path d="M -14 -6 L -18 -2 M 12 4 L 16 2" stroke={col} strokeWidth={1.1} strokeLinecap="round" opacity="0.55" />
          </>
        );
      case 'memory':
        return [0, 1, 2].flatMap(row =>
          [0, 1, 2].map(coln => {
            const cx = (coln - 1) * 7;
            const cy = (row - 1) * 7;
            const on = row === 1 && coln === 1;
            return (
              <rect key={`${row}-${coln}`} x={cx - 2.8} y={cy - 2.8} width={5.6} height={5.6} rx={0.9}
                fill={on ? col : fillSoft} opacity={on ? 0.95 : 0.5} stroke={col} strokeWidth={0.85} />
            );
          }),
        );
      case 'language':
        return (
          <>
            <path d="M -8 12 L 0 -12 L 8 12 M -5 4 L 5 4" fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M -12 -6 Q -14 -10 -10 -12 M 12 -6 Q 14 -10 10 -12" fill="none" stroke={col} strokeWidth={1} strokeLinecap="round" opacity="0.45" />
          </>
        );
      case 'reasoning':
        return (
          <>
            <circle cx="-10" cy={8} r="3.2" fill={fillMid} stroke={col} strokeWidth={sw} />
            <circle cx={10} cy={8} r="3.2" fill={fillMid} stroke={col} strokeWidth={sw} />
            <circle cx="0" cy={-10} r="3.2" fill={col} stroke={col} strokeWidth={sw} opacity="0.95" />
            <path d="M -10 8 L 0 -10 L 10 8" fill="none" stroke={col} strokeWidth={1.2} strokeLinejoin="round" opacity="0.75" />
          </>
        );
      case 'flexibility':
        return (
          <>
            <path d="M -12 -4 C -4 -12 4 -4 12 -4" fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" />
            <path d="M 12 4 C 4 12 -4 4 -12 4" fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" />
            <path d="M 8 -6 L 12 -4 L 8 -2" fill="none" stroke={col} strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M -8 6 L -12 4 L -8 2" fill="none" stroke={col} strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" />
          </>
        );
      default:
        return null;
    }
  })();

  return (
    <g clipPath="url(#doorInnerClip)">
      <g transform="translate(32, 35)">
        <g>
          <animateTransform
            attributeName="transform"
            type="scale"
            values="1;1.085;1"
            keyTimes="0;0.5;1"
            dur={`${dur}s`}
            repeatCount="indefinite"
          />
          {art}
        </g>
      </g>
      {domainId === 'attention' && (
        <circle cx={32} cy={35} r="18" fill="none" stroke={col} strokeWidth={0.75} opacity={hovered ? 0.45 : 0.2}>
          <animate attributeName="r" values="14;19;14" dur={`${dur * 1.3}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0.08;0.35" dur={`${dur * 1.3}s`} repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}

/** Stone arch: offset shadow, graded façade, deep recess, lintel highlight. */
function ArchShape3D({ col, hovered, gradId, filterId }) {
  const sw = hovered ? 2.45 : 1.65;
  return (
    <g filter={`url(#${filterId})`}>
      <path
        d="M 3 30 Q 3 5 34 5 Q 65 5 65 30 L 65 69 L 3 69 Z"
        fill="rgba(20,18,16,0.16)"
        transform="translate(3, 4)"
      />
      <path
        d="M 0 28 Q 0 0 32 0 Q 64 0 64 28 L 64 66 L 0 66 Z"
        fill={`url(#${gradId})`}
        stroke={col}
        strokeWidth={sw}
      />
      <path d="M 5 28 Q 5 6 32 4 Q 59 6 59 28 L 59 61 L 5 61 Z" fill="rgba(12,10,8,0.18)" />
      <path
        d="M 10 28 Q 10 11 32 9 Q 54 11 54 28 L 54 57 L 10 57 Z"
        fill={L.paper}
        opacity="0.94"
      />
      <path
        d="M 9 28 Q 9 10 32 8 Q 55 10 55 28"
        fill="none"
        stroke="rgba(255,255,255,0.72)"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M 1 28 Q 1 2 32 2 Q 63 2 63 28"
        fill="none"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="1.1"
        opacity="0.85"
      />
      <rect x="29" y="-2" width="6" height="8" rx="1.2" fill={col} opacity="0.88" />
      <rect x="30.5" y="-0.5" width="3" height="4.5" fill="rgba(255,255,255,0.4)" rx="0.5" />
    </g>
  );
}

function AtmosphericBgLight() {
  const isDesktop = typeof window !== 'undefined' && window.matchMedia?.('(min-width: 768px)').matches;
  const bgUrl = isDesktop
    ? '/the-maze-man-comics/Assets/bg-desktop.webp'
    : '/the-maze-man-comics/Assets/bg-mobile.webp';
  return (
    <>
      {/* Home fortress photo — same as main menu */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: L.bg,
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: isDesktop ? 'center center' : 'center top',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      {/* Same navy overlay as home, slightly stronger so the radial UI stays readable */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(
            180deg,
            rgba(5, 5, 15, 0.55) 0%,
            rgba(10, 4, 30, 0.45) 40%,
            rgba(5, 5, 15, 0.7) 100%
          )`,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

function StatCell({ glyph, val, label, accent }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{
        fontFamily: "'Fredoka One', Nunito, sans-serif",
        fontSize: 14,
        fontWeight: 400,
        color: accent ? '#e8ac4e' : L.text,
        lineHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}>
        <span style={{ fontSize: 12, opacity: 0.85 }}>{glyph}</span>
        <span>{val}</span>
      </div>
      <div style={{
        fontSize: 8.5,
        color: L.textMuted,
        letterSpacing: 1.5,
        marginTop: 4,
        textTransform: 'uppercase',
        fontWeight: 800,
        fontFamily: "'Nunito', sans-serif",
      }}>{label}</div>
    </div>
  );
}

function Sep() {
  return <div style={{ width: 2, background: 'rgba(220,170,70,0.28)', borderRadius: 1 }} />;
}

function StatsScroll() {
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: 8,
      padding: '12px 14px', borderRadius: 6,
      background: 'linear-gradient(170deg, #3e1a06 0%, #5e2a0c 50%, #3e1a06 100%)',
      border: '1.5px solid #9a6828',
      boxShadow: 'inset 0 1px 0 rgba(220,170,70,0.35), inset 0 -1px 0 rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.6)',
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
  { ...DOMAINS[0], x: 60,  y: 140 },
  { ...DOMAINS[1], x: 180, y: 78 },
  { ...DOMAINS[2], x: 300, y: 140 },
  { ...DOMAINS[3], x: 60,  y: 490 },
  { ...DOMAINS[4], x: 180, y: 555 },
  { ...DOMAINS[5], x: 300, y: 490 },
];

/** Hub exit — slightly above geometric center to tuck under Maze Man. */
const HX = 180, HY = 312;

/**
 * Hand-tuned orthogonal “maze corridor” routes: each branch has its own weave
 * so corridors read as paths through walls, not plumbing elbows.
 */
const MAZE_WAYPOINTS = {
  attention: [
    [HX, HY], [132, HY], [132, 272], [88, 272], [88, 208], [52, 208], [52, 162], [60, 162], [60, 140],
  ],
  speed: [
    [HX, HY], [180, 268], [218, 268], [218, 196], [198, 196], [198, 132], [180, 132], [180, 78],
  ],
  memory: [
    [HX, HY], [210, HY], [210, 244], [284, 244], [284, 196], [318, 196], [318, 162], [300, 162], [300, 140],
  ],
  language: [
    [HX, HY], [180, 372], [100, 372], [100, 438], [58, 438], [58, 478], [60, 478], [60, 490],
  ],
  reasoning: [
    [HX, HY], [180, 388], [124, 388], [124, 472], [192, 472], [192, 518], [180, 518], [180, 555],
  ],
  flexibility: [
    [HX, HY], [252, HY], [252, 358], [306, 358], [306, 422], [322, 422], [322, 474], [300, 474], [300, 490],
  ],
};

function mazeCorridorD(domainId) {
  const pts = MAZE_WAYPOINTS[domainId];
  if (!pts?.length) return '';
  return pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
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

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.info('[Maze Man] Training radial hub (light / maze corridors) — if you see the old dark chamber, hard-reload or run scripts/dev-fresh.ps1');
    }
  }, []);

  return (
    <div style={{
      minHeight: '100%', background: L.bg, color: L.text,
      fontFamily: 'Inter, system-ui, sans-serif', position: 'relative',
      paddingBottom: 28, overflow: 'hidden',
    }}>
      <AtmosphericBgLight/>

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '64px 18px 10px', position: 'relative', zIndex: 5,
      }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <button type="button" style={chromeBtnLight()} onClick={onBack}>
            <IconBack size={18} c={L.text}/>
          </button>
        </div>
        <div style={{
          textAlign: 'center',
          fontFamily: isAr ? "'Cairo', sans-serif" : "'Bangers', cursive",
          fontSize: isAr ? 28 : 34,
          fontWeight: isAr ? 900 : 400,
          letterSpacing: isAr ? 0 : 3,
          color: '#f0e2c0',
          textTransform: 'uppercase',
          lineHeight: 1.05,
          maxWidth: 200,
          textShadow: '0 1px 0 rgba(255,220,120,0.45), 0 -1px 0 rgba(0,0,0,0.9), 0 0 18px rgba(232,172,78,0.55)',
        }}>
          {isAr ? 'تدريب' : 'Training'}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            style={{
              ...chromeBtnLight(), width: 'auto', padding: '0 12px',
              fontFamily: isAr ? "'Cairo', sans-serif" : "'Bangers', cursive",
              fontWeight: 700, fontSize: isAr ? 13 : 14,
              letterSpacing: isAr ? 0 : 2,
              color: '#e8ac4e',
            }}
            onClick={toggleLang}
          >
            {isAr ? 'EN' : 'عر'}
          </button>
        </div>
      </div>

      {/* Radial maze canvas */}
      <div style={{ position: 'relative', width: '100%', height: 660, marginTop: 10, zIndex: 4 }}>
        <svg width="360" height="660" viewBox="0 0 360 660" style={{
          position: 'absolute', inset: 0, margin: 'auto', left: 0, right: 0, overflow: 'visible',
        }}>
          <defs>
            <clipPath id="doorInnerClip">
              <path d={DOOR_INNER_D} />
            </clipPath>
            <filter id="pathGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.4" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="hubArchEmboss" x="-35%" y="-35%" width="170%" height="170%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b"/>
              <feOffset dx="0" dy="1.8" in="b" result="o"/>
              <feFlood floodColor="#1a1208" floodOpacity="0.22"/>
              <feComposite in2="o" operator="in" result="s"/>
              <feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <radialGradient id="plinthGrad" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#6b9e7a" stopOpacity="0.22"/>
              <stop offset="45%" stopColor="#e8ac4e" stopOpacity="0.1"/>
              <stop offset="100%" stopColor="#6b9e7a" stopOpacity="0"/>
            </radialGradient>
            {SHRINE_POSITIONS.map(s => (
              <linearGradient key={`arch-${s.id}`} id={`archStone-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3a2b18"/>
                <stop offset="42%" stopColor={DOMAIN_COLOR[s.id]} stopOpacity="0.5"/>
                <stop offset="100%" stopColor="#0c0805"/>
              </linearGradient>
            ))}
            {SHRINE_POSITIONS.map(s => (
              <radialGradient key={s.id} id={`sh-${s.id}`} cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor={DOMAIN_COLOR[s.id]} stopOpacity="0.42"/>
                <stop offset="65%" stopColor={DOMAIN_COLOR[s.id]} stopOpacity="0.1"/>
                <stop offset="100%" stopColor={DOMAIN_COLOR[s.id]} stopOpacity="0"/>
              </radialGradient>
            ))}
          </defs>

          {/* Faint grid */}
          <g opacity="1">
            {Array.from({ length: 13 }).map((_, i) => (
              <line key={`h${i}`} x1="0" x2="360" y1={i * 52} y2={i * 52} stroke={L.grid} strokeWidth="0.6"/>
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 52} x2={i * 52} y1="0" y2="660" stroke={L.grid} strokeWidth="0.6"/>
            ))}
          </g>

          {/* Central plinth glow */}
          <circle cx={CX} cy={CY} r="100" fill="url(#plinthGrad)"/>

          {/* Rune rings */}
          <circle cx={CX} cy={CY} r="70" fill="none" stroke="#6b9e7a" strokeWidth="1" opacity="0.35" strokeDasharray="2 5"/>
          <circle cx={CX} cy={CY} r="54" fill="none" stroke="#b07d1e" strokeWidth="0.9" opacity="0.45"/>
          <circle cx={CX} cy={CY} r="42" fill="none" stroke="#9c8a70" strokeWidth="0.6" opacity="0.4"/>

          {/* Rune ticks */}
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const r1 = 70, r2 = i % 4 === 0 ? 76 : 73;
            return <line key={i}
              x1={CX + Math.cos(a) * r1} y1={CY + Math.sin(a) * r1}
              x2={CX + Math.cos(a) * r2} y2={CY + Math.sin(a) * r2}
              stroke="#6b9e7a" strokeWidth="1" opacity={i % 4 === 0 ? 0.55 : 0.28}/>;
          })}

          {/* Maze corridors — thin grid paths with junctions (not pipe elbows) */}
          {SHRINE_POSITIONS.map(s => {
            const col = DOMAIN_COLOR[s.id];
            const isHovered = hovered === s.id;
            const d = mazeCorridorD(s.id);
            const wpts = MAZE_WAYPOINTS[s.id] ?? [];
            const junctions = wpts.slice(1, -1);
            const wCorridor = isHovered ? 2.85 : 2.15;
            const wFloor = isHovered ? 12 : 9;
            const dashPattern = '6 5';
            return (
              <g key={`path-${s.id}`}>
                <path
                  d={d}
                  fill="none"
                  stroke={col}
                  strokeWidth={wFloor}
                  strokeLinecap="butt"
                  strokeLinejoin="miter"
                  strokeMiterlimit="8"
                  opacity={isHovered ? 0.14 : 0.08}
                />
                <path
                  d={d}
                  fill="none"
                  stroke={col}
                  strokeWidth={wCorridor + 1.6}
                  strokeLinecap="butt"
                  strokeLinejoin="miter"
                  strokeMiterlimit="8"
                  opacity={isHovered ? 0.38 : 0.22}
                />
                <path
                  d={d}
                  fill="none"
                  stroke={col}
                  strokeWidth={wCorridor}
                  strokeLinecap="butt"
                  strokeLinejoin="miter"
                  strokeMiterlimit="8"
                  opacity={isHovered ? 1 : 0.82}
                  strokeDasharray={isHovered ? '6 5' : undefined}
                >
                  {isHovered && (
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="-11"
                      dur="0.85s"
                      repeatCount="indefinite"
                    />
                  )}
                </path>
                <path
                  d={d}
                  fill="none"
                  stroke="rgba(255,252,248,0.55)"
                  strokeWidth={0.9}
                  strokeLinecap="butt"
                  strokeLinejoin="miter"
                  strokeMiterlimit="8"
                  strokeDasharray={isHovered ? dashPattern : '3 4'}
                  opacity={isHovered ? 0.9 : 0.5}
                  pointerEvents="none"
                />
                {junctions.map(([jx, jy], ji) => (
                  <g key={`j-${s.id}-${ji}`}>
                    <rect
                      x={jx - 2.8} y={jy - 2.8} width={5.6} height={5.6}
                      fill="#fffefb" stroke={col} strokeWidth={1.15} rx={0.9}
                      opacity={isHovered ? 0.95 : 0.72}
                      transform={`rotate(45 ${jx} ${jy})`}
                    />
                    <circle cx={jx} cy={jy} r={1.35} fill={col} opacity={isHovered ? 0.9 : 0.65} />
                  </g>
                ))}
                <circle r={isHovered ? 3 : 2.5} fill="#fffefb" stroke={col} strokeWidth={1.5} opacity={isHovered ? 1 : 0.9}>
                  <animateMotion dur={isHovered ? '1.15s' : '2.65s'} repeatCount="indefinite" path={d}/>
                </circle>
                <circle r={isHovered ? 1.2 : 1} fill={col} opacity={isHovered ? 1 : 0.85}>
                  <animateMotion dur={isHovered ? '1.15s' : '2.65s'} repeatCount="indefinite" path={d}/>
                </circle>
              </g>
            );
          })}

          {/* Shrine portals */}
          {SHRINE_POSITIONS.map(s => {
            const col = DOMAIN_COLOR[s.id];
            const isHovered = hovered === s.id;
            return (
              <g key={s.id} style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(s.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onOpenDomain(s.id)}>
                <circle cx={s.x} cy={s.y} r={isHovered ? 56 : 46} fill={`url(#sh-${s.id})`}/>
                <g transform={`translate(${s.x - 32}, ${s.y - 38})`}>
                  <g>
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values="0 0; 0 -1.6; 0 0"
                      keyTimes="0;0.5;1"
                      dur={isHovered ? '1.5s' : '3.4s'}
                      repeatCount="indefinite"
                    />
                    <ArchShape3D
                      col={col}
                      hovered={isHovered}
                      gradId={`archStone-${s.id}`}
                      filterId="hubArchEmboss"
                    />
                    <DomainDoorArt domainId={s.id} col={col} hovered={isHovered} />
                  </g>
                </g>
                <text x={s.x} y={s.y + 32} textAnchor="middle" fill={L.text}
                  stroke="rgba(8,4,2,0.95)"
                  strokeWidth="3.5"
                  paintOrder="stroke fill"
                  style={{
                    fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', 'Nunito', sans-serif",
                    fontSize: isAr ? 12.5 : 14,
                    fontWeight: isAr ? 800 : 400,
                    letterSpacing: isAr ? 0 : 0.35,
                  }}>
                  {domainDoorLabel(s.id, isAr)}
                </text>
              </g>
            );
          })}

          {/* Central plinth */}
          <circle cx={CX} cy={CY + 16} r="42" fill="none" stroke="#6b9e7a" strokeWidth="1.2" opacity="0.55"/>
          <circle cx={CX} cy={CY + 16} r="30" fill="#e8ac4e" opacity="0.08"/>
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return <circle key={i}
              cx={CX + Math.cos(a) * 42} cy={CY + 16 + Math.sin(a) * 42}
              r="2" fill="#b07d1e" opacity={0.65}/>;
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
              r={0.8 + (i % 3) * 0.4} fill="#e8ac4e" opacity={op * 0.42}/>;
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
            display: 'inline-block', padding: '8px 16px', borderRadius: 100,
            background: 'linear-gradient(180deg, #1f160c 0%, #150e08 100%)',
            border: `1.5px solid ${DOMAIN_COLOR[hovered]}`,
            boxShadow: `0 4px 16px rgba(0,0,0,0.7), 0 0 18px ${DOMAIN_COLOR[hovered]}55, inset 0 1px 0 rgba(220,170,70,0.12)`,
            fontSize: 12, color: L.text, letterSpacing: 0.2,
            maxWidth: 'min(92vw, 340px)',
          }}>
            <span style={{
              color: DOMAIN_COLOR[hovered],
              fontWeight: 900,
              fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', sans-serif",
              letterSpacing: isAr ? 0 : 0.5,
            }}>
              {domainDoorLabel(hovered, isAr)}
            </span>
            <span style={{ color: L.textMuted, margin: '0 8px' }}>·</span>
            <span style={{ color: L.textMuted, fontWeight: 600 }}>{DOMAINS.find(d => d.id === hovered).desc}</span>
          </div>
        </div>
      )}
    </div>
  );
}
