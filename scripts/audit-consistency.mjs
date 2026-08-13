/*
 * audit:consistency — does every registered training game meet the platform
 * standard, or is it quietly its own app?
 *
 * This exists because "it feels inconsistent" is unfalsifiable until it is
 * counted. N-Back was the outlier for months and nothing said so: it was the
 * only registered game on neither ModeShell nor STR_COMMON, hand-rolling its own
 * mode machine and retyping all 43 shared labels. A build, a lint and four gates
 * all passed while the memory domain felt like a different product.
 *
 * Same rule as audit:fq and audit:mot: assert the OUTCOME. Not "does the file
 * mention ModeShell" as a style note, but "does this game give the player the
 * same shell, the same words, and the same records as every other game".
 *
 * Run:  npm run audit:consistency          (report + exit 1 below threshold)
 *       npm run audit:consistency -- --list (per-game detail)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOMAINS_DIR = path.join(ROOT, 'src/features/training/domains');
const SHARED = path.join(ROOT, 'src/features/training/shared');

const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const exists = (p) => fs.existsSync(p);

/** Every source file under a game folder, recursively — see the note on RULES. */
function walk(dir, out = []) {
  if (!exists(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(jsx?|mjs|css)$/.test(e.name)) out.push(p);
  }
  return out;
}
const readTree = (dir) => walk(dir).map(read).join('\n');
const countTree = (dir) => walk(dir).reduce((a, p) => a + read(p).split('\n').length, 0);

/* ── Which games are actually reachable? Only registered subs count. ── */
const games = [];
for (const domain of fs.readdirSync(DOMAINS_DIR)) {
  const cfgPath = path.join(DOMAINS_DIR, domain, 'domain.config.js');
  if (!exists(cfgPath)) continue;
  const cfg = read(cfgPath);
  for (const block of cfg.match(/\{[^{}]*\}/g) || []) {
    const key = block.match(/gameKey:\s*'([^']+)'/)?.[1];
    const folder = block.match(/loader:\s*\(\)\s*=>\s*import\('\.\/games\/([^']+)'\)/)?.[1];
    if (key && folder) games.push({ key, folder, domain });
  }
}

const ratingSrc = read(path.join(ROOT, 'src/features/training/rating.js'));
const scienceSrc = read(path.join(SHARED, 'gameScience.js'));
const metaSrc = read(path.join(SHARED, 'tutorials/trainingMeta.js'));
const tileSrc = read(path.join(SHARED, 'GamePlanetTile.jsx'));
const coverKeys = tileSrc.match(/const COVER_KEYS = new Set\(\[([\s\S]*?)\]\)/)?.[1] || '';
const mainSrc = read(path.join(ROOT, 'src/main.jsx'));
const c3dProtoCss = read(path.join(SHARED, 'c3dProto.css'));
const c3dRootBlock = c3dProtoCss.match(/\.c3d-root\s*\{([\s\S]*?)\}/)?.[1] || '';
const sharedSurfaceChecks = [
  {
    label: '3D fallback styles load before lazy game chunks',
    ok: /features\/training\/shared\/c3dProto\.css/.test(mainSrc),
  },
  {
    label: '3D loading root follows the live play-surface tokens',
    ok: /background-color:\s*var\(--play-surface-flat\)/.test(c3dRootBlock)
      && /background-image:\s*var\(--play-surface\)/.test(c3dRootBlock),
  },
];

/*
 * The checklist. Each rule is what the PLAYER or the DATA gets, not a coding
 * preference — that is the line between a standard and a style guide.
 */
/*
 * ⚠ Every rule reads g.all — the WHOLE game folder, recursively — not index.jsx.
 * The first version of this audit read only index.jsx and produced confident
 * nonsense: Math Gates "had no trial log" (it is in MathGatesBoard2D.jsx) and
 * Detective "was not bilingual" (its index.jsx is 64 lines of delegation; the
 * strings live in noir/). A gate that measures the wrong file is worse than no
 * gate, because its output looks authoritative.
 */
