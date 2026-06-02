import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';

/**
 * The 3D world (built on the original Babylon maze foundation).
 *
 * Same engine / controls / look as the maze, but it's now an OPEN, top-down
 * world instead of a labyrinth: no planet, no maze walls. You roam as the fox
 * (drawn in code from primitives, styled like the black-and-gold mascot).
 * Built data-first where it counts so it can grow into a buildable world later.
 */
export default function MazeOverlay() {
  const { exitMaze, updateXP, playSfx, currentLang, toggleLang, points } = useApp();
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
    const inputMap = {};
    let joyInput = { x: 0, z: 0 };
    let targetPosition = null;
    let isPointerDown = false;
    let collectibles = [];

    try {
      engine = new BABYLON.Engine(canvas3D, true, { antialias: true });
      engineRef.current = engine;

      const createScene = function () {
        const s = new BABYLON.Scene(engine);
        s.clearColor = new BABYLON.Color4(0.01, 0.01, 0.02, 1);
        s.collisionsEnabled = true;

        // Top-down follow camera (slight tilt so the fox reads as 3D).
        const camera = new BABYLON.ArcRotateCamera('camera', -Math.PI / 2, 0.5, 32, BABYLON.Vector3.Zero(), s);
        camera.attachControl(canvas3D, true);
        camera.lowerRadiusLimit = 14;
        camera.upperRadiusLimit = 70;
        camera.lowerBetaLimit = 0.15;
        camera.upperBetaLimit = Math.PI / 2.3;

        const ambientLight = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), s);
        ambientLight.intensity = 0.45;
        const dirLight = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-1, -2, 1), s);
        dirLight.intensity = 1.0;
        dirLight.position = new BABYLON.Vector3(0, 60, 0);
        const shadowGenerator = new BABYLON.ShadowGenerator(1024, dirLight);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurKernel = 24;

        const pipeline = new BABYLON.DefaultRenderingPipeline('pipeline', true, s, [camera]);
        pipeline.bloomEnabled = true;
        pipeline.bloomThreshold = 0.4;
        pipeline.bloomWeight = 0.7;

        // Keep the maze's starry skybox backdrop (minus the planet).
        const skybox = BABYLON.MeshBuilder.CreateBox('skyBox', { size: 1000.0 }, s);
        const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', s);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture('https://playground.babylonjs.com/textures/skybox', s);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;

        const stars = new BABYLON.ParticleSystem('stars', 1500, s);
        stars.particleTexture = new BABYLON.Texture('https://playground.babylonjs.com/textures/flare.png', s);
        stars.emitter = new BABYLON.Vector3(0, 120, 0);
        stars.minEmitBox = new BABYLON.Vector3(-200, 0, -200);
        stars.maxEmitBox = new BABYLON.Vector3(200, 40, 200);
        stars.color1 = new BABYLON.Color4(1, 0.9, 0.7, 1);
        stars.colorDead = new BABYLON.Color4(0, 0, 0, 0);
        stars.minSize = 0.1; stars.maxSize = 0.5;
        stars.minLifeTime = 3; stars.maxLifeTime = 6;
        stars.emitRate = 200;
        stars.direction1 = new BABYLON.Vector3(0, -0.2, 0);
        stars.direction2 = new BABYLON.Vector3(0, -0.4, 0);
        stars.minEmitPower = 0.2; stars.maxEmitPower = 0.6;
        stars.start();

        // ---- Open ground (big) ----
        const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: WORLD, height: WORLD }, s);
        const groundMat = new BABYLON.StandardMaterial('grassMat', s);
        const grassTex = new BABYLON.Texture('https://playground.babylonjs.com/textures/grass.png', s);
        grassTex.uScale = 60; grassTex.vScale = 60;
        groundMat.diffuseTexture = grassTex;
        groundMat.specularColor = new BABYLON.Color3(0.04, 0.05, 0.04);
        ground.material = groundMat;
        ground.receiveShadows = true;
        ground.checkCollisions = true;

        // ---- Town layout: border wall, roads, the fox's house, props ----
        const BORDER = 58; // playable half-size (≈116×116 enclosed)
        const mkMat = (name, r, g, b, emis) => {
          const m = new BABYLON.StandardMaterial(name, s);
          m.diffuseColor = new BABYLON.Color3(r, g, b);
          m.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
          if (emis) m.emissiveColor = new BABYLON.Color3(emis[0], emis[1], emis[2]);
          return m;
        };
        const matStone = mkMat('stone', 0.78, 0.72, 0.58);
        const matRoad = mkMat('road', 0.42, 0.37, 0.3);
        const matWall = mkMat('houseWall', 0.86, 0.79, 0.62);
        const matRoof = mkMat('houseRoof', 0.5, 0.16, 0.13);
        const matDark = mkMat('dark', 0.13, 0.13, 0.16);
        const matTrim = mkMat('trim', 0.85, 0.65, 0.18, [0.4, 0.3, 0.06]);
        const matWin = mkMat('win', 1, 0.82, 0.4, [1, 0.7, 0.3]);
        const matTrunk = mkMat('trunk', 0.34, 0.22, 0.12);
        const matLeaf = mkMat('leaf', 0.18, 0.45, 0.2);

        // Border wall (with an entrance gap on the front/-z side) + corner posts
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
        [[-BORDER, -BORDER], [BORDER, -BORDER], [-BORDER, BORDER], [BORDER, BORDER]].forEach(([x, z]) => {
          const post = BABYLON.MeshBuilder.CreateBox('post', { width: 1.8, height: 4, depth: 1.8 }, s);
          post.position.set(x, 2, z); post.material = matDark; post.checkCollisions = true;
          const cap = BABYLON.MeshBuilder.CreateSphere('cap', { diameter: 1 }, s);
          cap.position.set(x, 4.3, z); cap.material = matTrim;
        });

        // Roads (flat, slightly above grass; main cross + a spur to the house)
        const mkRoad = (x, z, w, d) => {
          const r = BABYLON.MeshBuilder.CreateBox('road', { width: w, height: 0.15, depth: d }, s);
          r.position.set(x, 0.08, z); r.material = matRoad; r.receiveShadows = true;
        };
        mkRoad(0, 0, 8, BORDER * 2);   // north–south
        mkRoad(0, 0, BORDER * 2, 8);   // east–west
        mkRoad(-7, -34, 14, 4);        // spur to the fox's house

        // The fox's house
        const houseX = -14, houseZ = -34;
        const hWalls = BABYLON.MeshBuilder.CreateBox('houseWalls', { width: 9, height: 6, depth: 9 }, s);
        hWalls.position.set(houseX, 3, houseZ); hWalls.material = matWall; hWalls.checkCollisions = true; shadowGenerator.addShadowCaster(hWalls);
        const hRoof = BABYLON.MeshBuilder.CreateCylinder('houseRoof', { diameterTop: 0, diameterBottom: 13, height: 4.5, tessellation: 4 }, s);
        hRoof.position.set(houseX, 8.2, houseZ); hRoof.rotation.y = Math.PI / 4; hRoof.material = matRoof; shadowGenerator.addShadowCaster(hRoof);
        const door = BABYLON.MeshBuilder.CreateBox('door', { width: 2.2, height: 3.4, depth: 0.4 }, s);
        door.position.set(houseX, 1.7, houseZ + 4.6); door.material = matDark;
        const doorFrame = BABYLON.MeshBuilder.CreateTorus('doorFrame', { diameter: 2.6, thickness: 0.18, tessellation: 16 }, s);
        doorFrame.position.set(houseX, 2.6, houseZ + 4.55); doorFrame.material = matTrim;
        [[-2.6], [2.6]].forEach(([dx]) => {
          const win = BABYLON.MeshBuilder.CreateBox('win', { width: 1.4, height: 1.4, depth: 0.3 }, s);
          win.position.set(houseX + dx, 3.6, houseZ + 4.55); win.material = matWin;
        });
        const chimney = BABYLON.MeshBuilder.CreateBox('chimney', { width: 1, height: 2.4, depth: 1 }, s);
        chimney.position.set(houseX + 2.6, 9, houseZ - 1.5); chimney.material = matDark; shadowGenerator.addShadowCaster(chimney);
        const houseLamp = new BABYLON.PointLight('houseLamp', new BABYLON.Vector3(houseX, 4, houseZ + 6), s);
        houseLamp.diffuse = new BABYLON.Color3(1, 0.8, 0.45); houseLamp.intensity = 0.6; houseLamp.range = 18;

        // Props: trees + lamps (base meshes built once, then instanced)
        const treeTrunk = BABYLON.MeshBuilder.CreateCylinder('treeTrunk', { diameterTop: 0.5, diameterBottom: 0.8, height: 3 }, s);
        treeTrunk.material = matTrunk; treeTrunk.isVisible = false;
        const treeCanopy = BABYLON.MeshBuilder.CreateSphere('treeCanopy', { diameter: 4, segments: 6 }, s);
        treeCanopy.material = matLeaf; treeCanopy.isVisible = false;
        const lampPole = BABYLON.MeshBuilder.CreateCylinder('lampPole', { diameter: 0.3, height: 4.5 }, s);
        lampPole.material = matDark; lampPole.isVisible = false;
        const lampBulb = BABYLON.MeshBuilder.CreateSphere('lampBulb', { diameter: 0.7, segments: 6 }, s);
        lampBulb.material = matWin; lampBulb.isVisible = false;
        const PROPS = [
          { t: 'tree', x: 18, z: -10 }, { t: 'tree', x: -26, z: 10 }, { t: 'tree', x: 26, z: 20 },
          { t: 'tree', x: -34, z: -22 }, { t: 'tree', x: 34, z: -34 }, { t: 'tree', x: 10, z: 34 },
          { t: 'tree', x: -10, z: 40 }, { t: 'tree', x: 40, z: 6 },
          { t: 'lamp', x: 6, z: -7 }, { t: 'lamp', x: -6, z: -7 }, { t: 'lamp', x: 6, z: 9 },
          { t: 'lamp', x: -6, z: 9 }, { t: 'lamp', x: 0, z: -52 }, { t: 'lamp', x: 0, z: 30 },
        ];
        let pc = 0;
        PROPS.forEach((p) => {
          if (p.t === 'tree') {
            const tr = treeTrunk.createInstance(`tr${pc}`); tr.position.set(p.x, 1.5, p.z); shadowGenerator.addShadowCaster(tr);
            const cn = treeCanopy.createInstance(`cn${pc}`); cn.position.set(p.x, 4.2, p.z); shadowGenerator.addShadowCaster(cn);
          } else {
            const pl = lampPole.createInstance(`pl${pc}`); pl.position.set(p.x, 2.25, p.z);
            const bl = lampBulb.createInstance(`bl${pc}`); bl.position.set(p.x, 4.6, p.z);
          }
          pc += 1;
        });

        // ---- The fox (drawn in code) ----
        const playerCollider = BABYLON.MeshBuilder.CreateBox('collider', { width: 1.6, height: 4.0, depth: 1.8 }, s);
        playerCollider.isVisible = false;
        playerCollider.checkCollisions = true;
        playerCollider.ellipsoid = new BABYLON.Vector3(0.8, 2.0, 0.9);
        playerCollider.position = new BABYLON.Vector3(0, 2.0, 0);

        const foxRoot = new BABYLON.TransformNode('foxRoot');
        foxRoot.parent = playerCollider;
        foxRoot.position.y = -2.0; // drop to ground (collider centre is at y=2)

        const matBlack = new BABYLON.StandardMaterial('foxBlack', s);
        matBlack.diffuseColor = new BABYLON.Color3(0.07, 0.07, 0.09);
        matBlack.specularColor = new BABYLON.Color3(0.35, 0.3, 0.2);
        const matGold = new BABYLON.StandardMaterial('foxGold', s);
        matGold.diffuseColor = new BABYLON.Color3(0.85, 0.65, 0.18);
        matGold.emissiveColor = new BABYLON.Color3(0.45, 0.32, 0.06);
        matGold.specularColor = new BABYLON.Color3(0.6, 0.5, 0.2);
        const matEye = new BABYLON.StandardMaterial('foxEye', s);
        matEye.emissiveColor = new BABYLON.Color3(1, 0.78, 0.25);
        matEye.diffuseColor = new BABYLON.Color3(1, 0.8, 0.3);

        const part = (mesh, mat, x, y, z) => {
          mesh.material = mat;
          mesh.position.set(x, y, z);
          mesh.parent = foxRoot;
          shadowGenerator.addShadowCaster(mesh);
          return mesh;
        };

        // Body — elongated forward (+z is "forward")
        const body = BABYLON.MeshBuilder.CreateSphere('body', { diameter: 1.5, segments: 10 }, s);
        body.scaling = new BABYLON.Vector3(1, 0.85, 1.7);
        part(body, matBlack, 0, 1.2, -0.1);
        // Head
        const head = BABYLON.MeshBuilder.CreateSphere('head', { diameter: 1.05, segments: 10 }, s);
        part(head, matBlack, 0, 1.5, 1.05);
        // Snout
        const snout = BABYLON.MeshBuilder.CreateCylinder('snout', { diameterTop: 0.05, diameterBottom: 0.45, height: 0.55, tessellation: 12 }, s);
        snout.rotation.x = Math.PI / 2;
        part(snout, matBlack, 0, 1.42, 1.65);
        // Ears (black outer + gold inner)
        const earL = BABYLON.MeshBuilder.CreateCylinder('earL', { diameterTop: 0, diameterBottom: 0.5, height: 0.8, tessellation: 4 }, s);
        earL.rotation.z = 0.18; part(earL, matBlack, -0.34, 2.05, 0.95);
        const earR = BABYLON.MeshBuilder.CreateCylinder('earR', { diameterTop: 0, diameterBottom: 0.5, height: 0.8, tessellation: 4 }, s);
        earR.rotation.z = -0.18; part(earR, matBlack, 0.34, 2.05, 0.95);
        const earLin = BABYLON.MeshBuilder.CreateCylinder('earLin', { diameterTop: 0, diameterBottom: 0.26, height: 0.5, tessellation: 4 }, s);
        part(earLin, matGold, -0.34, 2.05, 1.02);
        const earRin = BABYLON.MeshBuilder.CreateCylinder('earRin', { diameterTop: 0, diameterBottom: 0.26, height: 0.5, tessellation: 4 }, s);
        part(earRin, matGold, 0.34, 2.05, 1.02);
        // Glowing eyes
        const eyeL = BABYLON.MeshBuilder.CreateSphere('eyeL', { diameter: 0.22 }, s);
        part(eyeL, matEye, -0.27, 1.58, 1.5);
        const eyeR = BABYLON.MeshBuilder.CreateSphere('eyeR', { diameter: 0.22 }, s);
        part(eyeR, matEye, 0.27, 1.58, 1.5);
        // Gold collar (mascot trim) — a torus around the neck
        const collar = BABYLON.MeshBuilder.CreateTorus('collar', { diameter: 1.15, thickness: 0.13, tessellation: 16 }, s);
        collar.rotation.x = Math.PI / 2;
        part(collar, matGold, 0, 1.28, 0.5);
        // Legs
        const mkLeg = (name, x, z) => { const l = BABYLON.MeshBuilder.CreateCylinder(name, { diameter: 0.32, height: 1.0 }, s); return part(l, matBlack, x, 0.5, z); };
        const legFL = mkLeg('legFL', -0.42, 0.6);
        const legFR = mkLeg('legFR', 0.42, 0.6);
        const legBL = mkLeg('legBL', -0.42, -0.7);
        const legBR = mkLeg('legBR', 0.42, -0.7);
        // Bushy tail (black, gold tip), angled up/back
        const tailPivot = new BABYLON.TransformNode('tailPivot');
        tailPivot.parent = foxRoot;
        tailPivot.position.set(0, 1.35, -0.95);
        const tail = BABYLON.MeshBuilder.CreateCylinder('tail', { diameterTop: 0.15, diameterBottom: 0.85, height: 1.7, tessellation: 12 }, s);
        tail.material = matBlack; tail.parent = tailPivot;
        tail.position.set(0, 0.2, -0.7); tail.rotation.x = -0.9;
        shadowGenerator.addShadowCaster(tail);
        const tailTip = BABYLON.MeshBuilder.CreateSphere('tailTip', { diameter: 0.55 }, s);
        tailTip.material = matGold; tailTip.parent = tailPivot;
        tailTip.position.set(0, 0.55, -1.35);

        const foxRig = { body, tailPivot, legFL, legFR, legBL, legBR };

        const foxLight = new BABYLON.PointLight('foxLight', new BABYLON.Vector3(0, 3, 0), s);
        foxLight.diffuse = new BABYLON.Color3(1, 0.75, 0.35);
        foxLight.intensity = 0.9;
        foxLight.range = 14;
        foxLight.parent = playerCollider;

        // ---- Collectibles (XP) scattered in the open world ----
        const fragMat = new BABYLON.StandardMaterial('fragMat', s);
        fragMat.emissiveColor = new BABYLON.Color3(0, 1, 0.5);
        fragMat.wireframe = true;
        for (let i = 0; i < 18; i++) {
          const frag = BABYLON.MeshBuilder.CreateIcoSphere(`frag${i}`, { radius: 0.6, subdivisions: 2 }, s);
          frag.position = new BABYLON.Vector3((Math.random() - 0.5) * 100, 1.5, (Math.random() - 0.5) * 100);
          frag.material = fragMat;
          collectibles.push(frag);
        }

        // ---- Virtual joystick ----
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

        // ---- Tap / click-to-move on the ground ----
        s.onPointerObservable.add((pi) => {
          if (pi.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            isPointerDown = true;
            if (pi.pickInfo.hit && pi.pickInfo.pickedMesh && pi.pickInfo.pickedMesh.name === 'ground') {
              targetPosition = pi.pickInfo.pickedPoint.clone(); targetPosition.y = playerCollider.position.y;
            }
          } else if (pi.type === BABYLON.PointerEventTypes.POINTERMOVE) {
            if (isPointerDown && pi.pickInfo.hit && pi.pickInfo.pickedMesh && pi.pickInfo.pickedMesh.name === 'ground') {
              targetPosition = pi.pickInfo.pickedPoint.clone(); targetPosition.y = playerCollider.position.y;
            }
          } else if (pi.type === BABYLON.PointerEventTypes.POINTERUP) {
            isPointerDown = false;
          }
        });

        s.actionManager = new BABYLON.ActionManager(s);
        s.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => { inputMap[evt.sourceEvent.key.toLowerCase()] = true; }));
        s.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (evt) => { inputMap[evt.sourceEvent.key.toLowerCase()] = false; }));

        // ---- Movement + camera follow + fox animation ----
        const speed = 0.34;
        let walkCycle = 0;
        s.onBeforeRenderObservable.add(() => {
          // spin collectibles + collect on proximity
          for (let i = collectibles.length - 1; i >= 0; i--) {
            collectibles[i].rotation.y += 0.05;
            if (BABYLON.Vector3.Distance(playerCollider.position, collectibles[i].position) < 2.2) {
              playSfx('collect'); updateXP(10); collectibles[i].dispose(); collectibles.splice(i, 1);
            }
          }

          let dirX = 0, dirZ = 0, isMoving = false, manual = false;
          if (inputMap['w'] || inputMap['arrowup']) { dirZ = 1; manual = true; }
          if (inputMap['s'] || inputMap['arrowdown']) { dirZ = -1; manual = true; }
          if (inputMap['a'] || inputMap['arrowleft']) { dirX = -1; manual = true; }
          if (inputMap['d'] || inputMap['arrowright']) { dirX = 1; manual = true; }
          if (manual) {
            targetPosition = null;
            const len = Math.hypot(dirX, dirZ); if (len > 0) { dirX /= len; dirZ /= len; }
            isMoving = true;
          } else if (Math.abs(joyInput.x) > 0.05 || Math.abs(joyInput.z) > 0.05) {
            targetPosition = null; dirX = joyInput.x; dirZ = joyInput.z; isMoving = true;
          } else if (targetPosition) {
            const d = targetPosition.subtract(playerCollider.position); d.y = 0;
            if (d.length() > 0.6) { d.normalize(); dirX = d.x; dirZ = d.z; isMoving = true; } else targetPosition = null;
          }

          const move = new BABYLON.Vector3(0, -0.25, 0);
          if (isMoving) {
            move.x = dirX * speed; move.z = dirZ * speed;
            const ta = Math.atan2(dirX, dirZ);
            foxRoot.rotation.y = BABYLON.Scalar.LerpAngle(foxRoot.rotation.y, ta, 0.2);
            walkCycle += speed * 1.6;
            const swing = Math.sin(walkCycle) * 0.5;
            foxRig.legFL.rotation.x = swing; foxRig.legBR.rotation.x = swing;
            foxRig.legFR.rotation.x = -swing; foxRig.legBL.rotation.x = -swing;
            foxRig.body.position.y = 1.2 + Math.abs(Math.sin(walkCycle * 2)) * 0.1;
            foxRig.tailPivot.rotation.z = Math.sin(walkCycle * 2) * 0.35;
          } else {
            ['legFL', 'legFR', 'legBL', 'legBR'].forEach((k) => { foxRig[k].rotation.x = BABYLON.Scalar.Lerp(foxRig[k].rotation.x, 0, 0.15); });
            foxRig.body.position.y = BABYLON.Scalar.Lerp(foxRig.body.position.y, 1.2, 0.15);
            foxRig.tailPivot.rotation.z = BABYLON.Scalar.Lerp(foxRig.tailPivot.rotation.z, 0, 0.1);
          }
          playerCollider.moveWithCollisions(move);
          camera.target.x = playerCollider.position.x;
          camera.target.z = playerCollider.position.z;
          camera.target.y = playerCollider.position.y;
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
  }, [playSfx, updateXP, exitMaze]);

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
