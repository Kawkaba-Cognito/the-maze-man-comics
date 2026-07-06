/**
 * Escape Room — one small lightweight room.
 *
 * Each run picks three fresh puzzle specs. Solve the three lock stations, then
 * use the exit door to escape. No tool chain, physics set pieces, debris, chasms,
 * or multi-room camera work — just a clear phone-friendly room and three puzzles.
 *
 * Contract: returns { scene, interact, jump, dispose }.
 */
import { setupControls } from './roomControls';
import {
  wc, createMazeMaterials, buildMazeMeshes,
  makeExitPortal, makeBossGate, makeGridCollider, mulberry32,
  setupMazeLights, setupGateSky,
} from './mazeKit';

const B = () => window.BABYLON;
const MAP = 9;
const START_GZ = 2;
const EXIT_GZ = MAP - 2;
const FLOOR_HEX = '#d4c4a8';
const WALL_HEX = '#8a7ec8';
const LOCK_HEX = '#e0915a';
const DONE_HEX = '#3be086';

const PUZZLE_POOL = [
  { puzzleKey: 'sudoku', size: 4, icon: '🔢', en: 'Number Lock', ar: 'قفل الأرقام' },
  { puzzleKey: 'takuzu', size: 4, icon: '⚫', en: 'Binary Lock', ar: 'القفل الثنائي' },
  { puzzleKey: 'takuzu', size: 6, icon: '⚫', en: 'Pattern Lock', ar: 'قفل النمط' },
  { puzzleKey: 'kenken', size: 4, icon: '✳️', en: 'Math Lock', ar: 'قفل الحساب' },
  { puzzleKey: 'hitori', size: 5, icon: '⬛', en: 'Shadow Lock', ar: 'قفل الظلال' },
  { puzzleKey: 'bridges', size: 7, icon: '🌉', en: 'Bridge Lock', ar: 'قفل الجسور' },
];

function makePuzzleRun() {
  const seedBase = (Date.now() ^ ((Math.random() * 0x7fffffff) | 0)) >>> 0;
  const rng = mulberry32(seedBase || 1);
  const pool = [...PUZZLE_POOL].sort(() => rng() - 0.5);
  return pool.slice(0, 3).map((p, i) => ({
    id: `p${i + 1}`,
    ...p,
    spec: {
      puzzleKey: p.puzzleKey,
      size: p.size,
      seed: Math.floor(rng() * 1_000_000_000),
    },
  }));
}

function progressHtml(locks, isAr) {
  const dots = locks.map((l, i) => (
    `<span style="width:22px;height:22px;border-radius:999px;display:inline-grid;place-items:center;font-weight:900;font-size:12px;background:${l.solved ? '#3be086' : 'rgba(255,255,255,0.16)'};color:${l.solved ? '#0b2418' : '#ffe6b0'};border:1px solid rgba(255,230,176,0.35)">${l.solved ? '✓' : i + 1}</span>`
  )).join('');
  return `<span style="font-weight:900;font-size:11px;letter-spacing:0.8px;color:#ffe6b0">${isAr ? 'الأقفال' : 'LOCKS'}</span>${dots}`;
}

