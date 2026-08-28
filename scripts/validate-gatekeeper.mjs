/*
 * validate:gatekeeper — every gate must be SOLVABLE BY REASONING, not by luck.
 *
 * The Gate is fully generated: a secret law, a tray of test travellers and a
 * trio to choose from, dealt at runtime. That buys infinite content and costs
 * the one thing an authored puzzle gives for free — a human having checked that
 * it can be worked out. The failures a generator ships are invisible from
 * playing, because a player who cannot deduce the answer simply assumes they
 * reasoned badly:
 *
 *   · a tray whose stamps never distinguish the trio, so the final choice is a
 *     1-in-3 guess dressed as a puzzle
 *   · a trio with no passer, or with two — there is no correct answer, or the
 *     player is marked wrong for a right one
 *   · a law that admits everybody or nobody, so no probe teaches anything
 *   · a probe budget the curve promises and the dealt gate does not honour
 *   · a tier whose "harder" half is not harder
 *
 * ⚠ THE CENTRAL CHECK IS RE-DERIVED, NOT TRUSTED. The engine reports which
 * probe set solves a gate; this file ignores that and recomputes it with an
 * independently written enumerator, because a bug in the builder's own fairness
 * test would otherwise certify itself. Same discipline as validate:liars.
 *
 * ⚠ AND THE CHECK IS MADE ON WHAT A PLAYER MEETS. The guarantee is not "the
 * answer is knowable in principle" — it is "there exists a set of probes, of
 * the size THIS gate actually grants, after which every hypothesis still
 * standing agrees on which traveller walks through". A guarantee made on the
 * full tray would be a guarantee about a player who cannot exist, which is the
 * failure CLAUDE.md records for Intercept: a floor honoured by the config and
 * broken by the built wave.
 */
import {
  LADDER, DECK, FILLS, FOLK_IDS, LADDER_LEVELS, MOONS, SHAPES, TRAY_SIZE,
  atomsFor, buildGate, cardKey, deckFor, lawAttrs, lawHolds, levelCfg,
  levelPassed, passCfg, ruleSpace, survivalCfg,
} from '../src/features/training/domains/reasoning/games/gatekeeper/data.js';
import { mulberry32 } from '../src/lib/rng.js';

const problems = [];
const push = (m) => problems.push(m);
let checked = 0;
const seen = { law: new Map(), attr: new Map(), pool: new Set() };
let probeSpend = [];

/* ── an INDEPENDENT law evaluator ────────────────────────────────────────
 * Written against the model's description rather than by calling lawHolds, so
 * a bug in the game's own predicate cannot hide behind itself.
 */
function holds(law, c) {
  const at = (a) => c[a.attr] === a.val;
  if (law.kind === 'pos1') return at(law.a);
  if (law.kind === 'neg1') return !at(law.a);
  if (law.kind === 'more') return c.moons > law.k;
  if (law.kind === 'few') return c.moons < law.k;
  if (law.kind === 'and') return at(law.a) && at(law.b);
  if (law.kind === 'or') return at(law.a) || at(law.b);
  if (law.kind === 'mixed') return at(law.a) && !at(law.b);
  if (law.kind === 'notboth') return !(at(law.a) && at(law.b));
  if (law.kind === 'boss') return (at(law.a) && at(law.b)) || at(law.c);
  throw new Error(`unknown law kind ${law.kind}`);
}

/** Independent subset enumeration. */
function combos(n, k) {
  const out = [];
  const rec = (start, acc) => {
    if (acc.length === k) { out.push([...acc]); return; }
    for (let i = start; i < n; i++) { acc.push(i); rec(i + 1, acc); acc.pop(); }
  };
  rec(0, []);
  return out;
}

/**
 * Re-derive fairness from first principles.
 * Returns { solvable, best } where `best` is the smallest probe count that
 * determines the trio — used to report how much slack the budget really has.
 */
function reDerive(gate, cfg) {
  const space = ruleSpace(cfg);
  const { tray, trio, answerIdx } = gate;
  for (let k = 1; k <= Math.min(cfg.probes, tray.length); k++) {
    for (const idxs of combos(tray.length, k)) {
      const cards = idxs.map((i) => tray[i]);
      const verdicts = cards.map((c) => holds(gate.law, c));
      const alive = space.filter(({ law }) => cards.every((c, i) => holds(law, c) === verdicts[i]));
      if (!alive.length) continue;
      const ok = alive.every(({ law }) => {
        const p = trio.map((c) => holds(law, c));
        return p.filter(Boolean).length === 1 && p[answerIdx];
      });
      if (ok) return { solvable: true, best: k };
    }
  }
  return { solvable: false, best: null };
}

