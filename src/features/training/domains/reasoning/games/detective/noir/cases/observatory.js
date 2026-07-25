/*
 * CASE 1 — THE SILENT OBSERVATORY
 * Three suspects · seven clues · five lies · one chained testimony.
 * The gentlest case in the rotation: every lie breaks on physical evidence the
 * player can find in the dome, and the culprit's motive is kind rather than
 * greedy — the tone this platform keeps.
 */

export const OBSERVATORY = {
  id: 'observatory',
  e: '🔭',
  tier: 1,
  title: { en: 'The Silent Observatory', ar: 'المرصد الصامت' },
  setting: { en: 'Kawkab Observatory · The Great Dome', ar: 'مرصد كوكب · القبّة الكبرى' },
  stamp: { en: 'CASE FILE № 001', ar: 'ملف القضيّة رقم ٠٠١' },
  time: { en: 'THE GREAT DOME · 11:10 PM', ar: 'القبّة الكبرى · ١١:١٠ مساءً' },
  victim: {
    line: { en: 'THE GREAT LENS — MISSING', ar: 'العدسة الكبرى — مفقودة' },
    sub: {
      en: 'discovered 11:10 PM · fifty minutes before the comet',
      ar: 'اكتُشف الأمر ١١:١٠ مساءً · قبل خمسين دقيقة من المذنّب',
    },
  },

  intro: [
    {
      w: 'n',
      t: {
        en: 'Once every eleven years the Marid comet crosses the sky above this city. Tonight is the night, and it is raining hard enough to drown a telescope.',
        ar: 'مرّة كلّ إحدى عشرة سنة يعبر مذنّب المارد سماء هذه المدينة. الليلة هي الليلة، والمطر ينهمر بما يكفي لإغراق مقراب.',
      },
    },
    {
      w: 'n',
      t: {
        en: '11:10 PM. The dome opened for the first observation of the decade — and the great lens, two hundred kilograms of ground glass, was simply not in its mount.',
        ar: 'الحادية عشرة وعشر دقائق مساءً. فُتحت القبّة لأوّل رصد في العقد — والعدسة الكبرى، مئتا كيلوغرام من الزجاج المصقول، لم تكن في حاملها ببساطة.',
      },
    },
    {
      w: 'kawkab',
      t: {
        en: 'Nobody forced a door. Nobody broke a window. Three people signed into this building tonight, and all three are still inside.',
        ar: 'لم يكسر أحد بابًا. ولم يحطّم أحد نافذة. ثلاثة أشخاص سجّلوا دخولهم إلى هذا المبنى الليلة، وثلاثتهم ما زالوا في الداخل.',
      },
    },
    {
      w: 'kawkab',
      t: {
        en: 'Fifty minutes until the comet. Search the dome. Then we talk to all three — and one of them will say something the room disagrees with.',
        ar: 'خمسون دقيقة حتّى المذنّب. فتّش القبّة. ثمّ نتحدّث إلى الثلاثة — وسيقول أحدهم شيئًا تخالفه الغرفة.',
      },
    },
  ],

  hotspots: [
    { id: 'mount', e: '🔩', name: { en: 'The empty mount', ar: 'الحامل الفارغ' }, pos: { x: 50, y: 40 }, clue: 'dust' },
    { id: 'desk', e: '📖', name: { en: 'Sign-in ledger', ar: 'سجلّ الدخول' }, pos: { x: 16, y: 62 }, clue: 'ledger' },
    { id: 'floor', e: '〰️', name: { en: 'Dust on the floor', ar: 'الغبار على الأرض' }, pos: { x: 68, y: 74 }, clue: 'tracks' },
    { id: 'clamp', e: '🧤', name: { en: 'The mount clamp', ar: 'مشبك الحامل' }, pos: { x: 40, y: 30 }, clue: 'fibre' },
    { id: 'camera', e: '📷', name: { en: "Lola's camera", ar: 'كاميرا لولا' }, pos: { x: 82, y: 50 }, clue: 'photo' },
    { id: 'booth', e: '📋', name: { en: 'Watchman’s booth', ar: 'كشك الحارس' }, pos: { x: 10, y: 33 }, clue: 'patrol' },
    { id: 'archive', e: '📦', name: { en: 'The archive room', ar: 'غرفة الأرشيف' }, pos: { x: 88, y: 82 }, clue: 'crate' },

    {
      id: 'clock',
      e: '🕰',
      name: { en: 'The dome clock', ar: 'ساعة القبّة' },
      pos: { x: 60, y: 16 },
      quirk: [
        [{ w: 'n', t: { en: 'The dome clock has read 4:07 since before anyone here was born. Nobody winds it. Everybody trusts it.', ar: 'ساعة القبّة تشير إلى ٤:٠٧ منذ ما قبل ولادة أيّ أحد هنا. لا أحد يعبّئها. والجميع يثق بها.' } }],
        [{ w: 'kawkab', t: { en: 'Still 4:07. A clock that has given up is at least an honest clock.', ar: 'ما زالت ٤:٠٧. الساعة التي استسلمت هي على الأقلّ ساعة صادقة.' } }],
      ],
    },
    {
      id: 'charts',
      e: '🗺',
      name: { en: 'Star charts', ar: 'خرائط النجوم' },
      pos: { x: 28, y: 20 },
      quirk: [
        [{ w: 'n', t: { en: 'Eleven years of charts, pinned in careful rows. Someone in this building loves the sky properly.', ar: 'إحدى عشرة سنة من الخرائط، مثبّتة في صفوف دقيقة. أحد ما في هذا المبنى يحبّ السماء حقًّا.' } }],
        [{ w: 'kawkab', t: { en: 'The oldest chart is signed in a child’s handwriting. Same signature as tonight’s ledger.', ar: 'أقدم خريطة موقّعة بخطّ طفل. التوقيع نفسه الموجود في سجلّ الليلة.' } }],
      ],
    },
    {
      id: 'kettle',
      e: '🫖',
      name: { en: 'The kettle', ar: 'الإبريق' },
      pos: { x: 22, y: 84 },
      quirk: [
        [{ w: 'kawkab', t: { en: 'Still warm. Three cups, three different amounts of sugar. A building that knows itself.', ar: 'ما زال دافئًا. ثلاثة أكواب، وثلاث كمّيات مختلفة من السكّر. مبنى يعرف أهله.' } }],
        [{ w: 'kawkab', t: { en: 'I checked the cups again. Nobody poisons anybody here. It is that sort of case.', ar: 'تفقّدت الأكواب مجدّدًا. لا أحد يسمّم أحدًا هنا. إنّها قضيّة من هذا النوع.' } }],
      ],
    },
  ],

  clues: {
    dust: {
      e: '🔩',
      name: { en: 'The clean mount', ar: 'الحامل النظيف' },
      desc: { en: 'A perfect dust ring where the lens sat. Lifted straight up — slowly, and by someone careful.', ar: 'حلقة غبار كاملة حيث كانت العدسة. رُفعت مستقيمةً إلى أعلى — ببطء، وعلى يد شخص حذر.' },
      narr: {
        en: 'The mount is bare, and around it a perfect ring of undisturbed dust. No scrape, no chip, no slide. Whoever took two hundred kilograms of glass out of this cradle lifted it straight up and did not hurry. That is not a thief. That is someone who has done it before.',
        ar: 'الحامل عارٍ، وحوله حلقة كاملة من غبار لم يُمَسّ. لا خدش، ولا كسر، ولا انزلاق. من أخرج مئتي كيلوغرام من الزجاج من هذا المهد رفعها مستقيمةً ولم يتعجّل. هذا ليس لصًّا. هذا شخص فعلها من قبل.',
      },
    },
    ledger: {
      e: '📖',
      name: { en: 'The sign-in ledger', ar: 'سجلّ الدخول' },
      desc: { en: 'Three names tonight: Lola 8:40, Fadi 9:00, Mimi 9:25. Nobody signed out.', ar: 'ثلاثة أسماء الليلة: لولا ٨:٤٠، فادي ٩:٠٠، ميمي ٩:٢٥. ولم يسجّل أحد خروجه.' },
      narr: {
        en: 'The ledger is a serious book for a serious building. Three entries tonight, in three different hands: Lola at 8:40, Fadi at 9:00, Mimi at 9:25. No exits. Whatever happened to that lens happened in a building holding exactly three people.',
        ar: 'السجلّ كتاب جادّ لمبنى جادّ. ثلاثة تسجيلات الليلة، بثلاثة خطوط مختلفة: لولا ٨:٤٠، فادي ٩:٠٠، ميمي ٩:٢٥. ولا خروج. مهما جرى لتلك العدسة فقد جرى في مبنى يضمّ ثلاثة أشخاص بالضبط.',
      },
    },
    tracks: {
      e: '〰️',
      name: { en: 'Two wheel tracks', ar: 'أثرا عجلتين' },
      desc: { en: 'Trolley tracks in the dome dust, running to the archive corridor.', ar: 'أثر عربة في غبار القبّة، يمتدّ إلى ممرّ الأرشيف.' },
      narr: {
        en: 'Two thin parallel lines in the floor dust, pressed deep — loaded, not empty — curving out of the dome and down the archive corridor. Nobody carries two hundred kilograms. It rolled.',
        ar: 'خطّان رفيعان متوازيان في غبار الأرض، غائران بعمق — محمّلان لا فارغان — ينعطفان خارج القبّة نزولًا إلى ممرّ الأرشيف. لا أحد يحمل مئتي كيلوغرام. لقد تدحرجت.',
      },
    },
    fibre: {
      e: '🧤',
      name: { en: 'A cotton fibre', ar: 'خيط قطنيّ' },
      desc: { en: 'White archivist’s cotton, caught in the clamp. Only one person in this building wears them.', ar: 'قطن أرشيفيّ أبيض، عَلِق في المشبك. شخص واحد فقط في هذا المبنى يرتديه.' },
      narr: {
        en: 'Caught in the thread of the clamp: a single white cotton fibre. Not a coat, not a scarf — the soft cotton of archive gloves, the kind you wear so your fingerprints never touch anything valuable. Exactly one person in this building owns a pair.',
        ar: 'عَلِق في لولب المشبك: خيط قطنيّ أبيض واحد. ليس من معطف ولا من وشاح — بل قطن قفّازات الأرشيف الناعم، النوع الذي ترتديه كي لا تلمس بصماتك شيئًا ثمينًا أبدًا. شخص واحد بالضبط في هذا المبنى يملك زوجًا منها.',
      },
    },
    photo: {
      e: '📷',
      name: { en: 'The 9:40 photograph', ar: 'صورة الـ٩:٤٠' },
      desc: { en: 'Lola’s test shot, stamped 9:40 PM — the lens still in its mount.', ar: 'لقطة لولا التجريبية، مختومة ٩:٤٠ مساءً — والعدسة ما زالت في حاملها.' },
      narr: {
        en: 'A test exposure still in the camera, stamped 9:40 PM. It shows the mount from below, the great lens sitting in it exactly where it belongs — and the edge of a sleeve that should have been at home an hour earlier.',
        ar: 'لقطة تجريبية ما زالت في الكاميرا، مختومة ٩:٤٠ مساءً. تُظهر الحامل من الأسفل، والعدسة الكبرى مستقرّة فيه تمامًا حيث ينبغي — وطرف كمّ كان يُفترض أن يكون في البيت قبل ساعة.',
      },
    },
    patrol: {
      e: '📋',
      name: { en: 'The patrol log', ar: 'سجلّ الدوريّة' },
      desc: { en: 'Signed every half hour — except between 10:00 and 10:30. Blank.', ar: 'موقّع كلّ نصف ساعة — إلّا بين ١٠:٠٠ و١٠:٣٠. فارغ.' },
      narr: {
        en: 'Fadi signs his patrol log every half hour, in the same unbothered scrawl, all night. Except once. Between 10:00 and 10:30 the line is blank. Half an hour of this building that nobody was watching.',
        ar: 'يوقّع فادي سجلّ دوريّته كلّ نصف ساعة، بالخطّ المتراخي نفسه، طوال الليل. إلّا مرّة واحدة. بين ١٠:٠٠ و١٠:٣٠ السطر فارغ. نصف ساعة من هذا المبنى لم يكن أحد يراقبها.',
      },
    },
    crate: {
      e: '📦',
      name: { en: 'The padded crate', ar: 'الصندوق المبطّن' },
      desc: { en: 'A lens-shaped crate in the archive, lined with felt, humidity-sealed — and occupied.', ar: 'صندوق بشكل العدسة في الأرشيف، مبطّن باللباد، محكم ضدّ الرطوبة — ومشغول.' },
      narr: {
        en: 'The archive is dry, cold, and locked to one key. Against the far wall stands a crate built to a shape I recognise: circular, felt-lined, humidity-sealed, labelled in a careful hand — FOR THE GREAT LENS, IN CASE OF RAIN. It is not empty. And the key to this room hangs on exactly one belt.',
        ar: 'الأرشيف جافّ وبارد ومغلق بمفتاح واحد. عند الجدار البعيد يقف صندوق مصنوع بشكل أعرفه: دائريّ، مبطّن باللباد، محكم ضدّ الرطوبة، معنون بخطّ دقيق — للعدسة الكبرى، في حال المطر. وهو ليس فارغًا. ومفتاح هذه الغرفة معلّق على حزام واحد بالضبط.',
      },
    },
  },

  testimony: {
    t_lola: {
      name: { en: 'Lola’s admission', ar: 'إقرار لولا' },
      desc: { en: 'Still in the dome at 9:40. Saw the archive trolley in the corridor, already loaded.', ar: 'كانت ما زالت في القبّة عند ٩:٤٠. رأت عربة الأرشيف في الممرّ، محمّلة سلفًا.' },
    },
    t_fadi: {
      name: { en: 'Fadi’s gap', ar: 'فجوة فادي' },
      desc: { en: 'On the roof from 10:00 to 10:30, watching for the comet. Saw and heard nothing.', ar: 'كان على السطح من ١٠:٠٠ إلى ١٠:٣٠ يترقّب المذنّب. لم يرَ شيئًا ولم يسمع شيئًا.' },
    },
    t_mimi: {
      name: { en: 'Mimi’s forecast', ar: 'توقّع ميمي' },
      desc: { en: 'She read the midnight weather report at 9:30 — and went very quiet about it.', ar: 'قرأت نشرة طقس منتصف الليل عند ٩:٣٠ — ثمّ صمتت تمامًا بشأنها.' },
    },
  },

  suspects: [
    {
      id: 'lola',
      name: { en: 'Lola', ar: 'لولا' },
      role: { en: 'THE APPRENTICE', ar: 'المتدرّبة' },
      accent: '#e8ac4e',
      desc: {
        en: 'Eleven years old when she first booked tonight in the observatory diary. She has been waiting for this comet longer than she has had a job.',
        ar: 'كانت في الحادية عشرة حين حجزت هذه الليلة أوّل مرّة في دفتر المرصد. تنتظر هذا المذنّب منذ زمن أطول من عمرها المهنيّ.',
      },
      qs: [
        {
          q: { en: 'Walk me through your evening.', ar: 'احكِ لي ماذا جرى في مسائك.' },
          a: {
            en: 'Signed in at 8:40, calibrated the mount, and went home to sleep before the comet. You do not watch a once-in-eleven-years comet on four hours of sleep, Detective.',
            ar: 'سجّلت دخولي في ٨:٤٠، وعايرت الحامل، ثمّ ذهبت إلى البيت لأنام قبل المذنّب. لا يُرصد مذنّب يأتي مرّة كلّ إحدى عشرة سنة بأربع ساعات نوم أيّها المحقّق.',
          },
        },
        {
          q: { en: 'Who else wanted this observation?', ar: 'من غيرك أراد هذا الرصد؟' },
          a: {
            en: 'Everyone and no one. Fadi thinks the sky is weather. Mimi thinks the comet is a crowd problem. I am the only one here who has counted the days.',
            ar: 'الجميع ولا أحد. فادي يظنّ السماء مجرّد طقس. وميمي ترى المذنّب مشكلة ازدحام. أنا الوحيدة هنا التي أحصت الأيّام.',
          },
        },
        {
          q: { en: 'Could you lift that lens alone?', ar: 'أيمكنك رفع تلك العدسة وحدك؟' },
          a: {
            en: 'Not without the trolley, and the trolley lives in the archive, and the archive is not mine to open. Ask the person whose key it is.',
            ar: 'ليس من دون العربة، والعربة تقيم في الأرشيف، والأرشيف ليس لي أن أفتحه. اسأل صاحبة المفتاح.',
          },
        },
      ],
      lies: [
        {
          claim: { en: '“I went home at nine. I never saw the dome again tonight.”', ar: '«ذهبت إلى البيت في التاسعة. ولم أرَ القبّة مرّة أخرى الليلة.»' },
          needs: 'photo',
          react: 'rattled',
          hint: { en: 'Something in this dome was still taking pictures after nine. Check her camera.', ar: 'شيء ما في هذه القبّة كان ما زال يلتقط الصور بعد التاسعة. تفقّد كاميرتها.' },
          seq: [
            {
              w: 'kawkab',
              t: {
                en: 'Then explain the exposure still sitting in your camera, stamped 9:40 PM — the mount photographed from below, with your sleeve in the frame.',
                ar: 'إذن فسّري اللقطة التي ما زالت في كاميرتك، مختومة ٩:٤٠ مساءً — الحامل مصوَّرًا من الأسفل، وكمّك في الإطار.',
              },
            },
            {
              w: 'lola',
              t: {
                en: '…I never went home. I hid in the equipment cupboard so nobody would send me away before the comet. I have waited eleven years, Detective. I was not going to spend tonight asleep.',
                ar: '…لم أذهب إلى البيت قطّ. اختبأت في خزانة المعدّات كي لا يصرفني أحد قبل المذنّب. انتظرت إحدى عشرة سنة أيّها المحقّق. لم أكن لأمضي هذه الليلة نائمة.',
              },
            },
            { w: 'kawkab', t: { en: 'And from a cupboard, what did you see?', ar: 'ومن داخل خزانة، ماذا رأيتِ؟' } },
            {
              w: 'lola',
              t: {
                en: 'The archive trolley in the corridor, around ten. Already loaded. Something big under a grey blanket, and whoever was pushing it was being so gentle about it that I assumed it was fragile and none of my business.',
                ar: 'عربة الأرشيف في الممرّ، قرابة العاشرة. محمّلة سلفًا. شيء كبير تحت بطّانية رماديّة، ومن كان يدفعها كان يفعل ذلك برفق شديد حتّى ظننته شيئًا هشًّا لا يعنيني.',
              },
            },
            {
              w: 'n',
              t: {
                en: 'A frightened apprentice in a cupboard, not a thief. But she has just put the trolley in the corridor at ten — loaded.',
                ar: 'متدرّبة خائفة في خزانة، لا لصّة. لكنّها للتوّ وضعت العربة في الممرّ عند العاشرة — محمّلة.',
              },
            },
          ],
          unlocks: 't_lola',
        },
      ],
      wrong: {
        ledger: { en: 'My name is in that book because I signed it. That is what the book is for.', ar: 'اسمي في ذلك الدفتر لأنّني وقّعته. هذا هو الغرض من الدفتر.' },
        crate: { en: 'I have never been inside the archive. I do not have a key and I never asked for one.', ar: 'لم أدخل الأرشيف قطّ. لا أملك مفتاحًا ولم أطلب واحدًا يومًا.' },
        def: { en: 'That does not point at me, Detective. And I would very much like this solved before midnight.', ar: 'هذا لا يشير إليّ أيّها المحقّق. وأودّ كثيرًا أن تُحلّ القضيّة قبل منتصف الليل.' },
      },
    },

    {
      id: 'fadi',
      name: { en: 'Fadi', ar: 'فادي' },
      role: { en: 'THE NIGHT WATCHMAN', ar: 'حارس الليل' },
      accent: '#5a7fae',
      desc: {
        en: 'Twenty-two years on this door. Wears sunglasses indoors, at night, in a building devoted to collecting faint light.',
        ar: 'اثنتان وعشرون سنة على هذا الباب. يرتدي نظّارة شمسيّة في الداخل، ليلًا، في مبنى مكرَّس لجمع الضوء الخافت.',
      },
      qs: [
        {
          q: { en: 'You were on the door all night?', ar: 'كنت على الباب طوال الليل؟' },
          a: {
            en: 'Door, corridor, dome, archive, repeat. Every thirty minutes, twenty-two years. I could walk it with my eyes shut, and some nights I have.',
            ar: 'الباب، الممرّ، القبّة، الأرشيف، ثمّ الإعادة. كلّ ثلاثين دقيقة، منذ اثنتين وعشرين سنة. أستطيع أن أمشيها مغمض العينين، وقد فعلت في ليالٍ كثيرة.',
          },
        },
        {
          q: { en: 'The sunglasses. Indoors. At night.', ar: 'النظّارة الشمسيّة. في الداخل. ليلًا.' },
          a: {
            en: 'A watchman who looks like he is not looking sees a great deal more than one who does. Twenty-two years, Detective. It works.',
            ar: 'الحارس الذي يبدو وكأنّه لا ينظر يرى أكثر بكثير من الذي يبدو ناظرًا. اثنتان وعشرون سنة أيّها المحقّق. إنّها تنجح.',
          },
        },
        {
          q: { en: 'Who has keys to the archive?', ar: 'من يملك مفاتيح الأرشيف؟' },
          a: {
            en: 'One key. It has hung on the archivist’s belt since long before me. I am not allowed in there without her, and I have never wanted to be.',
            ar: 'مفتاح واحد. معلّق على حزام أمينة الأرشيف منذ ما قبلي بزمن طويل. لا يُسمح لي بالدخول إلّا بصحبتها، ولم أرغب في ذلك يومًا.',
          },
        },
      ],
      lies: [
        {
          claim: { en: '“Every half hour, all night. I never missed a single round.”', ar: '«كلّ نصف ساعة، طوال الليل. لم أفوّت جولة واحدة.»' },
          needs: 'patrol',
          react: 'deny',
          hint: { en: 'His own log keeps the score. Read what it says between ten and half past.', ar: 'سجلّه هو من يحفظ النتيجة. اقرأ ما يقوله بين العاشرة والنصف.' },
          seq: [
            {
              w: 'kawkab',
              t: {
                en: 'Your own log disagrees. Every half hour is signed — except ten to half past, which is blank. Thirty minutes, Fadi. Where were you?',
                ar: 'سجلّك نفسه يخالفك. كلّ نصف ساعة موقّعة — إلّا من العاشرة إلى النصف، فهي فارغة. ثلاثون دقيقة يا فادي. أين كنت؟',
              },
            },
            {
              w: 'fadi',
              t: {
                en: '…On the roof. In the rain. Watching a gap in the cloud, in case the comet came early. Twenty-two years I have guarded a building full of the sky and never once looked at it. I looked at it tonight.',
                ar: '…على السطح. تحت المطر. أراقب فجوة في الغيم، تحسّبًا لأن يأتي المذنّب مبكرًا. اثنتان وعشرون سنة وأنا أحرس مبنى مملوءًا بالسماء ولم أنظر إليها مرّة. الليلة نظرت.',
              },
            },
            {
              w: 'kawkab',
              t: { en: 'And in that half hour you saw nothing, and heard nothing.', ar: 'وفي ذلك النصف ساعة لم ترَ شيئًا ولم تسمع شيئًا.' },
            },
            {
              w: 'fadi',
              t: {
                en: 'Rain on a copper dome, Detective. You could roll a piano through that corridor and I would have heard weather.',
                ar: 'مطر على قبّة نحاسيّة أيّها المحقّق. لو دحرجتَ بيانو في ذلك الممرّ لما سمعت إلّا الطقس.',
              },
            },
            {
              w: 'n',
              t: {
                en: 'Not a lie to hide a theft — a lie to hide half an hour of wonder. But that half hour is exactly when the dome went unwatched.',
                ar: 'ليست كذبة لإخفاء سرقة — بل كذبة لإخفاء نصف ساعة من الدهشة. لكنّ ذلك النصف ساعة هو بالضبط حين بقيت القبّة بلا مراقبة.',
              },
            },
          ],
          unlocks: 't_fadi',
        },
        {
          claim: { en: '“Nothing came out of that dome tonight. Nothing.”', ar: '«لم يخرج شيء من تلك القبّة الليلة. لا شيء.»' },
          needs: 't_lola',
          react: 'rattled',
          hint: { en: 'Someone was hiding in the dome at ten and watched the corridor. Whose statement was that?', ar: 'كان أحدهم مختبئًا في القبّة عند العاشرة وراقب الممرّ. شهادة من كانت تلك؟' },
          seq: [
            {
              w: 'kawkab',
              t: {
                en: 'Lola was in the equipment cupboard at ten. She watched a loaded trolley leave this dome under a grey blanket — during your half hour on the roof.',
                ar: 'كانت لولا في خزانة المعدّات عند العاشرة. رأت عربة محمّلة تغادر هذه القبّة تحت بطّانية رماديّة — خلال نصف ساعتك على السطح.',
              },
            },
            {
              w: 'fadi',
              t: {
                en: '…Then it went out while I was up there. I am not going to pretend otherwise. The archive trolley only rolls for one person, Detective, and it is not me and it is not the child.',
                ar: '…إذن خرجت وأنا في الأعلى. لن أدّعي غير ذلك. عربة الأرشيف لا تتحرّك إلّا لشخص واحد أيّها المحقّق، وهو ليس أنا وليس الفتاة.',
              },
            },
            {
              w: 'n',
              t: {
                en: 'The watchman has just handed me the only door he could not have opened himself.',
                ar: 'سلّمني الحارس للتوّ الباب الوحيد الذي ما كان ليفتحه بنفسه.',
              },
            },
          ],
          unlocks: 't_mimi',
        },
      ],
      wrong: {
        fibre: { en: 'Cotton gloves? I wear leather, and I wear them to hold a torch. Look at my hands.', ar: 'قفّازات قطنيّة؟ أنا أرتدي الجلد، وأرتديه لأمسك مصباحًا. انظر إلى يديّ.' },
        dust: { en: 'A tidy dust ring proves somebody was careful. Careful is not a description of me.', ar: 'حلقة غبار مرتّبة تثبت أنّ أحدهم كان حذرًا. والحذر ليس وصفًا لي.' },
        def: { en: 'Twenty-two years, Detective, and that is the best you have brought me?', ar: 'اثنتان وعشرون سنة أيّها المحقّق، وهذا أفضل ما جئتني به؟' },
      },
    },

    {
      id: 'mimi',
      name: { en: 'Mimi', ar: 'ميمي' },
      role: { en: 'THE ARCHIVIST', ar: 'أمينة الأرشيف' },
      accent: '#c0455a',
      desc: {
        en: 'Keeper of the collection, and of the only key to the room it lives in. Regards the comet as a scheduling difficulty.',
        ar: 'حارسة المجموعة، وحارسة المفتاح الوحيد للغرفة التي تسكنها. ترى المذنّب مجرّد إشكال في الجدول.',
      },
      qs: [
        {
          q: { en: 'Where were you tonight?', ar: 'أين كنتِ الليلة؟' },
          a: {
            en: 'In the archive, where I am every night, doing the work nobody thanks anyone for. Cataloguing. It is a comet, Detective. It will be back.',
            ar: 'في الأرشيف، حيث أكون كلّ ليلة، أؤدّي العمل الذي لا يشكر عليه أحد أحدًا. أفهرس. إنّه مذنّب أيّها المحقّق. سيعود.',
          },
        },
        {
          q: { en: 'You do not seem upset that it is missing.', ar: 'لا تبدين منزعجة لاختفائها.' },
          a: {
            en: 'I am extremely upset. I am simply not theatrical about it. Those are different conditions, whatever this building believes.',
            ar: 'أنا منزعجة للغاية. لكنّني لست مسرحيّة في انزعاجي. هاتان حالتان مختلفتان، مهما اعتقد هذا المبنى.',
          },
        },
        {
          q: { en: 'That lens — what is it worth?', ar: 'تلك العدسة — كم تساوي؟' },
          a: {
            en: 'It cannot be bought and it cannot be replaced. It was ground by hand in 1911 by a man who went blind finishing it. Worth is the wrong question.',
            ar: 'لا تُشترى ولا تُعوَّض. صُقلت يدويًّا سنة ١٩١١ على يد رجل فقد بصره وهو ينهيها. القيمة سؤال خاطئ.',
          },
        },
      ],
      lies: [
        {
          claim: { en: '“I did not set foot in the dome tonight. Not once.”', ar: '«لم تطأ قدمي القبّة الليلة. ولا مرّة.»' },
          needs: 'fibre',
          react: 'deny',
          hint: { en: 'Something of hers is caught in the mount clamp. Something soft and white.', ar: 'شيء يخصّها عَلِق في مشبك الحامل. شيء ناعم وأبيض.' },
          seq: [
            {
              w: 'kawkab',
              t: {
                en: 'Then your glove is a long way from the archive. White archive cotton, caught in the mount clamp. You are the only person in this building who owns a pair.',
                ar: 'إذن قفّازك بعيد جدًّا عن الأرشيف. قطن أرشيف أبيض، عَلِق في مشبك الحامل. أنتِ الوحيدة في هذا المبنى التي تملك زوجًا منها.',
              },
            },
            {
              w: 'mimi',
              t: {
                en: '…I went to the dome. Yes. To look at the mount, and at the seal on the shutter, and at the rain coming through it. Looking is not taking, Detective.',
                ar: '…ذهبت إلى القبّة. نعم. لأنظر إلى الحامل، وإلى الحشوة على المصراع، وإلى المطر الذي ينفذ منها. النظر ليس أخذًا أيّها المحقّق.',
              },
            },
            {
              w: 'n',
              t: {
                en: 'She has placed herself at the mount. She has also, without meaning to, told me she was looking at the rain.',
                ar: 'وضعت نفسها عند الحامل. وأخبرتني أيضًا، دون قصد، أنّها كانت تنظر إلى المطر.',
              },
            },
          ],
          unlocks: null,
        },
        {
          claim: { en: '“The archive trolley has not moved from its corner in a week.”', ar: '«عربة الأرشيف لم تتحرّك من ركنها منذ أسبوع.»' },
          needs: 'tracks',
          react: 'rattled',
          hint: { en: 'The dome floor keeps a record of everything that rolls across it.', ar: 'أرض القبّة تحتفظ بسجلّ لكلّ ما يتدحرج عليها.' },
          seq: [
            {
              w: 'kawkab',
              t: {
                en: 'Two loaded wheel tracks in the dome dust, running out of this room and down your corridor. The floor keeps better records than the ledger does.',
                ar: 'أثرا عجلتين محمّلتين في غبار القبّة، يخرجان من هذه الغرفة نزولًا إلى ممرّك. الأرض تحتفظ بسجلّات أدقّ من السجلّ نفسه.',
              },
            },
            {
              w: 'mimi',
              t: {
                en: '…Fine. It moved. Once. And before you enjoy yourself too much, Detective — ask me why a woman who has spent her life keeping that glass safe would suddenly want it somewhere else.',
                ar: '…حسنًا. تحرّكت. مرّة واحدة. وقبل أن تستمتع أكثر من اللازم أيّها المحقّق — اسألني لماذا امرأة أمضت عمرها في حماية ذلك الزجاج تريده فجأة في مكان آخر.',
              },
            },
            {
              w: 'n',
              t: {
                en: 'She is not denying it any more. She is daring me to understand it.',
                ar: 'لم تعد تنكر. إنّها تتحدّاني أن أفهم.',
              },
            },
          ],
          unlocks: null,
        },
      ],
      wrong: {
        ledger: { en: 'I signed in at 9:25, as I do every night. I am the only one here who fills that book in honestly.', ar: 'سجّلت دخولي في ٩:٢٥، كما أفعل كلّ ليلة. أنا الوحيدة هنا التي تملأ ذلك الدفتر بصدق.' },
        patrol: { en: 'Fadi’s log is Fadi’s problem. I do not sign it and I do not read it.', ar: 'سجلّ فادي مشكلة فادي. لا أوقّعه ولا أقرأه.' },
        photo: { en: 'A photograph of the lens where the lens belongs. You are showing me the crime not happening.', ar: 'صورة للعدسة حيث ينبغي أن تكون. أنت تُريني الجريمة وهي لا تقع.' },
        def: { en: 'That is not proof, Detective. That is a mood. Bring me something with my hands on it.', ar: 'هذا ليس دليلًا أيّها المحقّق. هذا انطباع. ائتني بشيء تلمسه يداي.' },
      },
    },
  ],

  board: {
    how: [
      { v: 'trolley', l: { en: 'Wheeled out on the archive trolley', ar: 'أُخرجت على عربة الأرشيف' } },
      { v: 'hoist', l: { en: 'Lowered through the shutter on the hoist', ar: 'أُنزلت عبر المصراع بالرافعة' } },
      { v: 'carried', l: { en: 'Carried out by hand', ar: 'حُملت باليد' } },
      { v: 'never', l: { en: 'Never removed — hidden in the dome', ar: 'لم تُنقل أصلًا — مخبّأة في القبّة' } },
    ],
    why: [
      { v: 'sold', l: { en: 'To sell it', ar: 'لبيعها' } },
      { v: 'spite', l: { en: 'To spoil the observation', ar: 'لإفساد الرصد' } },
      { v: 'preserve', l: { en: 'To protect it from the rain', ar: 'لحمايتها من المطر' } },
      { v: 'fame', l: { en: 'To be first to use it', ar: 'لتكون أوّل من يستخدمها' } },
    ],
  },

  solution: { who: 'mimi', how: 'trolley', why: 'preserve', proof: 'crate' },

  ending: [
    {
      w: 'n',
      t: {
        en: 'The archive. 11:52 PM. Three chairs, three faces, and eight minutes until a comet.',
        ar: 'الأرشيف. الحادية عشرة واثنتان وخمسون دقيقة مساءً. ثلاثة كراسٍ، وثلاثة وجوه، وثماني دقائق حتّى المذنّب.',
      },
    },
    {
      w: 'kawkab',
      t: {
        en: 'Nobody stole the great lens. It was moved — carefully, slowly, straight up out of its cradle, by someone who has lifted it before and knew exactly how.',
        ar: 'لم يسرق أحد العدسة الكبرى. لقد نُقلت — بحذر وببطء، مستقيمةً خارج مهدها، على يد من رفعها من قبل وعرف تمامًا كيف.',
      },
    },
    {
      w: 'kawkab',
      t: {
        en: 'The 9:30 weather report said the shutter seal would not hold tonight. Mimi read it, walked to the dome, saw rain coming through onto a lens ground by hand in 1911 — and made a decision without asking anyone.',
        ar: 'قالت نشرة التاسعة والنصف إنّ حشوة المصراع لن تصمد الليلة. قرأتها ميمي، ومشت إلى القبّة، ورأت المطر ينفذ على عدسة صُقلت يدويًّا سنة ١٩١١ — واتّخذت قرارًا دون أن تسأل أحدًا.',
      },
    },
    {
      w: 'kawkab',
      t: {
        en: 'The trolley, the corridor, the archive, the felt-lined crate she built for exactly this. Labelled, in her own handwriting: IN CASE OF RAIN.',
        ar: 'العربة، والممرّ، والأرشيف، والصندوق المبطّن باللباد الذي بنته لهذا بالضبط. معنون بخطّ يدها: في حال المطر.',
      },
    },
    {
      w: 'mimi',
      t: {
        en: '…It is a hundred and fifteen years old and it cannot be replaced, and they were going to open a leaking dome onto it for a light show. I would do it again. I would do it tonight.',
        ar: '…عمرها مئة وخمس عشرة سنة ولا تُعوَّض، وكانوا سيفتحون عليها قبّة تسرّب من أجل عرض ضوئيّ. سأفعلها مرّة أخرى. سأفعلها الليلة.',
      },
    },
    {
      w: 'lola',
      t: {
        en: 'Then say so! Say so out loud, to us, and we would have fixed the seal and helped you carry it — and I would still have my comet.',
        ar: 'إذن قوليها! قوليها بصوت عالٍ، لنا، وكنّا سنصلح الحشوة ونساعدك على حملها — ولبقي لي مذنّبي.',
      },
    },
    {
      w: 'n',
      t: {
        en: 'They put the lens back at four minutes to midnight, all three of them on the trolley handle, Fadi holding a tarpaulin over the shutter gap with both arms.',
        ar: 'أعادوا العدسة قبل منتصف الليل بأربع دقائق، ثلاثتهم على مقبض العربة، وفادي ممسك بمشمّع فوق فجوة المصراع بذراعيه الاثنتين.',
      },
    },
    {
      w: 'n',
      t: {
        en: 'The Marid comet arrived on time. Nobody was arrested. Lola got her photograph, and in the corner of it, slightly out of focus, an archivist watching the sky for the first time in years.',
        ar: 'وصل مذنّب المارد في موعده. ولم يُعتقل أحد. حصلت لولا على صورتها، وفي ركنها، خارج البؤرة قليلًا، أمينة أرشيف تنظر إلى السماء لأوّل مرّة منذ سنوات.',
      },
    },
  ],
};
