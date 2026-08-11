import React, { useEffect, useRef, useState } from 'react';
import './martian-maze.css';

const BABYLON_SCRIPT_ID = 'babylon-cdn';
const BABYLON_URL = 'https://cdn.babylonjs.com/v9.11.0/babylon.js';
const BABYLON_INTEGRITY = 'sha384-uXkmKN+2jmCGDEGble8eNhnYoDGtzLMPhnublKtjvBUzerIVkBQIcJhOeW/hjVuF';

const SIZE = 51;
const CELL_SIZE = 4;
const MAZE_OFFSET_Y = -60;
const PLAYER_BODY_Y = 2.45;
const WALL_HEIGHT = CELL_SIZE * 1.15;
const EXPLORATION_HUBS = [
  { x: 3, y: 3, size: 2 },
  { x: 7, y: 7, size: 2 },
  { x: 43, y: 7, size: 2 },
  { x: 7, y: 43, size: 2 },
  { x: 43, y: 43, size: 2 },
  { x: 13, y: 25, size: 2 },
  { x: 37, y: 25, size: 2 },
];

let babylonPromise = null;

function loadBabylon() {
  if (window.BABYLON) return Promise.resolve(window.BABYLON);
  if (babylonPromise) return babylonPromise;

  babylonPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(BABYLON_SCRIPT_ID);
    let timeout = 0;

    const cleanup = (script) => {
      window.clearTimeout(timeout);
      script?.removeEventListener('load', handleLoad);
      script?.removeEventListener('error', handleError);
    };
    const fail = (script, message) => {
      cleanup(script);
      script?.remove();
      babylonPromise = null;
      reject(new Error(message));
    };
    function handleLoad() {
      const script = document.getElementById(BABYLON_SCRIPT_ID);
      if (!window.BABYLON) {
        fail(script, 'The 3D maze engine could not start.');
        return;
      }
      cleanup(script);
      resolve(window.BABYLON);
    }
    function handleError() {
      fail(document.getElementById(BABYLON_SCRIPT_ID), 'The 3D maze engine could not load.');
    }

    if (existing) {
      existing.addEventListener('load', handleLoad, { once: true });
      existing.addEventListener('error', handleError, { once: true });
      timeout = window.setTimeout(
        () => fail(existing, 'The 3D maze engine took too long to load.'),
        30000,
      );
      return;
    }

    const script = document.createElement('script');
    script.id = BABYLON_SCRIPT_ID;
    script.src = BABYLON_URL;
    script.integrity = BABYLON_INTEGRITY;
    script.crossOrigin = 'anonymous';
    script.async = true;
    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    timeout = window.setTimeout(
      () => fail(script, 'The 3D maze engine took too long to load.'),
      30000,
    );
    document.head.appendChild(script);
  });

  return babylonPromise;
}

