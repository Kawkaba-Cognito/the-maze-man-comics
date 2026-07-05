/*
 * Detective — CASE FILES, tier 1 (cozy stakes, clean 3-step chains).
 * Multi-act investigations starring Detective Kawkab + a rotating assistant.
 * Schema (shared by all tiers):
 *   { id, tier, e, title, assistant:{e,name}, prologue, suspects:[{e,name,desc}],
 *     acts:[{ title, story, facts:[{e,en,ar}], wits:[{e,name,en,ar}],
 *             q, options:[{id,e,en,ar}], answer, key:{in:'facts'|'wits',i},
 *             sol:[{en,ar}], reveal }],
 *     epilogue }
 * Rules: every checkpoint deduction must be airtight from the facts shown so far;
 * innocent suspects hide small SECRETS (a lie is not proof of guilt — the lie
 * about the crime is). All text bilingual EN/AR. No religion, no politics.
 */

export const TIER1 = [
  {
    id: 'wedding-cake', tier: 1, e: '🎂',
    title: { en: 'The Vanished Wedding Cake', ar: 'كعكة العرس المختفية' },
    assistant: { e: '👧', name: { en: 'Lola', ar: 'لولا' } },
    prologue: {
      en: 'One hour before the grand hotel wedding, a scream came from the kitchen: the top tier of the five-tier cake — the one with the famous sugar roses — was GONE. Detective Kawkab straightened his hat, and his assistant Lola opened her notebook. Three people had keys to that kitchen this morning.',
      ar: 'قبل ساعة واحدة من العرس الكبير في الفندق، دوّت صرخة من المطبخ: الطبقة العليا من الكعكة ذات الطوابق الخمس — تلك المزيّنة بورود السكر الشهيرة — اختفت! عدّل المحقق كوكب قبعته، وفتحت مساعدته لولا دفترها. ثلاثة أشخاص فقط كانوا يملكون مفاتيح ذلك المطبخ هذا الصباح.',
    },
    suspects: [
      { e: '👨‍🍳', name: { en: 'Chef Basil', ar: 'الشيف باسل' }, desc: { en: 'Decorated the cake himself — and grumbled all week about the flavour the couple chose.', ar: 'زيّن الكعكة بنفسه — وظلّ يتذمّر طوال الأسبوع من النكهة التي اختارها العروسان.' } },
      { e: '🤵', name: { en: 'Ziad the waiter', ar: 'النادل زياد' }, desc: { en: 'Famous for two things: polishing glasses beautifully, and never resisting a snack.', ar: 'مشهور بأمرين: تلميع الكؤوس ببراعة، وعجزه التام عن مقاومة أي وجبة خفيفة.' } },
      { e: '💐', name: { en: 'Salma the florist', ar: 'منسّقة الزهور سلمى' }, desc: { en: 'Her flower arrangements compete with the cake for attention — and she knows it.', ar: 'تنسيقاتها الزهرية تنافس الكعكة على الأنظار — وهي تعرف ذلك جيداً.' } },
    ],
    acts: [
      {
        title: { en: 'The Kitchen Door', ar: 'باب المطبخ' },
        story: {
          en: 'Kawkab started where every good detective starts: who was WHERE. The kitchen door opens only with a staff badge, and the badge machine remembers everything.',
          ar: 'بدأ كوكب من حيث يبدأ كل محقق بارع: مَن كان أين. باب المطبخ لا يُفتح إلا ببطاقة موظف، وجهاز البطاقات يتذكّر كل شيء.',
        },
        facts: [
          { e: '🎫', en: 'The badge log shows exactly three entries this morning: Chef Basil 7:00, Salma 8:15, Ziad 8:40.', ar: 'سجلّ البطاقات يُظهر ثلاثة دخولات فقط هذا الصباح: الشيف باسل ٧:٠٠، سلمى ٨:١٥، زياد ٨:٤٠.' },
          { e: '📸', en: 'The chef photographed the finished cake — complete and perfect — at 8:05.', ar: 'صوّر الشيف الكعكة المكتملة — سليمة وكاملة — في الساعة ٨:٠٥.' },
        ],
        wits: [
          { e: '👨‍🍳', name: { en: 'Chef Basil', ar: 'الشيف باسل' }, en: '“I finished the roses at eight, took my photo, and went to argue with the band about the schedule.”', ar: '«أنهيتُ الورود في الثامنة، التقطتُ صورتي، وذهبت أتجادل مع الفرقة الموسيقية حول البرنامج.»' },
          { e: '💐', name: { en: 'Salma', ar: 'سلمى' }, en: '“I came in at 8:15 to set my flowers by the cake table. I never touched a crumb.”', ar: '«دخلتُ في ٨:١٥ لأرتّب زهوري قرب طاولة الكعكة. لم ألمس فتاتة واحدة.»' },
          { e: '🤵', name: { en: 'Ziad', ar: 'زياد' }, en: '“Me? I was polishing glasses in the hall ALL morning. I never set foot in that kitchen.”', ar: '«أنا؟ كنت ألمّع الكؤوس في الصالة طوال الصباح كله. لم تطأ قدمي ذلك المطبخ.»' },
        ],
        q: { en: 'Whose story is already broken?', ar: 'روايةُ مَن انكسرت منذ الآن؟' },
        options: [
          { id: 'basil', e: '👨‍🍳', en: 'Chef Basil’s', ar: 'رواية الشيف باسل' },
          { id: 'salma', e: '💐', en: 'Salma’s', ar: 'رواية سلمى' },
          { id: 'ziad', e: '🤵', en: 'Ziad’s', ar: 'رواية زياد' },
        ],
        answer: 'ziad', key: { in: 'facts', i: 0 },
        sol: [
          { en: 'Ziad swears he never set foot in the kitchen — but his own badge opened the door at 8:40.', ar: 'يقسم زياد أنه لم يدخل المطبخ — لكن بطاقته هو فتحت الباب في ٨:٤٠.' },
          { en: 'The machine does not gossip and does not forget. Ziad has some explaining to do.', ar: 'الجهاز لا يثرثر ولا ينسى. على زياد أن يشرح أموراً كثيرة.' },
        ],
        reveal: { en: 'Lola underlined 8:40 twice. “Shall we go and shake the truth out of a waiter?”', ar: 'وضعت لولا خطّين تحت «٨:٤٠». «هل نذهب لننتزع الحقيقة من نادلٍ ما؟»' },
      },
      {
        title: { en: 'The Frosting Fingerprint', ar: 'بصمة الكريمة' },
        story: {
          en: 'Cornered, Ziad turned the colour of strawberry glaze and confessed… to something smaller. He HAD sneaked in at 8:40 — for one secret swipe of frosting from the second tier. “But I swear, when I got there, the TOP tier was already gone!” Kawkab studied the cake — and the floor.',
          ar: 'حين حوصر زياد، صار لونه كلون صلصة الفراولة واعترف… بشيء أصغر. لقد تسلّل فعلاً في ٨:٤٠ — من أجل غرفة كريمة سرّية واحدة من الطبقة الثانية. «لكن أقسم، حين وصلت، كانت الطبقة العليا قد اختفت أصلاً!» تفحّص كوكب الكعكة — ثم الأرض.',
        },
        facts: [
          { e: '👆', en: 'One finger-swipe in the second tier’s frosting — exactly Ziad’s size, exactly his story.', ar: 'أثر إصبع واحد في كريمة الطبقة الثانية — بحجم إصبع زياد تماماً، ومطابق لروايته تماماً.' },
          { e: '🛒', en: 'Two thin wheel-tracks of smeared frosting run from the cake table to the freight lift.', ar: 'أثران رفيعان لعجلات ملطّخة بالكريمة يمتدّان من طاولة الكعكة إلى مصعد البضائع.' },
        ],
        wits: [
          { e: '🤵', name: { en: 'Ziad', ar: 'زياد' }, en: '“One taste! ONE! And I’d have confessed sooner but… it’s embarrassing. The top was already missing, I promise.”', ar: '«تذوّقة واحدة! واحدة فقط! وكنت سأعترف أبكر لكن… الأمر محرج. الطبقة العليا كانت مفقودة أصلاً، أعدك.»' },
        ],
        q: { en: 'If Ziad is telling the truth now, what do the wheel-tracks prove?', ar: 'إذا كان زياد صادقاً الآن، فماذا يُثبت أثر العجلات؟' },
        options: [
          { id: 'eaten', e: '😋', en: 'The tier was eaten on the spot', ar: 'أن الطبقة أُكلت في مكانها' },
          { id: 'trolley', e: '🛒', en: 'The tier left on a trolley, toward the freight lift — between 8:05 and 8:40', ar: 'أن الطبقة خرجت على عربة نحو مصعد البضائع — بين ٨:٠٥ و٨:٤٠' },
          { id: 'chef', e: '👨‍🍳', en: 'The chef moved the cake himself', ar: 'أن الشيف نقل الكعكة بنفسه' },
        ],
        answer: 'trolley', key: { in: 'facts', i: 1 },
        sol: [
          { en: 'Nobody eats a whole tier standing up. The frosting-smeared wheels say it ROLLED away — toward the freight lift.', ar: 'لا أحد يأكل طبقة كاملة واقفاً. العجلات الملطّخة بالكريمة تقول إنها تدحرجت — نحو مصعد البضائع.' },
          { en: 'And the window is now razor thin: the cake was whole in the 8:05 photo, and already missing at 8:40. Only one badge entered in between — at 8:15.', ar: 'والنافذة الزمنية صارت ضيقة جداً: الكعكة كانت كاملة في صورة ٨:٠٥، ومفقودة في ٨:٤٠. بطاقة واحدة فقط دخلت بينهما — في ٨:١٥.' },
        ],
        reveal: { en: '“8:15,” whispered Lola, flipping back a page. “That’s the florist.”', ar: 'همست لولا وهي تعود صفحةً إلى الوراء: «٨:١٥… إنها منسّقة الزهور.»' },
      },
      {
        title: { en: 'Petals in the Lift', ar: 'بتلات في المصعد' },
        story: {
          en: 'Down at the freight lift, Kawkab knelt. Among the frosting smears lay three small violet petals — from a rare flower that grows in exactly one bouquet in this hotel. Out in the loading bay, Salma’s flower van stood with a suspiciously sweet-smelling handle.',
          ar: 'عند مصعد البضائع، ركع كوكب. بين لطخات الكريمة كانت ثلاث بتلات بنفسجية صغيرة — من زهرة نادرة لا توجد إلا في باقة واحدة في هذا الفندق كله. وفي ساحة التحميل، وقفت شاحنة زهور سلمى ومقبضها تفوح منه رائحة حلوة مريبة.',
        },
        facts: [
          { e: '🌸', en: 'Three petals of Salma’s rare violets lay inside the freight lift, on top of the frosting smears.', ar: 'ثلاث بتلات من بنفسج سلمى النادر داخل مصعد البضائع، فوق لطخات الكريمة.' },
          { e: '🚐', en: 'The handle of Salma’s van is smeared with white frosting. Inside: an empty cake stand.', ar: 'مقبض شاحنة سلمى ملطّخ بكريمة بيضاء. وفي الداخل: حامل كعك فارغ.' },
        ],
        wits: [
          { e: '💐', name: { en: 'Salma', ar: 'سلمى' }, en: '“Petals fall everywhere, detective. That proves nothing. Nothing!”', ar: '«البتلات تتساقط في كل مكان أيها المحقق. هذا لا يثبت شيئاً. لا شيء!»' },
        ],
        q: { en: 'Time to close the case. Who took the top tier?', ar: 'حان وقت إغلاق القضية. مَن أخذ الطبقة العليا؟' },
        options: [
          { id: 'basil', e: '👨‍🍳', en: 'Chef Basil', ar: 'الشيف باسل' },
          { id: 'ziad', e: '🤵', en: 'Ziad the waiter', ar: 'النادل زياد' },
          { id: 'salma', e: '💐', en: 'Salma the florist', ar: 'منسّقة الزهور سلمى' },
        ],
        answer: 'salma', key: { in: 'facts', i: 1 },
        sol: [
          { en: 'The window: 8:05–8:40. The only badge in that window: Salma, 8:15.', ar: 'النافذة الزمنية: ٨:٠٥–٨:٤٠. البطاقة الوحيدة فيها: سلمى، ٨:١٥.' },
          { en: 'Her rare petals lie ON TOP of the frosting trail — dropped while wheeling the tier. And frosting on her van handle finishes the story.', ar: 'بتلاتها النادرة فوق أثر الكريمة — سقطت أثناء دفع العربة. والكريمة على مقبض شاحنتها تُكمل الحكاية.' },
          { en: 'Ziad lied — about a snack. The real crime rolled out on flower-scented wheels.', ar: 'كذب زياد — بشأن وجبة خفيفة. أما الجريمة الحقيقية فتدحرجت على عجلاتٍ برائحة الزهور.' },
        ],
      },
    ],
    epilogue: {
      en: 'Salma burst into tears before Kawkab even finished. She hadn’t meant to KEEP it — she wanted one hour with the sugar roses in her van, to copy the design she’d envied all week, then sneak the tier back. The lift, the trolley, the timing… all planned. The petals, not so much. The tier was rescued, the chef repaired one squashed rose while muttering darkly, and the wedding went ahead — with Ziad, by way of apology, serving every slice and tasting none. Lola closed her notebook: CASE CLOSED.',
      ar: 'انفجرت سلمى بالبكاء قبل أن يُكمل كوكب كلامه. لم تكن تنوي الاحتفاظ بها — أرادت ساعة واحدة مع ورود السكر في شاحنتها، لتنسخ التصميم الذي حسدته عليه طوال الأسبوع، ثم تعيد الطبقة خفية. المصعد، العربة، التوقيت… كلها مخطّطة. أما البتلات، فلا. أُنقذت الطبقة، وأصلح الشيف وردةً منبعجة وهو يتمتم بغضب، وأقيم العرس — وقام زياد، على سبيل الاعتذار، بتقديم كل قطعة دون أن يتذوّق واحدة. أغلقت لولا دفترها: القضية مُغلقة.',
    },
  },

  {
    id: 'parrot-witness', tier: 1, e: '🦜',
    title: { en: 'The Parrot Who Knew Too Much', ar: 'الببغاء الذي عرف أكثر مما ينبغي' },
    assistant: { e: '🧒', name: { en: 'Ramy', ar: 'رامي' } },
    prologue: {
      en: 'Grandma Warda’s parrot, Captain, wears a thin gold ring on his leg — a family treasure. Last night, someone crept into her courtyard, and by morning the ring was gone. Captain, the only witness, can’t point a wing… but he CAN talk. Detective Kawkab arrived with his assistant Ramy, who had already made friends with the bird.',
      ar: 'ببغاء الجدة وردة، «كابتن»، يلبس في ساقه خاتماً ذهبياً رفيعاً — كنزاً عائلياً. الليلة الماضية تسلّل أحدهم إلى فنائها، ومع الصباح كان الخاتم قد اختفى. كابتن، الشاهد الوحيد، لا يستطيع أن يشير بجناحه… لكنه يستطيع الكلام. وصل المحقق كوكب مع مساعده رامي، الذي كان قد صادق الطائر بالفعل.',
    },
    suspects: [
      { e: '🧢', name: { en: 'Tarek next door', ar: 'الجار طارق' }, desc: { en: 'Has begged his parents for a parrot for a year. Knows Captain’s cage latch by heart.', ar: 'يتوسّل والديه منذ سنة ليشتريا له ببغاء. يعرف قفل قفص كابتن عن ظهر قلب.' } },
      { e: '📦', name: { en: 'Rana the courier', ar: 'الساعية رنا' }, desc: { en: 'Delivers at dawn. Her route passes the courtyard gate every single day.', ar: 'توزّع الطرود فجراً. طريقها يمرّ ببوابة الفناء كل يوم بلا استثناء.' } },
      { e: '🎬', name: { en: 'Cousin Hadi', ar: 'ابن العم هادي' }, desc: { en: 'Staying upstairs this month. Says he watches films until very, very late.', ar: 'يقيم في الطابق العلوي هذا الشهر. يقول إنه يشاهد الأفلام حتى وقت متأخر جداً جداً.' } },
    ],
    acts: [
      {
        title: { en: 'What the Captain Said', ar: 'ما قاله الكابتن' },
        story: {
          en: 'All morning, Captain had been squawking one new phrase over and over, a phrase nobody taught him: “CAREFUL, THE PAINT! CAREFUL, THE PAINT!” Ramy offered him a seed. Kawkab offered him his full attention.',
          ar: 'طوال الصباح ظلّ كابتن يصرخ بعبارة واحدة جديدة، عبارة لم يعلّمه إياها أحد: «انتبه، الطلاء! انتبه، الطلاء!» قدّم له رامي حبّة، وقدّم له كوكب كامل انتباهه.',
        },
        facts: [
          { e: '🦜', en: 'Parrots repeat what they HEAR. Captain learned this phrase last night — nobody in the house has said it.', ar: 'الببغاوات تكرر ما تسمعه. تعلّم كابتن هذه العبارة الليلة الماضية — ولم يقلها أحد في البيت.' },
          { e: '🏠', en: 'Nothing in Grandma Warda’s house or courtyard has been painted in months.', ar: 'لا شيء في بيت الجدة وردة أو فنائها طُلي منذ شهور.' },
        ],
        wits: [
          { e: '👵', name: { en: 'Grandma Warda', ar: 'الجدة وردة' }, en: '“He only ever repeats what he hears with his own ears. Last week he learned the milkman’s whistle in one night.”', ar: '«لا يكرر إلا ما يسمعه بأذنيه. الأسبوع الماضي حفظ صفير بائع الحليب في ليلة واحدة.»' },
        ],
        q: { en: 'What is the parrot’s phrase actually worth?', ar: 'ما قيمة عبارة الببغاء فعلاً؟' },
        options: [
          { id: 'nothing', e: '🤷', en: 'Nothing — birds babble', ar: 'لا شيء — الطيور تُهذي' },
          { id: 'paint', e: '🎨', en: 'The thief said it — so the thief was worried about fresh paint, somewhere, last night', ar: 'اللص هو من قالها — إذاً كان اللص قلقاً من طلاء طري، في مكان ما، الليلة الماضية' },
          { id: 'warning', e: '⚠️', en: 'Someone was warning Grandma about her fence', ar: 'أحدهم كان يحذّر الجدة بشأن سياجها' },
        ],
        answer: 'paint', key: { in: 'facts', i: 0 },
        sol: [
          { en: 'Captain repeats what he hears, and he heard this LAST NIGHT — from the only stranger in the courtyard: the thief.', ar: 'كابتن يكرر ما يسمع، وقد سمع هذه العبارة الليلة الماضية — من الغريب الوحيد في الفناء: اللص.' },
          { en: 'So the thief, mid-crime, was fussing about wet paint. Find the fresh paint, and you find where the thief came from.', ar: 'إذاً اللص، في أثناء جريمته، كان منزعجاً من طلاء رطب. جِد الطلاء الطري، تجد من أين جاء اللص.' },
        ],
        reveal: { en: '“So we’re not hunting a thief,” grinned Ramy. “We’re hunting wet paint.”', ar: 'ابتسم رامي: «إذاً نحن لا نطارد لصاً… نحن نطارد طلاءً رطباً.»' },
      },
      {
        title: { en: 'Three Kinds of Paint', ar: 'ثلاثة أنواع من الطلاء' },
        story: {
          en: 'They walked the street like paint inspectors. Tarek’s garden fence: freshly painted GREEN — but by his father, yesterday afternoon, bone dry by sunset. Rana’s courier van: no paint anywhere. And on the door of Hadi’s building, a notice: “WET PAINT — hallway painted 10 PM tonight. Mind the white walls!”',
          ar: 'مشيا في الشارع كمفتّشي طلاء. سياج حديقة طارق: مطليّ حديثاً باللون الأخضر — لكن والده طلاه عصر أمس، وجفّ تماماً قبل الغروب. شاحنة رنا: لا طلاء فيها إطلاقاً. وعلى باب بناية هادي، لافتة: «طلاء رطب — تم طلاء الممر الساعة ١٠ مساءً. انتبهوا للجدران البيضاء!»',
        },
        facts: [
          { e: '🟢', en: 'Tarek’s fence: GREEN paint, applied yesterday afternoon, fully dry before dark.', ar: 'سياج طارق: طلاء أخضر، وُضع عصر أمس، وجفّ تماماً قبل حلول الظلام.' },
          { e: '⬜', en: 'On the bars of Captain’s cage: one WHITE smudge, still slightly tacky at dawn.', ar: 'على قضبان قفص كابتن: لطخة بيضاء واحدة، كانت لا تزال شبه لزجة عند الفجر.' },
          { e: '🏢', en: 'Hadi’s building hallway: painted WHITE at 10 PM last night — wet all through the night.', ar: 'ممر بناية هادي: طُلي بالأبيض في العاشرة مساء أمس — وبقي رطباً طوال الليل.' },
        ],
        wits: [],
        q: { en: 'Which paint matches the smudge on the cage?', ar: 'أي طلاء يطابق اللطخة على القفص؟' },
        options: [
          { id: 'fence', e: '🟢', en: 'Tarek’s green fence', ar: 'سياج طارق الأخضر' },
          { id: 'hall', e: '⬜', en: 'The white hallway in Hadi’s building, painted that very night', ar: 'الممر الأبيض في بناية هادي، المطليّ في تلك الليلة بالذات' },
          { id: 'van', e: '📦', en: 'Rana’s van', ar: 'شاحنة رنا' },
        ],
        answer: 'hall', key: { in: 'facts', i: 1 },
        sol: [
          { en: 'The cage smudge is WHITE and was still tacky at dawn — green dry fence paint can’t do either.', ar: 'لطخة القفص بيضاء وكانت لا تزال لزجة فجراً — وطلاء السياج الأخضر الجاف لا يفسّر أياً من الأمرين.' },
          { en: 'Only one white paint in this street was wet during the night: the hallway the thief had to squeeze through — muttering “careful, the paint!”', ar: 'طلاء أبيض واحد فقط في هذا الشارع كان رطباً أثناء الليل: الممر الذي اضطُر اللص للمرور به — وهو يتمتم «انتبه، الطلاء!»' },
        ],
        reveal: { en: 'Kawkab looked up at the building. Third floor. The cousin who watches films very, very late.', ar: 'رفع كوكب نظره إلى البناية. الطابق الثالث. ابن العم الذي يسهر على الأفلام حتى وقت متأخر جداً جداً.' },
      },
      {
        title: { en: 'The Film That Never Played', ar: 'الفيلم الذي لم يُعرض' },
        story: {
          en: 'Hadi answered the door with a yawn that was slightly too theatrical. “I was up watching the nine o’clock film till past midnight, ask anyone.” Kawkab glanced at the elevator, where a small notice was taped beside the wet-paint sign.',
          ar: 'فتح هادي الباب بتثاؤب مسرحيّ أكثر من اللازم. «كنت أشاهد فيلم التاسعة حتى ما بعد منتصف الليل، اسألوا من شئتم.» نظر كوكب إلى المصعد، حيث عُلّقت ورقة صغيرة بجانب لافتة الطلاء الرطب.',
        },
        facts: [
          { e: '⚡', en: 'The notice by the lift: “Power cut in this building 9–11 PM tonight for hallway works. No lights, no TV.”', ar: 'الورقة قرب المصعد: «انقطاع الكهرباء في هذه البناية من ٩ إلى ١١ مساءً لأعمال الممر. لا إنارة ولا تلفاز.»' },
          { e: '👟', en: 'On the staircase wall, at shoulder height: a white scrape — someone brushed the wet paint going DOWN in the dark.', ar: 'على جدار الدرج، بمحاذاة الكتف: خدش أبيض — أحدهم احتكّ بالطلاء الرطب وهو ينزل في العتمة.' },
        ],
        wits: [
          { e: '🎬', name: { en: 'Hadi', ar: 'هادي' }, en: '“The nine o’clock film. Start to finish. Best one this month.”', ar: '«فيلم التاسعة. من أوله إلى آخره. أفضل فيلم هذا الشهر.»' },
        ],
        q: { en: 'Close the case: who took Captain’s gold ring?', ar: 'أغلق القضية: من أخذ خاتم كابتن الذهبي؟' },
        options: [
          { id: 'tarek', e: '🧢', en: 'Tarek next door', ar: 'الجار طارق' },
          { id: 'rana', e: '📦', en: 'Rana the courier', ar: 'الساعية رنا' },
          { id: 'hadi', e: '🎬', en: 'Cousin Hadi', ar: 'ابن العم هادي' },
        ],
        answer: 'hadi', key: { in: 'facts', i: 0 },
        sol: [
          { en: 'Hadi’s alibi is a film that could not have played: his building had NO POWER from 9 to 11.', ar: 'حجّة هادي فيلم لا يمكن أن يكون قد عُرض: بنايته كانت بلا كهرباء من ٩ إلى ١١.' },
          { en: 'The white scrape on his stairwell, the tacky smudge on the cage, the phrase the parrot learned — one thread, one thief.', ar: 'الخدش الأبيض على درجه، واللطخة اللزجة على القفص، والعبارة التي حفظها الببغاء — خيط واحد، لصّ واحد.' },
          { en: 'Tarek’s paint was dry and green; Rana never touched paint at all. Only Hadi walked through wet white paint that night.', ar: 'طلاء طارق كان جافاً وأخضر؛ ورنا لم تقترب من طلاء أصلاً. وحده هادي عبر طلاءً أبيض رطباً تلك الليلة.' },
        ],
      },
    ],
    epilogue: {
      en: 'The ring was exactly where Ramy guessed: inside a film case on Hadi’s shelf — the one film he claimed to have watched. Hadi wanted quick money for a new phone and told himself Grandma “would never notice.” She noticed. He will spend the summer repainting her entire courtyard — in whatever colour Captain squawks for. So far, Captain has requested green, white, and “CAREFUL!”. The ring is back on the little gold leg where it belongs.',
      ar: 'كان الخاتم تماماً حيث خمّن رامي: داخل علبة فيلم على رفّ هادي — الفيلم نفسه الذي زعم أنه شاهده. أراد هادي مالاً سريعاً لهاتف جديد وأقنع نفسه أن الجدة «لن تلاحظ أبداً». لقد لاحظت. سيقضي الصيف كله في إعادة طلاء فنائها بالكامل — بأي لون يصرخ به كابتن. حتى الآن طلب كابتن الأخضر، والأبيض، و«انتبه!». وعاد الخاتم إلى الساق الذهبية الصغيرة حيث ينتمي.',
    },
  },

  {
    id: 'final-boots', tier: 1, e: '⚽',
    title: { en: 'Sabotage at the Cup Final', ar: 'تخريب في النهائي الكبير' },
    assistant: { e: '🦊', name: { en: 'Noor', ar: 'نور' } },
    prologue: {
      en: 'Twenty minutes before the neighbourhood cup final, the star striker’s lucky boots vanished from the locker room — and turned up floating in the town fountain, soaked and blue. Detective Kawkab pushed through the crowd with Noor the fox trotting at his heel, her nose already twitching. Kick-off would NOT wait.',
      ar: 'قبل عشرين دقيقة من نهائي كأس الحيّ، اختفى حذاء المهاجم النجم المحظوظ من غرفة الملابس — ثم ظهر طافياً في نافورة الساحة، مبلّلاً وأزرق. شقّ المحقق كوكب طريقه بين الحشد ومعه الثعلبة نور تهرول عند كعبه، وأنفها يرتجف من الآن. ضربة البداية لن تنتظر أحداً.',
    },
    suspects: [
      { e: '😼', name: { en: 'Dina, rival captain', ar: 'دينا، قائدة الفريق المنافس' }, desc: { en: 'Lost to this striker twice. Told everyone “this year will be different.”', ar: 'خسرت أمام هذا المهاجم مرتين. قالت للجميع: «هذه السنة ستكون مختلفة.»' } },
      { e: '🏃', name: { en: 'Sami, the teammate', ar: 'سامي، زميل الفريق' }, desc: { en: 'Second-best striker on the team — and permanently, quietly hungry.', ar: 'ثاني أفضل مهاجم في الفريق — وجائع دائماً، بهدوء.' } },
      { e: '🌱', name: { en: 'Adel, groundskeeper', ar: 'عادل، حارس الملعب' }, desc: { en: 'Grumbles that “this final ruined my grass.” Rides his mower like a throne.', ar: 'يتذمّر من أن «هذا النهائي دمّر عشبي». يمتطي جزّازته كأنها عرش.' } },
    ],
    acts: [
      {
        title: { en: 'The Unforced Door', ar: 'الباب غير المكسور' },
        story: {
          en: 'The locker room lock was untouched — no scratches, no damage. It opens with a four-digit code known only to the team. Kawkab studied the keypad while Noor sniffed the doorframe and sneezed at the smell of grass.',
          ar: 'قفل غرفة الملابس سليم تماماً — لا خدوش ولا كسر. الباب يُفتح برمز من أربعة أرقام لا يعرفه إلا أعضاء الفريق. تفحّص كوكب لوحة الأرقام بينما تشمّمت نور إطار الباب وعطست من رائحة العشب.',
        },
        facts: [
          { e: '🔢', en: 'The lock was opened normally, with the correct code. Only the team knows it.', ar: 'فُتح القفل بشكل طبيعي وبالرمز الصحيح. لا يعرفه إلا الفريق.' },
          { e: '⏱️', en: 'The boots were there at 10:00 (kit check) and gone at 10:20 (warm-up ends).', ar: 'كان الحذاء موجوداً في ١٠:٠٠ (فحص العتاد) ومفقوداً في ١٠:٢٠ (نهاية الإحماء).' },
        ],
        wits: [
          { e: '😼', name: { en: 'Dina', ar: 'دينا' }, en: '“I never entered your building. I don’t even know where your smelly locker room IS.”', ar: '«لم أدخل مبناكم أصلاً. لا أعرف حتى أين تقع غرفة ملابسكم كريهة الرائحة.»' },
          { e: '🌱', name: { en: 'Adel', ar: 'عادل' }, en: '“On my mower, far pitch, the whole time. Four hundred people watched me mow.”', ar: '«على جزّازتي، في الملعب البعيد، طوال الوقت. أربعمئة شخص رأوني أجزّ.»' },
        ],
        q: { en: 'What does the unforced, correctly-coded door tell us?', ar: 'ماذا يخبرنا الباب السليم المفتوح بالرمز الصحيح؟' },
        options: [
          { id: 'inside', e: '🔑', en: 'Whoever entered had the code — a team member, or someone a team member let in', ar: 'أن من دخل كان يملك الرمز — عضو في الفريق، أو شخص أدخله عضو في الفريق' },
          { id: 'dina', e: '😼', en: 'Dina picked the lock', ar: 'أن دينا فتحت القفل عنوة' },
          { id: 'open', e: '🚪', en: 'The door was simply never locked', ar: 'أن الباب لم يكن مقفلاً أصلاً' },
        ],
        answer: 'inside', key: { in: 'facts', i: 0 },
        sol: [
          { en: 'No damage means no break-in; the code was USED. The trail starts inside the team.', ar: 'لا ضرر يعني لا اقتحام؛ الرمز استُخدم فعلاً. الخيط يبدأ من داخل الفريق.' },
          { en: 'Which does not yet mean a teammate did it — someone may have opened that door for the wrong person.', ar: 'وهذا لا يعني بعد أن الفاعل زميل — فربما فتح أحدهم ذلك الباب للشخص الخطأ.' },
        ],
        reveal: { en: 'Noor was already staring at one member of the warm-up line, whose ears had gone suspiciously red.', ar: 'كانت نور تحدّق أصلاً في أحد لاعبي صفّ الإحماء، وقد احمرّت أذناه على نحوٍ مريب.' },
      },
      {
        title: { en: 'Sami’s Snack Confession', ar: 'اعتراف سامي بالوجبة الخفيفة' },
        story: {
          en: 'Sami cracked before Kawkab finished his first question. “I propped the door open with a water bottle at 10:05! Just for two minutes — I sneaked in for my energy bar! When I came out I forgot the bottle and the door stayed open, and — I’m sorry — but I didn’t take any boots!” Kawkab believed him. Which made the fountain very interesting. Noor pawed at the water and came away with a blue-stained paw.',
          ar: 'انهار سامي قبل أن يُكمل كوكب سؤاله الأول. «وضعتُ قارورة ماء لأبقي الباب مفتوحاً في ١٠:٠٥! دقيقتين فقط — تسلّلت لآخذ لوح الطاقة! وحين خرجت نسيت القارورة فبقي الباب مفتوحاً، و— أنا آسف — لكنني لم آخذ أي حذاء!» صدّقه كوكب. وهذا جعل النافورة مثيرة جداً للاهتمام. غمست نور كفّها في الماء فخرج مصبوغاً بالأزرق.',
        },
        facts: [
          { e: '🚪', en: 'From 10:05 to 10:20, thanks to Sami’s bottle, ANYONE could walk into the locker room.', ar: 'من ١٠:٠٥ إلى ١٠:٢٠، وبفضل قارورة سامي، كان بإمكان أي شخص دخول غرفة الملابس.' },
          { e: '💙', en: 'It was fountain-cleaning day: the water is dosed with a harmless blue dye that stains skin and fabric for a whole day.', ar: 'كان يوم تنظيف النافورة: الماء معالج بصبغة زرقاء غير ضارّة تصبغ الجلد والقماش يوماً كاملاً.' },
        ],
        wits: [
          { e: '🏃', name: { en: 'Sami', ar: 'سامي' }, en: '“Check my hands! Check my bag! It was ONE energy bar. Okay, two.”', ar: '«فتّشوا يديّ! فتّشوا حقيبتي! كان لوح طاقة واحداً. حسناً، اثنين.»' },
        ],
        q: { en: 'What should Kawkab check next?', ar: 'ما الذي يجب أن يفحصه كوكب الآن؟' },
        options: [
          { id: 'hands', e: '🙌', en: 'Everyone’s hands and sleeves — whoever dunked the boots is wearing blue dye', ar: 'أيدي الجميع وأكمامهم — من غمس الحذاء يحمل الصبغة الزرقاء' },
          { id: 'code', e: '🔢', en: 'Who else knows the door code', ar: 'من غير الفريق يعرف رمز الباب' },
          { id: 'sami', e: '🎒', en: 'Sami’s bag for the boots', ar: 'حقيبة سامي بحثاً عن الحذاء' },
        ],
        answer: 'hands', key: { in: 'facts', i: 1 },
        sol: [
          { en: 'The open door means the code no longer narrows anything — but the fountain dye does. It marks whoever touched the water TODAY.', ar: 'الباب المفتوح يعني أن الرمز لم يعد يفيد — لكن صبغة النافورة تفيد. إنها تُعلّم كل من لمس الماء اليوم.' },
          { en: 'Sami’s secret was snacks, not sabotage. The thief carries a blue signature they cannot wash off.', ar: 'سرّ سامي كان الوجبات لا التخريب. أما اللص فيحمل توقيعاً أزرق لا يُغسل.' },
        ],
        reveal: { en: '“Line up, everyone,” said Kawkab pleasantly. “Sleeves up. This will take one minute.”', ar: 'قال كوكب بلطف: «اصطفّوا جميعاً. شمّروا الأكمام. لن يستغرق الأمر إلا دقيقة.»' },
      },
      {
        title: { en: 'The Blue Wristband', ar: 'السوار الأزرق' },
        story: {
          en: 'Adel’s gloved hands were spotless — and four hundred spectators really had watched him mow all morning. Sami’s hands smelled of chocolate, nothing more. Then Dina crossed her arms a little too tightly. On her right wrist, her team wristband had turned a deep, fresh, fountain blue — and hooked on the fountain’s rim, Noor found a thread from a scarf in HER team’s colours.',
          ar: 'يدا عادل بقفازيهما نظيفتان — وأربعمئة متفرج شاهدوه فعلاً يجزّ العشب طوال الصباح. ويدا سامي تفوحان برائحة الشوكولاتة، لا أكثر. ثم عقدت دينا ذراعيها بشدّة زائدة عن اللزوم. على معصمها الأيمن، كان سوار فريقها قد اصطبغ بأزرق نافورةٍ عميق وطازج — وعلى حافة النافورة، وجدت نور خيطاً من وشاحٍ بألوان فريقها هي.',
        },
        facts: [
          { e: '💙', en: 'Dina’s wristband is stained fountain-blue. She claims “it’s just my team colour” — but her team plays in red and white.', ar: 'سوار دينا مصبوغ بأزرق النافورة. تدّعي أنه «مجرد لون فريقي» — لكن فريقها يلعب بالأحمر والأبيض.' },
          { e: '🧣', en: 'A thread from a red-and-white scarf was snagged on the fountain rim, right where the boots floated.', ar: 'خيط من وشاح أحمر وأبيض عالق بحافة النافورة، تماماً حيث كان الحذاء يطفو.' },
        ],
        wits: [
          { e: '😼', name: { en: 'Dina', ar: 'دينا' }, en: '“This is outrageous. I demand a lawyer. Or my mum. Preferably my mum.”', ar: '«هذا احتيال! أطالب بمحامٍ. أو بأمي. يفضَّل أمي.»' },
        ],
        q: { en: 'Full time. Who dunked the lucky boots?', ar: 'صافرة النهاية. من أغرق الحذاء المحظوظ؟' },
        options: [
          { id: 'adel', e: '🌱', en: 'Adel the groundskeeper', ar: 'عادل حارس الملعب' },
          { id: 'sami', e: '🏃', en: 'Sami the teammate', ar: 'سامي زميل الفريق' },
          { id: 'dina', e: '😼', en: 'Dina the rival captain', ar: 'دينا قائدة المنافسين' },
        ],
        answer: 'dina', key: { in: 'facts', i: 0 },
        sol: [
          { en: 'The dye only marks people who touched the fountain TODAY — and it marked Dina’s wristband, which is not even blue by design.', ar: 'الصبغة لا تُعلّم إلا من لمس النافورة اليوم — وقد علّمت سوار دينا، الذي ليس أزرق أصلاً بتصميمه.' },
          { en: 'Her scarf thread on the rim places her at the splash-point. And Sami’s propped door at 10:05 gave her the way in.', ar: 'وخيط وشاحها على الحافة يضعها عند نقطة الغمس. وباب سامي المفتوح في ١٠:٠٥ منحها طريق الدخول.' },
          { en: 'Adel never left four hundred witnesses; Sami never left the snack shelf. The rival captain wrote her own blue confession.', ar: 'عادل لم يغادر أنظار أربعمئة شاهد؛ وسامي لم يغادر رفّ الوجبات. أما قائدة المنافسين فكتبت اعترافها بنفسها — بالأزرق.' },
        ],
      },
    ],
    epilogue: {
      en: 'Dina confessed at the centre circle: she’d slipped in through Sami’s propped door, grabbed the boots, and dunked them — “so he’d play badly, just ONCE.” The referee had an old spare pair in the striker’s size; he scored twice anyway, barefoot style, boots drying on the crossbar. Dina was banned for one match and sentenced by both teams to wash every kit for a month. Sami publicly donated his emergency energy bars to the cause. Noor kept one blue paw for a week and was extremely proud of it.',
      ar: 'اعترفت دينا عند دائرة المنتصف: تسلّلت من الباب الذي تركه سامي مفتوحاً، خطفت الحذاء وأغرقته — «كي يلعب بشكل سيئ، مرة واحدة فقط». كان لدى الحكم حذاء احتياطي قديم بمقاس المهاجم؛ وسجّل هدفين على أي حال، بينما جفّ حذاؤه المحظوظ على العارضة. عوقبت دينا بالإيقاف مباراة واحدة، وحكم عليها الفريقان معاً بغسل كل الأطقم شهراً كاملاً. وتبرّع سامي علناً بألواح الطاقة الاحتياطية دعماً للقضية. أما نور فبقي كفّها أزرق أسبوعاً كاملاً — وكانت فخورة به إلى أبعد حدّ.',
    },
  },
];
