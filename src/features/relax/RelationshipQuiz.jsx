import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import PracticeShell, { PracticeHero, SUB, FAINT } from './PracticeShell';
import { QUIZ_CSS, LikertRow, KawkabSay, ScenarioChoice, QuestionExample, DeeperScience } from './quizShared';
import { markWellbeingPracticeDone } from './habitState';
import SafetyNote, { SAFETY_CSS } from './SafetyNote';

/*
 * Attachment Style quiz — items adapted from the two dimensions measured by
 * the Experiences in Close Relationships scale family (ECR-R, Fraley, Waller
 * & Brennan, 2000; short form ECR-S, Wei, Russell, Mallinckrodt & Vogel,
 * 2007): Attachment Anxiety and Attachment Avoidance. Every item here is
 * scored in the same direction per dimension (no reverse-scoring), a
 * deliberate simplification for this quick, adapted version — see the
 * in-app disclaimer. The 2 scores map onto Bartholomew & Horowitz's (1991)
 * 4-style model: secure / anxious-preoccupied / dismissive-avoidant /
 * fearful-avoidant. Kawkab's lines and the 3 scenario experiments below are
 * an experiential layer around that score and never feed it.
 */

const ACCENT = 'var(--rx-relationships-core)';
const ACCENT_LIT = 'var(--rx-relationships-lit)';
const STORAGE_KEY = 'rx_relationship_v1';
const MIDPOINT_AT = 6;

/*
 * ⚠ HALF THE ITEMS ARE REVERSE-KEYED NOW, AND THAT IS A CORRECTNESS FIX RATHER
 * THAN A STYLE ONE (2026-09-07).
 *
 * Every item used to point the same way: agreeing always pushed a score UP.
 * On a scale like this, that hands the result to acquiescence — the ordinary
 * tendency to agree with whatever a questionnaire says. A yes-biased respondent
 * scored high on anxiety AND high on avoidance, and the classifier below then
 * cut at the raw midpoint, so two independent errors pushed the same people
 * into the same corner: fearful-avoidant, the rarest and most alarming of the
 * four labels. The screen then told them most adults are secure.
 *
 * The real ECR scales are balanced for exactly this reason. Agreeing with `rev`
 * items now LOWERS the dimension, so a flat "agree with everything" response
 * lands mid-scale on both axes, which is the honest answer to a meaningless
 * response set.
 *
 * ⚠ `you`/`them` ARE NOT HARD-CODED TO A ROMANTIC PARTNER. The intro asks the
 * user to pick who they are answering about (see TARGETS): the items used to
 * say "my partner" while the instructions said "someone you're close to", which
 * left a large part of an EN/AR audience — anyone not currently dating — with
 * no referent at all, answering about a hypothetical. Same dimensions, chosen
 * target, which is what the ECR-RS was built to do (Fraley et al., 2011).
 */
const ANXIETY_ITEMS = [
  { id: 'a1', rev: false, en: "I worry that they won't care about me as much as I care about them.", ar: 'أقلق من ألّا يهتموا بي بقدر اهتمامي بهم.',
    example: "You notice you're the one who reaches out more often, and it makes you wonder if they feel the same way.",
    exampleAr: 'تلاحظ أنك من يبادر بالتواصل غالباً، فتتساءل إن كانوا يشعرون بالمثل.' },
  { id: 'a2', rev: false, en: 'I need a lot of reassurance that I am cared about.', ar: 'أحتاج إلى الكثير من الطمأنة بأنني محلّ اهتمام.',
    example: 'Being told once doesn\'t quite settle it — part of you wants to hear it again, or looks for other signs.',
    exampleAr: 'أن تُقال لك مرة واحدة لا يكفي لتطمئن — جزء منك يريد سماعها مجدداً، أو يبحث عن علامات أخرى.' },
  { id: 'a3', rev: false, en: "I worry about being left by people I'm close to.", ar: 'أقلق من أن يتركني من أنا مقرّب منهم.',
    example: "Even when things are going fine, part of you quietly braces for it to end.",
    exampleAr: 'حتى حين تسير الأمور جيداً، جزء منك يتحصّن بصمت لاحتمال انتهائها.' },
  { id: 'a4', rev: false, en: 'I get frustrated when they are not available when I need them.', ar: 'أشعر بالإحباط عندما لا يكونون متاحين حين أحتاجهم.',
    example: "They don't reply right away, and irritation shows up before any explanation does.",
    exampleAr: 'لا يردّون على الفور، فيظهر الانزعاج قبل أن يصلك أي تفسير.' },
  { id: 'a5', rev: true, en: 'I rarely worry about where I stand with them.', ar: 'نادراً ما أقلق بشأن مكانتي لديهم.',
    example: 'A gap in contact passes without you reading anything into it.',
    exampleAr: 'تمرّ فترة انقطاع في التواصل دون أن تُحمّلها أي معنى.' },
  { id: 'a6', rev: true, en: 'When they are quiet or distant, I can let it be without assuming the worst.', ar: 'حين يصمتون أو يبتعدون، أستطيع تقبّل ذلك دون افتراض الأسوأ.',
    example: 'They seem off, and your first thought is that they have had a hard day — not that something is wrong between you.',
    exampleAr: 'يبدون غير على ما يرام، فأول ما يخطر لك أن يومهم كان صعباً — لا أن هناك خطباً بينكما.' },
];
const AVOIDANCE_ITEMS = [
  { id: 'v1', rev: false, en: 'I prefer not to show them how I really feel deep down.', ar: 'أفضّل ألّا أُظهر لهم ما أشعر به فعلاً في أعماقي.',
    example: "Something upset you, but you'd rather work through it alone than explain the whole thing out loud.",
    exampleAr: 'أزعجك أمر ما، لكنك تفضّل معالجته بمفردك بدلاً من شرحه بصوت مسموع.' },
  { id: 'v2', rev: false, en: 'I get uneasy when they want to be very close emotionally.', ar: 'أشعر بعدم ارتياح عندما يريدون قرباً عاطفياً كبيراً.',
    example: 'They say "we can tell each other anything" — and something in you tightens instead of warms.',
    exampleAr: 'يقولون "نستطيع إخبار بعضنا بأي شيء" — فيتوتّر شيء بداخلك بدلاً من أن يدفأ.' },
  { id: 'v3', rev: false, en: 'I prefer not to depend on them.', ar: 'أفضّل ألّا أعتمد عليهم.',
    example: "You'd rather struggle with a hard problem alone than ask them to help you with it.",
    exampleAr: 'تفضّل المكافحة بمفردك في مشكلة صعبة على أن تطلب منهم المساعدة فيها.' },
  { id: 'v4', rev: true, en: 'It helps to turn to them when something is wrong.', ar: 'يساعدني أن ألجأ إليهم حين يسوء شيء ما.',
    example: 'A bad day happens and going to them is the obvious move, not a last resort.',
    exampleAr: 'يمرّ يوم سيّئ فيكون اللجوء إليهم هو الخيار البديهي، لا الملاذ الأخير.' },
  { id: 'v5', rev: true, en: 'I find it easy to be close to them.', ar: 'أجد من السهل أن أكون قريباً منهم.',
    example: 'Closeness feels like the natural state of things rather than something you have to manage.',
    exampleAr: 'يبدو القرب هو الحالة الطبيعية للأمور، لا شيئاً عليك إدارته.' },
  { id: 'v6', rev: true, en: 'I talk to them about my worries and the harder things.', ar: 'أتحدّث معهم عن مخاوفي وعن الأمور الأصعب.',
    example: 'Not just how your day went — the fears and doubts get said out loud too.',
    exampleAr: 'ليس فقط كيف كان يومك — بل تُقال المخاوف والشكوك بصوت مسموع أيضاً.' },
];

