/*
 * Trivia's coach script (COACH-PLAN.md Phase 1).
 *
 * ⚠ THE CONSTRUCT IS AN ADAPTIVE STAIRCASE, AND THAT CHANGES WHAT A WRONG
 * ANSWER MEANS. This game climbs: every correct answer makes the next question
 * harder, so the run is designed to end in a question you cannot answer. A
 * player who does not know that reads their last three wrong answers as failure
 * and concludes they are bad at general knowledge — when in fact being wrong at
 * the top is the measurement working exactly as intended.
 *
 * Nothing on screen says this. The stars change, the questions get harder, and
 * the player is left to infer it.
 *
 * ⚠ IT ALSO HAS TO POINT AT THE FACT. This is the education app's one game where
 * the payload is the thing you learn rather than the score, and the fact box
 * appears below the fold of attention right when the player is looking at
 * whether they got it right.
 */
export const TRIVIA_COACH = {
  id: 'trivia@coach1',
  steps: [
    {
      point: '[data-coach="stairs"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. This is a climb, not a quiz. Every answer you get right makes the next question harder — so the run is MEANT to end somewhere you cannot reach.",
      ar: 'أنا د. كوكب. هذه رحلة صعود لا اختبار. فكل إجابة صحيحة تجعل السؤال التالي أصعب — والمحاولة يُقصد بها أن تنتهي عند حدٍّ لا تبلغه.',
    },
    {
      point: '[data-coach="stars"]',
      awaitTap: false,
      en: 'The stars say how hard THIS question is. Watch them rise as you climb — that is your level being found, and finding it is the whole point.',
      ar: 'والنجوم تقول كم هذا السؤال صعب. راقبها ترتفع كلما صعدت — فذلك مستواك يتحدّد، وتحديده هو الغاية كلّها.',
    },
    {
      point: '[data-coach="options"]',
      awaitTap: true,
      en: 'Answer this one. A wrong answer costs a heart, not the run — you have three, and nobody is expected to keep all of them.',
      ar: 'أجب عن هذا. والخطأ يكلّفك قلباً لا المحاولة كلّها — لديك ثلاثة، ولا يُنتظر منك أن تحتفظ بها جميعاً.',
    },
    {
      point: '[data-coach="stairs"]',
      awaitTap: false,
      en: 'Right or wrong, you get the fact — that is the part worth keeping. Climb until you run out, then read what you did not know. Your turn.',
      ar: 'وصواباً كان أم خطأً، تحصل على المعلومة — وهي الجزء الجدير بأن يبقى معك. اصعد حتى تنفد محاولاتك، ثم اقرأ ما لم تكن تعرفه. دورك.',
    },
  ],
};

export default TRIVIA_COACH;
