/*
 * Cancellation's coach script.
 *
 * ── 2026-09-03: FOUR STEPS BECAME EIGHT, ON THE SPINE IN COACH-PLAN.md ──
 * The old lesson was correct and too short: it named the construct (the decoy)
 * and skipped everything a first-time player still has to work out alone — what
 * makes a shape "yours", what a wrong tap costs, what ends the round, and how
 * to search a board rather than hunt at random. Each step here carries ONE idea,
 * which is the single most repeated finding in game-tutorial practice: stagger
 * the concepts, and give the player a chance to perform each one before adding
 * the next. Long steps are not more instruction — they are the same instruction
 * with the middle unread.
 *
 * ⚠ STEP 1 USED TO SAY "up in the bar" AND POINT AT NOTHING. On a phone the HUD
 * is a bar across the top; on a 1366px desktop it is a panel down the LEFT
 * side — so the one spatial instruction in the lesson was wrong on half the
 * devices, and there was no hand to correct it. It now points at the goal chip
 * itself and says nothing about where that chip lives.
 *
 * ⚠ EN AND AR SIT ON THE SAME STEP, NOT IN TWO PARALLEL ARRAYS. CLAUDE.md's
 * standing trap is that "a string change is two edits, and the second is the one
 * that gets missed" — the halves of a `UI` dict sit ~40 lines apart, so a
 * find-and-fix on the English leaves the Arabic stating something else. Here the
 * two languages are adjacent, and a length mismatch between them is not
 * expressible. `audit:coach` still asserts both are present and non-empty.
 *
 * ⚠ PLAIN `.js` WITH NO IMPORTS, ON PURPOSE. Gates run in plain Node, which
 * cannot parse `.jsx` at all and does not resolve extensionless paths. Every
 * coach script must stay loadable by `import()` from a `.mjs` gate — that is
 * what lets `audit:coach` check the real data instead of regexing source text.
 *
 * `point`    — 'target' puts the hand on a live target, 'decoy' on a non-target
 *              (and crosses the hand out), a `[data-coach="…"]` selector on a
 *              piece of chrome, null parks the bubble low and centred with no
 *              hand at all.
 * `awaitTap` — advance when the player actually clears that shape (no Next
 *              button). Never on the last step: see audit:coach.
 */
export const CANCEL_TASK_COACH = {
  id: 'cancel-task@coach2',
  steps: [
    {
      point: '[data-coach="goal"]',
      awaitTap: false,
      en: "I'm Dr Kawkab, and I'll stay out of your way after this. Start here: this little picture is the shape you are hunting.",
      ar: 'أنا د. كوكب، ولن أشغلك بعد هذا. ابدأ من هنا: هذه الصورة الصغيرة هي الشكل الذي تبحث عنه.',
    },
    {
      point: 'target',
      awaitTap: false,
      en: 'And there is one of them on the board. The SHAPE is the whole test — not the colour behind it, not how big it looks. Only the shape.',
      ar: 'وها هو واحد منها على اللوح. والشكل وحده هو الفيصل — لا اللون خلفه، ولا حجمه في عينك. الشكل فقط.',
    },
    {
      point: 'target',
      awaitTap: true,
      en: 'Tap it. Go ahead — the clock is held while I am talking, so this costs you nothing.',
      ar: 'اضغط عليه. تفضّل — فالساعة موقوفة ما دمت أتكلّم، وهذا لا يكلّفك شيئاً.',
    },
    /*
     * The lesson the ORIGINAL tutorial never taught, and still the hinge of the
     * whole thing: everything before this is "find the thing"; the game is
     * actually "find the thing AMONG things that look like it". Cancellation is
     * a test of SELECTIVE attention, so the lesson has to point at something and
     * say leave it alone.
     */
    {
      point: 'decoy',
      awaitTap: false,
      en: 'Now the part that is actually being measured. This one is NOT your shape. Leave it exactly where it is.',
      ar: 'والآن الجزء المقيس فعلاً. هذا ليس شكلك. اتركه في مكانه تماماً.',
    },
    /*
     * ⚠ THE COPY MUST BE TRUE AT LEVEL ONE. An early draft said "close, but not
     * it" — and on an early board it was pointing at a crystal while the target
     * was a planet, which is not close at all. Feature interference and
     * conjunction only climb later (see focusQuestData), so the line has to be
     * accurate now AND warn about what is coming.
     */
    {
      point: 'decoy',
      awaitTap: false,
      en: 'Right now the decoys are obvious. They will not stay that way — later they borrow your shape\'s colour, or its size, until the shape itself is the only thing left that tells them apart.',
      ar: 'والخُدَع الآن ظاهرة. ولن تبقى كذلك — فستستعير لاحقاً لون شكلك أو حجمه، حتى لا يبقى ما يميّزها إلا الشكل نفسه.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'So the mistake to know about is not being slow. It is tapping on a feeling of "close enough" — every wrong tap is counted, and in Survival a handful of them ends the round.',
      ar: 'فالخطأ الذي ينبغي أن تعرفه ليس البطء. بل أن تضغط على شعور بأنه «قريب بما يكفي» — فكل ضغطة خاطئة تُحسب، وفي وضع البقاء تنهي حفنةٌ منها الجولة.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'And the clock is what ends it the other way. You are not asked to be perfect — you are asked to keep being accurate while it drains.',
      ar: 'والساعة هي ما ينهيها من الجهة الأخرى. ولست مطالَباً بالكمال — بل بأن تظلّ مصيباً وهي تنفد.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'One last thing, and it is worth more than speed: sweep the board in a pattern — row by row, or column by column — instead of hunting wherever your eye lands. Random hunting re-checks the same corner three times and misses a whole edge. Your turn.',
      ar: 'وأمر أخير يفوق السرعة نفعاً: امسح اللوح على نسق — صفّاً صفّاً أو عموداً عموداً — بدل أن تصطاد حيث وقعت عينك. فالصيد العشوائي يعيد تفتيش الزاوية نفسها ثلاثاً ويغفل حافّة كاملة. دورك.',
    },
  ],
};

export default CANCEL_TASK_COACH;
