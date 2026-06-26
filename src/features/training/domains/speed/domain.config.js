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
      id: 'math-gates',
      name: 'Math Gates',
      nameAr: 'بوابات الحساب',
      blurb: 'Steer into the lane that shows the correct arithmetic answer.',
      blurbAr: 'توجّه إلى الممر الذي يعرض الإجابة الحسابية الصحيحة.',
      gameCount: 1,
      progress: 0,
      gameKey: 'math-gates',
      tier: 'free',
      loader: () => import('./games/math-gates'),
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
