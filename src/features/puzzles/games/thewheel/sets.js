import { WHEEL_BANK, STREAK_POOLS, RANKED_PUZZLES } from './data.js';
import { loadJson, saveJson } from '../../../../lib/storage.js';

/*
 * NIGHT SETS — "we played Set 1 last week, tonight is Set 2."
 *
 * ── Why this exists, and what it replaces ──
 * The three games already drew without repeats via `createDrawer`, which
 * remembers spent ids in localStorage. That prevents repeats but it is INVISIBLE:
 * a host planning a games night cannot see what has been used, cannot tell two
 * groups apart, and has no way to say "this is a fresh night, nothing tonight
 * has come up before". Sets make the same guarantee legible — you pick a set,
 * you tick it off, and next time you take the next one.
 *
 * ── How a set is sized ──
 * A set must hold a whole night, or it runs dry mid-game and the promise breaks.
 * A standard night for four teams needs 20 wheel + 12 streak + 16 ranked
 * (`LENGTHS.standard` × teams). The banks are split evenly rather than sliced to
 * that minimum, so every set carries a margin on the wheel questions:
 *
 *     152 wheel  ÷ 4 = 38 per set   (needs 20)
 *      48 streak ÷ 4 = 12 per set   (needs 12 — exact)
 *      64 ranked ÷ 4 = 16 per set   (needs 16 — exact)
 *
 * Streak was 44 and did not divide; four pools were authored to reach 48 rather
 * than dropping to three sets. That is the only reason those four exist.
 *
 * ⚠ A MARATHON night with four teams needs 32/16/24 and will exhaust a set's
 * streak and ranked pools. The game warns and then draws the shortfall from the
 * rest of the bank — running out mid-night would be worse than a soft edge.
 * `validate:wheel` asserts the standard-night guarantee; the marathon overflow
 * is a stated limit, not an accident.
 *
 * ── Why interleave and not slice ──
 * Sets are built by dealing round-robin (item i → set i % 4), not by cutting the
 * bank into four blocks. Sliced sets would make Set 1 entirely the oldest
 * authored content and Set 4 entirely the newest, so the sets would differ in
 * character and difficulty. Dealing spreads both across all four.
 */

const KEY = 'mm_wheel_sets_v1';

/** Deal a bank round-robin into `n` piles, preserving order within each pile. */
function deal(bank, n) {
  const piles = Array.from({ length: n }, () => []);
  bank.forEach((item, i) => piles[i % n].push(item));
  return piles;
}

/*
 * How many sets the content actually supports, at a standard four-team night.
 * Derived, never hardcoded: add a bank of content and the set count rises on its
 * own; remove some and it falls rather than silently shipping a set that cannot
 * fill a night.
 */
const NIGHT = { wheel: 20, streak: 12, ranked: 16 };

export const SET_COUNT = Math.max(1, Math.min(
  Math.floor(WHEEL_BANK.length / NIGHT.wheel),
  Math.floor(STREAK_POOLS.length / NIGHT.streak),
  Math.floor(RANKED_PUZZLES.length / NIGHT.ranked),
));

const wheelPiles = deal(WHEEL_BANK, SET_COUNT);
const streakPiles = deal(STREAK_POOLS, SET_COUNT);
const rankedPiles = deal(RANKED_PUZZLES, SET_COUNT);

/** The sets themselves. Index 0 is "Set 1" in the UI. */
export const SETS = Array.from({ length: SET_COUNT }, (_, i) => ({
  index: i,
  wheel: wheelPiles[i],
  streak: streakPiles[i],
  ranked: rankedPiles[i],
}));

/** Does this set cover the requested night, or will it need to overflow? */
export function setCovers(setIndex, need) {
  const s = SETS[setIndex];
  if (!s) return false;
  return s.wheel.length >= need.wheel
    && s.streak.length >= need.streak
    && s.ranked.length >= need.ranked;
}

/* ── which sets have been played ─────────────────────────────────────────── */

export function loadPlayed() {
  const raw = loadJson(KEY, { done: [] }) || { done: [] };
  return new Set(Array.isArray(raw.done) ? raw.done : []);
}

export function isPlayed(setIndex) {
  return loadPlayed().has(setIndex);
}

/** Tick a set off, or untick it. Returns the new played set. */
export function setPlayed(setIndex, played) {
  const done = loadPlayed();
  if (played) done.add(setIndex); else done.delete(setIndex);
  saveJson(KEY, { done: [...done].sort((a, b) => a - b) });
  return done;
}

/** The lowest-numbered set not yet ticked — what to suggest tonight. */
export function nextUnplayed() {
  const done = loadPlayed();
  for (let i = 0; i < SET_COUNT; i++) if (!done.has(i)) return i;
  return 0;   // all played: wrap round rather than dead-end
}

export function clearPlayed() {
  saveJson(KEY, { done: [] });
}
