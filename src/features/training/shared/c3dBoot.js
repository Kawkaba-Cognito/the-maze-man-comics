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
  releaseGlContext,
} from './c3dViewport';

const ATT = 0xe8ac4e;
const CREAM = 0xf0e2c0;

/*
 * wrap element -> that scene's setPaused.
 *
 * A WeakMap so a disposed scene's entry disappears with its DOM node — no
 * unmount bookkeeping, no leak. C3dProtoChrome owns the element the renderer
 * mounts into, so it can pause the scene it is drawing chrome for without every
 * game having to thread a handle back up through props.
 */
const PAUSABLE = new WeakMap();

/**
 * Pause/resume the scene mounted in `wrapEl`. A no-op when nothing is mounted
 * there, so chrome can call it unconditionally.
 * @param {Element|null} wrapEl @param {boolean} value
 */
export function setScenePaused(wrapEl, value) {
  if (!wrapEl) return;
  PAUSABLE.get(wrapEl)?.(value);
}

/*
 * TIDE DUSK — the gameplay palette, applied to the 3D scenes.
 *
 * This is the ACTUAL background of most gameplay: the play screens for the
 * 3D-scene games are a WebGL canvas, so their colour comes from Three.js here,
 * NOT from --play-surface or any CSS token. Changing the CSS play surface and
 * expecting these to follow is the trap — they will not, because the canvas is
 * opaque (alpha defaults to false) and paints over whatever CSS is beneath.
 *
 * These stops are the SAME three as --play-surface in tokens.css. Keep them in
 * step: one blue (~207° hue) deepening downward. It used to run into a warm
 * taupe horizon, copying Home's dusk; on a face-on playfield with no horizon
 * and no sun that warmth read as dirt, so it was taken out 2026-08-01. The
 * stops' LUMINANCES are unchanged — the piece colours are tuned to them.
 */
/* Re-hued to Beige 2026-08-07, luminances held (see gamePalette.js GAME_SKY —
   these three MUST stay in step with it and with --play-surface, or the 3D
   rooms render a different sky from the 2D boards). The fog stop is the mid
   stop, and must remain the darkest thing in the scene or distance hazes. */
const TIDE_LIGHT_STOPS = ['#dfd7c7', '#d0c7b4', '#bfb5a0'];
export const TIDE_FOG = 0xd0c7b4;

/*
 * ─── TIDE DEEP — the same sky, dark end ───
 *
 * Tide is ONE palette at two depths, not two palettes. Which depth a scene
 * gets is a rendering constraint, not a style preference:
 *
 *   A scene built from ADDITIVE BLENDING and EMISSIVE glow is drawing light
 *   INTO darkness. Additive blending on a light ground mathematically
 *   resolves to nothing — the layer disappears — and bloom starts blooming
 *   the background itself. Cancellation is six such layers deep (stars, dust,
 *   trails, tap rings, emissive shapes, a dark cell plate), so on the light
 *   sky it washed out completely.
 *
 * Those scenes take TIDE_DEEP. Scenes made of ordinary lit geometry take the
 * light one. Same hue family as --play-surface — just the end of the ramp
 * their rendering can survive.
 *
 * De-browned 2026-08-01 alongside the light ramp: the bottom two stops were
 * #332c33 / #463830, a warm taupe floor under the scene. Replaced with blues
 * at the SAME luminances (0.029 / 0.043), so nothing rendered on top of them
 * changes contrast — only hue.
 */
const TIDE_DEEP_STOPS = ['#121826', '#1e2130', '#28303f', '#2f3b4e'];

/* Fog must be the DARKEST stop, never the mid.
 *
 * FogExp2 fades distant geometry toward this colour. Black fog reads as depth
 * — things recede into dark. A mid-tone fog reads as HAZE: everything washes
 * toward grey, the value range collapses, and the scene looks dim and flat
 * even though nothing got darker. First pass here used the mid stop and that
 * is exactly what happened. */
export const TIDE_DEEP_FOG = 0x121826;

/* The sky as a 2×256 gradient strip; three.js stretches it to fill. A single
 * clear colour cannot express the ramp, and the ramp is the whole point.
 *
 * EXPORTED because several games (Cancellation, Target Tracking) build their
 * own renderer instead of calling bootC3dScene, and each used to hardcode its
 * own black. They import this now, so the gameplay palette has exactly one
 * definition — if you add another standalone scene, import it here too.
 *
 * @param {{ deep?: boolean }} [opts] deep = the dark end, for glow-based scenes
 */
