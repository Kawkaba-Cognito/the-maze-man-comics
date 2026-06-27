import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import { getPuzzle } from '../../registry';
import { PUZZLE_UI } from '../../shared/puzzleStrings';
import { createRng, randomSeed } from '../../shared/rng';
import GridSizePicker, { PuzzleHint, PuzzleWinBanner, PuzzleToolbar } from '../../shared/GridSizePicker';
import { TrainingMenuBar, TrainingPlayHeader } from '../../../training/shared/TrainingChrome';
import { makeFlow, isFlowSolved, FLOW_COLORS } from './flowEngine';

/*
 * Flow — connect each pair of coloured dots with a path; paths can't cross and
 * every cell must be filled. Drag from a dot to draw. Uses the shared puzzle
 * hub/chrome so it matches the rest of the suite.
 */

const CONFIG = getPuzzle('flow');
const colorsForSize = (n) => Math.min(FLOW_COLORS.length, n - 1);
const adj = (a, b, N) => { const ar = Math.floor(a / N); const ac = a % N; const br = Math.floor(b / N); const bc = b % N; return Math.abs(ar - br) + Math.abs(ac - bc) === 1; };

export default function FlowGame({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];

  const [screen, setScreen] = useState('hub'); // hub · play
  const [size, setSize] = useState(6);
  const [puzzle, setPuzzle] = useState(null);
  const [owner, setOwner] = useState([]);
  const [solved, setSolved] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const pathsRef = useRef([]);
  const drawRef = useRef(null);
  const gridRef = useRef(null);

  const dotMap = useMemo(() => {
    if (!puzzle) return [];
    const m = new Array(puzzle.N * puzzle.N).fill(-1);
    puzzle.dots.forEach(([a, b], c) => { m[a] = c; m[b] = c; });
    return m;
  }, [puzzle]);

  const newGame = useCallback((n, seed = randomSeed()) => {
    const rng = createRng(seed);
    const pz = makeFlow(n, colorsForSize(n), rng);
    const o = new Array(n * n).fill(-1);
    pz.dots.forEach(([a, b], c) => { o[a] = c; o[b] = c; });
    pathsRef.current = pz.dots.map(() => []);
    drawRef.current = null;
    setPuzzle(pz); setOwner(o); setSolved(false); setElapsed(0);
  }, []);

  useEffect(() => {
    if (screen !== 'play' || solved) return undefined;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [screen, solved]);

  const checkSolved = (o) => { if (puzzle && isFlowSolved(o, puzzle.dots, puzzle.colors, puzzle.N)) { setSolved(true); playSfx?.('win'); awardPoints?.(10 + size); } };

  const cellAt = (e) => {
    const g = gridRef.current; if (!g || !puzzle) return -1;
    const r = g.getBoundingClientRect();
    const c = Math.floor(((e.clientX - r.left) / r.width) * puzzle.N);
    const row = Math.floor(((e.clientY - r.top) / r.height) * puzzle.N);
    if (c < 0 || c >= puzzle.N || row < 0 || row >= puzzle.N) return -1;
    return row * puzzle.N + c;
  };
  const isDot = (cell) => dotMap[cell] >= 0;

  const startDraw = (cell) => {
    if (solved || cell < 0) return;
    const o = owner.slice();
    let color = -1;
    if (dotMap[cell] >= 0) {
      color = dotMap[cell];
      pathsRef.current[color].forEach((cc) => { if (!isDot(cc)) o[cc] = -1; });
      pathsRef.current[color] = [cell];
    } else if (owner[cell] >= 0) {
      color = owner[cell];
      const p = pathsRef.current[color];
      const ix = p.indexOf(cell);
      if (ix < 0) return;
      for (let i = ix + 1; i < p.length; i++) if (!isDot(p[i])) o[p[i]] = -1;
      pathsRef.current[color] = p.slice(0, ix + 1);
    } else { return; }
    drawRef.current = { color, last: cell, closed: false };
    o[cell] = color; setOwner(o); playSfx?.('click');
  };

  const stepTo = (cell) => {
    const d = drawRef.current;
    if (!d || d.closed || cell < 0) return;
    const { color, last } = d;
    if (cell === last || !adj(last, cell, puzzle.N)) return;
    const p = pathsRef.current[color];
    const o = owner.slice();
    if (p.length >= 2 && cell === p[p.length - 2]) { const removed = p.pop(); if (!isDot(removed)) o[removed] = -1; d.last = cell; setOwner(o); return; }
    const dm = dotMap[cell];
    if (dm >= 0 && dm !== color) return;
    if (o[cell] === color && !(dm === color && cell !== p[0])) return;
    if (dm === color && cell !== p[0]) { p.push(cell); o[cell] = color; d.last = cell; d.closed = true; setOwner(o); playSfx?.('collect'); checkSolved(o); return; }
    if (o[cell] >= 0 && o[cell] !== color) { const oc = o[cell]; const op = pathsRef.current[oc]; const oix = op.indexOf(cell); if (oix >= 0) { for (let i = oix; i < op.length; i++) if (!isDot(op[i])) o[op[i]] = -1; pathsRef.current[oc] = op.slice(0, oix); } }
    p.push(cell); o[cell] = color; d.last = cell; setOwner(o); checkSolved(o);
  };
  const endDraw = () => { drawRef.current = null; };

  const clearBoard = () => { if (!puzzle) return; const o = new Array(puzzle.N * puzzle.N).fill(-1); puzzle.dots.forEach(([a, b], c) => { o[a] = c; o[b] = c; }); pathsRef.current = puzzle.dots.map(() => []); setOwner(o); setSolved(false); playSfx?.('click'); };

  // ── HUB ──
  if (screen === 'hub') {
    return (
      <div className="ct-puzzle-screen ct-puzzle-screen--hub">
        <TrainingMenuBar onBack={onBack} playSfx={playSfx} variant="paper" hubSpaced
          center={<>
            <div className="ct-puzzle-hub-kicker">{t.hubTag}</div>
            <div className="ct-puzzle-hub-title" style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', cursive" }}>{isAr ? CONFIG.nameAr : CONFIG.name}</div>
          </>}
        />
        <div className="ct-puzzle-hub-body">
          <p className="ct-puzzle-hub-sub">{t.pickGridSub}</p>
          <GridSizePicker t={t} isAr={isAr} sizes={CONFIG.sizes} playSfx={playSfx} onPick={(n) => { setSize(n); newGame(n); setScreen('play'); }} />
        </div>
      </div>
    );
  }

  // ── PLAY ──
  const N = puzzle.N;
  const connectedCount = puzzle.dots.filter((dots, c) => { const pp = pathsRef.current[c]; return pp && pp.length && owner[dots[0]] === c && pp[pp.length - 1] === dots[1]; }).length;

  return (
    <div className="ct-puzzle-screen ct-puzzle-screen--play">
      <TrainingPlayHeader isAr={isAr} title={isAr ? CONFIG.nameAr : CONFIG.name} subtitle={t.gridLabel(N)} menuAriaLabel={t.menu} playSfx={playSfx} onMenu={() => setScreen('hub')} />
      <div className="ct-puzzle-play-body" style={{ justifyContent: 'flex-start', gap: 10, paddingTop: 12, overflowY: 'auto' }}>
        <PuzzleHint>{isAr ? 'اسحب من نقطة لتصل بين كل لونين دون تقاطع، واملأ كل الخانات.' : 'Drag from a dot to connect each colour pair without crossing — fill every cell.'}</PuzzleHint>
        <div className="ct-puzzle-grid-wrap">
          <div ref={gridRef}
            style={{ display: 'grid', gridTemplateColumns: `repeat(${N}, 1fr)`, width: 'min(90vw, 440px)', background: '#fffdf8', border: '2px solid #cdbfa6', borderRadius: 12, overflow: 'hidden', boxShadow: '3px 3px 0 rgba(26,18,8,0.12)', touchAction: 'none', userSelect: 'none', margin: '0 auto' }}
            onPointerDown={(e) => { e.preventDefault(); startDraw(cellAt(e)); }}
            onPointerMove={(e) => { if (drawRef.current) stepTo(cellAt(e)); }}
            onPointerUp={endDraw} onPointerLeave={endDraw} onPointerCancel={endDraw}
          >
            {owner.map((own, i) => {
              const r = Math.floor(i / N); const c = i % N;
              const col = own >= 0 ? FLOW_COLORS[own] : null;
              const dot = isDot(i);
              return (
                <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRight: c < N - 1 ? '1px solid #eadfca' : 'none', borderBottom: r < N - 1 ? '1px solid #eadfca' : 'none' }}>
                  {col && <div style={{ position: 'absolute', inset: '14%', borderRadius: 5, background: col, opacity: dot ? 1 : 0.85 }} />}
                  {dot && <div style={{ position: 'absolute', inset: '20%', borderRadius: '50%', background: FLOW_COLORS[dotMap[i]], boxShadow: '0 1px 2px rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.85)' }} />}
                </div>
              );
            })}
          </div>
        </div>
        <div className="ct-puzzle-stats">
          <span>{isAr ? `موصول ${connectedCount}/${puzzle.colors}` : `Connected ${connectedCount}/${puzzle.colors}`}</span>
          <span>{t.time(elapsed)}</span>
        </div>
        {!solved ? (
          <PuzzleToolbar t={t} playSfx={playSfx} onNew={() => newGame(N)} onReset={clearBoard} />
        ) : (
          <PuzzleWinBanner t={t} elapsed={elapsed} playSfx={playSfx} onPlayAgain={() => newGame(N)} onChangeSize={() => setScreen('hub')} />
        )}
      </div>
    </div>
  );
}
