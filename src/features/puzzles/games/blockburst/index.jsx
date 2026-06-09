import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../../../context/AppContext';
import { TrainingPlayHeader } from '../../../training/shared/TrainingChrome';
import { getPuzzle } from '../../registry';
import { PUZZLE_UI } from '../../shared/puzzleStrings';
import { TUTORIAL_UI } from '../../shared/tutorialContent';
import { usePuzzleTutorial } from '../../shared/usePuzzleTutorial';
import PuzzleTutorial from '../../shared/PuzzleTutorial';
import { createRng, randomSeed } from '../../shared/rng';

const CONFIG = getPuzzle('blockburst');
const N = 8;
const BEST_KEY = 'mm_blockburst_best';
const COLORS = ['#e0795f', '#5fa9d8', '#8cc06a', '#e6bd55', '#a98fd6', '#5ec6b6', '#e58fb8'];

/* ── Shapes (base; expanded with rotations) ── */
const BASE = [
  [[0, 0]],
  [[0, 0], [0, 1]], [[0, 0], [0, 1], [0, 2]], [[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
  [[0, 0], [1, 0], [1, 1]],                         // L-tromino
  [[0, 0], [0, 1], [1, 0], [1, 1]],                 // O
  [[0, 0], [0, 1], [0, 2], [1, 0]],                 // J / L tetromino
  [[0, 0], [0, 1], [0, 2], [1, 1]],                 // T
  [[0, 1], [0, 2], [1, 0], [1, 1]],                 // S
  [[0, 0], [0, 1], [1, 1], [1, 2]],                 // Z
  [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]], // 2×3
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]], // 3×3
];

