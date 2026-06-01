import React, { useState, useEffect, Suspense } from 'react';
import { useApp } from '../../context/AppContext';
import { tokens } from '../../styles/tokens';
import { PUZZLE_CONFIGS } from '../../features/puzzles/registry';
import { getLazyPuzzle } from '../../features/puzzles/lazyGames';
import { PUZZLE_UI } from '../../features/puzzles/shared/puzzleStrings';
import { IconBack } from '../../features/training/shared/TrainingIcons';
import { assetUrl } from '../../lib/assetUrl';

/* ─────────────────────────────────────────────────────────────
 * PUZZLES HUB — constellation "world map".
 *
 * Shares the visual language of the Training radial hub (atmospheric
 * background, stone-arch portals, glowing corridors, drifting embers,
 * Bangers title bar) but lays the 8 puzzles out as a 2-column
 * constellation instead of a radial wheel — and has no centre figure.
 * ──────────────────────────────────────────────────────────── */

const L = {
  bg: tokens.bg,
  text: tokens.text,
  textMuted: tokens.textMuted,
  paper: tokens.stone,
  grid: 'rgba(232, 172, 78, 0.045)',
};

/* Fixed design canvas — scales like the training SVG (width 360, centred). */
const CANVAS_W = 360;
const COL_L = 100;
const COL_R = 260;
const ROW_Y = [122, 302, 482, 662];
const CANVAS_H = ROW_Y[ROW_Y.length - 1] + 110;
const ARCH_HALF = 32; // arch is 64 wide in local coords

/* Place the 8 puzzles row-by-row, left then right. */
const NODES = PUZZLE_CONFIGS.map((puzzle, i) => ({
  puzzle,
  x: i % 2 === 0 ? COL_L : COL_R,
  y: ROW_Y[Math.floor(i / 2)],
}));

const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.puzzle.id, n]));

/* Corridor lattice: per-row horizontals + an X between each adjacent row. */
function buildCorridors() {
  const lines = [];
  for (let r = 0; r < ROW_Y.length; r++) {
    const left = NODES[r * 2];
    const right = NODES[r * 2 + 1];
    if (left && right) lines.push({ a: left.puzzle.id, b: right.puzzle.id });
    if (r < ROW_Y.length - 1) {
      const nl = NODES[(r + 1) * 2];
      const nr = NODES[(r + 1) * 2 + 1];
      if (left && nr) lines.push({ a: left.puzzle.id, b: nr.puzzle.id });
      if (right && nl) lines.push({ a: right.puzzle.id, b: nl.puzzle.id });
    }
  }
  return lines;
}
const CORRIDORS = buildCorridors();

/* SVG clip for the inner "stone opening" (local door coords 0–64). */
const DOOR_INNER_D = 'M 10 28 Q 10 11 32 9 Q 54 11 54 28 L 54 57 L 10 57 Z';

/** Stone arch: offset shadow, graded façade, deep recess, lintel highlight. */
function ArchShape3D({ col, hovered, gradId, filterId }) {
  const sw = hovered ? 2.45 : 1.65;
  return (
    <g filter={`url(#${filterId})`}>
      <path d="M 3 30 Q 3 5 34 5 Q 65 5 65 30 L 65 69 L 3 69 Z" fill="rgba(20,18,16,0.16)" transform="translate(3, 4)" />
      <path d="M 0 28 Q 0 0 32 0 Q 64 0 64 28 L 64 66 L 0 66 Z" fill={`url(#${gradId})`} stroke={col} strokeWidth={sw} />
      <path d="M 5 28 Q 5 6 32 4 Q 59 6 59 28 L 59 61 L 5 61 Z" fill="rgba(12,10,8,0.18)" />
      <path d="M 10 28 Q 10 11 32 9 Q 54 11 54 28 L 54 57 L 10 57 Z" fill={L.paper} opacity="0.94" />
      <path d="M 9 28 Q 9 10 32 8 Q 55 10 55 28" fill="none" stroke="rgba(255,255,255,0.72)" strokeWidth="1.35" strokeLinecap="round" />
      <path d="M 1 28 Q 1 2 32 2 Q 63 2 63 28" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1.1" opacity="0.85" />
      <rect x="29" y="-2" width="6" height="8" rx="1.2" fill={col} opacity="0.88" />
      <rect x="30.5" y="-0.5" width="3" height="4.5" fill="rgba(255,255,255,0.4)" rx="0.5" />
    </g>
  );
}

