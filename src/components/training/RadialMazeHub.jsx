import React, { useState, useEffect } from 'react';
import { IconBack } from '../../features/training/shared/TrainingIcons';
import { DomainIconArt } from '../../features/training/shared/DomainIcon';
import CosmosCharacter from '../../features/character/CosmosCharacter';
import AtmosphericBackground from '../shared/AtmosphericBackground';
import { DOMAIN_COLOR, DOMAINS } from './trainingData';
import { useApp } from '../../context/AppContext';
import { useThemedChrome } from '../../hooks/useThemedChrome';
import { tokens } from '../../styles/tokens';

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

/** SVG clip for inner “stone opening” (local door coords 0–64). */
const DOOR_INNER_D =
  'M 10 28 Q 10 11 32 9 Q 54 11 54 28 L 54 57 L 10 57 Z';

/** Domain-specific iconography inside each portal (centered at 0,0). */
function DomainDoorArt({ domainId, col, hovered }) {
  const dur = hovered ? 1.35 : 2.75;
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
          <DomainIconArt domainId={domainId} color={col} strokeWidth={1.65} />
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
 *                    Speed      ← spine only (north portal)
 *                      │
 *   Attention ────┬────┼────┬─── Memory    ← east/west “collector” highways
 *                 │    │    │
 *              [west│ nexus│east]
 *                 │    │    │
 *   Language  ────┴────┼────┴─── Flex
 *                      │
 *                  Reasoning    ← spine only (south portal)
 *
 * West lanes mirror east (180±60). Every vertex snaps to GRID so corridors align
 * with the modular backdrop instead of looking like stray scribbles.
 */
const HUB_NEXUS = [180, 360];
const AVATAR_R = 48;
/** CosmosCharacter box — sphere sits slightly above vertical centre. */
const HUB_PLANET_SIZE = 90;
/** New idle art: body centre ~42% down the 1.2×height box (legs below). */
const KAWKAB_BODY_FRAC = 0.42;

function hubPlanetOffsetY(size) {
  // Align planet centre with hub nexus for the default (raster) Kawkab.
  return size * 1.2 * (0.5 - KAWKAB_BODY_FRAC);
}

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

export default function RadialMazeHub({ onBack, onOpenDomain, onOpenAssessment }) {
  const { currentLang, toggleLang } = useApp();
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
        paddingBottom: 110, overflow: 'hidden',
      }}
    >
      <AtmosphericBackground strength="hub" />

      {/* Top bar */}
      <div className="app-chrome-bar" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '64px 18px 10px', position: 'relative', zIndex: 5,
      }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <button type="button" style={chrome.chromeBtn} onClick={onBack}>
            <IconBack size={18} c={chrome.text}/>
          </button>
        </div>
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
            <radialGradient id="centerGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#ffd85a" stopOpacity="0.6"/>
              <stop offset="40%" stopColor="#f5a623" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#f5a623" stopOpacity="0"/>
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

          {/* Radial corridors — smooth spokes from center avatar to each portal */}
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

          {/* Center Maze Man avatar glow */}
          <circle cx={HUB_NEXUS[0]} cy={HUB_NEXUS[1]} r={68} fill="url(#centerGlow)" opacity="0.75"/>
          <circle cx={HUB_NEXUS[0]} cy={HUB_NEXUS[1]} r={46} fill="rgba(30,20,8,0.6)" stroke="rgba(232,172,78,0.55)" strokeWidth={1.8}/>

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

        {/* Center planet — tappable "Assessment" entry, aligned to hub nexus circle */}
        <div style={{
          position: 'absolute',
          top: `${(HUB_NEXUS[1] / 660) * 100}%`,
          left: `${(HUB_NEXUS[0] / 360) * 100}%`,
          transform: `translate(-50%, calc(-50% + ${hubPlanetOffsetY(HUB_PLANET_SIZE)}px))`,
          zIndex: 8,
        }}>
          <button
            type="button"
            onClick={onOpenAssessment}
            aria-label={isAr ? 'ابدأ التقييم' : 'Start assessment'}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'block',
              filter: 'drop-shadow(0 0 22px rgba(94,200,232,0.65)) drop-shadow(0 0 48px rgba(155,232,255,0.35))',
            }}
          >
            <CosmosCharacter size={HUB_PLANET_SIZE} mood="proud" glow float />
          </button>
          <button
            type="button"
            onClick={onOpenAssessment}
            aria-label={isAr ? 'التقييم' : 'Assessment'}
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: 6,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: L.text,
              fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', 'Nunito', sans-serif",
              fontSize: isAr ? 12.5 : 14,
              fontWeight: isAr ? 800 : 400,
              letterSpacing: isAr ? 0 : 0.35,
              whiteSpace: 'nowrap',
              textShadow: '-1.4px 0 rgba(8,4,2,0.95), 1.4px 0 rgba(8,4,2,0.95), 0 -1.4px rgba(8,4,2,0.95), 0 1.4px rgba(8,4,2,0.95), 0 0 18px rgba(232,172,78,0.55)',
            }}
          >
            {isAr ? 'التقييم' : 'Assessment'}
          </button>
        </div>
      </div>

      {/* Daily Workout now lives at the end of the Assessment screen. */}

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
