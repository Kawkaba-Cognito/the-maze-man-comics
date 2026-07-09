/**
 * Per-domain "Why train this?" content — science + daily-life relevance.
 * Shown on the 6 domain pick screens via DomainAboutLink.
 *
 * Same shape as gameScience.js: { en, ar } → { domainLabel, intro, sections[], foot }.
 * Research-informed, written for players — not clinical claims.
 */
export const DOMAIN_SCIENCE = {
  attention: {
    en: {
      domainLabel: 'Attention',
      intro: 'Attention is the brain\'s spotlight — choosing what matters and filtering out the rest. The games here draw on visual search, sustained focus, and divided-attention paradigms used in cognitive research and clinical assessment.',
      sections: [
        {
          h: '🧠 The science',
          b: 'Selective attention lets you target one thing among many distractors. Sustained attention keeps you on task over time. Divided attention shares focus across moving parts — three systems that overlap but train differently.',
        },
        {
          h: '🔬 What these games train',
          b: 'Cancellation Task comes from neuropsychological visual-search tests. Target Tracking uses multiple-object tracking (most adults follow about 4–5 items). Car Park combines timing, switching, and monitoring — a divided-attention challenge.',
        },
        {
          h: '🏠 Daily life',
          b: 'Stronger attention means fewer careless errors, less re-reading, safer driving, staying present when your phone buzzes, and keeping track of children or colleagues in busy environments.',
        },
        {
          h: '📈 Realistic expectations',
          b: 'Attention lapses rise with fatigue, stress, and age. Short daily practice at your edge builds the habit of refocusing quickly — gains show up most on similar attention tasks.',
        },
      ],
      foot: 'This domain trains specific attention skills. It supports everyday focus but is not a medical test or diagnosis.',
    },
    ar: {
      domainLabel: 'الانتباه',
      intro: 'الانتباه هو «ضوء كشاف» الدماغ — اختيار ما يهم وتصفية الباقي. الألعاب هنا مستمدة من مهام البحث البصري، والتركيز المستمر، وتوزيع الانتباه المستخدمة في البحث العلمي والتقييم السريري.',
      sections: [
        {
          h: '🧠 العلم',
          b: 'الانتباه الانتقائي يوجّهك نحو شيء واحد وسط مشتّتات. الانتباه المستمر يبقيك على المهمة. الانتباه المقسّم يشارك التركيز بين عدة عناصر — أنظمة متداخلة لكنها تُدرَّب بطرق مختلفة.',
        },
        {
          h: '🔬 ما الذي تدرّبه الألعاب',
          b: 'مهمة الإلغاء من اختبارات البحث البصري العصبية. تتبّع الأهداف يستخدم تتبّع الأجسام المتعددة (معظم البالغين يتابعون نحو ٤–٥ عناصر). موقف السيارات يجمع التوقيت والتبديل والمراقبة — تحدٍّ في الانتباه المقسّم.',
        },
        {
          h: '🏠 الحياة اليومية',
          b: 'انتباه أقوى يعني أخطاء أقل بسبب التشتت، وقراءة دون إعادة، وقيادة أكثر أماناً، والبقاء حاضراً عندما يرن هاتفك، ومتابعة الأطفال أو الزملاء في بيئات مزدحمة.',
        },
        {
          h: '📈 توقعات واقعية',
          b: 'هفوات الانتباه تزداد مع التعب والضغط والعمر. تمرين يومي قصير عند حدّك يبني عادة العودة للتركيز بسرعة — المكاسب تظهر أكثر في مهام انتباه مشابهة.',
        },
      ],
      foot: 'هذا المجال يدرّب مهارات انتباه محددة. يدعم التركيز اليومي لكنه ليس اختباراً أو تشخيصاً طبياً.',
    },
  },

  speed: {
    en: {
      domainLabel: 'Speed',
      intro: 'Processing speed is how quickly your brain takes in information and acts on it — the pace behind reading, conversation, and decisions. These games use timed paradigms from cognitive research, including the Symbol-Digit family and Trail Making tests.',
      sections: [
        {
          h: '⚡ The science',
          b: 'Processing speed is not a separate “gift” — it supports almost every mental task. When speed drops, familiar routines feel harder even if you still know what to do.',
        },
        {
          h: '🔬 What these games train',
          b: 'Speed Match is the Symbol-Digit Modalities Test (SDMT) — the most sensitive clinical measure of processing speed. Math Gates adds rapid rule switching. Trail Making tests visual scanning plus sequencing under time pressure (TMT-A/B family).',
        },
        {
          h: '🏠 Daily life',
          b: 'Faster processing helps you keep up in conversation, finish forms under deadline, react when someone steps into the road, read without feeling sluggish, and switch between apps or tasks without losing the thread.',
        },
        {
          h: '📉 Aging & fatigue',
          b: 'Speed is among the first abilities to slow with age, poor sleep, and stress. Regular practice maintains the habit of responding quickly and accurately — not racing recklessly, but staying mentally “ready.”',
        },
      ],
      foot: 'Short, frequent sessions work best. Practice improves similar speed tasks; broad transfer to all of life is modest. This tracks a specific skill — not a medical test.',
    },
    ar: {
      domainLabel: 'السرعة',
      intro: 'سرعة المعالجة هي مدى سرعة استقبال دماغك للمعلومات والتصرّف — الإيقاع وراء القراءة والمحادثة والقرارات. هذه الألعاب تستخدم مهام موقّتة من البحث المعرفي، بما فيها عائلة رموز–أرقام واختبار وصل الأثر.',
      sections: [
        {
          h: '⚡ العلم',
          b: 'سرعة المعالجة ليست «موهبة» منفصلة — بل تدعم تقريباً كل مهمة ذهنية. عندما تتباطأ، تبدو الروتينات المألوفة أصعب حتى لو كنت تعرف ماذا تفعل.',
        },
        {
          h: '🔬 ما الذي تدرّبه الألعاب',
          b: 'المطابقة السريعة هي اختبار رموز–أرقام (SDMT) — أكثر مقاييس سرعة المعالجة حساسية سريرياً. بوابات الرياضيات تضيف تبديل قواعد سريع. وصل الأثر يختبر المسح البصري والتسلسل تحت ضغط الوقت.',
        },
        {
          h: '🏠 الحياة اليومية',
          b: 'معالجة أسرع تساعدك على مجاراة المحادثة، وإنجاز النماذج قبل الموعد، والتفاعل عندما يخطو أحد إلى الطريق، والقراءة دون شعور بالبطء، والتنقل بين التطبيقات دون فقدان الخيط.',
        },
        {
          h: '📉 العمر والإرهاق',
          b: 'السرعة من أوائل القدرات التي تتباطأ مع العمر وقلة النوم والضغط. التمرين المنتظم يحافظ على عادة الاستجابة السريعة الدقيقة — ليس التسرع المتهور، بل البقاء «جاهزاً» ذهنياً.',
        },
      ],
      foot: 'جلسات قصيرة متكررة هي الأفضل. التمرين يحسّن مهام سرعة مشابهة؛ الانتقال الواسع للحياة محدود. هذا يتابع مهارة محددة — وليس اختباراً طبياً.',
    },
  },

  memory: {
    en: {
      domainLabel: 'Memory',
      intro: 'Working memory is your mental workbench — holding and updating information for seconds while you use it. These exercises use Corsi blocks, n-back, and paired-associate learning: among the most studied memory trainers in cognitive science.',
      sections: [
        {
          h: '🧱 The science',
          b: 'Memo Span (Corsi) measures visuospatial short-term memory. N-Back forces continuous updating and interference control. Pair Match trains hippocampal binding — linking an item to its partner or location.',
        },
        {
          h: '🔬 What these games train',
          b: 'You rehearse holding sequences, spotting repeats from N steps back, and retrieving linked pairs — active maintenance under load, not passive cramming.',
        },
        {
          h: '🏠 Daily life',
          b: 'Working memory supports following multi-step directions, mental arithmetic, remembering why you entered a room, tracking a meeting agenda, learning names, and cooking from a recipe without losing your place.',
        },
        {
          h: '📈 Realistic expectations',
          b: 'Difficulty that tracks your current span — just past your limit — drives the largest gains in research. A few minutes daily beats one long session on weekends.',
        },
      ],
      foot: 'Memory training improves similar memory tasks and supports daily functioning. It does not treat or diagnose medical memory disorders.',
    },
    ar: {
      domainLabel: 'الذاكرة',
      intro: 'الذاكرة العاملة هي «طاولة العمل» الذهنية — حفظ المعلومات وتحديثها لثوانٍ أثناء استخدامها. هذه التمارين تستخدم كتل كورسي، وإن-باك، وتعلّم الأزواج المترابطة — من أكثر مدرّبات الذاكرة دراسةً.',
      sections: [
        {
          h: '🧱 العلم',
          b: '«مدى الذاكرة» (كورسي) يقيس الذاكرة البصرية-المكانية قصيرة المدى. إن-باك يفرض تحديثاً مستمراً وضبط تداخل. مطابقة الأزواج تدرّب ربط الحُصين — ربط عنصر بشريكه أو مكانه.',
        },
        {
          h: '🔬 ما الذي تدرّبه الألعاب',
          b: 'تتدرّب على حفظ تسلسلات، واكتشاف التكرار قبل N خطوات، واسترجاع أزواج مرتبطة — صيانة نشطة تحت حمل، لا حفظاً سلبياً.',
        },
        {
          h: '🏠 الحياة اليومية',
          b: 'الذاكرة العاملة تدعم اتباع تعليمات متعددة الخطوات، والحساب الذهني، وتذكّر سبب دخولك غرفة، ومتابعة جدول اجتماع، وتعلّم الأسماء، والطبخ من وصفة دون فقدان مكانك.',
        },
        {
          h: '📈 توقعات واقعية',
          b: 'صعوبة تتبع «مداك» الحالي — بعد حدّك بقليل — تحقق أكبر المكاسب في الأبحاث. دقائق يومياً أفضل من جلسة طويلة نهاية الأسبوع.',
        },
      ],
      foot: 'تدريب الذاكرة يحسّن مهام ذاكرة مشابهة ويدعم الحياة اليومية. لا يعالج ولا يشخّص اضطرابات الذاكرة الطبية.',
    },
  },

  language: {
    en: {
      domainLabel: 'Language',
      intro: 'Language cognition covers finding words, linking meaning, and spotting patterns — the systems that let you communicate clearly and think with words. These games train lexical access and semantic reasoning, not trivia memorization.',
      sections: [
        {
          h: '📚 The science',
          b: 'Word puzzles tap orthographic and phonological processing. Synonym tasks strengthen semantic networks. Odd-one-out exercises use category judgement — a core verbal-reasoning skill studied in psycholinguistics.',
        },
        {
          h: '🔬 What these games train',
          b: 'Decoding letter patterns, mapping words to meanings, and detecting what breaks a rule — fluent language processing under mild time pressure.',
        },
        {
          h: '🏠 Daily life',
          b: 'Sharper language skills help you find the right word in conversation, write clear emails, read instructions accurately, learn vocabulary faster, and express ideas without getting stuck mid-sentence.',
        },
        {
          h: '🌐 Bilingual training',
          b: 'Training in both English and Arabic exercises parallel language systems — useful for code-switching, professional communication, and mental flexibility between scripts and writing directions.',
        },
      ],
      foot: 'Language games strengthen word-level skills you use every day. They complement — but do not replace — reading widely and real conversation.',
    },
    ar: {
      domainLabel: 'اللغة',
      intro: 'الإدراك اللغوي يشمل إيجاد الكلمات وربط المعاني واكتشاف الأنماط — الأنظمة التي تمكّنك من التواصل بوضوح والتفكير بالكلمات. هذه الألعاب تدرّب الوصول المعجمي والاستدلال الدلالي، لا حفظ معلومات عشوائية.',
      sections: [
        {
          h: '📚 العلم',
          b: 'ألغاز الكلمات تُشغّل المعالجة الإملائية والصوتية. مهام المرادفات تقوّي الشبكات الدلالية. «الغريب» يستخدم الحكم على الفئة — مهارة استدلال لفظي أساسية في علم النفس اللغوي.',
        },
        {
          h: '🔬 ما الذي تدرّبه الألعاب',
          b: 'فك ترميز أنماط الحروف، وربط الكلمات بالمعاني، واكتشاف ما يكسر القاعدة — معالجة لغوية سلسة تحت ضغط وقت خفيف.',
        },
        {
          h: '🏠 الحياة اليومية',
          b: 'مهارات لغوية أقوى تساعدك على إيجاد الكلمة المناسبة في المحادثة، وكتابة رسائل واضحة، وقراءة التعليمات بدقة، وتعلّم مفردات أسرع، والتعبير دون التعثر وسط الجملة.',
        },
        {
          h: '🌐 التدريب ثنائي اللغة',
          b: 'التدريب بالإنجليزية والعربية يُمارس أنظمة لغوية متوازية — مفيد للتبديل بين اللغات، والتواصل المهني، والمرونة بين الاتجاهات والكتابات.',
        },
      ],
      foot: 'ألعاب اللغة تقوّي مهارات على مستوى الكلمة تستخدمها يومياً. تكمّل — ولا تستبدل — القراءة الواسعة والمحادثة الحقيقية.',
    },
  },

  reasoning: {
    en: {
      domainLabel: 'Reasoning',
      intro: 'Reasoning is building bridges from what you know to what you don\'t — planning, deducing, and solving structured problems without guessing. These games use pattern completion, spatial planning, and sequential logic paradigms from intelligence research.',
      sections: [
        {
          h: '🧩 The science',
          b: 'Raven-style matrices measure fluid reasoning — completing novel patterns. Block Escape is a planning and problem-solving task. Colour Sort (Tower of Hanoi) taps sequential planning and inhibition: undoing a tempting wrong move.',
        },
        {
          h: '🔬 What these games train',
          b: 'Seeing rules in patterns, simulating moves before acting, and revising strategies when stuck — executive planning rather than luck or rote repetition.',
        },
        {
          h: '🏠 Daily life',
          b: 'Reasoning supports troubleshooting technology, organizing projects, reading maps, making financial choices, assembling furniture from instructions, and learning new skills from a manual alone.',
        },
        {
          h: '📊 Why it matters',
          b: 'Fluid reasoning is tightly linked to learning new material quickly. Keeping it active helps you adapt when tools, jobs, or routines change — a skill for modern life, not just puzzles.',
        },
      ],
      foot: 'Logic games train specific reasoning habits. Transfer to unrelated real-world problems is helpful but not automatic — enjoy the stretch.',
    },
    ar: {
      domainLabel: 'التفكير',
      intro: 'التفكير هو بناء جسور مما تعرف إلى ما لا تعرف — التخطيط والاستنتاج وحل مسائل منظمة دون تخمين. هذه الألعاب تستخدم إكمال الأنماط، والتخطيط المكاني، ومنطق التسلسل من أبحاث الذكاء.',
      sections: [
        {
          h: '🧩 العلم',
          b: 'مصفوفات رافن تقيس الاستدلال السائل — إكمال أنماط جديدة. «هروب القطع» مهمة تخطيط وحل مشكلات. «فرز الألوان» (برج هانوي) يستهدف التخطيط التسلسلي والكبح: التراجع عن خطوة مغرية خاطئة.',
        },
        {
          h: '🔬 ما الذي تدرّبه الألعاب',
          b: 'رؤية قواعد في الأنماط، ومحاكاة الخطوات قبل التصرف، وتعديل الاستراتيجية عند التعثر — تخطيط تنفيذي لا حظاً ولا تكراراً أعمى.',
        },
        {
          h: '🏠 الحياة اليومية',
          b: 'التفكير يدعم إصلاح التقنية، وتنظيم المشاريع، وقراءة الخرائط، والقرارات المالية، وتركيب الأثاث من تعليمات، وتعلّم مهارات جديدة من دليل فقط.',
        },
        {
          h: '📊 لماذا يهم',
          b: 'الاستدلال السائل مرتبط بسرعة تعلّم مواد جديدة. إبقاؤه نشطاً يساعدك على التكيّف عند تغيّر الأدوات أو العمل أو الروتين — مهارة للحياة العصرية لا للألغاز فقط.',
        },
      ],
      foot: 'ألعاب المنطق تدرّب عادات استدلال محددة. الانتقال لمشكلات حياتية غير مرتبطة مفيد لكنه ليس تلقائياً — استمتع بالتحدّي.',
    },
  },

  flexibility: {
    en: {
      domainLabel: 'Flexibility',
      intro: 'Cognitive flexibility is adapting when rules change — overriding a strong habit and applying the new rule fast. It is the opposite of staying stuck on autopilot when the situation shifts.',
      sections: [
        {
          h: '🔄 The science',
          b: 'Set-shifting and interference control (largely prefrontal cortex) are measured by tasks like Spatial Stroop: an arrow points one way but sits on a side — you respond by the active rule (POINTS vs SITS), which keeps flipping.',
        },
        {
          h: '🔬 What these games train',
          b: 'Spatial Stroop trains rule switching under interference. Piano Tap builds timed motor flexibility. Flip exercises train perspective reversal — letting go of the first interpretation.',
        },
        {
          h: '🏠 Daily life',
          b: 'Flexibility helps when plans change last minute, a recipe step is wrong, you switch between languages or apps, manage shifting priorities at work, or recover from a mistake without rumination.',
        },
        {
          h: '⚖️ Stress & rigidity',
          b: 'Under fatigue or stress, people perseverate — repeating the old rule. Practising fast, accurate switches builds the habit of updating your approach in real time.',
        },
      ],
      foot: 'Flexibility training improves similar switching tasks. Use it to stay mentally agile when life keeps changing the rules.',
    },
    ar: {
      domainLabel: 'المرونة',
      intro: 'المرونة المعرفية هي التكيّف عند تغيّر القواعد — تجاوز عادة قوية وتطبيق القاعدة الجديدة بسرعة. عكس البقاء على «الطيار الآلي» عندما يتبدّل الموقف.',
      sections: [
        {
          h: '🔄 العلم',
          b: 'تبديل المجموعات وضبط التداخل (في القشرة الجبهية) يُقاس بمهام مثل ستروب المكاني: سهم يشير جهة ويجلس على جانب — تستجيب حسب القاعدة النشطة (يتجه أم يقع)، وتتقلب باستمرار.',
        },
        {
          h: '🔬 ما الذي تدرّبه الألعاب',
          b: 'ستروب المكاني يدرّب تبديل القواعد تحت تداخل. «نقر البيانو» يبني مرونة حركية موقّتة. «القلب» يدرّب عكس المنظور — التخلي عن التفسير الأول.',
        },
        {
          h: '🏠 الحياة اليومية',
          b: 'المرونة تساعد عند تغيّر الخطة فجأة، أو خطأ في وصفة، أو التبديل بين لغات وتطبيقات، أو أولويات متغيّرة في العمل، أو التعافي من خطأ دون تكرار.',
        },
        {
          h: '⚖️ الضغط والجمود',
          b: 'تحت التعب أو الضغط، يتمسك الناس بالقاعدة القديمة ويكررونها. التمرين على تبديلات سريعة دقيقة يبني عادة تحديث أسلوبك في الوقت الفعلي.',
        },
      ],
      foot: 'تدريب المرونة يحسّن مهام تبديل مشابهة. استخدمه للبقاء ذهنياً رشيقاً عندما تغيّر الحياة القواعد باستمرار.',
    },
  },
};
