import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { buildDoorHall } from './rooms/doorHall';
import { buildAttentionRoom } from './rooms/attentionRoom';
import './roomHost.css';

/**
 * RoomHost — owns ONE Babylon engine + canvas and swaps between rooms.
 *
 * Each room (doorHall, skinnerRoom, …) builds its own BABYLON.Scene and returns
 * { scene, interact, dispose }. Only one room is ever alive: entering another
 * fades to black, DISPOSES the current scene (freeing all its meshes/textures),
 * builds the next, then fades back in. So memory/draw-cost stay flat no matter
 * how many rooms exist — that's the "loads in each room" behaviour.
 */
const ROOMS = {
  hall: buildDoorHall,
  attention: buildAttentionRoom,
};

const B = () => window.BABYLON;

export default function RoomHost() {
  const { exitMaze, updateXP, playSfx, character, equipped } = useApp();

  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const fadeRef = useRef(null);

  const engineRef = useRef(null);
  const activeRef = useRef(null);     // current room { scene, interact, dispose }
  const goRef = useRef(null);         // stable goToRoom for the render loop / buttons
  const inputRef = useRef({ mx: 0, my: 0, lookDX: 0, lookDY: 0 });

  const [isTouch] = useState(
    () => typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window),
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayEl = overlayRef.current;
    const fadeEl = fadeRef.current;
    if (!canvas || !window.BABYLON) return undefined;

    const engine = new (B().Engine)(canvas, true, {
      preserveDrawingBuffer: true, stencil: true, adaptToDeviceRatio: true,
    });
    engineRef.current = engine;

    let disposed = false;

    const ctx = {
      exitMaze, updateXP, playSfx, character, equipped,
      goToRoom: (key) => goRef.current?.(key),
    };

    const build = (key) => {
      const builder = ROOMS[key] || ROOMS.hall;
      activeRef.current = builder({ engine, canvas, overlayEl, ctx, inputRef });
    };

    // Fade-out → dispose → build → fade-in
    let switching = false;
    const goToRoom = (key) => {
      if (switching || disposed) return;
      switching = true;
      fadeEl.classList.add('show');
      setTimeout(() => {
        if (disposed) return;
        try { activeRef.current?.dispose(); } catch (e) { /* noop */ }
        activeRef.current = null;
        overlayEl.innerHTML = '';
        build(key);
        fadeEl.classList.remove('show');
        switching = false;
      }, 360);
    };
    goRef.current = goToRoom;

    build('hall');
    engine.runRenderLoop(() => {
      const room = activeRef.current;
      if (room?.scene?.activeCamera) room.scene.render();
    });

    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      try { activeRef.current?.dispose(); } catch (e) { /* noop */ }
      activeRef.current = null;
      goRef.current = null;
      engine.stopRenderLoop();
      engine.dispose();
      engineRef.current = null;
      if (overlayEl) overlayEl.innerHTML = '';
    };
  }, [exitMaze, updateXP, playSfx, character, equipped]);

  // ── Touch input wiring ──
  const joyRef = useRef(null);
  const thumbRef = useRef(null);
  const joyState = useRef({ active: false, id: null });

  const onJoyStart = (e) => {
    const t = e.changedTouches[0];
    joyState.current = { active: true, id: t.identifier };
    moveThumb(t);
  };
  const onJoyMove = (e) => {
    if (!joyState.current.active) return;
    for (const t of e.changedTouches) if (t.identifier === joyState.current.id) moveThumb(t);
  };
  const onJoyEnd = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyState.current.id) {
        joyState.current.active = false;
        inputRef.current.mx = 0; inputRef.current.my = 0;
        if (thumbRef.current) { thumbRef.current.style.left = '41px'; thumbRef.current.style.top = '41px'; }
      }
    }
  };
  const moveThumb = (t) => {
    const base = joyRef.current;
    if (!base) return;
    const r = base.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = t.clientX - cx, dy = t.clientY - cy;
    const dist = Math.min(Math.hypot(dx, dy), 45);
    const ang = Math.atan2(dy, dx);
    dx = Math.cos(ang) * dist; dy = Math.sin(ang) * dist;
    inputRef.current.mx = dx / 45;
    inputRef.current.my = dy / 45;
    if (thumbRef.current) {
      thumbRef.current.style.left = (45 + dx * 0.9 - 24) + 'px';
      thumbRef.current.style.top = (45 + dy * 0.9 - 24) + 'px';
    }
  };

  const fireInteract = () => { activeRef.current?.interact?.(); };
  const fireJump = () => { activeRef.current?.jump?.(); };
  const fireAction2 = () => { activeRef.current?.action2?.(); };

  return (
    <div className="rh-root">
      <canvas ref={canvasRef} className="rh-canvas" />
      <div ref={overlayRef} className="rh-overlay" />
      <div ref={fadeRef} className="rh-fade" />

      <button className="rh-quit" onClick={() => exitMaze()}>✕ QUIT</button>

      {isTouch && (
        <>
          <div
            className="rh-joy"
            ref={joyRef}
            onTouchStart={onJoyStart}
            onTouchMove={onJoyMove}
            onTouchEnd={onJoyEnd}
            onTouchCancel={onJoyEnd}
          >
            <div className="rh-joy-thumb" ref={thumbRef} />
            <div className="rh-joy-hint">MOVE</div>
          </div>
          <div className="rh-btns">
            <button className="rh-btn rh-btn-jump" onTouchStart={(e) => { e.preventDefault(); fireJump(); }}>JUMP</button>
            <button className="rh-btn rh-btn-grab" onTouchStart={(e) => { e.preventDefault(); fireAction2(); }}>GRAB</button>
            <button className="rh-btn" onTouchStart={(e) => { e.preventDefault(); fireInteract(); }}>USE</button>
          </div>
        </>
      )}
    </div>
  );
}
