/**
 * The Attention Room — a single open room about the psychology of attention.
 *
 * The concept made literal: the room is dark, and a bright SPOTLIGHT follows
 * the player — you only clearly see what your "attention" is on. Scattered
 * around are five faintly-glowing FOCUS TARGETS; walk up and "notice" each one
 * (serial visual search — moving the attentional spotlight).
 *
 * The twist: while you're busy hunting targets, an obvious magenta creature
 * strolls right across the room. Most players, absorbed in the task, never see
 * it — INATTENTIONAL BLINDNESS. On finishing, the room reveals the lesson.
 *
 * Deliberately light: one spotlight, low ambient, a handful of small meshes,
 * one simple creature. Returns { scene, interact, jump, dispose }.
 */
import { setupControls } from './roomControls';

const B = window.BABYLON;

const R = 22, H = 6, half = R / 2;

const TARGETS = [
  { x: -7, z: -2, shape: 'torus',  color: '#ffcc33' },
  { x: 7,  z: -3, shape: 'box',    color: '#33e0ff' },
  { x: -6, z: 6,  shape: 'cone',   color: '#ff8a3d' },
  { x: 8,  z: 5,  shape: 'cyl',    color: '#9b6cff' },
  { x: 1,  z: 9,  shape: 'sphere', color: '#66ff99' },
];

const EXIT = { x: -5, z: -half + 0.25 };

