#!/usr/bin/env node
/*
 * audit-security — the executable half of SECURITY.md.
 *
 * WHY THIS EXISTS AS CODE AND NOT A CHECKLIST
 * ───────────────────────────────────────────
 * There was a security checklist before this file. It lived in a memory note
 * and in CLAUDE.md, and by 2026-08-15 it was wrong in three places at once:
 * it claimed the CSP was `default-src 'none'` (it is `'self'`), that Babylon
 * came from jsdelivr@9.3.0 (it comes from cdn.babylonjs.com@9.11.0), and that
 * two build-tool vulnerabilities were outstanding (npm audit reports zero).
 * Nobody wrote anything false — the code moved and the prose did not.
 *
 * A checklist decays silently. A gate fails loudly. Everything in SECURITY.md
 * that a machine can check is checked here instead, and SECURITY.md keeps only
 * what a machine cannot: disk encryption, 2FA, where the keystore lives.
 *
 * THE RATCHET
 * ───────────
 * Same model as audit-design.mjs. `security-baseline.json` records the debt
 * that already exists; a run fails only when a number goes UP, a NEW rule
 * appears, or a structural fact (CSP directive, SRI pin) changes. Coming in
 * under baseline rewrites it lower, so a fix can never silently regress.
 * Only `--update` may raise it, and raising it should be a reviewed act.
 *
 * SELF-TEST (load-bearing — do not remove)
 * ────────────────────────────────────────
 * Every detector is run against a known-bad fixture on every invocation. A
 * detector that stops firing FAILS THE GATE instead of silently passing the
 * repo. This repo has been bitten by the opposite: audit:fq asserted the shape
 * of a curve for months while the game was unplayable, and audit:mot passed
 * while Target Tracking's difficulty had stopped grading. A detector you have
 * not seen fire is a detector you do not have.
 *
 *   node scripts/audit-security.mjs           # full gate (CI) — includes npm audit
 *   node scripts/audit-security.mjs --fast    # skip anything needing the network (pre-push)
 *   node scripts/audit-security.mjs --list    # show every finding, ignore the baseline
 *   node scripts/audit-security.mjs --update  # accept current state as the new ceiling
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath, not .pathname — this repo's path contains a space, which
// .pathname leaves percent-encoded and fs then cannot resolve.
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BASELINE_PATH = join(ROOT, 'scripts/security-baseline.json');

const argv = new Set(process.argv.slice(2));
const FAST = argv.has('--fast');
const LIST = argv.has('--list');
const UPDATE = argv.has('--update');

const findings = [];
const add = (rule, file, detail, line = null) =>
  findings.push({ rule, file, detail, line });

const git = (args) => {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return '';
  }
};

const readOr = (rel, fallback = '') => {
  const p = join(ROOT, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : fallback;
};

/* ══════════════════════════════════════════════════════════════════════════
 * DETECTORS
 *
 * Each is a pure function over text so the self-test at the bottom can feed
 * it a known-bad fixture. Never inline a detector into the walk — an inlined
 * one cannot be proven to fire.
 * ═══════════════════════════════════════════════════════════════════════ */

/* ── D1: secrets committed to the repo ─────────────────────────────────────
 * High-signal only. A greedy "password" regex on a codebase this size is all
 * false positives, and a detector people learn to ignore is off. */