/** Everything that must be true of one dealt gate. */
function checkGate(gate, cfg, where) {
  checked += 1;
  seen.law.set(gate.law.kind, (seen.law.get(gate.law.kind) || 0) + 1);
  for (const a of lawAttrs(gate.law)) seen.attr.set(a, (seen.attr.get(a) || 0) + 1);

  const deck = deckFor(cfg.fill);

  // 1. the law must divide the deck — otherwise no probe is informative
  const admits = deck.filter((c) => holds(gate.law, c)).length;
  if (admits === 0) push(`${where} the law admits NOBODY — no gate can be passed`);
  if (admits === deck.length) push(`${where} the law admits EVERYBODY — nothing to deduce`);

  // 2. the trio must have exactly one passer, and it must be the stated answer
  const passes = gate.trio.map((c) => holds(gate.law, c));
  const nPass = passes.filter(Boolean).length;
  if (nPass !== 1) push(`${where} trio has ${nPass} travellers the law admits, must be exactly 1`);
  else if (!passes[gate.answerIdx]) push(`${where} answerIdx points at a traveller the law REFUSES`);

  // 3. the tray must be the promised size, and disjoint from the trio
  if (gate.tray.length !== TRAY_SIZE) push(`${where} tray is ${gate.tray.length}, expected ${TRAY_SIZE}`);
  const trioKeys = new Set(gate.trio.map(cardKey));
  if (gate.tray.some((c) => trioKeys.has(cardKey(c)))) {
    push(`${where} a tray traveller also appears in the trio — the probe gives the answer away`);
  }
  // duplicate travellers in the tray waste a probe on information already held
  if (new Set(gate.tray.map(cardKey)).size !== gate.tray.length) {
    push(`${where} tray contains duplicate travellers`);
  }

  // 4. the tray must actually teach — both stamps must be reachable
  const trayPass = gate.tray.filter((c) => holds(gate.law, c)).length;
  if (trayPass === 0) push(`${where} every tray traveller is REFUSED — the tray cannot show what passes`);
  if (trayPass === gate.tray.length) push(`${where} every tray traveller is ADMITTED — the tray cannot show what fails`);

  // 5. the budget the gate grants must be the budget the curve promised
  if (gate.probes !== cfg.probes) push(`${where} gate grants ${gate.probes} probes, curve promised ${cfg.probes}`);

  // 6. ⚠ THE ONE THAT MATTERS — re-derived, not trusted
  const { solvable, best } = reDerive(gate, cfg);
  if (!solvable) {
    push(`${where} UNSOLVABLE: no set of ${cfg.probes} probes determines the trio — the choice is a guess`);
  } else {
    probeSpend.push({ best, budget: cfg.probes });
    if (best > cfg.probes) push(`${where} needs ${best} probes but only ${cfg.probes} are granted`);
  }
}

/* ── levels ──────────────────────────────────────────────────────────────
 * Sampled across each tier rather than exhaustively: 3 tiers × 100 levels ×
 * several gates × a rule-space enumeration per gate is minutes of work, and the
 * curve is smooth, so the ends and the middles are what carry the risk.
 */
/* ⚠ ONE LADDER since 2026-08-28 — every level of it, both edges of every band. */
{
  for (let lv = 1; lv <= LADDER_LEVELS; lv += 1) {
    const cfg = levelCfg(lv);
    seen.pool.add(cfg.pool.join('+'));
    for (let s = 0; s < 3; s++) {
      const rng = mulberry32(lv * 131 + s);
      const gate = buildGate(rng, cfg);
      if (!gate) { push(`L${lv} seed${s} buildGate returned NULL — dead level`); continue; }
      checkGate(gate, cfg, `L${lv} seed${s}`);
    }
  }
}

/* ── survival ────────────────────────────────────────────────────────────
 * The ramp runs past the authored tiers, which is where a config can quietly
 * go out of range.
 */
for (let stage = 0; stage < 40; stage += 2) {
  const cfg = survivalCfg(stage);
  const rng = mulberry32(90001 + stage * 37);
  const gate = buildGate(rng, cfg);
  if (!gate) { push(`survival ${stage} buildGate returned NULL`); continue; }
  checkGate(gate, cfg, `survival ${stage}`);
}

