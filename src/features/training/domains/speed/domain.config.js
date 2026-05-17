import { tokens } from '../../../../styles/tokens';

const speed = {
  id: 'speed',
  name: 'Speed',
  nameAr: 'سرعة',
  short: 'SPD',
  glyph: 'ᛋ',
  color: tokens.domain.speed,
  desc: 'Vigil Test — sustained attention and impulse control for processing speed.',
  about: 'Processing speed is the engine of thought. Vigil Test trains how quickly and accurately you respond over time with square vs. circle trials.',
  subs: [
    {
      id: 'vigil',
      name: 'Vigil Test',
      gameCount: 1,
      progress: 0,
      gameKey: 'vigil-test',
      tier: 'free',
      loader: () => import('./games/vigil'),
    },
  ],
};

export default speed;
