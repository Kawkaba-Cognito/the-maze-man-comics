/*
 * Shared kit for the Group Challenge party games (Imposter, Charades, Describe It,
 * On a Scale). One warm palette + one bilingual word-pack set so every game reuses
 * the same content and look.
 */

export const INK = '#2d2210';
export const SUB = '#8a7f6f';
export const FAINT = '#b3a288';
export const LINE = '#e3d6c4';
export const CARD = '#fffdf8';
export const GOLD = '#b9842f';
export const SERIF = "'Cormorant Garamond', Georgia, serif";
export const SANS = "'Outfit', system-ui, sans-serif";

export const rnd = (n) => Math.floor(Math.random() * n);
export const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const PACKS = [
  { id: 'animals', en: 'Animals', ar: 'حيوانات', icon: '🐾',
    words: [
      { en: 'Lion', ar: 'أسد' }, { en: 'Elephant', ar: 'فيل' }, { en: 'Dolphin', ar: 'دلفين' }, { en: 'Penguin', ar: 'بطريق' },
      { en: 'Kangaroo', ar: 'كنغر' }, { en: 'Owl', ar: 'بومة' }, { en: 'Snake', ar: 'ثعبان' }, { en: 'Rabbit', ar: 'أرنب' },
      { en: 'Tiger', ar: 'نمر' }, { en: 'Whale', ar: 'حوت' }, { en: 'Frog', ar: 'ضفدع' }, { en: 'Horse', ar: 'حصان' },
      { en: 'Monkey', ar: 'قرد' }, { en: 'Bear', ar: 'دب' }, { en: 'Giraffe', ar: 'زرافة' }, { en: 'Zebra', ar: 'حمار وحشي' },
      { en: 'Crocodile', ar: 'تمساح' }, { en: 'Shark', ar: 'قرش' }, { en: 'Butterfly', ar: 'فراشة' }, { en: 'Eagle', ar: 'نسر' },
      { en: 'Wolf', ar: 'ذئب' }, { en: 'Camel', ar: 'جمل' }, { en: 'Dog', ar: 'كلب' }, { en: 'Cat', ar: 'قطة' },
      { en: 'Fox', ar: 'ثعلب' }, { en: 'Deer', ar: 'غزال' }, { en: 'Bee', ar: 'نحلة' }, { en: 'Spider', ar: 'عنكبوت' },
      { en: 'Turtle', ar: 'سلحفاة' }, { en: 'Peacock', ar: 'طاووس' },
    ] },
  { id: 'food', en: 'Food', ar: 'طعام', icon: '🍔',
    words: [
      { en: 'Pizza', ar: 'بيتزا' }, { en: 'Sushi', ar: 'سوشي' }, { en: 'Burger', ar: 'برغر' }, { en: 'Falafel', ar: 'فلافل' },
      { en: 'Chocolate', ar: 'شوكولاتة' }, { en: 'Banana', ar: 'موز' }, { en: 'Coffee', ar: 'قهوة' }, { en: 'Rice', ar: 'أرز' },
      { en: 'Cheese', ar: 'جبن' }, { en: 'Mango', ar: 'مانجو' }, { en: 'Bread', ar: 'خبز' }, { en: 'Honey', ar: 'عسل' },
      { en: 'Ice cream', ar: 'مثلجات' }, { en: 'Soup', ar: 'حساء' }, { en: 'Apple', ar: 'تفاح' }, { en: 'Pasta', ar: 'معكرونة' },
      { en: 'Chicken', ar: 'دجاج' }, { en: 'Egg', ar: 'بيضة' }, { en: 'Salad', ar: 'سلطة' }, { en: 'Cake', ar: 'كعكة' },
      { en: 'Tea', ar: 'شاي' }, { en: 'Watermelon', ar: 'بطيخ' }, { en: 'Popcorn', ar: 'فشار' }, { en: 'Hummus', ar: 'حمّص' },
      { en: 'Shawarma', ar: 'شاورما' }, { en: 'Orange', ar: 'برتقال' }, { en: 'Cookie', ar: 'بسكويت' }, { en: 'Grapes', ar: 'عنب' },
      { en: 'Dates', ar: 'تمر' }, { en: 'Lemon', ar: 'ليمون' },
    ] },
  { id: 'places', en: 'Places', ar: 'أماكن', icon: '🌍',
    words: [
      { en: 'Beach', ar: 'شاطئ' }, { en: 'Airport', ar: 'مطار' }, { en: 'Hospital', ar: 'مستشفى' }, { en: 'School', ar: 'مدرسة' },
      { en: 'Desert', ar: 'صحراء' }, { en: 'Mountain', ar: 'جبل' }, { en: 'Market', ar: 'سوق' }, { en: 'Library', ar: 'مكتبة' },
      { en: 'Castle', ar: 'قلعة' }, { en: 'Farm', ar: 'مزرعة' }, { en: 'Cinema', ar: 'سينما' }, { en: 'Stadium', ar: 'ملعب' },
      { en: 'Bridge', ar: 'جسر' }, { en: 'Forest', ar: 'غابة' }, { en: 'Museum', ar: 'متحف' }, { en: 'Restaurant', ar: 'مطعم' },
      { en: 'Zoo', ar: 'حديقة حيوان' }, { en: 'Bank', ar: 'بنك' }, { en: 'Park', ar: 'حديقة' }, { en: 'Hotel', ar: 'فندق' },
      { en: 'Island', ar: 'جزيرة' }, { en: 'Volcano', ar: 'بركان' }, { en: 'Cave', ar: 'كهف' }, { en: 'River', ar: 'نهر' },
      { en: 'Pyramid', ar: 'هرم' }, { en: 'Church', ar: 'كنيسة' }, { en: 'Mosque', ar: 'مسجد' }, { en: 'Garden', ar: 'بستان' },
      { en: 'Harbor', ar: 'ميناء' }, { en: 'Prison', ar: 'سجن' },
    ] },
  { id: 'jobs', en: 'Jobs', ar: 'مهن', icon: '💼',
    words: [
      { en: 'Doctor', ar: 'طبيب' }, { en: 'Teacher', ar: 'معلّم' }, { en: 'Pilot', ar: 'طيّار' }, { en: 'Chef', ar: 'طاهٍ' },
      { en: 'Artist', ar: 'فنان' }, { en: 'Farmer', ar: 'مزارع' }, { en: 'Police', ar: 'شرطي' }, { en: 'Engineer', ar: 'مهندس' },
      { en: 'Singer', ar: 'مغنٍّ' }, { en: 'Nurse', ar: 'ممرّض' }, { en: 'Lawyer', ar: 'محامٍ' }, { en: 'Dentist', ar: 'طبيب أسنان' },
      { en: 'Plumber', ar: 'سبّاك' }, { en: 'Scientist', ar: 'عالِم' }, { en: 'Firefighter', ar: 'رجل إطفاء' }, { en: 'Astronaut', ar: 'رائد فضاء' },
      { en: 'Journalist', ar: 'صحفي' }, { en: 'Actor', ar: 'ممثّل' }, { en: 'Photographer', ar: 'مصوّر' }, { en: 'Barber', ar: 'حلّاق' },
      { en: 'Mechanic', ar: 'ميكانيكي' }, { en: 'Carpenter', ar: 'نجّار' }, { en: 'Soldier', ar: 'جندي' }, { en: 'Judge', ar: 'قاضٍ' },
      { en: 'Fisherman', ar: 'صيّاد' }, { en: 'Painter', ar: 'دهّان' }, { en: 'Tailor', ar: 'خيّاط' }, { en: 'Vet', ar: 'طبيب بيطري' },
      { en: 'Baker', ar: 'خبّاز' }, { en: 'Electrician', ar: 'كهربائي' },
    ] },
  { id: 'sports', en: 'Sports', ar: 'رياضة', icon: '⚽',
    words: [
      { en: 'Football', ar: 'كرة القدم' }, { en: 'Tennis', ar: 'تنس' }, { en: 'Swimming', ar: 'سباحة' }, { en: 'Boxing', ar: 'ملاكمة' },
      { en: 'Cycling', ar: 'دراجات' }, { en: 'Skiing', ar: 'تزلّج' }, { en: 'Chess', ar: 'شطرنج' }, { en: 'Running', ar: 'جري' },
      { en: 'Karate', ar: 'كاراتيه' }, { en: 'Golf', ar: 'غولف' }, { en: 'Cricket', ar: 'كريكيت' }, { en: 'Surfing', ar: 'ركوب الأمواج' },
      { en: 'Basketball', ar: 'كرة السلة' }, { en: 'Volleyball', ar: 'كرة الطائرة' }, { en: 'Baseball', ar: 'بيسبول' }, { en: 'Wrestling', ar: 'مصارعة' },
      { en: 'Archery', ar: 'رماية' }, { en: 'Gymnastics', ar: 'جمباز' }, { en: 'Rowing', ar: 'تجديف' }, { en: 'Badminton', ar: 'الريشة الطائرة' },
      { en: 'Fencing', ar: 'مبارزة' }, { en: 'Hockey', ar: 'هوكي' }, { en: 'Climbing', ar: 'تسلّق' }, { en: 'Diving', ar: 'غطس' },
      { en: 'Judo', ar: 'جودو' }, { en: 'Handball', ar: 'كرة اليد' }, { en: 'Bowling', ar: 'بولينغ' }, { en: 'Skating', ar: 'تزلّج على الجليد' },
      { en: 'Weightlifting', ar: 'رفع أثقال' }, { en: 'Sailing', ar: 'إبحار' },
    ] },
  { id: 'nature', en: 'Nature', ar: 'الطبيعة', icon: '🌿',
    words: [
      { en: 'Rain', ar: 'مطر' }, { en: 'Rainbow', ar: 'قوس قزح' }, { en: 'Snow', ar: 'ثلج' }, { en: 'Thunder', ar: 'رعد' },
      { en: 'Sun', ar: 'شمس' }, { en: 'Moon', ar: 'قمر' }, { en: 'Star', ar: 'نجمة' }, { en: 'Cloud', ar: 'سحابة' },
      { en: 'Wind', ar: 'رياح' }, { en: 'Ocean', ar: 'محيط' }, { en: 'Flower', ar: 'زهرة' }, { en: 'Tree', ar: 'شجرة' },
      { en: 'Waterfall', ar: 'شلال' }, { en: 'Lightning', ar: 'برق' }, { en: 'Earthquake', ar: 'زلزال' }, { en: 'Sand', ar: 'رمل' },
      { en: 'Leaf', ar: 'ورقة شجر' }, { en: 'Storm', ar: 'عاصفة' }, { en: 'Fog', ar: 'ضباب' }, { en: 'Fire', ar: 'نار' },
    ] },
  { id: 'household', en: 'Household', ar: 'أدوات المنزل', icon: '🏠',
    words: [
      { en: 'Chair', ar: 'كرسي' }, { en: 'Table', ar: 'طاولة' }, { en: 'Mirror', ar: 'مرآة' }, { en: 'Clock', ar: 'ساعة' },
      { en: 'Lamp', ar: 'مصباح' }, { en: 'Pillow', ar: 'وسادة' }, { en: 'Blanket', ar: 'بطانية' }, { en: 'Fridge', ar: 'ثلاجة' },
      { en: 'Oven', ar: 'فرن' }, { en: 'Broom', ar: 'مكنسة' }, { en: 'Key', ar: 'مفتاح' }, { en: 'Umbrella', ar: 'مظلة' },
      { en: 'Toothbrush', ar: 'فرشاة أسنان' }, { en: 'Scissors', ar: 'مقص' }, { en: 'Candle', ar: 'شمعة' }, { en: 'Spoon', ar: 'ملعقة' },
      { en: 'Towel', ar: 'منشفة' }, { en: 'Window', ar: 'نافذة' }, { en: 'Door', ar: 'باب' }, { en: 'Soap', ar: 'صابون' },
    ] },
];
