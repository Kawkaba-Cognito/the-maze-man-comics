/*
 * Spaceship / Car Park's coach script. (Folder is `train-switch`: it was
 * re-themed from trains and the folder kept — see the names table in CLAUDE.md.)
 *
 * ⚠ THE CONSTRUCT IS DIVIDED ATTENTION, AND THE GAME LOOKS LIKE A REFLEX TEST.
 * Anyone can set one junction. The measurement starts when a second is already
 * on its way while you are still setting the first, and the feeling that
 * produces — being pulled two ways — reads as failing rather than as the thing
 * being scored.
 *
 * ⚠ AND ONE RULE HAS TO BE SAID OUT LOUD OR IT READS AS A BROKEN BUTTON: a
 * junction the car has already passed cannot be changed. Tapping it does
 * nothing, silently, which is indistinguishable from an unresponsive control.
 *
 * ── 2026-09-03: three steps became eight, on the spine in COACH-PLAN.md ──
 * The old third step carried the construct, the strategy AND the reassurance in
 * one paragraph. Split, so each has its own moment.
 *
 * ⚠ NO AWAIT STEP: no `satisfiedFor` predicate, and the simulation is held while
 * the lesson is open, so no car is approaching a junction to set.
 *
 * ⚠ ONLY THE JUNCTION BUTTONS ARE POINTED AT; everything else is `point: null`.
 * The board here is a full-screen 3D scene, so an anchor on it would put the
 * hand in the middle of the viewport indicating nothing in particular — the
 * 0.08-ratio failure measured across the platform on 2026-09-03. The switches
 * are a real, small, specific target and they are the game's one control, so
 * they are the only thing worth a hand.
 */
export const TRAIN_SWITCH_COACH = {
  id: 'train-switch@coach2',
  steps: [
    {
      point: null,
      awaitTap: false,
      en: "I'm Dr Kawkab. Cars come down the track, and each one has a colour.",
      ar: 'أنا د. كوكب. تنزل السيارات على المسار، ولكلٍّ منها لون.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'Each has to end up in the bay of its own colour. That is the only thing being asked of you here.',
      ar: 'وعلى كلٍّ منها أن تنتهي إلى الموقف الذي بلونها. وهذا وحده ما يُطلب منك هنا.',
    },
    {
      point: '[data-coach="switches"]',
      awaitTap: false,
      en: 'Your one control is here. Tap a junction and it points the other way — that is the whole interface.',
      ar: 'وأداتك الوحيدة هي المفترق. المسه فيتحوّل إلى الجهة الأخرى — وهذه هي الواجهة كلّها.',
    },
    /*
     * ⚠ SAID AS A RULE, NOT A HINT. A control that silently does nothing is
     * indistinguishable from a broken one, and a player who concludes the game
     * is buggy stops trusting everything else it tells them.
     */
    {
      point: '[data-coach="switches"]',
      awaitTap: false,
      en: 'Set it BEFORE the car reaches it. Once a car is past, that junction is settled — tapping it then does nothing at all, and that is a rule of the game, not a button that failed.',
      ar: 'واضبطه قبل أن تبلغه السيارة. فإذا تجاوزته السيارة فقد استقرّ أمره — ولمسه حينئذٍ لا يفعل شيئاً البتّة، وتلك قاعدة من قواعد اللعبة لا زرّ معطّل.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'And here is where it actually gets hard: while you are setting one junction, the next car is already on its way to another.',
      ar: 'وهنا يشتدّ الأمر حقاً: فبينما تضبط مفترقاً واحداً، تكون السيارة التالية في طريقها إلى غيره.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'So work far to near. Set the distant junctions early, while you have room, and leave yourself only the close ones to handle under pressure.',
      ar: 'فاعمل من البعيد إلى القريب. اضبط المفارق البعيدة مبكّراً ما دام لديك متّسع، ولا تُبقِ لنفسك تحت الضغط إلا القريب.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'That feeling of being pulled two ways at once is not a sign you are doing it wrong. It IS what this game measures — how well you hold two jobs at the same time.',
      ar: 'وذلك الشعور بأنك مشدود في اتجاهين معاً ليس دليلاً على أنك تخطئ. بل هو ما تقيسه هذه اللعبة — كم تُحسن حمل مهمّتين في وقت واحد.',
    },
    {
      point: null,
      awaitTap: false,
      en: 'It grows by adding cars and by shortening the gap between them, never by asking anything cleverer of you. Keep your eyes ahead of the lead car rather than on it. Your turn.',
      ar: 'وهي تشتدّ بزيادة السيارات وتقصير المسافة بينها، لا بأن تطلب منك شيئاً أذكى. فاجعل نظرك أمام السيارة السابقة لا عليها. دورك.',
    },
  ],
};

export default TRAIN_SWITCH_COACH;
