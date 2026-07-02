import { tokens } from '../../../../styles/tokens';

const flexibility = {
  id: 'flexibility',
  name: 'Flexibility',
  nameAr: 'المرونة',
  short: 'FLX',
  glyph: 'ᚾ',
  color: tokens.domain.flexibility,
  desc: 'Build cognitive flexibility when rules and responses must change.',
  descAr: 'عزّز المرونة المعرفية عندما تتغيّر القواعد والاستجابات المطلوبة.',
  subs: [
    {
      id: 'switching',
      name: 'Arrow Rush',
      nameAr: 'تبديل الأسهم',
      blurb: 'Follow the active rule — arrow direction or screen position.',
      blurbAr: 'اتبع القاعدة النشطة — اتجاه السهم أو موضعه على الشاشة.',
      gameCount: 1,
      progress: 0,
      gameKey: 'spatial-stroop',
      tier: 'free',
      loader: () => import('./games/spatial-stroop'),
    },
    // Card Sort (WCST) + Kawkab Hops (Brixton) — replaced Flip + Piano Tap (2026-07-02).
    {
      id: 'wisconsin',
      name: 'Card Sort',
      nameAr: 'فرز البطاقات',
      blurb: 'Match the card — colour, shape, or number? Figure out the hidden rule.',
      blurbAr: 'طابق البطاقة — لون أم شكل أم عدد؟ اكتشف القاعدة الخفية.',
      gameCount: 1,
      progress: 0,
      gameKey: 'wisconsin',
      tier: 'free',
      loader: () => import('./games/wisconsin'),
    },
    {
      id: 'brixton',
      name: 'Kawkab Hops',
      nameAr: 'قفزات كوكب',
      blurb: 'Watch Kawkab hop a pattern, then continue it — the rule keeps changing.',
      blurbAr: 'راقب قفزات كوكب ثم أكمل النمط — والقاعدة تتغيّر باستمرار.',
      gameCount: 1,
      progress: 0,
      gameKey: 'brixton',
      tier: 'free',
      loader: () => import('./games/brixton'),
    },
  ],
};

export default flexibility;
