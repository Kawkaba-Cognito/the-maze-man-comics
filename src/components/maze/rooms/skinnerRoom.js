/**
 * Skinner's Room — interactive operant-conditioning lab.
 *
 * Ported from the standalone Babylon HTML into a room builder. Four quadrants
 * (the four contingencies), a central Skinner Box with a clickable lever, signs,
 * furniture, particles and an EXIT door back to the hall.
 *
 * Returns { scene, interact, dispose }. Uses the shared FPS controls. Physics
 * (pick-up / throw) is optional — it activates only if a Cannon plugin is
 * present, otherwise those props are simply static.
 */
import { setupControls } from './roomControls';

const B = window.BABYLON;

const ZONES = {
  entrance: {
    lbl: 'Laboratory Entrance', ttl: 'B.F. Skinner (1904–1990)',
    dsc: 'Behaviour is shaped by its consequences. Reinforcement increases behaviour; punishment decreases it. Walk into each coloured quadrant to explore the four types.',
  },
  pr: {
    lbl: 'Quadrant I — North West', ttl: 'Positive Reinforcement',
    dsc: 'Adding a pleasant stimulus INCREASES behaviour. A rat presses the lever → receives a food pellet → presses more. The reward strengthens the behaviour.',
  },
  nr: {
    lbl: 'Quadrant II — North East', ttl: 'Negative Reinforcement',
    dsc: 'Removing an unpleasant stimulus INCREASES behaviour. The rat presses the lever → the floor current stops → presses more. Relief strengthens the behaviour. NOT punishment!',
  },
  pp: {
    lbl: 'Quadrant III — South West', ttl: 'Positive Punishment',
    dsc: 'Adding an aversive stimulus DECREASES behaviour. The rat enters a zone → receives a mild shock → avoids it. Adding something unpleasant weakens future behaviour.',
  },
  np: {
    lbl: 'Quadrant IV — South East', ttl: 'Negative Punishment',
    dsc: 'Removing a pleasant stimulus DECREASES behaviour. A child misbehaves → loses TV privileges → misbehaves less. Taking away something good weakens the behaviour.',
  },
  center: {
    lbl: 'Center — The Skinner Box', ttl: 'Operant Conditioning Chamber',
    dsc: 'Built in 1930, the Skinner Box isolates a subject and controls all stimuli — lever, food dispenser, light cue, electric grid. Interact with the lever to trigger a conditioning event!',
  },
};

// ── Compact synthesised audio (lazy) ──
function makeAudio() {
  let AC = null;
  const ensure = () => {
    if (AC) return AC;
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; }
    return AC;
  };
  return {
    resume() { const a = ensure(); if (a && a.state === 'suspended') a.resume(); },
    chime() {
      const a = ensure(); if (!a) return;
      [523, 659, 784].forEach((f, i) => {
        const o = a.createOscillator(), g = a.createGain();
        o.type = 'sine'; o.frequency.value = f;
        const t = a.currentTime + i * 0.1;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.15, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.65);
      });
    },
    buzz() {
      const a = ensure(); if (!a) return;
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'sawtooth'; o.frequency.value = 110;
      g.gain.setValueAtTime(0.18, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.45);
      o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.5);
    },
    click() {
      const a = ensure(); if (!a) return;
      const b = a.createBuffer(1, a.sampleRate * 0.04, a.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.1)) * 0.8;
      const s = a.createBufferSource(), g = a.createGain(); g.gain.value = 0.4;
      s.buffer = b; s.connect(g); g.connect(a.destination); s.start();
    },
    close() { try { AC && AC.close(); } catch (e) { /* noop */ } AC = null; },
  };
}

