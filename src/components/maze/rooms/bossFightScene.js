/**
 * Hollywood boxing cinematic — boss attacks, heroes defend & counter with limb animations.
 */
import { createNpcKit } from './npc';
import {
  attachFightRig, spawnPunchTrail, spawnImpactSlash,
} from './fightRig';
import {
  createMazeMaterials, buildMazeMeshes, makeBossGate,
  GATE_MAZE_STYLE, generateMaze,
} from './mazeKit';

const B = () => window.BABYLON;
const DURATION_MS = 18500;
const BOSS_Z = 8;
const HERO_Z = -4;
const RING_Z = 2;

function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function clamp01(t) { return Math.min(1, Math.max(0, t)); }
function seg(u, t0, t1) { return clamp01((u - t0) / Math.max(0.001, t1 - t0)); }

const CAM = [
  { t0: 0, t1: 0.07, pos: [0, 30, -24], tgt: [0, 2.5, BOSS_Z] },
  { t0: 0.07, t1: 0.16, pos: [0, 5.5, BOSS_Z + 5], tgt: [0, 2.8, BOSS_Z] },
  { t0: 0.16, t1: 0.24, pos: [-16, 4, RING_Z], tgt: [0, 2.2, BOSS_Z] },
  { t0: 0.24, t1: 0.32, pos: [14, 3.5, HERO_Z + 3], tgt: [0, 2, HERO_Z] },
  { t0: 0.32, t1: 0.40, pos: [0, 3.2, RING_Z + 4], tgt: [0, 2.2, RING_Z] },
  { t0: 0.40, t1: 0.46, pos: [-6, 2.2, RING_Z + 2], tgt: [0, 2, RING_Z] },
  { t0: 0.46, t1: 0.52, pos: [5, 2.4, RING_Z + 1], tgt: [0, 2.5, BOSS_Z - 1] },
  { t0: 0.52, t1: 0.58, pos: [0, 2, RING_Z + 3], tgt: [0, 1.8, RING_Z] },
  { t0: 0.58, t1: 0.64, pos: [-8, 2.6, RING_Z], tgt: [0, 2, RING_Z] },
  { t0: 0.64, t1: 0.70, pos: [7, 2.2, RING_Z + 1], tgt: [0, 2.2, BOSS_Z] },
  { t0: 0.70, t1: 0.76, pos: [0, 1.8, RING_Z + 2], tgt: [0, 2, RING_Z] },
  { t0: 0.76, t1: 0.84, pos: [0, 14, RING_Z + 6], tgt: [0, 1.2, BOSS_Z] },
  { t0: 0.84, t1: 1, pos: [0, 26, -10], tgt: [0, 2, BOSS_Z + 2] },
];

const CAPTIONS = {
  en: [
    { at: 0, text: 'THE GATE WARDEN', big: true },
    { at: 0.08, text: 'He raises his fists…' },
    { at: 0.18, text: 'Come no further!' },
    { at: 0.28, text: 'Your allies enter the ring.' },
    { at: 0.36, text: 'Guard up!' },
    { at: 0.40, text: 'The Warden swings!', flash: true, pop: 'SWING!' },
    { at: 0.46, text: 'BLOCKED!', flash: true, pop: 'BLOCK!' },
    { at: 0.52, text: 'Counter — jab!', pop: 'JAB!' },
    { at: 0.58, text: 'Cross!', flash: true, pop: 'POW!' },
    { at: 0.64, text: 'The Warden kicks!', pop: 'KICK!' },
    { at: 0.70, text: 'Dodge!', pop: 'WHOOSH' },
    { at: 0.76, text: 'UPPERCUT!', flash: true, pop: 'WHAM!' },
    { at: 0.84, text: 'K.O.!', flash: true, pop: 'K.O.!' },
    { at: 0.92, text: 'THE GATE OPENS', big: true },
  ],
  ar: [
    { at: 0, text: 'حارس البوابة', big: true },
    { at: 0.08, text: 'يرفع قبضتيه…' },
    { at: 0.18, text: 'لا تتقدم!' },
    { at: 0.28, text: 'حلفاؤك يدخلون الحلبة.' },
    { at: 0.36, text: 'ارفع دفاعك!' },
    { at: 0.40, text: 'الحارس يلوّح!', flash: true, pop: 'ضربة!' },
    { at: 0.46, text: 'صُدّت!', flash: true, pop: 'صد!' },
    { at: 0.52, text: 'رد — لكمة!', pop: 'لكمة!' },
    { at: 0.58, text: 'ضربة قوية!', flash: true, pop: 'بووم!' },
    { at: 0.64, text: 'ركلة!', pop: 'ركلة!' },
    { at: 0.70, text: 'تفادى!', pop: 'فwhoosh' },
    { at: 0.76, text: 'Uppercut!', flash: true, pop: 'WHAM!' },
    { at: 0.84, text: 'K.O.!', flash: true, pop: 'K.O.!' },
    { at: 0.92, text: 'فُتحت البوابة', big: true },
  ],
};