/*
 * Who the user is answering about. Attachment is relationship-specific — the
 * same person is commonly more secure with a friend than with a partner — so
 * the target is chosen rather than assumed, and named back to them on the
 * results screen so the score is never read as a verdict on their whole self.
 */
export const TARGETS = [
  { id: 'partner', icon: '💞', en: 'A current partner', ar: 'شريك حالي' },
  { id: 'ex', icon: '🕰️', en: 'A past relationship', ar: 'علاقة سابقة' },
  { id: 'friend', icon: '🤝', en: 'A close friend', ar: 'صديق مقرّب' },
  { id: 'family', icon: '🏠', en: 'A parent or family member', ar: 'أحد الوالدين أو من العائلة' },
];
// Interleaved anxiety/avoidance so the two dimensions aren't obvious from item order.
const ITEMS = ANXIETY_ITEMS.flatMap((a, i) => [
  { ...a, dim: 'anxiety' },
  { ...AVOIDANCE_ITEMS[i], dim: 'avoidance' },
]);

const STYLES = {
  secure: {
    color: '#6fae7a', en: 'Secure', ar: 'آمن',
    descEn: 'Comfortable with closeness and comfortable being alone — trusting that others will be there without needing constant proof of it.',
    descAr: 'مرتاح للقرب العاطفي ومرتاح أيضاً للاستقلالية — يثق بأن الآخرين سيكونون حاضرين دون حاجة لإثبات مستمر لذلك.',
    tipEn: 'Your steadiness is a real resource for partners under stress. Keep naming needs directly — it costs you little and helps everyone around you calibrate.',
    tipAr: 'ثباتك مورد حقيقي لشريكك في أوقات الضغط. استمر في التعبير عن احتياجاتك بوضوح — فذلك لا يكلّفك كثيراً ويساعد من حولك على فهمك بدقة.',
    takeawayEn: "In plain terms: closeness feels safe to you, and so does being alone — you don't need constant proof that people are still there.",
    takeawayAr: 'بعبارة بسيطة: القرب يشعرك بالأمان، وكذلك الاستقلالية — لا تحتاج إلى دليل مستمر على أن الآخرين لا يزالون موجودين.',
    deeperEn: "\"Secure\" isn't a bonus you're born with for good — most secure adults report at least one earlier relationship or period of insecurity that resolved over time (Mickelson, Kessler & Shaver, 1997). Consistency with a caregiver, partner, or therapist is what builds and maintains it, not luck.",
    deeperAr: '"الآمن" ليس ميزة تُولد بها إلى الأبد — يذكر معظم البالغين الآمنين علاقة سابقة واحدة على الأقل أو فترة من عدم الأمان تحسّنت مع الوقت (Mickelson, Kessler & Shaver, 1997). الثبات مع مقدّم رعاية أو شريك أو معالج هو ما يبنيه ويحافظ عليه، لا الحظ.',
  },
  anxious: {
    color: '#c9a24b', en: 'Anxious-Preoccupied', ar: 'قلق-منشغل',
    descEn: "Craves closeness and reassurance, and reads a partner's distance or silence as a warning sign — even when nothing is actually wrong.",
    descAr: 'يتوق للقرب والطمأنة، ويفسّر بُعد الشريك أو صمته كعلامة خطر — حتى عندما لا توجد مشكلة فعلية.',
    tipEn: 'Try building a short pause before you seek reassurance — a few minutes of self-soothing (a walk, a breath practice) often reveals the worry was louder than the evidence for it.',
    tipAr: 'حاول أن تمنح نفسك وقفة قصيرة قبل طلب الطمأنة — دقائق قليلة من تهدئة الذات (كالمشي أو ممارسة التنفّس) غالباً ما تكشف أن القلق كان أعلى صوتاً من الدليل عليه.',
    takeawayEn: "In plain terms: you feel connection deeply, and small silences can feel loud — that's not neediness, it's a very tuned-in nervous system.",
    takeawayAr: 'بعبارة بسيطة: تشعر بالارتباط بعمق، وقد تبدو السكتات الصغيرة صاخبة بالنسبة لك — هذا ليس تعلّقاً مفرطاً، بل جهاز عصبي شديد الحساسية.',
    /* ⚠ "OFTEN FORMS IN" BECAME "FOR SOME PEOPLE", HERE AND IN THE TWO BELOW.
       These passages read, to the person holding the phone, as a finding about
       THEIR history — delivered by twelve self-report items that asked nothing
       about their childhood. The link between recalled caregiving and adult
       attachment is real but modest, and in a family-central culture "your
       parents did this" lands considerably harder than the English original
       intends. The developmental explanation stays, because it is the
       compassionate part and it works; what changes is that it is offered as
       one common route rather than as a reading of their life. */
    deeperEn: 'For some people this pattern traces back to care that was loving but hard to predict — sometimes warmly available, sometimes not. A nervous system that grew up in that learns closeness needs watching to keep. For others it comes from a later relationship entirely, and for some there is no clean story at all. What it is not is a flaw you were handed.',
    deeperAr: 'لدى بعض الناس يعود هذا النمط إلى رعاية كانت محبّة لكن يصعب توقّعها — متاحة بدفء أحياناً وغائبة أحياناً. الجهاز العصبي الذي ينشأ في ذلك يتعلّم أن القرب يحتاج مراقبة للحفاظ عليه. ولدى آخرين ينشأ من علاقة لاحقة تماماً، ولدى بعضهم لا توجد قصة واضحة إطلاقاً. لكنه ليس عيباً وُرِّثتَه.',
  },
  dismissive: {
    color: '#5aa9c8', en: 'Dismissive-Avoidant', ar: 'رافض-متجنّب',
    descEn: 'Values independence highly and tends to keep emotional distance, often experiencing closeness itself — not the partner — as the main pressure.',
    descAr: 'يقدّر الاستقلالية كثيراً ويميل للحفاظ على مسافة عاطفية، وغالباً ما يشعر بأن القرب العاطفي نفسه — لا الشريك — هو مصدر الضغط.',
    tipEn: "Independence is a real strength; the skill worth adding is naming a feeling out loud before you've fully processed it alone — partners can't calibrate to a door that's always closed.",
    tipAr: 'الاستقلالية ميزة حقيقية؛ المهارة التي تستحق الإضافة هي التعبير عن شعورك بصوت مسموع قبل معالجته كاملاً بمفردك — فالشريك لا يستطيع فهم باب مغلق دائماً.',
    takeawayEn: 'In plain terms: you value your independence and keep your inner world to yourself — closeness is welcome, just on your own terms.',
    takeawayAr: 'بعبارة بسيطة: تقدّر استقلاليتك وتحتفظ بعالمك الداخلي لنفسك — القرب مرحّب به، لكن بشروطك أنت.',
    /* ⚠ CITATION CORRECTED (2026-09-07): this was attributed to Fraley & Shaver
       (1997), which is the airport-separation study. The finding described here
       — self-reported calm alongside a measurable physiological stress response
       — is the deactivation work, Dozier & Kobak (1992). */
    deeperEn: "For some people self-reliance became the safer strategy early on, when asking for comfort reliably did not bring it. Adults with this style often report feeling fine on questionnaires while their body still shows a measurable stress response underneath — so \"I'm fine\" can be genuinely felt and physiologically incomplete at the same time (Dozier & Kobak, 1992).",
    deeperAr: 'لدى بعض الناس أصبح الاعتماد على الذات هو الاستراتيجية الأكثر أماناً مبكراً، حين كان طلب العزاء لا يأتي به عادةً. وغالباً ما يشعر البالغون بهذا النمط بأنهم "بخير" في الاستبيانات، بينما يُظهر الجسد استجابة توتّر قابلة للقياس تحت السطح — أي أن "أنا بخير" قد تكون شعوراً صادقاً وغير مكتمل فسيولوجياً في آن واحد (Dozier & Kobak, 1992).',
  },
  fearful: {
    color: '#a06fae', en: 'Fearful-Avoidant', ar: 'خائف-متجنّب',
    descEn: 'Wants closeness but also braces against it — often from a push-pull of wanting connection while expecting it to hurt.',
    descAr: 'يرغب في القرب لكنه يتحصّن منه أيضاً — غالباً بسبب صراع بين الرغبة في الاتصال العاطفي وتوقّع أن يجلب الألم.',
    tipEn: 'This pattern responds especially well to a patient, consistent partner and, often, therapy focused specifically on relationships — both give the nervous system repeated proof that closeness can be safe.',
    tipAr: 'هذا النمط يستجيب بشكل خاص لشريك صبور وثابت، وغالباً للعلاج النفسي المرَكَّز على العلاقات — كلاهما يمنح الجهاز العصبي أدلّة متكرّرة على أن القرب يمكن أن يكون آمناً.',
    takeawayEn: 'In plain terms: part of you wants closeness, and part of you braces for it to hurt — both parts make sense together.',
    takeawayAr: 'بعبارة بسيطة: جزء منك يريد القرب، وجزء آخر يتحصّن من أن يؤلمه — وكلا الجزأين منطقي معاً.',
    /* ⚠ It used to open "the least common and MOST RESEARCHED of the four" —
       self-contradictory in one sentence, and false: secure and anxious are far
       more researched. The Arabic also carried a typo ("الأنمط"). */
    deeperEn: 'This is the least common of the four, and for some people it traces to relationships where the same person who gave comfort was also, at times, a source of fear or unpredictability. It tends to respond well to therapy focused on relationships — specifically because both fears (of closeness, and of being alone) get addressed together, rather than one being treated as "the real problem."',
    deeperAr: 'هذا أقل الأنماط الأربعة شيوعاً، ولدى بعض الناس يعود إلى علاقات كان فيها الشخص نفسه الذي يمنح العزاء مصدراً للخوف أو عدم القدرة على التنبؤ في أحيان أخرى. ويستجيب عادةً استجابة جيدة للعلاج النفسي المرَكَّز على العلاقات — تحديداً لأن كلا الخوفين (من القرب، ومن الوحدة) يُعالَجان معاً، بدلاً من اعتبار أحدهما "المشكلة الحقيقية".',
  },
};

