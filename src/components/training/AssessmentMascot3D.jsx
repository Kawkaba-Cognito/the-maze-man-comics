import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { assetUrl } from '../../lib/assetUrl';

/*
 * AssessmentMascot3D — the rigged planet-astronaut (Kawkab) that stands at the
 * centre of the Training hub, in the spot the SVG "Assessment" nexus used to
 * fill on its own. Tap it → open the assessment (onActivate).
 *
 * Deliberately self-contained and lightweight (this is a ~150px badge, not a
 * game): one transparent WebGL canvas, two lights, no bloom/stars, DPR clamped,
 * rAF paused when the tab is hidden, full dispose on unmount. Three.js is the
 * npm module (same as the training 3D protos), so this whole file lands in a
 * lazy chunk — users who never open Training never pay for it.
 *
 * The mascot GLB was Meshy-generated at an odd unit scale (~0.018u tall) with
 * two 4096² PNGs; it was recompressed to WebP@1024 (41 MB → ~0.94 MB) and its
 * clips kept. We reframe/rescale from the runtime bounding box so the export
 * scale never has to be trusted.
 *
 * If WebGL is unavailable or the model fails to load, this renders nothing and
 * the SVG nexus underneath (glow + ring + label) stays as the clickable
 * fallback — so the hub centre is never empty or dead.
 */

const MODEL_URL = assetUrl('Assets/kawkab-mascot-v1.glb');
const IDLE_CLIP = 'air_squat';        // slowed → gentle breathing/bob at rest
const GREET_CLIP = 'Big_Wave_Hello';  // played once on hover / tap-in

export default function AssessmentMascot3D({ size = 150, onActivate, isAr, label }) {
  const wrapRef = useRef(null);

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
      return undefined; // no WebGL → SVG fallback remains visible
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 4);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';
    wrap.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xfff2d8, 0.75));
    const key = new THREE.DirectionalLight(0xfff0d8, 1.1);
    key.position.set(1.5, 3, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xbfd4ff, 0.35);
    fill.position.set(-2, 1, 2);
    scene.add(fill);
    const rim = new THREE.PointLight(0xe8ac4e, 0.5, 24);
    rim.position.set(-2.5, 1.5, 2.5);
    scene.add(rim);

    let mixer = null;
    let idleAction = null;
    let greetAction = null;
    let model = null;
    let alive = true;

    const resize = () => {
      const w = wrap.clientWidth || size;
      const h = wrap.clientHeight || size;
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => {
        if (!alive) { return; }
        model = gltf.scene;

        // Normalise: centre on origin, scale so height ≈ 2 world units, so the
        // camera framing is independent of Meshy's export scale.
        const box = new THREE.Box3().setFromObject(model);
        const sz = box.getSize(new THREE.Vector3());
        const ctr = box.getCenter(new THREE.Vector3());
        const k = 2 / Math.max(1e-4, sz.y);
        model.scale.setScalar(k);
        model.position.set(-ctr.x * k, -ctr.y * k, -ctr.z * k);

        model.traverse((n) => {
          if (!n.isMesh) return;
          n.frustumCulled = false;
          n.castShadow = false;
          n.receiveShadow = false;
          // Meshy exports this material as fully metallic (no metallicFactor →
          // glTF default 1.0) with a white emissive glow map and 2× specular.
          // With no environment map that renders the albedo invisible and the
          // whole model blows out to solid white. Make it a plain lit surface:
          // show the baseColor texture, keep only a hint of the glow.
          const mats = Array.isArray(n.material) ? n.material : [n.material];
          mats.forEach((m) => {
            if (!m) return;
            m.metalness = 0;
            m.roughness = 0.72;
            if ('emissiveIntensity' in m) m.emissiveIntensity = 0.22;
            if (m.specularColor) m.specularColor.setRGB(1, 1, 1);
            if ('specularIntensity' in m) m.specularIntensity = 1;
            m.transparent = false;   // alphaMode BLEND is spurious here
            m.depthWrite = true;
            m.side = THREE.FrontSide;
            m.needsUpdate = true;
          });
        });

        const holder = new THREE.Group();
        holder.add(model);
        // FACING: the camera sits at +Z looking toward -Z. This assumes the
        // model's forward is +Z (faces the camera); +0.35 gives a friendly
        // three-quarter read. If it renders back-to-us, flip to `Math.PI + 0.35`.
        holder.rotation.y = 0.35;
        scene.add(holder);
        model.userData.holder = holder;

        const clips = gltf.animations || [];
        if (clips.length) {
          mixer = new THREE.AnimationMixer(model);
          const find = (name) => clips.find((c) => c.name === name) || null;
          const idleClip = find(IDLE_CLIP) || clips[0];
          const greetClip = find(GREET_CLIP);
          if (idleClip) {
            idleAction = mixer.clipAction(idleClip);
            idleAction.timeScale = 0.6;
            idleAction.play();
          }
          if (greetClip && greetClip !== idleClip) {
            greetAction = mixer.clipAction(greetClip);
            greetAction.loop = THREE.LoopOnce;
            greetAction.clampWhenFinished = true;
          }
          if (reduced) { mixer.update(0.3); mixer.timeScale = 0; }
        }
        resize();
      },
      undefined,
      () => { /* load failed → SVG fallback stays */ },
    );

    // Wave hello on hover / tap-in, then fade back to idle.
    const greet = () => {
      if (!greetAction || !idleAction || reduced) return;
      greetAction.reset();
      greetAction.setEffectiveWeight(1);
      greetAction.fadeIn(0.15).play();
      idleAction.crossFadeTo(greetAction, 0.15, false);
    };
    const onFinished = (e) => {
      if (e.action === greetAction && idleAction) {
        idleAction.reset().play();
        greetAction.crossFadeTo(idleAction, 0.25, false);
      }
    };
    wrap.addEventListener('pointerenter', greet);

    let raf = 0;
    let last = performance.now();
    let paused = false;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!paused) {
        if (mixer && !reduced) mixer.update(dt);
        const holder = model?.userData?.holder;
        if (holder && !reduced) {
          holder.position.y = Math.sin(now / 1100) * 0.05;       // gentle float
          holder.rotation.y = 0.35 + Math.sin(now / 2600) * 0.12; // idle sway
        }
        renderer.render(scene, camera);
      }
    };
    if (mixer) mixer.addEventListener('finished', onFinished);
    raf = requestAnimationFrame(loop);

    const onVis = () => { paused = document.hidden; if (!paused) last = performance.now(); };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      wrap.removeEventListener('pointerenter', greet);
      mixer?.removeEventListener('finished', onFinished);
      mixer?.stopAllAction();
      scene.traverse((n) => {
        if (n.isMesh) {
          n.geometry?.dispose?.();
          const mats = Array.isArray(n.material) ? n.material : [n.material];
          mats.forEach((m) => {
            if (!m) return;
            for (const key of Object.keys(m)) {
              const v = m[key];
              if (v && v.isTexture) v.dispose();
            }
            m.dispose?.();
          });
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === wrap) wrap.removeChild(renderer.domElement);
    };
  }, [size]);

  return (
    <div
      ref={wrapRef}
      role="button"
      tabIndex={0}
      aria-label={label || (isAr ? 'ابدأ التقييم' : 'Start assessment')}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate?.(); }
      }}
      style={{
        width: size, height: Math.round(size * 1.15),
        cursor: 'pointer', pointerEvents: 'auto',
        touchAction: 'manipulation',
      }}
    />
  );
}
