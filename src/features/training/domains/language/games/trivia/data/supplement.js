/*
 * Supplemental trivia questions — extends each category for year-long daily play.
 * Shape: { d: 1|2|3, en, ar, o: [[en,ar]×4], a: 0, f: {en,ar} }.
 */
export const SUPPLEMENT = {
  animals: [
    { d: 1, en: 'Which animal is known for carrying its home on its back?', ar: 'أي حيوان يُعرف بحمل بيته على ظهره؟', o: [['Snail', 'الحلزون'], ['Frog', 'الضفدع'], ['Rabbit', 'الأرنب'], ['Deer', 'الغزال']], a: 0, f: { en: 'A snail’s shell grows with its body.', ar: 'ينمو صدف الحلزون مع جسده.' } },
    { d: 1, en: 'What do you call a baby dog?', ar: 'ماذا يُسمّى صغير الكلب؟', o: [['Puppy', 'جرو'], ['Kitten', 'هريرة'], ['Calf', 'عجل'], ['Chick', 'كتكوت']], a: 0, f: { en: 'Puppies are born blind and open their eyes after about two weeks.', ar: 'تولد الجراء عمياء وتفتح عينيها بعد نحو أسبوعين.' } },
    { d: 2, en: 'Which mammal can truly fly?', ar: 'أي ثديي يطير طيراناً حقيقياً؟', o: [['Bat', 'الخفاش'], ['Flying squirrel', 'سنجاب طائر'], ['Ostrich', 'النعامة'], ['Penguin', 'البطريق']], a: 0, f: { en: 'Flying squirrels glide — only bats flap their wings to fly.', ar: 'السنجاب الطائر ينزلق فقط — الخفافيش وحدها ترفرف للطيران.' } },
    { d: 3, en: 'The only bird that can fly backwards is the…', ar: 'الطائر الوحيد القادر على الطيران إلى الخلف هو…', o: [['Hummingbird', 'الطنّان'], ['Eagle', 'النسر'], ['Crow', 'الغراب'], ['Owl', 'البومة']], a: 0, f: { en: 'Hummingbirds hover like tiny helicopters at flowers.', ar: 'يحوم الطنّان كمروحيات صغيرة عند الأزهار.' } },
    { d: 3, en: 'Which animal has the longest lifespan among these?', ar: 'أي حيوان له أطول عمر بين هذه؟', o: [['Galápagos tortoise', 'سلحفاة غالاباغوس'], ['Mouse', 'الفأر'], ['Rabbit', 'الأرنب'], ['Dog', 'الكلب']], a: 0, f: { en: 'Some tortoises live well over 100 years.', ar: 'بعض السلاحف تعيش أكثر من مئة عام.' } },
  ],
  ocean: [
    { d: 1, en: 'Which sea creature has eight arms?', ar: 'أي مخلوق بحري له ثمانية أذرع؟', o: [['Octopus', 'الأخطبوط'], ['Starfish', 'نجم البحر'], ['Seahorse', 'فرس البحر'], ['Crab', 'السرطان']], a: 0, f: { en: 'Octopuses have three hearts and blue blood.', ar: 'للأخطبوط ثلاثة قلوب ودم أزرق.' } },
    { d: 2, en: 'Coral reefs are built mostly by tiny…', ar: 'الشعاب المرجانية تُبنى غالباً بواسطة…', o: [['Animals called polyps', 'حيوانات تُسمّى البوليبات'], ['Rocks', 'صخور'], ['Seaweed only', 'أعشاب بحرية فقط'], ['Fish nests', 'أعشاش أسماك']], a: 0, f: { en: 'Coral polyps secrete a hard limestone skeleton.', ar: 'تفرز البوليبات هيكلاً من الحجر الجيري.' } },
    { d: 3, en: 'The deepest known part of the ocean is the…', ar: 'أعمق جزء معروف في المحيط هو…', o: [['Mariana Trench', 'خندق ماريانا'], ['Red Sea', 'البحر الأحمر'], ['Suez Canal', 'قناة السويس'], ['Nile Delta', 'دلتا النيل']], a: 0, f: { en: 'It plunges about 11 km — deeper than Mount Everest is tall.', ar: 'يغوص نحو ١١ كم — أعمق من ارتفاع إيفرست.' } },
  ],
  plants: [
    { d: 1, en: 'Plants make their food using sunlight in a process called…', ar: 'تصنع النباتات غذاءها بالضوء في عملية تُسمّى…', o: [['Photosynthesis', 'التركيب الضوئي'], ['Respiration', 'التنفس'], ['Digestion', 'الهضم'], ['Evaporation', 'التبخّر']], a: 0, f: { en: 'Chlorophyll in leaves captures light energy.', ar: 'الكلوروفيل في الأوراق يلتقط طاقة الضوء.' } },
    { d: 2, en: 'Which part of a plant anchors it in the soil?', ar: 'أي جزء من النبات يثبّته في التربة؟', o: [['Roots', 'الجذور'], ['Petals', 'البتلات'], ['Stigma', 'القمة'], ['Pollen', 'حبوب اللقاح']], a: 0, f: { en: 'Roots also absorb water and minerals.', ar: 'تمتص الجذور أيضاً الماء والمعادن.' } },
    { d: 3, en: 'Trees that drop all their leaves each year are called…', ar: 'الأشجار التي تسقط كل أوراقها سنوياً تُسمّى…', o: [['Deciduous', 'نفضية'], ['Evergreen', 'دائمة الخضرة'], ['Cactus', 'صبار'], ['Moss', 'طحلب']], a: 0, f: { en: 'Evergreens keep their needles or leaves through winter.', ar: 'تحتفظ الأشجار دائمة الخضرة بإبرها أو أوراقها في الشتاء.' } },
  ],
  weather: [
    { d: 1, en: 'Water falling from clouds as frozen crystals is…', ar: 'الماء الساقط من الغيوم على شكل بلورات متجمّدة هو…', o: [['Snow', 'الثلج'], ['Fog', 'الضباب'], ['Dew', 'الندى'], ['Hail only', 'البَرَد فقط']], a: 0, f: { en: 'Each snowflake has a unique six-sided pattern.', ar: 'لكل ندفة ثلج نمط سداسي فريد.' } },
    { d: 2, en: 'A rotating column of air touching the ground is a…', ar: 'عمود هواء دوّار يلامس الأرض يُسمّى…', o: [['Tornado', 'إعصاراً'], ['Breeze', 'نسيم'], ['Dew', 'ندى'], ['Rainbow', 'قوس قزح']], a: 0, f: { en: 'Tornado winds can exceed 400 km/h.', ar: 'رياح الإعصار قد تتجاوز ٤٠٠ كم/س.' } },
    { d: 3, en: 'The layer of gases surrounding Earth is the…', ar: 'طبقة الغازات المحيطة بالأرض هي…', o: [['Atmosphere', 'الغلاف الجوي'], ['Mantle', 'الوشاح'], ['Crust only', 'القشرة فقط'], ['Core', 'اللب']], a: 0, f: { en: 'The atmosphere protects us from harmful solar radiation.', ar: 'يحمينا الغلاف الجوي من إشعاع شمسي ضار.' } },
  ],
  space: [
    { d: 1, en: 'Earth travels around the Sun once in about…', ar: 'تدور الأرض حول الشمس مرة كل نحو…', o: [['One year', 'سنة واحدة'], ['One day', 'يوم واحد'], ['One week', 'أسبوع'], ['One hour', 'ساعة']], a: 0, f: { en: 'One orbit takes roughly 365¼ days.', ar: 'تستغرق دورة واحدة نحو ٣٦٥¼ يوماً.' } },
    { d: 2, en: 'Which planet is famous for its rings?', ar: 'أي كوكب مشهور بحلقاته؟', o: [['Saturn', 'زحل'], ['Mars', 'المريخ'], ['Venus', 'الزهرة'], ['Mercury', 'عطارد']], a: 0, f: { en: 'Saturn’s rings are mostly ice and rock particles.', ar: 'حلقات زحل غالباً من جليد وحبيبات صخرية.' } },
    { d: 3, en: 'A light-year measures…', ar: 'السنة الضوئية تقيس…', o: [['Distance', 'مسافة'], ['Time only', 'زمناً فقط'], ['Weight', 'وزناً'], ['Temperature', 'حرارة']], a: 0, f: { en: 'It is how far light travels in one year — about 9.5 trillion km.', ar: 'هي المسافة التي يقطعها الضوء في سنة — نحو ٩٫٥ تريليون كم.' } },
  ],
  body: [
    { d: 1, en: 'Which organ pumps blood through the body?', ar: 'أي عضو يضخّ الدم في الجسم؟', o: [['Heart', 'القلب'], ['Liver', 'الكبد'], ['Stomach', 'المعدة'], ['Skin', 'الجلد']], a: 0, f: { en: 'Your heart beats about 100,000 times a day.', ar: 'ينبض قلبك نحو ١٠٠٬٠٠٠ مرة في اليوم.' } },
    { d: 2, en: 'Bones are connected at movable joints by…', ar: 'تتصل العظام عند المفاصل المتحركة بواسطة…', o: [['Ligaments', 'أربطة'], ['Hair', 'شعر'], ['Nails', 'أظافر'], ['Teeth enamel', 'مينا الأسنان']], a: 0, f: { en: 'Muscles pull on bones to create movement.', ar: 'تشدّ العضلات العظام لإحداث الحركة.' } },
    { d: 3, en: 'The smallest unit of life in your body is the…', ar: 'أصغر وحدة حياة في جسمك هي…', o: [['Cell', 'الخلية'], ['Atom', 'الذرة'], ['Organ', 'العضو'], ['Tissue only', 'النسيج فقط']], a: 0, f: { en: 'You have trillions of cells working together.', ar: 'لديك تريليونات الخلايا تعمل معاً.' } },
  ],
  science: [
    { d: 1, en: 'H₂O is the chemical formula for…', ar: 'H₂O هو الصيغة الكيميائية لـ…', o: [['Water', 'الماء'], ['Salt', 'الملح'], ['Gold', 'الذهب'], ['Oxygen gas only', 'غاز الأكسجين فقط']], a: 0, f: { en: 'Two hydrogen atoms bond to one oxygen atom.', ar: 'ذرتا هيدروجين ترتبطان بذرة أكسجين.' } },
    { d: 2, en: 'Energy from food is measured in…', ar: 'طاقة الطعام تُقاس بـ…', o: [['Calories', 'سعرات حرارية'], ['Metres', 'أمتار'], ['Litres', 'لترات'], ['Volts', 'فولت']], a: 0, f: { en: 'A calorie is the energy needed to heat 1 gram of water by 1°C.', ar: 'السعرة الحرارية هي الطاقة اللازمة لتسخين غرام واحد من الماء درجة مئوية واحدة.' } },
    { d: 3, en: 'Newton’s first law says an object at rest stays at rest unless…', ar: 'قانون نيوتن الأول يقول إن الجسم الساكن يبقى ساكناً ما لم…', o: [['A force acts on it', 'تؤثر عليه قوة'], ['It becomes lighter', 'يصبح أخف'], ['It changes colour', 'يتغيّر لونه'], ['It grows', 'ينمو']], a: 0, f: { en: 'This is also called the law of inertia.', ar: 'يُسمّى أيضاً قانون القصور الذاتي.' } },
  ],
  everyday: [
    { d: 1, en: 'A lever helps you lift heavy things by…', ar: 'الرافعة تساعدك على رفع الأشياء الثقيلة عبر…', o: [['Trading distance for force', 'مبادلة مسافة بقوة'], ['Making things lighter inside', 'تخفيفها من الداخل'], ['Removing gravity', 'إزالة الجاذبية'], ['Freezing them', 'تجميدها']], a: 0, f: { en: 'A longer arm means less force needed.', ar: 'ذراع أطول يعني قوة أقل مطلوبة.' } },
    { d: 2, en: 'Mirrors reflect light because they have a smooth…', ar: 'المرايا تعكس الضوء لأن لها سطحاً…', o: [['Shiny surface', 'لامعاً'], ['Rough wood', 'خشبياً خشناً'], ['Soft fabric', 'قماشياً ناعماً'], ['Liquid centre', 'سائلاً في الوسط']], a: 0, f: { en: 'Rough surfaces scatter light in many directions.', ar: 'الأسطح الخشنة تشتت الضوء في اتجاهات عدة.' } },
    { d: 3, en: 'GPS in your phone uses signals from…', ar: 'نظام GPS في هاتفك يستخدم إشارات من…', o: [['Satellites', 'أقمار صناعية'], ['Street lamps', 'مصابيح الشوارع'], ['Radio towers only', 'أبراج راديو فقط'], ['Compasses inside', 'بوصلات داخلية']], a: 0, f: { en: 'At least four satellites help pinpoint your location.', ar: 'أربعة أقمار على الأقل تحدّد موقعك.' } },
  ],
  geography: [
    { d: 1, en: 'The Nile flows mainly through which continent?', ar: 'ينبع النيل ويمرّ أساساً في أي قارة؟', o: [['Africa', 'أفريقيا'], ['Europe', 'أوروبا'], ['Australia', 'أستراليا'], ['Antarctica', 'القارة القطبية الجنوبية']], a: 0, f: { en: 'It is one of the longest rivers on Earth.', ar: 'من أطول الأنهار على وجه الأرض.' } },
    { d: 2, en: 'An area completely surrounded by land is…', ar: 'منطقة محاطة باليابسة تماماً هي…', o: [['Landlocked', 'محبوسة برياً'], ['Coastal', 'ساحلية'], ['Volcanic', 'بركانية'], ['Polar', 'قطبية']], a: 0, f: { en: 'Many countries have no direct access to the sea.', ar: 'كثير من الدول بلا وصول مباشر للبحر.' } },
    { d: 3, en: 'Lines running east–west on a map showing latitude are…', ar: 'الخطوط الشرق–غرب على الخريطة التي تبيّن خط العرض هي…', o: [['Parallels', 'دوائر العرض'], ['Meridians', 'خطوط الطول'], ['Contours', 'خطوط كنتور'], ['Borders only', 'حدود فقط']], a: 0, f: { en: 'The equator is the most famous parallel at 0°.', ar: 'خط الاستواء أشهر دائرة عرض عند ٠°.' } },
  ],
  history: [
    { d: 1, en: 'Ancient Egyptians built giant stone tombs called…', ar: 'بنى المصريون القدماء مقابر حجرية عملاقة تُسمّى…', o: [['Pyramids', 'أهرامات'], ['Castles', 'قلاع'], ['Bridges', 'جسور'], ['Lighthouses', 'منارات']], a: 0, f: { en: 'The Great Pyramid was the tallest human-made structure for thousands of years.', ar: 'كان الهرم الأكبر أطول بناء بشري لآلاف السنين.' } },
    { d: 2, en: 'Paper was invented in ancient…', ar: 'اخترع الورق في…', o: [['China', 'الصين'], ['Brazil', 'البرازيل'], ['Iceland', 'آيسلندا'], ['Canada', 'كندا']], a: 0, f: { en: 'Before paper, people wrote on papyrus, clay, and silk.', ar: 'قبل الورق كتب الناس على البردي والطين والحرير.' } },
    { d: 3, en: 'The Rosetta Stone helped scholars decode…', ar: 'ساعد حجر رشيد العلماء على فكّ رموز…', o: [['Egyptian hieroglyphs', 'الهيروغليفية المصرية'], ['Binary code', 'الكود الثنائي'], ['DNA', 'الحمض النووي'], ['Morse code', 'شيفرة مورس']], a: 0, f: { en: 'It showed the same text in three scripts.', ar: 'عرض النص نفسه بثلاث كتابات.' } },
  ],
  inventions: [
    { d: 1, en: 'The wheel is one of humanity’s oldest…', ar: 'العجلة من أقدم…', o: [['Inventions', 'اختراعات البشرية'], ['Planets', 'الكواكب'], ['Oceans', 'المحيطات'], ['Languages', 'اللغات']], a: 0, f: { en: 'Wheels made transport and machinery possible.', ar: 'أتاحت العجلة النقل والآلات.' } },
    { d: 2, en: 'Thomas Edison is closely linked to developing the practical…', ar: 'يرتبط توماس إديسون بتطوير…', o: [['Light bulb', 'المصباح الكهربائي'], ['Airplane', 'الطائرة'], ['Telephone', 'الهاتف'], ['Compass', 'البوصلة']], a: 0, f: { en: 'Electric lighting changed how cities lived at night.', ar: 'غيّرت الإضاءة الكهربائية حياة المدن ليلاً.' } },
    { d: 3, en: 'The World Wide Web was created in the…', ar: 'ابتُكرت شبكة الويب العالمية في…', o: [['1990s', 'تسعينيات القرن العشرين'], ['1500s', 'القرن السادس عشر'], ['1800 BC', '١٨٠٠ ق.م'], ['2200 AD', '٢٢٠٠ م']], a: 0, f: { en: 'Tim Berners-Lee proposed it at CERN in 1989.', ar: 'اقترحها تيم بيرنرز-لي في مختبر سيرن عام ١٩٨٩.' } },
  ],
  food: [
    { d: 1, en: 'Bread is mainly made from…', ar: 'يُصنع الخبز أساساً من…', o: [['Flour', 'دقيق'], ['Sand', 'رمل'], ['Glass', 'زجاج'], ['Plastic', 'بلاستيك']], a: 0, f: { en: 'Yeast makes dough rise with carbon dioxide.', ar: 'الخميرة ترفع العجين بثاني أكسيد الكربون.' } },
    { d: 2, en: 'Vitamin C is abundant in…', ar: 'فيتامين C وفير في…', o: [['Citrus fruits', 'الحمضيات'], ['Cooking oil', 'زيت الطبخ'], ['Salt', 'الملح'], ['Sugar', 'السكر']], a: 0, f: { en: 'It helps your immune system and heals cuts.', ar: 'يساعد جهاز المناعة ويسرّع التئام الجروح.' } },
    { d: 3, en: 'Fermentation is used to make…', ar: 'يُستخدم التخمّر لصنع…', o: [['Yogurt and bread', 'اللبن والخبز'], ['Pure water', 'ماء نقي'], ['Diamonds', 'ألماس'], ['Steel', 'فولاذ']], a: 0, f: { en: 'Microbes transform sugars into acids or gases.', ar: 'تحوّل الكائنات الدقيقة السكريات إلى أحماض أو غازات.' } },
  ],
  sports: [
    { d: 1, en: 'In football (soccer), you mainly use your…', ar: 'في كرة القدم، تستخدم أساساً…', o: [['Feet', 'قدميك'], ['Hands only', 'يديك فقط'], ['Head only', 'رأسك فقط'], ['Elbows only', 'مرفقيك فقط']], a: 0, f: { en: 'Only the goalkeeper may use hands in the penalty area.', ar: 'حارس المرمى فقط يستخدم يديه في منطقة الجزاء.' } },
    { d: 2, en: 'The Olympics originally began in ancient…', ar: 'بدأت الألعاب الأولمبية أصلاً في…', o: [['Greece', 'اليونان'], ['Japan', 'اليابان'], ['Mexico', 'المكسيك'], ['Norway', 'النرويج']], a: 0, f: { en: 'Athletes competed at Olympia to honour Zeus.', ar: 'تنافس الرياضيون في أولمبيا تكريماً لزيوس.' } },
  ],
  math: [
    { d: 3, en: 'Pi (π) is the ratio of a circle’s…', ar: 'π (باي) هو نسبة…', o: [['Circumference to diameter', 'المحيط إلى القطر'], ['Area to radius', 'المساحة إلى نصف القطر'], ['Volume to height', 'الحجم إلى الارتفاع'], ['Weight to mass', 'الوزن إلى الكتلة']], a: 0, f: { en: 'Pi starts 3.14159… and never ends.', ar: 'π يبدأ ٣٫١٤١٥٩… ولا ينتهي.' } },
  ],
  arts: [
    { d: 1, en: 'Primary colours of light include…', ar: 'الألوان الأولية للضوء تشمل…', o: [['Red, green, blue', 'أحمر، أخضر، أزرق'], ['Pink, brown, grey', 'وردي، بني، رمادي'], ['Gold, silver, bronze', 'ذهبي، فضي، برونزي'], ['Black only', 'أسود فقط']], a: 0, f: { en: 'Mixing them makes white on screens.', ar: 'مزجها يعطي أبيض على الشاشات.' } },
    { d: 2, en: 'A painting of a bowl of fruit is called a…', ar: 'لوحة لسلطة فاكهة تُسمّى…', o: [['Still life', 'طبيعة صامتة'], ['Portrait', 'صورة شخصية'], ['Landscape only', 'منظر طبيعي فقط'], ['Comic strip', 'قصة مصوّرة']], a: 0, f: { en: 'Artists study light and shape with still lifes.', ar: 'يدرس الفنانون الضوء والشكل بالطبيعة الصامتة.' } },
    { d: 3, en: 'The “Mona Lisa” was painted by…', ar: 'رُسمت لوحة «الموناليزا» على يد…', o: [['Leonardo da Vinci', 'ليوناردو دافنشي'], ['Picasso', 'بيكاسو'], ['Van Gogh', 'فان غوخ'], ['Michelangelo', 'مايكل أنجلو']], a: 0, f: { en: 'It hangs in the Louvre Museum in Paris.', ar: 'تُعرض في متحف اللوفر بباريس.' } },
  ],
  words: [
    { d: 1, en: 'A word that means the opposite is an…', ar: 'الكلمة التي تعني العكس تُسمّى…', o: [['Antonym', 'ضدّ'], ['Synonym', 'مرادف'], ['Verb', 'فعل'], ['Prefix', 'بادئة']], a: 0, f: { en: 'Hot/cold and big/small are antonym pairs.', ar: 'حار/بارد وكبير/صغير أزواج أضداد.' } },
    { d: 2, en: 'The main character in a story is the…', ar: 'الشخصية الرئيسية في القصة هي…', o: [['Protagonist', 'البطل'], ['Index', 'الفهرس'], ['Chapter', 'الفصل'], ['Margin', 'الهامش']], a: 0, f: { en: 'The antagonist usually opposes the protagonist.', ar: 'الخصم عادة يعارض البطل.' } },
    { d: 3, en: '“Break a leg” in English usually means…', ar: '«Break a leg» في الإنجليزية تعني عادة…', o: [['Good luck', 'حظاً سعيداً'], ['Go away', 'اذهب'], ['You are hurt', 'أنت مصاب'], ['Stop talking', 'توقّف عن الكلام']], a: 0, f: { en: 'It is a theatre idiom wishing success.', ar: 'تعبير مسرحي يتمنّى النجاح.' } },
  ],
  mind: [
    { d: 1, en: 'Short-term memory holds information for…', ar: 'الذاكرة قصيرة المدى تحتفظ بالمعلومات لـ…', o: [['Seconds to minutes', 'ثوانٍ إلى دقائق'], ['Many years', 'سنوات طويلة'], ['Forever always', 'للأبد دائماً'], ['Only while sleeping', 'أثناء النوم فقط']], a: 0, f: { en: 'Rehearsal or meaning helps move it to long-term memory.', ar: 'التكرار أو المعنى ينقلها للذاكرة طويلة المدى.' } },
    { d: 2, en: 'Feeling nervous before a test is a form of…', ar: 'التوتر قبل الامتحان شكل من…', o: [['Anxiety', 'القلق'], ['Hunger', 'الجوع'], ['Deafness', 'الصمم'], ['Balance', 'التوازن']], a: 0, f: { en: 'A little anxiety can sharpen focus; too much can block it.', ar: 'قلق بسيط قد يشحذ التركيز؛ أما الزائد فقد يعيقه.' } },
    { d: 3, en: 'The brain’s outer wrinkled layer is the…', ar: 'الطبقة الخارجية المجعّدة للدماغ هي…', o: [['Cerebral cortex', 'القشرة الدماغية'], ['Spinal cord', 'الحبل الشوكي'], ['Skull bone', 'عظم الجمجمة'], ['Retina', 'الشبكية']], a: 0, f: { en: 'Folds pack more thinking surface into the skull.', ar: 'التجاعيد تتيح مساحة تفكير أكبر داخل الجمجمة.' } },
  ],
  ancient: [
    { d: 1, en: 'Ancient Romans built roads and aqueducts using…', ar: 'بنى الرومان القدماء طرقاً وقنوات ماء بـ…', o: [['Stone and concrete', 'حجر وخرسانة'], ['Paper', 'ورق'], ['Silk', 'حرير'], ['Ice', 'جليد']], a: 0, f: { en: 'Some Roman roads still exist today.', ar: 'بعض الطرق الرومانية ما زالت موجودة.' } },
    { d: 2, en: 'The Sphinx in Egypt has the body of a lion and a…', ar: 'أبو الهول في مصر له جسم أسد و…', o: [['Human head', 'رأس إنسان'], ['Fish tail', 'ذيل سمكة'], ['Bird wing', 'جناح طائر'], ['Tree trunk', 'جذع شجرة']], a: 0, f: { en: 'It guards the Giza pyramid complex.', ar: 'يحرس مجمّع أهرامات الجيزة.' } },
    { d: 3, en: 'Mesopotamia is often called the “cradle of…”', ar: 'بلاد الرافدين كثيراً ما تُسمّى «مهد…»', o: [['Civilization', 'الحضارة'], ['Ice ages', 'العصور الجليدية'], ['Dinosaurs', 'الديناصورات'], ['Space travel', 'سفر الفضاء']], a: 0, f: { en: 'Writing and cities flourished between the Tigris and Euphrates.', ar: 'ازدهرت الكتابة والمدن بين نهري دجلة والفرات.' } },
  ],
  tech: [
    { d: 1, en: 'CPU stands for Central…', ar: 'CPU اختصار لـ Central…', o: [['Processing Unit', 'وحدة المعالجة'], ['Power Unit', 'وحدة الطاقة'], ['Printing Unit', 'وحدة الطباعة'], ['Playing Unit', 'وحدة التشغيل']], a: 0, f: { en: 'The CPU is the “brain” of a computer.', ar: 'المعالج «دماغ» الحاسوب.' } },
    { d: 2, en: 'Wi-Fi connects devices using…', ar: 'يصل الواي فاي الأجهزة عبر…', o: [['Radio waves', 'موجات راديو'], ['Water pipes', 'أنابيب ماء'], ['Magnets only', 'مغناطيس فقط'], ['Sound only', 'صوت فقط']], a: 0, f: { en: 'Routers send data through the air on specific frequencies.', ar: 'الموجّه يرسل البيانات في الهواء بترددات محددة.' } },
    { d: 3, en: 'Open-source software lets users…', ar: 'البرمجيات مفتوحة المصدر تتيح للمستخدمين…', o: [['View and modify the code', 'رؤية الكود وتعديله'], ['Never update', 'عدم التحديث أبداً'], ['Only use offline', 'الاستخدام دون إنترنت فقط'], ['Delete hardware', 'حذف العتاد']], a: 0, f: { en: 'Linux is a famous open-source operating system.', ar: 'لينكس نظام تشغيل مفتوح المصدر مشهور.' } },
  ],
  dino: [
    { d: 1, en: 'Dinosaurs lived mainly in the…', ar: 'عاشت الديناصورات أساساً في…', o: [['Mesozoic Era', 'العصر الوسيط'], ['Last century', 'القرن الماضي'], ['Ice Age only', 'العصر الجليدي فقط'], ['Future', 'المستقبل']], a: 0, f: { en: 'It spanned roughly 252 to 66 million years ago.', ar: 'يمتد من نحو ٢٥٢ إلى ٦٦ مليون سنة مضت.' } },
    { d: 2, en: 'Fossils are preserved remains in…', ar: 'الأحافير بقايا محفوظة في…', o: [['Rock', 'صخر'], ['Clouds', 'غيوم'], ['Wind', 'ريح'], ['Rainbows', 'قوس قزح']], a: 0, f: { en: 'Minerals slowly replace bone over millions of years.', ar: 'تستبدل المعادن العظم ببطء على ملايين السنين.' } },
    { d: 3, en: 'Birds are considered the closest living relatives of…', ar: 'الطيور أقرب أقارب…', o: [['Theropod dinosaurs', 'ديناصورات الثيروبودا'], ['Winged pterosaurs', 'التيروصورات المجنّحة'], ['Ancient crocodiles', 'التماسيح القديمة'], ['Marine plesiosaurs', 'البليزوصورات البحرية']], a: 0, f: { en: 'Feathers likely evolved before flight.', ar: 'الريش على الأرجح تطوّر قبل الطيران.' } },
  ],
};
