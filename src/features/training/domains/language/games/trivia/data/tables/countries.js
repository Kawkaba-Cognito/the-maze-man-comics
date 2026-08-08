/*
 * Countries — a structured table the generator turns into questions.
 *
 * `area` is land+water in km², `pop` in millions (rounded — the generator only
 * ever compares them, and a table that pretends to know Nigeria's population to
 * the person would be lying). Both are stable enough that a question generated
 * from them stays true for years, which is the bar the authored bank sets too.
 *
 * Rows are the countries a general audience can be expected to place. That is a
 * deliberate ceiling on the table's size, not an oversight: a question asking
 * which of four countries nobody has heard of is larger is not knowledge, it is
 * a coin flip with extra steps.
 */
export const COUNTRIES = {
  id: 'geography',
  rows: [
    { en: 'Russia', ar: 'روسيا', area: 17098246, pop: 144, capital: { en: 'Moscow', ar: 'موسكو' } },
    { en: 'Canada', ar: 'كندا', area: 9984670, pop: 39, capital: { en: 'Ottawa', ar: 'أوتاوا' } },
    { en: 'China', ar: 'الصين', area: 9596961, pop: 1412, capital: { en: 'Beijing', ar: 'بكين' } },
    { en: 'United States', ar: 'الولايات المتحدة', area: 9525067, pop: 335, capital: { en: 'Washington, D.C.', ar: 'واشنطن' } },
    { en: 'Brazil', ar: 'البرازيل', area: 8515767, pop: 216, capital: { en: 'Brasília', ar: 'برازيليا' } },
    { en: 'Australia', ar: 'أستراليا', area: 7692024, pop: 26, capital: { en: 'Canberra', ar: 'كانبرا' } },
    { en: 'India', ar: 'الهند', area: 3287263, pop: 1428, capital: { en: 'New Delhi', ar: 'نيودلهي' } },
    { en: 'Argentina', ar: 'الأرجنتين', area: 2780400, pop: 46, capital: { en: 'Buenos Aires', ar: 'بوينس آيرس' } },
    { en: 'Kazakhstan', ar: 'كازاخستان', area: 2724900, pop: 20, capital: { en: 'Astana', ar: 'أستانا' } },
    { en: 'Algeria', ar: 'الجزائر', area: 2381741, pop: 45, capital: { en: 'Algiers', ar: 'الجزائر العاصمة' } },
    { en: 'Saudi Arabia', ar: 'السعودية', area: 2149690, pop: 37, capital: { en: 'Riyadh', ar: 'الرياض' } },
    { en: 'Mexico', ar: 'المكسيك', area: 1964375, pop: 129, capital: { en: 'Mexico City', ar: 'مكسيكو سيتي' } },
    { en: 'Indonesia', ar: 'إندونيسيا', area: 1904569, pop: 278, capital: { en: 'Jakarta', ar: 'جاكرتا' } },
    { en: 'Sudan', ar: 'السودان', area: 1861484, pop: 48, capital: { en: 'Khartoum', ar: 'الخرطوم' } },
    { en: 'Libya', ar: 'ليبيا', area: 1759540, pop: 7, capital: { en: 'Tripoli', ar: 'طرابلس' } },
    { en: 'Iran', ar: 'إيران', area: 1648195, pop: 89, capital: { en: 'Tehran', ar: 'طهران' } },
    { en: 'Mongolia', ar: 'منغوليا', area: 1564110, pop: 3, capital: { en: 'Ulaanbaatar', ar: 'أولان باتور' } },
    { en: 'Peru', ar: 'بيرو', area: 1285216, pop: 34, capital: { en: 'Lima', ar: 'ليما' } },
    { en: 'Chad', ar: 'تشاد', area: 1284000, pop: 18, capital: { en: "N'Djamena", ar: 'إنجامينا' } },
    { en: 'Egypt', ar: 'مصر', area: 1002450, pop: 113, capital: { en: 'Cairo', ar: 'القاهرة' } },
    { en: 'Nigeria', ar: 'نيجيريا', area: 923768, pop: 224, capital: { en: 'Abuja', ar: 'أبوجا' } },
    { en: 'Turkey', ar: 'تركيا', area: 783562, pop: 85, capital: { en: 'Ankara', ar: 'أنقرة' } },
    { en: 'Chile', ar: 'تشيلي', area: 756102, pop: 20, capital: { en: 'Santiago', ar: 'سانتياغو' } },
    { en: 'Pakistan', ar: 'باكستان', area: 881913, pop: 240, capital: { en: 'Islamabad', ar: 'إسلام آباد' } },
    { en: 'Ethiopia', ar: 'إثيوبيا', area: 1104300, pop: 126, capital: { en: 'Addis Ababa', ar: 'أديس أبابا' } },
    { en: 'South Africa', ar: 'جنوب أفريقيا', area: 1221037, pop: 60, capital: { en: 'Pretoria', ar: 'بريتوريا' } },
    { en: 'Colombia', ar: 'كولومبيا', area: 1141748, pop: 52, capital: { en: 'Bogotá', ar: 'بوغوتا' } },
    { en: 'France', ar: 'فرنسا', area: 551695, pop: 68, capital: { en: 'Paris', ar: 'باريس' } },
    { en: 'Spain', ar: 'إسبانيا', area: 505992, pop: 48, capital: { en: 'Madrid', ar: 'مدريد' } },
    { en: 'Thailand', ar: 'تايلاند', area: 513120, pop: 72, capital: { en: 'Bangkok', ar: 'بانكوك' } },
    { en: 'Sweden', ar: 'السويد', area: 450295, pop: 11, capital: { en: 'Stockholm', ar: 'ستوكهولم' } },
    { en: 'Morocco', ar: 'المغرب', area: 446550, pop: 37, capital: { en: 'Rabat', ar: 'الرباط' } },
    { en: 'Iraq', ar: 'العراق', area: 438317, pop: 45, capital: { en: 'Baghdad', ar: 'بغداد' } },
    { en: 'Japan', ar: 'اليابان', area: 377975, pop: 124, capital: { en: 'Tokyo', ar: 'طوكيو' } },
    { en: 'Germany', ar: 'ألمانيا', area: 357022, pop: 84, capital: { en: 'Berlin', ar: 'برلين' } },
    { en: 'Vietnam', ar: 'فيتنام', area: 331212, pop: 99, capital: { en: 'Hanoi', ar: 'هانوي' } },
    { en: 'Norway', ar: 'النرويج', area: 385207, pop: 5, capital: { en: 'Oslo', ar: 'أوسلو' } },
    { en: 'Poland', ar: 'بولندا', area: 312696, pop: 37, capital: { en: 'Warsaw', ar: 'وارسو' } },
    { en: 'Italy', ar: 'إيطاليا', area: 301340, pop: 59, capital: { en: 'Rome', ar: 'روما' } },
    { en: 'Philippines', ar: 'الفلبين', area: 300000, pop: 117, capital: { en: 'Manila', ar: 'مانيلا' } },
    { en: 'New Zealand', ar: 'نيوزيلندا', area: 268021, pop: 5, capital: { en: 'Wellington', ar: 'ولينغتون' } },
    { en: 'United Kingdom', ar: 'المملكة المتحدة', area: 243610, pop: 68, capital: { en: 'London', ar: 'لندن' } },
    { en: 'Ghana', ar: 'غانا', area: 238535, pop: 34, capital: { en: 'Accra', ar: 'أكرا' } },
    { en: 'Romania', ar: 'رومانيا', area: 238397, pop: 19, capital: { en: 'Bucharest', ar: 'بوخارست' } },
    { en: 'Belarus', ar: 'بيلاروسيا', area: 207600, pop: 9, capital: { en: 'Minsk', ar: 'مينسك' } },
    { en: 'Kenya', ar: 'كينيا', area: 580367, pop: 55, capital: { en: 'Nairobi', ar: 'نيروبي' } },
    { en: 'Ukraine', ar: 'أوكرانيا', area: 603500, pop: 38, capital: { en: 'Kyiv', ar: 'كييف' } },
    { en: 'Greece', ar: 'اليونان', area: 131957, pop: 10, capital: { en: 'Athens', ar: 'أثينا' } },
    { en: 'Nepal', ar: 'نيبال', area: 147181, pop: 31, capital: { en: 'Kathmandu', ar: 'كاتماندو' } },
    { en: 'Tunisia', ar: 'تونس', area: 163610, pop: 12, capital: { en: 'Tunis', ar: 'تونس العاصمة' } },
    { en: 'Cuba', ar: 'كوبا', area: 109884, pop: 11, capital: { en: 'Havana', ar: 'هافانا' } },
    { en: 'Portugal', ar: 'البرتغال', area: 92212, pop: 10, capital: { en: 'Lisbon', ar: 'لشبونة' } },
    { en: 'Jordan', ar: 'الأردن', area: 89342, pop: 11, capital: { en: 'Amman', ar: 'عمّان' } },
    { en: 'Austria', ar: 'النمسا', area: 83879, pop: 9, capital: { en: 'Vienna', ar: 'فيينا' } },
    { en: 'Ireland', ar: 'أيرلندا', area: 70273, pop: 5, capital: { en: 'Dublin', ar: 'دبلن' } },
    { en: 'Sri Lanka', ar: 'سريلانكا', area: 65610, pop: 22, capital: { en: 'Colombo', ar: 'كولومبو' } },
    { en: 'Switzerland', ar: 'سويسرا', area: 41285, pop: 9, capital: { en: 'Bern', ar: 'برن' } },
    { en: 'Netherlands', ar: 'هولندا', area: 41850, pop: 18, capital: { en: 'Amsterdam', ar: 'أمستردام' } },
    { en: 'Denmark', ar: 'الدنمارك', area: 42933, pop: 6, capital: { en: 'Copenhagen', ar: 'كوبنهاغن' } },
    { en: 'Belgium', ar: 'بلجيكا', area: 30528, pop: 12, capital: { en: 'Brussels', ar: 'بروكسل' } },
    { en: 'Kuwait', ar: 'الكويت', area: 17818, pop: 4, capital: { en: 'Kuwait City', ar: 'مدينة الكويت' } },
    { en: 'Qatar', ar: 'قطر', area: 11586, pop: 3, capital: { en: 'Doha', ar: 'الدوحة' } },
    { en: 'Lebanon', ar: 'لبنان', area: 10452, pop: 5, capital: { en: 'Beirut', ar: 'بيروت' } },
    { en: 'Jamaica', ar: 'جامايكا', area: 10991, pop: 3, capital: { en: 'Kingston', ar: 'كينغستون' } },
    { en: 'Iceland', ar: 'آيسلندا', area: 103000, pop: 0.4, capital: { en: 'Reykjavík', ar: 'ريكيافيك' } },
    { en: 'Singapore', ar: 'سنغافورة', area: 734, pop: 6, capital: { en: 'Singapore', ar: 'سنغافورة' } },
  ],

  numeric: [
    {
      key: 'area',
      /* 1.25 — areas span five orders of magnitude, so a 25% gap is already a
         decisive one, and anything tighter would reject most of the table. */
      minRatio: 1.25,
      unit: { en: 'km²', ar: 'كم²' },
      most: { en: 'Which of these countries has the largest area?', ar: 'أي من هذه الدول أكبر مساحة؟' },
      least: { en: 'Which of these countries has the smallest area?', ar: 'أي من هذه الدول أصغر مساحة؟' },
    },
    {
      key: 'pop',
      /* 1.4 on population: the table stores millions rounded, so two countries
         a few million apart are not reliably ordered by this data and must not
         be turned into a question. */
      minRatio: 1.4,
      unit: { en: 'million people', ar: 'مليون نسمة' },
      format: (v) => (v < 1 ? v.toString() : Math.round(v).toLocaleString()),
      most: { en: 'Which of these countries has the largest population?', ar: 'أي من هذه الدول أكبر سكاناً؟' },
      least: { en: 'Which of these countries has the smallest population?', ar: 'أي من هذه الدول أقل سكاناً؟' },
    },
  ],

  mappings: [
    {
      key: 'capital',
      d: 1,
      en: 'What is the capital of {x}?',
      ar: 'ما عاصمة {x}؟',
      fact: { en: '{y} is the capital of {x}.', ar: '{y} هي عاصمة {x}.' },
    },
  ],
};
