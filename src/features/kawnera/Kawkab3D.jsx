import React, { useCallback, useEffect, useRef } from 'react';
import { assetUrl } from '../../lib/assetUrl';
import { isCoarsePointer, releaseGlContext } from '../training/shared/c3dViewport';

// three is loaded lazily inside the effect, so the loop constants are inlined
// rather than imported — they are part of the glTF/three spec and stable.
const THREE_LOOP_ONCE = 2200;
const THREE_LOOP_REPEAT = 2201;

/*
 * One parse of the 3.2 MB rig, reused by every mount.
 *
 * This component used to run `new GLTFLoader().load(...)` on every mount, so
 * opening a chapter, closing it and opening another re-fetched, re-parsed and
 * re-uploaded 3.2 MB of geometry and textures to the GPU each time. On a phone
 * that is a visible stall — the lag reported from the installed PWA.
 *
 * castModels.js already solved this for the training cast; this is the same
 * pattern. The clone MUST go through SkeletonUtils: a plain .clone() on a
 * skinned mesh copies the bones but not their binding, so the character
 * collapses. (Same family of problem as never scaling these rigs.)
 */
let gltfPromise = null;
function loadKawkab(GLTFLoader, url) {
  if (!gltfPromise) {
    gltfPromise = new Promise((resolve, reject) => {
      new GLTFLoader().load(url, resolve, undefined, reject);
    }).catch((err) => { gltfPromise = null; throw err; });
  }
  return gltfPromise;
}

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

    void (async () => {
      const THREE = await import('three');
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      if (stopped) return;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
      camera.position.set(0, 0.05, 3.9);

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

      // The app's existing Dr Kawkab, NOT a Kawnera-local copy: the file that
      // shipped here was byte-identical to this one (md5 d7283f26…), so it cost
      // 3.3 MB twice and missed the cache a reader had already filled on the
      // Training hub. Parsed once per session now (see loadKawkab above).
      loadKawkab(GLTFLoader, assetUrl('Assets/biped-v1.glb'))
        .then(async (gltf) => {
          if (stopped) return;
          const { clone: cloneSkeleton } = await import('three/addons/utils/SkeletonUtils.js');
          if (stopped) return;
          // Clone per instance so two mounts never share a scene graph, and so
          // disposing one cannot tear down the cached original.
          const model = cloneSkeleton(gltf.scene);
          model.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.castShadow = true;
              object.frustumCulled = false;
            }
          });
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const scale = 1.72 / Math.max(size.x, size.y, size.z);
          model.position.sub(center);
          const normalized = new THREE.Group();
          normalized.scale.setScalar(scale);
          normalized.add(model);
          character.add(normalized);

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
  }, [playAnimation]);

  return <span ref={mountRef} className="kawkab3d" aria-hidden="true" />;
}
