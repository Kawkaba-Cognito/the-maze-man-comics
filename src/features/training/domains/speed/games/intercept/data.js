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

/* ── WEAPONS ──────────────────────────────────────────────────────────────
 * 2026-09-05: THE PLAYER NO LONGER TOUCHES THE MARCHERS.
 *
 * Every input is a button under the thumb, one per weapon, always in the same
 * place. Press a weapon and it fires at ITS OWN stretch of trail, hitting
 * everything standing there.
 *
 * ── Why this measures better rather than worse ──
 * Tapping a small moving target confounds reaction time with AIMING: a fast
 * little target costs pointing time (Fitts) that has nothing to do with the
 * construct. A button in a fixed place holds the motor act constant, so what is
 * left is the decision. And with two or three buttons the task stops being
 * simple reaction time and becomes CHOICE reaction time with a stimulus–response
 * mapping to learn — which is the thing that stops this being a fourth reaction
 * test in a domain that benched Trail Making for exactly that.
 *
 * It is also a better control on every axis that matters here: a bigger target,
 * one thumb, and a keyboard can reach it (see `WEAPON_KEYS` in index.jsx).
 *
 * ⚠ THE ORDER MATCHES `TOWER_AT`, NOT THE TRAIL. Tower 0 stands at 0.62 and is
 * the turret you own from L1; the missile arrives with band `missile` at L61 and
 * the mortar with band `mortar` at L81. `shape()` attaches the weapon BEFORE
 * sorting the towers along the trail, because after that sort the index is trail
 * order and no longer says which weapon you unlocked when.
 */
export const WEAPON_SPECS = [
  {
    kind: 'turret',
    /** Hits the instant you press. */
    flightMs: 0,
    /*
     * ⚠ THE RELOAD MUST FIT TWO SHOTS INSIDE ONE DWELL. Armour takes two turret
     * hits and a marcher is only strikeable for MIN_DWELL_MS, so a reload at or
     * above that floor makes an armoured marcher in a turret-only band literally
     * impossible — and it would present as "this level is unfair", not as a bug.
     */
    coolMs: 520,
    heavy: false,
    blast: 0,
  },
  {
    kind: 'missile',
    /** Flies, so you fire BEFORE they arrive. This is the prediction measure
     *  running on every shot rather than only under the canopy. */
    flightMs: 620,
    coolMs: 1500,
    /** Explosive: one shell takes armour outright. Not a convenience — a slow
     *  reload cannot fit two hits inside one dwell, so without this a marcher
     *  bound to the missile and wearing armour could never be killed at all. */
    heavy: true,
    blast: 0,
  },
  {
    kind: 'mortar',
    flightMs: 980,
    coolMs: 2400,
    heavy: true,
    /** The mortar is the one that hits a GROUP: its shell throws past the ends
     *  of its own stretch. Clamped in `shape()` against the real gap to the next
     *  stretch and asserted by validate:intercept — an unclamped blast would
     *  reach into another weapon's ground and make "which weapon is this marcher
     *  for" undecidable, which is the same property `boundOf` depends on. */
    blast: 0.030,
  },
];

/** Keep a weapon clear of its neighbour's stretch by at least this much trail. */
export const BLAST_CLEARANCE = 0.005;

/*
 * ⚠ A RELOAD IS CAPPED BY THE DWELL IT HAS TO WORK INSIDE. Authored alone, the
 * mortar's 2400ms is longer than a marcher is strikeable for at the top of the
 * ladder (620ms), so a marcher bound to it simply could not be served — and 64
 * of 500 built waves came back unclearable, every one of them reading "still
 * reloading". The authored numbers are what the weapon feels like EARLY, where
 * the dwell is 2.4 seconds and the mortar really is ponderous; they yield to the
 * geometry as the march tightens, exactly the way `ringSpan` yields to
 * MIN_DWELL_MS. The invariant this buys is simple and worth stating:
 *
 *     every weapon can always fire at least once while a marcher stands in its
 *     stretch, at every level.
 *
 * validate:intercept asserts that against the built config rather than trusting
 * this line.
 */
export const COOL_DWELL_MAX = 0.9;

/*
 * ⚠ AND CAPPED AGAIN BY THE COLUMN'S OWN PACE. The dwell cap alone still left 2
 * waves in 800 unclearable, each about 100ms short, all at the top of the ladder
 * where the column tightens to 620ms and a SPRINTER can close the gap further by
 * breaking ranks. A weapon that cannot answer marchers arriving at the wave's
 * own spacing is not slow, it is broken — and it fails as "this level is
 * unfair", which is indistinguishable from bad design.
 */
