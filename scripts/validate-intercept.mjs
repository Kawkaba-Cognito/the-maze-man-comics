/*
 * validate:intercept — can a human actually clear the wave?
 *
 * Intercept is generated: a wave is a list of ships with lanes, launch times and
 * due times, dealt at runtime. The failures that matter are not "is the curve
 * monotonic" — they are the ones that make a wave IMPOSSIBLE while every number
 * in the config looks reasonable:
 *
 *   · two ships coming due 22ms apart, when the player has one thumb
 *   · more ships in flight than the config's own concurrency says
 *   · a ship visible for so little that its speed cannot be estimated, so the
 *     strike is a guess
 *   · a ship barely hidden at all, so there is nothing to predict
 *   · a warping ship whose speed change is never glimpsed — a coin flip
 *   · a hit window tighter than human timing noise
 *
 * The first two were real, and this gate is where they were caught: the wave
 * builder was spacing the UNWARPED arrival while the player acts on the WARPED
 * one, and concurrency was declared but never enforced.
 *
 * ⚠ It also counts DISTINCT MECHANIC SETS per tier. The previous version of this
 * game shipped an easy tier with exactly one mechanic across all 100 levels —
 * the identical act, performed meaner — and its own source comments complained
 * about that failure in the version before it. A tier that never introduces
 * anything is the boredom bug, and nothing else here would catch it.
 */
import {
  BASE, HEARTS, KIND_IDS, KINDS, LEVELS_PER_TIER,
  MIN_ARRIVAL_GAP_MS, MIN_HIDDEN_MS, MIN_REACT_MS, MIN_TOLERANCE, MIN_VISIBLE_MS,
  STRIKE_AT, STROBE_MS,
  buildWave, dueAt, isHidden, levelCfg, passCfg, progressAt, scoreStrike, summarise, survivalCfg,
} from '../src/features/training/domains/speed/games/intercept/data.js';
import { mulberry32 } from '../src/lib/rng.js';

const problems = [];
const push = (m) => problems.push(m);
let waves = 0;
let ships = 0;

const TIERS = Object.keys(BASE);
const LEVELS = [1, 20, 40, 60, 80, 100];
const SEEDS = 10;

