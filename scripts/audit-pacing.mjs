#!/usr/bin/env node
/*
 * audit-pacing — no training game may outrun the player.
 *
 * Three games were reported unplayable on 2026-08-15 for the same reason, and
 * it was the same reason each time: the difficulty curve treated TIME as the
 * lever, so the hardest levels stopped measuring the cognitive construct and
 * started measuring how fast you can read.
 *
 *   Keep Track  650ms per word   — you must read it, categorise it, and
 *                                  overwrite what you were holding.
 *   Pair Match  520ms per pair   — binding a symbol to a location is
 *                                  paired-associate encoding.
 *   Task Switch 150ms CSI        — the cue-stimulus interval IS the
 *                                  preparation being measured.
 *
 * This is the audit:fq lesson in another costume. That gate asserted "targets
 * non-decreasing, time non-increasing" for months, which together FORCE
 * seconds-per-target to collapse — and it did, to the point of being
 * impossible, while the gate stayed green because it validated the curve's
 * shape and never asked whether a human could finish.
 *
 * So this file asserts the FLOOR a player actually experiences, at every level
 * of every tier and across the whole survival ramp. Difficulty is welcome to
 * grow — through load, switch rate, stream length, pair count — but not by
 * taking away the time needed to perceive the stimulus at all.
 *
 *   node scripts/audit-pacing.mjs
 */
const problems = [];
const fail = (m) => problems.push(m);
const rows = [];

const url = (p) => new URL(`../src/features/training/domains/${p}`, import.meta.url);

/* ── Keep Track ─────────────────────────────────────────────────────────── */
{
  const { levelCfg, survivalCfg, KEEP_TRACK_MIN_RATE } =
    await import(url('memory/games/keep-track/data.js'));

  let min = Infinity; let where = '';
  for (const diff of ['easy', 'med', 'hard']) {
    for (let lv = 1; lv <= 100; lv += 1) {
      const c = levelCfg(diff, lv);
      if (c.rate < min) { min = c.rate; where = `${diff} L${lv}`; }
    }
  }
  for (let s = 1; s <= 400; s += 1) {
    const c = survivalCfg(s);
    if (c.rate < min) { min = c.rate; where = `survival stage ${s}`; }
  }
  rows.push(['keep-track', 'ms per stream word', min, KEEP_TRACK_MIN_RATE, where]);
  if (min < KEEP_TRACK_MIN_RATE) fail(`keep-track: ${min}ms per word at ${where} — floor is ${KEEP_TRACK_MIN_RATE}ms`);

  // Load must still grow, or the fix would have removed difficulty entirely.
  const easy1 = levelCfg('easy', 1); const hard100 = levelCfg('hard', 100);
  if (hard100.stream <= easy1.stream || hard100.targets <= easy1.targets) {
    fail('keep-track: difficulty no longer grows through LOAD (stream/targets) — the whole point of raising the rate floor');
  }
}

/* ── Pair Match ─────────────────────────────────────────────────────────── */
{
  const { levelCfg, palFreeCfg, PAL_MIN_STUDY } =
    await import(url('memory/games/paired-associates/palData.js'));

  let min = Infinity; let where = '';
  for (const diff of ['easy', 'med', 'hard']) {
    for (let lv = 1; lv <= 100; lv += 1) {
      const c = levelCfg(diff, lv);
      if (c.study < min) { min = c.study; where = `${diff} L${lv}`; }
    }
  }
  for (let p = 1; p <= 12; p += 1) {
    const c = palFreeCfg(p);
    if (c.study < min) { min = c.study; where = `survival ${p} pairs`; }
  }
  rows.push(['paired-associates', 'ms per studied pair', min, PAL_MIN_STUDY, where]);
  if (min < PAL_MIN_STUDY) fail(`paired-associates: ${min}ms per pair at ${where} — floor is ${PAL_MIN_STUDY}ms`);

  const e1 = levelCfg('easy', 1); const h100 = levelCfg('hard', 100);
  if (h100.pairs <= e1.pairs || h100.boxes <= e1.boxes) {
    fail('paired-associates: difficulty no longer grows through LOAD (pairs/boxes)');
  }
}

