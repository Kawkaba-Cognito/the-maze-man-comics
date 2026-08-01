#!/usr/bin/env node
/*
 * audit-design — catch visual drift across the training games before a human does.
 *
 * Every rule here exists because something got past a weaker check and had to be
 * found by eye. The failures it is built from, in order:
 *
 *   1. Counting `#hex` missed `rgba(...)` entirely — six raw colours in one game.
 *   2. A game imported UniverseStage (a dusk starfield) while every other game
 *      sat on the light play surface, so it read as a different app.
 *   3. A game's background was gated on a condition (`isCosmos ? undefined : …`)
 *      so the fix applied to a branch the player never hit.
 *   4. A game painted its own full-bleed backdrop INSIDE the play screen, which
 *      covered the surface underneath. Three separate "I fixed the background"
 *      changes were invisible because of it.
 *   5. A game rendered a different component than the one being edited — the
 *      file under repair was a fallback, not the live board.
 *
 * WHAT IT CANNOT DO: it reads source, so it cannot see the rendered result. It
 * would not have caught full-strength stimulus colours reading as "candy" next
 * to muted ones — that needs a screenshot. Treat a green run as "no known
 * structural drift", never as "looks right".
 *
 * ── The ratchet (2026-08-01) ──────────────────────────────────────────────
 * This script used to exit 1 on ANY finding. With ~690 pre-existing findings
 * that meant it could never go into CI, so it only ran when someone remembered
 * — and the thing it guards against went on drifting. A gate nobody can turn on
 * is not a gate.
 *
 * It now compares against `design-baseline.json`, a per-rule count of the debt
 * that already existed, and fails only when a number goes UP or a NEW rule
 * appears. That makes it safe to run on every push TODAY, while the backlog is
 * paid down separately.
 *
 * The baseline is a DEBT CEILING, not a target. It ratchets down on its own:
 * any run that comes in under baseline rewrites the file lower, so once you fix
 * something it can never silently come back. Only `--update` can raise it, and
 * raising it should be a deliberate, reviewed act.
 *
 *   node scripts/audit-design.mjs            # gate (CI)
 *   node scripts/audit-design.mjs --update   # accept current counts as the ceiling
 *   node scripts/audit-design.mjs --list     # show every finding, ignore baseline
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath, not .pathname — this repo's path contains a space, which
// .pathname leaves percent-encoded and readdir then cannot resolve.
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const GAMES_DIR = join(ROOT, 'src/features/training/domains');
const PALETTE = 'src/features/training/shared/gamePalette.js';

/* Games whose 3D scene is built from additive blending + bloom. Additive on a
 * light ground resolves to nothing, so these legitimately take Tide Deep. Any
 * OTHER game reaching for the deep surface is drift. */
const DEEP_ALLOWED = ['story-grid', 'detective'];

const findings = [];
const add = (file, rule, detail) => findings.push({ file, rule, detail });

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx?|css)$/.test(p)) out.push(p);
  }
  return out;
}

const files = walk(GAMES_DIR);

/*
 * Palette exemptions.
 *
 * "No raw colour" is the right rule for CHROME — panels, cards, text, states —
 * because that is what has to change as one when the palette changes. It is the
 * WRONG rule for hand-drawn scene art: Detective's noir rooms are SVG
 * illustrations (a telescope dome, brickwork, a lamp filament), and flattening
 * a drawing into six semantic tokens would destroy it, not unify it. Counting
 * those 200-odd colours as debt would also push whoever next reads this report
 * toward exactly that mistake.
 *
 * So a file may opt out by declaring, in its first 40 lines:
 *
 *     @palette-exempt: hand-drawn scene art, not chrome
 *
 * The reason is required and the count of exempt files is printed on every run,
 * so exemptions stay visible and reviewable instead of becoming a silent
 * escape hatch. Exempt files are still checked by every OTHER rule.
 */
const EXEMPT_RE = /@palette-exempt:\s*(\S.*)/;
const exempt = [];

