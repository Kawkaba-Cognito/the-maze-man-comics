/**
 * Escape Room — "The Mind Vault".
 *
 * A single enclosed chamber (no boss, no army). Three glowing LOCKS each open
 * one of the puzzle games; solve all three and the exit gate lights up — walk to
 * it and USE to escape. Built from the same mazeKit / roomControls toolkit as
 * the campaign rooms so it looks and controls identically.
 *
 * Contract (like every room): returns { scene, interact, jump, dispose }.
 * Puzzles are launched via ctx.openEscapePuzzle({ spec, title }, onSolved) — the
 * host renders the puzzle overlay and calls onSolved back into this room.
 */
import { setupControls } from './roomControls';
import {
  wc, createMazeMaterials, buildMazeMeshes,
  makeExitPortal, makeBossGate, makeGridCollider,
  setupMazeLights, setupGateSky,
} from './mazeKit';

const B = () => window.BABYLON;
const MAP = 9;
const FLOOR_HEX = '#d4c4a8';
const WALL_HEX = '#8a7ec8';
const LOCK_HEX = '#e0915a';
const DONE_HEX = '#3be086';

// Three locks, three DIFFERENT puzzle types for variety. Cells are interior
// (1..MAP-2). Seeds are fixed so the room is the same each visit. Sizes mirror
// the easy end of recruitSpec.js so every generated puzzle is solvable.
const LOCKS = [
  { id: 'lock-1', cell: [2, 3], spec: { puzzleKey: 'sudoku', size: 4, seed: 4207 }, en: 'Logic Lock', ar: 'قفل المنطق' },
  { id: 'lock-2', cell: [6, 3], spec: { puzzleKey: 'takuzu', size: 6, seed: 8123 }, en: 'Binary Lock', ar: 'القفل الثنائي' },
  { id: 'lock-3', cell: [4, 5], spec: { puzzleKey: 'bridges', size: 7, seed: 5561 }, en: 'Bridge Lock', ar: 'قفل الجسور' },
];

function keysHtml(solved, total, isAr) {
  const cells = [];
  for (let i = 0; i < total; i++) {
    const on = i < solved;
    cells.push(
      `<span style="font-size:20px;line-height:1;opacity:${on ? 1 : 0.32};filter:${on ? 'none' : 'grayscale(1)'}">${on ? '🔑' : '🔒'}</span>`,
    );
  }
  return `<span style="font-weight:800;font-size:12px;letter-spacing:0.5px;color:#ffe6b0">${isAr ? 'المفاتيح' : 'KEYS'} ${solved}/${total}</span>${cells.join('')}`;
}

