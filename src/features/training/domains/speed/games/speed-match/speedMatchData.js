/* =============================================================================
 * SPEED MATCH — Symbol-Digit substitution (processing speed)
 *
 * This is a gamified SYMBOL-DIGIT matching task inspired by the SDMT paradigm,
 * not a standardized or clinically normed SDMT administration. A symbol is shown
 * and the player responds with the matching digit. The key (legend) stays visible
 * and fixed for the whole block, so the intended construct is speeded perceptual
 * matching rather than relearning a changing key.
 *
 * Primary metric: correct matches per minute (an SDMT-like task metric). We also track
 * accuracy, mean response time, RT variability (ICV) and efficiency (IES).
 * ========================================================================== */

/* ⚠ EXPLICIT .js ON ALL THREE. Vite resolves extensionless paths, plain Node
   does not — and `audit:curves` imports this module directly. Dropping an
   extension here does not break the app, it breaks the GATE, which is the kind
   of failure that only shows up in CI. Caught exactly this way on 2026-08-28
   when speed-match was first registered. */
import { SH } from '../../../../shared/focusQuestData.js';
import { mulberry32, shuffle } from '../../../../../../lib/rng.js';
import { clamp, lerp } from '../../../../../../lib/math.js';
import { BAND_SIZE, ladderFraction, mechanicsAt } from '../../../../shared/difficulty.js';

export { SH, mulberry32 };

/*
 * ⚠ THESE TWO SURVIVE ONLY TO READ OLD SAVES (2026-08-28, the ladder).
 * `migrateLadderReached` parses per-tier keys like `hard-40` out of a profile
 * written before the migration. Nothing else uses them, and the labels/
 * descriptions that stood beside them (`SM_DM`, `SM_PROGRESS_ORDER`) are gone
 * with the difficulty screen they fed.
 */
export const SM_DIFF_KEYS = ['easy', 'medium', 'hard'];
export const SM_LEVELS_PER_TIER = 100;

export const SM_FREE_LIVES = 3;

/** Curated distinct glyphs (rendered via the shared SH SVG set). */
export const SM_SYMBOLS = [
  'circle', 'square', 'triangle', 'diamond', 'star',
  'cross', 'hexagon', 'heart', 'pentagon', 'lightning',
];

/* Pass n Play depths on the ladder — three points on one climb, replacing the
   three tier choices. Same idea as ModeShell's start/mid/deep. */
export const SM_PP_DEPTHS = { start: 15, mid: 33, deep: 51 };
const PASS_PLAY_DURATION = 45;

const LEVEL_DURATION = 60;

/* --- Adaptive TIME BANK (training modes) ---------------------------------
 * Instead of an arbitrary per-item countdown, training uses ONE self-calibrating
 * clock. It always drains; a correct match adds time, a wrong one subtracts it;
 * and the time a correct match returns SHRINKS as the key grows — so the player
 * must keep getting faster, and the clock settles at the fastest pace they can
 * sustain (~their threshold). This is the evidence-based adaptive-difficulty
 * approach behind UFOV / the ACTIVE trial (adaptive > fixed for speed training).
 */
export const TIME_BANK = {
  startMs: 12000, // bank at the first symbol
  maxMs: 18000,   // cap so time can't be hoarded
  penaltyMs: 1600, // a wrong match costs this much time (and the combo)
};
/** Time (ms) a correct match returns — large key ⇒ less time ⇒ must go faster. */
export function bankGainMs(legendSize) {
  const t = clamp((legendSize - 4) / 5, 0, 1); // 4→9 symbols
  return Math.round(lerp(1500, 550, t));
}



/*
 * ── THE LADDER ──
 *
 * ONE climb of 60 levels, in six bands of ten. Replaced easy/med/hard on
 * 2026-08-28 — see LADDER-PLAN.md and shared/difficulty.js.
 *
 * `pairCount` — how many symbol→digit pairs the key holds — is the structural
 * lever, and it has exactly six useful values (4..9). This is a coding-speed
 * task in the WAIS Digit Symbol family, so each extra pair is a real step in
 * how much of the key you must hold rather than look up.
 *
 * Span unchanged at both ends: L1 is the old easy L1 (4 pairs, 2600ms an item)
 * and L60 the old hard L100 (9 pairs, 1050ms, 85% accuracy floor).
 */
