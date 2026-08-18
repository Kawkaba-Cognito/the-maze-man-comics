/*
 * INTERCEPT — Rift Defense.  [speed]
 *
 * A trail winds across the field to your gate. An army marches down it in
 * waves. Your tower covers one stretch of that trail; a marcher inside that
 * stretch can be struck with a tap. Anyone who walks the whole trail takes a
 * bite out of the gate.
 *
 * ── WHAT IT ACTUALLY MEASURES ─────────────────────────────────────────────
 *
 * Three things, layered, and the layering is the whole design:
 *
 *   1. REACTION TIME       — a marcher enters the covered stretch, you strike.
 *   2. RESPONSE INHIBITION — some marchers are the WRONG COLOUR and must be
 *                            left alone. Striking one is a commission error,
 *                            the classic Go/No-Go measure of failing to
 *                            withhold a response that has become automatic.
 *   3. PREDICTION          — at higher levels the trail runs under forest
 *                            canopy and part of the covered stretch is hidden.
 *                            A marcher in there must be struck from a forward
 *                            model of where they are, which yields a SIGNED
 *                            error in milliseconds rather than a hit count.
 *
 * ⚠ WHY THAT LAYERING IS LOAD-BEARING. The speed domain already contains Speed
 * Match and Math Gates, both look-decode-answer reaction tasks; Trail Making
 * was benched in 2026-08 for being a third. A pure "tap them as they appear"
 * game would be a fourth, however good it felt. The no-go colour and the canopy
 * are what make this game measure something the domain does not already have.
 * They are not decoration and must not be tuned away.
 *
 * ⚠ Explicit .js extensions in every import. Vite resolves without them, plain
 * Node does not, and validate:intercept runs in Node — dropping one breaks the
 * GATE rather than the app, which is the kind of failure that only shows up in
 * CI. This module therefore takes its RNG as an ARGUMENT rather than importing
 * shared/rng.js, which re-exports extensionlessly and Node cannot load.
 */
import { CURVE, levelFraction } from '../../../../shared/difficulty.js';

export const LEVELS_PER_TIER = 100;

/* ── THE TRAIL ────────────────────────────────────────────────────────────
 * A polyline in a UNIT SQUARE. Everything downstream — where a marcher is,
 * when they enter the tower's reach, when they reach the gate — is a distance
 * along this line, which is what makes the timing exact.
 *
 * ⚠ Lengths are in NORMALISED units, deliberately ignoring the device's real
 * aspect ratio. Progress is a fraction of the trail, so "cross in 6 seconds"
 * means the same thing on every screen. Measuring in pixels instead is exactly
 * the bug audit:mot caught in Target Tracking, where a wide screen silently
 * changed the difficulty.
 */
export const TRAIL = [
  [0.04, 0.13], [0.70, 0.13], [0.86, 0.25], [0.86, 0.41],
  [0.72, 0.51], [0.20, 0.51], [0.07, 0.61], [0.07, 0.75],
  [0.21, 0.86], [0.50, 0.86],
];

/** Segment lengths and the total, in normalised units. */
export const TRAIL_SEGS = (() => {
  const segs = [];
  let total = 0;
  for (let i = 1; i < TRAIL.length; i += 1) {
    const d = Math.hypot(TRAIL[i][0] - TRAIL[i - 1][0], TRAIL[i][1] - TRAIL[i - 1][1]);
    segs.push(d);
    total += d;
  }
  return { segs, total };
})();

/** Position at a fraction of the trail (0 = trailhead, 1 = the gate). */
export function posAt(frac) {
  const { segs, total } = TRAIL_SEGS;
  let d = Math.max(0, Math.min(1, frac)) * total;
  for (let i = 0; i < segs.length; i += 1) {
    if (d <= segs[i]) {
      const k = segs[i] ? d / segs[i] : 0;
      return {
        x: TRAIL[i][0] + (TRAIL[i + 1][0] - TRAIL[i][0]) * k,
        y: TRAIL[i][1] + (TRAIL[i + 1][1] - TRAIL[i][1]) * k,
      };
    }
    d -= segs[i];
  }
  const last = TRAIL[TRAIL.length - 1];
  return { x: last[0], y: last[1] };
}

/* ── PERCEPTUAL AND MOTOR FLOORS ──────────────────────────────────────────
 * The numbers that decide whether a wave is POSSIBLE rather than merely hard.
 * validate:intercept asserts every one of them against the wave a player
 * actually meets, never against the config that produced it.
 */
