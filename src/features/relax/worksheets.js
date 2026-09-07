/*
 * The worksheet library — content as DATA. `worksheetEngine.jsx` is the only
 * renderer; adding a worksheet here is authoring an object, not writing a
 * screen. That is the whole point: the previous Wellbeing content cost a new
 * component per practice, so it stayed thin.
 *
 * ── RULES FOR ANYTHING ADDED HERE ─────────────────────────────────────────
 *
 * 1. ⚠ `tier` IS REQUIRED AND THE RUNTIME PRINTS IT. The clinical audit found
 *    this feature's worst failures were overclaims — "validated ECR-S" over
 *    adapted items, "8-Week MBSR" over a solo timer. Making the strength of the
 *    evidence a field, rendered on screen, is how that stops depending on
 *    whoever writes the next one. Use `meta` only where a meta-analysis really
 *    exists for THIS technique; `protocol` where it is a component of an
 *    established treatment; `replicated` for a solid research line; `framework`
 *    for a useful idea with no experimental base.
 * 2. EN and AR on the same object, never in separate files. The audit found a
 *    Latin word inside an Arabic label and two disclaimers that said different
 *    things in the two languages; both were possible because the halves lived
 *    apart.
 * 3. ⚠ NOTHING HERE MAY DIAGNOSE, SCORE OR STRATIFY. These are structured
 *    reflection, not instruments. The one validated measure in the feature is
 *    WHO-5, which lives in its own screen with its own cut-offs and cadence.
 * 4. Ask nothing a user would be harmed by someone else reading off an unlocked
 *    device — answers are plain localStorage, unencrypted.
 */

