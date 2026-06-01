/**
 * Coached tutorial steps for Rush Hour. Runs a fixed starter board; gates on the
 * player sliding the red car out through the exit (the 'solve' event).
 */
export function buildRushCoachSteps(isAr, refs) {
  const en = [
    {
      id: 'intro',
      text: 'This is Maze Man’s red car. Cars slide only along their own row or column — drag them to move.',
      anchorRef: refs.boardRef,
      gate: 'next',
    },
    {
      id: 'solve',
      text: 'Clear the path, then slide the red car out through the EXIT on the right.',
      anchorRef: refs.boardRef,
      gate: 'event',
      event: 'solve',
      hint: 'Reach the exit',
    },
    {
      id: 'done',
      text: 'Solved! Fewer moves = more stars. Plan ahead and think before you slide!',
      gate: 'next',
      last: true,
    },
  ];
  const ar = [
    {
      id: 'intro',
      text: 'هذه سيارة رجل المتاهة الحمراء. تنزلق السيارات فقط على صفها أو عمودها — اسحبها لتحريكها.',
      anchorRef: refs.boardRef,
      gate: 'next',
    },
    {
      id: 'solve',
      text: 'أخلِ الطريق، ثم أخرج السيارة الحمراء عبر المخرج على اليمين.',
      anchorRef: refs.boardRef,
      gate: 'event',
      event: 'solve',
      hint: 'اصل إلى المخرج',
    },
    {
      id: 'done',
      text: 'حُلّت! حركات أقل = نجوم أكثر. خطّط وفكّر قبل أن تسحب!',
      gate: 'next',
      last: true,
    },
  ];
  return isAr ? ar : en;
}
