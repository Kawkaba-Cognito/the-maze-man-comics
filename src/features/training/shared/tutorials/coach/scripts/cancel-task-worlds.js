/*
 * CANCEL-TASK WORLD LESSONS — one ACTIVE lesson per rule the ladder introduces.
 *
 * Owner, 2026-09-17: "after each feature we will have an automatic tutorial,
 * but the tutorial has to be ACTIVE — which means explanation and application
 * for a while, then the game. It has to be premium."
 *
 * So every lesson here is explanation → the thing on screen → DO IT → what it
 * costs. The "do it" beats are `awaitTap: true`, which holds the lesson until
 * the player actually clears the shape the hand is on; they are the difference
 * between a tutorial and a card you dismiss.
 *
 * ⚠ THESE RUN ON THE LIVE BOARD, INSIDE THE REAL ROUND. The round clock is held
 * while a lesson is open and a wrong tap costs nothing, so the lesson cannot be
 * failed and cannot be lost — see `coachOpenRef` in the game's index.jsx, and
 * the warning in CLAUDE.md about guarding EVERY consequence rather than one.
 *
 * ⚠ EN AND AR SIT ON THE SAME STEP, deliberately. This repo's single most
 * repeated bug is an English fix landing without its Arabic twin forty lines
 * away; here the two cannot drift apart because they are one object.
 *
 * ⚠ `point` is 'target' | 'decoy' | a `[data-coach="…"]` selector | null.
 * A step that is about pace, cost or progression uses `null` — parking the hand
 * honestly rather than aiming it at a whole container, which points at nothing.
 *
 * ⚠ COPY IS PRODUCT COPY AND THE REVIEW BOARD READS IT. Claims stay scoped to
 * this task ("search slows", "this board") and never promise a life outcome.
 */