/* ── Task Switch ────────────────────────────────────────────────────────── */
{
  const { tsCfg, TS_MIN_CSI, TS_MIN_DEADLINE } =
    await import(url('flexibility/games/task-switch/taskSwitchData.js'));

  let minCsi = Infinity; let csiWhere = '';
  let minDl = Infinity; let dlWhere = '';
  const visit = (c, label) => {
    if (c.csi < minCsi) { minCsi = c.csi; csiWhere = label; }
    if (c.deadline < minDl) { minDl = c.deadline; dlWhere = label; }
  };
  for (const diff of ['easy', 'med', 'hard']) {
    for (let lv = 1; lv <= 100; lv += 1) visit(tsCfg('levels', diff, lv), `${diff} L${lv}`);
  }
  for (let i = 0; i <= 100; i += 1) visit(tsCfg('free', null, null, i / 100), `survival ramp ${i}%`);
  visit(tsCfg('passplay'), 'pass-n-play');

  rows.push(['task-switch', 'cue-stimulus interval', minCsi, TS_MIN_CSI, csiWhere]);
  rows.push(['task-switch', 'response deadline', minDl, TS_MIN_DEADLINE, dlWhere]);
  if (minCsi < TS_MIN_CSI) fail(`task-switch: ${minCsi}ms CSI at ${csiWhere} — floor is ${TS_MIN_CSI}ms`);
  if (minDl < TS_MIN_DEADLINE) fail(`task-switch: ${minDl}ms deadline at ${dlWhere} — floor is ${TS_MIN_DEADLINE}ms`);

  const e1 = tsCfg('levels', 'easy', 1); const h100 = tsCfg('levels', 'hard', 100);
  if (!(h100.pSwitch > e1.pSwitch)) {
    fail('task-switch: switch RATE no longer grows — the honest difficulty lever once the interval is floored');
  }
}

/* ── Story Time ─────────────────────────────────────────────────────────────
 * The stimulus here is a whole SCENE plus its narration, not a word or a cue,
 * so the floor is seconds rather than milliseconds. Story Time's own comments
 * always claimed the memorize budget assumed the player actually READS the
 * narration at roughly 8s a panel — this asserts that claim instead of trusting
 * it, at every level of every tier and across the survival ramp.
 *
 * ⚠ Gate SECONDS PER PANEL, never the raw countdown: a six-scene story is given
 * more total time than a four-scene one, so raw `memo` would report the hard
 * tier as the easiest one.
 */
{
  const { levelCfg: sgCfg, survivalCfg: sgSurv, passCfg: sgPass, MIN_SEC_PER_PANEL } =
    await import(url('memory/games/story-grid/data.js'));
  // one source of truth: the game states the floor, this asserts it is met
  const SG_MIN_PER_PANEL = Math.round(MIN_SEC_PER_PANEL * 1000);

  let worst = Infinity; let where = '';
  const visit = (c, label) => {
    const ms = Math.round(c.memoPerPanel * 1000);
    if (ms < worst) { worst = ms; where = label; }
  };
  for (const diff of ['easy', 'med', 'hard']) {
    for (let lv = 1; lv <= 100; lv += 1) visit(sgCfg(diff, lv), `${diff} L${lv}`);
  }
  for (let stage = 0; stage <= 40; stage += 1) visit(sgSurv(stage), `survival stage ${stage}`);
  visit(sgPass(), 'pass-n-play');

  rows.push(['story-grid', 'ms per watched scene', worst, SG_MIN_PER_PANEL, where]);
  if (worst < SG_MIN_PER_PANEL) {
    fail(`story-grid: ${worst}ms per scene at ${where} — floor is ${SG_MIN_PER_PANEL}ms`);
  }

  // …and difficulty must still grow through LOAD once the clock is floored.
  const e1 = sgCfg('easy', 1); const h100 = sgCfg('hard', 100);
  if (!(h100.len > e1.len && h100.questions > e1.questions)) {
    fail('story-grid: scenes and questions no longer grow — the honest levers once the watch clock is floored');
  }
}

/* ── Report ─────────────────────────────────────────────────────────────── */
console.log('audit-pacing: tightest value a player can meet, per game.\n');
for (const [game, what, got, floor, where] of rows) {
  const ok = got >= floor ? '✓' : '✗';
  console.log(`  ${ok} ${game.padEnd(18)} ${what.padEnd(22)} ${String(got).padStart(5)}ms  (floor ${floor}ms)  worst at ${where}`);
}

if (problems.length) {
  console.error('\nFAILED:');
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error('\nRaise the floor back, or move the difficulty into a LOAD lever.');
  process.exit(1);
}
console.log('\nPASS — every game stays above its perception floor, and each still grows harder through load.');
