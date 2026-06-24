/**
 * Outer Gate — compact pre-labyrinth room.
 * Same layout convention as doorHall: spawn at −Z (bottom), gate at +Z (top).
 */
import { setupControls } from './roomControls';
import { createNpcKit } from './npc';
import { createFollowerController } from './followerKit';
import { status } from '../../../features/army/armyState';
import { isGateBossBeaten, enterLabyrinth } from '../../../features/campaign/campaignProgress';
import {
  GATE_SOLDIERS, GATE_BOSS, GATE_ROOM_KEY, allGateSoldiersRecruited,
} from '../../../features/campaign/gateRoomConfig';
import {
  CELL, generateMaze, wc,
  findMazePath, cellsAlongPath,
  createMazeMaterials, buildMazeMeshes, makeExitPortal, makeBossGate, makeGridCollider,
  setupMazeLights, setupGateSky, GATE_MAZE_STYLE,
} from './mazeKit';

const B = () => window.BABYLON;

/** Carve a straight road: near spawn (low gz / −Z) → far gate (high gz / +Z). */
function carveGateLayout(maze, MAP) {
  const cc = Math.floor(MAP / 2);
  for (let gz = 1; gz < MAP - 1; gz++) {
    maze[gz][cc] = 0;
    if (cc > 1) maze[gz][cc - 1] = 0;
    if (cc < MAP - 2) maze[gz][cc + 1] = 0;
  }
  // Far gate plaza (+Z / top of screen)
  for (let dx = -2; dx <= 2; dx++) {
    const gx = cc + dx;
    if (gx > 0 && gx < MAP - 1) {
      maze[MAP - 2][gx] = 0;
      maze[MAP - 3][gx] = 0;
    }
  }
  // Near spawn pad (−Z / bottom of screen)
  for (let dx = -1; dx <= 1; dx++) {
    const gx = cc + dx;
    if (gx > 0 && gx < MAP - 1) {
      maze[1][gx] = 0;
      maze[2][gx] = 0;
    }
  }
  return { cc, startCell: [cc, 2], exitCell: [cc, MAP - 2] };
}

function pickSoldierCells(maze, MAP, startCell, exitCell) {
  const path = findMazePath(maze, MAP, startCell, exitCell);
  if (path && path.length > 4) {
    return cellsAlongPath(path, [0.32, 0.58]);
  }
  const cc = Math.floor(MAP / 2);
  return [[cc, 4], [cc, 6]];
}

function faceToward(npc, tx, tz) {
  npc.root.rotation.y = Math.atan2(tx - npc.x, tz - npc.z);
}

