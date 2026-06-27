import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import { getPuzzle } from '../../registry';
import { PUZZLE_UI } from '../../shared/puzzleStrings';
import { createRng, randomSeed } from '../../shared/rng';
import GridSizePicker, { PuzzleHint, PuzzleWinBanner, PuzzleToolbar } from '../../shared/GridSizePicker';
import { TrainingMenuBar, TrainingPlayHeader } from '../../../training/shared/TrainingChrome';
import { makeTangram, rotations, TANGRAM_COLORS } from './tangramEngine';

/*
 * Tangram (shape-fit) — refill an N×N board.
 *   • TAP a piece in the tray to ROTATE it (you see it spin).
 *   • DRAG a piece from the tray onto the board — a big copy follows your finger
 *     and a ghost snaps to where it will land (green = fits, red = no). Release
 *     to drop. Tap a placed piece to take it back.
 * Pieces are cut from a real tiling, so it's always solvable. Shared puzzle chrome.
 */

const CONFIG = getPuzzle('tangram');
const PIECES_FOR = { 4: 5, 5: 7, 6: 9 };

function PieceArt({ offs, color, u }) {
  const maxR = Math.max(...offs.map((o) => o[0])) + 1;
  const maxC = Math.max(...offs.map((o) => o[1])) + 1;
  const set = new Set(offs.map(([r, c]) => `${r},${c}`));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${maxC}, ${u}px)`, gridTemplateRows: `repeat(${maxR}, ${u}px)`, gap: 1 }}>
      {Array.from({ length: maxR * maxC }).map((_, k) => {
        const r = Math.floor(k / maxC); const c = k % maxC;
        return <div key={k} style={{ width: u, height: u, borderRadius: 2, background: set.has(`${r},${c}`) ? color : 'transparent' }} />;
      })}
    </div>
  );
}

export default function TangramGame({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];

  const [screen, setScreen] = useState('hub');
  const [size, setSize] = useState(5);
  const [pieces, setPieces] = useState([]);
  const [board, setBoard] = useState([]);
  const [solved, setSolved] = useState(false);
  const [drag, setDrag] = useState(null);     // { id, color, offs, px, py }  — floating piece
  const [preview, setPreview] = useState(null); // { cells, valid }            — board ghost

  const dragRef = useRef(null);
  const gridRef = useRef(null);
  const sizeRef = useRef(size);
  const boardRef = useRef(board);
  const piecesRef = useRef(pieces);
  const previewRef = useRef(null);
  sizeRef.current = size; boardRef.current = board; piecesRef.current = pieces; previewRef.current = preview;

  const newGame = useCallback((n, seed = randomSeed()) => {
    const rng = createRng(seed);
    const pz = makeTangram(n, n, PIECES_FOR[n] || 7, rng);
    const ps = pz.pieces.map((offs, id) => { const rots = rotations(offs); return { id, rots, rot: Math.floor(rng() * rots.length), placed: false, color: TANGRAM_COLORS[id % TANGRAM_COLORS.length] }; });
    for (let i = ps.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [ps[i], ps[j]] = [ps[j], ps[i]]; }
    setSize(n); setPieces(ps); setBoard(new Array(n * n).fill(-1)); setSolved(false); setDrag(null); setPreview(null);
  }, []);

  const cellFromClient = (x, y) => {
    const g = gridRef.current; if (!g) return -1;
    const r = g.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return -1;
    const N = sizeRef.current;
    const col = Math.min(N - 1, Math.max(0, Math.floor(((x - r.left) / r.width) * N)));
    const row = Math.min(N - 1, Math.max(0, Math.floor(((y - r.top) / r.height) * N)));
    return row * N + col;
  };

  const placementFor = (offs, cell) => {
    const N = sizeRef.current; const b = boardRef.current; const base = offs[0];
    const anchorR = Math.floor(cell / N) - base[0];
    const anchorC = (cell % N) - base[1];
    const cells = []; let valid = true;
    for (const [dr, dc] of offs) {
      const rr = anchorR + dr; const cc = anchorC + dc;
      if (rr < 0 || rr >= N || cc < 0 || cc >= N) { valid = false; continue; }
      const ci = rr * N + cc;
      if (b[ci] >= 0) valid = false;
      cells.push(ci);
    }
    return { cells, valid: valid && cells.length === offs.length };
  };

  // floating drag from the tray
  useEffect(() => {
    if (!drag) return undefined;
    const move = (e) => {
      const d = dragRef.current; if (!d) return;
      if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) d.moved = true;
      setDrag((g) => (g ? { ...g, px: e.clientX, py: e.clientY } : g));
      const cell = cellFromClient(e.clientX, e.clientY);
      setPreview(cell < 0 ? null : placementFor(d.offs, cell));
    };
    const up = () => {
      const d = dragRef.current; dragRef.current = null;
      const pv = previewRef.current;
      setDrag(null); setPreview(null);
      if (!d) return;
      if (!d.moved) { setPieces((ps) => ps.map((p) => (p.id === d.id ? { ...p, rot: (p.rot + 1) % p.rots.length } : p))); playSfx?.('click'); return; }
      if (pv && pv.valid) {
        const nb = boardRef.current.slice(); pv.cells.forEach((ci) => { nb[ci] = d.id; });
        setBoard(nb);
        setPieces((ps) => ps.map((p) => (p.id === d.id ? { ...p, placed: true } : p)));
        playSfx?.('collect');
        if (nb.every((x) => x >= 0)) { setSolved(true); playSfx?.('win'); awardPoints?.(12 + (sizeRef.current - 4) * 6); }
      } else if (pv) { playSfx?.('error'); }
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag ? drag.id : null]);

  const startDrag = (e, piece) => {
    if (solved) return; e.preventDefault();
    dragRef.current = { id: piece.id, offs: piece.rots[piece.rot], color: piece.color, sx: e.clientX, sy: e.clientY, moved: false };
    setDrag({ id: piece.id, color: piece.color, offs: piece.rots[piece.rot], px: e.clientX, py: e.clientY });
  };

  const removeAt = (cell) => {
    if (board[cell] < 0) return;
    const pid = board[cell];
    setBoard((b) => b.map((x) => (x === pid ? -1 : x)));
    setPieces((ps) => ps.map((p) => (p.id === pid ? { ...p, placed: false } : p)));
    playSfx?.('click');
  };

  const clearBoard = () => { setBoard(new Array(size * size).fill(-1)); setPieces((ps) => ps.map((p) => ({ ...p, placed: false }))); setSolved(false); setDrag(null); setPreview(null); playSfx?.('click'); };

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
          <GridSizePicker t={t} isAr={isAr} sizes={CONFIG.sizes} playSfx={playSfx} onPick={(n) => { newGame(n); setScreen('play'); }} />
        </div>
      </div>
    );
  }

  // ── PLAY ──
  const tray = pieces.filter((p) => !p.placed);
  const previewSet = preview ? new Set(preview.cells) : null;

  return (
    <div className="ct-puzzle-screen ct-puzzle-screen--play">
      <TrainingPlayHeader isAr={isAr} title={isAr ? CONFIG.nameAr : CONFIG.name} subtitle={t.gridLabel(size)} menuAriaLabel={t.menu} playSfx={playSfx} onMenu={() => setScreen('hub')} />
      <div className="ct-puzzle-play-body" style={{ justifyContent: 'flex-start', gap: 10, paddingTop: 12, overflowY: 'auto' }}>
        <PuzzleHint>{isAr ? 'اسحب قطعة إلى اللوحة لوضعها · اضغط قطعة لتدويرها' : 'Drag a piece onto the board · tap a piece to rotate'}</PuzzleHint>
        <div className="ct-puzzle-grid-wrap">
          <div ref={gridRef}
            style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, 1fr)`, gap: 3, width: `min(72vw, ${size * 50}px)`, background: '#f3ece0', border: '2px solid #cdbfa6', borderRadius: 12, padding: 6, boxShadow: '3px 3px 0 rgba(26,18,8,0.12)', userSelect: 'none', margin: '0 auto' }}
          >
            {board.map((own, i) => {
              const filled = own >= 0;
              const inPv = previewSet && previewSet.has(i);
              const bg = filled ? (pieces.find((p) => p.id === own)?.color || '#ccc') : '#fffdf8';
              return (
                <div key={i} onPointerDown={() => removeAt(i)} style={{ position: 'relative', aspectRatio: '1', background: bg, border: '1px solid #e3d6c4', borderRadius: 4, cursor: filled ? 'pointer' : 'default' }}>
                  {inPv && <div style={{ position: 'absolute', inset: 0, borderRadius: 4, background: preview.valid ? (drag?.color || '#2e8b57') : '#d23b3b', opacity: preview.valid ? 0.6 : 0.4, border: `2px solid ${preview.valid ? (drag?.color || '#2e8b57') : '#d23b3b'}` }} />}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ fontWeight: 800, fontSize: 12.5, color: '#7a6a52', textTransform: 'uppercase', letterSpacing: 1 }}>{isAr ? `القطع · ${tray.length}` : `Pieces · ${tray.length}`}</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', padding: '0 12px' }}>
          {tray.map((p) => (
            <div key={p.id}
              onPointerDown={(e) => startDrag(e, p)}
              style={{ padding: 7, borderRadius: 12, border: '2px solid #e3d6c4', background: '#fffdf8', cursor: 'grab', touchAction: 'none', opacity: drag?.id === p.id ? 0.35 : 1, boxShadow: '2px 2px 0 rgba(26,18,8,0.1)' }}
            >
              <PieceArt offs={p.rots[p.rot]} color={p.color} u={18} />
            </div>
          ))}
        </div>

        {!solved ? (
          <PuzzleToolbar t={t} playSfx={playSfx} onNew={() => newGame(size)} onReset={clearBoard} />
        ) : (
          <PuzzleWinBanner t={t} elapsed={null} playSfx={playSfx} onPlayAgain={() => newGame(size)} onChangeSize={() => setScreen('hub')} />
        )}
      </div>

      {/* big floating piece that follows the finger */}
      {drag && (
        <div style={{ position: 'fixed', left: drag.px, top: drag.py, transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 1000, opacity: 0.92, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))' }}>
          <PieceArt offs={drag.offs} color={drag.color} u={Math.round(Math.min(50, (typeof window !== 'undefined' ? window.innerWidth : 360) * 0.72 / size))} />
        </div>
      )}
    </div>
  );
}
