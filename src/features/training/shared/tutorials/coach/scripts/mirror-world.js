/*
 * Mirror World's coach script.
 *
 * ⚠ THE MEASUREMENT HAPPENS AT THE END, AND WITHOUT WARNING IT FEELS LIKE THE
 * GAME CHEATING. Every run ends with a washout block: the tilt is removed and
 * the player suddenly misses the OTHER way, right after they had got good. That
 * aftereffect IS the finding — it is proof the aim rebuilt itself around the
 * mirror — but a player who meets it unannounced reads it as the game breaking
 * its own rules at the worst possible moment.
 *
 * ⚠ AND THE ADVICE IS TO STOP THINKING, WHICH NEEDS SAYING TWICE. Adaptation is
 * implicit: it happens faster if you keep aiming at the target and let the error
 * shrink than if you compute an offset. Players compute, because computing is
 * what trying feels like.
 *
 * ── 2026-09-03: three steps became eight, on the spine in COACH-PLAN.md ──
 * The old final step was a five-sentence paragraph carrying the washout, the
 * emotional reassurance AND the explanation of what is being measured. Split.
 *
 * ⚠ THE CONTROL STEP IS NOT OPTIONAL. 156 of 300 levels were once unpassable
 * through the no-drag route (see validate:mirror's control-parity assertion), so
 * this game states outright that both inputs score the same — a player who
 * believes the buttons are the lesser option will fight the drag.
 *
 * ⚠ NO AWAIT STEP: no `satisfiedFor` predicate on this game.
 */
export const MIRROR_WORLD_COACH = {
  id: 'mirror-world@coach2',
  steps: [
    {
      point: '[data-coach="cue"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. There is a target, and your job is simply to reach toward it.",
      ar: 'أنا د. كوكب. ثمّة هدف، ومهمّتك ببساطة أن تصوّب نحوه.',
    },
    {
      point: '[data-coach="pad"]',
      awaitTap: false,
      en: 'Drag across this pad, or use the arrow buttons below it. Both count exactly the same — neither is the easier way, and neither is scored differently.',
      ar: 'اسحب على هذه اللوحة، أو استعمل أزرار الأسهم تحتها. وكلاهما محسوب سواءً بسواء — فليس أحدهما الأيسر ولا يُحسب أحدهما بغير ما يُحسب به الآخر.',
    },
    /*
     * ⚠ THE TWIST, ANNOUNCED RATHER THAN DISCOVERED. Discovering it costs the
     * player their first several reaches to confusion instead of to adaptation.
     */
    {
      point: '[data-coach="pad"]',
      awaitTap: false,
      en: 'But the world is tilted. Your reach will not land where you aimed — it will land off to one side, by the same amount every time.',
      ar: 'لكنّ العالم مائل. فلن تحطّ ضربتك حيث صوّبت — بل تنحرف إلى جهة، بالقدر نفسه في كل مرّة.',
    },
    {
      point: '[data-coach="pad"]',
      awaitTap: false,
      en: 'Do not try to calculate the angle. Keep aiming straight at the target and let the error shrink on its own — your hand learns this far faster than your head does.',
      ar: 'ولا تحاول حساب الزاوية. بل داوم التصويب إلى الهدف مباشرةً ودع الخطأ يتقلّص وحده — فيدك تتعلّم هذا أسرع بكثير ممّا يتعلّمه عقلك.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'That is the mistake to avoid: aiming at where you want the shot to end up instead of at the target. It works for a few reaches and then stops, because your hand is quietly correcting underneath you and the two corrections fight.',
      ar: 'وهذا هو الخطأ الذي تتجنّبه: أن تصوّب إلى حيث تريد أن تنتهي الضربة بدل أن تصوّب إلى الهدف. فذلك ينفع في ضربات قليلة ثم يبطل، لأن يدك تصحّح في صمتٍ من تحتك، فيتصارع التصحيحان.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'Give it a handful of reaches and you will start landing on it without knowing how. You will not be able to say what you changed. That is what adaptation is.',
      ar: 'وامنحها ضرباتٍ قليلةً تبدأ تصيبه دون أن تدري كيف. ولن تستطيع أن تقول ما الذي غيّرته. وهذا هو التكيّف.',
    },
    /*
     * ⚠ SAID AS A PROMISE ABOUT THE FUTURE, so that when the washout block
     * arrives the player recognises it instead of feeling robbed at the end of a
     * run they had just started winning.
     */
    {
      point: '[data-coach="cue"]',
      awaitTap: false,
      en: 'Now here is what to expect at the END, so it does not ambush you. The tilt gets taken away — and you will suddenly miss the OTHER way, right after you had got good.',
      ar: 'وإليك الآن ما تتوقّعه في النهاية، لئلّا يباغتك. سيُرفع الميل — فتخطئ فجأةً في الاتجاه المعاكس، بعد أن كنت قد أتقنت.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'That is not the game cheating you. It is the proof your aim rebuilt itself around the mirror — you cannot miss backwards unless something in you had genuinely changed. Those last few reaches are the ones I am actually measuring. Your turn.',
      ar: 'وليس ذلك غدراً من اللعبة. بل هو البرهان على أن تصويبك أعاد بناء نفسه حول المرآة — إذ لا تخطئ إلى الخلف إلا وقد تغيّر فيك شيء حقّاً. وتلك الضربات الأخيرة هي ما أقيسه فعلاً. دورك.',
    },
  ],
};

export default MIRROR_WORLD_COACH;
