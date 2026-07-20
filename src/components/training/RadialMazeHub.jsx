import React, { useState, useEffect } from 'react';
import { DomainIconArt } from '../../features/training/shared/DomainIcon';
import UniverseStage from '../shared/UniverseStage';
import { DOMAIN_COLOR, DOMAINS } from './trainingData';
import { useApp } from '../../context/AppContext';
import { useThemedChrome } from '../../hooks/useThemedChrome';
import { tokens } from '../../styles/tokens';
import { domainPlanetUrl } from '../../lib/planetIcons';

/** Stagger so the six worlds don't breathe in lockstep. */
const PLANET_PHASE = {
  attention: 0,
  speed: 0.55,
  memory: 1.1,
  language: 1.65,
  reasoning: 2.2,
  flexibility: 2.75,
};

/** Local alias kept for in-file readability — values come from the central token set. */
const L = {
  bg: tokens.bg,
  text: tokens.text,
  textMuted: tokens.textMuted,
  paper: tokens.stone,
  paperEdge: tokens.stoneEdge,
  shadow: 'rgba(0, 0, 0, 0.55)',
  /** Slightly softer so modular grid reads as structure, not noise */
  grid: 'rgba(232, 172, 78, 0.045)',
};

const DOMAIN_LABEL_AR = {
  attention: 'انتباه',
  speed: 'سرعة',
  memory: 'ذاكرة',
  language: 'لغة',
  reasoning: 'تفكير',
  flexibility: 'مرونة',
};

/** Short, friendly planet captions (EN). */
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

/** Soft surface markings so each domain planet feels distinct. */
function PlanetMarkings({ domainId, col }) {
  switch (domainId) {
    case 'attention':
      return (
        <>
          <ellipse cx="0" cy="-6" rx="14" ry="7" fill="none" stroke={col} strokeWidth="1.1" opacity="0.45" />
          <ellipse cx="0" cy="8" rx="11" ry="5" fill="none" stroke={col} strokeWidth="0.9" opacity="0.3" />
        </>
      );
    case 'speed':
      return (
        <>
          <path d="M -16 -4 Q -2 -10 14 -2" fill="none" stroke={col} strokeWidth="1.2" opacity="0.4" />
          <path d="M -14 6 Q 2 0 16 8" fill="none" stroke={col} strokeWidth="1" opacity="0.28" />
        </>
      );
    case 'memory':
      return (
        <>
          <circle cx="-8" cy="-4" r="3.2" fill={col} opacity="0.28" />
          <circle cx="7" cy="5" r="4.5" fill={col} opacity="0.22" />
          <circle cx="2" cy="-9" r="2.2" fill={col} opacity="0.2" />
        </>
      );
    case 'language':
      return (
        <>
          <path d="M -15 2 C -6 -8 6 -8 15 2" fill="none" stroke={col} strokeWidth="1.1" opacity="0.35" />
          <path d="M -12 8 C -4 0 4 0 12 8" fill="none" stroke={col} strokeWidth="0.9" opacity="0.25" />
        </>
      );
    case 'reasoning':
      return (
        <>
          <circle cx="0" cy="0" r="10" fill="none" stroke={col} strokeWidth="1" opacity="0.28" />
          <circle cx="0" cy="0" r="5" fill="none" stroke={col} strokeWidth="0.85" opacity="0.35" />
        </>
      );
    case 'flexibility':
      return (
        <>
          <ellipse cx="0" cy="0" rx="16" ry="5.5" fill="none" stroke={col} strokeWidth="1.15" opacity="0.4" transform="rotate(-18)" />
          <ellipse cx="0" cy="0" rx="16" ry="5.5" fill="none" stroke={col} strokeWidth="0.85" opacity="0.22" transform="rotate(22)" />
        </>
      );
    default:
      return null;
  }
}

