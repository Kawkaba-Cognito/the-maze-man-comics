/*
 * Pair Match's coach script (COACH-PLAN.md Phase 1).
 *
 * ⚠ THE CONSTRUCT IS ASSOCIATIVE MEMORY, AND THE STRATEGY THAT WINS IT IS
 * TEACHABLE IN ONE SENTENCE — which is exactly why it belongs in a tutorial.
 * Paired-associate learning is the classic demonstration that ELABORATIVE
 * encoding beats rote rehearsal: a player who silently repeats "star, box three"
 * performs far worse than one who pictures the star doing something to the box.
 * Both feel like trying equally hard, so nobody discovers the difference by
 * playing more.
 *
 * This is the one script in the set that teaches a METHOD rather than a rule,
 * and it is defensible here precisely because the method is what the test
 * measures the absence of.
 *
 * ⚠ STEP 2 POINTS AT NOTHING ON PURPOSE. It is about what to do inside your own
 * head while the boxes open; there is no element on the board that means
 * "imagine". A null `point` parks the bubble low and centred and shows no hand,
 * which leaves the whole board visible while it is read.
 *
 * ⚠ NO AWAIT STEP: this lesson runs before the study sequence begins (the boxes
 * are a timed chain — see the hold in index.jsx), so there is nothing to tap.
 */
export const PAIRED_ASSOCIATES_COACH = {
  id: 'paired-associates@coach1',
  steps: [
    {
      point: '[data-coach="phase"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. In a moment the boxes open one at a time and show you what lives inside each one. Watch, do not rush.",
      ar: 'أنا د. كوكب. بعد لحظة تُفتح الصناديق واحداً تلو الآخر لتريك ما يسكن كلاً منها. راقب ولا تستعجل.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'Here is the trick, and it is the whole difference: do NOT repeat the names to yourself. Make a picture instead — the object doing something to its box. The sillier the picture, the better it sticks. Repeating a word feels like effort and remembers almost nothing.',
      ar: 'وإليك الحيلة، وهي الفارق كلّه: لا تكرّر الأسماء في نفسك. بل اصنع صورة — الشيء يفعل شيئاً بصندوقه. وكلما كانت الصورة أطرف، رسخت أكثر. أما ترديد الكلمة فيبدو مجهوداً ولا يُبقي شيئاً تقريباً.',
    },
    {
      point: '[data-coach="phase"]',
      awaitTap: false,
      en: 'Then I show you one object and you tell me its box. If you built a picture, it comes back on its own. Your turn.',
      ar: 'ثم أعرض عليك شيئاً واحداً فتخبرني بصندوقه. فإن كنت قد بنيت صورة، عادت إليك وحدها. دورك.',
    },
  ],
};

export default PAIRED_ASSOCIATES_COACH;
