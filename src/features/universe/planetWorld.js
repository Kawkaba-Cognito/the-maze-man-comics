/*
 * planetWorld — the surface of Kawkab's planet, as pure maths.
 *
 * No React, no DOM, no canvas. Everything here answers a question about a
 * coordinate, so the same module drives rendering, collision and pathfinding.
 *
 * ⚠ THE WORLD IS NOT STORED. `tileAt(x, y)` is a pure function of its
 * arguments, so the planet has no size — there is no array to allocate and
 * therefore no number to exceed. Walk or fly in one direction for as long as
 * you like and the ground keeps arriving. What IS stored is a bounded cache of
 * recently visited chunks and whatever the player has changed, which is sparse.
 *
 * It is deliberately EMPTY. Three tile kinds and nothing else: ground you walk
 * on, rock you walk around, and rifts you walk along. A planet you have just
 * landed on should feel like somewhere nobody has been, and every extra kind of
 * thing scattered across it makes it feel less like that, not more.
 */

export const T_GROUND = 0;
export const T_ROCK = 1;
export const T_CHASM = 2;
export const T_PAD = 3;

export function isSolidTile(t) {
  return t === T_ROCK || t === T_CHASM;
}

/* ── noise ─────────────────────────────────────────────────────────────── */

export function planetHash(x, y) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function vnoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = planetHash(xi, yi);
  const b = planetHash(xi + 1, yi);
  const c = planetHash(xi, yi + 1);
  const d = planetHash(xi + 1, yi + 1);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

export function planetFbm(x, y, octaves = 3) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let fx = x;
  let fy = y;
  for (let i = 0; i < octaves; i++) {
    sum += vnoise(fx, fy) * amp;
    norm += amp;
    amp *= 0.5;
    fx *= 2.03;
    fy *= 2.03;
  }
  return sum / norm;
}

/* ── the landing site ──────────────────────────────────────────────────── */

export const LANDING = { x: 0, y: 0, r: 15 };

/* ── tiles ─────────────────────────────────────────────────────────────── */

function generateTile(x, y) {
  const d = Math.hypot(x - LANDING.x, y - LANDING.y);
  if (d < 4.2) return T_PAD;
  if (d < LANDING.r) return T_GROUND;

  /*
   * Rifts follow a CONTOUR of the noise field — |n − 0.5| is small only where
   * the field crosses its midpoint, and that traces long continuous lines. A
   * plain threshold can never give you a canyon, only islands.
   */
  if (Math.abs(planetFbm(x * 0.011, y * 0.011, 2) - 0.5) < 0.011) return T_CHASM;

  // Rock in slow, wide masses, so the ground between them stays open.
  const m = planetFbm(x * 0.028, y * 0.028, 3);
  return m > 0.605 ? T_ROCK : T_GROUND;
}

/* ── chunks ────────────────────────────────────────────────────────────── */

export const CHUNK = 16;

const CHUNK_DATA_CAP = 1200;
const chunkCache = new Map();
let clock = 0;

/* One-entry memo. tileAt is the hottest function in the app — collision alone
   calls it dozens of times per body per sub-step at 120Hz — and consecutive
   calls are nearly always inside the same chunk. */
let lastCx = NaN;
let lastCy = NaN;
let lastRec = null;

export function tickWorldClock() {
  clock += 1;
}

export function clearWorldCaches() {
  chunkCache.clear();
  lastRec = null;
  lastCx = NaN;
  lastCy = NaN;
}

/* A NUMBER key, not a template string. `${cx},${cy}` allocated a string on
   every tile query — hundreds of thousands a second once collision and the
   rock scan are both running, and that garbage was the largest avoidable cost
   in the loop. Coordinates up to ±2M pack into a safe integer. */
const ckey = (cx, cy) => cy * 4194304 + cx;

