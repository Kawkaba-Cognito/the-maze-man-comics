/*
 * Detective — CASE FILES, tier 2 (four suspects, tighter timelines, misdirection).
 * Same schema as tier1.js.
 */

export const TIER2 = [
  {
    id: 'gallery-blackout', tier: 2, e: '🖼️',
    title: { en: 'Three Minutes of Darkness', ar: 'ثلاث دقائق من الظلام' },
    assistant: { e: '👧', name: { en: 'Lola', ar: 'لولا' } },
    prologue: {
      en: 'At the city gallery’s grand gala, the lights died for exactly three minutes. When they came back, the famous little sketch “The Sleeping Fox” was gone from its frame — the frame itself still hanging, still perfect. Two hundred guests, one detective. Kawkab handed Lola his coat. “Nobody leaves.”',
      ar: 'في الحفل الكبير لمعرض المدينة، انطفأت الأنوار ثلاث دقائق بالضبط. وحين عادت، كانت اللوحة الصغيرة الشهيرة «الثعلب النائم» قد اختفت من إطارها — بينما الإطار نفسه ما زال معلّقاً، سليماً تماماً. مئتا ضيف، ومحقق واحد. ناول كوكب معطفه للولا: «لا أحد يغادر.»',
    },
    suspects: [
      { e: '👩‍💼', name: { en: 'Mona, the curator', ar: 'منى، أمينة المعرض' }, desc: { en: 'Knows every artwork like family. Was mid-speech on stage when the lights died.', ar: 'تعرف كل لوحة كأنها من عائلتها. كانت في منتصف كلمتها على المسرح حين انطفأت الأنوار.' } },
      { e: '🎨', name: { en: 'Karim, the art student', ar: 'كريم، طالب الفنون' }, desc: { en: 'An intern trained in art handling. Carries a flat portfolio case everywhere.', ar: 'متدرّب مؤهَّل في التعامل مع اللوحات. يحمل حقيبة أعمال مسطّحة أينما ذهب.' } },
      { e: '🔌', name: { en: 'Fadi, the electrician', ar: 'فادي، الكهربائي' }, desc: { en: 'On duty tonight. Nervous. Keeps wiping his hands on his overalls.', ar: 'في مناوبته الليلة. متوتّر، ولا يكفّ عن مسح يديه ببدلة العمل.' } },
      { e: '🎩', name: { en: 'Mr. Saleh, the collector', ar: 'السيد صالح، جامع التحف' }, desc: { en: 'Offered to buy “The Sleeping Fox” three times. The gallery refused three times.', ar: 'عرض شراء «الثعلب النائم» ثلاث مرات. ورفض المعرض ثلاث مرات.' } },
    ],
    acts: [
      {
        title: { en: 'The Breaker in the Basement', ar: 'القاطع في القبو' },
        story: {
          en: 'The blackout was no accident: someone flipped the main breaker by hand. Kawkab followed the service stairs down and studied the breaker box, then the door he’d just come through.',
          ar: 'العتمة لم تكن حادثاً: أحدهم أطفأ القاطع الرئيسي بيده. نزل كوكب درج الخدمة وتفحّص صندوق الكهرباء، ثم الباب الذي دخل منه للتوّ.',
        },
        facts: [
          { e: '🔻', en: 'The main breaker was flipped by hand — no fault, no short-circuit, the engineer confirms.', ar: 'القاطع الرئيسي أُطفئ يدوياً — لا عطل ولا تماسّ، بحسب تأكيد المهندس.' },
          { e: '🚻', en: 'The basement is STAFF ONLY: the stair door opens with a staff pass. Gala guests have no access.', ar: 'القبو للموظفين فقط: باب الدرج يُفتح ببطاقة موظف. ضيوف الحفل لا يملكون أي وسيلة للدخول.' },
        ],
        wits: [
          { e: '🎩', name: { en: 'Mr. Saleh', ar: 'السيد صالح' }, en: '“I was admiring the sketch from two steps away when everything went black. When the lights returned — an empty frame. Tragic. Simply tragic.”', ar: '«كنت أتأمل اللوحة على بُعد خطوتين حين أظلم كل شيء. وحين عادت الأنوار — إطار فارغ. مأساة. مأساة حقيقية.»' },
        ],
        q: { en: 'What does the breaker tell us about the blackout?', ar: 'ماذا يخبرنا القاطع عن العتمة؟' },
        options: [
          { id: 'staff', e: '🪪', en: 'It was triggered by someone with staff access — a guest couldn’t reach it', ar: 'أن من أطفأه شخص يملك صلاحية موظف — فالضيف لا يستطيع بلوغه' },
          { id: 'accident', e: '⚡', en: 'An electrical fault — bad luck for the gallery', ar: 'عطل كهربائي — سوء حظّ أصاب المعرض' },
          { id: 'saleh', e: '🎩', en: 'Mr. Saleh flipped it — he wanted the sketch most', ar: 'السيد صالح أطفأه — فهو الأكثر رغبة باللوحة' },
        ],
        answer: 'staff', key: { in: 'facts', i: 1 },
        sol: [
          { en: 'A hand flipped that breaker, and only a staff pass reaches the basement. The darkness was made in-house.', ar: 'يدٌ ما أطفأت القاطع، والقبو لا يبلغه إلا حامل بطاقة موظف. العتمة صُنعت من الداخل.' },
          { en: 'Mr. Saleh may have wanted the sketch — but wanting is not reaching. He had no path to that basement.', ar: 'قد يكون السيد صالح راغباً باللوحة — لكن الرغبة لا تفتح الأبواب. لم يكن لديه أي طريق إلى ذلك القبو.' },
        ],
        reveal: { en: 'Lola checked the staff list against the gala roster. Three staff in the building: Mona, Karim, Fadi.', ar: 'قارنت لولا قائمة الموظفين بسجلّ الحفل. ثلاثة موظفين في المبنى: منى، كريم، فادي.' },
      },
      {
        title: { en: 'The Frame That Wasn’t Broken', ar: 'الإطار الذي لم يُكسر' },
        story: {
          en: 'Fadi the electrician cracked first — but not the way Kawkab expected. “I WAS in the basement,” he stammered, “fixing a fuse I botched this afternoon. I was scared I’d be blamed! And while I hid there, someone came down the service stairs past me, holding a flat square bag. I didn’t see the face.” Meanwhile Lola examined the empty frame — closely.',
          ar: 'انهار فادي الكهربائي أولاً — لكن ليس كما توقّع كوكب. تلعثم: «كنتُ في القبو فعلاً… أُصلح صمّاماً أفسدتُه بعد الظهر. خفتُ أن أُتَّهم! وبينما كنت مختبئاً هناك، مرّ أحدهم بجانبي نازلاً درج الخدمة، يحمل حقيبة مسطّحة مربّعة. لم أرَ الوجه.» في تلك الأثناء، كانت لولا تفحص الإطار الفارغ — عن قرب.',
        },
        facts: [
          { e: '🖼️', en: 'The frame is untouched: clips opened in the correct order, backing lifted cleanly, not one smudge on the glass. This is professional art handling.', ar: 'الإطار سليم تماماً: المشابك فُتحت بالترتيب الصحيح، والغطاء الخلفي رُفع بنظافة، ولا لطخة واحدة على الزجاج. هذا تعاملُ محترفٍ مع اللوحات.' },
          { e: '🎤', en: 'During all three dark minutes, Mona’s voice never stopped: she kept the crowd calm from the stage microphone. Two hundred people heard her continuously.', ar: 'طوال دقائق العتمة الثلاث لم ينقطع صوت منى: ظلّت تهدّئ الحضور عبر ميكروفون المسرح. سمعها مئتا شخص دون انقطاع.' },
        ],
        wits: [
          { e: '🔌', name: { en: 'Fadi', ar: 'فادي' }, en: '“I know how it looks. But if I wanted to steal, why would I confess I was down there at all?”', ar: '«أعرف كيف يبدو الأمر. لكن لو أردت السرقة، فلماذا أعترف أصلاً أنني كنت هناك؟»' },
        ],
        q: { en: 'What does the untouched frame prove about the thief?', ar: 'ماذا يُثبت الإطار السليم عن اللص؟' },
        options: [
          { id: 'trained', e: '🧤', en: 'The thief is trained in professional art handling', ar: 'أن اللص مدرَّب على التعامل الاحترافي مع اللوحات' },
          { id: 'fadi', e: '🔌', en: 'Fadi did it — he was in the basement', ar: 'أن فادي الفاعل — فقد كان في القبو' },
          { id: 'rushed', e: '💨', en: 'The thief was in a lucky hurry', ar: 'أن اللص كان مستعجلاً ومحظوظاً' },
        ],
        answer: 'trained', key: { in: 'facts', i: 0 },
        sol: [
          { en: 'In three dark minutes, the sketch was removed the way a conservator would do it in daylight. That is training, not luck.', ar: 'في ثلاث دقائق من العتمة، أُخرجت اللوحة كما يُخرجها مرمّم محترف في وضح النهار. هذه مهارة مكتسبة، لا حظّ.' },
          { en: 'Fadi’s secret — the botched fuse — explains his hiding, and an electrician has no reason to know frame clips. And Mona? Her voice is a three-minute alibi with two hundred witnesses.', ar: 'سرّ فادي — الصمّام الذي أفسده — يفسّر اختباءه، والكهربائي لا شأن له بمشابك الإطارات. ومنى؟ صوتها حجّة غياب من ثلاث دقائق بمئتي شاهد.' },
        ],
        reveal: { en: '“Staff access. Art training. A flat square bag,” counted Lola on three fingers. “I know someone who fits all three.”', ar: 'عدّت لولا على ثلاثة أصابع: «صلاحية موظف. تدريب فني. حقيبة مسطّحة مربّعة.» — «أعرف من ينطبق عليه الثلاثة معاً.»' },
      },
      {
        title: { en: 'The Cloakroom Ticket', ar: 'بطاقة غرفة المعاطف' },
        story: {
          en: 'Karim’s portfolio case was found abandoned by the service stairs, zip broken. “Stolen from the cloakroom!” he protested. “Someone used MY case to frame me!” Kawkab walked to the cloakroom and asked for the ticket log. He read it twice, the second time out loud.',
          ar: 'وُجدت حقيبة كريم مرمية عند درج الخدمة، بسحّابٍ مكسور. احتجّ: «سُرقت من غرفة المعاطف! أحدهم استخدم حقيبتي ليوقع بي!» مشى كوكب إلى غرفة المعاطف وطلب سجلّ البطاقات. قرأه مرتين، وفي الثانية قرأه بصوت عالٍ.',
        },
        facts: [
          { e: '🎟️', en: 'Cloakroom log: case checked in by Karim at 7:30 — and collected at 9:02, with Karim’s OWN numbered ticket. The blackout hit at 9:05.', ar: 'سجلّ غرفة المعاطف: أودع كريم الحقيبة في ٧:٣٠ — واستُلمت في ٩:٠٢ ببطاقة كريم المرقّمة نفسها. والعتمة وقعت في ٩:٠٥.' },
          { e: '🧤', en: 'Inside the abandoned case: a pair of thin cotton art-handling gloves, gallery issue, signed out to the intern program.', ar: 'داخل الحقيبة المرمية: قفّازان قطنيان رفيعان من قفازات التعامل مع اللوحات، من عهدة المعرض، مسجّلان باسم برنامج المتدرّبين.' },
        ],
        wits: [
          { e: '🎨', name: { en: 'Karim', ar: 'كريم' }, en: '“Logs make mistakes! Tickets get copied! I was… looking at the sculptures. Alone. In the far wing.”', ar: '«السجلات تخطئ! والبطاقات تُنسخ! كنتُ… أتأمل المنحوتات. وحدي. في الجناح البعيد.»' },
        ],
        q: { en: 'The lights come up. Who stole “The Sleeping Fox”?', ar: 'عادت الأنوار. من سرق «الثعلب النائم»؟' },
        options: [
          { id: 'mona', e: '👩‍💼', en: 'Mona the curator', ar: 'منى الأمينة' },
          { id: 'karim', e: '🎨', en: 'Karim the art student', ar: 'كريم طالب الفنون' },
          { id: 'fadi', e: '🔌', en: 'Fadi the electrician', ar: 'فادي الكهربائي' },
          { id: 'saleh', e: '🎩', en: 'Mr. Saleh the collector', ar: 'السيد صالح جامع التحف' },
        ],
        answer: 'karim', key: { in: 'facts', i: 0 },
        sol: [
          { en: 'Karim says the case was stolen from the cloakroom — but it left the cloakroom at 9:02 with HIS own ticket, three minutes before the darkness he needed.', ar: 'يقول كريم إن الحقيبة سُرقت من غرفة المعاطف — لكنها خرجت منها في ٩:٠٢ ببطاقته هو، قبل ثلاث دقائق فقط من العتمة التي كان يحتاجها.' },
          { en: 'Staff pass for the basement ✓. Art-handling training for the frame ✓. The flat square bag Fadi saw ✓. Every line points one way.', ar: 'بطاقة موظف للقبو ✓. تدريب فني يفسّر الإطار السليم ✓. الحقيبة المسطّحة التي رآها فادي ✓. كل الخيوط تشير إلى جهة واحدة.' },
          { en: 'Mona never stopped speaking; Fadi hid with a guilty fuse; Mr. Saleh could want, but never reach. It was the intern all along.', ar: 'منى لم يتوقّف صوتها؛ وفادي اختبأ بذنب صمّامه؛ والسيد صالح يشتهي ولا يستطيع. كان المتدرّب هو الفاعل من البداية.' },
        ],
      },
    ],
    epilogue: {
      en: 'The sketch was exactly where a handler would hide it: sealed inside a hollow presentation board in the intern studio, flawless. Karim confessed in a whisper — he never meant to sell it. He wanted “one real masterpiece” on his own wall, just for a while, because he was sure he’d never paint one. The gallery pressed no charges on one condition: two years of supervised restoration work, where his careful hands might learn a better use. Mona rehung “The Sleeping Fox” herself. Kawkab noticed the little painted fox looked rather like Noor — and said nothing.',
      ar: 'كانت اللوحة تماماً حيث يخبّئها محترف: محكمة الإغلاق داخل لوح عرضٍ مجوّف في مرسم المتدرّبين، سليمة بلا خدش. اعترف كريم هامساً — لم يكن ينوي بيعها قط. أراد «تحفة حقيقية واحدة» على جداره هو، لبعض الوقت فقط، لأنه كان موقناً أنه لن يرسم واحدة أبداً. لم يقاضِه المعرض بشرط واحد: سنتان من أعمال الترميم تحت الإشراف، حيث قد تتعلّم يداه الحريصتان استخداماً أنبل. أعادت منى تعليق «الثعلب النائم» بنفسها. ولاحظ كوكب أن الثعلب الصغير المرسوم يشبه نور إلى حدٍّ بعيد — ولم يقل شيئاً.',
    },
  },

  {
    id: 'midnight-express', tier: 2, e: '🚂',
    title: { en: 'The Midnight Express', ar: 'قطار منتصف الليل' },
    assistant: { e: '🧒', name: { en: 'Ramy', ar: 'رامي' } },
    prologue: {
      en: 'Somewhere between Qamar Station and the coast, on the night train, Professor Idris opened his locked compartment cabinet and found his life’s treasure gone: a stamp album worth a small house. The train hums through the dark; the thief is still aboard. Detective Kawkab, travelling home with Ramy after a case, put down his tea. “Nobody gets off at the next stop.”',
      ar: 'في مكان ما بين محطة قمر والساحل، على متن قطار الليل، فتح البروفيسور إدريس خزانة مقصورته المقفلة فوجد كنز عمره قد اختفى: ألبوم طوابع يساوي بيتاً صغيراً. القطار يهدر في الظلام؛ واللص ما يزال على متنه. وضع المحقق كوكب — العائد إلى بيته مع رامي بعد قضية — كوب شايه جانباً: «لا أحد ينزل في المحطة القادمة.»',
    },
    suspects: [
      { e: '🧑‍💼', name: { en: 'Walid, the nephew', ar: 'وليد، ابن الأخ' }, desc: { en: 'Travelling with his uncle. The album is promised to him in the will — “someday.”', ar: 'يسافر مع عمّه. الألبوم موعودٌ له في الوصية — «يوماً ما».' } },
      { e: '🎫', name: { en: 'Abu Fahd, the conductor', ar: 'أبو فهد، مفتّش التذاكر' }, desc: { en: 'Thirty years on this line. Knows every squeaking door and every shortcut.', ar: 'ثلاثون سنة على هذا الخط. يعرف كل بابٍ صرّار وكل طريقٍ مختصر.' } },
      { e: '😴', name: { en: 'Ms. Huda, passenger', ar: 'السيدة هدى، راكبة' }, desc: { en: 'Boarded with one small bag. Claims she slept from departure to alarm.', ar: 'صعدت بحقيبة صغيرة واحدة. تدّعي أنها نامت من الانطلاق حتى صوت الجرس.' } },
      { e: '🫖', name: { en: 'Younes, the tea seller', ar: 'يونس، بائع الشاي' }, desc: { en: 'Rolls his trolley end to end all night. Sees everyone, is seen by everyone.', ar: 'يجرّ عربته من أول القطار إلى آخره طوال الليل. يرى الجميع ويراه الجميع.' } },
    ],
    acts: [
      {
        title: { en: 'The Locked Compartment', ar: 'المقصورة المقفلة' },
        story: {
          en: 'The compartment door: locked, only key in the professor’s pocket. The window: open two fingers — a cat couldn’t pass. But behind a curtain at the compartment’s end, Ramy found a narrow connecting service door… also locked, with a different kind of lock.',
          ar: 'باب المقصورة: مقفل، ومفتاحه الوحيد في جيب البروفيسور. النافذة: مفتوحة بمقدار إصبعين — لا تعبرها قطة. لكن خلف ستارة في نهاية المقصورة، وجد رامي باباً خدمياً ضيقاً موصِلاً… مقفلاً هو الآخر، بقفل من نوع مختلف.',
        },
        facts: [
          { e: '🔒', en: 'Main door locked all night; the only passenger key never left the professor’s pocket. Window opening: 8 cm.', ar: 'الباب الرئيسي مقفل طوال الليل؛ والمفتاح الوحيد لم يغادر جيب البروفيسور. فتحة النافذة: ٨ سنتيمترات.' },
          { e: '🗝️', en: 'The service door between compartments opens ONLY with a railway staff key — the conductor carries one on his belt.', ar: 'الباب الخدمي بين المقصورات لا يُفتح إلا بمفتاح موظفي السكة — ومفتّش التذاكر يحمل واحداً في حزامه.' },
          { e: '⏰', en: 'The professor saw the album at 23:40 and found it gone at 00:10 — a thirty-minute window.', ar: 'رأى البروفيسور الألبوم في ٢٣:٤٠ ووجده مفقوداً في ٠٠:١٠ — نافذة من ثلاثين دقيقة.' },
        ],
        wits: [
          { e: '🎓', name: { en: 'Professor Idris', ar: 'البروفيسور إدريس' }, en: '“I stepped out to stretch my legs at 23:40 and locked the door behind me. I always lock it. Always!”', ar: '«خرجتُ أمدّد ساقيّ في ٢٣:٤٠ وأقفلت الباب خلفي. أنا أقفله دائماً. دائماً!»' },
        ],
        q: { en: 'How did the thief get in?', ar: 'كيف دخل اللص؟' },
        options: [
          { id: 'window', e: '🪟', en: 'Through the window, from the roof', ar: 'من النافذة، عبر السطح' },
          { id: 'service', e: '🗝️', en: 'Through the service door — using a railway staff key', ar: 'من الباب الخدمي — بمفتاح موظفي السكة' },
          { id: 'copy', e: '🔑', en: 'With a copy of the professor’s key', ar: 'بنسخة من مفتاح البروفيسور' },
        ],
        answer: 'service', key: { in: 'facts', i: 1 },
        sol: [
          { en: 'An 8 cm window defeats any thief; the professor’s key never left him, and copies leave marks on a lock this old — there are none.', ar: 'نافذة ٨ سنتيمترات تهزم أي لص؛ ومفتاح البروفيسور لم يفارقه، والنُّسخ تترك آثاراً على قفل بهذا العمر — ولا أثر.' },
          { en: 'That leaves the service door — which answers only to a railway staff key. The question becomes: whose hands held one tonight?', ar: 'يبقى الباب الخدمي — الذي لا يستجيب إلا لمفتاح موظفي السكة. فيصبح السؤال: يدا مَن حملتا واحداً الليلة؟' },
        ],
        reveal: { en: 'All eyes turned to the conductor’s belt. Abu Fahd went pale — then, oddly, very red.', ar: 'اتجهت الأنظار كلها إلى حزام المفتّش. شحب أبو فهد — ثم، على نحوٍ غريب، احمرّ بشدة.' },
      },
      {
        title: { en: 'The Conductor’s Nap', ar: 'غفوة المفتّش' },
        story: {
          en: 'Abu Fahd confessed — to the wrong crime. “The key wasn’t on my belt, alright? I hang it in the staff cubby when I… rest my eyes. Twenty minutes, twenty-five at most, around midnight. Thirty years and I’ve never lost a passenger!” So for half an hour, the staff key hung unguarded where anyone in the carriage could reach it. Then Younes the tea seller cleared his throat.',
          ar: 'اعترف أبو فهد — بالجريمة الخطأ. «لم يكن المفتاح في حزامي، حسناً؟ أعلّقه في خزانة الطاقم حين… أُريح عينيّ. عشرون دقيقة، خمس وعشرون على الأكثر، قرابة منتصف الليل. ثلاثون سنة وما ضاع مني راكب!» إذاً، لنصف ساعة تقريباً، كان مفتاح الطاقم معلّقاً بلا حراسة في متناول أي راكب في العربة. عندها تنحنح يونس بائع الشاي.',
        },
        facts: [
          { e: '🍽️', en: 'The dining car closed and was locked at 23:30 — posted on its door, confirmed by the chef.', ar: 'عربة الطعام أُغلقت وأُقفلت في ٢٣:٣٠ — اللافتة على بابها، والطاهي يؤكد.' },
        ],
        wits: [
          { e: '🫖', name: { en: 'Younes', ar: 'يونس' }, en: '“At 23:50 I passed Mr. Walid in the corridor, walking toward the staff cubby end. He told me, ‘just off to the dining car for a bite.’ I remember because I offered him tea and he waved me off.”', ar: '«في ٢٣:٥٠ مررتُ بالسيد وليد في الممر متجهاً نحو طرف خزانة الطاقم. قال لي: «ذاهب إلى عربة الطعام لألتقط لقمة». أذكرها لأنني عرضت عليه شاياً فصرفني بيده.»' },
          { e: '🧑‍💼', name: { en: 'Walid', ar: 'وليد' }, en: '“Exactly so — I went to the dining car, found a sandwich, ate it there, came back. Simple.”', ar: '«تماماً — ذهبت إلى عربة الطعام، وجدت شطيرة، أكلتها هناك وعدت. الأمر بسيط.»' },
          { e: '😴', name: { en: 'Ms. Huda', ar: 'السيدة هدى' }, en: '“I heard trolley wheels and snoring, and I slept through both. Wake me when there’s coffee.”', ar: '«سمعتُ عجلات عربة وشخيراً، ونمتُ رغم الاثنين. أيقظوني حين تجهز القهوة.»' },
        ],
        q: { en: 'What just snapped in Walid’s story?', ar: 'ما الذي انكسر للتوّ في رواية وليد؟' },
        options: [
          { id: 'dining', e: '🍽️', en: 'His destination didn’t exist — the dining car had been locked since 23:30', ar: 'وجهته لا وجود لها — عربة الطعام مقفلة منذ ٢٣:٣٠' },
          { id: 'tea', e: '🫖', en: 'Refusing tea at midnight is suspicious', ar: 'رفض الشاي في منتصف الليل أمر مريب' },
          { id: 'nothing', e: '🤷', en: 'Nothing — corridors are for walking', ar: 'لا شيء — الممرات وُجدت للمشي' },
        ],
        answer: 'dining', key: { in: 'facts', i: 0 },
        sol: [
          { en: 'Walid claims he ate a sandwich in a car that had been locked for twenty minutes before he set off. Nobody dines through a locked door.', ar: 'يدّعي وليد أنه أكل شطيرة في عربة كانت مقفلة قبل انطلاقه بعشرين دقيقة. لا أحد يتعشّى عبر باب مقفل.' },
          { en: 'And his corridor route at 23:50 led right past the unguarded staff cubby — key on its hook, conductor snoring. The lie marks the window; the window fits the theft.', ar: 'ومساره في الممر عند ٢٣:٥٠ يمرّ تماماً بخزانة الطاقم غير المحروسة — المفتاح على علّاقته، والمفتّش يشخر. الكذبة تحدّد النافذة الزمنية؛ والنافذة تطابق السرقة.' },
        ],
        reveal: { en: '“Search my bags, then!” cried Walid. Kawkab smiled. “No. We’ll search the train — where a clever man hides what he can’t yet carry off it.”', ar: 'صاح وليد: «فتّشوا حقائبي إذاً!» ابتسم كوكب: «لا. سنفتّش القطار — حيث يخبّئ الرجل الذكي ما لا يستطيع بعدُ حمله خارجه.»' },
      },
      {
        title: { en: 'Behind the Red Panel', ar: 'خلف اللوحة الحمراء' },
        story: {
          en: 'Walid’s luggage: innocent. His pockets: innocent. But an album that size never left the carriage — it waited somewhere, to be collected calmly at the last stop. Ramy walked the corridor tapping panels until one sounded wrong: the fire-extinguisher cabinet. Inside, taped flat behind the extinguisher, wrapped in a scarf — the album. And the tape had a story to tell.',
          ar: 'حقائب وليد: بريئة. جيوبه: بريئة. لكن ألبوماً بهذا الحجم لم يغادر العربة — إنه ينتظر في مكانٍ ما، ليُستعاد بهدوء في المحطة الأخيرة. مشى رامي في الممر ينقر الألواح حتى أصدر أحدها صوتاً نشازاً: خزانة مطفأة الحريق. في الداخل، مثبّتاً بشريط لاصق خلف المطفأة وملفوفاً بوشاح — الألبوم. وكان للشريط اللاصق حكاية يرويها.',
        },
        facts: [
          { e: '🩹', en: 'The tape on the album is a distinctive blue medical tape, torn in a zigzag — matching, edge for edge, the half-used roll in Walid’s coat pocket.', ar: 'الشريط على الألبوم شريط طبي أزرق مميّز، مقطوع بشكل متعرّج — يطابق، سنّاً بسنّ، اللفافة نصف المستعملة في جيب معطف وليد.' },
          { e: '🧣', en: 'The scarf wrapping the album is the one Walid wore at boarding — in the platform photo the professor took of them both.', ar: 'الوشاح الملفوف حول الألبوم هو نفسه الذي ارتداه وليد عند الصعود — في صورة الرصيف التي التقطها البروفيسور لهما معاً.' },
        ],
        wits: [
          { e: '🧑‍💼', name: { en: 'Walid', ar: 'وليد' }, en: '“It would have been mine ANYWAY. Someday. I just… made someday sooner.”', ar: '«كان سيصير لي على أي حال. يوماً ما. أنا فقط… جعلت «يوماً ما» أقرب.»' },
        ],
        q: { en: 'Last station approaching. Who stole the album?', ar: 'المحطة الأخيرة تقترب. من سرق الألبوم؟' },
        options: [
          { id: 'walid', e: '🧑‍💼', en: 'Walid the nephew', ar: 'وليد ابن الأخ' },
          { id: 'abufahd', e: '🎫', en: 'Abu Fahd the conductor', ar: 'أبو فهد المفتّش' },
          { id: 'huda', e: '😴', en: 'Ms. Huda the sleeper', ar: 'السيدة هدى النائمة' },
          { id: 'younes', e: '🫖', en: 'Younes the tea seller', ar: 'يونس بائع الشاي' },
        ],
        answer: 'walid', key: { in: 'facts', i: 0 },
        sol: [
          { en: 'The chain holds end to end: Walid walked toward the unguarded key at 23:50, lied about a locked dining car, and the album wears his scarf and his zigzag tape.', ar: 'السلسلة مكتملة من طرف إلى طرف: مشى وليد نحو المفتاح غير المحروس في ٢٣:٥٠، وكذب بشأن عربة طعام مقفلة، والألبوم يلبس وشاحه وشريطه المتعرّج.' },
          { en: 'Abu Fahd’s crime was a nap; Ms. Huda slept honestly; Younes was seen by the whole carriage all night. The impatient heir made “someday” a theft.', ar: 'جريمة أبي فهد كانت غفوة؛ وهدى نامت بصدق؛ ويونس رآه القطار كله طوال الليل. أما الوريث العجول فحوّل «يوماً ما» إلى سرقة.' },
        ],
      },
    ],
    epilogue: {
      en: 'Professor Idris didn’t shout. That was the worst part, Walid said later — he just looked old, suddenly, holding his album on a swaying train. At the last station Walid signed a confession, and the professor, after a long silence, rewrote his will: the album goes to the railway museum, “where impatient hands can see it but never own it.” Abu Fahd bought an alarm clock and, out of stubborn pride, has not napped since. Ramy got a stamp — a small blue one with a train on it — as a detective’s fee.',
      ar: 'لم يصرخ البروفيسور إدريس. قال وليد لاحقاً إن ذلك كان أقسى ما في الأمر — بدا فجأةً عجوزاً وهو يحتضن ألبومه في قطارٍ يتمايل. في المحطة الأخيرة وقّع وليد اعترافه، وبعد صمتٍ طويل أعاد البروفيسور كتابة وصيته: الألبوم إلى متحف السكك الحديدية، «حيث تراه الأيدي العجولة ولا تملكه أبداً». اشترى أبو فهد منبّهاً، وبدافع الكبرياء العنيد لم يغفُ منذ ذلك الحين. أما رامي فنال طابعاً — أزرق صغيراً عليه قطار — أجرةَ محقق.',
    },
  },

  {
    id: 'sunken-amphora', tier: 2, e: '🏺',
    title: { en: 'The Sunken Amphora', ar: 'الجرّة الغارقة' },
    assistant: { e: '🦊', name: { en: 'Noor', ar: 'نور' } },
    prologue: {
      en: 'The dive club of Port Sadaf spent a whole summer raising a two-thousand-year-old amphora from the seabed. On handover morning, the museum expert took one look and went white: “This is a REPLICA. Recently fired. Excellent — but fake.” Somewhere between the sea and the museum van, someone swapped a civilization’s jar for a copy. Kawkab arrived with Noor, who disliked the harbor smell and said so with her whole face.',
      ar: 'أمضى نادي الغوص في ميناء صدف صيفاً كاملاً في انتشال جرّة عمرها ألفا سنة من قاع البحر. وفي صباح التسليم، ألقى خبير المتحف نظرة واحدة وشحب وجهه: «هذه نسخة مقلَّدة. حديثة الحرق. متقنة — لكنها مزيفة.» في مكانٍ ما بين البحر وشاحنة المتحف، بدّل أحدهم جرّة حضارةٍ كاملة بنسخة. وصل كوكب مع نور، التي لم تُعجبها رائحة الميناء وعبّرت عن ذلك بكامل وجهها.',
    },
    suspects: [
      { e: '🤿', name: { en: 'Captain Omar, club head', ar: 'الكابتن عمر، رئيس النادي' }, desc: { en: 'Led every dive. Keeps the storeroom key on the same chain as his whistle.', ar: 'قاد كل غطسة. يعلّق مفتاح المخزن في السلسلة نفسها مع صفّارته.' } },
      { e: '📷', name: { en: 'Rashid, club photographer', ar: 'رشيد، مصوّر النادي' }, desc: { en: 'Documented the amphora “from every angle, in every light.” His words.', ar: 'وثّق الجرّة «من كل زاوية وفي كل إضاءة». على حدّ تعبيره.' } },
      { e: '🏺', name: { en: 'Ustaz Jaber, potter', ar: 'الأستاذ جابر، الخزّاف' }, desc: { en: 'Runs the only pottery studio in town. Consulted once about clay types.', ar: 'يدير مشغل الخزف الوحيد في البلدة. استُشير مرة واحدة في أنواع الطين.' } },
      { e: '🚚', name: { en: 'Marwan, the driver', ar: 'مروان، السائق' }, desc: { en: 'Hired to drive the amphora to the museum. Never touched it — “not even once, I swear.”', ar: 'استُؤجر لنقل الجرّة إلى المتحف. لم يلمسها — «ولا مرة واحدة، أقسم».' } },
    ],
    acts: [
      {
        title: { en: 'A Copy Too Perfect', ar: 'نسخة أدقّ من اللازم' },
        story: {
          en: 'Kawkab set the replica on the table and circled it slowly. Every barnacle scar, every chip on the rim, even the strange double-handle repair from antiquity — reproduced perfectly. He asked the club one question: “Who has seen the original up close?” The answer mattered more than anyone realized.',
          ar: 'وضع كوكب النسخة على الطاولة وراح يدور حولها ببطء. كل ندبة صدفية، كل كسر في الحافة، حتى الترميم القديم الغريب في المقبض المزدوج — كلها منسوخة بإتقان تام. سأل النادي سؤالاً واحداً: «من رأى الأصل عن قرب؟» وكان للجواب وزن لم يقدّره أحد.',
        },
        facts: [
          { e: '🔍', en: 'The replica copies details invisible from a distance — including a repair mark on the INNER rim that only shows under direct light.', ar: 'النسخة تحاكي تفاصيل لا تُرى من بعيد — بما فيها أثر ترميم على الحافة الداخلية لا يظهر إلا تحت إضاءة مباشرة.' },
          { e: '📵', en: 'By club rules, NO photos of the amphora were ever published or shared — the find was kept secret until handover day.', ar: 'بحسب قواعد النادي، لم تُنشر أو تُتداول أي صور للجرّة إطلاقاً — بقي الاكتشاف سرّياً حتى يوم التسليم.' },
        ],
        wits: [
          { e: '🤿', name: { en: 'Captain Omar', ar: 'الكابتن عمر' }, en: '“Only club members ever saw it. It slept in our storeroom, and the storeroom slept behind my key.”', ar: '«لم يرها إلا أعضاء النادي. كانت تنام في مخزننا، والمخزن ينام خلف مفتاحي.»' },
        ],
        q: { en: 'What does the replica’s perfection prove about its maker?', ar: 'ماذا يُثبت إتقان النسخة عن صانعها؟' },
        options: [
          { id: 'insider', e: '👁️', en: 'The maker worked from close, detailed access to the original — an insider’s access', ar: 'أن صانعها اعتمد على معاينة قريبة ومفصّلة للأصل — معاينة لا يملكها إلا شخص من الداخل' },
          { id: 'luck', e: '🍀', en: 'A skilled potter could guess the details', ar: 'أن خزّافاً ماهراً يستطيع تخمين التفاصيل' },
          { id: 'museum', e: '🏛️', en: 'The museum expert made the copy', ar: 'أن خبير المتحف هو من صنع النسخة' },
        ],
        answer: 'insider', key: { in: 'facts', i: 0 },
        sol: [
          { en: 'You cannot guess a repair mark hidden on an inner rim. The forger saw the original closely, repeatedly, in good light — or worked from someone who did.', ar: 'لا أحد يخمّن أثر ترميم مخبّأ في حافة داخلية. المزوِّر رأى الأصل عن قرب، مراراً، وبإضاءة جيدة — أو عمل بواسطة من رآه كذلك.' },
          { en: 'And since no photo ever left the club, the trail begins and ends with people who stood in that storeroom.', ar: 'وبما أن أي صورة لم تغادر النادي قط، فالخيط يبدأ وينتهي بمن وقفوا داخل ذلك المخزن.' },
        ],
        reveal: { en: 'Noor sniffed the replica and sneezed twice. Kawkab nodded slowly: “Fresh clay. Someone fired this recently — and kilns keep diaries.”', ar: 'تشمّمت نور النسخة وعطست مرتين. أومأ كوكب ببطء: «طينٌ حديث. أحدهم حرق هذه قريباً — والأفران تكتب مذكّراتها.»' },
      },
      {
        title: { en: 'The Torn Kiln Page', ar: 'صفحة الفرن الممزّقة' },
        story: {
          en: 'There is exactly one kiln big enough in town: Ustaz Jaber’s studio, where every firing is logged by law. Jaber went stiff when Kawkab asked for the book — Tuesday’s page was torn out. “I tore it myself!” he blurted. “I fired my nephew’s school project without a permit that day, and I didn’t want a fine! That’s ALL it was!” Kawkab believed the panic — and borrowed a pencil anyway.',
          ar: 'في البلدة فرن واحد فقط بالحجم الكافي: مشغل الأستاذ جابر، حيث يُسجَّل كل حرقٍ بحكم القانون. تصلّب جابر حين طلب كوكب الدفتر — صفحة الثلاثاء ممزوقة. انفجر قائلاً: «أنا من مزّقها! حرقتُ مشروع ابن أختي المدرسي بلا تصريح ذلك اليوم، ولم أرد غرامة! هذا كل ما في الأمر!» صدّق كوكب ذُعره — واستعار قلم رصاص على أي حال.',
        },
        facts: [
          { e: '✏️', en: 'Jaber writes hard; shading the next page with a pencil raised the torn page’s imprint: “Tue — private firing, large piece, 6 hrs — R. M., paid cash.”', ar: 'جابر يكتب بضغطة قوية؛ وبتظليل الصفحة التالية بقلم الرصاص ظهر انطباع الصفحة الممزوقة: «الثلاثاء — حرق خاص، قطعة كبيرة، ٦ ساعات — ر. م.، دفع نقداً.»' },
          { e: '🕕', en: 'A six-hour firing fits one thing on Jaber’s price list: a large amphora-class vessel.', ar: 'حرقٌ من ست ساعات لا يطابق في لائحة أسعار جابر إلا شيئاً واحداً: وعاءً كبيراً من فئة الجرار.' },
        ],
        wits: [
          { e: '🏺', name: { en: 'Ustaz Jaber', ar: 'الأستاذ جابر' }, en: '“He came with his own wrapped piece, used the kiln himself, paid, left. Kept his cap low. I mind my own business — TOO well, apparently.”', ar: '«جاء بقطعته ملفوفة، استخدم الفرن بنفسه، دفع وغادر. أبقى قبّعته منخفضة. أنا لا أتدخّل بشؤون أحد — أكثر من اللازم كما يبدو.»' },
        ],
        q: { en: 'What did the pencil shading just hand us?', ar: 'ماذا وضع تظليلُ قلم الرصاص بين أيدينا؟' },
        options: [
          { id: 'initials', e: '✏️', en: 'The forger’s trail: someone with the initials R. M. fired a large piece on Tuesday', ar: 'أثر المزوِّر: شخص بالحرفين «ر. م.» حرق قطعة كبيرة يوم الثلاثاء' },
          { id: 'jaber', e: '🏺', en: 'Proof that Jaber made the replica himself', ar: 'دليلاً على أن جابر صنع النسخة بنفسه' },
          { id: 'zero', e: '🤷', en: 'Nothing usable — imprints aren’t evidence', ar: 'لا شيء يُعتدّ به — الانطباعات ليست دليلاً' },
        ],
        answer: 'initials', key: { in: 'facts', i: 0 },
        sol: [
          { en: 'Jaber’s secret was a nephew’s art project and a dodged fine — his panic fits paperwork, not forgery. The imprint is the prize: R. M., large piece, six hours, cash.', ar: 'سرّ جابر كان مشروع ابن أخته وغرامة تهرّب منها — ذعره يناسب الأوراق الرسمية لا التزوير. الغنيمة هي الانطباع: «ر. م.»، قطعة كبيرة، ست ساعات، نقداً.' },
          { en: 'Two names in this case carry those initials: Rashid the photographer… and Marwan the driver. One letter apart, a world apart.', ar: 'اسمان في هذه القضية يحملان الحرفين: رشيد المصوّر… ومروان السائق. حرف واحد يفصل بينهما، وعالم كامل.' },
        ],
        reveal: { en: '“R. M. could be either of them,” said Noor with her eyes. Kawkab agreed: “Then we ask the amphora itself who studied it.”', ar: 'قالت نور بعينيها: «ر. م. قد يكون أياً منهما.» وافق كوكب: «إذاً نسأل الجرّة نفسها: من الذي درسها؟»' },
      },
      {
        title: { en: 'From Every Angle, In Every Light', ar: 'من كل زاوية وفي كل إضاءة' },
        story: {
          en: 'Marwan the driver had never entered the storeroom — the sign-in sheet proved it; he only ever waited at the gate. Rashid, though… Kawkab asked to see the club’s official camera. Rashid handed it over a shade too quickly. The memory card held the agreed thirty photos. But Noor pawed at the camera bag’s lining — and a second, unlabelled card slid out.',
          ar: 'مروان السائق لم يدخل المخزن قط — سجلّ الدخول يثبت ذلك؛ كان ينتظر عند البوابة دائماً. أما رشيد… طلب كوكب كاميرا النادي الرسمية. سلّمها رشيد بسرعةٍ زائدة قليلاً عن اللزوم. كانت بطاقة الذاكرة تحوي الصور الثلاثين المتفق عليها. لكن نور خربشت بطانة حقيبة الكاميرا — فانزلقت منها بطاقة ثانية بلا عنوان.',
        },
        facts: [
          { e: '💾', en: 'The hidden card: 412 photos of the amphora — inner rim, base stamp, every scar, under studio lamps. A forger’s complete blueprint.', ar: 'البطاقة المخفية: ٤١٢ صورة للجرّة — الحافة الداخلية، ختم القاعدة، كل ندبة، تحت مصابيح استوديو. مخطّطُ مزوِّرٍ كامل.' },
          { e: '🧾', en: 'In the same lining: Jaber’s cash receipt for a six-hour private firing, folded into quarters. Signed with two letters: R. M.', ar: 'في البطانة نفسها: إيصال جابر النقدي لحرقٍ خاص من ست ساعات، مطويّ أرباعاً. موقَّع بحرفين: «ر. م.»' },
        ],
        wits: [
          { e: '📷', name: { en: 'Rashid', ar: 'رشيد' }, en: '“Documentation IS my job! Those photos are… thorough. Being thorough is not a crime, detective.”', ar: '«التوثيق هو عملي! تلك الصور… دقيقة فحسب. والدقة ليست جريمة أيها المحقق.»' },
        ],
        q: { en: 'The tide is going out. Who swapped the amphora?', ar: 'المدّ ينحسر. من بدّل الجرّة؟' },
        options: [
          { id: 'omar', e: '🤿', en: 'Captain Omar', ar: 'الكابتن عمر' },
          { id: 'rashid', e: '📷', en: 'Rashid the photographer', ar: 'رشيد المصوّر' },
          { id: 'jaber', e: '🏺', en: 'Ustaz Jaber the potter', ar: 'الأستاذ جابر الخزّاف' },
          { id: 'marwan', e: '🚚', en: 'Marwan the driver', ar: 'مروان السائق' },
        ],
        answer: 'rashid', key: { in: 'facts', i: 1 },
        sol: [
          { en: 'The forgery needed an insider’s eyes: 412 secret photos are exactly that. It needed a kiln: the receipt in Rashid’s bag pays for six hours of one.', ar: 'التزوير احتاج عينَي شخصٍ من الداخل: ٤١٢ صورة سرّية هي ذلك تماماً. واحتاج فرناً: الإيصال في حقيبة رشيد يدفع ثمن ست ساعات منه.' },
          { en: 'Marwan never passed the gate; Omar’s key never explains the photos; Jaber logged, panicked and tore paper — forgers don’t leave receipts in other people’s ledgers.', ar: 'مروان لم يتجاوز البوابة؛ ومفتاح عمر لا يفسّر الصور؛ وجابر سجّل وذُعر ومزّق ورقة — والمزوِّرون لا يتركون إيصالاتهم في دفاتر الآخرين.' },
          { en: '“Thorough” photographed the original, fired the copy, and made the swap while “documenting the packing.” Case sealed like a jar.', ar: '«الدقيق» صوّر الأصل، وحرق النسخة، ونفّذ التبديل بينما كان «يوثّق عملية التغليف». أُغلقت القضية إغلاق جرّة.' },
        ],
      },
    ],
    epilogue: {
      en: 'The real amphora was found the same evening, padded in bubble wrap inside Rashid’s studio wardrobe, waiting for a foreign buyer who had promised “a photographer’s salary times twenty.” The buyer’s emails sealed the case. The amphora reached the museum a week late, with a new label the curator insisted on: “Recovered thanks to a fox’s nose.” Ustaz Jaber paid his small permit fine cheerfully, Captain Omar added a second lock, and the club made Noor an honorary member — with a diving mask she refuses, absolutely, to wear.',
      ar: 'عُثر على الجرّة الحقيقية مساء اليوم نفسه، ملفوفة بالنايلون الفقاعي داخل خزانة استوديو رشيد، بانتظار مشترٍ أجنبي وعده بـ«راتب مصوّر مضروباً في عشرين». رسائل المشتري الإلكترونية ختمت القضية. وصلت الجرّة إلى المتحف متأخرة أسبوعاً، مع لافتة جديدة أصرّت عليها الأمينة: «استُعيدت بفضل أنف ثعلبة.» دفع الأستاذ جابر غرامة التصريح الصغيرة بصدرٍ رحب، وأضاف الكابتن عمر قفلاً ثانياً، ومنح النادي نور عضوية فخرية — مع قناع غوصٍ ترفض، رفضاً قاطعاً، ارتداءه.',
    },
  },
];
