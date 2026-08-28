/*
 * Mirror World — visuomotor adaptation.
 *
 * You flick from a home dot to a target. Partway through the run the mapping
 * between where you point and where the cursor goes is rotated. You recalibrate
 * without deciding to — and then the rotation is removed and your first reaches
 * go wrong THE OTHER WAY. That aftereffect is the whole point: flexibility here
 * is not a choice you make, it is a recalibration you undergo.
 *
 * ── The scaling contract ──
 * A run is a list of BLOCKS, and every difficulty lever is a FIELD on a block
 * with a default. Adding mirror reversal, endpoint-only feedback, more targets
 * or a longer ramp later is a data change — a new field and new rows — never an
 * engine rewrite. The engine reads fields it knows and ignores the rest, so a
 * schedule authored today still runs after the model grows.
 *
 * ⚠ Every schedule MUST end with a washout block. The aftereffect is the
 * Finding, and a player who stops after adapting never sees it. `validate:mirror`
 * asserts this rather than trusting the author, because a schedule missing its
 * washout still plays perfectly well — it just quietly measures nothing worth
 * showing.
 */

import {
  BAND_SIZE, ladderFraction, ladderStage, lerp, mechanicsAt,
} from '../../../../shared/difficulty.js';

/** Defaults for every block. A schedule row overrides only what it changes. */
export const BLOCK_DEFAULTS = {
  reaches: 8,
  rotation: 0,          // degrees of visuomotor rotation applied to the cursor
  ramp: false,          // introduce the rotation gradually across the block?
  mirror: false,        // reserved: reflect instead of rotate (a later tier)
  feedback: 'continuous', // 'continuous' | 'endpoint'  (endpoint is harder)
  targets: 8,           // how many target directions are possible
  role: 'adaptation',   // 'baseline' | 'adaptation' | 'washout'
};

export const ROLE = { BASE: 'baseline', ADAPT: 'adaptation', WASH: 'washout' };

/** Angular error (deg) under which a reach counts as on-target. */
export const HIT_DEG = 14;


/*
 * Tier shape. `rot` is the rotation at level 1; it grows across the tier.
 *
 * `ramp` is the lever that matters most and it is not a cosmetic one. Introduced
 * gradually (a couple of degrees per reach) the rotation stays under awareness
 * and you get genuine implicit adaptation. Dropped in abruptly, players notice
 * and consciously re-aim — which is a different ability, and a different thing
 * to measure. Easy ramps; Hard does not.
 */
/*
 * ── THE LADDER ──
 *
 * ONE climb of 50 levels, in five bands of ten. Replaced easy/med/hard on
 * 2026-08-28 — see LADDER-PLAN.md and shared/difficulty.js.
 *
 * The rotation ramps continuously underneath (20° → 60°, the old easy L1 to the
 * old hard L100, so neither end moved). What each band ADDS is structural: more
 * targets to re-aim at, a longer adaptation block, and finally the loss of the
 * gradual ramp-in, which is the hardest thing this game does — the whole
 * distortion arrives at once and has to be absorbed cold.
 *
 * ⚠ `targets` is not only load here. The accessible direction pad offers the
 * TARGET angles, so target count IS the pad's angular resolution: 4 targets
 * means 90° steps. Raising it makes the pad finer, which is why the pad-parity
 * simulation in validate:mirror must be re-run whenever this table changes.
 * 156 of 300 levels were once unpassable through that route.
 */
export const LADDER = [
  /* L1–10  */ { targets: 4, ramp: true, adaptReaches: 14, adds: ['mirror'] },
  /* L11–20 */ { targets: 6, ramp: true, adaptReaches: 15, adds: ['sixWays'] },
  /* L21–30 */ { targets: 6, ramp: true, adaptReaches: 16, adds: [] },
  /* L31–40 */ { targets: 8, ramp: true, adaptReaches: 17, adds: ['eightWays'] },
  /* L41–50 */ { targets: 8, ramp: false, adaptReaches: 18, adds: ['coldStart'] },
];

export const LADDER_LEVELS = LADDER.length * BAND_SIZE; // 50

export const MECHANIC_LABELS = {
  mirror: { en: 'The world is turned', ar: 'العالم مُدار' },
  sixWays: { en: 'Six directions', ar: 'ستّ اتجاهات' },
  eightWays: { en: 'Eight directions', ar: 'ثمانية اتجاهات' },
  coldStart: { en: 'No gentle ramp', ar: 'بلا تدرّج' },
};

/** Rotation at the ends of the ladder — unchanged from the old tier span. */
const ROT_START = 20;
const ROT_END = 60;



/**
 * Build the block schedule for one level.
 *
 * Always baseline → adaptation → washout. The washout is not optional and its
 * rotation is always 0; that block is where the aftereffect is measured.
 */
/** ⚠ SIGNATURE CHANGED with the ladder: one argument, no tier. */
export function levelSchedule(level) {
  const lv = Math.min(LADDER_LEVELS, Math.max(1, Math.round(Number(level) || 1)));
  const b = LADDER[Math.min(LADDER.length - 1, Math.floor((lv - 1) / BAND_SIZE))];
  const f = ladderFraction(lv, LADDER_LEVELS);
  const rot = Math.round(lerp(ROT_START, ROT_END, f));
  // Local, NOT written onto the band — LADDER is module-level and shared.
  const feedback = 'continuous';
  return [
    { ...BLOCK_DEFAULTS, role: ROLE.BASE, reaches: 5, rotation: 0, targets: b.targets, feedback },
    {
      ...BLOCK_DEFAULTS,
      role: ROLE.ADAPT,
      reaches: b.adaptReaches,
      rotation: rot,
      ramp: b.ramp,
      targets: b.targets,
      feedback,
    },
    { ...BLOCK_DEFAULTS, role: ROLE.WASH, reaches: 6, rotation: 0, targets: b.targets, feedback },
  ];
}

