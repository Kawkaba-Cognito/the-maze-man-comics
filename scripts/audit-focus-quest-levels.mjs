/**
 * Exhaustive finite checks on FocusQuest level generation.
 * All properties are decidable by enumeration over the finite grid — no SMT/Z3 required.
 *
 * Run: node scripts/audit-focus-quest-levels.mjs
 */

import {
  DM,
  SP,
  TC,
  SH,
  prepareLevelRound,
  prepareChallengeSeed,
  prepareChallengePlayState,
  getLvCfg,
  sigmoidTime,
  computeFeatureInterference,
  getLevelDifficultyModel,
} from '../src/components/training/focusQuestData.js';

const SHAPES = new Set(Object.keys(SH));

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

// Config shape pools: length 20, every name known, ≥2 shapes for distractors
// Gradual difficulty: targets non-decreasing, time non-increasing, interference non-decreasing
for (const diff of Object.keys(DM)) {
  assert(Array.isArray(SP[diff]) && SP[diff].length === 20, `${diff}: SP must have 20 entries`);
  assert(Array.isArray(TC[diff]) && TC[diff].length === 20, `${diff}: TC must have 20 entries`);

  let prevT = Infinity;
  let prevI = -1;
  let prevTc = -1;

  for (let li = 0; li < 20; li++) {
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
for (const diff of Object.keys(DM)) {
  for (let lv = 1; lv <= 20; lv++) {
    for (let i = 0; i < ITERS; i++) {
      const r = prepareLevelRound(diff, lv);
      auditOneRound(r, `${diff} L${lv} sample ${i}`);
    }
  }
}

for (let i = 0; i < 40; i++) {
  const seed = prepareChallengeSeed();
  assert(seed.grid === 9, 'challenge seed grid');
  assert(seed.cells.length === seed.grid * seed.grid, 'challenge seed cell count');
  const r = prepareChallengePlayState(seed);
  auditOneRound(r, `challenge ${i}`);
}

console.log('audit-focus-quest-levels: OK', {
  difficulties: Object.keys(DM).length,
  samplesPerLevel: ITERS,
  totalPrepareSamples: Object.keys(DM).length * 20 * ITERS,
});