/** A marcher must sit inside the tower's reach at least this long to be struck. */
export const MIN_DWELL_MS = 620;
/** Two strikes cannot be closer together than this. A player has one thumb. */
export const MIN_TAP_GAP_MS = 240;
/** Before a marcher enters a HIDDEN stretch, this much of them must have been
 *  visible — otherwise there is no speed to extrapolate from and the strike is
 *  a guess rather than a prediction. */
export const MIN_VISIBLE_MS = 340;
/** Hit window on a hidden marcher. Tighter than this is inside human timing
 *  noise rather than skill. */
export const MIN_TOLERANCE_MS = 70;

/* Go/No-Go measures inhibition only while the GO response is prepotent. Too
 * many no-go marchers and the player is sorting rather than withholding; too
 * few and commission errors are too rare to score. 15–35% is the band standard
 * Go/No-Go paradigms sit in. */
export const NOGO_MIN_SHARE = 0.15;
export const NOGO_MAX_SHARE = 0.35;

export const BASE_HP = 10;

/* ── MARCHER KINDS ────────────────────────────────────────────────────── */
export const KIND = {
  /** Strike it. The prepotent response. */
  GO: 'go',
  /** The wrong colour. Striking it is a commission error. It walks through
   *  harmlessly — it was never a threat, which is why hitting it is YOUR
   *  mistake rather than a lost life. */
  NOGO: 'nogo',
  /** Takes two strikes, so a wave can demand more taps without more bodies. */
  ARMOUR: 'armour',
  /** Stationary. Striking it clears everything within BLAST_FRAC, which
   *  rewards holding your nerve for a cluster. */
  BARREL: 'barrel',
};

/** Blast reach of a barrel, as a fraction of the whole trail. */
export const BLAST_FRAC = 0.075;

/* ── DIFFICULTY ───────────────────────────────────────────────────────────
 * Eight levers, every one something a player can name:
 *
 *   count        how many marchers a wave sends
 *   crossMs      how long the whole trail takes to walk
 *   gapMs        how tightly they are spaced
 *   ringSpan     how much of the trail your tower reaches — this SHRINKS
 *   nogoShare    how much of the column must be left alone
 *   hiddenShare  how much of your reach is under canopy (0 = see everything)
 *   armour       how many take two strikes
 *   barrels      how many explosive drums sit on the trail
 *
 * ⚠ EVERY TIER MUST INTRODUCE SOMETHING. The version before this had an easy
 * tier with exactly ONE nameable mechanic across all 100 levels, which is why
 * it was reported as not scaling. The ladder is staged on purpose: pure sight →
 * no-go colour → barrels → armour → canopy. validate:intercept counts distinct
 * mechanic sets per tier and fails a tier that never introduces one.
 */
export const BASE = {
  easy: {
    count0: 5, count1: 10,
    cross0: 8200, cross1: 6200,
    gap0: 1500, gap1: 1000,
    ring0: 0.30, ring1: 0.24,
    /* No-go arrives a fifth of the way in — far enough that striking has become
       automatic, which is the state the measure needs. */
    nogoFrom: 0.20, nogo0: 0.18, nogo1: 0.30,
    hiddenFrom: 1.01, hidden0: 0, hidden1: 0,      // no canopy on easy, ever
    armourFrom: 0.70, armour0: 0, armour1: 2,
    barrelFrom: 0.45, barrel0: 0, barrel1: 1,
  },
  med: {
    count0: 8, count1: 14,
    cross0: 7000, cross1: 5200,
    gap0: 1200, gap1: 780,
    ring0: 0.26, ring1: 0.20,
    nogoFrom: 0.00, nogo0: 0.18, nogo1: 0.30,
    /* Canopy is the medium tier's new idea, and it starts small. */
    hiddenFrom: 0.35, hidden0: 0.00, hidden1: 0.55,
    armourFrom: 0.20, armour0: 1, armour1: 4,
    barrelFrom: 0.00, barrel0: 1, barrel1: 2,
  },
  hard: {
    count0: 11, count1: 18,
    cross0: 6000, cross1: 4400,
    gap0: 950, gap1: 620,
    ring0: 0.24, ring1: 0.18,
    nogoShuffle: true,           // the safe colour changes between waves
    nogoFrom: 0.00, nogo0: 0.22, nogo1: 0.34,
    hiddenFrom: 0.00, hidden0: 0.40, hidden1: 0.78,
    /* ⚠ Hard STILL has to introduce things, not merely start hard. Turning
       every mechanic on at level 1 gave the tier a single mechanic set across
       all 100 levels — the identical failure the old easy tier shipped, just
       with bigger numbers. Barrels and armour are held back so hard has a
       ladder of its own. */
    armourFrom: 0.55, armour0: 2, armour1: 6,
    barrelFrom: 0.30, barrel0: 1, barrel1: 3,
  },
};

