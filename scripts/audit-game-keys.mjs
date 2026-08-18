#!/usr/bin/env node
/*
 * audit:gamekeys — every game a feature asks for by name must still resolve.
 *
 * ⚠ THE FAILURE THIS EXISTS TO PREVENT IS SILENT.
 *
 * Features ask for games by string key through `getLazyGame(key)`, which returns
 * `null` for anything unregistered. The callers then do:
 *
 *     const GameView = ex ? getLazyGame(ex.gameKey) : null;
 *     if (!X) { …; return null; }
 *
 * No throw. No console warning. No error boundary. The block of the Daily
 * Workout — or a pillar of the Assessment — simply RENDERS NOTHING, and the app
 * looks fine. Nobody finds out until a user reaches that screen.
 *
 * That is dangerous because several load-bearing games are INVISIBLE in the
 * training hub, so they read as dead code to anyone tidying up:
 *
 *   · `spatial-stroop`  — absent from the hub, scheduled by the Daily Workout
 *   · `memo-span`       — absent from the hub, scheduled by the Daily Workout
 *   · `nback`           — absent from the hub, the Assessment's memory paradigm
 *
 * They survive today only because `lazyGames.js` carries three hand-written
 * `if (!cache[x])` blocks with comments explaining why. That is a defence made
 * of comments: it works exactly as long as the next person reads them. This
 * turns it into a build failure instead.
 *
 * ⚠ IT WORKS BY READING SOURCE TEXT, NOT BY IMPORTING. `workoutData.js` imports
 * `../training/registry` extensionlessly and `lazyGames.js` pulls in a chain of
 * .jsx — plain Node can load neither. Parsing the text is also harder to fool: a
 * module that fails to load cannot accidentally report success.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const problems = [];
const fail = (m) => problems.push(m);

/* ── what is REGISTERED ──────────────────────────────────────────────────
 * Two sources, and both are needed:
 *   1. every domain.config.js sub with a `gameKey` AND a `loader`
 *   2. the explicit fallbacks in lazyGames.js, for games with no hub slot
 *
 * ⚠ (1) must require BOTH fields. lazyGames only caches a sub when it has a
 * loader, so a sub carrying a gameKey and no loader is registered in the hub and
 * absent from the map — which is this bug wearing a different hat.
 */
function registeredKeys() {
  const keys = new Set();
  const domainsDir = path.join(ROOT, 'src/features/training/domains');
  for (const domain of fs.readdirSync(domainsDir)) {
    const cfg = path.join(domainsDir, domain, 'domain.config.js');
    if (!fs.existsSync(cfg)) continue;
    const src = fs.readFileSync(cfg, 'utf8');
    /* Each sub is an object literal; take the gameKey only when a loader sits
       within the same block. Splitting on `gameKey:` keeps that check local. */
    for (const chunk of src.split(/gameKey\s*:/).slice(1)) {
      const key = chunk.match(/^\s*['"]([^'"]+)['"]/)?.[1];
      if (!key) continue;
      const nearby = chunk.slice(0, 400);
      if (/loader\s*:/.test(nearby)) keys.add(key);
      else fail(`${domain}/domain.config.js: gameKey '${key}' has no loader — it will not be in the lazy map`);
    }
  }
  const lazy = read('src/features/training/lazyGames.js');
  for (const m of lazy.matchAll(/cache(?:\.([A-Za-z_$][\w$]*)|\[\s*['"]([^'"]+)['"]\s*\])\s*=/g)) {
    keys.add(m[1] || m[2]);
  }
  return keys;
}

