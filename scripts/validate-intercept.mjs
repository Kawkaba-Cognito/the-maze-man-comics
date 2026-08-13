/**
 * Intercept — level curve gate.
 *
 * Run: node scripts/validate-intercept.mjs
 *
 * ⚠ THIS ASSERTS THE OUTCOME, NOT THE PARAMETERS, and that distinction is the
 * whole reason it exists. `audit:fq` spent months asserting "targets go up,
 * time goes down" — a perfectly monotonic shape that forced seconds-per-target
 * to collapse, and it certified Cancellation's hard tier while it granted 11s
 * for a board needing 44.5s. The equivalent mistake here would be checking that
 * travel time falls and occlusion rises, which two levers can happily do while
 * leaving a level with nothing visible to estimate from.
 *
 * So the questions asked are the player's questions:
 *   - do I get to SEE enough of the run to judge its speed?
 *   - is the hit window wider than human timing noise?
 *   - does level 100 of Hard remain possible at all?
 *   - and does the difficulty actually rise, per tier and across tiers?
 */

import {
  BASE, LEVELS_PER_TIER, MIN_TOLERANCE, MIN_VISIBLE_MS, PATHS, PATH_IDS, PROFILES, PROFILE_IDS,
  buildTrial, hideAtFor, levelCfg, pathPoint, positionAt, scoreTap, survivalCfg,
} from '../src/features/training/domains/speed/games/intercept/data.js';

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error(`  FAIL  ${msg}`);
    failures += 1;
  }
}

const TIERS = ['easy', 'med', 'hard'];

/*
 * QA-only ordinal difficulty. Not a score, not shown to anyone — it exists so
 * "harder" is one number the gate can compare.
 *
 * ⚠ Occlusion is deliberately NOT a term. It is DERIVED from visible/travel, so
 * including it alongside 1/visible puts travel in the formula twice with
 * opposite signs — and that is not hypothetical: once visible and tol hit their
 * floors around level 60, the occlusion term started falling faster than the
 * rest rose and the curve drifted DOWN from level 81 to 100 by a fraction of a
 * percent. Every term here is authored and independent.
 */
function ordinalLoad(c) {
  return (1000 / c.visibleMs)          // less time to read the speed
    * (200 / c.tol)                    // tighter window
    * (2000 / c.travel)                // the whole run is quicker
    * c.profiles.length                // more motions to tell apart
    * c.movers;                        // more forward models at once
}

/* ── 1. Every level must be playable ─────────────────────────────────────── */
for (const diff of TIERS) {
  let prevLoad = -Infinity;
  for (let lv = 1; lv <= LEVELS_PER_TIER; lv++) {
    const c = levelCfg(diff, lv);

    assert(
      c.visibleMs >= MIN_VISIBLE_MS,
      `${diff} L${lv}: only ${c.visibleMs}ms visible before the cover — under `
        + `${MIN_VISIBLE_MS}ms there is nothing to estimate speed from, so the trial is a coin flip`,
    );
    assert(
      c.tol >= MIN_TOLERANCE,
      `${diff} L${lv}: hit window ${c.tol}ms is below ${MIN_TOLERANCE}ms — that is not `
        + 'difficulty, it is timing noise',
    );
    assert(c.occlude > 0.15 && c.occlude < 0.9, `${diff} L${lv}: occlusion ${c.occlude} out of range`);
    assert(c.travel > 400, `${diff} L${lv}: travel ${c.travel}ms too short to read`);

    /* Ordinal load, so "harder" is one number rather than four. Every term is a
       lever the player feels: less time to watch, a narrower window, more of the
       path hidden, and more profiles to tell apart. */
    const load = ordinalLoad(c);
    assert(
      load >= prevLoad - 1e-6,
      `${diff} L${lv}: difficulty DROPPED (${load.toFixed(2)} < ${prevLoad.toFixed(2)})`,
    );
    prevLoad = load;
  }
}

