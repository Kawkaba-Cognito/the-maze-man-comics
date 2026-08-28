/*
 * audit:curves — does difficulty actually rise?
 *
 * `audit:mot` exists because Target Tracking's tiers were authored independently
 * and starting Hard was EASIER than finishing Medium on three of four levers.
 * `audit:fq` exists because a curve whose shape looked right granted 11s for a
 * board needing 44.5s. Both bugs were invisible: the games ran, the levels
 * unlocked, nobody could tell by playing that the ladder had a hole in it.
 *
 * Ten-plus games still have no equivalent check. This is that check, plus an
 * honest accounting of the ones it CANNOT reach.
 *
 * ── The reachability problem, stated rather than hidden ──
 * A curve can only be gated if a plain Node script can import it. Games that
 * keep their level config inside `index.jsx` cannot be imported (JSX, React,
 * CSS side-effects at module scope), so they are UNGATEABLE WHERE THEY SIT. The
 * fix is not a cleverer parser — it is moving the curve into a `data.js`, which
 * is already the rule (see the consistency checklist, "difficulty goes in
 * data.js, never inline in the component"). This script names those games so
 * the gap is tracked instead of forgotten.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const D = path.join(ROOT, 'src/features/training/domains');

const problems = [];
const push = (m) => problems.push(m);

/* ── which games are registered, and where does their curve live? ── */
const games = [];
for (const dom of fs.readdirSync(D)) {
  const cfg = path.join(D, dom, 'domain.config.js');
  if (!fs.existsSync(cfg)) continue;
  const src = fs.readFileSync(cfg, 'utf8');
  for (const b of src.match(/\{[^{}]*\}/g) || []) {
    const key = b.match(/gameKey:\s*'([^']+)'/)?.[1];
    const folder = b.match(/loader:\s*\(\)\s*=>\s*import\('\.\/games\/([^']+)'\)/)?.[1];
    if (key && folder) games.push({ key, folder, dom, dir: path.join(D, dom, 'games', folder) });
  }
}

/*
 * Gateable curves. Each entry says how to reach the config and WHICH fields must
 * move, in which direction — asserting the outcome (the lever the player feels),
 * never merely that some exponent is present.
 *   dir: 'up'   = must not decrease as level rises
 *   dir: 'down' = must not increase
 */
