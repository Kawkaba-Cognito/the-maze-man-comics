/*
 * CASE 3 — THE LONG RAIN
 * Five suspects · seven clues · six lies · two chained testimonies.
 * The hardest case in the rotation. Every suspect lies, only one lie is about
 * the actual crime, and the culprit's "theft" turns out to be the only honest
 * act of the night — so the WHY axis is where most players will come unstuck.
 */

export const LONG_RAIN = {
  id: 'long-rain',
  e: '🌧',
  tier: 3,
  title: { en: 'The Long Rain', ar: 'المطر الطويل' },
  setting: { en: 'The Halls of the Almanac · Flood Night', ar: 'قاعات التقويم · ليلة الفيضان' },
  stamp: { en: 'CASE FILE № 003', ar: 'ملف القضيّة رقم ٠٠٣' },
  time: { en: 'GALLERY SEVEN · 3:20 AM', ar: 'القاعة السابعة · ٣:٢٠ فجرًا' },
  victim: {
    line: { en: 'THE KAWKAB METEORITE — SUBSTITUTED', ar: 'نيزك كوكب — مُستبدَل' },
    sub: {
      en: 'discovered 3:20 AM · the case was never forced',
      ar: 'اكتُشف الأمر ٣:٢٠ فجرًا · لم تُكسر الخزانة قطّ',
    },
  },

  intro: [
    {
      w: 'n',
      t: {
        en: 'It has rained on this city for nine days. On the ninth night the river came up through the drains and the Halls of the Almanac closed to the public at six.',
        ar: 'أمطرت هذه المدينة تسعة أيّام. وفي الليلة التاسعة صعد النهر من المجارير، فأغلقت قاعات التقويم أبوابها أمام الناس عند السادسة.',
      },
    },
    {
      w: 'n',
      t: {
        en: 'Five people stayed behind to move four thousand years of objects up one floor. At 3:20 AM one of those objects was found to be the wrong object.',
        ar: 'بقي خمسة أشخاص لنقل أربعة آلاف سنة من المقتنيات طابقًا واحدًا إلى أعلى. وعند ٣:٢٠ فجرًا تبيّن أنّ أحد تلك المقتنيات ليس هو المقتنى الصحيح.',
      },
    },
    {
      w: 'kawkab',
      t: {
        en: 'The Kawkab meteorite. Nine hundred grams of iron that fell on this valley before anyone here had a name for the sky. What is sitting in that case tonight is not it.',
        ar: 'نيزك كوكب. تسعمئة غرام من الحديد سقطت على هذا الوادي قبل أن يكون لأحد هنا اسم للسماء. وما يجلس في تلك الخزانة الليلة ليس هو.',
      },
    },
    {
      w: 'kawkab',
      t: {
        en: 'The case was not forced. The alarms did not sound. Nobody left the building. This is not a robbery, it is a substitution — and a substitution takes preparation.',
        ar: 'لم تُكسر الخزانة. ولم تدوِّ أجهزة الإنذار. ولم يغادر أحد المبنى. هذه ليست سرقة، بل استبدال — والاستبدال يحتاج إلى تحضير.',
      },
    },
    {
      w: 'kawkab',
      t: {
        en: 'Five suspects, and every one of them is going to lie to me tonight. Only one of those lies will be about the meteorite. Find it.',
        ar: 'خمسة مشتبه بهم، وكلّ واحد منهم سيكذب عليّ الليلة. وكذبة واحدة فقط منها ستكون عن النيزك. جدها.',
      },
    },
  ],

  hotspots: [
    { id: 'vitrine', e: '🗄', name: { en: 'The display case', ar: 'خزانة العرض' }, pos: { x: 50, y: 34 }, clue: 'seals' },
    { id: 'plinth', e: '⚖️', name: { en: 'The weight plinth', ar: 'قاعدة الوزن' }, pos: { x: 62, y: 46 }, clue: 'weight' },
    { id: 'lab', e: '🩻', name: { en: 'The conservation lab', ar: 'مختبر الصيانة' }, pos: { x: 84, y: 60 }, clue: 'xray' },
    { id: 'bay', e: '🚚', name: { en: 'The loading bay', ar: 'رصيف التحميل' }, pos: { x: 14, y: 76 }, clue: 'van' },
    { id: 'files', e: '📁', name: { en: 'The loan file', ar: 'ملفّ الإعارة' }, pos: { x: 30, y: 58 }, clue: 'loan' },
    { id: 'refusal', e: '✉️', name: { en: 'A returned letter', ar: 'رسالة معادة' }, pos: { x: 74, y: 80 }, clue: 'refusal' },
    { id: 'stairs', e: '👣', name: { en: 'The flooded stairwell', ar: 'بئر الدرج الغارق' }, pos: { x: 22, y: 24 }, clue: 'mud' },

    {
      id: 'whale',
      e: '🐋',
      name: { en: 'The hall whale', ar: 'حوت القاعة' },
      pos: { x: 42, y: 12 },
      quirk: [
        [{ w: 'n', t: { en: 'A ninety-year-old plaster whale hangs over all of this, entirely unbothered by the flood beneath it.', ar: 'حوت جبسيّ عمره تسعون سنة معلّق فوق هذا كلّه، غير آبه البتّة بالفيضان تحته.' } }],
        [{ w: 'kawkab', t: { en: 'The whale has seen four floods. The whale is not talking.', ar: 'رأى الحوت أربعة فيضانات. والحوت لا يتكلّم.' } }],
        [{ w: 'kawkab', t: { en: 'I have now questioned the whale three times. It is, at least, consistent.', ar: 'استجوبت الحوت ثلاث مرّات حتّى الآن. وهو، على الأقلّ، ثابت في أقواله.' } }],
      ],
    },
    {
      id: 'clockcase',
      e: '⏱',
      name: { en: 'The water clock', ar: 'الساعة المائيّة' },
      pos: { x: 66, y: 18 },
      quirk: [
        [{ w: 'n', t: { en: 'A two-thousand-year-old water clock, running perfectly. Tonight, of all nights, it has plenty to work with.', ar: 'ساعة مائيّة عمرها ألفا سنة، تعمل بدقّة. والليلة، من بين كلّ الليالي، لديها ما يكفيها من الماء.' } }],
        [{ w: 'kawkab', t: { en: 'The oldest working object in the building is the only one having a good night.', ar: 'أقدم غرض عامل في المبنى هو الوحيد الذي يقضي ليلة طيّبة.' } }],
      ],
    },
  ],

  clues: {
    seals: {
      e: '🗄',
      name: { en: 'The intact seals', ar: 'الأختام السليمة' },
      desc: { en: 'Opened with a key, closed properly, re-sealed. No force anywhere on the case.', ar: 'فُتحت بمفتاح، وأُغلقت كما ينبغي، وأُعيد ختمها. لا أثر لعنف على الخزانة إطلاقًا.' },
      narr: {
        en: 'The case was opened with its own key, closed correctly, and re-sealed with the museum’s own wax. Whoever did this had the key, knew the sequence, and — this is the part that interests me — took the time to leave it tidy. Thieves hurry. This person cared how the case looked afterwards.',
        ar: 'فُتحت الخزانة بمفتاحها، وأُغلقت بشكل صحيح، وأُعيد ختمها بشمع المتحف نفسه. من فعل هذا كان يملك المفتاح، ويعرف التسلسل، و — وهذا ما يثير اهتمامي — أخذ وقته ليتركها مرتّبة. اللصوص يتعجّلون. أمّا هذا الشخص فقد اهتمّ بشكل الخزانة بعد ذلك.',
      },
    },
    weight: {
      e: '⚖️',
      name: { en: 'The plinth log', ar: 'سجلّ القاعدة' },
      desc: { en: 'At 2:14 AM the object on the plinth became forty grams HEAVIER.', ar: 'عند ٢:١٤ فجرًا صار الغرض على القاعدة أثقل بأربعين غرامًا.' },
      narr: {
        en: 'The plinth weighs whatever stands on it, once a second, forever. At 2:14 AM the reading changes — and it goes UP. Forty grams heavier. Nobody in the history of theft has ever left behind something heavier than what they took. Unless what they left was made recently, and made slightly wrong.',
        ar: 'تزن القاعدة ما يقف عليها، مرّة كلّ ثانية، إلى الأبد. عند ٢:١٤ فجرًا تتغيّر القراءة — وترتفع. أثقل بأربعين غرامًا. لم يترك لصّ في تاريخ السرقة شيئًا أثقل ممّا أخذ. إلّا إذا كان ما تركه قد صُنع حديثًا، وصُنع خاطئًا قليلًا.',
      },
    },
    xray: {
      e: '🩻',
      name: { en: 'The conservation X-ray', ar: 'أشعّة الصيانة' },
      desc: { en: 'A plate from March. The meteorite ON DISPLAY has a casting bubble. Iron from space does not.', ar: 'لوحة من آذار. النيزك المعروض فيه فقاعة سبك. وحديد الفضاء لا يحتوي على ذلك.' },
      narr: {
        en: 'A radiograph in the lab drawer, dated March, of the object that has been on display for eleven years. Inside it, unmistakable, a spherical void — a casting bubble. Meteoric iron crystallises over four million years and does not contain bubbles. Somebody photographed proof of a forgery in March, and the museum has been showing the forgery ever since.',
        ar: 'صورة إشعاعيّة في درج المختبر، مؤرّخة في آذار، للغرض المعروض منذ إحدى عشرة سنة. في داخله، بلا لبس، فراغ كرويّ — فقاعة سبك. حديد النيازك يتبلور عبر أربعة ملايين سنة ولا يحتوي على فقاعات. صوّر أحدهم دليلًا على تزوير في آذار، وظلّ المتحف يعرض المزوَّر منذ ذلك الحين.',
      },
    },
    van: {
      e: '🚚',
      name: { en: 'The van logbook', ar: 'سجلّ الشاحنة' },
      desc: { en: 'One unscheduled trip: out 1:50 AM, back 2:35 AM. Destination line left blank.', ar: 'رحلة واحدة غير مجدولة: الخروج ١:٥٠ فجرًا، والعودة ٢:٣٥ فجرًا. وخانة الوجهة تُركت فارغة.' },
      narr: {
        en: 'Every journey this van makes is written down, with a destination, in Fadi’s square capitals. Tonight there is one entry with the destination line left empty: out at 1:50, back at 2:35. Forty-five minutes, in a flood, on the night the river closed half the roads in this city.',
        ar: 'كلّ رحلة تقوم بها هذه الشاحنة مدوَّنة، مع وجهتها، بحروف فادي المربّعة. الليلة هناك تسجيل واحد تُركت خانة وجهته فارغة: الخروج ١:٥٠، والعودة ٢:٣٥. خمس وأربعون دقيقة، في فيضان، ليلة أغلق النهر نصف طرق هذه المدينة.',
      },
    },
    loan: {
      e: '📁',
      name: { en: 'The loan agreement', ar: 'اتّفاقيّة الإعارة' },
      desc: { en: 'The meteorite returns to the donor’s family in three days — permanently, unexamined.', ar: 'يعود النيزك إلى عائلة المتبرّع خلال ثلاثة أيّام — نهائيًّا، ودون فحص.' },
      narr: {
        en: 'The loan ends on Friday. In three days the Kawkab meteorite goes back into a private family collection, permanently, and the agreement is explicit: no further testing, no further imaging, no conditions. In three days, whatever is in that case stops being a question anybody is allowed to ask.',
        ar: 'تنتهي الإعارة يوم الجمعة. خلال ثلاثة أيّام يعود نيزك كوكب إلى مجموعة عائليّة خاصّة، نهائيًّا، والاتّفاقيّة صريحة: لا فحوص إضافيّة، ولا تصوير إضافيّ، ولا شروط. خلال ثلاثة أيّام يكفّ ما في تلك الخزانة عن أن يكون سؤالًا يحقّ لأحد طرحه.',
      },
    },
    refusal: {
      e: '✉️',
      name: { en: 'The refused request', ar: 'الطلب المرفوض' },
      desc: { en: 'A request for a second test — refused four times since March, on the foundation’s paper.', ar: 'طلب لفحص ثانٍ — رُفض أربع مرّات منذ آذار، على ورق المؤسّسة.' },
      narr: {
        en: 'Four letters, four refusals, all on the same heavy foundation letterhead, all signed by the same hand. Somebody inside this museum asked for a second test on that meteorite in March, and again in April, and in June, and in September. Every request came back refused within a week. Somebody else did not want that object looked at twice.',
        ar: 'أربع رسائل، وأربعة رفوض، كلّها على ترويسة المؤسّسة الثقيلة نفسها، وكلّها بتوقيع اليد نفسها. طلب أحد من داخل هذا المتحف فحصًا ثانيًا لذلك النيزك في آذار، ثمّ في نيسان، ثمّ في حزيران، ثمّ في أيلول. وعاد كلّ طلب مرفوضًا خلال أسبوع. شخص آخر لم يرد أن يُنظر إلى ذلك الغرض مرّتين.',
      },
    },
    mud: {
      e: '👣',
      name: { en: 'River mud on the stairs', ar: 'طين النهر على الدرج' },
      desc: { en: 'One set of prints goes DOWN into the flooded basement and comes back up. Boots, size eleven.', ar: 'مجموعة آثار واحدة تنزل إلى القبو الغارق ثمّ تعود. حذاء عمل، قياس ٤٥.' },
      narr: {
        en: 'The basement stair is under a metre of river. One set of bootprints goes down into it and comes back up, caked to the ankle. Everybody else in this building spent tonight carrying objects UP. One person went down into the water, in the dark, and came back carrying something worth getting soaked for.',
        ar: 'درج القبو تحت متر من ماء النهر. مجموعة واحدة من آثار الحذاء تنزل إليه ثمّ تعود، مكسوّة بالطين حتّى الكاحل. أمضى كلّ من في هذا المبنى ليلته يحمل المقتنيات إلى أعلى. وشخص واحد نزل إلى الماء، في العتمة، وعاد يحمل شيئًا يستحقّ الابتلال من أجله.',
      },
    },
  },

  testimony: {
    t_lola: {
      name: { en: 'Lola’s radiograph', ar: 'صورة لولا الإشعاعيّة' },
      desc: { en: 'She took the March X-ray, saw the casting bubble, and reported it four times.', ar: 'هي من التقطت أشعّة آذار، ورأت فقاعة السبك، وأبلغت عنها أربع مرّات.' },
    },
    t_fadi: {
      name: { en: 'Fadi’s empty run', ar: 'رحلة فادي الفارغة' },
      desc: { en: 'He drove to a storage unit and back at 1:50 AM, carrying nothing out and one box in.', ar: 'قاد إلى مستودع وعاد عند ١:٥٠ فجرًا، لم يخرج شيئًا وأدخل صندوقًا واحدًا.' },
    },
    t_star: {
      name: { en: 'Star’s signature', ar: 'توقيع ستار' },
      desc: { en: 'She signed every refusal — without ever reading what was being asked.', ar: 'وقّعت كلّ رفض — دون أن تقرأ قطّ ما كان يُطلب.' },
    },
    t_mimi: {
      name: { en: 'Mimi’s key list', ar: 'قائمة مفاتيح ميمي' },
      desc: { en: 'Only two keys open gallery seven tonight: hers, and the night curator’s.', ar: 'مفتاحان فقط يفتحان القاعة السابعة الليلة: مفتاحها، ومفتاح أمين الليل.' },
    },
  },

  suspects: [
    {
      id: 'ramy',
      name: { en: 'Ramy', ar: 'رامي' },
      role: { en: 'THE NIGHT CURATOR', ar: 'أمين الليل' },
      accent: '#8a8fb0',
      desc: {
        en: 'Has walked these halls after dark for nineteen years. Knows every object by its accession number and none of the staff by their first names.',
        ar: 'يجول هذه القاعات بعد حلول الظلام منذ تسع عشرة سنة. يعرف كلّ غرض برقم اقتنائه، ولا يعرف أحدًا من الموظّفين باسمه الأوّل.',
      },
      qs: [
        {
          q: { en: 'Your night. Briefly.', ar: 'ليلتك. باختصار.' },
          a: {
            en: 'Nine days of rain, one flood, four thousand objects, one floor up. I have not sat down since Tuesday.',
            ar: 'تسعة أيّام مطر، وفيضان واحد، وأربعة آلاف غرض، وطابق واحد إلى أعلى. لم أجلس منذ الثلاثاء.',
          },
        },
        {
          q: { en: 'You have a key to gallery seven.', ar: 'لديك مفتاح القاعة السابعة.' },
          a: {
            en: 'I have a key to everything. That is the job. It has been the job for nineteen years and nobody has ever asked me about it before tonight.',
            ar: 'لديّ مفتاح لكلّ شيء. هذه هي الوظيفة. كانت الوظيفة تسع عشرة سنة، ولم يسألني أحد عنها قبل الليلة.',
          },
        },
        {
          q: { en: 'What do you think happened here?', ar: 'ما الذي تظنّ أنّه حدث هنا؟' },
          a: {
            en: 'I think you should ask what is in the case rather than what is missing from it. Those are different questions and only one of them is interesting.',
            ar: 'أظنّ عليك أن تسأل ما الموجود في الخزانة لا ما المفقود منها. سؤالان مختلفان، وواحد منهما فقط مثير للاهتمام.',
          },
        },
      ],
      lies: [
        {
          claim: { en: '“I was on the upper floors all night. I never went below ground.”', ar: '«كنت في الطوابق العليا طوال الليل. ولم أنزل تحت الأرض قطّ.»' },
          needs: 'mud',
          react: 'concede',
          hint: { en: 'One person went DOWN into the flood tonight. The stairs kept the footprints.', ar: 'شخص واحد نزل إلى الفيضان الليلة. والدرج احتفظ بآثار الأقدام.' },
          seq: [
            {
              w: 'kawkab',
              t: {
                en: 'One set of bootprints goes down into a metre of river and comes back up. Everyone in this building spent tonight carrying things upward. You went down.',
                ar: 'مجموعة واحدة من آثار الحذاء تنزل إلى متر من ماء النهر ثمّ تعود. أمضى كلّ من في هذا المبنى ليلته يحمل الأشياء إلى أعلى. وأنت نزلت.',
              },
            },
            {
              w: 'ramy',
              t: {
                en: '…The basement strongroom. Yes. I went down twice, in the dark, in water to my waist, to get something out before the river took it.',
                ar: '…غرفة الخزائن في القبو. نعم. نزلت مرّتين، في العتمة، والماء إلى خصري، لأخرج شيئًا قبل أن يأخذه النهر.',
              },
            },
            {
              w: 'kawkab',
              t: { en: 'Get what out?', ar: 'لتُخرج ماذا؟' },
            },
            {
              w: 'ramy',
              t: {
                en: 'That is the question I have been waiting nineteen years for somebody to ask properly. And I am not answering it until you have read Lola’s file.',
                ar: 'هذا هو السؤال الذي انتظرت تسع عشرة سنة أن يطرحه أحد كما ينبغي. ولن أجيب عنه حتّى تقرأ ملفّ لولا.',
              },
            },
            {
              w: 'n',
              t: {
                en: 'He is not defending himself. He is setting me homework.',
                ar: 'إنّه لا يدافع عن نفسه. إنّه يكلّفني واجبًا منزليًّا.',
              },
            },
          ],
          unlocks: null,
        },
        {
          claim: { en: '“I did not open that display case tonight.”', ar: '«لم أفتح خزانة العرض تلك الليلة.»' },
          needs: 't_mimi',
          react: 'concede',
          hint: { en: 'Two keys in this building open gallery seven. Whose list told you that?', ar: 'مفتاحان في هذا المبنى يفتحان القاعة السابعة. قائمة من أخبرتك بذلك؟' },
          seq: [
            {
              w: 'kawkab',
              t: {
                en: 'Two keys open gallery seven tonight. Mimi’s never left her belt and she was in the control room on camera from one until four. That leaves yours — and a case opened, closed and re-sealed by somebody who cared how it looked afterwards.',
                ar: 'مفتاحان يفتحان القاعة السابعة الليلة. مفتاح ميمي لم يفارق حزامها وكانت في غرفة التحكّم أمام الكاميرا من الواحدة حتّى الرابعة. يبقى مفتاحك — وخزانة فُتحت وأُغلقت وأُعيد ختمها على يد من اهتمّ بشكلها بعد ذلك.',
              },
            },
            {
              w: 'ramy',
              t: {
                en: '…At 2:14 in the morning I unlocked that case, took out the object the public has been looking at for eleven years, and put the real one back.',
                ar: '…عند الثانية وأربع عشرة دقيقة فجرًا فتحت تلك الخزانة، وأخرجت الغرض الذي ينظر إليه الناس منذ إحدى عشرة سنة، وأعدت الحقيقيّ إلى مكانه.',
              },
            },
            {
              w: 'kawkab',
              t: {
                en: 'Say that again.',
                ar: 'قل ذلك مرّة أخرى.',
              },
            },
            {
              w: 'ramy',
              t: {
                en: 'The forgery has been on display since 2015. The real meteorite has been in the basement strongroom, uncatalogued, since the week the loan was signed. Tonight the river was coming for it and on Friday the family takes the case away for good. It was tonight or it was never.',
                ar: 'المزوَّر معروض منذ ٢٠١٥. والنيزك الحقيقيّ في غرفة خزائن القبو، غير مفهرس، منذ أسبوع توقيع الإعارة. الليلة كان النهر قادمًا إليه، ويوم الجمعة تأخذ العائلة الخزانة إلى الأبد. كانت الليلة أو لا شيء.',
              },
            },
            {
              w: 'n',
              t: {
                en: 'Forty grams heavier at 2:14 AM. Of course it was. The real one always was.',
                ar: 'أثقل بأربعين غرامًا عند ٢:١٤ فجرًا. بالطبع كان كذلك. الحقيقيّ كان دائمًا كذلك.',
              },
            },
          ],
          unlocks: null,
        },
      ],
      wrong: {
        van: { en: 'I do not drive. I have never driven. Nineteen years and I take the night bus.', ar: 'أنا لا أقود. لم أقد يومًا. تسع عشرة سنة وأنا أستقلّ حافلة الليل.' },
        refusal: { en: 'Those are Lola’s letters. I told her four times they would refuse. I was right four times.', ar: 'تلك رسائل لولا. قلت لها أربع مرّات إنّهم سيرفضون. وكنت محقًّا أربع مرّات.' },
        def: { en: 'That is not the question, Detective. Ask what is IN the case.', ar: 'ليس هذا هو السؤال أيّها المحقّق. اسأل ما الموجود في الخزانة.' },
      },
    },

    {
      id: 'lola',
      name: { en: 'Lola', ar: 'لولا' },
      role: { en: 'THE CONSERVATOR', ar: 'أخصائيّة الصيانة' },
      accent: '#e8ac4e',
      desc: {
        en: 'Runs the imaging lab. Has been quietly certain about something for eleven months and quietly ignored for eleven months.',
        ar: 'تدير مختبر التصوير. ظلّت متيقّنة من شيء بهدوء أحد عشر شهرًا، وظلّت متجاهَلة بهدوء أحد عشر شهرًا.',
      },
      qs: [
        {
          q: { en: 'What is your lab for?', ar: 'ما وظيفة مختبرك؟' },
          a: {
            en: 'Looking inside things without opening them. It is the best job in this building and nobody reads what comes out of it.',
            ar: 'النظر داخل الأشياء دون فتحها. إنّها أفضل وظيفة في هذا المبنى ولا أحد يقرأ ما يخرج منها.',
          },
        },
        {
          q: { en: 'Did you image the meteorite?', ar: 'هل صوّرتِ النيزك؟' },
          a: {
            en: 'In March. Routine condition survey before the loan renewal. Nothing dramatic.',
            ar: 'في آذار. مسح حالة روتينيّ قبل تجديد الإعارة. لا شيء مثير.',
          },
        },
      ],
      lies: [
        {
          claim: { en: '“Nothing unusual came out of that survey.”', ar: '«لم يخرج من ذلك المسح شيء غير اعتياديّ.»' },
          needs: 'xray',
          react: 'rattled',
          hint: { en: 'The March plate is still in the lab drawer. Look at what is inside the iron.', ar: 'لوحة آذار ما زالت في درج المختبر. انظر إلى ما في داخل الحديد.' },
          seq: [
            {
              w: 'kawkab',
              t: {
                en: 'There is a spherical void in the middle of that object. A casting bubble. Meteoric iron crystallises over four million years — it does not contain bubbles, and you knew that the moment the plate came out.',
                ar: 'في وسط ذلك الغرض فراغ كرويّ. فقاعة سبك. حديد النيازك يتبلور عبر أربعة ملايين سنة — ولا يحتوي على فقاعات، وأنتِ عرفتِ ذلك لحظة خروج اللوحة.',
              },
            },
            {
              w: 'lola',
              t: {
                en: '…I have known since the fourteenth of March. It is a cast. Somebody poured that object in a workshop. I wrote it up the same afternoon.',
                ar: '…أعرف منذ الرابع عشر من آذار. إنّه مصبوب. صبّ أحدهم ذلك الغرض في ورشة. وكتبت تقريري في العصر نفسه.',
              },
            },
            {
              w: 'kawkab',
              t: { en: 'And then?', ar: 'ثمّ ماذا؟' },
            },
            {
              w: 'lola',
              t: {
                en: 'And then I requested a second test. Refused. Requested again in April. Refused. June. September. Four times, Detective, four refusals, all inside a week, all on foundation letterhead. After the fourth I stopped writing things down where anyone could find them.',
                ar: 'ثمّ طلبت فحصًا ثانيًا. رُفض. وطلبت مجدّدًا في نيسان. رُفض. وفي حزيران. وفي أيلول. أربع مرّات أيّها المحقّق، وأربعة رفوض، كلّها خلال أسبوع، وكلّها على ترويسة المؤسّسة. وبعد الرابع كففت عن تدوين الأشياء حيث يمكن لأحد أن يجدها.',
              },
            },
            {
              w: 'n',
              t: {
                en: 'Eleven months of being right and filed away. The forgery is real — the question now is who has been protecting it.',
                ar: 'أحد عشر شهرًا من أن تكوني محقّة ومحفوظة في درج. التزوير حقيقيّ — والسؤال الآن من الذي كان يحميه.',
              },
            },
          ],
          unlocks: 't_lola',
        },
      ],
      wrong: {
        weight: { en: 'A plinth reading. I am a conservator, not a scale. Show me something with a picture in it.', ar: 'قراءة قاعدة. أنا أخصّائيّة صيانة، لا ميزان. أرِني شيئًا فيه صورة.' },
        mud: { en: 'I wear lab shoes. I have not been below ground since the induction tour.', ar: 'أرتدي حذاء مختبر. لم أنزل تحت الأرض منذ جولة التعريف.' },
        def: { en: 'That does not get us anywhere. Ask me about the imaging. Please ask me about the imaging.', ar: 'هذا لا يوصلنا إلى شيء. اسألني عن التصوير. أرجوك اسألني عن التصوير.' },
      },
    },

    {
      id: 'star',
      name: { en: 'Star', ar: 'ستار' },
      role: { en: 'THE PATRON', ar: 'الراعية' },
      accent: '#f0c674',
      desc: {
        en: 'Chairs the foundation that owns the loan and half the building’s roof. Came tonight to be photographed helping, and stayed to actually help.',
        ar: 'ترأس المؤسّسة التي تملك الإعارة ونصف سقف المبنى. جاءت الليلة لتُصوَّر وهي تساعد، فبقيت لتساعد فعلًا.',
      },
      qs: [
        {
          q: { en: 'Why are you here at three in the morning?', ar: 'لماذا أنتِ هنا في الثالثة فجرًا؟' },
          a: {
            en: 'Because a river is eating my foundation’s collection and I own eleven pairs of boots. Somebody has to carry the small things.',
            ar: 'لأنّ نهرًا يلتهم مجموعة مؤسّستي ولديّ إحدى عشرة زوجًا من الأحذية. لا بدّ لأحد أن يحمل الأشياء الصغيرة.',
          },
        },
        {
          q: { en: 'The meteorite is your family’s loan.', ar: 'النيزك إعارة من عائلتك.' },
          a: {
            en: 'My grandfather’s. It has been the single most photographed object in this museum for eleven years and it goes home on Friday, and I have signed the paperwork three times without reading it.',
            ar: 'من جدّي. كان أكثر غرض يُصوَّر في هذا المتحف طوال إحدى عشرة سنة، ويعود إلى البيت يوم الجمعة، وقد وقّعت الأوراق ثلاث مرّات دون أن أقرأها.',
          },
        },
      ],
      lies: [
        {
          claim: { en: '“Nobody has ever raised a single concern about that object with me.”', ar: '«لم يثر أحد معي أيّ قلق بشأن ذلك الغرض قطّ.»' },
          needs: 'refusal',
          react: 'deny',
          hint: { en: 'Four refusals, four signatures. Look at whose letterhead they are on.', ar: 'أربعة رفوض، وأربعة توقيعات. انظر على ترويسة من هي.' },
          seq: [
            {
              w: 'kawkab',
              t: {
                en: 'Four requests for a second test. Four refusals, all within a week, all on your foundation’s letterhead, all signed in your hand.',
                ar: 'أربعة طلبات لفحص ثانٍ. وأربعة رفوض، كلّها خلال أسبوع، كلّها على ترويسة مؤسّستك، وكلّها بتوقيع يدك.',
              },
            },
            {
              w: 'star',
              t: {
                en: '…That is my signature. That is absolutely my signature. I sign forty of those a week and I read approximately none of them.',
                ar: '…هذا توقيعي. هذا توقيعي بلا شكّ. أوقّع أربعين من هذه في الأسبوع ولا أقرأ منها شيئًا تقريبًا.',
              },
            },
            {
              w: 'kawkab',
              t: {
                en: 'Four times, in eleven months, a specialist in this building asked to look inside your family’s meteorite. And four times your office told her no.',
                ar: 'أربع مرّات، في أحد عشر شهرًا، طلبت متخصّصة في هذا المبنى النظر داخل نيزك عائلتك. وأربع مرّات قال لها مكتبك لا.',
              },
            },
            {
              w: 'star',
              t: {
                en: '…Then somebody in my office knew what she was asking and made very sure it never reached my desk. Detective, I want to be extremely clear: I would rather find out that thing is a fake than never be allowed to ask.',
                ar: '…إذن عرف أحد في مكتبي ما كانت تطلبه وحرص كلّ الحرص على ألّا يصل إلى مكتبي. أيّها المحقّق، أريد أن أكون واضحة تمامًا: أفضّل أن أعرف أنّ ذلك الشيء مزيّف على ألّا يُسمح لي بالسؤال أبدًا.',
              },
            },
            {
              w: 'n',
              t: {
                en: 'Careless, not crooked. Her name was on the wall between the truth and the room — but somebody else built the wall.',
                ar: 'مهملة لا فاسدة. كان اسمها على الجدار بين الحقيقة والغرفة — لكنّ شخصًا آخر هو من بنى الجدار.',
              },
            },
          ],
          unlocks: 't_star',
        },
      ],
      wrong: {
        seals: { en: 'I do not have a key to anything in this building except the donors’ lavatory.', ar: 'لا أملك مفتاحًا لأيّ شيء في هذا المبنى إلّا دورة مياه المتبرّعين.' },
        xray: { en: 'I cannot read an X-ray, darling. I can read a guest list.', ar: 'لا أستطيع قراءة أشعّة يا عزيزي. أستطيع قراءة قائمة ضيوف.' },
        def: { en: 'No. And do keep going — I am finding this extremely educational.', ar: 'لا. وواصل من فضلك — أجد هذا مفيدًا للغاية.' },
      },
    },

    {
      id: 'fadi',
      name: { en: 'Fadi', ar: 'فادي' },
      role: { en: 'THE DRIVER', ar: 'السائق' },
      accent: '#5a7fae',
      desc: {
        en: 'Moves the collection between buildings and keeps the only records anybody in this museum can actually read.',
        ar: 'ينقل المجموعة بين المباني ويحتفظ بالسجلّات الوحيدة التي يستطيع أحد في هذا المتحف قراءتها فعلًا.',
      },
      qs: [
        {
          q: { en: 'You wrote down every trip tonight?', ar: 'دوّنت كلّ رحلة الليلة؟' },
          a: {
            en: 'Every trip, every night, twelve years. Destination, time out, time back. It is the only tidy book in this whole institution.',
            ar: 'كلّ رحلة، كلّ ليلة، منذ اثنتي عشرة سنة. الوجهة، ووقت الخروج، ووقت العودة. إنّه الدفتر المرتّب الوحيد في هذه المؤسّسة كلّها.',
          },
        },
        {
          q: { en: 'Roads are shut. Why drive at all tonight?', ar: 'الطرق مغلقة. لماذا القيادة أصلًا الليلة؟' },
          a: {
            en: 'Because when a curator asks you to fetch something at two in the morning in a flood, you either trust him or you find another job.',
            ar: 'لأنّه حين يطلب منك أمين متحف أن تحضر شيئًا في الثانية فجرًا وسط فيضان، فإمّا أن تثق به أو تبحث عن عمل آخر.',
          },
        },
      ],
      lies: [
        {
          claim: { en: '“Every journey in that book has a destination written next to it.”', ar: '«كلّ رحلة في ذلك الدفتر مكتوب بجانبها وجهتها.»' },
          needs: 'van',
          react: 'concede',
          hint: { en: 'One line in his tidy book is not tidy. Check the destination column.', ar: 'سطر واحد في دفتره المرتّب ليس مرتّبًا. تفقّد خانة الوجهة.' },
          seq: [
            {
              w: 'kawkab',
              t: {
                en: 'One entry tonight has no destination. Out at 1:50, back at 2:35, and a blank where twelve years of habit should be.',
                ar: 'تسجيل واحد الليلة بلا وجهة. الخروج ١:٥٠، والعودة ٢:٣٥، وفراغ حيث ينبغي أن تكون اثنتا عشرة سنة من العادة.',
              },
            },
            {
              w: 'fadi',
              t: {
                en: '…A storage unit on the east road. Ramy asked me at half past one and told me not to write where. I drove there empty and came back with one box. I never opened it and I never asked.',
                ar: '…مستودع على الطريق الشرقيّ. طلب منّي رامي عند الواحدة والنصف وقال لي ألّا أكتب أين. ذهبت فارغًا وعدت بصندوق واحد. لم أفتحه ولم أسأل.',
              },
            },
            {
              w: 'kawkab',
              t: { en: 'You did not ask.', ar: 'لم تسأل.' },
            },
            {
              w: 'fadi',
              t: {
                en: 'Nineteen years that man has been the last one out of this building every single night. If he says drive, I drive. Write that down as stupid if you like. I will still be right about him.',
                ar: 'تسع عشرة سنة وذلك الرجل آخر من يغادر هذا المبنى كلّ ليلة. إن قال قُد، أقود. اكتب أنّ ذلك غباء إن شئت. سأظلّ محقًّا بشأنه.',
              },
            },
            {
              w: 'n',
              t: {
                en: 'A box collected at two in the morning, and forty grams appearing on a plinth at 2:14. The timing does the arithmetic for me.',
                ar: 'صندوق جُلب في الثانية فجرًا، وأربعون غرامًا تظهر على قاعدة عند ٢:١٤. التوقيت يقوم بالحساب نيابةً عنّي.',
              },
            },
          ],
          unlocks: 't_fadi',
        },
      ],
      wrong: {
        seals: { en: 'I do not go in the galleries. I go from the bay to the lift and back out again.', ar: 'لا أدخل القاعات. أذهب من الرصيف إلى المصعد ثمّ أخرج.' },
        loan: { en: 'Paperwork. I move boxes, I do not sign for what is in them.', ar: 'أوراق. أنا أنقل صناديق، ولا أوقّع على ما فيها.' },
        def: { en: 'Not mine. Try the book — the book never lies, even when I do.', ar: 'ليس لي. جرّب الدفتر — الدفتر لا يكذب أبدًا، حتّى حين أكذب أنا.' },
      },
    },

    {
      id: 'mimi',
      name: { en: 'Mimi', ar: 'ميمي' },
      role: { en: 'THE SECURITY CHIEF', ar: 'رئيسة الأمن' },
      accent: '#c0455a',
      desc: {
        en: 'Watches ninety-one cameras and trusts none of them. Was on camera herself, in the control room, from one until four.',
        ar: 'تراقب إحدى وتسعين كاميرا ولا تثق بأيّ منها. وكانت هي نفسها أمام الكاميرا، في غرفة التحكّم، من الواحدة حتّى الرابعة.',
      },
      qs: [
        {
          q: { en: 'The alarms did not sound.', ar: 'لم تدوِّ أجهزة الإنذار.' },
          a: {
            en: 'Because the case was opened correctly. My alarms are excellent at strangers and useless against staff, which is the oldest problem in this profession.',
            ar: 'لأنّ الخزانة فُتحت بشكل صحيح. أجهزتي ممتازة مع الغرباء وعديمة الجدوى أمام الموظّفين، وهذه أقدم مشكلة في هذه المهنة.',
          },
        },
        {
          q: { en: 'Who can open gallery seven?', ar: 'من يستطيع فتح القاعة السابعة؟' },
          a: {
            en: 'That is the question, isn’t it. And I notice you have asked it eleven minutes after you should have.',
            ar: 'هذا هو السؤال، أليس كذلك. وألاحظ أنّك طرحته بعد إحدى عشرة دقيقة من الوقت الذي كان ينبغي أن تطرحه فيه.',
          },
        },
      ],
      lies: [
        {
          claim: { en: '“Half a dozen people could have opened that case tonight.”', ar: '«ستّة أشخاص كان بإمكانهم فتح تلك الخزانة الليلة.»' },
          needs: 'seals',
          react: 'deny',
          hint: { en: 'The case was opened with its own key and re-sealed. Ask her how many keys that takes.', ar: 'فُتحت الخزانة بمفتاحها وأُعيد ختمها. اسألها كم مفتاحًا يتطلّب ذلك.' },
          seq: [
            {
              w: 'kawkab',
              t: {
                en: 'That case was opened with its own key, closed in sequence and re-sealed with museum wax. That is not half a dozen people. How many keys, Mimi?',
                ar: 'فُتحت تلك الخزانة بمفتاحها، وأُغلقت بالتسلسل، وأُعيد ختمها بشمع المتحف. هذا ليس ستّة أشخاص. كم مفتاحًا يا ميمي؟',
              },
            },
            {
              w: 'mimi',
              t: {
                en: '…Two. Mine, which has not left my belt, and the night curator’s. I said six because the moment I say two, you stop investigating and start arresting.',
                ar: '…اثنان. مفتاحي، الذي لم يفارق حزامي، ومفتاح أمين الليل. قلت ستّة لأنّني ما إن أقول اثنين حتّى تكفّ عن التحقيق وتبدأ بالاعتقال.',
              },
            },
            {
              w: 'kawkab',
              t: {
                en: 'You are protecting him.',
                ar: 'أنتِ تحمينه.',
              },
            },
            {
              w: 'mimi',
              t: {
                en: 'I am protecting a man who has locked this building every night for nineteen years and has never once taken so much as a pencil. Whatever he did at two o’clock this morning, he did it for a reason, and I would like that reason on the record before the handcuffs are.',
                ar: 'أحمي رجلًا أقفل هذا المبنى كلّ ليلة تسع عشرة سنة ولم يأخذ يومًا حتّى قلم رصاص. مهما فعل في الثانية من صباح اليوم، فقد فعله لسبب، وأودّ أن يُسجَّل ذلك السبب قبل أن تُسجَّل الأصفاد.',
              },
            },
            {
              w: 'n',
              t: {
                en: 'Two keys. One belt that never moved. The circle just closed, and everybody in it is lying to protect the same man.',
                ar: 'مفتاحان. وحزام واحد لم يتحرّك. أُغلقت الدائرة للتوّ، وكلّ من فيها يكذب لحماية الرجل نفسه.',
              },
            },
          ],
          unlocks: 't_mimi',
        },
      ],
      wrong: {
        weight: { en: 'Forty grams. Marvellous. Which of my ninety-one cameras do you suppose weighs things?', ar: 'أربعون غرامًا. رائع. أيّ من كاميراتي الإحدى والتسعين تظنّها تزن الأشياء؟' },
        van: { en: 'The bay is Fadi’s and the book is Fadi’s. Take it up with Fadi.', ar: 'الرصيف لفادي والدفتر لفادي. ناقش الأمر مع فادي.' },
        def: { en: 'No. And you are running out of night, Detective.', ar: 'لا. وليلك ينفد أيّها المحقّق.' },
      },
    },
  ],

  board: {
    how: [
      { v: 'swap', l: { en: 'The display piece was swapped for the real one', ar: 'استُبدلت القطعة المعروضة بالحقيقيّة' } },
      { v: 'stolen', l: { en: 'The real one was carried out of the building', ar: 'أُخرج الحقيقيّ من المبنى' } },
      { v: 'flood', l: { en: 'Lost to the flood in the basement', ar: 'ضاع في فيضان القبو' } },
      { v: 'never', l: { en: 'It was never in the museum at all', ar: 'لم يكن في المتحف قطّ' } },
    ],
    why: [
      { v: 'sell', l: { en: 'To sell it before the loan ended', ar: 'لبيعه قبل انتهاء الإعارة' } },
      { v: 'expose', l: { en: 'To put the real one back before it left forever', ar: 'لإعادة الحقيقيّ قبل أن يرحل إلى الأبد' } },
      { v: 'insure', l: { en: 'To claim on the insurance', ar: 'للمطالبة بالتأمين' } },
      { v: 'revenge', l: { en: 'To embarrass the foundation', ar: 'لإحراج المؤسّسة' } },
    ],
  },

  solution: { who: 'ramy', how: 'swap', why: 'expose', proof: 'weight' },

  ending: [
    {
      w: 'n',
      t: {
        en: 'Gallery seven. 5:05 AM. The rain has stopped for the first time in nine days and nobody has noticed yet.',
        ar: 'القاعة السابعة. الخامسة وخمس دقائق فجرًا. توقّف المطر لأوّل مرّة منذ تسعة أيّام ولم يلحظ أحد بعد.',
      },
    },
    {
      w: 'kawkab',
      t: {
        en: 'Nothing was stolen from this museum tonight. Something was returned to it.',
        ar: 'لم يُسرق شيء من هذا المتحف الليلة. بل أُعيد إليه شيء.',
      },
    },
    {
      w: 'kawkab',
      t: {
        en: 'In March, Lola photographed the inside of the Kawkab meteorite and found a casting bubble. She asked four times to test it properly. Four times a letter came back refused — signed by a patron who never read what she was signing.',
        ar: 'في آذار صوّرت لولا داخل نيزك كوكب فوجدت فقاعة سبك. طلبت أربع مرّات فحصه كما ينبغي. وأربع مرّات عادت رسالة بالرفض — موقّعة من راعية لم تقرأ قطّ ما كانت توقّعه.',
      },
    },
    {
      w: 'kawkab',
      t: {
        en: 'The real meteorite had been in the basement strongroom since 2015, uncatalogued, while a cast of it stood in this case being photographed by schoolchildren. On Friday the case goes home to a private collection, unexamined, forever.',
        ar: 'كان النيزك الحقيقيّ في غرفة خزائن القبو منذ ٢٠١٥، غير مفهرس، بينما تقف نسخة مصبوبة منه في هذه الخزانة يصوّرها تلاميذ المدارس. ويوم الجمعة تعود الخزانة إلى مجموعة خاصّة، دون فحص، إلى الأبد.',
      },
    },
    {
      w: 'kawkab',
      t: {
        en: 'So at half past one this morning, with a river in the basement and three days on the clock, the night curator sent for a box, waded into the flood twice, and at 2:14 put the true thing back where it belongs. The plinth felt it. Forty grams.',
        ar: 'ولذلك، عند الواحدة والنصف من صباح اليوم، والنهر في القبو وثلاثة أيّام على الساعة، أرسل أمين الليل في طلب صندوق، وخاض الفيضان مرّتين، وعند ٢:١٤ أعاد الشيء الحقيقيّ إلى مكانه. شعرت القاعدة بذلك. أربعون غرامًا.',
      },
    },
    {
      w: 'ramy',
      t: {
        en: 'Nineteen years I have locked this building. I did not take anything. I put something back. If that is a crime then say the sentence out loud and I will listen to it standing up.',
        ar: 'تسع عشرة سنة وأنا أقفل هذا المبنى. لم آخذ شيئًا. بل أعدت شيئًا. إن كانت تلك جريمة فانطق بالحكم بصوت عالٍ وسأسمعه واقفًا.',
      },
    },
    {
      w: 'star',
      t: {
        en: 'Nobody is saying any sentence. My office refused those letters. My signature was on them and I never read one. That is not his crime, Detective — it is mine, and I intend to be extremely public about it.',
        ar: 'لن ينطق أحد بأيّ حكم. مكتبي هو من رفض تلك الرسائل. وتوقيعي كان عليها ولم أقرأ واحدة منها. هذه ليست جريمته أيّها المحقّق — بل جريمتي، وأنوي أن أكون علنيّة جدًّا بشأنها.',
      },
    },
    {
      w: 'n',
      t: {
        en: 'The foundation withdrew the loan clause on Friday and paid for the second test itself. It confirmed everything Lola wrote in March.',
        ar: 'سحبت المؤسّسة بند الإعارة يوم الجمعة ودفعت ثمن الفحص الثاني بنفسها. وأكّد كلّ ما كتبته لولا في آذار.',
      },
    },
    {
      w: 'n',
      t: {
        en: 'The Kawkab meteorite is in gallery seven tonight, with a new label. The cast is beside it, under a smaller one: WHAT WE SHOWED YOU FOR ELEVEN YEARS, AND HOW WE FOUND OUT.',
        ar: 'نيزك كوكب في القاعة السابعة الليلة، بلافتة جديدة. والنسخة المصبوبة بجانبه، تحت لافتة أصغر: ما عرضناه عليكم إحدى عشرة سنة، وكيف اكتشفنا الحقيقة.',
      },
    },
  ],
};
