/*
 * Intercept — coincidence anticipation timing.
 *
 * A shape travels toward a gate and disappears behind cover partway. You tap the
 * instant it would cross. Because you cannot see it arrive, you are running a
 * forward model of where it is — the same machinery behind catching a ball,
 * pulling out at a junction, or stepping off a kerb.
 *
 * ⚠ WHY IT REPLACED TRAIL MAKING. The speed domain's other two games — Speed
 * Match (symbol to digit code) and Math Gates (arithmetic) — are both foveal,
 * symbolic and sequential: look at one thing in the middle, decode it, answer.
 * Trail Making was a third of those. This is none of them: no symbol to decode,
 * no answer to choose, and the measure is a signed error in milliseconds rather
 * than a count of correct responses.
 *
 * ── WHY THE FIRST VERSION GOT BORING, AND WHAT CHANGED (2026-08-14) ──
 *
 * The curve was never the problem. v1 had five levers and a hundred levels per
 * tier, and all five turned the SAME knob: travel down, visible down, tolerance
 * down. Level 1 and level 60 of a tier were the identical act, performed meaner.
 * A hundred levels delivered about three sensations, because the only genuinely
 * new things — profile mixing, the bounce path, the second mover — were pinned
 * to tier boundaries.
 *
 * So this version adds levers that change WHAT YOU DO rather than how tight the
 * window is, and each one is a different question:
 *
 *   gates    WHERE does it cross? Two lines; the mover's mark says which one is
 *            live. A decision layered under the timing, made before it hides.
 *   warp     the mover changes speed WHILE HIDDEN. The forward model has to be
 *            updated mid-flight, not merely run forward. This is the big one —
 *            extrapolation and revision are different skills.
 *   strobe   one ~130ms glimpse inside the tunnel. It exists BECAUSE of warp:
 *            a speed change you can never observe is a coin flip, so warp is
 *            never dealt without it (asserted by validate:intercept).
 *   launch   the whole task inverted. A metronome counts; you RELEASE the mover
 *            so it arrives on the silent fifth beat. Same forward model, read
 *            backwards, and the reason Survival stops feeling like one act.
 *
 * ⚠ `strobe` and `launch` are deliberately NOT terms in the gate's ordinalLoad.
 * Strobe makes a trial EASIER (that is its job — it pays for warp), and launch
 * is a different skill rather than a harder one. Folding either into the
 * difficulty number would let a real regression in the levers that decide
 * whether a level is POSSIBLE hide behind them. They are asserted on their own.
 */

/* ⚠ Explicit .js extensions. Vite resolves without them, plain Node does not,
   and validate:intercept runs in Node — dropping one breaks the GATE, not the
   app, which is the kind of failure that only shows up in CI. */
import { CURVE, levelFraction } from '../../../../shared/difficulty.js';

export const LEVELS_PER_TIER = 100;
export const WAVES_PER_SECTOR = 5;

/*
 * Motion profiles, as position along the path for u = elapsed / total.
 *
 * Every profile is normalised to arrive at exactly u = 1, so an UNWARPED mover
 * always reaches the far gate at the same instant regardless of profile — what
 * differs is what the visible portion tells you about it. That keeps scoring
 * identical across profiles and puts the whole difficulty into the inference.
 *
 * ⚠ `inv` is not decoration. Two of the new levers need to run the profile
 * BACKWARDS — "at what time is it at s?" — to place a near gate and to re-time a
 * warped mover. Both are exact inverses of `at`, not numeric searches, because
 * they are called per frame and a bisection here would be measurable.
 */
