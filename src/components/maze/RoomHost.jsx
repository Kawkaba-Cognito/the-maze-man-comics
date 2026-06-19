import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { buildDoorHall } from './rooms/doorHall';
import { buildAttentionRoom } from './rooms/attentionRoom';
import { buildMazeRoom } from './rooms/mazeRoom';
import { buildGymRoom } from './rooms/gymRoom';
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
  maze: buildMazeRoom,
  gym: buildGymRoom,
};

const B = () => window.BABYLON;

export default function RoomHost() {
  const { exitMaze, updateXP, playSfx, character, equipped, switchTab, currentLang, openWorkout, openPuzzleChallenge, mazeStartRoom, setMazeStartRoom } = useApp();

  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const fadeRef = useRef(null);
  const perfRef = useRef(null);

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

    // Antialiasing is a real GPU cost on phones — keep it on desktop, off on touch.
    const engine = new (B().Engine)(canvas, !isTouch, {
      stencil: true, adaptToDeviceRatio: true,
      powerPreference: 'high-performance',
    });
    engineRef.current = engine;
    // Don't probe for .manifest files per texture (404s + needless requests, esp.
    // for the maze's CDN textures) — we have no offline asset manifests.
    engine.enableOfflineSupport = false;

    // Cap render resolution. adaptToDeviceRatio renders at the full device pixel
    // ratio, which on phones/retina is 2–3× and murders the framerate. Clamp the
    // effective DPR (lower on touch) so the GPU isn't drawing millions of extra
    // pixels for no visible gain. setHardwareScalingLevel > 1 = render smaller.
    const dpr = window.devicePixelRatio || 1;
    // With glow + shadows off on phones (see worldKit/roomControls), the GPU has
    // headroom for a sharper image — render at ~1.5× instead of 1×.
    const targetDpr = isTouch ? 1.5 : 1.75;
    if (dpr > targetDpr) engine.setHardwareScalingLevel(dpr / targetDpr);

    let disposed = false;

    const ctx = {
      exitMaze, updateXP, playSfx, character, equipped, switchTab, currentLang, openWorkout, openPuzzleChallenge,
      lowPerf: isTouch, // rooms drop shadow quality on phones
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

    // Enter at the requested room (e.g. the Gym after a workout), then reset the
    // default so a normal entry from the menu always starts in the Hall.
    build(mazeStartRoom || 'hall');
    if (mazeStartRoom && mazeStartRoom !== 'hall') setMazeStartRoom('hall');
    // Perf HUD — sampled ~4×/sec so reading it never costs us frames.
    let perfT = 0;
    engine.runRenderLoop(() => {
      const room = activeRef.current;
      if (room?.scene?.activeCamera) {
        room.scene.render();
        const now = performance.now();
        if (perfRef.current && now - perfT > 250) {
          perfT = now;
          const sc = room.scene;
          const active = sc.getActiveMeshes ? sc.getActiveMeshes().length : sc.meshes.length;
          perfRef.current.textContent =
            `${Math.round(engine.getFps())} fps · ${(1000 / Math.max(1, engine.getFps())).toFixed(1)} ms · ${active}/${sc.meshes.length} meshes`;
        }
      }
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
  }, [exitMaze, updateXP, playSfx, character, equipped, switchTab]); // currentLang snapshotted at entry (avoid engine re-init on toggle)

  // ── Floating touch joystick ──
  // The joystick has no fixed home: wherever the player first touches the move
  // zone, the ring spawns under their thumb and tracks from there. Releasing
  // hides it. The action buttons sit above this zone (higher z) so tapping them
  // never starts a move. RADIUS = max thumb travel that maps to full speed.
  const joyRef = useRef(null);
  const thumbRef = useRef(null);
  const joyState = useRef({ active: false, id: null, ox: 0, oy: 0 });
  const RADIUS = 52;

  const showJoyAt = (x, y) => {
    const base = joyRef.current;
    if (!base) return;
    base.style.left = `${x}px`;
    base.style.top = `${y}px`;
    base.style.opacity = '1';
    if (thumbRef.current) thumbRef.current.style.transform = 'translate(-50%, -50%)';
  };
  const trackJoy = (t) => {
    const { ox, oy } = joyState.current;
    let dx = t.clientX - ox, dy = t.clientY - oy;
    const dist = Math.hypot(dx, dy);
    if (dist > RADIUS) { const a = Math.atan2(dy, dx); dx = Math.cos(a) * RADIUS; dy = Math.sin(a) * RADIUS; }
    inputRef.current.mx = dx / RADIUS;
    inputRef.current.my = dy / RADIUS;
    if (thumbRef.current) thumbRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  };
  const onZoneStart = (e) => {
    if (joyState.current.active) return; // first finger owns movement
    const t = e.changedTouches[0];
    joyState.current = { active: true, id: t.identifier, ox: t.clientX, oy: t.clientY };
    showJoyAt(t.clientX, t.clientY);
    trackJoy(t);
  };
  const onZoneMove = (e) => {
    if (!joyState.current.active) return;
    for (const t of e.changedTouches) if (t.identifier === joyState.current.id) { e.preventDefault(); trackJoy(t); }
  };
  const onZoneEnd = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyState.current.id) {
        joyState.current = { active: false, id: null, ox: 0, oy: 0 };
        inputRef.current.mx = 0; inputRef.current.my = 0;
        if (joyRef.current) joyRef.current.style.opacity = '0';
      }
    }
  };

  const fireInteract = () => { activeRef.current?.interact?.(); };
  const fireJump = () => { activeRef.current?.jump?.(); };
  const fireAction2 = () => { activeRef.current?.action2?.(); };

  return (
    <div className={`rh-root${isTouch ? ' rh-touch' : ''}`}>
      <canvas ref={canvasRef} className="rh-canvas" />
      <div ref={overlayRef} className="rh-overlay" />
      <div ref={fadeRef} className="rh-fade" />

      <button className="rh-quit" onClick={() => exitMaze()}>✕ QUIT</button>
      <div className="rh-perf" ref={perfRef} />

      {isTouch && (
        <>
          {/* Full-screen move zone (under the action buttons). */}
          <div
            className="rh-touchzone"
            onTouchStart={onZoneStart}
            onTouchMove={onZoneMove}
            onTouchEnd={onZoneEnd}
            onTouchCancel={onZoneEnd}
          />
          {/* Floating joystick ring — purely visual, follows the thumb. */}
          <div className="rh-joy" ref={joyRef}>
            <div className="rh-joy-thumb" ref={thumbRef} />
          </div>
          {/* Action cluster — thumb arc, bottom-right. */}
          <div className="rh-actions">
            <button className="rh-act rh-act-jump" onTouchStart={(e) => { e.preventDefault(); fireJump(); }}>
              <span className="rh-act-icon">⤒</span><span className="rh-act-lbl">JUMP</span>
            </button>
            <button className="rh-act rh-act-grab" onTouchStart={(e) => { e.preventDefault(); fireAction2(); }}>
              <span className="rh-act-icon">✊</span><span className="rh-act-lbl">GRAB</span>
            </button>
            <button className="rh-act rh-act-use" onTouchStart={(e) => { e.preventDefault(); fireInteract(); }}>
              <span className="rh-act-icon">⚡</span><span className="rh-act-lbl">USE</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