export const LADDER = [
  /* L1–10  */ { pairCount: 4, minAcc: 0.80, adds: ['match'] },
  /* L11–20 */ { pairCount: 5, minAcc: 0.80, adds: ['fivePairs'] },
  /* L21–30 */ { pairCount: 6, minAcc: 0.82, adds: ['sixPairs'] },
  /* L31–40 */ { pairCount: 7, minAcc: 0.82, adds: ['sevenPairs'] },
  /* L41–50 */ { pairCount: 8, minAcc: 0.85, adds: ['eightPairs'] },
  /* L51–60 */ { pairCount: 9, minAcc: 0.85, adds: ['ninePairs'] },
];

export const LADDER_LEVELS = LADDER.length * BAND_SIZE; // 60

export const MECHANIC_LABELS = {
  match: { en: 'Match symbol to digit', ar: 'طابق الرمز بالرقم' },
  fivePairs: { en: 'Five in the key', ar: 'خمسة في المفتاح' },
  sixPairs: { en: 'Six in the key', ar: 'ستة في المفتاح' },
  sevenPairs: { en: 'Seven in the key', ar: 'سبعة في المفتاح' },
  eightPairs: { en: 'Eight in the key', ar: 'ثمانية في المفتاح' },
  ninePairs: { en: 'Nine in the key', ar: 'تسعة في المفتاح' },
};

/** ⚠ SIGNATURE CHANGED with the ladder: one argument, no tier. */
export function specForLevel(levelIndex) {
  const lv = clamp(Math.floor(Number(levelIndex)) || 1, 1, LADDER_LEVELS);
  const b = LADDER[Math.min(LADDER.length - 1, Math.floor((lv - 1) / BAND_SIZE))];
  // Front-loaded curve (^0.85): the climb is felt earlier so levels feel more
  // distinct where players actually are.
  const t = ladderFraction(lv, LADDER_LEVELS);
  return {
    lv,
    pairCount: b.pairCount,
    durationSec: LEVEL_DURATION,
    targetCorrect: Math.round(lerp(12, 38, t)),
    minAcc: b.minAcc,
    remapEvery: 0,
    itemMs: Math.round(lerp(2600, 1050, t)),
    mechanics: mechanicsAt(LADDER, lv),
  };
}

/** A legend: pairCount distinct symbols mapped to digits 1..pairCount. */
export function buildLegend(pairCount, rnd = Math.random) {
  const n = clamp(pairCount, 2, SM_SYMBOLS.length);
  const picked = shuffle(SM_SYMBOLS, rnd).slice(0, n);
  return picked.map((symbol, i) => ({ digit: i + 1, symbol }));
}

/**
 * Extend an existing legend to `pairCount` symbols, KEEPING every mapping the
 * player has already learned and appending the new symbols after them.
 *
 * ── Why this exists ──
 * Survival grows the key as you progress, and it used to do that by calling
 * buildLegend() again. That does not add a symbol — it reshuffles the whole
 * pool and reassigns every digit from scratch, so a player who had learned
 * star=1, circle=2, triangle=3, square=4 was silently handed a completely
 * different key. Everything they had memorised became wrong, and since this is
 * a speeded task answered from memory, they pressed what they knew and the game
 * scored it WRONG. It fired every 8 correct answers, and because a wrong answer
 * also drains the time bank, a remap could end an otherwise clean run.
 *
 * That it was unintended is not a guess: `remapEvery` is 0 on every difficulty
 * and in every mode, i.e. the design says never remap. Only the growth path did,
 * and only because it reused the constructor.
 *
 * Growth stays a real difficulty increase — more symbols to scan — without ever
 * invalidating learning, which is the point of a symbol-digit substitution task.
 */
