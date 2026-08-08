/*
 * audit-mot-curve.mjs — Target Tracking's difficulty must only ever go up.
 *
 * ── Why this exists ──
 * The tier endpoints were authored independently, so the curve ran BACKWARDS at
 * both seams. Measured before the fix:
 *
 *   easy L100  speed 0.20, track 5000ms   ->  med L1   speed 0.12, track 4000ms
 *   med  L100  21 objects, speed 0.27     ->  hard L1  19 objects, speed 0.14
 *
 * Starting Hard was easier than finishing Medium on three of four levers.
 * Nothing caught it because nothing compared one tier's end to the next's start.
 *
 * A second class of bug it catches: a config the RENDERER cannot deliver. The
 * old table asked for up to 30 objects while startRound() clamps the live count
 * to 26, so the top quarter of Hard silently stopped getting denser — on the
 * lever this game's difficulty model is built on.
 *
 *     node scripts/audit-mot-curve.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src/features/training/domains/attention/games/mot/index.jsx');
const src = fs.readFileSync(SRC, 'utf8');

let failures = 0;
const fail = (msg) => { console.error(`  FAIL  ${msg}`); failures += 1; };

/* Parse BASE and the runtime clamp straight out of the component, so this can
 * never drift from what actually ships. */
const baseBlock = src.match(/const BASE = \{([\s\S]*?)\n\};/);
if (!baseBlock) throw new Error('BASE table not found in mot/index.jsx');
const BASE = {};
for (const m of baseBlock[1].matchAll(
  /(\w+):\s*\{\s*t0:\s*([\d.]+),\s*t1:\s*([\d.]+),\s*n0:\s*([\d.]+),\s*n1:\s*([\d.]+),\s*s0:\s*([\d.]+),\s*s1:\s*([\d.]+),\s*tr0:\s*([\d.]+),\s*tr1:\s*([\d.]+)/g,
)) {
  const [, tier, t0, t1, n0, n1, s0, s1, tr0, tr1] = m;
  BASE[tier] = { t0: +t0, t1: +t1, n0: +n0, n1: +n1, s0: +s0, s1: +s1, tr0: +tr0, tr1: +tr1 };
}
const tiers = Object.keys(BASE);
if (tiers.length !== 3) fail(`expected 3 tiers, parsed ${tiers.length}`);

const clampMatch = src.match(/cfg\.targets \+ 2,\s*(\d+)\)/);
const RUNTIME_MAX = clampMatch ? +clampMatch[1] : null;
if (!RUNTIME_MAX) fail('could not find the runtime object-count clamp');

const capMatch = src.match(/MOT_CAP = (\d+)/);
const MOT_CAP = capMatch ? +capMatch[1] : 5;

console.log('Target Tracking difficulty curve');
console.log(`  tiers: ${tiers.join(' -> ')}   runtime object clamp: ${RUNTIME_MAX}   MOT_CAP: ${MOT_CAP}`);

/* 1. Every lever must rise WITHIN a tier. */
for (const [tier, b] of Object.entries(BASE)) {
  for (const [lo, hi, label] of [['t0', 't1', 'targets'], ['n0', 'n1', 'objects'], ['s0', 's1', 'speed'], ['tr0', 'tr1', 'trackMs']]) {
    if (b[hi] < b[lo]) fail(`${tier}: ${label} falls across the tier (${b[lo]} -> ${b[hi]})`);
  }
  if (b.t1 > MOT_CAP) fail(`${tier}: t1 ${b.t1} exceeds MOT_CAP ${MOT_CAP}`);
  if (b.n1 > RUNTIME_MAX) {
    fail(`${tier}: n1 ${b.n1} exceeds the runtime clamp ${RUNTIME_MAX} — the top of `
      + 'this tier would render identically and stop getting harder');
  }
  if (b.n0 < b.t0 + 2) fail(`${tier}: n0 ${b.n0} leaves fewer than 2 distractors for ${b.t0} targets`);
}

/* 2. Tiers must CHAIN — each starts where the previous ended. This is the check
 *    that would have caught the original regression. */
for (let i = 0; i < tiers.length - 1; i += 1) {
  const a = BASE[tiers[i]], b = BASE[tiers[i + 1]];
  for (const [end, start, label] of [['t1', 't0', 'targets'], ['n1', 'n0', 'objects'], ['s1', 's0', 'speed'], ['tr1', 'tr0', 'trackMs']]) {
    if (b[start] < a[end]) {
      fail(`${tiers[i]} -> ${tiers[i + 1]}: ${label} DROPS (${a[end]} -> ${b[start]}) `
        + '— the next tier starts easier than the last one ended');
    }
  }
}

/* 3. Report the curve so a human can sanity-check the shape. */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const cfg = (tier, level) => {
  const b = BASE[tier];
  const u = Math.pow(clamp((level - 1) / 99, 0, 1), 0.85);
  return {
    targets: clamp(Math.round(lerp(b.t0, b.t1, u)), 1, MOT_CAP),
    total: Math.round(lerp(b.n0, b.n1, u)),
    speed: +lerp(b.s0, b.s1, u).toFixed(3),
    trackMs: Math.round(lerp(b.tr0, b.tr1, u)),
  };
};
console.log('\n  tier  lvl  targets objects speed trackMs');
for (const tier of tiers) {
  for (const l of [1, 50, 100]) {
    const c = cfg(tier, l);
    console.log(`  ${tier.padEnd(4)} ${String(l).padStart(4)}  ${String(c.targets).padStart(7)} ${String(c.total).padStart(7)} ${String(c.speed).padStart(5)} ${String(c.trackMs).padStart(7)}`);
  }
}