function normalize(cells) {
  const minR = Math.min(...cells.map((c) => c[0]));
  const minC = Math.min(...cells.map((c) => c[1]));
  return cells.map(([r, c]) => [r - minR, c - minC]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}
function rotate(cells) { return normalize(cells.map(([r, c]) => [c, -r])); }
function keyOf(cells) { return cells.map((c) => c.join(',')).join(';'); }

const SHAPES = (() => {
  const seen = new Set();
  const out = [];
  BASE.forEach((base) => {
    let cur = normalize(base);
    for (let i = 0; i < 4; i++) {
      const k = keyOf(cur);
      if (!seen.has(k)) {
        seen.add(k);
        const w = Math.max(...cur.map((c) => c[1])) + 1;
        const h = Math.max(...cur.map((c) => c[0])) + 1;
        out.push({ cells: cur, w, h });
      }
      cur = rotate(cur);
    }
  });
  return out;
})();

const emptyBoard = () => Array.from({ length: N }, () => new Array(N).fill(0));

function canPlace(board, cells, row, col) {
  return cells.every(([dr, dc]) => {
    const r = row + dr, c = col + dc;
    return r >= 0 && r < N && c >= 0 && c < N && board[r][c] === 0;
  });
}
function anyMove(board, cells) {
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (canPlace(board, cells, r, c)) return true;
  return false;
}
function makePiece(rng) {
  const s = SHAPES[Math.floor(rng() * SHAPES.length)];
  return { ...s, color: 1 + Math.floor(rng() * COLORS.length) };
}

export default function BlockBurst({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];
  const tutLabels = TUTORIAL_UI[isAr ? 'ar' : 'en'];
  const tut = usePuzzleTutorial('blockburst', isAr);
  useEffect(() => { tut.maybeShowTutorial(); }, [tut.maybeShowTutorial]);

  const rngRef = useRef(createRng(randomSeed()));
  const [board, setBoard] = useState(emptyBoard);
  const [tray, setTray] = useState(() => [0, 1, 2].map(() => makePiece(rngRef.current)));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => { try { return parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0; } catch { return 0; } });
  const [over, setOver] = useState(false);
  const [drag, setDrag] = useState(null); // { i, piece, x, y, target:{row,col,valid} }

  const boardRef = useRef(null);

  const restart = useCallback(() => {
    rngRef.current = createRng(randomSeed());
    setBoard(emptyBoard());
    setTray([0, 1, 2].map(() => makePiece(rngRef.current)));
    setScore(0); setOver(false); setDrag(null);
  }, []);

  // Refill the tray when empty; then test for game over against the live board.
  useEffect(() => {
    if (tray.every((p) => p == null)) {
      setTray([0, 1, 2].map(() => makePiece(rngRef.current)));
    }
  }, [tray]);

  useEffect(() => {
    if (over) return;
    const live = tray.filter(Boolean);
    if (live.length && live.every((p) => !anyMove(board, p.cells))) {
      setOver(true);
      playSfx('error');
      setBest((b) => {
        const nb = Math.max(b, score);
        try { localStorage.setItem(BEST_KEY, String(nb)); } catch { /* ignore */ }
        return nb;
      });
      awardPoints(Math.floor(score / 10));
    }
  }, [board, tray, over, score, playSfx, awardPoints]);

  // Geometry helper: pointer → board anchor cell for the dragged piece.
  const computeTarget = useCallback((piece, px, py) => {
    const el = boardRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const cell = rect.width / N;
    const left = px - (piece.w * cell) / 2;
    const top = py - (piece.h * cell) / 2 - cell * 0.9; // lift above the finger
    const col = Math.round((left - rect.left) / cell);
    const row = Math.round((top - rect.top) / cell);
    return { row, col, valid: canPlace(board, piece.cells, row, col), cell, rect };
  }, [board]);

  // Drag lifecycle via window pointer events.
  useEffect(() => {
    if (!drag) return undefined;
    const move = (e) => {
      const target = computeTarget(drag.piece, e.clientX, e.clientY);
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY, target } : d));
    };
    const up = (e) => {
      const target = computeTarget(drag.piece, e.clientX, e.clientY);
      if (target && target.valid) commitPlace(drag.i, drag.piece, target.row, target.col);
      setDrag(null);
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', () => setDrag(null));
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [drag, computeTarget]); // eslint-disable-line react-hooks/exhaustive-deps

  function commitPlace(i, piece, row, col) {
    const b = board.map((row2) => row2.slice());
    piece.cells.forEach(([dr, dc]) => { b[row + dr][col + dc] = piece.color; });
    // clear full rows + columns
    const fullRows = [], fullCols = [];
    for (let r = 0; r < N; r++) if (b[r].every((v) => v !== 0)) fullRows.push(r);
    for (let c = 0; c < N; c++) { let f = true; for (let r = 0; r < N; r++) if (b[r][c] === 0) { f = false; break; } if (f) fullCols.push(c); }
    fullRows.forEach((r) => { for (let c = 0; c < N; c++) b[r][c] = 0; });
    fullCols.forEach((c) => { for (let r = 0; r < N; r++) b[r][c] = 0; });
    const lines = fullRows.length + fullCols.length;
    const gained = piece.cells.length + lines * 10 + (lines > 1 ? (lines - 1) * 8 : 0);
    setBoard(b);
    setScore((s) => s + gained);
    setTray((tr) => tr.map((p, idx) => (idx === i ? null : p)));
    playSfx(lines > 0 ? 'collect' : 'click');
  }

  function startDrag(i, e) {
    if (over || !tray[i]) return;
    e.preventDefault();
    const piece = tray[i];
    const target = computeTarget(piece, e.clientX, e.clientY);
    setDrag({ i, piece, x: e.clientX, y: e.clientY, target });
  }

  return (
    <div className="ct-puzzle-screen ct-puzzle-screen--play">
      <TrainingPlayHeader isAr={isAr} title={isAr ? CONFIG.nameAr : CONFIG.name}
        subtitle={isAr ? `أفضل ${best}` : `Best ${best}`}
        onMenu={onBack} onTutorial={tut.openTutorial} tutorialAriaLabel={tutLabels.howToPlay}
        playSfx={playSfx} menuAriaLabel={t.menu} />
      <div className="ct-puzzle-play-body">
        <p className="ct-puzzle-hint">
          {isAr ? 'اسحب القطع إلى الشبكة. أكمل صفاً أو عموداً لتفجيره!' : 'Drag pieces onto the grid. Fill a full row or column to blast it!'}
        </p>
        <div className="bb-score">⚡ {score}</div>

        <div className="bb-board-wrap">
          <div ref={boardRef} className="bb-board" style={{ touchAction: 'none' }}>
            {board.map((row, r) =>
              row.map((v, c) => {
                let ghost = false;
                let bad = false;
                if (drag?.target) {
                  const { row: gr, col: gc, valid } = drag.target;
                  if (drag.piece.cells.some(([dr, dc]) => gr + dr === r && gc + dc === c)) { ghost = true; bad = !valid; }
                }
                return (
                  <div key={`${r}-${c}`} className={`bb-cell${v ? ' is-filled' : ''}${ghost ? (bad ? ' is-ghost-bad' : ' is-ghost') : ''}`}
                    style={v ? { background: COLORS[(v - 1) % COLORS.length] } : undefined} />
                );
              })
            )}
          </div>
          {over && (
            <div className="bb-over">
              <div className="bb-over-title">{isAr ? 'انتهت اللعبة' : 'Game Over'}</div>
              <div className="bb-over-score">{isAr ? `النتيجة ${score} · أفضل ${best}` : `Score ${score} · Best ${best}`}</div>
              <div className="ct-puzzle-win-actions">
                <button className="ct-training-btn ct-training-btn--pri" onClick={() => { playSfx('click'); restart(); }}>{t.playAgain}</button>
                <button className="ct-training-btn ct-training-btn--ghost" onClick={() => { playSfx('click'); onBack(); }}>{t.menu}</button>
              </div>
            </div>
          )}
        </div>

        {/* Tray */}
        <div className="bb-tray">
          {tray.map((piece, i) => (
            <div key={i} className={`bb-tray-slot${drag?.i === i ? ' is-dragging' : ''}`}
              onPointerDown={(e) => piece && startDrag(i, e)}>
              {piece && (
                <div className="bb-piece" style={{ gridTemplateColumns: `repeat(${piece.w}, 1fr)`, gridTemplateRows: `repeat(${piece.h}, 1fr)` }}>
                  {Array.from({ length: piece.h }).map((_, rr) =>
                    Array.from({ length: piece.w }).map((__, cc) => {
                      const on = piece.cells.some(([dr, dc]) => dr === rr && dc === cc);
                      return <div key={`${rr}-${cc}`} className={`bb-pcell${on ? ' on' : ''}`}
                        style={on ? { background: COLORS[(piece.color - 1) % COLORS.length] } : undefined} />;
                    })
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Floating ghost following the finger */}
      {drag && (() => {
        const cell = drag.target?.cell || 30;
        return (
          <div className="bb-drag-ghost" style={{
            left: drag.x - (drag.piece.w * cell) / 2,
            top: drag.y - (drag.piece.h * cell) / 2 - cell * 0.9,
            width: drag.piece.w * cell, height: drag.piece.h * cell,
            gridTemplateColumns: `repeat(${drag.piece.w}, 1fr)`, gridTemplateRows: `repeat(${drag.piece.h}, 1fr)`,
          }}>
            {Array.from({ length: drag.piece.h }).map((_, rr) =>
              Array.from({ length: drag.piece.w }).map((__, cc) => {
                const on = drag.piece.cells.some(([dr, dc]) => dr === rr && dc === cc);
                return <div key={`${rr}-${cc}`} style={{ background: on ? COLORS[(drag.piece.color - 1) % COLORS.length] : 'transparent', borderRadius: 4, opacity: 0.85 }} />;
              })
            )}
          </div>
        );
      })()}

      {tut.tutorialOpen && (
        <PuzzleTutorial steps={tut.steps} isAr={isAr} onClose={tut.closeTutorial} playSfx={playSfx} />
      )}
    </div>
  );
}
