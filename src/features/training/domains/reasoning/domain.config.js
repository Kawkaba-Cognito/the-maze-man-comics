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
    { id: 'logical',  name: 'Logical Deduction',  gameCount: 2, progress: 0, gameKey: 'rush-hour', tier: 'free', loader: () => import('./games/rush-hour') },
    { id: 'problem',  name: 'Matrix Reasoning',   gameCount: 2, progress: 0, gameKey: 'raven-matrices', tier: 'free', loader: () => import('./games/raven-matrices') },
    { id: 'planning', name: 'Colour Sort',         gameCount: 2, progress: 0, gameKey: 'tower-hanoi', tier: 'free', loader: () => import('./games/tower-hanoi') },
    { id: 'causal',   name: 'Causal Reasoning',   gameCount: 1, progress: 0, tier: 'free' },
  ],
};

export default reasoning;
