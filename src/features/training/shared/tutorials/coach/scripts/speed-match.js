/*
 * Speed Match's coach script.
 *
 * ⚠ THE CONSTRUCT IS LOOK-UP SPEED, NOT MEMORY, and a player who does not know
 * that will try to learn the key — which is both impossible (it is reshuffled
 * every round) and the wrong task. Being told outright not to memorise it is
 * what turns a frustrating game into the one it is.
 *
 * ⚠ AND THE TIME BANK IS A MECHANIC, NOT A COUNTDOWN. It drains continuously and
 * every correct answer pours some back, so the run lasts exactly as long as the
 * player keeps answering. Read as an ordinary timer it produces panic-rushing,
 * which costs accuracy, which costs time — the opposite of the right play.
 *
 * ── 2026-09-03: four steps became eight, on the spine in COACH-PLAN.md ──
 * The old last step carried the bank, the refill, the rhythm advice and the
 * sign-off in one paragraph. Split, so the rhythm point is not the fourth
 * clause of a sentence about something else.
 */
export const SPEED_MATCH_COACH = {
  id: 'speed-match@coach2',
  steps: [
    {
      point: '[data-coach="legend"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. This key pairs every symbol with a number, and it is on screen the whole time.",
      ar: 'أنا د. كوكب. هذا المفتاح يقرن كل رمز برقم، وهو أمامك طوال الوقت.',
    },
    /*
     * ⚠ THE ONE THAT MATTERS, and it has to come before the player has spent a
     * round trying to do the wrong thing.
     */
    {
      point: '[data-coach="legend"]',
      awaitTap: false,
      en: 'Do not try to memorise it. It is reshuffled every round, so memorising is wasted work — and looking things up quickly IS the skill I am measuring.',
      ar: 'ولا تحاول حفظه. فهو يُخلط في كل جولة، فالحفظ عملٌ ضائع — والبحث السريع هو نفسه المهارة التي أقيسها.',
    },
    {
      point: '[data-coach="card"]',
      awaitTap: false,
      en: 'A symbol appears here. Find it in the key, and read off the number beside it.',
      ar: 'يظهر رمز هنا. ابحث عنه في المفتاح، واقرأ الرقم الذي بجانبه.',
    },
    {
      point: '[data-coach="pad"]',
      awaitTap: true,
      en: 'Now tap that number. Go ahead — this one counts.',
      ar: 'والآن المس ذلك الرقم. تفضّل — وهذه محاولة محسوبة.',
    },
    {
      point: '[data-coach="bank"]',
      awaitTap: false,
      en: 'This is your time, and it is draining right now. It is not a countdown to the end of a round — it is the run itself.',
      ar: 'وهذا وقتك، وهو ينفد الآن. وليس عدّاً تنازليّاً إلى نهاية جولة — بل هو المحاولة نفسها.',
    },
    {
      point: '[data-coach="bank"]',
      awaitTap: false,
      en: 'Every right answer pours some back in. So the run lasts exactly as long as you keep answering correctly, and a wrong answer costs you twice — no refill, and the time you spent on it.',
      ar: 'وكل إجابة صحيحة تعيد إليه شيئاً. فتدوم المحاولة ما دمت تصيب، والخطأ يكلّفك مرّتين — لا إعادةَ فيه، ويذهب معه ما أنفقته من وقت.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'Which is why hurrying is the mistake. A steady rhythm you can actually hold beats bursts of speed with stalls between them — the stalls cost more than the bursts win.',
      ar: 'ولهذا كانت العجلة هي الخطأ. فإيقاعٌ ثابت تقدر على الاستمرار فيه خيرٌ من سرعةٍ متقطّعة يتخلّلها التوقّف — إذ يكلّفك التوقّف أكثر ممّا تكسبه السرعة.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'One habit is worth building: after a few rounds your eye starts going straight to the right row without reading the others. Let that happen instead of forcing it — it is the whole improvement. Your turn.',
      ar: 'وثمّة عادة جديرة بأن تبنيها: فبعد جولات قليلة تبدأ عينك تقصد الصفّ الصحيح دون أن تقرأ سواه. فدع ذلك يحدث ولا تُكرهه — فهو التحسّن كلّه. دورك.',
    },
  ],
};

export default SPEED_MATCH_COACH;
