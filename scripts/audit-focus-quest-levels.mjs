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
  expertTargetSec,
  timeHeadroom,
  computeFeatureInterference,
  getLevelDifficultyModel,
  getSurvivalDifficultyModel,
  prepareFreeRound,
  PASS_PLAY_CONFIG,
  RETIRED_CANCELLATION_SHAPES,
  expertTargetSecForSetSize,
} from '../src/features/training/shared/focusQuestData.js';

const SHAPES = new Set(Object.keys(SH));
const RETIRED_SHAPES = new Set(RETIRED_CANCELLATION_SHAPES);
const ACTIVE_CANCELLATION_SHAPES = new Set(
  [...SHAPES].filter((shape) => !RETIRED_SHAPES.has(shape)),
);
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
  // Boards are cols×rows now (Survival deals portrait rectangles so the pieces
  // stay thumb-sized); `grid` is the column count and equals `rows` on a square.
  const cols = r.cols || r.grid;
  const rows = r.rows || r.grid;
  assert(Number.isFinite(cols) && cols > 0, `${label}: cols`);
  assert(Number.isFinite(rows) && rows > 0, `${label}: rows`);
  assert(r.grid === cols, `${label}: grid ${r.grid} must be the column count ${cols}`);
  const n = r.cells.length;
  assert(n === cols * rows, `${label}: cell count ${n} != ${cols}x${rows}`);
  const targets = r.cells.filter((c) => c.isT);
  assert(targets.length === r.tc, `${label}: tc ${r.tc} vs isT count ${targets.length}`);
  assert(r.tc > 0, `${label}: no targets`);
  assert(!RETIRED_SHAPES.has(r.target), `${label}: retired target object "${r.target}"`);

  for (const c of r.cells) {
    assert(SHAPES.has(c.shape), `${label}: unknown shape "${c.shape}"`);
    assert(!RETIRED_SHAPES.has(c.shape), `${label}: retired object "${c.shape}" reached the board`);
    assert(typeof c.fill === 'string' && c.fill.startsWith('#'), `${label}: bad fill`);
  }

  /*
   * Every board is a categorical search now — the target is an OBJECT, and the
   * board may not contain that object anywhere it is not a target. The old
   * `identity` mode allowed exactly that (same object, different colour) and is
   * retired; asserting the mode here stops it reappearing by accident.
   */
  assert(r.searchMode === 'categorical', `${label}: searchMode "${r.searchMode}" (only categorical is allowed)`);

  for (const c of r.cells) {
    if (c.isT) {
      assert(c.shape === r.target, `${label}: target cell is not the target object`);
      // All targets share one colour, so "the object" is never ambiguous.
      assert(c.fill === r.targetCol, `${label}: target cell is not the target colour`);
    } else {
      assert(
        c.shape !== r.target,
        `${label}: a distractor shows the target object — that is the retired colour conjunction`,
      );
    }
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 * TOUCH TARGETS — assert the RENDER, not the config. (2026-08-13)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * A board can be perfectly graded and still be unplayable with a thumb. Before
 * this gate, Survival's hard tier fitted a 9×9 to the shorter axis of a phone
 * and rendered 33px pieces on a 41px pitch — under the 44px touch minimum and
 * smaller than a finger's contact patch. Mis-taps land on the neighbour, and the
 * game scores those as false alarms, so the difficulty the player felt at the
 * top of Survival was partly motor, and the d′ stored in trialLog was partly
 * measuring thumb width.
 *
 * Nothing in build, lint or the rest of this audit could see that: the config
 * was fine and the failure only existed once the CSS grid was laid out. So this
 * REPLICATES CancelBoard2D's fit formula exactly (keep the two in sync) and runs
 * every dealt round through it on the smallest phone we support.
 *
 * Same family as audit:mot simulating the density rescale on four device shapes:
 * a gate that only reads the authored numbers certifies a game nobody can play.
 */
const MIN_TOUCH_PX = 44; // WCAG 2.2 target size (minimum) / Apple HIG 44pt

/* Playable box = viewport minus the HUD reserve and the bottom inset that
 * clears the home indicator (see cancelBoard2d.css). Smallest first. */
const DEVICE_BOXES = [
  { name: 'iPhone SE 375x667', w: 375, h: 667 - 96 - 40 },
  { name: 'iPhone 13 390x844', w: 390, h: 844 - 96 - 50 },
  { name: 'Pixel 7 412x915', w: 412, h: 915 - 96 - 50 },
];

/** Mirrors CancelBoard2D's useLayoutEffect fit(). Keep in sync. */
function renderedPieceSize(cols, rows, w, h) {
  const gap = Math.max(6, Math.min(14, Math.min(w, h) * 0.02));
  const byW = Math.floor((w - gap * (cols + 1)) / cols);
  const byH = Math.floor((h - gap * (rows + 1)) / rows);
  return Math.max(20, Math.min(byW, byH));
}

function assertTappable(round, label) {
  const cols = round.cols || round.grid;
  const rows = round.rows || round.grid;
  for (const dev of DEVICE_BOXES) {
    const px = renderedPieceSize(cols, rows, dev.w, dev.h);
    assert(
      px >= MIN_TOUCH_PX,
      `${label}: ${cols}x${rows} board renders ${px}px pieces on ${dev.name} — under the `
        + `${MIN_TOUCH_PX}px touch minimum, so mis-taps get scored as false alarms`,
    );
  }
}

/*
 * Config shape pools; TC has one entry per level (FQ_LEVELS_PER_TIER).
 *
 * Gradual difficulty: targets non-decreasing, TIME PER TARGET non-increasing,
 * interference non-decreasing — and, above all, every level FINISHABLE.
 *
 * ⚠ This block used to assert `time must not increase`, and that assertion is
 * why the tiers shipped unwinnable. Target counts rise with level, so holding
 * total time down forces seconds-per-target to collapse from both ends: hard
 * L100 ended up granting 11 s for 26 targets that take 44.5 s at expert pace.
 * The audit passed the whole time, because it was validating the SHAPE of the
 * curve and never asked whether a human could finish the board. Total time is
 * now allowed to rise when a level adds targets; what must fall is the budget
 * per target, and what must never fall below 1.0 is the feasibility ratio.
 */
for (const diff of Object.keys(DM)) {
  assert(Array.isArray(SP[diff]) && SP[diff].length >= 2, `${diff}: SP must have shape pools`);
  assert(
    Array.isArray(TC[diff]) && TC[diff].length === FQ_LEVELS_PER_TIER,
    `${diff}: TC must have ${FQ_LEVELS_PER_TIER} entries`,
  );

  let prevPerTarget = Infinity;
  let prevHeadroom = Infinity;
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
      assert(!RETIRED_SHAPES.has(sh), `${diff} L${li + 1}: pool contains retired "${sh}"`);
    }

    // sigmoidTime is the unrounded model; cfg.time is what the player is given,
    // and the assertions below deliberately check the latter.
    assert(
      Math.abs(sigmoidTime(diff, li) - cfg.time) <= 0.5,
      `${diff} L${li + 1}: cfg.time ${cfg.time}s is not sigmoidTime ${sigmoidTime(diff, li)}s rounded`,
    );
    const i = computeFeatureInterference(li, diff);
    const tc = TC[diff][li];
    assert(tc >= prevTc, `${diff} L${li + 1}: TC must be non-decreasing (${tc} < ${prevTc})`);
    assert(i >= prevI - 0.001, `${diff} L${li + 1}: interference must be non-decreasing`);

    /*
     * THE FEASIBILITY GATE. `expertTargetSec` is the game's own search model —
     * 700 ms per target plus the slope for this set size — so a ratio under 1
     * means the level cannot be cleared by anyone, at any skill, ever.
     * cfg.time (rounded, what the player actually gets) is the number checked,
     * not the unrounded model output.
     */
    const needed = expertTargetSec(diff) * tc;
    const ratio = cfg.time / needed;
    assert(
      ratio >= 1,
      `${diff} L${li + 1}: UNWINNABLE — ${tc} targets need ${needed.toFixed(1)}s at expert pace, `
        + `clock grants ${cfg.time}s (${ratio.toFixed(2)}x)`,
    );

    // Difficulty rises as the budget PER TARGET falls. Headroom is the
    // rounding-free statement of that; the granted time is checked too, with
    // the tolerance Math.round can actually introduce (±0.5s spread over tc).
    const headroom = timeHeadroom(diff, li);
    assert(
      headroom <= prevHeadroom + 1e-9,
      `${diff} L${li + 1}: headroom must not increase (${headroom.toFixed(3)} > ${prevHeadroom.toFixed(3)})`,
    );
    const perTarget = cfg.time / tc;
    const roundingSlack = 0.5 / tc + 0.5 / Math.max(1, prevTc);
    assert(
      perTarget <= prevPerTarget + roundingSlack,
      `${diff} L${li + 1}: time per target must not increase `
        + `(${perTarget.toFixed(2)}s > ${prevPerTarget.toFixed(2)}s)`,
    );

    prevPerTarget = perTarget;
    prevHeadroom = headroom;
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

/*
 * Survival must never ease off at a tier boundary. The QA load is deliberately
 * ordinal (not a clinical score), but it includes every lever the generator
 * controls: set size, target density, pool size, time and interference. It also
 * guards against sudden >3× jumps between rounds.
 *
 * ⚠ And every stage must be FINISHABLE. Survival runs on ONE life, so a single
 * impossible stage is not a difficulty spike, it is a hard ceiling on the whole
 * mode — every player's run ended at exactly the same round. It walks the same
 * curriculum the loop above checks, but through survivalStageToDiffLv's own
 * mapping, so it needs its own assertion rather than inheriting one.
 */
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
  const round = prepareFreeRound(stage);
  auditOneRound(round, `survival ${stage}`);
  // The model must describe the round the player is DEALT, not the curriculum's
  // square board — the audit:mot lesson, applied here: assert what reaches the
  // screen. Without this, reflowing the board would silently desync the two.
  assert(
    model.targetCount === round.tc && model.timeLimitSec === round.tlim,
    `survival stage ${stage}: model (${model.targetCount} targets / ${model.timeLimitSec}s) `
      + `does not match the dealt round (${round.tc} / ${round.tlim}s)`,
  );
  const survNeeded = expertTargetSecForSetSize(round.diff, round.cells.length) * round.tc;
  assert(
    round.tlim / survNeeded >= 1,
    `survival stage ${stage} (${round.diff} L${round.lv}): UNWINNABLE — ${round.tc} targets need `
      + `${survNeeded.toFixed(1)}s at expert pace, clock grants ${round.tlim}s`,
  );
  assertTappable(round, `survival stage ${stage}`);
  previousSurvivalLoad = model.ordinalLoad;
}

