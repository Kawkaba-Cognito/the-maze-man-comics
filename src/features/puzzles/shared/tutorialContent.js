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
      { title: 'Tap to slide', body: 'Tap a tile to slide it toward the gap. Tap one further down the same row or column and the whole line slides at once.', icon: '👆' },
      { title: 'Pick your grid', body: 'Choose 3×3 for a quick game or 6×6 for a bigger challenge before you start.', icon: '📐' },
      { title: 'Ready!', body: 'Fewer moves and faster time = bragging rights. Use New puzzle anytime.', icon: '★' },
    ],
    ar: [
      { title: 'الألواح المنزلقة', body: 'حرّك الألواح المرقّمة حتى تصبح ١، ٢، ٣… مع فراغ واحد في الزاوية.', icon: '🧩' },
      { title: 'اضغط للتحريك', body: 'اضغط لوحاً لينزلق نحو الفراغ. اضغط لوحاً أبعد في نفس الصف أو العمود فينزلق الصف كله دفعة واحدة.', icon: '👆' },
      { title: 'اختر الشبكة', body: '٣×٣ للعب السريع أو ٦×٦ لتحدّ أكبر قبل البدء.', icon: '📐' },
      { title: 'جاهز!', body: 'حركات أقل ووقت أسرع = فخر. «لغز جديد» في أي وقت.', icon: '★' },
    ],
  },
  takuzu: {
    en: [
      { title: 'Takuzu', body: 'Fill the empty cells with 0 or 1. The ringed cells are given clues — they are locked. Each row and column must end with equal counts of each digit.', icon: '⚫' },
      { title: 'No triples', body: 'You cannot place three 0s or three 1s in a row — horizontally or vertically.', icon: '🚫' },
      { title: 'All lines unique', body: 'No two rows may be identical, and no two columns may be identical. There is exactly one solution.', icon: '🔀' },
      { title: 'Tap to cycle', body: 'Tap an empty cell to cycle: empty → 0 → 1 → empty. Sizes range from 4×4 up to 10×10.', icon: '👆' },
    ],
    ar: [
      { title: 'تاكوزو', body: 'املأ الخلايا الفارغة بـ ٠ أو ١. الخلايا المحاطة بإطار هي أرقام معطاة ثابتة. كل صف وعمود ينتهي بعدد متساوٍ من كل رقم.', icon: '⚫' },
      { title: 'لا ثلاثية', body: 'لا يمكن وضع ثلاثة ٠ أو ثلاثة ١ متتالية — أفقياً أو عمودياً.', icon: '🚫' },
      { title: 'كل السطور فريدة', body: 'لا يتطابق صفّان، ولا عمودان. هناك حل واحد فقط.', icon: '🔀' },
      { title: 'اضغط للتبديل', body: 'اضغط خلية فارغة: فارغ ← ٠ ← ١ ← فارغ. الأحجام من ٤×٤ حتى ١٠×١٠.', icon: '👆' },
    ],
  },
  hitori: {
    en: [
      { title: 'Hitori', body: 'Shade cells so no number repeats among the unshaded cells of any row or column.', icon: '⬛' },
      { title: 'No touching shades', body: 'Two shaded cells cannot share an edge. Diagonal corners are fine; orthogonal neighbours are not.', icon: '🚫' },
      { title: 'Stay connected', body: 'All the unshaded cells must remain joined as one group — you cannot fence any white cell off.', icon: '🔗' },
      { title: 'Ready!', body: 'Tap a cell to shade or unshade it. There is exactly one solution. Sizes 5×5 to 8×8.', icon: '★' },
    ],
    ar: [
      { title: 'هيتوري', body: 'ظلّل خلايا حتى لا يتكرر رقم بين الخلايا البيضاء في أي صف أو عمود.', icon: '⬛' },
      { title: 'لا تظليل متجاور', body: 'لا تتلامس خليتان مظللتان حافة بحافة. الزوايا القطرية مسموحة، الجيران المباشرون ممنوعون.', icon: '🚫' },
      { title: 'ابقَ متصلاً', body: 'يجب أن تبقى كل الخلايا البيضاء متصلة كمجموعة واحدة — لا تعزل أي خلية بيضاء.', icon: '🔗' },
      { title: 'جاهز!', body: 'اضغط للتظليل أو إزالته. هناك حل واحد فقط. الأحجام من ٥×٥ حتى ٨×٨.', icon: '★' },
    ],
  },
  maze: {
    en: [
      { title: 'Logic Maze', body: 'Like the Porteus maze test: black walls on white paper, START at the top, GOAL at the bottom.', icon: '🌀' },
      { title: 'Use the joystick', body: 'Push the joystick to move your glowing token. Hold a direction to keep walking. Arrow keys / WASD work too.', icon: '🕹️' },
      { title: 'Walls are solid', body: 'Thick black borders block you — stay in the white corridors. Turn back the way you came to retrace your steps.', icon: '🧱' },
      { title: 'Ready!', body: 'Wrong branches are long dead ends — backtrack and rethink. Only one route reaches GOAL.', icon: '★' },
    ],
    ar: [
      { title: 'متاهة منطقية', body: 'مثل اختبار Porteus: جدران سوداء على ورق أبيض، START أعلى وGOAL أسفل.', icon: '🌀' },
      { title: 'استخدم عصا التحكم', body: 'ادفع عصا التحكم لتحريك الكرة المضيئة. استمر بالضغط في اتجاه للسير المتواصل. مفاتيح الأسهم وWASD تعمل أيضاً.', icon: '🕹️' },
      { title: 'جدران صلبة', body: 'الحدود السوداء تمنع العبور. ابقَ في الممرات البيضاء. عُد من حيث أتيت لتتراجع عن خطواتك.', icon: '🧱' },
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
      { title: 'Tap to enter', body: 'Tap a cell, then pick a number from the pad. Rows, columns, and cage math all matter.', icon: '👆' },
      { title: 'Ready!', body: 'One solution per puzzle. Sizes 4×4 to 7×7. A few single-cell cages give you starting numbers.', icon: '★' },
    ],
    ar: [
      { title: 'كين كين', body: 'املأ ١ إلى حجم الشبكة في كل صف وعمود دون تكرار.', icon: '✳️' },
      { title: 'الأقفاص', body: 'العلامات الصغيرة تعرض هدفاً وعملية. أرقام القفص يجب أن تحقق الهدف.', icon: '➕' },
      { title: 'اضغط للإدخال', body: 'اضغط الخلية ثم اختر رقماً من اللوحة. الصفوف والأعمدة وحساب القفص كلها مهمة.', icon: '👆' },
      { title: 'جاهز!', body: 'حل واحد لكل لغز. الأحجام من ٤×٤ حتى ٧×٧. بعض الأقفاص أحادية الخلية تمنحك أرقاماً للبداية.', icon: '★' },
    ],
  },
  nonogram: {
    en: [
      { title: 'Nonogram', body: 'Clues tell you how many filled cells appear in each row and column.', icon: '▦' },
      { title: 'Runs', body: 'A clue like 2 1 means two filled cells, a gap, then one filled cell.', icon: '🔍' },
      { title: 'Fill or mark', body: 'Use the Fill tool to blacken cells, or the Mark tool to put an ✕ on cells you know are empty. Marks are just notes.', icon: '👆' },
      { title: 'Ready!', body: 'Match every row and column clue. Each puzzle has one solution you can reach by logic. Sizes 5×5 to 10×10.', icon: '★' },
    ],
    ar: [
      { title: 'نونوغرام', body: 'الدلائل تخبرك بعدد الخلايا السوداء في كل صف وعمود.', icon: '▦' },
      { title: 'الكتل', body: 'دليل مثل ٢ ١ يعني خليتين سوداوتين، فراغ، ثم خلية سوداء.', icon: '🔍' },
      { title: 'تعبئة أو علامة', body: 'استخدم أداة التعبئة لتسويد الخلايا، أو أداة العلامة لوضع ✕ على الخلايا الفارغة المؤكدة. العلامات مجرد ملاحظات.', icon: '👆' },
      { title: 'جاهز!', body: 'طابق كل دلائل الصفوف والأعمدة. لكل لغز حل واحد يمكن بلوغه بالمنطق. الأحجام من ٥×٥ حتى ١٠×١٠.', icon: '★' },
    ],
  },
  kakuro: {
    en: [
      { title: 'Kakuro', body: 'Like a number crossword: each white run must add up to its clue.', icon: 'Σ' },
      { title: 'No repeats', body: 'Digits 1-9 cannot repeat inside the same across or down run.', icon: '🚫' },
      { title: 'Tap to enter', body: 'Tap a white cell, then pick a number. A few purple cells are locked starting clues you cannot change.', icon: '👆' },
      { title: 'Ready!', body: 'Every run must match its sum exactly. Each puzzle has one solution. Sizes 6×6 and 7×7.', icon: '★' },
    ],
    ar: [
      { title: 'كاكورو', body: 'مثل كلمات متقاطعة رقمية: كل مسار أبيض يجب أن يساوي مجموعه.', icon: 'Σ' },
      { title: 'لا تكرار', body: 'الأرقام ١-٩ لا تتكرر داخل نفس المسار الأفقي أو العمودي.', icon: '🚫' },
      { title: 'اضغط للإدخال', body: 'اضغط خلية بيضاء ثم اختر رقماً. بعض الخلايا البنفسجية أرقام بداية ثابتة لا يمكن تغييرها.', icon: '👆' },
      { title: 'جاهز!', body: 'كل مسار يطابق مجموعه تماماً. لكل لغز حل واحد. الأحجام ٦×٦ و٧×٧.', icon: '★' },
    ],
  },
};

export function getTutorialSteps(puzzleId, isAr) {
  const pack = PUZZLE_TUTORIAL_STEPS[puzzleId];
  if (!pack) return [];
  return isAr ? pack.ar : pack.en;
}