const RULES = [
  { id: 'modeshell', w: 3, label: 'ModeShell (same 3 modes, same flow)',
    test: (g) => /from ['"][^'"]*shared\/ModeShell['"]/.test(g.all) },
  { id: 'strings', w: 3, label: 'shared labels (STR_COMMON directly or via ModeShell)',
    /*
     * ⚠ Measures whether the PLAYER sees the shared wording, not whether the
     * file contains a particular spread.
     *
     * The first version demanded `...STR_COMMON` in the game and failed 10
     * games. Nine of them retyped nothing at all — they take their pause, quit,
     * mode names and Pass n Play chrome from ModeShell, which is exactly right.
     * The real fault was one level up: ModeShell hard-coded 25 bilingual
     * literals and had already drifted from trainingStrings.js ('Choose
     * Difficulty' vs 'Choose difficulty', 'أضف لاعبَين' vs 'أضف لاعبين', and
     * both Replay and Retry rendering as 'إعادة'). Fixing the shell fixed all
     * twelve of its games at once; chasing the ten games would have fixed none.
     *
     * So: a game passes if it spreads STR_COMMON itself, OR if it delegates its
     * chrome to ModeShell — which now reads STR_COMMON.
     */
    test: (g) => /\.\.\.STR_COMMON\.(en|ar)/.test(g.all)
      || /from ['"][^'"]*shared\/ModeShell['"]/.test(g.all) },
  { id: 'bilingual', w: 3, label: 'English and Arabic strings',
    /*
     * Does the PLAYER get Arabic — not "is it written the way I expected".
     * Two earlier versions of this rule were wrong: `en:{…}/ar:{…}` dict shape
     * missed Math Gates (passes them inline as props) and bare `ar:` missed Rush
     * Hour (229 Arabic literals behind `isAr ? … : …` ternaries, no ar: key
     * anywhere). Arabic script present AND a language branch is the outcome.
     */
    test: (g) => /[؀-ۿ]/.test(g.all) && /\bisAr\b/.test(g.all) },
  { id: 'rating', w: 2, label: 'registered in rating.js',
    // rating.js is keyed by SHORT id (cancel, rush, stroop); the gameKey lives
    // in a field inside the entry, so that is what has to be matched.
    test: (g) => new RegExp(`gameKey:\\s*['"]${g.key}['"]`).test(ratingSrc) },
  { id: 'triallog', w: 2, label: 'createTrialLog (per-trial records)',
    test: (g) => /createTrialLog/.test(g.all) },
  /* Quotes optional, matching the `tutorial` rule below. They were required
     here, so a single-word key written without them — legal JS, and what you
     get from most editors — was reported as a MISSING entry on a game that had
     one. A gate that says "missing" about something present sends you looking
     in the wrong file. */
  { id: 'science', w: 2, label: 'gameScience entry',
    test: (g) => new RegExp(`['"]?${g.key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}['"]?\\s*:`).test(scienceSrc) },
  { id: 'tutorial', w: 2, label: 'trainingMeta entry (coach/tutorial)',
    test: (g) => new RegExp(`['"]?${g.key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}['"]?\\s*:`).test(metaSrc) },
  { id: 'cover', w: 1, label: 'cover art registered',
    test: (g) => coverKeys.includes(`'${g.key}'`) },
  { id: 'storage', w: 1, label: 'mm_* storage key',
    test: (g) => /['"]mm_[a-z0-9_]+['"]/i.test(g.all) },
  { id: 'sharedrng', w: 1, label: 'no local RNG copy',
    test: (g) => !/function\s+mulberry32|0x6D2B79F5/.test(g.all) },
  { id: 'palette', w: 2, label: 'themed loading state (no frozen colour before the game)',
    /*
     * A loading state must look like the thing about to arrive.
     *
     * Caught live 2026-08-10: ComicsScreen's fallback used a JS constant
     * (tokens.trainingPaletteSurface = '#fff7f2'), which cannot follow a CSS
     * theme, so every game launch flashed near-white in dark mode; Math Gates
     * then flashed `.c3d-root` blue (#b3cadd) before painting a 2D board. A
     * white-then-blue stutter on the path to all 18 games, invisible to lint,
     * build and every other gate.
     *
     * `.c3d-root` in a fallback is only correct when a 3D proto is what loads.
     */
    test: (g) => {
      const fallbacks = g.all.match(/fallback=\{[\s\S]{0,240}?\}(?=[\s>])/g) || [];
      const loads3d = /import\(['"]\.\/[A-Za-z]*3D[A-Za-z]*['"]\)/.test(g.all);
      const blueFallback = fallbacks.some((f) => /c3d-root/.test(f));
      const frozenHex = fallbacks.some((f) => /#[0-9a-f]{3,8}/i.test(f));
      return (!blueFallback || loads3d) && !frozenHex;
    } },
];

const MAX = RULES.reduce((a, r) => a + r.w, 0);

/*
 * DEPTH — a second, independent axis, and the one players actually feel.
 *
 * Structure asks "is this game wired like the others". Depth asks "is this game
 * FINISHED". They are not the same question and they have different reference
 * games: Cancellation is 8/8 depth but misses ModeShell, while Keep Track is
 * 20/20 structure and thin on depth. A game can be perfectly consistent and
 * still feel unfinished, which is why this is reported separately rather than
 * folded into one number that would hide both.
 *
 * Not gated. A new game legitimately starts thin, and blocking on depth would
 * just push people to fake the markers.
 */
const DEPTH = [
  { id: 'assess', label: 'assessment mode', test: (s) => /mode\s*===\s*'assess'|'assess'/.test(s) },
  { id: 'staircase', label: 'adaptive staircase', test: (s) => /createAdaptiveStaircase|createStaircase/.test(s) },
  { id: 'juice', label: 'juice kit (hit/miss feedback)', test: (s) => /useJuice|JuiceLayer/.test(s) },
  { id: 'coach', label: 'coach / onboarding layer', test: (s) => /Coach|useTrainingTutorialHost|TrainingOnboardingLayer/.test(s) },
  { id: 'metrics', label: 'metrics in results', test: (s) => /ct-fq-rm|IES|icv|dPrime|dprime/i.test(s) },
  { id: 'countdown', label: 'countdown before play', test: (s) => /countdown|cdShow/i.test(s) },
  { id: 'pause', label: 'pause modal', test: (s) => /TrainingPauseModal|pauseOpen/.test(s) },
  { id: 'results', label: 'results screen', test: (s) => /PlayResults|resultsTitle|over\.metrics|summary/.test(s) },
];

for (const g of games) {
  const dir = path.join(DOMAINS_DIR, g.domain, 'games', g.folder);
  g.src = read(path.join(dir, 'index.jsx'));
  g.all = readTree(dir);
  g.lines = countTree(dir);
  g.results = RULES.map((r) => ({ ...r, ok: !!r.test(g) }));
  g.score = g.results.reduce((a, r) => a + (r.ok ? r.w : 0), 0);
  g.missing = g.results.filter((r) => !r.ok);
  g.depth = DEPTH.map((r) => ({ ...r, ok: !!r.test(g.all) }));
  g.depthScore = g.depth.filter((r) => r.ok).length;
}

games.sort((a, b) => b.score - a.score || a.lines - b.lines);

const listMode = process.argv.includes('--list');
console.log(`audit-consistency: ${games.length} registered games, max score ${MAX}\n`);
console.log('score  lines  domain       game');
console.log('─────  ─────  ───────────  ────────────────────────────────────');
for (const g of games) {
  const bar = g.score === MAX ? '★' : ' ';
  console.log(
    `${String(g.score).padStart(2)}/${MAX}${bar} ${String(g.lines).padStart(6)}  ${g.domain.padEnd(11)}  ${g.key}`
    + (g.missing.length ? `  — missing: ${g.missing.map((m) => m.id).join(', ')}` : ''),
  );
}

const perfect = games.filter((g) => g.score === MAX);
console.log(`\nfully conforming: ${perfect.length}/${games.length}`
  + (perfect.length ? ` (${perfect.map((g) => g.key).join(', ')})` : ''));

if (listMode) {
  for (const g of games) {
    console.log(`\n── ${g.key} (${g.domain}, ${g.lines} lines) ──`);
    g.results.forEach((r) => console.log(`   ${r.ok ? '✓' : '✗'} ${r.label}`));
  }
}

// ── Depth: the second axis, reported not gated ──
const byDepth = games.slice().sort((a, b) => b.depthScore - a.depthScore);
console.log('\ndepth (is the game finished — separate from whether it is wired right):');
console.log('depth  game                         has');
console.log('─────  ───────────────────────────  ──────────────────────────────────');
for (const g of byDepth) {
  console.log(`  ${g.depthScore}/${DEPTH.length}  ${g.key.padEnd(27)}  ${g.depth.filter((d) => d.ok).map((d) => d.id).join(' ') || '—'}`);
}
const depthRef = byDepth[0];
console.log(`\ndepth reference: ${depthRef.key} (${depthRef.depthScore}/${DEPTH.length})`);
const structRef = games[0];
console.log(`structure reference: ${structRef.key} (${structRef.score}/${MAX})`);
if (depthRef.key !== structRef.key) {
  console.log('  ↳ these are DIFFERENT games on purpose. Copy structure from one,');
  console.log('    take the bar for what a finished game contains from the other.');
}

console.log('\ndepth adoption:');
for (const r of DEPTH) {
  const n = games.filter((g) => g.depth.find((x) => x.id === r.id).ok).length;
  console.log(`  ${String(n).padStart(2)}/${games.length}  ${r.label}`);
}

// Per-rule adoption, which is what tells you where the platform actually stands.
console.log('\nadoption by rule:');
for (const r of RULES) {
  const n = games.filter((g) => g.results.find((x) => x.id === r.id).ok).length;
  const pct = Math.round((n / games.length) * 100);
  console.log(`  ${String(n).padStart(2)}/${games.length}  ${String(pct).padStart(3)}%  ${r.label}`);
}

console.log('\nshared loading surface:');
for (const check of sharedSurfaceChecks) {
  console.log(`  ${check.ok ? '✓' : '✗'} ${check.label}`);
}
const sharedSurfaceFailures = sharedSurfaceChecks.filter((check) => !check.ok);
if (sharedSurfaceFailures.length) {
  console.error('\nFAILED — the shared game loading surface can flash a stale palette.');
  process.exit(1);
}

/*
 * The ratchet. Like audit:design, this fails only when things get WORSE — the
 * platform is mid-migration and a hard "all games must pass" gate would just be
 * switched off. Lower the floor only by fixing games, never by editing this
 * number down.
 */
const FLOOR = Number(process.env.CONSISTENCY_FLOOR || 19);
const below = games.filter((g) => g.score < FLOOR);
if (below.length) {
  console.error(`\nFAILED — ${below.length} game(s) below the floor of ${FLOOR}:`);
  below.forEach((g) => console.error(`  · ${g.key} (${g.score}/${MAX}) missing ${g.missing.map((m) => m.id).join(', ')}`));
  process.exit(1);
}
console.log(`\nOK — every game at or above the floor of ${FLOOR}/${MAX}`);