export function buildEscapeRoom({ engine, canvas, overlayEl, ctx, inputRef }) {
  const isAr = ctx.currentLang === 'ar';
  const Bb = B();
  const scene = new Bb.Scene(engine);
  if (Bb.ScenePerformancePriority) scene.performancePriority = Bb.ScenePerformancePriority.Intermediate;
  setupGateSky(Bb, scene);

  const mats = createMazeMaterials(Bb, scene, FLOOR_HEX, WALL_HEX);

  // Open chamber: solid border wall, open interior, four corner pillars for
  // cover so the room reads as a "room" and not a flat pad.
  const maze = Array.from({ length: MAP }, () => new Array(MAP).fill(1));
  for (let z = 1; z < MAP - 1; z++) for (let x = 1; x < MAP - 1; x++) maze[z][x] = 0;
  [[2, 2], [6, 2], [2, 6], [6, 6]].forEach(([x, z]) => { maze[z][x] = 1; });
  buildMazeMeshes(Bb, scene, maze, MAP, { ...mats, floorHex: FLOOR_HEX, wallHex: WALL_HEX });

  const cc = Math.floor(MAP / 2); // 4
  const startCell = [cc, 1];
  const exitCell = [cc, MAP - 2]; // [4, 7]
  const startPos = new Bb.Vector3(wc(startCell[0], MAP), 0, wc(startCell[1], MAP));

  // Lock consoles — a hexagonal base + a floating cube "core" that glows amber
  // while locked and turns green once solved.
  const locks = LOCKS.map((cfg) => {
    const [gx, gz] = cfg.cell;
    const x = wc(gx, MAP);
    const z = wc(gz, MAP);
    const base = Bb.MeshBuilder.CreateCylinder(`${cfg.id}-base`, { diameter: 1.7, height: 0.5, tessellation: 6 }, scene);
    base.position = new Bb.Vector3(x, 0.25, z);
    base.material = mats.toon(`${cfg.id}-baseMat`, '#4a3d6a', null, 0.15);
    base.isPickable = false;
    const core = Bb.MeshBuilder.CreateBox(`${cfg.id}-core`, { size: 0.9 }, scene);
    core.position = new Bb.Vector3(x, 1.15, z);
    core.material = mats.toon(`${cfg.id}-coreMat`, LOCK_HEX, null, 0.72);
    core.isPickable = false;
    return { ...cfg, x, z, core, solved: false };
  });

  // Exit gate (locked until all three cores are green). The beacon is hidden
  // until the room is solved so the goal reveals itself.
  const { exitPos, exitPad, exitBeacon } = makeExitPortal(Bb, scene, mats.toon, exitCell[0], exitCell[1], MAP, '#9a68c8');
  makeBossGate(Bb, scene, mats.toon, exitCell[0], exitCell[1], MAP);
  exitBeacon.isVisible = false;

  const ctrl = setupControls(scene, canvas, {
    inputRef,
    start: startPos,
    startYaw: 0,
    character: ctx.character,
    equipped: ctx.equipped,
    lowPerf: ctx.lowPerf,
    topDown: true,
    camDist: 10,
    camHeight: 18,
    fov: 0.7,
    charScale: 0.28,
    gridCollide: makeGridCollider(maze, MAP),
    onInteract: () => tryInteract(),
  });
  setupMazeLights(Bb, scene, ctrl.keyLight);
  scene.skipPointerMovePicking = true;
  scene.blockMaterialDirtyMechanism = true;

  const narrative = isAr
    ? 'أنت محبوس في خزنة العقل. افتح الأقفال الثلاثة لتهرب.'
    : "You're locked in the Mind Vault. Open all three locks to escape.";
  overlayEl.innerHTML = `
    <div class="rh-zone"><div class="rh-zone-k">${isAr ? '★ خزنة العقل' : '★ MIND VAULT'}</div><div class="rh-zone-v">${narrative}</div></div>
    <div class="rh-prompt" id="rhPrompt"></div>
    <div id="rhKeys" style="position:absolute;top:12px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;background:rgba(20,12,26,0.72);border:1px solid rgba(232,172,78,0.4)">${keysHtml(0, locks.length, isAr)}</div>
    <div class="rh-instr" id="rhInstr">${isAr ? '▶ امشِ إلى قفل متوهّج واضغط USE' : '▶ Walk to a glowing lock and press USE'}</div>`;
  const promptEl = overlayEl.querySelector('#rhPrompt');
  const keysEl = overlayEl.querySelector('#rhKeys');
  const instrEl = overlayEl.querySelector('#rhInstr');

  let nearTarget = null; // { type:'lock', lock } | { type:'exit' }
  let lastPrompt = '';
  let solvedCount = 0;
  let escaped = false;

  function onLockSolved(lock) {
    if (lock.solved || escaped) return;
    lock.solved = true;
    solvedCount += 1;
    const green = Bb.Color3.FromHexString(DONE_HEX);
    lock.core.material.diffuseColor = green;
    lock.core.material.emissiveColor = green.scale(0.7);
    ctx.playSfx?.('win');
    if (keysEl) keysEl.innerHTML = keysHtml(solvedCount, locks.length, isAr);
    if (solvedCount >= locks.length) {
      exitBeacon.isVisible = true;
      exitPad.material.emissiveColor = Bb.Color3.FromHexString('#16d39a').scale(0.6);
      if (instrEl) instrEl.textContent = isAr ? '▶ فُتحت البوابة — اذهب إليها لتهرب' : '▶ The gate is open — reach it to escape';
    }
  }

  function showEscaped() {
    overlayEl.innerHTML = `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;background:rgba(8,6,16,0.55)">
      <div style="font-size:52px">🗝️</div>
      <div style="font-family:'Fredoka One','Nunito',sans-serif;font-size:30px;font-weight:800;color:#ffe6b0;text-shadow:0 0 18px rgba(232,172,78,0.6)">${isAr ? 'لقد هربت!' : 'You escaped!'}</div>
    </div>`;
    setTimeout(() => ctx.exitMaze?.(), 2600);
  }

  function tryInteract() {
    if (escaped) return;
    if (nearTarget?.type === 'lock' && !nearTarget.lock.solved) {
      const lock = nearTarget.lock;
      ctx.playSfx?.('click');
      ctx.openEscapePuzzle?.(
        { spec: lock.spec, title: isAr ? lock.ar : lock.en },
        () => onLockSolved(lock),
      );
      return;
    }
    if (nearTarget?.type === 'exit') {
      if (solvedCount >= locks.length) {
        escaped = true;
        ctx.playSfx?.('win');
        showEscaped();
      } else {
        ctx.playSfx?.('error');
      }
    }
  }

  const beforeRender = () => {
    if (escaped) return;
    const t = performance.now() / 1000;
    const p = ctrl.player.position;

    for (const l of locks) {
      l.core.rotation.y += 0.02;
      l.core.position.y = 1.15 + Math.sin(t * 2 + l.x) * 0.08;
    }
    if (exitBeacon.isVisible) {
      exitBeacon.rotation.y += 0.03;
      exitPad.scaling.y = 1 + Math.sin(t * 2.5) * 0.06;
    }

    // Nearest unsolved lock within reach, else the exit.
    nearTarget = null;
    let best = 2.3 * 2.3;
    for (const l of locks) {
      if (l.solved) continue;
      const dx = l.x - p.x;
      const dz = l.z - p.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < best) { best = d2; nearTarget = { type: 'lock', lock: l }; }
    }
    if (!nearTarget && Bb.Vector3.Distance(p, exitPos) < 3.2) nearTarget = { type: 'exit' };

    let pr = '';
    if (nearTarget?.type === 'lock') {
      pr = isAr ? `▶ USE — ${nearTarget.lock.ar}` : `▶ USE — ${nearTarget.lock.en}`;
    } else if (nearTarget?.type === 'exit') {
      pr = solvedCount >= locks.length
        ? (isAr ? '▶ USE — اهرب!' : '▶ USE — Escape!')
        : (isAr ? '▶ افتح الأقفال الثلاثة أولاً' : '▶ Open all 3 locks first');
    }
    if (pr !== lastPrompt) {
      lastPrompt = pr;
      promptEl.textContent = pr;
      promptEl.classList.toggle('show', !!pr);
    }
  };
  scene.registerBeforeRender(beforeRender);

  return {
    scene,
    interact: tryInteract,
    jump: ctrl.jump,
    dispose() {
      scene.unregisterBeforeRender(beforeRender);
      ctrl.dispose();
      overlayEl.innerHTML = '';
      scene.dispose();
    },
  };
}
