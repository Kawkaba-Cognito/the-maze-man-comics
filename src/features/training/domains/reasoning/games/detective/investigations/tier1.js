/*
 * Detective Kawkab — full investigations, TIER 1 (cozy stakes, clean chains).
 * 3 suspects · 4–6 hotspots · 1 proving clue · no red herrings.
 * Schema: see ./index.js
 */

export const INV_TIER1 = [
  // ═══════════════ CASE 1 — THE VANISHED WEDDING CAKE ═══════════════
  {
    id: 'wedding-cake', tier: 1, e: '🎂',
    title: { en: 'The Vanished Wedding Cake', ar: 'كعكة العرس المختفية' },
    setting: { en: 'The Grand Hotel Kitchen', ar: 'مطبخ الفندق الكبير' },
    bg: ['#fdf3e0', '#f1dcbc'],
    assistant: { e: '👧', name: { en: 'Lola', ar: 'لولا' } },
    briefing: {
      en: 'One hour before the grand hotel wedding, a scream came from the kitchen: the top tier of the five-tier cake — the one with the famous sugar roses — was GONE. Detective Kawkab straightened his hat, and his assistant Lola opened her notebook. Three people had badges for that kitchen this morning. Search the scene, question everyone — and accuse only when you can PROVE it.',
      ar: 'قبل ساعة واحدة من العرس الكبير في الفندق، دوّت صرخة من المطبخ: الطبقة العليا من الكعكة ذات الطوابق الخمس — تلك المزيّنة بورود السكر الشهيرة — اختفت! عدّل المحقق كوكب قبعته، وفتحت مساعدته لولا دفترها. ثلاثة أشخاص فقط كانوا يملكون بطاقات لذلك المطبخ هذا الصباح. فتّش المكان، واستجوب الجميع — ولا توجّه الاتهام إلا حين تستطيع الإثبات.',
    },
    hotspots: [
      { id: 'badge', e: '🎫', name: { en: 'Badge reader', ar: 'قارئ البطاقات' }, pos: { x: 12, y: 26 }, clueId: 'badge-log' },
      { id: 'table', e: '🎂', name: { en: 'Cake table', ar: 'طاولة الكعكة' }, pos: { x: 46, y: 22 }, clueId: 'swipe' },
      { id: 'floor', e: '🛒', name: { en: 'Smeared floor', ar: 'الأرض الملطّخة' }, pos: { x: 64, y: 58 }, clueId: 'tracks' },
      { id: 'lift', e: '🛗', name: { en: 'Freight lift', ar: 'مصعد البضائع' }, pos: { x: 86, y: 30 }, clueId: 'petals' },
      { id: 'van', e: '🚐', name: { en: 'Flower van', ar: 'شاحنة الزهور' }, pos: { x: 20, y: 68 }, clueId: 'van' },
      { id: 'window', e: '🪟', name: { en: 'Kitchen window', ar: 'نافذة المطبخ' }, pos: { x: 44, y: 74 }, empty: { en: 'Locked from the inside. The pigeons outside deny everything.', ar: 'موصدة من الداخل. والحمام في الخارج ينكر كل شيء.' } },
    ],
    clues: [
      { id: 'badge-log', e: '🎫', name: { en: 'The badge log', ar: 'سجلّ البطاقات' }, text: { en: 'Exactly three entries this morning: Chef Basil 7:00, Salma 8:15, Ziad 8:40. The machine does not gossip and does not forget.', ar: 'ثلاثة دخولات فقط هذا الصباح: الشيف باسل ٧:٠٠، سلمى ٨:١٥، زياد ٨:٤٠. الجهاز لا يثرثر ولا ينسى.' } },
      { id: 'photo', e: '📸', name: { en: 'The 8:05 photo', ar: 'صورة الـ٨:٠٥' }, text: { en: 'The chef photographed the finished cake — complete and perfect — at 8:05.', ar: 'صوّر الشيف الكعكة المكتملة — سليمة وكاملة — في الساعة ٨:٠٥.' } },
      { id: 'swipe', e: '👆', name: { en: 'Finger-swipe', ar: 'أثر الإصبع' }, text: { en: 'One finger-swipe in the SECOND tier’s frosting. The top tier is simply… gone.', ar: 'أثر إصبع واحد في كريمة الطبقة الثانية. أما الطبقة العليا فقد… اختفت ببساطة.' } },
      { id: 'tracks', e: '🛒', name: { en: 'Wheel tracks', ar: 'أثر العجلات' }, text: { en: 'Two thin wheel-tracks of smeared frosting run from the cake table to the freight lift. Nobody eats a whole tier standing up — it ROLLED away.', ar: 'أثران رفيعان لعجلات ملطّخة بالكريمة يمتدّان من طاولة الكعكة إلى مصعد البضائع. لا أحد يأكل طبقة كاملة واقفاً — لقد تدحرجت!' } },
      { id: 'petals', e: '🌸', name: { en: 'Rare petals', ar: 'بتلات نادرة' }, text: { en: 'Three petals of Salma’s rare violets inside the freight lift — lying ON TOP of the frosting smears.', ar: 'ثلاث بتلات من بنفسج سلمى النادر داخل مصعد البضائع — فوق لطخات الكريمة.' } },
      { id: 'van', e: '🚐', name: { en: 'The van handle', ar: 'مقبض الشاحنة' }, text: { en: 'The handle of Salma’s flower van is smeared with white frosting. Inside: an empty cake stand.', ar: 'مقبض شاحنة سلمى ملطّخ بكريمة بيضاء. وفي الداخل: حامل كعك فارغ.' } },
      { id: 'ziad-40', e: '🗣', name: { en: 'Ziad’s confession', ar: 'اعتراف زياد' }, text: { en: 'Ziad sneaked in at 8:40 for one swipe of frosting — and swears the top tier was ALREADY gone.', ar: 'تسلّل زياد في ٨:٤٠ من أجل غرفة كريمة واحدة — ويقسم أن الطبقة العليا كانت مفقودة أصلاً.' } },
    ],
    suspects: [
      {
        id: 'basil', e: '👨‍🍳', name: { en: 'Chef Basil', ar: 'الشيف باسل' },
        role: { en: 'Decorated the cake — and grumbled all week about the flavour.', ar: 'زيّن الكعكة بنفسه — وظلّ يتذمّر طوال الأسبوع من النكهة.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you this morning?', ar: 'أين كنت هذا الصباح؟' }, a: { en: 'Piping sugar roses since seven! I finished at eight, photographed my masterpiece at 8:05, and went to argue with the band about the schedule.', ar: 'أزيّن ورود السكر منذ السابعة! أنهيتها في الثامنة، وصوّرت تحفتي في ٨:٠٥، ثم ذهبت أتجادل مع الفرقة الموسيقية حول البرنامج.' }, givesClue: 'photo' },
          { id: 'who', q: { en: 'Who can enter this kitchen?', ar: 'من يستطيع دخول هذا المطبخ؟' }, a: { en: 'Only staff badges open that door: mine, Salma’s and Ziad’s. And the badge machine remembers everything, detective.', ar: 'لا يفتح ذلك الباب إلا بطاقات الموظفين: بطاقتي وبطاقة سلمى وبطاقة زياد. وجهاز البطاقات يتذكّر كل شيء أيها المحقق.' } },
          { id: 'flavour', q: { en: 'You hated this cake’s flavour, didn’t you?', ar: 'كنت تكره نكهة هذه الكعكة، أليس كذلك؟' }, a: { en: 'Lemon-lavender! For a WEDDING! But a chef does not eat his own argument — I wanted everyone to SEE it and taste how wrong they were.', ar: 'ليمون وخزامى! في عرس! لكن الشيف لا يأكل حجّته — أردت أن يراها الجميع ويتذوقوا كم كانوا مخطئين.' } },
        ],
      },
      {
        id: 'ziad', e: '🤵', name: { en: 'Ziad the waiter', ar: 'النادل زياد' },
        role: { en: 'Polishes glasses beautifully. Never resists a snack.', ar: 'يلمّع الكؤوس ببراعة. ولا يقاوم أي وجبة خفيفة.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you this morning?', ar: 'أين كنت هذا الصباح؟' }, a: { en: 'Me? Polishing glasses in the hall ALL morning. I never set foot in that kitchen.', ar: 'أنا؟ كنت ألمّع الكؤوس في الصالة طوال الصباح كله. لم تطأ قدمي ذلك المطبخ.' } },
          { id: 'badge', needsClue: 'badge-log', q: { en: 'Then why did YOUR badge open the kitchen door at 8:40?', ar: 'إذاً لماذا فتحت بطاقتك أنت باب المطبخ في ٨:٤٠؟' }, a: { en: '…Okay. OKAY. I sneaked in at 8:40 — for ONE swipe of frosting from the second tier. But I swear, when I got there, the TOP tier was already gone!', ar: '…حسناً. حسناً! تسلّلتُ في ٨:٤٠ — من أجل غرفة كريمة واحدة من الطبقة الثانية. لكن أقسم، حين وصلت، كانت الطبقة العليا قد اختفت أصلاً!' }, givesClue: 'ziad-40', reaction: { en: 'He turns the colour of strawberry glaze. “I’d have confessed sooner but… it’s embarrassing.”', ar: 'يصير لونه كلون صلصة الفراولة. «كنت سأعترف أبكر لكن… الأمر محرج.»' } },
          { id: 'finger', needsClue: 'swipe', q: { en: 'This finger-mark in the frosting is exactly your size.', ar: 'أثر الإصبع هذا في الكريمة بحجم إصبعك تماماً.' }, a: { en: 'One taste! ONE! And the top was already missing when I got there, I promise you.', ar: 'تذوّقة واحدة! واحدة فقط! والطبقة العليا كانت مفقودة أصلاً حين وصلت، أعدك.' }, givesClue: 'ziad-40' },
        ],
      },
      {
        id: 'salma', e: '💐', name: { en: 'Salma the florist', ar: 'منسّقة الزهور سلمى' },
        role: { en: 'Her arrangements compete with the cake for attention — and she knows it.', ar: 'تنسيقاتها تنافس الكعكة على الأنظار — وهي تعرف ذلك جيداً.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you this morning?', ar: 'أين كنتِ هذا الصباح؟' }, a: { en: 'I came in at 8:15 to set my flowers by the cake table. I never touched a crumb.', ar: 'دخلتُ في ٨:١٥ لأرتّب زهوري قرب طاولة الكعكة. لم ألمس فتاتة واحدة.' } },
          { id: 'cake', q: { en: 'What do you think of the cake?', ar: 'ما رأيك في الكعكة؟' }, a: { en: 'Overrated. There is more artistry in one of my stems than in five floors of sugar. But guests only ever photograph the cake…', ar: 'مبالغ في تقديرها. في غصن واحد من أغصاني فنّ أكثر مما في خمسة طوابق من السكر. لكن الضيوف لا يصوّرون إلا الكعكة…' } },
          { id: 'petals', needsClue: 'petals', q: { en: 'Your rare violets were in the freight lift — on top of the frosting smears.', ar: 'بتلات بنفسجك النادر كانت في مصعد البضائع — فوق لطخات الكريمة.' }, a: { en: 'Petals fall everywhere, detective. That proves nothing. Nothing!', ar: 'البتلات تتساقط في كل مكان أيها المحقق. هذا لا يثبت شيئاً. لا شيء!' } },
          { id: 'van', needsClue: 'van', q: { en: 'Then why is there frosting on your van’s handle — and an empty cake stand inside?', ar: 'إذاً لماذا على مقبض شاحنتك كريمة — وفي داخلها حامل كعك فارغ؟' }, a: { en: '…I was going to bring it BACK. Every last rose. I only needed one hour.', ar: '…كنت سأعيدها. بكل وردة فيها. لم أكن أحتاج إلا ساعة واحدة.' }, reaction: { en: 'Lola looks up from her notebook, eyes wide.', ar: 'ترفع لولا نظرها عن دفترها بعينين واسعتين.' } },
        ],
      },
    ],
    solution: {
      culprit: 'salma',
      evidence: ['van'],
      explanation: [
        { en: 'The cake was whole in the 8:05 photo, and already missing at 8:40 when Ziad sneaked in. The window is razor thin.', ar: 'كانت الكعكة كاملة في صورة ٨:٠٥، ومفقودة في ٨:٤٠ حين تسلّل زياد. النافذة الزمنية ضيقة جداً.' },
        { en: 'Only one badge entered in that window: Salma, 8:15.', ar: 'بطاقة واحدة فقط دخلت في تلك النافذة: سلمى، ٨:١٥.' },
        { en: 'The frosting wheel-tracks roll to the freight lift — and her rare petals lie ON TOP of the smears, dropped while wheeling the tier.', ar: 'أثر العجلات الملطّخة يمتد إلى مصعد البضائع — وبتلاتها النادرة فوق اللطخات، سقطت أثناء دفع العربة.' },
        { en: 'And the proof: white frosting on her van handle, and an empty cake stand waiting inside.', ar: 'والدليل: كريمة بيضاء على مقبض شاحنتها، وحامل كعك فارغ ينتظر في الداخل.' },
      ],
      epilogue: {
        en: 'Salma burst into tears before Detective Kawkab even finished. She hadn’t meant to KEEP it — she wanted one hour with the sugar roses in her van, to copy the design she’d envied all week, then sneak the tier back. The tier was rescued, the chef repaired one squashed rose while muttering darkly, and the wedding went ahead — with Ziad, by way of apology, serving every slice and tasting none. Lola closed her notebook: CASE CLOSED.',
        ar: 'انفجرت سلمى بالبكاء قبل أن يُكمل المحقق كوكب كلامه. لم تكن تنوي الاحتفاظ بها — أرادت ساعة واحدة مع ورود السكر في شاحنتها، لتنسخ التصميم الذي حسدته عليه طوال الأسبوع، ثم تعيد الطبقة خفية. أُنقذت الطبقة، وأصلح الشيف وردةً منبعجة وهو يتمتم بغضب، وأقيم العرس — وقام زياد، على سبيل الاعتذار، بتقديم كل قطعة دون أن يتذوّق واحدة. أغلقت لولا دفترها: القضية مُغلقة.',
      },
    },
  },

  // ═══════════════ CASE 2 — THE PARROT WHO KNEW TOO MUCH ═══════════════
  {
    id: 'parrot-witness', tier: 1, e: '🦜',
    title: { en: 'The Parrot Who Knew Too Much', ar: 'الببغاء الذي عرف أكثر مما ينبغي' },
    setting: { en: 'Grandma Warda’s Street', ar: 'شارع الجدة وردة' },
    bg: ['#e8f2e2', '#d3e6cf'],
    assistant: { e: '🧒', name: { en: 'Ramy', ar: 'رامي' } },
    briefing: {
      en: 'Grandma Warda’s parrot, Captain, wears a thin gold ring on his leg — a family treasure. Last night someone crept into her courtyard, and by morning the ring was gone. Captain, the only witness, can’t point a wing… but he CAN talk. Detective Kawkab arrived with his assistant Ramy. Search the street, listen carefully — and follow the paint.',
      ar: 'ببغاء الجدة وردة، «كابتن»، يلبس في ساقه خاتماً ذهبياً رفيعاً — كنزاً عائلياً. الليلة الماضية تسلّل أحدهم إلى فنائها، ومع الصباح كان الخاتم قد اختفى. كابتن، الشاهد الوحيد، لا يستطيع أن يشير بجناحه… لكنه يستطيع الكلام. وصل المحقق كوكب مع مساعده رامي. فتّش الشارع، وأصغِ جيداً — واتبع الطلاء.',
    },
    hotspots: [
      { id: 'cage', e: '🐦', name: { en: 'Captain’s cage', ar: 'قفص كابتن' }, pos: { x: 22, y: 26 }, clueId: 'smudge' },
      { id: 'fence', e: '🟢', name: { en: 'Tarek’s fence', ar: 'سياج طارق' }, pos: { x: 66, y: 22 }, clueId: 'fence' },
      { id: 'hall', e: '🏢', name: { en: 'Hadi’s building', ar: 'بناية هادي' }, pos: { x: 87, y: 44 }, clueId: 'hall' },
      { id: 'lift-note', e: '⚡', name: { en: 'Notice by the lift', ar: 'ورقة قرب المصعد' }, pos: { x: 70, y: 66 }, clueId: 'power' },
      { id: 'stairs', e: '👟', name: { en: 'The staircase', ar: 'درج البناية' }, pos: { x: 50, y: 48 }, clueId: 'scrape' },
      { id: 'van', e: '📦', name: { en: 'Rana’s courier van', ar: 'شاحنة رنا' }, pos: { x: 18, y: 66 }, empty: { en: 'No paint anywhere. It smells of cardboard and early mornings.', ar: 'لا طلاء في أي مكان. رائحتها كرتون وصباحات باكرة.' } },
    ],
    clues: [
      { id: 'phrase', e: '🦜', name: { en: 'Captain’s new phrase', ar: 'عبارة كابتن الجديدة' }, text: { en: 'All morning Captain squawks a phrase nobody taught him: “CAREFUL, THE PAINT!” Parrots repeat what they HEAR — and he learned it last night.', ar: 'طوال الصباح يصرخ كابتن بعبارة لم يعلّمه إياها أحد: «انتبه، الطلاء!» الببغاوات تكرر ما تسمعه — وقد حفظها الليلة الماضية.' } },
      { id: 'no-paint', e: '🏠', name: { en: 'Nothing painted here', ar: 'لا طلاء هنا' }, text: { en: 'Nothing in Grandma Warda’s house or courtyard has been painted in months.', ar: 'لا شيء في بيت الجدة وردة أو فنائها طُلي منذ شهور.' } },
      { id: 'smudge', e: '⬜', name: { en: 'White smudge', ar: 'اللطخة البيضاء' }, text: { en: 'On the bars of Captain’s cage: one WHITE smudge, still slightly tacky at dawn.', ar: 'على قضبان قفص كابتن: لطخة بيضاء واحدة، كانت لا تزال شبه لزجة عند الفجر.' } },
      { id: 'fence', e: '🟢', name: { en: 'Tarek’s green fence', ar: 'سياج طارق الأخضر' }, text: { en: 'Freshly painted GREEN — but by his father, yesterday afternoon, bone dry before dark.', ar: 'مطليّ حديثاً بالأخضر — لكن والده طلاه عصر أمس، وجفّ تماماً قبل حلول الظلام.' } },
      { id: 'hall', e: '🏢', name: { en: 'The wet hallway', ar: 'الممر الرطب' }, text: { en: 'On Hadi’s building: “WET PAINT — hallway painted WHITE at 10 PM tonight. Mind the walls!” Wet all through the night.', ar: 'على بناية هادي: «طلاء رطب — طُلي الممر بالأبيض الساعة ١٠ مساءً. انتبهوا للجدران!» بقي رطباً طوال الليل.' } },
      { id: 'power', e: '⚡', name: { en: 'The power cut', ar: 'انقطاع الكهرباء' }, text: { en: 'Notice by the lift: “Power cut in this building 9–11 PM tonight for hallway works. No lights, no TV.”', ar: 'ورقة قرب المصعد: «انقطاع الكهرباء في هذه البناية من ٩ إلى ١١ مساءً لأعمال الممر. لا إنارة ولا تلفاز.»' } },
      { id: 'scrape', e: '👟', name: { en: 'Stairwell scrape', ar: 'خدش الدرج' }, text: { en: 'On the staircase wall, at shoulder height: a white scrape — someone brushed the wet paint going DOWN in the dark.', ar: 'على جدار الدرج، بمحاذاة الكتف: خدش أبيض — أحدهم احتكّ بالطلاء الرطب وهو ينزل في العتمة.' } },
    ],
    witnesses: [
      {
        id: 'captain', e: '🦜', name: { en: 'Captain the parrot', ar: 'الببغاء كابتن' },
        role: { en: 'The only witness. Payment accepted in seeds.', ar: 'الشاهد الوحيد. يقبل أتعابه حبوباً.' },
        questions: [
          { id: 'heard', q: { en: 'What did you hear last night, Captain?', ar: 'ماذا سمعت الليلة الماضية يا كابتن؟' }, a: { en: '“CAREFUL, THE PAINT! CAREFUL, THE PAINT!” *he bobs his head proudly*', ar: '«انتبه، الطلاء! انتبه، الطلاء!» *ويهزّ رأسه بفخر*' }, givesClue: 'phrase' },
          { id: 'who', q: { en: 'Who taught you that?', ar: 'من علّمك إياها؟' }, a: { en: '*Captain tilts his head and fixes you with one round, unblinking eye.*', ar: '*يميل كابتن برأسه ويحدّق فيك بعين واحدة مستديرة لا ترمش.*' } },
        ],
      },
      {
        id: 'warda', e: '👵', name: { en: 'Grandma Warda', ar: 'الجدة وردة' },
        role: { en: 'Owner of the ring, the parrot, and the sharpest ears on the street.', ar: 'صاحبة الخاتم والببغاء وأمضى أذنين في الشارع.' },
        questions: [
          { id: 'parrot', q: { en: 'Does Captain make phrases up?', ar: 'هل يخترع كابتن العبارات؟' }, a: { en: 'Never. He only repeats what he hears with his own ears. Last week he learned the milkman’s whistle in one night.', ar: 'أبداً. لا يكرر إلا ما يسمعه بأذنيه. الأسبوع الماضي حفظ صفير بائع الحليب في ليلة واحدة.' } },
          { id: 'paint', q: { en: 'Painted anything recently?', ar: 'هل طليتِ شيئاً مؤخراً؟' }, a: { en: 'Nothing here has seen a paintbrush in months, dear. Why does everyone keep asking about paint?', ar: 'لا شيء هنا رأى فرشاة طلاء منذ شهور يا عزيزي. لماذا يسأل الجميع عن الطلاء؟' }, givesClue: 'no-paint' },
        ],
      },
    ],
    suspects: [
      {
        id: 'tarek', e: '🧢', name: { en: 'Tarek next door', ar: 'الجار طارق' },
        role: { en: 'Has begged for a parrot for a year. Knows Captain’s cage latch by heart.', ar: 'يتوسّل منذ سنة ليحصل على ببغاء. يعرف قفل قفص كابتن عن ظهر قلب.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you last night?', ar: 'أين كنت الليلة الماضية؟' }, a: { en: 'Asleep! Ask my mum. And if I wanted Captain I’d never steal his RING — I’d ask Grandma to let me feed him. Again.', ar: 'نائماً! اسأل أمي. ولو أردت كابتن لما سرقت خاتمه أبداً — بل لطلبت من الجدة أن تدعني أطعمه. مرة أخرى.' } },
          { id: 'fence', needsClue: 'fence', q: { en: 'Your fence was painted fresh this week.', ar: 'سياجك طُلي حديثاً هذا الأسبوع.' }, a: { en: 'Dad painted it yesterday AFTERNOON — green, and dry before dinner. Touch it if you like. I supervised.', ar: 'أبي طلاه عصر أمس — أخضر، وجفّ قبل العشاء. المسه إن شئت. أنا أشرفت على العملية.' } },
        ],
      },
      {
        id: 'rana', e: '📦', name: { en: 'Rana the courier', ar: 'الساعية رنا' },
        role: { en: 'Delivers at dawn. Her route passes the courtyard gate every day.', ar: 'توزّع الطرود فجراً. طريقها يمرّ ببوابة الفناء كل يوم.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you last night?', ar: 'أين كنتِ الليلة الماضية؟' }, a: { en: 'In bed by nine — I start at four in the morning, detective. I passed the gate at dawn as always: closed, quiet, parrot muttering about paint.', ar: 'في سريري قبل التاسعة — أبدأ عملي في الرابعة فجراً أيها المحقق. مررت بالبوابة فجراً كعادتي: مغلقة، هادئة، والببغاء يتمتم عن الطلاء.' } },
          { id: 'paint', q: { en: 'Any paint on your route?', ar: 'أي طلاء في طريقك؟' }, a: { en: 'My van needs a WASH, not a paint job. The only fresh paint on this street is Hadi’s hallway — the notice shouted at me all week.', ar: 'شاحنتي تحتاج غسلة لا طلاء. الطلاء الطازج الوحيد في هذا الشارع هو ممر بناية هادي — اللافتة تصرخ في وجهي منذ أيام.' } },
        ],
      },
      {
        id: 'hadi', e: '🎬', name: { en: 'Cousin Hadi', ar: 'ابن العم هادي' },
        role: { en: 'Staying upstairs this month. Watches films until very, very late.', ar: 'يقيم في الطابق العلوي هذا الشهر. يسهر على الأفلام حتى وقت متأخر جداً.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you last night?', ar: 'أين كنت الليلة الماضية؟' }, a: { en: 'Up watching the nine o’clock film till past midnight. Start to finish. Best one this month — ask anyone.', ar: 'أسهر على فيلم التاسعة حتى ما بعد منتصف الليل. من أوله إلى آخره. أفضل فيلم هذا الشهر — اسألوا من شئتم.' } },
          { id: 'power', needsClue: 'power', q: { en: 'Your building had NO power from 9 to 11. No lights. No TV. What film?', ar: 'بنايتك كانت بلا كهرباء من ٩ إلى ١١. لا إنارة ولا تلفاز. أي فيلم؟' }, a: { en: '…I— the film— maybe I dozed off and DREAMED the film. Yes. A very vivid dream.', ar: '…أنا— الفيلم— ربما غفوت وحلمت بالفيلم. نعم. حلم واضح جداً.' }, reaction: { en: 'Ramy whispers: “Nobody dreams a whole film, sir.”', ar: 'يهمس رامي: «لا أحد يحلم بفيلم كامل يا سيدي.»' } },
          { id: 'scrape', needsClue: 'scrape', q: { en: 'Someone scraped wet white paint going down your stairs in the dark.', ar: 'أحدهم احتكّ بالطلاء الأبيض الرطب وهو ينزل درجك في العتمة.' }, a: { en: 'Everyone uses those stairs! The painters! The neighbours! Possibly ghosts!', ar: 'الجميع يستخدم ذلك الدرج! العمّال! الجيران! ربما الأشباح!' } },
        ],
      },
    ],
    solution: {
      culprit: 'hadi',
      evidence: ['power'],
      explanation: [
        { en: 'Captain repeats what he hears — and he heard “careful, the paint!” last night, from the only stranger in the courtyard: the thief.', ar: 'كابتن يكرر ما يسمع — وقد سمع «انتبه، الطلاء!» الليلة الماضية من الغريب الوحيد في الفناء: اللص.' },
        { en: 'The cage smudge is WHITE and was still tacky at dawn. Tarek’s fence is green and dried by sunset — only Hadi’s hallway was wet white paint that night.', ar: 'لطخة القفص بيضاء وكانت لزجة فجراً. سياج طارق أخضر وجفّ قبل الغروب — وحده ممر هادي كان طلاءً أبيض رطباً تلك الليلة.' },
        { en: 'And Hadi’s alibi is a film that could not have played: his building had NO POWER from 9 to 11.', ar: 'وحجّة هادي فيلم لا يمكن أن يكون قد عُرض: بنايته كانت بلا كهرباء من ٩ إلى ١١.' },
      ],
      epilogue: {
        en: 'The ring was exactly where Ramy guessed: inside a film case on Hadi’s shelf — the one film he claimed to have watched. Hadi wanted quick money for a new phone and told himself Grandma “would never notice.” She noticed. He will spend the summer repainting her entire courtyard — in whatever colour Captain squawks for. So far: green, white, and “CAREFUL!”. The ring is back on the little gold leg where it belongs.',
        ar: 'كان الخاتم تماماً حيث خمّن رامي: داخل علبة فيلم على رفّ هادي — الفيلم نفسه الذي زعم أنه شاهده. أراد هادي مالاً سريعاً لهاتف جديد وأقنع نفسه أن الجدة «لن تلاحظ أبداً». لقد لاحظت. سيقضي الصيف كله في إعادة طلاء فنائها بالكامل — بأي لون يصرخ به كابتن. حتى الآن: الأخضر، والأبيض، و«انتبه!». وعاد الخاتم إلى الساق الذهبية الصغيرة حيث ينتمي.',
      },
    },
  },

  // ═══════════════ CASE 3 — SABOTAGE AT THE CUP FINAL ═══════════════
  {
    id: 'final-boots', tier: 1, e: '⚽',
    title: { en: 'Sabotage at the Cup Final', ar: 'تخريب في النهائي الكبير' },
    setting: { en: 'The Stadium & Fountain Square', ar: 'الملعب وساحة النافورة' },
    bg: ['#e3f0e8', '#cfe3d6'],
    assistant: { e: '🦊', name: { en: 'Noor', ar: 'نور' } },
    briefing: {
      en: 'Twenty minutes before the neighbourhood cup final, the star striker’s lucky boots vanished from the locker room — and turned up floating in the town fountain, soaked and BLUE. Detective Kawkab pushed through the crowd with Noor the fox trotting at his heel, her nose already twitching. Kick-off will NOT wait. Search fast, question hard, accuse true.',
      ar: 'قبل عشرين دقيقة من نهائي كأس الحيّ، اختفى حذاء المهاجم النجم المحظوظ من غرفة الملابس — ثم ظهر طافياً في نافورة الساحة، مبلّلاً وأزرق! شقّ المحقق كوكب طريقه بين الحشد ومعه الثعلبة نور تهرول عند كعبه، وأنفها يرتجف من الآن. ضربة البداية لن تنتظر. فتّش بسرعة، واستجوب بحزم، واتّهم بدقة.',
    },
    hotspots: [
      { id: 'door', e: '🔢', name: { en: 'Locker-room door', ar: 'باب غرفة الملابس' }, pos: { x: 15, y: 26 }, clueId: 'lock' },
      { id: 'shelf', e: '👟', name: { en: 'Kit shelf', ar: 'رفّ العتاد' }, pos: { x: 38, y: 60 }, clueId: 'window' },
      { id: 'bottle', e: '🧴', name: { en: 'Fallen bottle', ar: 'قارورة ساقطة' }, pos: { x: 26, y: 44 }, clueId: 'bottle' },
      { id: 'fountain', e: '⛲', name: { en: 'The fountain', ar: 'النافورة' }, pos: { x: 72, y: 30 }, clueId: 'dye' },
      { id: 'rim', e: '🧣', name: { en: 'Fountain rim', ar: 'حافة النافورة' }, pos: { x: 86, y: 56 }, clueId: 'thread' },
      { id: 'pitch', e: '🌱', name: { en: 'The far pitch', ar: 'الملعب البعيد' }, pos: { x: 56, y: 76 }, empty: { en: 'Adel’s mowing lines, ruler-straight. Four hundred folding chairs face them.', ar: 'خطوط جزّ عادل مستقيمة كالمسطرة. وأربعمئة كرسيّ قابل للطي تواجهها.' } },
    ],
    clues: [
      { id: 'lock', e: '🔢', name: { en: 'The unforced lock', ar: 'القفل السليم' }, text: { en: 'No scratches, no damage — opened normally with the correct 4-digit code. Only the team knows it.', ar: 'لا خدوش ولا كسر — فُتح بشكل طبيعي وبالرمز الصحيح من أربعة أرقام. لا يعرفه إلا الفريق.' } },
      { id: 'window', e: '⏱️', name: { en: 'The time window', ar: 'النافذة الزمنية' }, text: { en: 'The boots were on the shelf at 10:00 (kit check) and gone at 10:20 (end of warm-up).', ar: 'كان الحذاء على الرفّ في ١٠:٠٠ (فحص العتاد) ومفقوداً في ١٠:٢٠ (نهاية الإحماء).' } },
      { id: 'bottle', e: '🧴', name: { en: 'The door-prop bottle', ar: 'قارورة الباب' }, text: { en: 'A water bottle lies on its side by the door hinge — exactly where it would sit if someone used it to prop the door open.', ar: 'قارورة ماء مقلوبة قرب مفصل الباب — تماماً حيث تكون لو استخدمها أحدهم لإبقاء الباب مفتوحاً.' } },
      { id: 'open-door', e: '🚪', name: { en: 'The open door', ar: 'الباب المفتوح' }, text: { en: 'From 10:05 to 10:20, thanks to Sami’s forgotten bottle, ANYONE could walk into the locker room.', ar: 'من ١٠:٠٥ إلى ١٠:٢٠، وبفضل قارورة سامي المنسيّة، كان بإمكان أي شخص دخول غرفة الملابس.' } },
      { id: 'dye', e: '💙', name: { en: 'The blue dye', ar: 'الصبغة الزرقاء' }, text: { en: 'Fountain-cleaning day: the water is dosed with a harmless BLUE dye that stains skin and fabric for a whole day.', ar: 'يوم تنظيف النافورة: الماء معالج بصبغة زرقاء غير ضارّة تصبغ الجلد والقماش يوماً كاملاً.' } },
      { id: 'thread', e: '🧣', name: { en: 'The scarf thread', ar: 'خيط الوشاح' }, text: { en: 'A thread from a red-and-white scarf, snagged on the fountain rim — right where the boots floated.', ar: 'خيط من وشاح أحمر وأبيض، عالق بحافة النافورة — تماماً حيث كان الحذاء يطفو.' } },
      { id: 'wristband', e: '💙', name: { en: 'Dina’s blue wristband', ar: 'سوار دينا الأزرق' }, text: { en: 'Dina’s team wristband is stained deep, fresh, fountain BLUE — and her team plays in red and white.', ar: 'سوار فريق دينا مصبوغ بأزرق نافورةٍ عميق وطازج — وفريقها يلعب بالأحمر والأبيض.' } },
    ],
    suspects: [
      {
        id: 'dina', e: '😼', name: { en: 'Dina, rival captain', ar: 'دينا، قائدة المنافسين' },
        role: { en: 'Lost to this striker twice. Told everyone “this year will be different.”', ar: 'خسرت أمام هذا المهاجم مرتين. قالت للجميع: «هذه السنة ستكون مختلفة.»' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you before kick-off?', ar: 'أين كنتِ قبل ضربة البداية؟' }, a: { en: 'With MY team, preparing to win. I never entered your building — I don’t even know where your smelly locker room IS.', ar: 'مع فريقي أنا، نستعد للفوز. لم أدخل مبناكم أصلاً — لا أعرف حتى أين تقع غرفة ملابسكم كريهة الرائحة.' } },
          { id: 'thread', needsClue: 'thread', q: { en: 'This thread on the fountain rim is red and white. YOUR colours.', ar: 'هذا الخيط على حافة النافورة أحمر وأبيض. ألوان فريقك أنتِ.' }, a: { en: 'Half the town wears scarves, detective. Scarves shed. It is what scarves DO.', ar: 'نصف البلدة يلبس الأوشحة أيها المحقق. الأوشحة تنسل خيوطاً. هذا عملها أصلاً.' } },
          { id: 'wrists', needsClue: 'dye', q: { en: 'The fountain dye marks everyone who touched the water today. Show me your wrists.', ar: 'صبغة النافورة تُعلّم كل من لمس الماء اليوم. أريني معصميك.' }, a: { en: '…Fine. FINE. *Her team wristband is stained deep fountain blue.* It’s— it’s just my team colour!', ar: '…حسناً. حسناً! *سوار فريقها مصبوغ بأزرق النافورة العميق.* إنه— إنه مجرد لون فريقي!' }, givesClue: 'wristband', reaction: { en: 'Noor sneezes pointedly. Dina’s team plays in red and white.', ar: 'تعطس نور بمعنى واضح. فريق دينا يلعب بالأحمر والأبيض.' } },
        ],
      },
      {
        id: 'sami', e: '🏃', name: { en: 'Sami, the teammate', ar: 'سامي، زميل الفريق' },
        role: { en: 'Second-best striker on the team — and permanently, quietly hungry.', ar: 'ثاني أفضل مهاجم في الفريق — وجائع دائماً، بهدوء.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you between 10:00 and 10:20?', ar: 'أين كنت بين ١٠:٠٠ و١٠:٢٠؟' }, a: { en: 'Warm-up! Mostly. Warm-up and… vicinity of warm-up.', ar: 'الإحماء! غالباً. الإحماء و… محيط الإحماء.' } },
          { id: 'bottle', needsClue: 'bottle', q: { en: 'Whose bottle propped the locker-room door open?', ar: 'قارورة من كانت تُبقي باب غرفة الملابس مفتوحاً؟' }, a: { en: 'MINE, okay?! I propped the door at 10:05 and sneaked in for my energy bar — two minutes! When I came out I forgot the bottle and the door stayed open. But I took NO boots! Check my hands! It was one energy bar. Okay, two.', ar: 'قارورتي، حسناً؟! أبقيت الباب مفتوحاً في ١٠:٠٥ وتسلّلت لآخذ لوح الطاقة — دقيقتين! وحين خرجت نسيت القارورة فبقي الباب مفتوحاً. لكنني لم آخذ أي حذاء! فتّشوا يديّ! كان لوح طاقة واحداً. حسناً، اثنين.' }, givesClue: 'open-door', reaction: { en: 'His hands smell of chocolate. Nothing more.', ar: 'يداه تفوحان برائحة الشوكولاتة. لا أكثر.' } },
        ],
      },
      {
        id: 'adel', e: '🌱', name: { en: 'Adel, groundskeeper', ar: 'عادل، حارس الملعب' },
        role: { en: 'Grumbles that “this final ruined my grass.” Rides his mower like a throne.', ar: 'يتذمّر من أن «هذا النهائي دمّر عشبي». يمتطي جزّازته كأنها عرش.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you all morning?', ar: 'أين كنت طوال الصباح؟' }, a: { en: 'On my mower, far pitch, the whole time. Four hundred people watched me mow. FOUR HUNDRED.', ar: 'على جزّازتي، في الملعب البعيد، طوال الوقت. أربعمئة شخص رأوني أجزّ. أربعمئة!' } },
          { id: 'grass', q: { en: 'You’re not fond of this final, are you?', ar: 'لست سعيداً بهذا النهائي، أليس كذلك؟' }, a: { en: 'Fond?! They scheduled a CUP FINAL on grass I reseeded in spring. But I’d never touch a player’s boots — boots I can respect. It’s the STUDS that kill me.', ar: 'سعيد؟! نظّموا نهائي كأس على عشبٍ زرعته من جديد في الربيع. لكنني لن ألمس حذاء لاعب أبداً — الحذاء أحترمه. المسامير هي التي تقتلني.' } },
        ],
      },
    ],
    solution: {
      culprit: 'dina',
      evidence: ['wristband'],
      explanation: [
        { en: 'The unforced door pointed inside the team — until Sami confessed his bottle kept it open from 10:05. From then on, ANYONE could slip in.', ar: 'الباب السليم أشار إلى داخل الفريق — حتى اعترف سامي بأن قارورته أبقته مفتوحاً منذ ١٠:٠٥. من تلك اللحظة، كان بإمكان أي شخص التسلل.' },
        { en: 'The fountain dye marks whoever touched the water TODAY — and it marked Dina’s wristband, which is not even blue by design. Her team plays in red and white.', ar: 'صبغة النافورة تُعلّم من لمس الماء اليوم — وقد علّمت سوار دينا، الذي ليس أزرق أصلاً. فريقها يلعب بالأحمر والأبيض.' },
        { en: 'Her scarf thread on the rim places her at the splash-point. Adel never left four hundred witnesses; Sami never left the snack shelf.', ar: 'وخيط وشاحها على الحافة يضعها عند نقطة الغمس. عادل لم يغادر أنظار أربعمئة شاهد؛ وسامي لم يغادر رفّ الوجبات.' },
      ],
      epilogue: {
        en: 'Dina confessed at the centre circle: she’d slipped in through Sami’s propped door, grabbed the boots, and dunked them — “so he’d play badly, just ONCE.” The referee had an old spare pair in the striker’s size; he scored twice anyway, boots drying on the crossbar. Dina was banned for one match and sentenced by both teams to wash every kit for a month. Noor kept one blue paw for a week and was extremely proud of it.',
        ar: 'اعترفت دينا عند دائرة المنتصف: تسلّلت من الباب الذي تركه سامي مفتوحاً، خطفت الحذاء وأغرقته — «كي يلعب بشكل سيئ، مرة واحدة فقط». كان لدى الحكم حذاء احتياطي قديم بمقاس المهاجم؛ وسجّل هدفين على أي حال، بينما جفّ حذاؤه المحظوظ على العارضة. عوقبت دينا بالإيقاف مباراة واحدة، وحكم عليها الفريقان معاً بغسل كل الأطقم شهراً كاملاً. أما نور فبقي كفّها أزرق أسبوعاً كاملاً — وكانت فخورة به إلى أبعد حدّ.',
      },
    },
  },
];
