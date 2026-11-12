import { assetUrl } from '../lib/assetUrl';

/**
 * The Nayzak Family Cast — Guardians of the Cognitive Domains & Head Coach.
 *
 * Maps the 7 characters from `public/Assets/brand/characters/` directly into the
 * cognitive training architecture:
 * - Father: Daily Workout & Assessment Head Coach (Captain Nayzak)
 * - Toddler: Attention Guardian (Zayd)
 * - Teen: Speed Guardian (Rima)
 * - Boy: Memory Guardian (Sami)
 * - Girl: Language Guardian (Layan)
 * - Grandpa: Reasoning Guardian (Grandpa Hakim)
 * - Mother: Flexibility Guardian (Yasmin)
 */
export const NAYZAK_CAST = [
  {
    id: 'coach',
    domainId: null, // Global coach across all domains & daily workout
    nameEn: 'Captain Nayzak',
    nameAr: 'الكابتن نيزك',
    roleEn: 'Head Coach & Workout Guide',
    roleAr: 'المدرّب العام ومرشد التمارين',
    bioEn: 'The steadfast father who turns cognitive science into daily athletic mastery.',
    bioAr: 'الأب الحكيم الذي يحوّل علم الأعصاب والإدراك إلى تدريب يومي ممتع.',
    quoteEn: 'One daily session builds a resilient mind. Ready for today’s round?',
    quoteAr: 'جلسة يومية واحدة تصنع عقلاً حاداً ومستعداً. هل أنت جاهز لتحدي اليوم؟',
    avatarUrl: assetUrl('Assets/cartoon/nayzak_unified_leader.png'),
    portraitUrl: assetUrl('Assets/cartoon/nayzak_unified_leader.png'),
    accentColor: '#f5a623',
    hairTraitEn: 'Towering electric pillar hair',
    hairTraitAr: 'شعر عمودي صامد كبرج الإرادة',
  },
  {
    id: 'attention',
    domainId: 'attention',
    nameEn: 'Zayd',
    nameAr: 'زيد',
    roleEn: 'Attention & Focus Guardian',
    roleAr: 'حارس الانتباه والتركيز',
    bioEn: 'The lightning toddler whose intense gaze captures every fleeting detail.',
    bioAr: 'الطفل المفعم بالطاقة الذي يلتقط أدق التفاصيل في رمشة عين.',
    quoteEn: 'Spot the difference before it vanishes! Stay sharp!',
    quoteAr: 'انتبه بدقة قبل أن تختفي الإشارة! ركّز عينيك!',
    avatarUrl: assetUrl('Assets/cartoon/nayzak_unified_presenter.png'),
    portraitUrl: assetUrl('Assets/cartoon/nayzak_unified_presenter.png'),
    accentColor: '#e8ac4e',
    hairTraitEn: 'Lightning bolt crown',
    hairTraitAr: 'خصلات صاعقة كشرارات الانتباه',
  },
  {
    id: 'speed',
    domainId: 'speed',
    nameEn: 'Rima',
    nameAr: 'ريما',
    roleEn: 'Processing Speed Guardian',
    roleAr: 'حارسة سرعة المعالجة',
    bioEn: 'The high-velocity teen who races through visual streams with effortless rhythm.',
    bioAr: 'الشابة السريعة كالبرق التي تتخذ القرارات الصائبة في أجزاء من الثانية.',
    quoteEn: 'Swift reflexes, smooth flow. Keep your pace steady!',
    quoteAr: 'سرعة البديهة والتدفق السلس. واصل الانطلاق بدون تردد!',
    avatarUrl: assetUrl('Assets/cartoon/nayzak_unified_handshake.png'),
    portraitUrl: assetUrl('Assets/cartoon/nayzak_unified_handshake.png'),
    accentColor: '#00b4d8',
    hairTraitEn: 'Aerodynamic velocity ponytail',
    hairTraitAr: 'ذيل حصان انسيابي فائق السرعة',
  },
  {
    id: 'memory',
    domainId: 'memory',
    nameEn: 'Sami',
    nameAr: 'سامي',
    roleEn: 'Working Memory Guardian',
    roleAr: 'حارس الذاكرة العاملة',
    bioEn: 'The young strategist with an ignited crown of synaptic memory nodes.',
    bioAr: 'الفتى الذكي الذي يضيء مسارات الذاكرة ويحتفظ بالتسلسلات المعقدة.',
    quoteEn: 'Hold the pattern in mind, then recall with confidence!',
    quoteAr: 'احفظ النمط في ذاكرتك، ثم استرجعه بكل ثقة!',
    avatarUrl: assetUrl('Assets/cartoon/nayzak_unified_epiphany.png'),
    portraitUrl: assetUrl('Assets/cartoon/nayzak_unified_epiphany.png'),
    accentColor: '#84cc16',
    hairTraitEn: 'Quad-branch torch synapses',
    hairTraitAr: 'شعلات متشعبة تمثل مشابك الذاكرة',
  },
  {
    id: 'language',
    domainId: 'language',
    nameEn: 'Layan',
    nameAr: 'ليان',
    roleEn: 'Language & Verbal Guardian',
    roleAr: 'حارسة اللغة والفصاحة',
    bioEn: 'The poetic spirit whose swirling curls hold stories, synonyms, and words.',
    bioAr: 'الفتاة المبدعة التي يفيض خيالها بالمفردات والحكايات والمعاني.',
    quoteEn: 'Every word is a bridge to clarity. Find the perfect match!',
    quoteAr: 'كل كلمة جسر نحو الفهم. اكتشف اللفظ الأنسب!',
    avatarUrl: assetUrl('Assets/cartoon/nayzak_unified_read_scroll.png'),
    portraitUrl: assetUrl('Assets/cartoon/nayzak_unified_read_scroll.png'),
    accentColor: '#f97316',
    hairTraitEn: 'Expansive cloud of expressive curls',
    hairTraitAr: 'سحابة غنية من الخصلات المعبرة',
  },
  {
    id: 'reasoning',
    domainId: 'reasoning',
    nameEn: 'Grandpa Hakim',
    nameAr: 'الجد حكيم',
    roleEn: 'Logic & Reasoning Guardian',
    roleAr: 'حارس الاستدلال والمنطق',
    bioEn: 'The elder philosopher who unlocks the deepest riddles and spatial patterns.',
    bioAr: 'الجد الحكيم الذي يفكك أعقد الأنماط ويستنبط الحلول بحنكة وهدوء.',
    quoteEn: 'Observe the rules, deduce the sequence, master the puzzle.',
    quoteAr: 'تأمّل القواعد، استنتج العلاقة، واظفر بالحل المنطقي.',
    avatarUrl: assetUrl('Assets/cartoon/nayzak_unified_build_wall.png'),
    portraitUrl: assetUrl('Assets/cartoon/nayzak_unified_build_wall.png'),
    accentColor: '#a855f7',
    hairTraitEn: 'Split-fountain silver wisdom crest',
    hairTraitAr: 'شعر فضي مقوّس كأقواس الحكمة والمنطق',
  },
  {
    id: 'flexibility',
    domainId: 'flexibility',
    nameEn: 'Yasmin',
    nameAr: 'ياسمين',
    roleEn: 'Cognitive Flexibility Guardian',
    roleAr: 'حارسة المرونة الذهنية',
    bioEn: 'The graceful mother who effortlessly shifts strategies when rules change.',
    bioAr: 'الأم الرقيقة التي تتكيّف فوراً مع تغيّر القواعد وتجد التوازن دائماً.',
    quoteEn: 'When the path shifts, adapt with grace and pivot your thinking.',
    quoteAr: 'عندما تتبدل القواعد، تكيّف بمرونة وحوّل تفكيرك بسلاسة.',
    avatarUrl: assetUrl('Assets/cartoon/nayzak_unified_suit.png'),
    portraitUrl: assetUrl('Assets/cartoon/nayzak_unified_suit.png'),
    accentColor: '#ec4899',
    hairTraitEn: 'Heart-shaped crown with dual balance lobes',
    hairTraitAr: 'تسريحة القلب المتوازنة برباط أزرق أنيق',
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
