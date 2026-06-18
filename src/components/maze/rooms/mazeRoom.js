/**
 * The Labyrinth — an explorable procedural maze room.
 *
 * The maze GRID generator is ported (engine-agnostic, pure JS) from the
 * standalone "Maze Zombies" Three.js prototype: DFS carve → central hall →
 * cardinal + diagonal corridors → loop-carving → quarter rooms. Only the
 * RENDERING is done the Babylon way here:
 *   • all walls are ONE box mesh drawn with thin instances (1 draw call),
 *   • collisions are a cheap O(1) grid lookup (gridCollide) instead of
 *     per-wall mesh collisions — important for phones,
 *   • open-top, low walls + a higher chase cam so the third-person camera
 *     reads the maze from above-behind without clipping corridor walls.
 *
 * This is the space the army-recruitment NPCs will eventually stand in.
 * Returns { scene, interact, jump, dispose }.
 */
import { setupControls } from './roomControls';
import { createNpcKit } from './npc';

const B = window.BABYLON;

const MAP = 21;       // grid cells per side (odd → clean DFS)
const TILE = 4;       // world units per cell
const WALL_H = 3.0;   // wall height — encloses the corridors for the GTA-style cam
const HALF = (MAP * TILE) / 2;

// cell (gx,gz) → world centre (maze centred on origin)
const wx = (gx) => (gx - MAP / 2 + 0.5) * TILE;
const wz = (gz) => (gz - MAP / 2 + 0.5) * TILE;
// world → grid cell
const gAt = (w) => Math.floor(w / TILE + MAP / 2);

function generateGrid() {
  const sz = MAP;
  const grid = Array.from({ length: sz }, () => new Array(sz).fill(1));

  // 1) DFS perfect maze on odd cells
  const st = [[1, 1]]; grid[1][1] = 0;
  while (st.length) {
    const [cx, cy] = st[st.length - 1], n = [];
    if (cx > 1 && grid[cy][cx - 2]) n.push([-2, 0]);
    if (cx < sz - 2 && grid[cy][cx + 2]) n.push([2, 0]);
    if (cy > 1 && grid[cy - 2][cx]) n.push([0, -2]);
    if (cy < sz - 2 && grid[cy + 2][cx]) n.push([0, 2]);
    if (n.length) {
      const [dx, dy] = n[Math.floor(Math.random() * n.length)];
      grid[cy + dy / 2][cx + dx / 2] = 0; grid[cy + dy][cx + dx] = 0;
      st.push([cx + dx, cy + dy]);
    } else st.pop();
  }

  const center = Math.floor(sz / 2);
  const hall = 3;

  // 2) central open hall
  for (let y = center - hall; y <= center + hall; y++)
    for (let x = center - hall; x <= center + hall; x++)
      if (x > 0 && x < sz - 1 && y > 0 && y < sz - 1) grid[y][x] = 0;

  // 3) cardinal corridors (2 wide) from centre to edges
  for (let y = 1; y < center - hall; y++) { grid[y][center] = 0; grid[y][center - 1] = 0; }
  for (let y = center + hall + 1; y < sz - 1; y++) { grid[y][center] = 0; grid[y][center + 1] = 0; }
  for (let x = 1; x < center - hall; x++) { grid[center][x] = 0; grid[center - 1][x] = 0; }
  for (let x = center + hall + 1; x < sz - 1; x++) { grid[center][x] = 0; grid[center + 1][x] = 0; }

  // 4) diagonal corridors toward the corners
  for (let i = 1; i < center - hall; i++) {
    const a = center - hall - i, b = center + hall + i;
    if (a > 0) { grid[a][a] = 0; grid[a][a + 1] = 0; }
    if (b < sz - 1) { grid[b][b] = 0; grid[b][b - 1] = 0; }
    if (b < sz - 1 && a > 0) { grid[a][b] = 0; grid[a][b - 1] = 0; grid[b][a] = 0; grid[b][a + 1] = 0; }
  }

  // 5) loop-carving — remove ~30% of internal walls that join two open cells
  for (let y = 2; y < sz - 2; y++)
    for (let x = 2; x < sz - 2; x++)
      if (grid[y][x] === 1 && Math.random() < 0.3) {
        let open = 0;
        if (grid[y - 1][x] === 0) open++; if (grid[y + 1][x] === 0) open++;
        if (grid[y][x - 1] === 0) open++; if (grid[y][x + 1] === 0) open++;
        if (open >= 2) grid[y][x] = 0;
      }

  // 6) small rooms at the quarter points (open pockets for NPCs)
  [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]].forEach(([fx, fy]) => {
    const qx = Math.floor(sz * fx), qy = Math.floor(sz * fy);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const rx = qx + dx, ry = qy + dy;
      if (rx > 0 && rx < sz - 1 && ry > 0 && ry < sz - 1) grid[ry][rx] = 0;
    }
  });

  // outer wall + clear spawn corner
  for (let i = 0; i < sz; i++) { grid[0][i] = 1; grid[sz - 1][i] = 1; grid[i][0] = 1; grid[i][sz - 1] = 1; }
  grid[1][1] = grid[1][2] = grid[2][1] = grid[2][2] = 0;
  return grid;
}

