import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import PracticeShell, { PracticeHero, SUB, FAINT } from './PracticeShell';
import { QUIZ_CSS, LikertRow, TraitBar, KawkabSay, ScenarioChoice, QuestionExample, DeeperScience } from './quizShared';
import { markWellbeingPracticeDone } from './habitState';
import SafetyNote, { SAFETY_CSS } from './SafetyNote';

/*
 * Big Five Personality quiz — the Ten-Item Personality Inventory (TIPI;
 * Gosling, Rentfrow & Swann, 2003), the standard ultra-short measure of the
 * Big Five (OCEAN). 10 statements, 2 per trait (1 reverse-scored), 7-point
 * agreement scale. Scoring follows the original paper's formula exactly —
 * everything below (Kawkab's lines, the 3 scenario experiments) is an
 * experiential layer around that score, and never feeds it.
 */

const ACCENT = 'var(--rx-personality-core)';
const ACCENT_LIT = 'var(--rx-personality-lit)';
const STORAGE_KEY = 'rx_personality_v1';
const MIDPOINT_AT = 5; // show Kawkab's check-in once this many items are answered

// id, English + Arabic wording, trait, and whether this item is reverse-scored
// for its trait — exactly the 10 TIPI items in their original order.
const ITEMS = [
  { id: 1, en: 'Extraverted, enthusiastic.', ar: 'منبسط، متحمّس.', trait: 'extraversion', reverse: false,
    example: 'At a party, you\'re the one striking up a conversation with someone you just met.',
    exampleAr: 'في حفلة، أنت من يبادر بالحديث مع شخص التقيت به للتو.' },
  { id: 2, en: 'Critical, quarrelsome.', ar: 'ناقد، كثير الجدال.', trait: 'agreeableness', reverse: true,
    example: "You're quick to point out what's wrong with an idea, even when it ruffles feathers.",
    exampleAr: 'تسارع إلى الإشارة لما هو خاطئ في فكرة ما، حتى لو أزعج ذلك الآخرين.' },
  { id: 3, en: 'Dependable, self-disciplined.', ar: 'يُعتمد عليه، منضبط ذاتياً.', trait: 'conscientiousness', reverse: false,
    example: "You said you'd have it done by Friday — and it's done by Friday, no reminders needed.",
    exampleAr: 'قلت إنك ستنجزها بحلول الجمعة — وتُنجَز فعلاً دون تذكير من أحد.' },
  { id: 4, en: 'Anxious, easily upset.', ar: 'قلق، سريع الانزعاج.', trait: 'stability', reverse: true,
    example: 'A small setback — a delayed reply, a minor mistake — can leave you rattled for a while.',
    exampleAr: 'نكسة صغيرة — رد متأخر، خطأ بسيط — قد تُبقيك مضطرباً لفترة.' },
  { id: 5, en: 'Open to new experiences, complex.', ar: 'منفتح على تجارب جديدة، ومعقّد الفكر.', trait: 'openness', reverse: false,
    example: "You'd rather watch a strange, ambiguous film than a predictable one — the puzzle is half the fun.",
    exampleAr: 'تفضّل فيلماً غريباً وغامضاً على فيلم متوقّع — فحلّ اللغز جزء من المتعة.' },
  { id: 6, en: 'Reserved, quiet.', ar: 'متحفّظ، هادئ.', trait: 'extraversion', reverse: true,
    example: "In a group conversation, you're usually listening more than talking — and that's genuinely comfortable for you.",
    exampleAr: 'في نقاش جماعي، تستمع أكثر ممّا تتحدّث — وهذا مريح لك فعلاً.' },
  { id: 7, en: 'Sympathetic, warm.', ar: 'متعاطف، دافئ المشاعر.', trait: 'agreeableness', reverse: false,
    example: 'A friend vents about a bad day, and your first instinct is to comfort them, not to fix or judge.',
    exampleAr: 'يشتكي صديق من يوم سيّئ، وأول ما يخطر لك هو مواساته، لا إصلاح الأمر أو الحكم عليه.' },
  { id: 8, en: 'Disorganized, careless.', ar: 'غير منظّم، مهمل.', trait: 'conscientiousness', reverse: true,
    example: 'Your desk, your calendar, or your plans tend to come together at the last minute, if at all.',
    exampleAr: 'مكتبك أو جدولك أو خططك تتجمّع عادة في اللحظة الأخيرة، إن تجمّعت أصلاً.' },
  { id: 9, en: 'Calm, emotionally stable.', ar: 'هادئ، مستقرّ عاطفياً.', trait: 'stability', reverse: false,
    example: "Something goes wrong at the last minute, and you're the level-headed one while others panic.",
    exampleAr: 'يحدث خطأ في اللحظة الأخيرة، وتكون أنت الهادئ بينما يُصاب الآخرون بالذعر.' },
  { id: 10, en: 'Conventional, uncreative.', ar: 'تقليدي، وغير مبدع.', trait: 'openness', reverse: true,
    example: 'Given a choice, you pick the tried-and-true option over the untested new one, most of the time.',
    exampleAr: 'عند الاختيار، تفضّل الخيار المجرَّب على الجديد غير المضمون، في معظم الأحيان.' },
];

