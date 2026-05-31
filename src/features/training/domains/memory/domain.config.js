import { tokens } from '../../../../styles/tokens';

const memory = {
  id: 'memory',
  name: 'Memory',
  nameAr: 'ذاكرة',
  short: 'MEM',
  glyph: 'ᛗ',
  color: tokens.domain.memory,
  desc: 'Working memory — hold and manipulate a sequence',
  about: "Working memory is the mind's workbench. Memo Span uses the Corsi block test and its backward variant: watch a grid light up in sequence, then reproduce it — in the same order (storage) or in reverse (manipulation = working memory).",
  subs: [
    {
      id: 'working',
      name: 'Memo Span',
      gameCount: 1,
      progress: 0,
      gameKey: 'memo-span',
      tier: 'free',
      loader: () => import('./games/memo-span'),
    },
    { id: 'short', name: 'Short-term Memory', gameCount: 2, progress: 0, tier: 'free' },
    { id: 'associative', name: 'Associative Memory', gameCount: 2, progress: 0, tier: 'free' },
    { id: 'longterm', name: 'Long-term Memory', gameCount: 1, progress: 0, tier: 'free' },
  ],
};

export default memory;
