import React, { useEffect, useRef, useState } from 'react';
import { bootC3dScene, matStd, disposeObject, THREE } from '../../../../shared/c3dBoot';
import C3dProtoChrome from '../../../../shared/C3dProtoChrome';
import { makeRng } from '../../../../shared/rng';
// SAME engine as the 2D game: real road-tree generator, wave escalation, palette.
import { generate, waveCfg, PAL } from './index';
import '../../../../shared/c3dProto.css';

/*
 * Car Park · 3D — the REAL 2D Survival as a TOP-DOWN spaceport.
 * Engine rules are the 2D game's, untouched: waveCfg escalation, best-of-8
 * generate() route tree, one distinct Okabe-Ito colour per docking bay, the
 * balanced colour bag + 3-ship preview queue, spawn gating (maxC, lead-busy),
 * ships flying at cps cells/sec that follow each junction's CURRENT switch,
 * wrong bay = −1 life (4 per run), wave-banner pause.
 *
 * Rendering: near-top-down deck view (a whisper of tilt keeps volume visible),
 * procedural spaceships (extruded hull silhouette, glass cockpit, twin
 * nacelles, flickering thrusters, banking into turns), energy lanes whose
 * light pulses FLOW along the live branch, holographic junction chevrons,
 * docking pads with sequenced landing lights, and a domed hangar station.
 */

const UI = {
  en: {
    title: 'Car Park · 3D',
    tag: 'prototype',
    hint: 'Tap ◯ junctions before ships arrive · dock each colour at its pad',
    wave: 'Wave',
    parked: 'Docked',
    over: 'Run over',
    overSub: (n, w) => `${n} docked · wave ${w}`,
    retry: 'Play again',
    hub: 'Back to modes',
    go: 'ENGAGE',
    waveBanner: (w) => `Wave ${w}`,
  },
  ar: {
    title: 'موقف السيارات · ثلاثي الأبعاد',
    tag: 'نموذج',
    hint: 'المس المفترقات ◯ قبل وصول السفن · أرسِ كل لون في منصته',
    wave: 'موجة',
    parked: 'رست',
    over: 'انتهت المحاولة',
    overSub: (n, w) => `${n} رست · موجة ${w}`,
    retry: 'العب مجددًا',
    hub: 'العودة للأوضاع',
    go: 'انطلق',
    waveBanner: (w) => `الموجة ${w}`,
  },
};

const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const hexInt = (h) => parseInt(String(h).replace('#', ''), 16);

const BOARD_HALF = 3.4; // world half-extent the route tree is fitted into
const LANE_LIT = 0x3d3524;
const LANE_IDLE = 0x1b1710;

/* ── Procedural spaceship ─────────────────────────────────────────────────
 * Built once as a template silhouette (nose +X), extruded so the top-down
 * read is crisp; per-ship colour applied to the hull material. Parts:
 * hull, glass cockpit, twin nacelles, thruster flames, under-glow halo.
 */
let shipHullGeo = null;
function hullGeometry() {
  if (shipHullGeo) return shipHullGeo;
  const s = new THREE.Shape();
  // Right half (y ≥ 0), nose at +X — mirrored for the left side.
  s.moveTo(0.52, 0);
  s.quadraticCurveTo(0.42, 0.1, 0.2, 0.13);      // nose → shoulder
  s.lineTo(0.06, 0.15);                           // body side
  s.lineTo(-0.12, 0.42);                          // wing leading edge
  s.lineTo(-0.26, 0.44);                          // wing tip
  s.lineTo(-0.2, 0.15);                           // wing trailing edge
  s.lineTo(-0.34, 0.13);                          // rear body
  s.lineTo(-0.46, 0.2);                           // tail fin
  s.lineTo(-0.4, 0.06);                           // tail notch
  s.lineTo(-0.4, -0.06);
  s.lineTo(-0.46, -0.2);
  s.lineTo(-0.34, -0.13);
  s.lineTo(-0.2, -0.15);
  s.lineTo(-0.26, -0.44);
  s.lineTo(-0.12, -0.42);
  s.lineTo(0.06, -0.15);
  s.lineTo(0.2, -0.13);
  s.quadraticCurveTo(0.42, -0.1, 0.52, 0);
  shipHullGeo = new THREE.ExtrudeGeometry(s, {
    depth: 0.09,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.03,
    bevelSegments: 2,
    curveSegments: 8,
  });
  return shipHullGeo;
}

