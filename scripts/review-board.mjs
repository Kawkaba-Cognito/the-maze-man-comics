#!/usr/bin/env node
/*
 * review-board — the standing expert review nobody remembered to ask for.
 *
 * audit:sec answers "did anything get worse?". This answers a different and
 * larger question: "what does an app like this one actually need, and where
 * does it stand?" — across scientific validity, privacy, security and the
 * backend that does not exist yet.
 *
 * It does NOT gate. It reports, explains, and cites. A board that blocks pushes
 * would either be ignored or watered down until it passed; the gate is
 * audit:sec, and the two should not be confused.
 *
 *   node scripts/review-board.mjs            # full report
 *   node scripts/review-board.mjs --domain science
 *   node scripts/review-board.mjs --json     # machine-readable → review/findings.json
 *   node scripts/review-board.mjs --brief    # one line per standard
 *
 * Every finding is either mechanical (a check that ran against this repo) or
 * cited (a source outside it). See review/standards.mjs for why that rule is
 * the whole design.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STANDARDS, DOMAINS } from '../review/standards.mjs';

// fileURLToPath, not .pathname — this repo's path contains a space.
const ROOT = fileURLToPath(new URL('..', import.meta.url));

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valueOf = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };
const JSON_OUT = has('--json');
const BRIEF = has('--brief');
const SINCE = has('--since');
const ACK = has('--ack');
const ONLY = valueOf('--domain');
const SNAPSHOT = join(ROOT, 'review/.last-review.json');

/* ── ctx: the only way a standard may touch the repo ───────────────────────
 * Standards get these helpers and nothing else, so every mechanical finding is
 * reproducible by hand with the same git command. */
/* Content banks are DATA, not code, and they wreck code greps.
 *
 * This is not a hypothetical tidy-up. SCI-04 ("do you measure reliability?")
 * reported PASS on its first run because the pattern `icc\b` matched a word
 * inside link-words-en.js — a ~200k-entry dictionary for the word game. A
 * psychometrics check was satisfied by a Scrabble list, and it would have
 * stayed green permanently. Anything that greps for CODE excludes these. */
const DATA_PATHS = [
  ':(exclude)src/**/link-words*',
  ':(exclude)src/**/words_*',
  ':(exclude)src/features/training/domains/language/games/trivia/data/**',
  ':(exclude)src/features/puzzles/**/packs*',
  ':(exclude)src/**/*Data.js',
];

const ctx = {
  /** grep(pattern, paths, { includeData }) — excludes content banks by default. */
  grep(pattern, paths = ['src'], { includeData = false } = {}) {
    const spec = includeData ? paths : [...paths, ...DATA_PATHS];
    try {
      const out = execFileSync(
        'git', ['grep', '-nEI', '--no-color', pattern, '--', ...spec],
        { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
      );
      return out.split('\n').filter(Boolean);
    } catch {
      return []; // git grep exits 1 on no match
    }
  },
  /** grepUi — matches only text a USER could read.
   *
   * Excludes markdown and comment lines. Needed because the claims detector
   * fired on BENCHED.md and on a gameScience.js comment that were both
   * *criticising* the "training raises fluid intelligence" finding. A grep
   * cannot tell an assertion from a rebuttal, so it must not be shown prose
   * that is allowed to discuss claims. Only rendered strings count. */
  grepUi(pattern, paths = ['src']) {
    return ctx.grep(pattern, paths)
      .filter((l) => !/\.mdx?:/.test(l))
      .filter((l) => {
        const body = l.split(':').slice(2).join(':').trim();
        return !(body.startsWith('*') || body.startsWith('//') || body.startsWith('/*'));
      });
  },

  exists: (rel) => existsSync(join(ROOT, rel)),
  read: (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), 'utf8') : ''),
  tracked() {
    try {
      return execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
        .split('\n').filter(Boolean);
    } catch { return []; }
  },
};

/* ── Run every standard ────────────────────────────────────────────────── */
const results = STANDARDS
  .filter((s) => !ONLY || s.domain === ONLY)
  .map((s) => {
    let outcome;
    try {
      outcome = s.check(ctx);
    } catch (err) {
      // A check that throws must be visible, never silently "passing".
      outcome = { status: 'error', evidence: `check threw: ${err.message}` };
    }
    return { ...s, ...outcome, check: undefined };
  });

/* ── Summarise ─────────────────────────────────────────────────────────── */
const tally = results.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
const actionable = results.filter((r) => r.status === 'fail' || r.status === 'error');
const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
actionable.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);

/* ══════════════════════════════════════════════════════════════════════════
 * DELTA MODE — the alarm, as opposed to the broadcast.
 *
 * A full 18-standard report every session becomes wallpaper within a week; you
 * scroll past it exactly the way you scroll past a green CI badge. So --since
 * prints ONLY what moved, and prints nothing at all when nothing did. Silence
 * then carries information, because you know it would have spoken.
 *
 * --since deliberately does NOT update the snapshot. An alarm that clears
 * itself the first time it fires is one missed glance away from being lost;
 * this one keeps reporting until you explicitly acknowledge with --ack.
 * ═══════════════════════════════════════════════════════════════════════ */
const fingerprint = (r) => `${r.status}|${r.evidence}`;

