/*
 * Tangram (grid shape-fit) generator.
 *
 * We partition a rectangle into K connected polyomino pieces (random multi-source
 * growth). Those pieces, shuffled and rotated, are the tray — the player rotates
 * and places them to refill the rectangle. Because the pieces came FROM a tiling,
 * a solution always exists.
 */

export const TANGRAM_COLORS = ['#e0574c', '#4a90d9', '#57bd72', '#e8b84a', '#9b6fd0', '#3ec6c6', '#e07ab0', '#e0884a', '#7a9b3a'];

const shuffle = (arr, rng) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function normalize(offs) {
  const minR = Math.min(...offs.map((o) => o[0]));
  const minC = Math.min(...offs.map((o) => o[1]));
  return offs.map(([r, c]) => [r - minR, c - minC]).sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
}
export function rotateOffsets(offs) { return normalize(offs.map(([r, c]) => [c, -r])); }
export function rotations(offs) {
  const out = []; let cur = normalize(offs);
  for (let i = 0; i < 4; i++) {
    const key = JSON.stringify(cur);
    if (!out.some((o) => JSON.stringify(o) === key)) out.push(cur);
    cur = rotateOffsets(cur);
  }
  return out;
}

export function makeTangram(rows, cols, pieceCount, rng) {
  const M = rows * cols;
  const owner = new Array(M).fill(-1);
  const cells = shuffle(Array.from({ length: M }, (_, i) => i), rng);
  const k = Math.min(pieceCount, M);
  const pieceCells = cells.slice(0, k).map((s, i) => { owner[s] = i; return [s]; });
  let assigned = k;
  const nbrs = (cell) => { const r = Math.floor(cell / cols); const c = cell % cols; const o = []; if (r > 0) o.push(cell - cols); if (r < rows - 1) o.push(cell + cols); if (c > 0) o.push(cell - 1); if (c < cols - 1) o.push(cell + 1); return o; };
  let guard = 0;
  while (assigned < M && guard++ < M * 8) {
    const order = shuffle(pieceCells.map((_, i) => i), rng);
    let grew = false;
    for (const pi of order) {
      const cand = [];
      for (const cc of pieceCells[pi]) for (const nb of nbrs(cc)) if (owner[nb] < 0) cand.push(nb);
      if (cand.length) { const nb = cand[Math.floor(rng() * cand.length)]; owner[nb] = pi; pieceCells[pi].push(nb); assigned += 1; grew = true; break; }
    }
    if (!grew) break;
  }
  // any unassigned (rare) → attach to a neighbour piece
  for (let i = 0; i < M; i++) if (owner[i] < 0) { const nb = nbrs(i).find((x) => owner[x] >= 0); if (nb != null) { owner[i] = owner[nb]; pieceCells[owner[nb]].push(i); } }

  const pieces = pieceCells.map((cl) => normalize(cl.map((c) => [Math.floor(c / cols), c % cols])));
  return { rows, cols, pieces };
}
