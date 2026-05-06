import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcHtml =
  process.env.FOCUS_QUEST_HTML ||
  path.join('C:', 'Users', 'user', 'OneDrive', 'FocusQuest_core.html');

const t = fs.readFileSync(srcHtml, 'utf8');
const i0 = t.indexOf('const SH=');
let i1 = t.indexOf('// ══════════════════════════════════════════\n// PERCENTILE');
if (i1 < 0) {
  i1 = t.indexOf('// ══════════════════════════════════════════\r\n// PERCENTILE');
}
if (i0 < 0 || i1 < 0) throw new Error(`markers not found in ${srcHtml}`);

let slab = t.slice(i0, i1);
slab = slab.replace(/const ([A-Z]{2,})=/g, 'export const $1=');
slab = slab.replace(
  /function (sigmoidTime|getLvCfg)/g,
  'export function $1',
);

const head = `// Auto-extracted from FocusQuest — shapes, pools, level config, scoring\n`;

const shapeNamesBlock = `export const SHAPE_NAMES = {
  circle: 'Circle', square: 'Square', triangle: 'Triangle', diamond: 'Diamond',
  pentagon: 'Pentagon', hexagon: 'Hexagon', star: 'Star', cross: 'Cross',
  heart: 'Heart', lightning: 'Lightning Bolt', roundsq: 'Rounded Square',
  ovalH: 'Horizontal Oval', ovalV: 'Vertical Oval', triR: 'Right Triangle',
  triFlat: 'Flat Triangle', hexTall: 'Tall Hexagon', arrowR: 'Right Arrow',
  arrowL: 'Left Arrow', moon: 'Moon', semicircle: 'Semicircle', rhombus: 'Rhombus',
  parallelR: 'Parallelogram', trapezoid: 'Trapezoid', shield: 'Shield',
  ovalSq: 'Oval Rectangle', fatOval: 'Wide Oval', thinOval: 'Thin Oval',
  almostCircle: 'Near-Circle', wideRect: 'Wide Rectangle', tallRect: 'Tall Rectangle',
  bigSemi: 'Large Semicircle', tinyMoon: 'Crescent Moon', fatDiamond: 'Fat Diamond',
};

`;

