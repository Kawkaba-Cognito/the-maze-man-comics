#!/usr/bin/env node
/*
 * bake-cast-portraits — turn the rigged 3D cast into static portrait PNGs.
 *
 * ── Why ───────────────────────────────────────────────────────────────────
 * Detective's case file shows head-and-shoulders portraits of the suspects.
 * Rendering those at runtime meant every case download pulled FIVE rigged
 * characters plus the shared clip library before the screen could draw:
 *
 *     hooded-figure 2.0MB + lola 1.6 + mimi 1.6 + star 1.6
 *     + kawkab-mascot 2.0 + cast-clips 1.5   =  10.3 MB
 *
 * ...to produce six small still images. That is most of the "games are slow to
 * start" report. Baked here instead: ~105 KB for the whole set, downloaded
 * lazily as ordinary images, and the GLBs stay where they belong — in the games
 * that actually animate them (Story Time's stage, the noir interrogation).
 *
 * ── How ───────────────────────────────────────────────────────────────────
 * There is no headless GL in this repo and adding one for a build step is a bad
 * trade, so this drives the Chrome that is already installed. It screenshots
 * public/_bake-portrait.html, which renders one portrait full-bleed using the
 * app's own castPortraitBake — so the baked image is exactly what the runtime
 * produced, framing and lighting included.
 *
 *   1. npm run dev        (the page imports from /src, so Vite must be serving)
 *   2. node scripts/bake-cast-portraits.mjs
 *
 * Re-run whenever a character model or the portrait framing changes. The output
 * is committed — CI does not bake.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT_DIR = join(ROOT, 'public/Assets/portraits');
const BASE = process.env.BAKE_BASE || 'http://localhost:5173/the-maze-man-comics';
const SIZE = Number(process.env.BAKE_SIZE || 256);

/*
 * The five SUSPECT rigs. Deliberately not 'kawkab': castIdFor draws from
 * SUSPECT_IDS, which excludes him (Detective Kawkab is never in his own
 * line-up), so a portrait of him would never be shown. He also happens to be
 * the one unrigged model and baked blank — but the reason to skip him is that
 * nothing asks for him.
 */
const IDS = ['ramy', 'lola', 'mimi', 'star', 'fadi'];

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

const chrome = process.env.CHROME_PATH || CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error('bake-cast-portraits: no Chrome found. Set CHROME_PATH.');
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

let failed = 0;
for (const id of IDS) {
  const out = join(OUT_DIR, `${id}.png`);
  const url = `${BASE}/_bake-portrait.html?id=${id}&size=${SIZE}`;
  try {
    execFileSync(chrome, [
      '--headless=new',
      '--disable-gpu-sandbox',
      // The page is transparent; keep the alpha so portraits sit on any surface.
      '--default-background-color=00000000',
      `--screenshot=${out}`,
      `--window-size=${SIZE},${SIZE}`,
      // The GLB has to load and a frame has to render before the shot.
      '--virtual-time-budget=15000',
      url,
    ], { stdio: 'pipe', timeout: 90_000 });
    const kb = existsSync(out) ? Math.round(statSync(out).size / 1024) : 0;
    if (!kb) throw new Error('no file written');
    console.log(`  ${id.padEnd(8)} ${String(kb).padStart(4)} KB`);
  } catch (err) {
    failed += 1;
    console.error(`  ${id.padEnd(8)} FAILED — ${err.message.split('\n')[0]}`);
  }
}

/*
 * ── Frame the crop here, not in the camera ────────────────────────────────
 * Aiming the 3D camera per character kept missing: the rigs differ in where
 * they sit, Box3 reports the bind pose, and even measuring posed bones left
 * Lola at 87x173 inside a 256 square — small, and off to one side.
 *
 * Trimming the transparent margin sidesteps all of it: whatever the render did,
 * the content box is exact. The crop is a square the width of the figure,
 * started HEAD_DROP of the way down — not at the very top, which framed the
 * crown of Lola's hair rather than her face. Deterministic, and identical for
 * every character no matter how its export was authored.
 */
async function frame(file) {
  const sharp = (await import('sharp')).default;
  const src = await sharp(file).trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
  const { width, height } = src.info;
  /* A square the width of the figure CANNOT hold these heads — the cast is
   * stylised with heads taller than the body is wide, so every square crop cut
   * through the face. Take the top HEAD_FRACTION of the figure at full width
   * and letterbox it into the square instead: the whole head fits, just smaller. */
  const HEAD_FRACTION = 0.62;
  const cropH = Math.max(1, Math.min(height, Math.round(height * HEAD_FRACTION)));
  const head = await sharp(src.data)
    .extract({ left: 0, top: 0, width, height: cropH })
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await sharp(head).toFile(file);
}

for (const id of IDS) {
  const f = join(OUT_DIR, `${id}.png`);
  if (existsSync(f)) {
    // eslint-disable-next-line no-await-in-loop
    await frame(f);
  }
}

const total = readdirSync(OUT_DIR)
  .filter((f) => f.endsWith('.png'))
  .reduce((n, f) => n + statSync(join(OUT_DIR, f)).size, 0);
console.log(`\nbake-cast-portraits: ${IDS.length - failed}/${IDS.length} baked, ${Math.round(total / 1024)} KB total`);
if (failed) {
  console.error('Is `npm run dev` running? The page imports from /src.');
  process.exit(1);
}
