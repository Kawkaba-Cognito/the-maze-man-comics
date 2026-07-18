import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import {
  fitOrthographic,
  isCoarsePointer,
  isDesktopLayout,
} from '../../../../shared/c3dViewport';
import '../../../../shared/c3dProto.css';

/*
 * Car Park · 3D prototype — space-dock remix of the divided-attention fork.
 * Spaceships leave a hangar; tap the route control to send each craft into
 * the matching colour dock. Parallel ModeShell path only.
 */

const UI = {
  en: {
    title: 'Car Park · 3D',
    tag: 'prototype',
    hint: 'Tap the glowing route control to switch the lane. Dock each spaceship in its colour bay.',
    docked: 'Docked',
    lives: 'Lives',
    wave: 'Wave',
    clear: 'Dock clear',
    next: 'Next wave',
    over: 'Hangar sealed',
    retry: 'Try again',
    hub: 'Back to modes',
    go: 'ENGAGE',
    routeL: '← Port',
    routeR: 'Starboard →',
  },
  ar: {
    title: 'موقف السيارات · ثلاثي الأبعاد',
    tag: 'نموذج',
    hint: 'المس متحكّم المسار المتوهّج لتبديل الحارة. أركن كل سفينة في رصيف لونها.',
    docked: 'رُكنت',
    lives: 'أرواح',
    wave: 'موجة',
    clear: 'اكتمل الرصيف',
    next: 'الموجة التالية',
    over: 'أُغلق الحظيرة',
    retry: 'حاول مجددًا',
    hub: 'العودة للأوضاع',
    go: 'انطلق',
    routeL: '← ميناء',
    routeR: 'يمن →',
  },
};

const DOCKS = [
  { id: 'L', hex: 0x62b277, x: -2.65 },
  { id: 'R', hex: 0xdd7f7a, x: 2.65 },
];
const LIVES0 = 3;
const ATT = 0xe8ac4e;
const INK = 0x1a1610;
const STEEL = 0x3a342c;
const CREAM = 0xf0e2c0;

function disposeObject(obj) {
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

function matStd(hex, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color: hex,
    emissive: new THREE.Color(opts.emissive ?? hex),
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    metalness: opts.metalness ?? 0.45,
    roughness: opts.roughness ?? 0.4,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
}

/** Compact fighter-style craft — readable silhouette from above. */
function makeSpaceship(colorHex) {
  const root = new THREE.Group();
  const hull = matStd(colorHex, { emissiveIntensity: 0.22, metalness: 0.55, roughness: 0.32 });
  const dark = matStd(0x2a241c, { metalness: 0.6, roughness: 0.35, emissiveIntensity: 0 });
  const glass = matStd(CREAM, { emissiveIntensity: 0.35, metalness: 0.2, roughness: 0.15 });
  const engine = matStd(ATT, { emissiveIntensity: 0.85, metalness: 0.2, roughness: 0.25 });

  // Fuselage (cylinder — widest device support)
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.55, 12), hull);
  body.rotation.x = Math.PI / 2;
  body.position.z = 0.02;
  root.add(body);

  // Nose cone
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.32, 10), hull);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -0.48;
  root.add(nose);

  // Wings
  const wingGeo = new THREE.BoxGeometry(0.95, 0.05, 0.28);
  const wings = new THREE.Mesh(wingGeo, hull);
  wings.position.set(0, -0.02, 0.08);
  root.add(wings);

  // Wing tips (colour accent)
  const tipGeo = new THREE.BoxGeometry(0.12, 0.06, 0.22);
  const tipL = new THREE.Mesh(tipGeo, engine);
  tipL.position.set(-0.48, 0, 0.08);
  const tipR = tipL.clone();
  tipR.position.x = 0.48;
  root.add(tipL, tipR);

  // Cockpit canopy
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), glass);
  canopy.scale.set(1, 0.7, 1.15);
  canopy.position.set(0, 0.12, -0.12);
  root.add(canopy);

  // Tail fin
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.2), dark);
  fin.position.set(0, 0.14, 0.32);
  root.add(fin);

  // Engine glow
  const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.12, 10), engine);
  thruster.rotation.x = Math.PI / 2;
  thruster.position.z = 0.48;
  root.add(thruster);

  const plume = new THREE.Mesh(
    new THREE.ConeGeometry(0.1, 0.35, 10),
    matStd(ATT, { emissiveIntensity: 1.1, metalness: 0, roughness: 0.4, transparent: true, opacity: 0.75 }),
  );
  plume.rotation.x = Math.PI / 2;
  plume.position.z = 0.68;
  root.add(plume);
  root.userData.plume = plume;
  root.userData.hullMat = hull;

  root.scale.setScalar(isCoarsePointer() ? 1.22 : 1.05);
  return root;
}

