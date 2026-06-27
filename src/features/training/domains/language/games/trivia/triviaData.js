/*
 * Trivia content bank — general-knowledge mix, kid-friendly & bilingual (EN/AR).
 *
 * Rules: accurate, timeless, culturally neutral. No religion, no politics, no
 * sensitive/8+ material. Each category has enough questions to fill a staircase.
 *
 * Question shape: { e: emoji, en, ar, o: [[en,ar], …], a: indexOfCorrect }.
 * The engine shuffles the option order at runtime, so `a` is just the author key.
 */

export const TRIVIA_CATEGORIES = [
  { id: 'animals', en: 'Animals', ar: 'الحيوانات', emoji: '🦁' },
  { id: 'space', en: 'Space', ar: 'الفضاء', emoji: '🪐' },
  { id: 'ocean', en: 'Ocean', ar: 'المحيط', emoji: '🐙' },
  { id: 'dinos', en: 'Dinosaurs', ar: 'الديناصورات', emoji: '🦕' },
  { id: 'body', en: 'Human Body', ar: 'جسم الإنسان', emoji: '🫀' },
  { id: 'science', en: 'Science', ar: 'العلوم', emoji: '🔬' },
  { id: 'geography', en: 'Geography', ar: 'الجغرافيا', emoji: '🗺️' },
  { id: 'plants', en: 'Plants', ar: 'النباتات', emoji: '🌳' },
];

