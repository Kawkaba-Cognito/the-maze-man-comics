import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import PracticeShell, { SUB, FAINT } from './PracticeShell';
import { QUIZ_CSS, LikertRow, KawkabSay, ScenarioChoice, QuestionExample, DeeperScience } from './quizShared';
import { markWellbeingPracticeDone } from './habitState';

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

const ACCENT = '#c86f8f';
const STORAGE_KEY = 'rx_relationship_v1';
const MIDPOINT_AT = 6;

const ANXIETY_ITEMS = [
  { id: 'a1', en: "I worry that my partner won't care about me as much as I care about them.", ar: 'أقلق من ألّا يهتم شريكي بي بقدر اهتمامي به.',
    example: "You notice you're the one who initiates texts more often, and it makes you wonder if they feel the same way.",
    exampleAr: 'تلاحظ أنك من يبادر بالرسائل غالباً، فتتساءل إن كان يشعر بالمثل.' },
  { id: 'a2', en: 'I need a lot of reassurance that I am loved.', ar: 'أحتاج إلى الكثير من الطمأنة بأنني محبوب.',
    example: "Hearing \"I love you\" once doesn't quite settle it — part of you wants to hear it again, or looks for other signs.",
    exampleAr: 'سماع "أحبّك" مرة واحدة لا يكفي لتشعر بالطمأنينة — جزء منك يريد سماعها مجدداً، أو يبحث عن علامات أخرى.' },
  { id: 'a3', en: "I worry about being abandoned by people I'm close to.", ar: 'أقلق من أن يتخلّى عنّي من أنا مقرّب منهم.',
    example: "Even in a relationship that's going fine, part of you quietly braces for it to end.",
    exampleAr: 'حتى في علاقة تسير بشكل جيد، جزء منك يتحصّن بصمت لاحتمال انتهائها.' },
  { id: 'a4', en: 'I get frustrated when my partner is not available when I need them.', ar: 'أشعر بالإحباط عندما لا يكون شريكي متاحاً عندما أحتاجه.',
    example: "They don't pick up right away, and irritation shows up before any explanation does.",
    exampleAr: 'لا يردّ على الفور، فيظهر الانزعاج قبل أن تصلك أي تفسير.' },
  { id: 'a5', en: "I find myself thinking about my relationship a lot — sometimes more than I'd like to.", ar: 'أجد نفسي أفكّر في علاقتي كثيراً — أحياناً أكثر ممّا أريد.',
    example: "You're at work, and a conversation from last night replays in your head instead of the task in front of you.",
    exampleAr: 'أنت في العمل، وتُعاد محادثة الليلة الماضية في ذهنك بدلاً من التركيز على مهمتك.' },
  { id: 'a6', en: "I worry that romantic partners won't want to stay with me.", ar: 'أقلق من ألّا يرغب شركاء العلاقة في البقاء معي.',
    example: 'Things are going well, and a quiet thought still surfaces: "how long until this changes?"',
    exampleAr: 'الأمور تسير جيداً، ومع ذلك تخطر لك فكرة هادئة: "إلى متى سيستمر هذا؟"' },
];
const AVOIDANCE_ITEMS = [
  { id: 'v1', en: 'I prefer not to show a partner how I really feel deep down.', ar: 'أفضّل ألّا أُظهر لشريكي ما أشعر به فعلاً في أعماقي.',
    example: "Something upset you, but you'd rather work through it alone than explain the whole thing out loud.",
    exampleAr: 'أزعجك أمر ما، لكنك تفضّل معالجته بمفردك بدلاً من شرحه بصوت مسموع.' },
  { id: 'v2', en: 'I find it difficult to get close to others.', ar: 'أجد صعوبة في الاقتراب عاطفياً من الآخرين.',
    example: "Even with people you like, there's a point where you pull back rather than let them in further.",
    exampleAr: 'حتى مع من تحبّهم، هناك نقطة تتراجع عندها بدلاً من السماح لهم بالاقتراب أكثر.' },
  { id: 'v3', en: 'I get nervous when a partner wants to be very close emotionally.', ar: 'أشعر بالتوتّر عندما يريد شريكي قرباً عاطفياً كبيراً.',
    example: 'A partner says "I feel like we can tell each other anything" — and something in you tightens instead of warms.',
    exampleAr: 'يقول شريكك "أشعر أننا نستطيع إخبار بعضنا بأي شيء" — فيتوتّر شيء بداخلك بدلاً من أن يدفأ.' },
  { id: 'v4', en: 'I prefer not to depend on romantic partners.', ar: 'أفضّل ألّا أعتمد على شريكي العاطفي.',
    example: "You'd rather struggle with a hard problem alone than ask your partner to help you with it.",
    exampleAr: 'تفضّل المكافحة بمفردك في مشكلة صعبة على أن تطلب من شريكك المساعدة فيها.' },
  { id: 'v5', en: 'I try to avoid getting too emotionally close to a partner.', ar: 'أحاول تجنّب الاقتراب العاطفي الشديد من شريكي.',
    example: 'When a relationship starts feeling serious, you notice yourself quietly creating a little distance.',
    exampleAr: 'عندما تبدأ العلاقة تصبح جدّية، تلاحظ نفسك تخلق مسافة صغيرة بهدوء.' },
  { id: 'v6', en: 'I am uncomfortable opening up to romantic partners.', ar: 'أشعر بعدم الارتياح عند البوح لشريكي بمشاعري.',
    example: "You'll talk about your day, but the harder stuff — fears, insecurities — tends to stay unspoken.",
    exampleAr: 'تتحدّث عن يومك، لكن الأمور الأصعب — مخاوفك وشكوكك — تبقى عادة دون أن تُقال.' },
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
    deeperEn: 'This pattern often forms in childhood environments where caregiving was loving but inconsistent — sometimes warmly available, sometimes not, in a way that was hard to predict. That taught a young nervous system that closeness needs vigilance to keep. It made sense once, in that context — it just costs more than it used to now.',
    deeperAr: 'غالباً ما يتشكّل هذا النمط في بيئة طفولة كانت الرعاية فيها محبّة لكن غير منتظمة — متاحة بدفء أحياناً، وغائبة أحياناً أخرى، بطريقة يصعب توقّعها. علّم ذلك الجهاز العصبي الصغير أن القرب يحتاج يقظة دائمة للحفاظ عليه. كان ذلك منطقياً حينها، ضمن ذلك السياق — لكنه يكلّف الآن أكثر ممّا كان يكلّف سابقاً.',
  },
  dismissive: {
    color: '#5aa9c8', en: 'Dismissive-Avoidant', ar: 'رافض-متجنّب',
    descEn: 'Values independence highly and tends to keep emotional distance, often experiencing closeness itself — not the partner — as the main pressure.',
    descAr: 'يقدّر الاستقلالية كثيراً ويميل للحفاظ على مسافة عاطفية، وغالباً ما يشعر بأن القرب العاطفي نفسه — لا الشريك — هو مصدر الضغط.',
    tipEn: "Independence is a real strength; the skill worth adding is naming a feeling out loud before you've fully processed it alone — partners can't calibrate to a door that's always closed.",
    tipAr: 'الاستقلالية ميزة حقيقية؛ المهارة التي تستحق الإضافة هي التعبير عن شعورك بصوت مسموع قبل معالجته كاملاً بمفردك — فالشريك لا يستطيع فهم باب مغلق دائماً.',
    takeawayEn: 'In plain terms: you value your independence and keep your inner world to yourself — closeness is welcome, just on your own terms.',
    takeawayAr: 'بعبارة بسيطة: تقدّر استقلاليتك وتحتفظ بعالمك الداخلي لنفسك — القرب مرحّب به، لكن بشروطك أنت.',
    deeperEn: "This pattern often forms when a child's bids for comfort went consistently unanswered, so self-reliance became the safer strategy. Adults with this style commonly report feeling fine on self-report tests while their body still shows a measurable stress response underneath — so \"I'm fine\" can be genuinely felt and physiologically incomplete at the same time (Fraley & Shaver, 1997).",
    deeperAr: 'غالباً ما يتشكّل هذا النمط عندما لا تُلبَّى محاولات الطفل المتكررة لطلب العزاء، فيصبح الاعتماد على الذات هو الاستراتيجية الأكثر أماناً. غالباً ما يشعر البالغون بهذا النمط بأنهم "بخير" في اختبارات التقرير الذاتي، بينما يُظهر الجسد استجابة توتّر قابلة للقياس تحت السطح — أي أن "أنا بخير" قد تكون شعوراً صادقاً وغير مكتمل فسيولوجياً في آن واحد (Fraley & Shaver, 1997).',
  },
  fearful: {
    color: '#a06fae', en: 'Fearful-Avoidant', ar: 'خائف-متجنّب',
    descEn: 'Wants closeness but also braces against it — often from a push-pull of wanting connection while expecting it to hurt.',
    descAr: 'يرغب في القرب لكنه يتحصّن منه أيضاً — غالباً بسبب صراع بين الرغبة في الاتصال العاطفي وتوقّع أن يجلب الألم.',
    tipEn: 'This pattern responds especially well to a patient, consistent partner and, often, therapy focused specifically on relationships — both give the nervous system repeated proof that closeness can be safe.',
    tipAr: 'هذا النمط يستجيب بشكل خاص لشريك صبور وثابت، وغالباً للعلاج النفسي المرَكَّز على العلاقات — كلاهما يمنح الجهاز العصبي أدلّة متكرّرة على أن القرب يمكن أن يكون آمناً.',
    takeawayEn: 'In plain terms: part of you wants closeness, and part of you braces for it to hurt — both parts make sense together.',
    takeawayAr: 'بعبارة بسيطة: جزء منك يريد القرب، وجزء آخر يتحصّن من أن يؤلمه — وكلا الجزأين منطقي معاً.',
    deeperEn: 'This is the least common and most researched of the four styles, often linked to relationships where the same person who gave comfort was also, at times, a source of fear or unpredictability. It tends to respond especially well to attachment-focused therapy — specifically because both fears (of closeness, and of being alone) get addressed together, rather than one being treated as "the real problem."',
    deeperAr: 'هذا هو الأنمط الأربعة الأقل شيوعاً والأكثر دراسة، ويرتبط غالباً بعلاقات كان فيها الشخص نفسه الذي يمنح العزاء مصدراً للخوف أو عدم القدرة على التنبؤ في أحيان أخرى. يستجيب هذا النمط بشكل خاص للعلاج النفسي المرَكَّز على التعلّق — تحديداً لأن كلا الخوفين (من القرب، ومن الوحدة) يُعالَجان معاً، بدلاً من اعتبار أحدهما "المشكلة الحقيقية".',
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
    cite: 'Items are adapted from the two dimensions measured by the Experiences in Close Relationships scale family (ECR-R, Fraley, Waller & Brennan, 2000; short form: Wei et al., 2007) — the standard research tool for adult attachment.',
    disclaimer: 'For self-reflection, not a clinical diagnosis. Think of a current or recent close relationship as you answer.',
    kawkabIntro: "Hi, I'm Kawkab! I'm not a therapist, and this isn't a diagnosis — just an honest mirror on how you experience closeness. Think of someone you're close to, and answer honestly.",
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
    cite: 'الأسئلة مقتبسة من البُعدين اللذين تقيسهما عائلة مقياس "الخبرات في العلاقات الحميمة" (ECR-R، Fraley, Waller & Brennan, 2000؛ والنسخة القصيرة: Wei et al., 2007) — الأداة البحثية المعيارية لقياس التعلّق لدى البالغين.',
    disclaimer: 'للتأمّل الذاتي فقط، وليس تشخيصاً سريرياً. فكّر في علاقة حميمة حالية أو حديثة أثناء إجابتك.',
    kawkabIntro: 'مرحباً، أنا كوكب! أنا لست معالجاً نفسياً، وهذا ليس تشخيصاً — فقط مرآة صادقة لكيفية تجربتك للقرب العاطفي. فكّر في شخص مقرّب منك، وأجب بصدق.',
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

function scoreAndClassify(answers) {
  const mean = (items) => items.reduce((s, it) => s + (answers[it.id] || 4), 0) / items.length;
  const anxiety = mean(ANXIETY_ITEMS);
  const avoidance = mean(AVOIDANCE_ITEMS);
  let style;
  if (anxiety < 4 && avoidance < 4) style = 'secure';
  else if (anxiety >= 4 && avoidance < 4) style = 'anxious';
  else if (anxiety < 4 && avoidance >= 4) style = 'dismissive';
  else style = 'fearful';
  return { anxiety, avoidance, style };
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

function Quadrant({ anxiety, avoidance, isAr, t }) {
  const x = clampPct(((avoidance - 1) / 6) * 100);
  const yTop = clampPct(100 - ((anxiety - 1) / 6) * 100);
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
        <span className="qz-quad-axis" style={{ left: '50%', top: 0, bottom: 0, width: 1.5 }} />
        <span className="qz-quad-axis" style={{ top: '50%', left: 0, right: 0, height: 1.5 }} />
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
  const [saved, setSaved] = useState(() => loadSaved());
  const [phase, setPhase] = useState(saved ? 'result' : 'intro'); // intro | quiz | midpoint | scenario-intro | scenario | result
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(saved || null);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [scenarioAnswers, setScenarioAnswers] = useState({});

  const start = () => {
    playSfx?.('click');
    setAnswers({}); setIndex(0); setScenarioIndex(0); setScenarioAnswers({});
    setPhase('quiz');
  };

  const finish = (scored, scenarioData) => {
    const rec = { ...scored, scenarioAnswers: scenarioData || null, savedAt: Date.now() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rec)); } catch { /* ignore */ }
    markWellbeingPracticeDone('relationship-quiz');
    setResult(rec);
    playSfx?.('collect');
    setPhase('result');
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
    <PracticeShell title={t.title} accent={ACCENT} isAr={isAr} onBack={onBack}>
      <style>{QUIZ_CSS}</style>
      <style>{QUAD_CSS}</style>

      {phase === 'intro' && (
        <div className="rxp-body rxp-center" style={{ '--acc': ACCENT }}>
          <div className="qz-intro-emoji">💞</div>
          <KawkabSay>{t.kawkabIntro}</KawkabSay>
          <div className="qz-intro-meta">{t.meta}</div>
          <p className="qz-cite">{t.cite}</p>
          {saved && <p className="qz-cite">{t.savedNote}</p>}
          <button className="rxp-primary" onClick={start}>{saved ? t.retake : t.start}</button>
          <p className="qz-disclaimer">{t.disclaimer}</p>
        </div>
      )}

      {phase === 'quiz' && (
        <div className="rxp-body" style={{ '--acc': ACCENT }}>
          <div className="qz-progress" dir="ltr">{index + 1} / {ITEMS.length}</div>
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
        <div className="rxp-body rxp-center" style={{ '--acc': ACCENT }}>
          <KawkabSay>{t.kawkabMidpoint}</KawkabSay>
          <button className="rxp-primary" onClick={() => { playSfx?.('click'); setPhase('quiz'); }}>{t.scenarioContinue}</button>
        </div>
      )}

      {phase === 'scenario-intro' && (
        <div className="rxp-body rxp-center" style={{ '--acc': ACCENT }}>
          <div className="qz-intro-emoji">🧪</div>
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
        <div className="rxp-body" style={{ '--acc': ACCENT }}>
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
        <div className="rxp-body" style={{ '--acc': ACCENT }}>
          <KawkabSay>{isAr ? styleInfo.takeawayAr : styleInfo.takeawayEn}</KawkabSay>
          <div className="rxp-label" style={{ textAlign: 'center' }}>{t.resultsTitle}</div>
          <Quadrant anxiety={result.anxiety} avoidance={result.avoidance} isAr={isAr} t={t} />
          <div style={{ textAlign: 'center', fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, fontSize: 26, color: styleInfo.color, marginTop: 4 }}>
            {isAr ? styleInfo.ar : styleInfo.en}
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
        </div>
      )}
    </PracticeShell>
  );
}