function AtmosphericBg() {
  const isDesktop = typeof window !== 'undefined' && window.matchMedia?.('(min-width: 768px)').matches;
  const bgUrl = isDesktop
    ? assetUrl('Assets/bg-training-desktop.png')
    : assetUrl('Assets/bg-training-mobile.png');
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0, backgroundColor: L.bg,
        backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover',
        backgroundPosition: isDesktop ? 'center center' : 'center top',
        zIndex: 0, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(5,5,15,0.3) 0%, rgba(10,4,30,0.2) 42%, rgba(5,5,15,0.45) 100%)',
        zIndex: 1, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 58% 46% at 50% 39%, rgba(255,214,132,0.16) 0%, rgba(255,214,132,0.04) 44%, transparent 72%)',
        zIndex: 2, pointerEvents: 'none', mixBlendMode: 'screen',
      }} />
    </>
  );
}

function chromeBtn() {
  return {
    width: 34, height: 34, borderRadius: 6, border: '1.5px solid #9a6828',
    background: 'linear-gradient(170deg, #3e1a06 0%, #5e2a0c 50%, #3e1a06 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: L.text, cursor: 'pointer',
    boxShadow: 'inset 0 1px 0 rgba(220,170,70,0.35), inset 0 -1px 0 rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.6)',
  };
}

function GameLoading({ isAr }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: tokens.trainingPaletteSurface, color: '#5c534c',
      fontFamily: "'Outfit', system-ui, sans-serif", fontSize: 14, letterSpacing: 1.5,
    }}>
      {isAr ? 'جارِ التحميل…' : 'Loading…'}
    </div>
  );
}

