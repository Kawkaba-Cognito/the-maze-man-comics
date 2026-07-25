import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createTutorialHandInstance } from '../../shared/tutorialHandModel';

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

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      return undefined; // no WebGL — hand just never appears, tutorial text still works
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
    camera.position.set(0, 0, 8);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
        // Frame independent of Meshy's export scale — target ~1 world unit tall.
        const k = 1.15 / Math.max(1e-4, sz.y);
        model.scale.setScalar(k);
        model.position.set(-ctr.x * k, -ctr.y * k, -ctr.z * k);

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
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (paused) { renderer.render(scene, camera); return; }
      const holder = model?.userData?.holder;
      if (holder) {
        const t = targetRef.current;
        holder.visible = !!t;
        if (t) {
          const dest = worldFor(t.x, t.y);
          holder.position.lerp(dest, reduced ? 1 : Math.min(1, dt * 6));
          const bob = reduced ? 0 : Math.sin(now / 480) * 0.02;
          const tap = tapRef.current;
          let dip = 0;
          let punch = 1;
          if (tap.t > 0) {
            tap.t += dt;
            const dur = 0.32;
            const p = Math.min(1, tap.t / dur);
            dip = Math.sin(p * Math.PI) * 0.12;
            punch = 1 - Math.sin(p * Math.PI) * 0.08;
            if (p >= 1) tap.t = 0;
          }
          holder.position.y = dest.y + bob;
          holder.position.z = -dip;
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
