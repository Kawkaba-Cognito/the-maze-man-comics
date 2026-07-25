/*
 * build-clip-library — pool every animation in the cast into one shared GLB.
 *
 * Every character in the detective cast (Dr Kawkab aside, he is unrigged) came
 * out of Meshy on the SAME 24-joint skeleton — Hips/LeftUpLeg/… under an
 * `Armature` root — and every clip targets those bones by name. So a clip
 * authored against one character drives any of them: three.js resolves
 * animation tracks by node name, not by identity.
 *
 * That matters because the individual exports are missing what an interrogation
 * needs. Lola and Fadi ship no standing idle at all; nobody but the old mascot
 * has a "caught out" gesture. Pooling gives every character the full vocabulary
 * and lets the per-character files drop their own copies.
 *
 * Output is skeleton + animations only: no meshes, skins, materials or images.
 *
 *   node scripts/build-clip-library.mjs <out.glb> <source.glb...>
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  readGlb, writeGlb, readAccessor, BufferBuilder, NUM, COMP, mb,
} from './lib/glb.mjs';

function buildLibrary(outFile, sources, only) {
  // The first source defines the skeleton every clip is expressed against.
  const base = readGlb(sources[0]);
  const json = base.json;

  // Strip everything that isn't the node hierarchy.
  const keptNodes = json.nodes.map((n) => {
    const { mesh, skin, ...rest } = n;
    return rest;
  });
  json.nodes = keptNodes;
  delete json.meshes;
  delete json.skins;
  delete json.materials;
  delete json.textures;
  delete json.images;
  delete json.samplers;
  delete json.extensionsUsed;
  delete json.extensionsRequired;
  json.accessors = [];
  json.animations = [];

  const nodeByName = new Map();
  json.nodes.forEach((n, i) => { if (n.name) nodeByName.set(n.name, i); });

  const builder = new BufferBuilder();
  const seen = new Set();
  const report = [];

  for (const src of sources) {
    const { json: sj, bin: sbin } = readGlb(src);
    for (const anim of sj.animations || []) {
      // Meshy sometimes exports "Armature|Idle_02|baselayer" — keep the middle.
      const name = anim.name.includes('|') ? anim.name.split('|')[1] : anim.name;
      if (seen.has(name)) continue;
      if (only && !only.has(name)) continue;

      // Only take clips whose every target bone exists in the base skeleton.
      const targets = anim.channels.map((c) => sj.nodes[c.target.node]?.name);
      if (targets.some((t) => !t || !nodeByName.has(t))) continue;

      const samplers = anim.samplers.map((s) => {
        const input = readAccessor(sj, sbin, s.input);
        const output = readAccessor(sj, sbin, s.output);
        const inAcc = sj.accessors[s.input];
        const outAcc = sj.accessors[s.output];
        let min = Infinity;
        let max = -Infinity;
        for (const v of input) { if (v < min) min = v; if (v > max) max = v; }
        return {
          input: builder.pushAccessor(json, new Float32Array(input), 'SCALAR', 5126,
            { min: [min], max: [max] }),
          output: builder.pushAccessor(json, new Float32Array(output), outAcc.type, 5126),
          interpolation: s.interpolation || 'LINEAR',
          _frames: inAcc.count,
        };
      });

      json.animations.push({
        name,
        samplers: samplers.map(({ input, output, interpolation }) => ({ input, output, interpolation })),
        channels: anim.channels.map((c) => ({
          sampler: c.sampler,
          target: { node: nodeByName.get(sj.nodes[c.target.node].name), path: c.target.path },
        })),
      });
      seen.add(name);
      report.push(`${name} (${path.basename(src).split('-')[0]})`);
    }
  }

  json.bufferViews = builder.views;
  const bin = builder.finish();
  json.buffers = [{ byteLength: bin.length }];

  const size = writeGlb(outFile, json, bin);
  console.log(`${path.basename(outFile)}  ${mb(size)}MB  ${json.animations.length} clips`);
  report.forEach((r) => console.log(`   · ${r}`));
}

const args = process.argv.slice(2);
const onlyAt = args.indexOf('--only');
const only = onlyAt === -1 ? null : new Set(args[onlyAt + 1].split(','));
const rest = onlyAt === -1 ? args : [...args.slice(0, onlyAt), ...args.slice(onlyAt + 2)];
const [outFile, ...sources] = rest;
if (!outFile || !sources.length) {
  console.error('usage: node scripts/build-clip-library.mjs <out.glb> <source.glb...> [--only a,b,c]');
  process.exit(1);
}
buildLibrary(outFile, sources, only);
