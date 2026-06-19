/**
 * The Gym — CLASH-ROYALE STYLE prototype (the intended single style for the whole
 * 3D world): a bright cartoon "arena" seen from a fixed isometric/top-down camera,
 * flat toon shading, joystick movement, no heavy lighting/shadows/bloom → light
 * and mobile-friendly.
 *
 * Gameplay unchanged: meet the Coach → set today's goal → launch the Daily Workout
 * (returns to the Gym afterward). Returns { scene, interact, jump, dispose }.
 */
import { setupControls } from './roomControls';
import { createNpcKit } from './npc';
import { GOALS, SIZES } from '../../../features/workout/workoutData';
import { savePrefs } from '../../../features/workout/workoutState';

const B = () => window.BABYLON;

const ROOM = 18, H = 3, TK = 0.6, half = ROOM / 2;
const EXIT = { x: 4.5, z: half - 0.3 };

export function buildGymRoom({ engine, canvas, overlayEl, ctx, inputRef }) {
  const Bb = B();
  const scene = new Bb.Scene(engine);
  if (Bb.ScenePerformancePriority) scene.performancePriority = Bb.ScenePerformancePriority.Intermediate;
  const sky = Bb.Color3.FromHexString('#8fc6ef'); // calm cartoon sky
  scene.clearColor = new Bb.Color4(sky.r, sky.g, sky.b, 1);
  scene.ambientColor = new Bb.Color3(0.5, 0.5, 0.56); // restrained fill → value contrast

  // Toon material — low self-glow so the key light shapes it (no washed-out look).
  const toon = (name, hex, glow = 0.08) => {
    const m = new Bb.StandardMaterial(name, scene);
    const c = Bb.Color3.FromHexString(hex);
    m.diffuseColor = c; m.emissiveColor = c.scale(glow);
    m.specularColor = new Bb.Color3(0, 0, 0);
    m.ambientColor = new Bb.Color3(1, 1, 1);
    m.maxSimultaneousLights = 2;
    return m;
  };
  const box = (name, w, h, d, x, y, z, m, col) => {
    const b = Bb.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
    b.position.set(x, y, z); b.material = m; if (col) b.checkCollisions = true; b.freezeWorldMatrix();
    return b;
  };

  // ── Arena floor: clean 2-tone checker (bright) ──
  const floorTex = new Bb.DynamicTexture('gymFloor', { width: 256, height: 256 }, scene, false);
  (function (c) {
    const a = '#caa97a', b = '#bb9866'; // warm wood/sand floor (dominant ~60%)
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? a : b; c.fillRect(i * 128, j * 128, 128, 128); }
  })(floorTex.getContext());
  floorTex.update(); floorTex.wrapU = floorTex.wrapV = Bb.Texture.WRAP_ADDRESSMODE; floorTex.uScale = floorTex.vScale = ROOM / 2;
  const floorMat = toon('gymFloorMat', '#c2a172'); floorMat.diffuseTexture = floorTex;
  const floor = box('floor', ROOM, TK, ROOM, 0, -TK / 2, 0, floorMat, true);

  // ── Low arena border walls (secondary ~30%) + gold corner posts (accent) ──
  const wallMat = toon('gymWall', '#2f5d66');         // deep teal rim
  const postMat = toon('gymPost', '#ffce4a', 0.22);   // gold posts
  box('wN', ROOM, H, TK, 0, H / 2, -half, wallMat, true);
  box('wS', ROOM, H, TK, 0, H / 2, half, wallMat, true);
  box('wW', TK, H, ROOM, -half, H / 2, 0, wallMat, true);
  box('wE', TK, H, ROOM, half, H / 2, 0, wallMat, true);
  [[-half, -half], [half, -half], [-half, half], [half, half]].forEach(([px, pz], i) => box('post' + i, 1, H + 0.8, 1, px, (H + 0.8) / 2, pz, postMat, false));

  // ── Props: teal mats (secondary), orange/metal equipment (accent) ──
  const orange = toon('gymOrange', '#ef7a3a', 0.18), teal = toon('gymTeal', '#3a7d86');
  const dark = toon('gymDark', '#34303f'), metal = toon('gymMetal', '#7f8aa3');
  box('mat1', 2.4, 0.18, 4.4, -5.5, 0.09, 1.5, teal, false);
  box('mat2', 2.4, 0.18, 4.4, -5.5, 0.09, -3.2, teal, false);
  box('rack', 4, 1.0, 0.8, 5.5, 0.5, -5.5, dark, false);
  [-1.2, 0, 1.2].forEach((dx, i) => {
    [-0.45, 0.45].forEach((s, j) => box('dbw' + i + j, 0.5, 0.46, 0.5, 5.5 + dx + s, 1.1, -5.5, metal, false));
  });
  const bag = Bb.MeshBuilder.CreateCylinder('bag', { diameter: 0.8, height: 2.0, tessellation: 10 }, scene);
  bag.position.set(6, 1.2, 3.5); bag.material = orange; bag.freezeWorldMatrix();

  // exit pad (glowing) by the spawn
  box('exitDoor', 1.8, 0.2, 1.8, EXIT.x, 0.11, EXIT.z, toon('gymExit', '#16d39a', 0.6), false);

  // ── Controls: fixed isometric/top-down (CR), screen-relative joystick ──
  const ctrl = setupControls(scene, canvas, {
    inputRef,
    start: new Bb.Vector3(0, 0, 5),
    startYaw: Math.PI,
    character: ctx.character,
    equipped: ctx.equipped,
    lowPerf: ctx.lowPerf,
    bounds: { hw: half, hd: half },
    topDown: true, camDist: 10, camHeight: 18, fov: 0.7, // Pokémon-style top-down
    onInteract: () => tryInteract(),
  });

  // ── Bright daylight (no shadows/point lights) ──
  ctrl.keyLight.intensity = 1.05; ctrl.keyLight.direction = new Bb.Vector3(-0.4, -1, 0.5); // clear key for form
  const hemi = new Bb.HemisphericLight('gymHemi', new Bb.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.6; hemi.diffuse = new Bb.Color3(0.95, 0.97, 1);
  hemi.groundColor = new Bb.Color3(0.4, 0.4, 0.46); hemi.specular = new Bb.Color3(0, 0, 0);

  // ── Coach ──
  const isAr = ctx.currentLang === 'ar';
  const npcKit = createNpcKit(Bb, scene, { cell: 4, interactDist: 3.0 });
  npcKit.spawn({ x: 0, z: -2, color: '#e8923a', name: isAr ? 'المدرب' : 'Coach', role: isAr ? 'تمرين اليوم' : 'Daily Training', scale: 1.05, accessory: 'cap' });

  // ── Perf: no pointer-move picking + stop per-frame material dirty scans ──
  scene.skipPointerMovePicking = true;
  scene.blockMaterialDirtyMechanism = true;

  // ── HUD ──
  overlayEl.innerHTML = `
    <div class="rh-zone"><div class="rh-zone-k">Daily Training</div><div class="rh-zone-v">The Gym</div></div>
    <div class="rh-prompt" id="rhPrompt"></div>
    <div class="rh-instr">Joystick to move · talk to the Coach · E</div>`;
  const promptEl = overlayEl.querySelector('#rhPrompt');

  // ── Coach goal panel (unchanged gameplay) ──
  let panelOpen = false, panelEl = null, selGoal = null, selSize = 'standard';
  function closePanel() { if (panelEl) { panelEl.remove(); panelEl = null; } panelOpen = false; }
  function openPanel() {
    if (panelOpen) return; panelOpen = true; selGoal = null; selSize = 'standard';
    const goalsHtml = GOALS.map((g) => `<button class="gym-goal" data-g="${g.id}"><span>${g.icon}</span>${isAr ? g.ar : g.en}</button>`).join('');
    const sizesHtml = SIZES.map((s) => `<button class="gym-size${s.id === selSize ? ' sel' : ''}" data-s="${s.id}">${isAr ? s.ar : s.en}<small>${s.minutes}m</small></button>`).join('');
    const el = document.createElement('div'); el.className = 'gym-panel';
    el.innerHTML = `
      <div class="gym-coach-k">${isAr ? 'المدرب' : 'COACH'}</div>
      <div class="gym-coach-t">${isAr ? 'جاهز لتمرين اليوم؟ اختر هدفك.' : "Ready for today's session? Pick your goal."}</div>
      <div class="gym-sec">${isAr ? 'الهدف' : 'GOAL'}</div><div class="gym-goals">${goalsHtml}</div>
      <div class="gym-sec">${isAr ? 'المدة' : 'DURATION'}</div><div class="gym-sizes">${sizesHtml}</div>
      <button class="gym-start" id="gymStart" disabled>${isAr ? 'ابدأ التمرين' : 'Start Training'}</button>
      <button class="gym-close" id="gymClose">${isAr ? 'ليس الآن' : 'Not now'}</button>`;
    overlayEl.appendChild(el); panelEl = el;
    const startBtn = el.querySelector('#gymStart');
    el.querySelectorAll('.gym-goal').forEach((bt) => bt.addEventListener('click', () => { selGoal = bt.dataset.g; el.querySelectorAll('.gym-goal').forEach((x) => x.classList.toggle('sel', x === bt)); startBtn.disabled = false; }));
    el.querySelectorAll('.gym-size').forEach((bt) => bt.addEventListener('click', () => { selSize = bt.dataset.s; el.querySelectorAll('.gym-size').forEach((x) => x.classList.toggle('sel', x === bt)); }));
    startBtn.addEventListener('click', () => { if (!selGoal) return; savePrefs(selGoal, selSize); ctx.playSfx?.('collect'); closePanel(); ctx.openWorkout?.('gym'); });
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
    const exitNear = Math.hypot(p.x - EXIT.x, p.z - EXIT.z) < 2.4;
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
    dispose() { scene.unregisterBeforeRender(beforeRender); closePanel(); npcKit.dispose(); ctrl.dispose(); overlayEl.innerHTML = ''; scene.dispose(); },
  };
}
