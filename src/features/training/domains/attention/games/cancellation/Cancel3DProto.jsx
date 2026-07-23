import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { shapeGeometry } from '../../../../shared/c3dShapes';
import { isCoarsePointer, isDesktopLayout } from '../../../../shared/c3dViewport';
import '../../../../shared/c3dProto.css';

/*
 * CancelScene3D — the Cancellation Task rendered as a 3D board.
 *
 * This is a CONTROLLED view: it owns no game logic. The parent (index.jsx)
 * runs the whole engine (modes, timer, scoring, trialLog, XP, assessment,
 * staircase) and passes:
 *   - `round`       the current round ({ cells, grid, ... }) — reloads the board
 *   - `cells`       the live cell array (tapped/feedback) — drives pop/miss/mark
 *   - `interactive` whether taps are accepted right now (running & !paused)
 *   - `onTapCell`   called with the tapped cell index; the parent scores it
 * The scene reflects cell state and reports taps; that's all. The HUD, target
 * cue, countdown and results are DOM overlays the parent renders on top.
 */

function hexToInt(hex) {
  if (!hex || typeof hex !== 'string') return 0xe8ac4e;
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return Number.isFinite(n) ? n : 0xe8ac4e;
}

function makeMat(colorHex, opts = {}) {
  const color = new THREE.Color(hexToInt(colorHex));
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color.clone().multiplyScalar(opts.emissive ?? 0.26),
    metalness: opts.metalness ?? 0.35,
    roughness: opts.roughness ?? 0.35,
  });
}

/** Focus Quest shape as a clear, face-on 3D piece: contour + coloured extrude + plate. */
function makeShapeObject(name, colorHex) {
  const g = new THREE.Group();
  const geo = shapeGeometry(name);

  const outline = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x120d07 }));
  outline.scale.setScalar(1.12);
  outline.position.z = -0.05;
  g.add(outline);

  const mesh = new THREE.Mesh(geo, makeMat(colorHex, { emissive: 0.32, metalness: 0.28, roughness: 0.42 }));
  g.add(mesh);

  const plate = new THREE.Mesh(
    new THREE.CircleGeometry(0.72, 28),
    new THREE.MeshBasicMaterial({ color: 0x12100c, transparent: true, opacity: 0.55, depthWrite: false }),
  );
  plate.position.z = -0.35;
  g.add(plate);
  return g;
}

function disposeObject3D(root) {
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
      else obj.material.dispose();
    }
  });
}

