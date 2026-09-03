/*
 * Intercept (Rift Defense)'s coach script (COACH-PLAN.md Phase 3).
 *
 * ⚠ THIS GAME MEASURES THREE DIFFERENT THINGS, AND THE LESSON MUST KEEP THEM
 * APART — the same rule CLAUDE.md sets for its results screen. Striking inside
 * the tower's reach is reaction time; leaving the forbidden colour alone is
 * response INHIBITION; striking under the canopy where you believe a marcher
 * will be is prediction. Blur them into "tap the baddies fast" and the player
 * has no idea which of the three they are actually good at, which is the one
 * thing that stops this being a fourth reaction test in a domain that benched
 * Trail Making for exactly that.
 *
 * ⚠ THE INHIBITION RULE IS A PROHIBITION, SO STATE IT AS ONE. The HUD swatch
 * shows the FORBIDDEN colour, not the target — an earlier build showed the go
 * colour under the label "safe colour", which told players the thing to strike
 * was the thing to leave alone. The lesson names the swatch for what it is.
 *
 * ⚠ IT MUST NOT POINT AT THE SWATCH. The swatch only renders when the wave has
 * a no-go share, and early Survival waves have none — a hand pointing at nothing
 * while the text says "this swatch" would be worse than describing it. Both
 * mechanics are therefore introduced against the field, in words that stay true
 * whether or not this particular wave contains them.
 *
 * ⚠ NO AWAIT STEP: the wave is held while the lesson is open, so no marcher is
 * crossing the reach to strike.
 */
export const INTERCEPT_COACH = {
  id: 'intercept@coach1',
  steps: [
    {
      point: '[data-coach="field"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. An army walks the trail toward your gate. Your tower reaches only part of the path — strike a marcher while they are inside it, and they go down.",
      ar: 'أنا د. كوكب. جيش يسير على الدرب نحو بوّابتك. وبرجك لا يبلغ إلا جزءاً من الطريق — فاضرب المسير وهو داخل مداه يسقط.',
    },
    {
      point: '[data-coach="field"]',
      awaitTap: false,
      en: 'One colour is forbidden. When a wave has one, its colour sits in the bar above — and that is the colour to LEAVE ALONE, not the one to hit. Not striking is a real move here, and a harder one than striking.',
      ar: 'ولونٌ واحد محرَّم. فإذا حملت الموجة لوناً محرَّماً ظهر في الشريط أعلاه — وهو اللون الذي تتركه، لا الذي تضربه. والامتناع فعلٌ حقيقي هنا، وهو أشقّ من الضرب.',
    },
    {
      point: '[data-coach="field"]',
      awaitTap: false,
      en: 'Later, forest hides part of the trail. A marcher who walks behind it is still walking — strike where you believe they have got to, not where you last saw them. That is a guess you can get good at.',
      ar: 'ولاحقاً يحجب الشجر جزءاً من الدرب. والمسير الذي يمضي خلفه ما زال يمشي — فاضرب حيث تظنّ أنه بلغ، لا حيث رأيته آخر مرة. وهذا حدسٌ يمكن أن تُتقنه.',
    },
    {
      point: '[data-coach="hud"]',
      awaitTap: false,
      en: 'Your gate has ten. At the end I will show you those three separately — how fast you were, how well you held back, and how close your hidden strikes came. They are different skills, and you will not be equal at them. Your turn.',
      ar: 'ولبوّابتك عشر. وفي النهاية أعرض عليك الثلاثة منفصلة — كم كنت سريعاً، وكم أحسنت الامتناع، وكم قاربت ضرباتك في الخفاء. فهي مهارات مختلفة، ولن تكون فيها سواءً. دورك.',
    },
  ],
};

export default INTERCEPT_COACH;