const CURVES = {
  /*
   * ⚠ KEEP TRACK IS ON THE LADDER (2026-08-28) — one climb, no tiers. It is the
   * pilot for the platform migration, so this is the first `ladder: true` spec.
   *
   * `structural` is the anti-padding lever and the reason the ladder cannot rot
   * back into tiers. A band must EARN its ten levels: introduce a mechanic, or
   * move a structural lever. Ramping stream/rate alone is not enough, because
   * "the same game slightly faster" is precisely what a hundred-level tier was.
   * This rejected the first draft of Keep Track's own table (six bands, the last
   * one inert) — the band was deleted rather than the rule relaxed.
   */
  'keep-track': {
    mod: 'memory/games/keep-track/data.js',
    ladder: true,
    get: (m) => (lv) => m.levelCfg(lv),
    levels: (m) => m.LADDER_LEVELS,
    bands: (m) => m.LADDER,
    fields: { targets: 'up', stream: 'up', rate: 'down' },
    structural: ['targets', 'pool'],
  },
  /* Moved out of index.jsx on 2026-08-15 so it could be gated at all. `gap`
     falls (faster gates) and `target`/`opCount` rise, and opCount is what makes
     a harder TIER harder at the same level number — easy never sees × or ÷. */
  'math-gates': {
    mod: 'speed/games/math-gates/mathGatesData.js',
    ladder: true,
    get: (m) => (lv) => m.levelCfg(lv),
    levels: (m) => m.LADDER_LEVELS,
    bands: (m) => m.LADDER,
    // `lives` joined the gated fields with the ladder — fewer lives is harder,
    // and it is one of the two levers that makes a band worth its ten levels.
    fields: { gap: 'down', target: 'up', opCount: 'up', lives: 'down' },
    structural: ['opCount', 'lives'],
  },
  /* Also moved out of index.jsx the same day (palData.js), for the pacing gate;
     registering it here closes the second half of the same gap. */
  'paired-associates': {
    mod: 'memory/games/paired-associates/palData.js',
    ladder: true,
    get: (m) => (lv) => m.levelCfg(lv),
    levels: (m) => m.LADDER_LEVELS,
    bands: (m) => m.LADDER,
    fields: { boxes: 'up', pairs: 'up', study: 'down' },
    structural: ['boxes', 'pairs'],
  },
  /* Story Time joined the gateable list on 2026-08-17, when the builder was
     replaced by Kawkab's questions and the curve moved to data.js. Note that
     raw `memo` is deliberately NOT a field here: a six-scene story is given
     more seconds than a four-scene one, so the honest lever is SECONDS PER
     SCENE, which falls in both directions. Gating `memo` would report the hard
     tier as easier. */
  'story-grid': {
    mod: 'memory/games/story-grid/data.js',
    ladder: true,
    get: (m) => (lv) => m.levelCfg(lv),
    levels: (m) => m.LADDER_LEVELS,
    bands: (m) => m.LADDER,
    fields: { len: 'up', questions: 'up', opts: 'up', memoPerPanel: 'down' },
    structural: ['len', 'questions', 'opts'],
  },
  /* Detective became Liars' Ring on 2026-08-17 and its curve moved out of the
     old noir engine into data.js. All four levers are things the player feels:
     more suspects, a richer statement kit, more rules in play and more question
     shapes. Deliberately NO time lever — this is the one game where thinking
     longer is the correct play. */
  detective: {
    mod: 'reasoning/games/detective/data.js',
    ladder: true,
    get: (m) => (lv) => m.levelCfg(lv),
    levels: (m) => m.LADDER_LEVELS,
    bands: (m) => m.LADDER,
    fields: { suspects: 'up', kitSize: 'up', ruleCount: 'up', questionCount: 'up', evidenceChance: 'up' },
    structural: ['suspects', 'kitSize', 'ruleCount', 'questionCount'],
  },
  /* Intercept became a WAVE game on 2026-08-18 and its curve moved to data.js
     with it, so it can finally be gated. The levers are what the player feels
     arriving: a wider front, more ships, more of them in the air AT ONCE, and
     more ship types to tell apart — against less warning (`visibleMs`) and a
     tighter window (`tol`).

     ⚠ `travel` is deliberately NOT a field. A slower ship is not an easier one
     here: the measure is a signed error against a HIDDEN arrival, and a longer
     flight means a longer stretch of it unseen. Gating it as 'down' would have
     forced the curve to shorten flights to stay green, which makes the game
     easier while the number says harder — the audit:fq mistake exactly. */
  intercept: {
    mod: 'speed/games/intercept/data.js',
    ladder: true,
    get: (m) => (lv) => m.levelCfg(lv),
    levels: (m) => m.LADDER_LEVELS,
    bands: (m) => m.LADDER,
    fields: {
      count: 'up', mechCount: 'up', armour: 'up',
      crossMs: 'down', gapMs: 'down', dwellMs: 'down',
    },
    /* No `structural` needed: every band of this ladder declares an `adds`,
       because its six bands ARE its six mechanics. */
    /*
     * ⚠ TWO LEVERS ARE DELIBERATELY ABSENT, and both were measured rather than
     * assumed before being left out:
     *
     *   hiddenShare — NOT monotonic on hard. The visibility floor in shape()
     *     pushes the canopy back whenever the authored share would leave under
     *     MIN_VISIBLE_MS of run-up, and it bites unevenly across the tier. The
     *     lever is real, the clamp is correct, and gating it would fail on
     *     working code.
     *   barrels — rises with level, but a barrel HELPS the player. Registering
     *     it 'up' would assert the wrong direction of difficulty and force the
     *     curve to remove help in order to stay green.
     */
  },
  /*
   * THE GATE. Two levers move in opposite directions and both are difficulty:
   * the law can say more (`poolSize`, and `fillOn` adds a whole fourth
   * attribute to reason about), while the budget for finding it out shrinks
   * (`probes`).
   *
   * ⚠ `gates` is deliberately NOT a field. More gates in a level is more WORK,
   * not a harder induction, and one refusal is forgiven either way — gating it
   * 'up' would let a tier look harder by simply being longer, which is the
   * audit:fq mistake (assert what the player meets, not what the config says).
   *
   * The real difficulty guarantee — that every gate is actually DECIDABLE
   * within the probes it grants — is not a curve property at all and lives in
   * validate:gatekeeper, which re-derives it per gate with its own enumerator.
   */
  gatekeeper: {
    mod: 'reasoning/games/gatekeeper/data.js',
    ladder: true,
    get: (m) => (lv) => m.levelCfg(lv),
    levels: (m) => m.LADDER_LEVELS,
    bands: (m) => m.LADDER,
    fields: { poolSize: 'up', fillOn: 'up', probes: 'down' },
    structural: ['poolSize', 'fillOn', 'probes'],
  },
  /* ⚠ `rampOn` is 'down' because losing the gradual ramp-in is HARDER: the
     whole distortion arrives cold. Direction of difficulty, not of the number. */
  /* Car Park / Spaceship. Its curve was extracted out of index.jsx on
     2026-08-28 — it was one of the two games this script had been printing as
     ungateable. `maxC` (cars in play at once) is the structural lever and the
     one with a literature behind it: the ~4-object divided-attention limit is
     crossed at band 4 and overloaded at band 5. */
  'train-switch': {
    mod: 'attention/games/train-switch/carParkData.js',
    ladder: true,
    get: (m) => (lv) => m.levelCfg(lv),
    levels: (m) => m.LADDER_LEVELS,
    bands: (m) => m.LADDER,
    fields: {
      maxC: 'up', colors: 'up', forks: 'up', cps: 'up', target: 'up', R: 'up',
      spawn: 'down', lives: 'down',
    },
    structural: ['maxC', 'colors', 'lives'],
  },
  /*
   * SPEED MATCH — the first KIND D game on the ladder (2026-08-28).
   *
   * It is a 1,160-line pre-ModeShell monolith, so this took surgery on its OWN
   * mode flow rather than a ModeShell prop: its `diff` phase was deleted and its
   * own level grid re-pointed at the ladder. `pairCount` (symbols in the key) is
   * the structural lever, with exactly six useful values.
   */
  'speed-match': {
    mod: 'speed/games/speed-match/speedMatchData.js',
    ladder: true,
    get: (m) => (lv) => m.specForLevel(lv),
    levels: (m) => m.LADDER_LEVELS,
    bands: (m) => m.LADDER,
    fields: { pairCount: 'up', targetCorrect: 'up', minAcc: 'up', itemMs: 'down' },
    structural: ['pairCount', 'minAcc'],
  },
  /* Word Maze (folder `wordle`). Kind D, migrated 2026-08-28. Only two
     structural states exist — grid 4→5 and min length 3→4 — so `targetWords`
     is the per-band lever, as with task-switch. ⚠ `validate:wordmaze` is the
     one that matters here: it simulates real boards and asserts findable words
     exceed the target by 1.5×. A raised target can make a level unwinnable in a
     way no curve check would see. */
  wordle: {
    mod: 'language/games/wordle/wordleData.js',
    ladder: true,
    get: (m) => (lv) => m.specificationForLevel(lv),
    levels: (m) => m.LADDER_LEVELS,
    bands: (m) => m.LADDER,
    fields: { size: 'up', minLen: 'up', targetWords: 'up', timeSec: 'down' },
    structural: ['size', 'minLen', 'targetWords'],
  },
  /* Trivia. Weighted pool over STAR RATINGS (1..4). `starCount` is how many
     ratings the band can serve and `steps` how long a staircase runs. */
  trivia: {
    mod: 'language/games/trivia/triviaLadder.js',
    ladder: true,
    get: (m) => (lv) => m.levelCfg(lv),
    levels: (m) => m.LADDER_LEVELS,
    bands: (m) => m.LADDER,
    fields: { tierMass: 'up', starCount: 'up', steps: 'up' },
    structural: ['tierMass', 'starCount', 'steps'],
  },
  /* Word Links. Weighted pool like sort-shift, plus `kindCount` — the question
     FORMATS the band allows. Analogies and pair matching used to be locked
     behind the med/hard menu words; they are band 2 and band 3 now. */
  synonyms: {
    mod: 'language/games/synonyms/data.js',
    ladder: true,
    get: (m) => (lv) => m.levelCfg(lv),
    levels: (m) => m.LADDER_LEVELS,
    bands: (m) => m.LADDER,
    fields: { tierMass: 'up', kindCount: 'up', poolTiers: 'up' },
    structural: ['tierMass', 'kindCount'],
  },
  /*
   * Sort It Another Way — the first WEIGHTED-POOL ladder. Its difficulty is not
   * a knob but which content it serves, so `tierMass` (the weighted mean rank
   * of the tiers in play, 0..1) is the lever that has to rise. `poolSize` rises
   * with it because the pool ACCUMULATES rather than sliding — see the note in
   * sets.js about three sets per tier.
   *
   * ⚠ Both are needed. `poolSize` alone would pass a band that widened its pool
   * without shifting any weight toward the hard end — wider, but no harder.
   */
  'sort-shift': {
    mod: 'flexibility/games/sort-shift/sets.js',
    ladder: true,
    get: (m) => (lv) => m.levelCfg(lv),
    levels: (m) => m.LADDER_LEVELS,
    bands: (m) => m.LADDER,
    fields: { tierMass: 'up', poolSize: 'up', rules: 'up' },
    structural: ['tierMass', 'rules'],
  },
  /* ⚠ THE THINNEST LADDER — `pSwitch` is the only structural lever, because
     Task Switch has one mechanic and three continuous knobs. See the note in
     taskSwitchData.js: it is first in line for the deferred feature work. */
  'task-switch': {
    mod: 'flexibility/games/task-switch/taskSwitchData.js',
    ladder: true,
    get: (m) => (lv) => m.tsCfg('levels', lv),
    levels: (m) => m.LADDER_LEVELS,
    bands: (m) => m.LADDER,
    fields: { pSwitch: 'up', csi: 'down', deadline: 'down' },
    structural: ['pSwitch'],
  },
  'mirror-world': {
    mod: 'flexibility/games/mirror-world/data.js',
    ladder: true,
    get: (m) => (lv) => {
      const adapt = m.levelSchedule(lv).find((b) => b.role === m.ROLE.ADAPT);
      return {
        rotation: adapt.rotation,
        targets: adapt.targets,
        reaches: adapt.reaches,
        rampOn: adapt.ramp ? 1 : 0,
      };
    },
    levels: (m) => m.LADDER_LEVELS,
    bands: (m) => m.LADDER,
    fields: { rotation: 'up', targets: 'up', reaches: 'up', rampOn: 'down' },
    structural: ['targets', 'reaches', 'rampOn'],
  },
};

