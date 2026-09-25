/*
 * Math Gates level curve — a .js data module so `audit:curves` can gate it.
 *
 * It used to live in index.jsx, which put it on audit-curves' list of six
 * curves that "CANNOT be gated where it sits, because the config lives in a
 * React file". So nothing checked that Hard is genuinely harder than Easy at
 * the same level number, or that each tier climbs monotonically — the exact
 * question raised on 2026-08-15 ("make sure in levels the difficulty is
 * correct, when entering difficult it will get difficult").
 *
 * THE LEVERS, and which direction each moves:
 *   ops     — how many operations can appear (+,- → +,-,× → +,-,×,÷). The
 *             biggest single jump between tiers, and division is the hardest.
 *   gap     — ms between gates. Falls with level, floored so the game never
 *             becomes a pure reaction wall (see audit:pacing for the same
 *             lesson applied to three other games).
 *   lives   — fewer on harder tiers.
 *   target  — gates to clear; rises with level.
 */
import {
  BAND_SIZE, ladderFraction, mechanicsAt,
} from '../../../../shared/difficulty.js';
import { clamp, lerp } from '../../../../../../lib/math.js';

/** Floor for the gate interval, asserted by audit:pacing. */
export const MG_MIN_GAP = 450;

/*
 * ── THE LADDER ──
 *
 * ONE climb of 50 levels, in five bands of ten. Replaced easy/med/hard on
 * 2026-08-28 — see LADDER-PLAN.md and shared/difficulty.js.
 *
 * This game had the clearest hidden ladder in the app: its OPERATOR SET was
 * `opCount: 2→2` across all hundred Easy levels, 3→3 across Medium, 4→4 across
 * Hard. Multiplication and division — the two most interesting things Math
 * Gates does — were not levels you reached, they were menu words you had to
 * know to pick. Now × arrives at L21 and ÷ at L41, by playing.
 *
 * `mag` (0/1/2) is the number-magnitude band, carrying what the old easy/med/
 * hard branches inside genGate() used to decide. It is a config value now
 * rather than a tier name, so nothing outside this file needs to know the
 * tiers ever existed.
 *
 * Span unchanged at both ends: L1 is the old easy L1 (+ and −, 5 lives, 700ms)
 * and L50 the old hard L100 (all four operators, 3 lives, the 450ms floor).
 */
export const LADDER = [
  /* L1–10  */ { ops: ['+', '-'], lives: 5, mag: 0, adds: ['addsub'] },
  /* L11–20 */ { ops: ['+', '-'], lives: 4, mag: 1, adds: [] },
  /* L21–30 */ { ops: ['+', '-', '×'], lives: 4, mag: 1, adds: ['multiply'] },
  /* L31–40 */ { ops: ['+', '-', '×'], lives: 3, mag: 2, adds: [] },
  /* L41–50 */ { ops: ['+', '-', '×', '÷'], lives: 3, mag: 2, adds: ['divide'] },
];

export const LADDER_LEVELS = LADDER.length * BAND_SIZE; // 50

export const MECHANIC_LABELS = {
  addsub: { en: 'Add and subtract', ar: 'جمع وطرح' },
  multiply: { en: 'Multiplication', ar: 'ضرب' },
  divide: { en: 'Division', ar: 'قسمة' },
};

/*
 * SURVIVAL pace. Reported 2026-08-15 as "make sure in survival the game will
 * get harder" — and it did not.
 *
 * Survival ramped the equation TIER and magnitude by skill (gatesPlayed/36 →
 * survivalTier), but the spawn interval came from a `cfg` computed once, at
 * `dkey = 'easy'`. So `gap` sat at 700ms and `lives` at 5 for the entire run,
 * however far you got: the sums grew, the pressure never did, and the run
 * plateaued into an endless easy rhythm.
 *
 * Pace now ramps on the same skill fraction, floored at MG_MIN_GAP so it never
 * becomes the pure reaction wall audit:pacing exists to prevent.
 */
export const MG_SURVIVAL_GAP_START = 720;

export function survivalGap(f) {
  return Math.max(MG_MIN_GAP, Math.round(MG_SURVIVAL_GAP_START - (f || 0) * 260));
}

/** ⚠ SIGNATURE CHANGED with the ladder: one argument, no tier. */
export function levelCfg(level) {
  const lv = Math.min(LADDER_LEVELS, Math.max(1, Math.round(Number(level) || 1)));
  const band = LADDER[Math.min(LADDER.length - 1, Math.floor((lv - 1) / BAND_SIZE))];
  const f = ladderFraction(lv, LADDER_LEVELS);
  return {
    ops: band.ops,
    lives: band.lives,
    mag: band.mag,
    gap: Math.max(MG_MIN_GAP, Math.round(700 - f * 250)),
    target: 8 + Math.round(f * 14),
    opCount: band.ops.length,
    mechanics: mechanicsAt(LADDER, lv),
    lv,
    f,
  };
}

export const MATH_GATES_SECTIONS = [
  'nebula', 'asteroid-belt', 'solar-flare', 'supernova', 'void',
];

