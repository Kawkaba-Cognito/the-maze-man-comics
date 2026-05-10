import { tokens } from '../../../../styles/tokens';

const language = {
  id: 'language',
  name: 'Language',
  nameAr: 'لغة',
  short: 'LNG',
  glyph: 'ᛚ',
  color: tokens.domain.language,
  desc: 'Words, meaning & verbal fluency',
  about: 'Language is thought made portable. These mazes weave words and meaning into navigation — spell, decode, and name your way through.',
  subs: [
    { id: 'fluency',       name: 'Verbal Fluency', gameCount: 2, progress: 0, tier: 'free' },
    { id: 'comprehension', name: 'Comprehension',  gameCount: 2, progress: 0, tier: 'free' },
    { id: 'naming',        name: 'Naming',         gameCount: 1, progress: 0, tier: 'free' },
  ],
};

export default language;
