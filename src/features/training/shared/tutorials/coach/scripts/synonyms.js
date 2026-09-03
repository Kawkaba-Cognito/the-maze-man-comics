/*
 * Word Links' coach script (COACH-PLAN.md Phase 1).
 *
 * ⚠ THE CONSTRUCT IS SEMANTIC RELATION, AND THE GAME'S NAME WORKS AGAINST IT.
 * This sits in the language domain next to Word Maze, which is a game about
 * LETTERS — tracing a path across a grid of them. A player arriving here
 * reasonably expects more of the same and starts looking at spellings. Every
 * question in this game is about meaning, and nothing on screen says so.
 *
 * ⚠ AND THE RELATION BADGE IS THE INSTRUCTION, NOT DECORATION. The little tag
 * above the prompt is what makes an item answerable — "opposite" and "same kind
 * of thing" have different right answers for the identical pair of words. It is
 * small, grey and easy to read as a category label, so the lesson points at it
 * first and says outright what it is for.
 */
export const SYNONYMS_COACH = {
  id: 'synonyms@coach1',
  steps: [
    {
      point: '[data-coach="relation"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. Start with this tag — it tells you WHICH kind of link I am asking about. The same two words can have a different right answer under a different link, so never skip it.",
      ar: 'أنا د. كوكب. ابدأ من هذه اللافتة — فهي تقول أيّ نوع من الروابط أسأل عنه. والكلمتان ذاتهما قد يختلف جوابهما باختلاف الرابط، فلا تتجاوزها أبداً.',
    },
    {
      point: '[data-coach="prompt"]',
      awaitTap: false,
      en: 'The link is always in the MEANING. Not the spelling, not the letters, not how the word sounds — this is not that kind of word game.',
      ar: 'والرابط دائماً في المعنى. لا في الإملاء ولا في الحروف ولا في وقع الكلمة — فهذه ليست لعبة كلمات من ذلك النوع.',
    },
    {
      point: '[data-coach="answer"]',
      awaitTap: true,
      en: 'Choose the one that fits the link. Go ahead — this one counts.',
      ar: 'اختر ما يناسب الرابط. تفضّل — وهذه محاولة محسوبة.',
    },
    {
      point: '[data-coach="relation"]',
      awaitTap: false,
      en: 'That is all of it. Read the link, then answer on meaning. When you are unsure, say the relation out loud in a short sentence — it usually settles it. Your turn.',
      ar: 'هذا كل شيء. اقرأ الرابط ثم أجب على المعنى. وإذا ترددت، فقل الرابط بجملة قصيرة بصوتٍ عالٍ — فذلك يحسمه غالباً. دورك.',
    },
  ],
};

export default SYNONYMS_COACH;
