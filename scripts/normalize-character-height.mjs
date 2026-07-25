/*
 * normalize-character-height — bake a character's stage height into the GLB.
 *
 * The cast arrives at wildly different authored sizes (the Meshy rigs sit under
 * an Armature scaled to 0.01; the robot is scale 1). Correcting that at runtime
 * means scaling a loaded GLTF root, which for SKINNED meshes fights the
 * skinning path — the bind matrices and the bone world matrices disagree, so
 * the bounding box says one size and the GPU draws another. Unrigged meshes are
 * unaffected, which is exactly the split we saw on the interrogation stage.
 *
 * So: compute the bind-pose height here, rewrite the root node's scale, and let
 * the app load every character at its natural size with no runtime scaling.
 *
 *   node scripts/normalize-character-height.mjs <file.glb> <targetHeight>
 */
import { readGlb, writeGlb, NUM } from './lib/glb.mjs';
import path from 'node:path';

/** Compose a node's local TRS into a 4x4 (column-major, gl-matrix order). */
function nodeMatrix(node) {
  if (node.matrix) return node.matrix.slice();
  const [tx, ty, tz] = node.translation || [0, 0, 0];
  const [qx, qy, qz, qw] = node.rotation || [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale || [1, 1, 1];
  const x2 = qx + qx; const y2 = qy + qy; const z2 = qz + qz;
  const xx = qx * x2; const xy = qx * y2; const xz = qx * z2;
  const yy = qy * y2; const yz = qy * z2; const zz = qz * z2;
  const wx = qw * x2; const wy = qw * y2; const wz = qw * z2;
  return [
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ];
}

function multiply(a, b) {
  const out = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] = a[r] * b[c * 4]
        + a[4 + r] * b[c * 4 + 1]
        + a[8 + r] * b[c * 4 + 2]
        + a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

const applyY = (m, x, y, z) => m[1] * x + m[5] * y + m[9] * z + m[13];

/** Bind-pose vertical extent of every mesh in the scene, in scene space. */
function measureHeight(json) {
  let min = Infinity;
  let max = -Infinity;

  const walk = (nodeIndex, parent) => {
    const node = json.nodes[nodeIndex];
    const world = multiply(parent, nodeMatrix(node));
    if (node.mesh != null) {
      for (const prim of json.meshes[node.mesh].primitives) {
        const acc = json.accessors[prim.attributes.POSITION];
        if (!acc?.min || !acc?.max || NUM[acc.type] !== 3) continue;
        // Every corner of the AABB — a rotated node makes the naive pair wrong.
        for (let i = 0; i < 8; i++) {
          const y = applyY(
            world,
            (i & 1) ? acc.max[0] : acc.min[0],
            (i & 2) ? acc.max[1] : acc.min[1],
            (i & 4) ? acc.max[2] : acc.min[2],
          );
          if (y < min) min = y;
          if (y > max) max = y;
        }
      }
    }
    (node.children || []).forEach((c) => walk(c, world));
  };

  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  (json.scenes[json.scene ?? 0].nodes || []).forEach((n) => walk(n, identity));
  return { min, max, height: max - min };
}

function normalize(file, target) {
  const { json, bin } = readGlb(file);
  const before = measureHeight(json);
  if (!(before.height > 0.00001)) throw new Error(`${file}: could not measure a height`);

  const factor = target / before.height;
  const roots = json.scenes[json.scene ?? 0].nodes || [];
  for (const index of roots) {
    const node = json.nodes[index];
    if (node.matrix) {
      // Scale the linear part; leave translation to be scaled too.
      for (let i = 0; i < 12; i++) node.matrix[i] *= factor;
      node.matrix[12] *= factor;
      node.matrix[13] *= factor;
      node.matrix[14] *= factor;
    } else {
      const s = node.scale || [1, 1, 1];
      node.scale = [s[0] * factor, s[1] * factor, s[2] * factor];
      if (node.translation) {
        node.translation = node.translation.map((v) => v * factor);
      }
    }
  }

  const after = measureHeight(json);
  writeGlb(file, json, bin);
  console.log(`${path.basename(file).padEnd(20)} height ${before.height.toFixed(3)} → ${after.height.toFixed(3)}  (feet y=${after.min.toFixed(3)})`);
}

const [, , file, targetArg] = process.argv;
if (!file || !targetArg) {
  console.error('usage: node scripts/normalize-character-height.mjs <file.glb> <targetHeight>');
  process.exit(1);
}
normalize(file, Number(targetArg));