/* ── 2. A harder tier must be harder at the SAME level number ────────────── */
for (let lv = 1; lv <= LEVELS_PER_TIER; lv += 7) {
  const loadOf = (d) => {
    const c = levelCfg(d, lv);
    return ordinalLoad(c);
  };
  assert(loadOf('med') > loadOf('easy'), `L${lv}: medium is not harder than easy`);
  assert(loadOf('hard') > loadOf('med'), `L${lv}: hard is not harder than medium`);
}

/* ── 3. Profiles must be tellable apart from the visible stretch ──────────
 * If two profiles look identical for as long as you can see them, the shape is
 * decoration and the trial is unguessable — the Kawkab Hops failure, where 8%
 * of top-tier rounds could not be solved at any demo length.
 */
for (const diff of TIERS) {
  const c = levelCfg(diff, LEVELS_PER_TIER);
  const vis = Math.min(1, c.visibleMs / c.travel);
  for (let i = 0; i < c.profiles.length; i++) {
    for (let j = i + 1; j < c.profiles.length; j++) {
      const a = PROFILES[c.profiles[i]];
      const b = PROFILES[c.profiles[j]];
      let maxGap = 0;
      for (let u = 0; u <= vis; u += vis / 40) {
        maxGap = Math.max(maxGap, Math.abs(a.at(u) - b.at(u)));
      }
      assert(
        maxGap > 0.04,
        `${diff} L100: ${a.id} and ${b.id} differ by only ${(maxGap * 100).toFixed(1)}% of the `
          + 'path while visible — the player cannot tell them apart before it hides',
      );
    }
  }
}

/* ── 3b. The paths ────────────────────────────────────────────────────────
 * Variety is the thing that stops a hundred levels being one picture, so it is
 * gated like any other lever rather than eyeballed.
 *
 * ⚠ Path count is deliberately NOT a term in ordinalLoad. Easy has 2 routes and
 * Hard has 8, so folding it in would multiply Hard's score by four and mask a
 * regression in the levers that actually decide whether a level is possible —
 * exactly the dilution audit:fq shipped for months. It is asserted here on its
 * own instead.
 */
const arcFractions = (id) => {
  const { pts } = { pts: PATHS[id].pts };
  const segs = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(d);
    total += d;
  }
  const out = [];
  let run = 0;
  for (let i = 0; i < segs.length - 1; i++) { run += segs[i]; out.push(run / total); }
  return out;              // interior corners, as fractions of the whole route
};

for (const id of PATH_IDS) {
  // Nothing may be drawn outside the padded play box at any point of the run.
  for (let s = 0; s <= 1.0001; s += 0.01) {
    const [x, y] = pathPoint(id, s);
    assert(
      x >= 0.04 && x <= 0.96 && y >= 0.04 && y <= 0.96,
      `path ${id}: leaves the play box at s=${s.toFixed(2)} (${x.toFixed(2)}, ${y.toFixed(2)})`,
    );
  }
  // Arc-length parametrisation must advance — a stalled path would freeze a run.
  let prevS = pathPoint(id, 0);
  for (let s = 0.02; s <= 1.0001; s += 0.02) {
    const p = pathPoint(id, s);
    assert(Math.hypot(p[0] - prevS[0], p[1] - prevS[1]) > 1e-6, `path ${id}: does not advance at s=${s.toFixed(2)}`);
    prevS = p;
  }
  const end = pathPoint(id, 1);
  const last = PATHS[id].pts[PATHS[id].pts.length - 1];
  assert(Math.hypot(end[0] - last[0], end[1] - last[1]) < 1e-9, `path ${id}: s=1 is not the goal point`);
}

