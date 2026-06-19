/**
 * The Labyrinth — the "Martian System" reference look: dark space backdrop +
 * skybox + stars, PBR rock walls, grass ground, a warm amber glow following the
 * player, bloom, and a fixed straight-down (top-down) camera with joystick / WASD
 * / tap-to-move.
 *
 * Two things differ from the reference, by request:
 *   1) the player is the game's own character rig (not the stickman),
 *   2) the maze is carved with MORE OPEN SPACE.
 * Returns { scene, interact, jump, dispose }.
 */
import { buildCharacter } from '../characters3d';
import { createKit } from '../worldKit';

const B = () => window.BABYLON;

const MAP = 25, CELL = 4, WALL_H = CELL * 1.5;
const TEX = 'https://playground.babylonjs.com/textures/';

export function buildMazeRoom({ engine, canvas, overlayEl, ctx, inputRef }) {
  const Bb = B();
  const scene = new Bb.Scene(engine);
  if (Bb.ScenePerformancePriority) scene.performancePriority = Bb.ScenePerformancePriority.Intermediate;
  scene.clearColor = new Bb.Color4(0.01, 0.01, 0.02, 1);
  scene.collisionsEnabled = true;
  const lowPerf = !!ctx.lowPerf;

  // ── Maze grid: recursive backtracker, then opened up for MORE SPACE ──
  const maze = Array.from({ length: MAP }, () => new Array(MAP).fill(1));
  (function carve(x, y) {
    maze[y][x] = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].sort(() => Math.random() - 0.5);
    for (const [dx, dy] of dirs) {
      const nx = x + dx * 2, ny = y + dy * 2;
      if (nx > 0 && nx < MAP - 1 && ny > 0 && ny < MAP - 1 && maze[ny][nx] === 1) { maze[y + dy][x + dx] = 0; carve(nx, ny); }
    }
  })(1, 1);
  const cc = Math.floor(MAP / 2);
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const yy = cc + dy, xx = cc + dx; if (xx > 0 && xx < MAP - 1 && yy > 0 && yy < MAP - 1) maze[yy][xx] = 0; }
  for (let y = 1; y < MAP - 1; y++) for (let x = 1; x < MAP - 1; x++) {
    if (maze[y][x] !== 1) continue;
    let open = 0; if (maze[y - 1][x] === 0) open++; if (maze[y + 1][x] === 0) open++; if (maze[y][x - 1] === 0) open++; if (maze[y][x + 1] === 0) open++;
    if (open >= 2 && Math.random() < 0.45) maze[y][x] = 0;
  }
  const offset = (MAP * CELL) / 2;

  // ── Camera: fixed isometric (matches the gym/attention iso framing) ──
  //   gym uses height 16 / dist 14 → beta ≈ atan(14/16) ≈ 0.72, radius ≈ 21.3, fov 0.7.
  // Pokémon-style overworld camera: fairly top-down, moderate zoom, follows player.
  const camera = new Bb.ArcRotateCamera('mzCam', -Math.PI / 2, 0.5, 34, Bb.Vector3.Zero(), scene);
  camera.fov = 0.7;
  camera.minZ = 0.1; camera.maxZ = 2000;

  // ── Lights ──
  const ambient = new Bb.HemisphericLight('amb', new Bb.Vector3(0, 1, 0), scene);
  ambient.intensity = 0.3;
  const sun = new Bb.DirectionalLight('sun', new Bb.Vector3(-1, -2, 1), scene);
  sun.intensity = 1.0; sun.position = new Bb.Vector3(0, 50, 0);
  // Phones: skip the whole shadow-map pass (stub caster sink); desktop keeps soft shadows.
  const shadowGenerator = lowPerf
    ? { addShadowCaster() {}, removeShadowCaster() {}, getShadowMap() { return null; }, dispose() {} }
    : (() => { const sg = new Bb.ShadowGenerator(1024, sun); sg.useBlurExponentialShadowMap = true; sg.blurKernel = 32; return sg; })();

  // ── Bloom (costly full-screen pass) — desktop only ──
  if (!lowPerf) {
    const pipeline = new Bb.DefaultRenderingPipeline('mzPipe', true, scene, [camera]);
    pipeline.bloomEnabled = true; pipeline.bloomThreshold = 0.3; pipeline.bloomWeight = 1.2;
    pipeline.fxaaEnabled = true;
  }

  // ── Skybox + stars ──
  const skybox = Bb.MeshBuilder.CreateBox('skyBox', { size: 1000 }, scene);
  const skyMat = new Bb.StandardMaterial('skyBox', scene);
  skyMat.backFaceCulling = false;
  skyMat.reflectionTexture = new Bb.CubeTexture(TEX + 'skybox', scene);
  skyMat.reflectionTexture.coordinatesMode = Bb.Texture.SKYBOX_MODE;
  skyMat.diffuseColor = new Bb.Color3(0, 0, 0); skyMat.specularColor = new Bb.Color3(0, 0, 0);
  skybox.material = skyMat; skybox.infiniteDistance = true;

  const stars = new Bb.ParticleSystem('stars', lowPerf ? 1 : 2500, scene);
  stars.particleTexture = new Bb.Texture(TEX + 'flare.png', scene);
  stars.emitter = new Bb.Vector3(0, 0, 80);
  stars.minEmitBox = new Bb.Vector3(-60, -60, 0); stars.maxEmitBox = new Bb.Vector3(60, 60, 0);
  stars.direction1 = new Bb.Vector3(0, 0, -1); stars.direction2 = new Bb.Vector3(0, 0, -1);
  stars.minEmitPower = 40; stars.maxEmitPower = 80; stars.updateSpeed = 0.015;
  stars.color1 = new Bb.Color4(1, 0.8, 0.6, 1); stars.color2 = new Bb.Color4(1, 0.4, 0.2, 0.8);
  stars.colorDead = new Bb.Color4(0, 0, 0, 0); stars.minSize = 0.05; stars.maxSize = 0.4;
  stars.minLifeTime = 1; stars.maxLifeTime = 3; stars.emitRate = 1200;
  if (!lowPerf) stars.start(); // phones: skybox already gives a starfield backdrop

  // ── Ground (grass) ──
  const ground = Bb.MeshBuilder.CreateGround('ground', { width: MAP * CELL + 10, height: MAP * CELL + 10 }, scene);
  const groundMat = new Bb.StandardMaterial('grassMat', scene);
  const grass = new Bb.Texture(TEX + 'grass.png', scene); grass.uScale = 25; grass.vScale = 25;
  groundMat.diffuseTexture = grass; groundMat.specularColor = new Bb.Color3(0.05, 0.05, 0.05);
  groundMat.maxSimultaneousLights = lowPerf ? 2 : 4;
  ground.material = groundMat; ground.receiveShadows = !lowPerf; ground.checkCollisions = true;

  // ── Walls (PBR rock, instanced) ──
  const wallBase = Bb.MeshBuilder.CreateBox('wallBase', { width: CELL, height: WALL_H, depth: CELL }, scene);
  let wallMat;
  if (lowPerf) {
    // Phones: plain StandardMaterial — no PBR/IBL/normal-map shader cost.
    const sm = new Bb.StandardMaterial('wallMat', scene);
    sm.diffuseTexture = new Bb.Texture(TEX + 'rock.png', scene);
    sm.diffuseColor = new Bb.Color3(0.75, 0.42, 0.32); // warm rock tint
    sm.specularColor = new Bb.Color3(0, 0, 0);
    sm.maxSimultaneousLights = 2;
    wallMat = sm;
  } else {
    const pm = new Bb.PBRMaterial('wallMat', scene);
    pm.albedoTexture = new Bb.Texture(TEX + 'rock.png', scene);
    pm.bumpTexture = new Bb.Texture(TEX + 'rockn.png', scene);
    pm.metallic = 0.2; pm.roughness = 0.9;
    pm.albedoColor = new Bb.Color3(0.5, 0.2, 0.1);
    pm.maxSimultaneousLights = 4;
    wallMat = pm;
  }
  wallBase.material = wallMat; wallBase.isVisible = false;
  for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
    if (maze[y][x] !== 1) continue;
    const w = wallBase.createInstance('w_' + x + '_' + y);
    w.position = new Bb.Vector3(x * CELL - offset, WALL_H / 2, y * CELL - offset);
    w.checkCollisions = true; w.freezeWorldMatrix();
    if (!lowPerf) shadowGenerator.addShadowCaster(w);
  }

  // ── Player: the game's own character rig ──
  const playerCollider = Bb.MeshBuilder.CreateBox('collider', { width: 1.5, height: 4, depth: 1.5 }, scene);
  playerCollider.isVisible = false; playerCollider.checkCollisions = true;
  playerCollider.ellipsoid = new Bb.Vector3(0.7, 2, 0.7);
  playerCollider.position = new Bb.Vector3(1 * CELL - offset, 2, 1 * CELL - offset);

  const kit = createKit(Bb, scene, lowPerf);
  const { rig } = buildCharacter(Bb, scene, playerCollider, shadowGenerator, ctx.character || 'male', ctx.equipped || {}, kit);
  rig.root.position.y = -2.0; rig.root.scaling.setAll(0.85);
  rig.root.getChildMeshes().forEach((m) => {       // drop self-lit rim so bloom doesn't whiteout the player
    const mt = m.material;
    if (mt && mt.emissiveColor) { mt.emissiveFresnelParameters = null; mt.emissiveColor = Bb.Color3.Black(); }
  });

  const playerLight = new Bb.PointLight('pLight', new Bb.Vector3(0, 3, 0), scene);
  playerLight.diffuse = new Bb.Color3(1, 0.6, 0.2); playerLight.intensity = 1.8; playerLight.range = 22;
  playerLight.parent = playerCollider;

  // ── Core at the centre ──
  const corePos = new Bb.Vector3(cc * CELL - offset, 0.5, cc * CELL - offset);
  const core = Bb.MeshBuilder.CreateSphere('core', { diameter: 2.5, segments: lowPerf ? 12 : 24 }, scene);
  if (lowPerf) {
    const cm = new Bb.StandardMaterial('coreMat', scene);
    cm.diffuseColor = new Bb.Color3(0.9, 0.35, 0.1); cm.emissiveColor = new Bb.Color3(1, 0.45, 0.1);
    cm.specularColor = new Bb.Color3(0, 0, 0); core.material = cm;
  } else {
    const cm = new Bb.PBRMaterial('coreMat', scene);
    cm.albedoColor = new Bb.Color3(0.9, 0.35, 0.1); cm.emissiveColor = new Bb.Color3(1, 0.4, 0.05);
    cm.emissiveIntensity = 2; cm.metallic = 0; cm.roughness = 0.6; core.material = cm;
  }
  core.position = corePos;
  // Core glow point-light — desktop only (one fewer light on phones).
  if (!lowPerf) {
    const coreLight = new Bb.PointLight('coreLight', new Bb.Vector3(corePos.x, 3, corePos.z), scene);
    coreLight.diffuse = new Bb.Color3(1, 0.4, 0); coreLight.intensity = 2; coreLight.range = 18;
  }

  // ── Scene-level perf: skybox fills every pixel (skip the per-frame clear) and
  //    stop per-frame material dirty-checks now that everything is built. ──
  scene.autoClear = false;
  scene.blockMaterialDirtyMechanism = true;

  // ── HUD ──
  overlayEl.innerHTML = `
    <div class="rh-zone"><div class="rh-zone-k">Explore</div><div class="rh-zone-v">The Labyrinth</div></div>
    <div class="rh-prompt" id="rhPrompt"></div>
    <div class="rh-instr">Joystick / WASD to move · reach the glowing core</div>`;
  const promptEl = overlayEl.querySelector('#rhPrompt');

  // ── Controls: WASD + joystick (host inputRef) + tap-to-move ──
  const inputMap = {};
  const onKeyDown = (e) => { inputMap[e.key.toLowerCase()] = true; };
  const onKeyUp = (e) => { inputMap[e.key.toLowerCase()] = false; };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  let targetPosition = null, pointerDown = false;
  const ptr = scene.onPointerObservable.add((pi) => {
    const t = pi.type;
    if (t === Bb.PointerEventTypes.POINTERDOWN) {
      pointerDown = true;
      if (pi.pickInfo.hit && pi.pickInfo.pickedMesh && pi.pickInfo.pickedMesh.name === 'ground') { targetPosition = pi.pickInfo.pickedPoint.clone(); targetPosition.y = playerCollider.position.y; }
    } else if (t === Bb.PointerEventTypes.POINTERMOVE) {
      if (pointerDown && pi.pickInfo.hit && pi.pickInfo.pickedMesh && pi.pickInfo.pickedMesh.name === 'ground') { targetPosition = pi.pickInfo.pickedPoint.clone(); targetPosition.y = playerCollider.position.y; }
    } else if (t === Bb.PointerEventTypes.POINTERUP) { pointerDown = false; }
  });

  const isAr = ctx.currentLang === 'ar';
  let done = false, lastPrompt = '';

  const SPEED = 0.32;
  let walkCycle = 0, prevHeading = 0;
  const beforeRender = () => {
    const time = performance.now() / 1000;
    skybox.rotation.y += 0.0003;
    if (done) return;

    const inp = inputRef?.current || { mx: 0, my: 0 };
    let dirX = 0, dirZ = 0;
    if (inputMap['w'] || inputMap['arrowup']) dirZ = 1;
    if (inputMap['s'] || inputMap['arrowdown']) dirZ = -1;
    if (inputMap['a'] || inputMap['arrowleft']) dirX = -1;
    if (inputMap['d'] || inputMap['arrowright']) dirX = 1;
    let isMoving = dirX !== 0 || dirZ !== 0;
    if (isMoving) targetPosition = null;
    else if (Math.abs(inp.mx) > 0.1 || Math.abs(inp.my) > 0.1) { dirX = inp.mx; dirZ = -inp.my; isMoving = true; targetPosition = null; }
    else if (targetPosition) {
      const d = targetPosition.subtract(playerCollider.position); d.y = 0;
      if (d.length() > 0.6) { d.normalize(); dirX = d.x; dirZ = d.z; isMoving = true; } else targetPosition = null;
    }

    const move = new Bb.Vector3(0, -0.25, 0);
    let heading = prevHeading;
    if (isMoving) {
      const mag = Math.min(1, Math.hypot(dirX, dirZ));
      if (mag > 0) { dirX /= (mag || 1); dirZ /= (mag || 1); }
      move.x = dirX * SPEED; move.z = dirZ * SPEED;
      heading = Math.atan2(dirX, dirZ);
      rig.root.rotation.y = Bb.Scalar.LerpAngle(rig.root.rotation.y, heading, 0.25);
      walkCycle += SPEED * mag * 2.6;
    }
    playerCollider.moveWithCollisions(move);

    let yawVel = heading - prevHeading;
    if (yawVel > Math.PI) yawVel -= Math.PI * 2; if (yawVel < -Math.PI) yawVel += Math.PI * 2;
    prevHeading = heading;
    rig.update(isMoving, walkCycle, time, yawVel);

    camera.target.x = playerCollider.position.x;
    camera.target.z = playerCollider.position.z;

    // Intentional return: near the core, prompt the player to press USE.
    const near = Bb.Vector3.Distance(playerCollider.position, corePos) < 4.5;
    const pr = near ? (isAr ? '▶ اضغط USE للعودة إلى القاعة' : '▶ press USE to return to the Hall') : '';
    if (pr !== lastPrompt) { lastPrompt = pr; promptEl.textContent = pr; promptEl.classList.toggle('show', !!pr); }
  };
  scene.registerBeforeRender(beforeRender);

  // USE near the core → reach it and return to the Hall (intentional, not auto).
  function tryInteract() {
    if (done) return;
    if (Bb.Vector3.Distance(playerCollider.position, corePos) < 4.5) {
      done = true;
      ctx.playSfx?.('chime'); ctx.updateXP?.(50);
      ctx.goToRoom('hall');
    }
  }

  return {
    scene, interact: tryInteract, jump: () => {},
    dispose() {
      scene.unregisterBeforeRender(beforeRender);
      scene.onPointerObservable.remove(ptr);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      overlayEl.innerHTML = '';
      scene.dispose();
    },
  };
}
