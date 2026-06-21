const CHEERS = {
  en: ['Nice!', 'Good job!', 'Doing great!', 'Keep going!', 'Perfect!', 'You\'ve got it!', 'Awesome!'],
  ar: ['جميل!', 'أحسنت!', 'ممتاز!', 'استمر!', 'رائع!', 'أنت تتقنها!', 'مذهل!'],
};

export function pickCheer(isAr, stepIndex) {
  const list = CHEERS[isAr ? 'ar' : 'en'];
  return list[stepIndex % list.length];
}