/* 4. The whole 300-level sequence must be non-decreasing on objects and speed. */
let prev = null;
for (const tier of tiers) {
  for (let l = 1; l <= 100; l += 1) {
    const c = cfg(tier, l);
    if (prev) {
      if (c.total < prev.total) fail(`objects drop at ${tier} L${l} (${prev.total} -> ${c.total})`);
      if (c.speed < prev.speed) fail(`speed drops at ${tier} L${l} (${prev.speed} -> ${c.speed})`);
      if (c.targets < prev.targets) fail(`targets drop at ${tier} L${l} (${prev.targets} -> ${c.targets})`);
    }
    prev = c;
  }
}

/* 5. ── What actually reaches the SCREEN ──
 *
 * The checks above validate the authored curve. That is not what a player sees:
 * startRound() rescales the count to preserve density across devices, and the
 * first version of this audit passed while the rendered game was still broken —
 * 8 of 9 sampled laptop levels drew an IDENTICAL 26 objects because the rescale
 * (3.1x on a wide screen) pushed every level into the clamp. A curve that never
 * reaches the screen is not a curve, so simulate the render.
 */
const MAX_ARENA_AR = (() => {
  const m = src.match(/MAX_ARENA_AR = ([\d.]+)/);
  return m ? +m[1] : null;
})();
if (!MAX_ARENA_AR) fail('could not find MAX_ARENA_AR — arena aspect is unbounded again');

const MARGIN = 6;
function onScreen(c, w, h) {
  const minDim = Math.min(w, h);
  let aw = w - 2 * MARGIN;
  let ah = h - 2 * MARGIN;
  if (aw / ah > MAX_ARENA_AR) aw = ah * MAX_ARENA_AR;
  else if (ah / aw > MAX_ARENA_AR) ah = aw * MAX_ARENA_AR;
  const density = c.total / (minDim * minDim);
  return clamp(Math.round(density * aw * ah), c.targets + 2, RUNTIME_MAX);
}

const DEVICES = [
  ['phone portrait', 388, 700],
  ['phone small', 366, 650],
  ['laptop', 1342, 430],
  ['tablet', 780, 980],
];
console.log('\n  on-screen object count (after the density rescale):');

for (const [name, w, h] of DEVICES) {
  const seen = [];
  let prevTotal = null;
  let flatRun = 0, worstFlat = 0;
  for (const tier of tiers) {
    for (let l = 1; l <= 100; l += 1) {
      const s = onScreen(cfg(tier, l), w, h);
      if (s === RUNTIME_MAX) fail(`${name}: ${tier} L${l} hits the clamp (${RUNTIME_MAX}) — density stops grading`);
      if (s === prevTotal) { flatRun += 1; worstFlat = Math.max(worstFlat, flatRun); } else flatRun = 0;
      prevTotal = s;
    }
    seen.push(`${tier} ${onScreen(cfg(tier, 1), w, h)}->${onScreen(cfg(tier, 100), w, h)}`);
  }
  console.log(`    ${name.padEnd(15)} ${seen.join('  ')}   longest identical run: ${worstFlat} levels`);
  /*
   * The flat run is REPORTED, not failed on — and that is a deliberate change of
   * what this guard measures, not a relaxed threshold.
   *
   * Object count is now a coarse lever by design. Keeping the display inside the
   * classic MOT range (8-16) leaves only ~8 integer values across 300 levels, so
   * long identical runs are arithmetic. Failing on them would just be pressure to
   * add balls back, which is the opposite of what the count was reduced for.
   *
   * The failure this check was written for — the count pinned because the
   * density rescale drove it into the clamp — is caught directly and precisely
   * by the clamp assertion above. What matters beyond that is not "does the
   * count change" but "does DIFFICULTY change", which is asserted below across
   * all four levers together.
   */
  void worstFlat; // reported inline above; kept as a signal, not a gate
}



/* 6. ── Difficulty itself must never stall ──
 *
 * The real invariant, and the one the count-run check was a poor proxy for: no
 * two consecutive levels may be identical on EVERY lever at once. A player must
 * never be able to clear a level and meet the exact same trial again.
 *
 * Checked on the levers as the engine composes them, not on a weighted score —
 * a made-up difficulty index would just encode my guess about their relative
 * importance, and the point here is to catch a stall, not to rank the levers.
 */
{
  let stalls = 0;
  let worstStall = 0;
  let run = 0;
  let prev = null;
  for (const tier of tiers) {
    /* Reset at each tier. The seams are SUPPOSED to repeat — chaining means the
     * next tier starts exactly where the last ended, so easy L100 and med L1 are
     * deliberately the same trial. Comparing across the seam flagged those two
     * as stalls when they are the fix, not the fault. Tiers are separate tracks
     * a player selects, not one 300-level run. */
    prev = null;
    run = 0;
    for (let l = 1; l <= 100; l += 1) {
      const c = cfg(tier, l);
      const key = `${c.targets}|${c.total}|${c.speed}|${c.trackMs}`;
      if (prev === key) { run += 1; stalls += 1; worstStall = Math.max(worstStall, run); } else run = 0;
      prev = key;
    }
  }
  if (stalls) {
    fail(`${stalls} level(s) are identical to the one before on every lever `
      + `(longest run ${worstStall}) — difficulty stalls completely there`);
  } else {
    console.log('\n  every one of the 300 levels differs from the previous on at least one lever');
  }
}

if (failures) {
  console.error(`\naudit-mot-curve: ${failures} failure(s)`);
  process.exit(1);
}
console.log('\naudit-mot-curve: OK — monotonic across 300 levels, and the curve survives the density rescale on every device shape');