function sampleCam(u) {
  let i = 0;
  while (i < CAM.length - 1 && u > CAM[i].t1) i += 1;
  const a = CAM[i];
  const b = CAM[Math.min(i + 1, CAM.length - 1)];
  const t = easeInOut(seg(u, a.t0, a.t1));
  return {
    px: lerp(a.pos[0], b.pos[0], t),
    py: lerp(a.pos[1], b.pos[1], t),
    pz: lerp(a.pos[2], b.pos[2], t),
    tx: lerp(a.tgt[0], b.tgt[0], t),
    ty: lerp(a.tgt[1], b.tgt[1], t),
    tz: lerp(a.tgt[2], b.tgt[2], t),
  };
}

function hideNpcVisual(npc) {
  npc.body.isVisible = false;
  npc.root.getChildMeshes().forEach((m) => { m.isVisible = false; });
}

function spawnSparks(Bb, scene, mat, count, origin, spread = 3) {
  const sparks = [];
  for (let i = 0; i < count; i++) {
    const s = Bb.MeshBuilder.CreateSphere(`sp${i}`, { diameter: 0.15 + Math.random() * 0.35, segments: 6 }, scene);
    s.material = mat;
    s.position.copyFrom(origin);
    const ang = Math.random() * Math.PI * 2;
    const spd = 0.15 + Math.random() * 0.35;
    sparks.push({
      mesh: s,
      vx: Math.cos(ang) * spd * spread,
      vy: 0.1 + Math.random() * 0.3,
      vz: Math.sin(ang) * spd * spread,
      life: 1,
    });
  }
  return sparks;
}

function blendPose(rig, a, b, t) {
  rig.blendPoses(a, b, easeInOut(t));
}

/** Boxing choreography per normalized timeline u. */
function choreograph(u, bossRig, heroRigs) {
  const [h0, h1] = heroRigs;
  const h1r = h1 || h0;

  if (u < 0.28) {
    bossRig.applyPose('guard', easeOut(seg(u, 0.08, 0.22)));
    h0.blendPoses('guard', 'guard', 0);
    h1r.blendPoses('guard', 'guard', 0);
    return;
  }

  if (u < 0.36) {
    const t = seg(u, 0.28, 0.36);
    bossRig.applyPose('guard', 1);
    h0.blendPoses('guard', 'guard', t);
    h1r.blendPoses('guard', 'guard', t);
    return;
  }

  if (u < 0.40) {
    blendPose(bossRig, 'guard', 'bossWindup', seg(u, 0.36, 0.40));
    h0.applyPose('guard', 1);
    h1r.applyPose('guard', 1);
    return;
  }

  if (u < 0.46) {
    const t = seg(u, 0.40, 0.46);
    blendPose(bossRig, 'bossWindup', 'bossHaymaker', t);
    h0.blendPoses('guard', 'block', easeOut(t));
    h1r.blendPoses('guard', 'block', easeOut(t));
    return;
  }

  if (u < 0.52) {
    const t = seg(u, 0.46, 0.52);
    bossRig.blendPoses('bossHaymaker', 'guard', easeOut(t));
    h0.blendPoses('block', 'jabL', t);
    h1r.applyPose('guard', 1);
    return;
  }

  if (u < 0.58) {
    const t = seg(u, 0.52, 0.58);
    h0.blendPoses('jabL', 'guard', easeOut(t * 0.5));
    h1r.blendPoses('guard', 'crossR', t);
    bossRig.blendPoses('guard', 'block', easeOut(t));
    return;
  }

  if (u < 0.64) {
    const t = seg(u, 0.58, 0.64);
    blendPose(bossRig, 'block', 'bossKickWind', t * 0.45);
    h0.applyPose('guard', 1);
    h1r.applyPose('guard', 1);
    return;
  }

  if (u < 0.70) {
    const t = seg(u, 0.64, 0.70);
    blendPose(bossRig, 'bossKickWind', 'bossKick', t);
    h0.blendPoses('guard', 'dodge', t);
    h1r.blendPoses('guard', 'dodge', t);
    return;
  }

  if (u < 0.76) {
    const t = seg(u, 0.70, 0.76);
    bossRig.blendPoses('bossKick', 'guard', easeOut(t * 0.4));
    h0.blendPoses('dodge', 'hookL', t);
    h1r.blendPoses('dodge', 'uppercutR', t);
    return;
  }

  if (u < 0.84) {
    const t = seg(u, 0.76, 0.84);
    h0.blendPoses('hookL', 'guard', easeOut(t * 0.3));
    h1r.blendPoses('uppercutR', 'guard', easeOut(t * 0.3));
    bossRig.blendPoses('guard', 'hit', easeOut(t));
    return;
  }

  const t = seg(u, 0.84, 0.96);
  bossRig.blendPoses('hit', 'ko', easeOut(t));
  h0.applyPose('guard', 1);
  h1r.applyPose('guard', 1);
}

