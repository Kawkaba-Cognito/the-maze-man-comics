/*
 * DETECTIVE KAWKAB — Liars' Ring engine.
 *
 * Replaced the five-minute noir investigation on 2026-08-17. That version was
 * a search-the-scene / interrogate / build-a-proof-chain adventure: authored
 * cases, ~40 files, and no way to generate or verify a new one. This is the
 * opposite — a case is a handful of statements under a stated rule, solved in
 * under a minute, generated infinitely and checked by a solver before the
 * player ever sees it.
 *
 * ── THE MODEL ────────────────────────────────────────────────────────────
 * A case is N suspects, exactly one of whom is the thief. Each suspect is
 * either a TRUTH-TELLER or a LIAR for the whole case, and makes one statement
 * whose truth value must agree with that status. A RULE constrains who tells
 * the truth. A WORLD is a consistent assignment of (thief, set-of-truth-tellers).
 *
 * The solver enumerates every world — 5 suspects is 5 × 2^5 = 160, trivial —
 * and the question is only asked if its answer is the same in every world. That
 * is stricter than "a solution exists" and looser than "exactly one world
 * exists", and it is the property the player actually relies on.
 *
 * ⚠ Two question types DELIBERATELY want ambiguous cases: `verdict` (is X
 * guilty? — yes / no / not enough evidence) and `clearAll` (tap everyone you
 * can PROVE innocent). Those exist because knowing when the evidence does not
 * decide is a real reasoning skill, and because a game where the answer is
 * always determinate teaches over-confidence. So the accept test is per
 * question type, not global — see `buildCase`.
 *
 * ⚠ Every import here must carry its explicit `.js`. Vite resolves
 * extensionless paths, plain Node does not, and `validate:liars` runs in Node.
 */
import {
  BAND_SIZE, ladderFraction, ladderStage, mechanicsAt,
} from '../../../../shared/difficulty.js';

/* ── CAST ─────────────────────────────────────────────────────────────────
 * Kawkab himself is the detective and never a suspect, so the suspect pool is
 * the five others. `cast2dUrl` in shared/cast2d.js serves the art.
 */
export const SUSPECTS = [
  { id: 'lola', en: 'Lola', ar: 'لولا' },
  { id: 'ramy', en: 'Ramy', ar: 'رامي' },
  { id: 'mimi', en: 'Noor', ar: 'نور' },
  { id: 'star', en: 'Star', ar: 'ستار' },
  { id: 'fadi', en: 'Fadi', ar: 'فادي' },
];
export const SUSPECT_IDS = SUSPECTS.map((s) => s.id);
export const nameOf = (id, lang) => {
  const s = SUSPECTS.find((x) => x.id === id);
  return s ? (lang === 'ar' ? s.ar : s.en) : '';
};

/* ── TRAITS ───────────────────────────────────────────────────────────────
 * Worn things, so a suspect card reads at a glance and physical evidence can
 * point at one. Evidence turns the puzzle from pure logic into a case: the
 * statements narrow the field, the boot-print settles it.
 */
export const TRAITS = {
  hat: { e: '🎩', en: 'a hat', ar: 'قبعة' },
  glasses: { e: '👓', en: 'glasses', ar: 'نظارة' },
  boots: { e: '🥾', en: 'muddy boots', ar: 'حذاءً موحلاً' },
  scarf: { e: '🧣', en: 'a scarf', ar: 'وشاحاً' },
  bag: { e: '🎒', en: 'a backpack', ar: 'حقيبة ظهر' },
  umbrella: { e: '☂️', en: 'an umbrella', ar: 'مظلة' },
};
export const TRAIT_IDS = Object.keys(TRAITS);

/* ── STATEMENT TYPES ──────────────────────────────────────────────────────
 * Grouped by what they let a player do, which is also the unlock order:
 *
 *   BLUNT     accuse · clear · selfClear · selfAccuse
 *             point at somebody, or at yourself. Matching, mostly.
 *   LINKED    together · oneOf
 *             tie two suspects to one truth value — one statement, two people.
 *   META      liar · honest · sameAs
 *             a statement ABOUT a statement. This is the jump from matching to
 *             logic: chains become possible ("if A is honest and A says B lies…").
 *   GLOBAL    countLiars · atLeastLiars
 *             refers to the whole board, including itself. Hardest to hold.
 *   PHYSICAL  traitClaim
 *             a claim about the thief's appearance, checkable against the
 *             line-up. Only offered when the suspects have visible traits.
 */
