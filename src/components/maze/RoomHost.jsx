import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { buildCampaignMaze } from './rooms/campaignMaze';
import { buildGateRoom } from './rooms/gateRoom';
import { buildBossFightScene } from './rooms/bossFightScene';
import { buildEscapeRoom } from './rooms/escapeRoom';
import { CAMPAIGN_ROOM_KEYS } from '../../features/campaign/campaignFloors';
import { GATE_ROOM_KEY } from '../../features/campaign/gateRoomConfig';
import { DEFAULT_FLOOR, setGateBossBeaten } from '../../features/campaign/campaignProgress';
import MazeRecruitOverlay from './MazeRecruitOverlay';
import EscapePuzzleOverlay from './EscapePuzzleOverlay';
import './roomHost.css';

const BOSS_FIGHT_KEY = 'bossfight';
export const ESCAPE_ROOM_KEY = 'escape';

/** Each room is its own builder — full dispose on switch keeps FPS stable. */
const ROOMS = {
  [GATE_ROOM_KEY]: (opts) => buildGateRoom(opts),
  [BOSS_FIGHT_KEY]: (opts) => buildBossFightScene(opts),
  [ESCAPE_ROOM_KEY]: (opts) => buildEscapeRoom(opts),
  ...Object.fromEntries(
    CAMPAIGN_ROOM_KEYS.map((key) => [
      key,
      (opts) => buildCampaignMaze({ ...opts, floorId: key }),
    ]),
  ),
};

const B = () => window.BABYLON;

