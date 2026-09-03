/*
 * Word Maze's coach script (COACH-PLAN.md Phase 2).
 *
 * ⚠ THE CONTROL IS THE THING NOBODY GUESSES HERE, and that is unusual in this
 * set — most of these scripts fight to teach a construct rather than a gesture.
 * But this board has no Submit button by design: a traced path commits when you
 * LIFT YOUR FINGER, or when you tap the last letter again. Both routes are
 * deliberate (the tap route is what keeps the game playable without a pointer
 * drag), and neither is discoverable. A player who traces a correct word and
 * then hunts for a button concludes the board is broken.
 *
 * ⚠ THE OTHER HALF IS THAT THE DICTIONARY IS CURATED. Short words validate
 * against an authored list, not the unabridged corpus, because that corpus's
 * 3–4 letter tiers are mostly abbreviations — this is why `sart` is refused.
 * Players who assume any letter run counts read a refusal as a bug rather than
 * as the game holding a standard.
 *
 * ⚠ NO AWAIT STEP. The obvious one is "trace a word", and it fails the
 * reachability rule in DomCoach: an await step renders no Next button, and a
 * beginner who cannot yet find a word on the board would be stranded in a
 * first-run tutorial with only Skip and Escape.
 */
export const WORDLE_COACH = {
  id: 'wordle@coach1',
  steps: [
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. Spell a word by dragging through letters that touch — sideways, up and down, or corner to corner. The path has to stay connected.",
      ar: 'أنا د. كوكب. اكتب كلمة بسحب إصبعك عبر حروف متلاصقة — أفقياً أو رأسياً أو قُطرياً. ويجب أن يبقى المسار متّصلاً.',
    },
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: 'There is no Submit button, on purpose. LIFT your finger to send the word — or, if you would rather tap than drag, tap the letters one by one and tap the last one twice.',
      ar: 'ولا يوجد زرّ إرسال، عن قصد. ارفع إصبعك لإرسال الكلمة — أو إن كنت تفضّل النقر على السحب، فانقر الحروف واحداً واحداً ثم انقر الأخير مرّتين.',
    },
    {
      point: '[data-coach="rules"]',
      awaitTap: false,
      en: 'This says how long a word must be and how many you need. Real words only — I keep a hand-checked list, so odd letter runs and abbreviations will be turned down.',
      ar: 'وهذا يبيّن كم يجب أن تطول الكلمة وكم كلمة تحتاج. وكلمات حقيقية فقط — فعندي قائمة مراجَعة يدوياً، وستُرفض الحروف الغريبة والاختصارات.',
    },
    {
      point: '[data-coach="clear"]',
      awaitTap: false,
      en: 'Gone wrong mid-path? Clear it and start again — it costs nothing but the seconds. Your turn.',
      ar: 'وإن أخطأت في منتصف المسار، فامسحه وابدأ من جديد — ولا يكلّفك ذلك إلا الثواني. دورك.',
    },
  ],
};

export default WORDLE_COACH;