/* ── pass n play ─────────────────────────────────────────────────────────
 * Every player must face the IDENTICAL gate, or the ranking is meaningless.
 */
{
  const cfg = passCfg();
  const a = buildGate(mulberry32(4242), cfg);
  const b = buildGate(mulberry32(4242), cfg);
  if (!a || !b) push('passplay buildGate returned NULL');
  else {
    checkGate(a, cfg, 'passplay');
    const same = JSON.stringify(a.tray) === JSON.stringify(b.tray)
      && JSON.stringify(a.trio) === JSON.stringify(b.trio)
      && a.answerIdx === b.answerIdx;
    if (!same) push('passplay: the same seed dealt DIFFERENT gates — players would not face the same puzzle');
  }
}

/* ── the curve ───────────────────────────────────────────────────────────
 * Asserted on the OUTCOME a player meets, not on the authored numbers: the
 * hypothesis space must grow and the probe budget must not grow.
 */
{
  let prevSpace = 0;
  let prevProbes = Infinity;
  for (let lv = 1; lv <= LADDER_LEVELS; lv += 1) {
    const cfg = levelCfg(lv);
    const size = ruleSpace(cfg).length;
    if (size < prevSpace) push(`L${lv}: hypothesis space SHRANK (${prevSpace} → ${size})`);
    if (cfg.probes > prevProbes) push(`L${lv}: probe budget GREW (${prevProbes} → ${cfg.probes})`);
    prevSpace = size;
    prevProbes = cfg.probes;
    if (cfg.probes < 3) push(`L${lv}: only ${cfg.probes} probes — below the floor of 3`);
  }
}

/*
 * ⚠ EVERY BAND MUST ACTUALLY BE HARDER THAN THE ONE BEFORE IT.
 *
 * This is the check the first model failed silently. Its "COUNTERS" family was
 * extensionally identical to laws already in the space, so easy's second half
 * posed precisely the same puzzles as its first — and a non-decreasing
 * assertion happily passed a lever that did nothing. Difficulty has to go UP
 * at every band edge, either by widening what the law can say or by narrowing
 * what the player may spend finding out.
 *
 * ⚠ Measured on the HYPOTHESIS SPACE, not on `poolSize`. `audit:curves` proves
 * a band moves a declared lever; this proves the lever actually changes the
 * puzzle. A pool that grows by a clause which says nothing new would pass there
 * and fail here — which is exactly the bug that shipped once.
 */
{
  let prev = null;
  LADDER.forEach((_, b) => {
    const lv = b * 10 + 1;
    const cfg = levelCfg(lv);
    const cur = { space: ruleSpace(cfg).length, probes: cfg.probes, label: `band ${b + 1} (L${lv})` };
    if (prev) {
      const wider = cur.space > prev.space;
      const tighter = cur.probes < prev.probes;
      if (!wider && !tighter) {
        push(`${prev.label} → ${cur.label}: INERT BAND — hypothesis space ${prev.space}→${cur.space} and probes ${prev.probes}→${cur.probes}. Nothing got harder.`);
      }
      if (cur.space < prev.space) push(`${prev.label} → ${cur.label}: hypothesis space shrank`);
    }
    prev = cur;
  });
}

/* ── the pass rule ───────────────────────────────────────────────────── */
if (!levelPassed(3, 4)) push('levelPassed: 3 of 4 must pass — one refusal is forgiven');
if (levelPassed(2, 4)) push('levelPassed: 2 of 4 must NOT pass');
if (!levelPassed(1, 1)) push('levelPassed: a single-gate level must pass on 1');
if (levelPassed(0, 1)) push('levelPassed: 0 of 1 must not pass');

/* ── the deck ────────────────────────────────────────────────────────── */
if (DECK.length !== FOLK_IDS.length * SHAPES.length * MOONS.length * FILLS.length) {
  push(`deck is ${DECK.length}, expected the full cross product`);
}
if (new Set(DECK.map(cardKey)).size !== DECK.length) push('deck contains duplicate travellers');
if (deckFor(false).some((c) => c.fill !== 'plain')) push('the no-fill deck leaked a striped traveller');
// every atom must be reachable, or a law could be posed that no traveller meets
for (const a of atomsFor(true)) {
  if (!DECK.some((c) => c[a.attr] === a.val)) push(`no traveller has ${a.attr}=${a.val}`);
}