const tail = `
export function buildCellsFromParams(grid, pool, tc, diff, seed, interference) {
  const searchMode = (diff === 'xhard' || diff === 'deadly') ? 'identity' : 'categorical';
  const pal = PAL[diff] || PAL.easy;
  const tgt = seed?.tgt ?? pool[Math.floor(Math.random() * pool.length)];
  const tgtCol = seed?.tgtCol ?? pal[Math.floor(Math.random() * pal.length)];
  const dist = pool.filter((s) => s !== tgt);
  const total = grid * grid;
  let cells = [];
  const guaranteedTc = Math.max(tc, 3);
  const useFeatureBinding = diff === 'hard' || diff === 'xhard' || diff === 'deadly';
  if (searchMode === 'identity') {
    for (let k = 0; k < guaranteedTc; k++) cells.push({ shape: tgt, col: tgtCol, isT: true });
    while (cells.length < total) {
      const r = Math.random();
      if (useFeatureBinding && r < 0.5) {
        if (r < 0.25) {
          const othCols = pal.filter((c) => c !== tgtCol);
          const dcol = othCols[Math.floor(Math.random() * othCols.length)] || pal[0];
          cells.push({ shape: tgt, col: dcol, isT: false });
        } else {
          const dshp = dist[Math.floor(Math.random() * dist.length)];
          cells.push({ shape: dshp, col: tgtCol, isT: false });
        }
      } else {
        const dshp = dist[Math.floor(Math.random() * dist.length)];
        const dcol = pal[Math.floor(Math.random() * pal.length)];
        cells.push({ shape: dshp, col: dcol, isT: false });
      }
    }
  } else {
    for (let k = 0; k < guaranteedTc; k++) cells.push({ shape: tgt, col: null, isT: true });
    while (cells.length < total) {
      const dshp = dist[Math.floor(Math.random() * dist.length)];
      const dcol = useFeatureBinding && Math.random() < 0.5 ? tgtCol : pal[Math.floor(Math.random() * pal.length)];
      cells.push({ shape: dshp, col: dcol, isT: false });
    }
  }
  cells.sort(() => Math.random() - 0.5);
  return { cells, tgt, tgtCol, tc: guaranteedTc };
}

export function assignFillColors(cells, diff, interference, tgtCol) {
  const pal = PAL[diff] || PAL.easy;
  const tgtColIdx = pal.indexOf(tgtCol) >= 0 ? pal.indexOf(tgtCol) : 0;
  return cells.map((cell) => {
    let fill;
    if (cell.col) {
      fill = cell.col;
    } else if (cell.isT) {
      fill = tgtCol;
    } else if (interference > 0) {
      if (Math.random() < interference * 0.7) {
        const adj = (tgtColIdx + Math.floor(Math.random() * 2) + 1) % pal.length;
        fill = pal[adj];
      } else fill = pal[Math.floor(Math.random() * pal.length)];
    } else {
      fill = pal[Math.floor(Math.random() * pal.length)];
    }
    return { ...cell, fill };
  });
}

export function prepareLevelRound(diff, lv) {
  const cfg = getLvCfg(diff, lv - 1);
  const pal = PAL[diff] || PAL.easy;
  const lockedTarget = cfg.pool[Math.floor(Math.random() * cfg.pool.length)];
  const lockedCol = pal[Math.floor(Math.random() * pal.length)];
  const searchMode = diff === 'xhard' || diff === 'deadly' ? 'identity' : 'categorical';
  const built = buildCellsFromParams(cfg.grid, cfg.pool, cfg.tc, diff, { tgt: lockedTarget, tgtCol: lockedCol }, cfg.interference);
  const withFill = assignFillColors(built.cells, diff, cfg.interference, built.tgtCol);
  const cells = withFill.map((c, i) => ({ ...c, id: i, tapped: false, feedback: null }));
  return {
    mode: 'level',
    diff,
    lv,
    grid: cfg.grid,
    pool: cfg.pool,
    tc: built.tc,
    tlim: cfg.time,
    target: built.tgt,
    targetCol: built.tgtCol,
    searchMode,
    interference: cfg.interference,
    cells,
  };
}

export function prepareChallengeSeed() {
  const pool = SP.xhard[8];
  const pal = PAL.xhard;
  const tgt = pool[Math.floor(Math.random() * pool.length)];
  const tgtCol = pal[Math.floor(Math.random() * pal.length)];
  const dist = pool.filter((s) => s !== tgt);
  const grid = 9;
  const tc = 15;
  const total = grid * grid;
  let cells = [];
  for (let i = 0; i < tc; i++) cells.push({ shape: tgt, isT: true });
  while (cells.length < total) cells.push({ shape: dist[Math.floor(Math.random() * dist.length)], isT: false });
  let s = Date.now();
  function rnd() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  }
  const a = [...cells];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return { pool, tgt, tgtCol, cells: a, grid, tc };
}

export function prepareChallengePlayState(cSeed, tlim = 50) {
  const diff = 'xhard';
  const cellsRaw = cSeed.cells.map((c) => ({ shape: c.shape, isT: c.isT }));
  const withFill = assignFillColors(cellsRaw, diff, 0, cSeed.tgtCol);
  const cells = withFill.map((c, i) => ({ ...c, id: i, tapped: false, feedback: null }));
  return {
    mode: 'challenge',
    diff: 'xhard',
    lv: 'CH',
    grid: cSeed.grid,
    pool: cSeed.pool,
    tc: cSeed.tc,
    tlim,
    target: cSeed.tgt,
    targetCol: cSeed.tgtCol,
    searchMode: 'identity',
    interference: 0,
    cells,
  };
}

export function computeRoundStats({ tlim, tl, found, errors, tc, taps, diff, won }) {
  const timeUsed = +(tlim - tl).toFixed(1);
  const total = found + errors;
  const acc = total > 0 ? Math.round((found / total) * 100) : 100;
  const accRaw = total > 0 ? found / total : 1;
  const avgRt = taps.length ? Math.round(taps.reduce((s, x) => s + x, 0) / taps.length) : 999;
  const tps = timeUsed > 0 ? +(found / timeUsed).toFixed(3) : 0;
  const meanRtSec = found > 0 ? timeUsed / found : timeUsed + 1;
  let ies = +(1000 * (accRaw / meanRtSec)).toFixed(1);
  if (total > tc * 2.5) ies = +(ies * 0.5).toFixed(1);
  const score = Math.max(0, ies);
  return { timeUsed, acc, avgRt, tps, ies, score, accRaw, won };
}

export function isLevelUnlocked(diff, lv, doneMap) {
  if (lv === 1) return true;
  const key = (d, L) => d + '-' + L;
  return !!(doneMap[key(diff, lv - 1)] || doneMap[key(diff, lv)]);
}

export function settingsKey() {
  return 'mm_fq_settings_v1';
}

export function loadGameSettings() {
  try {
    const d = JSON.parse(localStorage.getItem(settingsKey()) || '{}');
    return { countdown: d.countdown !== false, sound: d.sound !== false };
  } catch {
    return { countdown: true, sound: true };
  }
}
`;

const out = path.join(root, 'src', 'components', 'training', 'focusQuestData.js');
fs.writeFileSync(out, `${head}${slab}\n${shapeNamesBlock}${tail}`);
console.log('Wrote', out);
