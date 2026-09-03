/*
 * Math Gates' coach script (COACH-PLAN.md Phase 3).
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
 * ⚠ NO AWAIT STEP: the simulation is held while the lesson is open, so no gate
 * is approaching to choose between.
 */
export const MATH_GATES_COACH = {
  id: 'math-gates@coach1',
  steps: [
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. Two gates ahead, each with a sum on it. Steer through the one that is WORTH MORE — that is the whole instruction.",
      ar: 'أنا د. كوكب. بوّابتان أمامك، على كلٍّ منهما عملية حسابية. اعبر من التي قيمتها أكبر — وهذه هي التعليمات كلّها.',
    },
    /*
     * ⚠ THE ONE THAT MATTERS. Players default to evaluating both sides; saying
     * "be quick" would not help, because they are already trying to be quick at
     * the expensive method.
     */
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: 'Do not work both sums out. You never need the answers — only which is bigger, and that is usually obvious long before either is solved. Compare, do not calculate.',
      ar: 'ولا تحسب العمليّتين. فأنت لا تحتاج الجوابين قطّ — بل أيّهما أكبر فحسب، وذلك يتّضح غالباً قبل أن تُحلّ أيّ منهما. قارِن ولا تحسب.',
    },
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: 'The gates keep coming and they do not wait. Choose early, while there is still room to move — a fast good-enough decision beats a slow certain one here. Your turn.',
      ar: 'والبوّابات تتوالى ولا تنتظر. فاختر مبكّراً ما دام في المجال متّسع — فقرارٌ سريع يكفي خيرٌ هنا من قرارٍ بطيء متيقَّن. دورك.',
    },
  ],
};

export default MATH_GATES_COACH;
