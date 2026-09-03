/*
 * The Gate's coach script.
 *
 * ⚠ THE CONSTRUCT IS HYPOTHESIS TESTING, AND THE INSTINCT IT MEASURES IS THE
 * ONE ALMOST NOBODY HAS. This is Wason 2-4-6 / Zendo: it measures how you FIND a
 * rule, where Raven measured whether you spot one already laid out. The
 * documented human default is to send probes you expect to CONFIRM your guess,
 * which is exactly the probe that teaches you nothing — a guess you cannot break
 * is a guess you have not tested.
 *
 * ⚠ SO THE LESSON HAS TO ASK FOR THE UNCOMFORTABLE MOVE OUTRIGHT. Hinting at it
 * is read as permission to carry on confirming, which is what the player was
 * going to do anyway.
 *
 * ── 2026-09-03: four steps became eight, on the spine in COACH-PLAN.md ──
 * The falsification instruction previously shared a step with "pick your
 * traveller and watch the count", so the single hardest idea in the reasoning
 * domain arrived as the opening clause of a step about pressing a button. It now
 * stands alone, and it is explained rather than only asserted.
 */
export const GATEKEEPER_COACH = {
  id: 'gatekeeper@coach2',
  steps: [
    {
      point: '[data-coach="tray"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. Haris is keeping a law, and he will not tell you what it is.",
      ar: 'أنا د. كوكب. حارسٌ يحفظ قانوناً، ولن يخبرك ما هو.',
    },
    {
      point: '[data-coach="tray"]',
      awaitTap: false,
      en: 'Send him a traveller and he stamps them IN or OUT. That stamp is the only way to learn anything here — there is nothing else to read.',
      ar: 'أرسل إليه مسافراً فيختمه بالدخول أو المنع. وهذا الختم هو سبيلك الوحيد إلى معرفة شيء هنا — فليس ثمّة ما يُقرأ سواه.',
    },
    {
      point: '[data-coach="alive"]',
      awaitTap: false,
      en: 'This counts how many laws still fit everything you have seen so far. Your job is to drive it down to one.',
      ar: 'وهذا يحصي كم قانوناً ما زال يوافق كلّ ما رأيته إلى الآن. ومهمّتك أن تهبط به إلى واحد.',
    },
    /*
     * ⚠ THE STEP THE WHOLE GAME TURNS ON. Phrased as an instruction to do the
     * uncomfortable thing, because a hint would simply be read as permission to
     * carry on confirming.
     */
    {
      point: null,
      awaitTap: false,
      en: 'Now the move almost nobody makes. Do NOT send someone you expect to be let in. If they walk through, you learn nearly nothing — you already thought they would.',
      ar: 'والآن الحركة التي لا يكاد أحد يقوم بها. لا تُرسل من تتوقّع دخوله. فإن دخل لم تتعلّم شيئاً يُذكر — إذ كنت تظنّ ذلك أصلاً.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'Send one you expect to be REFUSED instead. If he is refused, that kills a whole family of laws at once. If he is let in, your guess was wrong — and finding that out is worth more than being right.',
      ar: 'بل أرسل من تتوقّع منعه. فإن مُنع، أسقط ذلك أسرةً من القوانين دفعةً واحدة. وإن دخل، فقد أخطأ ظنّك — ومعرفةُ ذلك خيرٌ لك من أن تكون مصيباً.',
    },
    {
      point: '[data-coach="tray"]',
      awaitTap: true,
      en: 'Try it. Pick a traveller you think he will turn away, and watch the count. This probe is on me.',
      ar: 'جرّب. اختر مسافراً تظنّ أنه سيردّه، وراقب العدد. وهذه المحاولة على حسابي.',
    },
    {
      point: '[data-coach="alive"]',
      awaitTap: false,
      en: 'Your probes are limited, and that is the real constraint. Confirming probes feel productive and move that number barely at all — which is how people run out with three laws still standing.',
      ar: 'ومحاولاتك محدودة، وتلك هي القيد الحقيقي. والمحاولات المؤكِّدة تبدو مثمرة ولا تكاد تحرّك ذلك العدد — وبذلك تنفد محاولات الناس وثلاثة قوانين ما زالت قائمة.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'So spend them trying to be wrong, and by the trio only one law will be left standing. That habit is the whole game, and it is worth more outside it than in. Your turn.',
      ar: 'فأنفقها في السعي إلى الخطأ، وعند الثلاثة لن يبقى إلا قانون واحد. وتلك العادة هي اللعبة كلّها، وهي خارجها أنفع منها فيها. دورك.',
    },
  ],
};

export default GATEKEEPER_COACH;
