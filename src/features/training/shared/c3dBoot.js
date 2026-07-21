/**
 * Shared Three.js boot for training 3D prototypes.
 * One place for renderer, lights, stars, resize, dispose.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import {
  isCoarsePointer,
  isDesktopLayout,
} from './c3dViewport';

const ATT = 0xe8ac4e;
const CREAM = 0xf0e2c0;

/**
 * @param {HTMLElement} wrap
 * @param {{ fov?: number, fitHalf?: number, bloom?: boolean }} [opts]
 */
export function bootC3dScene(wrap, opts = {}) {
  const coarse = isCoarsePointer();
  const fine = (() => {
    try { return window.matchMedia('(pointer: fine)').matches; } catch { return !coarse; }
  })();
  const reduced = (() => {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
  })();

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: !coarse,
      alpha: false,
      powerPreference: coarse ? 'default' : 'high-performance',
    });
  } catch (err) {
    return { error: err, dispose: () => {} };
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.02);

  const fov = opts.fov ?? (coarse ? 54 : 48);
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 80);
  camera.position.set(0, 0, 12);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.3 : fine ? 1.5 : 1.25));
  renderer.setClearColor(0x000000, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
  wrap.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xb8a88a, 0.62));
  const key = new THREE.DirectionalLight(0xfff0d8, 1.1);
  key.position.set(3, 5, 6);
  scene.add(key);
  const rim = new THREE.PointLight(ATT, 1.2, 30);
  rim.position.set(-3, 2, 4);
  scene.add(rim);

  const starN = fine ? 1200 : 700;
  const starPos = new Float32Array(starN * 3);
  for (let i = 0; i < starN; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 55;
    starPos[i * 3 + 1] = (Math.random() - 0.5) * 36;
    starPos[i * 3 + 2] = -6 - Math.random() * 32;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
    color: CREAM,
    size: fine ? 0.04 : 0.05,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
  scene.add(stars);

  let composer = null;
  if (opts.bloom !== false && fine && !reduced) {
    try {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.32, 0.5, 0.8));
    } catch {
      composer = null;
    }
  }

  const playRoot = new THREE.Group();
  scene.add(playRoot);

  // Content extent (half-width × half-height in world units). Square by default;
  // games with non-square content call setFitBox for a tighter, bigger fit.
  let fitHalfX = opts.fitHalf ?? 4.2;
  let fitHalfY = opts.fitHalf ?? 4.2;

  const frame = () => {
    const w = wrap.clientWidth || 1;
    const h = wrap.clientHeight || 1;
    const aspect = w / Math.max(1, h);
    const desk = isDesktopLayout(w, h);
    camera.aspect = aspect;
    camera.fov = opts.fov ?? (coarse ? 56 : desk ? 46 : 50);
    const vFov = (camera.fov * Math.PI) / 180;
    const tan = Math.tan(vFov / 2);
    // Reserve a top band for the floating HUD (title + hint + stats) so the
    // playfield is fitted into the region BELOW it and can never overlap the
    // chrome. Phones get a taller reserve (bigger HUD text share).
    // Games with a big question banner (opts.hudReserveFrac) reserve a taller
    // top band so the 3D playfield is fitted BELOW the headline, never under it.
    const hudPx = opts.hudReserveFrac
      ? h * opts.hudReserveFrac
      : Math.max(92, Math.min(196, h * (coarse ? 0.19 : 0.13)));
    const hudFrac = Math.min(0.45, hudPx / Math.max(1, h));
    // Tight padding → the playfield genuinely fills the screen (the old 1.2
    // pad + fit-largest-axis made everything look small, esp. on portrait).
    const pad = coarse ? 1.05 : desk ? 1.06 : 1.08;
    // Fit each axis independently: vertical against the usable (below-HUD)
    // height, horizontal against the full width.
    const distV = (fitHalfY * pad) / (tan * Math.max(0.05, 1 - hudFrac));
    const distH = (fitHalfX * pad) / (tan * Math.max(0.2, aspect));
    const dist = Math.max(distV, distH);
    // Shift content down so it is centred in the region under the HUD.
    const nudge = hudFrac * dist * tan;
    playRoot.position.set(0, -nudge, 0);
    camera.position.set(0, 0, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    composer?.setSize(w, h);
  };

  frame();
  const ro = new ResizeObserver(frame);
  ro.observe(wrap);
  const onVv = () => frame();
  window.visualViewport?.addEventListener('resize', onVv);

  let raf = 0;
  let last = performance.now();
  let onTick = null;

  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reduced) stars.rotation.y += dt * 0.01;
    try { onTick?.(dt, now); } catch (err) { console.warn('[c3d] tick', err); }
    if (composer) composer.render();
    else renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(loop);

  const dispose = () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.visualViewport?.removeEventListener('resize', onVv);
    starGeo.dispose();
    stars.material.dispose();
    composer?.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode === wrap) wrap.removeChild(renderer.domElement);
  };

  return {
    scene,
    camera,
    renderer,
    playRoot,
    coarse,
    fine,
    reduced,
    setFitHalf: (hh) => { fitHalfX = hh; fitHalfY = hh; frame(); },
    // Non-square content: fit width and height separately (bigger on phones).
    setFitBox: (hx, hy) => { fitHalfX = hx; fitHalfY = hy ?? hx; frame(); },
    frame,
    setTick: (fn) => { onTick = fn; },
    dispose,
    error: null,
  };
}

export function matStd(hex, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color: hex,
    emissive: new THREE.Color(opts.emissive ?? hex),
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    metalness: opts.metalness ?? 0.4,
    roughness: opts.roughness ?? 0.4,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
}

export function disposeObject(obj) {
  const seen = new Set();
  obj.traverse((node) => {
    if (node.geometry && !seen.has(node.geometry)) {
      seen.add(node.geometry);
      node.geometry.dispose();
    }
    if (node.material) {
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      mats.forEach((m) => {
        if (m && !seen.has(m)) {
          seen.add(m);
          m.dispose?.();
        }
      });
    }
  });
}

export { ATT, CREAM, THREE };
