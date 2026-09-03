/*
 * Math Gates' coach script.
 *
 * ⚠ THE CONSTRUCT IS PROCESSING SPEED, NOT ARITHMETIC — and the strategy that
 * separates the two is: do NOT solve both gates. You only need to know which
 * side is bigger, and comparing is far cheaper than evaluating. A player who
 * computes both expressions and then compares is doing two or three times the
 * work for the same answer, and will read the resulting slowness as being bad at
 * mental maths rather than as an avoidable strategy cost.
 *
 * This matters for the domain's validity too: if everyone brute-forces, the game
 * measures arithmetic fluency, which the speed domain already has in Speed
 * Match. Told to compare rather than solve, it measures decision speed.
 *
 * ── 2026-09-03: three steps became eight, on the spine in COACH-PLAN.md ──
 * The old lesson was three long paragraphs, all of which pointed at
 * `[data-coach="board"]` — so the hand never moved for the whole lesson and sat
 * in the middle of a container indicating nothing (measured: a 0.08 hand-to-
 * target width ratio). Steps that are about pace, cost or progression rather
 * than about a thing on screen now carry `point: null`, which parks the hand
 * entirely instead of pretending to point.
 *
 * ⚠ NO AWAIT STEP: the simulation is held while the lesson is open, so no gate
 * is approaching to choose between, and there is no `satisfiedFor` predicate.
 */
export const MATH_GATES_COACH = {
  id: 'math-gates@coach2',
  steps: [
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. Two gates ahead, each with a sum written on it.",
      ar: 'أنا د. كوكب. بوّابتان أمامك، على كلٍّ منهما عمليّة حسابيّة.',
    },
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: 'Steer through the one that is worth MORE. That is the entire instruction — there is nothing else to learn here.',
      ar: 'اعبر من التي قيمتها أكبر. وهذه هي التعليمات كلّها — وليس هنا شيء آخر تتعلّمه.',
    },
    /*
     * ⚠ THE ONE THAT MATTERS. Players default to evaluating both sides; saying
     * "be quick" would not help, because they are already trying to be quick at
     * the expensive method.
     */
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: 'But do not work both sums out. You never need either answer — only which is bigger.',
      ar: 'لكن لا تحسب العمليّتين. فأنت لا تحتاج أيّاً من الجوابين — بل أيّهما أكبر فحسب.',
    },
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: 'And that is usually obvious long before either is solved. Nine times something against two times something — you knew, and you did not multiply. Compare, do not calculate.',
      ar: 'وذلك يتّضح غالباً قبل أن تُحلّ أيٌّ منهما. تسعة في شيء مقابل اثنين في شيء — قد عرفت، ولم تضرب. قارِن ولا تحسب.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'So the mistake here is not being bad at arithmetic. It is being thorough: solving both sides carefully is two or three times the work for exactly the same answer.',
      ar: 'فالخطأ هنا ليس ضعفاً في الحساب. بل هو الاستقصاء: فحلّ الطرفين بتأنٍّ يكلّفك ضعفي العمل أو ثلاثة أضعافه من أجل الجواب نفسه.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'The gates keep coming and they do not wait for you. Choose early, while there is still room to move across — a fast good-enough decision beats a slow certain one here.',
      ar: 'والبوّابات تتوالى ولا تنتظرك. فاختر مبكّراً ما دام في المجال متّسع للانتقال — فقرارٌ سريع يكفي خيرٌ هنا من قرارٍ بطيء متيقَّن.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'A wrong gate is not the end of the run, so it is never worth freezing over one. Guessing and moving on costs you less than stalling in the middle.',
      ar: 'والبوّابة الخاطئة ليست نهاية المحاولة، فلا يستحقّ الأمر أن تتجمّد عندها قطّ. فالحدس والمضيّ أقلّ كلفة عليك من التوقّف في المنتصف.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'As you climb, the sums get closer together — which is exactly when comparing stops being obvious and you have to look properly. Save your effort for those, and spend nothing on the easy ones. Your turn.',
      ar: 'وكلما صعدت تقاربت العمليّتان — وذلك بعينه حين تكفّ المقارنة عن أن تكون بيّنة فيلزمك النظر حقاً. فادّخر جهدك لتلك، ولا تُنفق منه شيئاً على السهلة. دورك.',
    },
  ],
};

export default MATH_GATES_COACH;
