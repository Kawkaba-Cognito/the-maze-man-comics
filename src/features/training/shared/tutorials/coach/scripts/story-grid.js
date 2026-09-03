/*
 * Story Time's coach script.
 *
 * ⚠ THE PLAYER HAS TO KNOW WHAT WILL BE ASKED, OR THEY ENCODE THE WRONG THING.
 * The retrieval half (Kawkab Asks, 2026-08-17) asks about ORDER, WHO WAS THERE,
 * WHAT CAME NEXT and HOW MANY scenes had company. None of that is about how a
 * panel is drawn — and a player who spends the memorise phase studying the art
 * has spent it on nothing. Telling them the shape of the questions in advance is
 * not giving away the answers; it is the difference between a memory test and a
 * guessing game.
 *
 * ⚠ AND THE FALSE-SCENE QUESTION MUST BE WARNED ABOUT. One question shows a
 * scene that may never have happened. Recognising a plausible fabrication is
 * genuinely hard, and a player ambushed by it reads their own false memory as
 * carelessness.
 *
 * ── 2026-09-03: four steps became eight, on the spine in COACH-PLAN.md ──
 * The old step 3 listed all the question kinds inside a sentence about the
 * timer. They are now separated, because the question list is the single most
 * useful thing in this lesson and it was riding as a subordinate clause.
 *
 * ⚠ NO AWAIT STEP: no `satisfiedFor` predicate. The lesson runs during the
 * memorise phase, where the only action is paging through scenes.
 */
export const STORY_GRID_COACH = {
  id: 'story-grid@coach2',
  steps: [
    {
      point: '[data-coach="panel"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. This is a story, not a picture.",
      ar: 'أنا د. كوكب. هذه قصّة لا صورة.',
    },
    {
      point: '[data-coach="panel"]',
      awaitTap: false,
      en: 'Watch what HAPPENS in each scene — who is there, and what they do. How it is drawn will never be asked about, so do not spend your time on it.',
      ar: 'راقب ما يحدث في كل مشهد — من فيه، وماذا يفعلون. أما كيف رُسم فلن يُسأل عنه أبداً، فلا تُنفق وقتك فيه.',
    },
    {
      point: '[data-coach="nav"]',
      awaitTap: false,
      en: 'Move through them at your own pace, forward and back. Going back over a scene you are unsure of is a good use of the time, not a waste of it.',
      ar: 'وتنقّل بينها على مهلك، تقدّماً وتراجعاً. والعودة إلى مشهد لست منه على يقين استعمالٌ حسن للوقت لا إهدار له.',
    },
    {
      point: '[data-coach="timer"]',
      awaitTap: false,
      en: 'This is your time with the whole story. It is set so every scene gets a fair share — you are not being hurried.',
      ar: 'وهذا وقتك مع القصّة كلّها. وقد قُدّر ليَنال كل مشهد نصيبه العادل — فلست مستعجَلاً.',
    },
    /*
     * ⚠ THE ONE THAT MATTERS. Knowing the question shapes in advance changes
     * what the player encodes, which is the entire lesson.
     */
    {
      point: null,
      awaitTap: false,
      en: 'When it runs out I ask you what happened: the ORDER of things, WHO was in a scene, what came NEXT, and how many scenes had company.',
      ar: 'فإذا نفد سألتك عمّا جرى: ترتيب الأحداث، ومن كان في المشهد، وما الذي جاء بعده، وكم مشهداً كان فيه رفيق.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'So watch it as a chain rather than as a set of pictures. "He did this, and THEN this" holds up under those questions; a pile of separate scenes does not.',
      ar: 'فانظر إليها سلسلةً لا مجموعةَ صور. فقولك «فعل هذا، ثم هذا» يصمد أمام تلك الأسئلة؛ أمّا كومةٌ من مشاهد متفرّقة فلا تصمد.',
    },
    {
      point: '[data-coach="panel"]',
      awaitTap: false,
      en: 'And be careful of one question in particular: I will show you a scene and ask whether you saw it. Sometimes I made it up.',
      ar: 'واحذر سؤالاً واحداً بعينه: سأعرض عليك مشهداً وأسألك أرأيته أم لا. وأحياناً أكون قد اختلقته.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'Remembering something that never happened is easier than you would think, and it is not carelessness — a made-up scene that fits the story feels exactly like one you saw. Trust a scene you can place in the chain, not one that merely feels familiar. Your turn.',
      ar: 'وتذكّر ما لم يحدث أسهل ممّا تظنّ، وليس ذلك تفريطاً — فالمشهد المختلَق الذي يوافق القصّة يبدو كالذي رأيته سواءً بسواء. فثِق بمشهدٍ تستطيع وضعه في السلسلة، لا بمشهدٍ يبدو مألوفاً فحسب. دورك.',
    },
  ],
};

export default STORY_GRID_COACH;
