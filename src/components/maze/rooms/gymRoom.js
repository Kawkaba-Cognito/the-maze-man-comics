/**
 * The Gym — the daily-training room (green door). The player walks in, meets the
 * COACH, and sets today's goal in an in-gym panel; "Start Training" saves the
 * prefs and hands off to the real Daily Workout flow (the guided session runs as
 * the existing React screens — those ARE the training games).
 *
 * Built with the shared cheap patterns: instanced NPC + blob shadow, frozen
 * static geometry, scene performancePriority. Returns { scene, interact, jump,
 * dispose }.
 */
import { setupControls } from './roomControls';
import { createNpcKit } from './npc';
import { GOALS, SIZES } from '../../../features/workout/workoutData';
import { savePrefs } from '../../../features/workout/workoutState';

const B = () => window.BABYLON;

const ROOM = 20, H = 6, TK = 0.5, half = ROOM / 2;
const EXIT = { x: 4.5, z: half - 0.3 };

export function buildGymRoom({ engine, canvas, overlayEl, ctx, inputRef }) {
  const Bb = B();
  const scene = new Bb.Scene(engine);
  if (Bb.ScenePerformancePriority) scene.performancePriority = Bb.ScenePerformancePriority.Intermediate;
  const sky = Bb.Color3.FromHexString('#2a3140');
  scene.clearColor = new Bb.Color4(sky.r, sky.g, sky.b, 1);
  scene.fogMode = Bb.Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.006;
  scene.fogColor = sky;
  scene.ambientColor = new Bb.Color3(0.6, 0.62, 0.7); // brighter even fill

  const std = (name, hex, emis) => {
    const m = new Bb.StandardMaterial(name, scene);
    m.diffuseColor = Bb.Color3.FromHexString(hex);
    m.specularColor = new Bb.Color3(0.05, 0.05, 0.05);
    m.ambientColor = new Bb.Color3(1, 1, 1); // lets scene.ambientColor lift the shadows
    if (emis) m.emissiveColor = Bb.Color3.FromHexString(emis);
    m.maxSimultaneousLights = 6;
    return m;
  };
  const box = (name, w, h, d, x, y, z, mat, col) => {
    const b = Bb.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
    b.position.set(x, y, z); b.material = mat;
    if (col) b.checkCollisions = true;
    b.freezeWorldMatrix();
    return b;
  };

  // ── Shell: rubber floor with lane lines + light walls ──
  const floorTex = new Bb.DynamicTexture('gymFloor', { width: 256, height: 256 }, scene, true);
  (function (c) {
    c.fillStyle = '#23262e'; c.fillRect(0, 0, 256, 256);
    c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(0, 118, 256, 6); c.fillRect(0, 250, 256, 4);
    for (let i = 0; i < 200; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`; c.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
  })(floorTex.getContext());
  floorTex.update();
  floorTex.wrapU = floorTex.wrapV = Bb.Texture.WRAP_ADDRESSMODE;
  floorTex.uScale = floorTex.vScale = 5;
  const floorMat = std('gymFloorMat', '#23262e'); floorMat.diffuseTexture = floorTex;
  const floor = box('floor', ROOM, TK, ROOM, 0, -TK / 2, 0, floorMat, true);
  floor.receiveShadows = true;
  box('ceiling', ROOM, TK, ROOM, 0, H + TK / 2, 0, std('gymCeil', '#1c1f26'), false);
  const wallMat = std('gymWall', '#3a4250');
  box('wN', ROOM, H, TK, 0, H / 2, -half, wallMat, true);
  box('wS', ROOM, H, TK, 0, H / 2, half, wallMat, true);
  box('wW', TK, H, ROOM, -half, H / 2, 0, wallMat, true);
  box('wE', TK, H, ROOM, half, H / 2, 0, wallMat, true);

  // ── Gym props (decoration; mostly no collision so they never trap you) ──
  const matRed = std('gymRed', '#b8433a'), matBlue = std('gymBlue', '#4f7fc9');
  const matMetal = std('gymMetal', '#2c2f38'), matDark = std('gymDark', '#1a1d24');
  const matBar = std('gymBar', '#6a7280');
  // yoga mats
  box('mat1', 2.0, 0.08, 4.2, -6, 0.04, 2, matRed, false);
  box('mat2', 2.0, 0.08, 4.2, -6, 0.04, -3, matBlue, false);
  // dumbbell rack + dumbbells
  box('rack', 4, 1.0, 0.8, 6.5, 0.5, -6, matDark, false);
  [-1.2, 0, 1.2].forEach((dx, i) => {
    const bar = Bb.MeshBuilder.CreateCylinder('db' + i, { diameter: 0.16, height: 0.9, tessellation: 8 }, scene);
    bar.rotation.z = Math.PI / 2; bar.position.set(6.5 + dx, 1.05, -6); bar.material = matBar; bar.freezeWorldMatrix();
    [-0.45, 0.45].forEach((s, j) => {
      const w = Bb.MeshBuilder.CreateCylinder('dbw' + i + j, { diameter: 0.42, height: 0.18, tessellation: 10 }, scene);
      w.rotation.z = Math.PI / 2; w.position.set(6.5 + dx + s, 1.05, -6); w.material = matMetal; w.freezeWorldMatrix();
    });
  });
  // punching bag
  const bag = Bb.MeshBuilder.CreateCylinder('bag', { diameter: 0.7, height: 2.0, tessellation: 12 }, scene);
  bag.position.set(7, 1.6, 4); bag.material = matRed; bag.freezeWorldMatrix();
  box('bagStrap', 0.1, 0.7, 0.1, 7, 3.0, 4, matDark, false);
  // treadmill
  box('treadBase', 1.4, 0.3, 2.6, -7, 0.15, -7, matDark, false);
  box('treadDeck', 1.2, 0.08, 2.2, -7, 0.34, -7, matMetal, false);
  box('treadConsole', 1.2, 1.1, 0.18, -7, 1.0, -8.1, matDark, false);
  // pull-up bar
  box('puL', 0.16, 2.6, 0.16, 2.5, 1.3, -8.5, matMetal, false);
  box('puR', 0.16, 2.6, 0.16, 5.5, 1.3, -8.5, matMetal, false);
  const puBar = Bb.MeshBuilder.CreateCylinder('puBar', { diameter: 0.12, height: 3.1, tessellation: 8 }, scene);
  puBar.rotation.z = Math.PI / 2; puBar.position.set(4, 2.55, -8.5); puBar.material = matBar; puBar.freezeWorldMatrix();

  // exit door (glowing) on the south wall, by the spawn
  box('exitDoor', 1.6, 2.6, 0.2, EXIT.x, 1.3, half - 0.2, std('gymExit', '#0c3b2a', '#16d39a'), false);

  // ── Controls (standard chase cam) ──
  const ctrl = setupControls(scene, canvas, {
    inputRef,
    start: new Bb.Vector3(0, 0, 6),
    startYaw: Math.PI, // face north toward the coach
    character: ctx.character,
    equipped: ctx.equipped,
    lowPerf: ctx.lowPerf,
    bounds: { hw: half, hd: half },
    onInteract: () => tryInteract(),
  });

  // ── Lighting (bright, gym-like) ──
  const hemi = new Bb.HemisphericLight('gymHemi', new Bb.Vector3(0, 1, 0), scene);
  hemi.intensity = 1.15; hemi.diffuse = new Bb.Color3(0.95, 0.97, 1.0);
  hemi.groundColor = new Bb.Color3(0.45, 0.47, 0.55); hemi.specular = new Bb.Color3(0, 0, 0);
  ctrl.keyLight.intensity = 1.15;
  // ceiling light strips (emissive — free) + 2 real lamps on desktop
  const panelMat = std('gymPanelL', '#fff4d8', '#fff0cc');
  [[-5, -5], [5, 5]].forEach(([fx, fz], i) => {
    const panel = box('lp' + i, 3, 0.12, 3, fx, H - 0.12, fz, panelMat, false);
    ctrl.kit.glow(panel);
    if (!ctx.lowPerf) {
      const pl = new Bb.PointLight('gymL' + i, new Bb.Vector3(fx, H - 0.7, fz), scene);
      pl.diffuse = new Bb.Color3(1, 0.94, 0.8); pl.intensity = 0.5; pl.range = 16; pl.specular = new Bb.Color3(0, 0, 0);
    }
  });

  // ── Coach NPC ──
  const isAr = ctx.currentLang === 'ar';
  const npcKit = createNpcKit(Bb, scene, { cell: 4, interactDist: 3.0 });
  const coach = npcKit.spawn({
    x: 0, z: -2, color: '#e8923a',
    name: isAr ? 'المدرب' : 'Coach',
    role: isAr ? 'تمرين اليوم' : 'Daily Training',
  });

  // ── HUD ──
  overlayEl.innerHTML = `
    <div class="rh-zone"><div class="rh-zone-k">Daily Training</div><div class="rh-zone-v">The Gym</div></div>
    <div class="rh-prompt" id="rhPrompt"></div>
    <div class="rh-instr">Turn with A/D · walk with W/S · talk to the Coach · E</div>`;
  const promptEl = overlayEl.querySelector('#rhPrompt');

  // ── Coach goal panel (in-gym overlay) ──
  let panelOpen = false, panelEl = null, selGoal = null, selSize = 'standard';
  function closePanel() { if (panelEl) { panelEl.remove(); panelEl = null; } panelOpen = false; }
  function openPanel() {
    if (panelOpen) return;
    panelOpen = true;
    selGoal = null; selSize = 'standard';
    const goalsHtml = GOALS.map((g) => `<button class="gym-goal" data-g="${g.id}"><span>${g.icon}</span>${isAr ? g.ar : g.en}</button>`).join('');
    const sizesHtml = SIZES.map((s) => `<button class="gym-size${s.id === selSize ? ' sel' : ''}" data-s="${s.id}">${isAr ? s.ar : s.en}<small>${s.minutes}m</small></button>`).join('');
    const el = document.createElement('div');
    el.className = 'gym-panel';
    el.innerHTML = `
      <div class="gym-coach-k">${isAr ? 'المدرب' : 'COACH'}</div>
      <div class="gym-coach-t">${isAr ? 'جاهز لتمرين اليوم؟ اختر هدفك.' : "Ready for today's session? Pick your goal."}</div>
      <div class="gym-sec">${isAr ? 'الهدف' : 'GOAL'}</div>
      <div class="gym-goals">${goalsHtml}</div>
      <div class="gym-sec">${isAr ? 'المدة' : 'DURATION'}</div>
      <div class="gym-sizes">${sizesHtml}</div>
      <button class="gym-start" id="gymStart" disabled>${isAr ? 'ابدأ التمرين' : 'Start Training'}</button>
      <button class="gym-close" id="gymClose">${isAr ? 'ليس الآن' : 'Not now'}</button>`;
    overlayEl.appendChild(el);
    panelEl = el;
    const startBtn = el.querySelector('#gymStart');
    el.querySelectorAll('.gym-goal').forEach((b) => b.addEventListener('click', () => {
      selGoal = b.dataset.g;
      el.querySelectorAll('.gym-goal').forEach((x) => x.classList.toggle('sel', x === b));
      startBtn.disabled = false;
    }));
    el.querySelectorAll('.gym-size').forEach((b) => b.addEventListener('click', () => {
      selSize = b.dataset.s;
      el.querySelectorAll('.gym-size').forEach((x) => x.classList.toggle('sel', x === b));
    }));
    startBtn.addEventListener('click', () => {
      if (!selGoal) return;
      savePrefs(selGoal, selSize);
      ctx.playSfx?.('collect');
      closePanel();
      ctx.openWorkout?.('gym'); // run the real session, then return to the Gym

    });
    el.querySelector('#gymClose').addEventListener('click', () => { ctx.playSfx?.('click'); closePanel(); });
  }

  let nearType = null;
  function tryInteract() {
    if (panelOpen) return;
    if (nearType === 'coach') { ctx.playSfx?.('click'); openPanel(); }
    else if (nearType === 'exit') { ctx.playSfx?.('click'); ctx.goToRoom('hall'); }
  }

  let lastPrompt = '';
  const beforeRender = () => {
    const t = performance.now() / 1000;
    const p = ctrl.player.position;
    const coachNear = npcKit.update(p, t);
    const exitNear = Math.hypot(p.x - EXIT.x, p.z - EXIT.z) < 2.6;
    nearType = coachNear ? 'coach' : (exitNear ? 'exit' : null);
    let pr = '';
    if (!panelOpen) {
      if (nearType === 'coach') pr = isAr ? '▶ اضغط E للتدرّب مع المدرب' : '▶ press E to train with the Coach';
      else if (nearType === 'exit') pr = isAr ? '▶ اضغط E للعودة إلى القاعة' : '▶ press E to return to the Hall';
    }
    if (pr !== lastPrompt) { lastPrompt = pr; promptEl.textContent = pr; promptEl.classList.toggle('show', !!pr); }
  };
  scene.registerBeforeRender(beforeRender);

  return {
    scene,
    interact: tryInteract,
    jump: ctrl.jump,
    dispose() {
      scene.unregisterBeforeRender(beforeRender);
      closePanel();
      npcKit.dispose();
      ctrl.dispose();
      overlayEl.innerHTML = '';
      scene.dispose();
    },
  };
}
