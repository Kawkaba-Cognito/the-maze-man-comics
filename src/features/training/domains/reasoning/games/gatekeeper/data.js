/*
 * THE GATE — Haris the Gatekeeper.
 *
 * Replaces Matrix Reasoning in the reasoning domain (2026-08-20). Raven's
 * matrices measure ANALOGICAL pattern completion: you are shown a finished
 * pattern with a hole and you pick the piece. Nothing you do changes what you
 * are allowed to see, so the only thing measured is whether you spot it.
 *
 * This game measures the other half of induction, and it is the half the
 * platform had nowhere to put: RULE INDUCTION BY ACTIVE HYPOTHESIS TESTING.
 * The gate obeys one secret law. You are given a tray of test travellers and a
 * limited number of probes; Haris stamps each one IN or OUT. Then you must send
 * the single traveller from a trio that the law will admit.
 *
 * That makes the player's own CHOICE OF PROBE the interesting datum — this is
 * the Wason 2-4-6 / Zendo family. A player who only probes travellers they
 * expect to pass confirms rather than tests, and learns less per probe. The
 * engine records, per gate, how much each probe actually narrowed the space
 * (see `informationOf`), which is a real measure of testing strategy rather
 * than a restatement of accuracy.
 *
 * ── WHAT MAKES A GATE FAIR, AND WHY IT IS CHECKED RATHER THAN HOPED FOR ──
 * A tray that cannot distinguish the trio makes the final choice a coin flip
 * wearing a puzzle's clothes. This repo has shipped that failure before —
 * audit:fq certified an unplayable Cancellation curriculum for months because
 * it checked the CURVE rather than whether a human could finish the board.
 *
 * So the model works in EXTENSIONS, not in rule objects. `ruleSpace(cfg)`
 * enumerates every law the tier can pose, keyed by the exact set of travellers
 * it admits, deduped — two differently-worded laws that accept the same
 * travellers are the same hypothesis and the player can never tell them apart.
 * A gate is only returned if some subset of probes the player is actually
 * allowed to spend leaves every surviving hypothesis agreeing on which member
 * of the trio passes. `validate:gatekeeper` re-derives that from scratch.
 *
 * ⚠ Every import here must carry its explicit `.js`. Vite resolves
 * extensionless paths, plain Node does not, and the gate runs in Node.
 */
import {
  BAND_SIZE, ladderFraction, ladderStage, mechanicsAt,
} from '../../../../shared/difficulty.js';

/* ── THE TRAVELLERS ───────────────────────────────────────────────────────
 * Four attributes, deliberately orthogonal, so a law about one of them says
 * nothing about the others and a probe is genuinely informative.
 *
 * `folk` is the colour attribute, and it is bound to a NAMED character with a
 * distinct face rather than being a bare swatch. That is an accessibility
 * decision, not decoration: consistency rule 9.6 says task information may
 * never be carried by colour alone, and a law like "only the rust ones may
 * pass" would otherwise be unsolvable without colour vision. Bound to a folk,
 * the same law reads "only Toti-folk may pass" and the card carries the name.
 *
 * ⚠ SIX folk since 2026-08-29, up from four. That widens the hypothesis space —
 * a law about `folk` now has six values to pin down instead of four, against
 * the same probe budget — so the decidability proof in validate:gatekeeper is
 * what says the ladder is still fair, not the fact that it used to be. Each one
 * carries a face AND a forehead crest (see PlanetFolk.jsx); appearance is
 * deliberately NOT bound to `shape`, which is its own attribute and would stop
 * being orthogonal if a folk always came in one silhouette.
 */
export const FOLK = [
  { id: 'toti', en: 'Toti', ar: 'توتي', hue: 'ember' },
  { id: 'zuzu', en: 'Zuzu', ar: 'زوزو', hue: 'gold' },
  { id: 'lulu', en: 'Lulu', ar: 'لولو', hue: 'moss' },
  { id: 'nunu', en: 'Nunu', ar: 'نونو', hue: 'river' },
  { id: 'momo', en: 'Momo', ar: 'مومو', hue: 'plum' },
  { id: 'kiki', en: 'Kiki', ar: 'كيكي', hue: 'rose' },
];
export const FOLK_IDS = FOLK.map((f) => f.id);
export const folkOf = (id) => FOLK.find((f) => f.id === id) || FOLK[0];

