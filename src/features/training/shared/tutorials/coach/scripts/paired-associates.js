/*
 * Pair Match's coach script.
 *
 * ⚠ THE LESSON IS AN ENCODING STRATEGY, AND IT IS THE WHOLE GAME. Paired-
 * associate learning separates people almost entirely on whether they build an
 * interactive image or rehearse the words. Rehearsal feels like effort and
 * remembers very little; a silly picture takes less work and holds. A player
 * left to discover this alone will rehearse, because rehearsal is what "trying
 * to remember" feels like from the inside.
 *
 * ── 2026-09-03: three steps became eight, on the spine in COACH-PLAN.md ──
 * The old middle step was one long paragraph carrying the strategy, the reason,
 * the "sillier is better" refinement and the criticism of rehearsal. That is
 * four ideas in a block a nervous first-time player reads once. Each now has its
 * own step, and the strategy is DEMONSTRATED with a worked example rather than
 * only described — the worked-example effect is the most robust finding in
 * cognitive-load research and this lesson had no example at all.
 *
 * ⚠ NO AWAIT STEP: no `satisfiedFor` predicate, and the lesson runs before the
 * boxes open, so there is nothing on the board to act on yet.
 */
export const PAIRED_ASSOCIATES_COACH = {
  id: 'paired-associates@coach2',
  steps: [
    {
      point: '[data-coach="phase"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. In a moment the boxes open one at a time and show you what lives inside each one.",
      ar: 'أنا د. كوكب. بعد لحظة تُفتح الصناديق واحداً تلو الآخر لتريك ما يسكن كلاً منها.',
    },
    {
      point: '[data-coach="boxes"]',
      awaitTap: false,
      en: 'Watch, and do not rush. Nothing is being timed while they are open — the only thing that matters is what you do with each pair while you can see it.',
      ar: 'راقب ولا تستعجل. فلا شيء يُقاس بالوقت وهي مفتوحة — وإنما يهمّ ما تصنعه بكل قرين ما دمت تراه.',
    },
    /*
     * ⚠ THE ONE THAT MATTERS, and the reason this game separates people at all.
     */
    {
      point: null,
      awaitTap: false,
      en: 'Here is the whole difference, and it is not effort: do NOT repeat the names to yourself. Make a picture instead — the object doing something to its box.',
      ar: 'وإليك الفارق كلّه، وليس هو المجهود: لا تكرّر الأسماء في نفسك. بل اصنع صورة — الشيء يفعل شيئاً بصندوقه.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'Say a key and the third box: do not think "key, three". See the key kicking the door of box three until it splinters. That is all a picture has to be.',
      ar: 'خذ مفتاحاً والصندوق الثالث: لا تقل في نفسك «مفتاح، ثلاثة». بل انظر إلى المفتاح يركل باب الصندوق الثالث حتى يتشظّى. وهذا كل ما ينبغي أن تكونه الصورة.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'The sillier and the more violent, the better it sticks. A calm picture of a key resting on a box is worth almost nothing — nothing happened in it.',
      ar: 'وكلما كانت الصورة أطرف وأعنف رسخت أكثر. أما صورة هادئة لمفتاح راقد على صندوق فلا تكاد تساوي شيئاً — إذ لم يحدث فيها شيء.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'Repeating a word over and over feels like hard work, which is exactly why people do it. It remembers almost nothing. You will feel like you are cheating by making pictures; you are not.',
      ar: 'وترديد الكلمة مرّة بعد مرّة يبدو عملاً شاقّاً، ولهذا بالذات يفعله الناس. وهو لا يُبقي شيئاً تقريباً. وستشعر أنك تحتال حين تصنع الصور؛ ولست تحتال.',
    },
    {
      point: '[data-coach="phase"]',
      awaitTap: false,
      en: 'Then I show you one object and you tell me its box. If you built a picture, you will not retrieve it — it simply arrives.',
      ar: 'ثم أعرض عليك شيئاً واحداً فتخبرني بصندوقه. فإن كنت قد بنيت صورة، فلن تستدعيها — بل تأتيك من تلقائها.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'It grows by adding pairs, so the strategy matters more the further you climb, not less. Your turn.',
      ar: 'وهي تشتدّ بزيادة الأقران، فتزداد الحيلة أهمّية كلما صعدت لا العكس. دورك.',
    },
  ],
};

export default PAIRED_ASSOCIATES_COACH;
