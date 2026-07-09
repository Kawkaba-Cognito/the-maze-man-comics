import { buildReport, L, locationResult, sceneLocations } from '../caseUtils';

export { L, buildReport, locationResult, sceneLocations };

/** Questions unlocked when player holds the needed clue and hasn't done this confrontation yet. */
export function getConfrontations(person, foundSet, doneSet) {
  return (person.questions || []).filter(
    (q) => q.needsClue && foundSet.has(q.needsClue) && !doneSet.has(`${person.id}:${q.id}`),
  );
}

/** All confrontations for a person (done or not) — for showing completed state. */
export function allConfrontations(person) {
  return (person.questions || []).filter((q) => q.needsClue);
}

export function proofCount(caseData) {
  const ev = caseData?.solution?.evidence;
  return Array.isArray(ev) ? ev.length : 1;
}

export function validateAccusation(caseData, culpritId, proofIds, requireProof) {
  const culpritOk = culpritId === caseData.solution.culprit;
  if (!requireProof) return { win: culpritOk, culpritOk, proofOk: true, partial: false };
  const needed = caseData.solution.evidence || [];
  const proofOk = needed.length === proofIds.length && needed.every((id) => proofIds.includes(id));
  const win = culpritOk && proofOk;
  const partial = culpritOk && !proofOk;
  return { win, culpritOk, proofOk, partial };
}

export function canAccuse(cfg, foundCount, confrontsDone) {
  if (!cfg.accuseGate) return { ok: true, reason: null };
  const needEv = cfg.accuseGateMinEvidence ?? 2;
  const needCf = cfg.accuseGateMinConfronts ?? 1;
  if (foundCount < needEv) {
    return { ok: false, reason: 'evidence', need: needEv, have: foundCount };
  }
  if (confrontsDone < needCf) {
    return { ok: false, reason: 'confront', need: needCf, have: confrontsDone };
  }
  return { ok: true, reason: null };
}

/** Suspects/witnesses with an unlocked confrontation using this clue. */
export function confrontTargets(caseData, clueId, foundSet, doneSet) {
  const people = [...caseData.suspects, ...(caseData.witnesses || [])];
  const out = [];
  people.forEach((p) => {
    (p.questions || []).forEach((q) => {
      if (q.needsClue === clueId && foundSet.has(clueId) && !doneSet.has(`${p.id}:${q.id}`)) {
        out.push({ person: p, question: q });
      }
    });
  });
  return out;
}

export function assistantLine(kind, assistant, isAr) {
  const name = assistant ? (isAr ? assistant.name?.ar : assistant.name?.en) : (isAr ? 'المساعد' : 'Assistant');
  const lines = {
    clue: {
      en: `${name} writes it in the notebook: "This could matter."`,
      ar: `${name} يدوّنه في الدفتر: «قد يكون هذا مهماً.»`,
    },
    confront: {
      en: `${name} whispers: "Their story just cracked."`,
      ar: `${name} تهمس: «روايتهم تشقّقت للتو.»`,
    },
  };
  return isAr ? lines[kind]?.ar : lines[kind]?.en;
}

export const PROTO_CSS = `
@keyframes dt-slide {0%{transform:translateY(12px);opacity:0}100%{transform:translateY(0);opacity:1}}
@keyframes dt-stamp {0%{transform:rotate(-8deg) scale(1.8);opacity:0}70%{transform:rotate(-8deg) scale(0.96);opacity:1}100%{transform:rotate(-8deg) scale(1);opacity:1}}
@keyframes dt-shake {0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}
@keyframes dt-fade {0%{opacity:0}100%{opacity:1}}
@keyframes dt-pin-pulse {0%,100%{box-shadow:2px 2px 0 rgba(26,18,8,0.2)}50%{box-shadow:0 0 0 3px rgba(185,132,47,0.45)}}
`;

