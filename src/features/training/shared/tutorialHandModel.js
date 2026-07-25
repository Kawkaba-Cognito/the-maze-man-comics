import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { assetUrl } from '../../../lib/assetUrl';

/*
 * The tutorial-pointer hand — a Meshy image-to-3D export. Unlike Dr Kawkab's
 * biped, this GLB has NO skeleton/animation: it's one static rigid mesh,
 * already posed pointing. Guided tutorials animate it purely via transform
 * (position/rotation/scale tween in TutorialHand3D), so instancing only
 * needs a plain Object3D clone — no SkeletonUtils involved.
 */

const MODEL_URL = assetUrl('Assets/tutorial-hand-v1.glb');
let sourcePromise = null;

export function preloadTutorialHand() {
  if (!sourcePromise) {
    sourcePromise = new Promise((resolve, reject) => {
      new GLTFLoader().load(MODEL_URL, resolve, undefined, reject);
    }).catch((error) => {
      sourcePromise = null;
      throw error;
    });
  }
  return sourcePromise;
}

export async function createTutorialHandInstance() {
  const source = await preloadTutorialHand();
  return source.scene.clone(true);
}
