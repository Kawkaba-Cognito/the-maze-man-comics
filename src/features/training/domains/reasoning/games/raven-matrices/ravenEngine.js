/*
 * RAVEN'S MATRICES — procedural generator for a 3×3 pattern-completion task
 * (inductive / fluid reasoning, Gf).
 *
 * Each cell is a FIGURE described by independent attributes (shape, count,
 * fill, rotation, color). Across the matrix, `d` attributes VARY by a rule and
 * the rest stay constant. Two rule families — both classic Raven mechanics:
 *   • permutation: each row/column contains all three values (Latin square)
 *   • progression: a fixed step left→right (e.g. count +1, rotation +45°)
 * The missing bottom-right cell is computed from the rules (always uniquely
 * determined), and distractors are near-misses (the answer with ONE attribute
 * changed), which is what makes a matrix item discriminating.
 *
 * Pure JS, no React. Difficulty scales with the staircase level.
 */

export const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'hexagon'];
export const FILLS = ['none', 'half', 'solid'];
export const ROTS = [0, 45, 90, 135];
export const COLORS = ['#d98f5a', '#5fa9d8', '#8fbf6a', '#b79bd6', '#e6c66a'];

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];
function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function distinct3(domain, rng) {
  return shuffle(domain, rng).slice(0, 3);
}

const ATTRS = ['shape', 'count', 'color', 'rot', 'fill'];

function figureEq(a, b) {
  return a.shape === b.shape && a.count === b.count && a.fill === b.fill && a.rot === b.rot && a.color === b.color;
}

/**
 * Difficulty from staircase level:
 *  - d (varying attributes) 1..4
 *  - optionCount 4 / 6 / 8
 */
function paramsFor(level) {
  // Up to 5 simultaneous rules (expert) — steeper ramp than before.
  const d = Math.max(1, Math.min(5, 1 + Math.floor(level / 2.5)));
  const optionCount = level < 4 ? 4 : level < 9 ? 6 : 8;
  return { d, optionCount };
}

/** Build a 3×3 grid of figures following per-attribute rules. */
function buildGrid(varying, rng) {
  // Constant baseline every cell starts from.
  const base = {
    shape: pick(SHAPES, rng),
    count: 1 + Math.floor(rng() * 4),
    color: pick(COLORS, rng),
    rot: pick(ROTS, rng),
    fill: 'solid',
  };

  // Per-attribute generator f(r,c).
  const gens = {};
  let permShift = 1; // alternate shift so two permutation attrs don't correlate
  for (const attr of varying) {
    if (attr === 'shape' || attr === 'color' || attr === 'fill') {
      const domain = attr === 'fill' ? FILLS : (attr === 'shape' ? SHAPES : COLORS);
      const values = distinct3(domain, rng);
      const shift = permShift; permShift = permShift === 1 ? 2 : 1;
      gens[attr] = (r, c) => values[(c + r * shift) % 3];
    } else if (attr === 'count') {
      const step = rng() < 0.5 ? 1 : -1;
      const bases = [0, 1, 2].map(() => 1 + Math.floor(rng() * 2)); // base per row 1..2
      gens[attr] = (r, c) => {
        let v = bases[r] + c * step;
        v = ((v - 1) % 4 + 4) % 4 + 1; // wrap into 1..4
        return v;
      };
    } else { // rot
      const step = rng() < 0.5 ? 45 : 90;
      const bases = [0, 1, 2].map(() => pick(ROTS, rng));
      gens[attr] = (r, c) => (bases[r] + c * step) % 360;
    }
  }

  const grid = [];
  for (let r = 0; r < 3; r++) {
    const row = [];
    for (let c = 0; c < 3; c++) {
      const fig = { ...base };
      for (const attr of varying) fig[attr] = gens[attr](r, c);
      row.push(fig);
    }
    grid.push(row);
  }
  return grid;
}

/** Near-miss distractors: clone the answer, change one attribute to a wrong value. */
function makeOptions(answer, varying, optionCount, rng) {
  const opts = [answer];
  const attrsToTweak = shuffle(varying.length ? varying : ATTRS, rng);
  let guard = 0;
  while (opts.length < optionCount && guard++ < 400) {
    const attr = attrsToTweak[(opts.length + guard) % attrsToTweak.length];
    const cand = { ...answer };
    if (attr === 'shape') cand.shape = pick(SHAPES.filter((s) => s !== answer.shape), rng);
    else if (attr === 'color') cand.color = pick(COLORS.filter((s) => s !== answer.color), rng);
    else if (attr === 'fill') cand.fill = pick(FILLS.filter((s) => s !== answer.fill), rng);
    else if (attr === 'count') cand.count = pick([1, 2, 3, 4].filter((n) => n !== answer.count), rng);
    else cand.rot = pick(ROTS.filter((n) => n !== answer.rot), rng);
    if (!opts.some((o) => figureEq(o, cand))) opts.push(cand);
  }
  // Pad (rare) with random figures if near-misses ran out.
  while (opts.length < optionCount) {
    const cand = { shape: pick(SHAPES, rng), count: 1 + Math.floor(rng() * 4), color: pick(COLORS, rng), rot: pick(ROTS, rng), fill: pick(FILLS, rng) };
    if (!opts.some((o) => figureEq(o, cand))) opts.push(cand);
  }
  const shuffled = shuffle(opts, rng);
  return { options: shuffled, correctIndex: shuffled.findIndex((o) => figureEq(o, answer)) };
}

/** Generate a matrix puzzle for a staircase `level`. */
export function generateMatrix(level = 0, seed = (Math.random() * 1e9) | 0) {
  const rng = mulberry32(seed);
  const { d, optionCount } = paramsFor(level);
  const varying = shuffle(ATTRS, rng).slice(0, d);
  const grid = buildGrid(varying, rng);
  const answer = grid[2][2];
  const { options, correctIndex } = makeOptions(answer, varying, optionCount, rng);
  return { grid, answer, options, correctIndex, varying, d, optionCount, seed };
}

export { figureEq };
