/*
 * The practice registry — extracted from RelaxScreen so more than one screen
 * can name a practice without importing the whole screen.
 *
 * NeuralPanel (on Home) shows a recommended practice by id and needs its title;
 * importing RelaxScreen for that would pull the entire Wellbeing screen into
 * Home's chunk. Copying the eight titles instead would guarantee drift the
 * first time one is reworded. So the data moves here and both import it.
 */
// The practice registry (each opens a full-screen practice). Categories below
// reference these by id; a practice may appear in more than one category.
export const RELAX_PRACTICES = [
  { id: 'mbsr', icon: '🧘', color: '#c47a3e',
    title: '8-Week MBSR', titleAr: 'اليقظة الذهنية — ٨ أسابيع',
    sub: 'Mindfulness-Based Stress Reduction — a guided daily practice with a timer, an 8-week tracker and a full guide.',
    subAr: 'برنامج اليقظة الذهنية للحدّ من التوتر — ممارسة يومية موجّهة مع مؤقّت ومتابعة ٨ أسابيع ودليل كامل.' },
  { id: 'breathe', icon: '🫁', color: '#5aa9c8',
    title: 'Breathe', titleAr: 'تنفّس',
    sub: 'A guided breathing pacer — box, 4-7-8, coherent & physiological-sigh patterns.',
    subAr: 'موجّه تنفّس متحرّك — أنماط الصندوق و٤-٧-٨ والمتناغم والتنهيدة.' },
  { id: 'grounding', icon: '🖐️', color: '#6fae7a',
    title: '5-4-3-2-1 Grounding', titleAr: 'تأريض ٥-٤-٣-٢-١',
    sub: 'Break acute anxiety by walking through your five senses in the moment.',
    subAr: 'اكسر القلق الحاد بالمرور على حواسك الخمس في اللحظة.' },
  { id: 'pmr', icon: '💪', color: '#b07ac8',
    title: 'Muscle Relaxation', titleAr: 'استرخاء العضلات',
    sub: 'Progressive tense-and-release through the body — great for tension and sleep.',
    subAr: 'شدّ وإرخاء تدريجي للجسم — ممتاز للتوتر والنوم.' },
  { id: 'ikigai', icon: '🎯', color: '#c9a24b',
    title: 'Ikigai', titleAr: 'إيكيغاي',
    sub: 'Reflect on what you love, what you\'re good at, what the world needs, and what you can offer — and glimpse your purpose.',
    subAr: 'تأمّل فيما تحبّ وما تجيد وما يحتاجه العالم وما يمكنك تقديمه — ولمح معنى حياتك.' },
  { id: 'personality-quiz', icon: '🧭', color: '#c47a3e',
    title: 'Big Five Personality', titleAr: 'الشخصية — العوامل الخمسة',
    sub: 'A validated 10-question science quiz (TIPI) mapping your Openness, Conscientiousness, Extraversion, Agreeableness & Neuroticism — with the research behind each trait.',
    subAr: 'اختبار علمي موثّق من ١٠ أسئلة (TIPI) يقيس انفتاحك وضميرك الحي وانبساطك وتوافقك واستقرارك العاطفي — مع الأبحاث وراء كل سمة.' },
  { id: 'relationship-quiz', icon: '💞', color: '#c86f8f',
    title: 'Attachment Style', titleAr: 'نمط التعلّق',
    sub: 'A validated 12-question quiz (ECR-S) revealing your attachment style in close relationships, grounded in decades of attachment research.',
    subAr: 'اختبار موثّق من ١٢ سؤالاً (ECR-S) يكشف نمط تعلّقك في العلاقات الحميمة، مبنيّ على عقود من أبحاث نظرية التعلّق.' },
  { id: 'sleep-sounds', icon: '🌧️', color: '#7b86c8',
    title: 'Sleep Sounds', titleAr: 'أصوات النوم',
    sub: 'A looping ambient sound to play while you wind down or drift off.',
    subAr: 'صوت محيطي متكرر لتشغيله أثناء الاسترخاء أو النوم.' },
];
