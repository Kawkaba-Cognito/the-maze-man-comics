/*
 * board2d.js — the shared look of a 2D training playfield.
 *
 * Every converted game renders its pieces through `visualFor` so that a "cued"
 * piece looks the same in Cancellation as in Wisconsin as in Raven. Games differ
 * in LAYOUT (grid, drifting dots, cards, lanes); they must not differ in what a
 * state looks like.
 *
 * Two consumers share one state→visual mapping:
 *   • SVG/DOM grid games → <GamePiece> in ./GamePiece.jsx
 *   • canvas motion games → drawPiece() below, inside startCanvasLoop
 *
 * ── Why the mapping returns more than a colour ────────────────────────────
 * The six palette hues are near-isoluminant (see gamePalette.js). If state were
 * carried by fill alone, a player with colour-vision deficiency would see six
 * identical greys and the game would be unplayable. So `visualFor` moves at
 * least TWO channels for every state — colour plus size, and usually a ring or
 * glyph on top. That redundancy is the reason this function exists; if you add
 * a state, give it a non-colour cue too.
 */

import { GAME_COLORS, GAME_INK, shadeOf } from './gamePalette';

/**
 * @typedef {'idle'|'cued'|'selected'|'correct'|'wrong'|'spent'} PieceState
 * @typedef {{ role: string, fill: string, edge: string, stroke: string,
 *             scale: number, ring: 'none'|'solid'|'dashed', glyph: ''|'check'|'cross',
 *             strokeWidth: number, opacity: number }} PieceVisual
 */

/** state → every channel that moves. The one place the redundancy rule lives. */
const STATES = {
  /** Nothing to say. The resting piece. */
  idle: { role: 'item', scale: 1.0, ring: 'none', glyph: '', strokeWidth: 2, opacity: 1 },
  /** "Look at me" — the target, the cue, the thing to remember. */
  cued: { role: 'accent', scale: 1.15, ring: 'solid', glyph: '', strokeWidth: 2.5, opacity: 1 },
  /** The player has picked this and can still change their mind. */
  selected: { role: 'selected', scale: 1.08, ring: 'dashed', glyph: '', strokeWidth: 2.5, opacity: 1 },
  /** Resolved right. */
  correct: { role: 'ok', scale: 1.12, ring: 'solid', glyph: 'check', strokeWidth: 2.5, opacity: 1 },
  /** Resolved wrong. Shrinks — errors should not gain visual weight. */
  wrong: { role: 'bad', scale: 0.92, ring: 'solid', glyph: 'cross', strokeWidth: 2.5, opacity: 1 },
  /** Used up, disabled, no longer in play. Present but quiet. */
  spent: { role: 'muted', scale: 0.88, ring: 'none', glyph: '', strokeWidth: 1.5, opacity: 0.55 },
};

/**
 * Resolve a piece state into everything needed to draw it.
 *
 * `color` is for the games where colour is the TASK (Cancellation, Wisconsin,
 * Raven, Spatial Stroop — see GAME_STIMULUS). Those pieces carry their own
 * stimulus colour, so pass it here and it replaces the `item` fill.
 *
 * It only applies to `idle`. Once a piece has something to SAY — cued, picked,
 * right, wrong, spent — the state colour must win, or the message competes with
 * the stimulus and the player cannot tell which one they are being asked about.
 *
 * @param {PieceState} state
 * @param {string} [color] the piece's own stimulus colour, idle only
 * @returns {PieceVisual}
 */
export function visualFor(state, color) {
  const s = STATES[state] || STATES.idle;
  const c = GAME_COLORS[s.role];
  if (color && (state === 'idle' || state === undefined)) {
    const edge = shadeOf(color);
    return { ...s, fill: color, edge, stroke: edge };
  }
  return { ...s, fill: c.fill, edge: c.edge, stroke: c.stroke };
}

export const PIECE_STATES = /** @type {PieceState[]} */ (Object.keys(STATES));