export const STATEMENT_KINDS = [
  'accuse', 'clear', 'selfClear', 'selfAccuse',
  'together', 'oneOf',
  'liar', 'honest', 'sameAs',
  'countLiars', 'atLeastLiars',
  'traitClaim',
];

/** Is this statement true, in this world? */
export function evalStatement(s, world, ctx) {
  const { thief, truth } = world;
  const { people, traits } = ctx;
  switch (s.kind) {
    case 'accuse': return thief === s.about;
    case 'clear': return thief !== s.about;
    case 'selfClear': return thief !== s.by;
    case 'selfAccuse': return thief === s.by;
    case 'together': return thief !== s.by && thief !== s.about;
    case 'oneOf': return thief === s.about || thief === s.other;
    case 'liar': return !truth.has(s.about);
    case 'honest': return truth.has(s.about);
    // "X and I are both honest, or both lying."
    case 'sameAs': return truth.has(s.by) === truth.has(s.about);
    case 'countLiars': return (people.length - truth.size) === s.k;
    case 'atLeastLiars': return (people.length - truth.size) >= s.k;
    case 'traitClaim': return !!(traits && (traits[thief] || []).includes(s.trait)) === (s.polarity !== 'not');
    default: return false;
  }
}

/* ── RULES ────────────────────────────────────────────────────────────────
 * `free` is the interesting one: no count is given, so the case is solved by
 * consistency alone. It makes cases rarer and harder, and it is the classic
 * knights-and-knaves form.
 */
export const RULE_KINDS = ['exactlyTrue', 'exactlyLies', 'atLeastTrue', 'knaves', 'invertedKnaves', 'free'];

export function ruleHolds(rule, world, ctx) {
  const { thief, truth } = world;
  const { people } = ctx;
  switch (rule.kind) {
    case 'exactlyTrue': return truth.size === rule.k;
    case 'exactlyLies': return (people.length - truth.size) === rule.k;
    case 'atLeastTrue': return truth.size >= rule.k;
    // the thief lies, everyone innocent tells the truth
    case 'knaves': return people.every((p) => truth.has(p) === (p !== thief));
    // …and its mirror: only the thief tells the truth. Devious, and it makes
    // a confession ("it was me") suddenly worth reading.
    case 'invertedKnaves': return people.every((p) => truth.has(p) === (p === thief));
    case 'free': return true;
    default: return true;
  }
}

/* ── SOLVER ───────────────────────────────────────────────────────────────
 * Brute force over every (thief, truth-set). N ≤ 5 → at most 160 worlds, each
 * checking N statements. Fast enough to run inside generation retries, which
 * is what lets the game guarantee fairness rather than hope for it.
 */
export function solveWorlds(c) {
  const { people, says, rule, evidence, traits } = c;
  const ctx = { people, traits };
  const out = [];
  const n = people.length;
  for (const thief of people) {
    // physical evidence is known-true, so it prunes the thief directly
    if (evidence && !evidenceAllows(evidence, thief, traits)) continue;
    for (let m = 0; m < (1 << n); m++) {
      const truth = new Set();
      for (let i = 0; i < n; i++) if (m & (1 << i)) truth.add(people[i]);
      const world = { thief, truth };
      if (!ruleHolds(rule, world, ctx)) continue;
      let ok = true;
      for (const s of says) {
        if (evalStatement(s, world, ctx) !== truth.has(s.by)) { ok = false; break; }
      }
      if (ok) out.push(world);
    }
  }
  return out;
}
function evidenceAllows(ev, thief, traits) {
  const has = (traits[thief] || []).includes(ev.trait);
  return ev.polarity === 'not' ? !has : has;
}