/* ── one wave, checked as a player would meet it ─────────────────────────── */
function checkWave(w, cfg, where) {
  waves += 1;
  ships += w.length;
  if (!w.length) { push(`${where}: empty wave`); return; }

  for (const s of w) {
    if (s.lane < 0 || s.lane >= cfg.lanes) push(`${where}: ship in lane ${s.lane} of ${cfg.lanes}`);
    if (!KIND_IDS.includes(s.kind)) push(`${where}: unknown ship kind ${s.kind}`);

    // enough of the run seen to judge speed at all
    if (s.visibleMs < MIN_VISIBLE_MS) {
      push(`${where}: only ${Math.round(s.visibleMs)}ms visible — under ${MIN_VISIBLE_MS}ms there is nothing to estimate speed from`);
    }
    // and enough hidden that it is a prediction, not a reaction
    const hidden = dueAt(s) - s.launchAt - s.visibleMs;
    if (hidden < MIN_HIDDEN_MS) {
      push(`${where}: only ${Math.round(hidden)}ms hidden — under ${MIN_HIDDEN_MS}ms there is nothing to predict`);
    }
    if (s.tol < MIN_TOLERANCE) {
      push(`${where}: hit window ${s.tol}ms is below ${MIN_TOLERANCE}ms — that is timing noise, not skill`);
    }

    // a warp must be observable: a glimpse, plus time to act on what it showed
    if (s.warp !== 1) {
      if (s.strobeAt == null) {
        push(`${where}: ship warps (${s.warp}) with no glimpse — the speed change is unobservable, so the strike is a coin flip`);
      } else {
        const room = dueAt(s) - s.launchAt - (s.strobeAt + STROBE_MS);
        if (room < MIN_REACT_MS - 0.5) {
          push(`${where}: glimpse ends ${Math.round(room)}ms before it is due, under the ${MIN_REACT_MS}ms needed to act`);
        }
      }
    }

    // the ship must actually be AT the strike line when it comes due
    const at = progressAt(s, dueAt(s));
    if (Math.abs(at - STRIKE_AT) > 0.002) {
      push(`${where}: ship is at ${at.toFixed(3)} when due, not the strike line (${STRIKE_AT})`);
    }
    // …and hidden at some point before that, or the cover is decorative
    const mid = s.launchAt + (dueAt(s) - s.launchAt) * 0.85;
    if (!isHidden(s, mid)) push(`${where}: ship is never hidden near the line — the cover does nothing`);

    // an exact strike must score, and a strike a window-and-a-half out must not
    const exact = scoreStrike(s, dueAt(s));
    if (!exact.hit || !exact.perfect) push(`${where}: a perfectly timed strike does not register`);
    const wide = scoreStrike(s, dueAt(s) + s.tol * 1.5);
    if (wide.hit) push(`${where}: a strike ${Math.round(s.tol * 1.5)}ms late still counts as a hit`);
  }

  /* ── ONE THUMB: no two ships may come due closer than the floor ── */
  const due = w.map(dueAt).sort((a, b) => a - b);
  for (let i = 1; i < due.length; i++) {
    const gap = due[i] - due[i - 1];
    if (gap < MIN_ARRIVAL_GAP_MS - 0.5) {
      push(`${where}: two ships due ${Math.round(gap)}ms apart — the floor is ${MIN_ARRIVAL_GAP_MS}ms and a player has one thumb`);
      break;
    }
  }

  /* ── CONCURRENCY: never more on the field than the config claims ── */
  const end = due[due.length - 1] + 400;
  let worst = 0;
  for (let t = 0; t <= end; t += 20) {
    let n = 0;
    for (const s of w) if (t >= s.launchAt && t <= dueAt(s)) n += 1;
    if (n > worst) worst = n;
  }
  if (worst > cfg.concurrency) {
    push(`${where}: ${worst} ships in flight at once, but the config allows ${cfg.concurrency}`);
  }

  /* ── SURVIVABLE: a perfect player must clear it without losing the gate ── */
  const perfect = w.map((s) => scoreStrike(s, dueAt(s)));
  const misses = perfect.filter((r) => !r.hit).length;
  if (misses > 0) push(`${where}: even a perfectly timed run misses ${misses} ship(s)`);
  if (w.length && HEARTS < 1) push(`${where}: no hearts, so any wave is instantly lost`);
}

/* ── levels ─────────────────────────────────────────────────────────────── */
for (const diff of TIERS) {
  for (const lv of LEVELS) {
    const cfg = levelCfg(diff, lv);
    for (let s = 0; s < SEEDS; s++) {
      const rng = mulberry32(lv * 7919 + s * 104729 + diff.length);
      for (let wi = 0; wi < cfg.waves; wi++) {
        checkWave(buildWave(rng, cfg, wi), cfg, `${diff} L${lv} wave${wi + 1} seed${s}`);
      }
    }
  }
}

/* ── survival and pass n play ───────────────────────────────────────────── */
for (let stage = 0; stage < 36; stage += 1) {
  const cfg = survivalCfg(stage);
  const rng = mulberry32(555 + stage);
  checkWave(buildWave(rng, cfg, 0), cfg, `survival stage ${stage}`);
}
{
  const cfg = passCfg();
  const a = mulberry32(31);
  const b = mulberry32(31);
  const wa = buildWave(a, cfg, 0);
  const wb = buildWave(b, cfg, 0);
  if (JSON.stringify(wa) !== JSON.stringify(wb)) push('pass n play: the same seed built two different waves');
  checkWave(wa, cfg, 'pass n play');
}

/* ── THE CURVE ──────────────────────────────────────────────────────────── */
{
  const UP = ['lanes', 'perWave', 'concurrency', 'waves', 'kindCount'];
  const DOWN = ['travel', 'visibleMs', 'tol'];
  for (const diff of TIERS) {
    let prev = null;
    for (let lv = 1; lv <= LEVELS_PER_TIER; lv++) {
      const c = levelCfg(diff, lv);
      if (prev) {
        for (const k of UP) if (c[k] < prev[k]) push(`curve: ${diff} L${lv} ${k} fell (${prev[k]} → ${c[k]})`);
        for (const k of DOWN) if (c[k] > prev[k]) push(`curve: ${diff} L${lv} ${k} rose (${prev[k]} → ${c[k]})`);
      }
      prev = c;
    }
  }
  for (let lv = 1; lv <= LEVELS_PER_TIER; lv += 9) {
    for (let i = 1; i < TIERS.length; i++) {
      const a = levelCfg(TIERS[i - 1], lv);
      const b = levelCfg(TIERS[i], lv);
      if (b.travel > a.travel) push(`curve: at L${lv}, ${TIERS[i]} gives MORE travel time than ${TIERS[i - 1]}`);
      if (b.tol > a.tol) push(`curve: at L${lv}, ${TIERS[i]} gives a WIDER window than ${TIERS[i - 1]}`);
      if (b.kindCount < a.kindCount) push(`curve: at L${lv}, ${TIERS[i]} has fewer ship kinds than ${TIERS[i - 1]}`);
    }
  }
}

