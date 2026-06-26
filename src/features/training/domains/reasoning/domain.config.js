import { tokens } from '../../../../styles/tokens';

const reasoning = {
  id: 'reasoning',
  name: 'Reasoning',
  nameAr: 'الاستدلال',
  short: 'RSN',
  glyph: 'ᛉ',
  color: tokens.domain.reasoning,
  desc: 'Build logical reasoning, planning, and step-by-step problem solving.',
  descAr: 'بنِّ الاستدلال المنطقي والتخطيط وحل المشكلات خطوة بخطوة.',
  subs: [
    {
      id: 'logical',
      name: 'Block Escape',
      nameAr: 'هروب القطع',
      blurb: 'Plan block moves to clear a path to the exit.',
      blurbAr: 'خطّط لتحريك القطع لإفساح طريق نحو المخرج.',
      gameCount: 2,
      progress: 0,
      gameKey: 'rush-hour',
      tier: 'free',
      loader: () => import('./games/rush-hour'),
    },
    {
      id: 'problem',
      name: 'Matrix IQ',
      nameAr: 'مصفوفات الذكاء',
      blurb: 'Detect the pattern and complete the missing matrix cell.',
      blurbAr: 'اكتشف النمط وأكمل الخانة الناقصة في المصفوفة.',
      gameCount: 2,
      progress: 0,
      gameKey: 'raven-matrices',
      tier: 'free',
      loader: () => import('./games/raven-matrices'),
    },
    {
      id: 'planning',
      name: 'Colour Sort',
      nameAr: 'فرز الألوان',
      blurb: 'Plan moves to sort colored disks onto the matching pegs.',
      blurbAr: 'خطّط لنقل الأقراص لفرزها على الأعمدة المطابقة.',
      gameCount: 2,
      progress: 0,
      gameKey: 'tower-hanoi',
      tier: 'free',
      loader: () => import('./games/tower-hanoi'),
    },
    { id: 'causal', name: 'Causal Reasoning', gameCount: 1, progress: 0, tier: 'free' },
  ],
};

export default reasoning;
