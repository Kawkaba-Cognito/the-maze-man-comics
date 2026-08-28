/*
 * validate:liars — every Detective case must be fair, and its answer must be
 * re-derivable from the statements alone.
 *
 * Detective Kawkab is now fully GENERATED: a case is dealt at runtime from a
 * statement kit, a rule and a question. That buys infinite content and costs
 * the thing an authored case gave for free — a human having read it. A
 * generator fails in ways an author does not:
 *
 *   · a case with no consistent world at all (unanswerable, looks fine)
 *   · a case with several worlds where the question has different answers in
 *     each (ambiguous, and the player is told they are wrong for being right)
 *   · a "how many are lying" question under a rule that already announces the
 *     count (answerable without reading a single statement)
 *   · a "tap everyone innocent" question where nobody, or everybody, is
 *     provably innocent
 *   · a `who` question where the statements do not narrow anything and the
 *     answer is a 1-in-N guess
 *
 * None of these are visible from playing a round — you would simply lose and
 * assume you had reasoned badly. So this re-derives every answer with an
 * INDEPENDENT check rather than trusting the generator's own verdict, the way
 * validate:storyq re-derives Story Time's questions from the story beats.
 *
 * It also asserts the difficulty curve, the pass rule, and that the generator
 * actually reaches the variety the design claims — a ladder that silently
 * emits the same question type every time is the boredom bug, and it would
 * pass every other check here.
 */
import {
  LADDER, CASES_PER_LEVEL, LADDER_LEVELS, QUESTION_KINDS,
  answerFor, buildCase, evalStatement, levelCfg, levelPassed, passCfg,
  ruleHolds, scoreClearAll, solveWorlds, survivalCfg,
} from '../src/features/training/domains/reasoning/games/detective/data.js';
import { mulberry32 } from '../src/lib/rng.js';

const problems = [];
const push = (m) => problems.push(m);
let checked = 0;

/* ── an independent solver, written against the model rather than reusing the
   game's own, so a bug in solveWorlds cannot hide behind itself ───────────── */
function independentWorlds(c) {
  const out = [];
  const n = c.people.length;
  for (const thief of c.people) {
    if (c.evidence) {
      const has = (c.traits?.[thief] || []).includes(c.evidence.trait);
      if (c.evidence.polarity === 'not' ? has : !has) continue;
    }
    for (let m = 0; m < (1 << n); m++) {
      const truth = new Set();
      for (let i = 0; i < n; i++) if (m & (1 << i)) truth.add(c.people[i]);
      const world = { thief, truth };
      if (!ruleHolds(c.rule, world, { people: c.people })) continue;
      let ok = true;
      for (const s of c.says) {
        if (evalStatement(s, world, { people: c.people, traits: c.traits }) !== truth.has(s.by)) { ok = false; break; }
      }
      if (ok) out.push(world);
    }
  }
  return out;
}

function checkCase(c, where) {
  checked += 1;
  const q = c.question;
  const at = `${where} [${q.kind}]`;

  // structure
  if (!c.people.length || c.says.length !== c.people.length) { push(`${at}: ${c.says.length} statements for ${c.people.length} suspects`); return; }
  if (new Set(c.people).size !== c.people.length) push(`${at}: a suspect appears twice`);
  for (const s of c.says) {
    if (!c.people.includes(s.by)) push(`${at}: statement by ${s.by}, who is not in the line-up`);
    if (s.about && !c.people.includes(s.about) && s.kind !== 'traitClaim') push(`${at}: ${s.kind} about ${s.about}, who is not in the line-up`);
    if (s.about && s.about === s.by && !['selfClear', 'selfAccuse'].includes(s.kind)) push(`${at}: ${s.kind} pointing at its own speaker`);
  }

  // the solver's worlds must match an independent enumeration
  const mine = independentWorlds(c);
  const sig = (ws) => ws.map((w) => w.thief + ':' + [...w.truth].sort().join('')).sort().join('|');
  if (sig(mine) !== sig(c.worlds)) { push(`${at}: solver disagrees with the independent enumeration`); return; }
  if (!mine.length) { push(`${at}: NO consistent world — unanswerable`); return; }

  // the answer must be re-derivable and match
  const ans = answerFor(q, mine, c);
  if (ans == null) { push(`${at}: the question has no determinate answer`); return; }
  if (ans !== c.answer) { push(`${at}: answer says "${c.answer}", the statements say "${ans}"`); return; }

  // per-question sanity
  if (q.kind === 'who') {
    const thieves = new Set(mine.map((w) => w.thief));
    if (thieves.size !== 1) push(`${at}: "who did it" with ${thieves.size} possible thieves`);
  }
  if (q.kind === 'count') {
    if (c.rule.kind === 'exactlyLies' || c.rule.kind === 'exactlyTrue') {
      push(`${at}: counting liars under a rule that already states the count`);
    }
  }
  if (q.kind === 'clearAll') {
    const cleared = ans.split(',').filter(Boolean);
    if (!cleared.length) push(`${at}: nobody can be cleared — nothing to tap`);
    if (cleared.length >= c.people.length) push(`${at}: everybody can be cleared — no thief left`);
    // every cleared suspect really is innocent in every world
    for (const p of cleared) {
      if (mine.some((w) => w.thief === p)) push(`${at}: ${p} listed as cleared but is a possible thief`);
    }
  }
  if (q.kind === 'verdict') {
    if (!c.people.includes(q.about)) push(`${at}: verdict asked about a non-suspect`);
    if (!['yes', 'no', 'unknown'].includes(ans)) push(`${at}: verdict answer "${ans}" is not yes/no/unknown`);
    const some = mine.some((w) => w.thief === q.about);
    const all = mine.every((w) => w.thief === q.about);
    const expect = all ? 'yes' : some ? 'unknown' : 'no';
    if (ans !== expect) push(`${at}: verdict says ${ans}, worlds say ${expect}`);
  }
  if (q.kind === 'key') {
    const s = c.says[q.about];
    if (!s) { push(`${at}: key statement index ${q.about} out of range`); return; }
    // it really must pin the thief alone…
    const alone = solveWorlds({ ...c, says: [s] });
    if (!alone.length || answerFor({ kind: 'who' }, alone, c) == null) push(`${at}: the "key" statement does not name the thief on its own`);
    // …and be the only one that does
    let others = 0;
    c.says.forEach((o, i) => {
      if (i === q.about) return;
      const w = solveWorlds({ ...c, says: [o] });
      if (w.length && answerFor({ kind: 'who' }, w, c) != null) others += 1;
    });
    if (others) push(`${at}: ${others + 1} statements each name the thief alone — "the key" is ambiguous`);
  }
}

