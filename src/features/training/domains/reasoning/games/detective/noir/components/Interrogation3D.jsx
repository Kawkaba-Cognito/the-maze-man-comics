import React, { useEffect, useRef } from 'react';
import { bootC3dScene, THREE } from '../../../../../../shared/c3dBoot';
import { createCharacter, preloadCast } from '../../../../../../shared/castModels';
import { STAGE_HEIGHT, RIG_HEIGHT } from '../../../../../../shared/castRoster';

/*
 * The interrogation stage.
 *
 * Suspects stand in a shallow arc under a single hard light; Dr Kawkab stands
 * downstage with his back to us, so the player is looking over his shoulder.
 * Selecting a suspect brings them forward and turns the rest away.
 *
 * Everything here is best-effort: if WebGL or the models fail, onError fires
 * and the case falls back to the 2D line-up rather than dead-ending the run.
 */
/** Roughly how wide a character is on stage — used for spacing and framing. */
const CHAR_WIDTH = 1.05;

export default function Interrogation3D({
  suspects, activeId, reaction, cleared, onSelect, onReady, onError,
}) {
  const wrapRef = useRef(null);
  const apiRef = useRef(null);
  const handlers = useRef({});
  handlers.current = { onSelect, onReady, onError };

  // Rebuild only when the cast itself changes — not on every selection.
  const castKey = suspects.map((s) => s.id).join(',');

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    let disposed = false;
    // bloom off: the cast is pale and glossy, and the bloom pass turns every
    // highlight into a blown-out white smear.
    const boot = bootC3dScene(wrap, {
      fov: 50, fitHalf: 4.4, alpha: true, bloom: false,
    });
    if (boot.error) {
      handlers.current.onError?.(boot.error);
      return () => boot.dispose();
    }
    const {
      camera, playRoot, scene, renderer, setTick, dispose,
    } = boot;

    // Characters stand ON the floor, so their mass sits entirely above y=0
    // while c3dBoot frames content centred on the origin. frameCast() below
    // corrects for that once everyone has actually loaded.
    const stage = new THREE.Group();
    playRoot.add(stage);

    // A small, dark floor. Kept tight: a wide disc catches the key light and
    // reads as a bright empty plain rather than the corner of a room.
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(3.8, 48),
      new THREE.MeshStandardMaterial({ color: 0x0d0b12, roughness: 1, metalness: 0 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    stage.add(floor);

    // c3dBoot already supplies ambient + key + rim, so this only adds shape: a
    // broad soft pool from above-front and a cold edge from behind to lift them
    // off the black. Deliberately gentle — these models are pale and glossy and
    // go to pure white the moment a light gets punchy.
    const spot = new THREE.SpotLight(0xffe0b0, 7, 16, Math.PI / 2.2, 0.95, 0.9);
    spot.position.set(0.3, 3.6, 3.2);
    spot.target.position.set(0, 0.8, 0);
    stage.add(spot);
    stage.add(spot.target);

    const back = new THREE.PointLight(0x5f7fb8, 3.5, 12, 1.0);
    back.position.set(0, 2.2, -2.8);
    stage.add(back);

    const fill = new THREE.HemisphereLight(0x9fb2d6, 0x140f0a, 0.5);
    stage.add(fill);

    const characters = new Map();
    let kawkab = null;
    let hitMeshes = [];
    // Framing is computed from the layout below, not measured off the models:
    // Box3 cannot be trusted on these skinned characters (see castModels.js).
    let fit = null;

    const arcFor = (n, i) => {
      // Shallow arc so nobody occludes anybody, widening with cast size.
      const spread = CHAR_WIDTH + 0.28;
      const x = (i - (n - 1) / 2) * spread;
      const z = -Math.abs(x) * 0.16;
      return { x, z };
    };

    (async () => {
      try {
        await preloadCast([...suspects.map((s) => s.id), 'kawkab']);
        if (disposed) return;

        const n = suspects.length;
        for (let i = 0; i < n; i++) {
          const def = suspects[i];
          const ch = await createCharacter(def.id, { seedIndex: i });
          if (disposed) { ch.dispose(); return; }
          const { x, z } = arcFor(n, i);
          ch.root.position.set(x, 0, z);
          ch.home = { x, z };
          ch.lookAt(-x * 0.14);
          stage.add(ch.root);
          characters.set(def.id, ch);

          // Click target. Raycasting the SkinnedMesh itself does not work:
          // three tests against the geometry's bounding volume, which for these
          // rigs is the (100x too small) bind-pose box — the hit area collapses
          // to a speck. An invisible box we control is both reliable and
          // cheaper than per-triangle picking on a 20k-vert character.
          const hit = new THREE.Mesh(
            new THREE.BoxGeometry(CHAR_WIDTH * 0.9, RIG_HEIGHT, CHAR_WIDTH * 0.7),
            new THREE.MeshBasicMaterial({ visible: false }),
          );
          hit.position.y = RIG_HEIGHT / 2;
          hit.userData.suspectId = def.id;
          ch.root.add(hit);
          hitMeshes.push(hit);
        }

        // Dr Kawkab stands at the end of the line, turned in to face it. He was
        // originally downstage for an over-the-shoulder shot, but that put him
        // between the camera and the suspects — at this focal length two units
        // of depth doubled his size and he swallowed the frame. He now shares
        // the suspects' depth so everyone reads at the same scale.
        kawkab = await createCharacter('kawkab');
        if (disposed) { kawkab.dispose(); return; }
        const edge = arcFor(n, n - 1).x + CHAR_WIDTH + 0.35;
        kawkab.root.position.set(edge, 0, 0.1);
        kawkab.lookAt(-Math.PI / 2.4);
        stage.add(kawkab.root);

        // Frame the shot from the layout we just built. Everyone stands on
        // y=0, so the group's vertical centre is simply half the tallest.
        const left = arcFor(n, 0).x - CHAR_WIDTH / 2;
        const right = edge + CHAR_WIDTH / 2;
        // Half-extents of the cast itself; the breathing room around them is
        // added per-frame, because how much you can afford depends on the shape
        // of the viewport.
        fit = {
          local: new THREE.Vector3((left + right) / 2, STAGE_HEIGHT / 2, -0.2),
          halfW: (right - left) / 2,
          halfH: STAGE_HEIGHT / 2,
        };

        apiRef.current = { characters, kawkab };
        handlers.current.onReady?.();
      } catch (err) {
        if (!disposed) handlers.current.onError?.(err);
      }
    })();

    // ── selection ────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    const el = renderer.domElement;
    const onUp = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (!hitMeshes.length) return;
      const rect = el.getBoundingClientRect();
      ptr.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ptr.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ptr, camera);
      const hit = raycaster.intersectObjects(hitMeshes, false)[0];
      if (hit) handlers.current.onSelect?.(hit.object.userData.suspectId);
    };
    el.addEventListener('pointerup', onUp);

    const camAt = new THREE.Vector3();
    setTick((dt, now) => {
      // Own the camera outright. c3dBoot's automatic fit is tuned for the
      // abstract playfields the other 3D prototypes use; a line-up of
      // floor-standing characters has to be framed on its own centre, and
      // doing it here (after boot's resize handler) keeps it authoritative.
      // Re-measured periodically so a resize — which moves playRoot — and the
      // suspects stepping forward both stay in shot.
      if (fit) {
        // The stage carries no rotation or scale, so its world position plus
        // the local target is the world target. Recomputed every frame because
        // c3dBoot moves playRoot whenever the canvas resizes.
        stage.getWorldPosition(camAt).add(fit.local);
        // A wide screen can afford generous margins — the line-up sits in its
        // room rather than filling the lens. A narrow one cannot: the same
        // margins push the camera back until the cast is a row of specks, so
        // portrait frames tight and lets the room fall away instead.
        const wide = camera.aspect > 1.3;
        const halfW = fit.halfW + (wide ? 1.15 : 0.3);
        const halfH = fit.halfH + (wide ? 0.95 : 0.45);
        const halfFov = (camera.fov * Math.PI) / 360;
        const distV = halfH / Math.tan(halfFov);
        const distH = halfW / (Math.tan(halfFov) * Math.max(0.2, camera.aspect));
        const dist = Math.max(distV, distH) * (wide ? 1.25 : 1.05);
        camera.position.set(camAt.x, camAt.y + halfH * 0.1, camAt.z + dist);
        camera.lookAt(camAt);
      }

      characters.forEach((ch) => {
        ch.update(dt, now);
        // Ease toward whatever position the selection state asked for.
        const target = ch.stageTarget || ch.home;
        if (target) {
          ch.root.position.x += (target.x - ch.root.position.x) * Math.min(1, dt * 3.4);
          ch.root.position.z += (target.z - ch.root.position.z) * Math.min(1, dt * 3.4);
        }
      });
      kawkab?.update(dt, now);
    });

    return () => {
      disposed = true;
      el.removeEventListener('pointerup', onUp);
      hitMeshes.forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
      hitMeshes = [];
      characters.forEach((ch) => ch.dispose());
      kawkab?.dispose();
      floor.geometry.dispose();
      floor.material.dispose();
      stage.removeFromParent();
      scene.remove(playRoot);
      dispose();
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [castKey]);

  // ── focus: bring the questioned suspect forward, turn the rest aside ────
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    api.characters.forEach((ch, id) => {
      const focused = activeId === id;
      const home = ch.home || { x: 0, z: 0 };
      ch.stageTarget = activeId == null
        ? home
        : focused
          ? { x: home.x * 0.35, z: 0.85 }
          : { x: home.x * 1.25, z: home.z - 0.85 };
      ch.lookAt(activeId == null ? -home.x * 0.14 : focused ? 0 : home.x > 0 ? 0.7 : -0.7);
    });
  }, [activeId]);

  // ── reactions: one-shot beats fired by the case engine ─────────────────
  useEffect(() => {
    const api = apiRef.current;
    if (!api || !reaction?.sid) return;
    api.characters.get(reaction.sid)?.react(reaction.action || 'rattled');
    api.kawkab?.play(reaction.action === 'concede' ? 'concede' : 'idle');
  }, [reaction]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api || !cleared?.length) return;
    cleared.forEach((id) => api.characters.get(id)?.play('idle', { loop: true }));
  }, [cleared]);

  return <div ref={wrapRef} className="nr-stage" />;
}