const QUAD_CSS = `
.qz-quad-wrap { display:flex; flex-direction:column; align-items:center; gap:4px; }
.qz-quad { position:relative; width:100%; max-width:280px; aspect-ratio:1; margin:0 auto; border-radius:16px; border:2px solid #e3d6c4; background:#fffdf8; }
.qz-quad-cell { position:absolute; width:50%; padding:8px; font-size:10.5px; font-weight:800; line-height:1.25; text-align:center; }
.qz-quad-axis { position:absolute; background:#e3d6c4; }
.qz-quad-dot { position:absolute; width:16px; height:16px; border-radius:50%; background:#1a1208; border:3px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.3); transform:translate(-50%,-50%); }
.qz-quad-axislabel-y, .qz-quad-axislabel-x { font-size:10px; font-weight:800; color:#8a7f6f; }
[data-home-theme='dark'] .qz-quad { border-color:rgba(212,168,80,0.25); background:#211a10; }
[data-home-theme='dark'] .qz-quad-axis { background:rgba(212,168,80,0.25); }
[data-home-theme='dark'] .qz-quad-dot { border-color:#211a10; }
[data-home-theme='dark'] .qz-quad-axislabel-y, [data-home-theme='dark'] .qz-quad-axislabel-x { color:#c9b384; }
`;
