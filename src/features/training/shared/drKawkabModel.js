import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { assetUrl } from '../../../lib/assetUrl';

const MODEL_URL = assetUrl('Assets/biped-v1.glb');
let sourcePromise = null;

export function preloadDrKawkab() {
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

export async function createDrKawkabInstance() {
  const source = await preloadDrKawkab();
  const box = new THREE.Box3().setFromObject(source.scene);
  return {
    scene: cloneSkeleton(source.scene),
    animations: source.animations || [],
    bounds: {
      size: box.getSize(new THREE.Vector3()),
      center: box.getCenter(new THREE.Vector3()),
      min: box.min.clone(),
    },
  };
}

export function disposeDrKawkabInstance(scene) {
  scene?.removeFromParent();
}
