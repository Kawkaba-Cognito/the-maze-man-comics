/*
 * validate:storyq — Kawkab's questions must have exactly one right answer.
 *
 * Story Time's retrieval half is GENERATED: six kinds of question derived from
 * whichever story was dealt, in either language, at any level. That is the only
 * way 45 stories get questions at all — nobody keeps 270 authored items correct
 * in two languages — but a generator fails in ways an author does not:
 *
 *   · two options that are both right (a "where" distractor that happens to be
 *     the same place; a "what came next" lure identical to the true next scene,
 *     which real stories DO contain — several repeat a place, cast and action
 *     exactly)
 *   · a "did you see this scene?" lure that accidentally shows a real scene
 *     while the answer says it never happened
 *   · a prompt that names scene 3 while the answer belongs to scene 4
 *   · a count question whose answer is the whole story or none of it, so it can
 *     be answered without remembering anything
 *
 * None of those are visible from playing one round, and all of them make a level
 * unwinnable-by-design rather than hard. So this gate re-derives every answer
 * from the beats independently of the generator, the way validate:sort
 * enumerates card splits instead of trusting the author.
 *
 * It also checks the LEVEL CURVE the way audit:curves would, plus the thing
 * audit:curves cannot see: that every difficulty asks the number of questions it
 * promises, on every story in the bank.
 */
import { STORIES } from '../src/features/training/domains/memory/games/story-grid/stories.js';
import {
  BACKGROUNDS, LADDER, LADDER_LEVELS, CHAR_IDS, Q_STR,
  buildQuestions, levelCfg, levelPassed, makeStory, passCfg, survivalCfg,
} from '../src/features/training/domains/memory/games/story-grid/data.js';
import { mulberry32 } from '../src/lib/rng.js';

const problems = [];
const push = (m) => problems.push(m);
let checked = 0;

const sameCast = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const samePanel = (a, b) => a.bg === b.bg && a.action === b.action && sameCast(a.chars, b.chars);
const sig = (o) => (o.kind === 'panel' ? `p:${o.panel.bg}|${[...o.panel.chars].sort().join(',')}|${o.panel.action}`
  : o.kind === 'face' ? `f:${[...o.value].sort().join(',')}`
    : `${o.kind}:${o.value}`);

