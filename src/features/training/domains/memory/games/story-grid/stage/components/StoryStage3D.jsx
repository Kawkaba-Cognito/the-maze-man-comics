import React, { useEffect, useRef } from 'react';
import { bootC3dScene, THREE } from '../../../../../../shared/c3dBoot';
import { createCharacter, preloadCast } from '../../../../../../shared/castModels';
import { RIG_HEIGHT } from '../../../../../../shared/castRoster';
import { SKIES } from '../schema';

/*
 * Story Time presents the existing cast as a collection of small, premium
 * memory figurines. The models are intentionally never enlarged into hero
 * close-ups: their silhouettes and animation read best as a composed group.
 * Physical plinths, contact shadows, three-quarter staging and soft studio
 * light do the depth work that the old flat, front-facing tableau was missing.
 */
const CHAR_WIDTH = 1.05;
const FLOOR_Y = 0.068;
const SPREAD = 1.1;
const MIN_SPREAD = 0.62;
const OFF_STAGE_Y = -2.4;
const FILL_LANDSCAPE = 0.34;
const FILL_PORTRAIT = 0.31;

const SHOTS = {
  wide: { dist: 1.2, eye: 0.68, aim: 0.48, favour: 0 },
  mid: { dist: 1.04, eye: 0.64, aim: 0.5, favour: 0.18 },
  close: { dist: 0.9, eye: 0.66, aim: 0.54, favour: 0.55 },
};

const damp = (value, target, dt, speed = 4) =>
  value + (target - value) * Math.min(1, dt * speed);

function tuneCharacterMaterials(root, ownedMaterials) {
  root.traverse((node) => {
    if (!node.isMesh) return;

    const tune = (source) => {
      const material = source.clone();
      ownedMaterials.add(material);

      if ('metalness' in material) material.metalness = Math.min(material.metalness ?? 0, 0.08);
      if ('roughness' in material) material.roughness = Math.max(material.roughness ?? 0.5, 0.68);
      if ('envMapIntensity' in material) material.envMapIntensity = 0.35;
      material.toneMapped = true;
      if (!material.transparent || material.opacity >= 0.99) material.depthWrite = true;
      material.needsUpdate = true;
      return material;
    };

    node.material = Array.isArray(node.material)
      ? node.material.map(tune)
      : tune(node.material);
    node.frustumCulled = false;
  });
}

