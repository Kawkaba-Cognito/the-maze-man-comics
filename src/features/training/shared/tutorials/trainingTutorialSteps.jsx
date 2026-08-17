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

/* Intercept diagrams.
 *
 * ⚠ Every colour here is a TOKEN, read through var() in the inline style, not a
 * hex like the Trail Making pair above. Inline styles accept var() perfectly
 * well, so there is no reason for a tutorial to be the one place in a game that
 * cannot follow the theme — and it keeps the audit:design ratchet flat. */
const icRail = (frac, covered) => (
  <span style={{
    display: 'inline-block', height: covered ? 14 : 4, width: `${frac * 100}%`,
    borderRadius: 7, verticalAlign: 'middle',
    background: covered ? 'var(--game-muted)' : 'var(--game-muted-edge)',
  }} />
);
const icGoal = (
  <span style={{
    display: 'inline-block', width: 4, height: 26, borderRadius: 2,
    background: 'var(--game-accent)', verticalAlign: 'middle',
  }} />
);
const icDot = (glyph) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 26, height: 26, borderRadius: '50%', background: 'var(--game-accent)',
    color: 'var(--play-surface-deep-flat)', fontSize: 13, fontWeight: 800, verticalAlign: 'middle',
  }}>{glyph}</span>
);
const IC_RAIL_DIAGRAM = (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
    {icDot('●')}{icRail(0.5)}{icRail(0.28, true)}{icGoal}
  </div>
);
const IC_COVER_DIAGRAM = (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
    {icRail(0.42)}{icRail(0.32, true)}{icGoal}
    <span style={{ fontSize: 18 }} aria-hidden="true">👆</span>
  </div>
);
const IC_SHAPES_DIAGRAM = (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center' }}>
    {icDot('●')}{icDot('▶')}{icDot('◆')}
  </div>
);
/* The four levers the curve introduces after the basic act is learned. They are
   taught here rather than discovered mid-run: a rule you meet for the first
   time by being marked wrong reads as unfairness, not as difficulty. */
