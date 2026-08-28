/*
 * DIFFICULTY — the one place that turns "level 37 of 100" into a number, and
 * the one place that turns "survival stage 19" into a tier and a level.
 *
 * ── Why this exists ──
 * Fourteen files independently reinvented `(level - 1) / 99`. Seven wrapped it
 * in `Math.pow(f, 0.85)` and seven did not, with no stated rule for which — and
 * `trail-making/index.jsx` does BOTH, twenty-five lines apart (`levelCfg` uses
 * the curve, `boardSpecLevel` does not). That is not a style problem: it means
 * two halves of one game disagree about how fast difficulty should climb, and
 * nobody chose it.
 *
 * ── The rule ──
 * FRONT (0.85) is the default and what a training game should normally use: the
 * climb is felt earlier, so early levels feel distinct instead of interchangeable.
 * LINEAR is legitimate when the underlying lever is already perceptually
 * non-linear (an exponential timer, a log-spaced set size) and the curve would
 * double-count the ramp. Pass it EXPLICITLY and say why at the call site.
 *
 * ⚠ IMPORT THIS WITH AN EXPLICIT .js EXTENSION.
 * Data modules are imported directly by the gate scripts, which run in plain
 * Node — and Node does not do Vite's extensionless resolution. Dropping the
 * extension does not break the app (Vite resolves it) but it breaks every gate
 * that imports that data module, which is exactly the kind of failure that only
 * shows up in CI. Caught immediately here: adding this helper without the
 * extension took validate:keeptrack and validate:mirror down with it.
 *
 * ── Scaling contract ──
 * `levelFraction` returns 0 at level 1 and 1 at the last level, whatever the
 * curve. Games map that fraction onto their own levers, so adding a lever later
 * is a change in the game's data file and never a change here.
 */

/** Named curves. Anything else is a raw exponent and needs a comment. */
export const CURVE = {
  FRONT: 0.85,
  LINEAR: 1,
};

/**
 * Normalised difficulty for a level within its tier.
 *
 * @param {number} level          1-based level number.
 * @param {number} levelsPerTier  how many levels the tier has (usually 100).
 * @param {number} curve          exponent; CURVE.FRONT by default.
 * @returns {number} 0 at the first level, 1 at the last.
 */
export function levelFraction(level, levelsPerTier = 100, curve = CURVE.FRONT) {
  const span = Math.max(1, levelsPerTier - 1);
  const t = Math.min(1, Math.max(0, ((Number(level) || 1) - 1) / span));
  return curve === 1 ? t : Math.pow(t, curve);
}

/**
 * Survival stage → { diff, lv, f }.
 *
 * Survival is one continuous climb across the three tiers: `perTier` stages in
 * each, and within a tier the stage index sweeps level 1 → levelsPerTier so the
 * game can reuse its own level config instead of inventing a second curve.
 *
 * Keep Track and Mirror World had this byte-for-byte identical in two files.
 * Anything else that ramps across tiers should call this rather than copy it.
 */
export function tierStage(stage, {
  tiers = ['easy', 'med', 'hard'],
  perTier = 12,
  levelsPerTier = 100,
  curve = CURVE.FRONT,
} = {}) {
  const s = Math.max(0, Math.floor(Number(stage) || 0));
  const ti = Math.min(tiers.length - 1, Math.floor(s / perTier));
  const within = Math.min(1, Math.max(0, (s - ti * perTier) / perTier));
  const lv = 1 + Math.round(within * (levelsPerTier - 1));
  return { diff: tiers[ti], lv, f: levelFraction(lv, levelsPerTier, curve) };
}

/** Linear interpolation, for mapping a fraction onto a game's own lever. */
export function lerp(a, b, f) {
  return a + (b - a) * f;
}

/* ── THE LADDER ───────────────────────────────────────────────────────────
 *
 * One climb per game, in BANDS of ten levels, replacing the easy/med/hard
 * triple in Levels mode.
 *
 * ── Why ──
 * The three tiers were never three difficulties. Measured across the seven
 * games whose curves are gateable, the lever that decides what the game IS
 * never moved inside a tier — Keep Track was `targets: 2→2` for a hundred
 * levels, Math Gates `opCount: 2→2`, Story Time `len: 4→4`. Only timing and
 * count nudged. So "Easy" was not an easier version of the game, it was a
 * DIFFERENT game hidden behind a menu word, and the seven-of-twenty-three
 * levers where finishing Easy already exceeded starting Hard meant the
 * intended journey stepped backwards as often as forwards.
 *
 * A band is the unit of a new thing. Numeric levers ramp continuously
 * underneath, so a band is never merely "the same, slightly faster".
 *
 * ⚠ A BAND'S `adds` MUST NAME SOMETHING THE PLAYER CAN SEE ARRIVE.
 * Intercept already proves the shape (`mechanics()` in its data.js returns
 * strike · nogo · barrel · armour · canopy · shuffle) and it also proves the
 * ceiling: six, not ten. A game with six real mechanics gets a 60-level
 * ladder. Padding it to 100 with invented levers is how you get the tier
 * problem back — a longer ladder that measures the same thing throughout.
 * LADDERS MAY GROW as features are authored; they must never be padded to a
 * target length. Growing is safe under strict unlock (a player's cleared
 * levels stay cleared); shrinking takes levels away from people.
 *
 * ⚠ IMPORT WITH AN EXPLICIT .js EXTENSION — see the warning at the top of
 * this file. The gates run in plain Node and cannot resolve it otherwise.
 */