export default function CarPark3DProto({ isAr, playSfx, onBack }) {
  const t = UI[isAr ? 'ar' : 'en'];
  const wrapRef = useRef(null);
  const apiRef = useRef({});
  const playSfxRef = useRef(playSfx);
  playSfxRef.current = playSfx;

  const [phase, setPhase] = useState('boot'); // boot | run | over
  const [wave, setWave] = useState(1);
  const [routed, setRouted] = useState(0);
  const [lives, setLives] = useState(waveCfg(1).lives);
  const [banner, setBanner] = useState('go');
  const [waveFlash, setWaveFlash] = useState(null);
  const [bootError, setBootError] = useState(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const boot = bootC3dScene(wrap, { fov: 52, fitHalf: 4.2, bloom: true });
    if (boot.error) {
      setBootError(isAr ? 'تعذّر تشغيل ثلاثي الأبعاد' : 'Could not start 3D');
      return () => boot.dispose();
    }
    const { camera, playRoot, coarse, setTick, setFitHalf, renderer, dispose } = boot;

    const rng = makeRng((Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0);
    const waveFlashOn = { current: false };

    // ── Engine state (mirrors the 2D g object) ──
    const g = {
      root: null, all: [], forks: [], stations: [], bayColors: [], colorBag: [],
      trains: [], queue: [], spawnAcc: -1400, spawnEvery: 2100, maxC: 1, cps: 0.7,
      cell: 0.6, routed: 0, wrong: 0, lives: waveCfg(1).lives,
      wave: 1, waveCars: 0, waveSpawned: 0, waveResolved: 0,
      bannerT: 0, finished: true,
    };

    // ── World: near-top-down deck (slight tilt keeps domes/ships volumetric) ──
    const worldGroup = new THREE.Group();
    worldGroup.rotation.x = -0.26; // ≈15° — reads top-down, still 3D
    playRoot.add(worldGroup);
    const netGroup = new THREE.Group();
    const carGroup = new THREE.Group();
    const queueGroup = new THREE.Group();
    worldGroup.add(netGroup, carGroup, queueGroup);

    // Station deck: dark disc with a faint engraved grid, fading at the rim.
    const gndCanvas = document.createElement('canvas');
    gndCanvas.width = 512;
    gndCanvas.height = 512;
    const gctx = gndCanvas.getContext('2d');
    const grad = gctx.createRadialGradient(256, 256, 40, 256, 256, 256);
    grad.addColorStop(0, 'rgba(30,24,15,0.97)');
    grad.addColorStop(0.7, 'rgba(22,17,10,0.9)');
    grad.addColorStop(1, 'rgba(22,17,10,0)');
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 512, 512);
    gctx.strokeStyle = 'rgba(232,172,78,0.07)';
    gctx.lineWidth = 1;
    for (let i = 1; i < 12; i++) {
      const p = (i / 12) * 512;
      gctx.beginPath(); gctx.moveTo(p, 0); gctx.lineTo(p, 512); gctx.stroke();
      gctx.beginPath(); gctx.moveTo(0, p); gctx.lineTo(512, p); gctx.stroke();
    }
    gctx.strokeStyle = 'rgba(232,172,78,0.16)';
    gctx.lineWidth = 2;
    gctx.beginPath();
    gctx.arc(256, 256, 236, 0, Math.PI * 2);
    gctx.stroke();
    const gndTex = new THREE.CanvasTexture(gndCanvas);
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(BOARD_HALF * 1.5, 48),
      new THREE.MeshBasicMaterial({ map: gndTex, transparent: true, depthWrite: false }),
    );
    ground.position.z = -0.14;
    worldGroup.add(ground);

    let forkMeshes = [];
    let edgeMeshes = []; // { mesh, under, dashes, ax, ay, dx, dy, parent, childIdx }
    let bayMeshes = [];
    let padLights = []; // sequenced landing lights

    const clearGroup = (grp) => {
      while (grp.children.length) {
        const c = grp.children[0];
        grp.remove(c);
        disposeObject(c);
      }
    };
    const clearNet = () => {
      clearGroup(netGroup);
      clearGroup(carGroup);
      clearGroup(queueGroup);
      forkMeshes = [];
      edgeMeshes = [];
      bayMeshes = [];
      padLights = [];
    };

    const shuffleArr = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    const drawColor = () => {
      if (!g.colorBag || g.colorBag.length === 0) g.colorBag = shuffleArr([...(g.bayColors || [])]);
      return g.colorBag.pop();
    };

    // Fit the tree's actual bounding box into the world board (the 2D layout()).
    const layoutWorld = () => {
      let minR = Infinity; let maxR = -Infinity; let minC = Infinity; let maxC = -Infinity;
      for (const n of g.all) {
        if (n.r < minR) minR = n.r; if (n.r > maxR) maxR = n.r;
        if (n.c < minC) minC = n.c; if (n.c > maxC) maxC = n.c;
      }
      const usedC = Math.max(1, maxC - minC + 1);
      const usedR = Math.max(1, maxR - minR + 1);
      const cellW = (BOARD_HALF * 2) / usedC;
      const cellH = (BOARD_HALF * 2) / usedR;
      g.cell = Math.min(cellW, cellH, 1.1);
      for (const n of g.all) {
        n.x = -BOARD_HALF + (n.c - minC + 0.5) * cellW;
        n.y = BOARD_HALF - (n.r - minR + 0.5) * cellH;
      }
    };

    const edgeActive = (parent, idx) => parent.children.length < 2 || idx === parent.sw;

    const syncEdges = () => {
      for (const e of edgeMeshes) {
        const on = edgeActive(e.parent, e.childIdx);
        e.mesh.material.color.setHex(on ? LANE_LIT : LANE_IDLE);
        e.mesh.material.emissive.setHex(on ? 0xe8ac4e : 0x000000);
        e.mesh.material.emissiveIntensity = on ? 0.16 : 0;
        e.on = on;
        for (const d of e.dashes) d.visible = on;
      }
      // Point each junction's chevron down its LIVE branch.
      for (const ring of forkMeshes) {
        const f = ring.userData.fork;
        const child = f.children[f.sw] || f.children[0];
        if (child) {
          ring.userData.chevTarget = Math.atan2(child.y - f.y, child.x - f.x) - Math.PI / 2;
        }
      }
    };

    /* ── Ship builder — colour-coded hull, cockpit, nacelles, thrusters ── */
    const buildShip = (colHex, scale = 1) => {
      const grp = new THREE.Group();
      const S = g.cell * 0.62 * scale;
      const col = hexInt(colHex);

      const hull = new THREE.Mesh(
        hullGeometry(),
        matStd(col, { emissiveIntensity: 0.4, metalness: 0.5, roughness: 0.3 }),
      );
      hull.scale.setScalar(S);
      hull.position.z = 0.05;
      grp.add(hull);

      // Cream dorsal stripe down the spine.
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(S * 0.66, S * 0.05, 0.012),
        matStd(0xf0e2c0, { emissive: 0xf0e2c0, emissiveIntensity: 0.4, metalness: 0.3, roughness: 0.4 }),
      );
      stripe.position.set(S * 0.02, 0, S * 0.14 + 0.05);
      grp.add(stripe);

      // Glass cockpit.
      const cockpit = new THREE.Mesh(
        new THREE.SphereGeometry(S * 0.13, 14, 10),
        matStd(0x0e1a22, { emissive: 0x6bb3c8, emissiveIntensity: 0.5, metalness: 0.7, roughness: 0.15 }),
      );
      cockpit.scale.set(1.7, 1, 0.62);
      cockpit.position.set(S * 0.18, 0, S * 0.15 + 0.05);
      grp.add(cockpit);

      // Twin engine nacelles + flickering thruster flames.
      const thrusters = [];
      for (const side of [-1, 1]) {
        const nac = new THREE.Mesh(
          new THREE.CylinderGeometry(S * 0.055, S * 0.075, S * 0.3, 10),
          matStd(0x2a241a, { emissive: 0xe8ac4e, emissiveIntensity: 0.15, metalness: 0.6, roughness: 0.35 }),
        );
        nac.rotation.z = Math.PI / 2;
        nac.position.set(-S * 0.28, side * S * 0.19, S * 0.08 + 0.05);
        grp.add(nac);
        const flame = new THREE.Mesh(
          new THREE.ConeGeometry(S * 0.055, S * 0.3, 8),
          new THREE.MeshBasicMaterial({
            color: 0xffd27a,
            transparent: true,
            opacity: 0.85,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        );
        flame.rotation.z = Math.PI / 2;
        flame.position.set(-S * 0.5, side * S * 0.19, S * 0.08 + 0.05);
        grp.add(flame);
        thrusters.push(flame);
      }

      // Under-glow halo in the ship's colour.
      const halo = new THREE.Mesh(
        new THREE.CircleGeometry(S * 0.55, 20),
        new THREE.MeshBasicMaterial({
          color: col,
          transparent: true,
          opacity: 0.2,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      halo.position.z = 0.012;
      grp.add(halo);

      grp.userData.thrusters = thrusters;
      grp.userData.roll = 0;
      grp.userData.lastAng = null;
      return grp;
    };

    const carMeshFor = (colHex) => {
      const grp = buildShip(colHex);
      grp.position.z = 0.06;
      carGroup.add(grp);
      return grp;
    };

    // The launch queue: three mini ships waiting beside the hangar.
    const syncQueue = () => {
      clearGroup(queueGroup);
      const r = g.root;
      if (!r) return;
      const side = r.x > 0 ? -1 : 1;
      g.queue.forEach((colHex, i) => {
        const mini = buildShip(colHex, 0.55);
        mini.position.set(r.x + (i + 1) * g.cell * 0.44 * side, r.y + g.cell * 0.52, 0.05);
        mini.rotation.z = side > 0 ? 0 : Math.PI;
        queueGroup.add(mini);
      });
    };

    /* ── Static scenery: lanes, junctions, docking pads, hangar ── */
    const buildNetMeshes = () => {
      clearNet();
      const laneW = Math.max(0.1, g.cell * 0.26);

      for (const n of g.all) {
        n.children.forEach((c, i) => {
          const dx = c.x - n.x;
          const dy = c.y - n.y;
          const len = Math.max(0.001, Math.hypot(dx, dy));
          const ang = Math.atan2(dy, dx);
          const mx = (n.x + c.x) / 2;
          const my = (n.y + c.y) / 2;
          // Lane channel (dark groove) + lit surface.
          const under = new THREE.Mesh(
            new THREE.BoxGeometry(len + laneW, laneW * 1.7, 0.04),
            matStd(0x0e0b06, { metalness: 0.1, roughness: 0.95 }),
          );
          under.position.set(mx, my, -0.1);
          under.rotation.z = ang;
          netGroup.add(under);
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(len + laneW * 0.5, laneW, 0.05),
            matStd(LANE_LIT, { emissiveIntensity: 0.16, metalness: 0.2, roughness: 0.7 }),
          );
          mesh.position.set(mx, my, -0.06);
          mesh.rotation.z = ang;
          netGroup.add(mesh);
          // Flowing light pulses (animated along the live branch in tick()).
          const dashes = [];
          const dashN = Math.max(2, Math.round(len / (g.cell * 0.5)));
          for (let k = 0; k < dashN; k++) {
            const dash = new THREE.Mesh(
              new THREE.SphereGeometry(laneW * 0.17, 8, 6),
              new THREE.MeshBasicMaterial({
                color: 0xffe9a8,
                transparent: true,
                opacity: 0.9,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
              }),
            );
            dash.userData.k = k;
            dash.position.set(n.x + dx * ((k + 0.5) / dashN), n.y + dy * ((k + 0.5) / dashN), -0.01);
            netGroup.add(dash);
            dashes.push(dash);
          }
          edgeMeshes.push({ mesh, under, dashes, ax: n.x, ay: n.y, dx, dy, dashN, parent: n, childIdx: i, on: true });
        });
      }

      // Hangar station: hex pad + dome + gold trim ring + launch mouth.
      const hangar = new THREE.Group();
      const hw = g.cell * 0.5;
      const hexPad = new THREE.Mesh(
        new THREE.CylinderGeometry(hw * 1.15, hw * 1.25, 0.1, 6),
        matStd(0x241b10, { emissive: 0xe8ac4e, emissiveIntensity: 0.06, metalness: 0.35, roughness: 0.6 }),
      );
      hexPad.rotation.x = Math.PI / 2;
      hexPad.position.z = 0.03;
      hangar.add(hexPad);
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(hw * 0.85, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        matStd(0x39281a, { emissive: 0xe8ac4e, emissiveIntensity: 0.1, metalness: 0.4, roughness: 0.4 }),
      );
      dome.rotation.x = Math.PI / 2;
      dome.position.z = 0.08;
      hangar.add(dome);
      const trim = new THREE.Mesh(
        new THREE.TorusGeometry(hw * 0.86, hw * 0.05, 8, 24),
        matStd(0xe8ac4e, { emissive: 0xe8ac4e, emissiveIntensity: 0.6, metalness: 0.4, roughness: 0.3 }),
      );
      trim.position.z = 0.1;
      hangar.add(trim);
      const exit = g.root.children[0];
      const exitAng = exit ? Math.atan2(exit.y - g.root.y, exit.x - g.root.x) : 0;
      const mouth = new THREE.Mesh(
        new THREE.BoxGeometry(hw * 0.7, hw * 0.34, 0.08),
        new THREE.MeshBasicMaterial({ color: 0x050403 }),
      );
      mouth.position.set(Math.cos(exitAng) * hw * 0.8, Math.sin(exitAng) * hw * 0.8, 0.1);
      mouth.rotation.z = exitAng;
      hangar.add(mouth);
      hangar.position.set(g.root.x, g.root.y, 0);
      netGroup.add(hangar);

      // Docking pads: colour ring + inner disc + sequenced landing lights + beacon.
      g.stations.forEach((s, si) => {
        const col = hexInt(s.colorHex);
        const padDisc = new THREE.Mesh(
          new THREE.CylinderGeometry(g.cell * 0.34, g.cell * 0.38, 0.06, 24),
          matStd(0x14100a, { emissive: col, emissiveIntensity: 0.1, metalness: 0.25, roughness: 0.7 }),
        );
        padDisc.rotation.x = Math.PI / 2;
        padDisc.position.set(s.x, s.y, -0.03);
        netGroup.add(padDisc);
        const bay = new THREE.Mesh(
          new THREE.TorusGeometry(g.cell * 0.3, g.cell * 0.055, 10, 26),
          matStd(col, { emissive: col, emissiveIntensity: 0.55, metalness: 0.3, roughness: 0.4 }),
        );
        bay.position.set(s.x, s.y, 0.03);
        bay.userData.flash = 0;
        bay.userData.node = s;
        bay.userData.baseColor = col;
        netGroup.add(bay);
        bayMeshes.push(bay);
        // Four landing lights chasing around the ring.
        for (let li = 0; li < 4; li++) {
          const dot = new THREE.Mesh(
            new THREE.SphereGeometry(g.cell * 0.045, 8, 6),
            new THREE.MeshBasicMaterial({
              color: col,
              transparent: true,
              opacity: 0.9,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            }),
          );
          dot.userData.cx = s.x;
          dot.userData.cy = s.y;
          dot.userData.r = g.cell * 0.3;
          dot.userData.phase = (li / 4) * Math.PI * 2 + si * 0.9;
          dot.position.set(s.x, s.y, 0.05);
          netGroup.add(dot);
          padLights.push(dot);
        }
        // Beacon column.
        const beacon = new THREE.Mesh(
          new THREE.CylinderGeometry(g.cell * 0.08, g.cell * 0.14, g.cell * 0.8, 12, 1, true),
          new THREE.MeshBasicMaterial({
            color: col,
            transparent: true,
            opacity: 0.18,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
        );
        beacon.rotation.x = Math.PI / 2;
        beacon.position.set(s.x, s.y, g.cell * 0.4);
        beacon.userData.isBeacon = true;
        netGroup.add(beacon);
      });

      // Junctions: holo pad + gold ring + chevron pointing down the live branch.
      for (const f of g.forks) {
        const jpad = new THREE.Mesh(
          new THREE.CylinderGeometry(g.cell * 0.3, g.cell * 0.34, 0.05, 22),
          matStd(0x1c150c, { emissive: 0xe8ac4e, emissiveIntensity: 0.08, metalness: 0.25, roughness: 0.7 }),
        );
        jpad.rotation.x = Math.PI / 2;
        jpad.position.set(f.x, f.y, -0.04);
        netGroup.add(jpad);
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(g.cell * 0.24, g.cell * 0.055, 10, 24),
          matStd(0xe8ac4e, { emissive: 0xe8ac4e, emissiveIntensity: 0.55, metalness: 0.35, roughness: 0.35 }),
        );
        ring.position.set(f.x, f.y, 0.05);
        const chevron = new THREE.Mesh(
          new THREE.ConeGeometry(g.cell * 0.1, g.cell * 0.24, 4),
          matStd(0xfff2c8, { emissive: 0xffec96, emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.3 }),
        );
        chevron.position.set(f.x, f.y, 0.12);
        netGroup.add(chevron);
        ring.userData.fork = f;
        ring.userData.pulse = 0;
        ring.userData.chevron = chevron;
        ring.userData.chevTarget = 0;
        netGroup.add(ring);
        forkMeshes.push(ring);
      }
      syncEdges();
      syncQueue();
      setFitHalf(BOARD_HALF + 0.8);
    };

    // Build / rebuild the road network (2D installNet, same rules verbatim).
    const installNet = (c) => {
      const want = clampN(c.colors, 2, PAL.length);
      const desired = Math.max(1, want - 1);
      const score = (net) => Math.abs(net.stations.length - want) * 1000 - net.all.length;
      let best = generate(c.R, c.C, desired, rng, want);
      for (let tries = 0; tries < 7; tries++) {
        const alt = generate(c.R, c.C, desired, rng, want);
        if (score(alt) < score(best)) best = alt;
      }
      g.root = best.root; g.all = best.all; g.forks = best.forks; g.stations = best.stations;
      const palette = shuffleArr(PAL.slice(0, want));
      g.stations.forEach((s, i) => { s.colorHex = palette[i % palette.length]; });
      g.bayColors = [...new Set(g.stations.map((s) => s.colorHex))];
      g.colorBag = [];
      g.maxC = c.maxC; g.cps = c.cps; g.spawnEvery = c.spawn;
      g.trains = []; g.spawnAcc = -1400;
      g.queue = [drawColor(), drawColor(), drawColor()];
      layoutWorld();
      buildNetMeshes();
    };

    const finishRun = () => {
      g.finished = true;
      setPhase('over');
      setBanner('over');
      playSfxRef.current?.('error');
    };

    const flashBay = (node, ok) => {
      const bay = bayMeshes.find((b) => b.userData.node === node);
      if (bay) { bay.userData.flash = 0.8; bay.userData.flashHex = ok ? 0x62b277 : 0xdd7f7a; }
    };

    /* ── Frame loop: the 2D frame() rules translated to world units ── */
    setTick((dt, now) => {
      // Junction rings, chevrons, pad lights, beacons.
      for (const ring of forkMeshes) {
        if (ring.userData.pulse > 0) {
          ring.userData.pulse = Math.max(0, ring.userData.pulse - dt);
          ring.scale.setScalar(1 + ring.userData.pulse * 0.7);
        } else ring.scale.setScalar(1);
        const ch = ring.userData.chevron;
        if (ch) {
          let diff = ring.userData.chevTarget - ch.rotation.z;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          ch.rotation.z += diff * Math.min(1, dt * 10);
        }
      }
      for (const dot of padLights) {
        const a = dot.userData.phase + now * 0.0024;
        dot.position.x = dot.userData.cx + Math.cos(a) * dot.userData.r;
        dot.position.y = dot.userData.cy + Math.sin(a) * dot.userData.r;
        dot.material.opacity = 0.45 + Math.sin(a * 2) * 0.35;
      }
      for (const c of netGroup.children) {
        if (c.userData.isBeacon) c.material.opacity = 0.13 + Math.sin(now * 0.0022 + c.position.x * 2) * 0.07;
      }
      for (const bay of bayMeshes) {
        if (bay.userData.flash > 0) {
          bay.userData.flash = Math.max(0, bay.userData.flash - dt);
          bay.material.emissive.setHex(bay.userData.flashHex || 0x62b277);
          bay.material.emissiveIntensity = 0.55 + bay.userData.flash;
        } else {
          bay.material.emissive.setHex(bay.userData.baseColor);
          bay.material.emissiveIntensity = 0.55;
        }
      }
      // Energy pulses FLOW along live lanes (direction of travel).
      for (const e of edgeMeshes) {
        if (!e.on) continue;
        for (const d of e.dashes) {
          const tt = ((d.userData.k + 0.5) / e.dashN + now * 0.00035) % 1;
          d.position.x = e.ax + e.dx * tt;
          d.position.y = e.ay + e.dy * tt;
          d.material.opacity = 0.35 + Math.sin(tt * Math.PI) * 0.55;
        }
      }
      // Ship idle animation (thruster flicker + banking decay) for all ships.
      const animShip = (grp, movingAng) => {
        for (const fl of grp.userData.thrusters) {
          fl.scale.y = 0.75 + Math.sin(now * 0.02 + fl.position.y * 9) * 0.25 + Math.random() * 0.12;
          fl.material.opacity = 0.6 + Math.random() * 0.3;
        }
        if (movingAng != null) {
          const last = grp.userData.lastAng;
          if (last != null) {
            let dAng = movingAng - last;
            dAng = Math.atan2(Math.sin(dAng), Math.cos(dAng));
            grp.userData.roll = clampN(grp.userData.roll + dAng * 1.6, -0.55, 0.55);
          }
          grp.userData.lastAng = movingAng;
        }
        grp.userData.roll *= Math.max(0, 1 - dt * 4);
        grp.rotation.x = grp.userData.roll;
      };
      for (const mini of queueGroup.children) animShip(mini, null);

      if (g.finished) return;
      if (g.bannerT > 0) {
        g.bannerT -= dt;
        if (g.bannerT <= 0 && waveFlashOn.current) {
          waveFlashOn.current = false;
          setWaveFlash(null);
        }
      }

      const speed = g.cps * g.cell; // world units/s — cps cells/sec, same as 2D

      // spawn (same gates: banner pause, wave budget, concurrency cap, lead busy)
      g.spawnAcc += dt * 1000;
      const leadBusy = g.trains.some((tr) => tr.from === g.root && tr.t < 0.5);
      const waveBudgetOk = g.waveSpawned < g.waveCars;
      if (g.bannerT <= 0 && g.spawnAcc >= g.spawnEvery && waveBudgetOk && g.trains.length < g.maxC && !leadBusy) {
        g.spawnAcc = 0;
        g.waveSpawned += 1;
        const target = g.queue.shift();
        g.queue.push(drawColor());
        syncQueue();
        g.trains.push({ from: g.root, to: g.root.children[0], t: 0, target, mesh: carMeshFor(target) });
      }

      const remaining = [];
      for (const tr of g.trains) {
        const len = Math.max(0.001, Math.hypot(tr.to.x - tr.from.x, tr.to.y - tr.from.y));
        tr.t += (speed * dt) / len;
        if (tr.t >= 1) {
          const at = tr.to;
          if (at.kind === 'station' || at.children.length === 0) {
            if (at.colorHex === tr.target) {
              g.routed += 1;
              setRouted(g.routed);
              playSfxRef.current?.('collect');
              flashBay(at, true);
            } else {
              g.wrong += 1;
              g.lives -= 1;
              setLives(g.lives);
              playSfxRef.current?.('error');
              flashBay(at, false);
            }
            g.waveResolved += 1;
            carGroup.remove(tr.mesh);
            disposeObject(tr.mesh);
            if (g.lives <= 0) { finishRun(); return; }
            continue;
          }
          tr.from = at;
          tr.to = at.children.length === 2 ? at.children[at.sw] : at.children[0];
          tr.t = 0;
        }
        const ang = Math.atan2(tr.to.y - tr.from.y, tr.to.x - tr.from.x);
        tr.mesh.position.x = tr.from.x + (tr.to.x - tr.from.x) * Math.min(1, tr.t);
        tr.mesh.position.y = tr.from.y + (tr.to.y - tr.from.y) * Math.min(1, tr.t);
        tr.mesh.rotation.z = ang;
        animShip(tr.mesh, ang);
        remaining.push(tr);
      }
      g.trains = remaining;

      // Wave complete → escalate with a FRESH, strictly harder board (2D rule).
      if (g.waveResolved >= g.waveCars && g.trains.length === 0 && g.bannerT <= 0) {
        g.wave += 1;
        const wc = waveCfg(g.wave);
        g.waveCars = wc.cars;
        g.waveSpawned = 0;
        g.waveResolved = 0;
        installNet(wc);
        g.bannerT = 1.6;
        waveFlashOn.current = true;
        setWave(g.wave);
        setWaveFlash(t.waveBanner(g.wave));
        playSfxRef.current?.('win');
      }
    });

    // ── Pointer: toggle the nearest junction (same generous slop as 2D) ──
    const raycaster = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    const tmp = new THREE.Vector3();
    const el = renderer.domElement;
    const onDown = (e) => {
      if (g.finished) return;
      const rect = el.getBoundingClientRect();
      ptr.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ptr.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ptr, camera);
      let fork = null;
      const hits = raycaster.intersectObjects(forkMeshes, false);
      if (hits.length) fork = hits[0].object;
      if (!fork) {
        let bestD = coarse ? 0.16 : 0.1;
        for (const ring of forkMeshes) {
          ring.getWorldPosition(tmp).project(camera);
          const d = Math.hypot(tmp.x - ptr.x, tmp.y - ptr.y);
          if (d < bestD) { bestD = d; fork = ring; }
        }
      }
      if (fork) {
        const f = fork.userData.fork;
        f.sw = f.sw ? 0 : 1;
        fork.userData.pulse = 0.35;
        syncEdges();
        playSfxRef.current?.('click');
      }
    };
    el.addEventListener('pointerdown', onDown);

    apiRef.current = {
      start: () => {
        g.finished = false;
        g.wave = 1;
        const wc = waveCfg(1);
        g.lives = wc.lives;
        g.routed = 0;
        g.wrong = 0;
        g.waveCars = wc.cars;
        g.waveSpawned = 0;
        g.waveResolved = 0;
        g.bannerT = 0;
        setWave(1);
        setRouted(0);
        setLives(wc.lives);
        setPhase('run');
        setBanner(null);
        setWaveFlash(null);
        installNet(wc);
      },
      stop: () => { g.finished = true; },
    };

    return () => {
      g.finished = true;
      el.removeEventListener('pointerdown', onDown);
      clearNet();
      disposeObject(ground);
      gndTex.dispose();
      playRoot.remove(worldGroup);
      dispose();
      apiRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAr]);

  useEffect(() => {
    const id = requestAnimationFrame(() => { playSfx?.('click'); apiRef.current.start?.(); });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = phase === 'boot' ? [] : [
    `${t.wave} ${wave}`,
    `${t.parked} ${routed}`,
    `${'♥'.repeat(Math.max(0, lives))}`,
  ];

  return (
    <C3dProtoChrome
      isAr={isAr}
      title={t.title}
      tag={t.tag}
      hint={t.hint}
      chip={waveFlash || `${t.wave} ${wave}`}
      chipStyle={{ fontSize: '0.75rem', fontWeight: 800, color: '#e8ac4e' }}
      stats={stats}
      banner={banner === 'go' ? t.go : banner === 'over' ? t.over : waveFlash}
      bannerOver={banner === 'over'}
      bannerMeta={banner === 'over' ? t.overSub(routed, wave) : null}
      bootError={bootError}
      onBack={onBack}
      playSfx={playSfx}
      canvasRef={wrapRef}
      bannerActions={
        banner === 'over' ? (
          <div className="c3d-banner-actions">
            <button type="button" className="c3d-cta" onClick={() => { playSfx?.('click'); apiRef.current.start?.(); }}>{t.retry}</button>
            <button type="button" className="c3d-cta c3d-cta--ghost" onClick={() => { playSfx?.('click'); onBack(); }}>{t.hub}</button>
          </div>
        ) : null
      }
    />
  );
}
