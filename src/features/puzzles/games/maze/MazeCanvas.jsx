import React, { useRef, useEffect, useCallback } from 'react';
import { cellCenter, mazeLayout, mazePortals } from './mazeEngine';

/** Porteus maze test palette — black ink walls on white paper, pencil-blue trail. */
const COLORS = {
  paper: '#ffffff',
  paperEdge: '#e8e0d4',
  wall: '#0d0d0d',
  path: '#1e4a8a',
  pathSoft: 'rgba(30, 74, 138, 0.35)',
  solved: '#1a6b3c',
  token: '#e8ac4e',
  tokenSolved: '#36c46a',
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

  // Solid wall blocks — continuous Porteus-style borders
  ctx.fillStyle = COLORS.wall;
  for (let gr = 0; gr < dim; gr++) {
    for (let gc = 0; gc < dim; gc++) {
      if (wallGrid[gr][gc]) {
        ctx.fillRect(pad + gc * unit - 0.5, pad + gr * unit - 0.5, unit + 1, unit + 1);
      }
    }
  }

  // Breadcrumb trail showing where the avatar has walked
  if (path.length > 1) {
    const lineW = Math.max(2.5, unit * 0.42);
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

  // The avatar — a glowing token sitting on the current cell
  const [cr, cc] = path[path.length - 1];
  const center = cellCenter(cr, cc, pad, unit, dim);
  const tokenColor = solved ? COLORS.tokenSolved : COLORS.token;
  const radius = Math.max(3, unit * 0.34);

  ctx.save();
  ctx.shadowColor = tokenColor;
  ctx.shadowBlur = radius * 1.6;
  ctx.fillStyle = tokenColor;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Bright core for a "glow" read
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius * 0.42, 0, Math.PI * 2);
  ctx.fill();

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

export default function MazeCanvas({ state, solved }) {
  const canvasRef = useRef(null);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !state) return;
    const displaySize = canvas.clientWidth;
    if (displaySize <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(displaySize * dpr);
    canvas.height = Math.round(displaySize * dpr);

    const layout = mazeLayout(displaySize);
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

  return (
    <div className="ct-puzzle-maze-wrap">
      <canvas
        ref={canvasRef}
        className="ct-puzzle-maze-canvas ct-puzzle-maze-canvas--porteus"
        aria-label="Maze. Move your token from START to GOAL using the joystick."
      />
    </div>
  );
}
