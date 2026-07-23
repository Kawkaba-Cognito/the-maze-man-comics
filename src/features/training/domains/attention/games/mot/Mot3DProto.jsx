import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { isCoarsePointer } from '../../../../shared/c3dViewport';
import '../../../../shared/c3dProto.css';

/*
 * MotScene3D — Target Tracking rendered as a 3D cosmos arena.
 *
 * CONTROLLED view: it owns no game logic. The engine (MotEngine in ./index.jsx)
 * runs the dot physics, phases, scoring, trialLog and XP, and passes refs:
 *   - dotsRef   live dots [{ x, y, r, target, selected }] in field-pixel space
 *   - fieldRef  the arena rect { x0, y0, w, h } those pixels live in
 *   - phaseRef  'cue' | 'track' | 'respond' | 'result'
 *   - interactive  whether taps select dots right now (respond phase)
 *   - onPickDot(index)  called when a dot is tapped; the engine toggles it
 * Each frame the scene reads dot positions, maps field-pixels → world units
 * (scaled by the LONGER field side so nothing distorts or leaves view), paints
 * by phase, and raycasts taps. The HUD/instruction/results are DOM the engine
 * renders above the scene.
 */

const COL_DOT = 0x4f9fe0;    // identical blue while tracking (identity held by attention)
const COL_TARGET = 0xe8ac4e; // amber cue
const COL_OK = 0x62b277;     // result: correct target
const COL_BAD = 0xdd7f7a;    // result: wrong pick
const COL_SEL = 0xf0e2c0;    // respond: selected
const COL_MISS = 0x8a97a8;   // result: missed target / unpicked

const ARENA = 4.6; // world half-extent the field is fit into

