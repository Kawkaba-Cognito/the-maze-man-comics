/**
 * Per-game "the science" content — what each game trains, why it matters for the
 * brain, and the paradigm it descends from. Shown in the shared HubScienceLink
 * panel under the three modes on every game hub.
 *
 * Keyed by the game's `gameKey` (sub.game in the domain configs). Each entry has
 * an `en` and `ar` block: { title, intro, sections: [{ h, b }], foot }.
 *
 * Content is research-INFORMED (it names the classic paradigms and the systems
 * involved) but is written for players, not as clinical claims.
 */
export const GAME_SCIENCE = {
  /* ── Speed ── */
  'speed-match': {
    en: {
      title: 'The science',
      intro: 'Speed Match is built on the Digit–Symbol Substitution Test, a century-old measure of how fast your brain processes information.',
      sections: [
        { h: '⚡ Processing speed', b: 'How quickly you match symbols to digits indexes processing speed — the raw pace at which your brain takes in information and acts. It quietly underlies almost every other thinking skill.' },
        { h: '🧠 What it trains', b: 'Rapid visual scanning, symbol-to-rule lookup, and fast motor responses. With practice the mapping becomes more automatic, freeing up attention for the task.' },
        { h: '📉 Why it matters', b: 'Processing speed is among the first abilities to slow with age and fatigue. Keeping it sharp supports reaction time, reading, and quick decisions.' },
      ],
      foot: 'Short, frequent bursts work best — speed responds to regular practice.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: 'تعتمد «المطابقة السريعة» على اختبار الرمز–الرقم، وهو مقياس عمره قرن لسرعة معالجة دماغك للمعلومات.',
      sections: [
        { h: '⚡ سرعة المعالجة', b: 'سرعتك في مطابقة الرموز بالأرقام تقيس سرعة المعالجة — الإيقاع الذي يستقبل به دماغك المعلومات ويتصرّف. وهي أساس خفيّ لمعظم المهارات الذهنية الأخرى.' },
        { h: '🧠 ما الذي تدرّبه', b: 'المسح البصري السريع، والبحث عن القاعدة، والاستجابة الحركية السريعة. مع التمرين تصبح المطابقة أكثر تلقائية فتتحرّر انتباهك.' },
        { h: '📉 لماذا تهمّ', b: 'سرعة المعالجة من أوائل القدرات التي تتباطأ مع العمر والإرهاق. الحفاظ عليها يدعم زمن ردّ الفعل والقراءة والقرارات السريعة.' },
      ],
      foot: 'الجلسات القصيرة المتكرّرة هي الأفضل — السرعة تستجيب للتمرين المنتظم.',
    },
  },
  'piano-tap': {
    en: {
      title: 'The science',
      intro: 'Tapping the falling tiles in time trains the speed and accuracy of the hand–eye loop.',
      sections: [
        { h: '⚡ Reaction time', b: 'Hitting each tile as it lands trains choice reaction time — detecting a signal and firing the right response with minimal delay.' },
        { h: '🖐 Sensorimotor timing', b: 'Keeping to the rhythm engages the cerebellum and motor cortex, sharpening hand–eye coordination and timing precision.' },
        { h: '🎯 Speed–accuracy control', b: 'Going fast without wrong taps trains the brain to balance speed against accuracy — a core executive skill.' },
      ],
      foot: 'Stay loose: smooth, relaxed taps beat tense, jerky ones for both speed and accuracy.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: 'النقر على البلاطات الساقطة في وقتها يدرّب سرعة ودقّة حلقة اليد–العين.',
      sections: [
        { h: '⚡ زمن ردّ الفعل', b: 'ضرب كل بلاطة عند هبوطها يدرّب زمن ردّ الفعل الاختياري — كشف الإشارة وإطلاق الاستجابة الصحيحة بأقل تأخير.' },
        { h: '🖐 التوقيت الحسّي-الحركي', b: 'الالتزام بالإيقاع يُشغّل المخيخ والقشرة الحركية، فيصقل تناسق اليد–العين ودقّة التوقيت.' },
        { h: '🎯 ضبط السرعة مقابل الدقّة', b: 'السرعة دون أخطاء تدرّب الدماغ على موازنة السرعة بالدقّة — مهارة تنفيذية أساسية.' },
      ],
      foot: 'ابقَ مسترخياً: النقرات الناعمة الهادئة تتفوّق على المتوتّرة في السرعة والدقّة معاً.',
    },
  },
  'trail-making': {
    en: {
      title: 'The science',
      intro: 'Trail Making is a classic neuropsychological test of visual attention and processing speed.',
      sections: [
        { h: '🔗 Visual search & sequencing', b: 'Connecting numbers in order trains your eyes to scan efficiently while you hold the sequence in mind.' },
        { h: '⚡ Processing speed', b: 'The timer turns this into a speed measure (Trail Making Test A) — faster trails mean faster visual-motor processing.' },
        { h: '🧠 Executive control', b: 'Always knowing which target comes next keeps working memory and goal-tracking engaged throughout the run.' },
      ],
      foot: 'Plan your eye path one or two steps ahead rather than hunting tile by tile.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: '«صل الأرقام» اختبار عصبي-نفسي كلاسيكي للانتباه البصري وسرعة المعالجة.',
      sections: [
        { h: '🔗 البحث البصري والتسلسل', b: 'ربط الأرقام بالترتيب يدرّب عينيك على المسح بكفاءة مع الاحتفاظ بالتسلسل في ذهنك.' },
        { h: '⚡ سرعة المعالجة', b: 'المؤقّت يحوّلها إلى مقياس سرعة (اختبار وصل الأثر A) — المسارات الأسرع تعني معالجة بصرية-حركية أسرع.' },
        { h: '🧠 التحكّم التنفيذي', b: 'معرفة الهدف التالي دائماً تُبقي الذاكرة العاملة وتتبّع الهدف نشطين طوال المحاولة.' },
      ],
      foot: 'خطّط مسار عينك خطوة أو خطوتين مسبقاً بدل البحث بلاطة بلاطة.',
    },
  },

  /* ── Attention ── */
  'cancel-task': {
    en: {
      title: 'The science',
      intro: 'Cancellation tasks are standard clinical tools for measuring selective and sustained attention.',
      sections: [
        { h: '🎯 Selective attention', b: 'Tapping only the targets among look-alike distractors trains you to lock onto what matters and filter out the rest.' },
        { h: '⏱ Sustained attention', b: 'Sweeping the whole field keeps your focus on task over time — the vigilance that fades when attention drifts.' },
        { h: '👁 Search strategy', b: 'Scanning systematically (row by row) instead of randomly makes your visual search faster and more reliable.' },
      ],
      foot: 'A steady, organised sweep beats frantic jumping around the grid.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: 'مهام الشطب أدوات سريرية معيارية لقياس الانتباه الانتقائي والمستمر.',
      sections: [
        { h: '🎯 الانتباه الانتقائي', b: 'الضغط على الأهداف فقط وسط مشتّتات مشابهة يدرّبك على التركيز على المهم وتصفية الباقي.' },
        { h: '⏱ الانتباه المستمر', b: 'مسح كامل الحقل يُبقي تركيزك على المهمة عبر الزمن — اليقظة التي تتلاشى حين يشرد الانتباه.' },
        { h: '👁 استراتيجية البحث', b: 'المسح المنظّم (صفاً صفاً) بدل العشوائي يجعل بحثك البصري أسرع وأكثر موثوقية.' },
      ],
      foot: 'المسح الثابت المنظّم أفضل من القفز المحموم في الشبكة.',
    },
  },
  'mot': {
    en: {
      title: 'The science',
      intro: 'Target Tracking is the Multiple Object Tracking task (Pylyshyn & Storm, 1988), a measure of dynamic, divided attention.',
      sections: [
        { h: '👁 Dynamic attention', b: 'Following several moving targets among identical distractors trains attention you can split and sustain on the move.' },
        { h: '🧠 Attentional capacity', b: 'How many objects you can track at once reflects your attentional bandwidth — typically around four for most adults.' },
        { h: '🏃 Real-world transfer', b: 'This kind of tracking is linked to driving, team sports, and general situational awareness.' },
      ],
      foot: 'Use a soft, wide gaze on the whole group rather than fixating one target.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: '«تتبّع الأهداف» هي مهمة تتبّع الأجسام المتعدّدة (بيليشن وستورم، 1988)، مقياس للانتباه الديناميكي الموزّع.',
      sections: [
        { h: '👁 الانتباه الديناميكي', b: 'متابعة عدّة أهداف متحرّكة وسط مشتّتات متطابقة تدرّب انتباهاً يمكنك توزيعه والحفاظ عليه أثناء الحركة.' },
        { h: '🧠 سعة الانتباه', b: 'عدد الأجسام التي يمكنك تتبّعها معاً يعكس عرض نطاق انتباهك — غالباً نحو أربعة لدى معظم البالغين.' },
        { h: '🏃 الأثر الواقعي', b: 'هذا النوع من التتبّع مرتبط بالقيادة والرياضات الجماعية والوعي بالموقف عموماً.' },
      ],
      foot: 'استخدم نظرة واسعة ليّنة على المجموعة كلها بدل تثبيت هدف واحد.',
    },
  },
  'train-switch': {
    en: {
      title: 'The science',
      intro: 'Routing each train to its station trains attention you must divide across several things at once.',
      sections: [
        { h: '🎯 Divided attention', b: 'Watching multiple trains and the right junctions at the same time trains the ability to share focus without losing track.' },
        { h: '🧭 Response selection', b: 'Flipping the correct switch at the correct moment trains rule-based action choice and timing.' },
        { h: '🚫 Inhibition', b: 'Not flipping a switch you do not need yet trains impulse control under pressure.' },
      ],
      foot: 'Triage: handle the most urgent train first, then the next.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: 'توجيه كل قطار إلى محطته يدرّب انتباهاً عليك توزيعه على عدّة أمور في آن واحد.',
      sections: [
        { h: '🎯 الانتباه الموزّع', b: 'مراقبة عدّة قطارات والمفاتيح الصحيحة معاً تدرّب القدرة على تقاسم التركيز دون فقدان المسار.' },
        { h: '🧭 اختيار الاستجابة', b: 'تبديل المفتاح الصحيح في اللحظة الصحيحة يدرّب اختيار الفعل وفق قاعدة وتوقيته.' },
        { h: '🚫 الكبح', b: 'عدم تبديل مفتاح لا تحتاجه بعد يدرّب ضبط الاندفاع تحت الضغط.' },
      ],
      foot: 'رتّب الأولويات: عالج القطار الأكثر إلحاحاً أولاً ثم التالي.',
    },
  },

  /* ── Memory ── */
  'memo-span': {
    en: {
      title: 'The science',
      intro: 'Memo Span is the Corsi block-tapping test, the standard measure of visuospatial short-term memory.',
      sections: [
        { h: '🧱 Memory span', b: 'Reproducing the lit cells measures your span — the number of spatial items you can hold at once (Corsi, 1972).' },
        { h: '🔄 Forward vs. reverse', b: 'Forward recall is pure storage; reverse recall forces you to hold AND manipulate the sequence — true working memory, run by the prefrontal cortex.' },
        { h: '📈 Training at your edge', b: 'Difficulty tracks your accuracy so you always practise just past your current span — the condition that drives the biggest gains.' },
      ],
      foot: 'Chunk the path into groups of 3–4; memory holds chunks, not singles.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: '«مدى الذاكرة» هو اختبار كورسي للنقر، المقياس المعياري للذاكرة البصرية-المكانية قصيرة المدى.',
      sections: [
        { h: '🧱 مدى الذاكرة', b: 'إعادة الخلايا المضيئة تقيس «مداك» — عدد العناصر المكانية التي تحفظها في آن واحد (كورسي، 1972).' },
        { h: '🔄 المباشر مقابل المعكوس', b: 'الاستدعاء المباشر تخزين صرف؛ أما المعكوس فيجبرك على الحفظ والمعالجة معاً — ذاكرة عاملة حقيقية تقودها القشرة الجبهية.' },
        { h: '📈 التدرّب عند حدّك', b: 'تتبع الصعوبة دقّتك لتتمرّن دائماً بعد مداك الحالي بقليل — وهو الشرط الذي يحقّق أكبر المكاسب.' },
      ],
      foot: 'جزّئ المسار إلى مجموعات من ٣–٤؛ الذاكرة تحفظ مجموعات لا أفراداً.',
    },
  },
  'nback': {
    en: {
      title: 'The science',
      intro: 'N-Back (Kirchner, 1958; Jaeggi et al., 2008) is the most-studied working-memory trainer in cognitive science.',
      sections: [
        { h: '🎯 Continuous updating', b: 'Spotting when an item matches one N steps back forces you to constantly refresh what you hold in mind while discarding the old — a core executive function.' },
        { h: '🚫 Interference control', b: 'Rejecting near-misses (items that almost match) trains resistance to interference, the noise that crowds working memory.' },
        { h: '🧠 The central hub', b: 'N-back leans on the dorsolateral prefrontal cortex, the brain region most tied to fluid reasoning and focus.' },
      ],
      foot: 'Don’t over-rehearse — let each new item gently push the oldest one out.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: '«إن-باك» (كيرشنر 1958؛ ياغي وآخرون 2008) أكثر مدرّبات الذاكرة العاملة دراسةً في علم الإدراك.',
      sections: [
        { h: '🎯 التحديث المستمرّ', b: 'اكتشاف تطابق عنصر مع ما ظهر قبل N خطوات يجبرك على تحديث ما تحمله ذهنياً باستمرار مع التخلّص من القديم — وظيفة تنفيذية جوهرية.' },
        { h: '🚫 ضبط التداخل', b: 'رفض «شبه المطابقات» يدرّب مقاومة التداخل، أي الضجيج الذي يزدحم به الذاكرة العاملة.' },
        { h: '🧠 المركز التنفيذي', b: 'تعتمد المهمة على القشرة الجبهية الظهرية الوحشية، أكثر مناطق الدماغ ارتباطاً بالاستدلال السائل والتركيز.' },
      ],
      foot: 'لا تُفرط في التكرار — دع كل عنصر جديد يدفع الأقدم برفق إلى الخارج.',
    },
  },
  'paired-associates': {
    en: {
      title: 'The science',
      intro: 'Learning which item hides where is a paired-associates task — a window onto how the brain forms new memories.',
      sections: [
        { h: '🔗 Associative binding', b: 'Tying “what” to “where” engages the hippocampus, the structure that glues separate details into a single memory.' },
        { h: '🧠 Encoding & recall', b: 'You practise deliberate encoding then cued retrieval — the same loop behind remembering names, faces, and facts.' },
        { h: '👵 Why it matters', b: 'Associative memory is among the first functions to weaken with age, so this kind of practice targets a vulnerable system.' },
      ],
      foot: 'Make a vivid mental image linking the item to its spot — bizarre images stick.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: 'تعلّم ما يختبئ في كل مكان هو مهمة «الأزواج المترابطة» — نافذة على كيفية تكوين الدماغ ذكريات جديدة.',
      sections: [
        { h: '🔗 الربط الترابطي', b: 'ربط «ماذا» بـ«أين» يُشغّل الحُصين، البنية التي تلصق التفاصيل المنفصلة في ذكرى واحدة.' },
        { h: '🧠 الترميز والاستدعاء', b: 'تتمرّن على الترميز المتعمّد ثم الاستدعاء المُلمَّح — الحلقة نفسها وراء تذكّر الأسماء والوجوه والحقائق.' },
        { h: '👵 لماذا تهمّ', b: 'الذاكرة الترابطية من أوائل ما يضعف مع العمر، فهذا التمرين يستهدف نظاماً هشّاً.' },
      ],
      foot: 'اصنع صورة ذهنية حيّة تربط الشيء بمكانه — الصور الغريبة تثبت أكثر.',
    },
  },

  /* ── Reasoning ── */
  'rush-hour': {
    en: {
      title: 'The science',
      intro: 'Sliding-block puzzles like this are used by psychologists to study planning and step-by-step problem solving.',
      sections: [
        { h: '🧩 Planning ahead', b: 'Freeing the target block forces you to look several moves into the future before you act — the heart of planning.' },
        { h: '🧠 Working memory', b: 'Holding the board layout and your candidate moves in mind at once gives working memory a real workout.' },
        { h: '🚫 Resisting the obvious', b: 'The move that looks like progress often blocks you later. Holding back trains impulse control.' },
      ],
      foot: 'Work backwards from the exit: what has to move last, then second-last?',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: 'ألغاز تحريك القطع كهذه يستخدمها علماء النفس لدراسة التخطيط وحلّ المشكلات خطوةً بخطوة.',
      sections: [
        { h: '🧩 التخطيط المسبق', b: 'تحرير القطعة الهدف يُجبرك على النظر عدّة حركات في المستقبل قبل أن تتحرّك — جوهر التخطيط.' },
        { h: '🧠 الذاكرة العاملة', b: 'الاحتفاظ بترتيب اللوح وحركاتك المحتملة معاً يمنح الذاكرة العاملة تمريناً حقيقياً.' },
        { h: '🚫 مقاومة الواضح', b: 'الحركة التي تبدو تقدّماً كثيراً ما تعيقك لاحقاً. كبحها يدرّب ضبط الاندفاع.' },
      ],
      foot: 'اعمل عكسياً من المخرج: ما الذي يجب أن يتحرّك أخيراً، ثم قبل الأخير؟',
    },
  },
  'raven-matrices': {
    en: {
      title: 'The science',
      intro: 'Matrix Reasoning is modelled on Raven’s Progressive Matrices, the benchmark test of fluid intelligence.',
      sections: [
        { h: '🧠 Fluid reasoning', b: 'Inferring the hidden rule that completes the grid taps fluid intelligence — solving novel problems without prior knowledge.' },
        { h: '🔍 Relational thinking', b: 'Comparing how figures change across rows and columns trains analogical, relational reasoning.' },
        { h: '📚 Broad transfer', b: 'Matrix-style reasoning is one of the strongest single predictors of learning and problem-solving across domains.' },
      ],
      foot: 'Find the rule for one dimension (shape, count, rotation) at a time.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: '«استدلال المصفوفات» مبني على مصفوفات رافن المتدرّجة، الاختبار المرجعي للذكاء السائل.',
      sections: [
        { h: '🧠 الاستدلال السائل', b: 'استنتاج القاعدة الخفية التي تُكمل الشبكة يستثمر الذكاء السائل — حلّ مشكلات جديدة دون معرفة مسبقة.' },
        { h: '🔍 التفكير العلائقي', b: 'مقارنة تغيّر الأشكال عبر الصفوف والأعمدة تدرّب التفكير القياسي العلائقي.' },
        { h: '📚 أثر واسع', b: 'الاستدلال بنمط المصفوفات من أقوى المؤشّرات المنفردة على التعلّم وحلّ المشكلات عبر المجالات.' },
      ],
      foot: 'اكتشف قاعدة بُعد واحد (الشكل، العدد، الدوران) في كل مرّة.',
    },
  },
  'tower-hanoi': {
    en: {
      title: 'The science',
      intro: 'Sorting puzzles like this measure planning and goal management, in the family of the Tower of London/Hanoi tests.',
      sections: [
        { h: '🧠 Multi-step planning', b: 'Gathering each colour without burying a token you’ll need next requires looking several moves ahead.' },
        { h: '🗂 Goal management', b: 'Holding subgoals — “empty this tube first” — engages the prefrontal cortex that organises complex tasks.' },
        { h: '🚫 Inhibition', b: 'Avoiding moves that feel like progress but trap you later trains impulse control and foresight.' },
      ],
      foot: 'Keep at least one tube flexible — don’t commit your last free space too early.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: 'ألغاز الفرز كهذه تقيس التخطيط وإدارة الأهداف، ضمن عائلة اختبارات برج لندن/هانوي.',
      sections: [
        { h: '🧠 التخطيط متعدّد الخطوات', b: 'جمع كل لون دون دفن رمز ستحتاجه لاحقاً يتطلّب النظر عدّة حركات مسبقاً.' },
        { h: '🗂 إدارة الأهداف', b: 'الاحتفاظ بأهداف فرعية — «أفرغ هذا الأنبوب أولاً» — يُشغّل القشرة الجبهية التي تنظّم المهام المعقّدة.' },
        { h: '🚫 الكبح', b: 'تجنّب الحركات التي تبدو تقدّماً لكنها تحبسك لاحقاً يدرّب ضبط الاندفاع وبُعد النظر.' },
      ],
      foot: 'أبقِ أنبوباً واحداً مرناً على الأقل — لا تستهلك مساحتك الحرّة الأخيرة مبكّراً.',
    },
  },

  /* ── Flexibility ── */
  'spatial-stroop': {
    en: {
      title: 'The science',
      intro: 'Arrow Rush is a wordless Stroop and set-shifting task — a direct measure of cognitive flexibility.',
      sections: [
        { h: '🚦 Interference control', b: 'Answering by the active rule (where the arrow points vs. where it sits) while suppressing the automatic pull is the Stroop effect in action.' },
        { h: '🔄 Set-shifting', b: 'The rule keeps flipping, forcing you to drop the old mental set instantly — the core of cognitive flexibility.' },
        { h: '🧠 Conflict monitoring', b: 'The anterior cingulate cortex detects the clash between rules and signals the prefrontal cortex to adjust.' },
      ],
      foot: 'Re-read the active rule the instant it changes — don’t run on autopilot.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: '«اندفاع الأسهم» مهمة ستروب بلا كلمات وتبديل أطقم — مقياس مباشر للمرونة المعرفية.',
      sections: [
        { h: '🚦 ضبط التداخل', b: 'الإجابة وفق القاعدة الفعّالة (حيث يشير السهم مقابل حيث يقع) مع كبح الجذب التلقائي هو تأثير ستروب عملياً.' },
        { h: '🔄 تبديل الطقم', b: 'القاعدة تتغيّر باستمرار فتجبرك على إسقاط الطقم الذهني القديم فوراً — جوهر المرونة المعرفية.' },
        { h: '🧠 مراقبة التعارض', b: 'القشرة الحزامية الأمامية تكشف الصدام بين القواعد وتُشير للقشرة الجبهية كي تتكيّف.' },
      ],
      foot: 'أعد قراءة القاعدة الفعّالة لحظة تغيّرها — لا تعمل بالطيّار الآلي.',
    },
  },
  'flip': {
    en: {
      title: 'The science',
      intro: 'Catch the gems, then the controls invert — a reversal task that trains flexibility and habit-breaking.',
      sections: [
        { h: '🔄 Cognitive flexibility', b: 'When the controls flip you must abandon a freshly learned habit on the spot and adopt the opposite mapping.' },
        { h: '🚫 Response inhibition', b: 'Suppressing the old, now-wrong action is inhibitory control — the brake on automatic behaviour.' },
        { h: '🧠 Learning from feedback', b: 'Recovering quickly after a reversal trains feedback-based learning, driven by dopamine prediction signals.' },
      ],
      foot: 'After a flip, slow down for one beat to let the new rule take hold.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: 'أمسك الجواهر ثم ينقلب التحكّم — مهمة عكسٍ تدرّب المرونة وكسر العادة.',
      sections: [
        { h: '🔄 المرونة المعرفية', b: 'حين ينقلب التحكّم عليك التخلّي عن عادة تعلّمتها للتوّ وتبنّي الربط المعاكس فوراً.' },
        { h: '🚫 كبح الاستجابة', b: 'كبح الفعل القديم الخاطئ الآن هو التحكّم الكابح — فرملة السلوك التلقائي.' },
        { h: '🧠 التعلّم من التغذية الراجعة', b: 'التعافي السريع بعد الانقلاب يدرّب التعلّم القائم على التغذية الراجعة، الذي تقوده إشارات الدوبامين التنبّؤية.' },
      ],
      foot: 'بعد الانقلاب، تمهّل لحظة واحدة كي تترسّخ القاعدة الجديدة.',
    },
  },
  'math-gates': {
    en: {
      title: 'The science',
      intro: 'Run the gate with the right answer while the operation keeps changing — a task-switching workout with numbers.',
      sections: [
        { h: '🔄 Task switching', b: 'The operation changes from gate to gate, so you constantly reconfigure the rule in mind — and pay the “switch cost” when you don’t.' },
        { h: '➗ Numerical fluency', b: 'Fast mental arithmetic under time pressure strengthens the number sense in the parietal cortex.' },
        { h: '🧠 Working memory', b: 'Holding the current operation while computing the answer keeps working memory and executive control engaged.' },
      ],
      foot: 'Lock onto the operation first, the numbers second.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: 'اعبُر البوابة بالإجابة الصحيحة بينما تتغيّر العملية باستمرار — تمرين تبديل مهامّ بالأرقام.',
      sections: [
        { h: '🔄 تبديل المهامّ', b: 'تتغيّر العملية من بوابة لأخرى، فتعيد ضبط القاعدة ذهنياً باستمرار — وتدفع «كلفة التبديل» حين لا تفعل.' },
        { h: '➗ الطلاقة العددية', b: 'الحساب الذهني السريع تحت ضغط الوقت يقوّي الحسّ العددي في القشرة الجدارية.' },
        { h: '🧠 الذاكرة العاملة', b: 'الاحتفاظ بالعملية الحالية أثناء حساب الإجابة يُبقي الذاكرة العاملة والتحكّم التنفيذي نشطين.' },
      ],
      foot: 'ثبّت العملية أولاً ثم الأرقام ثانياً.',
    },
  },

  /* ── Language ── */
  'wordle': {
    en: {
      title: 'The science',
      intro: 'Guessing the hidden word from clues blends vocabulary retrieval with deductive reasoning.',
      sections: [
        { h: '🔤 Lexical access', b: 'Searching your mental dictionary for words that fit trains vocabulary and verbal fluency — how quickly the right word comes to mind.' },
        { h: '🧠 Deduction', b: 'Using each clue (right letter, right place) to rule words in or out trains constraint-based logical reasoning.' },
        { h: '💡 Working memory', b: 'Juggling which letters are confirmed, absent, or misplaced loads working memory while you plan the next guess.' },
      ],
      foot: 'Spend an early guess on fresh letters to gather the most clues.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: 'تخمين الكلمة المخفية من التلميحات يمزج استرجاع المفردات بالاستدلال الاستنتاجي.',
      sections: [
        { h: '🔤 الوصول المعجمي', b: 'البحث في قاموسك الذهني عن كلمات مناسبة يدرّب المفردات والطلاقة اللفظية — سرعة حضور الكلمة الصحيحة.' },
        { h: '🧠 الاستنتاج', b: 'استخدام كل تلميح (حرف صحيح، موضع صحيح) لاستبعاد الكلمات أو ترجيحها يدرّب الاستدلال المنطقي القائم على القيود.' },
        { h: '💡 الذاكرة العاملة', b: 'تتبّع الحروف المؤكّدة والغائبة والمكان الخاطئ يُحمّل الذاكرة العاملة أثناء تخطيط التخمين التالي.' },
      ],
      foot: 'اصرف تخميناً مبكّراً على حروف جديدة لجمع أكبر قدر من التلميحات.',
    },
  },
  'synonyms': {
    en: {
      title: 'The science',
      intro: 'Similarities mixes timed IQ-style verbal tasks — shared rules, analogies, and pair matching — under a countdown.',
      sections: [
        { h: '🧩 Verbal reasoning', b: 'Naming what two things share is the classic Similarities subtest (WAIS, WISC). Analogies add relational reasoning: A is to B as C is to what?' },
        { h: '⏱ Speed under pressure', b: 'A shrinking timer forces fast rule extraction, not slow guessing. That blend of verbal IQ and processing speed is closer to real test conditions.' },
        { h: '🔗 Pair binding & abstraction', b: 'Finding the matching pair among four tiles trains associative search. Hard items push you past surface similarity to deeper links — function, category, or analogy.' },
      ],
      foot: 'On shared-rule items, state the deepest true link — not just “both are things” but what kind, or how they relate.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: '«وجه الشبه» يمزج مهاماً لفظية بوقت — قواعد مشتركة، قياسات، ومطابقة أزواج — تحت عدٍّ تنازلي.',
      sections: [
        { h: '🧩 الاستدلال اللفظي', b: 'تسمية ما يجمع بين شيئين هو مقياس «التشابه» الكلاسيكي (WAIS، WISC). القياسات تضيف استدلالاً علائقياً: A إلى B كما C إلى ماذا؟' },
        { h: '⏱ السرعة تحت الضغط', b: 'المؤقّت المتقلّص يفرض استخراج القاعدة بسرعة لا التخمين البطيء. هذا المزيج من الذكاء اللفظي وسرعة المعالجة أقرب لظروف الاختبار الحقيقية.' },
        { h: '🔗 ربط الأزواج والتجريد', b: 'إيجاد الزوج المطابق بين أربع بلاطات يدرّب البحث الترابطي. الأسئلة الصعبة تدفعك تجاوز التشابه السطحي إلى روابط أعمق — فئة، وظيفة، أو قياس.' },
      ],
      foot: 'في أسئلة القاعدة المشتركة، اذكر الرابط الأعمق الصحيح — ليس «كلاهما أشياء» فقط، بل أي نوع، أو كيف يرتبطان.',
    },
  },
  'odd-one-out': {
    en: {
      title: 'The science',
      intro: 'Three words appear at once — you have seconds to spot the misfit while your runner closes in. It trains semantic sorting under time pressure.',
      sections: [
        { h: '🗂 Categorization', b: 'Finding the odd word means extracting the category three items share. That is how the brain groups concepts and filters meaning.' },
        { h: '⏱ Processing speed', b: 'Words show immediately with a short countdown, so you must decide fast. Speed plus accuracy is the same mix tested in timed verbal tasks.' },
        { h: '🧠 Inhibition & near-misses', b: 'Harder rounds use trickier distractors that almost fit the group. You must inhibit the tempting wrong answer and hold the true rule in mind.' },
      ],
      foot: 'Ask what three words have in common first — the odd one usually breaks that rule.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: 'ثلاث كلمات تظهر فوراً — لديك ثوانٍ لاكتشاف الشاذّ بينما يقترب عدّاؤك. تدرّب الفرز الدلالي تحت ضغط الوقت.',
      sections: [
        { h: '🗂 التصنيف', b: 'إيجاد الكلمة الشاذّة يعني استخلاص الفئة التي تشترك بها الثلاث. هكذا يجمّع الدماغ المفاهيم ويصفّي المعنى.' },
        { h: '⏱ سرعة المعالجة', b: 'الكلمات تظهر فوراً مع عدٍّ قصير، فعليك القرار بسرعة. السرعة مع الدقّة هو المزيج نفسه في المهام اللفظية الموقّتة.' },
        { h: '🧠 الكبح والمشتّتات الوشيكة', b: 'الجولات الأصعب تستخدم مشتّتات تكاد تناسب المجموعة. عليك كبح الإجابة المغرية الخاطئة والاحتفاظ بالقاعدة الحقيقية.' },
      ],
      foot: 'اسأل أولاً ما الذي تشترك به ثلاث كلمات — الشاذّة عادةً تكسر تلك القاعدة.',
    },
  },
};

export default GAME_SCIENCE;
