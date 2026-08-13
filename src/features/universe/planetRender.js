/*
 * planetRender — drawing the planet, Dr Kawkab and the ship.
 *
 * ISOMETRIC, and one rule matters above all the others:
 *
 *   Tile (x, y) is the RECT [x, x+1] x [y, y+1], whose centre is (x+0.5, y+0.5).
 *
 * Draw the diamond at project(x, y) and the terrain sits half a tile away from
 * everything standing on it — 22px across and 11px down. Everything looks
 * mis-placed and every contact happens where nothing is drawn. Project the
 * CENTRE.
 *
 * ── Colour ────────────────────────────────────────────────────────────────
 * A handful of values, and they come from the app rather than from taste: the
 * house amber (--color-amber #e8ac4e), the cream ink (--play-ink-deep #ece0c8)
 * and the wood browns the home chrome is built from.
 *
 * ⚠ Deliberately NOT the Tide blue. That ramp (--play-surface-deep) is a real
 * app palette and the first version of this used it, but Tide is the GAMEPLAY
 * palette — de-browned to one blue hue on purpose, for the training screens.
 * The planet is a Home feature and looked like it had wandered in from
 * Cancellation. One warm hue at four depths; steel and ink are the only things
 * that are not it. Nothing is outlined — shapes are read from where the light
 * falls, not from a border round them.
 */

import {
  CHUNK, T_CHASM, T_PAD, getChunk, planetHash,
} from './planetWorld.js';

export const ISO = { tw: 44, th: 22, lift: 0.86 };

export function project(x, y) {
  return [(x - y) * (ISO.tw / 2), (x + y) * (ISO.th / 2)];
}

/*
 * The whole palette. If a colour is not here it should not be on screen.
 *
 * WARM, not the Tide blue. The first version of this took --play-surface-deep,
 * which is a real app palette but the wrong one: Tide is the GAMEPLAY ramp,
 * deliberately de-browned to a single blue hue for the training screens. The
 * planet lives on Home, so it wears the app's identity colours instead — the
 * amber (--color-amber), the cream ink (--play-ink-deep) and the wood browns
 * that the home chrome is built from. One warm hue at four depths; steel and
 * ink are the only things that are not it.
 */
export const PAL = {
  sky: '#120c09',
  skyLow: '#241812',
  ground: ['#3b2c1f', '#433526'],
  rockSide: '#221710',
  rockTop: '#5d4630',
  chasm: '#0a0705',
  pad: '#4a3a28',
  ink: '#ece0c8',
  amber: '#e8ac4e',
  hull: '#c3d3e6',
};

