import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { shapeGeometry } from '../../../../shared/c3dShapes';
import {
  prepareFreeRound,
  freeRoundErrorCap,
  freeTapPoints,
  freeRoundClearPoints,
  freeWrongTapPenalty,
  SH,
} from '../../../../shared/focusQuestData';
import {
  isCoarsePointer,
  isDesktopLayout,
} from '../../../../shared/c3dViewport';
import '../../../../shared/c3dProto.css';

/*
 * Cancellation · 3D prototype (v2)
 * Full Three.js arena: you float in a cosmos and tap 3D shape meshes that match
 * the target. Same Survival board generator (prepareFreeRound); parallel path only.
 */

const UI = {
  en: {
    title: 'Cancellation · 3D',
    tag: 'prototype',
    hint: 'Tap every 3D shape that matches the target. Clear the board before time runs out.',
    found: 'Found',
    err: 'Errors',
    stage: 'Stage',
    clear: 'Sector clear',
    next: 'Next sector',
    over: 'Signal lost',
    retry: 'Try again',
    hub: 'Back to modes',
    go: 'ENGAGE',
    cue: 'Target',
  },
  ar: {
    title: 'الشطب · ثلاثي الأبعاد',
    tag: 'نموذج',
    hint: 'المس كل شكل ثلاثي الأبعاد يطابق الهدف. أكمِل اللوحة قبل نفاد الوقت.',
    found: 'وُجد',
    err: 'أخطاء',
    stage: 'مرحلة',
    clear: 'اكتمل القطاع',
    next: 'القطاع التالي',
    over: 'فُقد الإشارة',
    retry: 'حاول مجددًا',
    hub: 'العودة للأوضاع',
    go: 'انطلق',
    cue: 'الهدف',
  },
};

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

  // Dark contour behind the shape — keeps the silhouette crisp under bloom.
  const outline = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x120d07 }));
  outline.scale.setScalar(1.12);
  outline.position.z = -0.05;
  g.add(outline);

  const mesh = new THREE.Mesh(geo, makeMat(colorHex, { emissive: 0.32, metalness: 0.28, roughness: 0.42 }));
  g.add(mesh);

  // Soft backing plate for figure/ground contrast.
  const plate = new THREE.Mesh(
    new THREE.CircleGeometry(0.72, 28),
    new THREE.MeshBasicMaterial({
      color: 0x12100c,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
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

function buildRound(stage) {
  const r = prepareFreeRound(stage);
  return {
    ...r,
    cells: r.cells.map((c, i) => ({ ...c, id: i, tapped: false, feedback: null })),
  };
}

function ShapeHud({ shape, color }) {
  const markup = SH[shape] || SH.circle;
  return (
    <svg
      width={34}
      height={34}
      viewBox="0 0 100 100"
      className="c3d-shape"
      style={{ color: color || '#f0e2c0' }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

export default function Cancel3DProto({ isAr, playSfx, onBack }) {
  const t = UI[isAr ? 'ar' : 'en'];
  const wrapRef = useRef(null);
  const apiRef = useRef({
    loadBoard: () => {},
    setInteractive: () => {},
  });

  const boot = useMemo(() => buildRound(0), []);
  const [stage, setStage] = useState(0);
  const [round, setRound] = useState(boot);
  const [found, setFound] = useState(0);
  const [errors, setErrors] = useState(0);
  const [timeLeft, setTimeLeft] = useState(boot.tlim);
  const [banner, setBanner] = useState(null);
  const [cleared, setCleared] = useState(0);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);

  const stageRef = useRef(0);
  const roundRef = useRef(boot);
  const foundRef = useRef(0);
  const errorsRef = useRef(0);
  const timeLeftRef = useRef(boot.tlim);
  const runningRef = useRef(false);
  const bannerRef = useRef(null);
  const goTimerRef = useRef(0);
  const clearedRef = useRef(0);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const startRoundRef = useRef(() => {});
  const playSfxRef = useRef(playSfx);
  playSfxRef.current = playSfx;
  const engageAtRef = useRef(0);

  const errCap = useMemo(() => freeRoundErrorCap(round.tc), [round.tc]);
  const timePct = Math.max(0, Math.min(1, timeLeft / Math.max(1, round.tlim)));

  // ── Three.js arena ──────────────────────────────────────────────
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;
    const coarse = isCoarsePointer();

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.028);

    // Slightly wider FOV on phones so the lattice fills the tall viewport
    const camera = new THREE.PerspectiveCamera(coarse ? 54 : 48, 1, 0.1, 80);
    camera.position.set(0, 0, 11.2);

    const renderer = new THREE.WebGLRenderer({ antialias: !coarse, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.35 : fine ? 1.6 : 1.25));
    renderer.setClearColor(0x000000, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
    wrap.appendChild(renderer.domElement);

    // Lights — warm / neutral only (no blue wash)
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
      color: 0xf0e2c0,
      size: fine ? 0.04 : 0.055,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
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
      color: 0xe8ac4e,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
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
      color: 0xe8ac4e,
      size: 0.14,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
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
      const m = new THREE.LineBasicMaterial({
        color: 0xf0e2c0,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
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

    /** @type {{ mesh: THREE.Mesh, cell: object, home: THREE.Vector3, phase: number, state: string, t: number }[]} */
    let pieces = [];
    let interactive = false;
    // Aspect-aware lattice: per-axis spacing so the board FILLS the viewport
    // (wide on desktop, tall on phones) exactly like the 2D play area.
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
      return {
        grid,
        gapX,
        gapY,
        scale,
        halfX: spanX / 2 + gapX * 0.15,
        halfY: spanY / 2 + gapY * 0.15,
      };
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
      // Fit the lattice into the viewport area BELOW the top HUD (title + hint
      // + stats + timebar), so no shape can ever sit behind the chrome. The
      // board is fitted per axis (it is wider than tall on desktop) and then
      // centred within the sub-HUD band.
      const vFov = (camera.fov * Math.PI) / 180;
      const tan = Math.tan(vFov / 2);
      const hudPx = Math.max(120, Math.min(210, h * 0.17));
      const hudFrac = Math.min(0.42, hudPx / Math.max(1, h));
      const dist = Math.max(
        (layout.halfY * pad) / (tan * (1 - hudFrac)),
        (layout.halfX * pad) / (tan * Math.max(0.2, aspect)),
      );
      const nudge = hudFrac * dist * tan; // centre of the area under the HUD
      boardGroup.position.set(0, -nudge, 0);
      camera.position.set(0, 0, dist);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      composer?.setSize(w, h);
      bloom?.resolution.set(w, h);
    };

    const loadBoard = (round) => {
      disposeBoard();
      const grid = round.grid;
      layout = computeLayout(grid);
      boardGroup.rotation.set(0, 0, 0);

      round.cells.forEach((cell) => {
        const mesh = makeShapeObject(cell.shape, cell.fill);
        mesh.position.set(0, 0, -4);
        mesh.scale.setScalar(0.01);
        mesh.rotation.set(0, 0, 0);
        mesh.userData.pieceIndex = pieces.length;
        boardGroup.add(mesh);
        pieces.push({
          mesh,
          cell,
          home: new THREE.Vector3(0, 0, 0),
          phase: Math.random() * Math.PI * 2,
          state: 'enter',
          t: 0,
          scale: layout.scale,
        });
      });
      applyLayout();
      frameBoard();
    };

    const setInteractive = (v) => { interactive = v; };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const finishWrong = () => {
      // 2D free: FREE_LIVES = 1 — a failed round (timeout / error cap) ends the run.
      streakRef.current = 0;
      runningRef.current = false;
      interactive = false;
      bannerRef.current = 'over';
      setBanner('over');
      setRunning(false);
    };

    const finishClear = () => {
      runningRef.current = false;
      interactive = false;
      clearedRef.current += 1;
      setCleared(clearedRef.current);
      // 2D free: clear streak → clear bonus, then AUTO-ramp to the next stage.
      streakRef.current += 1;
      scoreRef.current += freeRoundClearPoints(roundRef.current?.tlim, streakRef.current);
      setScore(scoreRef.current);
      bannerRef.current = 'clear';
      setBanner('clear');
      setRunning(false);
      spawnBurst(new THREE.Vector3(0, 0, 2), 'clear');
      playSfxRef.current?.('win');
      window.setTimeout(() => {
        if (bannerRef.current === 'clear') startRoundRef.current(stageRef.current + 1);
      }, 900);
    };

    const tmpProj = new THREE.Vector3();
    const resolvePiece = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const live = pieces.filter((p) => p.mesh.visible && p.state !== 'gone' && p.state !== 'bad' && !p.cell.tapped);
      const hits = raycaster.intersectObjects(live.map((p) => p.mesh), true);
      if (hits.length) {
        let hitObj = hits[0].object;
        while (hitObj && hitObj.userData.pieceIndex == null && hitObj.parent) hitObj = hitObj.parent;
        return pieces[hitObj?.userData.pieceIndex] || null;
      }
      if (!coarse) return null;
      // Soft pick for thumbs — nearest cell center in screen space
      let best = null;
      let bestD = 0.16;
      for (const p of live) {
        tmpProj.copy(p.home).add(boardGroup.position).project(camera);
        const dist = Math.hypot(tmpProj.x - pointer.x, tmpProj.y - pointer.y);
        if (dist < bestD) {
          bestD = dist;
          best = p;
        }
      }
      return best;
    };

    const onPointer = (clientX, clientY) => {
      if (!interactive || bannerRef.current) return;
      // Ignore clicks in the first moments after ENGAGE (avoids ghost taps from UI)
      if (performance.now() < engageAtRef.current) return;
      const piece = resolvePiece(clientX, clientY);
      if (!piece || piece.state === 'gone' || piece.state === 'bad' || piece.cell.tapped) return;
      const mesh = piece.mesh;

      piece.cell.tapped = true;
      if (piece.cell.isT) {
        piece.state = 'pop';
        piece.t = 0;
        foundRef.current += 1;
        setFound(foundRef.current);
        // 2D free scoring: every correct tap earns depth-weighted points.
        scoreRef.current += freeTapPoints(roundRef.current.diff, roundRef.current.freeStage ?? stageRef.current);
        setScore(scoreRef.current);
        spawnBurst(mesh.getWorldPosition(new THREE.Vector3()), 'ok');
        playSfxRef.current?.('collect');
        if (foundRef.current >= roundRef.current.tc) finishClear();
      } else {
        piece.state = 'bad';
        piece.t = 0;
        errorsRef.current += 1;
        setErrors(errorsRef.current);
        // 2D free: a wrong tap costs points AND 3s of the round clock.
        scoreRef.current = Math.max(0, scoreRef.current - freeWrongTapPenalty(roundRef.current.diff));
        setScore(scoreRef.current);
        timeLeftRef.current -= 3;
        spawnBurst(mesh.getWorldPosition(new THREE.Vector3()), 'bad');
        playSfxRef.current?.('error');
        const cap = freeRoundErrorCap(roundRef.current.tc);
        if (errorsRef.current >= cap) finishWrong();
      }
    };

    const onPointerUp = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      onPointer(e.clientX, e.clientY);
    };
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // Re-layout on resize/rotation so the lattice keeps filling the viewport.
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
        // Camera framing is owned by frameBoard() — never reset Z here
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

      // Animate pieces
      for (const p of pieces) {
        p.t += dt;
        const mesh = p.mesh;
        if (p.state === 'enter') {
          const k = Math.min(1, p.t / 0.55);
          const e = 1 - (1 - k) ** 3;
          mesh.position.lerpVectors(
            new THREE.Vector3(p.home.x, p.home.y, p.home.z - 4),
            p.home,
            e,
          );
          mesh.scale.setScalar(p.scale * e);
          if (k >= 1) p.state = 'idle';
        } else if (p.state === 'idle') {
          // Gentle float only — orientation stays face-on so silhouettes always read.
          mesh.position.set(p.home.x, p.home.y + Math.sin(tsec * 1.3 + p.phase) * 0.045, p.home.z);
          mesh.rotation.set(0, 0, 0);
          mesh.scale.setScalar(p.scale);
        } else if (p.state === 'pop') {
          const k = Math.min(1, p.t / 0.32);
          mesh.scale.setScalar(p.scale * (1 + k * 0.55));
          mesh.traverse((o) => {
            if (o.isMesh && o.material) {
              o.material.transparent = true;
              o.material.opacity = 1 - k;
            }
          });
          if (k >= 1) {
            mesh.visible = false;
            p.state = 'gone';
          }
        } else if (p.state === 'bad') {
          mesh.traverse((o) => {
            if (o.isMesh && o.material?.emissive) {
              o.material.emissive.setHex(0xff3344);
              o.material.emissiveIntensity = 0.85;
            }
          });
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
            p.state = 'idle';
          }
        }
      }

      // Bursts
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

    apiRef.current = { loadBoard, setInteractive, ready: true };
    // If React already queued a board before the scene finished booting, load it now.
    if (roundRef.current) loadBoard(roundRef.current);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.visualViewport?.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      disposeBoard();
      starGeo.dispose();
      starMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      burstGeo.dispose();
      burstMat.dispose();
      for (const m of meteors) {
        m.line.geometry.dispose();
        m.line.material.dispose();
      }
      composer?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === wrap) wrap.removeChild(renderer.domElement);
      apiRef.current = { loadBoard: () => {}, setInteractive: () => {}, ready: false };
    };
  }, [playSfx]);

  // Timer
  useEffect(() => {
    if (!running) return undefined;
    let last = performance.now();
    let raf = 0;
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      timeLeftRef.current -= dt;
      if (timeLeftRef.current <= 0) {
        timeLeftRef.current = 0;
        setTimeLeft(0);
        runningRef.current = false;
        apiRef.current.setInteractive(false);
        bannerRef.current = 'over';
        setBanner('over');
        setRunning(false);
        playSfxRef.current?.('error');
        return;
      }
      setTimeLeft(timeLeftRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const startRound = (stageIndex) => {
    const r = buildRound(stageIndex);
    roundRef.current = r;
    stageRef.current = stageIndex;
    foundRef.current = 0;
    errorsRef.current = 0;
    timeLeftRef.current = r.tlim;
    runningRef.current = false;
    bannerRef.current = 'go';
    setRound(r);
    setStage(stageIndex);
    setFound(0);
    setErrors(0);
    setTimeLeft(r.tlim);
    setBanner('go');
    setRunning(false);
    apiRef.current.setInteractive(false);
    apiRef.current.loadBoard(r);
    playSfxRef.current?.('click');
    window.clearTimeout(goTimerRef.current);
    goTimerRef.current = window.setTimeout(() => {
      bannerRef.current = null;
      setBanner(null);
      runningRef.current = true;
      setRunning(true);
      engageAtRef.current = performance.now() + 350;
      apiRef.current.setInteractive(true);
      playSfxRef.current?.('collect');
    }, 900);
  };
  startRoundRef.current = startRound;

  useEffect(() => {
    // Wait a frame so the Three scene api is ready
    const id = requestAnimationFrame(() => startRound(0));
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(goTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="c3d-root" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="c3d-canvas" ref={wrapRef} aria-hidden="true" />

      <div className="c3d-ui c3d-ui--overlay">
        <header className="c3d-top">
          <button
            type="button"
            className="c3d-icon-btn"
            onClick={() => { playSfx?.('click'); onBack(); }}
          >
            {isAr ? '›' : '‹'}
          </button>
          <div className="c3d-titles">
            <div className="c3d-title">{t.title}</div>
            <div className="c3d-tag">{t.tag}</div>
          </div>
          <div className="c3d-target-chip" title={t.cue}>
            <ShapeHud shape={round.target} color={round.targetCol} />
          </div>
        </header>

        <p className="c3d-hint">{t.hint}</p>

        <div className="c3d-stats">
          <span>{t.stage} {stage + 1}</span>
          <span>{t.found} {found}/{round.tc}</span>
          <span>{t.err} {errors}/{errCap}</span>
          <span>{score} {isAr ? 'نقطة' : 'pts'}</span>
          <span>{Math.ceil(timeLeft)}s</span>
        </div>
        <div className="c3d-timebar" aria-hidden="true">
          <div className="c3d-timebar-fill" style={{ transform: `scaleX(${timePct})` }} />
        </div>
      </div>

      {banner && (
        <div className={`c3d-banner c3d-banner--${banner}`}>
          {banner === 'go' && <span>{t.go}</span>}
          {banner === 'clear' && <span>{t.clear}</span>}
          {banner === 'over' && (
            <>
              <span>{t.over}</span>
              <div className="c3d-banner-meta">
                {t.stage} {stage + 1} · {cleared} {isAr ? 'قطاعات' : 'sectors'} · {score} {isAr ? 'نقطة' : 'pts'}
              </div>
              <div className="c3d-banner-actions">
                <button
                  type="button"
                  className="c3d-cta"
                  onClick={() => { playSfx?.('click'); clearedRef.current = 0; setCleared(0); scoreRef.current = 0; setScore(0); streakRef.current = 0; startRound(0); }}
                >
                  {t.retry}
                </button>
                <button
                  type="button"
                  className="c3d-cta c3d-cta--ghost"
                  onClick={() => { playSfx?.('click'); onBack(); }}
                >
                  {t.hub}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
