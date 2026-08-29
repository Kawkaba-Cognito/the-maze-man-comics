/*
 * WAVELENGTH — the spectra a clue-giver places a thing on.
 *
 * ⚠ A CONTEXT SUFFIX IS NOT UNIVERSAL, AND APPLYING IT TO EVERY PAIR MADE
 * NONSENSE (2026-08-29). Each base pair used to be crossed with all five
 * contexts unconditionally, so 4 out of every 5 spectra in the bank carried a
 * suffix — and for a third of the pairs the result was not a spectrum at all:
 *
 *     "Villain as a gift  ↔  Hero as a gift"
 *     "Introvert for a weekend  ↔  Extrovert for a weekend"
 *     "Guilty on a holiday  ↔  Innocent on a holiday"
 *     "Round for a party  ↔  Pointy for a party"
 *
 * A round dies on one of those: nobody can place a thing on an axis that does
 * not mean anything, so the group either laughs it off or grinds to a halt, and
 * either way the clue-giver got a dud through no fault of their own.
 *
 * The last field says whether the pair JUDGES A THING — "Cheap as a gift" reads
 * naturally because cheap is a property a gift can have. Pairs describing a
 * person, a mood, a moral or a shape take no suffix and appear on their own.
 * This is the same fix, for the same reason, as the pack modes in
 * _shared/groupPacks.js: a mechanical expansion is only as good as its worst
 * combination, and nobody ever reads all of them.
 */
const BASE = [
  ['Cold', 'بارد', 'Hot', 'حار', true],
  ['Useless', 'عديم الفائدة', 'Essential', 'ضروري', true],
  ['Weakness', 'ضعف', 'Strength', 'قوة', false],
  ['Underrated', 'مبخوس حقه', 'Overrated', 'مبالغ فيه', true],
  ['Scary', 'مخيف', 'Safe', 'آمن', true],
  ['Cheap', 'رخيص', 'Expensive', 'غالٍ', true],
  ['Quiet', 'هادئ', 'Loud', 'صاخب', true],
  ['Old-fashioned', 'قديم الطراز', 'Modern', 'عصري', true],
  ['Boring', 'ممل', 'Exciting', 'مثير', true],
  ['Unhealthy', 'غير صحي', 'Healthy', 'صحي', true],
  ['Ugly', 'قبيح', 'Beautiful', 'جميل', true],
  ['Fantasy', 'خيال', 'Reality', 'واقع', false],
  ['Simple', 'بسيط', 'Complicated', 'معقّد', true],
  ['Common', 'شائع', 'Rare', 'نادر', true],
  ['Villain', 'شرير', 'Hero', 'بطل', false],
  ['Temporary', 'مؤقّت', 'Permanent', 'دائم', true],
  ['Casual', 'عفوي', 'Formal', 'رسمي', true],
  ['Dangerous', 'خطير', 'Harmless', 'غير مؤذٍ', true],
  ['Forgettable', 'يُنسى', 'Memorable', 'لا يُنسى', true],
  ['Introvert', 'انطوائي', 'Extrovert', 'اجتماعي', false],
  ['Logical', 'منطقي', 'Emotional', 'عاطفي', false],
  ['Waste of time', 'مضيعة للوقت', 'Worth it', 'يستحق العناء', true],
  ['Normal', 'عادي', 'Weird', 'غريب', true],
  ['Comfort', 'راحة', 'Adventure', 'مغامرة', true],
  ['Slow', 'بطيء', 'Fast', 'سريع', true],
  ['Empty', 'فارغ', 'Full', 'ممتلئ', false],
  ['Ancient', 'قديم', 'Futuristic', 'مستقبلي', true],
  ['Round', 'مستدير', 'Pointy', 'مدبّب', false],
  ['Light', 'خفيف', 'Heavy', 'ثقيل', true],
  ['Bad habit', 'عادة سيئة', 'Good habit', 'عادة جيدة', false],
  ['Whisper', 'همس', 'Scream', 'صراخ', false],
  ['Unlucky', 'منحوس', 'Lucky', 'محظوظ', true],
  ['Fragile', 'هشّ', 'Tough', 'متين', true],
  ['Sour', 'حامض', 'Sweet', 'حلو', true],
  ['Guilty', 'مذنب', 'Innocent', 'بريء', false],
  ['Messy', 'فوضوي', 'Tidy', 'مرتّب', true],
  ['Kids’ thing', 'للأطفال', 'Adults’ thing', 'للكبار', true],
  ['Overpriced', 'مبالغ في سعره', 'A bargain', 'صفقة رابحة', true],
  ['Taboo', 'محظور', 'Acceptable', 'مقبول', false],
  ['Basic', 'عادي', 'Luxury', 'فاخر', true],
];

/** The plain pair is always first; the rest only apply where BASE allows it. */
const CONTEXTS = [
  ['', ''], [' on a holiday', ' في إجازة'], [' for a party', ' لحفلة'],
  [' as a gift', ' كهدية'], [' for a weekend', ' لعطلة نهاية الأسبوع'],
];

export const SPECTRA = BASE.flatMap(([leftEn, leftAr, rightEn, rightAr, takesContext]) =>
  (takesContext ? CONTEXTS : [CONTEXTS[0]]).map(([enSuffix, arSuffix]) => ({
    l: { en: `${leftEn}${enSuffix}`, ar: `${leftAr}${arSuffix}` },
    r: { en: `${rightEn}${enSuffix}`, ar: `${rightAr}${arSuffix}` },
  })),
).map((spectrum, index) => ({ id: `s${index}`, ...spectrum }));
