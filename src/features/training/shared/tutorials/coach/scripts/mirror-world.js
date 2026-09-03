/*
 * Mirror World's coach script (COACH-PLAN.md Phase 3) — the hardest lesson in
 * the set to write, and the one most worth getting right.
 *
 * ⚠ THE CONSTRUCT IS VISUOMOTOR ADAPTATION, WHOSE SIGNATURE IS AN AFTEREFFECT.
 * The game rotates the mapping between where you aim and where the reach goes.
 * You adapt — and then, when the rotation is REMOVED in the washout block, you
 * miss in the opposite direction. That miss is not a mistake and not the game
 * breaking: it is the proof that your motor system rebuilt itself around the
 * mirror, and it is the actual measurement (`validate:mirror` asserts every run
 * ENDS with a washout block precisely because a run without one plays fine and
 * silently never shows it).
 *
 * A player who is not told this hits the washout block, suddenly misses
 * everything after finally getting good, and concludes the game cheated them at
 * the end. It is the single most misreadable moment in the training platform.
 *
 * ⚠ THE OTHER HALF IS "DO NOT THINK YOUR WAY THROUGH IT". Adaptation is
 * implicit; players who consciously compute an offset adapt more slowly and less
 * durably than those who simply keep reaching and let the error shrink. "Aim and
 * let it correct itself" is genuinely better advice than "work out the angle".
 *
 * ⚠ IT NAMES BOTH CONTROLS, and that is not politeness. This game once shipped
 * 156 levels that were unpassable through its direction-pad route while the drag
 * worked fine; the pad is a first-class way to play, and `validate:mirror`
 * asserts control parity on every level. A lesson that taught only dragging
 * would hide the accessible route from the people who need it.
 */
export const MIRROR_WORLD_COACH = {
  id: 'mirror-world@coach1',
  steps: [
    {
      point: '[data-coach="pad"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. Reach toward the target — drag across this pad, or use the arrow buttons below it. Both count exactly the same.",
      ar: 'أنا د. كوكب. صوِّب نحو الهدف — إمّا بالسحب على هذه اللوحة، أو بأزرار الأسهم تحتها. وكلاهما محسوب سواءً بسواء.',
    },
    {
      point: '[data-coach="pad"]',
      awaitTap: false,
      en: 'But the world is tilted: your reach will not land where you aimed. Do not try to calculate the angle — just keep reaching at the target and let the error shrink on its own. Your hand learns this faster than your head does.',
      ar: 'لكنّ العالم مائل: فلن تحطّ ضربتك حيث صوّبت. ولا تحاول حساب الزاوية — بل داوم التصويب إلى الهدف ودع الخطأ يتقلّص وحده. فيدك تتعلّم هذا أسرع من عقلك.',
    },
    /*
     * ⚠ THE ONE THAT MATTERS. Said as a promise about the future, so that when
     * the washout block arrives the player recognises it instead of feeling
     * robbed at the end of a run they had just started winning.
     */
    {
      point: '[data-coach="cue"]',
      awaitTap: false,
      en: 'And here is what to expect at the END. The tilt gets taken away — and you will suddenly miss the other way, right after you had got good. That is not the game cheating you. It is proof your aim rebuilt itself around the mirror, and it is the thing I am actually measuring. Your turn.',
      ar: 'وإليك ما تتوقّعه في النهاية. سيُرفع الميل — فتخطئ فجأة في الاتجاه المعاكس، بعد أن كنت قد أتقنت. وليس ذلك غدراً من اللعبة. بل هو برهان أن تصويبك أعاد بناء نفسه حول المرآة، وهو ما أقيسه حقاً. دورك.',
    },
  ],
};

export default MIRROR_WORLD_COACH;
