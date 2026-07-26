import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createTutorialHandInstance } from '../../shared/tutorialHandModel';
import { isCoarsePointer, releaseGlContext } from '../c3dViewport';

/*
 * TutorialHand3D — a floating pointing-hand overlay for guided tutorials,
 * Clash-Royale style: it visibly moves over the real UI and "taps" the
 * thing the player should tap next.
 *
 * Fills its parent 100% with a transparent, click-through canvas. Uses an
 * ORTHOGRAPHIC camera exactly fit to the container, so a `target` of
 * {x, y} in 0..1 fractions (0,0 = top-left, matching CSS %) maps linearly
 * to world position — no raycasting/projection math needed at the call site.
 *
 * The source GLB has no rig, so motion is done by tweening the whole mesh's
 * transform: eases toward `target` every frame, floats gently, and on each
 * `tapSignal` change plays a quick procedural dip + scale-punch "tap" pulse.
 * `target={null}` hides the hand (e.g. while Kawkab is just talking).
 */
// On-screen height of the pointer, in CSS pixels — a hand, not a billboard.
const HAND_PX = 96;
const HAND_PX_SMALL = 74;

export default function TutorialHand3D({ target, tapSignal = 0 }) {
  const wrapRef = useRef(null);
  const targetRef = useRef(target);
  const tapRef = useRef({ signal: tapSignal, t: 0 });

  useEffect(() => { targetRef.current = target; }, [target]);
  useEffect(() => {
    if (tapSignal !== tapRef.current.signal) {
      tapRef.current = { signal: tapSignal, t: 0.0001 };
    }
  }, [tapSignal]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const reduced = (() => {
      try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
      catch { return false; }
    })();

    // This canvas fills its parent, so on a phone it is a FULL-SCREEN surface —
    // the most expensive renderer in the tutorial despite drawing one small hand.
    // Match the shared c3dBoot budget on touch rather than asking for MSAA at
    // DPR 2 on a discrete GPU.
    const coarse = isCoarsePointer();

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !coarse,
        alpha: true,
        powerPreference: coarse ? 'default' : 'high-performance',
      });
    } catch {
      return undefined; // no WebGL — hand just never appears, tutorial text still works
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
    camera.position.set(0, 0, 8);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.3 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';
    wrap.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xfff2d8, 0.85));
    const key = new THREE.DirectionalLight(0xfff0d8, 1.15);
    key.position.set(2, 3, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xbfd4ff, 0.35);
    fill.position.set(-2, -1, 3);
    scene.add(fill);

    let model = null;
    let alive = true;
    let halfW = 1;
    let halfH = 1;

    // Measured from tutorial-hand-v1.glb: the narrow pointing tip is +Y (its
    // extreme vertices span 21% of the model's girth, against 42-87% for every
    // other face), so the fingertip is the TOP of the bounding box.
    let fit = null; // { sizeY, ctrX, ctrZ, maxY } in model units

    /**
     * Size the hand in SCREEN pixels and hang it off its fingertip.
     *
     * Both matter. The camera only shows 2 world units vertically, so the old
     * fixed "1.15 units tall" made the hand 57% of the container height — a
     * giant. And centring the bounding box put the hand's MIDDLE on the target,
     * leaving the fingertip pointing half a hand-height above whatever it meant
     * to indicate. Anchoring maxY at the origin puts the tip exactly on target,
     * with the hand hanging below it the way a real finger reaches in.
     */
    const fitModel = () => {
      if (!model || !fit) return;
      const h = wrap.clientHeight || 1;
      const px = (wrap.clientWidth || 1) <= 480 ? HAND_PX_SMALL : HAND_PX;
      const k = ((px * 2) / h) / Math.max(1e-4, fit.sizeY);
      model.scale.setScalar(k);
      model.position.set(-fit.ctrX * k, -fit.maxY * k, -fit.ctrZ * k);
    };

    const resize = () => {
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      const aspect = w / Math.max(1, h);
      halfH = 1;
      halfW = halfH * aspect;
      camera.left = -halfW;
      camera.right = halfW;
      camera.top = halfH;
      camera.bottom = -halfH;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      fitModel(); // world-units-per-pixel just changed
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const worldFor = (fx, fy) => new THREE.Vector3(
      (fx - 0.5) * 2 * halfW,
      (0.5 - fy) * 2 * halfH,
      0,
    );

    createTutorialHandInstance()
      .then((scn) => {
        if (!alive) return;
        model = scn;
        const box = new THREE.Box3().setFromObject(model);
        const sz = box.getSize(new THREE.Vector3());
        const ctr = box.getCenter(new THREE.Vector3());
        // Kept in model units so fitModel() can rescale on every resize without
        // re-measuring (the box would be wrong once we have scaled the model).
        fit = { sizeY: sz.y, ctrX: ctr.x, ctrZ: ctr.z, maxY: box.max.y };
        fitModel();

        model.traverse((n) => {
          if (!n.isMesh) return;
          n.frustumCulled = false;
        });

        const holder = new THREE.Group();
        holder.add(model);
        const t0 = targetRef.current;
        holder.position.copy(t0 ? worldFor(t0.x, t0.y) : new THREE.Vector3(0, 0, 0));
        holder.visible = !!t0;
        scene.add(holder);
        model.userData.holder = holder;
        resize();
      })
      .catch(() => { /* load failed: hand simply never appears */ });

    let raf = 0;
    let last = performance.now();
    let paused = false;
    // `target={null}` means Kawkab is just talking and there is no hand to show.
    // That is most of the tutorial, so idle instead of compositing a full-screen
    // transparent frame every tick: draw once to clear the hand, then stop until
    // there is a target again.
    let clearedFrameDrawn = false;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (paused) return; // tab hidden — nothing on screen to keep up to date
      const target = targetRef.current;
      if (!target) {
        if (clearedFrameDrawn) return;
        clearedFrameDrawn = true;
      } else {
        clearedFrameDrawn = false;
      }
      const holder = model?.userData?.holder;
      if (holder) {
        holder.visible = !!target;
        if (target) {
          // Work in pixels: the camera spans 2 world units vertically, so this
          // keeps the bob and the tap the same size whatever the board's height.
          const pxToWorld = 2 / (wrap.clientHeight || 1);
          const dest = worldFor(target.x, target.y);
          holder.position.lerp(dest, reduced ? 1 : Math.min(1, dt * 6));
          const bob = reduced ? 0 : Math.sin(now / 480) * 3 * pxToWorld;
          const tap = tapRef.current;
          let dip = 0;
          let punch = 1;
          if (tap.t > 0) {
            tap.t += dt;
            const dur = 0.32;
            const p = Math.min(1, tap.t / dur);
            // A z-dip reads as nothing under an orthographic camera, so the tap
            // is a short jab along the pointing axis plus a scale punch.
            dip = Math.sin(p * Math.PI) * 6 * pxToWorld;
            punch = 1 - Math.sin(p * Math.PI) * 0.12;
            if (p >= 1) tap.t = 0;
          }
          // Scale is about the fingertip (the holder origin), so the tip stays
          // planted on the target through the whole punch.
          holder.position.y = dest.y + bob - dip;
          holder.position.z = 0;
          holder.scale.setScalar(punch);
        }
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);

    const onVis = () => { paused = document.hidden; if (!paused) last = performance.now(); };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      model?.removeFromParent?.();
      renderer.dispose();
      releaseGlContext(renderer);
      if (renderer.domElement.parentNode === wrap) wrap.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none' }}
    />
  );
}
