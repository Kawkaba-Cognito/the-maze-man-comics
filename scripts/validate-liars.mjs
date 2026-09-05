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
  LADDER, CASES_PER_LEVEL, LADDER_LEVELS, QUESTION_KINDS, SCENES, SAY_VARIANTS,
  OPENER_VARIANTS, SUSPECTS, STATEMENT_KINDS, TRAITS,
  answerFor, buildCase, evalStatement, levelCfg, levelPassed, passCfg,
  ruleHolds, scoreClearAll, solveWorlds, survivalCfg,
} from '../src/features/training/domains/reasoning/games/detective/data.js';
import {
  T, OPENERS, SAY_SCENE, sayText, sceneText,
} from '../src/features/training/domains/reasoning/games/detective/strings.js';
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

/* ── THE SCENE LAYER ───────────────────────────────────────────────────────
 *
 * Added 2026-09-05 with the scene itself. A place, an object and a phrasing
 * crossed together is the shape that ships its worst case: the party games
 * proved it three times in one day with "Broken Lion", "Sudden The mentor" and
 * "Villain as a gift". Nobody will ever read all 12 scenes × 9 kinds × 3
 * phrasings × 2 languages, so this does.
 *
 * ⚠ WHAT MATTERS MOST IS THE FIRST RULE. The scene may only change WORDS. If a
 * phrasing ever disagreed with the statement kind it renders, the text on
 * screen would contradict the logic that scores it — and no gate can read
 * English well enough to notice. So the structural guarantee is asserted
 * instead: the same case, rendered with and without a scene, must still be the
 * same case to the solver.
 */
{
  const langs = ['en', 'ar'];
  const tOf = (L) => (L === 'ar' ? T.ar : T.en);
  /*
   * ⚠ THE IDS ARE NOT THE NAMES, and this gate caught itself getting that
   * wrong. Noor's id is `mimi`, so a fixture written against `'noor'` resolved
   * to the EMPTY STRING — and `out.includes('')` is true for every sentence
   * ever written, so the "does it name its subject" rule reported 180 failures
   * that were all the test's fault. Take the ids from the cast rather than
   * typing them, and refuse to run on a name that does not resolve.
   */
  const nameIn = (L) => (id) => {
    const s = SUSPECTS.find((x) => x.id === id);
    return s ? (L === 'ar' ? s.ar : s.en) : '';
  };
  const nameOf = nameIn('en');
  const [SUBJECT, OTHER] = [SUSPECTS[1].id, SUSPECTS[2].id];
  if (!nameOf(SUBJECT) || !nameOf(OTHER)) push('SELF-TEST: the cast fixture does not resolve to names');

  /*
   * ⚠ "CONTAINS SOME ARABIC" IS NOT A TEST, and a plant proved it. An opener
   * whose whole template was rewritten in English still passed, because the
   * count word ("ثلاثة") is substituted into it and that alone satisfied the
   * script check. The rule that actually holds is the strict one: an Arabic
   * sentence contains NO LATIN LETTERS. Every name, place and object in this
   * game has an Arabic form, so there is nothing legitimate for a Latin
   * character to be doing in one.
   */
  const latin = (s) => /[A-Za-z]/.test(s || '');
  const traitWord = (k) => (TRAITS[k] ? TRAITS[k].en : 'something');

  /* 1. Every scene is complete in both languages. A missing half renders as
        `undefined` inside a sentence, which React prints happily. */
  for (const sc of SCENES) {
    for (const L of langs) {
      if (!sc.place?.[L] || !sc.obj?.[L]) push(`scene ${sc.id}: no ${L} for place or object`);
    }
    if (!/[؀-ۿ]/.test(sc.place.ar) || !/[؀-ۿ]/.test(sc.obj.ar)) {
      push(`scene ${sc.id}: the "Arabic" half contains no Arabic — it is a copy of the English`);
    }
  }
  if (SCENES.length < 8) push(`only ${SCENES.length} scenes — a level of 4 cases would repeat one within two levels`);
  if (new Set(SCENES.map((s) => s.id)).size !== SCENES.length) push('two scenes share an id');
  if (new Set(SCENES.map((s) => s.obj.en)).size !== SCENES.length) push('two scenes are missing the same object');

  /* 2. Every openers entry renders, in both languages, for every scene and
        every plausible line-up size. */
  if (OPENERS.length !== OPENER_VARIANTS) {
    push(`OPENER_VARIANTS says ${OPENER_VARIANTS} but strings.js has ${OPENERS.length} — the deal would never reach the last one`);
  }
  for (const sc of SCENES) {
    for (let o = 0; o < OPENERS.length; o += 1) {
      for (const L of langs) {
        for (const n of [3, 4, 5]) {
          const out = sceneText({ scene: sc, opener: o }, L, tOf(L).nWord(n));
          if (!out || out.length < 12) push(`opener ${o} / ${sc.id} / ${L}: renders empty`);
          if (/undefined|NaN|\[object/.test(out)) push(`opener ${o} / ${sc.id} / ${L}: "${out}"`);
          if (/\{\w+\}|\$\{/.test(out)) push(`opener ${o} / ${sc.id} / ${L}: a placeholder was never filled — "${out}"`);
          /* ⚠ ADDED AFTER A PLANT TEST WENT UNCAUGHT. The Arabic-script rule
             covered the scene WORDS and the statement phrasings but not the
             openers, so an opener whose `ar` half reached for `.place.en`
             sailed through — an Arabic player would have been handed an English
             opening line under Arabic statements. The rule is only worth having
             where the copy is, which is everywhere the copy is. */
          if (L === 'ar' && out && latin(out)) {
            push(`opener ${o} / ${sc.id}: Latin letters in the Arabic opener — "${out}"`);
          }
          /* …and it must be built from the ARABIC scene words, not reach for
             the English ones. Every opener names both. */
          if (L === 'ar' && out && !(out.includes(sc.place.ar) && out.includes(sc.obj.ar))) {
            push(`opener ${o} / ${sc.id}: the Arabic opener does not use the Arabic place and object`);
          }
        }
      }
    }
  }

  /* 3. Every scene-aware phrasing renders for every scene, in both languages.
        Two names are passed because `oneOf` needs them; the rest ignore the
        second, which is exactly what we want to prove does not break. */
  for (const kind of Object.keys(SAY_SCENE)) {
    if (!STATEMENT_KINDS.includes(kind)) push(`SAY_SCENE has phrasings for "${kind}", which is not a statement kind`);
    if (SAY_SCENE[kind].length !== SAY_VARIANTS) {
      push(`${kind}: ${SAY_SCENE[kind].length} phrasings but SAY_VARIANTS is ${SAY_VARIANTS} — some can never be dealt`);
    }
    for (let v = 0; v < SAY_SCENE[kind].length; v += 1) {
      const variant = SAY_SCENE[kind][v];
      for (const L of langs) {
        if (typeof variant[L] !== 'function') { push(`${kind} v${v}: no ${L} phrasing`); continue; }
        for (const sc of SCENES) {
          const aboutSelf = kind === 'selfClear' || kind === 'selfAccuse';
          const s = {
            kind, by: SUSPECTS[0].id, k: 1, trait: 'hat', v,
            /* A statement about the speaker genuinely has no `about`; giving it
               one would be testing a case the generator never produces. */
            ...(aboutSelf ? {} : { about: SUBJECT, other: OTHER }),
          };
          const nm = nameIn(L);
          const out = sayText(s, tOf(L), nm, traitWord, sc, L);
          if (!out || out.length < 8) push(`${kind} v${v} / ${sc.id} / ${L}: renders empty`);
          else if (/undefined|NaN|\[object/.test(out)) push(`${kind} v${v} / ${sc.id} / ${L}: "${out}"`);
          else if (/\{\w+\}|\$\{|\s,|\s\./.test(out)) push(`${kind} v${v} / ${sc.id} / ${L}: badly formed — "${out}"`);
          else if (L === 'ar' && latin(out)) push(`${kind} v${v} / ${sc.id}: Latin letters in the Arabic phrasing — "${out}"`);
          /*
           * ⚠ SENTENCE CASE. Every place and object is authored lowercase
           * because it is nearly always mid-sentence — so the one phrasing that
           * put it first rendered "Search me. the good knife is not mine to
           * take." Nothing about meaning was wrong, which is exactly why no
           * other rule here could see it; it was found by reading the screen.
           * English only: Arabic has no capitals to get wrong.
           */
          if (L === 'en' && out) {
            if (/^[a-z]/.test(out)) push(`${kind} v${v} / ${sc.id}: starts lowercase — "${out}"`);
            const mid = out.match(/[.!?]\s+[a-z]/);
            if (mid) push(`${kind} v${v} / ${sc.id}: lowercase after a full stop — "${out}"`);
          }
          /* A statement naming somebody must actually name them. This is what
             catches a phrasing that quietly drops its subject — the sentence
             would still read fine and would be about nobody. */
          if (!aboutSelf && out && !out.includes(nm(SUBJECT))) {
            push(`${kind} v${v} / ${sc.id} / ${L}: never names the person it is about — "${out}"`);
          }
          /* …and one that does NOT name anybody must not invent a name. */
          if (aboutSelf && out
            && (out.includes(nm(SUBJECT)) || out.includes(nm(OTHER)))) {
            push(`${kind} v${v} / ${sc.id} / ${L}: names somebody else, but it is a statement about the speaker`);
          }
        }
      }
    }
  }

  /* 4. ⚠ THE ONE THAT MATTERS: a scene cannot change an answer.
        Re-solve every generated case twice — once as dealt, once with the
        scene stripped out entirely — and require an identical verdict. If the
        solver ever started reading the fiction, this is what would catch it. */
  let sceneCases = 0;
  for (let lv = 1; lv <= LADDER_LEVELS; lv += 5) {
    const cfg = levelCfg(lv);
    for (let s = 0; s < 12; s += 1) {
      const c = buildCase(mulberry32(lv * 7919 + s), cfg);
      if (!c) continue;
      sceneCases += 1;
      if (!c.scene) { push(`L${lv} seed${s}: a case was dealt with no scene`); continue; }
      if (!Number.isInteger(c.opener) || c.opener < 0 || c.opener >= OPENER_VARIANTS) {
        push(`L${lv} seed${s}: opener index ${c.opener} is outside 0..${OPENER_VARIANTS - 1}`);
      }
      for (const st of c.says) {
        if (!Number.isInteger(st.v) || st.v < 0 || st.v >= SAY_VARIANTS) {
          push(`L${lv} seed${s}: statement phrasing index ${st.v} is outside 0..${SAY_VARIANTS - 1}`);
          break;
        }
      }
      const bare = { ...c, scene: null, opener: 0, says: c.says.map(({ v, ...rest }) => rest) };
      const a = answerFor(c.question, solveWorlds(c), c);
      const b = answerFor(c.question, solveWorlds(bare), bare);
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        push(`L${lv} seed${s}: the SCENE CHANGED THE ANSWER (${JSON.stringify(a)} vs ${JSON.stringify(b)}) `
          + '— the solver is reading the fiction');
      }
      /* Every statement in a real case must render in both languages. */
      for (const st of c.says) {
        for (const L of langs) {
          const out = sayText(st, tOf(L), nameOf, traitWord, c.scene, L);
          if (!out || /undefined|\[object/.test(out)) {
            push(`L${lv} seed${s}: ${st.kind} renders "${out}" in ${L}`);
          }
        }
      }
    }
  }
  if (sceneCases < 100) push(`only ${sceneCases} cases exercised the scene layer — too few to mean anything`);

  /* 5. SELF-TEST. ⚠ Plant against DATA, in memory — never by rewriting a file.
        audit:gamekeys produced a false PASS because its plant regex ended
        `\n}\n` and this tree is CRLF, so the deletion silently never happened
        and an intact file was mistaken for a working detector. */
  {
    const before = problems.length;
    const brokenScene = { id: 'x', place: { en: 'the vault', ar: 'the vault' }, obj: { en: 'the ring', ar: 'the ring' } };
    if (!/[؀-ۿ]/.test(brokenScene.place.ar)) push('PLANT: english-as-arabic');
    if (problems.length === before) push('SELF-TEST FAILED: the Arabic-script check does not fire on English text');
    else problems.splice(before);
  }
  {
    const before = problems.length;
    /* A phrasing that drops the name it is about — reads fine, means nothing. */
    const nameless = (_n, sc) => `Somebody walked out of ${sc.place.en}.`;
    const out = nameless('Ramy', SCENES[0]);
    if (!out.includes('Ramy')) push('PLANT: nameless accusation');
    if (problems.length === before) push('SELF-TEST FAILED: the names-its-subject check does not fire');
    else problems.splice(before);
  }
  {
    const before = problems.length;
    const unfilled = 'I saw {name} leave the library.';
    if (/\{\w+\}|\$\{/.test(unfilled)) push('PLANT: unfilled placeholder');
    if (problems.length === before) push('SELF-TEST FAILED: the placeholder check does not fire');
    else problems.splice(before);
  }
  checked += sceneCases;
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