/* ── QUESTIONS ────────────────────────────────────────────────────────────
 * Seven shapes. Which one a case asks is drawn at random from the tier's pool,
 * so consecutive cases do not feel like the same puzzle wearing new names.
 *
 *   who       tap the thief
 *   liar      tap the one who is lying
 *   honest    tap the one telling the truth
 *   count     tap a number — how many are lying
 *   verdict   is X guilty?  yes / no / NOT ENOUGH EVIDENCE
 *   clearAll  tap everyone you can PROVE innocent (multi-select)
 *   key       tap the single statement that already names the thief by itself
 */
export const QUESTION_KINDS = ['who', 'liar', 'honest', 'count', 'verdict', 'clearAll', 'key'];

/*
 * How often each kind should come up, when the tier allows it.
 *
 * ⚠ These weights are load-bearing, not decoration. The first version simply
 * shuffled the allowed kinds and took the first one the dealt case could
 * support — and because `verdict` and `clearAll` accept almost any case while
 * `who` demands a single consistent world, the top tier came out 47% verdict,
 * 34% clearAll and only 8% `who`, with `key` at 0.7%. The mix was an accident
 * of which question was easiest to satisfy. `validate:liars` asserts the shape
 * of the mix so it cannot drift back.
 */
export const QUESTION_WEIGHT = {
  who: 30, verdict: 16, liar: 13, count: 12, clearAll: 11, honest: 9, key: 9,
};

/** The answer to `q` given every consistent world, or null if undetermined. */
export function answerFor(q, worlds, c) {
  if (!worlds.length) return null;
  const { people } = c;
  const uniq = (vals) => (vals.every((v) => v === vals[0]) ? vals[0] : null);
  switch (q.kind) {
    case 'who': return uniq(worlds.map((w) => w.thief));
    case 'liar': {
      const vals = worlds.map((w) => {
        const l = people.filter((p) => !w.truth.has(p));
        return l.length === 1 ? l[0] : null;
      });
      return vals.some((v) => v == null) ? null : uniq(vals);
    }
    case 'honest': {
      const vals = worlds.map((w) => {
        const h = people.filter((p) => w.truth.has(p));
        return h.length === 1 ? h[0] : null;
      });
      return vals.some((v) => v == null) ? null : uniq(vals);
    }
    case 'count': return uniq(worlds.map((w) => String(people.length - w.truth.size)));
    case 'verdict': {
      // yes = thief in EVERY world · no = in none · unknown = some but not all
      const some = worlds.some((w) => w.thief === q.about);
      const all = worlds.every((w) => w.thief === q.about);
      return all ? 'yes' : some ? 'unknown' : 'no';
    }
    case 'clearAll': {
      // provably innocent = not the thief in ANY consistent world
      const clear = people.filter((p) => worlds.every((w) => w.thief !== p));
      return clear.slice().sort().join(',');
    }
    case 'key': return q.about;
    default: return null;
  }
}

/* ── RNG HELPERS ───────────────────────────────────────────────────────── */
const shuffleR = (arr, rng) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const pickR = (arr, rng) => arr[Math.floor(rng() * arr.length)];
/** Shuffle by weight: heavier entries tend to come first, but any can. */
const weightedOrder = (arr, weights, rng) => {
  const pool = arr.map((k) => ({ k, w: Math.max(0.001, weights[k] || 1) }));
  const out = [];
  while (pool.length) {
    let total = 0;
    for (const p of pool) total += p.w;
    let r = rng() * total;
    let i = 0;
    while (i < pool.length - 1 && (r -= pool[i].w) > 0) i += 1;
    out.push(pool.splice(i, 1)[0].k);
  }
  return out;
};

