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
import { savePrefs, saveReminder, getReminder } from '../../../features/workout/workoutState';
import { ensureNotifPermission, syncNativeReminder } from '../../../features/workout/reminders';

const B = () => window.BABYLON;

const ROOM = 12, H = 3, TK = 0.6, half = ROOM / 2;
// A small, clear consultation room: walk up to the desk, sit, and the Coach
// asks what you want to train. The +z wall is the one the top-down camera
// looks toward, so the desk/Coach sit there and you walk forward into them.
const DESK = { x: 0, z: half - 2.4 };   // desk against the far (+z) wall
const COACH = { x: 0, z: half - 1.3 };  // standing behind the desk, facing you
const CHAIR = { x: 0, z: DESK.z - 1.6 }; // your chair, in front of the desk
const EXIT = { x: -half + 0.6, z: 0 };  // obvious door on the west wall
const TOPDOWN_SCALE = 0.28;             // tiny top-down rig
const CONVO_SCALE = 0.5;                // enlarged so it matches the Coach in the close-up

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
  floorTex.update(); floorTex.updateSamplingMode(Bb.Texture.NEAREST_SAMPLINGMODE); floorTex.wrapU = floorTex.wrapV = Bb.Texture.WRAP_ADDRESSMODE; floorTex.uScale = floorTex.vScale = ROOM / 2;
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

  // ── Props (kept minimal so the room reads small and clear) ──
  const dark = toon('gymDark', '#34303f');
  const wood = toon('gymWood', '#7a4f2c'), woodTop = toon('gymWoodTop', '#9a6838');
  const chairMat = toon('gymChair', '#3f6f8a');
  const green = toon('gymGreen', '#16d39a', 0.5), blue = toon('gymBlue', '#4f9fd8', 0.12);
  const cyl = (name, dia, h, x, y, z, m) => { const c = Bb.MeshBuilder.CreateCylinder(name, { diameter: dia, height: h, tessellation: 10 }, scene); c.position.set(x, y, z); c.material = m; c.freezeWorldMatrix(); return c; };

  // Reception desk (solid, so you stop at it) + overhanging top + nameplate.
  box('desk', 3, 1.0, 1.0, DESK.x, 0.5, DESK.z, wood, true);
  box('deskTop', 3.4, 0.16, 1.3, DESK.x, 1.04, DESK.z, woodTop, false);
  box('plate', 0.9, 0.06, 0.4, DESK.x, 1.15, DESK.z - 0.25, dark, false);

  // Your chair, in front of the desk (seat + back + legs). You sit here.
  box('chairSeat', 0.92, 0.14, 0.92, CHAIR.x, 0.5, CHAIR.z, chairMat, false);
  box('chairBack', 0.92, 0.95, 0.16, CHAIR.x, 0.98, CHAIR.z - 0.42, chairMat, false);
  [[-0.36, -0.36], [0.36, -0.36], [-0.36, 0.36], [0.36, 0.36]].forEach(([dx, dz], i) =>
    box('chairLeg' + i, 0.1, 0.5, 0.1, CHAIR.x + dx, 0.25, CHAIR.z + dz, dark, false));

  // Obvious EXIT door on the west wall: dark frame + glowing green panel +
  // glowing floor pad you stand on, plus an "EXIT" sign above it.
  box('exitFrame', 0.5, 2.7, 2.0, -half + 0.25, 1.35, EXIT.z, dark, false);
  box('exitPanel', 0.28, 2.3, 1.5, -half + 0.46, 1.2, EXIT.z, green, false);
  box('exitPad', 1.6, 0.14, 1.6, EXIT.x, 0.09, EXIT.z, green, false);
  const exitTex = new Bb.DynamicTexture('gymExitSign', { width: 256, height: 80 }, scene, false);
  (function (c) { c.fillStyle = '#0c3a2c'; c.fillRect(0, 0, 256, 80); c.fillStyle = '#9bf5d4'; c.font = 'bold 48px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ctx.currentLang === 'ar' ? 'القاعة' : 'EXIT', 128, 44); })(exitTex.getContext());
  exitTex.update(); exitTex.updateSamplingMode(Bb.Texture.NEAREST_SAMPLINGMODE);
  const exitSignMat = new Bb.StandardMaterial('gymExitSignMat', scene);
  exitSignMat.diffuseTexture = exitTex; exitSignMat.emissiveColor = new Bb.Color3(0.7, 0.7, 0.7); exitSignMat.specularColor = new Bb.Color3(0, 0, 0);
  const exitSign = box('exitSignBox', 0.16, 0.5, 1.5, -half + 0.55, 2.75, EXIT.z, exitSignMat, false); exitSign.material = exitSignMat;

  // A little life in the corners (potted plant + water cooler).
  cyl('pot', 0.62, 0.5, half - 0.9, 0.25, -half + 0.9, dark);
  cyl('plant', 1.1, 1.0, half - 0.9, 1.05, -half + 0.9, toon('gymPlant', '#2f7d4a', 0.1));
  box('cooler', 0.8, 1.4, 0.8, -half + 0.9, 0.7, half - 1.0, blue, false);
  box('coolerTop', 0.9, 0.3, 0.9, -half + 0.9, 1.5, half - 1.0, toon('gymWhite', '#dfe7f0', 0.1), false);

  // "GYM" sign on the far (+z) wall, behind the Coach.
  const signTex = new Bb.DynamicTexture('gymSign', { width: 256, height: 96 }, scene, false);
  const sc = signTex.getContext();
  sc.fillStyle = '#241d33'; sc.fillRect(0, 0, 256, 96);
  sc.fillStyle = '#ffce4a'; sc.font = 'bold 64px Arial'; sc.textAlign = 'center'; sc.textBaseline = 'middle'; sc.fillText('GYM', 128, 52);
  signTex.update(); signTex.updateSamplingMode(Bb.Texture.NEAREST_SAMPLINGMODE);
  const signMat = new Bb.StandardMaterial('gymSignMat', scene);
  signMat.diffuseTexture = signTex; signMat.emissiveColor = new Bb.Color3(0.6, 0.6, 0.6); signMat.specularColor = new Bb.Color3(0, 0, 0);
  const sign = box('sign', 3, 1.1, 0.2, 0, 2.2, half - 0.35, signMat, false); sign.material = signMat;

  // ── Controls: fixed top-down, screen-relative joystick. Spawn at the near
  //    (−z) side facing the desk so you walk forward into the Coach. ──
  const ctrl = setupControls(scene, canvas, {
    inputRef,
    start: new Bb.Vector3(0, 0, -half + 2),
    startYaw: 0, // face +z (toward the desk / Coach)
    character: ctx.character,
    equipped: ctx.equipped,
    lowPerf: ctx.lowPerf,
    bounds: { hw: half, hd: half },
    topDown: true, camDist: 6, camHeight: 13, fov: 0.82, // overhead, tuned for the small room
    charScale: TOPDOWN_SCALE, // small pixel/top-down character
    shadows: false, glow: false, // flat, bright room → skip the heavy shadow + glow passes (perf)
    onInteract: () => tryInteract(),
  });

  // ── Bright daylight (no shadows/point lights) ──
  ctrl.keyLight.intensity = 1.05; ctrl.keyLight.direction = new Bb.Vector3(-0.4, -1, 0.5); // clear key for form
  const hemi = new Bb.HemisphericLight('gymHemi', new Bb.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.6; hemi.diffuse = new Bb.Color3(0.95, 0.97, 1);
  hemi.groundColor = new Bb.Color3(0.4, 0.4, 0.46); hemi.specular = new Bb.Color3(0, 0, 0);

  // ── Coach — stands behind the desk, facing you ──
  const isAr = ctx.currentLang === 'ar';
  const npcKit = createNpcKit(Bb, scene, { cell: 4, interactDist: 3.6 });
  npcKit.spawn({ x: COACH.x, z: COACH.z, color: '#e8923a', name: isAr ? 'المدرب' : 'Coach', role: isAr ? 'تمرين اليوم' : 'Daily Training', scale: 0.8, accessory: 'cap' });

  // ── Perf: no pointer-move picking + stop per-frame material dirty scans ──
  scene.skipPointerMovePicking = true;
  scene.blockMaterialDirtyMechanism = true;

  // ── HUD ──
  overlayEl.innerHTML = `
    <div class="rh-zone"><div class="rh-zone-k">Daily Training</div><div class="rh-zone-v">The Gym</div></div>
    <div class="rh-prompt" id="rhPrompt"></div>
    <div class="rh-instr">Joystick to move · sit at the desk (E) · green door = exit</div>`;
  const promptEl = overlayEl.querySelector('#rhPrompt');

  // ── Cinematic conversation ───────────────────────────────────────────────
  // Sit → the camera swings to a cinematic over-the-shoulder TWO-SHOT that
  // frames both you (foreground) and the Coach (across the desk), then a
  // visual-novel dialogue plays: the Coach asks what you want, you pick.
  const ROOM_FOV = 0.82, CONVO_FOV = 0.85;
  // Cinematic 3/4 SIDE two-shot: the camera sits to the side and a little behind
  // you, looking diagonally across the desk so BOTH you (foreground) and the
  // Coach (beyond) are framed — like a film over-the-shoulder. Depth-stacked so
  // it still fits a portrait phone without going fish-eye.
  const CAM_POS = new Bb.Vector3(-2.7, 1.85, 0.8);
  const CAM_TGT = new Bb.Vector3(0.15, 1.12, 3.7);        // a point between you and the Coach
  const convoTgt = new Bb.Vector3(0, 0.8, 0);             // animated look-at
  const sitsInChair = ctx.character === 'male' || ctx.character === 'female';
  let convoActive = false, seated = false;

  function sit() {
    if (seated) return; seated = true;
    const p = ctrl.player.position;
    convoTgt.set(p.x, 0.9, p.z); // start the look from where you were standing
    ctrl.setFrozen(true);
    ctrl.setCharScale(CONVO_SCALE); // grow to match the Coach for the close-up
    if (sitsInChair) {
      ctrl.placeAt(CHAIR.x, CHAIR.z, 0); // snap into the chair, facing the Coach
      ctrl.setSeated(true);              // bend into a real sitting pose
    } else {
      // The fox doesn't read well crammed into a human chair — stand it beside it.
      ctrl.placeAt(CHAIR.x - 0.95, CHAIR.z + 0.1, 0);
    }
    ctrl.setCamLocked(true);
    convoActive = true;
  }
  function stand() {
    if (!seated) return; seated = false;
    convoActive = false;
    ctrl.setCamLocked(false);
    ctrl.camera.fov = ROOM_FOV; // hand the framing back to the top-down rig
    ctrl.setSeated(false);            // back to standing
    ctrl.setCharScale(TOPDOWN_SCALE); // shrink back to the top-down size
    ctrl.setFrozen(false);
    ctrl.placeAt(CHAIR.x, CHAIR.z - 1.0, 0); // stand up, step back from the desk
  }

  // Dialogue lines + state machine.
  const LINE = {
    greet: isAr ? 'أهلاً بك. تفضّل بالجلوس — لنُجهّز تمرين اليوم.' : "Welcome. Take a seat — let's set up today.",
    goal:  isAr ? 'ما الذي تريد العمل عليه اليوم؟' : 'What do you want to work on today?',
    dur:   isAr ? 'جميل. كم من الوقت لديك؟' : 'Good. How much time do you have?',
    mode:  isAr ? 'هل نجعلها خطتك اليومية، أم تمرين لمرة واحدة الآن؟' : 'Make this your daily plan, or just a one-off session now?',
    schedAsk: isAr ? 'هل تريد أن أضبط لك تذكيراً يومياً حتى لا تفوّت تمرينك؟' : 'Want me to set a daily reminder so you never miss a session?',
    schedSet: isAr ? 'متى أذكّرك، وفي أي أيام؟' : 'When should I remind you — and on which days?',
    go:    isAr ? 'ممتاز. هيا نبدأ!' : "Perfect. Let's get to work!",
  };
  const DAY_LABELS = isAr ? ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let convoOpen = false, convoEl = null, textEl = null, choicesEl = null;
  let selGoal = null, selSize = 'standard', typer = null, fullText = '', pendingDone = null;
  let schedTime = '08:00', schedDays = [0, 1, 2, 3, 4, 5, 6];

  function typeLine(text, done) {
    fullText = text; pendingDone = done || null;
    if (choicesEl) choicesEl.innerHTML = '';
    let i = 0; textEl.textContent = '';
    clearInterval(typer);
    typer = setInterval(() => {
      textEl.textContent = text.slice(0, ++i);
      if (i >= text.length) { clearInterval(typer); typer = null; const d = pendingDone; pendingDone = null; if (d) d(); }
    }, 18);
  }
  function finishTyping() { // tap to reveal the whole line + its choices at once
    if (!typer) return;
    clearInterval(typer); typer = null; textEl.textContent = fullText;
    const d = pendingDone; pendingDone = null; if (d) d();
  }
  function showChoices(list) {
    choicesEl.innerHTML = '';
    list.forEach((c) => {
      const b = document.createElement('button');
      b.className = 'gym-choice'; b.innerHTML = c.html || c.label;
      b.addEventListener('click', (e) => { e.stopPropagation(); ctx.playSfx?.('click'); c.onClick(); });
      choicesEl.appendChild(b);
    });
  }

  function stepGoal() {
    typeLine(LINE.goal, () => showChoices(GOALS.map((g) => ({
      html: `<span>${g.icon}</span>${isAr ? g.ar : g.en}`,
      onClick: () => { selGoal = g.id; stepDur(); },
    }))));
  }
  function stepDur() {
    typeLine(LINE.dur, () => showChoices(SIZES.map((s) => ({
      html: `${isAr ? s.ar : s.en} <small>${s.minutes}m</small>`,
      onClick: () => { selSize = s.id; stepMode(); },
    }))));
  }
  // Daily plan (persist + offer a reminder schedule) vs a one-off session now.
  function stepMode() {
    typeLine(LINE.mode, () => showChoices([
      { label: isAr ? 'اجعلها خطتي اليومية 📅' : 'My daily plan 📅', onClick: stepSchedule },
      { label: isAr ? 'تمرين الآن فقط ▶' : 'Just train now ▶', onClick: stepGo },
    ]));
  }
  function stepSchedule() {
    typeLine(LINE.schedAsk, () => showChoices([
      { label: isAr ? 'نعم، ذكّرني ⏰' : 'Yes, remind me ⏰', onClick: showScheduler },
      { label: isAr ? 'لا، شكراً' : 'No thanks', onClick: () => { saveReminder({ enabled: false, time: schedTime, days: schedDays }); stepGo(); } },
    ]));
  }
  function showScheduler() {
    typeLine(LINE.schedSet, () => {
      choicesEl.innerHTML = '';
      const form = document.createElement('div');
      form.className = 'gym-sched';
      form.innerHTML = `
        <label class="gym-sched-time">
          <span>${isAr ? 'الوقت' : 'Time'}</span>
          <input type="time" id="schedTime" value="${schedTime}">
        </label>
        <div class="gym-sched-dl">${isAr ? 'الأيام' : 'Days'}</div>
        <div class="gym-sched-days">
          ${DAY_LABELS.map((d, i) => `<button type="button" class="gym-day${schedDays.includes(i) ? ' on' : ''}" data-d="${i}">${d}</button>`).join('')}
        </div>
        <button class="gym-sched-save" id="schedSave">${isAr ? 'احفظ الجدول ✓' : 'Save schedule ✓'}</button>`;
      choicesEl.appendChild(form);
      form.addEventListener('click', (e) => e.stopPropagation());
      const timeInput = form.querySelector('#schedTime');
      timeInput.addEventListener('change', () => { schedTime = timeInput.value || schedTime; });
      form.querySelectorAll('.gym-day').forEach((b) => b.addEventListener('click', () => {
        const d = Number(b.dataset.d);
        schedDays = schedDays.includes(d) ? schedDays.filter((x) => x !== d) : [...schedDays, d];
        b.classList.toggle('on'); ctx.playSfx?.('click');
      }));
      form.querySelector('#schedSave').addEventListener('click', async () => {
        ctx.playSfx?.('click');
        if (!schedDays.length) schedDays = [0, 1, 2, 3, 4, 5, 6];
        saveReminder({ enabled: true, time: schedTime, days: schedDays });
        try { await ensureNotifPermission(); } catch { /* ignore */ }
        syncNativeReminder({ enabled: true, time: schedTime, days: schedDays }, isAr ? 'ar' : 'en');
        stepGo();
      });
    });
  }
  function stepGo() {
    typeLine(LINE.go, () => showChoices([
      { label: isAr ? 'لنبدأ ✓' : "Let's go ✓", onClick: startWorkout },
      { label: isAr ? 'تغيير الاختيار' : 'Change my mind', onClick: stepGoal },
    ]));
  }
  function startWorkout() {
    if (!selGoal) { stepGoal(); return; }
    savePrefs(selGoal, selSize); ctx.playSfx?.('collect'); closeConvo(); ctx.openWorkout?.('gym');
  }

  function openConvo() {
    if (convoOpen) return; convoOpen = true; selGoal = null; selSize = 'standard';
    const r = getReminder(); schedTime = r.time; schedDays = r.enabled ? [...r.days] : [0, 1, 2, 3, 4, 5, 6];
    sit();
    const el = document.createElement('div'); el.className = 'gym-convo';
    el.innerHTML = `
      <button class="gym-convo-leave" id="convoLeave" aria-label="leave">✕</button>
      <div class="gym-convo-card">
        <div class="gym-convo-name">${isAr ? 'المدرب' : 'COACH'}</div>
        <div class="gym-convo-text" id="convoText"></div>
        <div class="gym-convo-choices" id="convoChoices"></div>
      </div>`;
    overlayEl.appendChild(el); convoEl = el;
    textEl = el.querySelector('#convoText');
    choicesEl = el.querySelector('#convoChoices');
    el.querySelector('.gym-convo-card').addEventListener('click', finishTyping);
    el.querySelector('#convoLeave').addEventListener('click', () => { ctx.playSfx?.('click'); closeConvo(); });
    // Greet, then move on to the question.
    typeLine(LINE.greet, () => showChoices([{ label: isAr ? 'تابع ▶' : 'Continue ▶', onClick: stepGoal }]));
  }
  function closeConvo() {
    clearInterval(typer); typer = null;
    if (convoEl) { convoEl.remove(); convoEl = null; }
    convoOpen = false; stand();
  }

  let nearType = null;
  function tryInteract() {
    if (convoOpen) return;
    if (nearType === 'desk') { ctx.playSfx?.('click'); openConvo(); }
    else if (nearType === 'exit') { ctx.playSfx?.('click'); ctx.goToRoom('hall'); }
  }

  let lastPrompt = '';
  const beforeRender = () => {
    const t = performance.now() / 1000;
    const p = ctrl.player.position;
    npcKit.update(p, t); // keep the Coach's idle animation alive

    if (convoActive) {
      // Push the camera in toward the Coach's face and tighten the lens.
      ctrl.camera.position = Bb.Vector3.Lerp(ctrl.camera.position, CAM_POS, 0.12);
      convoTgt.copyFrom(Bb.Vector3.Lerp(convoTgt, CAM_TGT, 0.12));
      ctrl.camera.setTarget(convoTgt);
      ctrl.camera.fov += (CONVO_FOV - ctrl.camera.fov) * 0.12;
    }

    const deskNear = Math.hypot(p.x - DESK.x, p.z - CHAIR.z) < 1.9;
    const exitNear = Math.hypot(p.x - EXIT.x, p.z - EXIT.z) < 1.8;
    nearType = deskNear ? 'desk' : (exitNear ? 'exit' : null);
    let pr = '';
    if (!convoOpen) {
      if (nearType === 'desk') pr = isAr ? '▶ اضغط E للجلوس والتحدث مع المدرب' : '▶ press E to sit and talk to the Coach';
      else if (nearType === 'exit') pr = isAr ? '▶ اضغط E للعودة إلى القاعة' : '▶ press E to return to the Hall';
    }
    if (pr !== lastPrompt) { lastPrompt = pr; promptEl.textContent = pr; promptEl.classList.toggle('show', !!pr); }
  };
  scene.registerBeforeRender(beforeRender);

  return {
    scene,
    interact: tryInteract,
    jump: ctrl.jump,
    dispose() { scene.unregisterBeforeRender(beforeRender); clearInterval(typer); closeConvo(); npcKit.dispose(); ctrl.dispose(); overlayEl.innerHTML = ''; scene.dispose(); },
  };
}
