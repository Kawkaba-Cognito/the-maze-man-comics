/** Map case setting text → Story Time BACKGROUNDS id. */
const KEYWORDS = [
  ['kitchen', ['kitchen', 'bakery', 'مطبخ', 'مخبز']],
  ['museum', ['museum', 'gallery', 'متحف', 'معرض']],
  ['library', ['library', 'مكتبة']],
  ['street', ['street', 'yard', 'courtyard', 'شارع', 'فناء']],
  ['school', ['school', 'gym', 'مدرسة', 'صالة']],
  ['garden', ['garden', 'حديقة']],
  ['beach', ['beach', 'harbour', 'harbor', 'port', 'yacht', 'شاطئ', 'ميناء']],
  ['night', ['observatory', 'night', 'midnight', 'مرصد', 'ليل']],
  ['classroom', ['class', 'science fair', 'صف']],
  ['home', ['hotel', 'room', 'bedroom', 'family', 'فندق', 'غرفة']],
];

export function settingToBgId(setting, isAr) {
  const text = (isAr ? setting?.ar : setting?.en) || '';
  const lower = text.toLowerCase();
  for (const [bgId, keys] of KEYWORDS) {
    if (keys.some((k) => lower.includes(k.toLowerCase()))) return bgId;
  }
  return 'street';
}
