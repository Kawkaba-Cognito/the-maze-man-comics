import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { createKit } from './worldKit';
import { buildCharacter } from './characters3d';

/**
 * The 3D world — a comic-styled night town, 100% code-built (no model or
 * texture files; see worldKit.js). You roam as your chosen character
 * (fox / man / woman) with the shop gear you equipped.
 *
 * Look: procedural night sky + gold moon, ACES tone mapping, glow layer,
 * fog, rim-lit characters. Feel: acceleration, camera damping, footstep
 * dust, coin bursts, wandering critters, chimney smoke, fireflies.
 */
export default function MazeOverlay() {
  const { exitMaze, updateXP, playSfx, currentLang, toggleLang, points, character, equipped } = useApp();
  const [showSettings, setShowSettings] = useState(false);
  const isAr = currentLang === 'ar';
  const canvasRef = useRef(null);
  const joyCanvasRef = useRef(null);
  const joyWrapRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);

  function handleExitToHub() {
    playSfx('click');
    exitMaze();
  }

  useEffect(() => {
    if (typeof window.BABYLON === 'undefined') return undefined;
    const BABYLON = window.BABYLON;
    const canvas3D = canvasRef.current;
    if (!canvas3D) return undefined;

    let engine;
    const WORLD = 300; // open ground size
    const isSmall = Math.min(window.innerWidth, window.innerHeight) < 700; // budget for phones
    const inputMap = {};
    let joyInput = { x: 0, z: 0 };
    let targetPosition = null;
    let isPointerDown = false;
    let coins = [];

    try {
      engine = new BABYLON.Engine(canvas3D, true, { antialias: true });
      engineRef.current = engine;

      const createScene = function () {
        const s = new BABYLON.Scene(engine);
        s.clearColor = new BABYLON.Color4(0.01, 0.01, 0.02, 1);
        s.collisionsEnabled = true;

        const kit = createKit(BABYLON, s);

        // ── Camera: top-down follow with damping ──
        const camera = new BABYLON.ArcRotateCamera('camera', -Math.PI / 2, 0.95, 26, BABYLON.Vector3.Zero(), s);
        camera.attachControl(canvas3D, true);
        camera.lowerRadiusLimit = 14;
        camera.upperRadiusLimit = 70;
        camera.lowerBetaLimit = 0.15;
        camera.upperBetaLimit = Math.PI / 2.3;

        // ── Lighting: cool moonlight + warm purple bounce ──
        const ambientLight = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), s);
        ambientLight.intensity = 0.8;
        ambientLight.diffuse = new BABYLON.Color3(0.62, 0.66, 0.85);
        ambientLight.groundColor = new BABYLON.Color3(0.32, 0.24, 0.36);
        const dirLight = new BABYLON.DirectionalLight('moon', new BABYLON.Vector3(-1, -2, 1), s);
        dirLight.intensity = 1.35;
        dirLight.diffuse = new BABYLON.Color3(0.95, 0.9, 0.8);
        dirLight.position = new BABYLON.Vector3(0, 60, 0);
        const shadowGenerator = new BABYLON.ShadowGenerator(isSmall ? 1024 : 2048, dirLight);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurKernel = 24;
        shadowGenerator.setDarkness(0.35);

        // ── Post-processing: ACES tone mapping, FXAA, bloom, vignette ──
        const pipeline = new BABYLON.DefaultRenderingPipeline('pipeline', true, s, [camera]);
        pipeline.fxaaEnabled = true;
        pipeline.bloomEnabled = true;
        pipeline.bloomThreshold = 0.6;
        pipeline.bloomWeight = 0.45;
        pipeline.imageProcessingEnabled = true;
        pipeline.imageProcessing.toneMappingEnabled = true;
        pipeline.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;
        pipeline.imageProcessing.exposure = 1.5;
        pipeline.imageProcessing.contrast = 1.1;
        pipeline.imageProcessing.vignetteEnabled = true;
        pipeline.imageProcessing.vignetteWeight = 1.2;
        pipeline.imageProcessing.vignetteColor = new BABYLON.Color4(0.04, 0.02, 0.1, 0);

        // ── Sky + atmosphere (all procedural — no CDN textures) ──
        const dome = kit.skyDome();
        dome.applyFog = false;
        kit.starDust();
        s.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        s.fogDensity = 0.0045;
        s.fogColor = new BABYLON.Color3(0.1, 0.07, 0.16);

        // ── Ground: night meadow ──
        const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: WORLD, height: WORLD }, s);
        const groundMat = new BABYLON.StandardMaterial('grassMat', s);
        const grassTex = kit.grassTexture();
        grassTex.uScale = 26; grassTex.vScale = 26;
        groundMat.diffuseTexture = grassTex;
        groundMat.specularColor = new BABYLON.Color3(0.02, 0.03, 0.02);
        ground.material = groundMat;
        ground.receiveShadows = true;
        ground.checkCollisions = true;

        // ── Town palette ──
        const BORDER = 58; // playable half-size (≈116×116 enclosed)
        const matStone = kit.toonMat('stone', 0.52, 0.47, 0.55);
        const matWall = kit.toonMat('houseWall', 0.82, 0.74, 0.58);
        const matRoof = kit.toonMat('houseRoof', 0.5, 0.16, 0.13);
        const matDark = kit.toonMat('dark', 0.13, 0.13, 0.16, { rim: [0.3, 0.22, 0.08] });
        const matTrim = kit.toonMat('trim', 0.85, 0.65, 0.18, { emis: [0.3, 0.22, 0.05], spec: 0.5 });
        const matWin = kit.toonMat('win', 1, 0.82, 0.4, { emis: [0.9, 0.6, 0.25] });
        const matTrunk = kit.toonMat('trunk', 0.3, 0.2, 0.12);
        const matLeaf = kit.toonMat('leaf', 0.14, 0.34, 0.18);
        const matPine = kit.toonMat('pine', 0.1, 0.27, 0.17);

        // ── Roads: cobblestone cross + spur + central plaza ──
        // (a fresh DynamicTexture per road: clone() doesn't copy canvas content)
        const mkRoad = (x, z, w, d) => {
          const r = BABYLON.MeshBuilder.CreateBox('road', { width: w, height: 0.15, depth: d }, s);
          r.position.set(x, 0.08, z);
          const m = new BABYLON.StandardMaterial('roadMat', s);
          const t = kit.roadTexture();
          t.uScale = Math.max(1, w / 5); t.vScale = Math.max(1, d / 5);
          m.diffuseTexture = t;
          m.specularColor = new BABYLON.Color3(0.03, 0.03, 0.04);
          r.material = m;
          r.receiveShadows = true;
        };
        mkRoad(0, 0, 7, BORDER * 2);   // north–south
        mkRoad(0, 0, BORDER * 2, 7);   // east–west
        mkRoad(-7, -34, 14, 4);        // spur to the fox's house
        const plaza = BABYLON.MeshBuilder.CreateCylinder('plaza', { diameter: 24, height: 0.18, tessellation: 48 }, s);
        plaza.position.y = 0.09;
        const plazaMat = new BABYLON.StandardMaterial('plazaMat', s);
        const plazaTex = kit.roadTexture();
        plazaTex.uScale = 5; plazaTex.vScale = 5;
        plazaMat.diffuseTexture = plazaTex;
        plazaMat.specularColor = new BABYLON.Color3(0.03, 0.03, 0.04);
        plaza.material = plazaMat;
        plaza.receiveShadows = true;

        // ── Plaza centerpiece: gold fox statue on a pedestal ──
        const pedestal = BABYLON.MeshBuilder.CreateCylinder('pedestal', { diameterTop: 2.6, diameterBottom: 3.4, height: 1.4, tessellation: 24 }, s);
        pedestal.position.set(0, 0.7, 0);
        pedestal.material = matStone;
        pedestal.checkCollisions = true;
        shadowGenerator.addShadowCaster(pedestal);
        const ring = BABYLON.MeshBuilder.CreateTorus('pedRing', { diameter: 2.7, thickness: 0.14, tessellation: 24 }, s);
        ring.position.set(0, 1.38, 0);
        ring.material = matTrim;
        {
          const statueMat = kit.toonMat('statue', 0.85, 0.65, 0.18, { emis: [0.28, 0.2, 0.04], spec: 0.6 });
          const parts = [];
          const sp = (d, x, y, z, sx = 1, sy = 1, sz = 1) => {
            const m = BABYLON.MeshBuilder.CreateSphere('stp', { diameter: d, segments: 10 }, s);
            m.position.set(x, y, z); m.scaling.set(sx, sy, sz);
            parts.push(m);
            return m;
          };
          sp(1.3, 0, 2.2, 0, 1, 1.25, 0.95);          // seated body
          sp(0.85, 0, 3.25, 0.18);                     // head
          for (let i = 0; i < 6; i++) sp(0.7 - i * 0.09, 0, 1.65 + i * 0.28, -0.65 - i * 0.12); // tail curl
          const statue = BABYLON.Mesh.MergeMeshes(parts, true, true);
          statue.material = statueMat;
          shadowGenerator.addShadowCaster(statue);
          kit.glow(statue);
          [[-0.26, 1], [0.26, -1]].forEach(([ex, sgn]) => {
            const ear = BABYLON.MeshBuilder.CreateCylinder('stEar', { diameterTop: 0, diameterBottom: 0.36, height: 0.55, tessellation: 6 }, s);
            ear.position.set(ex, 3.75, 0.1); ear.rotation.z = sgn * -0.15; ear.material = statueMat;
          });
        }

        // ── Border wall (entrance gap on the front) + glowing corner posts ──
        const BH = 2.8;
        const mkWall = (x, z, w, d) => {
          const wall = BABYLON.MeshBuilder.CreateBox('border', { width: w, height: BH, depth: d }, s);
          wall.position = new BABYLON.Vector3(x, BH / 2, z);
          wall.material = matStone;
          wall.checkCollisions = true;
          wall.receiveShadows = true;
          shadowGenerator.addShadowCaster(wall);
        };
        mkWall(0, BORDER, BORDER * 2, 1.2);          // back
        mkWall(-BORDER, 0, 1.2, BORDER * 2);          // left
        mkWall(BORDER, 0, 1.2, BORDER * 2);           // right
        const seg = BORDER - 6;                       // front split (12-wide gate)
        mkWall(-(6 + seg / 2), -BORDER, seg, 1.2);
        mkWall(6 + seg / 2, -BORDER, seg, 1.2);
        [[-BORDER, -BORDER], [BORDER, -BORDER], [-BORDER, BORDER], [BORDER, BORDER], [-6, -BORDER], [6, -BORDER]].forEach(([x, z]) => {
          const post = BABYLON.MeshBuilder.CreateBox('post', { width: 1.8, height: 4, depth: 1.8 }, s);
          post.position.set(x, 2, z); post.material = matDark; post.checkCollisions = true;
          shadowGenerator.addShadowCaster(post);
          const cap = BABYLON.MeshBuilder.CreateSphere('cap', { diameter: 0.9 }, s);
          cap.position.set(x, 4.4, z); cap.material = matWin; kit.glow(cap);
        });

        // ── The fox's house: porch, glowing windows, chimney smoke ──
        const houseX = -14, houseZ = -34;
        const hWalls = BABYLON.MeshBuilder.CreateBox('houseWalls', { width: 9, height: 6, depth: 9 }, s);
        hWalls.position.set(houseX, 3, houseZ); hWalls.material = matWall; hWalls.checkCollisions = true; shadowGenerator.addShadowCaster(hWalls);
        const hRoof = BABYLON.MeshBuilder.CreateCylinder('houseRoof', { diameterTop: 0, diameterBottom: 13, height: 4.5, tessellation: 4 }, s);
        hRoof.position.set(houseX, 8.2, houseZ); hRoof.rotation.y = Math.PI / 4; hRoof.material = matRoof; shadowGenerator.addShadowCaster(hRoof);
        // gold trim under the roofline
        const trim = BABYLON.MeshBuilder.CreateBox('houseTrim', { width: 9.4, height: 0.3, depth: 9.4 }, s);
        trim.position.set(houseX, 6.05, houseZ); trim.material = matTrim;
        const door = BABYLON.MeshBuilder.CreateBox('door', { width: 2.2, height: 3.4, depth: 0.4 }, s);
        door.position.set(houseX, 1.7, houseZ + 4.6); door.material = matDark;
        const doorFrame = BABYLON.MeshBuilder.CreateTorus('doorFrame', { diameter: 2.6, thickness: 0.18, tessellation: 16 }, s);
        doorFrame.position.set(houseX, 2.6, houseZ + 4.55); doorFrame.material = matTrim;
        [[-2.6], [2.6]].forEach(([dx]) => {
          const win = BABYLON.MeshBuilder.CreateBox('win', { width: 1.4, height: 1.4, depth: 0.3 }, s);
          win.position.set(houseX + dx, 3.6, houseZ + 4.55); win.material = matWin; kit.glow(win);
          // window cross bars
          const bar = BABYLON.MeshBuilder.CreateBox('winBar', { width: 0.12, height: 1.4, depth: 0.34 }, s);
          bar.position.set(houseX + dx, 3.6, houseZ + 4.56); bar.material = matDark;
          const bar2 = BABYLON.MeshBuilder.CreateBox('winBar2', { width: 1.4, height: 0.12, depth: 0.34 }, s);
          bar2.position.set(houseX + dx, 3.6, houseZ + 4.56); bar2.material = matDark;
        });
        // porch: two posts + a small awning over the door
        [[-1.6], [1.6]].forEach(([dx]) => {
          const p = BABYLON.MeshBuilder.CreateCylinder('porchPost', { diameter: 0.32, height: 3.4 }, s);
          p.position.set(houseX + dx, 1.7, houseZ + 6.2); p.material = matDark; shadowGenerator.addShadowCaster(p);
        });
        const awning = BABYLON.MeshBuilder.CreateBox('awning', { width: 4.6, height: 0.24, depth: 2.6 }, s);
        awning.position.set(houseX, 3.55, houseZ + 5.6); awning.rotation.x = 0.12; awning.material = matRoof; shadowGenerator.addShadowCaster(awning);
        const chimney = BABYLON.MeshBuilder.CreateBox('chimney', { width: 1, height: 2.4, depth: 1 }, s);
        chimney.position.set(houseX + 2.6, 9, houseZ - 1.5); chimney.material = matDark; shadowGenerator.addShadowCaster(chimney);
        kit.smoke(houseX + 2.6, 10.3, houseZ - 1.5);
        const houseLamp = new BABYLON.PointLight('houseLamp', new BABYLON.Vector3(houseX, 4, houseZ + 6), s);
        houseLamp.diffuse = new BABYLON.Color3(1, 0.8, 0.45); houseLamp.intensity = 0.6; houseLamp.range = 18;

        // ── Props: trees (two kinds), bushes, rocks, flowers, lamps — instanced ──
        const mkHidden = (m, mat) => { m.material = mat; m.isVisible = false; return m; };
        // round tree: trunk + cloud canopy (3 merged spheres)
        const trunkBase = mkHidden(BABYLON.MeshBuilder.CreateCylinder('treeTrunk', { diameterTop: 0.5, diameterBottom: 0.8, height: 3, tessellation: 8 }, s), matTrunk);
        const canopyBase = (() => {
          const a = BABYLON.MeshBuilder.CreateSphere('c1', { diameter: 4, segments: 8 }, s);
          const b = BABYLON.MeshBuilder.CreateSphere('c2', { diameter: 2.6, segments: 8 }, s); b.position.set(1.4, 0.8, 0.4);
          const c = BABYLON.MeshBuilder.CreateSphere('c3', { diameter: 2.2, segments: 8 }, s); c.position.set(-1.2, 1.0, -0.3);
          return mkHidden(BABYLON.Mesh.MergeMeshes([a, b, c], true, true), matLeaf);
        })();
        // pine tree: trunk + 3 stacked cones
        const pineBase = (() => {
          const cones = [0, 1, 2].map((i) => {
            const c = BABYLON.MeshBuilder.CreateCylinder('p' + i, { diameterTop: 0, diameterBottom: 3.2 - i * 0.8, height: 2.2, tessellation: 10 }, s);
            c.position.y = i * 1.3;
            return c;
          });
          return mkHidden(BABYLON.Mesh.MergeMeshes(cones, true, true), matPine);
        })();
        const bushBase = mkHidden(BABYLON.MeshBuilder.CreateSphere('bush', { diameter: 1.6, segments: 6 }, s), matLeaf);
        const rockBase = mkHidden(BABYLON.MeshBuilder.CreatePolyhedron('rock', { type: 2, size: 0.7 }, s), matStone);
        const lampPole = mkHidden(BABYLON.MeshBuilder.CreateCylinder('lampPole', { diameter: 0.28, height: 4.5, tessellation: 8 }, s), matDark);
        const stemBase = mkHidden(BABYLON.MeshBuilder.CreateCylinder('stem', { diameter: 0.06, height: 0.5 }, s), matLeaf);
        const bloomBase = mkHidden(BABYLON.MeshBuilder.CreateSphere('bloom', { diameter: 0.22, segments: 6 }, s), kit.toonMat('bloomM', 1, 0.75, 0.35, { emis: [0.7, 0.45, 0.15] }));
        const lampBulbBase = BABYLON.MeshBuilder.CreateSphere('lampBulb', { diameter: 0.7, segments: 8 }, s);
        lampBulbBase.material = matWin; lampBulbBase.isVisible = false;

        const rnd = (a, b) => a + Math.random() * (b - a);
        let pc = 0;
        const inst = (base, x, y, z, sc = 1, rot = true, cast = false) => {
          const i = base.createInstance(base.name + pc++);
          i.position.set(x, y, z);
          i.scaling.setAll(sc);
          if (rot) i.rotation.y = Math.random() * Math.PI * 2;
          if (cast) shadowGenerator.addShadowCaster(i);
          return i;
        };
        const TREES = [
          { k: 'round', x: 18, z: -10 }, { k: 'pine', x: -26, z: 10 }, { k: 'round', x: 26, z: 20 },
          { k: 'pine', x: -34, z: -22 }, { k: 'round', x: 34, z: -34 }, { k: 'pine', x: 10, z: 34 },
          { k: 'round', x: -10, z: 40 }, { k: 'pine', x: 40, z: 6 }, { k: 'round', x: -42, z: 32 },
          { k: 'pine', x: 46, z: 40 }, { k: 'round', x: -48, z: -40 }, { k: 'pine', x: 22, z: 48 },
        ];
        TREES.forEach((t) => {
          const sc = rnd(0.85, 1.3);
          inst(trunkBase, t.x, 1.5 * sc, t.z, sc, true, true);
          if (t.k === 'round') inst(canopyBase, t.x, 4.2 * sc, t.z, sc, true, true);
          else inst(pineBase, t.x, 3.4 * sc, t.z, sc, true, true);
        });
        for (let i = 0; i < 14; i++) {
          const x = rnd(-52, 52), z = rnd(-52, 52);
          if (Math.abs(x) < 6 || Math.abs(z) < 6) continue; // keep roads clear
          inst(bushBase, x, 0.5, z, rnd(0.7, 1.4));
        }
        for (let i = 0; i < 10; i++) {
          const x = rnd(-54, 54), z = rnd(-54, 54);
          if (Math.abs(x) < 6 || Math.abs(z) < 6) continue;
          inst(rockBase, x, 0.4, z, rnd(0.5, 1.3), true, true);
        }
        for (let i = 0; i < 24; i++) {
          const x = rnd(-50, 50), z = rnd(-50, 50);
          if (Math.abs(x) < 5.5 || Math.abs(z) < 5.5) continue;
          inst(stemBase, x, 0.25, z, 1, false);
          inst(bloomBase, x, 0.55, z, rnd(0.8, 1.3), false);
        }
        // street lamps: instanced poles + cloned glowing bulbs (clones so the glow layer can include them)
        [[6, -7], [-6, 9], [6, 9], [-6, -7], [0, -50], [0, 30], [14, 0], [-14, 0]].forEach(([x, z]) => {
          inst(lampPole, x, 2.25, z, 1, false);
          const bulb = lampBulbBase.clone('bulb' + pc++);
          bulb.isVisible = true;
          bulb.position.set(x, 4.6, z);
          kit.glow(bulb);
        });

        // ── Wandering critters (little gray bunnies) ──
        const critters = [];
        const mkCritter = (cx, cz) => {
          const n = new BABYLON.TransformNode('critter', s);
          n.position.set(cx, 0, cz);
          const fur = kit.toonMat('bunFur', 0.5, 0.48, 0.55, { rim: [0.3, 0.25, 0.12] });
          const cAdd = (m, x, y, z) => { m.material = fur; m.position.set(x, y, z); m.parent = n; shadowGenerator.addShadowCaster(m); return m; };
          const bod = cAdd(BABYLON.MeshBuilder.CreateSphere('cb', { diameter: 0.55, segments: 8 }, s), 0, 0.32, 0);
          bod.scaling.set(0.9, 0.8, 1.15);
          cAdd(BABYLON.MeshBuilder.CreateSphere('ch', { diameter: 0.4, segments: 8 }, s), 0, 0.62, 0.28);
          [[-0.09], [0.09]].forEach(([ex]) => {
            const ear = cAdd(BABYLON.MeshBuilder.CreateCylinder('ce', { diameterTop: 0.06, diameterBottom: 0.12, height: 0.42, tessellation: 6 }, s), ex, 0.95, 0.22);
            ear.rotation.x = -0.15;
          });
          const tail = cAdd(BABYLON.MeshBuilder.CreateSphere('ct', { diameter: 0.18, segments: 6 }, s), 0, 0.34, -0.34);
          tail.material = kit.toonMat('bunTail', 0.9, 0.88, 0.92);
          [[-0.1], [0.1]].forEach(([ex]) => {
            const eye = BABYLON.MeshBuilder.CreateSphere('cey', { diameter: 0.06 }, s);
            eye.material = kit.toonMat('bunEye', 0.04, 0.04, 0.05);
            eye.position.set(ex, 0.66, 0.46); eye.parent = n;
          });
          critters.push({ n, target: null, pauseUntil: 0, phase: Math.random() * 10 });
        };
        mkCritter(20, 14); mkCritter(-24, -12); mkCritter(8, -28);

        // ── Player ──
        const playerCollider = BABYLON.MeshBuilder.CreateBox('collider', { width: 1.6, height: 4.0, depth: 1.8 }, s);
        playerCollider.isVisible = false;
        playerCollider.checkCollisions = true;
        playerCollider.ellipsoid = new BABYLON.Vector3(0.8, 2.0, 0.9);
        playerCollider.position = new BABYLON.Vector3(0, 2.0, -16);

        const { rig } = buildCharacter(BABYLON, s, playerCollider, shadowGenerator, character, equipped, kit);
        const dust = kit.dustPuffs(playerCollider);

        const foxLight = new BABYLON.PointLight('foxLight', new BABYLON.Vector3(0, 3, 0), s);
        foxLight.diffuse = new BABYLON.Color3(1, 0.75, 0.35);
        foxLight.intensity = 0.9;
        foxLight.range = 14;
        foxLight.parent = playerCollider;

        // ── Ambience ──
        kit.fireflies(0, 0, 26);
        kit.fireflies(houseX, houseZ + 8, 8);

        // ── Coins (XP collectibles) ──
        const coinMat = kit.toonMat('coinMat', 1, 0.8, 0.25, { emis: [0.55, 0.4, 0.1], spec: 0.6 });
        for (let i = 0; i < 18; i++) {
          const holder = new BABYLON.TransformNode('coinH', s);
          const x = rnd(-50, 50), z = rnd(-50, 50);
          holder.position.set(x, 1.3, z);
          const coin = BABYLON.MeshBuilder.CreateCylinder('coin', { diameter: 0.9, height: 0.12, tessellation: 20 }, s);
          coin.rotation.x = Math.PI / 2;
          coin.material = coinMat;
          coin.parent = holder;
          kit.glow(coin);
          coins.push({ holder, coin, baseY: 1.3, phase: Math.random() * 10 });
        }

        // ── Virtual joystick ──
        const joyCanvas = joyCanvasRef.current;
        const joyWrap = joyWrapRef.current;
        if (joyCanvas && joyWrap) {
          const jCtx = joyCanvas.getContext('2d');
          let touchPos = null;
          const drawJoystick = () => {
            jCtx.clearRect(0, 0, 150, 150);
            jCtx.beginPath(); jCtx.arc(75, 75, 50, 0, Math.PI * 2); jCtx.fillStyle = 'rgba(255,255,255,0.1)'; jCtx.fill();
            jCtx.strokeStyle = 'rgba(255,255,255,0.4)'; jCtx.stroke();
            let kx = 75, ky = 75; if (touchPos) { kx = touchPos.x; ky = touchPos.y; }
            jCtx.beginPath(); jCtx.arc(kx, ky, 25, 0, Math.PI * 2); jCtx.fillStyle = 'rgba(255,255,255,0.7)'; jCtx.fill();
            requestAnimationFrame(drawJoystick);
          };
          drawJoystick();
          const updateJoystick = (e) => {
            e.preventDefault();
            let cx, cy;
            if (e.touches) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; } else { cx = e.clientX; cy = e.clientY; }
            const rect = joyCanvas.getBoundingClientRect();
            const dx = (cx - rect.left) - 75, dy = (cy - rect.top) - 75;
            const distance = Math.min(Math.hypot(dx, dy), 50), angle = Math.atan2(dy, dx);
            touchPos = { x: 75 + Math.cos(angle) * distance, y: 75 + Math.sin(angle) * distance };
            joyInput.x = Math.cos(angle) * (distance / 50);
            joyInput.z = -Math.sin(angle) * (distance / 50);
          };
          joyWrap.addEventListener('touchstart', updateJoystick, { passive: false });
          joyWrap.addEventListener('touchmove', updateJoystick, { passive: false });
          joyWrap.addEventListener('touchend', () => { touchPos = null; joyInput = { x: 0, z: 0 }; });
          let isMouseJoy = false;
          joyWrap.addEventListener('mousedown', (e) => { isMouseJoy = true; updateJoystick(e); });
          joyWrap.addEventListener('mousemove', (e) => { if (isMouseJoy) updateJoystick(e); });
          window.addEventListener('mouseup', () => { isMouseJoy = false; touchPos = null; joyInput = { x: 0, z: 0 }; });
          joyWrap.style.display = 'block';
        }

        // ── Tap / click-to-move on any walkable surface ──
        const walkable = (m) => m && (m.name === 'ground' || m.name === 'road' || m.name === 'plaza');
        s.onPointerObservable.add((pi) => {
          if (pi.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            isPointerDown = true;
            if (pi.pickInfo.hit && walkable(pi.pickInfo.pickedMesh)) {
              targetPosition = pi.pickInfo.pickedPoint.clone(); targetPosition.y = playerCollider.position.y;
            }
          } else if (pi.type === BABYLON.PointerEventTypes.POINTERMOVE) {
            if (isPointerDown && pi.pickInfo.hit && walkable(pi.pickInfo.pickedMesh)) {
              targetPosition = pi.pickInfo.pickedPoint.clone(); targetPosition.y = playerCollider.position.y;
            }
          } else if (pi.type === BABYLON.PointerEventTypes.POINTERUP) {
            isPointerDown = false;
          }
        });

        s.actionManager = new BABYLON.ActionManager(s);
        s.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => { inputMap[evt.sourceEvent.key.toLowerCase()] = true; }));
        s.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (evt) => { inputMap[evt.sourceEvent.key.toLowerCase()] = false; }));

        // ── Movement: acceleration + camera damping + character animation ──
        const SPEED = 0.34;
        let vel = { x: 0, z: 0 };
        let walkCycle = 0;
        let prevYaw = 0;
        s.onBeforeRenderObservable.add(() => {
          const time = performance.now() / 1000;
          const L = BABYLON.Scalar.Lerp;

          // coins: spin + bob, collect on proximity with a burst
          for (let i = coins.length - 1; i >= 0; i--) {
            const c = coins[i];
            c.holder.rotation.y += 0.04;
            c.holder.position.y = c.baseY + Math.sin(time * 2.2 + c.phase) * 0.18;
            if (BABYLON.Vector3.Distance(playerCollider.position, c.holder.position) < 2.4) {
              kit.burst(c.holder.position);
              playSfx('collect'); updateXP(10);
              c.holder.dispose(); // children go too; coinMat is shared, leave it alive
              coins.splice(i, 1);
            }
          }

          // critters: wander-pause-wander with a hop
          critters.forEach((cr) => {
            if (!cr.target || cr.pauseUntil > time) {
              if (cr.pauseUntil <= time) {
                cr.target = new BABYLON.Vector3(rnd(-46, 46), 0, rnd(-46, 46));
              }
              return;
            }
            const d = cr.target.subtract(cr.n.position); d.y = 0;
            if (d.length() < 1) {
              cr.target = null;
              cr.pauseUntil = time + 1.5 + Math.random() * 3;
              cr.n.position.y = 0;
              return;
            }
            d.normalize();
            cr.n.position.x += d.x * 0.055;
            cr.n.position.z += d.z * 0.055;
            cr.n.position.y = Math.abs(Math.sin(time * 7 + cr.phase)) * 0.22;
            cr.n.rotation.y = Math.atan2(d.x, d.z);
          });

          // player input → desired direction
          let dirX = 0, dirZ = 0, manual = false;
          if (inputMap['w'] || inputMap['arrowup']) { dirZ = 1; manual = true; }
          if (inputMap['s'] || inputMap['arrowdown']) { dirZ = -1; manual = true; }
          if (inputMap['a'] || inputMap['arrowleft']) { dirX = -1; manual = true; }
          if (inputMap['d'] || inputMap['arrowright']) { dirX = 1; manual = true; }
          if (manual) {
            targetPosition = null;
            const len = Math.hypot(dirX, dirZ); if (len > 0) { dirX /= len; dirZ /= len; }
          } else if (Math.abs(joyInput.x) > 0.05 || Math.abs(joyInput.z) > 0.05) {
            targetPosition = null; dirX = joyInput.x; dirZ = joyInput.z;
          } else if (targetPosition) {
            const d = targetPosition.subtract(playerCollider.position); d.y = 0;
            if (d.length() > 0.6) { d.normalize(); dirX = d.x; dirZ = d.z; } else targetPosition = null;
          }

          // accelerate / decelerate toward the desired velocity
          vel.x = L(vel.x, dirX * SPEED, 0.16);
          vel.z = L(vel.z, dirZ * SPEED, 0.16);
          const speedNow = Math.hypot(vel.x, vel.z);
          const isMoving = speedNow > 0.03;

          if (isMoving) {
            const ta = Math.atan2(vel.x, vel.z);
            rig.root.rotation.y = BABYLON.Scalar.LerpAngle(rig.root.rotation.y, ta, 0.2);
            walkCycle += speedNow * 2.2;
          }
          // yaw velocity drives lean + tail/head lag in the rig
          let yawVel = rig.root.rotation.y - prevYaw;
          if (yawVel > Math.PI) yawVel -= Math.PI * 2;
          if (yawVel < -Math.PI) yawVel += Math.PI * 2;
          prevYaw = rig.root.rotation.y;

          rig.update(isMoving, walkCycle, time, yawVel);
          dust.rate(isMoving);
          playerCollider.moveWithCollisions(new BABYLON.Vector3(vel.x, -0.25, vel.z));

          // damped camera follow with a touch of lead in the move direction
          camera.target.x = L(camera.target.x, playerCollider.position.x + vel.x * 5, 0.12);
          camera.target.z = L(camera.target.z, playerCollider.position.z + vel.z * 5, 0.12);
          camera.target.y = L(camera.target.y, playerCollider.position.y, 0.12);
        });

        return s;
      };

      const scene = createScene();
      sceneRef.current = scene;
      engine.runRenderLoop(() => { if (scene) scene.render(); });

      const handleResize = () => { if (engine) engine.resize(); };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (engine) { engine.stopRenderLoop(); engine.dispose(); }
      };
    } catch (e) {
      console.warn('Babylon 3D world failed to load.', e);
      return undefined;
    }
  }, [playSfx, updateXP, exitMaze, character, equipped]);

  return (
    <div id="maze-container" style={{ display: 'block' }}>
      <canvas ref={canvasRef} id="renderCanvas"></canvas>
      <div ref={joyWrapRef} id="joystick-wrapper" style={{ display: 'none' }}>
        <canvas ref={joyCanvasRef} id="joystick-canvas" width="150" height="150"></canvas>
      </div>

      <div id="content-wrapper">
        <div className="maze-topbar glass-panel">
          <div className="brand">
            <div className="xp-pill" style={{ background: 'var(--amber)', boxShadow: '0 0 10px var(--amber-ring)' }}>⚡ {points}</div>
            <div>
              <div className="brand-name">{isAr ? 'عالم ماز مان' : 'Maze Man World'}</div>
              <div className="brand-sub">{isAr ? 'استكشف' : 'Explore'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn-hub" onClick={() => setShowSettings((v) => !v)}>⚙</button>
            <button className="btn-hub" onClick={handleExitToHub}>{isAr ? 'خروج' : 'QUIT'}</button>
          </div>
        </div>

        {showSettings && (
          <div className="maze-settings-panel" dir={isAr ? 'rtl' : 'ltr'}>
            <div className="maze-settings-title">{isAr ? 'الإعدادات' : 'SETTINGS'}</div>
            <button className="maze-settings-row" onClick={toggleLang}>
              <span>{isAr ? 'اللغة' : 'Language'}</span>
              <span className="maze-settings-badge">{isAr ? 'EN' : 'عر'}</span>
            </button>
            <button className="maze-settings-close" onClick={() => setShowSettings(false)}>
              {isAr ? 'إغلاق' : 'CLOSE'}
            </button>
          </div>
        )}

        <div id="floating-instruction">
          {isAr ? 'استخدم عصا التحكم أو WASD للتجوّل' : 'Use the joystick or WASD to explore'}
        </div>
      </div>
    </div>
  );
}
