/**
 * Coached tutorial steps for Memo Span (Corsi). Runs a short forward sequence;
 * gates on the study playback finishing, then on a correct full recall.
 */
export function buildMemoCoachSteps(isAr, refs) {
  const en = [
    {
      id: 'watch',
      text: 'Watch closely — the cells will light up one by one. Remember the order.',
      anchorRef: refs.stageRef,
      gate: 'event',
      event: 'study-done',
    },
    {
      id: 'recall',
      text: 'Now tap the cells in the SAME order you just saw.',
      anchorRef: refs.stageRef,
      gate: 'event',
      event: 'recall-done',
      hint: 'Tap in order',
    },
    {
      id: 'done',
      text: 'Perfect! Later the order goes BACKWARD and the sequence grows. Trust your memory!',
      gate: 'next',
      last: true,
    },
  ];
  const ar = [
    {
      id: 'watch',
      text: 'راقب جيداً — ستضيء الخلايا واحدة تلو الأخرى. احفظ الترتيب.',
      anchorRef: refs.stageRef,
      gate: 'event',
      event: 'study-done',
    },
    {
      id: 'recall',
      text: 'الآن اضغط الخلايا بنفس الترتيب الذي رأيته.',
      anchorRef: refs.stageRef,
      gate: 'event',
      event: 'recall-done',
      hint: 'اضغط بالترتيب',
    },
    {
      id: 'done',
      text: 'ممتاز! لاحقاً يصبح الترتيب معكوساً وتطول السلسلة. ثِق بذاكرتك!',
      gate: 'next',
      last: true,
    },
  ];
  return isAr ? ar : en;
}
