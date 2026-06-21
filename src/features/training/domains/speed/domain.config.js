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
      name: 'Piano Tap',
      nameAr: 'عزف سريع',
      blurb: 'Tap the falling tiles in time — fast fingers, no wrong taps.',
      blurbAr: 'انقر البلاطات الساقطة في وقتها — أصابع سريعة بلا أخطاء.',
      gameCount: 1,
      progress: 0,
      gameKey: 'piano-tap',
      tier: 'free',
      loader: () => import('./games/piano-tap'),
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
