import React, { useEffect, useRef } from 'react';
import { GAME_INTS } from '../../../../../../shared/gamePalette';
import { bootC3dScene, THREE } from '../../../../../../shared/c3dBoot';
import { createCharacter, preloadCast } from '../../../../../../shared/castModels';
import { RIG_HEIGHT } from '../../../../../../shared/castRoster';

/*
 * Survival's interrogation room.
 *
 * The cast assets are intentionally never scaled: their shared skinned rig
 * breaks when a parent scale is introduced (see castModels.js). Perceived size
 * is controlled by the camera and by a separate portrait layout instead.
 */
const CHAR_WIDTH = 1.05;
const FLOOR_Y = 0.065;

/*
 * How much of the frame height ONE suspect fills.
 *
 * This is the only control over apparent size, because the rigs are never
 * scaled (see the note above). It is also what keeps the room ORGANISED: the
 * camera distance is solved from this number and nothing else, so a suspect is
 * the same size in a two-hander as in a five-hander.
 *
 * The old code solved the opposite way round — it pushed the camera back until
 * the widest line fitted — which meant apparent size was a side effect of how
 * many people the case happened to have. A two-suspect case rendered them at
 * ~61% of the frame and a four-suspect case at ~33%, so the room looked like a
 * different room in every case.
 */
const FILL_PORTRAIT = 0.28;
const FILL_WIDE = 0.26;

// Bodies are CHAR_WIDTH wide, so a spread below that overlaps them. The old
// portrait value was 1.06 against a 1.05-wide body: they touched.
const MIN_SPREAD = CHAR_WIDTH * 1.2;
const MAX_SPREAD = 1.55;
// Breathing room between the outermost body and the edge of frame.
const EDGE_MARGIN = 0.3;
/*
 * Questioning somebody is a close-up, not a line-up.
 *
 * The point of shrinking everyone is that the ROW should read as a row — but
 * once you pick a face, that face is the thing you are reading for a tell, so
 * the camera earns the size back by coming in. This is the contrast the whole
 * change is for: small and orderly when you are surveying, close when you are
 * working. (At 0.8 the close-up was too timid — 78px on a desktop.)
 */
const TALK_DISTANCE = 0.62;

const damp = (value, target, dt, speed = 5) => value + (target - value) * Math.min(1, dt * speed);

function localName(suspect, isAr) {
  if (typeof suspect.name === 'string') return suspect.name;
  return suspect.name?.[isAr ? 'ar' : 'en'] || suspect.name?.en || suspect.id;
}

/** A crisp camera-facing brass nameplate, owned and disposed by the stage. */
function makeNameplate(text, accent, renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 112;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(5, 6, 10, 0.94)';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(10, 12, 492, 88, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f3e6c8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 34px Outfit, Cairo, sans-serif';
  ctx.fillText(text, 256, 57, 450);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.92, 0.2, 1);
  sprite.renderOrder = 20;
  return { sprite, texture, material };
}