// Plain-language (no jargon) framing per trait, used to build the dynamic
// "in plain terms" takeaway Kawkab opens the results with.
const PLAIN = {
  openness: { highEn: "you're drawn to new ideas and experiences", lowEn: 'you like sticking with what already works', highAr: 'تنجذب للأفكار والتجارب الجديدة', lowAr: 'تفضّل ما تعرف أنه يصلح فعلاً' },
  conscientiousness: { highEn: 'you stay organized and follow through on things', lowEn: "you're flexible and go with the flow", highAr: 'تحافظ على التنظيم وتُنجز ما تبدأه', lowAr: 'تتّسم بالمرونة وتساير الأمور كما تأتي' },
  extraversion: { highEn: 'people and activity energize you', lowEn: 'quiet and solitude recharge you best', highAr: 'يمنحك الناس والنشاط طاقة', lowAr: 'يمنحك الهدوء والعزلة طاقتك الحقيقية' },
  agreeableness: { highEn: "you're warm and easy to get along with", lowEn: "you're direct, even when it's not easy", highAr: 'أنت دافئ وسهل التعامل معه', lowAr: 'أنت صريح، حتى عندما يكون ذلك صعباً' },
  stability: { highEn: 'you tend to stay steady under pressure', lowEn: 'you feel things intensely, stress included', highAr: 'تميل للثبات تحت الضغط', lowAr: 'تشعر بالأمور بعمق، بما فيها التوتر' },
};

