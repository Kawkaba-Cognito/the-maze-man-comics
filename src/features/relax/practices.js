/*
 * The practice registry — extracted from RelaxScreen so more than one screen
 * can name a practice without importing the whole screen.
 *
 * NeuralPanel (on Home) shows a recommended practice by id and needs its title;
 * importing RelaxScreen for that would pull the entire Wellbeing screen into
 * Home's chunk. Copying the eight titles instead would guarantee drift the
 * first time one is reworded. So the data moves here and both import it.
 */
import { WORKSHEETS } from './worksheets.js';

/*
 * ⚠ `tier` IS REQUIRED ON EVERY ENTRY BELOW (2026-09-10) — the same
 * meta/protocol/replicated/framework scale worksheets already carried
 * (see TIERS in worksheetEngine.jsx, the one place the four labels are
 * defined), now printed on every practice card, not just worksheets. This
 * is the single biggest fix for "Wellbeing feels random": it was previously
 * possible to open a quiz or a breathing pacer and see nothing about its own
 * evidence basis unless you happened to read deep in-app copy. Now the menu
 * itself states it, honestly graded, before you tap.
 *
 * Grading calls (kept close to the source rather than asserted):
 *   meta        WHO-5 (Topp et al., 2015, systematic review of the instrument)
 *   protocol    MBSR-inspired practice, PMR (Jacobson), Sleep Reset (CBT-I
 *               stimulus control component)
 *   replicated  Big Five/TIPI (Gosling et al., 2003 — replicated cross-
 *               culturally as a brief instrument), Good News / active-
 *               constructive responding (Gable et al., 2004 research
 *               programme)
 *   framework   Breathe (bundles patterns of very different evidence
 *               strength — physiological sigh has a dedicated RCT, box/
 *               4-7-8 do not, so the practice is graded on its weakest
 *               pattern rather than its strongest), Grounding (clinical
 *               consensus for acute anxiety, not itself RCT-tested as a
 *               standalone technique), Ikigai (a values/purpose reflection
 *               exercise — see the note on that entry below), the
 *               Attachment quiz (ADAPTED items, not the validated
 *               instrument — see that entry below), Sleep Sounds (a single
 *               ambient loop; no evidence claim attaches to it at all)
 */

