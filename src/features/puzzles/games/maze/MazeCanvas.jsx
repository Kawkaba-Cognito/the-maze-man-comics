import React, { useRef, useEffect, useCallback } from 'react';
import {
  beginDrawAt,
  extendDrawPath,
  cellCenter,
  cellFromPixel,
  mazeLayout,
  mazePortals,
} from './mazeEngine';

/** Porteus maze test palette — black ink walls on white paper, pencil-blue path. */
const COLORS = {
  paper: '#ffffff',
  paperEdge: '#e8e0d4',
  wall: '#0d0d0d',
  path: '#1e4a8a',
  pathSoft: 'rgba(30, 74, 138, 0.35)',
  solved: '#1a6b3c',
  label: '#0d0d0d',
  labelBg: '#ffffff',
};

function drawMaze(ctx, state, solved, layout) {
  const { size, dim, wallGrid, path } = state;
  const { pad, inner, displaySize } = layout;
  const unit = inner / dim;

  ctx.clearRect(0, 0, displaySize, displaySize);

  // Paper sheet
  ctx.fillStyle = COLORS.paperEdge;
  ctx.fillRect(0, 0, displaySize, displaySize);
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(pad - 4, pad - 4, inner + 8, inner + 8);

  // White corridors (explicit — ensures clean gaps between walls)
  ctx.fillStyle = COLORS.paper;
  for (let gr = 0; gr < dim; gr++) {
    for (let gc = 0; gc < dim; gc++) {
      if (!wallGrid[gr][gc]) {
        ctx.fillRect(pad + gc * unit, pad + gr * unit, unit + 0.5, unit + 0.5);
      }
    }
  }

  // Solid wall blocks first — continuous Porteus-style borders
  ctx.fillStyle = COLORS.wall;
  for (let gr = 0; gr < dim; gr++) {
    for (let gc = 0; gc < dim; gc++) {
      if (wallGrid[gr][gc]) {
        ctx.fillRect(
          pad + gc * unit - 0.5,
          pad + gr * unit - 0.5,
          unit + 1,
          unit + 1
        );
      }
    }
  }

  // Pencil path on top of corridors
  if (path.length > 0) {
    const lineW = Math.max(3, unit * 0.55);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = COLORS.pathSoft;
    ctx.lineWidth = lineW + 2;
    ctx.beginPath();
    path.forEach(([r, c], i) => {
      const { x, y } = cellCenter(r, c, pad, unit, dim);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.strokeStyle = solved ? COLORS.solved : COLORS.path;
    ctx.lineWidth = lineW;
    ctx.beginPath();
    path.forEach(([r, c], i) => {
      const { x, y } = cellCenter(r, c, pad, unit, dim);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  // START / GOAL labels (Porteus test style)
  const portals = mazePortals(size, pad, unit, dim);
  const fontSize = Math.max(9, unit * 0.72);
  ctx.font = `800 ${fontSize}px Outfit, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = COLORS.labelBg;
  ctx.fillRect(portals.entrance.x - unit * 0.9, portals.entrance.y - fontSize * 0.7, unit * 1.8, fontSize * 1.4);
  ctx.strokeStyle = COLORS.wall;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(portals.entrance.x - unit * 0.9, portals.entrance.y - fontSize * 0.7, unit * 1.8, fontSize * 1.4);
  ctx.fillStyle = COLORS.label;
  ctx.fillText('START', portals.entrance.x, portals.entrance.y);

  ctx.fillStyle = COLORS.labelBg;
  ctx.fillRect(portals.exit.x - unit * 0.9, portals.exit.y - fontSize * 0.7, unit * 1.8, fontSize * 1.4);
  ctx.strokeStyle = COLORS.wall;
  ctx.strokeRect(portals.exit.x - unit * 0.9, portals.exit.y - fontSize * 0.7, unit * 1.8, fontSize * 1.4);
  ctx.fillStyle = solved ? COLORS.solved : COLORS.label;
  ctx.fillText('GOAL', portals.exit.x, portals.exit.y);
}

export default function MazeCanvas({ state, solved, onPathChange, playSfx }) {
  const canvasRef = useRef(null);
  const layoutRef = useRef({ pad: 0, inner: 0, displaySize: 0, unit: 1, dim: 1 });
  const drawingRef = useRef(false);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !state) return;
    const displaySize = canvas.clientWidth;
    if (displaySize <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(displaySize * dpr);
    canvas.height = Math.round(displaySize * dpr);

    const layout = mazeLayout(displaySize);
    const unit = layout.inner / state.dim;
    layoutRef.current = { ...layout, unit, dim: state.dim, displaySize };

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawMaze(ctx, state, solved, layout);
  }, [state, solved]);

  useEffect(() => {
    paint();
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ro = new ResizeObserver(paint);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [paint]);

  const hitCell = useCallback(
    (clientX, clientY) => {
      const canvas = canvasRef.current;
      if (!canvas || !state) return null;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const { pad, unit, dim } = layoutRef.current;
      return cellFromPixel(x, y, pad, unit, state.size, dim);
    },
    [state]
  );

  const applyCell = useCallback(
    (r, c, isStart) => {
      if (solved || r == null) return;
      onPathChange((s) => (isStart ? beginDrawAt(s, r, c) : extendDrawPath(s, r, c)));
    },
    [solved, onPathChange]
  );

  const handlePointerDown = useCallback(
    (e) => {
      if (solved) return;
      e.preventDefault();
      drawingRef.current = true;
      canvasRef.current?.setPointerCapture(e.pointerId);
      const hit = hitCell(e.clientX, e.clientY);
      if (hit) {
        applyCell(hit[0], hit[1], true);
        playSfx('click');
      }
    },
    [solved, hitCell, applyCell, playSfx]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!drawingRef.current || solved) return;
      e.preventDefault();
      const hit = hitCell(e.clientX, e.clientY);
      if (hit) applyCell(hit[0], hit[1], false);
    },
    [solved, hitCell, applyCell]
  );

  const handlePointerUp = useCallback(() => {
    drawingRef.current = false;
  }, []);

  return (
    <div className="ct-puzzle-maze-wrap">
      <canvas
        ref={canvasRef}
        className="ct-puzzle-maze-canvas ct-puzzle-maze-canvas--porteus"
        aria-label="Draw a path through the maze from START to GOAL"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}
