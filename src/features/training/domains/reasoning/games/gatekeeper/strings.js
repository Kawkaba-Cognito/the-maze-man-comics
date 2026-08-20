/*
 * THE GATE — every word the player reads, in both languages.
 *
 * Kept out of index.jsx for the reason Detective's are: a law is assembled from
 * parts at runtime, and sentence assembly that has to work in two languages
 * with different word order is not something to scatter through a component.
 *
 * ⚠ `T` spreads STR_COMMON FIRST. Every key after the spread is a deliberate
 * local override or a word this game alone needs; a shared label retyped here
 * would be a bug, not a style choice.
 */
import { STR_COMMON } from '../../../../shared/trainingStrings.js';
import { folkOf } from './data.js';

/* ── the parts a law is built from ──────────────────────────────────────── */
const ATOM = {
  en: {
    folk: (v) => `${folkOf(v).en}-folk`,
    shape: (v) => ({ round: 'the round ones', boxy: 'the boxy ones', pointy: 'the pointy ones' })[v],
    moons: (v) => (v === 1 ? 'travellers with one moon' : `travellers with ${v} moons`),
    fill: (v) => (v === 'striped' ? 'the striped ones' : 'the unstriped ones'),
  },
  ar: {
    folk: (v) => `آل ${folkOf(v).ar}`,
    shape: (v) => ({ round: 'المستديرون', boxy: 'المربّعون', pointy: 'المدبّبون' })[v],
    moons: (v) => (v === 1 ? 'أصحاب القمر الواحد' : v === 2 ? 'أصحاب القمرين' : 'أصحاب الأقمار الثلاثة'),
    fill: (v) => (v === 'striped' ? 'المخطّطون' : 'غير المخطّطين'),
  },
};

export function atomText(atom, lang) {
  const fn = ATOM[lang === 'ar' ? 'ar' : 'en'][atom.attr];
  return fn ? fn(atom.val) : '';
}

/* ── the law itself ─────────────────────────────────────────────────────── */
const LAW = {
  en: {
    pos1: (a) => `Only ${a} may pass.`,
    neg1: (a) => `No ${a} get through.`,
    and: (a, b) => `Both, or nothing — ${a} AND ${b}.`,
    or: (a, b) => `Either road — ${a} OR ${b}.`,
    mixed: (a, b) => `${a} — but never ${b}.`,
    notboth: (a, b) => `Never BOTH ${a} and ${b}.`,
    boss: (a, b, c) => `${a} AND ${b} — or else ${c}.`,
  },
  ar: {
    pos1: (a) => `لا يعبر إلا ${a}.`,
    neg1: (a) => `${a} لا يعبرون أبداً.`,
    and: (a, b) => `${a} و${b} معاً، وإلا فلا.`,
    or: (a, b) => `${a} أو ${b} — أيّهما كان.`,
    mixed: (a, b) => `${a}، لكن ليس ${b}.`,
    notboth: (a, b) => `لا يجتمع ${a} و${b} أبداً.`,
    boss: (a, b, c) => `${a} و${b} معاً — أو ${c} وحده.`,
  },
};

/** The secret law, written out. Shown only once the gate is decided. */
export function lawText(law, lang) {
  const L = LAW[lang === 'ar' ? 'ar' : 'en'];
  const a = law.a ? atomText(law.a, lang) : '';
  const b = law.b ? atomText(law.b, lang) : '';
  const c = law.c ? atomText(law.c, lang) : '';
  const fn = L[law.kind];
  return fn ? fn(a, b, c) : '';
}

/** What the Lens buys: the attributes the law speaks of, named. */
const ATTR_WORD = {
  en: { folk: 'who they are', shape: 'their shape', moons: 'their moons', fill: 'their stripes' },
  ar: { folk: 'هويّتهم', shape: 'شكلهم', moons: 'أقمارهم', fill: 'خطوطهم' },
};
export const attrWords = (attrs, lang) => attrs.map((a) => ATTR_WORD[lang === 'ar' ? 'ar' : 'en'][a]);

/* ── the level families, so a player can name what changed ──────────────── */
export const FAMILY = {
  en: [
    { name: 'THE FIRST GATE', sub: 'one law, plainly said' },
    { name: 'STRIPED ARRIVALS', sub: 'a new thing to notice' },
    { name: 'CROSSED LAWS', sub: 'two ideas at once' },
    { name: 'THIN SCRUTINY', sub: 'one probe fewer' },
    { name: 'THE REFUSAL', sub: 'what is forbidden' },
    { name: "THE KEEPER'S MAZE", sub: 'everything he knows' },
  ],
  ar: [
    { name: 'البوابة الأولى', sub: 'قانون واحد، واضح' },
    { name: 'القادمون المخطّطون', sub: 'شيء جديد تنتبه له' },
    { name: 'قوانين متقاطعة', sub: 'فكرتان معاً' },
    { name: 'تدقيق ضيّق', sub: 'فحص أقلّ بواحد' },
    { name: 'الرفض', sub: 'ما هو ممنوع' },
    { name: 'متاهة الحارس', sub: 'كل ما يعرفه' },
  ],
};