export function buildEscapeRoom({ engine, canvas, overlayEl, ctx, inputRef }) {
  const isAr = ctx.currentLang === 'ar';
  const Bb = B();
  const scene = new Bb.Scene(engine);
  if (Bb.ScenePerformancePriority) scene.performancePriority = Bb.ScenePerformancePriority.Aggressive;
  setupGateSky(Bb, scene);

  const mats = createMazeMaterials(Bb, scene, FLOOR_HEX, WALL_HEX);

  // Compact room: border walls only, open centre, three lock stations, one exit.
  const maze = Array.from({ length: MAP }, () => new Array(MAP).fill(1));
  for (let z = 1; z <= MAP - 2; z++) for (let x = 1; x <= MAP - 2; x++) maze[z][x] = 0;
  buildMazeMeshes(Bb, scene, maze, MAP, { ...mats, floorHex: FLOOR_HEX, wallHex: WALL_HEX });

  const gridCollide = makeGridCollider(maze, MAP);
  const cc = 4;

  // Shared controls keep camera/movement/physics consistent with the other rooms.
  // Spawn at the back; walk forward (+Z / joystick up) toward the exit door ahead.
  const controls = setupControls(scene, canvas, {
    start: new Bb.Vector3(wc(cc, MAP), 0, wc(START_GZ, MAP)),
    startYaw: 0,
    inputRef,
    onInteract: () => tryAutoInteract(),
    character: ctx.character,
    equipped: ctx.equipped,
    lowPerf: true,
    gridCollide,
    topDown: true,
    flatGround: true,
    charScale: 0.28,
    shadows: false,
    glow: false,
    camDist: 10,
    camHeight: 18,
    camLookY: 0.5,
    fov: 0.7,
  });
  const player = controls.player;
  setupMazeLights(Bb, scene, controls.keyLight);
  scene.skipPointerMovePicking = true;
  scene.blockMaterialDirtyMechanism = true;

  // ── Billboard emoji labels (cheap, drawn once) ──
  const labels = [];
  function makeLabel(text, x, y, z, size = 1.55) {
    const dt = new Bb.DynamicTexture(`lbl${labels.length}`, { width: 128, height: 128 }, scene, true);
    dt.hasAlpha = true;
    const c = dt.getContext();
    c.clearRect(0, 0, 128, 128); c.font = '92px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, 64, 80); dt.update();
    const pl = Bb.MeshBuilder.CreatePlane(`lblP${labels.length}`, { size }, scene);
    pl.position = new Bb.Vector3(x, y, z); pl.billboardMode = Bb.Mesh.BILLBOARDMODE_ALL; pl.isPickable = false;
    const m = new Bb.StandardMaterial(`lblM${labels.length}`, scene);
    m.diffuseTexture = dt; m.diffuseTexture.hasAlpha = true; m.useAlphaFromDiffuseTexture = true;
    m.emissiveColor = new Bb.Color3(1, 1, 1); m.disableLighting = true; m.backFaceCulling = false;
    pl.material = m; labels.push({ pl, y }); return pl;
  }

  // ── Puzzle lock consoles ──
  const lockAt = (cfg, gx, gz) => {
    const x = wc(gx, MAP), z = wc(gz, MAP);
    const base = Bb.MeshBuilder.CreateCylinder(`${cfg.id}-b`, { diameter: 1.7, height: 0.5, tessellation: 6 }, scene);
    base.position = new Bb.Vector3(x, 0.25, z); base.material = mats.toon(`${cfg.id}-bm`, '#4a3d6a', null, 0.15); base.isPickable = false;
    const core = Bb.MeshBuilder.CreateBox(`${cfg.id}-c`, { size: 1.0 }, scene);
    core.position = new Bb.Vector3(x, 1.2, z); core.material = mats.toon(`${cfg.id}-cm`, LOCK_HEX, null, 0.72); core.isPickable = false;
    const ring = Bb.MeshBuilder.CreateTorus(`${cfg.id}-r`, { diameter: 1.8, thickness: 0.12, tessellation: 16 }, scene);
    ring.position = new Bb.Vector3(x, 1.2, z); ring.rotation.x = Math.PI / 2; ring.material = mats.toon(`${cfg.id}-rm`, cfg.solved ? DONE_HEX : '#ffce4a', null, 0.45); ring.isPickable = false;
    return { ...cfg, x, z, core, ring, label: makeLabel(cfg.icon, x, 2.35, z), solved: false };
  };

  const puzzleRun = makePuzzleRun();
  const locks = [
    lockAt(puzzleRun[0], 2, 3),
    lockAt(puzzleRun[1], 6, 4),
    lockAt(puzzleRun[2], 4, 5),
  ];

  // Exit at the far end — walk forward to reach it.
  const exitCell = [cc, EXIT_GZ];
  const { exitPos, exitPad, exitBeacon } = makeExitPortal(Bb, scene, mats.toon, exitCell[0], exitCell[1], MAP, '#9a68c8');
  makeBossGate(Bb, scene, mats.toon, exitCell[0], exitCell[1], MAP);
  exitBeacon.isVisible = false;
  const exitHint = makeLabel('🚪', exitPos.x, 2.8, exitPos.z); exitHint.setEnabled(false);

  // ── State + HUD ──
  let escaped = false;
  const solvedCount = () => locks.filter((l) => l.solved).length;
  const allSolved = () => solvedCount() === locks.length;

  overlayEl.innerHTML = `
    <div class="rh-zone"><div class="rh-zone-k">${isAr ? '★ غرفة الهروب' : '★ ESCAPE ROOM'}</div><div class="rh-zone-v">${isAr ? 'حلّ ثلاثة أقفال ثم امشِ للأمام إلى الباب.' : 'Solve three locks, then walk forward to the door.'}</div></div>
    <div class="rh-prompt" id="rhPrompt"></div>
    <div id="rhInv" style="position:absolute;top:12px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:6px 13px;border-radius:999px;background:rgba(20,12,26,0.72);border:1px solid rgba(232,172,78,0.4)">${progressHtml(locks, isAr)}</div>
    <div class="rh-instr" id="rhInstr"></div>`;
  const promptEl = overlayEl.querySelector('#rhPrompt');
  const invEl = overlayEl.querySelector('#rhInv');
  const instrEl = overlayEl.querySelector('#rhInstr');
  const OBJ = () => {
    if (escaped) return '';
    const next = locks.find((l) => !l.solved);
    if (next) return isAr ? `▶ حلّ ${solvedCount()}/3 أقفال` : `▶ Solve ${solvedCount()}/3 locks`;
    return isAr ? '▶ الباب أمامك — امشِ للأمام واضغط USE' : '▶ Door ahead — walk forward and USE';
  };
  const refreshHud = () => { if (invEl) invEl.innerHTML = progressHtml(locks, isAr); if (instrEl) instrEl.textContent = OBJ(); };
  refreshHud();

  // ── Interaction spots (walk here → auto-use) ──
  const spots = [
    ...locks.map((lock) => ({
      pos: () => new Bb.Vector3(lock.x, 0, lock.z),
      r: 2.35,
      elig: () => !lock.solved,
      label: () => (isAr ? lock.ar : lock.en),
      act: () => openPuzzle(lock, () => { onSolved(lock); refreshHud(); }),
    })),
    { pos: () => exitPos, r: 3.0, elig: () => allSolved(), label: () => (isAr ? 'اهرب!' : 'Escape!'), act: () => { escaped = true; ctx.playSfx?.('win'); showEscaped(); } },
  ];

  function openPuzzle(lock, onDone) { ctx.playSfx?.('click'); ctx.openEscapePuzzle?.({ spec: lock.spec, title: isAr ? lock.ar : lock.en }, onDone); }
  function onSolved(lock) {
    if (lock.solved) return; lock.solved = true;
    const g = Bb.Color3.FromHexString(DONE_HEX);
    lock.core.material.diffuseColor = g; lock.core.material.emissiveColor = g.scale(0.7);
    lock.ring.material.diffuseColor = g; lock.ring.material.emissiveColor = g.scale(0.7);
    lock.label.setEnabled(false);
    if (allSolved()) {
      exitBeacon.isVisible = true;
      exitHint.setEnabled(true);
      exitPad.material.diffuseColor = Bb.Color3.FromHexString('#16d39a');
      exitPad.material.emissiveColor = Bb.Color3.FromHexString('#16d39a').scale(0.6);
    }
    ctx.playSfx?.('win');
  }
  function showEscaped() {
    overlayEl.innerHTML = `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;background:rgba(8,6,16,0.55)"><div style="font-size:52px">🗝️</div><div style="font-family:'Fredoka One','Nunito',sans-serif;font-size:30px;font-weight:800;color:#ffe6b0;text-shadow:0 0 18px rgba(232,172,78,0.6)">${isAr ? 'لقد هربت!' : 'You escaped!'}</div><div style="font-size:14px;font-weight:800;color:#fff3d0">${isAr ? 'الغرفة التالية ستكون بألغاز جديدة.' : 'Next run will have new puzzles.'}</div></div>`;
    setTimeout(() => ctx.exitMaze?.(), 2600);
  }

  function tryAutoInteract() {
    let best = Infinity, chosen = null;
    for (const s of spots) {
      if (!s.elig()) continue;
      const sp = s.pos(); const d2 = (sp.x - player.position.x) ** 2 + (sp.z - player.position.z) ** 2;
      if (d2 < s.r * s.r && d2 < best) { best = d2; chosen = s; }
    }
    if (chosen) chosen.act();
  }

  // ── Per-frame room-only effects. Movement/camera are handled by setupControls.
  let lastPrompt = '';
  const beforeRender = () => {
    if (escaped) return;
    const t = performance.now() / 1000;
    const p = player.position;

    // spin/bob locks
    for (const l of locks) {
      if (!l.solved) {
        l.core.rotation.y += 0.02;
        l.ring.rotation.z += 0.018;
        l.core.position.y = 1.2 + Math.sin(t * 2 + l.x) * 0.08;
      }
    }
    if (exitBeacon.isVisible) { exitBeacon.rotation.y += 0.03; exitPad.scaling.y = 1 + Math.sin(t * 2.5) * 0.06; }

    // hint labels
    locks.forEach((l) => l.label.setEnabled(!l.solved));
    exitHint.setEnabled(allSolved());
    const bob = Math.sin(t * 2.2) * 0.12;
    for (const l of labels) l.pl.position.y = l.y + bob;

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
      controls.dispose();
      overlayEl.innerHTML = '';
      scene.dispose();
    },
  };
}
