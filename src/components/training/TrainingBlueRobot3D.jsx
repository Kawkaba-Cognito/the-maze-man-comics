import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { assetUrl } from '../../lib/assetUrl';
import { isCoarsePointer, releaseGlContext } from '../../features/training/shared/c3dViewport';
import '../../styles/trainingHubPremium.css';

const MODEL_URL = assetUrl('Assets/attention/blue-robot-v1.glb');
const FALLBACK_URL = assetUrl('Assets/attention/blue-robot-front-v2.webp');
let sourcePromise = null;

function loadRobot() {
  if (!sourcePromise) {
    sourcePromise = new Promise((resolve, reject) => {
      new GLTFLoader().load(MODEL_URL, resolve, undefined, reject);
    }).catch((error) => {
      sourcePromise = null;
      throw error;
    });
  }
  return sourcePromise;
}

/** Blue Meshy robot used as the clickable character at the Training hub center. */
export default function TrainingBlueRobot3D({ size = 150, onActivate, isAr, label }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const coarse = isCoarsePointer();
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !coarse,
        powerPreference: coarse ? 'default' : 'high-performance',
      });
    } catch {
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.cssText =
      'position:absolute;inset:0;z-index:1;display:block;width:100%;height:100%';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0.05, 5.4);

    scene.add(new THREE.HemisphereLight(0xddeeff, 0x171024, 2.2));
    const key = new THREE.DirectionalLight(0xfff2d7, 2.8);
    key.position.set(2.8, 4.5, 4.5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x6ca8ff, 2.1);
    rim.position.set(-3.2, 2.2, -2.5);
    scene.add(rim);

    let alive = true;
    let model = null;
    let holder = null;
    let mixer = null;

    loadRobot()
      .then((gltf) => {
        if (!alive) return;
        model = cloneSkeleton(gltf.scene);
        const box = new THREE.Box3().setFromObject(model);
        const modelSize = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const scale = 2.55 / Math.max(modelSize.y, 0.001);
        model.scale.setScalar(scale);
        model.position.set(-center.x * scale, -center.y * scale - 0.08, -center.z * scale);

        model.traverse((node) => {
          if (!node.isMesh) return;
          node.frustumCulled = false;
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          materials.forEach((material) => {
            if (!material) return;
            if ('metalness' in material) material.metalness = Math.min(material.metalness, 0.22);
            if ('roughness' in material) material.roughness = Math.max(material.roughness, 0.58);
            material.needsUpdate = true;
          });
        });

        holder = new THREE.Group();
        holder.add(model);
        scene.add(holder);

        const clips = gltf.animations || [];
        const idle = clips.find((clip) => /idle/i.test(clip.name)) || clips[0];
        if (idle) {
          mixer = new THREE.AnimationMixer(model);
          const action = mixer.clipAction(idle);
          action.timeScale = 0.72;
          action.play();
          if (reduced) {
            mixer.update(0.25);
            mixer.timeScale = 0;
          }
        }
      })
      .catch(() => {
        /* The rendered portrait remains visible as the fallback. */
      });

    const resize = () => {
      const width = wrap.clientWidth || size;
      const height = wrap.clientHeight || Math.round(size * 1.15);
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);

    let raf = 0;
    let last = performance.now();
    const render = (now) => {
      raf = requestAnimationFrame(render);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!document.hidden) {
        if (mixer && !reduced) mixer.update(dt);
        if (holder && !reduced) {
          holder.position.y = Math.sin(now / 1150) * 0.045;
          holder.rotation.y = 0;
        }
        renderer.render(scene, camera);
      }
    };
    raf = requestAnimationFrame(render);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      mixer?.stopAllAction();
      model?.removeFromParent();
      renderer.dispose();
      releaseGlContext(renderer);
      if (renderer.domElement.parentNode === wrap) wrap.removeChild(renderer.domElement);
    };
  }, [size]);

  return (
    <div
      ref={wrapRef}
      className="kawkab-stage training-blue-robot"
      role="button"
      tabIndex={0}
      aria-label={label || (isAr ? 'ابدأ التقييم' : 'Start assessment')}
      onClick={onActivate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onActivate?.();
        }
      }}
      style={{
        position: 'relative',
        width: size,
        height: Math.round(size * 1.15),
        cursor: 'pointer',
        pointerEvents: 'auto',
        touchAction: 'manipulation',
      }}
    >
      <img
        src={FALLBACK_URL}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
      <span
        className="training-blue-robot__badge"
        aria-hidden="true"
        lang={isAr ? 'ar' : 'en'}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <span className="training-blue-robot__badge-kicker">
          {isAr ? 'الملف المعرفي' : 'COGNITIVE PROFILE'}
        </span>
        <span className="training-blue-robot__badge-label">{isAr ? 'التقييم' : 'Assessment'}</span>
      </span>
    </div>
  );
}