export function buildSkinnerRoom({ engine, canvas, overlayEl, ctx, inputRef }) {
  const scene = new B.Scene(engine);
  scene.gravity = new B.Vector3(0, -0.5, 0);
  scene.collisionsEnabled = true;
  const sky = B.Color3.FromHexString('#87CEEB');
  scene.fogMode = B.Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.012;
  scene.fogColor = sky;
  scene.clearColor = new B.Color4(sky.r, sky.g, sky.b, 1);

  const audio = makeAudio();
  audio.resume();

  // Physics (optional — only if a Cannon global exists)
  let physicsOn = false;
  try {
    if (window.CANNON) {
      scene.enablePhysics(new B.Vector3(0, -9.81, 0), new B.CannonJSPlugin(true, 10, window.CANNON));
      physicsOn = true;
    }
  } catch (e) { physicsOn = false; }

  // ── Lighting ──
  const hemi = new B.HemisphericLight('hemi', new B.Vector3(0, 1, 0), scene);
  hemi.intensity = 1.0;
  hemi.diffuse = new B.Color3(1, 1, 1);
  hemi.groundColor = new B.Color3(0.55, 0.56, 0.6);
  hemi.specular = new B.Color3(0, 0, 0);

  const mkPL = (x, y, z, r, g, b, intensity, range) => {
    const l = new B.PointLight('pl' + Math.random(), new B.Vector3(x, y, z), scene);
    l.diffuse = new B.Color3(r, g, b);
    l.specular = new B.Color3(r * 0.3, g * 0.3, b * 0.3);
    l.intensity = intensity; l.range = range;
    return l;
  };
  const lC = mkPL(0, 4.5, 0, 1, 1, 1, 2.0, 20);
  mkPL(-7.5, 4, 7.5, 0.3, 1.0, 0.5, 1.5, 18);
  mkPL(7.5, 4, 7.5, 0.3, 0.6, 1.0, 1.5, 18);
  mkPL(-7.5, 4, -7.5, 1.0, 0.35, 0.1, 1.5, 18);
  mkPL(7.5, 4, -7.5, 1.0, 0.8, 0.1, 1.5, 18);

  const shadows = new B.ShadowGenerator(512, lC);
  shadows.useBlurExponentialShadowMap = true;
  shadows.blurKernel = 8;
  const addShadow = (m) => { shadows.addShadowCaster(m, true); m.receiveShadows = true; };

  // ── Materials ──
  const mat = (r, g, b) => {
    const m = new B.StandardMaterial('m' + Math.random(), scene);
    m.diffuseColor = new B.Color3(r, g, b);
    m.specularColor = new B.Color3(0.08, 0.08, 0.08);
    return m;
  };
  const matEmit = (r, g, b, er, eg, eb) => {
    const m = new B.StandardMaterial('me' + Math.random(), scene);
    m.diffuseColor = new B.Color3(r, g, b);
    m.emissiveColor = new B.Color3(er, eg, eb);
    m.specularColor = new B.Color3(0, 0, 0);
    return m;
  };
  const matWireEmit = (r, g, b) => {
    const m = new B.StandardMaterial('mw' + Math.random(), scene);
    m.emissiveColor = new B.Color3(r, g, b);
    m.wireframe = true;
    return m;
  };

  const mFloor = (() => {
    const tex = new B.DynamicTexture('skFloorTex', { width: 256, height: 256 }, scene, false);
    const fx = tex.getContext();
    fx.fillStyle = '#1e1e2a'; fx.fillRect(0, 0, 256, 256);
    fx.fillStyle = '#26263a'; fx.fillRect(0, 0, 128, 128); fx.fillRect(128, 128, 128, 128);
    tex.update();
    tex.wrapU = tex.wrapV = B.Texture.WRAP_ADDRESSMODE;
    tex.uScale = tex.vScale = 15;
    const m = new B.StandardMaterial('skFloorMat', scene);
    m.diffuseTexture = tex;
    m.specularColor = new B.Color3(0.03, 0.03, 0.03);
    return m;
  })();
  const mWall = mat(0.94, 0.93, 0.90);
  const mCeiling = mat(0.86, 0.86, 0.91);
  const mMetal = mat(0.5, 0.52, 0.55);
  const mWood = mat(0.38, 0.24, 0.12);
  const mGlass = (() => {
    const m = new B.StandardMaterial('glass', scene);
    m.diffuseColor = new B.Color3(0.6, 0.85, 0.75);
    m.specularColor = new B.Color3(0.5, 0.5, 0.5);
    m.alpha = 0.28;
    return m;
  })();

  // ── Room shell ──
  const RW = 30, RH = 5.5, RD = 30;
  const box3 = (name, w, h, d, x, y, z, m, col) => {
    const b = B.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
    b.position.set(x, y, z); b.material = m;
    if (col) b.checkCollisions = true;
    return b;
  };

  const floor = box3('floor', RW, 0.3, RD, 0, -0.15, 0, mFloor, true);
  floor.receiveShadows = true;
  if (physicsOn) {
    try {
      floor.physicsImpostor = new B.PhysicsImpostor(floor, B.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.3, friction: 0.8 }, scene);
    } catch (e) { /* noop */ }
  }
  box3('ceiling', RW, 0.3, RD, 0, RH + 0.15, 0, mCeiling, false);

  box3('wN', RW, RH, 0.4, 0, RH / 2, RD / 2, mWall, true);
  box3('wS', RW, RH, 0.4, 0, RH / 2, -RD / 2, mWall, true);
  box3('wE', 0.4, RH, RD, RW / 2, RH / 2, 0, mWall, true);
  box3('wW', 0.4, RH, RD, -RW / 2, RH / 2, 0, mWall, true);

  // Low quadrant dividers — tall enough to separate the quadrants at body
  // height, short enough that the chase camera sees over them (no wall-staring).
  const DH = 1.3;
  box3('dNS_n', 0.4, DH, 12, 0, DH / 2, 9, mWall, true);
  box3('dNS_s', 0.4, DH, 12, 0, DH / 2, -9, mWall, true);
  box3('dEW_e', 12, DH, 0.4, 9, DH / 2, 0, mWall, true);
  box3('dEW_w', 12, DH, 0.4, -9, DH / 2, 0, mWall, true);

  const mkCeilingLight = (x, z, r, g, b) => box3('cl' + Math.random(), 2.2, 0.06, 1, x, RH - 0.04, z, matEmit(r, g, b, r, g, b), false);
  mkCeilingLight(-7.5, 7.5, 0.2, 1.0, 0.5);
  mkCeilingLight(7.5, 7.5, 0.2, 0.5, 1.0);
  mkCeilingLight(-7.5, -7.5, 1.0, 0.35, 0.1);
  mkCeilingLight(7.5, -7.5, 1.0, 0.8, 0.2);
  mkCeilingLight(0, 0, 0.7, 0.8, 1.0);

  // ── Zone floor tints ──
  const mkTile = (x, z, r, g, b) => {
    const t = box3('tile' + Math.random(), 13, 0.02, 13, x, 0.01, z, matEmit(r * 0.15, g * 0.15, b * 0.15, r * 0.04, g * 0.04, b * 0.04), false);
    t.material.alpha = 0.6;
    return t;
  };
  mkTile(-7.5, 7.5, 0, 1, 0.5);
  mkTile(7.5, 7.5, 0, 0.5, 1);
  mkTile(-7.5, -7.5, 1, 0.35, 0);
  mkTile(7.5, -7.5, 1, 0.8, 0);

  // ── Signs ──
  const mkSign = (label, sub, x, y, z, rotY, hexCol) => {
    const plane = B.MeshBuilder.CreatePlane('sign_' + label, { width: 4.2, height: 1.3 }, scene);
    plane.position.set(x, y, z); plane.rotation.y = rotY;
    const m = new B.StandardMaterial('sm_' + label, scene);
    const tex = new B.DynamicTexture('st_' + label, { width: 512, height: 158 }, scene);
    const c = tex.getContext();
    c.fillStyle = 'rgba(0,0,0,0.9)'; c.fillRect(0, 0, 512, 158);
    c.strokeStyle = hexCol; c.lineWidth = 2.5; c.strokeRect(5, 5, 502, 148);
    c.fillStyle = hexCol; c.font = 'bold 23px Courier New'; c.textAlign = 'center';
    c.fillText(label, 256, 50);
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.font = '13px Courier New';
    c.fillText(sub, 256, 88);
    c.fillStyle = 'rgba(255,255,255,0.25)'; c.font = '10px Courier New';
    c.fillText('B.F. SKINNER — OPERANT CONDITIONING', 256, 130);
    tex.update();
    m.diffuseTexture = tex; m.emissiveTexture = tex;
    m.emissiveColor = new B.Color3(1, 1, 1); m.backFaceCulling = false;
    plane.material = m;
    return plane;
  };
  mkSign('POSITIVE REINFORCEMENT', 'Add pleasant stimulus → Behaviour INCREASES', -7.5, 2.8, 14.6, 0, '#00ff77');
  mkSign('NEGATIVE REINFORCEMENT', 'Remove aversive stimulus → Behaviour INCREASES', 7.5, 2.8, 14.6, 0, '#33aaff');
  mkSign('POSITIVE PUNISHMENT', 'Add aversive stimulus → Behaviour DECREASES', -14.6, 2.8, -7.5, Math.PI / 2, '#ff4422');
  mkSign('NEGATIVE PUNISHMENT', 'Remove pleasant stimulus → Behaviour DECREASES', 14.6, 2.8, -7.5, -Math.PI / 2, '#ffcc22');

  // ── Entrance info board ──
  const board = box3('board', 4.5, 3.2, 0.18, -5, 2.2, -14.6, mMetal, true);
  addShadow(board);
  const bm = new B.StandardMaterial('bm', scene);
  const bt = new B.DynamicTexture('bt', { width: 512, height: 384 }, scene);
  const bc = bt.getContext();
  bc.fillStyle = '#030610'; bc.fillRect(0, 0, 512, 384);
  bc.strokeStyle = '#00ffaa'; bc.lineWidth = 2.5; bc.strokeRect(7, 7, 498, 370);
  bc.fillStyle = '#00ffaa'; bc.font = 'bold 24px Georgia'; bc.textAlign = 'center';
  bc.fillText('OPERANT CONDITIONING', 256, 48);
  bc.fillStyle = '#ccc'; bc.font = '12px Courier New'; bc.fillText('B.F. Skinner — 1938', 256, 76);
  bc.strokeStyle = 'rgba(0,255,170,0.3)'; bc.lineWidth = 1;
  bc.beginPath(); bc.moveTo(40, 90); bc.lineTo(472, 90); bc.stroke();
  bc.fillStyle = '#999'; bc.font = '11px Courier New'; bc.textAlign = 'left';
  [
    '"Behaviour is shaped by its consequences."', '',
    'REINFORCEMENT  = increases behaviour',
    'PUNISHMENT     = decreases behaviour', '',
    'POSITIVE = something is ADDED',
    'NEGATIVE = something is REMOVED', '',
    'Explore the four quadrants:',
    '  NW  Positive Reinforcement  [+R]',
    '  NE  Negative Reinforcement  [-R]',
    '  SW  Positive Punishment     [+P]',
    '  SE  Negative Punishment     [-P]', '',
    '  CENTER  The Skinner Box — use the lever!',
  ].forEach((l, i) => bc.fillText(l, 28, 116 + i * 15));
  bt.update();
  bm.diffuseTexture = bt; bm.emissiveTexture = bt; bm.emissiveColor = new B.Color3(1, 1, 1);
  board.material = bm;

  // ── EXIT door (back to hall) ──
  const exitDoor = box3('exitDoor', 1.6, 2.8, 0.18, 6, 1.4, -14.6, matEmit(0.05, 0.2, 0.14, 0.0, 0.5, 0.3), false);
  const exitLabel = B.MeshBuilder.CreatePlane('exitLabel', { width: 1.6, height: 0.5 }, scene);
  exitLabel.position.set(6, 3.0, -14.55);
  const elm = new B.StandardMaterial('elm', scene);
  const elt = new B.DynamicTexture('elt', { width: 256, height: 80 }, scene);
  const elc = elt.getContext();
  elc.fillStyle = 'rgba(0,0,0,0.9)'; elc.fillRect(0, 0, 256, 80);
  elc.strokeStyle = '#00ffaa'; elc.lineWidth = 2; elc.strokeRect(4, 4, 248, 72);
  elc.fillStyle = '#00ffaa'; elc.font = 'bold 22px Courier New'; elc.textAlign = 'center';
  elc.fillText('← EXIT', 128, 50);
  elt.update();
  elm.diffuseTexture = elt; elm.emissiveTexture = elt; elm.emissiveColor = new B.Color3(1, 1, 1); elm.backFaceCulling = false;
  exitLabel.material = elm;

  // ── Skinner Box (center) ──
  const skinnerBox = box3('skinnerBox', 2.6, 2.1, 2.6, 0, 1.05, 0, mMetal, true);
  addShadow(skinnerBox);
  box3('glassFront', 2.5, 1.9, 0.06, 0, 1.05, 1.3, mGlass, false);
  const lever = box3('lever', 0.09, 0.65, 0.09, -0.45, 1.35, 0.2, mMetal, false);
  lever.rotation.z = 0.3; addShadow(lever);
  const dish = B.MeshBuilder.CreateCylinder('dish', { diameter: 0.3, height: 0.07, tessellation: 14 }, scene);
  dish.position.set(-0.45, 0.06, 0.2); dish.material = mat(0.65, 0.55, 0.35);
  const indicator = box3('indicator', 0.22, 0.22, 0.1, 0.55, 1.88, 0.85, matEmit(0.1, 0.5, 0.1, 0, 0.9, 0.3), false);

  const ratBody = B.MeshBuilder.CreateSphere('ratBody', { diameter: 0.26, segments: 7 }, scene);
  ratBody.scaling.set(1.5, 1, 2); ratBody.position.set(0.1, 0.13, 0.1); ratBody.material = mat(0.55, 0.5, 0.45);
  addShadow(ratBody);
  const ratHead = B.MeshBuilder.CreateSphere('ratHead', { diameter: 0.19, segments: 7 }, scene);
  ratHead.position.set(0.1, 0.19, 0.58); ratHead.material = mat(0.55, 0.5, 0.45);

  const sLabel = B.MeshBuilder.CreatePlane('skinnerLabel', { width: 2.2, height: 0.5 }, scene);
  sLabel.position.set(0, 2.3, 1.33);
  const slm = new B.StandardMaterial('slm', scene);
  const slt = new B.DynamicTexture('slt', { width: 440, height: 100 }, scene);
  const slc = slt.getContext();
  slc.fillStyle = 'rgba(0,0,0,0.92)'; slc.fillRect(0, 0, 440, 100);
  slc.strokeStyle = '#00ffaa'; slc.lineWidth = 2; slc.strokeRect(4, 4, 432, 92);
  slc.fillStyle = '#00ffaa'; slc.font = 'bold 19px Courier New'; slc.textAlign = 'center';
  slc.fillText('SKINNER BOX', 220, 42);
  slc.fillStyle = '#666'; slc.font = '11px Courier New';
  slc.fillText('Operant Conditioning Chamber · 1930', 220, 70);
  slt.update();
  slm.diffuseTexture = slt; slm.emissiveTexture = slt; slm.emissiveColor = new B.Color3(1, 1, 1); slm.backFaceCulling = false;
  sLabel.material = slm;

  // ── Furniture ──
  addShadow(box3('shelf', 3.2, 0.12, 0.85, -7.5, 2, 12, mWood, true));
  addShadow(box3('desk', 3.5, 0.1, 1.5, -9, 1.1, 10, mWood, true));
  addShadow(box3('tableNR', 2.6, 0.1, 1.3, 10, 1.2, 9, mMetal, true));
  addShadow(box3('ctrlBox', 0.85, 0.55, 0.65, 10, 1.62, 9, matEmit(0.18, 0.18, 0.22, 0.02, 0.02, 0.04), false));
  const dial = B.MeshBuilder.CreateCylinder('dial', { diameter: 0.14, height: 0.08, tessellation: 10 }, scene);
  dial.position.set(10, 1.88, 8.72); dial.rotation.x = Math.PI / 2; dial.material = mMetal;
  const gridNR = box3('gridNR', 4.5, 0.04, 4.5, 7.5, 0.02, 7.5, matEmit(0.02, 0.06, 0.18, 0, 0.15, 0.7), false);
  box3('cage', 2.1, 1.6, 2.1, -9, 0.8, -9, matWireEmit(1, 0.3, 0.05), false);
  const gridPP = box3('gridPP', 4.5, 0.04, 4.5, -7.5, 0.02, -7.5, matEmit(0.18, 0.04, 0.02, 0.7, 0.15, 0), false);
  const bowl = B.MeshBuilder.CreateCylinder('bowl', { diameter: 1.3, height: 0.42, tessellation: 16 }, scene);
  bowl.position.set(7.5, 0.21, -9); bowl.material = mat(0.5, 0.42, 0.25); addShadow(bowl);

  const emptyP = B.MeshBuilder.CreatePlane('emptyP', { width: 1.6, height: 0.45 }, scene);
  emptyP.position.set(7.5, 1.0, -9);
  const epm = new B.StandardMaterial('epm', scene);
  const ept = new B.DynamicTexture('ept', { width: 200, height: 56 }, scene);
  const epc = ept.getContext();
  epc.clearRect(0, 0, 200, 56);
  epc.fillStyle = '#ffcc22'; epc.font = 'bold 22px Courier New'; epc.textAlign = 'center';
  epc.fillText('[ EMPTY ]', 100, 36);
  ept.update();
  epm.diffuseTexture = ept; epm.emissiveTexture = ept; epm.emissiveColor = new B.Color3(1, 1, 1);
  epm.backFaceCulling = false; epm.hasAlpha = true; epm.useAlphaFromDiffuseTexture = true;
  emptyP.material = epm;

  // ── Physics props (only fall if physics is on) ──
  const physObjs = [];
  const pelletMat = matEmit(0.8, 0.65, 0.28, 0.15, 0.1, 0.02);
  const addImpostor = (mesh, type, opts) => {
    if (!physicsOn) return;
    try { mesh.physicsImpostor = new B.PhysicsImpostor(mesh, type, opts, scene); physObjs.push(mesh); } catch (e) { /* noop */ }
  };
  const mkPellet = (x, y, z) => {
    const s = B.MeshBuilder.CreateSphere('pellet' + Math.random(), { diameter: 0.18, segments: 6 }, scene);
    s.position.set(x, y, z); s.material = pelletMat;
    addImpostor(s, B.PhysicsImpostor.SphereImpostor, { mass: 0.1, restitution: 0.5, friction: 0.5 });
    addShadow(s);
    return s;
  };
  const mkBlock = (x, y, z, r, g, b) => {
    const m = B.MeshBuilder.CreateBox('block' + Math.random(), { width: 0.32, height: 0.32, depth: 0.32 }, scene);
    m.position.set(x, y, z); m.material = matEmit(r * 0.5, g * 0.5, b * 0.5, r * 0.12, g * 0.12, b * 0.12);
    addImpostor(m, B.PhysicsImpostor.BoxImpostor, { mass: 0.4, restitution: 0.3, friction: 0.7 });
    addShadow(m);
    return m;
  };
  for (let i = 0; i < 6; i++) mkPellet(-9 + i * 0.55, 2.2, 12);
  for (let i = 0; i < 3; i++) {
    const can = B.MeshBuilder.CreateCylinder('can' + i, { diameter: 0.18, height: 0.38, tessellation: 10 }, scene);
    can.position.set(9.3 + i * 0.35, 1.45, 9); can.material = mat(0.4, 0.45, 0.5);
    addImpostor(can, B.PhysicsImpostor.CylinderImpostor, { mass: 0.3, restitution: 0.2, friction: 0.7 });
    addShadow(can);
  }
  for (let i = 0; i < 4; i++) mkBlock(-6 + i * 0.65, 0.2, -7, 1, 0.3, 0.05);
  mkBlock(9.5, 0.25, -11, 1, 0.75, 0);

  // ── Particles ──
  const psList = [];
  const mkPS = (x, z, r, g, b) => {
    const ps = new B.ParticleSystem('ps' + Math.random(), 20, scene);
    ps.emitter = new B.Vector3(x, 0.3, z);
    ps.color1 = new B.Color4(r, g, b, 0.7);
    ps.color2 = new B.Color4(r, g, b, 0.2);
    ps.colorDead = new B.Color4(r, g, b, 0);
    ps.minSize = 0.03; ps.maxSize = 0.07;
    ps.minLifeTime = 2.5; ps.maxLifeTime = 5;
    ps.emitRate = 5;
    ps.direction1 = new B.Vector3(-0.3, 1, -0.3);
    ps.direction2 = new B.Vector3(0.3, 2.5, 0.3);
    ps.gravity = new B.Vector3(0, -0.2, 0);
    ps.minEmitPower = 0.1; ps.maxEmitPower = 0.4;
    ps.updateSpeed = 0.006;
    ps.minEmitBox = new B.Vector3(-5, 0, -5);
    ps.maxEmitBox = new B.Vector3(5, 0, 5);
    ps.start();
    psList.push(ps);
  };
  mkPS(-7.5, 7.5, 0, 1, 0.5);
  mkPS(7.5, 7.5, 0, 0.5, 1);
  mkPS(-7.5, -7.5, 1, 0.35, 0.05);
  mkPS(7.5, -7.5, 1, 0.8, 0.1);

  // ── Controls ──
  const ctrl = setupControls(scene, canvas, {
    inputRef,
    start: new B.Vector3(1.5, 0, -6), // open lane beside the x=0 divider (NOT inside it)
    startYaw: 0, // face the lab (camera trails behind, toward the entrance)
    character: ctx.character,
    equipped: ctx.equipped,
    bounds: { hw: RW / 2, hd: RD / 2 },
    onInteract: interact,
  });

  // ── Post-processing (conservative) — created with the active camera ──
  const pp = new B.DefaultRenderingPipeline('pp', true, scene, [ctrl.camera]);
  pp.bloomEnabled = true;
  pp.bloomThreshold = 0.75;
  pp.bloomWeight = 0.25;
  pp.bloomKernel = 32;
  pp.bloomScale = 0.5;
  pp.grainEnabled = true;
  pp.grain.intensity = 5;
  pp.grain.animated = true;

  // ── Overlay ──
  overlayEl.innerHTML = `
    <div class="rh-zone"><div class="rh-zone-k" id="skZk">Zone</div><div class="rh-zone-v" id="skZv">Entrance</div></div>
    <div class="rh-hint">A/D turn · W/S walk · Shift run · E to use</div>
    <div class="rh-panel">
      <div class="rh-panel-lbl" id="skPl"></div>
      <div class="rh-panel-ttl" id="skPt"></div>
      <div class="rh-panel-dsc" id="skPd"></div>
    </div>
    <div class="rh-flash" id="skFlash"></div>`;
  const zkEl = overlayEl.querySelector('#skZk');
  const zvEl = overlayEl.querySelector('#skZv');
  const plEl = overlayEl.querySelector('#skPl');
  const ptEl = overlayEl.querySelector('#skPt');
  const pdEl = overlayEl.querySelector('#skPd');
  const flashEl = overlayEl.querySelector('#skFlash');

  const doFlash = (col, alpha = 0.35) => {
    flashEl.style.background = col;
    flashEl.style.opacity = alpha;
    setTimeout(() => { flashEl.style.opacity = 0; }, 150);
  };

  let curZone = '';
  const setZone = (key) => {
    if (key === curZone) return;
    curZone = key;
    const z = ZONES[key];
    plEl.textContent = z.lbl; ptEl.textContent = z.ttl; pdEl.textContent = z.dsc;
    zkEl.textContent = key === 'center' ? 'Center' : 'Zone';
    zvEl.textContent = z.ttl;
    if (key === 'pr') audio.chime();
    if (key === 'pp' || key === 'np') audio.buzz();
  };
  setZone('entrance');

  // ── Lever / interactions ──
  const SKINNER_NAMES = ['skinnerBox', 'lever', 'glassFront', 'ratBody', 'ratHead', 'dish', 'indicator', 'skinnerLabel'];
  let leverLocked = false;
  function pullLever() {
    if (leverLocked) return;
    leverLocked = true;
    lever.rotation.z = 0.85;
    audio.click();
    setTimeout(() => { audio.chime(); doFlash('rgba(0,255,130,0.4)'); }, 180);
    setTimeout(() => { lever.rotation.z = 0.3; leverLocked = false; }, 700);
    const p = mkPellet(0, 1.8, 0.3);
    if (physicsOn && p.physicsImpostor) {
      try { p.physicsImpostor.setLinearVelocity(new B.Vector3(0, -3, 0)); } catch (e) { /* noop */ }
    }
    ctx.updateXP?.(10);
    setZone('center');
  }

  function interact() {
    const ray = ctrl.getForwardRay(4.5);
    const hit = scene.pickWithRay(ray);
    const name = hit?.pickedMesh?.name || '';
    if (name === 'exitDoor' || name === 'exitLabel') { ctx.playSfx?.('click'); ctx.goToRoom('hall'); return; }
    if (SKINNER_NAMES.includes(name)) { pullLever(); return; }
    if (name === 'gridNR' || name === 'ctrlBox' || name === 'dial' || name.startsWith('can')) { doFlash('rgba(0,60,255,0.3)'); audio.buzz(); setZone('nr'); return; }
    if (name === 'gridPP' || name === 'cage') { doFlash('rgba(255,50,0,0.35)'); audio.buzz(); setZone('pp'); return; }
    if (name === 'bowl' || name === 'emptyP') { doFlash('rgba(255,200,0,0.3)'); setZone('np'); return; }
    if (name === 'board') { setZone('entrance'); }
  }

  // ── Pick up / throw (needs physics) ──
  let held = null;
  const HOLD = new B.Vector3(0.4, -0.3, 2.2);
  function pickUp() {
    if (!physicsOn) return;
    if (held) { held = null; return; }
    let best = null, bestD = 3.5;
    for (const o of physObjs) {
      const d = B.Vector3.Distance(ctrl.player.position, o.getAbsolutePosition());
      if (d < bestD) { bestD = d; best = o; }
    }
    if (best) { held = best; try { held.physicsImpostor.setLinearVelocity(B.Vector3.Zero()); } catch (e) { /* noop */ } }
  }
  function throwHeld() {
    if (!held) return;
    const fwd = ctrl.camera.getDirection(B.Axis.Z);
    try { held.physicsImpostor.setLinearVelocity(fwd.scale(16)); } catch (e) { /* noop */ }
    held = null;
  }
  const onKey = (e) => { if (e.code === 'KeyE') pickUp(); if (e.code === 'KeyF') throwHeld(); };
  window.addEventListener('keydown', onKey);

  // ── Per-frame ──
  let t = 0;
  const beforeRender = () => {
    t += 0.016;
    const cx = ctrl.player.position.x, cz = ctrl.player.position.z;
    if (Math.abs(cx) < 3 && Math.abs(cz) < 3) setZone('center');
    else if (cx < 0 && cz > 0) setZone('pr');
    else if (cx > 0 && cz > 0) setZone('nr');
    else if (cx < 0 && cz < 0) setZone('pp');
    else if (cx > 0 && cz < 0) setZone('np');
    else setZone('entrance');

    if (held && held.physicsImpostor) {
      try {
        const target = B.Vector3.TransformCoordinates(HOLD, ctrl.camera.getWorldMatrix());
        held.physicsImpostor.setLinearVelocity(target.subtract(held.getAbsolutePosition()).scale(20));
        held.physicsImpostor.setAngularVelocity(B.Vector3.Zero());
      } catch (e) { held = null; }
    }

    ratBody.position.y = 0.13 + 0.02 * Math.sin(t * 2.2);
    ratHead.position.y = 0.19 + 0.02 * Math.sin(t * 2.2 + 0.35);
    ratBody.rotation.y = Math.sin(t * 0.9) * 0.18;
    indicator.material.emissiveColor.g = 0.5 + 0.4 * Math.sin(t * 3);
    gridNR.material.emissiveColor.b = 0.5 + 0.25 * Math.sin(t * 7 + 1);
    gridPP.material.emissiveColor.r = 0.5 + 0.25 * Math.sin(t * 6 + 2);
  };
  scene.registerBeforeRender(beforeRender);

  return {
    scene,
    interact,
    action2: throwHeld,
    dispose() {
      window.removeEventListener('keydown', onKey);
      scene.unregisterBeforeRender(beforeRender);
      psList.forEach((ps) => ps.dispose());
      ctrl.dispose();
      audio.close();
      overlayEl.innerHTML = '';
      scene.dispose();
    },
  };
}
