import { tokens } from '../../../../styles/tokens';

const flexibility = {
  id: 'flexibility',
  name: 'Flexibility',
  nameAr: 'المرونة',
  short: 'FLX',
  glyph: 'ᚾ',
  color: tokens.domain.flexibility,
  desc: 'Build cognitive flexibility when rules and responses must change.',
  descAr: 'عزّز المرونة المعرفية عندما تتغيّر القواعد والاستجابات المطلوبة.',
  subs: [
    {
      /*
       * Mirror World replaced Arrow Rush in this slot on 2026-08-10.
       *
       * Arrow Rush flips a rule and asks for a left/right key. So does Task
       * Switch, one slot down — different stimuli, one construct, and Task
       * Switch is the cleaner instrument (stated cue, fixed keys, Rogers &
       * Monsell). Mirror World is a different ability entirely: it measures
       * flexibility you undergo rather than flexibility you choose.
       *
       * ⚠ Arrow Rush is NOT gone. The Assessment battery runs it as the
       * flexibility paradigm and the Daily Workout schedules it by weight, so
       * its loader is kept registered explicitly in lazyGames.js. Deleting that
       * registration empties the flexibility pillar with no error at all.
       */
      id: 'switching',
      name: 'Mirror World',
      nameAr: 'عالم المرآة',
      blurb: 'Flick to the target. Partway through, your hand stops going where you point it.',
      blurbAr: 'اندفع نحو الهدف. في منتصف الطريق تتوقّف يدك عن الذهاب حيث تشير.',
      gameCount: 1,
      progress: 0,
      gameKey: 'mirror-world',
      tier: 'free',
      loader: () => import('./games/mirror-world'),
    },
    /*
     * Task Switch + Sort It Another Way replaced Card Sort (WCST) and Kawkab
     * Hops (Brixton) on 2026-08-09.
     *
     * Not because either was badly built — both were faithful implementations
     * of real instruments. Because they were the SAME LOOP: infer a hidden rule
     * from sparse feedback, then notice it silently changed. Two thirds of a
     * three-game domain ran that loop, and the loop is inherently punishing —
     * the trial right after a silent switch is unguessable by design, so a
     * player doing everything right is still told they are wrong.
     *
     * The replacements split the construct instead of serving half of it twice:
     * Task Switch is EXPLICIT shifting (the rule is always stated, you pay in
     * milliseconds), Sort It Another Way is GENERATIVE (you produce the rules
     * yourself). Neither can punish a player for failing to read the game's
     * mind. Both retired games are benched, not deleted — see BENCHED.md.
     */
    {
      id: 'task-switch',
      name: 'Task Switch',
      nameAr: 'تبديل المهمة',
      blurb: 'Answer the colour, then the shape — the keys never move, only the rule.',
      blurbAr: 'أجب عن اللون ثم الشكل — المفتاحان ثابتان والقاعدة وحدها تتغيّر.',
      gameCount: 1,
      progress: 0,
      gameKey: 'task-switch',
      tier: 'free',
      loader: () => import('./games/task-switch'),
    },
    {
      id: 'sort-shift',
      name: 'Sort It Another Way',
      nameAr: 'رتّبها بطريقة أخرى',
      blurb: 'Split six cards into two groups — then find a completely different way.',
      blurbAr: 'قسّم ست بطاقات إلى مجموعتين — ثم جد طريقة مختلفة تماماً.',
      gameCount: 1,
      progress: 0,
      gameKey: 'sort-shift',
      tier: 'free',
      loader: () => import('./games/sort-shift'),
    },
  ],
};

export default flexibility;
