const READY_NOTE = {
  en: 'Next you will pick Survival, Levels, or Pass n Play and play for real points.',
  ar: 'بعد ذلك ستختار البقاء أو المستويات أو مرّر والعب وتلعب فعلياً.',
};

/* Language-free diagrams for the Trail Making rule explanations (EN + AR). The
 * colours below match the in-game Color Trails palette (CVD-safe blue / amber). */
const tmCirc = (bg, label, txt = '#fff') => (
  <span style={{
    width: 30, height: 30, borderRadius: '50%', background: bg, color: txt,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: 14, border: '2px solid rgba(0,0,0,0.2)',
  }}>{label}</span>
);
const tmArrow = <span style={{ fontWeight: 900, color: '#7a5a1e' }}>→</span>;
const TM_COLOR_DIAGRAM = (
  <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
    {tmCirc('#0072B2', '1')}{tmArrow}{tmCirc('#E69F00', '2')}{tmArrow}
    {tmCirc('#0072B2', '3')}{tmArrow}{tmCirc('#E69F00', '4')}
  </div>
);
const TM_DECOY_DIAGRAM = (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
    {tmCirc('#1b2940', '5', '#eaf3ff')}
    {tmCirc('#eef1f4', '✕', '#9aa6b2')}
    {tmCirc('#1b2940', '6', '#eaf3ff')}
  </div>
);