const TRAITS = [
  {
    id: 'openness', color: '#7b86c8',
    en: 'Openness', ar: 'الانفتاح',
    blurbEn: 'Curiosity, imagination, and an appetite for new ideas. Linked to creative achievement and broader exploration of art, ideas, and values (McCrae & Costa, 1997).',
    blurbAr: 'الفضول والخيال والانجذاب للأفكار الجديدة. يرتبط بالإنجاز الإبداعي واستكشاف أوسع للفن والأفكار والقيم (McCrae & Costa, 1997).',
    tryEn: 'This week: say yes to one small unfamiliar thing — a new route, food, or song.',
    tryAr: 'هذا الأسبوع: قل نعم لأمر جديد وصغير — طريق مختلف، طعام جديد، أو أغنية لم تسمعها من قبل.',
    deeperEn: "Low openness isn't close-mindedness — it often means less decision fatigue and steadier follow-through on plans that already work. High openness pulls toward art, ideas, and ambiguity, but can also mean more distraction by new options. Neither end predicts happiness on its own (McCrae & Costa, 1997) — it's a difference in what you find rewarding, not a scorecard.",
    deeperAr: 'الانفتاح المنخفض ليس تصلّباً فكرياً — بل غالباً يعني إرهاق قرار أقل وثباتاً أكبر على خطط أثبتت نجاحها. أمّا الانفتاح المرتفع فينجذب للفن والأفكار والغموض، لكنه قد يعني أيضاً تشتّتاً أكبر بخيارات جديدة. لا يتنبّأ أي طرف بالسعادة وحده (McCrae & Costa, 1997) — إنه اختلاف فيما تجده مُرضياً، لا معياراً للتفوّق.',
  },
  {
    id: 'conscientiousness', color: '#c9a24b',
    en: 'Conscientiousness', ar: 'الضمير الحي (الانضباط)',
    /* ⚠ THE NUMBER WAS WRONG AND IS NOW GONE (2026-09-07). This claimed
       "r ≈ .31" for Barrick & Mount (1991); that meta-analysis reported a
       corrected validity nearer ρ ≈ .22. Worse, quoting any single figure here
       is now hard to defend at all: Sackett et al. (2022) argue that the
       corrected personality–performance validities quoted for thirty years were
       systematically overstated. The direction of the finding survives that
       re-analysis; the decimal does not, so the claim is stated without one. */
    blurbEn: 'Organization, discipline, and follow-through. Of the Big Five it is the most consistent predictor of job performance across occupations (Barrick & Mount, 1991), though how large that effect really is has been revised downward (Sackett et al., 2022). Also linked to a longer lifespan.',
    blurbAr: 'التنظيم والانضباط والمثابرة. هي أكثر سمات العوامل الخمسة اتساقاً في التنبّؤ بالأداء الوظيفي عبر المهن (Barrick & Mount, 1991)، وإن كان حجم هذا الأثر قد رُوجع نزولاً في تحليلات أحدث (Sackett et al., 2022). وترتبط أيضاً بعمر أطول.',
    tryEn: 'This week: pick the task you keep avoiding and give it just 10 focused minutes today.',
    tryAr: 'هذا الأسبوع: اختر المهمة التي تتجنّبها أكثر وامنحها ١٠ دقائق مركّزة اليوم فقط.',
    deeperEn: "This trait rises naturally through your 20s and 30s for most people — researchers call it \"the maturity principle\" (Roberts, Walton & Viechtbauer, 2006). If your score feels lower than you'd like right now, that's partly just where you are in life, not a fixed ceiling — and it's the single most trainable Big Five trait through habits and structure.",
    deeperAr: 'ترتفع هذه السمة طبيعياً خلال العشرينيات والثلاثينيات لدى معظم الناس — يسمّي الباحثون هذا "مبدأ النضج" (Roberts, Walton & Viechtbauer, 2006). إن بدت نتيجتك أقل ممّا تتمنّى الآن، فهذا جزئياً انعكاس لمرحلتك العمرية لا سقفاً ثابتاً — وهي أكثر سمات العوامل الخمسة قابلية للتطوّر عبر العادات والتنظيم.',
  },
  {
    id: 'extraversion', color: '#d07a3e',
    en: 'Extraversion', ar: 'الانبساط',
    blurbEn: 'Sociability, assertiveness, and energy drawn from other people. Reliably linked to higher day-to-day positive mood and life satisfaction (DeNeve & Cooper, 1998 meta-analysis).',
    blurbAr: 'الاجتماعية والحزم والطاقة المستمدّة من التفاعل مع الآخرين. يرتبط باستمرار بمزاج يومي أكثر إيجابية ورضا أعلى عن الحياة (DeNeve & Cooper, 1998).',
    tryEn: "This week: notice what actually refills your energy after a long day — and do more of that, even if it's not what others expect of you.",
    tryAr: 'هذا الأسبوع: لاحظ ما الذي يعيد لك طاقتك فعلاً بعد يوم طويل، وافعل المزيد منه — حتى لو لم يكن ما يتوقّعه الآخرون منك.',
    /* ⚠ Eysenck's cortical-arousal account is stated as a HYPOTHESIS now, in
       both places it appears. It is a historically important idea that modern
       psychophysiology has not cleanly supported, and it was written here as
       settled mechanism. */
    deeperEn: "Extraversion isn't \"more social\" as a virtue — introverts have equally rich social lives, just calibrated to smaller doses and quieter settings. What differs is where energy comes from. One long-standing explanation (Eysenck's arousal theory) proposed that extraverts run at lower baseline arousal and seek stimulation to feel their best, while introverts are already there; it is a useful picture, though the evidence for the mechanism itself is still debated.",
    deeperAr: 'الانبساط ليس معناه "أكثر اجتماعية" كفضيلة — فالمنطوون يعيشون حياة اجتماعية غنية بالقدر ذاته، لكن بجرعات أصغر وأجواء أهدأ. الفرق الحقيقي هو مصدر الطاقة. ويقترح تفسير قديم (نظرية الاستثارة لآيزنك) أن المنبسطين لديهم مستوى يقظة أساسي أقل فيبحثون عن التحفيز، بينما يكون المنطوون في تلك الحالة أصلاً؛ وهي صورة مفيدة، وإن كانت الأدلة على الآلية نفسها ما تزال محلّ جدل.',
  },
  {
    id: 'agreeableness', color: '#6fae7a',
    en: 'Agreeableness', ar: 'التوافق (اللطف)',
    blurbEn: 'Warmth, trust, and cooperation. Predicts relationship satisfaction and prosocial behavior, and tends to keep rising gradually through adulthood (Roberts, Walton & Viechtbauer, 2006).',
    blurbAr: 'الدفء والثقة والتعاون. يتنبّأ بالرضا في العلاقات والسلوك الإيجابي تجاه الآخرين، ويميل للارتفاع تدريجياً خلال مراحل البلوغ (Roberts, Walton & Viechtbauer, 2006).',
    tryEn: 'This week: next time you disagree with someone, say so directly but kindly — and notice how it actually lands.',
    tryAr: 'هذا الأسبوع: في المرة القادمة التي تختلف فيها مع أحد، عبّر عن ذلك بوضوح ولطف — ولاحظ كيف يُستقبل ذلك فعلاً.',
    deeperEn: 'Low agreeableness carries real advantages in negotiation, critical evaluation, and giving unpopular-but-necessary feedback — it predicts effectiveness in some leadership and evaluative roles. High agreeableness protects relationships but can make conflict-avoidance costly if it goes unchecked. Neither is the "nicer" trait — they trade different strengths for different costs.',
    deeperAr: 'يحمل التوافق المنخفض مزايا حقيقية في التفاوض والتقييم النقدي وتقديم ملاحظات غير مريحة لكنها ضرورية — ويتنبّأ بفعالية أكبر في بعض أدوار القيادة والتقييم. أمّا التوافق المرتفع فيحمي العلاقات، لكنه قد يجعل تجنّب الخلاف مكلفاً إن تُرك دون ضبط. لا يوجد طرف "ألطف" من الآخر — فكل طرف يستبدل مزايا بتكاليف مختلفة.',
  },
  {
    id: 'stability', color: '#5aa9c8',
    en: 'Emotional Stability', ar: 'الاستقرار العاطفي',
    blurbEn: "Calm under pressure vs. reactivity to stress (psychology calls the low end of this \"Neuroticism\"). It's one of the strongest personality predictors of anxiety and mood — and also one of the most responsive to therapy and sustained practice (Roberts et al., 2017 meta-analysis).",
    blurbAr: 'الهدوء تحت الضغط مقابل سرعة التأثر بالتوتر (يسمّي علم النفس الطرف المنخفض منها "العصابية"). من أقوى سمات الشخصية المرتبطة بالقلق والمزاج — وأيضاً من أكثرها قابلية للتحسّن بالعلاج والممارسة المستمرّة (Roberts et al., 2017).',
    /* ⚠ Softened: the Lieberman (2007) finding is reduced amygdala response
       when an emotion is labelled. Effects on what a person REPORTS feeling are
       more mixed, and "measurably calms its grip" quietly promised the second
       thing while citing the first. */
    tryEn: "This week: when you feel stress rising, name it out loud (\"I'm anxious right now\") before reacting. Putting a feeling into words changes how the brain's threat circuitry responds to it (Lieberman et al., 2007) — and it buys you the half-second before the reaction.",
    tryAr: 'هذا الأسبوع: عندما تلاحظ ارتفاع توترك، سمِّه بصوت مسموع ("أشعر بالقلق الآن") قبل أن تتصرّف. تحويل الشعور إلى كلمات يغيّر استجابة دوائر التهديد في الدماغ له (Lieberman et al., 2007) — ويمنحك نصف الثانية التي تسبق ردّ الفعل.',
    deeperEn: 'This is the Big Five trait most responsive to intervention — cognitive behavioral therapy, mindfulness training, and even regular exercise measurably shift it over months, not years (Roberts et al., 2017 meta-analysis). A lower score today is a snapshot of where your nervous system is right now, not a fixed diagnosis or a life sentence.',
    deeperAr: 'هذه أكثر سمات العوامل الخمسة استجابة للتدخّل العلاجي — فالعلاج المعرفي السلوكي، وتدريب اليقظة الذهنية، وحتى الرياضة المنتظمة، تُحدث تغييراً ملموساً خلال أشهر لا سنوات (Roberts et al., 2017). النتيجة المنخفضة اليوم هي لقطة لحالة جهازك العصبي الآن، لا تشخيصاً ثابتاً ولا حكماً مؤبّداً.',
  },
];

