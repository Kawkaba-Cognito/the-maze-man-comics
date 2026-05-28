import { tokens } from '../../../../styles/tokens';

const flexibility = {
  id: 'flexibility',
  name: 'Flexibility',
  nameAr: 'مرونة',
  short: 'FLX',
  glyph: 'ᚾ',
  color: tokens.domain.flexibility,
  desc: 'Wisconsin Card Sort — set-shifting & cognitive flexibility (WCST)',
  about: "Flexibility is your ability to adapt when the rules change. In this test, you discover a hidden sorting rule, master it — then it shifts. Your challenge: let go of what worked and find the new pattern. High perseveration (sticking to old rules) = low flexibility.",
  subs: [
    {
      id: 'switching',
      name: 'Card Sort (WCST)',
      gameCount: 1,
      progress: 0,
      gameKey: 'rule-switch',
      tier: 'free',
      loader: () => import('./games/rule-switch'),
    },
    { id: 'setshift', name: 'Rule Shifting', gameCount: 2, progress: 0, tier: 'free' },
    { id: 'setbreak', name: 'Mental Set Breaking', gameCount: 2, progress: 0, tier: 'free' },
    { id: 'adaptive', name: 'Adaptive Response', gameCount: 1, progress: 0, tier: 'free' },
  ],
};

export default flexibility;
