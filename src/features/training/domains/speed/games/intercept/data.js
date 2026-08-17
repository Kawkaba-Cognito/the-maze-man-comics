/*
 * INTERCEPT — Rift Defense.  [speed]
 *
 * Ships come down the lanes toward your gate. Partway they cross a cover band
 * and vanish. You strike the lane at the exact instant the ship reaches the
 * strike line — which you cannot see it do. Because it is hidden, you are
 * running a forward model of where it is: the same machinery behind catching a
 * ball, pulling out at a junction, or stepping off a kerb.
 *
 * The measure is a SIGNED ERROR IN MILLISECONDS, early or late. Not a count of
 * correct answers.
 *
 * ⚠ WHY IT REPLACED TRAIL MAKING. The speed domain's other two games — Speed
 * Match (symbol→digit code) and Math Gates (arithmetic) — are both foveal,
 * symbolic and sequential: look at one thing in the middle, decode it, answer.
 * Trail Making was a third. This is none of them, and that is the whole reason
 * it exists. Keep it that way.
 *
 * ── WHY IT WAS REBUILT AS A WAVE GAME (2026-08-17) ────────────────────────
 *
 * Reported as boring, not obviously scaling, and carrying a between-sector
 * UPGRADE SHOP that "doesn't feel like it belongs". All three were true, and
 * measurable:
 *
 *   · The shop sold difficulty. `scan` bought +80ms of visibility and `pulse`
 *     +12ms of hit window, and the stage reached feeds awardFreeRun → the speed
 *     domain rating. Two players with identical timing got different ratings
 *     depending on what they bought. In a measurement app that is backwards, so
 *     it is gone — difficulty now comes only from the wave, which a gate checks.
 *
 *   · It did not scale. Counting NAMEABLE mechanics rather than continuous
 *     knobs, the easy tier had exactly ONE across all 100 levels: the identical
 *     act, with travel 2400→1584ms and the window 190→105ms. Every genuinely
 *     new lever lived in med/hard. The previous version's own header complained
 *     about precisely this failure in the version before it, and then shipped it
 *     again in the tier where new players spend their first hundred levels.
 *
 *   · The boredom was structural, not tuning. One countdown, one mover, ONE
 *     TAP, then dead air. Every other game in the platform gives you something
 *     to do continuously.
 *
 * So the unit of play changed. A wave puts several ships in flight at once, in
 * different lanes, arriving at different moments. You are no longer waiting
 * between trials — you are holding two or three forward models simultaneously
 * and acting on each as it comes due. That is both a better game and a harder,
 * more honest version of the same construct: predicting one hidden arrival is
 * the skill; predicting three overlapping ones is that skill under load.
 *
 * ⚠ Explicit .js extensions. Vite resolves without them, plain Node does not,
 * and validate:intercept runs in Node — dropping one breaks the GATE, not the
 * app, which is the kind of failure that only shows up in CI.
 */
import { CURVE, levelFraction } from '../../../../shared/difficulty.js';

export const LEVELS_PER_TIER = 100;

/* ── PERCEPTUAL FLOORS ────────────────────────────────────────────────────
 * These are the numbers that decide whether a wave is POSSIBLE, as opposed to
 * merely hard, and they are why this file has a gate. Carried over unchanged
 * from the previous version, plus one new one for the wave format.
 */
/** Below this there is nothing to estimate speed from, so the strike is a guess. */
export const MIN_VISIBLE_MS = 340;
/** A hit window tighter than this is inside human timing noise, not skill. */
export const MIN_TOLERANCE = 62;
/** Below this the ship is barely hidden and there is nothing to predict. */
export const MIN_HIDDEN_MS = 200;
/** Time to see a glimpse and act on it. */
export const MIN_REACT_MS = 220;
/** One strobe glimpse inside the cover, for waves that warp. */
export const STROBE_MS = 130;
/**
 * NEW for waves: two ships must never come due closer together than this, in
 * any lane. A player has one thumb. Without this a wave can be arithmetically
 * clearable and physically impossible — the same failure audit:fq caught in
 * Cancellation, where the curve was fine and the board could not be finished.
 */
export const MIN_ARRIVAL_GAP_MS = 300;

/* ── SHIP KINDS ───────────────────────────────────────────────────────────
 * Position along the lane for u = elapsed / travel. Every kind is normalised to
 * arrive at exactly u = 1, so ARRIVAL TIME IS THE SAME for all of them — what
 * differs is what the visible stretch tells you about it. A charger looks slow
 * early and is not; a stalker looks fast early and is not. That is the whole
 * trick, and it is why the profile is a difficulty lever rather than decoration.
 */
