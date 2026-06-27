/*
 * Flow generator.
 *
 * A Flow board must be fully coverable by non-crossing paths that connect pairs
 * of coloured dots. We guarantee that by GENERATING a solution first: take a
 * Hamiltonian path over the whole grid (covers every cell), randomise it with
 * "backbite" moves, then cut it into K contiguous segments — each segment is one
 * colour, its two ends become the dots. The segments themselves are a valid
 * solution, so the board is always solvable and fills the grid.
 */

export const FLOW_COLORS = ['#e0574c', '#4a90d9', '#57bd72', '#e8b84a', '#e07ab0', '#9b6fd0', '#3ec6c6', '#e0884a', '#7a9b3a', '#c45c8a'];

function neighbors(cell, N) {
  const r = Math.floor(cell / N); const c = cell % N; const out = [];
  if (r > 0) out.push(cell - N);
  if (r < N - 1) out.push(cell + N);
  if (c > 0) out.push(cell - 1);
  if (c < N - 1) out.push(cell + 1);
  return out;
}

function chooseSegLengths(len, k, rng) {
  const parts = new Array(k).fill(2);
  let rem = len - k * 2;
  while (rem > 0) { parts[Math.floor(rng() * k)] += 1; rem -= 1; }
  return parts;
}

export function makeFlow(N, colors, rng) {
  // 1) snake Hamiltonian path
  const path = [];
  for (let r = 0; r < N; r++) {
    if (r % 2 === 0) for (let c = 0; c < N; c++) path.push(r * N + c);
    else for (let c = N - 1; c >= 0; c--) path.push(r * N + c);
  }
  const idxOf = new Array(N * N);
  const sync = () => { for (let i = 0; i < path.length; i++) idxOf[path[i]] = i; };
  sync();

  // 2) backbite to randomise
  const iters = N * N * 30;
  for (let k = 0; k < iters; k++) {
    const head = rng() < 0.5;
    const end = head ? path[0] : path[path.length - 1];
    const ns = neighbors(end, N);
    const n = ns[Math.floor(rng() * ns.length)];
    const j = idxOf[n];
    if (head) {
      if (j <= 1) continue;
      let lo = 0; let hi = j - 1;
      while (lo < hi) { const tmp = path[lo]; path[lo] = path[hi]; path[hi] = tmp; lo += 1; hi -= 1; }
    } else {
      if (j >= path.length - 2) continue;
      let lo = j + 1; let hi = path.length - 1;
      while (lo < hi) { const tmp = path[lo]; path[lo] = path[hi]; path[hi] = tmp; lo += 1; hi -= 1; }
    }
    sync();
  }

  // 3) cut into `colors` contiguous segments (each ≥ 2 cells)
  const segLens = chooseSegLengths(path.length, colors, rng);
  const dots = [];        // [colorIdx] -> [cellA, cellB]
  const solution = [];    // [colorIdx] -> [cells...]
  let pos = 0;
  for (let c = 0; c < colors; c++) {
    const seg = path.slice(pos, pos + segLens[c]);
    solution.push(seg);
    dots.push([seg[0], seg[seg.length - 1]]);
    pos += segLens[c];
  }
  return { N, colors, dots, solution };
}

/** Are the two dots of `color` connected through cells of that colour? (BFS) */
export function colorConnected(owner, dots, color, N) {
  const [a, b] = dots[color];
  if (owner[a] !== color || owner[b] !== color) return false;
  const seen = new Set([a]);
  const stack = [a];
  while (stack.length) {
    const cur = stack.pop();
    if (cur === b) return true;
    for (const nb of neighbors(cur, N)) {
      if (!seen.has(nb) && owner[nb] === color) { seen.add(nb); stack.push(nb); }
    }
  }
  return false;
}

export function isFlowSolved(owner, dots, colors, N) {
  for (let i = 0; i < owner.length; i++) if (owner[i] < 0) return false; // every cell filled
  for (let c = 0; c < colors; c++) if (!colorConnected(owner, dots, c, N)) return false;
  return true;
}
