/*
 * Target Tracking's coach script.
 *
 * ⚠ THE CONSTRUCT IS HOW MANY THINGS YOU CAN HOLD AT ONCE, NOT HOW WELL YOU CAN
 * FOLLOW ONE. Multiple-object tracking measures a capacity, and the strategy
 * that reveals it — a still gaze at the centre, holding the set loosely — is the
 * opposite of what effort feels like. A player who chases each dot in turn is
 * working harder and scoring worse, and has no way to discover that alone.
 *
 * ── 2026-09-03: three steps became eight, on the spine in COACH-PLAN.md ──
 * The old lesson named the strategy and stopped. It never said what a wrong
 * answer means here (nothing — reaching your limit IS the measurement), never
 * said what changes as you climb, and packed the whole gaze instruction and the
 * error into one paragraph. One idea per step, so each has somewhere to land.
 *
 * ⚠ NO AWAIT STEP: this game has no `satisfiedFor` predicate, and the lesson
 * runs before the dots have flashed, so there is nothing a player could do that
 * would advance it. An await step here would wait for something that cannot
 * happen — see the note in DomCoach.
 */
export const MOT_COACH = {
  id: 'mot@coach2',
  steps: [
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. Every dot on this field is identical. In a moment a few of them will flash — those few are yours.",
      ar: 'أنا د. كوكب. كل نقطة في هذا الميدان مطابقة لأختها. وبعد لحظة ستومض بعضها — تلك نقاطك.',
    },
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: 'Then the flashing stops, and nothing marks them again. They go back to looking exactly like the rest, and everything begins to move.',
      ar: 'ثم ينقطع الوميض، فلا يعود يميّزها شيء. تعود شبيهة بالبقيّة تماماً، ويبدأ كل شيء بالحركة.',
    },
    /*
     * ⚠ THE ONE THAT MATTERS. Phrased as an instruction about where to put the
     * EYES, because "pay attention to all of them" is what players already
     * think they are doing while they chase one.
     */
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: 'Here is the whole trick, and it is worth more than any effort: do not chase them with your eyes. Rest your gaze in the middle of the field and hold them all at once, loosely.',
      ar: 'وإليك الحيلة كلّها، وهي خير من كل مجهود: لا تطاردها بعينيك. أرِح نظرك في وسط الميدان، واحتفظ بها جميعاً معاً في غير شدّ.',
    },
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: 'The mistake to know about is the one that feels like trying harder. Following a single dot at a time is the fastest way to lose the others — and while you are doing it, it feels exactly like concentrating.',
      ar: 'والخطأ الذي ينبغي أن تعرفه هو ما يبدو لك اجتهاداً أكبر. فتتبّع نقطة واحدة في كل مرة أسرع طريق إلى فقدان البقيّة — وأنت في أثنائه تشعر أنك تركّز تماماً.',
    },
    {
      point: '[data-coach="instruction"]',
      awaitTap: false,
      en: 'When everything freezes, tap the ones that were yours. Take the moment you need — the clock is not running on this part.',
      ar: 'وحين يتجمّد كل شيء، المس ما كان لك. وخذ ما تحتاجه من الوقت — فالساعة لا تجري في هذا الجزء.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'Losing one or two is normal, and it is not a failure. I am looking for how many you can hold at once, which means the game is built to keep going until it finds the number where you start dropping them.',
      ar: 'وفقدان واحدة أو اثنتين أمر طبيعي، وليس إخفاقاً. فأنا أبحث عن عدد ما تستطيع حمله معاً، ولذلك بُنيت اللعبة لتمضي حتى تبلغ العدد الذي تبدأ عنده بإسقاطها.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'As you climb, three things change: more dots to hold, faster movement, and — the hard one — they start passing close to each other. Two dots crossing is where a set gets swapped without you noticing.',
      ar: 'وكلما صعدت تغيّرت ثلاثة أمور: نقاط أكثر تحملها، وحركة أسرع، والأصعب: أنها تبدأ تتقارب في مرورها. وتقاطع نقطتين هو الموضع الذي تُستبدل فيه المجموعة دون أن تشعر.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'So one last habit, and it survives the crossings: notice the SHAPE your dots make on the field — a triangle, a line — and keep that shape in mind as it stretches, instead of keeping four separate dots. Your turn.',
      ar: 'ولذلك عادة أخيرة تصمد عند التقاطع: لاحظ الشكل الذي ترسمه نقاطك في الميدان — مثلّثاً أو خطّاً — واحفظ ذلك الشكل في ذهنك وهو يتمدّد، بدل أن تحفظ أربع نقاط منفصلة. دورك.',
    },
  ],
};

export default MOT_COACH;
