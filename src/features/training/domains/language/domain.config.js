import { tokens } from '../../../../styles/tokens';

const language = {
  id: 'language',
  name: 'Language',
  nameAr: 'لغة',
  short: 'LNG',
  glyph: 'ᛚ',
  color: tokens.domain.language,
  desc: 'Connect letters, spell words & verbal fluency',
  about: 'Language is thought made portable. These mazes weave words and meaning into navigation — spell, decode, and name your way through.',
  subs: [
    {
      id: 'word-search',
      name: 'Word Maze',
      nameAr: 'متاهة الكلمات',
      blurb: 'Guess the hidden word from the clues.',
      blurbAr: 'خمّن الكلمة المخفية من التلميحات.',
      gameCount: 1,
      progress: 0,
      gameKey: 'wordle',
      tier: 'free',
      loader: () => import('./games/wordle'),
    },
    {
      id: 'fluency',
      name: 'Synonyms & Antonyms',
      nameAr: 'المرادفات والأضداد',
      blurb: 'Pick the synonym — or the opposite — of the word.',
      blurbAr: 'اختر المرادف — أو الضدّ — للكلمة.',
      gameCount: 1,
      progress: 0,
      gameKey: 'synonyms',
      tier: 'free',
      loader: () => import('./games/synonyms'),
    },
    {
      id: 'comprehension',
      name: 'Odd One Out',
      nameAr: 'الشاذّ',
      blurb: 'Spot the word that doesn’t belong with the rest.',
      blurbAr: 'اكتشف الكلمة التي لا تنتمي إلى البقية.',
      gameCount: 1,
      progress: 0,
      gameKey: 'odd-one-out',
      tier: 'free',
      loader: () => import('./games/odd-one-out'),
    },
    { id: 'naming',        name: 'Naming',         gameCount: 1, progress: 0, tier: 'free' },
  ],
};

export default language;