export const KINDS = {
  drifter: {
    id: 'drifter', art: 'steady',
    en: 'Drifter', ar: 'الهائمة',
    pos: (u) => u,
  },
  charger: {
    id: 'charger', art: 'accel',
    en: 'Charger', ar: 'المندفعة',
    pos: (u) => u * u,
  },
  stalker: {
    id: 'stalker', art: 'decel',
    en: 'Stalker', ar: 'المتربّصة',
    pos: (u) => 1 - (1 - u) * (1 - u),
  },
  blinker: {
    id: 'blinker', art: 'accel',
    en: 'Blinker', ar: 'الوامضة',
    /* Constant, but its SPEED CHANGES while hidden — see `warp` below. The
       forward model has to be revised mid-flight rather than merely run
       forward, which is a different skill from extrapolation. */
    pos: (u) => u,
    warps: true,
  },
};
export const KIND_IDS = Object.keys(KINDS);

/** Speed multipliers applied inside the cover. 1 = no change. */
export const WARPS = [1.32, 0.74];

/** Where along the lane the strike line sits (0 = spawn edge, 1 = the gate). */
export const STRIKE_AT = 0.86;

/* ── DIFFICULTY ───────────────────────────────────────────────────────────
 * Seven levers, and every one is something the player can name:
 *
 *   lanes        how wide the front is
 *   perWave      how many ships a wave sends
 *   concurrency  HOW MANY ARE IN FLIGHT AT ONCE — the lever that makes this a
 *                wave game rather than a series of single trials, and the one
 *                that scales load rather than just meanness
 *   waves        how long a level runs
 *   travel       how long a ship takes to cross
 *   visibleMs    how much of that you get to watch before the cover
 *   tol          the hit window
 *   kinds        which ship types can appear
 *
 * ⚠ NOTE WHAT IS ABSENT: there is no shop, and no lever the player can buy.
 * There is also no lever that makes a wave unclearable — MIN_ARRIVAL_GAP_MS is
 * enforced when the wave is BUILT, not hoped for.
 *
 * ⚠ Every tier must introduce something. The previous curve's easy tier had one
 * mechanic across 100 levels; `validate:intercept` now counts distinct mechanic
 * sets per tier and fails a tier that never introduces anything.
 */
export const BASE = {
  easy: {
    lanes0: 2, lanes1: 3,
    per0: 4, per1: 8,
    conc0: 1, conc1: 2,
    waves0: 3, waves1: 4,
    travel0: 2600, travel1: 1900,
    vis0: 1150, vis1: 780,
    tol0: 190, tol1: 120,
    kinds0: ['drifter'],
    kinds1: ['drifter', 'charger'],
  },
  med: {
    lanes0: 3, lanes1: 3,
    per0: 6, per1: 11,
    conc0: 2, conc1: 3,
    waves0: 4, waves1: 5,
    travel0: 2300, travel1: 1650,
    vis0: 900, vis1: 620,
    tol0: 150, tol1: 92,
    kinds0: ['drifter', 'charger'],
    kinds1: ['drifter', 'charger', 'stalker'],
  },
  hard: {
    lanes0: 3, lanes1: 4,
    per0: 8, per1: 14,
    conc0: 2, conc1: 3,
    waves0: 4, waves1: 5,
    travel0: 2000, travel1: 1500,
    vis0: 760, vis1: 520,
    tol0: 120, tol1: 70,
    kinds0: ['drifter', 'charger', 'stalker'],
    kinds1: ['drifter', 'charger', 'stalker', 'blinker'],
  },
};

/** Gate hearts. A wave is survivable losing a few, so one slip is not fatal. */
export const HEARTS = 3;

const lerp = (a, b, f) => a + (b - a) * f;
const li = (a, b, f) => Math.round(lerp(a, b, f));

export function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  const f = levelFraction(level, LEVELS_PER_TIER, CURVE.FRONT);
  const travel = li(b.travel0, b.travel1, f);
  // Visibility is floored, and also capped so a ship is always hidden long
  // enough that there is something to predict.
  const visibleMs = Math.max(
    MIN_VISIBLE_MS,
    Math.min(li(b.vis0, b.vis1, f), travel - MIN_HIDDEN_MS),
  );
  return {
    lanes: li(b.lanes0, b.lanes1, f),
    perWave: li(b.per0, b.per1, f),
    concurrency: li(b.conc0, b.conc1, f),
    waves: li(b.waves0, b.waves1, f),
    travel,
    visibleMs,
    tol: Math.max(MIN_TOLERANCE, li(b.tol0, b.tol1, f)),
    kinds: f < 0.5 ? b.kinds0 : b.kinds1,
    hearts: HEARTS,
    f,
    // numeric mirrors so audit:curves can assert the list levers never shrink
    kindCount: (f < 0.5 ? b.kinds0 : b.kinds1).length,
  };
}

