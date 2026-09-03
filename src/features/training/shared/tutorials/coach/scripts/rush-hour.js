/*
 * Block Escape's coach script (COACH-PLAN.md Phase 2).
 *
 * ⚠ THE CONSTRUCT IS PLANNING — LOOK-AHEAD BEFORE THE FIRST MOVE. This is a
 * sliding-block puzzle in the Rush Hour family, and the failure mode is
 * universal: players shove the blocker directly in front of the goal piece,
 * find it will not go, shove the next one, and end up in a jam they cannot read
 * a way out of. The pieces that need moving first are usually the ones NOT
 * touching the exit row.
 *
 * That single sentence is the difference between solving these and thrashing,
 * and it cannot be discovered by playing badly — thrashing produces a solved
 * board eventually on easy puzzles, which teaches the wrong lesson.
 *
 * ⚠ AND THE CLOCK MUST BE PUT IN ITS PLACE. Survival puts a per-puzzle timer on
 * a game whose correct play is to sit still and look. A player who does not know
 * the timer only costs a life — not the run — plays it as a speed game, which is
 * precisely the behaviour that loses.
 *
 * ⚠ NO AWAIT STEP: an await here would have to wait for a MOVE, and a beginner
 * staring at a jam is exactly who this lesson is for. Stranding them behind a
 * required move, with no Next button, is the reachability trap DomCoach warns
 * about.
 */
export const RUSH_HOUR_COACH = {
  id: 'rush-hour@coach1',
  steps: [
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. One piece has to reach the exit. Every piece slides only along its own length — the long ones never turn, and nothing jumps.",
      ar: 'أنا د. كوكب. قطعة واحدة عليها أن تبلغ المخرج. وكل قطعة تنزلق في اتجاه طولها وحده — فالطويلة لا تستدير، ولا شيء يقفز فوق شيء.',
    },
    /*
     * ⚠ THE ONE THAT MATTERS. Stated as a instruction to NOT move, because the
     * instinctive first move is always the blocker in front of the goal.
     */
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: 'Before you touch anything: find what is blocking the way out, then find what is blocking THAT. The piece you must move first is usually nowhere near the exit — and shoving the obvious blocker first is what builds the jam.',
      ar: 'وقبل أن تلمس شيئاً: اعرف ما يسدّ الطريق إلى الخارج، ثم اعرف ما يسدّ عليه هو. والقطعة التي يجب تحريكها أوّلاً غالباً ما تكون بعيدة عن المخرج — ودفع الساتر الظاهر أوّلاً هو ما يصنع الانحشار.',
    },
    {
      point: '[data-coach="nudge"]',
      awaitTap: false,
      en: 'Drag a piece, or select it and use these arrows — whichever suits you. Both do the same thing.',
      ar: 'اسحب القطعة، أو اخترها واستعمل هذه الأسهم — أيّهما شئت. وكلاهما يؤدّي الغرض نفسه.',
    },
    {
      point: '[data-coach="time"]',
      awaitTap: false,
      en: 'This clock costs you a life if it runs out, not the run. So think first — a minute spent looking beats six moves that make it worse. Your turn.',
      ar: 'وهذه الساعة إن نفدت كلّفتك حياةً لا المحاولة كلّها. ففكّر أوّلاً — فدقيقة في النظر خير من ستّ حركات تزيد الأمر سوءاً. دورك.',
    },
  ],
};

export default RUSH_HOUR_COACH;
