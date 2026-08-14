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
  BASE, GATE_S, LAUNCH_BEATS, LEVELS_PER_TIER, MIN_HIDDEN_MS, MIN_REACT_MS, MIN_TOLERANCE,
  MIN_VISIBLE_MS, PATHS, PATH_IDS, PROFILES, PROFILE_IDS, WARPS,
  WAVES_PER_SECTOR, buildTrial, hideAtFor, levelCfg, pathPoint, positionAt, scoreLaunch, scoreTap, survivalCfg,
  timeAtS,
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
/*
 * ⚠ `strobe` and `launchShare` are deliberately absent, and for opposite
 * reasons. The strobe makes a trial EASIER — it is the payment for warp — so
 * scoring it as difficulty would be a lie; and launch is a different reading of
 * the same skill rather than a harder one. Either folded in here would let a
 * real regression in the levers that decide whether a level is POSSIBLE hide
 * behind a rising number, which is the dilution audit:fq shipped for months.
 * Both are asserted on their own below.
 */
function ordinalLoad(c) {
  return (1000 / c.visibleMs)          // less time to read the speed
    * (200 / c.tol)                    // tighter window
    * (2000 / c.travel)                // the whole run is quicker
    * c.profiles.length                // more motions to tell apart
    * c.movers                         // more forward models at once
    * c.gates                          // a crossing to choose as well as time
    * c.warps.length;                  // the speed may change while hidden
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

/* ── 3c. The new levers, each asserted against what it does to the PLAYER ──
 *
 * Gate, warp, strobe and launch were added because the curve turned one knob a
 * hundred times and the game got boring. Each of them can also make a level
 * unplayable in a way no monotonic check would ever notice, so each gets the
 * question a player would ask.
 */
for (const diff of TIERS) {
  for (let lv = 1; lv <= LEVELS_PER_TIER; lv++) {
    const c = levelCfg(diff, lv);
    const visFrac = Math.min(1, c.visibleMs / c.travel);

    for (const p of c.profiles) {
      const prof = PROFILES[p];
      const hideAt = hideAtFor(p, c.visibleMs, c.travel);
      const uHide = prof.inv(hideAt);

      /* `inv` is used to place gates and to re-time warped movers. If it ever
         stops being the exact inverse of `at`, the shape is drawn in one place
         and scored in another — silently, and only for some profiles. */
      for (const u of [0.1, 0.35, 0.6, 0.85, 1]) {
        assert(Math.abs(prof.inv(prof.at(u)) - u) < 1e-9, `${p}: inv is not the inverse of at at u=${u}`);
      }

      for (const gateS of (c.gates > 1 ? GATE_S : [1])) {
        for (const warp of c.warps) {
          // Warp is refused on the near gate at the source; mirror that here.
          if (warp !== 1 && gateS !== 1) continue;
          const m = { profile: p, travel: c.travel, startAt: 0, uHide, warp };
          const arriveAt = timeAtS(m, gateS);
          const hideTime = timeAtS(m, hideAt);
          const hidden = arriveAt - hideTime;

          /* THE PREDICTION HAS TO EXIST. A near gate shortens the hidden
             stretch, and a short enough one turns the trial from a prediction
             into a reaction — measuring the wrong thing while looking fine. */
          assert(
            hidden >= MIN_HIDDEN_MS,
            `${diff} L${lv} ${p} gate=${gateS} warp=${warp}: only ${hidden.toFixed(0)}ms hidden `
              + `— under ${MIN_HIDDEN_MS}ms there is nothing to predict`,
          );

          /* A SPEED CHANGE YOU CANNOT OBSERVE IS A COIN FLIP. Warp is only
             honest because a glimpse lands mid-tunnel with time left to act on
             it. This is the Mirror World lesson: an alternative route that
             renders and registers and still cannot reach the win condition. */
          if (warp !== 1) {
            const room = hidden - 130 - MIN_REACT_MS;   // STROBE_MS is 130
            assert(
              room > 0,
              `${diff} L${lv} ${p} warp=${warp}: ${hidden.toFixed(0)}ms hidden leaves no room for a `
                + `glimpse plus ${MIN_REACT_MS}ms to act on it — the speed change is unobservable`,
            );
          }
        }
      }
    }

    /* Launch has to be releasable. The player must have heard enough beats to
       have a tempo, and must not still be waiting when the target arrives. */
    if (c.launchShare > 0) {
      for (const p of c.profiles) {
        const hideAt = hideAtFor(p, c.visibleMs, c.travel);
        const uHide = PROFILES[p].inv(hideAt);
        for (const gateS of (c.gates > 1 ? GATE_S : [1])) {
          for (const warp of c.warps) {
            if (warp !== 1 && gateS !== 1) continue;
            const m = { profile: p, travel: c.travel, startAt: 0, uHide, warp };
            const toGate = timeAtS(m, gateS);
            const beatMs = Math.max(420, Math.min(900, Math.round((toGate + 900) / 3)));
            const targetAt = beatMs * LAUNCH_BEATS;
            const launchAt = targetAt - toGate;
            assert(
              launchAt > 2 * beatMs,
              `${diff} L${lv} ${p} gate=${gateS} warp=${warp}: release falls at ${launchAt.toFixed(0)}ms, `
                + `before beat 2 (${2 * beatMs}ms) — no tempo to lock onto yet`,
            );
            assert(
              launchAt < targetAt - 250,
              `${diff} L${lv} ${p} gate=${gateS} warp=${warp}: release falls ${(targetAt - launchAt).toFixed(0)}ms `
                + 'before the target beat — too late to be a prediction',
            );
          }
        }
      }
    }
  }
}

/* Easy must stay the plain game. Someone meeting this for the first time gets
   one shape, one gate, one speed — every new lever is a later tier's job. */
{
  const e = levelCfg('easy', LEVELS_PER_TIER);
  assert(e.gates === 1, 'easy L100 deals two gates — the entry tier should stay the plain task');
  assert(e.warps.length === 1, 'easy L100 warps — the entry tier should stay the plain task');
  assert(e.launchShare === 0, 'easy L100 deals launch trials — the entry tier should stay the plain task');
  assert(e.movers === 1, 'easy L100 deals two movers');
}

/* ── 4. Survival must never ease off ─────────────────────────────────────── */
let prev = -Infinity;
let maxSurvivalMovers = 0;
for (let stage = 0; stage < 60; stage++) {
  const c = survivalCfg(stage);
  const load = ordinalLoad(c);
  assert(load >= prev - 1e-6, `survival stage ${stage}: difficulty dropped`);
  assert(c.visibleMs >= MIN_VISIBLE_MS, `survival stage ${stage}: only ${c.visibleMs}ms visible`);
  assert(c.tol >= MIN_TOLERANCE, `survival stage ${stage}: window ${c.tol}ms below the floor`);
  assert(c.mission?.sector === Math.floor(stage / WAVES_PER_SECTOR) + 1, `survival stage ${stage}: wrong sector`);
  assert(c.mission?.wave === (stage % WAVES_PER_SECTOR) + 1, `survival stage ${stage}: wrong wave`);
  assert(c.mission?.surge === (c.mission.wave === WAVES_PER_SECTOR), `survival stage ${stage}: wrong surge marker`);
  maxSurvivalMovers = Math.max(maxSurvivalMovers, c.movers);
  prev = load;
}
assert(maxSurvivalMovers === 4, `endless scaling reached ${maxSurvivalMovers} movers instead of the capped four`);

/* The late-game scaling is real only if every added threat remains independently
   tappable. Build representative post-curriculum waves with launch disabled (a
   launch is intentionally single-mover) and check every pair, not just the first
   two the authored level curriculum can deal. */
for (const stage of [30, 40, 50]) {
  const c = { ...survivalCfg(stage), launchShare: 0 };
  const tr = buildTrial(c, () => 0.42);
  assert(tr.movers.length === c.movers, `survival stage ${stage}: built ${tr.movers.length}/${c.movers} threats`);
  for (let i = 0; i < tr.movers.length; i++) {
    for (let j = i + 1; j < tr.movers.length; j++) {
      const gap = Math.abs(tr.movers[i].arriveAt - tr.movers[j].arriveAt);
      assert(gap > tr.tol * 2, `survival stage ${stage}: threats ${i}/${j} share one hit window`);
    }
  }
}

/* ── 5. Built trials must be answerable ──────────────────────────────────── */
let seed = 12345;
const rng = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
let trials = 0;
const seenPaths = new Set();
const seenKinds = new Set();
const seenGates = new Set();
const seenWarps = new Set();
let strobed = 0;
for (const diff of TIERS) {
  for (let lv = 1; lv <= LEVELS_PER_TIER; lv += 3) {
    const c = levelCfg(diff, lv);
    for (let k = 0; k < 8; k++) {
      const tr = buildTrial(c, rng);
      trials += 1;
      seenKinds.add(tr.kind);
      assert(
        tr.movers.length === (tr.kind === 'launch' ? 1 : c.movers),
        `${diff} L${lv}: wrong mover count for a ${tr.kind} trial`,
      );
      assert(c.paths.includes(tr.path), `${diff} L${lv}: built a trial on path ${tr.path}, not in the tier`);
      assert(tr.movers.every((m) => m.path === tr.path), `${diff} L${lv}: movers disagree on the path`);
      seenPaths.add(tr.path);
      for (const m of tr.movers) {
        assert(PROFILE_IDS.includes(m.profile), `${diff} L${lv}: unknown profile ${m.profile}`);
        seenGates.add(m.gateS);
        seenWarps.add(m.warp);
        assert(c.warps.includes(m.warp), `${diff} L${lv}: dealt warp ${m.warp}, not in the tier`);
        assert(c.gates > 1 || m.gateS === 1, `${diff} L${lv}: dealt a near gate on a one-gate level`);

        /*
         * ⚠ THE RENDERER AND THE SCORER MUST AGREE. positionAt draws the shape;
         * timeAtS decides when it counts as arrived. They are inverses by
         * construction, and this asserts it on the built object rather than
         * trusting it — a mover drawn crossing at one instant and scored at
         * another is the exact bug that would be invisible in play and would
         * make every error reading a lie.
         */
        assert(
          Math.abs(positionAt(m, m.arriveAt) - m.gateS) < 1e-6,
          `${diff} L${lv}: the shape is not at its gate when it is scored as arriving`,
        );
        assert(Math.abs(positionAt(m, m.endAt) - 1) < 1e-9, `${diff} L${lv}: mover never reaches the end of the route`);
        assert(m.arriveAt <= m.endAt + 1e-9, `${diff} L${lv}: arrival is after the route ends`);

        // A perfect tap must score, and be recognised as perfect.
        assert(scoreTap(m, m.arriveAt, tr.tol).hit, `${diff} L${lv}: a perfect tap does not register as a hit`);
        assert(scoreTap(m, m.arriveAt, tr.tol).perfect, `${diff} L${lv}: a perfect tap is not graded perfect`);
        assert(!scoreTap(m, m.arriveAt + tr.tol + 1, tr.tol).hit, `${diff} L${lv}: a tap outside the window still counts`);

        /* Warp without a glimpse is unobservable; a glimpse without warp is a
           free hint. Both directions are asserted, because the pairing is the
           only thing that makes warp fair. */
        if (m.warp !== 1) {
          strobed += 1;
          assert(m.strobeAt != null, `${diff} L${lv}: a warped mover was dealt with no glimpse`);
          assert(m.gateS === 1, `${diff} L${lv}: a warped mover was aimed at the near gate`);
          assert(m.strobeAt >= m.hideTime, `${diff} L${lv}: the glimpse falls before the cover starts`);
          const react = m.arriveAt - (m.strobeAt + m.strobeMs);
          assert(
            react >= MIN_REACT_MS - 0.5,
            `${diff} L${lv}: the glimpse ends ${react.toFixed(0)}ms before the crossing — too late to act on`,
          );
        } else {
          assert(m.strobeAt == null, `${diff} L${lv}: an unwarped mover was given a free glimpse`);
        }
      }
      if (tr.movers.length > 1) {
        const [a, b] = tr.movers;
        assert(
          Math.abs(a.arriveAt - b.arriveAt) > tr.tol * 2,
          `${diff} L${lv}: two movers arrive within one hit window — a single tap would answer both`,
        );
      }
      if (tr.kind === 'launch') {
        assert(tr.beatMs > 0 && tr.targetAt > 0, `${diff} L${lv}: launch trial has no tempo`);
        assert(
          Math.abs(tr.launchAt + tr.toGate - tr.targetAt) < 1e-6,
          `${diff} L${lv}: the ideal release does not put the arrival on the target beat`,
        );
        assert(scoreLaunch(tr, tr.launchAt).perfect, `${diff} L${lv}: a perfect release is not graded perfect`);
        assert(!scoreLaunch(tr, tr.launchAt + tr.tol + 1).hit, `${diff} L${lv}: a release outside the window still counts`);
      }
    }
  }
}

/* Every authored route must actually be dealt. A path added to BASE but never
   reached by the draw is content nobody sees. */
for (const id of PATH_IDS) {
  assert(seenPaths.has(id), `path ${id} is authored but was never dealt in ${trials} simulated trials`);
}
/* And so must every lever. A warp authored in WARPS, a second gate, or a launch
   share that the draw never actually produces is work nobody plays — the same
   failure as an unreachable path, and just as invisible. */
for (const w of WARPS) assert(seenWarps.has(w), `warp ${w} is authored but was never dealt in ${trials} trials`);
for (const g of GATE_S) assert(seenGates.has(g), `gate ${g} is authored but was never dealt in ${trials} trials`);
assert(seenKinds.has('launch'), `no launch trial was dealt in ${trials} trials`);
assert(seenKinds.has('intercept'), `no ordinary trial was dealt in ${trials} trials`);
assert(strobed > 0, 'no warped mover was ever dealt, so the glimpse is dead content');

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
  kindsDealt: [...seenKinds].join('+'),
  gatesDealt: seenGates.size,
  warpsDealt: seenWarps.size,
  warpedMovers: strobed,
  easyVisibleMs: levelCfg('easy', 1).visibleMs,
  hardestVisibleMs: levelCfg('hard', LEVELS_PER_TIER).visibleMs,
  hardestWindowMs: levelCfg('hard', LEVELS_PER_TIER).tol,
  baseTiers: Object.keys(BASE).length,
});
