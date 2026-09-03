/*
 * Speed Match's coach script (COACH-PLAN.md Phase 1).
 *
 * ⚠ THE CONSTRUCT IS PROCESSING SPEED MEASURED AS CONSISTENCY, NOT PEAK SPEED.
 * This is a symbol–digit coding task (SDMT family), and its most informative
 * measure is the VARIABILITY of response time — a player who alternates sprints
 * with stalls scores worse, and reads worse clinically, than one slower but
 * even. The game's own time bank already rewards that, and nothing says so.
 *
 * ⚠ AND THE KEY IS NOT SUPPOSED TO BE MEMORISED. The legend is on screen the
 * whole time and is reshuffled between rounds. Players who assume they are meant
 * to learn it spend the first rounds memorising a mapping that is about to
 * change, then feel slow. Coding tasks measure looking-up speed, deliberately.
 */
export const SPEED_MATCH_COACH = {
  id: 'speed-match@coach1',
  steps: [
    {
      point: '[data-coach="legend"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. This key pairs every symbol with a number. Do not try to memorise it — it is reshuffled each round, and looking it up quickly IS the skill being measured.",
      ar: 'أنا د. كوكب. هذا المفتاح يقرن كل رمز برقم. لا تحاول حفظه — فهو يُخلط في كل جولة، والبحث السريع فيه هو المهارة المقيسة نفسها.',
    },
    {
      point: '[data-coach="card"]',
      awaitTap: false,
      en: 'A symbol appears here. Find it in the key above, and read off its number.',
      ar: 'يظهر رمز هنا. ابحث عنه في المفتاح أعلاه، واقرأ رقمه.',
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
      en: 'This is your time, and it drains. Every right answer pours some back — so the run lasts as long as you keep answering. A steady rhythm you can hold beats bursts of speed with stalls between them. That is the whole game. Your turn.',
      ar: 'وهذا وقتك، وهو ينفد. وكل إجابة صحيحة تعيد إليه شيئاً — فتدوم المحاولة ما دمت تجيب. وإيقاع ثابت تقدر على الاستمرار فيه خير من سرعة متقطّعة يتخلّلها التوقّف. هذه هي اللعبة كلّها. دورك.',
    },
  ],
};

export default SPEED_MATCH_COACH;
