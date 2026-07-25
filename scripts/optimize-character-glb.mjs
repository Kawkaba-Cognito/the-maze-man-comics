/*
 * optimize-character-glb — make a Meshy character export shippable.
 *
 * Raw Meshy bipeds arrive at ~30 MB: one 20–25 MB PNG plus 110k–145k vertices.
 * For reference the mascot this app already ships (biped-v1.glb) is 3.4 MB at
 * ~10k verts, so raw exports are both a download problem and a GPU problem —
 * the detective interrogation puts five skinned characters on screen at once.
 *
 * Three passes, no network needed:
 *   1. resize every embedded texture with sharp (PNG in → PNG out; WebP
 *      textures have bitten this project before, don't switch)
 *   2. decimate every mesh with meshoptimizer, then compact unused vertices
 *   3. optionally drop the clips, which live in the shared cast clip library
 *      instead (see build-clip-library.mjs — one skeleton, whole cast)
 *
 *   node scripts/optimize-character-glb.mjs <in.glb> <out.glb>
 *        [--verts N] [--px N] [--strip-animations]
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { MeshoptSimplifier } from 'meshoptimizer';
import {
  readGlb, writeGlb, readAccessor, BufferBuilder, NUM, mb,
} from './lib/glb.mjs';

async function resizeImages(json, bin, maxPx) {
  const out = new Map();
  for (const img of json.images || []) {
    if (img.bufferView == null) continue;
    const view = json.bufferViews[img.bufferView];
    const src = bin.subarray(view.byteOffset || 0, (view.byteOffset || 0) + view.byteLength);
    const meta = await sharp(src).metadata();
    if (Math.max(meta.width || 0, meta.height || 0) <= maxPx) {
      out.set(img, Buffer.from(src));
      continue;
    }
    out.set(img, await sharp(src)
      .resize({ width: maxPx, height: maxPx, fit: 'inside', withoutEnlargement: true })
      .png({ compressionLevel: 9, effort: 10 })
      .toBuffer());
    img.mimeType = 'image/png';
  }
  return out;
}

/**
 * Decimate one primitive. meshoptimizer returns a new index buffer over the
 * ORIGINAL vertices, so every attribute (normals, UVs, joints, weights) stays
 * valid — we just drop the vertices no surviving triangle references.
 */
function simplifyPrimitive(data, json, prim, targetVerts) {
  const pos = data.get(prim.attributes.POSITION);
  const idx = data.get(prim.indices);
  const vertCount = pos.length / 3;
  if (vertCount <= targetVerts) return;

  const target = Math.max(3, Math.floor((idx.length * (targetVerts / vertCount)) / 3) * 3);
  const [simplified] = MeshoptSimplifier.simplify(
    new Uint32Array(idx), new Float32Array(pos), 3, target, 0.05,
  );

  const remap = new Int32Array(vertCount).fill(-1);
  let next = 0;
  for (const v of simplified) if (remap[v] === -1) remap[v] = next++;

  for (const accIndex of Object.values(prim.attributes)) {
    const src = data.get(accIndex);
    const n = NUM[json.accessors[accIndex].type];
    const dst = new src.constructor(next * n);
    for (let v = 0; v < vertCount; v++) {
      if (remap[v] === -1) continue;
      for (let c = 0; c < n; c++) dst[remap[v] * n + c] = src[v * n + c];
    }
    data.set(accIndex, dst);
  }

  const newIdx = new Uint32Array(simplified.length);
  for (let i = 0; i < simplified.length; i++) newIdx[i] = remap[simplified[i]];
  data.set(prim.indices, newIdx);
}

