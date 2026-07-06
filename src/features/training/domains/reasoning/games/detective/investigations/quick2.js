/*
 * Detective Kawkab — compact survival cases, tier 2 (red herrings appear;
 * innocent suspects hide small secrets). Schema: see ./index.js
 */

export const QUICK2 = [
  // ─────────── THE WEDDING RING ───────────
  {
    id: 'q-wedding-ring', tier: 2, e: '💍',
    title: { en: 'The Wedding Ring', ar: 'خاتم العرس' },
    setting: { en: 'The Wedding Hall', ar: 'صالة الأعراس' },
    bg: ['#fdf0e6', '#f3dcc8'],
    briefing: {
      en: 'At the wedding hall, the gift ring vanished from its cushion between 3:00 and 3:30. Three people had been near the gift table. Detective Kawkab took a slice of baklava — for concentration — and began.',
      ar: 'في صالة الأعراس اختفى خاتم الهدية من وسادته بين الثالثة والثالثة والنصف. ثلاثة أشخاص كانوا قرب طاولة الهدايا. أخذ المحقق كوكب قطعة بقلاوة — من أجل التركيز — وبدأ.',
    },
    hotspots: [
      { id: 'photo', e: '📸', name: { en: 'The 3:10 group photo', ar: 'صورة ٣:١٠ الجماعية' }, pos: { x: 24, y: 30 }, clueId: 'photo-310' },
      { id: 'stage', e: '🎻', name: { en: 'The stage', ar: 'المسرح' }, pos: { x: 62, y: 26 }, clueId: 'band' },
      { id: 'kitchen', e: '🍽️', name: { en: 'The kitchen', ar: 'المطبخ' }, pos: { x: 84, y: 60 }, clueId: 'kitchen-log' },
      { id: 'table', e: '🎁', name: { en: 'The gift table', ar: 'طاولة الهدايا' }, pos: { x: 42, y: 64 }, empty: { en: 'A velvet cushion with a ring-shaped dent. The dent is not a suspect.', ar: 'وسادة مخملية عليها انبعاج بشكل خاتم. الانبعاج ليس مشتبهاً به.' } },
    ],
    clues: [
      { id: 'photo-310', e: '📸', name: { en: 'The missing aunt', ar: 'الخالة الغائبة' }, text: { en: 'The 3:10 group photo shows every single guest — EXCEPT Aunt Mona.', ar: 'الصورة الجماعية عند ٣:١٠ تُظهر كل المدعوّين بلا استثناء — ما عدا الخالة منى.' } },
      { id: 'band', e: '🎻', name: { en: 'The band on stage', ar: 'الفرقة على المسرح' }, text: { en: 'The band played on stage from 2:45 to 3:20 in front of everyone — including the violinist, every minute.', ar: 'عزفت الفرقة على المسرح من ٢:٤٥ إلى ٣:٢٠ أمام الجميع — بمن فيهم عازف الكمان، كل دقيقة.' } },
      { id: 'kitchen-log', e: '🍽️', name: { en: 'The kitchen vouch', ar: 'شهادة المطبخ' }, text: { en: 'The waiter confirms the chef never left the kitchen after three. Every minute accounted for.', ar: 'النادل يؤكد أن الطاهي لم يغادر المطبخ بعد الثالثة. كل دقيقة مشهود لها.' } },
      { id: 'mona-claim', e: '🗣', name: { en: 'Mona’s claim', ar: 'رواية منى' }, text: { en: 'Aunt Mona insists she was “in ALL the photos” — ask the photographer, she says.', ar: 'تصرّ الخالة منى أنها كانت «في كل الصور» — اسألوا المصوّر، كما تقول.' } },
    ],
    suspects: [
      {
        id: 'violinist', e: '🎻', name: { en: 'The violinist', ar: 'عازف الكمان' },
        role: { en: 'Hired for the afternoon. Eyes always on his strings.', ar: 'مستأجر لفترة الظهيرة. عيناه على أوتاره دائماً.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you between 3:00 and 3:30?', ar: 'أين كنت بين ٣:٠٠ و٣:٣٠؟' }, a: { en: 'On stage the whole time — two hundred people watched me. Three of them even clapped.', ar: 'على المسرح طوال الوقت — ومئتا شخص يشاهدونني. حتى إن ثلاثة منهم صفّقوا.' } },
        ],
      },
      {
        id: 'chef', e: '👨‍🍳', name: { en: 'The chef', ar: 'الطاهي' },
        role: { en: 'Commanding the kitchen since three o’clock.', ar: 'يقود المطبخ منذ الثالثة.' },
        questions: [
          { id: 'alibi', q: { en: 'Did you leave the kitchen at all?', ar: 'هل غادرت المطبخ إطلاقاً؟' }, a: { en: 'In the kitchen since three. The waiter can confirm every minute — he never stops talking to me.', ar: 'في المطبخ منذ الثالثة، والنادل يشهد على كل دقيقة — فهو لا يتوقف عن الكلام معي.' } },
        ],
      },
      {
        id: 'mona', e: '👒', name: { en: 'Aunt Mona', ar: 'الخالة منى' },
        role: { en: 'Adores jewellery. Adores photos even more — usually.', ar: 'تعشق المجوهرات. وتعشق الصور أكثر — عادةً.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you between 3:00 and 3:30?', ar: 'أين كنتِ بين ٣:٠٠ و٣:٣٠؟' }, a: { en: 'Me? I was in all the photos, dear — ask the photographer! I never miss a photo.', ar: 'أنا؟ كنت في كل الصور يا عزيزي — اسألوا المصوّر! أنا لا أفوّت صورة.' }, givesClue: 'mona-claim' },
          { id: 'confront', needsClue: 'photo-310', q: { en: 'The 3:10 photo shows every guest — except you. Where were you at 3:10?', ar: 'صورة ٣:١٠ تُظهر كل المدعوّين — إلا أنتِ. أين كنتِ في ٣:١٠؟' }, a: { en: '…The lighting was dreadful in that one. A lady chooses her photos. And her… moments.', ar: '…الإضاءة كانت فظيعة في تلك الصورة. السيدة تختار صورها. و… لحظاتها.' }, reaction: { en: 'Her handbag clasp, Detective Kawkab notes, is shaped like a little ring cushion.', ar: 'يلاحظ المحقق كوكب أن مشبك حقيبتها على شكل وسادة خاتمٍ صغيرة.' } },
        ],
      },
    ],
    solution: {
      culprit: 'mona',
      evidence: ['photo-310'],
      explanation: [
        { en: 'The violinist was watched by the whole hall; the chef is vouched minute by minute.', ar: 'العازف كانت تراقبه الصالة كلها؛ والطاهي مشهودٌ له دقيقة بدقيقة.' },
        { en: 'Mona claims she was “in all the photos” — but the 3:10 photo, right in the theft window, is missing exactly her. Her own alibi disproves her.', ar: 'تدّعي منى أنها «في كل الصور» — لكن صورة ٣:١٠، في قلب فترة السرقة، تخلو منها وحدها. حجّتها ذاتها تفضحها.' },
      ],
      epilogue: { en: 'The ring was inside the cushion-shaped clasp of her handbag. “I was going to return it after ONE waltz,” she sniffed. The couple forgave her; the photographer did not — she now appears in every photo, front row, closely watched.', ar: 'كان الخاتم داخل مشبك حقيبتها ذي شكل الوسادة. قالت بامتعاض: «كنت سأعيده بعد رقصة واحدة فقط». سامحها العروسان؛ أما المصوّر فلا — صارت تظهر الآن في كل صورة، في الصف الأمامي، تحت المراقبة اللصيقة.' },
    },
  },

  // ─────────── ROOM 214 ───────────
  {
    id: 'q-room-214', tier: 2, e: '🏨',
    title: { en: 'Room 214', ar: 'الغرفة ٢١٤' },
    setting: { en: 'The Grand Hotel Lobby', ar: 'بهو الفندق الكبير' },
    bg: ['#ece8f2', '#d8d2e4'],
    briefing: {
      en: 'While the jewel dealer dined downstairs, his hotel room — 214 — was robbed. His room number appeared in no public list; the question is not who could climb the stairs, but who KNEW where to go. Detective Kawkab rang the reception bell twice, for effect.',
      ar: 'بينما كان تاجر المجوهرات يتعشّى في الطابق الأرضي، سُرقت غرفته — ٢١٤. رقم غرفته لم يُنشر في أي مكان؛ والسؤال ليس من يستطيع صعود الدرج، بل من كان يعرف إلى أين يذهب. قرع المحقق كوكب جرس الاستقبال مرتين، من باب الهيبة.',
    },
    hotspots: [
      { id: 'camera', e: '🎥', name: { en: 'The lobby camera', ar: 'كاميرا البهو' }, pos: { x: 20, y: 28 }, clueId: 'cam' },
      { id: 'luggage', e: '🧳', name: { en: 'The luggage cart', ar: 'عربة الحقائب' }, pos: { x: 56, y: 62 }, clueId: 'bellboy-knew' },
      { id: 'desk', e: '🛎️', name: { en: 'The reception desk', ar: 'مكتب الاستقبال' }, pos: { x: 78, y: 30 }, clueId: 'no-list' },
      { id: 'stairs', e: '🪜', name: { en: 'The staff stairs', ar: 'درج الموظفين' }, pos: { x: 40, y: 32 }, empty: { en: 'Quiet, carpeted, and used by everyone in uniform.', ar: 'هادئ ومفروش بالسجاد، ويستخدمه كل من يرتدي الزيّ.' } },
    ],
    clues: [
      { id: 'cam', e: '🎥', name: { en: 'The camera never blinks', ar: 'الكاميرا لا ترمش' }, text: { en: 'The lobby camera confirms the receptionist never left her desk all evening.', ar: 'كاميرا البهو تؤكد أن موظفة الاستقبال لم تغادر مكتبها طوال المساء.' } },
      { id: 'bellboy-knew', e: '🧳', name: { en: 'Who carried the bags', ar: 'من حمل الحقائب' }, text: { en: 'On arrival, the bellboy Sami carried the dealer’s suitcases up to room 214 HIMSELF.', ar: 'عند الوصول، حمل عامل الحقائب سامي حقائبَ التاجر بنفسه إلى الغرفة ٢١٤.' } },
      { id: 'no-list', e: '📋', name: { en: 'The unlisted room', ar: 'الرقم غير المُعلن' }, text: { en: 'Room 214 appeared on no public list. Reception knew it — and whoever carried the luggage.', ar: 'الغرفة ٢١٤ لم تُنشر في أي قائمة. تعرفها موظفة الاستقبال — ومن حمل الحقائب.' } },
      { id: 'sami-denial', e: '🗣', name: { en: 'Sami’s denial', ar: 'إنكار سامي' }, text: { en: 'Sami claims he “never even knew which room was his.”', ar: 'يدّعي سامي أنه «لم يعرف أصلاً أي غرفة كانت غرفته».' } },
    ],
    suspects: [
      {
        id: 'dina', e: '💁‍♀️', name: { en: 'Dina, reception', ar: 'دينا، الاستقبال' },
        role: { en: 'Knows every room number. Never leaves her desk.', ar: 'تعرف كل أرقام الغرف. ولا تغادر مكتبها.' },
        questions: [
          { id: 'alibi', q: { en: 'Did you tell anyone his room number?', ar: 'هل أخبرتِ أحداً برقم غرفته؟' }, a: { en: 'Nobody. And I never left the desk — your own camera will vouch for me, which is a first.', ar: 'لا أحد. ولم أغادر المكتب أبداً — كاميرتكم نفسها ستشهد لي، وهذه سابقة.' } },
        ],
      },
      {
        id: 'sami', e: '🛎️', name: { en: 'Sami, the bellboy', ar: 'سامي، عامل الحقائب' },
        role: { en: 'Carries everything, everywhere, for everyone.', ar: 'يحمل كل شيء، إلى كل مكان، للجميع.' },
        questions: [
          { id: 'alibi', q: { en: 'Do you know which room the dealer stayed in?', ar: 'هل تعرف في أي غرفة نزل التاجر؟' }, a: { en: 'Me? I never even knew which room was his. We carry bags, we don’t memorise doors.', ar: 'أنا؟ لم أعرف أصلاً أي غرفة كانت غرفته. نحن نحمل الحقائب، لا نحفظ الأبواب.' }, givesClue: 'sami-denial' },
          { id: 'confront', needsClue: 'bellboy-knew', q: { en: 'You carried his suitcases up to 214 yourself. On arrival day.', ar: 'أنت من حمل حقائبه إلى ٢١٤ بنفسك. يوم وصوله.' }, a: { en: '…Suitcases, rooms, floors — it all blurs! A man carries a hundred bags a day!', ar: '…حقائب، غرف، طوابق — كلها تختلط! الرجل يحمل مئة حقيبة في اليوم!' }, reaction: { en: 'The luggage ledger shows he carried exactly four bags that day. All to 214.', ar: 'دفتر الحقائب يُظهر أنه حمل أربع حقائب فقط ذلك اليوم. كلها إلى ٢١٤.' } },
        ],
      },
      {
        id: 'cook', e: '👨‍🍳', name: { en: 'The cook', ar: 'الطاهي' },
        role: { en: 'Rules the kitchen during dinner service.', ar: 'يحكم المطبخ أثناء خدمة العشاء.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you during dinner?', ar: 'أين كنت أثناء العشاء؟' }, a: { en: 'I don’t leave my kitchen during dinner service. Ever. The soufflé alone forbids it.', ar: 'لا أغادر مطبخي أثناء خدمة العشاء. أبداً. السوفليه وحده يمنع ذلك.' } },
          { id: 'room', q: { en: 'Do you know the dealer’s room number?', ar: 'هل تعرف رقم غرفة التاجر؟' }, a: { en: 'I know he ordered the lamb, medium. Guests are dishes to me, not doors.', ar: 'أعرف أنه طلب لحم الضأن، متوسط النضج. النزلاء عندي أطباق، لا أبواب.' } },
        ],
      },
    ],
    solution: {
      culprit: 'sami',
      evidence: ['bellboy-knew', 'sami-denial'],
      explanation: [
        { en: 'Sami carried the dealer’s suitcases UP TO HIS ROOM — of course he knew it was 214.', ar: 'سامي حمل حقائب التاجر إلى غرفته بنفسه — بالطبع كان يعرف أنها ٢١٤.' },
        { en: 'His denial — “I never knew which room” — is a proven lie, and innocent people don’t lie about what they know. The camera clears Dina; the cook never knew the number.', ar: 'إنكاره — «لم أعرف أي غرفة» — كذبة مثبتة، والأبرياء لا يكذبون بشأن ما يعرفونه. الكاميرا تبرّئ دينا، والطاهي لم يعرف الرقم أصلاً.' },
      ],
      epilogue: { en: 'The jewels were in a laundry bag on the staff stairs, tagged for “room 000”. Sami had planned to collect them after his shift. He now has a great deal of time to reflect — and the dealer tips the NEW bellboy extremely well.', ar: 'كانت المجوهرات في كيس غسيل على درج الموظفين، معنوناً إلى «الغرفة ٠٠٠». كان سامي ينوي أخذها بعد مناوبته. لديه الآن متسع من الوقت للتفكير — أما التاجر فيكرم عامل الحقائب الجديد بسخاء بالغ.' },
    },
  },

  // ─────────── THE SECRET FILLING ───────────
  {
    id: 'q-strawberry', tier: 2, e: '🍰',
    title: { en: 'The Secret Filling', ar: 'الحشوة السرّية' },
    setting: { en: 'The Birthday Kitchen', ar: 'مطبخ عيد الميلاد' },
    bg: ['#fdeff0', '#f6d9dc'],
    briefing: {
      en: 'A surprise birthday cake arrived in a sealed, unmarked box. Before the party, someone opened the box and ate a slice. Nobody — not even the parents — knew what flavour hid inside. Detective Kawkab examined the crumbs with great professional restraint.',
      ar: 'وصلت كعكة عيد ميلاد مفاجئة في علبة مغلقة بلا أي علامة. قبل الحفلة فتح أحدهم العلبة وأكل قطعة. لا أحد — ولا حتى الوالدان — كان يعرف نكهة الحشوة. فحص المحقق كوكب الفتات بضبطِ نفسٍ مهنيّ عظيم.',
    },
    hotspots: [
      { id: 'box', e: '📦', name: { en: 'The cake box', ar: 'علبة الكعكة' }, pos: { x: 30, y: 30 }, clueId: 'sealed' },
      { id: 'baker-note', e: '🧁', name: { en: 'The baker’s order slip', ar: 'قسيمة الخبّاز' }, pos: { x: 66, y: 26 }, clueId: 'baker-secret' },
      { id: 'garden', e: '🌷', name: { en: 'The garden', ar: 'الحديقة' }, pos: { x: 82, y: 62 }, clueId: 'garden-mud' },
      { id: 'kitchen', e: '🍴', name: { en: 'The kitchen counter', ar: 'منضدة المطبخ' }, pos: { x: 46, y: 64 }, empty: { en: 'One fork is missing from the drawer. The spoons keep their silence.', ar: 'شوكة واحدة مفقودة من الدرج. والملاعق تلتزم الصمت.' } },
    ],
    clues: [
      { id: 'sealed', e: '📦', name: { en: 'The sealed box', ar: 'العلبة المغلقة' }, text: { en: 'The box was sealed and unmarked. The flavour becomes visible only once the cake is cut.', ar: 'العلبة كانت مغلقة وبلا علامات. النكهة لا تظهر إلا بعد قطع الكعكة.' } },
      { id: 'baker-secret', e: '🧁', name: { en: 'The baker’s secret', ar: 'سرّ الخبّاز' }, text: { en: 'The order slip confirms: only the baker knew the filling was strawberry. He told no one — it was the birthday surprise.', ar: 'قسيمة الطلب تؤكد: وحده الخبّاز كان يعرف أن الحشوة فراولة. ولم يخبر أحداً — كانت مفاجأة العيد.' } },
      { id: 'garden-mud', e: '🌷', name: { en: 'Garden all morning', ar: 'في الحديقة طوال الصباح' }, text: { en: 'Lola’s boots and gloves are caked with fresh garden mud — she really was planting all morning.', ar: 'حذاء لولا وقفازاها مغطاة بوحل الحديقة الطازج — كانت تزرع طوال الصباح فعلاً.' } },
      { id: 'nour-slip', e: '🗣', name: { en: 'Nour’s slip', ar: 'زلّة نور' }, text: { en: 'Nour scoffed: “who would even want a boring STRAWBERRY filling?” — a flavour nobody was told.', ar: 'قالت نور بازدراء: «من قد يشتهي حشوة فراولة مملّة أصلاً؟» — والنكهة لم يُخبَر بها أحد.' } },
    ],
    suspects: [
      {
        id: 'lola', e: '👧', name: { en: 'Lola', ar: 'لولا' },
        role: { en: 'Was in the garden. Allegedly.', ar: 'كانت في الحديقة. كما يُزعم.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you this morning?', ar: 'أين كنتِ هذا الصباح؟' }, a: { en: 'In the garden all morning, planting tulip bulbs. You can count them. Please don’t count them, there are ninety.', ar: 'في الحديقة طوال الصباح أزرع أبصال التوليب. يمكنك عدّها. أرجوك لا تعدّها، إنها تسعون.' } },
        ],
      },
      {
        id: 'ramy', e: '🧒', name: { en: 'Ramy', ar: 'رامي' },
        role: { en: 'Claims total innocence, as always.', ar: 'يدّعي البراءة التامة، كالعادة.' },
        questions: [
          { id: 'alibi', q: { en: 'Did you go near the kitchen?', ar: 'هل اقتربت من المطبخ؟' }, a: { en: 'I never went near the kitchen. I was building a card tower. It fell six times. Ask nobody, because nobody saw, because I was alone. Hm.', ar: 'لم أقترب من المطبخ إطلاقاً. كنت أبني برجاً من الورق. سقط ست مرات. لا تسأل أحداً، لأن أحداً لم يرَ، لأنني كنت وحدي. همم.' } },
        ],
      },
      {
        id: 'nour', e: '👧', name: { en: 'Nour', ar: 'نور' },
        role: { en: 'Not a fan of fruit fillings, apparently.', ar: 'لا تحب حشوات الفواكه، على ما يبدو.' },
        questions: [
          { id: 'alibi', q: { en: 'Did you touch the cake box?', ar: 'هل لمستِ علبة الكعكة؟' }, a: { en: 'Not me! Anyway, who would even want a boring strawberry filling?', ar: 'ليس أنا! وبعدين، من قد يشتهي حشوة فراولة مملّة أصلاً؟' }, givesClue: 'nour-slip' },
          { id: 'confront', needsClue: 'baker-secret', q: { en: 'Strawberry was the baker’s secret — sealed in the box. How do you know the flavour?', ar: 'الفراولة كانت سرّ الخبّاز — مختومة داخل العلبة. كيف عرفتِ النكهة؟' }, a: { en: '…Lucky guess? It’s always strawberry! Except when it’s chocolate! Or… vanilla…', ar: '…تخمين موفّق؟ إنها فراولة دائماً! إلا حين تكون شوكولاتة! أو… فانيلا…' }, reaction: { en: 'There is, Detective Kawkab observes, a very small pink stain on her sleeve.', ar: 'يلاحظ المحقق كوكب بقعة وردية صغيرة جداً على كمّها.' } },
        ],
      },
    ],
    solution: {
      culprit: 'nour',
      evidence: ['baker-secret', 'nour-slip'],
      explanation: [
        { en: 'The filling was a secret sealed inside an unmarked box — it becomes visible only once the cake is cut.', ar: 'الحشوة سرٌّ داخل علبة مغلقة بلا علامات — ولا تظهر إلا بعد قطع الكعكة.' },
        { en: 'Nour called it “a boring STRAWBERRY filling”. The only way to know the flavour was to open the box and cut the slice. She told on herself.', ar: 'نور وصفتها بـ«حشوة الفراولة المملّة». والطريقة الوحيدة لمعرفة النكهة هي فتح العلبة وقطع الكعكة. لقد وشت بنفسها.' },
      ],
      epilogue: { en: 'The missing fork was under her pillow, still faintly pink. The party went ahead with a slightly asymmetrical cake, and Nour — who “doesn’t even like strawberry” — was seen taking a second slice. For research, she said.', ar: 'كانت الشوكة المفقودة تحت وسادتها، وما تزال وردية قليلاً. أقيمت الحفلة بكعكة غير متناظرة بعض الشيء، وشوهدت نور — التي «لا تحب الفراولة أصلاً» — تأخذ قطعة ثانية. قالت إنه بحث علمي.' },
    },
  },

  // ─────────── THE FINGERPRINT BLUFF ───────────
  {
    id: 'q-bluff', tier: 2, e: '🫙',
    title: { en: 'The Fingerprint Bluff', ar: 'خدعة البصمات' },
    setting: { en: 'The Classroom', ar: 'الصفّ المدرسي' },
    bg: ['#eef2e6', '#dbe4ca'],
    briefing: {
      en: 'The sweets jar was raided during break. The teacher gathered the three suspects and announced: “After lunch I will check the jar for fingerprints.” In truth, the jar had been wiped clean — she was bluffing, and she invited Detective Kawkab to watch what happened next.',
      ar: 'أُغير على برطمان الحلوى في الاستراحة. جمعت المعلّمة المشتبه بهم الثلاثة وأعلنت: «بعد الغداء سأفحص البرطمان بحثاً عن البصمات.» والحقيقة أن البرطمان كان ممسوحاً تماماً — كانت تخادع، ودعت المحقق كوكب ليراقب ما سيحدث.',
    },
    hotspots: [
      { id: 'jar', e: '🫙', name: { en: 'The sweets jar', ar: 'برطمان الحلوى' }, pos: { x: 30, y: 30 }, clueId: 'wiped' },
      { id: 'desk', e: '📚', name: { en: 'The teacher’s desk', ar: 'مكتب المعلّمة' }, pos: { x: 64, y: 26 }, clueId: 'bluff-note' },
      { id: 'bin', e: '🗑️', name: { en: 'The class bin', ar: 'سلة الصف' }, pos: { x: 80, y: 62 }, clueId: 'wrappers' },
      { id: 'window2', e: '🪟', name: { en: 'The window ledge', ar: 'حافة النافذة' }, pos: { x: 44, y: 66 }, empty: { en: 'A pigeon. It was not at school during break.', ar: 'حمامة. لم تكن في المدرسة وقت الاستراحة.' } },
    ],
    clues: [
      { id: 'wiped', e: '🫙', name: { en: 'The wiped jar', ar: 'البرطمان الممسوح' }, text: { en: 'The jar has been wiped spotless — there are NO fingerprints on it to find. Someone cleaned up after themselves.', ar: 'البرطمان ممسوح بلا أي أثر — لا بصمات عليه إطلاقاً. أحدهم نظّف ما خلّفه.' } },
      { id: 'bluff-note', e: '📚', name: { en: 'The teacher’s bluff', ar: 'خدعة المعلّمة' }, text: { en: 'The teacher admits it to you quietly: the fingerprint check is a BLUFF. She wants to see who flinches.', ar: 'تعترف لك المعلّمة بهدوء: فحص البصمات خدعة. تريد أن ترى من سيرتبك.' } },
      { id: 'wrappers', e: '🗑️', name: { en: 'Sweet wrappers', ar: 'أغلفة الحلوى' }, text: { en: 'A handful of sweet wrappers, folded small, buried under pencil shavings in the class bin.', ar: 'حفنة من أغلفة الحلوى، مطوية بإحكام، مدفونة تحت برادة أقلام في سلة الصف.' } },
      { id: 'tarek-blurt', e: '🗣', name: { en: 'Tarek’s blurt', ar: 'ما أفلت من طارق' }, text: { en: 'Tarek blurted: “You won’t find anything on it!” — knowledge only the person who wiped the jar could have.', ar: 'انفلتت من طارق: «لن تجدي عليه شيئاً!» — معرفةٌ لا يملكها إلا من مسح البرطمان.' } },
    ],
    suspects: [
      {
        id: 'sami', e: '🙋', name: { en: 'Sami', ar: 'سامي' },
        role: { en: 'Front row. Volunteers for everything.', ar: 'من الصف الأمامي. يتطوع لكل شيء.' },
        questions: [
          { id: 'react', q: { en: 'The teacher will check for fingerprints. Thoughts?', ar: 'ستفحص المعلّمة البصمات. ما رأيك؟' }, a: { en: 'Sure, check mine right now if you want. I held the jar LAST WEEK though, when I handed out prizes — that’s allowed, right?', ar: 'تفضّل، افحص بصماتي الآن إن أردت. لكنني أمسكت البرطمان الأسبوع الماضي حين وزّعت الجوائز — هذا مسموح، صحيح؟' } },
        ],
      },
      {
        id: 'yara', e: '🙆', name: { en: 'Yara', ar: 'يارا' },
        role: { en: 'Calm, tidy, keeps her desk immaculate.', ar: 'هادئة ومرتّبة، ومكتبها نظيف دائماً.' },
        questions: [
          { id: 'react', q: { en: 'The teacher will check for fingerprints. Thoughts?', ar: 'ستفحص المعلّمة البصمات. ما رأيك؟' }, a: { en: 'Good idea. That will settle it — and we can all get back to the maths test. Which I finished, by the way.', ar: 'فكرة ممتازة. هذا سيحسم الأمر — ونعود جميعاً إلى امتحان الرياضيات. الذي أنهيته، بالمناسبة.' } },
        ],
      },
      {
        id: 'tarek', e: '😰', name: { en: 'Tarek', ar: 'طارق' },
        role: { en: 'Sits nearest the jar. Sweating slightly.', ar: 'يجلس أقرب ما يكون إلى البرطمان. ويتصبب عرقاً قليلاً.' },
        questions: [
          { id: 'react', q: { en: 'The teacher will check for fingerprints. Thoughts?', ar: 'ستفحص المعلّمة البصمات. ما رأيك؟' }, a: { en: 'You won’t find anything on it! I mean… fingerprints fade fast, right? Everyone knows that. Science.', ar: 'لن تجدي عليه شيئاً! أقصد… البصمات تزول بسرعة، أليس كذلك؟ الجميع يعرف ذلك. علمياً.' }, givesClue: 'tarek-blurt' },
          { id: 'confront', needsClue: 'wiped', q: { en: 'The jar WAS wiped clean. How would you know there’s nothing to find?', ar: 'البرطمان مُسح فعلاً. كيف عرفت أن الفحص لن يجد شيئاً؟' }, a: { en: '…I watch a lot of detective shows? The good ones always wipe— THE THIEVES. The thieves always wipe.', ar: '…أشاهد مسلسلات تحقيق كثيرة؟ الأذكياء يمسحون دائماً— اللصوص. أقصد اللصوص يمسحون دائماً.' }, reaction: { en: 'A folded sweet wrapper drops from his cuff and lands, gently, on the floor.', ar: 'يسقط من كمّه غلاف حلوى مطويّ، ويحطّ بهدوء على الأرض.' } },
        ],
      },
    ],
    solution: {
      culprit: 'tarek',
      evidence: ['wiped', 'tarek-blurt'],
      explanation: [
        { en: 'The innocent welcome the test — they know their prints aren’t there.', ar: 'الأبرياء يرحّبون بالفحص — فهم يعرفون أن بصماتهم ليست هناك.' },
        { en: 'Only the person who WIPED the jar knows nothing will be found. Tarek blurted out exactly that — knowledge only the culprit could have.', ar: 'وحده من مسح البرطمان يعرف أن الفحص لن يجد شيئاً. وهذا بالضبط ما أفلت من لسان طارق — معرفةٌ لا يملكها إلا الفاعل.' },
      ],
      epilogue: { en: 'The remaining sweets were in his pencil case, which no longer closed. Tarek refills the jar weekly from his allowance, and the teacher kept the wiped jar as a trophy of “the cheapest fingerprint kit ever: none.”', ar: 'كانت بقية الحلوى في مقلمته التي لم تعد تنغلق. يملأ طارق البرطمان أسبوعياً من مصروفه، واحتفظت المعلّمة بالبرطمان الممسوح كذكرى لـ«أرخص عدّة بصمات في التاريخ: لا شيء».' },
    },
  },

  // ─────────── THREE KEYS ───────────
  {
    id: 'q-oiled-lock', tier: 2, e: '🗝️',
    title: { en: 'Three Keys', ar: 'ثلاثة مفاتيح' },
    setting: { en: 'The Club Storeroom', ar: 'مخزن النادي' },
    bg: ['#e8eef0', '#d2dee2'],
    briefing: {
      en: 'The club storeroom was emptied overnight — and found locked again in the morning, the lock untouched. Only three keys to it exist. Detective Kawkab turned the old key in his fingers and asked the obvious question: who locks up after a robbery?',
      ar: 'أُفرغ مخزن النادي ليلاً — ووُجد في الصباح مقفلاً من جديد، والقفل سليم تماماً. لا يوجد سوى ثلاثة مفاتيح له. قلّب المحقق كوكب المفتاح القديم بين أصابعه وسأل السؤال البديهي: من يقفل الباب بعد سرقة؟',
    },
    hotspots: [
      { id: 'lock', e: '🔒', name: { en: 'The old lock', ar: 'القفل القديم' }, pos: { x: 30, y: 30 }, clueId: 'lock-fact' },
      { id: 'oil', e: '🛢️', name: { en: 'The oil tin', ar: 'علبة الزيت' }, pos: { x: 64, y: 62 }, clueId: 'oiling' },
      { id: 'records', e: '📁', name: { en: 'The club records', ar: 'سجلات النادي' }, pos: { x: 80, y: 28 }, clueId: 'alibis' },
      { id: 'shelf2', e: '🗄️', name: { en: 'The empty shelves', ar: 'الرفوف الفارغة' }, pos: { x: 46, y: 64 }, empty: { en: 'Dust outlines of everything that used to be here. Very neat work.', ar: 'خطوط غبار ترسم كل ما كان هنا. عملٌ مرتّب جداً.' } },
    ],
    clues: [
      { id: 'lock-fact', e: '🔒', name: { en: 'Locked again', ar: 'أُقفل من جديد' }, text: { en: 'The stiff old lock turns ONLY with one of its own three keys — and it was locked again after the theft.', ar: 'القفل القديم العنيد لا يدور إلا بأحد مفاتيحه الثلاثة — وقد أُقفل من جديد بعد السرقة.' } },
      { id: 'oiling', e: '🛢️', name: { en: 'The oiled lock', ar: 'القفل المزيّت' }, text: { en: 'Two days before the theft, Hadi was seen carefully oiling that very lock.', ar: 'قبل السرقة بيومين، شوهد هادي يزيّت ذلك القفل بالذات بعناية.' } },
      { id: 'alibis', e: '📁', name: { en: 'Two solid alibis', ar: 'حجّتان راسختان' }, text: { en: 'Rana has been abroad all week (passport stamps); Omar was in hospital with a broken arm (records). Both keys were with them.', ar: 'رنا مسافرة خارج البلاد طوال الأسبوع (أختام الجواز)؛ وعمر في المستشفى بذراع مكسورة (السجلات). ومفتاحاهما معهما.' } },
      { id: 'hadi-lost', e: '🗣', name: { en: 'Hadi’s lost key', ar: 'مفتاح هادي الضائع' }, text: { en: 'Hadi claims he LOST his key a month ago and hasn’t seen it since.', ar: 'يدّعي هادي أنه أضاع مفتاحه قبل شهر ولم يره منذ ذلك الحين.' } },
    ],
    suspects: [
      {
        id: 'rana', e: '✈️', name: { en: 'Rana', ar: 'رنا' },
        role: { en: 'Key holder #1. Currently very tanned.', ar: 'حاملة المفتاح الأول. عائدة من سفر واضح الأثر.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you this week?', ar: 'أين كنتِ هذا الأسبوع؟' }, a: { en: 'Abroad all week — my passport stamps prove it. My key was in my suitcase, under three swimsuits.', ar: 'خارج البلاد طوال الأسبوع — وأختام جوازي تثبت ذلك. ومفتاحي كان في حقيبتي تحت ثلاثة ثياب سباحة.' } },
        ],
      },
      {
        id: 'omar', e: '🏥', name: { en: 'Omar', ar: 'عمر' },
        role: { en: 'Key holder #2. Arm in a fresh cast.', ar: 'حامل المفتاح الثاني. ذراعه في جبيرة جديدة.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you this week?', ar: 'أين كنت هذا الأسبوع؟' }, a: { en: 'In hospital with this arm — the records show it. Try emptying a storeroom one-handed, I dare you.', ar: 'في المستشفى بهذه الذراع — والسجلّات تثبت ذلك. جرّب أن تفرغ مخزناً بيد واحدة، أتحداك.' } },
        ],
      },
      {
        id: 'hadi', e: '🤷', name: { en: 'Hadi', ar: 'هادي' },
        role: { en: 'Key holder #3. Lost his key. Allegedly.', ar: 'حامل المفتاح الثالث. أضاع مفتاحه. كما يُزعم.' },
        questions: [
          { id: 'alibi', q: { en: 'Where is your key?', ar: 'أين مفتاحك؟' }, a: { en: 'Don’t look at me — I LOST my key a month ago and haven’t seen it since. Probably down a drain somewhere.', ar: 'لا تنظروا إليّ — أضعتُ مفتاحي قبل شهر ولم أرَه منذ ذلك الحين. غالباً في بالوعة ما.' }, givesClue: 'hadi-lost' },
          { id: 'confront', needsClue: 'oiling', q: { en: 'Two days before the theft you were seen OILING this lock. Who oils a lock they cannot open?', ar: 'قبل السرقة بيومين شوهدت تزيّت هذا القفل. من يزيّت قفلاً لا يستطيع فتحه؟' }, a: { en: '…Maintenance! Civic duty! A lock deserves care whether or not one can… open it. Which I can’t. Obviously.', ar: '…صيانة! واجب تجاه النادي! القفل يستحق العناية سواء استطاع المرء… فتحه أم لا. وأنا لا أستطيع. طبعاً.' }, reaction: { en: 'His “lost” key, it will turn out, lives under his doormat. Freshly oiled.', ar: 'مفتاحه «الضائع»، كما سيتبيّن، يقيم تحت ممسحة بابه. مزيّتاً حديثاً.' } },
        ],
      },
    ],
    solution: {
      culprit: 'hadi',
      evidence: ['oiling', 'hadi-lost'],
      explanation: [
        { en: 'Locked-again with no damage means one of the three keys did it. Rana and Omar are provably elsewhere — with their keys.', ar: 'الإقفال من جديد دون أي ضرر يعني أن أحد المفاتيح الثلاثة استُخدم. ورنا وعمر غيابهما مثبت — ومفتاحاهما معهما.' },
        { en: 'Hadi says he lost his key a month ago — yet two days before the theft he was OILING the lock. Who oils a lock they cannot open? He was preparing it for a silent night visit.', ar: 'يقول هادي إنه أضاع مفتاحه قبل شهر — لكنه قبل السرقة بيومين كان يزيّت القفل. من يزيّت قفلاً لا يستطيع فتحه؟ كان يجهّزه لزيارةٍ ليليةٍ صامتة.' },
      ],
      epilogue: { en: 'The club’s trophies and gear were in Hadi’s garage, “for safekeeping — the storeroom lock was getting old.” The club replaced the lock, kept all three new keys on the president’s ring, and made Hadi polish the trophies monthly. His oil tin was confiscated.', ar: 'كانت كؤوس النادي وعتاده في كراج هادي، «للحفظ الآمن — فقفل المخزن شاخ». بدّل النادي القفل، وأبقى المفاتيح الثلاثة الجديدة في حلقة الرئيس، وكلّف هادي بتلميع الكؤوس شهرياً. أما علبة زيته فصودرت.' },
    },
  },

  // ─────────── THE CLOCK THAT READS 7:40 ───────────
  {
    id: 'q-stopped-clock', tier: 2, e: '🕰️',
    title: { en: 'The Clock That Reads 7:40', ar: 'الساعة المتوقفة عند ٧:٤٠' },
    setting: { en: 'The Office After Hours', ar: 'المكتب بعد الدوام' },
    bg: ['#eceae4', '#d9d5c8'],
    briefing: {
      en: 'The office charity box disappeared between seven and eight in the evening. Everyone’s departure was verified — except Nadia’s. Detective Kawkab looked up at the wall clock, which looked back, frozen. It had a story to tell.',
      ar: 'اختفى صندوق التبرعات من المكتب بين السابعة والثامنة مساءً. تحقّق المحقق كوكب من مغادرة الجميع — إلا نادية. رفع نظره إلى ساعة الحائط، فردّت النظر متجمدة. كان لديها ما تقوله.',
    },
    hotspots: [
      { id: 'clock', e: '🕰️', name: { en: 'The wall clock', ar: 'ساعة الحائط' }, pos: { x: 34, y: 24 }, clueId: 'frozen' },
      { id: 'logbook', e: '📔', name: { en: 'The exit log', ar: 'سجلّ الخروج' }, pos: { x: 70, y: 30 }, clueId: 'exits' },
      { id: 'desk3', e: '🖇️', name: { en: 'Nadia’s desk', ar: 'مكتب نادية' }, pos: { x: 48, y: 64 }, clueId: 'late-lamp' },
      { id: 'shelf3', e: '📦', name: { en: 'The charity shelf', ar: 'رفّ التبرعات' }, pos: { x: 82, y: 62 }, empty: { en: 'A dust-free square where the box stood. It gave generously, once.', ar: 'مربّع بلا غبار حيث كان الصندوق. كان معطاءً في يومٍ من الأيام.' } },
    ],
    clues: [
      { id: 'frozen', e: '🕰️', name: { en: 'The frozen clock', ar: 'الساعة المتجمدة' }, text: { en: 'A storm blackout the previous day froze the old wall clock at 7:40 — it has read 7:40 ever since. All evening, it showed 7:40.', ar: 'انقطاع كهرباء في اليوم السابق أوقف ساعة الحائط القديمة عند ٧:٤٠ — وبقيت تشير إلى ٧:٤٠ منذ ذلك الحين. طوال ذلك المساء كانت تُظهر ٧:٤٠.' } },
      { id: 'exits', e: '📔', name: { en: 'Verified exits', ar: 'مغادرات موثّقة' }, text: { en: 'Every worker’s departure is verified by the doorman — except Nadia’s. Nobody saw her leave.', ar: 'مغادرة كل موظف موثّقة عند البوّاب — إلا نادية. لم يرها أحد تغادر.' } },
      { id: 'late-lamp', e: '💡', name: { en: 'The warm lamp', ar: 'المصباح الدافئ' }, text: { en: 'The doorman, doing his 8 p.m. round, found Nadia’s desk lamp still warm to the touch.', ar: 'البوّاب، في جولته عند الثامنة، وجد مصباح مكتب نادية ما يزال دافئاً عند اللمس.' } },
      { id: 'nadia-claim2', e: '🗣', name: { en: 'Nadia’s exit story', ar: 'رواية خروج نادية' }, text: { en: 'Nadia says she left “at seven sharp” — and is CERTAIN, because on her way out the wall clock “said exactly seven.”', ar: 'تقول نادية إنها غادرت «في السابعة تماماً» — وهي متأكدة لأن ساعة الحائط، وهي خارجة، «كانت تشير إلى السابعة بالضبط».' } },
    ],
    suspects: [
      {
        id: 'karim2', e: '🧑‍💼', name: { en: 'Karim', ar: 'كريم' },
        role: { en: 'Accountant. Leaves on the dot, every day.', ar: 'محاسب. يغادر في موعده بالضبط كل يوم.' },
        questions: [
          { id: 'alibi', q: { en: 'When did you leave?', ar: 'متى غادرت؟' }, a: { en: 'Six-thirty, signed out with the doorman as always. The charity box was on its shelf — I dropped a coin in it on my way past.', ar: 'السادسة والنصف، ووقّعت عند البوّاب كالعادة. وصندوق التبرعات كان على رفّه — وضعت فيه قطعة نقود وأنا مارّ.' } },
        ],
      },
      {
        id: 'rasha', e: '👩‍💼', name: { en: 'Rasha', ar: 'رشا' },
        role: { en: 'Runs the charity drive herself.', ar: 'تدير حملة التبرعات بنفسها.' },
        questions: [
          { id: 'alibi', q: { en: 'When did you leave?', ar: 'متى غادرتِ؟' }, a: { en: 'Quarter to seven — the doorman logged it. I’d never touch that box; I spent a month FILLING it.', ar: 'السابعة إلا ربعاً — سجّلها البوّاب. لن أمسّ ذلك الصندوق أبداً؛ أمضيت شهراً كاملاً في ملئه.' } },
        ],
      },
      {
        id: 'nadia2', e: '👩‍💼', name: { en: 'Nadia', ar: 'نادية' },
        role: { en: 'Stays late. Nobody logged her exit.', ar: 'تتأخر في المكتب. ولم يسجّل أحد خروجها.' },
        questions: [
          { id: 'alibi', q: { en: 'When did you leave?', ar: 'متى غادرتِ؟' }, a: { en: 'At seven sharp. I’m certain, because on my way out I glanced at the wall clock and it said exactly seven.', ar: 'في السابعة تماماً. متأكدة، لأنني نظرت إلى ساعة الحائط وأنا خارجة وكانت تشير إلى السابعة بالضبط.' }, givesClue: 'nadia-claim2' },
          { id: 'confront', needsClue: 'frozen', q: { en: 'That clock froze at 7:40 YESTERDAY. All evening it read 7:40 — never “exactly seven”.', ar: 'تلك الساعة توقفت عند ٧:٤٠ أمس. طوال المساء كانت تُظهر ٧:٤٠ — لا «السابعة بالضبط» أبداً.' }, a: { en: '…Then I glanced at… my watch! Which I don’t wear. My phone! Which was… charging. At home.', ar: '…إذاً نظرتُ إلى… ساعة يدي! التي لا أرتديها. هاتفي! الذي كان… يُشحن. في البيت.' }, reaction: { en: 'The warm desk lamp says she was still there at eight.', ar: 'المصباح الدافئ يقول إنها كانت هناك حتى الثامنة.' } },
        ],
      },
    ],
    solution: {
      culprit: 'nadia2',
      evidence: ['frozen', 'nadia-claim2'],
      explanation: [
        { en: 'The clock froze at 7:40 the day BEFORE. At any moment of that evening, it read 7:40 — never “exactly seven”.', ar: 'الساعة توقفت عند ٧:٤٠ في اليوم السابق. في أي لحظة من ذلك المساء كانت تُشير إلى ٧:٤٠ — لا إلى «السابعة بالضبط».' },
        { en: 'She invented a supporting detail without checking it — which means the seven-o’clock exit itself is invented. She was still there in the theft hour, as her warm lamp confirms.', ar: 'اختلقت تفصيلة داعمة دون أن تتحقّق منها — ما يعني أن خروج السابعة نفسه مختلَق. كانت لا تزال هناك في ساعة السرقة، كما يؤكد مصباحها الدافئ.' },
      ],
      epilogue: { en: 'The charity box was in her bottom drawer, under a scarf. “I was going to donate it all — eventually — to myself, a little,” she admitted. She now matches every donation the box receives, and the frozen clock stays at 7:40, by office vote, “as a witness”.', ar: 'كان صندوق التبرعات في درجها السفلي تحت وشاح. اعترفت: «كنت سأتبرع بكل شيء — في النهاية — لنفسي، قليلاً». صارت الآن تُضاعف كل تبرع يصل إلى الصندوق، وبقيت الساعة عند ٧:٤٠ بتصويت المكتب — «بصفتها شاهدة».' },
    },
  },
];
