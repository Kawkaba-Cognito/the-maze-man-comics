/**
 * Finite checks on Sort It Another Way's card sets.
 *
 * Six cards have exactly ten possible 3–3 splits — C(6,3)/2 — which is small
 * enough to enumerate completely. So this does not sample or spot-check: for
 * every set it walks all ten splits and decides each one, and the number of
 * valid rules is therefore a measured fact rather than an authoring claim.
 *
 * The failure this exists to prevent: a player finds a grouping that is
 * genuinely sensible, the author never anticipated it, and the game says wrong.
 * That is exactly the unfairness that got Card Sort and Kawkab Hops retired,
 * and re-introducing it in their replacement would be the worst outcome here.
 *
 * Run: node scripts/validate-sort.mjs
 */
import { SORT_SETS, ruleForTrio } from '../src/features/training/domains/flexibility/games/sort-shift/sets.js';

let failures = 0;
const fail = (m) => { failures += 1; console.error('  ✗ ' + m); };

/** All ten 3–3 splits of six cards, each as the trio of lower indices. */
function allSplits() {
  const out = [];
  for (let a = 0; a < 6; a++) {
    for (let b = a + 1; b < 6; b++) {
      for (let c = b + 1; c < 6; c++) {
        // Take each partition once by fixing card 0 to the first half.
        if (a !== 0) continue;
        out.push([a, b, c]);
      }
    }
  }
  return out;
}
const SPLITS = allSplits();
if (SPLITS.length !== 10) fail(`enumeration is wrong: ${SPLITS.length} splits, expected 10`);

const seen = new Set();
let totalValid = 0;

for (const s of SORT_SETS) {
  const at = `sort/${s.id}`;
  if (seen.has(s.id)) fail(`${at}: duplicate set id`);
  seen.add(s.id);

  if (s.cards.length !== 6) fail(`${at}: has ${s.cards.length} cards, the game assumes 6`);
  const words = s.cards.map((c) => c.w.en);
  if (new Set(words).size !== words.length) fail(`${at}: repeats a card`);
  for (const c of s.cards) {
    if (!c.w?.en || !c.w?.ar) fail(`${at}: "${c.w?.en || '?'}" is missing a translation`);
  }

  /* Every declared feature must cut the six exactly 3–3. If it does not, a
   * "valid" split would leave two against four and the second group would have
   * nothing in common — the player would be marked right for a broken sort. */
  const groupings = new Set();
  for (const f of s.features) {
    const vals = [...new Set(s.cards.map((c) => c[f.key]))];
    if (vals.length !== 2) { fail(`${at}: feature "${f.key}" has ${vals.length} values, needs exactly 2`); continue; }
    const n = s.cards.filter((c) => c[f.key] === vals[0]).length;
    if (n !== 3) { fail(`${at}: feature "${f.key}" splits ${n}–${6 - n}, not 3–3`); continue; }
    const key = s.cards.map((c, i) => (c[f.key] === vals[0] ? i : null)).filter((i) => i !== null).join(',');
    const mirrored = s.cards.map((c, i) => (c[f.key] !== vals[0] ? i : null)).filter((i) => i !== null).join(',');
    const canon = [key, mirrored].sort()[0];
    if (groupings.has(canon)) fail(`${at}: feature "${f.key}" produces the same grouping as another feature`);
    groupings.add(canon);
    if (!f.en || !f.ar) fail(`${at}: feature "${f.key}" needs both labels for the reveal`);
  }

  /* Decoys: a property NOT declared as a feature must not divide the six
   * evenly, or a player could find it, be right, and be told they are wrong. */
  const declared = new Set(s.features.map((f) => f.key));
  const props = new Set();
  s.cards.forEach((c) => Object.keys(c).forEach((k) => { if (k !== 'w') props.add(k); }));
  for (const p of props) {
    if (declared.has(p)) continue;
    const vals = [...new Set(s.cards.map((c) => c[p]))];
    if (vals.length === 2 && s.cards.filter((c) => c[p] === vals[0]).length === 3) {
      fail(`${at}: undeclared property "${p}" also splits 3–3 — a player could find it and be marked wrong`);
    }
  }

  // Walk all ten splits and count the ones the game will accept.
  const valid = SPLITS.filter((trio) => ruleForTrio(s, trio) !== null);
  if (valid.length !== s.features.length) {
    fail(`${at}: ${s.features.length} features declared but ${valid.length} of the 10 splits are accepted`);
  }
  if (valid.length < 2) fail(`${at}: only ${valid.length} valid split — there is nothing to shift to`);
  totalValid += valid.length;

  // Every valid split must name a rule, and the same trio may not match two.
  for (const trio of valid) {
    const matches = s.features.filter((f) => {
      const v = s.cards[trio[0]][f.key];
      return trio.every((i) => s.cards[i][f.key] === v);
    });
    if (matches.length > 1) {
      fail(`${at}: split [${trio.map((i) => s.cards[i].w.en).join(', ')}] matches ${matches.length} rules at once`);
    }
  }
}

const tiers = ['easy', 'med', 'hard'];
for (const tier of tiers) {
  const n = SORT_SETS.filter((s) => s.tier === tier).length;
  if (n < 3) fail(`tier "${tier}" has only ${n} sets — a run would repeat`);
}

if (failures) {
  console.error(`\nvalidate-sort: ${failures} problem(s).`);
  process.exit(1);
}
console.log('validate-sort: OK', {
  sets: SORT_SETS.length,
  splitsCheckedPerSet: SPLITS.length,
  validRulesTotal: totalValid,
  byTier: Object.fromEntries(tiers.map((t) => [t, SORT_SETS.filter((s) => s.tier === t).length])),
});
