/**
 * Labyrinth campaign — parameterized maze floors with soldier recruitment,
 * army power HUD, and exit portals to the next floor.
 */
import { setupControls } from './roomControls';
import { createNpcKit } from './npc';
import { CAMPAIGN_FLOORS } from '../../../features/campaign/campaignFloors';
import { setCampaignFloor } from '../../../features/campaign/campaignProgress';
import { status, totalPower, BOSS_POWER, attemptsUsed, MAX_ATTEMPTS } from '../../../features/army/armyState';

const B = () => window.BABYLON;
const CELL = 4;
const WALL_H = 3;

function wc(g, mapSize) { return (g - mapSize / 2 + 0.5) * CELL; }
function gAt(w, mapSize) { return Math.floor(w / CELL + mapSize / 2); }

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateMaze(mapSize, openChance, seed) {
  const rng = mulberry32(seed);
  const maze = Array.from({ length: mapSize }, () => new Array(mapSize).fill(1));
  (function carve(x, y) {
    maze[y][x] = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].sort(() => rng() - 0.5);
    for (const [dx, dy] of dirs) {
      const nx = x + dx * 2; const ny = y + dy * 2;
      if (nx > 0 && nx < mapSize - 1 && ny > 0 && ny < mapSize - 1 && maze[ny][nx] === 1) {
        maze[y + dy][x + dx] = 0;
        carve(nx, ny);
      }
    }
  })(1, 1);
  const cc = Math.floor(mapSize / 2);
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const yy = cc + dy; const xx = cc + dx;
    if (xx > 0 && xx < mapSize - 1 && yy > 0 && yy < mapSize - 1) maze[yy][xx] = 0;
  }
  for (let y = 1; y < mapSize - 1; y++) for (let x = 1; x < mapSize - 1; x++) {
    if (maze[y][x] !== 1) continue;
    let o = 0;
    if (maze[y - 1][x] === 0) o++;
    if (maze[y + 1][x] === 0) o++;
    if (maze[y][x - 1] === 0) o++;
    if (maze[y][x + 1] === 0) o++;
    if (o >= 2 && rng() < openChance) maze[y][x] = 0;
  }
  return maze;
}

function findDeadEnd(maze, mapSize, fromGx, fromGz) {
  const ends = [];
  for (let y = 1; y < mapSize - 1; y++) for (let x = 1; x < mapSize - 1; x++) {
    if (maze[y][x] !== 0) continue;
    let n = 0;
    if (maze[y - 1][x] === 0) n++;
    if (maze[y + 1][x] === 0) n++;
    if (maze[y][x - 1] === 0) n++;
    if (maze[y][x + 1] === 0) n++;
    if (n === 1) ends.push([x, y]);
  }
  if (!ends.length) return [mapSize - 3, mapSize - 3];
  let best = ends[0]; let bd = -1;
  for (const [x, y] of ends) {
    const d = Math.hypot(x - fromGx, y - fromGz);
    if (d > bd) { bd = d; best = [x, y]; }
  }
  return best;
}

