import { TRIALS_EXTRA } from './data-extra.js';

/*
 * IQ Similarities — bilingual trial bank (Fusha + English).
 * Three challenge types (mixed on med/hard):
 *   similarity — two items, pick the shared rule (WAIS style)
 *   analogy  — A : B :: C : ? (classic matrix verbal)
 *   pair     — four tiles, tap the TWO that belong together (only one valid pair)
 */

import {
  BAND_SIZE, ladderFraction, mechanicsAt, pickWeighted, tierMass,
} from '../../../../shared/difficulty.js';

/*
 * ── THE LADDER ──
 *
 * ONE climb of 50 levels, in five bands of ten. Replaced easy/med/hard on
 * 2026-08-28 — see LADDER-PLAN.md and shared/difficulty.js.
 *
 * TWO levers, and the second is the interesting one. `tiers` is the weighted
 * content pool (see the note in shared/difficulty.js — it accumulates rather
 * than sliding, so a late band still meets an occasional easy item but hard
 * ones dominate). `kinds` is the QUESTION FORMAT, and the old tiers hid three
 * of the four behind the medium/hard menu words: `allowedKinds` returned
 * ['similarity', 'odd'] on easy and everything otherwise. Analogies and pair
 * matching — the two formats that make this a reasoning task rather than a
 * vocabulary quiz — were unreachable for anyone who picked Easy. They now
 * arrive at bands 2 and 3, by playing.
 *
 * Bank sizes are small (9 easy / 16 med / 12 hard authored, plus procedural
 * generation), which is the other reason the pool accumulates.
 */
export const TIER_ORDER = ['easy', 'med', 'hard'];

const K1 = ['similarity', 'odd'];
const K2 = [...K1, 'analogy'];
const K3 = [...K2, 'pair'];

export const LADDER = [
  /* L1–10  */ { tiers: { easy: 1 }, kinds: K1, adds: ['link'] },
  /* L11–20 */ { tiers: { easy: 0.55, med: 0.45 }, kinds: K2, adds: ['analogy'] },
  /* L21–30 */ { tiers: { easy: 0.25, med: 0.75 }, kinds: K3, adds: ['pair'] },
  /* L31–40 */ { tiers: { easy: 0.15, med: 0.45, hard: 0.40 }, kinds: K3, adds: ['abstract'] },
  /* L41–50 */ { tiers: { easy: 0.10, med: 0.30, hard: 0.60 }, kinds: K3, adds: [] },
];

export const LADDER_LEVELS = LADDER.length * BAND_SIZE; // 50

export const MECHANIC_LABELS = {
  link: { en: 'What links them?', ar: 'ما الرابط بينهما؟' },
  analogy: { en: 'Analogies', ar: 'القياس' },
  pair: { en: 'Find the matching pair', ar: 'جد الزوج المتطابق' },
  abstract: { en: 'Abstract links', ar: 'روابط مجرّدة' },
};

/** ⚠ Level config for the ladder. One argument, no tier. */
export function levelCfg(level) {
  const lv = Math.min(LADDER_LEVELS, Math.max(1, Math.round(Number(level) || 1)));
  const b = LADDER[Math.min(LADDER.length - 1, Math.floor((lv - 1) / BAND_SIZE))];
  return {
    tiers: b.tiers,
    kinds: b.kinds,
    kindCount: b.kinds.length,
    tierMass: tierMass(b.tiers, TIER_ORDER),
    poolTiers: Object.keys(b.tiers).length,
    mechanics: mechanicsAt(LADDER, lv),
    lv,
    f: ladderFraction(lv, LADDER_LEVELS),
  };
}

/** The content tier this trial should draw from, by the band's weights. */
export function pickTrialTier(cfg, rng) {
  return pickWeighted(cfg.tiers, rng) || 'easy';
}

export const RELATION = {
  category: { en: 'Category', ar: 'فئة' },
  function: { en: 'Function', ar: 'وظيفة' },
  part: { en: 'Part–whole', ar: 'جزء–كل' },
  abstract: { en: 'Abstract', ar: 'تجريد' },
  analogy: { en: 'Analogy', ar: 'قياس' },
  pair: { en: 'Pair match', ar: 'زوج متطابق' },
};

