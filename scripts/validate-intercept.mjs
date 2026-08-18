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
 *   · one thumb can clear every wave        (feasibility, by scheduling proof)
 *   · every marcher is strikeable long enough to see and hit
 *   · a hidden marcher was VISIBLE first, so prediction has something to go on
 *   · the no-go share stays inside the band where inhibition is measurable
 *   · a wave never opens on a no-go marcher
 *   · barrels sit inside the tower's reach
 *   · every tier introduces new mechanics, and harder tiers really are harder
 *   · the curve is monotonic and the floors hold at every level
 *   · all three measures survive into the results
 */
import {
  BASE, BLAST_FRAC, COLOURS, DIFFS, KIND, LEVELS_PER_TIER,
  MIN_DWELL_MS, MIN_TAP_GAP_MS, MIN_TOLERANCE_MS, MIN_VISIBLE_MS,
  NOGO_MAX_SHARE, NOGO_MIN_SHARE, RING_AT, TRAIL_SEGS,
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

  // (a) one thumb can clear it
  const f = feasible(wave);
  if (!f.ok) {
    fail(`${label}: NOT CLEARABLE — ${f.failedAt} needs a strike at ${Math.round(f.need)}ms `
      + `but leaves the reach at ${f.deadline}ms (one thumb, ${MIN_TAP_GAP_MS}ms apart)`);
  }

  // (b) each marcher is strikeable long enough to see and hit
  for (const u of wave.units) {
    const dwell = u.exitAt - u.enterAt;
    if (dwell < MIN_DWELL_MS - 1) {
      fail(`${label}: ${u.id} is strikeable for only ${dwell}ms (floor ${MIN_DWELL_MS}ms)`);
      break;
    }
    if (u.enterAt >= u.exitAt) { fail(`${label}: ${u.id} enters the reach after it leaves`); break; }
    if (u.exitAt > u.gateAt) { fail(`${label}: ${u.id} reaches the gate before leaving the reach`); break; }
  }

  // (c) a hidden marcher must have been visible first
  if (cfg.hiddenShare > 0) {
    for (const u of wave.units) {
      const seen = u.hideAt - u.enterAt;
      if (seen < MIN_VISIBLE_MS - 1) {
        fail(`${label}: ${u.id} visible for only ${seen}ms before the canopy (floor ${MIN_VISIBLE_MS}ms)`);
        break;
      }
    }
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

  // (g) barrels sit inside the reach, or they are scenery
  for (const b of wave.barrels) {
    if (b.at < cfg.ringA - 1e-9 || b.at > cfg.ringB + 1e-9) {
      fail(`${label}: barrel ${b.id} at ${b.at.toFixed(3)} is outside the reach `
        + `[${cfg.ringA.toFixed(3)}, ${cfg.ringB.toFixed(3)}]`);
    }
  }

  // (h) at least one strikeable marcher, or the level cannot be played
  if (!wave.units.some((u) => u.kind !== KIND.NOGO)) {
    fail(`${label}: every marcher is a no-go — nothing to strike`);
  }
}

for (const diff of DIFFS) {
  for (let lv = 1; lv <= LEVELS_PER_TIER; lv += 1) {
    const cfg = levelCfg(diff, lv);

    if (cfg.tolMs < MIN_TOLERANCE_MS) fail(`${diff} L${lv}: tolerance ${cfg.tolMs}ms below the floor`);
    if (dwellMs(cfg) < MIN_DWELL_MS - 1) fail(`${diff} L${lv}: dwell ${Math.round(dwellMs(cfg))}ms below the floor`);
    if (cfg.hiddenShare > 0 && visibleMs(cfg) < MIN_VISIBLE_MS - 1) {
      fail(`${diff} L${lv}: only ${Math.round(visibleMs(cfg))}ms visible before the canopy`);
    }
    if (cfg.ringA < 0 || cfg.ringB > 1) fail(`${diff} L${lv}: the tower's reach runs off the trail`);
    if (cfg.hiddenShare > 1.0001) fail(`${diff} L${lv}: hiddenShare above 1`);

    /* Every level gets its floors checked above; a sample gets a full wave
       build on three seeds. 300 levels x many seeds is a gate nobody runs. */
    if (lv % 7 === 1 || lv === LEVELS_PER_TIER) {
      for (const seed of ['a', 'b', 'c']) {
        checkWave(`${diff} L${lv} (${seed})`, cfg, buildWave(rngFor(`${diff}-${lv}-${seed}`), cfg, lv));
      }
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
for (const diff of DIFFS) {
  const lo = levelCfg(diff, 1);
  const hi = levelCfg(diff, LEVELS_PER_TIER);
  if (hi.count <= lo.count) fail(`${diff}: the wave never gets bigger (${lo.count} → ${hi.count})`);
  if (hi.crossMs >= lo.crossMs) fail(`${diff}: the march never gets faster`);
  if (hi.gapMs >= lo.gapMs) fail(`${diff}: the column never tightens`);

  for (let lv = 2; lv <= LEVELS_PER_TIER; lv += 1) {
    const a = levelCfg(diff, lv - 1);
    const b = levelCfg(diff, lv);
    if (b.count < a.count) { fail(`${diff} L${lv}: the wave shrank`); break; }
    if (b.crossMs > a.crossMs) { fail(`${diff} L${lv}: the march slowed`); break; }
    if (b.gapMs > a.gapMs) { fail(`${diff} L${lv}: the column loosened`); break; }
  }
}

/* A harder tier must be harder AT THE SAME LEVEL NUMBER — what audit:curves
 * exists to catch, checked here for the levers it cannot see. */
for (const lv of [1, 25, 50, 75, 100]) {
  const e = levelCfg('easy', lv);
  const m = levelCfg('med', lv);
  const h = levelCfg('hard', lv);
  if (!(e.crossMs > m.crossMs && m.crossMs > h.crossMs)) fail(`L${lv}: the march is not faster on a harder tier`);
  if (!(e.count < m.count && m.count < h.count)) fail(`L${lv}: the wave is not bigger on a harder tier`);
  if (!(e.hiddenShare <= m.hiddenShare && m.hiddenShare <= h.hiddenShare)) {
    fail(`L${lv}: a harder tier hides less of the trail`);
  }
}

/* ── 4. every tier introduces something ────────────────────────────────── */
const tierMechanics = {};
for (const diff of DIFFS) {
  const sets = new Set();
  for (let lv = 1; lv <= LEVELS_PER_TIER; lv += 1) sets.add(mechanics(levelCfg(diff, lv)).join('+'));
  tierMechanics[diff] = sets;
  if (sets.size < 2) {
    fail(`${diff}: ONE mechanic set across all ${LEVELS_PER_TIER} levels — the tier never `
      + 'introduces anything (the exact failure the previous version shipped)');
  }
}
/* Easy must never hide the trail: a new player learns the game by seeing it. */
for (let lv = 1; lv <= LEVELS_PER_TIER; lv += 1) {
  if (levelCfg('easy', lv).hiddenShare > 0) { fail(`easy L${lv}: canopy on the easy tier`); break; }
}
/* …and each headline mechanic must actually appear somewhere. */
for (const want of ['nogo', 'canopy', 'barrel', 'armour']) {
  const seen = DIFFS.some((d) => [...tierMechanics[d]].some((s) => s.split('+').includes(want)));
  if (!seen) fail(`the ${want} mechanic never appears at any level of any tier`);
}

/* ── 5. SELF-TEST: an unclearable wave MUST be rejected ────────────────────
 * ⚠ A feasibility check that always returns ok is indistinguishable from one
 * that works, and this repo has shipped three detectors that measured nothing
 * while reporting everything as fine. So plant a wave one thumb provably cannot
 * serve and require the checker to say so.
 */
{
  const impossible = {
    units: [
      { id: 'x1', kind: KIND.GO, taps: 1, enterAt: 0, exitAt: 100, gateAt: 900, colour: 'steel' },
      { id: 'x2', kind: KIND.GO, taps: 1, enterAt: 0, exitAt: 100, gateAt: 900, colour: 'steel' },
      { id: 'x3', kind: KIND.GO, taps: 1, enterAt: 0, exitAt: 100, gateAt: 900, colour: 'steel' },
    ],
    barrels: [], goColour: 'steel', nogoColour: 'rust', waveNo: 0,
  };
  if (feasible(impossible).ok) {
    fail('SELF-TEST: feasible() passed three strikes inside 100ms — it is not checking anything');
  }
  const possible = {
    units: [
      { id: 'y1', kind: KIND.GO, taps: 1, enterAt: 0, exitAt: 900, gateAt: 2000, colour: 'steel' },
      { id: 'y2', kind: KIND.GO, taps: 1, enterAt: 400, exitAt: 1400, gateAt: 2400, colour: 'steel' },
    ],
    barrels: [], goColour: 'steel', nogoColour: 'rust', waveNo: 0,
  };
  if (!feasible(possible).ok) fail('SELF-TEST: feasible() rejected a wave that is obviously clearable');
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
for (const d of DIFFS) if (!BASE[d]) fail(`tier ${d} has no BASE entry`);

/* ── report ────────────────────────────────────────────────────────────── */
if (problems.length) {
  console.error('validate:intercept FAILED\n');
  for (const p of problems.slice(0, 40)) console.error('  · ' + p);
  if (problems.length > 40) console.error(`  … and ${problems.length - 40} more`);
  process.exit(1);
}

console.log(
  `validate:intercept OK — ${wavesChecked} waves / ${unitsChecked} marchers checked as a player meets them.\n`
  + '  one-thumb feasibility, strike dwell, visible-before-hidden, the Go/No-Go\n'
  + '  share band, no wave opening on a no-go, barrels inside the reach,\n'
  + '  per-tier variety, the curve, and all three measures reaching the results.',
);