for (const abs of files) {
  const rel = relative(ROOT, abs).split(sep).join('/');
  if (rel === PALETTE) continue;
  const src = readFileSync(abs, 'utf8');
  const game = rel.match(/games\/([^/]+)\//)?.[1] ?? '(shared)';
  const lines = src.split('\n');
  const exemptMatch = lines.slice(0, 40).join('\n').match(EXEMPT_RE);
  const paletteExempt = Boolean(exemptMatch);
  if (paletteExempt) exempt.push({ file: rel, reason: exemptMatch[1].trim() });

  lines.forEach((line, i) => {
    const at = `${rel}:${i + 1}`;
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;   // comments may cite old values

    // 1. Raw colour in ANY syntax, not just hex.
    const colour = line.match(/#[0-9a-fA-F]{3,8}\b|0x[0-9a-fA-F]{6}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/);
    // A line that USES a token is fine even though the token's own definition
    // contains a colour — that is the one place a literal belongs. GAME_FX /
    // --fx-* are the shared effect tokens (scrim, shadow, hairline, glint).
    const usesToken = /--game-|--play-|--surface|--ink|--line|--accent|--fx-|GAME_FX\./.test(line);
    if (colour && !paletteExempt && !usesToken) {
      add(at, 'raw-colour', colour[0]);
    }

    // 2. A surface from outside the shared palette.
    if (/UniverseStage/.test(line) && /import|<UniverseStage/.test(line)) {
      add(at, 'foreign-surface', 'UniverseStage — games use --play-surface');
    }

    // 3. Deep surface outside the games that need it.
    if (/play-surface-deep/.test(line) && !DEEP_ALLOWED.includes(game)) {
      add(at, 'deep-surface', `${game} is not additive-blended; use --play-surface`);
    }

    // 4. A background behind a condition — half the states go unstyled.
    if (/background[^:]*:\s*[^;,]*\?[^;,]*(undefined|null|'')/.test(line)) {
      add(at, 'conditional-background', line.trim().slice(0, 70));
    }
  });

  // 5. More than one full-bleed backdrop inside a play screen. The extra one
  //    paints over the surface and makes every surface fix invisible.
  const backdrops = (src.match(/(position:\s*['"]?absolute[^}]{0,90}inset:\s*['"]?0)|(-sky|-nebula|-stars)\b/g) || []).length;
  if (backdrops >= 3) {
    add(rel, 'stacked-backdrops', `${backdrops} full-bleed layers — is one covering the play surface?`);
  }
}

/* 6. A game that still ships a 3D proto AND a 2D board can render the file you
 *    are not editing. Report the pairing so it is a decision, not a surprise. */
const byGame = new Map();
for (const abs of files) {
  const rel = relative(ROOT, abs).split(sep).join('/');
  const g = rel.match(/games\/([^/]+)\//)?.[1];
  if (!g) continue;
  if (!byGame.has(g)) byGame.set(g, []);
  byGame.get(g).push(rel);
}
for (const [game, list] of byGame) {
  const has3D = list.some((f) => /3DProto|3DBoard|Stage3D/.test(f));
  const has2D = list.some((f) => /Board2D|board2d/i.test(f));
  if (has3D && has2D) add(game, 'two-boards', 'ships a 3D proto and a 2D board — which one renders?');
}

const groups = new Map();
for (const f of findings) {
  if (!groups.has(f.rule)) groups.set(f.rule, []);
  groups.get(f.rule).push(f);
}

const reportExemptions = () => {
  if (!exempt.length) return;
  console.log(`palette-exempt files (${exempt.length}) — raw-colour rule skipped:`);
  for (const e of exempt) console.log(`   ${e.file} — ${e.reason}`);
  console.log('');
};

const show = (limit) => {
  for (const [rule, list] of [...groups].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`── ${rule} (${list.length})`);
    for (const f of list.slice(0, limit)) console.log(`   ${f.file}  ${f.detail}`);
    if (list.length > limit) console.log(`   … and ${list.length - limit} more`);
    console.log('');
  }
};

/* ── ratchet ─────────────────────────────────────────────────────────────── */

const BASELINE = join(ROOT, 'scripts/design-baseline.json');
const args = new Set(process.argv.slice(2));
const counts = Object.fromEntries([...groups].map(([rule, list]) => [rule, list.length]));

/* Per-FILE counts as well as per-rule.
 *
 * A rule total alone tells you "raw-colour went 689 → 690" and then prints the
 * twelve oldest offenders, which are not the ones you just added — useless at
 * the moment you need it. Keeping counts per file lets the gate point at the
 * file that actually got worse, which is the only thing the person who broke it
 * needs to know. */
const perFile = {};
for (const f of findings) {
  const file = String(f.file).split(':')[0];
  perFile[file] ??= {};
  perFile[file][f.rule] = (perFile[file][f.rule] ?? 0) + 1;
}
const snapshot = () => ({ rules: counts, files: perFile });

if (args.has('--list')) {
  reportExemptions();
  console.log(`audit-design: ${findings.length} finding(s) — full list, baseline ignored\n`);
  show(Number.MAX_SAFE_INTEGER);
  process.exit(0);
}

if (args.has('--update')) {
  writeFileSync(BASELINE, `${JSON.stringify(snapshot(), null, 2)}\n`);
  console.log('audit-design: baseline updated to current counts.');
  for (const [rule, n] of Object.entries(counts)) console.log(`   ${rule}: ${n}`);
  console.log('\nA raised ceiling is new debt — say so in the commit message.');
  process.exit(0);
}

const baseline = existsSync(BASELINE)
  ? JSON.parse(readFileSync(BASELINE, 'utf8'))
  : null;

if (!baseline?.rules) {
  console.log('audit-design: no baseline yet. Run with --update to record one.');
  show(12);
  process.exit(1);
}

const baseRules = baseline.rules;
const baseFiles = baseline.files ?? {};

const regressions = [];
for (const [rule, n] of Object.entries(counts)) {
  const allowed = baseRules[rule] ?? 0;
  if (n > allowed) regressions.push({ rule, n, allowed });
}

if (regressions.length) {
  console.log(`audit-design: ${regressions.length} rule(s) got WORSE\n`);
  for (const r of regressions) {
    console.log(`── ${r.rule}: ${r.n} (baseline ${r.allowed}, +${r.n - r.allowed})`);
    // Name the FILES that grew, and show only their findings — the ones the
    // person who just broke this actually needs.
    const grew = Object.keys(perFile)
      .filter((file) => (perFile[file][r.rule] ?? 0) > (baseFiles[file]?.[r.rule] ?? 0))
      .sort();
    if (grew.length) {
      for (const file of grew) {
        const was = baseFiles[file]?.[r.rule] ?? 0;
        console.log(`   ${file}  ${was} → ${perFile[file][r.rule]}`);
        for (const f of (groups.get(r.rule) || [])) {
          if (String(f.file).split(':')[0] === file) console.log(`      ${f.file}  ${f.detail}`);
        }
      }
    } else {
      // Only reachable if a file was renamed; fall back to the whole list.
      console.log('   (no single file grew — a file may have been renamed)');
      for (const f of (groups.get(r.rule) || []).slice(0, 12)) {
        console.log(`      ${f.file}  ${f.detail}`);
      }
    }
    console.log('');
  }
  console.log('Fix the new ones, or run --update if the increase is genuinely intended.');
  process.exit(1);
}

// Came in at or under the ceiling: lower it, so fixed drift cannot creep back.
const improved = Object.keys(baseRules).filter((rule) => (counts[rule] ?? 0) < baseRules[rule]);
if (improved.length) {
  const lines = improved.map((rule) => `   ${rule}: ${baseRules[rule]} → ${counts[rule] ?? 0}`);
  // CI is read-only. A runner rewriting a tracked file cannot commit it, so the
  // "improvement" would silently evaporate and, worse, make the working tree
  // dirty for the publish step. Report there; write only on a developer machine.
  if (process.env.CI) {
    console.log('audit-design: OK — better than baseline:');
    console.log(lines.join('\n'));
    console.log('\nRun `npm run audit:design` locally to lower scripts/design-baseline.json.');
    process.exit(0);
  }
  const nextRules = { ...baseRules };
  for (const rule of improved) {
    if ((counts[rule] ?? 0) === 0) delete nextRules[rule];
    else nextRules[rule] = counts[rule];
  }
  writeFileSync(BASELINE, `${JSON.stringify({ rules: nextRules, files: perFile }, null, 2)}\n`);
  console.log('audit-design: OK — and the baseline ratcheted DOWN:');
  console.log(lines.join('\n'));
  console.log('\nCommit scripts/design-baseline.json with your change.');
  process.exit(0);
}

const total = findings.length;
reportExemptions();
console.log(
  total
    ? `audit-design: OK — ${total} known finding(s), none worse than baseline.`
    : 'audit-design: OK — no structural drift found.',
);
console.log('(Source-level only. It cannot tell you whether the game LOOKS right.)');
process.exit(0);
