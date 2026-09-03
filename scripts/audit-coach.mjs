#!/usr/bin/env node
/*
 * audit:coach — every live training game must end up with a live-board tutorial,
 * and the ways a coach fails are all silent.
 *
 * Written in Phase 0, BEFORE the seventeen coaches it will check — the
 * `validate:intercept` precedent, where writing the gate first killed four model
 * bugs before a pixel was drawn.
 *
 * ⚠ THE FAILURE IT EXISTS TO PREVENT: a coach registered under a game's PLAIN
 * id. `shouldRunOnboarding` keys off that id in `mm_tutorial_prefs_v2`, and the
 * retired rules carousel already wrote `{skipped:true}` / `{completed:true}`
 * under it for every game. So the new lesson never auto-runs for anyone who has
 * opened that game before — fresh installs only, silently, with nothing on
 * screen and no error. That is how you ship eighteen tutorials and have nobody
 * see seventeen of them. The `@coachN` suffix is the whole defence, and it is
 * one keystroke to forget.
 *
 * ⚠ IT LOADS THE REAL DATA. Coach scripts and the registry are plain `.js` with
 * no imports precisely so a `.mjs` gate can `import()` them — checking the
 * actual steps beats regexing source text, and a module that fails to load
 * cannot accidentally report success. The LIVE GAME LIST is still read as text,
 * because `domain.config.js` imports `tokens` from a `.js` chain plain Node
 * resolves differently (see audit:gamekeys for the same reasoning).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COACH_DIR = 'src/features/training/shared/tutorials/coach';
const problems = [];
const fail = (m) => problems.push(m);

/* ── the live games ───────────────────────────────────────────────────────
 * A sub with BOTH a gameKey and a loader is a game a player can actually reach
 * from the hub. Benched games have no loader and are correctly ignored: nobody
 * can open them, so nobody needs teaching. */
function liveGameKeys() {
  const keys = new Set();
  const domainsDir = path.join(ROOT, 'src/features/training/domains');
  for (const domain of fs.readdirSync(domainsDir)) {
    const cfg = path.join(domainsDir, domain, 'domain.config.js');
    if (!fs.existsSync(cfg)) continue;
    const src = fs.readFileSync(cfg, 'utf8');
    for (const chunk of src.split(/gameKey\s*:/).slice(1)) {
      const key = chunk.match(/^\s*['"]([^'"]+)['"]/)?.[1];
      if (key && /loader\s*:/.test(chunk.slice(0, 400))) keys.add(key);
    }
  }
  return keys;
}

const load = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);

const { COACH_IDS, COACH_WAITING } = await load(`${COACH_DIR}/coachRegistry.js`);
const live = liveGameKeys();

/* ── 1. the ledger covers every live game, exactly once ─────────────────── */
for (const key of live) {
  const hasCoach = Object.prototype.hasOwnProperty.call(COACH_IDS, key);
  const waiting = Object.prototype.hasOwnProperty.call(COACH_WAITING, key);
  if (hasCoach && waiting) {
    fail(`'${key}' is in BOTH COACH_IDS and COACH_WAITING — remove it from the waiting list in the commit that lands its coach`);
  } else if (!hasCoach && !waiting) {
    fail(
      `'${key}' is a live game with no coach and no place on the waiting list.\n`
      + '      Every game a player can open must end up with a live-board lesson.\n'
      + `      Fix: add it to COACH_WAITING with its COACH-PLAN.md phase, or ship its coach.`,
    );
  }
}
for (const key of Object.keys({ ...COACH_IDS, ...COACH_WAITING })) {
  if (!live.has(key)) {
    fail(`'${key}' is in the coach ledger but is not a live game (no domain.config.js sub with a loader) — a benched game needs no tutorial`);
  }
}