export const DIFFS = Object.keys(BASE);

/** The tower's reach is centred on this fraction of the trail. */
export const RING_AT = 0.62;

const lerp = (a, b, f) => a + (b - a) * f;

/**
 * A lever that is OFF until `from`, then switches on at `a` and ramps to `b`.
 *
 * ⚠ It returns 0 before `from`, not `a`. An earlier version returned `a`, which
 * meant a mechanic's ramp had to start at 0 to stay off — and a no-go share
 * ramping up from 0.00 spends its first levels BELOW the Go/No-Go band, where
 * the forbidden colour is too rare to measure anything. A mechanic should
 * arrive already inside its usable range.
 */
function staged(f, from, a, b) {
  if (f < from) return 0;
  const k = from >= 1 ? 0 : (f - from) / (1 - from);
  return lerp(a, b, k);
}

function shape(B, f) {
  let ringSpan = lerp(B.ring0, B.ring1, f);
  const crossMs = Math.round(lerp(B.cross0, B.cross1, f));

  /*
   * ⚠ THE DWELL FLOOR IS ENFORCED HERE, STRUCTURALLY, not hoped for.
   * `ringSpan` shrinks while `crossMs` falls, and the two MULTIPLY: dwell =
   * ringSpan × crossMs. Left alone the top of hard gives 0.18 × 4400 = 792ms,
   * but a small retune of either lever silently pushes it under the time it
   * takes to see a thing and hit it — the exact shape of the Cancellation bug,
   * where a curve that looked fine granted 11 seconds for 45 seconds of work.
   * When the two levers would break the floor the RING WIDENS rather than the
   * march slowing, because march speed is what the player reads as difficulty.
   */
  if (ringSpan * crossMs < MIN_DWELL_MS) ringSpan = MIN_DWELL_MS / crossMs;

  const cfg = {
    count: Math.round(lerp(B.count0, B.count1, f)),
    crossMs,
    gapMs: Math.round(lerp(B.gap0, B.gap1, f)),
    ringSpan,
    ringA: RING_AT - ringSpan / 2,
    ringB: RING_AT + ringSpan / 2,
    nogoShare: staged(f, B.nogoFrom, B.nogo0, B.nogo1),
    hiddenShare: staged(f, B.hiddenFrom, B.hidden0, B.hidden1),
    armour: Math.round(staged(f, B.armourFrom, B.armour0, B.armour1)),
    barrels: Math.round(staged(f, B.barrelFrom, B.barrel0, B.barrel1)),
    nogoShuffle: Boolean(B.nogoShuffle),
    f,
  };

  /*
   * The hidden stretch is measured back from the FAR end of the reach, so a
   * marcher is always seen before they are lost.
   *
   * ⚠ AND THE SEEING IS FLOORED STRUCTURALLY. Authored alone, hard L64 came out
   * at 334ms of visibility against a 340ms floor — six milliseconds, invisible
   * in the config, and it turns a prediction into a coin flip. hiddenA is
   * therefore pushed back whenever the authored share would eat the run-up, and
   * hiddenShare is recomputed FROM the result so nothing downstream believes a
   * number the geometry does not honour.
   */
  const wantHiddenA = cfg.ringB - cfg.ringSpan * cfg.hiddenShare;
  const floorHiddenA = cfg.ringA + MIN_VISIBLE_MS / cfg.crossMs;
  cfg.hiddenA = Math.min(cfg.ringB, Math.max(wantHiddenA, floorHiddenA));
  cfg.hiddenB = cfg.ringB;
  cfg.hiddenShare = cfg.ringSpan > 0 ? (cfg.ringB - cfg.hiddenA) / cfg.ringSpan : 0;
  cfg.tolMs = Math.max(MIN_TOLERANCE_MS, Math.round(cfg.ringSpan * cfg.crossMs * 0.22));

  /* Numeric mirrors so audit:curves can assert the non-numeric levers too. */
  cfg.dwellMs = Math.round(cfg.ringSpan * cfg.crossMs);
  cfg.mechCount = mechanics(cfg).length;
  return cfg;
}

