import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import GamePiece from '../../../../shared/GamePiece';
import '../../../../shared/game2d.css';
import './cancelBoard2d.css';

/*
 * CancelBoard2D — the Cancellation Task board.
 *
 * Replaces Cancel3DProto.jsx. That scene was WebGL, but the board it drew was
 * flat and face-on: boardGroup.rotation was re-zeroed every frame, every piece
 * sat at z=0, and the camera looked straight down Z. It could never be anything
 * else, because this is a visual-search test — perspective foreshortening would
 * change shape identity (a tilted square reads as a diamond, and `diamond` is in
 * the shape set), items at different depths would subtend different visual
 * angles, and edge items would become harder than centre ones, which corrupts
 * the Center-of-Cancellation and search-organisation metrics the game computes.
 * So the 3D was paying a renderer, a bloom pass and raycasting to produce a
 * softer version of this. This is the same board, drawn properly.
 *
 * CONTROLLED view, exactly as before: it owns no game logic. index.jsx runs the
 * modes, timer, scoring, trialLog, XP, assessment and staircase, and passes:
 *   - `round`       current round ({ cells, grid, ... }) — reloads the board
 *   - `cells`       live cell array (tapped/feedback) — drives the piece states
 *   - `interactive` whether taps are accepted right now
 *   - `onTapCell`   called with the tapped index; the parent scores it
 *
 * Colour here is the TASK, not decoration: cell.fill is an Okabe-Ito stimulus
 * colour (GAME_STIMULUS) and the player is often searching for a specific one.
 * So pieces render with their own colour while idle, and only take a palette
 * state colour once they have something to say. See visualFor() in board2d.js.
 */

/** cell → the shared kit's piece state. */
function stateOf(cell) {
  if (!cell?.tapped) return 'idle';
  switch (cell.feedback) {
    // Assessment is feedback-free by design (clinical cancellation gives no
    // correctness cue), so hits and false alarms both dim to the SAME neutral
    // state — nothing here may reveal which one it was.
    case 'mark': return 'spent';
    case 'bad': return 'wrong';
    default: return 'correct';
  }
}

export default function CancelBoard2D({
  cells, round, interactive, onTapCell, isAr, boardApiRef,
}) {
  const wrapRef = useRef(null);
  const fitRef = useRef(null);
  const cellRefs = useRef([]);
  const [pieceSize, setPieceSize] = useState(56);

  const grid = round?.grid || 5;
  const n = cells?.length || 0;

  /* Fit the grid to the box. The board is square and centred; the piece size is
   * whatever makes `grid` columns fit the SHORTER axis, so the layout is
   * identical in portrait and landscape — a search task must not get easier by
   * turning the phone.
   *
   * Measured on the INNER element, not the wrapper: the wrapper carries the
   * padding that keeps the top row out from under the floating HUD, and
   * clientHeight includes padding, so measuring it there over-reports the space
   * by ~100px and the bottom row falls off the screen. */
  useLayoutEffect(() => {
    const box = fitRef.current;
    if (!box) return undefined;
    const fit = () => {
      const w = box.clientWidth || 1;
      const h = box.clientHeight || 1;
      const gap = Math.max(4, Math.min(14, Math.min(w, h) * 0.012));
      const avail = Math.min(w, h) - gap * (grid + 1);
      setPieceSize(Math.max(20, Math.floor(avail / grid)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [grid]);

  /* The tutorial coach points a hand at a specific cell and follows it, so it
   * needs that cell's position as a fraction of this box. The 3D scene answered
   * this by projecting a world position; here it is just a rect. */
  useEffect(() => {
    const api = {
      ready: true,
      cellScreenPos: (idx) => {
        const el = cellRefs.current[idx];
        const wrap = wrapRef.current;
        if (!el || !wrap) return null;
        const r = el.getBoundingClientRect();
        const b = wrap.getBoundingClientRect();
        if (!b.width || !b.height) return null;
        return {
          x: (r.left + r.width / 2 - b.left) / b.width,
          y: (r.top + r.height / 2 - b.top) / b.height,
        };
      },
    };
    if (boardApiRef) boardApiRef.current = api;
    return () => { if (boardApiRef && boardApiRef.current === api) boardApiRef.current = null; };
  }, [boardApiRef]);

  const handleTap = useCallback((idx) => {
    if (!interactive) return;
    onTapCell?.(idx);
  }, [interactive, onTapCell]);

  if (!round || !n) {
    return (
      <div className="cb2d-wrap" ref={wrapRef}>
        <div className="cb2d-fit" ref={fitRef} />
      </div>
    );
  }

  return (
    <div className="cb2d-wrap" ref={wrapRef} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="cb2d-fit" ref={fitRef}>
      <div
        className="cb2d-grid"
        style={{ gridTemplateColumns: `repeat(${grid}, ${pieceSize}px)` }}
        role="grid"
        aria-label={isAr ? 'شبكة الأشكال' : 'Shape grid'}
      >
        {cells.map((cell, idx) => {
          const state = stateOf(cell);
          return (
            <div
              key={idx}
              className={`cb2d-cell${state === 'correct' ? ' cb2d-cell--cleared' : ''}`}
              ref={(el) => { cellRefs.current[idx] = el; }}
            >
              <GamePiece
                shape={cell.shape}
                color={cell.fill}
                state={state}
                size={pieceSize}
                onTap={() => handleTap(idx)}
                disabled={!interactive || !!cell.tapped}
                ariaLabel={`${cell.shape} ${isAr ? 'شكل' : 'shape'}`}
              />
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
