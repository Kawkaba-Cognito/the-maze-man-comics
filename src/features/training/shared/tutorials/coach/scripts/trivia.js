/*
 * Trivia's coach script.
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
 *
 * ── 2026-09-03: four steps became eight, on the spine in COACH-PLAN.md ──
 * "The run is MEANT to end somewhere you cannot reach" was doing the heaviest
 * emotional work in the lesson while sharing a step with the climb mechanic. It
 * now stands alone, and the guessing advice — genuinely useful on a staircase,
 * where a blind guess still costs a heart — has been added.
 */
export const TRIVIA_COACH = {
  id: 'trivia@coach2',
  steps: [
    {
      point: '[data-coach="stairs"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. This is a climb, not a quiz. Every answer you get right makes the next question harder.",
      ar: 'أنا د. كوكب. هذه رحلة صعود لا اختبار. فكل إجابة صحيحة تجعل السؤال التالي أصعب.',
    },
    /*
     * ⚠ THE ONE THAT MATTERS, and it is about how the ending will FEEL rather
     * than about how the game works.
     */
    {
      point: '[data-coach="stairs"]',
      awaitTap: false,
      en: 'Which means the run is MEANT to end somewhere you cannot reach. Everybody stops. Where you stop is the answer I am looking for — it is not a mark against you.',
      ar: 'ومعنى ذلك أن المحاولة يُقصد بها أن تنتهي عند حدٍّ لا تبلغه. فالكلّ يقف. وموضع وقوفك هو الجواب الذي أبحث عنه — لا علامة عليك.',
    },
    {
      point: '[data-coach="stars"]',
      awaitTap: false,
      en: 'The stars say how hard THIS question is. Watch them rise as you climb — that is your level being found.',
      ar: 'والنجوم تقول كم هذا السؤال صعب. راقبها ترتفع كلما صعدت — فذلك مستواك يتحدّد.',
    },
    {
      point: '[data-coach="options"]',
      awaitTap: true,
      en: 'Answer this one. A wrong answer costs a heart, not the run — you have three, and nobody is expected to keep all of them.',
      ar: 'أجب عن هذا. والخطأ يكلّفك قلباً لا المحاولة كلّها — لديك ثلاثة، ولا يُنتظر منك أن تحتفظ بها جميعاً.',
    },
    {
      point: '[data-coach="options"]',
      awaitTap: false,
      en: 'And when you truly do not know, answer anyway. Skipping and guessing wrong cost you the same, so a guess is free — and you will surprise yourself more often than you expect.',
      ar: 'وإذا لم تعرف حقّاً فأجب على كل حال. فالتخطّي والخطأ يكلّفانك سواءً، فالحدس مجّاني — وستفاجئ نفسك أكثر ممّا تتوقّع.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'Right or wrong, you get the fact afterwards. That is the part worth keeping — the score is gone tomorrow and the fact is not.',
      ar: 'وصواباً كان أم خطأً، تنال المعلومة بعده. وهي الجزء الجدير بأن يبقى معك — فالنتيجة تذهب غداً والمعلومة لا تذهب.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'So read it even when you were right. Especially then — a question you guessed correctly is one you did not actually know.',
      ar: 'فاقرأها ولو كنت مصيباً. بل حينئذٍ خاصّة — فالسؤال الذي أصبته حدساً سؤالٌ لم تكن تعرفه.',
    },
    {
      point: '[data-coach="stairs"]',
      awaitTap: false,
      en: 'Climb until you run out, then read what you did not know. That is the whole game, and losing it well is the normal way to play it. Your turn.',
      ar: 'اصعد حتى تنفد محاولاتك، ثم اقرأ ما لم تكن تعرفه. هذه هي اللعبة كلّها، وحسن الخسارة فيها هو الوجه المعتاد للّعب. دورك.',
    },
  ],
};

export default TRIVIA_COACH;