/** Which family a level belongs to — mirrors the six half-tiers in data.js. */
export function familyIndex(diff, f) {
  const tier = diff === 'easy' ? 0 : diff === 'med' ? 1 : 2;
  return tier * 2 + (f < 0.5 ? 0 : 1);
}

export const T = {
  en: {
    ...STR_COMMON.en,
    title: 'The Gate',
    menu: 'Menu',

    gateOf: (n, m) => `Gate ${n} of ${m}`,
    probesLeft: (n) => `${n} ${n === 1 ? 'probe' : 'probes'} left`,
    seals: 'Seals',
    lens: 'Use the Lens',
    lensSays: (words) => `The Lens whispers: this law speaks of ${words}.`,
    lensSpent: 'The Lens is spent',

    probeTitle: 'Test the law',
    probeHint: 'Tap a traveller and Haris will stamp them. Spend your probes where they teach you most.',
    tribute: 'Send the traveller',
    tributeHint: 'Exactly ONE of these three will be let through. Choose.',
    ledger: 'The ledger',
    waiting: 'THE GATE WAITS',
    admitted: 'ADMITTED',
    refused: 'REFUSED',
    stampIn: 'IN',
    stampOut: 'OUT',

    ready: 'I know the law — send a traveller',
    // NOT STR_COMMON's `nextLv`: the thing ahead is the next GATE, and several
    // of them make up one level.
    nextGate: 'Next gate ▸',
    theLaw: "The gate's law",
    passed: 'THROUGH',
    barred: 'BARRED',
    sealCracks: 'A wax seal cracks.',
    gatesCleared: (n, m) => `${n} of ${m} gates cleared`,
    allGates: 'Every gate cleared',
    gateLost: 'The seals are broken',
    gateLostBody: 'Haris grins and bars the way.',

    // results — plain language, per consistency rule 13.2
    resAccuracy: 'Gates cleared',
    resProbes: 'Probes spent',
    resSharp: 'Probe sharpness',
    resSharpMeans: 'How much each test narrowed the field. Testing a traveller you expect to be REFUSED usually teaches more than one you expect to pass.',

    folkLabel: 'folk',
    moonsLabel: (n) => `${n} ${n === 1 ? 'moon' : 'moons'}`,
    shapeLabel: { round: 'round', boxy: 'boxy', pointy: 'pointy' },
    fillLabel: { plain: 'plain', striped: 'striped' },
  },
  ar: {
    ...STR_COMMON.ar,
    title: 'البوابة',
    menu: 'القائمة',

    gateOf: (n, m) => `البوابة ${n} من ${m}`,
    probesLeft: (n) => `بقي ${n} فحص`,
    seals: 'الأختام',
    lens: 'استخدم العدسة',
    lensSays: (words) => `تهمس العدسة: هذا القانون يتحدّث عن ${words}.`,
    lensSpent: 'نفدت العدسة',

    probeTitle: 'اختبر القانون',
    probeHint: 'اضغط على مسافر ليختمه الحارس. أنفق فحوصك حيث تتعلّم أكثر.',
    tribute: 'أرسل المسافر',
    tributeHint: 'واحد فقط من هؤلاء الثلاثة سيُسمح له بالعبور. اختر.',
    ledger: 'السجلّ',
    waiting: 'البوابة تنتظر',
    admitted: 'سُمح له',
    refused: 'رُفض',
    stampIn: 'دخل',
    stampOut: 'رُفض',

    ready: 'عرفت القانون — أرسل مسافراً',
    nextGate: 'البوابة التالية ◂',
    theLaw: 'قانون البوابة',
    passed: 'عبر',
    barred: 'مُنع',
    sealCracks: 'ينكسر ختم من الشمع.',
    gatesCleared: (n, m) => `${n} من ${m} بوابات`,
    allGates: 'كل البوابات عُبرت',
    gateLost: 'تحطّمت الأختام',
    gateLostBody: 'يبتسم الحارس ويسدّ الطريق.',

    resAccuracy: 'البوابات المجتازة',
    resProbes: 'الفحوص المُنفقة',
    resSharp: 'حدّة الفحص',
    resSharpMeans: 'كم ضيّق كل اختبار دائرة الاحتمالات. اختبار مسافر تتوقّع رفضه يعلّمك عادةً أكثر من اختبار من تتوقّع عبوره.',

    folkLabel: 'آل',
    moonsLabel: (n) => (n === 1 ? 'قمر واحد' : n === 2 ? 'قمران' : `${n} أقمار`),
    shapeLabel: { round: 'مستدير', boxy: 'مربّع', pointy: 'مدبّب' },
    fillLabel: { plain: 'بلا خطوط', striped: 'مخطّط' },
  },
};
