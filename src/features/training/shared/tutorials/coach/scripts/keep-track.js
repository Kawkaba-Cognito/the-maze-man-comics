/*
 * Keep Track's coach script (COACH-PLAN.md Phase 1).
 *
 * ⚠ THE CONSTRUCT IS UPDATING, NOT STORAGE — and that is the one thing a player
 * will not work out alone. Keep Track (Miyake et al. 2000) measures whether a
 * fresh exemplar OVERWRITES the one you were holding. A player who reads it as
 * "remember the words" tries to hold the whole stream, runs out of room, and
 * concludes their memory is bad; the game is actually asking them to let go.
 *
 * So step 3 is the lesson. Steps 1, 2 and 4 exist to get the player to a live
 * stream with a word on screen, which is the only place step 3 is true.
 *
 * `point` is a CSS selector inside the game's stage — see useDomAnchor. The
 * `data-coach` attributes it names are in index.jsx.
 */
export const KEEP_TRACK_COACH = {
  id: 'keep-track@coach1',
  steps: [
    {
      point: '[data-coach="cats"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. These are the categories you are holding — and only these. Everything else that goes past is noise.",
      ar: 'أنا د. كوكب. هذه هي الفئات التي تحملها — وهي وحدها. وكل ما عداها يمرّ فلا يعنيك.',
    },
    {
      point: '[data-coach="begin"]',
      awaitTap: true,
      en: 'Start the stream when you are ready.',
      ar: 'ابدأ التدفّق عندما تكون جاهزاً.',
    },
    /*
     * ⚠ THE ONE THAT MATTERS. Said as an instruction to FORGET, because that is
     * counter-intuitive enough that hinting at it does not work — every other
     * memory game in this app rewards holding on to more.
     */
    {
      point: '[data-coach="word"]',
      awaitTap: false,
      en: 'Each word names its category. When a second word from a category you are holding comes past, it REPLACES the first — let the old one go. You only ever need the newest.',
      ar: 'كل كلمة تذكر فئتها. وحين تمرّ كلمة ثانية من فئة تحملها، فإنها تحلّ محلّ الأولى — اترك القديمة تذهب. أنت لا تحتاج إلا الأحدث.',
    },
    {
      point: '[data-coach="track"]',
      awaitTap: false,
      en: 'At the end I will ask for the last word in each of these. Not all of them — just the last. Your turn.',
      ar: 'في النهاية سأسألك عن آخر كلمة في كلٍّ من هذه. لا كلّها — الأخيرة فقط. دورك.',
    },
  ],
};

export default KEEP_TRACK_COACH;
