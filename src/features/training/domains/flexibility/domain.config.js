import { tokens } from '../../../../styles/tokens';

const flexibility = {
  id: 'flexibility',
  name: 'Flexibility',
  nameAr: 'مرونة',
  short: 'FLX',
  glyph: 'ᚾ',
  color: tokens.domain.flexibility,
  desc: 'Shifting between tasks, rules & mindsets',
  about: "Flexibility is the mind's ability to bend without breaking. These mazes shift rules mid-run, invert controls, and force you to abandon your current strategy and adapt.",
  subs: [
    { id: 'switching', name: 'Task Switching',      gameCount: 3, progress: 0, tier: 'free' },
    { id: 'setshift',  name: 'Rule Shifting',       gameCount: 2, progress: 0, tier: 'free' },
    { id: 'setbreak',  name: 'Mental Set Breaking', gameCount: 2, progress: 0, tier: 'free' },
    { id: 'adaptive',  name: 'Adaptive Response',   gameCount: 1, progress: 0, tier: 'free' },
  ],
};

export default flexibility;