/* ── one question, re-derived from the story ───────────────────────────── */
function checkQuestion(q, story, where) {
  const at = `${where} ${q.kind}`;
  const beats = story.target;
  const len = beats.length;

  if (!q.options || q.options.length < 2) { push(`${at}: fewer than 2 options`); return; }
  if (!(q.answer >= 0 && q.answer < q.options.length)) { push(`${at}: answer index ${q.answer} out of range`); return; }
  for (const lang of ['en', 'ar']) {
    const p = q.prompt?.[lang];
    if (typeof p !== 'string' || !p.trim()) push(`${at}: empty ${lang} prompt`);
  }
  const seen = new Set();
  for (const o of q.options) {
    const s = sig(o);
    if (seen.has(s)) push(`${at}: duplicate option ${s}`);
    seen.add(s);
  }

  // `right` answers "is this option correct?" from the beats alone. Exactly one
  // option may satisfy it, and it must be the one the generator flagged.
  let right;
  switch (q.kind) {
    case 'place': {
      if (!(q.beat >= 0 && q.beat < len)) { push(`${at}: beat ${q.beat} out of range`); return; }
      // the prompt must name the scene the answer belongs to
      const expect = q.beat === 0 ? Q_STR.place.first : q.beat === len - 1 ? Q_STR.place.last
        : { en: Q_STR.place.mid.en(q.beat + 1), ar: Q_STR.place.mid.ar(q.beat + 1) };
      if (q.prompt.en !== expect.en) push(`${at}: prompt "${q.prompt.en}" does not name scene ${q.beat + 1}`);
      right = (o) => o.kind === 'place' && o.value === beats[q.beat].bg;
      for (const o of q.options) if (!BACKGROUNDS[o.value]) push(`${at}: unknown place ${o.value}`);
      break;
    }
    case 'who': {
      if (!(q.beat >= 0 && q.beat < len)) { push(`${at}: beat ${q.beat} out of range`); return; }
      const expect = q.beat === 0 ? Q_STR.who.first : q.beat === len - 1 ? Q_STR.who.last
        : { en: Q_STR.who.mid.en(q.beat + 1), ar: Q_STR.who.mid.ar(q.beat + 1) };
      if (q.prompt.en !== expect.en) push(`${at}: prompt "${q.prompt.en}" does not name scene ${q.beat + 1}`);
      right = (o) => o.kind === 'face' && sameCast(o.value, beats[q.beat].chars);
      for (const o of q.options) {
        if (!o.value.length) push(`${at}: empty cast option`);
        for (const c of o.value) if (!CHAR_IDS.includes(c)) push(`${at}: unknown character ${c}`);
      }
      break;
    }
    case 'next': {
      if (!(q.beat >= 0 && q.beat < len - 1)) { push(`${at}: beat ${q.beat} cannot have a "next"`); return; }
      if (!q.ref || !samePanel(q.ref, beats[q.beat])) push(`${at}: reference panel is not scene ${q.beat + 1}`);
      right = (o) => o.kind === 'panel' && samePanel(o.panel, beats[q.beat + 1]);
      // every option must be a scene that really happened somewhere in the story
      for (const o of q.options) {
        if (!beats.some((b) => samePanel(b, o.panel))) push(`${at}: option is not a real scene`);
      }
      break;
    }
    case 'first': {
      const [a, b] = [q.beat, q.other];
      if (!(a >= 0 && b > a && b < len)) { push(`${at}: bad pair ${a},${b}`); return; }
      right = (o) => o.kind === 'panel' && samePanel(o.panel, beats[a]);
      if (samePanel(beats[a], beats[b])) push(`${at}: the two scenes are identical — unanswerable`);
      break;
    }
    case 'count': {
      const withCompany = beats.filter((b) => b.chars.length > 1).length;
      const places = new Set(beats.map((b) => b.bg)).size;
      const truth = q.variant === 'cast' ? withCompany : places;
      if (q.variant === 'cast' && (withCompany === 0 || withCompany === len)) {
        push(`${at}: cast variant on a story where the answer is none/all — answerable without memory`);
      }
      if (q.prompt.en !== (q.variant === 'cast' ? Q_STR.countCast.en : Q_STR.countPlace.en)) {
        push(`${at}: prompt does not match variant ${q.variant}`);
      }
      right = (o) => o.kind === 'num' && o.value === truth;
      break;
    }
    case 'lure': {
      const real = beats.some((b) => samePanel(b, q.ref));
      if (q.real !== real) push(`${at}: flagged real=${q.real} but the scene ${real ? 'IS' : 'is NOT'} in the story`);
      right = (o) => o.kind === 'bool' && o.value === real;
      if (q.options.length !== 2) push(`${at}: lure must be a yes/no`);
      break;
    }
    default:
      push(`${at}: unknown question kind`);
      return;
  }

  const correct = q.options.map((o, i) => (right(o) ? i : -1)).filter((i) => i >= 0);
  if (correct.length === 0) push(`${at}: NO option is correct`);
  else if (correct.length > 1) push(`${at}: ${correct.length} options are correct (${correct.join(',')})`);
  else if (correct[0] !== q.answer) push(`${at}: answer says ${q.answer}, the beats say ${correct[0]}`);
  checked += 1;
}

/* ── every story, one level per BAND, many seeds ────────────────────────
 * On the LADDER since 2026-08-28: one level sampled from each band, plus the
 * top, rather than five levels of each of three tiers. */
const LEVELS = [...LADDER.map((_, b) => b * (LADDER_LEVELS / LADDER.length) + 1), LADDER_LEVELS];
const SEEDS_PER_STORY = 12;

for (const story of STORIES) {
  const len = story.beats.length;
  {
    for (const level of LEVELS) {
      const cfg = levelCfg(level);
      for (let s = 0; s < SEEDS_PER_STORY; s++) {
        const rng = mulberry32(story.id.length * 7919 + s * 104729 + level);
        // deal THIS story rather than a random one, so the bank is covered
        const dealt = makeStory(len, rng, [], [story]);
        const qs = buildQuestions(dealt, rng, cfg);
        const where = `${story.id} L${level} seed${s}:`;
        if (qs.length !== cfg.questions) {
          push(`${where} asked ${qs.length} questions, the curve promises ${cfg.questions}`);
        }
        for (const q of qs) checkQuestion(q, dealt, where);
        /* The guessing floor the curve promises must actually be offered — but
         * a question can only offer as many options as the story has material
         * for. A "what came next" draws from the other scenes (len-1 of them),
         * and "which came first" is a pair by definition. Cap the expectation
         * rather than the check, so a real shortfall still fails. */
        const distinctScenes = new Set(dealt.target.map((b) => sig({ kind: 'panel', panel: b }))).size;
        for (const q of qs) {
          if (q.kind === 'lure' || q.kind === 'first') continue;
          // `winning-goal` plays the identical park scene twice, so its four
          // beats are only three distinct panels — DISTINCT is the ceiling, not
          // the beat count.
          const ceiling = q.kind === 'next' ? distinctScenes - 1 : q.kind === 'count' ? len : cfg.opts;
          const want = Math.min(cfg.opts, ceiling);
          if (q.options.length < want) push(`${where} ${q.kind} offered ${q.options.length} options, curve says ${want}`);
        }
      }
    }
  }
}

