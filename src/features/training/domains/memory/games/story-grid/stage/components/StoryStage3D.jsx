import React, { useEffect, useRef } from 'react';
import { bootC3dScene, THREE } from '../../../../../../shared/c3dBoot';
import { createCharacter, preloadCast } from '../../../../../../shared/castModels';
import { RIG_HEIGHT } from '../../../../../../shared/castRoster';
import { SKIES } from '../schema';

/*
 * The story stage — the cast performing one beat at a time.
 *
 * Same hard-won rules as the detective line-up (see castModels.js): the rigged
 * models are NEVER scaled, because scaling a skinned GLTF desynchronises the
 * bone matrices from their inverse bind matrices. Size is a camera decision.
 *
 * Visually this is the app's universe language rather than the detective's
 * noir: an open starfield, a lit disc the cast stands on, and a sky gradient
 * that changes per beat (dawn → noon → dusk → night), so a change of time
 * reads instantly and gives the ordering task a non-verbal cue to encode.
 */
const CHAR_WIDTH = 1.05;
const FLOOR_Y = 0.02;
const SPREAD = 1.35;
// Portrait re-staging: compress the line and push the outer actors back into a
// shallow arc. Tuned so the nearest actor holds ~a third of the stage height on
// a 390x844 phone — see the framing table in the review notes.
const PORTRAIT_SPREAD = 0.5;
const PORTRAIT_ARC = 3.2;

const damp = (v, target, dt, speed = 4) => v + (target - v) * Math.min(1, dt * speed);