if (SINCE || ACK) {
  const prev = existsSync(SNAPSHOT) ? JSON.parse(readFileSync(SNAPSHOT, 'utf8')) : null;
  const now = Object.fromEntries(results.map((r) => [r.id, fingerprint(r)]));

  if (ACK) {
    writeFileSync(SNAPSHOT, JSON.stringify({ acknowledged: new Date().toISOString(), state: now }, null, 2) + '\n');
    console.log(`Review acknowledged — ${results.length} standards snapshotted. Future --since runs report only changes from here.`);
    process.exit(0);
  }

  if (!prev) {
    console.log(`REVIEW BOARD: no snapshot yet — ${tally.fail || 0} need work, ${tally.manual || 0} your call, ${tally.pass || 0} clear, ${tally['not-yet'] || 0} standby.`);
    console.log('  Run `npm run review` for the full board, then `npm run review:ack` to start tracking changes.');
    process.exit(0);
  }

  const changes = [];
  for (const r of results) {
    const before = prev.state[r.id];
    if (before === undefined) { changes.push({ r, kind: 'new-standard' }); continue; }
    if (before === fingerprint(r)) continue;
    const prevStatus = before.split('|')[0];
    // Status move is the headline; evidence-only drift is a quieter signal that
    // still matters (same verdict, different facts underneath).
    changes.push({ r, kind: prevStatus === r.status ? 'evidence' : 'status', prevStatus });
  }
  const gone = Object.keys(prev.state).filter((id) => !results.some((r) => r.id === id));

  if (!changes.length && !gone.length) {
    console.log(`REVIEW BOARD: no change since ${prev.acknowledged.slice(0, 10)} (${results.length} standards).`);
    process.exit(0);
  }

  const RANK = { fail: 0, error: 0, manual: 1, pass: 2, 'not-yet': 3 };
  const MARK = { fail: '▲', error: '✕', manual: '◆', pass: '✓', 'not-yet': '·' };
  console.log(`\nREVIEW BOARD: ${results.length - changes.length} unchanged since ${prev.acknowledged.slice(0, 10)}.`);
  changes
    .sort((a, b) => RANK[a.r.status] - RANK[b.r.status])
    .forEach(({ r, kind, prevStatus }) => {
      const verb = kind === 'new-standard' ? 'NEW STANDARD'
        : kind === 'evidence' ? 'EVIDENCE CHANGED'
        : RANK[r.status] < RANK[prevStatus] ? 'REGRESSED' : 'IMPROVED';
      console.log(`  ${MARK[r.status]} ${verb.padEnd(17)} ${r.id}  ${r.title}`);
      if (kind === 'status') console.log(`      ${prevStatus} → ${r.status}`);
      console.log(`      ${r.evidence.split('\n')[0].slice(0, 100)}`);
    });
  gone.forEach((id) => console.log(`  - REMOVED           ${id}`));
  console.log('\n  Full detail: npm run review    ·    Accept as the new normal: npm run review:ack\n');
  process.exit(0);
}

if (JSON_OUT) {
  const payload = {
    generated: new Date().toISOString(),
    domains: DOMAINS,
    tally,
    results: results.map(({ what, why, fix, source, ...r }) => ({ ...r, what, why, fix, source })),
  };
  writeFileSync(join(ROOT, 'review/findings.json'), JSON.stringify(payload, null, 2) + '\n');
  console.log(`review/findings.json written — ${results.length} standards, ${actionable.length} actionable.`);
  process.exit(0);
}

/* ── Terminal report ───────────────────────────────────────────────────── */
const ICON = { pass: '✓', fail: '✗', manual: '◐', 'not-yet': '·', error: '!' };
const LABEL = {
  pass: 'PASS', fail: 'NEEDS WORK', manual: 'HUMAN CALL', 'not-yet': 'NOT YET', error: 'CHECK BROKEN',
};

const wrap = (text, width, indent) => {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > width) { lines.push(line.trim()); line = w; }
    else line += ' ' + w;
  }
  if (line.trim()) lines.push(line.trim());
  return lines.map((l) => indent + l).join('\n');
};

console.log('\n══ REVIEW BOARD ' + '═'.repeat(56));
console.log(`   ${results.length} standards · ${tally.pass || 0} pass · ${tally.fail || 0} need work · ` +
  `${tally.manual || 0} human call · ${tally['not-yet'] || 0} not yet`);

for (const key of Object.keys(DOMAINS)) {
  const inDomain = results.filter((r) => r.domain === key);
  if (!inDomain.length) continue;
  console.log(`\n── ${DOMAINS[key].label.toUpperCase()} ${'─'.repeat(Math.max(0, 62 - DOMAINS[key].label.length))}`);
  if (!BRIEF) console.log(wrap(DOMAINS[key].blurb, 74, '   '));

  for (const r of inDomain) {
    console.log(`\n  ${ICON[r.status]} ${r.id}  ${r.title}`);
    console.log(`     ${LABEL[r.status]}${r.status === 'not-yet' && r.trigger ? ` — applies at: ${r.trigger}` : ''}` +
      `${r.status === 'fail' ? `  [${r.severity}]` : ''}`);
    if (BRIEF) continue;
    console.log(wrap(`WHY: ${r.why}`, 72, '     '));
    console.log(wrap(`FOUND: ${r.evidence}`, 72, '     '));
    if (r.status === 'fail' || r.status === 'manual') console.log(wrap(`DO: ${r.fix}`, 72, '     '));
    if (r.source?.startsWith('http')) console.log(`     SOURCE: ${r.source}`);
  }
}

if (actionable.length) {
  console.log('\n══ WHAT TO DO NEXT ' + '═'.repeat(53));
  actionable.forEach((r, i) => console.log(`  ${i + 1}. [${r.severity}] ${r.id} — ${r.title}`));
}
console.log('\n  Full report:  npm run review -- --json   → review/findings.json');
console.log('  This board REPORTS. The gate that BLOCKS is `npm run audit:sec`.\n');