// 3 short interactive scenarios — not scored, just experiential. Each maps to
// a real trait-behavior link from the literature (cited in the reaction).
const SCENARIOS = [
  {
    id: 'novelty', trait: 'openness',
    kawkabEn: "Quick experiment: you're at a new restaurant. Next to your usual favorite is a dish you've never even heard of.",
    kawkabAr: 'تجربة سريعة: أنت في مطعم جديد. بجانب طبقك المفضّل المعتاد يوجد طبق لم تسمع به من قبل أبداً.',
    questionEn: 'What do you do?', questionAr: 'ماذا تفعل؟',
    options: [
      { id: 'a', en: 'Order the mystery dish — why not.', ar: 'أطلب الطبق الغريب — ولمَ لا.' },
      { id: 'b', en: "Stick with what you know you'll enjoy.", ar: 'ألتزم بما أعرف أنني سأستمتع به.' },
    ],
    reactionEn: 'Small moments like this are exactly what Openness researchers study — the pull toward the new versus the familiar (McCrae & Costa, 1997).',
    reactionAr: 'لحظات صغيرة كهذه هي بالضبط ما يدرسه الباحثون في سمة الانفتاح — الانجذاب نحو الجديد مقابل المألوف (McCrae & Costa, 1997).',
  },
  {
    id: 'deadline', trait: 'conscientiousness',
    kawkabEn: 'Another one: a task is due in 2 days. You technically have plenty of time.',
    kawkabAr: 'أخرى: مهمة موعدها بعد يومين. لديك وقت كافٍ من الناحية النظرية.',
    questionEn: "What's more you?", questionAr: 'أيّهما أقرب لك؟',
    options: [
      { id: 'a', en: 'Start now — even just a small piece today.', ar: 'أبدأ الآن — ولو بجزء صغير اليوم.' },
      { id: 'b', en: "It'll happen — probably tomorrow night.", ar: 'سأنجزها — على الأرجح ليلة الغد.' },
    ],
    reactionEn: 'This exact scenario is the real-world signature researchers use for Conscientiousness — procrastination is tightly and consistently linked to it (Steel, 2007 meta-analysis).',
    reactionAr: 'هذا السيناريو بالذات هو المؤشر الواقعي الذي يستخدمه الباحثون لقياس الضمير الحي — فالتسويف يرتبط به بقوة واتساق (Steel, 2007).',
  },
  {
    id: 'evening', trait: 'extraversion',
    kawkabEn: 'Last one: you unexpectedly get a free evening, no plans at all.',
    kawkabAr: 'الأخيرة: حصلت فجأة على أمسية حرّة، بلا أي خطط.',
    questionEn: 'Where does your energy pull you?', questionAr: 'إلى أين تنجذب طاقتك؟',
    options: [
      { id: 'a', en: 'Text people, go out, be around noise and energy.', ar: 'أراسل أصدقائي، أخرج، أكون وسط الضجيج والطاقة.' },
      { id: 'b', en: 'Home, quiet, just recharge alone.', ar: 'أبقى في المنزل، بهدوء، أستعيد طاقتي وحدي.' },
    ],
    reactionEn: 'Neither answer is the healthy one — what differs is where your energy comes back from. One classic account (Eysenck\'s arousal theory, still debated) put this down to a difference in baseline arousal: seeking stimulation versus already having enough.',
    reactionAr: 'لا إجابة منهما هي "الصحية" — الفرق هو من أين تعود طاقتك. ويعزو تفسير كلاسيكي (نظرية الاستثارة لآيزنك، وما تزال محلّ جدل) ذلك إلى اختلاف في مستوى اليقظة الأساسي: البحث عن التحفيز مقابل امتلاك ما يكفي منه أصلاً.',
  },
];

