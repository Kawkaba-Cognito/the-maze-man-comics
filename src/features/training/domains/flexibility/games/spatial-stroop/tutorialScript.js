/**
 * Coached tutorial steps for Arrow Rush. Each "answer" step gates on the player
 * tapping the correct side for the matching scripted probe in STROOP_TUTORIAL_SCRIPT.
 */
export function buildStroopCoachSteps(isAr, refs) {
  const en = [
    {
      id: 'banner',
      text: 'Watch the banner at the top — it tells you the active RULE. Right now it says POINTS.',
      anchorRef: refs.bannerRef,
      gate: 'next',
    },
    {
      id: 'point-left',
      text: 'This arrow POINTS left. Tap the LEFT button.',
      anchorRef: refs.leftRef,
      gate: 'event',
      event: 'answer',
      validate: (p) => p.side === 'left',
      hint: 'Tap ◀',
    },
    {
      id: 'point-right',
      text: 'Now it points RIGHT but sits on the left. Follow the rule — POINTS — and tap RIGHT.',
      anchorRef: refs.rightRef,
      gate: 'event',
      event: 'answer',
      validate: (p) => p.side === 'right',
      hint: 'Tap ▶',
    },
    {
      id: 'side-right',
      text: 'The rule just FLIPPED to SITS. This arrow sits on the RIGHT — tap RIGHT (ignore where it points).',
      anchorRef: refs.rightRef,
      gate: 'event',
      event: 'answer',
      validate: (p) => p.side === 'right',
      hint: 'Tap ▶',
    },
    {
      id: 'done',
      text: "That's it! Always follow the banner, and switch the instant the rule switches. You're ready!",
      gate: 'next',
      last: true,
    },
  ];
  const ar = [
    {
      id: 'banner',
      text: 'راقب الشارة في الأعلى — تخبرك بالقاعدة الحالية. الآن تقول: الإشارة.',
      anchorRef: refs.bannerRef,
      gate: 'next',
    },
    {
      id: 'point-left',
      text: 'هذا السهم يشير لليسار. اضغط زر اليسار.',
      anchorRef: refs.leftRef,
      gate: 'event',
      event: 'answer',
      validate: (p) => p.side === 'left',
      hint: 'اضغط ◀',
    },
    {
      id: 'point-right',
      text: 'الآن يشير لليمين لكنه يجلس يساراً. اتبع القاعدة — الإشارة — واضغط يمين.',
      anchorRef: refs.rightRef,
      gate: 'event',
      event: 'answer',
      validate: (p) => p.side === 'right',
      hint: 'اضغط ▶',
    },
    {
      id: 'side-right',
      text: 'تبدّلت القاعدة الآن إلى: المكان. هذا السهم يجلس يميناً — اضغط يمين (تجاهل جهة إشارته).',
      anchorRef: refs.rightRef,
      gate: 'event',
      event: 'answer',
      validate: (p) => p.side === 'right',
      hint: 'اضغط ▶',
    },
    {
      id: 'done',
      text: 'أحسنت! اتبع الشارة دائماً، وبدّل فوراً عند تبدّل القاعدة. أنت جاهز!',
      gate: 'next',
      last: true,
    },
  ];
  return isAr ? ar : en;
}
