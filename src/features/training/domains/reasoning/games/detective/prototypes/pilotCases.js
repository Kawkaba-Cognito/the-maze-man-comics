/**
 * Audited pilot cases for Prototype Mode — spoiler-free reports + opening panels.
 * Does not mutate investigations/*.js until production rollout.
 */
import { INV_TIER1 } from '../investigations/tier1';
import { QUICK1 } from '../investigations/quick1';

const weddingSource = INV_TIER1.find((c) => c.id === 'wedding-cake');
const muffinsSource = QUICK1.find((c) => c.id === 'q-muffins');

function cloneCase(c) {
  return JSON.parse(JSON.stringify(c));
}

const weddingCake = cloneCase(weddingSource);
weddingCake.sceneBg = 'kitchen';
weddingCake.openingPanels = [
  {
    bg: 'kitchen', action: 'find', item: '🎂',
    chars: ['kawkab', 'lola'],
    narr: {
      en: 'One hour before the wedding, a scream from the hotel kitchen — the top tier of the five-tier cake, sugar roses and all, was GONE.',
      ar: 'قبل ساعة واحدة من العرس، صرخة من مطبخ الفندق — الطبقة العليا من الكعكة ذات الطوابق الخمس، ورود السكر وكل شيء، اختفت.',
    },
    say: { en: 'The cake table is a crime scene now, Lola.', ar: 'طاولة الكعكة أصبحت مسرح جريمة الآن يا لولا.' },
  },
  {
    bg: 'kitchen', action: 'study', item: '🎫',
    chars: ['kawkab', 'lola'],
    narr: {
      en: 'Three staff badges opened this kitchen this morning. Detective Kawkab straightened his hat. Someone here is lying.',
      ar: 'ثلاث بطاقات موظفين فتحت هذا المطبخ هذا الصباح. عدّل المحقق كوكب قبعته. أحدهم يكذب.',
    },
    say: { en: 'Search every corner. Read every word.', ar: 'فتّش كل زاوية. اقرأ كل كلمة.' },
  },
  {
    bg: 'kitchen', action: 'tell',
    narr: {
      en: 'Chef Basil 👨‍🍳, florist Salma 💐, and waiter Ziad 🤵 — each had access, each had a story. Only one can be true.',
      ar: 'الشيف باسل 👨‍🍳، ومنسّقة الزهور سلمى 💐، والنادل زياد 🤵 — لكل منهم دخول، ولكل منهم رواية. واحدة فقط يمكن أن تكون حقيقة.',
    },
  },
  {
    bg: 'kitchen', action: 'find', item: '🔍',
    chars: ['kawkab', 'lola'],
    narr: {
      en: 'Accuse only when you can PROVE it — not when you merely suspect.',
      ar: 'لا توجّه الاتهام إلا حين تستطيع الإثبات — لا حين تشك فقط.',
    },
    say: { en: 'Notebook open. Let us begin.', ar: 'الدفتر مفتوح. لنبدأ.' },
  },
];

weddingCake.openingHook = weddingCake.openingPanels[0];

const midnightMuffins = cloneCase(muffinsSource);
midnightMuffins.sceneBg = 'kitchen';
// Remove spoiler reports — alibis only, no proving details.
midnightMuffins.suspects = midnightMuffins.suspects.map((s) => {
  if (s.id === 'basil') {
    return {
      ...s,
      report: {
        en: 'I locked up at nine and went straight home. Someone stole a whole tray from my shop — unbelievable! Ziad only ever waits outside for deliveries.',
        ar: 'أقفلتُ في التاسعة وعدتُ إلى البيت مباشرة. سرق أحدهم صينية كاملة من محلي — لا يُصدّق! زياد ينتظر خارجاً للتوصيل فقط.',
      },
    };
  }
  if (s.id === 'ziad') {
    return {
      ...s,
      report: {
        en: 'I arrived at dawn, as always. I waited outside with my bicycle — I never step inside. When Basil opened up, the tray was already gone.',
        ar: 'وصلتُ عند الفجر كعادتي. انتظرتُ في الخارج مع درّاجتي — لا أدخل أبداً. حين فتح باسل، كانت الصينية قد اختفت.',
      },
    };
  }
  return s;
});
midnightMuffins.openingPanels = [
  {
    bg: 'kitchen', action: 'find', item: '🧁',
    chars: ['kawkab'],
    narr: {
      en: 'At dawn, Basil the baker found the door unlocked and a whole tray of muffins gone. Three people were near the shop that night.',
      ar: 'عند الفجر وجد الخبّاز باسل الباب غير موصَد وصينية كاملة من الكعك قد اختفت. ثلاثة كانوا قرب المحل.',
    },
    say: { en: 'I smell cinnamon — and a lie.', ar: 'أشمّ القرفة — وكذبة.' },
  },
  {
    bg: 'kitchen', action: 'study',
    chars: ['kawkab'],
    narr: {
      en: 'The thief knew where Basil hid the tray. Find who knew too much.',
      ar: 'اللصّ عرف أين يخبّئ باسل الصينية. ابحث عمن يعرف أكثر مما ينبغي.',
    },
    say: { en: 'Let the scene talk.', ar: 'فليتكلّم المسرح.' },
  },
];
midnightMuffins.openingHook = midnightMuffins.openingPanels[0];

/** Pilot cases played in order for every prototype. */
export const PILOT_CASES = [weddingCake, midnightMuffins];

export const PILOT_LABELS = {
  en: { wedding: 'Case 1 — Wedding Cake', muffins: 'Case 2 — Midnight Muffins' },
  ar: { wedding: 'القضية ١ — كعكة العرس', muffins: 'القضية ٢ — كعكات منتصف الليل' },
};
