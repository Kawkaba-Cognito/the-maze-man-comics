/*
 * Keep Track's coach script.
 *
 * ⚠ THE CONSTRUCT IS UPDATING, NOT STORAGE — and that is the one thing a player
 * will not work out alone. Keep Track (Miyake et al. 2000) measures whether a
 * fresh exemplar OVERWRITES the one you were holding. A player who reads it as
 * "remember the words" tries to hold the whole stream, runs out of room, and
 * concludes their memory is bad; the game is actually asking them to let go.
 *
 * ── 2026-09-03: four steps became eight, on the spine in COACH-PLAN.md ──
 * The old step 3 carried the entire lesson in one paragraph — the replacement
 * rule, the instruction to forget, and "you only ever need the newest". Each is
 * now its own step, because the replacement rule is counter-intuitive enough
 * that it needs somewhere to land rather than a subordinate clause.
 *
 * `point` is a CSS selector inside the game's stage — see useDomAnchor. The
 * `data-coach` attributes it names are in index.jsx.
 */
export const KEEP_TRACK_COACH = {
  id: 'keep-track@coach2',
  steps: [
    {
      point: '[data-coach="cats"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. These are the categories you are holding — and only these.",
      ar: 'أنا د. كوكب. هذه هي الفئات التي تحملها — وهي وحدها.',
    },
    {
      point: '[data-coach="cats"]',
      awaitTap: false,
      en: 'A stream of words will go past, and most of them belong to categories that are NOT on this list. Those are noise. Let them go by without doing anything at all.',
      ar: 'وسيمرّ بك سيلٌ من الكلمات، أكثرها من فئات ليست في هذه القائمة. وتلك ضوضاء. فدعها تمرّ ولا تصنع بها شيئاً البتّة.',
    },
    {
      point: '[data-coach="begin"]',
      awaitTap: true,
      en: 'Start the stream when you are ready.',
      ar: 'ابدأ التدفّق عندما تكون جاهزاً.',
    },
    {
      point: '[data-coach="word"]',
      awaitTap: false,
      en: 'Each word names its own category, so you never have to work out which one it belongs to. Reading it is enough.',
      ar: 'وكل كلمة تذكر فئتها، فلا يلزمك أن تستنبط إلى أيّها تنتمي. وقراءتها تكفي.',
    },
    /*
     * ⚠ THE ONE THAT MATTERS. Said as an instruction to FORGET, because that is
     * counter-intuitive enough that hinting at it does not work — every other
     * memory game in this app rewards holding on to more.
     */
    {
      point: '[data-coach="word"]',
      awaitTap: false,
      en: 'Now the rule that makes this game what it is. When a SECOND word from a category you are holding comes past, it REPLACES the first. Let the old one go.',
      ar: 'والآن القاعدة التي تجعل هذه اللعبة ما هي عليه. إذا مرّت كلمة ثانية من فئة تحملها، فإنها تحلّ محلّ الأولى. فاترك القديمة تذهب.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'This is the opposite of what every other memory game asks. Trying to keep both is how people run out of room — you only ever need the newest one, and holding the old one costs you the new one.',
      ar: 'وهذا نقيض ما تطلبه كل لعبة ذاكرة أخرى. ومحاولة الاحتفاظ بكلتيهما هي ما يُضيق بالناس ذرعاً — فأنت لا تحتاج إلا الأحدث، والاحتفاظ بالقديم يكلّفك الجديد.',
    },
    {
      point: '[data-coach="track"]',
      awaitTap: false,
      en: 'At the end I ask for the last word in each of these. Not all of them, not in order — just the last one you saw for each.',
      ar: 'وفي النهاية أسألك عن آخر كلمة في كلٍّ من هذه. لا عنها كلّها، ولا على ترتيبها — بل عن آخر ما رأيت لكلٍّ منها.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'It grows by lengthening the stream and by adding categories to hold, never by going faster than you can read. If you feel crowded, drop the old word deliberately rather than hoping it fades. Your turn.',
      ar: 'وهي تشتدّ بإطالة السيل وبزيادة الفئات التي تحملها، لا بأن تسرع فوق ما تستطيع قراءته. فإن ضاق بك الأمر، فاطرح الكلمة القديمة عامداً بدل أن ترجو زوالها. دورك.',
    },
  ],
};

export default KEEP_TRACK_COACH;
