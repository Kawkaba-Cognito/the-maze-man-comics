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
import {
  BAND_SIZE, ladderFraction, mechanicsAt,
} from '../../../../shared/difficulty.js';

export const PAIR_OBJECTS = [
  { id: 'pocket-watch', en: 'pocket watch', ar: 'ساعة جيب' },
  { id: 'ornate-key', en: 'ornate key', ar: 'مفتاح مزخرف' },
  { id: 'lantern', en: 'lantern', ar: 'فانوس' },
  { id: 'feather', en: 'feather', ar: 'ريشة' },
  { id: 'hourglass', en: 'hourglass', ar: 'ساعة رملية' },
  { id: 'compass', en: 'compass', ar: 'بوصلة' },
  { id: 'seashell', en: 'seashell', ar: 'صدفة' },
  { id: 'storybook', en: 'storybook', ar: 'كتاب قصص' },
  { id: 'crown', en: 'crown', ar: 'تاج' },
  { id: 'teacup', en: 'teacup', ar: 'فنجان' },
  { id: 'maple-leaf', en: 'maple leaf', ar: 'ورقة قيقب' },
  { id: 'gemstone', en: 'gemstone', ar: 'حجر كريم' },
];

export const SYMBOLS = PAIR_OBJECTS.map((item) => item.id);

export function pairObjectLabel(id, lang = 'en') {
  const item = PAIR_OBJECTS.find((candidate) => candidate.id === id);
  return item?.[lang] || item?.en || id;
}
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

/*
 * ── THE LADDER ──
 *
 * ONE climb of 70 levels, in seven bands of ten. Replaced easy/med/hard on
 * 2026-08-28 — see LADDER-PLAN.md and shared/difficulty.js.
 *
 * The span is unchanged at both ends: L1 is the old easy L1 (4 boxes, 2 pairs,
 * 1800ms) and L70 is the old hard L100 (12 boxes, 8 pairs, 900ms).
 *
 * Seven bands because `pairs` has seven distinct values, and each one is a
 * whole extra symbol→place binding to hold — the thing this game measures. That
 * is a step the player feels, so it earns its ten levels. `boxes` widens the
 * field underneath it, and `study` shrinks continuously across all seventy.
 */
export const LADDER = [
  /* L1–10  */ { boxes: 4, pairs: 2, adds: ['bind'] },
  /* L11–20 */ { boxes: 6, pairs: 3, adds: [] },
  /* L21–30 */ { boxes: 8, pairs: 4, adds: [] },
  /* L31–40 */ { boxes: 10, pairs: 5, adds: [] },
  /* L41–50 */ { boxes: 12, pairs: 6, adds: [] },
  /* L51–60 */ { boxes: 12, pairs: 7, adds: [] },
  /* L61–70 */ { boxes: 12, pairs: 8, adds: [] },
];

export const LADDER_LEVELS = LADDER.length * BAND_SIZE; // 70

export const MECHANIC_LABELS = {
  bind: { en: 'Remember where each symbol sat', ar: 'تذكّر مكان كل رمز' },
};

/** ⚠ SIGNATURE CHANGED with the ladder: one argument, no tier. */
export function levelCfg(level) {
  const lv = Math.min(LADDER_LEVELS, Math.max(1, Math.round(Number(level) || 1)));
  const band = LADDER[Math.min(LADDER.length - 1, Math.floor((lv - 1) / BAND_SIZE))];
  const f = ladderFraction(lv, LADDER_LEVELS);
  return {
    boxes: band.boxes,
    pairs: Math.min(band.pairs, band.boxes),
    study: Math.max(PAL_MIN_STUDY, Math.round(1800 - f * 900)),
    mechanics: mechanicsAt(LADDER, lv),
    lv,
    f,
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