export default function RoomHost() {
  const { exitMaze, updateXP, playSfx, character, equipped, currentLang, mazeStartRoom } = useApp();

  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const fadeRef = useRef(null);
  const perfRef = useRef(null);

  const engineRef = useRef(null);
  const activeRef = useRef(null);
  const goRef = useRef(null);
  const inputRef = useRef({ mx: 0, my: 0, lookDX: 0, lookDY: 0 });
  const currentFloorRef = useRef(DEFAULT_FLOOR);
  const bossFightPayloadRef = useRef(null);

  const [recruitChallenge, setRecruitChallenge] = useState(null);
  const [escapePuzzle, setEscapePuzzle] = useState(null); // { spec, title }
  const [inCinematic, setInCinematic] = useState(false);
  const [roomKey, setRoomKey] = useState(null);
  const escapeSolveRef = useRef(null);

  const openRecruitChallenge = useCallback((c) => {
    setRecruitChallenge(c);
    inputRef.current.mx = 0;
    inputRef.current.my = 0;
  }, []);

  const closeRecruitChallenge = useCallback(() => {
    setRecruitChallenge(null);
  }, []);

  // Escape-room lock: the room hands us a puzzle spec + a callback to run when it
  // is solved. We stash the callback and render the puzzle overlay.
  const openEscapePuzzle = useCallback((payload, onSolved) => {
    escapeSolveRef.current = onSolved || null;
    setEscapePuzzle(payload);
    inputRef.current.mx = 0;
    inputRef.current.my = 0;
  }, []);

  const closeEscapePuzzle = useCallback(() => {
    setEscapePuzzle(null);
    escapeSolveRef.current = null;
  }, []);

  const onEscapeSolved = useCallback(() => {
    escapeSolveRef.current?.();
  }, []);

  const refreshCurrentFloor = useCallback(() => {
    goRef.current?.(currentFloorRef.current);
  }, []);

  const startBossFight = useCallback((payload) => {
    bossFightPayloadRef.current = payload;
    goRef.current?.(BOSS_FIGHT_KEY);
  }, []);

  const [isTouch] = useState(
    () => typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window),
  );

  const modalOpen = recruitChallenge || escapePuzzle || inCinematic;

  useEffect(() => {
    const canvas = canvasRef.current;
    const overlayEl = overlayRef.current;
    const fadeEl = fadeRef.current;
    if (!canvas || !window.BABYLON) return undefined;

    const engine = new (B().Engine)(canvas, !isTouch, {
      stencil: true, adaptToDeviceRatio: true,
      powerPreference: 'high-performance',
    });
    engineRef.current = engine;
    engine.enableOfflineSupport = false;

    const dpr = window.devicePixelRatio || 1;
    const targetDpr = isTouch ? 1.25 : 1.75;
    if (dpr > targetDpr) engine.setHardwareScalingLevel(dpr / targetDpr);

    let disposed = false;

    const ctx = {
      exitMaze, updateXP, playSfx, character, equipped, currentLang,
      openRecruitChallenge,
      openEscapePuzzle,
      startBossFight,
      lowPerf: isTouch,
      goToRoom: (key) => goRef.current?.(key),
    };

    const build = (key) => {
      currentFloorRef.current = key;
      setInCinematic(key === BOSS_FIGHT_KEY);
      setRoomKey(key);
      const builder = ROOMS[key] || ROOMS[DEFAULT_FLOOR];
      if (key === BOSS_FIGHT_KEY) {
        activeRef.current = builder({
          engine, canvas, overlayEl, ctx, inputRef,
          payload: bossFightPayloadRef.current,
          onComplete: () => {
            setGateBossBeaten(true);
            bossFightPayloadRef.current = null;
            goRef.current?.(GATE_ROOM_KEY);
          },
        });
      } else {
        activeRef.current = builder({ engine, canvas, overlayEl, ctx, inputRef });
      }
    };

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

    const startFloor = mazeStartRoom && ROOMS[mazeStartRoom] ? mazeStartRoom : GATE_ROOM_KEY;
    build(startFloor);

    // Debug badge — shows which room loaded (gate vs floor1…)
    if (overlayEl) {
      const badge = document.createElement('div');
      badge.className = 'rh-room-badge';
      badge.textContent = startFloor === GATE_ROOM_KEY
        ? (currentLang === 'ar' ? 'غرفة البوابة' : 'OUTER GATE')
        : startFloor.toUpperCase();
      overlayEl.appendChild(badge);
    }

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
      setInCinematic(false);
      window.removeEventListener('resize', onResize);
      try { activeRef.current?.dispose(); } catch (e) { /* noop */ }
      activeRef.current = null;
      goRef.current = null;
      engine.stopRenderLoop();
      engine.dispose();
      engineRef.current = null;
      if (overlayEl) overlayEl.innerHTML = '';
    };
  }, [exitMaze, updateXP, playSfx, character, equipped, mazeStartRoom, openRecruitChallenge, openEscapePuzzle, startBossFight]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (joyState.current.active || modalOpen) return;
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

  const fireInteract = () => { if (modalOpen) return; activeRef.current?.interact?.(); };
  const fireJump = () => { if (modalOpen) return; activeRef.current?.jump?.(); };

  const isAr = currentLang === 'ar';

  return (
    <div className={`rh-root${isTouch ? ' rh-touch' : ''}${modalOpen ? ' rh-recruiting' : ''}${inCinematic ? ' rh-cinematic' : ''}`}>
      <canvas ref={canvasRef} className="rh-canvas" />
      <div ref={overlayRef} className="rh-overlay" />
      <div ref={fadeRef} className="rh-fade" />

      {recruitChallenge && (
        <MazeRecruitOverlay
          challenge={recruitChallenge}
          floorId={recruitChallenge.floorId || currentFloorRef.current}
          onClose={closeRecruitChallenge}
          onRefreshFloor={refreshCurrentFloor}
        />
      )}

      {escapePuzzle && (
        <EscapePuzzleOverlay
          spec={escapePuzzle.spec}
          title={escapePuzzle.title}
          onSolved={onEscapeSolved}
          onClose={closeEscapePuzzle}
        />
      )}

      {!inCinematic && (
        <button type="button" className="rh-quit" onClick={() => exitMaze()}>✕ {isAr ? 'خروج' : 'QUIT'}</button>
      )}
      {!inCinematic && <div className="rh-perf" ref={perfRef} />}

      {isTouch && !inCinematic && (
        <>
          <div
            className="rh-touchzone"
            onTouchStart={onZoneStart}
            onTouchMove={onZoneMove}
            onTouchEnd={onZoneEnd}
            onTouchCancel={onZoneEnd}
          />
          <div className="rh-joy" ref={joyRef}>
            <div className="rh-joy-thumb" ref={thumbRef} />
          </div>
          <div className="rh-actions">
            {roomKey !== ESCAPE_ROOM_KEY && (
              <button type="button" className="rh-act rh-act-jump"
                onTouchStart={(e) => { e.preventDefault(); fireJump(); if (!modalOpen) activeRef.current?.thrustOn?.(); }}
                onTouchEnd={(e) => { e.preventDefault(); activeRef.current?.thrustOff?.(); }}
                onTouchCancel={() => activeRef.current?.thrustOff?.()}>
                <span className="rh-act-icon">⤒</span><span className="rh-act-lbl">JUMP</span>
              </button>
            )}
            <button type="button" className="rh-act rh-act-use" onTouchStart={(e) => { e.preventDefault(); fireInteract(); }}>
              <span className="rh-act-icon">⚡</span><span className="rh-act-lbl">USE</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