/* ── VARIETY: every tier must introduce something ────────────────────────
 * This is the check the previous version needed and did not have.
 */
{
  const sig = (c) => JSON.stringify({
    lanes: c.lanes, conc: c.concurrency, kinds: c.kinds, waves: c.waves,
  });
  for (const diff of TIERS) {
    const seen = new Set();
    for (let lv = 1; lv <= LEVELS_PER_TIER; lv++) seen.add(sig(levelCfg(diff, lv)));
    if (seen.size < 2) {
      push(`variety: the ${diff} tier has ONE mechanic set across all ${LEVELS_PER_TIER} levels — it only gets meaner, it never gets different`);
    }
  }
  // and every ship kind must actually be dealt somewhere
  const dealt = new Set();
  for (const diff of TIERS) {
    for (const lv of [1, 50, 100]) {
      const cfg = levelCfg(diff, lv);
      for (let s = 0; s < 12; s++) {
        for (const sh of buildWave(mulberry32(lv * 13 + s), cfg, 0)) dealt.add(sh.kind);
      }
    }
  }
  for (const k of KIND_IDS) if (!dealt.has(k)) push(`variety: ship kind "${k}" is defined but never dealt at any level`);
}

/* ── the psychometrics ──────────────────────────────────────────────────── */
{
  const s = summarise([
    { err: -40, hit: true, perfect: false }, { err: -60, hit: true, perfect: false },
    { err: -50, hit: true, perfect: false }, { err: -30, hit: true, perfect: false },
  ]);
  if (s.bias >= 0) push('summarise: four early strikes must report an EARLY bias (negative)');
  if (s.spread > 20) push(`summarise: four tightly grouped strikes report a spread of ${s.spread}ms`);
  const t = summarise([{ err: -200, hit: false, perfect: false }, { err: 200, hit: false, perfect: false }]);
  if (Math.abs(t.bias) > 1) push('summarise: one early and one late must cancel to ~0 bias');
  if (t.spread < 150) push('summarise: ±200ms strikes must report a large spread');
}

/* ── self-test: the gate must reject a wave we break on purpose ──────────── */
{
  const before = problems.length;
  const cfg = levelCfg('med', 50);
  const w = buildWave(mulberry32(3), cfg, 0);
  // slam two ships together, which is the exact bug this gate was written for
  const broken = w.map((s, i) => (i === 1 ? { ...s, due: w[0].due + 20 } : s));
  checkWave(broken, cfg, 'self-test');
  if (problems.length === before) push('SELF-TEST FAILED: two ships due 20ms apart were accepted');
  else problems.splice(before);
}

/* ── report ─────────────────────────────────────────────────────────────── */
if (problems.length) {
  const groups = new Map();
  for (const p of problems) {
    const key = p.replace(/^[a-z]+ L?\d+ ?\w* ?seed\d+: /, '').replace(/^survival stage \d+: /, '').replace(/\d+/g, 'N');
    if (!groups.has(key)) groups.set(key, { n: 0, example: p });
    groups.get(key).n += 1;
  }
  console.error(`validate:intercept FAILED — ${problems.length} problem(s) in ${groups.size} kind(s)\n`);
  for (const [key, g] of [...groups.entries()].sort((a, b) => b[1].n - a[1].n)) {
    console.error(`  · ×${g.n}  ${key}`);
    console.error(`      e.g. ${g.example}`);
  }
  process.exit(1);
}
console.log(`validate:intercept OK — ${waves} waves / ${ships} ships checked as a player meets them.`);
console.log('  one-thumb spacing, concurrency, visibility, hiddenness, warp observability,');
console.log('  strike-line arrival, per-tier variety, the curve and the psychometrics.');
