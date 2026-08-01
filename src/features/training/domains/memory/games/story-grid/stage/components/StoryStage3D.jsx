import React, { useEffect, useRef } from 'react';
import { GAME_INTS } from '../../../../../../shared/gamePalette';
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
const ARC = 0.35;

/*
 * How much of the frame height ONE actor should fill.
 *
 * This is the only knob for apparent character size. The rigs are never scaled
 * (see the note above), so size is purely camera distance — and this number is
 * what the distance is solved from. Turn it down to make the cast smaller.
 *
 * Paired with the mobile stage band in stage.css: on a phone the stage is no
 * longer a full-bleed backdrop but a ~40vh strip, so 0.30 of THAT is roughly a
 * third of what the same actor used to occupy on screen.
 */
/* 0.52 / 0.42, up from 0.30 / 0.24 (2026-08-01).
 *
 * At 0.30 a rig occupied under a third of the stage's height — about 110px of a
 * 380px band — so the cast read as distant specks on an empty disc, which is
 * most of why this screen looked unfinished. These are the characters the whole
 * game is about; they should own the frame. The comment above still holds: this
 * is the ONLY knob, because the rigs are never scaled. */
const FILL_LANDSCAPE = 0.52;
const FILL_PORTRAIT = 0.42;

// Below this, actors visibly collide and the line stops reading as a group;
// past it we step the camera back rather than squash the staging further.
const MIN_SPREAD = 0.55;

/*
 * The shot table — the numbers behind the names in schema.js.
 *
 *   dist   multiplier on the solved group distance (smaller = closer in)
 *   eye    camera height, in rig heights
 *   aim    what height it looks at, in rig heights
 *   favour how far the camera slides toward the focal actor (0 = stays centred)
 *
 * A close-up is allowed to push the outer cast out of frame — that is what a
 * close-up IS. Only the focal actor is guaranteed in shot.
 */
const SHOTS = {
  wide: { dist: 1.34, eye: 0.78, aim: 0.5, favour: 0 },
  mid: { dist: 1.0, eye: 0.62, aim: 0.5, favour: 0.25 },
  close: { dist: 0.62, eye: 0.74, aim: 0.66, favour: 0.85 },
};

// Every shot drifts slowly forward while it holds. Tiny — you should feel it
// rather than see it — but it is the difference between a film and a slideshow.
const PUSH_FROM = 1.035;
const PUSH_TO = 0.975;
const PUSH_SECONDS = 6;

const damp = (v, target, dt, speed = 4) => v + (target - v) * Math.min(1, dt * speed);

