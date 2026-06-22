/**
 * The Attention Room — now a BRIGHT MINECRAFT-style room (lighter look).
 *
 * Blocky, pixel-textured, flat-bright lighting (no spotlight, no shadows). A
 * simple focus task remains: walk up to the 5 glowing blocks and collect them.
 * Returns { scene, interact, jump, dispose }.
 */
import { setupControls } from './roomControls';

// Babylon loads lazily on maze entry — read it at build time, not module load.
let B;

const R = 22, H = 3, TK = 1, half = R / 2; // low arena walls (like the gym) → bright & open
const EXIT = { x: -5, z: -half + 0.4 };

// 5 wool-block targets scattered around the room.
const TARGETS = [
  { x: -7, z: -2, color: '#e0584f' },
  { x: 7, z: -3, color: '#5fa9d8' },
  { x: -6, z: 6, color: '#8fbf6a' },
  { x: 8, z: 5, color: '#e6b13a' },
  { x: 1, z: 9, color: '#b07fd0' },
];

export function buildAttentionRoom({ engine, canvas, overlayEl, ctx, inputRef }) {
  B = window.BABYLON;
  const scene = new B.Scene(engine);
  if (B.ScenePerformancePriority) scene.performancePriority = B.ScenePerformancePriority.Intermediate;
  const sky = B.Color3.FromHexString('#8fc6ef'); // calm cartoon sky (matches the gym)
  scene.clearColor = new B.Color4(sky.r, sky.g, sky.b, 1);
  scene.ambientColor = new B.Color3(0.5, 0.5, 0.55); // restrained fill → value contrast

  // Flat toon materials (Clash-Royale style — saturated, lifted shadows, no spec).
  const toon = (name, hex, glow = 0.08) => {
    const m = new B.StandardMaterial(name, scene);
    const c = B.Color3.FromHexString(hex);
    m.diffuseColor = c; m.emissiveColor = c.scale(glow);
    m.specularColor = new B.Color3(0, 0, 0); m.ambientColor = new B.Color3(1, 1, 1);
    m.maxSimultaneousLights = 2;
    return m;
  };
  const grassMat = toon('mcGrassMat', '#6fae5a');  // grass (dominant)
  const stoneMat = toon('mcStoneMat', '#9a8f76');  // warm stone (secondary)
  const dirtMat = toon('mcDirtMat', '#9c6b3e');
  const leafMat = toon('mcLeafMat', '#57a046', 0.12);
  const woodMat = toon('mcWoodMat', '#7e5630');

  const box = (name, w, h, d, x, y, z, m, col) => {
    const b = B.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
    b.position.set(x, y, z); b.material = m; if (col) b.checkCollisions = true; b.freezeWorldMatrix();
    return b;
  };

  // ── Shell ── (checker grass floor like the gym → life + value variation) ──
  const floorTex = new B.DynamicTexture('mcFloor', { width: 256, height: 256 }, scene, false);
  (function (c) { const a = '#6fae5a', b = '#63a04e'; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? a : b; c.fillRect(i * 128, j * 128, 128, 128); } })(floorTex.getContext());
  floorTex.update(); floorTex.updateSamplingMode(B.Texture.NEAREST_SAMPLINGMODE); floorTex.wrapU = floorTex.wrapV = B.Texture.WRAP_ADDRESSMODE; floorTex.uScale = floorTex.vScale = R / 2;
  grassMat.diffuseTexture = floorTex;
  const floor = box('floor', R, TK, R, 0, -TK / 2, 0, grassMat, true);
  floor.receiveShadows = false;
  box('wN', R, H, TK, 0, H / 2, -half, stoneMat, true);
  box('wS', R, H, TK, 0, H / 2, half, stoneMat, true);
  box('wW', TK, H, R, -half, H / 2, 0, stoneMat, true);
  box('wE', TK, H, R, half, H / 2, 0, stoneMat, true);

  // ── A bit of Minecraft scenery (trees + scattered blocks) ──
  const tree = (x, z) => {
    box('trunk', 1, 3, 1, x, 1.5, z, woodMat, false);
    box('leaf', 3, 2, 3, x, 3.5, z, leafMat, false);
    box('leaf2', 2, 1.4, 2, x, 4.6, z, leafMat, false);
  };
  tree(-8, -7); tree(8, -7); tree(-8, 8); tree(8, 8);
  box('rock1', 1, 1, 1, 4, 0.5, -7, stoneMat, false);
  box('rock2', 1, 1, 1, 5, 0.5, -6.5, stoneMat, false);

  // Scenery: a stone path up the middle, bushes, flowers, a little pond.
  const pathMat = toon('mcPathMat', '#c7b48c', 0.1);
  for (let z = -8; z <= 8; z += 2) box('path' + z, 2.4, 0.08, 2.2, 0, 0.04, z, pathMat, false);
  const bush = toon('mcBushMat', '#4f9a44', 0.12);
  [[-6, -1], [6, 2], [-7, 5], [7, -3], [-2, -8], [3, 8]].forEach(([x, z], i) => box('bush' + i, 1.4, 0.9, 1.4, x, 0.45, z, bush, false));
  const fl = ['#e8584f', '#f0c040', '#d27fd0', '#5fb0e0'].map((c, i) => toon('mcFlower' + i, c, 0.35));
  [[-5, 3], [5, 5], [-9, -2], [9, 1], [2, -6], [-3, 9], [6, -8], [-8, 0]].forEach(([x, z], i) => box('fl' + i, 0.35, 0.5, 0.35, x, 0.25, z, fl[i % 4], false));
  box('pond', 4.2, 0.06, 3.2, 7.5, 0.05, 7.5, toon('mcPondMat', '#3f8fd0', 0.18), false);
  box('dirt1', 1, 1, 1, -3, 0.5, -2.5, dirtMat, false);

  // exit "portal" block (glowing) on the south wall by the spawn
  const exitMat = new B.StandardMaterial('mcExit', scene);
  exitMat.diffuseColor = B.Color3.FromHexString('#16d39a'); exitMat.emissiveColor = B.Color3.FromHexString('#0e7a5a');
  exitMat.specularColor = new B.Color3(0, 0, 0);
  box('exitDoor', 1.6, 2.6, 0.4, EXIT.x, 1.3, -half + 0.4, exitMat, false);

  // ── Controls (3rd-person, same as the hall) ──
  const ctrl = setupControls(scene, canvas, {
    inputRef,
    start: new B.Vector3(0, 0, -8),
    startYaw: 0,
    character: ctx.character,
    equipped: ctx.equipped,
    bounds: { hw: half, hd: half },
    lowPerf: ctx.lowPerf,
    topDown: true, camDist: 10, camHeight: 18, fov: 0.7, // Pokémon-style top-down
    charScale: 0.28, // small pixel/top-down character
    onInteract: interact,
  });

  // ── Bright daylight (no spotlight, no point lights) ──
  ctrl.keyLight.intensity = 1.05; // clear key light for form/value contrast
  ctrl.keyLight.direction = new B.Vector3(-0.4, -1, 0.4);
  const hemi = new B.HemisphericLight('mcHemi', new B.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.6; hemi.diffuse = new B.Color3(0.95, 0.97, 1);
  hemi.groundColor = new B.Color3(0.42, 0.44, 0.4); hemi.specular = new B.Color3(0, 0, 0);

  // ── Collectible wool blocks ──
  const targets = TARGETS.map((t, i) => {
    const base = B.Color3.FromHexString(t.color);
    const m = new B.StandardMaterial('woolM' + i, scene);
    m.diffuseColor = base; m.emissiveColor = base.scale(0.45); m.specularColor = new B.Color3(0, 0, 0);
    const cube = B.MeshBuilder.CreateBox('wool' + i, { size: 0.95 }, scene);
    cube.position.set(t.x, 1.1, t.z); cube.material = m;
    // glowing pad under it so it reads clearly from the top-down view
    const padMat = new B.StandardMaterial('woolPad' + i, scene);
    padMat.diffuseColor = base; padMat.emissiveColor = base.scale(0.7); padMat.specularColor = new B.Color3(0, 0, 0);
    const pad = B.MeshBuilder.CreateDisc('woolPadD' + i, { radius: 0.95, tessellation: 18 }, scene);
    pad.rotation.x = Math.PI / 2; pad.position.set(t.x, 0.06, t.z); pad.material = padMat;
    return { mesh: cube, pad, x: t.x, z: t.z, collected: false };
  });

  // ── Perf: no pointer-move picking + stop per-frame material dirty scans ──
  scene.skipPointerMovePicking = true;
  scene.blockMaterialDirtyMechanism = true;

  // ── HUD ──
  overlayEl.innerHTML = `
    <div class="rh-zone"><div class="rh-zone-k">Focus</div><div class="rh-zone-v">The Attention Room</div></div>
    <div class="ar-counter" id="arCount">Collected&nbsp; 0 / 5</div>
    <div class="rh-prompt" id="rhPrompt"></div>
    <div class="rh-instr">Walk to the glowing blocks · E to collect · reach the exit to leave</div>`;
  const promptEl = overlayEl.querySelector('#rhPrompt');
  const countEl = overlayEl.querySelector('#arCount');

  let collected = 0, done = false, nearRef = null, nearType = null;

  function complete() {
    if (done) return; done = true;
    ctx.updateXP?.(50); ctx.playSfx?.('chime');
    const panel = document.createElement('div');
    panel.className = 'ar-panel';
    panel.innerHTML = `
      <div class="ar-panel-k">Focus Cleared</div>
      <div class="ar-panel-t">All blocks collected!</div>
      <div class="ar-panel-d">Nice focus — you spotted and gathered every block in the room.</div>
      <button class="ar-panel-btn" id="arDone">+50 XP · Return to the Hall</button>`;
    overlayEl.appendChild(panel);
    panel.querySelector('#arDone').addEventListener('click', () => ctx.goToRoom('hall'));
  }

  function interact() {
    if (done) { ctx.goToRoom('hall'); return; }
    if (nearType === 'exit') { ctx.playSfx?.('click'); ctx.goToRoom('hall'); return; }
    if (nearType === 'target' && nearRef && !nearRef.collected) {
      nearRef.collected = true; nearRef.mesh.setEnabled(false); nearRef.pad.setEnabled(false);
      collected += 1; countEl.textContent = `Collected  ${collected} / 5`;
      ctx.playSfx?.('click'); ctx.updateXP?.(5);
      if (collected >= 5) complete();
    }
  }

  let lastPrompt = '';
  const beforeRender = () => {
    const t = performance.now() / 1000;
    targets.forEach((tg, i) => { if (!tg.collected) { tg.mesh.rotation.y += 0.02; tg.mesh.position.y = 1.2 + Math.sin(t * 2 + i) * 0.12; } });

    const p = ctrl.player.position;
    let best = 2.8; nearRef = null; nearType = null;
    for (const tg of targets) {
      if (tg.collected) continue;
      const d = Math.hypot(p.x - tg.x, p.z - tg.z);
      if (d < best) { best = d; nearRef = tg; nearType = 'target'; }
    }
    const de = Math.hypot(p.x - EXIT.x, p.z - EXIT.z);
    if (de < best) { best = de; nearRef = EXIT; nearType = 'exit'; }

    let pr = '';
    if (!done) {
      if (nearType === 'target') pr = '▶ press E to collect the block';
      else if (nearType === 'exit') pr = '▶ press E to return to the Hall';
    }
    if (pr !== lastPrompt) { lastPrompt = pr; promptEl.textContent = pr; promptEl.classList.toggle('show', !!pr); }
  };
  scene.registerBeforeRender(beforeRender);

  return {
    scene,
    interact,
    jump: ctrl.jump,
    dispose() {
      scene.unregisterBeforeRender(beforeRender);
      ctrl.dispose();
      overlayEl.innerHTML = '';
      scene.dispose();
    },
  };
}
