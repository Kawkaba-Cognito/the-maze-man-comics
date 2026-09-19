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
  FQ_LADDER_LEVELS,
  ladderToTier,
  fqSetsForLevel,
  fqMechanicsAt,
  fqWaveShape,
  fqLadderRoundOpts,
  FQ_DRIFT_TIME_MULT,
  FQ_DUAL_TIME_MULT,
  // The honest model — reported, not gated. See the block at the end.
  expertTargetSecForBoard,
  fqLadderInterference,
  PLAY_BOARD,
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

  /*
   * ⚠ A DUAL ROUND HAS TWO TARGET OBJECTS, and this check used to know about
   * one. It never fired because nothing here built a dual board: the loops
   * above walk the curriculum, which does not carry the rule, and the ladder —
   * the only path that turns it on, from world three down — was not audited at
   * all until the wave gate below. Hard-coding `r.target` would have failed
   * every level from L21 for a board that is exactly right.
   */
  const targetShapes = new Set([r.target, ...(r.target2 ? [r.target2] : [])]);
  for (const c of r.cells) {
    if (c.isT) {
      assert(
        targetShapes.has(c.shape),
        `${label}: target cell shows "${c.shape}", not ${[...targetShapes].join(' or ')}`,
      );
      // All targets share one colour, so "the object" is never ambiguous.
      assert(c.fill === r.targetCol, `${label}: target cell is not the target colour`);
    } else {
      assert(
        !targetShapes.has(c.shape),
        `${label}: a distractor shows a target object — that is the retired colour conjunction`,
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

/* Mirrors CancelBoard2D's fit(). ⚠ KEEP THESE FOUR NUMBERS IN SYNC WITH THE
 * COMPONENT — they are the piece-size contract, and a gate that models a
 * different layout from the one that ships is worse than no gate at all. */
const CELL_MIN = 52;
const CELL_MAX = 108;
const GAP_MIN = 8;
const MAX_COLS = 6;
const MAX_ROWS = 8;

function renderedPieceSize(cols, rows, w, h) {
  const screenTarget = Math.round(Math.min(w, h) / 8);
  const fitsMaxW = Math.floor((w - GAP_MIN * (MAX_COLS + 1)) / MAX_COLS);
  const fitsMaxH = Math.floor((h - GAP_MIN * (MAX_ROWS + 1)) / MAX_ROWS);
  const target = Math.max(CELL_MIN, Math.min(CELL_MAX, screenTarget, fitsMaxW, fitsMaxH));
  const byW = Math.floor((w - GAP_MIN * (cols + 1)) / cols);
  const byH = Math.floor((h - GAP_MIN * (rows + 1)) / rows);
  return Math.max(20, Math.min(target, byW, byH));
}

/* MAX_COLS/MAX_ROWS above are the layout contract. If a board ever exceeds
 * them the piece silently starts shrinking again, so assert it here rather
 * than discovering it on a phone. */
function assertWithinMaxBoard(round, label) {
  const cols = round.cols || round.grid;
  const rows = round.rows || round.grid;
  assert(
    cols <= MAX_COLS && rows <= MAX_ROWS,
    `${label}: board ${cols}x${rows} exceeds the layout contract ${MAX_COLS}x${MAX_ROWS} — `
      + 'raise MAX_COLS/MAX_ROWS in BOTH CancelBoard2D and this audit, deliberately.',
  );
}

/*
 * Two things are asserted, and the second is the one that matters now.
 *
 *   1. The piece clears the touch minimum on every supported phone.
 *   2. It is exactly CELL_MIN there — i.e. the board is NOT being squeezed.
 *
 * The whole point of the fixed-size model is that difficulty stops shrinking
 * the target. A board dense enough to fall below CELL_MIN would silently slide
 * back into the old behaviour, still pass a bare 44px check for a while, and
 * only be noticed when someone's thumb started missing. Catch it at the board
 * spec instead.
 */
function assertTappable(round, label) {
  const cols = round.cols || round.grid;
  const rows = round.rows || round.grid;
  assertWithinMaxBoard(round, label);
  for (const dev of DEVICE_BOXES) {
    const px = renderedPieceSize(cols, rows, dev.w, dev.h);
    assert(
      px >= MIN_TOUCH_PX,
      `${label}: ${cols}x${rows} renders ${px}px pieces on ${dev.name} — under the `
        + `${MIN_TOUCH_PX}px touch minimum, so mis-taps get scored as false alarms`,
    );
    assert(
      px >= CELL_MIN,
      `${label}: ${cols}x${rows} renders ${px}px on ${dev.name}, below the fixed `
        + `${CELL_MIN}px piece — the board is too dense for the space, so the piece is `
        + `being squeezed. Difficulty must add squares, never shrink them.`,
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

    /*
     * And the round as DEALT must be both winnable and tappable. cfg above is
     * the authored curriculum; prepareLevelRound reflows it onto the thumb-safe
     * board, so its target count and clock are the ones a player meets. Checking
     * only cfg would certify a level nobody plays — the same mistake audit:mot
     * documents, one layer up.
     */
    const dealt = prepareLevelRound(diff, li + 1);
    const dealtNeed = expertTargetSecForSetSize(diff, dealt.cells.length) * dealt.tc;
    assert(
      dealt.tlim / dealtNeed >= 1,
      `${diff} L${li + 1}: dealt round UNWINNABLE — ${dealt.tc} targets on `
        + `${dealt.cols}x${dealt.rows} need ${dealtNeed.toFixed(1)}s, clock grants ${dealt.tlim}s`,
    );
    assertTappable(dealt, `level ${diff} L${li + 1}`);

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
    assert(seed.grid === PASS_PLAY_CONFIG[diff].cols, `${diff} challenge seed grid`);
    assert(
      seed.cells.length === seed.cols * seed.rows,
      `${diff} challenge seed cells ${seed.cells.length} != ${seed.cols}x${seed.rows}`,
    );
    const r = prepareChallengePlayState(seed);
    auditOneRound(r, `${diff} challenge ${i}`);
    assertTappable(r, `pass-n-play ${diff}`);
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

/*
 * ── THE LADDER, WAVE BY WAVE ─────────────────────────────────────────────────
 *
 * ⚠ THE 60 LEVELS A PLAYER ACTUALLY CLIMBS WERE NOT GATED HERE AT ALL. The
 * loops above walk the authored CURRICULUM (three tiers × 100 levels) and
 * Survival; the ladder is a PATH through that curriculum with its own clock
 * (`fqLadderRoundOpts`), and nothing measured the boards it deals. `audit:curves`
 * checks that path climbs — not that any rung on it can be finished. So the one
 * property this game exists to guarantee, "a human can clear this board", was
 * unasserted on the only mode most players ever open.
 *
 * ⚠ AND SINCE 2026-09-18 A LEVEL IS NOT ONE BOARD BUT THREE TO EIGHT, EACH
 * HARDER THAN THE LAST. The last wave of a level is the tightest board on the
 * ladder at that point, so it is exactly the board a level-shaped check would
 * miss. Every wave is built and measured.
 *
 * ⚠ IT BUILDS THE ROUND THROUGH `fqLadderRoundOpts`, the same function the game
 * calls. A gate that assembled its own options would certify a board nobody is
 * dealt the moment one side gained an option the other lacked — which is the
 * whole history of this file's `prepareLevelRound` checks.
 */
const LADDER_SAMPLES = 3;
let ladderWavesAudited = 0;
let prevLastRealised = Infinity;
for (let lv = 1; lv <= FQ_LADDER_LEVELS; lv += 1) {
  const { diff, li } = ladderToTier(lv);
  const waves = fqSetsForLevel(lv);
  const mech = fqMechanicsAt(lv);
  // The rules that buy time back, priced exactly as the wave table prices them.
  const mult = (mech.has('drift') ? FQ_DRIFT_TIME_MULT : 1)
    * (mech.has('dual') ? FQ_DUAL_TIME_MULT : 1);
  let prevPerTarget = Infinity;
  let prevWaveTc = 0;
  let lastRealised = Infinity;
  for (let w = 0; w < waves; w += 1) {
    const want = fqWaveShape(lv, w);
    const opts = fqLadderRoundOpts(lv, w);
    const where = `ladder L${lv} wave ${w + 1}/${waves}`;
    for (let s = 0; s < LADDER_SAMPLES; s += 1) {
      const r = prepareLevelRound(diff, li, opts);
      auditOneRound(r, `${where} sample ${s}`);
      assertTappable(r, where);
      /*
       * ⚠ THE RAMP MUST REACH THE BOARD, and this is the assertion that says so.
       * The wave table can compute a perfect climb and the game still deal the
       * same board eight times — that is precisely what shipped, because the
       * target count came from the curriculum and no caller could move it.
       * Comparing the DEALT round against what the table asked for is the only
       * check that can tell a live ramp from a dead one.
       */
      assert(
        r.tc === want.tc && r.tlim === want.time,
        `${where}: dealt ${r.tc} targets / ${r.tlim}s but the wave table asks for `
          + `${want.tc} / ${want.time}s — the ramp is not reaching the board`,
      );
      const need = expertTargetSecForSetSize(diff, r.cells.length) * r.tc;
      assert(
        r.tlim / need >= 1,
        `${where}: UNWINNABLE — ${r.tc} targets on ${r.cols}x${r.rows} need `
          + `${need.toFixed(1)}s at expert pace, clock grants ${r.tlim}s `
          + `(${(r.tlim / need).toFixed(2)}x)`,
      );
      ladderWavesAudited += 1;
    }
    // Within a level the waves climb: more targets, less time for each.
    const perTarget = want.time / want.tc;
    const slack = 0.5 / want.tc + 0.5 / Math.max(1, prevWaveTc || want.tc);
    assert(
      perTarget <= prevPerTarget + slack,
      `${where}: time per target must not rise across a level `
        + `(${perTarget.toFixed(2)}s > ${prevPerTarget.toFixed(2)}s)`,
    );
    assert(
      want.tc >= prevWaveTc,
      `${where}: targets must not fall across a level (${want.tc} < ${prevWaveTc})`,
    );
    prevPerTarget = perTarget;
    prevWaveTc = want.tc;
    const per = expertTargetSecForSetSize(diff, prepareLevelRound(diff, li, opts).cells.length);
    lastRealised = (want.time / mult) / (per * want.tc);
  }
  /*
   * ⚠ MEASURED ON THE LAST WAVE, because that is the level's true difficulty.
   * Comparing averages would let a long level sneak an easy finish past a short
   * one — and the finish is what the next level has to be harder than.
   */
  assert(
    lastRealised <= prevLastRealised + 1e-9,
    `ladder L${lv}: the hardest board eases off — ${lastRealised.toFixed(3)}x expert pace `
      + `against ${prevLastRealised.toFixed(3)}x at L${lv - 1}`,
  );
  prevLastRealised = lastRealised;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * THE HONEST-MODEL REPORT — REPORTS, DOES NOT BLOCK. Read this before
 * "fixing" anything it prints.
 *
 * Everything above gates against `expertTargetSecForSetSize`, the superseded
 * flat model, and it must keep doing so: the owner's instruction (2026-09-19)
 * was to HOLD THE CURRENT FEEL, i.e. the seconds a player is granted do not
 * move. Re-pointing the assertions at the honest model would change the clock,
 * which is the one thing that decision ruled out.
 *
 * So the honest model is measured here and PRINTED. Three known divergences,
 * all recorded in CANCELLATION-TASK-PLAN.md §3 and awaiting a product decision
 * rather than a code fix:
 *
 *  (a) The legacy baseline is 700 ms where its own citation (Mesulam, ~1.06
 *      targets/s) is 943 ms.
 *  (b) The legacy slope is keyed to the TIER NAME, so it under-prices the
 *      high-interference boards at the top of the ladder.
 *  (c) `mult` — drift ×1.12, dual ×1.15 — is divided out of the clock above
 *      while `per` never contained it, so the same compensation is banked as
 *      headroom and spent as headroom at once.
 *
 * ⚠ This block deliberately calls no `assert`. Turning it into a gate today
 * would fail CI on working, shipped, playable content — and a gate that fails
 * working code gets weakened, and then it protects nothing. When the clock is
 * reconciled with the honest model, promote these to assertions in the same
 * commit that moves the clock.
 * ═══════════════════════════════════════════════════════════════════════════ */
{
  const honest = [];
  const multAdjusted = [];
  for (let lv = 1; lv <= FQ_LADDER_LEVELS; lv += 1) {
    const { diff } = ladderToTier(lv);
    const board = PLAY_BOARD[diff];
    const cells = board.cols * board.rows;
    const interference = fqLadderInterference(lv);
    const waves = fqSetsForLevel(lv);
    const mech = fqMechanicsAt(lv);
    const mult = (mech.has('drift') ? FQ_DRIFT_TIME_MULT : 1) * (mech.has('dual') ? FQ_DUAL_TIME_MULT : 1);
    for (let w = 0; w < waves; w += 1) {
      const shape = fqWaveShape(lv, w);
      const perHonest = expertTargetSecForBoard({
        cols: board.cols, rows: board.rows, cells, tc: shape.tc, interference,
      });
      honest.push({ lv, w: w + 1, ratio: shape.time / (perHonest * shape.tc), tc: shape.tc, time: shape.time });
      const perLegacy = expertTargetSecForSetSize(diff, cells);
      multAdjusted.push({ lv, w: w + 1, ratio: (shape.time / mult) / (perLegacy * shape.tc) });
    }
  }
  const worstHonest = honest.reduce((a, b) => (b.ratio < a.ratio ? b : a));
  const underHonest = honest.filter((x) => x.ratio < 1);
  const worstMult = multAdjusted.reduce((a, b) => (b.ratio < a.ratio ? b : a));
  const underMult = multAdjusted.filter((x) => x.ratio < 1);

  console.log('\n--- honest-model report (NOT a gate; see CANCELLATION-TASK-PLAN.md §3) ---');
  console.log(
    `  split Fitts+search model: worst wave ${worstHonest.ratio.toFixed(3)}x expert `
    + `at L${worstHonest.lv} w${worstHonest.w} (${worstHonest.tc} targets, ${worstHonest.time}s); `
    + `${underHonest.length} of ${honest.length} waves under 1.0x`,
  );
  if (underHonest.length) {
    const lv = [...new Set(underHonest.map((x) => x.lv))];
    console.log(`    levels affected: L${lv[0]}-L${lv[lv.length - 1]} (${lv.length} of ${FQ_LADDER_LEVELS})`);
  }
  console.log(
    `  mechanic multipliers treated as compensation: worst ${worstMult.ratio.toFixed(3)}x `
    + `at L${worstMult.lv} w${worstMult.w}; ${underMult.length} of ${multAdjusted.length} waves under 1.0x`,
  );
  console.log('--- end report ---\n');
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
  ladderLevels: FQ_LADDER_LEVELS,
  ladderWavesAudited,
});