export const MATH_GATES_BANDS = (isAr) => [
  {
    title: isAr ? 'بهو السديم' : 'Nebula Concourse',
    sub: isAr ? 'جمع وطرح · ٥ أرواح' : 'Addition & subtraction · 5 lives',
    sigil: 'star',
  },
  {
    title: isAr ? 'المضائق المدارية' : 'Orbital Straits',
    sub: isAr ? 'أعداد أكبر · ٤ أرواح' : 'Higher magnitude · 4 lives',
    sigil: 'comet',
  },
  {
    title: isAr ? 'التقاطع الشمسي' : 'Solar Cross',
    sub: isAr ? 'دخول الضرب · ٤ أرواح' : 'Multiplication arrives · 4 lives',
    sigil: 'solar-flare',
  },
  {
    title: isAr ? 'بوابات النباض' : 'Pulsar Gates',
    sub: isAr ? 'جداءات مركبة · ٣ أرواح' : 'Complex products · 3 lives',
    sigil: 'meteor-cluster',
  },
  {
    title: isAr ? 'القسم الكوني' : 'Cosmic Divide',
    sub: isAr ? 'دخول القسمة · ٣ أرواح' : 'Division arrives · 3 lives',
    sigil: 'supernova',
  },
];

export function mathGatesSublabel(level, isAr) {
  const cfg = levelCfg(level);
  const opsStr = cfg.ops.join(' ');
  if (isAr) {
    return `${opsStr} · هدف ${cfg.target} · ${cfg.lives} أرواح`;
  }
  return `${opsStr} · ${cfg.target} gates · ${cfg.lives} lives`;
}

export const MATH_GATES_HELP = (isAr) => ({
  open: isAr ? 'دليل مسار البوابات' : 'Gates Flight Guide',
  title: isAr ? 'مسار بوابات الحساب' : 'Math Gates Path',
  close: isAr ? 'فهمت' : 'Got it',
  rows: isAr
    ? [
        { k: 'الرحلة', v: '٥٠ مستوى مقسمة على ٥ قطاعات كونية تتصاعد صعوبة عملياتها الحسابية.' },
        { k: 'المعادلة', v: 'تظهر المعادلة في الأعلى، وتتحرك ثلاث بوابات نحو الأسفل.' },
        { k: 'التوجيه', v: 'المس الحارة المناسبة للتوجيه نحو البوابة التي تحمل الناتج الصحيح.' },
        { k: 'العمليات', v: 'تبدأ بالجمع والطرح، وينضم الضرب عند المستوى ٢١ والقسمة عند ٤١.' },
      ]
    : [
        { k: 'The Journey', v: '50 levels across 5 cosmic sectors testing mental math and rapid lane shifting.' },
        { k: 'Equation', v: 'Solve the equation displayed at the top before the gates arrive.' },
        { k: 'Steering', v: 'Tap the left, center, or right lane to steer into the gate with the correct answer.' },
        { k: 'Operations', v: 'Starts with + and −, unlocking multiplication at L21 and division at L41.' },
      ],
});

export function genGate(cfg, f, rng) {
  const ops = cfg?.ops?.length ? cfg.ops : ['+', '-'];
  const mag = cfg?.mag ?? 0;
  const op = ops[Math.floor(rng() * ops.length)];
  const ri = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
  let a, b, ans;
  if (op === '+') {
    const hi = mag === 0 ? 9 + Math.round(f * 12) : mag === 1 ? 20 + Math.round(f * 25) : 40 + Math.round(f * 55);
    a = ri(1, hi); b = ri(1, hi); ans = a + b;
  } else if (op === '-') {
    const hi = mag === 0 ? 9 + Math.round(f * 12) : mag === 1 ? 25 + Math.round(f * 30) : 50 + Math.round(f * 60);
    a = ri(2, hi); b = ri(1, a); ans = a - b;
  } else if (op === '×') {
    const hi = 9 + Math.round(f * (mag === 1 ? 2 : 4));
    a = ri(2, hi); b = ri(2, hi); ans = a * b;
  } else { // ÷
    const dh = 9 + Math.round(f * 3), qh = 9 + Math.round(f * 3);
    b = ri(2, dh); const q = ri(2, qh); a = b * q; ans = q;
  }

  const nearDelta = clamp(Math.round(lerp(8, 2, f) / 2) * 2, 2, 10);
  const deltas = new Set();
  if (op === '×' && a % 2 === 0 && a <= 8 && ans - a > 0) {
    deltas.add(rng() < 0.5 ? a : -a);
  }
  let guard = 0;
  while (deltas.size < 2 && guard++ < 80) {
    const step = nearDelta + 2 * Math.floor(rng() * 3);
    const d = step * (rng() < 0.5 ? -1 : 1);
    if (d !== 0 && ans + d >= 0) deltas.add(d);
  }
  const opts = new Set([ans]);
  for (const d of deltas) { if (opts.size < 3) opts.add(ans + d); }
  let g2 = 0;
  while (opts.size < 3 && g2++ < 40) {
    const d = (2 + 2 * Math.floor(rng() * 5)) * (rng() < 0.5 ? -1 : 1);
    if (ans + d >= 0) opts.add(ans + d);
  }
  while (opts.size < 3) opts.add(ans + opts.size * 2 + 2);
  const arr = [...opts];
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return { text: `${a} ${op} ${b}`, answer: ans, options: arr, correctLane: arr.indexOf(ans), op, a, b, split: nearDelta };
}

