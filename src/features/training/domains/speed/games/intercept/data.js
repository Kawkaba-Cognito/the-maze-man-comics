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
import { BAND_SIZE, ladderFraction } from '../../../../shared/difficulty.js';


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
/*
 * ── THE LADDER ──
 *
 * ONE climb of 60 levels, in six bands of ten. Replaced easy/med/hard on
 * 2026-08-28 — see LADDER-PLAN.md and shared/difficulty.js.
 *
 * Intercept is the game the whole ladder model was derived from: it ALREADY
 * named its mechanics (`mechanics()` below) and already gated per-tier variety,
 * and counting them is what established that a real game has about six, not
 * ten. So its bands are simply its six mechanics, one per band, in the staging
 * order the tiers were groping towards: pure sight → no-go colour → barrels →
 * armour → canopy → a shuffling safe colour.
 *
 * ⚠ The `*From` thresholds are DERIVED from the band boundaries, never typed.
 * `f` is `ladderFraction` (^0.85), so the fraction at L11 is 0.221, not 0.167 —
 * hand-writing these would drift every mechanic off the band edge it is
 * supposed to arrive on, and nothing on screen would show it.
 */
export const LADDER = [
  /* L1–10   */ { adds: ['strike'] },
  /* L11–20  */ { adds: ['nogo'] },
  /* L21–30  */ { adds: ['barrel'] },
  /* L31–40  */ { adds: ['armour'] },
  /* L41–50  */ { adds: ['canopy'] },
  /* L51–60  */ { adds: ['shuffle'] },
  /* L61–70  */ { adds: ['twin'] },
  /* L71–80  */ { adds: ['bound'] },
  /* L81–90  */ { adds: ['triple'] },
  /* L91–100 */ { adds: ['sprint'] },
];

export const LADDER_LEVELS = LADDER.length * BAND_SIZE; // 100

/** The curve fraction at the first level of band `b`. */
export const bandStartF = (b) => ladderFraction(b * BAND_SIZE + 1, LADDER_LEVELS);

/** Which band introduces each mechanic — the single source for the thresholds. */
const BAND_OF = {
  nogo: 1, barrel: 2, armour: 3, canopy: 4, shuffle: 5,
  twin: 6, bound: 7, triple: 8, sprint: 9,
};

export const MECHANIC_LABELS = {
  strike: { en: 'Strike them in the reach', ar: 'اضرب داخل المدى' },
  nogo: { en: 'Leave the wrong colour', ar: 'اترك اللون الخطأ' },
  barrel: { en: 'Explosive drums', ar: 'براميل متفجّرة' },
  armour: { en: 'Armour takes two', ar: 'المدرّع يحتاج ضربتين' },
  canopy: { en: 'Forest canopy', ar: 'مظلّة الغابة' },
  shuffle: { en: 'The safe colour changes', ar: 'اللون الآمن يتغيّر' },
  twin: { en: 'A second tower', ar: 'برج ثانٍ' },
  bound: { en: 'Marked for one tower', ar: 'موسوم لبرج واحد' },
  triple: { en: 'A third tower', ar: 'برج ثالث' },
  sprint: { en: 'Runners break ranks', ar: 'العدّاؤون ينطلقون' },
};

/*
 * ONE span, from the old easy L1 to the old hard L100, so nothing got easier or
 * harder at either end. Each mechanic arrives already inside its usable range —
 * see the `staged` note below about a no-go share that ramps up from zero.
 */
export const LADDER_BASE = {
  count0: 5, count1: 18,
  cross0: 8200, cross1: 4400,
  gap0: 1500, gap1: 620,
  ring0: 0.30, ring1: 0.18,
  nogoFrom: bandStartF(BAND_OF.nogo), nogo0: 0.18, nogo1: 0.34,
  hiddenFrom: bandStartF(BAND_OF.canopy), hidden0: 0.40, hidden1: 0.78,
  armourFrom: bandStartF(BAND_OF.armour), armour0: 1, armour1: 6,
  barrelFrom: bandStartF(BAND_OF.barrel), barrel0: 1, barrel1: 3,
  shuffleFrom: bandStartF(BAND_OF.shuffle),
  twinFrom: bandStartF(BAND_OF.twin),
  boundFrom: bandStartF(BAND_OF.bound), bound0: 0.25, bound1: 0.55,
  tripleFrom: bandStartF(BAND_OF.triple),
  sprintFrom: bandStartF(BAND_OF.sprint), sprint0: 1, sprint1: 3,
};

