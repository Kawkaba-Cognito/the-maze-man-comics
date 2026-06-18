/**
 * Shared THIRD-PERSON controls for every Babylon room.
 *
 * Modelled on the "Three Doors" chase-cam feel:
 *  • You roam as a VISIBLE character (the chosen fox / man / woman built by
 *    buildCharacter, lit by the comic kit).
 *  • TANK movement — A/D (or joystick X) turn you, W/S (or joystick Y) walk
 *    forward / back along your facing. Analog: harder push = faster.
 *  • A scripted CHASE CAMERA sits a fixed offset behind+above the character
 *    and smoothly trails (lerp). No orbit, so it never sways or jams.
 *
 * Desktop: WASD / arrows to move, Shift to run, E / Space / Enter to interact.
 * Touch:   the host joystick (inputRef.mx / .my) turns + walks; USE calls the
 *          room's interact(). (The look-pad is unused in chase-cam mode.)
 *
 * Returns { camera, player, kit, shadowGenerator, getForwardRay, dispose }.
 * `player` is the (invisible) collider — use player.position for proximity and
 * getForwardRay() for "what am I facing" interaction picks.
 */
import { createKit } from '../worldKit';
import { buildCharacter } from '../characters3d';

const B = window.BABYLON;

const MAX_SPEED = 0.19;  // top forward walk speed (per frame)
const MAX_BACK = 0.10;   // slower reverse
const RUN_MULT = 1.7;    // Shift
const TURN = 0.05;       // radians / frame at full turn input
const CHAR_SCALE = 0.45; // shrink the open-world rig to room scale (~1.6 units tall vs 2.7 doors)
const CAM_DIST = 6.5;    // how far the chase camera trails behind
const CAM_HEIGHT = 3.3;  // how high above the floor the camera sits
const CAM_LOOK_Y = 1.1;  // height the camera aims at (character mid-body)
const GROUND_Y = 1.0;    // collider centre height when feet rest on the floor
const JUMP_V = 0.23;     // initial jump velocity
const GRAV = 0.013;      // gravity per frame

