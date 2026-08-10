/**
 * Finite checks on THE WHEEL's three content banks.
 *
 * The point of this file is that "no repeated questions" and "the facts are
 * right" are claims a human cannot hold in their head across ~80 questions,
 * 28 pools and 45 puzzles — but a machine can, and can keep holding them every
 * time the data is edited.
 *
 * Run: node scripts/validate-wheel.mjs
 */
import {
  WHEEL_VALUES, WHEEL_BANK, STREAK_POOLS, RANKED_PUZZLES,
} from '../src/features/puzzles/games/thewheel/data.js';

let failures = 0;
function assert(cond, msg) {
  if (!cond) { failures += 1; console.error('  ✗ ' + msg); }
}

/* ── Identity: nothing may be drawn twice under two names ───────────────── */
const seenIds = new Set();
const dupeId = (id, where) => {
  assert(!seenIds.has(where + ':' + id), `${where}: duplicate id "${id}"`);
  seenIds.add(where + ':' + id);
};
WHEEL_BANK.forEach((q) => dupeId(q.id, 'wheel'));
STREAK_POOLS.forEach((p) => dupeId(p.id, 'streak'));
RANKED_PUZZLES.forEach((p) => dupeId(p.id, 'ranked'));

/*
 * The one the prompt-keyed draw could not see: two puzzles with different
 * titles over the SAME five cards. To the player that is the same puzzle
 * twice in one night. Compared as a set of item names, so re-wording a prompt
 * can never smuggle a repeat back in.
 */
const setKey = (p) => p.items.map((it) => it.n).slice().sort().join('|');
const bySet = new Map();
RANKED_PUZZLES.forEach((p) => {
  const k = setKey(p);
  if (bySet.has(k)) {
    assert(false, `ranked: "${p.id}" and "${bySet.get(k)}" are the same five cards under different prompts`);
  } else bySet.set(k, p.id);
});

/* Wheel questions must not ask the same thing twice either. */
const byQuestion = new Map();
WHEEL_BANK.forEach((q) => {
  const k = q.q.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (byQuestion.has(k)) assert(false, `wheel: "${q.id}" repeats "${byQuestion.get(k)}"`);
  else byQuestion.set(k, q.id);
});

/* ── Wheel: every round must be playable and winnable ───────────────────── */
WHEEL_BANK.forEach((q) => {
  const at = `wheel/${q.id}`;
  assert(q.truth >= q.min && q.truth <= q.max, `${at}: truth ${q.truth} is outside the slider ${q.min}–${q.max} — unwinnable`);
  assert(WHEEL_VALUES.includes(q.low), `${at}: low anchor ${q.low} is not a wheel segment`);
  assert(WHEEL_VALUES.includes(q.high), `${at}: high anchor ${q.high} is not a wheel segment`);
  assert(q.low !== q.high, `${at}: both anchors are ${q.low} — the wheel cannot pull two ways`);
  assert(q.tol > 0, `${at}: tolerance must be positive`);
  /* A bullseye has to be reachable on the slider's own step: whole numbers
   * unless the question opted into decimals. Without this a question like
   * "0.93%" on an integer slider can be impossible to hit exactly. */
  const step = q.dec ? 0.1 : 1;
  const nearest = Math.round(q.truth / step) * step;
  assert(Math.abs(nearest - q.truth) <= q.tol + 1e-9,
    `${at}: truth ${q.truth} cannot be hit on a ${step}-step slider within tolerance ${q.tol}`);
  assert(typeof q.fact === 'string' && q.fact.length > 12, `${at}: needs a real fact line for the reveal`);
  /* The anchors exist to pull the guess away from the truth. If both sit on
   * the same side, the question can never show anchoring in one direction. */
  assert(Math.min(q.low, q.high) < q.truth || Math.max(q.low, q.high) > q.truth,
    `${at}: both anchors sit on the same side of the truth`);
});

/* ── Streak: no call may be a coin flip ─────────────────────────────────── */
/*
 * Higher/Lower is only a question when the two values are far enough apart to
 * be knowable. 8% is the line: Mercury's gravity (3.70) against Mars's (3.71)
 * is 0.3% and is pure luck, and luck that burns an entire pot is not a
 * mechanic. Small integer sets are exempt — "4 heart chambers vs 5 lung lobes"
 * is a real fact even though it is 25% apart in absolute terms, so the rule
 * there is simply that the values differ.
 */
const REL_GAP = 0.08;

/*
 * A RELATIVE gap is the wrong test for calendar years, and getting that wrong
 * is instructive: 1440 and 1989 are 549 years apart — nobody would call that a
 * coin flip — but only 38% apart relatively, and the printing press against the
 * web would have passed while Go (2009) against TypeScript (2012) failed by the
 * same measure. Any pool whose values are years declares an ABSOLUTE minimum
 * instead, in years, which is the unit the player actually reasons in.
 */