export default function StoryStage3D({
  beat, cast, isAr, shot = 'mid', focusX = 0, onReady, onError,
}) {
  const wrapRef = useRef(null);
  const applyRef = useRef(null);
  const beatRef = useRef(beat);
  beatRef.current = beat;
  const shotRef = useRef({ shot, focusX });
  const handlers = useRef({ onReady, onError });
  handlers.current = { onReady, onError };

  const castKey = (cast || []).join(',');

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    let disposed = false;
    const boot = bootC3dScene(wrap, {
      fov: 38,
      alpha: false,
      bloom: false,
      lights: false,
      stars: false,
      hudReserveFrac: 0,
    });

    if (boot.error) {
      handlers.current.onError?.(boot.error);
      return () => boot.dispose();
    }

    const {
      camera, coarse, playRoot, renderer, setTick, dispose,
    } = boot;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.shadowMap.enabled = !coarse;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute(
      'aria-label',
      isAr ? 'مشهد القصة ثلاثي الأبعاد' : 'Three-dimensional story scene',
    );

    const stage = new THREE.Group();
    playRoot.add(stage);

    const ownedGeometry = new Set();
    const ownedMaterials = new Set();
    const own = (mesh, parent = stage) => {
      if (mesh.geometry) ownedGeometry.add(mesh.geometry);
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.filter(Boolean).forEach((material) => ownedMaterials.add(material));
      parent.add(mesh);
      return mesh;
    };

    // A clean studio cyclorama replaces the star field and oversized planet.
    // It keeps the time-of-day memory cue while removing visual noise.
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        top: { value: new THREE.Color().setHex(SKIES.night.top, THREE.LinearSRGBColorSpace) },
        bot: { value: new THREE.Color().setHex(SKIES.night.bot, THREE.LinearSRGBColorSpace) },
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}',
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 top;',
        'uniform vec3 bot;',
        'varying vec2 vUv;',
        'void main() {',
        '  float blend = smoothstep(0.0, 1.0, pow(vUv.y, 0.82));',
        '  gl_FragColor = vec4(mix(bot, top, blend), 1.0);',
        '}',
      ].join('\n'),
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const backdrop = own(new THREE.Mesh(new THREE.PlaneGeometry(160, 48), skyMat));
    backdrop.position.set(0, 6, -14);
    backdrop.renderOrder = -10;

    const floorMat = new THREE.MeshStandardMaterial({
      color: SKIES.night.ground,
      roughness: 0.92,
      metalness: 0,
    });
    const floor = own(new THREE.Mesh(new THREE.PlaneGeometry(22, 12), floorMat));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.002, -1.5);
    floor.receiveShadow = !coarse;

    // Soft studio lighting reveals volume without turning the small stage into
    // a glossy toy showroom. Desktop receives real shadows; phones use the
    // cheaper authored contact shadows below.
    const hemi = new THREE.HemisphereLight(0xdcecff, 0x52647a, 1.35);
    stage.add(hemi);

    const key = new THREE.DirectionalLight(0xfff4e7, 2.25);
    key.position.set(3.8, 6.5, 5.4);
    key.target.position.set(0, RIG_HEIGHT * 0.45, 0);
    key.castShadow = !coarse;
    if (!coarse) {
      key.shadow.mapSize.set(512, 512);
      key.shadow.camera.left = -5;
      key.shadow.camera.right = 5;
      key.shadow.camera.top = 5;
      key.shadow.camera.bottom = -2;
      key.shadow.camera.near = 1;
      key.shadow.camera.far = 14;
      key.shadow.bias = -0.0008;
      key.shadow.normalBias = 0.025;
    }
    stage.add(key, key.target);

    const rim = new THREE.PointLight(0xb9d2ee, 1.55, 13, 2);
    rim.position.set(-3.5, 2.8, 1.2);
    stage.add(rim);

    const characters = new Map();

    const makePresentation = (id, index, onFirstBeat) => {
      const root = new THREE.Group();
      stage.add(root);

      const padMat = new THREE.MeshStandardMaterial({
        color: index % 2 ? 0xdbe6ef : 0xe7eef4,
        roughness: 0.82,
        metalness: 0.02,
      });
      const pad = own(
        new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.49, 0.06, 40), padMat),
        root,
      );
      pad.position.y = 0.03;
      pad.receiveShadow = !coarse;
      pad.castShadow = !coarse;

      const contactMat = new THREE.MeshBasicMaterial({
        color: 0x24384b,
        transparent: true,
        opacity: 0.17,
        depthWrite: false,
        toneMapped: false,
      });
      const contact = own(
        new THREE.Mesh(new THREE.CircleGeometry(0.34, 32), contactMat),
        root,
      );
      contact.rotation.x = -Math.PI / 2;
      contact.scale.set(1, 0.48, 1);
      contact.position.y = 0.061;
      contact.renderOrder = 2;

      root.position.y = onFirstBeat ? 0 : OFF_STAGE_Y;
      root.visible = onFirstBeat;
      root.userData.castId = id;
      return { root, pad, contact };
    };

    const playBeat = (nextBeat) => {
      if (!nextBeat) return;
      characters.forEach(({ character }, id) => {
        const actor = nextBeat.actors.find((entry) => entry.id === id);
        if (!actor) return;
        if (actor.act === 'idle') character.play('idle', { loop: true });
        else character.react(actor.act);
      });
    };
    applyRef.current = playBeat;

    (async () => {
      try {
        await preloadCast(cast);
        if (disposed) return;

        for (let index = 0; index < cast.length; index += 1) {
          const id = cast[index];
          const character = await createCharacter(id, { seedIndex: index });
          if (disposed) {
            character.dispose();
            return;
          }

          tuneCharacterMaterials(character.root, ownedMaterials);
          character.root.traverse((node) => {
            if (!node.isMesh) return;
            node.castShadow = !coarse;
            node.receiveShadow = !coarse;
          });

          const onFirstBeat = !!beatRef.current?.actors?.some((actor) => actor.id === id);
          const presentation = makePresentation(id, index, onFirstBeat);
          character.root.position.y = FLOOR_Y;
          presentation.root.add(character.root);
          characters.set(id, { character, ...presentation });
        }

        playBeat(beatRef.current);
        handlers.current.onReady?.();
      } catch (error) {
        if (!disposed) handlers.current.onError?.(error);
      }
    })();

    const skyTop = new THREE.Color();
    const skyBot = new THREE.Color();
    const keyColor = new THREE.Color();
    const rimColor = new THREE.Color();
    const floorColor = new THREE.Color();
    const cameraTarget = new THREE.Vector3();
    const lookTarget = new THREE.Vector3(0, RIG_HEIGHT * 0.5, 0);

    setTick((dt, now) => {
      const currentBeat = beatRef.current;
      const palette = SKIES[currentBeat?.sky] || SKIES.night;
      const paletteEase = Math.min(1, dt * 2.2);

      skyTop.setHex(palette.top, THREE.LinearSRGBColorSpace);
      skyBot.setHex(palette.bot, THREE.LinearSRGBColorSpace);
      skyMat.uniforms.top.value.lerp(skyTop, paletteEase);
      skyMat.uniforms.bot.value.lerp(skyBot, paletteEase);
      keyColor.set(palette.key);
      key.color.lerp(keyColor, paletteEase);
      rimColor.set(palette.rim);
      rim.color.lerp(rimColor, paletteEase);
      floorColor.set(palette.ground);
      floorMat.color.lerp(floorColor, paletteEase);

      const actors = currentBeat?.actors || [];
      const aspect = Math.max(0.35, camera.aspect || 1);
      const fill = aspect < 0.9 ? FILL_PORTRAIT : FILL_LANDSCAPE;
      const halfFov = (camera.fov * Math.PI) / 360;
      const tangent = Math.tan(halfFov);

      let maxX = 0;
      actors.forEach((actor) => { maxX = Math.max(maxX, Math.abs(actor.x ?? 0)); });

      let distance = Math.max(RIG_HEIGHT / (2 * fill * tangent), 3.2);
      let spread = SPREAD;
      if (maxX > 0.001) {
        const availableHalfWidth = distance * tangent * aspect - CHAR_WIDTH * 0.58;
        spread = availableHalfWidth / (2 * maxX);
        if (spread < MIN_SPREAD) {
          spread = MIN_SPREAD;
          distance = (2 * MIN_SPREAD * maxX + CHAR_WIDTH * 0.58) / (tangent * aspect);
        }
        spread = Math.min(spread, SPREAD);
      }

      characters.forEach(({ character, root }, id) => {
        const actor = actors.find((entry) => entry.id === id);
        const onStage = !!actor;
        root.position.y = damp(root.position.y, onStage ? 0 : OFF_STAGE_Y, dt, 3.8);
        root.visible = root.position.y > -2.2;

        if (!onStage) {
          character.update(dt, now);
          return;
        }

        const targetX = (actor.x ?? 0) * spread * 2;
        const targetZ = -0.1 - Math.abs(actor.x ?? 0) * 0.16;
        root.position.x = damp(root.position.x, targetX, dt, 3.8);
        root.position.z = damp(root.position.z, targetZ, dt, 3.8);

        // A subtle inward three-quarter turn exposes the models' depth while
        // keeping faces legible and the group visually connected.
        character.lookAt(Math.max(-0.24, Math.min(0.24, -targetX * 0.11)));
        character.update(dt, now);
      });

      const shotConfig = SHOTS[shotRef.current.shot] || SHOTS.mid;
      const targetDistance = distance * shotConfig.dist;
      const targetX = shotRef.current.focusX * spread * 2 * shotConfig.favour;
      const targetEye = RIG_HEIGHT * shotConfig.eye;
      const targetAim = RIG_HEIGHT * shotConfig.aim;

      cameraTarget.set(targetX, targetEye, targetDistance);
      camera.position.lerp(cameraTarget, Math.min(1, dt * 2.8));
      lookTarget.lerp(
        new THREE.Vector3(targetX * 0.76, targetAim, -0.08),
        Math.min(1, dt * 2.8),
      );
      camera.lookAt(lookTarget);
    });

    return () => {
      disposed = true;
      applyRef.current = null;
      characters.forEach(({ character, root }) => {
        character.dispose();
        root.removeFromParent();
      });
      ownedGeometry.forEach((geometry) => geometry.dispose());
      ownedMaterials.forEach((material) => material.dispose());
      stage.removeFromParent();
      dispose();
    };
    // Beat changes animate inside the existing scene; only cast/language rebuild it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [castKey, isAr]);

  useEffect(() => { applyRef.current?.(beat); }, [beat]);

  useEffect(() => {
    shotRef.current = { shot, focusX };
  }, [shot, focusX, beat]);

  return <div ref={wrapRef} className="sgs-stage" />;
}