const TEXT = {
  en: {
    title: 'Big Five Personality',
    meta: '10 questions · about 2 minutes',
    cite: 'Based on the Ten-Item Personality Inventory (TIPI) — Gosling, Rentfrow & Swann, 2003, one of psychology\'s most-used quick Big Five measures.',
    disclaimer: "For self-reflection, not a clinical diagnosis. Answer how you actually are — not how you'd like to be.",
    kawkabIntro: "Hi, I'm Kawkab! I'm not a therapist, and this isn't a diagnosis — just a quick, honest mirror. Answer how you actually are, and I'll show you what the science says.",
    kawkabMidpoint: 'Halfway there — no wrong answers, just be honest with yourself.',
    kawkabScenarioIntro: "Nice work! Now let's try 3 tiny real-life experiments — they won't change your score, they just make it feel real.",
    start: 'Start the quiz',
    retake: 'Retake the quiz',
    savedNote: 'Showing your last result.',
    prompt: 'I see myself as:',
    left: 'Disagree strongly', right: 'Agree strongly',
    back: '‹ Previous',
    tryScenarios: "Let's try them",
    skipScenarios: 'Skip to my results →',
    scenarioProgress: (n, total) => `Experiment ${n} of ${total}`,
    scenarioContinue: 'Continue',
    scenarioSeeResults: 'See my results',
    resultsTitle: 'Your Big Five profile',
    moreLabel: 'Go deeper into the research', lessLabel: 'Show less',
    normsNote: '"Higher" and "lower" compare you against approximate published averages for this questionnaire — largely Western internet samples, not norms from this app. And with only two questions per trait, treat each as a rough band rather than a precise score: a retake will wobble a little without anything about you having changed.',
    closingTitle: 'What the science says about all five',
    closing: 'Big Five traits are roughly 40–60% heritable in twin studies (Jang, Livesley & Vernon, 1996) and show up in essentially the same structure across 50+ cultures (McCrae & Terracciano, 2005) — this is real, stable wiring, not a mood. But "stable" isn\'t "fixed": traits shift gradually across adulthood with sustained effort and new life experience (Roberts, Walton & Viechtbauer, 2006). None of these are good or bad — every trait trades strengths for costs depending on the situation.',
  },
  ar: {
    title: 'الشخصية — العوامل الخمسة الكبرى',
    meta: '١٠ أسئلة · حوالي دقيقتين',
    cite: 'مبني على مقياس TIPI العشري (Ten-Item Personality Inventory) — Gosling, Rentfrow & Swann, 2003، من أكثر مقاييس العوامل الخمسة السريعة استخداماً في علم النفس.',
    disclaimer: 'للتأمّل الذاتي فقط، وليس تشخيصاً سريرياً. أجب بحسب حقيقتك، لا بحسب ما تتمنّى أن تكون عليه.',
    kawkabIntro: 'مرحباً، أنا كوكب! أنا لست معالجاً نفسياً، وهذا ليس تشخيصاً — فقط مرآة سريعة وصادقة. أجب بحسب حقيقتك، وسأريك ماذا يقول العلم.',
    kawkabMidpoint: 'منتصف الطريق — لا إجابات خاطئة، فقط كن صادقاً مع نفسك.',
    kawkabScenarioIntro: 'أحسنت! الآن لنجرّب ٣ تجارب صغيرة من واقع الحياة — لن تغيّر نتيجتك، لكنها ستجعلها أكثر واقعية.',
    start: 'ابدأ الاختبار',
    retake: 'أعد الاختبار',
    savedNote: 'يعرض هذا نتيجتك الأخيرة.',
    prompt: 'أرى نفسي:',
    left: 'أرفض بشدّة', right: 'أوافق بشدّة',
    back: '‹ السابق',
    tryScenarios: 'لنجرّبها',
    skipScenarios: 'تخطَّ إلى نتيجتي ←',
    scenarioProgress: (n, total) => `التجربة ${n} من ${total}`,
    scenarioContinue: 'متابعة',
    scenarioSeeResults: 'شاهد نتيجتي',
    resultsTitle: 'ملفّك في العوامل الخمسة',
    moreLabel: 'تعمّق أكثر في البحث العلمي', lessLabel: 'عرض أقل',
    normsNote: 'كلمتا "أعلى" و"أقل" تقارنانك بمتوسطات منشورة تقريبية لهذا الاستبيان — من عيّنات إنترنت غربية غالباً، لا معايير من هذا التطبيق. ومع سؤالين فقط لكل سمة، اعتبر كل نتيجة نطاقاً تقريبياً لا درجة دقيقة: إعادة الاختبار ستتذبذب قليلاً دون أن يتغيّر فيك شيء.',
    closingTitle: 'ماذا يقول العلم عن العوامل الخمسة كلّها',
    closing: 'سمات العوامل الخمسة موروثة بنسبة تقارب ٤٠-٦٠٪ بحسب دراسات التوائم (Jang, Livesley & Vernon, 1996)، وتظهر بنفس البنية تقريباً عبر أكثر من ٥٠ ثقافة حول العالم (McCrae & Terracciano, 2005) — أي أنها توصيل حقيقي وثابت في الشخصية، وليست مزاجاً عابراً. لكن "الثبات" لا يعني "الجمود": هذه السمات تتغيّر تدريجياً خلال مراحل البلوغ مع الجهد المستمر والتجارب الجديدة (Roberts, Walton & Viechtbauer, 2006). لا توجد سمة "جيدة" أو "سيئة" — فكل سمة تحمل مزايا وتكاليف بحسب الموقف.',
  },
};