// 3 short scenarios using the same paradigm Collins (1996) used in the lab:
// give people an ambiguous relationship moment and see how they explain it.
// Not scored — a felt echo of the quiz result, tallied for the results recap.
const SCENARIOS = [
  {
    id: 'cancel',
    kawkabEn: 'Quick experiment: your partner cancels your plans last-minute with a short, vague text.',
    kawkabAr: 'تجربة سريعة: يُلغي شريكك خططكما في اللحظة الأخيرة برسالة نصية قصيرة وغامضة.',
    questionEn: "What's your gut reaction?", questionAr: 'ما ردّ فعلك الغريزي؟',
    options: [
      { id: 'secure', en: "Something probably came up — I'll ask about it later.", ar: 'على الأرجح طرأ أمر ما — سأسأله عن ذلك لاحقاً.' },
      { id: 'anxious', en: 'They must be losing interest in me.', ar: 'لا بدّ أنه يفقد اهتمامه بي.' },
      { id: 'avoidant', en: "Fine — I've got plenty else going on anyway.", ar: 'لا بأس — لديّ ما يكفي لأشغل به نفسي على أي حال.' },
    ],
    reactionEn: 'This is exactly the kind of ambiguous moment attachment researchers use in the lab — the same cancelled plan, three very different honest reads (Collins, 1996).',
    reactionAr: 'هذه بالضبط اللحظة الغامضة التي يستخدمها باحثو التعلّق في المختبر — نفس الخطط الملغاة، لكن ثلاث قراءات صادقة مختلفة تماماً (Collins, 1996).',
  },
  {
    id: 'reply',
    kawkabEn: 'Another: you sent a normal text 3 hours ago. Still no reply — but they just posted something online.',
    kawkabAr: 'أخرى: أرسلت رسالة عادية منذ ٣ ساعات. لا رد بعد — لكنه نشر للتو شيئاً على مواقع التواصل.',
    questionEn: "What's your gut reaction?", questionAr: 'ما ردّ فعلك الغريزي؟',
    options: [
      { id: 'secure', en: "They're just busy — no big deal.", ar: 'إنه مشغول فقط — لا شيء يستدعي القلق.' },
      { id: 'anxious', en: 'Did I do something wrong?', ar: 'هل فعلت شيئاً خاطئاً؟' },
      { id: 'avoidant', en: "Whatever — I don't need instant replies anyway.", ar: 'لا يهم — لست بحاجة لردود فورية أصلاً.' },
    ],
    reactionEn: 'Same ambiguous gap, three different stories a mind can tell. Collins (1996) found the story you land on — not the label — is what predicts the distress and conflict that follow.',
    reactionAr: 'نفس الفجوة الغامضة، لكن ثلاث قصص مختلفة يمكن للعقل أن يرويها. وجد Collins (1996) أن القصة التي تختارها — لا التصنيف نفسه — هي ما يتنبّأ بالضيق والتوتر اللاحق.',
  },
  {
    id: 'quiet',
    kawkabEn: 'Last one: your partner is unusually quiet and distracted over dinner.',
    kawkabAr: 'الأخيرة: يبدو شريكك هادئاً وشارد الذهن بشكل غير معتاد أثناء العشاء.',
    questionEn: "What's your gut reaction?", questionAr: 'ما ردّ فعلك الغريزي؟',
    options: [
      { id: 'secure', en: "I'll just ask what's on their mind.", ar: 'سأسأله ببساطة عمّا يشغل باله.' },
      { id: 'anxious', en: "Something's wrong between us.", ar: 'هناك خطب ما بيننا.' },
      { id: 'avoidant', en: "I'll leave it — not going to push.", ar: 'سأتركه — لن أضغط عليه.' },
    ],
    reactionEn: 'Notice the pattern across all 3 — that instinct is your working model of attachment showing up in real time.',
    reactionAr: 'لاحظ النمط عبر التجارب الثلاث — هذا الحدس هو نموذجك الداخلي للتعلّق يظهر أمامك في الزمن الحقيقي.',
  },
];
const SCENARIO_TAG_LABEL = {
  secure: { en: STYLES.secure.en, ar: STYLES.secure.ar },
  anxious: { en: STYLES.anxious.en, ar: STYLES.anxious.ar },
  avoidant: { en: 'Avoidant', ar: 'متجنّب' },
};
// Which discrete style a scenario's "avoidant" tally maps to, for the match check.
const AVOIDANT_STYLES = new Set(['dismissive', 'fearful']);

