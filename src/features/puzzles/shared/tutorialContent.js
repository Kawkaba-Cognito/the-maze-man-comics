const STORAGE_KEY = 'mm_puzzle_tutorial_seen_v1';

export function loadPuzzleTutorialSeen() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

export function markPuzzleTutorialSeen(puzzleId) {
  try {
    const map = loadPuzzleTutorialSeen();
    map[puzzleId] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function hasSeenPuzzleTutorial(puzzleId) {
  return Boolean(loadPuzzleTutorialSeen()[puzzleId]);
}

export const TUTORIAL_UI = {
  en: {
    skip: 'Skip',
    back: 'Back',
    next: 'Next',
    done: 'Got it!',
    start: "Let's go!",
    progress: (n, t) => `Step ${n} of ${t}`,
    howToPlay: 'How to play',
    replayTutorial: 'How to play',
  },
  ar: {
    skip: 'تخطّي',
    back: 'السابق',
    next: 'التالي',
    done: 'فهمت!',
    start: 'لنبدأ!',
    progress: (n, t) => `الخطوة ${n} من ${t}`,
    howToPlay: 'كيف ألعب',
    replayTutorial: 'كيف ألعب',
  },
};

export const PUZZLE_TUTORIAL_STEPS = {
  sliding: {
    en: [
      { title: 'Sliding Puzzle', body: 'Slide numbered tiles until they read 1, 2, 3… with one empty space in the corner.', icon: '🧩' },
      { title: 'Tap to slide', body: 'Tap any tile that sits next to the empty gap — it will move into that slot.', icon: '👆' },
      { title: 'Pick your grid', body: 'Choose 3×3 for a quick game or 6×6 for a bigger challenge before you start.', icon: '📐' },
      { title: 'Ready!', body: 'Fewer moves and faster time = bragging rights. Use New puzzle anytime.', icon: '★' },
    ],
    ar: [
      { title: 'الألواح المنزلقة', body: 'حرّك الألواح المرقّمة حتى تصبح ١، ٢، ٣… مع فراغ واحد في الزاوية.', icon: '🧩' },
      { title: 'اضغط للتحريك', body: 'اضغط أي لوح بجانب الفراغ — ينزلق إلى مكانه.', icon: '👆' },
      { title: 'اختر الشبكة', body: '٣×٣ للعب السريع أو ٦×٦ لتحدّ أكبر قبل البدء.', icon: '📐' },
      { title: 'جاهز!', body: 'حركات أقل ووقت أسرع = فخر. «لغز جديد» في أي وقت.', icon: '★' },
    ],
  },
  takuzu: {
    en: [
      { title: 'Takuzu', body: 'Fill every cell with 0 or 1. Each row and column must have equal counts of each digit.', icon: '⚫' },
      { title: 'No triples', body: 'You cannot place three 0s or three 1s in a row — horizontally or vertically.', icon: '🚫' },
      { title: 'Tap to cycle', body: 'Tap a cell to cycle: empty → 0 → 1 → empty. Works on 4×4 and 6×6 grids.', icon: '👆' },
      { title: 'Ready!', body: 'When the board is full and every rule passes, you win automatically.', icon: '★' },
    ],
    ar: [
      { title: 'تاكوزو', body: 'املأ كل خلية بـ ٠ أو ١. كل صف وعمود يحتوي عدداً متساوياً من كل رقم.', icon: '⚫' },
      { title: 'لا ثلاثية', body: 'لا يمكن وضع ثلاثة ٠ أو ثلاثة ١ متتالية — أفقياً أو عمودياً.', icon: '🚫' },
      { title: 'اضغط للتبديل', body: 'اضغط الخلية: فارغ ← ٠ ← ١ ← فارغ. شبكات ٤×٤ و٦×٦.', icon: '👆' },
      { title: 'جاهز!', body: 'عندما تمتلئ الشبكة وتمر كل القواعد، تفوز تلقائياً.', icon: '★' },
    ],
  },
  hitori: {
    en: [
      { title: 'Hitori', body: 'Shade cells so no number repeats in any row or column among the cells you keep white.', icon: '⬛' },
      { title: 'Edge numbers', body: 'The numbers outside the grid tell you how many white (unshaded) cells remain in that row or column.', icon: '🔢' },
      { title: 'No touching shades', body: 'Shaded cells cannot share an edge — not even diagonally is ok, but orthogonal neighbors are forbidden.', icon: '🚫' },
      { title: 'Ready!', body: 'Tap a cell to shade or unshade it. Match all clues to win.', icon: '★' },
    ],
    ar: [
      { title: 'هيتوري', body: 'ظلّل خلايا حتى لا يتكرر رقم في أي صف أو عمود بين الخلايا البيضاء.', icon: '⬛' },
      { title: 'أرقام الحافة', body: 'الأرقام خارج الشبكة = عدد الخلايا البيضاء المتبقية في ذلك الصف أو العمود.', icon: '🔢' },
      { title: 'لا تظليل متجاور', body: 'الخلايا المظللة لا تتلامس حافة بحافة.', icon: '🚫' },
      { title: 'جاهز!', body: 'اضغط للتظليل أو إزالة التظليل. طابق كل الأرقام للفوز.', icon: '★' },
    ],
  },
  maze: {
    en: [
      { title: 'Logic Maze', body: 'Like the Porteus maze test: black walls on white paper, START at the top, GOAL at the bottom.', icon: '🌀' },
      { title: 'Draw your path', body: 'Press inside the start corridor and drag with finger or mouse — like drawing with a pencil.', icon: '✏️' },
      { title: 'Walls are solid', body: 'Thick black borders block you. Stay in the white corridors. Drag backward to erase your line.', icon: '🧱' },
      { title: 'Ready!', body: 'Wrong branches are long dead ends — backtrack and rethink. Only one route reaches GOAL.', icon: '★' },
    ],
    ar: [
      { title: 'متاهة منطقية', body: 'مثل اختبار Porteus: جدران سوداء على ورق أبيض، START أعلى وGOAL أسفل.', icon: '🌀' },
      { title: 'ارسم مسارك', body: 'اضغط داخل ممر البداية واسحب بالإصبع أو الفأرة — كالرسم بقلم رصاص.', icon: '✏️' },
      { title: 'جدران صلبة', body: 'الحدود السوداء تمنع العبور. ابقَ في الممرات البيضاء. اسحب للخلف لمسح خطك.', icon: '🧱' },
      { title: 'جاهز!', body: 'مسار واحد فقط صحيح — الممرات المسدودة تجبرك على التراجع وإعادة التفكير.', icon: '★' },
    ],
  },
  sudoku: {
    en: [
      { title: 'Sudoku', body: 'Fill the board with numbers. Every row, column, and box must contain each number once.', icon: '🔢' },
      { title: 'Tap to enter', body: 'Tap a blank cell to cycle through the numbers. Given cells cannot be changed.', icon: '👆' },
      { title: 'Correct puzzle', body: 'The generator keeps a unique-solution puzzle, then checks your board against that solution.', icon: '✓' },
      { title: 'Ready!', body: 'Use 4×4 for quick play, 6×6 for medium, and 9×9 for expert.', icon: '★' },
    ],
    ar: [
      { title: 'سودوكو', body: 'املأ اللوحة بالأرقام. كل صف وعمود وصندوق يحتوي كل رقم مرة واحدة.', icon: '🔢' },
      { title: 'اضغط للإدخال', body: 'اضغط خلية فارغة للتبديل بين الأرقام. الخلايا المعطاة ثابتة.', icon: '👆' },
      { title: 'لغز صحيح', body: 'المولّد يحافظ على حل فريد، ثم يتحقق من لوحتك مع الحل.', icon: '✓' },
      { title: 'جاهز!', body: '٤×٤ سريع، ٦×٦ متوسط، و٩×٩ للخبير.', icon: '★' },
    ],
  },
  kenken: {
    en: [
      { title: 'KenKen', body: 'Fill 1 to grid size in every row and column without repeats.', icon: '✳️' },
      { title: 'Cages', body: 'Small labels show a target and operation. The numbers inside that cage must make the target.', icon: '➕' },
      { title: 'Tap to enter', body: 'Tap a cell to cycle values. Rows, columns, and cage math all matter.', icon: '👆' },
      { title: 'Ready!', body: 'A solved board satisfies every cage and has no repeated number in any row or column.', icon: '★' },
    ],
    ar: [
      { title: 'كين كين', body: 'املأ ١ إلى حجم الشبكة في كل صف وعمود دون تكرار.', icon: '✳️' },
      { title: 'الأقفاص', body: 'العلامات الصغيرة تعرض هدفاً وعملية. أرقام القفص يجب أن تحقق الهدف.', icon: '➕' },
      { title: 'اضغط للإدخال', body: 'اضغط الخلية لتبديل القيمة. الصفوف والأعمدة وحساب القفص كلها مهمة.', icon: '👆' },
      { title: 'جاهز!', body: 'الحل الصحيح يحقق كل الأقفاص ولا يكرر رقماً في أي صف أو عمود.', icon: '★' },
    ],
  },
  nonogram: {
    en: [
      { title: 'Nonogram', body: 'Clues tell you how many filled cells appear in each row and column.', icon: '▦' },
      { title: 'Runs', body: 'A clue like 2 1 means two filled cells, a gap, then one filled cell.', icon: '🔍' },
      { title: 'Tap to fill', body: 'Tap cells to turn them black. Match all row and column clues to reveal the pattern.', icon: '👆' },
      { title: 'Ready!', body: 'Start with 5×5, then try 10×10 and 15×15 for deeper logic.', icon: '★' },
    ],
    ar: [
      { title: 'نونوغرام', body: 'الدلائل تخبرك بعدد الخلايا السوداء في كل صف وعمود.', icon: '▦' },
      { title: 'الكتل', body: 'دليل مثل ٢ ١ يعني خليتين سوداوتين، فراغ، ثم خلية سوداء.', icon: '🔍' },
      { title: 'اضغط للتعبئة', body: 'اضغط الخلايا لجعلها سوداء. طابق دلائل الصفوف والأعمدة.', icon: '👆' },
      { title: 'جاهز!', body: 'ابدأ بـ٥×٥، ثم جرّب ١٠×١٠ و١٥×١٥ لمنطق أعمق.', icon: '★' },
    ],
  },
  kakuro: {
    en: [
      { title: 'Kakuro', body: 'Like a number crossword: each white run must add up to its clue.', icon: 'Σ' },
      { title: 'No repeats', body: 'Digits 1-9 cannot repeat inside the same across or down run.', icon: '🚫' },
      { title: 'Tap to enter', body: 'Tap a white cell to cycle 1-9. Clues show down and across sums.', icon: '👆' },
      { title: 'Ready!', body: 'Every run must match its sum exactly to solve the board.', icon: '★' },
    ],
    ar: [
      { title: 'كاكورو', body: 'مثل كلمات متقاطعة رقمية: كل مسار أبيض يجب أن يساوي مجموعه.', icon: 'Σ' },
      { title: 'لا تكرار', body: 'الأرقام ١-٩ لا تتكرر داخل نفس المسار الأفقي أو العمودي.', icon: '🚫' },
      { title: 'اضغط للإدخال', body: 'اضغط خلية بيضاء للتبديل بين ١-٩. الدلائل تعرض المجموع.', icon: '👆' },
      { title: 'جاهز!', body: 'كل مسار يجب أن يطابق مجموعه تماماً لحل اللوحة.', icon: '★' },
    ],
  },
};

export function getTutorialSteps(puzzleId, isAr) {
  const pack = PUZZLE_TUTORIAL_STEPS[puzzleId];
  if (!pack) return [];
  return isAr ? pack.ar : pack.en;
}