export default function MotScene3D({ dotsRef, fieldRef, phaseRef, interactive, onPickDot, isAr }) {
  const wrapRef = useRef(null);
  const onPickRef = useRef(onPickDot);
  onPickRef.current = onPickDot;
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;
    const coarse = isCoarsePointer();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(coarse ? 56 : 50, 1, 0.1, 80);
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: !coarse });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.35 : fine ? 1.5 : 1.25));
    renderer.setClearColor(0x05040a, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
    wrap.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xb8a88a, 0.6));
    const key = new THREE.DirectionalLight(0xfff0d8, 1.1);
    key.position.set(2, 4, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0xe8ac4e, 1.1, 30);
    rim.position.set(-3, 2, 4);
    scene.add(rim);

    // Stars
    const starN = fine ? 1200 : 800;
    const starPos = new Float32Array(starN * 3);
    for (let i = 0; i < starN; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 50;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 34;
      starPos[i * 3 + 2] = -6 - Math.random() * 30;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xf0e2c0, size: 0.045, transparent: true, opacity: 0.8,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    let composer = null;
    let bloom = null;
    if (fine && !reduced) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.35, 0.5, 0.8);
      composer.addPass(bloom);
    }

    const group = new THREE.Group();
    scene.add(group);

    // Arena frame (updated to the live field rect each frame).
    const frameGeo = new THREE.BufferGeometry();
    frameGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(15), 3));
    const arenaFrame = new THREE.Line(frameGeo, new THREE.LineBasicMaterial({ color: 0xe8ac4e, transparent: true, opacity: 0.32 }));
    group.add(arenaFrame);

    const dotGeo = new THREE.SphereGeometry(1, coarse ? 18 : 24, coarse ? 14 : 18);
    const ringGeo = new THREE.TorusGeometry(1.7, 0.14, 10, 24);
    const dotGroup = new THREE.Group();
    group.add(dotGroup);

    /** @type {THREE.Mesh[]} */
    let meshes = [];
    let lastDots = null;

    const disposeMeshes = () => {
      for (const m of meshes) {
        m.material?.dispose?.();
        m.userData.ring?.material?.dispose?.();
      }
      while (dotGroup.children.length) dotGroup.children.pop();
      meshes = [];
    };

    const rebuild = (n) => {
      disposeMeshes();
      for (let i = 0; i < n; i++) {
        const mat = new THREE.MeshStandardMaterial({
          color: COL_DOT, emissive: new THREE.Color(COL_DOT), emissiveIntensity: 0.18,
          metalness: 0.35, roughness: 0.4,
        });
        const mesh = new THREE.Mesh(dotGeo, mat);
        const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: COL_TARGET, transparent: true, opacity: 0.9 }));
        ring.visible = false;
        mesh.add(ring);
        mesh.userData = { dotIndex: i, ring };
        dotGroup.add(mesh);
        meshes.push(mesh);
      }
    };

    const setCol = (mesh, hex, emissive) => {
      mesh.material.color.setHex(hex);
      mesh.material.emissive.setHex(hex);
      mesh.material.emissiveIntensity = emissive;
    };

    // Fit the ACTUAL field rect so it FILLS the viewport (no tiny letterboxed
    // arena). fieldW/H come from the engine's field and update per round.
    let fieldW = 0;
    let fieldH = 0;
    const frameCamera = () => {
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      const aspect = w / Math.max(1, h);
      camera.aspect = aspect;
      const tan = Math.tan(((camera.fov * Math.PI) / 180) / 2);
      const pad = 1.04;
      const longer = Math.max(1, Math.max(fieldW, fieldH));
      const k = (ARENA * 2) / longer;
      const hw = fieldW > 0 ? (fieldW / 2) * k : ARENA;
      const hh = fieldH > 0 ? (fieldH / 2) * k : ARENA;
      const dist = Math.max((hh * pad) / tan, (hw * pad) / (tan * aspect));
      camera.position.set(0, 0, dist);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      composer?.setSize(w, h);
      bloom?.resolution.set(w, h);
    };
    frameCamera();
    const ro = new ResizeObserver(frameCamera);
    ro.observe(wrap);

    // Map + paint the live dots each frame.
    const syncDots = () => {
      const f = fieldRef.current;
      const dots = dotsRef.current;
      if (!f || !f.w || !Array.isArray(dots)) return;
      if (f.w !== fieldW || f.h !== fieldH) { fieldW = f.w; fieldH = f.h; frameCamera(); }
      if (dots !== lastDots || meshes.length !== dots.length) {
        rebuild(dots.length);
        lastDots = dots;
      }
      const ph = phaseRef.current;
      const cx = f.x0 + f.w / 2;
      const cy = f.y0 + f.h / 2;
      const k = (ARENA * 2) / Math.max(1, Math.max(f.w, f.h)); // scale by LONGER side → always in view
      const worldR = Math.max(0.12, (dots[0]?.r || 12) * k);

      // Arena frame to the real field rect.
      const hx = (f.w / 2) * k;
      const hy = (f.h / 2) * k;
      const fp = arenaFrame.geometry.attributes.position.array;
      fp.set([-hx, -hy, 0, hx, -hy, 0, hx, hy, 0, -hx, hy, 0, -hx, -hy, 0]);
      arenaFrame.geometry.attributes.position.needsUpdate = true;

      for (let i = 0; i < meshes.length; i++) {
        const d = dots[i];
        const m = meshes[i];
        if (!d) { m.visible = false; continue; }
        m.visible = true;
        m.position.set((d.x - cx) * k, -(d.y - cy) * k, 0);

        let col = COL_DOT;
        let emis = 0.18;
        let hot = false;
        if (ph === 'cue' && d.target) { col = COL_TARGET; emis = 0.55; hot = true; }
        else if (ph === 'respond' && d.selected) { col = COL_SEL; emis = 0.5; hot = true; }
        else if (ph === 'result') {
          if (d.target && d.selected) { col = COL_OK; emis = 0.5; hot = true; }
          else if (d.target) { col = COL_OK; emis = 0.25; }
          else if (d.selected) { col = COL_BAD; emis = 0.5; hot = true; }
          else { col = COL_MISS; emis = 0.1; }
        }
        setCol(m, col, emis);
        m.scale.setScalar(worldR * (hot ? 1.15 : 1));
        const ring = m.userData.ring;
        ring.visible = hot && (ph === 'cue' || ph === 'respond' || (ph === 'result' && d.target));
        if (ring.visible) ring.material.color.setHex(col);
      }
    };

    // Raycast taps → dot index → engine.
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointerUp = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (!interactiveRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      raycaster.params.Points = raycaster.params.Points || {};
      // Generous pick: nearest dot to the ray in screen space (thumb-friendly).
      const hits = raycaster.intersectObjects(meshes.filter((m) => m.visible), false);
      let idx = null;
      if (hits.length) {
        idx = hits[0].object.userData.dotIndex;
      } else {
        let best = 0.06;
        const proj = new THREE.Vector3();
        for (const m of meshes) {
          if (!m.visible) continue;
          proj.copy(m.position).project(camera);
          const dist = Math.hypot(proj.x - pointer.x, proj.y - pointer.y);
          if (dist < best) { best = dist; idx = m.userData.dotIndex; }
        }
      }
      if (idx != null) onPickRef.current?.(idx);
    };
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    let raf = 0;
    let tsec = 0;
    let last = performance.now();
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      tsec += Math.min(0.05, (now - last) / 1000);
      last = now;
      syncDots();
      // Gentle pulse on hot rings.
      if (!reduced) {
        const s = 1 + Math.sin(tsec * 4) * 0.06;
        for (const m of meshes) if (m.userData.ring?.visible) m.userData.ring.scale.setScalar(s);
      }
      if (composer) composer.render();
      else renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      disposeMeshes();
      dotGeo.dispose();
      ringGeo.dispose();
      frameGeo.dispose();
      arenaFrame.material.dispose();
      starGeo.dispose();
      starMat.dispose();
      composer?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === wrap) wrap.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="c3d-scene-canvas" ref={wrapRef} style={{ position: 'absolute', inset: 0 }} aria-hidden={isAr ? undefined : true} />;
}
