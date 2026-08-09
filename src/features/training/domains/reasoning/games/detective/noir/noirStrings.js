import { STR_COMMON } from '../../../../../shared/trainingStrings';

/*
 * Detective Kawkab · noir Survival — UI labels.
 * STR_COMMON is spread first, per the platform convention: anything set after
 * the spread is a deliberate override for this game.
 */
export const NS = {
  en: {
    ...STR_COMMON.en,

    // phases
    phaseScene: 'THE SCENE',
    phaseSuspects: 'THE SUSPECTS',
    phaseBoard: 'THE ACCUSATION',
    phaseClosed: 'CASE CLOSED',

    // scene
    instinct: '◉ Instinct',
    instinctCount: (n) => `◉ Instinct · ${n}`,
    notebook: '▤ Notebook',
    toSuspects: 'Question the suspects →',
    backToScene: '← Back to the scene',
    allCluesFound: 'The room has told me everything it knows. Now for the people.',
    clueProgress: (n, total) => `${n}/${total} evidence secured`,

    // Authored level conditions, shown on the case dossier.
    assignment: 'ASSIGNMENT CONDITIONS',
    missionRules: (errors, instincts) => `Close the case with no more than ${errors} errors · ${instincts} instinct charge${instincts === 1 ? '' : 's'}`,
    errorBudget: (used, max) => `Errors ${used}/${max}`,

    // suspects
    suspectsSub: 'PICK A FACE. MAKE THEM TALK.',
    hallway: '← Line-up',
    gather: 'Gather them →',
    truthOut: '✓ TRUTH EXTRACTED',
    lieLeft: (n) => `${n} LIE REMAINING`,
    liesLeft: (n) => `${n} LIES REMAINING`,
    theLie: 'THE LIE',
    theLies: 'THE LIES',
    pressLie: '⚡ Press the lie',
    needProof: '🔒 Missing proof',
    noProofYet: 'You can feel the crack in their story — but you do not hold the proof yet. Keep looking.',

    // evidence
    presentEv: 'PRESENT EVIDENCE',
    chooseBreak: 'Choose what breaks the lie.',
    neverMind: 'Never mind',
    acquired: 'EVIDENCE ACQUIRED',
    contradiction: 'CONTRADICTION!',

    // notebook
    nbTitle: 'CASE NOTEBOOK',
    tabEvidence: 'EVIDENCE',
    tabStatements: 'STATEMENTS',
    notFound: 'Not yet found.',
    noStatement: 'No statement yet.',
    progress: (c, ct, l, lt, e) => `CLUES ${c}/${ct} · TRUTHS ${l}/${lt} · ERRORS ${e}`,

    // board
    boardSub: 'PIN IT DOWN, DETECTIVE.',
    qWho: '1 · WHO DID IT?',
    qHow: '2 · HOW?',
    qWhy: '3 · WHY?',
    qProof: '4 · THE PROOF THAT BREAKS THEM',
    accuse: '⚖ Make the accusation',

    // wrong accusation
    chiefFraming: 'Dr Kawkab reads the file back to himself, slowly, the way he does when something does not sit right.',
    faultWho: (name) => `This does not point at ${name}. You know it. I know it. Even the rain knows it.`,
    faultHow: 'Right building, wrong method. How was it actually done?',
    faultWhy: 'A case without a motive is a sentence without a verb. Why?',
    faultProof: 'That proves a thing or two — but not this. What evidence puts it in their hands alone?',
    warrantTitle: 'THE CASE DOES NOT CLOSE',
    warrantBody: 'Somewhere out there the truth is still standing in the rain, waiting. Go back. Look again.',
    backToBoard: 'Return to the board',

    // verdict
    solved: 'CASE CLOSED',
    rankMaster: 'MASTER DETECTIVE',
    rankMasterD: 'Not one wrong step. Dr Kawkab will deny — publicly — that he ever doubted you.',
    rankSharp: 'SHARP EYE',
    rankSharpD: 'The city sleeps a little safer tonight.',
    rankGood: 'GOOD INSTINCT',
    rankGoodD: 'You bent the logic once or twice. Justice did not notice.',
    rankBarely: 'CLOSED… BARELY',
    rankBarelyD: 'The truth survived your methods. Nobody mention the paperwork.',
    statLine: (c, l, e, t) => `CLUES ${c} · TRUTHS ${l} · ERRORS ${e} · TIME ${t}`,
    nextCase: 'Next case →',

    // survival run
    runOver: 'OUT OF LEADS',
    runOverSub: (n) => `${n} case${n === 1 ? '' : 's'} closed`,
    caseNo: (n) => `CASE ${n}`,
    cracked: (n) => `${n} closed`,
    loading: 'Opening the file…',
    modelsFailed: 'Could not load the illustrated line-up — the case continues without it.',
  },

  ar: {
    ...STR_COMMON.ar,

    phaseScene: 'مسرح الجريمة',
    phaseSuspects: 'المشتبه بهم',
    phaseBoard: 'الاتّهام',
    phaseClosed: 'أُغلقت القضيّة',

    instinct: '◉ الحدس',
    instinctCount: (n) => `◉ الحدس · ${arNum(n)}`,
    notebook: '▤ المفكرة',
    toSuspects: '← استجوب المشتبه بهم',
    backToScene: '→ عُد إلى المسرح',
    allCluesFound: 'أخبرتني الغرفة بكلّ ما تعرفه. الآن إلى الناس.',
    clueProgress: (n, total) => `${arNum(n)}/${arNum(total)} أدلّة مؤمّنة`,

    assignment: 'شروط المهمّة',
    missionRules: (errors, instincts) => `أغلق القضيّة بما لا يزيد عن ${arNum(errors)} أخطاء · ${arNum(instincts)} شحنات حدس`,
    errorBudget: (used, max) => `الأخطاء ${arNum(used)}/${arNum(max)}`,

    suspectsSub: 'اختر وجهًا. اجعله يتكلّم.',
    hallway: '→ الصفّ',
    gather: '← اجمعهم',
    truthOut: '✓ استُخرجت الحقيقة',
    lieLeft: () => 'تبقّت كذبة واحدة',
    liesLeft: (n) => (n === 2 ? 'تبقّت كذبتان' : `تبقّت ${arNum(n)} كذبات`),
    theLie: 'الكذبة',
    theLies: 'الكذبات',
    pressLie: '⚡ اكشف الكذبة',
    needProof: '🔒 ينقصك الدليل',
    noProofYet: 'تشعر بالصدع في روايتهم — لكنّك لا تملك الدليل بعد. واصل البحث.',

    presentEv: 'قدّم الدليل',
    chooseBreak: 'اختر ما ينقض الكذبة.',
    neverMind: 'لا يهمّ',
    acquired: 'تمّ الحصول على دليل',
    contradiction: 'تناقض!',

    nbTitle: 'مفكرة القضيّة',
    tabEvidence: 'الأدلّة',
    tabStatements: 'الأقوال',
    notFound: 'لم يُعثر عليه بعد.',
    noStatement: 'لا أقوال بعد.',
    progress: (c, ct, l, lt, e) => `الأدلّة ${arNum(c)}/${arNum(ct)} · الحقائق ${arNum(l)}/${arNum(lt)} · الأخطاء ${arNum(e)}`,

    boardSub: 'ثبّتها أيّها المحقّق.',
    qWho: '١ · من الفاعل؟',
    qHow: '٢ · كيف؟',
    qWhy: '٣ · لماذا؟',
    qProof: '٤ · الدليل الذي يدينه',
    accuse: '⚖ وجّه الاتّهام',

    chiefFraming: 'يعيد الدكتور كوكب قراءة الملفّ على نفسه، ببطء، كما يفعل حين لا يستقيم شيء ما.',
    faultWho: (name) => `هذا لا يشير إلى ${name}. أنت تعرف. وأنا أعرف. حتّى المطر يعرف.`,
    faultHow: 'المبنى الصحيح، والوسيلة الخطأ. كيف جرى الأمر فعلًا؟',
    faultWhy: 'قضيّة بلا دافع جملة بلا فعل. لماذا؟',
    faultProof: 'هذا يثبت شيئًا أو شيئين — لكن ليس هذا. أيّ دليل يضعه في يديه وحده؟',
    warrantTitle: 'القضيّة لا تُغلق',
    warrantBody: 'في مكان ما، ما زالت الحقيقة واقفة تحت المطر تنتظر. عُد. انظر مرّة أخرى.',
    backToBoard: 'عُد إلى اللوحة',

    solved: 'أُغلقت القضيّة',
    rankMaster: 'محقّق عبقريّ',
    rankMasterD: 'ولا خطوة خاطئة. سينكر الدكتور كوكب — علنًا — أنّه شكّ فيك يومًا.',
    rankSharp: 'عين حادّة',
    rankSharpD: 'تنام المدينة الليلة بأمان أكثر قليلًا.',
    rankGood: 'حدس جيّد',
    rankGoodD: 'لويت المنطق مرّة أو مرّتين. والعدالة لم تلاحظ.',
    rankBarely: 'أُغلقت… بالكاد',
    rankBarelyD: 'نجت الحقيقة من أساليبك. ولا يذكر أحد الأوراق الرسميّة.',
    statLine: (c, l, e, t) => `الأدلّة ${arNum(c)} · الحقائق ${arNum(l)} · الأخطاء ${arNum(e)} · الوقت ${t}`,
    nextCase: '← القضيّة التالية',

    runOver: 'لا خيوط',
    runOverSub: (n) => `${arNum(n)} قضيّة مغلقة`,
    caseNo: (n) => `القضيّة ${arNum(n)}`,
    cracked: (n) => `${arNum(n)} مغلقة`,
    loading: 'يُفتح الملفّ…',
    modelsFailed: 'تعذّر تحميل صفّ الشخصيات المرسوم — تستمرّ القضيّة من دونه.',
  },
};

/** Arabic-Indic digits, matching the convention used across this domain. */
export function arNum(n) {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
}

export const pickStrings = (isAr) => NS[isAr ? 'ar' : 'en'];

/** "n lies remaining", with Arabic's dual/plural handled properly. */
export function liesRemaining(t, n, isAr) {
  if (n === 1) return t.lieLeft(isAr ? undefined : 1);
  return t.liesLeft(n);
}

/** m:ss, in the digits the current language uses. */
export function formatTime(ms, isAr) {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return isAr ? `${arNum(m)} د ${arNum(r)} ث` : `${m}m ${r}s`;
}
