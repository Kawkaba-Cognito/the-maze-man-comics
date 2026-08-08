/**
 * Exhaustive finite checks on FocusQuest level generation.
 * All properties are decidable by enumeration over the finite grid — no SMT/Z3 required.
 *
 * Run: node scripts/audit-focus-quest-levels.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import {
  DM,
  SP,
  TC,
  SH,
  FQ_LEVELS_PER_TIER,
  prepareLevelRound,
  prepareChallengeSeed,
  prepareChallengePlayState,
  getLvCfg,
  sigmoidTime,
  computeFeatureInterference,
  getLevelDifficultyModel,
  getSurvivalDifficultyModel,
  prepareFreeRound,
} from '../src/features/training/shared/focusQuestData.js';

const SHAPES = new Set(Object.keys(SH));
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const sharp = require('sharp');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function auditOneRound(r, label) {
  assert(r && Array.isArray(r.cells), `${label}: no cells`);
  assert(typeof r.target === 'string' && SHAPES.has(r.target), `${label}: bad target "${r.target}"`);
  assert(
    typeof r.targetCol === 'string' && /^#[0-9a-fA-F]{6}$/.test(r.targetCol),
    `${label}: bad targetCol "${r.targetCol}"`,
  );
  assert(Number.isFinite(r.grid) && r.grid > 0, `${label}: grid`);
  const n = r.cells.length;
  assert(n === r.grid * r.grid, `${label}: cell count ${n} != ${r.grid}^2`);
  const targets = r.cells.filter((c) => c.isT);
  assert(targets.length === r.tc, `${label}: tc ${r.tc} vs isT count ${targets.length}`);
  assert(r.tc > 0, `${label}: no targets`);

  for (const c of r.cells) {
    assert(SHAPES.has(c.shape), `${label}: unknown shape "${c.shape}"`);
    assert(typeof c.fill === 'string' && c.fill.startsWith('#'), `${label}: bad fill`);
  }

  const id = r.searchMode === 'identity';
  const cat = r.searchMode === 'categorical';
  assert(id || cat, `${label}: searchMode "${r.searchMode}"`);

  for (const c of r.cells) {
    if (cat) {
      if (c.isT) assert(c.shape === r.target, `${label}: categorical isT must be target shape`);
      else assert(c.shape !== r.target, `${label}: categorical distractor must not be target shape`);
    }
    if (id) {
      if (c.isT) {
        assert(c.shape === r.target, `${label}: identity isT shape`);
        assert(c.fill === r.targetCol, `${label}: identity isT fill`);
      } else {
        const fullMatch = c.shape === r.target && c.fill === r.targetCol;
        assert(!fullMatch, `${label}: identity distractor must not fully match target`);
      }
    }
  }
}

// Config shape pools; TC has one entry per level (FQ_LEVELS_PER_TIER).
// Gradual difficulty: targets non-decreasing, time non-increasing, interference non-decreasing
for (const diff of Object.keys(DM)) {
  assert(Array.isArray(SP[diff]) && SP[diff].length >= 2, `${diff}: SP must have shape pools`);
  assert(
    Array.isArray(TC[diff]) && TC[diff].length === FQ_LEVELS_PER_TIER,
    `${diff}: TC must have ${FQ_LEVELS_PER_TIER} entries`,
  );

  let prevT = Infinity;
  let prevI = -1;
  let prevTc = -1;

  for (let li = 0; li < FQ_LEVELS_PER_TIER; li++) {
    const cfg = getLvCfg(diff, li);
    const m = getLevelDifficultyModel(diff, li);
    assert(m.targetCount === cfg.tc, `${diff} L${li + 1}: model tc mismatch`);

    assert(
      Array.isArray(cfg.pool) && cfg.pool.length >= 2,
      `${diff} L${li + 1}: pool must have at least 2 shapes`,
    );
    for (const sh of cfg.pool) {
      assert(SHAPES.has(sh), `${diff} L${li + 1}: pool references unknown "${sh}"`);
    }

    const t = sigmoidTime(diff, li);
    const i = computeFeatureInterference(li, diff);
    const tc = TC[diff][li];
    assert(tc >= prevTc, `${diff} L${li + 1}: TC must be non-decreasing (${tc} < ${prevTc})`);
    assert(t <= prevT + 0.01, `${diff} L${li + 1}: time must not increase (${t} > ${prevT})`);
    assert(i >= prevI - 0.001, `${diff} L${li + 1}: interference must be non-decreasing`);
    prevT = t;
    prevI = i;
    prevTc = tc;
  }
}

const ITERS = 12;
const AUDIT_LEVEL_SAMPLE = Math.min(20, FQ_LEVELS_PER_TIER);
for (const diff of Object.keys(DM)) {
  for (let lv = 1; lv <= AUDIT_LEVEL_SAMPLE; lv++) {
    for (let i = 0; i < ITERS; i++) {
      const r = prepareLevelRound(diff, lv);
      auditOneRound(r, `${diff} L${lv} sample ${i}`);
    }
  }
}

for (const diff of Object.keys(DM)) {
  for (let i = 0; i < 15; i++) {
    const seed = prepareChallengeSeed(diff);
    assert(seed.grid === DM[diff].grid, `${diff} challenge seed grid`);
    assert(seed.cells.length === seed.grid * seed.grid, `${diff} challenge seed cell count`);
    const r = prepareChallengePlayState(seed);
    auditOneRound(r, `${diff} challenge ${i}`);
  }
}

// Survival must never ease off at a tier boundary. The QA load is deliberately
// ordinal (not a clinical score), but it includes every lever the generator
// controls: set size, target density, pool size, time, interference and
// conjunction search. It also guards against sudden >3× jumps between rounds.
let previousSurvivalLoad = -Infinity;
for (let stage = 0; stage < 15; stage++) {
  const model = getSurvivalDifficultyModel(stage);
  assert(
    model.ordinalLoad >= previousSurvivalLoad - 0.01,
    `survival stage ${stage}: load dropped ${model.ordinalLoad} < ${previousSurvivalLoad}`,
  );
  if (stage > 0 && previousSurvivalLoad > 0) {
    assert(
      model.ordinalLoad / previousSurvivalLoad <= 3,
      `survival stage ${stage}: load jump exceeds 3x`,
    );
  }
  auditOneRound(prepareFreeRound(stage), `survival ${stage}`);
  previousSurvivalLoad = model.ordinalLoad;
}

// The premium training atlas must cover the complete engine vocabulary, with a
// unique normalized file for every key. Parse the data-only object literal here
// rather than importing the Vite asset helper into Node.
const shapeArtSource = fs.readFileSync(
  path.join(ROOT, 'src/features/training/shared/shapeArt.js'),
  'utf8',
);
const artPairs = [...shapeArtSource.matchAll(
  /^\s{2}([A-Za-z][A-Za-z0-9]*):\s*\{\s*file:\s*'([^']+)'/gm,
)].map((m) => [m[1], m[2]]);
const artMap = new Map(artPairs);
assert(artMap.size === SHAPES.size, `art coverage ${artMap.size}/${SHAPES.size}`);
assert(new Set(artMap.values()).size === artMap.size, 'art files must be one-to-one');
for (const shape of SHAPES) {
  assert(artMap.has(shape), `missing premium art mapping for ${shape}`);
}

const usedTrainingShapes = new Set();
for (const diff of Object.keys(DM)) {
  for (let li = 0; li < FQ_LEVELS_PER_TIER; li++) {
    for (const shape of getLvCfg(diff, li).pool) usedTrainingShapes.add(shape);
  }
}
assert(
  usedTrainingShapes.size === SHAPES.size,
  `training curriculum uses ${usedTrainingShapes.size}/${SHAPES.size} assets`,
);

/*
 * ── Every silhouette in SH must actually DRAW something ──
 *
 * This exists because two of them did not, for months. `moon` and `tinyMoon`
 * were authored with an inner arc radius too small for their chord; the SVG spec
 * requires an out-of-range radius to be scaled up until it fits, which made both
 * arcs the same semicircle with opposite sweep flags, so each path traced out and
 * back along one curve and enclosed zero area. They rendered as blank tiles in 21
 * live level pools, and any level that targeted one was unsolvable.
 *
 * Nothing caught it: the checks above only assert that a pool's shape KEY exists
 * in SH, never that the key maps to visible geometry. A key can be perfectly
 * valid and still draw nothing.
 *
 * The floor is 5% of the raster. Measured across the current set the true
 * minimum is `lightning` at 11.1% — a genuinely thin bolt — with the next
 * lightest at 24.6%. So 5% sits well clear of legitimate art while still
 * catching both failure modes: a path that encloses nothing, and one that
 * collapses to a hairline sliver.
 */