/** Flat hangar bay — readable in true top-down. */
function makeHangar() {
  const g = new THREE.Group();
  const shell = matStd(STEEL, { metalness: 0.55, roughness: 0.45, emissiveIntensity: 0.05 });
  const trim = matStd(ATT, { emissiveIntensity: 0.45, metalness: 0.35, roughness: 0.35 });

  const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.1, 28), shell);
  pad.position.set(0, 0.05, 3.55);
  g.add(pad);

  // U-shaped bay walls (low so they don't hide ships)
  const wallMat = shell;
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 0.28), wallMat);
  back.position.set(0, 0.22, 4.15);
  const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.35, 1.1), wallMat);
  sideL.position.set(-1.05, 0.22, 3.7);
  const sideR = sideL.clone();
  sideR.position.x = 1.05;
  g.add(back, sideL, sideR);

  // Launch mouth glow (flat on deck)
  const mouth = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 0.55),
    matStd(ATT, { emissiveIntensity: 0.65, metalness: 0.2, roughness: 0.4, transparent: true, opacity: 0.7 }),
  );
  mouth.rotation.x = -Math.PI / 2;
  mouth.position.set(0, 0.12, 3.15);
  g.add(mouth);

  for (const x of [-1.05, 1.05]) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), trim);
    lamp.position.set(x, 0.42, 4.05);
    g.add(lamp);
  }
  return g;
}

function makeDockPad(dock) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.95, 0.1, 28),
    matStd(INK, { metalness: 0.4, roughness: 0.55, emissiveIntensity: 0.08 }),
  );
  base.position.y = 0.05;
  g.add(base);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.05, 10, 36),
    matStd(dock.hex, { emissiveIntensity: 0.55, metalness: 0.35, roughness: 0.3 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.12;
  g.add(ring);

  const plate = new THREE.Mesh(
    new THREE.CircleGeometry(0.48, 28),
    matStd(dock.hex, { emissiveIntensity: 0.28, metalness: 0.4, roughness: 0.35 }),
  );
  plate.rotation.x = -Math.PI / 2;
  plate.position.y = 0.11;
  g.add(plate);

  // Beacon pillars
  for (const [ox, oz] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.45, 8),
      matStd(STEEL, { metalness: 0.5, roughness: 0.4, emissiveIntensity: 0 }),
    );
    post.position.set(ox, 0.28, oz);
    g.add(post);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 10, 8),
      matStd(dock.hex, { emissiveIntensity: 0.75, metalness: 0.2, roughness: 0.3 }),
    );
    bulb.position.set(ox, 0.52, oz);
    g.add(bulb);
  }

  g.position.set(dock.x, 0, -3.85);
  g.userData.ring = ring;
  return g;
}

/** Big flat arrow on the XZ plane — unambiguous from top-down. Points +X by default. */
function makeFlatArrow(hex, length = 1.55, width = 0.55) {
  const g = new THREE.Group();
  const m = matStd(hex, { emissiveIntensity: 0.85, metalness: 0.25, roughness: 0.28 });
  const shaftLen = length * 0.55;
  const headLen = length * 0.45;
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(shaftLen, 0.08, width * 0.42), m);
  shaft.position.x = -headLen * 0.15;
  g.add(shaft);
  // Triangle head via cone flattened onto the deck
  const head = new THREE.Mesh(new THREE.ConeGeometry(width * 0.72, headLen, 3), m);
  head.rotation.z = -Math.PI / 2;
  head.position.x = shaftLen * 0.5 + headLen * 0.15;
  g.add(head);
  // Dark outline underlay for contrast on the warm dial
  const outline = matStd(0x0a0806, { emissiveIntensity: 0, metalness: 0.2, roughness: 0.8 });
  const shaftO = new THREE.Mesh(new THREE.BoxGeometry(shaftLen + 0.08, 0.04, width * 0.42 + 0.1), outline);
  shaftO.position.set(shaft.position.x, -0.03, 0);
  const headO = new THREE.Mesh(new THREE.ConeGeometry(width * 0.72 + 0.08, headLen + 0.08, 3), outline);
  headO.rotation.z = -Math.PI / 2;
  headO.position.set(head.position.x, -0.03, 0);
  g.add(shaftO, headO);
  g.userData.mats = [m];
  return g;
}