/*
 * ── THE TOWERS ──
 *
 * Reaches are centred on these fractions of the trail, and they arrive in this
 * order: one tower to L60, a second from L61, a third from L81.
 *
 * ⚠ THE ORDER OF THIS ARRAY IS THE ORDER THEY ARRIVE, NOT THEIR ORDER ALONG
 * THE TRAIL. T2 sits EARLIER on the trail than T1 (0.30 vs 0.62), so when it
 * appears the player gains a strike window *before* the one they already know
 * rather than after it. Adding the new tower downstream instead would have let
 * a player simply wait — the old window first, the new one as a safety net —
 * which is not divided attention, it is a second chance.
 *
 * ⚠ They must never OVERLAP. `boundOf` marks a marcher for exactly one tower,
 * and overlapping reaches would make "which tower is this one for" undecidable
 * from position alone. validate:intercept asserts disjointness at every level,
 * because the spans SHRINK with the curve and the centres do not move — so the
 * check has to run against the built geometry, not against these numbers.
 */
export const TOWER_AT = [0.62, 0.30, 0.86];

/** How many towers stand at a given curve fraction. */
export function towerCount(B, f) {
  let n = 1;
  if (B.twinFrom != null && f >= B.twinFrom) n = 2;
  if (B.tripleFrom != null && f >= B.tripleFrom) n = 3;
  return n;
}

/** Kept for the tutorial and the hub art: where the FIRST tower stands. */
export const RING_AT = TOWER_AT[0];

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

  const nTowers = towerCount(B, f);

  const cfg = {
    count: Math.round(lerp(B.count0, B.count1, f)),
    crossMs,
    gapMs: Math.round(lerp(B.gap0, B.gap1, f)),
    ringSpan,
    nTowers,
    ringA: TOWER_AT[0] - ringSpan / 2,
    ringB: TOWER_AT[0] + ringSpan / 2,
    boundShare: nTowers > 1 ? staged(f, B.boundFrom, B.bound0, B.bound1) : 0,
    sprinters: nTowers > 0 ? Math.round(staged(f, B.sprintFrom, B.sprint0, B.sprint1)) : 0,
    nogoShare: staged(f, B.nogoFrom, B.nogo0, B.nogo1),
    hiddenShare: staged(f, B.hiddenFrom, B.hidden0, B.hidden1),
    armour: Math.round(staged(f, B.armourFrom, B.armour0, B.armour1)),
    barrels: Math.round(staged(f, B.barrelFrom, B.barrel0, B.barrel1)),
    // The safe colour starts shuffling at its band, like every other mechanic.
    nogoShuffle: B.shuffleFrom != null ? f >= B.shuffleFrom : Boolean(B.nogoShuffle),
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
  /*
   * ⚠ THE CANOPY COVERS A STRETCH OF *EVERY* TOWER, not just the first.
   * With canopy on one tower only, a marcher walking into a hidden reach could
   * simply be left until the next tower's clear reach — the prediction measure
   * would be optional, and an optional measure is one nobody's score reflects.
   * The floor is re-applied per tower for the same reason it is re-applied per
   * marcher below: a guarantee made on the average is not a guarantee.
   */
  cfg.towers = TOWER_AT.slice(0, nTowers).map((at) => {
    const a = at - ringSpan / 2;
    const b = at + ringSpan / 2;
    const wantA = b - ringSpan * cfg.hiddenShare;
    const floorA = a + MIN_VISIBLE_MS / crossMs;
    const hiddenA = cfg.hiddenShare > 0 ? Math.min(b, Math.max(wantA, floorA)) : b;
    return { at, a, b, span: ringSpan, hiddenA, hiddenB: b };
  });
  /* Sorted along the trail so a marcher's windows arrive in time order — the
     renderer, the strike test and the feasibility proof all rely on that. */
  cfg.towers.sort((p, q) => p.at - q.at);

  /* The first tower's numbers stay on `cfg` under their old names: the tutorial,
     the hub art and audit:curves all read them, and the canopy share below is
     re-derived from the geometry so nothing downstream trusts a number the
     towers do not honour. */
  const t0 = cfg.towers.find((tw) => tw.at === TOWER_AT[0]) || cfg.towers[0];
  cfg.hiddenA = t0.hiddenA;
  cfg.hiddenB = t0.hiddenB;
  cfg.hiddenShare = ringSpan > 0 ? (t0.hiddenB - t0.hiddenA) / ringSpan : 0;
  cfg.tolMs = Math.max(MIN_TOLERANCE_MS, Math.round(cfg.ringSpan * cfg.crossMs * 0.22));

  /* Numeric mirrors so audit:curves can assert the non-numeric levers too. */
  cfg.dwellMs = Math.round(cfg.ringSpan * cfg.crossMs);
  cfg.mechCount = mechanics(cfg).length;
  return cfg;
}

