import { createRng, shuffle } from '../../shared/rng';

function neighbors4(size, r, c) {
  const out = [];
  if (r > 0) out.push([r - 1, c]);
  if (r < size - 1) out.push([r + 1, c]);
  if (c > 0) out.push([r, c - 1]);
  if (c < size - 1) out.push([r, c + 1]);
  return out;
}

function canShade(shaded, r, c) {
  for (const [nr, nc] of neighbors4(shaded.length, r, c)) {
    if (shaded[nr][nc]) return false;
  }
  return true;
}

function fillNumbers(size, rng) {
  const offset = Math.floor(rng() * size);
  const nums = Array.from({ length: size }, () => Array(size).fill(0));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) nums[r][c] = ((r + c + offset) % size) + 1;
  }
  return nums;
}

function generateShading(size, rng) {
  const shaded = Array.from({ length: size }, () => Array(size).fill(false));
  const order = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) order.push([r, c]);
  }
  shuffle(order, rng).forEach(([r, c]) => {
    if (rng() < 0.38 && canShade(shaded, r, c)) shaded[r][c] = true;
  });
  return shaded;
}

function rowClues(shaded) {
  return shaded.map((row) => row.filter((s) => !s).length);
}

function colClues(shaded) {
  const size = shaded.length;
  return Array.from({ length: size }, (_, c) =>
    shaded.reduce((n, row) => n + (row[c] ? 0 : 1), 0)
  );
}

function copyFromVisiblePeer(numbers, solution, r, c, rng) {
  const size = numbers.length;
  const peers = [];
  for (let cc = 0; cc < size; cc++) {
    if (cc !== c && !solution[r][cc]) peers.push([r, cc]);
  }
  for (let rr = 0; rr < size; rr++) {
    if (rr !== r && !solution[rr][c]) peers.push([rr, c]);
  }
  if (peers.length === 0) return;
  const [pr, pc] = peers[Math.floor(rng() * peers.length)];
  numbers[r][c] = numbers[pr][pc];
}

function addDuplicatesForShadedCells(numbers, solution, rng) {
  for (let r = 0; r < solution.length; r++) {
    for (let c = 0; c < solution.length; c++) {
      if (solution[r][c]) copyFromVisiblePeer(numbers, solution, r, c, rng);
    }
  }
}

export function generateHitori(size, seed) {
  const rng = createRng(seed);
  const solution = generateShading(size, rng);
  const numbers = fillNumbers(size, rng);
  addDuplicatesForShadedCells(numbers, solution, rng);
  const rowCounts = rowClues(solution);
  const colCounts = colClues(solution);
  const player = Array.from({ length: size }, () => Array(size).fill(false));
  return { size, numbers, solution, rowCounts, colCounts, player, seed };
}

export function toggleHitoriCell(state, r, c) {
  const player = state.player.map((row) => row.slice());
  player[r][c] = !player[r][c];
  return { ...state, player };
}

function hasAdjacentShaded(player) {
  const size = player.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!player[r][c]) continue;
      for (const [nr, nc] of neighbors4(size, r, c)) {
        if (player[nr][nc]) return true;
      }
    }
  }
  return false;
}

function rowColCountsMatch(player, rowCounts, colCounts) {
  const size = player.length;
  for (let r = 0; r < size; r++) {
    const n = player[r].filter((s) => !s).length;
    if (n !== rowCounts[r]) return false;
  }
  for (let c = 0; c < size; c++) {
    let n = 0;
    for (let r = 0; r < size; r++) if (!player[r][c]) n++;
    if (n !== colCounts[c]) return false;
  }
  return true;
}

function noDupesUnshaded(player, numbers) {
  const size = player.length;
  for (let r = 0; r < size; r++) {
    const seen = new Set();
    for (let c = 0; c < size; c++) {
      if (player[r][c]) continue;
      const v = numbers[r][c];
      if (seen.has(v)) return false;
      seen.add(v);
    }
  }
  for (let c = 0; c < size; c++) {
    const seen = new Set();
    for (let r = 0; r < size; r++) {
      if (player[r][c]) continue;
      const v = numbers[r][c];
      if (seen.has(v)) return false;
      seen.add(v);
    }
  }
  return true;
}

export function isHitoriSolved(state) {
  const { player, solution, numbers, rowCounts, colCounts } = state;
  if (hasAdjacentShaded(player)) return false;
  if (!rowColCountsMatch(player, rowCounts, colCounts)) return false;
  if (!noDupesUnshaded(player, numbers)) return false;
  for (let r = 0; r < state.size; r++) {
    for (let c = 0; c < state.size; c++) {
      if (player[r][c] !== solution[r][c]) return false;
    }
  }
  return true;
}

export function hitoriHasError(state) {
  const { player, rowCounts, colCounts } = state;
  if (hasAdjacentShaded(player)) return true;
  for (let r = 0; r < player.length; r++) {
    const white = player[r].filter((s) => !s).length;
    if (white < rowCounts[r]) return true;
  }
  for (let c = 0; c < player.length; c++) {
    let white = 0;
    for (let r = 0; r < player.length; r++) if (!player[r][c]) white++;
    if (white < colCounts[c]) return true;
  }
  return false;
}