/* ── ONE LADDER since 2026-08-28: both edges of every band, many seeds ── */
const LEVELS = LADDER.flatMap((_, b) => [b * 10 + 1, b * 10 + 10]);
const SEEDS = 26;
const seen = { question: new Map(), rule: new Map(), statement: new Map() };
const bump = (map, k) => map.set(k, (map.get(k) || 0) + 1);

{
  const diff = 'L';
  for (const level of LEVELS) {
    const cfg = levelCfg(level);
    let built = 0;
    for (let s = 0; s < SEEDS; s++) {
      const rng = mulberry32(level * 7919 + s * 104729);
      for (let k = 0; k < CASES_PER_LEVEL; k++) {
        const c = buildCase(rng, cfg);
        if (!c) continue;
        built += 1;
        bump(seen.question, c.question.kind);
        bump(seen.rule, c.rule.kind);
        c.says.forEach((st) => bump(seen.statement, st.kind));
        checkCase(c, `${diff} L${level} seed${s}`);
      }
    }
    // a config that cannot deal a case is a dead level, however sound the logic
    const want = SEEDS * CASES_PER_LEVEL;
    if (built < want * 0.9) push(`${diff} L${level}: only ${built}/${want} cases could be dealt`);
  }
}

/* ── survival and pass n play ─────────────────────────────────────────── */
for (let stage = 0; stage < 30; stage += 1) {
  const cfg = survivalCfg(stage);
  const rng = mulberry32(4242 + stage);
  const c = buildCase(rng, cfg);
  if (!c) { push(`survival stage ${stage}: no case could be dealt`); continue; }
  checkCase(c, `survival ${stage}`);
}
{
  const cfg = passCfg();
  const a = mulberry32(777);
  const b = mulberry32(777);
  const ca = buildCase(a, cfg);
  const cb = buildCase(b, cfg);
  if (!ca || !cb) push('pass n play: no case could be dealt');
  else if (JSON.stringify({ ...ca, worlds: null }) !== JSON.stringify({ ...cb, worlds: null })) {
    push('pass n play: the same seed dealt two different cases');
  }
}

/* ── VARIETY: the anti-boredom assertion ──────────────────────────────────
 * The whole reason this game replaced the old Detective is that a fast case
 * has to stay fresh. A generator that technically works but emits `who` every
 * time would pass every check above and still be the bug.
 */
{
  const qKinds = [...seen.question.keys()];
  if (qKinds.length < QUESTION_KINDS.length) {
    const missing = QUESTION_KINDS.filter((k) => !seen.question.has(k));
    push(`variety: question kind(s) never appeared anywhere: ${missing.join(', ')}`);
  }
  /* The TOP OF THE LADDER must actually deal every shape it allows. This is the
   * check that caught the real bug: with unweighted selection `key` came up in
   * 0.7% of hard cases and `who` in 8%, because verdict/clearAll accept almost
   * any dealt case while `who` needs a single consistent world. */
  {
    const cfg = levelCfg(LADDER_LEVELS);
    const mix = new Map();
    for (let i = 0; i < 240; i++) {
      const c = buildCase(mulberry32(i * 31337 + 7), cfg);
      if (c) mix.set(c.question.kind, (mix.get(c.question.kind) || 0) + 1);
    }
    for (const k of cfg.questions) {
      const share = (mix.get(k) || 0) / 240;
      if (share < 0.03) push(`variety: L${LADDER_LEVELS} deals "${k}" only ${Math.round(share * 100)}% of the time — allowed but effectively absent`);
    }
    const top = [...mix.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] / 240 > 0.45) push(`variety: L${LADDER_LEVELS} is ${Math.round(top[1] / 240 * 100)}% "${top[0]}" — one shape is swamping the top of the ladder`);
  }
  const rKinds = [...seen.rule.keys()];
  if (rKinds.length < 4) push(`variety: only ${rKinds.length} rule kinds ever appeared (${rKinds.join(', ')})`);
  const sKinds = [...seen.statement.keys()];
  if (sKinds.length < 9) push(`variety: only ${sKinds.length} statement kinds ever appeared (${sKinds.join(', ')})`);
  // and no single question kind may swamp the rest
  const totalQ = [...seen.question.values()].reduce((a, b) => a + b, 0);
  for (const [k, n] of seen.question) {
    if (n / totalQ > 0.55) push(`variety: "${k}" is ${Math.round(n / totalQ * 100)}% of all cases — the ladder is lopsided`);
  }
}

