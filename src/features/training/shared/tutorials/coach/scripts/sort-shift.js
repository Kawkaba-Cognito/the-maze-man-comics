/*
 * Sort It Another Way's coach script (COACH-PLAN.md Phase 1).
 *
 * ⚠ THE CONSTRUCT IS LETTING GO OF A RULE THAT WORKED. This is the D-KEFS free
 * sort: finding the FIRST split is not the task — anyone does that in a second,
 * because it is whatever you were already looking at. The measurement is the
 * second and third, where the dimension you just succeeded with has to be
 * actively abandoned. A player who is not told that plays it as "find the
 * grouping", gets one, and then feels stuck for reasons they cannot name.
 *
 * ⚠ IT MUST ALSO SAY THERE IS NO HIDDEN ANSWER. This game replaced Card Sort
 * precisely because a hidden rule punishes you for failing to read the game's
 * mind, and validity here is derived from the cards' own features (see
 * validate:sort, which enumerates all ten 3–3 splits). Players arriving from
 * that genre assume they are guessing at something. They are not.
 */
export const SORT_SHIFT_COACH = {
  id: 'sort-shift@coach1',
  steps: [
    {
      point: '[data-coach="deck"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. Six cards. Split them three and three — any way that is genuinely true of all three. There is no hidden answer I am waiting for.",
      ar: 'أنا د. كوكب. ستّ بطاقات. قسّمها ثلاثاً وثلاثاً — بأي طريقة تصحّ على الثلاث فعلاً. ولا يوجد جواب خفيّ أنتظره منك.',
    },
    {
      point: '[data-coach="deck"]',
      awaitTap: true,
      en: 'Tap three that share something, then Submit. Take whichever one you noticed first.',
      ar: 'المس ثلاثاً تجمعها صفة واحدة، ثم أرسِل. خذ أوّل ما لاحظته.',
    },
    /*
     * ⚠ THE ONE THAT MATTERS — and it is phrased as a warning about difficulty
     * rather than an instruction, because the player is about to feel stuck and
     * should know that is the game working, not them failing.
     */
    {
      point: '[data-coach="rules"]',
      awaitTap: false,
      en: 'Now the real task: the SAME six cards, split a different way. The idea that just worked is the one in your way — put it down and look again. That is the whole game. Your turn.',
      ar: 'والآن المهمة الحقيقية: البطاقات الستّ نفسها، مقسّمة بطريقة أخرى. والفكرة التي نجحت للتوّ هي ما يعيقك — ضعها جانباً وانظر من جديد. هذه هي اللعبة كلّها. دورك.',
    },
  ],
};

export default SORT_SHIFT_COACH;
