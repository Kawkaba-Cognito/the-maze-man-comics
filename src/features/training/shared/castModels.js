import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { assetUrl } from '../../../lib/assetUrl';
import { CAST, ACTIONS, RIG_HEIGHT } from './castRoster';

export { CAST, ACTIONS, CAST_IDS, SUSPECT_IDS } from './castRoster';

/*
 * The detective cast — Dr Kawkab and the five suspects — as loadable 3D actors.
 *
 * Every rigged character shares one 24-joint skeleton, so animation clips are
 * interchangeable: rather than each model carrying its own (incomplete) set,
 * the clips live in a single shared library and drive whoever needs them.
 * That is the only reason Lola and Fadi can stand still at all — neither export
 * shipped a standing idle.
 *
 * Dr Kawkab is the exception: his model has no skeleton, so he gets procedural
 * motion instead of clips. See ACTIONS below for the vocabulary either kind of
 * character understands.
 */

const CLIP_LIBRARY_URL = assetUrl('Assets/cast-clips-v1.glb');

const gltfCache = new Map();
let clipsPromise = null;

function loadGltf(url) {
  if (!gltfCache.has(url)) {
    const p = new Promise((resolve, reject) => {
      new GLTFLoader().load(assetUrl(url), resolve, undefined, reject);
    }).catch((err) => { gltfCache.delete(url); throw err; });
    gltfCache.set(url, p);
  }
  return gltfCache.get(url);
}

/** The shared clip library — one fetch, reused by every character on stage. */
export function preloadCastClips() {
  if (!clipsPromise) {
    clipsPromise = new Promise((resolve, reject) => {
      new GLTFLoader().load(CLIP_LIBRARY_URL, resolve, undefined, reject);
    })
      .then((gltf) => gltf.animations)
      .catch((err) => { clipsPromise = null; throw err; });
  }
  return clipsPromise;
}

/** Warm the cache for a scene before it is shown, so nobody pops in late. */
export function preloadCast(ids) {
  return Promise.all([
    preloadCastClips(),
    ...ids.map((id) => loadGltf(CAST[id].url)),
  ]);
}

/**
 * One character on stage. Wraps the mixer so callers speak in beats
 * ("concede", "deny") rather than clip names, and so the unrigged Dr Kawkab
 * can answer the same calls with procedural motion.
 */
class Character {
  constructor(id, scene, clips) {
    this.id = id;
    this.rigged = CAST[id].rigged;
    this.root = new THREE.Group();
    this.model = scene;
    this.root.add(scene);

    // NOTHING is scaled here, and rigged models are not measured either.
    //
    // Scaling a loaded skinned GLTF desynchronises the bone world matrices from
    // their inverse bind matrices, and the two disagree about size by the
    // armature's own scale — the model draws ~158x larger than its bounding box
    // claims. For the same reason Box3 UNDER-reports a rigged character by 100x:
    // it measures the bind pose through the armature's 0.01 scale, which the
    // skinning path cancels out. So rigged characters are taken on trust: every
    // rig in the cast is authored feet-at-origin and RIG_HEIGHT tall.
    //
    // Unrigged models have no such problem and are measured normally.
    if (this.rigged) {
      this.height = RIG_HEIGHT;
      this.baseY = 0;
    } else {
      const box = new THREE.Box3().setFromObject(scene);
      scene.position.y -= box.min.y;
      scene.position.x -= (box.min.x + box.max.x) / 2;
      scene.position.z -= (box.min.z + box.max.z) / 2;
      this.height = box.max.y - box.min.y;
      // Resting offset, so the procedural float below adds to the floor
      // alignment instead of replacing it.
      this.baseY = scene.position.y;
    }

    this.byName = new Map();
    (clips || []).forEach((c) => this.byName.set(c.name, c));
    this.mixer = this.rigged ? new THREE.AnimationMixer(scene) : null;
    this.current = null;
    this.idleName = null;

    // Procedural life: the base layer for Dr Kawkab, and a gentle overlay that
    // keeps everyone from looking welded to the floor between clips.
    this.phase = Math.random() * Math.PI * 2;
    this.turn = 0;
    this.targetTurn = 0;
    this.emphasis = 0;
  }

  /** Pick a stable idle for this character so the cast isn't synchronised. */
  setIdlePool(seedIndex = 0) {
    const pool = ACTIONS.idle.filter((n) => this.byName.has(n));
    this.idleName = pool.length ? pool[seedIndex % pool.length] : null;
    return this.idleName;
  }

  play(action, { loop = false, fade = 0.28 } = {}) {
    // Unrigged characters express beats as a motion impulse instead.
    if (!this.mixer) {
      this.emphasis = action === 'idle' ? 0 : 1;
      return null;
    }
    const names = action === 'idle' && this.idleName
      ? [this.idleName]
      : (ACTIONS[action] || [action]);
    const name = names.find((n) => this.byName.has(n));
    if (!name) return null;

    const next = this.mixer.clipAction(this.byName.get(name));
    if (this.current && this.current.getClip().name === name && next.isRunning()) return next;

    next.reset();
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    next.clampWhenFinished = !loop;
    next.enabled = true;
    if (this.current && this.current !== next) {
      next.crossFadeFrom(this.current, fade, false);
      next.play();
    } else {
      next.fadeIn(fade).play();
    }
    this.current = next;
    return next;
  }

  /** Play a one-shot beat, then settle back into the idle. */
  react(action) {
    const act = this.play(action, { loop: false });
    if (!act || !this.mixer) return;
    const done = (e) => {
      if (e.action !== act) return;
      this.mixer.removeEventListener('finished', done);
      this.play('idle', { loop: true, fade: 0.35 });
    };
    this.mixer.addEventListener('finished', done);
  }

  lookAt(turn) { this.targetTurn = turn; }

  update(dt, now) {
    this.mixer?.update(dt);
    this.turn += (this.targetTurn - this.turn) * Math.min(1, dt * 4);
    this.root.rotation.y = this.turn;

    if (!this.rigged) {
      // Dr Kawkab hovers and leans; the emphasis impulse gives him a "beat".
      const t = now * 0.001 + this.phase;
      this.emphasis = Math.max(0, this.emphasis - dt * 1.6);
      this.model.position.y = this.baseY + Math.sin(t * 1.3) * 0.055 + this.emphasis * 0.12;
      this.model.rotation.z = Math.sin(t * 0.9) * 0.03 - this.emphasis * 0.06;
    }
  }

  dispose() {
    this.mixer?.stopAllAction();
    this.mixer?.uncacheRoot(this.model);
    this.root.removeFromParent();
  }
}

/**
 * Build one character. `bob` is the model's resting Y offset, kept separate
 * from the animated bob so callers can float Dr Kawkab without fighting it.
 */
export async function createCharacter(id, { seedIndex = 0 } = {}) {
  const def = CAST[id];
  if (!def) throw new Error(`unknown cast member: ${id}`);
  const [gltf, clips] = await Promise.all([loadGltf(def.url), preloadCastClips()]);

  const scene = cloneSkeleton(gltf.scene);
  scene.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = false;
    o.receiveShadow = false;
    o.frustumCulled = false; // skinned bounds go stale mid-clip
  });

  const character = new Character(id, scene, def.rigged ? clips : []);
  if (def.rigged) {
    character.setIdlePool(seedIndex);
    character.play('idle', { loop: true, fade: 0 });
  }
  return character;
}