export function buildMazeRoom({ engine, canvas, overlayEl, ctx, inputRef }) {
  const scene = new B.Scene(engine);
  if (B.ScenePerformancePriority) scene.performancePriority = B.ScenePerformancePriority.Intermediate;
  const sky = B.Color3.FromHexString('#33406a');
  scene.clearColor = new B.Color4(sky.r, sky.g, sky.b, 1);
  scene.fogMode = B.Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.006;
  scene.fogColor = sky;
  scene.ambientColor = new B.Color3(0.45, 0.48, 0.58);

  const grid = generateGrid();

  const std = (name, hex, emis) => {
    const m = new B.StandardMaterial(name, scene);
    m.diffuseColor = B.Color3.FromHexString(hex);
    m.specularColor = new B.Color3(0.04, 0.04, 0.04);
    if (emis) m.emissiveColor = B.Color3.FromHexString(emis);
    return m;
  };

  // ── Tiled floor — one panel per grid cell so it lines up with the walls ──
  const floorTex = new B.DynamicTexture('mzFloor', { width: 256, height: 256 }, scene, true);
  (function (c) {
    c.fillStyle = '#3c4a6e'; c.fillRect(0, 0, 256, 256);
    c.fillStyle = 'rgba(255,255,255,0.04)'; c.fillRect(10, 10, 236, 236);
    c.strokeStyle = 'rgba(150,180,230,0.40)'; c.lineWidth = 8; c.strokeRect(4, 4, 248, 248);
    for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`; c.fillRect(Math.random() * 256, Math.random() * 256, 3, 3); }
  })(floorTex.getContext());
  floorTex.update();
  floorTex.wrapU = floorTex.wrapV = B.Texture.WRAP_ADDRESSMODE;
  floorTex.uScale = floorTex.vScale = MAP;
  const floorMat = std('mzFloorMat', '#3c4a6e'); floorMat.diffuseTexture = floorTex; floorMat.maxSimultaneousLights = 6;
  const floor = B.MeshBuilder.CreateBox('mzFloor', { width: MAP * TILE, height: 0.4, depth: MAP * TILE }, scene);
  floor.position.y = -0.2; floor.material = floorMat; floor.receiveShadows = true;

  // ── Walls: ONE mesh, thin-instanced (single draw call) ──
  // Stone-brick dynamic texture so the walls read as built, not flat blocks.
  const wallTex = new B.DynamicTexture('mzWallTex', { width: 128, height: 128 }, scene, true);
  (function (c) {
    c.fillStyle = '#5d6885'; c.fillRect(0, 0, 128, 128);
    c.strokeStyle = 'rgba(20,24,36,0.8)'; c.lineWidth = 3;
    const rows = 4, bh = 128 / rows;
    for (let r = 0; r <= rows; r++) { const y = r * bh; c.beginPath(); c.moveTo(0, y); c.lineTo(128, y); c.stroke(); }
    for (let r = 0; r < rows; r++) { const y = r * bh, off = (r % 2) * 32; for (let x = off; x <= 128; x += 64) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + bh); c.stroke(); } }
    for (let i = 0; i < 500; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`; c.fillRect(Math.random() * 128, Math.random() * 128, 2, 2); }
    for (let i = 0; i < 350; i++) { c.fillStyle = `rgba(0,0,0,${Math.random() * 0.07})`; c.fillRect(Math.random() * 128, Math.random() * 128, 2, 2); }
  })(wallTex.getContext());
  wallTex.update();
  const wallMat = new B.StandardMaterial('mzWall', scene);
  wallMat.diffuseTexture = wallTex;
  wallMat.specularColor = new B.Color3(0.05, 0.05, 0.05);
  wallMat.emissiveColor = B.Color3.FromHexString('#1b2030'); // floor never reads pure black
  wallMat.maxSimultaneousLights = 6;
  const wall = B.MeshBuilder.CreateBox('mzWalls', { width: TILE, height: WALL_H, depth: TILE }, scene);
  wall.material = wallMat;
  wall.receiveShadows = true;
  wall.isPickable = false;
  const mats = [];
  for (let gz = 0; gz < MAP; gz++)
    for (let gx = 0; gx < MAP; gx++)
      if (grid[gz][gx] === 1) mats.push(B.Matrix.Translation(wx(gx), WALL_H / 2, wz(gz)));
  wall.thinInstanceAdd(mats);

  // gold trim caps along the top edge of every wall (one thin-instanced strip)
  const trim = B.MeshBuilder.CreateBox('mzTrim', { width: TILE, height: 0.18, depth: TILE }, scene);
  trim.material = std('mzTrimMat', '#c9a24a', '#5a4416');
  trim.isPickable = false;
  const trimMats = [];
  for (let gz = 0; gz < MAP; gz++)
    for (let gx = 0; gx < MAP; gx++)
      if (grid[gz][gx] === 1) trimMats.push(B.Matrix.Translation(wx(gx), WALL_H + 0.09, wz(gz)));
  trim.thinInstanceAdd(trimMats);

  // Static geometry never moves → freeze world matrices (skip per-frame recompute).
  floor.freezeWorldMatrix(); wall.freezeWorldMatrix(); trim.freezeWorldMatrix();

  // ── Goal beacon at the central hall ──
  const beacon = B.MeshBuilder.CreateCylinder('mzBeacon', { diameterTop: 0.2, diameterBottom: 1.2, height: 3.2, tessellation: 16 }, scene);
  beacon.position.set(0, 1.6, 0);
  beacon.material = std('mzBeaconMat', '#39d6ff', '#39d6ff');
  beacon.isPickable = false;
  const beaconLight = new B.PointLight('mzBeaconL', new B.Vector3(0, 3, 0), scene);
  beaconLight.diffuse = B.Color3.FromHexString('#5fd0ff'); beaconLight.intensity = 0.7; beaconLight.range = 18;

  // ── Spawn in the far corner, facing the centre ──
  const start = new B.Vector3(wx(1), 0, wz(1));
  const ctrl = setupControls(scene, canvas, {
    inputRef,
    start,
    startYaw: Math.PI / 4, // face toward centre (positive x/z)
    character: ctx.character,
    equipped: ctx.equipped,
    lowPerf: ctx.lowPerf,
    bounds: { hw: HALF, hd: HALF },
    // GTA-style: behind-the-back, slightly above, gentle down-tilt; the
    // camera pull-in (gridCollide) keeps it out of walls in tight corridors.
    camDist: 6.5, camHeight: 3.6, camLookY: 1.5, fov: 0.95,
    // cheap grid collision instead of per-wall mesh collisions
    gridCollide: (x, z) => {
      const r = 0.9;
      const hit = (px, pz) => {
        const cx = gAt(px), cz = gAt(pz);
        return cx < 0 || cx >= MAP || cz < 0 || cz >= MAP || grid[cz][cx] === 1;
      };
      return hit(x - r, z - r) || hit(x + r, z - r) || hit(x - r, z + r) || hit(x + r, z + r);
    },
    onInteract: () => tryInteract(),
  });

  // Bright sky fill so the open-top maze is clearly lit.
  const hemi = new B.HemisphericLight('mzHemi', new B.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.95; hemi.diffuse = new B.Color3(0.88, 0.92, 1.0);
  hemi.groundColor = new B.Color3(0.32, 0.34, 0.42); hemi.specular = new B.Color3(0, 0, 0);
  ctrl.keyLight.intensity = 1.05;
  // Warm lamp pools at the quarter rooms (desktop only — phones stay lighter).
  if (!ctx.lowPerf) {
    [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]].forEach(([fx, fy], i) => {
      const pl = new B.PointLight('mzLamp' + i, new B.Vector3(wx(Math.floor(MAP * fx)), 3.2, wz(Math.floor(MAP * fy))), scene);
      pl.diffuse = new B.Color3(1, 0.9, 0.72); pl.intensity = 0.6; pl.range = 18; pl.specular = new B.Color3(0, 0, 0);
    });
    ctrl.shadowGenerator.addShadowCaster(wall);
  }

  // ── Recruitment NPCs (Phase B framework — cheap instanced characters; the
  //    puzzle/army wiring comes in a later phase). Placed in the open pockets. ──
  const npcKit = createNpcKit(B, scene, { cell: TILE });
  const ROSTER = [
    { c: [0.25, 0.25], color: '#d0584a', name: 'Ravi', role: 'Sudoku Knight' },
    { c: [0.75, 0.25], color: '#5fb0d8', name: 'Mira', role: 'Bridge Mage' },
    { c: [0.25, 0.75], color: '#7ab05c', name: 'Tariq', role: 'Logic Scout' },
    { c: [0.75, 0.75], color: '#e0a84e', name: 'Lena', role: 'Number Sage' },
    { c: [0.50, 0.28], color: '#9b6cff', name: 'Otto', role: 'Maze Warden' },
  ];
  ROSTER.forEach((r) => {
    npcKit.spawn({ x: wx(Math.floor(MAP * r.c[0])), z: wz(Math.floor(MAP * r.c[1])), color: r.color, name: r.name, role: r.role });
  });

  // ── HUD ──
  overlayEl.innerHTML = `
    <div class="rh-zone"><div class="rh-zone-k">Explore</div><div class="rh-zone-v">The Labyrinth</div></div>
    <canvas id="mzMap" class="mz-map" width="156" height="156"></canvas>
    <div class="rh-prompt" id="rhPrompt"></div>
    <div class="rh-instr">Turn with A/D · walk with W/S · reach the beacon · E to leave</div>`;
  const promptEl = overlayEl.querySelector('#rhPrompt');

  // ── Minimap: whole maze, top-down, with a player arrow + the goal beacon. ──
  const mapCanvas = overlayEl.querySelector('#mzMap');
  const mctx = mapCanvas.getContext('2d');
  const MM = 156, cellPx = MM / MAP;
  // Pre-render the STATIC maze (walls + floor + goal + border) once to an
  // offscreen canvas. Per frame we only blit it and draw the moving player —
  // no 441-rect redraw on the render thread.
  const mapBase = document.createElement('canvas'); mapBase.width = MM; mapBase.height = MM;
  (function (b) {
    b.fillStyle = 'rgba(10,14,26,0.82)'; b.fillRect(0, 0, MM, MM);
    for (let gz = 0; gz < MAP; gz++) for (let gx = 0; gx < MAP; gx++) {
      b.fillStyle = grid[gz][gx] === 1 ? 'rgba(140,165,215,0.55)' : 'rgba(45,62,95,0.32)';
      b.fillRect(gx * cellPx, gz * cellPx, cellPx + 0.6, cellPx + 0.6);
    }
    b.fillStyle = '#39d6ff'; b.beginPath(); b.arc((MAP / 2) * cellPx, (MAP / 2) * cellPx, 3.2, 0, Math.PI * 2); b.fill();
    b.strokeStyle = 'rgba(150,180,230,0.5)'; b.lineWidth = 2; b.strokeRect(1, 1, MM - 2, MM - 2);
  })(mapBase.getContext('2d'));
  const drawMap = () => {
    mctx.clearRect(0, 0, MM, MM);
    mctx.drawImage(mapBase, 0, 0);
    const p = ctrl.player.position, cam = ctrl.camera.position;
    const ang = Math.atan2(p.x - cam.x, p.z - cam.z);
    const sx = (p.x / TILE + MAP / 2) * cellPx, sy = (p.z / TILE + MAP / 2) * cellPx;
    mctx.fillStyle = '#39ff9b'; mctx.strokeStyle = '#39ff9b'; mctx.lineWidth = 2;
    mctx.beginPath(); mctx.arc(sx, sy, 3, 0, Math.PI * 2); mctx.fill();
    mctx.beginPath(); mctx.moveTo(sx, sy); mctx.lineTo(sx + Math.sin(ang) * 8, sy + Math.cos(ang) * 8); mctx.stroke();
  };

  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'rh-toast'; el.textContent = msg;
    overlayEl.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; });
    setTimeout(() => { el.style.opacity = '0'; }, 1700);
    setTimeout(() => { el.remove(); }, 2100);
  }

  let reached = false, nearestNpc = null;
  function tryInteract() {
    if (nearestNpc) { // standing in front of a recruitment NPC
      ctx.playSfx?.('click');
      toast('⚔️ ' + nearestNpc.name + ' · ' + nearestNpc.role + ' — recruitment coming soon');
      return;
    }
    if (Math.hypot(ctrl.player.position.x, ctrl.player.position.z) < 3.2) { ctx.playSfx?.('chime'); ctx.goToRoom('hall'); }
  }

  let mapT = 0, lastPrompt = '';
  const beforeRender = () => {
    beacon.rotation.y += 0.02;
    const now = performance.now(), t = now / 1000;
    if (now - mapT > 80) { mapT = now; drawMap(); } // minimap ~12 Hz, not 60
    const p = ctrl.player.position;
    nearestNpc = npcKit.update(p, t); // distance-throttled idle + grid-bucket proximity
    const nearBeacon = Math.hypot(p.x, p.z) < 3.2;
    if (nearBeacon && !reached) { reached = true; ctx.updateXP?.(25); }
    let pr = '';
    if (nearestNpc) pr = '▶ press E to challenge ' + nearestNpc.name;
    else if (nearBeacon) pr = '▶ press E to return to the Hall';
    if (pr !== lastPrompt) { // touch the DOM only when the prompt actually changes
      lastPrompt = pr; promptEl.textContent = pr; promptEl.classList.toggle('show', !!pr);
    }
  };
  scene.registerBeforeRender(beforeRender);

  return {
    scene,
    interact: tryInteract,
    jump: ctrl.jump,
    dispose() {
      scene.unregisterBeforeRender(beforeRender);
      npcKit.dispose();
      ctrl.dispose();
      overlayEl.innerHTML = '';
      scene.dispose();
    },
  };
}
