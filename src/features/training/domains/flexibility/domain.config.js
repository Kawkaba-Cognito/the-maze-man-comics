import { tokens } from '../../../../styles/tokens';

const flexibility = {
  id: 'flexibility',
  name: 'Flexibility',
  nameAr: 'مرونة',
  short: 'FLX',
  glyph: 'ᚾ',
  color: tokens.domain.flexibility,
  desc: 'Switch rules fast when tasks keep changing.',
  about: "Flexibility is your ability to adapt when the rules change while suppressing a strong automatic pull. An arrow points one way but sits on a side; you tap left or right by the active rule (where it POINTS or where it SITS). The rule keeps flipping — let go of the old one fast. High interference and perseveration (following the old rule) = low flexibility.",
  subs: [
    {
      id: 'switching',
      name: 'Arrow Rush',
      nameAr: 'اندفاع الأسهم',
      blurb: 'Follow the rule — it keeps flipping.',
      blurbAr: 'اتبع القاعدة — فهي تتغيّر.',
      gameCount: 1,
      progress: 0,
      gameKey: 'spatial-stroop',
      tier: 'free',
      loader: () => import('./games/spatial-stroop'),
    },
    {
      id: 'setshift',
      name: 'Flip',
      nameAr: 'انقلاب',
      blurb: 'Catch gems — then controls invert.',
      blurbAr: 'أمسك الجواهر — ينقلب التحكم.',
      gameCount: 1,
      progress: 0,
      gameKey: 'flip',
      tier: 'free',
      loader: () => import('./games/flip'),
    },
    {
      id: 'setbreak',
      name: 'Math Gates',
      nameAr: 'بوابات الحساب',
      blurb: 'Pick the gate with the right answer.',
      blurbAr: 'اختر البوابة ذات الإجابة الصحيحة.',
      gameCount: 1,
      progress: 0,
      gameKey: 'math-gates',
      tier: 'free',
      loader: () => import('./games/math-gates'),
    },
  ],
};

export default flexibility;