let prevPaths = 0;
for (const diff of TIERS) {
  const c = levelCfg(diff, 1);
  assert(c.paths.length >= 2, `${diff}: only ${c.paths.length} route(s) — every run would look the same`);
  for (const id of c.paths) assert(PATH_IDS.includes(id), `${diff}: unknown path ${id}`);
  assert(c.paths.length >= prevPaths, `${diff}: fewer routes than the easier tier — variety went backwards`);
  prevPaths = c.paths.length;

  /*
   * The claim in data.js is that a bouncing mover changes direction WHILE
   * HIDDEN — that is the whole reason the hard tier has somewhere to go after
   * the profiles run out. If the corner were visible the player would simply
   * watch it turn and the path would be scenery. Assert it at every level and
   * for every profile the tier can deal, including the slowing one, which is
   * the profile that has travelled furthest by the time the cover starts.
   */
  for (const id of c.paths) {
    const corners = arcFractions(id);
    if (!corners.length) continue;
    for (let lv = 1; lv <= LEVELS_PER_TIER; lv++) {
      const cfg = levelCfg(diff, lv);
      for (const p of cfg.profiles) {
        const hide = hideAtFor(p, cfg.visibleMs, cfg.travel);
        assert(
          hide < corners[0] - 0.01,
          `${diff} L${lv} ${id}/${p}: the cover starts at ${hide.toFixed(3)} but the turn is at `
            + `${corners[0].toFixed(3)} — the direction change happens in plain sight`,
        );
      }
    }
  }
}

/* ── 4. Survival must never ease off ─────────────────────────────────────── */
let prev = -Infinity;
for (let stage = 0; stage < 40; stage++) {
  const c = survivalCfg(stage);
  const load = ordinalLoad(c);
  assert(load >= prev - 1e-6, `survival stage ${stage}: difficulty dropped`);
  assert(c.visibleMs >= MIN_VISIBLE_MS, `survival stage ${stage}: only ${c.visibleMs}ms visible`);
  assert(c.tol >= MIN_TOLERANCE, `survival stage ${stage}: window ${c.tol}ms below the floor`);
  prev = load;
}

/* ── 5. Built trials must be answerable ──────────────────────────────────── */
let seed = 12345;
const rng = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
let trials = 0;
const seenPaths = new Set();
for (const diff of TIERS) {
  for (let lv = 1; lv <= LEVELS_PER_TIER; lv += 3) {
    const c = levelCfg(diff, lv);
    for (let k = 0; k < 4; k++) {
      const tr = buildTrial(c, rng);
      trials += 1;
      assert(tr.movers.length === c.movers, `${diff} L${lv}: wrong mover count`);
      assert(c.paths.includes(tr.path), `${diff} L${lv}: built a trial on path ${tr.path}, not in the tier`);
      assert(tr.movers.every((m) => m.path === tr.path), `${diff} L${lv}: movers disagree on the path`);
      seenPaths.add(tr.path);
      for (const m of tr.movers) {
        assert(PROFILE_IDS.includes(m.profile), `${diff} L${lv}: unknown profile ${m.profile}`);
        // A perfect tap must score, and the arrival must be where the maths says.
        assert(Math.abs(positionAt(m, m.arriveAt) - 1) < 1e-9, `${diff} L${lv}: mover does not reach the line at arriveAt`);
        assert(scoreTap(m, m.arriveAt, tr.tol).hit, `${diff} L${lv}: a perfect tap does not register as a hit`);
        assert(!scoreTap(m, m.arriveAt + tr.tol + 1, tr.tol).hit, `${diff} L${lv}: a tap outside the window still counts`);
      }
      if (tr.movers.length > 1) {
        const [a, b] = tr.movers;
        assert(
          Math.abs(a.arriveAt - b.arriveAt) > tr.tol * 2,
          `${diff} L${lv}: two movers arrive within one hit window — a single tap would answer both`,
        );
      }
    }
  }
}

/* Every authored route must actually be dealt. A path added to BASE but never
   reached by the draw is content nobody sees. */
for (const id of PATH_IDS) {
  assert(seenPaths.has(id), `path ${id} is authored but was never dealt in ${trials} simulated trials`);
}

if (failures) {
  console.error(`\nvalidate-intercept: ${failures} failure(s)`);
  process.exit(1);
}
console.log('validate-intercept: OK', {
  tiers: TIERS.length,
  levelsPerTier: LEVELS_PER_TIER,
  trialsSimulated: trials,
  paths: PATH_IDS.length,
  pathsDealt: seenPaths.size,
  easyVisibleMs: levelCfg('easy', 1).visibleMs,
  hardestVisibleMs: levelCfg('hard', LEVELS_PER_TIER).visibleMs,
  hardestWindowMs: levelCfg('hard', LEVELS_PER_TIER).tol,
  baseTiers: Object.keys(BASE).length,
});