let checked = 0;
for (const [key, spec] of Object.entries(CURVES)) {
  let m;
  try {
    m = await import(`file:///${path.join(D, spec.mod).replace(/\\/g, '/')}`);
  } catch (e) {
    push(`${key}: could not import ${spec.mod} — ${e.message}`);
    continue;
  }
  const cfgOf = spec.get(m);

  /*
   * ── LADDER GAMES ──
   * One climb, so there are no tiers to compare and the cross-tier check below
   * does not apply. Three things are asserted instead: the levers move the right
   * way across the WHOLE ladder, the mechanic set never shrinks, and no band is
   * inert. The third is the one that matters — see the spec comment above.
   */
  if (spec.ladder) {
    const levels = spec.levels(m);
    const bands = spec.bands(m);
    const BAND = Math.round(levels / bands.length);
    if (BAND * bands.length !== levels) {
      push(`${key}: ${levels} levels does not divide into ${bands.length} bands`);
    }

    const prev = {};
    let prevMech = 0;
    for (let lv = 1; lv <= levels; lv++) {
      const c = cfgOf(lv);
      for (const [f, dir] of Object.entries(spec.fields)) {
        const v = c[f];
        if (typeof v !== 'number' || Number.isNaN(v)) { push(`${key} L${lv}: ${f} is not a number`); continue; }
        if (lv > 1) {
          const worse = dir === 'up' ? v < prev[f] : v > prev[f];
          if (worse) push(`${key} L${lv}: ${f} moved the wrong way (${prev[f]} → ${v}, expected ${dir})`);
        }
        prev[f] = v;
      }
      const mech = (c.mechanics || []).length;
      if (mech < prevMech) push(`${key} L${lv}: the mechanic set SHRANK (${prevMech} → ${mech}) — a band may add, never remove`);
      prevMech = mech;
      checked++;
    }

    // No band may be inert: it adds a mechanic, or it moves a structural lever.
    for (let b = 1; b < bands.length; b++) {
      const lo = cfgOf((b - 1) * BAND + 1);
      const hi = cfgOf(b * BAND + 1);
      const addsSomething = (bands[b].adds || []).length > 0;
      const movedStructure = (spec.structural || []).some((f) => lo[f] !== hi[f]);
      if (!addsSomething && !movedStructure) {
        push(`${key} band ${b + 1} (L${b * BAND + 1}–${(b + 1) * BAND}): INERT — `
          + 'it introduces no mechanic and moves no structural lever, so it is ten levels of '
          + 'the same game slightly faster. Add something or delete the band.');
      }
    }
    if (!(bands[0]?.adds || []).length) push(`${key} band 1: the first band must name the core mechanic in \`adds\``);
    continue;
  }

  const diffs = spec.diffs(m);
  const levelsPerTier = spec.levels(m);

  // 1. monotonic within each tier
  for (const diff of diffs) {
    const prev = {};
    for (let lv = 1; lv <= levelsPerTier; lv++) {
      const c = cfgOf(diff, lv);
      for (const [f, dir] of Object.entries(spec.fields)) {
        const v = c[f];
        if (typeof v !== 'number' || Number.isNaN(v)) { push(`${key} ${diff} L${lv}: ${f} is not a number`); continue; }
        if (lv > 1) {
          const worse = dir === 'up' ? v < prev[f] : v > prev[f];
          if (worse) push(`${key} ${diff} L${lv}: ${f} moved the wrong way (${prev[f]} → ${v}, expected ${dir})`);
        }
        prev[f] = v;
      }
      checked++;
    }
    // the tier must actually go somewhere
    const lo = cfgOf(diff, 1);
    const hi = cfgOf(diff, levelsPerTier);
    const moved = Object.keys(spec.fields).some((f) => lo[f] !== hi[f]);
    if (!moved) push(`${key} ${diff}: nothing changes between L1 and L${levelsPerTier} — the tier is flat`);
  }

  /*
   * 2. A harder tier must be harder AT THE SAME LEVEL NUMBER.
   *
   * ⚠ Not "the end of Easy vs the start of Medium". The first version of this
   * check compared tier seams and flagged both games — wrongly. Tiers are
   * PARALLEL tracks the player picks between, not one continuous ladder: levels
   * unlock in order *within* a tier, and nobody ever plays easy L100 followed by
   * med L1. Comparing across that seam measures a journey no one takes, and it
   * fails games that deliberately trade levers at a tier bump (Keep Track hands
   * you a slower stream when it adds a category to track).
   *
   * What "Medium" and "Hard" actually promise is that at any given depth, the
   * harder label is the harder game. That is also the real content of the MOT
   * bug — starting Hard was easier than the same depth of Medium, so the labels
   * lied. This asserts the promise the label makes.
   */
  for (let i = 0; i < diffs.length - 1; i++) {
    const lower = diffs[i];
    const upper = diffs[i + 1];
    for (const lv of [1, Math.round(levelsPerTier / 2), levelsPerTier]) {
      const lo = cfgOf(lower, lv);
      const hi = cfgOf(upper, lv);
      for (const [f, dir] of Object.entries(spec.fields)) {
        const easier = dir === 'up' ? hi[f] < lo[f] : hi[f] > lo[f];
        if (easier) {
          push(`${key} L${lv}: "${upper}" is EASIER than "${lower}" on ${f} `
            + `(${lower}=${lo[f]}, ${upper}=${hi[f]}). The difficulty label lies.`);
        }
      }
    }
  }
}

