/*
 * Target Tracking (MOT) — level curve, as a .js data module.
 *
 * Extracted from index.jsx on 2026-08-28 with the ladder migration. Before
 * this, `audit:mot` REGEX-PARSED the `const BASE = {…}` table straight out of
 * the JSX, because the gates run in plain Node and cannot load a React file.
 * That parser worked, but a curve you have to scrape is a curve one refactor
 * away from being silently ungated — the audit would have thrown "BASE table
 * not found" only if the shape changed, and matched the WRONG numbers if it
 * changed subtly. Now the gate imports the same module the game does.
 *
 * ⚠ IMPORT WITH AN EXPLICIT .js EXTENSION (Node vs Vite resolution — see the
 * note at the top of shared/difficulty.js).
 *
 * ── THE LADDER ──
 * ONE climb of 40 levels, in four bands of ten. `targets` — how many dots you
 * must hold at once — is the structural lever and it has exactly four useful
 * values (2, 3, 4, 5), capped by MOT_CAP because that is the measured ceiling
 * of human multiple-object tracking. Four values, four bands. Objects, speed
 * and tracking duration ramp continuously underneath.
 *
 * Span unchanged at both ends: L1 is the old easy L1 (2 targets among 5, slow,
 * 3s) and L40 the old hard L100 (5 targets among 12, fast, 9s).
 *
 * ⚠ THE AUTHORED NUMBERS ARE NOT WHAT THE PLAYER MEETS. `startRound()` rescales
 * the object count to preserve density across screen sizes, and on a wide
 * screen that multiplied it by 3.1× straight into the clamp — so nearly every
 * level rendered an identical swarm and density stopped grading at all. The
 * first version of audit:mot passed while the game was broken, because it
 * validated this table. It now simulates the rescale on four device shapes.
 * If you change anything here, check what reaches the screen.
 */
import { BAND_SIZE, ladderFraction, mechanicsAt } from '../../../../shared/difficulty.js';

/** Max simultaneously trackable targets (capacity ceiling). */
export const MOT_CAP = 5;

export const LADDER = [
  /* L1–10  */ { targets: 2, adds: ['track'] },
  /* L11–20 */ { targets: 3, adds: ['three'] },
  /* L21–30 */ { targets: 4, adds: ['four'] },
  /* L31–40 */ { targets: 5, adds: ['five'] },
];

export const LADDER_LEVELS = LADDER.length * BAND_SIZE; // 40

export const MECHANIC_LABELS = {
  track: { en: 'Keep your eyes on them', ar: 'راقبها' },
  three: { en: 'Three to hold', ar: 'ثلاثة معاً' },
  four: { en: 'Four to hold', ar: 'أربعة معاً' },
  five: { en: 'Five to hold', ar: 'خمسة معاً' },
};

/** Continuous levers, at the two ends of the ladder. */
const TOTAL_START = 5;
const TOTAL_END = 12;
const SPEED_START = 0.09;
const SPEED_END = 0.33;
const TRACK_START = 3000;
const TRACK_END = 9000;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, f) => a + (b - a) * f;

/** ⚠ SIGNATURE CHANGED with the ladder: one argument, no tier. */
export function levelConfig(level) {
  const lv = clamp(Math.round(Number(level) || 1), 1, LADDER_LEVELS);
  const band = LADDER[Math.min(LADDER.length - 1, Math.floor((lv - 1) / BAND_SIZE))];
  const f = ladderFraction(lv, LADDER_LEVELS);
  return {
    targets: clamp(band.targets, 1, MOT_CAP),
    total: Math.round(lerp(TOTAL_START, TOTAL_END, f)),
    speedFrac: lerp(SPEED_START, SPEED_END, f),
    trackMs: Math.round(lerp(TRACK_START, TRACK_END, f)),
    mechanics: mechanicsAt(LADDER, lv),
    lv,
    f,
  };
}

export const MOT_SECTIONS = [
  { id: 'frost', nameEn: 'Frost Hollow', nameAr: 'فجوة الجليد' },
  { id: 'ember', nameEn: 'Ember Reach', nameAr: 'أفق الجمر' },
  { id: 'dust', nameEn: 'The Dust Sea', nameAr: 'بحر الغبار' },
  { id: 'tempest', nameEn: 'The Tempest', nameAr: 'العاصفة' },
];

export const MOT_BANDS = (isAr) => [
  {
    title: isAr ? 'سُدُم التائهين' : 'Nebula Drifters',
    sub: isAr ? 'تتبّع هدفين معاً' : 'Track 2 targets simultaneously',
    sigil: 'star',
  },
  {
    title: isAr ? 'سرب الكويكبات' : 'Asteroid Swarm',
    sub: isAr ? 'تتبّع ٣ أهداف معاً' : 'Track 3 targets simultaneously',
    sigil: 'meteor-cluster',
  },
  {
    title: isAr ? 'التوهج الشمسي' : 'Solar Flare',
    sub: isAr ? 'تتبّع ٤ أهداف معاً' : 'Track 4 targets simultaneously',
    sigil: 'solar-flare',
  },
  {
    title: isAr ? 'أفق الجاذبية' : 'Event Horizon',
    sub: isAr ? 'تتبّع ٥ أهداف — حدّ السعة' : 'Track 5 targets — capacity limit',
    sigil: 'supernova',
  },
];

export function motSublabel(level, isAr) {
  const cfg = levelConfig(level);
  if (isAr) {
    const tLabel = cfg.targets === 2 ? 'هدفان' : `${cfg.targets} أهداف`;
    return `${tLabel} · ${cfg.total} نقاط`;
  }
  return `${cfg.targets} targets · ${cfg.total} dots`;
}

export const MOT_HELP = (isAr) => ({
  open: isAr ? 'دليل الخريطة الفضائية' : 'Cosmic Map Guide',
  title: isAr ? 'مسار تتبّع الأهداف' : 'Target Tracking Path',
  close: isAr ? 'فهمت' : 'Got it',
  rows: isAr
    ? [
        { k: 'الرحلة', v: '٤٠ مستوى مقسمة على ٤ قطاعات كونية تتصاعد صعوبتها تدريجياً.' },
        { k: 'الأهداف', v: 'تبدأ بمراقبة هدفين وتصل إلى ٥ أهداف مع زيادة كثافة النقاط والسرعة.' },
        { k: 'المهمة', v: 'احفظ النقاط المضيئة بعينيك أثناء تحركها، ثم حددها جميعاً عند التوقف.' },
        { k: 'النجوم', v: 'احصل على النجوم بدقة الاختيار دون أخطاء.' },
      ]
    : [
        { k: 'The Journey', v: '40 levels across 4 cosmic sectors with escalating difficulty.' },
        { k: 'The Targets', v: 'Starts with 2 targets and escalates to 5 with increasing dot swarm density.' },
        { k: 'The Objective', v: 'Track highlighted dots with your eyes as they drift, then select them when frozen.' },
        { k: 'Stars', v: 'Earn up to 3 stars per level by identifying all targets without errors.' },
      ],
});