const TEXT = {
  en: {
    title: 'Attachment Style',
    meta: '12 questions · about 2 minutes',
    cite: 'Items are adapted from the two dimensions measured by the Experiences in Close Relationships scale family (ECR-R, Fraley, Waller & Brennan, 2000; short form: Wei et al., 2007), with a choosable relationship target as in the ECR-RS (Fraley et al., 2011). Adapted, not the original instrument — so treat the result as a conversation starter, not a score.',
    disclaimer: 'For self-reflection, not a clinical diagnosis.',
    kawkabIntro: "Hi, I'm Kawkab! I'm not a therapist, and this isn't a diagnosis — just an honest mirror on how you experience closeness. First, who should we do this about?",
    targetTitle: 'Answer about…',
    targetHint: 'Attachment is relationship-specific — most people are more secure with a friend than with a partner, so pick one and keep them in mind for all 12 questions.',
    targetAbout: (label) => `About: ${label}`,
    borderline: 'Your scores sit close to the line, so this label is a coin toss — the two numbers below it are the real result, and they are more useful than the name.',
    dimTitle: 'Your two dimensions',
    dimNote: 'Compared against approximate averages from the research literature, not norms collected from this app. Roughly, not precisely.',
    kawkabMidpoint: "Halfway there — there's no \"right\" way to attach to people, just your own way.",
    kawkabScenarioIntro: "Nice work! Now 3 quick everyday moments — they won't change your score, but they'll make it feel real.",
    start: 'Start the quiz',
    retake: 'Retake the quiz',
    savedNote: 'Showing your last result.',
    left: 'Disagree strongly', right: 'Agree strongly',
    back: '‹ Previous',
    tryScenarios: "Let's try them",
    skipScenarios: 'Skip to my results →',
    scenarioProgress: (n, total) => `Experiment ${n} of ${total}`,
    scenarioContinue: 'Continue',
    scenarioSeeResults: 'See my results',
    resultsTitle: 'Your attachment style',
    moreLabel: 'Go deeper into the research', lessLabel: 'Show less',
    axisAnxiety: 'Anxiety', axisAvoidance: 'Avoidance',
    recapTitle: 'Your gut-check, across those 3 moments',
    recapMatch: (styleLabel) => `Your instinctive reactions leaned ${styleLabel} — consistent with your scale result. That's a strong, repeated signal.`,
    recapDiverge: (tallyLabel, styleLabel) => `Interesting: your gut leaned ${tallyLabel} here, a little different from your scale result (${styleLabel}). Attachment isn't fixed moment-to-moment — different relationships, and even different days, can bring out different sides of it.`,
    statTitle: 'How common is this?',
    stat: 'Large population studies of adult attachment consistently find most adults (roughly half to two-thirds) fall in the secure range, with anxious-preoccupied, dismissive-avoidant and fearful-avoidant splitting the remainder (Mickelson, Kessler & Shaver, 1997; Bartholomew & Horowitz, 1991).',
    changeTitle: "This isn't a life sentence",
    change: 'Attachment style shows only moderate stability over time (Fraley, 2002 meta-analysis) — new relationships, self-reflection, and therapy can shift it toward security. Psychologists call this "earned secure attachment."',
  },
  ar: {
    title: 'نمط التعلّق',
    meta: '١٢ سؤالاً · حوالي دقيقتين',
    cite: 'الأسئلة مقتبسة من البُعدين اللذين تقيسهما عائلة مقياس "الخبرات في العلاقات الحميمة" (ECR-R، Fraley, Waller & Brennan, 2000؛ والنسخة القصيرة: Wei et al., 2007)، مع إمكانية اختيار طرف العلاقة كما في ECR-RS (Fraley et al., 2011). وهي مقتبسة لا الأداة الأصلية — فاعتبر النتيجة بداية حوار لا درجة نهائية.',
    disclaimer: 'للتأمّل الذاتي فقط، وليس تشخيصاً سريرياً.',
    kawkabIntro: 'مرحباً، أنا كوكب! أنا لست معالجاً نفسياً، وهذا ليس تشخيصاً — فقط مرآة صادقة لكيفية تجربتك للقرب العاطفي. أولاً، عمّن سنتحدّث؟',
    targetTitle: 'أجب عن…',
    targetHint: 'نمط التعلّق يختلف باختلاف العلاقة — معظم الناس أكثر أماناً مع صديق منهم مع شريك. اختر شخصاً واحداً وأبقِه في ذهنك طوال الأسئلة الاثني عشر.',
    targetAbout: (label) => `عن: ${label}`,
    borderline: 'نتيجتك قريبة من الحدّ الفاصل، لذا فهذا التصنيف أقرب إلى الصدفة — الرقمان أدناه هما النتيجة الحقيقية، وهما أنفع من الاسم.',
    dimTitle: 'بُعداك',
    dimNote: 'المقارنة مع متوسطات تقريبية من الأدبيات البحثية، لا مع معايير مجمّعة من هذا التطبيق. تقريباً، لا بدقّة.',
    kawkabMidpoint: 'منتصف الطريق — لا توجد طريقة "صحيحة" للتعلّق بالآخرين، فقط طريقتك الخاصة.',
    kawkabScenarioIntro: 'أحسنت! الآن ٣ لحظات يومية سريعة — لن تغيّر نتيجتك، لكنها ستجعلها أكثر واقعية.',
    start: 'ابدأ الاختبار',
    retake: 'أعد الاختبار',
    savedNote: 'يعرض هذا نتيجتك الأخيرة.',
    left: 'أرفض بشدّة', right: 'أوافق بشدّة',
    back: '‹ السابق',
    tryScenarios: 'لنجرّبها',
    skipScenarios: 'تخطَّ إلى نتيجتي ←',
    scenarioProgress: (n, total) => `التجربة ${n} من ${total}`,
    scenarioContinue: 'متابعة',
    scenarioSeeResults: 'شاهد نتيجتي',
    resultsTitle: 'نمط تعلّقك',
    moreLabel: 'تعمّق أكثر في البحث العلمي', lessLabel: 'عرض أقل',
    axisAnxiety: 'القلق', axisAvoidance: 'التجنّب',
    recapTitle: 'حدسك عبر هذه اللحظات الثلاث',
    recapMatch: (styleLabel) => `مالت ردود أفعالك الغريزية نحو "${styleLabel}" — متّسقة مع نتيجة المقياس. هذه إشارة قوية ومتكرّرة.`,
    recapDiverge: (tallyLabel, styleLabel) => `مثير للاهتمام: مال حدسك هنا نحو "${tallyLabel}"، مختلفاً قليلاً عن نتيجة المقياس (${styleLabel}). فنمط التعلّق ليس ثابتاً من لحظة لأخرى — علاقات مختلفة، وحتى أيام مختلفة، قد تُظهر جوانب مختلفة منه.`,
    statTitle: 'ما مدى شيوع هذا النمط؟',
    stat: 'تُظهر دراسات سكانية كبيرة على التعلّق لدى البالغين أن معظم البالغين (ما بين النصف والثلثين تقريباً) يقعون ضمن النمط الآمن، بينما تتوزّع البقية بين الأنماط القلقة والرافضة والخائفة المتجنّبة (Mickelson, Kessler & Shaver, 1997؛ Bartholomew & Horowitz, 1991).',
    changeTitle: 'هذا ليس حكماً مؤبّداً',
    change: 'يُظهر نمط التعلّق ثباتاً معتدلاً فقط عبر الزمن (Fraley, 2002) — فالعلاقات الجديدة والتأمّل الذاتي والعلاج النفسي يمكن أن تدفعه نحو مزيد من الأمان. يسمّي علماء النفس هذا "التعلّق الآمن المكتسَب".',
  },
};

