import { tokens } from '../../../../styles/tokens';

const reasoning = {
  id: 'reasoning',
  name: 'Reasoning',
  nameAr: 'تفكير',
  short: 'RSN',
  glyph: 'ᛉ',
  color: tokens.domain.reasoning,
  desc: 'Logic, planning & problem-solving',
  about: "Reasoning is the art of building bridges from what you know to what you don't. Plan, deduce, and solve your way through mazes that demand logic, not luck.",
  subs: [
    { id: 'logical',  name: 'Block Escape',  nameAr: 'هروب القطع', blurb: 'Slide blocks to free the exit.', blurbAr: 'حرّك القطع لتفتح المخرج.', gameCount: 2, progress: 0, gameKey: 'rush-hour', tier: 'free', loader: () => import('./games/rush-hour') },
    { id: 'problem',  name: 'Matrix IQ',     nameAr: 'مصفوفات الذكاء', blurb: 'Find the pattern, complete the grid.', blurbAr: 'اكتشف النمط وأكمل الشبكة.', gameCount: 2, progress: 0, gameKey: 'raven-matrices', tier: 'free', loader: () => import('./games/raven-matrices') },
    { id: 'planning', name: 'Colour Sort',         nameAr: 'فرز الألوان', blurb: 'Sort the colours into matching stacks.', blurbAr: 'افرز الألوان في أعمدة متطابقة.', gameCount: 2, progress: 0, gameKey: 'tower-hanoi', tier: 'free', loader: () => import('./games/tower-hanoi') },
    { id: 'causal',   name: 'Causal Reasoning',   gameCount: 1, progress: 0, tier: 'free' },
  ],
};

export default reasoning;
