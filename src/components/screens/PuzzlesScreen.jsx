import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useApp } from '../../context/AppContext';
import { tokens } from '../../styles/tokens';
import { PUZZLE_CATEGORIES, puzzlesInCategory } from '../../features/puzzles/registry';
import { getLazyPuzzle } from '../../features/puzzles/lazyGames';
import { PUZZLE_UI } from '../../features/puzzles/shared/puzzleStrings';
import { IconBack } from '../../features/training/shared/TrainingIcons';
import AtmosphericBackground from '../shared/AtmosphericBackground';
import { useThemedChrome } from '../../hooks/useThemedChrome';
import { hasEnteredLabyrinth } from '../../features/campaign/campaignProgress';

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
const ROW_Y = [122, 302, 482, 662, 842, 1022];
const ARCH_HALF = 32; // arch is 64 wide in local coords

/* Build a 2-column constellation layout for a given puzzle subset (one category). */
function buildLayout(puzzles) {
  const nodes = puzzles.map((puzzle, i) => ({
    puzzle,
    x: i % 2 === 0 ? COL_L : COL_R,
    y: ROW_Y[Math.floor(i / 2)],
  }));
  const nodeById = Object.fromEntries(nodes.map((n) => [n.puzzle.id, n]));
  const rows = Math.ceil(puzzles.length / 2);
  const corridors = [];
  for (let r = 0; r < rows; r++) {
    const left = nodes[r * 2];
    const right = nodes[r * 2 + 1];
    if (left && right) corridors.push({ a: left.puzzle.id, b: right.puzzle.id });
    if (r < rows - 1) {
      const nl = nodes[(r + 1) * 2];
      const nr = nodes[(r + 1) * 2 + 1];
      if (left && nr) corridors.push({ a: left.puzzle.id, b: nr.puzzle.id });
      if (right && nl) corridors.push({ a: right.puzzle.id, b: nl.puzzle.id });
    }
  }
  const canvasH = (ROW_Y[Math.max(0, Math.min(rows, ROW_Y.length) - 1)] ?? ROW_Y[0]) + 110;
  return { nodes, nodeById, corridors, canvasH };
}

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
  const { switchTab, currentLang, toggleLang, playSfx, requestEscapeRoom, requestContinueMaze } = useApp();
  const isAr = currentLang === 'ar';
  const chrome = useThemedChrome(isAr);
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];
  const canContinue = hasEnteredLabyrinth();

  const [activeGame, setActiveGame] = useState(null);
  const [category, setCategory] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [tick, setTick] = useState(0);

  const catPuzzles = useMemo(() => (category ? puzzlesInCategory(category) : []), [category]);
  const { nodes: NODES, nodeById: NODE_BY_ID, corridors: CORRIDORS, canvasH: CANVAS_H } = useMemo(() => buildLayout(catPuzzles), [catPuzzles]);
  const activeCat = category ? PUZZLE_CATEGORIES.find((c) => c.id === category) : null;

  const titleStyle = { ...chrome.title, maxWidth: 220, fontSize: isAr ? 24 : 22 };
  const langBtnStyle = chrome.langBtn;

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

  /* ── Category landing — a gate hall: 3D gate on top, 3 category gates below ── */
  if (!category) {
    const catX = [70, 180, 290];
    const GATE_CANVAS_H = 660;
    const mainCats = PUZZLE_CATEGORIES.filter((c) => c.id !== 'group');
    const groupCat = PUZZLE_CATEGORIES.find((c) => c.id === 'group');
    const GATES = [
      { id: '3d', world: true, icon: '🧭', accent: '#e8ac4e', label: isAr ? 'غرفة الهروب' : 'Escape Room', x: 180, y: 132, scale: 1.9 },
      ...mainCats.map((c, i) => ({ id: c.id, icon: c.icon, accent: c.accent, label: isAr ? c.nameAr : c.name, x: catX[i], y: 372, scale: 1 })),
      ...(groupCat ? [{ id: groupCat.id, icon: groupCat.icon, accent: groupCat.accent, label: isAr ? groupCat.nameAr : groupCat.name, x: 180, y: 540, scale: 1.3 }] : []),
    ];
    return (
      <div style={{
        position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden',
        ...chrome.shell, fontFamily: 'Outfit, system-ui, sans-serif', isolation: 'isolate',
      }}>
        <div style={{ position: 'relative', minHeight: '100%', paddingBottom: 110 }}>
          <AtmosphericBackground strength="hub" />
          <div className="app-chrome-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '64px 18px 6px', position: 'relative', zIndex: 5 }}>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
              <button type="button" style={chrome.chromeBtn} onClick={() => { playSfx('click'); switchTab('home'); }} aria-label={isAr ? 'رجوع' : 'Back'}>
                <IconBack size={18} c={chrome.text} />
              </button>
            </div>
            <div style={titleStyle}>{t.hubTitle}</div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" style={langBtnStyle} onClick={() => { playSfx('click'); toggleLang(); }}>{isAr ? 'EN' : 'عر'}</button>
            </div>
          </div>

          {/* Gate hall: one big 3D gate on top, the 3 category gates below */}
          <div style={{ position: 'relative', width: '100%', height: GATE_CANVAS_H, marginTop: 8, zIndex: 4 }}>
            <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: CANVAS_W, height: GATE_CANVAS_H }}>
              <svg width={CANVAS_W} height={GATE_CANVAS_H} viewBox={`0 0 ${CANVAS_W} ${GATE_CANVAS_H}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
                <defs>
                  <filter id="gateEmboss" x="-35%" y="-35%" width="170%" height="170%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b" />
                    <feOffset dx="0" dy="1.8" in="b" result="o" />
                    <feFlood floodColor="#1a1208" floodOpacity="0.22" />
                    <feComposite in2="o" operator="in" result="s" />
                    <feMerge><feMergeNode in="s" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                  {GATES.map((g) => (
                    <linearGradient key={`gg-${g.id}`} id={`gateArch-${g.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3a2b18" />
                      <stop offset="42%" stopColor={g.accent} stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#0c0805" />
                    </linearGradient>
                  ))}
                  {GATES.map((g) => (
                    <radialGradient key={`gh-${g.id}`} id={`gateGlow-${g.id}`} cx="0.5" cy="0.5" r="0.5">
                      <stop offset="0%" stopColor={g.accent} stopOpacity="0.42" />
                      <stop offset="65%" stopColor={g.accent} stopOpacity="0.1" />
                      <stop offset="100%" stopColor={g.accent} stopOpacity="0" />
                    </radialGradient>
                  ))}
                </defs>

                {GATES.map((g) => (
                  <g key={g.id} style={{ pointerEvents: 'none' }}>
                    <circle cx={g.x} cy={g.y} r={(hovered === g.id ? 54 : 44) * g.scale} fill={`url(#gateGlow-${g.id})`} />
                    <g transform={`translate(${g.x - 32 * g.scale}, ${g.y - 38 * g.scale}) scale(${g.scale})`}>
                      <g>
                        <animateTransform attributeName="transform" type="translate" values="0 0; 0 -1.6; 0 0" keyTimes="0;0.5;1" dur={hovered === g.id ? '1.5s' : '3.4s'} repeatCount="indefinite" />
                        <ArchShape3D col={g.accent} hovered={hovered === g.id} gradId={`gateArch-${g.id}`} filterId="gateEmboss" />
                      </g>
                    </g>
                  </g>
                ))}
              </svg>

              {GATES.map((g) => {
                const isH = hovered === g.id;
                const s = g.scale;
                return (
                  <button key={g.id} type="button"
                    onMouseEnter={() => setHovered(g.id)} onMouseLeave={() => setHovered((h) => (h === g.id ? null : h))}
                    onFocus={() => setHovered(g.id)} onBlur={() => setHovered((h) => (h === g.id ? null : h))}
                    onClick={() => { playSfx('click'); if (g.world) { requestEscapeRoom(); } else { setHovered(null); setCategory(g.id); } }}
                    aria-label={g.label}
                    style={{ position: 'absolute', left: g.x, top: g.y, width: 116 * s, height: 124 * s, transform: `translate(-50%, ${-38 * s}px)`, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                  >
                    <span aria-hidden="true" style={{ marginTop: 14 * s, width: 38 * s, height: 38 * s, borderRadius: 9 * s, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 * s, lineHeight: 1, background: `${g.accent}22`, border: `1px solid ${g.accent}66`, boxShadow: isH ? `0 0 12px ${g.accent}88` : 'none', color: g.accent }}>{g.icon}</span>
                    <span style={{ marginTop: 24 * s, textAlign: 'center', color: chrome.text, fontFamily: isAr ? "'Cairo', sans-serif" : "'Outfit', system-ui, sans-serif", fontSize: (g.world ? 16 : 13) * Math.min(s, 1.25), fontWeight: 800, letterSpacing: isAr ? 0 : 0.02, lineHeight: 1.1, whiteSpace: 'nowrap', textShadow: chrome.dark ? '-1.4px 0 rgba(8,4,2,0.95), 1.4px 0 rgba(8,4,2,0.95), 0 -1.4px rgba(8,4,2,0.95), 0 1.4px rgba(8,4,2,0.95), 0 0 16px rgba(232,172,78,0.5)' : '0 1px 0 rgba(255,252,246,0.85)' }}>{g.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {canContinue && (
            <div style={{ position: 'relative', zIndex: 5, textAlign: 'center', marginTop: 2 }}>
              <button type="button" onClick={() => { playSfx('click'); requestContinueMaze(); }}
                style={{ background: 'rgba(40,24,10,0.65)', color: '#e8ac4e', border: '1px solid #7a5420', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontFamily: isAr ? "'Cairo', sans-serif" : "'Bangers', cursive", letterSpacing: isAr ? 0 : 1, fontSize: isAr ? 13 : 14 }}>
                {isAr ? 'تابع المتاهة' : 'CONTINUE MAZE'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const hoveredPuzzle = hovered ? NODE_BY_ID[hovered]?.puzzle : null;

  /* ── Category constellation map ── */
  return (
    <div style={{
      position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden',
      ...chrome.shell, fontFamily: 'Outfit, system-ui, sans-serif', isolation: 'isolate',
    }}>
      <div style={{ position: 'relative', minHeight: '100%', paddingBottom: 110 }}>
      <AtmosphericBackground strength="hub" />

      {/* Top bar */}
      <div className="app-chrome-bar" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '64px 18px 6px', position: 'relative', zIndex: 5,
      }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <button type="button" style={chrome.chromeBtn} onClick={() => { playSfx('click'); setHovered(null); setCategory(null); }} aria-label={isAr ? 'الفئات' : 'Categories'}>
            <IconBack size={18} c={chrome.text} />
          </button>
        </div>
        <div style={titleStyle}>{activeCat ? (isAr ? activeCat.nameAr : activeCat.name) : t.hubTitle}</div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" style={langBtnStyle} onClick={() => { playSfx('click'); toggleLang(); }}>{isAr ? 'EN' : 'عر'}</button>
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