export function growLegend(legend, pairCount, rnd = Math.random) {
  const n = clamp(pairCount, 2, SM_SYMBOLS.length);
  const current = Array.isArray(legend) ? legend : [];
  if (current.length >= n) return current;
  const used = new Set(current.map((e) => e.symbol));
  const fresh = shuffle(SM_SYMBOLS.filter((s) => !used.has(s)), rnd);
  const added = fresh.slice(0, n - current.length).map((symbol, i) => ({
    // Digits continue from where the existing key stops, so no existing symbol
    // ever changes number.
    digit: current.length + i + 1,
    symbol,
  }));
  return [...current, ...added];
}

/** Pick the next prompt symbol; avoids repeating the immediately previous one. */
export function pickItem(legend, rnd = Math.random, lastDigit = 0) {
  if (legend.length === 0) return null;
  let entry = legend[Math.floor(rnd() * legend.length)];
  if (legend.length > 1 && entry.digit === lastDigit) {
    entry = legend[Math.floor(rnd() * legend.length)];
  }
  return entry;
}

/* --- Free-mode ramp (continuous, lives-based) ----------------------------- */
/** Legend grows as the run progresses: 4 → 9 symbols. */
export function freeLegendSize(correctCount) {
  return clamp(4 + Math.floor(correctCount / 8), 4, SM_SYMBOLS.length);
}
/** Per-item time budget shrinks with progress (ms). */
export function freeItemMs(correctCount) {
  return Math.max(850, Math.round(2600 - correctCount * 32));
}
/** Points for a correct match, scaled by combo. */
export function freeItemPoints(combo) {
  return Math.round(10 * (1 + Math.min(combo, 12) * 0.1));
}

/* --- Scoring & grading ---------------------------------------------------- */

/** Mean / SD helpers (sample SD). */
function mean(xs) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}
function sd(xs, m) {
  if (xs.length < 2 || m == null) return null;
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
}

/**
 * Reaction-time outlier trimming (Whelan, 2008): drop physiologically
 * implausible responses with absolute bounds, then iteratively remove values
 * beyond mean ± 2.5 SD until stable. Trimming is standard in RT research because
 * a few stray-long responses otherwise dominate the mean and SD.
 */
function trimRts(raw) {
  let xs = raw.filter((r) => r != null && r >= 120 && r <= 8000);
  for (let pass = 0; pass < 3 && xs.length > 3; pass++) {
    const m = mean(xs);
    const s = sd(xs, m);
    if (s == null || s === 0) break;
    const lo = m - 2.5 * s;
    const hi = m + 2.5 * s;
    const next = xs.filter((x) => x >= lo && x <= hi);
    if (next.length === xs.length) break;
    xs = next;
  }
  return xs;
}

export function summarize(events, durationSec) {
  let correct = 0;
  let wrong = 0;
  const rawRts = [];
  for (const e of events) {
    if (e.correct) {
      correct++;
      if (e.rtMs != null) rawRts.push(e.rtMs);
    } else {
      wrong++;
    }
  }
  const total = correct + wrong;
  const accuracy = total ? correct / total : 1;
  const dur = Math.max(1, durationSec || 1);
  const itemsPerMin = +(correct / (dur / 60)).toFixed(1);

  const rts = trimRts(rawRts);
  const m = mean(rts);
  const meanRt = m != null ? Math.round(m) : null;
  const s = sd(rts, m);
  const rtSd = s != null ? Math.round(s) : null;
  // Intra-individual RT variability as a coefficient of variation (SD / mean).
  // Elevated ICV is a robust marker of attentional lapses (Castellanos, 2005),
  // and is fairer than raw SD because it is independent of overall speed.
  const icv = m && s != null ? +(s / m).toFixed(2) : null;
  // Inverse Efficiency Score (Townsend & Ashby, 1983): mean correct RT divided
  // by proportion correct — a single speed+accuracy number (lower = better) that
  // guards against speed/accuracy trade-offs gaming either metric alone.
  const ies = meanRt != null && accuracy > 0 ? Math.round(meanRt / accuracy) : null;

  return {
    correct,
    wrong,
    total,
    accuracy,
    accuracyPct: Math.round(accuracy * 100),
    itemsPerMin,
    meanRt,
    rtSd,
    icv,
    ies,
  };
}

