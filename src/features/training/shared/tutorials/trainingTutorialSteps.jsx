const READY_NOTE = {
  en: 'Next you will pick Survival, Levels, or Pass n Play and play for real points.',
  ar: 'بعد ذلك ستختار البقاء أو المستويات أو مرّر والعب وتلعب فعلياً.',
};

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
      { title: 'Route the trains', body: 'Trains arrive from the left. Each must reach its matching station colour on the right.', icon: '🚂' },
      { title: 'Flip switches', body: 'Tap track switches to change where a train goes. Plan ahead — wrong routes fail the round.', icon: '🔀' },
      { title: 'Keep up the pace', body: 'More trains and faster speeds as you improve. Survival adapts; Levels unlock in order.', icon: '⚡', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'وجّه القطارات', body: 'القطارات تأتي من اليسار. كل واحد يجب أن يصل محطته الملونة على اليمين.', icon: '🚂' },
      { title: 'بدّل المسارات', body: 'اضغط المفاتيح لتغيير مسار القطار. خطّط مسبقاً — المسار الخاطئ يفشل الجولة.', icon: '🔀' },
      { title: 'حافظ على الإيقاع', body: 'قطارات أكثر وأسرع كلما تحسّنت. البقاء يتكيّف؛ المستويات تُفتح بالترتيب.', icon: '⚡', note: READY_NOTE.ar },
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
      { title: 'Connect in order', body: 'Tap circles in numeric order: 1 → 2 → 3 … Race the clock to finish the trail.', icon: '🔗' },
      { title: 'Alternate on hard', body: 'Harder levels alternate numbers and letters (1-A-2-B…). Read the prompt each round.', icon: '🔤' },
      { title: 'Wrong tap penalty', body: 'Tapping out of order costs time. Plan your path before you start clicking.', icon: '⏱️', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'صل بالترتيب', body: 'اضغط الدوائر بالترتيب الرقمي: ١ ← ٢ ← ٣ … سباق الزمن لإنهاء المسار.', icon: '🔗' },
      { title: 'تناوب في الصعب', body: 'المستويات الصعبة تناوب أرقاماً وحروفاً (١-أ-٢-ب…). اقرأ التعليمات كل جولة.', icon: '🔤' },
      { title: 'عقوبة الخطأ', body: 'الضغط خارج الترتيب يكلّف وقتاً. خطّط مسارك قبل النقر.', icon: '⏱️', note: READY_NOTE.ar },
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
      { title: 'N steps back', body: 'Objects stream one at a time. N-Back means: tap MATCH when the current item is the same as the one from N steps ago.', icon: '🔄' },
      { title: 'When to tap', body: 'If N=2, compare to two items back. Only tap when they match — silence when they don\'t.', icon: '👆', pills: ['Match → tap MATCH', 'No match → wait'] },
      { title: 'Accuracy matters', body: 'Hits, misses, and false taps all count. Survival raises N as you improve.', icon: '📊', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'N خطوات للوراء', body: 'العناصر تتتابع واحداً تلو الآخر. N-Back: اضغط مطابقة عندما يطابق العنصر الحالي ما قبل N خطوات.', icon: '🔄' },
      { title: 'متى تضغط', body: 'إذا N=٢، قارن بعنصرين للوراء. اضغط فقط عند التطابق — انتظر عند عدمه.', icon: '👆', pills: ['تطابق ← اضغط مطابقة', 'لا تطابق ← انتظر'] },
      { title: 'الدقة مهمة', body: 'الإصابات والإخفاقات والضغط الخاطئ تُحسب. البقاء يرفع N كلما تحسّنت.', icon: '📊', note: READY_NOTE.ar },
    ],
  },
  'paired-associates': {
    en: [
      { title: 'Learn the pairs', body: 'Each round shows pairs (e.g. 🍎 → 🔴). Study them — you\'ll need to recall them.', icon: '📚' },
      { title: 'Recall the match', body: 'One item appears; pick its partner from the choices. Wrong picks cost points.', icon: '🧩' },
      { title: 'More pairs, harder recall', body: 'Levels add pairs and shrink study time. Pass n Play uses the same board for everyone.', icon: '🏆', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'احفظ الأزواج', body: 'كل جولة تعرض أزواجاً (مثلاً 🍎 ← 🔴). ادرسها — ستحتاج تذكّرها.', icon: '📚' },
      { title: 'تذكّر الشريك', body: 'يظهر عنصر واحد؛ اختر شريكه من الخيارات. الخطأ يكلّف نقاطاً.', icon: '🧩' },
      { title: 'أزواج أكثر', body: 'المستويات تضيف أزواجاً وتقلّل وقت الدراسة. مرّر والعب يستخدم نفس اللوحة للجميع.', icon: '🏆', note: READY_NOTE.ar },
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
