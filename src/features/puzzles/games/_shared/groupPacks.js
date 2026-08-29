/*
 * ── TWO LISTS PER PACK, AND THE DIFFERENCE MATTERS ────────────────────────
 *
 * `base`  the clean term on its own: "Lion", "Pizza", "Doctor".
 * `words` base plus acted-out variants: "Tiny Lion", "Giant Pizza".
 *
 * ⚠ IMPOSTER MUST USE `base`, NEVER `words` (2026-08-29). It used `words`, so
 * the secret word could come out as "Broken Lion" or "Giant Elephant" — which
 * is not a thing, and Imposter only works if every player can say a one-word
 * clue ABOUT the secret. A modifier also leaks: the table starts saying "small"
 * and "damaged", which are clues about the variant rather than the word.
 * Charades and Describe It are the opposite case — "Tiny Lion" is a better
 * thing to act out than "Lion" — so they keep `words`.
 *
 * ── THE MODES ARE GRAMMAR, NOT FLAVOUR ────────────────────────────────────
 * The old `abstract` mode was applied to three packs holding three different
 * parts of speech, and produced English that does not parse:
 *
 *   emotions    "Sudden Happy"        (adjective — wants an adverb)
 *   celebrities "Sudden The mentor"   (noun phrase with an article)
 *   hard        "Quiet Entropy"       (mass noun)
 *
 * So a mode now says what KIND of term the pack holds:
 *   thing      countable object/person/place → Tiny / Giant
 *   action     a verb in -ing              → slowly / quickly / secretly
 *   adjective  a describing word           → Very / Slightly / Pretending
 *   none       already a phrase — leave it alone
 *
 * ⚠ `none` is also the right answer for `culture`: "Giant Ramadan" and "Tiny
 * Iftar" are not funny, they are disrespectful, and no modifier set is worth
 * that. When in doubt about a pack, use `none` — a clean word always works.
 */
const makeWords = (terms, mode = 'thing') => {
  const variants = {
    thing: [
      [(e) => e, (e, a) => a],
      [(e) => `Tiny ${e}`, (e, a) => `${a} صغير`],
      [(e) => `Giant ${e}`, (e, a) => `${a} ضخم`],
    ],
    action: [
      [(e) => e, (e, a) => a],
      [(e) => `${e} slowly`, (e, a) => `${a} ببطء`],
      [(e) => `${e} quickly`, (e, a) => `${a} بسرعة`],
      [(e) => `${e} secretly`, (e, a) => `${a} سراً`],
    ],
    adjective: [
      [(e) => e, (e, a) => a],
      [(e) => `Very ${e.toLowerCase()}`, (e, a) => `${a} جداً`],
      [(e) => `Slightly ${e.toLowerCase()}`, (e, a) => `${a} قليلاً`],
      [(e) => `Pretending to be ${e.toLowerCase()}`, (e, a) => `يتظاهر بأنه ${a}`],
    ],
    none: [[(e) => e, (e, a) => a]],
  };
  const v = variants[mode] || variants.thing;
  return terms.flatMap(([en, ar]) => v.map(([fe, fa]) => ({ en: fe(en, ar), ar: fa(en, ar) })));
};

const pack = (id, en, ar, icon, accent, terms, mode = 'thing') => ({
  id,
  en,
  ar,
  icon,
  accent,
  base: terms.map(([e, a]) => ({ en: e, ar: a })),
  words: makeWords(terms, mode),
});

