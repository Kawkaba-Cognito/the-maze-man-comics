/*
 * Story Time's coach script (COACH-PLAN.md Phase 2).
 *
 * ⚠ THE CONSTRUCT IS EPISODIC MEMORY — WHAT HAPPENED, NOT WHAT IT LOOKED LIKE.
 * The questions are generated from the story's BEATS (see validate:storyq): who
 * was in a scene, what came next, which came first, how many scenes had company.
 * A player who studies the pictures is encoding the wrong thing entirely, and
 * they cannot discover that until the questions arrive, by which point the
 * scenes are gone and it is too late to have watched differently.
 *
 * This is the clearest case in the whole plan of a lesson that has to arrive
 * BEFORE the measured behaviour: the encoding strategy is the thing being
 * measured, and it is unrecoverable once the watch phase ends.
 *
 * ⚠ IT ALSO WARNS ABOUT THE LURE. One question shows a scene that may never have
 * happened, which is a recognition test for false memory. Told about it, players
 * watch for it; ambushed by it, they read it as the game cheating.
 *
 * ⚠ NO AWAIT STEP: the watch phase advances by swipe or arrow, and the clock is
 * held while this is open, so there is no scored action to wait on.
 */
export const STORY_GRID_COACH = {
  id: 'story-grid@coach1',
  steps: [
    {
      point: '[data-coach="panel"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. This is a story, not a picture. Watch what HAPPENS in each scene — who is there, and what they do. The details of how it is drawn will not be asked about.",
      ar: 'أنا د. كوكب. هذه قصة لا صورة. راقب ما يحدث في كل مشهد — من فيه، وماذا يفعلون. أما تفاصيل الرسم فلن تُسأل عنها.',
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
      en: 'This is your time with the whole story. When it runs out I will ask you what happened — the order of things, who was there, how many scenes had company.',
      ar: 'وهذا وقتك مع القصة كلّها. فإذا نفد سألتك عمّا جرى — ترتيب الأحداث، ومن كان حاضراً، وكم مشهداً كان فيه رفيق.',
    },
    {
      point: '[data-coach="panel"]',
      awaitTap: false,
      en: 'And be careful of one question: I will show you a scene and ask whether you saw it. Sometimes I made it up. Remembering something that never happened is easier than you would think. Your turn.',
      ar: 'واحذر سؤالاً واحداً: سأعرض عليك مشهداً وأسألك أرأيته أم لا. وأحياناً أكون قد اختلقته. فتذكّر ما لم يحدث أسهل ممّا تظنّ. دورك.',
    },
  ],
};

export default STORY_GRID_COACH;
