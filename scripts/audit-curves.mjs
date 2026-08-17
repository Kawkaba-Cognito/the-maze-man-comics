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
  'keep-track': {
    mod: 'memory/games/keep-track/data.js',
    get: (m) => (diff, lv) => m.levelCfg(diff, lv),
    diffs: (m) => Object.keys(m.BASE),
    levels: (m) => m.LEVELS_PER_TIER,
    fields: { targets: 'up', stream: 'up', rate: 'down' },
  },
  /* Moved out of index.jsx on 2026-08-15 so it could be gated at all. `gap`
     falls (faster gates) and `target`/`opCount` rise, and opCount is what makes
     a harder TIER harder at the same level number — easy never sees × or ÷. */
  'math-gates': {
    mod: 'speed/games/math-gates/mathGatesData.js',
    get: (m) => (diff, lv) => m.levelCfg(diff, lv),
    diffs: (m) => Object.keys(m.BASE),
    levels: (m) => m.LEVELS_PER_TIER,
    fields: { gap: 'down', target: 'up', opCount: 'up' },
  },
  /* Also moved out of index.jsx the same day (palData.js), for the pacing gate;
     registering it here closes the second half of the same gap. */
  'paired-associates': {
    mod: 'memory/games/paired-associates/palData.js',
    get: (m) => (diff, lv) => m.levelCfg(diff, lv),
    diffs: (m) => Object.keys(m.BASE),
    levels: () => 100,
    fields: { boxes: 'up', pairs: 'up', study: 'down' },
  },
  /* Story Time joined the gateable list on 2026-08-17, when the builder was
     replaced by Kawkab's questions and the curve moved to data.js. Note that
     raw `memo` is deliberately NOT a field here: a six-scene story is given
     more seconds than a four-scene one, so the honest lever is SECONDS PER
     SCENE, which falls in both directions. Gating `memo` would report the hard
     tier as easier. */
  'story-grid': {
    mod: 'memory/games/story-grid/data.js',
    get: (m) => (diff, lv) => m.levelCfg(diff, lv),
    diffs: (m) => Object.keys(m.BASE),
    levels: (m) => m.LEVELS_PER_TIER,
    fields: { len: 'up', questions: 'up', opts: 'up', memoPerPanel: 'down' },
  },
  /* Detective became Liars' Ring on 2026-08-17 and its curve moved out of the
     old noir engine into data.js. All four levers are things the player feels:
     more suspects, a richer statement kit, more rules in play and more question
     shapes. Deliberately NO time lever — this is the one game where thinking
     longer is the correct play. */
  detective: {
    mod: 'reasoning/games/detective/data.js',
    get: (m) => (diff, lv) => m.levelCfg(diff, lv),
    diffs: (m) => Object.keys(m.BASE),
    levels: (m) => m.LEVELS_PER_TIER,
    fields: { suspects: 'up', kitSize: 'up', ruleCount: 'up', questionCount: 'up', evidenceChance: 'up' },
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
    get: (m) => (diff, lv) => m.levelCfg(diff, lv),
    diffs: (m) => Object.keys(m.BASE),
    levels: (m) => m.LEVELS_PER_TIER,
    fields: {
      lanes: 'up', perWave: 'up', concurrency: 'up', kindCount: 'up',
      visibleMs: 'down', tol: 'down',
    },
  },
  'mirror-world': {
    mod: 'flexibility/games/mirror-world/data.js',
    get: (m) => (diff, lv) => {
      const adapt = m.levelSchedule(diff, lv).find((b) => b.role === m.ROLE.ADAPT);
      return { rotation: adapt.rotation, targets: adapt.targets };
    },
    diffs: (m) => Object.keys(m.BASE),
    levels: (m) => m.LEVELS_PER_TIER,
    fields: { rotation: 'up', targets: 'up' },
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
const gateable = new Set(Object.keys(CURVES));
const elsewhereGated = new Set(['cancel-task', 'mot']); // audit:fq, audit:mot
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