/** ⚠ SIGNATURE CHANGED with the ladder: one argument, no tier. */
export function levelCfg(level) {
  const lv = Math.min(LADDER_LEVELS, Math.max(1, Math.round(Number(level) || 1)));
  const cfg = shape(LADDER_BASE, ladderFraction(lv, LADDER_LEVELS));
  return { ...cfg, mechanics: mechanics(cfg), lv, level: lv };
}

/** Survival keeps climbing past the top of the ladder, but only through LOAD. */
export function survivalCfg(stage) {
  const s = Math.max(0, stage);
  const base = shape(LADDER_BASE, Math.min(1, s / 14));
  if (s <= 14) return { ...base, stage: s };
  const over = s - 14;
  return {
    ...base,
    count: base.count + Math.round(over * 0.8),
    gapMs: Math.max(430, base.gapMs - over * 22),
    stage: s,
  };
}

/* The midpoint of the ladder — L50 of 100 since the climb doubled, so Pass n
   Play sits where it always did rather than sliding to the easy end. */
export const passCfg = () => ({ ...shape(LADDER_BASE, ladderFraction(50, LADDER_LEVELS)) });

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

  const towers = cfg.towers || [{
    at: TOWER_AT[0], a: cfg.ringA, b: cfg.ringB, span: cfg.ringSpan,
    hiddenA: cfg.hiddenA, hiddenB: cfg.hiddenB,
  }];

  /* Which marchers are marked for exactly one tower. Never the first of the
     wave, for the same reason the first is never a no-go: a rule you meet
     before the plain case has nothing to be an exception to. */
  const boundCount = towers.length > 1 && cfg.boundShare > 0
    ? Math.min(cfg.count - 1, Math.round(cfg.count * cfg.boundShare))
    : 0;
  /* Sprinters likewise — a wave that opens on the odd one out reads as a trick
     rather than as a break in a rank you had already settled into. */
  const sprintCount = Math.min(Math.max(0, cfg.sprinters), Math.max(0, cfg.count - 1));

  const flags = [];
  for (let i = 0; i < cfg.count; i += 1) {
    flags.push({ bound: i > 0 && i <= boundCount, sprint: false });
  }
  /* Sprinters are drawn from the BACK of the column so the two marks rarely
     land on the same marcher — a bound sprinter is legal but a wave made of
     them stops testing either idea on its own. */
  for (let i = 0, n = 0; i < cfg.count && n < sprintCount; i += 1) {
    const idx = cfg.count - 1 - i;
    if (idx <= 0) break;
    flags[idx].sprint = true; n += 1;
  }
  for (let i = flags.length - 1; i > 1; i -= 1) {
    const j = 1 + Math.floor(rng() * i);
    const t = flags[i]; flags[i] = flags[j]; flags[j] = t;
  }

  const units = [];
  let at = 0;
  for (let i = 0; i < cfg.count; i += 1) {
    const kind = kinds[i];
    const flag = flags[i] || { bound: false, sprint: false };
    /*
     * ⚠ A SPRINTER'S SPEED IS FLOORED BY THE DWELL IT LEAVES, not authored.
     * `ringSpan` is already floored so that span × crossMs >= MIN_DWELL_MS at
     * the wave's pace — but a marcher walking the trail in 0.7× that time is
     * strikeable for 0.7× as long, which at the top of the ladder is 434ms
     * against a 620ms floor. The whole point of a sprinter is that it is hard
     * to catch, not that it is impossible, so the speed-up yields to the floor.
     */
    let factor = 0.94 + rng() * 0.12;
    if (flag.sprint) {
      const floorFactor = MIN_DWELL_MS / (cfg.ringSpan * cfg.crossMs);
      factor = Math.max(0.66 + rng() * 0.06, floorFactor);
    }
    const crossMs = Math.round(cfg.crossMs * factor);
    /* A bound marcher answers to one tower; everyone else to all of them. */
    const towerIdx = flag.bound ? Math.floor(rng() * towers.length) : -1;
    const mine = towerIdx >= 0 ? [towers[towerIdx]] : towers;
    const windows = mine.map((tw) => {
      const enter = Math.round(at + tw.a * crossMs);
      const exit = Math.round(at + tw.b * crossMs);
      return {
        at: tw.at,
        enterAt: enter,
        exitAt: exit,
        /* Per window AND per marcher — see the note above. */
        hideAt: cfg.hiddenShare > 0
          ? Math.max(Math.round(at + tw.hiddenA * crossMs), enter + MIN_VISIBLE_MS)
          : exit,
      };
    });
    const enterAt = windows[0].enterAt;
    /*
     * ⚠ THE VISIBILITY FLOOR IS RE-APPLIED PER MARCHER AND PER WINDOW, not per
     * level. Each one walks at ±6% of the wave's pace (a sprinter far faster),
     * and a marcher on the fast end reaches the canopy sooner — so a floor
     * honoured by the config was broken by 3–20ms in the built wave, at 21
     * levels of the old hard tier. Exactly the class of bug that sank the
     * previous rebuild, where ships were spaced on their unwarped times:
     * A GUARANTEE MADE ON THE AVERAGE IS NOT A GUARANTEE. That floor now lives
     * in the `windows` map above, where the geometry actually is.
     */
    units.push({
      id: `w${waveNo}-${i}`,
      kind,
      colour: kind === KIND.NOGO ? nogoColour : goColour,
      spawnAt: Math.round(at),
      crossMs,
      taps: kind === KIND.ARMOUR ? 2 : 1,
      /* Which tower this one answers to, or -1 for "any". */
      towerIdx,
      sprint: flag.sprint,
      /* Absolute moments, precomputed so the renderer and the gate cannot
         re-derive them differently. One entry per reach this marcher may be
         struck in, in trail order. */
      windows,
      enterAt,
      exitAt: windows[windows.length - 1].exitAt,
      hideAt: windows[0].hideAt,
      gateAt: Math.round(at + crossMs),
    });
    at += cfg.gapMs * (0.85 + rng() * 0.3);
  }

  const barrels = [];
  /* Barrels sit INSIDE a reach, so detonating one is a real alternative to
     tapping — outside one they would only be scenery. They are dealt round
     robin across the towers so a wave never stacks every drum on one reach. */
  for (let i = 0; i < cfg.barrels; i += 1) {
    const tw = towers[i % towers.length];
    const nth = Math.floor(i / towers.length) + 1;
    const per = Math.ceil(cfg.barrels / towers.length) + 1;
    barrels.push({
      id: `b${waveNo}-${i}`,
      at: tw.a + (tw.span * nth) / per,
      tower: tw.at,
      spent: false,
    });
  }

  return { units, barrels, goColour, nogoColour, towers, waveNo };
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
/*
 * ⚠ A MARCHER NOW HAS SEVERAL WINDOWS, AND THAT CHANGES WHAT THIS PROVES.
 * With one tower each tap was a unit job with a single release time and
 * deadline, where greedy earliest-deadline scheduling is provably optimal — so
 * "greedy fails" meant "nobody can". With two or three towers the allowed set
 * is a UNION of intervals and that textbook optimality no longer transfers.
 *
 * The direction that matters still holds, and it is the direction the game's
 * honesty rests on: when this returns ok it has CONSTRUCTED a real schedule —
 * concrete tap times, each inside a real window, none closer than
 * MIN_TAP_GAP_MS — so a perfect player demonstrably can clear the wave. It can
 * in principle be conservative the other way and reject a wave some cleverer
 * ordering would fit. That is the safe direction for a gate to be wrong in, and
 * it would surface as validate:intercept failing rather than as a player
 * meeting an impossible wave. Do not "fix" it by weakening it to a heuristic
 * that returns ok without building the schedule.
 */
