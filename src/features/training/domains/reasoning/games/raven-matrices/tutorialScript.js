/**
 * Coached tutorial for Matrix Reasoning. The "solve" step gates on the player
 * tapping the correct option of the scripted easy matrix.
 */
export function buildRavenCoachSteps(isAr, refs) {
  const en = [
    { id: 'grid', text: 'This is the matrix. Each row and each column follows a hidden rule — look across and down to spot how the figures change.', anchorRef: refs.gridRef, gate: 'next' },
    { id: 'missing', text: 'One cell is blank (the “?”). Your job is to work out which figure belongs there.', anchorRef: refs.gridRef, gate: 'next' },
    { id: 'solve', text: 'Tap the option below that completes the pattern. Take your time — accuracy matters more than speed here.', anchorRef: refs.optionsRef, gate: 'event', event: 'answer', validate: (p) => p.ok, hint: 'Pick the matching figure' },
    { id: 'done', text: 'Exactly! Solve as many as you can. The puzzles adapt — they get harder as you improve.', gate: 'next', last: true },
  ];
  const ar = [
    { id: 'grid', text: 'هذه هي المصفوفة. كل صف وكل عمود يتبع قاعدة خفية — انظر أفقياً وعمودياً لتكتشف كيف تتغيّر الأشكال.', anchorRef: refs.gridRef, gate: 'next' },
    { id: 'missing', text: 'خلية واحدة فارغة («؟»). مهمتك أن تستنتج أي شكل ينتمي إليها.', anchorRef: refs.gridRef, gate: 'next' },
    { id: 'solve', text: 'اضغط الخيار الذي يُكمل النمط بالأسفل. خذ وقتك — الدقة أهم من السرعة هنا.', anchorRef: refs.optionsRef, gate: 'event', event: 'answer', validate: (p) => p.ok, hint: 'اختر الشكل المطابق' },
    { id: 'done', text: 'بالضبط! حُلّ أكبر عدد ممكن. الألغاز تتكيّف — تزداد صعوبة كلما تحسّنت.', gate: 'next', last: true },
  ];
  return isAr ? ar : en;
}
