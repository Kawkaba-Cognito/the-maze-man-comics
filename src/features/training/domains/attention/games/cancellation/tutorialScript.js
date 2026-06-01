/**
 * Coached tutorial steps for Cancellation (visual search). Runs on a real easy
 * round with the timer/scoring suppressed; gates on the player tapping targets.
 */
export function buildCancelCoachSteps(isAr, refs) {
  const en = [
    {
      id: 'target',
      text: 'Up here is the TARGET — the shape you must find. Remember it.',
      anchorRef: refs.targetRef,
      gate: 'next',
    },
    {
      id: 'tap-one',
      text: 'Now scan the grid and tap one matching shape to start.',
      anchorRef: refs.gridRef,
      gate: 'event',
      event: 'tap',
      hint: 'Tap a target',
    },
    {
      id: 'clear',
      text: 'Nice! Tap every remaining target — ignore the other shapes. Wrong taps shake the board.',
      anchorRef: refs.gridRef,
      gate: 'event',
      event: 'allfound',
    },
    {
      id: 'done',
      text: 'Perfect — clear them all before the timer runs out. Speed and accuracy both count!',
      gate: 'next',
      last: true,
    },
  ];
  const ar = [
    {
      id: 'target',
      text: 'في الأعلى الهدف — الشكل الذي عليك إيجاده. احفظه.',
      anchorRef: refs.targetRef,
      gate: 'next',
    },
    {
      id: 'tap-one',
      text: 'الآن امسح الشبكة واضغط شكلاً مطابقاً واحداً للبدء.',
      anchorRef: refs.gridRef,
      gate: 'event',
      event: 'tap',
      hint: 'اضغط هدفاً',
    },
    {
      id: 'clear',
      text: 'أحسنت! اضغط كل الأهداف المتبقية — وتجاهل بقية الأشكال. النقر الخاطئ يهزّ اللوحة.',
      anchorRef: refs.gridRef,
      gate: 'event',
      event: 'allfound',
    },
    {
      id: 'done',
      text: 'ممتاز — امسحها كلها قبل انتهاء الوقت. السرعة والدقة كلاهما مهم!',
      gate: 'next',
      last: true,
    },
  ];
  return isAr ? ar : en;
}