export const PACKS = [
  pack('animals', 'Animals', 'حيوانات', '🐾', '#6a9b5c', [['Lion','أسد'],['Elephant','فيل'],['Dolphin','دلفين'],['Penguin','بطريق'],['Kangaroo','كنغر'],['Owl','بومة'],['Snake','ثعبان'],['Rabbit','أرنب'],['Tiger','نمر'],['Whale','حوت'],['Frog','ضفدع'],['Horse','حصان'],['Monkey','قرد'],['Bear','دب'],['Giraffe','زرافة'],['Zebra','حمار وحشي'],['Crocodile','تمساح'],['Shark','قرش'],['Butterfly','فراشة'],['Eagle','نسر']]),
  pack('food', 'Food', 'طعام', '🍔', '#d97a3a', [['Pizza','بيتزا'],['Sushi','سوشي'],['Burger','برغر'],['Falafel','فلافل'],['Chocolate','شوكولاتة'],['Banana','موز'],['Coffee','قهوة'],['Rice','أرز'],['Cheese','جبن'],['Mango','مانجو'],['Bread','خبز'],['Honey','عسل'],['Ice cream','مثلجات'],['Soup','حساء'],['Apple','تفاح'],['Pasta','معكرونة'],['Chicken','دجاج'],['Salad','سلطة'],['Cake','كعكة'],['Shawarma','شاورما']]),
  pack('places', 'Places', 'أماكن', '🌍', '#3d8fbf', [['Beach','شاطئ'],['Airport','مطار'],['Hospital','مستشفى'],['School','مدرسة'],['Desert','صحراء'],['Mountain','جبل'],['Market','سوق'],['Library','مكتبة'],['Castle','قلعة'],['Farm','مزرعة'],['Cinema','سينما'],['Stadium','ملعب'],['Bridge','جسر'],['Forest','غابة'],['Museum','متحف'],['Restaurant','مطعم'],['Zoo','حديقة حيوان'],['Bank','بنك'],['Island','جزيرة'],['Pyramid','هرم']]),
  pack('jobs', 'Jobs', 'مهن', '💼', '#7a6bb5', [['Doctor','طبيب'],['Teacher','معلّم'],['Pilot','طيّار'],['Chef','طاهٍ'],['Artist','فنان'],['Farmer','مزارع'],['Police officer','شرطي'],['Engineer','مهندس'],['Singer','مغنٍ'],['Nurse','ممرّض'],['Lawyer','محامٍ'],['Dentist','طبيب أسنان'],['Plumber','سبّاك'],['Scientist','عالِم'],['Firefighter','رجل إطفاء'],['Astronaut','رائد فضاء'],['Journalist','صحفي'],['Actor','ممثّل'],['Photographer','مصوّر'],['Mechanic','ميكانيكي']]),
  pack('sports', 'Sports', 'رياضة', '⚽', '#2f9e6b', [['Football','كرة القدم'],['Tennis','تنس'],['Swimming','سباحة'],['Boxing','ملاكمة'],['Cycling','دراجات'],['Skiing','تزلّج'],['Chess','شطرنج'],['Running','جري'],['Karate','كاراتيه'],['Golf','غولف'],['Cricket','كريكيت'],['Surfing','ركوب الأمواج'],['Basketball','كرة السلة'],['Volleyball','كرة الطائرة'],['Baseball','بيسبول'],['Wrestling','مصارعة'],['Archery','رماية'],['Gymnastics','جمباز'],['Rowing','تجديف'],['Climbing','تسلّق']]),
  pack('nature', 'Nature', 'الطبيعة', '🌿', '#4a8f5a', [['Rain','مطر'],['Rainbow','قوس قزح'],['Snow','ثلج'],['Thunder','رعد'],['Sun','شمس'],['Moon','قمر'],['Star','نجمة'],['Cloud','سحابة'],['Wind','رياح'],['Ocean','محيط'],['Flower','زهرة'],['Tree','شجرة'],['Waterfall','شلال'],['Lightning','برق'],['Earthquake','زلزال'],['Sand','رمل'],['Leaf','ورقة شجر'],['Storm','عاصفة'],['Fog','ضباب'],['Volcano','بركان']]),
  pack('household', 'Household', 'أدوات المنزل', '🏠', '#c49a6c', [['Chair','كرسي'],['Table','طاولة'],['Mirror','مرآة'],['Clock','ساعة'],['Lamp','مصباح'],['Pillow','وسادة'],['Blanket','بطانية'],['Fridge','ثلاجة'],['Oven','فرن'],['Broom','مكنسة'],['Key','مفتاح'],['Umbrella','مظلة'],['Toothbrush','فرشاة أسنان'],['Scissors','مقص'],['Candle','شمعة'],['Spoon','ملعقة'],['Towel','منشفة'],['Window','نافذة'],['Door','باب'],['Soap','صابون']]),
  pack('emotions', 'Emotions', 'مشاعر', '💫', '#d46a9a', [['Happy','سعيد'],['Sad','حزين'],['Angry','غاضب'],['Afraid','خائف'],['Excited','متحمّس'],['Bored','ملول'],['Proud','فخور'],['Shy','خجول'],['Jealous','غيور'],['Grateful','ممتن'],['Lonely','وحيد'],['Confused','مرتبك'],['Hopeful','متفائل'],['Calm','هادئ'],['Surprised','متفاجئ'],['Embarrassed','محرج'],['Curious','فضولي'],['Inspired','ملهم'],['Tired','متعب'],['Confident','واثق']], 'adjective'),
  pack('objects', 'Objects', 'أشياء', '📦', '#8b7355', [['Phone','هاتف'],['Laptop','حاسوب محمول'],['Book','كتاب'],['Ball','كرة'],['Bottle','زجاجة'],['Bag','حقيبة'],['Hat','قبعة'],['Shoe','حذاء'],['Glasses','نظارات'],['Watch','ساعة يد'],['Ring','خاتم'],['Camera','كاميرا'],['Guitar','غيتار'],['Flag','علم'],['Map','خريطة'],['Compass','بوصلة'],['Telescope','تلسكوب'],['Balloon','بالون'],['Puzzle','أحجية'],['Passport','جواز سفر']]),
  pack('actions', 'Actions', 'أفعال', '🏃', '#e08a4a', [['Running','يجري'],['Jumping','يقفز'],['Swimming','يسبح'],['Dancing','يرقص'],['Singing','يغني'],['Cooking','يطبخ'],['Reading','يقرأ'],['Writing','يكتب'],['Drawing','يرسم'],['Sleeping','ينام'],['Eating','يأكل'],['Laughing','يضحك'],['Crying','يبكي'],['Clapping','يصفق'],['Waving','يلوّح'],['Hugging','يعانق'],['Flying','يطير'],['Driving','يقود'],['Climbing','يتسلّق'],['Hiding','يختبئ']], 'action'),
  pack('movies', 'Movies & Stories', 'أفلام وقصص', '🎬', '#9b4dca', [['Hero','بطل'],['Villain','شرير'],['Sidekick','مساعد'],['Twist ending','نهاية مفاجئة'],['Trailer','إعلان تشويقي'],['Soundtrack','موسيقى تصويرية'],['Comedy','كوميديا'],['Horror','رعب'],['Documentary','وثائقي'],['Animation','رسوم متحركة'],['Sci-fi','خيال علمي'],['Fantasy','فانتازيا'],['Fairy tale','حكاية خرافية'],['Quest','مهمة'],['Time travel','سفر عبر الزمن'],['Alien','كائن فضائي'],['Robot','روبوت'],['Detective','محقّق'],['Happy ending','نهاية سعيدة'],['Cinema','سينما']]),
  pack('music', 'Music', 'موسيقى', '🎵', '#5b6fd6', [['Melody','لحن'],['Rhythm','إيقاع'],['Chorus','لازمة'],['Verse','مقطع'],['Solo','منفرد'],['Duet','ثنائي'],['Band','فرقة'],['Orchestra','أوركسترا'],['Concert','حفلة'],['Album','ألبوم'],['Playlist','قائمة تشغيل'],['DJ','دي جي'],['Jazz','جاز'],['Rock','روك'],['Pop','بوب'],['Oud','عود'],['Violin','كمان'],['Piano','بيانو'],['Guitar','غيتار'],['Drums','طبول']]),
  pack('travel', 'Travel', 'سفر', '✈️', '#2a9d8f', [['Passport','جواز سفر'],['Visa','تأشيرة'],['Boarding pass','بطاقة صعود'],['Luggage','أمتعة'],['Customs','جمارك'],['Airport gate','بوابة المطار'],['Hotel','فندق'],['Tour guide','مرشد سياحي'],['Souvenir','تذكار'],['Postcard','بطاقة بريدية'],['Taxi','تاكسي'],['Road trip','رحلة برية'],['Cruise','رحلة بحرية'],['Backpacking','سفر بحقيبة'],['Landmark','معلم'],['Map','خريطة'],['Beach','شاطئ'],['Camping','تخييم'],['Ferry','عبّارة'],['Time zone','منطقة زمنية']]),
  pack('tech', 'Tech', 'تقنية', '💻', '#457b9d', [['Smartphone','هاتف ذكي'],['App','تطبيق'],['Website','موقع'],['Password','كلمة مرور'],['Wi-Fi','واي فاي'],['Cloud','سحابة'],['Screenshot','لقطة شاشة'],['Emoji','إيموجي'],['Video call','مكالمة فيديو'],['Notification','إشعار'],['Update','تحديث'],['Bug','خلل'],['Algorithm','خوارزمية'],['Artificial intelligence','ذكاء اصطناعي'],['Robot','روبوت'],['Drone','درون'],['Virtual reality','واقع افتراضي'],['Code','كود'],['Keyboard','لوحة مفاتيح'],['Podcast','بودكاست']]),
  pack('fantasy', 'Fantasy', 'خيال', '🪄', '#7b2cbf', [['Wizard','ساحر'],['Witch','ساحرة'],['Dragon','تنين'],['Unicorn','وحيد القرن'],['Phoenix','فينيق'],['Mermaid','حورية بحر'],['Elf','جني'],['Fairy','جنية'],['Spellbook','كتاب تعاويذ'],['Magic wand','عصا سحرية'],['Potion','جرعة'],['Portal','بوابة'],['Flying carpet','بساط طائر'],['Wish','أمنية'],['Curse','لعنة'],['Treasure chest','صندوق كنز'],['Rune','رمز سحري'],['Amulet','تميمة'],['Ghost ship','سفينة أشباح'],['Crystal cave','كهف بلوري']]),
  pack('culture', 'Culture & Everyday', 'ثقافة ويوميات', '🌙', '#c9a227', [['Ramadan','رمضان'],['Eid','عيد'],['Iftar','إفطار'],['Suhoor','سحور'],['Lantern','فانوس'],['Arabic coffee','قهوة عربية'],['Incense','بخور'],['Henna','حنّاء'],['Thobe','ثوب'],['Abaya','عباية'],['Keffiyeh','كوفية'],['Prayer mat','سجادة صلاة'],['Souk','سوق شعبي'],['Falconry','صيد بالصقور'],['Camel race','سباق جمال'],['Hospitality','ضيافة'],['Dabke','دبكة'],['Calligraphy','خط عربي'],['Pottery','فخار'],['Book fair','معرض كتاب']], 'none'),
  pack('school', 'School', 'مدرسة', '📚', '#e9c46a', [['Homework','واجب'],['Exam','امتحان'],['Quiz','اختبار قصير'],['Lecture','محاضرة'],['Notebook','دفتر'],['Textbook','كتاب مدرسي'],['Backpack','حقيبة'],['Locker','خزانة'],['Bell','جرس'],['Recess','استراحة'],['Science fair','معرض علوم'],['Art class','حصة فن'],['Math problem','مسألة رياضيات'],['Microscope','ميكروسكوب'],['Essay','مقال'],['Presentation','عرض تقديمي'],['Group project','مشروع جماعي'],['Diploma','شهادة'],['Scholarship','منحة'],['Classmate','زميل صف']]),
  pack('kids', 'Kids-safe', 'مناسب للأطفال', '🌈', '#49b6a6', [['Balloon','بالون'],['Teddy bear','دب محشو'],['Sandbox','صندوق رمل'],['Slide','زلاقة'],['Swing','أرجوحة'],['Bicycle','دراجة'],['Kite','طائرة ورقية'],['Bubbles','فقاعات'],['Crayons','أقلام تلوين'],['Sticker','ملصق'],['Building blocks','مكعبات'],['Toy car','سيارة لعبة'],['Birthday cake','كعكة عيد ميلاد'],['Story time','وقت القصة'],['Hide and seek','غميضة'],['Jump rope','حبل قفز'],['Snowman','رجل ثلج'],['Sandcastle','قلعة رمل'],['Cartoon','كرتون'],['Kindness','لطف']]),
  pack('hard', 'Hard mode', 'صعب', '🔥', '#e63946', [['Procrastination','تأجيل'],['Nostalgia','حنين'],['Ambivalence','ازدواجية مشاعر'],['Irony','سخرية'],['Paradox','مفارقة'],['Metaphor','استعارة'],['Satire','هجاء'],['Déjà vu','سبق رؤيته'],['Bureaucracy','بيروقراطية'],['Diplomacy','دبلوماسية'],['Inflation','تضخم'],['Monopoly','احتكار'],['Scalability','قابلية توسع'],['Cognitive bias','انحياز معرفي'],['Perfectionism','كمالية'],['Mindfulness','يقظة ذهنية'],['Moral dilemma','معضلة أخلاقية'],['Opportunity cost','تكلفة الفرصة'],['Chaos theory','نظرية الفوضى'],['Entropy','إنتروبيا']], 'none'),
  pack('celebrities', 'Roles & Archetypes', 'أدوار وأنماط', '⭐', '#f4a261', [['The mentor','المرشد'],['The rebel','المتمرّد'],['The caregiver','الراعي'],['The explorer','المستكشف'],['The jester','المهرّج'],['The ruler','الحاكم'],['The sage','الحكيم'],['The hero','البطل'],['The creator','المبدع'],['The magician','الساحر'],['Class clown','مهرّج الصف'],['Quiet genius','عبقري هادئ'],['Social butterfly','فراشة اجتماعية'],['Underdog','المستضعف'],['Drama queen','ملكة الدراما'],['Free spirit','روح حرة'],['Night owl','بومة ليل'],['Bookworm','دودة كتب'],['Trendsetter','صانع موضة'],['Rising star','نجم صاعد']], 'none'),
];

/*
 * ⚠ `Random` MUST NOT BE ABLE TO LAND ON "Hard mode" (2026-08-29).
 *
 * That pack holds Entropy, Cognitive bias, Opportunity cost, Ambivalence. As a
 * pack somebody deliberately picks it is a good time; dealt to a table that
 * asked for "Random" it is the fastest way to kill a party game — nobody can
 * give a one-word clue about Entropy, the round dies, and the group concludes
 * the GAME is bad rather than the draw. A player who wants it can still choose
 * the chip; this only removes it from the blind draw.
 */
const ADVANCED = new Set(['hard']);
for (const p of PACKS) p.advanced = ADVANCED.has(p.id);

/** The packs a blind "Random" draw may return. */
export const CASUAL_PACKS = PACKS.filter((p) => !p.advanced);

export const packById = (id) => PACKS.find((pack) => pack.id === id) || null;
export const randomPack = () => CASUAL_PACKS[Math.floor(Math.random() * CASUAL_PACKS.length)];
