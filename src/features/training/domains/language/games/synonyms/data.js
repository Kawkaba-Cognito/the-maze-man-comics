import { TRIALS_EXTRA } from './data-extra.js';

/*
 * IQ Similarities — bilingual trial bank (Fusha + English).
 * Three challenge types (mixed on med/hard):
 *   similarity — two items, pick the shared rule (WAIS style)
 *   analogy  — A : B :: C : ? (classic matrix verbal)
 *   pair     — four tiles, tap the TWO that belong together (only one valid pair)
 */

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
