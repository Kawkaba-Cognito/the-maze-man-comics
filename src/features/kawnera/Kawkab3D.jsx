import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createDrKawkabInstance } from '../training/shared/drKawkabModel';
import { isCoarsePointer, releaseGlContext } from '../training/shared/c3dViewport';

// three is loaded lazily inside the effect, so the loop constants are inlined
// rather than imported — they are part of the glTF/three spec and stable.
const THREE_LOOP_ONCE = 2200;
const THREE_LOOP_REPEAT = 2201;

/*
 * Framing, copied from AssessmentMascot3D because that one demonstrably works.
 *
 * This component used to own a SECOND loader and a SECOND framing formula for
 * the very same biped-v1.glb, and the two disagreed: it sized the character by
 * `1.72 / max(size.x, size.y, size.z)` off a Box3 of the loaded scene. On a
 * SKINNED mesh that box describes the un-posed bind geometry — measured here at
 * 0.0164 units tall — so the divide produced a scale of ~105x and Dr. Kawkab
 * rendered so large that only a corner of him fell inside a 156px canvas. He
 * looked absent; the renderer was in fact drawing 10,132 triangles a frame.
 *
 * Rather than keep a second implementation correct, this now shares
 * drKawkabModel.js with the Training hub — one parse of the 3.2 MB rig for the
 * whole app instead of two caches of the same bytes, and one framing rule.
 */
const FRAME_HEIGHT = 1.5;   // target on-screen height, in world units
const CAM_FOV = 32;
const CAM_Z = 4;

/*
 * Dr. Kawkab's performable vocabulary.
 *
 * The clip names are the thirteen actually inside biped-v1.glb — verified, not
 * guessed, because a wrong name fails silently and he simply stands there.
 *
 * One deliberate omission: `Angry_Stomp` is never mapped to a wrong answer. A
 * mentor who gets angry at you for being wrong teaches you to stop guessing,
 * which is the opposite of what the prediction gate is for. Wrong answers get
 * `Look_Around_Dumbfounded` — puzzled, on your side, looking again with you.
 */
export const KAWKAB_ACTS = {
  greet: ['Agree_Gesture'],
  agree: ['Agree_Gesture'],
  think: ['Look_Around_Dumbfounded'],
  puzzled: ['Look_Around_Dumbfounded'],
  cheer: ['happy_jump_m', 'victory'],
  celebrate: ['victory', 'All_Night_Dance'],
  triumph: ['360_Power_Spin_Jump', 'victory'],
  lead: ['Walking'],
  hurry: ['RunFast', 'Running'],
};

const IDLES = ['Idle_02', 'Idle_3', 'Idle_4'];