/** Flat route pad with a large left/right arrow (top-down readable). */
function makeRouteControl() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.12, 0.1, 36),
    matStd(STEEL, { metalness: 0.55, roughness: 0.4, emissiveIntensity: 0.08 }),
  );
  base.position.y = 0.06;
  g.add(base);

  const dial = new THREE.Mesh(
    new THREE.CylinderGeometry(0.92, 0.92, 0.07, 36),
    matStd(ATT, { emissiveIntensity: 0.4, metalness: 0.35, roughness: 0.3 }),
  );
  dial.position.y = 0.13;
  g.add(dial);

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16),
    matStd(CREAM, { emissiveIntensity: 0.7, metalness: 0.25, roughness: 0.25 }),
  );
  core.position.y = 0.24;
  g.add(core);

  // Static port / starboard ticks so the pad always reads as a switch
  const tickMatL = matStd(0x62b277, { emissiveIntensity: 0.35, metalness: 0.3, roughness: 0.4 });
  const tickMatR = matStd(0xdd7f7a, { emissiveIntensity: 0.35, metalness: 0.3, roughness: 0.4 });
  const tickL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.1), tickMatL);
  tickL.position.set(-0.78, 0.18, 0);
  const tickR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.1), tickMatR);
  tickR.position.set(0.78, 0.18, 0);
  g.add(tickL, tickR);

  const arrow = makeFlatArrow(CREAM, 1.5, 0.62);
  arrow.position.y = 0.22;
  g.add(arrow);

  // Active-path marker from fork toward chosen dock (flat box — stable top-down)
  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.06, 0.42),
    matStd(CREAM, {
      emissiveIntensity: 0.75,
      metalness: 0.15,
      roughness: 0.35,
      transparent: true,
      opacity: 0.9,
    }),
  );
  beam.position.set(1.15, 0.16, -0.55);
  g.add(beam);

  // Wide invisible hit target — oversized for thumbs on phones
  const hit = new THREE.Mesh(
    new THREE.CylinderGeometry(1.85, 1.85, 0.55, 20),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  hit.position.y = 0.2;
  hit.userData.isHit = true;
  g.add(hit);

  g.position.set(0, 0, -0.55);
  g.userData.dial = dial;
  g.userData.core = core;
  g.userData.arrow = arrow;
  g.userData.beam = beam;
  g.userData.tickL = tickL;
  g.userData.tickR = tickR;
  g.userData.hit = hit;
  return g;
}

function buildLaneMeshes(curve, color = 0x2f2920, radius = 0.14) {
  const tubular = fineSegments(curve);
  const geo = new THREE.TubeGeometry(curve, tubular, radius, 10, false);
  const mesh = new THREE.Mesh(geo, matStd(color, { metalness: 0.35, roughness: 0.55, emissiveIntensity: 0.08 }));
  const glowGeo = new THREE.TubeGeometry(curve, tubular, radius * 0.35, 8, false);
  const glow = new THREE.Mesh(
    glowGeo,
    matStd(ATT, { emissiveIntensity: 0.35, metalness: 0.2, roughness: 0.4, transparent: true, opacity: 0.55 }),
  );
  glow.position.y = 0.02;
  return [mesh, glow];
}

function fineSegments(curve) {
  return Math.max(24, Math.round(curve.getLength() * 8));
}