async function optimize(inFile, outFile, { verts, px, strip }) {
  const { json, bin } = readGlb(inFile);
  await MeshoptSimplifier.ready;

  const images = await resizeImages(json, bin, px);
  if (strip) json.animations = [];

  // Pull every accessor into memory up front; from here the source bin is dead.
  const data = new Map();
  (json.accessors || []).forEach((_, i) => data.set(i, readAccessor(json, bin, i)));

  const countVerts = () => (json.meshes || []).reduce((n, m) => n
    + m.primitives.reduce((k, p) => k + json.accessors[p.attributes.POSITION].count, 0), 0);
  const beforeVerts = countVerts();

  // Shared attribute accessors would break the per-primitive remap, so only
  // simplify primitives that own their vertex data outright.
  const uses = new Map();
  (json.meshes || []).forEach((m) => m.primitives.forEach((p) => {
    Object.values(p.attributes).forEach((a) => uses.set(a, (uses.get(a) || 0) + 1));
  }));

  for (const mesh of json.meshes || []) {
    for (const prim of mesh.primitives) {
      if (prim.indices == null || prim.targets) continue;
      if (Object.values(prim.attributes).some((a) => uses.get(a) > 1)) continue;
      simplifyPrimitive(data, json, prim, verts);
    }
  }

  // Drop accessors nothing references any more (stripped animation tracks).
  const live = new Set();
  (json.meshes || []).forEach((m) => m.primitives.forEach((p) => {
    if (p.indices != null) live.add(p.indices);
    Object.values(p.attributes).forEach((a) => live.add(a));
  }));
  (json.skins || []).forEach((s) => { if (s.inverseBindMatrices != null) live.add(s.inverseBindMatrices); });
  (json.animations || []).forEach((a) => a.samplers.forEach((s) => { live.add(s.input); live.add(s.output); }));

  const indexAccessors = new Set();
  const attrAccessors = new Set();
  (json.meshes || []).forEach((m) => m.primitives.forEach((p) => {
    if (p.indices != null) indexAccessors.add(p.indices);
    Object.values(p.attributes).forEach((a) => attrAccessors.add(a));
  }));

  // Rebuild: one tightly packed bufferView per accessor, images after them.
  const builder = new BufferBuilder();
  const remapAcc = new Map();
  const accessors = [];

  (json.accessors || []).forEach((acc, i) => {
    if (!live.has(i)) return;
    let out = data.get(i);
    const n = NUM[acc.type];
    const next = { ...acc, count: out.length / n };
    delete next.byteOffset;

    // Index buffers drop to 16-bit whenever the vertex count allows it.
    if (indexAccessors.has(i) && next.componentType === 5125) {
      let max = 0;
      for (const v of out) if (v > max) max = v;
      if (max < 65536) { out = new Uint16Array(out); next.componentType = 5123; }
    }

    if (next.min && acc.type === 'VEC3') {
      const min = [Infinity, Infinity, Infinity];
      const max = [-Infinity, -Infinity, -Infinity];
      for (let v = 0; v < next.count; v++) {
        for (let c = 0; c < 3; c++) {
          const x = out[v * 3 + c];
          if (x < min[c]) min[c] = x;
          if (x > max[c]) max[c] = x;
        }
      }
      next.min = min;
      next.max = max;
    }

    const target = indexAccessors.has(i) ? 34963 : attrAccessors.has(i) ? 34962 : undefined;
    next.bufferView = builder.push(
      Buffer.from(out.buffer, out.byteOffset, out.byteLength),
      target ? { target } : {},
    );
    remapAcc.set(i, accessors.length);
    accessors.push(next);
  });

  const fix = (i) => remapAcc.get(i);
  (json.meshes || []).forEach((m) => m.primitives.forEach((p) => {
    if (p.indices != null) p.indices = fix(p.indices);
    Object.keys(p.attributes).forEach((k) => { p.attributes[k] = fix(p.attributes[k]); });
  }));
  (json.skins || []).forEach((s) => {
    if (s.inverseBindMatrices != null) s.inverseBindMatrices = fix(s.inverseBindMatrices);
  });
  (json.animations || []).forEach((a) => a.samplers.forEach((s) => {
    s.input = fix(s.input);
    s.output = fix(s.output);
  }));

  json.accessors = accessors;
  (json.images || []).forEach((img) => {
    if (img.bufferView == null) return;
    img.bufferView = builder.push(images.get(img));
  });

  json.bufferViews = builder.views;
  const nextBin = builder.finish();
  json.buffers = [{ byteLength: nextBin.length }];

  const size = writeGlb(outFile, json, nextBin);
  console.log(`${path.basename(outFile).padEnd(20)} ${mb(fs.statSync(inFile).size)}MB → ${mb(size)}MB   verts ${beforeVerts} → ${countVerts()}   clips ${(json.animations || []).length}`);
}

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(name);
  return i === -1 ? dflt : Number(args[i + 1]);
};
const files = args.filter((a, i) => !a.startsWith('--')
  && !(i > 0 && args[i - 1].startsWith('--') && !Number.isNaN(Number(a))));
const [inFile, outFile] = files;
if (!inFile || !outFile) {
  console.error('usage: node scripts/optimize-character-glb.mjs <in.glb> <out.glb> [--verts N] [--px N] [--strip-animations]');
  process.exit(1);
}
await optimize(inFile, outFile, {
  verts: flag('--verts', 16000),
  px: flag('--px', 1024),
  strip: args.includes('--strip-animations'),
});