/** Every statement `me` could make, given the kit and the cast. */
export function statementOptions(me, people, kit, traits) {
  const out = [];
  const others = people.filter((p) => p !== me);
  for (const kind of kit) {
    switch (kind) {
      case 'selfClear': out.push({ kind, by: me }); break;
      case 'selfAccuse': out.push({ kind, by: me }); break;
      case 'countLiars':
        for (let k = 0; k <= people.length; k++) out.push({ kind, k, by: me });
        break;
      case 'atLeastLiars':
        for (let k = 1; k <= people.length; k++) out.push({ kind, k, by: me });
        break;
      case 'oneOf':
        for (let i = 0; i < others.length; i++) {
          for (let j = i + 1; j < others.length; j++) out.push({ kind, about: others[i], other: others[j], by: me });
        }
        break;
      case 'traitClaim':
        if (traits) {
          for (const t of TRAIT_IDS) {
            out.push({ kind, trait: t, polarity: 'has', by: me });
            out.push({ kind, trait: t, polarity: 'not', by: me });
          }
        }
        break;
      default:
        others.forEach((x) => out.push({ kind, about: x, by: me }));
    }
  }
  return out;
}

/* ── ACCEPTANCE ───────────────────────────────────────────────────────────
 * What makes a case FAIR depends on the question, and getting this wrong is
 * how a generator ships an unanswerable level. Stated per kind rather than as
 * one global rule:
 */
function acceptable(q, worlds, c) {
  if (!worlds.length) return false;
  const ans = answerFor(q, worlds, c);
  if (ans == null) return false;
  switch (q.kind) {
    case 'verdict':
      // must be genuinely decidable OR genuinely undecidable — both are valid
      // answers — but a case with one world can never teach "not enough
      // evidence", so half of these deliberately keep several worlds alive.
      return true;
    case 'clearAll':
      // pointless if nobody can be cleared, or if everybody can
      return ans.length > 0 && ans.split(',').length < c.people.length;
    case 'count':
      // a count question is dead if the rule already announces the count
      return !(c.rule.kind === 'exactlyLies' || c.rule.kind === 'exactlyTrue');
    default:
      return true;
  }
}

/**
 * A statement is KEY when it alone, with the rule, already names the thief.
 * Asking for it trains a different move from naming the culprit: finding which
 * piece of evidence is actually load-bearing. Only well posed when exactly one
 * statement qualifies.
 */
function findKeyStatement(c) {
  const winners = [];
  for (const s of c.says) {
    const alone = { ...c, says: [s] };
    const w = solveWorlds(alone);
    if (w.length && answerFor({ kind: 'who' }, w, alone) != null) winners.push(s);
  }
  return winners.length === 1 ? winners[0] : null;
}

/* ── CASE BUILDER ─────────────────────────────────────────────────────────
 * Deals a cast, a rule, statements and a question, then verifies before
 * returning. Returns null only if the config genuinely cannot produce a case;
 * callers fall back to a simpler question rather than showing nothing.
 */
export function buildCase(rng, cfg) {
  /*
   * Pick the QUESTION first, then deal cases until one supports it — not the
   * other way round. Dealing first and taking whatever fit produced a 51–66%
   * `verdict` mix at the top tiers, because `verdict` accepts any case while
   * `who` needs a single consistent world. Choosing first costs a few extra
   * deals and buys the mix the weights actually describe.
   */
  const order = weightedOrder(cfg.questions, QUESTION_WEIGHT, rng);
  for (const kind of order) {
    const c = dealFor(rng, cfg, kind);
    if (c) return c;
  }
  return null;
}