/* ── the curve ────────────────────────────────────────────────────────── */
{
  {
    let prev = null;
    for (let lv = 1; lv <= LADDER_LEVELS; lv++) {
      const c = levelCfg(lv);
      if (prev) {
        if (c.suspects < prev.suspects) push(`curve: L${lv} suspects fell (${prev.suspects} → ${c.suspects})`);
        if (c.kit.length < prev.kit.length) push(`curve: L${lv} statement kit shrank`);
        if (c.questions.length < prev.questions.length) push(`curve: L${lv} question pool shrank`);
        if (c.evidenceChance < prev.evidenceChance - 1e-9) push(`curve: L${lv} evidence chance fell`);
        /* A band may only ADD to the kit and the question pool — a superset
           check, not a length check. A band that swapped one statement type for
           another would keep the count identical and quietly remove something
           the player had already learned to read. */
        for (const k of prev.kit) if (!c.kit.includes(k)) push(`curve: L${lv} dropped statement type "${k}"`);
        for (const q of prev.questions) if (!c.questions.includes(q)) push(`curve: L${lv} dropped question kind "${q}"`);
      }
      prev = c;
    }
  }
}

/* ── the pass rule and partial credit ─────────────────────────────────── */
if (levelPassed(4, 4) !== true) push('pass rule: a perfect level must pass');
if (levelPassed(3, 4) !== true) push('pass rule: one miss out of four should be forgiven');
if (levelPassed(2, 4) !== false) push('pass rule: two misses out of four must not pass');
{
  const s = scoreClearAll(new Set(['lola', 'ramy']), 'lola,ramy');
  if (!s.ok || s.hits !== 2 || s.falseAlarms !== 0) push('scoreClearAll: an exact answer must score clean');
  const t = scoreClearAll(new Set(['lola']), 'lola,ramy');
  if (t.ok || t.misses !== 1) push('scoreClearAll: a missed suspect must not pass');
  const u = scoreClearAll(new Set(['lola', 'star']), 'lola');
  if (u.ok || u.falseAlarms !== 1) push('scoreClearAll: a false alarm must not pass');
}

/* ── self-test: the gate must fail on a case we break on purpose ─────────
 * A checker that has stopped firing passes everything, which is worse than no
 * checker at all.
 */
{
  const before = problems.length;
  const rng = mulberry32(11);
  const c = buildCase(rng, levelCfg(25));
  if (!c) push('self-test: could not build a case to break');
  else {
    const other = c.people.find((p) => p !== c.answer) || c.people[0];
    checkCase({ ...c, answer: other }, 'self-test');
    if (problems.length === before) push('SELF-TEST FAILED: a wrong answer was accepted');
    else problems.splice(before);
  }
}

/* ── report ───────────────────────────────────────────────────────────── */
if (problems.length) {
  const groups = new Map();
  for (const p of problems) {
    const key = p.replace(/^[a-z]+ L?\d+ seed\d+ /, '').replace(/^survival \d+ /, '').replace(/\d+/g, 'N');
    if (!groups.has(key)) groups.set(key, { n: 0, example: p });
    groups.get(key).n += 1;
  }
  console.error(`validate:liars FAILED — ${problems.length} problem(s) in ${groups.size} kind(s)\n`);
  for (const [key, g] of [...groups.entries()].sort((a, b) => b[1].n - a[1].n)) {
    console.error(`  · ×${g.n}  ${key}`);
    console.error(`      e.g. ${g.example}`);
  }
  process.exit(1);
}
const qSummary = [...seen.question.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · ');
console.log(`validate:liars OK — ${checked} generated cases re-solved independently.`);
console.log(`  questions: ${qSummary}`);
console.log(`  rules: ${[...seen.rule.keys()].join(', ')}`);
console.log(`  statements: ${[...seen.statement.keys()].join(', ')}`);
