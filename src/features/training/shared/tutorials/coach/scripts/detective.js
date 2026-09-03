/*
 * Detective's coach script (COACH-PLAN.md Phase 2).
 *
 * ⚠ THE CONSTRUCT IS DEDUCTION FROM A GUARANTEED PREMISE, AND THE PREMISE IS THE
 * PART PLAYERS SKIP. Every case opens with a rule — "exactly one of them is
 * telling the truth", "the thief always lies" — and that rule is the only thing
 * on screen that is certainly true. Players who read the statements first treat
 * them as evidence, get contradictory testimony, and conclude the case is
 * unfair. Nothing can be worked out without the rule; with it, every case has a
 * mechanical method.
 *
 * So step 1 is the rule and step 2 is the method, stated as a procedure the
 * player can actually run: assume, check, discard. That is teachable in a
 * sentence and is what separates solving from guessing here.
 *
 * ⚠ THE GESTURE ALSO HAS TO BE TAUGHT, because this game deliberately gives its
 * scored action a heavier one. Tapping a card cycles a PRIVATE note; dragging
 * someone into the cell is the ANSWER, and on the three question kinds whose
 * answer is a person the cell IS the answer box — the suspect leaves the line-up
 * when they go in (one name, one place). A player who never discovers the drag
 * can mark cards all day and never answer.
 *
 * ⚠ NO AWAIT STEP. The obvious one would be "drag someone in", and it is a trap
 * twice over: the cell is only the answer box on person questions, so on a
 * "how many are lying" case the instruction would be wrong; and an await step
 * renders no Next button, so gating a first-run tutorial behind a drag would
 * strand exactly the players the tap-through fallback exists for.
 */
export const DETECTIVE_COACH = {
  id: 'detective@coach1',
  steps: [
    {
      point: '[data-coach="rule"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. Read this first, every time. The rule is the one thing here that is certainly TRUE — the suspects are under no such obligation.",
      ar: 'أنا د. كوكب. اقرأ هذا أوّلاً في كل مرة. فالقاعدة هي الشيء الوحيد هنا المؤكَّد صدقه — أما المشتبهون فلا يلزمهم ذلك.',
    },
    {
      point: '[data-coach="says"]',
      awaitTap: false,
      en: 'Each of them says one thing. Here is the method: take one suspect, ASSUME they did it, then check every statement against the rule. If that assumption forces a contradiction, they are innocent. The answer is the assumption left standing.',
      ar: 'ويقول كلٌّ منهم شيئاً واحداً. وإليك الطريقة: خذ مشتبهاً واحداً، وافترض أنه الفاعل، ثم قِس كل إفادة على القاعدة. فإن أدّى افتراضك إلى تناقض فهو بريء. والجواب هو الافتراض الذي يصمد.',
    },
    {
      point: '[data-coach="lineup"]',
      awaitTap: false,
      en: 'Tap a card to mark it — cleared, or suspected. That is only your notebook; it changes no score. It is here so you can park a conclusion instead of carrying it in your head.',
      ar: 'المس البطاقة لتضع عليها علامة — بريء أو مشتبه. وهذا دفترك وحدك؛ لا يغيّر نتيجة. وُجد لتضع فيه استنتاجاً بدل أن تحمله في رأسك.',
    },
    {
      point: '[data-coach="lineup"]',
      awaitTap: false,
      en: 'And when you are sure, DRAG them into the cell — that is your answer, not a note, which is why it costs a bigger gesture. Drag them back out if you change your mind. Read the question each time, though: it is not always who did it. Your turn.',
      ar: 'وإذا تيقّنت، فاسحبه إلى الزنزانة — فذاك جوابك لا ملاحظتك، ولهذا كلّفك حركة أكبر. واسحبه خارجاً إن غيّرت رأيك. لكن اقرأ السؤال في كل مرة: فليس دائماً «من الفاعل». دورك.',
    },
  ],
};

export default DETECTIVE_COACH;