function dealFor(rng, cfg, kind) {
  const nPeople = cfg.suspects;
  const budget = kind === 'who' || kind === 'key' ? 320 : 160;
  for (let attempt = 0; attempt < budget; attempt++) {
    const people = shuffleR(SUSPECT_IDS, rng).slice(0, nPeople);
    const wantTraits = cfg.kit.includes('traitClaim') || cfg.evidenceChance > 0;
    const traits = {};
    if (wantTraits) people.forEach((p) => { traits[p] = shuffleR(TRAIT_IDS, rng).slice(0, 2); });

    const rule = pickR(cfg.rules, rng);
    const ruleObj = typeof rule === 'string' ? { kind: rule } : { ...rule };
    if (ruleObj.kind === 'exactlyTrue' && ruleObj.k == null) ruleObj.k = 1 + Math.floor(rng() * Math.max(1, nPeople - 2));
    if (ruleObj.kind === 'exactlyLies' && ruleObj.k == null) ruleObj.k = 1 + Math.floor(rng() * Math.max(1, nPeople - 2));
    if (ruleObj.kind === 'atLeastTrue' && ruleObj.k == null) ruleObj.k = 1 + Math.floor(rng() * Math.max(1, nPeople - 2));

    let evidence = null;
    if (wantTraits && rng() < cfg.evidenceChance) {
      const t = pickR(TRAIT_IDS, rng);
      evidence = { trait: t, polarity: rng() < 0.55 ? 'has' : 'not' };
    }

    const says = people.map((p) => pickR(statementOptions(p, people, cfg.kit, wantTraits ? traits : null), rng));
    const base = { people, says, rule: ruleObj, evidence, traits: wantTraits ? traits : null };
    const worlds = solveWorlds(base);
    if (!worlds.length) continue;

    const q = { kind };
    if (kind === 'verdict') {
      // aim the question at somebody interesting: prefer a suspect whose guilt
      // is genuinely open, so "not enough evidence" gets exercised rather than
      // being a decoration on the answer row
      const open = people.filter((p) => worlds.some((w) => w.thief === p) && !worlds.every((w) => w.thief === p));
      q.about = open.length && rng() < 0.6 ? pickR(open, rng) : pickR(people, rng);
    }
    if (kind === 'key') {
      const k = findKeyStatement(base);
      if (!k) continue;
      q.about = base.says.indexOf(k);
    }
    if (!acceptable(q, worlds, base)) continue;
    // `who` is only honest when the statements actually pin one person
    if (kind === 'who' && worlds.length > 1) continue;
    if (kind === 'who' && says.every((s) => s.kind === 'selfClear')) continue;
    const answer = answerFor(q, worlds, base);
    if (answer == null) continue;
    return { ...base, question: q, answer, worlds, tally: worlds.length };
  }
  return null;
}

/* ── DIFFICULTY ───────────────────────────────────────────────────────────
 * Four levers, all of them things the player feels:
 *   suspects   how many people are on the board
 *   kit        which statement types can appear (blunt → linked → meta → global)
 *   rules      which rules can be in play (`free` is hardest: nothing is given)
 *   questions  which shapes can be asked
 *
 * ⚠ There is no TIME lever, on purpose. This is the one game in the platform
 * where thinking longer is the correct play, and `audit:pacing` exists because
 * three games had already traded their construct for a stopwatch.
 */
const KIT_BLUNT = ['accuse', 'clear', 'selfClear'];
const KIT_LINKED = [...KIT_BLUNT, 'together', 'oneOf', 'selfAccuse'];
const KIT_META = [...KIT_LINKED, 'liar', 'honest', 'sameAs'];
const KIT_ALL = [...KIT_META, 'countLiars', 'atLeastLiars', 'traitClaim'];

/* Rule sets and question sets, each a superset of the one before it. Written as
   spreads so a band can only ever ADD — a band that quietly dropped a rule
   would still satisfy a length check, and `ruleCount` is what audit:curves
   sees. */
const R1 = ['exactlyTrue', 'exactlyLies'];
const R2 = [...R1, 'knaves'];
const R3 = [...R2, 'atLeastTrue'];
const R4 = [...R3, 'invertedKnaves'];
const R5 = [...R4, 'free'];

const Q1 = ['who'];
const Q2 = [...Q1, 'liar', 'honest'];
const Q3 = [...Q2, 'count', 'verdict'];
const Q4 = [...Q3, 'clearAll'];
const Q5 = [...Q4, 'key']; // === QUESTION_KINDS

/*
 * ── THE LADDER ──
 *
 * ONE climb of 50 levels, in five bands of ten. Replaced easy/med/hard on
 * 2026-08-28 — see LADDER-PLAN.md and shared/difficulty.js.
 *
 * Every band opens something nameable: a wider statement kit, another rule
 * about who lies, another shape of question, or one more suspect in the ring.
 * The tiers already did this in halves — the ladder just stops hiding the seam
 * behind a menu word.
 *
 * Span unchanged at both ends: L1 is the old easy L1 (3 suspects, the blunt
 * kit, two rules, one question shape) and L50 the old hard L100 (5 suspects,
 * every statement type, six rules, all seven question shapes).
 *
 * ⚠ NO TIME LEVER, on the ladder as before. This is the one game where thinking
 * longer is the correct play.
 */