export function levelCfg(diff, level) {
  const B = BASE[diff] || BASE.easy;
  return { ...shape(B, levelFraction(level, LEVELS_PER_TIER, CURVE.FRONT)), diff, level };
}

/** Survival keeps climbing past the top of hard, but only through LOAD. */
export function survivalCfg(stage) {
  const s = Math.max(0, stage);
  const base = shape(BASE.hard, Math.min(1, s / 14));
  if (s <= 14) return { ...base, diff: 'free', stage: s };
  const over = s - 14;
  return {
    ...base,
    count: base.count + Math.round(over * 0.8),
    gapMs: Math.max(430, base.gapMs - over * 22),
    diff: 'free',
    stage: s,
  };
}

export const passCfg = () => ({ ...shape(BASE.med, 0.5), diff: 'passplay' });

/* ── BUILDING A WAVE ──────────────────────────────────────────────────────
 * `rng` is passed in — see the header note on Node and extensionless imports.
 * It must be a function returning a float in [0, 1).
 */
export const COLOURS = ['steel', 'rust', 'moss', 'bone'];

/**
 * A wave is a list of marchers with ABSOLUTE times, plus the barrels on the
 * trail. Everything the gate needs to prove the wave is playable — when each
 * one enters the reach, when it leaves, when it reaches the gate — is derivable
 * from these numbers without rendering anything.
 */
export function buildWave(rng, cfg, waveNo = 1) {
  const swap = cfg.nogoShuffle && rng() < 0.5;
  const goColour = COLOURS[swap ? 1 : 0];
  const nogoColour = COLOURS[swap ? 0 : 1];

  /* How many of this wave must be left alone. Clamped rather than rounded so
     the SHARE stays inside the Go/No-Go band instead of merely near it — on a
     5-marcher wave the difference between 1 and 2 is 20% against 40%. */
  const nogoCount = cfg.nogoShare > 0
    ? Math.min(
      Math.floor(cfg.count * NOGO_MAX_SHARE),
      Math.max(
        Math.ceil(cfg.count * NOGO_MIN_SHARE),
        Math.round(cfg.count * cfg.nogoShare),
      ),
    )
    : 0;

  const armourCount = Math.max(0, Math.min(cfg.armour, cfg.count - nogoCount - 1));

  const kinds = [];
  for (let i = 0; i < cfg.count; i += 1) {
    if (i < nogoCount) kinds.push(KIND.NOGO);
    else if (i < nogoCount + armourCount) kinds.push(KIND.ARMOUR);
    else kinds.push(KIND.GO);
  }
  for (let i = kinds.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const t = kinds[i]; kinds[i] = kinds[j]; kinds[j] = t;
  }
  /* ⚠ The FIRST marcher of a wave is never a no-go. Withholding only means
     something once striking is automatic, so a wave that opens on the forbidden
     colour tests nothing and reads as a trick. */
  const firstGo = kinds.findIndex((k) => k !== KIND.NOGO);
  if (firstGo > 0) { const t = kinds[0]; kinds[0] = kinds[firstGo]; kinds[firstGo] = t; }

  const units = [];
  let at = 0;
  for (let i = 0; i < cfg.count; i += 1) {
    const kind = kinds[i];
    const crossMs = Math.round(cfg.crossMs * (0.94 + rng() * 0.12));
    const enterAt = Math.round(at + cfg.ringA * crossMs);
    /*
     * ⚠ THE VISIBILITY FLOOR IS RE-APPLIED PER MARCHER, not just per level.
     * Each one walks at ±6% of the wave's pace, and a marcher on the fast end
     * reaches the canopy sooner — so a floor honoured by the config was broken
     * by 3–20ms in the built wave, at 21 levels of the hard tier. Exactly the
     * class of bug that sank the previous rebuild, where ships were spaced on
     * their unwarped times: A GUARANTEE MADE ON THE AVERAGE IS NOT A GUARANTEE.
     * Safe against exitAt because dwell >= 620ms and this floor is 340ms.
     */
    const hideAt = Math.max(Math.round(at + cfg.hiddenA * crossMs), enterAt + MIN_VISIBLE_MS);
    units.push({
      id: `w${waveNo}-${i}`,
      kind,
      colour: kind === KIND.NOGO ? nogoColour : goColour,
      spawnAt: Math.round(at),
      crossMs,
      taps: kind === KIND.ARMOUR ? 2 : 1,
      /* Absolute moments, precomputed so the renderer and the gate cannot
         re-derive them differently. */
      enterAt,
      exitAt: Math.round(at + cfg.ringB * crossMs),
      hideAt,
      gateAt: Math.round(at + crossMs),
    });
    at += cfg.gapMs * (0.85 + rng() * 0.3);
  }

  const barrels = [];
  for (let i = 0; i < cfg.barrels; i += 1) {
    /* Barrels sit INSIDE the reach, so detonating one is a real alternative to
       tapping — outside it they would only be scenery. */
    barrels.push({
      id: `b${waveNo}-${i}`,
      at: cfg.ringA + (cfg.ringSpan * (i + 1)) / (cfg.barrels + 1),
      spent: false,
    });
  }

  return { units, barrels, goColour, nogoColour, waveNo };
}