export const COOL_GAP_MAX = 0.75;

export const weaponSpec = (i) => WEAPON_SPECS[Math.min(WEAPON_SPECS.length - 1, Math.max(0, i))];

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
  /* L61–70  */ { adds: ['missile'] },
  /* L71–80  */ { adds: ['bound'] },
  /* L81–90  */ { adds: ['mortar'] },
  /* L91–100 */ { adds: ['sprint'] },
];

export const LADDER_LEVELS = LADDER.length * BAND_SIZE; // 100

/** The curve fraction at the first level of band `b`. */
export const bandStartF = (b) => ladderFraction(b * BAND_SIZE + 1, LADDER_LEVELS);

/** Which band introduces each mechanic — the single source for the thresholds. */
const BAND_OF = {
  nogo: 1, barrel: 2, armour: 3, canopy: 4, shuffle: 5,
  missile: 6, bound: 7, mortar: 8, sprint: 9,
};

/* ⚠ `missile` and `mortar` were `twin` and `triple` until 2026-09-05, when the
   three identical towers became three DIFFERENT weapons. The keys were renamed
   with them rather than left lying: a band whose label says "a flying missile"
   while its key says "a second tower" is the half-migrated-token failure this
   repo keeps paying for. Nothing persists these keys — they live in `LADDER`,
   `BAND_OF`, `LADDER_BASE.*From` and `mechanics()`, all in this file. */
