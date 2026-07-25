/*
 * CASE 2 — THE VANISHING ENCORE
 * Four suspects · seven clues · five lies · one chained testimony.
 * Harder than the observatory: the physical evidence points confidently at the
 * wrong person, and the real break is a timing contradiction rather than an
 * object. The culprit did not steal anything — which is why "how" matters.
 */

export const ENCORE = {
  id: 'encore',
  e: '🎭',
  tier: 2,
  title: { en: 'The Vanishing Encore', ar: 'الختام المتلاشي' },
  setting: { en: 'The Rainfall Theatre · Closing Night', ar: 'مسرح المطر · ليلة الختام' },
  stamp: { en: 'CASE FILE № 002', ar: 'ملف القضيّة رقم ٠٠٢' },
  time: { en: 'THE SOUND BOOTH · 12:05 AM', ar: 'كشك الصوت · ١٢:٠٥ بعد منتصف الليل' },
  victim: {
    line: { en: 'THE MASTER REEL — BLANK', ar: 'الشريط الأصليّ — فارغ' },
    sub: {
      en: 'the only recording of the last performance · forty seconds short',
      ar: 'التسجيل الوحيد للعرض الأخير · ناقص أربعين ثانية',
    },
  },

  intro: [
    {
      w: 'n',
      t: {
        en: 'The Rainfall Theatre closed tonight after ninety-one years, and it closed the way it opened: to a full house and a leaking roof.',
        ar: 'أُغلق مسرح المطر الليلة بعد إحدى وتسعين سنة، وأُغلق كما افتُتح: أمام قاعة ممتلئة وسقف يسرّب.',
      },
    },
    {
      w: 'n',
      t: {
        en: 'One reel of tape was running. One. The last song ever sung on that stage, and the city was promised a recording of it.',
        ar: 'كان شريط واحد يدور. واحد فقط. آخر أغنية تُغنّى على تلك الخشبة، وقد وُعدت المدينة بتسجيل لها.',
      },
    },
    {
      w: 'kawkab',
      t: {
        en: 'The reel is still on the machine. It is still threaded. It is still exactly where it was at eight o’clock — and the last forty seconds of it are silent.',
        ar: 'الشريط ما زال على الجهاز. وما زال مركّبًا. وما زال تمامًا حيث كان عند الثامنة — وآخر أربعين ثانية منه صامتة.',
      },
    },
    {
      w: 'kawkab',
      t: {
        en: 'So nothing was taken from this building. Something was done inside it. Four people had the run of the wings tonight. Find out which of them touched that machine.',
        ar: 'إذن لم يُؤخذ شيء من هذا المبنى. بل فُعل شيء داخله. أربعة أشخاص كانوا يجولون في الكواليس الليلة. اكتشف من منهم لمس ذلك الجهاز.',
      },
    },
  ],

  hotspots: [
    { id: 'machine', e: '📼', name: { en: 'The tape machine', ar: 'جهاز الشريط' }, pos: { x: 48, y: 36 }, clue: 'gap' },
    { id: 'roommic', e: '🎙', name: { en: 'The room microphone', ar: 'ميكروفون القاعة' }, pos: { x: 74, y: 28 }, clue: 'applause' },
    { id: 'hooks', e: '🔑', name: { en: 'The key hooks', ar: 'خطّافات المفاتيح' }, pos: { x: 14, y: 44 }, clue: 'key' },
    { id: 'wings', e: '🧥', name: { en: 'A coat in the wings', ar: 'معطف في الكواليس' }, pos: { x: 22, y: 74 }, clue: 'coat' },
    { id: 'dressing', e: '💄', name: { en: 'Dressing room one', ar: 'غرفة الملابس الأولى' }, pos: { x: 86, y: 66 }, clue: 'setlist' },
    { id: 'office', e: '📄', name: { en: 'The manager’s desk', ar: 'مكتب المديرة' }, pos: { x: 60, y: 80 }, clue: 'contract' },
    { id: 'ladder', e: '🪜', name: { en: 'The catwalk ladder', ar: 'سلّم الممشى العلويّ' }, pos: { x: 34, y: 18 }, clue: 'scuff' },

    {
      id: 'poster',
      e: '🖼',
      name: { en: 'The opening-night poster', ar: 'ملصق ليلة الافتتاح' },
      pos: { x: 8, y: 20 },
      quirk: [
        [{ w: 'n', t: { en: '1935. Same theatre, same leak, same stain on the ceiling — visible in the photograph.', ar: '١٩٣٥. المسرح نفسه، والتسريب نفسه، والبقعة نفسها على السقف — ظاهرة في الصورة.' } }],
        [{ w: 'kawkab', t: { en: 'Ninety-one years of that stain. They should have framed the ceiling instead.', ar: 'واحدة وتسعون سنة من تلك البقعة. كان الأجدر بهم تأطير السقف بدلًا من ذلك.' } }],
      ],
    },
    {
      id: 'bucket',
      e: '🪣',
      name: { en: 'A bucket, centre stage', ar: 'دلو، وسط الخشبة' },
      pos: { x: 55, y: 60 },
      quirk: [
        [{ w: 'kawkab', t: { en: 'A bucket. Centre stage. Catching the roof. Nobody moved it during the show — the audience applauded it.', ar: 'دلو. وسط الخشبة. يتلقّى ما يسقط من السقف. لم يحرّكه أحد أثناء العرض — بل صفّق له الجمهور.' } }],
        [{ w: 'kawkab', t: { en: 'Ninety-one years and the bucket gets a curtain call. This city has its priorities in order.', ar: 'واحدة وتسعون سنة والدلو ينال تحيّة الختام. هذه المدينة ترتّب أولويّاتها جيّدًا.' } }],
      ],
    },
  ],

  clues: {
    gap: {
      e: '📼',
      name: { en: 'Forty silent seconds', ar: 'أربعون ثانية صامتة' },
      desc: { en: 'The reel runs to the end. The last forty seconds carry no signal at all — erased, not cut.', ar: 'الشريط يدور حتّى النهاية. آخر أربعين ثانية لا تحمل أيّ إشارة — مُمحاة لا مقصوصة.' },
      narr: {
        en: 'The tape is intact end to end — no splice, no cut, no missing length. And yet the final forty seconds carry nothing but the hiss of blank oxide. This reel was not stolen and it was not damaged. Somebody held down erase while it was still running.',
        ar: 'الشريط سليم من أوّله إلى آخره — لا وصلة، ولا قصّة، ولا طول مفقود. ومع ذلك فآخر أربعين ثانية لا تحمل سوى صفير أكسيد فارغ. هذا الشريط لم يُسرق ولم يتضرّر. أحدهم ضغط زرّ المسح وهو ما زال يدور.',
      },
    },
    applause: {
      e: '🎙',
      name: { en: 'The room microphone', ar: 'ميكروفون القاعة' },
      desc: { en: 'The backup room mic caught the whole night — including the last note, and one wrong one.', ar: 'التقط ميكروفون القاعة الاحتياطيّ الليلة كلّها — بما فيها النغمة الأخيرة، ونغمة خاطئة واحدة.' },
      narr: {
        en: 'Nobody remembered the backup room mic, running to its own little cassette in the ceiling. It caught everything the master missed: the final verse, a note reached for and badly missed, four seconds of absolute silence — and then the loudest applause this theatre has heard in ninety-one years.',
        ar: 'لم يتذكّر أحد ميكروفون القاعة الاحتياطيّ، الذي يسجّل على شريطه الصغير في السقف. التقط كلّ ما فات الشريط الأصليّ: المقطع الأخير، ونغمة حاول بلوغها فأخطأها بوضوح، وأربع ثوانٍ من صمت مطبق — ثمّ أعلى تصفيق سمعه هذا المسرح في إحدى وتسعين سنة.',
      },
    },
    key: {
      e: '🔑',
      name: { en: 'The booth key', ar: 'مفتاح الكشك' },
      desc: { en: 'Back on its hook — but the wrong hook. Returned by someone who does not hang it nightly.', ar: 'عاد إلى خطّافه — لكنّه الخطّاف الخطأ. أعاده شخص لا يعلّقه كلّ ليلة.' },
      narr: {
        en: 'The sound booth key is on the board where it belongs. On the wrong hook. Every hook is labelled, and the person who hangs this key three hundred nights a year has never once needed to read the labels.',
        ar: 'مفتاح كشك الصوت على اللوحة حيث ينبغي. على الخطّاف الخطأ. كلّ خطّاف معنون، والشخص الذي يعلّق هذا المفتاح ثلاثمئة ليلة في السنة لم يحتج يومًا إلى قراءة العناوين.',
      },
    },
    coat: {
      e: '🧥',
      name: { en: 'The soaked coat', ar: 'المعطف المبلّل' },
      desc: { en: 'Still dripping in the wings. Someone stood out in the rain during the second half.', ar: 'ما زال يقطر في الكواليس. أحدهم وقف تحت المطر أثناء النصف الثاني.' },
      narr: {
        en: 'A long coat on a hook in the wings, heavy with water, still dripping onto the boards. It did not get that wet walking in at seven — the rain only started at half past ten. Somebody was outside this building in the second half of the last show it will ever give.',
        ar: 'معطف طويل على خطّاف في الكواليس، ثقيل بالماء، ما زال يقطر على الألواح. لم يبتلّ هكذا وهو يدخل عند السابعة — فالمطر لم يبدأ إلّا في العاشرة والنصف. أحدهم كان خارج هذا المبنى في النصف الثاني من آخر عرض سيقدّمه في حياته.',
      },
    },
    setlist: {
      e: '📝',
      name: { en: 'The amended setlist', ar: 'قائمة الأغاني المعدّلة' },
      desc: { en: 'The last song was crossed out and rewritten — in a lower key — twice.', ar: 'الأغنية الأخيرة شُطبت وأُعيدت كتابتها — بمقام أخفض — مرّتين.' },
      narr: {
        en: 'Taped to the mirror, the running order. The final song has been crossed out and rewritten twice, each time a little lower in the key, the last correction pressed so hard the pen went through the paper. Somewhere in this building is a person who knew, hours in advance, that they might not reach that note.',
        ar: 'ملصقة على المرآة، قائمة الترتيب. الأغنية الأخيرة شُطبت وأُعيدت كتابتها مرّتين، في كلّ مرّة بمقام أخفض قليلًا، والتصحيح الأخير ضُغط بقوّة حتّى اخترق القلم الورقة. في مكان ما من هذا المبنى شخص عرف، قبل ساعات، أنّه قد لا يبلغ تلك النغمة.',
      },
    },
    contract: {
      e: '📄',
      name: { en: 'The recording clause', ar: 'بند التسجيل' },
      desc: { en: 'The reel pays off the theatre’s debts — but only if it is released complete.', ar: 'الشريط يسدّد ديون المسرح — لكن فقط إذا صدر كاملًا.' },
      narr: {
        en: 'Clause nine, in the manager’s drawer, underlined in her own pen: the recording of the closing performance, released complete and unedited, clears every debt this theatre has carried since 1998. Released incomplete, it is worth nothing at all. Somebody in this building has just destroyed the only thing keeping the doors open.',
        ar: 'البند التاسع، في درج المديرة، مسطَّر بقلمها: تسجيل عرض الختام، صادرًا كاملًا دون تحرير، يسدّد كلّ دين حمله هذا المسرح منذ ١٩٩٨. أمّا إذا صدر ناقصًا فلا يساوي شيئًا البتّة. أحدهم في هذا المبنى دمّر للتوّ الشيء الوحيد الذي كان يُبقي الأبواب مفتوحة.',
      },
    },
    scuff: {
      e: '🪜',
      name: { en: 'Scuffs on the ladder', ar: 'خدوش على السلّم' },
      desc: { en: 'Fresh marks up the catwalk ladder — someone went up during the show.', ar: 'علامات حديثة على سلّم الممشى — صعد أحدهم أثناء العرض.' },
      narr: {
        en: 'Fresh black scuffs up six rungs of the catwalk ladder, and a hand-print in the dust at the top. Somebody climbed to the lighting bridge tonight, in the dark, mid-performance. From up there you can see the whole stage. You cannot reach the sound booth.',
        ar: 'خدوش سوداء حديثة على ستّ درجات من سلّم الممشى، وبصمة يد في الغبار عند القمّة. صعد أحدهم إلى جسر الإضاءة الليلة، في العتمة، أثناء العرض. من هناك ترى الخشبة كلّها. لكنّك لا تصل إلى كشك الصوت.',
      },
    },
  },

  testimony: {
    t_lola: {
      name: { en: 'Lola’s handover', ar: 'تسليم لولا' },
      desc: { en: 'She left the booth unlocked at 11:20 to fix a dead stage monitor. Gone six minutes.', ar: 'تركت الكشك مفتوحًا في ١١:٢٠ لإصلاح شاشة خشبة معطّلة. غابت ستّ دقائق.' },
    },
    t_ramy: {
      name: { en: 'Ramy’s errand', ar: 'مهمّة رامي' },
      desc: { en: 'Outside in the rain from 11:15, moving the piano truck. Nowhere near the booth.', ar: 'كان في الخارج تحت المطر منذ ١١:١٥ ينقل شاحنة البيانو. بعيدًا كلّ البعد عن الكشك.' },
    },
    t_mimi: {
      name: { en: 'Mimi’s clause', ar: 'بند ميمي' },
      desc: { en: 'She admits the reel was the theatre’s last asset — and that she never went near it.', ar: 'تعترف بأنّ الشريط كان آخر أصول المسرح — وأنّها لم تقترب منه قطّ.' },
    },
  },

  suspects: [
    {
      id: 'star',
      name: { en: 'Star', ar: 'ستار' },
      role: { en: 'THE VOICE', ar: 'الصوت' },
      accent: '#f0c674',
      desc: {
        en: 'Sang here for thirty years, and closed the building tonight. Takes a bow the way other people take cover.',
        ar: 'غنّت هنا ثلاثين سنة، وأغلقت المبنى الليلة. تنحني للجمهور كما يحتمي الآخرون.',
      },
      qs: [
        {
          q: { en: 'How did the last song go?', ar: 'كيف مضت الأغنية الأخيرة؟' },
          a: {
            en: 'Beautifully. They stood up, Detective. Ninety-one years of that building and they stood up for me. Ask anyone who was in the room.',
            ar: 'بشكل رائع. وقفوا أيّها المحقّق. واحدة وتسعون سنة من ذلك المبنى ووقفوا من أجلي. اسأل أيّ أحد كان في القاعة.',
          },
        },
        {
          q: { en: 'You rewrote that song twice.', ar: 'أعدتِ كتابة تلك الأغنية مرّتين.' },
          a: {
            en: 'I refine. Every singer refines. A key is a suggestion, not a marriage.',
            ar: 'أنا أنقّح. كلّ مغنٍّ ينقّح. المقام اقتراح، لا زواج.',
          },
        },
        {
          q: { en: 'Who else was backstage in the second half?', ar: 'من غيرك كان خلف الكواليس في النصف الثاني؟' },
          a: {
            en: 'Ramy, being enormous and silent somewhere. Lola in her booth with her lights on. Mimi counting a house that did not sell out. And me, becoming history.',
            ar: 'رامي، ضخمًا وصامتًا في مكان ما. ولولا في كشكها وأضواؤها مضاءة. وميمي تحصي قاعة لم تُبَع بالكامل. وأنا، أصير تاريخًا.',
          },
        },
      ],
      lies: [
        {
          claim: { en: '“I did not miss a note all night. Not one.”', ar: '«لم أخطئ نغمة طوال الليل. ولا واحدة.»' },
          needs: 'applause',
          react: 'rattled',
          hint: { en: 'There was a second microphone nobody remembered. It heard the whole song.', ar: 'كان هناك ميكروفون ثانٍ لم يتذكّره أحد. سمع الأغنية كاملة.' },
          seq: [
            {
              w: 'kawkab',
              t: {
                en: 'There was a second microphone in the ceiling, running to its own cassette. It heard the last verse. It heard the note you reached for. It heard you not reach it.',
                ar: 'كان هناك ميكروفون ثانٍ في السقف، يسجّل على شريطه الخاصّ. سمع المقطع الأخير. وسمع النغمة التي حاولتِ بلوغها. وسمعك لا تبلغينها.',
              },
            },
            {
              w: 'star',
              t: {
                en: '…Thirty years I have hit that note in that room. Thirty. And on the very last night, in front of everyone who ever believed I could — it went. Just went, like a light.',
                ar: '…ثلاثون سنة وأنا أبلغ تلك النغمة في تلك القاعة. ثلاثون. وفي الليلة الأخيرة تمامًا، أمام كلّ من آمن يومًا بأنّني أستطيع — ذهبت. ذهبت هكذا، كضوء ينطفئ.',
              },
            },
            {
              w: 'kawkab',
              t: { en: 'And then they stood up anyway.', ar: 'ثمّ وقفوا رغم ذلك.' },
            },
            {
              w: 'star',
              t: {
                en: 'They stood up for the thirty years, Detective. Not for tonight. I know the difference. I have always known the difference.',
                ar: 'وقفوا من أجل الثلاثين سنة أيّها المحقّق. لا من أجل الليلة. أعرف الفرق. عرفته دائمًا.',
              },
            },
            {
              w: 'n',
              t: {
                en: 'A missed note is not a crime. But now I know there was something on that tape worth forty seconds of somebody’s courage.',
                ar: 'النغمة المخطئة ليست جريمة. لكنّني الآن أعرف أنّ على ذلك الشريط ما يستحقّ أربعين ثانية من شجاعة أحدهم.',
              },
            },
          ],
          unlocks: null,
        },
        {
          claim: { en: '“I have never been inside that sound booth in my life.”', ar: '«لم أدخل كشك الصوت ذاك في حياتي.»' },
          needs: 't_lola',
          react: 'concede',
          hint: { en: 'The booth stood unlocked and empty for six minutes. Who told you that?', ar: 'بقي الكشك مفتوحًا وفارغًا ستّ دقائق. من أخبرك بذلك؟' },
          seq: [
            {
              w: 'kawkab',
              t: {
                en: 'Lola left that booth unlocked at 11:20 and was gone six minutes fixing a monitor. Six minutes, an open door, and a key back on the wrong hook. You were the only person not on stage, not outside, and not in the office.',
                ar: 'تركت لولا ذلك الكشك مفتوحًا في ١١:٢٠ وغابت ستّ دقائق تصلح شاشة. ستّ دقائق، وباب مفتوح، ومفتاح عاد إلى الخطّاف الخطأ. وكنتِ الوحيدة التي لم تكن على الخشبة، ولا في الخارج، ولا في المكتب.',
              },
            },
            {
              w: 'star',
              t: {
                en: '…I held down the erase and I counted to forty and I did not breathe once. Thirty years of that room and I could not let the last forty seconds of it be the sound of me failing.',
                ar: '…ضغطت زرّ المسح وعددت إلى أربعين ولم أتنفّس مرّة واحدة. ثلاثون سنة في تلك القاعة، ولم أستطع أن تكون آخر أربعين ثانية منها صوت فشلي.',
              },
            },
            {
              w: 'kawkab',
              t: {
                en: 'You erased the applause too, you know. All of it.',
                ar: 'لقد محوتِ التصفيق أيضًا. كلّه.',
              },
            },
            {
              w: 'star',
              t: {
                en: '…Oh. Oh, I did, didn’t I.',
                ar: '…أوه. فعلت، أليس كذلك.',
              },
            },
          ],
          unlocks: null,
        },
      ],
      wrong: {
        coat: { en: 'I have not been outdoors since Tuesday. Look at this hair and tell me it has seen rain.', ar: 'لم أخرج منذ الثلاثاء. انظر إلى هذا الشعر وقل لي إنّه رأى مطرًا.' },
        contract: { en: 'Mimi’s paperwork. I sing, Detective. I have never once read a clause.', ar: 'أوراق ميمي. أنا أغنّي أيّها المحقّق. لم أقرأ بندًا واحدًا في حياتي.' },
        scuff: { en: 'A ladder. In these shoes. You are not a serious man.', ar: 'سلّم. بهذا الحذاء. لست رجلًا جادًّا.' },
        def: { en: 'Darling, that is scenery, not evidence. Bring me a second act.', ar: 'يا عزيزي، هذا ديكور لا دليل. ائتني بفصل ثانٍ.' },
      },
    },

    {
      id: 'lola',
      name: { en: 'Lola', ar: 'لولا' },
      role: { en: 'THE ENGINEER', ar: 'مهندسة الصوت' },
      accent: '#e8ac4e',
      desc: {
        en: 'Runs the booth alone and has done since she was nineteen. Threaded the reel herself at eight o’clock.',
        ar: 'تدير الكشك وحدها منذ كانت في التاسعة عشرة. ركّبت الشريط بنفسها عند الثامنة.',
      },
      qs: [
        {
          q: { en: 'Talk me through the recording.', ar: 'حدّثيني عن التسجيل.' },
          a: {
            en: 'Threaded at eight, levels set by half past, running light on all night. I checked it at the interval and it was perfect. It was going to be perfect.',
            ar: 'ركّبته عند الثامنة، وضبطت المستويات عند النصف، وضوء التشغيل مضاء طوال الليل. تفقّدته في الاستراحة وكان مثاليًّا. كان سيكون مثاليًّا.',
          },
        },
        {
          q: { en: 'Who else can work that machine?', ar: 'من غيرك يجيد تشغيل ذلك الجهاز؟' },
          a: {
            en: 'Anybody. That is the horrible part. It is one big red button and everyone in this building has watched me press it a thousand times.',
            ar: 'أيّ أحد. هذا هو الجزء المروّع. إنّه زرّ أحمر كبير واحد، وكلّ من في هذا المبنى رآني أضغطه ألف مرّة.',
          },
        },
      ],
      lies: [
        {
          claim: { en: '“I never left that booth. Not from eight until the curtain.”', ar: '«لم أغادر ذلك الكشك. لا من الثامنة حتّى إسدال الستار.»' },
          needs: 'key',
          react: 'rattled',
          hint: { en: 'The booth key came back to the board — but not the way she hangs it.', ar: 'عاد مفتاح الكشك إلى اللوحة — لكن ليس بالطريقة التي تعلّقه بها.' },
          seq: [
            {
              w: 'kawkab',
              t: {
                en: 'Then who hung your key on the wrong hook? You have hung it on the right one three hundred nights a year since you were nineteen.',
                ar: 'إذن من علّق مفتاحك على الخطّاف الخطأ؟ أنتِ تعلّقينه على الصحيح ثلاثمئة ليلة في السنة منذ كنتِ في التاسعة عشرة.',
              },
            },
            {
              w: 'lola',
              t: {
                en: '…Twenty past eleven. The stage-left monitor died in the middle of the last song and she could not hear herself. I ran. I was gone six minutes and I did not lock the door because I was coming straight back.',
                ar: '…الحادية عشرة وعشرون دقيقة. تعطّلت شاشة يسار الخشبة في منتصف الأغنية الأخيرة ولم تعد تسمع نفسها. ركضت. غبت ستّ دقائق ولم أقفل الباب لأنّني كنت عائدة فورًا.',
              },
            },
            {
              w: 'kawkab',
              t: {
                en: 'Six minutes. And an unlocked door. Why not simply say so?',
                ar: 'ستّ دقائق. وباب غير مقفل. لمَ لم تقولي ذلك ببساطة؟',
              },
            },
            {
              w: 'lola',
              t: {
                en: 'Because it is my booth and my reel and my one job, and I left it open on the most important night this building will ever have. That is not an alibi, Detective. That is the thing I will think about for years.',
                ar: 'لأنّه كشكي وشريطي ووظيفتي الوحيدة، وتركته مفتوحًا في أهمّ ليلة سيعرفها هذا المبنى. هذه ليست حجّة غياب أيّها المحقّق. هذا ما سأفكّر فيه لسنوات.',
              },
            },
            {
              w: 'n',
              t: {
                en: 'Six unwatched minutes, at exactly the hour that matters. The case just narrowed to whoever was standing still at 11:20.',
                ar: 'ستّ دقائق بلا مراقبة، في الساعة التي تهمّ بالضبط. ضاقت القضيّة للتوّ إلى من كان واقفًا بلا حراك عند ١١:٢٠.',
              },
            },
          ],
          unlocks: 't_lola',
        },
      ],
      wrong: {
        gap: { en: 'I know what the tape says. I have played it eleven times. It is my reel that is blank.', ar: 'أعرف ما يقوله الشريط. شغّلته إحدى عشرة مرّة. شريطي أنا هو الفارغ.' },
        setlist: { en: 'Singers rewrite keys, Detective. That is a Tuesday, not a motive.', ar: 'المغنّون يعيدون كتابة المقامات أيّها المحقّق. هذا يوم عاديّ، لا دافع.' },
        def: { en: 'That is not it. Please — it is my booth. Ask me something that gets us closer.', ar: 'ليس هذا. أرجوك — إنّه كشكي. اسألني عمّا يقرّبنا أكثر.' },
      },
    },

    {
      id: 'ramy',
      name: { en: 'Ramy', ar: 'رامي' },
      role: { en: 'THE STAGEHAND', ar: 'عامل الخشبة' },
      accent: '#8a8fb0',
      desc: {
        en: 'Moves everything heavy in this building and says roughly forty words a week. Hood up, indoors, always.',
        ar: 'ينقل كلّ ثقيل في هذا المبنى ويقول نحو أربعين كلمة في الأسبوع. قلنسوته مرفوعة، في الداخل، دائمًا.',
      },
      qs: [
        {
          q: { en: 'Where were you in the second half?', ar: 'أين كنت في النصف الثاني؟' },
          a: { en: 'Working.', ar: 'أعمل.' },
        },
        {
          q: { en: 'Working where, exactly?', ar: 'تعمل أين، بالتحديد؟' },
          a: {
            en: 'Where the heavy things are. The piano goes back to the hire company tonight or the theatre pays another month it does not have.',
            ar: 'حيث الأشياء الثقيلة. البيانو يعود إلى شركة التأجير الليلة أو يدفع المسرح شهرًا آخر لا يملكه.',
          },
        },
        {
          q: { en: 'You are not upset the recording is gone.', ar: 'لا تبدو منزعجًا لضياع التسجيل.' },
          a: {
            en: 'I was here for the singing. I do not need it twice.',
            ar: 'كنت هنا وقت الغناء. لا أحتاج إليه مرّتين.',
          },
        },
      ],
      lies: [
        {
          claim: { en: '“I was inside this building all night.”', ar: '«كنت داخل هذا المبنى طوال الليل.»' },
          needs: 'coat',
          react: 'concede',
          hint: { en: 'Something in the wings is still dripping. The rain only started at half past ten.', ar: 'شيء في الكواليس ما زال يقطر. والمطر لم يبدأ إلّا في العاشرة والنصف.' },
          seq: [
            {
              w: 'kawkab',
              t: {
                en: 'Your coat is still dripping onto the boards. The rain started at half past ten. You were outside, in the second half, for long enough to get that wet.',
                ar: 'معطفك ما زال يقطر على الألواح. بدأ المطر في العاشرة والنصف. كنت في الخارج، في النصف الثاني، مدّةً كافية لتبتلّ هكذا.',
              },
            },
            {
              w: 'ramy',
              t: {
                en: '…Quarter past eleven. Loading the piano. Alone, in the rain, through the last song of her life, because the truck came when the truck came.',
                ar: '…الحادية عشرة وربع. أحمّل البيانو. وحدي، تحت المطر، خلال آخر أغنية في حياتها، لأنّ الشاحنة جاءت حين جاءت.',
              },
            },
            {
              w: 'kawkab',
              t: { en: 'You missed it. After all these years, you missed the last song.', ar: 'فاتتك. بعد كلّ هذه السنوات، فاتتك الأغنية الأخيرة.' },
            },
            {
              w: 'ramy',
              t: {
                en: 'I heard it through the dock door. That was enough. …It was enough.',
                ar: 'سمعتها عبر باب التحميل. كان ذلك كافيًا. …كان كافيًا.',
              },
            },
            {
              w: 'n',
              t: {
                en: 'Outside, in the rain, with a piano and a truck driver for witnesses. Whatever happened in that booth, it happened without him.',
                ar: 'في الخارج، تحت المطر، ومعه بيانو وسائق شاحنة شاهدين. مهما جرى في ذلك الكشك، فقد جرى من دونه.',
              },
            },
          ],
          unlocks: 't_ramy',
        },
      ],
      wrong: {
        scuff: { en: 'I climb that ladder every night of my life. Those marks are older than this case.', ar: 'أتسلّق ذلك السلّم كلّ ليلة من حياتي. تلك العلامات أقدم من هذه القضيّة.' },
        key: { en: 'I have never held that key. Lola does not let anyone hold that key.', ar: 'لم أمسك ذلك المفتاح قطّ. لولا لا تدع أحدًا يمسكه.' },
        def: { en: 'No.', ar: 'لا.' },
      },
    },

    {
      id: 'mimi',
      name: { en: 'Mimi', ar: 'ميمي' },
      role: { en: 'THE MANAGER', ar: 'المديرة' },
      accent: '#c0455a',
      desc: {
        en: 'Kept this theatre alive for eleven years on arithmetic and stubbornness. Tonight the arithmetic ran out.',
        ar: 'أبقت هذا المسرح حيًّا إحدى عشرة سنة بالحساب والعناد. الليلة نفد الحساب.',
      },
      qs: [
        {
          q: { en: 'Where were you during the last song?', ar: 'أين كنتِ أثناء الأغنية الأخيرة؟' },
          a: {
            en: 'In the office, counting a house that came ninety seats short of saving us. I heard the applause through the wall and I knew exactly what it was worth.',
            ar: 'في المكتب، أحصي قاعة جاءت أقلّ بتسعين مقعدًا من أن تنقذنا. سمعت التصفيق عبر الجدار وعرفت تمامًا كم يساوي.',
          },
        },
        {
          q: { en: 'What does that reel mean to you?', ar: 'ماذا يعني لك ذلك الشريط؟' },
          a: {
            en: 'Everything, Detective, and I will not pretend otherwise to look less guilty. It was the last asset this building had.',
            ar: 'كلّ شيء أيّها المحقّق، ولن أتظاهر بغير ذلك لأبدو أقلّ إدانة. كان آخر أصل يملكه هذا المبنى.',
          },
        },
      ],
      lies: [
        {
          claim: { en: '“Nobody stood to gain or lose a thing from that recording.”', ar: '«لم يكن لأحد ما يكسبه أو يخسره من ذلك التسجيل.»' },
          needs: 'contract',
          react: 'deny',
          hint: { en: 'There is a clause in her own desk, underlined in her own pen.', ar: 'في درجها بند مسطَّر بقلمها هي.' },
          seq: [
            {
              w: 'kawkab',
              t: {
                en: 'Clause nine. Released complete, that reel clears every debt this theatre has carried since 1998. Released incomplete, it is worth nothing. You underlined it yourself.',
                ar: 'البند التاسع. صادرًا كاملًا، يسدّد ذلك الشريط كلّ دين حمله هذا المسرح منذ ١٩٩٨. وصادرًا ناقصًا، لا يساوي شيئًا. أنتِ سطّرته بنفسك.',
              },
            },
            {
              w: 'mimi',
              t: {
                en: '…I underlined it in March, when I still thought we would make it. Yes, everyone stood to lose. Me most of all. Which is precisely why I would be the last person in this building to touch that machine.',
                ar: '…سطّرته في آذار، حين كنت ما زلت أظنّ أنّنا سننجو. نعم، كان الجميع سيخسر. وأنا أكثرهم. ولهذا بالضبط سأكون آخر من يلمس ذلك الجهاز في هذا المبنى.',
              },
            },
            {
              w: 'kawkab',
              t: {
                en: 'Then why say nobody stood to lose?',
                ar: 'إذن لماذا قلتِ إنّ لا أحد كان سيخسر؟',
              },
            },
            {
              w: 'mimi',
              t: {
                en: 'Because the moment you read clause nine, the woman who signed it becomes your favourite suspect, and I have eleven years of goodwill in this city that I would rather not spend on your afternoon.',
                ar: 'لأنّه ما إن تقرأ البند التاسع حتّى تصير الموقّعة عليه مشتبهك المفضّل، ولديّ إحدى عشرة سنة من حسن السمعة في هذه المدينة أفضّل ألّا أنفقها على ظهيرتك.',
              },
            },
            {
              w: 'n',
              t: {
                en: 'The strongest motive in the building, freely admitted. Which is usually the sound of a motive that goes nowhere.',
                ar: 'أقوى دافع في المبنى، معترَف به بحرّية. وهذا عادةً صوت دافع لا يقود إلى شيء.',
              },
            },
          ],
          unlocks: 't_mimi',
        },
      ],
      wrong: {
        applause: { en: 'A missed note. In a career of thirty years. You are holding a human being, not a clue.', ar: 'نغمة مخطئة. في مسيرة ثلاثين سنة. أنت تمسك بإنسان، لا بدليل.' },
        coat: { en: 'I have not been outside since seven and my coat is dry as a receipt.', ar: 'لم أخرج منذ السابعة ومعطفي جافّ كإيصال.' },
        def: { en: 'No. Try the person who had something to protect that was not money.', ar: 'لا. جرّب من كان لديه ما يحميه ممّا ليس مالًا.' },
      },
    },
  ],

  board: {
    how: [
      { v: 'erase', l: { en: 'Erased in place, mid-performance', ar: 'مُحي في مكانه أثناء العرض' } },
      { v: 'swap', l: { en: 'The reel was swapped for a blank', ar: 'استُبدل الشريط بآخر فارغ' } },
      { v: 'cut', l: { en: 'The tape was cut and spliced', ar: 'قُصّ الشريط ووُصل' } },
      { v: 'never', l: { en: 'The machine was never recording', ar: 'الجهاز لم يكن يسجّل أصلًا' } },
    ],
    why: [
      { v: 'debt', l: { en: 'To collapse the theatre’s debt deal', ar: 'لإفشال صفقة ديون المسرح' } },
      { v: 'shame', l: { en: 'To bury a note that was missed', ar: 'لدفن نغمة أُخطئت' } },
      { v: 'grudge', l: { en: 'To spite the management', ar: 'نكايةً بالإدارة' } },
      { v: 'accident', l: { en: 'An accident nobody has owned up to', ar: 'حادث لم يعترف به أحد' } },
    ],
  },

  solution: { who: 'star', how: 'erase', why: 'shame', proof: 'applause' },

  ending: [
    {
      w: 'n',
      t: {
        en: 'The stalls. 1:40 AM. Four people in the first row of a theatre that will be a car park by spring.',
        ar: 'صالة المقاعد. الواحدة وأربعون دقيقة فجرًا. أربعة أشخاص في الصفّ الأوّل من مسرح سيصير موقف سيّارات بحلول الربيع.',
      },
    },
    {
      w: 'kawkab',
      t: {
        en: 'Nobody stole this recording. Nobody cut it, swapped it, or dropped it. It sat on its machine all night doing exactly what it was asked to do — until somebody held down erase for forty seconds.',
        ar: 'لم يسرق أحد هذا التسجيل. ولم يقصّه أحد، ولم يستبدله، ولم يُسقطه. بقي على جهازه طوال الليل يؤدّي تمامًا ما طُلب منه — حتّى ضغط أحدهم زرّ المسح أربعين ثانية.',
      },
    },
    {
      w: 'kawkab',
      t: {
        en: 'Ramy was outside in the rain with a piano. Mimi was in the office with the only motive worth money, and volunteered it. Lola left the door open at 11:20 and has not forgiven herself since.',
        ar: 'كان رامي في الخارج تحت المطر مع بيانو. وكانت ميمي في المكتب ومعها الدافع الوحيد الذي يساوي مالًا، وقدّمته طوعًا. وتركت لولا الباب مفتوحًا عند ١١:٢٠ ولم تسامح نفسها منذئذٍ.',
      },
    },
    {
      w: 'kawkab',
      t: {
        en: 'Which leaves the one person who was neither on stage nor outside nor in the office — standing very still in the wings, six feet from an unlocked booth, having just missed a note in front of everyone she has ever wanted to be good for.',
        ar: 'ما يترك الشخص الوحيد الذي لم يكن على الخشبة ولا في الخارج ولا في المكتب — واقفًا بلا حراك في الكواليس، على بعد مترين من كشك غير مقفل، وقد أخطأ للتوّ نغمة أمام كلّ من أرادت يومًا أن تكون جديرة بهم.',
      },
    },
    {
      w: 'star',
      t: {
        en: 'Thirty years. And the version of me that lasts forever was going to be the one that could not do it any more.',
        ar: 'ثلاثون سنة. وكانت نسختي التي ستبقى إلى الأبد هي التي لم تعد قادرة.',
      },
    },
    {
      w: 'mimi',
      t: {
        en: 'Star. The room mic recorded all of it. The note, the silence, and four hundred people standing up anyway. That cassette is admissible under clause nine and it is, I am told, unbearably moving.',
        ar: 'ستار. سجّل ميكروفون القاعة كلّ ذلك. النغمة، والصمت، وأربعمئة شخص يقفون رغم ذلك. ذلك الشريط مقبول بموجب البند التاسع، وهو — كما قيل لي — مؤثّر إلى حدّ لا يُحتمل.',
      },
    },
    {
      w: 'n',
      t: {
        en: 'They released the room-mic tape in the autumn. It sold out twice over, missed note and all — and the theatre is still standing.',
        ar: 'أصدروا شريط ميكروفون القاعة في الخريف. نفدت نسخه مرّتين، بالنغمة المخطئة وكلّ شيء — والمسرح ما زال قائمًا.',
      },
    },
  ],
};