/** Body silhouette — the second non-colour channel. */
export const SHAPES = ['round', 'boxy', 'pointy'];
/** How many moons orbit the traveller. */
export const MOONS = [1, 2, 3];
/** Surface: plain, or ringed with stripes. */
export const FILLS = ['plain', 'striped'];

/** The full deck: 6 folk × 3 shapes × 3 moon counts × 2 fills = 108. */
export const DECK = [];
for (const folk of FOLK_IDS) {
  for (const shape of SHAPES) {
    for (const moons of MOONS) {
      for (const fill of FILLS) DECK.push({ folk, shape, moons, fill });
    }
  }
}
export const cardKey = (c) => `${c.folk}|${c.shape}|${c.moons}|${c.fill}`;

/** The tier's deck. Striped travellers only appear once the tier introduces them. */
export function deckFor(useFill) {
  return useFill ? DECK : DECK.filter((c) => c.fill === 'plain');
}

/* ── ATOMS ────────────────────────────────────────────────────────────────
 * The smallest thing a law can be about. `attr` is what the Lens reveals.
 */
export const ATTRS = ['folk', 'shape', 'moons', 'fill'];

export function atomsFor(useFill) {
  const out = [];
  for (const v of FOLK_IDS) out.push({ attr: 'folk', val: v });
  for (const v of SHAPES) out.push({ attr: 'shape', val: v });
  for (const v of MOONS) out.push({ attr: 'moons', val: v });
  if (useFill) for (const v of FILLS) out.push({ attr: 'fill', val: v });
  return out;
}
export const atomHolds = (a, c) => c[a.attr] === a.val;

/* ── LAWS ─────────────────────────────────────────────────────────────────
 * Nine shapes, ordered by how much of the board a player has to hold at once.
 * The pools in BASE below unlock them; a level announces its family by name, so
 * the hypothesis space the player is reasoning inside is the one the gate
 * verifies against. That honesty matters — verifying against ALL laws while
 * telling the player only some are possible would make gates look unfair that
 * are in fact solvable, and the reverse would make them genuinely unfair.
 */
/*
 * ⚠ THERE ARE NO "more than k moons" / "fewer than k moons" LAWS, and that is a
 * finding rather than an omission (2026-08-20). They were in the first model,
 * as the level family "COUNTERS — numbers at the door", and validate:gatekeeper
 * reported that not one of them ever reached a player. The dedup-by-extension
 * in ruleSpace had eaten every single one, correctly: with moons ∈ {1,2,3},
 *
 *     more(1) = {2,3} = neg1(moons=1)        few(2) = {1} = pos1(moons=1)
 *     more(2) = {3}   = pos1(moons=3)        few(3) = {1,2} = neg1(moons=3)
 *
 * Every counting law is a re-wording of a law already in the space. A player
 * cannot distinguish them by any probe, so the family added no hypotheses at
 * all — which meant easy's second half had exactly the same hypothesis space as
 * its first and the tier's whole mid-point lever was inert. Same shape as the
 * Intercept hard tier that shipped one mechanic set across all 100 levels.
 *
 * The fix is the ladder below, not a re-phrasing: easy now opens its second
 * half by introducing STRIPED travellers, a genuinely new attribute. The gate
 * asserts the space strictly GROWS at every half-step so this cannot recur.
 */
export const LAW_KINDS = ['pos1', 'neg1', 'and', 'or', 'mixed', 'notboth', 'boss'];

export function lawHolds(law, c) {
  switch (law.kind) {
    case 'pos1': return atomHolds(law.a, c);
    case 'neg1': return !atomHolds(law.a, c);
    case 'and': return atomHolds(law.a, c) && atomHolds(law.b, c);
    case 'or': return atomHolds(law.a, c) || atomHolds(law.b, c);
    case 'mixed': return atomHolds(law.a, c) && !atomHolds(law.b, c);
    case 'notboth': return !(atomHolds(law.a, c) && atomHolds(law.b, c));
    case 'boss': return (atomHolds(law.a, c) && atomHolds(law.b, c)) || atomHolds(law.c, c);
    default: return false;
  }
}

