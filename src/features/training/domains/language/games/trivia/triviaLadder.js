/*
 * Trivia — THE LADDER, in its own module.
 *
 * ⚠ WHY THIS IS NOT IN triviaData.js. That file imports the whole authored bank
 * from `./data/*` with EXTENSIONLESS paths, which Vite resolves and plain Node
 * does not — so a gate importing it dies before it reads a single number. This
 * module imports nothing but shared/difficulty.js, so `audit:curves` can load
 * it. Putting the ladder in index.jsx would have been worse still: that is the
 * "curve trapped in a React file" problem the whole of Phase 3 existed to close.
 *
 * ── THE LADDER ──
 * ONE climb of 50 levels, in five bands of ten. Replaced easy/med/hard on
 * 2026-08-28 — see LADDER-PLAN.md.
 *
 * Trivia's "tier" is a question's STAR RATING (1 = common knowledge, 4 =
 * expert). The old tiers filtered to a fixed set: easy saw [1,2] and never
 * anything harder, hard opened straight onto [4]. The band's pool ACCUMULATES
 * instead — it widens as you climb and the expert questions take over — so a
 * long session stays varied and the top still bites.
 *
 * ⚠ `sets` are tried IN ORDER, and the first with enough questions wins. The
 * fallback entries are load-bearing: a narrow band meeting a thin category
 * would otherwise find no questions at all and deal a dead round.
 */
import { BAND_SIZE, mechanicsAt, pickWeighted, tierMass } from '../../../../shared/difficulty.js';

/** Star ratings, easiest first — the axis `tierMass` measures along. */
export const TRIVIA_TIER_ORDER = ['1', '2', '3', '4'];

export const LADDER = [
  /* L1–10  */ { stars: { 1: 0.70, 2: 0.30 }, sets: [[1, 2]], steps: 5, adds: ['recall'] },
  /* L11–20 */ { stars: { 1: 0.40, 2: 0.60 }, sets: [[2], [1, 2]], steps: 6, adds: ['lessCommon'] },
  /* L21–30 */ { stars: { 1: 0.20, 2: 0.45, 3: 0.35 }, sets: [[2, 3], [2]], steps: 6, adds: ['specialist'] },
  /* L31–40 */ { stars: { 1: 0.10, 2: 0.30, 3: 0.40, 4: 0.20 }, sets: [[3, 4], [2, 3]], steps: 7, adds: ['expert'] },
  /* L41–50 */ { stars: { 1: 0.05, 2: 0.15, 3: 0.35, 4: 0.45 }, sets: [[4], [3, 4]], steps: 8, adds: [] },
];

export const LADDER_LEVELS = LADDER.length * BAND_SIZE; // 50

export const MECHANIC_LABELS = {
  recall: { en: 'What do you know?', ar: 'ماذا تعرف؟' },
  lessCommon: { en: 'Less common ground', ar: 'أرض أقل شيوعاً' },
  specialist: { en: '★★★ specialist', ar: '★★★ متخصّص' },
  expert: { en: '★★★★ expert', ar: '★★★★ خبير' },
};

export function levelCfg(level) {
  const lv = Math.min(LADDER_LEVELS, Math.max(1, Math.round(Number(level) || 1)));
  const b = LADDER[Math.min(LADDER.length - 1, Math.floor((lv - 1) / BAND_SIZE))];
  return {
    stars: b.stars,
    sets: b.sets,
    steps: b.steps,
    tierMass: tierMass(b.stars, TRIVIA_TIER_ORDER),
    starCount: Object.keys(b.stars).length,
    mechanics: mechanicsAt(LADDER, lv),
    lv,
  };
}

/** A star rating drawn by the band's weights. */
export function pickStar(cfg, rng) {
  return Number(pickWeighted(cfg.stars, rng) || 1);
}

export const TRIVIA_SECTIONS = [
  'ember', 'dust', 'frost', 'tempest', 'void',
];

export const TRIVIA_BANDS = (isAr) => [
  {
    title: isAr ? 'فلك المعرفة العامة' : 'The Realm of Recall',
    sub: isAr ? '٥ درجات · حقائق تأسيسية' : '5 steps · Foundational facts',
    sigil: 'star',
  },
  {
    title: isAr ? 'طبقات الاستقصاء' : 'Deeper Strata',
    sub: isAr ? '٦ درجات · علوم وتاريخ وسيط' : '6 steps · Intermediate science & history',
    sigil: 'comet',
  },
  {
    title: isAr ? 'خزائن التخصص' : 'Specialist Archives',
    sub: isAr ? '★★★ أسئلة متخصصة · معلومات دقيقة' : '★★★ Specialist tier · Nuanced trivia',
    sigil: 'meteor-cluster',
  },
  {
    title: isAr ? 'مرقى الخبراء' : 'The Expert Ascent',
    sub: isAr ? '٧ درجات · بداية أسئلة الخبراء ★★★★' : '7 steps · ★★★★ Expert pool begins',
    sigil: 'nebula-bolt',
  },
  {
    title: isAr ? 'قمة الموسوعية' : 'Summit of Erudition',
    sub: isAr ? '٨ درجات · ٤٥٪ من أسئلة النخبة' : '8 steps · 45% Expert questions',
    sigil: 'supernova',
  },
];

export function triviaSublabel(level, isAr) {
  const cfg = levelCfg(level);
  if (isAr) {
    return `${cfg.steps} درجات للصعود`;
  }
  return `${cfg.steps} steps to summit`;
}

export const TRIVIA_HELP = (isAr) => ({
  open: isAr ? 'دليل الخريطة الفلكية' : 'Cosmic Map Guide',
  title: isAr ? 'مسار سلم المعلومات' : 'Trivia Staircase Path',
  close: isAr ? 'فهمت' : 'Got it',
  rows: isAr
    ? [
        { k: 'الرحلة', v: '٥٠ مستوى مقسمة على ٥ قطاعات كونية تتدرج في عمق المعلومات عبر ٢٤ موضوعاً.' },
        { k: 'السلّم', v: 'يصعد كوكب درجة واحدة مع كل إجابة صحيحة. بلّغه القمة لاجتياز المستوى.' },
        { k: 'المحاولات', v: 'لديك ٣ محاولات (قلوب). الخطأ الثالث يُسقطك من السلّم.' },
        { k: 'المستويات', v: 'تزداد درجات السلّم من ٥ إلى ٨ درجات، وتتصاعد الأسئلة نحو درجة الخبير ★★★★.' },
      ]
    : [
        { k: 'The Journey', v: '50 levels across 5 cosmic sectors spanning 24 diverse encyclopedic domains.' },
        { k: 'The Staircase', v: 'Kawkab climbs one step per correct answer. Reach the summit to pass the level.' },
        { k: 'Mistake Cap', v: 'You have 3 hearts. Three wrong answers end the ascent.' },
        { k: 'Progression', v: 'Steps increase from 5 to 8, while difficulty ramps into the ★★★★ expert tier.' },
      ],
});
