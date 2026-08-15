/*
 * Pure Task Switch configuration and trial generation — no React.
 *
 * Split out of index.jsx on 2026-08-15 so `audit:pacing` can import the timing
 * floors. The gates run in plain Node, which cannot parse .jsx, so anything a
 * gate must assert has to live in a .js module (keep-track/data.js already had
 * this shape). index.jsx re-exports it all, so nothing downstream changes.
 */
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

export function tsCfg(mode, diff, level, ramp) {
  if (mode === 'free') {
    const r = ramp ?? 0;
    return {
      csi: Math.max(TS_MIN_CSI, Math.round(1200 - r * 700)),
      pSwitch: 0.3 + r * 0.35,
      deadline: Math.max(TS_MIN_DEADLINE, Math.round(3200 - r * 900)),
    };
  }
  if (mode === 'passplay') return { csi: 700, pSwitch: 0.5, deadline: 2800 };
  const f = ((level || 1) - 1) / 99;
  const base = diff === 'easy' ? { csi: 1200, p: 0.3, dl: 3400 }
    : diff === 'hard' ? { csi: 800, p: 0.5, dl: 2800 }
      : { csi: 1000, p: 0.4, dl: 3100 };
  return {
    csi: Math.max(TS_MIN_CSI, Math.round(base.csi - f * (diff === 'hard' ? 350 : 450))),
    pSwitch: Math.min(0.65, base.p + f * 0.2),
    deadline: Math.max(TS_MIN_DEADLINE, Math.round(base.dl - f * 700)),
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

