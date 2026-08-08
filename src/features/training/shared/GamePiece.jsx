import React from 'react';
import { visualFor } from './board2d';
import { GAME_INK } from './gamePalette';
import { SH } from './focusQuestData';
import './game2d.css';

/*
 * GamePiece — one piece of a 2D training board, as SVG.
 *
 * The DOM counterpart of drawPiece() in board2d.js: same state→visual mapping,
 * same look. Grid games (Cancellation, Wisconsin, Raven, N-Back, Pair Match,
 * the letter grid, Spatial Stroop) use this; games with continuous motion use
 * the canvas path instead, because a hundred moving SVG nodes is slower than
 * one canvas.
 *
 * Shapes come from SH in focusQuestData — the same silhouettes the boards have
 * always used, authored in a 0..100 viewBox.
 */

/**
 * @param {{ shape?: string, state?: import('./board2d').PieceState, size?: number,
 *           color?: string, label?: string, onTap?: () => void, disabled?: boolean,
 *           ariaLabel?: string, reduced?: boolean, artUrl?: string|null }} props
 *   color  — the piece's own stimulus colour, for games where colour is the task.
 *            Applies to the idle state only; see visualFor().
 *   artUrl — OPT-IN flat illustration for this piece (see shared/shapeArt.js).
 *            Defaults to null, so every existing caller renders exactly as
 *            before; Cancellation's training modes pass it today. When set,
 *            it replaces the abstract silhouette but NOT the state chrome —
 *            ring, glyph and label still draw on top, because those carry the
 *            hit/miss feedback and the CVD redundancy that visualFor() exists to
 *            guarantee. Losing them to a prettier body would be a real
 *            accessibility regression, not a cosmetic one.
 */
export default function GamePiece({
  shape = 'circle',
  state = 'idle',
  size = 64,
  color,
  label,
  onTap,
  disabled = false,
  ariaLabel,
  reduced = false,
  artUrl = null,
}) {
  const v = visualFor(state, color);
  const markup = SH[shape] || SH.circle;
  /* SH shapes are authored in a 0..100 box. The viewBox is 150 so the ring and
   * the 1.15x cued scale have room without clipping — but the SHAPE still draws
   * at its full 100 units (SHAPE_SCALE 1), filling ~⅔ of the box.
   *
   * It is tempting to shrink the shape to "make room". Don't: that is exactly
   * what made the old 3D board look cheap — a small figure marooned in a large
   * empty disc reads as a dot, not an object, and it costs real legibility on a
   * visual-search task. The glyph and label sizes below are proportioned to a
   * full-size shape, so shrinking it silently breaks those too. */
  const box = 150;
  const mid = box / 2;
  const SHAPE_SCALE = 1;
  const s = v.scale;

  // A piece with a tap handler is always a <button>, even while disabled — so it
  // keeps its place in the tab order and announces its own state instead of
  // vanishing from the accessibility tree mid-round.
  const isButton = !!onTap;
  const Tag = isButton ? 'button' : 'div';

  return (
    <Tag
      className={`game2d-piece${isButton ? ' game2d-piece--tappable' : ''}${reduced ? ' game2d-piece--still' : ''}${artUrl ? ' game2d-piece--art' : ''}`}
      style={{ width: size, height: size, opacity: v.opacity }}
      onClick={isButton && !disabled ? onTap : undefined}
      disabled={isButton ? disabled : undefined}
      type={isButton ? 'button' : undefined}
      aria-label={ariaLabel}
      aria-pressed={isButton && state === 'selected' ? true : undefined}
    >
      {/* Premium 2D object, when this piece has one. Its flat colour frame keeps
          the task's colour channel explicit while the illustration carries the
          recognizable object. The SVG stays mounted above it for hit/miss
          rings and glyphs. */}
      {artUrl && (
        <span
          className="game2d-piece__art"
          aria-hidden="true"
          style={{
            '--game2d-piece-accent': v.fill,
            transform: `translate(-50%, -50%) scale(${s})`,
          }}
        >
          <img className="game2d-piece__art-image" src={artUrl} alt="" draggable={false} />
        </span>
      )}

      <svg viewBox={`0 0 ${box} ${box}`} width="100%" height="100%" aria-hidden="true" focusable="false">
        <g transform={`translate(${mid} ${mid}) scale(${s}) translate(${-mid} ${-mid})`}>
          {/* Shaded lower side — what gives a flat shape form.
              SH markup paints with fill="currentColor", so the colour has to be
              set via `color`; a `fill` attribute here would be overridden by the
              child's own fill and every piece would come out black.
              Skipped when art is present: the illustrated object replaces it. */}
          {!artUrl && (
          <g transform={`translate(${mid} ${mid + box * 0.035}) scale(${SHAPE_SCALE}) translate(-50 -50)`}
             style={{ color: v.edge }}
             dangerouslySetInnerHTML={{ __html: markup }} />
          )}
          {!artUrl && (
          <g transform={`translate(${mid} ${mid}) scale(${SHAPE_SCALE}) translate(-50 -50)`}
             style={{ color: v.fill }}
             stroke={v.stroke} strokeWidth={v.strokeWidth}
             dangerouslySetInnerHTML={{ __html: markup }} />
          )}
          {v.ring !== 'none' && (
            <circle
              cx={mid} cy={mid} r={box * 0.46}
              fill="none" stroke={v.fill} strokeWidth={box * 0.045}
              strokeDasharray={v.ring === 'dashed' ? `${box * 0.1} ${box * 0.07}` : undefined}
            />
          )}
          {label ? (
            <text
              x={mid} y={mid} fill={GAME_INK} fontSize={box * 0.3} fontWeight="700"
              textAnchor="middle" dominantBaseline="central"
              fontFamily="Outfit, system-ui, sans-serif"
            >
              {label}
            </text>
          ) : v.glyph ? (
            <path
              d={v.glyph === 'check'
                ? `M${mid - 22} ${mid} L${mid - 5} ${mid + 18} L${mid + 24} ${mid - 18}`
                : `M${mid - 17} ${mid - 17} L${mid + 17} ${mid + 17} M${mid + 17} ${mid - 17} L${mid - 17} ${mid + 17}`}
              fill="none" stroke={GAME_INK} strokeWidth={box * 0.055}
              strokeLinecap="round" strokeLinejoin="round"
            />
          ) : null}
        </g>
      </svg>
    </Tag>
  );
}
