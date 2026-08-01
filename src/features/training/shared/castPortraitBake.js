/*
 * castPortraitBake — the 3D cast, as still portraits you can put anywhere in the DOM.
 *
 * ⚠ Named ...Bake, not castPortrait, ON PURPOSE. Its React wrapper is
 * CastPortrait.jsx, and two files whose names differ only by CASE are the same
 * file on Windows and macOS but two files on the Linux CI/Pages box. The first
 * cut here was exactly that, and `import CastPortrait from './CastPortrait'`
 * silently resolved to this module instead — "does not provide an export named
 * 'default'", and lazyWithRetry then reloaded the app in a loop. Same class of
 * bug as the `assetsDir: 'Assets'` note in CLAUDE.md.
 *
 * Detective's case files and person lists showed suspects as EMOJI, while the
 * app already owned six rigged characters that the noir path renders properly.
 * The emoji were the single loudest "unfinished" signal in the game. This
 * module closes that gap without asking every list item to become a 3D scene.
 *
 * ── Why bake to an image instead of rendering live ────────────────────────
 * A case file shows 3-6 people at once, and a browser hard-caps concurrent
 * WebGL contexts (~16 in Chrome, and it silently kills the OLDEST context when
 * you pass it — which would take out the game's real 3D scene, not the
 * portrait). So one shared renderer draws each character ONCE, hands back a
 * PNG data URL, and the DOM gets a plain <img>. Portraits then cost nothing to
 * scroll, survive re-mounts, and cannot evict a live scene.
 *
 * Cached per (id, size): a case re-entered is free, and the shared clip library
 * plus each GLB are already cached by castModels.
 *
 * ⚠ Framing is computed from RIG_HEIGHT, never from Box3 on the mesh. These are
 * skinned meshes and their bounding box reports the BIND pose, which is not
 * where the character actually is once a clip is applied.
 */
import * as THREE from 'three';
import { createCharacter } from './castModels';
import { RIG_HEIGHT } from './castRoster';

/** id|size -> Promise<dataURL>. */
const cache = new Map();

let renderer = null;

/** One renderer for every portrait ever baked; created on first use. */
function getRenderer(size) {
  if (!renderer) {
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setPixelRatio(1);
    } catch {
      return null;
    }
  }
  renderer.setSize(size, size, false);
  return renderer;
}

/**
 * A head-and-shoulders crop of one cast member.
 *
 * @param {string} id cast id (see CAST in castRoster)
 * @param {{ size?: number, turn?: number }} [opts]
 *   size  square px of the baked image
 *   turn  yaw in radians, so a line-up is not six identical front-on stares
 * @returns {Promise<string|null>} a PNG data URL, or null if WebGL is unavailable
 */
export function getCastPortrait(id, opts = {}) {
  const size = opts.size ?? 256;
  const turn = opts.turn ?? 0;
  const key = `${id}|${size}|${turn.toFixed(2)}`;
  if (cache.has(key)) return cache.get(key);

  const p = bake(id, size, turn).catch(() => null);
  cache.set(key, p);
  return p;
}

async function bake(id, size, turn) {
  const gl = getRenderer(size);
  if (!gl) return null;

  const character = await createCharacter(id, { seedIndex: 0 });

  const scene = new THREE.Scene();
  scene.add(character.root);
  character.root.rotation.y = turn;

  // Soft three-point light. The portrait is a cutout on a card, so it wants
  // shape and a warm key rather than the scene lighting of a room it is not in.
  scene.add(new THREE.AmbientLight(0xffffff, 1.15));
  const key = new THREE.DirectionalLight(0xfff3e2, 1.5);
  key.position.set(1.6, 2.4, 2.2);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xbcd4ee, 0.75);
  rim.position.set(-2, 1.2, -1.4);
  scene.add(rim);

  /* Head and shoulders, framed off RIG_HEIGHT rather than measured bounds —
   * see the Box3 warning at the top of this file.
   *
   * 0.70, not the 0.82 you would compute for a realistic figure: this cast is
   * stylised with oversized heads, so the FACE sits well below the crown. At
   * 0.82 every portrait was a study of the top of someone's hair. */
  /*
   * Aim from the SKELETON, not from a bounding box.
   *
   * The rigs are not centred on x=0 — Lola's head sat right of centre and a
   * tight crop cut it in half — and Box3 cannot find the offset because a
   * skinned mesh reports its BIND pose, not where the character actually is.
   * Bones, however, ARE posed. Averaging bone world positions gives the real
   * horizontal centre, and the highest bone gives the real head height, so this
   * frames every character correctly regardless of how its export was authored.
   *
   * Falls back to the RIG_HEIGHT estimate if a model has no skeleton.
   */
  /* Settle the rig into its idle BEFORE measuring. Bones only tell the truth
   * once a clip has been applied — measuring first reads the bind pose, which
   * is the very thing this approach exists to avoid. */
  for (let i = 0; i < 30; i++) character.update(1 / 60, i * 16.7);

  const bones = [];
  character.root.updateWorldMatrix(true, true);
  character.root.traverse((o) => {
    if (o.isBone) bones.push(o);
  });

  let centreX = 0;
  let headY = RIG_HEIGHT * 0.82;
  if (bones.length) {
    const p = new THREE.Vector3();
    let sumX = 0;
    let maxY = -Infinity;
    for (const b of bones) {
      b.getWorldPosition(p);
      sumX += p.x;
      if (p.y > maxY) maxY = p.y;
    }
    centreX = sumX / bones.length;
    headY = maxY;
  }
  // Just below the crown, so the frame holds head and shoulders rather than
  // hair and sky.
  const faceY = headY * 0.86;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 20);
  camera.position.set(centreX, faceY, RIG_HEIGHT * 1.7);
  camera.lookAt(centreX, faceY, 0);


  gl.render(scene, camera);
  const url = gl.domElement.toDataURL('image/png');

  character.dispose();
  scene.clear();
  return url;
}

/** Free the shared renderer. Portraits already baked stay valid — they are images. */
export function disposeCastPortraits() {
  renderer?.dispose();
  renderer = null;
}
