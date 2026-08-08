/*
 * Story Time · Stage strings. No i18n framework here (see CLAUDE.md) — every
 * label carries both languages and `pickStrings` hands back one flat set.
 */
const EN = {
  watchTag: 'Watch & remember',
  beatOf: (i, n) => `Beat ${i} of ${n}`,
  next: 'Next ›',
  toOrder: 'Done — rebuild it',

  /*
   * The story is browsed, not played at you.
   *
   * It used to auto-advance on a per-beat timer with transport controls
   * (replay / play-pause / skip). Encoding a sequence you are about to be tested
   * on is self-paced work: a timer either rushes the moment you are still
   * studying or stalls on one you already have. So the learner steps through it,
   * and `proceed` replaces `skip` — reaching the end is now a deliberate act
   * rather than abandoning playback.
   */
  play: 'Play',
  pause: 'Pause',
  replay: 'Watch again',
  prevBeat: 'Previous moment',
  nextBeat: 'Next moment',
  proceed: 'Rebuild the story',
  atLastBeat: 'Last moment — rebuild when ready',
  watchingOf: (i, n) => `${i} / ${n}`,

  orderTitle: 'Put it back in order',
  orderSub: 'Tap the moments in the order they happened.',
  slotEmpty: '—',
  /* The two halves of this task need naming. Unlabelled, the screen was a stack
     of empty numbered rows with the tappable moments below the fold — you could
     not see what to place and where to put it at the same time. */
  orderSlotsLabel: 'The order',
  orderPoolLabel: 'Moments to place',
  orderPoolDone: 'All placed — check it over',
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
  prevBeat: 'اللحظة السابقة',
  nextBeat: 'اللحظة التالية',
  proceed: 'أعد بناء القصة',
  atLastBeat: 'آخر لحظة — أعد البناء عندما تجهز',
  watchingOf: (i, n) => `${i} / ${n}`,

  orderTitle: 'أعد ترتيبها',
  orderSub: 'اضغط اللحظات بالترتيب الذي حدثت فيه.',
  slotEmpty: '—',
  orderSlotsLabel: 'الترتيب',
  orderPoolLabel: 'اللحظات للترتيب',
  orderPoolDone: 'اكتمل الترتيب — راجعه',
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
