/*
 * Word Links' coach script.
 *
 * ⚠ THE CONSTRUCT IS SEMANTIC RELATION, AND THE NEIGHBOURING GAME WORKS AGAINST
 * IT. This sits in the language domain next to Word Maze, which is a game about
 * LETTERS — tracing a path across a grid of them. A player arriving here
 * reasonably expects more of the same and starts looking at spellings. Every
 * question in this game is about meaning, and nothing on screen says so.
 *
 * ⚠ AND THE RELATION BADGE IS THE INSTRUCTION, NOT DECORATION. The little tag
 * above the prompt is what makes an item answerable — "opposite" and "same kind
 * of thing" have different right answers for the identical pair of words. It is
 * small, grey and easy to read as a category label, so the lesson points at it
 * first and says outright what it is for.
 *
 * ── 2026-09-03: four steps became eight, on the spine in COACH-PLAN.md ──
 * The badge now gets a worked example rather than only an assertion that it
 * matters: "the same two words can have a different right answer" is abstract
 * until you see one pair answered two ways.
 */
export const SYNONYMS_COACH = {
  id: 'synonyms@coach2',
  steps: [
    {
      point: '[data-coach="relation"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. Start with this tag, every single time. It tells you WHICH kind of link I am asking about.",
      ar: 'أنا د. كوكب. ابدأ من هذه اللافتة في كل مرّة. فهي تقول أيّ نوع من الروابط أسأل عنه.',
    },
    {
      point: '[data-coach="relation"]',
      awaitTap: false,
      en: 'It is not a heading. Take "hot": under OPPOSITE the answer is cold, and under SAME KIND OF THING it is warm. Same word, different tag, different answer.',
      ar: 'وليست عنواناً. خذ «حارّ»: فتحت «الضدّ» يكون الجواب بارداً، وتحت «من الجنس نفسه» يكون دافئاً. الكلمة ذاتها، واللافتة مختلفة، فالجواب مختلف.',
    },
    {
      point: '[data-coach="prompt"]',
      awaitTap: false,
      en: 'The link is always in the MEANING. Not the spelling, not the letters, not how the word sounds — this is not that kind of word game.',
      ar: 'والرابط دائماً في المعنى. لا في الإملاء ولا في الحروف ولا في وقع الكلمة — فهذه ليست لعبة كلمات من ذاك النوع.',
    },
    {
      point: '[data-coach="answer"]',
      awaitTap: true,
      en: 'Choose the one that fits the link. Go ahead — this one counts.',
      ar: 'اختر ما يناسب الرابط. تفضّل — وهذه محاولة محسوبة.',
    },
    {
      point: '[data-coach="answer"]',
      awaitTap: false,
      en: 'The wrong options are not random. There is usually one that is related to the prompt but under a DIFFERENT link than the one being asked for — that is the one that catches people.',
      ar: 'والخيارات الخاطئة ليست اعتباطاً. ففيها عادةً واحد يمتّ إلى المطلوب بصلة، لكن تحت رابطٍ غير المسؤول عنه — وهو الذي يوقع الناس.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'So when two options both look right, you have almost certainly stopped reading the tag. Go back to it rather than weighing the two words against each other.',
      ar: 'فإذا بدا لك خياران صحيحين معاً، فأنت على الأرجح قد كففت عن قراءة اللافتة. فارجع إليها بدل أن توازن بين الكلمتين.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'When you are unsure, say the relation out loud as a short sentence — "a puppy is a young dog" — and try it on each option. The one it survives is the answer.',
      ar: 'وإذا ترددت، فقل الرابط بجملة قصيرة بصوتٍ عالٍ — «الجرو كلبٌ صغير» — ثم جرّبها على كل خيار. والخيار الذي تصمد عليه هو الجواب.',
    },
    {
      point: '[data-coach="relation"]',
      awaitTap: false,
      en: 'It grows by using rarer words and by putting the near-miss option closer to the right one, never by hiding the tag. Read the link, then answer on meaning. Your turn.',
      ar: 'وهي تشتدّ باستعمال كلمات أندر، وبتقريب الخيار المشابه من الصحيح، لا بإخفاء اللافتة قطّ. فاقرأ الرابط ثم أجب على المعنى. دورك.',
    },
  ],
};

export default SYNONYMS_COACH;