const loadSaved = () => {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (v && v.traits) return v;
  } catch { /* ignore */ }
  return null;
};

function scoreTraits(answers) {
  const sums = {};
  const counts = {};
  ITEMS.forEach((item) => {
    const raw = answers[item.id];
    if (raw == null) return;
    const val = item.reverse ? 8 - raw : raw;
    sums[item.trait] = (sums[item.trait] || 0) + val;
    counts[item.trait] = (counts[item.trait] || 0) + 1;
  });
  const traits = {};
  TRAITS.forEach((t) => {
    const mean = sums[t.id] / (counts[t.id] || 1); // 1..7
    traits[t.id] = Math.round(((mean - 1) / 6) * 100); // 0..100
  });
  return traits;
}

/*
 * ⚠ 50 IS NOT AVERAGE, AND TREATING IT AS ONE BIASED EVERY RESULT (2026-09-07).
 *
 * The old takeaway ranked traits by distance from the midpoint of the bar. But
 * the midpoint of a scale is not the middle of a population: on the TIPI,
 * published means sit WELL above the midpoint for agreeableness (~5.2/7) and
 * conscientiousness (~5.4/7) and near it for extraversion. So "your two most
 * distinctive traits" systematically selected the same two traits for almost
 * everybody, and a perfectly average-agreeable person was told that warmth was
 * one of the two things that defines them.
 *
 * Comparison is now against approximate published TIPI norms (Gosling, Rentfrow
 * & Swann, 2003 and the norms distributed with it), which is what makes "higher
 * than most people" a statement about other people rather than about the
 * geometry of a progress bar.
 *
 * ⚠ THEY ARE APPROXIMATE, LARGELY WESTERN INTERNET-SAMPLE NORMS, and the
 * results screen says so. Presenting a precise percentile off a 2-item scale
 * would be a bigger lie than the one being fixed.
 */
