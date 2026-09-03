/*
 * Car Park's coach script (COACH-PLAN.md Phase 3).
 *
 * ⚠ THE CONSTRUCT IS DIVIDED ATTENTION, AND FEELING STRETCHED IS THE POINT.
 * Cars arrive continuously, so setting a junction for the one in front of you
 * always happens while the next is already on its way. Players read that
 * pressure as the game being unfair or themselves being slow; it is the load
 * being measured, and saying so changes how a beginner interprets their own
 * performance.
 *
 * ⚠ AND THE TIMING RULE HAS TO BE STATED: a junction must be set BEFORE the car
 * reaches it. Tapping a switch a car has already passed does nothing, which
 * looks exactly like an unresponsive control rather than a rule.
 *
 * ⚠ NO AWAIT STEP. The simulation is held while this is open (see the frame
 * guard in index.jsx), so no car is moving toward a junction to route — there is
 * nothing to wait for that could happen.
 */
export const TRAIN_SWITCH_COACH = {
  id: 'train-switch@coach1',
  steps: [
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. Cars come down the track, each one a colour, and each has to reach the bay of its own colour. Tap a junction to change which way it points.",
      ar: 'أنا د. كوكب. تنزل السيارات على المسار، لكلٍّ منها لون، وعلى كلٍّ أن تبلغ الموقف الذي بلونها. المس المفترق لتغيّر وجهته.',
    },
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: 'Set the junction BEFORE the car gets there. Once it is past, it is past — tapping then does nothing, and that is a rule, not a broken button.',
      ar: 'واضبط المفترق قبل أن تبلغه السيارة. فإذا تجاوزته فقد فات الأوان — ولمسه حينئذ لا يفعل شيئاً، وتلك قاعدة لا زرّ معطّل.',
    },
    {
      point: '[data-coach="board"]',
      awaitTap: false,
      en: 'And here is the whole difficulty: while you are setting one, the next is already on its way. Look ahead — set the far junctions early, so the near ones are all that is left. Feeling pulled two ways is what this measures, not a sign you are doing it wrong. Your turn.',
      ar: 'وهنا تكمن الصعوبة كلّها: فبينما تضبط واحداً، تكون التالية في طريقها. انظر إلى الأمام — واضبط المفارق البعيدة مبكّراً حتى لا يبقى إلا القريب. والشعور بأنك مشدود في اتجاهين هو ما تقيسه اللعبة، لا دليلاً على أنك تخطئ. دورك.',
    },
  ],
};

export default TRAIN_SWITCH_COACH;
