/*
 * validate:keeptrack — assert the OUTCOME of a Keep Track round, not its config.
 *
 * The failure this exists for is invisible to review: a word that belongs to two
 * live categories makes the trial unanswerable, and no amount of reading the bank
 * catches it once the bank is 120 words in two languages. Same family as
 * validate:sort enumerating every 3-3 split rather than trusting the author.
 *
 * Checks, per language:
 *   1. no exemplar appears in more than one category
 *   2. no duplicate exemplar inside a category; every category is the same size
 *   3. over many simulated rounds, at every difficulty and across the level range:
 *        · every target category appears at least TWICE (else it tests storage,
 *          not updating — the whole point of the task)
 *        · the recorded answer really is the LAST occurrence of that category
 *        · no word repeats inside a round (else "the last one" is ambiguous)
 *        · no two consecutive items share a category (else the player batches)
 *        · the stream is long enough to be worth running
 *   4. difficulty is monotonic where it claims to be: rate falls, stream grows
 */
import {
  CATEGORIES, BASE, LEVELS_PER_TIER, levelCfg, survivalCfg, buildRound, isCorrect,
} from '../src/features/training/domains/memory/games/keep-track/data.js';

const problems = [];
const LANGS = ['en', 'ar'];

// ── 1 & 2: the bank itself ──
for (const lang of LANGS) {
  const seen = new Map();
  let size = null;
  for (const cat of CATEGORIES) {
    const items = cat.items[lang];
    if (!items) { problems.push(`${cat.id}: missing ${lang} items`); continue; }
    if (size == null) size = items.length;
    if (items.length !== size) {
      problems.push(`${lang}/${cat.id}: ${items.length} items, expected ${size} — unbalanced categories bias the draw`);
    }
    const inside = new Set();
    for (const w of items) {
      const key = w.trim().toLowerCase();
      if (inside.has(key)) problems.push(`${lang}/${cat.id}: duplicate "${w}" inside the category`);
      inside.add(key);
      if (seen.has(key) && seen.get(key) !== cat.id) {
        problems.push(`${lang}: "${w}" is in BOTH ${seen.get(key)} and ${cat.id} — a trial with both live has no answer`);
      }
      seen.set(key, cat.id);
    }
  }
}

// ── 3: simulated rounds ──
let rounds = 0;
for (const lang of LANGS) {
  for (const diff of Object.keys(BASE)) {
    for (const lv of [1, 25, 50, 75, LEVELS_PER_TIER]) {
      const cfg = levelCfg(diff, lv);
      for (let rep = 0; rep < 40; rep++) {
        const r = buildRound(cfg, lang);
        rounds++;
        const tag = `${lang}/${diff}/L${lv}#${rep}`;

        if (r.stream.length < cfg.stream) {
          problems.push(`${tag}: stream ${r.stream.length} shorter than requested ${cfg.stream}`);
        }
        if (r.targets.length !== Math.min(cfg.targets, CATEGORIES.length)) {
          problems.push(`${tag}: ${r.targets.length} targets, expected ${cfg.targets}`);
        }

        const words = r.stream.map((s) => s.word);
        if (new Set(words).size !== words.length) {
          problems.push(`${tag}: a word repeats inside the round — "last one" is ambiguous`);
        }
        for (let i = 1; i < r.stream.length; i++) {
          if (r.stream[i].catId === r.stream[i - 1].catId) {
            problems.push(`${tag}: consecutive items from ${r.stream[i].catId}`);
            break;
          }
        }
        for (const cat of r.targets) {
          const occ = r.stream.filter((s) => s.catId === cat.id);
          if (occ.length < 2) {
            problems.push(`${tag}: target ${cat.id} appears ${occ.length}x — nothing to update`);
          }
          const last = occ.length ? occ[occ.length - 1].word : null;
          if (r.answers[cat.id] !== last) {
            problems.push(`${tag}: answer for ${cat.id} is "${r.answers[cat.id]}", last occurrence is "${last}"`);
          }
          if (!isCorrect(r.answers[cat.id] || '', last || '')) {
            problems.push(`${tag}: recorded answer for ${cat.id} fails its own matcher`);
          }
        }
      }
    }
  }
}

// ── 4: the curve actually goes the way it claims ──
for (const diff of Object.keys(BASE)) {
  let prevRate = Infinity, prevStream = -Infinity;
  for (let lv = 1; lv <= LEVELS_PER_TIER; lv++) {
    const c = levelCfg(diff, lv);
    if (c.rate > prevRate) problems.push(`${diff} L${lv}: rate rose (${prevRate}→${c.rate}) — later levels must not be slower`);
    if (c.stream < prevStream) problems.push(`${diff} L${lv}: stream shrank (${prevStream}→${c.stream})`);
    prevRate = c.rate; prevStream = c.stream;
  }
}
for (let stage = 0; stage < 36; stage++) {
  const s = survivalCfg(stage);
  if (!s || !s.stream || !s.rate) problems.push(`survival stage ${stage}: bad config`);
}

// ── matcher sanity ──
if (!isCorrect(' Camel ', 'camel')) problems.push('matcher: trim/case failed');
// One dropped character in a long word is a typo, not a memory failure.
if (!isCorrect('dolphn', 'dolphin')) problems.push('matcher: single-edit tolerance failed');
// Two edits is a different word — "dolfin" needs p→f AND a deleted h.
if (isCorrect('dolfin', 'dolphin')) problems.push('matcher: too lenient (accepted a 2-edit word)');
if (isCorrect('wolf', 'lynx')) problems.push('matcher: accepted a wrong word');
if (isCorrect('', 'camel')) problems.push('matcher: accepted an empty answer');
if (isCorrect('harp', 'hail')) problems.push('matcher: accepted a wrong short word');
// Arabic: a player typing bare alef or haa must still match the banked form.
if (!isCorrect('ارجواني', 'أرجواني')) problems.push('matcher: alef normalisation failed');
if (!isCorrect('عاصفه ثلجيه', 'عاصفة ثلجية')) problems.push('matcher: taa-marbuta normalisation failed');

console.log(`validate-keep-track: ${rounds} rounds, ${CATEGORIES.length} categories, ${LANGS.length} languages`);
if (problems.length) {
  console.error(`\nFAILED — ${problems.length} problem(s):`);
  problems.slice(0, 25).forEach((p) => console.error('  · ' + p));
  if (problems.length > 25) console.error(`  · …and ${problems.length - 25} more`);
  process.exit(1);
}
console.log('validate-keep-track: OK');
