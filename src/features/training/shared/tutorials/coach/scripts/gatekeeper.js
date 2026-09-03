/*
 * The Gate's coach script (COACH-PLAN.md Phase 2) — the highest-value lesson in
 * this plan, and the only one in the app that teaches a thinking error.
 *
 * ⚠ THE CONSTRUCT IS RULE INDUCTION, AND WASON'S ACTUAL FINDING IS THAT PEOPLE
 * TEST TO CONFIRM. In the 2-4-6 task, subjects form a hypothesis and then spend
 * every trial on cases they expect to PASS — which cannot distinguish their
 * guess from the many rules that agree with it. The only informative move is to
 * test something you expect to FAIL. Almost nobody does this unprompted, and
 * that is the whole reason the paradigm is famous.
 *
 * So the lesson does not say "probe wisely". It walks the player into spending a
 * probe on a traveller they believe will be turned away, and then points at the
 * count of laws still standing so they can SEE that it moved further than a
 * confirming probe would have. That is the difference between telling someone
 * about a bias and letting them feel it.
 *
 * ⚠ WITHOUT THIS, A LOSS IS UNREADABLE. Probes are a budget and
 * `validate:gatekeeper` only guarantees each gate is decidable WITHIN it. A
 * player who spends all of them confirming reaches the trio with three laws
 * still alive, guesses 1-in-3, and has no way to know they were never given a
 * puzzle they had failed to solve — they simply assume they reasoned badly.
 *
 * ⚠ THE TAUGHT PROBE IS FREE. See `freeProbesRef` in index.jsx: charging the
 * budget for a probe the tutorial asked for could push the gate below the
 * decidability the gate guarantees, which is precisely the failure this lesson
 * exists to prevent.
 */
export const GATEKEEPER_COACH = {
  id: 'gatekeeper@coach1',
  steps: [
    {
      point: '[data-coach="tray"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. Haris is keeping a law he will not tell you. Send him a traveller and he stamps them IN or OUT — that stamp is the only way to learn what the law is.",
      ar: 'أنا د. كوكب. حارس يحفظ قانوناً لن يخبرك به. أرسل إليه مسافراً فيختمه بالدخول أو المنع — وهذا الختم هو سبيلك الوحيد لمعرفة القانون.',
    },
    {
      point: '[data-coach="alive"]',
      awaitTap: false,
      en: 'This counts how many laws still fit everything you have seen. Your job is to drive it down to one. Watch it after every stamp.',
      ar: 'وهذا يحصي كم قانوناً ما زال يوافق كل ما رأيت. ومهمّتك أن تهبط به إلى واحد. راقبه بعد كل ختم.',
    },
    /*
     * ⚠ THE STEP THE WHOLE GAME TURNS ON. Phrased as an instruction to do the
     * uncomfortable thing, because a hint would simply be read as permission to
     * carry on confirming.
     */
    {
      point: '[data-coach="tray"]',
      awaitTap: true,
      en: 'Now the move almost nobody makes. Do NOT send someone you expect to be let in — that teaches you nearly nothing. Send one you expect to be REFUSED. Pick your traveller and watch the count. This probe is on me.',
      ar: 'والآن الحركة التي لا يكاد أحد يقوم بها. لا تُرسل من تتوقّع دخوله — فذلك لا يعلّمك شيئاً يُذكر. أرسل من تتوقّع منعه. اختر مسافرك وراقب العدد. وهذه المحاولة على حسابي.',
    },
    {
      point: '[data-coach="alive"]',
      awaitTap: false,
      en: 'That is the habit worth building: a guess you cannot break is a guess you have not tested. Spend your probes trying to be wrong, and by the trio only one law will be left standing. Your turn.',
      ar: 'وهذه هي العادة الجديرة بأن تبنيها: الظنّ الذي لا تستطيع كسره ظنّ لم تختبره. أنفق محاولاتك في السعي إلى الخطأ، وعند الثلاثة لن يبقى إلا قانون واحد. دورك.',
    },
  ],
};

export default GATEKEEPER_COACH;
