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
    /*
     * Intercept took Trail Making's slot on 2026-08-14.
     *
     * Speed Match and Math Gates are both foveal, symbolic and sequential —
     * look at one thing in the middle, decode it, answer — and Trail Making was
     * a third of those, which is why the domain felt like one game three times.
     * Intercept is none of them: nothing to decode, nothing to choose, and the
     * measure is a signed error in milliseconds. Trail Making is benched, not
     * deleted; see its BENCHED.md.
     */
    {
      id: 'intercept',
      name: 'Intercept',
      nameAr: 'الاعتراض',
      blurb: 'Predict the hidden flight and defend the station through escalating sectors.',
      blurbAr: 'توقّع الحركة المخفية واحمِ المحطة عبر قطاعات متصاعدة.',
      gameCount: 1,
      progress: 0,
      gameKey: 'intercept',
      tier: 'free',
      loader: () => import('./games/intercept'),
    },
  ],
};

export default speed;
