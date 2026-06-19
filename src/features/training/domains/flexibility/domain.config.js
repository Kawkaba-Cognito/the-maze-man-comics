import { tokens } from '../../../../styles/tokens';

const flexibility = {
  id: 'flexibility',
  name: 'Flexibility',
  nameAr: 'مرونة',
  short: 'FLX',
  glyph: 'ᚾ',
  color: tokens.domain.flexibility,
  desc: 'Arrow Rush — wordless Stroop interference & set-shifting',
  about: "Flexibility is your ability to adapt when the rules change while suppressing a strong automatic pull. An arrow points one way but sits on a side; you tap left or right by the active rule (where it POINTS or where it SITS). The rule keeps flipping — let go of the old one fast. High interference and perseveration (following the old rule) = low flexibility.",
  subs: [
    {
      id: 'switching',
      name: 'Arrow Rush',
      nameAr: 'اندفاع الأسهم',
      blurb: 'Tap by the active rule — and the rule keeps flipping.',
      blurbAr: 'اتبع القاعدة الفعّالة — والقاعدة تتغيّر باستمرار.',
      gameCount: 1,
      progress: 0,
      gameKey: 'spatial-stroop',
      tier: 'free',
      loader: () => import('./games/spatial-stroop'),
    },
    { id: 'setshift', name: 'Rule Shifting', gameCount: 2, progress: 0, tier: 'free' },
    { id: 'setbreak', name: 'Mental Set Breaking', gameCount: 2, progress: 0, tier: 'free' },
    { id: 'adaptive', name: 'Adaptive Response', gameCount: 1, progress: 0, tier: 'free' },
  ],
};

export default flexibility;