/** Which attributes a law speaks of — this is exactly what the Lens buys. */
export function lawAttrs(law) {
  const s = new Set();
  if (law.a) s.add(law.a.attr);
  if (law.b) s.add(law.b.attr);
  if (law.c) s.add(law.c.attr);
  return [...s];
}

/* ── THE HYPOTHESIS SPACE ─────────────────────────────────────────────────
 * Every law the tier can pose, keyed by the SET OF TRAVELLERS IT ADMITS.
 *
 * ⚠ Deduping by extension rather than by rule object is the load-bearing part.
 * "Only round ones pass" and "no traveller that is not round passes" are the
 * same hypothesis; a player cannot distinguish them by any probe, ever. Keeping
 * both would make the fairness check believe the trio was still ambiguous when
 * it is perfectly determined, and gates that are fine would be thrown away.
 *
 * Laws admitting nobody or everybody are dropped: nothing can be learned at a
 * gate that refuses all comers, and a gate that admits all comers has no trio
 * with exactly one passer.
 */
export function ruleSpace(cfg) {
  const deck = deckFor(cfg.fill);
  const atoms = atomsFor(cfg.fill);
  const raw = [];
  const pairs = [];
  for (let i = 0; i < atoms.length; i++) {
    for (let j = 0; j < atoms.length; j++) {
      // different attributes only — "round AND boxy" is empty and
      // "round AND round" is just "round", and neither is a law worth posing
      if (i !== j && atoms[i].attr !== atoms[j].attr) pairs.push([atoms[i], atoms[j]]);
    }
  }
  for (const kind of cfg.pool) {
    switch (kind) {
      case 'pos1': for (const a of atoms) raw.push({ kind, a }); break;
      case 'neg1': for (const a of atoms) raw.push({ kind, a }); break;
      case 'and': case 'or': case 'mixed': case 'notboth':
        for (const [a, b] of pairs) raw.push({ kind, a, b });
        break;
      case 'boss':
        for (const [a, b] of pairs) {
          for (const c of atoms) {
            if (c.attr !== a.attr && c.attr !== b.attr) raw.push({ kind, a, b, c });
          }
        }
        break;
      default: break;
    }
  }
  const seen = new Map();
  for (const law of raw) {
    const mask = deck.map((c) => (lawHolds(law, c) ? '1' : '0')).join('');
    if (!mask.includes('1') || !mask.includes('0')) continue;
    if (!seen.has(mask)) seen.set(mask, { law, mask });
  }
  return [...seen.values()];
}

/* ── RNG HELPERS ─────────────────────────────────────────────────────────── */
const shuffleR = (arr, rng) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const pickR = (arr, rng) => arr[Math.floor(rng() * arr.length)];

/** Every k-sized subset of [0..n). n is 6 and k is 3–5, so this stays tiny. */
function subsets(n, k) {
  const out = [];
  const rec = (start, acc) => {
    if (acc.length === k) { out.push([...acc]); return; }
    for (let i = start; i < n; i++) { acc.push(i); rec(i + 1, acc); acc.pop(); }
  };
  rec(0, []);
  return out;
}

/**
 * Which hypotheses survive after seeing `verdicts` for `cards`?
 * A hypothesis survives only if it predicts every observed stamp exactly.
 */
export function survivors(space, cards, verdicts) {
  return space.filter(({ law }) => cards.every((c, i) => lawHolds(law, c) === verdicts[i]));
}

/**
 * THE FAIRNESS TEST, and the reason this file exists before any pixels.
 *
 * A perfect player spends every probe on the most useful travellers available.
 * So the question is not "is the answer knowable in principle" but "is there a
 * set of probes, of the size this gate actually grants, after which every
 * hypothesis still standing agrees on which of the trio walks through".
 *
 * Greedy or heuristic answers would not do here: the tray is 6 and the probe
 * budget 3–5, so the subsets number at most 20 and the question can simply be
 * answered exactly. If no subset works, no player can do better than guess, and
 * the gate is rejected before it is ever dealt.
 *
 * Returns the winning subset (as tray indices) or null.
 */
