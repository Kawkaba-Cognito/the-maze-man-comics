/*
 * Block Escape's coach script.
 *
 * ⚠ THE CONSTRUCT IS PLANNING BEFORE ACTING, AND THE BOARD INVITES THE OPPOSITE.
 * The instinctive first move is always the piece directly in front of the exit,
 * and that is almost always the move that builds the jam. What this game
 * measures is whether you trace the chain of blockers BEFORE touching anything —
 * which costs nothing and feels like doing nothing, so players skip it.
 *
 * ── 2026-09-03: four steps became eight, on the spine in COACH-PLAN.md ──
 * The old step 2 carried the whole method AND the warning about the obvious
 * move in one paragraph. The method is now demonstrated as a procedure the
 * player can actually follow ("find what blocks the exit, then what blocks
 * that") rather than described in passing.
 *
 * ⚠ NO AWAIT STEP: no `satisfiedFor` predicate on this game.
 */
export const RUSH_HOUR_COACH = {
  id: 'rush-hour@coach2',
  steps: [
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. One piece has to reach the exit. Only that one — the rest are in the way.",
      ar: 'أنا د. كوكب. قطعة واحدة عليها أن تبلغ المخرج. هي وحدها — وسائرها في الطريق.',
    },
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: 'Every piece slides only along its own length. The long ones never turn, and nothing ever jumps over anything.',
      ar: 'وكل قطعة تنزلق في اتجاه طولها وحده. فالطويلة لا تستدير، ولا شيء يقفز فوق شيء أبداً.',
    },
    {
      point: '[data-coach="nudge"]',
      awaitTap: false,
      en: 'Drag a piece, or select it and use these arrows — whichever suits you. Both do exactly the same thing.',
      ar: 'اسحب القطعة، أو اخترها واستعمل هذه الأسهم — أيّهما شئت. وكلاهما يؤدّي الغرض نفسه تماماً.',
    },
    /*
     * ⚠ THE ONE THAT MATTERS. Stated as an instruction to NOT move, because the
     * instinctive first move is always the blocker in front of the goal.
     */
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: 'Now the habit worth having, and it happens before you touch anything. Find what is blocking the way out. Then find what is blocking THAT. Keep going until you reach a piece that can actually move.',
      ar: 'والآن العادة الجديرة بأن تملكها، وهي تسبق أن تلمس شيئاً. اعرف ما يسدّ الطريق إلى الخارج. ثم اعرف ما يسدّ عليه هو. وامضِ كذلك حتى تبلغ قطعة تستطيع التحرّك فعلاً.',
    },
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: 'That last piece is your first move — and it is usually nowhere near the exit. Shoving the obvious blocker first is what builds the jam you then cannot undo.',
      ar: 'وتلك القطعة الأخيرة هي حركتك الأولى — وهي غالباً بعيدة عن المخرج. ودفعُ الساتر الظاهر أوّلاً هو ما يصنع الانحشار الذي لا تستطيع فكّه بعدُ.',
    },
    {
      point: '[data-coach="time"]',
      awaitTap: false,
      en: 'This clock costs you a life if it runs out, not the run. So there is room to sit and look.',
      ar: 'وهذه الساعة إن نفدت كلّفتك حياةً لا المحاولة كلّها. فثمّة متّسع لأن تجلس وتنظر.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'And looking is cheaper than it feels. A minute spent tracing the chain beats six moves that make the board worse — moves cannot be taken back.',
      ar: 'والنظر أقلّ كلفةً ممّا يبدو. فدقيقةٌ في تتبّع السلسلة خيرٌ من ستّ حركات تزيد اللوح سوءاً — فالحركات لا تُستردّ.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'It grows by adding pieces and by making that chain longer, so the boards do not get faster — they get deeper. If you are stuck, you have almost always mis-traced the chain rather than run out of ideas. Your turn.',
      ar: 'وهي تشتدّ بزيادة القطع وبإطالة تلك السلسلة، فاللوحات لا تصير أسرع — بل أعمق. وإن استعصى عليك الأمر، فأنت في الغالب أخطأت تتبّع السلسلة لا أنك نفدت من الحيل. دورك.',
    },
  ],
};

export default RUSH_HOUR_COACH;
