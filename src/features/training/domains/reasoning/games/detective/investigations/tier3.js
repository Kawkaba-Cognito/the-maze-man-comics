/*
 * Detective Kawkab — full investigations, TIER 3 (hardest: statement logic,
 * layered forensics, 2 proving clues, and the Grey Fox thread that pays off
 * in the final case). Schema: see ./index.js
 */

export const INV_TIER3 = [
  // ═══════════════ THE STOLEN STAR CHART ═══════════════
  {
    id: 'observatory', tier: 3, e: '🔭',
    title: { en: 'The Stolen Star Chart', ar: 'خريطة النجوم المسروقة' },
    setting: { en: 'The Mountain Observatory', ar: 'مرصد الجبل' },
    bg: ['#dfe3f0', '#c3c9e0'],
    assistant: { e: '👧', name: { en: 'Lola', ar: 'لولا' } },
    briefing: {
      en: 'At the mountain observatory, Dr. Nawal’s newly discovered comet was recorded on a single hand-drawn star chart — unpublished, priceless, the proof of her life’s work. It vanished from the sealed dome during the one hour the great telescope was locked on the comet itself, 2:00 to 3:00. Four researchers had dome access. On the empty pedestal, someone had left a small grey paper fox. Detective Kawkab picked it up and did not smile.',
      ar: 'في مرصد الجبل، سُجّل مذنّب الدكتورة نوال المكتشَف حديثاً على خريطة نجوم واحدة مرسومة باليد — غير منشورة، لا تُقدَّر بثمن، وهي دليل عمل عمرها. اختفت من القبّة المغلقة خلال الساعة التي كان فيها التلسكوب الكبير مثبّتاً على المذنّب نفسه، من ٢:٠٠ إلى ٣:٠٠. أربعة باحثين كانوا يملكون صلاحية الدخول. وعلى القاعدة الفارغة، ترك أحدهم ثعلباً ورقياً رمادياً صغيراً. التقطه المحقق كوكب ولم يبتسم.',
    },
    hotspots: [
      { id: 'bearing', e: '🧭', name: { en: 'The bearing log', ar: 'سجلّ الاتجاه' }, pos: { x: 20, y: 30 }, clueId: 'nudge' },
      { id: 'pedestal', e: '🔭', name: { en: 'The empty pedestal', ar: 'القاعدة الفارغة' }, pos: { x: 52, y: 24 }, clueId: 'glass-print' },
      { id: 'hatch', e: '🪜', name: { en: 'The roof hatch', ar: 'كوّة السطح' }, pos: { x: 82, y: 34 }, clueId: 'hatch-bolted' },
      { id: 'fox', e: '🦊', name: { en: 'The paper fox', ar: 'الثعلب الورقي' }, pos: { x: 64, y: 62 }, clueId: 'fox1' },
      { id: 'control', e: '🖥️', name: { en: 'The control room', ar: 'غرفة التحكّم' }, pos: { x: 24, y: 66 }, empty: { en: 'Screens glow with the comet feed. Hana’s access logs show her badge never left this room.', ar: 'الشاشات تتوهّج ببثّ المذنّب. سجلات هناء تُظهر أن بطاقتها لم تغادر هذه الغرفة.' } },
    ],
    clues: [
      { id: 'nudge', e: '🧭', name: { en: 'The 2:51 nudge', ar: 'دفعة الـ٢:٥١' }, text: { en: 'The dome slit held rock-steady on the comet from 2:00 to 2:50 — then rotated 4° at 2:51, then locked back. A 4° nudge: enough to swing the pedestal into shadow for ninety seconds. Only trained hands move a dome mid-capture.', ar: 'فتحة القبّة ظلّت ثابتة تماماً على المذنّب من ٢:٠٠ إلى ٢:٥٠ — ثم دارت ٤ درجات في ٢:٥١، ثم عادت وثُبّتت. دفعة ٤ درجات تكفي لإغراق القاعدة في الظلّ تسعين ثانية. ولا يحرّك القبّة أثناء الرصد إلا يدان مدرّبتان.' } },
      { id: 'glass-print', e: '🖐️', name: { en: 'Grease & graphite print', ar: 'بصمة الشحم والغرافيت' }, text: { en: 'On the pedestal’s glass cover: a clear thumbprint in black dome-track GREASE — overlaid with GRAPHITE dust, the kind that coats fingers from handling soft pencil drawings.', ar: 'على الغطاء الزجاجي للقاعدة: بصمة إبهام واضحة في شحم مسار القبّة الأسود — تعلوها طبقة من غبار الغرافيت، من النوع الذي يكسو الأصابع عند لمس رسومٍ بقلم رصاصٍ طريّ.' } },
      { id: 'hatch-bolted', e: '🪜', name: { en: 'The bolted hatch', ar: 'الكوّة الموصدة' }, text: { en: 'The roof hatch was bolted from the INSIDE all night. Nobody worked on that roof.', ar: 'كوّة السطح كانت موصدة من الداخل طوال الليل. لا أحد عمل على ذلك السطح.' } },
      { id: 'fox1', e: '🦊', name: { en: 'A grey paper fox', ar: 'ثعلب ورقيّ رمادي' }, text: { en: 'A small fox folded from grey paper, left exactly where the chart lay. Nobody in the observatory claims it.', ar: 'ثعلب صغير مطويّ من ورق رمادي، تُرك تماماً حيث كانت الخريطة. لا أحد في المرصد يعترف به.' } },
      { id: 'hana-saw', e: '👁️', name: { en: 'Hana’s sighting', ar: 'ما رأته هناء' }, text: { en: 'Hana saw Dr. Samir INSIDE the dome, near the pedestal, just after 2:00 — fifty minutes before the dome nudge.', ar: 'رأت هناء الدكتور سمير داخل القبّة، قرب القاعدة، بُعيد الثانية — أي قبل دفعة القبّة بخمسين دقيقة.' } },
      { id: 'samir-peek', e: '🕵️', name: { en: 'Samir’s confession', ar: 'اعتراف سمير' }, text: { en: 'Samir admits he sneaked in around 2:05 to LOOK at the chart — one bitter minute — and swears it was STILL THERE when he left.', ar: 'يعترف سمير بأنه تسلّل قرابة ٢:٠٥ لينظر إلى الخريطة — دقيقة مريرة واحدة — ويقسم أنها كانت لا تزال هناك حين خرج.' } },
      { id: 'yara-trained', e: '🔧', name: { en: 'Yara can move the dome', ar: 'يارا تحرّك القبّة' }, text: { en: 'Two people can move that dome by hand: Bilal the technician — and Yara, whom Bilal quietly trained “to earn extra hours.”', ar: 'شخصان يستطيعان تحريك القبّة يدوياً: بلال الفنّي — ويارا، التي درّبها بلال بهدوء «لتكسب ساعات إضافية».' } },
      { id: 'hand-check', e: '✋', name: { en: 'The hand inspection', ar: 'فحص الأيدي' }, text: { en: 'Bilal’s hands: heavy grease, ZERO graphite. Yara’s hands: light grease AND grey graphite smudges along the side of her writing hand.', ar: 'يدا بلال: شحم كثيف وصفر غرافيت. يدا يارا: شحم خفيف وغبار غرافيت رمادي على جانب يدها الكاتبة.' } },
    ],
    suspects: [
      {
        id: 'samir', e: '👨‍🔬', name: { en: 'Dr. Samir, rival', ar: 'الدكتور سمير، المنافس' },
        role: { en: 'Chases the same comet. Publishing first would make his career.', ar: 'يطارد المذنّب نفسه. النشر أولاً سيصنع مجده العلمي.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you from 2:00 to 3:00?', ar: 'أين كنت من ٢:٠٠ إلى ٣:٠٠؟' }, a: { en: 'I never entered the dome. I watched the feed from the control room all hour. Comets interest me; pedestals do not.', ar: 'لم أدخل القبّة إطلاقاً. تابعتُ البثّ من غرفة التحكّم طوال الساعة. المذنّبات تهمّني؛ أما القواعد فلا.' } },
          { id: 'seen', needsClue: 'hana-saw', q: { en: 'Hana saw you at the pedestal just after 2:00.', ar: 'هناء رأتك عند القاعدة بُعيد الثانية.' }, a: { en: '…Yes. I sneaked in to LOOK at her chart — to see if she’d truly beaten me. I stared for one bitter minute and left. But the chart was STILL THERE when I walked out, I swear it on my telescope!', ar: '…نعم. تسلّلتُ لأنظر إلى خريطتها — لأرى إن كانت قد سبقتني حقاً. حدّقتُ دقيقة مريرة واحدة وخرجت. لكن الخريطة كانت لا تزال هناك حين خرجت، أقسم على تلسكوبي!' }, givesClue: 'samir-peek' },
          { id: 'dome', needsClue: 'nudge', q: { en: 'Someone nudged the dome 4° at 2:51.', ar: 'أحدهم دفع القبّة ٤ درجات في ٢:٥١.' }, a: { en: 'I would NEVER touch dome controls during a live comet capture. Ask any astronomer — it is sacrilege. Whoever moved that dome ruined the shot on purpose.', ar: 'ما كنتُ لألمس أدوات القبّة أثناء رصدٍ حيّ لمذنّب. اسأل أي فلكي — إنها خطيئة. من حرّك تلك القبّة أفسد الرصد عمداً.' } },
        ],
      },
      {
        id: 'hana', e: '👩‍💻', name: { en: 'Hana, the assistant', ar: 'هناء، المساعِدة' },
        role: { en: 'Logs the telescope’s every move from the control room.', ar: 'تسجّل كل حركة للتلسكوب من غرفة التحكّم.' },
        questions: [
          { id: 'alibi', q: { en: 'What did you see during the comet hour?', ar: 'ماذا رأيتِ خلال ساعة المذنّب؟' }, a: { en: 'I never left the control room — the access logs prove it. But through the dome window I saw Dr. Samir inside, near the pedestal, just after 2. I said nothing at the time. I wish I had.', ar: 'لم أغادر غرفة التحكّم — والسجلات تثبت ذلك. لكن من نافذة القبّة رأيت الدكتور سمير في الداخل، قرب القاعدة، بُعيد الثانية. لم أقل شيئاً حينها. وليتني فعلت.' }, givesClue: 'hana-saw' },
        ],
      },
      {
        id: 'bilal', e: '🔧', name: { en: 'Bilal, the technician', ar: 'بلال، الفنّي' },
        role: { en: 'Keeps the dome machinery alive. Can move it by hand.', ar: 'يبقي آلة القبّة حيّة. ويستطيع تحريكها يدوياً.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you from 2:00 to 3:00?', ar: 'أين كنت من ٢:٠٠ إلى ٣:٠٠؟' }, a: { en: 'On the roof the whole hour, greasing the dome track. Good honest maintenance under the stars.', ar: 'على السطح طوال الساعة، أشحّم مسار القبّة. صيانة شريفة تحت النجوم.' } },
          { id: 'hatch', needsClue: 'hatch-bolted', q: { en: 'The roof hatch was bolted from the inside ALL night. Nobody was on that roof.', ar: 'كوّة السطح كانت موصدة من الداخل طوال الليل. لا أحد كان على ذلك السطح.' }, a: { en: '…Fine. I wasn’t on the roof. I was asleep in the machine room. Thirty years of night shifts, detective — sometimes the machines hum you under. I lied because sleeping on duty gets you sacked.', ar: '…حسناً. لم أكن على السطح. كنت نائماً في غرفة الآلات. ثلاثون سنة من مناوبات الليل أيها المحقق — أحياناً يهدهدك طنين الآلات. كذبت لأن النوم أثناء العمل يعني الطرد.' }, reaction: { en: 'Lola notes: a lie about where you stood is not a lie about theft.', ar: 'تدوّن لولا: الكذب حول مكان وقوفك ليس كذباً حول السرقة.' } },
          { id: 'who-moves', q: { en: 'Who else can move the dome by hand?', ar: 'من غيرك يستطيع تحريك القبّة يدوياً؟' }, a: { en: 'By hand? Me… and Yara. I trained her myself, quietly, so she could earn extra hours. She’s good. Careful hands.', ar: 'يدوياً؟ أنا… ويارا. درّبتها بنفسي، بهدوء، لتكسب ساعات إضافية. إنها بارعة. يداها حريصتان.' }, givesClue: 'yara-trained' },
        ],
      },
      {
        id: 'yara', e: '🎓', name: { en: 'Yara, the student', ar: 'يارا، الطالبة' },
        role: { en: 'Here on a scholarship Dr. Nawal signed. Desperate not to lose it.', ar: 'هنا بمنحة وقّعتها الدكتورة نوال. مذعورة من فقدانها.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you from 2:00 to 3:00?', ar: 'أين كنتِ من ٢:٠٠ إلى ٣:٠٠؟' }, a: { en: 'Studying in the corridor, right beside the roof hatch — which was bolted all night, by the way. I notice things. I was HELPING you before you even arrived.', ar: 'أدرس في الممرّ، بجانب كوّة السطح تماماً — الموصدة طوال الليل بالمناسبة. أنا ألاحظ الأشياء. كنت أساعدك حتى قبل وصولك.' } },
          { id: 'hands', needsClue: 'glass-print', q: { en: 'The print on the glass is dome grease under graphite. Show me your hands.', ar: 'البصمة على الزجاج شحم قبّة تحته وفوقه غرافيت. أريني يديك.' }, a: { en: 'Graphite? I— I sketch, everyone sketches, it means nothing! And the grease is from— doors! Greasy observatory doors!', ar: 'غرافيت؟ أنا— أرسم، الجميع يرسمون، هذا لا يعني شيئاً! والشحم من— الأبواب! أبواب المرصد المشحّمة!' }, givesClue: 'hand-check', reaction: { en: 'Bilal’s hands: heavy grease, zero graphite. Hers: both. Lola writes slowly.', ar: 'يدا بلال: شحم كثيف بلا غرافيت. ويداها هي: الاثنان معاً. تكتب لولا ببطء.' } },
        ],
      },
    ],
    solution: {
      culprit: 'yara',
      evidence: ['glass-print', 'hand-check'],
      explanation: [
        { en: 'The theft needed ninety seconds of shadow — someone MADE that shadow by nudging the dome 4° at 2:51. Only trained dome-hands could: Bilal, or the student he trained.', ar: 'السرقة احتاجت تسعين ثانية من الظلّ — وأحدهم صنعها بدفع القبّة ٤ درجات في ٢:٥١. ولا يفعلها إلا مدرَّب على القبّة: بلال، أو الطالبة التي درّبها.' },
        { en: 'The thumbprint marries two crimes: dome grease (a trained dome-mover) topped with pencil graphite (handling the chart). One pair of hands carried both.', ar: 'البصمة تزوّج بين الجريمتين: شحم القبّة (من يدٍ مدرّبة على تحريكها) تعلوه غرافيت القلم (من لمس الخريطة). يدان واحدتان حملتا الأمرين.' },
        { en: 'Bilal has grease but no graphite — he slept, and lied about a roof. Samir peeked at 2:05 and left the chart in place; Hana never left her logs. Yara has both marks on her hands — and her helpful “truths” cleared the exact timeline she needed.', ar: 'بلال لديه شحم بلا غرافيت — نام وكذب بشأن سطح. وسمير اختلس النظر في ٢:٠٥ وترك الخريطة مكانها؛ وهناء لم تغادر سجلاتها. أما يارا فتحمل الأثرين معاً — و«حقائقها» المفيدة مهّدت الجدول الزمني الذي أرادته بالضبط.' },
      ],
      epilogue: {
        en: 'Yara had not meant to sell the chart — she meant to COPY it and quietly redo her own failing research to match Dr. Nawal’s brilliance, terrified of losing the scholarship. She’d hidden the original inside a rolled-up wall poster of the night sky. Dr. Nawal, who remembered being a frightened student once, kept the scholarship in place — on the condition Yara publish her honest, imperfect work. Only one thing unsettled Detective Kawkab as they drove down the mountain: the little grey paper fox. Yara swore she’d never left it. Lola tucked it into the case file. “Souvenir,” Kawkab murmured. “Or a signature.”',
        ar: 'لم تكن يارا تنوي بيع الخريطة — أرادت نسخها لتعيد بهدوء بحثها الفاشل ليضاهي عبقرية الدكتورة نوال، مذعورةً من فقدان المنحة. خبّأت الأصل داخل ملصق جداري ملفوف لسماء الليل. أما الدكتورة نوال، التي تذكّرت أنها كانت يوماً طالبة مذعورة، فأبقت المنحة — بشرط أن تنشر يارا عملها الصادق الناقص. أمرٌ واحد فقط أقلق المحقق كوكب وهما ينزلان الجبل: الثعلب الورقي الرمادي. أقسمت يارا أنها لم تتركه قط. دسّته لولا في ملفّ القضية. تمتم كوكب: «تذكار… أو توقيع.»',
      },
    },
  },

  // ═══════════════ THE IMPOSSIBLE VAULT ═══════════════
  {
    id: 'locked-vault', tier: 3, e: '🔐',
    title: { en: 'The Impossible Vault', ar: 'الخزنة المستحيلة' },
    setting: { en: 'The Hilal Mansion', ar: 'قصر آل هلال' },
    bg: ['#efe8e0', '#dfd2c2'],
    assistant: { e: '🧒', name: { en: 'Ramy', ar: 'رامي' } },
    briefing: {
      en: 'The Hilal family diamond sat in a vault with one door, no windows, and a single lock whose only key hangs on old Uncle Faris’s neck day and night. This morning the diamond was gone, the vault still locked, the key still on Faris’s neck — and where the diamond had rested lay a small grey paper fox. “Impossible,” everyone kept saying. Detective Kawkab hates that word. Ramy had already started measuring things.',
      ar: 'ماسة آل هلال كانت في خزنة بباب واحد، بلا نوافذ، وبقفلٍ مفتاحه الوحيد معلّق في رقبة العمّ فارس المسنّ ليل نهار. هذا الصباح اختفت الماسة، والخزنة ما زالت مقفلة، والمفتاح ما زال في رقبة فارس — وحيث كانت الماسة ترقد، وُجد ثعلب ورقيّ رماديّ صغير. ظلّ الجميع يردّدون: «مستحيل». والمحقق كوكب يمقت هذه الكلمة. أما رامي فكان قد بدأ يقيس الأشياء.',
    },
    hotspots: [
      { id: 'door', e: '🚪', name: { en: 'The vault door', ar: 'باب الخزنة' }, pos: { x: 18, y: 30 }, clueId: 'door-innocent' },
      { id: 'wall', e: '🧱', name: { en: 'Behind the cupboard', ar: 'خلف الخزانة' }, pos: { x: 46, y: 58 }, clueId: 'hole' },
      { id: 'plaster', e: '🐾', name: { en: 'The fresh plaster', ar: 'الجصّ الطريّ' }, pos: { x: 66, y: 34 }, clueId: 'cat-hairs' },
      { id: 'desk', e: '📄', name: { en: 'Layla’s desk', ar: 'مكتب ليلى' }, pos: { x: 86, y: 62 }, clueId: 'debt-letters' },
      { id: 'renovated', e: '🧾', name: { en: 'The renovated room', ar: 'الغرفة المرمَّمة' }, pos: { x: 30, y: 72 }, clueId: 'receipt' },
      { id: 'pedestal2', e: '🦊', name: { en: 'The diamond stand', ar: 'حامل الماسة' }, pos: { x: 62, y: 74 }, clueId: 'fox2' },
    ],
    clues: [
      { id: 'door-innocent', e: '🚪', name: { en: 'The innocent door', ar: 'الباب البريء' }, text: { en: 'The door was never unlocked: the only key stayed on Faris all night, and the doctor confirms he took a strong sleeping draught at 10 PM — he could not have stirred till dawn.', ar: 'الباب لم يُفتح قط: المفتاح الوحيد بقي على فارس طوال الليل، والطبيب يؤكد أنه تناول منوّماً قوياً في العاشرة — ولم يكن ليستيقظ حتى الفجر.' } },
      { id: 'hole', e: '🕳️', name: { en: 'The hand-sized hole', ar: 'الثقب بحجم اليد' }, text: { en: 'Behind the heavy cupboard, the shared wall sounds hollow: a hand-sized hole, freshly re-plastered from the OTHER side. Too small for any adult arm to reach the diamond stand, a metre away.', ar: 'خلف الخزانة الثقيلة، الجدار المشترك أجوف: ثقب بحجم اليد، أُعيد جصّه حديثاً من الجهة الأخرى. أصغر من أن تعبره ذراع بالغٍ إلى حامل الماسة على بُعد متر.' } },
      { id: 'cat-hairs', e: '🐾', name: { en: 'Hairs in the plaster', ar: 'شعيرات في الجصّ' }, text: { en: 'Short pale hairs in the fresh plaster match the house cat exactly. And the cat, everyone agrees, obeys one person alone: Zaki.', ar: 'شعيرات قصيرة فاتحة في الجصّ الطريّ تطابق قطة البيت تماماً. والقطة، بإجماع الجميع، لا تطيع إلا شخصاً واحداً: زكي.' } },
      { id: 'debt-letters', e: '📄', name: { en: 'The debt letters', ar: 'رسائل الديون' }, text: { en: 'Hidden in Layla’s desk: debt letters demanding payment THIS month — a motive shaped exactly like a diamond.', ar: 'مخبّأة في مكتب ليلى: رسائل ديون تطالب بالسداد هذا الشهر — دافعٌ على هيئة ماسة تماماً.' } },
      { id: 'receipt', e: '🧾', name: { en: 'The plaster receipt', ar: 'إيصال الجصّ' }, text: { en: 'A receipt for fresh plaster, dated this week — signed in Layla’s own hand. Nabil’s old patch was reopened and resealed by someone who bought their own plaster.', ar: 'إيصال شراء جصّ طريّ بتاريخ هذا الأسبوع — موقَّع بخطّ ليلى نفسها. رقعة نبيل القديمة فُتحت وأُغلقت من جديد على يد من اشترى جصّه بنفسه.' } },
      { id: 'fox2', e: '🦊', name: { en: 'A second paper fox', ar: 'ثعلب ورقيّ ثانٍ' }, text: { en: 'Pushed into the hole: a grey paper fox folded no bigger than a coin. The same grey, the same fold as the observatory’s fox.', ar: 'مدسوسٌ في الثقب: ثعلب ورقيّ رمادي مطويّ بحجم عملة. الرمادُ ذاته والطيّة ذاتها كثعلب المرصد.' } },
      { id: 'game', e: '🧸', name: { en: 'The “treasure game”', ar: '«لعبة الكنز»' }, text: { en: 'Zaki says a family member gave him a “treasure game”: coax the cat through the little wall-door at night, bring back the “sparkly toy,” tell no one. He thought it was play.', ar: 'يقول زكي إن أحد أفراد العائلة أعطاه «لعبة كنز»: يُغري القطة بالعبور من باب الجدار الصغير ليلاً، ويعيد «اللعبة اللامعة»، ولا يخبر أحداً. ظنّها لعباً.' } },
    ],
    suspects: [
      {
        id: 'faris', e: '👴', name: { en: 'Uncle Faris, keeper', ar: 'العمّ فارس، الحارس' },
        role: { en: 'Wears the only key. Sleeps beside the vault door.', ar: 'يحمل المفتاح الوحيد. وينام بجانب باب الخزنة.' },
        questions: [
          { id: 'door', q: { en: 'Could the door have opened in the night?', ar: 'هل يمكن أن يكون الباب قد فُتح ليلاً؟' }, a: { en: 'The door did not open. I would stake my life. The door DID NOT OPEN. The key sleeps where I sleep.', ar: 'الباب لم يُفتح. أراهن بحياتي. الباب لم يُفتح! المفتاح ينام حيث أنام.' } },
          { id: 'draught', q: { en: 'You slept deeply?', ar: 'نمت نوماً عميقاً؟' }, a: { en: 'The doctor’s draught at ten, as every night. A cannon would not wake me — and I am only half-deaf, whatever Layla tells you.', ar: 'شراب الطبيب في العاشرة، ككل ليلة. مدفعٌ لا يوقظني — وأنا نصف أصمّ فقط، مهما قالت لكم ليلى.' } },
        ],
      },
      {
        id: 'layla', e: '💅', name: { en: 'Layla, the heiress', ar: 'ليلى، الوريثة' },
        role: { en: 'Elegant, composed — and, it turns out, in debt.', ar: 'أنيقة رابطة الجأش — وتبيّن أنها غارقة في الديون.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you last night?', ar: 'أين كنتِ الليلة الماضية؟' }, a: { en: 'In my room, reading. This family invests in strong walls, detective — perhaps trust the walls and look OUTSIDE the house.', ar: 'في غرفتي، أقرأ. هذه العائلة تستثمر في جدران متينة أيها المحقق — فلتثق بالجدران وابحث خارج البيت.' } },
          { id: 'receipt', needsClue: 'receipt', q: { en: 'Your signature — on this week’s plaster receipt.', ar: 'توقيعك — على إيصال الجصّ هذا الأسبوع.' }, a: { en: 'A receipt proves I bought plaster, not that I robbed my own family. Perhaps I enjoy… crafts. This is thin, detective. Thin!', ar: 'الإيصال يثبت أنني اشتريت جصّاً، لا أنني سرقت عائلتي. ربما أهوى… الأشغال اليدوية. هذا واهٍ أيها المحقق. واهٍ!' } },
          { id: 'game', needsClue: 'game', q: { en: 'Zaki told me about the “treasure game”. A family member set it up. Who plays games with the boy, Layla?', ar: 'أخبرني زكي عن «لعبة الكنز». أحد أفراد العائلة رتّبها. من يلعب مع الصبيّ يا ليلى؟' }, a: { en: '…He is a child. Children invent stories. Children invent… entire games. With rules. And rewards. That they could not invent.', ar: '…إنه طفل. الأطفال يختلقون القصص. الأطفال يخترعون… ألعاباً كاملة. بقواعد. ومكافآت. لا يمكنهم اختراعها.' }, reaction: { en: 'On her shelf, Ramy finds a hollowed book. Diamond-shaped emptiness inside.', ar: 'على رفّها، يجد رامي كتاباً مجوّفاً. وفي داخله فراغ على شكل ماسة.' } },
        ],
      },
      {
        id: 'nabil', e: '🛠️', name: { en: 'Nabil, the builder', ar: 'نبيل، البنّاء' },
        role: { en: 'Renovated the room next to the vault last month.', ar: 'رمّم الغرفة المجاورة للخزنة الشهر الماضي.' },
        questions: [
          { id: 'hole', needsClue: 'hole', q: { en: 'There is a re-plastered hole in the wall you renovated.', ar: 'في الجدار الذي رمّمته ثقب أُعيد جصّه.' }, a: { en: 'I patched a hole there last month, yes — and I sealed it for GOOD, flush and painted over. If it’s open again, someone reopened my work AFTER me. Go match the new plaster to whoever’s been buying it.', ar: 'رقّعتُ ثقباً هناك الشهر الماضي، نعم — وأغلقته نهائياً، مستوياً ومطليّاً فوقه. إن كان مفتوحاً من جديد فأحدهم أعاد فتح عملي بعدي. اذهب وطابق الجصّ الجديد بمن يشتريه.' } },
          { id: 'alibi', q: { en: 'Where were you last night?', ar: 'أين كنت الليلة الماضية؟' }, a: { en: 'Home, plastering my OWN ceiling for once. My wife will confirm, loudly.', ar: 'في البيت، أجصّص سقفي أنا لمرة واحدة. زوجتي ستؤكد، وبصوت عالٍ.' } },
        ],
      },
      {
        id: 'zaki', e: '🐈', name: { en: 'Zaki, the houseboy', ar: 'زكي، صبيّ البيت' },
        role: { en: 'Small, quick, everywhere and nowhere. The cat obeys only him.', ar: 'صغير، سريع، في كل مكان ولا مكان. القطة لا تطيع سواه.' },
        questions: [
          { id: 'alibi', q: { en: 'Where were you last night, Zaki?', ar: 'أين كنت الليلة الماضية يا زكي؟' }, a: { en: 'Asleep! Honest! Me and the cat both! …Mostly!', ar: 'نائماً! صدقاً! أنا والقطة معاً! …غالباً!' } },
          { id: 'cat', needsClue: 'cat-hairs', q: { en: 'The cat’s hairs are in the plaster, Zaki. Who sends the cat through walls?', ar: 'شعيرات القطة في الجصّ يا زكي. من يُرسل القطة عبر الجدران؟' }, a: { en: '*He bursts into frightened tears.* It was a GAME! A treasure game! Coax her through the little wall-door at night, bring back the sparkly toy, tell no one — that was the whole game! Someone in the family taught me the rules! I thought it was PLAY!', ar: '*ينفجر باكياً مذعوراً.* كانت لعبة! لعبة كنز! أُغري القطة بالعبور من باب الجدار الصغير ليلاً، وأعيد اللعبة اللامعة، ولا أخبر أحداً — هذه كل اللعبة! أحد أفراد العائلة علّمني القواعد! ظننتها لعباً!' }, givesClue: 'game', reaction: { en: 'Detective Kawkab, gently: “You did nothing wrong, Zaki. Games have owners.”', ar: 'يقول المحقق كوكب بلطف: «لم تفعل شيئاً خاطئاً يا زكي. للألعاب أصحاب.»' } },
        ],
      },
    ],
    solution: {
      culprit: 'layla',
      evidence: ['receipt', 'game'],
      explanation: [
        { en: 'The door never opened — the diamond left through Nabil’s old wall-hole, reopened and resealed with freshly bought plaster. The receipt for that plaster is signed by Layla.', ar: 'الباب لم يُفتح — الماسة خرجت من ثقب نبيل القديم في الجدار، الذي فُتح وأُغلق بجصٍّ مشترى حديثاً. وإيصال ذلك الجصّ موقَّع باسم ليلى.' },
        { en: 'No arm crosses a metre through a hand-sized hole — but a trained cat can, and the cat obeys only Zaki, who was handed an innocent “treasure game” by a family member.', ar: 'لا ذراع تعبر متراً عبر ثقب بحجم اليد — لكن قطة مدرّبة تستطيع، والقطة لا تطيع إلا زكي، الذي تلقّى «لعبة كنز» بريئة من أحد أفراد العائلة.' },
        { en: 'Motive (debts due this month), means (the plaster in her hand), method (the boy and his cat). Faris was drugged and honest; Nabil’s wall was reused, not wielded; Zaki was a tool who never knew the game was real. Only Layla holds all three threads.', ar: 'الدافع (ديون هذا الشهر)، والوسيلة (الجصّ بيدها)، والأسلوب (الصبيّ وقطته). فارس مخدَّر وصادق؛ وجدار نبيل أُعيد استخدامه لا أنه استخدمه؛ وزكي أداةٌ لم تعرف أن اللعبة حقيقية. وحدها ليلى تمسك الخيوط الثلاثة.' },
      ],
      epilogue: {
        en: 'The diamond was inside a hollowed book on Layla’s own shelf — she had planned to “discover” a fake ransom note next week and sell the stone quietly during the confusion. The family, shaken, forgave the debts rather than lose a daughter to them, on the condition Layla never touch the vault again. Zaki was cleared, hugged, and given the cat officially. And in Detective Kawkab’s pocket, next to the observatory’s fox, sat a second grey paper fox — identical fold, identical grey. “Two,” said Ramy quietly. Kawkab nodded. “Someone is leaving us a trail. Next time, we follow it.”',
        ar: 'كانت الماسة داخل كتابٍ مجوّف على رفّ ليلى نفسها — خطّطت أن «تكتشف» رسالة فدية مزيّفة الأسبوع القادم وتبيع الحجر بهدوء وسط البلبلة. العائلة، وقد اهتزّت، صفحت عن الديون بدل أن تخسر ابنتها بسببها، بشرط ألا تقترب ليلى من الخزنة ثانية. بُرّئ زكي، وعُونق، ومُنح القطة رسمياً. وفي جيب المحقق كوكب، بجانب ثعلب المرصد، جلس ثعلبٌ ورقيّ رماديّ ثانٍ — الطيّة ذاتها، الرمادُ ذاته. قال رامي بهدوء: «اثنان.» أومأ كوكب: «أحدهم يترك لنا أثراً. المرة القادمة، سنتبعه.»',
      },
    },
  },

  // ═══════════════ THE GREY FOX ═══════════════
  {
    id: 'grey-fox', tier: 3, e: '🦊',
    title: { en: 'The Grey Fox', ar: 'الثعلب الرمادي' },
    setting: { en: 'The Grand Museum', ar: 'المتحف الكبير' },
    bg: ['#e6e2ea', '#d0cad8'],
    assistant: { e: '🦊', name: { en: 'Noor', ar: 'نور' } },
    briefing: {
      en: 'The invitation came on grey paper, folded into a fox: “To the detective who keeps my little foxes — the Grand Museum, tonight, the Sunstone. Catch me if you can.” Detective Kawkab went, of course. At midnight, under a hundred guards, the priceless Sunstone vanished from its case in full light — and a grey paper fox sat in its place. Three trusted insiders had access. But this time the thief WANTED to be chased. Noor’s fur stood on end; she had been waiting for this one.',
      ar: 'جاءت الدعوة على ورقٍ رماديّ، مطويّةً على شكل ثعلب: «إلى المحقق الذي يحتفظ بثعالبي الصغيرة — المتحف الكبير، الليلة، حجر الشمس. أمسِكْ بي إن استطعت.» ذهب المحقق كوكب، بالطبع. في منتصف الليل، وتحت أعين مئة حارس، اختفى حجر الشمس الذي لا يُقدَّر بثمن من صندوقه في وضح الضوء — وجلس مكانه ثعلبٌ ورقيّ رماديّ. ثلاثة من الثقات المقرَّبين كانوا يملكون الصلاحية. لكن هذه المرة أراد اللصّ أن يُطارَد. وقف فرو نور؛ لقد كانت تنتظر هذه القضية.',
    },
    hotspots: [
      { id: 'case', e: '🔏', name: { en: 'The Sunstone case', ar: 'صندوق حجر الشمس' }, pos: { x: 26, y: 28 }, clueId: 'sealed' },
      { id: 'lights', e: '🪞', name: { en: 'The light rig', ar: 'منظومة الإضاءة' }, pos: { x: 56, y: 22 }, clueId: 'illusion' },
      { id: 'schedule', e: '🗓️', name: { en: 'The exhibit schedule', ar: 'جدول المعارض' }, pos: { x: 84, y: 40 }, clueId: 'schedule' },
      { id: 'fox3', e: '🦊', name: { en: 'The three foxes', ar: 'الثعالب الثلاثة' }, pos: { x: 40, y: 62 }, clueId: 'signature' },
      { id: 'meeting', e: '📐', name: { en: 'The meeting room', ar: 'قاعة الاجتماعات' }, pos: { x: 68, y: 68 }, clueId: 'rami-fold' },
    ],
    clues: [
      { id: 'sealed', e: '🔏', name: { en: 'The sealed case', ar: 'الصندوق المختوم' }, text: { en: 'Seal intact, alarm silent, and no object carried out of the gallery — all three confirmed. Nothing was removed from that case tonight.', ar: 'الختم سليم، والإنذار صامت، ولا جسمٌ حُمل خارج القاعة — الثلاثة مؤكّدة. لم يُنتزع شيء من الصندوق الليلة.' } },
      { id: 'illusion', e: '🪞', name: { en: 'The floating stone', ar: 'الحجر الطافي' }, text: { en: 'The Sunstone is displayed via an angled mirror and hidden spotlight — an illusion that makes it “float.” Switch off that light and the stone “vanishes” in plain sight, no case ever opened. The real stone left EARLIER. Only the light engineer knew the geometry.', ar: 'حجر الشمس يُعرض بمرآة مائلة وكشّاف مخفيّ — وهمٌ يجعله «يطفو». أطفئ ذلك الضوء «فيختفي» الحجر في وضح النظر دون فتح أي صندوق. الحجر الحقيقي غادر قبل الليلة. ووحدها مهندسة الإضاءة كانت تعرف الهندسة.' } },
      { id: 'schedule', e: '🗓️', name: { en: 'The exhibit schedule', ar: 'جدول المعارض' }, text: { en: 'Tonight’s exhibit — the illusion-displayed Sunstone, centre stage, on this exact date — was chosen and scheduled by curator Rami, three months ago.', ar: 'معرض الليلة — حجر الشمس المعروض بالوهم، في قلب المسرح، في هذا التاريخ بالذات — اختاره وجدوَله أمين المتحف رامي قبل ثلاثة أشهر.' } },
      { id: 'signature', e: '📐', name: { en: 'The signature fold', ar: 'الطيّة التوقيع' }, text: { en: 'Unfolded side by side, all three foxes — observatory, vault, tonight — share an identical crease-pattern, down to a rare, wrong-way “reverse valley” fold at the ear. A habit nobody makes by accident. A signature.', ar: 'بعد فردها جنباً إلى جنب، تتطابق الثعالب الثلاثة — المرصد والخزنة والليلة — في نمط الثنيات حتى ثنية «الوادي المعكوس» النادرة الخاطئة عند الأذن. عادة لا يصنعها أحد بالصدفة. توقيع.' } },
      { id: 'rami-fold', e: '🧩', name: { en: 'Rami’s idle fold', ar: 'طيّة رامي العابثة' }, text: { en: 'Staff watched Rami absent-mindedly fold a paper fox in a dull meeting last month, and pocket it. Retrieved and unfolded: the exact same reverse-valley crease at the ear.', ar: 'شاهد الموظفون رامي يطوي بشرودٍ ثعلباً ورقياً في اجتماعٍ مملّ الشهر الماضي ويدسّه في جيبه. وبعد استعادتها وفردها: ثنية «الوادي المعكوس» ذاتها عند الأذن.' } },
      { id: 'blackmail', e: '📝', name: { en: 'Suha’s blackmail notes', ar: 'رسائل ابتزاز سهى' }, text: { en: 'Suha was blackmailed a month ago for the lighting schematics — notes on the SAME grey fox-paper. The Fox needed her knowledge because they didn’t have it… and Suha, the victim, is cleared.', ar: 'ابتُزّت سهى قبل شهر للحصول على مخطّطات الإضاءة — برسائل على ورق الثعلب الرمادي نفسه. احتاج الثعلبُ معرفتَها لأنه لا يملكها… وسهى، الضحية، بريئة.' } },
    ],
    suspects: [
      {
        id: 'adham', e: '🛡️', name: { en: 'Chief Warden Adham', ar: 'كبير الحرّاس أدهم' },
        role: { en: 'Runs museum security. Designed the Sunstone case himself.', ar: 'يدير أمن المتحف. صمّم صندوق حجر الشمس بنفسه.' },
        questions: [
          { id: 'seal', q: { en: 'Could your seal have been opened?', ar: 'هل يمكن أن يكون ختمك قد فُتح؟' }, a: { en: 'My seal is unbroken. Whatever happened, it did NOT happen to my case. I stake my career on that seal.', ar: 'ختمي سليم. مهما حدث، لم يحدث لصندوقي. أراهن بمسيرتي على ذلك الختم.' } },
          { id: 'illusion', needsClue: 'illusion', q: { en: 'The stone on display was a light trick. Did you know?', ar: 'الحجر المعروض كان خدعة ضوئية. هل كنت تعلم؟' }, a: { en: 'I build cases and seals. I wouldn’t know a mirror-projection from a magic trick — that’s exactly why I never trusted this “floating stone” nonsense. Solid things in solid boxes, I always said.', ar: 'أنا أصنع الصناديق والأختام. لا أفرّق بين إسقاط المرآة والحيلة السحرية — ولهذا بالضبط لم أثق يوماً بهراء «الحجر الطافي». أشياء صلبة في صناديق صلبة، هذا ما قلته دائماً.' } },
        ],
      },
      {
        id: 'suha', e: '💡', name: { en: 'Engineer Suha', ar: 'المهندسة سهى' },
        role: { en: 'Designed the gallery’s lights and mirrors. Quit… last week.', ar: 'صمّمت أضواء القاعة ومراياها. واستقالت… الأسبوع الماضي.' },
        questions: [
          { id: 'left', q: { en: 'Why did you really leave the museum?', ar: 'لماذا تركتِ المتحف حقاً؟' }, a: { en: 'Because someone blackmailed me for the lighting schematics a month ago. *Her hands shake as she shows the notes — grey paper.* I refused to help further, so I ran. I never dreamed they’d USE it.', ar: 'لأن أحدهم ابتزّني قبل شهر للحصول على مخطّطات الإضاءة. *ترتجف يداها وهي تُظهر الرسائل — ورق رمادي.* رفضتُ المساعدة أكثر، فهربت. لم يخطر لي قطّ أنهم سيستخدمونها.' }, givesClue: 'blackmail', reaction: { en: 'The blackmail notes match the fox-paper exactly. The Fox stole her knowledge — which means the Fox lacked it.', ar: 'رسائل الابتزاز تطابق ورق الثعلب تماماً. الثعلب سرق معرفتها — أي أنه كان يفتقر إليها.' } },
        ],
      },
      {
        id: 'rami', e: '🎭', name: { en: 'Curator Rami', ar: 'أمين المتحف رامي' },
        role: { en: 'Chose tonight’s exhibit. Calls the Grey Fox “an artist, not a criminal.”', ar: 'اختار معرض الليلة. ويصف الثعلب الرمادي بأنه «فنّان، لا مجرم».' },
        questions: [
          { id: 'admire', q: { en: 'You admire the Grey Fox, don’t you?', ar: 'أنت معجب بالثعلب الرمادي، أليس كذلك؟' }, a: { en: 'I admire the artistry, yes — admiring a thief is not being one. Half the city admires them. The other half is lying about it.', ar: 'أُعجب بالفنّ، نعم — والإعجاب باللصّ ليس كونه لصّاً. نصف المدينة معجب به. والنصف الآخر يكذب بهذا الشأن.' } },
          { id: 'schedule', needsClue: 'schedule', q: { en: 'You scheduled the illusion-Sunstone, centre stage, for THIS exact night. Three months ago.', ar: 'أنت من جدوَل حجر الشمس الوهميّ، في قلب المسرح، لهذه الليلة بالذات. قبل ثلاثة أشهر.' }, a: { en: 'Exhibits take months, detective. Planning is my JOB. You have a coincidence, not a case.', ar: 'المعارض تحتاج شهوراً أيها المحقق. التخطيط هو وظيفتي. لديك مصادفة، لا قضية.' } },
          { id: 'fold', needsClue: 'rami-fold', q: { en: 'Three foxes, one rare reverse-valley crease at the ear. And your idle meeting-paper folds the exact same way.', ar: 'ثلاثة ثعالب، وثنية «وادٍ معكوس» نادرة واحدة عند الأذن. وورقتك العابثة من الاجتماع تنطوي بالطريقة ذاتها تماماً.' }, a: { en: '…Everyone folds paper. That proves— that proves I fold paper.', ar: '…الجميع يطوون الورق. هذا يثبت— يثبت أنني أطوي الورق.' }, reaction: { en: 'Noor sits, curls her tail, and stares at him the way foxes stare at other foxes.', ar: 'تجلس نور وتلفّ ذيلها وتحدّق فيه كما تحدّق الثعالب في الثعالب.' } },
        ],
      },
    ],
    solution: {
      culprit: 'rami',
      evidence: ['signature', 'rami-fold'],
      explanation: [
        { en: 'Unbroken seal + silent alarm + nothing carried out = nothing was removed tonight. The “Sunstone” on show was the mirror illusion; the real stone left earlier, and the thief simply killed the hidden light.', ar: 'ختم سليم + إنذار صامت + لا شيء حُمل خارجاً = لم يُنتزع شيء الليلة. «حجر الشمس» المعروض كان وهم المرآة؛ الحجر الحقيقي غادر قبلاً، واللص اكتفى بإطفاء الضوء المخفي.' },
        { en: 'The Fox blackmailed Suha FOR the schematics — so the Fox is no lighting expert. That clears Suha and doesn’t fit Adham, who scorns the illusion entirely. But the plan also needed the illusion staged centre-stage on this exact night — scheduled by Rami, three months ago.', ar: 'الثعلب ابتزّ سهى للحصول على المخطّطات — إذاً هو ليس خبير إضاءة. هذا يبرّئ سهى ولا يناسب أدهم الذي يحتقر الوهم أصلاً. لكن الخطة احتاجت أيضاً وضع الوهم في قلب المسرح في هذه الليلة بالذات — وقد جدوَلها رامي قبل ثلاثة أشهر.' },
        { en: 'And the artist signed every crime: three foxes, one rare reverse-valley ear crease — identical to the fox Rami’s own idle hands folded in a dull meeting. Kawkab simply read the signature back to him.', ar: 'والفنّان وقّع كل جريمة: ثلاثة ثعالب بثنية «وادٍ معكوس» نادرة واحدة عند الأذن — مطابقة للثعلب الذي طوته يدا رامي العابثتان في اجتماعٍ مملّ. واكتفى كوكب بأن يقرأ عليه توقيعه.' },
      ],
      epilogue: {
        en: 'The real Sunstone was found where a showman would keep his masterpiece: in a locked display in Rami’s own study, lit by a small copy of the very illusion he’d stolen. He had never sold a single thing he took — the observatory chart, the Hilal diamond, all of it sat in his private “museum of the uncatchable.” The foxes were his fatal vanity. As they led him out, Rami gave Detective Kawkab a small bow. “You kept my foxes. I hoped you would.” Noor watched him go, then trotted to Kawkab and dropped, at his feet, a fourth grey paper fox — one she had quietly folded herself. Case closed. The Grey Fox is caught. And a fox got the last word.',
        ar: 'عُثر على حجر الشمس الحقيقي حيث يحفظ الاستعراضيّ تحفته: في خزانة عرضٍ مقفلة في مكتب رامي نفسه، تضيئها نسخة صغيرة من الوهم عينه الذي سرقه. لم يبع قطّ شيئاً ممّا أخذ — خريطة المرصد، وماسة آل هلال، كلها في «متحفه الخاص لما لا يُمسَك». كانت الثعالب غروره القاتل. وبينما اقتادوه، انحنى رامي للمحقق كوكب انحناءة صغيرة: «احتفظتَ بثعالبي. كنتُ آمل أن تفعل.» راقبته نور، ثم هرولت إلى كوكب وأسقطت عند قدميه ثعلباً ورقياً رمادياً رابعاً — طوَته هي بنفسها بهدوء. أُغلقت القضية. أُمسك الثعلب الرمادي. وكان لثعلبٍ آخر الكلمة الأخيرة.',
      },
    },
  },
];