export function solvingProbeSet(space, law, tray, trio, answerIdx, probes) {
  // Only subsets of exactly `probes` need testing: observations shrink the
  // surviving set monotonically, so a superset is always at least as
  // determining as any subset of it. Spending fewer probes can never help.
  const k = Math.min(probes, tray.length);
  for (const idxs of subsets(tray.length, k)) {
    const cards = idxs.map((i) => tray[i]);
    const verdicts = cards.map((c) => lawHolds(law, c));
    const alive = survivors(space, cards, verdicts);
    // every surviving hypothesis must admit exactly the same one of the trio
    const ok = alive.every(({ law }) => {
      const passes = trio.map((c) => lawHolds(law, c));
      return passes.filter(Boolean).length === 1 && passes[answerIdx];
    });
    if (ok) return idxs;
  }
  return null;
}

/**
 * How much a single probe narrowed the field, as a fraction of the hypotheses
 * that were still alive before it. This is the strategy measure: it separates a
 * player who tests to FALSIFY from one who tests to confirm, and two players
 * with identical accuracy can differ sharply on it.
 */
export function informationOf(before, after) {
  if (!before) return 0;
  return Math.max(0, (before - after) / before);
}

/* ── GATE BUILDER ─────────────────────────────────────────────────────────
 * Deals a law, a tray and a trio, then verifies before returning. Returns null
 * only when the config genuinely cannot produce a fair gate; the engine falls
 * back to the plainest possible config rather than showing an empty board.
 */
export function buildGate(rng, cfg) {
  const space = cfg._space || ruleSpace(cfg);
  if (!space.length) return null;
  const deck = deckFor(cfg.fill);

  for (let attempt = 0; attempt < 60; attempt++) {
    const truth = pickR(space, rng);

    /*
     * ── BUILD THE INFORMATIVE PROBES FIRST, THEN THE TRIO ──
     *
     * The first version dealt a random tray and a random trio and threw the
     * pair away unless it happened to be fair. That is rejection sampling
     * against a rare event: the gate rejected 48 of 90 level configs outright
     * as dead, because most random trays simply never separate three
     * travellers. Worse, it made fairness a matter of luck at exactly the
     * tiers where the hypothesis space is largest — the hard ones.
     *
     * So the tray is CONSTRUCTED to be decisive. Greedily take the traveller
     * whose stamp would eliminate the most hypotheses, `probes` times over —
     * that is the classic split-the-space heuristic, and it is what a good
     * player is trying to do. Whatever survives that is the most a perfect
     * player can know, and the trio is then chosen so that every surviving
     * hypothesis agrees about it. Fair BY CONSTRUCTION rather than by luck,
     * and still re-derived independently by validate:gatekeeper.
     */
    let alive = space;
    const probeSet = [];
    const used = new Set();
    for (let step = 0; step < cfg.probes; step++) {
      let best = null;
      let bestN = Infinity;
      for (const c of shuffleR(deck, rng)) {
        const k = cardKey(c);
        if (used.has(k)) continue;
        const v = lawHolds(truth.law, c);
        let n = 0;
        for (const h of alive) if (lawHolds(h.law, c) === v) n += 1;
        if (n < bestN) { bestN = n; best = c; }
      }
      if (!best) break;
      used.add(cardKey(best));
      probeSet.push(best);
      const v = lawHolds(truth.law, best);
      alive = alive.filter((h) => lawHolds(h.law, best) === v);
    }
    if (probeSet.length < Math.min(cfg.probes, 3)) continue;

    /*
     * The trio must be decided by what SURVIVES, not by the true law. A
     * traveller every surviving hypothesis admits is one the player can prove
     * gets in; one every surviving hypothesis refuses is provably turned away.
     * Anything in between is exactly the guess this game must not ask for.
     */
    const excl = new Set(probeSet.map(cardKey));
    const cand = deck.filter((c) => !excl.has(cardKey(c)));
    const allPass = cand.filter((c) => alive.every((h) => lawHolds(h.law, c)));
    const allFail = cand.filter((c) => alive.every((h) => !lawHolds(h.law, c)));
    if (!allPass.length || allFail.length < 2) continue;

    const winner = pickR(allPass, rng);
    const losers = shuffleR(allFail, rng).slice(0, 2);
    const trio = shuffleR([winner, ...losers], rng);
    const answerIdx = trio.findIndex((c) => cardKey(c) === cardKey(winner));

    /*
     * Pad the tray out to six with travellers that were NOT part of the
     * decisive set, so choosing WHICH to probe is still the player's problem.
     * A tray that is nothing but the answer key would make the game a matter
     * of tapping everything in front of you.
     */
    const trioKeys = new Set(trio.map(cardKey));
    const filler = shuffleR(
      deck.filter((c) => !excl.has(cardKey(c)) && !trioKeys.has(cardKey(c))),
      rng,
    ).slice(0, TRAY_SIZE - probeSet.length);
    const tray = shuffleR([...probeSet, ...filler], rng);
    if (tray.length < TRAY_SIZE) continue;

    // The tray still has to SHOW both stamps, or a player learns nothing by
    // reading it — a decisive set can legitimately be all-refusals.
    const trayPass = tray.filter((c) => lawHolds(truth.law, c)).length;
    if (trayPass === 0 || trayPass === tray.length) continue;

    // ── verify, rather than assume the construction was right ──
    const solving = solvingProbeSet(space, truth.law, tray, trio, answerIdx, cfg.probes);
    if (!solving) continue;

    return {
      law: truth.law,
      mask: truth.mask,
      tray,
      trio,
      answerIdx,
      probes: cfg.probes,
      lenses: cfg.lenses,
      attrs: lawAttrs(truth.law),
      spaceSize: space.length,
      aliveAfter: alive.length,
      solving,
    };
  }
  return null;
}