const loadSaved = () => {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (v && typeof v.anxiety === 'number') return v;
  } catch { /* ignore */ }
  return null;
};

/*
 * ⚠ THE CUT POINTS ARE NOT THE SCALE MIDPOINT, AND THAT WAS THE SECOND BUG.
 *
 * The old classifier split both axes at 4.0 — the middle of a 1–7 scale — as if
 * the average adult sat exactly there. They do not: on ECR-family measures,
 * community samples run noticeably BELOW the midpoint on avoidance in
 * particular, so cutting at 4.0 labels a perfectly ordinary person "avoidant".
 * Combined with the unbalanced items above, the two errors compounded in the
 * same direction and manufactured fearful-avoidants.
 *
 * ⚠ AND THEY ARE NOT THE COMMUNITY MEANS EITHER — cutting at the mean is a
 * MEDIAN SPLIT, which sorts roughly a quarter of all users into each of the
 * four boxes. That reproduces the original bug in a politer form: it would hand
 * ~25% of people the fearful-avoidant label on a screen that tells them, three
 * paragraphs later, that most adults are secure. The instrument would be
 * contradicting itself, and the user would believe the label.
 *
 * So the cuts sit near the upper quartile of community distributions instead.
 * Two roughly independent dimensions each cut at ~the 75th percentile leave
 * about 0.75 × 0.75 ≈ 56% in the low/low region — which is the secure share the
 * results screen actually reports (Mickelson, Kessler & Shaver, 1997). The
 * classification and the prevalence claim now agree.
 *
 * These are approximate figures from the ECR literature, not norms derived from
 * this app's own users, and the results screen says so.
 */
/*
 * ⚠ THE AVOIDANCE CUT SITS ABOVE 4.0 FOR A STRUCTURAL REASON, not a statistical
 * one. Now that the avoidance subscale is balanced 3-direct / 3-reverse, a
 * uniform response set — every item answered 4, which is what "I don't really
 * know" looks like — lands on EXACTLY 4.0 by construction. A cut anywhere below
 * that labels the undecided user avoidant, every time. Measured: at 3.9, all-4s,
 * all-7s and all-1s each came out "avoidant".
 *
 * The undecided case has to land in the low/low region and be flagged
 * borderline, which is the honest reading of a response set carrying no
 * information. 4.2 is roughly one SD above the community mean; paired with the
 * anxiety cut it leaves ~60% secure, still inside the range the results screen
 * reports.
 */