// Pass n Play hands every player the same fixed board and a flat 30s clock, so
// it does not go through the level curve at all — and therefore needs the
// feasibility check spelled out separately.
for (const diff of Object.keys(PASS_PLAY_CONFIG)) {
  const cfg = PASS_PLAY_CONFIG[diff];
  const needed = expertTargetSec(diff) * cfg.tc;
  assert(
    cfg.tlim / needed >= 1,
    `pass-n-play ${diff}: UNWINNABLE — ${cfg.tc} targets need ${needed.toFixed(1)}s at expert `
      + `pace, clock grants ${cfg.tlim}s`,
  );
}

// The premium training atlas must cover every active Cancellation object, with
// a unique normalized file for every key. Retired objects must have no mapping,
// so their artwork cannot be pulled back into the compiled game accidentally.
// Parse the data-only object literal here rather than importing the Vite asset
// helper into Node.
const shapeArtSource = fs.readFileSync(
  path.join(ROOT, 'src/features/training/shared/shapeArt.js'),
  'utf8',
);
const artPairs = [...shapeArtSource.matchAll(
  /^\s{2}([A-Za-z][A-Za-z0-9]*):\s*\{\s*file:\s*'([^']+)'/gm,
)].map((m) => [m[1], m[2]]);
const artMap = new Map(artPairs);
assert(
  artMap.size === ACTIVE_CANCELLATION_SHAPES.size,
  `art coverage ${artMap.size}/${ACTIVE_CANCELLATION_SHAPES.size}`,
);
assert(new Set(artMap.values()).size === artMap.size, 'art files must be one-to-one');
for (const shape of ACTIVE_CANCELLATION_SHAPES) {
  assert(artMap.has(shape), `missing premium art mapping for ${shape}`);
}
for (const shape of RETIRED_SHAPES) {
  assert(!artMap.has(shape), `retired object still has premium art mapping: ${shape}`);
}

