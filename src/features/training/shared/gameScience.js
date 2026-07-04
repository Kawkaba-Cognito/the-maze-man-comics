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
      intro: 'Speed Match is the Symbol Digit Modalities Test (SDMT) — you see a symbol and respond with its digit, using a key that stays fixed and visible. It is the most sensitive clinical measure of processing speed.',
      sections: [
        { h: '⚡ Processing speed', b: 'How quickly you match symbols to digits indexes processing speed — the raw pace at which your brain takes in information and acts. It quietly underlies almost every other thinking skill.' },
        { h: '🧠 What it trains', b: 'Rapid visual scanning and symbol-to-digit lookup. The key stays fixed and on screen, so this is pure perceptual speed, not memorization — with practice the lookup becomes more automatic.' },
        { h: '🎚️ Trains at your edge', b: 'The time bank adapts to your pace: correct matches add time, the key grows, and each match returns less time — so difficulty settles at the fastest speed you can sustain. Adapting to the individual is what makes speed training work (UFOV / the ACTIVE trial).' },
        { h: '📊 How it\'s measured', b: 'Your main score is matches per minute — the SDMT score. We also report mean reaction time, RT variability (how steady you are — an attentional-lapse marker), and an efficiency score (IES) that blends speed with accuracy so neither can be gamed.' },
        { h: '📉 Why it matters', b: 'Processing speed is among the first abilities to slow with age and fatigue. Keeping it sharp supports reaction time, reading, and quick decisions.' },
      ],
      foot: 'Short, frequent bursts work best. Practice reliably improves this task and similar speed tests (near transfer); broad “far transfer” to everyday thinking is not well supported. This trains and tracks this specific skill — it is not a medical test.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: 'المطابقة السريعة هي اختبار رموز–أرقام (SDMT): ترى رمزاً وتستجيب برقمه عبر مفتاح ثابت ومرئي. وهو أكثر مقاييس سرعة المعالجة حساسية.',
      sections: [
        { h: '⚡ سرعة المعالجة', b: 'سرعتك في مطابقة الرموز بالأرقام تقيس سرعة المعالجة — الإيقاع الذي يستقبل به دماغك المعلومات ويتصرّف. وهي أساس خفيّ لمعظم المهارات الذهنية الأخرى.' },
        { h: '🧠 ما الذي تدرّبه', b: 'المسح البصري السريع والبحث عن الرقم المطابق. يبقى المفتاح ثابتاً وظاهراً، فهي سرعة إدراكية صرفة لا حفظاً — ومع التمرين يصبح البحث أكثر تلقائية.' },
        { h: '🎚️ تدريب عند حدّك', b: 'بنك الوقت يتكيّف مع إيقاعك: المطابقات الصحيحة تضيف وقتاً، ويكبر المفتاح، وتعيد كل مطابقة وقتاً أقل — فتستقر الصعوبة عند أسرع سرعة يمكنك الحفاظ عليها. التكيّف مع الفرد هو ما يجعل تدريب السرعة فعّالاً (UFOV / تجربة ACTIVE).' },
        { h: '📊 كيف يُقاس', b: 'درجتك الأساسية هي المطابقات في الدقيقة — درجة SDMT. ونعرض أيضاً متوسط زمن الاستجابة، وتغيّره (مدى ثباتك — مؤشر على هفوات الانتباه)، ودرجة كفاءة (IES) تمزج السرعة بالدقة كي لا تُخدع أيٌّ منهما.' },
        { h: '📉 لماذا تهمّ', b: 'سرعة المعالجة من أوائل القدرات التي تتباطأ مع العمر والإرهاق. الحفاظ عليها يدعم زمن ردّ الفعل والقراءة والقرارات السريعة.' },
      ],
      foot: 'الجلسات القصيرة المتكرّرة هي الأفضل. التمرين يحسّن هذه المهمة والاختبارات الشبيهة (انتقال قريب)، أما الانتقال الواسع للحياة اليومية فغير مدعوم جيداً. هذا يدرّب ويتابع هذه المهارة تحديداً، وليس اختباراً طبياً.',
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
      intro: 'Built on the Trail Making Test family — connect circles in order as fast as you can. It rotates several validated, language-free variants so it trains a whole battery of speed and executive skills, not one flat task.',
      sections: [
        { h: '⚡ Speed & scanning (TMT-A)', b: 'The plain trail (1→2→3…) is the classic Trail Making Test Part A: visual search + processing speed. Difficulty rises with the number of circles (a longer scan path).' },
        { h: '🎨 Colour Trails (flexibility)', b: 'On colour boards you alternate two colours as you count up (the Color Trails Test, CTT-2) — a language-free set-shifting / cognitive-flexibility task; the same number in the wrong colour is a built-in lure.' },
        { h: '✕ Distractors (inhibition)', b: 'Some boards add decoy circles you must ignore (Comprehensive TMT) — selective attention and impulse control.' },
        { h: '📊 How it\'s measured', b: 'Completion time and errors (the clinical TMT metrics), plus scanning rate (circles/min), tap-to-tap consistency (an attentional-lapse marker), and the colour interference cost (Colour time − plain time) that isolates executive control.' },
      ],
      foot: 'Plan your eye path a step or two ahead rather than hunting circle by circle. This trains and tracks these specific skills — it is not a medical test.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: 'مبني على عائلة اختبار وصل الأثر — صل الدوائر بالترتيب بأسرع ما يمكن. يتنقّل بين عدّة صيغ موثّقة وخالية من اللغة فيدرّب حزمة من مهارات السرعة والوظائف التنفيذية، لا مهمة واحدة جامدة.',
      sections: [
        { h: '⚡ السرعة والمسح (TMT-A)', b: 'المسار البسيط (١→٢→٣…) هو الجزء A الكلاسيكي: بحث بصري + سرعة معالجة. ترتفع الصعوبة بعدد الدوائر (مسار أطول).' },
        { h: '🎨 مسار الألوان (المرونة)', b: 'في لوحات الألوان تبدّل بين لونين مع العدّ التصاعدي (اختبار مسار الألوان CTT-2) — مهمة تبديل/مرونة ذهنية خالية من اللغة؛ والرقم نفسه باللون الخاطئ فخّ مدمج.' },
        { h: '✕ المشتّتات (الكبح)', b: 'بعض اللوحات تضيف دوائر شَرَك يجب تجاهلها (TMT الشامل) — انتباه انتقائي وضبط اندفاع.' },
        { h: '📊 كيف يُقاس', b: 'زمن الإكمال والأخطاء (مقاييس TMT السريرية)، مع معدّل المسح (دوائر/دقيقة)، وثبات الزمن بين النقرات (مؤشر هفوات الانتباه)، وكلفة تداخل الألوان (زمن الألوان − الزمن البسيط) التي تعزل التحكّم التنفيذي.' },
      ],
      foot: 'خطّط مسار عينك خطوة أو خطوتين مسبقاً بدل البحث دائرة بدائرة. هذا يدرّب ويتابع هذه المهارات تحديداً، وليس اختباراً طبياً.',
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
      intro: 'Target Tracking is the Multiple Object Tracking task (Pylyshyn & Storm, 1988) — the classic measure of dynamic, divided, sustained attention.',
      sections: [
        { h: '👁 Parallel tracking', b: 'You follow several moving targets among identical distractors using pre-attentive "indexes" (FINSTs). Most adults hold about 4–5 at once — your tracking capacity, shown after a survival run.' },
        { h: '⚡ Speed vs. capacity', b: 'Tracking is a flexible resource (Alvarez & Franconeri, 2007): the faster things move, the fewer you can hold. The Assessment staircases the speed to find exactly where your tracking breaks down.' },
        { h: '💥 Close encounters', b: 'Most errors happen when a target passes close to a distractor and the two get confused — crowding, not raw speed, is the real challenge (Franconeri et al.).' },
        { h: '🎯 What it does (honestly)', b: 'Practice reliably improves this task and similar tracking (near transfer). Broad "far transfer" to driving or sports is debated in the research — treat it as training and tracking this specific skill, not a guaranteed real-world boost.' },
      ],
      foot: 'Use a soft, wide gaze on the whole group rather than fixating one target.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: '«تتبّع الأهداف» هي مهمة تتبّع الأجسام المتعدّدة (بيليشن وستورم، 1988) — المقياس الكلاسيكي للانتباه الديناميكي الموزّع والمستمر.',
      sections: [
        { h: '👁 التتبّع المتوازي', b: 'تتابع عدّة أهداف متحرّكة وسط مشتّتات متطابقة عبر «مؤشّرات» ما قبل انتباهية. يمسك معظم البالغين بنحو ٤–٥ معاً — وهي سعة تتبّعك التي تظهر بعد جولة البقاء.' },
        { h: '⚡ السرعة مقابل السعة', b: 'التتبّع مورد مرن (ألفاريز وفرانكونيري، 2007): كلما زادت السرعة قلّ ما يمكنك إمساكه. يضبط التقييم السرعة تدريجياً ليجد بالضبط أين ينهار تتبّعك.' },
        { h: '💥 اللقاءات القريبة', b: 'تحدث معظم الأخطاء حين يمرّ هدف قرب مشتّت فيختلطان — الازدحام لا السرعة وحدها هو التحدّي الحقيقي (فرانكونيري وزملاؤه).' },
        { h: '🎯 ماذا يفعل (بصدق)', b: 'التمرين يحسّن هذه المهمة والتتبّع المشابه بشكل موثوق (انتقال قريب). أمّا «الانتقال البعيد» للقيادة أو الرياضة فمختلَف عليه بحثياً — اعتبره تدريباً وتتبّعاً لهذه المهارة تحديداً، لا ضماناً لتحسّن واقعي.' },
      ],
      foot: 'استخدم نظرة واسعة ليّنة على المجموعة كلها بدل تثبيت هدف واحد.',
    },
  },
  'train-switch': {
    en: {
      title: 'The science',
      intro: 'A Train-of-Thought-style task: route each car to its matching-colour bay while several share the roads. It trains divided attention — tracking and managing multiple moving things at once.',
      sections: [
        { h: '🎯 Divided attention', b: 'Watching several cars and the right junctions at the same time trains the ability to share focus without losing track. Human tracking capacity is only about four objects, so difficulty rises mainly by adding concurrent cars — easy stays under that limit, hard pushes past it.' },
        { h: '🧭 Plan ahead', b: 'You must set each junction BEFORE a car reaches it, so you anticipate conflicts and time decisions — planning and prioritising under pressure.' },
        { h: '🚫 Response selection & inhibition', b: 'Choosing the right junction at the right moment, and leaving alone the ones you do not need yet, trains rule-based action choice and impulse control.' },
      ],
      foot: 'Triage: handle the most urgent car first, then the next. This trains and tracks this specific skill — it is not a medical test.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: 'مهمة على نمط «قطار الأفكار»: وجّه كل سيارة إلى موقف لونها المطابق بينما تتشارك عدّة سيارات الطرق. تدرّب الانتباه الموزّع — تتبّع وإدارة عدّة أشياء متحرّكة معاً.',
      sections: [
        { h: '🎯 الانتباه الموزّع', b: 'مراقبة عدّة سيارات والمفترقات الصحيحة معاً تدرّب تقاسم التركيز دون فقدان المسار. سعة التتبّع لدى الإنسان نحو أربعة أجسام فقط، لذا ترتفع الصعوبة أساساً بزيادة السيارات المتزامنة — السهل يبقى دون هذا الحدّ والصعب يتجاوزه.' },
        { h: '🧭 خطّط مسبقاً', b: 'عليك ضبط كل مفترق قبل وصول السيارة إليه، فتتوقّع التعارضات وتوقّت قراراتك — تخطيط وترتيب أولويات تحت الضغط.' },
        { h: '🚫 اختيار الاستجابة والكبح', b: 'اختيار المفترق الصحيح في اللحظة الصحيحة، وترك ما لا تحتاجه بعد، يدرّب اختيار الفعل وفق قاعدة وضبط الاندفاع.' },
      ],
      foot: 'رتّب الأولويات: عالج السيارة الأكثر إلحاحاً أولاً ثم التالية. هذا يدرّب ويتابع هذه المهارة تحديداً، وليس اختباراً طبياً.',
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
  'story-grid': {
    en: {
      title: 'The science',
      intro: 'Story Time trains temporal-order memory — holding not just WHAT happened but the SEQUENCE it happened in, then reproducing it (the comic-strip cousin of the Picture-Arrangement task).',
      sections: [
        { h: '🧠 Order memory', b: 'Remembering the order of events is a distinct memory skill, leaning on the hippocampus and prefrontal cortex — the same system that lets you retell your day.' },
        { h: '🔗 Binding who · what · where', b: 'Rebuilding each panel from its place, character and action trains relational binding — the hippocampus stitching separate details into one event (Eichenbaum, 2004). It is exactly how real episodic memories are stored.' },
        { h: '📖 Chunk it into a story', b: 'Linked events form a single narrative chunk, so memory holds far more than a loose list (Miller, 1956). A good story is easier to recall than random items.' },
        { h: '🕵️ Filtering decoys', b: 'Ignoring places, characters and actions that never happened trains selective gating — keeping working memory clear of irrelevant material, which predicts higher capacity (Vogel et al., 2005).' },
      ],
      foot: 'Knit the panels into one little story as you watch — sequences stick better than lists.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: '«وقت القصة» يدرّب ذاكرة التسلسل الزمني — لا حفظ ما حدث فقط بل ترتيب حدوثه، ثم إعادة إنتاجه (ابن عمّ مهمة «ترتيب الصور» على هيئة شريط مصوّر).',
      sections: [
        { h: '🧠 ذاكرة الترتيب', b: 'تذكّر ترتيب الأحداث مهارة ذاكرة مستقلّة، تعتمد على الحُصين والقشرة الجبهية — النظام نفسه الذي يتيح لك سرد يومك.' },
        { h: '🔗 ربط: مَن · ماذا · أين', b: 'إعادة بناء كل لوحة من مكانها وشخصيتها وفعلها يدرّب الربط العلائقي — حيث يجمع الحُصين تفاصيل منفصلة في حدث واحد (آيخنباوم، 2004). هكذا تُخزَّن الذكريات الحدثية فعلاً.' },
        { h: '📖 اجعلها قصة', b: 'الأحداث المترابطة تشكّل «كتلة» سردية واحدة، فتحمل الذاكرة أكثر بكثير من قائمة مبعثرة (ميلر، 1956). القصة الجيدة أسهل استرجاعاً من عناصر عشوائية.' },
        { h: '🕵️ تصفية الخدع', b: 'تجاهل أماكن وشخصيات وأفعال لم تحدث يدرّب البوّابة الانتقائية — إبقاء الذاكرة العاملة نقيّة من غير المهمّ، وهو ما يتنبأ بسعة أعلى (فوغل وآخرون، 2005).' },
      ],
      foot: 'انسج اللوحات في قصة صغيرة وأنت تشاهد — التسلسل أرسخ من القوائم.',
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
  'wisconsin': {
    en: {
      title: 'The science',
      intro: 'Sort each card to a reference — but by colour, shape, or number? The rule is hidden and you only get right/wrong, so you must infer it, then notice when it silently changes. This is the Wisconsin Card Sorting Test, the classic measure of set-shifting (Berg, 1948; Grant & Berg, 1948).',
      sections: [
        { h: '🔄 Set-shifting', b: 'Once a rule stops working you must drop it and search for the new one — abandoning a just-rewarded strategy is the core of cognitive flexibility.' },
        { h: '🚫 Perseverative errors', b: 'Sticking with the dead rule after it fails is a perseverative error — the signature deficit of prefrontal (dorsolateral) dysfunction on the WCST.' },
        { h: '💡 Feedback-driven learning', b: 'You learn the rule only from outcome feedback, driven by dopaminergic prediction-error signals that update which dimension to attend to.' },
        { h: '📊 What we track', b: 'Accuracy, rules cracked, and how fast you recover right after a silent switch (post-switch accuracy).' },
      ],
      foot: 'When a sort suddenly fails, try a different dimension straight away rather than repeating. This trains and tracks flexibility; it is not a medical test.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: 'افرز كل بطاقة إلى مرجعٍ — لكن حسب اللون أم الشكل أم العدد؟ القاعدة خفية ولا تحصل إلا على صحيح/خطأ، فتستنتجها ثم تنتبه حين تتغيّر بصمت. هذا اختبار ويسكونسن لفرز البطاقات، المقياس الكلاسيكي لتبديل الطقم (بيرغ، ١٩٤٨).',
      sections: [
        { h: '🔄 تبديل الطقم', b: 'حين تتوقف القاعدة عن النجاح عليك إسقاطها والبحث عن الجديدة — التخلّي عن استراتيجية كوفئت للتوّ هو جوهر المرونة المعرفية.' },
        { h: '🚫 أخطاء التمسّك', b: 'الاستمرار بالقاعدة الميتة بعد فشلها خطأ تمسّكي — العَرَض المميّز لخلل القشرة الجبهية الظهرانية الوحشية في الاختبار.' },
        { h: '💡 التعلّم بالتغذية الراجعة', b: 'تتعلّم القاعدة من النتيجة فقط، بقيادة إشارات خطأ التنبّؤ الدوبامينية التي تحدّث أيّ بُعد يجب الانتباه إليه.' },
        { h: '📊 ما نقيسه', b: 'الدقة، والقواعد المكتشفة، وسرعة تعافيك فور التبديل الصامت (الدقة بعد التبديل).' },
      ],
      foot: 'حين يفشل الفرز فجأة، جرّب بُعداً مختلفاً فوراً بدل التكرار. هذه اللعبة تدرّب وتتابع المرونة؛ وليست اختباراً طبياً.',
    },
  },
  'brixton': {
    en: {
      title: 'The science',
      intro: 'Kawkab hops between nodes along a hidden rule; you continue the pattern. Crack it and the rule silently changes, so you must drop the old pattern and read the new one. This is the Brixton Spatial Anticipation Test — a rule-detection measure of flexibility (Burgess & Shallice, 1997).',
      sections: [
        { h: '🔎 Rule induction', b: 'You infer a spatial rule from a few moves and extend it — abstracting a pattern from examples, a frontal-lobe function.' },
        { h: '🔄 Detecting silent change', b: 'No cue announces the switch; you notice only when your predictions start failing, then shift — exactly the flexibility demand Brixton was built to test.' },
        { h: '🚫 Perseveration', b: 'Continuing the old rule after it changes is a perseverative error, sensitive to dysexecutive / prefrontal impairment.' },
        { h: '📊 What we track', b: 'Patterns cracked, accuracy, and your best streak of clean solves.' },
      ],
      foot: 'Watch a full demo before you commit — one hop rarely fixes a new rule. This trains and tracks flexibility; it is not a medical test.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: 'يقفز كوكب بين العقد وفق قاعدة خفية، وأنت تُكمل النمط. اكتشفها فتتغيّر القاعدة بصمت، فتضطر لإسقاط النمط القديم وقراءة الجديد. هذا اختبار بِرِكستون للتوقّع المكاني — مقياس كشف القواعد للمرونة (برجس وشاليس، ١٩٩٧).',
      sections: [
        { h: '🔎 استقراء القاعدة', b: 'تستنتج قاعدة مكانية من حركات قليلة ثم تمدّها — تجريد نمطٍ من أمثلة، وهي وظيفة فصٍّ جبهي.' },
        { h: '🔄 كشف التغيّر الصامت', b: 'لا شيء يعلن التبديل؛ تنتبه فقط حين تبدأ توقّعاتك بالفشل ثم تتكيّف — وهو تماماً مطلب المرونة الذي صُمّم له الاختبار.' },
        { h: '🚫 التمسّك', b: 'الاستمرار بالقاعدة القديمة بعد تغيّرها خطأ تمسّكي، حسّاس لخلل الوظائف التنفيذية الجبهية.' },
        { h: '📊 ما نقيسه', b: 'الأنماط المكتشفة، والدقة، وأفضل سلسلة حلولٍ نظيفة.' },
      ],
      foot: 'شاهد العرض كاملاً قبل أن تجيب — قفزة واحدة نادراً ما تحدّد القاعدة الجديدة. هذه اللعبة تدرّب وتتابع المرونة؛ وليست اختباراً طبياً.',
    },
  },
  'math-gates': {
    en: {
      title: 'The science',
      intro: 'Steer the runner into the gate with the right answer while the operation keeps changing — mental arithmetic plus task-switching. The gate drifts down at a relaxed pace with no countdown; you lose only by steering wrong, after several mistakes. Arithmetic fluency is a recognized component of processing speed (CHC theory).',
      sections: [
        { h: '➗ Arithmetic fluency', b: 'Your main score is correct answers per minute — the standard math-fluency measure. Small facts are recalled from memory; bigger ones are computed step by step, which is why large problems (especially ×) take longer (the “problem-size effect”).' },
        { h: '🔄 Switch cost', b: 'The operation changes from gate to gate, so you reconfigure the rule each time — and pay a measurable “switch cost” (slower after a change). We report it as your switch-trial time minus your repeat-trial time.' },
        { h: '🎯 Real number comparison', b: 'The wrong answers are plausible near-misses with the same odd/even parity, so you can’t shortcut by a glance — the closer they sit to the right answer, the harder the call (the numerical distance effect). Harder rounds bring them closer.' },
        { h: '📊 How it’s measured', b: 'Correct/min, accuracy, decision time, RT variability (how steady you are), and switch cost. Together they separate raw speed from flexibility.' },
      ],
      foot: 'Lock onto the operation first, the numbers second. This trains and tracks these skills; it is not a medical test, and there are no validated adult fluency norms.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: 'وجّه العدّاء إلى البوابة بالإجابة الصحيحة بينما تتغيّر العملية — حساب ذهني مع تبديل المهامّ. تنزل البوابة بإيقاع مريح دون عدّاد؛ تخسر فقط بالتوجيه الخاطئ، وبعد عدة أخطاء. الطلاقة الحسابية مكوّن معترف به من سرعة المعالجة (نظرية CHC).',
      sections: [
        { h: '➗ الطلاقة الحسابية', b: 'درجتك الأساسية هي الإجابات الصحيحة في الدقيقة — مقياس الطلاقة الحسابية المعياري. الحقائق الصغيرة تُستدعى من الذاكرة، والأكبر تُحسب خطوة بخطوة، لذا تأخذ المسائل الكبيرة (خصوصاً ×) وقتاً أطول («تأثير حجم المسألة»).' },
        { h: '🔄 كلفة التبديل', b: 'تتغيّر العملية من بوابة لأخرى فتعيد ضبط القاعدة في كل مرة — وتدفع «كلفة تبديل» قابلة للقياس (أبطأ بعد التغيير). نعرضها كزمن جولات التبديل ناقص زمن جولات التكرار.' },
        { h: '🎯 مقارنة عددية حقيقية', b: 'الإجابات الخاطئة قريبة ومعقولة وبنفس الزوجية (فردي/زوجي)، فلا يمكن الاختصار بنظرة — وكلما اقتربت من الصحيحة صعُب القرار («تأثير المسافة العددية»). الجولات الأصعب تقرّبها أكثر.' },
        { h: '📊 كيف يُقاس', b: 'صحيح/دقيقة، الدقة، زمن القرار، تغيّر زمن الاستجابة (مدى ثباتك)، وكلفة التبديل. معاً تفصل السرعة الخام عن المرونة.' },
      ],
      foot: 'ثبّت العملية أولاً ثم الأرقام. هذا يدرّب ويتابع هذه المهارات، وليس اختباراً طبياً، ولا توجد معايير راشدين موثّقة للطلاقة.',
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
      intro: 'Word Links mixes timed verbal-reasoning tasks — shared rules, analogies, pair matching, and odd-one-out — under a countdown. All tap one core skill: judging how words relate.',
      sections: [
        { h: '🧩 Verbal reasoning', b: 'Naming what two things share is the classic Similarities subtest (WAIS, WISC). Analogies add relational reasoning: A is to B as C is to what?' },
        { h: '🗂 Categorization & gating', b: 'Spotting the odd word out means extracting the category the others share, then rejecting the misfit — the same semantic sorting and selective gating that keep meaning organized.' },
        { h: '⏱ Speed under pressure', b: 'A shrinking timer forces fast rule extraction, not slow guessing. That blend of verbal IQ and processing speed is closer to real test conditions.' },
      ],
      foot: 'Ask what the words have in common first — the best link (or the odd one) usually follows from the rule.',
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
  'detective': {
    en: {
      title: 'The science',
      intro: 'Detective is deductive reasoning in action — you gather evidence at the scene, cross-check each suspect’s story against what you can SEE, and eliminate possibilities until only one answer can be true.',
      sections: [
        { h: '🔎 Deduction & elimination', b: 'Each piece of evidence is a constraint. Crossing out suspects that violate it is logical elimination — the same process behind formal deduction and everyday problem-solving.' },
        { h: '🎭 Contradiction detection', b: 'On harder cases the culprit lies: their alibi clashes with their own appearance. Spotting a statement that contradicts observable facts is a core critical-thinking skill.' },
        { h: '🧠 Working memory + logic', b: 'You hold several clues in mind at once and combine them, leaning on prefrontal cortex networks for reasoning and rule integration. The notebook lets you offload and organise, like a real investigator.' },
        { h: '🎯 Hypothesis testing', b: 'Treating each suspect as a hypothesis and checking it against every clue trains careful, evidence-based thinking instead of guessing.' },
      ],
      foot: 'Find every clue before accusing: the culprit is the only suspect that survives all of them — and the only one whose story doesn’t add up.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: '«المحقّق» استدلال استنباطي عملي — تجمع الأدلة من مكان الجريمة، وتقارن رواية كل مشتبه بما تراه بعينيك، وتستبعد الاحتمالات حتى يبقى جواب واحد ممكن.',
      sections: [
        { h: '🔎 الاستنباط والاستبعاد', b: 'كل دليل قيد. شطب المشتبهين الذين يخالفونه هو استبعاد منطقي — العملية نفسها وراء الاستدلال الصوري وحل المشكلات اليومي.' },
        { h: '🎭 كشف التناقض', b: 'في القضايا الأصعب يكذب الفاعل: روايته تناقض مظهره. اكتشاف قولٍ يناقض الوقائع المرئية مهارة أساسية في التفكير النقدي.' },
        { h: '🧠 الذاكرة العاملة والمنطق', b: 'تحتفظ بعدة أدلة في ذهنك معاً وتجمعها، معتمداً على شبكات القشرة الجبهية للاستدلال ودمج القواعد. والدفتر يساعدك على التنظيم كمحقّق حقيقي.' },
        { h: '🎯 اختبار الفرضيات', b: 'معاملة كل مشتبه كفرضية تختبرها أمام كل دليل تدرّب التفكير القائم على الأدلة بدل التخمين.' },
      ],
      foot: 'اعثر على كل الأدلة قبل الاتهام: الفاعل هو الوحيد الذي تنطبق عليه جميعها — والوحيد الذي لا تستقيم روايته.',
    },
  },
  'trivia': {
    en: {
      title: 'The science',
      intro: 'Trivia exercises semantic memory — the brain’s organized store of facts and word meanings. Each correct answer climbs the staircase; three slips and the run ends.',
      sections: [
        { h: '🗂 Semantic memory', b: 'General-knowledge facts live in a networked store in the temporal lobes. Retrieving them strengthens the links that make recall faster and more reliable (Tulving, 1972).' },
        { h: '📚 Knowledge builds learning', b: 'What you already know is the hook new learning hangs on — richer background knowledge measurably improves comprehension and memory for new material.' },
        { h: '🎯 Retrieval practice', b: 'Actively answering (not just re-reading) is one of the most robust ways to cement memory — the “testing effect” (Roediger & Karpicke, 2006).' },
      ],
      foot: 'Honest note: trivia trains knowledge & recall (crystallized ability) more than a raw “brain speed” — but learning new things is good for the brain at any age.',
    },
    ar: {
      title: 'العلم وراء اللعبة',
      intro: 'المعلومات تمرّن الذاكرة الدلالية — مخزن الدماغ المنظّم للحقائق ومعاني الكلمات. كل إجابة صحيحة تصعد درجة في السلّم؛ وثلاثة أخطاء تنهي المحاولة.',
      sections: [
        { h: '🗂 الذاكرة الدلالية', b: 'تعيش حقائق المعرفة العامة في شبكة مخزّنة في الفصوص الصدغية. استرجاعها يقوّي الروابط التي تجعل التذكّر أسرع وأوثق (تولفينغ، 1972).' },
        { h: '📚 المعرفة تبني التعلّم', b: 'ما تعرفه مسبقاً هو الخطّاف الذي يتعلّق به التعلّم الجديد — فالمعرفة الخلفية الأغنى تحسّن الفهم وحفظ المادة الجديدة بوضوح.' },
        { h: '🎯 تمرين الاسترجاع', b: 'الإجابة الفعّالة (لا مجرّد إعادة القراءة) من أقوى طرق ترسيخ الذاكرة — «أثر الاختبار» (روديغر وكاربيك، 2006).' },
      ],
      foot: 'ملاحظة صادقة: المعلومات تدرّب المعرفة والاسترجاع (القدرة المتبلورة) أكثر من «سرعة الدماغ» الخام — لكن تعلّم أشياء جديدة مفيد للدماغ في أي عمر.',
    },
  },
};

export default GAME_SCIENCE;
