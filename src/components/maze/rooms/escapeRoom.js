/**
 * Escape Room — "The Mind Vault" (Clash-Royale-style, tap-to-move).
 *
 * A phone-first escape: a FIXED angled "arena" camera frames one chamber at a
 * time (no follow-cam drift), the character is small and clear, and you TAP the
 * board to walk there — tap near an object and the character walks over and uses
 * it automatically. Break through each chamber with the tool you just earned:
 *
 *   Chamber A — solve Puzzle 1 (Sudoku) → 🔑 keys → open the 🧰 chest → 🔨 hammer →
 *               smash the wall to Chamber B.
 *   Chamber B — grab the 🪂 jetpack, solve Puzzle 2 (Bridges) → ⛽ fuel powers it →
 *               the character auto-flies over the chasm. Grab the 💣 bomb, blow the
 *               border to Chamber C.
 *   Chamber C — solve Puzzle 3 (Binary/Takuzu) → 🗝️ huge key → the 🚪 door opens →
 *               tap it to escape.
 *
 * Self-contained (does NOT use the shared follow-cam controls). Built lean for
 * mobile: no glow/shadow passes, a handful of meshes, a fixed camera.
 *
 * Contract: returns { scene, interact, jump, dispose }.
 */
import { createKit } from '../worldKit';
import { buildCharacter } from '../characters3d';
import {
  wc, gAt, createMazeMaterials, buildMazeMeshes,
  makeExitPortal, makeBossGate, makeGridCollider,
  setupMazeLights, setupGateSky,
} from './mazeKit';

const B = () => window.BABYLON;
const MAP = 13;
const FLOOR_HEX = '#d4c4a8';
const WALL_HEX = '#8a7ec8';
const LOCK_HEX = '#e0915a';
const DONE_HEX = '#3be086';
const GROUND_Y = 1.0;
const SPEED = 0.17;
const CAM_BACK = 12;
const CAM_H = 15.5;

const PUZZLES = [
  { id: 'p1', spec: { puzzleKey: 'sudoku', size: 4, seed: 4207 }, en: 'Logic Lock', ar: 'قفل المنطق' },
  { id: 'p2', spec: { puzzleKey: 'bridges', size: 7, seed: 5561 }, en: 'Bridge Lock', ar: 'قفل الجسور' },
  { id: 'p3', spec: { puzzleKey: 'takuzu', size: 6, seed: 8123 }, en: 'Binary Lock', ar: 'القفل الثنائي' },
];
const TOOLS = [
  { k: 'keys', ic: '🔑' }, { k: 'hammer', ic: '🔨' }, { k: 'jet', ic: '🪂' },
  { k: 'fuel', ic: '⛽' }, { k: 'bomb', ic: '💣' }, { k: 'bigkey', ic: '🗝️' },
];
function invHtml(S, isAr) {
  const cells = TOOLS.map((tl) => `<span style="font-size:19px;line-height:1;opacity:${S[tl.k] ? 1 : 0.28};filter:${S[tl.k] ? 'none' : 'grayscale(1)'}">${tl.ic}</span>`).join('');
  return `<span style="font-weight:800;font-size:11px;letter-spacing:0.5px;color:#ffe6b0">${isAr ? 'الحقيبة' : 'GEAR'}</span>${cells}`;
}

