/*
 * Task Switch's coach script.
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
 * ── 2026-09-03: three steps became eight, on the spine in COACH-PLAN.md ──
 * All three old steps were dense paragraphs; the key explanation and its worked
 * example arrived in one breath, and the final step carried the hesitation, the
 * reassurance and the scoping caveat together.
 *
 * ⚠ NO AWAIT STEP, DELIBERATELY. This lesson runs BEFORE the trial chain starts
 * — see TaskSwitchCoach for why — so there is no live trial to answer. An await
 * step here would wait for something that cannot happen.
 */
export const TASK_SWITCH_COACH = {
  id: 'task-switch@coach2',
  steps: [
    {
      point: '[data-coach="cue"]',
      awaitTap: false,
      en: "I'm Dr Kawkab. This line is the question — answer the COLOUR, or answer the SHAPE.",
      ar: 'أنا د. كوكب. هذا السطر هو السؤال — أجب عن اللون، أو أجب عن الشكل.',
    },
    {
      point: '[data-coach="cue"]',
      awaitTap: false,
      en: 'It changes without warning and there is no pattern to it, so read it every single time. Guessing that it stayed the same is the most expensive habit here.',
      ar: 'وهو يتغيّر دون إنذار ولا نسق له، فاقرأه في كل مرّة. وظنّك أنه بقي كما كان أغلى العادات هنا كلفةً.',
    },
    {
      point: '[data-coach="stim"]',
      awaitTap: false,
      en: 'This is what you are answering about. One picture, and it always has both a colour and a shape — which is why the question has to tell you which one I want.',
      ar: 'وهذه هي التي تجيب عنها. صورة واحدة، ولها دائماً لونٌ وشكل — ولهذا وجب أن يخبرك السؤال أيّهما أريد.',
    },
    {
      point: '[data-coach="keys"]',
      awaitTap: false,
      en: 'The keys never move: left is red or circle, right is blue or square.',
      ar: 'والمفتاحان لا يتحرّكان: اليسار أحمر أو دائرة، واليمين أزرق أو مربّع.',
    },
    {
      point: '[data-coach="keys"]',
      awaitTap: false,
      en: 'So a red square wants the LEFT key for colour and the RIGHT key for shape. Same picture, different answer — that is the machine this game is built out of.',
      ar: 'فالمربّع الأحمر يريد اليسار في اللون واليمين في الشكل. الصورة ذاتها والجواب مختلف — وهذه هي الآلة التي بُنيت منها هذه اللعبة.',
    },
    {
      point: '[data-coach="keys"]',
      awaitTap: false,
      en: 'The labels never change on purpose. If the buttons told you the answer you would never have to hold the rule in mind — and holding the rule is the only thing being measured.',
      ar: 'ولا تتغيّر اللافتات عن قصد. فلو أخبرتك الأزرار بالجواب لما لزمك أن تحفظ القاعدة في ذهنك — وحفظُ القاعدة هو وحده ما يُقاس.',
    },
    {
      point: '[data-coach="cue"]',
      awaitTap: false,
      en: 'When the question flips, your last answer is a habit pulling the wrong way, and you will feel yourself hesitate for a moment.',
      ar: 'وحين ينقلب السؤال، تصير إجابتك السابقة عادةً تشدّك في الاتجاه الخطأ، فتشعر بتردّدٍ لحظةً.',
    },
    {
      /*
       * ⚠ "it gets shorter" IS SCOPED TO THIS TASK ON PURPOSE, and it is the one
       * line in the whole platform that needs it. Switch cost genuinely shrinks
       * with practice ON the task, which is what this says. Unscoped, the same
       * sentence reads as a promise that your flexibility improves in life — the
       * transfer claim SCI-01 exists to keep out, and the FTC's actual complaint
       * against Lumosity. The app's posture is that practice makes you better at
       * the games; a tutorial must not quietly say more.
       */
      point: null,
      awaitTap: false,
      en: 'That pause IS what this game measures. It is not a mistake and it is not slowness — everybody has it, and with practice at this task it gets shorter. Your turn.',
      ar: 'وهذا التردّد هو ما تقيسه اللعبة. ليس خطأً ولا بطئاً — فالكلّ يجده، وهو يقصر مع التمرّن على هذه المهمّة نفسها. دورك.',
    },
  ],
};

export default TASK_SWITCH_COACH;
