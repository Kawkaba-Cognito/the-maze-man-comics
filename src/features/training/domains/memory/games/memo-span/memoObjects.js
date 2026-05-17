/** Everyday objects shown during memorize / recognition rounds. */

export const MEMO_OBJECTS = [
  { id: 'ball', emoji: '⚽', en: 'ball', ar: 'كرة' },
  { id: 'cup', emoji: '☕', en: 'cup', ar: 'كوب' },
  { id: 'computer', emoji: '💻', en: 'computer', ar: 'حاسوب' },
  { id: 'chair', emoji: '🪑', en: 'chair', ar: 'كرسي' },
  { id: 'book', emoji: '📚', en: 'book', ar: 'كتاب' },
  { id: 'apple', emoji: '🍎', en: 'apple', ar: 'تفاحة' },
  { id: 'car', emoji: '🚗', en: 'car', ar: 'سيارة' },
  { id: 'phone', emoji: '📱', en: 'phone', ar: 'هاتف' },
  { id: 'key', emoji: '🔑', en: 'key', ar: 'مفتاح' },
  { id: 'clock', emoji: '🕐', en: 'clock', ar: 'ساعة' },
  { id: 'house', emoji: '🏠', en: 'house', ar: 'منزل' },
  { id: 'tree', emoji: '🌳', en: 'tree', ar: 'شجرة' },
  { id: 'dog', emoji: '🐕', en: 'dog', ar: 'كلب' },
  { id: 'guitar', emoji: '🎸', en: 'guitar', ar: 'غيتار' },
  { id: 'pizza', emoji: '🍕', en: 'pizza', ar: 'بيتزا' },
  { id: 'umbrella', emoji: '☂️', en: 'umbrella', ar: 'مظلة' },
  { id: 'camera', emoji: '📷', en: 'camera', ar: 'كاميرا' },
  { id: 'flower', emoji: '🌸', en: 'flower', ar: 'زهرة' },
  { id: 'shoe', emoji: '👟', en: 'shoe', ar: 'حذاء' },
  { id: 'lamp', emoji: '💡', en: 'lamp', ar: 'مصباح' },
];

const BY_ID = Object.fromEntries(MEMO_OBJECTS.map((o) => [o.id, o]));

export function getMemoObject(id) {
  return BY_ID[id] ?? MEMO_OBJECTS[0];
}

export function objectLabel(id, isAr) {
  const o = getMemoObject(id);
  return isAr ? o.ar : o.en;
}

export function objectIds(count, rnd, exclude = new Set()) {
  const pool = [...MEMO_OBJECTS].filter((o) => !exclude.has(o.id));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const out = [];
  let pi = 0;
  while (out.length < count) {
    if (pi >= pool.length) {
      pi = 0;
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
    }
    const id = pool[pi++].id;
    if (!out.includes(id)) out.push(id);
  }
  return out;
}
