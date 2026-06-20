/*
 * Odd One Out — bilingual semantic categories (Fusha + English).
 * Each category has a `group`; "near" trials draw the odd word from the SAME
 * group (a closer, harder distractor), "far" trials from a different group.
 */
export const CATEGORIES = [
  { id: 'fruit', group: 'living', members: [
    { en: 'apple', ar: 'تفاحة' }, { en: 'banana', ar: 'موزة' }, { en: 'orange', ar: 'برتقالة' },
    { en: 'grape', ar: 'عنب' }, { en: 'mango', ar: 'مانجو' }, { en: 'fig', ar: 'تينة' },
  ] },
  { id: 'vegetable', group: 'living', members: [
    { en: 'carrot', ar: 'جزرة' }, { en: 'potato', ar: 'بطاطا' }, { en: 'onion', ar: 'بصلة' },
    { en: 'tomato', ar: 'طماطم' }, { en: 'cucumber', ar: 'خيار' }, { en: 'lettuce', ar: 'خَسّ' },
  ] },
  { id: 'wild-animal', group: 'living', members: [
    { en: 'lion', ar: 'أسد' }, { en: 'tiger', ar: 'نمر' }, { en: 'elephant', ar: 'فيل' },
    { en: 'wolf', ar: 'ذئب' }, { en: 'bear', ar: 'دبّ' }, { en: 'fox', ar: 'ثعلب' },
  ] },
  { id: 'bird', group: 'living', members: [
    { en: 'eagle', ar: 'نسر' }, { en: 'sparrow', ar: 'عصفور' }, { en: 'owl', ar: 'بومة' },
    { en: 'duck', ar: 'بطّة' }, { en: 'pigeon', ar: 'حمامة' }, { en: 'peacock', ar: 'طاووس' },
  ] },
  { id: 'sea', group: 'living', members: [
    { en: 'fish', ar: 'سمكة' }, { en: 'shark', ar: 'قرش' }, { en: 'whale', ar: 'حوت' },
    { en: 'dolphin', ar: 'دلفين' }, { en: 'crab', ar: 'سرطان' }, { en: 'octopus', ar: 'أخطبوط' },
  ] },
  { id: 'insect', group: 'living', members: [
    { en: 'bee', ar: 'نحلة' }, { en: 'ant', ar: 'نملة' }, { en: 'fly', ar: 'ذبابة' },
    { en: 'butterfly', ar: 'فراشة' }, { en: 'mosquito', ar: 'بعوضة' }, { en: 'beetle', ar: 'خنفساء' },
  ] },
  { id: 'furniture', group: 'object', members: [
    { en: 'chair', ar: 'كرسيّ' }, { en: 'table', ar: 'طاولة' }, { en: 'bed', ar: 'سرير' },
    { en: 'sofa', ar: 'أريكة' }, { en: 'wardrobe', ar: 'خزانة' }, { en: 'desk', ar: 'مكتب' },
  ] },
  { id: 'vehicle', group: 'object', members: [
    { en: 'car', ar: 'سيّارة' }, { en: 'bus', ar: 'حافلة' }, { en: 'train', ar: 'قطار' },
    { en: 'plane', ar: 'طائرة' }, { en: 'bicycle', ar: 'درّاجة' }, { en: 'ship', ar: 'سفينة' },
  ] },
  { id: 'clothing', group: 'object', members: [
    { en: 'shirt', ar: 'قميص' }, { en: 'trousers', ar: 'بنطال' }, { en: 'dress', ar: 'فستان' },
    { en: 'jacket', ar: 'سترة' }, { en: 'hat', ar: 'قبّعة' }, { en: 'shoes', ar: 'حذاء' },
  ] },
  { id: 'kitchen', group: 'object', members: [
    { en: 'spoon', ar: 'ملعقة' }, { en: 'fork', ar: 'شوكة' }, { en: 'knife', ar: 'سكّين' },
    { en: 'plate', ar: 'طبق' }, { en: 'cup', ar: 'كوب' }, { en: 'pot', ar: 'قِدر' },
  ] },
  { id: 'color', group: 'concept', members: [
    { en: 'red', ar: 'أحمر' }, { en: 'blue', ar: 'أزرق' }, { en: 'green', ar: 'أخضر' },
    { en: 'yellow', ar: 'أصفر' }, { en: 'black', ar: 'أسود' }, { en: 'white', ar: 'أبيض' },
  ] },
  { id: 'sport', group: 'concept', members: [
    { en: 'football', ar: 'كرة القدم' }, { en: 'tennis', ar: 'تنس' }, { en: 'swimming', ar: 'سباحة' },
    { en: 'boxing', ar: 'ملاكمة' }, { en: 'running', ar: 'جري' }, { en: 'basketball', ar: 'كرة السلة' },
  ] },
  { id: 'job', group: 'concept', members: [
    { en: 'doctor', ar: 'طبيب' }, { en: 'teacher', ar: 'معلّم' }, { en: 'engineer', ar: 'مهندس' },
    { en: 'farmer', ar: 'مزارع' }, { en: 'pilot', ar: 'طيّار' }, { en: 'nurse', ar: 'ممرّض' },
  ] },
];
