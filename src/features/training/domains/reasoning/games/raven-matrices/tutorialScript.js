/** Minimal coach steps for Matrix Reasoning tutorial (static tutorial is primary). */
export function buildRavenCoachSteps(isAr, refs) {
  const t = isAr
    ? {
      grid: 'انظر كيف تتغيّر الأشكال عبر الصفوف والأعمدة.',
      pick: 'اختر الشكل الذي يُكمل الشبكة.',
      done: 'أحسنت!',
    }
    : {
      grid: 'Notice how figures change across rows and columns.',
      pick: 'Pick the figure that completes the grid.',
      done: 'Well done!',
    };
  return [
    { text: t.grid, gate: 'event', event: 'grid', target: refs?.gridRef },
    { text: t.pick, gate: 'event', event: 'answer', target: refs?.optionsRef },
    { text: t.done, last: true },
  ];
}
