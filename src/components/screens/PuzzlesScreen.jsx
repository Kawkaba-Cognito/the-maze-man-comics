import React, { useState, useEffect, useMemo, Suspense, Fragment } from 'react';
import { useApp } from '../../context/AppContext';
import { tokens } from '../../styles/tokens';
import { PUZZLE_CATEGORIES, puzzlesInCategory } from '../../features/puzzles/registry';
import { getLazyPuzzle } from '../../features/puzzles/lazyGames';
import { PUZZLE_UI } from '../../features/puzzles/shared/puzzleStrings';
import { IconBack } from '../../features/training/shared/TrainingIcons';
import AtmosphericBackground from '../shared/AtmosphericBackground';
import { useThemedChrome } from '../../hooks/useThemedChrome';
import { hasEnteredLabyrinth } from '../../features/campaign/campaignProgress';
import { lazyWithRetry } from '../../lib/lazyWithRetry';

// Void Runner isn't a category puzzle (no grid/sizes), so it's kept out of
// the shared puzzle registry — that registry defaults any entry without a
// category mapping into "Logic", which this doesn't belong in. It gets its
// own lazy loader and its own top "planet" tile instead.
const VoidRunnerLazy = lazyWithRetry(() => import('../../features/puzzles/games/void-runner'), 'void-runner');

/* ─────────────────────────────────────────────────────────────
 * PUZZLES HUB — constellation "world map".
 *
 * Shares the visual language of the Home / Training hub (atmospheric
 * background, domain planets, glowing corridors, drifting embers)
 * but lays puzzles out as a 2-column constellation.
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

/** Soft planet body used for category + puzzle nodes. */
function PuzzlePlanet({ col, hovered, bodyGradId, glowGradId, scale = 1 }) {
  const r = (hovered ? 30 : 26) * scale;
  return (
    <g>
      <ellipse cx="2" cy={r + 8} rx={r * 0.72} ry={r * 0.22} fill="rgba(10,8,16,0.28)" />
      <circle cx="0" cy="0" r={r + (hovered ? 10 : 7)} fill={`url(#${glowGradId})`} opacity={hovered ? 0.95 : 0.7} />
      <circle
        cx="0"
        cy="0"
        r={r}
        fill={`url(#${bodyGradId})`}
        stroke={col}
        strokeWidth={(hovered ? 2.2 : 1.55) * Math.min(scale, 1.4)}
      />
      <circle
        cx="0"
        cy="0"
        r={r - 0.8}
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.2"
        opacity="0.55"
      />
      <ellipse cx={-r * 0.28} cy={-r * 0.32} rx={r * 0.38} ry={r * 0.22} fill="rgba(255,255,255,0.28)" />
      <ellipse cx="0" cy="2" rx={r * 0.78} ry={r * 0.28} fill="none" stroke={col} strokeWidth="1" opacity="0.28" />
    </g>
  );
}

