/** Canonical game ids (registry `gameKey`) + display names for tutorial UI. */
export const TRAINING_META = {
  'cancel-task': { name: 'Cancel Task', nameAr: 'مهمة الشطب' },
  mot: { name: 'Target Tracking', nameAr: 'تتبّع الأهداف' },
  'train-switch': { name: 'Car Park', nameAr: 'موقف السيارات' },
  'speed-match': { name: 'Speed Match', nameAr: 'مطابقة سريعة' },
  'piano-tap': { name: 'Piano Tap', nameAr: 'عزف سريع' },
  'trail-making': { name: 'Trail Making', nameAr: 'صل الأرقام' },
  'memo-span': { name: 'Memo Span', nameAr: 'مدى الذاكرة' },
  nback: { name: 'N-Back', nameAr: 'إن-باك' },
  'paired-associates': { name: 'Pair Match', nameAr: 'مطابقة الأزواج' },
  wordle: { name: 'Word Maze', nameAr: 'متاهة الكلمات' },
  synonyms: { name: 'Similarities', nameAr: 'وجه الشبه' },
  'odd-one-out': { name: 'Odd One Out', nameAr: 'الشاذّ' },
  'rush-hour': { name: 'Block Escape', nameAr: 'هروب القطع' },
  'raven-matrices': { name: 'Matrix Reasoning', nameAr: 'استدلال المصفوفات' },
  'tower-hanoi': { name: 'Colour Sort', nameAr: 'فرز الألوان' },
  'spatial-stroop': { name: 'Arrow Rush', nameAr: 'اندفاع الأسهم' },
  flip: { name: 'Flip', nameAr: 'انقلاب' },
  'math-gates': { name: 'Math Gates', nameAr: 'بوابات الحساب' },
};

export function getTrainingMeta(gameId) {
  return TRAINING_META[gameId] || { name: gameId, nameAr: gameId };
}