export function buildGateRoom({ engine, canvas, overlayEl, ctx, inputRef }) {
  const isAr = ctx.currentLang === 'ar';
  const gateOpen = isGateBossBeaten();
  const { mapSize: MAP, openChance, wallHex, floorHex, seed } = GATE_MAZE_STYLE;

  const Bb = B();
  const scene = new Bb.Scene(engine);
  if (Bb.ScenePerformancePriority) scene.performancePriority = Bb.ScenePerformancePriority.Intermediate;
  setupGateSky(Bb, scene);

  const mats = createMazeMaterials(Bb, scene, floorHex, wallHex);
  const maze = generateMaze(MAP, openChance, seed);
  const { cc, startCell, exitCell } = carveGateLayout(maze, MAP);
  const [exitGx, exitGz] = exitCell;

  buildMazeMeshes(Bb, scene, maze, MAP, { ...mats, floorHex, wallHex });

  const startPos = new Bb.Vector3(wc(startCell[0], MAP), 0, wc(startCell[1], MAP));
  const exitWorldZ = wc(exitGz, MAP);

  const portalColor = gateOpen ? '#16d39a' : '#9a68c8';
  const { exitPos, exitPad, exitBeacon } = makeExitPortal(Bb, scene, mats.toon, exitGx, exitGz, MAP, portalColor);
  const gateArch = makeBossGate(Bb, scene, mats.toon, exitGx, exitGz, MAP);

  // Warden blocks the gate on the approach side (just before the arch).
  const bossX = wc(exitGx, MAP);
  const bossZ = exitWorldZ - 2.2;

  const soldierCells = pickSoldierCells(maze, MAP, startCell, exitCell);

  const npcKit = createNpcKit(Bb, scene, { cell: CELL });
  const followers = createFollowerController();

  GATE_SOLDIERS.forEach((cfg, i) => {
    const st = status(cfg.id);
    const [gx, gz] = soldierCells[i];
    const x = wc(gx, MAP);
    const z = wc(gz, MAP);
    if (st === 'recruited') {
      const f = npcKit.spawn({
        x, z: z - 1.2,
        color: cfg.color,
        name: isAr ? cfg.nameAr : cfg.name,
        role: 'soldier',
        scale: cfg.scale,
        accessory: cfg.accessory,
      });
      faceToward(f, startPos.x, startPos.z);
      followers.add(f);
      return;
    }
    if (st === 'gone') return;
    const npc = npcKit.spawn({
      x, z,
      color: cfg.color,
      name: isAr ? cfg.nameAr : cfg.name,
      role: 'soldier',
      scale: cfg.scale,
      accessory: cfg.accessory,
    });
    faceToward(npc, startPos.x, startPos.z);
    npc.soldierCfg = cfg;
  });

  if (!gateOpen) {
    const bossNpc = npcKit.spawn({
      x: bossX,
      z: bossZ,
      color: GATE_BOSS.color,
      name: isAr ? GATE_BOSS.nameAr : GATE_BOSS.name,
      role: 'boss',
      scale: GATE_BOSS.scale,
      girth: GATE_BOSS.girth,
      accessory: GATE_BOSS.accessory,
    });
    faceToward(bossNpc, startPos.x, startPos.z);
    bossNpc.isBoss = true;
    exitPad.isVisible = false;
    exitBeacon.isVisible = false;
  }

  const northMark = Bb.MeshBuilder.CreateBox('gateNorthMark', { width: 0.35, height: 8, depth: 0.35 }, scene);
  northMark.position = new Bb.Vector3(bossX, 4, exitWorldZ);
  northMark.material = mats.toon('gateNorthMarkMat', '#c8a0ff', null, 0.65);
  northMark.isPickable = false;

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

  overlayEl.innerHTML = `
    <div class="rh-zone"><div class="rh-zone-k">${isAr ? '★ البوابة' : '★ OUTER GATE'}</div><div class="rh-zone-v">${isAr ? 'الغرفة الصغيرة — جنّد · قاتل · ادخل' : 'Small Room — recruit · fight · enter'}</div></div>
    <div class="rh-gate-arrow" aria-hidden="true">▲</div>
    <div class="rh-prompt" id="rhPrompt"></div>
    <div class="rh-instr" id="rhInstr">${isAr ? '▲ امشِ للبوابة · جنّد الجنديين · اهزم الحارس' : '▲ Walk to the gate · recruit allies · defeat the Warden'}</div>`;
  const promptEl = overlayEl.querySelector('#rhPrompt');

  let nearTarget = null;
  let lastPrompt = '';
  let gateOrbPulse = 0;

  function tryInteract() {
    const p = ctrl.player.position;
    if (nearTarget?.soldierCfg) {
      const c = nearTarget.soldierCfg;
      ctx.playSfx?.('click');
      ctx.openRecruitChallenge?.({
        id: c.id,
        name: isAr ? c.nameAr : c.name,
        nameAr: c.nameAr,
        power: c.power,
        puzzleKey: c.puzzleKey,
        floorId: GATE_ROOM_KEY,
      });
      return;
    }
    if (nearTarget?.isBoss && allGateSoldiersRecruited(status)) {
      ctx.playSfx?.('click');
      ctx.startBossFight?.({
        soldiers: GATE_SOLDIERS.filter((s) => status(s.id) === 'recruited'),
        boss: GATE_BOSS,
      });
      return;
    }
    if (gateOpen && Bb.Vector3.Distance(p, exitPos) < 4.2) {
      ctx.playSfx?.('win');
      enterLabyrinth('floor1');
      ctx.goToRoom?.('floor1');
    }
  }

  const beforeRender = () => {
    const t = performance.now() / 1000;
    const p = ctrl.player.position;
    followers.update(p);
    nearTarget = npcKit.update(p, t);

    gateOrbPulse += 0.04;
    const orb = gateArch?.getChildMeshes?.().find((m) => m.name === 'gpOrb');
    if (orb) {
      orb.scaling.setAll(1 + Math.sin(gateOrbPulse) * 0.12);
      orb.rotation.y += 0.02;
    }
    northMark.scaling.y = 1 + Math.sin(t * 2.2) * 0.08;

    if (gateOpen) {
      exitBeacon.rotation.y += 0.03;
      exitPad.scaling.y = 1 + Math.sin(t * 2.5) * 0.06;
    }

    let pr = '';
    if (nearTarget?.soldierCfg) {
      const pk = nearTarget.soldierCfg.puzzleKey;
      pr = isAr
        ? `▶ USE — ${pk === 'sudoku' ? 'سودوكو' : 'جسور'}`
        : `▶ USE — ${pk === 'sudoku' ? 'Sudoku' : 'Bridges'} duel`;
    } else if (nearTarget?.isBoss) {
      pr = allGateSoldiersRecruited(status)
        ? (isAr ? '▶ USE — قاتل الحارس!' : '▶ USE — FIGHT the Warden!')
        : (isAr ? '▶ جنّد الجنديين أولاً' : '▶ Recruit both soldiers first');
    } else if (gateOpen && Bb.Vector3.Distance(p, exitPos) < 4.2) {
      pr = isAr ? '▶ USE — ادخل المتاهة' : '▶ USE — enter the labyrinth';
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
      npcKit.dispose();
      ctrl.dispose();
      overlayEl.innerHTML = '';
      scene.dispose();
    },
  };
}
