/*
 * Sort It Another Way's coach script.
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
 * validate:sort, which enumerates all ten possible 3–3 splits of every set).
 * Players arriving from that genre assume they are guessing at something. They
 * are not, and being told so changes how they play.
 *
 * ── 2026-09-03: three steps became eight, on the spine in COACH-PLAN.md ──
 * The old final step carried the second-sort task, the reason it is hard AND the
 * "that is the whole game" sign-off in one paragraph. The dimensions to look
 * along — the single most useful practical hint in this game — were not
 * mentioned at all.
 */
export const SORT_SHIFT_COACH = {
  id: 'sort-shift@coach2',
  steps: [
    {
      point: '[data-coach="deck"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. Six cards. Split them three and three, any way that is genuinely true of all three.",
      ar: 'أنا د. كوكب. ستّ بطاقات. قسّمها ثلاثاً وثلاثاً، بأيّ طريقة تصحّ على الثلاث فعلاً.',
    },
    {
      point: '[data-coach="deck"]',
      awaitTap: false,
      en: 'There is no hidden answer I am waiting for. If a split is true, I accept it — I checked every possible one of them before you got here.',
      ar: 'ولا يوجد جواب خفيّ أنتظره منك. فإن صحّ التقسيم قبلته — وقد راجعتُ كلّ تقسيمٍ ممكنٍ قبل أن تصل إلى هنا.',
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
      en: 'Now the real task: the SAME six cards, split a different way. That first one was free — everybody finds it, because it is whatever you happened to be looking at.',
      ar: 'والآن المهمّة الحقيقيّة: البطاقات الستّ نفسها، مقسّمة بطريقة أخرى. وذلك الأوّل كان مجّاناً — يجده الكلّ، لأنه ما وقع عليه نظرك مصادفةً.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'And the idea that just worked is now the thing in your way. It will keep offering itself, and every time you look at the cards you will see it again first.',
      ar: 'والفكرة التي نجحت للتوّ صارت الآن ما يعيقك. وستظلّ تعرض نفسها عليك، وكلما نظرت إلى البطاقات رأيتها أوّلاً من جديد.',
    },
    {
      point: '[data-coach="deck"]',
      awaitTap: false,
      en: 'So name the dimension you just used — colour, say — and then deliberately look along a different one. Shape. Size. Number. What the thing is for. Where you would find it.',
      ar: 'فسمِّ البُعد الذي استعملته للتوّ — اللون مثلاً — ثم انظر عامداً على غيره. الشكل. الحجم. العدد. ما الشيء له. وأين تجده.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'Feeling stuck here is not you running out of ideas. It is a rule that is still switched on — and switching one off deliberately is a different act from thinking harder.',
      ar: 'وشعورك بالجمود هنا ليس نفاد الحيل عندك. بل هي قاعدة ما زالت مشتعلة — وإطفاؤها عامداً فعلٌ غير أن تجهد التفكير.',
    },
    {
      point: '[data-coach="rules"]',
      awaitTap: false,
      en: 'That is the whole game, and it is why the third sort is worth more than the first. Put the last idea down, then look again. Your turn.',
      ar: 'وهذه هي اللعبة كلّها، ولهذا كان التقسيم الثالث أثمن من الأوّل. ضع الفكرة الأخيرة جانباً ثم انظر من جديد. دورك.',
    },
  ],
};

export default SORT_SHIFT_COACH;