export function makeTideSky(opts = {}) {
  const stops = opts.deep ? TIDE_DEEP_STOPS : TIDE_LIGHT_STOPS;
  const c = document.createElement('canvas');
  c.width = 2;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  if (opts.deep) {
    g.addColorStop(0, stops[0]);
    g.addColorStop(0.45, stops[1]);
    g.addColorStop(0.75, stops[2]);
    g.addColorStop(1, stops[3]);
  } else {
    g.addColorStop(0, stops[0]);
    g.addColorStop(0.58, stops[1]);
    g.addColorStop(1, stops[2]);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 2, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * @param {HTMLElement} wrap
 * @param {{ fov?: number, fitHalf?: number, bloom?: boolean, alpha?: boolean, lights?: boolean, stars?: boolean }} [opts]
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
      alpha: opts.alpha === true,
      powerPreference: coarse ? 'default' : 'high-performance',
    });
  } catch (err) {
    return { error: err, dispose: () => {} };
  }

  /*
   * Which end of Tide this scene sits on.
   *
   * This used to be hardcoded to the LIGHT end, with no way to ask for the
   * dark one — even though Tide has always had two depths and makeTideSky()
   * already took a `deep` flag. Scenes that needed the dark end (Story Time's
   * stage, Detective's room) therefore booted on the light sky and then drew
   * their own dark backdrop over the middle of it. Where their backdrop did
   * not reach — outside a finite sky plane, or in a letterboxed band — the
   * light sky showed through as a bright fringe around a dark picture.
   */
  const deep = opts.deep === true;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(deep ? TIDE_DEEP_FOG : TIDE_FOG, 0.02);
  // Only paint the sky when the canvas is opaque — an alpha:true scene is meant
  // to composite over whatever DOM sits behind it.
  const skyTex = opts.alpha === true ? null : makeTideSky({ deep });
  if (skyTex) scene.background = skyTex;

  const fov = opts.fov ?? (coarse ? 54 : 48);
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 80);
  camera.position.set(0, 0, 12);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.3 : fine ? 1.5 : 1.25));
  renderer.setClearColor(deep ? TIDE_DEEP_FOG : TIDE_FOG, opts.alpha === true ? 0 : 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
  wrap.appendChild(renderer.domElement);

  if (opts.lights !== false) {
    scene.add(new THREE.AmbientLight(0xb8a88a, 0.62));
    const key = new THREE.DirectionalLight(0xfff0d8, 1.1);
    key.position.set(3, 5, 6);
    scene.add(key);
    const rim = new THREE.PointLight(ATT, 1.2, 30);
    rim.position.set(-3, 2, 4);
    scene.add(rim);
  }

  let starGeo = null;
  let stars = null;
  if (opts.stars !== false) {
    const starN = fine ? 1200 : 700;
    const starPos = new Float32Array(starN * 3);
    for (let i = 0; i < starN; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 55;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 36;
      starPos[i * 3 + 2] = -6 - Math.random() * 32;
    }
    starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    /* On the old black void these were CREAM on AdditiveBlending — light added
     * to darkness. Tide Dusk is a LIGHT sky, where additive blending resolves
     * to nothing and cream specks are invisible. Inverted to dark motes on
     * normal blending, so the same field now reads as fine atmospheric dust
     * rather than disappearing. */
    // On a DEEP sky the original rule applies again — light added to darkness.
    const litStars = opts.alpha === true || deep;
    stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: litStars ? CREAM : 0x6d6355,
      size: fine ? 0.04 : 0.05,
      transparent: true,
      opacity: litStars ? 0.8 : 0.42,
      depthWrite: false,
      blending: litStars ? THREE.AdditiveBlending : THREE.NormalBlending,
    }));
    scene.add(stars);
  }

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
    const hudPx = opts.hudReserveFrac != null
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

  /*
   * ── Pause, as a CLOCK rather than a flag ──────────────────────────────
   *
   * Games compute deadlines from the `now` this loop hands them
   * (`deadline = now + 5000`). If pause merely stopped the loop, raw
   * performance.now() would keep running underneath and every stored deadline
   * would silently expire while the player was looking at the pause menu —
   * resume, and the round is already over.
   *
   * Speed Match solved that per-game by saving and restoring `__blockRem`.
   * Doing that in each game is how pause bugs get written, so the clock lives
   * here instead: `now` is raw time MINUS all time spent paused, so it simply
   * does not advance while paused and every deadline built from it stays
   * correct with no game-side code at all.
   *
   * Rendering continues while paused (dt = 0) so the scene stays on screen
   * behind the menu rather than freezing to a black canvas.
   */
  let paused = false;
  let pausedAt = 0;
  let pausedTotal = 0;

  const loop = (raw) => {
    raf = requestAnimationFrame(loop);
    const now = raw - pausedTotal;
    const dt = paused ? 0 : Math.min(0.05, (now - last) / 1000);
    if (!paused) last = now;
    if (!reduced && stars && !paused) stars.rotation.y += dt * 0.01;
    try { onTick?.(dt, now); } catch (err) { console.warn('[c3d] tick', err); }
    if (composer) composer.render();
    else renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(loop);

  const setPaused = (value) => {
    const next = !!value;
    if (next === paused) return;
    paused = next;
    if (paused) {
      pausedAt = performance.now();
    } else {
      pausedTotal += performance.now() - pausedAt;
      last = performance.now() - pausedTotal;
    }
  };
  // Keyed by the element the caller mounted into, so the chrome around a scene
  // can pause it without the game having to thread a handle through props.
  PAUSABLE.set(wrap, setPaused);

  const dispose = () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.visualViewport?.removeEventListener('resize', onVv);
    starGeo?.dispose();
    stars?.material.dispose();
    composer?.dispose();
    renderer.dispose();
    releaseGlContext(renderer);
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
    setPaused,
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
