/*
 * Cancellation's coach script — Dr Kawkab's four lines, lifted out of
 * CancelTaskCoach.jsx unchanged (2026-09-03, COACH-PLAN.md Phase 0).
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
 * `point`    — 'target' puts the hand on a live target, 'decoy' on a non-target,
 *              null parks the bubble low and centred with no hand.
 * `awaitTap` — advance when the player actually clears that shape (no Next
 *              button). Never on the last step: see audit:coach.
 */
export const CANCEL_TASK_COACH = {
  id: 'cancel-task@coach1',
  steps: [
    {
      point: null,
      awaitTap: false,
      en: "I'm Dr Kawkab. The shape you are hunting is up in the bar — take it in first.",
      ar: 'أنا د. كوكب. الشكل الذي تبحث عنه في الشريط بالأعلى — تأمّله أوّلًا.',
    },
    {
      point: 'target',
      awaitTap: true,
      en: 'There it is on the board. Tap it.',
      ar: 'ها هو على اللوح. اضغط عليه.',
    },
    /*
     * The lesson the old tutorial never taught. Everything before this is
     * "find the thing"; the game is actually "find the thing AMONG things that
     * look like it".
     *
     * ⚠ THE COPY MUST BE TRUE AT LEVEL ONE. The first draft said "close, but
     * not it" — and on an early board it was pointing at a crystal while the
     * target was a planet, which is not close at all. Feature interference and
     * conjunction only climb later (see focusQuestData), so the line has to be
     * accurate now AND warn about what is coming.
     */
    {
      point: 'decoy',
      awaitTap: false,
      en: 'Now the hard part. This is not your shape — and anything that is not your shape is a decoy. Later they start looking almost right.',
      ar: 'الآن الجزء الصعب. هذا ليس شكلك — وكل ما ليس شكلك فهو خدعة. لاحقًا تبدأ تشبهه كثيرًا.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'That is the whole game: every match, none of the look-alikes, before the clock runs out. Your turn.',
      ar: 'هذه هي اللعبة كلّها: كل المطابقات، ولا شيء من المشابهات، قبل انتهاء الوقت. دورك.',
    },
  ],
};

export default CANCEL_TASK_COACH;
