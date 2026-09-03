/*
 * Word Maze's coach script.
 *
 * ⚠ THE CONTROLS ARE THE WHOLE PROBLEM HERE, not the construct. There is no
 * Submit button — you lift your finger — and nothing on screen says so. A player
 * who traces a perfectly good word and then hunts for a button has been failed
 * by the interface, not by their vocabulary. So this lesson spends more of
 * itself on the gesture than any other in the platform, and that is correct: a
 * game whose input is undiscoverable does not get to measure anything.
 *
 * ⚠ AND THE DICTIONARY RULE HAS TO BE STATED, because a rejection with no
 * explanation reads as a bug. Short words validate against a hand-authored list
 * (444 three-letter + 1,527 four-letter, see validate:wordmaze) precisely
 * because the unabridged corpus is mostly abbreviations at that length.
 *
 * ── 2026-09-03: four steps became eight, on the spine in COACH-PLAN.md ──
 * The old step 2 carried the lift-to-submit rule AND the whole tap alternative
 * in one sentence, which is two different input methods in one breath.
 *
 * ⚠ NO AWAIT STEP: no `satisfiedFor` predicate on this game.
 */
export const WORDLE_COACH = {
  id: 'wordle@coach2',
  steps: [
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. Spell a word by dragging through letters that touch — sideways, up and down, or corner to corner.",
      ar: 'أنا د. كوكب. اكتب كلمة بسحب إصبعك عبر حروف متلاصقة — أفقيّاً أو رأسيّاً أو قُطريّاً.',
    },
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: 'The path has to stay connected the whole way. You cannot jump a gap, and you cannot use the same tile twice in one word.',
      ar: 'ويجب أن يبقى المسار متّصلاً إلى آخره. فلا تقفز فجوةً، ولا تستعمل البلاطة نفسها مرّتين في كلمة واحدة.',
    },
    /*
     * ⚠ THE ONE THAT MATTERS, and it is not a strategy — it is the fact that the
     * input has no visible affordance at all.
     */
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: 'There is no Submit button, on purpose. LIFT your finger to send the word — that is the whole gesture.',
      ar: 'ولا يوجد زرّ إرسال، عن قصد. ارفع إصبعك لإرسال الكلمة — وهذه هي الحركة كلّها.',
    },
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: 'If you would rather tap than drag, you can: tap the letters one at a time, then tap the last one twice to send. Both routes score identically.',
      ar: 'وإن كنت تفضّل النقر على السحب فلك ذلك: انقر الحروف واحداً واحداً، ثم انقر الأخير مرّتين للإرسال. والطريقان يُحسبان سواءً.',
    },
    {
      point: '[data-coach="clear"]',
      awaitTap: false,
      en: 'Gone wrong halfway along a path? Clear it and start again. It costs nothing but the seconds — there is no penalty for a word you never sent.',
      ar: 'وإن أخطأت في منتصف المسار، فامسحه وابدأ من جديد. ولا يكلّفك ذلك إلا الثواني — فلا عقوبة على كلمة لم ترسلها.',
    },
    {
      point: '[data-coach="rules"]',
      awaitTap: false,
      en: 'This says how long a word has to be and how many you need to finish.',
      ar: 'وهذا يبيّن كم يجب أن تطول الكلمة، وكم كلمة تحتاج لتُنهي.',
    },
    {
      point: '[data-coach="rules"]',
      awaitTap: false,
      en: 'Real words only. I keep a hand-checked list for the short ones, so odd letter runs and abbreviations get turned down — if a word you are sure of is refused, that is the list being strict, not you being wrong.',
      ar: 'وكلمات حقيقيّة فقط. فعندي للقصيرة قائمة مراجَعة يدويّاً، فتُردّ الحروف الغريبة والاختصارات — فإن رُدّت كلمة أنت واثق منها، فتلك صرامة القائمة لا خطأٌ منك.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'One habit beats hunting: start from a letter that begins a lot of words and look at what it touches, rather than looking for a word and then trying to find a path for it. The grid decides what is possible. Your turn.',
      ar: 'وعادةٌ واحدة خيرٌ من الاصطياد: ابدأ من حرفٍ تُستهلّ به كلمات كثيرة وانظر إلى ما يلامسه، بدل أن تبحث عن كلمة ثم تلتمس لها مساراً. فالشبكة هي التي تقرّر ما يمكن. دورك.',
    },
  ],
};

export default WORDLE_COACH;
