/*
 * Story Time · Stage strings. No i18n framework here (see CLAUDE.md) — every
 * label carries both languages and `pickStrings` hands back one flat set.
 */
const EN = {
  watchTag: 'Watch & remember',
  beatOf: (i, n) => `Beat ${i} of ${n}`,
  next: 'Next ›',
  toOrder: 'Done — rebuild it',

  // Playback: the story runs as a short film rather than a slideshow.
  play: 'Play',
  pause: 'Pause',
  replay: 'Watch again',
  skip: 'Skip to the questions',
  watchingOf: (i, n) => `${i} / ${n}`,

  orderTitle: 'Put it back in order',
  orderSub: 'Tap the moments in the order they happened.',
  slotEmpty: '—',
  orderConfirm: 'Confirm the order',

  probeOf: (i, n) => `Question ${i} of ${n}`,

  revealTitle: 'The story was',
  orderScore: (n, m) => `Order · ${n}/${m} in the right place`,
  pairScore: (n, m) => `Sequence held · ${n}/${m} pairs`,
  probeScore: (n, m) => `Details · ${n}/${m}`,
  perfect: 'Perfect recall',
  moralTag: 'What it carries',
  nextStory: 'Next story ›',

  runOver: 'Run over',
  runOverSub: (n) => `${n} ${n === 1 ? 'story' : 'stories'} remembered.`,
  playAgain: 'Play again',
  quitMenu: 'Menu',
  loading: 'Setting the stage…',
  lives: 'Lives',
};

const AR = {
  watchTag: 'شاهد وتذكّر',
  beatOf: (i, n) => `المشهد ${i} من ${n}`,
  next: 'التالي ›',
  toOrder: 'انتهيت — أعد بناءها',

  play: 'تشغيل',
  pause: 'إيقاف مؤقّت',
  replay: 'شاهدها مجدّدًا',
  skip: 'انتقل إلى الأسئلة',
  watchingOf: (i, n) => `${i} / ${n}`,

  orderTitle: 'أعد ترتيبها',
  orderSub: 'اضغط اللحظات بالترتيب الذي حدثت فيه.',
  slotEmpty: '—',
  orderConfirm: 'أكّد الترتيب',

  probeOf: (i, n) => `السؤال ${i} من ${n}`,

  revealTitle: 'كانت القصة',
  orderScore: (n, m) => `الترتيب · ${n}/${m} في مكانها الصحيح`,
  pairScore: (n, m) => `تسلسل محفوظ · ${n}/${m} من الأزواج`,
  probeScore: (n, m) => `التفاصيل · ${n}/${m}`,
  perfect: 'تذكّر تامّ',
  moralTag: 'ما تحمله',
  nextStory: 'القصة التالية ›',

  runOver: 'انتهت الجولة',
  runOverSub: (n) => `تذكّرتَ ${n} ${n === 1 ? 'قصة' : 'قصص'}.`,
  playAgain: 'العب مجدّدًا',
  quitMenu: 'القائمة',
  loading: 'نُعِدّ المسرح…',
  lives: 'المحاولات',
};

export const pickStrings = (isAr) => (isAr ? AR : EN);