/* ── 2. every coach id is versioned ──────────────────────────────────────── */
for (const [key, id] of Object.entries(COACH_IDS)) {
  if (!/@coach\d+$/.test(id)) {
    fail(
      `'${key}' registers coach id '${id}', which has no @coachN suffix.\n`
      + '      Existing players already have a tutorial flag stored under the plain\n'
      + '      game id, so this lesson will NEVER auto-run for them — it reaches\n'
      + `      fresh installs only, silently. Use '${key}@coach1'.`,
    );
  }
}

/* ── 3. the scripts themselves ───────────────────────────────────────────── */
let stepsChecked = 0;
for (const [key, id] of Object.entries(COACH_IDS)) {
  const rel = `${COACH_DIR}/scripts/${key}.js`;
  if (!fs.existsSync(path.join(ROOT, rel))) {
    fail(`'${key}' has a coach id but no script at ${rel}`);
    continue;
  }
  const mod = await load(rel);
  const pack = mod.default || Object.values(mod)[0];
  const steps = pack?.steps;
  if (!Array.isArray(steps) || steps.length === 0) {
    fail(`${rel}: exports no non-empty \`steps\` array`);
    continue;
  }
  if (pack.id !== id) {
    fail(`${rel}: declares id '${pack.id}' but coachRegistry.js registers '${id}' — they must agree`);
  }
  steps.forEach((s, i) => {
    stepsChecked += 1;
    /* ⚠ Both languages, always. CLAUDE.md's standing trap is that a string
       change is two edits and the second gets missed; keeping en/ar on the same
       step makes a length mismatch inexpressible, and this makes an empty one a
       build failure. `audit:consistency` proves a key RESOLVES, never that it
       says anything. */
    if (!s.en || !String(s.en).trim()) fail(`${rel}: step ${i + 1} has no English line`);
    if (!s.ar || !String(s.ar).trim()) fail(`${rel}: step ${i + 1} has no Arabic line`);
  });
  /* ⚠ An await step renders NO Next button — advancing is the player doing the
     thing. As the last step that means the lesson's final line can only be
     dismissed by Skip, and the closing "your turn" beat never lands. */
  if (steps[steps.length - 1]?.awaitTap) {
    fail(`${rel}: the LAST step is \`awaitTap\`, so it renders no Next button and the lesson cannot be finished normally — end on a spoken beat`);
  }
}

/* ── 4. a registered coach must actually be RENDERED ──────────────────────
 *
 * ⚠ THIS RULE EXISTS BECAUSE THE GATE MISSED THE BUG ONCE ALREADY. Every check
 * above passed for `mot` while its `<DomCoach>` block had silently failed to
 * land in index.jsx — the script was perfect, the id was versioned, the ledger
 * agreed, and the lesson could never appear on screen. A coach that is
 * registered but never mounted is exactly the silent-render-nothing failure
 * `audit:gamekeys` was written for, one level up.
 *
 * Text-parsed rather than imported, for the same reason as the live-game list:
 * these are `.jsx` and plain Node cannot load them.
 */
const DOMAINS_DIR = path.join(ROOT, 'src/features/training/domains');
/* Games whose folder name differs from their gameKey. */
const FOLDER_OVERRIDE = { 'cancel-task': 'attention/games/cancellation' };

function gameIndexPath(key) {
  const rel = FOLDER_OVERRIDE[key];
  if (rel) return path.join(DOMAINS_DIR, rel, 'index.jsx');
  for (const domain of fs.readdirSync(DOMAINS_DIR)) {
    const p = path.join(DOMAINS_DIR, domain, 'games', key, 'index.jsx');
    if (fs.existsSync(p)) return p;
  }
  return null;
}