function shadeHex(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const cl = (v) => Math.max(0, Math.min(255, v + amt));
  const r = cl((n >> 16) & 255);
  const g = cl((n >> 8) & 255);
  const b = cl(n & 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round((((pa >> s) & 255) * (1 - t)) + (((pb >> s) & 255) * t));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

export function isoDiamond(c, px, py, k = 1) {
  const hw = (ISO.tw / 2) * k;
  const hh = (ISO.th / 2) * k;
  c.beginPath();
  c.moveTo(px, py - hh);
  c.lineTo(px + hw, py);
  c.lineTo(px, py + hh);
  c.lineTo(px - hw, py);
  c.closePath();
}

/* A deep, soft contact shadow — the cheapest thing that makes an object sit ON
   the ground instead of floating above a flat plate. */
export function contactShadow(c, sx, sy, rx, ry, a) {
  const g = c.createRadialGradient(sx, sy, 0, sx, sy, rx);
  g.addColorStop(0, `rgba(0,0,0,${a})`);
  g.addColorStop(0.6, `rgba(0,0,0,${a * 0.5})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.save();
  c.translate(sx, sy);
  c.scale(1, ry / rx);
  c.translate(-sx, -sy);
  c.beginPath();
  c.arc(sx, sy, rx, 0, Math.PI * 2);
  c.fillStyle = g;
  c.fill();
  c.restore();
}

/* ── terrain ───────────────────────────────────────────────────────────── */

function drawTile(c, x, y, t) {
  const [px, py] = project(x + 0.5, y + 0.5);
  const v = planetHash(x, y);

  isoDiamond(c, px, py);
  if (t === T_CHASM) c.fillStyle = PAL.chasm;
  else if (t === T_PAD) c.fillStyle = PAL.pad;
  else c.fillStyle = PAL.ground[v > 0.5 ? 1 : 0];
  c.fill();

  // The only marks on the ground: the pad's ring, and the faintest grain so a
  // wide empty plain is not a flat colour field.
  if (t === T_PAD) {
    c.strokeStyle = 'rgba(232, 172, 78, .3)';
    c.lineWidth = 1.2;
    isoDiamond(c, px, py, 0.6);
    c.stroke();
  } else if (t !== T_CHASM && v > 0.94) {
    c.fillStyle = 'rgba(236, 224, 200, .05)';
    c.fillRect(px - 2, py - 1, 3, 2);
  }
}

/*
 * Where a chunk lands on the world plane, WITHOUT painting it.
 *
 * The visible chunk range is a bounding box around a rotated diamond, so
 * roughly half the chunks it contains are off screen. Being able to ask for the
 * rectangle before committing to the canvas lets the caller skip those
 * entirely — otherwise every frame paints and blits about a dozen 1.4 MB
 * chunks that nobody can see.
 */
export function chunkRect(cx, cy) {
  const x0 = cx * CHUNK;
  const y0 = cy * CHUNK;
  const pad = ISO.tw;
  const left = project(x0, y0 + CHUNK)[0] - pad;
  const right = project(x0 + CHUNK, y0)[0] + pad;
  const top = project(x0, y0)[1] - pad;
  const bottom = project(x0 + CHUNK, y0 + CHUNK)[1] + pad;
  return { x: left, y: top, w: right - left, h: bottom - top };
}

export function paintChunk(cx, cy) {
  const x0 = cx * CHUNK;
  const y0 = cy * CHUNK;
  const { x: left, y: top, w, h } = chunkRect(cx, cy);
  const right = left + w;
  const bottom = top + h;

  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.ceil(right - left));
  cv.height = Math.max(1, Math.ceil(bottom - top));
  const cc = cv.getContext('2d');
  cc.translate(-left, -top);
  const rec = getChunk(cx, cy);
  for (let j = 0; j < CHUNK; j++) {
    for (let i = 0; i < CHUNK; i++) {
      drawTile(cc, x0 + i, y0 + j, rec.tiles[j * CHUNK + i]);
    }
  }
  return { cv, x: left, y: top, w: cv.width, h: cv.height };
}

/** Rock stands up off the ground, so the surface has relief and a horizon. */
export function drawRock(c, x, y, sx, sy, z) {
  const v = planetHash(x, y);
  const h = ISO.tw * (0.26 + v * 0.22) * ISO.lift * z;
  const hw = (ISO.tw / 2) * z;
  const hh = (ISO.th / 2) * z;
  c.beginPath();
  c.moveTo(sx - hw, sy);
  c.lineTo(sx - hw, sy - h);
  c.lineTo(sx, sy - h + hh);
  c.lineTo(sx, sy + hh);
  c.closePath();
  c.fillStyle = PAL.rockSide;
  c.fill();
  c.beginPath();
  c.moveTo(sx + hw, sy);
  c.lineTo(sx + hw, sy - h);
  c.lineTo(sx, sy - h + hh);
  c.lineTo(sx, sy + hh);
  c.closePath();
  c.fillStyle = shadeHex(PAL.rockSide, -6);
  c.fill();
  isoDiamond(c, sx, sy - h, z);
  c.fillStyle = PAL.rockTop;
  c.fill();
}

/* ── the ship ──────────────────────────────────────────────────────────── */

/*
 * The hull is a TOP-DOWN silhouette — the outline Void Runner extrudes,
 * authored flat with the nose at +X because the Spaceship game draws it from
 * above. Here we are above again, so it is used as written.
 *
 * Two things make it read as solid rather than as paper:
 *   1. It is drawn in GRID space and the isometric matrix lays it down. Drawn
 *      flat in screen space it reads as a billboard standing on the pad,
 *      because in an isometric scene the screen plane IS the vertical plane.
 *   2. Each part is STACKED — the same silhouette many times, a pixel apart,
 *      dark below and light above, so the slivers between layers become the
 *      side wall — and the parts sit at DIFFERENT heights. Thin wings, a tall
 *      fuselage, nacelles between, a canopy on top. That difference in height
 *      is most of what the eye uses to call something three-dimensional.
 */
const SHIP_HULL = [
  [0.52, 0], [0.42, 0.10], [0.20, 0.13], [0.06, 0.15],
  [-0.12, 0.42], [-0.26, 0.44], [-0.20, 0.15], [-0.34, 0.13],
  [-0.46, 0.20], [-0.40, 0.06], [-0.40, -0.06], [-0.46, -0.20],
  [-0.34, -0.13], [-0.20, -0.15], [-0.26, -0.44], [-0.12, -0.42],
  [0.06, -0.15], [0.20, -0.13], [0.42, -0.10],
];
const SHIP_BODY = [
  [0.50, 0], [0.40, 0.075], [0.14, 0.105], [-0.22, 0.10],
  [-0.42, 0.07], [-0.44, 0], [-0.42, -0.07], [-0.22, -0.10],
  [0.14, -0.105], [0.40, -0.075],
];

export function drawShip(c, ship, sx, sy, z, t) {
  const LEN = 4.4;                     // tiles, nose to tail — one big craft
  const lift = ship.alt * 74 * z;
  const sway = ship.riding ? Math.sin(t * 2.2) * 1.8 * z : 0;
  const shadowR = ISO.tw * 1.5 * z;
  contactShadow(c, sx, sy, shadowR * (1 - ship.alt * 0.42),
    shadowR * 0.36 * (1 - ship.alt * 0.3), 0.5 - ship.alt * 0.3);

  const path = (build, up) => {
    c.save();
    c.translate(sx + sway, sy - lift - (up || 0));
    c.transform((ISO.tw / 2) * z, (ISO.th / 2) * z, -(ISO.tw / 2) * z, (ISO.th / 2) * z, 0, 0);
    c.rotate(ship.ang);
    c.scale(LEN, LEN * (1 - Math.abs(ship.bank) * 0.2));
    c.beginPath();
    build();
    c.restore();
  };
  const poly = (pts) => () => {
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
  };
  /* One layer every 2px rather than every 1px. The side wall is a shaded ramp,
     so the seam between layers is invisible at this spacing, and it halves the
     number of transform-and-fill pairs the ship costs — which on a phone is the
     single most expensive thing drawn each frame. */
  const solid = (build, h, base, dark, light, top) => {
    const steps = Math.max(2, Math.round(h / 2));
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      path(build, base + f * h);
      c.fillStyle = i === steps ? top : mixHex(dark, light, f);
      c.fill();
    }
  };

  const dark = shadeHex(PAL.hull, -92);
  const mid = shadeHex(PAL.hull, -34);
  const wingH = 10 * z;
  const bodyH = 32 * z;
  const nacH = 18 * z;
  const canH = 12 * z;

  if (ship.alt < 0.12 && !ship.riding) {
    c.fillStyle = 'rgba(20, 14, 10, .85)';
    for (const [gx, gy] of [[0.3, 0], [-0.32, 0.26], [-0.32, -0.26]]) {
      path(() => { c.ellipse(gx, gy, 0.05, 0.05, 0, 0, Math.PI * 2); }, 0);
      c.fill();
    }
  }

  const thr = 0.25 + ship.throttle * 0.75;
  for (const side of [-1, 1]) {
    path(() => {
      c.moveTo(-0.40, side * 0.155);
      c.lineTo(-(0.44 + 0.6 * thr), side * 0.075);
      c.lineTo(-0.38, side * 0.055);
      c.closePath();
    }, nacH * 0.5);
    const g = c.createLinearGradient(sx, sy - lift,
      sx - Math.cos(ship.ang) * 80 * z, sy - lift - Math.sin(ship.ang) * 40 * z);
    g.addColorStop(0, 'rgba(232, 172, 78, .95)');
    g.addColorStop(1, 'rgba(232, 172, 78, 0)');
    c.fillStyle = g;
    c.fill();
  }

  solid(poly(SHIP_HULL), wingH, 0, dark, mid, PAL.hull);

  const nac = shadeHex(PAL.hull, -120);
  solid(() => {
    c.rect(-0.42, 0.085, 0.19, 0.09);
    c.rect(-0.42, -0.175, 0.19, 0.09);
  }, nacH, wingH * 0.6, nac, shadeHex(nac, 24), shadeHex(nac, 40));

  solid(poly(SHIP_BODY), bodyH, wingH * 0.5, dark, mid, shadeHex(PAL.hull, 20));

  const top = wingH * 0.5 + bodyH;

  // Cream spine — the app's ink colour, the one warm line on the craft.
  path(() => { c.rect(-0.3, -0.028, 0.6, 0.056); }, top);
  c.fillStyle = PAL.ink;
  c.fill();

  const glass = '#181310';
  solid(() => { c.ellipse(0.15, 0, 0.115, 0.072, 0, 0, Math.PI * 2); },
    canH, top, glass, shadeHex(glass, 20), glass);
  path(() => { c.ellipse(0.16, -0.012, 0.08, 0.044, 0, 0, Math.PI * 2); }, top + canH);
  c.save();
  c.globalAlpha = 0.32 + ship.throttle * 0.4;
  c.fillStyle = PAL.ink;
  c.fill();
  c.restore();

  // One specular streak along the sunlit side of the roof.
  path(() => { c.ellipse(0.02, -0.055, 0.24, 0.02, 0, 0, Math.PI * 2); }, top);
  c.save();
  c.globalAlpha = 0.4;
  c.fillStyle = '#ffffff';
  c.fill();
  c.restore();
}

/* ── Dr Kawkab ─────────────────────────────────────────────────────────── */

/*
 * Drawn from the app's own geometry (features/character/planetGeometry.js): a
 * Fibonacci lattice on a unit sphere with edges linked inside the mean spacing
 * and split into three brightness buckets by depth, so the far side of the web
 * shows THROUGH the body rather than disappearing; limbs are tapered bezier
 * outlines drawn UNDER the sphere with their roots inside radius 1, so they
 * emerge from behind it instead of being welded to its outline.
 *
 * Black, at the user's direction — and on black the star web becomes the whole
 * character. The web is the app's cream ink, so he belongs to the same palette
 * as everything else. The body sits just off true black because a flat #000
 * sphere has no silhouette against dark ground.
 */
/* Neutral greys, not blue-greys. He is meant to read as BLACK, and a blue-cast
   black beside warm ground just looks like a different material. */
export const KAWKAB = {
  core: '#3a3733', mid: '#1f1d1a', edge: '#070606',
  rim: 'rgba(236, 224, 200, 0.5)',
  mesh: '#ece0c8', spark: '#fffaf0',
  limbTop: '#54504a', limbBottom: '#221f1c',
  eye: '#ece0c8', pupil: '#0c0b09',
};
const BUCKET_ALPHA = [0.22, 0.5, 0.92];
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const DETAIL = {
  full: { points: 112, stars: 58, link: 1.16, dot: 1 },
  mid: { points: 62, stars: 30, link: 1.26, dot: 1.5 },
  low: { points: 28, stars: 12, link: 1.42, dot: 2.4 },
};
const meshCache = new Map();

function meshRng(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sphereMesh(tier) {
  if (meshCache.has(tier)) return meshCache.get(tier);
  const { points, stars, link, dot } = DETAIL[tier];
  const pts = [];
  for (let i = 0; i < points; i++) {
    const y = 1 - ((i + 0.5) / points) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = i * GOLDEN_ANGLE;
    pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
  }
  const depthMix = (z) => 0.28 + 0.72 * ((z + 1) / 2);
  const bucket = (v) => Math.min(2, Math.max(0, Math.floor(v * 3)));
  const spacing = Math.sqrt((4 * Math.PI) / points);
  const maxL2 = (spacing * link) ** 2;
  const edges = [[], [], []];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i][0] - pts[j][0];
      const dy = pts[i][1] - pts[j][1];
      const dz = pts[i][2] - pts[j][2];
      if (dx * dx + dy * dy + dz * dz > maxL2) continue;
      edges[bucket(depthMix(Math.min(pts[i][2], pts[j][2])))]
        .push([pts[i][0], -pts[i][1], pts[j][0], -pts[j][1]]);
    }
  }
  const dots = [[], [], []];
  for (const [x, y, z] of pts) {
    dots[bucket(depthMix(z))].push([x, -y, (0.012 + 0.012 * depthMix(z)) * dot]);
  }
  const rng = meshRng(0x4b41574b);
  for (let i = 0; i < stars; i++) {
    const y = rng() * 2 - 1;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = rng() * Math.PI * 2;
    dots[bucket(depthMix(Math.sin(th) * r))]
      .push([Math.cos(th) * r, -y, (0.008 + rng() * 0.014) * dot]);
  }
  const out = { edges, dots };
  meshCache.set(tier, out);
  return out;
}

/** Detail from RENDERED size — a dense lattice at 40px is grey mud. */
function tierForSize(px) {
  if (px < 26) return 'low';
  if (px < 64) return 'mid';
  return 'full';
}

/* The reference art's arms-out stance. Roots sit inside radius 1 so limbs
   emerge from behind the body; tips clear the rim or the mask eats them. */
const LIMB = {
  armL: [[-0.7, 0.18], [-0.98, 0.32], [-1.2, 0.48], [-1.38, 0.6]],
  armR: [[0.7, 0.18], [0.98, 0.32], [1.2, 0.48], [1.38, 0.6]],
  legL: [[-0.24, 0.76], [-0.32, 0.98], [-0.42, 1.18], [-0.5, 1.34]],
  legR: [[0.24, 0.76], [0.32, 0.98], [0.42, 1.18], [0.5, 1.34]],
};
const ARM_W = [0.088, 0.044];
const LEG_W = [0.104, 0.054];

function bez(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const cc = 3 * u * t * t;
  const d = t * t * t;
  return [
    a * p0[0] + b * p1[0] + cc * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + cc * p2[1] + d * p3[1],
  ];
}

/* A limb is a bezier centre-line stroked with a width that TAPERS root to tip.
   Canvas cannot taper a stroke, so the outline is walked by hand — along the
   curve offsetting by +normal, then back by −normal — with the width eased so
   it falls off near the tip rather than linearly, which would read as a wedge.
   That taper is most of what makes the limbs look drawn. */
function limbPath(c, p0, p1, p2, p3, w0, w1, steps) {
  const left = [];
  const right = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const [x, y] = bez(p0, p1, p2, p3, t);
    const [ax, ay] = bez(p0, p1, p2, p3, Math.max(0, t - 0.001));
    const [bx, by] = bez(p0, p1, p2, p3, Math.min(1, t + 0.001));
    let tx = bx - ax;
    let ty = by - ay;
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    const w = (w0 + (w1 - w0) * (t * t * (3 - 2 * t))) / 2;
    left.push([x - ty * w, y + tx * w]);
    right.push([x + ty * w, y - tx * w]);
  }
  c.beginPath();
  c.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < left.length; i++) c.lineTo(left[i][0], left[i][1]);
  for (let i = right.length - 1; i >= 0; i--) c.lineTo(right[i][0], right[i][1]);
  c.closePath();
  return [p3[0], p3[1], p3[0] - p2[0], p3[1] - p2[1]];
}

export function drawKawkab(c, hero, sx, sy, R, t) {
  const walk = hero.moving;
  const cycle = hero.step * 3.2;
  const swing = Math.sin(cycle) * walk;
  const bob = (Math.abs(Math.sin(cycle)) * walk * 0.9 + Math.sin(t * 2) * 0.35) * R * 0.05;

  contactShadow(c, sx, sy, R * 0.74, R * 0.25, 0.5);

  c.save();
  c.translate(sx, sy - R * 1.44 - bob);
  c.scale(R, R);
  c.lineJoin = 'round';

  const legP = swing * 0.22;
  const armP = -swing * 0.16;
  const pose = {
    armL: LIMB.armL.map(([x, y], i) => [x, y + (i > 1 ? armP : armP * 0.4)]),
    armR: LIMB.armR.map(([x, y], i) => [x, y - (i > 1 ? armP : armP * 0.4)]),
    legL: LIMB.legL.map(([x, y], i) => [x + (i > 1 ? legP : legP * 0.4), y]),
    legR: LIMB.legR.map(([x, y], i) => [x - (i > 1 ? legP : legP * 0.4), y]),
  };
  const lg = c.createLinearGradient(0, -0.4, 0, 1.6);
  lg.addColorStop(0, KAWKAB.limbTop);
  lg.addColorStop(1, KAWKAB.limbBottom);
  for (const key of ['armL', 'armR', 'legL', 'legR']) {
    const [p0, p1, p2, p3] = pose[key];
    const isLeg = key.startsWith('leg');
    const [w0, w1] = isLeg ? LEG_W : ARM_W;
    const [tx, ty, dx, dy] = limbPath(c, p0, p1, p2, p3, w0, w1, 12);
    c.fillStyle = lg;
    c.fill();
    const len = Math.hypot(dx, dy) || 1;
    c.save();
    c.translate(tx + (dx / len) * (isLeg ? 0.03 : 0.02), ty + (dy / len) * (isLeg ? 0.03 : 0.02));
    c.rotate(Math.atan2(dy, dx));
    c.beginPath();
    c.ellipse(0, 0, isLeg ? 0.098 : 0.078, isLeg ? 0.058 : 0.05, 0, 0, Math.PI * 2);
    c.fillStyle = KAWKAB.limbBottom;
    c.fill();
    c.restore();
  }

  c.beginPath();
  c.arc(0, 0, 1, 0, Math.PI * 2);
  const g = c.createRadialGradient(-0.3, -0.34, 0.08, 0, 0, 1.05);
  g.addColorStop(0, KAWKAB.core);
  g.addColorStop(0.55, KAWKAB.mid);
  g.addColorStop(1, KAWKAB.edge);
  c.fillStyle = g;
  c.fill();

  c.save();
  c.beginPath();
  c.arc(0, 0, 0.985, 0, Math.PI * 2);
  c.clip();
  const m = sphereMesh(tierForSize(R * 2));
  c.rotate(Math.sin(t * 0.1) * 0.05);
  for (let b = 0; b < 3; b++) {
    c.globalAlpha = BUCKET_ALPHA[b];
    c.strokeStyle = KAWKAB.mesh;
    c.lineWidth = 0.013;
    c.beginPath();
    for (const [x1, y1, x2, y2] of m.edges[b]) {
      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
    }
    c.stroke();
    /* All the stars in a bucket as ONE path, filled once. Ninety separate
       beginPath/arc/fill triples was the character's whole cost; batching drops
       it to three fills a frame. The moveTo before each arc is required — arc()
       continues from the current point, so without it every star is joined to
       the last by a hairline. */
    c.fillStyle = KAWKAB.spark;
    c.beginPath();
    for (const [x, y, r] of m.dots[b]) {
      c.moveTo(x + r, y);
      c.arc(x, y, r, 0, Math.PI * 2);
    }
    c.fill();
  }
  c.globalAlpha = 1;
  c.restore();

  // Rim light from the same upper-left sun as everything else.
  c.beginPath();
  c.arc(0, 0, 1, Math.PI * 0.78, Math.PI * 1.62);
  c.strokeStyle = KAWKAB.rim;
  c.lineWidth = 0.05;
  c.stroke();

  const gaze = hero.face * 0.05 * (0.4 + walk * 0.6);
  c.fillStyle = KAWKAB.eye;
  for (const s of [-1, 1]) {
    c.beginPath();
    c.ellipse(0.3 * s + gaze, -0.06, 0.088, 0.125, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = KAWKAB.pupil;
  for (const s of [-1, 1]) {
    c.beginPath();
    c.ellipse(0.3 * s + gaze * 1.7, -0.05, 0.042, 0.06, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.strokeStyle = KAWKAB.mesh;
  c.lineWidth = 0.036;
  c.lineCap = 'round';
  for (const s of [-1, 1]) {
    const cx = 0.3 * s;
    c.beginPath();
    c.moveTo(cx - 0.105, -0.3);
    c.quadraticCurveTo(cx, -0.375, cx + 0.105, -0.3);
    c.stroke();
  }
  // The mouth never becomes a frown — he is a companion in a wellbeing app,
  // not a scorekeeper.
  c.beginPath();
  c.moveTo(-0.155, 0.145);
  c.quadraticCurveTo(0, 0.421, 0.155, 0.145);
  c.stroke();

  c.restore();
}