/* ── survival and pass n play deal from the same generator ─────────────── */
for (let stage = 0; stage < 24; stage++) {
  const cfg = survivalCfg(stage);
  const rng = mulberry32(4242 + stage);
  const story = makeStory(cfg.len, rng, []);
  const qs = buildQuestions(story, rng, cfg);
  if (qs.length !== cfg.questions) push(`survival stage ${stage}: ${qs.length} questions, expected ${cfg.questions}`);
  qs.forEach((q) => checkQuestion(q, story, `survival stage ${stage}:`));
}
{
  const cfg = passCfg();
  const a = mulberry32(999);
  const b = mulberry32(999);
  const sa = makeStory(cfg.len, a, []);
  const sb = makeStory(cfg.len, b, []);
  const qa = buildQuestions(sa, a, cfg);
  const qb = buildQuestions(sb, b, cfg);
  if (sa.id !== sb.id) push('pass n play: the same seed dealt two different stories');
  if (JSON.stringify(qa) !== JSON.stringify(qb)) push('pass n play: the same seed asked different questions');
}

/* ── the curve: monotone across the whole ladder ────────────────────────
 * The old cross-tier half of this check ("hard must beat med at the same level
 * number") retired with the tiers — there is one climb now, so monotonicity
 * across it says the same thing and says it at every level rather than every
 * ninth. The band-level rules (no inert band) live in `audit:curves`. */
const FIELDS = { len: 'up', questions: 'up', opts: 'up', memoPerPanel: 'down' };
for (const [field, dir] of Object.entries(FIELDS)) {
  let prev = null;
  for (let lv = 1; lv <= LADDER_LEVELS; lv++) {
    const v = levelCfg(lv)[field];
    if (prev != null && ((dir === 'up' && v < prev) || (dir === 'down' && v > prev))) {
      push(`curve: ${field} goes ${dir === 'up' ? 'DOWN' : 'UP'} at level ${lv} (${prev} → ${v})`);
    }
    prev = v;
  }
}

/* ── the pass rule ────────────────────────────────────────────────────── */
if (levelPassed(6, 6) !== true) push('pass rule: a perfect round must pass');
if (levelPassed(5, 6) !== true) push('pass rule: one miss out of six should be forgiven');
if (levelPassed(4, 6) !== false) push('pass rule: two misses out of six must not pass');
if (levelPassed(3, 4) !== false) push('pass rule: a four-question round must be perfect');
if (levelPassed(4, 4) !== true) push('pass rule: a perfect four-question round must pass');

/* ── self-test: the gate must fail on a known-bad question ────────────────
 * A checker that has stopped firing passes everything, which is worse than no
 * checker at all (see audit:consistency's look rules). So break one on purpose.
 */
{
  const before = problems.length;
  const rng = mulberry32(1);
  const story = makeStory(5, rng, []);
  const q = buildQuestions(story, rng, { questions: 4, opts: 3 }).find((x) => x.kind === 'place');
  if (!q) push('self-test: could not build a place question to break');
  else {
    const broken = { ...q, answer: (q.answer + 1) % q.options.length };
    checkQuestion(broken, story, 'self-test:');
    if (problems.length === before) push('SELF-TEST FAILED: a wrong answer index was accepted');
    else problems.splice(before); // the planted failure is expected — drop it
  }
}

if (problems.length) {
  // One generator bug shows up thousands of times — group by the FAULT, with a
  // count and one example each, or the real list is buried under repeats.
  const groups = new Map();
  for (const p of problems) {
    const key = p.replace(/^[a-z0-9-]+ [a-z]+\/L\d+ seed\d+: /, '').replace(/\d+/g, 'N');
    if (!groups.has(key)) groups.set(key, { n: 0, example: p });
    groups.get(key).n += 1;
  }
  console.error(`validate:storyq FAILED — ${problems.length} problem(s) in ${groups.size} kind(s)\n`);
  for (const [key, g] of [...groups.entries()].sort((a, b) => b[1].n - a[1].n)) {
    console.error(`  · ×${g.n}  ${key}`);
    console.error(`      e.g. ${g.example}`);
  }
  process.exit(1);
}
console.log(`validate:storyq OK — ${checked} generated questions re-derived from the beats across ${STORIES.length} stories, plus the curve, the pass rule and the self-test.`);
