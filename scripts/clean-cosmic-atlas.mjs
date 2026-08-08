/*
 * clean-cosmic-atlas.mjs — repair the sliced Cosmic Atlas sprites.
 *
 * ── The bug, and why it looks like "bad alignment" ──
 * These assets were cut out of atlas sheets, and four of them caught a fragment
 * of the NEIGHBOURING sprite in the slice: `satellite` carries 811px of a stray
 * crescent, `star` 525px across four fragments, `comet` 414px, `nebula-bolt`
 * 58px. Every fragment sits against the image border, which is the signature of
 * a slice that was one or two pixels too generous.
 *
 * The visible symptom is not "there is a speck in the corner" — it is
 * MISALIGNMENT, because GamePiece draws the asset with `object-fit: contain`.
 * Contain fits the whole opaque extent, fragment included, so a stray blob on
 * the left both shrinks the real object and shoves it off-centre inside its
 * frame. Removing the fragment fixes the alignment as a side effect.
 *
 * ── Why the rule is "touches the border", not "is small" ──
 * Several of these illustrations are legitimately multi-part: the star has
 * sparkles, the comet has a tail, the launch tower has separated gantry pieces.
 * A plain size threshold would delete that intentional detail. Slice bleed is
 * distinguished by POSITION instead: it is a small component pressed against
 * the frame edge, where the cut happened. Interior detail is never touched.
 *
 *     node scripts/clean-cosmic-atlas.mjs [--check]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const sharp = require('sharp');

const DIR = path.join(ROOT, 'public/Assets/training/cancel-cosmic-atlas-2026');
const CHECK = process.argv.includes('--check');

/*
 * Where the cleaned sprites land. Defaults to overwriting in place, which is
 * what you want, but ATLAS_OUT can redirect them.
 *
 * That escape hatch is not hypothetical: on this machine the repo is inside a
 * OneDrive folder and Node cannot open these particular files for writing at
 * all — `fs.openSync(path, 'w')` raises a bare "UNKNOWN: unknown error" and
 * rename raises EPERM, even after clearing the read-only attribute, while a
 * plain shell redirect to the same path succeeds. That points at OneDrive
 * placeholder hydration rather than a permissions problem. Writing to a staging
 * directory and copying in with the shell sidesteps it without pretending the
 * in-place path is broken everywhere.
 */
const OUT = process.env.ATLAS_OUT ? path.resolve(process.env.ATLAS_OUT) : DIR;
if (OUT !== DIR) fs.mkdirSync(OUT, { recursive: true });

const ALPHA = 24;          // opaque enough to count as ink
const EDGE = 3;            // px from the border that counts as "at the cut"
/*
 * A component up to this fraction of the main body still counts as bleed.
 *
 * Started at 0.02 and that was wrong: `satellite` carries a clipped ringed
 * planet worth 5.3% of the satellite itself, so the real fragment was the one
 * thing the filter let through. Verified by eye across all four candidates —
 * only satellite has bleed; the dots around `star`, `comet` and `nebula-bolt`
 * are intentional sparkles and debris.
 *
 * Position is what does the real work here, not size: intentional detail sits
 * INSIDE the artwork, while a slice fragment is pressed against the canvas edge
 * where the cut fell. So this cap only has to be loose enough to admit a
 * genuinely large fragment, and the EDGE test keeps interior detail safe.
 */
const MAX_BLEED = 0.15;
const PAD = 0.045;         // uniform breathing room, as a fraction of the canvas

/** 4-way connected components over the alpha channel. */
function components(data, W, H, C) {
  const at = (x, y) => data[(y * W + x) * C + 3];
  const seen = new Uint8Array(W * H);
  const out = [];
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const i0 = y * W + x;
      if (seen[i0] || at(x, y) <= ALPHA) continue;
      const stack = [i0];
      seen[i0] = 1;
      let n = 0, bx0 = x, bx1 = x, by0 = y, by1 = y;
      while (stack.length) {
        const p = stack.pop();
        const py = (p / W) | 0;
        const px = p % W;
        n += 1;
        if (px < bx0) bx0 = px;
        if (px > bx1) bx1 = px;
        if (py < by0) by0 = py;
        if (py > by1) by1 = py;
        const nb = [[px - 1, py], [px + 1, py], [px, py - 1], [px, py + 1]];
        for (const [qx, qy] of nb) {
          if (qx < 0 || qy < 0 || qx >= W || qy >= H) continue;
          const q = qy * W + qx;
          if (!seen[q] && at(qx, qy) > ALPHA) { seen[q] = 1; stack.push(q); }
        }
      }
      out.push({ n, bx0, bx1, by0, by1, px: [] });
    }
  }
  return out.sort((a, b) => b.n - a.n);
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.webp')).sort();
let repaired = 0;
let recentred = 0;