/** Domain planet — painted cosmos world with orbit / pulse / spark FX. */
function DomainPlanet({ domainId, col, hovered, bodyGradId, glowGradId }) {
  const r = hovered ? 34 : 29;
  const dur = hovered ? 1.35 : 3.8;
  const phase = PLANET_PHASE[domainId] ?? 0;
  const artUrl = domainPlanetUrl(domainId);
  const clipId = `rh-planet-clip-${domainId}`;
  const sparks = hovered
    ? [
        { x: -r * 1.05, y: -r * 0.55, s: 1.6 },
        { x: r * 0.95, y: -r * 0.35, s: 1.2 },
        { x: r * 0.7, y: r * 0.85, s: 1.4 },
        { x: -r * 0.55, y: r * 0.95, s: 1.1 },
        { x: 0, y: -r * 1.15, s: 1.3 },
      ]
    : [
        { x: -r * 0.95, y: -r * 0.7, s: 1.1 },
        { x: r * 0.9, y: r * 0.55, s: 0.9 },
      ];

  return (
    <g className={`rh-domain-planet${hovered ? ' is-hot' : ''}`}>
      <defs>
        <clipPath id={clipId}>
          <circle cx="0" cy="0" r={r} />
        </clipPath>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="2" cy={r + 10} rx={r * 0.82} ry={r * 0.26} fill="rgba(0,0,0,0.4)" />

      {/* Soft atmosphere bloom */}
      <circle
        cx="0" cy="0"
        r={r + (hovered ? 18 : 12)}
        fill={`url(#${glowGradId})`}
        opacity={hovered ? 1 : 0.78}
      >
        <animate
          attributeName="opacity"
          values={hovered ? '0.85;1;0.85' : '0.62;0.82;0.62'}
          dur={`${dur}s`}
          begin={`${phase}s`}
          repeatCount="indefinite"
        />
      </circle>

      {/* Dual orbital rings */}
      <g opacity={hovered ? 0.7 : 0.38}>
        <ellipse
          cx="0" cy="1" rx={r + 10} ry={(r + 10) * 0.32}
          fill="none" stroke={col} strokeWidth={hovered ? 1.45 : 0.95}
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="-22 0 0"
            to="338 0 0"
            dur={`${hovered ? 7 : 16}s`}
            begin={`${phase}s`}
            repeatCount="indefinite"
          />
        </ellipse>
        <ellipse
          cx="0" cy="0" rx={r + 7} ry={(r + 7) * 0.28}
          fill="none" stroke={col} strokeWidth={hovered ? 1.05 : 0.7}
          opacity="0.65"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="28 0 0"
            to="-332 0 0"
            dur={`${hovered ? 10 : 22}s`}
            begin={`${phase * 0.7}s`}
            repeatCount="indefinite"
          />
        </ellipse>
      </g>

      {/* Breathing body */}
      <g>
        <animateTransform
          attributeName="transform"
          type="scale"
          values="1;1.07;1"
          keyTimes="0;0.5;1"
          dur={`${dur}s`}
          begin={`${phase}s`}
          repeatCount="indefinite"
        />

        {artUrl ? (
          <g clipPath={`url(#${clipId})`}>
            <image
              href={artUrl}
              x={-r * 1.08}
              y={-r * 1.08}
              width={r * 2.16}
              height={r * 2.16}
              preserveAspectRatio="xMidYMid slice"
            />
            {/* Specular + limb darkening so flat art reads as a sphere */}
            <ellipse
              cx={-r * 0.28} cy={-r * 0.34}
              rx={r * 0.42} ry={r * 0.28}
              fill="rgba(255,252,240,0.22)"
            />
            <circle
              cx="0" cy="0" r={r}
              fill="url(#rh-planet-shade)"
            />
          </g>
        ) : (
          <>
            <circle cx="0" cy="0" r={r} fill={`url(#${bodyGradId})`} stroke={col} strokeWidth={hovered ? 2.2 : 1.55} />
            <g opacity={hovered ? 0.95 : 0.8}>
              <PlanetMarkings domainId={domainId} col={col} />
            </g>
            <ellipse cx={-r * 0.28} cy={-r * 0.32} rx={r * 0.38} ry={r * 0.22} fill="rgba(255,255,255,0.28)" />
            <DomainIconArt domainId={domainId} color="#fffef8" strokeWidth={1.7} />
          </>
        )}

        {/* Bright rim */}
        <circle
          cx="0" cy="0" r={r}
          fill="none"
          stroke={col}
          strokeWidth={hovered ? 2.1 : 1.35}
          opacity={hovered ? 0.95 : 0.55}
        />
      </g>

      {/* Expanding energy pulses */}
      <circle cx="0" cy="0" r={r + 4} fill="none" stroke={col} strokeWidth="1" opacity="0.35">
        <animate attributeName="r" values={`${r + 2};${r + 14};${r + 2}`} dur={`${dur * 1.2}s`} begin={`${phase}s`} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.45;0.04;0.45" dur={`${dur * 1.2}s`} begin={`${phase}s`} repeatCount="indefinite" />
      </circle>
      <circle cx="0" cy="0" r={r + 6} fill="none" stroke={col} strokeWidth="0.7" opacity="0.2">
        <animate attributeName="r" values={`${r + 5};${r + 18};${r + 5}`} dur={`${dur * 1.55}s`} begin={`${phase + 0.4}s`} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.32;0.02;0.32" dur={`${dur * 1.55}s`} begin={`${phase + 0.4}s`} repeatCount="indefinite" />
      </circle>

      {/* Twinkling sparkles */}
      {sparks.map((sp, i) => (
        <circle key={i} cx={sp.x} cy={sp.y} r={sp.s} fill="#fff8e8" opacity="0.55">
          <animate
            attributeName="opacity"
            values="0.15;0.9;0.15"
            dur={`${1.4 + i * 0.35}s`}
            begin={`${phase + i * 0.2}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="r"
            values={`${sp.s * 0.6};${sp.s * 1.35};${sp.s * 0.6}`}
            dur={`${1.6 + i * 0.3}s`}
            begin={`${phase + i * 0.15}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </g>
  );
}

/** 30px path lattice; every visible guide line is 60px so the map reads cleanly. */
const GRID = 30;
const GUIDE_GRID = GRID * 2;

const SHRINE_POSITIONS = [
  { ...DOMAINS[0], x: 60,  y: 180 },
  { ...DOMAINS[1], x: 180, y: 120 },
  { ...DOMAINS[2], x: 300, y: 180 },
  { ...DOMAINS[3], x: 60,  y: 480 },
  { ...DOMAINS[4], x: 180, y: 540 },
  { ...DOMAINS[5], x: 300, y: 480 },
];

/**
 * Hub-and-spoke world map (one readable topology — standard for RTS/skill trees):
 *
 *                    Speed      ← spine only (north planet)
 *                      │
 *   Attention ────┬────┼────┬─── Memory    ← east/west “collector” highways
 *                 │    │    │
 *              [west│ nexus│east]
 *                 │    │    │
 *   Language  ────┴────┼────┴─── Flex
 *                      │
 *                  Reasoning    ← spine only (south planet)
 *
 * West lanes mirror east (180±60). Every vertex snaps to GRID so corridors align
 * with the modular backdrop instead of looking like stray scribbles.
 */
const HUB_NEXUS = [180, 360];
const AVATAR_R = 42;

function mazeCorridorD(domainId) {
  const s = SHRINE_POSITIONS.find(p => p.id === domainId);
  if (!s) return '';
  const dx = s.x - HUB_NEXUS[0];
  const dy = s.y - HUB_NEXUS[1];
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / dist;
  const ny = dy / dist;
  const sx = HUB_NEXUS[0] + nx * AVATAR_R;
  const sy = HUB_NEXUS[1] + ny * AVATAR_R;
  const cpx = HUB_NEXUS[0] + dx * 0.5;
  const cpy = HUB_NEXUS[1] + dy * 0.5;
  return `M ${sx} ${sy} Q ${cpx} ${cpy} ${s.x} ${s.y}`;
}

export default function RadialMazeHub({ onOpenDomain, onOpenAssessment }) {
  const { currentLang, toggleLang, playSfx, switchTab } = useApp();
  const isAr = currentLang === 'ar';
  const chrome = useThemedChrome(isAr);
  const [hovered, setHovered] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 120);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className={`app-stage app-stage--${chrome.dark ? 'dark' : 'light'}`}
      style={{
        minHeight: '100%', ...chrome.shell,
        fontFamily: 'Outfit, system-ui, sans-serif', position: 'relative',
        paddingBottom: 110, overflowX: 'hidden', overflowY: 'visible',
      }}
    >
      <UniverseStage accent="training" dark={chrome.dark} />

      {/* Top bar — sticky so “Training” stays visible while the hub scrolls */}
      <div className="app-chrome-bar" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'max(14px, env(safe-area-inset-top)) 18px 12px',
        position: 'sticky', top: 0, zIndex: 20,
        background: chrome.dark
          ? 'linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 65%, rgba(0,0,0,0) 100%)'
          : 'linear-gradient(180deg, rgba(255,252,246,0.94) 0%, rgba(255,252,246,0.78) 65%, transparent 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }} />
        <div style={{ ...chrome.title, maxWidth: 200, fontSize: isAr ? 24 : 22 }}>
          {isAr ? 'تدريب' : 'Training'}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" style={chrome.langBtn} onClick={toggleLang}>
            {isAr ? 'EN' : 'عر'}
          </button>
        </div>
      </div>

      {/* Radial maze canvas */}
      <div className="rh-hub-stage" style={{ position: 'relative', width: '100%', height: 660, marginTop: 10, zIndex: 4 }}>
        {/* Local cosmos FX — mirrors mode-planet hub atmosphere */}
        <div className="rh-hub-sky" aria-hidden="true">
          <div className="rh-hub-nebula rh-hub-nebula--a" />
          <div className="rh-hub-nebula rh-hub-nebula--b" />
          <div className="rh-hub-nebula rh-hub-nebula--c" />
          <div className="rh-hub-stars rh-hub-stars--a" />
          <div className="rh-hub-stars rh-hub-stars--b" />
          <div className="rh-hub-shoot rh-hub-shoot--1" />
          <div className="rh-hub-shoot rh-hub-shoot--2" />
          <div className="rh-hub-shoot rh-hub-shoot--3" />
          <div className="rh-hub-dust" />
        </div>

        <svg width="360" height="660" viewBox="0 0 360 660" style={{
          position: 'absolute', inset: 0, margin: 'auto', left: 0, right: 0, overflow: 'visible', zIndex: 2,
        }}>
          <defs>
            <filter id="pathGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.4" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {SHRINE_POSITIONS.map(s => {
              const col = DOMAIN_COLOR[s.id];
              return (
                <React.Fragment key={`planet-defs-${s.id}`}>
                  <radialGradient id={`planetBody-${s.id}`} cx="32%" cy="28%" r="72%">
                    <stop offset="0%" stopColor="#fff8e8" stopOpacity="0.95" />
                    <stop offset="28%" stopColor={col} stopOpacity="0.95" />
                    <stop offset="72%" stopColor={col} stopOpacity="0.82" />
                    <stop offset="100%" stopColor="#1a1010" stopOpacity="0.92" />
                  </radialGradient>
                  <radialGradient id={`planetGlow-${s.id}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={col} stopOpacity="0.55" />
                    <stop offset="45%" stopColor={col} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={col} stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id={`sh-${s.id}`} cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0%" stopColor={col} stopOpacity="0.48" />
                    <stop offset="55%" stopColor={col} stopOpacity="0.14" />
                    <stop offset="100%" stopColor={col} stopOpacity="0" />
                  </radialGradient>
                </React.Fragment>
              );
            })}
            <radialGradient id="centerGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#ffd85a" stopOpacity="0.6"/>
              <stop offset="40%" stopColor="#f5a623" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#f5a623" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="rh-planet-shade" cx="32%" cy="28%" r="78%">
              <stop offset="0%" stopColor="#fff8e8" stopOpacity="0" />
              <stop offset="55%" stopColor="#0a0812" stopOpacity="0" />
              <stop offset="100%" stopColor="#05040a" stopOpacity="0.42" />
            </radialGradient>
            <radialGradient id="rh-assess-body" cx="34%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fff3c4" stopOpacity="0.98" />
              <stop offset="35%" stopColor="#e8ac4e" stopOpacity="0.95" />
              <stop offset="75%" stopColor="#8a5a18" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#1a1008" stopOpacity="0.98" />
            </radialGradient>
          </defs>

          {/* Sparse guide grid — enough structure to feel designed, not noisy */}
          <g opacity="1">
            {Array.from({ length: 660 / GUIDE_GRID + 1 }, (_, i) => (
              <line key={`h${i}`} x1="0" x2="360" y1={i * GUIDE_GRID} y2={i * GUIDE_GRID} stroke={L.grid} strokeWidth="0.55"/>
            ))}
            {Array.from({ length: 360 / GUIDE_GRID + 1 }, (_, i) => (
              <line key={`v${i}`} x1={i * GUIDE_GRID} x2={i * GUIDE_GRID} y1="0" y2="660" stroke={L.grid} strokeWidth="0.55"/>
            ))}
          </g>

          {/* Radial corridors — smooth spokes from center avatar to each planet */}
          {SHRINE_POSITIONS.map(s => {
            const col = DOMAIN_COLOR[s.id];
            const isHovered = hovered === s.id;
            const d = mazeCorridorD(s.id);
            const wCorridor = isHovered ? 2.6 : 1.8;
            const corridorStroke = isHovered ? col : 'rgba(232,172,78,0.6)';
            const runnerStroke = isHovered ? col : '#e8ac4e';
            return (
              <g key={`path-${s.id}`}>
                <path
                  d={d}
                  fill="none"
                  stroke={corridorStroke}
                  strokeWidth={wCorridor + 2.5}
                  strokeLinecap="round"
                  opacity={isHovered ? 0.18 : 0.06}
                />
                <path
                  d={d}
                  fill="none"
                  stroke={corridorStroke}
                  strokeWidth={wCorridor}
                  strokeLinecap="round"
                  opacity={isHovered ? 0.9 : 0.45}
                  strokeDasharray={isHovered ? '8 5' : '4 6'}
                >
                  {isHovered && (
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="-13"
                      dur="0.9s"
                      repeatCount="indefinite"
                    />
                  )}
                </path>
                <circle r={isHovered ? 3 : 2.2} fill="#fffefb" stroke={runnerStroke} strokeWidth={1.3} opacity={isHovered ? 1 : 0.6}>
                  <animateMotion dur={isHovered ? '1.2s' : '2.8s'} repeatCount="indefinite" path={d}/>
                </circle>
                <circle r={isHovered ? 1.1 : 0.8} fill={runnerStroke} opacity={isHovered ? 1 : 0.55}>
                  <animateMotion dur={isHovered ? '1.2s' : '2.8s'} repeatCount="indefinite" path={d}/>
                </circle>
              </g>
            );
          })}

          {/* Center Assessment nexus (placeholder until 3D mascot) */}
          <g
            className="rh-assess-nexus"
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            aria-label={isAr ? 'ابدأ التقييم' : 'Start assessment'}
            onClick={onOpenAssessment}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenAssessment();
              }
            }}
          >
            <circle cx={HUB_NEXUS[0]} cy={HUB_NEXUS[1]} r={72} fill="url(#centerGlow)" opacity="0.8">
              <animate attributeName="opacity" values="0.55;0.85;0.55" dur="3.6s" repeatCount="indefinite" />
            </circle>
            <circle cx={HUB_NEXUS[0]} cy={HUB_NEXUS[1]} r={38} fill="none" stroke="rgba(232,172,78,0.45)" strokeWidth="1.2">
              <animate attributeName="r" values="34;48;34" dur="3.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.55;0.08;0.55" dur="3.2s" repeatCount="indefinite" />
            </circle>
            <g>
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`0 0; 0 -2; 0 0`}
                keyTimes="0;0.5;1"
                dur="3.8s"
                repeatCount="indefinite"
              />
              <circle
                cx={HUB_NEXUS[0]} cy={HUB_NEXUS[1]} r={30}
                fill="url(#rh-assess-body)"
                stroke="rgba(255,220,140,0.85)"
                strokeWidth="1.8"
                filter="url(#pathGlow)"
              />
              <ellipse
                cx={HUB_NEXUS[0] - 8} cy={HUB_NEXUS[1] - 10}
                rx="11" ry="7"
                fill="rgba(255,248,220,0.35)"
              />
              <ellipse
                cx={HUB_NEXUS[0]} cy={HUB_NEXUS[1] + 2}
                rx="42" ry="13"
                fill="none"
                stroke="rgba(232,172,78,0.5)"
                strokeWidth="1.1"
                opacity="0.55"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`-12 ${HUB_NEXUS[0]} ${HUB_NEXUS[1]}`}
                  to={`348 ${HUB_NEXUS[0]} ${HUB_NEXUS[1]}`}
                  dur="14s"
                  repeatCount="indefinite"
                />
              </ellipse>
            </g>
            <text
              x={HUB_NEXUS[0]}
              y={HUB_NEXUS[1] + 52}
              textAnchor="middle"
              fill={chrome.text}
              stroke={chrome.dark ? 'rgba(8,4,2,0.9)' : 'rgba(255,252,246,0.9)'}
              strokeWidth="3.2"
              paintOrder="stroke fill"
              style={{
                fontFamily: isAr ? "'Cairo', sans-serif" : "'Outfit', system-ui, sans-serif",
                fontSize: isAr ? 12.5 : 13.5,
                fontWeight: 800,
                letterSpacing: isAr ? 0 : 0.02,
                pointerEvents: 'none',
              }}
            >
              {isAr ? 'التقييم' : 'Assessment'}
            </text>
          </g>

          {/* Domain planets */}
          {SHRINE_POSITIONS.map(s => {
            const col = DOMAIN_COLOR[s.id];
            const isHovered = hovered === s.id;
            const phase = PLANET_PHASE[s.id] ?? 0;
            return (
              <g key={s.id} style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                aria-label={domainDoorLabel(s.id, isAr)}
                onMouseEnter={() => setHovered(s.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onOpenDomain(s.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenDomain(s.id);
                  }
                }}>
                <circle cx={s.x} cy={s.y} r={isHovered ? 64 : 52} fill={`url(#sh-${s.id})`}/>
                <g transform={`translate(${s.x}, ${s.y})`}>
                  <g>
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values="0 0; 0 -3; 0 0"
                      keyTimes="0;0.5;1"
                      dur={isHovered ? '1.4s' : '3.6s'}
                      begin={`${phase}s`}
                      repeatCount="indefinite"
                    />
                    <DomainPlanet
                      domainId={s.id}
                      col={col}
                      hovered={isHovered}
                      bodyGradId={`planetBody-${s.id}`}
                      glowGradId={`planetGlow-${s.id}`}
                    />
                  </g>
                </g>
                <text x={s.x} y={s.y + 48} textAnchor="middle" fill={chrome.text}
                  stroke={chrome.dark ? 'rgba(8,4,2,0.9)' : 'rgba(255,252,246,0.9)'}
                  strokeWidth="3.2"
                  paintOrder="stroke fill"
                  style={{
                    fontFamily: isAr ? "'Cairo', sans-serif" : "'Outfit', system-ui, sans-serif",
                    fontSize: isAr ? 12.5 : 13.5,
                    fontWeight: 800,
                    letterSpacing: isAr ? 0 : 0.02,
                  }}>
                  {domainDoorLabel(s.id, isAr)}
                </text>
              </g>
            );
          })}

          {/* Rising embers / dust */}
          {Array.from({ length: 18 }).map((_, i) => {
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

      {/* Daily Workout now lives at the end of the Assessment screen. */}

      {/* Puzzles now lives inside Training — a distinct, lower-pressure
          "break" entry rather than one of the domain planets, since it isn't
          a tracked/scored exercise the way the 6 domains are. */}
      <div style={{ position: 'relative', zIndex: 6, display: 'flex', justifyContent: 'center', marginTop: -18 }}>
        <button
          type="button"
          onClick={() => { playSfx('click'); switchTab('puzzles'); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 100,
            background: 'linear-gradient(180deg, #1f160c 0%, #150e08 100%)',
            border: '1.5px solid rgba(232,172,78,0.55)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(220,170,70,0.12)',
            color: L.text, cursor: 'pointer',
            fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', 'Nunito', sans-serif",
            fontSize: isAr ? 13 : 14, fontWeight: isAr ? 800 : 400, letterSpacing: isAr ? 0 : 0.3,
          }}
        >
          <span aria-hidden="true">🧩</span>
          {isAr ? 'ألغاز — استراحة' : 'Puzzles — take a break'}
        </button>
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