export function buildBossFightScene({ engine, canvas, overlayEl, ctx, payload, onComplete }) {
  const isAr = ctx.currentLang === 'ar';
  const soldiers = payload?.soldiers || [];
  const boss = payload?.boss || { color: '#9a68c8', name: 'Warden' };
  const { mapSize: MAP, openChance, wallHex, floorHex, seed } = GATE_MAZE_STYLE;

  const Bb = B();
  const scene = new Bb.Scene(engine);
  if (Bb.ScenePerformancePriority) scene.performancePriority = Bb.ScenePerformancePriority.Intermediate;

  const sky = Bb.Color3.FromHexString('#0a0618');
  scene.clearColor = new Bb.Color4(sky.r, sky.g, sky.b, 1);
  scene.ambientColor = new Bb.Color3(0.28, 0.24, 0.38);
  scene.fogMode = Bb.Scene.FOGMODE_EXP2;
  scene.fogColor = sky;
  scene.fogDensity = 0.02;

  const mats = createMazeMaterials(Bb, scene, floorHex, wallHex);
  const maze = generateMaze(MAP, openChance, seed);
  for (let y = 0; y < MAP; y++) for (let x = 0; x < MAP; x++) {
    if (x > 1 && x < MAP - 2 && y > 1 && y < MAP - 2) maze[y][x] = 0;
  }
  buildMazeMeshes(Bb, scene, maze, MAP, { ...mats, floorHex, wallHex });

  const cc = Math.floor(MAP / 2);
  makeBossGate(Bb, scene, mats.toon, cc, MAP - 2, MAP);

  const cam = new Bb.FreeCamera('bfCam', new Bb.Vector3(0, 30, -24), scene);
  cam.setTarget(new Bb.Vector3(0, 2.5, BOSS_Z));
  cam.fov = 0.88;

  const key = new Bb.DirectionalLight('bfKey', new Bb.Vector3(-0.35, -1, 0.25), scene);
  key.intensity = 0.7;
  key.diffuse = Bb.Color3.FromHexString('#ffd8a8');
  const rim = new Bb.DirectionalLight('bfRim', new Bb.Vector3(0.5, -0.2, -0.9), scene);
  rim.intensity = 1.05;
  rim.diffuse = Bb.Color3.FromHexString('#c8a0ff');
  const bossLight = new Bb.PointLight('bfBoss', new Bb.Vector3(0, 5, BOSS_Z), scene);
  bossLight.intensity = 2;
  bossLight.diffuse = Bb.Color3.FromHexString('#b080ff');
  bossLight.range = 30;
  const ringLight = new Bb.PointLight('bfRing', new Bb.Vector3(0, 4, RING_Z), scene);
  ringLight.intensity = 1.1;
  ringLight.diffuse = Bb.Color3.FromHexString('#ffe0a0');
  ringLight.range = 22;

  const npcKit = createNpcKit(Bb, scene, { cell: 4, animateDist: 999, interactDist: 0 });

  const heroes = soldiers.slice(0, 2).map((s, i) => {
    const n = npcKit.spawn({
      x: -2 + i * 4,
      z: HERO_Z,
      color: s.color,
      name: s.name,
      role: 'soldier',
      scale: s.scale || 1,
      accessory: s.accessory,
    });
    hideNpcVisual(n);
    n.root.rotation.y = 0;
    n.fightRig = attachFightRig(Bb, scene, n.root, { color: s.color, scale: s.scale || 1 });
    n.fightRig.applyPose('guard', 0);
    return n;
  });
  if (heroes.length === 1) heroes.push(heroes[0]);

  const bossNpc = npcKit.spawn({
    x: 0,
    z: BOSS_Z,
    color: boss.color,
    name: boss.name,
    role: 'boss',
    scale: boss.scale || 1.35,
    girth: boss.girth || 1.1,
    accessory: boss.accessory || 'horns',
  });
  hideNpcVisual(bossNpc);
  bossNpc.root.rotation.y = Math.PI;
  bossNpc.fightRig = attachFightRig(Bb, scene, bossNpc.root, {
    color: boss.color, scale: boss.scale || 1.35,
  });
  bossNpc.fightRig.applyPose('guard', 0);

  const sparkMat = new Bb.StandardMaterial('bfSpark', scene);
  sparkMat.emissiveColor = Bb.Color3.FromHexString('#ffcc66');
  sparkMat.disableLighting = true;
  const trailMat = new Bb.StandardMaterial('bfTrail', scene);
  trailMat.emissiveColor = Bb.Color3.FromHexString('#ffffff');
  trailMat.alpha = 0.65;
  trailMat.disableLighting = true;
  const slashMat = new Bb.StandardMaterial('bfSlash', scene);
  slashMat.emissiveColor = Bb.Color3.FromHexString('#ff6040');
  slashMat.disableLighting = true;

  overlayEl.innerHTML = `
    <div class="bf-cine-grain" aria-hidden="true"></div>
    <div class="bf-cine-vignette" aria-hidden="true"></div>
    <div class="bf-cine-flash" id="bfFlashDom"></div>
    <div class="bf-cine-flash bf-cine-flash--red" id="bfFlashRed"></div>
    <div class="bf-cine-pop" id="bfPop"></div>
    <div class="bf-cine-title" id="bfTitle"></div>
    <div class="bf-cine-sub" id="bfSub"></div>
    <div class="bf-cine-bar bf-cine-bar--top"></div>
    <div class="bf-cine-bar bf-cine-bar--bot"></div>`;
  const subEl = overlayEl.querySelector('#bfSub');
  const titleEl = overlayEl.querySelector('#bfTitle');
  const popEl = overlayEl.querySelector('#bfPop');
  const flashDom = overlayEl.querySelector('#bfFlashDom');
  const flashRed = overlayEl.querySelector('#bfFlashRed');
  const caps = isAr ? CAPTIONS.ar : CAPTIONS.en;

  const t0 = performance.now();
  let lastCap = -1;
  const sfxPlayed = new Set();
  let finished = false;
  let sparks = [];
  let trails = [];
  let slashes = [];
  let shakeT = 0;
  let hitFlash = 0;

  function popWord(text) {
    if (!popEl || !text) return;
    popEl.textContent = text;
    popEl.classList.remove('show');
    void popEl.offsetWidth;
    popEl.classList.add('show');
  }

  function hitImpact(origin, big = false) {
    sparks.push(...spawnSparks(Bb, scene, sparkMat, big ? 22 : 14, origin, big ? 4 : 2.8));
    slashes.push(spawnImpactSlash(Bb, scene, slashMat, origin, big ? 3 : 2.2));
    shakeT = big ? 1.3 : 0.75;
    hitFlash = big ? 0.7 : 0.45;
    flashDom?.classList.add('show');
    if (big) flashRed?.classList.add('show');
    setTimeout(() => {
      flashDom?.classList.remove('show');
      flashRed?.classList.remove('show');
    }, big ? 160 : 90);
  }

  const beforeRender = () => {
    const elapsed = performance.now() - t0;
    const u = Math.min(1, elapsed / DURATION_MS);

    const c = sampleCam(u);
    const shake = shakeT > 0 ? (Math.random() - 0.5) * shakeT * 0.38 : 0;
    shakeT *= 0.88;
    cam.position.set(c.px + shake, c.py + shake * 0.35, c.pz + shake * 0.5);
    cam.setTarget(new Bb.Vector3(c.tx, c.ty, c.tz));
    cam.fov = lerp(0.88, 0.72, seg(u, 0.38, 0.48)) + (shakeT > 0.4 ? 0.05 : 0);

    choreograph(u, bossNpc.fightRig, heroes.map((h) => h.fightRig));

    const walkIn = easeOut(seg(u, 0.24, 0.34));
    heroes.forEach((h, i) => {
      const tx = lerp(-2 + i * 4, -1.6 + i * 3.2, walkIn);
      const tz = lerp(HERO_Z, RING_Z - 2.5, walkIn);
      h.root.position.x = tx;
      h.root.position.z = tz;
      h.blob.position.x = tx;
      h.blob.position.z = tz;
    });

    const bossHit = seg(u, 0.76, 0.84);
    const bossKo = seg(u, 0.84, 0.96);
    bossNpc.root.position.z = lerp(BOSS_Z, BOSS_Z - bossHit * 1.2 - bossKo * 3, 0.08);
    bossNpc.root.position.y = -bossKo * 0.9;
    bossNpc.root.rotation.x = bossHit * 0.4 + bossKo * 1.1;
    bossNpc.blob.position.z = bossNpc.root.position.z;
    bossLight.intensity = lerp(2, 0.12, bossKo) + hitFlash;
    hitFlash *= 0.87;

    if (u > 0.39 && u < 0.44 && !sfxPlayed.has('swing')) {
      sfxPlayed.add('swing');
      const fist = bossNpc.fightRig.fistWorld('R');
      const from = fist.clone(); from.z -= 1.5;
      trails.push(spawnPunchTrail(Bb, scene, trailMat, from, fist));
    }
    if (u > 0.45 && u < 0.48 && !sfxPlayed.has('block')) {
      sfxPlayed.add('block');
      hitImpact(new Bb.Vector3(0, 2.2, RING_Z), false);
      ctx.playSfx?.('click');
    }
    if (u > 0.53 && u < 0.56 && !sfxPlayed.has('jab')) {
      sfxPlayed.add('jab');
      const fist = heroes[0].fightRig.fistWorld('L');
      const from = fist.clone(); from.z -= 0.8;
      trails.push(spawnPunchTrail(Bb, scene, trailMat, from, fist));
      hitImpact(fist, false);
      ctx.playSfx?.('collect');
    }
    if (u > 0.57 && u < 0.60 && !sfxPlayed.has('cross')) {
      sfxPlayed.add('cross');
      const fist = heroes[1].fightRig.fistWorld('R');
      const from = fist.clone(); from.z -= 0.8;
      trails.push(spawnPunchTrail(Bb, scene, trailMat, from, fist));
      hitImpact(fist, false);
      ctx.playSfx?.('collect');
    }
    if (u > 0.65 && u < 0.68 && !sfxPlayed.has('kick')) {
      sfxPlayed.add('kick');
      const foot = bossNpc.fightRig.footWorld('R');
      const from = foot.clone(); from.z -= 1; from.y += 0.2;
      trails.push(spawnPunchTrail(Bb, scene, trailMat, from, foot));
    }
    if (u > 0.77 && u < 0.81 && !sfxPlayed.has('finisher')) {
      sfxPlayed.add('finisher');
      const fist = heroes[1].fightRig.fistWorld('R');
      hitImpact(fist, true);
      ctx.playSfx?.('collect');
    }
    if (u > 0.88 && !sfxPlayed.has('win')) {
      sfxPlayed.add('win');
      ctx.playSfx?.('win');
    }

    const tickFx = (arr) => arr.filter((s) => {
      if (!s) return false;
      s.life -= 0.04;
      if (s.mesh) {
        if (s.vx != null) {
          s.mesh.position.x += s.vx;
          s.mesh.position.y += s.vy;
          s.mesh.position.z += s.vz;
          s.vy -= 0.012;
        }
        s.mesh.scaling.setAll(Math.max(0, s.life));
      }
      if (s.life <= 0) { s.mesh?.dispose(); return false; }
      return true;
    });
    sparks = tickFx(sparks);
    trails = tickFx(trails);
    slashes = tickFx(slashes);

    if (u >= 0.88) scene.fogDensity = lerp(0.02, 0.007, seg(u, 0.88, 1));

    const capIdx = caps.findIndex((cap, i) => u >= cap.at && (caps[i + 1]?.at ?? 1) > u);
    if (capIdx !== lastCap && capIdx >= 0) {
      lastCap = capIdx;
      const cap = caps[capIdx];
      if (cap.pop) popWord(cap.pop);
      if (cap.big) {
        titleEl.textContent = cap.text;
        titleEl.classList.add('show');
        subEl.classList.remove('show');
      } else {
        titleEl.classList.remove('show');
        subEl.textContent = cap.text;
        subEl.classList.add('show');
        subEl.classList.toggle('bf-cine-sub--impact', !!cap.flash);
      }
      if (cap.flash) {
        flashDom?.classList.add('show');
        setTimeout(() => flashDom?.classList.remove('show'), 100);
      }
    }

    if (u >= 1 && !finished) {
      finished = true;
      scene.unregisterBeforeRender(beforeRender);
      setTimeout(() => onComplete?.(), 500);
    }
  };
  scene.registerBeforeRender(beforeRender);

  return {
    scene,
    interact: () => {},
    jump: () => {},
    dispose() {
      scene.unregisterBeforeRender(beforeRender);
      [...sparks, ...trails, ...slashes].forEach((s) => s?.mesh?.dispose());
      npcKit.dispose();
      overlayEl.innerHTML = '';
      scene.dispose();
    },
  };
}