/*
 * ── Atlas II: the per-round `variant` pictures ──
 *
 * A shape may carry a second illustration, and shapeArtSetForRound() picks
 * which one a whole round is drawn with. These files are referenced from
 * committed code exactly like the base atlas, so they need exactly the same
 * guarantees — existence, 256x256, alpha, enough ink, centred. Nothing checked
 * them when they were added, which is how art referenced from `src` but never
 * `git add`ed builds green locally and 404s in production.
 *
 * The variants carry no `motif` of their own and must not: a variant swaps the
 * PICTURE for one shape key, and the motif is what guarantees no two objects on
 * a board belong to the same family. Letting a variant re-declare it would let
 * Atlas II quietly violate a board that Atlas I satisfies.
 */
const variantMap = new Map();
for (const m of shapeArtSource.matchAll(
  /^\s{2}([A-Za-z][A-Za-z0-9]*):\s*\{[\s\S]*?\n\s{4}variant:\s*\{\s*file:\s*'([^']+)'([^}]*)\}/gm,
)) {
  assert(
    !/\bmotif\s*:/.test(m[3]),
    `${m[1]}: a variant must not declare its own motif — the family rule is per shape key`,
  );
  variantMap.set(m[1], m[2]);
}
for (const [shape, file] of variantMap) {
  assert(artMap.has(shape), `variant art for unknown shape "${shape}"`);
  assert(SHAPES.has(shape), `variant art for a shape with no SH silhouette: "${shape}"`);
  assert(file !== artMap.get(shape), `${shape}: variant reuses the base file "${file}"`);
}
const allArtFiles = [...artMap.values(), ...variantMap.values()];
assert(
  new Set(allArtFiles).size === allArtFiles.length,
  'every atlas file (base AND variant) must be used by exactly one shape',
);

