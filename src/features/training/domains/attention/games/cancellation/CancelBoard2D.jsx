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

/*
 * How far a gap may grow, as a fraction of a cell.
 *
 * This is the one number that decides how much of a tall phone the board fills,
 * and it is a trade, not a preference. At 0.35 a 412x900 phone left ~130px dead
 * above the grid and ~185px below it; 0.5 closes most of that (board 400x400 ->
 * ~400x600) while keeping every cell square and every object undistorted.
 *
 * It cannot go much higher. The gap only grows on the axis with slack, so on a
 * phone the rows spread while the columns stay tight — past roughly half a cell
 * the five rows stop reading as one lattice and start reading as five separate
 * strips, which changes the scan pattern far more than the extra spacing does.
 * Raise this and check a 5x5 on a tall phone before believing it.
 */
const GAP_CAP = 0.5;

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
  const [gaps, setGaps] = useState({ x: 6, y: 6 });

  const grid = round?.grid || 5;
  const n = cells?.length || 0;

  /* Fit the grid to the box.
   *
   * CELL SIZE still comes from the SHORTER axis, unchanged and deliberately so:
   * the pieces stay square and identical, and a search task must not get easier
   * by turning the phone. A 5x5 grid on a 412px-wide phone therefore tops out at
   * ~76px cells no matter how much height is free.
   *
   * SPACING is now per-axis, and that is the new part. It used to be derived
   * from min(w, h) too, so the short axis dictated the gap on BOTH axes and all
   * the surplus on the long axis became dead margin — measured on a 412x900
   * phone, a 400x400 board floating in 740px of space with 340px unusable.
   * Splitting the gap lets each axis spread into its own slack: the board became
   * 400x540 on that phone and 696x533 on a laptop, using space that was empty
   * before, WITHOUT stretching anything. Cells keep aspect-ratio 1, so no shape
   * is distorted — only the distance between them changes.
   *
   * The cap is what keeps this honest. Unbounded, the phone's 740px would push
   * row spacing to ~60px against ~5px between columns, and five rows that far
   * apart stop reading as a grid and start reading as five separate strips —
   * which would change the scan pattern far more than the spacing itself. A gap
   * may not exceed 35% of a cell, so the lattice always stays a lattice.
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
      const base = Math.max(4, Math.min(14, Math.min(w, h) * 0.012));
      const size = Math.max(20, Math.floor((Math.min(w, h) - base * (grid + 1)) / grid));
      /* Whatever an axis has left over after the cells, shared across its gaps.
       * Divided by grid - 1, not grid + 1: a CSS `gap` sits BETWEEN tracks, so a
       * 5-column grid has 4 of them, not 6. The +1 form under-fills the axis by
       * a third — harmless while the cap below is binding, wrong the moment it
       * is not (a wide grid on a short screen). */
      const spread = (extent) => Math.min(
        size * GAP_CAP,
        Math.max(base, (extent - size * grid) / Math.max(1, grid - 1)),
      );
      setPieceSize(size);
      setGaps({ x: spread(w), y: spread(h) });
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

  const artSet = shapeArtSetForRound(round);

  return (
    <div className="cb2d-wrap" ref={wrapRef} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="cb2d-fit" ref={fitRef}>
      <div
        className="cb2d-grid"
        /* Gaps are set here, not in CSS. The stylesheet's `gap` was a viewport
           unit, which cannot see this box's real slack — and a CSS gap would
           also silently disagree with the value the fit above used to compute
           the cell size, so the board would not land where it was measured. */
        style={{
          gridTemplateColumns: `repeat(${grid}, ${pieceSize}px)`,
          columnGap: `${gaps.x}px`,
          rowGap: `${gaps.y}px`,
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
