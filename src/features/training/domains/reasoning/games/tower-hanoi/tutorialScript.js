/**
 * Coached tutorial for Colour Sort. The final step gates on the player actually
 * solving the small scripted board (each colour gathered on its own peg).
 */
export function buildColourSortCoachSteps(isAr, refs) {
  const en = [
    { id: 'goal', text: 'Goal: gather each COLOUR onto its own peg. Empty pegs are free space to move things around.', anchorRef: refs.boardRef, gate: 'next' },
    { id: 'rule', text: 'Two rules: you can only stack the SAME colour, and never a bigger disk on a smaller one. The numbers show each disk’s size.', anchorRef: refs.boardRef, gate: 'next' },
    { id: 'how', text: 'Tap a peg to lift its top disk, then tap another peg to drop it. Try it now — sort every colour onto its own peg.', anchorRef: refs.boardRef, gate: 'event', event: 'solved', hint: 'Get each colour onto one peg' },
    { id: 'done', text: 'Solved! Use Undo if you get stuck. Bigger boards add more colours and more pegs — plan your moves to use fewer.', gate: 'next', last: true },
  ];
  const ar = [
    { id: 'goal', text: 'الهدف: اجمع كل لون على عموده الخاص. الأعمدة الفارغة مساحة حرة للمناورة.', anchorRef: refs.boardRef, gate: 'next' },
    { id: 'rule', text: 'قاعدتان: يمكنك تكديس نفس اللون فقط، ولا تضع قرصاً أكبر فوق أصغر. الأرقام تبيّن حجم كل قرص.', anchorRef: refs.boardRef, gate: 'next' },
    { id: 'how', text: 'اضغط عموداً لرفع قرصه العلوي، ثم اضغط عموداً آخر لإسقاطه. جرّب الآن — افرز كل لون على عموده.', anchorRef: refs.boardRef, gate: 'event', event: 'solved', hint: 'اجمع كل لون على عمود واحد' },
    { id: 'done', text: 'حُلّت! استخدم التراجع إن علقت. الألواح الأكبر تضيف ألواناً وأعمدة أكثر — خطّط لتقليل حركاتك.', gate: 'next', last: true },
  ];
  return isAr ? ar : en;
}