function evictChunks() {
  const entries = [...chunkCache.entries()].sort((a, b) => a[1].used - b[1].used);
  const drop = Math.max(1, entries.length - Math.floor(CHUNK_DATA_CAP * 0.78));
  for (let i = 0; i < drop; i++) chunkCache.delete(entries[i][0]);
  lastRec = null;
  lastCx = NaN;
}

export function getChunk(cx, cy) {
  const key = ckey(cx, cy);
  const hit = chunkCache.get(key);
  if (hit) {
    hit.used = clock;
    return hit;
  }
  const tiles = new Uint8Array(CHUNK * CHUNK);
  /*
   * Rocks are listed as the chunk is built, not hunted for every frame.
   *
   * The renderer needs the raised rocks in draw order, and the obvious way to
   * get them is to walk every visible tile each frame asking `tileAt`. That is
   * one to two thousand queries a frame doing work that never changes. Storing
   * the handful of coordinates once per chunk turns the per-frame cost into a
   * short list append — the difference between a phone holding 60fps and not.
   */
  const rocks = [];
  const x0 = cx * CHUNK;
  const y0 = cy * CHUNK;
  for (let j = 0; j < CHUNK; j++) {
    for (let i = 0; i < CHUNK; i++) {
      const t = generateTile(x0 + i, y0 + j);
      tiles[j * CHUNK + i] = t;
      if (t === T_ROCK) rocks.push(x0 + i, y0 + j);
    }
  }
  const rec = { tiles, rocks, used: clock };
  chunkCache.set(key, rec);
  if (chunkCache.size > CHUNK_DATA_CAP) evictChunks();
  return rec;
}

const edits = new Map();

export function editTile(x, y, t) {
  edits.set(y * 4194304 + x, t);
  const cx = Math.floor(x / CHUNK);
  const cy = Math.floor(y / CHUNK);
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) chunkCache.delete(ckey(cx + i, cy + j));
  }
  lastRec = null;
  lastCx = NaN;
}

export function tileAt(x, y) {
  const cx = Math.floor(x / CHUNK);
  const cy = Math.floor(y / CHUNK);
  let rec;
  if (cx === lastCx && cy === lastCy) {
    rec = lastRec;
  } else {
    rec = getChunk(cx, cy);
    lastCx = cx;
    lastCy = cy;
    lastRec = rec;
  }
  // Only pay for the overlay once the player has changed something.
  if (edits.size) {
    const e = edits.get(y * 4194304 + x);
    if (e !== undefined) return e;
  }
  return rec.tiles[(y - cy * CHUNK) * CHUNK + (x - cx * CHUNK)];
}

export function solidAt(x, y) {
  return isSolidTile(tileAt(x, y));
}

/* ── collision ─────────────────────────────────────────────────────────── */

/*
 * A circle resolved against tile RECTANGLES.
 *
 * The naive version tests solid(floor(x ± r), floor(y)) on each axis in turn.
 * It is cheap and wrong in the two places players notice: it snags on outside
 * corners (both axis tests fail at once even though there is clearly room) and
 * it lets you clip diagonally through the join between two tiles.
 *
 * This takes the closest point on each overlapping tile rect, pushes the circle
 * out along the vector to it, and repeats. A corner becomes a point contact
 * with a diagonal normal, so you ROUND it. Velocity is then flattened against
 * the accumulated normal — only the part heading into the surface is removed,
 * so you keep your speed along a wall and it feels solid rather than sticky.
 */