export default function Kawkab3D({ active, mentor, act }) {
  const mountRef = useRef(null);
  /*
   * Rebuild counter for WebGL context loss.
   *
   * A dropped context is PERMANENT unless something rebuilds: the canvas keeps
   * its size and the component keeps its state (data-ready stays "true", no
   * error fires), so the only symptom is that Dr. Kawkab silently vanishes and
   * never returns. Caught in the console as an unpaired
   * "THREE.WebGLRenderer: Context Lost." — the browser reclaims a context under
   * memory pressure or when too many are alive at once, which is easy to hit
   * here because the shell keeps every tab mounted and each 3D surface holds
   * one. Bumping this re-runs the boot effect and builds a fresh renderer.
   */
  const [glEpoch, setGlEpoch] = useState(0);
  const actionsRef = useRef(new Map());
  const currentRef = useRef(null);
  const stateRef = useRef({ active, mentor });
  const mixerRef = useRef(null);
  const oneShotRef = useRef(null);

  const playAnimation = useCallback((engaged, mentorMode) => {
    const actions = actionsRef.current;
    const next = mentorMode
      ? engaged
        ? (actions.get('Agree_Gesture') ?? actions.get('Look_Around_Dumbfounded'))
        : (actions.get('Idle_3') ?? actions.get('Idle_02'))
      : engaged
        ? (actions.get('All_Night_Dance') ?? actions.get('happy_jump_m'))
        : (actions.get('Idle_02') ?? actions.get('Idle_3'));
    if (!next || currentRef.current === next) return;
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.25).play();
    currentRef.current?.fadeOut(0.25);
    currentRef.current = next;
  }, []);

  /* Fire a named reaction once, then settle back to idling. */
  const perform = useCallback((name) => {
    const actions = actionsRef.current;
    const mixer = mixerRef.current;
    if (!actions.size || !mixer || !name) return;
    const clip = (KAWKAB_ACTS[name] || []).map((c) => actions.get(c)).find(Boolean);
    if (!clip) return;

    clip.reset();
    clip.setLoop(THREE_LOOP_ONCE, 1);
    clip.clampWhenFinished = true;
    clip.setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(0.18).play();
    currentRef.current?.fadeOut(0.18);
    currentRef.current = clip;

    // Settle: back to an idle when the one-shot finishes, so he never freezes
    // mid-gesture waiting for the next thing to happen.
    if (oneShotRef.current) mixer.removeEventListener('finished', oneShotRef.current);
    const settle = () => {
      const idle = IDLES.map((c) => actions.get(c)).find(Boolean);
      if (!idle) return;
      idle.reset().setLoop(THREE_LOOP_REPEAT, Infinity).fadeIn(0.3).play();
      clip.fadeOut(0.3);
      currentRef.current = idle;
    };
    oneShotRef.current = settle;
    mixer.addEventListener('finished', settle);
  }, []);

  useEffect(() => {
    stateRef.current = { active, mentor };
    playAnimation(active, mentor);
  }, [active, mentor, playAnimation]);

  // `act` is a { name, at } pair so the SAME reaction can fire twice running —
  // two correct answers in a row should both get a cheer.
  useEffect(() => {
    if (act?.name) perform(act.name);
  }, [act, perform]);

  useEffect(() => {
    const host = mountRef.current;
    if (!host) return undefined;
    const actions = actionsRef.current;

    let stopped = false;
    let frame = 0;
    let mixer;
    let renderer;
    let scene;
    let observer;
    let canvasEl;
    let onContextLost;
    let onContextRestored;

    void (async () => {
      const THREE = await import('three');
      if (stopped) return;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(CAM_FOV, 1, 0.01, 100);
      camera.position.set(0, 0, CAM_Z);

      // Match the shared c3dBoot budget on touch devices. Asking for MSAA at
      // DPR 2 on a discrete GPU is what made the cancel-task tutorial kill the
      // tab on a phone (2026-07-26); every other renderer in the app steps down
      // on a coarse pointer and this one must too.
      const coarse = isCoarsePointer();
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: !coarse,
          powerPreference: coarse ? 'default' : 'high-performance',
        });
      } catch {
        // No WebGL: leave the slot empty. Dr Kawkab is Kawnera's only
        // character, so showing nothing beats substituting a different one —
        // the library reads fine without him.
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.3 : 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      host.appendChild(renderer.domElement);

      /*
       * Survive a lost context. preventDefault() on the loss event is what makes
       * the browser promise a 'webglcontextrestored' at all — without it the
       * canvas is dead for good, which is exactly what stranded Dr. Kawkab.
       * On restore, every GPU-side object from the old context is invalid, so we
       * do not patch: we bump the epoch and let the effect tear down and rebuild
       * from scratch. The glTF is cached in drKawkabModel, so the rebuild
       * costs no refetch and no reparse.
       */
      canvasEl = renderer.domElement;
      onContextLost = (event) => { event.preventDefault(); };
      onContextRestored = () => { setGlEpoch((n) => n + 1); };
      canvasEl.addEventListener('webglcontextlost', onContextLost);
      canvasEl.addEventListener('webglcontextrestored', onContextRestored);

      scene.add(new THREE.HemisphereLight(0xf5f2e9, 0x17211f, 2.6));
      const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
      keyLight.position.set(2, 3, 4);
      scene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0x8edbd1, 2);
      rimLight.position.set(-3, 1, -2);
      scene.add(rimLight);

      const character = new THREE.Group();
      scene.add(character);

      const resize = () => {
        if (!renderer) return;
        const size = Math.max(1, host.clientWidth);
        renderer.setSize(size, size, false);
        camera.aspect = 1;
        camera.updateProjectionMatrix();
      };
      resize();
      observer = new ResizeObserver(resize);
      observer.observe(host);

      // The app's shared Dr Kawkab instance — same loader, same framing rule as
      // the Training hub. Parsed once per session for the whole app.
      createDrKawkabInstance()
        .then((gltf) => {
          if (stopped) return;
          const model = gltf.scene;

          /*
           * Frame from the runtime bounding box HEIGHT, with a floor, so the
           * export scale never has to be trusted. Deliberately sz.y and not
           * max(x, y, z): a rig with arms out has a width that says nothing
           * about how tall it reads on screen.
           */
          const box = new THREE.Box3().setFromObject(model);
          const sz = box.getSize(new THREE.Vector3());
          const ctr = box.getCenter(new THREE.Vector3());
          const k = FRAME_HEIGHT / Math.max(1e-4, sz.y);
          model.scale.setScalar(k);
          model.position.set(-ctr.x * k, -ctr.y * k, -ctr.z * k);

          model.traverse((object) => {
            if (!object.isMesh) return;
            object.castShadow = true;
            object.frustumCulled = false;
            /*
             * Normalise the Meshy material. The export ships no metallicFactor,
             * so glTF defaults it to 1.0 and the surface is pure metal — with no
             * environment map it has nothing to reflect. It also carries a
             * spurious alphaMode BLEND. Same treatment as AssessmentMascot3D.
             */
            const mats = Array.isArray(object.material) ? object.material : [object.material];
            mats.forEach((m) => {
              if (!m) return;
              m.metalness = 0;
              m.roughness = 0.72;
              if ('emissiveIntensity' in m) m.emissiveIntensity = 0.22;
              if (m.specularColor) m.specularColor.setRGB(1, 1, 1);
              if ('specularIntensity' in m) m.specularIntensity = 1;
              m.transparent = false;
              m.depthWrite = true;
              m.side = THREE.FrontSide;
              m.needsUpdate = true;
            });
          });

          character.add(model);

          mixer = new THREE.AnimationMixer(model);
          mixerRef.current = mixer;
          for (const clip of gltf.animations) {
            actions.set(clip.name, mixer.clipAction(clip));
          }
          host.dataset.ready = 'true';
          playAnimation(stateRef.current.active, stateRef.current.mentor);
        })
        .catch(() => {
          if (!stopped) host.dataset.error = 'true';
        });

      const clock = new THREE.Clock();
      const render = () => {
        if (stopped || !renderer || !scene) return;
        const delta = Math.min(clock.getDelta(), 0.05);
        if (!reduceMotion.matches) {
          mixer?.update(delta);
          character.rotation.y = Math.sin(clock.elapsedTime * 0.7) * 0.12;
        }
        renderer.render(scene, camera);
        frame = requestAnimationFrame(render);
      };
      render();
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      if (canvasEl) {
        canvasEl.removeEventListener('webglcontextlost', onContextLost);
        canvasEl.removeEventListener('webglcontextrestored', onContextRestored);
      }
      mixer?.stopAllAction();
      /*
       * Deliberately NOT disposing geometry or materials.
       *
       * The model is a SkeletonUtils clone of a cached glTF, and that clone
       * SHARES its geometries and materials with the cached original by
       * reference. Disposing them here would free resources the next mount
       * still expects to exist — Dr. Kawkab would render once and then be
       * invisible for the rest of the session.
       *
       * renderer.dispose() below releases this context's GPU-side copies,
       * which is the part that actually belongs to this instance.
       */
      // Order matters: dispose() frees three's GPU objects, THEN the context is
      // handed back. Losing the context first leaves dispose() working against
      // a dead context.
      if (oneShotRef.current) mixer?.removeEventListener('finished', oneShotRef.current);
      oneShotRef.current = null;
      mixerRef.current = null;
      renderer?.dispose();
      releaseGlContext(renderer);
      renderer?.domElement.remove();
      actions.clear();
      currentRef.current = null;
    };
  }, [playAnimation, glEpoch]);

  return <span ref={mountRef} className="kawkab3d" aria-hidden="true" />;
}