function planetDefs(items, prefix) {
  return items.map((item) => {
    const id = item.id;
    const col = item.accent || item.col;
    return (
      <Fragment key={`${prefix}-defs-${id}`}>
        <radialGradient id={`${prefix}Body-${id}`} cx="32%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#fff8e8" stopOpacity="0.95" />
          <stop offset="28%" stopColor={col} stopOpacity="0.95" />
          <stop offset="72%" stopColor={col} stopOpacity="0.82" />
          <stop offset="100%" stopColor="#1a1010" stopOpacity="0.92" />
        </radialGradient>
        <radialGradient id={`${prefix}Glow-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={col} stopOpacity="0.38" />
          <stop offset="55%" stopColor={col} stopOpacity="0.12" />
          <stop offset="100%" stopColor={col} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${prefix}Aura-${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={col} stopOpacity="0.36" />
          <stop offset="65%" stopColor={col} stopOpacity="0.1" />
          <stop offset="100%" stopColor={col} stopOpacity="0" />
        </radialGradient>
      </Fragment>
    );
  });
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
  const { switchTab, currentLang, toggleLang, playSfx, requestContinueMaze, setImmersive } = useApp();
  const isAr = currentLang === 'ar';
  const chrome = useThemedChrome(isAr);
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];
  const canContinue = hasEnteredLabyrinth();

  const [activeGame, setActiveGame] = useState(null);
  const [category, setCategory] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [tick, setTick] = useState(0);
  const [voidRunnerOpen, setVoidRunnerOpen] = useState(false);

  // Hide the bottom tab bar once inside a category, a puzzle, or Void
  // Runner — the tab landing (planet hall) is the only "main page".
  useEffect(() => {
    setImmersive('puzzles', !!activeGame || !!category || voidRunnerOpen);
    return () => setImmersive('puzzles', false);
  }, [activeGame, category, voidRunnerOpen, setImmersive]);

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

  /* ── Void Runner — manages its own full-screen fixed layout, no wrapper needed ── */
  if (voidRunnerOpen) {
    return (
      <Suspense fallback={<GameLoading isAr={isAr} />}>
        <VoidRunnerLazy onBack={() => setVoidRunnerOpen(false)} />
      </Suspense>
    );
  }

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

  /* ── Category landing — planet hall ── */
  if (!category) {
    const catX = [70, 180, 290];
    const GATE_CANVAS_H = 660;
    const mainCats = PUZZLE_CATEGORIES.filter((c) => c.id !== 'group');
    const groupCat = PUZZLE_CATEGORIES.find((c) => c.id === 'group');
    const GATES = [
      { id: 'void-runner', world: true, icon: '🚀', accent: '#00f5ff', label: isAr ? 'عدّاء الفراغ' : 'Void Runner', x: 180, y: 132, scale: 1.55 },
      ...mainCats.map((c, i) => ({ id: c.id, icon: c.icon, accent: c.accent, label: isAr ? c.nameAr : c.name, x: catX[i], y: 372, scale: 1 })),
      ...(groupCat ? [{ id: groupCat.id, icon: groupCat.icon, accent: groupCat.accent, label: isAr ? groupCat.nameAr : groupCat.name, x: 180, y: 540, scale: 1.2 }] : []),
    ];
    return (
      <div style={{
        position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden',
        ...chrome.shell, fontFamily: 'Outfit, system-ui, sans-serif', isolation: 'isolate',
      }}>
        <div style={{ position: 'relative', minHeight: '100%', paddingBottom: 110 }}>
          <AtmosphericBackground strength="hub" photo={false} />
          <div className="app-chrome-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '64px 18px 6px', position: 'relative', zIndex: 5 }}>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
              <button type="button" style={chrome.chromeBtn} onClick={() => { playSfx('click'); switchTab('comics'); }} aria-label={isAr ? 'رجوع' : 'Back'}>
                <IconBack size={18} c={chrome.text} />
              </button>
            </div>
            <div style={titleStyle}>{t.hubTitle}</div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" style={langBtnStyle} onClick={() => { playSfx('click'); toggleLang(); }}>{isAr ? 'EN' : 'عر'}</button>
            </div>
          </div>

          {/* Planet hall: big escape planet on top, category planets below */}
          <div className="pz-hub-canvas" style={{ position: 'relative', width: '100%', height: GATE_CANVAS_H, marginTop: 8, zIndex: 4 }}>
            <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: CANVAS_W, height: GATE_CANVAS_H, maxWidth: '100%' }}>
              <svg width={CANVAS_W} height={GATE_CANVAS_H} viewBox={`0 0 ${CANVAS_W} ${GATE_CANVAS_H}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
                <defs>
                  {planetDefs(GATES, 'gate')}
                </defs>

                {GATES.map((g) => (
                  <g key={g.id} style={{ pointerEvents: 'none' }}>
                    <circle cx={g.x} cy={g.y} r={(hovered === g.id ? 56 : 46) * g.scale} fill={`url(#gateAura-${g.id})`} />
                    <g transform={`translate(${g.x}, ${g.y})`}>
                      <g>
                        <animateTransform attributeName="transform" type="translate" values="0 0; 0 -2; 0 0" keyTimes="0;0.5;1" dur={hovered === g.id ? '1.5s' : '3.4s'} repeatCount="indefinite" />
                        <PuzzlePlanet
                          col={g.accent}
                          hovered={hovered === g.id}
                          bodyGradId={`gateBody-${g.id}`}
                          glowGradId={`gateGlow-${g.id}`}
                          scale={g.scale}
                        />
                      </g>
                    </g>
                  </g>
                ))}
              </svg>

              {GATES.map((g) => {
                const isH = hovered === g.id;
                const s = g.scale;
                const hit = 96 * s;
                return (
                  <button key={g.id} type="button"
                    onMouseEnter={() => setHovered(g.id)} onMouseLeave={() => setHovered((h) => (h === g.id ? null : h))}
                    onFocus={() => setHovered(g.id)} onBlur={() => setHovered((h) => (h === g.id ? null : h))}
                    onClick={() => { playSfx('click'); if (g.world) { setVoidRunnerOpen(true); } else { setHovered(null); setCategory(g.id); } }}
                    aria-label={g.label}
                    style={{ position: 'absolute', left: g.x, top: g.y, width: hit, height: hit + 36, transform: 'translate(-50%, -50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}
                  >
                    <span aria-hidden="true" style={{ marginTop: hit * 0.28, width: 34 * Math.min(s, 1.25), height: 34 * Math.min(s, 1.25), borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 * Math.min(s, 1.25), lineHeight: 1, background: 'rgba(255,252,246,0.16)', border: `1px solid ${g.accent}88`, boxShadow: isH ? `0 0 14px ${g.accent}99` : 'none', color: '#fffef8' }}>{g.icon}</span>
                    <span style={{ marginTop: hit * 0.22, textAlign: 'center', color: chrome.text, fontFamily: isAr ? "'Cairo', sans-serif" : "'Outfit', system-ui, sans-serif", fontSize: (g.world ? 15 : 13) * Math.min(s, 1.2), fontWeight: 800, letterSpacing: isAr ? 0 : 0.02, lineHeight: 1.1, whiteSpace: 'nowrap', textShadow: chrome.dark ? '-1.4px 0 rgba(8,4,2,0.95), 1.4px 0 rgba(8,4,2,0.95), 0 -1.4px rgba(8,4,2,0.95), 0 1.4px rgba(8,4,2,0.95), 0 0 16px rgba(232,172,78,0.5)' : '0 1px 0 rgba(255,252,246,0.85)' }}>{g.label}</span>
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
      <AtmosphericBackground strength="hub" photo={false} />

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
      <div className="pz-hub-canvas" style={{ position: 'relative', width: '100%', height: CANVAS_H, marginTop: 12, zIndex: 4, minHeight: CANVAS_H }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: CANVAS_W, height: CANVAS_H, maxWidth: '100%' }}>

          <svg width={CANVAS_W} height={CANVAS_H} viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            <defs>
              {planetDefs(NODES.map(({ puzzle }) => puzzle), 'puz')}
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

            {/* Puzzle planets + glow */}
            {NODES.map(({ puzzle, x, y }) => {
              const isHovered = hovered === puzzle.id;
              return (
                <g key={puzzle.id} style={{ pointerEvents: 'none' }}>
                  <circle cx={x} cy={y} r={isHovered ? 54 : 44} fill={`url(#puzAura-${puzzle.id})`} />
                  <g transform={`translate(${x}, ${y})`}>
                    <g>
                      <animateTransform attributeName="transform" type="translate"
                        values="0 0; 0 -2; 0 0" keyTimes="0;0.5;1"
                        dur={isHovered ? '1.5s' : '3.4s'} repeatCount="indefinite" />
                      <PuzzlePlanet
                        col={puzzle.accent}
                        hovered={isHovered}
                        bodyGradId={`puzBody-${puzzle.id}`}
                        glowGradId={`puzGlow-${puzzle.id}`}
                      />
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

          {/* HTML planet overlays — click targets, icon, label */}
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
                  width: 96, height: 132, transform: 'translate(-50%, -50%)',
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                }}
              >
                <span aria-hidden="true" style={{
                  marginTop: 28, width: 34, height: 34, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, lineHeight: 1,
                  background: 'rgba(255,252,246,0.16)',
                  border: `1px solid ${puzzle.accent}88`,
                  boxShadow: isHovered ? `0 0 14px ${puzzle.accent}99` : 'none',
                  transition: 'box-shadow 0.15s',
                  color: '#fffef8',
                }}>
                  {puzzle.icon}
                </span>
                <span style={{
                  marginTop: 22, textAlign: 'center', color: chrome.text,
                  fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', 'Nunito', sans-serif",
                  fontSize: isAr ? 12.5 : 13.5, fontWeight: isAr ? 800 : 400, letterSpacing: isAr ? 0 : 0.35,
                  lineHeight: 1.1, whiteSpace: 'nowrap',
                  textShadow: chrome.dark
                    ? '-1.4px 0 rgba(8,4,2,0.95), 1.4px 0 rgba(8,4,2,0.95), 0 -1.4px rgba(8,4,2,0.95), 0 1.4px rgba(8,4,2,0.95), 0 0 16px rgba(232,172,78,0.5)'
                    : '0 1px 0 rgba(255,252,246,0.9), 0 0 12px rgba(255,252,246,0.55)',
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
