/*
 * rebuild-shape-pools.mjs — make every level pool readable as illustrations.
 *
 * ── The problem ──
 * The pools were authored to grade difficulty by SILHOUETTE similarity: harder
 * levels added a near-twin outline (ovalH/ovalV beside circle, triR/triFlat
 * beside triangle). Once the shapes are drawn as objects those twins become
 * several planets, or several rockets, on one board — and an illustration's
 * difference lives in interior detail, which peripheral vision cannot resolve.
 * The board stops being searchable and becomes a tile-by-tile inspection.
 *
 * That forced art off any board with a clash: 22 of 100 pools kept it, so
 * Survival swapped to flat shapes as you progressed and Levels never had them.
 *
 * ── Why this is safe to change ──
 * Shape similarity is NOT the engine's main difficulty lever, and the source
 * says so. getLvCfg() composes four independent levers:
 *
 *     grid          5 / 7 / 9                       (DM)
 *     time          sigmoid ramp per level          (sigmoidTime)
 *     interference  distractors sharing target HUE  (-> 1.0 on hard)
 *     conjunction   "the real difficulty lever for hard"
 *
 * Only the pool contributes similarity. Removing that one contribution leaves
 * three intact levers plus pool SIZE, which is heterogeneity — itself a
 * well-established driver of search difficulty (Duncan & Humphreys 1989).
 *
 * ── What this does ──
 * Keeps every pool's SIZE and the whole tier structure exactly as authored, so
 * timing, target counts, grid and the audit's curriculum checks are untouched.
 * Only WHICH shape fills each slot changes: no pool may contain two shapes from
 * the same motif family. Members rotate across pools so all 33 shape keys — and
 * therefore all 33 art assets — stay in use.
 *
 *     node scripts/rebuild-shape-pools.mjs [--check]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'src/features/training/shared/focusQuestData.js');
const ART = path.join(ROOT, 'src/features/training/shared/shapeArt.js');
const CHECK = process.argv.includes('--check');

const { SP } = await import(new URL('../src/features/training/shared/focusQuestData.js', import.meta.url).href);

/* Motif families, read from shapeArt.js so the two files cannot drift. */
const artSrc = fs.readFileSync(ART, 'utf8');
const MOTIF = {};
for (const m of artSrc.matchAll(/^\s*(\w+):\s*\{\s*file:\s*'[^']+',\s*motif:\s*'([^']+)'/gm)) {
  MOTIF[m[1]] = m[2];
}
const families = {};
for (const [key, motif] of Object.entries(MOTIF)) (families[motif] ||= []).push(key);

/*
 * Motif order. Deliberately not alphabetical: the first four are the objects a
 * new player meets on easy level 1, and they are the most unmistakable of the
 * set. Everything after is ordered so that consecutive picks stay visually
 * far apart rather than clustering (all the round things, then all the
 * pointed things).
 */
const MOTIF_ORDER = [
  'rocket', 'planet', 'crystal', 'satellite',
  'star', 'moon', 'comet', 'station',
  'helmet', 'portal', 'optics', 'probe',
  'nebula', 'solar', 'tower', 'capsule', 'base',
];
const missing = Object.keys(families).filter((m) => !MOTIF_ORDER.includes(m));
if (missing.length) throw new Error(`motif(s) absent from MOTIF_ORDER: ${missing.join(', ')}`);

/** Pool `poolIdx` of `tier`, `size` slots, all motifs distinct. */
function buildPool(tier, poolIdx, size, rotation) {
  if (size > MOTIF_ORDER.length) {
    throw new Error(`${tier}[${poolIdx}]: needs ${size} distinct motifs, only ${MOTIF_ORDER.length} exist`);
  }
  const out = [];
  for (let i = 0; i < size; i += 1) {
    // Rotate the starting motif per pool so pools are not all the same objects.
    const motif = MOTIF_ORDER[(rotation + i) % MOTIF_ORDER.length];
    const members = families[motif];
    /* Member index uses `rotation` ALONE, not `rotation + i`.
     *
     * Adding the slot index made a family's member depend on where it happened
     * to land in the pool, so easy level 1 opened with "horizontal exoplanet"
     * and "wide cosmic crystal" instead of the canonical ringed planet and
     * crystal cluster. Keying it to the pool alone means every family shows its
     * first member in the first pool, and later pools advance together. */
    out.push(members[rotation % members.length]);
  }
  return out;
}

const tiers = Object.keys(SP);
const next = {};
let rotation = 0;
for (const tier of tiers) {
  next[tier] = SP[tier].map((pool, i) => {
    const built = buildPool(tier, i, pool.length, rotation);
    /* Stride 1, not 3. The member index is `rotation % family.length`, and the
     * families have sizes 1, 2, 3 and 8 — a stride of 3 makes (3k) % 3 always 0,
     * so every three-member family (rocket, crystal) would have shown only its
     * first member and four art assets would have gone unused. Stride 1 is
     * co-prime with every family size, so all 33 keys get their turn. */
    rotation += 1;
    return built;
  });
}

/* ── Verify before writing ── */
const problems = [];
const used = new Set();
for (const tier of tiers) {
  next[tier].forEach((pool, i) => {
    if (pool.length !== SP[tier][i].length) problems.push(`${tier}[${i}]: size changed`);
    const motifs = pool.map((s) => MOTIF[s]);
    const dup = motifs.filter((m, j) => motifs.indexOf(m) !== j);
    if (dup.length) problems.push(`${tier}[${i}]: motif clash ${[...new Set(dup)].join(',')}`);
    if (new Set(pool).size !== pool.length) problems.push(`${tier}[${i}]: duplicate shape key`);
    pool.forEach((s) => used.add(s));
  });
}
const allKeys = Object.keys(MOTIF);
const unused = allKeys.filter((k) => !used.has(k));
if (unused.length) problems.push(`unused shape keys (their art would ship unreferenced): ${unused.join(', ')}`);

console.log(`pools: ${tiers.reduce((n, t) => n + next[t].length, 0)}`);
console.log(`shape keys used: ${used.size}/${allKeys.length}`);
console.log(`motif families: ${Object.keys(families).length}`);
if (problems.length) {
  console.error('\nPROBLEMS:');
  problems.forEach((p) => console.error('  ' + p));
  process.exit(1);
}
console.log('every pool is motif-distinct; sizes unchanged');

for (const tier of tiers) {
  console.log(`\n  ${tier}: L1 ${next[tier][0].join('+')}`);
  console.log(`  ${' '.repeat(tier.length)}  L20 ${next[tier][next[tier].length - 1].join('+')}`);
}

if (CHECK) process.exit(0);

/* ── Rewrite the SP literal in place ── */
let src = fs.readFileSync(DATA, 'utf8');
const start = src.indexOf('export const SP={');
if (start < 0) throw new Error('SP literal not found');
// Walk braces so the replacement cannot run past the object.
let depth = 0, end = -1;
for (let i = src.indexOf('{', start); i < src.length; i += 1) {
  if (src[i] === '{') depth += 1;
  else if (src[i] === '}') { depth -= 1; if (depth === 0) { end = i + 1; break; } }
}
if (end < 0) throw new Error('unbalanced SP literal');

const body = tiers.map((tier) => {
  const rows = next[tier].map((p) => `    [${p.map((s) => `'${s}'`).join(',')}],`).join('\n');
  return `  ${tier}:[\n${rows}\n  ],`;
}).join('\n');

const literal = `export const SP={\n${body}\n}`;
src = src.slice(0, start) + literal + src.slice(end);
fs.writeFileSync(DATA, src);
console.log(`\nrewrote SP in ${path.relative(ROOT, DATA)}`);
