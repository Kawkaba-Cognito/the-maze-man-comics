/*
 * Split the generated Cosmic Atlas sheets into consistently framed game icons.
 * The source sheets stay in public/ so the production assets remain reproducible
 * without depending on an external generator session.
 *
 *     node scripts/extract-cancel-cosmic-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const sharp = require('sharp');

/*
 * Sources and output are separate directories on purpose.
 *
 * The four atlas sheets are 2.9 MB of BUILD INPUT — nothing at runtime reads
 * them. They used to sit in the output directory, i.e. inside `public/`, which
 * on this project means they would be copied into the build AND written into the
 * service worker's precache: ~3 MB every user downloads and stores to render
 * 532 KB of sprites. `public/` is a publishing surface, not a workspace.
 *
 * SRC is deliberately outside the repo's tracked tree (.character-preview is the
 * existing scratch area, as with the domain-planet source PNGs), so re-running
 * this script is a local operation and the sheets can never be published by
 * accident.
 */
const SRC = path.join(ROOT, '.character-preview/cancel-cosmic-atlas-sources');
const DIR = path.join(ROOT, 'public/Assets/training/cancel-cosmic-atlas-2026');
const SIZE = 256;
const ART_SIZE = 218;
/* Geometric bounds are not always the perceptual centre. The planet's large
 * coral body and bright right-hand ring pull its visual weight down/right, so
 * compensate on the transparent canvas while keeping its full silhouette. */
const OPTICAL_OFFSETS = Object.freeze({
  planet: { x: -8, y: -4 },
});
const ATLASES = Object.freeze([
  {
    file: 'atlas.png',
    cols: 5,
    rows: 2,
    names: [
      'planet', 'satellite', 'rocket', 'crystal', 'helmet',
      'telescope', 'star', 'station', 'comet', 'moon',
    ],
  },
  {
    file: 'atlas-fleet.png',
    cols: 5,
    rows: 2,
    // The generated green plate includes faint detached print speckles. Keep
    // the primary connected illustration in each cell before normalising it.
    keepPrimaryComponent: true,
    names: [
      'portal', 'rocket-right', 'lunar-shuttle', 'observatory', 'nebula-bolt',
      'probe-right', 'probe-left', 'solar-sail', 'lunar-base', 'launch-tower',
    ],
  },
  {
    file: 'atlas-celestial.png',
    cols: 5,
    rows: 2,
    keepPrimaryComponent: true,
    names: [
      'oval-planet-h', 'oval-planet-v', 'planet-rise', 'warp-gate', 'wide-planet',
      'thin-planet', 'round-planet', 'solar-array', 'planet-horizon', 'thin-moon',
    ],
  },
  {
    file: 'atlas-relics.png',
    cols: 3,
    rows: 1,
    keepPrimaryComponent: true,
    names: ['rhombus-asteroid', 'crew-capsule', 'fat-crystal'],
  },
]);

function keepLargestAlphaComponent(data, info) {
  const pixels = info.width * info.height;
  const seen = new Uint8Array(pixels);
  let largest = [];
  const alphaAt = (p) => data[p * info.channels + 3];

  for (let start = 0; start < pixels; start += 1) {
    if (seen[start] || alphaAt(start) <= 8) continue;
    const component = [];
    const queue = [start];
    seen[start] = 1;
    for (let q = 0; q < queue.length; q += 1) {
      const p = queue[q];
      component.push(p);
      const x = p % info.width;
      const y = Math.floor(p / info.width);
      const neighbours = [
        x > 0 ? p - 1 : -1,
        x + 1 < info.width ? p + 1 : -1,
        y > 0 ? p - info.width : -1,
        y + 1 < info.height ? p + info.width : -1,
      ];
      for (const n of neighbours) {
        if (n < 0 || seen[n] || alphaAt(n) <= 8) continue;
        seen[n] = 1;
        queue.push(n);
      }
    }
    if (component.length > largest.length) largest = component;
  }

  if (!largest.length) throw new Error('Atlas cell contains no connected artwork.');
  const keep = new Uint8Array(pixels);
  for (const p of largest) keep[p] = 1;
  for (let p = 0; p < pixels; p += 1) {
    if (!keep[p]) data[p * info.channels + 3] = 0;
  }
}

function alphaBounds(data, info) {
  let x0 = info.width;
  let y0 = info.height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * info.channels + 3] <= 12) continue;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  }
  if (x1 < 0) throw new Error('Atlas cell contains no visible artwork.');
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

for (const atlas of ATLASES) {
  const source = path.join(SRC, atlas.file);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing source atlas: ${path.relative(ROOT, source)}`);
  }
  if (atlas.names.length !== atlas.cols * atlas.rows) {
    throw new Error(`${atlas.file}: name count does not match its grid.`);
  }

  const meta = await sharp(source).metadata();
  if (!meta.width || !meta.height) throw new Error(`Could not read ${atlas.file}.`);

  for (let i = 0; i < atlas.names.length; i += 1) {
    const name = atlas.names[i];
    const col = i % atlas.cols;
    const row = Math.floor(i / atlas.cols);
    const left = Math.round((col * meta.width) / atlas.cols);
    const right = Math.round(((col + 1) * meta.width) / atlas.cols);
    const top = Math.round((row * meta.height) / atlas.rows);
    const bottom = Math.round(((row + 1) * meta.height) / atlas.rows);

    const cell = await sharp(source)
      .extract({ left, top, width: right - left, height: bottom - top })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    if (atlas.keepPrimaryComponent) keepLargestAlphaComponent(cell.data, cell.info);
    const bounds = alphaBounds(cell.data, cell.info);
    const trimmed = await sharp(cell.data, { raw: cell.info })
      .extract(bounds)
      .resize(ART_SIZE, ART_SIZE, { fit: 'inside', withoutEnlargement: false })
      .png()
      .toBuffer();
    const iconMeta = await sharp(trimmed).metadata();
    const optical = OPTICAL_OFFSETS[name] ?? { x: 0, y: 0 };
    const padX = Math.floor((SIZE - iconMeta.width) / 2) + optical.x;
    const padY = Math.floor((SIZE - iconMeta.height) / 2) + optical.y;

    await sharp(trimmed)
      .extend({
        left: padX,
        right: SIZE - iconMeta.width - padX,
        top: padY,
        bottom: SIZE - iconMeta.height - padY,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 92, alphaQuality: 100, effort: 5 })
      .toFile(path.join(DIR, `${name}.webp`));

    console.log(
      `${name.padEnd(17)} ${iconMeta.width}x${iconMeta.height} -> ${SIZE}x${SIZE}` +
      `  optical ${optical.x}/${optical.y}`,
    );
  }
}