export const TRIALS = [
  {
    kind: 'similarity', tier: 'easy', rel: 'category',
    a: { en: 'dog', ar: 'كلب' }, b: { en: 'horse', ar: 'حصان' },
    correct: { en: 'Both are mammals', ar: 'كلاهما ثديي' },
    wrong: [
      { en: 'Both have wings', ar: 'كلاهما له جناحان' },
      { en: 'Both are metals', ar: 'كلاهما معدن' },
      { en: 'Both are verbs', ar: 'كلاهما فعل' },
    ],
  },
  {
    kind: 'similarity', tier: 'easy', rel: 'category',
    a: { en: 'apple', ar: 'تفاحة' }, b: { en: 'grape', ar: 'عنب' },
    correct: { en: 'Both grow on plants', ar: 'كلاهما ينمو على نبات' },
    wrong: [
      { en: 'Both are liquids', ar: 'كلاهما سائل' },
      { en: 'Both are tools', ar: 'كلاهما أداة' },
      { en: 'Apple is red only', ar: 'التفاحة حمراء فقط' },
    ],
  },
  {
    kind: 'similarity', tier: 'med', rel: 'function',
    a: { en: 'key', ar: 'مفتاح' }, b: { en: 'lock', ar: 'قفل' },
    correct: { en: 'One opens what the other secures', ar: 'أحدهما يفتح ما يؤمّنه الآخر' },
    wrong: [
      { en: 'Both are foods', ar: 'كلاهما طعام' },
      { en: 'Both measure time', ar: 'كلاهما يقيس الوقت' },
      { en: 'Both are musical notes', ar: 'كلاهما نغمة موسيقية' },
    ],
  },
  {
    kind: 'similarity', tier: 'med', rel: 'part',
    a: { en: 'page', ar: 'صفحة' }, b: { en: 'book', ar: 'كتاب' },
    correct: { en: 'One is part of the other', ar: 'أحدهما جزء من الآخر' },
    wrong: [
      { en: 'Both are vehicles', ar: 'كلاهما مركبة' },
      { en: 'Both are opposites', ar: 'كلاهما ضدّ' },
      { en: 'Both are seasons', ar: 'كلاهما فصل' },
    ],
  },
  {
    kind: 'similarity', tier: 'med', rel: 'abstract',
    a: { en: 'democracy', ar: 'ديمقراطية' }, b: { en: 'vote', ar: 'صوت انتخابي' },
    correct: { en: 'Both involve choosing leaders', ar: 'كلاهما يتعلّق باختيار القادة' },
    wrong: [
      { en: 'Both are weather', ar: 'كلاهما طقس' },
      { en: 'Both are body parts', ar: 'كلاهما جزء من الجسم' },
      { en: 'Vote means a sound only', ar: 'الصوت يعني صوتاً فقط' },
    ],
  },
  {
    kind: 'similarity', tier: 'hard', rel: 'abstract',
    a: { en: 'hypothesis', ar: 'فرضية' }, b: { en: 'experiment', ar: 'تجربة' },
    correct: { en: 'Both test an idea in science', ar: 'كلاهما يختبر فكرة في العلم' },
    wrong: [
      { en: 'Both are legal punishments', ar: 'كلاهما عقوبة قانونية' },
      { en: 'Both are kitchen tools', ar: 'كلاهما أداة مطبخ' },
      { en: 'Experiment means guessing only', ar: 'التجربة تعني التخمين فقط' },
    ],
  },
  {
    kind: 'similarity', tier: 'hard', rel: 'abstract',
    a: { en: 'metaphor', ar: 'استعارة' }, b: { en: 'simile', ar: 'تشبيه' },
    correct: { en: 'Both compare unlike things in language', ar: 'كلاهما يقارن أشياء مختلفة في اللغة' },
    wrong: [
      { en: 'Both are math operations', ar: 'كلاهما عملية حسابية' },
      { en: 'Both mean the same word', ar: 'كلاهما يعنيان نفس الكلمة' },
      { en: 'Both are units of length', ar: 'كلاهما وحدة طول' },
    ],
  },
  {
    kind: 'analogy', tier: 'med', rel: 'analogy',
    stem: [
      { en: 'hand', ar: 'يد' }, { en: 'finger', ar: 'إصبع' }, { en: 'foot', ar: 'قدم' },
    ],
    correct: { en: 'toe', ar: 'إصبع قدم' },
    wrong: [
      { en: 'shoe', ar: 'حذاء' },
      { en: 'knee', ar: 'ركبة' },
      { en: 'walk', ar: 'مشي' },
    ],
  },
  {
    kind: 'analogy', tier: 'med', rel: 'analogy',
    stem: [
      { en: 'bird', ar: 'طائر' }, { en: 'nest', ar: 'عش' }, { en: 'bee', ar: 'نحلة' },
    ],
    correct: { en: 'hive', ar: 'خلية' },
    wrong: [
      { en: 'honey', ar: 'عسل' },
      { en: 'flower', ar: 'زهرة' },
      { en: 'wing', ar: 'جناح' },
    ],
  },
  {
    kind: 'analogy', tier: 'med', rel: 'analogy',
    stem: [
      { en: 'puppy', ar: 'جرو' }, { en: 'dog', ar: 'كلب' }, { en: 'kitten', ar: 'هرّ' },
    ],
    correct: { en: 'cat', ar: 'قطة' },
    wrong: [
      { en: 'mouse', ar: 'فأر' },
      { en: 'pet', ar: 'حيوان أليف' },
      { en: 'fur', ar: 'فراء' },
    ],
  },
  {
    kind: 'analogy', tier: 'hard', rel: 'analogy',
    stem: [
      { en: 'surgeon', ar: 'جرّاح' }, { en: 'scalpel', ar: 'مشرط' }, { en: 'painter', ar: 'رسّام' },
    ],
    correct: { en: 'brush', ar: 'فرشاة' },
    wrong: [
      { en: 'canvas', ar: 'لوحة' },
      { en: 'hospital', ar: 'مستشفى' },
      { en: 'colour', ar: 'لون' },
    ],
  },
  {
    kind: 'analogy', tier: 'hard', rel: 'analogy',
    stem: [
      { en: 'chapter', ar: 'فصل' }, { en: 'book', ar: 'كتاب' }, { en: 'scene', ar: 'مشهد' },
    ],
    correct: { en: 'play', ar: 'مسرحية' },
    wrong: [
      { en: 'actor', ar: 'ممثّل' },
      { en: 'page', ar: 'صفحة' },
      { en: 'library', ar: 'مكتبة' },
    ],
  },
  {
    kind: 'analogy', tier: 'hard', rel: 'analogy',
    stem: [
      { en: 'Celsius', ar: 'مئوي' }, { en: 'temperature', ar: 'حرارة' }, { en: 'meter', ar: 'متر' },
    ],
    correct: { en: 'length', ar: 'طول' },
    wrong: [
      { en: 'weight', ar: 'وزن' },
      { en: 'speed', ar: 'سرعة' },
      { en: 'time', ar: 'زمن' },
    ],
  },
  {
    kind: 'pair', tier: 'hard', rel: 'pair',
    words: [
      { en: 'violin', ar: 'كمان' },
      { en: 'cello', ar: 'تشيللو' },
      { en: 'trumpet', ar: 'بوق' },
      { en: 'flute', ar: 'فلوت' },
    ],
    pair: [0, 1],
    rule: { en: 'Both are string instruments', ar: 'كلاهما آلة وترية' },
  },
  {
    kind: 'pair', tier: 'hard', rel: 'pair',
    words: [
      { en: 'triangle', ar: 'مثلث' },
      { en: 'square', ar: 'مربّع' },
      { en: 'red', ar: 'أحمر' },
      { en: 'circle', ar: 'دائرة' },
    ],
    pair: [0, 1],
    rule: { en: 'Both are polygons with straight sides', ar: 'كلاهما مضلّع بأضلاع مستقيمة' },
  },
  {
    kind: 'pair', tier: 'med', rel: 'pair',
    words: [
      { en: 'January', ar: 'يناير' },
      { en: 'March', ar: 'مارس' },
      { en: 'Monday', ar: 'الاثنين' },
      { en: 'Friday', ar: 'الجمعة' },
    ],
    pair: [0, 1],
    rule: { en: 'Both are months', ar: 'كلاهما شهر' },
  },
  {
    kind: 'pair', tier: 'med', rel: 'pair',
    words: [
      { en: 'gold', ar: 'ذهب' },
      { en: 'silver', ar: 'فضّة' },
      { en: 'wood', ar: 'خشب' },
      { en: 'water', ar: 'ماء' },
    ],
    pair: [0, 1],
    rule: { en: 'Both are metals', ar: 'كلاهما معدن' },
  },
  ...TRIALS_EXTRA,
];