const CUT = { anxiety: 4.5, avoidance: 4.2 };

/*
 * ⚠ AN UNANSWERED ITEM IS NOT A 4. The old code did `answers[it.id] || 4`,
 * quietly inventing a midpoint response for anything missing — the same
 * fabricate-the-data failure the practice check-in was built to avoid. Every
 * item is required to advance, so a gap means something went wrong; averaging
 * over what IS answered is the honest response to that.
 */
function subscaleMean(items, answers) {
  const vals = items
    .map((it) => (Number.isFinite(answers[it.id]) ? (it.rev ? 8 - answers[it.id] : answers[it.id]) : null))
    .filter((v) => v != null);
  if (!vals.length) return 4;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function scoreAndClassify(answers) {
  const anxiety = subscaleMean(ANXIETY_ITEMS, answers);
  const avoidance = subscaleMean(AVOIDANCE_ITEMS, answers);
  const hiAnx = anxiety >= CUT.anxiety;
  const hiAvo = avoidance >= CUT.avoidance;
  let style;
  if (!hiAnx && !hiAvo) style = 'secure';
  else if (hiAnx && !hiAvo) style = 'anxious';
  else if (!hiAnx && hiAvo) style = 'dismissive';
  else style = 'fearful';
  /* How far from a cut the person actually sits — a score of 3.05 on a 3.0 cut
     is a coin toss wearing a category's clothes, and the results screen says so
     rather than presenting every classification with equal confidence. */
  const margin = Math.min(Math.abs(anxiety - CUT.anxiety), Math.abs(avoidance - CUT.avoidance));
  return { anxiety, avoidance, style, borderline: margin < 0.5 };
}

/** Which tag (secure/anxious/avoidant) came up most across the 3 scenario picks. */
function topTally(scenarioAnswers) {
  if (!scenarioAnswers) return null;
  const counts = { secure: 0, anxious: 0, avoidant: 0 };
  Object.values(scenarioAnswers).forEach((tag) => { if (counts[tag] != null) counts[tag] += 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function tallyMatchesStyle(tally, style) {
  if (tally === 'avoidant') return AVOIDANT_STYLES.has(style);
  return tally === style;
}

const clampPct = (v) => Math.max(4, Math.min(96, v));

/*
 * ⚠ THE CROSSHAIRS MUST SIT ON THE CUT POINTS, NOT AT 50%.
 *
 * The axes were hard-coded to the middle of the box while the classifier cut at
 * the middle of the scale — which agreed only by coincidence, and stopped
 * agreeing the moment the cuts moved to real reference means. A dot drawn in
 * the bottom-left while the caption underneath says "Dismissive-Avoidant" is
 * the kind of contradiction a user notices immediately and cannot explain, and
 * it would quietly discredit the whole result. Both now derive from CUT.
 */
const pctOf = (v) => ((v - 1) / 6) * 100;
const AX_X = pctOf(CUT.avoidance);        // vertical line: avoidance cut
const AX_Y_TOP = 100 - pctOf(CUT.anxiety); // horizontal line: anxiety cut

function Quadrant({ anxiety, avoidance, isAr, t }) {
  const x = clampPct(pctOf(avoidance));
  const yTop = clampPct(100 - pctOf(anxiety));
  // Forced dir="ltr": this is a data plot, not direction-sensitive text — the
  // cells use logical inset-inline-start/end (which flip with RTL), while the
  // dot uses physical left/top (which doesn't). Pinning direction here keeps
  // the dot and its quadrant labels aligned regardless of app language.
  return (
    <div className="qz-quad-wrap" dir="ltr">
      <div className="qz-quad">
        <span className="qz-quad-cell" style={{ top: 0, insetInlineStart: 0, color: STYLES.anxious.color }}>{isAr ? STYLES.anxious.ar : STYLES.anxious.en}</span>
        <span className="qz-quad-cell" style={{ top: 0, insetInlineEnd: 0, color: STYLES.fearful.color }}>{isAr ? STYLES.fearful.ar : STYLES.fearful.en}</span>
        <span className="qz-quad-cell" style={{ bottom: 0, insetInlineStart: 0, color: STYLES.secure.color }}>{isAr ? STYLES.secure.ar : STYLES.secure.en}</span>
        <span className="qz-quad-cell" style={{ bottom: 0, insetInlineEnd: 0, color: STYLES.dismissive.color }}>{isAr ? STYLES.dismissive.ar : STYLES.dismissive.en}</span>
        <span className="qz-quad-axis" style={{ left: `${AX_X}%`, top: 0, bottom: 0, width: 1.5 }} />
        <span className="qz-quad-axis" style={{ top: `${AX_Y_TOP}%`, left: 0, right: 0, height: 1.5 }} />
        <span className="qz-quad-dot" style={{ left: `${x}%`, top: `${yTop}%` }} />
      </div>
      <div className="qz-quad-axislabel-y">↑ {t.axisAnxiety}</div>
      <div className="qz-quad-axislabel-x">{t.axisAvoidance} →</div>
    </div>
  );
}

export default function RelationshipQuiz({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? TEXT.ar : TEXT.en;
  const [saved] = useState(() => loadSaved());
  const [phase, setPhase] = useState(saved ? 'result' : 'intro'); // intro | target | quiz | midpoint | scenario-intro | scenario | result
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(saved || null);
  const [target, setTarget] = useState(saved?.target || 'partner');
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [scenarioAnswers, setScenarioAnswers] = useState({});

  const start = () => {
    playSfx?.('click');
    setAnswers({}); setIndex(0); setScenarioIndex(0); setScenarioAnswers({});
    setPhase('target');
  };

  const finish = (scored, scenarioData) => {
    const rec = { ...scored, target, scenarioAnswers: scenarioData || null, savedAt: Date.now() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rec)); } catch { /* ignore */ }
    markWellbeingPracticeDone('relationship-quiz');
    setResult(rec);
    playSfx?.('collect');
    setPhase('result');
  };

  const targetLabel = (id) => {
    const tg = TARGETS.find((x) => x.id === id);
    return tg ? (isAr ? tg.ar : tg.en) : '';
  };

  const answer = (val) => {
    playSfx?.('click');
    const item = ITEMS[index];
    const next = { ...answers, [item.id]: val };
    setAnswers(next);
    const nextIndex = index + 1;
    setTimeout(() => {
      if (nextIndex >= ITEMS.length) {
        setResult({ ...scoreAndClassify(next), scenarioAnswers: null, savedAt: null });
        setPhase('scenario-intro');
      } else {
        setIndex(nextIndex);
        if (nextIndex === MIDPOINT_AT) setPhase('midpoint');
      }
    }, 180);
  };

  const chooseScenario = (optId) => {
    playSfx?.('click');
    setScenarioAnswers((prev) => ({ ...prev, [SCENARIOS[scenarioIndex].id]: optId }));
  };

  const nextScenario = () => {
    playSfx?.('click');
    if (scenarioIndex + 1 < SCENARIOS.length) {
      setScenarioIndex(scenarioIndex + 1);
    } else {
      finish(result, scenarioAnswers);
    }
  };

  const skipScenarios = () => {
    playSfx?.('click');
    finish(result, null);
  };

  const scenario = SCENARIOS[scenarioIndex];
  const scenarioAnswered = scenario && scenarioAnswers[scenario.id];
  const styleInfo = result ? STYLES[result.style] : null;
  const tally = result ? topTally(result.scenarioAnswers) : null;

  return (
    <PracticeShell title={t.title} accent={ACCENT} accentLit={ACCENT_LIT} isAr={isAr} onBack={onBack}>
      <style>{QUIZ_CSS}</style>
      <style>{QUAD_CSS}</style>
      <style>{SAFETY_CSS}</style>

      {phase === 'intro' && (
        <div className="rxp-body rxp-center" style={{ '--rx-hue': ACCENT, '--rx-hue-lit': ACCENT_LIT }}>
          <PracticeHero emoji="💞" />
          <KawkabSay>{t.kawkabIntro}</KawkabSay>
          <div className="qz-intro-meta">{t.meta}</div>
          <p className="qz-cite">{t.cite}</p>
          {saved && <p className="qz-cite">{t.savedNote}</p>}
          <button className="rxp-primary" onClick={start}>{saved ? t.retake : t.start}</button>
          <p className="qz-disclaimer">{t.disclaimer}</p>
        </div>
      )}

      {phase === 'target' && (
        <div className="rxp-body" style={{ '--rx-hue': ACCENT, '--rx-hue-lit': ACCENT_LIT }}>
          <div className="rxp-label" style={{ textAlign: 'center' }}>{t.targetTitle}</div>
          <p className="qz-example">{t.targetHint}</p>
          <div className="qz-choice-list">
            {TARGETS.map((tg) => (
              <button
                key={tg.id}
                type="button"
                className={`qz-choice${target === tg.id ? ' on' : ''}`}
                onClick={() => { playSfx?.('click'); setTarget(tg.id); }}
              >
                {tg.icon} {isAr ? tg.ar : tg.en}
              </button>
            ))}
          </div>
          <button className="rxp-primary" onClick={() => { playSfx?.('click'); setPhase('quiz'); }}>{t.scenarioContinue}</button>
        </div>
      )}

      {phase === 'quiz' && (
        <div className="rxp-body" style={{ '--rx-hue': ACCENT, '--rx-hue-lit': ACCENT_LIT }}>
          <div className="qz-progress" dir="ltr">{index + 1} / {ITEMS.length}</div>
          <div className="qz-target-chip">{t.targetAbout(targetLabel(target))}</div>
          <div className="qz-item-text">{isAr ? ITEMS[index].ar : ITEMS[index].en}</div>
          <QuestionExample>{isAr ? ITEMS[index].exampleAr : ITEMS[index].example}</QuestionExample>
          <LikertRow value={answers[ITEMS[index].id] || null} onChange={answer} leftLabel={t.left} rightLabel={t.right} />
          {index > 0 && (
            <button
              type="button"
              onClick={() => setIndex(index - 1)}
              style={{ background: 'none', border: 'none', color: SUB, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', alignSelf: isAr ? 'flex-end' : 'flex-start', padding: 0 }}
            >
              {t.back}
            </button>
          )}
        </div>
      )}

      {phase === 'midpoint' && (
        <div className="rxp-body rxp-center" style={{ '--rx-hue': ACCENT, '--rx-hue-lit': ACCENT_LIT }}>
          <KawkabSay>{t.kawkabMidpoint}</KawkabSay>
          <button className="rxp-primary" onClick={() => { playSfx?.('click'); setPhase('quiz'); }}>{t.scenarioContinue}</button>
        </div>
      )}

      {phase === 'scenario-intro' && (
        <div className="rxp-body rxp-center" style={{ '--rx-hue': ACCENT, '--rx-hue-lit': ACCENT_LIT }}>
          <PracticeHero emoji="🧪" />
          <KawkabSay>{t.kawkabScenarioIntro}</KawkabSay>
          <button className="rxp-primary" onClick={() => { playSfx?.('click'); setPhase('scenario'); }}>{t.tryScenarios}</button>
          <button
            type="button"
            onClick={skipScenarios}
            style={{ background: 'none', border: 'none', color: SUB, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}
          >
            {t.skipScenarios}
          </button>
        </div>
      )}

      {phase === 'scenario' && scenario && (
        <div className="rxp-body" style={{ '--rx-hue': ACCENT, '--rx-hue-lit': ACCENT_LIT }}>
          <div className="qz-progress" dir="ltr">{t.scenarioProgress(scenarioIndex + 1, SCENARIOS.length)}</div>
          <KawkabSay>{isAr ? scenario.kawkabAr : scenario.kawkabEn}</KawkabSay>
          {!scenarioAnswered ? (
            <>
              <div className="qz-item-text" style={{ fontSize: 17 }}>{isAr ? scenario.questionAr : scenario.questionEn}</div>
              <ScenarioChoice
                options={scenario.options.map((o) => ({ id: o.id, label: isAr ? o.ar : o.en }))}
                onChoose={chooseScenario}
              />
            </>
          ) : (
            <>
              <div style={{
                padding: '13px 15px', borderRadius: 12, background: `${ACCENT}14`, borderInlineStart: `4px solid ${ACCENT}`,
                fontSize: 13, lineHeight: 1.6, color: SUB,
              }}>
                {isAr ? scenario.reactionAr : scenario.reactionEn}
              </div>
              <button className="rxp-primary" onClick={nextScenario}>
                {scenarioIndex + 1 < SCENARIOS.length ? t.scenarioContinue : t.scenarioSeeResults}
              </button>
            </>
          )}
        </div>
      )}

      {phase === 'result' && result && styleInfo && (
        <div className="rxp-body" style={{ '--rx-hue': ACCENT, '--rx-hue-lit': ACCENT_LIT }}>
          <KawkabSay>{isAr ? styleInfo.takeawayAr : styleInfo.takeawayEn}</KawkabSay>
          <div className="rxp-label" style={{ textAlign: 'center' }}>{t.resultsTitle}</div>
          {result.target && <div className="qz-target-chip">{t.targetAbout(targetLabel(result.target))}</div>}
          <Quadrant anxiety={result.anxiety} avoidance={result.avoidance} isAr={isAr} t={t} />
          <div style={{ textAlign: 'center', fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, fontSize: 26, color: styleInfo.color, marginTop: 4 }}>
            {isAr ? styleInfo.ar : styleInfo.en}
          </div>
          {/* ⚠ A label a tenth of a point from its own cut is a coin toss, and
              presenting it with the same confidence as a clear one is how a
              user reorganises their self-understanding around rounding. The
              dimensions are the result; the name is a convenience. */}
          {result.borderline && <p className="qz-borderline">{t.borderline}</p>}
          <div className="qz-dims">
            <div className="rxp-label">{t.dimTitle}</div>
            <div className="qz-dim-row"><span>{t.axisAnxiety}</span><b dir="ltr">{result.anxiety.toFixed(1)} / 7</b></div>
            <div className="qz-dim-row"><span>{t.axisAvoidance}</span><b dir="ltr">{result.avoidance.toFixed(1)} / 7</b></div>
            <p className="qz-dim-note">{t.dimNote}</p>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: SUB, textAlign: 'center' }}>{isAr ? styleInfo.descAr : styleInfo.descEn}</p>
          <div style={{ padding: '13px 15px', borderRadius: 12, background: `${styleInfo.color}14`, borderInlineStart: `4px solid ${styleInfo.color}` }}>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: SUB }}>{isAr ? styleInfo.tipAr : styleInfo.tipEn}</div>
            <DeeperScience moreLabel={t.moreLabel} lessLabel={t.lessLabel}>
              {isAr ? styleInfo.deeperAr : styleInfo.deeperEn}
            </DeeperScience>
          </div>

          {tally && (
            <div style={{ padding: '13px 15px', borderRadius: 12, background: '#efe6d6' }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: ACCENT, marginBottom: 5 }}>{t.recapTitle}</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.6, color: SUB }}>
                {tallyMatchesStyle(tally, result.style)
                  ? t.recapMatch(isAr ? SCENARIO_TAG_LABEL[tally].ar : SCENARIO_TAG_LABEL[tally].en)
                  : t.recapDiverge(
                    isAr ? SCENARIO_TAG_LABEL[tally].ar : SCENARIO_TAG_LABEL[tally].en,
                    isAr ? styleInfo.ar : styleInfo.en,
                  )}
              </div>
            </div>
          )}

          <div style={{ marginTop: 6, padding: '14px 16px', borderRadius: 14, background: `${ACCENT}14`, border: `1.5px solid ${ACCENT}40` }}>
            <div style={{ fontWeight: 800, fontSize: 13.5, color: ACCENT, marginBottom: 6 }}>{t.statTitle}</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.6, color: SUB }}>{t.stat}</div>
          </div>
          <div style={{ padding: '14px 16px', borderRadius: 14, background: '#efe6d6' }}>
            <div style={{ fontWeight: 800, fontSize: 13.5, color: ACCENT, marginBottom: 6 }}>{t.changeTitle}</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.6, color: SUB }}>{t.change}</div>
          </div>

          <button className="rxp-ghost" onClick={start}>{t.retake}</button>
          <p className="qz-disclaimer" style={{ color: FAINT }}>{t.disclaimer}</p>
          {/* ⚠ THE ONE PLACE THIS MOST NEEDED TO BE. A person can arrive here
              having just answered twelve items about being left, be handed a
              label, and read a paragraph about a caregiver who was also a
              source of fear. Before 2026-09-07 the next thing on screen was
              "Retake the quiz", and nothing else. */}
          <SafetyNote isAr={isAr} />
        </div>
      )}
    </PracticeShell>
  );
}