/** Levels per band. Ten, so "a new thing every ~10 levels" is literal. */
export const BAND_SIZE = 10;

/** 0-based band index for a 1-based level. */
export function bandIndex(level, bandSize = BAND_SIZE) {
  return Math.max(0, Math.floor(((Number(level) || 1) - 1) / bandSize));
}

/**
 * Normalised position along the WHOLE ladder — 0 at L1, 1 at the last level.
 *
 * Deliberately the same curve contract as `levelFraction`, so a game's
 * continuous levers migrate without being re-tuned: only the span changes.
 */
export function ladderFraction(level, levels, curve = CURVE.FRONT) {
  return levelFraction(level, levels, curve);
}

/**
 * Every mechanic in play at `level` — the union of `adds` from band 0 up to
 * and including this level's band.
 *
 * This is what a gate should assert rises, and what the level grid should
 * eventually show. Cumulative on purpose: a mechanic introduced at L21 is
 * still there at L60, so the count is monotonic by construction and a band
 * cannot quietly drop a mechanic to make room for another.
 */
export function mechanicsAt(bands, level, bandSize = BAND_SIZE) {
  const upto = Math.min(bandIndex(level, bandSize), bands.length - 1);
  const seen = [];
  for (let i = 0; i <= upto; i++) {
    for (const m of bands[i]?.adds || []) if (!seen.includes(m)) seen.push(m);
  }
  return seen;
}

/* ── WEIGHTED CONTENT POOLS ───────────────────────────────────────────────
 *
 * Some games do not scale by turning a knob — they scale by WHICH CONTENT they
 * serve. Word Links, Trivia and Sort It Another Way all tag their banks
 * `easy` / `med` / `hard` (or by star rating) and the old tiers simply filtered
 * to one of them. That is a sliding window, and on a ladder it reads badly:
 * Sort It Another Way has only THREE sets per tier, so a band that drew from
 * one tier alone would cycle the same three boards for ten levels — the exact
 * repetition the ladder exists to remove.
 *
 * So a band declares an explicit WEIGHT MAP instead. The pool accumulates as
 * you climb and the newest tier dominates:
 *
 *     { easy: 0.15, med: 0.45, hard: 0.40 }
 *
 * ⚠ EXPLICIT, NOT COMPUTED. A decay formula would be shorter, but the mix is a
 * content judgement per game — how soon `hard` should take over depends on how
 * much hard content exists, and Word Links has 12 hard items against 16 medium.
 * Written out, it is readable, authorable, and the gate can assert it directly.
 */

/** Pick a key from a `{key: weight}` map. Weights need not sum to 1. */
export function pickWeighted(weights, rng = Math.random) {
  const keys = Object.keys(weights || {}).filter((k) => weights[k] > 0);
  if (!keys.length) return null;
  const total = keys.reduce((s, k) => s + weights[k], 0);
  // One roll, once. (An earlier draft called rng() twice and multiplied the
  // bare Math.random reference by `total`, giving NaN for a non-function rng —
  // which would have silently always returned the last key.)
  const roll = typeof rng === 'function' ? rng() : Math.random();
  let r = roll * total;
  for (const k of keys) {
    r -= weights[k];
    if (r <= 0) return k;
  }
  return keys[keys.length - 1];
}

/**
 * A single number for "how hard is this mix" — the weighted mean rank of the
 * tiers in play, normalised to 0..1.
 *
 * This is what makes a weighted pool GATEABLE. `audit:curves` compares numbers,
 * and a band that widened its pool without shifting weight toward the harder
 * end would otherwise look like progress while playing identically. Register it
 * as a structural field and a band cannot go sideways.
 */
export function tierMass(weights, order) {
  const keys = Object.keys(weights || {}).filter((k) => weights[k] > 0);
  if (!keys.length) return 0;
  const span = Math.max(1, order.length - 1);
  let sum = 0; let total = 0;
  for (const k of keys) {
    const rank = order.indexOf(k);
    if (rank < 0) continue;
    sum += weights[k] * (rank / span);
    total += weights[k];
  }
  return total ? Math.round((sum / total) * 1000) / 1000 : 0;
}

/**
 * Survival stage → a level on the ladder.
 *
 * Replaces `tierStage` for migrated games. `tierStage` stays for the games
 * still on tiers (and for Mirror World, which shares it) — do not delete it.
 *
 * `stages` is how many survival stages it takes to reach the top of the
 * ladder; beyond that the level clamps, which is correct: Survival's own
 * ramp keeps tightening after the ladder runs out.
 */
export function ladderStage(stage, { levels, stages = 36, curve = CURVE.FRONT } = {}) {
  const s = Math.max(0, Math.floor(Number(stage) || 0));
  const t = Math.min(1, s / Math.max(1, stages));
  const lv = 1 + Math.round(t * (levels - 1));
  return { lv, f: ladderFraction(lv, levels, curve) };
}
