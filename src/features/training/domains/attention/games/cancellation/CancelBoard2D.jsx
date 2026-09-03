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
 * THE PIECE SIZE CONTRACT.
 *
 * CELL_MIN is the floor on the smallest supported phone and is what makes
 * every board tappable by construction: 52px is comfortably past the 44px
 * touch minimum, and audit:fq refuses any board that cannot be dealt at it.
 * CELL_MAX stops a sparse board on a large desktop from becoming a handful of
 * dinner plates.
 *
 * GAP_MIN keeps two neighbours from ever touching — a fat-fingered tap should
 * land in dead space rather than on the wrong square, because dead space costs
 * nothing and a neighbour costs a false alarm. GAP_MAX stops a small board
 * scattering into islands once the leftover space is shared out.
 *
 * These four numbers, plus the board shapes in focusQuestData's PLAY_BOARD,
 * are the whole layout. Change one and run audit:fq.
 */
const CELL_MIN = 52;
const CELL_MAX = 108;
const GAP_MIN = 8;
const GAP_MAX = 26;

/*
 * The DENSEST board the game can deal — keep in step with PLAY_BOARD in
 * focusQuestData (hard is 6x8). The piece is sized so that THIS board fits,
 * and every smaller board then uses the same size with more space around it.
 *
 * Sizing each board independently was the obvious approach and it was subtly
 * wrong: on a short landscape window 8 rows would not fit at the screen's
 * preferred size, so hard came out at 64px while easy sat at 74px — the piece
 * changed when the tier changed, which is exactly the property this whole model
 * exists to remove. Sizing for the worst case makes it identical everywhere.
 */
const MAX_COLS = 6;
const MAX_ROWS = 8;

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

  /*
   * ⚠ THE PIECE IS A FIXED SIZE. ADDING SQUARES GROWS THE BOARD, NOT THE
   *   DIFFICULTY OF HITTING ONE.
   *
   * This used to derive the piece from the cell count — fit the lattice to the
   * box and take whatever size came out. That makes the target SHRINK every
   * time the game gets harder, which is how the hard tier ended up at 33px:
   * below the 44px touch minimum, smaller than a finger's contact patch, and
   * scoring the resulting mis-taps as attention errors.
   *
   * Now the size is chosen from the SCREEN and nothing else, so it is the same
   * on level 1 and level 100. A denser board simply occupies more of the space
   * it is given. The cell count can never make the target harder to hit — only
   * harder to FIND, which is the thing the task is supposed to measure.
   *
   *   size = clamp(CELL_MIN, min(w, h) / 8, CELL_MAX)
   *
   * ⚠ `byW`/`byH` are a SAFETY NET, not the primary path. If a board is ever
   * dense enough that it cannot fit at CELL_MIN, the piece shrinks rather than
   * overflowing the box — but audit:fq gates every dealt round against the 44px
   * minimum, so this should never fire in practice. If it does, the board data
   * is wrong, not this.
   *
   * ── Spacing ──
   * Leftover space becomes GAP rather than being left at the edges, so a small
   * board sits spread out and an dense one closes up, and the lattice always
   * reads as one field filling its space. The cap stops a 4×5 board drifting
   * into scattered islands. Row and column gaps deliberately share one value:
   * a per-axis spread pulled rows apart while columns stayed tight and the
   * board read as separate horizontal strips. One gap also keeps eccentricity
   * comparable in both directions, which the Center-of-Cancellation and
   * search-organisation metrics depend on.
   *
   * Pieces stay SQUARE (one `size`, aspect-ratio:1 on the cell) for the same
   * reason.
   *
   * Measured on the INNER element, not the wrapper: the wrapper carries the HUD
   * reserve, and measuring that padding would overstate the playable height.
   */
  useLayoutEffect(() => {
    const box = fitRef.current;
    if (!box) return undefined;
    const fit = () => {
      const w = box.clientWidth || 1;
      const h = box.clientHeight || 1;

      /* One piece size per device, independent of how many squares are on it.
         Sized against the DENSEST board rather than this one, so every tier
         renders the same square — see MAX_COLS / MAX_ROWS. */
      const screenTarget = Math.round(Math.min(w, h) / 8);
      const fitsMaxW = Math.floor((w - GAP_MIN * (MAX_COLS + 1)) / MAX_COLS);
      const fitsMaxH = Math.floor((h - GAP_MIN * (MAX_ROWS + 1)) / MAX_ROWS);
      const target = Math.max(
        CELL_MIN,
        Math.min(CELL_MAX, screenTarget, fitsMaxW, fitsMaxH),
      );
      // Safety net only: a board denser than MAX would otherwise overflow.
      const byW = Math.floor((w - GAP_MIN * (cols + 1)) / cols);
      const byH = Math.floor((h - GAP_MIN * (rows + 1)) / rows);
      const size = Math.max(20, Math.min(target, byW, byH));

      // Spend what is left on the spaces between, equally on both axes.
      const gapW = (w - cols * size) / (cols + 1);
      const gapH = (h - rows * size) / (rows + 1);
      const nextGap = Math.max(GAP_MIN, Math.min(GAP_MAX, Math.min(gapW, gapH)));

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
          /* ⚠ SIZE IN PX, next to fractions, on purpose — see the note on
             `sameSpot` in shared/tutorials/coach/anchors.js. The hand sizes
             itself from this. Without it the pointer stays a fixed 54px against
             a 57px tile: measured at a 0.95 width ratio, with its 87px body
             covering the tile below, on a board whose whole point is comparing
             a shape against its neighbours. */
          tw: r.width,
          th: r.height,
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
