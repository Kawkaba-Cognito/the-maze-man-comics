/**
 * Coached tutorial steps for Speed Match (DSST). The "answer" steps gate on the
 * player tapping the number that matches the currently-shown scripted symbol.
 */
export function buildSpeedCoachSteps(isAr, refs, digits) {
  const [d0, d1] = digits;
  const en = [
    {
      id: 'key',
      text: 'This is the KEY — every symbol matches a number. Glance up here whenever you need it.',
      anchorRef: refs.legendRef,
      gate: 'next',
    },
    {
      id: 'card',
      text: 'A symbol appears here. Find its matching number in the key above.',
      anchorRef: refs.cardRef,
      gate: 'next',
    },
    {
      id: 'tap-0',
      text: `This symbol matches ${d0}. Tap ${d0} on the pad below.`,
      anchorRef: refs.padRef,
      gate: 'event',
      event: 'answer',
      validate: (p) => p.digit === d0,
      hint: `Tap ${d0}`,
    },
    {
      id: 'tap-1',
      text: `Nice! This one matches ${d1}. Tap ${d1}.`,
      anchorRef: refs.padRef,
      gate: 'event',
      event: 'answer',
      validate: (p) => p.digit === d1,
      hint: `Tap ${d1}`,
    },
    {
      id: 'done',
      text: 'That’s it — match each symbol to its number as fast as you can. Speed builds your combo!',
      gate: 'next',
      last: true,
    },
  ];
  const ar = [
    {
      id: 'key',
      text: 'هذا هو المفتاح — كل رمز يطابق رقماً. انظر إليه كلما احتجت.',
      anchorRef: refs.legendRef,
      gate: 'next',
    },
    {
      id: 'card',
      text: 'يظهر الرمز هنا. ابحث عن رقمه المطابق في المفتاح بالأعلى.',
      anchorRef: refs.cardRef,
      gate: 'next',
    },
    {
      id: 'tap-0',
      text: `هذا الرمز يطابق ${d0}. اضغط ${d0} في لوحة الأرقام.`,
      anchorRef: refs.padRef,
      gate: 'event',
      event: 'answer',
      validate: (p) => p.digit === d0,
      hint: `اضغط ${d0}`,
    },
    {
      id: 'tap-1',
      text: `أحسنت! هذا يطابق ${d1}. اضغط ${d1}.`,
      anchorRef: refs.padRef,
      gate: 'event',
      event: 'answer',
      validate: (p) => p.digit === d1,
      hint: `اضغط ${d1}`,
    },
    {
      id: 'done',
      text: 'هذا كل شيء — طابق كل رمز مع رقمه بأسرع ما يمكن. السرعة تبني سلسلتك!',
      gate: 'next',
      last: true,
    },
  ];
  return isAr ? ar : en;
}
