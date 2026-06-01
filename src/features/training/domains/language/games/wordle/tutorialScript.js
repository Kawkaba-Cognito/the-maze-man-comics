/**
 * Coached tutorial steps for Word Maze (letter-link / Boggle). Runs a real easy
 * grid with the timer off; gates on the player linking their first valid word.
 */
export function buildWordleCoachSteps(isAr, refs) {
  const en = [
    {
      id: 'board',
      text: 'Here is a grid of letters. Drag across touching letters (including diagonals) to spell a word.',
      anchorRef: refs.boardRef,
      gate: 'next',
    },
    {
      id: 'make-word',
      text: 'Try it now — link letters to make any valid word, then lift your finger.',
      anchorRef: refs.boardRef,
      gate: 'event',
      event: 'word',
      hint: 'Link a word',
    },
    {
      id: 'done',
      text: 'Nice find! Longer words score more. Find as many as you can before time runs out!',
      gate: 'next',
      last: true,
    },
  ];
  const ar = [
    {
      id: 'board',
      text: 'هذه شبكة حروف. اسحب عبر الحروف المتلاصقة (وحتى القطرية) لتكوين كلمة.',
      anchorRef: refs.boardRef,
      gate: 'next',
    },
    {
      id: 'make-word',
      text: 'جرّب الآن — اربط الحروف لتكوين أي كلمة صحيحة، ثم ارفع إصبعك.',
      anchorRef: refs.boardRef,
      gate: 'event',
      event: 'word',
      hint: 'اربط كلمة',
    },
    {
      id: 'done',
      text: 'إيجاد رائع! الكلمات الأطول نقاطها أعلى. جد أكبر عدد قبل انتهاء الوقت!',
      gate: 'next',
      last: true,
    },
  ];
  return isAr ? ar : en;
}
