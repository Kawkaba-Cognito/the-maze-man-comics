/*
 * Intercept / Rift Defense's coach script.
 *
 * ⚠ THIS GAME LAYERS THREE CONSTRUCTS AND SCORES THEM SEPARATELY — reaction
 * time, response inhibition (the no-go colour), and prediction (striking under
 * the canopy). That separation is the only thing stopping it being a fourth
 * reaction test in a domain that benched Trail Making for exactly that, so the
 * lesson has to name all three and say they are different skills. Otherwise the
 * results screen shows a player three numbers they have no frame for.
 *
 * ⚠ AND "DO NOT STRIKE" IS A REAL MOVE, WHICH HAS TO BE SAID. Withholding only
 * measures inhibition while striking is prepotent, so by the time a no-go
 * marcher appears the player must already be striking automatically — which
 * means the instruction has to arrive before the habit, not after it.
 *
 * ── 2026-09-03: four steps became eight, on the spine in COACH-PLAN.md ──
 * The old lesson pointed three of its four steps at `[data-coach="field"]`, the
 * whole play area, so the hand barely moved and indicated nothing in
 * particular. Steps about scoring and progression now park the hand instead.
 *
 * ⚠ NO AWAIT STEP: no `satisfiedFor` predicate, and the wave is held while the
 * lesson is open, so there is no marcher inside the tower's reach to strike.
 */
export const INTERCEPT_COACH = {
  id: 'intercept@coach2',
  steps: [
    {
      point: '[data-coach="field"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. An army walks this trail toward your gate, wave after wave.",
      ar: 'أنا د. كوكب. جيشٌ يسير على هذا الدرب نحو بوّابتك، موجةً بعد موجة.',
    },
    {
      point: '[data-coach="field"]',
      awaitTap: false,
      en: 'Your tower reaches only part of the path. Strike a marcher while they are inside that reach and they go down; outside it, a tap does nothing.',
      ar: 'وبرجك لا يبلغ إلا جزءاً من الطريق. فاضرب المسير وهو داخل ذلك المدى يسقط؛ وخارجه لا تُجدي الضربة شيئاً.',
    },
    /*
     * ⚠ THE INHIBITION LAYER. Stated as the colour to LEAVE, because the first
     * build showed the go colour under the label "safe colour" — precisely
     * inverted, telling the player the thing to strike was the thing to avoid.
     */
    {
      point: '[data-coach="hud"]',
      awaitTap: false,
      en: 'Some waves carry a forbidden colour, and when they do it appears up here. That is the colour to LEAVE ALONE — not the one to hit.',
      ar: 'وبعض الموجات تحمل لوناً محرَّماً، فإذا حملته ظهر هاهنا. وذلك هو اللون الذي تتركه — لا الذي تضربه.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'Not striking is a real move here, and a harder one than striking. By the time a forbidden marcher arrives your hand is already in the habit of hitting everything — stopping it is the second thing I am measuring.',
      ar: 'والامتناع فعلٌ حقيقي هنا، وهو أشقّ من الضرب. فحين يصل المسير المحرَّم تكون يدك قد اعتادت ضرب كل شيء — وكبحها هو الأمر الثاني الذي أقيسه.',
    },
    {
      point: '[data-coach="field"]',
      awaitTap: false,
      en: 'Later, forest hides part of the trail. A marcher who walks behind it is still walking — strike where you believe they have got to, not where you last saw them.',
      ar: 'ولاحقاً يحجب الشجر جزءاً من الدرب. والمسير الذي يمضي خلفه ما زال يمشي — فاضرب حيث تظنّ أنه بلغ، لا حيث رأيته آخر مرّة.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'That is a guess, and it is a guess you can get good at. I never hide a marcher you have not seen walking first, so you always have their pace before they disappear.',
      ar: 'وذلك حدس، وهو حدسٌ يمكن أن تُتقنه. فأنا لا أُخفي مسيراً لم ترَه يمشي قبل ذلك، فتكون سرعته معك دائماً قبل أن يغيب.',
    },
    {
      point: '[data-coach="hud"]',
      awaitTap: false,
      en: 'Your gate has ten. A marcher who reaches it takes one — so a wave you handle untidily still counts, and only losing the gate ends the run.',
      ar: 'ولبوّابتك عشر. والمسير الذي يبلغها يأخذ واحدة — فالموجة التي تعالجها بغير إتقان تُحتسب لك مع ذلك، ولا تنتهي المحاولة إلا بسقوط البوّابة.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'At the end I show those three separately: how fast you were, how well you held back, and how close your hidden strikes came. They are different skills and you will not be equal at them — that is the point of showing them apart. Your turn.',
      ar: 'وفي النهاية أعرض الثلاثة منفصلة: كم كنت سريعاً، وكم أحسنت الامتناع، وكم قاربت ضرباتك في الخفاء. فهي مهارات مختلفة، ولن تكون فيها سواءً — وهذا هو المقصود من عرضها متفرّقة. دورك.',
    },
  ],
};

export default INTERCEPT_COACH;