export function buildAttentionRoom({ engine, canvas, overlayEl, ctx, inputRef }) {
  const scene = new B.Scene(engine);
  if (B.ScenePerformancePriority) scene.performancePriority = B.ScenePerformancePriority.Intermediate;
  const bg = B.Color3.FromHexString('#1b1b30');
  scene.clearColor = new B.Color4(bg.r, bg.g, bg.b, 1);
  scene.collisionsEnabled = true;
  scene.fogMode = B.Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.012;
  scene.fogColor = bg;
  scene.ambientColor = new B.Color3(0.5, 0.52, 0.62); // even fill (needs material.ambientColor)

  const L = (a, b, t) => a + (b - a) * t;
  const std = (name, hex, emis, alpha) => {
    const m = new B.StandardMaterial(name, scene);
    m.diffuseColor = B.Color3.FromHexString(hex);
    m.specularColor = new B.Color3(0.05, 0.05, 0.05);
    if (emis) m.emissiveColor = B.Color3.FromHexString(emis);
    if (alpha != null) m.alpha = alpha;
    m.ambientColor = new B.Color3(1, 1, 1); // lets scene.ambientColor lift the shadows
    return m;
  };
  const box = (name, w, h, d, x, y, z, m, col) => {
    const b = B.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
    b.position.set(x, y, z); b.material = m;
    if (col) b.checkCollisions = true;
    return b;
  };

  // ── Shell: a real furnished room — tiled floor, panelled walls with a gold
  //    trim line + baseboard, corner pilasters. Still on the moody side so the
  //    attention spotlight reads, but clearly a designed space. ──

  // Tiled floor (dynamic texture: indigo tiles + gold grout + speckle).
  const floorTex = new B.DynamicTexture('aFloorTex', { width: 512, height: 512 }, scene, true);
  (function drawFloor(c) {
    c.fillStyle = '#1a1a2b'; c.fillRect(0, 0, 512, 512);
    const n = 4, cell = 512 / n;
    for (let gy = 0; gy < n; gy++) for (let gx = 0; gx < n; gx++) {
      const tone = 30 + Math.random() * 12;
      c.fillStyle = `rgb(${tone | 0},${tone | 0},${(tone * 1.5) | 0})`;
      c.fillRect(gx * cell + 4, gy * cell + 4, cell - 8, cell - 8);
    }
    c.strokeStyle = 'rgba(201,162,74,0.30)'; c.lineWidth = 3; // gold grout
    for (let i = 0; i <= n; i++) {
      c.beginPath(); c.moveTo(i * cell, 0); c.lineTo(i * cell, 512); c.stroke();
      c.beginPath(); c.moveTo(0, i * cell); c.lineTo(512, i * cell); c.stroke();
    }
    for (let i = 0; i < 200; i++) { c.fillStyle = 'rgba(180,190,255,0.05)'; c.fillRect(Math.random() * 512, Math.random() * 512, 2, 2); }
  })(floorTex.getContext());
  floorTex.update();
  floorTex.wrapU = floorTex.wrapV = B.Texture.WRAP_ADDRESSMODE;
  floorTex.uScale = floorTex.vScale = 2;
  const floorMat = std('aFloor', '#1a1a2b');
  floorMat.diffuseTexture = floorTex;
  const floor = box('floor', R, 0.4, R, 0, -0.2, 0, floorMat, true);
  floor.receiveShadows = true;

  box('ceiling', R, 0.4, R, 0, H + 0.2, 0, std('aCeil', '#14141f'), false);

  // Walls (indigo) + a darker wainscot band + gold trim + baseboard per wall.
  const wallMat = std('aWall', '#262640');
  const wainMat = std('aWain', '#1c1c30');
  const trimMat = std('aTrim', '#c9a24a', '#5a4416'); // gold, slight glow
  const baseMat = std('aBase', '#12121c');
  const WAIN = 1.8;   // wainscot height
  const makeWall = (nm, w, d, x, z, horiz) => {
    box('w' + nm, w, H, d, x, H / 2, z, wallMat, true);
    const inset = 0.05;
    if (horiz) {
      box('wain' + nm, w - 0.4, WAIN, 0.12, x, WAIN / 2, z + (z < 0 ? inset : -inset), wainMat, false);
      box('trim' + nm, w - 0.4, 0.12, 0.16, x, WAIN, z + (z < 0 ? inset : -inset), trimMat, false);
      box('base' + nm, w - 0.4, 0.28, 0.16, x, 0.14, z + (z < 0 ? inset : -inset), baseMat, false);
    } else {
      box('wain' + nm, 0.12, WAIN, d - 0.4, x + (x < 0 ? inset : -inset), WAIN / 2, z, wainMat, false);
      box('trim' + nm, 0.16, 0.12, d - 0.4, x + (x < 0 ? inset : -inset), WAIN, z, trimMat, false);
      box('base' + nm, 0.16, 0.28, d - 0.4, x + (x < 0 ? inset : -inset), 0.14, z, baseMat, false);
    }
  };
  makeWall('N', R, 0.4, 0, -half, true);
  makeWall('S', R, 0.4, 0, half, true);
  makeWall('W', 0.4, R, -half, 0, false);
  makeWall('E', 0.4, R, half, 0, false);

  // Corner pilasters (architecture).
  const pilMat = std('aPil', '#2e2e4c');
  [[-half + 0.3, -half + 0.3], [half - 0.3, -half + 0.3], [-half + 0.3, half - 0.3], [half - 0.3, half - 0.3]].forEach(([px, pz], i) => {
    box('pil' + i, 0.7, H, 0.7, px, H / 2, pz, pilMat, false);
  });

  // Exit door (glowing teal) on the south wall, behind the spawn.
  box('exitDoor', 1.6, 2.6, 0.2, EXIT.x, 1.3, -half + 0.25, std('aExit', '#0c3b2a', '#16d39a'), false);

  // ── Controls (chase cam + visible character + jump) ──
  const ctrl = setupControls(scene, canvas, {
    inputRef,
    start: new B.Vector3(0, 0, -8),
    startYaw: 0,
    character: ctx.character,
    equipped: ctx.equipped,
    bounds: { hw: half, hd: half },
    lowPerf: ctx.lowPerf,
    onInteract: interact,
    onAction2: action2,
  });

  // Lit enough to read the room as a designed space, while the player's
  // spotlight stays the brightest pool.
  ctrl.keyLight.intensity = 0.8;
  const hemi = new B.HemisphericLight('aHemi', new B.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.8;
  hemi.diffuse = new B.Color3(0.82, 0.85, 1.0);
  hemi.groundColor = new B.Color3(0.3, 0.32, 0.42);
  hemi.specular = new B.Color3(0, 0, 0);

  // Ceiling light fixtures: emissive panels (free — no per-light cost) read as
  // ceiling lights and bloom via the glow layer. On desktop a couple of warm
  // point lights add real pools; phones skip those to keep the light count low.
  const panelMat = std('aPanel', '#fff4d8', '#fff0cc');
  const fixtures = [[-6, -6], [6, -6], [-6, 6], [6, 6]];
  fixtures.forEach(([fx, fz], i) => {
    const panel = box('lpanel' + i, 2.4, 0.12, 2.4, fx, H - 0.12, fz, panelMat, false);
    ctrl.kit.glow(panel);
    if (!ctx.lowPerf) {
      const pl = new B.PointLight('aPL' + i, new B.Vector3(fx, H - 0.6, fz), scene);
      pl.diffuse = new B.Color3(1, 0.93, 0.78);
      pl.intensity = 0.5; pl.range = 12;
      pl.specular = new B.Color3(0, 0, 0);
    }
  });

  // The "attention spotlight": a bright pool that follows the player.
  const spot = new B.SpotLight('attnSpot', new B.Vector3(0, 5, 0), new B.Vector3(0, -1, 0), 1.05, 12, scene);
  spot.parent = ctrl.player;
  spot.position = new B.Vector3(0, 5, 0);
  spot.diffuse = new B.Color3(1, 0.96, 0.85);
  spot.intensity = 5.5;
  spot.range = 15;

  // ── Focus targets ──
  const pedMat = std('pedM', '#23233a');
  const targets = TARGETS.map((t, i) => {
    const ped = B.MeshBuilder.CreateCylinder('ped' + i, { diameterTop: 0.7, diameterBottom: 0.95, height: 1, tessellation: 12 }, scene);
    ped.position.set(t.x, 0.5, t.z); ped.material = pedMat; ped.checkCollisions = true;

    const base = B.Color3.FromHexString(t.color);
    const mat = std('symM' + i, t.color);
    mat.emissiveColor = base.scale(0.45); // faint glow until noticed
    let sym;
    if (t.shape === 'torus') sym = B.MeshBuilder.CreateTorus('sym_' + i, { diameter: 0.75, thickness: 0.22, tessellation: 18 }, scene);
    else if (t.shape === 'box') sym = B.MeshBuilder.CreateBox('sym_' + i, { size: 0.6 }, scene);
    else if (t.shape === 'cone') sym = B.MeshBuilder.CreateCylinder('sym_' + i, { diameterTop: 0, diameterBottom: 0.75, height: 0.85, tessellation: 16 }, scene);
    else if (t.shape === 'cyl') sym = B.MeshBuilder.CreateCylinder('sym_' + i, { diameter: 0.55, height: 0.85, tessellation: 16 }, scene);
    else sym = B.MeshBuilder.CreateSphere('sym_' + i, { diameter: 0.68, segments: 12 }, scene);
    sym.material = mat; sym.position.set(t.x, 1.7, t.z);
    return { i, mesh: sym, mat, base, x: t.x, z: t.z, noticed: false };
  });

  // ── Throwable orbs (pick up with GRAB / F, press again to throw) ──
  const ORB_COLORS = ['#ff5a5a', '#5ad1ff', '#ffe05a', '#9b6cff'];
  const throwables = ORB_COLORS.map((c, i) => {
    const orb = B.MeshBuilder.CreateSphere('orb' + i, { diameter: 0.5, segments: 12 }, scene);
    const m = std('orbM' + i, c);
    m.emissiveColor = B.Color3.FromHexString(c).scale(0.4);
    orb.material = m;
    const ax = [-3, 3, -2, 4][i], az = [-4, -5, 3, 2][i];
    orb.position.set(ax, 0.25, az);
    return { mesh: orb, vel: new B.Vector3(0, 0, 0), r: 0.25, held: false, rest: true };
  });
  let held = null;

  // ── The unexpected creature (inattentional-blindness event) ──
  const creature = new B.TransformNode('creature', scene);
  const cMat = std('cMat', '#ff33cc'); cMat.emissiveColor = B.Color3.FromHexString('#cc1199');
  const cBody = B.MeshBuilder.CreateSphere('cBody', { diameter: 1.1, segments: 12 }, scene);
  cBody.scaling.set(1, 1.25, 1); cBody.material = cMat; cBody.parent = creature; cBody.position.y = 0.95;
  const cHead = B.MeshBuilder.CreateSphere('cHead', { diameter: 0.72, segments: 12 }, scene);
  cHead.material = cMat; cHead.parent = creature; cHead.position.y = 1.75;
  const eyeMat = std('cEyeM', '#ffffff', '#ffffff');
  [-0.16, 0.16].forEach((ex) => {
    const e = B.MeshBuilder.CreateSphere('cEye', { diameter: 0.12, segments: 6 }, scene);
    e.material = eyeMat; e.parent = creature; e.position.set(ex, 1.82, 0.3);
  });
  creature.position.set(-12, 0, 7);
  creature.setEnabled(false);

  // ── State ──
  let noticed = 0;
  let creatureState = 'idle'; // idle | crossing | done
  let creatureT = 0;
  let done = false;
  let nearRef = null, nearType = null;

  // ── Overlay HUD ──
  overlayEl.innerHTML = `
    <div class="rh-zone"><div class="rh-zone-k">Experiment</div><div class="rh-zone-v">The Attention Room</div></div>
    <div class="ar-counter" id="arCount">Noticed&nbsp; 0 / 5</div>
    <div class="rh-prompt" id="rhPrompt"></div>
    <div class="rh-instr">Spotlight = your attention · E notice · F grab/throw · Space jump</div>`;
  const promptEl = overlayEl.querySelector('#rhPrompt');
  const countEl = overlayEl.querySelector('#arCount');

  function noticeTarget(t) {
    if (t.noticed) return;
    t.noticed = true; noticed += 1;
    t.mat.emissiveColor = t.base.scale(1.5);
    t.mesh.scaling.setAll(1.45);
    ctx.playSfx?.('click');
    ctx.updateXP?.(5);
    countEl.textContent = `Noticed  ${noticed} / 5`;
    // Once the player is engaged, send the creature across — once.
    if (noticed === 2 && creatureState === 'idle') { creatureState = 'crossing'; creatureT = 0; creature.setEnabled(true); }
    if (noticed >= 5 && !done) complete();
  }

  function complete() {
    done = true;
    ctx.updateXP?.(50);
    ctx.playSfx?.('chime');
    const panel = document.createElement('div');
    panel.className = 'ar-panel';
    panel.innerHTML = `
      <div class="ar-panel-k">Inattentional Blindness</div>
      <div class="ar-panel-t">Did you notice the magenta creature?</div>
      <div class="ar-panel-d">While your attention was busy hunting the five targets, a bright creature walked straight across the room. Most people never see it. Attention is a spotlight — whatever falls outside it goes unseen, no matter how obvious.</div>
      <button class="ar-panel-btn" id="arDone">+50 XP · Return to the Hall</button>`;
    overlayEl.appendChild(panel);
    panel.querySelector('#arDone').addEventListener('click', () => ctx.goToRoom('hall'));
  }

  function interact() {
    if (done) { ctx.goToRoom('hall'); return; }
    if (!nearRef) return;
    if (nearType === 'exit') { ctx.playSfx?.('click'); ctx.goToRoom('hall'); return; }
    noticeTarget(nearRef);
  }

  // GRAB nearest orb, or THROW the one you're holding.
  function action2() {
    if (held) {
      const dir = ctrl.getForwardRay(1).direction;
      held.vel = dir.scale(0.5); held.vel.y = 0.2;
      held.held = false; held.rest = false; held = null;
      ctx.playSfx?.('click');
      return;
    }
    const p = ctrl.player.position;
    let best = 2.4, pick = null;
    for (const o of throwables) {
      const d = Math.hypot(p.x - o.mesh.position.x, p.z - o.mesh.position.z);
      if (d < best) { best = d; pick = o; }
    }
    if (pick) { held = pick; pick.held = true; pick.rest = false; ctx.playSfx?.('click'); }
  }

  const beforeRender = () => {
    const time = performance.now() / 1000;
    const p = ctrl.player.position;

    // Idle target motion + "noticed" pop settle.
    targets.forEach((t) => {
      t.mesh.rotation.y += 0.02;
      t.mesh.position.y = 1.7 + Math.sin(time * 2 + t.i) * 0.08;
      if (t.noticed) t.mesh.scaling.setAll(L(t.mesh.scaling.x, 1, 0.12));
    });

    // Throwable orbs: held one floats in front of you, the rest fall/bounce.
    const fwd = ctrl.getForwardRay(1).direction;
    const lim = half - 0.4;
    throwables.forEach((o) => {
      if (o.held) {
        const target = new B.Vector3(p.x + fwd.x * 1.1, 1.25, p.z + fwd.z * 1.1);
        o.mesh.position = B.Vector3.Lerp(o.mesh.position, target, 0.4);
        o.mesh.rotation.y += 0.06;
        return;
      }
      if (o.rest) return;
      o.vel.y -= 0.02; // gravity
      o.mesh.position.addInPlace(o.vel);
      if (o.mesh.position.y <= o.r) {
        o.mesh.position.y = o.r;
        o.vel.y = Math.abs(o.vel.y) * 0.45; // bounce
        o.vel.x *= 0.7; o.vel.z *= 0.7;     // friction
        if (o.vel.length() < 0.04) { o.vel.setAll(0); o.rest = true; }
      }
      if (o.mesh.position.x < -lim) { o.mesh.position.x = -lim; o.vel.x = Math.abs(o.vel.x) * 0.5; }
      if (o.mesh.position.x > lim) { o.mesh.position.x = lim; o.vel.x = -Math.abs(o.vel.x) * 0.5; }
      if (o.mesh.position.z < -lim) { o.mesh.position.z = -lim; o.vel.z = Math.abs(o.vel.z) * 0.5; }
      if (o.mesh.position.z > lim) { o.mesh.position.z = lim; o.vel.z = -Math.abs(o.vel.z) * 0.5; }
      o.mesh.rotation.x += o.vel.z * 0.6; o.mesh.rotation.z -= o.vel.x * 0.6;
    });

    // Creature crosses the back of the room once.
    if (creatureState === 'crossing') {
      creatureT += scene.getEngine().getDeltaTime() / 1000;
      const u = creatureT / 5.5;
      if (u >= 1) { creature.setEnabled(false); creatureState = 'done'; }
      else {
        creature.position.x = -11 + u * 22;
        creature.position.y = Math.abs(Math.sin(u * Math.PI * 7)) * 0.28;
        creature.rotation.y = Math.PI / 2;
      }
    }

    // Nearest interactable (un-noticed target or exit).
    let best = 2.8; nearRef = null; nearType = null;
    for (const t of targets) {
      if (t.noticed) continue;
      const d = Math.hypot(p.x - t.x, p.z - t.z);
      if (d < best) { best = d; nearRef = t; nearType = 'target'; }
    }
    const de = Math.hypot(p.x - EXIT.x, p.z - EXIT.z);
    if (de < best) { best = de; nearRef = EXIT; nearType = 'exit'; }

    if (!done) {
      let txt = '';
      if (held) txt = '▶ press F to throw';
      else if (nearRef) txt = nearType === 'exit' ? '▶ press E to exit to the Hall' : '▶ press E to notice this target';
      promptEl.textContent = txt;
      promptEl.classList.toggle('show', !!txt);
    }
  };
  scene.registerBeforeRender(beforeRender);

  return {
    scene,
    interact,
    jump: ctrl.jump,
    action2,
    dispose() {
      scene.unregisterBeforeRender(beforeRender);
      ctrl.dispose();
      overlayEl.innerHTML = '';
      scene.dispose();
    },
  };
}