const SECRET_PATTERNS = [
  [/\bsk-[A-Za-z0-9]{20,}\b/, 'OpenAI-style secret key'],
  [/\bghp_[A-Za-z0-9]{30,}\b/, 'GitHub personal access token'],
  [/\bgho_[A-Za-z0-9]{30,}\b/, 'GitHub OAuth token'],
  [/\bgithub_pat_[A-Za-z0-9_]{50,}\b/, 'GitHub fine-grained PAT'],
  [/\bAIza[0-9A-Za-z_\-]{35}\b/, 'Google API key'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key id'],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/, 'Slack token'],
  [/\beyJhbGciOi[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\./, 'JWT (possible Supabase anon/service key)'],
  [/-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/, 'private key block'],
  [/\bservice_role\b[^\n]{0,40}eyJ/, 'Supabase service-role key'],
  [/(?:api[_-]?key|apikey|auth[_-]?token|access[_-]?token|client[_-]?secret)\s*[:=]\s*["'][A-Za-z0-9_\-]{24,}["']/i,
    'assigned credential literal'],
];

// SRI hashes are long base64 and look exactly like secrets. So do lockfile
// integrity fields and the design baseline's hashes. Skip those lines, not
// those files — a real key on another line of the same file must still fire.
const SECRET_LINE_EXEMPT = /\b(integrity|sha256-|sha384-|sha512-|_SRI|SRI\s*=)/;

function detectSecrets(text, file) {
  const out = [];
  text.split('\n').forEach((raw, i) => {
    if (SECRET_LINE_EXEMPT.test(raw)) return;
    for (const [re, label] of SECRET_PATTERNS) {
      if (re.test(raw)) out.push({ file, line: i + 1, detail: label });
    }
  });
  return out;
}

/* ── D2: .gitignore still covers the secret globs ──────────────────────────
 * The ignore rules are the only thing standing between a `git add -A` and a
 * published credential. Deleting a line here is silent and irreversible once
 * pushed to a PUBLIC repo (origin is public by choice — see SECURITY.md). */
const REQUIRED_IGNORES = [
  '.env', '.env.*', '*.pem', '*.key', '*.p12', '*.pfx',
  'credentials.json', '**/secrets.json', '*.jks', '*.keystore',
  'android/local.properties',
];

function detectGitignoreGaps(text) {
  const lines = new Set(
    text.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')),
  );
  return REQUIRED_IGNORES.filter((p) => !lines.has(p))
    .map((p) => ({ file: '.gitignore', detail: `missing rule: ${p}` }));
}

/* ── D3: CSP, parsed into directives and compared to baseline ──────────────
 * Not a string compare: reordering the policy is fine, GAINING a source or an
 * unsafe keyword is not. 'unsafe-eval' in script-src is baselined (Babylon's
 * shader paths); the point is that nothing may join it without a decision. */
const DANGEROUS_KEYWORDS = ["'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'", '*', 'data:'];
const SCRIPT_LIKE = new Set(['script-src', 'script-src-elem', 'default-src', 'object-src']);

function parseCsp(html) {
  // The value MUST be matched as double-quoted-only. A `["']([^"']+)["']` pattern
  // looks right and is silently wrong: every CSP contains `'self'`, so the
  // character class terminates on the first source keyword and the parser
  // "successfully" returns just `default-src` with no sources. It baselined
  // exactly that on the first run here before anyone read the output.
  const m = html.match(/http-equiv=["']Content-Security-Policy["'][\s\S]{0,200}?content="([^"]+)"/i);
  if (!m) return null;
  const out = {};
  for (const part of m[1].split(';')) {
    const bits = part.trim().split(/\s+/).filter(Boolean);
    if (!bits.length) continue;
    out[bits[0]] = bits.slice(1).sort();
  }
  return out;
}

function detectCspDrift(csp, baseCsp, file) {
  const out = [];
  if (!csp) return [{ file, detail: 'no Content-Security-Policy meta tag found' }];
  if (!baseCsp) return out;

  for (const [dir, sources] of Object.entries(csp)) {
    const before = baseCsp[dir];
    if (!before) {
      out.push({ file, detail: `new CSP directive not in baseline: ${dir}` });
      continue;
    }
    for (const s of sources) {
      if (before.includes(s)) continue;
      const danger = DANGEROUS_KEYWORDS.includes(s) && SCRIPT_LIKE.has(dir);
      out.push({
        file,
        detail: `${danger ? 'DANGEROUS source' : 'new source'} added to ${dir}: ${s}`,
      });
    }
  }
  // A directive vanishing is a loosening too: dropping object-src re-opens it
  // to default-src, and dropping base-uri re-enables <base> hijacking.
  for (const dir of Object.keys(baseCsp)) {
    if (!csp[dir]) out.push({ file, detail: `CSP directive REMOVED (loosens policy): ${dir}` });
  }
  return out;
}

/* ── D4: every remote script is SRI-pinned AND crossOrigin ─────────────────
 * `integrity` without `crossOrigin='anonymous'` is SILENTLY IGNORED by the
 * browser for cross-origin scripts. The pin looks present in review and does
 * nothing at runtime — which is the whole failure mode this rule exists for.
 * Both Babylon loaders and Void Runner's three.js are correct today. */
function detectSriGaps(text, file) {
  const out = [];
  const lines = text.split('\n');
  lines.forEach((raw, i) => {
    if (!/script\.src\s*=/.test(raw)) return;
    // The loader block: this line plus a small window either side.
    const win = lines.slice(Math.max(0, i - 6), i + 8).join('\n');
    const remote = /https:\/\//.test(win);
    if (!remote) return;
    if (!/\.integrity\s*=/.test(win))
      out.push({ file, line: i + 1, detail: 'remote script loaded without SRI integrity' });
    else if (!/crossOrigin\s*=\s*['"]anonymous['"]/.test(win))
      out.push({ file, line: i + 1, detail: "SRI present but crossOrigin='anonymous' missing — integrity is IGNORED" });
  });
  return out;
}

/* ── D5: zero network calls in src/ ────────────────────────────────────────
 * The app's single strongest security property: it has no backend and talks to
 * nobody, so there is no request to intercept, no token to steal, no CORS
 * surface. It is easy to lose by accident and hard to notice. When Supabase
 * lands this rule gets an explicit allowlist — it does not get deleted. */
function detectNetworkCalls(text, file) {
  const out = [];
  text.split('\n').forEach((raw, i) => {
    const code = raw.replace(/\/\/.*$/, '');
    if (/\bnew\s+(?:WebSocket|EventSource)\s*\(/.test(code))
      out.push({ file, line: i + 1, detail: 'WebSocket/EventSource in src/' });
    if (/\bXMLHttpRequest\b/.test(code))
      out.push({ file, line: i + 1, detail: 'XMLHttpRequest in src/' });
    if (/\bnavigator\.sendBeacon\s*\(/.test(code))
      out.push({ file, line: i + 1, detail: 'sendBeacon in src/' });
    // Bare fetch( only — `caches.match`, `.then(fetch)` etc. are not calls out.
    if (/(^|[^.\w])fetch\s*\(/.test(code))
      out.push({ file, line: i + 1, detail: 'fetch() in src/' });
  });
  return out;
}

/* ── D5b: external hosts referenced from CSS or markup ────────────────────
 * D5 checks JS for fetch/XHR/WebSocket and reported "zero network calls in
 * src/" for months while global.css hotlinked TWO images from
 * upload.wikimedia.org on every page load — a third party learning every
 * user's IP, alongside an unhonoured CC BY-SA attribution. It was found by eye
 * on 2026-08-15 while chasing a palette complaint, not by this gate, because a
 * `url()` in a stylesheet is a network call containing no JavaScript.
 *
 * Allowlist mirrors the CSP: the app legitimately loads fonts from Google and
 * two SRI-pinned engines from CDNs. Anything else is a new outbound dependency
 * and must be a decision, not a paste. */
const ALLOWED_HOSTS = [
  'fonts.googleapis.com', 'fonts.gstatic.com',
  'cdn.babylonjs.com', 'cdnjs.cloudflare.com', 'playground.babylonjs.com',
];

function detectExternalRefs(text, file) {
  const out = [];
  text.split('\n').forEach((raw, i) => {
    const urls = raw.match(/(?:url\(\s*["']?|src=["']|href=["'])(https?:\/\/[^"')\s]+)/g) || [];
    for (const u of urls) {
      const host = (u.match(/https?:\/\/([^/"')\s]+)/) || [])[1];
      if (!host || ALLOWED_HOSTS.includes(host)) continue;
      out.push({ file, line: i + 1, detail: `external asset from ${host} — outbound request on load` });
    }
  });
  return out;
}

/* ── D6: user-controlled text interpolated into innerHTML ──────────────────
 * Found live on 2026-08-15: Void Runner reads a pilot name from an <input>,
 * stores it in localStorage, and renders it straight into innerHTML on the
 * high-score board. Self-XSS only while the app is offline-only — and a real
 * stored-XSS the day scores sync between users.
 *
 * Two tiers, because they carry different weight:
 *   innerhtml-interpolated — any `${…}` reaching innerHTML (ratcheted debt)
 *   innerhtml-user-input   — the subset in a file that also reads .value or
 *                            localStorage, i.e. plausibly attacker-controlled
 * The second tier is a HEURISTIC and says so. It exists to keep a known-bad
 * pattern from spreading, not to prove exploitability. */
function detectInnerHtml(text, file) {
  const out = [];
  const touchesUserInput = /\.value\b|localStorage\.getItem|loadJson\(/.test(text);
  const lines = text.split('\n');
  lines.forEach((raw, i) => {
    if (!/\.innerHTML\s*=/.test(raw)) return;
    // Assignment may open a multi-line template literal; look ahead for `${`.
    const chunk = lines.slice(i, i + 25).join('\n');
    const upToClose = chunk.split(/`\s*;|`\s*\)/)[0];
    if (!/\$\{/.test(upToClose)) return;
    out.push({
      file,
      line: i + 1,
      detail: touchesUserInput
        ? 'interpolated innerHTML in a file that also reads user input (possible XSS sink)'
        : 'interpolated innerHTML',
      tier: touchesUserInput ? 'innerhtml-user-input' : 'innerhtml-interpolated',
    });
  });
  return out;
}

/* ══════════════════════════════════════════════════════════════════════════
 * SELF-TEST — prove every detector fires before trusting a clean run.
 * ═══════════════════════════════════════════════════════════════════════ */
function selfTest() {
  const broken = [];
  let total = 0;
  const expect = (name, got) => { total += 1; if (!got) broken.push(name); };

  expect('D1 secrets/token', detectSecrets('const k = "ghp_' + 'a'.repeat(36) + '";', 'fx').length > 0);
  expect('D1 secrets/jwt', detectSecrets('url=eyJhbGciOiJIUzI1NiIsInR5cCI6.abcdefghij.sig', 'fx').length > 0);
  expect('D1 secrets/assigned', detectSecrets('apiKey: "abcdefghijklmnopqrstuvwxyz123"', 'fx').length > 0);
  // …and does NOT fire on this repo's SRI lines, or it is useless in practice.
  expect('D1 secrets/no-false-positive-on-SRI',
    detectSecrets("script.integrity = 'sha384-uXkmKN2jmCGDEGble8eNhnYoDGtzLMPhnublKtjvBUzerIVkBQIcJhOeW';", 'fx').length === 0);

  expect('D2 gitignore', detectGitignoreGaps('node_modules/\ndist/\n').length > 0);
  expect('D2 gitignore/clean', detectGitignoreGaps(REQUIRED_IGNORES.join('\n')).length === 0);

  // Parse first, drift second. The parser broke before the drift rule ever ran,
  // and a drift check over a mis-parsed policy compares nothing to nothing and
  // reports PASS — so the parser gets its own assertions.
  const cspFx = parseCsp(
    `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval' https://cdn.x.com; object-src 'none'" />`,
  );
  expect('D3 csp/parses-quoted-keywords',
    !!cspFx && cspFx['script-src']?.includes("'unsafe-eval'") && cspFx['script-src']?.includes('https://cdn.x.com'));
  expect('D3 csp/parses-all-directives', !!cspFx && Object.keys(cspFx).length === 3);
  expect('D3 csp/parses-multiline',
    !!parseCsp('<meta http-equiv="Content-Security-Policy" content="\n  default-src \'none\';\n  script-src \'self\';\n">')
      ?.['script-src']?.includes("'self'"));

  const baseFx = { 'script-src': ["'self'"], 'object-src': ["'none'"] };
  expect('D3 csp/missing', detectCspDrift(null, baseFx, 'fx').length > 0);
  expect('D3 csp/new-danger', detectCspDrift(
    { 'script-src': ["'self'", "'unsafe-inline'"], 'object-src': ["'none'"] }, baseFx, 'fx')
    .some((f) => /DANGEROUS/.test(f.detail)));
  expect('D3 csp/removed-directive', detectCspDrift({ 'script-src': ["'self'"] }, baseFx, 'fx')
    .some((f) => /REMOVED/.test(f.detail)));
  expect('D3 csp/reorder-is-fine', detectCspDrift(
    { 'object-src': ["'none'"], 'script-src': ["'self'"] }, baseFx, 'fx').length === 0);

  expect('D4 sri/absent', detectSriGaps(
    "const s=document.createElement('script');\ns.src='https://cdn.x.com/a.js';\ndoc.head.appendChild(s);"
      .replace(/s\.src/, 'script.src'), 'fx').length > 0);
  expect('D4 sri/no-crossorigin', detectSriGaps(
    "script.src='https://cdn.x.com/a.js';\nscript.integrity='sha384-zz';", 'fx')
    .some((f) => /IGNORED/.test(f.detail)));
  expect('D4 sri/correct-passes', detectSriGaps(
    "script.src='https://cdn.x.com/a.js';\nscript.integrity='sha384-zz';\nscript.crossOrigin='anonymous';", 'fx')
    .length === 0);

  expect('D5 network/fetch', detectNetworkCalls('const r = await fetch("/x");', 'fx').length > 0);
  expect('D5 network/ws', detectNetworkCalls('const s = new WebSocket("wss://x");', 'fx').length > 0);
  expect('D5 network/comment-ignored', detectNetworkCalls('// we never fetch(anything)', 'fx').length === 0);

  expect('D5b external/css-url', detectExternalRefs(
    'background-image: url("https://upload.wikimedia.org/a/b.png");', 'fx').length > 0);
  expect('D5b external/img-src', detectExternalRefs(
    '<img src="https://tracker.example.com/pixel.gif">', 'fx').length > 0);
  expect('D5b external/allowlisted-passes', detectExternalRefs(
    'url("https://fonts.gstatic.com/s/x.woff2")', 'fx').length === 0);
  expect('D5b external/relative-ignored', detectExternalRefs(
    'background-image: url("/Assets/planet.webp");', 'fx').length === 0);

  expect('D6 innerhtml/user-input', detectInnerHtml(
    'const n = localStorage.getItem("x");\nel.innerHTML = `<b>${n}</b>`;', 'fx')
    .some((f) => f.tier === 'innerhtml-user-input'));
  expect('D6 innerhtml/static-ignored', detectInnerHtml('el.innerHTML = "<b>hi</b>";', 'fx').length === 0);

  return { broken, total };
}

/* ══════════════════════════════════════════════════════════════════════════
 * WALK THE REPO
 * ═══════════════════════════════════════════════════════════════════════ */
const tracked = git(['ls-files']).split('\n').map((s) => s.trim()).filter(Boolean);
const SKIP_BINARY = /\.(png|jpg|jpeg|webp|gif|ico|glb|gltf|woff2?|ttf|otf|mp3|ogg|wav|zip|pdf)$/i;

for (const rel of tracked) {
  if (SKIP_BINARY.test(rel)) continue;
  let text;
  try { text = readFileSync(join(ROOT, rel), 'utf8'); } catch { continue; }

  for (const f of detectSecrets(text, rel)) add('secret-in-tracked-file', f.file, f.detail, f.line);

  if (rel.startsWith('src/')) {
    for (const f of detectSriGaps(text, rel)) add('sri-integrity', f.file, f.detail, f.line);
    for (const f of detectNetworkCalls(text, rel)) add('no-network-in-src', f.file, f.detail, f.line);
    for (const f of detectExternalRefs(text, rel)) add('external-asset-ref', f.file, f.detail, f.line);
    for (const f of detectInnerHtml(text, rel)) add(f.tier, f.file, f.detail, f.line);
  }
}

for (const f of detectGitignoreGaps(readOr('.gitignore'))) add('gitignore-coverage', f.file, f.detail);

/* ── Untracked files under public/ ─────────────────────────────────────────
 * `npm run build` copies ALL of public/ into dist/. On a manual gh-pages
 * deploy that ships local scratch to the live site and into the SW precache —
 * 211 files / 2.6 MB of _tmp_preview/ went public this way on 2026-08-06.
 * Reported, never fatal: scratch in public/ is normal while working. */
const untrackedPublic = git(['ls-files', '--others', '--exclude-standard', 'public'])
  .split('\n').map((s) => s.trim()).filter(Boolean);

/* ── npm audit (network) ───────────────────────────────────────────────────
 * Skipped under --fast so the pre-push hook stays sub-second. CI and the
 * weekly sweep run it in full. */
let auditCounts = null;
if (!FAST) {
  try {
    // Invoking npm portably is fiddlier than it looks, and both easy options
    // are wrong:
    //   shell: true      → Node's DEP0190: args are concatenated, not escaped.
    //                      Harmless with these constants, but a security gate
    //                      should not be the file modelling the bad habit.
    //   'npm.cmd'        → Node 20 REFUSES to spawn .cmd/.bat without a shell
    //                      (the CVE-2024-27980 fix), so this silently fails on
    //                      Windows and the audit reports UNAVAILABLE.
    // npm sets npm_execpath to its own cli.js when it runs a script, so run
    // that with the current node binary — no shell, no .cmd, works everywhere.
    // The fallback only matters when invoking this file directly, not via npm.
    const viaNpmScript = process.env.npm_execpath;
    const [bin, pre] = viaNpmScript
      ? [process.execPath, [viaNpmScript]]
      : [process.platform === 'win32' ? 'npm.cmd' : 'npm', []];
    const raw = execFileSync(bin, [...pre, 'audit', '--json'], {
      cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
      shell: !viaNpmScript && process.platform === 'win32',
    });
    auditCounts = JSON.parse(raw).metadata.vulnerabilities;
  } catch (err) {
    // npm audit exits non-zero WHEN IT FINDS THINGS — stdout is still valid.
    try { auditCounts = JSON.parse(err.stdout || '').metadata.vulnerabilities; }
    catch { auditCounts = null; }
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 * COMPARE TO BASELINE
 * ═══════════════════════════════════════════════════════════════════════ */
const csp = parseCsp(readOr('index.html'));
const episodeCsp = parseCsp(readOr('public/episode-1-problem-solving.html'));

const baseline = existsSync(BASELINE_PATH)
  ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
  : { rules: {}, csp: null, episodeCsp: null, npmAudit: null };

for (const f of detectCspDrift(csp, baseline.csp, 'index.html')) add('csp-ratchet', f.file, f.detail);
for (const f of detectCspDrift(episodeCsp, baseline.episodeCsp, 'public/episode-1-problem-solving.html'))
  add('csp-ratchet', f.file, f.detail);

const counts = {};
for (const f of findings) counts[f.rule] = (counts[f.rule] || 0) + 1;

const { broken, total: selfTestTotal } = selfTest();
const failures = [];

if (broken.length) {
  failures.push(`SELF-TEST FAILED — these detectors no longer fire on known-bad input: ${broken.join(', ')}`);
}

// Rules that are never allowed any findings, baseline or not.
const ZERO_TOLERANCE = new Set(['secret-in-tracked-file', 'gitignore-coverage', 'sri-integrity', 'csp-ratchet']);

for (const [rule, n] of Object.entries(counts)) {
  if (ZERO_TOLERANCE.has(rule)) { failures.push(`${rule}: ${n} finding(s) — zero tolerance`); continue; }
  const ceiling = baseline.rules?.[rule];
  if (ceiling === undefined) failures.push(`${rule}: ${n} finding(s) — NEW rule, not in baseline`);
  else if (n > ceiling) failures.push(`${rule}: ${n} > baseline ${ceiling}`);
}

if (auditCounts) {
  const base = baseline.npmAudit || {};
  for (const sev of ['critical', 'high', 'moderate', 'low']) {
    const now = auditCounts[sev] || 0;
    const was = base[sev] ?? 0;
    if (now > was) failures.push(`npm audit ${sev}: ${now} > baseline ${was}`);
  }
}

/* ══════════════════════════════════════════════════════════════════════════
 * REPORT
 * ═══════════════════════════════════════════════════════════════════════ */
const byRule = {};
for (const f of findings) (byRule[f.rule] ||= []).push(f);

if (LIST) {
  for (const [rule, list] of Object.entries(byRule)) {
    console.log(`\n── ${rule} (${list.length})`);
    for (const f of list) console.log(`   ${f.file}${f.line ? ':' + f.line : ''}  ${f.detail}`);
  }
  if (untrackedPublic.length) {
    console.log(`\n── untracked-in-public (${untrackedPublic.length})`);
    for (const p of untrackedPublic) console.log(`   ${p}`);
  }
}

if (UPDATE) {
  const next = {
    _comment: 'Debt ceiling for audit-security.mjs. Raising a number is a DECISION — say why in the commit message. See SECURITY.md.',
    updated: new Date().toISOString().slice(0, 10),
    rules: counts,
    csp,
    episodeCsp,
    npmAudit: auditCounts || baseline.npmAudit,
  };
  writeFileSync(BASELINE_PATH, JSON.stringify(next, null, 2) + '\n');
  console.log(`security-baseline.json updated — ${findings.length} finding(s) accepted as the ceiling.`);
  process.exit(0);
}

console.log(`audit-security${FAST ? ' --fast' : ''}: ${tracked.length} tracked files, ${findings.length} finding(s).`);
console.log(`  self-test: ${broken.length ? `FAILED (${broken.length}/${selfTestTotal})` : `all ${selfTestTotal} detector assertions fired`}`);
for (const [rule, list] of Object.entries(byRule)) {
  const ceiling = ZERO_TOLERANCE.has(rule) ? 0 : baseline.rules?.[rule];
  console.log(`  ${rule}: ${list.length}${ceiling !== undefined ? ` (ceiling ${ceiling})` : ''}`);
}
if (auditCounts) {
  const t = ['critical', 'high', 'moderate', 'low'].map((s) => `${s} ${auditCounts[s] || 0}`).join(', ');
  console.log(`  npm audit: ${t}`);
} else if (FAST) {
  console.log('  npm audit: skipped (--fast)');
} else {
  console.log('  npm audit: UNAVAILABLE (network) — not a pass, re-run when online');
}
if (untrackedPublic.length) {
  console.log(`  untracked-in-public: ${untrackedPublic.length} file(s) — these SHIP on a manual deploy (advisory)`);
}

if (failures.length) {
  console.error('\nFAILED:');
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error('\nRun with --list to see every finding.');
  console.error('If a rise is deliberate, `npm run audit:sec -- --update` and say why in the commit.');
  process.exit(1);
}

// Ratchet down: a run under baseline lowers the ceiling so a fix cannot regress.
if (!FAST) {
  let lowered = false;
  const rules = { ...(baseline.rules || {}) };
  for (const [rule, ceiling] of Object.entries(rules)) {
    const now = counts[rule] || 0;
    if (now < ceiling) { rules[rule] = now; lowered = true; }
  }
  if (lowered) {
    writeFileSync(BASELINE_PATH, JSON.stringify({ ...baseline, rules }, null, 2) + '\n');
    console.log('\nBaseline ratcheted DOWN — commit scripts/security-baseline.json.');
  }
}

console.log('\nPASS');
