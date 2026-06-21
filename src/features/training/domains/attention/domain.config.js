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
      nameAr: 'مهمة الشطب',
      blurb: 'Scan and tap every target — ignore the rest.',
      blurbAr: 'امسح كل الأهداف واضغطها — تجاهل البقية.',
      gameCount: 1,
      progress: 0,
      gameKey: 'cancel-task',
      tier: 'free',
      /* `loader` is what makes the game lazy-loadable: the game's bundle is
       * fetched only when the user enters it. Adding a new game = create the
       * folder, then add a `loader` line here. The hub auto-discovers it. */
      loader: () => import('./games/cancellation'),
    },
    {
      id: 'mot',
      name: 'Target Tracking',
      nameAr: 'تتبّع الأهداف',
      blurb: 'Follow the moving targets with your eyes, then tap them.',
      blurbAr: 'تابع الأهداف المتحركة بعينيك ثم اضغطها.',
      gameCount: 1,
      progress: 0,
      gameKey: 'mot',
      tier: 'free',
      loader: () => import('./games/mot'),
    },
    {
      id: 'posner',
      name: 'Train Switch',
      nameAr: 'تبديل المسار',
      blurb: 'Route each colour train to its station — tap the junction switches.',
      blurbAr: 'وجّه كل قطار ملوّن إلى محطته — اضغط مفاتيح التبديل.',
      gameCount: 1,
      progress: 0,
      gameKey: 'train-switch',
      tier: 'free',
      loader: () => import('./games/train-switch'),
    },
  ],
};

export default attention;
