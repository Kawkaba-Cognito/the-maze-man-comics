import { tokens } from '../../../../styles/tokens';

/**
 * Attention domain — focus, sustained attention, distractor suppression.
 *
 * Each entry in `subs` is a sub-skill (a category of game). A sub-skill may
 * advertise multiple `gameCount` games even if only one is wired today via
 * `gameKey`. Fields with `tier` are checked by the (future) entitlements layer.
 */
const attention = {
  id: 'attention',
  name: 'Attention',
  nameAr: 'انتباه',
  short: 'ATT',
  glyph: 'ᚨ',
  color: tokens.domain.attention,
  desc: 'Cancellation — level modes, 20 levels each, and same-grid challenge (FocusQuest-style).',
  about: null,
  subs: [
    {
      id: 'cancellation',
      name: 'Cancellation task',
      gameCount: 1,
      progress: 0,
      gameKey: 'cancel-task',
      tier: 'free',
      /* `loader` is what makes the game lazy-loadable: the game's bundle is
       * fetched only when the user enters it. Adding a new game = create the
       * folder, then add a `loader` line here. The hub auto-discovers it. */
      loader: () => import('./games/cancellation'),
    },
  ],
};

export default attention;
