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
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
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

for (const abs of files) {
  const rel = relative(ROOT, abs).split(sep).join('/');
  if (rel === PALETTE) continue;
  const src = readFileSync(abs, 'utf8');
  const game = rel.match(/games\/([^/]+)\//)?.[1] ?? '(shared)';
  const lines = src.split('\n');

  lines.forEach((line, i) => {
    const at = `${rel}:${i + 1}`;
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;   // comments may cite old values

    // 1. Raw colour in ANY syntax, not just hex.
    const colour = line.match(/#[0-9a-fA-F]{3,8}\b|0x[0-9a-fA-F]{6}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/);
    if (colour && !/--game-|--play-|--surface|--ink|--line|--accent/.test(line)) {
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

if (!findings.length) {
  console.log('audit-design: OK — no structural drift found.');
  console.log('(Source-level only. It cannot tell you whether the game LOOKS right.)');
  process.exit(0);
}

console.log(`audit-design: ${findings.length} finding(s)\n`);
for (const [rule, list] of [...groups].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`── ${rule} (${list.length})`);
  for (const f of list.slice(0, 12)) console.log(`   ${f.file}  ${f.detail}`);
  if (list.length > 12) console.log(`   … and ${list.length - 12} more`);
  console.log('');
}
process.exit(1);