/* ── Canvas renderer ─────────────────────────────────────────────────────── */

/**
 * Draw one piece on a 2D canvas. Layout is the caller's business; this owns
 * only how a piece LOOKS, so canvas games match the SVG ones exactly.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x: number, y: number, r: number, state?: PieceState, color?: string,
 *           path?: Path2D, label?: string, reduced?: boolean }} o
 *   x,y   centre in canvas pixels
 *   r     base radius in canvas pixels (before the state's scale)
 *   color the piece's own stimulus colour, if colour is the task (idle only)
 *   path  optional Path2D in a -1..1 box for non-circular pieces; omit for a disc
 *   label optional text drawn on the piece (letters, numbers)
 */
export function drawPiece(ctx, o) {
  const v = visualFor(o.state || 'idle', o.color);
  const r = o.r * v.scale;

  ctx.save();
  ctx.globalAlpha = v.opacity;
  ctx.translate(o.x, o.y);

  // The edge tone, offset down — a flat shape reads as having form because its
  // lower side is shaded, not because it is drawn in perspective.
  ctx.save();
  ctx.translate(0, r * 0.08);
  ctx.fillStyle = v.edge;
  paintShape(ctx, r, o.path, 'fill');
  ctx.restore();

  ctx.fillStyle = v.fill;
  paintShape(ctx, r, o.path, 'fill');

  ctx.lineWidth = v.strokeWidth;
  ctx.strokeStyle = v.stroke;
  paintShape(ctx, r, o.path, 'stroke');

  if (v.ring !== 'none') {
    ctx.lineWidth = Math.max(2, r * 0.12);
    ctx.strokeStyle = v.fill;
    if (v.ring === 'dashed') ctx.setLineDash([r * 0.42, r * 0.3]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (o.label) {
    ctx.fillStyle = GAME_INK;
    ctx.font = `700 ${Math.round(r * 0.95)}px Outfit, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(o.label, 0, r * 0.04);
  } else if (v.glyph) {
    drawGlyph(ctx, v.glyph, r);
  }

  ctx.restore();
}

/**
 * Fill or stroke the piece's silhouette, centred on the current origin.
 *
 * A Path2D cannot be "traced then filled later" the way a ctx path can — it is
 * an object you hand to fill()/stroke() — so this does the paint itself rather
 * than leaving a current path behind. `path` is authored in a -1..1 box, so
 * scaling the context by r sizes it; line width is divided back out afterwards
 * so a scaled stroke stays the width the caller asked for.
 */
function paintShape(ctx, r, path, mode) {
  if (path) {
    ctx.save();
    ctx.scale(r, r);
    if (mode === 'stroke') {
      ctx.lineWidth /= r;
      ctx.stroke(path);
    } else {
      ctx.fill(path);
    }
    ctx.restore();
    return;
  }
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  if (mode === 'stroke') ctx.stroke();
  else ctx.fill();
}

function drawGlyph(ctx, glyph, r) {
  ctx.lineWidth = Math.max(2.5, r * 0.16);
  ctx.strokeStyle = GAME_INK;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (glyph === 'check') {
    ctx.moveTo(-r * 0.4, 0);
    ctx.lineTo(-r * 0.08, r * 0.34);
    ctx.lineTo(r * 0.44, -r * 0.34);
  } else {
    ctx.moveTo(-r * 0.32, -r * 0.32);
    ctx.lineTo(r * 0.32, r * 0.32);
    ctx.moveTo(r * 0.32, -r * 0.32);
    ctx.lineTo(-r * 0.32, r * 0.32);
  }
  ctx.stroke();
}

/**
 * Paint the Tide sky onto a canvas. Matches --play-surface and the DOM
 * `.game2d-sky`, so a canvas game and a DOM game sit on the same background.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w @param {number} h  in canvas pixels
 */
export function paintSky(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#ccdae6');
  g.addColorStop(0.58, '#d2c5b5');
  g.addColorStop(1, '#c6b199');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
