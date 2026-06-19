/**
 * The Labyrinth — light TOON style with crisp PIXEL-ART textures (nearest-filter),
 * rendered clear (no framebuffer downscale). Pokémon-style top-down camera, small
 * character, joystick movement. No PBR / bloom / shadows / skybox / particles, so
 * it renders sharp at 60fps on phones.
 *
 * Keeps the game's own maze algorithm (recursive backtracker, opened for space).
 * Reach the glowing core and press USE to return to the Hall.
 * Returns { scene, interact, jump, dispose }.
 */
import { setupControls } from './roomControls';

const B = () => window.BABYLON;

const MAP = 25, CELL = 4, WALL_H = 3, HALF = (MAP * CELL) / 2;
const wc = (g) => (g - MAP / 2 + 0.5) * CELL;        // grid → world (square)
const gAt = (w) => Math.floor(w / CELL + MAP / 2);   // world → grid

export function buildMazeRoom({ engine, canvas, overlayEl, ctx, inputRef }) {
  const Bb = B();
  const scene = new Bb.Scene(engine);
  if (Bb.ScenePerformancePriority) scene.performancePriority = Bb.ScenePerformancePriority.Intermediate;
  const sky = Bb.Color3.FromHexString('#8fc6ef');
  scene.clearColor = new Bb.Color4(sky.r, sky.g, sky.b, 1);
  scene.ambientColor = new Bb.Color3(0.6, 0.6, 0.66);
  const isAr = ctx.currentLang === 'ar';

  // ── Crisp pixel-art texture helper (NEAREST filtering) ──
  const pix = (name, draw, n = 16) => {
    const t = new Bb.DynamicTexture(name, { width: n, height: n }, scene, false);
    draw(t.getContext(), n); t.update();
    t.updateSamplingMode(Bb.Texture.NEAREST_SAMPLINGMODE);
    t.wrapU = t.wrapV = Bb.Texture.WRAP_ADDRESSMODE;
    return t;
  };
  const speck = (c, base, cols, n = 16) => {
    c.fillStyle = base; c.fillRect(0, 0, n, n);
    for (let i = 0; i < n * n * 0.25; i++) { c.fillStyle = cols[(Math.random() * cols.length) | 0]; c.fillRect((Math.random() * n) | 0, (Math.random() * n) | 0, 1, 1); }
  };
  const toon = (name, hex, tex, glow = 0.1) => {
    const m = new Bb.StandardMaterial(name, scene);
    const col = Bb.Color3.FromHexString(hex);
    if (tex) m.diffuseTexture = tex; else m.diffuseColor = col;
    m.emissiveColor = col.scale(glow);
    m.specularColor = new Bb.Color3(0, 0, 0); m.ambientColor = new Bb.Color3(1, 1, 1);
    m.maxSimultaneousLights = 2;
    return m;
  };

  // ── Maze grid: recursive backtracker, then opened up for more space ──
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
    let o = 0; if (maze[y - 1][x] === 0) o++; if (maze[y + 1][x] === 0) o++; if (maze[y][x - 1] === 0) o++; if (maze[y][x + 1] === 0) o++;
    if (o >= 2 && Math.random() < 0.45) maze[y][x] = 0;
  }

  // ── Floor (pixel stone tiles, one per cell) ──
  const floorTex = pix('mzFloor', (c) => {
    speck(c, '#cdc6b6', ['#bdb6a6', '#d8d2c4', '#c2bbab']);
    c.fillStyle = 'rgba(90,82,68,0.45)'; c.fillRect(0, 0, 16, 1); c.fillRect(0, 0, 1, 16);
  });
  floorTex.uScale = floorTex.vScale = MAP;
  const floorMat = toon('mzFloorMat', '#cdc6b6', floorTex, 0.05);
  const floor = Bb.MeshBuilder.CreateBox('mzFloor', { width: MAP * CELL, height: 0.4, depth: MAP * CELL }, scene);
  floor.position.y = -0.2; floor.material = floorMat; floor.freezeWorldMatrix();

  // ── Walls (pixel brick, thin-instanced) + gold caps ──
  const wallTex = pix('mzWall', (c) => {
    speck(c, '#7e9bd0', ['#6f8cc4', '#90abdc', '#6986bc']);
    c.fillStyle = 'rgba(38,48,78,0.55)'; for (let y = 0; y < 16; y += 4) c.fillRect(0, y, 16, 1); for (let x = 0; x < 16; x += 8) c.fillRect(x, 0, 1, 16);
  });
  const wall = Bb.MeshBuilder.CreateBox('mzWalls', { width: CELL, height: WALL_H, depth: CELL }, scene);
  wall.material = toon('mzWallMat', '#7e9bd0', wallTex, 0.08); wall.isPickable = false;
  const trim = Bb.MeshBuilder.CreateBox('mzTrim', { width: CELL, height: 0.25, depth: CELL }, scene);
  trim.material = toon('mzTrimMat', '#ffce4a', null, 0.3); trim.isPickable = false;
  const wMats = [], tMats = [];
  for (let gz = 0; gz < MAP; gz++) for (let gx = 0; gx < MAP; gx++) if (maze[gz][gx] === 1) {
    wMats.push(Bb.Matrix.Translation(wc(gx), WALL_H / 2, wc(gz)));
    tMats.push(Bb.Matrix.Translation(wc(gx), WALL_H + 0.12, wc(gz)));
  }
  wall.thinInstanceAdd(wMats); trim.thinInstanceAdd(tMats);
  wall.freezeWorldMatrix(); trim.freezeWorldMatrix();

  // ── Core at the centre (the goal) ──
  const corePos = new Bb.Vector3(wc(cc), 1.3, wc(cc));
  const core = Bb.MeshBuilder.CreateSphere('core', { diameter: 2, segments: 14 }, scene);
  core.position = corePos; core.material = toon('coreMat', '#ff8a1a', null, 0.7);

  // ── Controls: Pokémon-style top-down + grid collision, small character ──
  const ctrl = setupControls(scene, canvas, {
    inputRef, start: new Bb.Vector3(wc(1), 0, wc(1)), startYaw: 0,
    character: ctx.character, equipped: ctx.equipped, lowPerf: ctx.lowPerf,
    topDown: true, camDist: 12, camHeight: 20, fov: 0.7, charScale: 0.28,
    gridCollide: (x, z) => {
      const r = 0.7;
      const hit = (px, pz) => { const a = gAt(px), b = gAt(pz); return a < 0 || a >= MAP || b < 0 || b >= MAP || maze[b][a] === 1; };
      return hit(x - r, z - r) || hit(x + r, z - r) || hit(x - r, z + r) || hit(x + r, z + r);
    },
    onInteract: () => tryInteract(),
  });

  // ── Bright, clear daylight (no shadows/bloom) ──
  ctrl.keyLight.intensity = 0.85; ctrl.keyLight.direction = new Bb.Vector3(-0.4, -1, 0.5);
  const hemi = new Bb.HemisphericLight('mzHemi', new Bb.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.7; hemi.diffuse = new Bb.Color3(1, 1, 1);
  hemi.groundColor = new Bb.Color3(0.55, 0.56, 0.62); hemi.specular = new Bb.Color3(0, 0, 0);

  scene.skipPointerMovePicking = true;
  scene.blockMaterialDirtyMechanism = true;

  // ── HUD ──
  overlayEl.innerHTML = `
    <div class="rh-zone"><div class="rh-zone-k">Explore</div><div class="rh-zone-v">The Labyrinth</div></div>
    <div class="rh-prompt" id="rhPrompt"></div>
    <div class="rh-instr">${isAr ? 'العصا للتحرك · صل إلى النواة المتوهجة' : 'Joystick to move · reach the glowing core'}</div>`;
  const promptEl = overlayEl.querySelector('#rhPrompt');

  let done = false, lastPrompt = '';
  function tryInteract() {
    if (done) return;
    if (Bb.Vector3.Distance(ctrl.player.position, corePos) < 4.5) {
      done = true;
      ctx.playSfx?.('chime'); ctx.updateXP?.(50);
      ctx.goToRoom('hall');
    }
  }

  const beforeRender = () => {
    core.rotation.y += 0.02;
    if (done) return;
    const near = Bb.Vector3.Distance(ctrl.player.position, corePos) < 4.5;
    const pr = near ? (isAr ? '▶ اضغط USE للعودة إلى القاعة' : '▶ press USE to return to the Hall') : '';
    if (pr !== lastPrompt) { lastPrompt = pr; promptEl.textContent = pr; promptEl.classList.toggle('show', !!pr); }
  };
  scene.registerBeforeRender(beforeRender);

  return {
    scene, interact: tryInteract, jump: ctrl.jump,
    dispose() { scene.unregisterBeforeRender(beforeRender); ctrl.dispose(); overlayEl.innerHTML = ''; scene.dispose(); },
  };
}