/** Survival: one continuous ramp, endless waves, no shop. */
export function survivalCfg(stage) {
  // walk the three tiers, then keep tightening within hard
  const span = 12;
  const tier = stage < span ? 'easy' : stage < span * 2 ? 'med' : 'hard';
  const within = tier === 'easy' ? stage / span
    : tier === 'med' ? (stage - span) / span
      : Math.min(1, (stage - span * 2) / (span * 1.6));
  const lv = Math.max(1, Math.round(within * LEVELS_PER_TIER));
  return { ...levelCfg(tier, lv), waves: 1, tier, lv };
}

/** Pass n Play: everyone defends the same waves. */
export function passCfg() {
  return { ...levelCfg('med', 40), waves: 3 };
}

/* ── WAVE BUILDER ─────────────────────────────────────────────────────────
 * A wave is a list of ships, each with a lane, a launch time and an arrival
 * time. The builder's job is to place arrivals so that:
 *
 *   · no two are closer together than MIN_ARRIVAL_GAP_MS (one thumb)
 *   · no more than `concurrency` are in flight at any instant
 *   · every ship is visible for at least MIN_VISIBLE_MS and hidden for at
 *     least MIN_HIDDEN_MS
 *   · a warping ship always gets its strobe glimpse, with MIN_REACT_MS left
 *     to act on it — a speed change you can never observe is a coin flip
 *
 * These are enforced HERE, at build time, rather than asserted hopefully after
 * the fact. `validate:intercept` then re-checks the built waves independently.
 */
const pickR = (arr, rng) => arr[Math.floor(rng() * arr.length)];

export function buildWave(rng, cfg, waveIndex = 0) {
  const { lanes, perWave, concurrency, travel, visibleMs, tol, kinds } = cfg;
  const ships = [];
  const baseGap = Math.max(MIN_ARRIVAL_GAP_MS, Math.round(travel / Math.max(1, concurrency)) - 120);
  let prevDue = 0;
  let lastLane = -1;

  for (let i = 0; i < perWave; i++) {
    // spread the gap a little so the wave does not become a metronome — a fixed
    // cadence is predictable WITHOUT running the forward model, which would let
    // a player beat the game by counting instead of estimating
    const jitter = Math.round((rng() - 0.5) * baseGap * 0.5);

    // avoid the same lane twice in a row when there is a choice, so the eye moves
    const laneChoices = lanes > 1 ? [...Array(lanes).keys()].filter((l) => l !== lastLane) : [0];
    const lane = pickR(laneChoices.length ? laneChoices : [...Array(lanes).keys()], rng);
    lastLane = lane;

    const kind = KINDS[pickR(kinds, rng)];
    let warp = 1;
    let strobeAt = null;
    const hidden = travel - visibleMs;
    if (kind.warps && hidden >= STROBE_MS + MIN_REACT_MS + 80) {
      // only warp when the cover is long enough to show a glimpse AND leave
      // time to act on it — an unobservable speed change is a coin flip
      warp = pickR(WARPS, rng);
      strobeAt = visibleMs + Math.round((hidden - STROBE_MS - MIN_REACT_MS) * 0.45);
    }

    /*
     * ⚠ Space by the moment the ship COMES DUE, not by its unwarped arrival.
     * Spacing the unwarped time left blinkers landing 22ms after the ship
     * before them against a 300ms floor, because a warp of 1.32 pulls the due
     * moment forward. The due time is the only thing the player acts on, so it
     * is the only thing worth spacing.
     */
    const dueSpan = visibleMs + (travel - visibleMs) / warp;
    let due = i === 0 ? dueSpan + 600 : prevDue + Math.max(MIN_ARRIVAL_GAP_MS, baseGap + jitter);
    let launchAt = due - dueSpan;

    /*
     * ⚠ And enforce CONCURRENCY, which the first version declared and never
     * applied — a "3 in flight" config was putting 6 on the field.
     *
     * ⚠⚠ The count has to be taken across EVERY launch instant, not just this
     * ship's. A slow warp (0.74) stretches the run, so that ship launches
     * EARLIER than the one placed before it — launches are not monotonic, and
     * an incremental "who is airborne when I take off" check misses the
     * overlap it creates behind itself. The gate caught exactly that: 3 ships
     * on a 2-ship field at hard L1.
     *
     * Overlap only ever rises at a launch, so checking each launch instant is
     * sufficient as well as necessary.
     */
    const overlapFits = (cand) => {
      const all = [...ships, cand];
      for (const p of all) {
        let n = 0;
        for (const q of all) if (q.launchAt <= p.launchAt && p.launchAt <= q.due) n += 1;
        if (n > concurrency) return false;
      }
      return true;
    };
    for (let guard = 0; guard < 60; guard++) {
      if (overlapFits({ launchAt, due })) break;
      // slide the whole ship later until the field has room
      const nextFree = ships
        .map((s) => s.due)
        .filter((d) => d > launchAt)
        .sort((a, b) => a - b)[0];
      launchAt = (nextFree != null ? nextFree : launchAt + 120) + 1;
      due = launchAt + dueSpan;
    }
    prevDue = Math.max(prevDue, due);

    ships.push({
      id: `w${waveIndex}s${i}`,
      lane,
      kind: kind.id,
      art: kind.art,
      travel,
      warp,
      strobeAt,
      launchAt,
      due,
      visibleMs,
      tol,
      struck: false,
    });
  }
  return ships;
}

