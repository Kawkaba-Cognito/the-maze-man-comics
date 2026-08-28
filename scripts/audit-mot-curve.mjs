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

/*
 * ⚠ THE CURVE IS NOW IMPORTED, NOT SCRAPED (2026-08-28, the ladder).
 *
 * This used to regex-parse `const BASE = {...}` out of mot/index.jsx, because
 * the gates run in plain Node and cannot load a React file. That worked, but a
 * scraped curve is one refactor away from being silently ungated: a changed
 * shape throws, and a subtly changed shape matches the WRONG numbers. The curve
 * now lives in motData.js and the gate imports exactly what the game runs.
 *
 * What still has to be scraped is the RUNTIME CLAMP and the arena aspect,
 * because those live in the component's render path, not in the data module.
 */
const { LADDER, LADDER_LEVELS, MOT_CAP, levelConfig } =
  await import(`file:///${path.join(ROOT, 'src/features/training/domains/attention/games/mot/motData.js').replace(/\\/g, '/')}`);

const clampMatch = src.match(/cfg\.targets \+ 2,\s*(\d+)\)/);
const RUNTIME_MAX = clampMatch ? +clampMatch[1] : null;
if (!RUNTIME_MAX) fail('could not find the runtime object-count clamp');

console.log('Target Tracking difficulty curve');
console.log(`  ONE LADDER: ${LADDER.length} bands × 10 = ${LADDER_LEVELS} levels   `
  + `runtime object clamp: ${RUNTIME_MAX}   MOT_CAP: ${MOT_CAP}`);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const cfg = (level) => {
  const c = levelConfig(level);
  return { targets: c.targets, total: c.total, speed: +c.speedFrac.toFixed(3), trackMs: c.trackMs };
};

/* 1. Every lever must rise across the ladder, and stay renderable. */
{
  const lo = cfg(1); const hi = cfg(LADDER_LEVELS);
  for (const [k, label] of [['targets', 'targets'], ['total', 'objects'], ['speed', 'speed'], ['trackMs', 'trackMs']]) {
    if (hi[k] < lo[k]) fail(`${label} falls across the ladder (${lo[k]} -> ${hi[k]})`);
  }
  for (let l = 1; l <= LADDER_LEVELS; l += 1) {
    const c = cfg(l);
    if (c.targets > MOT_CAP) fail(`L${l}: targets ${c.targets} exceeds MOT_CAP ${MOT_CAP}`);
    if (c.total > RUNTIME_MAX) {
      fail(`L${l}: ${c.total} objects exceeds the runtime clamp ${RUNTIME_MAX} — this level `
        + 'would render identically to the ones around it and stop getting harder');
    }
    if (c.total < c.targets + 2) fail(`L${l}: ${c.total} objects leaves fewer than 2 distractors for ${c.targets} targets`);
  }
}

/* 2. No band may be inert — the ladder's own rule (see audit:curves). */
for (let b = 1; b < LADDER.length; b += 1) {
  const before = cfg((b - 1) * 10 + 1);
  const now = cfg(b * 10 + 1);
  const addsSomething = (LADDER[b].adds || []).length > 0;
  if (!addsSomething && before.targets === now.targets) {
    fail(`band ${b + 1}: introduces no mechanic and does not change the tracking load`);
  }
}

/* 3. Report the curve so a human can sanity-check the shape. */
console.log('\n  band  lvl  targets objects speed trackMs');
LADDER.forEach((_, b) => {
  for (const l of [b * 10 + 1, b * 10 + 10]) {
    const c = cfg(l);
    console.log(`  ${String(b + 1).padEnd(4)} ${String(l).padStart(4)}  ${String(c.targets).padStart(7)} ${String(c.total).padStart(7)} ${String(c.speed).padStart(5)} ${String(c.trackMs).padStart(7)}`);
  }
});

/* 4. The whole ladder must be non-decreasing on every lever. */
{
  let prev = null;
  for (let l = 1; l <= LADDER_LEVELS; l += 1) {
    const c = cfg(l);
    if (prev) {
      if (c.total < prev.total) fail(`objects drop at L${l} (${prev.total} -> ${c.total})`);
      if (c.speed < prev.speed) fail(`speed drops at L${l} (${prev.speed} -> ${c.speed})`);
      if (c.targets < prev.targets) fail(`targets drop at L${l} (${prev.targets} -> ${c.targets})`);
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
  {
    for (let l = 1; l <= LADDER_LEVELS; l += 1) {
      const s = onScreen(cfg(l), w, h);
      if (s === RUNTIME_MAX) fail(`${name}: L${l} hits the clamp (${RUNTIME_MAX}) — density stops grading`);
      if (s === prevTotal) { flatRun += 1; worstFlat = Math.max(worstFlat, flatRun); } else flatRun = 0;
      prevTotal = s;
    }
    seen.push(`${onScreen(cfg(1), w, h)}->${onScreen(cfg(LADDER_LEVELS), w, h)}`);
  }
  console.log(`    ${name.padEnd(15)} ${seen.join('  ')}   longest identical run: ${worstFlat} levels`);
  /*
   * The flat run is REPORTED, not failed on — and that is a deliberate change of
   * what this guard measures, not a relaxed threshold.
   *
   * Object count is now a coarse lever by design. Keeping the display inside the
   * classic MOT range (8-16) leaves only ~8 integer values across the ladder, so
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
  {
    /* ⚠ There are no tier seams to reset at any more. The note that stood here
     * explained that easy L100 and med L1 were DELIBERATELY the same trial
     * (tiers chained end-to-start), so comparing across the seam produced false
     * stalls. On ONE ladder there is no seam and no exemption: every level must
     * differ from the one before it, everywhere. */
    prev = null;
    run = 0;
    for (let l = 1; l <= LADDER_LEVELS; l += 1) {
      const c = cfg(l);
      const key = `${c.targets}|${c.total}|${c.speed}|${c.trackMs}`;
      if (prev === key) { run += 1; stalls += 1; worstStall = Math.max(worstStall, run); } else run = 0;
      prev = key;
    }
  }
  if (stalls) {
    fail(`${stalls} level(s) are identical to the one before on every lever `
      + `(longest run ${worstStall}) — difficulty stalls completely there`);
  } else {
    console.log(`\n  every one of the ${LADDER_LEVELS} levels differs from the previous on at least one lever`);
  }
}

if (failures) {
  console.error(`\naudit-mot-curve: ${failures} failure(s)`);
  process.exit(1);
}
console.log(`\naudit-mot-curve: OK — monotonic across ${LADDER_LEVELS} ladder levels, and the curve survives the density rescale on every device shape`);
