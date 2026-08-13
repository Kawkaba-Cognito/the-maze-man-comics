/*
 * Intercept — coincidence anticipation timing.
 *
 * A shape travels toward a line and disappears behind cover partway. You tap
 * the instant it would cross. Because you cannot see it arrive, you are running
 * a forward model of where it is — the same machinery behind catching a ball,
 * pulling out at a junction, or stepping off a kerb.
 *
 * ⚠ WHY IT REPLACED TRAIL MAKING. The speed domain's other two games — Speed
 * Match (symbol to digit code) and Math Gates (arithmetic) — are both foveal,
 * symbolic and sequential: look at one thing in the middle, decode it, answer.
 * Trail Making was a third of those. This is none of them: no symbol to decode,
 * no answer to choose, and the measure is a signed error in milliseconds rather
 * than a count of correct responses.
 *
 * ── THE SECOND LEVER, AND THE REASON THIS SCALES ──
 * If everything moved at a constant speed, this would be one skill practised
 * forever: watch, estimate, wait. The MOTION PROFILE is what gives it a
 * curriculum. A steady mover can be extrapolated linearly. An accelerating one
 * cannot — a player who times it linearly is always early, and has to learn to
 * hold. Mixing profiles inside a round means the shape has to be identified
 * before it hides, which is a real perceptual decision under time pressure and
 * not merely a harder version of the same guess.
 */

/* ⚠ Explicit .js extensions. Vite resolves without them, plain Node does not,
   and validate:intercept runs in Node — dropping one breaks the GATE, not the
   app, which is the kind of failure that only shows up in CI. */
import { CURVE, levelFraction } from '../../../../shared/difficulty.js';

export const LEVELS_PER_TIER = 100;

/*
 * Motion profiles, as position along the path for u = elapsed / total.
 *
 * Every profile is normalised to arrive at exactly u = 1, so the ANSWER is
 * always the same instant regardless of profile — what differs is what the
 * visible portion tells you about it. That is deliberate: it keeps the scoring
 * identical across profiles and puts the whole difficulty into the inference.
 */
export const PROFILES = {
  steady: {
    id: 'steady',
    name: { en: 'Steady', ar: 'ثابت' },
    /** Constant speed — linear extrapolation is correct. */
    at: (u) => u,
  },
  accel: {
    id: 'accel',
    name: { en: 'Accelerating', ar: 'مُتسارِع' },
    /* Starts slow and builds. Time it from the visible part alone and you tap
       LATE, because the hidden stretch is covered faster than what you saw. */
    at: (u) => u ** 1.6,
  },
  decel: {
    id: 'decel',
    name: { en: 'Slowing', ar: 'مُتباطِئ' },
    /* Starts fast and eases off — the mirror error, and players tap EARLY. */
    at: (u) => u ** 0.62,
  },
};

export const PROFILE_IDS = Object.keys(PROFILES);

/*
 * PATHS — the second kind of variety, and the reason no two runs look alike.
 *
 * A single left-to-right rail is one picture repeated for a hundred levels. The
 * skill barely changes when the path does, but the SCENE does, and a game you
 * are asked to play daily cannot look identical every time.
 *
 * `bounce` is the one that is not merely cosmetic: the mover reflects off a
 * wall while it is hidden, so the forward model has to carry a direction change
 * you never see happen. It is the hardest thing in the game and it is why the
 * hard tier has somewhere to go after the profiles run out.
 *
 * Points are normalised to the play box, so this works at any aspect ratio.
 */
export const PATHS = {
  ltr: { id: 'ltr', pts: [[0.06, 0.5], [0.94, 0.5]] },
  rtl: { id: 'rtl', pts: [[0.94, 0.5], [0.06, 0.5]] },
  ttb: { id: 'ttb', pts: [[0.5, 0.08], [0.5, 0.92]] },
  btt: { id: 'btt', pts: [[0.5, 0.92], [0.5, 0.08]] },
  diagDown: { id: 'diagDown', pts: [[0.08, 0.14], [0.92, 0.86]] },
  diagUp: { id: 'diagUp', pts: [[0.08, 0.86], [0.92, 0.14]] },
  bounce: { id: 'bounce', pts: [[0.06, 0.26], [0.58, 0.9], [0.94, 0.3]] },
  bounceHi: { id: 'bounceHi', pts: [[0.06, 0.82], [0.55, 0.12], [0.94, 0.74]] },
};

export const PATH_IDS = Object.keys(PATHS);

/** Cumulative arc length of a path, memoised — the geometry never changes. */
const pathLenCache = new Map();
function pathMetrics(id) {
  const hit = pathLenCache.get(id);
  if (hit) return hit;
  const pts = (PATHS[id] || PATHS.ltr).pts;
  const segs = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(d);
    total += d;
  }
  const rec = { pts, segs, total };
  pathLenCache.set(id, rec);
  return rec;
}

