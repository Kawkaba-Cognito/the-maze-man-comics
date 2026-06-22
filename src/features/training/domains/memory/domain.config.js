import { tokens } from '../../../../styles/tokens';

const memory = {
  id: 'memory',
  name: 'Memory',
  nameAr: 'ذاكرة',
  short: 'MEM',
  glyph: 'ᛗ',
  color: tokens.domain.memory,
  desc: 'Working memory — hold and manipulate a sequence',
  about: "Working memory is the mind's workbench. Memo Span uses the Corsi block test (watch a grid light up, reproduce it forward or in reverse). N-Back streams objects one at a time — spot when one repeats from N steps back, the most-studied working-memory trainer.",
  subs: [
    {
      id: 'working',
      name: 'Memo Span',
      nameAr: 'مدى الذاكرة',
      blurb: 'Watch the grid light up, then repeat it.',
      blurbAr: 'راقب إضاءة الشبكة ثم كرّرها.',
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
      blurb: 'Spot when an item repeats from N steps back.',
      blurbAr: 'اكتشف تكرار العنصر قبل N خطوات.',
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
      blurb: 'Learn each pair, then recall it.',
      blurbAr: 'احفظ كل زوج ثم تذكّره.',
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
