/*
 * Detective Kawkab — compact survival cases, tier 1 (one clean contradiction).
 * 3 suspects · 3–4 hotspots · 1–2 proving clues. Schema: see ./index.js
 */

export const QUICK1 = [
  // ─────────── THE MIDNIGHT MUFFINS ───────────
  {
    id: 'q-muffins', tier: 1, e: '🧁',
    title: { en: 'The Midnight Muffins', ar: 'كعكات منتصف الليل' },
    setting: { en: 'The Bakery at Dawn', ar: 'المخبز عند الفجر' },
    bg: ['#fdf0dc', '#f2dab6'],
    briefing: {
      en: 'At dawn, Basil the baker found the bakery door unlocked and a whole tray of muffins gone. Only three people were near the shop that night. Detective Kawkab smelled cinnamon — and a lie.',
      ar: 'عند الفجر وجد الخبّاز باسل باب المخبز غير موصَد، وصينية كاملة من الكعك قد اختفت. ثلاثة فقط كانوا قرب المحل تلك الليلة. شمّ المحقق كوكب رائحة القرفة — ورائحة كذبة.',
    },
    hotspots: [
      { id: 'oven', e: '🔥', name: { en: 'Back oven room', ar: 'غرفة الفرن الخلفية' }, pos: { x: 22, y: 32 }, clueId: 'top-shelf' },
      { id: 'door', e: '🚪', name: { en: 'The shop door', ar: 'باب المحل' }, pos: { x: 62, y: 26 }, clueId: 'no-break' },
      { id: 'counter', e: '🧾', name: { en: 'Front counter', ar: 'منضدة المحل' }, pos: { x: 44, y: 66 }, empty: { en: 'Not a single crumb. A very tidy thief.', ar: 'ولا فتاتة واحدة. لصٌّ مرتّب جداً.' } },
      { id: 'street', e: '🚲', name: { en: 'The bicycle rack', ar: 'موقف الدرّاجات' }, pos: { x: 82, y: 60 }, clueId: 'bike-smell' },
    ],
    clues: [
      { id: 'top-shelf', e: '📌', name: { en: 'The secret shelf', ar: 'الرفّ السرّي' }, text: { en: 'The tray was kept on the top shelf of the back oven room — a detail Basil shares with almost no one.', ar: 'كانت الصينية على الرفّ الأعلى في غرفة الفرن الخلفية — تفصيلة لا يشاركها باسل إلا مع القليلين.' } },
      { id: 'no-break', e: '🔑', name: { en: 'No break-in', ar: 'لا اقتحام' }, text: { en: 'No lock was broken. Whoever entered used a key or found the door open.', ar: 'لم يُكسر أي قفل. من دخل استعمل مفتاحاً أو وجد الباب مفتوحاً.' } },
      { id: 'bike-smell', e: '🧁', name: { en: 'Cinnamon at the rack', ar: 'قرفة عند الموقف' }, text: { en: 'Strong cinnamon from a delivery bicycle. The basket is covered with a towel — and crumbs cling to the spokes.', ar: 'رائحة قرفة قوية من درّاجة توصيل. السلّة مغطاة بمنشفة — وفتات ملتصقة بأسوار العجلة.' } },
    ],
    suspects: [
      {
        id: 'basil', e: '👨‍🍳', name: { en: 'Basil the baker', ar: 'الخبّاز باسل' },
        role: { en: 'Owner. Locked up last night — or so he says.', ar: 'صاحب المحل. أقفل الباب ليلة أمس — أو هكذا يقول.' },
        report: {
          en: 'I locked up at nine and went home. The missing tray was on the top shelf in the back oven room — I tell almost nobody that. Only Salma and I have keys. Ziad waits outside for deliveries; he never comes in.',
          ar: 'أقفلتُ في التاسعة وعدتُ إلى البيت. الصينية المفقودة كانت على الرفّ الأعلى في غرفة الفرن الخلفية — لا أخبر بهذا إلا القليلين. أنا وسلمى فقط نملك المفاتيح. زياد ينتظر في الخارج للتوصيل؛ لا يدخل أبداً.',
        },
        questions: [
          { id: 'alibi', q: { en: 'Where were you last night?', ar: 'أين كنت الليلة الماضية؟' }, a: { en: 'I locked up at nine and went straight home to bed. My own muffins, stolen from my own shop!', ar: 'أقفلتُ المحل في التاسعة وذهبتُ إلى بيتي مباشرة للنوم. كعكاتي أنا، تُسرق من محلي أنا!' } },
          { id: 'keys', q: { en: 'Who has keys to the shop?', ar: 'من يملك مفاتيح المحل؟' }, a: { en: 'Me and Salma the cleaner. Ziad only ever waits at the door for the delivery baskets.', ar: 'أنا والمنظّفة سلمى. أما زياد فلا يتجاوز الباب، ينتظر سلال التوصيل فحسب.' } },
        ],
      },
      {
        id: 'salma', e: '🧹', name: { en: 'Salma the cleaner', ar: 'المنظّفة سلمى' },
        role: { en: 'Cleans the front shop every evening.', ar: 'تنظّف صالة المحل كل مساء.' },
        report: {
          en: 'I mopped the front shop until ten, then left. I never enter the oven room — flour ruins my mop. I pulled the door shut; Basil locks the back. I do not carry that key.',
          ar: 'مسحتُ صالة المحل حتى العاشرة ثم غادرت. لا أدخل غرفة الفرن أبداً — الطحين يفسد ممسحتي. سحبتُ الباب خلفي؛ باسل يقفل الخلف. أنا لا أحمل ذلك المفتاح.',
        },
        questions: [
          { id: 'alibi', q: { en: 'Where were you last night?', ar: 'أين كنتِ الليلة الماضية؟' }, a: { en: 'I mopped the front shop till ten, then left. I never go into the oven room — the flour ruins my mop.', ar: 'مسحتُ صالة المحل حتى العاشرة ثم غادرت. أنا لا أدخل غرفة الفرن أبداً — الطحين يفسد ممسحتي.' } },
          { id: 'door', q: { en: 'Did you lock the door behind you?', ar: 'هل أقفلتِ الباب خلفك؟' }, a: { en: 'I pulled it shut. Basil had already locked the back — I don’t carry the oven-room key at all.', ar: 'سحبتُه خلفي. باسل كان قد أقفل الخلف — أنا لا أحمل مفتاح غرفة الفرن أصلاً.' } },
        ],
      },
      {
        id: 'ziad', e: '🚴', name: { en: 'Ziad the delivery boy', ar: 'زياد عامل التوصيل' },
        role: { en: 'Comes at dawn for the delivery baskets.', ar: 'يأتي فجراً من أجل سلال التوصيل.' },
        report: {
          en: 'I got here at dawn, as always. I waited outside with my bicycle — I never step inside the shop. When Basil opened up, the tray was already gone. A shame, really.',
          ar: 'وصلتُ عند الفجر كعادتي. انتظرتُ في الخارج مع درّاجتي — لا أدخل المحل أبداً. حين فتح باسل، كانت الصينية قد اختفت أصلاً. يا خسارة، حقاً.',
        },
        questions: [
          { id: 'alibi', q: { en: 'When did you get here?', ar: 'متى وصلت إلى هنا؟' }, a: { en: 'Only at dawn — I never even stepped inside! A shame about the muffins on the top shelf, though.', ar: 'عند الفجر فقط — لم أدخل أصلاً! يا خسارة كعكات الرفّ الأعلى.' }, givesClue: 'slip' },
          { id: 'confront', needsClue: 'top-shelf', q: { en: 'Nobody was told WHERE the tray was. How do you know it was the top shelf?', ar: 'لم يُخبَر أحد أين كانت الصينية. كيف عرفت أنها على الرفّ الأعلى؟' }, a: { en: 'I… everyone knows bakers use top shelves! For… air. Warm air. Rises.', ar: 'أنا… الجميع يعرف أن الخبّازين يستعملون الرفوف العليا! بسبب… الهواء. الهواء الدافئ. يصعد.' }, reaction: { en: 'His bicycle basket, on inspection, smells strongly of muffins.', ar: 'سلّة درّاجته، عند الفحص، تفوح منها رائحة الكعك بقوة.' } },
        ],
      },
    ],
    solution: {
      culprit: 'ziad',
      evidence: ['bike-smell', 'top-shelf'],
      explanation: [
        { en: 'The tray was hidden on the top shelf in the back oven room — only someone inside could reach it.', ar: 'كانت الصينية على الرفّ الأعلى في غرفة الفرن الخلفية — لا يصل إليها إلا من دخل من الداخل.' },
        { en: 'Ziad says he never entered — yet his bicycle reeks of cinnamon and crumbs. Basil and Salma have keys; Ziad does not, unless he slipped in while the door was open.', ar: 'يقول زياد إنه لم يدخل — لكن درّاجته تفوح بالقرفة والفتات. باسل وسلمى يملكان مفاتيح؛ زياد لا يملك، إلا إذا تسلّل حين كان الباب مفتوحاً.' },
      ],
      epilogue: { en: 'The empty tray was in his bicycle basket, under a towel. Ziad works Saturdays for free now — quality control, no tasting.', ar: 'كانت الصينية الفارغة في سلّة درّاجته تحت منشفة. يعمل زياد الآن أيام السبت مجاناً — مراقبة جودة، دون تذوّق.' },
    },
  },

  // ─────────── THE GARDEN ALIBI ───────────
  {
    id: 'q-rainy-garden', tier: 1, e: '🌧️',
    title: { en: 'The Garden Alibi', ar: 'حجّة الحديقة' },
    setting: { en: 'Farid’s Street', ar: 'شارع فريد' },
    bg: ['#e4ecf4', '#cfdbe8'],
    briefing: {
      en: 'On Friday afternoon someone slipped into Farid’s yard and took his new drone. Detective Kawkab arrived with wet shoes and a dry notebook — it had been quite an afternoon of weather.',
      ar: 'بعد ظهر الجمعة تسلّل أحدهم إلى فناء فريد وأخذ طائرته المسيّرة الجديدة. وصل المحقق كوكب بحذاء مبلّل ودفتر جاف — فقد كان طقس الظهيرة حكاية بحد ذاتها.',
    },
    hotspots: [
      { id: 'sky', e: '🌧️', name: { en: 'The weather station', ar: 'محطة الأرصاد' }, pos: { x: 24, y: 26 }, clueId: 'rain' },
      { id: 'yard', e: '🏡', name: { en: 'Farid’s yard', ar: 'فناء فريد' }, pos: { x: 56, y: 60 }, clueId: 'mud' },
      { id: 'market', e: '🛒', name: { en: 'The market', ar: 'السوق' }, pos: { x: 84, y: 32 }, clueId: 'receipt' },
      { id: 'window', e: '📺', name: { en: 'Sami’s window', ar: 'نافذة سامي' }, pos: { x: 38, y: 74 }, empty: { en: 'Cartoon music drifts out. Two voices laugh along.', ar: 'موسيقى رسوم متحركة تتسرّب من الداخل. وصوتا ضحكٍ يرافقانها.' } },
    ],
    clues: [
      { id: 'rain', e: '🌧️', name: { en: 'Nonstop rain', ar: 'مطر بلا توقّف' }, text: { en: 'Heavy rain poured ALL Friday afternoon without a single break.', ar: 'هطل مطر غزير طوال ظهر الجمعة بلا توقّف.' } },
      { id: 'mud', e: '👣', name: { en: 'Muddy prints', ar: 'آثار موحلة' }, text: { en: 'Small muddy footprints cross Farid’s yard toward the hedge — pressed during the rain.', ar: 'آثار أقدام موحلة صغيرة تعبر فناء فريد نحو السياج — طُبعت أثناء المطر.' } },
      { id: 'receipt', e: '🧾', name: { en: 'Omar’s receipt', ar: 'إيصال عمر' }, text: { en: 'The market confirms it: Omar paid at the till repeatedly from noon to evening. He really was there.', ar: 'السوق يؤكد: عمر دفع عند الصندوق مراراً من الظهر حتى المساء. كان هناك فعلاً.' } },
      { id: 'nadia-claim', e: '🗣', name: { en: 'Nadia’s claim', ar: 'رواية نادية' }, text: { en: 'Nadia says she spent the WHOLE afternoon out in her garden, watering the flowers.', ar: 'تقول نادية إنها أمضت الظهيرة كلها في حديقتها تسقي الأزهار.' } },
    ],
    suspects: [
      {
        id: 'omar', e: '🛒', name: { en: 'Omar', ar: 'عمر' },
        role: { en: 'Neighbour. Loves gadgets, hates queues.', ar: 'جار. يحب الأجهزة ويكره الطوابير.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you on Friday afternoon?', ar: 'أين كنت بعد ظهر الجمعة؟' }, a: { en: 'At the market until evening — here’s my receipt. Ask the till lady, I argued about tomatoes for twenty minutes.', ar: 'في السوق حتى المساء — وهذا إيصال الشراء. اسأل البائعة، تجادلت معها عشرين دقيقة حول الطماطم.' } },
        ],
      },
      {
        id: 'nadia', e: '🌼', name: { en: 'Nadia', ar: 'نادية' },
        role: { en: 'Neighbour. Her garden faces Farid’s yard.', ar: 'جارة. حديقتها تواجه فناء فريد.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you on Friday afternoon?', ar: 'أين كنتِ بعد ظهر الجمعة؟' }, a: { en: 'I saw nothing. I was out in my garden watering the flowers the whole afternoon.', ar: 'لم أرَ شيئاً. كنت في حديقتي أسقي الأزهار طوال فترة الظهيرة.' }, givesClue: 'nadia-claim' },
          { id: 'confront', needsClue: 'rain', q: { en: 'You stood outside watering flowers… in a nonstop downpour?', ar: 'وقفتِ في الخارج تسقين الأزهار… تحت مطرٍ غزير متواصل؟' }, a: { en: '…It’s… important to keep a routine? Flowers don’t water themselves!', ar: '…من… من المهم الحفاظ على الروتين؟ الأزهار لا تسقي نفسها!' }, reaction: { en: 'Her watering can, by the door, is bone dry inside.', ar: 'إبريق السقاية عند بابها جافٌّ تماماً من الداخل.' } },
        ],
      },
      {
        id: 'sami', e: '📺', name: { en: 'Sami', ar: 'سامي' },
        role: { en: 'Neighbour’s kid. Cartoon marathon champion.', ar: 'ابن الجيران. بطل ماراثونات الرسوم المتحركة.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you on Friday afternoon?', ar: 'أين كنت بعد ظهر الجمعة؟' }, a: { en: 'Inside, watching cartoons with my sister. She controls the remote. It was a long afternoon.', ar: 'في البيت أشاهد الرسوم المتحركة مع أختي. هي تتحكم بجهاز التحكم. كانت ظهيرة طويلة.' } },
        ],
      },
    ],
    solution: {
      culprit: 'nadia',
      evidence: ['rain'],
      explanation: [
        { en: 'It rained hard all afternoon — nobody stands outside watering flowers in a downpour.', ar: 'كان المطر غزيراً طوال الظهيرة — لا أحد يقف في العاصفة ليسقي الأزهار.' },
        { en: 'Nadia invented an alibi without checking the weather. She was not doing what she claims — she was in Farid’s yard.', ar: 'اختلقت نادية حجّة دون أن تنتبه للطقس. لم تكن تفعل ما تدّعيه — بل كانت في فناء فريد.' },
      ],
      epilogue: { en: 'The drone was on her balcony, half-dismantled — she “only wanted to see how it worked.” Farid now gives weekly demonstrations. Attendance: one neighbour, very keen.', ar: 'كانت الطائرة على شرفتها نصف مفكّكة — «أرادت فقط أن تفهم كيف تعمل». يقدّم فريد الآن عرضاً أسبوعياً عنها. الحضور: جارة واحدة شديدة الحماس.' },
    },
  },

  // ─────────── FOOTPRINTS ON FRESH SNOW ───────────
  {
    id: 'q-fresh-snow', tier: 1, e: '❄️',
    title: { en: 'Footprints on Fresh Snow', ar: 'آثار على الثلج الطازج' },
    setting: { en: 'The Ski Lodge', ar: 'نُزل التزلّج' },
    bg: ['#eef4fa', '#d8e4f0'],
    briefing: {
      en: 'Someone raided the ski-lodge pantry during the night. Snow fell all evening and stopped exactly at midnight. Detective Kawkab buttoned his coat and read the ground like a book.',
      ar: 'أغار أحدهم على مخزن نُزل التزلّج أثناء الليل. تساقط الثلج طوال المساء وتوقّف عند منتصف الليل تماماً. أغلق المحقق كوكب أزرار معطفه وراح يقرأ الأرض كأنها كتاب.',
    },
    hotspots: [
      { id: 'path', e: '👣', name: { en: 'The snowy path', ar: 'الممرّ الثلجي' }, pos: { x: 40, y: 58 }, clueId: 'prints-top' },
      { id: 'rack', e: '🥾', name: { en: 'The boot rack', ar: 'رفّ الأحذية' }, pos: { x: 16, y: 32 }, clueId: 'boot-match' },
      { id: 'weather', e: '🌨️', name: { en: 'The weather log', ar: 'سجلّ الطقس' }, pos: { x: 72, y: 26 }, clueId: 'snow-time' },
      { id: 'pantry', e: '🥫', name: { en: 'The pantry', ar: 'المخزن' }, pos: { x: 86, y: 62 }, empty: { en: 'Missing: one wheel of cheese, two jars of honey, and all the biscuits.', ar: 'المفقود: قالب جبن، ومرطبانا عسل، وكل أصناف البسكويت.' } },
    ],
    clues: [
      { id: 'prints-top', e: '👣', name: { en: 'Prints on top', ar: 'آثار فوق الثلج' }, text: { en: 'A single line of boot-prints leads to the pantry door, pressed ON TOP of the smooth fresh snow.', ar: 'خطٌّ واحد من آثار الأحذية يقود إلى باب المخزن، مطبوعٌ فوق سطح الثلج الطازج الأملس.' } },
      { id: 'boot-match', e: '🥾', name: { en: 'The boot match', ar: 'تطابق الحذاء' }, text: { en: 'The prints match the caretaker’s boots exactly — same sole, same worn heel.', ar: 'الآثار تطابق حذاء الحارس تماماً — النعل ذاته، والكعب المتآكل ذاته.' } },
      { id: 'snow-time', e: '🌨️', name: { en: 'Snow until midnight', ar: 'ثلج حتى منتصف الليل' }, text: { en: 'The log is precise: snow fell without pause all evening and stopped exactly at midnight. Anything printed earlier would be buried.', ar: 'السجلّ دقيق: تساقط الثلج بلا توقف طوال المساء وتوقّف عند منتصف الليل تماماً. أي أثر أقدم كان سيُدفن.' } },
    ],
    suspects: [
      {
        id: 'adel', e: '🧔', name: { en: 'Adel the caretaker', ar: 'الحارس عادل' },
        role: { en: 'Keeps the lodge — and the pantry keys.', ar: 'يرعى النُّزل — ويحمل مفاتيح المخزن.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you last night?', ar: 'أين كنت الليلة الماضية؟' }, a: { en: 'In my cabin since supper at nine — I never once went out. Too cold for honest men.', ar: 'في كوخي منذ العشاء في التاسعة — لم أخرج ولا مرة. البرد لا يطيقه الشرفاء.' } },
          { id: 'confront', needsClue: 'prints-top', q: { en: 'Your boot-prints sit ON TOP of snow that only stopped at midnight.', ar: 'آثار حذائك مطبوعة فوق ثلجٍ لم يتوقف إلا عند منتصف الليل.' }, a: { en: '…Maybe someone borrowed my boots! While I slept! Thieves are very quiet these days.', ar: '…ربما استعار أحدهم حذائي! وأنا نائم! اللصوص هادئون جداً هذه الأيام.' }, reaction: { en: 'His boots stand by his bed — still wet, drying on yesterday’s newspaper.', ar: 'حذاؤه قرب سريره — ما يزال مبلّلاً، يجفّ على جريدة الأمس.' } },
        ],
      },
      {
        id: 'guest', e: '🎿', name: { en: 'Mira the ski guest', ar: 'النزيلة ميرا' },
        role: { en: 'Room 4. Complains about the biscuit shortage.', ar: 'الغرفة ٤. تشتكي من نقص البسكويت.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you last night?', ar: 'أين كنتِ الليلة الماضية؟' }, a: { en: 'Asleep by ten — skiing all day flattens you. I heard the wind, nothing else.', ar: 'نمت قبل العاشرة — التزلج طوال اليوم يُنهك تماماً. سمعت الريح، لا أكثر.' } },
          { id: 'boots', q: { en: 'Your boots?', ar: 'حذاؤك؟' }, a: { en: 'Rental skis, size 38, dainty. Those monster prints outside are twice my foot.', ar: 'زلاجات مستأجرة، مقاس ٣٨، أنيقة. تلك الآثار الضخمة في الخارج ضعف قدمي.' } },
        ],
      },
      {
        id: 'cook', e: '🍳', name: { en: 'Fares the cook', ar: 'الطاهي فارس' },
        role: { en: 'Guards his pantry inventory jealously.', ar: 'يحرس جرد مخزنه بغيرة شديدة.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you last night?', ar: 'أين كنت الليلة الماضية؟' }, a: { en: 'Kitchen till eleven, prepping dough, then straight to bed. I REPORTED the missing cheese, remember?', ar: 'في المطبخ حتى الحادية عشرة أجهّز العجين، ثم إلى السرير مباشرة. أنا من أبلغ عن الجبن المفقود أصلاً، أتذكر؟' } },
        ],
      },
    ],
    solution: {
      culprit: 'adel',
      evidence: ['prints-top', 'boot-match'],
      explanation: [
        { en: 'Snow fell until midnight. Any prints made earlier would have been buried — prints ON TOP were made AFTER midnight.', ar: 'الثلج تساقط حتى منتصف الليل، فأي آثار قبل ذلك كانت ستُدفن. الآثار فوق الثلج صُنعت بعد منتصف الليل.' },
        { en: 'They match Adel’s boots — so his “in my cabin since nine” story collapses.', ar: 'وهي تطابق حذاء عادل — فتنهار روايته «في كوخي منذ التاسعة».' },
      ],
      epilogue: { en: 'The cheese, the honey and most of the biscuits were under Adel’s bed. “Night shifts make a man hungry,” he sighed. He now signs a pantry ledger — supervised by the cook, who enjoys it enormously.', ar: 'كان الجبن والعسل ومعظم البسكويت تحت سرير عادل. تنهّد: «مناوبات الليل تجوّع الرجل». صار يوقّع الآن على سجلّ للمخزن — بإشراف الطاهي الذي يستمتع بذلك أيّما استمتاع.' },
    },
  },

  // ─────────── FIFTEEN DARK MINUTES ───────────
  {
    id: 'q-dark-storeroom', tier: 1, e: '🔦',
    title: { en: 'Fifteen Dark Minutes', ar: 'خمس عشرة دقيقة من الظلام' },
    setting: { en: 'The Ice-Cream Shop', ar: 'محل المثلّجات' },
    bg: ['#fdeef2', '#f4d8e0'],
    briefing: {
      en: 'During a fifteen-minute power cut, the money box vanished from the ice-cream shop counter. Three workers were inside — and all three have stories about the dark. Detective Kawkab ordered a scoop of pistachio and got to work.',
      ar: 'أثناء انقطاع الكهرباء لخمس عشرة دقيقة، اختفى صندوق النقود من على منضدة محل المثلّجات. كان في الداخل ثلاثة عمّال — ولكلٍّ منهم حكاية عن الظلام. طلب المحقق كوكب مغرفة فستق وباشر العمل.',
    },
    hotspots: [
      { id: 'fuse', e: '⚡', name: { en: 'The fuse box', ar: 'علبة الكهرباء' }, pos: { x: 18, y: 30 }, clueId: 'blackout' },
      { id: 'storeroom', e: '📦', name: { en: 'The storeroom', ar: 'المخزن' }, pos: { x: 74, y: 30 }, clueId: 'no-window' },
      { id: 'counter', e: '🍦', name: { en: 'The counter', ar: 'المنضدة' }, pos: { x: 46, y: 62 }, empty: { en: 'A clean rectangle in the frost marks where the money box stood.', ar: 'مستطيل نظيف وسط الصقيع يحدّد مكان صندوق النقود.' } },
      { id: 'freezer', e: '🧊', name: { en: 'The freezer', ar: 'المجمّدة' }, pos: { x: 84, y: 66 }, empty: { en: 'Shut tight. Not a drop melted — someone really did hold it closed.', ar: 'مغلقة بإحكام. لم تذب قطرة — أحدهم أبقاها مغلقة فعلاً.' } },
    ],
    clues: [
      { id: 'blackout', e: '🌑', name: { en: 'Total blackout', ar: 'ظلام تامّ' }, text: { en: 'The cut blacked out the whole block for fifteen minutes. No streetlight, no glow — nothing.', ar: 'الانقطاع أظلم الحيّ كله خمس عشرة دقيقة. لا إنارة شوارع ولا وهج — لا شيء.' } },
      { id: 'no-window', e: '🚫', name: { en: 'The windowless room', ar: 'الغرفة بلا نوافذ' }, text: { en: 'The storeroom has no windows at all. In a blackout it is pitch dark inside.', ar: 'المخزن بلا نوافذ إطلاقاً. في انقطاع الكهرباء يكون الظلام فيه دامساً.' } },
      { id: 'walid-claim', e: '🗣', name: { en: 'Walid’s claim', ar: 'رواية وليد' }, text: { en: 'Walid says he spent the whole fifteen minutes in the storeroom “reading box labels for inventory” — and mentions no torch.', ar: 'يقول وليد إنه أمضى الدقائق الخمس عشرة كلها في المخزن «يقرأ ملصقات الصناديق للجرد» — ولم يذكر أي مصباح.' } },
    ],
    suspects: [
      {
        id: 'tarek', e: '🧊', name: { en: 'Tarek', ar: 'طارق' },
        role: { en: 'Freezer guardian. Takes melting personally.', ar: 'حارس المجمّدة. يعتبر الذوبان إهانة شخصية.' },
        questions: [
          { id: 'alibi', q: { en: 'What did you do during the cut?', ar: 'ماذا فعلت أثناء الانقطاع؟' }, a: { en: 'I held the freezer shut the whole time so nothing would melt. I never moved. My arms still ache.', ar: 'أمسكتُ باب المجمّدة مغلقاً طوال الوقت كي لا يذوب شيء. لم أتحرّك. ذراعاي تؤلمانني حتى الآن.' } },
        ],
      },
      {
        id: 'dina', e: '📱', name: { en: 'Dina', ar: 'دينا' },
        role: { en: 'Front of shop. Fast with her phone torch.', ar: 'موظفة الصالة. سريعة في إشعال مصباح هاتفها.' },
        questions: [
          { id: 'alibi', q: { en: 'What did you do during the cut?', ar: 'ماذا فعلتِ أثناء الانقطاع؟' }, a: { en: 'I switched on my phone torch and watched the front door so no customer would trip. Nobody came in or out.', ar: 'أضأتُ مصباح هاتفي وراقبتُ الباب الأمامي كي لا يتعثر أحد. لم يدخل أحد ولم يخرج.' } },
        ],
      },
      {
        id: 'walid', e: '📦', name: { en: 'Walid', ar: 'وليد' },
        role: { en: 'Stockroom duty. Very thorough, apparently.', ar: 'مسؤول المخزون. دقيق جداً، على ما يبدو.' },
        questions: [
          { id: 'alibi', q: { en: 'What did you do during the cut?', ar: 'ماذا فعلت أثناء الانقطاع؟' }, a: { en: 'I was in the storeroom the whole fifteen minutes, reading the labels on the boxes for inventory. Very calm, very productive.', ar: 'كنت في المخزن طوال الدقائق الخمس عشرة، أقرأ ملصقات الصناديق للجرد. هدوء تامّ وإنتاجية عالية.' }, givesClue: 'walid-claim' },
          { id: 'confront', needsClue: 'no-window', q: { en: 'The storeroom has no windows. You read labels… in total darkness?', ar: 'المخزن بلا نوافذ. قرأت الملصقات… في ظلام دامس؟' }, a: { en: 'I have… very good eyes? Carrots. Lots of carrots.', ar: 'عيناي… قويتان جداً؟ الجزر. آكل جزراً كثيراً.' }, reaction: { en: 'Detective Kawkab writes one word in his notebook: “carrots.”', ar: 'يكتب المحقق كوكب كلمة واحدة في دفتره: «جزر».' } },
        ],
      },
    ],
    solution: {
      culprit: 'walid',
      evidence: ['no-window', 'walid-claim'],
      explanation: [
        { en: 'A windowless storeroom in a blackout is pitch dark — nobody can read labels in total darkness, and he mentions no torch.', ar: 'مخزن بلا نوافذ أثناء انقطاع الكهرباء ظلامٌ دامس — لا أحد يقرأ الملصقات في العتمة، وهو لم يذكر أي مصباح.' },
        { en: 'Walid invented a quiet task to explain those fifteen minutes — minutes he actually spent at the counter, in the dark, with the money box.', ar: 'اختلق وليد مهمّة هادئة ليبرّر تلك الدقائق — وهي دقائق أمضاها فعلاً عند المنضدة، في العتمة، مع صندوق النقود.' },
      ],
      epilogue: { en: 'The money box was inside a carton labelled “WAFER CONES — DO NOT TOUCH”. Walid confessed before the pistachio scoop melted. The shop now keeps a torch on every shelf — his idea, ironically.', ar: 'كان صندوق النقود داخل كرتونة كُتب عليها «أقماع ويفر — ممنوع اللمس». اعترف وليد قبل أن تذوب مغرفة الفستق. صار المحل يضع مصباحاً على كل رفّ — والفكرة فكرته، يا للمفارقة.' },
    },
  },

  // ─────────── THE DOG THAT DIDN’T BARK ───────────
  {
    id: 'q-silent-dog', tier: 1, e: '🐕',
    title: { en: 'The Dog That Didn’t Bark', ar: 'الكلب الذي لم ينبح' },
    setting: { en: 'The Stable Yard', ar: 'باحة الإسطبل' },
    bg: ['#f3ecdd', '#e4d7bd'],
    briefing: {
      en: 'At night, someone took the prize saddle from the stable. Rex the guard dog barks furiously at every stranger — yet that whole night, not a sound. Detective Kawkab scratched Rex behind the ear and listened to the silence.',
      ar: 'ليلاً، أخذ أحدهم السرج الثمين من الإسطبل. الكلب الحارس ريكس ينبح بشراسة على كل غريب — ومع ذلك لم يصدر عنه صوت تلك الليلة. حكّ المحقق كوكب أذن ريكس وأصغى إلى الصمت.',
    },
    hotspots: [
      { id: 'rex', e: '🐕', name: { en: 'Rex’s kennel', ar: 'بيت ريكس' }, pos: { x: 26, y: 60 }, clueId: 'rex-fine' },
      { id: 'stable', e: '🐎', name: { en: 'The stable', ar: 'الإسطبل' }, pos: { x: 56, y: 30 }, clueId: 'no-force' },
      { id: 'farmhouse', e: '🏠', name: { en: 'The farmhouse', ar: 'بيت المزرعة' }, pos: { x: 84, y: 58 }, clueId: 'no-bark' },
      { id: 'gate', e: '🚧', name: { en: 'The yard gate', ar: 'بوابة الباحة' }, pos: { x: 14, y: 28 }, empty: { en: 'Squeaks loudly when opened. The horses confirm nothing.', ar: 'تصرّ بصوت عالٍ عند فتحها. والخيول لا تؤكد شيئاً.' } },
    ],
    clues: [
      { id: 'rex-fine', e: '🐕', name: { en: 'Rex is fine', ar: 'ريكس بخير' }, text: { en: 'Rex was awake and healthy all night — he ate his breakfast happily in the morning. Nobody drugged this dog.', ar: 'كان ريكس مستيقظاً وسليماً طوال الليل — وأكل فطوره بشهية في الصباح. لم يخدّر أحدٌ هذا الكلب.' } },
      { id: 'no-force', e: '🚪', name: { en: 'No forced entry', ar: 'لا اقتحام' }, text: { en: 'The stable door was opened cleanly — whoever came knew the latch trick.', ar: 'فُتح باب الإسطبل بسلاسة — من دخل يعرف حيلة المزلاج.' } },
      { id: 'no-bark', e: '🤫', name: { en: 'The silent night', ar: 'الليلة الصامتة' }, text: { en: 'The farmer sleeps lightly and heard NOTHING all night. Rex barks at every stranger — the visitor was no stranger.', ar: 'المزارع خفيف النوم ولم يسمع شيئاً طوال الليل. ريكس ينبح على كل غريب — إذاً الزائر لم يكن غريباً.' } },
      { id: 'yara-bond', e: '🦴', name: { en: 'Yara & Rex', ar: 'يارا وريكس' }, text: { en: 'Yara feeds Rex every single night. He adores her — and never barks at her.', ar: 'يارا تطعم ريكس كل ليلة. إنه يحبها كثيراً — ولا ينبح عليها أبداً.' } },
    ],
    suspects: [
      {
        id: 'salesman', e: '🧳', name: { en: 'The travelling salesman', ar: 'البائع المتجوّل' },
        role: { en: 'Passed by once this week, selling brushes.', ar: 'مرّ مرة واحدة هذا الأسبوع يبيع الفراشي.' },
        questions: [
          { id: 'alibi', q: { en: 'When were you at the farm?', ar: 'متى كنت عند المزرعة؟' }, a: { en: 'Tuesday, once, selling brushes. That dog nearly took my trousers off. I kept my distance after that, believe me.', ar: 'الثلاثاء، مرة واحدة، أبيع الفراشي. كاد ذلك الكلب يمزّق سروالي. بقيت بعيداً بعدها، صدّقني.' } },
        ],
      },
      {
        id: 'mail', e: '📬', name: { en: 'The new mail-carrier', ar: 'ساعي البريد الجديد' },
        role: { en: 'Started this route only this week.', ar: 'بدأ العمل على هذا الخط هذا الأسبوع فقط.' },
        questions: [
          { id: 'alibi', q: { en: 'Does Rex know you?', ar: 'هل يعرفك ريكس؟' }, a: { en: 'Know me? He announces me to the whole valley every morning. I throw the letters from the gate and RUN.', ar: 'يعرفني؟ إنه يعلن وصولي للوادي كله كل صباح. أرمي الرسائل من البوابة وأركض.' } },
        ],
      },
      {
        id: 'yara', e: '🧑‍🌾', name: { en: 'Yara the stable-hand', ar: 'يارا عاملة الإسطبل' },
        role: { en: 'Works the stable by day. Feeds Rex by night.', ar: 'تعمل في الإسطبل نهاراً. وتطعم ريكس ليلاً.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you last night?', ar: 'أين كنتِ الليلة الماضية؟' }, a: { en: 'Home, asleep. I feed Rex every single night before I leave — he adores me. Ask him!', ar: 'في البيت نائمة. أنا أطعم ريكس كل ليلة قبل أن أغادر — إنه يحبني كثيراً. اسأله!' }, givesClue: 'yara-bond' },
          { id: 'confront', needsClue: 'no-bark', q: { en: 'Rex barks at every stranger — and last night he never made a sound. Who could walk past him in silence?', ar: 'ريكس ينبح على كل غريب — والليلة الماضية لم يُصدر صوتاً. من يستطيع المرور أمامه بصمت؟' }, a: { en: '…Lots of people! The horses like me— I mean, him! Everyone likes him!', ar: '…كثيرون! الخيول تحبني— أقصد تحبه! الجميع يحبه!' }, reaction: { en: 'In her bag: a brand-new saddle-polishing cloth, still in its wrapper.', ar: 'في حقيبتها: قطعة قماش جديدة لتلميع السروج، ما تزال في غلافها.' } },
        ],
      },
    ],
    solution: {
      culprit: 'yara',
      evidence: ['no-bark', 'yara-bond'],
      explanation: [
        { en: 'Rex barks at every stranger, and he was awake all night. A silent dog means the visitor was no stranger.', ar: 'ريكس ينبح على كل غريب، وكان مستيقظاً طوال الليل. صمت الكلب يعني أن الزائر لم يكن غريباً.' },
        { en: 'The salesman and the brand-new mail-carrier are strangers to Rex. Only Yara, who feeds him nightly, could walk in without a single bark.', ar: 'البائع وساعي البريد الجديد غريبان على ريكس. وحدها يارا التي تطعمه كل ليلة تستطيع الدخول دون نبحة واحدة.' },
      ],
      epilogue: { en: 'The saddle was in Yara’s shed, already half-polished. She’d dreamed of riding in the spring parade “just once”. The farmer, unexpectedly, said yes — after a season of unpaid mucking-out. Rex supervised every shift.', ar: 'كان السرج في سقيفة يارا، نصف ملمّع أصلاً. كانت تحلم بالمشاركة في موكب الربيع «مرة واحدة فقط». ووافق المزارع، على غير المتوقع — بعد موسمٍ من تنظيف الإسطبل دون أجر. وأشرف ريكس على كل مناوبة.' },
    },
  },

  // ─────────── TOO PERFECT AN ALIBI ───────────
  {
    id: 'q-secret-time', tier: 1, e: '⌚',
    title: { en: 'Too Perfect an Alibi', ar: 'حجّة أدقّ من اللازم' },
    setting: { en: 'The School Hall', ar: 'قاعة المدرسة' },
    bg: ['#eaf0e4', '#d6e2cc'],
    briefing: {
      en: 'The school trophy vanished on Tuesday. The headmaster announced only that it disappeared “sometime during the day” — the camera’s timestamp was kept strictly secret. Detective Kawkab liked secrets: they catch people.',
      ar: 'اختفت كأس المدرسة يوم الثلاثاء. أعلن المدير فقط أنها اختفت «في وقتٍ ما خلال اليوم» — وبقي توقيت الكاميرا سرّاً تامّاً. أحبّ المحقق كوكب الأسرار: فهي تُمسك الناس.',
    },
    hotspots: [
      { id: 'camera', e: '🎥', name: { en: 'The camera log', ar: 'سجلّ الكاميرا' }, pos: { x: 20, y: 28 }, clueId: 'timestamp' },
      { id: 'cabinet', e: '🏆', name: { en: 'The trophy cabinet', ar: 'خزانة الكأس' }, pos: { x: 52, y: 58 }, clueId: 'no-force2' },
      { id: 'board', e: '📋', name: { en: 'The noticeboard', ar: 'لوحة الإعلانات' }, pos: { x: 80, y: 30 }, clueId: 'vague' },
      { id: 'gym', e: '📖', name: { en: 'The library desk', ar: 'مكتب المكتبة' }, pos: { x: 78, y: 68 }, clueId: 'library-log' },
    ],
    clues: [
      { id: 'timestamp', e: '🎥', name: { en: 'The secret timestamp', ar: 'التوقيت السرّي' }, text: { en: 'The security log shows the trophy was taken at exactly 2:35 PM. The school was never told the hour.', ar: 'سجلّ الكاميرا يُظهر أن الكأس أُخذت في الساعة ٢:٣٥ مساءً. لم تُخبَر المدرسة بالساعة.' } },
      { id: 'no-force2', e: '🗄️', name: { en: 'The unforced cabinet', ar: 'الخزانة السليمة' }, text: { en: 'The cabinet was opened with its own small key, kept in the staff room.', ar: 'فُتحت الخزانة بمفتاحها الصغير المحفوظ في غرفة المعلمين.' } },
      { id: 'vague', e: '📋', name: { en: 'The vague announcement', ar: 'الإعلان الغامض' }, text: { en: 'All the school was told: the trophy vanished “sometime during the day”. No hour. No minute.', ar: 'كل ما قيل للمدرسة: الكأس اختفت «في وقتٍ ما خلال اليوم». لا ساعة ولا دقيقة.' } },
      { id: 'library-log', e: '📖', name: { en: 'Library sign-out sheet', ar: 'سجلّ خروج المكتبة' }, text: { en: 'Layla signed out of the library at 1:50 PM on Tuesday. The trophy was taken at 2:35 — she was not inside.', ar: 'سجّلت ليلى خروجها من المكتبة الساعة ١:٥٠ ظهر الثلاثاء. أُخذت الكأس في ٢:٣٥ — لم تكن داخل المكتبة.' } },
    ],
    suspects: [
      {
        id: 'nour', e: '🏀', name: { en: 'Nour', ar: 'نور' },
        role: { en: 'Team captain. The trophy has her name on it twice.', ar: 'قائدة الفريق. اسمها محفور على الكأس مرتين.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you on Tuesday?', ar: 'أين كنتِ يوم الثلاثاء؟' }, a: { en: 'Tuesday? I had basketball practice till five. Coach counts us every ten minutes like sheep.', ar: 'الثلاثاء؟ كان عندي تدريب كرة السلة حتى الخامسة. المدرّب يعدّنا كل عشر دقائق كالخراف.' } },
        ],
      },
      {
        id: 'sami', e: '🏠', name: { en: 'Sami', ar: 'سامي' },
        role: { en: 'Goes straight home. Always, he insists.', ar: 'يعود إلى البيت مباشرة. دائماً، كما يصرّ.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you on Tuesday?', ar: 'أين كنت يوم الثلاثاء؟' }, a: { en: 'I went straight home after class, ask my mum. She made lentil soup. I have witnesses to the soup.', ar: 'ذهبت إلى البيت مباشرة بعد الدرس، اسألوا أمي. طبخت شوربة عدس. لديّ شهود على الشوربة.' } },
        ],
      },
      {
        id: 'layla', e: '📚', name: { en: 'Layla', ar: 'ليلى' },
        role: { en: 'Library regular. Very precise about everything.', ar: 'من روّاد المكتبة. دقيقة جداً في كل شيء.' },
        report: {
          en: 'Tuesday afternoon I was in the library from lunch until the bell. Quiet, productive, nowhere near the trophy cabinet. I dislike drama.',
          ar: 'بعد ظهر الثلاثاء كنت في المكتبة من الغداء حتى جرس الخروج. هادئة، منجزة، بعيدة تماماً عن خزانة الكأس. أكره الضجيج.',
        },
        questions: [
          { id: 'alibi', q: { en: 'Where were you on Tuesday?', ar: 'أين كنتِ يوم الثلاثاء؟' }, a: { en: 'At 2:35, when it was taken, I was in the library. You can note that down.', ar: 'في الساعة ٢:٣٥، حين أُخذت الكأس، كنت في المكتبة. يمكنك تدوين ذلك.' }, givesClue: 'layla-slip' },
          { id: 'confront', needsClue: 'timestamp', q: { en: 'The 2:35 timestamp was a strict secret. How did you know the exact minute?', ar: 'توقيت ٢:٣٥ كان سرّاً تامّاً. كيف عرفتِ الدقيقة بالضبط؟' }, a: { en: 'I… heard it somewhere. People talk! Clocks talk! I mean— people.', ar: 'أنا… سمعته في مكانٍ ما. الناس يتكلمون! الساعات تتكلم! أقصد— الناس.' }, reaction: { en: 'The librarian, consulted, has no record of Layla on Tuesday at all.', ar: 'أمينة المكتبة، عند سؤالها، لا تذكر ليلى يوم الثلاثاء إطلاقاً.' } },
        ],
      },
    ],
    solution: {
      culprit: 'layla',
      evidence: ['timestamp', 'library-log'],
      explanation: [
        { en: 'The trophy was taken at 2:35 PM — but the school was only told “sometime during the day”.', ar: 'أُخذت الكأس في ٢:٣٥ مساءً — لكن المدرسة قيل لها «في وقتٍ ما خلال اليوم» فقط.' },
        { en: 'Layla claims she was in the library all afternoon — yet she signed out at 1:50, before the theft. Her story does not fit the facts.', ar: 'تدّعي ليلى أنها كانت في المكتبة طوال الظهيرة — لكنها خرجت الساعة ١:٥٠، قبل السرقة. روايتها لا تطابق الوقائع.' },
      ],
      epilogue: { en: 'The trophy was in Layla’s locker, wrapped in a scarf. She only wanted to photograph it for the yearbook “properly, with good lighting.” The headmaster granted her exactly that — as official photographer, under supervision, forever.', ar: 'كانت الكأس في خزانة ليلى ملفوفة بوشاح. أرادت فقط تصويرها للكتاب السنوي «تصويراً لائقاً بإضاءة جيدة». ومنحها المدير ذلك بالضبط — مصوّرةً رسمية، تحت الإشراف، إلى الأبد.' },
    },
  },
];
