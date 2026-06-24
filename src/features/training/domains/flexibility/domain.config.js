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
  about: "Flexibility is your ability to adapt when the rules change while suppressing a strong automatic pull. An arrow points one way but sits on a side; you tap left or right by the active rule (where it POINTS or where it SITS). The rule keeps flipping — let go of the old one fast. High interference and perseveration (following the old rule) = low flexibility.",
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
    {
      id: 'setshift',
      name: 'Flip',
      nameAr: 'انعكاس التحكم',
      blurb: 'Collect targets while movement controls invert at intervals.',
      blurbAr: 'اجمع الأهداف بينما ينعكس التحكم على فترات.',
      gameCount: 1,
      progress: 0,
      gameKey: 'flip',
      tier: 'free',
      loader: () => import('./games/flip'),
    },
    {
      id: 'piano-tap',
      name: 'Piano Tap',
      nameAr: 'عزف سريع',
      blurb: 'Tap falling tiles in rhythm — fast reactions with precise inhibition.',
      blurbAr: 'اضغط البلاطات الساقطة إيقاعياً — استجابة سريعة مع كبح دقيق.',
      gameCount: 1,
      progress: 0,
      gameKey: 'piano-tap',
      tier: 'free',
      loader: () => import('./games/piano-tap'),
    },
  ],
};

export default flexibility;