const NORMS = {
  openness: { m: 5.38, sd: 1.07 },
  conscientiousness: { m: 5.40, sd: 1.32 },
  extraversion: { m: 4.44, sd: 1.45 },
  agreeableness: { m: 5.23, sd: 1.11 },
  stability: { m: 4.83, sd: 1.42 },
};

/** The bar stores 0–100; the norms live on the original 1–7 scale. */
const rawFromPct = (pct) => 1 + (pct / 100) * 6;
const zFor = (id, pct) => (rawFromPct(pct) - NORMS[id].m) / NORMS[id].sd;

/*
 * ⚠ A BAND, NOT A POINT. The TIPI measures each trait with TWO items, which
 * carries a lot of measurement error — its own authors describe it as the
 * measure to use when brevity matters more than precision, and say outright not
 * to prefer it over longer instruments. Rendering "78" invites the user to read
 * a precision that is not there, and then a retake moves several points on noise
 * alone and reads as their personality having changed. Three bands are about as
 * much resolution as two items can honestly support.
 */
export function bandFor(id, pct, isAr) {
  const z = zFor(id, pct);
  if (z >= 0.5) return isAr ? 'أعلى من معظم الناس' : 'Higher than most';
  if (z <= -0.5) return isAr ? 'أقل من معظم الناس' : 'Lower than most';
  return isAr ? 'قريب من المتوسط' : 'About average';
}

/** The two traits furthest from the population average, in either direction. */
function buildTakeaway(traits, isAr) {
  const entries = TRAITS.map((t) => ({ id: t.id, z: zFor(t.id, traits[t.id]) }));
  entries.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
  const [first, second] = entries;
  const phrase = (e) => {
    const p = PLAIN[e.id];
    if (isAr) return e.z >= 0 ? p.highAr : p.lowAr;
    return e.z >= 0 ? p.highEn : p.lowEn;
  };
  return isAr
    ? `بعبارة بسيطة: ${phrase(first)}، و${phrase(second)}. هذا مزيجك الحالي — ليس حكماً نهائياً.`
    : `In plain terms: ${phrase(first)}, and ${phrase(second)}. That's your current mix — not a verdict.`;
}

