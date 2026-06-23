import { tokens } from '../../../../styles/tokens';

const language = {
  id: 'language',
  name: 'Language',
  nameAr: 'اللغة',
  short: 'LNG',
  glyph: 'ᛚ',
  color: tokens.domain.language,
  desc: 'Develop vocabulary, verbal reasoning, and semantic judgment skills.',
  descAr: 'طوّر المفردات والاستدلال اللفظي ومهارات الحكم الدلالي.',
  about: 'Language is thought made portable. These mazes weave words and meaning into navigation — spell, decode, and name your way through.',
  subs: [
    {
      id: 'word-search',
      name: 'Word Maze',
      nameAr: 'متاهة الكلمات',
      blurb: 'Deduce the hidden word from positional letter feedback.',
      blurbAr: 'استنتج الكلمة المخفية من تلميحات موضع الحروف.',
      gameCount: 1,
      progress: 0,
      gameKey: 'wordle',
      tier: 'free',
      loader: () => import('./games/wordle'),
    },
    {
      id: 'fluency',
      name: 'Similarities',
      nameAr: 'التشابهات',
      blurb: 'Complete timed verbal analogies and synonym matches.',
      blurbAr: 'أكمل قياسات لفظية ومطابقات مرادفات ضمن وقت محدد.',
      gameCount: 1,
      progress: 0,
      gameKey: 'synonyms',
      tier: 'free',
      loader: () => import('./games/synonyms'),
    },
    {
      id: 'comprehension',
      name: 'Odd One Out',
      nameAr: 'الكلمة الشاذة',
      blurb: 'Identify the word that does not belong in the set.',
      blurbAr: 'حدّد الكلمة التي لا تنتمي إلى المجموعة.',
      gameCount: 1,
      progress: 0,
      gameKey: 'odd-one-out',
      tier: 'free',
      loader: () => import('./games/odd-one-out'),
    },
    { id: 'naming', name: 'Naming', gameCount: 1, progress: 0, tier: 'free' },
  ],
};

export default language;
