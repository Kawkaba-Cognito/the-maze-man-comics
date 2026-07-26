import React, { useCallback, useEffect, useRef } from 'react';
import { assetUrl } from '../../lib/assetUrl';
import { isCoarsePointer, releaseGlContext } from '../training/shared/c3dViewport';

export default function Kawkab3D({ active, mentor }) {
  const mountRef = useRef(null);
  const actionsRef = useRef(new Map());
  const currentRef = useRef(null);
  const stateRef = useRef({ active, mentor });

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

  useEffect(() => {
    stateRef.current = { active, mentor };
    playAnimation(active, mentor);
  }, [active, mentor, playAnimation]);

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
      // Training hub.
      new GLTFLoader().load(
        assetUrl('Assets/biped-v1.glb'),
        (gltf) => {
          if (stopped) return;
          const model = gltf.scene;
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
          for (const clip of gltf.animations) {
            actions.set(clip.name, mixer.clipAction(clip));
          }
          host.dataset.ready = 'true';
          playAnimation(stateRef.current.active, stateRef.current.mentor);
        },
        undefined,
        () => {
          if (!stopped) host.dataset.error = 'true';
        },
      );

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
      scene?.traverse((object) => {
        if (!object.isMesh) return;
        object.geometry?.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material?.dispose());
      });
      // Order matters: dispose() frees three's GPU objects, THEN the context is
      // handed back. Losing the context first leaves dispose() working against
      // a dead context.
      renderer?.dispose();
      releaseGlContext(renderer);
      renderer?.domElement.remove();
      actions.clear();
      currentRef.current = null;
    };
  }, [playAnimation]);

  return <span ref={mountRef} className="kawkab3d" aria-hidden="true" />;
}