const icGoalIn = (colour) => (
  <span style={{
    display: 'inline-block', width: 4, height: 26, borderRadius: 2,
    background: colour, verticalAlign: 'middle',
  }} />
);
const icDotIn = (glyph, colour) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 26, height: 26, borderRadius: '50%', background: colour,
    color: 'var(--play-surface-deep-flat)', fontSize: 13, fontWeight: 800, verticalAlign: 'middle',
  }}>{glyph}</span>
);
const IC_GATES_DIAGRAM = (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
    {icDotIn('●', 'var(--game-ok)')}{icRail(0.3)}{icRail(0.2, true)}
    {icGoalIn('var(--game-ok)')}{icRail(0.16, true)}{icGoalIn('var(--game-accent)')}
  </div>
);
const IC_WARP_DIAGRAM = (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
    {icRail(0.34)}
    <span style={{ fontSize: 15, color: 'var(--game-accent)', fontWeight: 800 }} aria-hidden="true">»»</span>
    {icRail(0.3, true)}{icDot('●')}{icRail(0.16, true)}{icGoal}
  </div>
);
const IC_LAUNCH_DIAGRAM = (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
    <span style={{ fontSize: 15, letterSpacing: 3, color: 'var(--game-accent)' }} aria-hidden="true">●●●●</span>
    <span style={{ fontSize: 15, color: 'var(--game-muted-edge)' }} aria-hidden="true">○</span>
    {icRail(0.3)}{icGoal}
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
      { title: 'Watch the story', body: 'A short story plays one scene at a time. Swipe left and right to move through it, and take the time you have — where it happens, who is there and what they do all matter later.', icon: '📖', pills: ['Swipe between scenes', 'Place · cast · action'] },
      { title: 'Kawkab asks', body: 'When the story ends, Kawkab asks about it: where it began, who was in a scene, what happened right after something, how many scenes had company.', icon: '🪐', pills: ['A few questions', 'Order counts'] },
      { title: 'Pick, then confirm', body: 'Tap the answer you want — nothing is committed yet — then press Confirm. You find out straight away, and the story is read back in full at the end.', icon: '✓', pills: ['Tap to pick', 'Confirm to commit'] },
      { title: 'One scene never happened', body: 'One question shows a scene and asks whether you saw it. Sometimes you did; sometimes it was quietly stitched together from two others — the right place with the wrong people. Tip: knit the scenes into one little story as you watch. Sequences stick better than lists.', icon: '🕵️', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'شاهد القصة', body: 'تُعرض قصة قصيرة مشهداً مشهداً. اسحب يميناً ويساراً للتنقّل بينها، وخُذ وقتك المتاح — المكان ومن كان فيه وما فعلوه، كلها ستهمّ لاحقاً.', icon: '📖', pills: ['اسحب بين المشاهد', 'المكان · الشخصيات · الفعل'] },
      { title: 'كوكب يسأل', body: 'عند انتهاء القصة يسألك كوكب عنها: أين بدأت، ومن كان في مشهد ما، وما الذي حدث بعد شيء معيّن مباشرة، وكم مشهداً ظهرت فيه أكثر من شخصية.', icon: '🪐', pills: ['أسئلة قليلة', 'الترتيب مهم'] },
      { title: 'اختر ثم أكّد', body: 'اضغط الجواب الذي تريده — لا شيء يُحسم بعد — ثم اضغط «تأكيد». تعرف النتيجة فوراً، وتُقرأ القصة كاملة في النهاية.', icon: '✓', pills: ['اضغط للاختيار', 'أكّد للحسم'] },
      { title: 'مشهد لم يحدث', body: 'أحد الأسئلة يعرض مشهداً ويسأل إن كنت رأيته. أحياناً رأيته فعلاً، وأحياناً رُكّب بهدوء من مشهدين — المكان الصحيح مع الأشخاص الخطأ. نصيحة: اربط المشاهد في قصة صغيرة أثناء المشاهدة، فالتسلسل أرسخ من القوائم.', icon: '🕵️', note: READY_NOTE.ar },
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
      { title: 'Connect the letters', body: 'Drag through touching letters on the grid, then lift your finger to submit the word.', icon: '🔤' },
      { title: 'Any real word counts', body: 'Letters must touch (diagonals count) and the word needs at least 3 letters — any valid word you can trace scores.', icon: '🧩' },
      { title: 'Longer words score more', body: 'Bigger words are worth more points. Levels and Survival use larger grids.', icon: '🏆', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'صِل الحروف', body: 'اسحب إصبعك عبر الحروف المتلاصقة على الشبكة، ثم ارفعه لإرسال الكلمة.', icon: '🔤' },
      { title: 'أي كلمة حقيقية تُحتسب', body: 'يجب أن تتلامس الحروف (حتى قطرياً) وأن تتكوّن الكلمة من ٣ أحرف على الأقل — أي كلمة صحيحة يمكنك رسمها تُحتسب.', icon: '🧩' },
      { title: 'الكلمات الأطول تمنح نقاطاً أكثر', body: 'الكلمات الأكبر تساوي نقاطاً أكثر. المستويات والبقاء يستخدمان شبكات أكبر.', icon: '🏆', note: READY_NOTE.ar },
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
      { title: 'Rules stack up', body: 'Five rule types — constant rows, progressions, distributions, and addition. Hard levels mix up to five at once. Accuracy beats speed.', icon: '🧩', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'اقرأ المصفوفة', body: 'أشكال في شبكة. كل صف وعمود يتبع قاعدة خفية — انظر أفقياً وعمودياً.', icon: '🔲' },
      { title: 'املأ الفراغ', body: 'خلية واحدة فارغة (?). استنتج أي شكل يكمل النمط من الخيارات بالأسفل.', icon: '❓' },
      { title: 'القواعد تتراكم', body: 'خمس أنواع قواعد — ثبات الصف، التدرّج، التوزيع، والجمع. المستويات الصعبة تمزج حتى خمس قواعد. الدقة أهم من السرعة.', icon: '🧩', note: READY_NOTE.ar },
    ],
  },
  detective: {
    en: [
      { title: 'Read the rule first', body: 'Every case opens with a rule — “exactly one of them is telling the truth”, or “the thief always lies”. The rule is always true, and nothing can be worked out without it.', icon: '⚖️', pills: ['The rule never lies', 'The suspects might'] },
      { title: 'Assume, then follow it through', body: 'Take one suspect. Assume they did it, and check every statement against the rule. If something contradicts, they are innocent. The answer is the assumption that survives.', icon: '🔎', pills: ['Assume · check · discard'] },
      { title: 'Use the notebook', body: 'From four suspects up, tap a card to mark them — once for cleared, again for suspect. It changes no score. It is there so you can park a conclusion instead of holding it in your head.', icon: '📓' },
      { title: 'The question changes', body: 'Sometimes it is who did it. Sometimes who is lying, how many are lying, or which statement cracks it alone. Sometimes you are asked whether one suspect is guilty — and the honest answer is “not enough evidence”. Read the question every time.', icon: '❓', note: READY_NOTE.en },
    ],
    ar: [
      { title: 'اقرأ القاعدة أولاً', body: 'كل قضية تبدأ بقاعدة — «واحد فقط منهم يقول الصدق»، أو «الفاعل يكذب دائماً». القاعدة صادقة دائماً، ولا يمكن استنتاج شيء بدونها.', icon: '⚖️', pills: ['القاعدة لا تكذب', 'أما المشتبهون فربما'] },
      { title: 'افترض ثم تابع', body: 'خذ مشتبهاً واحداً. افترض أنه الفاعل، وتحقّق من كل إفادة أمام القاعدة. فإن ظهر تناقض فهو بريء. والجواب هو الافتراض الذي يصمد.', icon: '🔎', pills: ['افترض · تحقّق · استبعد'] },
      { title: 'استخدم الدفتر', body: 'من أربعة مشتبهين فصاعداً، المس البطاقة لتضع علامة — مرة «بريء» ومرة «مشتبه». لا تغيّر النتيجة. هي هناك لتضع فيها استنتاجاً بدل أن تحمله في رأسك.', icon: '📓' },
      { title: 'السؤال يتغيّر', body: 'أحياناً من الفاعل. وأحياناً من يكذب، أو كم واحداً يكذب، أو أي إفادة تحسم القضية وحدها. وأحياناً يُسأل هل مشتبه بعينه مذنب — والجواب الصادق قد يكون «الأدلّة لا تكفي». اقرأ السؤال في كل مرة.', icon: '❓', note: READY_NOTE.ar },
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
  intercept: {
    en: [
      { title: 'Defend through five-wave sectors', body: 'In Rift Defense, each hidden flight is a threat to the station. Read its open stretch, intercept it at the rift, then choose a system upgrade after every fifth wave.', diagram: IC_RAIL_DIAGRAM, pills: ['5 waves per sector', 'Choose an upgrade'] },
      { title: 'It hides — you keep counting', body: 'Partway along, the shape slips under cover and you cannot see it any more. Keep running it in your head. Tap the instant it would touch the goal line.', diagram: IC_COVER_DIAGRAM, pills: ['Tap at the line', 'Not when it hides'] },
      { title: 'The shape tells you how it moves', body: 'A circle holds a steady speed. An arrow ▶ is speeding up, so it arrives sooner than the open stretch suggests. A diamond ◆ is slowing down and arrives later. Identify it before it hides.', diagram: IC_SHAPES_DIAGRAM, pills: ['● steady', '▶ speeding up', '◆ slowing down'] },
      { title: 'Later: two gates', body: 'Higher levels put a second gate on the route. The shape is filled in the colour of the gate it belongs to — green for the near one, amber for the far one. Read the colour while you can still see it.', diagram: IC_GATES_DIAGRAM, pills: ['Colour = your gate', 'Decide before it hides'] },
      { title: 'Later: it may change speed', body: 'Chevrons at the mouth of the cover warn you the shape will change speed while hidden — forward means faster, backward means slower. You get one brief glimpse mid-tunnel to correct your estimate.', diagram: IC_WARP_DIAGRAM, pills: ['»» faster', '«« slower', 'Watch for the glimpse'] },
      { title: 'Later: release on the beat', body: 'Some runs are backwards. You watch a practice pass, then four beats play. Tap to release the shape so that it crosses on the silent fifth beat — the same prediction, made in reverse.', diagram: IC_LAUNCH_DIAGRAM, pills: ['4 beats sound', 'Arrive on the 5th'], note: READY_NOTE.en },
    ],
    ar: [
      { title: 'دافع عبر قطاعات من خمس موجات', body: 'في دفاع الشق، كل حركة مخفية تهديد للمحطة. اقرأ الجزء المكشوف واعترض التهديد عند الشق، ثم اختر ترقية للنظام بعد كل موجة خامسة.', diagram: IC_RAIL_DIAGRAM, pills: ['٥ موجات لكل قطاع', 'اختر ترقية'] },
      { title: 'يختفي — وأنت تُكمل العدّ', body: 'في منتصف الطريق يدخل تحت الغطاء ولا تعود تراه. أكمل تتبّعه في ذهنك، واضغط لحظة وصوله إلى خط الهدف.', diagram: IC_COVER_DIAGRAM, pills: ['اضغط عند الخط', 'لا عند الاختفاء'] },
      { title: 'الشكل يخبرك بحركته', body: 'الدائرة سرعتها ثابتة. السهم ▶ يتسارع فيصل أبكر مما يوحي الجزء المكشوف. والمعيّن ◆ يتباطأ فيصل متأخّراً. تعرّف عليه قبل أن يختفي.', diagram: IC_SHAPES_DIAGRAM, pills: ['● ثابت', '▶ متسارع', '◆ متباطئ'] },
      { title: 'لاحقاً: بوابتان', body: 'في المستويات الأعلى تظهر بوابة ثانية على المسار. يُملأ الشكل بلون البوابة التي تخصّه — الأخضر للقريبة والكهرماني للبعيدة. اقرأ اللون وهو ما يزال ظاهراً.', diagram: IC_GATES_DIAGRAM, pills: ['اللون = بوابتك', 'قرّر قبل اختفائه'] },
      { title: 'لاحقاً: قد تتغيّر سرعته', body: 'الأسهم عند مدخل الغطاء تنبّهك أنّ الشكل سيغيّر سرعته وهو مختفٍ — إلى الأمام أسرع، وإلى الخلف أبطأ. تحصل على لمحة قصيرة في منتصف النفق لتصحيح تقديرك.', diagram: IC_WARP_DIAGRAM, pills: ['»» أسرع', '«« أبطأ', 'انتبه للّمحة'] },
      { title: 'لاحقاً: أطلقه مع النبضة', body: 'بعض الجولات معكوسة. تشاهد تمريرة تجريبية، ثم تُسمع أربع نبضات. اضغط لإطلاق الشكل بحيث يعبر مع النبضة الخامسة الصامتة — التوقّع نفسه، بالمقلوب.', diagram: IC_LAUNCH_DIAGRAM, pills: ['أربع نبضات مسموعة', 'الوصول مع الخامسة'], note: READY_NOTE.ar },
    ],
  },
};

export function getTrainingDiagramSteps(gameId, isAr) {
  const pack = STEPS[gameId];
  if (!pack) return null;
  return isAr ? pack.ar : pack.en;
}
