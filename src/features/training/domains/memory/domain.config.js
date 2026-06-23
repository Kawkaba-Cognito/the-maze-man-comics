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
  about: "Working memory is the mind's workbench. Memo Span uses the Corsi block test (watch a grid light up, reproduce it forward or in reverse). N-Back streams objects one at a time — spot when one repeats from N steps back, the most-studied working-memory trainer.",
  subs: [
    {
      id: 'working',
      name: 'Memo Span',
      nameAr: 'مدى الذاكرة',
      blurb: 'Watch cells light up in sequence, then reproduce the pattern.',
      blurbAr: 'راقب إضاءة الخلايا بالتسلسل، ثم أعد النمط.',
      gameCount: 1,
      progress: 0,
      gameKey: 'memo-span',
      tier: 'free',
      loader: () => import('./games/memo-span'),
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
