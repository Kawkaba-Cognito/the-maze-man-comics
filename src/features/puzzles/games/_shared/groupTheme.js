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
      { en: 'Monkey', ar: 'قرد' }, { en: 'Bear', ar: 'دب' },
    ] },
  { id: 'food', en: 'Food', ar: 'طعام', icon: '🍔',
    words: [
      { en: 'Pizza', ar: 'بيتزا' }, { en: 'Sushi', ar: 'سوشي' }, { en: 'Burger', ar: 'برغر' }, { en: 'Falafel', ar: 'فلافل' },
      { en: 'Chocolate', ar: 'شوكولاتة' }, { en: 'Banana', ar: 'موز' }, { en: 'Coffee', ar: 'قهوة' }, { en: 'Rice', ar: 'أرز' },
      { en: 'Cheese', ar: 'جبن' }, { en: 'Mango', ar: 'مانجو' }, { en: 'Bread', ar: 'خبز' }, { en: 'Honey', ar: 'عسل' },
      { en: 'Ice cream', ar: 'مثلجات' }, { en: 'Soup', ar: 'حساء' },
    ] },
  { id: 'places', en: 'Places', ar: 'أماكن', icon: '🌍',
    words: [
      { en: 'Beach', ar: 'شاطئ' }, { en: 'Airport', ar: 'مطار' }, { en: 'Hospital', ar: 'مستشفى' }, { en: 'School', ar: 'مدرسة' },
      { en: 'Desert', ar: 'صحراء' }, { en: 'Mountain', ar: 'جبل' }, { en: 'Market', ar: 'سوق' }, { en: 'Library', ar: 'مكتبة' },
      { en: 'Castle', ar: 'قلعة' }, { en: 'Farm', ar: 'مزرعة' }, { en: 'Cinema', ar: 'سينما' }, { en: 'Stadium', ar: 'ملعب' },
      { en: 'Bridge', ar: 'جسر' }, { en: 'Forest', ar: 'غابة' },
    ] },
  { id: 'jobs', en: 'Jobs', ar: 'مهن', icon: '💼',
    words: [
      { en: 'Doctor', ar: 'طبيب' }, { en: 'Teacher', ar: 'معلّم' }, { en: 'Pilot', ar: 'طيّار' }, { en: 'Chef', ar: 'طاهٍ' },
      { en: 'Artist', ar: 'فنان' }, { en: 'Farmer', ar: 'مزارع' }, { en: 'Police', ar: 'شرطي' }, { en: 'Engineer', ar: 'مهندس' },
      { en: 'Singer', ar: 'مغنٍّ' }, { en: 'Nurse', ar: 'ممرّض' }, { en: 'Lawyer', ar: 'محامٍ' }, { en: 'Dentist', ar: 'طبيب أسنان' },
      { en: 'Plumber', ar: 'سبّاك' }, { en: 'Scientist', ar: 'عالِم' },
    ] },
  { id: 'sports', en: 'Sports', ar: 'رياضة', icon: '⚽',
    words: [
      { en: 'Football', ar: 'كرة القدم' }, { en: 'Tennis', ar: 'تنس' }, { en: 'Swimming', ar: 'سباحة' }, { en: 'Boxing', ar: 'ملاكمة' },
      { en: 'Cycling', ar: 'دراجات' }, { en: 'Skiing', ar: 'تزلّج' }, { en: 'Chess', ar: 'شطرنج' }, { en: 'Running', ar: 'جري' },
      { en: 'Karate', ar: 'كاراتيه' }, { en: 'Golf', ar: 'غولف' }, { en: 'Cricket', ar: 'كريكيت' }, { en: 'Surfing', ar: 'ركوب الأمواج' },
      { en: 'Basketball', ar: 'كرة السلة' }, { en: 'Volleyball', ar: 'كرة الطائرة' },
    ] },
];
