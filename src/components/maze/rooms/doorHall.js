/**
 * The Door Hall — the hub room.
 *
 * Styled after the "Three Doors" reference: a bright, airy hall with off-white
 * walls, a light ceiling, a checkerboard floor and decorative pillars. Three
 * framed coloured doors line the far (north) wall, each lit by its own glow.
 * Walk up to a door and interact; if it leads somewhere the host loads that
 * room. For now only the RED door is wired (Skinner's Room).
 *
 * Returns { scene, interact, dispose }. The scene owns everything it creates,
 * so dispose() frees all of its meshes/textures at once.
 */
import { setupControls } from './roomControls';

const B = window.BABYLON;

const ROOM = 24, H = 5, TK = 0.5, half = ROOM / 2;

const DOORS = [
  { id: 'red',   label: 'The Attention Room',  room: 'attention', x: -3.5, color: '#cc1100', emissive: '#550000' },
  { id: 'green', label: 'The Emerald Archive', room: null,    x: 0,    color: '#006622', emissive: '#002a0e' },
  { id: 'blue',  label: 'The Azure Sanctum',   room: null,    x: 3.5,  color: '#001188', emissive: '#000533' },
];

export function buildDoorHall({ engine, canvas, overlayEl, ctx, inputRef }) {
  const scene = new B.Scene(engine);
  // Bright sky background + soft fog (matches the reference's airy feel).
  const sky = B.Color3.FromHexString('#87CEEB');
  scene.clearColor = new B.Color4(sky.r, sky.g, sky.b, 1);
  scene.collisionsEnabled = true;
  scene.fogMode = B.Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.014;
  scene.fogColor = sky;

  // ── Lighting (sky fill; the key light + shadows come from roomControls) ──
  const hemi = new B.HemisphericLight('hemi', new B.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.75;
  hemi.diffuse = new B.Color3(1, 1, 1);
  hemi.groundColor = new B.Color3(0.2, 0.2, 0.22);
  hemi.specular = new B.Color3(0, 0, 0);

  const std = (name, hex, opts = {}) => {
    const m = new B.StandardMaterial(name, scene);
    m.diffuseColor = B.Color3.FromHexString(hex);
    m.specularColor = new B.Color3(opts.spec ?? 0.04, opts.spec ?? 0.04, opts.spec ?? 0.04);
    if (opts.emissive) m.emissiveColor = B.Color3.FromHexString(opts.emissive);
    return m;
  };

  // ── Checkerboard floor (textured box so collisions stay solid) ──
  const floorTex = new B.DynamicTexture('floorTex', { width: 256, height: 256 }, scene, false);
  const fctx = floorTex.getContext();
  fctx.fillStyle = '#1e1e2a'; fctx.fillRect(0, 0, 256, 256);
  fctx.fillStyle = '#26263a'; fctx.fillRect(0, 0, 128, 128); fctx.fillRect(128, 128, 128, 128);
  floorTex.update();
  floorTex.wrapU = floorTex.wrapV = B.Texture.WRAP_ADDRESSMODE;
  floorTex.uScale = floorTex.vScale = ROOM / 2;
  const floorMat = new B.StandardMaterial('floorMat', scene);
  floorMat.diffuseTexture = floorTex;
  floorMat.specularColor = new B.Color3(0.03, 0.03, 0.03);

  const box = (name, w, h, d, x, y, z, m, col) => {
    const b = B.MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
    b.position.set(x, y, z); b.material = m;
    if (col) b.checkCollisions = true;
    return b;
  };

  const floor = box('floor', ROOM, TK, ROOM, 0, -TK / 2, 0, floorMat, true);
  floor.receiveShadows = true;
  box('ceiling', ROOM, TK, ROOM, 0, H + TK / 2, 0, std('ceilMat', '#dddde8'), false);

  // ── Walls (off-white, solid) ──
  const wallMat = std('wallMat', '#f0ede8', { spec: 0.02 });
  const walls = [
    box('wN', ROOM, H, TK, 0, H / 2, -half, wallMat, true),
    box('wS', ROOM, H, TK, 0, H / 2, half, wallMat, true),
    box('wW', TK, H, ROOM, -half, H / 2, 0, wallMat, true),
    box('wE', TK, H, ROOM, half, H / 2, 0, wallMat, true),
  ];

  // ── Decorative pillars (no collision — just dressing) ──
  const pillarMat = std('pillarMat', '#ddddcc', { spec: 0.05 });
  const pillars = [];
  [[-8, -10], [8, -10], [-8, 10], [8, 10]].forEach(([px, pz]) => {
    const p = B.MeshBuilder.CreateCylinder('pillar', { diameterTop: 0.5, diameterBottom: 0.6, height: H, tessellation: 12 }, scene);
    p.position.set(px, H / 2, pz); p.material = pillarMat;
    pillars.push(p);
  });

  // ── Doors on the far (north) wall ──
  const doorZ = -half + 0.3;
  const frameMat = std('frameMat', '#2a1a0a', { spec: 0.1 });
  const knobMat = std('knobMat', '#ddaa33', { spec: 0.4 });
  const doorMeshes = [];
  DOORS.forEach((d) => {
    const frame = box('frame_' + d.id, 1.8, 3.0, 0.25, d.x, 1.5, doorZ - 0.12, frameMat, false);
    const panel = box('door_' + d.id, 1.5, 2.7, 0.18, d.x, 1.5, doorZ + 0.06,
      std('doorMat_' + d.id, d.color, { emissive: d.emissive, spec: 0.15 }), false);
    panel.metadata = { door: d };
    const knob = B.MeshBuilder.CreateSphere('knob_' + d.id, { diameter: 0.14, segments: 10 }, scene);
    knob.position.set(d.x + 0.55, 1.5, doorZ + 0.18); knob.material = knobMat;
    const light = new B.PointLight('dl_' + d.id, new B.Vector3(d.x, 3.5, doorZ + 0.5), scene);
    light.diffuse = B.Color3.FromHexString(d.color).scale(1.4);
    light.intensity = 0.9; light.range = 6;
    doorMeshes.push({ def: d, panel, frame, knob, x: d.x, z: doorZ });
  });

  // ── Controls (third-person chase cam + visible character) ──
  const ctrl = setupControls(scene, canvas, {
    inputRef,
    start: new B.Vector3(0, 0, 4),
    startYaw: Math.PI, // face north toward the doors; camera trails to the south
    character: ctx.character,
    equipped: ctx.equipped,
    bounds: { hw: half, hd: half },
    lowPerf: ctx.lowPerf,
    onInteract: tryInteract,
  });
  // Cast room shadows from the key light created in roomControls.
  [...walls, ...pillars].forEach((m) => ctrl.shadowGenerator.addShadowCaster(m));

  // ── Overlay ──
  overlayEl.innerHTML = `
    <div class="rh-zone"><div class="rh-zone-k">Hub</div><div class="rh-zone-v">The Door Hall</div></div>
    <div class="rh-prompt" id="rhPrompt"></div>
    <div class="rh-instr">Turn with A/D · walk with W/S · approach a door · E to enter</div>`;
  const promptEl = overlayEl.querySelector('#rhPrompt');

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'rh-toast';
    t.textContent = msg;
    overlayEl.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; });
    setTimeout(() => { t.style.opacity = '0'; }, 1300);
    setTimeout(() => { t.remove(); }, 1700);
  }

  let nearDoor = null;
  function tryInteract() {
    if (!nearDoor) return;
    ctx.playSfx?.('click');
    if (nearDoor.def.room) ctx.goToRoom(nearDoor.def.room);
    else toast(`${nearDoor.def.label} — coming soon`);
  }

  const beforeRender = () => {
    const p = ctrl.player.position;
    let near = null, best = 3.4;
    for (const dm of doorMeshes) {
      const dist = Math.hypot(p.x - dm.x, p.z - dm.z);
      if (dist < best) { best = dist; near = dm; }
    }
    if (near !== nearDoor) {
      nearDoor = near;
      promptEl.textContent = near ? `▶ ${near.def.label} — press E to enter` : '';
      promptEl.classList.toggle('show', !!near);
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