/** All the waves for one level. */
export function buildLevel(rng, cfg) {
  const out = [];
  for (let w = 0; w < cfg.waves; w++) out.push(buildWave(rng, cfg, w));
  return out;
}

/* ── MOTION ───────────────────────────────────────────────────────────────
 * Where a ship is along its lane at time `t` (ms since the wave started), as a
 * fraction 0..1 where STRIKE_AT is the strike line and 1 is the gate.
 *
 * A warp changes the speed INSIDE the cover, so the ship still departs when it
 * departed but arrives early or late. The visible stretch is untouched — which
 * is the point: everything you were shown remains true, and is no longer enough.
 */
/** How far through its run a ship is, as u where 1 = due at the strike line. */
export function runFraction(ship, t) {
  const el = t - ship.launchAt;
  if (el <= 0) return 0;
  if (ship.warp === 1 || el <= ship.visibleMs) return el / ship.travel;
  // the warp only bends the hidden stretch; everything already seen stays true
  const visU = ship.visibleMs / ship.travel;
  return visU + ((el - ship.visibleMs) / ship.travel) * ship.warp;
}

export function progressAt(ship, t) {
  const u = runFraction(ship, t);
  if (u <= 0) return 0;
  if (u <= 1) return KINDS[ship.kind].pos(u) * STRIKE_AT;
  // past the strike line it coasts on to the gate, so a miss is visibly a miss
  return STRIKE_AT + Math.min(1, (u - 1) * 2.6) * (1 - STRIKE_AT);
}

/** Is the ship behind the cover band right now? */
export function isHidden(ship, t) {
  const u = runFraction(ship, t);
  if (u <= 0 || u >= 1) return false;
  const el = t - ship.launchAt;
  if (el < ship.visibleMs) return false;
  if (ship.strobeAt != null && el >= ship.strobeAt && el < ship.strobeAt + STROBE_MS) return false;
  return true;
}

/**
 * The moment a ship comes due at the strike line.
 *
 * Stored on the ship rather than recomputed, because the builder has to space
 * ships BY this value — and a due time computed in two places is a due time
 * that will eventually disagree with itself.
 */
export function dueAt(ship) {
  return ship.due;
}

/**
 * Score one strike. Returns the SIGNED error in ms (negative = early) and
 * whether it counts as a hit. `perfect` is the inner half of the window, which
 * is what a streak is built from — it rewards precision without making the
 * ordinary hit feel like a miss.
 */
export function scoreStrike(ship, tapAt) {
  const err = tapAt - dueAt(ship);
  const abs = Math.abs(err);
  return {
    err,
    hit: abs <= ship.tol,
    perfect: abs <= ship.tol * 0.4,
    early: err < 0,
  };
}

/** A level is cleared if the gate survived. */
export function levelPassed(heartsLeft) {
  return heartsLeft > 0;
}

/** Summary stats for a run — the psychometrics, not the score. */
export function summarise(strikes) {
  const hits = strikes.filter((s) => s.hit);
  const errs = strikes.map((s) => s.err);
  const abs = errs.map(Math.abs);
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const m = mean(errs);
  const sd = errs.length > 1
    ? Math.sqrt(mean(errs.map((e) => (e - m) * (e - m))))
    : 0;
  return {
    total: strikes.length,
    hits: hits.length,
    perfect: strikes.filter((s) => s.perfect).length,
    // signed mean: negative = habitually early. This is the interesting number
    // and the reason the game measures error rather than counting successes.
    bias: Math.round(m),
    // spread: consistency, which is usually the better marker
    spread: Math.round(sd),
    absMean: Math.round(mean(abs)),
  };
}
