import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import GamePiece from '../../../../shared/GamePiece';
import {
  shapeArtLabel,
  shapeArtSetForRound,
  shapeArtUrl,
} from '../../../../shared/shapeArt';
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

/**
 * `useArt` replaces abstract silhouettes with the premium flat Cosmic Atlas
 * objects in training modes. Assessment keeps its controlled abstract symbols.
 */
export default function CancelBoard2D({
  cells, round, interactive, onTapCell, isAr, boardApiRef, useArt = false,
}) {
  const wrapRef = useRef(null);
  const fitRef = useRef(null);
  const cellRefs = useRef([]);
  const [pieceSize, setPieceSize] = useState(56);
  const [gap, setGap] = useState(8);

  const cols = round?.cols || round?.grid || 5;
  const rows = round?.rows || round?.grid || cols;
  const n = cells?.length || 0;

  /* Fit a cols×rows lattice of SQUARE pieces inside the available box.
   *
   * It used to fit an N×N lattice to `Math.min(w, h)`, which is why the hard
   * tier was untappable on a phone: width binds there, so a 9×9 came out at 33px
   * pieces while ~280px of height sat unused under the board. The piece is now
   * the smaller of what each axis affords, so a portrait board (Survival deals
   * 6×8 and 7×9 — see SURVIVAL_BOARD) spends that height on piece size instead.
   *
   * Row and column gaps deliberately share one value. The old per-axis spread
   * consumed every spare portrait pixel by pulling rows apart while columns
   * stayed tight; on a tall phone the board read as separate horizontal strips
   * instead of one visual-search field. A uniform gap keeps eccentricity and
   * scan density comparable in both directions and leaves balanced outer space.
   *
   * Pieces stay SQUARE (one `size` for both axes, aspect-ratio:1 on the cell).
   * Non-square pieces would change eccentricity per axis and corrupt the
   * Center-of-Cancellation and search-organisation metrics.
   *
   * Measured on the INNER element, not the wrapper: the wrapper carries the HUD
   * reserve, and measuring that padding would overstate the playable height. */
  useLayoutEffect(() => {
    const box = fitRef.current;
    if (!box) return undefined;
    const fit = () => {
      const w = box.clientWidth || 1;
      const h = box.clientHeight || 1;
      const nextGap = Math.max(6, Math.min(14, Math.min(w, h) * 0.02));
      // `+ 1` leaves one gap of breathing room on each outside edge as well as
      // between tracks; the actual CSS grid remains centred by its box.
      const byW = Math.floor((w - nextGap * (cols + 1)) / cols);
      const byH = Math.floor((h - nextGap * (rows + 1)) / rows);
      const size = Math.max(20, Math.min(byW, byH));
      setPieceSize(size);
      setGap(nextGap);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [cols, rows]);

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

  const artSet = shapeArtSetForRound(round);

  return (
    <div className="cb2d-wrap" ref={wrapRef} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="cb2d-fit" ref={fitRef}>
      <div
        className="cb2d-grid"
        /* The measured gap is set inline so sizing and rendered geometry use
           exactly the same value at every viewport. */
        style={{
          gridTemplateColumns: `repeat(${cols}, ${pieceSize}px)`,
          gap: `${gap}px`,
        }}
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
                artUrl={useArt ? shapeArtUrl(cell.shape, artSet) : null}
                onTap={() => handleTap(idx)}
                disabled={!interactive || !!cell.tapped}
                ariaLabel={useArt
                  ? shapeArtLabel(cell.shape, isAr, artSet)
                  : `${cell.shape} ${isAr ? 'شكل' : 'shape'}`}
              />
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
