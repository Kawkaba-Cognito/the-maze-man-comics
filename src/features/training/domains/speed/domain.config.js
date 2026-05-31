import { tokens } from '../../../../styles/tokens';

const speed = {
  id: 'speed',
  name: 'Speed',
  nameAr: 'سرعة',
  short: 'SPD',
  glyph: 'ᛋ',
  color: tokens.domain.speed,
  desc: 'Speed Match — Digit-Symbol substitution for processing speed.',
  about: 'Processing speed is the engine of thought. Speed Match uses the Digit-Symbol paradigm (the classic clinical measure of processing speed): match symbols to numbers as fast as you can.',
  subs: [
    {
      id: 'speed-match',
      name: 'Speed Match',
      gameCount: 1,
      progress: 0,
      gameKey: 'speed-match',
      tier: 'free',
      loader: () => import('./games/speed-match'),
    },
  ],
};

export default speed;
