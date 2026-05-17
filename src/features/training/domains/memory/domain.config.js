import { tokens } from '../../../../styles/tokens';

const memory = {
  id: 'memory',
  name: 'Memory',
  nameAr: 'ذاكرة',
  short: 'MEM',
  glyph: 'ᛗ',
  color: tokens.domain.memory,
  desc: 'Holding, binding & recalling information',
  about: "Memory binds past to future. Working memory is the mind's workbench — these mazes stretch it by asking you to hold routes and rules in mind while acting.",
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
