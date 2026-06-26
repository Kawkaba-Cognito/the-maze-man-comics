import { tokens } from '../../../../styles/tokens';

const memory = {
  id: 'memory',
  name: 'Memory',
  nameAr: 'الذاكرة',
  short: 'MEM',
  glyph: 'ᛗ',
  color: tokens.domain.memory,
  desc: 'Strengthen working memory — hold, update, and recall information on demand.',
  descAr: 'عزّز الذاكرة العاملة: احتفظ بالمعلومات وحدّثها واسترجعها عند الطلب.',
  subs: [
    {
      id: 'working',
      name: 'Story Time',
      nameAr: 'وقت القصة',
      blurb: 'Watch a story unfold panel by panel, then rebuild it in the right order.',
      blurbAr: 'شاهد القصة تتكشّف لوحةً لوحة، ثم أعد ترتيبها بالتسلسل الصحيح.',
      gameCount: 1,
      progress: 0,
      gameKey: 'story-grid',
      tier: 'free',
      loader: () => import('./games/story-grid'),
    },
    {
      id: 'nback',
      name: 'N-Back',
      nameAr: 'إن-باك',
      blurb: 'Respond when the current item matches the one from N steps earlier.',
      blurbAr: 'استجب عندما يطابق العنصر الحالي عنصراً قبل N خطوات.',
      gameCount: 1,
      progress: 0,
      gameKey: 'nback',
      tier: 'free',
      loader: () => import('./games/nback'),
    },
    {
      id: 'associative',
      name: 'Pair Match',
      nameAr: 'مطابقة الأزواج',
      blurb: 'Learn each pair, then recall the missing partner on cue.',
      blurbAr: 'احفظ كل زوج، ثم استرجع الشريك الناقص عند الطلب.',
      gameCount: 1,
      progress: 0,
      gameKey: 'paired-associates',
      tier: 'free',
      loader: () => import('./games/paired-associates'),
    },
    { id: 'longterm', name: 'Long-term Memory', gameCount: 1, progress: 0, tier: 'free' },
  ],
};

export default memory;