export const TRAY_SIZE = 6;

/* ── DIFFICULTY ───────────────────────────────────────────────────────────
 * Four levers, every one of them something the player feels:
 *   pool     which law families can be in play (the hypothesis space)
 *   probes   how many stamps you may spend before committing
 *   gates    how many gates stand between you and the end of the level
 *   fill     whether striped travellers exist at all (a fourth attribute)
 *
 * ⚠ There is no TIME lever, deliberately, for the same reason Detective has
 * none: this is a game where thinking longer is the correct play. `audit:pacing`
 * exists in this repo because three games had already traded their construct
 * for a stopwatch.
 *
 * ⚠ `probes` FALLS as a tier advances, which is the opposite of most levers
 * here — fewer probes is harder, so `audit:curves` registers it 'down'.
 */
const POOL_SIMPLE = ['pos1', 'neg1'];
const POOL_JOIN = [...POOL_SIMPLE, 'and', 'or'];
const POOL_TWIST = [...POOL_JOIN, 'mixed', 'notboth'];
const POOL_ALL = [...POOL_TWIST, 'boss'];

/*
 * Six half-tiers, and every step introduces ONE nameable new thing, so a player
 * can always say what changed:
 *
 *   easy ½1  one attribute, plain travellers        "only the round ones"
 *   easy ½2  + STRIPED travellers (a 4th attribute)
 *   med  ½1  + AND / OR — two attributes at once
 *   med  ½2  ( same laws, one probe fewer )
 *   hard ½1  + BUT NOT / NEVER BOTH — exclusion
 *   hard ½2  + the compound law, and the tightest probe budget
 *
 * The gate asserts the hypothesis space strictly grows across that sequence,
 * which is the check that caught the inert counting family above.
 */
/*
 * ── THE LADDER ──
 *
 * ONE climb of 50 levels, in five bands of ten. Replaced easy/med/hard on
 * 2026-08-28 — see LADDER-PLAN.md and shared/difficulty.js.
 *
 * The tiers were already groping towards this: each split itself in half and
 * swapped a pool at the seam. Bands make that the whole structure instead of a
 * hidden detail — the law can say more (a wider `pool`, and `fill` adds a
 * fourth attribute to reason about) while the budget for finding it out
 * shrinks (`probes`).
 *
 * Span unchanged at both ends: L1 is the old easy L1 (the simplest pool, no
 * fill, 5 probes) and L50 the old hard L100 (every clause type, 3 probes).
 */