function createExactMazeWorld({ B, canvas, joystickCanvas, onReady, onVictory }) {
  const engine = new B.Engine(canvas, true, { antialias: true });
  const lowPower =
    window.innerWidth <= 900 ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4);
  engine.setHardwareScalingLevel(lowPower ? 1.35 : 1.1);

  const scene = new B.Scene(engine);
  scene.clearColor = new B.Color4(0.149, 0.173, 0.235, 1);
  scene.collisionsEnabled = true;
  scene.skipPointerMovePicking = true;
  scene.fogMode = B.Scene.FOGMODE_EXP2;
  scene.fogColor = new B.Color3(0.204, 0.208, 0.267);
  scene.fogDensity = 0.0022;
  if (B.ScenePerformancePriority) {
    scene.performancePriority = B.ScenePerformancePriority.Intermediate;
  }

  let isMazeActive = true;
  let isAtBoss = false;
  let playerCollider;
  let playerVisual;
  let particleSystem;
  let bossPosition;
  let stickmanRig = {};
  let targetPosition = null;
  let isPointerDown = false;

  const maze = Array(SIZE)
    .fill()
    .map(() => Array(SIZE).fill(1));
  const inputMap = {};
  const joyInput = { x: 0, z: 0 };

  const camera = new B.ArcRotateCamera('camera', -Math.PI / 2, 0.5, 56, B.Vector3.Zero(), scene);
  const syncCameraForViewport = () => {
    const isPhone = Math.min(window.innerWidth, window.innerHeight) <= 700;
    camera.beta = isPhone ? 0.48 : 0.55;
    camera.radius = isPhone ? 64 : 56;
    camera.lowerRadiusLimit = isPhone ? 58 : 48;
    camera.upperRadiusLimit = isPhone ? 74 : 68;
  };
  syncCameraForViewport();
  camera.wheelPrecision = 20;

  const ambientLight = new B.HemisphericLight('ambient', new B.Vector3(0, 1, 0), scene);
  ambientLight.intensity = 0.3;
  ambientLight.diffuse = new B.Color3(0.72, 0.7, 0.86);
  ambientLight.groundColor = new B.Color3(0.28, 0.15, 0.12);

  const dirLight = new B.DirectionalLight('sun', new B.Vector3(-1, -2, 1), scene);
  dirLight.intensity = 1;
  dirLight.position = new B.Vector3(0, 50, 0);
  dirLight.diffuse = new B.Color3(1, 0.78, 0.58);

  const shadowGenerator = new B.ShadowGenerator(lowPower ? 512 : 1024, dirLight);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = lowPower ? 16 : 32;
  if (lowPower && B.RenderTargetTexture) {
    shadowGenerator.getShadowMap().refreshRate =
      B.RenderTargetTexture.REFRESHRATE_RENDER_ONEVERYTWOFRAMES;
  }

  const pipeline = new B.DefaultRenderingPipeline('pipeline', true, scene, [camera]);
  pipeline.bloomEnabled = true;
  pipeline.bloomThreshold = 0.3;
  pipeline.bloomWeight = 1.2;
  pipeline.bloomKernel = lowPower ? 24 : 48;

  // Match the Home universe's dusk ramp exactly: indigo at the zenith,
  // desaturated violet through the middle, and a narrow ember-gold horizon.
  const skybox = B.MeshBuilder.CreateSphere(
    'skyBox',
    { diameter: 1000, segments: 16, sideOrientation: B.Mesh.BACKSIDE },
    scene,
  );
  const skyboxMaterial = new B.ShaderMaterial(
    'universeSky',
    scene,
    {
      vertexSource: `
        precision highp float;
        attribute vec3 position;
        uniform mat4 worldViewProjection;
        void main(void) {
          gl_Position = worldViewProjection * vec4(position, 1.0);
        }
      `,
      fragmentSource: `
        precision highp float;
        uniform vec2 resolution;
        void main(void) {
          float y = clamp(gl_FragCoord.y / max(resolution.y, 1.0), 0.0, 1.0);
          vec3 c0 = vec3(0.867, 0.686, 0.502);
          vec3 c1 = vec3(0.722, 0.518, 0.365);
          vec3 c2 = vec3(0.541, 0.396, 0.325);
          vec3 c3 = vec3(0.388, 0.314, 0.310);
          vec3 c4 = vec3(0.278, 0.251, 0.298);
          vec3 c5 = vec3(0.204, 0.208, 0.267);
          vec3 c6 = vec3(0.149, 0.173, 0.235);
          vec3 color = mix(c0, c1, smoothstep(0.00, 0.14, y));
          color = mix(color, c2, smoothstep(0.14, 0.28, y));
          color = mix(color, c3, smoothstep(0.28, 0.45, y));
          color = mix(color, c4, smoothstep(0.45, 0.62, y));
          color = mix(color, c5, smoothstep(0.62, 0.80, y));
          color = mix(color, c6, smoothstep(0.80, 1.00, y));
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    },
    {
      attributes: ['position'],
      uniforms: ['worldViewProjection', 'resolution'],
    },
  );
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.setVector2(
    'resolution',
    new B.Vector2(engine.getRenderWidth(), engine.getRenderHeight()),
  );
  skybox.material = skyboxMaterial;
  skybox.isPickable = false;
  skybox.freezeWorldMatrix();

  // A quiet brass core keeps the objective legible without reviving the old
  // saturated orange Martian palette.
  const bjsPlanetMat = new B.PBRMaterial('planet', scene);
  bjsPlanetMat.albedoColor = new B.Color3(0.48, 0.34, 0.16);
  bjsPlanetMat.metallic = 0.05;
  bjsPlanetMat.roughness = 0.9;
  bjsPlanetMat.bumpTexture = new B.Texture(
    'https://playground.babylonjs.com/textures/rockn.png',
    scene,
  );
  bjsPlanetMat.bumpTexture.level = 1.5;
  bjsPlanetMat.freeze();

  function buildPlayer() {
    playerCollider = B.MeshBuilder.CreateBox(
      'collider',
      { width: 1.7, height: 4, depth: 1.7 },
      scene,
    );
    playerCollider.isVisible = false;
    playerCollider.checkCollisions = true;
    playerCollider.ellipsoid = new B.Vector3(0.78, 2, 0.78);

    playerVisual = new B.TransformNode('stickman', scene);
    playerVisual.parent = playerCollider;
    playerVisual.position.y = -2;
    playerVisual.rotation.y = Math.PI;

    const blackMat = new B.StandardMaterial('kawkabBlack', scene);
    blackMat.diffuseColor = new B.Color3(0.008, 0.009, 0.012);
    blackMat.specularColor = new B.Color3(0.5, 0.5, 0.52);
    blackMat.freeze();

    const starMat = new B.StandardMaterial('kawkabStars', scene);
    starMat.diffuseColor = new B.Color3(0.92, 0.91, 0.86);
    starMat.emissiveColor = new B.Color3(0.72, 0.74, 0.76);
    starMat.disableLighting = true;
    starMat.freeze();

    // Dr Kawkab's large constellation globe is both head and body, matching
    // the mascot in the Training Hub instead of the old generic stick figure.
    const torso = B.MeshBuilder.CreateSphere(
      'kawkabBody',
      { diameter: 2.5, segments: lowPower ? 20 : 28 },
      scene,
    );
    torso.position.y = PLAYER_BODY_Y;
    torso.material = blackMat;
    torso.parent = playerVisual;
    shadowGenerator.addShadowCaster(torso);

    const constellationPoints = [
      [-0.86, 0.62, 0.76],
      [-0.28, 0.95, 0.84],
      [0.37, 0.87, 0.88],
      [0.88, 0.48, 0.76],
      [-0.95, 0.05, 0.83],
      [-0.35, 0.28, 1.08],
      [0.28, 0.23, 1.13],
      [0.93, -0.02, 0.82],
      [-0.76, -0.62, 0.82],
      [-0.12, -0.82, 0.94],
      [0.58, -0.68, 0.88],
      [0.15, 1.08, 0.52],
      [-0.68, 0.68, -0.82],
      [0.08, 0.98, -0.9],
      [0.76, 0.5, -0.84],
      [-0.82, -0.24, -0.92],
      [0.04, -0.76, -1.0],
      [0.74, -0.42, -0.9],
    ].map(([x, y, z]) => new B.Vector3(x, y, z).normalize().scale(1.27));
    const constellationEdges = [
      [0, 1],
      [1, 2],
      [2, 3],
      [0, 4],
      [0, 5],
      [1, 5],
      [1, 11],
      [2, 6],
      [2, 11],
      [3, 7],
      [4, 5],
      [4, 8],
      [5, 6],
      [5, 8],
      [6, 7],
      [6, 9],
      [6, 10],
      [7, 10],
      [8, 9],
      [9, 10],
      [12, 13],
      [13, 14],
      [12, 15],
      [13, 16],
      [14, 17],
      [15, 16],
      [16, 17],
      [0, 12],
      [3, 14],
      [8, 15],
      [10, 17],
    ];
    const constellation = B.MeshBuilder.CreateLineSystem(
      'kawkabConstellation',
      {
        lines: constellationEdges.map(([a, b]) => [constellationPoints[a], constellationPoints[b]]),
      },
      scene,
    );
    constellation.color = new B.Color3(0.8, 0.82, 0.82);
    constellation.alpha = 0.78;
    constellation.parent = torso;

    constellationPoints.forEach((point, index) => {
      const star = B.MeshBuilder.CreateSphere(
        `kawkabStar_${index}`,
        { diameter: index % 4 === 0 ? 0.09 : 0.055, segments: 6 },
        scene,
      );
      star.position.copyFrom(point);
      star.material = starMat;
      star.parent = torso;
    });

    [-0.42, 0.42].forEach((x, index) => {
      const eye = B.MeshBuilder.CreateSphere(
        `kawkabEye_${index}`,
        { diameter: 0.34, segments: 12 },
        scene,
      );
      eye.position = new B.Vector3(x, 0.2, 1.19);
      eye.scaling = new B.Vector3(0.72, 1.08, 0.22);
      eye.material = starMat;
      eye.parent = torso;
    });

    const smile = B.MeshBuilder.CreateLines(
      'kawkabSmile',
      {
        points: [
          new B.Vector3(-0.3, -0.27, 1.22),
          new B.Vector3(-0.14, -0.38, 1.24),
          new B.Vector3(0, -0.42, 1.25),
          new B.Vector3(0.14, -0.38, 1.24),
          new B.Vector3(0.3, -0.27, 1.22),
        ],
      },
      scene,
    );
    smile.color = new B.Color3(0.96, 0.95, 0.9);
    smile.parent = torso;

    const leftHip = new B.TransformNode('leftHip', scene);
    leftHip.parent = torso;
    leftHip.position = new B.Vector3(-0.38, -1.03, 0);

    const rightHip = new B.TransformNode('rightHip', scene);
    rightHip.parent = torso;
    rightHip.position = new B.Vector3(0.38, -1.03, 0);

    const leftShoulder = new B.TransformNode('leftShoulder', scene);
    leftShoulder.parent = torso;
    leftShoulder.position = new B.Vector3(-1.05, 0.16, 0);

    const rightShoulder = new B.TransformNode('rightShoulder', scene);
    rightShoulder.parent = torso;
    rightShoulder.position = new B.Vector3(1.05, 0.16, 0);

    const legL = B.MeshBuilder.CreateCylinder(
      'legL',
      { height: 1.35, diameterTop: 0.22, diameterBottom: 0.14 },
      scene,
    );
    legL.position.y = -0.68;
    legL.material = blackMat;
    legL.parent = leftHip;
    shadowGenerator.addShadowCaster(legL);

    const legR = B.MeshBuilder.CreateCylinder(
      'legR',
      { height: 1.35, diameterTop: 0.22, diameterBottom: 0.14 },
      scene,
    );
    legR.position.y = -0.68;
    legR.material = blackMat;
    legR.parent = rightHip;
    shadowGenerator.addShadowCaster(legR);

    const armL = B.MeshBuilder.CreateCylinder(
      'armL',
      { height: 1.25, diameterTop: 0.2, diameterBottom: 0.13 },
      scene,
    );
    armL.position.y = -0.6;
    armL.material = blackMat;
    armL.parent = leftShoulder;
    shadowGenerator.addShadowCaster(armL);

    const armR = B.MeshBuilder.CreateCylinder(
      'armR',
      { height: 1.25, diameterTop: 0.2, diameterBottom: 0.13 },
      scene,
    );
    armR.position.y = -0.6;
    armR.material = blackMat;
    armR.parent = rightShoulder;
    shadowGenerator.addShadowCaster(armR);

    [leftShoulder, rightShoulder].forEach((shoulder, index) => {
      const hand = B.MeshBuilder.CreateSphere(
        `kawkabHand_${index}`,
        { diameter: 0.25, segments: 8 },
        scene,
      );
      hand.position.y = -1.24;
      hand.material = blackMat;
      hand.parent = shoulder;
    });

    [leftHip, rightHip].forEach((hip, index) => {
      const shoe = B.MeshBuilder.CreateSphere(
        `kawkabShoe_${index}`,
        { diameter: 0.38, segments: 10 },
        scene,
      );
      shoe.position = new B.Vector3(0, -1.4, 0.12);
      shoe.scaling = new B.Vector3(0.82, 0.5, 1.25);
      shoe.material = blackMat;
      shoe.parent = hip;
    });

    stickmanRig = {
      torso,
      leftHip,
      rightHip,
      leftShoulder,
      rightShoulder,
    };

    const playerLight = new B.PointLight('pLight', new B.Vector3(0, 3, 0), scene);
    playerLight.diffuse = new B.Color3(0.86, 0.72, 0.45);
    playerLight.intensity = 1.15;
    playerLight.parent = playerVisual;
  }

  function buildMaze() {
    function carve(x, y) {
      maze[y][x] = 0;
      const dirs = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ];
      dirs.sort(() => Math.random() - 0.5);

      for (let i = 0; i < dirs.length; i += 1) {
        const nx = x + dirs[i][0] * 2;
        const ny = y + dirs[i][1] * 2;
        if (nx > 0 && nx < SIZE - 1 && ny > 0 && ny < SIZE - 1 && maze[ny][nx] === 1) {
          maze[y + dirs[i][1]][x + dirs[i][0]] = 0;
          carve(nx, ny);
        }
      }
    }
    carve(1, 1);

    // Keep the procedural maze, then break up the perfect-maze tunnel pattern
    // with connected plazas and a broad outer promenade. Every clearing cuts
    // through existing paths, so the world stays fully reachable while giving
    // the player places to roam, turn around, and choose a direction.
    EXPLORATION_HUBS.forEach(({ x: hubX, y: hubY, size }) => {
      for (let y = hubY - size; y <= hubY + size; y += 1) {
        for (let x = hubX - size; x <= hubX + size; x += 1) {
          maze[y][x] = 0;
        }
      }
    });
    for (let step = 7; step <= 43; step += 1) {
      maze[7][step] = 0;
      maze[43][step] = 0;
      maze[step][7] = 0;
      maze[step][43] = 0;
    }

    const center = Math.floor(SIZE / 2);
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        maze[center + dy][center + dx] = 0;
      }
    }
    maze[center - 3][center] = 0;

    const wallBase = B.MeshBuilder.CreateBox(
      'wallBase',
      { width: CELL_SIZE, height: WALL_HEIGHT, depth: CELL_SIZE },
      scene,
    );
    const wallMat = new B.PBRMaterial('wallMat', scene);
    wallMat.albedoTexture = new B.Texture(
      'https://playground.babylonjs.com/textures/rock.png',
      scene,
    );
    wallMat.bumpTexture = new B.Texture(
      'https://playground.babylonjs.com/textures/rockn.png',
      scene,
    );
    wallMat.metallic = 0.05;
    wallMat.roughness = 0.9;
    wallMat.albedoColor = new B.Color3(0.62, 0.55, 0.45);
    wallMat.freeze();
    wallBase.material = wallMat;
    wallBase.isVisible = false;

    const offset = (SIZE * CELL_SIZE) / 2;

    for (let y = 0; y < SIZE; y += 1) {
      for (let x = 0; x < SIZE; x += 1) {
        if (maze[y][x] === 1) {
          const newWall = wallBase.createInstance(`w_${x}_${y}`);
          newWall.position = new B.Vector3(
            x * CELL_SIZE - offset,
            MAZE_OFFSET_Y + WALL_HEIGHT / 2,
            y * CELL_SIZE - offset,
          );
          newWall.checkCollisions = true;
          newWall.isMaze = true;
          newWall.freezeWorldMatrix();
          if (!lowPower) shadowGenerator.addShadowCaster(newWall);
        }
      }
    }

    const ground = B.MeshBuilder.CreateGround(
      'ground',
      {
        width: SIZE * CELL_SIZE + 10,
        height: SIZE * CELL_SIZE + 10,
      },
      scene,
    );
    const groundMat = new B.StandardMaterial('limestoneGround', scene);
    groundMat.diffuseColor = new B.Color3(0.34, 0.31, 0.27);
    groundMat.specularColor = new B.Color3(0.09, 0.08, 0.07);
    groundMat.freeze();
    ground.material = groundMat;
    ground.receiveShadows = true;
    ground.checkCollisions = true;
    ground.isMaze = true;
    ground.position.y = MAZE_OFFSET_Y;
    ground.freezeWorldMatrix();

    const landmarkMat = new B.StandardMaterial('explorationLandmarks', scene);
    landmarkMat.diffuseColor = new B.Color3(0.58, 0.45, 0.24);
    landmarkMat.emissiveColor = new B.Color3(0.2, 0.14, 0.06);
    landmarkMat.freeze();
    EXPLORATION_HUBS.forEach(({ x, y }, index) => {
      const ring = B.MeshBuilder.CreateTorus(
        `explorationRing_${index}`,
        { diameter: 2.4 + (index % 2) * 0.45, thickness: 0.12, tessellation: 24 },
        scene,
      );
      ring.position = new B.Vector3(
        x * CELL_SIZE - offset,
        MAZE_OFFSET_Y + 0.08,
        y * CELL_SIZE - offset,
      );
      ring.rotation.x = Math.PI / 2;
      ring.material = landmarkMat;
      ring.isPickable = false;
      ring.freezeWorldMatrix();

      const marker = B.MeshBuilder.CreateCylinder(
        `explorationMarker_${index}`,
        { height: 0.7 + (index % 3) * 0.18, diameterTop: 0.12, diameterBottom: 0.3 },
        scene,
      );
      marker.position = new B.Vector3(ring.position.x, MAZE_OFFSET_Y + 0.35, ring.position.z);
      marker.material = landmarkMat;
      marker.isPickable = false;
      marker.freezeWorldMatrix();
    });

    playerCollider.position = new B.Vector3(
      CELL_SIZE - offset,
      MAZE_OFFSET_Y + 2,
      CELL_SIZE - offset,
    );

    bossPosition = new B.Vector3(
      center * CELL_SIZE - offset,
      MAZE_OFFSET_Y + 0.5,
      center * CELL_SIZE - offset,
    );
    const bossOrb = B.MeshBuilder.CreateSphere('bossOrb', { diameter: 2.5 }, scene);
    bossOrb.material = bjsPlanetMat;
    bossOrb.position = bossPosition;
    bossOrb.freezeWorldMatrix();

    const nodeLight = new B.PointLight(
      'nodeLight',
      new B.Vector3(bossPosition.x, MAZE_OFFSET_Y + 3, bossPosition.z),
      scene,
    );
    nodeLight.diffuse = new B.Color3(0.82, 0.66, 0.34);
    nodeLight.intensity = 1.6;
  }

  function setupEffects() {
    const dynamicTexture = new B.DynamicTexture('dustTex', 64, scene);
    const context = dynamicTexture.getContext();
    context.fillStyle = 'rgba(190,165,116,1)';
    context.beginPath();
    context.arc(32, 32, 30, 0, Math.PI * 2);
    context.fill();
    dynamicTexture.update();

    particleSystem = new B.ParticleSystem('dust', 500, scene);
    particleSystem.particleTexture = dynamicTexture;
    particleSystem.emitter = playerCollider;
    particleSystem.color1 = new B.Color4(0.72, 0.62, 0.42, 0.5);
    particleSystem.colorDead = new B.Color4(0, 0, 0, 0);
    particleSystem.minSize = 0.3;
    particleSystem.maxSize = 0.8;
    particleSystem.minLifeTime = 0.2;
    particleSystem.maxLifeTime = 0.5;
    particleSystem.createSphereEmitter(0.5);
    particleSystem.emitRate = 0;
  }

  function initVirtualJoystick() {
    const context = joystickCanvas.getContext('2d');
    let touchPosition = null;
    let animationFrame = 0;
    let isMouseJoy = false;

    function drawJoystick() {
      context.clearRect(0, 0, 150, 150);
      context.beginPath();
      context.arc(75, 75, 50, 0, Math.PI * 2);
      context.fillStyle = 'rgba(255, 255, 255, 0.1)';
      context.fill();
      context.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      context.stroke();

      let knobX = 75;
      let knobY = 75;
      if (touchPosition) {
        knobX = touchPosition.x;
        knobY = touchPosition.y;
      }
      context.beginPath();
      context.arc(knobX, knobY, 25, 0, Math.PI * 2);
      context.fillStyle = 'rgba(255, 255, 255, 0.7)';
      context.fill();
      animationFrame = requestAnimationFrame(drawJoystick);
    }

    function updateJoystick(event) {
      event.preventDefault();
      let clientX;
      let clientY;
      if (event.touches) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      const rect = joystickCanvas.getBoundingClientRect();
      const deltaX = clientX - rect.left - 75;
      const deltaY = clientY - rect.top - 75;
      const distance = Math.min(Math.hypot(deltaX, deltaY), 50);
      const angle = Math.atan2(deltaY, deltaX);

      touchPosition = {
        x: 75 + Math.cos(angle) * distance,
        y: 75 + Math.sin(angle) * distance,
      };
      joyInput.x = Math.cos(angle) * (distance / 50);
      joyInput.z = -Math.sin(angle) * (distance / 50);
    }

    function resetJoystick() {
      touchPosition = null;
      joyInput.x = 0;
      joyInput.z = 0;
    }

    function handleMouseDown(event) {
      isMouseJoy = true;
      updateJoystick(event);
    }
    function handleMouseMove(event) {
      if (isMouseJoy) updateJoystick(event);
    }
    function handleMouseUp() {
      isMouseJoy = false;
      resetJoystick();
    }

    joystickCanvas.addEventListener('touchstart', updateJoystick, {
      passive: false,
    });
    joystickCanvas.addEventListener('touchmove', updateJoystick, {
      passive: false,
    });
    joystickCanvas.addEventListener('touchend', resetJoystick);
    joystickCanvas.addEventListener('mousedown', handleMouseDown);
    joystickCanvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    drawJoystick();

    return () => {
      cancelAnimationFrame(animationFrame);
      joystickCanvas.removeEventListener('touchstart', updateJoystick);
      joystickCanvas.removeEventListener('touchmove', updateJoystick);
      joystickCanvas.removeEventListener('touchend', resetJoystick);
      joystickCanvas.removeEventListener('mousedown', handleMouseDown);
      joystickCanvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }

  function setupControls() {
    scene.actionManager = new B.ActionManager(scene);
    scene.actionManager.registerAction(
      new B.ExecuteCodeAction(B.ActionManager.OnKeyDownTrigger, (event) => {
        inputMap[event.sourceEvent.key.toLowerCase()] = true;
      }),
    );
    scene.actionManager.registerAction(
      new B.ExecuteCodeAction(B.ActionManager.OnKeyUpTrigger, (event) => {
        inputMap[event.sourceEvent.key.toLowerCase()] = false;
      }),
    );

    const speed = 0.35;
    let walkCycle = 0;

    scene.onBeforeRenderObservable.add(() => {
      if (!isMazeActive || isAtBoss) return;

      const moveVector = new B.Vector3(0, -0.2, 0);
      let isMoving = false;
      let isManualInput = false;
      let directionX = 0;
      let directionZ = 0;

      if (inputMap.w || inputMap.arrowup) {
        directionZ = 1;
        isManualInput = true;
      }
      if (inputMap.s || inputMap.arrowdown) {
        directionZ = -1;
        isManualInput = true;
      }
      if (inputMap.a || inputMap.arrowleft) {
        directionX = -1;
        isManualInput = true;
      }
      if (inputMap.d || inputMap.arrowright) {
        directionX = 1;
        isManualInput = true;
      }

      if (isManualInput) {
        targetPosition = null;
        const length = Math.sqrt(directionX * directionX + directionZ * directionZ);
        if (length > 0) {
          directionX /= length;
          directionZ /= length;
        }
        isMoving = true;
      } else if (Math.abs(joyInput.x) > 0.05 || Math.abs(joyInput.z) > 0.05) {
        targetPosition = null;
        directionX = joyInput.x;
        directionZ = joyInput.z;
        isMoving = true;
      } else if (targetPosition) {
        const direction = targetPosition.subtract(playerCollider.position);
        direction.y = 0;
        const distance = direction.length();

        if (distance > 0.5) {
          direction.normalize();
          directionX = direction.x;
          directionZ = direction.z;
          isMoving = true;
        } else {
          targetPosition = null;
        }
      }

      if (isMoving) {
        const frameScale = Math.min(engine.getDeltaTime() / (1000 / 60), 2);
        const currentSpeed = Math.sqrt(directionX * directionX + directionZ * directionZ) * speed;
        moveVector.x = directionX * speed * frameScale;
        moveVector.z = directionZ * speed * frameScale;

        const targetAngle = Math.atan2(directionX, directionZ);
        playerVisual.rotation.y = B.Scalar.LerpAngle(playerVisual.rotation.y, targetAngle, 0.2);

        walkCycle += currentSpeed * 1.5 * frameScale;
        const swing = Math.sin(walkCycle) * (Math.PI / 4);
        stickmanRig.leftHip.rotation.x = swing;
        stickmanRig.rightHip.rotation.x = -swing;
        stickmanRig.leftShoulder.rotation.x = -swing;
        stickmanRig.rightShoulder.rotation.x = swing;
        stickmanRig.torso.rotation.x = B.Scalar.Lerp(
          stickmanRig.torso.rotation.x,
          Math.PI / 16,
          0.1,
        );
        stickmanRig.torso.position.y = PLAYER_BODY_Y + Math.abs(Math.sin(walkCycle * 2)) * 0.12;

        particleSystem.emitRate = Math.abs(Math.sin(walkCycle * 2)) < 0.2 ? 40 : 0;
      } else {
        stickmanRig.leftHip.rotation.x = B.Scalar.Lerp(stickmanRig.leftHip.rotation.x, 0, 0.1);
        stickmanRig.rightHip.rotation.x = B.Scalar.Lerp(stickmanRig.rightHip.rotation.x, 0, 0.1);
        stickmanRig.leftShoulder.rotation.x = B.Scalar.Lerp(
          stickmanRig.leftShoulder.rotation.x,
          0,
          0.1,
        );
        stickmanRig.rightShoulder.rotation.x = B.Scalar.Lerp(
          stickmanRig.rightShoulder.rotation.x,
          0,
          0.1,
        );
        stickmanRig.torso.rotation.x = B.Scalar.Lerp(stickmanRig.torso.rotation.x, 0, 0.1);
        stickmanRig.torso.position.y = B.Scalar.Lerp(
          stickmanRig.torso.position.y,
          PLAYER_BODY_Y,
          0.1,
        );
        particleSystem.emitRate = 0;
      }

      playerCollider.moveWithCollisions(moveVector);

      if (B.Vector3.Distance(playerCollider.position, bossPosition) < 5) {
        isAtBoss = true;
        isMazeActive = false;
        particleSystem.emitRate = 0;

        const finalAngle = Math.atan2(
          bossPosition.x - playerCollider.position.x,
          bossPosition.z - playerCollider.position.z,
        );
        playerVisual.rotation.y = finalAngle;
        stickmanRig.torso.rotation.x = 0;
        stickmanRig.leftHip.rotation.x = 0;
        stickmanRig.rightHip.rotation.x = 0;
        onVictory();
      }
    });
  }

  buildPlayer();
  buildMaze();
  setupEffects();
  setupControls();
  const disposeJoystick = initVirtualJoystick();

  camera.target.copyFrom(playerCollider.position);
  camera.target.y += 0.55;
  const cameraTarget = camera.target.clone();

  const pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
    if (!isMazeActive || isAtBoss) return;

    if (pointerInfo.type === B.PointerEventTypes.POINTERDOWN) {
      isPointerDown = true;
      scene.skipPointerMovePicking = false;
      if (pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh.name === 'ground') {
        targetPosition = pointerInfo.pickInfo.pickedPoint.clone();
        targetPosition.y = playerCollider.position.y;
      }
    } else if (
      pointerInfo.type === B.PointerEventTypes.POINTERMOVE &&
      isPointerDown &&
      pointerInfo.pickInfo.hit &&
      pointerInfo.pickInfo.pickedMesh.name === 'ground'
    ) {
      targetPosition = pointerInfo.pickInfo.pickedPoint.clone();
      targetPosition.y = playerCollider.position.y;
    } else if (pointerInfo.type === B.PointerEventTypes.POINTERUP) {
      isPointerDown = false;
      scene.skipPointerMovePicking = true;
    }
  });

  const followPlayer = () => {
    if (isMazeActive && !isAtBoss) {
      cameraTarget.x = B.Scalar.Lerp(cameraTarget.x, playerCollider.position.x, 0.12);
      cameraTarget.y = B.Scalar.Lerp(cameraTarget.y, playerCollider.position.y + 0.55, 0.12);
      cameraTarget.z = B.Scalar.Lerp(cameraTarget.z, playerCollider.position.z, 0.12);
      camera.target.copyFrom(cameraTarget);
    }
  };
  scene.registerBeforeRender(followPlayer);

  const render = () => scene.render();
  const resize = () => {
    engine.resize();
    syncCameraForViewport();
    skyboxMaterial.setVector2(
      'resolution',
      new B.Vector2(engine.getRenderWidth(), engine.getRenderHeight()),
    );
  };
  engine.runRenderLoop(render);
  window.addEventListener('resize', resize);
  scene.executeWhenReady(onReady);

  return () => {
    isMazeActive = false;
    disposeJoystick();
    window.removeEventListener('resize', resize);
    scene.onPointerObservable.remove(pointerObserver);
    scene.unregisterBeforeRender(followPlayer);
    engine.stopRenderLoop(render);
    scene.dispose();
    engine.dispose();
  };
}

export default function MartianMaze({
  isAr = false,
  onExit,
  onReady,
  onLoadError,
  entryCovered = false,
}) {
  const canvasRef = useRef(null);
  const joystickCanvasRef = useRef(null);
  const exitTimerRef = useRef(0);
  const [phase, setPhase] = useState('loading');
  const [attempt, setAttempt] = useState(0);

  const beginExit = () => {
    if (phase === 'exiting') return;
    setPhase('exiting');
    exitTimerRef.current = window.setTimeout(onExit, 520);
  };

  useEffect(
    () => () => {
      window.clearTimeout(exitTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    let disposed = false;
    let disposeWorld;
    setPhase('loading');

    loadBabylon()
      .then((B) => {
        if (disposed || !canvasRef.current || !joystickCanvasRef.current) {
          return;
        }
        disposeWorld = createExactMazeWorld({
          B,
          canvas: canvasRef.current,
          joystickCanvas: joystickCanvasRef.current,
          onReady: () => {
            if (!disposed) {
              setPhase('ready');
              onReady?.();
            }
          },
          onVictory: () => {
            if (!disposed) setPhase('victory');
          },
        });
      })
      .catch(() => {
        if (!disposed) {
          setPhase('error');
          onLoadError?.();
        }
      });

    return () => {
      disposed = true;
      disposeWorld?.();
    };
  }, [attempt, onLoadError, onReady]);

  return (
    <div
      className={`martian-maze-root phase-${phase}${entryCovered ? ' is-entry-covered' : ''}`}
      role="application"
      aria-label="Martian labyrinth"
    >
      <canvas ref={canvasRef} className="martian-maze-canvas" />

      <div
        className={`martian-maze-joystick${phase === 'ready' ? ' is-active' : ''}`}
        aria-hidden="true"
      >
        <canvas
          ref={joystickCanvasRef}
          className="martian-maze-joystick-canvas"
          width="150"
          height="150"
        />
      </div>

      <div className="martian-maze-content">
        {phase === 'ready' && (
          <>
            <button type="button" className="martian-maze-exit" onClick={beginExit}>
              Return to Universe
            </button>
            <div className="martian-maze-instruction">
              {isAr
                ? 'استكشف بعصا التحكم أو WASD • اضغط على مسار للمشي'
                : 'Explore with Joystick or WASD • tap a path to walk'}
            </div>
          </>
        )}

        {phase === 'error' && (
          <div className="martian-maze-system-panel" role="alert">
            <strong>The labyrinth could not start.</strong>
            <button type="button" onClick={() => setAttempt((value) => value + 1)}>
              Try Again
            </button>
            <button type="button" onClick={beginExit}>
              Return to Universe
            </button>
          </div>
        )}

        {phase === 'victory' && (
          <div className="martian-maze-victory glass-panel" role="dialog" aria-modal="true">
            <div className="martian-maze-hero-title">Core Reached</div>
            <div className="martian-maze-hero-sub">
              You have successfully navigated the Martian Labyrinth and located the Core.
            </div>
            <button type="button" className="martian-maze-cta" onClick={beginExit}>
              Return to Universe
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