export default function PuzzlesScreen() {
  const { switchTab, currentLang, toggleLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];

  const [activeGame, setActiveGame] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (activeGame) return undefined;
    const id = setInterval(() => setTick((x) => x + 1), 120);
    return () => clearInterval(id);
  }, [activeGame]);

  const GameView = activeGame ? getLazyPuzzle(activeGame) : null;

  /* ── In-game view (unchanged) ── */
  if (activeGame && GameView) {
    return (
      <div style={{
        position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden',
        minHeight: 'min(100vh, 100dvh)', backgroundColor: tokens.trainingPaletteSurface, isolation: 'isolate',
      }}>
        <Suspense fallback={<GameLoading isAr={isAr} />}>
          <GameView onBack={() => setActiveGame(null)} />
        </Suspense>
      </div>
    );
  }

  const hoveredPuzzle = hovered ? NODE_BY_ID[hovered]?.puzzle : null;

  /* ── Hub / constellation map ── */
  return (
    <div style={{
      position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden',
      background: L.bg, color: L.text, fontFamily: 'Inter, system-ui, sans-serif', isolation: 'isolate',
    }}>
      <div style={{ position: 'relative', minHeight: '100%', paddingBottom: 28 }}>
      <AtmosphericBg />

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '64px 18px 6px', position: 'relative', zIndex: 5,
      }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <button type="button" style={chromeBtn()} onClick={() => { playSfx('click'); switchTab('home'); }} aria-label={isAr ? 'رجوع' : 'Back'}>
            <IconBack size={18} c={L.text} />
          </button>
        </div>
        <div style={{
          textAlign: 'center',
          fontFamily: isAr ? "'Cairo', sans-serif" : "'Bangers', cursive",
          fontSize: isAr ? 28 : 34, fontWeight: isAr ? 900 : 400,
          letterSpacing: isAr ? 0 : 3, color: '#f0e2c0', textTransform: 'uppercase',
          lineHeight: 1.05, maxWidth: 220,
          textShadow: '0 1px 0 rgba(255,220,120,0.45), 0 -1px 0 rgba(0,0,0,0.9), 0 0 18px rgba(232,172,78,0.55)',
        }}>
          {t.hubTitle}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            style={{
              ...chromeBtn(), width: 'auto', padding: '0 12px',
              fontFamily: isAr ? "'Cairo', sans-serif" : "'Bangers', cursive",
              fontWeight: 700, fontSize: isAr ? 13 : 14, letterSpacing: isAr ? 0 : 2, color: '#e8ac4e',
            }}
            onClick={() => { playSfx('click'); toggleLang(); }}
          >
            {isAr ? 'EN' : 'عر'}
          </button>
        </div>
      </div>

      {/* Constellation canvas (SVG art + HTML portal overlays) */}
      <div style={{ position: 'relative', width: '100%', height: CANVAS_H, marginTop: 12, zIndex: 4 }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: CANVAS_W, height: CANVAS_H }}>

          <svg width={CANVAS_W} height={CANVAS_H} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            <defs>
              <clipPath id="puzDoorClip"><path d={DOOR_INNER_D} /></clipPath>
              <filter id="puzArchEmboss" x="-35%" y="-35%" width="170%" height="170%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b" />
                <feOffset dx="0" dy="1.8" in="b" result="o" />
                <feFlood floodColor="#1a1208" floodOpacity="0.22" />
                <feComposite in2="o" operator="in" result="s" />
                <feMerge><feMergeNode in="s" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              {NODES.map(({ puzzle }) => (
                <linearGradient key={`g-${puzzle.id}`} id={`puzArch-${puzzle.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3a2b18" />
                  <stop offset="42%" stopColor={puzzle.accent} stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#0c0805" />
                </linearGradient>
              ))}
              {NODES.map(({ puzzle }) => (
                <radialGradient key={`sh-${puzzle.id}`} id={`puzGlow-${puzzle.id}`} cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0%" stopColor={puzzle.accent} stopOpacity="0.42" />
                  <stop offset="65%" stopColor={puzzle.accent} stopOpacity="0.1" />
                  <stop offset="100%" stopColor={puzzle.accent} stopOpacity="0" />
                </radialGradient>
              ))}
            </defs>

            {/* Sparse guide grid */}
            <g>
              {Array.from({ length: Math.ceil(CANVAS_H / 60) + 1 }, (_, i) => (
                <line key={`h${i}`} x1="0" x2={CANVAS_W} y1={i * 60} y2={i * 60} stroke={L.grid} strokeWidth="0.55" />
              ))}
              {Array.from({ length: Math.ceil(CANVAS_W / 60) + 1 }, (_, i) => (
                <line key={`v${i}`} x1={i * 60} x2={i * 60} y1="0" y2={CANVAS_H} stroke={L.grid} strokeWidth="0.55" />
              ))}
            </g>

            {/* Corridor lattice */}
            {CORRIDORS.map(({ a, b }, i) => {
              const na = NODE_BY_ID[a];
              const nb = NODE_BY_ID[b];
              const lit = hovered === a || hovered === b;
              const col = lit ? na.puzzle.accent : 'rgba(232,172,78,0.55)';
              const d = `M ${na.x} ${na.y} L ${nb.x} ${nb.y}`;
              return (
                <g key={`c${i}`}>
                  <path d={d} stroke={col} strokeWidth={lit ? 4 : 3} strokeLinecap="round" fill="none" opacity={lit ? 0.16 : 0.05} />
                  <path
                    d={d} stroke={col} strokeWidth={lit ? 1.9 : 1.3} strokeLinecap="round" fill="none"
                    opacity={lit ? 0.85 : 0.32} strokeDasharray={lit ? '8 5' : '4 7'}
                  >
                    {lit && <animate attributeName="stroke-dashoffset" from="0" to="-13" dur="0.9s" repeatCount="indefinite" />}
                  </path>
                  {lit && (
                    <circle r="2.4" fill="#fffefb" stroke={col} strokeWidth="1.2">
                      <animateMotion dur="1.2s" repeatCount="indefinite" path={d} />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Portal arches + glow */}
            {NODES.map(({ puzzle, x, y }) => {
              const isHovered = hovered === puzzle.id;
              return (
                <g key={puzzle.id} style={{ pointerEvents: 'none' }}>
                  <circle cx={x} cy={y} r={isHovered ? 54 : 44} fill={`url(#puzGlow-${puzzle.id})`} />
                  <g transform={`translate(${x - ARCH_HALF}, ${y - 38})`}>
                    <g>
                      <animateTransform attributeName="transform" type="translate"
                        values="0 0; 0 -1.6; 0 0" keyTimes="0;0.5;1"
                        dur={isHovered ? '1.5s' : '3.4s'} repeatCount="indefinite" />
                      <ArchShape3D col={puzzle.accent} hovered={isHovered} gradId={`puzArch-${puzzle.id}`} filterId="puzArchEmboss" />
                    </g>
                  </g>
                </g>
              );
            })}

            {/* Embers */}
            {Array.from({ length: 14 }).map((_, i) => {
              const seed = i * 137;
              const ex = (seed % (CANVAS_W - 40)) + 20;
              const span = CANVAS_H - 40;
              const ey = (CANVAS_H - 30) - ((tick * (3 + (i % 4)) + seed) % span);
              const op = Math.max(0, 0.6 - ((tick * (3 + (i % 4)) + seed) % span) / span);
              return (
                <circle key={i} cx={ex + Math.sin(tick / 20 + i) * 6} cy={ey} r={0.8 + (i % 3) * 0.4} fill="#e8ac4e" opacity={op * 0.42} />
              );
            })}
          </svg>

          {/* HTML portal overlays — click targets, icon, label */}
          {NODES.map(({ puzzle, x, y }) => {
            const isHovered = hovered === puzzle.id;
            return (
              <button
                key={puzzle.id}
                type="button"
                onMouseEnter={() => setHovered(puzzle.id)}
                onMouseLeave={() => setHovered((h) => (h === puzzle.id ? null : h))}
                onFocus={() => setHovered(puzzle.id)}
                onBlur={() => setHovered((h) => (h === puzzle.id ? null : h))}
                onClick={() => { playSfx('click'); setActiveGame(puzzle.gameKey); }}
                aria-label={isAr ? puzzle.nameAr : puzzle.name}
                style={{
                  position: 'absolute', left: x, top: y,
                  width: 116, height: 120, transform: 'translate(-50%, -38px)',
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}
              >
                {/* Icon tile, sits in the arch opening */}
                <span aria-hidden="true" style={{
                  marginTop: 14, width: 38, height: 38, borderRadius: 9,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, lineHeight: 1,
                  background: `${puzzle.accent}22`,
                  border: `1px solid ${puzzle.accent}66`,
                  boxShadow: isHovered ? `0 0 12px ${puzzle.accent}88` : 'none',
                  transition: 'box-shadow 0.15s',
                  color: puzzle.accent,
                }}>
                  {puzzle.icon}
                </span>
                {/* Label below the arch */}
                <span style={{
                  marginTop: 26, textAlign: 'center', color: L.text,
                  fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', 'Nunito', sans-serif",
                  fontSize: isAr ? 12.5 : 13.5, fontWeight: isAr ? 800 : 400, letterSpacing: isAr ? 0 : 0.35,
                  lineHeight: 1.1, whiteSpace: 'nowrap',
                  textShadow: '-1.4px 0 rgba(8,4,2,0.95), 1.4px 0 rgba(8,4,2,0.95), 0 -1.4px rgba(8,4,2,0.95), 0 1.4px rgba(8,4,2,0.95), 0 0 16px rgba(232,172,78,0.5)',
                }}>
                  {isAr ? puzzle.nameAr : puzzle.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hover callout */}
      {hoveredPuzzle && (
        <div style={{
          position: 'sticky', bottom: 18, left: 0, right: 0, textAlign: 'center',
          zIndex: 6, pointerEvents: 'none', padding: '0 14px',
        }}>
          <div style={{
            display: 'inline-block', padding: '8px 16px', borderRadius: 100,
            background: 'linear-gradient(180deg, #1f160c 0%, #150e08 100%)',
            border: `1.5px solid ${hoveredPuzzle.accent}`,
            boxShadow: `0 4px 16px rgba(0,0,0,0.7), 0 0 18px ${hoveredPuzzle.accent}55, inset 0 1px 0 rgba(220,170,70,0.12)`,
            fontSize: 12, color: L.text, letterSpacing: 0.2, maxWidth: 'min(92vw, 360px)',
          }}>
            <span style={{
              color: hoveredPuzzle.accent, fontWeight: 900,
              fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', sans-serif", letterSpacing: isAr ? 0 : 0.5,
            }}>
              {isAr ? hoveredPuzzle.nameAr : hoveredPuzzle.name}
            </span>
            <span style={{ color: L.textMuted, margin: '0 8px' }}>·</span>
            <span style={{ color: L.textMuted, fontWeight: 600 }}>{isAr ? hoveredPuzzle.descAr : hoveredPuzzle.desc}</span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