const STEPS = {
  'cancel-task': {
    en: [
      { title: 'Find the target', body: 'The TARGET shape sits at the top — memorize it before you scan.', icon: '🎯' },
      { title: 'Tap every match', body: 'Scan the grid and tap every shape that matches the target. Ignore everything else.', icon: '👆', pills: ['Tap targets only', 'Wrong taps shake the board'] },
      { title: 'Beat the clock', body: 'Clear all targets before time runs out. Speed and accuracy both count.', icon: '⏱️', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'اعثر على الهدف', body: 'شكل الهدف في الأعلى — احفظه قبل أن تمسح الشبكة.', icon: '🎯' },
      { title: 'اضغط كل مطابق', body: 'امسح الشبكة واضغط كل شكل يطابق الهدف. تجاهل البقية.', icon: '👆', pills: ['اضغط الأهداف فقط', 'النقر الخاطئ يهزّ اللوحة'] },
      { title: 'سباق الزمن', body: 'امسح كل الأهداف قبل انتهاء الوقت. السرعة والدقة معاً مهمان.', icon: '⏱️', note: READY_NOTE.ar },
    ],
  },
  mot: {
    en: [
      { title: 'Flash targets', body: 'A few dots flash yellow — these are your TARGETS. Remember which ones they are.', icon: '✨' },
      { title: 'Track while moving', body: 'All dots move and bounce. Keep your eyes on the targets — they stop flashing once movement starts.', icon: '👀' },
      { title: 'Tap when frozen', body: 'When dots freeze, tap every target you tracked. Wrong picks cost you.', icon: '🎯', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'وميض الأهداف', body: 'بعض النقاط تومض بالأصفر — هذه أهدافك. تذكّر أيها هي.', icon: '✨' },
      { title: 'تابع أثناء الحركة', body: 'كل النقاط تتحرك. راقب الأهداف — يتوقف الوميض عند بدء الحركة.', icon: '👀' },
      { title: 'اضغط عند التجمّد', body: 'عندما تتوقف النقاط، اضغط كل هدف تابعته. الاختيار الخاطئ يكلّفك.', icon: '🎯', note: READY_NOTE.ar },
    ],
  },
  'train-switch': {
    en: [
      { title: 'Park the cars', body: 'Cars drive out of the garage. Each must reach the parking bay that matches its colour.', icon: '🚗' },
      { title: 'Set the junctions', body: 'Tap a junction ◯ to change where a car turns. Plan ahead — wrong turns fail the round.', icon: '🔀' },
      { title: 'Keep up the pace', body: 'More cars and faster speeds as you improve. Survival adapts; Levels unlock in order.', icon: '⚡', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'اركن السيارات', body: 'السيارات تخرج من المرآب. كل واحدة يجب أن تصل موقفها الملوّن المطابق.', icon: '🚗' },
      { title: 'اضبط المفترقات', body: 'اضغط المفترق ◯ لتغيير وجهة السيارة. خطّط مسبقاً — المنعطف الخاطئ يفشل الجولة.', icon: '🔀' },
      { title: 'حافظ على الإيقاع', body: 'سيارات أكثر وأسرع كلما تحسّنت. البقاء يتكيّف؛ المستويات تُفتح بالترتيب.', icon: '⚡', note: READY_NOTE.ar },
    ],
  },
  'speed-match': {
    en: [
      { title: 'The key', body: 'Every symbol maps to a number. Glance at the KEY at the top whenever you need it.', icon: '🔑' },
      { title: 'Match the card', body: 'A symbol appears in the centre. Find its number in the key, then tap that digit on the pad.', icon: '🃏' },
      { title: 'Speed builds combo', body: 'Answer as fast as you can without mistakes. Correct streaks boost your score.', icon: '⚡', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'المفتاح', body: 'كل رمز يطابق رقماً. انظر إلى المفتاح في الأعلى كلما احتجت.', icon: '🔑' },
      { title: 'طابق البطاقة', body: 'يظهر رمز في الوسط. ابحث عن رقمه في المفتاح ثم اضغطه في لوحة الأرقام.', icon: '🃏' },
      { title: 'السرعة تبني السلسلة', body: 'أجب بأسرع ما يمكن بلا أخطاء. الإجابات الصحيحة المتتالية ترفع نقاطك.', icon: '⚡', note: READY_NOTE.ar },
    ],
  },
  wisconsin: {
    en: [
      { title: 'Sort the card', body: 'A card appears at the bottom. Tap the reference card it belongs with — match by COLOUR, SHAPE, or NUMBER.', icon: '🃏' },
      { title: 'Find the hidden rule', body: 'You are not told which rule is right — you only get "right" or "wrong". Use the feedback to work out the rule.', icon: '🔎', pills: ['Colour? Shape? Number?', 'Learn from right / wrong'] },
      { title: 'The rule changes', body: 'Once you are on a roll the rule SILENTLY switches. When sorts start failing, drop it and hunt for the new one.', icon: '🔄', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'افرز البطاقة', body: 'تظهر بطاقة في الأسفل. اضغط البطاقة المرجعية التي تنتمي إليها — طابق حسب اللون أو الشكل أو العدد.', icon: '🃏' },
      { title: 'اكتشف القاعدة الخفية', body: 'لا يُقال لك أيّ قاعدة صحيحة — تحصل فقط على «صحيح» أو «خطأ». استخدم التغذية الراجعة لاكتشاف القاعدة.', icon: '🔎', pills: ['لون؟ شكل؟ عدد؟', 'تعلّم من صحيح/خطأ'] },
      { title: 'القاعدة تتغيّر', body: 'حين تتوالى إجاباتك الصحيحة تتبدّل القاعدة بصمت. عندما يبدأ الفرز بالفشل، أسقطها وابحث عن الجديدة.', icon: '🔄', note: READY_NOTE.ar },
    ],
  },
  brixton: {
    en: [
      { title: 'Watch Kawkab', body: 'Kawkab hops between the circles along a hidden pattern. Watch where he lands — a faint trail marks his path.', icon: '👀' },
      { title: 'Continue the pattern', body: 'Your turn: tap the next few circles to carry the pattern on. Get them all right to crack it.', icon: '🎯', pills: ['Read the rule, not his path', 'Tap in order'] },
      { title: 'It changes when you win', body: 'Crack a pattern and the rule SILENTLY changes — watch the new demo. Miss, and he repeats the same one.', icon: '🔄', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'راقب كوكب', body: 'يقفز كوكب بين الدوائر وفق نمط خفيّ. راقب أين يهبط — أثرٌ خافت يرسم مساره.', icon: '👀' },
      { title: 'أكمل النمط', body: 'دورك: اضغط الدوائر التالية لتُكمل النمط. أصِبها كلها لتحلّه.', icon: '🎯', pills: ['اقرأ القاعدة لا مساره', 'اضغط بالترتيب'] },
      { title: 'يتغيّر حين تفوز', body: 'حين تحلّ نمطاً تتغيّر القاعدة بصمت — راقب العرض الجديد. وإن أخطأت يعيد النمط نفسه.', icon: '🔄', note: READY_NOTE.ar },
    ],
  },
  'piano-tap': {
    en: [
      { title: 'Hit the lanes', body: 'Notes fall in four lanes (D · F · J · K). Tap the matching lane when a note reaches the line.', icon: '🎹' },
      { title: 'Stay in rhythm', body: 'Early or late taps count as misses. Perfect timing earns the best score.', icon: '🎵', pills: ['Tap on the beat', 'Don\'t tap empty lanes'] },
      { title: 'Survive and level up', body: 'Miss too many and the run ends. Levels ramp speed and pattern complexity.', icon: '🏆', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'اضرب المسارات', body: 'النوتات تنزل في أربعة مسارات. اضغط المسار المطابق عندما تصل النوتة للخط.', icon: '🎹' },
      { title: 'ابقَ على الإيقاع', body: 'الضغط المبكر أو المتأخر يُعدّ خطأ. التوقيت المثالي يمنح أفضل نتيجة.', icon: '🎵', pills: ['اضغط على الإيقاع', 'لا تضغط مسارات فارغة'] },
      { title: 'ابقَ وارتقِ', body: 'أخطاء كثيرة تنهي المحاولة. المستويات تزيد السرعة وتعقّد الأنماط.', icon: '🏆', note: READY_NOTE.ar },
    ],
  },
  'trail-making': {
    en: [
      { title: 'Connect in order', body: 'Tap the circles in number order: 1 → 2 → 3 … A green line traces your path. Finish the whole trail before the timer hits zero.', icon: '🔗', pills: ['Always start at 1', 'Beat the clock ⏱'] },
      { title: 'The COLOUR rule', body: 'On some boards every number appears TWICE — once blue, once amber. Now you must ALTERNATE colours as you climb: blue 1 → amber 2 → blue 3 … The “Colour” chip at the top shows which colour to tap next. Tapping the right number in the wrong colour is an error.', diagram: TM_COLOR_DIAGRAM, pills: ['Right number, right colour', 'Colour chip = tap next'] },
      { title: 'Ignore the ✕ traps', body: 'Harder boards add grey ✕ decoy circles mixed in. They are traps — never tap them. A wrong tap (a ✕, the wrong colour, or out of order) flashes red and cuts your remaining time.', diagram: TM_DECOY_DIAGRAM, pills: ['✕ = trap, skip it', 'Wrong tap = −2s'] },
      { title: 'A banner warns you', body: 'Whenever the rule changes — colours turn on, or ✕ traps appear — a banner pauses the clock and tells you the NEW rule. Read it, then go. Boards with the same rule flow on with no pause, so you only stop when something actually changes.', icon: '🚦', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'صل بالترتيب', body: 'اضغط الدوائر بترتيب الأرقام: ١ ← ٢ ← ٣ … خطٌّ أخضر يرسم مسارك. أنهِ المسار كاملاً قبل أن ينتهي الوقت.', icon: '🔗', pills: ['ابدأ دائماً من ١', 'اسبق الزمن ⏱'] },
      { title: 'قاعدة الألوان', body: 'في بعض اللوحات يظهر كل رقم مرّتين — مرة بالأزرق ومرة بالكهرماني. الآن عليك أن تبدّل اللون مع كل رقم: أزرق ١ ← كهرماني ٢ ← أزرق ٣ … وشارة «اللون» في الأعلى تدلّك على اللون التالي. الرقم الصحيح باللون الخطأ يُحتسب خطأً.', diagram: TM_COLOR_DIAGRAM, pills: ['الرقم الصحيح باللون الصحيح', 'شارة اللون = اضغط التالي'] },
      { title: 'تجاهل فخاخ ✕', body: 'اللوحات الأصعب تضيف دوائر ✕ رمادية خادعة. إنها فخاخ — لا تضغطها أبداً. أي ضغطة خاطئة (✕ أو لون خطأ أو خارج الترتيب) تومض بالأحمر وتقتطع من وقتك المتبقي.', diagram: TM_DECOY_DIAGRAM, pills: ['✕ = فخّ، تجاوزه', 'ضغطة خاطئة = ‎−٢ث'] },
      { title: 'لافتة تنبّهك', body: 'كلما تغيّرت القاعدة — اشتغلت الألوان أو ظهرت فخاخ ✕ — تظهر لافتة توقِف المؤقّت وتخبرك بالقاعدة الجديدة. اقرأها ثم انطلق. اللوحات ذات القاعدة نفسها تتوالى بلا توقّف، فلا تتوقّف إلا عند تغيّر فعلي.', icon: '🚦', note: READY_NOTE.ar },
    ],
  },
  'story-grid': {
    en: [
      { title: 'Watch Kawkab\'s story', body: 'A short story plays one panel at a time — Kawkab eats, then studies, then sleeps… Watch the ORDER the panels appear in.', icon: '📖', pills: ['One panel at a time', 'Remember the order'] },
      { title: 'Rebuild it in order', body: 'The panels get shuffled into a tray. Tap them in the order the story happened — first panel first, and so on into the numbered slots.', icon: '🔢', pills: ['Tap in story order', 'Tap a slot to undo'] },
      { title: 'Watch for decoys', body: 'Harder rounds slip in extra scenes that never happened. Don\'t place those — only the panels you actually saw, in their real order.', icon: '🕵️' },
      { title: 'Stories grow', body: 'More panels, faster telling, and more decoys come as you climb. Tip: link the panels into a little story in your head — sequences stick better than lists.', icon: '🧠', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'شاهد قصة كوكب', body: 'تُعرض قصة قصيرة لوحةً لوحة — كوكب يأكل، ثم يدرس، ثم ينام… راقب ترتيب ظهور اللوحات.', icon: '📖', pills: ['لوحة في كل مرة', 'احفظ الترتيب'] },
      { title: 'أعد ترتيبها', body: 'تُخلط اللوحات في صينية. اضغطها بالترتيب الذي حدثت فيه القصة — الأولى أولاً، وهكذا في الخانات المرقّمة.', icon: '🔢', pills: ['اضغط بترتيب القصة', 'اضغط خانة للتراجع'] },
      { title: 'انتبه للخدع', body: 'الجولات الأصعب تدسّ مشاهد لم تحدث. لا تضعها — فقط اللوحات التي رأيتها فعلاً، بترتيبها الحقيقي.', icon: '🕵️' },
      { title: 'القصص تطول', body: 'لوحات أكثر وسرد أسرع وخدع أكثر كلما تقدّمت. نصيحة: اربط اللوحات في قصة صغيرة في ذهنك — التسلسل أرسخ من القوائم.', icon: '🧠', note: READY_NOTE.ar },
    ],
  },
  'memo-span': {
    en: [
      { title: 'Watch the sequence', body: 'Cells on the grid light up one by one. Watch carefully — don\'t tap yet.', icon: '💡' },
      { title: 'Repeat it back', body: 'When playback ends, tap the same cells in the same order. Reverse mode flips the order.', icon: '🔁', pills: ['Forward = same order', 'Reverse = backwards'] },
      { title: 'Sequence grows', body: 'Each success adds another step. One mistake ends the round — focus beats speed.', icon: '🧠', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'راقب التسلسل', body: 'خلايا الشبكة تضيء واحدة تلو الأخرى. راقب جيداً — لا تضغط بعد.', icon: '💡' },
      { title: 'كرّره', body: 'عند انتهاء العرض، اضغط نفس الخلايا بنفس الترتيب. الوضع العكسي يعكس الترتيب.', icon: '🔁', pills: ['أمامي = نفس الترتيب', 'عكسي = بالعكس'] },
      { title: 'التسلسل يطول', body: 'كل نجاح يضيف خطوة. خطأ واحد ينهي الجولة — التركيز أهم من السرعة.', icon: '🧠', note: READY_NOTE.ar },
    ],
  },
  nback: {
    en: [
      { title: 'Dual N-Back', body: 'An object lights up in one cell of a 3×3 grid, one step at a time. You track two things at once: the place it lands and the object itself.', icon: '🔳' },
      { title: 'Two buttons', body: 'Tap PLACE when the cell is the same as N steps back. Tap OBJECT when the object is the same as N back. Each stream is judged on its own.', icon: '👆', pills: ['Same place → PLACE', 'Same object → OBJECT'] },
      { title: 'Accuracy matters', body: 'Hits, misses and false taps count for each stream. Survival raises N as you improve.', icon: '📊', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'العودة-N المزدوجة', body: 'يضيء شيء في خانة من شبكة ٣×٣، خطوةً خطوة. تتابع أمرين معاً: مكان ظهوره والشيء نفسه.', icon: '🔳' },
      { title: 'زرّان', body: 'اضغط «المكان» عندما تكون الخانة مثل قبل N خطوات، و«الشيء» عندما يكون الشيء مثل قبل N. يُحسب كل تدفّق على حدة.', icon: '👆', pills: ['نفس المكان ← المكان', 'نفس الشيء ← الشيء'] },
      { title: 'الدقة مهمة', body: 'الإصابات والإخفاقات والضغط الخاطئ تُحسب لكل تدفّق. البقاء يرفع N كلما تحسّنت.', icon: '📊', note: READY_NOTE.ar },
    ],
  },
  'paired-associates': {
    en: [
      { title: 'Watch the boxes', body: 'The boxes open one at a time to reveal a symbol hidden inside. Remember what was where.', icon: '📦' },
      { title: 'Find the symbol', body: 'Then a symbol appears — tap the box it was hiding in. Green = right; red marks a miss and shows the real spot.', icon: '👆', pills: ['Right → green', 'Wrong → red'] },
      { title: 'More pairs, less time', body: 'Get them all right and more symbols are added. Levels add boxes and shorten the study time.', icon: '🏆', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'راقب الصناديق', body: 'تُفتح الصناديق واحداً تلو الآخر لتكشف رمزاً مخبّأً في داخلها. تذكّر ما كان وأين.', icon: '📦' },
      { title: 'جد الرمز', body: 'ثم يظهر رمز — اضغط الصندوق الذي كان مختبئاً فيه. أخضر = صحيح؛ الأحمر يشير إلى الخطأ ويُظهر مكانه الحقيقي.', icon: '👆', pills: ['صحيح ← أخضر', 'خطأ ← أحمر'] },
      { title: 'أزواج أكثر ووقت أقل', body: 'إذا أصبتها كلها تُضاف رموز أكثر. المستويات تزيد الصناديق وتقصّر وقت الحفظ.', icon: '🏆', note: READY_NOTE.ar },
    ],
  },
  wordle: {
    en: [
      { title: 'Guess the word', body: 'Type a valid word and submit. You have limited tries to find the hidden answer.', icon: '🔤' },
      { title: 'Read the colours', body: 'Green = correct letter, correct spot. Yellow = right letter, wrong spot. Grey = not in the word.', icon: '🟩', pills: ['🟩 correct spot', '🟨 wrong spot', '⬜ not in word'] },
      { title: 'Use the clues', body: 'Each guess narrows the answer. Levels and Survival use longer words and fewer guesses.', icon: '💡', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'خمّن الكلمة', body: 'اكتب كلمة صحيحة وأرسلها. لديك محاولات محدودة لإيجاد الإجابة المخفية.', icon: '🔤' },
      { title: 'اقرأ الألوان', body: 'أخضر = حرف صحيح في مكانه. أصفر = حرف صحيح في مكان آخر. رمادي = ليس في الكلمة.', icon: '🟩', pills: ['🟩 مكان صحيح', '🟨 حرف صحيح', '⬜ ليس في الكلمة'] },
      { title: 'استخدم التلميحات', body: 'كل تخمين يضيّق الإجابة. المستويات والبقاء يستخدمان كلمات أطول ومحاولات أقل.', icon: '💡', note: READY_NOTE.ar },
    ],
  },
  synonyms: {
    en: [
      { title: 'Find the link', body: 'Each trial shows words or an analogy. Pick the answer that best completes the relationship.', icon: '🔗' },
      { title: 'Think fast', body: 'A timer runs on each question. Higher tiers use trickier vocabulary and analogies.', icon: '⏱️' },
      { title: 'Verbal reasoning', body: 'Similarities trains flexible word knowledge — same task in Survival, Levels, and Pass n Play.', icon: '📖', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'اعثر على الرابط', body: 'كل محاولة تعرض كلمات أو قياساً. اختر الإجابة التي تكمل العلاقة أفضل.', icon: '🔗' },
      { title: 'فكّر بسرعة', body: 'مؤقت يعمل على كل سؤال. المستويات الأعلى تستخدم مفردات وقياسات أصعب.', icon: '⏱️' },
      { title: 'استدلال لفظي', body: 'وجه الشبه يدرّب مرونة المعرفة اللفظية — نفس المهمة في البقاء والمستويات ومرّر والعب.', icon: '📖', note: READY_NOTE.ar },
    ],
  },
  'odd-one-out': {
    en: [
      { title: 'Four words', body: 'Four words appear — three belong together, one does not. Spot the odd one out.', icon: '4️⃣' },
      { title: 'Category logic', body: 'Think about meaning, category, or spelling. The outlier breaks the pattern the others share.', icon: '🧠' },
      { title: 'Speed under pressure', body: 'Wrong picks and slow answers hurt your score. Levels add subtler categories.', icon: '⚡', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'أربع كلمات', body: 'تظهر أربع كلمات — ثلاث تنتمي معاً وواحدة لا. اكتشف الشاذّ.', icon: '4️⃣' },
      { title: 'منطق الفئة', body: 'فكّر بالمعنى أو الفئة أو الإملاء. الشاذّ يكسر النمط الذي تشترك فيه البقية.', icon: '🧠' },
      { title: 'سرعة تحت ضغط', body: 'الاختيار الخاطئ والبطء يضرّان نتيجتك. المستويات تضيف فئات أدق.', icon: '⚡', note: READY_NOTE.ar },
    ],
  },
  'rush-hour': {
    en: [
      { title: 'Free the exit', body: 'Slide cars and trucks on the grid. Move the red car to the exit on the right.', icon: '🚗' },
      { title: 'Drag to slide', body: 'Tap and drag a vehicle along its row or column. Only empty space lets it move.', icon: '👆', pills: ['Cars move ↔', 'Trucks move ↔ (longer)'] },
      { title: 'Fewer moves win', body: 'Plan ahead — blocked paths waste moves. Levels pack tighter puzzles; Survival never ends.', icon: '🏁', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'حرّر المخرج', body: 'حرّك السيارات والشاحنات على الشبكة. أوصل السيارة الحمراء إلى المخرج على اليمين.', icon: '🚗' },
      { title: 'اسحب للتحريك', body: 'اضغط واسحب مركبة على صفها أو عمودها. تتحرك فقط في فراغ.', icon: '👆', pills: ['السيارات ↔', 'الشاحنات ↔ (أطول)'] },
      { title: 'حركات أقل تفوز', body: 'خطّط مسبقاً — المسارات المسدودة تهدر حركات. المستويات أصعب؛ البقاء لا ينتهي.', icon: '🏁', note: READY_NOTE.ar },
    ],
  },
  'raven-matrices': {
    en: [
      { title: 'Read the matrix', body: 'Figures sit in a grid. Each row and column follows a hidden rule — look across and down.', icon: '🔲' },
      { title: 'Fill the gap', body: 'One cell is blank (?). Deduce which figure completes the pattern from the options below.', icon: '❓' },
      { title: 'Rules stack up', body: 'Easy uses one changing trait; hard mixes shape, count, colour, and rotation. Accuracy beats speed.', icon: '🧩', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'اقرأ المصفوفة', body: 'أشكال في شبكة. كل صف وعمود يتبع قاعدة خفية — انظر أفقياً وعمودياً.', icon: '🔲' },
      { title: 'املأ الفراغ', body: 'خلية واحدة فارغة (?). استنتج أي شكل يكمل النمط من الخيارات بالأسفل.', icon: '❓' },
      { title: 'القواعد تتراكم', body: 'السهل يغيّر سمة واحدة؛ الصعب يمزج الشكل والعدد واللون والدوران. الدقة أهم من السرعة.', icon: '🧩', note: READY_NOTE.ar },
    ],
  },
  'tower-hanoi': {
    en: [
      { title: 'Sort the colours', body: 'Coloured tokens sit in tubes. Move them so each tube holds one colour only (or the goal pattern for that level).', icon: '🧪' },
      { title: 'Stack rules', body: 'Move one token at a time. You can only place a token on an empty tube or on a matching colour.', icon: '📏', pills: ['One token per move', 'Match colour on top'] },
      { title: 'Plan your pours', body: 'Fewer moves earn more stars. Undo is available — think before you pour.', icon: '⭐', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'فرز الألوان', body: 'رموز ملونة في أنابيب. انقلها حتى يحمل كل أنبوب لوناً واحداً (أو هدف المرحلة).', icon: '🧪' },
      { title: 'قواعد التكديس', body: 'انقل رمزاً واحداً في كل مرة. يمكنك وضعه في أنبوب فارغ أو على لون مطابق.', icon: '📏', pills: ['رمز واحد لكل حركة', 'طابق اللون في الأعلى'] },
      { title: 'خطّط للصب', body: 'حركات أقل = نجوم أكثر. التراجع متاح — فكّر قبل الصب.', icon: '⭐', note: READY_NOTE.ar },
    ],
  },
  'spatial-stroop': {
    en: [
      { title: 'Follow the rule', body: 'An arrow appears with a rule badge: tap the side it POINTS to, or the side it SITS on — read the badge every trial.', icon: '➡️' },
      { title: 'Rules flip', body: 'The active rule can change without warning. Suppress your last habit and read the new rule fast.', icon: '🔀', pills: ['POINT = direction arrow faces', 'SIDE = screen side arrow sits on'] },
      { title: 'Reverse mode', body: 'Hard tiers add reverse trials — the correct side is the opposite of what the rule says. Watch for the reverse badge.', icon: '↩️', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'اتبع القاعدة', body: 'يظهر سهم مع شارة قاعدة: اضغط الجانب الذي يشير إليه، أو الجانب الذي يجلس عليه — اقرأ الشارة كل محاولة.', icon: '➡️' },
      { title: 'القواعد تتبدّل', body: 'القاعدة النشطة قد تتغيّر دون إنذار. تجاهل عادتك السابقة واقرأ القاعدة الجديدة بسرعة.', icon: '🔀', pills: ['اتجاه = حيث يشير السهم', 'موضع = جانب الشاشة'] },
      { title: 'وضع عكسي', body: 'المستويات الصعبة تضيف محاولات عكسية — الجانب الصحيح عكس ما تقوله القاعدة. راقب شارة العكس.', icon: '↩️', note: READY_NOTE.ar },
    ],
  },
  flip: {
    en: [
      { title: 'Catch the gems', body: 'Move your paddle to catch falling gems. Drag or tap sides of the canvas to move.', icon: '💎' },
      { title: 'Controls invert', body: 'After a cue, left/right swap — or up/down on square stages. Watch the mirror badge and rule toasts.', icon: '🔄', pills: ['Circle = left/right flip', 'Square = up/down flip'] },
      { title: 'Ignore decoys', body: 'Some balls are traps — only catch gems. Flexibility means adapting the moment rules change.', icon: '🎯', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'أمسك الجواهر', body: 'حرّك المجداف لالتقاط الجواهر الساقطة. اسحب أو اضغط جانبي اللوحة للتحريك.', icon: '💎' },
      { title: 'ينقلب التحكم', body: 'بعد إشارة، يسار/يمين يتبادلان — أو أعلى/أسفل في المراحل المربعة. راقب شارة المرآة.', icon: '🔄', pills: ['دائرة = انقلاب يسار/يمين', 'مربع = انقلاب أعلى/أسفل'] },
      { title: 'تجاهل الفخاخ', body: 'بعض الكرات فخ — التقط الجواهر فقط. المرونة تعني التكيّف فور تغيّر القواعد.', icon: '🎯', note: READY_NOTE.ar },
    ],
  },
  'math-gates': {
    en: [
      { title: 'Pick the gate', body: 'A math problem appears at the top. Two gates show answers — move to the correct one before time runs out.', icon: '➕' },
      { title: 'Move fast', body: 'Use arrow keys or swipe to reach the right gate. Wrong gates end the round or cost lives.', icon: '🏃' },
      { title: 'Operations stack', body: 'Harder levels mix + − × ÷ and bigger numbers. Survival keeps adapting difficulty.', icon: '🧮', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'اختر البوابة', body: 'مسألة حسابية في الأعلى. بوابتان تعرضان إجابات — انتقل للصحيحة قبل انتهاء الوقت.', icon: '➕' },
      { title: 'تحرّك بسرعة', body: 'استخدم الأسهم أو اسحب للبوابة الصحيحة. البوابة الخاطئة تنهي الجولة أو تخصم أرواحاً.', icon: '🏃' },
      { title: 'عمليات متنوعة', body: 'المستويات الصعبة تمزج + − × ÷ وأرقام أكبر. البقاء يتكيّف مع صعوبتك.', icon: '🧮', note: READY_NOTE.ar },
    ],
  },
};

export function getTrainingDiagramSteps(gameId, isAr) {
  const pack = STEPS[gameId];
  if (!pack) return null;
  return isAr ? pack.ar : pack.en;
}
