const BASE = [
  ['Cold','بارد','Hot','حار'],['Useless','عديم الفائدة','Essential','ضروري'],['Weakness','ضعف','Strength','قوة'],['Underrated','مبخوس حقه','Overrated','مبالغ فيه'],['Scary','مخيف','Safe','آمن'],['Cheap','رخيص','Expensive','غالٍ'],['Quiet','هادئ','Loud','صاخب'],['Old-fashioned','قديم الطراز','Modern','عصري'],['Boring','ممل','Exciting','مثير'],['Unhealthy','غير صحي','Healthy','صحي'],['Ugly','قبيح','Beautiful','جميل'],['Fantasy','خيال','Reality','واقع'],['Simple','بسيط','Complicated','معقّد'],['Common','شائع','Rare','نادر'],['Villain','شرير','Hero','بطل'],['Temporary','مؤقّت','Permanent','دائم'],['Casual','عفوي','Formal','رسمي'],['Dangerous','خطير','Harmless','غير مؤذٍ'],['Forgettable','يُنسى','Memorable','لا يُنسى'],['Introvert','انطوائي','Extrovert','اجتماعي'],['Logical','منطقي','Emotional','عاطفي'],['Waste of time','مضيعة للوقت','Worth it','يستحق العناء'],['Normal','عادي','Weird','غريب'],['Comfort','راحة','Adventure','مغامرة'],['Slow','بطيء','Fast','سريع'],['Empty','فارغ','Full','ممتلئ'],['Ancient','قديم','Futuristic','مستقبلي'],['Round','مستدير','Pointy','مدبّب'],['Light','خفيف','Heavy','ثقيل'],['Bad habit','عادة سيئة','Good habit','عادة جيدة'],['Whisper','همس','Scream','صراخ'],['Unlucky','منحوس','Lucky','محظوظ'],['Fragile','هشّ','Tough','متين'],['Sour','حامض','Sweet','حلو'],['Guilty','مذنب','Innocent','بريء'],['Messy','فوضوي','Tidy','مرتّب'],['Kids’ thing','للأطفال','Adults’ thing','للكبار'],['Overpriced','مبالغ في سعره','A bargain','صفقة رابحة'],['Taboo','محظور','Acceptable','مقبول'],['Basic','عادي','Luxury','فاخر'],
];

const CONTEXTS = [
  ['', ''], [' on a holiday', ' في إجازة'], [' for a party', ' لحفلة'],
  [' as a gift', ' كهدية'], [' for a weekend', ' لعطلة نهاية الأسبوع'],
];

export const SPECTRA = BASE.flatMap(([leftEn, leftAr, rightEn, rightAr]) =>
  CONTEXTS.map(([enSuffix, arSuffix]) => ({
    l: { en: `${leftEn}${enSuffix}`, ar: `${leftAr}${arSuffix}` },
    r: { en: `${rightEn}${enSuffix}`, ar: `${rightAr}${arSuffix}` },
  })),
).map((spectrum, index) => ({ id: `s${index}`, ...spectrum }));