/* ── SELF-TESTS ──────────────────────────────────────────────────────────
 * A detector that has stopped firing is indistinguishable from a codebase with
 * no bugs. This repo has shipped that exact failure three times (the
 * audit:consistency string rule twice, audit:gamekeys once), so each check that
 * matters is planted against here and must reject.
 *
 * ⚠ And the PLANT ITSELF IS VERIFIED. audit:gamekeys once produced a false PASS
 * because its plant silently never landed (a CRLF mismatch), and the "OK" was
 * mistaken for proof the detector was sound.
 */
{
  const cfg = levelCfg(30);
  const gate = buildGate(mulberry32(777), cfg);
  if (!gate) push('SELF-TEST could not deal a gate to plant against');
  else {
    const before = problems.length;

    // plant 1: a trio with two passers
    const twoPass = { ...gate, trio: [...gate.trio] };
    const other = deckFor(cfg.fill).find(
      (c) => holds(gate.law, c) && !twoPass.trio.some((x) => cardKey(x) === cardKey(c)),
    );
    if (!other) push('SELF-TEST plant 1 did not land: no second admitted traveller exists');
    else {
      const spoil = twoPass.trio.findIndex((c, i) => i !== gate.answerIdx);
      twoPass.trio[spoil] = other;
      if (twoPass.trio.filter((c) => holds(gate.law, c)).length !== 2) {
        push('SELF-TEST plant 1 did not land: trio does not have two passers');
      }
      checkGate(twoPass, cfg, 'SELFTEST-twoPass');
      if (problems.length === before) push('SELF-TEST FAILED: a trio with TWO passers was accepted');
      else problems.splice(before);
    }

    // plant 2: an answer index pointing at a refused traveller
    const wrongIdx = { ...gate, answerIdx: (gate.answerIdx + 1) % 3 };
    if (holds(gate.law, wrongIdx.trio[wrongIdx.answerIdx])) {
      push('SELF-TEST plant 2 did not land: the moved index still points at a passer');
    }
    const b2 = problems.length;
    checkGate(wrongIdx, cfg, 'SELFTEST-wrongIdx');
    if (problems.length === b2) push('SELF-TEST FAILED: an answerIdx pointing at a REFUSED traveller was accepted');
    else problems.splice(b2);

    // plant 3: an uninformative tray — every traveller refused, so the stamps
    // can never separate the trio. This is the fairness check itself.
    const dull = deckFor(cfg.fill).filter(
      (c) => !holds(gate.law, c) && !gate.trio.some((x) => cardKey(x) === cardKey(c)),
    ).slice(0, TRAY_SIZE);
    if (dull.length < TRAY_SIZE) push('SELF-TEST plant 3 did not land: not enough refused travellers');
    else {
      const blind = { ...gate, tray: dull };
      if (blind.tray.some((c) => holds(gate.law, c))) push('SELF-TEST plant 3 did not land: tray still admits someone');
      const b3 = problems.length;
      checkGate(blind, cfg, 'SELFTEST-blindTray');
      if (problems.length === b3) push('SELF-TEST FAILED: an all-refused tray was accepted');
      else problems.splice(b3);
    }

    // plant 4: a probe budget the curve did not promise
    const b4 = problems.length;
    checkGate({ ...gate, probes: cfg.probes + 2 }, cfg, 'SELFTEST-budget');
    if (problems.length === b4) push('SELF-TEST FAILED: a gate granting the wrong probe budget was accepted');
    else problems.splice(b4);

    checked -= 4;
  }
}

/* ── report ──────────────────────────────────────────────────────────── */
if (problems.length) {
  const groups = new Map();
  for (const p of problems) {
    const key = p.replace(/^[a-z]+ L?\d+ seed\d+ /, '').replace(/^survival \d+ /, '').replace(/\d+/g, 'N');
    if (!groups.has(key)) groups.set(key, { n: 0, example: p });
    groups.get(key).n += 1;
  }
  console.error(`validate:gatekeeper FAILED — ${problems.length} problem(s) in ${groups.size} kind(s)\n`);
  for (const [key, g] of [...groups.entries()].sort((a, b) => b[1].n - a[1].n)) {
    console.error(`  · ×${g.n}  ${key}`);
    console.error(`      e.g. ${g.example}`);
  }
  process.exit(1);
}

const tight = probeSpend.filter((p) => p.best === p.budget).length;
const lawSummary = [...seen.law.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · ');
console.log(`validate:gatekeeper OK — ${checked} generated gates re-solved independently.`);
console.log(`  every one is decidable within the probes it grants (${tight} need every probe).`);
console.log(`  laws: ${lawSummary}`);
console.log(`  attributes exercised: ${[...seen.attr.keys()].join(', ')}`);
console.log(`  law families in play: ${seen.pool.size}`);
