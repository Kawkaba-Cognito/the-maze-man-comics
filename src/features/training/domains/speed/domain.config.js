import { tokens } from '../../../../styles/tokens';

const speed = {
  id: 'speed',
  name: 'Speed',
  nameAr: 'السرعة',
  short: 'SPD',
  glyph: 'ᛋ',
  color: tokens.domain.speed,
  desc: 'Improve processing speed and accurate decisions under time pressure.',
  descAr: 'حسّن سرعة المعالجة واتخاذ القرار الدقيق تحت ضغط الوقت.',
  about: 'Processing speed is the engine of thought. Speed Match uses the Digit-Symbol paradigm (the classic clinical measure of processing speed): match symbols to numbers as fast as you can.',
  subs: [
    {
      id: 'speed-match',
      name: 'Speed Match',
      nameAr: 'مطابقة سريعة',
      blurb: 'Match each symbol to its digit code — quickly and accurately.',
      blurbAr: 'طابق كل رمز برمزه الرقمي — بسرعة ودقة.',
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
      blurb: 'Tap falling tiles in rhythm — fast reactions with precise inhibition.',
      blurbAr: 'اضغط البلاطات الساقطة إيقاعياً — استجابة سريعة مع كبح دقيق.',
      gameCount: 1,
      progress: 0,
      gameKey: 'piano-tap',
      tier: 'free',
      loader: () => import('./games/piano-tap'),
    },
    {
      id: 'trail-making',
      name: 'Trail Making',
      nameAr: 'ربط المسار',
      blurb: 'Connect numbered nodes in order before time runs out.',
      blurbAr: 'صل العقد المرقّمة بالترتيب قبل انتهاء الوقت.',
      gameCount: 1,
      progress: 0,
      gameKey: 'trail-making',
      tier: 'free',
      loader: () => import('./games/trail-making'),
    },
  ],
};

export default speed;
