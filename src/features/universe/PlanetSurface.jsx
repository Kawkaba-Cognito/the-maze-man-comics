import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CHUNK, LANDING,
  findOpenNear, findPath, getChunk, resolveCircle, tickWorldClock,
} from './planetWorld.js';
import {
  ISO, PAL, chunkRect, drawKawkab, drawRock, drawShip, paintChunk, project,
} from './planetRender.js';
import './planet-surface.css';

/*
 * PlanetSurface - the world at the bottom of the Home swipe.
 *
 * Replaces MartianMaze. That was Babylon loaded from a CDN to draw a flat,
 * face-on grid; this is the same idea with none of the cost - no engine, no
 * network, no WebGL context - and a planet instead of a labyrinth.
 *
 * WHY THIS SCALES. The world is a pure function of coordinates (planetWorld),
 * so there is no map to allocate and no edge to reach. Terrain is painted into
 * 16x16 chunk canvases which are CACHED AND EVICTED, so memory rises to a
 * ceiling and stops however far you travel. Everything drawn per frame is
 * culled to the viewport. The cost of a frame follows the screen, not the
 * planet.
 */

const DPR_CAP = 2;

/* Pixels are the expensive cache: one chunk canvas is ~1.4 MB, so this cap IS
   the memory ceiling. Phones get a smaller one - they show fewer chunks too. */
const canvasCapFor = () => (window.innerWidth < 700 ? 22 : 34);

const HERO_R = 0.32;
const PHYS = { accel: 52, friction: 13, maxSpeed: 6.4 };
const SHIP_PHYS = { accel: 30, drag: 1.9, maxSpeed: 12, r: 0.75, bounce: 0.42 };

const UI = {
  en: {
    exit: 'Return to Universe',
    fly: 'Fly the ship',
    land: 'Land',
    slow: 'Slow down to land',
    descend: 'Descend to land',
    climb: 'Climb',
    hint: 'Touch and drag to walk · tap the ground to go there',
  },
  ar: {
    exit: 'العودة إلى الكون',
    fly: 'قُد المركبة',
    land: 'اهبط',
    slow: 'أبطئ للهبوط',
    descend: 'انزل للهبوط',
    climb: 'اصعد',
    hint: 'المس واسحب للمشي · اضغط الأرض للذهاب',
  },
};