export default function PersonalityQuiz({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? TEXT.ar : TEXT.en;
  const [saved, setSaved] = useState(() => loadSaved());
  const [phase, setPhase] = useState(saved ? 'result' : 'intro'); // intro | quiz | midpoint | scenario-intro | scenario | result
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [traits, setTraits] = useState(saved?.traits || null);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [scenarioAnswers, setScenarioAnswers] = useState({});

  const start = () => {
    playSfx?.('click');
    setAnswers({}); setIndex(0); setScenarioIndex(0); setScenarioAnswers({});
    setPhase('quiz');
  };

  const finish = (result, scenarioData) => {
    const rec = { traits: result, scenarioAnswers: scenarioData || null, savedAt: Date.now() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rec)); } catch { /* ignore */ }
    markWellbeingPracticeDone('personality-quiz');
    setSaved(rec);
    playSfx?.('collect');
    setPhase('result');
  };

  const answerLikert = (val) => {
    playSfx?.('click');
    const item = ITEMS[index];
    const next = { ...answers, [item.id]: val };
    setAnswers(next);
    const nextIndex = index + 1;
    setTimeout(() => {
      if (nextIndex >= ITEMS.length) {
        setTraits(scoreTraits(next));
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
      finish(traits, scenarioAnswers);
    }
  };

  const skipScenarios = () => {
    playSfx?.('click');
    finish(traits, null);
  };

  const scenario = SCENARIOS[scenarioIndex];
  const scenarioAnswered = scenario && scenarioAnswers[scenario.id];

  return (
    <PracticeShell title={t.title} accent={ACCENT} accentLit={ACCENT_LIT} isAr={isAr} onBack={onBack}>
      <style>{QUIZ_CSS}</style>
      <style>{SAFETY_CSS}</style>

      {phase === 'intro' && (
        <div className="rxp-body rxp-center" style={{ '--rx-hue': ACCENT, '--rx-hue-lit': ACCENT_LIT }}>
          <PracticeHero emoji="🧭" />
          <KawkabSay>{t.kawkabIntro}</KawkabSay>
          <div className="qz-intro-meta">{t.meta}</div>
          <p className="qz-cite">{t.cite}</p>
          {saved && <p className="qz-cite">{t.savedNote}</p>}
          <button className="rxp-primary" onClick={start}>{saved ? t.retake : t.start}</button>
          <p className="qz-disclaimer">{t.disclaimer}</p>
        </div>
      )}

      {phase === 'quiz' && (
        <div className="rxp-body" style={{ '--rx-hue': ACCENT, '--rx-hue-lit': ACCENT_LIT }}>
          <div className="qz-progress" dir="ltr">{index + 1} / {ITEMS.length}</div>
          <div className="qz-item-text">
            {t.prompt}<br /><strong>{isAr ? ITEMS[index].ar : ITEMS[index].en}</strong>
          </div>
          <QuestionExample>{isAr ? ITEMS[index].exampleAr : ITEMS[index].example}</QuestionExample>
          <LikertRow value={answers[ITEMS[index].id] || null} onChange={answerLikert} leftLabel={t.left} rightLabel={t.right} />
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

      {phase === 'result' && traits && (
        <div className="rxp-body" style={{ '--rx-hue': ACCENT, '--rx-hue-lit': ACCENT_LIT }}>
          <KawkabSay>{buildTakeaway(traits, isAr)}</KawkabSay>
          <div className="rxp-label" style={{ textAlign: 'center' }}>{t.resultsTitle}</div>
          {TRAITS.map((tr) => (
            <TraitBar
              key={tr.id}
              label={isAr ? tr.ar : tr.en}
              value={traits[tr.id]}
              color={tr.color}
              valueLabel={bandFor(tr.id, traits[tr.id], isAr)}
              tryThis={isAr ? tr.tryAr : tr.tryEn}
            >
              {isAr ? tr.blurbAr : tr.blurbEn}
              <DeeperScience moreLabel={t.moreLabel} lessLabel={t.lessLabel}>
                {isAr ? tr.deeperAr : tr.deeperEn}
              </DeeperScience>
            </TraitBar>
          ))}
          <div style={{ marginTop: 6, padding: '14px 16px', borderRadius: 14, background: `${ACCENT}14`, border: `1.5px solid ${ACCENT}40` }}>
            <div style={{ fontWeight: 800, fontSize: 13.5, color: ACCENT, marginBottom: 6 }}>{t.closingTitle}</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.6, color: SUB }}>{t.closing}</div>
          </div>
          <p className="qz-disclaimer">{t.normsNote}</p>
          <button className="rxp-ghost" onClick={start}>{t.retake}</button>
          <p className="qz-disclaimer" style={{ color: FAINT }}>{t.disclaimer}</p>
          <SafetyNote isAr={isAr} />
        </div>
      )}
    </PracticeShell>
  );
}