/* ── FEASIBILITY ──────────────────────────────────────────────────────────
 * Can one thumb actually clear this wave?
 *
 * ⚠ THIS IS THE POINT OF THE GATE, and it is the lesson audit:fq learned the
 * hard way: a curve whose SHAPE is correct can still produce a board no human
 * can finish. Cancellation asserted "targets go up, time goes down" for months
 * while granting 11 seconds for 45 seconds of work.
 *
 * Every GO and ARMOUR marcher needs `taps` strikes inside its own window, and
 * no two strikes may fall closer than MIN_TAP_GAP_MS. Scheduling greedily by
 * earliest deadline is optimal for unit jobs with release times and deadlines,
 * so if the greedy pass fits, a perfect player can clear the wave — and if it
 * does not, no player can, however good they are.
 */
export function feasible(wave) {
  const jobs = [];
  for (const u of wave.units) {
    if (u.kind === KIND.NOGO) continue;
    for (let k = 0; k < u.taps; k += 1) jobs.push({ open: u.enterAt, due: u.exitAt, id: u.id });
  }
  jobs.sort((a, b) => a.due - b.due || a.open - b.open);
  let t = -Infinity;
  for (const j of jobs) {
    const at = Math.max(j.open, t + MIN_TAP_GAP_MS);
    if (at > j.due) return { ok: false, failedAt: j.id, need: at, deadline: j.due };
    t = at;
  }
  return { ok: true, taps: jobs.length };
}

/** How long a marcher is strikeable, in ms. */
export const dwellMs = (cfg) => cfg.ringSpan * cfg.crossMs;
/** How long a marcher is visible INSIDE the reach before the canopy takes it. */
export const visibleMs = (cfg) => (cfg.hiddenShare > 0
  ? (cfg.hiddenA - cfg.ringA) * cfg.crossMs
  : dwellMs(cfg));

/** The mechanics a level actually puts on screen — used by the variety gate. */
export function mechanics(cfg) {
  const m = ['strike'];
  if (cfg.nogoShare > 0) m.push('nogo');
  if (cfg.barrels > 0) m.push('barrel');
  if (cfg.armour > 0) m.push('armour');
  if (cfg.hiddenShare > 0) m.push('canopy');
  if (cfg.nogoShuffle) m.push('shuffle');
  return m;
}

/* ── SCORING ──────────────────────────────────────────────────────────────
 * Three measures, because the game layers three things. Reporting a hit count
 * alone would throw away the two that make this game worth having.
 */
export function summarise(log) {
  const rts = log.filter((e) => e.type === 'hit').map((e) => e.rt);
  const signed = log.filter((e) => e.type === 'hit' && e.hidden).map((e) => e.err);
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const sd = (a) => {
    if (a.length < 2) return 0;
    const m = mean(a);
    return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length);
  };
  const commissions = log.filter((e) => e.type === 'commission').length;
  const withheld = log.filter((e) => e.type === 'withheld').length;
  return {
    kills: rts.length,
    misses: log.filter((e) => e.type === 'miss').length,
    commissions,
    withheld,
    /* Reported only when there WERE chances to withhold, so it never reads as a
       perfect score on a level that contained no no-go marchers at all. */
    nogoTotal: commissions + withheld,
    rt: Math.round(mean(rts)),
    rtSd: Math.round(sd(rts)),
    bias: Math.round(mean(signed)),
    spread: Math.round(sd(signed)),
    hidden: signed.length,
  };
}

/** A level is passed if the gate survives — visible the whole way through. */
export const levelPassed = (hpLeft) => hpLeft > 0;
