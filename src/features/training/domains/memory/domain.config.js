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
    // Memo Span retired from the lineup — Story Time covers the span slot.
    // (Game files kept under games/memo-span for easy re-enable.)
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
    // Keep Track replaced Dual N-Back here on 2026-08-10. N-Back is benched,
    // not deleted — see games/nback/BENCHED.md for the reasoning.
    {
      id: 'nback',
      name: 'Keep Track',
      nameAr: 'تتبّع الفئات',
      blurb: 'Words stream past. Remember the most recent one from each category.',
      blurbAr: 'تمرّ الكلمات تباعاً. تذكّر آخر كلمة في كل فئة.',
      gameCount: 1,
      progress: 0,
      gameKey: 'keep-track',
      tier: 'free',
      loader: () => import('./games/keep-track'),
    },
    {
      id: 'associative',
      name: 'Pair Match',
      nameAr: 'مطابقة الأزواج',
      blurb: 'Watch each symbol hide in a box — then tap where it was.',
      blurbAr: 'شاهد كل رمز يختبئ في صندوق — ثم اضغط أين كان.',
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