export const PROFILES = {
  steady: {
    id: 'steady',
    name: { en: 'Steady', ar: 'ثابت' },
    /** Constant speed — linear extrapolation is correct. */
    at: (u) => u,
    inv: (s) => s,
  },
  accel: {
    id: 'accel',
    name: { en: 'Accelerating', ar: 'مُتسارِع' },
    /* Starts slow and builds. Time it from the visible part alone and you tap
       LATE, because the hidden stretch is covered faster than what you saw. */
    at: (u) => u ** 1.6,
    inv: (s) => s ** (1 / 1.6),
  },
  decel: {
    id: 'decel',
    name: { en: 'Slowing', ar: 'مُتباطِئ' },
    /* Starts fast and eases off — the mirror error, and players tap EARLY. */
    at: (u) => u ** 0.62,
    inv: (s) => s ** (1 / 0.62),
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
 * you never see happen.
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

/*
 * THE GATES.
 *
 * The near gate sits at 0.74 of the route, comfortably past the furthest any
 * cover starts, so a near-gate crossing is still hidden. Which gate is live is
 * carried by a MARK ON THE MOVER, readable before it hides — the decision has to
 * be made from the visible stretch or it is not a decision, it is a memory test.
 *
 * ⚠ The near gate shortens the hidden stretch, which on its own makes a trial
 * EASIER. That is fine and intended — the cost is the decision, not the timing —
 * but it means the gate has to assert a floor on hidden time per GATE rather
 * than per level, or a near-gate trial could quietly become "just watch it".
 */
export const GATE_S = [0.74, 1.0];

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
 * Difficulty levers, independent on purpose so the curve has somewhere to go for
 * 100 levels without any one of them going silly:
 *
 *   travel      how long the whole run takes (faster = less time to estimate)
 *   visible     how long you get to WATCH before the cover
 *   tolerance   the hit window, in ms
 *   profiles    which motion profiles can appear
 *   gates       one crossing line, or two with a mark saying which
 *   warps       the speed multipliers that can apply inside the tunnel
 *   movers      how many arrive in one trial (hard tier only)
 *   launch      the share of trials that run inverted (release on the beat)
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
 * WHERE EACH NEW LEVER SWITCHES ON, as a fraction of the tier's curve.
 *
 * They are staggered rather than stacked: a level that introduces the second
 * gate does not also introduce warp, because the first time a player meets a
 * lever it should be the only new thing on the screen. The order is by how much
 * each one changes the act — gate (a decision), warp (a revision), second mover
 * (two models at once) — and `launch` sits alone because it is not on that
 * ladder at all.
 */
const ONSET = {
  easy: { gates: Infinity, warp: Infinity, movers: Infinity, launch: Infinity },
  med: { gates: 0.55, warp: Infinity, movers: Infinity, launch: 0.30 },
  hard: { gates: 0.22, warp: 0.44, movers: 0.72, launch: 0.30 },
};

/** The speed multipliers a warped mover can take. 1 is always in the deal. */
export const WARPS = [1, 1.34, 0.76];

/*
 * ⚠ THE FLOORS THAT KEEP IT PLAYABLE.
 *
 * Every one of these is asserted by validate:intercept rather than trusted, and
 * every one of them exists because the shape of a curve says nothing about
 * whether a human can play it — the lesson audit:fq learned the hard way.
 *
 *   MIN_VISIBLE_MS  you must see enough of the run to estimate its speed. Below
 *                   roughly a third of a second there is nothing to estimate
 *                   from and the trial becomes a coin flip dressed as a skill.
 *   MIN_TOLERANCE   human timing precision on this task sits around 60-80ms
 *                   even for experts, so a window under this is not difficulty,
 *                   it is noise.
 *   MIN_HIDDEN_MS   the stretch you have to PREDICT, per gate. A near gate with
 *                   90ms of cover is not a prediction, it is a reaction — and it
 *                   would measure the wrong thing while looking fine.
 *   MIN_REACT_MS    time between the strobe glimpse ending and the crossing. If
 *                   the glimpse lands too late to act on, warp is unobservable
 *                   again and we are back to a coin flip.
 */
export const MIN_VISIBLE_MS = 340;
export const MIN_TOLERANCE = 62;
export const MIN_HIDDEN_MS = 200;
export const MIN_REACT_MS = 180;

/** The mid-tunnel glimpse that pays for `warp`. */
export const STROBE_FRAC = 0.45;
export const STROBE_MS = 130;

/*
 * LAUNCH MODE.
 *
 * Five beats. Four of them sound; the fifth is silent and is the target. You
 * release the mover so that it CROSSES on the fifth, which means solving
 * `launchAt = beat5 - timeToGate` — the same forward model, run backwards.
 *
 * The tempo is derived rather than fixed, because a fixed one breaks at both
 * ends of the curve: at Easy's 2400ms travel a 620ms beat would have you launch
 * before you had heard two beats (nothing to lock onto), and at Hard's 1200ms it
 * would leave you waiting through most of the bar. Deriving it from the travel
 * keeps the release between beats 2 and 5 at every level, which the gate
 * asserts.
 */
export const LAUNCH_BEATS = 5;
export function launchBeatMs(timeToGate) {
  return Math.max(420, Math.min(900, Math.round((timeToGate + 900) / 3)));
}

/** Level config. Front-loaded so early levels feel distinct, like Math Gates. */
export function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  const on = ONSET[diff] || ONSET.med;
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
  const movers = f > on.movers ? 2 : b.movers;
  const gates = f > on.gates ? 2 : 1;
  const warps = f > on.warp ? WARPS : [1];

  /* Launch trials are a SHARE of the set, not a mode switch, so a level mixes
     the two readings of the same skill. It tops out below half: the forward
     direction is the one the science is named for, and launch is the variation. */
  const launchShare = f > on.launch
    ? Math.min(0.4, 0.18 + (f - on.launch) * 0.42)
    : 0;

  return {
    travel,
    visibleMs,
    tol,
    profiles: b.profiles,
    paths: b.paths,
    movers,
    gates,
    warps,
    launchShare,
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

/** Survival: one continuous ramp, entering each tier part-way up its curve. */
export function survivalCfg(stage) {
  const absoluteStage = Math.max(0, Math.floor(Number(stage) || 0));
  let s = absoluteStage;
  let baseCfg = null;
  for (let i = 0; i < SURVIVAL_PLAN.length; i++) {
    const tier = SURVIVAL_PLAN[i];
    const last = i === SURVIVAL_PLAN.length - 1;
    if (s < tier.rounds || last) {
      const span = Math.max(1, tier.rounds - 1);
      const u = Math.min(1, s / span);
      const lv = Math.round(tier.from + (tier.to - tier.from) * u);
      baseCfg = { diff: tier.diff, lv, ...levelCfg(tier.diff, lv) };
      break;
    }
    s -= tier.rounds;
  }

  if (!baseCfg) baseCfg = { diff: 'hard', lv: LEVELS_PER_TIER, ...levelCfg('hard', LEVELS_PER_TIER) };

  /*
   * A survival run used to stop growing after round 30: Hard L100 was returned
   * forever, so the promise of an endless mode became the same trial repeated
   * until three misses accumulated. The timing window cannot honestly shrink
   * below the human-noise floor, so late strength scales through simultaneous
   * forward models instead. A new threat joins every ten post-curriculum waves,
   * capped at four so every arrival remains readable and independently tappable.
   */
  const postCurriculum = Math.max(0, absoluteStage - 29);
  const extraMovers = postCurriculum > 0 ? 1 + Math.floor((postCurriculum - 1) / 10) : 0;
  const movers = Math.min(4, baseCfg.movers + extraMovers);

  const sector = Math.floor(absoluteStage / WAVES_PER_SECTOR) + 1;
  const wave = (absoluteStage % WAVES_PER_SECTOR) + 1;
  const mission = {
    sector,
    wave,
    surge: wave === WAVES_PER_SECTOR,
    pressure: Math.min(5, 1 + Math.floor(absoluteStage / 8)),
  };

  return {
    ...baseCfg,
    movers,
    mission,
    /* Launch remains a change of task rather than a difficulty multiplier, but
       later sectors deal it a little more often so the endless game keeps
       changing rhythm after the authored level curve is exhausted. */
    launchShare: Math.min(0.58, baseCfg.launchShare + Math.floor(postCurriculum / 10) * 0.05),
  };
}

/* ── The timing model ─────────────────────────────────────────────────────
 *
 * One pair of functions, exact inverses of each other, and everything else in
 * the game is expressed through them: the renderer asks "where at time t", the
 * scorer and the launch tempo ask "when at position s". Keeping it to one pair
 * is what makes warp safe to add — a second, separate arrival calculation is
 * how a mover ends up drawn in one place and scored in another.
 */

/** Where a mover is along its path, 0..1, at time `ms` since the round began. */
export function positionAt(mover, ms) {
  const u0 = (ms - mover.startAt) / mover.travel;
  if (u0 <= 0) return 0;
  const p = PROFILES[mover.profile] || PROFILES.steady;
  const w = mover.warp || 1;
  /* Before the cover it moves as its profile says; after, the same profile is
     read at a stretched or compressed rate. Continuous at uHide by construction,
     so nothing jumps on the frame the cover starts. */
  const u = u0 <= mover.uHide ? u0 : mover.uHide + (u0 - mover.uHide) * w;
  return u >= 1 ? 1 : p.at(u);
}

/** When a mover reaches position `s`, in ms since the round began. */
export function timeAtS(mover, s) {
  const p = PROFILES[mover.profile] || PROFILES.steady;
  const u = p.inv(Math.max(0, Math.min(1, s)));
  const w = mover.warp || 1;
  const uT = u <= mover.uHide ? u : mover.uHide + (u - mover.uHide) / w;
  return mover.startAt + uT * mover.travel;
}

/**
 * Build one trial. Deterministic given `rng`, so Pass n Play hands every player
 * the identical run.
 */
export function buildTrial(cfg, rng = Math.random) {
  /* One path for the whole trial: two movers on different paths would be two
     scenes at once rather than one harder scene, and there would be no honest
     place to put the second cover. */
  const pathId = cfg.paths[Math.floor(rng() * cfg.paths.length)];

  /* Launch is single-mover by nature — you have one release to give, and two
     shapes waiting on one tap would be a different game with no answer. */
  const kind = (cfg.launchShare > 0 && rng() < cfg.launchShare) ? 'launch' : 'intercept';
  const count = kind === 'launch' ? 1 : cfg.movers;

  const movers = [];
  for (let i = 0; i < count; i++) {
    const id = cfg.profiles[Math.floor(rng() * cfg.profiles.length)];
    const warp = cfg.warps[Math.floor(rng() * cfg.warps.length)];

    /*
     * ⚠ WARP ONLY EVER RUNS TO THE FAR GATE, and this is a feasibility rule
     * rather than a taste one.
     *
     * A warped mover has to be glimpsed mid-tunnel or the speed change is
     * unobservable, and the glimpse needs STROBE_MS to be seen plus MIN_REACT_MS
     * afterwards to be acted on — 310ms of hidden stretch before any of it is
     * honest. The near gate at Hard L100 leaves 277ms in total, so the strobe
     * would have ended 22ms before the crossing: visible, correct-looking, and
     * far too late to use. That is the Mirror World failure exactly — an
     * alternative that renders and registers and still cannot reach the win
     * condition — so the combination is refused at the source.
     *
     * The side effect is a rule players can learn (a near-gate mark means the
     * speed will hold), which is fine: the far gate stays ambiguous, so the
     * glimpse still has to be read on the trials that have one.
     */
    const canWarp = warp !== 1;
    const gateIdx = (cfg.gates > 1 && !canWarp) ? Math.floor(rng() * cfg.gates) : GATE_S.length - 1;
    const gateS = GATE_S[gateIdx];

    const hideAt = hideAtFor(id, cfg.visibleMs, cfg.travel);
    const m = {
      profile: id,
      travel: cfg.travel,
      startAt: 0,
      lane: i,
      /* Its own cover, positioned so THIS mover is visible for exactly
         cfg.visibleMs whatever its profile. One shared cover would give the
         accelerating shape a much shorter look than the slowing one. */
      hideAt,
      uHide: (PROFILES[id] || PROFILES.steady).inv(hideAt),
      warp,
      gate: gateIdx,
      gateS,
      path: pathId,
      /* Two movers share a path, so they are drawn on parallel offsets — see
         the renderer. Lane 0 sits on the line, lane 1 beside it. */
      offset: count === 1 ? 0 : i - (count - 1) / 2,
    };

    /*
     * ⚠ THE STAGGER IS SOLVED AGAINST THE ARRIVALS, NOT AUTHORED AS A FRACTION.
     *
     * v1 offset the second mover by 34-56% of travel and called it separated.
     * With warp that is no longer true: a slowed first mover and a sped-up
     * second one converge, and at Hard L100 the pair landed 31ms apart — inside
     * one 62ms window, so a single tap would have answered both and the second
     * forward model would have been decoration. So the offset is pushed out
     * until the arrivals are genuinely apart, whatever the warps did.
     */
    if (i > 0) {
      m.startAt = Math.round(cfg.travel * (0.34 + rng() * 0.22));
      const gap = Math.max(2.6 * cfg.tol, 240);
      let guard = 0;
      while (guard < 200 && movers.some((o) => Math.abs(timeAtS(m, m.gateS) - timeAtS(o, o.gateS)) < gap)) {
        m.startAt += Math.round(gap / 4);
        guard += 1;
      }
    }

    m.arriveAt = timeAtS(m, m.gateS);
    m.endAt = timeAtS(m, 1);
    m.hideTime = timeAtS(m, m.hideAt);

    /*
     * The glimpse exists only where it is needed. A strobe on an unwarped mover
     * would be a free hint on a trial that never needed one; on a warped one it
     * is the only reason the speed change is knowable at all.
     *
     * ⚠ Placed against the ROOM LEFT, not at a flat fraction of the tunnel. At a
     * flat 0.45 the glimpse drifts later as the hidden stretch shortens, and on
     * the tightest levels it ends after the crossing it was meant to inform —
     * the same class of bug as authoring occlusion instead of visible time. So
     * the deadline is subtracted first and the fraction spends what is left.
     */
    if (warp !== 1) {
      const span = m.arriveAt - m.hideTime;
      const room = span - STROBE_MS - MIN_REACT_MS;
      m.strobeAt = m.hideTime + Math.max(40, room * STROBE_FRAC);
      m.strobeMs = STROBE_MS;
    }

    movers.push(m);
  }

  const trial = {
    kind,
    movers,
    path: pathId,
    visibleMs: cfg.visibleMs,
    tol: cfg.tol,
    gates: cfg.gates,
  };

  if (kind === 'launch') {
    const m = movers[0];
    /* Time from release to the crossing — the quantity the player has to have
       learned from the preview run, and the one the tempo is built around. */
    const toGate = m.arriveAt - m.startAt;
    trial.beatMs = launchBeatMs(toGate);
    trial.targetAt = trial.beatMs * LAUNCH_BEATS;
    trial.launchAt = trial.targetAt - toGate;
    trial.toGate = toGate;
  }

  return trial;
}

/*
 * Score one tap. Returns the signed error in ms (negative = early) and whether
 * it landed inside the window.
 *
 * ⚠ POINTS REWARD PRECISION, AND v1 NEVER SHOWED THEM. The graded value has
 * been computed here since the first version and was thrown away by the caller,
 * so every hit felt identical to every other hit and there was no reason to
 * keep improving once you could reliably land inside the window. `perfect` is
 * the same number given a name the player can see and hear.
 */
export const PERFECT_FRAC = 0.34;

export function scoreTap(mover, tapMs, tol) {
  const err = tapMs - mover.arriveAt;
  const hit = Math.abs(err) <= tol;
  const perfect = Math.abs(err) <= tol * PERFECT_FRAC;
  const points = hit ? Math.max(1, Math.round(((tol - Math.abs(err)) / tol) * 20)) : 0;
  return { err, hit, perfect, points };
}

/** Launch trials score the ARRIVAL against the silent beat, not the tap. */
export function scoreLaunch(trial, releaseMs) {
  const m = trial.movers[0];
  const arrival = releaseMs + trial.toGate;
  const err = arrival - trial.targetAt;
  const hit = Math.abs(err) <= trial.tol;
  const perfect = Math.abs(err) <= trial.tol * PERFECT_FRAC;
  const points = hit ? Math.max(1, Math.round(((trial.tol - Math.abs(err)) / trial.tol) * 20)) : 0;
  return { err, hit, perfect, points, profile: m.profile, arrival };
}

/** Levels are cleared by hitting enough of the trials in the set. */
export const TRIALS_PER_LEVEL = 6;
export function levelPassed(hits) {
  return hits >= 4;
}