export default function Interrogation3D({
  suspects,
  activeId,
  reaction,
  cleared,
  isAr,
  onSelect,
  onReady,
  onError,
}) {
  const wrapRef = useRef(null);
  const apiRef = useRef(null);
  const handlers = useRef({});
  const activeRef = useRef(activeId);
  const clearedRef = useRef(cleared || []);
  handlers.current = { onSelect, onReady, onError };
  activeRef.current = activeId;
  clearedRef.current = cleared || [];

  // Rebuild for a genuinely different cast or language, not on selection.
  const castKey = suspects.map((s) => s.id).join(',');

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    let disposed = false;
    const boot = bootC3dScene(wrap, {
      fov: 44,
      fitHalf: 4.2,
      alpha: true,
      bloom: false,
      lights: false,
      stars: false,
    });
    if (boot.error) {
      handlers.current.onError?.(boot.error);
      return () => boot.dispose();
    }

    const { camera, coarse, playRoot, scene, renderer, setTick, dispose } = boot;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.86;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.setAttribute(
      'aria-label',
      isAr ? 'صف المشتبه بهم التفاعلي' : 'Interactive suspect line-up',
    );
    // Tide deep's darkest stop — was #06070b, a noir black of its own. Fog must
    // be the DARKEST stop, never a mid tone: FogExp2 fades distance toward this
    // colour, so a mid grey hazes the room instead of letting it recede.
    scene.fog = new THREE.FogExp2(0x121826, 0.055);

    const stage = new THREE.Group();
    playRoot.add(stage);

    // Only set geometry is disposed here. Cast geometry/materials are cached and
    // shared across cases, so they must never enter these ownership sets.
    const ownedGeometry = new Set();
    const ownedMaterial = new Set();
    const ownedTexture = new Set();
    const own = (mesh, parent = stage) => {
      if (mesh.geometry) ownedGeometry.add(mesh.geometry);
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.filter(Boolean).forEach((m) => ownedMaterial.add(m));
      parent.add(mesh);
      return mesh;
    };
    const box = (parent, size, material, position) => {
      const mesh = own(new THREE.Mesh(new THREE.BoxGeometry(...size), material), parent);
      mesh.position.set(...position);
      mesh.receiveShadow = true;
      return mesh;
    };

    // ── room shell ────────────────────────────────────────────────────────
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090a0e,
      roughness: 0.68,
      metalness: 0.18,
    });
    const floor = own(new THREE.Mesh(new THREE.PlaneGeometry(10.5, 5.8), floorMat));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0.55, 0, 0.75);
    floor.receiveShadow = true;

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0a0c12,
      roughness: 0.92,
      metalness: 0.08,
    });
    const wall = own(new THREE.Mesh(new THREE.PlaneGeometry(10.5, 4.3), wallMat));
    wall.position.set(0.55, 1.74, -1.48);
    wall.receiveShadow = true;

    const railMat = new THREE.MeshStandardMaterial({
      color: 0x24201a,
      roughness: 0.5,
      metalness: 0.62,
    });
    box(stage, [9.7, 0.08, 0.12], railMat, [0.55, 3.27, -1.35]);
    box(stage, [9.7, 0.1, 0.16], railMat, [0.55, 0.18, -1.35]);
    box(stage, [0.08, 3.15, 0.12], railMat, [-4.28, 1.72, -1.35]);
    box(stage, [0.08, 3.15, 0.12], railMat, [5.38, 1.72, -1.35]);

    // Repeated wall seams give the room scale without competing with faces.
    const seamMat = new THREE.MeshBasicMaterial({
      color: 0x252a36,
      transparent: true,
      opacity: 0.42,
      toneMapped: false,
    });
    [-3.55, -2.55, -1.55, 2.55, 3.55, 4.55].forEach((x) => {
      box(stage, [0.025, 2.85, 0.02], seamMat, [x, 1.7, -1.445]);
    });

    // A single shadow caster gives every actor contact with the floor without
    // paying for three animated shadow maps on phones.
    const ambient = new THREE.HemisphereLight(0x7183a6, 0x160e09, 0.62);
    stage.add(ambient);
    const key = new THREE.DirectionalLight(0xffdbac, 1.8);
    key.position.set(2.8, 5.4, 4.2);
    key.target.position.set(0, 0.78, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(coarse ? 512 : 1024, coarse ? 512 : 1024);
    key.shadow.camera.left = -5;
    key.shadow.camera.right = 5;
    key.shadow.camera.top = 4.5;
    key.shadow.camera.bottom = -1.5;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 14;
    key.shadow.bias = -0.00035;
    key.shadow.normalBias = 0.025;
    stage.add(key, key.target);

    const coldRim = new THREE.PointLight(0x4e73ad, 5.2, 7.5, 1.7);
    coldRim.position.set(-3.5, 2.25, -0.25);
    stage.add(coldRim);
    const amberRim = new THREE.PointLight(0xc17838, 4.4, 7, 1.8);
    amberRim.position.set(3.75, 1.5, 0.9);
    stage.add(amberRim);

    const entries = [];
    const characters = new Map();
    let kawkab = null;
    let hitMeshes = [];
    let hoveredId = null;

    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x0d111a,
      roughness: 0.82,
      metalness: 0.14,
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x30281d,
      roughness: 0.42,
      metalness: 0.68,
    });
    const riserMat = new THREE.MeshStandardMaterial({
      color: 0x101118,
      emissive: 0x20170c,
      emissiveIntensity: 0.22,
      roughness: 0.48,
      metalness: 0.55,
    });

    const makeBay = (suspect, index) => {
      const bay = new THREE.Group();
      stage.add(bay);

      const panel = own(new THREE.Mesh(new THREE.PlaneGeometry(1.16, 2.65), panelMat), bay);
      panel.position.set(0, 1.58, -1.44);
      panel.receiveShadow = true;
      box(bay, [1.27, 0.055, 0.055], frameMat, [0, 2.91, -1.39]);
      box(bay, [1.27, 0.055, 0.055], frameMat, [0, 0.25, -1.39]);
      box(bay, [0.055, 2.72, 0.055], frameMat, [-0.635, 1.58, -1.39]);
      box(bay, [0.055, 2.72, 0.055], frameMat, [0.635, 1.58, -1.39]);

      const accent = new THREE.Color(suspect.accent || 0xd9a441);
      const haloMat = new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });
      const halo = own(new THREE.Mesh(new THREE.RingGeometry(0.42, 0.445, 64), haloMat), bay);
      halo.position.set(0, 1.58, -1.37);

      const slitMat = new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.17,
        toneMapped: false,
      });
      box(bay, [0.045, 1.65, 0.025], slitMat, [0, 1.62, -1.365]);

      const lampMat = new THREE.MeshStandardMaterial({
        color: 0x2d281f,
        emissive: 0x8c5728,
        emissiveIntensity: 0.32,
        roughness: 0.38,
        metalness: 0.72,
      });
      const lamp = own(
        new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.27, 0.16, 32), lampMat),
        bay,
      );
      lamp.position.set(0, 3.08, -0.05);

      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xffd89a,
        transparent: true,
        opacity: 0.045,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });
      const beam = own(
        new THREE.Mesh(new THREE.ConeGeometry(0.73, 3.05, 32, 1, true), beamMat),
        bay,
      );
      beam.position.set(0, 1.57, -0.02);
      beam.renderOrder = 1;

      const riser = own(
        new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.7, 0.1, 48), riserMat),
        bay,
      );
      riser.position.set(0, 0.05, 0.02);
      riser.receiveShadow = true;

      const poolMat = new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.13,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      });
      const pool = own(new THREE.Mesh(new THREE.CircleGeometry(0.58, 48), poolMat), bay);
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(0, 0.106, 0.02);
      pool.renderOrder = 2;

      const spot = new THREE.SpotLight(0xffd8a3, 13.5, 7, Math.PI / 7.2, 0.82, 1.45);
      const spotTarget = new THREE.Object3D();
      stage.add(spot, spotTarget);
      spot.target = spotTarget;

      const nameplate = makeNameplate(
        localName(suspect, isAr),
        suspect.accent || '#d9a441',
        renderer,
      );
      ownedTexture.add(nameplate.texture);
      ownedMaterial.add(nameplate.material);
      stage.add(nameplate.sprite);

      const entry = {
        id: suspect.id,
        index,
        bay,
        beam,
        beamMat,
        haloMat,
        nameplate: nameplate.sprite,
        poolMat,
        riserMat,
        spot,
        spotTarget,
        home: { x: 0, z: 0 },
        ch: null,
      };
      entries.push(entry);
      return entry;
    };

    suspects.forEach(makeBay);

    // The detective has his own downstage station. On portrait screens the
    // station leaves the shot completely so the three suspects can stay large.
    const detectiveStation = new THREE.Group();
    stage.add(detectiveStation);
    const detectiveRiserMat = new THREE.MeshStandardMaterial({
      color: 0x141116,
      emissive: 0x5d3817,
      emissiveIntensity: 0.28,
      roughness: 0.46,
      metalness: 0.58,
    });
    const detectiveRiser = own(
      new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.09, 48), detectiveRiserMat),
      detectiveStation,
    );
    detectiveRiser.position.y = 0.045;
    detectiveRiser.receiveShadow = true;
    const detectiveRingMat = new THREE.MeshBasicMaterial({
      color: GAME_INTS.accent.fill,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const detectiveRing = own(
      new THREE.Mesh(new THREE.RingGeometry(0.43, 0.49, 48), detectiveRingMat),
      detectiveStation,
    );
    detectiveRing.rotation.x = -Math.PI / 2;
    detectiveRing.position.y = 0.1;
    const detectiveSpot = new THREE.SpotLight(GAME_INTS.accent.fill, 8.5, 6, Math.PI / 6, 0.85, 1.5);
    const detectiveTarget = new THREE.Object3D();
    stage.add(detectiveSpot, detectiveTarget);
    detectiveSpot.target = detectiveTarget;

    (async () => {
      try {
        await preloadCast([...suspects.map((s) => s.id), 'kawkab']);
        if (disposed) return;

        for (let i = 0; i < suspects.length; i++) {
          const suspect = suspects[i];
          const ch = await createCharacter(suspect.id, { seedIndex: i });
          if (disposed) {
            ch.dispose();
            return;
          }
          ch.root.position.y = FLOOR_Y;
          ch.model.traverse((node) => {
            if (node.isMesh) node.castShadow = true;
          });
          stage.add(ch.root);
          characters.set(suspect.id, ch);
          entries[i].ch = ch;

          const hit = new THREE.Mesh(
            new THREE.BoxGeometry(CHAR_WIDTH * 0.9, RIG_HEIGHT * 1.04, CHAR_WIDTH * 0.74),
            new THREE.MeshBasicMaterial({ visible: false }),
          );
          hit.position.y = RIG_HEIGHT / 2;
          hit.userData.suspectId = suspect.id;
          ch.root.add(hit);
          hitMeshes.push(hit);
        }

        kawkab = await createCharacter('kawkab', { seedIndex: suspects.length + 1 });
        if (disposed) {
          kawkab.dispose();
          return;
        }
        kawkab.root.position.y = FLOOR_Y;
        kawkab.model.traverse((node) => {
          if (node.isMesh) node.castShadow = true;
        });
        stage.add(kawkab.root);

        apiRef.current = { characters, entries, kawkab };
        handlers.current.onReady?.();
      } catch (err) {
        if (!disposed) handlers.current.onError?.(err);
      }
    })();

    // ── picking ───────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const canvas = renderer.domElement;
    const hitAt = (e) => {
      if (!hitMeshes.length) return null;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(hitMeshes, false)[0]?.object?.userData?.suspectId || null;
    };
    const onMove = (e) => {
      if (e.pointerType === 'touch') return;
      hoveredId = hitAt(e);
      canvas.style.cursor = hoveredId ? 'pointer' : 'default';
    };
    const onLeave = () => {
      hoveredId = null;
      canvas.style.cursor = 'default';
    };
    const onUp = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const id = hitAt(e);
      if (id) handlers.current.onSelect?.(id);
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerup', onUp);

    // ── responsive composition and animation ─────────────────────────────
    const world = new THREE.Vector3();
    const target = new THREE.Vector3();
    const camAim = new THREE.Vector3();
    const camLook = new THREE.Vector3();
    let camReady = false; // first frame places the camera; later ones ease it
    const clearedSet = new Set();
    setTick((dt, now) => {
      const aspect = Math.max(0.25, camera.aspect || 1);
      // Use the physical screen width as well as the canvas aspect. During a
      // conversation the text panel shortens the canvas, but a phone is still
      // a phone: bringing the detective back then would shrink the suspect at
      // exactly the moment the player chose them.
      const phone = wrap.clientWidth <= 620;
      const portrait = phone || aspect < 0.78;
      const compact = phone || aspect < 1.15;
      const active = activeRef.current;
      const inactiveEntries = active ? entries.filter((entry) => entry.id !== active) : [];

      // ── framing: size first, staging second ──────────────────────────
      // Solve the distance from FILL_* alone, then pick the widest spread the
      // line can have at that distance. Suspects therefore stay one size and
      // the ROW tightens for a crowded case, rather than everyone shrinking.
      const halfFovRad = (camera.fov * Math.PI) / 360;
      const tanHalf = Math.tan(halfFovRad);
      const fill = portrait ? FILL_PORTRAIT : FILL_WIDE;
      const showDetective = !portrait;
      const detectiveGap = compact ? 1.28 : 1.48;

      let baseDistance = RIG_HEIGHT / (2 * fill * tanHalf);
      const gaps = Math.max(1, entries.length - 1);

      // Half-width the frame holds, less the body and the detective's station.
      const spreadFor = (d) => {
        const halfW = d * tanHalf * aspect - EDGE_MARGIN - CHAR_WIDTH / 2
          - (showDetective ? detectiveGap / 2 : 0);
        return (halfW * 2) / gaps;
      };
      let spread = Math.min(MAX_SPREAD, spreadFor(baseDistance));
      if (spread < MIN_SPREAD) {
        // Too tight to stand them apart at that size — give ground on size
        // rather than let them overlap.
        spread = MIN_SPREAD;
        baseDistance = ((MIN_SPREAD * gaps) / 2 + CHAR_WIDTH / 2 + EDGE_MARGIN
          + (showDetective ? detectiveGap / 2 : 0)) / (tanHalf * aspect);
      }
      clearedSet.clear();
      clearedRef.current.forEach((id) => clearedSet.add(id));

      entries.forEach((entry, index) => {
        const x = (index - (entries.length - 1) / 2) * spread;
        const z = portrait ? 0 : -Math.abs(x) * 0.055;
        entry.home = { x, z };
        entry.bay.position.x = x;

        let tx = x;
        let tz = z;
        const focused = active === entry.id;
        if (active) {
          if (focused) {
            tx = portrait ? 0 : -0.25;
            tz = 0.72;
          } else {
            // Stand the others back and to the sides. Proportional to the line
            // spread, not a fixed 2–3 units: with the distance now pinned, an
            // absolute scatter threw them clean out of frame on a phone.
            const slot = inactiveEntries.findIndex((candidate) => candidate.id === entry.id);
            const slotSpread = spread * (portrait ? 1.55 : 1.9);
            tx = (slot - (inactiveEntries.length - 1) / 2) * slotSpread;
            tz = z - 0.68;
          }
        }

        const ch = entry.ch;
        if (ch) {
          ch.root.position.x = damp(ch.root.position.x, tx, dt, 4.2);
          ch.root.position.z = damp(ch.root.position.z, tz, dt, 4.2);
          ch.root.position.y = FLOOR_Y;
          ch.lookAt(!active ? -x * 0.13 : focused ? 0 : tx > 0 ? 0.62 : -0.62);
          ch.update(dt, now);

          entry.nameplate.position.set(ch.root.position.x, 0.16, ch.root.position.z + 0.54);
        } else {
          entry.nameplate.position.set(x, 0.16, z + 0.54);
        }

        const highlighted = focused || (!active && hoveredId === entry.id);
        const clearedActor = clearedSet.has(entry.id);
        const lightTarget = active ? (focused ? 17 : 3.2) : highlighted ? 17 : 11.5;
        entry.spot.intensity = damp(entry.spot.intensity, lightTarget, dt, 5.5);
        entry.spot.position.set(x + 0.18, 3.22, 1.55);
        entry.spotTarget.position.set(tx, 0.82, tz);
        entry.beamMat.opacity = damp(
          entry.beamMat.opacity,
          active ? (focused ? 0.075 : 0.018) : highlighted ? 0.068 : 0.043,
          dt,
          5,
        );
        entry.haloMat.opacity = damp(
          entry.haloMat.opacity,
          clearedActor ? 0.3 : active ? (focused ? 0.38 : 0.07) : highlighted ? 0.34 : 0.19,
          dt,
          5,
        );
        entry.poolMat.opacity = damp(
          entry.poolMat.opacity,
          clearedActor ? 0.23 : active ? (focused ? 0.24 : 0.045) : highlighted ? 0.22 : 0.12,
          dt,
          5,
        );
        entry.nameplate.material.opacity = damp(
          entry.nameplate.material.opacity,
          active ? (focused ? 0 : 0.24) : 1,
          dt,
          6,
        );
      });

      const outerX = ((entries.length - 1) / 2) * spread;
      const detectiveX = outerX + detectiveGap;
      detectiveStation.visible = showDetective;
      detectiveSpot.visible = showDetective;
      detectiveTarget.visible = showDetective;
      detectiveStation.position.set(detectiveX, 0, 0.42);
      detectiveSpot.position.set(detectiveX + 0.3, 3.05, 1.55);
      detectiveTarget.position.set(detectiveX, 0.8, 0.42);
      detectiveRingMat.opacity = damp(detectiveRingMat.opacity, active ? 0.26 : 0.14, dt, 4);
      detectiveSpot.intensity = damp(detectiveSpot.intensity, active ? 11.5 : 7.5, dt, 4);
      if (kawkab) {
        kawkab.root.visible = showDetective;
        kawkab.root.position.x = damp(kawkab.root.position.x, detectiveX, dt, 4.2);
        kawkab.root.position.z = damp(kawkab.root.position.z, 0.42, dt, 4.2);
        kawkab.root.position.y = FLOOR_Y;
        kawkab.lookAt(active ? -1.15 : -0.92);
        kawkab.update(dt, now);
      }

      // Where the camera looks. Idle it holds the whole room (centred between
      // the line and, on wide screens, the detective's station). Once you are
      // questioning somebody it becomes their shot: closer, and on them.
      const roomCentre = showDetective ? detectiveGap / 2 : 0;
      const focusedEntry = active ? entries.find((e) => e.id === active) : null;
      const aimX = focusedEntry && focusedEntry.ch
        ? focusedEntry.ch.root.position.x
        : roomCentre;
      const distance = baseDistance * (active ? TALK_DISTANCE : 1);

      stage.getWorldPosition(world);
      target.set(
        world.x + aimX,
        world.y + RIG_HEIGHT / 2 + (active ? 0.08 : 0.27),
        world.z - 0.12,
      );

      // Damped, not set — walking into an interrogation should read as the
      // camera moving in, not as a cut to a different room.
      camAim.set(target.x, target.y + (portrait ? 0.1 : 0.16), target.z + distance);
      if (camReady) {
        camera.position.lerp(camAim, Math.min(1, dt * 3.2));
        camLook.lerp(target, Math.min(1, dt * 3.2));
      } else {
        camera.position.copy(camAim);
        camLook.copy(target);
        camReady = true;
      }
      camera.lookAt(camLook);
    });

    return () => {
      disposed = true;
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerup', onUp);
      hitMeshes.forEach((mesh) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      hitMeshes = [];
      characters.forEach((ch) => ch.dispose());
      kawkab?.dispose();
      ownedTexture.forEach((texture) => texture.dispose());
      ownedGeometry.forEach((geometry) => geometry.dispose());
      ownedMaterial.forEach((material) => material.dispose());
      stage.removeFromParent();
      scene.remove(playRoot);
      dispose();
      apiRef.current = null;
    };
    // `castKey` is the stable identity of the suspect array; selection changes
    // must not tear down the WebGL scene and reload every model.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [castKey, isAr]);

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

  return (
    <div ref={wrapRef} className={'nr-stage'}>
      <div className={'nr-stage-frame'} aria-hidden={true}>
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