for (const file of files) {
  const src = path.join(DIR, file);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const comps = components(data, W, H, C);
  if (!comps.length) { console.log(`  ${file.padEnd(20)} EMPTY — skipped`); continue; }

  const main = comps[0];
  /*
   * Bleed = a small component lying entirely OUTSIDE the main body's bounding
   * box. Verified against every multi-part sprite in the set: satellite is the
   * only one with such a component (811px of a neighbouring ringed planet at
   * x 19..42, while the satellite itself starts at x 62). Star's five parts,
   * nebula-bolt's five, launch-tower's six, comet's three and both probes all
   * overlap their main box, so none of them is touched.
   *
   * An earlier attempt keyed on "touches the canvas edge within 3px" and matched
   * nothing — the fragment sits 19px in, because the slice was padded after the
   * cut. Separation from the body is the property that actually distinguishes a
   * neighbour's sprite from this sprite's own detail.
   */
  const disjoint = (b) => (
    b.bx1 + EDGE < main.bx0 || b.bx0 - EDGE > main.bx1
    || b.by1 + EDGE < main.by0 || b.by0 - EDGE > main.by1
  );
  const bleed = comps.slice(1).filter((b) => disjoint(b) && b.n <= main.n * MAX_BLEED);

  // Erase bleed from the alpha channel, in place on a copy.
  const out = Buffer.from(data);
  if (bleed.length) {
    const keep = new Uint8Array(W * H);
    // Re-walk the components we are keeping, marking their pixels.
    const bleedSet = new Set(bleed);
    for (const comp of comps) {
      if (bleedSet.has(comp)) continue;
      for (let y = comp.by0; y <= comp.by1; y += 1) {
        for (let x = comp.bx0; x <= comp.bx1; x += 1) keep[y * W + x] = 1;
      }
    }
    for (const b of bleed) {
      for (let y = b.by0; y <= b.by1; y += 1) {
        for (let x = b.bx0; x <= b.bx1; x += 1) {
          // Only clear inside the bleed's own box and only where nothing we are
          // keeping also claims the pixel — boxes can overlap.
          if (!keep[y * W + x]) out[(y * W + x) * C + 3] = 0;
        }
      }
    }
  }

  // Re-measure the surviving extent and re-centre it with uniform padding.
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (out[(y * W + x) * C + 3] > ALPHA) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const inner = Math.round(W * (1 - PAD * 2));
  const k = Math.min(inner / bw, inner / bh);
  const nw = Math.max(1, Math.round(bw * k));
  const nh = Math.max(1, Math.round(bh * k));

  /* .png() is required, not stylistic: without it this returns RAW pixels with
   * no header, and the composite below re-reads it through sharp() where a
   * headerless buffer fails with "unsupported image format". */
  const body = await sharp(out, { raw: { width: W, height: H, channels: C } })
    .extract({ left: x0, top: y0, width: bw, height: bh })
    .resize(nw, nh)
    .png()
    .toBuffer();

  const final = await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: body, left: Math.round((W - nw) / 2), top: Math.round((H - nh) / 2) }])
    .webp({ quality: 92, alphaQuality: 100 })
    .toBuffer();

  const offX = (((x0 + x1) / 2 - W / 2) / W * 100);
  const offY = (((y0 + y1) / 2 - H / 2) / H * 100);
  if (bleed.length) repaired += 1;
  if (Math.abs(offX) > 1 || Math.abs(offY) > 1) recentred += 1;

  /* Truncate-and-write in place, with retries.
   *
   * NOT write-temp-then-rename, which is the usual safe idiom: this repo sits in
   * a OneDrive folder, and rename onto an existing path there fails with EPERM
   * even after the read-only attribute is cleared, because the sync client keeps
   * a handle on the target. Truncating the existing file succeeds where
   * replacing it does not. The retry covers the transient lock. */
  if (!CHECK) {
    const dst = path.join(OUT, file);
    let wrote = false;
    for (let attempt = 0; attempt < 6 && !wrote; attempt += 1) {
      try {
        const fd = fs.openSync(dst, 'w');
        try { fs.writeSync(fd, final); } finally { fs.closeSync(fd); }
        wrote = true;
      } catch (err) {
        if (attempt === 5) throw err;
        const until = Date.now() + 150;
        while (Date.now() < until) { /* spin through the lock */ }
      }
    }
  }
  const tag = bleed.length
    ? `bleed -${bleed.length} (${bleed.reduce((s, b) => s + b.n, 0)}px)`
    : '';
  const off = (Math.abs(offX) > 1 || Math.abs(offY) > 1)
    ? `recentre ${offX.toFixed(1)},${offY.toFixed(1)}`
    : '';
  console.log(`  ${file.replace('.webp', '').padEnd(18)} ${tag.padEnd(22)} ${off}`);
}

console.log(
  `\n${CHECK ? 'checked' : 'cleaned'} ${files.length} sprite(s); ` +
  `${repaired} had slice bleed, ${recentred} were off-centre`,
);
