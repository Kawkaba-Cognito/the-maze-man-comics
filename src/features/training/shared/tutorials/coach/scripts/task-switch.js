/*
 * Task Switch's coach script (COACH-PLAN.md Phase 1).
 *
 * ⚠ THE CONSTRUCT IS THE COST OF SWITCHING, AND IT IS INVISIBLE FROM PLAYING.
 * Rogers & Monsell's finding is that the trial AFTER the rule changes is slower
 * — not because you failed, but because reconfiguring a rule takes time. A
 * player who does not know that reads their own hesitation as being bad at the
 * game, and the results screen then shows them a "switch cost" number with no
 * idea it is the measurement rather than a penalty.
 *
 * ⚠ IT ALSO HAS TO EXPLAIN THE FIXED KEYS, because they look like a mistake.
 * The obvious design relabels the buttons every trial; this one deliberately
 * does not, since a player who can read the answer off a button never holds a
 * rule at all. Until someone says that out loud, "left is red OR circle" reads
 * as a confusing interface rather than the point.
 *
 * ⚠ NO AWAIT STEP, DELIBERATELY. This lesson runs BEFORE the trial chain starts
 * — see TaskSwitchCoach for why — so there is no live trial to answer. An await
 * step here would wait for something that cannot happen.
 */
export const TASK_SWITCH_COACH = {
  id: 'task-switch@coach1',
  steps: [
    {
      point: '[data-coach="cue"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. This line is the question — answer the COLOUR, or answer the SHAPE. It changes without warning, so read it every single time.",
      ar: 'أنا د. كوكب. هذا السطر هو السؤال — أجب عن اللون، أو أجب عن الشكل. وهو يتغيّر دون إنذار، فاقرأه في كل مرة.',
    },
    {
      point: '[data-coach="keys"]',
      awaitTap: false,
      en: 'The keys never move: left is red or circle, right is blue or square. So a red square wants the LEFT key for colour and the RIGHT key for shape — same picture, different answer.',
      ar: 'المفتاحان لا يتحرّكان: اليسار أحمر أو دائرة، واليمين أزرق أو مربّع. فالمربّع الأحمر يريد اليسار في اللون واليمين في الشكل — الصورة ذاتها، والجواب مختلف.',
    },
    {
      point: '[data-coach="cue"]',
      awaitTap: false,
      /*
       * ⚠ "it gets shorter" IS SCOPED TO THIS TASK ON PURPOSE, and it is the one
       * line in all 65 steps that needed it. Switch cost genuinely shrinks with
       * practice ON the task, which is what this says. Unscoped, the same
       * sentence reads as a promise that your flexibility improves in life —
       * the transfer claim SCI-01 exists to keep out, and the FTC's actual
       * complaint against Lumosity. The whole app's posture is that practice
       * makes you better at the games; a tutorial must not quietly say more.
       */
      en: 'When the question flips, your last answer is a habit pulling the wrong way, and you will feel yourself hesitate. That pause IS what this game measures — it is not a mistake, and with practice at this task it gets shorter. Your turn.',
      ar: 'وحين ينقلب السؤال، تصير إجابتك السابقة عادةً تشدّك في الاتجاه الخطأ، فتشعر بتردّدك. هذا التردّد هو ما تقيسه اللعبة — وليس خطأً، وهو يقصر مع التمرّن على هذه المهمة نفسها. دورك.',
    },
  ],
};

export default TASK_SWITCH_COACH;
