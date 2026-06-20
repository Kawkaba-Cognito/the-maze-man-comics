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
      nameAr: 'مطابقة سريعة',
      blurb: 'Match symbols to digits as fast as you can.',
      blurbAr: 'طابق الرموز بالأرقام بأسرع ما يمكن.',
      gameCount: 1,
      progress: 0,
      gameKey: 'speed-match',
      tier: 'free',
      loader: () => import('./games/speed-match'),
    },
    {
      id: 'go-no-go',
      name: 'Go / No-Go',
      nameAr: 'قف / انطلق',
      blurb: 'Tap fast on GO, hold on NO-GO — speed with self-control.',
      blurbAr: 'اضغط بسرعة على «انطلق» وتوقّف عند «قف» — سرعة مع ضبط النفس.',
      gameCount: 1,
      progress: 0,
      gameKey: 'go-no-go',
      tier: 'free',
      loader: () => import('./games/go-no-go'),
    },
    {
      id: 'trail-making',
      name: 'Trail Making',
      nameAr: 'صل الأرقام',
      blurb: 'Connect the numbers in order, racing the clock.',
      blurbAr: 'صل الأرقام بالترتيب مسابقاً الوقت.',
      gameCount: 1,
      progress: 0,
      gameKey: 'trail-making',
      tier: 'free',
      loader: () => import('./games/trail-making'),
    },
  ],
};

export default speed;