export function resolveCircle(body, r) {
  let nx = 0;
  let ny = 0;
  let hits = 0;
  for (let iter = 0; iter < 3; iter++) {
    let moved = false;
    const x0 = Math.floor(body.x - r);
    const x1 = Math.floor(body.x + r);
    const y0 = Math.floor(body.y - r);
    const y1 = Math.floor(body.y + r);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!solidAt(tx, ty)) continue;
        const cx = Math.max(tx, Math.min(body.x, tx + 1));
        const cy = Math.max(ty, Math.min(body.y, ty + 1));
        let dx = body.x - cx;
        let dy = body.y - cy;
        let d = Math.hypot(dx, dy);
        if (d >= r) continue;
        if (d < 1e-6) {
          const toL = body.x - tx;
          const toR = tx + 1 - body.x;
          const toT = body.y - ty;
          const toB = ty + 1 - body.y;
          const m = Math.min(toL, toR, toT, toB);
          if (m === toL) { body.x = tx - r; dx = -1; dy = 0; } else if (m === toR) {
            body.x = tx + 1 + r; dx = 1; dy = 0;
          } else if (m === toT) { body.y = ty - r; dx = 0; dy = -1; } else {
            body.y = ty + 1 + r; dx = 0; dy = 1;
          }
          d = 1;
        } else {
          const push = r - d;
          body.x += (dx / d) * push;
          body.y += (dy / d) * push;
        }
        nx += dx / d;
        ny += dy / d;
        hits += 1;
        moved = true;
      }
    }
    if (!moved) break;
  }
  if (hits) {
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;
    const into = body.vx * nx + body.vy * ny;
    if (into < 0) {
      body.vx -= nx * into;
      body.vy -= ny * into;
    }
  }
  return hits;
}

/* ── pathfinding ───────────────────────────────────────────────────────── */

/*
 * A flood over the whole world is impossible when the world has no size — and
 * the obvious implementation allocates its arrays on every tap. This searches a
 * fixed window around the walker with buffers allocated ONCE, marking visited
 * by GENERATION so nothing has to be cleared between searches.
 */
const PW = 96;
const pgSeen = new Int32Array(PW * PW);
const pgPrev = new Int32Array(PW * PW);
const pgQueue = new Int32Array(PW * PW);
let pgGen = 0;

export function findPath(sx0, sy0, tx0, ty0) {
  const sx = Math.floor(sx0);
  const sy = Math.floor(sy0);
  const ox = sx - PW / 2;
  const oy = sy - PW / 2;
  const tx = Math.max(ox + 1, Math.min(ox + PW - 2, Math.floor(tx0)));
  const ty = Math.max(oy + 1, Math.min(oy + PW - 2, Math.floor(ty0)));
  if (sx === tx && sy === ty) return null;
  if (solidAt(tx, ty)) return null;

  pgGen += 1;
  const idx = (x, y) => (y - oy) * PW + (x - ox);
  let head = 0;
  let tail = 0;
  const start = idx(sx, sy);
  pgSeen[start] = pgGen;
  pgPrev[start] = -1;
  pgQueue[tail] = start;
  tail += 1;
  const goal = idx(tx, ty);
  let found = false;

  while (head < tail) {
    const cur = pgQueue[head];
    head += 1;
    if (cur === goal) { found = true; break; }
    const cx = (cur % PW) + ox;
    const cy = Math.floor(cur / PW) + oy;
    for (let k = 0; k < 4; k++) {
      const nx = cx + (k === 0 ? 1 : k === 1 ? -1 : 0);
      const ny = cy + (k === 2 ? 1 : k === 3 ? -1 : 0);
      if (nx < ox + 1 || ny < oy + 1 || nx > ox + PW - 2 || ny > oy + PW - 2) continue;
      const ni = idx(nx, ny);
      if (pgSeen[ni] === pgGen || solidAt(nx, ny)) continue;
      pgSeen[ni] = pgGen;
      pgPrev[ni] = cur;
      pgQueue[tail] = ni;
      tail += 1;
    }
  }
  if (!found) return null;
  const out = [];
  let node = goal;
  while (node !== start && node !== -1) {
    out.push({ x: (node % PW) + ox, y: Math.floor(node / PW) + oy });
    node = pgPrev[node];
  }
  out.reverse();
  return out.length ? out : null;
}

export function findOpenNear(x, y, maxR = 24) {
  for (let r = 0; r < maxR; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const nx = Math.floor(x) + dx;
        const ny = Math.floor(y) + dy;
        if (!solidAt(nx, ny)) return { x: nx + 0.5, y: ny + 0.5 };
      }
    }
  }
  return { x, y };
}