export const WORKSHEETS = [
  /* ────────────────────────────────────────────────────────────────────────
   * CALM — the thought record. The single most-used worksheet in CBT, and the
   * one the app was most obviously missing: everything in Stress & Calm was
   * somatic (breathe, tense, orient) and nothing addressed the thought that
   * produced the state.
   */
  {
    id: 'ws-thought-record',
    area: 'calm',
    icon: '🧾',
    tier: 'protocol',
    title: { en: 'Thought Record', ar: 'سجلّ الأفكار' },
    meta: { en: '9 steps · about 8 minutes', ar: '٩ خطوات · حوالي ٨ دقائق' },
    intro: {
      en: 'Take one moment that knocked you sideways and slow it down: what happened, what you told yourself about it, and what the evidence actually supports.',
      ar: 'خذ لحظة واحدة أربكتك وأبطئها: ماذا حدث، وماذا قلت لنفسك عنه، وما الذي تدعمه الأدلة فعلاً.',
    },
    cite: {
      en: 'Cognitive restructuring — the core component of cognitive behavioural therapy (Beck). CBT for anxiety and depression is among the most heavily meta-analysed treatments in psychology.',
      ar: 'إعادة البناء المعرفي — المكوّن الأساسي في العلاج المعرفي السلوكي (بيك). والعلاج المعرفي السلوكي للقلق والاكتئاب من أكثر العلاجات خضوعاً للتحليلات البَعدية في علم النفس.',
    },
    steps: [
      {
        id: 'read', kind: 'read',
        heading: { en: 'A thought is not a fact', ar: 'الفكرة ليست حقيقة' },
        body: {
          en: [
            'When something upsets us, the feeling seems to come straight from the event. It rarely does. Between the two sits a thought, usually so fast you do not notice it.',
            'The point of this sheet is not positive thinking. It is checking one specific thought against the evidence — and sometimes the evidence agrees with it, which is worth knowing too.',
          ],
          ar: [
            'حين يزعجنا شيء، يبدو أن الشعور جاء من الحدث مباشرة. ونادراً ما يكون كذلك. فبينهما فكرة، سريعة إلى حدّ أنك غالباً لا تلاحظها.',
            'الهدف من هذه الورقة ليس التفكير الإيجابي. بل فحص فكرة محدّدة أمام الأدلة — وأحياناً تتفق الأدلة معها، وهذا أيضاً يستحق أن تعرفه.',
          ],
        },
      },
      {
        id: 'situation', kind: 'write',
        label: { en: 'What happened?', ar: 'ماذا حدث؟' },
        hint: { en: 'Just the facts — what a camera would have recorded. Where, when, who.', ar: 'الوقائع فقط — ما كانت الكاميرا لتسجّله. أين ومتى ومع من.' },
        placeholder: { en: 'The situation, without interpretation…', ar: 'الموقف، دون تفسير…' },
      },
      {
        id: 'feeling', kind: 'write',
        label: { en: 'What did you feel?', ar: 'بماذا شعرت؟' },
        hint: { en: 'One or two words — anxious, ashamed, angry, flat.', ar: 'كلمة أو كلمتان — قلق، خجل، غضب، خمول.' },
        placeholder: { en: 'The emotion, named…', ar: 'الشعور، مسمّى…' },
        rows: 2,
      },
      {
        id: 'intensity', kind: 'scale',
        label: { en: 'How strong was it?', ar: 'ما شدّته؟' },
        low: { en: '0 · barely', ar: '٠ · بالكاد' }, high: { en: '10 · overwhelming', ar: '١٠ · طاغٍ' },
      },
      {
        id: 'thought', kind: 'write',
        label: { en: 'What went through your mind?', ar: 'ما الذي دار في ذهنك؟' },
        hint: { en: 'The sentence underneath the feeling. Often it is harsh and absolute — "I always…", "they think I…".', ar: 'الجملة الكامنة تحت الشعور. غالباً ما تكون قاسية ومطلقة — "أنا دائماً…"، "هم يظنون أنني…".' },
        placeholder: { en: 'The thought, in its own words…', ar: 'الفكرة، بكلماتها هي…' },
      },
      {
        id: 'belief', kind: 'scale',
        label: { en: 'How much did you believe it, at the time?', ar: 'إلى أي حد صدّقتها، في تلك اللحظة؟' },
        low: { en: '0 · not at all', ar: '٠ · إطلاقاً' }, high: { en: '10 · completely', ar: '١٠ · تماماً' },
      },
      {
        id: 'for', kind: 'write',
        label: { en: 'What evidence supports the thought?', ar: 'ما الأدلة التي تدعم الفكرة؟' },
        hint: { en: 'Take it seriously. A thought you can dismiss in one line was never the problem.', ar: 'خذها على محمل الجد. الفكرة التي يمكن دحضها بسطر واحد لم تكن المشكلة أصلاً.' },
        placeholder: { en: 'Facts that back it up…', ar: 'وقائع تسندها…' },
      },
      {
        id: 'against', kind: 'write',
        label: { en: 'What evidence does not fit it?', ar: 'ما الأدلة التي لا تتّسق معها؟' },
        hint: { en: 'Times it was not true. What you would say to a friend who said this about themselves.', ar: 'مرات لم تكن فيها صحيحة. وما كنت ستقوله لصديق قال هذا عن نفسه.' },
        placeholder: { en: 'Facts that do not fit…', ar: 'وقائع لا تتّسق معها…' },
      },
      {
        id: 'alternative', kind: 'write',
        label: { en: 'What is a fairer way to put it?', ar: 'ما الصياغة الأكثر إنصافاً؟' },
        hint: { en: 'Not a cheerful one — an accurate one, that holds both columns above.', ar: 'ليست صياغة مبهجة — بل دقيقة، تحتمل ما في العمودين أعلاه.' },
        placeholder: { en: 'The more accurate thought…', ar: 'الفكرة الأدقّ…' },
      },
      {
        id: 'rebelief', kind: 'scale',
        label: { en: 'Now, how much do you believe the original thought?', ar: 'والآن، إلى أي حد تصدّق الفكرة الأصلية؟' },
        hint: { en: 'A small drop is the normal result. This is not meant to reach zero.', ar: 'الانخفاض الطفيف هو النتيجة المعتادة. وليس المقصود أن تصل إلى الصفر.' },
        low: { en: '0 · not at all', ar: '٠ · إطلاقاً' }, high: { en: '10 · completely', ar: '١٠ · تماماً' },
      },
    ],
    closing: {
      en: 'If the belief barely moved, that is information rather than failure — some thoughts are held in place by something a single sheet cannot reach, and that is worth taking to a therapist rather than repeating alone.',
      ar: 'إن لم يتحرّك اقتناعك تقريباً، فتلك معلومة لا فشل — فبعض الأفكار تثبّتها أمور لا تصل إليها ورقة واحدة، ويستحق ذلك أن يُطرح على معالج بدل تكراره وحدك.',
    },
  },

  /* ────────────────────────────────────────────────────────────────────────
   * CALM — worry postponement. Stimulus control applied to worry (Borkovec).
   * Chosen because it is the rare technique that asks the user to do LESS, and
   * it is the standard first move in treating generalised worry.
   */
  {
    id: 'ws-worry-window',
    area: 'calm',
    icon: '⏳',
    tier: 'protocol',
    title: { en: 'Worry Window', ar: 'نافذة القلق' },
    meta: { en: '6 steps · about 5 minutes', ar: '٦ خطوات · حوالي ٥ دقائق' },
    intro: {
      en: 'Worry does not respond well to being fought. It responds to being given an appointment — one fixed slot a day, and everything else postponed to it.',
      ar: 'القلق لا يستجيب جيداً لمقاومته. بل يستجيب لأن تُحدّد له موعداً — فترة ثابتة واحدة يومياً، ويُؤجَّل إليها كل ما عداها.',
    },
    cite: {
      en: 'Stimulus-control treatment for worry (Borkovec and colleagues), a standard component of CBT for generalised anxiety.',
      ar: 'علاج ضبط المثير للقلق (Borkovec وزملاؤه)، وهو مكوّن قياسي في العلاج المعرفي السلوكي لاضطراب القلق العام.',
    },
    steps: [
      {
        id: 'read', kind: 'read',
        heading: { en: 'Not less worry. Worry, later.', ar: 'ليس قلقاً أقل. بل قلق، لاحقاً.' },
        body: {
          en: [
            'Telling yourself to stop worrying does not work; it makes the thought louder. Postponing it does, because you are not refusing the worry — you are moving it.',
            'Through the day, when a worry arrives, note it in one line and tell yourself you will think about it properly at your worry time. Most of them lose their charge before the slot arrives. The ones that do not are the ones worth your attention.',
          ],
          ar: [
            'أن تطلب من نفسك التوقف عن القلق لا ينفع؛ بل يجعل الفكرة أعلى صوتاً. أمّا تأجيله فينفع، لأنك لا ترفض القلق — بل تنقله.',
            'خلال اليوم، حين يصلك قلق، دوّنه في سطر واحد وقل لنفسك إنك ستفكّر فيه جيداً في وقت القلق. معظمها يفقد شحنته قبل حلول الموعد. وما يبقى منها هو ما يستحق انتباهك.',
          ],
        },
      },
      {
        id: 'worries', kind: 'write',
        label: { en: 'What is circling right now?', ar: 'ما الذي يدور في ذهنك الآن؟' },
        hint: { en: 'One line each. You are parking them, not solving them.', ar: 'سطر لكل واحد. أنت تركنها، لا تحلّها.' },
        placeholder: { en: 'The worries, briefly…', ar: 'المخاوف، باختصار…' },
        rows: 5,
      },
      {
        id: 'sort', kind: 'choice',
        label: { en: 'Of those, how many can you actually act on today?', ar: 'من بينها، كم واحداً يمكنك التصرّف بشأنه اليوم فعلاً؟' },
        hint: { en: 'This is the split that matters: a problem to solve, or a fear to sit with.', ar: 'هذا هو الفصل المهم: مشكلة تُحلّ، أم خوف تتعايش معه.' },
        options: [
          { id: 'none', en: 'None of them — they are all about things outside my control', ar: 'ولا واحد — كلها عن أمور خارج سيطرتي' },
          { id: 'some', en: 'One or two have a next step', ar: 'واحد أو اثنان لهما خطوة تالية' },
          { id: 'most', en: 'Most of them are real tasks I have been avoiding', ar: 'معظمها مهام حقيقية كنت أتجنّبها' },
        ],
      },
      {
        id: 'window', kind: 'plan',
        label: { en: 'Set the window', ar: 'حدّد النافذة' },
      },
      {
        id: 'where', kind: 'write',
        label: { en: 'Where will you do it?', ar: 'أين ستفعل ذلك؟' },
        hint: { en: 'Somewhere that is not your bed, and not where you relax. The place gets associated with the activity.', ar: 'مكان ليس سريرك، وليس حيث تسترخي. فالمكان يرتبط بالنشاط.' },
        placeholder: { en: 'The chair, the desk, the walk…', ar: 'الكرسي، المكتب، أثناء المشي…' },
        rows: 2,
      },
      {
        id: 'confidence', kind: 'scale',
        label: { en: 'How likely are you to actually postpone, rather than follow the worry?', ar: 'ما احتمال أن تؤجّل فعلاً، بدل أن تتبع القلق؟' },
        hint: { en: 'Low is a fine answer. It usually takes several days before postponing feels possible.', ar: 'الإجابة المنخفضة إجابة جيدة. فالأمر يستغرق عادةً أياماً عدة قبل أن يبدو التأجيل ممكناً.' },
      },
    ],
    closing: {
      en: 'Do not judge this on the first day. The skill is the noticing-and-parking, and it takes a week or two before the parking holds.',
      ar: 'لا تحكم على هذا في اليوم الأول. فالمهارة هي الملاحظة والتأجيل، وتحتاج أسبوعاً أو اثنين قبل أن يثبت التأجيل.',
    },
  },

  /* ────────────────────────────────────────────────────────────────────────
   * MEANING — values clarification. The Meaning pillar held one practice
   * (Ikigai), whose diagram is a Western relabelling rather than a technique.
   * This is the ACT version, which is an actual clinical procedure.
   */
  {
    id: 'ws-values-compass',
    area: 'meaning',
    icon: '🧭',
    tier: 'protocol',
    title: { en: 'Values Compass', ar: 'بوصلة القيم' },
    meta: { en: '6 steps · about 7 minutes', ar: '٦ خطوات · حوالي ٧ دقائق' },
    intro: {
      en: 'Not goals — directions. A goal can be finished; a value is a way of going, and it tells you what to do on an ordinary Tuesday.',
      ar: 'ليست أهدافاً — بل اتجاهات. فالهدف يمكن إنهاؤه؛ أمّا القيمة فطريقة في السير، وهي التي تخبرك بما تفعله في يوم ثلاثاء عادي.',
    },
    cite: {
      en: 'Values clarification as used in Acceptance and Commitment Therapy (Hayes and colleagues) — a core procedure of the model.',
      ar: 'توضيح القيم كما يُستخدم في علاج القبول والالتزام (Hayes وزملاؤه) — وهو إجراء أساسي في هذا النموذج.',
    },
    steps: [
      {
        id: 'read', kind: 'read',
        heading: { en: 'A direction, not a destination', ar: 'اتجاه، لا وجهة' },
        body: {
          en: [
            '"Get promoted" is a goal — you either reach it or you do not. "Do work I can respect" is a value: there is no day on which it is finished, and there is always a next step available.',
            'That difference matters most when things go badly. Goals stall. A direction can still be walked in, even slowly, even today.',
          ],
          ar: [
            '"أن أُرقّى" هدف — إمّا أن تبلغه أو لا. أمّا "أن أؤدّي عملاً أحترمه" فقيمة: لا يوجد يوم تنتهي فيه، وهناك دائماً خطوة تالية متاحة.',
            'ويظهر هذا الفرق أوضح ما يكون حين تسوء الأمور. فالأهداف تتعثّر. أمّا الاتجاه فيمكن السير فيه، ولو ببطء، ولو اليوم.',
          ],
        },
      },
      {
        id: 'pick', kind: 'multi', max: 6,
        label: { en: 'Which of these actually matter to you?', ar: 'أي من هذه تهمّك فعلاً؟' },
        hint: { en: 'Not what should matter. Pick up to six.', ar: 'لا ما يُفترض أن يهمّ. اختر حتى ستّاً.' },
        options: [
          { id: 'kind', en: 'Kindness', ar: 'اللطف' },
          { id: 'honest', en: 'Honesty', ar: 'الصدق' },
          { id: 'learn', en: 'Learning', ar: 'التعلّم' },
          { id: 'family', en: 'Family', ar: 'العائلة' },
          { id: 'health', en: 'Health', ar: 'الصحة' },
          { id: 'craft', en: 'Doing things well', ar: 'إتقان العمل' },
          { id: 'freedom', en: 'Independence', ar: 'الاستقلالية' },
          { id: 'faith', en: 'Faith', ar: 'الإيمان' },
          { id: 'justice', en: 'Fairness', ar: 'الإنصاف' },
          { id: 'courage', en: 'Courage', ar: 'الشجاعة' },
          { id: 'humour', en: 'Humour', ar: 'روح الدعابة' },
          { id: 'service', en: 'Being useful to others', ar: 'أن أكون نافعاً للآخرين' },
          { id: 'creative', en: 'Making things', ar: 'الصنع والإبداع' },
          { id: 'calm', en: 'Steadiness', ar: 'الاتّزان' },
          { id: 'loyal', en: 'Loyalty', ar: 'الوفاء' },
          { id: 'curious', en: 'Curiosity', ar: 'الفضول' },
        ],
      },
      {
        id: 'narrow', kind: 'multi', max: 2,
        label: { en: 'Now the hard part — which two would you keep?', ar: 'والآن الجزء الصعب — أي اثنتين ستُبقي؟' },
        hint: { en: 'A list that keeps everything has sorted nothing. Choosing two does not mean the rest stopped mattering.', ar: 'القائمة التي تُبقي كل شيء لم تُرتّب شيئاً. واختيار اثنتين لا يعني أن البقية لم تعد تهمّ.' },
        options: [
          { id: 'kind', en: 'Kindness', ar: 'اللطف' },
          { id: 'honest', en: 'Honesty', ar: 'الصدق' },
          { id: 'learn', en: 'Learning', ar: 'التعلّم' },
          { id: 'family', en: 'Family', ar: 'العائلة' },
          { id: 'health', en: 'Health', ar: 'الصحة' },
          { id: 'craft', en: 'Doing things well', ar: 'إتقان العمل' },
          { id: 'freedom', en: 'Independence', ar: 'الاستقلالية' },
          { id: 'faith', en: 'Faith', ar: 'الإيمان' },
          { id: 'justice', en: 'Fairness', ar: 'الإنصاف' },
          { id: 'courage', en: 'Courage', ar: 'الشجاعة' },
          { id: 'humour', en: 'Humour', ar: 'روح الدعابة' },
          { id: 'service', en: 'Being useful to others', ar: 'أن أكون نافعاً للآخرين' },
          { id: 'creative', en: 'Making things', ar: 'الصنع والإبداع' },
          { id: 'calm', en: 'Steadiness', ar: 'الاتّزان' },
          { id: 'loyal', en: 'Loyalty', ar: 'الوفاء' },
          { id: 'curious', en: 'Curiosity', ar: 'الفضول' },
        ],
      },
      {
        id: 'gap', kind: 'scale',
        label: { en: 'How closely has the last month matched those two?', ar: 'إلى أي حد طابق الشهر الماضي هاتين القيمتين؟' },
        hint: { en: 'A gap here is the useful finding — it is where the next step comes from.', ar: 'الفجوة هنا هي النتيجة المفيدة — فمنها تأتي الخطوة التالية.' },
        low: { en: '0 · not at all', ar: '٠ · إطلاقاً' }, high: { en: '10 · closely', ar: '١٠ · بدرجة كبيرة' },
      },
      {
        id: 'action', kind: 'plan',
        label: { en: 'One small step in that direction', ar: 'خطوة صغيرة واحدة في ذلك الاتجاه' },
      },
      {
        id: 'obstacle', kind: 'write',
        label: { en: 'What will get in the way?', ar: 'ما الذي سيعترض الطريق؟' },
        hint: { en: 'Name it now. An obstacle you have already pictured is far less likely to stop you.', ar: 'سمِّه الآن. فالعائق الذي تخيّلته مسبقاً أقل احتمالاً بكثير أن يوقفك.' },
        placeholder: { en: 'The likely obstacle…', ar: 'العائق المحتمل…' },
        rows: 3,
      },
    ],
  },

  /* ────────────────────────────────────────────────────────────────────────
   * MEANING — behavioural activation. The one technique here with genuine
   * meta-analytic support as a standalone treatment, and the right answer to
   * the router's `flat` state, which previously had nothing real to offer.
   */
  {
    id: 'ws-activation',
    area: 'meaning',
    icon: '🌱',
    tier: 'meta',
    title: { en: 'Doing Comes First', ar: 'الفعل أولاً' },
    meta: { en: '6 steps · about 6 minutes', ar: '٦ خطوات · حوالي ٦ دقائق' },
    intro: {
      en: 'When mood drops, we wait to feel like doing things. The waiting is the trap — action comes first and the feeling follows it, not the other way round.',
      ar: 'حين يهبط المزاج، ننتظر أن نشعر بالرغبة في الفعل. والانتظار هو الفخّ — فالفعل يأتي أولاً ويتبعه الشعور، لا العكس.',
    },
    cite: {
      en: 'Behavioural activation. Meta-analyses of randomised trials find it as effective as cognitive therapy and antidepressant medication for depression, while being simpler to deliver.',
      ar: 'التنشيط السلوكي. تجد التحليلات البَعدية للتجارب العشوائية أنه بفعالية العلاج المعرفي ومضادات الاكتئاب في علاج الاكتئاب، مع كونه أبسط تطبيقاً.',
    },
    caution: {
      en: 'This is a self-help version of a real treatment. If low mood has lasted more than two weeks, or you have thoughts of harming yourself, please take it to a doctor rather than an app.',
      ar: 'هذه نسخة مساعدة ذاتية من علاج حقيقي. إن استمر انخفاض المزاج أكثر من أسبوعين، أو راودتك أفكار بإيذاء نفسك، فاعرض الأمر على طبيب لا على تطبيق.',
    },
    steps: [
      {
        id: 'read', kind: 'read',
        heading: { en: 'The order is backwards', ar: 'الترتيب معكوس' },
        body: {
          en: [
            'Low mood removes the appetite for exactly the things that lift it. So you do less, which gives the mood less to work against, which lowers it further. That loop is the target.',
            'Behavioural activation breaks it from the outside: you schedule the activity and do it at the scheduled time, whether or not you feel like it. Motivation is treated as an outcome, not a prerequisite.',
          ],
          ar: [
            'انخفاض المزاج يسلب الرغبة في الأشياء نفسها التي ترفعه. فتفعل أقل، فيقلّ ما يقاومه المزاج، فينخفض أكثر. هذه الحلقة هي الهدف.',
            'يكسرها التنشيط السلوكي من الخارج: تجدول النشاط وتفعله في موعده، سواء رغبت أم لا. فالدافعية تُعامَل كنتيجة، لا كشرط مسبق.',
          ],
        },
      },
      {
        id: 'lost', kind: 'write',
        label: { en: 'What have you stopped doing?', ar: 'ما الذي توقفت عن فعله؟' },
        hint: { en: 'Things that used to be ordinary — seeing someone, cooking, a walk, music, a hobby.', ar: 'أشياء كانت اعتيادية — لقاء أحدهم، الطبخ، المشي، الموسيقى، هواية.' },
        placeholder: { en: 'What has quietly dropped away…', ar: 'ما تلاشى بهدوء…' },
        rows: 4,
      },
      {
        id: 'type', kind: 'choice',
        label: { en: 'Pick one to bring back. Which kind is it?', ar: 'اختر واحداً لتستعيده. من أي نوع هو؟' },
        hint: { en: 'Both kinds matter, and people usually restore only one. The other is the one worth adding.', ar: 'كلا النوعين مهم، وعادةً ما يستعيد الناس نوعاً واحداً. والآخر هو ما يستحق الإضافة.' },
        options: [
          { id: 'pleasure', en: 'Something enjoyable', ar: 'شيء ممتع', note: { en: 'it feels good while you do it', ar: 'يشعرك بالرضا أثناء فعله' } },
          { id: 'mastery', en: 'Something with a sense of accomplishment', ar: 'شيء يمنح إحساساً بالإنجاز', note: { en: 'it feels good to have done', ar: 'يشعرك بالرضا لأنك أنجزته' } },
          { id: 'connect', en: 'Something involving another person', ar: 'شيء يشارك فيه شخص آخر', note: { en: 'the one most often dropped first', ar: 'وهو الأكثر سقوطاً في البداية' } },
        ],
      },
      {
        id: 'schedule', kind: 'plan',
        label: { en: 'Schedule it — a real day and time', ar: 'جدوِلْه — بيوم ووقت حقيقيين' },
      },
      {
        id: 'predict', kind: 'scale',
        label: { en: 'How much do you expect to enjoy it?', ar: 'كم تتوقّع أن تستمتع به؟' },
        hint: { en: 'Write the prediction down. Comparing it afterwards is the part that changes things — low mood forecasts badly, and seeing that in your own numbers is more convincing than being told.', ar: 'دوّن التوقّع. فمقارنته لاحقاً هي ما يُحدث الفرق — إذ يسيء المزاج المنخفض التنبؤ، ورؤية ذلك في أرقامك أنت أكثر إقناعاً من أن يُقال لك.' },
        low: { en: '0 · not at all', ar: '٠ · إطلاقاً' }, high: { en: '10 · a lot', ar: '١٠ · كثيراً' },
      },
      {
        id: 'blocker', kind: 'write',
        label: { en: 'What would stop you, and what is the answer to it?', ar: 'ما الذي قد يمنعك، وما الردّ عليه؟' },
        hint: { en: '"I will be too tired" → "I go anyway and leave after twenty minutes if I want to."', ar: '"سأكون متعباً جداً" ← "أذهب على أي حال وأنصرف بعد عشرين دقيقة إن أردت."' },
        placeholder: { en: 'The obstacle, and your reply to it…', ar: 'العائق، وردّك عليه…' },
        rows: 3,
      },
    ],
    closing: {
      en: 'After you do it, come back and compare what you predicted with what happened. That gap, in your own handwriting, is the whole mechanism.',
      ar: 'بعد أن تفعله، عُد وقارن ما توقّعته بما حدث. تلك الفجوة، بخطّ يدك أنت، هي الآلية كلها.',
    },
  },

  /* ────────────────────────────────────────────────────────────────────────
   * RELATIONSHIPS — repair. Pairs with the Good News practice: that one is for
   * when things go right, this is for after they go wrong.
   */
  {
    id: 'ws-repair',
    area: 'relationships',
    icon: '🕊️',
    tier: 'replicated',
    title: { en: 'Repair After a Row', ar: 'الإصلاح بعد الخلاف' },
    meta: { en: '6 steps · about 6 minutes', ar: '٦ خطوات · حوالي ٦ دقائق' },
    intro: {
      en: 'Couples who last are not the ones who argue less. They are the ones who get back from arguments faster. This is a plan for the getting back.',
      ar: 'الأزواج الذين يدومون ليسوا الأقل خلافاً. بل الأسرع عودةً من الخلاف. وهذه خطة لتلك العودة.',
    },
    cite: {
      en: 'Repair attempts in conflict, from Gottman\'s observational research on couples. A well-replicated research programme rather than a meta-analysis.',
      ar: 'محاولات الإصلاح أثناء الخلاف، من أبحاث Gottman الملاحِظة للأزواج. وهو خط بحثي متكرّر النتائج لا تحليل بَعدي.',
    },
    steps: [
      {
        id: 'read', kind: 'read',
        heading: { en: 'The repair matters more than the fight', ar: 'الإصلاح أهمّ من الشجار' },
        body: {
          en: [
            'A repair attempt is anything that stops an argument escalating — a softer tone, an admission, even a badly-timed joke. What predicts how a relationship goes is not whether they are made, but whether they are accepted.',
            'Doing this while calm is deliberate. Nobody composes a fair sentence mid-argument.',
          ],
          ar: [
            'محاولة الإصلاح هي أي شيء يوقف تصاعد الخلاف — نبرة ألطف، أو اعتراف، أو حتى مزحة في غير أوانها. وما يتنبّأ بمسار العلاقة ليس بذل هذه المحاولات، بل قبولها.',
            'وفعل هذا في حالة هدوء أمر مقصود. فلا أحد يصوغ جملة منصفة في خضمّ الشجار.',
          ],
        },
      },
      {
        id: 'what', kind: 'write',
        label: { en: 'What was it actually about?', ar: 'عمّ كان الخلاف فعلاً؟' },
        hint: { en: 'Often the surface topic is not it. The washing-up is rarely the washing-up.', ar: 'غالباً لا يكون الموضوع الظاهر هو الموضوع. فالجدال حول الأطباق نادراً ما يكون عن الأطباق.' },
        placeholder: { en: 'The real subject, as best you can tell…', ar: 'الموضوع الحقيقي، بأفضل ما تستطيع تمييزه…' },
      },
      {
        id: 'theirs', kind: 'write',
        label: { en: 'What did it look like from their side?', ar: 'كيف بدا الأمر من جانبهم؟' },
        hint: { en: 'Not whether they were right — what they were feeling. Write it as they would.', ar: 'ليس هل كانوا على حق — بل بماذا كانوا يشعرون. اكتبها كما كانوا سيكتبونها.' },
        placeholder: { en: 'Their experience of it…', ar: 'تجربتهم للأمر…' },
      },
      {
        id: 'mine', kind: 'write',
        label: { en: 'What is your part in it?', ar: 'ما دورك أنت فيه؟' },
        hint: { en: 'Something true and specific, however small. "All of it" is not useful, and neither is "nothing".', ar: 'شيء صحيح ومحدّد، مهما كان صغيراً. فـ"كل شيء" غير مفيدة، وكذلك "لا شيء".' },
        placeholder: { en: 'Your share of it…', ar: 'نصيبك منه…' },
      },
      {
        id: 'sentence', kind: 'write',
        label: { en: 'Write the sentence you will say', ar: 'اكتب الجملة التي ستقولها' },
        hint: { en: 'One sentence, no "but". "But" deletes everything before it.', ar: 'جملة واحدة، بلا "لكن". فـ"لكن" تمحو كل ما قبلها.' },
        placeholder: { en: 'The opening line, word for word…', ar: 'الجملة الافتتاحية، حرفياً…' },
        rows: 3,
      },
      {
        id: 'when', kind: 'plan',
        label: { en: 'When will you say it?', ar: 'متى ستقولها؟' },
      },
    ],
    closing: {
      en: 'One caveat worth stating plainly: repair assumes an argument between equals. If there is fear, control, or a pattern of being made small, that is not a row to repair and this sheet is the wrong tool.',
      ar: 'تنبيه يستحق أن يُقال بوضوح: الإصلاح يفترض خلافاً بين ندّين. فإن كان هناك خوف أو سيطرة أو نمط من التصغير، فهذا ليس خلافاً يُصلَح، وهذه الورقة أداة خاطئة له.',
    },
  },

  /* ────────────────────────────────────────────────────────────────────────
   * PERSONALITY — self-compassion. Sits here because the pillar otherwise
   * contains only measurement (Big Five, WHO-5) and nothing you DO.
   */
  {
    id: 'ws-self-compassion',
    area: 'personality',
    icon: '🤲',
    tier: 'meta',
    title: { en: 'The Friend Test', ar: 'اختبار الصديق' },
    meta: { en: '6 steps · about 5 minutes', ar: '٦ خطوات · حوالي ٥ دقائق' },
    intro: {
      en: 'Most people speak to themselves in a way they would never speak to someone they love. This is a short, deliberately concrete way to notice that and change one instance of it.',
      ar: 'يخاطب معظم الناس أنفسهم بطريقة ما كانوا ليخاطبوا بها من يحبّون. وهذه طريقة قصيرة وملموسة عمداً لملاحظة ذلك وتغيير حالة واحدة منه.',
    },
    cite: {
      en: 'Self-compassion (Neff). Meta-analyses of self-compassion interventions find reliable reductions in anxiety, depression and stress.',
      ar: 'التعاطف مع الذات (Neff). تجد التحليلات البَعدية لتدخلات التعاطف مع الذات انخفاضاً موثوقاً في القلق والاكتئاب والتوتر.',
    },
    steps: [
      {
        id: 'read', kind: 'read',
        heading: { en: 'Not letting yourself off', ar: 'ليس تبريراً لنفسك' },
        body: {
          en: [
            'The usual objection is that being kind to yourself means going soft — that the harsh voice is what keeps standards up. The evidence points the other way: self-criticism predicts avoidance and giving up, while self-compassion predicts trying again after a failure.',
            'It is also not self-esteem. Self-esteem needs you to be above average at something. This does not require you to be doing well at all, which is precisely when it is needed.',
          ],
          ar: [
            'الاعتراض المعتاد أن اللطف مع النفس يعني التراخي — وأن الصوت القاسي هو ما يحافظ على المعايير. لكن الأدلة تشير إلى العكس: فنقد الذات يتنبّأ بالتجنّب والاستسلام، بينما يتنبّأ التعاطف مع الذات بالمحاولة مجدداً بعد الإخفاق.',
            'وهو أيضاً ليس تقدير الذات. فتقدير الذات يحتاج أن تكون فوق المتوسط في شيء ما. أمّا هذا فلا يشترط أن تكون بخير أصلاً، وهي بالضبط اللحظة التي يُحتاج فيها.',
          ],
        },
      },
      {
        id: 'situation', kind: 'write',
        label: { en: 'What are you giving yourself a hard time about?', ar: 'ما الذي تعنّف نفسك بسببه؟' },
        placeholder: { en: 'The thing…', ar: 'الأمر…' },
        rows: 3,
      },
      {
        id: 'voice', kind: 'write',
        label: { en: 'What is the voice actually saying? Word for word.', ar: 'ماذا يقول ذلك الصوت فعلاً؟ حرفياً.' },
        hint: { en: 'Write it as harshly as it arrives. Softening it here defeats the exercise.', ar: 'اكتبه بقسوته كما يصلك. فتلطيفه هنا يُفقد التمرين معناه.' },
        placeholder: { en: 'The exact words…', ar: 'الكلمات نفسها…' },
        rows: 3,
      },
      {
        id: 'friend', kind: 'write',
        label: { en: 'A close friend comes to you with exactly this. What do you say?', ar: 'يأتيك صديق مقرّب بهذا الأمر بعينه. ماذا تقول له؟' },
        hint: { en: 'Their actual name helps. Write what you would really say, in your own voice.', ar: 'ذِكر اسمه الحقيقي يساعد. اكتب ما كنت ستقوله فعلاً، بأسلوبك أنت.' },
        placeholder: { en: 'What you would say to them…', ar: 'ما كنت ستقوله لهم…' },
        rows: 4,
      },
      {
        id: 'gap', kind: 'scale',
        label: { en: 'How different were those two?', ar: 'كم كان الفرق بين الاثنين؟' },
        hint: { en: 'The size of that gap is the finding. Nothing else in this sheet is measuring anything.', ar: 'حجم تلك الفجوة هو النتيجة. ولا شيء آخر في هذه الورقة يقيس شيئاً.' },
        low: { en: '0 · the same', ar: '٠ · متطابقان' }, high: { en: '10 · completely different', ar: '١٠ · مختلفان تماماً' },
      },
      {
        id: 'common', kind: 'write',
        label: { en: 'Who else has felt this?', ar: 'من غيرك شعر بهذا؟' },
        hint: { en: 'Name someone real if you can. The trap in self-criticism is the belief that it is only you — it almost never is.', ar: 'سمِّ شخصاً حقيقياً إن استطعت. فالفخّ في نقد الذات هو الاعتقاد بأنك وحدك — وهذا لا يكاد يصحّ أبداً.' },
        placeholder: { en: 'Someone who would understand…', ar: 'شخص كان سيفهم…' },
        rows: 3,
      },
    ],
  },
];

export const worksheetById = (id) => WORKSHEETS.find((w) => w.id === id) || null;
export const worksheetsForArea = (area) => WORKSHEETS.filter((w) => w.area === area);
export const WORKSHEET_IDS = WORKSHEETS.map((w) => w.id);