export function setupControls(scene, canvas, opts = {}) {
  const {
    start = new B.Vector3(0, 0, -8),
    startYaw = 0,
    inputRef,
    onInteract,
    onAction2, // secondary action (e.g. grab / throw) — bound to F
    character = 'male',
    equipped = {},
    bounds = null, // { hw, hd } half-extents → keeps the camera inside the walls
    lowPerf = false, // phones: smaller shadow map + lighter blur
    gridCollide = null, // (x,z)=>bool — if set, walls are checked by grid lookup
                        // instead of moveWithCollisions (cheap for big mazes)
    camDist = CAM_DIST, camHeight = CAM_HEIGHT, camLookY = CAM_LOOK_Y, // chase cam
    fov = 1.0,
  } = opts;

  scene.collisionsEnabled = true;

  // ── Comic kit (glow layer + toon materials) ──
  const kit = createKit(B, scene, lowPerf);

  // ── Key light + soft shadows for the rim-lit look ──
  const dir = new B.DirectionalLight('keyLight', new B.Vector3(-0.45, -1, 0.55), scene);
  dir.position = new B.Vector3(12, 22, -12);
  dir.intensity = 1.0;
  const shadowGenerator = new B.ShadowGenerator(lowPerf ? 512 : 1024, dir);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = lowPerf ? 8 : 16;
  shadowGenerator.darkness = 0.4;

  // ── Player collider (invisible) — the character rig is parented to it ──
  // Centre at y=1, ~2 units tall, feet on the floor.
  const player = B.MeshBuilder.CreateBox('player', { width: 0.8, height: 2, depth: 0.8 }, scene);
  player.isVisible = false;
  player.checkCollisions = true;
  player.ellipsoid = new B.Vector3(0.4, 1.0, 0.4);
  player.position = new B.Vector3(start.x, 1.0, start.z);

  const { rig } = buildCharacter(B, scene, player, shadowGenerator, character, equipped, kit);
  // buildCharacter assumes a y=2 collider centre (it drops the rig -2 to the
  // floor). Our centre is y=1, and we shrink the rig, so re-seat its feet at 0.
  rig.root.position.y = -1.0;
  rig.root.scaling.set(CHAR_SCALE, CHAR_SCALE, CHAR_SCALE);
  rig.root.rotation.y = startYaw;
  // The open-world rig uses a glowing gold "ink rim" (emissive fresnel) that
  // reads as self-lit in a brightly-lit room. Drop the emissive glow so the
  // character is lit normally by the room's lights.
  rig.root.getChildMeshes().forEach((m) => {
    const mt = m.material;
    if (mt && mt.emissiveColor) {
      mt.emissiveFresnelParameters = null;
      mt.emissiveColor = B.Color3.Black();
    }
  });
  const dust = kit.dustPuffs(player);

  let heading = startYaw; // the character's facing (radians)

  // ── Chase camera (scripted — no orbit input) ──
  const camera = new B.UniversalCamera('chaseCam', player.position.clone(), scene);
  camera.fov = fov;
  camera.minZ = 0.1;
  camera.inputs.clear(); // we drive it entirely from code

  // ── Keyboard ──
  const inputMap = {};
  const fireInteract = () => onInteract?.();
  const onKeyDown = (e) => {
    const k = e.key.toLowerCase();
    inputMap[k] = true;
    if (k === 'e' || k === 'enter') { e.preventDefault(); fireInteract(); }
    if (k === ' ') { e.preventDefault(); jumpQueued = true; }
    if (k === 'f') { e.preventDefault(); onAction2?.(); }
  };
  const onKeyUp = (e) => { inputMap[e.key.toLowerCase()] = false; };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  // ── Per-frame movement + animation + camera follow ──
  let speed = 0, walkCycle = 0, prevHeading = startYaw, started = false;
  let vy = 0, jumpQueued = false;
  const L = (a, b, t) => a + (b - a) * t;
  const DEAD = 0.1;

  const beforeRender = () => {
    const time = performance.now() / 1000;
    const inp = inputRef?.current;
    const jx = inp && Math.abs(inp.mx) > DEAD ? inp.mx : 0;
    const jy = inp && Math.abs(inp.my) > DEAD ? inp.my : 0;

    // Turn: A / joystick-left = turn left; D / joystick-right = turn right.
    // Babylon is left-handed, so turning is negated vs the right-handed
    // reference: D / joystick-right turn clockwise, A / joystick-left counter.
    const turnInput = (inputMap['a'] || inputMap['arrowleft'] ? 1 : 0)
      - (inputMap['d'] || inputMap['arrowright'] ? 1 : 0) - jx;
    heading -= turnInput * TURN;

    // Forward / back (analog). Joystick up (my<0) = forward.
    const kFwd = (inputMap['w'] || inputMap['arrowup'] ? 1 : 0) - (inputMap['s'] || inputMap['arrowdown'] ? 1 : 0);
    const fwdInput = Math.max(-1, Math.min(1, kFwd - jy));
    const run = inputMap['shift'] ? RUN_MULT : 1;
    const targetSpeed = (fwdInput >= 0 ? fwdInput * MAX_SPEED : fwdInput * MAX_BACK) * run;
    const hasInput = Math.abs(fwdInput) > 0.05;
    speed += (targetSpeed - speed) * (hasInput ? 0.2 : 0.14);
    if (Math.abs(speed) < 0.0005) speed = 0;

    // Vertical: jump + gravity (ground check off the resting collider height).
    const grounded = player.position.y <= GROUND_Y + 0.06;
    if (jumpQueued && grounded) vy = JUMP_V;
    jumpQueued = false;
    vy = (grounded && vy <= 0) ? -0.12 : vy - GRAV;

    // Move along facing, sliding off walls.
    const f = new B.Vector3(Math.sin(heading), 0, Math.cos(heading));
    const mv = Math.abs(speed) > 0.0005;
    if (gridCollide) {
      // Cheap grid-based walls: try each axis separately so you slide along
      // corridors. Gravity/jump applied directly, floor clamped to GROUND_Y.
      const sx = mv ? f.x * speed : 0;
      const sz = mv ? f.z * speed : 0;
      if (sx && !gridCollide(player.position.x + sx, player.position.z)) player.position.x += sx;
      if (sz && !gridCollide(player.position.x, player.position.z + sz)) player.position.z += sz;
      player.position.y += vy;
      if (player.position.y < GROUND_Y) player.position.y = GROUND_Y;
    } else {
      player.moveWithCollisions(new B.Vector3(mv ? f.x * speed : 0, vy, mv ? f.z * speed : 0));
    }

    // Drive the rig: face heading, animate the walk cycle.
    rig.root.rotation.y = heading;
    const moving = Math.abs(speed) > 0.002;
    if (moving) walkCycle += Math.abs(speed) * 2.6;
    let yawVel = heading - prevHeading;
    if (yawVel > Math.PI) yawVel -= Math.PI * 2;
    if (yawVel < -Math.PI) yawVel += Math.PI * 2;
    prevHeading = heading;
    rig.update(moving, walkCycle, time, yawVel);
    dust.rate(moving);

    // Chase camera: offset behind+above, rotated to the facing, clamped to the
    // room so it never slips through a wall and shows the void.
    const sinH = Math.sin(heading), cosH = Math.cos(heading);
    const px = player.position.x, pz = player.position.z;
    let ix = px - camDist * sinH, iz = pz - camDist * cosH;
    if (bounds) {
      const m = 0.6;
      ix = Math.max(-bounds.hw + m, Math.min(bounds.hw - m, ix));
      iz = Math.max(-bounds.hd + m, Math.min(bounds.hd - m, iz));
    }
    // GTA-style camera collision: march from the player toward the ideal spot
    // and stop at the last wall-free point, so the camera hugs corridors and
    // never slips behind a wall. Only active when the room supplies gridCollide.
    if (gridCollide) {
      let cx = px, cz = pz;
      for (let s = 1; s <= 8; s++) {
        const t = s / 8;
        const tx = px + (ix - px) * t, tz = pz + (iz - pz) * t;
        if (gridCollide(tx, tz)) break;
        cx = tx; cz = tz;
      }
      ix = cx; iz = cz;
    }
    const ideal = new B.Vector3(ix, camHeight, iz);
    if (!started) { camera.position.copyFrom(ideal); started = true; }
    else camera.position = B.Vector3.Lerp(camera.position, ideal, 0.12);
    camera.setTarget(new B.Vector3(px, camLookY, pz));
  };
  scene.registerBeforeRender(beforeRender);

  return {
    camera,
    player,
    kit,
    shadowGenerator,
    keyLight: dir,
    jump() { jumpQueued = true; },
    // Ray from the character's chest in the direction it's facing.
    getForwardRay(length = 4) {
      const origin = player.position.clone();
      origin.y -= 0.4;
      const f = new B.Vector3(Math.sin(heading), 0, Math.cos(heading));
      return new B.Ray(origin, f, length);
    },
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      scene.unregisterBeforeRender(beforeRender);
      camera.dispose();
    },
  };
}