// The practice registry (each opens a full-screen practice). Categories below
// reference these by id; a practice may appear in more than one category.
export const RELAX_PRACTICES = [
  /* ⚠ NOT "MBSR" — see the header note in RelaxScreen's MbsrTracker. MBSR is a
     specific taught course, and the evidence people mean when they say the word
     was collected on that taught format. This is a self-guided programme built
     on the same practices, which is a fair thing to offer and a different thing
     to claim. The `id` stays 'mbsr' so no saved progress or habit link breaks. */
  { id: 'mbsr', icon: '🧘', color: '#c47a3e', tier: 'protocol',
    title: '8 Weeks of Mindfulness', titleAr: 'اليقظة الذهنية — ٨ أسابيع',
    sub: 'A self-guided daily programme inspired by MBSR — a timer, an 8-week tracker and a full guide.',
    subAr: 'برنامج يومي ذاتي التوجيه مستوحى من MBSR — مؤقّت ومتابعة ٨ أسابيع ودليل كامل.' },
  { id: 'breathe', icon: '🫁', color: '#5aa9c8', tier: 'framework',
    title: 'Breathe', titleAr: 'تنفّس',
    sub: 'A guided breathing pacer — box, 4-7-8, coherent & physiological-sigh patterns.',
    subAr: 'موجّه تنفّس متحرّك — أنماط الصندوق و٤-٧-٨ والمتناغم والتنهيدة.' },
  { id: 'grounding', icon: '🖐️', color: '#6fae7a', tier: 'framework',
    title: '5-4-3-2-1 Grounding', titleAr: 'تأريض ٥-٤-٣-٢-١',
    sub: 'Break acute anxiety by walking through your five senses in the moment.',
    subAr: 'اكسر القلق الحاد بالمرور على حواسك الخمس في اللحظة.' },
  { id: 'pmr', icon: '💪', color: '#b07ac8', tier: 'protocol',
    title: 'Muscle Relaxation', titleAr: 'استرخاء العضلات',
    sub: 'Progressive tense-and-release through the body — great for tension and sleep.',
    subAr: 'شدّ وإرخاء تدريجي للجسم — ممتاز للتوتر والنوم.' },
  /* ⚠ REWRITTEN 2026-09-10. The old copy read "glimpse your purpose" over a
     four-circle Venn diagram implicitly presented as Ikigai — but that exact
     diagram is a Western business-coaching invention, not a concept from the
     Japanese sources the word comes from (Mieko Kamiya's work, or the Ogimi
     longevity studies), and it has no direct experimental evidence of its
     own. The exercise is still worth having — values/purpose reflection is a
     real and useful thing to do — it just is not "the ancient Japanese
     secret to a long life" a lot of internet content claims. Framed honestly
     now as a reflection exercise Ikigai INSPIRED, not Ikigai itself. */
  { id: 'ikigai', icon: '🎯', color: '#c9a24b', tier: 'framework',
    title: 'Purpose Compass', titleAr: 'بوصلة المعنى',
    sub: 'A reflection exercise inspired by Ikigai — where what you love, what you\'re good at, what the world needs and what you can offer overlap. A useful lens for thinking about purpose, not a proven method for finding it.',
    subAr: 'تأمّل مستوحى من مفهوم "إيكيغاي" الياباني — حيث تتقاطع ما تحبّه وما تجيده وما يحتاجه العالم وما يمكنك تقديمه. عدسة مفيدة للتفكير في المعنى، لا طريقة مُثبَتة لإيجاده.' },
  { id: 'personality-quiz', icon: '🧭', color: '#c47a3e', tier: 'replicated',
    title: 'Big Five Personality', titleAr: 'الشخصية — العوامل الخمسة',
    sub: 'A 10-question brief form (TIPI) mapping your Openness, Conscientiousness, Extraversion, Agreeableness & Neuroticism — a short instrument, replicated across many studies, not a full clinical assessment.',
    subAr: 'استبيان قصير من ١٠ أسئلة (TIPI) يقيس انفتاحك وضميرك الحي وانبساطك وتوافقك واستقرارك العاطفي — أداة موجزة تكرّرت نتائجها في دراسات عديدة، وليست تقييماً إكلينيكياً كاملاً.' },
  /* ⚠ REWORDED 2026-09-10. This blurb said "A validated 12-question quiz
     (ECR-S)... grounded in decades of attachment research" — an overclaim
     the clinical audit already fixed INSIDE RelationshipQuiz.jsx itself
     (which correctly says "Adapted, not the original instrument — so treat
     the result as a conversation starter, not a score"), but this second,
     separate description in the menu registry was never updated to match.
     Exactly the two-lists-disagree failure this repo's own history keeps
     recording elsewhere. */
  { id: 'relationship-quiz', icon: '💞', color: '#c86f8f', tier: 'framework',
    title: 'Attachment Style', titleAr: 'نمط التعلّق',
    sub: 'A 12-question reflection adapted from the attachment research literature (ECR-S family) — not the validated instrument itself, so treat the result as a conversation starter, not a score.',
    subAr: 'تأمّل من ١٢ سؤالاً مقتبس من أدبيات أبحاث التعلّق (عائلة ECR-S) — وليس الأداة الموثّقة نفسها، فاعتبر النتيجة بداية حوار لا درجة نهائية.' },
  { id: 'sleep-sounds', icon: '🌧️', color: '#7b86c8', tier: 'framework',
    title: 'Sleep Sounds', titleAr: 'أصوات النوم',
    sub: 'A looping ambient sound to play while you wind down or drift off.',
    subAr: 'صوت محيطي متكرر لتشغيله أثناء الاسترخاء أو النوم.' },
  /* ⚠ The Sleep pillar shipped with relaxation, breathing and a rain loop — the
     three WEAKEST arms available, while the first-line treatment for chronic
     insomnia in every major guideline (CBT-I) was absent entirely. */
  { id: 'sleep-reset', icon: '🛏️', tier: 'protocol',
    title: 'Sleep Reset', titleAr: 'إعادة ضبط النوم',
    sub: 'A morning sleep log that tracks your sleep efficiency, plus the stimulus-control rules that CBT-I is built on.',
    subAr: 'سجلّ نوم صباحي يتتبّع كفاءة نومك، مع قواعد ضبط المثير التي يقوم عليها العلاج المعرفي السلوكي للأرق.' },
  /* ⚠ Relationships previously held ONE QUIZ ABOUT YOURSELF and no practice —
     a pillar you could finish without doing anything involving another person. */
  { id: 'connect', icon: '💬', tier: 'replicated',
    title: 'Good News', titleAr: 'الأخبار الجيدة',
    sub: "How you respond when someone's news is good predicts a relationship better than how you respond when it's bad. Four moments, then one thing to actually say.",
    subAr: 'طريقة استجابتك حين يكون خبر أحدهم جيداً تتنبّأ بالعلاقة أكثر من استجابتك حين يكون سيّئاً. أربع لحظات، ثم أمر واحد لتقوله فعلاً.' },
  /* ⚠ The one VALIDATED OUTCOME measure in the feature — the only thing that can
     answer "is any of this working?". See Who5Practice for why it is presented
     as a wellbeing score and never as a depression screen. */
  { id: 'who5', icon: '📊', tier: 'meta',
    title: 'Wellbeing Check-in', titleAr: 'قياس العافية',
    sub: 'The WHO-5 index — five questions, tracked over time, so you can see whether anything is actually changing.',
    subAr: 'مؤشّر WHO-5 — خمسة أسئلة تُتابَع عبر الزمن، لترى إن كان شيء يتغيّر فعلاً.' },

  /* ⚠ WORKSHEET ENTRIES ARE DERIVED, NOT LISTED. Everything below this line is
     built from `worksheets.js`, so authoring a worksheet is the ONLY step needed
     to make it appear in a category — no second registry to forget, which is the
     failure mode CLAUDE.md records for training games (a module that keeps its
     own list of ids and silently omits a new one). It also means a worksheet's
     title, blurb AND tier have exactly one source and cannot drift. */
  ...WORKSHEETS.map((w) => ({
    id: w.id,
    icon: w.icon,
    worksheet: true,
    tier: w.tier,
    title: w.title.en,
    titleAr: w.title.ar,
    sub: w.intro.en,
    subAr: w.intro.ar,
  })),
];
