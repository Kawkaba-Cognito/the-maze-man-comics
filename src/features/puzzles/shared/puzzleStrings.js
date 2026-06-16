const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
/** Convert Western digits in a string/number to Arabic-Indic numerals. */
export function toArabicDigits(value) {
  return String(value).replace(/[0-9]/g, (d) => AR_DIGITS[+d]);
}

export const PUZZLE_UI = {
  en: {
    hubTitle: 'Puzzles',
    hubTag: 'logic games',
    hubSub: 'Pick a puzzle, choose your grid size, and play.',
    pickGrid: 'Choose grid size',
    pickGridSub: 'Tap a size to start a new puzzle.',
    gridLabel: (n) => `${n}×${n}`,
    gridHint3: 'Quick & cozy',
    gridHint4: 'Classic starter',
    gridHint5: 'Balanced challenge',
    gridHint6: 'Expert grid',
    start: 'New puzzle',
    shuffle: 'Shuffle',
    reset: 'Reset',
    hintBtn: (cost) => `💡 Hint (${cost})`,
    needPoints: (cost) => `Need ${cost} ⚡`,
    solved: 'Solved!',
    moves: (n) => `${n} moves`,
    time: (s) => `${s}s`,
    playAgain: 'Play again',
    changeSize: 'Change size',
    menu: 'Menu',
    check: 'Check',
    hint: 'Tap cells to play. Use New puzzle for a fresh board.',
    slidingHint: 'Tap a tile to slide it toward the gap — a whole row or column slides at once.',
    takuzuHint: 'Tap to cycle: empty → 0 → 1. Equal counts per row & column; no three in a row.',
    hitoriHint: 'Tap to shade duplicates. No two shaded cells touch; unshaded cells stay connected.',
    bridgesHint: 'Tap an island, then a neighbour, to add a bridge. Match every number; no crossings.',
  },
  ar: {
    hubTitle: 'ألغاز',
    hubTag: 'ألعاب منطق',
    hubSub: 'اختر لغزاً، حدّد حجم الشبكة، والعب.',
    pickGrid: 'اختر حجم الشبكة',
    pickGridSub: 'اضغط على الحجم لبدء لغز جديد.',
    gridLabel: (n) => `${toArabicDigits(n)}×${toArabicDigits(n)}`,
    gridHint3: 'سريع ومريح',
    gridHint4: 'بداية كلاسيكية',
    gridHint5: 'تحدّ متوازن',
    gridHint6: 'شبكة خبير',
    start: 'لغز جديد',
    shuffle: 'خلط',
    reset: 'إعادة',
    hintBtn: (cost) => `💡 تلميح (${cost})`,
    needPoints: (cost) => `تحتاج ${cost} ⚡`,
    solved: 'تم الحل!',
    moves: (n) => `${n} حركة`,
    time: (s) => `${s} ث`,
    playAgain: 'العب مجدداً',
    changeSize: 'تغيير الحجم',
    menu: 'القائمة',
    check: 'تحقق',
    hint: 'اضغط الخلايا للعب. «لغز جديد» لصفحة جديدة.',
    slidingHint: 'اضغط لوحاً لينزلق نحو الفراغ — ينزلق صف أو عمود كامل دفعة واحدة.',
    takuzuHint: 'اضغط للتبديل: فارغ ← ٠ ← ١. تساوي العدد في كل صف وعمود؛ لا ثلاثة متتالية.',
    hitoriHint: 'ظلّل المكررات. لا خليتان متظللتان متجاورتان؛ تبقى الخلايا البيضاء متصلة.',
    bridgesHint: 'اضغط جزيرة ثم جارتها لإضافة جسر. طابِق كل رقم؛ بلا تقاطعات.',
  },
};

export function gridHintKey(size) {
  if (size === 3) return 'gridHint3';
  if (size === 4) return 'gridHint4';
  if (size === 5) return 'gridHint5';
  return 'gridHint6';
}

/* Difficulty caption derived from a size's POSITION in the puzzle's own size
 * list (not its absolute number), so two sizes in the same puzzle never share
 * the same label — e.g. KenKen 6×6 and 7×7 read "Tricky" and "Expert", not both
 * "Expert grid". Puzzles can still pass a custom `hintForSize` to override. */
const SIZE_TIER_SCALE = {
  en: ['Warm-up', 'Gentle', 'Balanced', 'Tricky', 'Hard', 'Expert'],
  ar: ['تمهيدي', 'سهل', 'متوازن', 'صعب', 'شاقّ', 'خبير'],
};

export function sizeTierHint(index, total, isAr) {
  const scale = SIZE_TIER_SCALE[isAr ? 'ar' : 'en'];
  if (total <= 1) return isAr ? 'كلاسيكي' : 'Classic';
  const pos = Math.round((index / (total - 1)) * (scale.length - 1));
  return scale[pos];
}
