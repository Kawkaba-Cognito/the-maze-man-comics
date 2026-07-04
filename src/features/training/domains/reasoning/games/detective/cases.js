/*
 * Detective — authored case library. Every case is a self-contained deduction
 * riddle with its own story: read the facts and testimony, find the flaw, and
 * answer. Nothing is template-generated; each solution rests on a real piece
 * of reasoning (a physical impossibility, a self-betraying detail, statement
 * logic, timeline arithmetic…).
 *
 * Schema:
 *   id       unique slug
 *   tier     1 easy · 2 medium · 3 hard
 *   e        case icon
 *   title/intro/q      {en, ar}
 *   facts    [{e, en, ar}]          — what the detective establishes
 *   wits     [{e, name:{en,ar}, en, ar}] — testimony (may be empty)
 *   options  [{id, e, en, ar}]      — the possible answers
 *   answer   option id
 *   key      {in:'wits'|'facts', i} — the item that cracks the case (hint target)
 *   sol      [{en, ar}]             — the reasoning chain, step by step
 */

export const RIDDLES = [
  // ═══════════════════════ TIER 1 ═══════════════════════
  {
    id: 'muffins', tier: 1, e: '🧁',
    title: { en: 'The Midnight Muffins', ar: 'كعكات منتصف الليل' },
    intro: { en: 'At dawn, Basil the baker found the bakery door unlocked and a whole tray of muffins gone. Only three people were near the shop that night.', ar: 'عند الفجر وجد الخبّاز باسل باب المخبز غير موصَد، وصينية كاملة من الكعك قد اختفت. ثلاثة فقط كانوا قرب المحل تلك الليلة.' },
    facts: [
      { e: '📌', en: 'The tray was kept on the TOP shelf of the back oven room — the detective told this detail to no one.', ar: 'كانت الصينية على الرفّ الأعلى في غرفة الفرن الخلفية — ولم يُخبر المحقّق أحداً بهذه التفصيلة.' },
      { e: '🔑', en: 'No lock was broken. Whoever entered used a key or found the door open.', ar: 'لم يُكسر أي قفل. من دخل استعمل مفتاحاً أو وجد الباب مفتوحاً.' },
    ],
    wits: [
      { e: '👨‍🍳', name: { en: 'Basil the baker', ar: 'الخبّاز باسل' }, en: '“I locked up at nine and went straight home to bed.”', ar: '«أقفلتُ المحل في التاسعة وذهبتُ إلى بيتي مباشرة للنوم.»' },
      { e: '🧹', name: { en: 'Salma the cleaner', ar: 'المنظّفة سلمى' }, en: '“I mopped the front shop till ten, then left. I never go into the oven room.”', ar: '«مسحتُ صالة المحل حتى العاشرة ثم غادرت. أنا لا أدخل غرفة الفرن أبداً.»' },
      { e: '🚴', name: { en: 'Ziad the delivery boy', ar: 'زياد عامل التوصيل' }, en: '“I only came at dawn — I never even stepped inside! A shame about the muffins on the top shelf, though.”', ar: '«أنا جئت عند الفجر فقط — لم أدخل أصلاً! يا خسارة كعكات الرفّ الأعلى.»' },
    ],
    q: { en: 'Who took the muffins?', ar: 'من أخذ الكعكات؟' },
    options: [
      { id: 'basil', e: '👨‍🍳', en: 'Basil the baker', ar: 'الخبّاز باسل' },
      { id: 'salma', e: '🧹', en: 'Salma the cleaner', ar: 'المنظّفة سلمى' },
      { id: 'ziad', e: '🚴', en: 'Ziad the delivery boy', ar: 'زياد عامل التوصيل' },
    ],
    answer: 'ziad', key: { in: 'wits', i: 2 },
    sol: [
      { en: 'Nobody was told where the muffins were kept — not even which room, let alone which shelf.', ar: 'لم يُخبَر أحد أين كانت الكعكات — لا الغرفة ولا الرفّ.' },
      { en: 'Ziad claims he never stepped inside, yet he knows they were on the TOP shelf. Only someone who was in the oven room could know that.', ar: 'يدّعي زياد أنه لم يدخل، لكنه يعرف أنها كانت على الرفّ الأعلى. لا يعرف ذلك إلا من دخل غرفة الفرن.' },
    ],
  },
  {
    id: 'rainy-garden', tier: 1, e: '🌧️',
    title: { en: 'The Garden Alibi', ar: 'حجّة الحديقة' },
    intro: { en: 'On Friday afternoon someone slipped into Farid’s yard and took his new drone. Farid asked the neighbours what they were doing that afternoon.', ar: 'بعد ظهر الجمعة تسلّل أحدهم إلى فناء فريد وأخذ طائرته المسيّرة الجديدة. سأل فريد جيرانه ماذا كانوا يفعلون بعد الظهر.' },
    facts: [
      { e: '🌧️', en: 'Heavy rain poured ALL Friday afternoon without a single break.', ar: 'هطل مطر غزير طوال ظهر الجمعة بلا توقّف.' },
    ],
    wits: [
      { e: '🛒', name: { en: 'Omar', ar: 'عمر' }, en: '“I was at the market until evening — here’s my receipt.”', ar: '«كنت في السوق حتى المساء — وهذا إيصال الشراء.»' },
      { e: '🌼', name: { en: 'Nadia', ar: 'نادية' }, en: '“I saw nothing. I was out in my garden watering the flowers the whole afternoon.”', ar: '«لم أرَ شيئاً. كنت في حديقتي أسقي الأزهار طوال فترة الظهيرة.»' },
      { e: '📺', name: { en: 'Sami', ar: 'سامي' }, en: '“I stayed inside watching cartoons with my sister.”', ar: '«بقيت في البيت أشاهد الرسوم المتحركة مع أختي.»' },
    ],
    q: { en: 'Whose story cannot be true?', ar: 'روايةُ مَن لا يمكن أن تكون صحيحة؟' },
    options: [
      { id: 'omar', e: '🛒', en: 'Omar', ar: 'عمر' },
      { id: 'nadia', e: '🌼', en: 'Nadia', ar: 'نادية' },
      { id: 'sami', e: '📺', en: 'Sami', ar: 'سامي' },
    ],
    answer: 'nadia', key: { in: 'wits', i: 1 },
    sol: [
      { en: 'It rained hard all afternoon — nobody stands outside watering flowers in a downpour.', ar: 'كان المطر غزيراً طوال الظهيرة — لا أحد يقف في العاصفة ليسقي الأزهار.' },
      { en: 'Nadia invented an alibi without checking the weather. She was not doing what she claims — so what WAS she doing in Farid’s yard?', ar: 'اختلقت نادية حجّة دون أن تنتبه للطقس. لم تكن تفعل ما تدّعيه — فماذا كانت تفعل إذاً في فناء فريد؟' },
    ],
  },
  {
    id: 'glass', tier: 1, e: '🪟',
    title: { en: 'Glass on the Pavement', ar: 'زجاج على الرصيف' },
    intro: { en: 'The shop owner reported: “Thieves smashed my window from the street last night and emptied the till!” The detective examined the scene carefully.', ar: 'أبلغ صاحب المتجر: «حطّم اللصوص نافذتي من الشارع ليلة أمس وأفرغوا صندوق النقود!» فحص المحقّق المكان بعناية.' },
    facts: [
      { e: '🪟', en: 'Every piece of broken glass lay OUTSIDE, on the pavement.', ar: 'كل شظايا الزجاج كانت في الخارج، على الرصيف.' },
      { e: '💰', en: 'The till was opened with its own key — nothing was forced.', ar: 'فُتح صندوق النقود بمفتاحه الأصلي — لا أثر لأي كسر.' },
    ],
    wits: [],
    q: { en: 'What really happened?', ar: 'ما الذي حدث فعلاً؟' },
    options: [
      { id: 'thief', e: '🦹', en: 'A thief broke in from the street', ar: 'اقتحم لصٌّ المحل من الشارع' },
      { id: 'owner', e: '🕴️', en: 'The owner staged the robbery himself', ar: 'صاحب المحل فبرك السرقة بنفسه' },
      { id: 'wind', e: '💨', en: 'The wind broke the window', ar: 'الريح كسرت النافذة' },
    ],
    answer: 'owner', key: { in: 'facts', i: 0 },
    sol: [
      { en: 'A window smashed from the street throws its glass INTO the shop. Glass on the pavement means the window was broken from the INSIDE.', ar: 'النافذة التي تُكسر من الشارع يتناثر زجاجها إلى داخل المحل. الزجاج على الرصيف يعني أنها كُسرت من الداخل.' },
      { en: 'Add the till opened with its own key: no outsider did this. The owner faked a break-in.', ar: 'أضف إلى ذلك أن الصندوق فُتح بمفتاحه: لا غريب فعلها. صاحب المحل مثّل السرقة.' },
    ],
  },
  {
    id: 'fresh-snow', tier: 1, e: '❄️',
    title: { en: 'Footprints on Fresh Snow', ar: 'آثار على الثلج الطازج' },
    intro: { en: 'Someone raided the ski-lodge pantry during the night. Snow fell all evening and stopped exactly at midnight.', ar: 'أغار أحدهم على مخزن نُزل التزلّج أثناء الليل. تساقط الثلج طوال المساء وتوقّف عند منتصف الليل تماماً.' },
    facts: [
      { e: '👣', en: 'A single line of boot-prints leads to the pantry door, pressed ON TOP of the smooth fresh snow.', ar: 'خطٌّ واحد من آثار الأحذية يقود إلى باب المخزن، مطبوعٌ فوق سطح الثلج الطازج الأملس.' },
      { e: '🥾', en: 'The prints match the caretaker’s boots exactly.', ar: 'الآثار تطابق حذاء حارس النُّزل تماماً.' },
    ],
    wits: [
      { e: '🧔', name: { en: 'Adel the caretaker', ar: 'الحارس عادل' }, en: '“I’ve been in my cabin since supper at nine — I never once went out.”', ar: '«أنا في كوخي منذ العشاء في التاسعة — لم أخرج ولا مرة.»' },
    ],
    q: { en: 'What do the footprints prove?', ar: 'ماذا تُثبت آثار الأقدام؟' },
    options: [
      { id: 'before', e: '🌆', en: 'Someone walked there before midnight', ar: 'أحدهم مشى هناك قبل منتصف الليل' },
      { id: 'adel', e: '🧔', en: 'Adel went out after midnight — his story is false', ar: 'عادل خرج بعد منتصف الليل — روايته كاذبة' },
      { id: 'guest', e: '🎿', en: 'A guest borrowed Adel’s boots at nine', ar: 'أحد النزلاء استعار حذاء عادل في التاسعة' },
    ],
    answer: 'adel', key: { in: 'facts', i: 0 },
    sol: [
      { en: 'Snow fell until midnight. Any prints made earlier would have been buried. Prints on TOP of the snow were made AFTER midnight.', ar: 'الثلج تساقط حتى منتصف الليل، فأي آثار قبل ذلك كانت ستُدفن. الآثار فوق الثلج صُنعت بعد منتصف الليل.' },
      { en: 'They match Adel’s boots — so his “in my cabin since nine” story collapses.', ar: 'وهي تطابق حذاء عادل — فتنهار روايته «في كوخي منذ التاسعة».' },
    ],
  },
  {
    id: 'dark-storeroom', tier: 1, e: '🔦',
    title: { en: 'Fifteen Dark Minutes', ar: 'خمس عشرة دقيقة من الظلام' },
    intro: { en: 'During a fifteen-minute power cut, the money box vanished from the ice-cream shop counter. Three workers were inside.', ar: 'أثناء انقطاع الكهرباء لخمس عشرة دقيقة، اختفى صندوق النقود من على منضدة محل المثلّجات. كان في الداخل ثلاثة عمّال.' },
    facts: [
      { e: '🌑', en: 'The cut blacked out the whole block. The back rooms have no windows at all.', ar: 'الانقطاع أظلم الحيّ كله، والغرف الخلفية بلا نوافذ إطلاقاً.' },
    ],
    wits: [
      { e: '🧊', name: { en: 'Tarek', ar: 'طارق' }, en: '“I held the freezer shut the whole time so nothing would melt. I never moved.”', ar: '«أمسكتُ باب المجمّدة مغلقاً طوال الوقت كي لا يذوب شيء. لم أتحرّك.»' },
      { e: '📱', name: { en: 'Dina', ar: 'دينا' }, en: '“I switched on my phone torch and watched the front door.”', ar: '«أضأتُ مصباح هاتفي وراقبتُ الباب الأمامي.»' },
      { e: '📦', name: { en: 'Walid', ar: 'وليد' }, en: '“I was in the windowless storeroom the whole fifteen minutes, reading the labels on the boxes for inventory.”', ar: '«كنت في المخزن الخالي من النوافذ طوال الدقائق الخمس عشرة، أقرأ ملصقات الصناديق للجرد.»' },
    ],
    q: { en: 'Who is lying?', ar: 'مَن يكذب؟' },
    options: [
      { id: 'tarek', e: '🧊', en: 'Tarek', ar: 'طارق' },
      { id: 'dina', e: '📱', en: 'Dina', ar: 'دينا' },
      { id: 'walid', e: '📦', en: 'Walid', ar: 'وليد' },
    ],
    answer: 'walid', key: { in: 'wits', i: 2 },
    sol: [
      { en: 'A windowless storeroom in a blackout is pitch dark — nobody can READ labels in total darkness, and he mentions no torch.', ar: 'مخزن بلا نوافذ أثناء انقطاع الكهرباء ظلامٌ دامس — لا أحد يقرأ الملصقات في العتمة، وهو لم يذكر أي مصباح.' },
      { en: 'Walid invented a quiet task to explain those fifteen minutes. What was he really doing?', ar: 'اختلق وليد مهمّة هادئة ليبرّر تلك الدقائق. فماذا كان يفعل حقاً؟' },
    ],
  },
  {
    id: 'feb30', tier: 1, e: '📅',
    title: { en: 'The Impossible Date', ar: 'التاريخ المستحيل' },
    intro: { en: 'A car was found scratched in early March. A neighbour came forward with a very confident report about who did it.', ar: 'وُجدت سيارة مخدوشة في أوائل آذار. تقدّم أحد الجيران ببلاغٍ واثقٍ جداً عن الفاعل.' },
    facts: [
      { e: '🚗', en: 'The scratch was discovered on the third of March.', ar: 'اكتُشف الخدش في الثالث من آذار.' },
    ],
    wits: [
      { e: '🧓', name: { en: 'Hadi', ar: 'هادي' }, en: '“I remember it precisely: on the evening of February the 30th, I watched those two kids scratch it from my balcony.”', ar: '«أذكرها بدقة: مساء الثلاثين من شباط، شاهدتُ هذين الولدين يخدشانها من شرفتي.»' },
    ],
    q: { en: 'Why did the detective throw out the report?', ar: 'لماذا رفض المحقّق البلاغ؟' },
    options: [
      { id: 'far', e: '🏢', en: 'The balcony is too far to see from', ar: 'الشرفة أبعد من أن يرى منها' },
      { id: 'date', e: '📅', en: 'February the 30th does not exist', ar: 'لا يوجد يوم ٣٠ من شباط أصلاً' },
      { id: 'dark', e: '🌙', en: 'It was too dark that evening', ar: 'كان الظلام شديداً ذلك المساء' },
    ],
    answer: 'date', key: { in: 'wits', i: 0 },
    sol: [
      { en: 'February has 28 days — 29 at most. There has never been a February the 30th.', ar: 'شباط ٢٨ يوماً — و٢٩ على الأكثر. لا وجود ليوم ٣٠ شباط.' },
      { en: 'A witness who “remembers precisely” a day that doesn’t exist saw nothing at all. The report was invented — and the detective now wonders why.', ar: 'شاهدٌ «يذكر بدقة» يوماً لا وجود له لم يرَ شيئاً البتة. البلاغ مختلَق — والمحقّق يتساءل الآن عن السبب.' },
    ],
  },
  {
    id: 'hot-teapot', tier: 1, e: '♨️',
    title: { en: 'The Steaming Teapot', ar: 'إبريق الشاي الساخن' },
    intro: { en: 'A missing bicycle was spotted near Karim’s shed. The detective knocked, and Karim opened the door with his coat still on.', ar: 'شوهدت درّاجة مفقودة قرب سقيفة كريم. طرق المحقّق الباب، ففتح كريم وهو ما يزال يرتدي معطفه.' },
    facts: [
      { e: '♨️', en: 'On the stove, a teapot stood steaming hot.', ar: 'على الموقد كان إبريق شايٍ يتصاعد منه البخار.' },
      { e: '🍲', en: 'A half-eaten, still-warm meal sat on the table.', ar: 'على الطاولة وجبة نصف مأكولة وما تزال دافئة.' },
    ],
    wits: [
      { e: '🧥', name: { en: 'Karim', ar: 'كريم' }, en: '“You caught me just walking in — I’ve been away a whole week at my sister’s village. Search the shed if you like!”', ar: '«وصلتَ وأنا أدخل للتوّ — كنت غائباً أسبوعاً كاملاً في قرية أختي. فتّش السقيفة إن شئت!»' },
    ],
    q: { en: 'Is Karim telling the truth?', ar: 'هل يقول كريم الحقيقة؟' },
    options: [
      { id: 'truth', e: '✅', en: 'Yes — he just arrived', ar: 'نعم — وصل للتوّ' },
      { id: 'lie', e: '❌', en: 'No — someone has been home all along', ar: 'لا — أحدهم كان في البيت طوال الوقت' },
      { id: 'unknown', e: '🤷', en: 'Impossible to tell', ar: 'لا يمكن الجزم' },
    ],
    answer: 'lie', key: { in: 'facts', i: 0 },
    sol: [
      { en: 'A steaming teapot and a warm half-eaten meal need someone in the house MINUTES ago — not a week ago.', ar: 'إبريق يتصاعد بخاره ووجبة دافئة نصف مأكولة يحتاجان إلى شخصٍ في البيت قبل دقائق — لا قبل أسبوع.' },
      { en: 'Karim’s “week away” is a lie — he heard the knock and threw his coat on to fake an arrival.', ar: '«أسبوع الغياب» كذبة — سمع كريم الطرق فارتدى معطفه ليمثّل الوصول.' },
    ],
  },
  {
    id: 'sunday-parcel', tier: 1, e: '📦',
    title: { en: 'The Sunday Parcel', ar: 'طرد يوم الأحد' },
    intro: { en: 'An office safe was robbed over the weekend. The detective asked everyone who had been near the building to account for themselves.', ar: 'سُرقت خزنة مكتبٍ في عطلة نهاية الأسبوع. طلب المحقّق من كل من اقترب من المبنى أن يفسّر وجوده.' },
    facts: [
      { e: '🚚', en: 'The courier company delivers Monday to Saturday — NEVER on Sundays.', ar: 'شركة التوصيل تعمل من الاثنين إلى السبت — ولا توصّل يوم الأحد أبداً.' },
      { e: '📋', en: 'The watchman’s log shows no signatures all weekend.', ar: 'سجلّ الحارس لا يحمل أي توقيع طوال العطلة.' },
    ],
    wits: [
      { e: '🚚', name: { en: 'Fadi the courier', ar: 'فادي عامل التوصيل' }, en: '“Me? I only dropped off a parcel on Sunday noon. The watchman signed for it and I left straight away.”', ar: '«أنا؟ سلّمتُ طرداً ظهر الأحد فقط. وقّع الحارس على الاستلام وغادرت فوراً.»' },
      { e: '💂', name: { en: 'The watchman', ar: 'الحارس' }, en: '“I signed for nothing this weekend. Nobody official came at all.”', ar: '«لم أوقّع على شيء في هذه العطلة. لم يأتِ أي موظف رسمي إطلاقاً.»' },
    ],
    q: { en: 'Who is lying?', ar: 'مَن يكذب؟' },
    options: [
      { id: 'fadi', e: '🚚', en: 'Fadi the courier', ar: 'فادي عامل التوصيل' },
      { id: 'watchman', e: '💂', en: 'The watchman', ar: 'الحارس' },
      { id: 'nobody', e: '🤝', en: 'Neither — a mix-up', ar: 'لا أحد — سوء تفاهم' },
    ],
    answer: 'fadi', key: { in: 'facts', i: 0 },
    sol: [
      { en: 'His own company never delivers on Sundays — there was no parcel round that day at all.', ar: 'شركته نفسها لا توصّل يوم الأحد — لم تكن هناك جولة توصيل أصلاً.' },
      { en: 'Fadi invented an official excuse for being at the building on the very day of the robbery.', ar: 'اختلق فادي عذراً رسمياً لوجوده عند المبنى في يوم السرقة بالذات.' },
    ],
  },
  {
    id: 'tunnel', tier: 1, e: '🚇',
    title: { en: 'The Tunnel Witness', ar: 'شاهد النفق' },
    intro: { en: 'On the express train, Mona’s handbag was snatched at the exact moment the train rushed through a tunnel — and the carriage lights failed for those two minutes.', ar: 'في القطار السريع، خُطفت حقيبة منى في اللحظة التي اندفع فيها القطار داخل نفق — وتعطّلت أضواء العربة خلال هاتين الدقيقتين.' },
    facts: [
      { e: '🌑', en: 'Inside the tunnel with the lights out, the carriage was completely black.', ar: 'داخل النفق ومع انطفاء الأضواء، كانت العربة في ظلام تامّ.' },
    ],
    wits: [
      { e: '🧑', name: { en: 'Zaki, a passenger', ar: 'الراكب زكي' }, en: '“I saw the thief clearly! A tall man in a RED jacket grabbed the bag and ran to the next carriage. Hurry, catch him!”', ar: '«رأيتُ اللص بوضوح! رجل طويل بسترة حمراء خطف الحقيبة وركض إلى العربة التالية. أسرعوا خلفه!»' },
    ],
    q: { en: 'Who took the handbag?', ar: 'مَن خطف الحقيبة؟' },
    options: [
      { id: 'red', e: '🧥', en: 'The man in the red jacket', ar: 'الرجل ذو السترة الحمراء' },
      { id: 'zaki', e: '🧑', en: 'Zaki, the “witness”', ar: '«الشاهد» زكي نفسه' },
      { id: 'mona', e: '👜', en: 'Mona lost it herself', ar: 'منى أضاعتها بنفسها' },
    ],
    answer: 'zaki', key: { in: 'wits', i: 0 },
    sol: [
      { en: 'In total darkness nobody can see a jacket’s colour — or anything at all.', ar: 'في الظلام التام لا أحد يميّز لون سترة — ولا أي شيء أصلاً.' },
      { en: 'Zaki invented a “red jacket man” to send everyone chasing the wrong way. The eager witness is the thief.', ar: 'اختلق زكي «رجل السترة الحمراء» ليدفع الجميع للمطاردة في الاتجاه الخاطئ. الشاهد المتحمّس هو اللص.' },
    ],
  },
  {
    id: 'silent-dog', tier: 1, e: '🐕',
    title: { en: 'The Dog That Didn’t Bark', ar: 'الكلب الذي لم ينبح' },
    intro: { en: 'At night, someone took the prize saddle from the stable. Rex the guard dog barks furiously at every stranger — yet that whole night, not a sound.', ar: 'ليلاً، أخذ أحدهم السرج الثمين من الإسطبل. الكلب الحارس ريكس ينبح بشراسة على كل غريب — ومع ذلك لم يصدر عنه صوت تلك الليلة.' },
    facts: [
      { e: '🐕', en: 'Rex was awake and healthy — he ate his breakfast happily in the morning.', ar: 'كان ريكس مستيقظاً وسليماً — وأكل فطوره بشهية في الصباح.' },
      { e: '👥', en: 'Three people were seen near the farm that week.', ar: 'ثلاثة أشخاص شوهدوا قرب المزرعة ذلك الأسبوع.' },
    ],
    wits: [
      { e: '🧳', name: { en: 'A travelling salesman', ar: 'بائع متجوّل' }, en: '“I passed by once on Tuesday to sell brushes.”', ar: '«مررت مرة واحدة يوم الثلاثاء لأبيع الفراشي.»' },
      { e: '📬', name: { en: 'The new mail-carrier', ar: 'ساعي البريد الجديد' }, en: '“I started this route only this week.”', ar: '«بدأت العمل على هذا الخط هذا الأسبوع فقط.»' },
      { e: '🧑‍🌾', name: { en: 'Yara the stable-hand', ar: 'يارا عاملة الإسطبل' }, en: '“I feed Rex every single night. He adores me.”', ar: '«أطعم ريكس كل ليلة. إنه يحبني كثيراً.»' },
    ],
    q: { en: 'Who took the saddle?', ar: 'مَن أخذ السرج؟' },
    options: [
      { id: 'salesman', e: '🧳', en: 'The salesman', ar: 'البائع المتجوّل' },
      { id: 'mail', e: '📬', en: 'The new mail-carrier', ar: 'ساعي البريد الجديد' },
      { id: 'yara', e: '🧑‍🌾', en: 'Yara the stable-hand', ar: 'يارا عاملة الإسطبل' },
    ],
    answer: 'yara', key: { in: 'facts', i: 0 },
    sol: [
      { en: 'Rex barks at every stranger, and he was awake all night. A silent dog means the visitor was no stranger.', ar: 'ريكس ينبح على كل غريب، وكان مستيقظاً طوال الليل. صمت الكلب يعني أن الزائر لم يكن غريباً.' },
      { en: 'The salesman and the brand-new mail-carrier are strangers to Rex. Only Yara, who feeds him nightly, could walk in without a single bark.', ar: 'البائع وساعي البريد الجديد غريبان على ريكس. وحدها يارا التي تطعمه كل ليلة تستطيع الدخول دون نبحة واحدة.' },
    ],
  },
  {
    id: 'secret-time', tier: 1, e: '⌚',
    title: { en: 'Too Perfect an Alibi', ar: 'حجّة أدقّ من اللازم' },
    intro: { en: 'The school trophy vanished on Tuesday. The headmaster announced only that it disappeared “sometime during the day” — the camera’s timestamp was kept strictly secret.', ar: 'اختفت كأس المدرسة يوم الثلاثاء. أعلن المدير فقط أنها اختفت «في وقتٍ ما خلال اليوم» — وبقي توقيت الكاميرا سرّاً تامّاً.' },
    facts: [
      { e: '🎥', en: 'The security log shows the trophy was taken at exactly 2:35 — only the detective knows this.', ar: 'سجلّ الكاميرا يُظهر أن الكأس أُخذت في الساعة ٢:٣٥ تماماً — ولا يعرف ذلك سوى المحقّق.' },
    ],
    wits: [
      { e: '🏀', name: { en: 'Nour', ar: 'نور' }, en: '“Tuesday? I had basketball practice till five.”', ar: '«الثلاثاء؟ كان عندي تدريب كرة السلة حتى الخامسة.»' },
      { e: '🏠', name: { en: 'Sami', ar: 'سامي' }, en: '“I went straight home after class, ask my mum.”', ar: '«ذهبت إلى البيت مباشرة بعد الدرس، اسألوا أمي.»' },
      { e: '📚', name: { en: 'Layla', ar: 'ليلى' }, en: '“At 2:35, when it was taken, I was in the library.”', ar: '«في الساعة ٢:٣٥، حين أُخذت الكأس، كنت في المكتبة.»' },
    ],
    q: { en: 'Who took the trophy?', ar: 'مَن أخذ الكأس؟' },
    options: [
      { id: 'nour', e: '🏀', en: 'Nour', ar: 'نور' },
      { id: 'sami', e: '🏠', en: 'Sami', ar: 'سامي' },
      { id: 'layla', e: '📚', en: 'Layla', ar: 'ليلى' },
    ],
    answer: 'layla', key: { in: 'wits', i: 2 },
    sol: [
      { en: 'Nobody was told WHEN the trophy was taken — the 2:35 timestamp was secret.', ar: 'لم يُخبَر أحد بوقت اختفاء الكأس — توقيت ٢:٣٥ كان سرّاً.' },
      { en: 'Layla gave an alibi for that exact minute. Only the thief knew the minute mattered.', ar: 'قدّمت ليلى حجّة غياب عن تلك الدقيقة بالذات. وحده الفاعل يعرف أن تلك الدقيقة مهمّة.' },
    ],
  },
  {
    id: 'spring-photo', tier: 1, e: '📷',
    title: { en: 'The Blossom Photo', ar: 'صورة الأزهار' },
    intro: { en: 'To prove he was fishing at the lake when the shed was raided last Tuesday, Walid proudly shows the detective a photo of himself by the water.', ar: 'ليثبت أنه كان يصطاد عند البحيرة حين سُطي على السقيفة الثلاثاء الماضي، يُري وليد المحقّق بفخرٍ صورة له عند الماء.' },
    facts: [
      { e: '🍂', en: 'The raid happened in late autumn — every tree in the region is bare.', ar: 'وقعت السرقة في أواخر الخريف — وكل أشجار المنطقة عارية من الورق.' },
      { e: '🌸', en: 'In the photo, the trees behind Walid are covered in white spring blossom.', ar: 'في الصورة، الأشجار خلف وليد مكسوّة بأزهار الربيع البيضاء.' },
    ],
    wits: [
      { e: '🎣', name: { en: 'Walid', ar: 'وليد' }, en: '“See? That’s me at the lake, last Tuesday, far from any shed!”', ar: '«أرأيتم؟ هذا أنا عند البحيرة، الثلاثاء الماضي، بعيداً عن أي سقيفة!»' },
    ],
    q: { en: 'What does the photo actually prove?', ar: 'ماذا تُثبت الصورة فعلاً؟' },
    options: [
      { id: 'alibi', e: '✅', en: 'His alibi — he was at the lake', ar: 'حجّته — كان عند البحيرة' },
      { id: 'old', e: '📷', en: 'Nothing — it’s an old spring photo, the alibi is fake', ar: 'لا شيء — إنها صورة قديمة من الربيع، والحجّة مزيّفة' },
      { id: 'place', e: '🗺️', en: 'He was at a different lake', ar: 'كان عند بحيرة أخرى' },
    ],
    answer: 'old', key: { in: 'facts', i: 1 },
    sol: [
      { en: 'Blossoming trees mean spring. The raid was in late autumn, when branches are bare.', ar: 'الأشجار المزهرة تعني الربيع. أما السرقة فوقعت في أواخر الخريف حيث الأغصان عارية.' },
      { en: 'The photo was taken months ago — Walid dug up an old picture to fake an alibi. Why would an innocent man need to?', ar: 'الصورة التُقطت قبل أشهر — نبش وليد صورة قديمة ليصنع حجّة. ولماذا يحتاج البريء إلى ذلك؟' },
    ],
  },

  // ═══════════════════════ TIER 2 ═══════════════════════
  {
    id: 'one-truth', tier: 2, e: '🍪',
    title: { en: 'One True Statement', ar: 'جملة صادقة واحدة' },
    intro: { en: 'One of three brothers ate the whole cake. Their mother — who always knows — says that EXACTLY ONE of the three statements below is true.', ar: 'أحد الإخوة الثلاثة أكل الكعكة كاملة. أمّهم — التي تعرف دائماً — تقول إن جملة واحدة فقط ممّا يلي صادقة.' },
    facts: [
      { e: '⚖️', en: 'Exactly one of the three statements is true. The other two are false.', ar: 'جملة واحدة فقط من الثلاث صادقة، والأخريان كاذبتان.' },
    ],
    wits: [
      { e: '🧒', name: { en: 'Ramy', ar: 'رامي' }, en: '“Kawkab did it.”', ar: '«كوكب فعلها.»' },
      { e: '👦', name: { en: 'Kawkab', ar: 'كوكب' }, en: '“I didn’t do it.”', ar: '«أنا لم أفعلها.»' },
      { e: '🧑', name: { en: 'Sami', ar: 'سامي' }, en: '“I didn’t do it.”', ar: '«أنا لم أفعلها.»' },
    ],
    q: { en: 'Who ate the cake?', ar: 'مَن أكل الكعكة؟' },
    options: [
      { id: 'ramy', e: '🧒', en: 'Ramy', ar: 'رامي' },
      { id: 'kawkab', e: '👦', en: 'Kawkab', ar: 'كوكب' },
      { id: 'sami', e: '🧑', en: 'Sami', ar: 'سامي' },
    ],
    answer: 'sami', key: { in: 'facts', i: 0 },
    sol: [
      { en: 'Try Ramy: his own claim is false ✗, Kawkab’s is true ✓, Sami’s is true ✓ — that’s TWO truths. Impossible.', ar: 'جرّب رامي: كلامه كاذب ✗، كلام كوكب صادق ✓، كلام سامي صادق ✓ — صدقان اثنان. مستحيل.' },
      { en: 'Try Kawkab: Ramy true ✓, Kawkab false ✗, Sami true ✓ — two truths again. Impossible.', ar: 'جرّب كوكب: رامي صادق ✓، كوكب كاذب ✗، سامي صادق ✓ — صدقان أيضاً. مستحيل.' },
      { en: 'Try Sami: Ramy false ✗, Kawkab true ✓, Sami false ✗ — exactly ONE truth. Sami ate the cake.', ar: 'جرّب سامي: رامي كاذب ✗، كوكب صادق ✓، سامي كاذب ✗ — صدقٌ واحد بالضبط. سامي أكل الكعكة.' },
    ],
  },
  {
    id: 'chess-winners', tier: 2, e: '♟️',
    title: { en: 'Two Winners, One Game', ar: 'فائزان في مباراة واحدة' },
    intro: { en: 'On the night of the theft, two cousins swear they never left the house: they spent the whole evening playing one long game of chess — just the two of them. The detective questioned them separately.', ar: 'ليلة السرقة أقسم ابنا العم أنهما لم يغادرا البيت: أمضيا المساء كله في مباراة شطرنج واحدة طويلة — وحدهما فقط. استجوبهما المحقّق كلاً على حدة.' },
    facts: [
      { e: '👥', en: 'Nobody else saw them that evening — they are each other’s only alibi.', ar: 'لم يرهما أحد آخر ذلك المساء — كل منهما حجّة الآخر الوحيدة.' },
    ],
    wits: [
      { e: '👩', name: { en: 'Hala', ar: 'هالة' }, en: '“One long game, all evening. And for the record — I won it.”', ar: '«مباراة واحدة طويلة، طوال المساء. وللعلم — أنا فزتُ بها.»' },
      { e: '👨', name: { en: 'Fadi', ar: 'فادي' }, en: '“Chess all evening, just us two, one game. I won, of course.”', ar: '«شطرنج طوال المساء، نحن الاثنان فقط، مباراة واحدة. وفزتُ أنا طبعاً.»' },
    ],
    q: { en: 'What should the detective conclude?', ar: 'ماذا يستنتج المحقّق؟' },
    options: [
      { id: 'solid', e: '✅', en: 'The alibi holds — they were home', ar: 'الحجّة صامدة — كانا في البيت' },
      { id: 'forgot', e: '🤔', en: 'One of them simply misremembers', ar: 'أحدهما أخطأ في التذكّر فحسب' },
      { id: 'fake', e: '❌', en: 'The story is rehearsed and false — the alibi collapses', ar: 'القصة محفوظة وكاذبة — الحجّة تنهار' },
    ],
    answer: 'fake', key: { in: 'wits', i: 1 },
    sol: [
      { en: 'One game of chess has one winner. Both claiming victory in the SAME game means at least one is lying.', ar: 'مباراة شطرنج واحدة لها فائز واحد. ادّعاء الاثنين الفوز بالمباراة نفسها يعني أن أحدهما على الأقل يكذب.' },
      { en: 'But they are each other’s only alibi — if any part is a lie, the whole evening is unvouched. They agreed on the story but forgot to agree on the ending.', ar: 'لكن كلاً منهما حجّة الآخر الوحيدة — إن كذب جزءٌ سقط المساء كله بلا إثبات. اتفقا على القصة ونسيا الاتفاق على نهايتها.' },
    ],
  },
  {
    id: 'wedding-ring', tier: 2, e: '💍',
    title: { en: 'The Wedding Ring', ar: 'خاتم العرس' },
    intro: { en: 'At the wedding hall, the gift ring vanished from its cushion between 3:00 and 3:30. Three people had been near the gift table.', ar: 'في صالة الأعراس اختفى خاتم الهدية من وسادته بين الثالثة والثالثة والنصف. ثلاثة أشخاص كانوا قرب طاولة الهدايا.' },
    facts: [
      { e: '📸', en: 'The 3:10 group photo shows every single guest — EXCEPT Aunt Mona.', ar: 'الصورة الجماعية عند ٣:١٠ تُظهر كل المدعوّين بلا استثناء — ما عدا الخالة منى.' },
      { e: '🎻', en: 'The band played on stage from 2:45 to 3:20 in front of everyone.', ar: 'عزفت الفرقة على المسرح من ٢:٤٥ إلى ٣:٢٠ أمام الجميع.' },
    ],
    wits: [
      { e: '🎻', name: { en: 'The violinist', ar: 'عازف الكمان' }, en: '“I was on stage the whole time — two hundred people watched me.”', ar: '«كنت على المسرح طوال الوقت — ومئتا شخص يشاهدونني.»' },
      { e: '👨‍🍳', name: { en: 'The chef', ar: 'الطاهي' }, en: '“In the kitchen since three. The waiter can confirm every minute.”', ar: '«في المطبخ منذ الثالثة، والنادل يشهد على كل دقيقة.»' },
      { e: '👒', name: { en: 'Aunt Mona', ar: 'الخالة منى' }, en: '“Me? I was in all the photos, dear — ask the photographer!”', ar: '«أنا؟ كنت في كل الصور يا عزيزي — اسألوا المصوّر!»' },
    ],
    q: { en: 'Who took the ring?', ar: 'مَن أخذ الخاتم؟' },
    options: [
      { id: 'violinist', e: '🎻', en: 'The violinist', ar: 'عازف الكمان' },
      { id: 'chef', e: '👨‍🍳', en: 'The chef', ar: 'الطاهي' },
      { id: 'mona', e: '👒', en: 'Aunt Mona', ar: 'الخالة منى' },
    ],
    answer: 'mona', key: { in: 'facts', i: 0 },
    sol: [
      { en: 'The violinist was watched by the whole hall; the chef is vouched minute by minute.', ar: 'العازف كانت تراقبه الصالة كلها؛ والطاهي مشهودٌ له دقيقة بدقيقة.' },
      { en: 'Mona claims she was “in all the photos” — but the 3:10 photo, right in the theft window, is missing exactly her. Her own alibi disproves her.', ar: 'تدّعي منى أنها «في كل الصور» — لكن صورة ٣:١٠، في قلب فترة السرقة، تخلو منها وحدها. حجّتها ذاتها تفضحها.' },
    ],
  },
  {
    id: 'broken-lift', tier: 2, e: '🛗',
    title: { en: 'Twelve Floors Down', ar: 'اثنا عشر طابقاً نزولاً' },
    intro: { en: 'A ring of keys was stolen from a 12th-floor office at noon sharp. A blurry figure was seen leaving the stairwell at 12:03.', ar: 'سُرقت حلقة مفاتيح من مكتبٍ في الطابق الثاني عشر عند الظهر تماماً. وشوهد شخصٌ ضبابي الملامح يغادر بيت الدرج عند ١٢:٠٣.' },
    facts: [
      { e: '🛗', en: 'The building’s ONLY elevator was shut down for repairs from 8 a.m. — all day.', ar: 'مصعد المبنى الوحيد كان متوقفاً للصيانة منذ الثامنة صباحاً — طوال اليوم.' },
      { e: '🩼', en: 'Karim’s leg is in a cast; he walks slowly on crutches.', ar: 'ساق كريم في الجبس، وهو يمشي ببطء على عكّازين.' },
    ],
    wits: [
      { e: '🩼', name: { en: 'Karim', ar: 'كريم' }, en: '“I did visit the 12th floor around noon — but I took the elevator down at 12:01 and was out on the street by 12:02.”', ar: '«زرتُ الطابق الثاني عشر قرب الظهر فعلاً — لكنني نزلت بالمصعد عند ١٢:٠١ وكنت في الشارع عند ١٢:٠٢.»' },
    ],
    q: { en: 'What is wrong with Karim’s story?', ar: 'ما الخلل في رواية كريم؟' },
    options: [
      { id: 'floor', e: '🏢', en: 'The office is not on the 12th floor', ar: 'المكتب ليس في الطابق الثاني عشر' },
      { id: 'lift', e: '🛗', en: 'He cannot have used the elevator — it was out of service', ar: 'يستحيل أنه استخدم المصعد — كان معطّلاً' },
      { id: 'time', e: '⏰', en: 'Nothing — one minute is plenty', ar: 'لا خلل — دقيقة واحدة تكفي' },
    ],
    answer: 'lift', key: { in: 'facts', i: 0 },
    sol: [
      { en: 'The only elevator had been dead since morning — his “elevator down at 12:01” never happened.', ar: 'المصعد الوحيد متوقف منذ الصباح — «نزوله بالمصعد عند ١٢:٠١» لم يحدث قط.' },
      { en: 'On crutches, twelve floors of stairs take many minutes — so he lied precisely about the theft window. Why does an innocent visitor need a false exit time?', ar: 'وعلى العكّازين يستغرق نزول اثني عشر طابقاً دقائق طويلة — إذاً كذب تحديداً بشأن فترة السرقة. ولماذا يحتاج زائر بريء إلى وقتِ خروجٍ مزيّف؟' },
    ],
  },
  {
    id: 'silent-radio', tier: 2, e: '📻',
    title: { en: 'The Nine O’Clock Song', ar: 'أغنية التاسعة' },
    intro: { en: 'The garage till was robbed at nine in the evening. Ziad insists he was driving on the highway, far away, at that exact hour.', ar: 'سُرق صندوق نقود الكراج في التاسعة مساءً. يصرّ زياد على أنه كان يقود على الطريق السريع، بعيداً جداً، في تلك الساعة بالذات.' },
    facts: [
      { e: '📻', en: 'Radio Nour’s transmitter broke down at 8:50 that night — the station was silent until 9:15.', ar: 'جهاز إرسال «إذاعة نور» تعطّل في ٨:٥٠ تلك الليلة — وبقيت الإذاعة صامتة حتى ٩:١٥.' },
    ],
    wits: [
      { e: '🚗', name: { en: 'Ziad', ar: 'زياد' }, en: '“I even remember the nine-o’clock request show on Radio Nour — they played the sea song right at nine. I sang along!”', ar: '«حتى إنني أذكر برنامج الأغاني في التاسعة على إذاعة نور — شغّلوا أغنية البحر عند التاسعة تماماً، وغنّيتُ معها!»' },
    ],
    q: { en: 'Is Ziad’s alibi genuine?', ar: 'هل حجّة زياد صحيحة؟' },
    options: [
      { id: 'genuine', e: '✅', en: 'Yes — he clearly remembers the show', ar: 'نعم — يذكر البرنامج بوضوح' },
      { id: 'fake', e: '❌', en: 'No — nothing aired at nine; the memory is invented', ar: 'لا — لم يُبَثّ شيء في التاسعة؛ الذكرى مختلَقة' },
      { id: 'maybe', e: '🤷', en: 'He may have heard another station', ar: 'ربما سمع إذاعة أخرى' },
    ],
    answer: 'fake', key: { in: 'facts', i: 0 },
    sol: [
      { en: 'From 8:50 to 9:15 Radio Nour broadcast nothing at all. A song “right at nine” on that station is impossible.', ar: 'من ٨:٥٠ إلى ٩:١٥ لم تبثّ إذاعة نور شيئاً. أغنية «عند التاسعة تماماً» على تلك الإذاعة مستحيلة.' },
      { en: 'He didn’t mishear “another station” — HE named Radio Nour and its show. A rehearsed detail that never happened marks a prepared lie.', ar: 'لم يخلط مع «إذاعة أخرى» — هو نفسه سمّى إذاعة نور وبرنامجها. تفصيلة محفوظة لم تحدث قط علامةُ كذبةٍ معدّة سلفاً.' },
    ],
  },
  {
    id: 'room-214', tier: 2, e: '🏨',
    title: { en: 'Room 214', ar: 'الغرفة ٢١٤' },
    intro: { en: 'While the jewel dealer dined downstairs, his hotel room — 214 — was robbed. His room number appeared in no public list; the question is who KNEW it.', ar: 'بينما كان تاجر المجوهرات يتعشّى في الطابق الأرضي، سُرقت غرفته — ٢١٤. رقم غرفته لم يُنشر في أي مكان؛ والسؤال: من كان يعرفه؟' },
    facts: [
      { e: '🎥', en: 'The lobby camera confirms the receptionist never left her desk all evening.', ar: 'كاميرا البهو تؤكد أن موظفة الاستقبال لم تغادر مكتبها طوال المساء.' },
      { e: '🧳', en: 'On arrival, the bellboy carried the dealer’s suitcases up to his room himself.', ar: 'عند الوصول، حمل عامل الحقائب حقائبَ التاجر بنفسه إلى غرفته.' },
    ],
    wits: [
      { e: '💁‍♀️', name: { en: 'Dina, reception', ar: 'دينا، الاستقبال' }, en: '“I told his room number to nobody — and I never left the desk.”', ar: '«لم أُخبر أحداً برقم غرفته — ولم أغادر المكتب أبداً.»' },
      { e: '🛎️', name: { en: 'Sami, the bellboy', ar: 'سامي، عامل الحقائب' }, en: '“Me? I never even knew which room was his.”', ar: '«أنا؟ لم أعرف أصلاً أي غرفة كانت غرفته.»' },
      { e: '👨‍🍳', name: { en: 'The cook', ar: 'الطاهي' }, en: '“I don’t leave my kitchen during dinner service. Ever.”', ar: '«لا أغادر مطبخي أثناء خدمة العشاء. أبداً.»' },
    ],
    q: { en: 'Who robbed room 214?', ar: 'مَن سرق الغرفة ٢١٤؟' },
    options: [
      { id: 'dina', e: '💁‍♀️', en: 'Dina the receptionist', ar: 'دينا موظفة الاستقبال' },
      { id: 'sami', e: '🛎️', en: 'Sami the bellboy', ar: 'سامي عامل الحقائب' },
      { id: 'cook', e: '👨‍🍳', en: 'The cook', ar: 'الطاهي' },
    ],
    answer: 'sami', key: { in: 'facts', i: 1 },
    sol: [
      { en: 'Sami carried the dealer’s suitcases UP TO HIS ROOM — of course he knew it was 214.', ar: 'سامي حمل حقائب التاجر إلى غرفته بنفسه — بالطبع كان يعرف أنها ٢١٤.' },
      { en: 'His denial — “I never knew which room” — is a proven lie, and innocent people don’t lie about what they know. The camera clears Dina; the cook never knew the number.', ar: 'إنكاره — «لم أعرف أي غرفة» — كذبة مثبتة، والأبرياء لا يكذبون بشأن ما يعرفونه. الكاميرا تبرّئ دينا، والطاهي لم يعرف الرقم أصلاً.' },
    ],
  },
  {
    id: 'strawberry', tier: 2, e: '🍰',
    title: { en: 'The Secret Filling', ar: 'الحشوة السرّية' },
    intro: { en: 'A surprise birthday cake arrived in a sealed, unmarked box. Before the party, someone opened the box and ate a slice. Nobody — not even the parents — knew what flavour hid inside.', ar: 'وصلت كعكة عيد ميلاد مفاجئة في علبة مغلقة بلا أي علامة. قبل الحفلة فتح أحدهم العلبة وأكل قطعة. لا أحد — ولا حتى الوالدان — كان يعرف نكهة الحشوة.' },
    facts: [
      { e: '📦', en: 'Only the baker knew the filling was strawberry. The box was sealed and unmarked.', ar: 'وحده الخبّاز كان يعرف أن الحشوة فراولة. والعلبة كانت مغلقة وبلا علامات.' },
    ],
    wits: [
      { e: '👧', name: { en: 'Lola', ar: 'لولا' }, en: '“I was in the garden all morning.”', ar: '«كنت في الحديقة طوال الصباح.»' },
      { e: '🧒', name: { en: 'Ramy', ar: 'رامي' }, en: '“I never went near the kitchen.”', ar: '«لم أقترب من المطبخ إطلاقاً.»' },
      { e: '👧', name: { en: 'Nour', ar: 'نور' }, en: '“Not me! Anyway, who would even want a boring strawberry filling?”', ar: '«ليس أنا! وبعدين، من قد يشتهي حشوة فراولة مملّة أصلاً؟»' },
    ],
    q: { en: 'Who ate the slice?', ar: 'مَن أكل القطعة؟' },
    options: [
      { id: 'lola', e: '👧', en: 'Lola', ar: 'لولا' },
      { id: 'ramy', e: '🧒', en: 'Ramy', ar: 'رامي' },
      { id: 'nour', e: '👧', en: 'Nour', ar: 'نور' },
    ],
    answer: 'nour', key: { in: 'wits', i: 2 },
    sol: [
      { en: 'The filling was a secret sealed inside an unmarked box — it becomes visible only once the cake is cut.', ar: 'الحشوة سرٌّ داخل علبة مغلقة بلا علامات — ولا تظهر إلا بعد قطع الكعكة.' },
      { en: 'Nour calls it “a boring STRAWBERRY filling”. The only way to know the flavour was to open the box and cut the slice. She told on herself.', ar: 'نور وصفتها بـ«حشوة الفراولة المملّة». والطريقة الوحيدة لمعرفة النكهة هي فتح العلبة وقطع الكعكة. لقد وشت بنفسها.' },
    ],
  },
  {
    id: 'dry-bike', tier: 2, e: '🚲',
    title: { en: 'The Dry Bicycle', ar: 'الدرّاجة الجافة' },
    intro: { en: 'Adel filed a report: “My bike was stolen from outside the café at dawn, while it was still raining!” An hour later, the bike turned up two streets away.', ar: 'قدّم عادل بلاغاً: «سُرقت درّاجتي من أمام المقهى عند الفجر، والمطر ما يزال يهطل!» بعد ساعة، وُجدت الدرّاجة على بُعد شارعين.' },
    facts: [
      { e: '🌧️', en: 'Rain fell nonstop from midnight until well after sunrise.', ar: 'هطل المطر بلا توقّف من منتصف الليل حتى ما بعد الشروق بوقت طويل.' },
      { e: '🚲', en: 'The recovered bike was bone dry — frame, handlebars, even the saddle.', ar: 'الدرّاجة المستعادة كانت جافة تماماً — الهيكل والمقود وحتى المقعد.' },
    ],
    wits: [
      { e: '🧢', name: { en: 'Adel', ar: 'عادل' }, en: '“It stood outside the café all night — the thief grabbed it at dawn, I’m sure of it. I want the insurance money quickly, please.”', ar: '«كانت واقفة أمام المقهى طوال الليل — واللص خطفها عند الفجر، أنا متأكد. وأرجو صرف التأمين سريعاً.»' },
    ],
    q: { en: 'What really happened?', ar: 'ما الذي حدث فعلاً؟' },
    options: [
      { id: 'dawn', e: '🌅', en: 'Stolen at dawn, exactly as reported', ar: 'سُرقت عند الفجر كما ورد في البلاغ' },
      { id: 'staged', e: '❌', en: 'The bike never stood in the rain — the report is false', ar: 'الدرّاجة لم تقف تحت المطر أصلاً — البلاغ كاذب' },
      { id: 'dried', e: '🧻', en: 'The thief dried it carefully', ar: 'اللص جفّفها بعناية' },
    ],
    answer: 'staged', key: { in: 'facts', i: 1 },
    sol: [
      { en: 'A bike parked outside through a night of nonstop rain would be soaked — and it was found within the hour, still raining.', ar: 'درّاجة واقفة في الخارج طوال ليلة مطر متواصل ستكون مبلّلة حتماً — وقد وُجدت خلال ساعة والمطر مستمرّ.' },
      { en: 'Bone dry means it was indoors the whole time. Adel parked it away himself and invented the theft for the insurance.', ar: 'جفافها التام يعني أنها كانت في مكان مسقوف طوال الوقت. عادل خبّأها بنفسه واختلق السرقة من أجل التأمين.' },
    ],
  },
  {
    id: 'oiled-lock', tier: 2, e: '🗝️',
    title: { en: 'Three Keys', ar: 'ثلاثة مفاتيح' },
    intro: { en: 'The club storeroom was emptied overnight — and found locked again in the morning, the lock untouched. Only three keys to it exist.', ar: 'أُفرغ مخزن النادي ليلاً — ووُجد في الصباح مقفلاً من جديد، والقفل سليم تماماً. لا يوجد سوى ثلاثة مفاتيح له.' },
    facts: [
      { e: '🔒', en: 'The stiff old lock turns ONLY with one of its own three keys — and it was locked again after the theft.', ar: 'القفل القديم العنيد لا يدور إلا بأحد مفاتيحه الثلاثة — وقد أُقفل من جديد بعد السرقة.' },
      { e: '🛢️', en: 'Two days before the theft, Hadi was seen carefully oiling that very lock.', ar: 'قبل السرقة بيومين، شوهد هادي يزيّت ذلك القفل بالذات بعناية.' },
    ],
    wits: [
      { e: '✈️', name: { en: 'Rana', ar: 'رنا' }, en: '“I’ve been abroad all week — my passport stamps prove it.”', ar: '«أنا مسافرة خارج البلاد طوال الأسبوع — وأختام جوازي تثبت ذلك.»' },
      { e: '🏥', name: { en: 'Omar', ar: 'عمر' }, en: '“I was in hospital with a broken arm — the records show it.”', ar: '«كنت في المستشفى بذراع مكسورة — والسجلّات تُثبت ذلك.»' },
      { e: '🤷', name: { en: 'Hadi', ar: 'هادي' }, en: '“Don’t look at me — I LOST my key a month ago and haven’t seen it since.”', ar: '«لا تنظروا إليّ — أضعتُ مفتاحي قبل شهر ولم أرَه منذ ذلك الحين.»' },
    ],
    q: { en: 'Who emptied the storeroom?', ar: 'مَن أفرغ المخزن؟' },
    options: [
      { id: 'rana', e: '✈️', en: 'Rana', ar: 'رنا' },
      { id: 'omar', e: '🏥', en: 'Omar', ar: 'عمر' },
      { id: 'hadi', e: '🤷', en: 'Hadi', ar: 'هادي' },
    ],
    answer: 'hadi', key: { in: 'facts', i: 1 },
    sol: [
      { en: 'Locked-again with no damage means one of the three keys did it. Rana and Omar are provably elsewhere.', ar: 'الإقفال من جديد دون أي ضرر يعني أن أحد المفاتيح الثلاثة استُخدم. ورنا وعمر غيابهما مثبت.' },
      { en: 'Hadi says he lost his key a month ago — yet two days before the theft he was OILING the lock. Who oils a lock they cannot open? He was preparing it for a silent night visit.', ar: 'يقول هادي إنه أضاع مفتاحه قبل شهر — لكنه قبل السرقة بيومين كان يزيّت القفل. من يزيّت قفلاً لا يستطيع فتحه؟ كان يجهّزه لزيارةٍ ليليةٍ صامتة.' },
    ],
  },
  {
    id: 'bluff', tier: 2, e: '🫙',
    title: { en: 'The Fingerprint Bluff', ar: 'خدعة البصمات' },
    intro: { en: 'The sweets jar was raided during break. The teacher gathered the three suspects and announced: “After lunch I will check the jar for fingerprints.” In truth, the jar had been wiped clean — she was bluffing.', ar: 'أُغير على برطمان الحلوى في الاستراحة. جمعت المعلّمة المشتبه بهم الثلاثة وأعلنت: «بعد الغداء سأفحص البرطمان بحثاً عن البصمات.» والحقيقة أن البرطمان كان ممسوحاً تماماً — كانت تخادع.' },
    facts: [
      { e: '🫙', en: 'The jar had been wiped spotless. There were no fingerprints to find.', ar: 'كان البرطمان ممسوحاً بلا أثر. لا بصمات فيه على الإطلاق.' },
    ],
    wits: [
      { e: '🙋', name: { en: 'Sami', ar: 'سامي' }, en: '“Sure, check mine right now if you want.”', ar: '«تفضّلي، افحصي بصماتي الآن إن أردتِ.»' },
      { e: '🙆', name: { en: 'Yara', ar: 'يارا' }, en: '“Good idea, teacher. That will settle it.”', ar: '«فكرة ممتازة يا معلّمتي. هذا سيحسم الأمر.»' },
      { e: '😰', name: { en: 'Tarek', ar: 'طارق' }, en: '“You won’t find anything on it! I mean… fingerprints fade fast, right?”', ar: '«لن تجدي عليه شيئاً! أقصد… البصمات تزول بسرعة، أليس كذلك؟»' },
    ],
    q: { en: 'Who raided the jar?', ar: 'مَن أغار على البرطمان؟' },
    options: [
      { id: 'sami', e: '🙋', en: 'Sami', ar: 'سامي' },
      { id: 'yara', e: '🙆', en: 'Yara', ar: 'يارا' },
      { id: 'tarek', e: '😰', en: 'Tarek', ar: 'طارق' },
    ],
    answer: 'tarek', key: { in: 'wits', i: 2 },
    sol: [
      { en: 'The innocent welcome the test — they know their prints aren’t there.', ar: 'الأبرياء يرحّبون بالفحص — فهم يعرفون أن بصماتهم ليست هناك.' },
      { en: 'Only the person who WIPED the jar knows nothing will be found. Tarek blurted out exactly that — knowledge only the culprit could have.', ar: 'وحده من مسح البرطمان يعرف أن الفحص لن يجد شيئاً. وهذا بالضبط ما أفلت من لسان طارق — معرفةٌ لا يملكها إلا الفاعل.' },
    ],
  },
  {
    id: 'stopped-clock', tier: 2, e: '🕰️',
    title: { en: 'The Clock That Reads 7:40', ar: 'الساعة المتوقفة عند ٧:٤٠' },
    intro: { en: 'The office charity box disappeared between seven and eight in the evening. Everyone’s departure was verified — except Nadia’s.', ar: 'اختفى صندوق التبرعات من المكتب بين السابعة والثامنة مساءً. تحقّق المحقّق من مغادرة الجميع — إلا نادية.' },
    facts: [
      { e: '⚡', en: 'A storm blackout the previous day froze the old wall clock at 7:40 — it has read 7:40 ever since.', ar: 'انقطاع كهرباء في اليوم السابق أوقف ساعة الحائط القديمة عند ٧:٤٠ — وبقيت تُشير إلى ٧:٤٠ منذ ذلك الحين.' },
    ],
    wits: [
      { e: '👩‍💼', name: { en: 'Nadia', ar: 'نادية' }, en: '“I left at seven sharp. I’m certain, because on my way out I glanced at the wall clock and it said exactly seven.”', ar: '«غادرتُ في السابعة تماماً. متأكدة، لأنني نظرت إلى ساعة الحائط وأنا خارجة وكانت تشير إلى السابعة بالضبط.»' },
    ],
    q: { en: 'What does her story reveal?', ar: 'ماذا تكشف روايتها؟' },
    options: [
      { id: 'honest', e: '✅', en: 'She left at seven, as she says', ar: 'غادرت في السابعة كما تقول' },
      { id: 'lie', e: '❌', en: 'The detail is invented — the clock could never show 7:00', ar: 'التفصيلة مختلَقة — الساعة لا يمكن أن تُظهر السابعة' },
      { id: 'fast', e: '⏰', en: 'The clock was simply running fast', ar: 'الساعة كانت مقدَّمة فحسب' },
    ],
    answer: 'lie', key: { in: 'facts', i: 0 },
    sol: [
      { en: 'The clock froze at 7:40 the day BEFORE. At any moment of that evening, it read 7:40 — never “exactly seven”.', ar: 'الساعة توقفت عند ٧:٤٠ في اليوم السابق. في أي لحظة من ذلك المساء كانت تُشير إلى ٧:٤٠ — لا إلى «السابعة بالضبط».' },
      { en: 'She invented a supporting detail without checking it — which means the seven-o’clock exit itself is invented. She was still there in the theft hour.', ar: 'اختلقت تفصيلة داعمة دون أن تتحقّق منها — ما يعني أن خروج السابعة نفسه مختلَق. كانت لا تزال هناك في ساعة السرقة.' },
    ],
  },
  {
    id: 'ferry-stub', tier: 2, e: '⛴️',
    title: { en: 'The Ferry Ticket', ar: 'تذكرة العبّارة' },
    intro: { en: 'The island kiosk was robbed at 2:15. Fadi claims he was still crossing the sea when it happened. Then a ticket stub fell out of his pocket.', ar: 'سُرق كشك الجزيرة في ٢:١٥. يدّعي فادي أنه كان ما يزال يعبر البحر حين وقعت السرقة. ثم سقطت من جيبه قسيمة تذكرة.' },
    facts: [
      { e: '⛴️', en: 'The crossing takes exactly one hour, and ferries leave the mainland on the hour.', ar: 'العبور يستغرق ساعة كاملة، والعبّارات تغادر البرّ على رأس كل ساعة.' },
      { e: '🎫', en: 'The stub from his pocket is stamped: “Mainland departure — 1:00.”', ar: 'القسيمة التي سقطت من جيبه مختومة: «مغادرة البرّ — ١:٠٠».' },
    ],
    wits: [
      { e: '🧢', name: { en: 'Fadi', ar: 'فادي' }, en: '“I took the two-o’clock ferry — I only reached the island at three, long after the robbery. Simple!”', ar: '«ركبتُ عبّارة الثانية — ولم أصل الجزيرة إلا في الثالثة، بعد السرقة بوقت طويل. الأمر بسيط!»' },
    ],
    q: { en: 'What does the ticket stub prove?', ar: 'ماذا تُثبت قسيمة التذكرة؟' },
    options: [
      { id: 'clears', e: '✅', en: 'It backs his story', ar: 'تدعم روايته' },
      { id: 'busts', e: '❌', en: 'He sailed at 1:00 — he was on the island by 2:00, before the robbery', ar: 'أبحر في ١:٠٠ — فوصل الجزيرة في ٢:٠٠، قبل السرقة' },
      { id: 'nothing', e: '🤷', en: 'Nothing — stubs get reused', ar: 'لا شيء — القسائم يُعاد استعمالها' },
    ],
    answer: 'busts', key: { in: 'facts', i: 1 },
    sol: [
      { en: 'His own stub says he departed at 1:00. With a one-hour crossing, he stepped onto the island at 2:00.', ar: 'قسيمته تقول إنه غادر في ١:٠٠. وبعبورٍ مدّته ساعة، وطئ الجزيرة في ٢:٠٠.' },
      { en: 'That puts him on the island fifteen minutes BEFORE the 2:15 robbery — the very window his “two-o’clock ferry” story was built to erase.', ar: 'أي أنه كان على الجزيرة قبل سرقة ٢:١٥ بربع ساعة — وهي الفترة ذاتها التي اختُلقت رواية «عبّارة الثانية» لمحوها.' },
    ],
  },

  // ═══════════════════════ TIER 3 ═══════════════════════
  {
    id: 'science-fair', tier: 3, e: '🌋',
    title: { en: 'The Science Fair Sabotage', ar: 'تخريب معرض العلوم' },
    intro: { en: 'Between 8:00 and 8:30, someone wrecked the volcano model in the gym storeroom. Only four students were in the building, and the detective took all four statements.', ar: 'بين ٨:٠٠ و٨:٣٠ خرّب أحدهم مجسّم البركان في مخزن القاعة الرياضية. أربعة طلاب فقط كانوا في المبنى، وقد أخذ المحقّق أقوالهم جميعاً.' },
    facts: [
      { e: '🏫', en: 'The four students were the only people inside the building that half hour.', ar: 'الطلاب الأربعة كانوا وحدهم داخل المبنى في تلك النصف ساعة.' },
    ],
    wits: [
      { e: '👧', name: { en: 'Nour', ar: 'نور' }, en: '“I was with Sami in the hallway the entire half hour.”', ar: '«كنت مع سامي في الممرّ طوال النصف ساعة كلها.»' },
      { e: '🧒', name: { en: 'Sami', ar: 'سامي' }, en: '“Yes — Nour and I were together. Rana peeked out of the lab door once and waved.”', ar: '«نعم — كنت أنا ونور معاً. ورنا أطلّت من باب المختبر مرة ولوّحت لنا.»' },
      { e: '👩‍🔬', name: { en: 'Rana', ar: 'رنا' }, en: '“I worked alone in the lab. I peeked into the hallway once — I saw the two of them there.”', ar: '«عملتُ وحدي في المختبر. أطللتُ على الممرّ مرة — ورأيتهما هناك.»' },
      { e: '🧑', name: { en: 'Tarek', ar: 'طارق' }, en: '“I was with Nour and Sami in the hallway the whole time. All three of us, together.”', ar: '«كنت مع نور وسامي في الممرّ طوال الوقت. ثلاثتنا معاً.»' },
    ],
    q: { en: 'Who sabotaged the volcano?', ar: 'مَن خرّب البركان؟' },
    options: [
      { id: 'nour', e: '👧', en: 'Nour', ar: 'نور' },
      { id: 'sami', e: '🧒', en: 'Sami', ar: 'سامي' },
      { id: 'rana', e: '👩‍🔬', en: 'Rana', ar: 'رنا' },
      { id: 'tarek', e: '🧑', en: 'Tarek', ar: 'طارق' },
    ],
    answer: 'tarek', key: { in: 'wits', i: 3 },
    sol: [
      { en: 'Three accounts lock together: Nour and Sami vouch for each other, Sami saw Rana peek out, and Rana saw both of them from the door.', ar: 'ثلاث روايات تتشابك: نور وسامي يشهد كلٌّ للآخر، وسامي رأى رنا تطلّ، ورنا رأتهما من الباب.' },
      { en: 'Not ONE of the three mentions Tarek in the hallway. His “all three of us together” contradicts everyone — the only account that fits nothing is the saboteur’s.', ar: 'لا أحد من الثلاثة ذكر وجود طارق في الممرّ. روايته «ثلاثتنا معاً» تناقض الجميع — والرواية الوحيدة التي لا تنسجم مع شيء هي رواية المخرّب.' },
    ],
  },
  {
    id: 'liar-rule', tier: 3, e: '⚽',
    title: { en: 'The One False Statement', ar: 'الجملة الكاذبة الوحيدة' },
    intro: { en: 'The team’s match ball was hidden as a prank. The coach knows his players well and is certain of one thing: exactly ONE statement below is false — and it belongs to the prankster.', ar: 'أُخفيت كرة المباراة كمقلب. المدرّب يعرف لاعبيه جيداً وهو متأكد من أمر واحد: جملة واحدة فقط ممّا يلي كاذبة — وصاحبتها هي من دبّرت المقلب.' },
    facts: [
      { e: '⚖️', en: 'Exactly one statement is false, and the one who said it hid the ball.', ar: 'جملة واحدة فقط كاذبة، وقائلتها هي من أخفت الكرة.' },
    ],
    wits: [
      { e: '👧', name: { en: 'Layla', ar: 'ليلى' }, en: '“Hala is lying.”', ar: '«هالة تكذب.»' },
      { e: '👩', name: { en: 'Hala', ar: 'هالة' }, en: '“Dina hid it.”', ar: '«دينا أخفتها.»' },
      { e: '🧕', name: { en: 'Dina', ar: 'دينا' }, en: '“I didn’t hide it.”', ar: '«أنا لم أخفِها.»' },
    ],
    q: { en: 'Who hid the ball?', ar: 'مَن أخفى الكرة؟' },
    options: [
      { id: 'layla', e: '👧', en: 'Layla', ar: 'ليلى' },
      { id: 'hala', e: '👩', en: 'Hala', ar: 'هالة' },
      { id: 'dina', e: '🧕', en: 'Dina', ar: 'دينا' },
    ],
    answer: 'hala', key: { in: 'facts', i: 0 },
    sol: [
      { en: 'Suppose Layla’s is the false one: then Hala tells the truth, so Dina hid it — but then Dina’s denial is ALSO false. Two lies — impossible.', ar: 'افترض أن جملة ليلى هي الكاذبة: إذاً هالة صادقة ودينا أخفتها — لكن حينها إنكار دينا كاذب أيضاً. كذبتان — مستحيل.' },
      { en: 'Suppose Dina’s is the false one: she hid it, Hala spoke truth — but Layla’s “Hala is lying” becomes false too. Again two lies.', ar: 'افترض أن جملة دينا هي الكاذبة: هي أخفتها وهالة صادقة — لكن جملة ليلى «هالة تكذب» تصبح كاذبة أيضاً. كذبتان من جديد.' },
      { en: 'Only one option survives: Hala’s is the single false statement — Layla and Dina both spoke truth. The liar is the prankster: Hala.', ar: 'يبقى احتمال وحيد: جملة هالة هي الكاذبة الوحيدة — وليلى ودينا صادقتان. والكاذبة هي صاحبة المقلب: هالة.' },
    ],
  },
  {
    id: 'twin-gates', tier: 3, e: '👯',
    title: { en: 'The Twin Gatekeepers', ar: 'الحارسان التوأمان' },
    intro: { en: 'The runaway pony bolted past the twin gatekeepers — one twin ALWAYS tells the truth, the other ALWAYS lies, and nobody can tell them apart. Detective Kawkab could ask only one question. He asked one twin: “If I asked your brother which way the pony went, what would he say?” The twin replied: “He would say it went LEFT.”', ar: 'انطلق المهر الهارب عبر بوابة الحارسين التوأمين — أحدهما يقول الصدق دائماً والآخر يكذب دائماً، ولا أحد يفرّق بينهما. لم يكن أمام المحقّق كوكب سوى سؤال واحد، فسأل أحدهما: «لو سألتُ أخاك في أي اتجاه ذهب المهر، فماذا سيقول؟» أجاب التوأم: «سيقول إنه ذهب يساراً.»' },
    facts: [
      { e: '👯', en: 'One twin always tells the truth; the other always lies.', ar: 'أحد التوأمين صادق دائماً، والآخر كاذب دائماً.' },
    ],
    wits: [],
    q: { en: 'Which way did the pony really go?', ar: 'في أي اتجاه ذهب المهر حقاً؟' },
    options: [
      { id: 'left', e: '⬅️', en: 'Left', ar: 'يساراً' },
      { id: 'right', e: '➡️', en: 'Right', ar: 'يميناً' },
      { id: 'unknown', e: '🤷', en: 'Impossible to know', ar: 'يستحيل معرفته' },
    ],
    answer: 'right', key: { in: 'facts', i: 0 },
    sol: [
      { en: 'If he asked the TRUTHFUL twin: he honestly reports what his lying brother would say — a lie. The answer “left” is false.', ar: 'إن كان المسؤول هو الصادق: فهو ينقل بأمانة ما سيقوله أخوه الكاذب — أي كذبة. فجواب «يساراً» كاذب.' },
      { en: 'If he asked the LIAR: his truthful brother would say the truth, but the liar reverses it. The reported “left” is false again.', ar: 'وإن كان المسؤول هو الكاذب: فأخوه الصادق سيقول الحقيقة، لكن الكاذب يقلبها. فـ«يساراً» المنقولة كاذبة أيضاً.' },
      { en: 'Either way, the reported answer is always the WRONG direction. The pony went right.', ar: 'في الحالتين، الجواب المنقول هو الاتجاه الخاطئ دائماً. المهر ذهب يميناً.' },
    ],
  },
  {
    id: 'cold-ashes', tier: 3, e: '🔥',
    title: { en: 'The Cold Fireplace', ar: 'المدفأة الباردة' },
    intro: { en: 'The mountain lodge was robbed at nine in the evening. Omar, who lives in the cabin next door, insists he never left home: “I lit my fireplace at six and read beside it until midnight.” The detective visited his cabin the next morning.', ar: 'سُرق النُّزل الجبلي في التاسعة مساءً. عمر، الذي يسكن الكوخ المجاور، يصرّ أنه لم يغادر بيته: «أشعلتُ المدفأة في السادسة وقرأتُ بجانبها حتى منتصف الليل.» زار المحقّق كوخه صباح اليوم التالي.' },
    facts: [
      { e: '🪵', en: 'The ashes in his fireplace were stone cold by morning.', ar: 'رماد مدفأته كان بارداً كالحجر في الصباح.' },
      { e: '🕸️', en: 'An unbroken spider’s web stretched across the inside of the chimney flue.', ar: 'خيوط عنكبوت سليمة تمتدّ عبر مجرى المدخنة من الداخل.' },
    ],
    wits: [
      { e: '🧔', name: { en: 'Omar', ar: 'عمر' }, en: '“Six hours by the fire with my book. Warmest night of the winter, for me at least.”', ar: '«ست ساعات بجانب النار مع كتابي. كانت أدفأ ليلة في الشتاء، لي على الأقل.»' },
    ],
    q: { en: 'Can Omar’s story be true?', ar: 'هل يمكن أن تكون رواية عمر صحيحة؟' },
    options: [
      { id: 'true', e: '✅', en: 'Yes — ashes cool overnight', ar: 'نعم — الرماد يبرد خلال الليل' },
      { id: 'false', e: '❌', en: 'No — no fire burned there at all', ar: 'لا — لم تشتعل نارٌ هناك إطلاقاً' },
      { id: 'maybe', e: '🤷', en: 'Can’t be decided', ar: 'لا يمكن الحسم' },
    ],
    answer: 'false', key: { in: 'facts', i: 1 },
    sol: [
      { en: 'A six-hour fire ending at midnight leaves ash still warm at sunrise — his was stone cold.', ar: 'نارٌ تشتعل ست ساعات حتى منتصف الليل تُبقي الرماد دافئاً عند الشروق — ورماده كان بارداً كالحجر.' },
      { en: 'Stronger still: hot smoke destroys any web in the flue. An unbroken spider’s web means no fire has burned there for DAYS. The whole cosy evening was invented.', ar: 'والأقوى: الدخان الساخن يُتلف أي خيوط في المجرى. شبكة العنكبوت السليمة تعني أن المدفأة لم تُشعَل منذ أيام. الأمسية الدافئة كلها مختلَقة.' },
    ],
  },
  {
    id: 'dry-coat', tier: 3, e: '🧥',
    title: { en: 'The Dry Coat', ar: 'المعطف الجاف' },
    intro: { en: 'The tailor’s shop was robbed between 3:30 and 3:45, while the clerk stepped out. The visitor log and the weather tell an interesting story.', ar: 'سُرق محل الخيّاط بين ٣:٣٠ و٣:٤٥ بينما خرج الموظف لدقائق. سجلّ الزوّار وحالة الطقس يرويان قصة مثيرة.' },
    facts: [
      { e: '🌧️', en: 'Heavy rain fell nonstop from 3:00 onward.', ar: 'هطل مطر غزير بلا توقّف من الساعة ٣:٠٠ فصاعداً.' },
      { e: '📖', en: 'Visitor log: Salma 2:00–2:30 · Ziad entered 3:30 · Mona 5:00.', ar: 'سجلّ الزوّار: سلمى ٢:٠٠–٢:٣٠ · زياد دخل ٣:٣٠ · منى ٥:٠٠.' },
      { e: '🧥', en: 'When Ziad hung up his coat at 3:30, it was perfectly dry.', ar: 'حين علّق زياد معطفه عند ٣:٣٠ كان جافاً تماماً.' },
    ],
    wits: [
      { e: '🚶', name: { en: 'Ziad', ar: 'زياد' }, en: '“I walked over at 3:30 — five minutes through the rain, no umbrella. Then I browsed the fabrics until the clerk returned.”', ar: '«جئت ماشياً عند ٣:٣٠ — خمس دقائق تحت المطر بلا مظلة. ثم رحت أتفرّج على الأقمشة حتى عاد الموظف.»' },
    ],
    q: { en: 'What does the dry coat reveal?', ar: 'ماذا يكشف المعطف الجاف؟' },
    options: [
      { id: 'honest', e: '✅', en: 'Nothing — coats dry quickly', ar: 'لا شيء — المعاطف تجفّ سريعاً' },
      { id: 'inside', e: '❌', en: 'Ziad never walked through the rain — he was already inside before 3:00', ar: 'زياد لم يمشِ تحت المطر — كان في الداخل أصلاً قبل ٣:٠٠' },
      { id: 'salma', e: '👩', en: 'Salma came back secretly', ar: 'سلمى عادت خفية' },
    ],
    answer: 'inside', key: { in: 'facts', i: 2 },
    sol: [
      { en: 'Five minutes of heavy rain with no umbrella soaks a coat through. His was perfectly dry at 3:30.', ar: 'خمس دقائق من مطر غزير بلا مظلة تُشبع المعطف بللاً. ومعطفه كان جافاً تماماً عند ٣:٣٠.' },
      { en: 'So he never walked over at 3:30 — he had slipped inside BEFORE the rain began at 3:00 and hid. The “3:30 entrance” in the log was staged, right before the clerk stepped out.', ar: 'إذاً لم يأتِ ماشياً عند ٣:٣٠ — بل تسلّل إلى الداخل قبل بدء المطر عند ٣:٠٠ واختبأ. و«دخول ٣:٣٠» في السجل تمثيلية، قُبيل خروج الموظف مباشرة.' },
    ],
  },
  {
    id: 'shadow-map', tier: 3, e: '🗺️',
    title: { en: 'The Forged Map', ar: 'الخريطة المزوّرة' },
    intro: { en: 'Someone swapped the treasure-hunt map to send the other teams the wrong way. The forged sheet is labelled “sketched ON SITE at nine in the morning” and shows the flagpole with its shadow stretching EAST.', ar: 'بدّل أحدهم خريطة البحث عن الكنز ليضلّل الفرق الأخرى. الورقة المزوّرة كُتب عليها «رُسمت في الموقع في التاسعة صباحاً» وتُظهر سارية العلم وظلَّها ممتداً شرقاً.' },
    facts: [
      { e: '🌅', en: 'At nine in the morning, the sun hangs in the EAST.', ar: 'في التاسعة صباحاً تكون الشمس في جهة الشرق.' },
      { e: '☀️', en: 'A shadow always falls on the side AWAY from the sun.', ar: 'الظل يمتدّ دائماً في الجهة المقابلة للشمس.' },
    ],
    wits: [
      { e: '✏️', name: { en: 'Hadi', ar: 'هادي' }, en: '“I sketched that sheet myself, standing right by the flagpole at nine sharp. Every detail is from life.”', ar: '«رسمتُ تلك الورقة بنفسي واقفاً عند السارية في التاسعة تماماً. كل تفصيلة منقولة عن الواقع.»' },
      { e: '🏠', name: { en: 'Rana', ar: 'رنا' }, en: '“I only copied an old map at home. I never went to the yard.”', ar: '«أنا نسختُ خريطة قديمة في البيت فقط. لم أذهب إلى الساحة إطلاقاً.»' },
    ],
    q: { en: 'Who forged the map?', ar: 'مَن زوّر الخريطة؟' },
    options: [
      { id: 'hadi', e: '✏️', en: 'Hadi — his “from life” sketch is impossible', ar: 'هادي — رسمه «عن الواقع» مستحيل' },
      { id: 'rana', e: '🏠', en: 'Rana — copying maps is suspicious', ar: 'رنا — نسخ الخرائط أمر مريب' },
      { id: 'neither', e: '🤷', en: 'Neither can be blamed', ar: 'لا يمكن اتهام أحد' },
    ],
    answer: 'hadi', key: { in: 'facts', i: 0 },
    sol: [
      { en: 'With the morning sun in the east, the flagpole’s shadow must stretch WEST — away from the sun.', ar: 'ما دامت شمس الصباح في الشرق، فظلّ السارية يجب أن يمتدّ غرباً — بعيداً عن الشمس.' },
      { en: 'The sheet shows an eastward shadow at 9 a.m. — a scene that has never existed. Whoever “sketched it from life on site” is lying about the sheet’s origin: Hadi drew it from imagination to mislead.', ar: 'الورقة تُظهر ظلاً شرقياً في التاسعة صباحاً — مشهدٌ لا وجود له أصلاً. من ادّعى أنه «رسمها عن الواقع في الموقع» يكذب بشأن أصلها: هادي رسمها من خياله ليضلّل.' },
    ],
  },
  {
    id: 'tide-gangway', tier: 3, e: '⛵',
    title: { en: 'The Drowned Gangway', ar: 'المعبر الغارق' },
    intro: { en: 'The yacht’s cabin was robbed between 3:00 and 3:30. The harbour’s tide chart turned out to be the sharpest witness of all.', ar: 'سُرقت قمرة اليخت بين ٣:٠٠ و٣:٣٠. وتبيّن أن جدول المدّ والجزر في المرفأ هو أدقّ الشهود جميعاً.' },
    facts: [
      { e: '🌊', en: 'Until 3:15 the tide kept the gangway underwater — before that, the yacht could only be reached by rowing boat.', ar: 'حتى ٣:١٥ كان المدّ يُغرق المعبر الخشبي — وقبل ذلك لا يمكن بلوغ اليخت إلا بقارب تجديف.' },
    ],
    wits: [
      { e: '🚶', name: { en: 'Walid', ar: 'وليد' }, en: '“I WALKED up the gangway at 3:05 for a quick look, saw nothing odd, and left by 3:10.”', ar: '«صعدتُ المعبر مشياً عند ٣:٠٥ لإلقاء نظرة سريعة، لم أرَ شيئاً غريباً، وغادرت عند ٣:١٠.»' },
      { e: '🚣', name: { en: 'Rana', ar: 'رنا' }, en: '“I rowed out at 3:20 to deliver supplies, handed them up, and rowed straight back.”', ar: '«جدّفتُ عند ٣:٢٠ لتسليم المؤن، ناولتها وعدت مباشرة.»' },
    ],
    q: { en: 'Whose story is impossible?', ar: 'روايةُ مَن مستحيلة؟' },
    options: [
      { id: 'walid', e: '🚶', en: 'Walid’s', ar: 'رواية وليد' },
      { id: 'rana', e: '🚣', en: 'Rana’s', ar: 'رواية رنا' },
      { id: 'both', e: '🤷', en: 'Both hold up', ar: 'الروايتان صامدتان' },
    ],
    answer: 'walid', key: { in: 'facts', i: 0 },
    sol: [
      { en: 'At 3:05 the gangway was still underwater — nobody “walked up” it before 3:15.', ar: 'عند ٣:٠٥ كان المعبر لا يزال غارقاً — لا أحد «صعده مشياً» قبل ٣:١٥.' },
      { en: 'Rana’s rowing at 3:20 fits the tide perfectly. Walid’s stroll cannot have happened as told — he reached the yacht another way, or at another time, and lied to cover it.', ar: 'تجديف رنا عند ٣:٢٠ ينسجم تماماً مع المدّ. أما نزهة وليد فلا يمكن أن تكون حدثت كما رواها — بلغ اليخت بطريقة أخرى أو في وقت آخر، وكذب ليغطي ذلك.' },
    ],
  },
  {
    id: 'gallery-copy', tier: 3, e: '🖼️',
    title: { en: 'The Ten-Minute Masterpiece', ar: 'تحفة الدقائق العشر' },
    intro: { en: 'During a ten-minute fire drill, the gallery’s masterpiece was swapped for a copy. The detective gathered three findings.', ar: 'خلال إخلاء تجريبي دام عشر دقائق، استُبدلت تحفة المعرض بنسخة مقلَّدة. جمع المحقّق ثلاث نتائج.' },
    facts: [
      { e: '🚨', en: 'The false alarm was triggered from the staff-only basement.', ar: 'إنذار الحريق الكاذب أُطلق من القبو المخصّص للموظفين فقط.' },
      { e: '🎨', en: 'The copy’s paint still smelled fresh — painted within the last few days by a skilled hand.', ar: 'رائحة طلاء النسخة ما تزال طازجة — رُسمت خلال الأيام الأخيرة بيدٍ ماهرة.' },
      { e: '🔑', en: 'The frame opens only with a special key held by two people: the director (verified abroad all week) and the restorer.', ar: 'إطار اللوحة لا يُفتح إلا بمفتاح خاص يحمله شخصان: المدير (مثبتٌ سفره طوال الأسبوع) والمرمِّم.' },
    ],
    wits: [
      { e: '🧑‍🎨', name: { en: 'The restorer', ar: 'المرمِّم' }, en: '“I evacuated with everyone else. Ask the crowd outside.”', ar: '«خرجتُ مع الجميع في الإخلاء. اسألوا الحشد في الخارج.»' },
    ],
    q: { en: 'Who swapped the painting?', ar: 'مَن بدّل اللوحة؟' },
    options: [
      { id: 'restorer', e: '🧑‍🎨', en: 'The restorer', ar: 'المرمِّم' },
      { id: 'director', e: '💼', en: 'The director', ar: 'المدير' },
      { id: 'visitor', e: '🎟️', en: 'A visitor in the crowd', ar: 'زائر من الحشد' },
    ],
    answer: 'restorer', key: { in: 'facts', i: 2 },
    sol: [
      { en: 'Follow each clue: the alarm needed basement access (staff only) — a visitor is out.', ar: 'تتبّع كل دليل: الإنذار يحتاج دخول القبو (للموظفين فقط) — فالزائر مستبعَد.' },
      { en: 'The frame needed one of two keys, and the director was provably abroad. The fresh, skilled copy fits a restorer’s hands. Every line of evidence crosses at one person.', ar: 'والإطار يحتاج أحد مفتاحين، والمدير مثبتٌ سفره. والنسخة الطازجة المتقنة تليق بيد مرمِّم. كل خيوط الأدلة تتقاطع عند شخص واحد.' },
    ],
  },
  {
    id: 'backward-boots', tier: 3, e: '👣',
    title: { en: 'The Trail That Walks Out', ar: 'الأثر الخارج من السقيفة' },
    intro: { en: 'The tool shed was raided. In the mud, a single trail of boot-prints seems to WALK OUT of the shed towards the fence — and no trail walks in. The gardener swears the shed was fine at noon.', ar: 'سُطي على سقيفة العدّة. في الوحل خطٌّ واحد من آثار الأحذية يبدو خارجاً من السقيفة نحو السياج — ولا أثر لأي دخول. البستانيّ يقسم أن السقيفة كانت سليمة ظهراً.' },
    facts: [
      { e: '👣', en: 'In every print of the trail, the TOE end is pressed deeper than the heel.', ar: 'في كل طبعة من الأثر، مقدّمة القدم مغروسة أعمق من الكعب.' },
      { e: '🚶', en: 'Walking normally, the HEEL strikes deepest. Walking backwards, the TOES press deepest.', ar: 'في المشي الطبيعي يكون الكعب هو الأعمق. أما في المشي إلى الخلف فتغوص الأصابع أكثر.' },
    ],
    wits: [],
    q: { en: 'What do the prints really show?', ar: 'ماذا تُظهر الآثار حقاً؟' },
    options: [
      { id: 'left', e: '🏃', en: 'The thief left the shed and never entered — impossible but there it is', ar: 'اللص خرج من السقيفة دون أن يدخلها — أمرٌ محيّر' },
      { id: 'backwards', e: '🔄', en: 'Someone walked BACKWARDS into the shed to fake a leaving trail', ar: 'أحدهم مشى إلى الخلف نحو السقيفة ليصنع أثر خروجٍ مزيّف' },
      { id: 'old', e: '🕰️', en: 'The prints are days old', ar: 'الآثار قديمة منذ أيام' },
    ],
    answer: 'backwards', key: { in: 'facts', i: 0 },
    sol: [
      { en: 'Toes deeper than heels is the signature of walking BACKWARDS.', ar: 'غوص الأصابع أعمق من الكعب هو بصمة المشي إلى الخلف.' },
      { en: 'So the “leaving” trail was made by someone stepping backwards INTO the shed — faking a departed thief while actually going in. Check who is still nearby… and whose boots fit.', ar: 'إذاً أثرُ «الخروج» صنعه من مشى إلى الخلف داخلاً إلى السقيفة — ليوهم بلصٍّ غادر بينما هو داخل. فابحث عمّن لا يزال قريباً… وعمّن يناسب الحذاء قدمه.' },
    ],
  },
  {
    id: 'torn-ledger', tier: 3, e: '📖',
    title: { en: 'The Torn Ledger Page', ar: 'صفحة السجلّ الممزّقة' },
    intro: { en: 'The library’s prize atlas is missing, and the page recording its last borrower has been torn out of the ledger. Dead end? The librarian writes with a very heavy hand.', ar: 'أطلس المكتبة الثمين مفقود، والصفحة التي تسجّل آخر مستعير له مُزّقت من السجلّ. طريق مسدود؟ لكنّ أمينة المكتبة تكتب بضغطة قلمٍ قوية جداً.' },
    facts: [
      { e: '✍️', en: 'The librarian’s pen pressed through to the page beneath the torn one.', ar: 'قلم الأمينة يضغط حتى يترك أثراً في الصفحة التي تلي الممزّقة.' },
      { e: '✏️', en: 'Shading that page gently with a pencil revealed the imprint: “Star Atlas — H. Mansour — Tuesday.”', ar: 'تظليل تلك الصفحة برفقٍ بقلم رصاص أظهر الانطباع: «أطلس النجوم — هـ. منصور — الثلاثاء».' },
    ],
    wits: [
      { e: '🧑', name: { en: 'Hadi Mansour', ar: 'هادي منصور' }, en: '“I never borrowed the atlas. I’ve never even touched that shelf, honestly.”', ar: '«لم أستعر الأطلس قط. بل لم ألمس ذلك الرفّ أصلاً، بصراحة.»' },
    ],
    q: { en: 'What does the pencil shading prove?', ar: 'ماذا يُثبت التظليل بقلم الرصاص؟' },
    options: [
      { id: 'nothing', e: '🤷', en: 'Nothing — imprints aren’t reliable', ar: 'لا شيء — الانطباعات غير موثوقة' },
      { id: 'hadi', e: '🧑', en: 'The torn page named Hadi — he tore it and his denial is false', ar: 'الصفحة الممزّقة كانت تحمل اسم هادي — هو من مزّقها وإنكاره كاذب' },
      { id: 'librarian', e: '👩‍🏫', en: 'The librarian lost the atlas herself', ar: 'الأمينة أضاعت الأطلس بنفسها' },
    ],
    answer: 'hadi', key: { in: 'facts', i: 1 },
    sol: [
      { en: 'The imprint preserves exactly what the torn page said: the atlas went to H. Mansour on Tuesday.', ar: 'الانطباع يحفظ ما كان مكتوباً في الصفحة الممزّقة حرفياً: الأطلس استعاره هـ. منصور يوم الثلاثاء.' },
      { en: 'Tearing the page only helped whoever was named on it. Hadi denied ever touching the shelf — the imprint calls that a lie and hands us the borrower, the tearer, and the thief in one name.', ar: 'تمزيق الصفحة لا يفيد إلا من ورد اسمه فيها. أنكر هادي أنه لمس الرفّ — والانطباع يكذّبه ويسلّمنا المستعير وممزّق الصفحة والسارق في اسم واحد.' },
    ],
  },
  {
    id: 'blue-hands', tier: 3, e: '🧪',
    title: { en: 'The Invisible Powder', ar: 'المسحوق الخفي' },
    intro: { en: 'Expecting a thief, the coach dusted the team fee-box with an invisible powder that turns bright BLUE the moment it is washed with soap and water. Next morning, he inspected everyone’s hands.', ar: 'توقّع المدرّب وجود سارق، فرشّ صندوق اشتراكات الفريق بمسحوقٍ خفيّ يتحوّل إلى أزرق زاهٍ لحظةَ غسله بالماء والصابون. في صباح اليوم التالي فحص أيدي الجميع.' },
    facts: [
      { e: '🧪', en: 'The powder is invisible on dry hands. Only touching the box AND then washing turns the skin blue.', ar: 'المسحوق خفيّ على اليد الجافة. لمسُ الصندوق ثم الغسل هو وحده ما يصبغ الجلد بالأزرق.' },
      { e: '🙌', en: 'Yara’s hands: clean, no blue. Karim’s hands: stained bright blue. Nour’s hands: normal.', ar: 'يدا يارا: نظيفتان بلا زرقة. يدا كريم: مصبوغتان بالأزرق الزاهي. يدا نور: طبيعيتان.' },
    ],
    wits: [
      { e: '😤', name: { en: 'Karim', ar: 'كريم' }, en: '“Blue? That’s from art class! I never went NEAR the fee-box, I swear.”', ar: '«أزرق؟ هذا من حصة الرسم! لم أقترب من صندوق الاشتراكات، أقسم.»' },
    ],
    q: { en: 'What do Karim’s blue hands prove?', ar: 'ماذا تُثبت يدا كريم الزرقاوان؟' },
    options: [
      { id: 'art', e: '🎨', en: 'Just art class paint', ar: 'مجرد ألوان حصة الرسم' },
      { id: 'guilt', e: '🧪', en: 'He touched the box AND washed his hands — the trap caught him', ar: 'لمس الصندوق ثم غسل يديه — الفخّ أمسك به' },
      { id: 'frame', e: '🤔', en: 'Someone painted his hands while he slept', ar: 'أحدهم صبغ يديه أثناء نومه' },
    ],
    answer: 'guilt', key: { in: 'facts', i: 0 },
    sol: [
      { en: 'This exact blue appears ONLY from the trap powder — and only after touching the box and then washing.', ar: 'هذه الزرقة بالذات لا تظهر إلا من مسحوق الفخّ — وفقط بعد لمس الصندوق ثم الغسل.' },
      { en: 'His stained hands prove both the touch and the guilty scrubbing; “I never went near it” is disproven by his own skin. The washing that was meant to hide the crime revealed it.', ar: 'يداه المصبوغتان تُثبتان اللمس والغسلَ المذنب معاً؛ و«لم أقترب منه» تدحضها بشرته نفسها. الغسل الذي أراد به إخفاء الفعلة هو الذي فضحها.' },
    ],
  },
  {
    id: 'new-moon', tier: 3, e: '🌑',
    title: { en: 'Sketch by Moonlight', ar: 'رسمٌ على ضوء القمر' },
    intro: { en: 'To support a big insurance claim about a midnight warehouse theft, a witness came forward with a detailed sketch of the “thief’s face”.', ar: 'دعماً لمطالبة تأمين كبيرة عن سرقة مستودعٍ في منتصف الليل، تقدّم شاهد برسمٍ مفصّل لـ«وجه اللص».' },
    facts: [
      { e: '🌑', en: 'The almanac shows a NEW MOON that night — the sky was black.', ar: 'التقويم الفلكي يُظهر أن القمر كان محاقاً تلك الليلة — السماء سوداء تماماً.' },
      { e: '💡', en: 'The warehouse yard has no lamps at all.', ar: 'ساحة المستودع بلا مصابيح إطلاقاً.' },
    ],
    wits: [
      { e: '🖌️', name: { en: 'Zaki', ar: 'زكي' }, en: '“From my window I watched him for ten whole minutes — the FULL MOON lit the yard like a lamp, so I sketched every detail of his face.”', ar: '«من نافذتي راقبته عشر دقائق كاملة — كان البدر يضيء الساحة كالمصباح، فرسمتُ كل ملامح وجهه.»' },
    ],
    q: { en: 'What is the sketch worth?', ar: 'ما قيمة هذا الرسم؟' },
    options: [
      { id: 'gold', e: '🏅', en: 'Solid evidence — find the sketched man', ar: 'دليل قوي — فتّشوا عن صاحب الوجه' },
      { id: 'fake', e: '❌', en: 'Nothing — there was no moonlight; the testimony is fabricated', ar: 'لا شيء — لم يكن هناك ضوء قمر؛ الشهادة ملفّقة' },
      { id: 'partial', e: '🤔', en: 'Half-reliable — he saw a silhouette', ar: 'نصف موثوقة — رأى ظلاً فقط' },
    ],
    answer: 'fake', key: { in: 'facts', i: 0 },
    sol: [
      { en: 'A new moon gives NO light — and the yard has no lamps. “The full moon lit the yard” describes a night that never happened.', ar: 'القمر المحاق لا ضوء له — والساحة بلا مصابيح. «البدر يضيء الساحة» وصفٌ لليلةٍ لم تقع.' },
      { en: 'A witness lying about HOW he saw cannot be believed about WHAT he saw. The sketch was drawn to prop up the claim — the “witness” is part of the insurance trick.', ar: 'شاهدٌ يكذب في كيفية الرؤية لا يُصدَّق فيما رأى. الرسم أُعدّ لدعم المطالبة — و«الشاهد» شريك في حيلة التأمين.' },
    ],
  },
];

// quick sanity used by the engine
export const TIER_LISTS = [1, 2, 3].map((t) => RIDDLES.filter((r) => r.tier === t));
