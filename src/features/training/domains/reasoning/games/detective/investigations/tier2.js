/*
 * Detective Kawkab — full investigations, TIER 2 (4 suspects, misdirection,
 * innocent secrets, 2 proving clues). Schema: see ./index.js
 */

export const INV_TIER2 = [
  // ═══════════════ THREE MINUTES OF DARKNESS ═══════════════
  {
    id: 'gallery-blackout', tier: 2, e: '🖼️',
    title: { en: 'Three Minutes of Darkness', ar: 'ثلاث دقائق من الظلام' },
    setting: { en: 'The City Gallery', ar: 'معرض المدينة' },
    bg: ['#ece8e2', '#d8d2c6'],
    assistant: { e: '👧', name: { en: 'Lola', ar: 'لولا' } },
    briefing: {
      en: 'At the city gallery’s grand gala, the lights died for exactly three minutes. When they came back, the famous little sketch “The Sleeping Fox” was gone from its frame — the frame itself still hanging, still perfect. Two hundred guests, one detective. Detective Kawkab handed Lola his coat. “Nobody leaves.”',
      ar: 'في الحفل الكبير لمعرض المدينة، انطفأت الأنوار ثلاث دقائق بالضبط. وحين عادت، كانت اللوحة الصغيرة الشهيرة «الثعلب النائم» قد اختفت من إطارها — بينما الإطار نفسه ما زال معلّقاً، سليماً تماماً. مئتا ضيف، ومحقق واحد. ناول المحقق كوكب معطفه للولا: «لا أحد يغادر.»',
    },
    hotspots: [
      { id: 'breaker', e: '🔻', name: { en: 'The basement breaker', ar: 'قاطع القبو' }, pos: { x: 16, y: 62 }, clueId: 'breaker' },
      { id: 'stairdoor', e: '🪪', name: { en: 'The service stairs', ar: 'درج الخدمة' }, pos: { x: 36, y: 40 }, clueId: 'staff-only' },
      { id: 'frame', e: '🖼️', name: { en: 'The empty frame', ar: 'الإطار الفارغ' }, pos: { x: 62, y: 24 }, clueId: 'frame' },
      { id: 'stage', e: '🎤', name: { en: 'The stage', ar: 'المسرح' }, pos: { x: 84, y: 46 }, clueId: 'mona-voice' },
      { id: 'cloakroom', e: '🎟️', name: { en: 'The cloakroom', ar: 'غرفة المعاطف' }, pos: { x: 20, y: 26 }, clueId: 'ticket-log' },
      { id: 'case', e: '💼', name: { en: 'Abandoned case', ar: 'الحقيبة المرمية' }, pos: { x: 58, y: 66 }, clueId: 'gloves' },
    ],
    clues: [
      { id: 'breaker', e: '🔻', name: { en: 'The flipped breaker', ar: 'القاطع المُطفأ' }, text: { en: 'The main breaker was flipped by HAND — no fault, no short-circuit, the engineer confirms. The darkness was made on purpose.', ar: 'القاطع الرئيسي أُطفئ يدوياً — لا عطل ولا تماسّ، بتأكيد المهندس. العتمة صُنعت عمداً.' } },
      { id: 'staff-only', e: '🪪', name: { en: 'Staff only', ar: 'للموظفين فقط' }, text: { en: 'The basement is STAFF ONLY — the stair door opens with a staff pass. Gala guests have no way down. Three staff in the building tonight: Mona, Karim, Fadi.', ar: 'القبو للموظفين فقط — باب الدرج يُفتح ببطاقة موظف. ضيوف الحفل لا يملكون طريقاً إلى الأسفل. ثلاثة موظفين في المبنى الليلة: منى وكريم وفادي.' } },
      { id: 'frame', e: '🖼️', name: { en: 'The untouched frame', ar: 'الإطار السليم' }, text: { en: 'Clips opened in the correct order, backing lifted cleanly, not one smudge on the glass. In three dark minutes — this is professional art handling.', ar: 'المشابك فُتحت بالترتيب الصحيح، والغطاء الخلفي رُفع بنظافة، ولا لطخة واحدة على الزجاج. في ثلاث دقائق من العتمة — هذا تعاملُ محترفٍ مع اللوحات.' } },
      { id: 'mona-voice', e: '🎤', name: { en: 'The unbroken speech', ar: 'الصوت المتواصل' }, text: { en: 'During all three dark minutes, Mona’s voice never stopped: she calmed the crowd from the stage microphone. Two hundred people heard her continuously.', ar: 'طوال دقائق العتمة الثلاث لم ينقطع صوت منى: ظلّت تهدّئ الحضور عبر ميكروفون المسرح. سمعها مئتا شخص دون انقطاع.' } },
      { id: 'ticket-log', e: '🎟️', name: { en: 'The cloakroom log', ar: 'سجلّ غرفة المعاطف' }, text: { en: 'Karim’s portfolio case: checked in at 7:30 — and collected at 9:02 with Karim’s OWN numbered ticket. The blackout hit at 9:05.', ar: 'حقيبة كريم: أودعت في ٧:٣٠ — واستُلمت في ٩:٠٢ ببطاقة كريم المرقّمة نفسها. والعتمة وقعت في ٩:٠٥.' } },
      { id: 'gloves', e: '🧤', name: { en: 'The intern gloves', ar: 'قفازا المتدرّبين' }, text: { en: 'Inside the abandoned case by the service stairs: thin cotton art-handling gloves, gallery issue — signed out to the intern program.', ar: 'داخل الحقيبة المرمية عند درج الخدمة: قفّازان قطنيان رفيعان للتعامل مع اللوحات، من عهدة المعرض — مسجّلان باسم برنامج المتدرّبين.' } },
      { id: 'fadi-sighting', e: '👤', name: { en: 'Fadi’s sighting', ar: 'ما رآه فادي' }, text: { en: 'Fadi, hiding in the basement, saw someone pass down the service stairs holding a FLAT SQUARE BAG. He didn’t see the face.', ar: 'فادي، المختبئ في القبو، رأى أحدهم يمرّ نازلاً درج الخدمة حاملاً حقيبة مسطّحة مربّعة. ولم يرَ الوجه.' } },
    ],
    suspects: [
      {
        id: 'mona', e: '👩‍💼', name: { en: 'Mona, the curator', ar: 'منى، أمينة المعرض' },
        role: { en: 'Knows every artwork like family. Was mid-speech when the lights died.', ar: 'تعرف كل لوحة كأنها من عائلتها. كانت في منتصف كلمتها حين انطفأت الأنوار.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you during the blackout?', ar: 'أين كنتِ أثناء العتمة؟' }, a: { en: 'On stage, mid-sentence. I kept talking through the dark so nobody would panic — two hundred people can confirm every word.', ar: 'على المسرح، في منتصف جملة. واصلت الكلام في العتمة كي لا يُصاب أحد بالذعر — ومئتا شخص يشهدون على كل كلمة.' } },
          { id: 'handling', q: { en: 'Who knows how to open that frame properly?', ar: 'من يعرف فتح ذلك الإطار كما يجب؟' }, a: { en: 'Only trained handlers — the clips have an order, the backing has a trick. We teach it to conservators… and to our interns.', ar: 'المدرَّبون فقط — للمشابك ترتيب، وللغطاء الخلفي حيلة. نعلّمها للمرمّمين… ولمتدرّبينا.' } },
        ],
      },
      {
        id: 'karim', e: '🎨', name: { en: 'Karim, the art student', ar: 'كريم، طالب الفنون' },
        role: { en: 'An intern trained in art handling. Carries a flat portfolio case everywhere.', ar: 'متدرّب مؤهَّل في التعامل مع اللوحات. يحمل حقيبة أعمال مسطّحة أينما ذهب.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you during the blackout?', ar: 'أين كنت أثناء العتمة؟' }, a: { en: 'Looking at the sculptures. Alone. In the far wing. Sculptures are best appreciated… alone. In far wings.', ar: 'أتأمل المنحوتات. وحدي. في الجناح البعيد. المنحوتات تُتذوَّق على أفضل وجه… وحيداً. في الأجنحة البعيدة.' } },
          { id: 'ticket', needsClue: 'ticket-log', q: { en: 'Your case left the cloakroom at 9:02 — with YOUR own ticket. Three minutes before the darkness.', ar: 'حقيبتك خرجت من غرفة المعاطف في ٩:٠٢ — ببطاقتك أنت. قبل العتمة بثلاث دقائق.' }, a: { en: 'Logs make mistakes! Tickets get copied! Someone stole my case to FRAME me — the zip was broken when they found it!', ar: 'السجلات تخطئ! والبطاقات تُنسخ! أحدهم سرق حقيبتي ليوقع بي — السحّاب كان مكسوراً حين وجدوها!' } },
          { id: 'gloves', needsClue: 'gloves', q: { en: 'The gloves in that case are signed out to the intern program. Your program.', ar: 'القفازان في تلك الحقيبة من عهدة برنامج المتدرّبين. برنامجك أنت.' }, a: { en: '…Gloves get stolen too! This gallery has a serious theft problem, frankly!', ar: '…القفازات تُسرق أيضاً! هذا المعرض يعاني مشكلة سرقات خطيرة، بصراحة!' }, reaction: { en: 'Lola counts on three fingers: staff pass, art training, a flat square bag.', ar: 'تعدّ لولا على ثلاثة أصابع: بطاقة موظف، تدريب فني، حقيبة مسطّحة مربّعة.' } },
        ],
      },
      {
        id: 'fadi', e: '🔌', name: { en: 'Fadi, the electrician', ar: 'فادي، الكهربائي' },
        role: { en: 'On duty tonight. Nervous. Keeps wiping his hands.', ar: 'في مناوبته الليلة. متوتّر، ولا يكفّ عن مسح يديه.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you during the blackout?', ar: 'أين كنت أثناء العتمة؟' }, a: { en: 'Around! Checking… wires. Electrical things. Why does everyone keep asking ME?', ar: 'في الجوار! أفحص… الأسلاك. أموراً كهربائية. لماذا يسألني الجميع أنا بالذات؟' } },
          { id: 'basement', needsClue: 'breaker', q: { en: 'The breaker was flipped by hand. In YOUR basement.', ar: 'القاطع أُطفئ يدوياً. في قبوك أنت.' }, a: { en: 'I WAS down there — but fixing a fuse I botched this afternoon! I was scared I’d be blamed! And while I hid, someone came down the service stairs past me — holding a flat square bag. I didn’t see the face.', ar: 'كنتُ هناك فعلاً — لكن لأصلح صمّاماً أفسدته بعد الظهر! خفت أن أُتَّهم! وبينما كنت مختبئاً، مرّ أحدهم بجانبي نازلاً درج الخدمة — يحمل حقيبة مسطّحة مربّعة. لم أرَ الوجه.' }, givesClue: 'fadi-sighting', reaction: { en: '“If I wanted to steal, why would I confess I was down there at all?”', ar: '«لو أردت السرقة، فلماذا أعترف أصلاً أنني كنت هناك؟»' } },
        ],
      },
      {
        id: 'saleh', e: '🎩', name: { en: 'Mr. Saleh, the collector', ar: 'السيد صالح، جامع التحف' },
        role: { en: 'Offered to buy “The Sleeping Fox” three times. Refused three times.', ar: 'عرض شراء «الثعلب النائم» ثلاث مرات. ورُفض ثلاث مرات.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you when the lights died?', ar: 'أين كنت حين انطفأت الأنوار؟' }, a: { en: 'Two steps from the sketch, admiring it — as I have every right to. When the lights returned: an empty frame. Tragic. Simply tragic.', ar: 'على بُعد خطوتين من اللوحة، أتأملها — وهذا حقّي تماماً. وحين عادت الأنوار: إطار فارغ. مأساة. مأساة حقيقية.' } },
          { id: 'buy', q: { en: 'You wanted that sketch badly.', ar: 'كنت تريد تلك اللوحة بشدة.' }, a: { en: 'I offered HONEST money, three times. I buy art, detective — I don’t grope for it in the dark like a pickpocket.', ar: 'عرضتُ مالاً حلالاً، ثلاث مرات. أنا أشتري الفن أيها المحقق — لا أتحسّسه في الظلام كنشّال.' } },
        ],
      },
    ],
    solution: {
      culprit: 'karim',
      evidence: ['ticket-log', 'gloves'],
      explanation: [
        { en: 'The breaker was flipped by a staff hand — no guest reaches the basement. Mona never stopped speaking; Fadi hid with a guilty fuse; Mr. Saleh could want, but never reach.', ar: 'القاطع أطفأته يدُ موظف — لا ضيف يبلغ القبو. منى لم ينقطع صوتها؛ وفادي اختبأ بذنب صمّامه؛ والسيد صالح يشتهي ولا يستطيع.' },
        { en: 'The frame was opened like a conservator would — training only staff and interns receive.', ar: 'الإطار فُتح كما يفتحه مرمّم محترف — تدريبٌ لا يناله إلا الموظفون والمتدرّبون.' },
        { en: 'And Karim’s “stolen” case left the cloakroom at 9:02 with HIS own ticket, carrying intern-issue gloves — three minutes before the darkness he needed.', ar: 'وحقيبة كريم «المسروقة» خرجت من غرفة المعاطف في ٩:٠٢ ببطاقته هو، وفيها قفازا المتدرّبين — قبل العتمة التي احتاجها بثلاث دقائق.' },
      ],
      epilogue: {
        en: 'The sketch was exactly where a handler would hide it: sealed inside a hollow presentation board in the intern studio, flawless. Karim confessed in a whisper — he never meant to sell it. He wanted “one real masterpiece” on his own wall, just for a while, because he was sure he’d never paint one. The gallery pressed no charges on one condition: two years of supervised restoration work, where his careful hands might learn a better use. Mona rehung “The Sleeping Fox” herself.',
        ar: 'كانت اللوحة تماماً حيث يخبّئها محترف: محكمة الإغلاق داخل لوح عرضٍ مجوّف في مرسم المتدرّبين، سليمة بلا خدش. اعترف كريم هامساً — لم يكن ينوي بيعها قط. أراد «تحفة حقيقية واحدة» على جداره هو، لبعض الوقت فقط، لأنه كان موقناً أنه لن يرسم واحدة أبداً. لم يقاضِه المعرض بشرط واحد: سنتان من أعمال الترميم تحت الإشراف، حيث قد تتعلّم يداه الحريصتان استخداماً أنبل. أعادت منى تعليق «الثعلب النائم» بنفسها.',
      },
    },
  },

  // ═══════════════ THE MIDNIGHT EXPRESS ═══════════════
  {
    id: 'midnight-express', tier: 2, e: '🚂',
    title: { en: 'The Midnight Express', ar: 'قطار منتصف الليل' },
    setting: { en: 'The Night Train', ar: 'قطار الليل' },
    bg: ['#e2e6ee', '#c9cfdd'],
    assistant: { e: '🧒', name: { en: 'Ramy', ar: 'رامي' } },
    briefing: {
      en: 'Somewhere between Qamar Station and the coast, Professor Idris opened his locked compartment cabinet and found his life’s treasure gone: a stamp album worth a small house. The train hums through the dark; the thief is still aboard. Detective Kawkab, travelling home with Ramy, put down his tea. “Nobody gets off at the next stop.”',
      ar: 'في مكان ما بين محطة قمر والساحل، فتح البروفيسور إدريس خزانة مقصورته المقفلة فوجد كنز عمره قد اختفى: ألبوم طوابع يساوي بيتاً صغيراً. القطار يهدر في الظلام؛ واللص ما يزال على متنه. وضع المحقق كوكب — العائد إلى بيته مع رامي — كوب شايه جانباً: «لا أحد ينزل في المحطة القادمة.»',
    },
    hotspots: [
      { id: 'compartment', e: '🔒', name: { en: 'The compartment', ar: 'المقصورة' }, pos: { x: 16, y: 30 }, clueId: 'locked-room' },
      { id: 'service', e: '🗝️', name: { en: 'The service door', ar: 'الباب الخدمي' }, pos: { x: 38, y: 60 }, clueId: 'service-door' },
      { id: 'dining', e: '🍽️', name: { en: 'The dining car', ar: 'عربة الطعام' }, pos: { x: 64, y: 28 }, clueId: 'dining-locked' },
      { id: 'extinguisher', e: '🧯', name: { en: 'Fire cabinet', ar: 'خزانة المطفأة' }, pos: { x: 84, y: 58 }, clueId: 'album-found' },
      { id: 'corridor', e: '🚃', name: { en: 'The corridor', ar: 'ممرّ العربة' }, pos: { x: 54, y: 74 }, empty: { en: 'Swaying gently. Smells of tea and night air.', ar: 'يتمايل بهدوء. رائحته شاي وهواء ليل.' } },
    ],
    clues: [
      { id: 'locked-room', e: '🔒', name: { en: 'The locked compartment', ar: 'المقصورة المقفلة' }, text: { en: 'Main door locked all night, the only key in the professor’s pocket. Window open 8 cm — a cat couldn’t pass. The album was there at 23:40, gone at 00:10.', ar: 'الباب مقفل طوال الليل، والمفتاح الوحيد في جيب البروفيسور. النافذة مفتوحة ٨ سنتيمترات — لا تعبرها قطة. الألبوم كان موجوداً في ٢٣:٤٠ ومفقوداً في ٠٠:١٠.' } },
      { id: 'service-door', e: '🗝️', name: { en: 'The service door', ar: 'الباب الخدمي' }, text: { en: 'A narrow connecting door behind the curtain — it opens ONLY with a railway staff key. The conductor carries one on his belt.', ar: 'باب موصِل ضيّق خلف الستارة — لا يُفتح إلا بمفتاح موظفي السكة. ومفتّش التذاكر يحمل واحداً في حزامه.' } },
      { id: 'dining-locked', e: '🍽️', name: { en: 'Dining car: closed', ar: 'عربة الطعام: مغلقة' }, text: { en: 'The dining car closed and was LOCKED at 23:30 — posted on its door, confirmed by the chef.', ar: 'عربة الطعام أُغلقت وأُقفلت في ٢٣:٣٠ — اللافتة على بابها، والطاهي يؤكد.' } },
      { id: 'cubby', e: '🪝', name: { en: 'The unguarded key', ar: 'المفتاح بلا حراسة' }, text: { en: 'Around midnight, for nearly half an hour, the staff key hung in the open cubby while the conductor napped — reachable by anyone in the carriage.', ar: 'قرابة منتصف الليل، ولنصف ساعة تقريباً، كان مفتاح الطاقم معلّقاً في الخزانة المفتوحة بينما غفا المفتّش — في متناول أي راكب في العربة.' } },
      { id: 'younes-sighting', e: '🫖', name: { en: 'Younes’s sighting', ar: 'ما رآه يونس' }, text: { en: 'At 23:50 Younes passed Walid in the corridor, walking toward the staff cubby end. Walid said he was “off to the dining car for a bite” — and waved away the tea.', ar: 'في ٢٣:٥٠ مرّ يونس بوليد في الممر متجهاً نحو طرف خزانة الطاقم. قال وليد إنه «ذاهب إلى عربة الطعام لألتقط لقمة» — وصرف الشاي بيده.' } },
      { id: 'album-found', e: '🩹', name: { en: 'The album, found', ar: 'الألبوم، وقد وُجد' }, text: { en: 'Taped behind the fire extinguisher, wrapped in a scarf: the album. The blue zigzag medical tape matches, edge for edge, the half-used roll in Walid’s coat pocket — and the scarf is the one Walid wore at boarding, in the professor’s platform photo.', ar: 'مثبّتاً بشريط لاصق خلف المطفأة وملفوفاً بوشاح: الألبوم. الشريط الطبي الأزرق المتعرّج يطابق، سنّاً بسنّ، اللفافة نصف المستعملة في جيب معطف وليد — والوشاح هو نفسه الذي ارتداه وليد عند الصعود، في صورة الرصيف التي التقطها البروفيسور.' } },
    ],
    witnesses: [
      {
        id: 'idris', e: '🎓', name: { en: 'Professor Idris', ar: 'البروفيسور إدريس' },
        role: { en: 'The victim. Holds the only compartment key.', ar: 'الضحية. يحمل مفتاح المقصورة الوحيد.' },
        questions: [
          { id: 'when', q: { en: 'When did you last see the album?', ar: 'متى رأيت الألبوم آخر مرة؟' }, a: { en: 'At 23:40 — I stepped out to stretch my legs and locked the door behind me. I always lock it. ALWAYS. At 00:10 it was gone.', ar: 'في ٢٣:٤٠ — خرجت أمدّد ساقيّ وأقفلت الباب خلفي. أنا أقفله دائماً. دائماً! وفي ٠٠:١٠ كان قد اختفى.' } },
          { id: 'who', q: { en: 'Who knew the album was aboard?', ar: 'من كان يعلم أن الألبوم على متن القطار؟' }, a: { en: 'Only Walid, my nephew. It’s promised to him in the will — “someday,” as I always tell him. He checks the album more often than he checks on me.', ar: 'وليد فقط، ابن أخي. إنه موعود له في الوصية — «يوماً ما»، كما أقول له دائماً. إنه يتفقّد الألبوم أكثر مما يتفقّدني.' } },
        ],
      },
    ],
    suspects: [
      {
        id: 'walid', e: '🧑‍💼', name: { en: 'Walid, the nephew', ar: 'وليد، ابن الأخ' },
        role: { en: 'Travelling with his uncle. The album is promised to him — “someday.”', ar: 'يسافر مع عمّه. الألبوم موعودٌ له — «يوماً ما».' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you around midnight?', ar: 'أين كنت قرابة منتصف الليل؟' }, a: { en: 'I went to the dining car around ten to midnight, found a sandwich, ate it there, came back. Simple.', ar: 'ذهبت إلى عربة الطعام قبل منتصف الليل بعشر دقائق تقريباً، وجدت شطيرة، أكلتها هناك وعدت. الأمر بسيط.' } },
          { id: 'dining', needsClue: 'dining-locked', q: { en: 'The dining car was locked at 23:30. Where did this sandwich happen, exactly?', ar: 'عربة الطعام أُقفلت في ٢٣:٣٠. أين حدثت هذه الشطيرة بالضبط؟' }, a: { en: '…It was closed, yes! So I ate a sandwich from… my pocket. Standing. In the corridor. A pocket sandwich, detective, perfectly normal.', ar: '…كانت مغلقة، نعم! فأكلت شطيرة من… جيبي. واقفاً. في الممر. شطيرة جيب أيها المحقق، أمر طبيعي تماماً.' }, reaction: { en: 'Ramy writes: “nobody dines through a locked door.”', ar: 'يكتب رامي: «لا أحد يتعشّى عبر باب مقفل».' } },
          { id: 'album', needsClue: 'album-found', q: { en: 'Your scarf. Your zigzag tape. Behind the extinguisher.', ar: 'وشاحك. وشريطك المتعرّج. خلف المطفأة.' }, a: { en: 'It would have been mine ANYWAY. Someday. I just… made someday sooner.', ar: 'كان سيصير لي على أي حال. يوماً ما. أنا فقط… جعلت «يوماً ما» أقرب.' } },
        ],
      },
      {
        id: 'abufahd', e: '🎫', name: { en: 'Abu Fahd, the conductor', ar: 'أبو فهد، المفتّش' },
        role: { en: 'Thirty years on this line. Knows every squeaking door.', ar: 'ثلاثون سنة على هذا الخط. يعرف كل بابٍ صرّار.' },
        questions: [
          { id: 'alibi', q: { en: 'Where was your staff key tonight?', ar: 'أين كان مفتاح الطاقم الليلة؟' }, a: { en: 'On my belt! Where it lives! Thirty years and I’ve never lost a passenger, a bag, or a… key.', ar: 'في حزامي! حيث يقيم! ثلاثون سنة وما ضاع مني راكب ولا حقيبة ولا… مفتاح.' } },
          { id: 'key', needsClue: 'service-door', q: { en: 'That service door answers only to YOUR key. Talk to me about tonight.', ar: 'ذلك الباب الخدمي لا يستجيب إلا لمفتاحك أنت. حدّثني عن الليلة.' }, a: { en: '…The key wasn’t on my belt, alright? I hang it in the staff cubby when I… rest my eyes. Twenty minutes, twenty-five at most, around midnight. Thirty years and I’ve never lost a passenger!', ar: '…لم يكن المفتاح في حزامي، حسناً؟ أعلّقه في خزانة الطاقم حين… أُريح عينيّ. عشرون دقيقة، خمس وعشرون على الأكثر، قرابة منتصف الليل. ثلاثون سنة وما ضاع مني راكب!' }, givesClue: 'cubby', reaction: { en: 'He looks at his boots. His boots offer no comfort.', ar: 'ينظر إلى حذائه. وحذاؤه لا يواسيه.' } },
        ],
      },
      {
        id: 'huda', e: '😴', name: { en: 'Ms. Huda, passenger', ar: 'السيدة هدى، راكبة' },
        role: { en: 'Boarded with one small bag. Slept, she says, from departure to alarm.', ar: 'صعدت بحقيبة صغيرة واحدة. ونامت، كما تقول، من الانطلاق حتى الجرس.' },
        questions: [
          { id: 'alibi', q: { en: 'What did you hear in the night?', ar: 'ماذا سمعتِ أثناء الليل؟' }, a: { en: 'Trolley wheels and snoring, and I slept through both. Wake me when there’s coffee.', ar: 'عجلات عربة وشخيراً، ونمتُ رغم الاثنين. أيقظوني حين تجهز القهوة.' } },
        ],
      },
      {
        id: 'younes', e: '🫖', name: { en: 'Younes, the tea seller', ar: 'يونس، بائع الشاي' },
        role: { en: 'Rolls his trolley end to end all night. Sees everyone.', ar: 'يجرّ عربته من أول القطار إلى آخره طوال الليل. يرى الجميع.' },
        questions: [
          { id: 'saw', q: { en: 'Who moved through the carriage tonight?', ar: 'من تحرّك في العربة الليلة؟' }, a: { en: 'At 23:50 I passed Mr. Walid in the corridor, walking toward the staff cubby end. He said “just off to the dining car for a bite.” I remember because I offered him tea and he waved me off. Nobody refuses my tea.', ar: 'في ٢٣:٥٠ مررتُ بالسيد وليد في الممر متجهاً نحو طرف خزانة الطاقم. قال: «ذاهب إلى عربة الطعام لألتقط لقمة». أذكرها لأنني عرضت عليه شاياً فصرفني بيده. لا أحد يرفض شايي.' }, givesClue: 'younes-sighting' },
        ],
      },
    ],
    solution: {
      culprit: 'walid',
      evidence: ['dining-locked', 'album-found'],
      explanation: [
        { en: 'The compartment door never opened and an 8 cm window defeats any thief — the way in was the service door, and around midnight its key hung unguarded in the cubby.', ar: 'باب المقصورة لم يُفتح، ونافذة ٨ سنتيمترات تهزم أي لص — الطريق كان الباب الخدمي، وقرابة منتصف الليل كان مفتاحه معلّقاً بلا حراسة.' },
        { en: 'Walid walked toward that cubby at 23:50 claiming he was “off to the dining car” — a car that had been locked since 23:30. The lie marks the window; the window fits the theft.', ar: 'مشى وليد نحو تلك الخزانة في ٢٣:٥٠ زاعماً أنه «ذاهب إلى عربة الطعام» — العربة المقفلة منذ ٢٣:٣٠. الكذبة تحدّد النافذة الزمنية؛ والنافذة تطابق السرقة.' },
        { en: 'And the album, hidden to be collected at the last stop, wears his boarding scarf and his blue zigzag tape — edge for edge.', ar: 'والألبوم، المخبّأ ليُستعاد في المحطة الأخيرة، يلبس وشاحه وشريطه الأزرق المتعرّج — سنّاً بسنّ.' },
      ],
      epilogue: {
        en: 'Professor Idris didn’t shout. That was the worst part, Walid said later — he just looked old, suddenly, holding his album on a swaying train. At the last station Walid signed a confession, and the professor rewrote his will: the album goes to the railway museum, “where impatient hands can see it but never own it.” Abu Fahd bought an alarm clock and, out of stubborn pride, has not napped since. Ramy got a stamp — a small blue one with a train on it — as a detective’s fee.',
        ar: 'لم يصرخ البروفيسور إدريس. قال وليد لاحقاً إن ذلك كان أقسى ما في الأمر — بدا فجأةً عجوزاً وهو يحتضن ألبومه في قطارٍ يتمايل. في المحطة الأخيرة وقّع وليد اعترافه، وأعاد البروفيسور كتابة وصيته: الألبوم إلى متحف السكك الحديدية، «حيث تراه الأيدي العجولة ولا تملكه أبداً». اشترى أبو فهد منبّهاً، وبدافع الكبرياء العنيد لم يغفُ منذ ذلك الحين. أما رامي فنال طابعاً — أزرق صغيراً عليه قطار — أجرةَ محقق.',
      },
    },
  },

  // ═══════════════ THE SUNKEN AMPHORA ═══════════════
  {
    id: 'sunken-amphora', tier: 2, e: '🏺',
    title: { en: 'The Sunken Amphora', ar: 'الجرّة الغارقة' },
    setting: { en: 'Port Sadaf Dive Club', ar: 'نادي الغوص في ميناء صدف' },
    bg: ['#e0edee', '#c6dee0'],
    assistant: { e: '🦊', name: { en: 'Noor', ar: 'نور' } },
    briefing: {
      en: 'The dive club of Port Sadaf spent a whole summer raising a two-thousand-year-old amphora from the seabed. On handover morning, the museum expert went white: “This is a REPLICA. Recently fired. Excellent — but fake.” Somewhere between the sea and the museum van, someone swapped a civilization’s jar for a copy. Detective Kawkab arrived with Noor, who disliked the harbour smell and said so with her whole face.',
      ar: 'أمضى نادي الغوص في ميناء صدف صيفاً كاملاً في انتشال جرّة عمرها ألفا سنة من قاع البحر. وفي صباح التسليم، شحب خبير المتحف: «هذه نسخة مقلَّدة. حديثة الحرق. متقنة — لكنها مزيفة.» في مكانٍ ما بين البحر وشاحنة المتحف، بدّل أحدهم جرّة حضارةٍ كاملة بنسخة. وصل المحقق كوكب مع نور، التي لم تُعجبها رائحة الميناء وعبّرت عن ذلك بكامل وجهها.',
    },
    hotspots: [
      { id: 'replica', e: '🏺', name: { en: 'The replica', ar: 'النسخة المقلَّدة' }, pos: { x: 30, y: 28 }, clueId: 'perfect-copy' },
      { id: 'rules', e: '📵', name: { en: 'The club rules board', ar: 'لوحة قواعد النادي' }, pos: { x: 60, y: 24 }, clueId: 'no-photos' },
      { id: 'kiln', e: '🔥', name: { en: 'Jaber’s kiln studio', ar: 'مشغل جابر' }, pos: { x: 84, y: 50 }, clueId: 'kiln-imprint' },
      { id: 'gate', e: '🚪', name: { en: 'The storeroom gate log', ar: 'سجلّ بوابة المخزن' }, pos: { x: 18, y: 60 }, clueId: 'gate-log' },
      { id: 'camera-bag', e: '📷', name: { en: 'The camera bag', ar: 'حقيبة الكاميرا' }, pos: { x: 52, y: 66 }, clueId: 'hidden-card' },
    ],
    clues: [
      { id: 'perfect-copy', e: '🔍', name: { en: 'A copy too perfect', ar: 'نسخة أدقّ من اللازم' }, text: { en: 'The replica copies details invisible from a distance — including a repair mark on the INNER rim that only shows under direct light. Its maker studied the original up close, repeatedly.', ar: 'النسخة تحاكي تفاصيل لا تُرى من بعيد — بما فيها أثر ترميم على الحافة الداخلية لا يظهر إلا تحت إضاءة مباشرة. صانعها درس الأصل عن قرب، مراراً.' } },
      { id: 'no-photos', e: '📵', name: { en: 'The secret find', ar: 'الاكتشاف السرّي' }, text: { en: 'By club rules, NO photos of the amphora were ever published or shared — the find stayed secret until handover day. Only insiders ever saw it.', ar: 'بحسب قواعد النادي، لم تُنشر أو تُتداول أي صور للجرّة إطلاقاً — بقي الاكتشاف سرّياً حتى يوم التسليم. لم يرها إلا أهل الداخل.' } },
      { id: 'kiln-imprint', e: '✏️', name: { en: 'The kiln ledger imprint', ar: 'انطباع دفتر الفرن' }, text: { en: 'Tuesday’s page was torn from the kiln ledger — but Jaber writes hard. Pencil shading raised the imprint: “Tue — private firing, large piece, 6 hrs — R. M., paid cash.”', ar: 'صفحة الثلاثاء ممزوقة من دفتر الفرن — لكن جابر يكتب بضغطة قوية. تظليل الرصاص أظهر الانطباع: «الثلاثاء — حرق خاص، قطعة كبيرة، ٦ ساعات — ر. م.، دفع نقداً.»' } },
      { id: 'gate-log', e: '🚪', name: { en: 'The gate log', ar: 'سجلّ البوابة' }, text: { en: 'Marwan the driver never once entered the storeroom — the sign-in sheet proves he only ever waited at the gate.', ar: 'مروان السائق لم يدخل المخزن ولا مرة — سجلّ الدخول يثبت أنه كان ينتظر عند البوابة دائماً.' } },
      { id: 'hidden-card', e: '💾', name: { en: 'The hidden memory card', ar: 'بطاقة الذاكرة المخفية' }, text: { en: 'In the camera bag’s lining: a second, unlabelled card — 412 photos of the amphora, inner rim, base stamp, every scar, under studio lamps. Folded beside it: Jaber’s cash receipt for a six-hour firing, signed “R. M.”', ar: 'في بطانة حقيبة الكاميرا: بطاقة ثانية بلا عنوان — ٤١٢ صورة للجرّة، الحافة الداخلية وختم القاعدة وكل ندبة، تحت مصابيح استوديو. ومطويّاً بجانبها: إيصال جابر النقدي لحرقٍ من ست ساعات، موقَّعاً «ر. م.»' } },
    ],
    suspects: [
      {
        id: 'omar', e: '🤿', name: { en: 'Captain Omar, club head', ar: 'الكابتن عمر، رئيس النادي' },
        role: { en: 'Led every dive. Keeps the storeroom key with his whistle.', ar: 'قاد كل غطسة. يعلّق مفتاح المخزن مع صفّارته.' },
        questions: [
          { id: 'who-saw', q: { en: 'Who ever saw the amphora up close?', ar: 'من رأى الجرّة عن قرب؟' }, a: { en: 'Only club members. It slept in our storeroom, and the storeroom slept behind my key. I counted heads at every viewing.', ar: 'أعضاء النادي فقط. كانت تنام في مخزننا، والمخزن ينام خلف مفتاحي. وكنت أعدّ الرؤوس في كل معاينة.' } },
          { id: 'handover', q: { en: 'Who packed it for the museum?', ar: 'من غلّفها للمتحف؟' }, a: { en: 'Rashid documented the packing while two divers wrapped it. Then it waited by the gate for Marwan’s van. That was the plan, anyway.', ar: 'رشيد وثّق التغليف بينما لفّها غطّاسان. ثم انتظرت عند البوابة شاحنة مروان. تلك كانت الخطة على الأقل.' } },
        ],
      },
      {
        id: 'rashid', e: '📷', name: { en: 'Rashid, club photographer', ar: 'رشيد، مصوّر النادي' },
        role: { en: 'Documented the amphora “from every angle, in every light.”', ar: 'وثّق الجرّة «من كل زاوية وفي كل إضاءة».' },
        questions: [
          { id: 'photos', q: { en: 'How many photos did you take of it?', ar: 'كم صورة التقطت لها؟' }, a: { en: 'The agreed thirty, for the club archive. All on the official card, all accounted for. Documentation IS my job, detective.', ar: 'الثلاثين المتفق عليها، لأرشيف النادي. كلها على البطاقة الرسمية، وكلها محسوبة. التوثيق هو عملي أيها المحقق.' } },
          { id: 'card', needsClue: 'hidden-card', q: { en: 'And the 412 photos on the card in your bag lining? With a kiln receipt signed “R. M.”?', ar: 'وماذا عن ٤١٢ صورة على البطاقة في بطانة حقيبتك؟ مع إيصال فرن موقَّع «ر. م.»؟' }, a: { en: '…Those photos are… thorough. Being thorough is not a crime. The receipt is— I collect receipts! Paper interests me!', ar: '…تلك الصور… دقيقة فحسب. والدقة ليست جريمة. أما الإيصال فـ— أنا أجمع الإيصالات! الورق يثير اهتمامي!' }, reaction: { en: 'Noor sneezes at his bag. Fresh clay dust.', ar: 'تعطس نور قرب حقيبته. غبار طينٍ حديث.' } },
          { id: 'initials', needsClue: 'kiln-imprint', q: { en: '“R. M.” — Rashid. Six hours at the kiln, paid cash.', ar: '«ر. م.» — رشيد المصوّر. ست ساعات في الفرن، دفعاً نقدياً.' }, a: { en: 'R. M. could be ANYONE. Marwan is R. M. too, if you squint! Interrogate the alphabet, why don’t you!', ar: '«ر. م.» قد يكون أي أحد. مروان أيضاً «م. ر.» إن قلبتها! استجوب الأبجدية كلها إذاً!' } },
        ],
      },
      {
        id: 'jaber', e: '🏺', name: { en: 'Ustaz Jaber, potter', ar: 'الأستاذ جابر، الخزّاف' },
        role: { en: 'Runs the only big kiln in town. Every firing is logged by law.', ar: 'يدير الفرن الكبير الوحيد في البلدة. وكل حرقٍ يُسجَّل بحكم القانون.' },
        questions: [
          { id: 'page', q: { en: 'Why is Tuesday’s page torn from your ledger?', ar: 'لماذا صفحة الثلاثاء ممزوقة من دفترك؟' }, a: { en: 'I tore it MYSELF — I fired my nephew’s school project without a permit that day and didn’t want a fine! That’s ALL it was!', ar: 'أنا من مزّقها — حرقتُ مشروع ابن أختي المدرسي بلا تصريح ذلك اليوم ولم أرد غرامة! هذا كل ما في الأمر!' } },
          { id: 'rm', needsClue: 'kiln-imprint', q: { en: 'Then who is “R. M., private firing, large piece, six hours”?', ar: 'إذاً من هو «ر. م.، حرق خاص، قطعة كبيرة، ست ساعات»؟' }, a: { en: 'He came with his own wrapped piece, used the kiln himself, paid cash, left. Kept his cap low the whole time. I mind my own business — TOO well, apparently.', ar: 'جاء بقطعته ملفوفة، استخدم الفرن بنفسه، دفع نقداً وغادر. أبقى قبّعته منخفضة طوال الوقت. أنا لا أتدخّل بشؤون أحد — أكثر من اللازم كما يبدو.' } },
        ],
      },
      {
        id: 'marwan', e: '🚚', name: { en: 'Marwan, the driver', ar: 'مروان، السائق' },
        role: { en: 'Hired to drive the amphora to the museum. Never touched it, he swears.', ar: 'استُؤجر لنقل الجرّة إلى المتحف. لم يلمسها، كما يقسم.' },
        questions: [
          { id: 'alibi', q: { en: 'Were you ever inside the storeroom?', ar: 'هل دخلت المخزن يوماً؟' }, a: { en: 'Not even once, I swear — check the gate log. I wait at the gate, they load the van, I drive. That is the entire job.', ar: 'ولا مرة واحدة، أقسم — راجع سجلّ البوابة. أنتظر عند البوابة، يحمّلون الشاحنة، وأقود. هذه هي الوظيفة كلها.' } },
        ],
      },
    ],
    solution: {
      culprit: 'rashid',
      evidence: ['kiln-imprint', 'hidden-card'],
      explanation: [
        { en: 'The forgery needed an insider’s eyes — no photo ever left the club, and you cannot guess a repair mark hidden on an inner rim. 412 secret photos are exactly those eyes.', ar: 'التزوير احتاج عينَي شخصٍ من الداخل — لا صورة غادرت النادي قط، ولا أحد يخمّن أثر ترميم مخبّأ في حافة داخلية. ٤١٢ صورة سرّية هي تلك العينان تماماً.' },
        { en: 'It needed a kiln: the ledger imprint records “R. M., large piece, six hours” — and the matching cash receipt lives in Rashid’s bag lining.', ar: 'واحتاج فرناً: انطباع الدفتر يسجّل «ر. م.، قطعة كبيرة، ست ساعات» — والإيصال النقدي المطابق يقيم في بطانة حقيبة رشيد.' },
        { en: 'Marwan never passed the gate; Omar’s key doesn’t explain the photos; Jaber logged, panicked and tore paper — forgers don’t leave receipts in other people’s ledgers. “Thorough” photographed the original, fired the copy, and made the swap while “documenting the packing.”', ar: 'مروان لم يتجاوز البوابة؛ ومفتاح عمر لا يفسّر الصور؛ وجابر سجّل وذُعر ومزّق ورقة — والمزوِّرون لا يتركون إيصالاتهم في دفاتر الآخرين. «الدقيق» صوّر الأصل، وحرق النسخة، ونفّذ التبديل وهو «يوثّق التغليف».' },
      ],
      epilogue: {
        en: 'The real amphora was found the same evening, padded in bubble wrap inside Rashid’s studio wardrobe, waiting for a foreign buyer who had promised “a photographer’s salary times twenty.” The buyer’s emails sealed the case. The amphora reached the museum a week late, with a new label the curator insisted on: “Recovered thanks to a fox’s nose.” Ustaz Jaber paid his small permit fine cheerfully, Captain Omar added a second lock, and the club made Noor an honorary member — with a diving mask she refuses, absolutely, to wear.',
        ar: 'عُثر على الجرّة الحقيقية مساء اليوم نفسه، ملفوفة بالنايلون الفقاعي داخل خزانة استوديو رشيد، بانتظار مشترٍ أجنبي وعده بـ«راتب مصوّر مضروباً في عشرين». رسائل المشتري الإلكترونية ختمت القضية. وصلت الجرّة إلى المتحف متأخرة أسبوعاً، مع لافتة جديدة أصرّت عليها الأمينة: «استُعيدت بفضل أنف ثعلبة.» دفع الأستاذ جابر غرامته الصغيرة بصدرٍ رحب، وأضاف الكابتن عمر قفلاً ثانياً، ومنح النادي نور عضوية فخرية — مع قناع غوصٍ ترفض، رفضاً قاطعاً، ارتداءه.',
      },
    },
  },
];
