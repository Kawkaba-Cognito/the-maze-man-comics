import { tokens } from '../../../../styles/tokens';

/**
 * Attention domain — focus, sustained attention, distractor suppression.
 */
const attention = {
  id: 'attention',
  name: 'Attention',
  nameAr: 'الانتباه',
  short: 'ATT',
  glyph: 'ᚨ',
  color: tokens.domain.attention,
  desc: 'Strengthen visual search, sustained attention, and rapid attention switching.',
  descAr: 'عزّز البحث البصري والتركيز المستمر وتبديل الانتباه السريع.',
  about: null,
  subs: [
    {
      id: 'cancellation',
      name: 'Cancellation Task',
      nameAr: 'مهمة الإلغاء',
      blurb: 'Scan the grid and mark every instance of the target symbol.',
      blurbAr: 'امسح الشبكة وحدّد كل ظهور للرمز المستهدف.',
      gameCount: 1,
      progress: 0,
      gameKey: 'cancel-task',
      tier: 'free',
      loader: () => import('./games/cancellation'),
    },
    {
      id: 'mot',
      name: 'Target Tracking',
      nameAr: 'تتبّع الأهداف',
      blurb: 'Track moving targets, then identify the cued items from memory.',
      blurbAr: 'تتبّع الأهداف المتحركة، ثم حدّد العناصر المطلوبة من الذاكرة.',
      gameCount: 1,
      progress: 0,
      gameKey: 'mot',
      tier: 'free',
      loader: () => import('./games/mot'),
    },
    {
      id: 'posner',
      name: 'Rule Switch',
      nameAr: 'تبديل القواعد',
      blurb: 'Apply changing rules to route each train to the correct station.',
      blurbAr: 'طبّق القواعد المتغيّرة لتوجيه كل قطار إلى المحطة الصحيحة.',
      gameCount: 1,
      progress: 0,
      gameKey: 'train-switch',
      tier: 'free',
      loader: () => import('./games/train-switch'),
    },
  ],
};

export default attention;