/* ── the honest gap ── */
/*
 * ── LADDERS THAT ARE A PATH THROUGH AUTHORED CONTENT ──
 *
 * cancel-task and rush-hour do not have a curve to rewrite: their difficulty is
 * an authored curriculum (a hand-built target series per tier; a curated puzzle
 * bank). Their ladders WALK that content rather than replacing it, so the thing
 * to assert is that the walk climbs — not that some formula is monotonic.
 *
 * Their content stays gated where it always was (audit:fq, validate:rh); this
 * checks the PATH.
 */
for (const [key, spec] of Object.entries({
  'cancel-task': {
    mod: '../shared/focusQuestData.js',
    bands: (m) => m.FQ_LADDER,
    levels: (m) => m.FQ_LADDER_LEVELS,
    cfg: (m) => (lv) => {
      const c = m.ladderLvCfg(lv);
      return { tc: c.tc, secPerTarget: c.time / Math.max(1, c.tc), grid: c.grid };
    },
    fields: { tc: 'up', secPerTarget: 'down' },
    bandField: 'grid',
    identity: (m) => (lv) => { const { diff, li } = m.ladderToTier(lv); return `${diff}-${li}`; },
  },
  'rush-hour': {
    mod: 'reasoning/games/rush-hour/data.js',
    bands: (m) => m.RH_LADDER,
    levels: (m) => m.RH_LADDER_LEVELS,
    cfg: (m) => (lv) => {
      const { diff, li } = m.rhLadderToTier(lv);
      return { tier: ['easy', 'medium', 'hard'].indexOf(diff), li };
    },
    fields: { li: 'up' },
    bandField: 'tier',
    identity: (m) => (lv) => { const { diff, li } = m.rhLadderToTier(lv); return `${diff}-${li}`; },
  },
})) {
  let m;
  try {
    m = await import(`file:///${path.join(D, spec.mod).replace(/\\/g, '/')}`);
  } catch (e) {
    push(`${key}: could not import ${spec.mod} — ${e.message}`);
    continue;
  }
  const cfgOf = spec.cfg(m);
  const levels = spec.levels(m);
  const bands = spec.bands(m);
  if (levels !== bands.length * 10) push(`${key}: ${levels} levels over ${bands.length} bands`);

  /*
   * ⚠ MONOTONICITY IS CHECKED WITHIN A BAND, NOT ACROSS BAND EDGES — and that
   * is a measured decision, not a loosened rule.
   *
   * These ladders walk authored TIERS, and the tiers do not chain: Cancellation
   * steps its board 5×5 → 7×7 → 9×9 at a tier bump and RESETS the target count
   * lower, because a handful of targets on a 49-cell board is harder than more
   * on a 25-cell one. Asserting raw `tc` across that seam reported a real trade
   * as a regression (L21: 8 → 7). This is the same reason the tiered half of
   * this script compares tiers at the SAME level number rather than end-to-start.
   *
   * So: within a band the curriculum must climb, and at a band edge the BOARD
   * must grow instead (`bandField`). A seam that trades nothing fails.
   */
  /*
   * ⚠ …AND ACROSS A BAND, NOT LEVEL TO LEVEL.
   *
   * The authored series has integer rounding: `tc` steps by whole targets while
   * `time` is a rounded sigmoid, so seconds-per-target jitters by hundredths
   * between adjacent authored levels (3.125 → 3.222 at L25). `audit:fq` owns
   * that content and already gates its shape and its feasibility; asserting a
   * tighter monotonicity here would fail working, verified curriculum and
   * pressure someone into re-tuning it to satisfy a second opinion.
   *
   * What this ladder is responsible for is that the WALK climbs. So: band start
   * to band end.
   */
  for (let lv = 1; lv <= levels; lv++) {
    const c = cfgOf(lv);
    for (const f of Object.keys(spec.fields)) {
      if (typeof c[f] !== 'number' || Number.isNaN(c[f])) push(`${key} L${lv}: ${f} is not a number`);
    }
    checked++;
  }
  for (let b = 0; b < bands.length; b++) {
    const lo = cfgOf(b * 10 + 1);
    const hi = cfgOf(b * 10 + 10);
    for (const [f, dir] of Object.entries(spec.fields)) {
      const worse = dir === 'up' ? hi[f] < lo[f] - 1e-9 : hi[f] > lo[f] + 1e-9;
      if (worse) push(`${key} band ${b + 1}: ${f} ends worse than it starts (${lo[f]} → ${hi[f]}, expected ${dir})`);
    }
  }

  /* Every band edge must buy something: the board grows, or the tier does. */
  for (let b = 1; b < bands.length; b++) {
    const before = cfgOf((b - 1) * 10 + 1);
    const now = cfgOf(b * 10 + 1);
    const f = spec.bandField;
    if (now[f] < before[f]) push(`${key} band ${b + 1}: ${f} went DOWN (${before[f]} → ${now[f]})`);
    const grew = now[f] > before[f];
    const climbed = Object.entries(spec.fields).some(([k, dir]) => (
      dir === 'up' ? now[k] > before[k] : now[k] < before[k]
    ));
    if (!grew && !climbed) push(`${key} band ${b + 1}: INERT — the board did not grow and nothing else got harder`);
  }

  /* ⚠ A path must not stall: no two rungs may play the SAME authored level. */
  const seen = new Set();
  for (let lv = 1; lv <= levels; lv++) {
    const id = spec.identity(m)(lv);
    if (seen.has(id)) { push(`${key} L${lv}: plays authored level ${id}, already used by an earlier rung — the path repeats`); break; }
    seen.add(id);
  }
}