/** Point at arc-length fraction `s` (0..1) along a path, in normalised space. */
export function pathPoint(id, s) {
  const { pts, segs, total } = pathMetrics(id);
  let want = Math.max(0, Math.min(1, s)) * total;
  for (let i = 0; i < segs.length; i++) {
    if (want <= segs[i] || i === segs.length - 1) {
      const f = segs[i] ? Math.min(1, want / segs[i]) : 0;
      return [
        pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f,
        pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f,
      ];
    }
    want -= segs[i];
  }
  return pts[pts.length - 1];
}

/*
 * Difficulty. Five levers, and they are independent on purpose so the curve has
 * somewhere to go for 100 levels without any one of them going silly:
 *
 *   travel      how long the whole run takes (faster = less time to estimate)
 *   occlude     the fraction of the path that is hidden
 *   tolerance   the hit window, in ms
 *   profiles    which motion profiles can appear
 *   movers      how many arrive in one trial (hard tier only)
 */
/*
 * ⚠ THE VISIBLE WINDOW IS AUTHORED; THE OCCLUSION IS DERIVED. Do not swap them.
 *
 * The first version of this authored `occlude` as a fraction of the path and let
 * it rise while `travel` fell. Both are reasonable-looking ramps and together
 * they collapse a third quantity nobody was watching — the time you actually
 * get to WATCH — which fell through the floor at Hard level 2 and reached 130ms
 * by level 100. validate:intercept caught it on the first run.
 *
 * It is the same shape as the bug audit:fq shipped for months: targets rising
 * and time falling are each defensible, and their product made the tier
 * impossible. So the quantity the player depends on is the one authored here,
 * and the cover position is computed from it per profile.
 */
export const BASE = {
  easy: {
    travel: 2400, visible: 1100, tol: 190,
    profiles: ['steady'],
    paths: ['ltr', 'rtl'],
    movers: 1,
  },
  med: {
    travel: 2100, visible: 820, tol: 140,
    profiles: ['steady', 'accel'],
    paths: ['ltr', 'rtl', 'ttb', 'btt'],
    movers: 1,
  },
  hard: {
    travel: 1800, visible: 620, tol: 105,
    profiles: ['steady', 'accel', 'decel'],
    paths: ['ltr', 'rtl', 'ttb', 'btt', 'diagDown', 'diagUp', 'bounce', 'bounceHi'],
    movers: 1,
  },
};

/*
 * SURVIVAL ENTERS EACH TIER PART-WAY UP, and that is not a detail.
 *
 * Survival walks easy → med → hard continuously, so every tier's FIRST round
 * has to be harder than the previous tier's LAST. Starting each tier at level 1
 * failed exactly there: Medium level 92 scored 18.0 and Hard level 1 scored
 * 16.8, so the run got easier at the moment it was supposed to get frightening.
 *
 * The fix is not to make Hard's opening brutal — Levels mode needs a gentle
 * Hard level 1 for someone choosing it fresh. It is to enter the tier higher up
 * its own curve, which is what Cancellation does for the same reason. These
 * entry levels were searched against the boundary; validate:intercept asserts
 * the result, so if the curve is ever retuned the gate will name the tier that
 * dips rather than letting it ship.
 */
export const SURVIVAL_PLAN = [
  { diff: 'easy', rounds: 8, from: 4, to: 100 },
  { diff: 'med', rounds: 8, from: 12, to: 90 },
  { diff: 'hard', rounds: 14, from: 22, to: 100 },
];

/*
 * ⚠ THE FLOOR THAT KEEPS IT PLAYABLE.
 *
 * Two numbers decide whether a level is possible at all, and both are asserted
 * by validate:intercept rather than trusted:
 *
 *   MIN_VISIBLE_MS  you must see enough of the run to estimate its speed. Below
 *                   roughly a third of a second there is nothing to estimate
 *                   from and the trial becomes a coin flip dressed as a skill.
 *   MIN_TOLERANCE   human timing precision on this task sits around 60-80ms
 *                   even for experts, so a window under MIN_TOLERANCE is not
 *                   difficulty, it is noise.
 *
 * This is the lesson audit:fq learned the hard way: a curve can be beautifully
 * monotonic and still describe a game nobody can play.
 */
export const MIN_VISIBLE_MS = 340;
export const MIN_TOLERANCE = 62;