export function buildEscapeRoom({ engine, canvas, overlayEl, ctx, inputRef }) {
  const isAr = ctx.currentLang === 'ar';
  const Bb = B();
  const scene = new Bb.Scene(engine);
  if (Bb.ScenePerformancePriority) scene.performancePriority = Bb.ScenePerformancePriority.Aggressive;
  setupGateSky(Bb, scene);

  const mats = createMazeMaterials(Bb, scene, FLOOR_HEX, WALL_HEX);
  const kit = createKit(Bb, scene, true); // lowPerf → no glow/bloom
  const noShadow = { addShadowCaster() {}, removeShadowCaster() {}, getShadowMap() { return null; }, dispose() {} };

  // ── Layout: a narrow, tall vault (portrait-friendly). Play area x=4..8, and
  // three chambers stacked in z, separated by two full-width breakable walls. ──
  const maze = Array.from({ length: MAP }, () => new Array(MAP).fill(1));
  for (let z = 1; z <= MAP - 2; z++) for (let x = 4; x <= 8; x++) maze[z][x] = 0;
  buildMazeMeshes(Bb, scene, maze, MAP, { ...mats, floorHex: FLOOR_HEX, wallHex: WALL_HEX });

  const baseCollide = makeGridCollider(maze, MAP);
  const barriers = new Set();
  const cellKey = (gx, gz) => `${gx},${gz}`;
  const addBarrierRow = (gz) => { for (let gx = 4; gx <= 8; gx++) barriers.add(cellKey(gx, gz)); };
  const clearBarrierRow = (gz) => { for (let gx = 4; gx <= 8; gx++) barriers.delete(cellKey(gx, gz)); };
  const barrierHit = (x, z) => {
    const r = 0.6;
    const hit = (px, pz) => barriers.has(cellKey(gAt(px, MAP), gAt(pz, MAP)));
    return hit(x - r, z - r) || hit(x + r, z - r) || hit(x - r, z + r) || hit(x + r, z + r);
  };
  const gridCollide = (x, z) => baseCollide(x, z) || barrierHit(x, z);

  // Breakable divider walls (own meshes so we can smash them).
  function buildDivider(gz, hex) {
    addBarrierRow(gz);
    const dmat = mats.toon(`divMat-${gz}`, hex, null, 0.12);
    const meshes = [];
    for (let gx = 4; gx <= 8; gx++) {
      const m = Bb.MeshBuilder.CreateBox(`div-${gz}-${gx}`, { width: 4, height: 3, depth: 4 }, scene);
      m.position = new Bb.Vector3(wc(gx, MAP), 1.5, wc(gz, MAP));
      m.material = dmat; m.isPickable = false;
      meshes.push(m);
    }
    return meshes;
  }
  const wallA = buildDivider(4, '#9a7ec8'); // A → B (hammer)
  const wallB = buildDivider(8, '#c8865a'); // B → C (bomb)

  // Chasm (row z=6): blocked until the jetpack is fuelled, then you fly over it.
  addBarrierRow(6);
  const pitZ = wc(6, MAP);
  const pit = Bb.MeshBuilder.CreateBox('pit', { width: 5 * 4, height: 0.5, depth: 4 * 0.9 }, scene);
  pit.position = new Bb.Vector3(0, -0.04, pitZ);
  pit.material = mats.toon('pitMat', '#140a1e', null, 0);
  pit.isPickable = false;

  const cc = 6; // centre column
  const chamberZ = [wc(2, MAP), wc(6, MAP), wc(10, MAP)];
  const zWallA = wc(4, MAP), zWallB = wc(8, MAP);
  const chamberOf = (z) => (z < zWallA - 2 ? 0 : z < zWallB - 2 ? 1 : 2);

  // ── Lights (bright & flat, Clash-Royale feel) ──
  const dir = new Bb.DirectionalLight('key', new Bb.Vector3(-0.4, -1, 0.55), scene);
  dir.position = new Bb.Vector3(10, 22, -14); dir.intensity = 1.0;
  setupMazeLights(Bb, scene, dir);

  // ── Character (small) + invisible collider ──
  const player = Bb.MeshBuilder.CreateBox('player', { width: 0.8, height: 2, depth: 0.8 }, scene);
  player.isVisible = false; player.isPickable = false;
  player.position = new Bb.Vector3(wc(cc, MAP), GROUND_Y, wc(1, MAP));
  const { rig } = buildCharacter(Bb, scene, player, noShadow, ctx.character, ctx.equipped, kit);
  rig.root.position.y = -1.0;
  rig.root.scaling.set(0.3, 0.3, 0.3);
  rig.root.getChildMeshes().forEach((m) => {
    const mt = m.material;
    if (mt && mt.emissiveColor) { mt.emissiveFresnelParameters = null; mt.emissiveColor = Bb.Color3.Black(); }
  });

  // ── Fixed arena camera (per chamber) ──
  const camera = new Bb.UniversalCamera('arenaCam', new Bb.Vector3(0, CAM_H, chamberZ[0] - CAM_BACK), scene);
  camera.fov = 0.72; camera.minZ = 0.1; camera.inputs.clear();
  const camTarget = new Bb.Vector3(0, 0.6, chamberZ[0]);
  camera.setTarget(camTarget);
  scene.skipPointerMovePicking = true;
  scene.blockMaterialDirtyMechanism = true;

  // ── Puzzle lock consoles ──
  const lockAt = (cfg, gx, gz) => {
    const x = wc(gx, MAP), z = wc(gz, MAP);
    const base = Bb.MeshBuilder.CreateCylinder(`${cfg.id}-b`, { diameter: 1.7, height: 0.5, tessellation: 6 }, scene);
    base.position = new Bb.Vector3(x, 0.25, z); base.material = mats.toon(`${cfg.id}-bm`, '#4a3d6a', null, 0.15); base.isPickable = false;
    const core = Bb.MeshBuilder.CreateBox(`${cfg.id}-c`, { size: 1.0 }, scene);
    core.position = new Bb.Vector3(x, 1.2, z); core.material = mats.toon(`${cfg.id}-cm`, LOCK_HEX, null, 0.72); core.isPickable = false;
    return { ...cfg, x, z, core, label: makeLabel('🧩', x, 2.3, z), solved: false };
  };

  // ── Billboard emoji labels (cheap, drawn once) ──
  const labels = [];
  function makeLabel(text, x, y, z, size = 1.6) {
    const dt = new Bb.DynamicTexture(`lbl${labels.length}`, { width: 128, height: 128 }, scene, true);
    dt.hasAlpha = true;
    const c = dt.getContext();
    c.clearRect(0, 0, 128, 128); c.font = '96px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, 64, 80); dt.update();
    const pl = Bb.MeshBuilder.CreatePlane(`lblP${labels.length}`, { size }, scene);
    pl.position = new Bb.Vector3(x, y, z); pl.billboardMode = Bb.Mesh.BILLBOARDMODE_ALL; pl.isPickable = false;
    const m = new Bb.StandardMaterial(`lblM${labels.length}`, scene);
    m.diffuseTexture = dt; m.diffuseTexture.hasAlpha = true; m.useAlphaFromDiffuseTexture = true;
    m.emissiveColor = new Bb.Color3(1, 1, 1); m.disableLighting = true; m.backFaceCulling = false;
    pl.material = m; labels.push({ pl, y }); return pl;
  }

  const lockP1 = lockAt(PUZZLES[0], 5, 2);
  const lockP2 = lockAt(PUZZLES[1], 7, 5);
  const lockP3 = lockAt(PUZZLES[2], cc, 10);

  // ── Props (recognisable shapes) ──
  function buildChest(gx, gz) {
    const x = wc(gx, MAP), z = wc(gz, MAP);
    const root = new Bb.TransformNode('chest', scene); root.position.set(x, 0, z);
    const wood = mats.toon('chestWood', '#8a5a2a', null, 0.12), gold = mats.toon('chestGold', '#e8ac4e', null, 0.5);
    const body = Bb.MeshBuilder.CreateBox('chB', { width: 1.5, height: 0.9, depth: 1.0 }, scene); body.position.set(0, 0.45, 0); body.material = wood; body.parent = root; body.isPickable = false;
    const lid = Bb.MeshBuilder.CreateBox('chL', { width: 1.54, height: 0.42, depth: 1.04 }, scene); lid.position.set(0, 1.0, 0); lid.material = gold; lid.parent = root; lid.isPickable = false;
    const lk = Bb.MeshBuilder.CreateBox('chK', { width: 0.3, height: 0.36, depth: 0.12 }, scene); lk.position.set(0, 0.78, 0.55); lk.material = gold; lk.parent = root; lk.isPickable = false;
    return { x, z, root, lid, label: makeLabel('🧰', x, 2.1, z) };
  }
  function buildJetpack(gx, gz) {
    const x = wc(gx, MAP), z = wc(gz, MAP);
    const root = new Bb.TransformNode('jet', scene); root.position.set(x, 0.7, z);
    const body = mats.toon('jetBody', '#5a6ac8', null, 0.25), tankM = mats.toon('jetTank', '#c8d0e8', null, 0.15);
    const pack = Bb.MeshBuilder.CreateBox('jetP', { width: 0.9, height: 1.0, depth: 0.5 }, scene); pack.material = body; pack.parent = root; pack.isPickable = false;
    [-0.38, 0.38].forEach((dx, i) => { const tk = Bb.MeshBuilder.CreateCylinder(`jetT${i}`, { diameter: 0.36, height: 1.1 }, scene); tk.position.set(dx, 0, -0.18); tk.material = tankM; tk.parent = root; tk.isPickable = false; });
    return { x, z, root, label: makeLabel('🪂', x, 2.0, z) };
  }
  function buildBomb(gx, gz) {
    const x = wc(gx, MAP), z = wc(gz, MAP);
    const root = new Bb.TransformNode('bomb', scene); root.position.set(x, 0.7, z);
    const ball = Bb.MeshBuilder.CreateSphere('bmB', { diameter: 1.0, segments: 12 }, scene); ball.material = mats.toon('bmBM', '#2a2a33', null, 0.05); ball.parent = root; ball.isPickable = false;
    const fuse = Bb.MeshBuilder.CreateCylinder('bmF', { diameter: 0.14, height: 0.5 }, scene); fuse.position.set(0, 0.6, 0); fuse.material = mats.toon('bmFM', '#e0915a', null, 0.6); fuse.parent = root; fuse.isPickable = false;
    return { x, z, root, label: makeLabel('💣', x, 2.0, z) };
  }
  const chest = buildChest(7, 2);
  const jetItem = buildJetpack(5, 5);
  const bombItem = buildBomb(cc, 7);
  jetItem.root.setEnabled(false); jetItem.label.setEnabled(false);
  bombItem.root.setEnabled(false); bombItem.label.setEnabled(false);

  // ── Exit ──
  const exitCell = [cc, MAP - 2];
  const { exitPos, exitPad, exitBeacon } = makeExitPortal(Bb, scene, mats.toon, exitCell[0], exitCell[1], MAP, '#9a68c8');
  makeBossGate(Bb, scene, mats.toon, exitCell[0], exitCell[1], MAP);
  exitBeacon.isVisible = false;
  const exitHint = makeLabel('🚪', exitPos.x, 2.8, exitPos.z); exitHint.setEnabled(false);
  const wallAHint = makeLabel('🔨', wc(cc, MAP), 2.6, zWallA - 2); wallAHint.setEnabled(false);
  const wallBHint = makeLabel('💣', wc(cc, MAP), 2.6, zWallB - 2); wallBHint.setEnabled(false);

  // ── State + HUD ──
  const S = { keys: false, hammer: false, jet: false, fuel: false, bomb: false, bigkey: false };
  const barriersBroken = { A: false, B: false };
  let escaped = false;

  overlayEl.innerHTML = `
    <div class="rh-zone"><div class="rh-zone-k">${isAr ? '★ خزنة العقل' : '★ MIND VAULT'}</div><div class="rh-zone-v">${isAr ? 'اشقّ طريقك عبر الغرف الثلاث لتهرب.' : 'Break through all three chambers to escape.'}</div></div>
    <div class="rh-prompt" id="rhPrompt"></div>
    <div id="rhInv" style="position:absolute;top:12px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:7px;padding:6px 13px;border-radius:999px;background:rgba(20,12,26,0.72);border:1px solid rgba(232,172,78,0.4)">${invHtml(S, isAr)}</div>
    <div class="rh-instr" id="rhInstr"></div>`;
  const promptEl = overlayEl.querySelector('#rhPrompt');
  const invEl = overlayEl.querySelector('#rhInv');
  const instrEl = overlayEl.querySelector('#rhInstr');
  const OBJ = () => {
    if (escaped) return '';
    if (!lockP1.solved) return isAr ? '▶ اذهب إلى القفل واضغط USE' : '▶ Go to the lock and press USE';
    if (!S.hammer) return isAr ? '▶ اذهب إلى الصندوق واضغط USE لأخذ المطرقة' : '▶ Go to the chest and USE to get the hammer';
    if (!barriersBroken.A) return isAr ? '▶ اذهب إلى الجدار واضغط USE لتحطيمه' : '▶ Go to the wall and USE to smash it';
    if (!S.jet) return isAr ? '▶ التقط الحقيبة النفّاثة (USE)' : '▶ Grab the jetpack (USE)';
    if (!lockP2.solved) return isAr ? '▶ حُلّ قفل الجسور لتشغيل الحقيبة' : '▶ Solve the Bridge Lock to fuel up';
    if (!S.bomb) return isAr ? '▶ اعبر الهاوية والتقط القنبلة' : '▶ Fly across the chasm and grab the bomb';
    if (!barriersBroken.B) return isAr ? '▶ اذهب إلى الحدّ واضغط USE لتفجيره' : '▶ Go to the border and USE to blow it';
    if (!lockP3.solved) return isAr ? '▶ حُلّ القفل الثنائي' : '▶ Solve the Binary Lock';
    return isAr ? '▶ الباب مفتوح — اذهب إليه واضغط USE' : '▶ The door is open — reach it and USE';
  };
  const refreshHud = () => { if (invEl) invEl.innerHTML = invHtml(S, isAr); if (instrEl) instrEl.textContent = OBJ(); };
  refreshHud();

  // ── Effects ──
  const debris = [];
  const dMat = mats.toon('dMat', WALL_HEX, null, 0.1), dMatB = mats.toon('dMatB', '#c8865a', null, 0.1);
  function spawnDebris(x, z, hex, n = 10) {
    const mat = hex === '#c8865a' ? dMatB : dMat;
    for (let i = 0; i < n; i++) {
      const d = Bb.MeshBuilder.CreateBox(`db${debris.length}`, { size: 0.3 + Math.random() * 0.5 }, scene);
      d.material = mat; d.isPickable = false;
      d.position = new Bb.Vector3(x + (Math.random() - 0.5) * 2.4, 1 + Math.random() * 1.6, z + (Math.random() - 0.5) * 2.4);
      debris.push({ m: d, v: new Bb.Vector3((Math.random() - 0.5) * 0.28, 0.12 + Math.random() * 0.2, (Math.random() - 0.5) * 0.28), av: new Bb.Vector3(Math.random() * 0.3, Math.random() * 0.3, Math.random() * 0.3), life: 1.5, settled: false });
    }
  }
  let flash = null;
  function explosionFlash(x, z) {
    const s = Bb.MeshBuilder.CreateSphere('boom', { diameter: 1, segments: 10 }, scene);
    s.position = new Bb.Vector3(x, 1.4, z); s.material = mats.toon('boomMat', '#ffce4a', null, 1); s.isPickable = false;
    flash = { m: s, t: 0 };
  }
  function smashDivider(meshes, gz, hex) {
    clearBarrierRow(gz);
    meshes.forEach((m) => { spawnDebris(m.position.x, m.position.z, hex, 4); m.dispose(); });
    ctx.playSfx?.('win');
  }

  // ── Interaction spots (walk here → auto-use) ──
  const spots = [
    { pos: () => new Bb.Vector3(lockP1.x, 0, lockP1.z), r: 2.2, elig: () => !lockP1.solved, label: () => (isAr ? lockP1.ar : lockP1.en), act: () => openPuzzle(lockP1, () => { onSolved(lockP1); S.keys = true; refreshHud(); }) },
    { pos: () => new Bb.Vector3(chest.x, 0, chest.z), r: 2.2, elig: () => S.keys && !S.hammer, label: () => (isAr ? 'افتح الصندوق' : 'Open chest'), act: () => { S.hammer = true; chest.lid.rotation.x = -0.9; chest.label.setEnabled(false); ctx.playSfx?.('win'); refreshHud(); } },
    { pos: () => new Bb.Vector3(wc(cc, MAP), 0, zWallA - 2), r: 2.6, elig: () => S.hammer && !barriersBroken.A, label: () => (isAr ? 'حطّم الجدار' : 'Smash the wall'), act: () => { smashDivider(wallA, 4, '#9a7ec8'); barriersBroken.A = true; jetItem.root.setEnabled(true); jetItem.label.setEnabled(true); refreshHud(); } },
    { pos: () => new Bb.Vector3(jetItem.x, 0, jetItem.z), r: 2.2, elig: () => barriersBroken.A && !S.jet, label: () => (isAr ? 'التقط الحقيبة' : 'Grab jetpack'), act: () => { S.jet = true; jetItem.root.setEnabled(false); jetItem.label.setEnabled(false); ctx.playSfx?.('win'); refreshHud(); } },
    { pos: () => new Bb.Vector3(lockP2.x, 0, lockP2.z), r: 2.2, elig: () => S.jet && !lockP2.solved, label: () => (isAr ? lockP2.ar : lockP2.en), act: () => openPuzzle(lockP2, () => { onSolved(lockP2); S.fuel = true; clearBarrierRow(6); bombItem.root.setEnabled(true); bombItem.label.setEnabled(true); refreshHud(); }) },
    { pos: () => new Bb.Vector3(bombItem.x, 0, bombItem.z), r: 2.2, elig: () => S.fuel && !S.bomb, label: () => (isAr ? 'التقط القنبلة' : 'Grab bomb'), act: () => { S.bomb = true; bombItem.root.setEnabled(false); bombItem.label.setEnabled(false); ctx.playSfx?.('win'); refreshHud(); } },
    { pos: () => new Bb.Vector3(wc(cc, MAP), 0, zWallB - 2), r: 2.6, elig: () => S.bomb && !barriersBroken.B, label: () => (isAr ? 'فجّر الحدّ' : 'Blow the border'), act: () => { explosionFlash(wc(cc, MAP), zWallB); smashDivider(wallB, 8, '#c8865a'); barriersBroken.B = true; refreshHud(); } },
    { pos: () => new Bb.Vector3(lockP3.x, 0, lockP3.z), r: 2.2, elig: () => barriersBroken.B && !lockP3.solved, label: () => (isAr ? lockP3.ar : lockP3.en), act: () => openPuzzle(lockP3, () => { onSolved(lockP3); S.bigkey = true; exitBeacon.isVisible = true; exitPad.material.emissiveColor = Bb.Color3.FromHexString('#16d39a').scale(0.6); refreshHud(); }) },
    { pos: () => exitPos, r: 3.0, elig: () => S.bigkey, label: () => (isAr ? 'اهرب!' : 'Escape!'), act: () => { escaped = true; ctx.playSfx?.('win'); showEscaped(); } },
  ];

  function openPuzzle(lock, onDone) { ctx.playSfx?.('click'); ctx.openEscapePuzzle?.({ spec: lock.spec, title: isAr ? lock.ar : lock.en }, onDone); }
  function onSolved(lock) {
    if (lock.solved) return; lock.solved = true;
    const g = Bb.Color3.FromHexString(DONE_HEX); lock.core.material.diffuseColor = g; lock.core.material.emissiveColor = g.scale(0.7); ctx.playSfx?.('win');
  }
  function showEscaped() {
    overlayEl.innerHTML = `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;background:rgba(8,6,16,0.55)"><div style="font-size:52px">🗝️</div><div style="font-family:'Fredoka One','Nunito',sans-serif;font-size:30px;font-weight:800;color:#ffe6b0;text-shadow:0 0 18px rgba(232,172,78,0.6)">${isAr ? 'لقد هربت!' : 'You escaped!'}</div></div>`;
    setTimeout(() => ctx.exitMaze?.(), 2600);
  }

  // ── Movement: host joystick (inputRef) + keyboard (WASD / arrows). USE interacts. ──
  const inputMap = {};
  const onKeyDown = (e) => {
    const k = e.key.toLowerCase();
    inputMap[k] = true;
    if (k === 'e' || k === 'enter' || k === ' ') { e.preventDefault(); tryAutoInteract(); }
  };
  const onKeyUp = (e) => { inputMap[e.key.toLowerCase()] = false; };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  const DEAD = 0.1;

  function tryAutoInteract() {
    let best = Infinity, chosen = null;
    for (const s of spots) {
      if (!s.elig()) continue;
      const sp = s.pos(); const d2 = (sp.x - player.position.x) ** 2 + (sp.z - player.position.z) ** 2;
      if (d2 < s.r * s.r && d2 < best) { best = d2; chosen = s; }
    }
    if (chosen) chosen.act();
  }

  // ── Per-frame ──
  let walkCycle = 0, heading = 0, prevHeading = 0, lastPrompt = '';
  const beforeRender = () => {
    if (escaped) return;
    const t = performance.now() / 1000;
    const p = player.position;

    // spin/bob locks + pickups
    for (const l of [lockP1, lockP2, lockP3]) { if (l.solved) continue; l.core.rotation.y += 0.02; l.core.position.y = 1.2 + Math.sin(t * 2 + l.x) * 0.08; }
    if (jetItem.root.isEnabled()) { jetItem.root.rotation.y += 0.03; jetItem.root.position.y = 0.7 + Math.sin(t * 3) * 0.12; }
    if (bombItem.root.isEnabled()) { bombItem.root.rotation.y += 0.03; bombItem.root.position.y = 0.7 + Math.sin(t * 3 + 1) * 0.12; }
    if (exitBeacon.isVisible) { exitBeacon.rotation.y += 0.03; exitPad.scaling.y = 1 + Math.sin(t * 2.5) * 0.06; }

    // hint labels
    lockP1.label.setEnabled(!lockP1.solved); lockP2.label.setEnabled(!lockP2.solved); lockP3.label.setEnabled(!lockP3.solved);
    wallAHint.setEnabled(S.hammer && !barriersBroken.A); wallBHint.setEnabled(S.bomb && !barriersBroken.B); exitHint.setEnabled(S.bigkey);
    const bob = Math.sin(t * 2.2) * 0.12;
    for (const l of labels) l.pl.position.y = l.y + bob;

    // movement from joystick + keyboard (screen-relative: up = +Z)
    let moving = false;
    const inp = inputRef?.current;
    const jx = inp && Math.abs(inp.mx) > DEAD ? inp.mx : 0;
    const jy = inp && Math.abs(inp.my) > DEAD ? inp.my : 0;
    const mx = jx + ((inputMap['d'] || inputMap['arrowright'] ? 1 : 0) - (inputMap['a'] || inputMap['arrowleft'] ? 1 : 0));
    const mz = -jy + ((inputMap['w'] || inputMap['arrowup'] ? 1 : 0) - (inputMap['s'] || inputMap['arrowdown'] ? 1 : 0));
    const mag = Math.min(1, Math.hypot(mx, mz));
    if (mag > 0.06) {
      heading = Math.atan2(mx, mz);
      const step = SPEED * mag;
      const fxs = Math.sin(heading) * step, fzs = Math.cos(heading) * step;
      if (!gridCollide(p.x + fxs, p.z)) p.x += fxs;
      if (!gridCollide(p.x, p.z + fzs)) p.z += fzs;
      moving = true;
    }

    // fly arc over the chasm once fuelled
    const overPit = Math.abs(p.z - pitZ) < 2.4 && Math.abs(p.x) < 11;
    if (S.fuel && overPit) {
      const k = 1 - Math.min(1, Math.abs(p.z - pitZ) / 2.4);
      p.y = GROUND_Y + Math.sin(k * Math.PI) * 2.2;
    } else if (p.y !== GROUND_Y) {
      p.y += (GROUND_Y - p.y) * 0.3; if (Math.abs(p.y - GROUND_Y) < 0.02) p.y = GROUND_Y;
    }

    // animate rig
    rig.root.rotation.y = heading;
    if (moving) walkCycle += SPEED * 2.6;
    let yawVel = heading - prevHeading; if (yawVel > Math.PI) yawVel -= Math.PI * 2; if (yawVel < -Math.PI) yawVel += Math.PI * 2; prevHeading = heading;
    rig.update(moving, walkCycle, t, yawVel);

    // debris + flash
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i]; d.life -= 1 / 60;
      if (!d.settled) { d.v.y -= 0.012; d.m.position.addInPlace(d.v); d.m.rotation.x += d.av.x; d.m.rotation.y += d.av.y; if (d.m.position.y <= 0.2) { d.m.position.y = 0.2; d.settled = true; } }
      if (d.life <= 0) { d.m.dispose(); debris.splice(i, 1); }
    }
    if (flash) { flash.t += 1 / 60; const k = flash.t / 0.45; flash.m.scaling.setAll(1 + k * 6); flash.m.visibility = Math.max(0, 1 - k); if (k >= 1) { flash.m.dispose(); flash = null; } }

    // camera: frame the character's current chamber (pan on chamber change)
    const tz = chamberZ[chamberOf(p.z)];
    const goalPos = new Bb.Vector3(0, CAM_H, tz - CAM_BACK);
    camera.position = Bb.Vector3.Lerp(camera.position, goalPos, 0.08);
    camTarget.x += (0 - camTarget.x) * 0.1; camTarget.z += (tz - camTarget.z) * 0.08; camTarget.y = 0.6;
    camera.setTarget(camTarget);

    // prompt: what tapping the nearest eligible spot will do
    let near = null, nb = 3.4 * 3.4;
    for (const s of spots) { if (!s.elig()) continue; const sp = s.pos(); const d2 = (sp.x - p.x) ** 2 + (sp.z - p.z) ** 2; if (d2 < nb) { nb = d2; near = s; } }
    const pr = near ? `▶ USE — ${near.label()}` : '';
    if (pr !== lastPrompt) { lastPrompt = pr; promptEl.textContent = pr; promptEl.classList.toggle('show', !!pr); }
  };
  scene.registerBeforeRender(beforeRender);

  return {
    scene,
    interact: () => tryAutoInteract(),
    jump: () => {},
    dispose() {
      scene.unregisterBeforeRender(beforeRender);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      camera.dispose();
      overlayEl.innerHTML = '';
      scene.dispose();
    },
  };
}