export default function CarPark3DProto({ isAr, playSfx, onBack }) {
  const t = UI[isAr ? 'ar' : 'en'];
  const wrapRef = useRef(null);
  const apiRef = useRef({ startWave: () => {}, retry: () => {} });

  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(LIVES0);
  const [docked, setDocked] = useState(0);
  const [need, setNeed] = useState(4);
  const [sw, setSw] = useState(0); // 0 = L, 1 = R
  const [banner, setBanner] = useState('go');
  const [bootError, setBootError] = useState(null);

  const livesRef = useRef(LIVES0);
  const waveRef = useRef(1);
  const swRef = useRef(0);
  const playSfxRef = useRef(playSfx);
  playSfxRef.current = playSfx;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = isCoarsePointer();

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !coarse,
        alpha: false,
        powerPreference: coarse ? 'default' : 'high-performance',
      });
    } catch (err) {
      console.error('[CarPark3D] WebGL init failed', err);
      setBootError(isAr ? 'تعذّر تشغيل الرسم ثلاثي الأبعاد' : 'Could not start 3D graphics');
      return undefined;
    }

    const scene = new THREE.Scene();
    // Light fog only — keep the deck crisp from straight above
    scene.fog = new THREE.FogExp2(0x000000, 0.012);

    // True top-down: orthographic, looking down -Y. up = -Z so hangar is at
    // the bottom of the screen and docks at the top (ships fly "up").
    const viewSize = 5.6;
    const camera = new THREE.OrthographicCamera(-viewSize, viewSize, viewSize, -viewSize, 0.1, 50);
    camera.position.set(0, 18, 0);
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, 0);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.3 : fine ? 1.5 : 1.2));
    renderer.setClearColor(0x000000, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
    wrap.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xb8a88a, 0.7));
    const key = new THREE.DirectionalLight(0xfff0d8, 1.05);
    key.position.set(2, 16, 1);
    scene.add(key);
    const rim = new THREE.PointLight(ATT, 1.1, 28);
    rim.position.set(0, 6, 0);
    scene.add(rim);

    // Starfield — mostly in the XZ plane around the deck (visible top-down)
    const starN = fine ? 1400 : 900;
    const starPos = new Float32Array(starN * 3);
    for (let i = 0; i < starN; i++) {
      const ring = 9 + Math.random() * 28;
      const a = Math.random() * Math.PI * 2;
      starPos[i * 3] = Math.cos(a) * ring;
      starPos[i * 3 + 1] = -0.5 - Math.random() * 4;
      starPos[i * 3 + 2] = Math.sin(a) * ring;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: CREAM, size: fine ? 0.045 : 0.055, transparent: true, opacity: 0.8,
      depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
    }));
    scene.add(stars);

    // Deck plate
    const deck = new THREE.Mesh(
      new THREE.CircleGeometry(8.2, 56),
      matStd(0x12100c, { metalness: 0.35, roughness: 0.82, emissiveIntensity: 0.04 }),
    );
    deck.rotation.x = -Math.PI / 2;
    scene.add(deck);

    const ringDeck = new THREE.Mesh(
      new THREE.TorusGeometry(7.4, 0.04, 8, 64),
      matStd(ATT, { emissiveIntensity: 0.25, metalness: 0.4, roughness: 0.4 }),
    );
    ringDeck.rotation.x = Math.PI / 2;
    ringDeck.position.y = 0.02;
    scene.add(ringDeck);

    // Flight paths
    const approachCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.38, 3.35),
      new THREE.Vector3(0, 0.38, 1.6),
      new THREE.Vector3(0, 0.38, -0.35),
    ]);
    const branchL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.38, -0.35),
      new THREE.Vector3(-1.15, 0.38, -1.55),
      new THREE.Vector3(-2.45, 0.38, -2.7),
      new THREE.Vector3(-2.65, 0.38, -3.85),
    ]);
    const branchR = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.38, -0.35),
      new THREE.Vector3(1.15, 0.38, -1.55),
      new THREE.Vector3(2.45, 0.38, -2.7),
      new THREE.Vector3(2.65, 0.38, -3.85),
    ]);

    const laneRoot = new THREE.Group();
    scene.add(laneRoot);
    for (const mesh of [
      ...buildLaneMeshes(approachCurve, 0x2a241c, 0.16),
      ...buildLaneMeshes(branchL, 0x243528, 0.13),
      ...buildLaneMeshes(branchR, 0x3a2424, 0.13),
    ]) laneRoot.add(mesh);

    // Branch rails — active path gets a thick bright tube; idle path dims
    const tintL = new THREE.Mesh(
      new THREE.TubeGeometry(branchL, 36, 0.1, 10, false),
      matStd(0x62b277, { emissiveIntensity: 0.55, transparent: true, opacity: 0.9, metalness: 0.2, roughness: 0.35 }),
    );
    const tintR = new THREE.Mesh(
      new THREE.TubeGeometry(branchR, 36, 0.1, 10, false),
      matStd(0xdd7f7a, { emissiveIntensity: 0.55, transparent: true, opacity: 0.9, metalness: 0.2, roughness: 0.35 }),
    );
    laneRoot.add(tintL, tintR);

    const hangar = makeHangar();
    scene.add(hangar);

    const dockPads = DOCKS.map((d) => {
      const pad = makeDockPad(d);
      scene.add(pad);
      return pad;
    });

    const control = makeRouteControl();
    scene.add(control);

    // Bloom is optional polish — never let postprocessing kill the prototype.
    let composer = null;
    if (fine && !reduced) {
      try {
        composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.38, 0.55, 0.78));
      } catch (err) {
        console.warn('[CarPark3D] bloom disabled', err);
        composer = null;
      }
    }

    const ships = [];
    let dockedCount = 0;
    let needCount = 4;
    let spawnLeft = 0;
    let spawnAcc = 0;
    let spawnEvery = 1.55;
    let cruise = 1.55; // curve progress units / sec (normalized differently below)
    let running = false;
    let engageAt = 0;

    const tmpPos = new THREE.Vector3();
    const tmpTan = new THREE.Vector3();

    const updateRouteVisual = () => {
      const left = swRef.current === 0;
      const col = left ? 0x62b277 : 0xdd7f7a;
      const arrow = control.userData.arrow;
      if (arrow) {
        // Arrow built pointing +X; flip 180° for port
        arrow.rotation.y = left ? Math.PI : 0;
        (arrow.userData.mats || []).forEach((m) => {
          m.color.setHex(col);
          m.emissive.setHex(col);
          m.emissiveIntensity = 0.95;
        });
      }

      const beam = control.userData.beam;
      if (beam?.material) {
        beam.material.color.setHex(col);
        beam.material.emissive.setHex(col);
        beam.material.emissiveIntensity = 0.9;
        beam.material.opacity = 0.9;
        // Beam sits on the active branch entrance
        beam.position.set(left ? -1.15 : 1.15, 0.16, -0.55);
        beam.rotation.y = left ? 0.45 : -0.45;
      }

      const dial = control.userData.dial;
      if (dial?.material) {
        dial.material.color.setHex(col);
        dial.material.emissive.setHex(col);
        dial.material.emissiveIntensity = 0.55;
      }

      if (control.userData.tickL?.material) {
        control.userData.tickL.material.emissiveIntensity = left ? 0.9 : 0.15;
        control.userData.tickL.scale.setScalar(left ? 1.35 : 0.85);
      }
      if (control.userData.tickR?.material) {
        control.userData.tickR.material.emissiveIntensity = left ? 0.15 : 0.9;
        control.userData.tickR.scale.setScalar(left ? 0.85 : 1.35);
      }

      tintL.material.emissiveIntensity = left ? 0.9 : 0.06;
      tintR.material.emissiveIntensity = left ? 0.06 : 0.9;
      tintL.material.opacity = left ? 1 : 0.14;
      tintR.material.opacity = left ? 0.14 : 1;
    };

    const clearShips = () => {
      for (const s of ships) {
        scene.remove(s.root);
        disposeObject(s.root);
      }
      ships.length = 0;
    };

    let bootTimer = 0;
    const startWave = (w) => {
      if (bootTimer) {
        window.clearTimeout(bootTimer);
        bootTimer = 0;
      }
      clearShips();
      waveRef.current = w;
      setWave(w);
      dockedCount = 0;
      setDocked(0);
      needCount = 3 + w;
      setNeed(needCount);
      spawnLeft = needCount;
      spawnAcc = 0.35; // first ship soon
      spawnEvery = Math.max(0.85, 1.65 - w * 0.1);
      cruise = Math.min(2.35, 1.45 + w * 0.12);
      running = true;
      engageAt = performance.now() + 280;
      setBanner(null);
      updateRouteVisual();
      playSfxRef.current?.('click');
    };

    const spawnShip = () => {
      if (spawnLeft <= 0) return;
      spawnLeft -= 1;
      const dock = DOCKS[Math.floor(Math.random() * DOCKS.length)];
      const root = makeSpaceship(dock.hex);
      approachCurve.getPointAt(0, tmpPos);
      root.position.copy(tmpPos);
      scene.add(root);
      ships.push({
        root,
        dockId: dock.id,
        phase: 'approach',
        u: 0,
        path: null,
      });
    };

    const loseLife = () => {
      livesRef.current -= 1;
      setLives(livesRef.current);
      playSfxRef.current?.('error');
      if (livesRef.current <= 0) {
        running = false;
        setBanner('over');
      }
    };

    const onDock = (ok) => {
      if (ok) {
        dockedCount += 1;
        setDocked(dockedCount);
        playSfxRef.current?.('collect');
        if (dockedCount >= needCount) {
          running = false;
          setBanner('clear');
        }
      } else {
        loseLife();
      }
    };

    const placeOnCurve = (ship, curve, u) => {
      const uu = THREE.MathUtils.clamp(u, 0, 1);
      curve.getPointAt(uu, tmpPos);
      curve.getTangentAt(uu, tmpTan);
      ship.root.position.copy(tmpPos);
      // Keep decks level under the overhead camera; nose follows the lane.
      ship.root.rotation.set(0, Math.atan2(tmpTan.x, tmpTan.z) + Math.PI, 0);
      const plume = ship.root.userData.plume;
      if (plume) {
        const pulse = 0.85 + Math.sin(performance.now() * 0.02 + uu * 8) * 0.15;
        plume.scale.set(pulse, pulse, 0.9 + pulse * 0.35);
      }
    };

    const toggleRoute = () => {
      swRef.current = swRef.current === 0 ? 1 : 0;
      setSw(swRef.current);
      updateRouteVisual();
      playSfxRef.current?.('click');
    };

    const onPointer = (e) => {
      if (!running || performance.now() < engageAt) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(control, true);
      if (hits.length) {
        toggleRoute();
        return;
      }
      // Phone fallback: tap the middle band of the screen to flip the route
      if (coarse) {
        const ny = (e.clientY - rect.top) / rect.height;
        if (ny > 0.28 && ny < 0.72) toggleRoute();
      }
    };
    renderer.domElement.addEventListener('pointerup', onPointer);

    const resize = () => {
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      const aspect = w / Math.max(1, h);
      const desk = isDesktopLayout(w, h);
      // World playfield: docks ±2.65 x, hangar/docks ≈ z −4.2…+4.2
      const halfW = coarse ? 3.55 : desk ? 3.45 : 3.7;
      const halfH = coarse ? 4.85 : desk ? 4.55 : 4.7;
      const { h: viewH } = fitOrthographic(
        camera,
        halfW,
        halfH,
        aspect,
        coarse ? 1.14 : desk ? 1.08 : 1.1,
        { maxAspect: desk ? 1.35 : 1.55 },
      );
      // Bias frustum toward hangar (+Z / screen bottom) so the lot sits under the HUD
      const bias = viewH * (desk ? 0.07 : 0.05);
      camera.top = viewH - bias;
      camera.bottom = -viewH - bias;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      composer?.setSize(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    window.visualViewport?.addEventListener('resize', resize);

    let raf = 0;
    let last = performance.now();
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      try {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;

        // Idle polish
        if (!reduced) {
          stars.rotation.y += dt * 0.008;
          const core = control.userData.core;
          if (core?.material) {
            core.material.emissiveIntensity = 0.55 + Math.sin(now * 0.007) * 0.2;
          }
          if (control.userData.dial) control.userData.dial.rotation.y += dt * 0.45;
          dockPads.forEach((pad, i) => {
            const ring = pad.userData.ring;
            if (ring) ring.rotation.z += dt * (i === 0 ? 0.7 : -0.7);
          });
        }

        if (running) {
          spawnAcc += dt;
          if (spawnLeft > 0 && spawnAcc >= spawnEvery) {
            spawnAcc = 0;
            spawnShip();
          }

          const approachLen = Math.max(0.001, approachCurve.getLength());
          const branchLen = Math.max(0.001, branchL.getLength());

          for (let i = ships.length - 1; i >= 0; i--) {
            const ship = ships[i];
            if (ship.phase === 'approach') {
              ship.u += (cruise * dt) / approachLen;
              if (ship.u >= 1) {
                ship.u = 0;
                ship.phase = 'branch';
                ship.path = swRef.current; // lock at fork
                placeOnCurve(ship, ship.path === 0 ? branchL : branchR, 0);
              } else {
                placeOnCurve(ship, approachCurve, ship.u);
              }
            } else if (ship.phase === 'branch') {
              const curve = ship.path === 0 ? branchL : branchR;
              ship.u += (cruise * 1.05 * dt) / branchLen;
              if (ship.u >= 1) {
                const want = ship.dockId === 'L' ? 0 : 1;
                const ok = ship.path === want;
                scene.remove(ship.root);
                disposeObject(ship.root);
                ships.splice(i, 1);
                onDock(ok);
              } else {
                placeOnCurve(ship, curve, ship.u);
              }
            }
          }
        }

        if (composer) composer.render();
        else renderer.render(scene, camera);
      } catch (err) {
        // Keep the loop alive so a single bad frame doesn't leave a black screen.
        console.warn('[CarPark3D] frame error', err);
        try { renderer.render(scene, camera); } catch { /* ignore */ }
      }
    };
    raf = requestAnimationFrame(tick);
    updateRouteVisual();

    apiRef.current = {
      startWave,
      retry: () => {
        livesRef.current = LIVES0;
        setLives(LIVES0);
        swRef.current = 0;
        setSw(0);
        startWave(1);
      },
    };

    // Auto-start like MOT — don't depend on ENGAGE if the user expects instant play.
    bootTimer = window.setTimeout(() => {
      startWave(1);
    }, 700);

    return () => {
      if (bootTimer) window.clearTimeout(bootTimer);
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.visualViewport?.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointerup', onPointer);
      clearShips();
      disposeObject(hangar);
      disposeObject(control);
      disposeObject(laneRoot);
      dockPads.forEach(disposeObject);
      starGeo.dispose();
      stars.material.dispose();
      deck.geometry.dispose();
      deck.material.dispose();
      ringDeck.geometry.dispose();
      ringDeck.material.dispose();
      composer?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === wrap) wrap.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="c3d-root" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="c3d-canvas" ref={wrapRef} aria-hidden="true" />
      {bootError && (
        <div className="c3d-banner c3d-banner--over">
          <span>{bootError}</span>
          <button type="button" className="c3d-cta" onClick={() => { playSfx?.('click'); onBack(); }}>
            {t.hub}
          </button>
        </div>
      )}
      <div className="c3d-ui c3d-ui--overlay">
        <header className="c3d-top">
          <button type="button" className="c3d-icon-btn" onClick={() => { playSfx?.('click'); onBack(); }}>
            {isAr ? '›' : '‹'}
          </button>
          <div className="c3d-titles">
            <div className="c3d-title">{t.title}</div>
            <div className="c3d-tag">{t.tag}</div>
          </div>
          <div
            className="c3d-target-chip"
            style={{
              width: 'auto',
              minWidth: 56,
              height: 44,
              padding: '0 8px',
              fontSize: '0.68rem',
              fontWeight: 800,
              color: sw === 0 ? '#8fd4a0' : '#f0a8a4',
              borderColor: sw === 0 ? 'rgba(98,178,119,0.7)' : 'rgba(221,127,122,0.7)',
              boxShadow: sw === 0
                ? '0 0 22px rgba(98,178,119,0.35)'
                : '0 0 22px rgba(221,127,122,0.35)',
              letterSpacing: '0.02em',
              textAlign: 'center',
              lineHeight: 1.15,
              whiteSpace: 'nowrap',
            }}
          >
            {sw === 0 ? t.routeL : t.routeR}
          </div>
        </header>
        <p className="c3d-hint">{t.hint}</p>
        <div className="c3d-stats">
          <span>{t.wave} {wave}</span>
          <span>{t.docked} {docked}/{need}</span>
          <span>{t.lives} {lives}</span>
        </div>
      </div>

      {banner && (
        <div className={`c3d-banner c3d-banner--${banner === 'over' ? 'over' : banner}`}>
          {banner === 'go' && !bootError && (
            <>
              <span>{t.go}</span>
              <p className="c3d-banner-meta">{t.hint}</p>
              <button
                type="button"
                className="c3d-cta"
                onClick={() => {
                  playSfx?.('click');
                  setBanner(null);
                  apiRef.current.startWave(1);
                }}
              >
                {t.go}
              </button>
            </>
          )}
          {banner === 'clear' && (
            <>
              <span>{t.clear}</span>
              <button
                type="button"
                className="c3d-cta"
                onClick={() => { playSfx?.('click'); setBanner(null); apiRef.current.startWave(waveRef.current + 1); }}
              >
                {t.next}
              </button>
            </>
          )}
          {banner === 'over' && (
            <>
              <span>{t.over}</span>
              <div className="c3d-banner-actions">
                <button type="button" className="c3d-cta" onClick={() => { playSfx?.('click'); setBanner(null); apiRef.current.retry(); }}>
                  {t.retry}
                </button>
                <button type="button" className="c3d-cta c3d-cta--ghost" onClick={() => { playSfx?.('click'); onBack(); }}>
                  {t.hub}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