function checkGaps(at, items, gapAbs) {
  const sorted = [...items].sort((a, b) => a.v - b.v);
  for (let i = 1; i < sorted.length; i++) {
    const lo = sorted[i - 1]; const hi = sorted[i];
    assert(lo.v !== hi.v, `${at}: ${lo.n} and ${hi.n} are both ${lo.v} — the call has no right answer`);
    if (gapAbs) {
      const d = Math.abs(hi.v - lo.v);
      assert(d >= gapAbs, `${at}: ${lo.n} (${lo.v}) vs ${hi.n} (${hi.v}) is ${d} apart, under the ${gapAbs} minimum — a coin flip`);
      continue;
    }
    // Small integer sets are exempt: "4 heart chambers vs 5 lung lobes" is a
    // real fact even though it is 25% apart.
    if (Math.abs(hi.v) < 25 && Number.isInteger(hi.v) && Number.isInteger(lo.v)) continue;
    const gap = Math.abs(hi.v - lo.v) / Math.max(Math.abs(lo.v), 1e-9);
    assert(gap >= REL_GAP,
      `${at}: ${lo.n} (${lo.v}) vs ${hi.n} (${hi.v}) is ${(gap * 100).toFixed(1)}% apart — a coin flip`);
  }
}

STREAK_POOLS.forEach((p) => {
  const at = `streak/${p.id}`;
  assert(p.items.length >= 6, `${at}: only ${p.items.length} facts — a run ends too early`);
  const names = p.items.map((i) => i.n);
  assert(new Set(names).size === names.length, `${at}: repeats an entry`);
  checkGaps(at, p.items, p.gapAbs);
});

/* ── Ranked: five cards, ten pairs, all orderable ───────────────────────── */
RANKED_PUZZLES.forEach((p) => {
  const at = `ranked/${p.id}`;
  assert(p.items.length === 5, `${at}: has ${p.items.length} cards, the scoring assumes 5`);
  const names = p.items.map((i) => i.n);
  assert(new Set(names).size === names.length, `${at}: repeats a card`);
  const vals = p.items.map((i) => i.v);
  assert(new Set(vals).size === vals.length, `${at}: two cards share a value — the correct order is ambiguous`);
  checkGaps(at, p.items, p.gapAbs);
  assert(p.prompt && p.promptAr, `${at}: needs both prompts`);
});

/* ── Enough content that a long night never runs dry ────────────────────── */
/* Marathon is 8 wheel questions, 4 streak runs and 6 ranked puzzles PER TEAM,
 * and four teams can play, so these are the real worst-case draws. */
assert(WHEEL_BANK.length >= 32, `wheel bank has ${WHEEL_BANK.length}; a 4-team marathon draws 32`);
assert(STREAK_POOLS.length >= 16, `streak has ${STREAK_POOLS.length} pools; a 4-team marathon draws 16`);
assert(RANKED_PUZZLES.length >= 24, `ranked has ${RANKED_PUZZLES.length} puzzles; a 4-team marathon draws 24`);

/* ── Night sets ───────────────────────────────────────────────────────────
 * The promise a set makes is "nothing tonight has come up before, and this set
 * alone will see the night out". Both halves are checkable, and both are the
 * kind that fail silently: a set that shares a question with another set only
 * shows up when a group happens to replay it weeks later, and a set that is one
 * puzzle short only shows up when a night runs dry in front of everybody.
 */
const { SETS, SET_COUNT } = await import('../src/features/puzzles/games/thewheel/sets.js');
const NIGHT = { wheel: 20, streak: 12, ranked: 16 };   // standard, four teams

assert(SET_COUNT >= 2, `only ${SET_COUNT} set(s) — sets are pointless below two`);

const BANKS = { wheel: WHEEL_BANK, streak: STREAK_POOLS, ranked: RANKED_PUZZLES };
for (const kind of ['wheel', 'streak', 'ranked']) {
  const seen = new Map();
  let total = 0;
  SETS.forEach((s) => {
    total += s[kind].length;
    assert(s[kind].length >= NIGHT[kind],
      `set ${s.index + 1}: only ${s[kind].length} ${kind} — a standard 4-team night needs ${NIGHT[kind]} and would run dry`);
    s[kind].forEach((item) => {
      assert(!seen.has(item.id),
        `${kind} "${item.id}" is in BOTH set ${seen.get(item.id) + 1} and set ${s.index + 1} — the sets are not independent`);
      seen.set(item.id, s.index);
    });
  });
  // Nothing may be stranded: every authored item must belong to exactly one set.
  assert(total === BANKS[kind].length,
    `${kind}: sets hold ${total} items but the bank has ${BANKS[kind].length} — ${BANKS[kind].length - total} are unreachable`);
}

if (failures) {
  console.error(`\nvalidate-wheel: ${failures} problem(s).`);
  process.exit(1);
}
console.log('validate-wheel: OK', {
  wheelQuestions: WHEEL_BANK.length,
  streakPools: STREAK_POOLS.length,
  streakFacts: STREAK_POOLS.reduce((a, p) => a + p.items.length, 0),
  rankedPuzzles: RANKED_PUZZLES.length,
  maxDrawPerNight: { wheel: 32, streak: 16, ranked: 24 },
  nightSets: SET_COUNT,
  perSet: { wheel: SETS[0].wheel.length, streak: SETS[0].streak.length, ranked: SETS[0].ranked.length },
});