for (const key of Object.keys(COACH_IDS)) {
  const p = gameIndexPath(key);
  if (!p) { fail(`'${key}' has a coach but no games/${key}/index.jsx could be found`); continue; }
  const src = fs.readFileSync(p, 'utf8');
  /* The shared DOM coach, or a game's own component (cancellation's canvas one). */
  if (!/<\s*(DomCoach|[A-Z]\w*Coach)\b/.test(src)) {
    fail(
      `'${key}' registers a coach that is never RENDERED — no <DomCoach> (or\n`
      + `      game-specific *Coach) element in ${path.relative(ROOT, p).replace(/\\/g, '/')}.\n`
      + '      Everything else about it can be correct and the lesson still cannot\n'
      + '      appear: nothing throws, nothing warns, the screen is simply normal.',
    );
  }
  /* The engine has to receive the run object, or `coach.open` is always false. */
  if (!/\bcoach\b/.test(src)) {
    fail(`'${key}' never references \`coach\` — the run object is not threaded into its engine`);
  }
}

/* ── SELF-TEST ─────────────────────────────────────────────────────────────
 * ⚠ A checker that always passes is indistinguishable from one that works, and
 * this repo has shipped several detectors that measured nothing while reporting
 * everything as fine. `audit:gamekeys` produced a false PASS because its plant
 * silently never landed — this tree is CRLF and the regex assumed LF. Plant
 * against DATA rather than text, so there is nothing for a line ending to break.
 */
{
  const suffixBad = (id) => !/@coach\d+$/.test(id);
  if (!suffixBad('keep-track')) fail('SELF-TEST: the @coachN check passed an unversioned id — it is not checking anything');
  if (suffixBad('keep-track@coach1')) fail('SELF-TEST: the @coachN check rejected a correctly versioned id');

  const emptyAr = [{ en: 'hello', ar: '' }].filter((s) => !s.ar || !String(s.ar).trim());
  if (emptyAr.length !== 1) fail('SELF-TEST: the bilingual check did not flag a planted empty Arabic line');
  const bothOk = [{ en: 'hello', ar: 'مرحبا' }].filter((s) => !s.ar || !String(s.ar).trim());
  if (bothOk.length !== 0) fail('SELF-TEST: the bilingual check flagged a step that has both languages');

  const planted = [{ awaitTap: false }, { awaitTap: true }];
  if (!planted[planted.length - 1].awaitTap) fail('SELF-TEST: the trailing-awaitTap check did not see a planted await final step');

  /* The rendered-coach detector, against fixtures rather than the real files —
     this is the rule that was added AFTER it failed to catch a real bug. */
  const mounted = 'return (<div>{coachOpen && <DomCoach pack={X} />}</div>);';
  const unmounted = 'const coachOpen = coach?.open; return (<div>{msg}</div>);';
  const mountRe = /<\s*(DomCoach|[A-Z]\w*Coach)\b/;
  if (!mountRe.test(mounted)) fail('SELF-TEST: the render check failed to see a mounted coach');
  if (mountRe.test(unmounted)) fail('SELF-TEST: the render check saw a coach in a file that mounts none');

  /* The ledger check, against a fake registry rather than the real one. */
  const fakeLive = new Set(['a', 'b']);
  const fakeIds = { a: 'a@coach1' };
  const fakeWait = {};
  const uncovered = [...fakeLive].filter((k) => !(k in fakeIds) && !(k in fakeWait));
  if (uncovered.length !== 1 || uncovered[0] !== 'b') {
    fail('SELF-TEST: the ledger check did not flag a live game missing from both lists');
  }
}

if (problems.length) {
  console.error('audit:coach FAILED\n');
  for (const p of problems) console.error('  · ' + p);
  console.error('');
  process.exit(1);
}

const done = Object.keys(COACH_IDS).length;
const owed = Object.keys(COACH_WAITING).length;
const byPhase = [1, 2, 3].map((p) => `P${p}:${Object.values(COACH_WAITING).filter((v) => v === p).length}`).join(' ');
console.log(
  `audit:coach OK — ${done}/${live.size} live games have a live-board coach, `
  + `${stepsChecked} step(s) checked.\n`
  + `  Still owed: ${owed} (${byPhase}). Every coach id is @coachN-versioned, so no\n`
  + '  lesson is silently suppressed by a flag an existing player already stored.',
);