export default function StoryStage3D({
  beat, cast, isAr, shot = 'mid', focusX = 0, onReady, onError,
}) {
  const wrapRef = useRef(null);
  const applyRef = useRef(null); // set by the scene: play a beat's clips
  const beatRef = useRef(beat);
  beatRef.current = beat;
  // The camera reads these every frame; they must never re-boot the scene.
  const shotRef = useRef({ shot, focusX, since: 0 });
  const handlers = useRef({ onReady, onError });
  handlers.current = { onReady, onError };

  // Rebuild only for a genuinely different company of actors.
  const castKey = (cast || []).join(',');

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    let disposed = false;
    const boot = bootC3dScene(wrap, {
      // fitHalf is inert here — this stage drives camera.position itself in the
      // tick below, solving distance from FILL_LANDSCAPE. That constant, not
      // this one, is what sizes the cast.
      fov: 40,
      fitHalf: 3.4,
      alpha: false,
      // Tide's LIGHT end, matching .sgs in tokens.css. The stage's own sky is a
      // finite plane, so wherever the camera sees past it the renderer's clear
      // colour shows — it has to be the same end of the ramp as the sky, or
      // that gap becomes a fringe of the wrong depth around the picture.
      // Kept simple on purpose: this stage now renders at a fraction of its old
      // footprint (see stage.css), and bloom + real-time shadows were the two
      // priciest, least-necessary passes for a scene that small — cut for a
      // lighter, more responsive watch phase rather than tuned down.
      bloom: false,
      lights: false,
      stars: true, // the universe backdrop, not a noir room
      // c3dBoot normally reserves a top band for a floating HUD and slides the
      // content down to clear it. This stage has no in-canvas HUD — the chrome
      // is DOM above and below it — and we drive the camera ourselves in the
      // tick, so that shift only pushed the cast low in frame. Opt out.
      hudReserveFrac: 0,
    });
    if (boot.error) {
      handlers.current.onError?.(boot.error);
      return () => boot.dispose();
    }

    const { camera, playRoot, scene, renderer, setTick, dispose } = boot;
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
        /* setHex(..., LinearSRGBColorSpace), NOT new THREE.Color(hex).
         *
         * This is a RAW ShaderMaterial: it writes gl_FragColor itself and so
         * never gets three's <colorspace_fragment> chunk, which is what would
         * normally convert linear back to sRGB on the way out. The default
         * `new THREE.Color(hex)` converts the hex sRGB -> LINEAR on the way in,
         * and that linear number was then written to the framebuffer verbatim
         * and displayed as if it were sRGB — every sky came out roughly a fifth
         * darker than authored. Reading the hex as already-linear cancels the
         * conversion, so the SKIES values in schema.js are what you see. */
        top: { value: new THREE.Color().setHex(SKIES.night.top, THREE.LinearSRGBColorSpace) },
        bot: { value: new THREE.Color().setHex(SKIES.night.bot, THREE.LinearSRGBColorSpace) },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec2 vUv; void main(){ gl_FragColor=vec4(mix(bot,top,pow(vUv.y,0.85)),1.0); }',
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    /* Big enough to always outrun the frustum. At 46x26 it did not: the stage
     * is a wide letterbox, and at this aspect the visible width 24 units out is
     * ~90, so the plane's own edges were on screen as a slanted trapezoid with
     * the clear colour around it. One extra quad is free; guessing the exact
     * cover size is not. */
    const sky = own(new THREE.Mesh(new THREE.PlaneGeometry(200, 60), skyMat));
    sky.position.set(0, 3.2, -12);
    sky.renderOrder = -10;

    // ── the disc the cast stands on ───────────────────────────────────────
    const discMat = new THREE.MeshStandardMaterial({
      color: SKIES.night.ground, roughness: 0.72, metalness: 0.2,
    });
    const disc = own(new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.8, 0.14, 64), discMat));
    disc.position.y = -0.07;

    const ringMat = new THREE.MeshBasicMaterial({
      color: GAME_INTS.accent.fill, transparent: true, opacity: 0.22,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    });
    const ring = own(new THREE.Mesh(new THREE.RingGeometry(4.5, 4.72, 96), ringMat));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.015;

    // ── lights (recoloured per beat) ──────────────────────────────────────
    // No real-time shadows — a scene this small read fine without them, and
    // dropping the shadow map (was 512-1024px, recomputed every frame against
    // a skinned/rigged mesh) is most of the win from "simpler".
    const hemi = new THREE.HemisphereLight(0x8fa6d8, 0x1a1220, 0.75);
    stage.add(hemi);
    const key = new THREE.DirectionalLight(0xffe6c0, 1.9);
    key.position.set(2.4, 5, 4.4);
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
          // Spawn already at the tick's own off-stage height (-2.4) for anyone
          // not in the first beat. The tick derives visibility from position,
          // not from a flag, so starting these at FLOOR_Y made them flash into
          // view at floor level for a frame before damping pulled them back
          // down out of sight — the "character appears then disappears" bug.
          const onFirstBeat = !!beatRef.current?.actors?.some((a) => a.id === cast[i]);
          ch.root.position.set(0, onFirstBeat ? FLOOR_Y : -2.4, 0);
          ch.root.visible = onFirstBeat;
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
    // Scratch vectors — allocating these per frame would churn the GC.
    const camPos = new THREE.Vector3();
    const camAim = new THREE.Vector3();
    const camLook = new THREE.Vector3(0, RIG_HEIGHT * 0.5, 0);

    setTick((dt, now) => {
      const b = beatRef.current;
      const pal = SKIES[b?.sky] || SKIES.night;

      // Cross-fade the whole palette so a change of time of day reads as a
      // mood shift rather than a cut.
      // Linear-space read, matching the uniform init above — see the note there.
      skyTop.setHex(pal.top, THREE.LinearSRGBColorSpace);
      skyBot.setHex(pal.bot, THREE.LinearSRGBColorSpace);
      skyMat.uniforms.top.value.lerp(skyTop, Math.min(1, dt * 2.2));
      skyMat.uniforms.bot.value.lerp(skyBot, Math.min(1, dt * 2.2));
      keyCol.set(pal.key); key.color.lerp(keyCol, Math.min(1, dt * 2.2));
      rimCol.set(pal.rim); rim.color.lerp(rimCol, Math.min(1, dt * 2.2));
      discCol.set(pal.ground); discMat.color.lerp(discCol, Math.min(1, dt * 2.2));

      const actors = b?.actors || [];
      const aspect = Math.max(0.35, camera.aspect || 1);
      const portrait = aspect < 0.9;

      // Framing, in one direction: SIZE first, then staging.
      //
      // This used to run the other way — the camera was pushed back until the
      // widest actor fitted, so a beat that spread out rendered everyone
      // smaller than a beat that huddled, and a phone got a whole cast at ~7%
      // of the stage. Now the distance is pinned to the vertical fit (i.e. to
      // FILL_*), which makes an actor the SAME size in every beat and on every
      // screen, and the line-up compresses horizontally to fit whatever width
      // that leaves. Only when the squeeze would collide bodies do we give
      // ground and step back.
      const halfFov = (camera.fov * Math.PI) / 360;
      const tan = Math.tan(halfFov);
      const fill = portrait ? FILL_PORTRAIT : FILL_LANDSCAPE;

      let maxX = 0;
      for (const a of actors) maxX = Math.max(maxX, Math.abs(a.x ?? 0));

      let dist = Math.max(RIG_HEIGHT / (2 * fill * tan), 2.6);
      let spreadX = SPREAD;
      if (maxX > 0.001) {
        // Half-width available at that distance, less room for a body.
        const halfW = dist * tan * aspect - CHAR_WIDTH * 0.6;
        spreadX = halfW / (2 * maxX);
        if (spreadX < MIN_SPREAD) {
          spreadX = MIN_SPREAD;
          dist = (2 * MIN_SPREAD * maxX + CHAR_WIDTH * 0.6) / (tan * aspect);
        }
        spreadX = Math.min(spreadX, SPREAD);
      }
      const arcZ = ARC;

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
        ch.lookAt(-tx * 0.12);
        ch.update(dt, now);
      });

      // ── the camera ────────────────────────────────────────────────────
      // `dist` above is the distance that frames the GROUP correctly. The shot
      // modulates it: a wide pulls off it, a close-up dives past it toward
      // whoever is speaking. Everything is damped, never set, so a cut reads
      // as a move — which is what stops this looking like a slideshow.
      const st = shotRef.current;
      const s = SHOTS[st.shot] || SHOTS.mid;

      // Slow drift forward for as long as the shot holds.
      const held = Math.min(1, Math.max(0, (now - st.since) / (PUSH_SECONDS * 1000)));
      const push = PUSH_FROM + (PUSH_TO - PUSH_FROM) * held;

      const targetDist = dist * s.dist * push;
      const targetX = st.focusX * spreadX * 2 * s.favour;
      const targetEye = RIG_HEIGHT * s.eye;
      const targetAim = RIG_HEIGHT * s.aim;

      camPos.set(targetX, targetEye, targetDist);
      camAim.set(targetX * 0.82, targetAim, 0);
      // Slightly slower than the actors, so the frame settles after they do.
      camera.position.lerp(camPos, Math.min(1, dt * 2.6));
      camLook.lerp(camAim, Math.min(1, dt * 2.6));
      camera.lookAt(camLook);
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

  // A new shot restarts the push-in. Timed off the same clock the tick reads
  // (performance.now via rAF), so a paused film holds its framing.
  useEffect(() => {
    shotRef.current = { shot, focusX, since: performance.now() };
  }, [shot, focusX, beat]);

  return <div ref={wrapRef} className="sgs-stage" />;
}