/** Level config. Front-loaded so early levels feel distinct, like Math Gates. */
export function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  const f = levelFraction(level, LEVELS_PER_TIER, CURVE.FRONT);

  const travel = Math.round(b.travel - f * (b.travel * 0.34));
  const tol = Math.max(MIN_TOLERANCE, Math.round(b.tol - f * (b.tol * 0.45)));

  /* The watching window shrinks, but never past the floor — and never past the
     point where less than a fifth of the run is hidden, or there is nothing to
     predict. Both bounds are structural, so no level can be authored below them. */
  const visibleMs = Math.round(Math.max(
    MIN_VISIBLE_MS,
    Math.min(b.visible - f * (b.visible * 0.42), travel * 0.8),
  ));

  /* A second mover only in the top third of Hard. It is the biggest jump in the
     game — two independent forward models at once — so it arrives late and
     alone rather than stacking on top of a fresh profile. */
  const movers = diff === 'hard' && f > 0.66 ? 2 : b.movers;

  return {
    travel,
    visibleMs,
    tol,
    profiles: b.profiles,
    paths: b.paths,
    movers,
    f,
    /** Derived, and only for reporting: how much of the PATH ends up hidden. */
    occlude: occlusionFor(visibleMs, travel, b.profiles),
  };
}

/*
 * How much of the path is hidden, given how long the player gets to watch.
 *
 * Profile-dependent, and that is the point: on an accelerating mover the first
 * 620ms covers far less ground than on a slowing one, so the same watching
 * window hides very different amounts. Reported as the worst (largest) case
 * across the profiles a level can deal.
 */
export function occlusionFor(visibleMs, travel, profiles) {
  let most = 0;
  for (const id of profiles) {
    const p = PROFILES[id];
    if (!p) continue;
    most = Math.max(most, 1 - p.at(Math.min(1, visibleMs / travel)));
  }
  return most;
}

/** Where along the path this mover's cover begins, 0..1. */
export function hideAtFor(profileId, visibleMs, travel) {
  const p = PROFILES[profileId] || PROFILES.steady;
  return p.at(Math.min(1, visibleMs / travel));
}

/** Survival: one continuous ramp, entering each tier part-way up its curve. */
export function survivalCfg(stage) {
  let s = Math.max(0, Math.floor(Number(stage) || 0));
  for (let i = 0; i < SURVIVAL_PLAN.length; i++) {
    const tier = SURVIVAL_PLAN[i];
    const last = i === SURVIVAL_PLAN.length - 1;
    if (s < tier.rounds || last) {
      const span = Math.max(1, tier.rounds - 1);
      const u = Math.min(1, s / span);
      const lv = Math.round(tier.from + (tier.to - tier.from) * u);
      return { diff: tier.diff, lv, ...levelCfg(tier.diff, lv) };
    }
    s -= tier.rounds;
  }
  return { diff: 'hard', lv: LEVELS_PER_TIER, ...levelCfg('hard', LEVELS_PER_TIER) };
}

/**
 * Build one trial. Deterministic given `rng`, so Pass n Play hands every player
 * the identical run.
 */
export function buildTrial(cfg, rng = Math.random) {
  const movers = [];
  /* One path for the whole trial: two movers on different paths would be two
     scenes at once rather than one harder scene, and there would be no honest
     place to put the second cover. */
  const pathId = cfg.paths[Math.floor(rng() * cfg.paths.length)];
  for (let i = 0; i < cfg.movers; i++) {
    const id = cfg.profiles[Math.floor(rng() * cfg.profiles.length)];
    // A second mover is offset so the two arrivals never coincide — otherwise
    // one tap would satisfy both and the extra mover would be decoration.
    const stagger = i === 0 ? 0 : Math.round(cfg.travel * (0.34 + rng() * 0.22));
    movers.push({
      profile: id,
      /** ms from round start until this mover crosses the line. */
      arriveAt: cfg.travel + stagger,
      travel: cfg.travel,
      startAt: stagger,
      lane: i,
      /* Its own cover, positioned so THIS mover is visible for exactly
         cfg.visibleMs whatever its profile. One shared cover would give the
         accelerating shape a much shorter look than the slowing one. */
      hideAt: hideAtFor(id, cfg.visibleMs, cfg.travel),
      path: pathId,
      /* Two movers share a path, so they are drawn on parallel offsets — see
         the renderer. Lane 0 sits on the line, lane 1 beside it. */
      offset: i === 0 ? 0 : 1,
    });
  }
  return { movers, path: pathId, visibleMs: cfg.visibleMs, tol: cfg.tol };
}

/** Where a mover is along its path, 0..1, at time `ms` since the round began. */
export function positionAt(mover, ms) {
  const u = (ms - mover.startAt) / mover.travel;
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  return PROFILES[mover.profile].at(u);
}

/**
 * Score one tap. Returns the signed error in ms (negative = early) and whether
 * it landed inside the window.
 *
 * Points reward PRECISION rather than merely landing inside the window, so
 * there is a reason to keep improving after you can reliably hit.
 */
export function scoreTap(mover, tapMs, tol) {
  const err = tapMs - mover.arriveAt;
  const hit = Math.abs(err) <= tol;
  const points = hit ? Math.max(1, Math.round(((tol - Math.abs(err)) / tol) * 20)) : 0;
  return { err, hit, points };
}

/** Levels are cleared by hitting enough of the trials in the set. */
export const TRIALS_PER_LEVEL = 6;
export function levelPassed(hits) {
  return hits >= 4;
}
