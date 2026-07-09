/*
 * RAVEN'S MATRICES — procedural 3×3 pattern-completion (fluid reasoning / Gf).
 *
 * Rule taxonomy (Carpenter, Just & Shell, 1990 — simplified):
 *   cr   — constant in a row (changes down columns across rows)
 *   pp   — quantitative pairwise progression (column steps)
 *   d3   — distribution of three values (Latin square)
 *   d2   — distribution of two values (third cell uses absent sentinel)
 *   add  — figure addition on count (col3 = col1 + col2, mod 4)
 *
 * Each varying attribute gets one rule. Difficulty scales with rule count (d),
 * rule-type complexity, and option count.
 */

import { mulberry32, shuffle } from '../../../../../../lib/rng';

export const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'hexagon'];
export const FILLS = ['none', 'half', 'solid'];
export const ROTS = [0, 45, 90, 135];
export const COLORS = ['#d98f5a', '#5fa9d8', '#8fbf6a', '#b79bd6', '#e6c66a'];

export const RULE_TYPES = ['cr', 'pp', 'd3', 'd2', 'add'];

const ABSENT = '__absent__';
const ATTRS = ['shape', 'count', 'color', 'rot', 'fill'];
const CAT_ATTRS = ['shape', 'color', 'fill'];

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];
function distinct3(domain, rng) {
  return shuffle(domain, rng).slice(0, 3);
}

export function snapRot(deg) {
  const n = ((deg % 360) + 360) % 360;
  let best = ROTS[0];
  let bestD = Infinity;
  for (const s of ROTS) {
    const d = Math.min(Math.abs(n - s), 360 - Math.abs(n - s));
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

function figureEq(a, b) {
  return a.shape === b.shape && a.count === b.count && a.fill === b.fill
    && a.rot === b.rot && a.color === b.color;
}

function domainFor(attr) {
  if (attr === 'shape') return SHAPES;
  if (attr === 'fill') return FILLS;
  if (attr === 'color') return COLORS;
  return null;
}

/** Pick rule types for each varying attribute based on generator level. */
function assignRules(varying, level, rng) {
  const easyPool = ['cr', 'pp', 'd3'];
  const midPool = ['cr', 'pp', 'd3', 'd2'];
  const hardPool = ['cr', 'pp', 'd3', 'd2', 'add'];
  const pool = level < 4 ? easyPool : level < 10 ? midPool : hardPool;

  return varying.map((attr) => {
    let candidates = pool.filter((rule) => {
      if (rule === 'add') return attr === 'count';
      if (rule === 'pp') return attr === 'count' || attr === 'rot';
      if (rule === 'd2') return CAT_ATTRS.includes(attr);
      if (rule === 'd3') return CAT_ATTRS.includes(attr);
      if (rule === 'cr') return true;
      return false;
    });
    if (!candidates.length) candidates = attr === 'count' || attr === 'rot' ? ['pp'] : ['d3'];
    return { attr, rule: pick(candidates, rng) };
  });
}

function paramsFor(level) {
  const d = Math.max(1, Math.min(5, 1 + Math.floor(level / 2.5)));
  const optionCount = level < 4 ? 4 : level < 9 ? 6 : 8;
  return { d, optionCount };
}

/** Apply one attribute rule across the 3×3 grid. */
function applyRule(attr, rule, grid, base, rng) {
  if (rule === 'cr') {
    const rowVals = [0, 1, 2].map(() => {
      if (attr === 'count') return 1 + Math.floor(rng() * 4);
      if (attr === 'rot') return pick(ROTS, rng);
      return pick(domainFor(attr), rng);
    });
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (attr === 'count') grid[r][c].count = rowVals[r];
        else if (attr === 'rot') grid[r][c].rot = rowVals[r];
        else grid[r][c][attr] = rowVals[r];
      }
    }
    return;
  }

  if (rule === 'pp') {
    if (attr === 'count') {
      const step = rng() < 0.5 ? 1 : -1;
      const bases = [0, 1, 2].map(() => 1 + Math.floor(rng() * 2));
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          let v = bases[r] + c * step;
          v = ((v - 1) % 4 + 4) % 4 + 1;
          grid[r][c].count = v;
        }
      }
    } else {
      const step = rng() < 0.5 ? 45 : 90;
      const bases = [0, 1, 2].map(() => pick(ROTS, rng));
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          grid[r][c].rot = snapRot(bases[r] + c * step);
        }
      }
    }
    return;
  }

  if (rule === 'd3') {
    const domain = domainFor(attr);
    const values = distinct3(domain, rng);
    let shift = 1;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        grid[r][c][attr] = values[(c + r * shift) % 3];
      }
      shift = shift === 1 ? 2 : 1;
    }
    return;
  }

  if (rule === 'd2') {
    const domain = domainFor(attr);
    for (let r = 0; r < 3; r++) {
      const present = shuffle(domain, rng).slice(0, 2);
      const absentIdx = Math.floor(rng() * 3);
      let pi = 0;
      for (let c = 0; c < 3; c++) {
        if (c === absentIdx) {
          if (attr === 'shape') grid[r][c].count = 0;
          else grid[r][c][attr] = ABSENT;
        } else {
          grid[r][c][attr] = present[pi++];
        }
      }
    }
    return;
  }

  if (rule === 'add') {
    for (let r = 0; r < 3; r++) {
      const a = 1 + Math.floor(rng() * 3);
      const b = 1 + Math.floor(rng() * 3);
      grid[r][0].count = a;
      grid[r][1].count = b;
      grid[r][2].count = Math.min(4, Math.max(1, a + b));
    }
  }
}

