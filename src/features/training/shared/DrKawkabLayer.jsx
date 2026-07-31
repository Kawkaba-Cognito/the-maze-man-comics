import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createDrKawkabInstance, disposeDrKawkabInstance } from './drKawkabModel';

/*
 * DrKawkabLayer — the real Dr Kawkab, rendered over a 2D canvas game.
 *
 * He exists only as Assets/biped-v1.glb, the same model the Training hub puts
 * at its centre. There is no 2D artwork of him, and hand-drawing a stand-in
 * does not read as the same character — so a 2D game that needs him gets this
 * thin WebGL layer rather than an approximation.
 *
 * The camera is ORTHOGRAPHIC and mapped 1:1 to CSS pixels, so the caller
 * positions him in the same screen coordinates it uses for everything else it
 * draws. `posRef` is read every frame instead of being a prop, so the host's
 * animation loop can move him without re-rendering React.
 *
 * ⚠ Do not size him from createDrKawkabInstance().bounds. That box comes from
 * Box3 on a skinned mesh, which measures the BIND pose, not the posed clip —
 * it has produced ~100x scale errors before. Height is measured here after the
 * first pose is applied.
 *
 * @param {{ posRef: React.MutableRefObject<{x:number,y:number,h:number,lean?:number}> }} props
 *   posRef.x/y  where his FEET sit, in CSS pixels
 *   posRef.h    how tall he should be, in CSS pixels
 *   posRef.lean -1..1, tilts him into a turn
 */
export default function DrKawkabLayer({ posRef, className }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    let alive = true;
    let raf = 0;
    let renderer = null;
    let mixer = null;
    let root = null;
    let modelH = 1;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -1000, 1000);

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const key = new THREE.DirectionalLight(0xfff0d8, 1.6);
    key.position.set(2, 4, 5);
    scene.add(key);

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return undefined;   // no WebGL — the game still plays, just without him
    }
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
    wrap.appendChild(renderer.domElement);

    let W = 1;
    let H = 1;
    const resize = () => {
      W = wrap.clientWidth || 1;
      H = wrap.clientHeight || 1;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(W, H, false);
      // Pixel-space ortho: screen (x, y) maps to world (x - W/2, H/2 - y).
      camera.left = -W / 2; camera.right = W / 2;
      camera.top = H / 2; camera.bottom = -H / 2;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    /* The model hangs inside a wrapper. The wrapper is what gets moved and
     * scaled each frame; the model is offset INSIDE it so its feet sit at the
     * wrapper's origin. Offsetting the model itself would not survive, because
     * the frame loop overwrites its position every tick. */
    createDrKawkabInstance().then((inst) => {
      if (!alive) return;
      const model = inst.scene;
      if (inst.animations?.length) {
        mixer = new THREE.AnimationMixer(model);
        // Prefer a moving clip; fall back to whatever the rig ships first.
        const clip = inst.animations.find((c) => /run|walk|idle/i.test(c.name)) || inst.animations[0];
        mixer.clipAction(clip).play();
        mixer.update(0);   // pose him before measuring
      }
      const box = new THREE.Box3().setFromObject(model);
      modelH = Math.max(1e-4, box.getSize(new THREE.Vector3()).y);
      model.position.y -= box.min.y;   // feet to the wrapper's origin
      root = new THREE.Group();
      root.add(model);
      scene.add(root);
    }).catch(() => { /* model missing → game still plays */ });

    let last = performance.now();
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      mixer?.update(dt);
      if (root) {
        const p = posRef.current || { x: W / 2, y: H, h: 80, lean: 0 };
        const s = (p.h || 80) / modelH;
        root.scale.setScalar(s);
        // The wrapper's origin IS his feet, so posRef.y maps straight onto it.
        root.position.set((p.x ?? W / 2) - W / 2, H / 2 - (p.y ?? H), 0);
        root.rotation.z = (p.lean || 0) * -0.16;
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      mixer?.stopAllAction();
      if (root) disposeDrKawkabInstance(root);
      renderer.dispose();
      if (renderer.domElement.parentNode === wrap) wrap.removeChild(renderer.domElement);
    };
  }, [posRef]);

  return <div ref={wrapRef} className={className} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true" />;
}
