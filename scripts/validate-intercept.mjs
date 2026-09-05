#!/usr/bin/env node
/*
 * validate:intercept — Rift Defense.
 *
 * ⚠ THIS GATE ASSERTS WHAT A PLAYER MEETS, NEVER WHAT THE CONFIG SAYS.
 *
 * That distinction is the whole reason it exists, and this repo has learned it
 * twice the hard way. audit:fq certified Cancellation for months on "targets go
 * up, time goes down" while the game granted 11 seconds for 45 seconds of work.
 * audit:mot passed Target Tracking while a density rescale had quietly stopped
 * the difficulty model grading at all. Both validated the AUTHORED NUMBERS.
 *
 * So every check below runs against a BUILT WAVE — the actual marchers, with
 * their actual arrival times — and several re-derive the answer with arithmetic
 * that does not share code with the game.
 *
 * What it proves:
 *   · one player can clear every wave       (feasibility, by covering proof)
 *   · every marcher is strikeable long enough to see and hit
 *   · a hidden marcher was VISIBLE first, so prediction has something to go on
 *   · the no-go share stays inside the band where inhibition is measurable
 *   · a wave never opens on a no-go marcher
 *   · barrels sit inside a weapon's reach
 *   · every band introduces its mechanic, on its own edge
 *   · the curve is monotonic and the floors hold at every level
 *   · all three measures survive into the results
 *
 * ── 2026-09-05: THE INPUT CHANGED, SO THE PROOF DID ──
 * The player fires WEAPONS from buttons and never touches a marcher. That means
 * a press serves everything standing in that weapon's stretch (the wave got
 * easier) while each weapon has its own reload, far longer than the old thumb
 * gap (the wave got harder). Section 8 below asserts the invariants the new
 * model rests on — every weapon can fire at least once inside a dwell, the
 * mortar's blast never reaches a neighbour's ground, and armour is never marked
 * for a weapon that cannot take it in one shot.
 */
import {
  LADDER, LADDER_BASE, BLAST_CLEARANCE, BLAST_FRAC, COLOURS, KIND, LADDER_LEVELS,
  MIN_DWELL_MS, MIN_TOLERANCE_MS, MIN_VISIBLE_MS,
  NOGO_MAX_SHARE, NOGO_MIN_SHARE, RING_AT, TRAIL_SEGS, WEAPON_SPECS,
  buildWave, dwellMs, feasible, levelCfg, mechanics, passCfg, posAt,
  summarise, survivalCfg, visibleMs,
} from '../src/features/training/domains/speed/games/intercept/data.js';

const problems = [];
const fail = (m) => problems.push(m);

/* A local mulberry32, deliberately NOT the game's. If the gate and the game
 * shared an RNG, a bug in it would cancel out and both would agree on nonsense. */
