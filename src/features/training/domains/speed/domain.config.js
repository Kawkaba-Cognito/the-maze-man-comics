import { tokens } from '../../../../styles/tokens';

const speed = {
  id: 'speed',
  name: 'Speed',
  nameAr: 'سرعة',
  short: 'SPD',
  glyph: 'ᛋ',
  color: tokens.domain.speed,
  desc: 'Processing information quickly and accurately',
  about: 'Processing speed is the engine of thought. These mazes challenge how quickly you can take in, interpret, and act on information — reacting before the path fades.',
  subs: [
    { id: 'processing', name: 'Processing Velocity', gameCount: 3, progress: 0, tier: 'free' },
    { id: 'reaction',   name: 'Reaction Speed',      gameCount: 2, progress: 0, tier: 'free' },
    { id: 'agility',    name: 'Mental Agility',      gameCount: 2, progress: 0, tier: 'free' },
  ],
};

export default speed;
