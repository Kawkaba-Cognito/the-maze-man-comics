/**
 * One-off audit: 100 levels per tier, monotonic difficulty, playable specs.
 * Run: node scripts/audit-levels.mjs
 */
import { RV_LEVELS_PER_TIER, ravenGenLevel, ravenLevelSpec } from '../src/features/training/domains/reasoning/games/raven-matrices/ravenData.js';
import { CS_LEVELS_PER_TIER, colourSortLevelSpec } from '../src/features/training/domains/reasoning/games/tower-hanoi/colourSortData.js';
import { generateColourSort } from '../src/features/training/domains/reasoning/games/tower-hanoi/colourSortEngine.js';
import { RH_LEVELS_PER_TIER } from '../src/features/training/domains/reasoning/games/rush-hour/data-spec.js';
import { getCuratedRushHourLevel } from '../src/features/training/domains/reasoning/games/rush-hour/curated-levels.js';

const DIFFS = ['easy', 'medium', 'hard'];
let errors = [];

function mono(name, arr, key) {
  for (let i = 1; i < arr.length; i++) {
    const a = arr[i - 1][key], b = arr[i][key];
    if (b < a) errors.push(`${name}: ${key} drops L${i}→L${i + 1} (${a}→${b})`);
  }
}

function count100(name, n) {
  if (n !== 100) errors.push(`${name}: expected 100 levels, got ${n}`);
}

count100('Raven', RV_LEVELS_PER_TIER);
count100('ColourSort', CS_LEVELS_PER_TIER);
count100('RushHour', RH_LEVELS_PER_TIER);

for (const d of DIFFS) {
  const gens = [];
  for (let lv = 1; lv <= 100; lv++) gens.push({ lv, gen: ravenGenLevel(d, lv) });
  mono(`Raven ${d}`, gens, 'gen');
  if (ravenLevelSpec(d, 100).genLevel < ravenLevelSpec(d, 1).genLevel) {
    errors.push(`Raven ${d}: L100 genLevel < L1`);
  }
}

for (const d of DIFFS) {
  const pars = [];
  for (let lv = 1; lv <= 100; lv++) pars.push({ lv, minPar: colourSortLevelSpec(d, lv).minPar });
  mono(`ColourSort ${d}`, pars, 'minPar');
  for (const lv of [1, 50, 100]) {
    const spec = colourSortLevelSpec(d, lv);
    const p = generateColourSort({ ...spec, seed: lv * 1000 + d.length });
    if (!p) errors.push(`ColourSort ${d} L${lv}: generator null`);
    else if (p.par < spec.minPar) errors.push(`ColourSort ${d} L${lv}: par ${p.par} < minPar ${spec.minPar}`);
  }
}

for (const d of DIFFS) {
  for (let lv = 1; lv <= 100; lv++) {
    if (!getCuratedRushHourLevel(d, lv)) errors.push(`RushHour ${d} L${lv}: null`);
  }
}

console.log(errors.length ? errors.join('\n') : 'OK — Raven, Colour Sort, Rush Hour: 100/tier, monotone, playable.');
process.exit(errors.length ? 1 : 0);
