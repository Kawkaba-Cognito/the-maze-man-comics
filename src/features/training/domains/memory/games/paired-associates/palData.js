/*
 * Pure PAL configuration and trial generation — no React.
 *
 * Split out of index.jsx on 2026-08-15 so `audit:pacing` can import it. The
 * gates run in plain Node, which cannot parse .jsx at all, so any constant a
 * gate must check has to live in a .js module. keep-track/data.js already had
 * this shape; this brings Pair Match into line with it.
 *
 * index.jsx re-exports everything here, so existing importers (including the
 * 3D proto and Group War) are unaffected.
 */
export const SYMBOLS = ['★', '▲', '●', '■', '◆', '✚', '✦', '❤', '☀', '☾', '♣', '♠'];
export const STUDY_GAP = 240;
const ROUNDS_PER_LEVEL = 3;
const LEVEL_WIN = 2; // perfect trials needed

/*
 * `study` is ms each symbol→box pairing is shown, and it is NOT the difficulty
 * lever.
 *
 * Reported 2026-08-15 as "the game starts very fast, not having time to track
 * the symbols". It was 1100/950/820 falling to a 520ms floor. Binding a symbol
 * to a location is paired-associate ENCODING, which the literature runs at
 * 2–5 s per pair; at 520ms the player cannot finish looking at the symbol, let
 * alone associate it with where it sat.
 *
 * Difficulty comes from LOAD — boxes and pairs, both of which still ramp
 * (4→8 boxes, 2→6 pairs). `audit:pacing` gates the floor.
 */
export const PAL_MIN_STUDY = 900;

export const BASE = {
  easy: { boxes: 4, pairs: 2, study: 1800 },
  med: { boxes: 6, pairs: 3, study: 1500 },
  hard: { boxes: 8, pairs: 4, study: 1250 },
};
export function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  const f = ((level || 1) - 1) / 99;
  const boxes = Math.min(b.boxes + Math.round(f * 4), 12);
  return {
    boxes,
    pairs: Math.min(b.pairs + Math.round(f * 4), boxes),
    study: Math.max(PAL_MIN_STUDY, Math.round(b.study - f * 500)),
  };
}

/** Free/Survival config — 6 boxes, pairs grow adaptively, study time shrinks. */
export function palFreeCfg(pairs) {
  return {
    boxes: 6,
    pairs: Math.min(pairs, 6),
    study: Math.max(PAL_MIN_STUDY, 1700 - pairs * 40),
  };
}

/**
 * Pure PAL trial generator (same draw order as the 2D engine's newTrial): choose
 * K symbols, K box slots, build the study reveal order + shuffled recall cues.
 */
export function buildPalTrial(cfg, rng) {
  const { boxes: N, pairs: K } = cfg;
  const syms = [...SYMBOLS].sort(() => rng() - 0.5).slice(0, K);
  const boxIdxs = [...Array(N).keys()].sort(() => rng() - 0.5).slice(0, K);
  const boxes = Array.from({ length: N }, () => ({ symbol: null }));
  boxIdxs.forEach((bi, j) => {
    boxes[bi].symbol = syms[j];
  });
  const cueOrder = boxIdxs
    .map((bi) => ({ boxIdx: bi, symbol: boxes[bi].symbol }))
    .sort(() => rng() - 0.5);
  const studyOrder = [...boxIdxs].sort(() => rng() - 0.5);
  return { boxes, boxIdxs, cueOrder, studyOrder, total: K };
}

