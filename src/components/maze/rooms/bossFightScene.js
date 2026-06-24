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
const DURATION_MS = 19500;
// Fighters stand close together so blows actually connect.
const BOSS_Z = 5;
const HERO_Z = -3;
const RING_Z = 2;
const HERO_FIGHT_Z = 2.4;   // where the heroes square up
// Fighters are sized for the camera here, independent of the (small) room scale.
const FIGHT_HERO_SCALE = 1.0;
const FIGHT_BOSS_SCALE = 1.5;

function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function clamp01(t) { return Math.min(1, Math.max(0, t)); }
function seg(u, t0, t1) { return clamp01((u - t0) / Math.max(0.001, t1 - t0)); }

// One steady "broadcast" camera — a fixed side-on angle that just eases in a
// touch over the round. No flying around; the fight stays clear and readable.
const FIGHT_MID_Z = (HERO_FIGHT_Z + BOSS_Z) / 2;
const CAM_START = { pos: [13, 4.6, FIGHT_MID_Z - 1.5], tgt: [0, 1.7, FIGHT_MID_Z] };
const CAM_END = { pos: [10.5, 4.0, FIGHT_MID_Z - 1.0], tgt: [0, 1.55, FIGHT_MID_Z] };

function sampleSteadyCam(u) {
  const t = easeInOut(u);
  return {
    px: lerp(CAM_START.pos[0], CAM_END.pos[0], t),
    py: lerp(CAM_START.pos[1], CAM_END.pos[1], t),
    pz: lerp(CAM_START.pos[2], CAM_END.pos[2], t),
    tx: lerp(CAM_START.tgt[0], CAM_END.tgt[0], t),
    ty: lerp(CAM_START.tgt[1], CAM_END.tgt[1], t),
    tz: lerp(CAM_START.tgt[2], CAM_END.tgt[2], t),
  };
}

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

  // ── Boxing ring: raised canvas, corner posts, ropes ──
  const ringHalf = 7;
  const ringMat = new Bb.StandardMaterial('bfRingMat', scene);
  ringMat.diffuseColor = Bb.Color3.FromHexString('#241a38');
  ringMat.specularColor = new Bb.Color3(0.06, 0.06, 0.1);
  const matCorner = new Bb.StandardMaterial('bfPost', scene);
  matCorner.diffuseColor = Bb.Color3.FromHexString('#c8a0ff');
  matCorner.emissiveColor = Bb.Color3.FromHexString('#3a2a55');
  const matRope = new Bb.StandardMaterial('bfRope', scene);
  matRope.diffuseColor = Bb.Color3.FromHexString('#ffe0a0');
  matRope.emissiveColor = Bb.Color3.FromHexString('#5a4520');

  const canvasMesh = Bb.MeshBuilder.CreateBox('bfCanvas', { width: ringHalf * 2 + 1, height: 0.4, depth: ringHalf * 2 + 1 }, scene);
  canvasMesh.position.set(0, 0.18, RING_Z);
  canvasMesh.material = ringMat;
  canvasMesh.isPickable = false;
  const apron = Bb.MeshBuilder.CreateBox('bfApron', { width: ringHalf * 2 + 2.4, height: 0.36, depth: ringHalf * 2 + 2.4 }, scene);
  apron.position.set(0, 0.05, RING_Z);
  apron.material = matRope;
  apron.isPickable = false;

  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const postPos = corners.map(([sx, sz]) => new Bb.Vector3(sx * ringHalf, 0, RING_Z + sz * ringHalf));
  postPos.forEach((pp, i) => {
    const post = Bb.MeshBuilder.CreateCylinder('bfPost' + i, { diameter: 0.4, height: 3.4, tessellation: 8 }, scene);
    post.position.set(pp.x, 1.9, pp.z);
    post.material = matCorner;
    post.isPickable = false;
  });
  // Ropes — 3 heights between adjacent posts.
  [1.0, 1.7, 2.4].forEach((ry) => {
    for (let i = 0; i < 4; i++) {
      const a = postPos[i];
      const b = postPos[(i + 1) % 4];
      const mid = a.add(b).scale(0.5);
      const len = Bb.Vector3.Distance(a, b);
      const rope = Bb.MeshBuilder.CreateBox('bfRope', { width: 0.07, height: 0.07, depth: len }, scene);
      rope.position.set(mid.x, ry, mid.z);
      rope.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
      rope.material = matRope;
      rope.isPickable = false;
    }
  });

  // ── Crowd: instanced silhouettes ringing the arena, gently bobbing ──
  const crowdMat = new Bb.StandardMaterial('bfCrowdMat', scene);
  crowdMat.diffuseColor = Bb.Color3.FromHexString('#0d0a1a');
  crowdMat.emissiveColor = Bb.Color3.FromHexString('#160f2a');
  crowdMat.specularColor = new Bb.Color3(0, 0, 0);
  const crowdSrc = Bb.MeshBuilder.CreateCapsule('bfCrowdSrc', { height: 1.4, radius: 0.34, tessellation: 6, capSubdivisions: 1 }, scene);
  crowdSrc.material = crowdMat; crowdSrc.isVisible = false;
  const crowd = [];
  const rings = [{ r: 13, n: 26 }, { r: 16.5, n: 32 }];
  rings.forEach((band, bi) => {
    for (let i = 0; i < band.n; i++) {
      const ang = (i / band.n) * Math.PI * 2 + bi * 0.1;
      const jitter = (Math.random() - 0.5) * 1.4;
      const inst = crowdSrc.createInstance('bfCrowd');
      const cx = Math.cos(ang) * (band.r + jitter);
      const cz = RING_Z + Math.sin(ang) * (band.r + jitter);
      inst.position.set(cx, 1 + bi * 0.6, cz);
      inst.isPickable = false;
      crowd.push({ mesh: inst, baseY: inst.position.y, phase: Math.random() * 6.28 });
    }
  });

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

  // Two arena spotlights raking down onto the ring for that fight-night look.
  const spotA = new Bb.SpotLight('bfSpotA', new Bb.Vector3(-9, 16, RING_Z - 7), new Bb.Vector3(0.5, -1, 0.4), Math.PI / 3.2, 8, scene);
  spotA.intensity = 1.6; spotA.diffuse = Bb.Color3.FromHexString('#fff0d0'); spotA.range = 40;
  const spotB = new Bb.SpotLight('bfSpotB', new Bb.Vector3(9, 16, RING_Z + 7), new Bb.Vector3(-0.5, -1, -0.4), Math.PI / 3.2, 8, scene);
  spotB.intensity = 1.4; spotB.diffuse = Bb.Color3.FromHexString('#d0c0ff'); spotB.range = 40;

  const npcKit = createNpcKit(Bb, scene, { cell: 4, animateDist: 999, interactDist: 0 });

  const heroes = soldiers.slice(0, 2).map((s, i) => {
    const n = npcKit.spawn({
      x: -2 + i * 4,
      z: HERO_Z,
      color: s.color,
      name: s.name,
      role: 'soldier',
      scale: FIGHT_HERO_SCALE,
      accessory: s.accessory,
    });
    hideNpcVisual(n);
    n.root.rotation.y = 0;
    n.fightRig = attachFightRig(Bb, scene, n.root, { color: s.color, scale: FIGHT_HERO_SCALE });
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
    scale: FIGHT_BOSS_SCALE,
    girth: boss.girth || 1.1,
    accessory: boss.accessory || 'horns',
  });
  hideNpcVisual(bossNpc);
  bossNpc.root.rotation.y = Math.PI;
  bossNpc.fightRig = attachFightRig(Bb, scene, bossNpc.root, {
    color: boss.color, scale: FIGHT_BOSS_SCALE,
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
  let lastNow = t0;
  let frozenAccum = 0; // total ms held on freeze-frames (hitstop)
  let freezeEnd = 0;
  let lastCap = -1;
  const sfxPlayed = new Set();
  let finished = false;
  let sparks = [];
  let trails = [];
  let slashes = [];
  let shakeT = 0;
  let hitFlash = 0;
  let crowdHype = 0; // spikes on big hits → crowd jumps

  function popWord(text) {
    if (!popEl || !text) return;
    popEl.textContent = text;
    popEl.classList.remove('show');
    void popEl.offsetWidth;
    popEl.classList.add('show');
  }

  function hitImpact(origin, big = false) {
    sparks.push(...spawnSparks(Bb, scene, sparkMat, big ? 26 : 14, origin, big ? 4.5 : 2.8));
    slashes.push(spawnImpactSlash(Bb, scene, slashMat, origin, big ? 3.4 : 2.2));
    shakeT = big ? 1.5 : 0.75;
    hitFlash = big ? 0.8 : 0.45;
    crowdHype = big ? 1.4 : 0.6;
    // Freeze-frame hitstop — the punch lands and time stops for a beat.
    freezeEnd = performance.now() + (big ? 220 : 70);
    flashDom?.classList.add('show');
    if (big) flashRed?.classList.add('show');
    setTimeout(() => {
      flashDom?.classList.remove('show');
      flashRed?.classList.remove('show');
    }, big ? 160 : 90);
  }

  const beforeRender = () => {
    const now = performance.now();
    const dt = now - lastNow;
    lastNow = now;
    if (now < freezeEnd) frozenAccum += dt; // hold time during hitstop
    const elapsed = (now - t0) - frozenAccum;
    const u = Math.min(1, elapsed / DURATION_MS);

    // Crowd bob + hype jump on big moments.
    crowdHype *= 0.9;
    const tt = now / 1000;
    crowd.forEach((cw) => {
      cw.mesh.position.y = cw.baseY + Math.sin(tt * 3 + cw.phase) * 0.12 + crowdHype * (0.4 + Math.abs(Math.sin(tt * 9 + cw.phase)) * 0.5);
    });

    // Steady camera — fixed side-on shot, gentle ease-in, only impacts shake it.
    const c = sampleSteadyCam(u);
    const shake = shakeT > 0 ? (Math.random() - 0.5) * shakeT * 0.22 : 0;
    shakeT *= 0.86;
    cam.position.set(c.px + shake, c.py + shake * 0.4, c.pz + shake * 0.4);
    cam.setTarget(new Bb.Vector3(c.tx, c.ty + shake * 0.2, c.tz));
    cam.fov = 0.8 + (shakeT > 0.5 ? 0.04 : 0);

    choreograph(u, bossNpc.fightRig, heroes.map((h) => h.fightRig));

    // Lunges so blows actually land — fighters step into their attacks (a bump
    // that rises then settles) instead of swinging at empty air.
    const bump = (s) => Math.sin(Math.PI * clamp01(s));
    const heroLunge = [
      bump(seg(u, 0.46, 0.52)) * 0.9 + bump(seg(u, 0.76, 0.84)) * 1.2,
      bump(seg(u, 0.52, 0.58)) * 0.9 + bump(seg(u, 0.76, 0.84)) * 1.2,
    ];
    const bossLunge = bump(seg(u, 0.40, 0.46)) * 1.2 + bump(seg(u, 0.64, 0.70)) * 1.0;

    const walkIn = easeOut(seg(u, 0.20, 0.32));
    heroes.forEach((h, i) => {
      const tx = lerp(-1.6 + i * 3.2, -1.3 + i * 2.6, walkIn);
      const tz = lerp(HERO_Z, HERO_FIGHT_Z, walkIn) + heroLunge[i]; // +Z = toward boss
      h.root.position.x = tx;
      h.root.position.z = tz;
      h.blob.position.x = tx;
      h.blob.position.z = tz;
    });

    const bossHit = seg(u, 0.76, 0.84);
    const bossKo = seg(u, 0.84, 0.96);
    // Boss steps in on its attacks (−Z toward heroes), then is knocked back (+Z).
    const bossZ = BOSS_Z - bossLunge + bossHit * 1.0 + bossKo * 3.0;
    bossNpc.root.position.z = bossZ;
    bossNpc.root.position.y = -bossKo * 0.9;
    bossNpc.root.rotation.x = bossHit * 0.4 + bossKo * 1.1;
    bossNpc.blob.position.z = bossZ;
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
      crowdHype = 1.8;
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