/** The rule each band introduces → its lesson. Keys match `FQ_LADDER[].adds`. */
export const CANCEL_WORLD_LESSONS = {
  switch: {
    id: 'switch',
    steps: [
      {
        point: null,
        en: 'New rule. This world changes the shape you are hunting between sets.',
        ar: 'قاعدة جديدة. هذا العالم يغيّر الشكل المطلوب بين جولة وأخرى.',
      },
      {
        point: '[data-coach="goal"]',
        en: 'This is the shape wanted right now. When a set ends, check it again — it will not be the same one.',
        ar: 'هذا هو الشكل المطلوب الآن. وحين تنتهي الجولة، انظر إليه ثانية — لن يكون نفسه.',
      },
      {
        point: 'target',
        awaitTap: true,
        en: 'Clear this one, so the rule is something you have done and not only read.',
        ar: 'امسح هذا، لتصير القاعدة شيئاً فعلته لا شيئاً قرأته فقط.',
      },
      {
        point: null,
        en: 'Dropping one rule and picking up another is set shifting. The cost shows in your first few taps after a change, which is exactly what this measures.',
        ar: 'ترك قاعدة وأخذ أخرى هو تحويل المجموعة. وتظهر كلفته في أول نقراتك بعد التغيير، وهو تحديداً ما يُقاس هنا.',
      },
    ],
  },

  /*
   * ⚠ THIS REPLACED THE `denser` LESSON, and the reason is the point of the
   * world. Frost Hollow used to introduce "a bigger board" — which is a knob,
   * not something new to DO, so the band taught nothing a player could act on
   * differently. The board still grows here (that comes from the tier the
   * ladder walks), and step two says so; what the world now INTRODUCES is a
   * second shape to hold.
   */
  dual: {
    id: 'dual',
    steps: [
      {
        point: null,
        en: 'New rule. From here you are hunting TWO shapes, not one.',
        ar: 'قاعدة جديدة. من هنا تبحث عن شكلين، لا شكل واحد.',
      },
      {
        point: '[data-coach="goal"]',
        en: 'Both of these count, equally. The board is wider here too, so there is more to sort through.',
        ar: 'كلاهما يُحتسب بالتساوي. واللوحة أوسع هنا أيضاً، فما يُفرز أكثر.',
      },
      {
        point: 'target',
        awaitTap: true,
        en: 'Clear one of them now — either shape is right.',
        ar: 'امسح واحداً منهما الآن — أيّ الشكلين صحيح.',
      },
      {
        point: null,
        en: 'Holding two templates at once is the load. Every object now has to be checked against both before you can reject it, so you get a little more time and the misses go up if you let one of the two slip.',
        ar: 'حمل قالبين معاً هو العبء. كل شيء صار يُقارن بهما معاً قبل رفضه، فلك وقت أطول قليلاً، ويزداد ما يفوتك إن أهملت أحدهما.',
      },
    ],
  },

  forbidden: {
    id: 'forbidden',
    steps: [
      {
        point: null,
        en: 'New rule. One object on this board is off limits.',
        ar: 'قاعدة جديدة. شيء واحد على هذه اللوحة ممنوع لمسه.',
      },
      {
        point: 'decoy',
        en: 'It looks like any other object until you learn it. Find the targets and leave it alone.',
        ar: 'يبدو كأي شيء آخر حتى تتعلّمه. جد الأهداف واتركه.',
      },
      {
        point: 'target',
        awaitTap: true,
        en: 'Clear a real target instead. Nothing here costs you while we are talking.',
        ar: 'امسح هدفاً حقيقياً بدلاً منه. لا شيء هنا يكلّفك ما دمنا نتحدث.',
      },
      {
        point: null,
        en: 'Not acting is its own skill. Holding back a tap you have already begun is response inhibition, and a wrong one counts as an error once the lesson ends.',
        ar: 'الامتناع مهارة بذاته. كبح نقرة بدأتها فعلاً هو كبح الاستجابة، والخطأ يُحتسب بعد انتهاء الدرس.',
      },
    ],
  },

  /* ⚠ Renamed from `lookalikes` on 2026-09-20 — see FQ_LADDER. Note the STEPS
     below never needed changing: they already taught the colour field
     ("the distractors start borrowing the target's colour"), which is what the
     band actually does. It was the mechanic's name and its rule-card label that
     described a shape manipulation no code implemented. The lesson was right
     and the label was lying about it. */
  samehue: {
    id: 'samehue',
    steps: [
      {
        point: null,
        en: 'New rule. From here the distractors start borrowing the target’s colour.',
        ar: 'قاعدة جديدة. من هنا تبدأ المشتّتات تستعير لون الهدف.',
      },
      {
        point: 'decoy',
        en: 'This one is the target’s colour and the wrong object. Colour will not pick it out for you any more.',
        ar: 'هذا بلون الهدف وهو الشكل الخطأ. لم يعد اللون يميّزه لك.',
      },
      {
        point: 'target',
        awaitTap: true,
        en: 'So go by the shape. Clear this one.',
        ar: 'فاعتمد على الشكل إذن. امسح هذا.',
      },
      {
        point: null,
        en: 'The closer a distractor is to the target, the longer each one has to be looked at. That is the whole of what this world adds.',
        ar: 'كلما اقترب المشتّت من الهدف، لزم النظر في كل واحد أطول. وهذا كل ما يضيفه هذا العالم.',
      },
    ],
  },

  drift: {
    id: 'drift',
    steps: [
      {
        point: null,
        en: 'Last rule. The field drifts while you work.',
        ar: 'القاعدة الأخيرة. ينجرف الحقل أثناء عملك.',
      },
      {
        point: 'target',
        en: 'Watch this one for a moment — it will not stay where you first saw it.',
        ar: 'راقب هذا لحظة — لن يبقى حيث رأيته أول مرة.',
      },
      {
        point: 'target',
        awaitTap: true,
        en: 'Now clear it while it moves.',
        ar: 'والآن امسحه وهو يتحرّك.',
      },
      {
        point: null,
        en: 'A moving field stops you relying on where things were, so the search has to keep updating. You are given a little more time for it, and it is still the hardest world here.',
        ar: 'الحقل المتحرك يمنعك من الاعتماد على مواضع الأشياء، فيبقى البحث يتحدّث. ولك وقت أطول قليلاً، ومع ذلك فهو أصعب عوالم اللعبة.',
      },
    ],
  },
};

/** Does this rule have an active lesson? `scan` is taught by the base coach. */
export const hasWorldLesson = (mech) => !!CANCEL_WORLD_LESSONS[mech];