export default function CancelScene3D({ cells, round, interactive, onTapCell, isAr }) {
  const wrapRef = useRef(null);
  const apiRef = useRef({ loadBoard() {}, setInteractive() {}, applyCells() {}, ready: false });
  const onTapRef = useRef(onTapCell);
  onTapRef.current = onTapCell;
  const roundRef = useRef(round);

  // ── Three.js arena (mounts once) ──────────────────────────────────
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;
    const coarse = isCoarsePointer();

    let engageAt = 0;
    let acceptTaps = false;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.028);

    const camera = new THREE.PerspectiveCamera(coarse ? 54 : 48, 1, 0.1, 80);
    camera.position.set(0, 0, 11.2);

    const renderer = new THREE.WebGLRenderer({ antialias: !coarse, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.35 : fine ? 1.6 : 1.25));
    renderer.setClearColor(0x000000, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
    wrap.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xb8a88a, 0.55));
    const key = new THREE.DirectionalLight(0xfff0d8, 1.15);
    key.position.set(3, 5, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0xe8ac4e, 1.4, 28);
    rim.position.set(-4, 2, 4);
    scene.add(rim);

    // Stars
    const starN = fine ? 1600 : 1000;
    const starPos = new Float32Array(starN * 3);
    for (let i = 0; i < starN; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 60;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      starPos[i * 3 + 2] = -8 - Math.random() * 40;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xf0e2c0, size: fine ? 0.04 : 0.055, transparent: true, opacity: 0.85,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Dust
    const dustN = fine ? 280 : 160;
    const dustPos = new Float32Array(dustN * 3);
    for (let i = 0; i < dustN; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 18;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      dustPos[i * 3 + 2] = -1 - Math.random() * 10;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xe8ac4e, size: 0.05, transparent: true, opacity: 0.4,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // Burst pool
    const BURST = 64;
    const burstPos = new Float32Array(BURST * 3);
    const burstVel = new Float32Array(BURST * 3);
    const burstLife = new Float32Array(BURST);
    const burstGeo = new THREE.BufferGeometry();
    burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3));
    const burstMat = new THREE.PointsMaterial({
      color: 0xe8ac4e, size: 0.14, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const burstPts = new THREE.Points(burstGeo, burstMat);
    scene.add(burstPts);

    const spawnBurst = (worldPos, kind) => {
      const col = kind === 'bad' ? 0xff6b5a : kind === 'clear' ? 0xf0e2c0 : 0xe8ac4e;
      burstMat.color.setHex(col);
      const spread = kind === 'clear' ? 2.2 : 1.1;
      for (let i = 0; i < BURST; i++) {
        burstPos[i * 3] = worldPos.x + (Math.random() - 0.5) * 0.15;
        burstPos[i * 3 + 1] = worldPos.y + (Math.random() - 0.5) * 0.15;
        burstPos[i * 3 + 2] = worldPos.z + (Math.random() - 0.5) * 0.15;
        const a = Math.random() * Math.PI * 2;
        const elev = (Math.random() - 0.3) * Math.PI;
        const s = (0.6 + Math.random()) * spread;
        burstVel[i * 3] = Math.cos(a) * Math.cos(elev) * s;
        burstVel[i * 3 + 1] = Math.sin(elev) * s;
        burstVel[i * 3 + 2] = Math.sin(a) * Math.cos(elev) * s;
        burstLife[i] = 0.5 + Math.random() * 0.55;
      }
      burstGeo.attributes.position.needsUpdate = true;
    };

    // Meteors
    const meteors = [];
    for (let i = 0; i < 4; i++) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const m = new THREE.LineBasicMaterial({ color: 0xf0e2c0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
      const line = new THREE.Line(g, m);
      scene.add(line);
      meteors.push({ line, life: -1, vx: 0, vy: 0 });
    }

    let composer = null;
    let bloom = null;
    if (fine && !reduced) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.42, 0.55, 0.78);
      composer.addPass(bloom);
    }

    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    /** @type {{ mesh: THREE.Mesh, cell: object, home: THREE.Vector3, phase: number, state: string, t: number, scale: number }[]} */
    let pieces = [];
    let layout = { grid: 5, gapX: 1.7, gapY: 1.7, scale: 1.1, halfX: 4.6, halfY: 4.6 };

    const computeLayout = (grid) => {
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      const aspect = Math.max(0.55, Math.min(2.1, w / Math.max(1, h)));
      const spanY = coarse ? 8.4 : 8.8;
      const spanX = spanY * Math.max(0.62, Math.min(1.55, aspect));
      const gapX = spanX / grid;
      const gapY = spanY / grid;
      const scale = Math.min(gapX, gapY) * 0.68;
      return { grid, gapX, gapY, scale, halfX: spanX / 2 + gapX * 0.15, halfY: spanY / 2 + gapY * 0.15 };
    };

    const applyLayout = () => {
      const { grid, gapX, gapY, scale } = layout;
      const ox = -((grid - 1) * gapX) / 2;
      const oy = ((grid - 1) * gapY) / 2;
      pieces.forEach((p, idx) => {
        const col = idx % grid;
        const row = Math.floor(idx / grid);
        p.home.set(ox + col * gapX, oy - row * gapY, 0);
        p.scale = scale;
        if (p.state === 'idle') {
          p.mesh.position.set(p.home.x, p.home.y, p.home.z);
          p.mesh.scale.setScalar(scale);
        }
      });
    };

    const disposeBoard = () => {
      for (const p of pieces) {
        disposeObject3D(p.mesh);
        boardGroup.remove(p.mesh);
      }
      pieces = [];
    };

    const frameBoard = () => {
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      const aspect = w / Math.max(1, h);
      const desk = isDesktopLayout(w, h);
      camera.aspect = aspect;
      camera.fov = coarse ? 54 : desk ? 46 : 48;
      const pad = coarse ? 1.16 : desk ? 1.08 : 1.12;
      const vFov = (camera.fov * Math.PI) / 180;
      const tan = Math.tan(vFov / 2);
      const hudPx = Math.max(120, Math.min(210, h * 0.17));
      const hudFrac = Math.min(0.42, hudPx / Math.max(1, h));
      const dist = Math.max(
        (layout.halfY * pad) / (tan * (1 - hudFrac)),
        (layout.halfX * pad) / (tan * Math.max(0.2, aspect)),
      );
      const nudge = hudFrac * dist * tan;
      boardGroup.position.set(0, -nudge, 0);
      camera.position.set(0, 0, dist);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      composer?.setSize(w, h);
      bloom?.resolution.set(w, h);
    };

    const loadBoard = (r) => {
      disposeBoard();
      if (!r || !Array.isArray(r.cells)) return;
      layout = computeLayout(r.grid);
      boardGroup.rotation.set(0, 0, 0);
      r.cells.forEach((cell) => {
        const mesh = makeShapeObject(cell.shape, cell.fill);
        mesh.position.set(0, 0, -4);
        mesh.scale.setScalar(0.01);
        mesh.rotation.set(0, 0, 0);
        mesh.userData.pieceIndex = pieces.length;
        boardGroup.add(mesh);
        pieces.push({ mesh, cell, home: new THREE.Vector3(0, 0, 0), phase: Math.random() * Math.PI * 2, state: 'enter', t: 0, scale: layout.scale });
      });
      applyLayout();
      frameBoard();
    };

    // Reflect the parent's live cell state onto the pieces (pop / miss / mark).
    const applyCells = (nextCells) => {
      if (!Array.isArray(nextCells)) return;
      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];
        const cell = nextCells[i];
        if (!cell || !cell.tapped) continue;
        if (p.state === 'pop' || p.state === 'gone' || p.state === 'bad' || p.state === 'marked') continue;
        const fb = cell.feedback;
        if (fb === 'bad') {
          p.state = 'bad';
          p.t = 0;
        } else if (fb === 'mark') {
          // Assessment is feedback-free: a neutral dim, no colour reveal, stays put.
          p.state = 'marked';
          p.mesh.traverse((o) => { if (o.isMesh && o.material) { o.material.transparent = true; o.material.opacity = 0.5; } });
        } else {
          // Correct hit: pop + burst, then vanish.
          p.state = 'pop';
          p.t = 0;
          spawnBurst(p.mesh.getWorldPosition(new THREE.Vector3()), 'ok');
        }
      }
    };

    const setInteractive = (v) => {
      acceptTaps = v;
      if (v) engageAt = performance.now() + 300;
    };

    // ── Input: raycast → report the tapped cell index to the parent ──
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const tmpProj = new THREE.Vector3();

    const resolvePiece = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const live = pieces.filter((p) => p.mesh.visible && !p.cell.tapped
        && (p.state === 'idle' || p.state === 'enter'));
      const hits = raycaster.intersectObjects(live.map((p) => p.mesh), true);
      if (hits.length) {
        let hitObj = hits[0].object;
        while (hitObj && hitObj.userData.pieceIndex == null && hitObj.parent) hitObj = hitObj.parent;
        return pieces[hitObj?.userData.pieceIndex] || null;
      }
      if (!coarse) return null;
      let best = null;
      let bestD = 0.16;
      for (const p of live) {
        tmpProj.copy(p.home).add(boardGroup.position).project(camera);
        const dist = Math.hypot(tmpProj.x - pointer.x, tmpProj.y - pointer.y);
        if (dist < bestD) { bestD = dist; best = p; }
      }
      return best;
    };

    const onPointer = (clientX, clientY) => {
      if (!acceptTaps) return;
      if (performance.now() < engageAt) return;
      const piece = resolvePiece(clientX, clientY);
      if (!piece || piece.cell.tapped || (piece.state !== 'idle' && piece.state !== 'enter')) return;
      // Optimistic lock so a second raycast can't double-fire before the parent's
      // state update flows back through applyCells and resolves this piece.
      piece.state = 'pending';
      onTapRef.current?.(piece.mesh.userData.pieceIndex);
    };

    const onPointerUp = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      onPointer(e.clientX, e.clientY);
    };
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const resize = () => {
      if (roundRef.current && pieces.length) {
        layout = computeLayout(roundRef.current.grid);
        applyLayout();
      }
      frameBoard();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    window.visualViewport?.addEventListener('resize', resize);

    let raf = 0;
    let last = performance.now();
    let meteorCd = 2.2;

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const tsec = now * 0.001;

      if (!reduced) {
        boardGroup.rotation.set(0, 0, 0);
        meteorCd -= dt;
        if (meteorCd <= 0) {
          meteorCd = 3 + Math.random() * 4.5;
          const m = meteors.find((x) => x.life < 0);
          if (m) {
            const pos = m.line.geometry.attributes.position.array;
            const x0 = (Math.random() - 0.5) * 16;
            const y0 = 5 + Math.random() * 3;
            pos[0] = x0; pos[1] = y0; pos[2] = -8;
            pos[3] = x0; pos[4] = y0; pos[5] = -8;
            m.vx = -3.5 - Math.random() * 2;
            m.vy = -2.4 - Math.random();
            m.life = 0.75;
            m.line.material.opacity = 0.9;
            m.line.geometry.attributes.position.needsUpdate = true;
          }
        }
        for (const m of meteors) {
          if (m.life < 0) continue;
          m.life -= dt;
          const pos = m.line.geometry.attributes.position.array;
          pos[3] = pos[0]; pos[4] = pos[1]; pos[5] = pos[2];
          pos[0] += m.vx * dt * 2.4;
          pos[1] += m.vy * dt * 2.4;
          m.line.geometry.attributes.position.needsUpdate = true;
          m.line.material.opacity = Math.max(0, m.life);
          if (m.life <= 0) m.life = -1;
        }
      }

      for (const p of pieces) {
        p.t += dt;
        const mesh = p.mesh;
        if (p.state === 'enter') {
          const k = Math.min(1, p.t / 0.55);
          const e = 1 - (1 - k) ** 3;
          mesh.position.lerpVectors(new THREE.Vector3(p.home.x, p.home.y, p.home.z - 4), p.home, e);
          mesh.scale.setScalar(p.scale * e);
          if (k >= 1) p.state = 'idle';
        } else if (p.state === 'idle' || p.state === 'pending') {
          mesh.position.set(p.home.x, p.home.y + Math.sin(tsec * 1.3 + p.phase) * 0.045, p.home.z);
          mesh.rotation.set(0, 0, 0);
          mesh.scale.setScalar(p.scale);
        } else if (p.state === 'pop') {
          const k = Math.min(1, p.t / 0.32);
          mesh.scale.setScalar(p.scale * (1 + k * 0.55));
          mesh.traverse((o) => { if (o.isMesh && o.material) { o.material.transparent = true; o.material.opacity = 1 - k; } });
          if (k >= 1) { mesh.visible = false; p.state = 'gone'; }
        } else if (p.state === 'bad') {
          mesh.traverse((o) => { if (o.isMesh && o.material?.emissive) { o.material.emissive.setHex(0xff3344); o.material.emissiveIntensity = 0.85; } });
          if (p.t > 0.35) {
            mesh.traverse((o) => {
              if (o.isMesh && o.material) {
                if (o.material.emissiveIntensity != null) o.material.emissiveIntensity = 0.22;
                o.material.transparent = true;
                o.material.opacity = 0.4;
              }
            });
            mesh.position.copy(p.home);
            mesh.rotation.set(0, 0, 0);
            p.state = 'done';
          }
        }
      }

      let alive = false;
      let maxLife = 0;
      for (let i = 0; i < BURST; i++) {
        if (burstLife[i] <= 0) continue;
        alive = true;
        burstLife[i] -= dt;
        maxLife = Math.max(maxLife, burstLife[i]);
        burstPos[i * 3] += burstVel[i * 3] * dt * 2.6;
        burstPos[i * 3 + 1] += burstVel[i * 3 + 1] * dt * 2.6;
        burstPos[i * 3 + 2] += burstVel[i * 3 + 2] * dt * 2.6;
        burstVel[i * 3 + 1] -= dt * 0.9;
      }
      if (alive) {
        burstGeo.attributes.position.needsUpdate = true;
        burstMat.opacity = 0.2 + maxLife * 0.9;
      } else {
        burstMat.opacity = 0;
      }

      if (composer) composer.render();
      else renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    apiRef.current = { loadBoard, setInteractive, applyCells, ready: true };
    // Load whatever round React already committed before the scene finished booting.
    if (roundRef.current) {
      loadBoard(roundRef.current);
      if (Array.isArray(cells)) applyCells(cells);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.visualViewport?.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      disposeBoard();
      starGeo.dispose(); starMat.dispose();
      dustGeo.dispose(); dustMat.dispose();
      burstGeo.dispose(); burstMat.dispose();
      for (const m of meteors) { m.line.geometry.dispose(); m.line.material.dispose(); }
      composer?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === wrap) wrap.removeChild(renderer.domElement);
      apiRef.current = { loadBoard() {}, setInteractive() {}, applyCells() {}, ready: false };
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload the board whenever a new round arrives.
  useEffect(() => {
    roundRef.current = round;
    if (round && apiRef.current.ready) {
      apiRef.current.loadBoard(round);
      apiRef.current.applyCells(cells || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  // Reflect live tap state onto the board.
  useEffect(() => {
    if (apiRef.current.ready) apiRef.current.applyCells(cells || []);
  }, [cells]);

  // Accept taps only while the parent says the round is live.
  useEffect(() => {
    if (apiRef.current.ready) apiRef.current.setInteractive(!!interactive);
  }, [interactive]);

  return <div className="c3d-scene-canvas" ref={wrapRef} aria-hidden={isAr ? undefined : true} />;
}