export function feasible(wave) {
  const jobs = [];
  for (const u of wave.units) {
    if (u.kind === KIND.NOGO) continue;
    const wins = (u.windows && u.windows.length
      ? u.windows
      : [{ enterAt: u.enterAt, exitAt: u.exitAt }]
    ).slice().sort((a, b) => a.enterAt - b.enterAt);
    const due = wins[wins.length - 1].exitAt;
    for (let k = 0; k < u.taps; k += 1) jobs.push({ wins, due, id: u.id });
  }
  jobs.sort((a, b) => a.due - b.due || a.wins[0].enterAt - b.wins[0].enterAt);
  let t = -Infinity;
  const plan = [];
  for (const j of jobs) {
    const earliest = t === -Infinity ? -Infinity : t + MIN_TAP_GAP_MS;
    let at = null;
    for (const w of j.wins) {
      const cand = Math.max(w.enterAt, earliest);
      if (cand <= w.exitAt) { at = cand; break; }
    }
    if (at == null) {
      return {
        ok: false,
        failedAt: j.id,
        need: earliest === -Infinity ? j.wins[0].enterAt : earliest,
        deadline: j.due,
      };
    }
    plan.push(at);
    t = at;
  }
  return { ok: true, taps: jobs.length, plan };
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
  if (cfg.nTowers >= 2) m.push('twin');
  if (cfg.boundShare > 0) m.push('bound');
  if (cfg.nTowers >= 3) m.push('triple');
  if (cfg.sprinters > 0) m.push('sprint');
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