export const TRIVIA = {
  animals: [
    { e: '🕷️', en: 'How many legs does a spider have?', ar: 'كم رِجلاً للعنكبوت؟', o: [['8', '٨'], ['6', '٦'], ['10', '١٠']], a: 0 },
    { e: '🐘', en: 'What is the largest land animal?', ar: 'ما أكبر حيوان برّي؟', o: [['Elephant', 'الفيل'], ['Lion', 'الأسد'], ['Horse', 'الحصان']], a: 0 },
    { e: '🦒', en: 'Which animal has the longest neck?', ar: 'أي حيوان له أطول رقبة؟', o: [['Giraffe', 'الزرافة'], ['Camel', 'الجمل'], ['Zebra', 'الحمار الوحشي']], a: 0 },
    { e: '🐝', en: 'What do bees make?', ar: 'ماذا يصنع النحل؟', o: [['Honey', 'العسل'], ['Milk', 'الحليب'], ['Silk', 'الحرير']], a: 0 },
    { e: '🦇', en: 'Which flying animal is a mammal?', ar: 'أي حيوان طائر هو ثديي؟', o: [['Bat', 'الخفّاش'], ['Owl', 'البومة'], ['Eagle', 'النسر']], a: 0 },
    { e: '🐧', en: 'Penguins live mostly in…', ar: 'يعيش البطريق غالباً في…', o: [['Cold places', 'أماكن باردة'], ['Deserts', 'الصحاري'], ['Jungles', 'الغابات']], a: 0 },
    { e: '🐍', en: 'Which animal has no legs?', ar: 'أي حيوان بلا أرجل؟', o: [['Snake', 'الأفعى'], ['Frog', 'الضفدع'], ['Mouse', 'الفأر']], a: 0 },
    { e: '🐢', en: 'What does a turtle carry on its back?', ar: 'ماذا تحمل السلحفاة على ظهرها؟', o: [['A shell', 'صدفة'], ['A bag', 'حقيبة'], ['Wings', 'جناحان']], a: 0 },
  ],
  space: [
    { e: '🔴', en: 'Which planet is called the Red Planet?', ar: 'أي كوكب يُسمّى الكوكب الأحمر؟', o: [['Mars', 'المرّيخ'], ['Venus', 'الزهرة'], ['Saturn', 'زحل']], a: 0 },
    { e: '☀️', en: 'What is the Sun?', ar: 'ما هي الشمس؟', o: [['A star', 'نجم'], ['A planet', 'كوكب'], ['A moon', 'قمر']], a: 0 },
    { e: '🌍', en: 'Which planet do we live on?', ar: 'على أي كوكب نعيش؟', o: [['Earth', 'الأرض'], ['Jupiter', 'المشتري'], ['Mars', 'المرّيخ']], a: 0 },
    { e: '🪐', en: 'Which planet is famous for its rings?', ar: 'أي كوكب يشتهر بحلقاته؟', o: [['Saturn', 'زحل'], ['Mercury', 'عطارد'], ['Earth', 'الأرض']], a: 0 },
    { e: '🌕', en: 'What orbits the Earth?', ar: 'ما الذي يدور حول الأرض؟', o: [['The Moon', 'القمر'], ['The Sun', 'الشمس'], ['Mars', 'المرّيخ']], a: 0 },
    { e: '🚀', en: 'A person who travels to space is an…', ar: 'من يسافر إلى الفضاء يُسمّى…', o: [['Astronaut', 'رائد فضاء'], ['Pilot', 'طيّار'], ['Sailor', 'بحّار']], a: 0 },
    { e: '⭐', en: 'Stars are mostly made of…', ar: 'النجوم مكوّنة غالباً من…', o: [['Hot gas', 'غاز ساخن'], ['Rock', 'صخر'], ['Ice', 'جليد']], a: 0 },
    { e: '🌌', en: 'Our galaxy is called the…', ar: 'تُسمّى مجرّتنا…', o: [['Milky Way', 'درب التبّانة'], ['Big Dipper', 'الدبّ الأكبر'], ['Red Sea', 'البحر الأحمر']], a: 0 },
  ],
  ocean: [
    { e: '🐙', en: 'How many arms does an octopus have?', ar: 'كم ذراعاً للأخطبوط؟', o: [['8', '٨'], ['6', '٦'], ['4', '٤']], a: 0 },
    { e: '🐋', en: 'What is the biggest animal in the ocean?', ar: 'ما أكبر حيوان في المحيط؟', o: [['Blue whale', 'الحوت الأزرق'], ['Shark', 'القرش'], ['Dolphin', 'الدلفين']], a: 0 },
    { e: '🦈', en: 'A shark is a type of…', ar: 'القرش نوع من…', o: [['Fish', 'الأسماك'], ['Mammal', 'الثدييات'], ['Bird', 'الطيور']], a: 0 },
    { e: '🌊', en: 'Ocean water tastes…', ar: 'طعم ماء المحيط…', o: [['Salty', 'مالح'], ['Sweet', 'حلو'], ['Sour', 'حامض']], a: 0 },
    { e: '🐠', en: 'Fish breathe using their…', ar: 'تتنفّس الأسماك بواسطة…', o: [['Gills', 'الخياشيم'], ['Nose', 'الأنف'], ['Ears', 'الأذنين']], a: 0 },
    { e: '🦀', en: 'A crab usually walks…', ar: 'يمشي السرطان عادةً…', o: [['Sideways', 'جانبياً'], ['Backwards only', 'للخلف فقط'], ['On two legs', 'على رجلين']], a: 0 },
    { e: '🐢', en: 'Sea turtles lay their eggs on…', ar: 'تضع السلاحف البحرية بيضها على…', o: [['The beach', 'الشاطئ'], ['Rocks', 'الصخور'], ['Boats', 'القوارب']], a: 0 },
    { e: '🐬', en: 'Dolphins are known to be very…', ar: 'تشتهر الدلافين بأنها…', o: [['Smart', 'ذكية'], ['Slow', 'بطيئة'], ['Tiny', 'صغيرة جداً']], a: 0 },
  ],
  dinos: [
    { e: '🦖', en: 'Tyrannosaurus rex was a…', ar: 'كان التيرانوصور…', o: [['Meat eater', 'آكل لحوم'], ['Plant eater', 'آكل نبات'], ['Fish', 'سمكة']], a: 0 },
    { e: '🦕', en: 'Which dinosaur had a very long neck?', ar: 'أي ديناصور كان له رقبة طويلة جداً؟', o: [['Brachiosaurus', 'براكيوصور'], ['T. rex', 'تيرانوصور'], ['Raptor', 'رابتور']], a: 0 },
    { e: '🦴', en: 'How do we learn about dinosaurs?', ar: 'كيف نتعرّف على الديناصورات؟', o: [['From fossils', 'من الأحافير'], ['From photos', 'من الصور'], ['From videos', 'من الفيديو']], a: 0 },
    { e: '🥚', en: 'Dinosaurs hatched from…', ar: 'كانت الديناصورات تفقس من…', o: [['Eggs', 'البيض'], ['Seeds', 'البذور'], ['Caves', 'الكهوف']], a: 0 },
    { e: '🌿', en: 'A Triceratops mostly ate…', ar: 'كان الترايسيراتوبس يأكل غالباً…', o: [['Plants', 'النباتات'], ['Meat', 'اللحوم'], ['Rocks', 'الصخور']], a: 0 },
    { e: '⏳', en: 'Do dinosaurs live today?', ar: 'هل تعيش الديناصورات اليوم؟', o: [['No, long ago', 'لا، قديماً'], ['Yes, in zoos', 'نعم، في الحدائق'], ['Yes, in oceans', 'نعم، في المحيطات']], a: 0 },
    { e: '🦅', en: 'Birds are most related to…', ar: 'الطيور أقرب ما تكون إلى…', o: [['Dinosaurs', 'الديناصورات'], ['Fish', 'الأسماك'], ['Insects', 'الحشرات']], a: 0 },
    { e: '🦷', en: 'A meat-eating dinosaur had sharp…', ar: 'كان للديناصور آكل اللحوم… حادّة', o: [['Teeth', 'أسنان'], ['Wings', 'أجنحة'], ['Shells', 'أصداف']], a: 0 },
  ],
  body: [
    { e: '🫀', en: 'What pumps blood around your body?', ar: 'ما الذي يضخّ الدم في جسمك؟', o: [['The heart', 'القلب'], ['The brain', 'الدماغ'], ['The lungs', 'الرئتان']], a: 0 },
    { e: '🦴', en: 'Your skeleton is made of…', ar: 'هيكلك العظمي مكوّن من…', o: [['Bones', 'العظام'], ['Muscles', 'العضلات'], ['Skin', 'الجلد']], a: 0 },
    { e: '🧠', en: 'Which part helps you think?', ar: 'أي عضو يساعدك على التفكير؟', o: [['The brain', 'الدماغ'], ['The stomach', 'المعدة'], ['The feet', 'القدمان']], a: 0 },
    { e: '🫁', en: 'You breathe with your…', ar: 'تتنفّس بواسطة…', o: [['Lungs', 'الرئتين'], ['Heart', 'القلب'], ['Liver', 'الكبد']], a: 0 },
    { e: '👀', en: 'You see with your…', ar: 'ترى بواسطة…', o: [['Eyes', 'العينين'], ['Ears', 'الأذنين'], ['Nose', 'الأنف']], a: 0 },
    { e: '🦷', en: 'Teeth help you…', ar: 'تساعدك الأسنان على…', o: [['Chew food', 'مضغ الطعام'], ['Run fast', 'الجري'], ['See far', 'الرؤية بعيداً']], a: 0 },
    { e: '🩸', en: 'Blood is usually what color?', ar: 'ما لون الدم عادةً؟', o: [['Red', 'أحمر'], ['Blue', 'أزرق'], ['Green', 'أخضر']], a: 0 },
    { e: '✋', en: 'How many fingers are on one hand?', ar: 'كم إصبعاً في اليد الواحدة؟', o: [['5', '٥'], ['4', '٤'], ['6', '٦']], a: 0 },
  ],
  science: [
    { e: '💧', en: 'When water freezes it becomes…', ar: 'عندما يتجمّد الماء يصبح…', o: [['Ice', 'جليداً'], ['Steam', 'بخاراً'], ['Sand', 'رملاً']], a: 0 },
    { e: '🌈', en: 'A rainbow has how many main colors?', ar: 'كم لوناً رئيسياً لقوس قزح؟', o: [['7', '٧'], ['3', '٣'], ['10', '١٠']], a: 0 },
    { e: '🧲', en: 'A magnet attracts…', ar: 'المغناطيس يجذب…', o: [['Iron', 'الحديد'], ['Wood', 'الخشب'], ['Paper', 'الورق']], a: 0 },
    { e: '🌱', en: 'Plants need sunlight to…', ar: 'تحتاج النباتات ضوء الشمس لكي…', o: [['Grow', 'تنمو'], ['Sleep', 'تنام'], ['Sing', 'تغنّي']], a: 0 },
    { e: '🔥', en: 'Which of these is hot?', ar: 'أي من هذه ساخن؟', o: [['Fire', 'النار'], ['Ice', 'الجليد'], ['Snow', 'الثلج']], a: 0 },
    { e: '⚡', en: 'We use electricity to…', ar: 'نستخدم الكهرباء لـ…', o: [['Power lights', 'إضاءة المصابيح'], ['Make rain', 'صنع المطر'], ['Grow trees', 'إنبات الأشجار']], a: 0 },
    { e: '🌬️', en: 'Wind is moving…', ar: 'الريح هي حركة…', o: [['Air', 'الهواء'], ['Water', 'الماء'], ['Sand', 'الرمل']], a: 0 },
    { e: '🌡️', en: 'A thermometer measures…', ar: 'يقيس مقياس الحرارة…', o: [['Temperature', 'درجة الحرارة'], ['Weight', 'الوزن'], ['Time', 'الوقت']], a: 0 },
  ],
  geography: [
    { e: '🌊', en: 'What is the largest ocean?', ar: 'ما أكبر محيط؟', o: [['Pacific', 'الهادئ'], ['Atlantic', 'الأطلسي'], ['Indian', 'الهندي']], a: 0 },
    { e: '🏔️', en: 'A very tall landform is a…', ar: 'التضاريس المرتفعة جداً تُسمّى…', o: [['Mountain', 'جبلاً'], ['Valley', 'وادياً'], ['Lake', 'بحيرة']], a: 0 },
    { e: '🏜️', en: 'A desert is very…', ar: 'الصحراء مكان…', o: [['Dry', 'جاف'], ['Wet', 'رطب'], ['Cold', 'بارد']], a: 0 },
    { e: '🗺️', en: 'How many continents are there?', ar: 'كم عدد القارات؟', o: [['7', '٧'], ['5', '٥'], ['10', '١٠']], a: 0 },
    { e: '🏝️', en: 'Land surrounded by water is an…', ar: 'اليابسة المحاطة بالماء تُسمّى…', o: [['Island', 'جزيرة'], ['River', 'نهراً'], ['Hill', 'تلّة']], a: 0 },
    { e: '🌋', en: 'What can erupt with hot lava?', ar: 'ما الذي يثور باللافا الساخنة؟', o: [['Volcano', 'البركان'], ['Cloud', 'السحابة'], ['Cave', 'الكهف']], a: 0 },
    { e: '❄️', en: 'Which place is very cold and icy?', ar: 'أي مكان شديد البرودة والجليد؟', o: [['The North Pole', 'القطب الشمالي'], ['The desert', 'الصحراء'], ['The beach', 'الشاطئ']], a: 0 },
    { e: '🏞️', en: 'A large flowing stream of water is a…', ar: 'مجرى مائي كبير جارٍ يُسمّى…', o: [['River', 'نهراً'], ['Mountain', 'جبلاً'], ['Forest', 'غابة']], a: 0 },
  ],
  plants: [
    { e: '🌱', en: 'A plant grows from a…', ar: 'ينمو النبات من…', o: [['Seed', 'بذرة'], ['Stone', 'حجر'], ['Cloud', 'سحابة']], a: 0 },
    { e: '🌳', en: 'Which part of a tree is underground?', ar: 'أي جزء من الشجرة تحت الأرض؟', o: [['Roots', 'الجذور'], ['Leaves', 'الأوراق'], ['Branches', 'الأغصان']], a: 0 },
    { e: '🍎', en: 'Apples grow on…', ar: 'ينمو التفاح على…', o: [['Trees', 'الأشجار'], ['Underground', 'تحت الأرض'], ['Grass', 'الأعشاب']], a: 0 },
    { e: '🌻', en: 'Young sunflowers turn toward the…', ar: 'تتجه عبّاد الشمس الصغيرة نحو…', o: [['Sun', 'الشمس'], ['Moon', 'القمر'], ['Ground', 'الأرض']], a: 0 },
    { e: '🍃', en: 'Leaves are usually what color?', ar: 'ما لون الأوراق عادةً؟', o: [['Green', 'أخضر'], ['Blue', 'أزرق'], ['Black', 'أسود']], a: 0 },
    { e: '💧', en: 'Plants drink mostly…', ar: 'تشرب النباتات غالباً…', o: [['Water', 'الماء'], ['Milk', 'الحليب'], ['Juice', 'العصير']], a: 0 },
    { e: '🌵', en: 'A cactus grows in the…', ar: 'ينمو الصبّار في…', o: [['Desert', 'الصحراء'], ['Ocean', 'المحيط'], ['Snow', 'الثلج']], a: 0 },
    { e: '🥕', en: 'A carrot is a…', ar: 'الجزر هو…', o: [['Vegetable', 'خضار'], ['Candy', 'حلوى'], ['Meat', 'لحم']], a: 0 },
  ],
};
