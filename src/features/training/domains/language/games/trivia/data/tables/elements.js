/*
 * Chemical elements — a structured table for the procedural generator.
 *
 * Chosen for this treatment because the attributes are EXACT and permanent in a
 * way most trivia data is not: an atomic number is a count of protons, not an
 * estimate that drifts with the next census. That matters for the separation
 * guard — `z` needs no ratio margin at all, because two elements can never tie.
 *
 * Atomic mass is the standard atomic weight rounded to two decimals. It is used
 * only for comparison, never quoted as a precise figure.
 *
 * The list stops at the elements a general audience can place. Asking which of
 * four synthetic superheavies is denser is not knowledge, and every row past
 * recognition dilutes the draw for no gain.
 */
export const ELEMENTS = {
  id: 'chem',
  rows: [
    { en: 'Hydrogen', ar: 'الهيدروجين', z: 1, mass: 1.01, sym: { en: 'H', ar: 'H' } },
    { en: 'Helium', ar: 'الهيليوم', z: 2, mass: 4.00, sym: { en: 'He', ar: 'He' } },
    { en: 'Lithium', ar: 'الليثيوم', z: 3, mass: 6.94, sym: { en: 'Li', ar: 'Li' } },
    { en: 'Beryllium', ar: 'البيريليوم', z: 4, mass: 9.01, sym: { en: 'Be', ar: 'Be' } },
    { en: 'Boron', ar: 'البورون', z: 5, mass: 10.81, sym: { en: 'B', ar: 'B' } },
    { en: 'Carbon', ar: 'الكربون', z: 6, mass: 12.01, sym: { en: 'C', ar: 'C' } },
    { en: 'Nitrogen', ar: 'النيتروجين', z: 7, mass: 14.01, sym: { en: 'N', ar: 'N' } },
    { en: 'Oxygen', ar: 'الأكسجين', z: 8, mass: 16.00, sym: { en: 'O', ar: 'O' } },
    { en: 'Fluorine', ar: 'الفلور', z: 9, mass: 19.00, sym: { en: 'F', ar: 'F' } },
    { en: 'Neon', ar: 'النيون', z: 10, mass: 20.18, sym: { en: 'Ne', ar: 'Ne' } },
    { en: 'Sodium', ar: 'الصوديوم', z: 11, mass: 22.99, sym: { en: 'Na', ar: 'Na' } },
    { en: 'Magnesium', ar: 'المغنيسيوم', z: 12, mass: 24.31, sym: { en: 'Mg', ar: 'Mg' } },
    { en: 'Aluminium', ar: 'الألومنيوم', z: 13, mass: 26.98, sym: { en: 'Al', ar: 'Al' } },
    { en: 'Silicon', ar: 'السيليكون', z: 14, mass: 28.09, sym: { en: 'Si', ar: 'Si' } },
    { en: 'Phosphorus', ar: 'الفوسفور', z: 15, mass: 30.97, sym: { en: 'P', ar: 'P' } },
    { en: 'Sulfur', ar: 'الكبريت', z: 16, mass: 32.07, sym: { en: 'S', ar: 'S' } },
    { en: 'Chlorine', ar: 'الكلور', z: 17, mass: 35.45, sym: { en: 'Cl', ar: 'Cl' } },
    { en: 'Argon', ar: 'الأرغون', z: 18, mass: 39.95, sym: { en: 'Ar', ar: 'Ar' } },
    { en: 'Potassium', ar: 'البوتاسيوم', z: 19, mass: 39.10, sym: { en: 'K', ar: 'K' } },
    { en: 'Calcium', ar: 'الكالسيوم', z: 20, mass: 40.08, sym: { en: 'Ca', ar: 'Ca' } },
    { en: 'Scandium', ar: 'السكانديوم', z: 21, mass: 44.96, sym: { en: 'Sc', ar: 'Sc' } },
    { en: 'Titanium', ar: 'التيتانيوم', z: 22, mass: 47.87, sym: { en: 'Ti', ar: 'Ti' } },
    { en: 'Vanadium', ar: 'الفاناديوم', z: 23, mass: 50.94, sym: { en: 'V', ar: 'V' } },
    { en: 'Chromium', ar: 'الكروم', z: 24, mass: 52.00, sym: { en: 'Cr', ar: 'Cr' } },
    { en: 'Manganese', ar: 'المنغنيز', z: 25, mass: 54.94, sym: { en: 'Mn', ar: 'Mn' } },
    { en: 'Iron', ar: 'الحديد', z: 26, mass: 55.85, sym: { en: 'Fe', ar: 'Fe' } },
    { en: 'Cobalt', ar: 'الكوبالت', z: 27, mass: 58.93, sym: { en: 'Co', ar: 'Co' } },
    { en: 'Nickel', ar: 'النيكل', z: 28, mass: 58.69, sym: { en: 'Ni', ar: 'Ni' } },
    { en: 'Copper', ar: 'النحاس', z: 29, mass: 63.55, sym: { en: 'Cu', ar: 'Cu' } },
    { en: 'Zinc', ar: 'الزنك', z: 30, mass: 65.38, sym: { en: 'Zn', ar: 'Zn' } },
    { en: 'Gallium', ar: 'الغاليوم', z: 31, mass: 69.72, sym: { en: 'Ga', ar: 'Ga' } },
    { en: 'Germanium', ar: 'الجرمانيوم', z: 32, mass: 72.63, sym: { en: 'Ge', ar: 'Ge' } },
    { en: 'Arsenic', ar: 'الزرنيخ', z: 33, mass: 74.92, sym: { en: 'As', ar: 'As' } },
    { en: 'Selenium', ar: 'السيلينيوم', z: 34, mass: 78.97, sym: { en: 'Se', ar: 'Se' } },
    { en: 'Bromine', ar: 'البروم', z: 35, mass: 79.90, sym: { en: 'Br', ar: 'Br' } },
    { en: 'Krypton', ar: 'الكريبتون', z: 36, mass: 83.80, sym: { en: 'Kr', ar: 'Kr' } },
    { en: 'Rubidium', ar: 'الروبيديوم', z: 37, mass: 85.47, sym: { en: 'Rb', ar: 'Rb' } },
    { en: 'Strontium', ar: 'السترونشيوم', z: 38, mass: 87.62, sym: { en: 'Sr', ar: 'Sr' } },
    { en: 'Zirconium', ar: 'الزركونيوم', z: 40, mass: 91.22, sym: { en: 'Zr', ar: 'Zr' } },
    { en: 'Molybdenum', ar: 'الموليبدينوم', z: 42, mass: 95.95, sym: { en: 'Mo', ar: 'Mo' } },
    { en: 'Silver', ar: 'الفضة', z: 47, mass: 107.87, sym: { en: 'Ag', ar: 'Ag' } },
    { en: 'Cadmium', ar: 'الكادميوم', z: 48, mass: 112.41, sym: { en: 'Cd', ar: 'Cd' } },
    { en: 'Indium', ar: 'الإنديوم', z: 49, mass: 114.82, sym: { en: 'In', ar: 'In' } },
    { en: 'Tin', ar: 'القصدير', z: 50, mass: 118.71, sym: { en: 'Sn', ar: 'Sn' } },
    { en: 'Antimony', ar: 'الأنتيمون', z: 51, mass: 121.76, sym: { en: 'Sb', ar: 'Sb' } },
    { en: 'Iodine', ar: 'اليود', z: 53, mass: 126.90, sym: { en: 'I', ar: 'I' } },
    { en: 'Xenon', ar: 'الزينون', z: 54, mass: 131.29, sym: { en: 'Xe', ar: 'Xe' } },
    { en: 'Caesium', ar: 'السيزيوم', z: 55, mass: 132.91, sym: { en: 'Cs', ar: 'Cs' } },
    { en: 'Barium', ar: 'الباريوم', z: 56, mass: 137.33, sym: { en: 'Ba', ar: 'Ba' } },
    { en: 'Tungsten', ar: 'التنغستن', z: 74, mass: 183.84, sym: { en: 'W', ar: 'W' } },
    { en: 'Platinum', ar: 'البلاتين', z: 78, mass: 195.08, sym: { en: 'Pt', ar: 'Pt' } },
    { en: 'Gold', ar: 'الذهب', z: 79, mass: 196.97, sym: { en: 'Au', ar: 'Au' } },
    { en: 'Mercury', ar: 'الزئبق', z: 80, mass: 200.59, sym: { en: 'Hg', ar: 'Hg' } },
    { en: 'Lead', ar: 'الرصاص', z: 82, mass: 207.20, sym: { en: 'Pb', ar: 'Pb' } },
    { en: 'Bismuth', ar: 'البزموت', z: 83, mass: 208.98, sym: { en: 'Bi', ar: 'Bi' } },
    { en: 'Radium', ar: 'الراديوم', z: 88, mass: 226.03, sym: { en: 'Ra', ar: 'Ra' } },
    { en: 'Thorium', ar: 'الثوريوم', z: 90, mass: 232.04, sym: { en: 'Th', ar: 'Th' } },
    { en: 'Uranium', ar: 'اليورانيوم', z: 92, mass: 238.03, sym: { en: 'U', ar: 'U' } },
    { en: 'Plutonium', ar: 'البلوتونيوم', z: 94, mass: 244.06, sym: { en: 'Pu', ar: 'Pu' } },
  ],

  numeric: [
    {
      key: 'z',
      /* No margin. Atomic number is a proton count — two elements cannot tie and
         a gap of one is exact, so every quadruple makes a fair question. This is
         why the guard is per-attribute rather than one global constant. */
      minRatio: 0,
      unit: { en: '', ar: '' },
      format: (v) => `atomic number ${v}`,
      most: { en: 'Which of these elements has the highest atomic number?', ar: 'أي من هذه العناصر أعلى عدداً ذرياً؟' },
      least: { en: 'Which of these elements has the lowest atomic number?', ar: 'أي من هذه العناصر أقل عدداً ذرياً؟' },
    },
    {
      key: 'mass',
      minRatio: 1.15,
      unit: { en: 'u', ar: 'و.ك.ذ' },
      most: { en: 'Which of these elements is heaviest per atom?', ar: 'أي من هذه العناصر أثقل لكل ذرّة؟' },
      least: { en: 'Which of these elements is lightest per atom?', ar: 'أي من هذه العناصر أخفّ لكل ذرّة؟' },
    },
  ],

  mappings: [
    {
      key: 'sym',
      d: 2,
      en: 'What is the chemical symbol for {x}?',
      ar: 'ما الرمز الكيميائي لعنصر {x}؟',
      fact: { en: 'The symbol for {x} is {y}.', ar: 'رمز {x} هو {y}.' },
    },
  ],
};