export const LADDER = [
  /* L1–10  */ { pool: POOL_SIMPLE, fill: false, probes: 5, adds: ['law'] },
  /* L11–20 */ { pool: POOL_SIMPLE, fill: true, probes: 5, adds: ['fill'] },
  /* L21–30 */ { pool: POOL_JOIN, fill: true, probes: 5, adds: ['join'] },
  /* L31–40 */ { pool: POOL_TWIST, fill: true, probes: 4, adds: ['twist'] },
  /* L41–50 */ { pool: POOL_ALL, fill: true, probes: 3, adds: ['boss'] },
];

export const LADDER_LEVELS = LADDER.length * BAND_SIZE; // 50

export const MECHANIC_LABELS = {
  law: { en: 'Find the law', ar: 'اكتشف القانون' },
  fill: { en: 'Filled shapes count', ar: 'الأشكال المملوءة تُحتسب' },
  join: { en: 'And / or clauses', ar: 'عبارات و/أو' },
  twist: { en: 'Mixed and not-both', ar: 'مختلط ولا-كلاهما' },
  boss: { en: 'The boss clause', ar: 'عبارة الرئيس' },
};

/** ⚠ SIGNATURE CHANGED with the ladder: one argument, no tier. */
export function levelCfg(level) {
  const lv = Math.min(LADDER_LEVELS, Math.max(1, Math.round(Number(level) || 1)));
  const b = LADDER[Math.min(LADDER.length - 1, Math.floor((lv - 1) / BAND_SIZE))];
  const f = ladderFraction(lv, LADDER_LEVELS);
  const pool = b.pool;
  const fill = b.fill;
  return {
    pool,
    fill,
    gates: 3 + Math.round(f * 2),
    // Per band now, so the promised budget is never one probe better than the
    // curve says — a guarantee made on a rounding is not a guarantee.
    probes: b.probes,
    lenses: 1,
    seals: 3,
    // Numeric mirrors of the list levers so audit:curves can assert they never
    // shrink — an array length buried in a config is exactly the sort of lever
    // that regresses silently.
    poolSize: pool.length,
    fillOn: fill ? 1 : 0,
    mechanics: mechanicsAt(LADDER, lv),
    lv,
    f,
  };
}

/** Survival: one continuous ramp up the ladder, then past it. */
export function survivalCfg(stage) {
  const { lv } = ladderStage(stage, { levels: LADDER_LEVELS });
  return { ...levelCfg(lv), lv, gates: 1 };
}

/** Pass n Play: everyone faces the same gates from the same seed. */
export function passCfg() {
  return {
    pool: POOL_JOIN,
    fill: false,
    gates: 4,
    probes: 4,
    lenses: 1,
    seals: 3,
    poolSize: POOL_JOIN.length,
    fillOn: 0,
    lv: 21, // the band that opens the JOIN pool — for the FAMILY heading
  };
}

/**
 * One refusal forgiven on a multi-gate level. All-or-nothing across four
 * independent inductions turns a good run into a failed level — the same
 * complaint that retired Story Time's all-or-nothing panel scoring.
 *
 * ⚠ The threshold is `>= 3`, not `>= 4`, and that is the whole point: easy's
 * first 44 levels deal THREE gates (BASE.easy.g0), so a `>= 4` cut forgave
 * nothing there. Easy demanded 100% while med and hard asked 75%, and the bar
 * then DROPPED at easy L45 — where striped travellers arrive and the tier gets
 * harder. A forgiveness rule keyed to gate count has to cover the smallest
 * count any tier actually deals; `audit:curves` cannot see this, because
 * levelPassed is not a registered lever.
 */
export function levelPassed(cleared, total) {
  return cleared >= total - (total >= 3 ? 1 : 0);
}
