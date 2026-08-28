/*
 * Car Park (folder still `train-switch` — it was re-themed from trains and the
 * folder kept its name; see the "Names that lie" table in CLAUDE.md).
 *
 * The level curve, as a .js data module. Extracted from index.jsx on 2026-08-28
 * with the ladder migration: `audit:curves` printed this game for weeks under
 * "CANNOT be gated where it sits, because the config lives in a React file".
 * The gates run in plain Node, which cannot parse JSX at all, so a curve in a
 * component is a curve nothing checks.
 *
 * ⚠ IMPORT WITH AN EXPLICIT .js EXTENSION (Node vs Vite resolution — see the
 * note at the top of shared/difficulty.js).
 *
 * ── THE LADDER ──
 * ONE climb of 50 levels, in five bands of ten. Replaced easy/med/hard on
 * 2026-08-28 — see LADDER-PLAN.md.
 *
 * `maxC` — how many cars are in play AT ONCE — is the structural lever, and it
 * is the one with a literature behind it: divided attention has a ~4-object
 * capacity limit (Pylyshyn & Storm 1988). The old tiers used it as the tier
 * marker (easy stayed below the limit at 1–3, medium rode it at 2–4, hard
 * pushed past into overload at 3–5), which meant a player on Easy never once
 * met the thing the game is about. It now steps once per band, 1 → 5, so the
 * capacity limit is crossed at band 4 and overload is reached at band 5 — by
 * playing, not by picking a word.
 *
 * Colours (discrimination + spatial memory of the bays) and lives step with it.
 * Grid size, forks, car speed, spawn rate and the clear target ramp continuously
 * underneath, so a band is never merely "the same board, slightly faster".
 *
 * Span unchanged at both ends: L1 is the old easy L1 and L50 the old hard L100.
 */
import { BAND_SIZE, ladderFraction, mechanicsAt } from '../../../../shared/difficulty.js';

const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerpN = (a, b, f) => a + (b - a) * f;

export const LADDER = [
  /* L1–10  */ { maxC: 1, colors: 3, lives: 5, adds: ['route'] },
  /* L11–20 */ { maxC: 2, colors: 4, lives: 5, adds: ['twoAtOnce'] },
  /* L21–30 */ { maxC: 3, colors: 4, lives: 4, adds: ['threeAtOnce'] },
  /* L31–40 */ { maxC: 4, colors: 5, lives: 4, adds: ['fourAtOnce'] },
  /* L41–50 */ { maxC: 5, colors: 6, lives: 3, adds: ['overload'] },
];

export const LADDER_LEVELS = LADDER.length * BAND_SIZE; // 50

/* ⚠ Player-visible wording follows the CURRENT theme, which is a SPACEPORT —
   index.jsx titles this game "Spaceship" and its hints say "Dock ships". The
   folder is `train-switch` and this file is `carParkData` because it was trains,
   then cars, then ships, and the names never caught up. Match the UI, not the
   filename. (CLAUDE.md's "Names that lie" table still says Car Park.) */
export const MECHANIC_LABELS = {
  route: { en: 'Dock the ship at its bay', ar: 'أرسِ السفينة في مرساها' },
  twoAtOnce: { en: 'Two ships at once', ar: 'سفينتان معاً' },
  threeAtOnce: { en: 'Three at once', ar: 'ثلاث معاً' },
  fourAtOnce: { en: 'Four — the capacity limit', ar: 'أربع — حدّ السعة' },
  overload: { en: 'Five — past the limit', ar: 'خمس — تجاوز الحدّ' },
};

/** Continuous levers, at the two ends of the ladder. */
const SPAN = {
  grid: [5, 9],
  forks: [2, 8],
  cps: [0.65, 1.40],
  spawn: [2200, 950],
  target: [6, 24],
};

/** ⚠ SIGNATURE CHANGED with the ladder: one argument, no tier. */
export function levelCfg(level) {
  const lv = clampN(Math.round(Number(level) || 1), 1, LADDER_LEVELS);
  const b = LADDER[Math.min(LADDER.length - 1, Math.floor((lv - 1) / BAND_SIZE))];
  // Front-loaded curve (^0.85): the climb is felt earlier so adjacent levels
  // feel more distinct.
  const f = ladderFraction(lv, LADDER_LEVELS);
  const grid = Math.round(lerpN(SPAN.grid[0], SPAN.grid[1], f));
  return {
    R: grid,
    C: grid,
    forks: Math.round(lerpN(SPAN.forks[0], SPAN.forks[1], f)),
    colors: b.colors,
    maxC: b.maxC,
    cps: +lerpN(SPAN.cps[0], SPAN.cps[1], f).toFixed(2),
    spawn: Math.round(lerpN(SPAN.spawn[0], SPAN.spawn[1], f)),
    target: Math.round(lerpN(SPAN.target[0], SPAN.target[1], f)),
    lives: b.lives,
    mechanics: mechanicsAt(LADDER, lv),
    lv,
    wave: false,
  };
}

/*
 * Survival WAVES: endless escalation, unchanged by the ladder. Every wave is a
 * FRESH board (no two look alike) and is strictly harder: it always adds a car
 * to clear, and concurrency — the divided-attention lever — steps up every 2
 * waves toward and past the ~4-object capacity limit. Speed and complexity ramp
 * alongside; speed is capped so it stays reactable.
 */
export function waveCfg(wave) {
  const w = wave - 1;
  return {
    R: clampN(5 + Math.floor(w / 3), 5, 9),
    C: clampN(5 + Math.floor(w / 3), 5, 9),
    forks: clampN(2 + Math.floor(w / 2), 2, 8),
    colors: clampN(3 + Math.floor(w / 3), 3, 6),
    cars: 4 + w,                                    // cars to clear (always grows)
    maxC: clampN(1 + Math.floor(w / 2), 1, 5),      // steps every 2 waves, capped at overload
    cps: +Math.min(1.7, 0.7 + w * 0.05).toFixed(2), // capped so it stays reactable
    spawn: Math.max(900, 2100 - w * 100),
    lives: 4,
    wave: true,
  };
}