function rngFor(seed) {
  let a = 0;
  for (let i = 0; i < seed.length; i += 1) a = (a + seed.charCodeAt(i) * (i + 7)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── 0. the trail itself ───────────────────────────────────────────────── */
{
  if (!(TRAIL_SEGS.total > 0)) fail('trail: zero length');
  const a = posAt(0);
  const b = posAt(1);
  if (Math.hypot(a.x - b.x, a.y - b.y) < 0.3) fail('trail: start and gate are nearly the same point');

  // posAt must agree with the polyline it is walking.
  let prev = posAt(0);
  let walked = 0;
  for (let i = 1; i <= 400; i += 1) {
    const p = posAt(i / 400);
    walked += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  if (Math.abs(walked - TRAIL_SEGS.total) > 0.01) {
    fail(`trail: posAt walks ${walked.toFixed(3)} but the polyline is ${TRAIL_SEGS.total.toFixed(3)}`);
  }
  for (let i = 0; i <= 100; i += 1) {
    const p = posAt(i / 100);
    if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) { fail(`trail: leaves the field at f=${i / 100}`); break; }
  }
}

/* ── 1. every level of every tier, as a built wave ─────────────────────── */
let wavesChecked = 0;
let unitsChecked = 0;

function checkWave(label, cfg, wave) {
  wavesChecked += 1;
  unitsChecked += wave.units.length;

  // (a) a perfect player can clear it
  const f = feasible(wave);
  if (!f.ok) {
    fail(`${label}: NOT CLEARABLE — ${f.failedAt} needs a hit by ${Math.round(f.deadline)}ms `
      + `but the earliest available is ${Math.round(f.need)}ms (${f.reason || 'no window'})`);
  }

  /* (a2) armour is never marked for a weapon that needs two shots to kill it.
   * Two turret-bound armoured marchers back to back is serviceable by
   * milliseconds or not at all — the worst cell of this wave builder's
   * cross-product, and exactly the kind nobody enumerates by playing. */
  for (const u of wave.units) {
    if (u.kind !== KIND.ARMOUR || u.towerIdx < 0) continue;
    const tw = (cfg.towers || [])[u.towerIdx];
    if (!tw) continue;
    if (!tw.heavy && (cfg.towers || []).some((x) => x.heavy)) {
      fail(`${label}: ${u.id} wears armour and is bound to the ${tw.weapon}, which cannot take it in one shot`);
      break;
    }
  }

  /* (b) each marcher is strikeable long enough to see and hit — PER WINDOW.
   *
   * ⚠ Measuring `u.exitAt - u.enterAt` is the trap here, and it is the same
   * trap audit:pacing caught in Story Time. Those two now bracket EVERY tower,
   * so their difference includes the long walk BETWEEN reaches — time in which
   * the marcher cannot be struck at all. A wave whose every window was far
   * under the floor would report a comfortable dwell and sail through. The
   * floor belongs to the window, because the window is what the thumb meets. */
  for (const u of wave.units) {
    const wins = u.windows || [{ enterAt: u.enterAt, exitAt: u.exitAt, hideAt: u.hideAt }];
    let bad = false;
    for (const w of wins) {
      const dwell = w.exitAt - w.enterAt;
      if (dwell < MIN_DWELL_MS - 1) {
        fail(`${label}: ${u.id} is strikeable for only ${dwell}ms at the tower on `
          + `${(w.at ?? 0).toFixed(2)} (floor ${MIN_DWELL_MS}ms)${u.sprint ? ' [sprinter]' : ''}`);
        bad = true; break;
      }
      if (w.enterAt >= w.exitAt) { fail(`${label}: ${u.id} enters a reach after it leaves`); bad = true; break; }
      if (w.exitAt > u.gateAt) { fail(`${label}: ${u.id} reaches the gate before leaving a reach`); bad = true; break; }
    }
    if (bad) break;
  }

  // (c) a hidden marcher must have been visible first — again, per window
  if (cfg.hiddenShare > 0) {
    let bad = false;
    for (const u of wave.units) {
      const wins = u.windows || [{ enterAt: u.enterAt, hideAt: u.hideAt }];
      for (const w of wins) {
        const seen = w.hideAt - w.enterAt;
        if (seen < MIN_VISIBLE_MS - 1) {
          fail(`${label}: ${u.id} visible for only ${seen}ms before the canopy at the tower `
            + `on ${(w.at ?? 0).toFixed(2)} (floor ${MIN_VISIBLE_MS}ms)`);
          bad = true; break;
        }
      }
      if (bad) break;
    }
  }

  /* (b2) the towers must not overlap. `boundOf` marks a marcher for exactly one
   * of them, so overlapping reaches would make "which tower is this for"
   * undecidable from where it is standing. Checked on the BUILT geometry
   * because the spans shrink with the curve while the centres stay put. */
  const tw = cfg.towers || [];
  for (let i = 1; i < tw.length; i += 1) {
    if (tw[i].a < tw[i - 1].b - 1e-9) {
      fail(`${label}: towers on ${tw[i - 1].at.toFixed(2)} and ${tw[i].at.toFixed(2)} overlap `
        + `([${tw[i - 1].a.toFixed(3)}, ${tw[i - 1].b.toFixed(3)}] vs [${tw[i].a.toFixed(3)}, ${tw[i].b.toFixed(3)}])`);
      break;
    }
  }

  /* (b3) a bound marcher answers to exactly ONE tower, an unbound one to all of
   * them. If binding silently stopped narrowing the windows the mechanic would
   * still be announced in the UI while changing nothing about the game. */
  for (const u of wave.units) {
    const want = u.towerIdx >= 0 ? 1 : Math.max(1, cfg.nTowers || 1);
    if ((u.windows || []).length !== want) {
      fail(`${label}: ${u.id} has ${(u.windows || []).length} window(s), expected ${want} `
        + `(towerIdx ${u.towerIdx}, ${cfg.nTowers} tower(s))`);
      break;
    }
  }
  if (!(cfg.boundShare > 0) && wave.units.some((u) => u.towerIdx >= 0)) {
    fail(`${label}: a marcher is bound to one tower on a level with no binding`);
  }

  // (d) the no-go share stays inside the band inhibition is measurable in
  const nogo = wave.units.filter((u) => u.kind === KIND.NOGO).length;
  const share = nogo / wave.units.length;
  if (cfg.nogoShare > 0) {
    if (nogo === 0) {
      fail(`${label}: nogoShare is ${cfg.nogoShare.toFixed(2)} but the wave has no no-go marcher`);
    } else if (share < NOGO_MIN_SHARE - 0.001 || share > NOGO_MAX_SHARE + 0.001) {
      fail(`${label}: no-go share ${(share * 100).toFixed(0)}% is outside the `
        + `${NOGO_MIN_SHARE * 100}–${NOGO_MAX_SHARE * 100}% band`);
    }
  } else if (nogo > 0) {
    fail(`${label}: no-go marchers appeared on a level that should have none`);
  }

  // (e) a wave never opens on a no-go — withholding needs a prepotent response
  if (wave.units.length && wave.units[0].kind === KIND.NOGO) {
    fail(`${label}: the wave opens on a no-go marcher`);
  }

  // (f) go and no-go must be tellable apart
  if (nogo > 0 && wave.goColour === wave.nogoColour) {
    fail(`${label}: the go and no-go colours are identical`);
  }
  for (const u of wave.units) {
    const want = u.kind === KIND.NOGO ? wave.nogoColour : wave.goColour;
    if (u.colour !== want) { fail(`${label}: ${u.id} is the wrong colour for its kind`); break; }
    if (!COLOURS.includes(u.colour)) { fail(`${label}: ${u.id} has an unknown colour`); break; }
  }

  /* (g) barrels sit inside SOME tower's reach, or they are scenery. */
  const reaches = (cfg.towers || []).length
    ? cfg.towers
    : [{ a: cfg.ringA, b: cfg.ringB, at: RING_AT }];
  for (const b of wave.barrels) {
    if (!reaches.some((r) => b.at >= r.a - 1e-9 && b.at <= r.b + 1e-9)) {
      fail(`${label}: barrel ${b.id} at ${b.at.toFixed(3)} is inside no tower's reach `
        + `(${reaches.map((r) => `[${r.a.toFixed(3)}, ${r.b.toFixed(3)}]`).join(' ')})`);
    }
  }

  // (h) at least one strikeable marcher, or the level cannot be played
  if (!wave.units.some((u) => u.kind !== KIND.NOGO)) {
    fail(`${label}: every marcher is a no-go — nothing to strike`);
  }
}

/* ⚠ ONE LADDER since 2026-08-28 — 60 levels, not three tiers of a hundred. */
{
  for (let lv = 1; lv <= LADDER_LEVELS; lv += 1) {
    const cfg = levelCfg(lv);

    if (cfg.tolMs < MIN_TOLERANCE_MS) fail(`L${lv}: tolerance ${cfg.tolMs}ms below the floor`);
    if (dwellMs(cfg) < MIN_DWELL_MS - 1) fail(`L${lv}: dwell ${Math.round(dwellMs(cfg))}ms below the floor`);
    if (cfg.hiddenShare > 0 && visibleMs(cfg) < MIN_VISIBLE_MS - 1) {
      fail(`L${lv}: only ${Math.round(visibleMs(cfg))}ms visible before the canopy`);
    }
    if (cfg.ringA < 0 || cfg.ringB > 1) fail(`L${lv}: the tower's reach runs off the trail`);
    if (cfg.hiddenShare > 1.0001) fail(`L${lv}: hiddenShare above 1`);

    /* The ladder is short enough to build a wave on EVERY level now — 60×3
       seeds, where 300 levels × seeds was a gate nobody would run. */
    for (const seed of ['a', 'b', 'c']) {
      checkWave(`L${lv} (${seed})`, cfg, buildWave(rngFor(`${lv}-${seed}`), cfg, lv));
    }
  }
}

/* ── 2. survival and pass n play ───────────────────────────────────────── */
for (let stage = 0; stage <= 30; stage += 1) {
  const cfg = survivalCfg(stage);
  if (dwellMs(cfg) < MIN_DWELL_MS - 1) fail(`survival s${stage}: dwell below the floor`);
  if (cfg.hiddenShare > 0 && visibleMs(cfg) < MIN_VISIBLE_MS - 1) fail(`survival s${stage}: too little visible`);
  if (stage % 3 === 0) {
    checkWave(`survival s${stage}`, cfg, buildWave(rngFor(`s${stage}`), cfg, stage + 1));
  }
}
{
  const cfg = passCfg();
  checkWave('passplay', cfg, buildWave(rngFor('pass'), cfg, 1));
}

/* ── 3. the curve actually climbs ──────────────────────────────────────── */
{
  const diff = 'ladder';
  const lo = levelCfg(1);
  const hi = levelCfg(LADDER_LEVELS);
  if (hi.count <= lo.count) fail(`${diff}: the wave never gets bigger (${lo.count} → ${hi.count})`);
  if (hi.crossMs >= lo.crossMs) fail(`${diff}: the march never gets faster`);
  if (hi.gapMs >= lo.gapMs) fail(`${diff}: the column never tightens`);

  for (let lv = 2; lv <= LADDER_LEVELS; lv += 1) {
    const a = levelCfg(lv - 1);
    const b = levelCfg(lv);
    if (b.count < a.count) { fail(`${diff} L${lv}: the wave shrank`); break; }
    if (b.crossMs > a.crossMs) { fail(`${diff} L${lv}: the march slowed`); break; }
    if (b.gapMs > a.gapMs) { fail(`${diff} L${lv}: the column loosened`); break; }
  }
}

/* The old cross-tier check ("hard must beat med at the same level number")
 * retired with the tiers. Monotonicity across the one climb, asserted at every
 * level just above, is the same promise and a stronger version of it. */

/* ── 4. every BAND introduces something, and it arrives on the band edge ──
 *
 * ⚠ This is the check that caught the previous build shipping a tier with ONE
 * mechanic set across all 100 levels. On the ladder it becomes sharper: each of
 * the six bands must add exactly the mechanic its LADDER entry claims, and it
 * must be absent on the last level of the band before. `audit:curves` proves no
 * band is inert; this proves the band introduces the RIGHT thing, on time.
 */
{
  const at = (lv) => mechanics(levelCfg(lv));
  const sets = new Set();
  for (let lv = 1; lv <= LADDER_LEVELS; lv += 1) sets.add(at(lv).join('+'));
  if (sets.size < LADDER.length) {
    fail(`only ${sets.size} distinct mechanic sets across ${LADDER_LEVELS} levels, `
      + `but the ladder declares ${LADDER.length} bands — a band introduces nothing`);
  }

  LADDER.forEach((band, b) => {
    const first = b * 10 + 1;
    for (const want of band.adds || []) {
      if (want === 'strike') continue; // the core, on from L1 by definition
      if (!at(first).includes(want)) {
        fail(`band ${b + 1} (L${first}): declares it introduces "${want}", but the level does not have it`);
      }
      if (b > 0 && at(first - 1).includes(want)) {
        fail(`L${first - 1}: "${want}" is already present the level BEFORE the band that introduces it `
          + '— the mechanic has drifted off its band edge (check bandStartF, not a hand-typed threshold)');
      }
    }
  });

  /* The first band must never hide the trail: a new player learns by seeing. */
  for (let lv = 1; lv <= 10; lv += 1) {
    if (levelCfg(lv).hiddenShare > 0) { fail(`L${lv}: canopy in the first band`); break; }
  }
  /* …and each headline mechanic must actually appear somewhere. */
  for (const want of ['nogo', 'canopy', 'barrel', 'armour', 'shuffle']) {
    if (![...sets].some((s) => s.split('+').includes(want))) {
      fail(`the ${want} mechanic never appears at any level of the ladder`);
    }
  }
}

/* ── 5. SELF-TEST: an unclearable wave MUST be rejected ────────────────────
 * ⚠ A feasibility check that always returns ok is indistinguishable from one
 * that works, and this repo has shipped three detectors that measured nothing
 * while reporting everything as fine. So plant a wave one thumb provably cannot
 * serve and require the checker to say so.
 */
{
  const COOL = 500;
  const win = (weapon, enterAt, exitAt, extra = {}) => ({
    weapon, enterAt, exitAt, hideAt: exitAt, at: 0.5, coolMs: COOL, flightMs: 0, heavy: false, ...extra,
  });
  const unit = (id, windows, over = {}) => ({
    id, kind: KIND.GO, taps: 1, colour: 'steel',
    enterAt: windows[0].enterAt, exitAt: windows[windows.length - 1].exitAt,
    gateAt: windows[windows.length - 1].exitAt + 900, windows, ...over,
  });

  /*
   * ⚠ THE OLD PLANT STOPPED BEING A PLANT, and that is the single most
   * important thing about this block.
   *
   * It was three marchers sharing one 0–100ms window, unclearable when each
   * needed its own tap. A press now serves EVERYTHING in the stretch, so one
   * shot clears all three and the wave is trivially fine — the plant would have
   * passed, the gate would have reported OK, and nobody would have learned that
   * `feasible` had stopped checking anything. This repo has shipped three
   * detectors that measured nothing while reporting everything as fine.
   *
   * What is genuinely unclearable now is SEPARATION: windows that do not
   * overlap, closer together than the reload.
   */
  const tooFast = {
    units: [
      unit('x1', [win('turret', 0, 100)]),
      unit('x2', [win('turret', 200, 300)]),
      unit('x3', [win('turret', 400, 500)]),
    ],
    barrels: [], goColour: 'steel', nogoColour: 'rust', waveNo: 0,
  };
  if (feasible(tooFast).ok) {
    fail(`SELF-TEST: feasible() passed three separated windows 200ms apart on one ${COOL}ms reload `
      + '— it is not checking the cooldown');
  }

  /* The same three marchers, but standing in the stretch together: one press
     serves all of them, so this MUST pass. If it does not, the proof has
     forgotten that a shot hits a group and would reject playable waves. */
  const together = {
    units: [
      unit('y1', [win('turret', 0, 900)]),
      unit('y2', [win('turret', 300, 1100)]),
      unit('y3', [win('turret', 500, 1300)]),
    ],
    barrels: [], goColour: 'steel', nogoColour: 'rust', waveNo: 0,
  };
  const tf = feasible(together);
  if (!tf.ok) fail('SELF-TEST: feasible() rejected three marchers one press could clear together');
  else if (tf.presses !== 1) fail(`SELF-TEST: three overlapping marchers should cost ONE press, not ${tf.presses}`);

  /* Armour on a non-heavy weapon needs two hits a reload apart INSIDE its own
     window. 600ms of window against a 500ms reload fits; 400ms does not. */
  const armourOk = {
    units: [unit('a1', [win('turret', 0, 600)], { kind: KIND.ARMOUR, taps: 2 })],
    barrels: [], goColour: 'steel', nogoColour: 'rust', waveNo: 0,
  };
  if (!feasible(armourOk).ok) fail('SELF-TEST: feasible() rejected armour that two shots comfortably fit');
  const armourNo = {
    units: [unit('a2', [win('turret', 0, 400)], { kind: KIND.ARMOUR, taps: 2 })],
    barrels: [], goColour: 'steel', nogoColour: 'rust', waveNo: 0,
  };
  if (feasible(armourNo).ok) fail('SELF-TEST: feasible() passed armour needing two shots inside one reload');

  /* A heavy weapon takes armour in one, so the same impossible window is fine. */
  const armourHeavy = {
    units: [unit('a3', [win('missile', 0, 400, { heavy: true, flightMs: 300 })], { kind: KIND.ARMOUR, taps: 2 })],
    barrels: [], goColour: 'steel', nogoColour: 'rust', waveNo: 0,
  };
  if (!feasible(armourHeavy).ok) fail('SELF-TEST: feasible() ignored that a heavy shell takes armour outright');

  /* ⚠ A shell cannot land before it has flown. A window entirely inside the
     flight time is unreachable however good the player is. */
  const tooSoon = {
    units: [unit('f1', [win('mortar', 0, 300, { flightMs: 900 })])],
    barrels: [], goColour: 'steel', nogoColour: 'rust', waveNo: 0,
  };
  if (feasible(tooSoon).ok) fail('SELF-TEST: feasible() passed a window that closes before the shell could arrive');

  /* Two weapons must keep SEPARATE clocks. If they shared one, this would fail. */
  const twoGuns = {
    units: [
      unit('g1', [win('turret', 0, 100)]),
      unit('g2', [win('missile', 120, 220, { flightMs: 0 })]),
    ],
    barrels: [], goColour: 'steel', nogoColour: 'rust', waveNo: 0,
  };
  if (!feasible(twoGuns).ok) fail('SELF-TEST: feasible() is sharing one reload clock across weapons');

  /* A bound marcher answers to ONE weapon: firing the other must not serve it.
     If this passes, `landShot`'s weapon match is not being modelled. */
  const boundWrong = {
    units: [
      unit('b1', [win('turret', 0, 100)]),
      unit('b2', [win('turret', 150, 250)]),
    ],
    barrels: [], goColour: 'steel', nogoColour: 'rust', waveNo: 0,
  };
  if (feasible(boundWrong).ok) fail('SELF-TEST: two turret-bound marchers 150ms apart cannot both be served');
}

/* ── 6. the scoring reports all three measures ─────────────────────────────
 * A summary that silently dropped the inhibition or prediction numbers would
 * make the whole layered design invisible — the failure that matters most here,
 * because the game would still be fun and would have stopped measuring.
 */
{
  const s = summarise([
    { type: 'hit', rt: 400, hidden: false },
    { type: 'hit', rt: 500, hidden: true, err: -30 },
    { type: 'hit', rt: 460, hidden: true, err: 50 },
    { type: 'commission' },
    { type: 'withheld' },
    { type: 'withheld' },
    { type: 'miss' },
  ]);
  if (s.kills !== 3) fail('summarise: wrong kill count');
  if (s.misses !== 1) fail('summarise: wrong miss count');
  if (s.commissions !== 1) fail('summarise: commission errors are not reported');
  if (s.nogoTotal !== 3) fail('summarise: the no-go opportunity count is wrong');
  if (s.hidden !== 2) fail('summarise: hidden-strike count is wrong');
  if (s.bias !== 10) fail(`summarise: signed bias should be +10ms, got ${s.bias}`);
  if (!(s.rt > 0)) fail('summarise: reaction time is not reported');
  const empty = summarise([]);
  if (empty.nogoTotal !== 0 || empty.kills !== 0) fail('summarise: an empty log should be all zeros');
}

/* ── 7. shape sanity ───────────────────────────────────────────────────── */
if (!(BLAST_FRAC > 0.02 && BLAST_FRAC < 0.25)) {
  fail(`BLAST_FRAC ${BLAST_FRAC} is either invisible or clears the whole trail`);
}
if (!(RING_AT > 0.3 && RING_AT < 0.9)) fail('the tower sits too near an end of the trail');
/* The ladder's mechanic onsets must be DERIVED from band edges, never typed.
   If a threshold is missing the mechanic silently never arrives. */
for (const k of ['nogoFrom', 'barrelFrom', 'armourFrom', 'hiddenFrom', 'shuffleFrom', 'missileFrom', 'boundFrom', 'mortarFrom']) {
  if (!Number.isFinite(LADDER_BASE[k])) fail(`LADDER_BASE.${k} is not a number — the mechanic will never turn on`);
}

/* ── 8. THE WEAPONS ────────────────────────────────────────────────────────
 *
 * Everything the button-driven model rests on, asserted against BUILT levels
 * rather than the authored specs — because both the reload and the blast yield
 * to geometry that changes at every level, and it is precisely the "authored
 * number that the built config does not honour" that this gate exists to catch.
 */
{
  const kinds = WEAPON_SPECS.map((w) => w.kind);
  if (new Set(kinds).size !== kinds.length) fail(`two weapons share a kind: ${kinds.join(', ')}`);
  if (WEAPON_SPECS[0].flightMs !== 0) fail('the FIRST weapon must hit instantly — it is the one a new player learns on');
  if (!WEAPON_SPECS.slice(1).every((w) => w.flightMs > 0)) {
    fail('every weapon after the first must fly — otherwise the ladder unlocks a second copy of the turret');
  }
  if (!WEAPON_SPECS.slice(1).every((w) => w.heavy)) {
    fail('a flying weapon must be heavy: its reload cannot fit two hits in one dwell, so bound armour would be unkillable');
  }

  for (let lv = 1; lv <= LADDER_LEVELS; lv += 1) {
    const cfg = levelCfg(lv);
    const towers = cfg.towers || [];
    const dwell = dwellMs(cfg);
    let stop = false;

    for (let i = 0; i < towers.length && !stop; i += 1) {
      const tw = towers[i];
      if (!tw.weapon || !Number.isFinite(tw.coolMs) || !Number.isFinite(tw.flightMs)) {
        fail(`L${lv}: the stretch at ${tw.at.toFixed(2)} carries no weapon`); stop = true; break;
      }
      /* (a) EVERY WEAPON CAN FIRE AT LEAST ONCE WHILE A MARCHER STANDS IN ITS
         STRETCH. This is the invariant COOL_DWELL_MAX buys, and without it a
         marcher bound to a slow weapon simply cannot be served — which reads to
         a player as an unfair level, not as a bug. */
      if (tw.coolMs > dwell) {
        fail(`L${lv}: the ${tw.weapon} reloads in ${tw.coolMs}ms but a marcher is only strikeable for `
          + `${Math.round(dwell)}ms — it cannot answer its own stretch`);
        stop = true; break;
      }
      /* (b) a non-heavy weapon must fit BOTH armour hits inside one dwell. */
      if (!tw.heavy && tw.coolMs * 2 > dwell + 1) {
        fail(`L${lv}: the ${tw.weapon} cannot take armour — two hits need ${tw.coolMs * 2}ms `
          + `inside a ${Math.round(dwell)}ms dwell`);
        stop = true; break;
      }
      /*
       * ⚠ THERE IS DELIBERATELY NO "FLIGHT MUST FIT INSIDE THE DWELL" RULE, and
       * the first version of this gate had one — it failed L84 for a mortar
       * whose 980ms shell "could never land on anyone" inside a 970ms dwell.
       * That reasoning is simply wrong. Flight time is a LEAD, not a window: you
       * press before the marcher arrives and the shell lands while they are
       * standing there. The only genuine constraint is that a shell cannot land
       * before it has flown, which bites when a window CLOSES inside the flight
       * time — and that is enforced where it belongs, inside `feasible`, and
       * planted in the `tooSoon` self-test above.
       *
       * Measure a constraint before asserting it. A gate that fails working code
       * gets weakened or muted, and then it is protecting nothing.
       */
      /* (d) THE BLAST MUST NOT REACH A NEIGHBOUR'S GROUND. `boundOf` marks a
         marcher for exactly one weapon, and that is only decidable from where
         it stands if the weapons' reachable stretches stay disjoint. Checked on
         built geometry: the spans shrink with the curve while the centres do
         not move, so the gap between them is different at every level. */
      const lo = tw.a - (tw.blast || 0);
      const hi = tw.b + (tw.blast || 0);
      if (lo < -1e-9 || hi > 1 + 1e-9) {
        fail(`L${lv}: the ${tw.weapon}'s blast runs off the trail ([${lo.toFixed(3)}, ${hi.toFixed(3)}])`);
        stop = true; break;
      }
      const prev = towers[i - 1];
      if (prev) {
        const prevHi = prev.b + (prev.blast || 0);
        if (lo < prevHi + BLAST_CLEARANCE - 1e-9) {
          fail(`L${lv}: the ${tw.weapon} reaches ${lo.toFixed(3)} but the ${prev.weapon} already `
            + `reaches ${prevHi.toFixed(3)} — "which weapon is this marcher for" is no longer decidable`);
          stop = true; break;
        }
      }
    }
    if (stop) break;
  }

  /* (e) the weapons arrive in the order the ladder promises, and never vanish. */
  const kindsAt = (lv) => (levelCfg(lv).towers || []).map((tw) => tw.weapon);
  if (kindsAt(1).length !== 1 || kindsAt(1)[0] !== 'turret') fail('L1 must be the turret alone');
  if (!kindsAt(61).includes('missile')) fail('L61 must have the missile — the band says so');
  if (kindsAt(60).includes('missile')) fail('L60 already has the missile — it has drifted off its band edge');
  if (!kindsAt(81).includes('mortar')) fail('L81 must have the mortar — the band says so');
  if (kindsAt(80).includes('mortar')) fail('L80 already has the mortar — it has drifted off its band edge');
  for (let lv = 2; lv <= LADDER_LEVELS; lv += 1) {
    const a = kindsAt(lv - 1);
    const b = kindsAt(lv);
    if (a.some((k) => !b.includes(k))) { fail(`L${lv}: a weapon the player had at L${lv - 1} disappeared`); break; }
  }
}

/* ── report ────────────────────────────────────────────────────────────── */
if (problems.length) {
  console.error('validate:intercept FAILED\n');
  for (const p of problems.slice(0, 40)) console.error('  · ' + p);
  if (problems.length > 40) console.error(`  … and ${problems.length - 40} more`);
  process.exit(1);
}

console.log(
  `validate:intercept OK — ${wavesChecked} waves / ${unitsChecked} marchers checked as a player meets them.\n`
  + '  clearability by a covering proof over per-weapon reloads, strike dwell,\n'
  + '  visible-before-hidden, the Go/No-Go share band, no wave opening on a\n'
  + '  no-go, barrels inside a reach, armour never bound to a weapon that cannot\n'
  + '  take it, every weapon able to answer its own stretch, the mortar blast\n'
  + '  clear of its neighbours, the weapons arriving on their band edges, the\n'
  + '  curve, and all three measures reaching the results.',
);
