import { assetUrl } from '../lib/assetUrl';

/**
 * Canonical Nayzak Family Cast — Mapped directly from the official
 * Nayzak YouTube / Nayzak Family & Nayzak Games brand bible.
 *
 * All sprites in `public/Assets/brand/cast-2026/` are trimmed, transparent
 * 512×512 sprites in the flat 2D thick-black-outline Hussain/Nayzak cartoon style.
 */
export const NAYZAK_CAST = [
  {
    id: 'coach',
    domainId: null, // Global host & daily workout presenter
    nameEn: 'Captain Nayzak',
    nameAr: 'نيزك',
    roleEn: 'Show Host & Head Coach',
    roleAr: 'مقدّم التحدي والمدرّب العام',
    bioEn: 'Towering black hair, camel blazer, and endless curiosity — Nayzak hosts every daily challenge.',
    bioAr: 'صاحب الشعر الشاهق والبدلة البنية — نيزك يقدّم تحدياتك الذهنية اليومية بأسلوبه المشوّق.',
    quoteEn: 'Three quick rounds to sharpen your mind. Ready to beat me today?',
    quoteAr: 'ثلاث جولات ذكية تنشّط عقلك. هل أنت جاهز لهزيمتي اليوم؟',
    avatarUrl: assetUrl('Assets/brand/cast-2026/nayzak-host.webp'),
    epiphanyUrl: assetUrl('Assets/brand/cast-2026/nayzak-epiphany.webp'),
    leaderUrl: assetUrl('Assets/brand/cast-2026/nayzak-leader.webp'),
    thinkUrl: assetUrl('Assets/brand/cast-2026/nayzak-think.webp'),
    portraitUrl: assetUrl('Assets/brand/cast-2026/nayzak-host.webp'),
    accentColor: '#FF7800',
    stageBg: '#FFF3D6',
    hairTraitEn: 'Towering jet-black pillar hair',
    hairTraitAr: 'شعر عمودي شاهق لا تخطئه العين',
  },
  {
    id: 'attention',
    domainId: 'attention',
    nameEn: 'Zamour',
    nameAr: 'زمّور',
    roleEn: 'Attention Guardian · Toddler',
    roleAr: 'حارس الانتباه والتركيز',
    bioEn: 'Full of spark and panic energy — nothing shiny escapes Zamour’s wide eyes.',
    bioAr: 'طفل مفعم بالطاقة والشرارة — لا تفوّت عيناه أي تفصيل صغير أو حركة خاطفة.',
    quoteEn: 'Spot the odd target fast before my hair spikes up!',
    quoteAr: 'التقط الهدف المختلف بسرعة قبل ما تنفجر شرارة تركيزي!',
    avatarUrl: assetUrl('Assets/brand/cast-2026/zamour-spark.webp'),
    portraitUrl: assetUrl('Assets/brand/cast-2026/zamour-spark.webp'),
    accentColor: '#FF7800',
    stageBg: '#FFF4E5',
    hairTraitEn: 'Lightning-bolt hair crown',
    hairTraitAr: 'شعر صاعق كشرارات البرق',
  },
  {
    id: 'speed',
    domainId: 'speed',
    nameEn: 'Abu Asnan',
    nameAr: 'أبو أسنان',
    roleEn: 'Speed Guardian',
    roleAr: 'حارس سرعة المعالجة',
    bioEn: 'Mischievous sprinter with oversized buck teeth and four spiked locks racing the clock.',
    bioAr: 'فتى سريع البديهة بابتسامته العريضة — يسابق الثواني في كل اختبار بصري.',
    quoteEn: 'Eyes on the clock! Blink and I already solved two rounds!',
    quoteAr: 'عينك على الساعة! لو رمشت بتكون فاتتك جولتان!',
    avatarUrl: assetUrl('Assets/brand/cast-2026/abuasnan-boy.webp'),
    portraitUrl: assetUrl('Assets/brand/cast-2026/abuasnan-boy.webp'),
    accentColor: '#0B63CE',
    stageBg: '#EFF6FF',
    hairTraitEn: 'Four tied comet spikes',
    hairTraitAr: 'خصلات مشدودة كالسهام',
  },
  {
    id: 'memory',
    domainId: 'memory',
    nameEn: 'Shofata',
    nameAr: 'شوفاتة',
    roleEn: 'Memory Guardian · Cheerleader',
    roleAr: 'حارسة الذاكرة والتشجيع',
    bioEn: 'Freckled eldest sister whose towering afro curls store every clue, pattern, and high score.',
    bioAr: 'الأخت الكبرى المرحة ذات الضفائر الكثيفة — تحفظ كل تفصيل وتحتفل بكل إنجاز.',
    quoteEn: 'Lock the pattern in mind — I’m already cheering for your streak!',
    quoteAr: 'ثبّت النمط في ذاكرتك — أنا مستعدة للتشجيع مع أول فوز!',
    avatarUrl: assetUrl('Assets/brand/cast-2026/shofata-cheer.webp'),
    portraitUrl: assetUrl('Assets/brand/cast-2026/shofata-cheer.webp'),
    accentColor: '#1CB0F6',
    stageBg: '#F0F9FF',
    hairTraitEn: 'Towering spiral afro curls',
    hairTraitAr: 'ضفائر حلزونية عمودية مميزة',
  },
  {
    id: 'language',
    domainId: 'language',
    nameEn: 'Kawkaba',
    nameAr: 'كوكبة',
    roleEn: 'Language Guardian · Mum',
    roleAr: 'حارسة اللغة والفصاحة',
    bioEn: 'Sharp-eyed mom with a signature red-bow ponytail who spots every synonym and nuance.',
    bioAr: 'الأم الذكية صاحبة الفيونكة الحمراء — تلتقط أدق المعاني والمفردات بلا تردد.',
    quoteEn: 'Precision in every word turns confusion into clarity.',
    quoteAr: 'الدقة في اختيار الكلمة تحوّل الغموض إلى وضوح تام.',
    avatarUrl: assetUrl('Assets/brand/cast-2026/kawkaba-mum.webp'),
    portraitUrl: assetUrl('Assets/brand/cast-2026/kawkaba-mum.webp'),
    accentColor: '#0D9488',
    stageBg: '#F0FDFA',
    hairTraitEn: 'High red-bow plume ponytail',
    hairTraitAr: 'ذيل حصان شاهق بفيونكة حمراء',
  },
  {
    id: 'reasoning',
    domainId: 'reasoning',
    nameEn: 'Grandpa Dalfin',
    nameAr: 'الجد دلفين',
    roleEn: 'Logic & Riddle Master',
    roleAr: 'حارس المنطق وألغاز العائلة',
    bioEn: 'Silver crescent hair, white mustache, and total confidence — always sure he cracked the riddle first.',
    bioAr: 'الجد دلفين بشاربه الأبيض — واثق دائماً أنه كشف خدعة اللغز قبل الجميع!',
    quoteEn: 'Look past the obvious trick — every rule leaves a clue!',
    quoteAr: 'لا تنخدع بالظاهر — كل لغز يخفي مفتاحه لمن يركّز!',
    avatarUrl: assetUrl('Assets/brand/cast-2026/dalfin-wise.webp'),
    portraitUrl: assetUrl('Assets/brand/cast-2026/dalfin-wise.webp'),
    accentColor: '#4F46E5',
    stageBg: '#EEF2FF',
    hairTraitEn: 'Twin silver crescent horns',
    hairTraitAr: 'قرنا شعر فضيان مقوّسان',
  },
  {
    id: 'flexibility',
    domainId: 'flexibility',
    nameEn: 'Grandma Zanana',
    nameAr: 'الجدة زنانة',
    roleEn: 'Flexibility Guardian · Grandma',
    roleAr: 'حارسة المرونة الذهنية',
    bioEn: 'With her giant heart bouffant and blue bow, Zanana pivots calmly whenever rules flip upside down.',
    bioAr: 'الجدة زنانة بتسريحة القلب والرباط الأزرق — تتأقلم بهدوء مهما تقلّبت القواعد.',
    quoteEn: 'When the rule flips mid-game, smile and switch gears faster!',
    quoteAr: 'عندما تتغيّر القاعدة فجأة، ابتسم وبدّل خطتك بمرونة!',
    avatarUrl: assetUrl('Assets/brand/cast-2026/zanana-grandma.webp'),
    portraitUrl: assetUrl('Assets/brand/cast-2026/zanana-grandma.webp'),
    accentColor: '#DF4E32',
    stageBg: '#FFF1EE',
    hairTraitEn: 'Giant heart-shaped bouffant & blue bow',
    hairTraitAr: 'تسريحة قلب ضخمة مع رباط أزرق',
  },
];

export const NAYZAK_CAST_BY_ID = Object.fromEntries(
  NAYZAK_CAST.map((c) => [c.id, c])
);

export const NAYZAK_CAST_BY_DOMAIN = Object.fromEntries(
  NAYZAK_CAST.filter((c) => c.domainId).map((c) => [c.domainId, c])
);

export function getDomainGuardian(domainId) {
  return NAYZAK_CAST_BY_DOMAIN[domainId] || NAYZAK_CAST_BY_ID.coach;
}
