const CHEERS = {
  en: ['Nice!', 'Good job!', 'Doing great!', 'Keep going!', 'Perfect!', 'You\'ve got it!', 'Awesome!'],
  ar: ['جميل!', 'أحسنت!', 'ممتاز!', 'استمر!', 'رائع!', 'أنت تتقنها!', 'مذهل!'],
};

const COACHED_DONE = {
  en: 'Great job! Practice 2 — solve on your own. Hints are free if you need help.',
  ar: 'أحسنت! التمرين ٢ — حلّ بنفسك. التلميحات مجانية إذا احتجت مساعدة.',
};

export function pickCheer(isAr, stepIndex) {
  const list = CHEERS[isAr ? 'ar' : 'en'];
  return list[stepIndex % list.length];
}

export function coachedCompleteCheer(isAr) {
  return COACHED_DONE[isAr ? 'ar' : 'en'];
}