const QUAD_CSS = `
.qz-target-chip { align-self:center; font-size:11.5px; font-weight:800; letter-spacing:0.4px; color:${SUB};
  background:var(--rx-card); border:1px solid var(--rx-hair); border-radius:999px; padding:5px 13px; }
.qz-borderline { margin:0; font-size:12.5px; line-height:1.6; color:${SUB}; text-align:center;
  padding:10px 14px; border-radius:12px; background:color-mix(in srgb, var(--rx-hue) 10%, transparent); }
.qz-dims { display:flex; flex-direction:column; gap:6px; padding:13px 15px; border-radius:13px;
  border:1px solid var(--rx-hair); background:var(--rx-card); }
.qz-dim-row { display:flex; justify-content:space-between; align-items:baseline; font-size:13.5px; color:${SUB}; }
.qz-dim-row b { font-size:15px; color:var(--rx-ink); font-variant-numeric:tabular-nums; }
.qz-dim-note { margin:4px 0 0; font-size:11.5px; line-height:1.55; color:${FAINT}; }
.qz-quad-wrap { display:flex; flex-direction:column; align-items:center; gap:4px; }
.qz-quad { position:relative; width:100%; max-width:280px; aspect-ratio:1; margin:0 auto; border-radius:16px; border:2px solid #e3d6c4; background:#fffdf8; }
.qz-quad-cell { position:absolute; width:50%; padding:8px; font-size:10.5px; font-weight:800; line-height:1.25; text-align:center; }
.qz-quad-axis { position:absolute; background:#e3d6c4; }
.qz-quad-dot { position:absolute; width:16px; height:16px; border-radius:50%; background:#1a1208; border:3px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.3); transform:translate(-50%,-50%); }
.qz-quad-axislabel-y, .qz-quad-axislabel-x { font-size:10px; font-weight:800; color:${SUB}; }
[data-home-theme='dark'] .qz-quad { border-color:rgba(212,168,80,0.25); background:#211a10; }
[data-home-theme='dark'] .qz-quad-axis { background:rgba(212,168,80,0.25); }
[data-home-theme='dark'] .qz-quad-dot { border-color:#211a10; }
[data-home-theme='dark'] .qz-quad-axislabel-y, [data-home-theme='dark'] .qz-quad-axislabel-x { color:#c9b384; }
`;