for (const [name, markup] of Object.entries(SH)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" `
    + `width="64" height="64" color="black">${markup}</svg>`;
  const { data, info } = await sharp(Buffer.from(svg))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let ink = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 12) ink += 1;
  const pct = (ink / (info.width * info.height)) * 100;
  assert(ink > 0, `SH.${name}: renders NOTHING — the path encloses zero area`);
  assert(pct >= 5, `SH.${name}: only ${pct.toFixed(1)}% ink — too faint to find`);
}

const artDir = path.join(ROOT, 'public/Assets/training/cancel-cosmic-atlas-2026');
for (const [shape, file] of artMap) {
  const asset = path.join(artDir, `${file}.webp`);
  assert(fs.existsSync(asset), `${shape}: missing ${path.relative(ROOT, asset)}`);
  const image = sharp(asset).ensureAlpha();
  const meta = await image.metadata();
  assert(meta.width === 256 && meta.height === 256, `${shape}: must be 256x256`);
  assert(meta.hasAlpha, `${shape}: asset must preserve transparency`);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  let visible = 0;
  let alphaSum = 0;
  let weightedX = 0;
  let weightedY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const alpha = data[(y * info.width + x) * info.channels + 3];
      if (alpha > 12) visible += 1;
      alphaSum += alpha;
      weightedX += x * alpha;
      weightedY += y * alpha;
    }
  }
  assert(visible > 2000, `${shape}: too little visible artwork`);
  const cx = weightedX / alphaSum;
  const cy = weightedY / alphaSum;
  // Alpha mass is intentionally asymmetric for crescents, comets and angled
  // satellites; this broad guard catches a bad crop without "correcting" the
  // authored silhouette away from its geometrically centred frame.
  assert(Math.abs(cx - 127.5) <= 32, `${shape}: alpha x-centre ${cx.toFixed(1)}`);
  assert(Math.abs(cy - 127.5) <= 32, `${shape}: alpha y-centre ${cy.toFixed(1)}`);
}

console.log('audit-focus-quest-levels: OK', {
  difficulties: Object.keys(DM).length,
  levelsPerTier: FQ_LEVELS_PER_TIER,
  samplesPerLevel: ITERS,
  totalPrepareSamples: Object.keys(DM).length * AUDIT_LEVEL_SAMPLE * ITERS,
  premiumAssets: artMap.size,
  survivalStagesAudited: 15,
});
