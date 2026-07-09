/*
 * Detective Kawkab — compact survival cases, tier 3 (interlocking testimony,
 * 4 suspects or two-clue proofs, decoy details). Schema: see ./index.js
 */

export const QUICK3 = [
  // ─────────── THE SCIENCE FAIR SABOTAGE ───────────
  {
    id: 'q-science-fair', tier: 3, e: '🌋',
    title: { en: 'The Science Fair Sabotage', ar: 'تخريب معرض العلوم' },
    setting: { en: 'The School Gym Wing', ar: 'جناح القاعة الرياضية' },
    bg: ['#e9edf3', '#d3dce8'],
    briefing: {
      en: 'Between 8:00 and 8:30, someone wrecked the volcano model in the gym storeroom. Only four students were in the building. Detective Kawkab collected four statements — and noticed that three of them fit together like puzzle pieces. One did not.',
      ar: 'بين ٨:٠٠ و٨:٣٠ خرّب أحدهم مجسّم البركان في مخزن القاعة الرياضية. أربعة طلاب فقط كانوا في المبنى. جمع المحقق كوكب أربع روايات — ولاحظ أن ثلاثاً منها تتراكب كقطع الأحجية. وواحدة لا.',
    },
    hotspots: [
      { id: 'storeroom', e: '🌋', name: { en: 'The storeroom', ar: 'المخزن' }, pos: { x: 26, y: 30 }, clueId: 'wreck' },
      { id: 'hallway', e: '🚪', name: { en: 'The hallway', ar: 'الممرّ' }, pos: { x: 58, y: 60 }, clueId: 'sightlines' },
      { id: 'lab', e: '🔬', name: { en: 'The lab', ar: 'المختبر' }, pos: { x: 82, y: 30 }, clueId: 'lab-door' },
      { id: 'gym2', e: '🏀', name: { en: 'The gym', ar: 'القاعة الرياضية' }, pos: { x: 44, y: 74 }, empty: { en: 'Empty. The volcano was the only exciting thing here, and now it is lava-flavoured rubble.', ar: 'فارغة. كان البركان الشيء المشوّق الوحيد هنا، وقد صار الآن ركاماً بنكهة الحمم.' } },
    ],
    clues: [
      { id: 'wreck', e: '🌋', name: { en: 'The wrecked volcano', ar: 'البركان المخرَّب' }, text: { en: 'Smashed between 8:00 and 8:30. The four students were the only people inside the building that half hour.', ar: 'حُطّم بين ٨:٠٠ و٨:٣٠. والطلاب الأربعة كانوا وحدهم داخل المبنى في تلك النصف ساعة.' } },
      { id: 'sightlines', e: '👀', name: { en: 'Three accounts interlock', ar: 'ثلاث روايات تتشابك' }, text: { en: 'Nour & Sami vouch for each other in the hallway; Sami saw Rana peek from the lab; Rana saw BOTH of them from the lab door. Three stories, one picture.', ar: 'نور وسامي يشهد كلٌّ للآخر في الممرّ؛ وسامي رأى رنا تطلّ من المختبر؛ ورنا رأتهما كليهما من بابه. ثلاث روايات، صورة واحدة.' } },
      { id: 'lab-door', e: '🔬', name: { en: 'The lab door', ar: 'باب المختبر' }, text: { en: 'The lab door faces the hallway. Anyone peeking out sees exactly who stands there.', ar: 'باب المختبر يواجه الممرّ. من يطلّ منه يرى تماماً من يقف هناك.' } },
      { id: 'tarek-claim2', e: '🗣', name: { en: 'Tarek’s account', ar: 'رواية طارق' }, text: { en: 'Tarek claims he was with Nour and Sami in the hallway “the whole time — all three of us, together.” None of the three mention him.', ar: 'يدّعي طارق أنه كان مع نور وسامي في الممرّ «طوال الوقت — ثلاثتنا معاً». ولا أحد من الثلاثة يذكر وجوده.' } },
    ],
    suspects: [
      {
        id: 'nour3', e: '👧', name: { en: 'Nour', ar: 'نور' },
        role: { en: 'Rival project: a baking-soda geyser.', ar: 'مشروعها المنافس: نافورة صودا الخبز.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you from 8:00 to 8:30?', ar: 'أين كنتِ من ٨:٠٠ إلى ٨:٣٠؟' }, a: { en: 'With Sami in the hallway the entire half hour, going over our presentation cards.', ar: 'مع سامي في الممرّ طوال النصف ساعة كلها، نراجع بطاقات العرض.' } },
          { id: 'others', q: { en: 'Who else did you see?', ar: 'من رأيتِ أيضاً؟' }, a: { en: 'Rana peeked out of the lab once and waved at us. That’s all. The hallway was otherwise empty.', ar: 'رنا أطلّت من المختبر مرة ولوّحت لنا. هذا كل شيء. الممرّ كان فارغاً عدا ذلك.' }, givesClue: 'sightlines' },
        ],
      },
      {
        id: 'sami3', e: '🧒', name: { en: 'Sami', ar: 'سامي' },
        role: { en: 'His robot arm lost to the volcano last year.', ar: 'خسرت ذراعه الآلية أمام البركان العام الماضي.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you from 8:00 to 8:30?', ar: 'أين كنت من ٨:٠٠ إلى ٨:٣٠؟' }, a: { en: 'Nour and I were together in the hallway. Rana peeked out of the lab door once and waved.', ar: 'كنت أنا ونور معاً في الممرّ. ورنا أطلّت من باب المختبر مرة ولوّحت لنا.' } },
        ],
      },
      {
        id: 'rana3', e: '👩‍🔬', name: { en: 'Rana', ar: 'رنا' },
        role: { en: 'Works alone in the lab. Prefers it.', ar: 'تعمل وحدها في المختبر. وتفضّل ذلك.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you from 8:00 to 8:30?', ar: 'أين كنتِ من ٨:٠٠ إلى ٨:٣٠؟' }, a: { en: 'Alone in the lab with my crystals. I peeked into the hallway once — I saw the two of them there, Nour and Sami.', ar: 'وحدي في المختبر مع بلّوراتي. أطللتُ على الممرّ مرة — ورأيتهما هناك، نور وسامي.' } },
          { id: 'tarek-q', q: { en: 'Did you see Tarek?', ar: 'هل رأيتِ طارق؟' }, a: { en: 'Tarek? No. Just the two of them. Why — where does HE say he was?', ar: 'طارق؟ لا. الاثنان فقط. لماذا — وأين يقول هو إنه كان؟' } },
        ],
      },
      {
        id: 'tarek3', e: '🧑', name: { en: 'Tarek', ar: 'طارق' },
        role: { en: 'His crystal display sits beside the volcano. Sat.', ar: 'معرض بلّوراته يجاور البركان. كان يجاوره.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you from 8:00 to 8:30?', ar: 'أين كنت من ٨:٠٠ إلى ٨:٣٠؟' }, a: { en: 'I was with Nour and Sami in the hallway the whole time. All three of us, together. Ask them!', ar: 'كنت مع نور وسامي في الممرّ طوال الوقت. ثلاثتنا معاً. اسألهم!' }, givesClue: 'tarek-claim2' },
          { id: 'confront', needsClue: 'sightlines', q: { en: 'Three interlocking accounts describe that hallway — and not ONE of them includes you.', ar: 'ثلاث روايات متشابكة تصف ذلك الممرّ — ولا واحدة منها تذكرك.' }, a: { en: 'They… weren’t paying attention! I’m quiet! Famously quiet! People forget I exist ALL THE TIME.', ar: 'هم… لم يكونوا منتبهين! أنا هادئ! مشهور بهدوئي! الناس ينسون وجودي طوال الوقت.' }, reaction: { en: 'There is baking-soda dust on his sleeves. The volcano’s brand.', ar: 'على كمّيه غبار صودا الخبز. من ماركة البركان نفسه.' } },
        ],
      },
    ],
    solution: {
      culprit: 'tarek3',
      evidence: ['sightlines', 'tarek-claim2'],
      explanation: [
        { en: 'Three accounts lock together: Nour and Sami vouch for each other, Sami saw Rana peek out, and Rana saw both of them from the door.', ar: 'ثلاث روايات تتشابك: نور وسامي يشهد كلٌّ للآخر، وسامي رأى رنا تطلّ، ورنا رأتهما من الباب.' },
        { en: 'Not ONE of the three mentions Tarek in the hallway. His “all three of us together” contradicts everyone — the only account that fits nothing is the saboteur’s.', ar: 'لا أحد من الثلاثة ذكر وجود طارق في الممرّ. روايته «ثلاثتنا معاً» تناقض الجميع — والرواية الوحيدة التي لا تنسجم مع شيء هي رواية المخرّب.' },
      ],
      epilogue: { en: 'Tarek confessed at the judges’ table: the volcano kept stealing his crystals’ spotlight. The class rebuilt it together — bigger — and Tarek was assigned the lava mix, under Rana’s supervision. His crystals won “Best Supporting Exhibit”.', ar: 'اعترف طارق أمام طاولة الحكام: البركان ظلّ يسرق الأضواء من بلّوراته. أعاد الصف بناءه معاً — أكبر من قبل — وكُلّف طارق بخلطة الحمم، بإشراف رنا. وفازت بلّوراته بجائزة «أفضل معروض مساند».' },
    },
  },

  // ─────────── THE DRY COAT ───────────
  {
    id: 'q-dry-coat', tier: 3, e: '🧥',
    title: { en: 'The Dry Coat', ar: 'المعطف الجاف' },
    setting: { en: 'The Tailor’s Shop', ar: 'محل الخيّاط' },
    bg: ['#ede9f0', '#d9d2e0'],
    briefing: {
      en: 'The tailor’s shop was robbed between 3:30 and 3:45, while the clerk stepped out. The visitor log and the weather tell an interesting story — Detective Kawkab read them both twice, then looked at the coat rack.',
      ar: 'سُرق محل الخيّاط بين ٣:٣٠ و٣:٤٥ بينما خرج الموظف لدقائق. سجلّ الزوّار وحالة الطقس يرويان قصة مثيرة — قرأهما المحقق كوكب مرتين، ثم نظر إلى علّاقة المعاطف.',
    },
    hotspots: [
      { id: 'weather2', e: '🌧️', name: { en: 'The street outside', ar: 'الشارع في الخارج' }, pos: { x: 20, y: 30 }, clueId: 'rain-3' },
      { id: 'log2', e: '📖', name: { en: 'The visitor log', ar: 'سجلّ الزوّار' }, pos: { x: 56, y: 26 }, clueId: 'log-entries' },
      { id: 'rack2', e: '🧥', name: { en: 'The coat rack', ar: 'علّاقة المعاطف' }, pos: { x: 82, y: 58 }, clueId: 'dry-coat' },
      { id: 'fabrics', e: '🧵', name: { en: 'The fabric rolls', ar: 'لفائف القماش' }, pos: { x: 38, y: 66 }, empty: { en: 'One roll of fine silk is missing its middle metre. A tidy, patient cut.', ar: 'لفافة حرير فاخر ينقصها مترها الأوسط. قطعٌ مرتّب وصبور.' } },
    ],
    clues: [
      { id: 'rain-3', e: '🌧️', name: { en: 'Rain since 3:00', ar: 'مطر منذ ٣:٠٠' }, text: { en: 'Heavy rain fell nonstop from 3:00 onward. Five minutes outside without an umbrella soaks anyone through.', ar: 'هطل مطر غزير بلا توقّف من الساعة ٣:٠٠ فصاعداً. خمس دقائق في الخارج بلا مظلة تُشبع أي شخص بللاً.' } },
      { id: 'log-entries', e: '📖', name: { en: 'The visitor log', ar: 'سجلّ الزوّار' }, text: { en: 'Salma 2:00–2:30 · Ziad entered 3:30 · Mona 5:00. The clerk stepped out at 3:30, right after signing Ziad in.', ar: 'سلمى ٢:٠٠–٢:٣٠ · زياد دخل ٣:٣٠ · منى ٥:٠٠. خرج الموظف عند ٣:٣٠، بعد تسجيل زياد مباشرة.' } },
      { id: 'dry-coat', e: '🧥', name: { en: 'The dry coat', ar: 'المعطف الجاف' }, text: { en: 'When Ziad hung up his coat at 3:30, it was perfectly dry — collar, shoulders, everything.', ar: 'حين علّق زياد معطفه عند ٣:٣٠ كان جافاً تماماً — الياقة والكتفان وكل شيء.' } },
      { id: 'ziad-walk', e: '🗣', name: { en: 'Ziad’s walk', ar: 'مشوار زياد' }, text: { en: 'Ziad says he “walked over at 3:30 — five minutes through the rain, no umbrella.”', ar: 'يقول زياد إنه «جاء ماشياً عند ٣:٣٠ — خمس دقائق تحت المطر بلا مظلة».' } },
    ],
    suspects: [
      {
        id: 'salma3', e: '👩', name: { en: 'Salma', ar: 'سلمى' },
        role: { en: 'Morning customer, fitting a jacket.', ar: 'زبونة الصباح، تقيس سترة.' },
        questions: [
          { id: 'alibi', q: { en: 'When were you at the shop?', ar: 'متى كنتِ في المحل؟' }, a: { en: 'Two to two-thirty, for my fitting — signed in, signed out, home before the rain even started. Dry as toast.', ar: 'من الثانية إلى الثانية والنصف، للقياس — سجّلت دخولاً وخروجاً، وعدت إلى البيت قبل أن يبدأ المطر أصلاً. جافة تماماً.' } },
        ],
      },
      {
        id: 'ziad3', e: '🚶', name: { en: 'Ziad', ar: 'زياد' },
        role: { en: 'Arrived at 3:30. Browsing, he says.', ar: 'وصل عند ٣:٣٠. يتفرّج، كما يقول.' },
        questions: [
          { id: 'alibi', q: { en: 'How did you get here?', ar: 'كيف وصلت إلى هنا؟' }, a: { en: 'I walked over at 3:30 — five minutes through the rain, no umbrella. Then I browsed the fabrics until the clerk returned.', ar: 'جئت ماشياً عند ٣:٣٠ — خمس دقائق تحت المطر بلا مظلة. ثم رحت أتفرّج على الأقمشة حتى عاد الموظف.' }, givesClue: 'ziad-walk' },
          { id: 'confront', needsClue: 'dry-coat', q: { en: 'Five minutes of heavy rain, no umbrella — and your coat hung up perfectly DRY?', ar: 'خمس دقائق من مطر غزير بلا مظلة — ومعطفك عُلّق جافاً تماماً؟' }, a: { en: 'It’s… a very fast-drying coat! Modern fabric! Space technology, the seller said!', ar: 'إنه… معطف سريع الجفاف جداً! قماش حديث! تقنية فضائية، هكذا قال البائع!' }, reaction: { en: 'Detective Kawkab touches the coat. It is wool. Wool remembers every raindrop.', ar: 'يلمس المحقق كوكب المعطف. إنه صوف. والصوف يحفظ كل قطرة مطر.' } },
        ],
      },
      {
        id: 'mona3', e: '👵', name: { en: 'Mona', ar: 'منى' },
        role: { en: 'The 5:00 appointment. Very punctual.', ar: 'موعد الخامسة. دقيقة جداً في مواعيدها.' },
        questions: [
          { id: 'alibi', q: { en: 'When did you arrive?', ar: 'متى وصلتِ؟' }, a: { en: 'Five o’clock sharp, for my curtain measurements — an hour and a quarter AFTER your robbery, dear. My umbrella can testify; it’s still dripping.', ar: 'الخامسة تماماً، لقياسات الستائر — أي بعد سرقتكم بساعة وربع يا عزيزي. ومظلّتي شاهدة؛ ما تزال تقطر.' } },
        ],
      },
    ],
    solution: {
      culprit: 'ziad3',
      evidence: ['rain-3', 'dry-coat'],
      explanation: [
        { en: 'Five minutes of heavy rain with no umbrella soaks a coat through. His was perfectly dry at 3:30.', ar: 'خمس دقائق من مطر غزير بلا مظلة تُشبع المعطف بللاً. ومعطفه كان جافاً تماماً عند ٣:٣٠.' },
        { en: 'So he never walked over at 3:30 — he had slipped inside BEFORE the rain began at 3:00 and hid. The “3:30 entrance” in the log was staged, right before the clerk stepped out.', ar: 'إذاً لم يأتِ ماشياً عند ٣:٣٠ — بل تسلّل إلى الداخل قبل بدء المطر عند ٣:٠٠ واختبأ. و«دخول ٣:٣٠» في السجل تمثيلية، قُبيل خروج الموظف مباشرة.' },
      ],
      epilogue: { en: 'The metre of silk was folded flat inside his coat’s lining — the coat that betrayed him twice. The tailor, impressed despite himself, stitched the lining shut for free. Ziad paid for the silk, the fitting, and a new umbrella he now carries everywhere.', ar: 'كان متر الحرير مطويّاً داخل بطانة معطفه — المعطف الذي خانه مرتين. الخيّاط، المعجب رغماً عنه، خاط البطانة وأغلقها مجاناً. ودفع زياد ثمن الحرير والقياس ومظلةً جديدة صار يحملها أينما ذهب.' },
    },
  },

  // ─────────── THE DROWNED GANGWAY ───────────
  {
    id: 'q-tide', tier: 3, e: '⛵',
    title: { en: 'The Drowned Gangway', ar: 'المعبر الغارق' },
    setting: { en: 'The Harbour', ar: 'المرفأ' },
    bg: ['#e2edf2', '#c8dde8'],
    briefing: {
      en: 'The yacht’s cabin was robbed between 3:00 and 3:30. Detective Kawkab interviewed the harbour’s sharpest witness first: the tide chart. It never lies, never forgets, and never asks for a lawyer.',
      ar: 'سُرقت قمرة اليخت بين ٣:٠٠ و٣:٣٠. استجوب المحقق كوكب أدقّ شهود المرفأ أولاً: جدول المدّ والجزر. فهو لا يكذب ولا ينسى ولا يطالب بمحامٍ.',
    },
    hotspots: [
      { id: 'tide-chart', e: '🌊', name: { en: 'The tide chart', ar: 'جدول المدّ' }, pos: { x: 24, y: 28 }, clueId: 'tide' },
      { id: 'gangway', e: '🪜', name: { en: 'The gangway', ar: 'المعبر الخشبي' }, pos: { x: 56, y: 58 }, clueId: 'wet-marks' },
      { id: 'yacht', e: '⛵', name: { en: 'The yacht cabin', ar: 'قمرة اليخت' }, pos: { x: 84, y: 32 }, clueId: 'cabin' },
      { id: 'rowboat', e: '🚣', name: { en: 'The rowing boats', ar: 'قوارب التجديف' }, pos: { x: 34, y: 72 }, empty: { en: 'Two boats. One still has supplies-crate splinters in it, as Rana said.', ar: 'قاربان. في أحدهما ما تزال شظايا صندوق المؤن، كما قالت رنا.' } },
    ],
    clues: [
      { id: 'tide', e: '🌊', name: { en: 'The tide chart', ar: 'جدول المدّ' }, text: { en: 'Until 3:15 the tide kept the gangway UNDERWATER — before that, the yacht could only be reached by rowing boat.', ar: 'حتى ٣:١٥ كان المدّ يُغرق المعبر الخشبي — وقبل ذلك لا يمكن بلوغ اليخت إلا بقارب تجديف.' } },
      { id: 'wet-marks', e: '🪜', name: { en: 'The waterline', ar: 'خطّ الماء' }, text: { en: 'The gangway planks show a clear waterline — they were submerged until mid-afternoon, exactly as the chart says.', ar: 'ألواح المعبر تحمل خطّ ماء واضحاً — كانت مغمورة حتى منتصف العصر، تماماً كما يقول الجدول.' } },
      { id: 'cabin', e: '⛵', name: { en: 'The cabin', ar: 'القمرة' }, text: { en: 'The cabin lock was picked cleanly. Whoever did it had steady hands and dry footing.', ar: 'قُفل القمرة فُتح بمهارة. من فعلها كانت يداه ثابتتين وموطئ قدمه جافاً.' } },
      { id: 'walid-claim3', e: '🗣', name: { en: 'Walid’s stroll', ar: 'نزهة وليد' }, text: { en: 'Walid says he WALKED up the gangway at 3:05, looked around, and left by 3:10.', ar: 'يقول وليد إنه صعد المعبر مشياً عند ٣:٠٥، وألقى نظرة، وغادر عند ٣:١٠.' } },
    ],
    suspects: [
      {
        id: 'walid3', e: '🚶', name: { en: 'Walid', ar: 'وليد' },
        role: { en: 'Deckhand from the next pier. Curious type.', ar: 'عامل سطح من الرصيف المجاور. فضولي الطبع.' },
        questions: [
          { id: 'alibi', q: { en: 'Were you near the yacht?', ar: 'هل كنت قرب اليخت؟' }, a: { en: 'Briefly! I walked up the gangway at 3:05 for a quick look, saw nothing odd, and left by 3:10. In and out.', ar: 'للحظات! صعدت المعبر مشياً عند ٣:٠٥ لإلقاء نظرة سريعة، لم أرَ شيئاً غريباً، وغادرت عند ٣:١٠. دخول وخروج.' }, givesClue: 'walid-claim3' },
          { id: 'confront', needsClue: 'tide', q: { en: 'At 3:05 the gangway was UNDERWATER. Nobody walked up it before 3:15.', ar: 'عند ٣:٠٥ كان المعبر غارقاً تحت الماء. لا أحد صعده مشياً قبل ٣:١٥.' }, a: { en: '…The tide came early! Tides do that! They’re very… unpredictable. Famously.', ar: '…المدّ انحسر مبكراً! المدّ يفعل ذلك! إنه… لا يمكن التنبؤ به. كما هو معروف.' }, reaction: { en: 'The tide chart, unmoved, continues to say 3:15.', ar: 'جدول المدّ، غير المتأثر، يواصل قول ٣:١٥.' } },
        ],
      },
      {
        id: 'rana4', e: '🚣', name: { en: 'Rana', ar: 'رنا' },
        role: { en: 'Delivers supplies to moored boats.', ar: 'توصل المؤن إلى القوارب الراسية.' },
        questions: [
          { id: 'alibi', q: { en: 'Were you near the yacht?', ar: 'هل كنتِ قرب اليخت؟' }, a: { en: 'I rowed out at 3:20 to deliver supplies, handed the crate up, and rowed straight back. The tide was just uncovering the gangway as I left.', ar: 'جدّفتُ عند ٣:٢٠ لتسليم المؤن، ناولت الصندوق وعدت مباشرة. كان المدّ بدأ يكشف المعبر وأنا مغادرة.' } },
        ],
      },
      {
        id: 'karim4', e: '🎣', name: { en: 'Karim the angler', ar: 'الصيّاد كريم' },
        role: { en: 'Fishes off the pier every afternoon.', ar: 'يصطاد من الرصيف كل عصر.' },
        questions: [
          { id: 'alibi', q: { en: 'What did you see this afternoon?', ar: 'ماذا رأيت هذا العصر؟' }, a: { en: 'Fish, mostly, refusing my hook. I saw Rana row out around 3:20. Before that? The gangway was in the sea where it belongs at high tide.', ar: 'أسماكاً، غالباً، ترفض صنّارتي. رأيت رنا تجدّف نحو ٣:٢٠. قبل ذلك؟ كان المعبر في البحر حيث ينتمي وقت المدّ.' } },
        ],
      },
    ],
    solution: {
      culprit: 'walid3',
      evidence: ['tide', 'walid-claim3'],
      explanation: [
        { en: 'At 3:05 the gangway was still underwater — nobody “walked up” it before 3:15. His story cannot have happened as told.', ar: 'عند ٣:٠٥ كان المعبر لا يزال غارقاً — لا أحد «صعده مشياً» قبل ٣:١٥. روايته لا يمكن أن تكون حدثت كما رواها.' },
        { en: 'Rana’s rowing at 3:20 fits the tide perfectly, and Karim confirms it. Walid reached the yacht another way, or at another time — and lied to cover it.', ar: 'تجديف رنا عند ٣:٢٠ ينسجم تماماً مع المدّ، وكريم يؤكده. أما وليد فبلغ اليخت بطريقة أخرى أو في وقت آخر — وكذب ليغطي ذلك.' },
      ],
      epilogue: { en: 'Walid had borrowed the second rowing boat at 2:50, picked the cabin lock, and invented the gangway stroll without checking the tide. The captain got his brass sextant back, Karim got the best fishing story of the season, and the tide chart got a small frame on the harbour office wall.', ar: 'كان وليد قد استعار قارب التجديف الثاني عند ٢:٥٠، وفتح قفل القمرة، واختلق نزهة المعبر دون أن يتحقق من المدّ. استعاد القبطان سدسه النحاسي، وحصل كريم على أفضل حكاية صيد في الموسم، ونال جدول المدّ إطاراً صغيراً على جدار مكتب المرفأ.' },
    },
  },

  // ─────────── THE TORN LEDGER PAGE ───────────
  {
    id: 'q-ledger', tier: 3, e: '📖',
    title: { en: 'The Torn Ledger Page', ar: 'صفحة السجلّ الممزّقة' },
    setting: { en: 'The Library', ar: 'المكتبة' },
    bg: ['#f0ece2', '#e0d8c4'],
    briefing: {
      en: 'The library’s prize atlas is missing, and the page recording its last borrower has been torn out of the ledger. A dead end? Detective Kawkab noticed the librarian pressing her pen through three sheets at once, and smiled.',
      ar: 'أطلس المكتبة الثمين مفقود، والصفحة التي تسجّل آخر مستعير له مُزّقت من السجلّ. طريق مسدود؟ لاحظ المحقق كوكب أن أمينة المكتبة تضغط بقلمها عبر ثلاث ورقات دفعة واحدة، وابتسم.',
    },
    hotspots: [
      { id: 'ledger', e: '📖', name: { en: 'The borrowing ledger', ar: 'سجلّ الاستعارة' }, pos: { x: 30, y: 28 }, clueId: 'torn' },
      { id: 'pencil', e: '✏️', name: { en: 'The page beneath', ar: 'الصفحة التالية' }, pos: { x: 62, y: 56 }, clueId: 'imprint' },
      { id: 'shelf4', e: '🗺️', name: { en: 'The atlas shelf', ar: 'رفّ الأطالس' }, pos: { x: 84, y: 28 }, clueId: 'shelf-gap' },
      { id: 'reading', e: '🪑', name: { en: 'The reading corner', ar: 'ركن القراءة' }, pos: { x: 44, y: 72 }, empty: { en: 'Comfortable chairs and a strict NO SNACKS sign, lightly dusted with crumbs.', ar: 'مقاعد مريحة ولافتة صارمة «ممنوع الأكل»، عليها ذرّات فتات خفيفة.' } },
    ],
    clues: [
      { id: 'torn', e: '📖', name: { en: 'The torn page', ar: 'الصفحة الممزّقة' }, text: { en: 'The page recording the atlas’s last borrower has been ripped out — the tear is fresh.', ar: 'الصفحة التي تسجّل آخر مستعير للأطلس مُزّقت — والتمزّق حديث.' } },
      { id: 'imprint', e: '✏️', name: { en: 'The pencil imprint', ar: 'انطباع الرصاص' }, text: { en: 'The librarian writes with a heavy hand. Shading the page beneath revealed the imprint: “Star Atlas — H. Mansour — Tuesday.”', ar: 'الأمينة تكتب بضغطة قوية. تظليل الصفحة التالية أظهر الانطباع: «أطلس النجوم — هـ. منصور — الثلاثاء».' } },
      { id: 'shelf-gap', e: '🗺️', name: { en: 'The empty slot', ar: 'الفراغ على الرفّ' }, text: { en: 'The atlas’s slot is empty, its neighbours undisturbed. Whoever took it went straight to it — no searching.', ar: 'مكان الأطلس فارغ، وجيرانه لم يُمسّوا. من أخذه ذهب إليه مباشرة — دون بحث.' } },
      { id: 'hadi-denial', e: '🗣', name: { en: 'Hadi’s denial', ar: 'إنكار هادي' }, text: { en: 'Hadi Mansour swears he “never borrowed the atlas — never even touched that shelf.”', ar: 'هادي منصور يقسم أنه «لم يستعر الأطلس قط — بل لم يلمس ذلك الرفّ أصلاً».' } },
    ],
    suspects: [
      {
        id: 'hadi4', e: '🧑', name: { en: 'Hadi Mansour', ar: 'هادي منصور' },
        role: { en: 'Astronomy fan. Library card well-worn.', ar: 'مولع بالفلك. بطاقة مكتبته مهترئة من الاستعمال.' },
        questions: [
          { id: 'alibi', q: { en: 'Did you borrow the Star Atlas?', ar: 'هل استعرت أطلس النجوم؟' }, a: { en: 'I never borrowed the atlas. I’ve never even touched that shelf, honestly. I only come for the space magazines.', ar: 'لم أستعر الأطلس قط. بل لم ألمس ذلك الرفّ أصلاً، بصراحة. آتي فقط من أجل مجلات الفضاء.' }, givesClue: 'hadi-denial' },
          { id: 'confront', needsClue: 'imprint', q: { en: 'The imprint of the torn page reads: “Star Atlas — H. Mansour — Tuesday.”', ar: 'انطباع الصفحة الممزّقة يقول: «أطلس النجوم — هـ. منصور — الثلاثاء».' }, a: { en: '…There must be ANOTHER H. Mansour! It’s a very common name! In some neighbourhoods! Possibly this one!', ar: '…لا بد أن هناك «هـ. منصور» آخر! إنه اسم شائع جداً! في بعض الأحياء! ربما هذا الحيّ!' }, reaction: { en: 'The librarian checks: one H. Mansour holds a card. He is standing right here.', ar: 'تتحقق الأمينة: «هـ. منصور» واحد فقط يحمل بطاقة. وهو واقف هنا تماماً.' } },
        ],
      },
      {
        id: 'mira4', e: '👩‍🎓', name: { en: 'Mira', ar: 'ميرا' },
        role: { en: 'Studies at the same table daily.', ar: 'تدرس على الطاولة نفسها يومياً.' },
        questions: [
          { id: 'alibi', q: { en: 'Did you see anything on Tuesday?', ar: 'هل رأيتِ شيئاً يوم الثلاثاء؟' }, a: { en: 'Only my thermodynamics notes, sadly. Though someone WAS hovering by the atlas shelf around noon — tall-ish? I didn’t look up properly. Exams.', ar: 'دفاتر الديناميكا الحرارية فقط، للأسف. مع أن أحدهم كان يحوم قرب رفّ الأطالس نحو الظهر — طويل نوعاً ما؟ لم أرفع نظري جيداً. الامتحانات.' } },
        ],
      },
      {
        id: 'omar4', e: '🧹', name: { en: 'Omar the cleaner', ar: 'المنظّف عمر' },
        role: { en: 'Dusts the shelves every evening.', ar: 'ينفض غبار الرفوف كل مساء.' },
        questions: [
          { id: 'alibi', q: { en: 'When did you last see the atlas?', ar: 'متى رأيت الأطلس آخر مرة؟' }, a: { en: 'Monday evening, in its slot, heavy as a doorstep. Tuesday evening the slot was empty and I reported it myself — it’s in my cleaning log.', ar: 'مساء الاثنين، في مكانه، ثقيلاً كعتبة باب. ومساء الثلاثاء كان المكان فارغاً وأنا من أبلغ عن ذلك — مدوَّن في سجلّ تنظيفي.' } },
        ],
      },
    ],
    solution: {
      culprit: 'hadi4',
      evidence: ['imprint', 'hadi-denial'],
      explanation: [
        { en: 'The imprint preserves exactly what the torn page said: the atlas went to H. Mansour on Tuesday.', ar: 'الانطباع يحفظ ما كان مكتوباً في الصفحة الممزّقة حرفياً: الأطلس استعاره هـ. منصور يوم الثلاثاء.' },
        { en: 'Tearing the page only helped whoever was named on it. Hadi denied ever touching the shelf — the imprint calls that a lie and hands us the borrower, the tearer, and the thief in one name.', ar: 'تمزيق الصفحة لا يفيد إلا من ورد اسمه فيها. أنكر هادي أنه لمس الرفّ — والانطباع يكذّبه ويسلّمنا المستعير وممزّق الصفحة والسارق في اسم واحد.' },
      ],
      epilogue: { en: 'The atlas was on Hadi’s desk at home, open to the star maps he “couldn’t give back yet — comet season!” He returned it with three weeks of fines, and the librarian now photographs every ledger page. She still presses just as hard, on principle.', ar: 'كان الأطلس على مكتب هادي في البيت، مفتوحاً على خرائط النجوم التي «لم يستطع إعادتها بعد — موسم المذنّبات!». أعاده مع غرامة ثلاثة أسابيع، وصارت الأمينة تصوّر كل صفحة من السجل. وما تزال تضغط بقلمها بالقوة نفسها، من باب المبدأ.' },
    },
  },

  // ─────────── THE INVISIBLE POWDER ───────────
  {
    id: 'q-blue-hands', tier: 3, e: '🧪',
    title: { en: 'The Invisible Powder', ar: 'المسحوق الخفي' },
    setting: { en: 'The Team Clubhouse', ar: 'مقرّ الفريق' },
    bg: ['#e6eef2', '#cfe0e8'],
    briefing: {
      en: 'Expecting a thief, the coach dusted the team fee-box with an invisible powder that turns bright BLUE the moment it is washed with soap and water. Next morning, he called Detective Kawkab — and asked everyone to show their hands.',
      ar: 'توقّع المدرّب وجود سارق، فرشّ صندوق اشتراكات الفريق بمسحوقٍ خفيّ يتحوّل إلى أزرق زاهٍ لحظةَ غسله بالماء والصابون. في صباح اليوم التالي استدعى المحقق كوكب — وطلب من الجميع إظهار أيديهم.',
    },
    hotspots: [
      { id: 'box2', e: '📦', name: { en: 'The fee-box', ar: 'صندوق الاشتراكات' }, pos: { x: 28, y: 30 }, clueId: 'trap' },
      { id: 'sink', e: '🚿', name: { en: 'The washroom sink', ar: 'مغسلة الحمّام' }, pos: { x: 64, y: 60 }, clueId: 'sink-soap' },
      { id: 'art-room', e: '🎨', name: { en: 'The art corner', ar: 'ركن الرسم' }, pos: { x: 84, y: 28 }, clueId: 'art-check' },
      { id: 'lockers', e: '🔐', name: { en: 'The lockers', ar: 'الخزائن' }, pos: { x: 44, y: 70 }, empty: { en: 'Rows of dented doors. One smells of victory socks. None of money.', ar: 'صفوف من الأبواب المنبعجة. أحدها تفوح منه رائحة جوارب النصر. ولا واحد منها رائحة نقود.' } },
      { id: 'hands', e: '🙌', name: { en: 'The hand inspection', ar: 'فحص الأيدي' }, pos: { x: 50, y: 42 }, clueId: 'blue-hands' },
    ],
    clues: [
      { id: 'trap', e: '🧪', name: { en: 'The powder trap', ar: 'فخّ المسحوق' }, text: { en: 'The powder is invisible on dry hands. ONLY touching the box and then washing with soap turns the skin bright blue.', ar: 'المسحوق خفيّ على اليد الجافة. لمسُ الصندوق ثم الغسل بالصابون هو وحده ما يصبغ الجلد بالأزرق الزاهي.' } },
      { id: 'sink-soap', e: '🚿', name: { en: 'The used sink', ar: 'المغسلة المستعملة' }, text: { en: 'The washroom sink shows fresh soap streaks and faint blue swirls around the drain — someone scrubbed hard here last night.', ar: 'على المغسلة آثار صابون حديثة ودوّامات زرقاء باهتة حول المصرف — أحدهم فرك يديه هنا بقوة ليلة أمس.' } },
      { id: 'art-check', e: '🎨', name: { en: 'The art-class check', ar: 'تدقيق حصة الرسم' }, text: { en: 'The art teacher confirms: this week’s paints were red and yellow only. No blue paint anywhere in the art room.', ar: 'معلّم الرسم يؤكد: ألوان هذا الأسبوع حمراء وصفراء فقط. لا طلاء أزرق في قاعة الرسم إطلاقاً.' } },
      { id: 'blue-hands', e: '🙌', name: { en: 'The hand inspection', ar: 'فحص الأيدي' }, text: { en: 'Yara’s hands: clean. Nour’s hands: normal. Karim’s hands: stained bright, unmistakable blue.', ar: 'يدا يارا: نظيفتان. يدا نور: طبيعيتان. يدا كريم: مصبوغتان بأزرق زاهٍ لا تخطئه عين.' } },
    ],
    suspects: [
      {
        id: 'yara5', e: '🧤', name: { en: 'Yara', ar: 'يارا' },
        role: { en: 'Goalkeeper. Wears gloves half her life.', ar: 'حارسة المرمى. ترتدي القفازات نصف حياتها.' },
        questions: [
          { id: 'alibi', q: { en: 'Show me your hands?', ar: 'أريني يديك؟' }, a: { en: 'Clean! See? I didn’t even know where the coach KEEPS the box. My gloves know more than I do.', ar: 'نظيفتان! أرأيت؟ أنا لا أعرف حتى أين يحفظ المدرّب الصندوق. قفازاي يعرفان أكثر مني.' } },
        ],
      },
      {
        id: 'karim5', e: '😤', name: { en: 'Karim', ar: 'كريم' },
        role: { en: 'Striker. Hands currently a striking blue.', ar: 'مهاجم. يداه حالياً زرقاوان بشكل لافت.' },
        questions: [
          { id: 'alibi', q: { en: 'Why are your hands blue?', ar: 'لماذا يداك زرقاوان؟' }, a: { en: 'Blue? That’s from ART CLASS! We painted… skies. Big skies. I never went NEAR the fee-box, I swear.', ar: 'أزرق؟ هذا من حصة الرسم! رسمنا… سماوات. سماوات واسعة. لم أقترب من صندوق الاشتراكات، أقسم.' } },
          { id: 'confront', needsClue: 'art-check', q: { en: 'Art class used only red and yellow this week. There is no blue paint in that room.', ar: 'حصة الرسم استعملت الأحمر والأصفر فقط هذا الأسبوع. لا يوجد طلاء أزرق في تلك القاعة.' }, a: { en: '…Red and yellow make… blue? Sometimes? In bad lighting?!', ar: '…الأحمر والأصفر يصنعان… أزرق؟ أحياناً؟ في الإضاءة السيئة؟!' }, reaction: { en: 'Detective Kawkab, gently: “They make orange, Karim.”', ar: 'يقول المحقق كوكب بلطف: «يصنعان برتقالياً يا كريم.»' } },
        ],
      },
      {
        id: 'nour5', e: '🏃‍♀️', name: { en: 'Nour', ar: 'نور' },
        role: { en: 'Midfielder. First to arrive, last to leave.', ar: 'لاعبة وسط. أول من يصل وآخر من يغادر.' },
        questions: [
          { id: 'alibi', q: { en: 'Show me your hands?', ar: 'أريني يديك؟' }, a: { en: 'Normal hands, zero blue. I saw Karim at the sink last night though, scrubbing like he was drowning. Very committed to hygiene, suddenly.', ar: 'يدان طبيعيتان، صفر أزرق. لكنني رأيت كريم عند المغسلة ليلة أمس يفرك يديه كأنه يغرق. التزام مفاجئ بالنظافة.' } },
        ],
      },
    ],
    solution: {
      culprit: 'karim5',
      evidence: ['trap', 'blue-hands'],
      explanation: [
        { en: 'This exact blue appears ONLY from the trap powder — and only after touching the box and then washing.', ar: 'هذه الزرقة بالذات لا تظهر إلا من مسحوق الفخّ — وفقط بعد لمس الصندوق ثم الغسل.' },
        { en: 'His stained hands prove both the touch and the guilty scrubbing; “I never went near it” is disproven by his own skin. The washing that was meant to hide the crime revealed it.', ar: 'يداه المصبوغتان تُثبتان اللمس والغسلَ المذنب معاً؛ و«لم أقترب منه» تدحضها بشرته نفسها. الغسل الذي أراد به إخفاء الفعلة هو الذي فضحها.' },
      ],
      epilogue: { en: 'The fees were in his boot bag, folded inside a spare sock. Karim wanted new boots before the derby; he got them eventually — paid in instalments of clubhouse chores. His hands stayed faintly blue for a week, which the team declared “the new club colour”.', ar: 'كانت الاشتراكات في حقيبة حذائه، مطويةً داخل جورب احتياطي. أراد كريم حذاءً جديداً قبل الديربي؛ وحصل عليه في النهاية — بأقساطٍ من أعمال المقرّ. وبقيت يداه زرقاوين بشكل خفيف أسبوعاً كاملاً، فأعلنها الفريق «لون النادي الجديد».' },
    },
  },

  // ─────────── SKETCH BY MOONLIGHT ───────────
  {
    id: 'q-new-moon', tier: 3, e: '🌑',
    title: { en: 'Sketch by Moonlight', ar: 'رسمٌ على ضوء القمر' },
    setting: { en: 'The Warehouse Yard', ar: 'ساحة المستودع' },
    bg: ['#e4e4ec', '#ccccdc'],
    briefing: {
      en: 'To support a big insurance claim about a midnight warehouse theft, a witness came forward with a detailed sketch of the “thief’s face”. Detective Kawkab studied the sketch, then the sky, then the sketch again. One of them was lying.',
      ar: 'دعماً لمطالبة تأمين كبيرة عن سرقة مستودعٍ في منتصف الليل، تقدّم شاهد برسمٍ مفصّل لـ«وجه اللص». تأمّل المحقق كوكب الرسمَ، ثم السماء، ثم الرسم من جديد. أحدهما كان يكذب.',
    },
    hotspots: [
      { id: 'almanac', e: '🌑', name: { en: 'The almanac', ar: 'التقويم الفلكي' }, pos: { x: 26, y: 26 }, clueId: 'new-moon' },
      { id: 'yard2', e: '💡', name: { en: 'The warehouse yard', ar: 'ساحة المستودع' }, pos: { x: 58, y: 58 }, clueId: 'no-lamps' },
      { id: 'window3', e: '🪟', name: { en: 'Zaki’s window', ar: 'نافذة زكي' }, pos: { x: 84, y: 30 }, clueId: 'window-view' },
      { id: 'office2', e: '🗂️', name: { en: 'The claims office', ar: 'مكتب المطالبات' }, pos: { x: 40, y: 72 }, empty: { en: 'The claim file is thick, urgent, and signed in very confident ink.', ar: 'ملف المطالبة سميك وعاجل وموقَّع بحبرٍ شديد الثقة.' } },
    ],
    clues: [
      { id: 'new-moon', e: '🌑', name: { en: 'The new moon', ar: 'القمر المحاق' }, text: { en: 'The almanac shows a NEW MOON that night — the sky was black. No moonlight fell on anything.', ar: 'التقويم الفلكي يُظهر أن القمر كان محاقاً تلك الليلة — السماء سوداء تماماً. لا ضوء قمر سقط على شيء.' } },
      { id: 'no-lamps', e: '💡', name: { en: 'No lamps', ar: 'لا مصابيح' }, text: { en: 'The warehouse yard has no lamps at all. At midnight it is a well of darkness.', ar: 'ساحة المستودع بلا مصابيح إطلاقاً. في منتصف الليل تكون بئراً من الظلام.' } },
      { id: 'window-view', e: '🪟', name: { en: 'The window view', ar: 'إطلالة النافذة' }, text: { en: 'Zaki’s window does overlook the yard — forty metres away. Even by day, faces are small from here.', ar: 'نافذة زكي تطلّ على الساحة فعلاً — من بُعد أربعين متراً. حتى في النهار تبدو الوجوه صغيرة من هنا.' } },
      { id: 'zaki-story', e: '🗣', name: { en: 'Zaki’s testimony', ar: 'شهادة زكي' }, text: { en: 'Zaki says the FULL MOON “lit the yard like a lamp” while he watched the thief for ten minutes and sketched every detail.', ar: 'يقول زكي إن البدر «أضاء الساحة كالمصباح» بينما راقب اللص عشر دقائق ورسم كل التفاصيل.' } },
    ],
    suspects: [
      {
        id: 'zaki6', e: '🖌️', name: { en: 'Zaki the witness', ar: 'الشاهد زكي' },
        role: { en: 'Neighbour, amateur artist, very helpful. Very.', ar: 'جار ورسّام هاوٍ ومتعاون جداً. جداً.' },
        questions: [
          { id: 'story', q: { en: 'Tell me what you saw.', ar: 'أخبرني بما رأيت.' }, a: { en: 'From my window I watched him for ten whole minutes — the FULL MOON lit the yard like a lamp, so I sketched every detail of his face. You’re welcome.', ar: 'من نافذتي راقبته عشر دقائق كاملة — كان البدر يضيء الساحة كالمصباح، فرسمتُ كل ملامح وجهه. على الرحب والسعة.' }, givesClue: 'zaki-story' },
          { id: 'confront', needsClue: 'new-moon', q: { en: 'The almanac says NEW MOON that night. Black sky. What lit your yard “like a lamp”?', ar: 'التقويم يقول إن القمر كان محاقاً تلك الليلة. سماء سوداء. فما الذي أضاء ساحتك «كالمصباح»؟' }, a: { en: '…Stars! Very strong stars that night! Also my eyes adjust remarkably— look, the SKETCH is the important thing!', ar: '…النجوم! نجوم قوية جداً تلك الليلة! وعيناي تتأقلمان بشكل مذهل— اسمع، الرسم هو المهم!' }, reaction: { en: 'The sketch, on inspection, strongly resembles a man from a shaving-cream advert.', ar: 'الرسم، عند التدقيق، يشبه كثيراً رجلاً من إعلان معجون حلاقة.' } },
        ],
      },
      {
        id: 'owner6', e: '🕴️', name: { en: 'The warehouse owner', ar: 'صاحب المستودع' },
        role: { en: 'Filed the insurance claim. In a hurry.', ar: 'قدّم مطالبة التأمين. وعلى عجلة من أمره.' },
        questions: [
          { id: 'claim', q: { en: 'What was stolen?', ar: 'ما الذي سُرق؟' }, a: { en: 'Electronics! Crates of them! All insured, thankfully — the paperwork was already… very ready. Zaki’s sketch should speed things up nicely.', ar: 'إلكترونيات! صناديق كاملة! كلها مؤمَّنة لحسن الحظ — الأوراق كانت أصلاً… جاهزة جداً. ورسم زكي سيسرّع الأمور بشكل ممتاز.' } },
        ],
      },
      {
        id: 'guard6', e: '💂', name: { en: 'The night guard', ar: 'حارس الليل' },
        role: { en: 'Guards three warehouses. Slept through none, he says.', ar: 'يحرس ثلاثة مستودعات. ولم يغفُ عن أيٍّ منها، كما يقول.' },
        questions: [
          { id: 'night', q: { en: 'What did you see that night?', ar: 'ماذا رأيت تلك الليلة؟' }, a: { en: 'Nothing — and that’s the strange part. No truck, no lights, no noise. You can’t move crates in silence. In THAT darkness I couldn’t see my own boots.', ar: 'لا شيء — وهذا هو الغريب. لا شاحنة ولا أضواء ولا ضجيج. لا يمكن نقل صناديق بصمت. وفي ذلك الظلام لم أكن أرى حذائي.' } },
        ],
      },
    ],
    solution: {
      culprit: 'zaki6',
      evidence: ['new-moon', 'zaki-story'],
      explanation: [
        { en: 'A new moon gives NO light — and the yard has no lamps. “The full moon lit the yard” describes a night that never happened.', ar: 'القمر المحاق لا ضوء له — والساحة بلا مصابيح. «البدر يضيء الساحة» وصفٌ لليلةٍ لم تقع.' },
        { en: 'A witness lying about HOW he saw cannot be believed about WHAT he saw. The sketch was drawn to prop up the claim — the “witness” is part of the insurance trick.', ar: 'شاهدٌ يكذب في كيفية الرؤية لا يُصدَّق فيما رأى. الرسم أُعدّ لدعم المطالبة — و«الشاهد» شريك في حيلة التأمين.' },
      ],
      epilogue: { en: 'The “stolen” crates were in a rented lockup two streets away, and Zaki’s payment for the sketch was to be ten percent. The insurance company sent a thank-you letter to the almanac’s publishers. The night guard finally got a torch.', ar: 'كانت الصناديق «المسروقة» في مخزن مستأجر على بُعد شارعين، وكان أجر زكي عن الرسم عشرة بالمئة. أرسلت شركة التأمين رسالة شكر إلى ناشري التقويم الفلكي. وحصل حارس الليل أخيراً على مصباح.' },
    },
  },
];
