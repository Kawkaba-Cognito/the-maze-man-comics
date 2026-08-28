#!/usr/bin/env node
/*
 * validate-wordmaze — the curated short-word dictionary, and what it must do.
 *
 * Word Maze validated against `words_alpha.txt` alone, which is an unabridged
 * dump: at 3–4 letters it is mostly abbreviations and archaic forms (2,130
 * three-letter entries; 7,186 four-letter). Players tracing letters in what
 * looked like a scramble kept landing on one and being told "correct" — `sart`,
 * `aal`, `abt` all scored. The scoring code was never wrong; the dictionary was.
 *
 * So short words now validate against an AUTHORED list, and this gate exists
 * because an authored list has two failure modes and both are silent:
 *
 *   1. It lets junk through   → the original bug, unfixed.
 *   2. It rejects real words  → the opposite complaint, and worse, because the
 *                               player knows they are right.
 *
 * Every entry is therefore cross-checked against the corpus (a typo here cannot
 * invent a word), the length tiers are enforced, and both directions are tested
 * against fixtures: known junk must be REJECTED, known words ACCEPTED.
 *
 *   node scripts/validate-wordmaze.mjs
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = 'src/features/training/domains/language/games/wordle';

const {
  CURATED_EN_3, CURATED_EN_4, CURATED_EN_SHORT, CURATED_MAX_LEN,
} = await import(new URL(`../${DIR}/link-words-en-curated.js`, import.meta.url));
const { LINK_WORDS_EN } = await import(new URL(`../${DIR}/link-words-en.js`, import.meta.url));
const { LINK_WORDS_EN_COMMON } = await import(new URL(`../${DIR}/link-words-en-common.js`, import.meta.url));

const corpus = new Set(LINK_WORDS_EN);
const problems = [];
const fail = (msg) => problems.push(msg);

/* ── 1. Shape: right length, lowercase a–z, no duplicates ──────────────── */
const seen = new Set();
for (const [tier, list, len] of [['CURATED_EN_3', CURATED_EN_3, 3], ['CURATED_EN_4', CURATED_EN_4, 4]]) {
  for (const w of list) {
    if (typeof w !== 'string' || !/^[a-z]+$/.test(w)) fail(`${tier}: not lowercase a–z: ${JSON.stringify(w)}`);
    else if (w.length !== len) fail(`${tier}: "${w}" is ${w.length} letters, tier is ${len}`);
    if (seen.has(w)) fail(`duplicate entry: "${w}"`);
    seen.add(w);
  }
}

/* ── 2. Every curated word must exist in the corpus ─────────────────────
 * The corpus is over-inclusive, so anything absent from it is almost certainly
 * a typo or something I invented. This is the cheapest guard against an
 * authored list quietly creating fake words. */
const notInCorpus = [...seen].filter((w) => !corpus.has(w));
if (notInCorpus.length) {
  fail(`${notInCorpus.length} curated word(s) absent from the corpus (typo or not a word):\n    ${notInCorpus.join(' ')}`);
}

/* ── 3. Board seeds must be playable ────────────────────────────────────
 * link-words-en-common.js seeds the boards. Any seed at 3–4 letters that the
 * curated list does not accept would be placed on the board and then REFUSED
 * when the player traces it — the most infuriating bug this game could have. */
const unacceptableSeeds = LINK_WORDS_EN_COMMON
  .filter((w) => w.length <= CURATED_MAX_LEN && !CURATED_EN_SHORT.has(w));
if (unacceptableSeeds.length) {
  fail(`${unacceptableSeeds.length} seeded board word(s) would be REJECTED when traced:\n    ${unacceptableSeeds.join(' ')}`);
}

/* ── 4. Junk must be rejected (the reported bug) ────────────────────────
 * Sampled directly from the corpus tiers that were being accepted. */
const JUNK = [
  'sart', 'aal', 'aam', 'abb', 'abd', 'abl', 'abn', 'abt', 'abv', 'aby',
  'acc', 'ach', 'ack', 'acy', 'adc', 'adp', 'ady', 'aeq', 'aer',
  'aani', 'aaru', 'abac', 'abas', 'abbr', 'abey', 'abib', 'abos', 'abri',
  'acad', 'acce', 'acct', 'acle', 'acpt', 'actg', 'adat',
];
const junkAccepted = JUNK.filter((w) => CURATED_EN_SHORT.has(w));
if (junkAccepted.length) fail(`junk still accepted: ${junkAccepted.join(' ')}`);