export const LADDER = [
  /* L1–10  */ { suspects: 3, kit: KIT_BLUNT, rules: R1, questions: Q1, adds: ['accuse'] },
  /* L11–20 */ { suspects: 3, kit: KIT_LINKED, rules: R2, questions: Q2, adds: ['linked'] },
  /* L21–30 */ { suspects: 4, kit: KIT_META, rules: R3, questions: Q3, adds: ['meta'] },
  /* L31–40 */ { suspects: 4, kit: KIT_ALL, rules: R4, questions: Q4, adds: ['counting'] },
  /* L41–50 */ { suspects: 5, kit: KIT_ALL, rules: R5, questions: Q5, adds: ['fifth'] },
];

export const LADDER_LEVELS = LADDER.length * BAND_SIZE; // 50

export const MECHANIC_LABELS = {
  accuse: { en: 'Who is lying?', ar: 'من يكذب؟' },
  linked: { en: 'Statements about each other', ar: 'أقوال عن بعضهم' },
  meta: { en: 'Claims about lying itself', ar: 'ادّعاءات عن الكذب' },
  counting: { en: 'Counting the liars', ar: 'عدّ الكاذبين' },
  fifth: { en: 'A fifth suspect', ar: 'مشتبه خامس' },
};
/** Cases in one level. Short on purpose — a level is a coffee break, not a sitting. */
export const CASES_PER_LEVEL = 4;

/** ⚠ SIGNATURE CHANGED with the ladder: one argument, no tier. */
export function levelCfg(level) {
  const lv = Math.min(LADDER_LEVELS, Math.max(1, Math.round(Number(level) || 1)));
  const b = LADDER[Math.min(LADDER.length - 1, Math.floor((lv - 1) / BAND_SIZE))];
  const f = ladderFraction(lv, LADDER_LEVELS);
  const { kit, rules, questions } = b;
  return {
    suspects: b.suspects,
    kit,
    rules,
    questions,
    evidenceChance: 0 + 0.45 * f,
    cases: CASES_PER_LEVEL,
    // Numeric mirrors of the three list levers, so `audit:curves` can assert
    // they never shrink — it compares numbers, and an array length buried in a
    // config is exactly the kind of lever that silently regresses.
    kitSize: kit.length,
    ruleCount: rules.length,
    questionCount: questions.length,
    mechanics: mechanicsAt(LADDER, lv),
    lv,
    f,
  };
}

/** Survival: one continuous ramp up the ladder, then past it. */
export function survivalCfg(stage) {
  const { lv } = ladderStage(stage, { levels: LADDER_LEVELS });
  return { ...levelCfg(lv), lv, cases: 1 };
}

/** Pass n Play: everyone gets the same cases from the same seed. */
export function passCfg() {
  return {
    suspects: 4,
    kit: KIT_META,
    rules: ['exactlyTrue', 'exactlyLies', 'knaves'],
    questions: ['who', 'liar', 'count'],
    evidenceChance: 0.2,
    cases: 4,
  };
}

/**
 * One miss forgiven on a four-case level. All-or-nothing over four independent
 * logic puzzles turns a good run into a failed level, which is the complaint
 * that retired Story Time's builder.
 */
export function levelPassed(correct, total) {
  return correct >= total - (total >= 4 ? 1 : 0);
}

/* ── SCORING A CLEAR-ALL ANSWER ───────────────────────────────────────────
 * Multi-select needs partial credit or it is all-or-nothing by the back door.
 * Returns { ok, hits, misses, falseAlarms } — the same hit/false-alarm shape
 * the platform already uses for recognition scoring.
 */
export function scoreClearAll(picked, answer) {
  const want = answer ? answer.split(',').filter(Boolean) : [];
  const got = [...picked];
  const hits = got.filter((p) => want.includes(p)).length;
  const falseAlarms = got.filter((p) => !want.includes(p)).length;
  return { ok: hits === want.length && falseAlarms === 0, hits, misses: want.length - hits, falseAlarms };
}