export const PT = {
  en: {
    protoBanner: 'PROTOTYPE — not final · no points saved',
    caseFile: 'Case File', scene: 'Scene', people: 'People', notes: 'Notes',
    examine: 'Examine', review: 'Review', readStatement: 'Read statement', read: 'Read',
    confront: 'Confront', confronted: 'Done',
    evidence: 'Evidence', testimony: 'Testimony', emptyNote: 'Examine the scene to collect evidence.',
    accuse: 'Make accusation', accuseWho: 'Who did it?', accuseProof: 'Pick proof clue(s)',
    accuseSubWho: 'Choose the one person it must be.',
    accuseSubProof: 'Select the clue(s) that prove it.',
    confirmAccuse: 'Confirm accusation', keepInvestigating: 'Keep investigating',
    fullWin: 'Correct!', lost: 'Wrong', partial: 'Right suspect — wrong proof',
    partialSub: 'You named the right person, but your evidence does not prove it.',
    culpritWas: (n) => `The culprit: ${n}`, itWas: (n) => `It was ${n}`,
    chain: 'Why this person', epilogueHead: 'What happened next', caseClosed: 'CASE CLOSED',
    nextCase: 'Next case ›', backToProtos: 'Back to prototypes', menu: 'Menu',
    theSuspects: 'Persons of interest', withAssistant: (n) => `with ${n}`,
    introStamp: 'CASE FILE', start: 'Begin investigation',
    witnessTag: 'witness', suspectTag: 'suspect',
    close: 'Close', skip: 'Skip', next: 'Next ›', startInvestigation: 'Begin ›',
    panelOf: (n, t) => `Panel ${n} / ${t}`,
    feedbackTitle: 'How did this case feel?', feedbackSkip: 'Skip',
    feedbackTags: ['Too easy', 'Just right', 'Too hard', 'Fun', 'Confusing'],
    caseComplete: 'Case complete', allDone: 'Both pilot cases done!',
    allDoneSub: 'Compare the three Case File enhancements and pick your favourite.',
    pickClue: 'Use this clue', reaction: 'Reaction',
    locationOf: (n, t) => `${n} of ${t} locations checked`,
    sceneIntro: 'Tap each location. You can review evidence anytime.',
    peopleIntro: 'Read statements. Confront suspects when you have proof.',
    sceneListIntro: 'Examine each location in order. Review anytime.',
    board: 'Board', boardIntro: 'Mark who is still possible. Evidence you collected appears below.',
    cleared: 'Cleared', stillPossible: 'Still possible', evidenceOnBoard: 'Evidence on board',
    useOnSuspect: 'Use on suspect', pickSuspectForClue: 'Who do you confront with this clue?',
    accuseLocked: 'Keep investigating first',
    accuseNeedEvidence: (n) => `Need ${n} evidence from the scene`,
    accuseNeedConfront: (n) => `Need ${n} confrontation(s)`,
    proofChain: 'Your case', accuseChain: (n) => `You accuse ${n} because:`,
    proofPreviewStep: 'Review your case',
    mapView: 'Map', listView: 'List',
    sourceScene: 'Scene', sourceTestimony: 'Testimony',
    transcriptHead: 'Interrogation file', statementEntry: 'Statement', confrontEntry: 'Confrontation',
    examinedStamp: 'SEEN', fileClosing: 'CLOSING REPORT', yourProof: 'Your proof',
    openingHookSkip: 'Skip to case file',
    caughtSummary: 'Correct accusation', missedSummary: 'Wrong accusation',
    cracked: (n) => `Solved ${n}`, overTitle: 'Out of chances!', overSub: (n) => `${n} cases solved`,
    again: 'Play again', finish: 'Finish ›', pts: (p) => `+${p} 🪙`,
  },
  ar: {
    protoBanner: 'نموذج تجريبي — ليس نهائياً · لا نقاط',
    caseFile: 'ملف القضية', scene: 'المسرح', people: 'الأشخاص', notes: 'الملاحظات',
    examine: 'افحص', review: 'راجع', readStatement: 'اقرأ الإفادة', read: 'مقروء',
    confront: 'واجه', confronted: 'تم',
    evidence: 'أدلة', testimony: 'شهادات', emptyNote: 'افحص المسرح لجمع الأدلة.',
    accuse: 'وجّه الاتهام', accuseWho: 'من الفاعل؟', accuseProof: 'اختر دليل/أدلة الإثبات',
    accuseSubWho: 'اختر الشخص الوحيد الممكن.',
    accuseSubProof: 'اختر الدليل/الأدلة التي تثبت ذلك.',
    confirmAccuse: 'أكّد الاتهام', keepInvestigating: 'تابع التحقيق',
    fullWin: 'صحيح!', lost: 'خطأ', partial: 'مشتبه صحيح — إثبات خاطئ',
    partialSub: 'سمّيت الشخص الصحيح، لكن دليلك لا يثبت ذلك.',
    culpritWas: (n) => `الفاعل: ${n}`, itWas: (n) => `كان ${n}`,
    chain: 'لماذا هذا الشخص', epilogueHead: 'ماذا حدث بعد', caseClosed: 'القضية مُغلقة',
    nextCase: 'القضية التالية ›', backToProtos: 'عودة للنماذج', menu: 'القائمة',
    theSuspects: 'أشخاص محلّ الاهتمام', withAssistant: (n) => `مع ${n}`,
    introStamp: 'ملف القضية', start: 'ابدأ التحقيق',
    witnessTag: 'شاهد', suspectTag: 'مشتبه',
    close: 'إغلاق', skip: 'تخطّ', next: 'التالي ›', startInvestigation: 'ابدأ ›',
    panelOf: (n, t) => `لوحة ${n} / ${t}`,
    feedbackTitle: 'كيف كانت هذه القضية؟', feedbackSkip: 'تخطّ',
    feedbackTags: ['سهلة جداً', 'مناسبة', 'صعبة', 'ممتعة', 'مربكة'],
    caseComplete: 'القضية انتهت', allDone: 'انتهت القضيتان التجريبيتان!',
    allDoneSub: 'قارن تحسينات ملف القضية الثلاثة واختر المفضل.',
    pickClue: 'استخدم هذا الدليل', reaction: 'ردّ الفعل',
    locationOf: (n, t) => `${n} من ${t} مواقع`,
    sceneIntro: 'اضغط كل موقع. يمكنك مراجعة الأدلة في أي وقت.',
    peopleIntro: 'اقرأ الإفادات. واجه المشتبهين حين يكون لديك دليل.',
    sceneListIntro: 'افحص كل موقع. راجع في أي وقت.',
    board: 'اللوحة', boardIntro: 'حدّد من ما زال ممكناً. الأدلة التي جمعتها تظهر أدناه.',
    cleared: 'مُستبعد', stillPossible: 'ما زال ممكناً', evidenceOnBoard: 'أدلة على اللوحة',
    useOnSuspect: 'استخدم على مشتبه', pickSuspectForClue: 'من تواجه بهذا الدليل؟',
    accuseLocked: 'تابع التحقيق أولاً',
    accuseNeedEvidence: (n) => `تحتاج ${n} أدلة من المسرح`,
    accuseNeedConfront: (n) => `تحتاج ${n} مواجهة`,
    proofChain: 'قضيتك', accuseChain: (n) => `تتهم ${n} لأن:`,
    proofPreviewStep: 'راجع قضيتك',
    mapView: 'خريطة', listView: 'قائمة',
    sourceScene: 'المسرح', sourceTestimony: 'شهادة',
    transcriptHead: 'ملف الاستجواب', statementEntry: 'إفادة', confrontEntry: 'مواجهة',
    examinedStamp: 'فُحص', fileClosing: 'تقرير الإغلاق', yourProof: 'دليلك',
    openingHookSkip: 'تخطّ إلى ملف القضية',
    caughtSummary: 'اتهام صحيح', missedSummary: 'اتهام خاطئ',
    cracked: (n) => `محلولة ${n}`, overTitle: 'انتهت الفرص!', overSub: (n) => `حُلّت ${n} قضايا`,
    again: 'العب مجدداً', finish: 'إنهاء ›', pts: (p) => `+${p} 🪙`,
  },
};
