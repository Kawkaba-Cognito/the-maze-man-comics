/** Canonical game ids (registry `gameKey`) + display names for tutorial UI. */
export const TRAINING_META = {
  'cancel-task': { name: 'Cancel Task', nameAr: 'مهمة الشطب' },
  mot: { name: 'Target Tracking', nameAr: 'تتبّع الأهداف' },
  'train-switch': { name: 'Car Park', nameAr: 'موقف السيارات' },
  'speed-match': { name: 'Speed Match', nameAr: 'مطابقة سريعة' },
  'trail-making': { name: 'Trail Making', nameAr: 'صل الأرقام' },
  'memo-span': { name: 'Memo Span', nameAr: 'مدى الذاكرة' },
  'story-grid': { name: 'Story Time', nameAr: 'وقت القصة' },
  nback: { name: 'N-Back', nameAr: 'إن-باك' },
  'paired-associates': { name: 'Pair Match', nameAr: 'مطابقة الأزواج' },
  wordle: { name: 'Word Maze', nameAr: 'متاهة الكلمات' },
  synonyms: { name: 'Word Links', nameAr: 'روابط الكلمات' },
  'odd-one-out': { name: 'Odd One Out', nameAr: 'الشاذّ' },
  trivia: { name: 'Trivia', nameAr: 'معلومات' },
  detective: { name: 'Detective', nameAr: 'المحقّق' },
  'rush-hour': { name: 'Block Escape', nameAr: 'هروب القطع' },
  'raven-matrices': { name: 'Matrix Reasoning', nameAr: 'استدلال المصفوفات' },
  'spatial-stroop': { name: 'Arrow Rush', nameAr: 'اندفاع الأسهم' },
  wisconsin: { name: 'Card Sort', nameAr: 'فرز البطاقات' },
  brixton: { name: 'Kawkab Hops', nameAr: 'قفزات كوكب' },
  'math-gates': { name: 'Math Gates', nameAr: 'بوابات الحساب' },
};

export function getTrainingMeta(gameId) {
  return TRAINING_META[gameId] || { name: gameId, nameAr: gameId };
}
