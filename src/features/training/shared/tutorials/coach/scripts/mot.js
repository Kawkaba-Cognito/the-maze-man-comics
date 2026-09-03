/*
 * Target Tracking's coach script (COACH-PLAN.md Phase 3).
 *
 * ⚠ THE CONSTRUCT IS TRACKING CAPACITY, AND THE WINNING STRATEGY IS
 * COUNTER-INTUITIVE: do NOT look at the dots. Multiple-object tracking is served
 * by distributed attention, and players who chase each target with their eyes
 * lose the others while doing it. Told to "spread out and hold them all loosely
 * with your gaze in the middle", people track measurably more.
 *
 * A player who does not know this fixates, drops to two, and concludes their
 * attention is poor — when they were using the wrong mechanism.
 *
 * ⚠ THE LESSON RUNS BEFORE THE FIRST CUE. This game is a phase machine (cue →
 * move → respond) driven by timers; the alternative was guarding each of them,
 * and the dots would be flashing behind the bubble while the player read about
 * them. Nothing runs instead — see the hold in index.jsx.
 */
export const MOT_COACH = {
  id: 'mot@coach1',
  steps: [
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. In a moment a few of these dots will flash. Those are yours — then everything starts moving and they stop looking any different.",
      ar: 'أنا د. كوكب. بعد لحظة ستومض بعض هذه النقاط. تلك نقاطك — ثم يتحرّك الجميع فلا يعود يميّزها شيء.',
    },
    /*
     * ⚠ THE ONE THAT MATTERS. Phrased as an instruction about where to put the
     * EYES, because "pay attention to all of them" is what players already think
     * they are doing while they chase one.
     */
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: 'Here is the trick: do not chase them with your eyes. Rest your gaze in the middle of the field and hold them all loosely at once. Everyone who follows one dot at a time loses the others — and it feels like concentrating.',
      ar: 'وإليك الحيلة: لا تطاردها بعينيك. أرِح نظرك في وسط الميدان واحتفظ بها جميعاً معاً بلا شدّ. فكل من يتتبّع نقطة واحدة يفقد البقيّة — وهو يشعر أنه يركّز.',
    },
    {
      point: '[data-coach="instruction"]',
      awaitTap: false,
      en: 'When everything freezes, tap the ones that were yours. Losing one or two is normal — this is measuring how many you can hold, so it is supposed to reach your limit. Your turn.',
      ar: 'وحين يتجمّد كل شيء، المس ما كان لك. وفقدان واحدة أو اثنتين أمر طبيعي — فالمقصود قياس كم تستطيع أن تحمل، ولذلك يُفترض أن يبلغ حدّك. دورك.',
    },
  ],
};

export default MOT_COACH;
