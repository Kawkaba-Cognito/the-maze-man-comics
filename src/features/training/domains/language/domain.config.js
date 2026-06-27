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
      name: 'Word Links',
      nameAr: 'روابط الكلمات',
      blurb: 'Synonyms, analogies, matching pairs and odd-one-out — judge how words relate, against the clock.',
      blurbAr: 'مرادفات وقياسات ومطابقة أزواج وكلمة شاذّة — احكم على علاقة الكلمات ضمن الوقت.',
      gameCount: 1,
      progress: 0,
      gameKey: 'synonyms',
      tier: 'free',
      loader: () => import('./games/synonyms'),
    },
    {
      id: 'trivia',
      name: 'Trivia',
      nameAr: 'معلومات',
      blurb: 'Climb the staircase by answering general-knowledge questions — three mistakes and you’re out.',
      blurbAr: 'اصعد السلّم بالإجابة عن أسئلة معلومات عامة — ثلاثة أخطاء وتخرج.',
      gameCount: 1,
      progress: 0,
      gameKey: 'trivia',
      tier: 'free',
      loader: () => import('./games/trivia'),
    },
  ],
};

export default language;