export default function PlanetSurface({
  isAr = false,
  onExit,
  onReady,
  entryCovered = false,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState('loading');
  const [action, setAction] = useState({ verb: '', kind: 'none' });
  const [isFlying, setIsFlying] = useState(false);
  const stateRef = useRef(null);

  const t = UI[isAr ? 'ar' : 'en'];

  const beginExit = useCallback(() => {
    setPhase('exiting');
    window.setTimeout(() => onExit?.(), 420);
  }, [onExit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;
    const ctx = canvas.getContext('2d', { alpha: false });

    const start = findOpenNear(LANDING.x, LANDING.y + 6);
    const hero = {
      x: start.x, y: start.y, vx: 0, vy: 0, r: HERO_R,
      face: 1, step: 0, moving: 0, path: null, pathI: 0, marker: null,
    };
    const ship = {
      x: LANDING.x + 0.5, y: LANDING.y + 0.5, vx: 0, vy: 0,
      ang: -Math.PI / 2, bank: 0, alt: 0,
      riding: false, throttle: 0, target: null,
    };
    const cam = { x: hero.x, y: hero.y, zoom: 1 };
    const keys = new Set();

    /*
     * THE STICK IS INVISIBLE UNTIL YOU TOUCH.
     *
     * There is no fixed pad to reach for: put a thumb anywhere on the world and
     * the stick appears centred on that point; drag to steer. A quick tap with
     * no drag is still a tap, so walk-to-here survives alongside it — the two
     * are told apart by whether the finger MOVED, not by where it landed, which
     * means neither gesture owns a region of the screen and the world is never
     * covered by a control you are not using.
     */
    const stick = { on: false, id: -1, ox: 0, oy: 0, x: 0, y: 0 };
    const STICK_R = 46;
    const STICK_DEAD = 7;

    let climbHeld = false;
    let shake = 0;
    let W = 0;
    let H = 0;
    let running = true;
    let raf = 0;
    let paintClock = 0;

    const canvasCache = new Map();
    const CAP = canvasCapFor();

    stateRef.current = {
      hero, ship, setClimb: (v) => { climbHeld = v; },
    };

    /*
     * ADAPTIVE RESOLUTION.
     *
     * Fragment cost scales with the SQUARE of the pixel ratio, so this is the
     * one lever that reliably rescues a device that cannot hold frame rate —
     * and the only one the player will not notice being pulled. The canvas
     * starts at the capped ratio and steps down once if the frame time stays
     * bad for a full second. It never steps back up: hunting between two
     * resolutions is more distracting than sitting at the lower one.
     */
    let dprScale = 1;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP) * dprScale;
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const getCanvas = (cx, cy) => {
      const key = cy * 4194304 + cx;
      const hit = canvasCache.get(key);
      if (hit) {
        hit.used = paintClock;
        return hit;
      }
      const rec = paintChunk(cx, cy);
      rec.used = paintClock;
      canvasCache.set(key, rec);
      if (canvasCache.size > CAP) {
        const sorted = [...canvasCache.entries()].sort((a, b) => a[1].used - b[1].used);
        const drop = Math.max(1, sorted.length - Math.floor(CAP * 0.75));
        for (let i = 0; i < drop; i++) canvasCache.delete(sorted[i][0]);
      }
      return rec;
    };

    /* In isometric, pressing W must move him up the SCREEN. Grid-up is diagonal
       on an iso board, so passing the raw vector through sends him sideways and
       the controls feel broken for reasons nobody can name. */
    const screenToGrid = (ix, iy) => {
      const gx = (ix / (ISO.tw / 2) + iy / (ISO.th / 2)) / 2;
      const gy = (iy / (ISO.th / 2) - ix / (ISO.tw / 2)) / 2;
      const len = Math.hypot(gx, gy) || 1;
      return [gx / len, gy / len];
    };

    const readIntent = () => {
      let ix = 0;
      let iy = 0;
      if (keys.has('a') || keys.has('arrowleft')) ix -= 1;
      if (keys.has('d') || keys.has('arrowright')) ix += 1;
      if (keys.has('w') || keys.has('arrowup')) iy -= 1;
      if (keys.has('s') || keys.has('arrowdown')) iy += 1;
      if (ix || iy) {
        const l = Math.hypot(ix, iy);
        return [ix / l, iy / l, 1];
      }
      if (stick.on) {
        const dx = stick.x - stick.ox;
        const dy = stick.y - stick.oy;
        const d = Math.hypot(dx, dy);
        if (d > STICK_DEAD) {
          // Magnitude ramps to full at the ring, so a small push walks slowly.
          return [dx / d, dy / d, Math.min(1, d / STICK_R)];
        }
      }
      return [0, 0, 0];
    };

    const drawStick = () => {
      if (!stick.on) return;
      const dx = stick.x - stick.ox;
      const dy = stick.y - stick.oy;
      const d = Math.hypot(dx, dy);
      const k = d > STICK_R ? STICK_R / d : 1;
      ctx.save();
      ctx.beginPath();
      ctx.arc(stick.ox, stick.oy, STICK_R, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(18, 12, 9, .38)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(236, 224, 200, .3)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(stick.ox + dx * k, stick.oy + dy * k, 19, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(232, 172, 78, .62)';
      ctx.fill();
      ctx.restore();
    };

    const stepShip = (dt, ix, iy, mag) => {
      ship.alt += ((climbHeld ? 1 : 0.34) - ship.alt) * Math.min(1, dt * 2.4);
      let ax = 0;
      let ay = 0;
      if (mag > 0.05) {
        const [gx, gy] = screenToGrid(ix, iy);
        ax = gx;
        ay = gy;
        ship.target = null;
      } else if (ship.target) {
        const dx = ship.target.x - ship.x;
        const dy = ship.target.y - ship.y;
        const d = Math.hypot(dx, dy);
        if (d < 0.8) ship.target = null;
        else { ax = dx / d; ay = dy / d; }
      }
      if (ax || ay) {
        ship.vx += ax * SHIP_PHYS.accel * dt;
        ship.vy += ay * SHIP_PHYS.accel * dt;
        ship.throttle = Math.min(1, ship.throttle + dt * 3.2);
      } else {
        ship.throttle = Math.max(0, ship.throttle - dt * 1.8);
      }
      const k = Math.exp(-SHIP_PHYS.drag * dt);
      ship.vx *= k;
      ship.vy *= k;
      let sp = Math.hypot(ship.vx, ship.vy);
      if (sp > SHIP_PHYS.maxSpeed) {
        ship.vx *= SHIP_PHYS.maxSpeed / sp;
        ship.vy *= SHIP_PHYS.maxSpeed / sp;
        sp = SHIP_PHYS.maxSpeed;
      }
      ship.x += ship.vx * dt;
      ship.y += ship.vy * dt;

      // Skimming, the world is solid; climbing, it is not. That is what makes
      // altitude a mechanic rather than a decoration.
      if (ship.alt < 0.62) {
        const bx = ship.vx;
        const by = ship.vy;
        if (resolveCircle(ship, SHIP_PHYS.r)) {
          ship.vx += (ship.vx - bx) * SHIP_PHYS.bounce;
          ship.vy += (ship.vy - by) * SHIP_PHYS.bounce;
          shake = Math.min(9, shake + Math.min(1, Math.hypot(bx - ship.vx, by - ship.vy) / 6) * 7);
        }
      }

      if (sp > 0.35) {
        const want = Math.atan2(ship.vy, ship.vx);
        let d = want - ship.ang;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        ship.ang += d * Math.min(1, dt * 11);
        ship.bank += (Math.max(-1, Math.min(1, d * 2.2)) - ship.bank) * Math.min(1, dt * 6);
      } else {
        ship.bank += (0 - ship.bank) * Math.min(1, dt * 4);
      }
      hero.x = ship.x;
      hero.y = ship.y;
      hero.vx = ship.vx;
      hero.vy = ship.vy;
    };

    const step = (dt) => {
      const [ix, iy, mag] = readIntent();
      if (ship.riding) {
        stepShip(dt, ix, iy, mag);
        return;
      }

      ship.alt = Math.max(0, ship.alt - dt * 2);
      ship.throttle = Math.max(0, ship.throttle - dt * 2);

      let dx = 0;
      let dy = 0;
      if (mag > 0.04) {
        hero.path = null;
        const [gx, gy] = screenToGrid(ix, iy);
        dx = gx;
        dy = gy;
      } else if (hero.path) {
        const wp = hero.path[hero.pathI];
        if (!wp) hero.path = null;
        else {
          const ddx = (wp.x + 0.5) - hero.x;
          const ddy = (wp.y + 0.5) - hero.y;
          const d = Math.hypot(ddx, ddy);
          if (d < 0.2) {
            hero.pathI += 1;
            if (hero.pathI >= hero.path.length) hero.path = null;
          } else { dx = ddx / d; dy = ddy / d; }
        }
      }

      if (dx || dy) {
        hero.vx += dx * PHYS.accel * dt;
        hero.vy += dy * PHYS.accel * dt;
      } else {
        const s0 = Math.hypot(hero.vx, hero.vy);
        if (s0 > 0) {
          const drop = Math.min(s0, PHYS.friction * dt);
          hero.vx -= (hero.vx / s0) * drop;
          hero.vy -= (hero.vy / s0) * drop;
        }
      }
      const sp = Math.hypot(hero.vx, hero.vy);
      if (sp > PHYS.maxSpeed) {
        hero.vx *= PHYS.maxSpeed / sp;
        hero.vy *= PHYS.maxSpeed / sp;
      }
      hero.x += hero.vx * dt;
      hero.y += hero.vy * dt;
      resolveCircle(hero, hero.r);

      const moveSp = Math.hypot(hero.vx, hero.vy);
      hero.moving = Math.min(1, moveSp / PHYS.maxSpeed);
      hero.step += moveSp * dt * 0.85;
      if (moveSp > 0.2) {
        const [ssx] = project(hero.vx, hero.vy);
        if (Math.abs(ssx) > 0.4) hero.face = Math.sign(ssx);
      }
    };

    const stars = Array.from({ length: 90 }, (_, i) => {
      let a = (i * 7717) | 0;
      const rnd = () => {
        a = (a + 0x6D2B79F5) | 0;
        let v = Math.imul(a ^ (a >>> 15), 1 | a);
        v = (v + Math.imul(v ^ (v >>> 7), 61 | v)) ^ v;
        return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
      };
      return { x: rnd(), y: rnd() * 0.65, a: 0.18 + rnd() * 0.6, s: rnd() > 0.92 ? 2 : 1 };
    });

    const render = (time) => {
      const z = cam.zoom;
      const jx = shake > 0.05 ? (Math.random() - 0.5) * shake : 0;
      const jy = shake > 0.05 ? (Math.random() - 0.5) * shake : 0;
      const [cwx, cwy] = project(cam.x, cam.y);
      const ox = W / 2 - cwx * z + jx;
      const oy = H / 2 - cwy * z + jy;

      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, PAL.sky);
      sky.addColorStop(1, PAL.skyLow);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = PAL.ink;
      for (const s of stars) {
        ctx.globalAlpha = s.a * 0.5;
        ctx.fillRect(s.x * W, s.y * H, s.s, s.s);
      }
      ctx.globalAlpha = 1;

      // Visible tile range, from the inverse projection of the viewport corners.
      const visL = -ox / z;
      const visT = -oy / z;
      const visR = (W - ox) / z;
      const visB = (H - oy) / z;
      const gx0 = Math.floor((visL / (ISO.tw / 2) + visT / (ISO.th / 2)) / 2) - 2;
      const gx1 = Math.ceil((visR / (ISO.tw / 2) + visB / (ISO.th / 2)) / 2) + 2;
      const gy0 = Math.floor((visT / (ISO.th / 2) - visR / (ISO.tw / 2)) / 2) - 2;
      const gy1 = Math.ceil((visB / (ISO.th / 2) - visL / (ISO.tw / 2)) / 2) + 2;

      /* The chunk range is a bounding box around a rotated diamond, so about
         half of it is off screen. Testing each chunk's rectangle first — which
         chunkRect answers without painting anything — is what stops the frame
         blitting a dozen 1.4 MB canvases nobody can see. `visible` is reused
         below so the rocks skip the same chunks. */
      const visible = [];
      for (let cy = Math.floor(gy0 / CHUNK); cy <= Math.floor(gy1 / CHUNK); cy++) {
        for (let cx = Math.floor(gx0 / CHUNK); cx <= Math.floor(gx1 / CHUNK); cx++) {
          const b = chunkRect(cx, cy);
          if (b.x > visR || b.y > visB || b.x + b.w < visL || b.y + b.h < visT) continue;
          visible.push(cx, cy);
        }
      }

      ctx.save();
      ctx.translate(ox, oy);
      ctx.scale(z, z);
      for (let i = 0; i < visible.length; i += 2) {
        const ch = getCanvas(visible[i], visible[i + 1]);
        ctx.drawImage(ch.cv, ch.x, ch.y);
      }
      ctx.restore();

      const list = [];
      const push = (kind, gx, gy, extra) => {
        const [wx, wy] = project(gx, gy);
        const sx = wx * z + ox;
        const sy = wy * z + oy;
        if (sx < -420 || sx > W + 420 || sy < -460 || sy > H + 420) return;
        list.push({ kind, d: gx + gy, sx, sy, extra });
      };

      // Rocks come from each visible chunk's prebuilt list rather than from
      // re-testing every tile in the bounding box.
      for (let i = 0; i < visible.length; i += 2) {
        const { rocks } = getChunk(visible[i], visible[i + 1]);
        for (let r = 0; r < rocks.length; r += 2) {
          push('r', rocks[r] + 0.5, rocks[r + 1] + 0.5, { x: rocks[r], y: rocks[r + 1] });
        }
      }
      push('s', ship.x, ship.y);
      if (!ship.riding) push('k', hero.x, hero.y);
      list.sort((a, b) => a.d - b.d);

      for (const it of list) {
        if (it.kind === 'r') drawRock(ctx, it.extra.x, it.extra.y, it.sx, it.sy, z);
        else if (it.kind === 's') drawShip(ctx, ship, it.sx, it.sy, z, time);
        else drawKawkab(ctx, hero, it.sx, it.sy, 19 * z, time);
      }

      if (hero.marker) {
        const age = (time - hero.marker.t) / 0.9;
        if (age <= 1) {
          const [wx, wy] = project(hero.marker.x + 0.5, hero.marker.y + 0.5);
          ctx.save();
          ctx.globalAlpha = (1 - age) * 0.8;
          ctx.strokeStyle = hero.marker.ok ? PAL.amber : PAL.ink;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(wx * z + ox, wy * z + oy, 6 + age * 22 * z, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      const vig = ctx.createRadialGradient(
        W / 2, H / 2, Math.min(W, H) * 0.36, W / 2, H / 2, Math.max(W, H) * 0.74,
      );
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,.46)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      drawStick();
    };

    let last = performance.now();
    let tAcc = 0;
    let slowFor = 0;

    const frame = (now) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      tAcc += dt;
      paintClock += 1;
      tickWorldClock();

      // Sustained bad frames, not one spike: a single 40ms hitch while a chunk
      // is painted is normal and must not trigger a resolution drop.
      if (dprScale === 1) {
        slowFor = dt > 0.024 ? slowFor + dt : 0;
        if (slowFor > 1) {
          dprScale = 0.7;
          resize();
          slowFor = 0;
        }
      }

      /* Fixed sub-steps. A collision resolver integrated at a variable frame
         rate gives different results on a 60Hz and a 120Hz phone, and at low
         frame rates a fast body can pass through a wall between two samples. */
      let acc = dt;
      let guard = 0;
      while (acc > 0 && guard < 8) {
        const s = Math.min(1 / 120, acc);
        step(s);
        acc -= s;
        guard += 1;
      }

      const k = 1 - 0.0001 ** dt;
      cam.x += (hero.x - cam.x) * k;
      cam.y += (hero.y - cam.y) * k;
      cam.zoom += ((ship.riding ? 0.82 : 1) - cam.zoom) * Math.min(1, dt * 3);
      shake *= Math.exp(-9 * dt);
      if (hero.marker && tAcc - hero.marker.t > 0.9) hero.marker = null;

      render(tAcc);
      raf = requestAnimationFrame(frame);
    };

    // Ready immediately - there is nothing to download.
    setPhase('ready');
    onReady?.();
    raf = requestAnimationFrame(frame);

    const onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
        e.preventDefault();
        keys.add(k);
        if (k === ' ') climbHeld = true;
      }
      if (k === 'escape') beginExit();
    };
    const onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      keys.delete(k);
      if (k === ' ') climbHeld = false;
    };
    const onBlur = () => { keys.clear(); climbHeld = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    // Never keep drawing behind a hidden tab or a locked phone.
    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    let down = null;
    const onDown = (e) => {
      if (e.target.closest('.planet-ui')) return;
      canvas.setPointerCapture?.(e.pointerId);
      const r = canvas.getBoundingClientRect();
      down = { x: e.clientX, y: e.clientY, id: e.pointerId };
      // The stick is armed here but not shown; it only appears once the finger
      // moves, so a tap never flashes a control on screen.
      stick.id = e.pointerId;
      stick.ox = e.clientX - r.left;
      stick.oy = e.clientY - r.top;
      stick.x = stick.ox;
      stick.y = stick.oy;
    };
    const onMove = (e) => {
      if (!down || e.pointerId !== stick.id) return;
      const r = canvas.getBoundingClientRect();
      stick.x = e.clientX - r.left;
      stick.y = e.clientY - r.top;
      if (!stick.on
        && Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y) > STICK_DEAD) {
        stick.on = true;
      }
    };
    const onUp = (e) => {
      if (!down) return;
      const moved = Math.abs(e.clientX - down.x) + Math.abs(e.clientY - down.y);
      const wasStick = stick.on;
      down = null;
      stick.on = false;
      stick.id = -1;
      // A drag was steering, not a tap. Only a still finger means "go there".
      if (wasStick || moved > 10) return;
      const r = canvas.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      const z = cam.zoom;
      const [cwx, cwy] = project(cam.x, cam.y);
      const wx = (px - W / 2) / z + cwx;
      const wy = (py - H / 2) / z + cwy;
      const gx = Math.floor((wx / (ISO.tw / 2) + wy / (ISO.th / 2)) / 2);
      const gy = Math.floor((wy / (ISO.th / 2) - wx / (ISO.tw / 2)) / 2);
      if (ship.riding) {
        ship.target = { x: gx, y: gy };
        hero.marker = { x: gx, y: gy, t: tAcc, ok: true };
        return;
      }
      const path = findPath(hero.x, hero.y, gx, gy);
      hero.marker = { x: gx, y: gy, t: tAcc, ok: !!path };
      if (path) { hero.path = path; hero.pathI = 0; }
    };
    const onCancel = () => {
      down = null;
      stick.on = false;
      stick.id = -1;
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onCancel);

    // The action verb is polled rather than pushed: it depends on continuous
    // physics state, and re-rendering React on every frame to show one word
    // would be the most expensive thing on the screen.
    const uiTimer = window.setInterval(() => {
      const near = Math.hypot(hero.x - ship.x, hero.y - ship.y) < 3.4;
      setIsFlying((prev) => (prev === ship.riding ? prev : ship.riding));
      if (ship.riding) {
        if (ship.alt >= 0.55) setAction({ verb: t.descend, kind: 'none' });
        else if (Math.hypot(ship.vx, ship.vy) >= 2.4) setAction({ verb: t.slow, kind: 'none' });
        else setAction({ verb: t.land, kind: 'land' });
      } else if (near) {
        setAction({ verb: t.fly, kind: 'board' });
      } else {
        setAction((prev) => (prev.verb ? { verb: '', kind: 'none' } : prev));
      }
    }, 220);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.clearInterval(uiTimer);
      ro.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
      canvasCache.clear();
      stateRef.current = null;
    };
  }, [beginExit, onReady, t]);

  const doAction = useCallback(() => {
    const st = stateRef.current;
    if (!st) return;
    const { hero, ship } = st;
    if (action.kind === 'board') {
      ship.riding = true;
      ship.target = null;
      hero.path = null;
      ship.vx = hero.vx * 0.3;
      ship.vy = hero.vy * 0.3;
    } else if (action.kind === 'land') {
      ship.riding = false;
      ship.target = null;
      ship.vx = 0;
      ship.vy = 0;
      ship.bank = 0;
      const spot = findOpenNear(ship.x, ship.y + 2);
      hero.x = spot.x;
      hero.y = spot.y;
      hero.vx = 0;
      hero.vy = 0;
      resolveCircle(hero, hero.r);
    }
  }, [action]);

  const holdClimb = useCallback((on) => (e) => {
    e.preventDefault();
    stateRef.current?.setClimb(on);
  }, []);

  return (
    <div
      className={`planet-surface phase-${phase}${entryCovered ? ' is-covered' : ''}`}
      role="application"
      aria-label={isAr ? 'Planet' : 'Planet surface'}
      ref={wrapRef}
    >
      <canvas ref={canvasRef} className="planet-canvas" />

      <div className="planet-ui" dir={isAr ? 'rtl' : 'ltr'}>
        <button type="button" className="planet-exit" onClick={beginExit}>
          {t.exit}
        </button>

        {action.verb && (
          <button
            type="button"
            className="planet-action"
            onClick={doAction}
            disabled={action.kind === 'none'}
          >
            {action.verb}
          </button>
        )}

        {/* Climb is the one thing the stick cannot say, so it is the one key
            on screen — and only while you are actually flying. */}
        {isFlying && (
          <button
            type="button"
            className="planet-climb"
            aria-label={t.climb}
            onPointerDown={holdClimb(true)}
            onPointerUp={holdClimb(false)}
            onPointerCancel={holdClimb(false)}
            onPointerLeave={holdClimb(false)}
          >
            &#9650;
          </button>
        )}

        <div className="planet-hint">{t.hint}</div>
      </div>
    </div>
  );
}