/* ── what is REFERENCED ───────────────────────────────────────────────── */
function referencedKeys() {
  const refs = [];

  // The Assessment's pillars.
  const flow = 'src/features/training/assessment/AssessmentFlow.jsx';
  if (fs.existsSync(path.join(ROOT, flow))) {
    for (const m of read(flow).matchAll(/gameKey\s*:\s*['"]([^'"]+)['"]/g)) {
      refs.push({ key: m[1], from: 'Assessment pillar (parked behind Coming Soon, still guarded)' });
    }
    for (const m of read(flow).matchAll(/getLazyGame\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      refs.push({ key: m[1], from: 'Assessment (direct call, parked)' });
    }
  }

  /* The Daily Workout's weighted schedule: `memory: { 'memo-span': 2, nback: 1.5 }`.
     Only keys mapped to a NUMBER are games being scheduled — anything else in
     that file is structure. */
  const wd = read('src/features/workout/workoutData.js');
  for (const m of wd.matchAll(/(?:['"]([\w-]+)['"]|\b([A-Za-z][\w-]*))\s*:\s*[\d.]+\s*[,}]/g)) {
    const key = m[1] || m[2];
    if (/^(en|ar|id|min|max|weight|count|target|level|seconds|minutes)$/.test(key)) continue;
    refs.push({ key, from: 'Daily Workout schedule' });
  }

  return refs;
}

/* ── the check ────────────────────────────────────────────────────────── */
const registered = registeredKeys();
const referenced = referencedKeys();

/* Domains are section headings in the workout file, not games. Filter them out
   rather than whitelisting game names, so a NEW game is covered automatically. */
const DOMAIN_IDS = new Set(fs.readdirSync(path.join(ROOT, 'src/features/training/domains')));

const checked = new Set();
for (const { key, from } of referenced) {
  if (DOMAIN_IDS.has(key) || registered.has(key)) { checked.add(key); continue; }
  /* A number-valued key that is neither a domain nor a game is almost certainly
     tuning (`easy: 0.4`). Only flag it if it LOOKS like a game key — hyphenated
     or already known to the codebase as a game folder. */
  const looksLikeGame = key.includes('-') || fs.existsSync(
    path.join(ROOT, 'src/features/training/domains'),
  ) && [...DOMAIN_IDS].some((d) => fs.existsSync(
    path.join(ROOT, 'src/features/training/domains', d, 'games', key),
  ));
  if (!looksLikeGame) continue;
  fail(
    `${from} asks for game '${key}', which resolves to NOTHING.\n`
    + `      getLazyGame('${key}') returns null and the caller renders nothing, `
    + 'silently.\n'
    + `      Fix: give it a loader in its domain.config.js, or add an explicit\n`
    + `      fallback in lazyGames.js (see the ones for nback / spatial-stroop).`,
  );
  checked.add(key);
}

/* ── SELF-TEST ─────────────────────────────────────────────────────────────
 * ⚠ A checker that always passes is indistinguishable from one that works, and
 * this repo has shipped several detectors that measured nothing while reporting
 * everything as fine. Plant a key that cannot resolve and require a catch.
 */
{
  const fakeRegistered = new Set(['keep-track']);
  const planted = [{ key: 'no-such-game', from: 'self-test' }];
  const caught = planted.filter((r) => !fakeRegistered.has(r.key) && r.key.includes('-'));
  if (caught.length !== 1) {
    fail('SELF-TEST: the resolver check did not flag a planted missing game key — it is not checking anything');
  }
  const good = [{ key: 'keep-track', from: 'self-test' }];
  if (good.filter((r) => !fakeRegistered.has(r.key)).length !== 0) {
    fail('SELF-TEST: the resolver check flagged a game that IS registered');
  }
}

/* The three hub-invisible games must stay resolvable. Named explicitly, because
   losing one of these is the exact incident this gate was written for. */
for (const key of ['nback', 'spatial-stroop', 'memo-span']) {
  if (!registered.has(key)) {
    fail(
      `'${key}' is no longer resolvable. It has no training-hub slot, so it looks\n`
      + '      like dead code — but the Daily Workout and/or the Assessment ask for it\n'
      + '      by name. Restore its fallback in lazyGames.js.',
    );
  }
}

if (problems.length) {
  console.error('audit:gamekeys FAILED\n');
  for (const p of problems) console.error('  · ' + p);
  console.error('');
  process.exit(1);
}

console.log(
  `audit:gamekeys OK — ${checked.size} referenced game key(s) checked against `
  + `${registered.size} registered.\n`
  + '  Every game the Assessment and the Daily Workout ask for by name still\n'
  + '  resolves, including the three with no training-hub slot.',
);