export default function StoryStage3D({ beat, cast, isAr, onReady, onError }) {
  const wrapRef = useRef(null);
  const applyRef = useRef(null); // set by the scene: play a beat's clips
  const beatRef = useRef(beat);
  beatRef.current = beat;
  const handlers = useRef({ onReady, onError });
  handlers.current = { onReady, onError };

  // Rebuild only for a genuinely different company of actors.
  const castKey = (cast || []).join(',');

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    let disposed = false;
    const boot = bootC3dScene(wrap, {
      fov: 40,
      fitHalf: 3.4,
      alpha: false,
      bloom: true,
      lights: false,
      stars: true, // the universe backdrop, not a noir room
    });
    if (boot.error) {
      handlers.current.onError?.(boot.error);
      return () => boot.dispose();
    }

    const { camera, coarse, playRoot, scene, renderer, setTick, dispose } = boot;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.domElement.setAttribute(
      'aria-label',
      isAr ? 'مسرح القصة ثلاثي الأبعاد' : 'Story stage',
    );

    const stage = new THREE.Group();
    playRoot.add(stage);

    const owned = { geo: new Set(), mat: new Set() };
    const own = (mesh, parent = stage) => {
      if (mesh.geometry) owned.geo.add(mesh.geometry);
      (Array.isArray(mesh.material) ? mesh.material : [mesh.material])
        .filter(Boolean).forEach((m) => owned.mat.add(m));
      parent.add(mesh);
      return mesh;
    };

    // ── sky: a big backdrop plane we recolour per beat ────────────────────
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        top: { value: new THREE.Color(SKIES.night.top) },
        bot: { value: new THREE.Color(SKIES.night.bot) },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec2 vUv; void main(){ gl_FragColor=vec4(mix(bot,top,pow(vUv.y,0.85)),1.0); }',
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const sky = own(new THREE.Mesh(new THREE.PlaneGeometry(46, 26), skyMat));
    sky.position.set(0, 3.2, -12);
    sky.renderOrder = -10;

    // ── the disc the cast stands on ───────────────────────────────────────
    const discMat = new THREE.MeshStandardMaterial({
      color: SKIES.night.ground, roughness: 0.72, metalness: 0.2,
    });
    const disc = own(new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.8, 0.14, 64), discMat));
    disc.position.y = -0.07;
    disc.receiveShadow = true;

    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xe8ac4e, transparent: true, opacity: 0.22,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    });
    const ring = own(new THREE.Mesh(new THREE.RingGeometry(4.5, 4.72, 96), ringMat));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.015;

    // ── lights (recoloured per beat) ──────────────────────────────────────
    const hemi = new THREE.HemisphereLight(0x8fa6d8, 0x1a1220, 0.75);
    stage.add(hemi);
    const key = new THREE.DirectionalLight(0xffe6c0, 1.9);
    key.position.set(2.4, 5, 4.4);
    key.castShadow = true;
    key.shadow.mapSize.set(coarse ? 512 : 1024, coarse ? 512 : 1024);
    key.shadow.camera.left = -5; key.shadow.camera.right = 5;
    key.shadow.camera.top = 4.5; key.shadow.camera.bottom = -1.5;
    key.shadow.camera.near = 0.5; key.shadow.camera.far = 14;
    key.shadow.bias = -0.00035;
    key.shadow.normalBias = 0.025;
    stage.add(key, key.target);
    const rim = new THREE.PointLight(0x6f8ad0, 4.2, 14, 1.7);
    rim.position.set(-3.4, 2.4, 1.2);
    stage.add(rim);

    const characters = new Map();

    /**
     * Fire each actor's clip for a beat. Separate from the tick, which only
     * moves people: a clip must start once on the beat change, not restart
     * every frame. Idle loops, everything else plays through then settles.
     */
    const playBeat = (b) => {
      if (!b) return;
      characters.forEach((ch, id) => {
        const a = b.actors.find((x) => x.id === id);
        if (!a) return;
        if (a.act === 'idle') ch.play('idle', { loop: true });
        else ch.react(a.act);
      });
    };
    applyRef.current = playBeat;

    (async () => {
      try {
        await preloadCast(cast);
        if (disposed) return;
        for (let i = 0; i < cast.length; i++) {
          const ch = await createCharacter(cast[i], { seedIndex: i });
          if (disposed) { ch.dispose(); return; }
          ch.root.position.set(0, FLOOR_Y, 0);
          ch.root.visible = false;
          ch.model.traverse((n) => { if (n.isMesh) n.castShadow = true; });
          stage.add(ch.root);
          characters.set(cast[i], ch);
        }
        // The first beat was set before anyone had loaded — perform it now.
        playBeat(beatRef.current);
        handlers.current.onReady?.();
      } catch (err) {
        if (!disposed) handlers.current.onError?.(err);
      }
    })();

    // ── per-frame: apply whatever beat React last handed us ───────────────
    const skyTop = new THREE.Color();
    const skyBot = new THREE.Color();
    const keyCol = new THREE.Color();
    const rimCol = new THREE.Color();
    const discCol = new THREE.Color();

    setTick((dt, now) => {
      const b = beatRef.current;
      const pal = SKIES[b?.sky] || SKIES.night;

      // Cross-fade the whole palette so a change of time of day reads as a
      // mood shift rather than a cut.
      skyTop.set(pal.top); skyBot.set(pal.bot);
      skyMat.uniforms.top.value.lerp(skyTop, Math.min(1, dt * 2.2));
      skyMat.uniforms.bot.value.lerp(skyBot, Math.min(1, dt * 2.2));
      keyCol.set(pal.key); key.color.lerp(keyCol, Math.min(1, dt * 2.2));
      rimCol.set(pal.rim); rim.color.lerp(rimCol, Math.min(1, dt * 2.2));
      discCol.set(pal.ground); discMat.color.lerp(discCol, Math.min(1, dt * 2.2));

      const actors = b?.actors || [];
      const aspect = Math.max(0.35, camera.aspect || 1);

      // A phone in portrait cannot hold a line-up. Fitting five actors across
      // 0.46 aspect pushes the camera so far back they render at ~7% of the
      // stage; fitting vertically instead leaves ~1.3 world units of width,
      // narrower than ONE 1.05-wide character. So portrait re-stages the scene
      // as a receding arc: x compresses hard and the outer actors step BACK,
      // which buys width through perspective and uses the tall axis the layout
      // actually has. Landscape keeps the flat line-up.
      const portrait = aspect < 0.9;
      const spreadX = portrait ? PORTRAIT_SPREAD : SPREAD;
      const arcZ = portrait ? PORTRAIT_ARC : 0.35;

      characters.forEach((ch, id) => {
        const a = actors.find((x) => x.id === id);
        const onStage = !!a;
        // Anyone not in this beat sinks away rather than vanishing mid-frame.
        const targetY = onStage ? FLOOR_Y : -2.4;
        ch.root.position.y = damp(ch.root.position.y, targetY, dt, 3.4);
        ch.root.visible = ch.root.position.y > -2.2;
        if (!onStage) { ch.update(dt, now); return; }
        const tx = (a.x ?? 0) * spreadX * 2;
        const tz = -Math.abs(a.x ?? 0) * arcZ;
        ch.root.position.x = damp(ch.root.position.x, tx, dt, 3.6);
        ch.root.position.z = damp(ch.root.position.z, tz, dt, 3.6);
        // Everyone angles slightly inward, which sells the arc as a group.
        ch.lookAt(-tx * (portrait ? 0.2 : 0.12));
        ch.update(dt, now);
      });

      // Distance that keeps every actor inside the frame, solved per actor
      // against its OWN depth: an actor pushed back by |z| needs
      //   d >= (|x| + margin) / (tan * aspect) - |z|
      // so the arc genuinely earns the camera the width it needs.
      const halfFov = (camera.fov * Math.PI) / 360;
      const tan = Math.tan(halfFov);
      let distH = 0;
      for (const a of actors) {
        const x = Math.abs((a.x ?? 0) * spreadX * 2);
        const z = Math.abs((a.x ?? 0) * arcZ);
        distH = Math.max(distH, (x + CHAR_WIDTH * 0.6) / (tan * aspect) - z);
      }
      const distV = (RIG_HEIGHT / 2 + (portrait ? 0.62 : 0.55)) / tan;
      const dist = Math.max(distV, distH, 2.6) * 1.06;
      camera.position.set(0, RIG_HEIGHT / 2 + (portrait ? 0.5 : 0.42), dist);
      camera.lookAt(0, RIG_HEIGHT / 2 + 0.05, 0);
    });

    return () => {
      disposed = true;
      applyRef.current = null;
      characters.forEach((ch) => ch.dispose());
      owned.geo.forEach((g) => g.dispose());
      owned.mat.forEach((m) => m.dispose());
      stage.removeFromParent();
      scene.remove(playRoot);
      dispose();
    };
    // Selection of a beat must not tear down the scene — only a new company does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [castKey, isAr]);

  // Fire each actor's beat clip once per beat change (the tick only moves them).
  useEffect(() => { applyRef.current?.(beat); }, [beat]);

  return <div ref={wrapRef} className="sgs-stage" />;
}