/** Speed Score 0–100: items/min normalised against a tier ceiling, gated by accuracy. */
export function computeSpeedScore(summary, diff) {
  const ceiling = { easy: 38, medium: 46, hard: 54 }[diff] ?? 40;
  const speed = clamp(summary.itemsPerMin / ceiling, 0, 1);
  const acc = clamp(summary.accuracy, 0, 1);
  return Math.round(100 * (0.7 * speed + 0.3 * acc));
}

export function gradeBlock(summary, spec, { freeMode = false } = {}) {
  const score = computeSpeedScore(summary, spec.diff);
  if (freeMode) {
    return { won: true, stars: 0, score };
  }
  const won = summary.correct >= spec.targetCorrect && summary.accuracy >= spec.minAcc;
  let stars = 0;
  if (won) {
    stars = 1;
    if (summary.accuracy >= 0.9) stars = 2;
    if (summary.accuracy >= 0.95 && summary.correct >= spec.targetCorrect * 1.25) stars = 3;
  }
  return { won, stars, score };
}

/*
 * ⚠ LADDER PROGRESS (2026-08-28). Cleared levels are stored flat under `lad-N`.
 *
 * The old per-tier keys (`easy-12`) are NOT deleted — `migrateLadderReached`
 * reads them once to work out how far the player had got, and they stay on disk
 * so this is reversible. Migrations that overwrite are how "it erased my
 * progress" happens, and localStorage has no undo.
 */
export function isLevelUnlocked(lv, doneMap, reached = 0) {
  if (lv <= 1) return true;
  if (lv <= (reached || 0) + 1) return true;
  return !!(doneMap[`lad-${lv - 1}`] || doneMap[`lad-${lv}`]);
}

/**
 * Deepest level reached under the old tiers → a level on the new ladder.
 * Same rule ModeShell uses: map each old tier onto its third of the ladder and
 * take the best. Returns 0 when there is nothing to migrate.
 */
export function migrateLadderReached(doneMap) {
  const per = LADDER_LEVELS / SM_DIFF_KEYS.length;
  let reached = 0;
  SM_DIFF_KEYS.forEach((k, i) => {
    let deepest = 0;
    for (const key of Object.keys(doneMap || {})) {
      const m = key.match(/^(\w+)-(\d+)$/);
      if (m && m[1] === k) deepest = Math.max(deepest, Number(m[2]) || 0);
    }
    if (deepest > 0) {
      reached = Math.max(reached, Math.round(i * per + (deepest / SM_LEVELS_PER_TIER) * per));
    }
  });
  return Math.max(0, Math.min(LADDER_LEVELS, reached));
}

/** Survival stage → a level on the ladder (it used to be a tier + a level). */
export function freeStageToDiffLv(stageIndex) {
  const s = Math.max(0, stageIndex | 0);
  const lv = clamp(s + 1, 1, LADDER_LEVELS);
  return { lv };
}

/* --- Block / seed preparation -------------------------------------------- */
export function prepareLevelBlock(lv) {
  const spec = specForLevel(lv);
  const legend = buildLegend(spec.pairCount);
  return { mode: 'level', lv: spec.lv, spec, legend };
}

export function prepareChallengeSeed(depth = 'mid') {
  const lv = SM_PP_DEPTHS[depth] ?? SM_PP_DEPTHS.mid;
  const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  const base = specForLevel(lv);
  const spec = { ...base, durationSec: PASS_PLAY_DURATION };
  return { seed, depth, lv, spec };
}

export function prepareChallengeBlock(cSeed) {
  const spec = cSeed.spec;
  // Deterministic legend so every player faces the same key + symbol stream.
  const legend = buildLegend(spec.pairCount, mulberry32(cSeed.seed));
  return { mode: 'challenge', lv: spec.lv, spec, legend, seed: cSeed.seed };
}