/* ── 5. Real words must be accepted ─────────────────────────────────────
 * Including the ones the tiny seed list would have rejected — that is why the
 * curated list exists rather than reusing link-words-en-common.js. */
const MUST_ACCEPT = [
  'cat', 'dog', 'run', 'sun', 'elf', 'oak', 'ivy', 'pug', 'zip', 'yak', 'vet',
  'wig', 'pea', 'rib', 'tan', 'owl', 'fox', 'jar', 'sky', 'gym', 'ice', 'egg',
  'star', 'rats', 'arts', 'tsar', 'word', 'game', 'time', 'blue', 'jump',
  'quiz', 'lynx', 'myth', 'oven', 'zone', 'wolf', 'four', 'nine',
];
const missing = MUST_ACCEPT.filter((w) => !CURATED_EN_SHORT.has(w));
if (missing.length) fail(`real word(s) NOT accepted: ${missing.join(' ')}`);

/* ── 6. Coverage sanity ─────────────────────────────────────────────────
 * A list that shrank drastically would pass every rule above while making the
 * game unplayable, so assert a floor. */
if (CURATED_EN_3.length < 300) fail(`CURATED_EN_3 has only ${CURATED_EN_3.length} entries — too thin to play`);
if (CURATED_EN_4.length < 700) fail(`CURATED_EN_4 has only ${CURATED_EN_4.length} entries — too thin to play`);

/* ── 7. EVERY LEVEL MUST STILL BE WINNABLE ──────────────────────────────
 * The rules above all check the dictionary. This one checks the GAME, and it
 * is the only rule here that can catch the way this change could go wrong:
 * tightening validation shrinks the pool of findable words, and if a board's
 * pass target exceeds what is actually findable the level is unwinnable while
 * every other check still passes. Exactly how audit:fq certified a Cancellation
 * board nobody could clear.
 *
 * So: build real rounds through the real code path and assert the target is
 * reachable, with headroom — a player will not find 100% of a grid's words. */
const { specificationForLevel, createRound, LADDER_LEVELS } = await import(new URL(`../${DIR}/wordleData.js`, import.meta.url));

const HEADROOM = 1.5; // findable must exceed target by this factor
let worst = null;
let boards = 0;
/* ⚠ ONE LADDER since 2026-08-28 — every level of it, not three tiers sampled
   every seventh. The ladder is short enough to simulate exhaustively. */
{
  for (let lv = 1; lv <= LADDER_LEVELS; lv += 1) {
    const spec = specificationForLevel(lv);
    for (let s = 0; s < 4; s += 1) {
      const round = createRound(lv * 1000 + s, spec, { mode: 'level' }, 'en');
      boards += 1;
      const findable = round.gridWords.size;
      const ratio = findable / Math.max(1, round.targetWords);
      if (!worst || ratio < worst.ratio) {
        worst = { diff: 'L', lv, seed: s, findable, target: round.targetWords, ratio };
      }
    }
  }
}
if (worst && worst.ratio < HEADROOM) {
  fail(`level not comfortably winnable — L${worst.lv} (seed ${worst.seed}): `
    + `${worst.findable} findable word(s) for a target of ${worst.target} (ratio ${worst.ratio.toFixed(2)}, need >= ${HEADROOM})`);
}

/* ── Report ─────────────────────────────────────────────────────────────── */
console.log(`  winnability: ${boards} boards simulated · tightest ${worst.diff} L${worst.lv} `
  + `= ${worst.findable} findable / ${worst.target} target (${worst.ratio.toFixed(2)}x)`);
console.log(`validate-wordmaze: ${CURATED_EN_3.length} three-letter + ${CURATED_EN_4.length} four-letter curated words.`);
console.log(`  corpus: ${LINK_WORDS_EN.length} · seeds: ${LINK_WORDS_EN_COMMON.length} · short-validation cutoff: <=${CURATED_MAX_LEN}`);

if (problems.length) {
  console.error('\nFAILED:');
  for (const p of problems) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log('\nPASS — shape, corpus cross-check, seed playability, junk rejected, real words accepted.');