function floorSeed(floorId) {
  let h = 0;
  for (let i = 0; i < floorId.length; i++) h = ((h << 5) - h + floorId.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

export function buildCampaignMaze({ engine, canvas, overlayEl, ctx, inputRef, floorId = 'floor1' }) {
  const floor = CAMPAIGN_FLOORS[floorId] || CAMPAIGN_FLOORS.floor1;
  const MAP = floor.mapSize;
  const HALF = (MAP * CELL) / 2;
  const isAr = ctx.currentLang === 'ar';
  const soldierCfg = floor.soldier;
  const soldierRecruited = soldierCfg ? status(soldierCfg.id) === 'recruited' : true;
  const soldierGone = soldierCfg ? status(soldierCfg.id) === 'gone' : false;

  const Bb = B();
  const scene = new Bb.Scene(engine);
  if (Bb.ScenePerformancePriority) scene.performancePriority = Bb.ScenePerformancePriority.Intermediate;
  const sky = Bb.Color3.FromHexString('#8fc6ef');
  scene.clearColor = new Bb.Color4(sky.r, sky.g, sky.b, 1);
  scene.ambientColor = new Bb.Color3(0.6, 0.6, 0.66);

  const pix = (name, draw, n = 16) => {
    const t = new Bb.DynamicTexture(name, { width: n, height: n }, scene, false);
    draw(t.getContext(), n); t.update();
    t.updateSamplingMode(Bb.Texture.NEAREST_SAMPLINGMODE);
    t.wrapU = t.wrapV = Bb.Texture.WRAP_ADDRESSMODE;
    return t;
  };
  const speck = (c, base, cols, n = 16) => {
    c.fillStyle = base; c.fillRect(0, 0, n, n);
    for (let i = 0; i < n * n * 0.25; i++) {
      c.fillStyle = cols[(Math.random() * cols.length) | 0];
      c.fillRect((Math.random() * n) | 0, (Math.random() * n) | 0, 1, 1);
    }
  };
  const toon = (name, hex, tex, glow = 0.1) => {
    const m = new Bb.StandardMaterial(name, scene);
    const col = Bb.Color3.FromHexString(hex);
    if (tex) m.diffuseTexture = tex; else m.diffuseColor = col;
    m.emissiveColor = col.scale(glow);
    m.specularColor = new Bb.Color3(0, 0, 0);
    m.ambientColor = new Bb.Color3(1, 1, 1);
    m.maxSimultaneousLights = 2;
    return m;
  };

  const maze = generateMaze(MAP, floor.openChance, floorSeed(floorId));
  const [soldierGx, soldierGz] = soldierCfg
    ? findDeadEnd(maze, MAP, 1, 1)
    : [Math.floor(MAP / 2), Math.floor(MAP / 2)];

  const floorTex = pix('mzFloor', (c) => {
    speck(c, floor.floorHex, ['#bdb6a6', '#d8d2c4', '#c2bbab']);
    c.fillStyle = 'rgba(90,82,68,0.45)'; c.fillRect(0, 0, 16, 1); c.fillRect(0, 0, 1, 16);
  });
  floorTex.uScale = floorTex.vScale = MAP;
  const floorMat = toon('mzFloorMat', floor.floorHex, floorTex, 0.05);
  const floorMesh = Bb.MeshBuilder.CreateBox('mzFloor', { width: MAP * CELL, height: 0.4, depth: MAP * CELL }, scene);
  floorMesh.position.y = -0.2; floorMesh.material = floorMat; floorMesh.freezeWorldMatrix();

  const wallTex = pix('mzWall', (c) => {
    speck(c, floor.wallHex, ['#6f8cc4', '#90abdc', '#6986bc']);
    c.fillStyle = 'rgba(38,48,78,0.55)';
    for (let y = 0; y < 16; y += 4) c.fillRect(0, y, 16, 1);
    for (let x = 0; x < 16; x += 8) c.fillRect(x, 0, 1, 16);
  });
  const wall = Bb.MeshBuilder.CreateBox('mzWalls', { width: CELL, height: WALL_H, depth: CELL }, scene);
  wall.material = toon('mzWallMat', floor.wallHex, wallTex, 0.08); wall.isPickable = false;
  const trim = Bb.MeshBuilder.CreateBox('mzTrim', { width: CELL, height: 0.25, depth: CELL }, scene);
  trim.material = toon('mzTrimMat', '#ffce4a', null, 0.3); trim.isPickable = false;
  const wMats = []; const tMats = [];
  for (let gz = 0; gz < MAP; gz++) for (let gx = 0; gx < MAP; gx++) if (maze[gz][gx] === 1) {
    wMats.push(Bb.Matrix.Translation(wc(gx, MAP), WALL_H / 2, wc(gz, MAP)));
    tMats.push(Bb.Matrix.Translation(wc(gx, MAP), WALL_H + 0.12, wc(gz, MAP)));
  }
  wall.thinInstanceAdd(wMats); trim.thinInstanceAdd(tMats);
  wall.freezeWorldMatrix(); trim.freezeWorldMatrix();

  const cc = Math.floor(MAP / 2);
  const exitGx = cc; const exitGz = cc;
  maze[exitGz][exitGx] = 0;

  const exitPos = new Bb.Vector3(wc(exitGx, MAP), 0.6, wc(exitGz, MAP));
  const exitPad = Bb.MeshBuilder.CreateCylinder('exitPad', { diameter: 2.8, height: 0.35, tessellation: 16 }, scene);
  exitPad.position = exitPos;
  exitPad.material = toon('exitMat', '#16d39a', null, 0.55);

  const exitBeacon = Bb.MeshBuilder.CreateSphere('exitBeacon', { diameter: 1.2, segments: 10 }, scene);
  exitBeacon.position = new Bb.Vector3(wc(exitGx, MAP), 1.5, wc(exitGz, MAP));
  exitBeacon.material = toon('exitBeaconMat', '#16d39a', null, 0.85);

  const npcKit = createNpcKit(Bb, scene, { cell: CELL });
  let soldierNpc = null;
  if (soldierCfg && !soldierGone && !soldierRecruited) {
    soldierNpc = npcKit.spawn({
      x: wc(soldierGx, MAP),
      z: wc(soldierGz, MAP),
      color: soldierCfg.color,
      name: isAr ? soldierCfg.nameAr : soldierCfg.name,
      role: floor.isBoss ? 'boss' : 'soldier',
      scale: soldierCfg.scale || 1,
      girth: soldierCfg.girth || 1,
      accessory: soldierCfg.accessory,
    });
  }

  const ctrl = setupControls(scene, canvas, {
    inputRef,
    start: new Bb.Vector3(wc(1, MAP), 0, wc(1, MAP)),
    startYaw: 0,
    character: ctx.character,
    equipped: ctx.equipped,
    lowPerf: ctx.lowPerf,
    topDown: true,
    camDist: 12,
    camHeight: 20,
    fov: 0.7,
    charScale: 0.28,
    gridCollide: (x, z) => {
      const r = 0.7;
      const hit = (px, pz) => {
        const a = gAt(px, MAP); const b = gAt(pz, MAP);
        return a < 0 || a >= MAP || b < 0 || b >= MAP || maze[b][a] === 1;
      };
      return hit(x - r, z - r) || hit(x + r, z - r) || hit(x - r, z + r) || hit(x + r, z + r);
    },
    onInteract: () => tryInteract(),
  });

  ctrl.keyLight.intensity = 0.85;
  ctrl.keyLight.direction = new Bb.Vector3(-0.4, -1, 0.5);
  const hemi = new Bb.HemisphericLight('mzHemi', new Bb.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.7; hemi.diffuse = new Bb.Color3(1, 1, 1);
  hemi.groundColor = new Bb.Color3(0.55, 0.56, 0.62);
  hemi.specular = new Bb.Color3(0, 0, 0);

  scene.skipPointerMovePicking = true;
  scene.blockMaterialDirtyMechanism = true;

  const power = totalPower();
  const label = isAr ? floor.labelAr : floor.labelEn;
  overlayEl.innerHTML = `
    <div class="rh-zone"><div class="rh-zone-k">${isAr ? 'متاهة' : 'Labyrinth'}</div><div class="rh-zone-v">${label}</div></div>
    <div class="rh-army-hud">⚔️ ${isAr ? 'القوة' : 'Power'} <b>${power}</b>${floor.isBoss ? ` / ${BOSS_POWER}` : ''}</div>
    <div class="rh-prompt" id="rhPrompt"></div>
    <div class="rh-instr" id="rhInstr">${isAr ? 'العصا للتحرك · USE للتفاعل' : 'Joystick to move · USE to interact'}</div>`;
  const promptEl = overlayEl.querySelector('#rhPrompt');
  const instrEl = overlayEl.querySelector('#rhInstr');

  let nearTarget = null;
  let lastPrompt = '';

  function soldierGateOpen() {
    if (!soldierCfg) return true;
    const st = status(soldierCfg.id);
    return st === 'recruited' || st === 'gone';
  }

  function canUseExit() {
    if (!soldierGateOpen()) return false;
    if (floor.isBoss && power < BOSS_POWER) return false;
    return true;
  }

  function tryInteract() {
    const p = ctrl.player.position;
    if (soldierNpc && nearTarget === soldierNpc) {
      const st = status(soldierCfg.id);
      if (st === 'recruited') return;
      if (st === 'gone') {
        ctx.playSfx?.('error');
        return;
      }
      if (floor.isBoss && power < BOSS_POWER) {
        ctx.playSfx?.('error');
        lastPrompt = isAr
          ? `▶ تحتاج ${BOSS_POWER} قوة (لديك ${power})`
          : `▶ Need ${BOSS_POWER} power (you have ${power})`;
        promptEl.textContent = lastPrompt;
        promptEl.classList.add('show');
        return;
      }
      ctx.playSfx?.('click');
      ctx.openRecruitChallenge?.({
        id: soldierCfg.id,
        name: isAr ? soldierCfg.nameAr : soldierCfg.name,
        nameAr: soldierCfg.nameAr,
        power: soldierCfg.power,
        puzzleKey: soldierCfg.puzzleKey,
        floorId,
      });
      return;
    }
    if (Bb.Vector3.Distance(p, exitPos) < 4.2) {
      if (!canUseExit()) {
        ctx.playSfx?.('error');
        const needRecruit = soldierCfg && !soldierGateOpen();
        lastPrompt = needRecruit
          ? (isAr ? '▶ جنّد الجندي أولاً' : '▶ Recruit the soldier first')
          : (isAr ? `▶ تحتاج ${BOSS_POWER} قوة للعبور` : `▶ Need ${BOSS_POWER} power to pass`);
        promptEl.textContent = lastPrompt;
        promptEl.classList.add('show');
        return;
      }
      ctx.playSfx?.('win');
      ctx.updateXP?.(floor.isBoss ? 100 : 40);
      setCampaignFloor(floor.nextRoom);
      if (floor.nextRoom === floorId) {
        lastPrompt = isAr ? '▶ أكملت الفصل!' : '▶ Chapter complete!';
        promptEl.textContent = lastPrompt;
        promptEl.classList.add('show');
        return;
      }
      ctx.goToRoom?.(floor.nextRoom);
    }
  }

  const beforeRender = () => {
    const t = performance.now() / 1000;
    exitBeacon.rotation.y += 0.03;
    exitPad.scaling.y = 1 + Math.sin(t * 2.5) * 0.06;

    const nearNpc = npcKit.update(ctrl.player.position, t);
    nearTarget = nearNpc;

    const distExit = Bb.Vector3.Distance(ctrl.player.position, exitPos);
    let pr = '';
    if (nearNpc === soldierNpc && soldierNpc) {
      const st = status(soldierCfg.id);
      const att = attemptsUsed(soldierCfg.id);
      if (st === 'recruited') pr = isAr ? '▶ انضمّ إلى جيشك' : '▶ Already in your army';
      else if (st === 'gone') pr = isAr ? '▶ غادر' : '▶ They left';
      else if (floor.isBoss && power < BOSS_POWER) {
        pr = isAr ? `▶ ${BOSS_POWER} قوة مطلوبة (${power})` : `▶ Need ${BOSS_POWER} power (${power})`;
      } else {
        pr = isAr
          ? `▶ USE — تحدي موقّت (${att}/${MAX_ATTEMPTS})`
          : `▶ USE — timed duel (${att}/${MAX_ATTEMPTS})`;
      }
    } else if (distExit < 4.2) {
      if (!canUseExit()) {
        pr = soldierCfg && !soldierGateOpen()
          ? (isAr ? '▶ جنّد الجندي لفتح الممر' : '▶ Recruit soldier to open the path')
          : (isAr ? `▶ ${BOSS_POWER} قوة للعبور` : `▶ ${BOSS_POWER} power needed`);
      } else {
        pr = floor.isBoss
          ? (isAr ? '▶ USE — ادخل الفصل التالي' : '▶ USE — enter next chapter')
          : (isAr ? '▶ USE — نزول للطابق التالي' : '▶ USE — descend to next floor');
      }
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

/** @deprecated Use buildCampaignMaze — kept for any stale imports. */
export function buildMazeRoom(opts) {
  return buildCampaignMaze({ ...opts, floorId: 'floor1' });
}
