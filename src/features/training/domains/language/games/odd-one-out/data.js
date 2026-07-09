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
  { id: 'school', group: 'place', members: [
    { en: 'classroom', ar: 'صف' }, { en: 'library', ar: 'مكتبة' }, { en: 'playground', ar: 'ملعب' },
    { en: 'cafeteria', ar: 'مقصف' }, { en: 'lab', ar: 'مختبر' }, { en: 'office', ar: 'مكتب' },
  ] },
  { id: 'weather', group: 'nature', members: [
    { en: 'rain', ar: 'مطر' }, { en: 'snow', ar: 'ثلج' }, { en: 'wind', ar: 'ريح' },
    { en: 'cloud', ar: 'غيم' }, { en: 'storm', ar: 'عاصفة' }, { en: 'fog', ar: 'ضباب' },
  ] },
  { id: 'tool', group: 'object', members: [
    { en: 'hammer', ar: 'مطرقة' }, { en: 'saw', ar: 'منشار' }, { en: 'drill', ar: 'مثقاب' },
    { en: 'wrench', ar: 'مفتاح ربط' }, { en: 'scissors', ar: 'مقص' }, { en: 'ruler', ar: 'مسطرة' },
  ] },
  { id: 'emotion', group: 'concept', members: [
    { en: 'happy', ar: 'سعيد' }, { en: 'sad', ar: 'حزين' }, { en: 'angry', ar: 'غاضب' },
    { en: 'afraid', ar: 'خائف' }, { en: 'calm', ar: 'هادئ' }, { en: 'excited', ar: 'متحمّس' },
  ] },
  { id: 'body', group: 'living', members: [
    { en: 'heart', ar: 'قلب' }, { en: 'brain', ar: 'دماغ' }, { en: 'lung', ar: 'رئة' },
    { en: 'liver', ar: 'كبد' }, { en: 'bone', ar: 'عظم' }, { en: 'muscle', ar: 'عضلة' },
  ] },
  { id: 'country', group: 'place', members: [
    { en: 'Egypt', ar: 'مصر' }, { en: 'Jordan', ar: 'الأردن' }, { en: 'Morocco', ar: 'المغرب' },
    { en: 'Lebanon', ar: 'لبنان' }, { en: 'Iraq', ar: 'العراق' }, { en: 'Syria', ar: 'سوريا' },
  ] },
  { id: 'tech', group: 'object', linkRule: { en: 'Both are electronic devices', ar: 'كلاهما جهاز إلكتروني' }, members: [
    { en: 'phone', ar: 'هاتف' }, { en: 'computer', ar: 'حاسوب' }, { en: 'tablet', ar: 'جهاز لوحي' },
    { en: 'camera', ar: 'كاميرا' }, { en: 'printer', ar: 'طابعة' }, { en: 'router', ar: 'موجّه' },
  ] },
  { id: 'flower', group: 'living', linkRule: { en: 'Both are flowers', ar: 'كلاهما زهرة' }, members: [
    { en: 'rose', ar: 'وردة' }, { en: 'tulip', ar: 'توليب' }, { en: 'lily', ar: 'زنبق' },
    { en: 'daisy', ar: 'أقحوان' }, { en: 'sunflower', ar: 'دوّار الشمس' }, { en: 'jasmine', ar: 'ياسمين' },
  ] },
  { id: 'tree', group: 'living', linkRule: { en: 'Both are trees', ar: 'كلاهما شجرة' }, members: [
    { en: 'oak', ar: 'بلوط' }, { en: 'pine', ar: 'صنوبر' }, { en: 'palm', ar: 'نخيل' },
    { en: 'olive', ar: 'زيتون' }, { en: 'cedar', ar: 'أرز' }, { en: 'willow', ar: 'صفصاف' },
  ] },
  { id: 'pet', group: 'living', linkRule: { en: 'Both are common pets', ar: 'كلاهما حيوان أليف شائع' }, members: [
    { en: 'cat', ar: 'قطة' }, { en: 'dog', ar: 'كلب' }, { en: 'rabbit', ar: 'أرنب' },
    { en: 'hamster', ar: 'هامستر' }, { en: 'parrot', ar: 'ببغاء' }, { en: 'goldfish', ar: 'سمكة ذهبية' },
  ] },
  { id: 'dairy', group: 'living', linkRule: { en: 'Both are dairy foods', ar: 'كلاهما منتج ألبان' }, members: [
    { en: 'milk', ar: 'حليب' }, { en: 'cheese', ar: 'جبن' }, { en: 'yogurt', ar: 'لبن' },
    { en: 'butter', ar: 'زبدة' }, { en: 'cream', ar: 'قشطة' }, { en: 'ice cream', ar: 'آيس كريم' },
  ] },
  { id: 'grain', group: 'living', linkRule: { en: 'Both are grains or cereals', ar: 'كلاهما حبوب أو حبوب إفطار' }, members: [
    { en: 'rice', ar: 'أرز' }, { en: 'wheat', ar: 'قمح' }, { en: 'oats', ar: 'شوفان' },
    { en: 'corn', ar: 'ذرة' }, { en: 'barley', ar: 'شعير' }, { en: 'bread', ar: 'خبز' },
  ] },
  { id: 'musical', group: 'object', linkRule: { en: 'Both are musical instruments', ar: 'كلاهما آلة موسيقية' }, members: [
    { en: 'piano', ar: 'بيانو' }, { en: 'guitar', ar: 'غيتار' }, { en: 'drum', ar: 'طبل' },
    { en: 'violin', ar: 'كمان' }, { en: 'flute', ar: 'ناي' }, { en: 'trumpet', ar: 'بوق' },
  ] },
  { id: 'stationery', group: 'object', linkRule: { en: 'Both are stationery items', ar: 'كلاهما من أدوات المكتب' }, members: [
    { en: 'pen', ar: 'قلم' }, { en: 'pencil', ar: 'قلم رصاص' }, { en: 'eraser', ar: 'ممحاة' },
    { en: 'notebook', ar: 'دفتر' }, { en: 'ruler', ar: 'مسطرة' }, { en: 'stapler', ar: 'دبّاسة' },
  ] },
  { id: 'building', group: 'place', linkRule: { en: 'Both are types of buildings', ar: 'كلاهما نوع من المباني' }, members: [
    { en: 'hospital', ar: 'مستشفى' }, { en: 'mosque', ar: 'مسجد' }, { en: 'museum', ar: 'متحف' },
    { en: 'airport', ar: 'مطار' }, { en: 'stadium', ar: 'ملعب' }, { en: 'factory', ar: 'مصنع' },
  ] },
  { id: 'landform', group: 'place', linkRule: { en: 'Both are landforms', ar: 'كلاهما تشكيل أرضي' }, members: [
    { en: 'mountain', ar: 'جبل' }, { en: 'valley', ar: 'وادي' }, { en: 'desert', ar: 'صحراء' },
    { en: 'island', ar: 'جزيرة' }, { en: 'river', ar: 'نهر' }, { en: 'lake', ar: 'بحيرة' },
  ] },
  { id: 'planet', group: 'concept', linkRule: { en: 'Both are planets in our solar system', ar: 'كلاهما كوكب في نظامنا الشمسي' }, members: [
    { en: 'Mars', ar: 'المريخ' }, { en: 'Venus', ar: 'الزهرة' }, { en: 'Jupiter', ar: 'المشتري' },
    { en: 'Saturn', ar: 'زحل' }, { en: 'Mercury', ar: 'عطارد' }, { en: 'Neptune', ar: 'نبتون' },
  ] },
  { id: 'shape', group: 'concept', linkRule: { en: 'Both are geometric shapes', ar: 'كلاهما شكل هندسي' }, members: [
    { en: 'circle', ar: 'دائرة' }, { en: 'square', ar: 'مربّع' }, { en: 'triangle', ar: 'مثلث' },
    { en: 'rectangle', ar: 'مستطيل' }, { en: 'oval', ar: 'بيضاوي' }, { en: 'star', ar: 'نجمة' },
  ] },
  { id: 'language', group: 'concept', linkRule: { en: 'Both are world languages', ar: 'كلاهما لغة عالمية' }, members: [
    { en: 'Arabic', ar: 'العربية' }, { en: 'English', ar: 'الإنجليزية' }, { en: 'French', ar: 'الفرنسية' },
    { en: 'Spanish', ar: 'الإسبانية' }, { en: 'Chinese', ar: 'الصينية' }, { en: 'Turkish', ar: 'التركية' },
  ] },
  { id: 'gem', group: 'object', linkRule: { en: 'Both are precious stones', ar: 'كلاهما حجر كريم' }, members: [
    { en: 'diamond', ar: 'ألماس' }, { en: 'ruby', ar: 'ياقوت' }, { en: 'emerald', ar: 'زمرد' },
    { en: 'sapphire', ar: 'ياقوت أزرق' }, { en: 'pearl', ar: 'لؤلؤ' }, { en: 'amber', ar: 'كهرمان' },
  ] },
  { id: 'fabric', group: 'object', linkRule: { en: 'Both are fabrics or textiles', ar: 'كلاهما قماش أو نسيج' }, members: [
    { en: 'cotton', ar: 'قطن' }, { en: 'wool', ar: 'صوف' }, { en: 'silk', ar: 'حرير' },
    { en: 'linen', ar: 'كتّان' }, { en: 'leather', ar: 'جلد' }, { en: 'denim', ar: 'دنيم' },
  ] },
  { id: 'season', group: 'nature', linkRule: { en: 'Both are seasons', ar: 'كلاهما فصل من فصول السنة' }, members: [
    { en: 'spring', ar: 'ربيع' }, { en: 'summer', ar: 'صيف' }, { en: 'autumn', ar: 'خريف' },
    { en: 'winter', ar: 'شتاء' }, { en: 'rainy season', ar: 'موسم الأمطار' }, { en: 'harvest', ar: 'موسم الحصاد' },
  ] },
  { id: 'direction', group: 'concept', linkRule: { en: 'Both are compass directions', ar: 'كلاهما اتجاه على البوصلة' }, members: [
    { en: 'north', ar: 'شمال' }, { en: 'south', ar: 'جنوب' }, { en: 'east', ar: 'شرق' },
    { en: 'west', ar: 'غرب' }, { en: 'northeast', ar: 'شمال شرق' }, { en: 'southwest', ar: 'جنوب غرب' },
  ] },
  { id: 'time-unit', group: 'concept', linkRule: { en: 'Both are units of time', ar: 'كلاهما وحدة زمن' }, members: [
    { en: 'second', ar: 'ثانية' }, { en: 'minute', ar: 'دقيقة' }, { en: 'hour', ar: 'ساعة' },
    { en: 'day', ar: 'يوم' }, { en: 'week', ar: 'أسبوع' }, { en: 'month', ar: 'شهر' },
  ] },
  { id: 'office', group: 'place', linkRule: { en: 'Both are found in an office', ar: 'كلاهما موجود في المكتب' }, members: [
    { en: 'desk', ar: 'مكتب' }, { en: 'chair', ar: 'كرسي' }, { en: 'computer', ar: 'حاسوب' },
    { en: 'printer', ar: 'طابعة' }, { en: 'folder', ar: 'ملف' }, { en: 'calendar', ar: 'تقويم' },
  ] },
  { id: 'farm', group: 'living', linkRule: { en: 'Both are farm animals', ar: 'كلاهما حيوان مزرعة' }, members: [
    { en: 'cow', ar: 'بقرة' }, { en: 'sheep', ar: 'خروف' }, { en: 'goat', ar: 'ماعز' },
    { en: 'chicken', ar: 'دجاجة' }, { en: 'horse', ar: 'حصان' }, { en: 'donkey', ar: 'حمار' },
  ] },
];