const gateable = new Set([...Object.keys(CURVES), 'cancel-task', 'rush-hour']);
const elsewhereGated = new Set(['cancel-task', 'mot', 'rush-hour']); // audit:fq, audit:mot, validate:rh
const ungated = games
  .filter((g) => !gateable.has(g.key) && !elsewhereGated.has(g.key))
  .filter((g) => {
    const files = fs.readdirSync(g.dir);
    return files.some((f) => /\.(jsx?|js)$/.test(f)
      && /levelCfg|levelSpec|cfgFor|specForLevel|levelSchedule/.test(fs.readFileSync(path.join(g.dir, f), 'utf8')));
  });

console.log(`audit-curves: ${checked} level configs checked across ${Object.keys(CURVES).length} games`);
console.log(`  gated here:      ${[...gateable].join(', ')}`);
console.log(`  gated elsewhere: cancel-task (audit:fq), mot (audit:mot)`);
if (ungated.length) {
  console.log(`\n  ⚠ ${ungated.length} game(s) have a level curve that CANNOT be gated where it sits,`);
  console.log('    because the config lives in a React file rather than a data module:');
  ungated.forEach((g) => console.log(`      ${g.key.padEnd(20)} ${g.dom}/games/${g.folder}`));
  console.log('    Move each curve into a data.js and add it to CURVES above.');
}

if (problems.length) {
  console.error(`\nFAILED — ${problems.length} problem(s):`);
  problems.slice(0, 20).forEach((p) => console.error('  · ' + p));
  if (problems.length > 20) console.error(`  · …and ${problems.length - 20} more`);
  process.exit(1);
}
console.log('\naudit-curves: OK');