/** Survival: one continuous ramp up the ladder. */
export function survivalSchedule(stage) {
  const { lv } = ladderStage(stage, { levels: LADDER_LEVELS });
  return { lv, blocks: levelSchedule(lv) };
}

/** Pass n Play: one fixed schedule so every player faces the same run. */
export function passSchedule() {
  return levelSchedule(25);
}

/* ── Geometry ─────────────────────────────────────────────────────────────
 * Kept here rather than in the component so the gate can exercise the real
 * transform, not a copy of it.
 */

/** Target directions, evenly spread and always the same set for a given count. */
export function targetAngles(n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push((-90 + (360 / n) * i));
  return out;
}

/*
 * Aim resolution for the no-drag control (WCAG 2.5.7 alternative to the flick).
 *
 * ⚠ This is DELIBERATELY decoupled from `targets`. The first version of the
 * direction pad offered the target angles themselves — 4 of them on Easy, 90°
 * apart — while the rotation to be cancelled is 20–35°. A button user's best
 * achievable error is the distance from the rotation to the nearest button, so
 * 156 of 300 levels were literally unpassable through the accessible route
 * while looking perfectly fine on screen.
 *
 * 15° spacing bounds that residual at 7.5°, inside HIT_DEG on every scheduled
 * rotation. `validate:mirror` asserts it per level rather than trusting this
 * comment — if a future tier raises the rotation or narrows HIT_DEG, the gate
 * fails instead of quietly locking people out again.
 */
export const AIM_STEP_DEG = 15;

export function aimAngles(step = AIM_STEP_DEG) {
  const n = Math.round(360 / step);
  const out = [];
  for (let i = 0; i < n; i++) out.push(-180 + i * step);
  return out;
}

/** Apply a block's perturbation to a hand vector. Returns the CURSOR vector. */
export function perturb(dx, dy, block, reachIndex) {
  if (block.mirror) return { x: -dx, y: dy };   // reserved for a later tier
  let deg = block.rotation;
  if (block.ramp && block.rotation !== 0) {
    // Ease in over the first 60% of the block so it stays under awareness.
    const span = Math.max(1, Math.round(block.reaches * 0.6));
    deg = block.rotation * Math.min(1, (reachIndex + 1) / span);
  }
  const r = (deg * Math.PI) / 180;
  const cs = Math.cos(r), sn = Math.sin(r);
  return { x: dx * cs - dy * sn, y: dx * sn + dy * cs };
}

/** Signed angular error in degrees, wrapped to ±180. */
export function angularError(cursorAngleDeg, targetAngleDeg) {
  return ((cursorAngleDeg - targetAngleDeg + 540) % 360) - 180;
}

/**
 * Summarise a finished run.
 *
 * `aftereffect` is the mean SIGNED error on the first three washout reaches. It
 * should come out OPPOSITE in sign to the rotation that was just removed — that
 * is the whole demonstration, and it is what the results screen leads with.
 */
export function summarise(reaches, blocks) {
  const of = (role) => reaches.filter((r) => r.role === role);
  const abs = (xs) => (xs.length ? xs.reduce((a, x) => a + Math.abs(x.err), 0) / xs.length : null);
  const signed = (xs) => (xs.length ? xs.reduce((a, x) => a + x.err, 0) / xs.length : null);

  const base = of(ROLE.BASE);
  const adapt = of(ROLE.ADAPT);
  const wash = of(ROLE.WASH);
  const rotation = (blocks.find((b) => b.role === ROLE.ADAPT) || {}).rotation || 0;

  const early = abs(adapt.slice(0, 3));
  const late = abs(adapt.slice(-4));
  const aftereffect = signed(wash.slice(0, 3));
  const hits = reaches.filter((r) => Math.abs(r.err) <= HIT_DEG).length;

  return {
    baseline: abs(base),
    early,
    late,
    aftereffect,
    rotation,
    // Did practice actually help? Positive = you got better inside the block.
    learned: early != null && late != null ? early - late : null,
    hits,
    total: reaches.length,
  };
}

/**
 * Levels pass when you CANCELLED MOST OF THE PERTURBATION — measured against the
 * rotation, not against a fixed number of degrees.
 *
 * ⚠ This replaces `late <= HIT_DEG + 6 && learned > 0`, which was wrong twice.
 *
 * The fixed 20° threshold was scale-blind: on an Easy level with a 20° rotation,
 * a player who never adapted at all ends ~20° off and slides through, while the
 * same threshold is trivially loose at 60°. Tying it to the rotation makes the
 * bar mean the same thing at every tier.
 *
 * The `learned > 0` clause looked like a guard against passing without adapting,
 * but it fails honest players on RAMPED blocks: the rotation eases in, so the
 * early reaches are nearly unperturbed by design and there is little error left
 * to improve on. It also punished anyone whose aim is quantised — the no-drag
 * pad floors its residual at half a button — so it locked accessible players out
 * of levels a drag user passed. Cancelling the perturbation already implies
 * adaptation, so the clause was doing harm without doing its job; `learned` is
 * still reported, just no longer a gate.
 */
export function levelPassed(sum) {
  if (sum.late == null) return false;
  const bar = Math.max(HIT_DEG, (sum.rotation || 0) * 0.4);
  return sum.late <= bar;
}
