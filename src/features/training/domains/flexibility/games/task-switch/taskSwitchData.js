/*
 * Pure Task Switch configuration and trial generation — no React.
 *
 * Split out of index.jsx on 2026-08-15 so `audit:pacing` can import the timing
 * floors. The gates run in plain Node, which cannot parse .jsx, so anything a
 * gate must assert has to live in a .js module (keep-track/data.js already had
 * this shape). index.jsx re-exports it all, so nothing downstream changes.
 */
import {
  BAND_SIZE, ladderFraction, mechanicsAt,
} from '../../../../shared/difficulty.js';

export const TS_PP_TRIALS = 24;
export const TS_LEVEL_TRIALS = 24;
export const TS_WIN_ACC = 0.75;

/**
 * Difficulty is the preparation interval and how often the rule changes.
 *
 * The cue–stimulus interval is the honest lever: given ~1200 ms you can
 * reconfigure before the stimulus lands and the switch cost nearly vanishes;
 * at 150 ms you cannot, and you pay it on every switch. Switch PROPORTION is
 * the second lever — a run of repeats lets a set settle, so more switching is
 * more work even at the same interval.
 */
/*
 * FLOORS, and why the interval is not the difficulty lever.
 *
 * Reported 2026-08-15 as "it is so fast". The cue-stimulus interval fell to
 * 150ms at hard L100 (base 550 minus a 400 ramp) and the response deadline to
 * 1700ms. CSI is the time you get to READ THE CUE AND RECONFIGURE before the
 * stimulus lands; Rogers & Monsell manipulate it up to ~1200ms precisely
 * because that preparation is the thing being measured. At 150ms there is no
 * preparation to measure — the trial becomes a reaction-speed wall, and the
 * switch cost it is supposed to isolate disappears into general slowing.
 *
 * `pSwitch` is the honest lever and it still ramps (0.3 → 0.65): more switches
 * means more reconfiguration at the same comfortable interval. `audit:pacing`
 * gates both floors.
 */
export const TS_MIN_CSI = 450;
export const TS_MIN_DEADLINE = 2100;

/*
 * ── THE LADDER ──
 *
 * ONE climb of 50 levels, in five bands of ten. Replaced easy/med/hard on
 * 2026-08-28 — see LADDER-PLAN.md and shared/difficulty.js.
 *
 * ⚠ THIS IS THE THINNEST LADDER IN THE APP, and the honest reason is that Task
 * Switch has exactly ONE nameable mechanic — read the cue, apply that rule —
 * plus three continuous knobs. It has no barrels, no canopy, no fourth category
 * to hold. So rather than invent mechanics it does not have, the bands quantise
 * `pSwitch`, which is the construct's own primary lever: a run of repeats lets
 * a task set settle, so each band is a genuinely different switching regime
 * rather than the same one slightly faster.
 *
 * That makes it the FIRST game to revisit when the deferred feature work
 * starts — an extra rule to switch between, a third cue dimension, an
 * occasional no-go. Until then five bands is what it honestly supports.
 *
 * Span unchanged at both ends: L1 is the old easy L1 (1200ms CSI, 30% switches)
 * and L50 the old hard L100 (both perception floors, 65% switches).
 */
export const LADDER = [
  /* L1–10  */ { pSwitch: 0.30, adds: ['switch'] },
  /* L11–20 */ { pSwitch: 0.40, adds: [] },
  /* L21–30 */ { pSwitch: 0.50, adds: [] },
  /* L31–40 */ { pSwitch: 0.58, adds: [] },
  /* L41–50 */ { pSwitch: 0.65, adds: [] },
];

export const LADDER_LEVELS = LADDER.length * BAND_SIZE; // 50

export const MECHANIC_LABELS = {
  switch: { en: 'Follow the cue, not the habit', ar: 'اتبع الإشارة لا العادة' },
};

/** ⚠ SIGNATURE CHANGED with the ladder: no `diff` argument. */
export function tsCfg(mode, level, ramp) {
  if (mode === 'free') {
    const r = ramp ?? 0;
    return {
      csi: Math.max(TS_MIN_CSI, Math.round(1200 - r * 700)),
      pSwitch: 0.3 + r * 0.35,
      deadline: Math.max(TS_MIN_DEADLINE, Math.round(3200 - r * 900)),
    };
  }
  const lv = Math.min(LADDER_LEVELS, Math.max(1, Math.round(Number(level) || 1)));
  if (mode === 'passplay' && !level) return { csi: 700, pSwitch: 0.5, deadline: 2800, lv: 25 };
  const band = LADDER[Math.min(LADDER.length - 1, Math.floor((lv - 1) / BAND_SIZE))];
  const f = ladderFraction(lv, LADDER_LEVELS);
  return {
    csi: Math.max(TS_MIN_CSI, Math.round(1200 - f * 750)),
    pSwitch: band.pSwitch,
    deadline: Math.max(TS_MIN_DEADLINE, Math.round(3400 - f * 1300)),
    mechanics: mechanicsAt(LADDER, lv),
    lv,
    f,
  };
}

/** One trial. `prevTask` null on the first, which is neither switch nor repeat. */
export function makeTrial(rng, prevTask, pSwitch) {
  const task = prevTask === null
    ? (rng() < 0.5 ? 'colour' : 'shape')
    : (rng() < pSwitch ? (prevTask === 'colour' ? 'shape' : 'colour') : prevTask);
  const colour = rng() < 0.5 ? 'red' : 'blue';
  const shape = rng() < 0.5 ? 'circle' : 'square';
  return {
    task,
    colour,
    shape,
    isSwitch: prevTask !== null && task !== prevTask,
    // Same key under either rule ⇒ congruent.
    congruent: (colour === 'red') === (shape === 'circle'),
    answer: task === 'colour'
      ? (colour === 'red' ? 'left' : 'right')
      : (shape === 'circle' ? 'left' : 'right'),
  };
}

export const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

