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
      name: 'Similarities',
      nameAr: 'وجه الشبه',
      blurb: 'Timed IQ verbal — analogies & pair matching.',
      blurbAr: 'ذكاء لفظي بوقت — قياسات ومطابقة أزواج.',
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
      blurb: 'Spot the word that does not belong.',
      blurbAr: 'اكتشف الكلمة الشاذة.',
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