export const MECHANIC_LABELS = {
  strike: { en: 'Fire on your stretch', ar: 'أطلق على مداك' },
  nogo: { en: 'Leave the wrong colour', ar: 'اترك اللون الخطأ' },
  barrel: { en: 'Explosive drums', ar: 'براميل متفجّرة' },
  armour: { en: 'Armour takes two', ar: 'المدرّع يحتاج ضربتين' },
  canopy: { en: 'Forest canopy', ar: 'مظلّة الغابة' },
  shuffle: { en: 'The safe colour changes', ar: 'اللون الآمن يتغيّر' },
  missile: { en: 'A missile that flies', ar: 'صاروخ يطير' },
  bound: { en: 'Marked for one weapon', ar: 'موسوم لسلاح واحد' },
  mortar: { en: 'A mortar that hits a group', ar: 'هاون يصيب مجموعة' },
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
  missileFrom: bandStartF(BAND_OF.missile),
  boundFrom: bandStartF(BAND_OF.bound), bound0: 0.25, bound1: 0.55,
  mortarFrom: bandStartF(BAND_OF.mortar),
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

/** How many weapons you own at a given curve fraction. */
export function towerCount(B, f) {
  let n = 1;
  if (B.missileFrom != null && f >= B.missileFrom) n = 2;
  if (B.mortarFrom != null && f >= B.mortarFrom) n = 3;
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
  /* ⚠ The weapon is attached HERE, by TOWER_AT index, because the sort below
     replaces that index with trail order. Tower 0 is the turret you own from
     L1; index 1 is the missile; index 2 is the mortar. */
  cfg.towers = TOWER_AT.slice(0, nTowers).map((at, i) => {
    const a = at - ringSpan / 2;
    const b = at + ringSpan / 2;
    const wantA = b - ringSpan * cfg.hiddenShare;
    const floorA = a + MIN_VISIBLE_MS / crossMs;
    const hiddenA = cfg.hiddenShare > 0 ? Math.min(b, Math.max(wantA, floorA)) : b;
    const w = weaponSpec(i);
    return {
      at, a, b, span: ringSpan, hiddenA, hiddenB: b,
      weapon: w.kind,
      flightMs: w.flightMs,
      /* See COOL_DWELL_MAX — the authored reload is what the weapon feels like
         early on; it yields to the dwell as the march tightens. */
      /*
       * ⚠ A WEAPON THAT CANNOT TAKE ARMOUR GETS HALF THE DWELL, NOT 0.9 OF IT.
       * The turret needs TWO hits inside one window, so its reload has to fit
       * twice over. Authored at 520ms it overran by ten milliseconds at exactly
       * one level of the hundred (L79: 1040ms of shooting inside a 1030ms
       * dwell) — invisible by playing, and it would have presented as one level
       * in the middle of the ladder being quietly unfair.
       */
      coolMs: Math.min(
        w.coolMs,
        Math.round(ringSpan * crossMs * (w.heavy ? COOL_DWELL_MAX : 0.5)),
        Math.round(cfg.gapMs * COOL_GAP_MAX),
      ),
      heavy: w.heavy,
      blast: w.blast,
    };
  });
  /* Sorted along the trail so a marcher's windows arrive in time order — the
     renderer, the strike test and the feasibility proof all rely on that. */
  cfg.towers.sort((p, q) => p.at - q.at);

  /*
   * ⚠ THE MORTAR'S BLAST IS CLAMPED AGAINST THE REAL GAP, NOT HOPED TO FIT.
   *
   * `blast` is what makes the mortar the weapon that hits a group — its shell
   * throws past the ends of its own stretch. But the stretches SHRINK with the
   * curve while the centres stay put, so the gap between them changes at every
   * level, and an authored 0.03 that is clear at L100 reaches into the turret's
   * ground at L81. If it ever did, "which weapon is this marcher for" would stop
   * being decidable from where it is standing — and `boundOf` rests on exactly
   * that. So the blast yields to the geometry, the same way ringSpan yields to
   * the dwell floor above. validate:intercept asserts the result rather than
   * trusting this arithmetic.
   */
  for (let i = 0; i < cfg.towers.length; i += 1) {
    const tw = cfg.towers[i];
    if (!(tw.blast > 0)) { tw.blast = 0; continue; }
    const before = cfg.towers[i - 1];
    const after = cfg.towers[i + 1];
    let room = Math.min(tw.a, 1 - tw.b);              // never off the trail
    if (before) room = Math.min(room, tw.a - before.b - BLAST_CLEARANCE);
    if (after) room = Math.min(room, after.a - tw.b - BLAST_CLEARANCE);
    tw.blast = Math.max(0, Math.min(tw.blast, room));
  }

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
    /*
     * A bound marcher answers to one weapon; everyone else to all of them.
     *
     * ⚠ ARMOUR IS NEVER MARKED FOR A WEAPON THAT CANNOT TAKE IT IN ONE SHOT.
     * Two turret-bound armoured marchers arriving back to back is the single
     * worst combination this wave builder can deal: four turret shots, each a
     * reload apart, inside two windows that do not overlap. It is serviceable by
     * milliseconds, or not at all, depending on where the sprinters fell — the
     * mechanical-expansion failure exactly, where a cross-product ships its
     * worst case because nobody enumerates it. A heavy weapon takes armour
     * outright, so binding armour to one of those removes the case rather than
     * tuning around it.
     */
    const eligible = kind === KIND.ARMOUR && towers.some((tw) => tw.heavy)
      ? towers.filter((tw) => tw.heavy)
      : towers;
    const boundTower = flag.bound ? eligible[Math.floor(rng() * eligible.length)] : null;
    const towerIdx = boundTower ? towers.indexOf(boundTower) : -1;
    const mine = towerIdx >= 0 ? [towers[towerIdx]] : towers;
    const windows = mine.map((tw) => {
      /* The HIT window, which is the stretch plus whatever the weapon throws
         past it. Only the mortar has a blast; for the others this is the
         stretch exactly. It is clamped in `shape()` so it can never reach a
         neighbouring weapon's ground. */
      const blast = tw.blast || 0;
      const enter = Math.round(at + (tw.a - blast) * crossMs);
      const exit = Math.round(at + (tw.b + blast) * crossMs);
      return {
        at: tw.at,
        weapon: tw.weapon,
        flightMs: tw.flightMs,
        coolMs: tw.coolMs,
        heavy: !!tw.heavy,
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
/*
 * ⚠ 2026-09-05: THE PROOF CHANGED SHAPE, BECAUSE THE INPUT DID.
 *
 * When the player tapped marchers, every strike was a unit job with one release
 * time and one deadline, and greedy earliest-deadline scheduling is provably
 * optimal for that — so "greedy fails" meant "nobody can". Buttons break that in
 * BOTH directions at once, and the two pull opposite ways:
 *
 *   · a press hits EVERYTHING in that weapon's stretch, so one press can serve
 *     several marchers — the wave got easier, and a tap-per-marcher proof would
 *     now reject waves a player clears comfortably;
 *   · each weapon has its OWN reload, far longer than the old 240ms thumb gap —
 *     so the same weapon genuinely cannot answer two separated marchers in
 *     quick succession, and a proof that ignored cooldown would pass waves
 *     nobody can clear.
 *
 * So this is a COVERING proof now, not a scheduling one: repeatedly serve the
 * most urgent unsatisfied marcher at the LATEST moment that still works, which
 * is the classic interval-stabbing choice and sweeps up every other marcher
 * standing in the same stretch for free.
 *
 * The direction that matters is unchanged and is what the game's honesty rests
 * on: when this returns ok it has CONSTRUCTED a real schedule — concrete hit
 * times, each inside a real window, none closer than that weapon's reload — so a
 * perfect player demonstrably can clear the wave. It may still be conservative
 * the other way. That is the safe direction for a gate to be wrong in, and it
 * surfaces as validate:intercept failing rather than as a player meeting a wave
 * that cannot be beaten. Do not "fix" it into a heuristic that returns ok
 * without building the schedule.
 *
 * ⚠ FLIGHT TIME DOES NOT LOOSEN A DEADLINE. A hit is scheduled at the moment it
 * LANDS; the press happens `flightMs` earlier. Two hits from the same weapon are
 * therefore still exactly `coolMs` apart, and the only extra constraint is that
 * the first hit cannot land before the shell has had time to fly.
 */
const winsOf = (u) => {
  const raw = (u.windows && u.windows.length)
    ? u.windows
    : [{ enterAt: u.enterAt, exitAt: u.exitAt, weapon: 'turret', coolMs: WEAPON_SPECS[0].coolMs, flightMs: 0, heavy: false }];
  return raw.map((w) => ({
    ...w,
    weapon: w.weapon || 'turret',
    coolMs: Number.isFinite(w.coolMs) ? w.coolMs : WEAPON_SPECS[0].coolMs,
    flightMs: Number.isFinite(w.flightMs) ? w.flightMs : 0,
    heavy: !!w.heavy,
  }));
};

export function feasible(wave) {
  const units = (wave.units || []).filter((u) => u.kind !== KIND.NOGO);
  const need = new Map();
  const wins = new Map();
  const guns = new Map();

  for (const u of units) {
    need.set(u.id, Math.max(1, u.taps || 1));
    const ws = winsOf(u);
    wins.set(u.id, ws);
    for (const w of ws) {
      if (!guns.has(w.weapon)) guns.set(w.weapon, { coolMs: w.coolMs, flightMs: w.flightMs, last: -Infinity });
    }
  }

  const plan = [];
  const total = units.reduce((s, u) => s + Math.max(1, u.taps || 1), 0);

  /* One press always satisfies at least the marcher it was aimed at, so this
     can run at most `total` times. The bound is a guard, not a policy. */
  for (let guard = 0; guard <= total + 4; guard += 1) {
    /* The most urgent marcher: the one whose last usable moment comes soonest.
       For each of its windows, the latest hit that still leaves room for the
       hits it has left — a heavy weapon needs only one, whatever the armour. */
    let urgent = null;
    for (const u of units) {
      const rem = need.get(u.id);
      if (rem <= 0) continue;
      let bestForU = null;
      for (const w of wins.get(u.id)) {
        const gun = guns.get(w.weapon);
        const hitsHere = w.heavy ? 1 : rem;
        const latest = w.exitAt - (hitsHere - 1) * gun.coolMs;
        if (latest < w.enterAt) continue;               // its taps cannot fit here
        if (!bestForU || latest < bestForU.latest) bestForU = { u, w, gun, latest };
      }
      if (!bestForU) {
        const last = wins.get(u.id).reduce((m, w) => Math.max(m, w.exitAt), 0);
        return { ok: false, failedAt: u.id, need: need.get(u.id), deadline: last, reason: 'reload cannot fit its hits inside any reach' };
      }
      if (!urgent || bestForU.latest < urgent.latest) urgent = bestForU;
    }
    if (!urgent) return { ok: true, presses: plan.length, plan };

    /* Serve it. Fire as LATE as it can still be served, which is what sweeps up
       everyone else standing in the same stretch. */
    let chosen = null;
    for (const w of wins.get(urgent.u.id)) {
      const gun = guns.get(w.weapon);
      const rem = need.get(urgent.u.id);
      const hitsHere = w.heavy ? 1 : rem;
      const latest = w.exitAt - (hitsHere - 1) * gun.coolMs;
      if (latest < w.enterAt) continue;
      const earliest = Math.max(
        w.enterAt,
        gun.last === -Infinity ? w.enterAt : gun.last + gun.coolMs,
        gun.flightMs,                                    // the shell has to fly
      );
      if (earliest > latest) continue;
      /*
       * ⚠ AS LATE AS POSSIBLE WITHOUT BLOCKING THE NEXT MARCHER THIS WEAPON OWES.
       *
       * Firing late sweeps up everyone else standing in the stretch, which is
       * what makes a crowded wave clearable at all. Firing early keeps the
       * weapon available. Neither alone works: measured over 1,600 built ladder
       * waves and 656 survival waves, always-late left 26 survival waves
       * unclearable and always-early left 11 — every one of them by less than
       * 100ms, all reading "still reloading".
       *
       * So look one step ahead. Find the soonest deadline any OTHER unsatisfied
       * marcher has on this same weapon, and never fire so late that the reload
       * would run past it.
       */
      let cap = Infinity;
      for (const v of units) {
        if (v.id === urgent.u.id) continue;
        const vRem = need.get(v.id);
        if (vRem <= 0) continue;
        for (const vw of wins.get(v.id)) {
          if (vw.weapon !== w.weapon) continue;
          const vHits = vw.heavy ? 1 : vRem;
          const vLatest = vw.exitAt - (vHits - 1) * gun.coolMs;
          if (vLatest < vw.enterAt) continue;
          if (vLatest < cap) cap = vLatest;
        }
      }
      /* ⚠ Leave room for MY OWN remaining hits too, not just the next marcher's
         first. Two turret-bound armoured marchers back to back is the case: the
         first version subtracted one reload, fired armour's opening shot 63ms
         too late, and its second shot then ate the reload the next marcher's
         first shot needed. Both were serviceable; the schedule was not. */
      const room = cap === Infinity ? latest : cap - hitsHere * gun.coolMs;
      const at = Math.max(earliest, Math.min(latest, room));
      /*
       * ⚠ THE EARLIEST-DEADLINE WINDOW, NOT THE ROOMIEST ONE.
       *
       * The first version took the window with the LARGEST `latest`, reasoning
       * that a later shot sweeps up more marchers. It served an unbound marcher
       * through the turret when the missile was the reach that made it urgent,
       * and firing at the turret's latest moment pushed that weapon's clock
       * thousands of milliseconds past everybody else's deadline: 65 of 300
       * waves came back unclearable. Choose the window the urgency actually
       * came from.
       */
      if (!chosen || latest < chosen.latest) chosen = { w, gun, at, latest, hitsHere };
    }
    if (!chosen) {
      const gun = guns.get(urgent.w.weapon);
      return {
        ok: false,
        failedAt: urgent.u.id,
        need: gun.last === -Infinity ? urgent.w.enterAt : gun.last + gun.coolMs,
        deadline: urgent.latest,
        reason: `${urgent.w.weapon} is still reloading`,
      };
    }

    /*
     * ⚠ A MARCHER'S HITS ARE PLACED TOGETHER, NOT ONE PER PASS.
     *
     * Armour needs two turret hits inside one dwell. Placing only the first and
     * going back round the loop let a marcher who was now more urgent take the
     * turret in between, and the second hit then fell outside the window — a
     * self-inflicted failure that had nothing to do with whether a player could
     * do it. A player servicing armour fires twice; so does the proof.
     */
    for (let k = 0; k < chosen.hitsHere; k += 1) {
      const at = chosen.at + k * chosen.gun.coolMs;
      chosen.gun.last = at;
      plan.push({ weapon: chosen.w.weapon, at, press: at - chosen.gun.flightMs });

      /* Everything of that weapon standing in the stretch takes this hit. */
      for (const v of units) {
        const rem = need.get(v.id);
        if (rem <= 0) continue;
        for (const w of wins.get(v.id)) {
          if (w.weapon !== chosen.w.weapon) continue;
          if (at < w.enterAt || at > w.exitAt) continue;
          need.set(v.id, w.heavy ? 0 : rem - 1);
          break;
        }
      }
    }
  }

  const stuck = units.find((u) => need.get(u.id) > 0);
  return stuck
    ? { ok: false, failedAt: stuck.id, need: need.get(stuck.id), deadline: 0, reason: 'ran out of presses' }
    : { ok: true, presses: plan.length, plan };
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
  if (cfg.nTowers >= 2) m.push('missile');
  if (cfg.boundShare > 0) m.push('bound');
  if (cfg.nTowers >= 3) m.push('mortar');
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