function buildGrid(rules, rng) {
  const base = {
    shape: pick(SHAPES, rng),
    count: 1 + Math.floor(rng() * 4),
    color: pick(COLORS, rng),
    rot: pick(ROTS, rng),
    fill: 'solid',
  };

  const grid = [];
  for (let r = 0; r < 3; r++) {
    const row = [];
    for (let c = 0; c < 3; c++) row.push({ ...base });
    grid.push(row);
  }

  for (const { attr, rule } of rules) {
    applyRule(attr, rule, grid, base, rng);
  }

  // Resolve absent sentinels to base values; count=0 stays empty.
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const fig = grid[r][c];
      if (fig.fill === ABSENT) fig.fill = base.fill;
      if (fig.color === ABSENT) fig.color = base.color;
      if (fig.shape === ABSENT) { fig.shape = base.shape; fig.count = Math.max(fig.count, 1); }
    }
  }

  return grid;
}

function cloneFig(fig) {
  return { shape: fig.shape, count: fig.count, color: fig.color, rot: fig.rot, fill: fig.fill };
}

function tweakAttr(cand, attr, answer, rng) {
  if (attr === 'shape') cand.shape = pick(SHAPES.filter((s) => s !== answer.shape), rng);
  else if (attr === 'color') cand.color = pick(COLORS.filter((s) => s !== answer.color), rng);
  else if (attr === 'fill') cand.fill = pick(FILLS.filter((s) => s !== answer.fill), rng);
  else if (attr === 'count') {
    const opts = [1, 2, 3, 4].filter((n) => n !== answer.count);
    cand.count = pick(opts, rng);
  }   else if (attr === 'rot') cand.rot = pick(ROTS.filter((n) => n !== answer.rot), rng);
}

/** Near-miss + multi-rule violation distractors. */
function makeOptions(answer, varying, rules, optionCount, rng) {
  const opts = [cloneFig(answer)];
  const attrsToTweak = shuffle(varying.length ? varying : ATTRS, rng);
  const ruleByAttr = Object.fromEntries(rules.map((r) => [r.attr, r.rule]));

  const tryAdd = (cand) => {
    if (!opts.some((o) => figureEq(o, cand))) opts.push(cand);
  };

  let guard = 0;
  // Single-attribute near-miss
  while (opts.length < optionCount && guard++ < 200) {
    const attr = attrsToTweak[(opts.length + guard) % attrsToTweak.length];
    const cand = cloneFig(answer);
    tweakAttr(cand, attr, answer, rng);
    tryAdd(cand);
  }

  // Double-attribute near-miss (harder distractors)
  guard = 0;
  while (opts.length < optionCount && guard++ < 200) {
    const pair = shuffle(attrsToTweak, rng).slice(0, 2);
    if (pair.length < 2) break;
    const cand = cloneFig(answer);
    tweakAttr(cand, pair[0], answer, rng);
    tweakAttr(cand, pair[1], answer, rng);
    tryAdd(cand);
  }

  // Rule-specific wrong answers
  for (const attr of varying) {
    if (opts.length >= optionCount) break;
    const rule = ruleByAttr[attr];
    const cand = cloneFig(answer);
    if (rule === 'pp' && attr === 'count') {
      cand.count = answer.count <= 1 ? 4 : answer.count - 1;
      tryAdd(cand);
    } else if (rule === 'pp' && attr === 'rot') {
      const idx = ROTS.indexOf(answer.rot);
      cand.rot = ROTS[(idx + 1) % ROTS.length];
      tryAdd(cand);
    } else if (rule === 'add' && attr === 'count') {
      cand.count = Math.max(1, Math.min(4, answer.count - 1));
      tryAdd(cand);
    }
  }

  while (opts.length < optionCount && guard++ < 400) {
    const attr = attrsToTweak[(opts.length + guard) % attrsToTweak.length];
    const cand = cloneFig(answer);
    tweakAttr(cand, attr, answer, rng);
    tryAdd(cand);
  }

  while (opts.length < optionCount) {
    const cand = {
      shape: pick(SHAPES, rng), count: 1 + Math.floor(rng() * 4), color: pick(COLORS, rng),
      rot: pick(ROTS, rng), fill: pick(FILLS, rng),
    };
    tryAdd(cand);
  }

  const shuffled = shuffle(opts.slice(0, optionCount), rng);
  return { options: shuffled, correctIndex: shuffled.findIndex((o) => figureEq(o, answer)) };
}

/** Generate a matrix puzzle for staircase `level`. */
export function generateMatrix(level = 0, seed = (Math.random() * 1e9) | 0) {
  const rng = mulberry32(seed);
  const { d, optionCount } = paramsFor(level);
  const varying = shuffle(ATTRS, rng).slice(0, d);
  const rules = assignRules(varying, level, rng);
  const grid = buildGrid(rules, rng);
  const answer = cloneFig(grid[2][2]);
  const { options, correctIndex } = makeOptions(answer, varying, rules, optionCount, rng);
  return {
    grid, answer, options, correctIndex, varying, rules, d, optionCount, seed,
  };
}

export { figureEq, ABSENT };
