/*
 * Detective — CASE FILES, tier 3 (hardest: statement logic, layered forensics,
 * a recurring "Grey Fox" thread that pays off in the final case).
 * Same schema as tier1.js.
 */

export const TIER3 = [
  {
    id: 'observatory', tier: 3, e: '🔭',
    title: { en: 'The Stolen Star Chart', ar: 'خريطة النجوم المسروقة' },
    assistant: { e: '👧', name: { en: 'Lola', ar: 'لولا' } },
    prologue: {
      en: 'At the mountain observatory, Dr. Nawal’s newly discovered comet was recorded on a single hand-drawn star chart — unpublished, priceless, the proof of her life’s work. It vanished from the sealed dome during the one hour the great telescope was pointed at the new comet itself. Four researchers had dome access that night. On the empty pedestal, someone had left a small grey paper fox. Kawkab picked it up and did not smile.',
      ar: 'في مرصد الجبل، سُجّل مذنّب الدكتورة نوال المكتشَف حديثاً على خريطة نجوم واحدة مرسومة باليد — غير منشورة، لا تُقدَّر بثمن، وهي دليل عمل عمرها. اختفت من القبّة المغلقة خلال الساعة الوحيدة التي كان فيها التلسكوب الكبير موجّهاً نحو المذنّب الجديد نفسه. أربعة باحثين كانوا يملكون صلاحية الدخول تلك الليلة. وعلى القاعدة الفارغة، ترك أحدهم ثعلباً ورقياً رمادياً صغيراً. التقطه كوكب ولم يبتسم.',
    },
    suspects: [
      { e: '👨‍🔬', name: { en: 'Dr. Samir, rival', ar: 'الدكتور سمير، المنافس' }, desc: { en: 'Chases the same comet. Publishing first would make his career.', ar: 'يطارد المذنّب نفسه. النشر أولاً سيصنع مجده العلمي.' } },
      { e: '👩‍💻', name: { en: 'Hana, the assistant', ar: 'هناء، المساعِدة' }, desc: { en: 'Logs the telescope’s every move. Adores Dr. Nawal — or resents being unthanked?', ar: 'تسجّل كل حركة للتلسكوب. تعشق الدكتورة نوال — أم تنقم على نكران فضلها؟' } },
      { e: '🔧', name: { en: 'Bilal, the technician', ar: 'بلال، الفنّي' }, desc: { en: 'Keeps the dome machinery alive. The only one who can move the dome by hand.', ar: 'يبقي آلة القبّة حيّة. الوحيد القادر على تحريك القبّة يدوياً.' } },
      { e: '🎓', name: { en: 'Yara, the student', ar: 'يارا، الطالبة' }, desc: { en: 'Here on a scholarship Dr. Nawal signed. Desperate not to lose it.', ar: 'هنا بمنحة وقّعتها الدكتورة نوال. مذعورة من فقدانها.' } },
    ],
    acts: [
      {
        title: { en: 'Four Statements, One Liar', ar: 'أربع إفادات، كاذب واحد' },
        story: {
          en: 'The dome’s log proves the chart was taken during the comet hour — 2:00 to 3:00. Kawkab gathered the four and told them plainly: “The dome’s motion log never lies. So I already know that of your four statements, exactly one is false. Speak.”',
          ar: 'سجلّ القبّة يثبت أن الخريطة أُخذت خلال ساعة المذنّب — من ٢:٠٠ إلى ٣:٠٠. جمع كوكب الأربعة وقال بوضوح: «سجلّ حركة القبّة لا يكذب أبداً. لذا أعرف مسبقاً أن واحدة فقط من إفاداتكم الأربع كاذبة. تكلّموا.»',
        },
        facts: [
          { e: '📜', en: 'The motion log is trusted absolutely. Exactly ONE of the four statements below is false.', ar: 'سجلّ الحركة موثوق تماماً. واحدة فقط من الإفادات الأربع التالية كاذبة.' },
          { e: '🌀', en: 'For the telescope to hold the comet, the dome slit had to stay locked on one bearing the whole hour — nobody could rotate it without ruining the shot.', ar: 'لكي يحافظ التلسكوب على المذنّب، كان لا بدّ أن تبقى فتحة القبّة مثبّتة على اتجاه واحد طوال الساعة — ولا أحد يستطيع تدويرها دون إفساد الرصد.' },
        ],
        wits: [
          { e: '👨‍🔬', name: { en: 'Dr. Samir', ar: 'الدكتور سمير' }, en: '“I never entered the dome. I watched the feed from the control room all hour.”', ar: '«لم أدخل القبّة إطلاقاً. تابعتُ البثّ من غرفة التحكّم طوال الساعة.»' },
          { e: '👩‍💻', name: { en: 'Hana', ar: 'هناء' }, en: '“Dr. Samir is lying. I saw him inside the dome, near the pedestal, just after 2.”', ar: '«الدكتور سمير يكذب. رأيته داخل القبّة، قرب القاعدة، بعد الثانية بقليل.»' },
          { e: '🔧', name: { en: 'Bilal', ar: 'بلال' }, en: '“I was on the roof the whole hour, greasing the dome track. Hana never left the control room — I’d have seen her pass.”', ar: '«كنت على السطح طوال الساعة أشحّم مسار القبّة. وهناء لم تغادر غرفة التحكّم — لكنت رأيتها تمرّ.»' },
          { e: '🎓', name: { en: 'Yara', ar: 'يارا' }, en: '“Bilal was NOT on the roof — the roof hatch was bolted from inside all night; I was studying right beside it.”', ar: '«بلال لم يكن على السطح — كوّة السطح كانت موصدة من الداخل طوال الليل؛ كنتُ أدرس بجانبها تماماً.»' },
        ],
        q: { en: 'Exactly one statement is false. Whose?', ar: 'واحدة فقط كاذبة. لمن؟' },
        options: [
          { id: 'samir', e: '👨‍🔬', en: 'Dr. Samir’s', ar: 'إفادة الدكتور سمير' },
          { id: 'hana', e: '👩‍💻', en: 'Hana’s', ar: 'إفادة هناء' },
          { id: 'bilal', e: '🔧', en: 'Bilal’s', ar: 'إفادة بلال' },
          { id: 'yara', e: '🎓', en: 'Yara’s', ar: 'إفادة يارا' },
        ],
        answer: 'bilal', key: { in: 'wits', i: 1 },
        sol: [
          { en: 'Hana and Samir flatly contradict each other, so the liar is one of THEM — which means Bilal and Yara both tell the truth.', ar: 'هناء وسمير يتناقضان تماماً، فالكاذب أحدهما — ما يعني أن بلال ويارا صادقان معاً.' },
          { en: 'But if Yara is truthful, the roof hatch was bolted all night — so Bilal could NOT have been on the roof. Bilal’s statement is false. Contradiction: the liar can’t be Hana or Samir.', ar: 'لكن إن كانت يارا صادقة، فكوّة السطح موصدة طوال الليل — إذاً يستحيل أن يكون بلال على السطح. فإفادة بلال كاذبة. وهذا تناقض: لا يمكن أن يكون الكاذب هناء أو سمير.' },
          { en: 'So the single lie is Bilal’s. Which makes Hana truthful: she really did see Dr. Samir inside the dome, by the pedestal, just after 2.', ar: 'إذاً الكذبة الوحيدة هي إفادة بلال. وهذا يجعل هناء صادقة: لقد رأت الدكتور سمير فعلاً داخل القبّة، قرب القاعدة، بُعيد الثانية.' },
        ],
        reveal: { en: '“Bilal lied about the roof,” said Lola, “but a lie about where you stood isn’t a lie about theft. And Hana just placed Samir at the pedestal.” Kawkab turned the grey paper fox over in his fingers.', ar: 'قالت لولا: «كذب بلال بشأن السطح، لكن الكذب حول مكان وقوفك ليس كذباً حول السرقة. وهناء وضعت سمير للتوّ عند القاعدة.» قلّب كوكب الثعلب الورقي الرمادي بين أصابعه.' },
      },
      {
        title: { en: 'The Man at the Pedestal', ar: 'الرجل عند القاعدة' },
        story: {
          en: 'Confronted, Dr. Samir crumpled. “Yes — I sneaked in to LOOK at her chart. To see if she’d truly beaten me. I stood at the pedestal, I stared for one bitter minute, and I left. But the chart was STILL THERE when I walked out, I swear it on my telescope!” Kawkab checked the one thing Samir couldn’t have faked: the dome’s own bearing log.',
          ar: 'حين ووجه، انهار الدكتور سمير. «نعم — تسلّلتُ لأنظر إلى خريطتها. لأرى إن كانت قد سبقتني حقاً. وقفتُ عند القاعدة، حدّقتُ دقيقة مريرة واحدة، وخرجت. لكن الخريطة كانت لا تزال هناك حين خرجت، أقسم على تلسكوبي!» تحقّق كوكب من الشيء الوحيد الذي لا يستطيع سمير تزييفه: سجلّ اتجاه القبّة نفسه.',
        },
        facts: [
          { e: '🧭', en: 'The bearing log shows the dome slit held rock-steady on the comet from 2:00 to 2:50 — then rotated 4° at 2:51, then locked back. A 4° nudge: enough to swing the pedestal into shadow for ninety seconds.', ar: 'سجلّ الاتجاه يُظهر أن فتحة القبّة ظلّت ثابتة تماماً على المذنّب من ٢:٠٠ إلى ٢:٥٠ — ثم دارت ٤ درجات في ٢:٥١، ثم عادت وثُبّتت. دفعة ٤ درجات: تكفي لإغراق القاعدة في الظلّ تسعين ثانية.' },
          { e: '👁️', en: 'Hana placed Samir at the pedestal “just after 2” — i.e. near 2:00, not near 2:51.', ar: 'وضعت هناء سمير عند القاعدة «بُعيد الثانية» — أي قرب ٢:٠٠، لا قرب ٢:٥١.' },
        ],
        wits: [
          { e: '👨‍🔬', name: { en: 'Dr. Samir', ar: 'الدكتور سمير' }, en: '“I would NEVER touch the dome controls during a live comet capture. Ask any astronomer — it’s sacrilege. Whoever moved that dome ruined the shot on purpose.”', ar: '«ما كنتُ لألمس أدوات القبّة أثناء رصدٍ حيّ لمذنّب. اسأل أي فلكي — إنها خطيئة. من حرّك تلك القبّة أفسد الرصد عمداً.»' },
        ],
        q: { en: 'What does the 2:51 dome nudge tell us about the real thief?', ar: 'ماذا تخبرنا دفعة القبّة عند ٢:٥١ عن اللص الحقيقي؟' },
        options: [
          { id: 'dark', e: '🌑', en: 'They deliberately rotated the dome to drop the pedestal into shadow — and knew how to move it', ar: 'أنهم دوّروا القبّة عمداً ليُغرقوا القاعدة في الظلّ — ويعرفون كيف يحرّكونها' },
          { id: 'samir', e: '👨‍🔬', en: 'Samir did it at 2:51', ar: 'أن سمير فعلها في ٢:٥١' },
          { id: 'accident', e: '💥', en: 'The dome slipped by accident', ar: 'أن القبّة انزلقت مصادفةً' },
        ],
        answer: 'dark', key: { in: 'facts', i: 0 },
        sol: [
          { en: 'The theft needed ninety seconds of shadow on the pedestal — and someone MADE that shadow by nudging the dome exactly 4° at 2:51, then hiding the move by locking back.', ar: 'السرقة احتاجت تسعين ثانية من الظلّ على القاعدة — وأحدهم صنع ذلك الظلّ بدفع القبّة ٤ درجات تماماً في ٢:٥١، ثم أخفى الحركة بإعادة التثبيت.' },
          { en: 'Samir stood there near 2:00, fifty minutes too early, and — whatever his sins — moving a dome mid-capture takes a hand that knows the machinery intimately. His was not that hand.', ar: 'سمير وقف هناك قرب ٢:٠٠، أي قبل الأوان بخمسين دقيقة، ومهما كانت خطاياه، فتحريك القبّة أثناء الرصد يحتاج يداً تعرف الآلة عن كثب. ولم تكن يده تلك اليد.' },
        ],
        reveal: { en: '“Someone who can move the dome by hand,” Lola read from her own notes, “in the dark, without ruining their own footing.” She looked up slowly.', ar: 'قرأت لولا من ملاحظاتها: «شخص يستطيع تحريك القبّة يدوياً، في الظلام، دون أن يفقد موطئ قدمه.» ثم رفعت بصرها ببطء.' },
      },
      {
        title: { en: 'Grease and Graphite', ar: 'شحمٌ وغرافيت' },
        story: {
          en: 'Two people can move that dome by hand: Bilal, who lied about the roof, and — Kawkab now learned — Yara, whom Bilal had quietly trained “to earn extra hours.” The chart itself was gone, but the pedestal’s glass cover remained. Kawkab dusted it, and Lola compared what came up against everyone’s hands.',
          ar: 'شخصان يستطيعان تحريك تلك القبّة يدوياً: بلال، الذي كذب بشأن السطح، و— كما علم كوكب الآن — يارا، التي درّبها بلال بهدوء «لتكسب ساعات إضافية». الخريطة نفسها اختفت، لكن غطاء القاعدة الزجاجي بقي. نفضه كوكب بالمسحوق، وقارنت لولا ما ظهر بأيدي الجميع.',
        },
        facts: [
          { e: '🖐️', en: 'On the glass cover: a clear thumbprint in black dome-track GREASE — but overlaid with GRAPHITE dust, the kind that coats fingers from handling soft pencil drawings.', ar: 'على الغطاء الزجاجي: بصمة إبهام واضحة في شحم مسار القبّة الأسود — لكن تعلوها طبقة من غبار الغرافيت، من النوع الذي يكسو الأصابع عند لمس رسومٍ بقلم رصاصٍ طريّ.' },
          { e: '✋', en: 'Bilal’s hands: heavy grease, zero graphite. Yara’s hands: light grease AND grey graphite smudges along the side of her writing hand.', ar: 'يدا بلال: شحم كثيف، وصفر غرافيت. يدا يارا: شحم خفيف وغبار غرافيت رمادي على جانب يدها الكاتبة.' },
        ],
        wits: [
          { e: '🎓', name: { en: 'Yara', ar: 'يارا' }, en: '“Graphite? I— I sketch, everyone sketches, it means nothing! And I already told you the roof hatch was bolted — I was HELPING you!”', ar: '«غرافيت؟ أنا— أرسم، الجميع يرسمون، هذا لا يعني شيئاً! وقد أخبرتك أصلاً أن كوّة السطح موصدة — كنتُ أساعدك!»' },
        ],
        q: { en: 'The comet sets at dawn. Who stole the star chart?', ar: 'المذنّب يغيب عند الفجر. من سرق خريطة النجوم؟' },
        options: [
          { id: 'samir', e: '👨‍🔬', en: 'Dr. Samir', ar: 'الدكتور سمير' },
          { id: 'hana', e: '👩‍💻', en: 'Hana', ar: 'هناء' },
          { id: 'bilal', e: '🔧', en: 'Bilal', ar: 'بلال' },
          { id: 'yara', e: '🎓', en: 'Yara the student', ar: 'يارا الطالبة' },
        ],
        answer: 'yara', key: { in: 'facts', i: 0 },
        sol: [
          { en: 'The thumbprint marries the two crimes: dome grease (only a trained dome-mover leaves it) topped with pencil graphite (only handling the chart leaves it). One pair of hands carried both.', ar: 'البصمة تزوّج بين الجريمتين: شحم القبّة (لا يتركه إلا من دُرّب على تحريكها) تعلوه غرافيت القلم (لا يتركه إلا من لمس الخريطة). يدان واحدتان حملتا الأمرين.' },
          { en: 'Bilal has grease but no graphite — he never touched the chart. Yara has both. She was trained to move the dome, she nudged it at 2:51 for her ninety seconds of shadow, and her own helpful “truth” about the roof was the move that exposed Bilal and cleared the timeline she needed.', ar: 'بلال لديه شحم بلا غرافيت — لم يلمس الخريطة قط. أما يارا فلديها الاثنان. دُرّبت على تحريك القبّة، ودفعتها في ٢:٥١ لتنال تسعين ثانية من الظلّ، و«حقيقتها» المفيدة حول السطح كانت الحركة التي فضحت بلال ومهّدت لها الجدول الزمني الذي أرادته.' },
          { en: 'Samir only spied; Hana only watched. The frightened student wrote her name in grease and graphite.', ar: 'سمير تجسّس فقط؛ وهناء راقبت فقط. أما الطالبة المذعورة فكتبت اسمها بالشحم والغرافيت.' },
        ],
      },
    ],
    epilogue: {
      en: 'Yara had not meant to sell the chart — she meant to COPY it and quietly redo her own failing research to match Dr. Nawal’s brilliance, terrified of losing the scholarship. She’d hidden the original inside a rolled-up wall poster of the night sky. Dr. Nawal, who remembered being a frightened student once, kept the scholarship in place — on the condition Yara publish her honest, imperfect work, and never again fear an unfinished result. Only one thing unsettled Kawkab as they drove down the mountain: the little grey paper fox on the pedestal. Yara swore she’d never left it. Lola tucked it into the case file. “Souvenir,” Kawkab murmured. “Or a signature.”',
      ar: 'لم تكن يارا تنوي بيع الخريطة — أرادت نسخها لتعيد بهدوء بحثها الفاشل ليضاهي عبقرية الدكتورة نوال، مذعورةً من فقدان المنحة. خبّأت الأصل داخل ملصق جداري ملفوف لسماء الليل. أما الدكتورة نوال، التي تذكّرت أنها كانت يوماً طالبة مذعورة، فأبقت المنحة — بشرط أن تنشر يارا عملها الصادق الناقص، وألا تخشى بعد اليوم نتيجةً غير مكتملة. أمرٌ واحد فقط أقلق كوكب وهما ينزلان الجبل: الثعلب الورقي الرمادي على القاعدة. أقسمت يارا أنها لم تتركه قط. دسّته لولا في ملفّ القضية. تمتم كوكب: «تذكار… أو توقيع.»',
    },
  },

  {
    id: 'locked-vault', tier: 3, e: '🔐',
    title: { en: 'The Impossible Vault', ar: 'الخزنة المستحيلة' },
    assistant: { e: '🧒', name: { en: 'Ramy', ar: 'رامي' } },
    prologue: {
      en: 'The Hilal family diamond sat in a vault with one door, no windows, and a single lock whose only key hangs on old Uncle Faris’s neck day and night. This morning the diamond was gone, the vault still locked, the key still on Faris’s neck — and where the diamond had rested lay a small grey paper fox. “Impossible,” everyone kept saying. Kawkab hates that word. Ramy had already started measuring things.',
      ar: 'ماسة آل هلال كانت في خزنة بباب واحد، بلا نوافذ، وبقفلٍ مفتاحه الوحيد معلّق في رقبة العمّ فارس المسنّ ليل نهار. هذا الصباح اختفت الماسة، والخزنة ما زالت مقفلة، والمفتاح ما زال في رقبة فارس — وحيث كانت الماسة ترقد، وُجد ثعلب ورقيّ رماديّ صغير. ظلّ الجميع يردّدون: «مستحيل». وكوكب يمقت هذه الكلمة. أما رامي فكان قد بدأ يقيس الأشياء.',
    },
    suspects: [
      { e: '👴', name: { en: 'Uncle Faris, keeper', ar: 'العمّ فارس، الحارس' }, desc: { en: 'Wears the only key. Half-deaf, wholly proud, sleeps beside the vault door.', ar: 'يحمل المفتاح الوحيد. نصف أصمّ، كامل الكبرياء، ينام بجانب باب الخزنة.' } },
      { e: '💅', name: { en: 'Layla, the heiress', ar: 'ليلى، الوريثة' }, desc: { en: 'Drowning in secret debts. The diamond would clear them all in one sale.', ar: 'غارقة في ديون سرّية. بيعة واحدة للماسة تمحوها كلها.' } },
      { e: '🛠️', name: { en: 'Nabil, the builder', ar: 'نبيل، البنّاء' }, desc: { en: 'Renovated the room NEXT to the vault last month. Knows the walls better than anyone.', ar: 'رمّم الغرفة المجاورة للخزنة الشهر الماضي. يعرف الجدران أكثر من أي أحد.' } },
      { e: '🐈', name: { en: 'Zaki, the houseboy', ar: 'زكي، صبيّ البيت' }, desc: { en: 'Small, quick, everywhere and nowhere. The cat obeys only him.', ar: 'صغير، سريع، في كل مكان ولا مكان. القطة لا تطيع سواه.' } },
    ],
    acts: [
      {
        title: { en: 'The Key That Never Moved', ar: 'المفتاح الذي لم يتحرّك' },
        story: {
          en: 'Faris swears the key never left his neck, and the doctor confirms Faris took a strong sleeping draught at 10 PM and could not have stirred till dawn. So the door was never unlocked. Kawkab stopped saying “how did they get through the door” and started asking “who says the diamond went through the door at all?” Ramy tapped the shared wall with the next room and grinned.',
          ar: 'يقسم فارس أن المفتاح لم يفارق رقبته، والطبيب يؤكّد أن فارس تناول شراباً منوّماً قوياً في العاشرة مساءً ولم يكن ليستيقظ حتى الفجر. إذاً الباب لم يُفتح قط. توقّف كوكب عن سؤال «كيف عبروا الباب» وبدأ يسأل «من قال إن الماسة عبرت الباب أصلاً؟» نقر رامي الجدار المشترك مع الغرفة المجاورة وابتسم.',
        },
        facts: [
          { e: '🚪', en: 'The door was never unlocked: the only key stayed on drugged, sleeping Faris all night. This is certain.', ar: 'الباب لم يُفتح قط: المفتاح الوحيد بقي على فارس النائم المخدَّر طوال الليل. هذا مؤكّد.' },
          { e: '🧱', en: 'The wall shared with the newly renovated room sounds hollow in one low spot — behind a heavy cupboard on the vault side.', ar: 'الجدار المشترك مع الغرفة المرمَّمة حديثاً يُصدر صوتاً أجوف في بقعة منخفضة واحدة — خلف خزانة ثقيلة في جهة الخزنة.' },
        ],
        wits: [
          { e: '👴', name: { en: 'Uncle Faris', ar: 'العمّ فارس' }, en: '“The door did not open. I would stake my life. The door DID NOT OPEN.”', ar: '«الباب لم يُفتح. أراهن بحياتي. الباب لم يُفتح.»' },
        ],
        q: { en: 'If the locked door is truly innocent, where must attention turn?', ar: 'إن كان الباب المقفل بريئاً حقاً، فإلى أين يجب أن يتّجه الانتباه؟' },
        options: [
          { id: 'wall', e: '🧱', en: 'To the walls — a route that never uses the door at all', ar: 'إلى الجدران — طريقٌ لا يستخدم الباب إطلاقاً' },
          { id: 'faris', e: '👴', en: 'Faris faked his own sleep', ar: 'أن فارس زيّف نومه' },
          { id: 'key', e: '🔑', en: 'A second key must exist', ar: 'لا بدّ من وجود مفتاح ثانٍ' },
        ],
        answer: 'wall', key: { in: 'facts', i: 0 },
        sol: [
          { en: 'A drugged keeper and a single neck-worn key make the door a dead end — so the diamond never used the door. An “impossible” room is only impossible if you assume the walls are solid.', ar: 'حارسٌ مخدَّر ومفتاح وحيد في الرقبة يجعلان الباب طريقاً مسدوداً — إذاً الماسة لم تستخدم الباب. الغرفة «المستحيلة» ليست مستحيلة إلا إن افترضتَ أن الجدران صمّاء.' },
          { en: 'And one wall isn’t solid. It went hollow last month, next to a room a builder renovated.', ar: 'وجدار واحد ليس صمّاء. صار أجوف الشهر الماضي، بجوار غرفة رمّمها بنّاء.' },
        ],
        reveal: { en: '“Behind the cupboard,” Ramy whispered, already shoving it. A patch of fresh plaster, the size of a dinner plate, stared back at them.', ar: 'همس رامي وهو يدفع الخزانة أصلاً: «خلف الخزانة.» رقعة من الجصّ الطريّ، بحجم صحن الطعام، حدّقت فيهما.' },
      },
      {
        title: { en: 'The Plaster and the Paw', ar: 'الجصّ والكفّ' },
        story: {
          en: 'Behind the cupboard: a hand-sized hole, freshly re-plastered from the OTHER side — the renovated room. Too small for any adult arm to reach the diamond’s stand, a metre away. Nabil the builder went grey. “I patched a hole there last month, yes, but I sealed it for GOOD! If it’s open again, someone reopened my work!” In the fresh plaster, Ramy found short pale hairs. Kawkab found something smaller: a single grey paper fox, folded no bigger than a coin, pushed into the hole.',
          ar: 'خلف الخزانة: ثقب بحجم اليد، أُعيد جصّه حديثاً من الجهة الأخرى — الغرفة المرمَّمة. أصغر من أن تصل ذراع بالغٍ إلى حامل الماسة على بُعد متر. اربدّ وجه نبيل البنّاء. «رقّعتُ ثقباً هناك الشهر الماضي، نعم، لكنني أغلقته نهائياً! إن كان مفتوحاً من جديد، فأحدهم أعاد فتح عملي!» في الجصّ الطريّ وجد رامي شعيرات قصيرة فاتحة. ووجد كوكب شيئاً أصغر: ثعلباً ورقياً رمادياً واحداً، مطويّاً بحجم عملة، مدسوساً في الثقب.',
        },
        facts: [
          { e: '🕳️', en: 'The hole is hand-sized — no human arm can span the metre to the diamond stand. But something small, fast and trainable could.', ar: 'الثقب بحجم اليد — لا ذراع بشرية تعبر المتر إلى حامل الماسة. لكن شيئاً صغيراً سريعاً قابلاً للتدريب يستطيع.' },
          { e: '🐾', en: 'Short pale hairs in the plaster match the house cat exactly. And the cat, everyone agrees, obeys one person alone.', ar: 'شعيرات قصيرة فاتحة في الجصّ تطابق قطة البيت تماماً. والقطة، بإجماع الجميع، لا تطيع إلا شخصاً واحداً.' },
        ],
        wits: [
          { e: '🛠️', name: { en: 'Nabil', ar: 'نبيل' }, en: '“My plaster was flush and painted over. Whoever chipped it open again did it AFTER me — go match the new plaster to whoever’s been buying it.”', ar: '«جصّي كان مستوياً ومطليّاً فوقه. من نبشه من جديد فعلها بعدي — اذهب وطابق الجصّ الجديد بمن يشتريه.»' },
        ],
        q: { en: 'What carried the diamond back through a hand-sized hole?', ar: 'ما الذي حمل الماسة عبر ثقبٍ بحجم اليد؟' },
        options: [
          { id: 'cat', e: '🐈', en: 'The trained house cat — reaching where no arm could', ar: 'قطة البيت المدرَّبة — تصل حيث لا تصل ذراع' },
          { id: 'nabil', e: '🛠️', en: 'Nabil reached through himself', ar: 'نبيل مدّ يده بنفسه' },
          { id: 'tool', e: '🎣', en: 'A long grabbing tool', ar: 'أداةُ إمساكٍ طويلة' },
        ],
        answer: 'cat', key: { in: 'facts', i: 1 },
        sol: [
          { en: 'No adult arm crosses a metre through a hand-sized hole; a rigid tool couldn’t lift a loose diamond off a stand and return through the same gap in the dark. But a cat could — and the hairs in the plaster ARE the cat’s.', ar: 'لا ذراع بالغٍ تعبر متراً عبر ثقبٍ بحجم اليد؛ ولا أداة صلبة ترفع ماسة سائبة عن حاملها وتعود عبر الفتحة نفسها في الظلام. لكن قطة تستطيع — والشعيرات في الجصّ هي شعيرات القطة.' },
          { en: 'Nabil’s old patch being reopened after him is likely true — but reopening a wall is not the same as commanding the animal that went through it. The cat answers to exactly one hand.', ar: 'إعادة فتح رقعة نبيل القديمة بعده أمرٌ صحيح على الأرجح — لكن فتح جدارٍ ليس كإصدار الأوامر للحيوان الذي عبره. القطة لا تستجيب إلا ليدٍ واحدة.' },
        ],
        reveal: { en: 'Ramy looked at Kawkab. “Only one person in this house can make that cat do anything.” From the kitchen came the soft sound of a boy pretending very hard to be busy.', ar: 'نظر رامي إلى كوكب: «شخص واحد فقط في هذا البيت يجعل تلك القطة تفعل أي شيء.» ومن المطبخ جاء صوتٌ خافت لصبيّ يتظاهر باجتهادٍ بالغٍ بأنه مشغول.' },
      },
      {
        title: { en: 'Who Holds the Leash', ar: 'من يمسك المقود' },
        story: {
          en: 'Zaki the houseboy trains the cat — but Zaki has no debts, no buyer, no motive, and burst into frightened tears at the first question. Someone used his bond with the animal. Kawkab laid out three things on the table: the debt letters found in Layla’s desk, the fresh plaster receipt, and the grey paper fox. Then he asked Zaki one gentle question: “Who told you it was a game — to send the cat through the wall for a shiny prize?”',
          ar: 'زكي صبيّ البيت هو من يدرّب القطة — لكن زكي لا ديون له، ولا مشترٍ، ولا دافع، وانفجر باكياً مذعوراً عند أول سؤال. أحدهم استغلّ رابطته بالحيوان. وضع كوكب ثلاثة أشياء على الطاولة: رسائل الديون التي وُجدت في مكتب ليلى، وإيصال الجصّ الطريّ، والثعلب الورقي الرمادي. ثم سأل زكي سؤالاً رفيقاً واحداً: «من قال لك إنها لعبة — أن تُرسل القطة عبر الجدار مقابل جائزةٍ لامعة؟»',
        },
        facts: [
          { e: '📄', en: 'Layla’s hidden debt letters demand payment THIS month — a motive that fits the diamond exactly. The plaster receipt is signed in her hand.', ar: 'رسائل ديون ليلى المخبّأة تطالب بالسداد هذا الشهر — دافعٌ يطابق الماسة تماماً. وإيصال الجصّ موقَّع بخطّ يدها.' },
          { e: '🧒', en: 'Zaki says a family member gave him a “treasure game”: coax the cat through the little wall-door at night, bring back the “sparkly toy,” tell no one. He thought it was play.', ar: 'يقول زكي إن أحد أفراد العائلة أعطاه «لعبة كنز»: يُغري القطة بالعبور من باب الجدار الصغير ليلاً، ويعيد «اللعبة اللامعة»، ولا يخبر أحداً. ظنّها لعباً.' },
        ],
        wits: [
          { e: '💅', name: { en: 'Layla', ar: 'ليلى' }, en: '“Debts? Everyone has debts. A receipt proves I bought plaster, not that I robbed my own family. This is thin, detective. Thin!”', ar: '«ديون؟ الجميع لديهم ديون. الإيصال يثبت أنني اشتريت جصّاً، لا أنني سرقتُ عائلتي. هذا واهٍ أيها المحقق. واهٍ!»' },
        ],
        q: { en: 'The diamond’s trail is complete. Who is behind the impossible theft?', ar: 'اكتمل أثر الماسة. من وراء السرقة المستحيلة؟' },
        options: [
          { id: 'faris', e: '👴', en: 'Uncle Faris', ar: 'العمّ فارس' },
          { id: 'layla', e: '💅', en: 'Layla the heiress', ar: 'ليلى الوريثة' },
          { id: 'nabil', e: '🛠️', en: 'Nabil the builder', ar: 'نبيل البنّاء' },
          { id: 'zaki', e: '🐈', en: 'Zaki the houseboy', ar: 'زكي صبيّ البيت' },
        ],
        answer: 'layla', key: { in: 'facts', i: 0 },
        sol: [
          { en: 'Follow every thread to one knot: motive (debts due this month), means (the plaster receipt in her hand reopened Nabil’s old patch), and method (she turned Zaki’s bond with the cat into an innocent “game”).', ar: 'اتبع كل خيط إلى عقدة واحدة: الدافع (ديون تُستحقّ هذا الشهر)، والوسيلة (إيصال الجصّ بخطّها أعاد فتح رقعة نبيل القديمة)، والأسلوب (حوّلت رابطة زكي بالقطة إلى «لعبة» بريئة).' },
          { en: 'Faris was drugged and honest; Nabil’s wall was reused, not wielded by him; Zaki was a tool who never knew the game was real. Only Layla holds all three threads.', ar: 'فارس كان مخدَّراً وصادقاً؛ وجدار نبيل أُعيد استخدامه لا أنه استخدمه؛ وزكي كان أداةً لم تعرف قطّ أن اللعبة حقيقية. وحدها ليلى تمسك الخيوط الثلاثة.' },
          { en: 'The “impossible” vault was never breached. The thief simply borrowed a cat, a boy, and an old hole in a wall.', ar: 'الخزنة «المستحيلة» لم تُخترق قط. اللصّة اكتفت باستعارة قطة، وصبيّ، وثقبٍ قديم في جدار.' },
        ],
      },
    ],
    epilogue: {
      en: 'The diamond was inside a hollowed book on Layla’s own shelf — she had planned to “discover” a fake ransom note next week and sell the stone quietly during the confusion. The debts undid her; so did a houseboy who cried because he thought he’d ruined a game. The family, shaken, forgave the debts rather than lose a daughter to them, on the condition Layla never touch the vault again. Zaki was cleared, hugged, and given the cat officially. And in Kawkab’s pocket, next to the observatory’s fox, sat a second grey paper fox — identical fold, identical grey. “Two,” said Ramy quietly. Kawkab nodded. “Someone is leaving us a trail. Next time, we follow it.”',
      ar: 'كانت الماسة داخل كتابٍ مجوّف على رفّ ليلى نفسها — خطّطت أن «تكتشف» رسالة فدية مزيّفة الأسبوع القادم وتبيع الحجر بهدوء وسط البلبلة. الديون فضحتها؛ وكذلك صبيّ بيتٍ بكى لأنه ظنّ أنه أفسد لعبة. العائلة، وقد اهتزّت، صفحت عن الديون بدل أن تخسر ابنتها بسببها، بشرط ألا تقترب ليلى من الخزنة ثانية. بُرّئ زكي، وعُونق، ومُنح القطة رسمياً. وفي جيب كوكب، بجانب ثعلب المرصد، جلس ثعلبٌ ورقيّ رماديّ ثانٍ — الطيّة ذاتها، الرمادُ ذاته. قال رامي بهدوء: «اثنان.» أومأ كوكب: «أحدهم يترك لنا أثراً. المرة القادمة، سنتبعه.»',
    },
  },

  {
    id: 'grey-fox', tier: 3, e: '🦊',
    title: { en: 'The Grey Fox', ar: 'الثعلب الرمادي' },
    assistant: { e: '🦊', name: { en: 'Noor', ar: 'نور' } },
    prologue: {
      en: 'The invitation came on grey paper, folded into a fox: “To the detective who keeps my little foxes — the Grand Museum, tonight, the Sunstone. Catch me if you can.” Kawkab went, of course. At midnight, under a hundred guards, the priceless Sunstone vanished from its case in full light — and a grey paper fox sat in its place. Three trusted insiders had access. But this time the thief WANTED to be chased. Noor’s fur stood on end; she had been waiting for this one.',
      ar: 'جاءت الدعوة على ورقٍ رماديّ، مطويّةً على شكل ثعلب: «إلى المحقق الذي يحتفظ بثعالبي الصغيرة — المتحف الكبير، الليلة، حجر الشمس. أمسِكْ بي إن استطعت.» ذهب كوكب، بالطبع. في منتصف الليل، وتحت مئة حارس، اختفى حجر الشمس الذي لا يُقدَّر بثمن من صندوقه في وضح الضوء — وجلس مكانه ثعلبٌ ورقيّ رماديّ. ثلاثة من الثقات المقرَّبين كانوا يملكون صلاحية الدخول. لكن هذه المرة أراد اللصّ أن يُطارَد. وقف فرو نور؛ لقد كانت تنتظر هذه القضية.',
    },
    suspects: [
      { e: '🛡️', name: { en: 'Chief Warden Adham', ar: 'كبير الحرّاس أدهم' }, desc: { en: 'Runs museum security. Designed the Sunstone case himself.', ar: 'يدير أمن المتحف. صمّم صندوق حجر الشمس بنفسه.' } },
      { e: '💡', name: { en: 'Engineer Suha', ar: 'المهندسة سهى' }, desc: { en: 'Controls the gallery’s lights and mirrors. Left the museum for another job… last week.', ar: 'تتحكّم بأضواء القاعة ومراياها. غادرت المتحف إلى عملٍ آخر… الأسبوع الماضي.' } },
      { e: '🎭', name: { en: 'Curator Rami', ar: 'أمين المتحف رامي' }, desc: { en: 'Chose tonight’s exhibit. Has publicly called the Grey Fox “an artist, not a criminal.”', ar: 'اختار معرض الليلة. وصف الثعلب الرمادي علناً بأنه «فنّان، لا مجرم».' } },
    ],
    acts: [
      {
        title: { en: 'A Theft in Plain Sight', ar: 'سرقة في وضح النظر' },
        story: {
          en: 'The Sunstone case was never opened — the seal is intact, the alarm never tripped, a hundred guards saw nothing leave. Yet the stone is gone and a fox sits in its place. Kawkab studied the case glass and, for a long moment, his own reflection in it. “Noor,” he said softly, “what if nothing was taken OUT of the case… because nothing we’re looking at is really IN it?”',
          ar: 'صندوق حجر الشمس لم يُفتح قط — الختم سليم، والإنذار لم ينطلق، ومئة حارس لم يروا شيئاً يخرج. ومع ذلك اختفى الحجر وجلس ثعلبٌ مكانه. تفحّص كوكب زجاج الصندوق، ولوهلةٍ طويلة تفحّص انعكاس وجهه فيه. قال بهدوء: «نور، ماذا لو لم يُؤخذ شيء من الصندوق… لأن لا شيء ممّا نراه موجودٌ فيه أصلاً؟»',
        },
        facts: [
          { e: '🔏', en: 'The case seal is unbroken, the alarm never triggered, and no object was carried out of the gallery — all three confirmed.', ar: 'ختم الصندوق سليم، والإنذار لم ينطلق، ولا جسمٌ حُمل خارج القاعة — الأمور الثلاثة مؤكّدة.' },
          { e: '🪞', en: 'The Sunstone is displayed using an angled mirror and a hidden spotlight — a lighting trick that makes the stone “float.” Only the light engineer knows its exact geometry.', ar: 'يُعرض حجر الشمس بمرآة مائلة وكشّافٍ مخفيّ — خدعة إضاءة تجعل الحجر «يطفو». وحدها مهندسة الإضاءة تعرف هندستها الدقيقة.' },
        ],
        wits: [
          { e: '🛡️', name: { en: 'Chief Warden Adham', ar: 'كبير الحرّاس أدهم' }, en: '“My seal is unbroken. Whatever happened, it did NOT happen to my case. I stake my career on that seal.”', ar: '«ختمي سليم. مهما حدث، لم يحدث لصندوقي. أراهن بمسيرتي على ذلك الختم.»' },
        ],
        q: { en: 'If the sealed case is genuinely untouched, how did the Sunstone “vanish”?', ar: 'إن كان الصندوق المختوم سليماً حقاً، فكيف «اختفى» حجر الشمس؟' },
        options: [
          { id: 'mirror', e: '🪞', en: 'What guests saw was the mirror-projected image; the real stone was moved BEFORE tonight, and the light simply switched off', ar: 'ما رآه الضيوف كان صورة المرآة المسقطة؛ أما الحجر الحقيقي فنُقل قبل الليلة، وأُطفئ الضوء فحسب' },
          { id: 'adham', e: '🛡️', en: 'Adham secretly opened his own seal', ar: 'أن أدهم فتح ختمه سرّاً' },
          { id: 'guard', e: '🏃', en: 'A guard smuggled it out', ar: 'أن حارساً هرّبه خارجاً' },
        ],
        answer: 'mirror', key: { in: 'facts', i: 1 },
        sol: [
          { en: 'Unbroken seal + silent alarm + nothing carried out = nothing was removed tonight. The only way all three hold is if the “Sunstone” on show was never solid — it was the mirror-and-spotlight illusion.', ar: 'ختم سليم + إنذار صامت + لا شيء حُمل خارجاً = لم يُنتزع شيء الليلة. والطريقة الوحيدة لصمود الثلاثة معاً أن يكون «حجر الشمس» المعروض غير صلبٍ أصلاً — بل وهم المرآة والكشّاف.' },
          { en: 'Switch off that hidden light and the stone “disappears” in plain sight, with no case ever opened. The real stone left earlier — and the trick belongs to whoever owns the geometry of that light.', ar: 'أطفئ ذلك الضوء المخفيّ فـ«يختفي» الحجر في وضح النظر، دون فتح أي صندوق. الحجر الحقيقي غادر قبل ذلك — والخدعة تخصّ من يملك هندسة ذلك الضوء.' },
        ],
        reveal: { en: 'Noor’s ears swivelled to the light booth. “The illusion is Suha’s design,” said Kawkab. “But she left last week. So someone kept her secret — or she never truly left.”', ar: 'دارت أذنا نور نحو غرفة الإضاءة. قال كوكب: «الوهم من تصميم سهى. لكنها غادرت الأسبوع الماضي. إذاً أحدهم احتفظ بسرّها — أو أنها لم تغادر حقاً.»' },
      },
      {
        title: { en: 'The Engineer Who Left', ar: 'المهندسة التي غادرت' },
        story: {
          en: 'Suha, it turns out, is not the Grey Fox — she is a victim of them. “I quit because someone blackmailed me for the lighting schematics a month ago,” she said, hands shaking, showing the threatening notes on grey paper. “I refused to help further, so I ran. I never dreamed they’d USE it.” Her blackmail notes matched the fox-paper exactly. That cleared her — and narrowed everything. Only two insiders remain, and only one of them could receive stolen schematics AND set tonight’s stage.',
          ar: 'تبيّن أن سهى ليست الثعلب الرمادي — بل ضحيّته. قالت بيدين مرتجفتين وهي تُظهر رسائل التهديد على ورقٍ رماديّ: «استقلتُ لأن أحدهم ابتزّني للحصول على مخطّطات الإضاءة قبل شهر. رفضتُ المساعدة أكثر، فهربتُ. لم يخطر لي قطّ أنهم سيستخدمونها.» رسائل ابتزازها تطابق ورق الثعلب تماماً. هذا برّأها — وضيّق كل شيء. لم يبقَ إلا اثنان من الداخل، وواحدٌ منهما فقط يستطيع أن يتلقّى مخطّطات مسروقة وأن يُعدّ مسرح الليلة.',
        },
        facts: [
          { e: '📝', en: 'Suha’s blackmail notes are on the same grey fox-paper. Whoever blackmailed her IS the Grey Fox — and they needed her schematics because they didn’t already have them.', ar: 'رسائل ابتزاز سهى على ورق الثعلب الرمادي نفسه. من ابتزّها هو الثعلب الرمادي — واحتاج مخطّطاتها لأنه لم يكن يملكها أصلاً.' },
          { e: '🗓️', en: 'Tonight’s exhibit — putting the illusion-displayed Sunstone centre stage on this exact date — was chosen and scheduled by the curator, Rami, three months ago.', ar: 'معرض الليلة — وضع حجر الشمس المعروض بالوهم في قلب المسرح في هذا التاريخ بالذات — اختاره وجدوَله أمين المتحف رامي قبل ثلاثة أشهر.' },
        ],
        wits: [
          { e: '🛡️', name: { en: 'Adham', ar: 'أدهم' }, en: '“I build cases and seals. I wouldn’t know a mirror-projection from a magic trick — that’s exactly why I never trusted this ‘floating stone’ nonsense.”', ar: '«أنا أصنع الصناديق والأختام. لا أفرّق بين إسقاط المرآة والحيلة السحرية — ولهذا بالضبط لم أثق يوماً بهراء «الحجر الطافي» هذا.»' },
          { e: '🎭', name: { en: 'Rami', ar: 'رامي' }, en: '“I admire the Grey Fox’s artistry, yes — admiring a thief is not being one. Half the city admires them.”', ar: '«أُعجب بفنّ الثعلب الرمادي، نعم — والإعجاب باللصّ ليس كونه لصّاً. نصف المدينة معجب به.»' },
        ],
        q: { en: 'Whose knowledge and planning does the whole scheme require?', ar: 'مَن الذي تتطلّب المكيدة كلها معرفته وتخطيطه؟' },
        options: [
          { id: 'rami', e: '🎭', en: 'Rami — he scheduled the illusion exhibit and needed Suha’s stolen schematics to run it', ar: 'رامي — جدوَل معرض الوهم واحتاج مخطّطات سهى المسروقة لتشغيله' },
          { id: 'adham', e: '🛡️', en: 'Adham — he controls the seals', ar: 'أدهم — فهو يتحكّم بالأختام' },
          { id: 'suha', e: '💡', en: 'Suha faked her own blackmail', ar: 'سهى زيّفت ابتزاز نفسها' },
        ],
        answer: 'rami', key: { in: 'facts', i: 1 },
        sol: [
          { en: 'The Grey Fox blackmailed Suha FOR the schematics — so the Fox is not a lighting expert; they had to steal that knowledge. That clears Suha and doesn’t fit Adham, who scorns the illusion entirely.', ar: 'الثعلب الرمادي ابتزّ سهى للحصول على المخطّطات — إذاً الثعلب ليس خبير إضاءة؛ اضطُرّ لسرقة تلك المعرفة. هذا يبرّئ سهى ولا يناسب أدهم الذي يحتقر الوهم كلياً.' },
          { en: 'But the plan also needed the illusion-Sunstone placed centre stage on this precise night — scheduled three months ago by Rami. Motive-shaped admiration, plus the one hand that set the stage: the curator.', ar: 'لكن الخطة احتاجت أيضاً وضع حجر الشمس الوهميّ في قلب المسرح في هذه الليلة بالذات — وقد جدوَلها رامي قبل ثلاثة أشهر. إعجابٌ بحجم الدافع، مع اليد الوحيدة التي هيّأت المسرح: أمين المتحف.' },
        ],
        reveal: { en: '“He didn’t admire the Grey Fox,” murmured Noor’s look. “He IS the Grey Fox.” Kawkab set the three grey foxes on the table, side by side. “Then let’s prove it — his way. With a flourish.”', ar: 'همست نظرة نور: «هو لم يُعجب بالثعلب الرمادي. هو الثعلب الرمادي.» وضع كوكب الثعالب الرمادية الثلاثة على الطاولة جنباً إلى جنب. «إذاً لنُثبت ذلك — على طريقته. بلمسةٍ استعراضية.»' },
      },
      {
        title: { en: 'The Signature Fold', ar: 'الطيّة التوقيع' },
        story: {
          en: 'Rami stayed calm to the end. “Admiration, coincidence, a schedule — you have a story, detective, not a proof.” So Kawkab reached for the one thing an artist can never resist: their own signature. He unfolded all three paper foxes — from the observatory, the vault, and tonight — and laid them flat beside a fourth: a folded paper the museum staff had watched Rami absent-mindedly make and pocket during a dull meeting last month.',
          ar: 'بقي رامي هادئاً حتى النهاية. «إعجاب، ومصادفة، وجدول — لديك حكاية أيها المحقق، لا دليل.» فمدّ كوكب يده إلى الشيء الوحيد الذي لا يقاومه فنّان: توقيعه هو. فرَد الثعالب الورقية الثلاثة — من المرصد، والخزنة، والليلة — ووضعها مسطّحة بجانب رابعة: ورقة مطويّة شاهد موظفو المتحف رامي يصنعها بشرودٍ ويدسّها في جيبه خلال اجتماعٍ مملّ الشهر الماضي.',
        },
        facts: [
          { e: '📐', en: 'Unfolded, all three fox crease-patterns are identical down to a rare, wrong-way “reverse valley” fold at the ear — a habit almost nobody makes by accident.', ar: 'بعد فردها، أنماط ثنيات الثعالب الثلاثة متطابقة حتى في ثنية «الوادي المعكوس» النادرة والخاطئة عند الأذن — عادة لا يصنعها أحد تقريباً بالصدفة.' },
          { e: '🧩', en: 'Rami’s meeting-paper, unfolded, shows the exact same reverse-valley crease at the ear. His hands fold foxes this one specific, unusual way.', ar: 'ورقة رامي من الاجتماع، بعد فردها، تُظهر ثنية «الوادي المعكوس» نفسها عند الأذن. يداه تطويان الثعالب بهذه الطريقة المميّزة غير المألوفة.' },
        ],
        wits: [
          { e: '🎭', name: { en: 'Rami', ar: 'رامي' }, en: '“…Everyone folds paper. That proves— that proves I fold paper.”', ar: '«…الجميع يطوون الورق. هذا يثبت— يثبت أنني أطوي الورق.»' },
        ],
        q: { en: 'Unmask him. Who is the Grey Fox?', ar: 'انزع القناع. من هو الثعلب الرمادي؟' },
        options: [
          { id: 'adham', e: '🛡️', en: 'Chief Warden Adham', ar: 'كبير الحرّاس أدهم' },
          { id: 'suha', e: '💡', en: 'Engineer Suha', ar: 'المهندسة سهى' },
          { id: 'rami', e: '🎭', en: 'Curator Rami', ar: 'أمين المتحف رامي' },
        ],
        answer: 'rami', key: { in: 'facts', i: 1 },
        sol: [
          { en: 'The three foxes left at three impossible thefts share one rare, personal fold — a signature. Rami’s idle meeting-paper carries the identical reverse-valley crease.', ar: 'الثعالب الثلاثة المتروكة في ثلاث سرقات مستحيلة تشترك في ثنية نادرة وشخصية واحدة — توقيع. وورقة رامي العابثة من الاجتماع تحمل ثنية «الوادي المعكوس» ذاتها.' },
          { en: 'Suha was blackmailed by the Fox and cleared; Adham can’t work the illusion and mocks it. Only Rami had the knowledge (stolen from Suha), the stage (scheduled by him), the motive (his “admiration”), and now the signature in his own hands.', ar: 'سهى ابتزّها الثعلب وبُرّئت؛ وأدهم لا يُتقن الوهم ويسخر منه. وحده رامي جمع المعرفة (المسروقة من سهى)، والمسرح (الذي جدوَله)، والدافع («إعجابه»)، والآن التوقيع في يديه هو.' },
          { en: 'The artist signed every crime. Kawkab simply read the signature back to him.', ar: 'وقّع الفنّان كل جريمة. واكتفى كوكب بأن يقرأ عليه توقيعه.' },
        ],
      },
    ],
    epilogue: {
      en: 'The real Sunstone was found where a showman would keep his masterpiece: in a locked display in Rami’s own study, lit by a small copy of the very illusion he’d stolen. He had never sold a single thing he took — the observatory chart, the Hilal diamond, all of it sat in his private “museum of the uncatchable,” trophies of a curator who wanted, just once, to be the exhibit nobody could explain. The foxes were his fatal vanity. As they led him out, Rami looked almost relieved, and gave Kawkab a small bow. “You kept my foxes. I hoped you would.” Noor watched him go with unblinking amber eyes, then trotted to Kawkab and dropped, at his feet, a fourth grey paper fox — one she had quietly folded herself. Case closed. The Grey Fox is caught. And a fox got the last word.',
      ar: 'عُثر على حجر الشمس الحقيقي حيث يحفظ الاستعراضيّ تحفته: في خزانة عرضٍ مقفلة في مكتب رامي نفسه، تضيئها نسخة صغيرة من الوهم عينه الذي سرقه. لم يبع قطّ شيئاً ممّا أخذ — خريطة المرصد، وماسة آل هلال، كلها في «متحفه الخاص لما لا يُمسَك»، غنائم أمين متحفٍ أراد، لمرة واحدة، أن يكون هو المعروض الذي لا يستطيع أحد تفسيره. كانت الثعالب غروره القاتل. وبينما اقتادوه، بدا رامي مرتاحاً تقريباً، وانحنى لكوكب انحناءة صغيرة: «احتفظتَ بثعالبي. كنتُ آمل أن تفعل.» راقبته نور بعينين كهرمانيتين لا ترمشان، ثم هرولت إلى كوكب وأسقطت عند قدميه ثعلباً ورقياً رمادياً رابعاً — طوَته هي بنفسها بهدوء. أُغلقت القضية. أُمسك الثعلب الرمادي. وكان لثعلبٍ آخر الكلمة الأخيرة.',
    },
  },
];

export const CASE_FILES = [];