const usedTrainingShapes = new Set();
for (const diff of Object.keys(DM)) {
  for (let li = 0; li < FQ_LEVELS_PER_TIER; li++) {
    for (const shape of getLvCfg(diff, li).pool) usedTrainingShapes.add(shape);
  }
}
assert(
  usedTrainingShapes.size === ACTIVE_CANCELLATION_SHAPES.size
    && [...ACTIVE_CANCELLATION_SHAPES].every((shape) => usedTrainingShapes.has(shape)),
  `training curriculum uses ${usedTrainingShapes.size}/${ACTIVE_CANCELLATION_SHAPES.size} active assets`,
);

/*
 * ── No pool may contain two shapes from the same motif family ──
 *
 * Every training board is drawn with the Cosmic Atlas illustrations, so two
 * shapes whose art shares a motif (several planets, several rockets) produce a
 * board the player cannot read: an illustration's difference lives in interior
 * detail, and peripheral vision resolves outlines, not detail. The result is not
 * a harder search, it is a tile-by-tile inspection of all 81 cells.
 *
 * This is the invariant that lets the art be used in EVERY mode and every tier.
 * Difficulty is carried by the other four levers getLvCfg composes — grid, time,
 * hue interference and conjunction strength — plus pool size, so nothing needs
 * shape confusability to grade the curriculum. Pools are generated to satisfy
 * this by scripts/rebuild-shape-pools.mjs; this check makes a hand edit that
 * breaks it fail loudly rather than quietly shipping an unreadable level.
 */
{
  const artSource = fs.readFileSync(
    path.join(ROOT, 'src/features/training/shared/shapeArt.js'), 'utf8',
  );
  const motifOf = {};
  for (const m of artSource.matchAll(/^\s*(\w+):\s*\{\s*file:\s*'[^']+',\s*motif:\s*'([^']+)'/gm)) {
    motifOf[m[1]] = m[2];
  }
  for (const [tier, pools] of Object.entries(SP)) {
    pools.forEach((pool, i) => {
      const seen = new Map();
      for (const shape of pool) {
        assert(!RETIRED_SHAPES.has(shape), `SP.${tier}[${i}]: retired object "${shape}"`);
        const motif = motifOf[shape];
        assert(motif, `SP.${tier}[${i}]: "${shape}" has no art motif`);
        assert(
          !seen.has(motif),
          `SP.${tier}[${i}]: "${shape}" and "${seen.get(motif)}" are both `
          + `${motif} — same object family on one board is unreadable`,
        );
        seen.set(motif, shape);
      }
    });
  }
}

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
// Base atlas AND Atlas II variants — both reach the screen, so both are checked.
const artAssets = [
  ...[...artMap].map(([shape, file]) => [shape, file]),
  ...[...variantMap].map(([shape, file]) => [`${shape} (variant)`, file]),
];
for (const [shape, file] of artAssets) {
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
  atlasIIVariants: variantMap.size,
  artFilesValidated: artAssets.length,
  survivalStagesAudited: 15,
});
