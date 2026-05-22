import { tokens } from '../../../../styles/tokens';

const flexibility = {
  id: 'flexibility',
  name: 'Flexibility',
  nameAr: 'مرونة',
  short: 'FLX',
  glyph: 'ᚾ',
  color: tokens.domain.flexibility,
  desc: 'Wisconsin Card Sort — set-shifting & cognitive flexibility (WCST)',
  about: "Flexibility is the mind's ability to bend without breaking. These mazes shift rules mid-run, invert controls, and force you to abandon your current strategy and adapt.",
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
